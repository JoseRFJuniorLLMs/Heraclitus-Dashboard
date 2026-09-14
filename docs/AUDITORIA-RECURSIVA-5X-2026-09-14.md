# Auditoria recursiva 5× — Heraclitus-Dashboard

Data: 2026-09-14  
Baseline: `c49a69e3d7d917fd948194e06a7375972e43fef7`

## Resumo executivo

O repositório tinha boas peças isoladas, especialmente leitura real de `/stats`, detecção de silêncio em `/fontes`, diff, cadeia de custódia e preocupação explícita com números não inventados. O problema era de produto e de contrato: **três aplicações históricas coexistiam, os testes validavam uma aplicação diferente da carregada pelo browser, o produto abria como SOC, várias superfícies eram demos convincentes e o proxy bloqueava endpoints que a própria UI chamava**.

A correção adotada é platform-first:

```text
HeraclitusDB
├── dados & ingestão
├── dados públicos oficiais
├── tempo / diff / casos
├── grafo / investigação
├── integridade / proveniência
├── Agent Evidence & Control (Agent Black Box)
├── Sentinel / SOC
└── governança
```

Agent Black Box e Sentinel são módulos. Nenhum deles substitui a identidade do banco.

---

# Iteração 1 — arquitetura e código executado

## Encontrado

- `index.html` carregava `js/app.js`.
- `README.md` e `tests/render.cjs` tratavam `js/soc.js` como aplicação canônica.
- `main.py` continha cópias antigas de HTML/CSS/JS e podia sobrescrever arquivos atuais.
- `index2.html` era um protótipo orçamentário antigo ainda na raiz.
- `server.py` tinha uma allowlist menor que a API usada pela aplicação.

## Risco

O teste podia ficar verde sobre código que o usuário nunca executava. Havia quatro fontes de verdade para a interface.

## Correção

- runtime único: `index.html -> js/app.js -> js/components/*`;
- remoção de gerador/protótipos legados;
- testes apontados para contratos da aplicação real;
- CI dedicado ao dashboard.

---

# Iteração 2 — UX, posicionamento e estados falsos

## Encontrado

A navegação começava em `Central de Comando (SOC)`, fazendo a plataforma parecer um SIEM. Além disso:

- `TimeMachine.js` gerava 800 eventos sintéticos quando não havia dados;
- `AttackReplay.js` tinha um incidente fixo;
- `AttackGraph.js` desenhava entidades e probabilidades fixas;
- `CausalInvestigation.js` entregava uma causa raiz fixa;
- `ForensicAI.js` fabricava uma resposta e afirmava verificação;
- `CompliancePanel.js` marcava controles como conformes sem consultar o backend;
- `MerkleViewer.js` desenhava uma árvore “válida” por padrão.

## Correção

- home = HeraclitusDB, não SOC;
- calendário temporal preservado, mas alimentado apenas por registros reais;
- superfícies investigativas consultam Sentinel/evidência real ou exibem ausência;
- compliance mostra payload técnico real e avisa que isso não é certificação;
- integridade depende de `/verify` real;
- IA explicativa fica explicitamente indisponível até existir backend real.

---

# Iteração 3 — paridade com HeraclitusDB

## API Core observada no repositório principal

Entre outras, o Core expõe:

```text
/healthz
/stats
/state
/verify
/verify/:segment
/live/events
/fontes
/atributos
/diff
/replay
/titular/:id
/titular/:id/acessos
/cases
/cases/:id
/security/events
/sentinel/*
/compliance/status
```

A versão anterior do proxy não permitia várias dessas rotas, embora componentes tentassem chamá-las.

## Agent Black Box

O HeraclitusDB já expõe:

```text
/api/v1/agent/status
/api/v1/agent/runs
/api/v1/agent/runs/:id
/api/v1/agent/runs/:id/timeline
/api/v1/agent/tool-calls
/api/v1/agent/evidence/:id
/api/v1/agent/evidence/:id/proof
/api/v1/agent/policies
/api/v1/agent/approvals
```

## Correção

- proxy Core corrigido para as rotas read-only realmente usadas;
- superfície Agent separada em `/agent-api/*` para o serviço Agent em `:8080`;
- nova tela Agent Black Box com status, runs e timeline reais;
- nenhum POST de aprovação/policy é exposto pelo dashboard geral.

---

# Iteração 4 — dados públicos federais

## Princípio

Há três estados que não podem ser confundidos:

1. **Fonte oficial externa**: resposta obtida diretamente de CGU/PNCP.
2. **Evidência Heraclitus**: registro ingerido no log canônico, com LSN.
3. **Dado derivado**: projeção, grafo, índice ou análise reconstruível a partir do log.

