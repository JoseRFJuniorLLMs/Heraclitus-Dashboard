# Auditoria Recursiva R4 — HeraclitusDB Dashboard

Data: 2026-09-14
Escopo: arquitetura de informação, navegação, shell visual, responsividade, acessibilidade, runtime, segurança do frontend e coerência com a plataforma HeraclitusDB.

## Sumário executivo

O problema principal não era cor, sombra ou tipografia. Era a arquitetura da navegação: vinte destinos diretos distribuídos em cinco grupos, todos com o mesmo peso visual e conceitual. O usuário precisava navegar pela própria navegação antes de chegar ao trabalho.

A R4 substitui esse modelo por:

```text
rail primário de áreas
        +
painel contextual da área ativa
        +
command palette Ctrl+K
        +
breadcrumb global
```

Também foram corrigidos dois problemas funcionais descobertos durante a recursão:

1. o Sentinel era, por acidente, o monitor global de `/stats` e mantinha polling/streaming fora de contexto;
2. a tela LGPD oferecia uma mutação `POST` apesar do Dashboard ser declarado e servido como read-only.

## Critérios de aceitação R4

A shell só é considerada aprovada se:

- não mostrar os vinte destinos simultaneamente;
- o rail primário representar áreas/produtos, não páginas aleatórias;
- cada área mostrar no máximo seu conjunto contextual de telas;
- `Dados`, `Casos`, `Investigar`, `Evidência`, `Agent`, `Sentinel`, `Governança` e `Sistema` tiverem hierarquia explícita;
- Agent Black Box e Sentinel continuarem módulos da plataforma;
- links contextuais tiverem `href` real;
- histórico do navegador e back/forward funcionarem;
- existir breadcrumb;
- existir skip-link;
- existir command palette com teclado;
- mobile usar drawer e backdrop, não carrossel horizontal;
- não existir segunda barra de identidade competindo com o header;
- nenhuma folha de estilo de módulo redefinir a shell global;
- UI geral não emitir POST/PUT/PATCH/DELETE;
- `/stats` possuir um monitor global único;
- SSE do Sentinel existir somente na rota Sentinel;
- nenhuma topologia falsa ou estado sintético ocupar espaço operacional;
- os contratos acima estiverem protegidos pelo CI.

---

# Passagem 1 — Arquitetura da informação

## Encontrado

A navegação anterior expunha aproximadamente vinte páginas ao mesmo tempo:

- Visão geral;
- Capacidades & runtime;
- Dados públicos;
- Fontes & ingestão;
- Mapa de dados;
- Linha do tempo;
- Comparar A/B;
- Casos;
- Grafo & relações;
- Reconstituição;
- WHY / causalidade;
- Cadeia de custódia;
- Integridade Merkle;
- Compliance técnico;
- Agent Black Box;
- Sentinel / SOC;
- Inteligência assistida;
- Painel executivo;
- Titular / LGPD;
- Auditoria.

O modelo misturava níveis de abstração incompatíveis. `Dados públicos` é fonte/workflow, `WHY` é ferramenta analítica, `Agent Black Box` é módulo/produto, `Painel executivo` é visão e `Capacidades & runtime` é administração do sistema.

### Severidade

P0 de usabilidade e identidade de produto.

## Correção

Nova taxonomia:

```text
Início

Dados
├─ Dados públicos
├─ Fontes & ingestão
└─ Mapa de dados

Casos
└─ Casos

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

Agent Black Box
└─ Agent Black Box

Sentinel
└─ Sentinel / SOC

Governança
├─ Painel executivo
├─ Titular / LGPD
└─ Auditoria

Sistema
└─ Capacidades & runtime
```

O rail contém áreas. O painel contextual contém páginas. Isso reduz drasticamente a quantidade de escolhas simultâneas.

---

# Passagem 2 — Shell visual e densidade

## Encontrado

A shell tinha três identidades concorrentes:

