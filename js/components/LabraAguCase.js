const REPO = 'https://github.com/JoseRFJuniorLLMs/LABRA-AGU';
const SNAPSHOT = '9b5d9bcada759e23e12c2d995be17dca6e42a8e1';

const PATTERNS = [
  ['triangulacao_offshore', 'Quotas vendidas a entidade que nomeia procurador com plenos poderes', 'ALTA / CRÍTICA'],
  ['fracionamento', 'Transferências fracionadas abaixo do limiar de controle', 'ALTA'],
  ['laranja_familiar', 'Plenos poderes outorgados a familiar do devedor', 'ALTA'],
  ['vespera_constricao', 'Dissipação patrimonial próxima a penhora, citação ou bloqueio', 'CRÍTICA'],
  ['suborno', 'Pagamento de propina ou vantagem indevida a agente público', 'CRÍTICA'],
  ['antedatacao', 'Registro retroagido para antes do marco, editado depois dele', 'CRÍTICA'],
  ['registro_apagado', 'DELETE em change-log após marco judicial, indicando destruição de prova', 'CRÍTICA'],
];

const ROOT_FILES = [
  'README.md', 'build.py', 'consulta.py', 'directive.py', 'ingest.py', 'main.py', 'pipeline.py',
  'pyproject.toml', 'pytest.ini', 'relatorio.py', 'requirements.txt', 'serve.py', 'sources.example.json',
  'test_daemon.py', 'test_graph_timeline.py', 'test_integration.py', 'test_multibank.py',
  'test_phase2_capture.py', 'test_phase2_memory.py', 'test_phase2_nexo.py', 'test_phase2_theory.py', 'test_pipeline.py',
];

const AGENT_FILES = [
  '__init__.py', 'act_r.py', 'agent_loop.py', 'anomaly_engine.py', 'asset_shield.py', 'case_memory.py',
  'causal_chain.py', 'client.py', 'counterfactual.py', 'coverage.py', 'daemon.py', 'entities.py',
  'entity_resolution.py', 'evidence_scorer.py', 'feedback.py', 'graph.py', 'graph_timeline.py',
  'heraclitus_pb2.py', 'heraclitus_pb2_grpc.py', 'investigator.py', 'legal_mapper.py', 'litigator.py',
  'llm.py', 'llm_parser.py', 'network_analysis.py', 'orchestrator.py', 'parser.py', 'patterns.py',
  'reader.py', 'recovery.py', 'report.py', 'testing.py', 'theory_builder.py',
].map(name => `agent/${name}`);

const DASHBOARD_FILES = [
  'dashboard/src/App.jsx', 'dashboard/src/index.css', 'dashboard/src/main.jsx',
  'dashboard/src/components/AlertFeed.jsx', 'dashboard/src/components/AlertPanel.jsx',
  'dashboard/src/components/CausalGraph.jsx', 'dashboard/src/components/DirectiveForm.jsx',
  'dashboard/src/components/RelationGraph.jsx', 'dashboard/src/components/Timeline.jsx',
  'dashboard/package.json', 'dashboard/vite.config.js',
];

const DEMO_FILES = [
  'demo/README.md', 'demo/TUTORIAL_DEMO.md', 'demo/adicionar_caso.py', 'demo/demo_agente.py',
  'demo/demo_antedatacao.py', 'demo/demo_fase3.py', 'demo/gerar_cenario.py', 'demo/gerar_complexos.py',
  'demo/gerar_mega.py', 'demo/nomes.py', 'demo/report_html.py', 'demo/run.py', 'demo/sources.json',
];

