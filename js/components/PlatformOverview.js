import { API } from '../api.js';
const num=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('pt-BR'):'—';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line=(k,v)=>`<div class="op-line"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`;

export const PlatformOverview={
  timer: null,
  render(){return `<section id="overview" class="on">
   <div class="secttl"><h2>HeraclitusDB</h2><span class="tag">plataforma temporal e verificável</span></div>
   <p class="sub">Estado real do motor, proveniência e módulos. O banco continua útil sem Agent Black Box, Sentinel ou uma fonte pública específica.</p><div id="ov-aviso" class="aviso" hidden></div>
   <div class="grid k4">
    <div class="kpi"><div class="lb">Head LSN <span class="fonte"><code>/stats</code></span></div><div class="v" id="ov-head">—</div></div><div class="kpi"><div class="lb">Memtable</div><div class="v" id="ov-mem">—</div></div><div class="kpi"><div class="lb">Nós do grafo</div><div class="v" id="ov-graph">—</div></div><div class="kpi"><div class="lb">Arestas temporais</div><div class="v" id="ov-edges">—</div></div>
    <div class="kpi"><div class="lb">Texto indexado</div><div class="v" id="ov-text">—</div></div><div class="kpi"><div class="lb">Vetores indexados</div><div class="v" id="ov-vector">—</div></div><div class="kpi"><div class="lb">Entity keys</div><div class="v" id="ov-entities">—</div></div><div class="kpi"><div class="lb">ACT-R tracked</div><div class="v" id="ov-activation">—</div></div>
    <div class="kpi" id="ov-integrity-card"><div class="lb">Integridade</div><div class="v" id="ov-integrity" style="font-size:20px">não verificada</div></div><div class="kpi"><div class="lb">Agentes de IA <span class="fonte">módulo</span></div><div class="v" id="ov-agent" style="font-size:20px">a verificar…</div></div>
   </div>

   <div class="secttl" style="margin-top:28px">
     <h2>Agentes de IA & Red Team Security</h2>
     <span class="tag">módulo operacional · SPEC-0078 / SPEC-0079 / SPEC-0085</span>
   </div>
   <p class="sub">Telemetria ao vivo de Agent Black Box, governança MCP, aprovações humanas e laboratório de resiliência adversarial.</p>
   <div class="grid k4">
     <div class="kpi"><div class="lb">Agent Runs</div><div class="v" id="ov-ag-runs">—</div></div>
     <div class="kpi"><div class="lb">Tool Calls</div><div class="v" id="ov-ag-tools">—</div></div>
     <div class="kpi"><div class="lb">Chamadas Negadas</div><div class="v" id="ov-ag-denied">—</div></div>
     <div class="kpi"><div class="lb">Aprovações Pendentes</div><div class="v" id="ov-ag-pending">—</div></div>
     <div class="kpi"><div class="lb">Probes Red Team</div><div class="v" id="ov-rt-probes">—</div></div>
     <div class="kpi"><div class="lb">Ataques Bloqueados</div><div class="v" id="ov-rt-blocked">—</div></div>
     <div class="kpi"><div class="lb">Vazamento Upstream</div><div class="v" id="ov-rt-leaks">—</div></div>
     <div class="kpi"><div class="lb">Último LSN Red Team</div><div class="v" id="ov-rt-lsn">—</div></div>
   </div>

   <div class="grid k2" style="margin-top:16px">
     <div class="card">
       <h3>Governança de Agentes & Policy</h3>
       <div id="ov-ag-policy-detail" class="op-list"><div class="muted">A carregar…</div></div>
       <div style="margin-top:14px"><button class="btn" data-go="agent">Abrir Agent Black Box →</button></div>
     </div>
     <div class="card">
       <h3>Postura Adversarial Recente</h3>
       <div id="ov-rt-recent" class="op-list"><div class="muted">A carregar…</div></div>
       <div style="margin-top:14px"><button class="btn" data-go="redteam">Abrir Red Team Console →</button></div>
     </div>
   </div>

   <div class="grid k2" style="margin-top:20px"><div class="card"><h3>Capacidades da plataforma</h3><div class="cap-grid">
    <button class="cap" data-go="capabilities"><strong>Capacidades & runtime</strong><span>o que existe e o que está ativo agora</span></button><button class="cap" data-go="fontes"><strong>Dados & ingestão</strong><span>fontes, retenção, atributos</span></button><button class="cap" data-go="time"><strong>Tempo</strong><span>LSN, janela A/B, reconstrução</span></button><button class="cap" data-go="graph"><strong>Grafo & relações</strong><span>relações observadas, proveniência</span></button><button class="cap" data-go="custody"><strong>Integridade</strong><span>Merkle, cadeia de custódia</span></button><button class="cap" data-go="public"><strong>Dados públicos</strong><span>Portal da Transparência e PNCP</span></button><button class="cap" data-go="agent"><strong>Agent Black Box</strong><span>evidência e controle de agentes</span></button><button class="cap" data-go="soc"><strong>Sentinel / SOC</strong><span>segurança como módulo</span></button>
   </div></div><div class="card"><h3>Fronteiras de confiança</h3><ol class="trust-list"><li><strong>Fonte externa oficial</strong><span>CGU/Portal, PNCP etc. Ainda não é evidência Heraclitus.</span></li><li><strong>Ingerido no log</strong><span>Recebe LSN e passa ao histórico canônico append-only.</span></li><li><strong>Derivado</strong><span>Índices, grafo, texto, vetores e análises podem ser reconstruídos.</span></li><li><strong>Verificado</strong><span>Integridade só é afirmada após verificação real.</span></li></ol></div></div>
  </section>`},
  init(){
    document.querySelectorAll('#overview [data-go]').forEach(b=>b.onclick=()=>document.dispatchEvent(new CustomEvent('hera:navigate',{detail:b.dataset.go})));
    document.addEventListener('hera:stats',e=>this.applyStats(e.detail));
    document.addEventListener('hera:verify',e=>this.applyVerify(e.detail));
    document.addEventListener('hera:sem-ligacao',()=>this.offline());
    document.addEventListener('hera:endpoint-mudou',()=>this.checkAgent());
    document.addEventListener('hera:route-changed',e=>{
      if (e.detail?.route === 'overview') this.checkAgent();
    });
    this.checkAgent();
    if (!this.timer) {
      this.timer = setInterval(()=>{
        const sec = document.getElementById('overview');
        if (sec && (sec.classList.contains('on') || window.location.hash === '#overview' || !window.location.hash)) {
          this.checkAgent();
        }
      }, 2500);
    }
  },
  applyStats(s){
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=num(v)};
    set('ov-head',s?.head);set('ov-mem',s?.memtable);set('ov-graph',s?.graph_nodes);set('ov-edges',s?.tgraph_edges);
    set('ov-text',s?.text_indexed);set('ov-vector',s?.vector_indexed);set('ov-entities',s?.entity_keys);set('ov-activation',s?.activation_tracked);
    const a=document.getElementById('ov-aviso');if(a)a.hidden=true;
  },
  applyVerify(v){
    const e=document.getElementById('ov-integrity'),c=document.getElementById('ov-integrity-card');
    if(!e||!c)return;
    if(v?.erro){e.textContent='não verificada';c.className='kpi'}
    else if(v?.ok){e.textContent='íntegra no instante verificado';c.className='kpi ok'}
    else{e.textContent='FALHA';c.className='kpi bad'}
  },
  offline(){
    const a=document.getElementById('ov-aviso');if(!a)return;
    a.hidden=false;
    a.innerHTML='<strong>HeraclitusDB não está acessível.</strong> Dados públicos externos podem continuar consultáveis, mas nenhum dado externo deve aparecer como selado no banco.';
  },
  async checkAgent(){
    const el=document.getElementById('ov-agent');
    const [st, ev] = await Promise.all([
      API.agentGet('/api/v1/agent/status',{ms:4000}),
      API.agentGet('/api/v1/agent/red-team/events?limit=10',{ms:4000})
    ]);

    if (!st.ok) {
      if (el) el.textContent = st.falha==='auth'?'requer autenticação':'não conectado';
      document.dispatchEvent(new CustomEvent('hera:agent-status', { detail: { offline: true } }));
      return;
    }

    const s = st.dados?.summary || {};
    const p = st.dados?.policy || {};
    const g = st.dados?.gateway || {};
    if (el) el.textContent = `${num(s.runs)} runs · ${num(s.tool_calls)} tools`;

    const set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = num(v); };
    set('ov-ag-runs', s.runs);
    set('ov-ag-tools', s.tool_calls);
    set('ov-ag-denied', s.denied);
    set('ov-ag-pending', s.pending_approvals);

    const agDetail = document.getElementById('ov-ag-policy-detail');
    if (agDetail) {
      agDetail.innerHTML =
        line('Policy Ativa', `${p.id || 'agent-policy'} @ ${p.version || 'v0'}`) +
        line('Lifecycle & Regras', `${p.lifecycle || 'ACTIVE'} · ${num(p.rules)} regras`) +
        line('MCP Gateway', st.dados?.mcp_gateway || 'DISABLED') +
        line('Bypass Protection', st.dados?.bypass_protection || 'UNKNOWN') +
        line('Evidence Log', st.dados?.evidence_log || 'HEALTHY') +
        line('Requisições Gateway', `${num(g.requests)} (${num(g.allow)} allow / ${num(g.deny)} deny)`);
    }

    let totalProbes = 0, blocked = 0, leaks = 0, lastLsn = '—';
    if (ev.ok) {
      const events = ev.dados?.events || [];
      const sum = ev.dados?.summary || {};
      totalProbes = sum.returned ?? events.length;
      blocked = sum.blocked ?? events.filter(e => e.blocked).length;
      leaks = sum.reached_upstream ?? events.filter(e => Number(e.upstream_delta) > 0).length;
      if (events.length > 0) lastLsn = events[0].lsn ?? '—';

      const rtRecent = document.getElementById('ov-rt-recent');
      if (rtRecent) {
        if (!events.length) {
          rtRecent.innerHTML = '<div class="vazio">Nenhum ataque de laboratório registrado.</div>';
        } else {
          rtRecent.innerHTML = events.slice(0, 4).map(e => {
            const status = e.blocked ? '<span class="tag ok">BLOCKED</span>' : Number(e.upstream_delta) > 0 ? '<span class="tag bad">LEAK</span>' : '<span class="tag">OBSERVED</span>';
            return `<div class="op-line"><span>${status} <strong>${esc(e.attack_id || e.vector)}</strong> · ${esc(e.campaign_id)}</span><strong>LSN ${esc(e.lsn)}</strong></div>`;
          }).join('');
        }
      }
    }

    set('ov-rt-probes', totalProbes);
    set('ov-rt-blocked', blocked);
    const leakEl = document.getElementById('ov-rt-leaks');
    if (leakEl) {
      leakEl.textContent = num(leaks);
      leakEl.style.color = leaks > 0 ? 'var(--cor-alerta-texto, #e53e3e)' : 'inherit';
    }
    const lsnEl = document.getElementById('ov-rt-lsn');
    if (lsnEl) lsnEl.textContent = String(lastLsn);

    document.dispatchEvent(new CustomEvent('hera:agent-status', {
      detail: {
        offline: false,
        runs: s.runs,
        tool_calls: s.tool_calls,
        summary: s,
        gateway: g,
        policy: p,
        probes: totalProbes,
        blocked: blocked,
        leaks: leaks
      }
    }));
  }
};