1. faixa superior `HERACLITUSDB`;
2. header `HeraclitusDB / Platform Console`;
3. cabeçalho interno da sidebar `Platform Console`.

A sidebar anterior também repetia para cada destino:

- ícone em caixa;
- título;
- microdescrição.

Com vinte itens, o menu tornava-se o elemento visual dominante do produto.

### Severidade

P0 visual.

## Correção

- removida a faixa GovBar duplicada;
- removido componente `GovBar.js` sem uso;
- header reduzido a produto + breadcrumb + busca + conexão;
- rail de 64 px;
- contexto aproximado de 228 px, recolhível;
- ícones SVG consistentes;
- sem emojis aleatórios na navegação;
- conteúdo permanece visualmente dominante;
- release aparece discretamente no rodapé contextual.

---

# Passagem 3 — Navegação, teclado e acessibilidade

## Encontrado

A navegação anterior simulava links com elementos sem `href`, aumentando a dependência de JavaScript e perdendo semântica nativa. O mobile transformava os mesmos vinte destinos em uma faixa horizontal rolável.

### Severidade

P1.

## Correção

- destinos contextuais são âncoras reais `href="#route"`;
- SPA intercepta o clique normal e preserva URL/hash;
- `pushState`, `replaceState` e `popstate` preservam histórico;
- breadcrumb `Área / Tela`;
- skip-link para conteúdo principal;
- `Ctrl/Cmd + K` abre command palette;
- setas navegam resultados da palette;
- Enter abre;
- Escape fecha palette e drawer;
- foco volta ao workspace ao mudar de tela;
- mobile usa drawer lateral com backdrop.

Referências de arquitetura usadas como benchmark conceitual: Elastic/Kibana solution views, OpenSearch Dashboards navigation/workspaces, Grafana/Saga navigation e padrões de navegação do GovBR-DS/USWDS. A implementação não copia a identidade visual desses produtos.

---

# Passagem 4 — Fronteiras entre módulos

## Encontrado

Sentinel ainda carregava resquícios do período em que o Dashboard inteiro era pensado como SOC:

- nome `Central de Comando`;
- polling de `/stats` próprio;
- stream SSE aberto independentemente da rota;
- topologia ilustrativa de nove máquinas.

### Severidade

P0 conceitual, P1 de performance.

## Correção

`js/runtime.js` agora é o heartbeat do Core:

```text
/stats
  ↓
RuntimeMonitor
  ├─ Overview
  ├─ Executive
  └─ Sentinel
```

O Sentinel:

- não chama mais `API.stats()`;
- não cria `setInterval` próprio;
- consome o evento global `hera:stats`;
- abre `/live/events` somente quando `route === 'soc'`;
- fecha o SSE ao sair da rota;
- não contém mais topologia ilustrativa;
- mantém verificação Merkle somente sob ação explícita.

O monitor global usa 2 s com página visível e 10 s quando oculta, evitando martelar o Core num separador abandonado.

---

# Passagem 5 — Segurança e coerência read-only

## Encontrado

O servidor local afirmava e implementava modelo read-only, mas `Titular.js` continha uma chamada `POST` para eliminação/crypto-shred.

Isso criava duas verdades:

```text
server.py: nenhuma mutação
Titular.js: botão destrutivo + POST
```

### Severidade

P0 de contrato de segurança.

## Correção

- removida a mutação de `Titular.js`;
- removido `/eliminar` do frontend;
- consulta LGPD permanece read-only;
- a UI explica que crypto-shred exige fluxo administrativo separado;
- o CI varre todos os componentes e falha se encontrar método HTTP `POST`, `PUT`, `PATCH` ou `DELETE`.

Aprovação de Agent e ativação de policy continuam igualmente fora do Dashboard geral.

---

# Passagem 6 — Mobile e comportamento real

## Encontrado

A versão anterior usava navegação horizontal rolável no mobile. Durante a R4 apareceu ainda um risco novo: a command palette era criada dentro do drawer e poderia ficar presa ao `transform` do ancestral no mobile.

### Severidade

P1.