const DOCS = [
  ['docs/APRESENTACAO.md', 'Apresentação'],
  ['docs/COMO_FUNCIONA.md', 'Como funciona'],
  ['docs/LABRA_AGENT_SPEC.md', 'Especificação do agente'],
  ['docs/TUTORIAL.md', 'Tutorial completo'],
  ['docs/PESQUISA_MERCADO.md', 'Pesquisa de mercado'],
  ['docs/ROTEIRO_VIDEO_NOTEBOOKLM.md', 'Roteiro NotebookLM'],
  ['docs/ROTEIRO_VIDEO_PITCH_3MIN.md', 'Roteiro de pitch'],
  ['docs/VIDEO_SCRIPT_NOTEBOOKLM_EN.md', 'Video script EN'],
  ['docs/LABRA-AGU_Digital_Forensic_Intelligence.pdf', 'Digital Forensic Intelligence · PDF'],
  ['docs/LABRA-AGU_Forensic_Engine_Blueprint.pdf', 'Forensic Engine Blueprint · PDF'],
  ['docs/LABRA-AGU__Detetive_Digital.mp4', 'Detetive Digital · vídeo'],
  ['docs/O_Detetive_Digital.mp4', 'O Detetive Digital · vídeo'],
];

const EVAL_FILES = ['evaluation/__init__.py', 'evaluation/harness.py', 'evaluation/run_eval.py', 'evaluation/scenarios.py'];

