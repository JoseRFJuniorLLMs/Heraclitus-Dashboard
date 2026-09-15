import importlib.util
import http.client
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import unittest

spec=importlib.util.spec_from_file_location('dashboard',Path(__file__).resolve().parents[1]/'server.py')
dashboard=importlib.util.module_from_spec(spec);spec.loader.exec_module(dashboard)

class CaptureHandler(BaseHTTPRequestHandler):
    auth=None;path_seen=None
    def log_message(self,*_): pass
    def do_GET(self):
        type(self).auth=self.headers.get('Authorization');type(self).path_seen=self.path
        body=b'{}';self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=dashboard.ThreadingHTTPServer(('127.0.0.1',0),dashboard.Handler);cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls): cls.server.shutdown();cls.server.server_close();cls.thread.join()
    def request(self,path,host='127.0.0.1:9337',method='GET',headers=None):
        c=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=3)
        try:
            h={'Host':host};h.update(headers or {});c.request(method,path,headers=h);r=c.getresponse();return r.status,r.read(),dict(r.getheaders())
        finally:c.close()
    def stub(self):
        CaptureHandler.auth=None;CaptureHandler.path_seen=None;s=ThreadingHTTPServer(('127.0.0.1',0),CaptureHandler);t=threading.Thread(target=s.serve_forever,daemon=True);t.start();return s,t

    def test_public_assets(self):
        for p in ['/','/css/r9.css','/js/app.js','/js/useCases.js','/js/components/Cases.js','/js/components/LabraAguCase.js','/js/components/AebStreamCase.js','/js/components/CgeeCase.js','/js/components/TimeMachine.js']:
            self.assertEqual(self.request(p)[0],200,p)
    def test_private_files_never_served(self):
        for p in ['/.git/config','/server.py','/README.md','/.env','/tests/test_server.py','/js/../server.py']: self.assertEqual(self.request(p)[0],404,p)
    def test_host_restricted(self): self.assertEqual(self.request('/',host='evil.example:9337')[0],403)
    def test_dashboard_release_and_case_runtimes(self):
        status,body,headers=self.request('/dashboard-api/status');self.assertEqual(status,200);d=json.loads(body);self.assertEqual(d['release'],'2026.09.15-r10');self.assertTrue(d['read_only']);self.assertIn(d['core_auth_mode'],{'server_env','browser_memory'});self.assertEqual(d['labra_runtime']['port'],dashboard.LABRA_PORT);self.assertEqual(d['aeb_runtime']['port'],dashboard.AEB_PORT);self.assertEqual(d['cgee_runtime']['port'],dashboard.CGEE_PORT);self.assertEqual(headers['X-Heraclitus-Dashboard-Release'],dashboard.RELEASE)
    def test_core_server_auth(self):
        stub,thread=self.stub();old=(dashboard.CORE_HOST,dashboard.CORE_PORT,dashboard.CORE_AUTH_HEADER)
        try:
            dashboard.CORE_HOST='127.0.0.1';dashboard.CORE_PORT=stub.server_port;dashboard.CORE_AUTH_HEADER='Basic dGVzdDp0ZXN0';self.assertEqual(self.request('/api/stats')[0],200);self.assertEqual(CaptureHandler.auth,'Basic dGVzdDp0ZXN0')
        finally:
            dashboard.CORE_HOST,dashboard.CORE_PORT,dashboard.CORE_AUTH_HEADER=old;stub.shutdown();stub.server_close();thread.join()
    def _assert_isolated_proxy(self,prefix,host_attr,port_attr,path,expected):
        stub,thread=self.stub();old_h=getattr(dashboard,host_attr);old_p=getattr(dashboard,port_attr);old_auth=dashboard.CORE_AUTH_HEADER
        try:
            setattr(dashboard,host_attr,'127.0.0.1');setattr(dashboard,port_attr,stub.server_port);dashboard.CORE_AUTH_HEADER='Basic c2Vuc2l0aXZlOmNvcmU=';self.assertEqual(self.request(prefix+path)[0],200);self.assertEqual(CaptureHandler.path_seen,expected);self.assertIsNone(CaptureHandler.auth)
        finally:
            setattr(dashboard,host_attr,old_h);setattr(dashboard,port_attr,old_p);dashboard.CORE_AUTH_HEADER=old_auth;stub.shutdown();stub.server_close();thread.join()
    def test_agent_core_credential_isolation(self): self._assert_isolated_proxy('/agent-api','AGENT_HOST','AGENT_PORT','/api/v1/agent/status','/api/v1/agent/status')
    def test_labra_proxy_isolation(self): self._assert_isolated_proxy('/labra-api','LABRA_HOST','LABRA_PORT','/health','/health');self.assertEqual(self.request('/labra-api/investigar')[0],403)
    def test_aeb_proxy_isolation(self): self._assert_isolated_proxy('/aeb-api','AEB_HOST','AEB_PORT','/data','/api/data');self.assertEqual(self.request('/aeb-api/assets/globe.gl.min.js')[0],403)
    def test_cgee_proxy_limits_and_isolation(self):
        self._assert_isolated_proxy('/cgee-api','CGEE_HOST','CGEE_PORT','/timeline?limit=5000','/api/timeline?limit=5000');self.assertEqual(self.request('/cgee-api/timeline?limit=5001')[0],400);self.assertEqual(self.request('/cgee-api/why')[0],400);self.assertEqual(self.request('/cgee-api/anything')[0],403)
    def test_general_host_is_read_only(self):
        for p in ['/api/stats','/labra-api/health','/aeb-api/data','/cgee-api/stats']: self.assertEqual(self.request(p,method='POST')[0],405,p)
    def test_security_headers_allow_only_local_case_frames(self):
        headers=self.request('/')[2];csp=headers['Content-Security-Policy'];self.assertEqual(headers['X-Frame-Options'],'DENY');self.assertIn("frame-ancestors 'none'",csp);self.assertIn('frame-src ',csp);self.assertIn(f'http://127.0.0.1:{dashboard.LABRA_PORT}',csp);self.assertIn(f'http://127.0.0.1:{dashboard.AEB_PORT}',csp);self.assertIn(f'http://127.0.0.1:{dashboard.CGEE_PORT}',csp);self.assertNotIn('frame-src *',csp)

if __name__=='__main__': unittest.main()
