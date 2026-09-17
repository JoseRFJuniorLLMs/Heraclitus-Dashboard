"""HeraclitusDB Platform Dashboard local host.

Read-only host for the HeraclitusDB Core plus isolated local use-case runtimes.
The general dashboard never forwards Core credentials to Agent, LABRA, AEB,
CGEE or public-data upstreams. Case iframes point directly to loopback runtimes
so the original project UIs remain separate origins and preserve their behavior.
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import base64
import http.client
import json
import mimetypes
import os
import re
from urllib.parse import parse_qs, urlencode, urlsplit

ROOT = Path(__file__).resolve().parent
RELEASE = "2026.09.15-r10"
MAX_RESPONSE = 8 * 1024 * 1024
MAX_PATH = 4096

_env_path = ROOT / ".env"
if _env_path.is_file():
    try:
        for _raw_line in _env_path.read_text(encoding="utf-8").splitlines():
            _line = _raw_line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _k, _v = _line.split("=", 1)
            _k, _v = _k.strip(), _v.strip().strip("'\"")
            if _k and _k not in os.environ:
                os.environ[_k] = _v
    except Exception:
        pass

CORE_HOST = os.getenv("HERACLITUS_REST_HOST", "127.0.0.1")
CORE_PORT = int(os.getenv("HERACLITUS_REST_PORT", "7475"))
CORE_USERNAME = os.getenv("HERACLITUS_REST_USERNAME", "").strip()
CORE_PASSWORD = os.getenv("HERACLITUS_REST_PASSWORD", "")
AGENT_HOST = os.getenv("HERACLITUS_AGENT_HOST", "127.0.0.1")
AGENT_PORT = int(os.getenv("HERACLITUS_AGENT_PORT", "8080"))
LABRA_HOST = os.getenv("LABRA_HOST", "127.0.0.1")
LABRA_PORT = int(os.getenv("LABRA_PORT", "8770"))
AEB_HOST = os.getenv("AEB_HOST", "127.0.0.1")
AEB_PORT = int(os.getenv("AEB_PORT", "7480"))
CGEE_HOST = os.getenv("CGEE_HOST", "127.0.0.1")
CGEE_PORT = int(os.getenv("CGEE_PORT", "8000"))
DASHBOARD_BIND = os.getenv("HERACLITUS_DASHBOARD_BIND", "127.0.0.1")
DASHBOARD_PORT = int(os.getenv("HERACLITUS_DASHBOARD_PORT", "9337"))
PORTAL_API_KEY = os.getenv("PORTAL_TRANSPARENCIA_API_KEY", "").strip()

_default_hosts = f"localhost:{DASHBOARD_PORT},127.0.0.1:{DASHBOARD_PORT},[::1]:{DASHBOARD_PORT}"
ALLOWED_HOSTS = {h.strip() for h in os.getenv("HERACLITUS_DASHBOARD_ALLOWED_HOSTS", _default_hosts).split(",") if h.strip()}

if bool(CORE_USERNAME) != bool(CORE_PASSWORD):
    raise RuntimeError("Configure HERACLITUS_REST_USERNAME e HERACLITUS_REST_PASSWORD juntos")
if ":" in CORE_USERNAME:
    raise RuntimeError("HERACLITUS_REST_USERNAME não pode conter ':' em autenticação Basic")
CORE_AUTH_HEADER = None
if CORE_USERNAME and CORE_PASSWORD:
    token = base64.b64encode(f"{CORE_USERNAME}:{CORE_PASSWORD}".encode("utf-8")).decode("ascii")
    CORE_AUTH_HEADER = f"Basic {token}"

CORE_READ_ROUTES = re.compile(
    r"^/(?:"
    r"healthz|stats|state|metrics|verify(?:/[0-9]+)?|compliance/status|telemetry/health|live/events|"
    r"security/events(?:/counts)?|fontes(?:/[A-Za-z0-9_.:-]+)?|atributos|diff|replay|"
    r"titular/[A-Za-z0-9_.:@-]+(?:/acessos)?|cases(?:/[A-Za-z0-9_-]+)?|content|"
    r"sentinel/(?:status|dashboard|incidents|actions)|"
    r"sentinel/incidents/[A-Za-z0-9_-]+(?:/(?:evidence|why))?|"
    r"sentinel/actions/[A-Za-z0-9_-]+|tier/(?:sealed|receipts)"
    r")$"
)
AGENT_READ_ROUTES = re.compile(
    r"^/(?:metrics|api/v1/agent/(?:status|runs(?:/[A-Za-z0-9_.:-]+(?:/timeline)?)?|tool-calls|"
    r"evidence/[A-Za-z0-9_.:-]+(?:/proof)?|red-team/events|policies(?:/[A-Za-z0-9_.:-]+)?|approvals(?:/[A-Za-z0-9_.:-]+)?))$"
)
LABRA_READ_ROUTES = re.compile(r"^/(?:health|devedores)$")
AEB_READ_ROUTES = re.compile(r"^/api/data$")
CGEE_READ_ROUTES = re.compile(r"^/api/(?:stats|timeline|verify|why)$")
PORTAL_DATASETS = {
    "orgaos-siafi":"orgaos-siafi","contratos":"contratos","licitacoes":"licitacoes","ceis":"ceis",
    "cnep":"cnep","cepim":"cepim","emendas":"emendas","servidores":"servidores","viagens":"viagens",
    "despesas-documentos":"despesas/documentos","notas-fiscais":"notas-fiscais","pessoa-juridica":"pessoa-juridica",
    "acordos-leniencia":"acordos-leniencia","ceaf":"ceaf","cartoes":"cartoes",
}
PNCP_RESOURCES = {"contratacoes-publicacao":"/api/consulta/v1/contratacoes/publicacao","tipos-contratos":"/api/pncp/v1/tipos-contratos"}
PUBLIC_ASSET = re.compile(r"(?:css/[A-Za-z0-9_./-]+\.css|js/[A-Za-z0-9_./-]+\.js)")
SAFE_QUERY = re.compile(r"^[A-Za-z0-9_.%=&+,:/@()\-]*$")

def _json_bytes(value)->bytes:
    return json.dumps(value,ensure_ascii=False,separators=(",",":")).encode("utf-8")

def _valid_query(query:str)->bool:
    return len(query)<=MAX_PATH and (not query or bool(SAFE_QUERY.fullmatch(query)))

def _cgee_target(route:str,query:str)->str|None:
    if route in {"/api/stats","/api/verify"}:
        return route if not query else None
    params=parse_qs(query,keep_blank_values=True)
    if route=="/api/timeline":
        if set(params)-{"limit"}: return None
        raw=params.get("limit",["2000"])[0]
        if not raw.isdigit(): return None
        limit=int(raw)
        if not 1<=limit<=5000: return None
        return f"{route}?{urlencode({'limit':limit})}"
    if route=="/api/why":
        if set(params)!={"portaria"} or len(params.get("portaria",[]))!=1: return None
        portaria=params["portaria"][0].strip()
        if not portaria or len(portaria)>160: return None
        return f"{route}?{urlencode({'portaria':portaria})}"
    return None

class Handler(BaseHTTPRequestHandler):
    server_version="HeraclitusDashboard/10"
    def log_message(self,*_): pass
    def _security_headers(self):
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Heraclitus-Dashboard-Release",RELEASE)
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("X-Frame-Options","DENY")
        self.send_header("Referrer-Policy","no-referrer")
        self.send_header("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=()")
        frames=" ".join([
            f"http://127.0.0.1:{LABRA_PORT}",f"http://localhost:{LABRA_PORT}",
            f"http://127.0.0.1:{AEB_PORT}",f"http://localhost:{AEB_PORT}",
            f"http://127.0.0.1:{CGEE_PORT}",f"http://localhost:{CGEE_PORT}",
        ])
        self.send_header("Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self'; img-src 'self' data:; frame-src "+frames+"; "
            "frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
    def send_body(self,status:int,body:bytes,content_type="application/json; charset=utf-8"):
        self.send_response(status);self.send_header("Content-Type",content_type);self.send_header("Content-Length",str(len(body)));self._security_headers();self.end_headers();self.wfile.write(body)
    def error(self,status:int,message:str,*,code:str|None=None):
        self.send_body(status,_json_bytes({"error":code or "DASHBOARD_ERROR","message":message}))
    def do_OPTIONS(self):
        self.send_response(204);self.send_header("Allow","GET, OPTIONS");self._security_headers();self.end_headers()
    def _host_ok(self)->bool: return self.headers.get("Host","") in ALLOWED_HOSTS
    def _serve_static(self,path:str):
        rel=path.lstrip("/")
        file_path=ROOT/"index.html" if rel in("","index.html") else (ROOT/rel).resolve() if PUBLIC_ASSET.fullmatch(rel) else None
        if file_path is None or (file_path!=ROOT/"index.html" and ROOT not in file_path.parents) or not file_path.is_file(): return self.error(404,"Recurso indisponível")
        mime,_=mimetypes.guess_type(str(file_path))
        if file_path.suffix==".js": mime="application/javascript; charset=utf-8"
        elif file_path.suffix==".css": mime="text/css; charset=utf-8"
        elif file_path.suffix==".html": mime="text/html; charset=utf-8"
        return self.send_body(200,file_path.read_bytes(),mime or "application/octet-stream")
    def _auth_headers(self,require_auth=False,*,core_fallback=False):
        auth=self.headers.get("Authorization","")
        if not auth and core_fallback and CORE_AUTH_HEADER: auth=CORE_AUTH_HEADER
        if require_auth and (not auth.startswith(("Basic ","Bearer ")) or len(auth)>8192): return None
        headers={"Accept":"application/json","User-Agent":"Heraclitus-Dashboard/10"}
        if auth and len(auth)<=8192: headers["Authorization"]=auth
        return headers
    def _proxy(self,host:str,port:int,target:str,*,https=False,require_auth=False,core_fallback=False,extra_headers=None,timeout=15,forward_browser_auth=True):
        headers=self._auth_headers(require_auth,core_fallback=core_fallback) if forward_browser_auth else {"Accept":"application/json","User-Agent":"Heraclitus-Dashboard/10"}
        if headers is None: return self.error(401,"Autenticação HeraclitusDB necessária",code="AUTH_REQUIRED")
        if extra_headers: headers.update(extra_headers)
        connection=(http.client.HTTPSConnection if https else http.client.HTTPConnection)(host,port,timeout=timeout)
        try:
            connection.request("GET",target,headers=headers);response=connection.getresponse();body=response.read(MAX_RESPONSE+1)
            if len(body)>MAX_RESPONSE: return self.error(502,"Resposta excedeu 8 MiB; refine os filtros",code="RESPONSE_TOO_LARGE")
            return self.send_body(response.status,body,response.getheader("Content-Type","application/json; charset=utf-8"))
        except (OSError,http.client.HTTPException,TimeoutError): return self.error(502,"Fonte de dados indisponível ou timeout",code="UPSTREAM_UNAVAILABLE")
        finally: connection.close()
    def _proxy_sse(self,host:str,port:int,target:str,*,require_auth=True,core_fallback=False,timeout=75):
        headers=self._auth_headers(require_auth,core_fallback=core_fallback)
        if headers is None: return self.error(401,"Autenticação HeraclitusDB necessária",code="AUTH_REQUIRED")
        headers["Accept"]="text/event-stream";connection=http.client.HTTPConnection(host,port,timeout=timeout)
        try:
            connection.request("GET",target,headers=headers);response=connection.getresponse()
            if response.status!=200:
                body=response.read(MAX_RESPONSE+1);return self.send_body(response.status,body[:MAX_RESPONSE],response.getheader("Content-Type","application/json; charset=utf-8"))
            self.send_response(200);self.send_header("Content-Type",response.getheader("Content-Type","text/event-stream; charset=utf-8"));self.send_header("Connection","keep-alive");self._security_headers();self.end_headers()
            while True:
                chunk=response.readline(65537)
                if not chunk or len(chunk)>65536: break
                self.wfile.write(chunk);self.wfile.flush()
        except (BrokenPipeError,ConnectionResetError): return
        except (OSError,http.client.HTTPException,TimeoutError):
            if not self.wfile.closed:
                try: self.wfile.write(b"event: dashboard-error\ndata: {\"error\":\"UPSTREAM_UNAVAILABLE\"}\n\n");self.wfile.flush()
                except OSError: pass
        finally: connection.close()
    def _public_status(self):
        return self.send_body(200,_json_bytes({
            "portal_transparencia":{"configured":bool(PORTAL_API_KEY),"credential_configured":bool(PORTAL_API_KEY),"proxy_enabled":True,"upstream_checked":False,"base":"https://api.portaldatransparencia.gov.br/api-de-dados","datasets":sorted(PORTAL_DATASETS),"credential":"server-side env PORTAL_TRANSPARENCIA_API_KEY"},
            "pncp":{"configured":True,"proxy_enabled":True,"upstream_checked":False,"base":"https://pncp.gov.br","resources":sorted(PNCP_RESOURCES),"credential":"not required for these public reads"},
            "provenance_rule":"External responses are official-source observations only. They become Heraclitus evidence only after ingestion into the canonical log."
        }))
    def _public_portal(self,dataset,query):
        endpoint=PORTAL_DATASETS.get(dataset)
        if not endpoint: return self.error(403,"Dataset do Portal fora da allowlist",code="PUBLIC_DATASET_DENIED")
        if not PORTAL_API_KEY: return self.error(503,"Configure PORTAL_TRANSPARENCIA_API_KEY no processo do dashboard",code="PORTAL_API_KEY_MISSING")
        return self._proxy("api.portaldatransparencia.gov.br",443,f"/api-de-dados/{endpoint}"+(f"?{query}" if query else ""),https=True,extra_headers={"chave-api-dados":PORTAL_API_KEY},timeout=30,forward_browser_auth=False)
    def _public_pncp(self,resource,query):
        endpoint=PNCP_RESOURCES.get(resource)
        if not endpoint: return self.error(403,"Recurso PNCP fora da allowlist",code="PUBLIC_RESOURCE_DENIED")
        return self._proxy("pncp.gov.br",443,endpoint+(f"?{query}" if query else ""),https=True,timeout=30,forward_browser_auth=False)
    def do_GET(self):
        if not self._host_ok(): return self.error(403,"Host não autorizado",code="HOST_DENIED")
        if len(self.path)>MAX_PATH: return self.error(414,"Consulta demasiado longa",code="URI_TOO_LONG")
        parsed=urlsplit(self.path)
        if not _valid_query(parsed.query): return self.error(400,"Query contém caracteres não permitidos",code="BAD_QUERY")
        if parsed.path=="/dashboard-api/status":
            return self.send_body(200,_json_bytes({"product":"HeraclitusDB Platform Console","release":RELEASE,"read_only":True,"core_auth_mode":"server_env" if CORE_AUTH_HEADER else "browser_memory","labra_runtime":{"proxy_enabled":True,"port":LABRA_PORT,"frame":f"http://127.0.0.1:{LABRA_PORT}"},"aeb_runtime":{"proxy_enabled":True,"port":AEB_PORT,"frame":f"http://127.0.0.1:{AEB_PORT}"},"cgee_runtime":{"proxy_enabled":True,"port":CGEE_PORT,"frame":f"http://127.0.0.1:{CGEE_PORT}"}}))
        if parsed.path=="/public-api/status": return self._public_status()
        if parsed.path.startswith("/public-api/portal/"): return self._public_portal(parsed.path.removeprefix("/public-api/portal/"),parsed.query)
        if parsed.path.startswith("/public-api/pncp/"): return self._public_pncp(parsed.path.removeprefix("/public-api/pncp/"),parsed.query)
        if parsed.path.startswith("/labra-api/"):
            route=parsed.path.removeprefix("/labra-api")
            if not LABRA_READ_ROUTES.fullmatch(route): return self.error(403,"Rota LABRA fora do escopo somente-leitura",code="ROUTE_DENIED")
            return self._proxy(LABRA_HOST,LABRA_PORT,route+(f"?{parsed.query}" if parsed.query else ""),timeout=20,forward_browser_auth=False)
        if parsed.path.startswith("/aeb-api/"):
            route="/api/"+parsed.path.removeprefix("/aeb-api/")
            if not AEB_READ_ROUTES.fullmatch(route): return self.error(403,"Rota AEB fora do escopo somente-leitura",code="ROUTE_DENIED")
            return self._proxy(AEB_HOST,AEB_PORT,route+(f"?{parsed.query}" if parsed.query else ""),timeout=20,forward_browser_auth=False)
        if parsed.path.startswith("/cgee-api/"):
            route="/api/"+parsed.path.removeprefix("/cgee-api/")
            if not CGEE_READ_ROUTES.fullmatch(route): return self.error(403,"Rota CGEE fora do escopo somente-leitura",code="ROUTE_DENIED")
            target=_cgee_target(route,parsed.query)
            if target is None: return self.error(400,"Parâmetros CGEE inválidos ou fora dos limites",code="BAD_QUERY")
            return self._proxy(CGEE_HOST,CGEE_PORT,target,timeout=45 if route=="/api/verify" else 25,forward_browser_auth=False)
        if parsed.path.startswith("/agent-api/"):
            route=parsed.path.removeprefix("/agent-api")
            if not AGENT_READ_ROUTES.fullmatch(route): return self.error(403,"Rota Agent fora do escopo somente-leitura",code="ROUTE_DENIED")
            return self._proxy(AGENT_HOST,AGENT_PORT,route+(f"?{parsed.query}" if parsed.query else ""),timeout=30)
        if parsed.path.startswith("/api/"):
            route=parsed.path.removeprefix("/api")
            if not CORE_READ_ROUTES.fullmatch(route): return self.error(403,"Rota Core fora do escopo somente-leitura",code="ROUTE_DENIED")
            target=route+(f"?{parsed.query}" if parsed.query else "")
            if route=="/live/events": return self._proxy_sse(CORE_HOST,CORE_PORT,target,core_fallback=True)
            return self._proxy(CORE_HOST,CORE_PORT,target,require_auth=(route!="/healthz"),core_fallback=True,timeout=65 if route.startswith("/verify") else 20)
        return self._serve_static(parsed.path)
    def do_POST(self): self.error(405,"Dashboard é somente leitura; mutações não são expostas",code="READ_ONLY")

if __name__=="__main__":
    auth_mode="server-env" if CORE_AUTH_HEADER else "browser"
    print(f"HeraclitusDB Platform Dashboard {RELEASE} em http://{DASHBOARD_BIND}:{DASHBOARD_PORT} · core-auth={auth_mode} · labra={LABRA_HOST}:{LABRA_PORT} · aeb={AEB_HOST}:{AEB_PORT} · cgee={CGEE_HOST}:{CGEE_PORT}")
    ThreadingHTTPServer((DASHBOARD_BIND,DASHBOARD_PORT),Handler).serve_forever()
