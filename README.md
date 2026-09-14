# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O Dashboard organiza dados, investigação, evidência, módulos, casos de uso e governança sem transformar Sentinel, Agent Black Box ou uma aplicação vertical na identidade inteira do produto.

## Navegação R7

A shell usa dois níveis: rail primário por área e navegação contextual dentro da área ativa.

```text
HeraclitusDB
│
├─ Dados
├─ Casos
├─ LABRA-AGU
├─ AEB-STREAM
├─ Investigar
├─ Evidência
├─ Agent Black Box
├─ Sentinel
├─ Governança
└─ Sistema
```

`Ctrl+K` abre a command palette para saltar diretamente a qualquer superfície. O header mantém breadcrumb `Área / Tela`. Em telas pequenas a navegação vira drawer.

## Superfícies da plataforma

- **Visão geral**: head LSN, memtable, texto, vetores, grafo, entidades, ACT-R, integridade e módulos.
- **Dados**: Portal da Transparência, PNCP, fontes ingeridas e mapa de atributos.
- **Casos e investigação**: janelas temporais, comparação A/B, grafo, replay e WHY.
- **LABRA-AGU**: recuperação de ativos e inteligência pericial, incorporada como caso de uso versionado.
- **AEB-STREAM**: operação espacial e perícia temporal de dados orbitais, com runtime local read-only opcional.
- **Evidência**: cadeia de custódia, Merkle e estado técnico de compliance.
- **Agent Black Box**: runs, tool calls, gateway, policy, approvals, ingest counters e integridade.
- **Sentinel**: superfície SOC opcional. O stream SSE só fica aberto quando a tela está ativa.
- **Governança**: painel executivo, consulta LGPD e auditoria.
- **Sistema**: capacidades e runtime da instância.

## Caso de uso LABRA-AGU

A rota `#labra` incorpora `JoseRFJuniorLLMs/LABRA-AGU` como caso de uso de primeira classe. O snapshot de referência é fixado no commit `9b5d9bcada759e23e12c2d995be17dca6e42a8e1`.

A superfície inclui arquitetura, capacidades, padrões de fraude, operação, avaliação, projeto completo, documentação e estado vivo opcional. O código do LABRA **não é duplicado** neste repositório: o repositório LABRA continua sendo a fonte canônica.

Runtime opcional:

```bash
python3 serve.py --no-open
```

Por padrão em `127.0.0.1:8770`, com somente:

```text
/labra-api/health
/labra-api/devedores
```

`/investigar`, `/resumo`, diretrizes e demais mutações não são expostas pelo Dashboard geral.

## Caso de uso AEB-STREAM

A rota `#aeb` incorpora `JoseRFJuniorLLMs/AEB` como caso de uso espacial do HeraclitusDB. O snapshot exibido é pinado em `b8e9de466e9071a4b1c490a4faabb249dda36e9b`.

A superfície inclui:

- arquitetura CelesTrak/INPE → `pipeline.py` → HeraclitusDB → Cérebro → operação;
- propagação TLE via SGP4 e conversão geodésica;
- representação H × S × E usada pelo projeto;
- catálogo brasileiro de Amazonia-1, CBERS-4A, CBERS-4, SCD-1, SCD-2 e SGDC-1;
- grafo temporal, ACT-R e detectores térmico, elétrico e orbital;
- consultas forenses `AS OF`, `PROVENANCE` e `WHY`;
- estado vivo do dashboard AEB local, incluindo head LSN, satélites, leituras, anomalias e contactos calculados;
- explorador versionado dos entrypoints, motor e assets do projeto;
- fronteira explícita entre dados reais e simulação.

A fronteira é deliberadamente honesta: **TLE/órbita vêm hoje da CelesTrak; telemetria térmica/elétrica ainda é simulada pelo PoC**. Space-Track e feeds INPE/CDSR/CRC permanecem roadmap até existirem no runtime.

Para habilitar o runtime vivo, no checkout AEB:

```bash
python3 dashboard.py
```

Por padrão em `127.0.0.1:7480`. O Dashboard geral expõe somente:

```text
/aeb-api/data -> AEB GET /api/data
```

O proxy não repassa credenciais Core/Agent ao AEB e não expõe assets arbitrários ou rotas de escrita.

Documentação da integração: `docs/USE-CASE-AEB-STREAM.md`.

## Runtime

O estado global do Core não depende do Sentinel. `js/runtime.js` mantém um único heartbeat de `/stats` e distribui eventos para Overview, Executive e Sentinel. O polling desacelera quando a página está oculta. O stream `/live/events` pertence ao Sentinel e é fechado ao sair da rota.

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

Configuração principal:

