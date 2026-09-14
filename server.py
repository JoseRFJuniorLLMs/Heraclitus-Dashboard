"""HeraclitusDB Platform Dashboard local host.

Serves the static dashboard and exposes three read-only proxy surfaces:

* /api/*         -> HeraclitusDB admin REST (default 127.0.0.1:7475)
* /agent-api/*   -> Agent Evidence/Black Box API (default 127.0.0.1:8080)
* /public-api/*  -> tightly allow-listed Brazilian government open-data APIs

The process binds to loopback only. It never proxies arbitrary hosts or paths.
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import http.client
import json
import mimetypes
import os
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
MAX_RESPONSE = 8 * 1024 * 1024
MAX_PATH = 4096

CORE_HOST = os.getenv("HERACLITUS_REST_HOST", "127.0.0.1")
CORE_PORT = int(os.getenv("HERACLITUS_REST_PORT", "7475"))
AGENT_HOST = os.getenv("HERACLITUS_AGENT_HOST", "127.0.0.1")
AGENT_PORT = int(os.getenv("HERACLITUS_AGENT_PORT", "8080"))
PORTAL_API_KEY = os.getenv("PORTAL_TRANSPARENCIA_API_KEY", "").strip()

CORE_READ_ROUTES = re.compile(
    r"^/(?:"
    r"healthz|stats|state|metrics|verify(?:/[0-9]+)?|compliance/status|telemetry/health|"
    r"security/events(?:/counts)?|fontes(?:/[A-Za-z0-9_.:-]+)?|atributos|diff|replay|"
    r"titular/[A-Za-z0-9_.:@-]+(?:/acessos)?|cases(?:/[A-Za-z0-9_-]+)?|content|"
    r"sentinel/(?:status|dashboard|incidents|actions)|"
    r"sentinel/incidents/[A-Za-z0-9_-]+(?:/(?:evidence|why))?|"
    r"sentinel/actions/[A-Za-z0-9_-]+|tier/(?:sealed|receipts)"
    r")$"
)

AGENT_READ_ROUTES = re.compile(
    r"^/(?:metrics|api/v1/agent/(?:"
    r"status|runs(?:/[A-Za-z0-9_.:-]+(?:/timeline)?)?|tool-calls|"
    r"evidence/[A-Za-z0-9_.:-]+(?:/proof)?|"
    r"policies(?:/[A-Za-z0-9_.:-]+)?|approvals(?:/[A-Za-z0-9_.:-]+)?"
    r"))$"
)

PORTAL_DATASETS = {
    "orgaos-siafi": "orgaos-siafi", "contratos": "contratos", "licitacoes": "licitacoes",
    "ceis": "ceis", "cnep": "cnep", "cepim": "cepim", "emendas": "emendas",
    "servidores": "servidores", "viagens": "viagens", "despesas-documentos": "despesas/documentos",
    "notas-fiscais": "notas-fiscais", "pessoa-juridica": "pessoa-juridica",
    "acordos-leniencia": "acordos-leniencia", "ceaf": "ceaf", "cartoes": "cartoes",
}

PNCP_RESOURCES = {
    "contratacoes-publicacao": "/api/consulta/v1/contratacoes/publicacao",
    "tipos-contratos": "/api/pncp/v1/tipos-contratos",
}

PUBLIC_ASSET = re.compile(r"(?:css/[A-Za-z0-9_./-]+\.css|js/[A-Za-z0-9_./-]+\.js)")
SAFE_QUERY = re.compile(r"^[A-Za-z0-9_.%=&+,:/@()\-]*$")


def _json_bytes(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def _valid_query(query: str) -> bool:
    return len(query) <= MAX_PATH and (not query or bool(SAFE_QUERY.fullmatch(query)))


class Handler(BaseHTTPRequestHandler):
    server_version = "HeraclitusDashboard/2"

    def log_message(self, *_):
        pass

    def send_body(self, status: int, body: bytes, content_type="application/json; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; "
            "base-uri 'none'; form-action 'self'",
        )
        self.end_headers()
        self.wfile.write(body)

    def error(self, status: int, message: str, *, code: str | None = None):
        self.send_body(status, _json_bytes({"error": code or "DASHBOARD_ERROR", "message": message}))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Allow", "GET, OPTIONS")
        self.end_headers()

    def _host_ok(self) -> bool:
        return self.headers.get("Host", "") in {"localhost:9337", "127.0.0.1:9337", "[::1]:9337"}

    def _serve_static(self, path: str):
        rel = path.lstrip("/")
        if rel in ("", "index.html"):
            file_path = ROOT / "index.html"
        elif PUBLIC_ASSET.fullmatch(rel):
            file_path = (ROOT / rel).resolve()
            if ROOT not in file_path.parents:
                return self.error(404, "Recurso indisponível")
        else:
            return self.error(404, "Recurso indisponível")
        if not file_path.is_file():
            return self.error(404, "Recurso indisponível")
        mime, _ = mimetypes.guess_type(str(file_path))
        if file_path.suffix == ".js": mime = "application/javascript; charset=utf-8"
        elif file_path.suffix == ".css": mime = "text/css; charset=utf-8"
        elif file_path.suffix == ".html": mime = "text/html; charset=utf-8"
        return self.send_body(200, file_path.read_bytes(), mime or "application/octet-stream")

    def _proxy(self, host: str, port: int, target: str, *, https=False, require_auth=False,
               extra_headers: dict[str, str] | None = None, timeout=15):
        auth = self.headers.get("Authorization", "")
        if require_auth and (not auth.startswith(("Basic ", "Bearer ")) or len(auth) > 2048):
            return self.error(401, "Autenticação HeraclitusDB necessária", code="AUTH_REQUIRED")
        headers = {"Accept": "application/json", "User-Agent": "Heraclitus-Dashboard/2"}
        if auth and len(auth) <= 2048: headers["Authorization"] = auth
        if extra_headers: headers.update(extra_headers)
        connection = (http.client.HTTPSConnection if https else http.client.HTTPConnection)(host, port, timeout=timeout)
        try:
            connection.request("GET", target, headers=headers)
            response = connection.getresponse()
            body = response.read(MAX_RESPONSE + 1)
            if len(body) > MAX_RESPONSE:
                return self.error(502, "Resposta excedeu 8 MiB; refine os filtros", code="RESPONSE_TOO_LARGE")
            return self.send_body(response.status, body, response.getheader("Content-Type", "application/json; charset=utf-8"))
        except (OSError, http.client.HTTPException, TimeoutError):
            return self.error(502, "Fonte de dados indisponível ou timeout", code="UPSTREAM_UNAVAILABLE")
        finally:
            connection.close()

    def _public_status(self):
        return self.send_body(200, _json_bytes({
            "portal_transparencia": {"configured": bool(PORTAL_API_KEY), "base": "https://api.portaldatransparencia.gov.br/api-de-dados", "datasets": sorted(PORTAL_DATASETS), "credential": "server-side env PORTAL_TRANSPARENCIA_API_KEY"},
            "pncp": {"configured": True, "base": "https://pncp.gov.br", "resources": sorted(PNCP_RESOURCES), "credential": "not required for these public reads"},
            "provenance_rule": "External responses are official-source observations only. They become Heraclitus evidence only after ingestion into the canonical log."
        }))

    def _public_portal(self, dataset: str, query: str):
        endpoint = PORTAL_DATASETS.get(dataset)
        if not endpoint: return self.error(403, "Dataset do Portal fora da allowlist", code="PUBLIC_DATASET_DENIED")
        if not PORTAL_API_KEY: return self.error(503, "Configure PORTAL_TRANSPARENCIA_API_KEY no processo do dashboard", code="PORTAL_API_KEY_MISSING")
        target = f"/api-de-dados/{endpoint}" + (f"?{query}" if query else "")
        return self._proxy("api.portaldatransparencia.gov.br", 443, target, https=True, extra_headers={"chave-api-dados": PORTAL_API_KEY}, timeout=30)

    def _public_pncp(self, resource: str, query: str):
        endpoint = PNCP_RESOURCES.get(resource)
        if not endpoint: return self.error(403, "Recurso PNCP fora da allowlist", code="PUBLIC_RESOURCE_DENIED")
        return self._proxy("pncp.gov.br", 443, endpoint + (f"?{query}" if query else ""), https=True, timeout=30)

    def do_GET(self):
        if not self._host_ok(): return self.error(403, "Host não autorizado", code="HOST_DENIED")
        if len(self.path) > MAX_PATH: return self.error(414, "Consulta demasiado longa", code="URI_TOO_LONG")
        parsed = urlsplit(self.path)
        if not _valid_query(parsed.query): return self.error(400, "Query contém caracteres não permitidos", code="BAD_QUERY")
        if parsed.path == "/public-api/status": return self._public_status()
        if parsed.path.startswith("/public-api/portal/"): return self._public_portal(parsed.path.removeprefix("/public-api/portal/"), parsed.query)
        if parsed.path.startswith("/public-api/pncp/"): return self._public_pncp(parsed.path.removeprefix("/public-api/pncp/"), parsed.query)
        if parsed.path.startswith("/agent-api/"):
            route = parsed.path.removeprefix("/agent-api")
            if not AGENT_READ_ROUTES.fullmatch(route): return self.error(403, "Rota Agent fora do escopo somente-leitura", code="ROUTE_DENIED")
            return self._proxy(AGENT_HOST, AGENT_PORT, route + (f"?{parsed.query}" if parsed.query else ""), timeout=30)
        if parsed.path.startswith("/api/"):
            route = parsed.path.removeprefix("/api")
            if not CORE_READ_ROUTES.fullmatch(route): return self.error(403, "Rota Core fora do escopo somente-leitura", code="ROUTE_DENIED")
            return self._proxy(CORE_HOST, CORE_PORT, route + (f"?{parsed.query}" if parsed.query else ""), require_auth=(route != "/healthz"), timeout=65 if route.startswith("/verify") else 20)
        return self._serve_static(parsed.path)

    def do_POST(self):
        self.error(405, "Dashboard é somente leitura; mutações não são expostas", code="READ_ONLY")


if __name__ == "__main__":
    print("HeraclitusDB Platform Dashboard em http://127.0.0.1:9337")
    ThreadingHTTPServer(("127.0.0.1", 9337), Handler).serve_forever()
