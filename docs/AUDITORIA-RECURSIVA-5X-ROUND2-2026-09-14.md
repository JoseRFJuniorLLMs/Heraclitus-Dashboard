# Auditoria recursiva 5× — Round 2 — Heraclitus-Dashboard

Data: 2026-09-14  
Baseline: `54090e89ec75286625a09b38582a0d583e9f5f8f`

## Decisão de produto

O dashboard deve representar o **HeraclitusDB inteiro** e seus módulos, sem voltar a cometer nenhum dos dois erros anteriores:

```text
HeraclitusDB != SOC
HeraclitusDB != Agent Black Box
```

Modelo adotado:

```text
HeraclitusDB Platform
├── Core temporal / HRKL / LSN
├── índices: atributos, texto, vetores, grafo, entidades, ACT-R
├── investigação temporal / diff / replay / casos
├── proveniência / cadeia de custódia / Merkle / compliance
├── analytics / tier / cluster / GPU (quando habilitados)
├── dados públicos oficiais
├── Sentinel / SOC                    [módulo]
└── Agent Evidence & Control          [módulo]
    └── Agent Black Box
```

---

## Iteração 1 — arquitetura executada, fontes de verdade e contratos

### Encontrado

A reorganização anterior eliminou os maiores problemas históricos: runtime canônico único, componentes modulares, ausência de demos sintéticas convincentes e CI dedicado. A base atual é pequena e adequada ao produto: Python stdlib no host local e ES Modules no navegador.

Persistia, porém, uma lacuna estrutural: a aplicação possuía muitas telas, mas nenhum catálogo capaz de responder **quais capacidades pertencem ao motor e quais estão efetivamente observáveis nesta instância**.

### Correção

Adicionada a superfície `Capacidades & runtime`, com estados explícitos:

- observado;
- disponível;
- sem autorização;
- não suportado;
- indisponível;
- não sondado.

A tela usa sinais reais de `/stats`, `/state`, `/compliance/status`, `/sentinel/status`, `/tier/sealed`, Agent status e public status. Raft, GPU, analytics e retrieval não são apresentados como “ativos” sem sonda específica.

---

## Iteração 2 — paridade com o HeraclitusDB real

### Encontrado

O Core possui capacidades que a home não representava adequadamente, embora `/stats` já exponha sinais úteis como:

```text
head
memtable
vector_indexed
text_indexed
graph_nodes
tgraph_edges
entity_keys
activation_tracked
views
storage_metrics
```

Também existem superfícies Core para tempo, casos, Sentinel, compliance e cold tier, enquanto Analytics/DataFusion/Arrow Flight são feature-gated.

### Correção

- home ampliada com `entity_keys` e `activation_tracked`;
- link explícito para catálogo de capacidades;
- capabilities matrix distingue feature documentada de runtime comprovado;
- Agent Black Box e Sentinel continuam sob “Módulos”, não na identidade principal.

### Lacuna de backend recomendada

Criar futuramente no Core um endpoint read-only como:

```text
GET /capabilities
```

com versão, feature flags compiladas, estado runtime e razão de indisponibilidade. Isso elimina probing indireto e torna dashboard/CLI/SDK consistentes.

---

## Iteração 3 — dados públicos federais e proveniência

### Encontrado

A tela anterior conseguia consultar Portal da Transparência e PNCP, mas o produto final era basicamente um `JSON.stringify`. Isso prova conectividade, não produz um objeto investigável.

Além disso, `/public-api/status` dizia que PNCP estava “configurado/disponível” sem efetivamente testar o upstream. O dashboard também não preservava um digest da resposta oficial observada.

### Correção

Cada consulta agora pode produzir uma **observação externa v1**:

```json
{
  "schema": "heraclitus.external-observation/v1",
  "provenance_state": "EXTERNAL_UNSEALED",
  "source": {
    "system": "Portal da Transparência/CGU ou PNCP",
    "dataset": "...",
    "query": "..."
  },
  "observed_at": "...",
  "response_sha256": "...",
  "record_count": 0,
  "payload": {}
}
```

A UI entrega:

- fonte;
- dataset;
- filtros exatos;
- horário UTC;
- SHA-256 da resposta;
- contagem;
- prévia tabular;
- JSON bruto;
- download da observação.

Esse arquivo é explicitamente **não selado** e **não é Evidence Bundle**. Ele só recebe LSN/Merkle após uma ingestão canônica futura.

### Referências operacionais

- Portal da Transparência — Dados Abertos: https://portaldatransparencia.gov.br/download-de-dados/
- PNCP — Manual de Integração v2.6: https://pncp.gov.br/manual/pt-br/latest/
- PNCP — API de consultas pública: https://pncp.gov.br/api/consulta

O Portal publica conjuntos com periodicidades diferentes, incluindo mensal, diário, semanal, quatro horas e sob demanda. Portanto a UI não usa o claim genérico “tempo real”.

### Modelo de investigação futuro

O pipeline Portal/PNCP → Heraclitus deve preservar pelo menos:

```text
source_system
source_dataset
source_endpoint
source_query_hash
source_observed_at
source_record_id
source_payload_hash
source_last_update
normalizer_version
entity_resolution_version
ingested_at
heraclitus_lsn
```

---

## Iteração 4 — comparação com produtos maduros e Agent Black Box

A pesquisa não foi usada para copiar aparência. Foram extraídos padrões de interação.

### OpenSearch Discover

Referência: https://docs.opensearch.org/latest/dashboards/discover/index-discover/

Padrões aproveitáveis:

- busca e filtros;
- seleção de campos;
- resultado tabular;
- detalhe do documento;
- exploração sem esconder o dado bruto.

O módulo de dados públicos passou a usar prévia tabular + JSON original e deve evoluir para seleção/filtros estruturados.

