# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O Dashboard organiza dados, investigação, evidência, módulos, casos de uso e governança sem transformar Sentinel, Agent Black Box ou uma aplicação vertical na identidade inteira do produto.

## Navegação R8

```text
HeraclitusDB
│
├─ Dados
├─ Casos
├─ LABRA-AGU
├─ AEB-STREAM
├─ CGEE
├─ Investigar
├─ Evidência
├─ Agent Black Box
├─ Sentinel
├─ Governança
└─ Sistema
```

A shell usa rail primário + navegação contextual. `Ctrl+K` abre a command palette, o header mantém breadcrumb `Área / Tela` e telas pequenas usam drawer.

## Superfícies da plataforma

- **Visão geral**: head LSN, memtable, texto, vetores, grafo, entidades, ACT-R, integridade e módulos.
- **Dados**: Portal da Transparência, PNCP, fontes ingeridas e mapa de atributos.
- **Casos e investigação**: janelas temporais, comparação A/B, grafo, replay e WHY.
- **LABRA-AGU**: recuperação de ativos e inteligência pericial como caso de uso versionado.
- **AEB-STREAM**: operação espacial e perícia temporal de dados orbitais.
- **CGEE**: integridade orçamentária SIOP, linha do tempo viva, heatmap diário estilo GitHub, WHY e verificação do log.
- **Evidência**: cadeia de custódia, Merkle e estado técnico de compliance.
- **Agent Black Box**: runs, tool calls, gateway, policy, approvals, ingest counters e integridade.
- **Sentinel**: superfície SOC opcional. O stream SSE só fica aberto quando a tela está ativa.
- **Governança**: painel executivo, consulta LGPD e auditoria.
- **Sistema**: capacidades e runtime da instância.

## LABRA-AGU

Rota: `#labra`  
Snapshot: `JoseRFJuniorLLMs/LABRA-AGU@9b5d9bcada759e23e12c2d995be17dca6e42a8e1`.

Runtime opcional:

```bash
python3 serve.py --no-open
```

Por padrão em `127.0.0.1:8770`. O Dashboard expõe somente:

```text
/labra-api/health
/labra-api/devedores
```

## AEB-STREAM

Rota: `#aeb`  
Snapshot: `JoseRFJuniorLLMs/AEB@b8e9de466e9071a4b1c490a4faabb249dda36e9b`.

A superfície inclui CelesTrak → SGP4 → H×S×E → HeraclitusDB → grafo/ACT-R/anomalias e deixa explícito que **TLE/órbita são reais no PoC, enquanto a telemetria térmica/elétrica ainda é simulada**.

Runtime opcional:

```bash
python3 dashboard.py
```

Por padrão em `127.0.0.1:7480`, com somente:

```text
/aeb-api/data
```

Documentação: `docs/USE-CASE-AEB-STREAM.md`.

## CGEE · Integridade Orçamentária

Rota: `#cgee`  
Snapshot: `JoseRFJuniorLLMs/CGEE@31951717036bd39d9bc898a80686f3907ffd8699`.

O caso incorpora o protótipo de integridade orçamentária baseado em alterações SIOP e preserva a parte visual mais distintiva do projeto: **linha do tempo viva + reprodução AS OF + heatmap diário estilo GitHub**.

A superfície inclui:

- arquitetura SIOP → ingestão → HeraclitusDB → AS OF/WHY/Merkle → painel;
- filtro por exercício derivado dos eventos do runtime;
- slider e reprodução progressiva por LSN/data;
- heatmap diário estilo GitHub reconstruído apenas com eventos reais retornados pelo runtime;
- duas barras de progresso: eventos acumulados e volume absoluto percorrido, com volume líquido exibido;
- tabela do recorte temporal;
- busca `WHY` por `action_id`/portaria;
- `db.verify()` sob demanda;
- explicação da ingestão SIOP e do schema `AlteracaoOrcamentaria`;
- explorador versionado de `SPEC.md`, loaders, painel, servidor e imagens.

### Fronteira de verdade

O `painel.html` original possui fallback sintético para demonstração offline. O Dashboard principal **não usa esse fallback como estado operacional**:

```text
runtime CGEE online  -> dados reais devolvidos pelo processo CGEE
runtime CGEE offline -> indisponível
```

Também não transforma o endpoint `WHY` atual em uma cadeia causal fictícia: no snapshot, ele localiza o evento pelo `action_id`. Causalidade mais profunda depende do backend causal real.

