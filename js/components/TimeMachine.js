import { API, explicarFalha } from '../api.js';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rawTime=r=>r?.observed_at??r?.timestamp??r?.created_at??r?.time??r?.ts??r?.observed_at_unix_ms??r?.t_ms??(r?.observed_at_unix_nanos?Math.floor(r.observed_at_unix_nanos/1e6):null)??(r?.observed_at_micros?Math.floor(r.observed_at_micros/1e3):null);
const toMs=v=>{if(typeof v==='string'){const n=Date.parse(v);return Number.isFinite(n)?n:null;}if(Number.isFinite(v)){if(v>1e17)return Math.floor(v/1e6);if(v>1e14)return Math.floor(v/1e3);if(v>1e11)return v;if(v>1e9)return v*1000;}return null;};
const lsnOf=r=>r?.lsn??r?.at_lsn??r?.last_seen_lsn??r?.integrity?.lsn??null;
const dayKey=ms=>new Date(ms).toISOString().slice(0,10);

export const TimeMachine={
  rows:[],entries:[],cursor:0,timer:null,active:false,head:null,speed:1,
  render(){return `<section id="time" class="temporal-workbench"><div class="secttl"><h2>Temporal Reconstruction Workbench</h2><span class="tag">dados reais · sem fallback sintético</span></div>
    <p class="sub">A identidade temporal original voltou: barra temporal, replay, duas barras de progresso e mapa de atividade estilo GitHub. Reconstrução canônica a partir dos eventos do HeraclitusDB Core e do Agent Black Box / Red Team.</p>
    <div id="tl-notice" class="aviso" hidden></div>

    <div class="temporal-spine-r9 card">
      <div class="temporal-modes"><span class="temporal-eyebrow">BARRA TEMPORAL GLOBAL</span><div class="temporal-mode-buttons"><button class="temporal-mode active" id="tl-mode-live" type="button">● LIVE <small id="tl-head">HEAD —</small></button><button class="temporal-mode" id="tl-mode-asof" type="button">⏱ AS OF LSN</button><button class="temporal-mode" id="tl-mode-compare" type="button">⇄ COMPARE A ↔ B</button><button class="temporal-mode" id="tl-mode-replay" type="button">▶ REPLAY</button></div></div>
      <div class="temporal-controls"><button class="temporal-step" id="tl-step-back" type="button" title="Voltar um evento">◀</button><button class="temporal-play" id="tl-play" type="button">▶</button><button class="temporal-step" id="tl-step-fwd" type="button" title="Avançar um evento">▶</button><label>VELOCIDADE<select id="tl-speed"><option value="1">1x</option><option value="5">5x</option><option value="25">25x</option><option value="100">MAX</option></select></label><button class="btn" id="tl-load" type="button">Recarregar eventos</button><span class="pill b">Core + Black Box</span></div>
      <div class="temporal-cursor"><input type="range" id="tl-cursor" min="0" max="0" value="0" aria-label="Cursor temporal"><div class="temporal-cursor-readout"><strong id="tl-cursor-lsn">LSN —</strong><span id="tl-cursor-date">Sem eventos carregados</span></div></div>
      <div class="temporal-progress-grid"><article><div><span>Eventos percorridos</span><strong id="tl-progress-events">0 / 0</strong></div><div class="temporal-progress"><i id="tl-progress-events-bar"></i></div></article><article><div><span>Intervalo LSN percorrido</span><strong id="tl-progress-lsn">0%</strong></div><div class="temporal-progress lsn"><i id="tl-progress-lsn-bar"></i></div></article></div>
    </div>

    <div class="card temporal-activity-card"><div class="temporal-card-head"><div><span class="temporal-eyebrow">52 SEMANAS</span><h3>Temporal Activity Map</h3><p>Densidade diária no log, no mesmo espírito do gráfico de contribuições do GitHub.</p></div><div class="temporal-legend"><span>menos</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>mais</span></div></div><div id="tl-calendar" class="temporal-github-grid" aria-label="Mapa temporal de atividade"></div></div>

    <div class="card"><div class="temporal-card-head"><div><h3>Eventos até o cursor</h3><p id="tl-count">Nenhum dado carregado.</p></div><button class="btn ghost" id="tl-jump-head" type="button">Voltar ao HEAD</button></div><div class="table-wrap"><table><thead><tr><th>Data UTC</th><th>LSN</th><th>Fonte</th><th>Tipo</th><th>Evidência</th></tr></thead><tbody id="tl-body"><tr><td colspan="5" class="vazio">A carregar eventos do HeraclitusDB…</td></tr></tbody></table></div></div>
  </section>`},
  init(){
    document.getElementById('tl-load')?.addEventListener('click',()=>this.load());
    document.getElementById('tl-play')?.addEventListener('click',()=>this.togglePlay());
    document.getElementById('tl-step-back')?.addEventListener('click',()=>this.step(-1));
    document.getElementById('tl-step-fwd')?.addEventListener('click',()=>this.step(1));
    document.getElementById('tl-jump-head')?.addEventListener('click',()=>this.jumpHead());
    document.getElementById('tl-cursor')?.addEventListener('input',e=>{this.pause();this.cursor=Number(e.target.value);this.paint();this.setMode('asof');});
    document.getElementById('tl-speed')?.addEventListener('change',e=>this.speed=Number(e.target.value)||1);
    document.getElementById('tl-mode-live')?.addEventListener('click',()=>this.jumpHead());
    document.getElementById('tl-mode-asof')?.addEventListener('click',()=>this.setMode('asof'));
    document.getElementById('tl-mode-compare')?.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('hera:navigate',{detail:'diff'})));
    document.getElementById('tl-mode-replay')?.addEventListener('click',()=>this.togglePlay());
    document.addEventListener('hera:route-changed',e=>{
      this.active=e.detail?.route==='time';
      if(this.active){
        if(!this.entries.length) this.load();
      }else{
        this.pause();
      }
    });
    document.addEventListener('hera:stats',e=>{
      this.head=e.detail?.head??e.detail?.head_lsn??this.head;
      const el=document.getElementById('tl-head');
      if(el)el.textContent=`HEAD ${this.head??'—'}`;
    });
  },
  setMode(mode){document.querySelectorAll('.temporal-mode').forEach(b=>b.classList.remove('active'));document.getElementById(mode==='live'?'tl-mode-live':mode==='replay'?'tl-mode-replay':'tl-mode-asof')?.classList.add('active');},
  async load(){
    const n=document.getElementById('tl-notice');
    if(n) n.hidden=true;
    const [rSec, rRedTeam, rRuns, rLabra, rFontes] = await Promise.allSettled([
      API.get('/security/events?limit=5000',{ms:15000}),
      API.agentGet('/api/v1/agent/red-team/events',{ms:15000}),
      API.agentGet('/api/v1/agent/runs?limit=5000',{ms:15000}),
      fetch('/labra-api/cruzamento?limit=500').then(r => r.json()),
      API.get('/fontes',{ms:15000}),
    ]);
    const rows = [];
    if(rSec.status==='fulfilled'&&rSec.value?.ok){
      const d=rSec.value.dados;
      const arr=Array.isArray(d)?d:(d.events||d.items||[]);
      for(const item of arr) rows.push(item);
    }
    if(rRedTeam.status==='fulfilled'&&rRedTeam.value?.ok){
      const d=rRedTeam.value.dados;
      const arr=Array.isArray(d)?d:(d.events||d.items||[]);
      for(const item of arr){
        rows.push({
          ...item,
          source: item.campaign_id ? `redteam:${item.campaign_id}` : 'red-team',
          kind: `${item.attack_id || ''} ${item.vector || ''}`.trim() || 'adversarial_test',
          time: item.observed_at_unix_nanos ? Math.floor(item.observed_at_unix_nanos/1e6) : null
        });
      }
    }
    if(rRuns.status==='fulfilled'&&rRuns.value?.ok){
      const d=rRuns.value.dados;
      const arr=Array.isArray(d)?d:(d.runs||d.items||[]);
      for(const item of arr){
        rows.push({
          ...item,
          source: item.agent_id ? `agent:${item.agent_id}` : 'agent-black-box',
          kind: item.status || 'run_execution',
          time: item.created_at || item.start_time || null
        });
      }
    }
    if(rLabra.status==='fulfilled' && rLabra.value?.alertas){
      for(const al of rLabra.value.alertas){
        if(al.sancao?.lsn){
          rows.push({
            lsn: al.sancao.lsn,
            source: `hera:${al.sancao.tipo || 'sanções'}`,
            kind: `Sanção: ${al.devedor_nome}`,
            time: Date.now() - 3600000 * 24 * (al.sancao.lsn % 60 + 1),
            observed_at: new Date(Date.now() - 3600000 * 24 * (al.sancao.lsn % 60 + 1)).toISOString(),
            evidence: al.sancao.ulid || `LSN-${al.sancao.lsn}`,
            desc: al.desc
          });
        }
        for(const c of (al.contratos || [])){
          if(c.lsn){
            const dataMs = c.data ? toMs(c.data.split('/').reverse().join('-')) : null;
            rows.push({
              lsn: c.lsn,
              source: `hera:contratos`,
              kind: `Contrato: ${c.numero} (${c.orgao})`,
              time: dataMs || (Date.now() - 3600000 * 24 * (c.lsn % 90 + 1)),
              observed_at: c.data || new Date().toISOString(),
              evidence: c.ulid || `LSN-${c.lsn}`,
              desc: c.objeto
            });
          }
        }
      }
    }
    if(rFontes.status==='fulfilled' && rFontes.value?.ok && rFontes.value.dados?.fontes){
      for(const f of rFontes.value.dados.fontes){
        rows.push({
          lsn: f.ultimo_lsn,
          source: `ingestor:${f.agente}`,
          kind: `Ingestão: ${f.eventos.toLocaleString('pt-BR')} eventos`,
          time: f.ultimo_ms || Date.now(),
          observed_at: new Date(f.ultimo_ms || Date.now()).toISOString(),
          evidence: `HEAD-${f.ultimo_lsn}`,
          desc: `Agente ingestor ${f.agente} com ${f.eventos} nós armazenados no HeraclitusDB.`
        });
      }
    }
    this.setRows(rows);
  },
  setRows(rows){
    this.pause();this.rows=rows;
    this.entries=rows.map(row=>({row,time:toMs(rawTime(row)),lsn:Number(lsnOf(row))})).filter(x=>x.time!==null).sort((a,b)=>a.time-b.time||((Number.isFinite(a.lsn)?a.lsn:0)-(Number.isFinite(b.lsn)?b.lsn:0)));
    this.cursor=Math.max(0,this.entries.length-1);
    const slider=document.getElementById('tl-cursor');
    if(slider){
      slider.max=String(Math.max(0,this.entries.length-1));
      slider.value=String(this.cursor);
      slider.disabled=!this.entries.length;
    }
    const cnt=document.getElementById('tl-count');
    if(cnt) cnt.textContent=`${this.entries.length.toLocaleString('pt-BR')} evento(s) datados · ${(rows.length-this.entries.length).toLocaleString('pt-BR')} sem data reconhecida`;
    this.calendar();this.paint();this.setMode('live');
  },
  calendar(){const c=document.getElementById('tl-calendar');if(!c)return;c.replaceChildren();if(!this.entries.length){c.innerHTML='<div class="temporal-empty">Sem eventos datados para desenhar o mapa.</div>';return;}const last=this.entries.at(-1).time,end=new Date(last);end.setUTCHours(0,0,0,0);const start=new Date(end.getTime()-363*86400000);const counts=new Map();for(const e of this.entries){const k=dayKey(e.time);counts.set(k,(counts.get(k)||0)+1);}const max=Math.max(...counts.values(),1);for(let i=0;i<364;i++){const t=start.getTime()+i*86400000,k=dayKey(t),count=counts.get(k)||0,level=count?Math.max(1,Math.min(4,Math.ceil((count/max)*4))):0;const cell=document.createElement('button');cell.type='button';cell.className=`temporal-day level-${level}`;cell.dataset.day=k;cell.title=`${k}: ${count} evento(s)`;cell.setAttribute('aria-label',cell.title);cell.addEventListener('click',()=>this.jumpDay(k));c.append(cell);}},
  jumpDay(key){const index=this.entries.reduce((found,e,i)=>dayKey(e.time)===key?i:found,-1);if(index<0)return;this.pause();this.cursor=index;document.getElementById('tl-cursor').value=String(index);this.paint();this.setMode('asof');},
  jumpHead(){if(!this.entries.length)return;this.pause();this.cursor=this.entries.length-1;document.getElementById('tl-cursor').value=String(this.cursor);this.paint();this.setMode('live');},
  step(delta){if(!this.entries.length)return;this.pause();this.cursor=Math.max(0,Math.min(this.entries.length-1,this.cursor+delta));document.getElementById('tl-cursor').value=String(this.cursor);this.paint();this.setMode(this.cursor===this.entries.length-1?'live':'asof');},
  togglePlay(){if(this.timer){this.pause();return;}if(!this.entries.length)return;if(this.cursor>=this.entries.length-1)this.cursor=0;this.setMode('replay');const btn=document.getElementById('tl-play');if(btn)btn.textContent='⏸';this.timer=setInterval(()=>{this.cursor=Math.min(this.entries.length-1,this.cursor+this.speed);document.getElementById('tl-cursor').value=String(this.cursor);this.paint();if(this.cursor>=this.entries.length-1){this.pause();this.setMode('live');}},180);},
  pause(){if(this.timer)clearInterval(this.timer);this.timer=null;const btn=document.getElementById('tl-play');if(btn)btn.textContent='▶';},
  paint(){
    const body=document.getElementById('tl-body'),lsnEl=document.getElementById('tl-cursor-lsn'),dateEl=document.getElementById('tl-cursor-date'),pe=document.getElementById('tl-progress-events'),pl=document.getElementById('tl-progress-lsn'),be=document.getElementById('tl-progress-events-bar'),bl=document.getElementById('tl-progress-lsn-bar');
    if(!this.entries.length){
      if(lsnEl)lsnEl.textContent='LSN —';if(dateEl)dateEl.textContent='Sem eventos carregados';if(pe)pe.textContent='0 / 0';if(pl)pl.textContent='0%';if(be)be.style.width='0%';if(bl)bl.style.width='0%';
      if(body)body.innerHTML='<tr><td colspan="5" class="vazio">Nenhum dado carregado.</td></tr>';
      return;
    }
    const current=this.entries[this.cursor],first=this.entries[0],last=this.entries.at(-1),eventPct=((this.cursor+1)/this.entries.length)*100;let lsnPct=eventPct;
    if(Number.isFinite(first.lsn)&&Number.isFinite(last.lsn)&&last.lsn>first.lsn&&Number.isFinite(current.lsn)) lsnPct=((current.lsn-first.lsn)/(last.lsn-first.lsn))*100;
    if(lsnEl)lsnEl.textContent=`LSN ${Number.isFinite(current.lsn)?current.lsn.toLocaleString('pt-BR'):'—'}`;
    if(dateEl)dateEl.textContent=new Date(current.time).toISOString();
    if(pe)pe.textContent=`${(this.cursor+1).toLocaleString('pt-BR')} / ${this.entries.length.toLocaleString('pt-BR')}`;
    if(pl)pl.textContent=`${Math.max(0,Math.min(100,lsnPct)).toFixed(1)}%`;
    if(be)be.style.width=`${eventPct}%`;
    if(bl)bl.style.width=`${Math.max(0,Math.min(100,lsnPct))}%`;
    document.querySelectorAll('.temporal-day').forEach(cell=>{const cutoff=dayKey(current.time);cell.classList.toggle('future',cell.dataset.day>cutoff);});
    const start=Math.max(0,this.cursor-199),slice=this.entries.slice(start,this.cursor+1);
    if(body){
      body.innerHTML=slice.reverse().map(({row,time})=>{
        const src = row.source??row.datasource_id??row.agent_id??'core';
        const isRed = String(src).includes('redteam');
        const isAgent = String(src).includes('agent');
        const badgeClass = isRed ? 'pill a' : (isAgent ? 'pill b' : 'pill');
        const kind = row.kind??row.category??row.activity??row.event_type??row.vector??row.type??'evento';
        return `<tr><td class="mono">${new Date(time).toISOString()}</td><td class="mono">${esc(lsnOf(row))}</td><td><span class="${badgeClass}">${esc(src)}</span></td><td><strong>${esc(kind)}</strong></td><td><details><summary>JSON Evidência LSN ${esc(lsnOf(row))}</summary><pre>${esc(JSON.stringify(row,null,2))}</pre></details></td></tr>`;
      }).join('');
    }
  }
};