## Correção

- drawer fixo em telas <= 900 px;
- backdrop dedicado;
- header reduzido no mobile;
- command palette é movida para `document.body` antes de inicializar;
- palette fica fora do containing block transformado;
- conteúdo não exige rolagem horizontal para descobrir a navegação principal.

---

# Passagem 7 — Prevenção de regressão

## Gates de CI

`Dashboard CI` executa:

```text
JavaScript syntax
Product contracts
UI shell contracts
Python syntax
Server tests
```

Os contratos agora verificam, entre outros pontos:

- somente `styles.css` + `platform.css` como estilos globais;
- `soc.css` continua inexistente;
- `GovBar.js` continua inexistente;
- rail/context/command palette existem;
- drawer mobile existe;
- não volta o padrão antigo `nav-item-copy`/`nav-scroll`;
- release R4 está visível e diagnosticável;
- `RuntimeMonitor` existe;
- Sentinel não chama `API.stats()` nem `setInterval`;
- Sentinel não contém topologia ilustrativa;
- componentes não contêm mutações HTTP;
- Agent/Core continuam planos de identidade separados;
- dados públicos continuam marcados `EXTERNAL_UNSEALED` até ingestão real.

---

# Passagem 8 — Dados públicos e uso governamental

A navegação foi reorganizada pensando no fluxo real de investigação pública, não na lista de crates do banco:

```text
fonte oficial
  ↓
Dados
  ↓
Caso
  ↓
Investigar
  ↓
Evidência
  ↓
Governança / auditoria
```

Para Portal da Transparência e PNCP, o próximo salto de produto não é criar mais dashboards. É construir ingestão e correlação confiáveis:

```text
órgão
  ↓
contratação/licitação
  ↓
contrato
  ↓
fornecedor
  ↓
empresa / vínculos
  ↓
sanções
  ↓
pagamentos / emendas
```

Cada relação precisa manter caminho de proveniência até a observação externa e, depois da ingestão, até o LSN/prova canônica.

---

# O que ainda não é resolvido pela R4

Estes itens não impedem a nova shell, mas são próximas etapas reais de produto:

## P1 — Route lifecycle para todos os módulos

Agent Black Box e Capabilities ainda fazem carga inicial mesmo escondidos. São chamadas pontuais, não loops, mas a arquitetura ideal é `mount/activate/deactivate` por rota.

## P1 — CSS legado base

`styles.css` ainda contém regras históricas globais que `platform.css` substitui. A colisão crítica foi eliminada, mas a próxima refatoração deve separar:

```text
tokens.css
components.css
shell.css
modules/*.css
```

com escopo explícito.

## P1 — E2E visual automatizado

O CI atual testa sintaxe e contratos, mas não pixel/layout em navegador real. O próximo gate recomendado é Playwright com screenshots para:

- 1440×900;
- 1280×720;
- 390×844;
- drawer aberto/fechado;
- palette aberta;
- foco/teclado;
- estados conectado/desconectado.

## P1 — Perfis/solution views

Órgãos diferentes não precisam ver a mesma profundidade. O passo maduro é filtrar áreas por capacidade/RBAC sem esconder evidência necessária:

- auditor/controladoria;
- analista de dados;
- segurança/SOC;
- operador de agentes;
- executivo.

A autorização deve continuar vindo do backend; perfil visual não pode virar autorização.

## P2 — Favoritos e recentes

Com uso real, command palette pode priorizar telas recentes e permitir favoritos localmente, sem guardar credenciais.

---

# Veredicto

A R4 corrige a causa estrutural da lateral ruim: deixa de ser uma lista de páginas e passa a ser uma arquitetura de áreas + contexto. Também remove inconsistências funcionais que a revisão visual expôs.

A shell R4 atende os critérios definidos neste documento. O Dashboard inteiro ainda depende das etapas de backend/pipeline listadas acima para atingir maturidade operacional completa, especialmente ingestão governamental, entity resolution, provenance drill-down e E2E visual.
