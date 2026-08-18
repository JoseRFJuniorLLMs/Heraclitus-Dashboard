# Heraclitus Forensic Layer — dashboard (DSgov)

Front-end da **Heraclitus Forensic Layer** no padrão visual do Governo Federal
(DSgov): *"a primeira plataforma que transforma logs em provas jurídicas."*

Sem build: HTML + CSS + módulos ES nativos.

```
index.html
css/styles.css
js/api.js                 cliente REST + medição de ritmo + fluxo SSE
js/components/*.js        um componente por área
```

## Como abrir

```bash
python -m http.server 9337 --directory .
```

Depois em `http://localhost:9337`. O selo no topo do painel configura o endpoint
REST do HeraclitusDB (default `http://127.0.0.1:7475`).

## Para ver dados reais é preciso autorizar a origem

O REST do HeraclitusDB **não envia cabeçalhos CORS por omissão**, e sem eles o
browser bloqueia todos os pedidos deste painel. Ou se serve painel e API na
mesma origem (nginx), ou se autoriza esta origem na configuração do servidor:

```toml
rest_cors_origins = ["http://localhost:9337"]
```

A lista é explícita de propósito — o REST tem rotas que escrevem e liga-se a
`127.0.0.1`; um `*` deixaria qualquer página que o operador visitasse falar com
a base de dados local através do browser dele.

Sem isso, o painel **diz** que está bloqueado por CORS e mostra traços. Não
inventa números para preencher o espaço.

## O que é medido e o que não é

O painel distingue três estados, e nunca os confunde: **medido**, **a pedido** e
**sem fonte**. Cada mostrador diz de onde vem o seu valor.

| Mostrador | Origem | Estado |
|---|---|---|
| Eventos / segundo | `(head₂ − head₁)/Δt` do `/stats` | medido |
| Eventos no log | `head` | medido |
| Na memtable | `memtable` | medido |
| Latência da API | ida e volta do pedido | medido |
| Índice vetorial / texto | `vector_indexed`, `text_indexed` | medido |
| Nós do grafo / arestas temporais | `graph_nodes`, `tgraph_edges` | medido |
| Integridade do log · Merkle | `GET /verify` | **a pedido** |
| Eventos suspeitos, selo ICP-Brasil | — | **sem fonte** |
| Mapa da infraestrutura | topologia fixa | ilustrativo |

O `head` é monotónico e conta registos confirmados, portanto a diferença dele
dividida pelo tempo **é** a taxa de inserção — não uma estimativa, e não precisa
de endpoint novo nenhum.

A integridade é **a pedido** porque `/verify` relê e re-hasha todos os
segmentos. Pô-la num temporizador seria martelar o servidor. Enquanto ninguém
carrega no botão, diz *não verificado* — que é a verdade, e é diferente de
*100%*.

## Fluxo ao vivo de inserções

A tabela "Eventos recentes" consome `GET /live/events` (SSE). O log já emitia
cada append confirmado num broadcast interno (`Log::tail_subscribe`); o endpoint
que o expõe está em `heraclitus-server/src/rest.rs`.

**O fluxo transporta só metadados** — `lsn`, `agent_id`, `kind`, `bytes` e o
instante. Nunca `content` nem valores de atributos: o broadcast do log carrega o
episódio **antes de ser cifrado**, portanto reencaminhá-lo inteiro para um
browser desfazia o que a cifra em repouso protege.

Fica a ressalva de que no modelo do Forge o `agent_id` é o **titular** dos dados
(pseudonimizado por HMAC), não o produtor. O endpoint está atrás da autenticação
de administração, mas um painel destes num ecrã de parede tem outra exposição.

## O que ainda é ilustrativo

Duas secções estão ligadas a dados reais — **Central de Comando** e **Painel
Executivo**. As outras oito (linha do tempo, replay, grafo, investigação causal,
cadeia de custódia, Merkle, conformidade, IA forense) continuam com dados de
demonstração e recebem automaticamente o selo *dados de demonstração* no título.

A marcação é feita num sítio só (`js/app.js`), a partir de uma lista explícita
das secções ligadas. Assim uma secção nova nasce marcada por omissão, em vez de
nascer a parecer real — que era o problema: oito secções não tinham marca
nenhuma e várias exibiam números grandes e convincentes (12.000.000 de eventos
na linha do tempo) que ninguém tinha como distinguir de medições.

## Histórico

Antes desta versão o painel preenchia tudo com valores de demonstração
convincentes (4.231.880.114 eventos, 1,8 ms de latência, Merkle "íntegra")
sempre que a ligação falhava — e a ligação falhava **sempre**, porque faltava o
CORS. O modo falso distinguia-se do real por um selo pequeno no canto. Numa
plataforma que se propõe transformar logs em provas jurídicas, esse era o pior
sítio possível para números fabricados.
