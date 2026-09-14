# Caso de uso CGEE · Integridade Orçamentária

Snapshot fonte: `JoseRFJuniorLLMs/CGEE@31951717036bd39d9bc898a80686f3907ffd8699`.

## Objetivo

Incorporar o projeto CGEE ao Heraclitus Dashboard como caso de uso versionado de integridade orçamentária sobre dados SIOP, preservando o que torna o protótipo distinto: reprodução temporal, filtro por exercício, heatmap diário estilo GitHub, inspeção por `action_id` e verificação do log.

A integração não usa iframe e não duplica o código do CGEE. O repositório CGEE continua sendo a fonte canônica; esta console incorpora uma representação rastreável de suas capacidades e uma fronteira de leitura para o runtime local.

## Inventário do snapshot

O snapshot contém:

- `SPEC.md`: blueprint do caso de uso orçamentário;
- `main.py`: carregador inicial multi-exercício 2023–2026;
- `ingest_amostra.py`: carregador de amostra que corrige o mapeamento de valor para `val_acrescimo - val_reducao`;
- `app.py`: protótipo alternativo em Streamlit ligado ao SDK gRPC;
- `painel.html`: dashboard auto-contido com reprodução temporal, seletor de exercício, heatmap estilo GitHub, WHY e escudo de integridade;
- `painel_server.py`: servidor stdlib em `127.0.0.1:8000` com superfície HTTP somente leitura;
- `img/0.png` a `img/6.png`: imagens do protótipo.

## Arquitetura representada

```text
SIOP / alterações orçamentárias
          │
          ▼
ingest_amostra.py
normalização + ordenação cronológica
          │
          ▼
HeraclitusDB
AlteracaoOrcamentaria + LSN
          │
          ├── timeline / AS OF
          ├── WHY por action_id
          └── verify / integridade
          │
          ▼
Painel de Integridade Orçamentária
```

O evento normalizado contém `action_id`, exercício, órgão, ação orçamentária, valor, tipo de alteração e data oficial.

## O heatmap temporal

O commit `058c9612a9de55645e28d33027abc2a86630cd0f` adicionou ao painel original:

- seletor de exercício;
- botão `Reproduzir`;
- avanço temporal `AS OF LSN`;
- heatmap de contribuições diário no padrão visual do GitHub;
- tooltips de data, quantidade de alterações e valor;
- inspetor WHY visual.

A integração R8 recria a ideia do heatmap dentro do Heraclitus Dashboard usando **apenas eventos devolvidos pelo runtime CGEE**. O avanço do slider e o play formam o histórico progressivamente, sem gerar eventos sintéticos.

## Fronteira entre dado real e demo

O `painel_server.py` original devolve `503` quando o banco está indisponível e o `painel.html` possui dados sintéticos embutidos para demonstração offline. Isso é útil no protótipo original, mas não é apropriado como estado operacional da plataforma.

Na integração do Heraclitus Dashboard:

- runtime online = dados retornados pelo CGEE;
- runtime offline = estado explicitamente indisponível;
- nenhum fallback sintético é apresentado como timeline real;
- a UI não inventa Merkle, LSN, portaria, WHY ou integridade.

## Runtime local read-only

No checkout CGEE:

```bash
python3 painel_server.py
```

Porta padrão: `127.0.0.1:8000`.

O Dashboard aceita configuração por:

```bash
CGEE_HOST=127.0.0.1
CGEE_PORT=8000
```

Superfície exposta:

```text
GET /cgee-api/stats
GET /cgee-api/timeline?limit=1..5000
GET /cgee-api/verify
GET /cgee-api/why?portaria=<action_id>
```

Mapeamento:

```text
/cgee-api/stats       -> CGEE /api/stats
/cgee-api/timeline    -> CGEE /api/timeline
/cgee-api/verify      -> CGEE /api/verify
/cgee-api/why         -> CGEE /api/why
```

Rotas diferentes são negadas. Credenciais do Core e do Agent Black Box não são encaminhadas ao CGEE.

## Limite semântico do WHY atual

No snapshot integrado, `GET /api/why?portaria=...` procura um evento pelo `action_id` dentro da timeline e o devolve. Isso não equivale, por si só, à cadeia causal completa descrita no blueprint `SPEC.md`.

A UI R8 deixa esse limite explícito. Um WHY causal mais profundo deve vir do backend causal real do HeraclitusDB/LABRA, e não de um grafo inventado no navegador.

## Integridade

`GET /api/verify` chama `db.verify()` no runtime CGEE. A integração usa esse resultado apenas sob demanda.

O checkbox de "simular fraude" existente no protótipo Streamlit é uma demonstração visual e não altera o log físico. Por isso não foi transportado como evidência operacional.

## Ingestão SIOP

A referência escolhida é `ingest_amostra.py`, porque o próprio arquivo documenta que corrige o mapeamento do carregador inicial. O valor do evento é:

```text
val_acrescimo - val_reducao
```

Fluxo:

```text
CSV SIOP
  ↓
parse da data oficial
  ↓
normalização do órgão / ação / instrumento
  ↓
ordenação cronológica
  ↓
append AlteracaoOrcamentaria
  ↓
LSN
  ↓
db.verify()
```

## Critérios de aceitação R8

- `CGEE` aparece como área de primeiro nível e também no `Ctrl+K`;
- rota direta `#cgee`;
- snapshot pinado no commit fonte;
- heatmap temporal alimentado somente pelo runtime;
- play e slider alteram o recorte AS OF;
- filtros por exercício são derivados dos eventos reais;
- WHY não é apresentado como causalidade mais profunda do que o backend atual fornece;
- verify é executado sob demanda;
- proxy CGEE é somente leitura e allow-listed;
- Core Basic e Agent token não chegam ao CGEE;
- CSS é isolado sob `.cgee-case`;
- nenhum iframe;
- CI valida sintaxe, contratos, shell e servidor.
