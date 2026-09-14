# Auto-auth do HeraclitusDB Core no WSL

O Dashboard pode iniciar já autenticado no HeraclitusDB Core sem guardar credenciais no navegador.

Configure somente no `.env` local:

```dotenv
HERACLITUS_REST_HOST=127.0.0.1
HERACLITUS_REST_PORT=7475
HERACLITUS_REST_USERNAME=admin
HERACLITUS_REST_PASSWORD=troque-por-uma-senha-local
```

O `.env` é ignorado pelo Git. O proxy Python monta o header Basic somente no processo local e o aplica exclusivamente às rotas `/api/*` do Core.

A credencial não é reutilizada em `/agent-api/*` nem em `/public-api/*`.

## Verificação

```bash
set -a
source .env
set +a
python3 server.py
```

O arranque deve indicar:

```text
core-auth=server-env
```

Em outro terminal:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -s http://127.0.0.1:9337/api/stats
```

O primeiro endpoint informa apenas `core_auth_mode=server_env`; usuário e senha nunca são expostos.
