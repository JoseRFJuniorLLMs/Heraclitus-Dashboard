# Auditoria recursiva SOTA da shell/UI — Heraclitus-Dashboard

Data: 2026-09-14  
Escopo: shell global, navegação lateral, isolamento de módulos, responsividade, identidade do produto, diagnóstico de versão e gates de regressão.

## Diagnóstico da captura enviada

A captura mostrava uma interface visualmente incoerente, com uma barra lateral composta por blocos incompatíveis e identidade antiga (`Heraclitus Forensic Layer`). A investigação encontrou duas causas independentes:

1. **colisão real de CSS no repositório**: `index.html` carregava `styles.css`, depois `soc.css`, depois `platform.css`. O arquivo `soc.css` declarava seletores globais como `body`, `header`, `nav`, `main`, `.brand`, `.card`, `button`, `input`, `table` e outros. Como era carregado depois do estilo base, o módulo SOC sobrescrevia a aplicação inteira;
2. **runtime/check-out local desatualizado**: a string `Heraclitus Forensic Layer` não existe no código atual auditado. Portanto a captura não correspondia ao `main` mais recente.

A correção não usa `!important` para mascarar o problema. A folha conflitante foi retirada do runtime e removida do repositório.

---

## Iteração 1 — eliminar a colisão estrutural

### Encontrado

`css/soc.css` era uma aplicação visual completa disfarçada de folha de módulo. Redefinia a shell global.

### Correção

- `index.html` passou a carregar somente:
  - `css/styles.css` — base compartilhada;
  - `css/platform.css` — shell oficial da plataforma;
- `css/soc.css` foi removido;
- estilos específicos de Sentinel permanecem escopados em `#soc ...`.

### Regra

Nenhum módulo pode redefinir `body`, `header`, `nav` ou `main` da aplicação.

---

## Iteração 2 — reconstruir a navegação como shell de produto

A navegação deixou de ser uma lista simples de links e passou a representar a arquitetura real do HeraclitusDB.

### Grupos

```text
Plataforma
├── Visão geral
├── Capacidades & runtime
├── Dados públicos
├── Fontes & ingestão
└── Mapa de dados

Tempo & investigação
├── Linha do tempo
├── Comparar A/B
├── Casos
├── Grafo & relações
├── Reconstituição
└── WHY / causalidade

Evidência
├── Cadeia de custódia
├── Integridade Merkle
└── Compliance técnico

Módulos
├── Agent Black Box
├── Sentinel / SOC
└── Inteligência assistida

Governança
├── Painel executivo
├── Titular / LGPD
└── Auditoria
```

### UX implementada

- sidebar única e estável;
- hierarquia tipográfica clara;
- ícones consistentes, sem emojis de estilos misturados;
- item ativo com `aria-current="page"`;
- descrição curta por item;
- botão de recolher/expandir;
- modo compacto real;
- footer de versão;
- navegação por teclado (`Enter`/`Space`);
- foco do workspace após navegação;
- navegação horizontal compacta em telas <= 900 px;
- `prefers-reduced-motion` respeitado.

A direção segue padrões maduros de OpenSearch Dashboards, Kibana e Grafana: header global, navegação primária consistente e workspace independente.

---

## Iteração 3 — reconstruir a shell visual

`css/platform.css` passou a ser o dono explícito do chrome global.

### Mudanças

- tokens próprios de shell;
- header em gradiente institucional discreto;
- melhor contraste e densidade;
- sidebar de 288 px, compactável para 84 px;
- cards com borda/sombra leves;
- grid sem larguras quebradas;
- workspace com largura fluida e limite visual amplo;
- estados de foco visíveis;
- inputs consistentes;
- modal com hierarquia correta;
- responsividade em 1180 / 900 / 620 px;
- Sentinel recebe canvas escuro **dentro do módulo**, sem contaminar a plataforma.

---

## Iteração 4 — impedir a regressão por CI

Foi criado `tests/ui-shell.cjs`.

O teste falha se:

- `css/soc.css` voltar a existir;
- `index.html` voltar a carregá-lo;
- a aplicação carregar mais folhas globais inesperadas;
- desaparecer o shell `nav-shell`;
- desaparecer o modo colapsável;
- desaparecer o breakpoint móvel;
- Sentinel deixar de estar escopado;
- a release deixar de estar identificada.

O workflow `Dashboard CI` agora executa também `UI shell contracts`.

---

## Iteração 5 — identidade do produto

A shell agora usa explicitamente:

```text
HeraclitusDB
Platform Console
Temporal · Verificável · Proveniência · Investigação
```

`Agent Black Box` e `Sentinel / SOC` aparecem como módulos, não como identidade da plataforma.

O Painel Executivo também foi corrigido para referenciar `Sentinel / SOC`, em vez do nome legado `Central de Comando`.

---

## Iteração 6 — detectar runtime/check-out antigo

A captura enviada provou que um operador pode estar olhando uma versão antiga sem perceber.

A release atual desta revisão é:

```text
2026.09.14-r3
```

Ela aparece:

- na sidebar;
- em `<meta name="hera-dashboard-release">`;
- em `GET /dashboard-api/status`;
- no header HTTP `X-Heraclitus-Dashboard-Release` de todas as respostas.

Exemplo:

```bash
curl -s http://127.0.0.1:9337/dashboard-api/status
curl -I http://127.0.0.1:9337/ | grep -i X-Heraclitus-Dashboard-Release
```

Isso permite separar imediatamente:

```text
bug atual da interface
        vs
checkout/processo antigo no WSL
```

---

## Critério de aceitação visual

A UI é considerada coerente quando:

1. existe apenas uma navegação principal;
2. a sidebar não muda de sistema visual ao abrir Sentinel;
3. nenhuma superfície de módulo redefine o chrome global;
4. o item ativo é inequívoco;
5. grupos refletem a arquitetura do HeraclitusDB;
6. o workspace permanece legível entre desktop e mobile;
7. release é visível e verificável por HTTP;
8. ausência de backend aparece como ausência/degradação, não como dado fictício;
9. Agent Black Box e Sentinel continuam módulos;
10. CI impede o retorno da colisão de CSS.

## Resultado

A falha da captura não era um pequeno defeito cosmético. Era uma violação de arquitetura de UI causada por duas shells globais competindo no mesmo documento. A correção torna a aplicação novamente **platform-first**, com isolamento explícito entre shell e módulos e um contrato de CI para impedir regressão.
