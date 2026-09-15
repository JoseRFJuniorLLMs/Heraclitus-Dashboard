# HeraclitusDB Dashboard

Console local da **plataforma HeraclitusDB**. A identidade do produto é temporal: log canônico, LSN, reconstrução histórica, proveniência, integridade e módulos construídos sobre esse fundamento. Sentinel, Agent Black Box e aplicações verticais são superfícies da plataforma, não substitutos da identidade do banco.

## Navegação R10

```text
HeraclitusDB
├─ Dados
├─ Casos
│  ├─ Catálogo de casos
│  ├─ LABRA-AGU
│  ├─ AEB-STREAM
│  └─ CGEE · Integridade Orçamentária
├─ Investigar
│  ├─ Linha do tempo
│  ├─ Comparar A/B
│  ├─ Grafo & relações
│  ├─ Reconstituição
│  ├─ WHY / causalidade
│  └─ Inteligência assistida
├─ Evidência
├─ Agent Black Box
├─ Sentinel
├─ Governança
└─ Sistema
```

`Ctrl+K` abre a command palette. O header mantém breadcrumb `Área / Tela`; em telas pequenas a navegação vira drawer.

## Casos de uso

`#cases` é o catálogo das aplicações construídas sobre HeraclitusDB. Ele é deliberadamente separado da lista técnica de investigações retornada por `GET /cases` do Core.

### LABRA-AGU

Fonte: `JoseRFJuniorLLMs/LABRA-AGU@9b5d9bcada759e23e12c2d995be17dca6e42a8e1`.

A rota `#labra` preserva a estrutura da aplicação fonte:

- **Alertas de Fraude**;
- **Mapa de Relações**;
- **Emitir Diretriz**;
- **Heraclitus Explorer**;
- acesso ao agente investigativo real de `serve.py`;
- explorador versionado da árvore do projeto, incluindo motor `agent/`, dashboard React, demos, documentação, avaliação e testes.

O conteúdo demonstrativo existente no frontend React originário continua marcado como **snapshot demonstrativo**. O runtime vivo é separado:

```bash
cd ~/LABRA-AGU
python3 serve.py --no-open
```

Padrão: `http://127.0.0.1:8770`.

O host geral continua read-only e só proxyfica `GET /health` e `GET /devedores`. A execução investigativa do projeto permanece na aplicação LABRA originária.

### AEB-STREAM

Fonte: `JoseRFJuniorLLMs/AEB@b8e9de466e9071a4b1c490a4faabb249dda36e9b`.

A rota `#aeb` incorpora o **dashboard orbital original** servido por `dashboard.py`, preservando globo 3D, satélites, estações terrenas, contactos, sparklines de telemetria e anomalias. Também oferece leitura estruturada de `GET /aeb-api/data`, arquitetura e explorador do snapshot.

```bash
cd ~/AEB
python3 dashboard.py
```

Padrão: `http://127.0.0.1:7480`.

Fronteira de verdade: TLE/órbita via CelesTrak/SGP4 podem ser reais; temperatura/tensão do PoC continuam simuladas enquanto `simular_telemetria()` não for substituído por feed operacional.

### CGEE · Integridade Orçamentária

Fonte: `JoseRFJuniorLLMs/CGEE@31951717036bd39d9bc898a80686f3907ffd8699`.

A rota `#cgee` incorpora o `painel.html` original e também mantém uma visão nativa do Dashboard construída somente com eventos reais do runtime:

- seletor de exercício;
- replay / AS OF;
- heatmap diário estilo GitHub;
- duas barras temporais;
- tabela do recorte;
- WHY por `action_id`/portaria;
- verificação do log;
- pipeline SIOP → `AlteracaoOrcamentaria`.

```bash
cd ~/CGEE
python3 painel_server.py
```

Padrão: `http://127.0.0.1:8000`.

O fallback sintético existente no HTML originário serve à demo do projeto, mas **não é promovido a estado operacional pela visão nativa do Heraclitus Dashboard**.

## Identidade temporal restaurada

A rota `#time` é o **Temporal Reconstruction Workbench**. R9 recupera a linguagem visual do dashboard temporal antigo sem recuperar sua dependência de `GOLDEN_DEMO`.

Ela possui:

- LIVE / AS OF LSN / COMPARE / REPLAY;
- step back / play / step forward;
- cursor temporal;
- velocidade de reprodução;
- duas barras que avançam com o tempo: **Eventos percorridos** e **Intervalo LSN percorrido**;
- **Temporal Activity Map** de 52 semanas / 364 dias, estilo contribuições do GitHub;
- tabela dos eventos até o cursor.

