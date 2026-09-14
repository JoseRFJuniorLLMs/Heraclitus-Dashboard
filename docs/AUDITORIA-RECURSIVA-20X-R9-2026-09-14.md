# Auditoria Recursiva 20× — Heraclitus Dashboard R9

Data: 14/09/2026  
Escopo: navegação, casos de uso, fidelidade aos projetos fonte, identidade temporal, autenticação, runtime, segurança e regressões de UI.

## Resultado executivo

A auditoria encontrou quatro regressões principais: os casos de uso estavam fora da área **Casos**, as superfícies LABRA/AEB/CGEE eram resumos editoriais em vez das aplicações originárias, a identidade temporal do dashboard antigo tinha sido reduzida a uma tabela/calendário discreto e a autenticação existia apenas como ação manual no header. R9 corrige os quatro pontos.

## Interação 01 — Arquitetura de informação
**Achado:** LABRA-AGU, AEB-STREAM e CGEE tinham virado áreas primárias independentes no rail.  
**Correção:** `Casos` passa a ser a área-mãe. Rotas: `#cases`, `#labra`, `#aeb`, `#cgee`.

## Interação 02 — Catálogo visível no painel Casos
**Achado:** `Cases.js` listava apenas `/cases` do Core.  
**Correção:** a tela passa a mostrar primeiro o catálogo de aplicações e, separadamente, os casos persistidos retornados pelo Core.

## Interação 03 — Registro canônico de casos de uso
**Achado:** metadados estavam duplicados entre componentes.  
**Correção:** criado `js/useCases.js` com nome, repositório, snapshot, runtime e capacidades dos projetos integrados.

## Interação 04 — LABRA: conferência contra `dashboard/src/App.jsx`
**Achado:** o Dashboard Heraclitus mostrava arquitetura/capacidades genéricas e não a experiência LABRA original.  
**Fonte verificada:** o projeto tem quatro abas de produto: `Alertas de Fraude`, `Mapa de Relações`, `Emitir Diretriz`, `Heraclitus Explorer`.  
**Correção:** essas quatro telas viram a navegação principal do caso LABRA dentro do Dashboard.

## Interação 05 — LABRA: Alertas de Fraude
**Achado:** a tela original tinha feed, severidade, padrão, ACT-R, fontes e detalhe; isso havia desaparecido.  
**Correção:** reconstruída a superfície de alertas do snapshot, explicitamente marcada como conteúdo demonstrativo do frontend originário.

## Interação 06 — LABRA: Mapa de Relações
**Achado:** o componente `RelationGraph.jsx` usa 7 entidades e 8 relações no cenário visual.  
**Correção:** restaurado um grafo visual correspondente dentro do caso, com entidades, relações e risco.

## Interação 07 — LABRA: Diretriz
**Achado:** o frontend original simulava a submissão e até gerava ULID falso. Isso não pode aparecer como escrita real no Dashboard geral.  
**Correção:** o formulário e a prévia foram preservados, mas o host geral continua read-only. Execução real fica no runtime originário separado.

## Interação 08 — LABRA: Heraclitus Explorer
**Achado:** manifold visual e Rio de Eventos do frontend React haviam desaparecido na incorporação anterior.  
**Correção:** restaurados como parte do caso LABRA.

## Interação 09 — LABRA: runtime real
**Achado:** `serve.py` é uma aplicação real do próprio projeto, incluindo investigação sobre o log, Gemma local/fallback e dossiê.  
**Correção:** o caso incorpora o runtime original em `127.0.0.1:8770` por frame de origem separada.

## Interação 10 — AEB: conferência contra `dashboard.py`
**Achado:** a incorporação anterior reduzia o AEB a tabelas e explicações. O projeto originário tem globo 3D, Terra/texturas locais, trilhas orbitais, satélites, estações, contactos, sparklines e anomalias.  
**Correção:** `Painel orbital original` passa a ser a primeira superfície do caso, incorporando o `dashboard.py` real em `127.0.0.1:7480`.

## Interação 11 — AEB: fronteira entre real e simulado
**Achado:** o projeto mistura TLE/SGP4 real com telemetria simulada no PoC.  
**Correção:** essa fronteira fica explícita dentro do caso; não há promoção de temperatura/tensão simuladas a telemetria operacional.

