"""Loopback Workbench Host: fixed upstream; read-only API proxy; static asset server."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import http.client
import json
import mimetypes
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
READ_ROUTES = re.compile(r'^/(?:stats|state|healthz|verify|compliance/status|telemetry/health|security/events(?:/counts)?|fontes|atributos|cases|content|sentinel/(?:status|dashboard|incidents|actions)|sentinel/incidents/[a-zA-Z0-9_-]+(?:/(?:evidence|why))?|sentinel/actions/[a-zA-Z0-9_-]+|cases/[a-zA-Z0-9_-]+)$')
MAX_RESPONSE = 8 * 1024 * 1024

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send_body(self, status, body, content_type='application/json; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:7475 http://localhost:7475; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)

    def error(self, status, message):
        self.send_body(status, json.dumps({'error': message}).encode())

    def do_GET(self):
        if self.headers.get('Host') not in {'localhost:9337', '127.0.0.1:9337'}:
            return self.error(403, 'Host não autorizado')
        if len(self.path) > 4096:
            return self.error(414, 'Consulta demasiado longa')
        parsed = urlsplit(self.path)

        # Servir arquivos estáticos (index.html, css/*, js/*)
        if not parsed.path.startswith('/api/'):
            rel_path = parsed.path.lstrip('/')
            # Only public UI assets, never repository metadata, env or Python.
            public_asset = re.fullmatch(r'(?:css/[A-Za-z0-9_/-]+\.css|js/[A-Za-z0-9_/-]+\.js)', rel_path)
            if rel_path not in ('', 'index.html', 'workbench.html', 'soc.html') and not public_asset:
                return self.error(404, 'Recurso indisponível')
            if not rel_path or rel_path == 'index.html':
                file_path = ROOT / 'index.html'
            else:
                file_path = (ROOT / rel_path).resolve()
            
            # Trava de segurança para impedir Directory Traversal
            if ROOT in file_path.parents or file_path == ROOT / 'index.html':
                if file_path.is_file():
                    mime, _ = mimetypes.guess_type(str(file_path))
                    if file_path.suffix == '.js':
                        mime = 'application/javascript; charset=utf-8'
                    elif file_path.suffix == '.css':
                        mime = 'text/css; charset=utf-8'
                    elif file_path.suffix == '.html':
                        mime = 'text/html; charset=utf-8'
                    return self.send_body(200, file_path.read_bytes(), mime or 'application/octet-stream')

            return self.error(404, 'Recurso indisponível')

        # Proxy de API REST para HeraclitusDB local
        route = parsed.path[4:]
        if not READ_ROUTES.fullmatch(route):
            return self.error(403, 'Rota fora do escopo de leitura')
        auth = self.headers.get('Authorization', '')
        if not auth.startswith(('Basic ', 'Bearer ')) or len(auth) > 2048:
            return self.error(401, 'Autenticação necessária')
        connection = http.client.HTTPConnection('127.0.0.1', 7475, timeout=60 if route == '/verify' else 15)
        try:
            target = route + ('?' + parsed.query if parsed.query else '')
            connection.request('GET', target, headers={'Authorization': auth, 'Accept': 'application/json'})
            response = connection.getresponse()
            body = response.read(MAX_RESPONSE + 1)
            if len(body) > MAX_RESPONSE:
                return self.error(502, 'Resposta excedeu 8 MiB; refine os filtros')
            self.send_body(response.status, body, response.getheader('Content-Type', 'application/json'))
        except (OSError, http.client.HTTPException):
            self.error(502, 'HeraclitusDB indisponível ou timeout; nenhum dado foi substituído')
        finally:
            connection.close()

    def do_POST(self):
        self.error(405, 'Painel de leitura; alterações operacionais não habilitadas')

if __name__ == '__main__':
    print("Heraclitus Temporal Reconstruction Workbench executando em http://127.0.0.1:9337")
    ThreadingHTTPServer(('127.0.0.1', 9337), Handler).serve_forever()