### OpenLineage

Referência: https://openlineage.io/docs/spec/object-model/

Padrão aproveitável: separar Dataset, Job e Run e transportar proveniência como evento, em vez de desenhar uma relação sem explicar como ela nasceu.

### OpenSanctions / FollowTheMoney

Referências:

- https://www.opensanctions.org/docs/entities/
- https://www.opensanctions.org/docs/statements/

Padrões aproveitáveis:

- pessoa/empresa/organização como entidades;
- relações de propriedade/associação como objetos investigáveis;
- proveniência por afirmação;
- merge/unmerge e histórico de mudança.

Isso é particularmente relevante para o grafo futuro:

```text
órgão
  -> contratação/licitação
  -> contrato
  -> fornecedor
  -> pessoa/empresa relacionada
  -> sanção
  -> pagamento/emenda
```

### Langfuse

Referências:

- https://langfuse.com/docs/observability/overview
- https://langfuse.com/docs/observability/data-model

Padrão aproveitável: session → trace/run → observation/tool call. O Heraclitus adiciona policy, approvals, LSN e prova verificável.

### Agent Black Box: defeitos encontrados

1. A API real devolve timeline em `entries`, mas o componente buscava `timeline/events/evidence`. Resultado possível: run real com UI dizendo “nenhuma evidência”.
2. O status Agent oferece policy, bypass protection, ingest counters, gateway counters e integrity detail, mas a tela mostrava apenas KPIs superficiais.
3. A correção anterior impediu corretamente o Basic do Core de vazar para Agent, porém não criou um mecanismo separado para OIDC/Bearer Agent. Em produção isso podia tornar a superfície inacessível.

### Correções

- timeline reconhece `entries`;
- run detail e timeline são carregados em paralelo;
- policy ativa, bypass protection, ingestão, duplicatas/conflitos/rejeições e gateway counters são mostrados;
- autenticação Agent recebeu token Bearer separado, apenas em memória;
- Basic Core nunca é reutilizado no Agent;
- dashboard geral continua read-only: aprovação/ativação de policy não foi reintroduzida por conveniência.

---

## Iteração 5 — segurança, streaming, testes e operação

### Bug crítico de SSE

`api.js` abria:

```text
/api/live/events
```

mas a allowlist do proxy não incluía `/live/events`. Mesmo se incluísse, `_proxy()` fazia buffering até EOF, incompatível com SSE de longa duração.

### Correção

- `/live/events` entrou explicitamente na allowlist Core;
- criado caminho de proxy SSE streaming, sem `Content-Length` e com flush por linha;
- auth continua obrigatória;
- cliente mantém seu reconnect/backoff.

### Host e implantação

O host/porta do dashboard eram hard-coded em `9337`. Agora existem:

```text
HERACLITUS_DASHBOARD_BIND
HERACLITUS_DASHBOARD_PORT
HERACLITUS_DASHBOARD_ALLOWED_HOSTS
```

A proteção contra DNS rebinding permanece, mas acompanha a configuração do servidor.

### Status de fonte pública

A API agora distingue:

```text
proxy_enabled
credential_configured
upstream_checked = false
```

“Proxy configurado” não é usado como sinônimo de “fonte externa saudável”.

### Gates de regressão

Os testes foram ampliados para exigir:

- superfície Capabilities;
- Agent timeline `entries`;
- Bearer Agent separado;
- nenhuma persistência de credenciais em local/session storage;
- observação `EXTERNAL_UNSEALED` com SHA-256;
- `/api/live/events` reconhecido como rota Core protegida;
- status público honesto sobre `upstream_checked`.

---

# O que existe agora

- plataforma HeraclitusDB como identidade principal;
- status Core e índices reais;
- timeline sem fallback sintético;
- diff A/B;
- casos;
- grafo/replay/WHY conforme backend;
- cadeia de custódia/Merkle/compliance;
- Agent Black Box com runs, timeline, run detail, policy e telemetria do gateway;
- Sentinel/SOC como módulo;
- Portal da Transparência e PNCP como fontes externas allow-listed;
- observação externa com digest/proveniência;
- autenticação Core e Agent separadas;
- SSE Core através do proxy local;
- CI Node/Python.

# O que ainda NÃO existe e não deve ser falsificado na UI

1. ingestão Portal/PNCP → HRKL com checkpoint/cursor e idempotência;
2. normalizadores governamentais versionados (CNPJ, órgão, UG/UASG, fornecedor, contrato, processo, CPF mascarado);
3. entity resolution versionado, explicável e reversível;
4. grafo público real órgão → compra → contrato → fornecedor → vínculos → sanções → pagamentos;
5. drill-down de proveniência Core por registro/LSN até a observação externa;
6. capability discovery oficial do Core;
7. filtros/field picker avançados no estilo Discover;
8. ingestão em massa dos downloads oficiais para análises históricas;
9. autenticação web multiusuário com sessão HttpOnly/reverse proxy para implantação fora de localhost;
10. testes E2E contra HeraclitusDB real + fixtures oficiais congeladas;
11. captura nativa de ferramentas internas Claude Code/Codex além de MCP/OTLP;
12. fonte de dados societários adequada para relações fornecedor → sócios; Portal/PNCP sozinhos não resolvem todo o grafo de beneficiário/vínculos.

## Critério final de produto

Um usuário novo deve concluir:

> HeraclitusDB é uma plataforma temporal e verificável de dados e investigação, que consegue trabalhar com dados públicos oficiais, preservar proveniência e integridade e oferecer módulos especializados para segurança e evidência de agentes de IA.

Se a resposta voltar a ser apenas “é um SOC” ou “é um monitor de agentes”, a arquitetura de produto regrediu.