## Interação 12 — CGEE: conferência contra `painel.html`
**Achado:** o painel fonte possui seletor de exercício, replay temporal, heatmap estilo GitHub, WHY e integridade.  
**Correção:** o painel original é incorporado em `127.0.0.1:8000`, preservando a experiência fonte.

## Interação 13 — CGEE: modo nativo sem dados falsos
**Achado:** o `painel.html` possui fallback sintético para demonstração offline.  
**Correção:** a cópia nativa no Heraclitus Dashboard usa somente `/cgee-api/timeline`; runtime offline permanece offline.

## Interação 14 — Identidade temporal global
**Achado:** a antiga `TemporalSpine` foi retirada da shell e o `TimeMachine` R8 era visualmente fraco.  
**Correção:** a tela temporal volta como **Temporal Reconstruction Workbench**, com LIVE, AS OF, COMPARE, REPLAY, cursor e playback.

## Interação 15 — Heatmap estilo GitHub
**Achado:** o gráfico mais distintivo do dashboard antigo existia no `Temporal Explorer`, porém alimentado por `GOLDEN_DEMO`.  
**Correção:** restaurado um mapa de 52 semanas/364 dias alimentado exclusivamente por `/security/events?limit=5000`.

## Interação 16 — Duas barras temporais
**Achado:** a sensação de “tempo andando” havia desaparecido.  
**Correção:** playback atualiza simultaneamente `Eventos percorridos` e `Intervalo LSN percorrido`, junto com o heatmap e a tabela do recorte.

## Interação 17 — Autenticação no arranque
**Achado:** `LoginModal` só abria por clique manual em `Conectar`.  
**Correção:** `LoginModal.bootstrap()` testa o Core no `DOMContentLoaded`. Se houver `401/403`, o modal de autenticação abre automaticamente.

## Interação 18 — `.env` versus login do navegador
**Achado:** existiam dois modelos, mas a UI não explicava a diferença.  
**Correção:** se o servidor detecta `HERACLITUS_REST_USERNAME/PASSWORD`, o badge mostra `Core: autenticado (.env)`; se a credencial for ausente/inválida, a autenticação manual é solicitada.

## Interação 19 — Erro de autenticação versus Core offline
**Achado:** a UX colapsava autenticação e indisponibilidade na mesma percepção de “sem ligação”.  
**Correção:** `RuntimeMonitor` diferencia `auth` e emite `hera:auth-required`. O header mostra `autenticação necessária` para credenciais e mantém estados de rede/timeout separados.

## Interação 20 — Fronteiras, CSP e regressão
**Achado:** frames de runtimes originários exigem política explícita; permitir frame arbitrário seria uma regressão de segurança.  
**Correção:** CSP aceita frames somente nos três runtimes loopback configurados. O proxy geral permanece GET-only, credenciais Core continuam isoladas e CI ganhou contratos R9 para hierarquia de Casos, fidelidade dos projetos, timeline, auth e isolamento.

## Arquitetura R9

```text
HeraclitusDB
├── Dados
├── Casos
│   ├── Catálogo de casos
│   ├── LABRA-AGU
│   │   ├── Alertas de Fraude
│   │   ├── Mapa de Relações
│   │   ├── Emitir Diretriz
│   │   ├── Heraclitus Explorer
│   │   └── runtime original :8770
│   ├── AEB-STREAM
│   │   └── dashboard orbital original :7480
│   └── CGEE
│       └── painel de integridade original :8000
├── Investigar
│   └── Linha do tempo / Temporal Reconstruction Workbench
├── Evidência
├── Agent Black Box
├── Sentinel
├── Governança
└── Sistema
```

## Regra de fidelidade para próximos casos

Um novo projeto não entra como “cartão de marketing”. Antes de integrar, deve-se:
1. fixar o commit fonte;
2. inventariar a árvore do projeto;
3. identificar a UI/runtime originário;
4. reproduzir ou incorporar a interface originária;
5. distinguir demo, simulação e dado vivo;
6. manter credenciais e mutações na fronteira correta;
7. criar contratos CI específicos para o caso.

## Critério de aceite

R9 só deve ser mergeado se passarem: sintaxe JavaScript, contratos de produto, contratos de shell/UI, sintaxe Python e testes do host local. O merge também exige conferir que `main` publique a release `2026.09.14-r9`.
