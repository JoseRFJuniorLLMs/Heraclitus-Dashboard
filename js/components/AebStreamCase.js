const REPO = 'https://github.com/JoseRFJuniorLLMs/AEB';
const SNAPSHOT = 'b8e9de466e9071a4b1c490a4faabb249dda36e9b';

const SATELLITES = [
  ['47699','AMAZONIA-1'],['44883','CBERS-4A'],['40336','CBERS-4'],
  ['25504','SCD-2'],['22490','SCD-1'],['43226','SGDC-1'],
];
const STATIONS = [
  ['Cuiabá (INPE)',-15.555,-56.069],['Cachoeira Paulista (INPE)',-22.689,-45.005],
  ['Alcântara (CLA)',-2.373,-44.396],['Barreira do Inferno (Natal)',-5.924,-35.161],
];
const ANOMALIES = [
  ['TERMICA','Temperatura de bateria fora da janela -20..45 °C','CRÍTICA'],
  ['TERMICA_SALTO','Variação térmica > 40 °C entre leituras','ALTA'],
  ['ENERGIA','Tensão solar < 30 V fora de eclipse','CRÍTICA'],
  ['ORBITA','Altitude desvia > 30 km da média','MÉDIA'],
];
const ROOT_FILES = ['README.md','pipeline.py','consulta.py','main.py','stream.py','seed_demo.py','dashboard.py','requirements.txt'];
const AGENT_FILES = ['agent/__init__.py','agent/orbit.py','agent/graph.py','agent/act_r.py','agent/anomalias.py'];
const ASSETS = ['assets/dasboard.png','assets/earth.jpg','assets/topo.png','assets/sky.png','assets/globe.gl.min.js'];

