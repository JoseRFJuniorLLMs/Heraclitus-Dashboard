# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O Dashboard organiza dados, investigação, evidência, módulos e governança sem transformar Sentinel ou Agent Black Box na identidade inteira do produto.

## Navegação R4

A navegação não é mais uma lista plana com vinte telas. A shell usa dois níveis:

```text
HeraclitusDB
│
├─ rail primário
│  ├─ Dados
│  ├─ Casos
│  ├─ Investigar
│  ├─ Evidência
│  ├─ Agent Black Box
│  ├─ Sentinel
│  ├─ Governança
│  └─ Sistema
│
└─ painel contextual
   └─ mostra somente as telas da área ativa
```

Exemplos:

```text
Dados
├─ Dados públicos
├─ Fontes & ingestão
└─ Mapa de dados

Investigar
├─ Linha do tempo
├─ Comparar A/B
├─ Grafo & relações
├─ Reconstituição
├─ WHY / causalidade
└─ Inteligência assistida

Evidência
├─ Cadeia de custódia
├─ Integridade Merkle
└─ Compliance técnico
```

`Ctrl+K` abre a command palette para saltar diretamente a qualquer superfície. O header mantém breadcrumb `Área / Tela`. Em telas pequenas a navegação vira drawer; não existe carrossel horizontal com vinte destinos.

## Superfícies da plataforma

- **Visão geral** — head LSN, memtable, texto, vetores, grafo, entidades, ACT-R, integridade e módulos.
- **Dados** — Portal da Transparência, PNCP, fontes ingeridas e mapa de atributos.
- **Casos e investigação** — janelas temporais, comparação A/B, grafo, replay e WHY.
- **Evidência** — cadeia de custódia, Merkle e estado técnico de compliance.
- **Agent Black Box** — runs, tool calls, gateway, policy, approvals, ingest counters e integridade.
- **Sentinel** — superfície SOC opcional. O stream SSE só fica aberto quando a tela está ativa.
- **Governança** — painel executivo, consulta LGPD e auditoria.
- **Sistema** — capacidades e runtime da instância.

## Runtime

O estado global do Core não depende mais do Sentinel. `js/runtime.js` mantém um único heartbeat de `/stats` e distribui eventos para Overview, Executive e Sentinel:

```text
HeraclitusDB Core /stats
        │
        ▼
 RuntimeMonitor
   │    │    │
   ▼    ▼    ▼
Overview Exec Sentinel
```

O polling desacelera quando a página está oculta. O stream `/live/events` pertence ao Sentinel e é fechado ao sair da rota.

## Regra de proveniência

```text
fonte oficial externa
        ↓ observação
EXTERNAL_UNSEALED + source/query/time/SHA-256
        ↓ ingestão explícita futura
HeraclitusDB canonical log
        ↓
LSN + proveniência + integridade verificável
        ↓
views / grafo / texto / vetores / análises
```

Uma resposta consultada no Portal da Transparência ou PNCP **não recebe automaticamente** LSN, Merkle proof ou status `VERIFIED`.

## Arranque local

```bash
cp .env.example .env
set -a
source .env
set +a
python3 server.py
```

Por padrão: `http://127.0.0.1:9337/`.

Configuração:

```bash
export HERACLITUS_DASHBOARD_BIND=127.0.0.1
export HERACLITUS_DASHBOARD_PORT=9337
export HERACLITUS_DASHBOARD_ALLOWED_HOSTS='localhost:9337,127.0.0.1:9337,[::1]:9337'
```

Superfícies do host local:

```text
/api/*          -> HeraclitusDB Core REST, padrão 127.0.0.1:7475
/agent-api/*    -> Agent Evidence API, padrão 127.0.0.1:8080
/public-api/*   -> fontes governamentais allow-listed
/dashboard-api/status -> diagnóstico do próprio Dashboard
```

A release R4 pode ser conferida por:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -I http://127.0.0.1:9337/
```

O servidor devolve `X-Heraclitus-Dashboard-Release` para denunciar processos/checkouts antigos.

## Modelo de escrita

O Dashboard geral é **somente leitura**:

- o proxy Python aceita `GET`/`OPTIONS` e recusa mutações;
- componentes de UI não executam `POST`, `PUT`, `PATCH` ou `DELETE`;
- crypto-shred/LGPD é exibido como estado e orientação, não como botão destrutivo;
- aprovações de agentes e ativação de policy não são expostas nesta UI;
- futuras mutações administrativas devem possuir superfície dedicada, autenticação forte, RBAC e trilha de auditoria.

## Autenticação

Core e Agent são planos de identidade separados:

- **Core:** Basic/Bearer conforme o servidor, somente na memória da página.
- **Agent:** token Bearer/OIDC separado, também somente em memória.
- o Basic do Core nunca é reaproveitado automaticamente no Agent.
- recarregar a página apaga as credenciais do navegador.

## Portal da Transparência

Configure a chave somente no processo Python:

```bash
export PORTAL_TRANSPARENCIA_API_KEY='...'
python3 server.py
```

A chave é enviada pelo proxy e não chega ao JavaScript. O dashboard mantém Portal/PNCP como observações externas até ingestão canônica real.

## Segurança do host local

- bind em loopback por padrão;
- allowlist de `Host` contra DNS rebinding;
- allowlists independentes para Core, Agent e dados públicos;
- sem proxy arbitrário/SSRF;
- limite de 8 MiB para respostas não-streaming;
- CSP same-origin;
- arquivos internos (`.env`, `.git`, Python, testes) não são servidos;
- credenciais não são persistidas em `localStorage`/`sessionStorage`.

## Testes

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/contracts.cjs
node tests/ui-shell.cjs
python3 -m py_compile server.py
python3 -m unittest -v tests.test_server
```

O GitHub Actions executa os mesmos gates.

## Auditorias

- `docs/AUDITORIA-RECURSIVA-5X-2026-09-14.md`
- `docs/AUDITORIA-RECURSIVA-5X-ROUND2-2026-09-14.md`
- `docs/AUDITORIA-UI-SOTA-RECURSIVA-2026-09-14.md`
- `docs/AUDITORIA-DASHBOARD-SOTA-R4-2026-09-14.md`

## Próximas evoluções que dependem de backend/pipeline

- ingestão Portal/PNCP → HRKL com cursor, idempotência e checkpoints;
- normalizadores governamentais versionados;
- entity resolution explicável e reversível;
- grafo órgão → contratação → contrato → fornecedor → vínculos → sanções → pagamentos;
- provenance drill-down até observação/endpoint oficial;
- endpoint Core oficial `/capabilities`;
- filtros e field picker avançados para investigação;
- consultas e casos salvos por usuário/perfil;
- E2E com HeraclitusDB real e fixtures oficiais congeladas;
- adapters nativos para ferramentas internas Claude Code/Codex além de MCP/OTLP.
