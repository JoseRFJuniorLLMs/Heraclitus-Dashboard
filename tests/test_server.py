import importlib.util
import http.client
import json
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
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join()

    def request(self, path, host='127.0.0.1:9337', method='GET', headers=None):
        c = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        try:
            h={'Host':host}; h.update(headers or {})
            c.request(method, path, headers=h)
            r=c.getresponse(); body=r.read(); return r.status, body, dict(r.getheaders())
        finally: c.close()

    def test_public_assets(self):
        for path in ['/', '/css/platform.css', '/js/app.js', '/js/components/AgentBlackBox.js', '/js/components/Capabilities.js']:
            self.assertEqual(self.request(path)[0], 200, path)

    def test_private_files_never_served(self):
        for path in ['/.git/config','/server.py','/README.md','/.env','/tests/test_server.py','/js/../server.py']:
            self.assertEqual(self.request(path)[0], 404, path)

    def test_host_restricted(self):
        self.assertEqual(self.request('/', host='evil.example:9337')[0], 403)

    def test_dashboard_release_is_observable(self):
        status, body, headers = self.request('/dashboard-api/status')
        self.assertEqual(status, 200)
        payload = json.loads(body)
        self.assertEqual(payload['product'], 'HeraclitusDB Platform Console')
        self.assertEqual(payload['release'], dashboard.RELEASE)
        self.assertTrue(payload['read_only'])
        self.assertEqual(headers['X-Heraclitus-Dashboard-Release'], dashboard.RELEASE)
        self.assertEqual(self.request('/')[2]['X-Heraclitus-Dashboard-Release'], dashboard.RELEASE)

    def test_core_routes_are_read_only_and_allow_real_dashboard_contract(self):
        for path in ['/api/stats','/api/diff','/api/replay','/api/verify/12','/api/titular/test','/api/cases','/api/live/events']:
            self.assertEqual(self.request(path)[0], 401, path)
        self.assertEqual(self.request('/api/hvm/upsert')[0], 403)
        self.assertEqual(self.request('/api/stats', method='POST')[0], 405)

    def test_agent_read_routes_are_allowed_but_writes_denied(self):
        self.assertIn(self.request('/agent-api/api/v1/agent/status')[0], {404, 502})
        self.assertIn(self.request('/agent-api/api/v1/agent/runs')[0], {404, 502})
        self.assertEqual(self.request('/agent-api/api/v1/agent/status', method='POST')[0], 405)

    def test_public_data_status_and_portal_key_boundary(self):
        status, body, _ = self.request('/public-api/status')
        self.assertEqual(status, 200)
        payload=json.loads(body)
        self.assertIn('portal_transparencia', payload); self.assertIn('pncp', payload); self.assertIn('provenance_rule', payload)
        self.assertFalse(payload['portal_transparencia']['upstream_checked'])
        self.assertFalse(payload['pncp']['upstream_checked'])
        self.assertTrue(payload['pncp']['proxy_enabled'])
        if not dashboard.PORTAL_API_KEY:
            self.assertEqual(self.request('/public-api/portal/contratos?pagina=1')[0], 503)
        self.assertEqual(self.request('/public-api/portal/anything-goes')[0], 403)

    def test_security_headers(self):
        headers=self.request('/')[2]
        self.assertEqual(headers['X-Frame-Options'],'DENY')
        self.assertEqual(headers['X-Content-Type-Options'],'nosniff')
        self.assertEqual(headers['X-Heraclitus-Dashboard-Release'], dashboard.RELEASE)
        self.assertNotIn("script-src 'self' 'unsafe-inline'", headers['Content-Security-Policy'])
        self.assertIn("connect-src 'self'", headers['Content-Security-Policy'])

if __name__ == '__main__': unittest.main()
