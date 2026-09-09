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
function factLsn(row) {
  const value = row.lsn ?? row.at_lsn ?? row.last_seen_lsn;
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function investigation(parent, entries) {
  const p = panel('Reconstituição dos fatos');
  p.append(element('p', 'Ordem pelo horário do fato em UTC. LSN representa a ordem de conhecimento no banco; não é uma conversão da data. Relações apresentadas são as declaradas nos registros, não causalidade inferida.', 'notice'));
  const controls = element('div', null, 'timeline-controls'), previous = element('button','← Anterior'), next = element('button','Próximo →'), position = element('span');
  controls.append(previous,position,next);
  const evidence = element('div'), historical = panel('Estado conhecido e mudanças no log');
  let cursor=0, version=0;
  const lsns=entries.map(e=>factLsn(e.row)).filter(v=>v!==null);
  const compare=element('button','Consultar estado histórico e comparar A/B');
  const output=element('div');
  historical.append(element('p','Comparação das projeções SOC entre os LSN mínimo e máximo deste recorte. Não representa todo o banco nem necessariamente o início/fim civil do dia. Consultas de listas são limitadas a 1.000 registros.', 'muted'),compare,output);
  compare.disabled=!lsns.length;
  if(!lsns.length) output.append(element('p','Os registros não fornecem LSN utilizável: reconstrução histórica indisponível.'));
  compare.onclick=async()=>{
    const revision=++version, session=auth, page=active;
    compare.disabled=true;output.replaceChildren(element('p','Consultando projeções históricas…'));
    const start=Math.min(...lsns),end=Math.max(...lsns);
    const paths=[`/security/events/counts?as_of_lsn=${start}`,`/security/events/counts?as_of_lsn=${end}`,`/sentinel/incidents?as_of_lsn=${end}&limit=1000`,`/cases?as_of_lsn=${end}`];
    const results=await Promise.allSettled(paths.map(path=>api(path)));
    if(revision!==version||auth!==session||active!==page||!parent.isConnected) return;
    output.replaceChildren();compare.disabled=false;
    output.append(element('p',`Conhecimento em A = LSN ${start}; B = LSN ${end}. Eventos com LSN em (A, B] são acréscimos no log, não necessariamente alterações de uma entidade.`));
    results.forEach((result,i)=>{const d=element('details');d.append(element('summary',paths[i]),element('pre',result.status==='fulfilled'?JSON.stringify(result.value,null,2):result.reason.message));output.append(d);});
    if(results[0].status==='fulfilled'&&results[1].status==='fulfilled') {
      const changes=[];
      function diff(a,b,path='counts') { if(typeof a==='number'&&typeof b==='number') {if(a!==b) changes.push({campo:path,antes:a,depois:b,delta:b-a});return;} if(a&&b&&typeof a==='object'&&typeof b==='object') for(const key of new Set([...Object.keys(a),...Object.keys(b)])) {if(!(key in a)||!(key in b)) changes.push({campo:path+'.'+key,antes:a[key]??null,depois:b[key]??null});else diff(a[key],b[key],path+'.'+key);} }
      diff(results[0].value.counts,results[1].value.counts);
      output.append(element('h4','Mudanças nas contagens SOC'),element('pre',JSON.stringify(changes,null,2)),element('p','Contagem igual não prova ausência de mudanças. Consulte as evidências originais.', 'muted'));
    }
  };
  function paint() {
    const {row,time}=entries[cursor];position.textContent=`Fato ${cursor+1} de ${entries.length}`;
    previous.disabled=cursor===0;next.disabled=cursor===entries.length-1;
    evidence.replaceChildren(element('h4',`${new Date(time).toISOString()} · ${row.kind ?? row.category ?? row.activity ?? 'Registro'}`),element('p',`Fonte: ${summary(row.source ?? row.datasource_id ?? row.agent_id)} · LSN: ${fmt(factLsn(row))}`));
    const open=element('button','Abrir evidência original');open.onclick=()=>showDetail(row);evidence.append(open);
    for(const key of ['parents','relations','edges','incident_id','evidence','proof','forge']) if(row[key]!=null) {const d=element('details');d.append(element('summary',key),element('pre',JSON.stringify(row[key],null,2)));evidence.append(d);}
    evidence.append(element('pre',JSON.stringify(row,null,2)));
  }
  previous.onclick=()=>{if(cursor>0)cursor--;paint();};next.onclick=()=>{if(cursor<entries.length-1)cursor++;paint();};
  const chronology=element('details');chronology.append(element('summary','Cronologia completa do recorte'));
  entries.forEach(({row,time},i)=>{const button=element('button',`${i+1} · ${new Date(time).toISOString()} · ${summary(row.source ?? row.datasource_id ?? row.agent_id)} · ${row.kind ?? row.category ?? 'Registro'}`);button.onclick=()=>{cursor=i;paint();};chronology.append(button);});
  p.append(controls,evidence,chronology,historical);parent.append(p);paint();
}
// Calendar and A/B selection describe only this response, never the whole log.
function timeline(parent, original) {
  const entries = original.map(row => {
    const raw = row.timestamp ?? row.observed_at ?? row.created_at ?? row.time ?? row.ts;
    const time = typeof raw === 'string' ? Date.parse(raw) : (Number.isSafeInteger(raw) && raw > 0 && raw <= 8640000000000000 ? raw : NaN);
    return {row, time};
  }).filter(e => Number.isFinite(e.time)).sort((a,b) => a.time-b.time);
  if (!entries.length) { table(parent, original); return; }
  const box = panel('Linha do tempo · janela A → B');
  box.append(element('p', 'Recorte local da resposta carregada, não um replay nem uma verificação de integridade. Calendário em UTC; registros sem data válida ficam fora do gráfico.', 'muted'));
  const readout = element('p', '', 'timeline-readout');
  const calendar = element('div', null, 'timeline-calendar');
  const chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chart.setAttribute('viewBox', '0 0 1000 220'); chart.setAttribute('class', 'timeline-chart');
  chart.setAttribute('role', 'img'); chart.setAttribute('aria-label', 'Eventos acumulados na resposta e limites A e B');
  function svg(tag, attrs) { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k,v] of Object.entries(attrs)) node.setAttribute(k, String(v)); chart.append(node); return node; }
  const x = i => 25 + i * 950 / Math.max(1, entries.length-1);
  svg('polyline', {points: entries.map((_,i) => `${x(i)},${195-(i+1)*170/entries.length}`).join(' '), class:'timeline-line'});
  const shade = svg('rect', {y:20,height:175,class:'timeline-window'});
  const markA = svg('line', {y1:15,y2:200,class:'timeline-marker timeline-a'});
  const markB = svg('line', {y1:15,y2:200,class:'timeline-marker timeline-b'});
  const controls = element('div', null, 'timeline-controls');
  function slider(name, value) { const label = element('label', name), input = element('input'); input.type='range'; input.min='0'; input.max=String(entries.length-1); input.step='1'; input.value=String(value); input.disabled=entries.length===1; input.setAttribute('aria-label', name); label.append(input); controls.append(label); return input; }
  const a=slider('A · Início',0), b=slider('B · Fim',entries.length-1);
  const reset=element('button','Todo o intervalo'); controls.append(reset);
  const results=element('div');
  const days=new Map();
  entries.forEach((entry,i) => { const key=new Date(entry.time).toISOString().slice(0,10); if(!days.has(key)) days.set(key,[]); days.get(key).push(i); });
  // Bounded calendar: most recent 371 UTC days, with real dates rather than a fixed year.
  const last=Math.floor(entries.at(-1).time/86400000)*86400000;
  const first=Math.max(Math.floor(entries[0].time/86400000)*86400000,last-370*86400000);
  const cells=[];
  for(let day=first;day<=last;day+=86400000) {
    const key=new Date(day).toISOString().slice(0,10), indices=days.get(key)||[];
    const cell=element('button','',`timeline-day level-${Math.min(4,indices.length)}`);
    cell.title=`${key} · ${indices.length} eventos na resposta`;
    cell.setAttribute('aria-label',cell.title); cell.disabled=!indices.length;
    cell.onclick=()=>{a.value=String(indices[0]);b.value=String(indices.at(-1));paint();};
    calendar.append(cell); cells.push({cell,indices});
  }
  function paint(changed) {
    let start=Number(a.value),end=Number(b.value);
    if(start>end) { if(changed===a) end=start; else start=end; }
    a.value=String(start); b.value=String(end);
    readout.textContent=`A: ${new Date(entries[start].time).toISOString()} → B: ${new Date(entries[end].time).toISOString()} · ${end-start+1}/${entries.length} eventos com data · ${original.length-entries.length} sem data válida`;
    for(const [mark,i] of [[markA,start],[markB,end]]) { mark.setAttribute('x1',x(i));mark.setAttribute('x2',x(i)); }
    shade.setAttribute('x',x(start));shade.setAttribute('width',Math.max(2,x(end)-x(start)));
    cells.forEach(({cell,indices})=>cell.classList.toggle('selected',indices.some(i=>i>=start&&i<=end)));
    results.replaceChildren();investigation(results,entries.slice(start,end+1));table(results,entries.slice(start,end+1).map(e=>e.row));
  }
  a.oninput=()=>paint(a);b.oninput=()=>paint(b);
  reset.onclick=()=>{a.value='0';b.value=String(entries.length-1);paint();};
  box.append(readout,calendar,element('p','Calendário: últimos 371 dias disponíveis · menos → mais eventos', 'muted'),chart,controls,results);
  parent.append(box);paint();
  const undated=original.filter(row=>!entries.some(e=>e.row===row));
  if(undated.length) { const details=element('details');details.append(element('summary',`${undated.length} registros sem data reconhecida`));table(details,undated);parent.append(details); }
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
    else { const rows = rowsOf(data); if (['events','incidents','actions'].includes(active)) timeline(p, rows); else table(p, rows); if (!rows.length && Object.keys(data).length) { const details = element('details'), s = element('summary', 'Ver resposta e metadados da API'); details.append(s, element('pre', JSON.stringify(data, null, 2))); p.append(details); } }
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
