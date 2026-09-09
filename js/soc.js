const $ = (s) => document.querySelector(s);
const pages = {
  overview: ['Visão operacional', '/stats'],
  posture: ['Postura SOC', '/sentinel/dashboard'],
  events: ['Eventos de segurança', '/security/events'],
  incidents: ['Incidentes Sentinel', '/sentinel/incidents'],
  actions: ['Ações e aprovações', '/sentinel/actions'],
  sensors: ['Saúde dos sensores', '/telemetry/health'],
  sources: ['Fontes de dados', '/fontes'],
  cases: ['Casos e investigação', '/cases'],
  integrity: ['Integridade e conformidade', '/compliance/status'],
  storage: ['Estado do banco', '/state'],
};
let auth = '', paused = false, requestId = 0, data = null, source = '', stamp = null, previous = null, rate = null;
let active = 'overview';
const history = [];
const fmt = (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', {maximumFractionDigits: 2}) : v == null ? '—' : String(v);
function element(tag, text, cls) { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
function notice(text, error = false) { $('#notice').textContent = text; $('#notice').className = error ? 'notice error' : 'notice'; }
function empty(parent, title, text) { const e = element('div', null, 'empty'); e.append(element('strong', title), element('span', text)); parent.append(e); }
function panel(title) { const e = element('div', null, 'panel'); e.append(element('h3', title)); return e; }
async function api(path) {
  const response = await fetch('/api' + path, {headers: {Authorization: auth}, cache: 'no-store', signal: AbortSignal.timeout(path === '/verify' ? 65000 : 18000)});
  const body = await response.json();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.message || body.error || 'Consulta indisponível'}`);
  return body;
}
function queryPath() {
  const query = new URLSearchParams();
  const asof = $('#asof').value;
  if (asof && ['events', 'incidents', 'actions', 'sensors', 'cases'].includes(active)) query.set('as_of_lsn', asof);
  if (['events', 'incidents', 'actions'].includes(active)) query.set('limit', $('#limit').value);
  if (['events', 'incidents'].includes(active) && $('#severity').value) query.set('min_severity', $('#severity').value);
  return pages[active][1] + (query.size ? '?' + query : '');
}
function rowsOf(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['events', 'incidents', 'actions', 'sensors', 'cases', 'sources', 'fontes', 'items']) if (Array.isArray(value[key])) return value[key];
  return [];
}
function summary(value) { return value && typeof value === 'object' ? JSON.stringify(value) : fmt(value); }
function showDetail(value) {
  $('#detail-title').textContent = 'Registro original · ' + pages[active][0];
  $('#detail-json').textContent = JSON.stringify(value, null, 2);
  $('#detail-actions').replaceChildren();
  const id = value?.incident_id || value?.id;
  if (active === 'incidents' && typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)) {
    for (const [suffix, label] of [['evidence', 'Evidências'], ['why', 'Explicação causal']]) {
      const button = element('button', label);
      button.onclick = async () => { button.disabled = true; try { $('#detail-json').textContent = JSON.stringify(await api(`/sentinel/incidents/${encodeURIComponent(id)}/${suffix}`), null, 2); } catch (e) { $('#detail-json').textContent = e.message; } finally { button.disabled = false; } };
      $('#detail-actions').append(button);
    }
  }
  if (!$('#detail').open) $('#detail').showModal();
}
function table(parent, original) {
  const search = $('#search').value.toLocaleLowerCase();
  const rows = original.filter((row) => JSON.stringify(row).toLocaleLowerCase().includes(search));
  if (!rows.length) return empty(parent, original.length ? 'Nenhum registro neste filtro' : 'Nenhum registro retornado', original.length ? 'Altere a busca local; ela se aplica apenas à resposta carregada.' : 'Instância nova, filtro sem resultados ou fonte ainda não conectada. Nenhuma ocorrência é fabricada.');
  const columns = [...new Set(rows.flatMap((r) => r && typeof r === 'object' && !Array.isArray(r) ? Object.keys(r) : ['registro']))].slice(0, 7);
  const wrap = element('div', null, 'table-wrap'), t = element('table'), head = element('tr');
  columns.forEach((col) => head.append(element('th', col.replaceAll('_', ' ')))); head.append(element('th', 'Evidência'));
  const thead = element('thead'); thead.append(head); t.append(thead); const tbody = element('tbody');
  for (const row of rows) {
    const tr = element('tr');
    columns.forEach((col) => { const value = col === 'registro' ? row : row[col]; const td = element('td'); const text = summary(value); td.append(element('span', text.length > 160 ? text.slice(0, 160) + '…' : text, /severity|severidade/.test(col) ? `pill ${Number(value) >= 8 ? 'high' : ''}` : '')); tr.append(td); });
    const td = element('td'), button = element('button', 'Detalhes'); button.onclick = () => showDetail(row); td.append(button); tr.append(td); tbody.append(tr);
  }
  t.append(tbody); wrap.append(t); parent.append(wrap, element('p', `${rows.length} exibidos / ${original.length} retornados. Limite de consulta não equivale ao total do banco.`, 'muted'));
}
function render() {
  const view = $('#view'); view.replaceChildren();
  if (data == null) return empty(view, 'Aguardando consulta', 'Conecte-se e atualize para consultar dados reais.');
  if (active === 'overview') {
    const cards = element('div', null, 'cards');
    for (const [label, value, field] of [['Head do log (LSN)', data.head, '/stats · head'], ['Ingestão / segundo', rate, 'Δ head / Δ tempo nesta sessão'], ['Eventos na memtable', data.memtable, '/stats · memtable'], ['Índice de texto', data.text_indexed, '/stats · text_indexed']]) {
      const c = element('div', null, 'card'); c.append(element('div', label, 'label'), element('strong', fmt(value)), element('small', field)); cards.append(c);
    }
    view.append(cards);
    const split = element('div', null, 'split'), chart = panel('Ingestão observada nesta sessão'), indexes = panel('Cobertura dos índices');
    if (!history.length) empty(chart, 'Aguardando segunda medição', 'A taxa não é inferida de uma única amostra.');
    for (const sample of history.slice(-8)) { const row = element('div', null, 'bar-row'), bar = element('progress'); bar.max = Math.max(1, ...history.map(s => s.rate)); bar.value = sample.rate; row.append(element('span', sample.time), bar, element('span', fmt(sample.rate))); chart.append(row); }
    for (const field of ['vector_indexed', 'text_indexed', 'graph_nodes', 'tgraph_edges', 'entity_keys', 'activation_tracked']) { const row = element('div', null, 'bar-row'); row.append(element('span', field), element('span', ''), element('strong', fmt(data[field]))); indexes.append(row); }
    split.append(chart, indexes); view.append(split);
    if (data.head === 0) empty(view, 'Banco novo: log vazio', 'Nenhuma carga anterior foi migrada. Conecte os coletores ou importe dados com um fluxo validado.');
  } else if (active === 'posture') {
    const cards = element('div', null, 'cards');
    for (const [label, value] of [['Nível reportado', data.threat_level], ['Incidentes ativos', data.active_incidents], ['Incidentes críticos', data.critical_incidents]]) { const c = element('div', null, 'card'); c.append(element('div', label, 'label'), element('strong', fmt(value)), element('small', '/sentinel/dashboard')); cards.append(c); }
    view.append(cards, element('p', 'A classificação é calculada pelo Sentinel sobre incidentes conhecidos. “normal” em uma instância vazia não significa ambiente protegido. Contagem crítica pode incluir incidentes históricos.', 'notice'));
    const status = panel('Estado do pipeline de detecção'); status.append(element('pre', JSON.stringify(data.status, null, 2))); view.append(status);
    const incidents = panel('Incidentes conhecidos'); table(incidents, rowsOf(data)); view.append(incidents);
  } else if (active === 'integrity') {
    const p = panel('Verificação criptográfica sob demanda');
    p.append(element('p', 'A verificação relê os segmentos. Não é executada por temporizador e não constitui certificação jurídica ou teste de queda de energia.', 'muted'));
    const button = element('button', 'Verificar integridade do log'), output = element('pre', 'Ainda não verificado nesta sessão.');
    button.onclick = async () => { button.disabled = true; output.textContent = 'Verificando…'; try { output.textContent = JSON.stringify(await api('/verify'), null, 2); } catch(e) { output.textContent = e.message; } finally { button.disabled = false; } };
    p.append(button, output); view.append(p); const report = panel('Estado de conformidade reportado pelo banco'); report.append(element('pre', JSON.stringify(data, null, 2))); view.append(report);
  } else {
    const p = panel(pages[active][0]);
    if (active === 'storage') p.append(element('pre', JSON.stringify(data, null, 2)));
    else { const rows = rowsOf(data); table(p, rows); if (!rows.length && Object.keys(data).length) { const details = element('details'), s = element('summary', 'Ver resposta e metadados da API'); details.append(s, element('pre', JSON.stringify(data, null, 2))); p.append(details); } }
    view.append(p);
    if (active === 'actions') view.append(element('p', 'Consulta de propostas, aprovações e resultados. Aprovar ou executar ações externas não está habilitado neste painel.', 'notice'));
  }
  view.append(element('div', 'Fonte: ' + source, 'source'));
}
async function load() {
  if (!auth) return;
  const id = ++requestId, path = queryPath(); $('#refresh').disabled = true;
  try {
    const start = performance.now(), result = await api(path);
    if (id !== requestId) return;
    data = result; source = path; stamp = new Date();
    if (active === 'overview') { const time = performance.now(); rate = previous && Number.isSafeInteger(data.head) && data.head >= previous.head ? (data.head - previous.head) / ((time - previous.time) / 1000) : null; previous = {head: data.head, time}; if (rate != null) { history.push({rate, time: stamp.toLocaleTimeString()}); if (history.length > 60) history.shift(); } }
    $('#connection').textContent = 'Conectado · ' + Math.round(performance.now() - start) + ' ms';
    notice(active === 'overview' ? 'Telemetria atual do banco. Head do log não é contagem de incidentes SOC.' : 'Consulta real carregada. Filtros e limites podem restringir a resposta; ausência de registros não prova ausência de ameaças.');
    $('#freshness').textContent = `Atualizado em ${stamp.toLocaleString()} · ${active === 'overview' && !paused ? 'Visão geral atualiza a cada 15 s' : 'Atualização manual nesta área'}`;
    render();
  } catch (error) {
    if (id !== requestId) return;
    data = null; $('#connection').textContent = 'Consulta indisponível'; notice(error.message, true); $('#freshness').textContent = 'Nenhum resultado atual disponível'; render();
  } finally { if (id === requestId) $('#refresh').disabled = false; }
}
function navigate() {
  active = location.hash.slice(1) in pages ? location.hash.slice(1) : 'overview'; requestId++; data = null; $('#title').textContent = pages[active][0];
  document.querySelectorAll('nav a').forEach(a => { a.classList.toggle('active', a.hash === '#' + active); if(a.hash === '#' + active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#severity').disabled = !['events', 'incidents'].includes(active); $('#asof').disabled = !['events', 'incidents', 'actions', 'sensors', 'cases'].includes(active); $('#limit').disabled = !['events', 'incidents', 'actions'].includes(active);
  render(); load();
}
Object.entries(pages).forEach(([key, [label]]) => { const a = element('a', label); a.href = '#' + key; $('#nav').append(a); });
$('#login-form').onsubmit = async event => {
  event.preventDefault(); const bytes = new TextEncoder().encode($('#username').value + ':' + $('#password').value); auth = 'Basic ' + btoa(String.fromCharCode(...bytes)); $('#password').value = ''; $('#login-error').textContent = '';
  try { await api('/stats'); $('#login').close(); navigate(); } catch (error) { auth = ''; $('#login-error').textContent = error.message; }
};
$('#logout').onclick = () => { auth = ''; data = null; previous = null; history.length = 0; requestId++; $('#connection').textContent = 'Desconectado'; $('#freshness').textContent = ''; $('#detail-json').textContent = ''; $('#detail-actions').replaceChildren(); $('#detail').close(); notice('Sessão encerrada. Conecte-se novamente para consultar dados.'); render(); $('#login').showModal(); };
$('#refresh').onclick = load;
$('#pause').onclick = () => { paused = !paused; $('#pause').textContent = paused ? 'Retomar' : 'Pausar'; $('#pause').setAttribute('aria-pressed', String(paused)); };
$('#search').oninput = render;
for (const id of ['severity', 'asof', 'limit']) $('#' + id).onchange = load;
$('#close-detail').onclick = () => $('#detail').close();
$('#export').onclick = () => { if (!data) return notice('Nenhuma resposta disponível para exportar.', true); const blob = new Blob([JSON.stringify({source, retrieved_at: stamp.toISOString(), local_filter: $('#search').value, response: data}, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob), a = element('a'); a.href = url; a.download = `heraclitus-${active}-${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
window.addEventListener('hashchange', navigate);
setInterval(() => { if (auth && !paused && !document.hidden && active === 'overview' && !$('#refresh').disabled) load(); }, 15000);
navigate(); $('#login').showModal();
