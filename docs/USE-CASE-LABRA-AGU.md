# LABRA-AGU como caso de uso do HeraclitusDB

## Fonte canônica

- Repositório: `JoseRFJuniorLLMs/LABRA-AGU`
- Snapshot incorporado: `9b5d9bcada759e23e12c2d995be17dca6e42a8e1`
- Rota no Dashboard: `#labra`
- Componente: `js/components/LabraAguCase.js`
- CSS isolado: `css/labra-case.css`

O Dashboard não faz fork interno do LABRA. Ele incorpora a solução como uma superfície versionada, e todos os links de arquivos/documentos apontam para o snapshot fonte. Assim, uma tela antiga nunca atribui ao projeto código que só apareceu depois.

## Modelo do caso de uso

```text
FONTES
Oracle · MSSQL · Postgres · PDF · DOCX · CSV · áudio · vídeo
       │
       ▼
pipeline.py
       │ ingestão incremental / checkpoint / provenance
       ▼
HERACLITUSDB
append-only · LSN · replay · cadeia de custódia
       │
       ▼
AGENTE LABRA
parser · entity resolution · grafo · padrões · ACT-R
anomalias · causalidade · contrafactual · rede · teoria
       │
       ▼
PROCURADORIA
insight · laudo · peça · diretriz auditável
```

A separação é deliberada: ingestão não opina, o agente não lê as fontes diretamente e a direção humana entra por eventos rastreáveis.

## O que a superfície incorpora

### Visão do caso

Arquitetura ponta a ponta e fronteira probatória do sistema.

### Motor investigativo

- ingestão multimodal e multi-banco;
- checkpoints e idempotência;
- normalização CPF/CNPJ;
- entity resolution determinística e fuzzy;
- grafo de caso e timeline por LSN;
- correlação multi-fonte;
- padrões de fraude;
- anomaly engine;
- ACT-R;
- evidence scoring;
- cadeia causal e contrafactuais;
- legal mapper;
- theory builder;
- network analysis;
- asset recovery e feedback;
- relatórios e peça jurídica;
- daemon event-sourced;
- LLM local opcional com fallback determinístico.

### Padrões explícitos

- `triangulacao_offshore`
- `fracionamento`
- `laranja_familiar`
- `vespera_constricao`
- `suborno`
- `antedatacao`
- `registro_apagado`

O caso de uso também referencia as extensões de asset shield e cobertura de cenários brasileiros presentes no snapshot.

### Produto LABRA original

O Dashboard registra as quatro superfícies do React/Vite original:

1. Alertas de Fraude
2. Mapa de Relações
3. Emitir Diretriz
4. Heraclitus Explorer

A incorporação não replica os estados demonstrativos hardcoded do `App.jsx`. O console Heraclitus distingue explicitamente snapshot de código, runtime observado e dados provenientes do banco.

### Avaliação

A superfície mostra a existência do `evaluation/harness.py`, `evaluation/scenarios.py`, `evaluation/run_eval.py` e do gate de avaliação. Números como quantidade de testes e limiares são rotulados como declarações do snapshot, não como medição produzida pelo Heraclitus Dashboard.

### Projeto e documentação

O painel expõe mapa navegável de:

- raiz/entrypoints;
- `agent/`;
- `dashboard/`;
- `demo/`;
- `evaluation/`;
- `.github/workflows/`;
- `docs/`;
- `img/`;
- `proto/`;
- `tests/`;
- `windows/`;

Documentos, PDFs e vídeos continuam no repositório fonte, evitando duplicar binários grandes e criar versões divergentes.

## Runtime local opcional

O `serve.py` do LABRA escuta por padrão em `127.0.0.1:8770`.

Configure no `.env` do Dashboard:

```dotenv
LABRA_HOST=127.0.0.1
LABRA_PORT=8770
```

Inicie no checkout do LABRA:

```bash
python3 serve.py --no-open
```

O Dashboard permite somente:

```text
GET /labra-api/health
GET /labra-api/devedores
```

Essas chamadas são traduzidas para:

```text
GET http://LABRA_HOST:LABRA_PORT/health
GET http://LABRA_HOST:LABRA_PORT/devedores
```

Nenhuma credencial Core/Agent é encaminhada.

## Operações deliberadamente não incorporadas ao proxy geral

- `POST /investigar`
- `POST /resumo`
- emissão de diretriz
- gravação de insight
- qualquer mutação do LABRA ou do HeraclitusDB

O Heraclitus Dashboard permanece read-only. Uma futura superfície operacional de escrita deve ter autenticação própria, RBAC, confirmação de intenção e trilha de auditoria.

## Gates de regressão

O CI verifica que:

- `LABRA-AGU` permanece no rail e na command palette;
- o componente está montado pelo `app.js`;
- o snapshot está pinado;
- não existe iframe do repositório externo;
- o componente não executa métodos HTTP mutáveis;
- o CSS LABRA não redefine `body`, `header`, `nav`, `main`, `aside`, `html` ou `*` globalmente;
- `/health` e `/devedores` são permitidos;
- outras rotas LABRA são negadas;
- a credencial Core não vaza para o runtime LABRA.