A UI agora mostra essa fronteira explicitamente.

## Portal da Transparência

Fontes oficiais consultadas durante a auditoria indicam API e downloads para áreas como contratos, licitações, despesas, emendas, sanções, servidores e viagens. As frequências de atualização variam conforme o conjunto; portanto o dashboard não pode anunciar genericamente “tempo real”.

Referências:

- https://api.portaldatransparencia.gov.br/swagger-ui/index.html
- https://portaldatransparencia.gov.br/download-de-dados
- https://portaldatransparencia.gov.br/origem-dos-dados

A chave da API permanece no proxy Python por `PORTAL_TRANSPARENCIA_API_KEY` e é enviada no header `chave-api-dados`.

## PNCP

A superfície inicial usa apenas endpoints públicos allow-listed, sem proxy arbitrário.

Referências:

- https://www.gov.br/pncp/pt-br/acesso-a-informacao/dados-abertos
- https://pncp.gov.br/manual/pt-br/latest/

## Modelo recomendado para ingestão futura

Cada ingestão deve preservar, no mínimo:

```text
source_system
source_endpoint
source_query_hash
source_observed_at
source_record_id
source_payload_hash
source_last_update
ingested_at
heraclitus_lsn
schema_version
normalizer_version
```

A proveniência deve permitir voltar do registro normalizado ao objeto externo observado.

---

# Iteração 5 — comparação com outros produtos

A comparação não foi usada para copiar estética, mas padrões operacionais maduros.

## OpenSearch Dashboards / Discover

Padrão útil: descobrir, filtrar, abrir documento, salvar visão e continuar investigando.

- https://docs.opensearch.org/latest/dashboards/discover/index-discover/

## Grafana Investigations

Padrão útil: reunir sinais num caso/investigação e comparar janelas temporais.

- https://grafana.com/docs/grafana/latest/explore/simplified-exploration/investigations/

## Langfuse

Padrão útil: sessão → trace/run → spans/tool calls → detalhe.

- https://langfuse.com/docs/observability/features/sessions

## OpenLineage

Padrão útil: separar `run`, `job` e `dataset` e transportar proveniência como evento.

- https://openlineage.io/docs/spec/object-model/

## OpenSanctions

Padrão útil: modelo centrado em entidade/relação para dados de pessoas, empresas, sanções e vínculos.

- https://www.opensanctions.org/docs/entities/

## Apache Superset

Padrão útil: filtros/drill-down e exploração de dataset como parte do produto.

- https://superset.apache.org/docs/using-superset/exploring-data/

---

# O que existia e foi preservado

- leitura real de `/stats`;
- taxa derivada de head/tempo, sem EPS fabricado;
- SSE autenticável por fetch;
- `/fontes` e detecção de silêncio;
- `/atributos`;
- `/diff`;
- titular/LGPD;
- cadeia de custódia;
- preocupação com estados sem fonte;
- painel executivo que já havia sido corrigido para não inventar números;
- calendário estilo GitHub, agora sem fallback sintético.

# O que faltava e foi adicionado

- identidade HeraclitusDB platform-first;
- home geral da plataforma;
- Agent Black Box real;
- dados públicos oficiais como superfície própria;
- fronteira externo → ingerido → derivado → verificado;
- casos na aplicação canônica;
- proxy Agent separado;
- allowlists Core alinhadas à UI;
- chave do Portal server-side;
- credencial Heraclitus memory-only;
- CI do dashboard;
- testes contra regressões de claims sintéticos.

# O que ainda exige backend, não maquiagem de dashboard

1. pipeline oficial de ingestão Portal/PNCP → HRKL com checkpoint/cursor;
2. normalizadores de CNPJ/CPF mascarado, órgão, UG/UASG, fornecedor, contrato e processo;
3. entity resolution versionado e reversível;
4. grafo público real: órgão → licitação → contrato → fornecedor → sócio → sanção → pagamento/emenda;
5. consulta textual/grafo/SQL read-only apropriada ao dashboard;
6. endpoint de provenance drill-down por LSN/registro;
7. hooks oficiais para capturar ferramentas internas de Claude Code/Codex além de MCP/OTLP;
8. autenticação federada/HttpOnly para implantação web multiusuário;
9. políticas de cache/rate-limit específicas das APIs públicas;
10. testes E2E com instância HeraclitusDB real e fixtures oficiais congeladas.

# Critério de produto

Um usuário novo deve responder:

> “HeraclitusDB é uma plataforma temporal e verificável de dados e investigação, capaz de trabalhar com dados públicos, proveniência, integridade, segurança e evidência de agentes de IA.”

Se responder apenas “é um SOC” ou “é a caixa-preta de agentes”, a arquitetura de produto regrediu.