const link = path => `${REPO}/blob/${SNAPSHOT}/${path}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fileList = files => files.map(path => `<a class="aeb-file" href="${link(path)}" target="_blank" rel="noopener noreferrer"><span>${esc(path)}</span><span aria-hidden="true">↗</span></a>`).join('');

function architecture(){
  return `<div class="aeb-architecture" aria-label="Arquitetura AEB-STREAM">
    <div class="aeb-node"><span>FONTES</span><strong>CelesTrak · Space-Track · INPE</strong><small>TLE real hoje; Space-Track e feeds INPE no roadmap.</small></div><div class="aeb-arrow">→</div>
    <div class="aeb-node"><span>OS SENTIDOS</span><strong>pipeline.py</strong><small>TLE → SGP4 → geodésia → telemetria → H×S×E.</small></div><div class="aeb-arrow">→</div>
    <div class="aeb-node accent"><span>O RIO</span><strong>HeraclitusDB AEB</strong><small>Append-only, LSN, parents, Merkle, AS OF, PROVENANCE e WHY.</small></div><div class="aeb-arrow">→</div>
    <div class="aeb-node"><span>O CÉREBRO</span><strong>main.py --daemon</strong><small>Grafo temporal, detectores de anomalia e prioridade ACT-R.</small></div><div class="aeb-arrow">→</div>
    <div class="aeb-node"><span>OPERAÇÃO</span><strong>dashboard.py + stream.py</strong><small>Órbitas, estações terrenas, contactos, telemetria e alertas.</small></div>
  </div>`;
}

function latestByCatnr(data){
  const map = new Map();
  for(const row of data?.estados || []){
    const key=String(row.catnr ?? '');
    const prev=map.get(key);
    if(!prev || Number(row.lsn||0) > Number(prev.lsn||0)) map.set(key,row);
  }
  return map;
}
function angSep(la1,lo1,la2,lo2){const d=Math.PI/180;const c=Math.sin(la1*d)*Math.sin(la2*d)+Math.cos(la1*d)*Math.cos(la2*d)*Math.cos((lo1-lo2)*d);return Math.acos(Math.max(-1,Math.min(1,c)))/d;}
function rangeDeg(alt){const R=6371;return Math.acos(R/(R+Math.max(1,Number(alt)||750)))*180/Math.PI;}
function contacts(data){
  let hits=0;const latest=latestByCatnr(data);
  for(const row of latest.values()){
    if(row.lat==null||row.lon==null)continue;
    const r=rangeDeg(row.alt);
    for(const [,lat,lon] of STATIONS) if(angSep(+row.lat,+row.lon,lat,lon)<=r) hits++;
  }
  return hits;
}
function satRows(data){
  const latest=latestByCatnr(data); const defs=new Map((data?.satelites||[]).map(s=>[String(s.catnr),s]));
  return SATELLITES.map(([catnr,name])=>{
    const s=defs.get(catnr), e=latest.get(catnr);
    return `<tr><td><strong>${esc(s?.nome||name)}</strong><small>NORAD ${catnr}</small></td><td>${e?.lat==null?'—':Number(e.lat).toFixed(2)+'°'}</td><td>${e?.lon==null?'—':Number(e.lon).toFixed(2)+'°'}</td><td>${e?.alt==null?'—':Number(e.alt).toFixed(1)+' km'}</td><td>${e?.temp==null?'—':Number(e.temp).toFixed(1)+' °C'}</td><td>${e?.volt==null?'—':Number(e.volt).toFixed(1)+' V'}</td><td>${e?.eclipse?'eclipse':'sol'}</td></tr>`;
  }).join('');
}

export const AebStreamCase = {
  render(){return `<section id="aeb" class="aeb-case">
    <div class="aeb-hero"><div class="aeb-hero-copy">
      <span class="aeb-eyebrow">CASO DE USO · OPERAÇÃO ESPACIAL E PERÍCIA TEMPORAL</span>
      <div class="aeb-brand"><span class="aeb-orbit">◎</span><div><h2>AEB-STREAM</h2><p>Caixa-preta temporal para dados orbitais sobre HeraclitusDB</p></div></div>
      <p class="aeb-lead">Pipeline soberano para ingerir TLE, reconstruir órbitas, preservar proveniência e investigar anomalias de satélites brasileiros. A posição orbital vem de TLE/SGP4; a telemetria atual do PoC é simulada e está explicitamente separada do futuro feed real das estações terrenas.</p>
      <div class="aeb-actions"><a class="btn" href="${REPO}" target="_blank" rel="noopener noreferrer">Repositório fonte ↗</a><a class="btn ghost" href="${link('README.md')}" target="_blank" rel="noopener noreferrer">README versionado ↗</a><a class="btn ghost" href="http://127.0.0.1:7480" target="_blank" rel="noopener noreferrer">Dashboard AEB local ↗</a></div>
    </div><aside class="aeb-snapshot"><span>SNAPSHOT INCORPORADO</span><strong>${SNAPSHOT.slice(0,12)}</strong><small>main · JoseRFJuniorLLMs/AEB</small>
      <div class="aeb-live-grid"><div><span>Runtime AEB</span><strong id="aeb-runtime">a verificar…</strong></div><div><span>Head LSN</span><strong id="aeb-head">—</strong></div><div><span>Satélites</span><strong id="aeb-sats">—</strong></div><div><span>Leituras</span><strong id="aeb-states">—</strong></div><div><span>Anomalias</span><strong id="aeb-anoms">—</strong></div><div><span>Contactos atuais</span><strong id="aeb-hits">—</strong></div></div>
      <button class="btn ghost aeb-refresh" id="aeb-refresh" type="button">Atualizar estado</button>
    </aside></div>

    <nav class="aeb-tabs" aria-label="Seções AEB-STREAM"><button class="active" data-aeb-tab="overview">Visão do caso</button><button data-aeb-tab="geometry">Órbita & H×S×E</button><button data-aeb-tab="brain">Cérebro & anomalias</button><button data-aeb-tab="live">Operação ao vivo</button><button data-aeb-tab="project">Projeto completo</button><button data-aeb-tab="roadmap">Fontes & roadmap</button></nav>

    <div class="aeb-panel active" data-aeb-panel="overview"><div class="aeb-section-head"><div><span>ARQUITETURA</span><h3>Dos elementos orbitais à evidência temporal</h3></div><p>Separação explícita entre aquisição, log canônico, raciocínio e visualização.</p></div>${architecture()}
      <div class="aeb-summary-grid"><article><span>01</span><strong>Observar</strong><p>Busca TLE, valida cache e propaga a posição com SGP4.</p></article><article><span>02</span><strong>Projetar</strong><p>Converte posição, métricas e hierarquia em vetores S, E e H.</p></article><article><span>03</span><strong>Preservar</strong><p>OrbitState entra no log com parent ULID e proveniência.</p></article><article><span>04</span><strong>Detectar</strong><p>Grafo temporal e detectores emitem Anomalia rastreável.</p></article><article><span>05</span><strong>Reconstruir</strong><p>AS OF, PROVENANCE e WHY permitem análise posterior ao incidente.</p></article></div>
      <div class="card aeb-boundary"><h3>Limite atual do PoC</h3><p><strong>TLE/órbita:</strong> fonte CelesTrak real. <strong>Telemetria:</strong> ainda simulada por <code>simular_telemetria()</code>. Logo, alertas térmicos/elétricos demonstram a arquitetura até a substituição pelo feed operacional real; não devem ser apresentados como incidentes reais de missão.</p></div>
    </div>

    <div class="aeb-panel" data-aeb-panel="geometry"><div class="aeb-section-head"><div><span>GEOMETRIA</span><h3>Variedade produto H × S × E</h3></div><p>Cada classe de informação é representada na geometria compatível com sua estrutura.</p></div><div class="aeb-geo-grid">
      <article><span>S</span><h3>Esférico</h3><p>Posição subsatélite na esfera unitária S², derivada de latitude e longitude.</p><code>[cosφ·cosλ, cosφ·sinλ, sinφ]</code></article>
      <article><span>E</span><h3>Euclidiano</h3><p>Altitude, excentricidade, movimento médio, temperatura, tensão e corrente.</p><code>[alt, ecc, n, temp, V, I]</code></article>
      <article><span>H</span><h3>Hiperbólico</h3><p>Hierarquia Satélite → Payload → Câmera → Sensor na bola de Poincaré.</p><code>‖x‖ ∝ profundidade</code></article></div>
      <div class="aeb-flow"><strong>TLE</strong><span>→</span><strong>SGP4 / TEME</strong><span>→</span><strong>ECEF / WGS84</strong><span>→</span><strong>lat · lon · alt</strong><span>→</span><strong>sph / euc / hyp</strong><span>→</span><strong>HeraclitusDB</strong></div>
    </div>

    <div class="aeb-panel" data-aeb-panel="brain"><div class="aeb-section-head"><div><span>O CÉREBRO</span><h3>Grafo temporal + ACT-R + detectores puros</h3></div><p>Alertas são novos eventos, nunca alterações retroativas das leituras de origem.</p></div>
      <div class="table-wrap"><table class="aeb-table"><thead><tr><th>Código</th><th>Regra atual</th><th>Severidade</th></tr></thead><tbody>${ANOMALIES.map(([c,r,s])=>`<tr><td><code>${c}</code></td><td>${r}</td><td><span class="aeb-severity">${s}</span></td></tr>`).join('')}</tbody></table></div>
      <div class="aeb-cap-grid"><article><h3>SatGraph</h3><p>Reconstrói satélites e séries de OrbitState a partir do log.</p></article><article><h3>ACT-R</h3><p>Prioriza entidades mais recentemente/repetidamente referenciadas por alertas.</p></article><article><h3>Anomalia com parent</h3><p>O evento gerado aponta para o OrbitState que motivou a detecção.</p></article><article><h3>Checkpoint</h3><p>O daemon persiste o último LSN processado e pode reprocessar com <code>--reset</code>.</p></article></div>
    </div>

    <div class="aeb-panel" data-aeb-panel="live"><div class="aeb-section-head"><div><span>RUNTIME</span><h3>Estado vivo da instância AEB</h3></div><p>Dados abaixo vêm somente de <code>GET /aeb-api/data</code>, proxy read-only do dashboard AEB local em :7480.</p></div>
      <div id="aeb-live-message" class="aeb-live-message">A consultar o runtime AEB…</div>
      <div class="table-wrap"><table class="aeb-table"><thead><tr><th>Satélite</th><th>Lat</th><th>Lon</th><th>Altitude</th><th>Bateria</th><th>Painéis</th><th>Iluminação</th></tr></thead><tbody id="aeb-live-sats"><tr><td colspan="7">Runtime indisponível ou ainda não consultado.</td></tr></tbody></table></div>
      <div class="aeb-stations"><h3>Estações terrenas modeladas pelo dashboard original</h3>${STATIONS.map(([n,lat,lon])=>`<div><strong>📡 ${n}</strong><span>${lat.toFixed(3)}°, ${lon.toFixed(3)}°</span></div>`).join('')}</div>
    </div>

    <div class="aeb-panel" data-aeb-panel="project"><div class="aeb-section-head"><div><span>SNAPSHOT</span><h3>Projeto incorporado como caso de uso</h3></div><p>O código canônico permanece no repositório AEB; o Dashboard fixa a versão exibida para evitar drift.</p></div>
      <div class="aeb-file-groups"><details open><summary>Entrypoints e pipeline <span>${ROOT_FILES.length}</span></summary><div class="aeb-files">${fileList(ROOT_FILES)}</div></details><details><summary>Motor orbital e Cérebro <span>${AGENT_FILES.length}</span></summary><div class="aeb-files">${fileList(AGENT_FILES)}</div></details><details><summary>Assets do dashboard original <span>${ASSETS.length}</span></summary><div class="aeb-files">${fileList(ASSETS)}</div></details></div>
      <div class="aeb-command-grid"><article><code>python pipeline.py --grupo --once</code><span>Ingestão do catálogo brasileiro</span></article><article><code>python main.py --daemon --interval 8</code><span>Cérebro em vigília</span></article><article><code>python stream.py --accel 60 --interval 3</code><span>Simulação orbital ao vivo</span></article><article><code>python dashboard.py</code><span>Globo 3D em 127.0.0.1:7480</span></article></div>
    </div>

    <div class="aeb-panel" data-aeb-panel="roadmap"><div class="aeb-section-head"><div><span>FONTES</span><h3>O que é real hoje e o que ainda falta</h3></div><p>Sem pintar roadmap de verde por telepatia corporativa.</p></div>
      <div class="aeb-roadmap"><article class="done"><span>ATIVO</span><h3>CelesTrak GP API</h3><p>TLE real, sem autenticação, cache local com fallback offline.</p></article><article class="todo"><span>ROADMAP</span><h3>Space-Track</h3><p>Catálogo completo e detritos; requer conta/autenticação.</p></article><article class="todo"><span>ROADMAP</span><h3>INPE / CDSR</h3><p>Catálogo de imagens e metadados.</p></article><article class="todo"><span>ROADMAP</span><h3>INPE / CRC</h3><p>Passagens, rastreio e telemetria operacional real.</p></article></div>
      <div class="card aeb-roadmap-note"><h3>Próxima fronteira técnica</h3><p>Trocar a telemetria sintética pelo feed real das estações, versionar calibração por missão/sensor e manter cada observação com origem, timestamp, unidade, qualidade e referência de cadeia de custódia antes de alimentar os detectores.</p></div>
    </div>
  </section>`;},
  async refresh(){
    const msg=document.getElementById('aeb-live-message');
    try{
      const r=await fetch('/aeb-api/data',{headers:{Accept:'application/json'},cache:'no-store'});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      document.getElementById('aeb-runtime').textContent='online';
      document.getElementById('aeb-head').textContent=data.head ?? '—';
      document.getElementById('aeb-sats').textContent=(data.satelites||[]).length;
      document.getElementById('aeb-states').textContent=(data.estados||[]).length;
      document.getElementById('aeb-anoms').textContent=(data.anomalias||[]).length;
      document.getElementById('aeb-hits').textContent=contacts(data);
      const body=document.getElementById('aeb-live-sats'); if(body) body.innerHTML=satRows(data);
      if(msg) msg.textContent=`Runtime AEB online · head LSN ${data.head ?? '—'} · ${(data.estados||[]).length} leituras · ${(data.anomalias||[]).length} anomalias persistidas.`;
    }catch(err){
      document.getElementById('aeb-runtime')&&(document.getElementById('aeb-runtime').textContent='offline');
      if(msg) msg.textContent='Runtime AEB indisponível. Inicie o checkout AEB com: python3 dashboard.py';
    }
  },
  init(){
    document.querySelectorAll('[data-aeb-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.aebTab;
      document.querySelectorAll('[data-aeb-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      document.querySelectorAll('[data-aeb-panel]').forEach(p=>p.classList.toggle('active',p.dataset.aebPanel===id));
    }));
    document.getElementById('aeb-refresh')?.addEventListener('click',()=>this.refresh());
    document.addEventListener('hera:route-changed',event=>{if(event.detail?.route==='aeb')this.refresh();});
    if(location.hash==='#aeb')this.refresh();
  }
};