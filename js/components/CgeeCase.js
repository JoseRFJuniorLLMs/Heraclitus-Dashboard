const REPO = 'https://github.com/JoseRFJuniorLLMs/CGEE';
const SNAPSHOT = '31951717036bd39d9bc898a80686f3907ffd8699';

const ROOT_FILES = [
  'README.md', 'SPEC.md', 'app.py', 'ingest_amostra.py', 'main.py', 'painel.html', 'painel_server.py',
];
const IMAGE_FILES = ['img/0.png','img/1.png','img/2.png','img/3.png','img/4.png','img/5.png','img/6.png'];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link = path => `${REPO}/blob/${SNAPSHOT}/${path}`;
const fmtInt = value => Number(value || 0).toLocaleString('pt-BR');
const fmtMoney = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const toDate = value => {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};
const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

function fileLinks(files) {
  return files.map(path => `<a class="cgee-file" href="${link(path)}" target="_blank" rel="noopener noreferrer"><span>${esc(path)}</span><span aria-hidden="true">↗</span></a>`).join('');
}

function architecture() {
  return `<div class="cgee-architecture" aria-label="Arquitetura do caso CGEE">
    <div class="cgee-node"><span>FONTE OFICIAL</span><strong>SIOP · Alterações orçamentárias</strong><small>CSV de créditos, instrumentos legais, órgãos, ações e valores</small></div>
    <div class="cgee-arrow" aria-hidden="true">→</div>
    <div class="cgee-node"><span>INGESTÃO</span><strong>ingest_amostra.py</strong><small>Ordenação cronológica, normalização e append de AlteracaoOrcamentaria</small></div>
    <div class="cgee-arrow" aria-hidden="true">→</div>
    <div class="cgee-node accent"><span>REGISTRO CANÔNICO</span><strong>HeraclitusDB</strong><small>LSN, log append-only, consulta temporal e verificação de integridade</small></div>
    <div class="cgee-arrow" aria-hidden="true">→</div>
    <div class="cgee-node"><span>ANÁLISE</span><strong>AS OF · WHY · Merkle</strong><small>Reconstituição histórica, rastreio da alteração e consistência criptográfica</small></div>
    <div class="cgee-arrow" aria-hidden="true">→</div>
    <div class="cgee-node"><span>DECISÃO</span><strong>Painel de integridade</strong><small>Exercício, linha do tempo viva, heatmap e inspeção de portarias</small></div>
  </div>`;
}

function capabilities() {
  const items = [
    ['Linha do tempo viva','Reprodução progressiva do histórico e seleção AS OF por LSN/data.'],
    ['Heatmap estilo GitHub','Concentração diária das alterações orçamentárias, reconstruída com o avanço temporal.'],
    ['Exercícios 2023–2026','Carga multi-exercício prevista pelo projeto e filtro temporal por ano.'],
    ['WHY por action_id','Localização da alteração/portaria e ponto de entrada para investigação causal.'],
    ['Merkle / verify','Verificação da consistência do log pelo SDK, sem alterar o dado canônico.'],
    ['SIOP real','O ingest_amostra.py usa as colunas reais val_acrescimo e val_reducao do CSV.'],
    ['Event sourcing','Cada AlteracaoOrcamentaria é anexada em ordem cronológica ao log.'],
    ['Painel offline','O painel original tem modo demo; esta integração deliberadamente não o usa como dado operacional.'],
  ];
  return items.map(([title,desc]) => `<article class="cgee-cap"><strong>${esc(title)}</strong><p>${esc(desc)}</p></article>`).join('');
}

function dataBoundary() {
  return `<div class="cgee-boundary-grid">
    <article class="real"><span>REAL / FONTE</span><strong>CSV SIOP</strong><p>O script de amostra lê alterações orçamentárias reais e calcula <code>val_acrescimo - val_reducao</code>.</p></article>
    <article class="sealed"><span>CANÔNICO</span><strong>HeraclitusDB</strong><p>Depois do append, o evento recebe LSN e passa a integrar o log consultável e verificável.</p></article>
    <article class="demo"><span>DEMONSTRAÇÃO</span><strong>Fallback do painel original</strong><p>O HTML original possui dados sintéticos para demo quando o banco cai. Aqui eles não são tratados como runtime real.</p></article>
  </div>`;
}