const link = path => `${REPO}/blob/${SNAPSHOT}/${path}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fileList = files => files.map(path => `<a href="${link(path)}" target="_blank" rel="noopener noreferrer" class="labra-file"><span>${esc(path)}</span><span aria-hidden="true">↗</span></a>`).join('');

function architecture() {
  return `<div class="labra-architecture" aria-label="Arquitetura LABRA-AGU">
    <div class="labra-node"><span class="labra-node-kicker">FONTES</span><strong>Oracle · MSSQL · Postgres · PDFs · DOCX · CSV · áudio · vídeo</strong><small>Dados jurídicos, patrimoniais e financeiros</small></div>
    <div class="labra-arrow" aria-hidden="true">→</div>
    <div class="labra-node"><span class="labra-node-kicker">SENTIDOS</span><strong>pipeline.py</strong><small>Ingestão multimodal, incremental e idempotente</small></div>
    <div class="labra-arrow" aria-hidden="true">→</div>
    <div class="labra-node accent"><span class="labra-node-kicker">RIO</span><strong>HeraclitusDB</strong><small>Log append-only, LSN, proveniência e cadeia de custódia</small></div>
    <div class="labra-arrow" aria-hidden="true">→</div>
    <div class="labra-node"><span class="labra-node-kicker">CÉREBRO</span><strong>Agente LABRA</strong><small>Parser → grafo → padrões → ACT-R → teoria do caso</small></div>
    <div class="labra-arrow" aria-hidden="true">→</div>
    <div class="labra-node"><span class="labra-node-kicker">PROCURADORIA</span><strong>DIRETRIZ + laudo</strong><small>Ordens auditáveis, insights e peça com rastreabilidade</small></div>
  </div>`;
}

function capabilities() {
  const groups = [
    ['Ingestão & custódia', ['Bancos SQL via SQLAlchemy', 'Pastas monitoradas', 'PDF/DOCX/CSV/TXT/ZIP', 'Áudio e vídeo', 'CDC UPDATE/DELETE', 'Checkpoints idempotentes', 'ULID e PROVENANCE no HeraclitusDB']],
    ['Entidades & grafo', ['Normalização e validação CPF/CNPJ', 'Entity resolution determinística', 'ER fuzzy para quase duplicados', 'Grafo de caso acumulativo', 'Timeline do grafo por LSN', 'Correlação multi-fonte e multi-documento']],
    ['Detecção & raciocínio', ['Catálogo determinístico de fraude', 'Anomaly engine indutivo', 'ACT-R com boost por diretriz', 'Cadeia causal', 'Contrafactuais', 'Evidence scoring', 'Legal mapper', 'Theory builder', 'LLM local/opcional com fallback determinístico']],
    ['Recuperação de ativos', ['Asset shield patterns', 'Redes entre casos', 'Facilitadores partilhados', 'Comunidades/anéis', 'Quantificação de valor dissipado', 'Fila priorizada por valor × severidade × prova', 'Loop de feedback por padrão']],
    ['Produto jurídico', ['Consulta GQL auditada', 'Relatório pericial em Markdown', 'Narrativa e matriz probatória', 'Minuta jurídica', 'Daemon event-sourcing', 'Reconstrução no arranque e deduplicação pelo log']],
    ['Superfície LABRA', ['Alertas de Fraude', 'Mapa de Relações', 'Emitir Diretriz', 'Heraclitus Explorer', 'Grafo causal', 'Timeline / Rio de Eventos', 'Console web local em :8770']],
  ];
  return groups.map(([title, items]) => `<article class="labra-cap-card"><h3>${esc(title)}</h3><ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></article>`).join('');
}

function docsGrid() {
  return DOCS.map(([path, label]) => `<a class="labra-doc-card" href="${link(path)}" target="_blank" rel="noopener noreferrer"><span class="labra-doc-type">${path.endsWith('.pdf') ? 'PDF' : path.endsWith('.mp4') ? 'VÍDEO' : 'DOC'}</span><strong>${esc(label)}</strong><small>${esc(path)}</small></a>`).join('');
}

export const LabraAguCase = {
  render() {
    return `<section id="labra" class="labra-case">
      <div class="labra-hero">
        <div class="labra-hero-copy">
          <span class="labra-eyebrow">CASO DE USO · RECUPERAÇÃO DE ATIVOS</span>
          <div class="labra-brandline"><span class="labra-shield" aria-hidden="true">L</span><div><h2>LABRA-AGU</h2><p>Agente de IA Pericial e Investigativo sobre HeraclitusDB</p></div></div>
          <p class="labra-lead">Aplicação especializada para rastreamento patrimonial, correlação multi-fonte, detecção de blindagem e construção de evidência auditável. O pipeline ingere sem opinar; o agente investiga sem tocar nas fontes; a Procuradoria emite diretrizes como eventos rastreáveis.</p>
          <div class="labra-actions">
            <a class="btn" href="${REPO}" target="_blank" rel="noopener noreferrer">Repositório fonte ↗</a>
            <a class="btn ghost" href="${link('docs/TUTORIAL.md')}" target="_blank" rel="noopener noreferrer">Tutorial ↗</a>
            <a class="btn ghost" href="http://127.0.0.1:8770" target="_blank" rel="noopener noreferrer">Console LABRA local ↗</a>
          </div>
        </div>
        <aside class="labra-snapshot" aria-label="Snapshot incorporado">
          <span>SNAPSHOT INCORPORADO</span><strong>${SNAPSHOT.slice(0, 12)}</strong><small>main · LABRA-AGU</small>
          <div class="labra-live-grid">
            <div><span>Runtime LABRA</span><strong id="labra-runtime">a verificar…</strong></div>
            <div><span>Gemma local</span><strong id="labra-gemma">—</strong></div>
            <div><span>Heraclitus do caso</span><strong id="labra-db">—</strong></div>
            <div><span>Devedores no log</span><strong id="labra-debtors">—</strong></div>
          </div>
          <button class="btn ghost labra-refresh" id="labra-refresh" type="button">Atualizar estado</button>
        </aside>
      </div>

      <nav class="labra-tabs" aria-label="Seções LABRA-AGU">
        <button type="button" class="active" data-labra-tab="overview">Visão do caso</button>
        <button type="button" data-labra-tab="engine">Motor investigativo</button>
        <button type="button" data-labra-tab="patterns">Padrões de fraude</button>
        <button type="button" data-labra-tab="operation">Operação</button>
        <button type="button" data-labra-tab="evaluation">Avaliação</button>
        <button type="button" data-labra-tab="project">Projeto completo</button>
        <button type="button" data-labra-tab="docs">Documentação</button>
      </nav>

      <div class="labra-tab-panel active" data-labra-panel="overview">
        <div class="labra-section-head"><div><span>ARQUITETURA</span><h3>Os sentidos, o rio e o cérebro</h3></div><p>Separação explícita entre aquisição, prova canônica e raciocínio.</p></div>
        ${architecture()}
        <div class="labra-summary-grid">
          <article><span>01</span><strong>Ingerir</strong><p>Dados heterogêneos entram pelo pipeline com checkpoints e referência de origem.</p></article>
          <article><span>02</span><strong>Preservar</strong><p>O HeraclitusDB recebe eventos append-only e sustenta replay, proveniência e AS OF.</p></article>
          <article><span>03</span><strong>Correlacionar</strong><p>Entidades normalizadas e relações de múltiplas fontes formam um grafo de caso.</p></article>
          <article><span>04</span><strong>Investigar</strong><p>Padrões, ACT-R, anomalias, cadeia causal, rede e teoria do caso priorizam o trabalho.</p></article>
          <article><span>05</span><strong>Provar</strong><p>Insight, fontes, pais, ULIDs e relatório mantêm a trilha de como a conclusão foi obtida.</p></article>
        </div>
        <div class="card labra-boundary"><h3>Fronteira probatória</h3><p>Este caso de uso herda a regra do HeraclitusDB: integridade do registro e proveniência não equivalem automaticamente à veracidade do fato no mundo. A força probatória depende também da qualidade e origem da fonte, tratada pelo <code>evidence_scorer.py</code>.</p></div>
      </div>

      <div class="labra-tab-panel" data-labra-panel="engine">
        <div class="labra-section-head"><div><span>CAPACIDADES</span><h3>Motor investigativo completo</h3></div><p>Mapa funcional reconstruído do repositório LABRA-AGU.</p></div>
        <div class="labra-cap-grid">${capabilities()}</div>
      </div>

      <div class="labra-tab-panel" data-labra-panel="patterns">
        <div class="labra-section-head"><div><span>DETECÇÃO</span><h3>Catálogo explícito de padrões</h3></div><p>Regras determinísticas convivem com anomalias, redes, contrafactuais e feedback.</p></div>
        <div class="table-wrap"><table class="labra-pattern-table"><thead><tr><th>Padrão</th><th>O que procura</th><th>Severidade declarada</th></tr></thead><tbody>${PATTERNS.map(([p,d,s]) => `<tr><td><code>${esc(p)}</code></td><td>${esc(d)}</td><td><span class="labra-severity">${esc(s)}</span></td></tr>`).join('')}</tbody></table></div>
        <div class="labra-feature-strip"><div><strong>Asset Shield</strong><span>doação cruzada · holding/usufruto · offshore em cascata · beneficiário final</span></div><div><strong>Cobertura BR</strong><span>renda × patrimônio · contrato direcionado · cripto · mula financeira</span></div><div><strong>Histórico CDC</strong><span>antedatação e destruição de prova dependem do histórico, não só do estado atual</span></div></div>
      </div>

      <div class="labra-tab-panel" data-labra-panel="operation">
        <div class="labra-section-head"><div><span>SUPERFÍCIE OPERACIONAL</span><h3>O produto LABRA dentro da plataforma</h3></div><p>As superfícies do dashboard React/Vite original aparecem aqui como um caso de uso do HeraclitusDB.</p></div>
        <div class="labra-op-grid">
          <article><span class="labra-op-index">01</span><h3>Alertas de Fraude</h3><p>Feed de descobertas, severidade, contexto, evidência e priorização.</p><small>Origem: <code>AlertFeed.jsx</code> + <code>AlertPanel.jsx</code></small></article>
          <article><span class="labra-op-index">02</span><h3>Mapa de Relações</h3><p>Grafo de pessoas, empresas, offshores, transações e relações causais.</p><small>Origem: <code>RelationGraph.jsx</code></small></article>
          <article><span class="labra-op-index">03</span><h3>Diretrizes</h3><p>Ordens da Procuradoria entram como eventos auditáveis e podem elevar a ativação ACT-R de alvos.</p><small>Origem: <code>DirectiveForm.jsx</code> / <code>directive.py</code></small></article>
          <article><span class="labra-op-index">04</span><h3>Heraclitus Explorer</h3><p>Descobertas recentes, geometria causal e rio de eventos em uma visão investigativa.</p><small>Origem: <code>CausalGraph.jsx</code> + <code>Timeline.jsx</code></small></article>
        </div>
        <div class="grid k2 labra-live-section">
          <div class="card"><h3>Runtime local · somente leitura</h3><p class="nota">Se <code>python serve.py --no-open</code> estiver rodando no LABRA-AGU, o Dashboard consulta <code>/health</code> e <code>/devedores</code> via proxy local. Investigar, emitir diretriz ou alterar dados continuam fora desta console geral read-only.</p><div id="labra-live-message" class="labra-live-message">Aguardando verificação.</div></div>
          <div class="card"><h3>Devedores observados no log</h3><div id="labra-debtors-list" class="labra-debtors-list"><span class="muted">Runtime LABRA ainda não consultado.</span></div></div>
        </div>
      </div>

      <div class="labra-tab-panel" data-labra-panel="evaluation">
        <div class="labra-section-head"><div><span>QUALIFICAÇÃO</span><h3>Detecção medida, não apenas afirmada</h3></div><p>O repositório contém harness, cenários rotulados, gates e testes ponta a ponta.</p></div>
        <div class="labra-eval-grid"><article><strong>63</strong><span>testes unitários declarados no README do snapshot</span></article><article><strong>≥ 0,90</strong><span>gate declarado de recall</span></article><article><strong>0 FP</strong><span>gate declarado para cenários negativos do harness</span></article><article><strong>E2E</strong><span>custódia · daemon · pipeline · multi-banco</span></article></div>
        <div class="labra-cap-grid"><article class="labra-cap-card"><h3>Harness</h3><p><code>evaluation/harness.py</code> calcula resultados contra cenários rotulados.</p></article><article class="labra-cap-card"><h3>Cenários</h3><p><code>evaluation/scenarios.py</code> contém positivos e negativos com padrões esperados.</p></article><article class="labra-cap-card"><h3>Gate</h3><p><code>test_eval_gate.py</code>, descrito no README do projeto, impede degradação silenciosa da detecção.</p></article><article class="labra-cap-card"><h3>E2E real</h3><p>Os testes sobem instâncias Heraclitus isoladas para validar custódia, idempotência e correlação multi-fonte.</p></article></div>
      </div>

      <div class="labra-tab-panel" data-labra-panel="project">
        <div class="labra-section-head"><div><span>SNAPSHOT DO REPOSITÓRIO</span><h3>Projeto incorporado como mapa navegável</h3></div><p>Arquivos relevantes do snapshot ${SNAPSHOT.slice(0,12)} permanecem rastreáveis ao código fonte.</p></div>
        <div class="labra-file-groups">
          <details open><summary>Raiz · entrypoints, configuração e E2E <span>${ROOT_FILES.length}</span></summary><div class="labra-files">${fileList(ROOT_FILES)}</div></details>
          <details><summary>agent/ · motor investigativo <span>${AGENT_FILES.length}</span></summary><div class="labra-files">${fileList(AGENT_FILES)}</div></details>
          <details><summary>dashboard/ · produto React/Vite <span>${DASHBOARD_FILES.length}</span></summary><div class="labra-files">${fileList(DASHBOARD_FILES)}</div></details>
          <details><summary>demo/ · cenários, relatórios e demonstrações <span>${DEMO_FILES.length}</span></summary><div class="labra-files">${fileList(DEMO_FILES)}</div></details>
          <details><summary>evaluation/ · avaliação quantitativa <span>${EVAL_FILES.length}</span></summary><div class="labra-files">${fileList(EVAL_FILES)}</div></details>
          <details><summary>Outras árvores do projeto</summary><div class="labra-tree-pills"><span>.github/workflows</span><span>docs/</span><span>img/</span><span>proto/</span><span>tests/</span><span>windows/</span><span>demo/demo_data/</span><span>dashboard/public/</span><span>dashboard/src/assets/</span></div></details>
        </div>
        <p class="nota">“Incorporado” aqui significa que o Heraclitus Dashboard expõe a arquitetura, capacidades, superfícies, avaliação, documentação e mapa do código LABRA como caso de uso versionado. O repositório LABRA continua sendo a fonte canônica de implementação, evitando uma cópia divergente de centenas de arquivos.</p>
      </div>

      <div class="labra-tab-panel" data-labra-panel="docs">
        <div class="labra-section-head"><div><span>DOCUMENTAÇÃO & MÍDIA</span><h3>Material do projeto</h3></div><p>Documentos e mídias do snapshot fonte, acessíveis a partir do caso de uso.</p></div>
        <div class="labra-doc-grid">${docsGrid()}</div>
      </div>
    </section>`;
  },

  init() {
    const root = document.getElementById('labra');
    if (!root) return;
    root.querySelector('.labra-tabs')?.addEventListener('click', event => {
      const button = event.target.closest('[data-labra-tab]');
      if (!button) return;
      const tab = button.dataset.labraTab;
      root.querySelectorAll('[data-labra-tab]').forEach(item => item.classList.toggle('active', item === button));
      root.querySelectorAll('[data-labra-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.labraPanel === tab));
    });
    document.getElementById('labra-refresh')?.addEventListener('click', () => this.loadLive());
    document.addEventListener('hera:route-changed', event => {
      if (event.detail?.route === 'labra') this.loadLive();
    });
    this.loadLive();
  },

  async loadLive() {
    const runtime = document.getElementById('labra-runtime');
    const gemma = document.getElementById('labra-gemma');
    const db = document.getElementById('labra-db');
    const debtors = document.getElementById('labra-debtors');
    const message = document.getElementById('labra-live-message');
    const list = document.getElementById('labra-debtors-list');
    if (!runtime || !gemma || !db || !debtors || !message || !list) return;
    runtime.textContent = 'a verificar…'; gemma.textContent = '—'; db.textContent = '—'; debtors.textContent = '—';
    try {
      const [healthResponse, debtorsResponse] = await Promise.all([
        fetch('/labra-api/health', { headers: { Accept: 'application/json' } }),
        fetch('/labra-api/devedores', { headers: { Accept: 'application/json' } }),
      ]);
      if (!healthResponse.ok) throw new Error(`health ${healthResponse.status}`);
      const health = await healthResponse.json();
      const observed = debtorsResponse.ok ? await debtorsResponse.json() : null;
      runtime.textContent = 'online';
      gemma.textContent = health.gemma ? 'ligado' : 'offline / fallback';
      const rows = Array.isArray(observed) ? observed : [];
      const dbOkay = Array.isArray(observed);
      db.textContent = dbOkay ? 'conectado' : 'indisponível';
      debtors.textContent = dbOkay ? String(rows.length) : '—';
      message.textContent = dbOkay ? 'LABRA respondeu e reconstruiu a lista de devedores a partir do HeraclitusDB.' : 'Runtime LABRA respondeu, mas os dados do HeraclitusDB do caso não foram obtidos.';
      list.replaceChildren();
      if (!rows.length) {
        const empty = document.createElement('span'); empty.className = 'muted'; empty.textContent = dbOkay ? 'Nenhum devedor retornado pelo log.' : 'Sem lista disponível.'; list.appendChild(empty); return;
      }
      rows.slice(0, 30).forEach(row => {
        const item = document.createElement('div'); item.className = 'labra-debtor';
        const copy = document.createElement('span'); copy.textContent = row.nome || row.id || '—';
        const meta = document.createElement('strong'); meta.textContent = `${row.n ?? 0} fraude(s)`;
        item.append(copy, meta); list.appendChild(item);
      });
    } catch (_error) {
      runtime.textContent = 'offline'; gemma.textContent = '—'; db.textContent = '—'; debtors.textContent = '—';
      message.textContent = 'O snapshot do caso está disponível, mas o runtime LABRA local em :8770 não está ativo. Inicie o LABRA-AGU com “python serve.py --no-open” para estado vivo.';
      list.innerHTML = '<span class="muted">Runtime LABRA offline.</span>';
    }
  },
};
