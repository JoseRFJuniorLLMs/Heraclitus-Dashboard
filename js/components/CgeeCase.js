// CGEE — Painel de Integridade Orçamentária (gov.br / SIOP)
// Implementação integral e fiel de https://github.com/JoseRFJuniorLLMs/CGEE

export const CgeeCase = {
  initialized: false,

  render() {
    return `
      <section id="cgee" class="cgee-case">
<div class="govbar">
  <div class="in">
    <span class="logo">gov<span class="br">.br</span></span>
    <span class="ent">Ministério do Planejamento e Orçamento · SIOP</span>
    <span class="sp"></span>
    <span class="muted">Sistema Integrado de Planejamento e Orçamento</span>
  </div>
  <div class="acc"></div>
</div>

<header class="hero">
  <svg class="wave" viewBox="0 0 1320 200" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,120 C220,60 360,180 660,120 C960,60 1100,180 1320,120 L1320,200 L0,200 Z" fill="#ffffff"/>
    <path d="M0,150 C260,100 420,200 660,150 C940,100 1120,200 1320,150 L1320,200 L0,200 Z" fill="#9fc0ff"/>
  </svg>
  <div class="in">
    <div class="brand">
      <div class="eyebrow">Integridade Orçamentária · Auditoria Imutável</div>
      <h1>Painel HeraclitusDB</h1>
      <div class="sub">Linha do tempo viva do orçamento federal — créditos e alterações com prova criptográfica.</div>
      <div class="panta">πάντα ῥεῖ — nenhum fraudador reescreve um rio que já correu.</div>
    </div>
    <div class="status">
      <span class="pill demo" id="statusPill"><span class="dot"></span><span id="statusTxt">MODO DEMONSTRAÇÃO</span></span>
      <div class="meta">Engine: Rust bare-metal · gRPC <b>127.0.0.1:7474</b><br/>REST <b>:7475</b> · Geometria H³²⊗S⁸⊗E⁸</div>
    </div>
  </div>
</header>

<main>
  <section class="grid kpis" id="kpis" style="margin-bottom:16px"></section>

  <div id="anoBar" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px">
    <span class="muted" style="font-weight:700;font-size:13px">EXERCÍCIO ORÇAMENTÁRIO:</span>
    <span id="anoPills" style="display:flex;gap:8px;flex-wrap:wrap"></span>
  </div>

  <section class="card" id="tlCard" style="margin-bottom:16px">
    <div class="hd"><span class="sec-ico">⏳</span><h2>1 · Linha do Tempo Viva &amp; Viagem no Tempo</h2><span class="tag">AS OF LSN</span><button class="fsbtn" id="tlFs">⛶ Tela cheia</button></div>
    <div class="bd">
      <div class="tl-top">
        <div class="muted">Arraste — ou <b>reproduza</b> — para reconstruir o estado do orçamento em qualquer ponto do log imutável.</div>
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-azul" id="playBtn" style="padding:7px 16px">▶ Reproduzir</button>
          <div>AS OF LSN <span class="asof" id="asofLsn">—</span> · <span class="asof" id="asofData">—</span></div>
        </div>
      </div>
      <div style="overflow-x:auto;padding-bottom:4px" id="hmWrap"><div id="hmChart"></div></div>
      <div style="display:flex;align-items:center;gap:5px;justify-content:flex-end;font-size:11px;color:var(--txt-mut);margin:2px 2px 14px">
        Menos
        <span style="width:12px;height:12px;border-radius:3px;background:#ebedf0;display:inline-block"></span>
        <span style="width:12px;height:12px;border-radius:3px;background:#9be9a8;display:inline-block"></span>
        <span style="width:12px;height:12px;border-radius:3px;background:#40c463;display:inline-block"></span>
        <span style="width:12px;height:12px;border-radius:3px;background:#30a14e;display:inline-block"></span>
        <span style="width:12px;height:12px;border-radius:3px;background:#216e39;display:inline-block"></span>
        Mais
      </div>
      <div class="svgwrap" id="tlChart"></div>
      <div class="slider-wrap">
        <div class="row"><span id="tlStart">—</span><span>progresso do log append-only</span><span id="tlEnd">—</span></div>
        <input type="range" id="asof" min="1" max="100" value="100" />
      </div>
      <div class="grid kpis" id="tlKpis" style="margin:10px 0"></div>
      <div class="scroll"><table id="tlTable"><thead><tr>
        <th>LSN</th><th>Data oficial</th><th>Portaria</th><th>Órgão beneficiário</th><th>Tipo</th><th class="num">Valor (R$)</th>
      </tr></thead><tbody></tbody></table></div>
    </div>
  </section>

  <div class="grid" style="grid-template-columns:1.4fr 1fr;align-items:start" id="mid">
    <section class="card" id="whyCard">
      <div class="hd"><span class="sec-ico" style="background:#0c326f">🔎</span><h2>2 · Inspetor Causal — WHY</h2><span class="tag">Proveniência</span><button class="fsbtn" id="whyFs">⛶ Tela cheia</button></div>
      <div class="bd">
        <div class="why-input">
          <input id="whyInput" placeholder="Cole o nº da portaria (ex.: PM-196-2026)" />
          <button class="btn btn-azul" id="whyBtn">Investigar Causa Raiz</button>
        </div>
        <div class="chips" id="whyChips"></div>
        <div class="svgwrap" id="whyGraph" style="margin-top:14px"></div>
        <div id="whyDetail" class="muted" style="font-size:12px;margin-top:8px"></div>
      </div>
    </section>

    <section class="card" id="shieldCard">
      <div class="hd"><span class="sec-ico" style="background:#168821">🛡️</span><h2>3 · Escudo Forense</h2><span class="tag">Merkle · BLAKE3</span><button class="fsbtn" id="shieldFs">⛶ Tela cheia</button></div>
      <div class="bd">
        <div class="shield ok" id="shield">
          <div class="ic" id="shieldIc">🛡️</div>
          <h3 id="shieldTitle">SISTEMA ÍNTEGRO</h3>
          <p id="shieldMsg">Cadeia Merkle verificada — 100% de consistência matemática no log imutável.</p>
          <div class="blocks" id="blocks"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-out" id="verifyBtn">Executar Auditoria (verify)</button>
          <button class="btn btn-amar" id="tamperBtn">Simular Adulteração</button>
        </div>
        <div class="muted" style="font-size:12px;margin-top:10px">Recalcula as raízes BLAKE3 dos segmentos selados. Qualquer alteração fora da API oficial quebra o hash e é detectada.</div>
      </div>
    </section>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:16px" id="charts">
    <section class="card" id="orgaoCard">
      <div class="hd"><span class="sec-ico" style="background:#155bcb">🏛️</span><h2>Volume por Órgão</h2><button class="fsbtn" id="orgaoFs">⛶ Tela cheia</button></div>
      <div class="bd">
        <div class="scroll" style="max-height:320px;">
          <div class="svgwrap" id="chOrgao"></div>
        </div>
      </div>
    </section>
    <section class="card" id="anoCard">
      <div class="hd"><span class="sec-ico" style="background:#155bcb">📅</span><h2>Crédito por Exercício &amp; Tipo</h2><button class="fsbtn" id="anoFs">⛶ Tela cheia</button></div>
      <div class="bd"><div class="svgwrap" id="chAno"></div><div class="legend" id="legAno"></div></div>
    </section>
  </div>

  <div class="grid" style="grid-template-columns:1.3fr 1fr;margin-top:16px">
    <section class="card" id="feedCard">
      <div class="hd"><span class="sec-ico" style="background:#0c326f">🌊</span><h2>Fluxo de Eventos (mais recentes)</h2><span class="tag">append-only</span><button class="fsbtn" id="feedFs">⛶ Tela cheia</button></div>
      <div class="bd"><ul class="feed" id="feed"></ul></div>
    </section>
    <section class="card" id="engineCard">
      <div class="hd"><span class="sec-ico" style="background:#071D41">🧬</span><h2>Engine &amp; Garantias</h2><button class="fsbtn" id="engineFs">⛶ Tela cheia</button></div>
      <div class="bd" id="engineInfo"></div>
    </section>
  </div>
</main>

<footer>
  <b>HeraclitusDB</b> · Painel de Integridade Orçamentária — protótipo COTIC &amp; SAGE ·
  log imutável append-only · Merkle BLAKE3 · viagem no tempo <code>AS OF LSN</code> · geometria de produto.<br/>
  José R. F. Junior — Servidor Público Federal · Dados: Alterações Orçamentárias (SIOP / Portal da Transparência).
  <span id="footMode"></span>
</footer>

<div class="toast" id="toast"></div>
      </section>
    `;
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const boot = function() {
"use strict";
/* ========== util ========== */
const $ = s => document.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e;};
const fmtBRL = v => "R$ "+ (v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

const fmtBRLc = v => { 
  const a = Math.abs(v); 
  if (a >= 1e9) return "R$ " + (v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " bi"; 
  if (a >= 1e6) return "R$ " + (v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " mi"; 
  if (a >= 1e3) return "R$ " + (v / 1e3).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " mil"; 
  return fmtBRL(v); 
};

const fmtN = v => (v||0).toLocaleString("pt-BR");
const fmtData = d => d.toLocaleDateString("pt-BR")+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._);t._=setTimeout(()=>t.classList.remove("show"),2600);}

/* ========== dados demo (orçamento federal) ========== */
const ORGAOS=[
 ["Ministério da Educação","26000"],["Ministério da Saúde","36000"],["Ministério da Defesa","52000"],
 ["Ministério dos Transportes","39000"],["Ministério da Justiça e Segurança","30000"],["Ministério do Desenvolvimento Social","55000"],
 ["Ministério da Agricultura","22000"],["Ministério de Minas e Energia","32000"],["Ministério da Ciência e Tecnologia","24000"],
 ["Ministério das Cidades","56000"],["Ministério da Integração e Desenvolvimento Regional","53000"],["Ministério do Meio Ambiente","44000"]
];
const ACOES=[
 ["20RJ","Apoio à Infraestrutura de Educação"],["8535","Estruturação de Unidades de Saúde"],["14LX","Modernização da Defesa Nacional"],
 ["20Y0","Construção de Trecho Rodoviário"],["20IF","Policiamento e Segurança nas Fronteiras"],["219A","Transferência de Renda — Bolsa Família"],
 ["20ZV","Garantia-Safra e Apoio ao Produtor"],["211A","Universalização do Acesso à Energia"],["20V9","Fomento à Ciência e Inovação"],
 ["1D73","Saneamento e Habitação Urbana"],["10SG","Desenvolvimento Regional Sustentável"],["20WB","Conservação e Recuperação Ambiental"]
];
const TIPOS=[ ["Crédito Suplementar","b-sup"],["Crédito Especial","b-esp"],["Crédito Extraordinário","b-ext"],["Remanejamento","b-rem"],["Anulação de Dotação","b-anu"] ];
const ORIGENS=["10.1.40.22 (SIOP-PROD)","10.1.40.51 (SIOP-PROD)","10.4.12.9 (SERPRO-DF)","200.198.x (VPN-Gov)"];
const CREDS=["siafi:opr_orc_1287","siafi:opr_orc_0934","siafi:gestor_setorial_44","siafi:ordenador_desp_07"];

function gerarEventos(n){
  const rnd=mulberry32(20260624); const out=[]; let t=new Date("2023-01-09T09:00:00").getTime();
  const fim=new Date("2026-06-20T18:00:00").getTime(); const passo=(fim-t)/n;
  for(let i=0;i<n;i++){
    t += passo*(0.4+rnd()*1.2);
    const d=new Date(Math.min(t,fim));
    const o=ORGAOS[(rnd()*ORGAOS.length)|0]; const a=ACOES[(rnd()*ACOES.length)|0];
    const tp=TIPOS[(rnd()*TIPOS.length)|0];
    let base=[1.2e5,8e5,5e6,3e7,1.5e8][(rnd()*5)|0]; let valor=Math.round(base*(0.3+rnd()*4)/1000)*1000;
    if(tp[0]==="Anulação de Dotação") valor=-valor;
    const ano=d.getFullYear();
    const portaria=`PORTARIA-MPO-${ano}-${String(1+((rnd()*900)|0)).padStart(4,"0")}`;
    out.push({lsn:i,data:d,orgao:o[0],orgaoCod:o[1],acaoCod:a[0],acao:a[1],tipo:tp[0],tipoCls:tp[1],valor,
      portaria,origem:ORIGENS[(rnd()*ORIGENS.length)|0],cred:CREDS[(rnd()*CREDS.length)|0]});
  }
  return out;
}
let EVENTOS = gerarEventos(640);
let EVENTOS_FULL = EVENTOS;   // dataset completo (todos os anos); EVENTOS = vista filtrada
let anoFiltro = "todos";
let LIVE=false;

/* ========== KPIs principais com hints adicionadas ========== */
function kpiCard(lab,val,hint,cls){return `<div class="card kpi ${cls||''}" data-tip="KPI: ${lab} — Valor: ${val} (${hint||''})"><div class="lab">${lab}</div><div class="val ${String(val).length>9?'sm':''}">${val}</div>${hint?`<div class="hint">${hint}</div>`:''}</div>`;}
function renderKpis(){
  const ev=EVENTOS; const total=ev.reduce((s,e)=>s+Math.max(e.valor,0),0);
  const orgaos=new Set(ev.map(e=>e.orgao)).size; const anos=new Set(ev.map(e=>e.data.getFullYear())).size;
  $("#kpis").innerHTML=[
    kpiCard("Eventos no log",fmtN(ev.length),"head LSN "+(ev.length-1)),
    kpiCard("Volume de crédito",fmtBRLc(total),"acumulado 2023–2026"),
    kpiCard("Órgãos beneficiários",orgaos,"unidades orçamentárias"),
    kpiCard("Exercícios",anos,"2023 · 2024 · 2025 · 2026"),
    kpiCard("Integridade","ÍNTEGRO","Merkle BLAKE3 ✓","ok"),
    kpiCard("Geometria","H³²·S⁸·E⁸","variedade de produto")
  ].join("");
}

/* ========== Timeline SVG com hints adicionadas ========== */
let asOfIdx = EVENTOS.length-1;
let CUMPOS=[],CUMNET=[],CUMANU=[],CHARTPTS=[],CHARTMAX=1;
function recompute(){
  const ev=EVENTOS, n=ev.length; CUMPOS=new Array(n); CUMNET=new Array(n); CUMANU=new Array(n);
  let p=0,net=0,anu=0;
  for(let i=0;i<n;i++){ const v=ev[i].valor; p+=Math.max(v,0); net+=v; if(v<0)anu-=v; CUMPOS[i]=p; CUMNET[i]=net; CUMANU[i]=anu; }
  CHARTMAX=p||1;
  const MAXP=500, step=Math.max(1,Math.ceil(n/MAXP)); CHARTPTS=[];
  for(let i=0;i<n;i++){ if(i%step===0||i===n-1) CHARTPTS.push([n>1?i/(n-1):0, CUMPOS[i]]); }
}
function renderTimelineChart(){
  const W=1240,H=200,pad=8; const n=EVENTOS.length; if(!n||!CHARTPTS.length)return;
  const maxY=CHARTMAX, X=p=>pad+p*(W-2*pad), Y=v=>H-10-(v/maxY)*(H-30);
  let d="M"+X(0)+","+Y(0); CHARTPTS.forEach(p=>{d+=" L"+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1);});
  const area=d+" L"+X(1)+","+H+" L"+X(0)+","+H+" Z";
  const cx=X(n>1?asOfIdx/(n-1):0), cumAsOf=CUMPOS[asOfIdx]||0;
  $("#tlChart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:200px;width:100%">
    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1351B4" stop-opacity=".35"/><stop offset="1" stop-color="#1351B4" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g1)" data-tip="Área de evolução acumulada do orçamento federal líquido"/><path d="${d}" fill="none" stroke="#1351B4" stroke-width="2.5"/>
    <line x1="${cx}" y1="6" x2="${cx}" y2="${H-6}" stroke="#E52207" stroke-width="2" stroke-dasharray="4 3"/>
    <circle cx="${cx}" cy="${Y(cumAsOf)}" r="5" fill="#E52207" stroke="#fff" stroke-width="2" data-tip="Posição de reconstrução temporal selecionada (AS OF LSN): ${fmtBRL(cumAsOf)}"/></svg>`;
}

/* ========== heatmap estilo GitHub (contribuições diárias) ========== */
const HM_COLORS=["#ebedf0","#9be9a8","#40c463","#30a14e","#216e39"];
const MES=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
let HM={squares:[],monthLabels:[],weeks:0,cell:15,SQ:12,padL:32,padT:20,start:0,w:0,h:0};
function prepHeatmap(){
  const ev=EVENTOS, n=ev.length, dayMs=86400000, cell=15, SQ=12, padL=32, padT=20;
  if(!n){ HM={squares:[],monthLabels:[],weeks:0,cell,SQ,padL,padT,start:0,w:0,h:0}; return; }
  const dkey=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x.getTime();};
  const counts=new Map();
  for(let i=0;i<n;i++){ const k=dkey(ev[i].data); const v=Math.abs(ev[i].valor); const o=counts.get(k); if(o){o.c++;o.vol+=v;} else counts.set(k,{c:1,vol:v}); }
  const vals=[...counts.values()].map(o=>o.c).sort((a,b)=>a-b);
  const q=p=>vals[Math.min(vals.length-1,Math.floor(p*vals.length))]||1;
  const t1=q(0.4),t2=q(0.7),t3=q(0.9);
  const bucket=c=> c<=0?0:c<=t1?1:c<=t2?2:c<=t3?3:4;
  const first=new Date(ev[0].data); first.setHours(0,0,0,0);
  const start=new Date(first); start.setDate(start.getDate()-start.getDay());
  const last=new Date(ev[n-1].data); last.setHours(0,0,0,0);
  const totalDays=Math.round((last-start)/dayMs)+1, weeks=Math.ceil(totalDays/7);
  const squares=[];
  for(let d=0;d<totalDays;d++){
    const date=new Date(start.getTime()+d*dayMs), col=Math.floor(d/7), row=date.getDay();
    const o=counts.get(date.getTime());
    squares.push({x:padL+col*cell,y:padT+row*cell,b:o?bucket(o.c):0,ms:date.getTime(),c:o?o.c:0,vol:o?o.vol:0});
  }
  const monthLabels=[]; let lastM=-1;
  for(let c=0;c<weeks;c++){ const wd=new Date(start.getTime()+(c*7+3)*dayMs); if(wd.getMonth()!==lastM){ lastM=wd.getMonth(); monthLabels.push({x:padL+c*cell,m:MES[wd.getMonth()]}); } }
  HM={squares,monthLabels,weeks,cell,SQ,padL,padT,start:start.getTime(),w:padL+weeks*cell+12,h:padT+7*cell+8};
}
function renderHeatmap(){
  prepHeatmap();
  if(!HM.squares.length){ $("#hmChart").innerHTML=""; return; }
  const {squares,monthLabels,SQ,padL,padT,cell,w,h}=HM;
  let empty="",colored="";
  for(const s of squares){
    const dt=new Date(s.ms).toLocaleDateString("pt-BR");
    const tip=s.c>0?`${s.c} alteração(ões) em ${dt} · R$ ${(s.vol||0).toLocaleString("pt-BR",{maximumFractionDigits:0})}`:`Sem alterações · ${dt}`;
    empty+=`<rect x="${s.x}" y="${s.y}" width="${SQ}" height="${SQ}" rx="3" fill="#ebedf0" data-tip="${tip}"/>`;
    if(s.b>0) colored+=`<rect x="${s.x}" y="${s.y}" width="${SQ}" height="${SQ}" rx="3" fill="${HM_COLORS[s.b]}"/>`;
  }
  const months=monthLabels.map(o=>`<text x="${o.x}" y="${padT-6}" font-size="10" fill="#5b6471" font-family="Raleway,sans-serif">${o.m}</text>`).join("");
  const days=[[1,"Seg"],[3,"Qua"],[5,"Sex"]].map(([r,l])=>`<text x="2" y="${padT+r*cell+SQ-2}" font-size="9" fill="#5b6471" font-family="Raleway,sans-serif">${l}</text>`).join("");
  $("#hmChart").innerHTML=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="max-width:none;display:block">
    <g>${empty}</g>
    <clipPath id="hmclip"><rect id="hmclipRect" x="0" y="0" width="${w}" height="${h}"/></clipPath>
    <g clip-path="url(#hmclip)" style="pointer-events:none">${colored}</g>
    <g style="pointer-events:none">${months}${days}</g>
  </svg>`;
  updateHeatmapAsOf();
}
function updateHeatmapAsOf(){
  if(!HM.squares.length)return;
  const e=EVENTOS[asOfIdx]; if(!e)return;
  const d=new Date(e.data); d.setHours(0,0,0,0);
  const col=Math.floor((d.getTime()-HM.start)/86400000/7);
  const r=document.getElementById("hmclipRect"); if(r) r.setAttribute("width",Math.max(0,HM.padL+(col+1)*HM.cell));
}

function renderTimeline(skipTable){
  const ev=EVENTOS, n=ev.length; const cur=ev[asOfIdx];
  $("#asofLsn").textContent=cur?cur.lsn:"—";
  $("#asofData").textContent=cur?fmtData(cur.data):"—";
  $("#tlStart").textContent=ev[0]?ev[0].data.toLocaleDateString("pt-BR"):"";
  $("#tlEnd").textContent=ev[n-1]?ev[n-1].data.toLocaleDateString("pt-BR"):"";
  const sup=CUMPOS[asOfIdx]||0, anu=CUMANU[asOfIdx]||0, vol=CUMNET[asOfIdx]||0;
  $("#tlKpis").innerHTML=[
    kpiCard("Eventos AS OF",fmtN(asOfIdx+1),"até LSN "+(cur?cur.lsn:0)),
    kpiCard("Crédito concedido",fmtBRLc(sup),"suplementar+especial+extra"),
    kpiCard("Anulações",fmtBRLc(anu),"dotações canceladas"),
    kpiCard("Saldo líquido",fmtBRLc(vol),"no recorte temporal")
  ].join("");
  if(!skipTable){
    const tb=$("#tlTable tbody"); tb.innerHTML="";
    const start=Math.max(0,asOfIdx-39);
    for(let i=asOfIdx;i>=start;i--){ const e=ev[i];
      const tr = el("tr",null,
        `<td style="color:#1351B4;font-weight:700" data-tip="Identificador Sequencial LSN do Bloco: #${e.lsn}">${e.lsn}</td>
         <td data-tip="Data oficial do processamento legal: ${fmtData(e.data)}">${fmtData(e.data)}</td>
         <td style="font-family:monospace;font-size:12px" data-tip="Código identificador do documento de portaria: ${e.portaria}">${e.portaria}</td>
         <td data-tip="Órgão beneficiário: ${e.orgao} (UO: ${e.orgaoCod}) | Ação Orçamentária: ${e.acao} (Código: ${e.acaoCod})">${e.orgao}<div class="muted" style="font-size:11px">UO ${e.orgaoCod} · ${e.acaoCod}</div></td>
         <td><span class="badge ${e.tipoCls}" data-tip="Tipo legal da alteração orçamentária: ${e.tipo}">${e.tipo}</span></td>
         <td class="num" style="color:${e.valor<0?'#E52207':'#0c326f'}" data-tip="Valor financeiro impactado: ${fmtBRL(e.valor)}">${fmtBRL(e.valor)}</td>`);
      tb.appendChild(tr);
    }
  }
  renderTimelineChart();
  updateHeatmapAsOf();
}

/* ========== WHY ========== */
function renderWhyChips(){
  const ev=EVENTOS; const rnd=mulberry32(7); const picks=[];
  for(let i=0;i<5;i++){picks.push(ev[(rnd()*ev.length)|0]);}
  $("#whyChips").innerHTML=picks.map(e=>`<span class="chip" data-p="${e.portaria}" data-tip="Clique para preencher e investigar a portaria ${e.portaria}">${e.portaria}</span>`).join("");
  $("#whyChips").querySelectorAll(".chip").forEach(c=>c.onclick=()=>{$("#whyInput").value=c.dataset.p;runWhy();});
}
function escTxt(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escAttr(s){return escTxt(s).replace(/"/g,"&quot;");}
function whyHash(e){ const h=Array.from(e.portaria).reduce((a,ch)=>((a*33+ch.charCodeAt(0))>>>0),5381).toString(16).padStart(8,"0"); return "0x"+h+(e.lsn*2654435761>>>0).toString(16).padStart(8,"0").slice(0,4); }
async function runWhy(){
  const input = $("#whyInput");
  const q = (input ? input.value : "").trim();
  if(!q){toast("Informe uma portaria.");return;}
  let e = EVENTOS_FULL.find(x=>x.portaria.toLowerCase()===q.toLowerCase()) || EVENTOS_FULL.find(x=>x.portaria.toLowerCase().includes(q.toLowerCase()));
  if(!e && LIVE){
    try {
      const r = await fetch(`/cgee-api/why?portaria=${encodeURIComponent(q)}`);
      if(r.ok){
        const j = await r.json();
        if(j.encontrado && j.evento){
          e = {
            lsn: j.evento.lsn,
            data: new Date(String(j.evento.data_oficial||j.evento.data).replace(" ","T")),
            orgao: j.evento.orgao,
            orgaoCod: j.evento.orgaoCod,
            acao: j.evento.acao,
            acaoCod: j.evento.acao_orcamentaria,
            tipo: j.evento.tipo_alteracao,
            tipoCls: (TIPOS.find(x=>x[0]===j.evento.tipo_alteracao)||["",'b-sup'])[1],
            valor: +j.evento.valor||0,
            portaria: j.evento.action_id || j.evento.portaria,
            origem: j.evento.origem || ORIGENS[0],
            cred: j.evento.cred || CREDS[0]
          };
        }
      }
    }catch(_){}
  }
  if(!e){$("#whyGraph").innerHTML=`<div class="muted" style="padding:24px;text-align:center">Nenhuma portaria encontrada para “${escTxt(q)}”.</div>`;$("#whyDetail").innerHTML="";return;}
  const rel=EVENTOS_FULL.filter(x=>x.orgao===e.orgao&&x.portaria!==e.portaria);
  const hash=whyHash(e), W=1040,H=460,NW=176,NH=56;
  const node=(x,y,c,ic,title,lines,tip,big)=>{
    const w=big?NW+14:NW,h=big?NH+12:NH;
    let t=`<g class="wn" data-tip="${escAttr(tip)}" transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="10" fill="#fff" stroke="${c}" stroke-width="${big?2.5:2}"/>
      <rect width="6" height="${h}" rx="3" fill="${c}"/>
      <text x="18" y="24" font-size="14">${ic}</text>
      <text x="40" y="25" font-size="11.5" font-weight="700" fill="${c}" font-family="Raleway,sans-serif">${escTxt(title.length>22?title.slice(0,21)+"…":title)}</text>`;
    lines.forEach((l,i)=>{ l=String(l); t+=`<text x="18" y="${45+i*16}" font-size="10.5" fill="#1c1c1c" font-family="Raleway,sans-serif">${escTxt(l.length>32?l.slice(0,31)+"…":l)}</text>`; });
    return t+`</g>`;
  };
  const edge=(x1,y1,x2,y2,c)=>`<path d="M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}" fill="none" stroke="${c}" stroke-width="2" marker-end="url(#whyar)" opacity=".7"/>`;
  const C={ip:"#5b6471",cred:"#0c326f",svc:"#1351B4",port:"#E52207",org:"#168821",acao:"#854F0B",tipo:"#534AB7",val:"#0c326f"};
  const cy=200, px={ip:8,cred:210,svc:412,port:614,eff:850}, effY=[12,102,192,282,372];
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;min-height:300px">
    <defs><marker id="whyar" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#9aa3b2"/></marker></defs>`;
  s+=edge(px.ip+NW,cy+NH/2,px.cred,cy+NH/2,"#9aa3b2");
  s+=edge(px.cred+NW,cy+NH/2,px.svc,cy+NH/2,"#9aa3b2");
  s+=edge(px.svc+NW,cy+NH/2,px.port,cy+NH/2,"#9aa3b2");
  effY.forEach(yy=>{ s+=edge(px.port+NW+14,cy+NH/2,px.eff,yy+NH/2,"#cdd5e0"); });
  s+=node(px.ip,cy,C.ip,"🌐","Origem (IP)",[e.origem],"Endereço de rede que iniciou a requisição ao SIOP.");
  s+=node(px.cred,cy,C.cred,"🔑","Credencial SIAFI",[e.cred],"Operador autenticado no SIAFI — responsável legal pela operação.");
  s+=node(px.svc,cy,C.svc,"⚙️","Microsserviço",["api-siop/credito.append","gRPC → log append-only"],"Serviço que validou e gravou o evento no log imutável.");
  s+=node(px.port,cy-6,C.port,"📜",e.portaria,["Evento imutável · LSN "+e.lsn,fmtData(e.data)],"Ação registada no log append-only — nunca alterada, só acrescentada. Hash "+hash,true);
  s+=node(px.eff,effY[0],C.org,"🏛️","Órgão beneficiário",[e.orgao,"UO "+e.orgaoCod],"Unidade orçamentária "+e.orgaoCod+" que recebeu o crédito: "+e.orgao);
  s+=node(px.eff,effY[1],C.acao,"🎯","Ação orçamentária",[e.acaoCod,e.acao||"—"],"Programa de governo financiado: "+(e.acao||e.acaoCod));
  s+=node(px.eff,effY[2],C.tipo,"🏷️","Tipo de alteração",[e.tipo],"Classificação legal do crédito orçamentário ("+e.tipo+").");
  s+=node(px.eff,effY[3],C.val,"💰","Valor",[fmtBRL(e.valor)],(e.valor<0?"Redução/anulação de dotação: ":"Acréscimo de dotação: ")+fmtBRL(e.valor));
  s+=node(px.eff,effY[4],C.port,"🔒","Selo Merkle",[hash,"BLAKE3 · íntegro"],"Hash que prende o evento à cadeia Merkle. Qualquer adulteração quebra a verificação.");
  s+=`</svg>`;
  $("#whyGraph").innerHTML=s;
  const relTxt=rel.length?`<b>${rel.length}</b> outra(s) portaria(s) do mesmo órgão (ex.: ${rel.slice(0,3).map(r=>escTxt(r.portaria)).join(", ")})`:"única portaria do órgão na amostra";
  $("#whyDetail").innerHTML=`<b>Causa-raiz reconstruída</b> — ${escTxt(e.origem)} → ${escTxt(e.cred)} → microsserviço → <b>${escTxt(e.portaria)}</b>. ${relTxt}. <span class="muted">Passe o rato sobre os nós para detalhes; <b>⛶ Tela cheia</b> para expandir.</span>`;
}

/* ========== Escudo forense com hints adicionadas ========== */
let tampered=false;
function renderBlocks(){
  const rnd=mulberry32(99); const wrap=$("#blocks"); wrap.innerHTML="";
  for(let i=0;i<10;i++){const h=Math.floor(rnd()*0xffffff).toString(16).padStart(6,"0");
    const statusForense = tampered && i === 6 ? "VIOLADO! Hash local divergiu do Merkle Root criptográfico." : "INTEGRO. Selado via hash imutável BLAKE3.";
    const b=el("div","blk"+(tampered&&i===6?" bad":""),`B${i}<small>${h}</small>`); 
    b.setAttribute("data-tip", `Segmento de Bloco Criptográfico B${i} | Hash Root: 0x${h} | Status: ${statusForense}`);
    wrap.appendChild(b);}
}
function setShield(ok,msg){
  const sh=$("#shield");
  sh.className="shield "+(ok?"ok":"bad");
  sh.setAttribute("data-tip", `Escudo de Integridade: ${ok ? "SISTEMA SEGURO" : "ALERTA DE SEGURANÇA"} | ${msg}`);
  $("#shieldIc").textContent=ok?"🛡️":"⚠️";
  $("#shieldTitle").textContent=ok?"SISTEMA ÍNTEGRO":"VIOLAÇÃO DETECTADA";
  $("#shieldMsg").textContent=msg;
}
function verify(){
  if(LIVE){ fetch("/cgee-api/verify").then(r=>r.json()).then(j=>{
      if(j.integro){tampered=false;renderBlocks();setShield(true,"Merkle BLAKE3 verificado no core em Rust — log íntegro.");toast("verify(): íntegro ✓");}
      else{setShield(false,"O core reportou inconsistência na cadeia.");}
    }).catch(()=>localVerify()); return; }
  localVerify();
}
function localVerify(){
  if(tampered){ setShield(false,"Hash da raiz Merkle divergiu — bloco B6 adulterado fora da API oficial.");toast("Quebra de integridade no bloco B6"); }
  else { setShield(true,"Cadeia Merkle verificada — 100% de consistência matemática no log imutável."); toast("verify(): íntegro ✓"); }
}
function tamper(){ tampered=true; renderBlocks(); setShield(false,"QUEBRA DE INTEGRIDADE: o hash do bloco B6 não confere com a raiz selada."); toast("Adulteração simulada — execute a auditoria"); }

/* ========== Charts SVG com hints globais integradas e todos os órgãos cadastrados ========== */
function barH(data, unit){ // data:[{lab,val,cor}]
  const W=850,bh=26,gap=10,pad=360; const max=Math.max(...data.map(d=>d.val))||1; const H=data.length*(bh+gap)+10;
  let s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet" style="width:100%; height:auto; display:block;">`;
  data.forEach((d,i)=>{
    const y=i*(bh+gap)+5,w=(d.val/max)*(W-pad-110);
    const label = d.lab.length > 42 ? d.lab.slice(0, 40) + "…" : d.lab;
    s+=`<g data-tip="Órgão: ${escAttr(d.lab)} | Volume Acumulado: ${fmtBRL(d.val)}">
        <text x="0" y="${y+17}" font-size="12" fill="#1c1c1c" font-family="Raleway,sans-serif">${escTxt(label)}</text>
        <rect x="${pad}" y="${y}" width="${Math.max(w,2)}" height="${bh}" rx="4" fill="${d.cor||'#1351B4'}"/>
        <text x="${pad+Math.max(w,2)+10}" y="${y+17}" font-size="11" font-weight="700" fill="#0c326f" font-family="Raleway,sans-serif">${unit(d.val)}</text>
        </g>`;
  });
  return s+`</svg>`;
}
function renderCharts(){
  const byOrg={}; EVENTOS.forEach(e=>{byOrg[e.orgao]=(byOrg[e.orgao]||0)+Math.max(e.valor,0);});
  const topO=Object.entries(byOrg).map(([lab,val])=>({lab,val})).sort((a,b)=>b.val-a.val);
  $("#chOrgao").innerHTML=barH(topO,fmtBRLc);
  
  // por ano e tipo (stacked simples -> barras agrupadas por ano)
  const anos=[2023,2024,2025,2026]; const cores={"Crédito Suplementar":"#1351B4","Crédito Especial":"#FFCD07","Crédito Extraordinário":"#E52207","Remanejamento":"#168821","Anulação de Dotação":"#888"};
  const byAno={}; anos.forEach(a=>byAno[a]={});
  const evSource = EVENTOS_FULL && EVENTOS_FULL.length ? EVENTOS_FULL : EVENTOS;
  evSource.forEach(e=>{const a=e.data.getFullYear(); if(byAno[a]) byAno[a][e.tipo]=(byAno[a][e.tipo]||0)+Math.abs(e.valor);});
  const W=560,H=210,pad=40,gap=24; const max=Math.max(...anos.map(a=>Object.values(byAno[a]).reduce((s,v)=>s+v,0)))||1;
  const bw=(W-pad-gap*anos.length)/anos.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px">`;
  anos.forEach((a,i)=>{
    let x=pad+i*(bw+gap),y=H-24; const tipos=Object.keys(cores);
    const isSelected = anoFiltro === "todos" || String(anoFiltro) === String(a);
    const op = isSelected ? "1" : "0.35";
    tipos.forEach(tp=>{const v=byAno[a][tp]||0; const h=(v/max)*(H-50); y-=h;
      s+=`<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h,0)}" fill="${cores[tp]}" opacity="${op}" data-tip="Exercício: ${a} | Distribuição: ${tp} | Volume total: ${fmtBRL(v)}"/>`;});
    const fontWt = isSelected && anoFiltro !== "todos" ? "900" : "700";
    const fillCol = isSelected && anoFiltro !== "todos" ? "#1351B4" : "#5b6471";
    s+=`<text x="${x+bw/2}" y="${H-6}" font-size="12" text-anchor="middle" font-weight="${fontWt}" fill="${fillCol}" font-family="Raleway">${a}</text>`;
  });
  s+=`</svg>`; $("#chAno").innerHTML=s;
  $("#legAno").innerHTML=Object.entries(cores).map(([t,c])=>`<span data-tip="Legenda de Tipo Legal: ${t}"><i style="background:${c}"></i>${t}</span>`).join("");
}

/* ========== Feed de Eventos com hints adicionadas ========== */
function renderFeed(){
  const ul=$("#feed"); ul.innerHTML="";
  EVENTOS.slice(-18).reverse().forEach(e=>{
    const li = el("li",null,`<span class="ln">#${e.lsn}</span>
      <span><b>${e.orgao}</b><div class="muted" style="font-size:11px">${e.tipo} · ${fmtData(e.data)} · ${e.portaria}</div></span>
      <span class="v" style="color:${e.valor<0?'#E52207':'#0c326f'}">${fmtBRLc(e.valor)}</span>`);
    li.setAttribute("data-tip", `Log Evento #${e.lsn} | Doc: ${e.portaria} | Beneficiário: ${e.orgao} | Tipo legal: ${e.tipo} | Volume: ${fmtBRL(e.valor)} | Data: ${fmtData(e.data)}`);
    ul.appendChild(li);
  });
}

/* ========== Engine Info com hints adicionadas ========== */
function renderEngine(){
  const rows=[
    ["Modelo","Banco event-sourced · log append-only imutável","Arquitetura focada na gravação contínua de blocos ordenados e persistentes de auditoria."],
    ["Verdade primária","evento imutável (nunca UPDATE/DELETE)","Bloqueia qualquer tipo de ataque de modificação histórica. O que aconteceu fica gravado para sempre."],
    ["Viagem no tempo","AS OF LSN / AS OF TIMESTAMP — bit a bit","Recurso computacional capaz de reordenar o banco no leito exato de um milissegundo passado."],
    ["Prova de integridade","raiz Merkle BLAKE3 por segmento selado","Função matemática ultrarrápida que detecta qualquer alteração física de bytes fora da API."],
    ["Carimbo legal","RFC 3161 / ICP-Brasil (heraclitus-compliance)","Conformidade de timestamp auditável para processos legais junto a órgãos de controle federais."],
    ["Geometria","P = H³²(κ₁) × S⁸(κ₂) × E⁸ (curvaturas estimadas)","Representação matemática topológica aplicada à árvore de relacionamentos de dados."],
    ["Consultas","GQL: MATCH · RECALL · FUSE · WHY · PROVENANCE · AS OF","Linguagem nativa especializada na investigação em grafos e proveniência causal pericial."],
    ["Núcleo","Rust bare-metal · gRPC :7474 · REST :7475","Código em baixo nível de alta concorrência e baixíssima latência operacional."]
  ];
  let h=rows.map(r=>`<div class="info-row" data-tip="Especificação Causal: ${escAttr(r[2])}"><span class="muted">${r[0]}</span><b>${r[1]}</b></div>`).join("");
  h+=`<div style="margin-top:12px;font-size:12px" class="muted">Roadmap</div>
      <div class="mtags">${["M0–M18 ✅","M19 boot ✅","M20 H-VM ✅","M20 Bᵋ-tree ✅","M20 GPU CPU ✅"].map(t=>`<span class="mtag" data-tip="Etapa concluída e homologada no plano técnico">${t}</span>`).join("")}
      <span class="mtag wip" data-tip="Módulo técnico atualmente em fase ativa de engenharia">M20.3.1 GPU ⏳</span></div>`;
  $("#engineInfo").innerHTML=h;
}

/* ========== live (HeraclitusDB via painel_server.py) ========== */
async function tentarLive(){
  let liveOk=false;
  try{
    const t=await fetch("/cgee-api/timeline?limit=24000",{cache:"no-store"});
    if(t.ok){ const tj=await t.json();
      if(Array.isArray(tj.eventos)&&tj.eventos.length){
        EVENTOS=tj.eventos.map((e,i)=>({lsn:e.lsn!=null?e.lsn:i,data:new Date(String(e.data_oficial||e.data||Date.now()).replace(" ","T")),
          orgao:e.orgao||"—",orgaoCod:e.orgaoCod||"",acaoCod:e.acao_orcamentaria||e.acaoCod||"",acao:e.acao||"",
          tipo:e.tipo_alteracao||e.tipo||"Crédito Suplementar",tipoCls:(TIPOS.find(x=>x[0]===(e.tipo_alteracao||e.tipo))||["",'b-sup'])[1],
          valor:+e.valor||0,portaria:e.action_id||e.portaria||("LSN-"+i),origem:e.origem||ORIGENS[0],cred:e.cred||CREDS[0]}));
        EVENTOS.sort((a,b)=>a.data-b.data).forEach((e,i)=>e.lsn=i);
        liveOk=true;
      }
    }
  }catch(_){}
  if(liveOk){
    LIVE=true;
    $("#statusPill").classList.remove("demo");
    $("#statusTxt").textContent="AO VIVO · gRPC 7474";
    $("#footMode").textContent=" · Conectado ao HeraclitusDB (dados reais) — "+fmtN(EVENTOS.length)+" eventos.";
    toast("Conectado ao HeraclitusDB ✓ — "+fmtN(EVENTOS.length)+" eventos");
  } else {
    $("#footMode").textContent=" · Modo demonstração (banco offline) — "+fmtN(EVENTOS.length)+" eventos sintéticos.";
  }
  bootRender();
}

/* ========== filtro por exercício (ano) ========== */
function anosDisponiveis(){ return [...new Set(EVENTOS_FULL.map(e=>e.data.getFullYear()))].sort(); }
function renderAnoPills(){
  const anos=anosDisponiveis();
  const mk=(lab,val)=>`<button class="ano-pill${String(anoFiltro)===String(val)?' on':''}" data-ano="${val}">${lab}</button>`;
  $("#anoPills").innerHTML=[mk("Todos","todos"),...anos.map(a=>mk(a,a))].join("");
  $("#anoPills").querySelectorAll(".ano-pill").forEach(b=>b.onclick=()=>setAno(b.dataset.ano));
}
function setAno(ano){
  pararPlay();
  anoFiltro=ano;
  EVENTOS = (ano==="todos") ? EVENTOS_FULL : EVENTOS_FULL.filter(e=>String(e.data.getFullYear())===String(ano));
  recompute();
  asOfIdx=Math.max(0,EVENTOS.length-1);
  const sl=$("#asof"); sl.value=100; sl.style.setProperty("--p","100%");
  renderAnoPills(); renderHeatmap(); renderKpis(); renderTimeline(); renderCharts(); renderFeed(); renderWhyChips();
  const input = $("#whyInput");
  if (input && input.value) {
    runWhy();
  } else if (EVENTOS.length > 0 && input) {
    input.value = EVENTOS[0].portaria;
    runWhy();
  }
}

/* ========== boot ========== */
function bootRender(){
  EVENTOS_FULL = EVENTOS; anoFiltro = "todos";
  recompute();
  asOfIdx=EVENTOS.length-1;
  const sl=$("#asof"); sl.max=100; sl.value=100;
  renderAnoPills(); renderHeatmap(); renderKpis(); renderTimeline(); renderWhyChips(); renderBlocks(); renderCharts(); renderFeed(); renderEngine();
  setShield(true,"Cadeia Merkle verificada — 100% de consistência matemática no log imutável.");
  if (EVENTOS_FULL.length > 0) {
    const input = $("#whyInput");
    const pick = EVENTOS_FULL.find(e => e.portaria) || EVENTOS_FULL[0];
    if (pick && input && (!input.value || !$("#whyGraph svg"))) {
      input.value = pick.portaria;
      runWhy();
    }
  }
}
let playTimer=null;
function pararPlay(){ if(playTimer){clearInterval(playTimer);playTimer=null;} const b=$("#playBtn"); if(b){b.textContent="▶ Reproduzir";b.classList.remove("btn-amar");b.classList.add("btn-azul");} }
function tocar(){
  const sl=$("#asof");
  if(playTimer){ pararPlay(); renderTimeline(); return; }   // pausar → refresca a tabela
  if(+sl.value>=100){ sl.value=0; }                          // no fim → recomeça
  const b=$("#playBtn"); b.textContent="⏸ Pausar"; b.classList.remove("btn-azul"); b.classList.add("btn-amar");
  playTimer=setInterval(()=>{
    const v=Math.min(100,(+$("#asof").value)+1.1);
    const sl=$("#asof"); sl.value=v; sl.style.setProperty("--p",v+"%");
    asOfIdx=Math.max(0,Math.min(EVENTOS.length-1,Math.round((v/100)*(EVENTOS.length-1))));
    renderTimeline(true);                                    // anima sem reconstruir a tabela
    if(v>=100){ pararPlay(); renderTimeline(); }             // fim → render completo
  },55);
}
$("#playBtn").onclick=tocar;
$("#asof").addEventListener("input",e=>{
  pararPlay();
  const p=+e.target.value; e.target.style.setProperty("--p",p+"%");
  asOfIdx=Math.max(0,Math.min(EVENTOS.length-1,Math.round((p/100)*(EVENTOS.length-1))));
  renderTimeline();
});
$("#whyBtn").onclick=runWhy;
$("#whyInput").addEventListener("keydown",e=>{if(e.key==="Enter")runWhy();});
$("#verifyBtn").onclick=verify;
$("#tamperBtn").onclick=tamper;

/* ========== Alteração 3: Receptor Único e Global de Tooltips acoplado à tag 'main' ========== */
const TIP=el("div"); TIP.id="tip"; document.body.appendChild(TIP);
function attachTooltip(sel){
  const g=$(sel); if(!g)return;
  g.addEventListener("mousemove",ev=>{
    const n=ev.target.closest && ev.target.closest("[data-tip]");
    if(n){ TIP.textContent=n.getAttribute("data-tip"); TIP.classList.add("show");
      TIP.style.left=Math.min(window.innerWidth-310,ev.clientX+14)+"px";
      TIP.style.top=Math.min(window.innerHeight-70,ev.clientY+16)+"px"; }
    else TIP.classList.remove("show");
  });
  g.addEventListener("mouseleave",()=>TIP.classList.remove("show"));
}
attachTooltip("main"); // Agora varre dinamicamente hints para todo dado dentro de qualquer painel

/* ========== Alteração 2: Engenharia do Controlador Centralizado de Tela Cheia (FullScreen) ========== */
function setupFullScreen(cardSel, btnSel) {
  const c = $(cardSel);
  const b = $(btnSel);
  if (!c || !b) return;
  b.onclick = (e) => {
    e.preventDefault();
    c.classList.toggle("fs");
    const on = c.classList.contains("fs");
    b.textContent = on ? "⛶ Sair (Esc)" : "⛶ Tela cheia";
    const anyFs = document.querySelector(".card.fs");
    document.body.style.overflow = anyFs ? "hidden" : "";
  };
}

// Configuração sequencial de escuta de tela cheia para todos os painéis
setupFullScreen("#tlCard", "#tlFs");
setupFullScreen("#whyCard", "#whyFs");
setupFullScreen("#shieldCard", "#shieldFs");
setupFullScreen("#orgaoCard", "#orgaoFs");
setupFullScreen("#anoCard", "#anoFs");
setupFullScreen("#feedCard", "#feedFs");
setupFullScreen("#engineCard", "#engineFs");

// Escuta global de tecla Escape para fechar qualquer painel em foco de tela cheia
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape") {
    document.querySelectorAll(".card.fs").forEach(c => {
      c.classList.remove("fs");
      const b = c.querySelector(".fsbtn");
      if (b) b.textContent = "⛶ Tela cheia";
    });
    document.body.style.overflow = "";
  }
});

$("#asof").style.setProperty("--p","100%");
bootRender();
tentarLive();

// Reatividade de rotas — re-renderiza gráficos quando o usuário navega para #cgee
document.addEventListener("hera:route-changed", ev => {
  if (ev.detail?.route === "cgee") {
    bootRender();
  }
});

// Redimensionamento de janela
let resizeTimer = null;
window.addEventListener("resize", () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const sec = document.getElementById("cgee");
    if (sec && sec.classList.contains("on")) {
      renderTimelineChart();
      renderHeatmap();
      renderCharts();
      if ($("#whyInput") && $("#whyInput").value) runWhy();
    }
  }, 150);
});
      };
      boot();
    } catch (e) {
      console.error("Erro ao inicializar CGEE:", e);
    }
  }
};