```bash
HERACLITUS_DASHBOARD_BIND=127.0.0.1
HERACLITUS_DASHBOARD_PORT=9337
HERACLITUS_DASHBOARD_ALLOWED_HOSTS=localhost:9337,127.0.0.1:9337,[::1]:9337

HERACLITUS_REST_HOST=127.0.0.1
HERACLITUS_REST_PORT=7475
HERACLITUS_REST_USERNAME=
HERACLITUS_REST_PASSWORD=

HERACLITUS_AGENT_HOST=127.0.0.1
HERACLITUS_AGENT_PORT=8080

LABRA_HOST=127.0.0.1
LABRA_PORT=8770

AEB_HOST=127.0.0.1
AEB_PORT=7480
```

Quando `HERACLITUS_REST_USERNAME` e `HERACLITUS_REST_PASSWORD` estão definidos, o proxy Python cria o header Basic **server-side** e o Dashboard já inicia autenticado no Core. A senha não chega ao JavaScript, não vai para `localStorage` e não aparece em `/dashboard-api/status`.

Superfícies do host local:

```text
/api/*          -> HeraclitusDB Core REST, padrão 127.0.0.1:7475
/agent-api/*    -> Agent Evidence API, padrão 127.0.0.1:8080
/labra-api/*    -> LABRA-AGU local, somente health/devedores, padrão 127.0.0.1:8770
/aeb-api/data   -> AEB-STREAM local, somente payload operacional, padrão 127.0.0.1:7480
/public-api/*   -> fontes governamentais allow-listed
/dashboard-api/status -> diagnóstico do próprio Dashboard
```

Diagnóstico:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -I http://127.0.0.1:9337/
curl -s http://127.0.0.1:9337/api/stats
curl -s http://127.0.0.1:9337/labra-api/health
curl -s http://127.0.0.1:9337/aeb-api/data
```

## Modelo de escrita

O Dashboard geral é **somente leitura**:

- o proxy Python aceita `GET`/`OPTIONS` e recusa mutações;
- componentes de UI não executam `POST`, `PUT`, `PATCH` ou `DELETE`;
- aprovações de agentes e ativação de policy não são expostas nesta UI;
- ações do LABRA que investigam, emitem diretriz ou escrevem insights não são proxied;
- o runtime AEB é consumido apenas por `GET /api/data`;
- futuras mutações administrativas devem possuir superfície dedicada, autenticação forte, RBAC e trilha de auditoria.

## Autenticação e fronteiras de confiança

Core, Agent, LABRA e AEB são fronteiras separadas:

- **Core local:** pode usar Basic server-side via `.env` para auto-login.
- **Core manual:** Basic/Bearer do navegador fica somente em memória.
- **Agent:** token Bearer/OIDC separado, também somente em memória.
- **LABRA runtime:** somente leituras locais allow-listed; não recebe credenciais Core/Agent.
- **AEB runtime:** somente `GET /api/data`; não recebe credenciais Core/Agent.
- o fallback de `.env` é aplicado somente a chamadas `/api/*` do Core.

## Segurança do host local

- bind em loopback por padrão;
- allowlist de `Host` contra DNS rebinding;
- allowlists independentes para Core, Agent, LABRA, AEB e dados públicos;
- credencial Core opcional mantida apenas no processo Python;
- credenciais do navegador não são encaminhadas para LABRA, AEB ou dados públicos;
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

Os gates verificam, entre outros pontos:

- Core server-side recebe o Basic configurado mesmo sem login do navegador;
- credenciais Core não vazam para Agent, LABRA nem AEB;
- LABRA expõe somente `/health` e `/devedores`;
- AEB expõe somente `/api/data` pelo proxy;
- LABRA e AEB estão pinados aos snapshots esperados e não usam iframe;
- CSS de ambos os casos não pode redefinir o shell global;
- AEB mantém no texto a distinção entre TLE real e telemetria simulada.

O GitHub Actions executa os mesmos gates.

## Auditorias e casos de uso

- `docs/AUDITORIA-RECURSIVA-5X-2026-09-14.md`
- `docs/AUDITORIA-RECURSIVA-5X-ROUND2-2026-09-14.md`
- `docs/AUDITORIA-UI-SOTA-RECURSIVA-2026-09-14.md`
- `docs/AUDITORIA-DASHBOARD-SOTA-R4-2026-09-14.md`
- `docs/USE-CASE-LABRA-AGU.md`
- `docs/USE-CASE-AEB-STREAM.md`

## Próximas evoluções que dependem de backend/pipeline

- ingestão Portal/PNCP → HRKL com cursor, idempotência e checkpoints;
- normalizadores governamentais versionados;
- entity resolution explicável e reversível;
- provenance drill-down até observação/endpoint oficial;
- endpoint Core oficial `/capabilities`;
- E2E com HeraclitusDB real e fixtures oficiais congeladas;
- AEB: feed real de telemetria, Space-Track e integrações INPE/CDSR/CRC com metadados de origem/calibração;
- adapters nativos para ferramentas internas Claude Code/Codex além de MCP/OTLP.