A fonte é somente:

```text
GET /security/events?limit=5000
```

Sem eventos reais, o gráfico fica vazio. Não são inventados LSNs, portarias, incidentes ou provas.

## Autenticação no arranque

Ao abrir o Dashboard, `LoginModal.bootstrap()` consulta o estado do host e testa o Core.

### Credencial server-side

No `.env`:

```bash
HERACLITUS_REST_HOST=127.0.0.1
HERACLITUS_REST_PORT=7475
HERACLITUS_REST_USERNAME=
HERACLITUS_REST_PASSWORD=
```

Quando usuário e senha existem, o proxy Python cria o Basic **server-side** e a UI mostra `Core: autenticado (.env)`. A senha não chega ao JavaScript.

### Credencial no navegador

Se o Core responder `401/403` e não houver credencial server-side válida, o modal de autenticação abre automaticamente. Usuário/senha ficam somente na memória da página.

O Dashboard distingue:

```text
401/403 -> autenticação necessária
rede/timeout/502 -> Core indisponível
200 -> Core conectado
```

Agent Black Box possui Bearer/OIDC separado. Credenciais do Core não são reutilizadas no Agent nem encaminhadas a LABRA, AEB, CGEE ou fontes públicas.

## Arranque local

```bash
cp .env.example .env
set -a
source .env
set +a
python3 server.py
```

Dashboard: `http://127.0.0.1:9337`.

Principais variáveis:

```bash
HERACLITUS_DASHBOARD_BIND=127.0.0.1
HERACLITUS_DASHBOARD_PORT=9337
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

Diagnóstico:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -i http://127.0.0.1:9337/api/stats
curl -s http://127.0.0.1:9337/labra-api/health
curl -s http://127.0.0.1:9337/aeb-api/data
curl -s http://127.0.0.1:9337/cgee-api/stats
```

## Fronteiras do host

O host geral é **somente leitura**:

```text
/api/*          -> HeraclitusDB Core REST allow-listed
/agent-api/*    -> Agent Evidence / Black Box read-only
/labra-api/*    -> LABRA health/devedores
/aeb-api/data   -> AEB payload operacional
/cgee-api/*     -> stats/timeline/verify/why
/public-api/*   -> fontes públicas allow-listed
```

`POST`, `PUT`, `PATCH` e `DELETE` não são expostos pelo host geral. Operações próprias de uma aplicação vertical ficam no respectivo runtime e na respectiva fronteira de autenticação.

Os frames dos casos só podem apontar para os runtimes loopback configurados. A CSP não permite frames arbitrários, e `frame-ancestors 'none'` impede que o próprio Dashboard seja embutido por terceiros.

## Proveniência de fontes públicas

```text
fonte oficial externa
        ↓
EXTERNAL_UNSEALED + origem/query/tempo/SHA-256
        ↓ ingestão explícita
HeraclitusDB canonical log
        ↓
LSN + proveniência + integridade verificável
```

Consultar Portal da Transparência ou PNCP não transforma automaticamente a resposta em evidência selada.

## Testes

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/contracts.cjs
node tests/ui-shell.cjs
python3 -m py_compile server.py
python3 -m unittest -v tests.test_server
```

Os gates R9 verificam hierarquia de Casos, snapshots fonte, fidelidade LABRA/AEB/CGEE, timeline real sem `GOLDEN_DEMO`, autenticação no arranque, read-only, CSP dos runtimes e isolamento de credenciais.

## Auditoria R9

A revisão completa está em:

`docs/AUDITORIA-RECURSIVA-20X-R9-2026-09-14.md`

Ela registra as 20 passadas de auditoria e o critério de aceite da release `2026.09.14-r9`.


## Red Team / Agent Security

A tela `#redteam` lê `/api/v1/agent/red-team/events` pela superfície Agent somente-leitura. Ela mostra apenas eventos reais persistidos pelo Agent Evidence log. O Dashboard não injeta ataques, não escreve approvals e não ativa policies.

A UI distingue explicitamente telemetria do runner (`redteam_lab`) de decisões nativas do Gateway. Um registro do laboratório prova a persistência daquele relato no HRKL; o bloqueio real é corroborado por `PolicyEvaluated`, `ToolDenied`, approvals, `ExternalEffectObserved` e pelo delta do upstream.
