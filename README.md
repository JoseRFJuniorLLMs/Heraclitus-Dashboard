# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O Dashboard organiza dados, investigação, evidência, módulos, casos de uso e governança sem transformar Sentinel, Agent Black Box ou uma aplicação vertical na identidade inteira do produto.

## Navegação R6

A shell usa dois níveis: rail primário por área e navegação contextual dentro da área ativa.

```text
HeraclitusDB
│
├─ Dados
├─ Casos
├─ LABRA-AGU
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
- **LABRA-AGU**: caso de uso de recuperação de ativos e inteligência pericial, incorporado como superfície versionada da plataforma.
- **Evidência**: cadeia de custódia, Merkle e estado técnico de compliance.
- **Agent Black Box**: runs, tool calls, gateway, policy, approvals, ingest counters e integridade.
- **Sentinel**: superfície SOC opcional. O stream SSE só fica aberto quando a tela está ativa.
- **Governança**: painel executivo, consulta LGPD e auditoria.
- **Sistema**: capacidades e runtime da instância.

## Caso de uso LABRA-AGU

A rota `#labra` incorpora o projeto `JoseRFJuniorLLMs/LABRA-AGU` como caso de uso de primeira classe. O snapshot de referência é fixado no commit `9b5d9bcada759e23e12c2d995be17dca6e42a8e1`, evitando que a interface atribua capacidades futuras a uma versão anterior.

A superfície inclui:

- arquitetura fontes → pipeline → HeraclitusDB → agente → Procuradoria;
- capacidades de ingestão, entidade/grafo, detecção, ACT-R, causalidade, recuperação e produto jurídico;
- catálogo de padrões de fraude;
- as quatro superfícies do dashboard LABRA original: Alertas, Mapa de Relações, Diretrizes e Heraclitus Explorer;
- avaliação e gates declarados pelo projeto;
- explorador navegável de entrypoints, `agent/`, `dashboard/`, `demo/`, `evaluation/` e demais árvores;
- documentação, PDFs e vídeos apontando para o snapshot fonte;
- estado vivo opcional do runtime LABRA local.

O código do LABRA **não é duplicado** dentro deste repositório. O `LABRA-AGU` continua sendo a fonte canônica e o Dashboard mantém um mapa versionado e rastreável do caso de uso. Isso evita dois códigos divergentes fingindo ser o mesmo produto, uma tradição de software que ninguém precisa preservar.

Para habilitar o estado vivo, rode no repositório LABRA:

```bash
python3 serve.py --no-open
```

Por padrão ele escuta em `127.0.0.1:8770`. O Dashboard expõe somente leituras allow-listed:

```text
/labra-api/health     -> estado do runtime / Gemma local
/labra-api/devedores  -> devedores reconstruídos do log HeraclitusDB pelo LABRA
```

`/investigar`, `/resumo`, diretrizes e demais mutações **não** são expostas pelo Dashboard geral.

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
```

Quando `HERACLITUS_REST_USERNAME` e `HERACLITUS_REST_PASSWORD` estão definidos, o proxy Python cria o header Basic **server-side** e o Dashboard já inicia autenticado no Core. A senha não chega ao JavaScript, não vai para `localStorage` e não aparece em `/dashboard-api/status`. O arquivo `.env` é ignorado pelo Git.

Se essas variáveis não forem definidas, continua disponível o login manual em memória pelo navegador. Credenciais explícitas fornecidas pelo navegador têm precedência sobre o fallback server-side.

Superfícies do host local:

```text
/api/*          -> HeraclitusDB Core REST, padrão 127.0.0.1:7475
/agent-api/*    -> Agent Evidence API, padrão 127.0.0.1:8080
/labra-api/*    -> LABRA-AGU local, somente health/devedores, padrão 127.0.0.1:8770
/public-api/*   -> fontes governamentais allow-listed
/dashboard-api/status -> diagnóstico do próprio Dashboard
```

Diagnóstico:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -I http://127.0.0.1:9337/
curl -s http://127.0.0.1:9337/api/stats
curl -s http://127.0.0.1:9337/labra-api/health
```

`/dashboard-api/status` expõe o modo de autenticação e configuração operacional não secreta, nunca usuário, senha ou token.

## Modelo de escrita

O Dashboard geral é **somente leitura**:

- o proxy Python aceita `GET`/`OPTIONS` e recusa mutações;
- componentes de UI não executam `POST`, `PUT`, `PATCH` ou `DELETE`;
- crypto-shred/LGPD é exibido como estado e orientação, não como botão destrutivo;
- aprovações de agentes e ativação de policy não são expostas nesta UI;
- ações do LABRA que investigam, emitem diretriz ou escrevem insights não são proxied por esta console;
- futuras mutações administrativas devem possuir superfície dedicada, autenticação forte, RBAC e trilha de auditoria.

## Autenticação e fronteiras de confiança

Core, Agent e LABRA são fronteiras separadas:

- **Core local:** pode usar Basic server-side via `.env` para auto-login no WSL.
- **Core manual:** Basic/Bearer fornecido pelo navegador permanece somente na memória da página.
- **Agent:** token Bearer/OIDC separado, também somente em memória.
- **LABRA runtime:** somente leituras públicas locais allow-listed; o Dashboard não encaminha credenciais Core/Agent para ele.
- o Basic do Core **nunca** é reaproveitado automaticamente no Agent, LABRA ou fontes públicas.
- o fallback de `.env` é aplicado somente a chamadas `/api/*` do Core.

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
- allowlists independentes para Core, Agent, LABRA e dados públicos;
- credencial Core opcional mantida apenas no processo Python;
- credenciais do navegador não são encaminhadas para LABRA ou dados públicos;
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
- a credencial Core não vaza para Agent nem LABRA;
- LABRA expõe somente `/health` e `/devedores` pelo proxy;
- o caso LABRA está pinado ao snapshot esperado e não usa iframe;
- o CSS do caso LABRA não pode redefinir o shell global;
- sem credencial server-side o comportamento manual do Core continua válido.

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
