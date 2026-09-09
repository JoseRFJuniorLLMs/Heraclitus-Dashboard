import importlib.util
import http.client
from pathlib import Path
import threading
import unittest

spec = importlib.util.spec_from_file_location('dashboard', Path(__file__).resolve().parents[1] / 'server.py')
dashboard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dashboard)

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = dashboard.ThreadingHTTPServer(('127.0.0.1', 0), dashboard.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path, host='127.0.0.1:9337', method='GET'):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        try:
            connection.request(method, path, headers={'Host':host})
            response = connection.getresponse()
            body = response.read()
            return response.status, body, dict(response.getheaders())
        finally:
            connection.close()

    def test_public_assets(self):
        for path in ['/', '/css/styles.css', '/js/app.js', '/js/components/Header.js']:
            self.assertEqual(self.request(path)[0], 200, path)

    def test_private_files_never_served(self):
        for path in ['/.git/config', '/server.py', '/README.md', '/env/pyvenv.cfg', '/js/../server.py', '/js/%2e%2e/server.py', '/tests/smoke.py']:
            self.assertEqual(self.request(path)[0], 404, path)

    def test_auth_required(self):
        self.assertEqual(self.request('/api/stats')[0], 401)

    def test_host_restricted(self):
        self.assertEqual(self.request('/', host='evil.example:9337')[0], 403)

    def test_write_and_unsafe_proxy_rejected(self):
        self.assertEqual(self.request('/api/stats', method='POST')[0], 405)
        self.assertEqual(self.request('/api/replay')[0], 403)

    def test_security_headers(self):
        headers = self.request('/')[2]
        self.assertEqual(headers['X-Frame-Options'], 'DENY')
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')

if __name__ == '__main__':
    unittest.main()