export const CgeeCase = {
  events: [],
  year: null,
  timer: null,
  loaded: false,

  render() {
    return `<section id="cgee" class="cgee-case">
      <div class="cgee-hero">
        <div class="cgee-hero-copy">
          <span class="cgee-eyebrow">CASO DE USO · INTEGRIDADE ORÇAMENTÁRIA E VIAGEM NO TEMPO</span>
          <div class="cgee-brand"><span class="cgee-mark" aria-hidden="true">C</span><div><h2>CGEE · Integridade Orçamentária</h2><p>SIOP + HeraclitusDB para reconstituição histórica, causalidade e verificação</p></div></div>
          <p class="cgee-lead">Caso de uso para transformar alterações orçamentárias em eventos cronológicos verificáveis. O destaque é a navegação temporal: exercício, reprodução do log, <strong>heatmap diário estilo GitHub</strong>, inspeção por LSN e busca por portaria.</p>
          <div class="cgee-actions"><a class="btn" href="${REPO}" target="_blank" rel="noopener noreferrer">Repositório fonte ↗</a><a class="btn ghost" href="${link('painel.html')}" target="_blank" rel="noopener noreferrer">Painel original ↗</a><a class="btn ghost" href="http://127.0.0.1:8000" target="_blank" rel="noopener noreferrer">Runtime local ↗</a></div>
        </div>
        <aside class="cgee-status" aria-label="Estado do caso CGEE">
          <span>SNAPSHOT INCORPORADO</span><strong>${SNAPSHOT.slice(0,12)}</strong><small>main · CGEE</small>
          <div class="cgee-live-grid">
            <div><span>Runtime CGEE</span><strong id="cgee-runtime">não sondado</strong></div>
            <div><span>Heraclitus do caso</span><strong id="cgee-db">—</strong></div>
            <div><span>Eventos carregados</span><strong id="cgee-count">—</strong></div>
            <div><span>Integridade</span><strong id="cgee-integrity">sob demanda</strong></div>
          </div>
          <button class="btn ghost cgee-refresh" id="cgee-refresh" type="button">Atualizar runtime</button>
        </aside>
      </div>

      <nav class="cgee-tabs" aria-label="Seções do caso CGEE">
        <button type="button" class="active" data-cgee-tab="overview">Visão do caso</button>
        <button type="button" data-cgee-tab="timeline">Linha do tempo viva</button>
        <button type="button" data-cgee-tab="why">WHY & integridade</button>
        <button type="button" data-cgee-tab="ingest">Ingestão SIOP</button>
        <button type="button" data-cgee-tab="project">Projeto completo</button>
      </nav>

      <div class="cgee-panel active" data-cgee-panel="overview">
        <div class="cgee-section-head"><div><span>ARQUITETURA</span><h3>Orçamento público como fluxo temporal verificável</h3></div><p>O estado atual deixa de ser a única verdade consultável. Cada alteração permanece reconstituível pelo log.</p></div>
        ${architecture()}
        <div class="cgee-cap-grid">${capabilities()}</div>
        ${dataBoundary()}
      </div>

      <div class="cgee-panel" data-cgee-panel="timeline">
        <div class="cgee-section-head"><div><span>AS OF / REPLAY</span><h3>Linha do tempo + heatmap estilo GitHub</h3></div><p>Esta superfície usa apenas eventos retornados pelo runtime CGEE. Sem runtime, não fabrica histórico.</p></div>
        <div class="cgee-temporal card">
          <div class="cgee-temporal-toolbar">
            <div><span class="cgee-mini-label">EXERCÍCIO</span><div class="cgee-years" id="cgee-years"><span class="muted">aguardando runtime…</span></div></div>
            <button class="btn" id="cgee-play" type="button">▶ Reproduzir</button>
            <div class="cgee-asof"><span>AS OF LSN</span><strong id="cgee-asof-lsn">—</strong><small id="cgee-asof-date">—</small></div>
          </div>
          <input id="cgee-slider" class="cgee-slider" type="range" min="0" max="100" value="100" aria-label="Posição temporal do caso CGEE">
          <div class="cgee-progress-grid">
            <article><div><span>Eventos acumulados</span><strong id="cgee-progress-events">—</strong></div><div class="cgee-bar"><i id="cgee-bar-events"></i></div></article>
            <article><div><span>Volume líquido acumulado</span><strong id="cgee-progress-value">—</strong></div><div class="cgee-bar value"><i id="cgee-bar-value"></i></div></article>
          </div>
          <div id="cgee-heatmaps" class="cgee-heatmaps"><div class="cgee-empty">Inicie o runtime CGEE para reconstruir o heatmap com eventos do banco.</div></div>
        </div>
        <div class="card cgee-table-card"><div class="cgee-table-head"><strong>Eventos no recorte temporal</strong><span id="cgee-visible-count">0 eventos</span></div><div class="table-wrap"><table><thead><tr><th>LSN</th><th>Data</th><th>Portaria / ação</th><th>Órgão</th><th>Tipo</th><th>Valor</th></tr></thead><tbody id="cgee-event-rows"><tr><td colspan="6" class="muted">Sem runtime carregado.</td></tr></tbody></table></div></div>
      </div>

      <div class="cgee-panel" data-cgee-panel="why">
        <div class="cgee-section-head"><div><span>INSPEÇÃO</span><h3>WHY por portaria + verificação criptográfica</h3></div><p>O endpoint WHY atual localiza o evento pelo <code>action_id</code>; a profundidade causal depende do backend do caso.</p></div>
        <div class="cgee-why-grid">
          <article class="card"><h3>Localizar alteração</h3><p>Use um <code>action_id</code> existente na timeline.</p><div class="cgee-query"><input id="cgee-why-input" type="text" placeholder="Ex.: PORTARIA-123-2026" autocomplete="off"><button class="btn" id="cgee-why-button" type="button">Investigar WHY</button></div><div id="cgee-why-result" class="cgee-result muted">Nenhuma consulta executada.</div></article>
          <article class="card"><h3>Escudo de integridade</h3><p>Executa a verificação real exposta pelo runtime CGEE. Não simula adulteração.</p><div class="cgee-shield" id="cgee-shield"><span aria-hidden="true">◇</span><strong>não verificado</strong><small>verificação sob demanda</small></div><button class="btn" id="cgee-verify" type="button">Verificar log agora</button></article>
        </div>
      </div>

      <div class="cgee-panel" data-cgee-panel="ingest">
        <div class="cgee-section-head"><div><span>PIPELINE</span><h3>SIOP → AlteracaoOrcamentaria</h3></div><p>O script de amostra corrige o mapeamento de valor do carregador inicial e é a referência mais segura do snapshot.</p></div>
        <div class="cgee-ingest-grid">
          <article><span>01</span><strong>Ler CSV SIOP</strong><p>CSV separado por <code>;</code>, encoding latin1 e datas oficiais do instrumento legal.</p></article>
          <article><span>02</span><strong>Calcular mutação</strong><p><code>val_acrescimo - val_reducao</code>, preservando sinal e exercício.</p></article>
          <article><span>03</span><strong>Ordenar</strong><p>Eventos classificados cronologicamente antes do append.</p></article>
          <article><span>04</span><strong>Append</strong><p><code>AlteracaoOrcamentaria</code> entra no HeraclitusDB e recebe LSN.</p></article>
          <article><span>05</span><strong>Verificar</strong><p><code>db.verify()</code> valida a consistência do log após a carga.</p></article>
        </div>
        <div class="card cgee-schema"><h3>Evento representado</h3><pre>{
  "kind": "AlteracaoOrcamentaria",
  "attributes": {
    "action_id": "...",
    "ano": 2026,
    "orgao": "...",
    "acao_orcamentaria": "...",
    "valor": 0.0,
    "tipo_alteracao": "...",
    "data_oficial": "YYYY-MM-DD HH:MM:SS"
  }
}</pre></div>
      </div>

      <div class="cgee-panel" data-cgee-panel="project">
        <div class="cgee-section-head"><div><span>SNAPSHOT ${SNAPSHOT.slice(0,12)}</span><h3>Projeto CGEE incorporado como referência versionada</h3></div><p>O código-fonte continua canônico no repositório CGEE. O Dashboard não cria uma segunda cópia divergente.</p></div>
        <div class="cgee-project-grid"><details open><summary>Entrypoints e especificação <span>${ROOT_FILES.length}</span></summary><div class="cgee-files">${fileLinks(ROOT_FILES)}</div></details><details><summary>Imagens do painel <span>${IMAGE_FILES.length}</span></summary><div class="cgee-files">${fileLinks(IMAGE_FILES)}</div></details></div>
        <div class="cgee-project-notes"><article><strong>painel_server.py</strong><p>Servidor stdlib em <code>:8000</code>, com <code>/api/stats</code>, <code>/api/timeline</code>, <code>/api/verify</code> e <code>/api/why</code>.</p></article><article><strong>painel.html</strong><p>Interface offline com reprodução temporal, seletor de exercício, heatmap estilo GitHub e WHY visual.</p></article><article><strong>app.py</strong><p>Protótipo Streamlit alternativo ligado diretamente ao SDK gRPC.</p></article></div>
      </div>
    </section>`;
  },

  init() {
    const root = document.getElementById('cgee');
    if (!root) return;
    root.querySelectorAll('[data-cgee-tab]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-cgee-tab]').forEach(b => b.classList.toggle('active', b === button));
      root.querySelectorAll('[data-cgee-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.cgeePanel === button.dataset.cgeeTab));
      if (button.dataset.cgeeTab === 'timeline') this.ensureLoaded();
    }));
    root.querySelector('#cgee-refresh')?.addEventListener('click', () => this.loadRuntime(true));
    root.querySelector('#cgee-slider')?.addEventListener('input', event => this.updateTemporal(Number(event.target.value)));
    root.querySelector('#cgee-play')?.addEventListener('click', () => this.togglePlay());
    root.querySelector('#cgee-verify')?.addEventListener('click', () => this.verify());
    root.querySelector('#cgee-why-button')?.addEventListener('click', () => this.why());
    root.querySelector('#cgee-why-input')?.addEventListener('keydown', event => { if (event.key === 'Enter') this.why(); });
    root.querySelector('#cgee-years')?.addEventListener('click', event => {
      const button = event.target.closest('[data-cgee-year]');
      if (!button) return;
      this.year = button.dataset.cgeeYear === 'all' ? null : Number(button.dataset.cgeeYear);
      this.renderYears();
      const slider = root.querySelector('#cgee-slider');
      if (slider) slider.value = '100';
      this.updateTemporal(100);
    });
    document.addEventListener('hera:route-changed', event => {
      if (event.detail?.route === 'cgee') this.ensureLoaded();
      else if (this.timer) this.stopPlay();
    });
    if (location.hash === '#cgee') this.ensureLoaded();
  },

  async request(path) {
    const response = await fetch(path, {headers:{Accept:'application/json'}, cache:'no-store'});
    let payload = {};
    try { payload = await response.json(); } catch { payload = {}; }
    if (!response.ok) throw new Error(payload.message || payload.erro || `HTTP ${response.status}`);
    return payload;
  },

  async ensureLoaded() {
    if (!this.loaded) await this.loadRuntime(false);
  },

  async loadRuntime(force=false) {
    const root = document.getElementById('cgee');
    if (!root) return;
    const runtime = root.querySelector('#cgee-runtime');
    const db = root.querySelector('#cgee-db');
    if (runtime) runtime.textContent = 'consultando…';
    try {
      const [stats, timeline] = await Promise.all([
        this.request('/cgee-api/stats'),
        this.request('/cgee-api/timeline?limit=2500'),
      ]);
      if (runtime) runtime.textContent = stats.online === false ? 'offline' : 'online';
      if (db) db.textContent = stats.online === false ? 'indisponível' : 'conectado';
      const raw = Array.isArray(timeline.eventos) ? timeline.eventos : [];
      this.events = raw.map((event,index) => ({...event,_date:toDate(event.data_oficial),_index:index})).filter(event => event._date).sort((a,b) => a._date-b._date || Number(a.lsn||0)-Number(b.lsn||0));
      const years = [...new Set(this.events.map(event => event._date.getFullYear()))].sort((a,b)=>a-b);
      if (this.year === null && years.length) this.year = years.at(-1);
      this.loaded = true;
      root.querySelector('#cgee-count').textContent = fmtInt(this.events.length);
      this.renderYears();
      this.updateTemporal(Number(root.querySelector('#cgee-slider')?.value || 100));
    } catch (error) {
      this.loaded = false;
      this.events = [];
      if (runtime) runtime.textContent = 'offline';
      if (db) db.textContent = 'indisponível';
      root.querySelector('#cgee-count').textContent = '0';
      root.querySelector('#cgee-years').innerHTML = '<span class="muted">runtime indisponível</span>';
      root.querySelector('#cgee-heatmaps').innerHTML = `<div class="cgee-empty">CGEE não respondeu. Inicie <code>python3 painel_server.py</code> no checkout do projeto. Nenhum dado sintético foi injetado.</div>`;
      root.querySelector('#cgee-event-rows').innerHTML = '<tr><td colspan="6" class="muted">Runtime CGEE indisponível.</td></tr>';
      if (force) root.querySelector('#cgee-runtime').title = error.message;
    }
  },

  filteredEvents() {
    return this.year === null ? this.events : this.events.filter(event => event._date.getFullYear() === this.year);
  },

  renderYears() {
    const host = document.querySelector('#cgee-years');
    if (!host) return;
    const years = [...new Set(this.events.map(event => event._date.getFullYear()))].sort((a,b)=>a-b);
    if (!years.length) { host.innerHTML = '<span class="muted">sem eventos</span>'; return; }
    host.innerHTML = `<button type="button" data-cgee-year="all" class="${this.year===null?'active':''}">Todos</button>${years.map(year => `<button type="button" data-cgee-year="${year}" class="${this.year===year?'active':''}">${year}</button>`).join('')}`;
  },

  updateTemporal(percent=100) {
    const root = document.getElementById('cgee');
    if (!root) return;
    const events = this.filteredEvents();
    const count = events.length ? Math.max(1, Math.ceil(events.length * Math.max(0,Math.min(100,percent))/100)) : 0;
    const visible = events.slice(0,count);
    const last = visible.at(-1);
    const totalAbs = events.reduce((sum,event)=>sum+Math.abs(Number(event.valor)||0),0);
    const visibleNet = visible.reduce((sum,event)=>sum+(Number(event.valor)||0),0);
    const visibleAbs = visible.reduce((sum,event)=>sum+Math.abs(Number(event.valor)||0),0);
    root.querySelector('#cgee-asof-lsn').textContent = last?.lsn ?? '—';
    root.querySelector('#cgee-asof-date').textContent = last?._date?.toLocaleDateString('pt-BR') || '—';
    root.querySelector('#cgee-progress-events').textContent = `${fmtInt(visible.length)} / ${fmtInt(events.length)}`;
    root.querySelector('#cgee-progress-value').textContent = fmtMoney(visibleNet);
    root.querySelector('#cgee-bar-events').style.width = `${events.length ? visible.length/events.length*100 : 0}%`;
    root.querySelector('#cgee-bar-value').style.width = `${totalAbs ? Math.min(100,visibleAbs/totalAbs*100) : 0}%`;
    root.querySelector('#cgee-visible-count').textContent = `${fmtInt(visible.length)} eventos`;
    this.renderHeatmaps(visible, events);
    this.renderRows(visible.slice(-14).reverse());
  },

  renderRows(rows) {
    const tbody = document.querySelector('#cgee-event-rows');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="6" class="muted">Sem eventos no recorte.</td></tr>'; return; }
    tbody.innerHTML = rows.map(event => `<tr><td><code>${esc(event.lsn ?? '—')}</code></td><td>${esc(event._date?.toLocaleDateString('pt-BR') || '—')}</td><td>${esc(event.action_id || '—')}</td><td>${esc(event.orgao || '—')}</td><td>${esc(event.tipo_alteracao || '—')}</td><td class="num">${esc(fmtMoney(event.valor))}</td></tr>`).join('');
  },

  renderHeatmaps(visible, all) {
    const host = document.querySelector('#cgee-heatmaps');
    if (!host) return;
    const years = this.year === null ? [...new Set(all.map(event=>event._date.getFullYear()))].sort((a,b)=>a-b) : [this.year];
    if (!years.length) { host.innerHTML = '<div class="cgee-empty">Sem eventos temporais.</div>'; return; }
    const visibleCounts = new Map();
    for (const event of visible) visibleCounts.set(dayKey(event._date),(visibleCounts.get(dayKey(event._date))||0)+1);
    host.innerHTML = years.map(year => {
      const yearEvents = all.filter(event=>event._date.getFullYear()===year);
      const totalCounts = new Map();
      for (const event of yearEvents) totalCounts.set(dayKey(event._date),(totalCounts.get(dayKey(event._date))||0)+1);
      const max = Math.max(1,...totalCounts.values());
      const start = new Date(year,0,1), end = new Date(year,11,31);
      const cells = Array.from({length:start.getDay()},()=>'<span class="cgee-hm-cell blank"></span>');
      for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
        const key=dayKey(d), n=visibleCounts.get(key)||0, total=totalCounts.get(key)||0;
        const level=n===0?0:Math.max(1,Math.min(4,Math.ceil(n/max*4)));
        const future=total>0&&n===0&&visible.length<all.length?' future':'';
        cells.push(`<span class="cgee-hm-cell l${level}${future}" title="${esc(d.toLocaleDateString('pt-BR'))}: ${n} de ${total} alterações visíveis"></span>`);
      }
      return `<div class="cgee-heatmap-year"><div class="cgee-heatmap-title"><strong>${year}</strong><span>${fmtInt(yearEvents.length)} eventos no exercício</span></div><div class="cgee-hm-wrap"><div class="cgee-weekdays"><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span></div><div class="cgee-hm-grid">${cells.join('')}</div></div><div class="cgee-hm-legend"><span>menos</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>mais</span></div></div>`;
    }).join('');
  },

  togglePlay() {
    if (this.timer) return this.stopPlay();
    const slider = document.querySelector('#cgee-slider');
    if (!slider || !this.filteredEvents().length) return;
    if (Number(slider.value) >= 100) slider.value = '0';
    const button = document.querySelector('#cgee-play');
    if (button) button.textContent = '■ Parar';
    this.timer = window.setInterval(() => {
      const next = Math.min(100, Number(slider.value)+2);
      slider.value = String(next);
      this.updateTemporal(next);
      if (next >= 100) this.stopPlay();
    }, 130);
  },

  stopPlay() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
    const button = document.querySelector('#cgee-play');
    if (button) button.textContent = '▶ Reproduzir';
  },

  async verify() {
    const root = document.getElementById('cgee');
    const shield = root?.querySelector('#cgee-shield');
    const status = root?.querySelector('#cgee-integrity');
    if (!shield) return;
    shield.className = 'cgee-shield checking';
    shield.innerHTML = '<span>◇</span><strong>verificando…</strong><small>consulta ao runtime CGEE</small>';
    try {
      const data = await this.request('/cgee-api/verify');
      const ok = data.integro === true;
      shield.className = `cgee-shield ${ok?'ok':'bad'}`;
      shield.innerHTML = `<span>${ok?'✓':'!'}</span><strong>${ok?'log íntegro':'falha de integridade'}</strong><small>resultado retornado por db.verify()</small>`;
      if (status) status.textContent = ok?'íntegro':'falha';
    } catch (error) {
      shield.className = 'cgee-shield unknown';
      shield.innerHTML = `<span>?</span><strong>indisponível</strong><small>${esc(error.message)}</small>`;
      if (status) status.textContent = 'indisponível';
    }
  },

  async why() {
    const input = document.querySelector('#cgee-why-input');
    const output = document.querySelector('#cgee-why-result');
    const id = input?.value.trim();
    if (!output || !id) return;
    output.className = 'cgee-result';
    output.textContent = 'consultando…';
    try {
      const data = await this.request(`/cgee-api/why?portaria=${encodeURIComponent(id)}`);
      const event = data.evento || {};
      output.innerHTML = `<div class="cgee-why-event"><div><span>LSN</span><strong>${esc(event.lsn ?? '—')}</strong></div><div><span>Data</span><strong>${esc(event.data_oficial ?? '—')}</strong></div><div><span>Órgão</span><strong>${esc(event.orgao ?? '—')}</strong></div><div><span>Valor</span><strong>${esc(fmtMoney(event.valor))}</strong></div></div><p><strong>${esc(event.action_id || id)}</strong> · ${esc(event.tipo_alteracao || 'Alteração orçamentária')} · ação ${esc(event.acao_orcamentaria || '—')}</p><small>Implementação do snapshot: o endpoint localiza o evento pelo action_id. Uma cadeia causal mais profunda exige o backend causal do Heraclitus/LABRA, não é inventada pela UI.</small>`;
    } catch (error) {
      output.className = 'cgee-result error';
      output.textContent = `Não encontrado ou runtime indisponível: ${error.message}`;
    }
  },
};