O loader de referência é `ingest_amostra.py`, porque corrige o mapeamento de valor para:

```text
val_acrescimo - val_reducao
```

Runtime opcional:

```bash
python3 painel_server.py
```

Por padrão em `127.0.0.1:8000`. O Dashboard expõe apenas:

```text
/cgee-api/stats
/cgee-api/timeline?limit=1..5000
/cgee-api/verify
/cgee-api/why?portaria=<action_id>
```

Documentação: `docs/USE-CASE-CGEE.md`.

## Runtime global

`js/runtime.js` mantém um único heartbeat do Core `/stats`. Sentinel não controla a saúde global da plataforma. O stream `/live/events` é aberto apenas enquanto Sentinel está ativo.

## Proveniência de fontes públicas

```text
fonte oficial externa
        ↓ observação
EXTERNAL_UNSEALED + source/query/time/SHA-256
        ↓ ingestão explícita
HeraclitusDB canonical log
        ↓
LSN + proveniência + integridade verificável
```

Uma resposta consultada no Portal da Transparência ou PNCP não recebe automaticamente LSN, Merkle proof ou status `VERIFIED`.

## Arranque local

```bash
cp .env.example .env
set -a
source .env
set +a
python3 server.py
```

Padrão: `http://127.0.0.1:9337/`.

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

CGEE_HOST=127.0.0.1
CGEE_PORT=8000
```

Quando `HERACLITUS_REST_USERNAME` e `HERACLITUS_REST_PASSWORD` estão definidos, o proxy cria o Basic **server-side** apenas para o Core. A senha não chega ao JavaScript, não vai para `localStorage` e não é reutilizada no Agent, LABRA, AEB, CGEE ou fontes públicas.

Superfícies do host:

```text
/api/*          -> HeraclitusDB Core REST
/agent-api/*    -> Agent Evidence API
/labra-api/*    -> LABRA-AGU local, allowlist read-only
/aeb-api/data   -> AEB-STREAM local, read-only
/cgee-api/*     -> CGEE local, quatro endpoints read-only
/public-api/*   -> fontes governamentais allow-listed
/dashboard-api/status -> diagnóstico do Dashboard
```

Diagnóstico:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -s http://127.0.0.1:9337/api/stats
curl -s http://127.0.0.1:9337/labra-api/health
curl -s http://127.0.0.1:9337/aeb-api/data
curl -s http://127.0.0.1:9337/cgee-api/stats
curl -s 'http://127.0.0.1:9337/cgee-api/timeline?limit=100'
```

## Modelo de escrita

O Dashboard geral é **somente leitura**:

- proxy Python aceita `GET`/`OPTIONS` e recusa mutações;
- componentes de UI não executam `POST`, `PUT`, `PATCH` ou `DELETE`;
- LABRA, AEB e CGEE possuem allowlists independentes;
- futuras mutações administrativas exigem superfície dedicada, autenticação forte, RBAC e trilha de auditoria.

## Segurança

- bind em loopback por padrão;
- allowlist de `Host` contra DNS rebinding;
- fronteiras independentes para Core, Agent, LABRA, AEB, CGEE e dados públicos;
- Core Basic opcional fica apenas no processo Python;
- credenciais do navegador não são encaminhadas para casos de uso ou fontes públicas;
- sem proxy arbitrário/SSRF;
- CGEE limita timeline a no máximo 5.000 eventos por chamada;
- limite global de 8 MiB para respostas não-streaming;
- CSP same-origin;
- arquivos internos não são servidos;
- credenciais não são persistidas em `localStorage`/`sessionStorage`.

## Testes

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/contracts.cjs
node tests/ui-shell.cjs
python3 -m py_compile server.py
python3 -m unittest -v tests.test_server
```

Os gates verificam snapshots, isolamento CSS, ausência de iframe, read-only, isolamento de credenciais, allowlists dos runtimes, fronteiras real/simulado e os contratos temporais do CGEE.

## Auditorias e casos de uso

- `docs/AUDITORIA-RECURSIVA-5X-2026-09-14.md`
- `docs/AUDITORIA-RECURSIVA-5X-ROUND2-2026-09-14.md`
- `docs/AUDITORIA-UI-SOTA-RECURSIVA-2026-09-14.md`
- `docs/AUDITORIA-DASHBOARD-SOTA-R4-2026-09-14.md`
- `docs/USE-CASE-LABRA-AGU.md`
- `docs/USE-CASE-AEB-STREAM.md`
- `docs/USE-CASE-CGEE.md`
