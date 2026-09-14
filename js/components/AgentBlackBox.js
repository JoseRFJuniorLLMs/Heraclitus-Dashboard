import { API, explicarFalha, Falha } from '../api.js';
const fmt=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('pt-BR'):v??'—';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line=(k,v)=>`<div class="op-line"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`;
export const AgentBlackBox={
 runs:[],
 render(){return `<section id="agent">
  <div class="secttl"><h2>Agent Evidence & Control</h2><span class="tag">Agent Black Box · módulo</span></div>
  <p class="sub">Auditoria verificável de chamadas de ferramentas de agentes, política e aprovações. Este módulo não redefine a identidade do HeraclitusDB.</p>
  <div id="ag-notice" class="aviso" hidden></div>
  <div class="grid k4">
   <div class="kpi"><div class="lb">Runs</div><div class="v" id="ag-runs">—</div></div><div class="kpi"><div class="lb">Tool calls</div><div class="v" id="ag-tools">—</div></div><div class="kpi"><div class="lb">Negadas</div><div class="v" id="ag-denied">—</div></div><div class="kpi"><div class="lb">Aprovações pendentes</div><div class="v" id="ag-pending">—</div></div>
   <div class="kpi"><div class="lb">MCP gateway</div><div class="v small-v" id="ag-gateway">—</div></div><div class="kpi"><div class="lb">Bypass protection</div><div class="v small-v" id="ag-bypass">—</div></div><div class="kpi"><div class="lb">Capture mode</div><div class="v small-v" id="ag-capture">—</div></div><div class="kpi"><div class="lb">Integridade</div><div class="v small-v" id="ag-integrity">—</div></div>
  </div>
  <div class="grid k2">
   <div class="card"><h3>Policy ativa</h3><div id="ag-policy" class="op-list"><div class="muted">A carregar…</div></div></div>
   <div class="card"><h3>Ingestão & gateway</h3><div id="ag-ops" class="op-list"><div class="muted">A carregar…</div></div></div>
  </div>
  <div class="card"><h3>Execuções reais <button class="btn" id="ag-refresh" style="float:right">Atualizar</button></h3><div class="table-wrap"><table><thead><tr><th>Run</th><th>Agente</th><th>Status</th><th>Tools</th><th>Denied</th><th>Integridade</th><th></th></tr></thead><tbody id="ag-body"><tr><td colspan="7" class="vazio">A carregar…</td></tr></tbody></table></div></div>
  <div class="grid k2"><div class="card"><h3>Detalhe do run</h3><div id="ag-detail" class="vazio-block">Selecione uma execução.</div></div><div class="card"><h3>Timeline da execução</h3><div id="ag-timeline" class="vazio-block">Selecione uma execução.</div></div></div>
  <div class="card"><h3>Escopo real</h3><p class="nota">OTLP e chamadas MCP que passam pelo gateway podem ser registradas/controladas. Ferramentas internas de Claude Code/Codex não passam automaticamente por aqui sem hooks/adaptadores próprios. Esta UI geral permanece somente leitura: aprovar ações ou ativar policy exige a superfície autorizada do Agent.</p></div>
 </section>`},
 init(){document.getElementById('ag-refresh').onclick=()=>this.load();document.addEventListener('hera:endpoint-mudou',()=>this.load());this.load();},
 async load(){
  const [st,rr]=await Promise.all([API.agentGet('/api/v1/agent/status',{ms:6000}),API.agentGet('/api/v1/agent/runs?limit=50',{ms:10000})]);
  if(!st.ok){const n=document.getElementById('ag-notice'),e=explicarFalha(st.falha,st.estado);n.hidden=false;n.innerHTML=`<strong>Módulo Agent não conectado.</strong> ${esc(e.longo)} ${st.falha===Falha.AUTH?'Configure o Bearer/OIDC Agent em “Conectar ao banco”.':'Configure a superfície Agent do HeraclitusDB em :8080.'}`;this.clear();return;}
  document.getElementById('ag-notice').hidden=true;const s=st.dados?.summary||{}, set=(id,v)=>document.getElementById(id).textContent=fmt(v);
  set('ag-runs',s.runs);set('ag-tools',s.tool_calls);set('ag-denied',s.denied);set('ag-pending',s.pending_approvals);set('ag-gateway',st.dados.mcp_gateway);set('ag-bypass',st.dados.bypass_protection);set('ag-capture',st.dados.capture?.mode);set('ag-integrity',s.integrity);
  const p=st.dados.policy||{};document.getElementById('ag-policy').innerHTML=line('Identidade',`${p.id??'—'} @ ${p.version??'—'}`)+line('Lifecycle',p.lifecycle)+line('Regras',p.rules)+line('Ativada por',p.activated_by)+line('Auth do módulo',st.dados.auth)+line('RFC 3161',st.dados.rfc3161);
  const ing=st.dados.ingest||{},g=st.dados.gateway||{};document.getElementById('ag-ops').innerHTML=line('Eventos aceites',fmt(ing.events))+line('Duplicatas',fmt(ing.duplicates))+line('Conflitos',fmt(ing.conflicts))+line('Rejeitados',fmt(ing.rejected))+line('Spans ignorados',fmt(ing.ignored_spans))+line('Gateway requests',fmt(g.requests))+line('ALLOW / DENY',`${fmt(g.allow)} / ${fmt(g.deny)}`)+line('Require approval',fmt(g.require_approval))+line('Shadow deny',fmt(g.shadow_deny))+line('Upstream errors',fmt(g.upstream_errors));
  this.runs=rr.ok?(rr.dados.runs||[]):[];this.drawRuns();
 },
 clear(){['ag-runs','ag-tools','ag-denied','ag-pending','ag-gateway','ag-bypass','ag-capture','ag-integrity'].forEach(id=>document.getElementById(id).textContent='—');document.getElementById('ag-body').innerHTML='<tr><td colspan="7" class="vazio">Módulo indisponível.</td></tr>';document.getElementById('ag-policy').textContent='—';document.getElementById('ag-ops').textContent='—';},
 drawRuns(){const b=document.getElementById('ag-body');if(!this.runs.length){b.innerHTML='<tr><td colspan="7" class="vazio">Nenhuma execução registrada.</td></tr>';return;}b.innerHTML=this.runs.map((r,i)=>`<tr><td class="mono">${esc(r.run_id||r.id)}</td><td>${esc(r.agent_name||r.agent_id||r.agent)}</td><td>${esc(r.status)}</td><td>${fmt(r.tool_calls)}</td><td>${fmt(r.denied)}</td><td>${esc(r.integrity)}</td><td><button class="btn ghost ag-open" data-i="${i}">abrir</button></td></tr>`).join('');b.querySelectorAll('.ag-open').forEach(x=>x.onclick=()=>this.open(this.runs[Number(x.dataset.i)]));},
 async open(r){
  const id=r.run_id||r.id;if(!id)return;const out=document.getElementById('ag-timeline'),detail=document.getElementById('ag-detail');out.textContent='A carregar…';detail.textContent='A carregar…';
  const [dr,q]=await Promise.all([API.agentGet(`/api/v1/agent/runs/${encodeURIComponent(id)}`,{ms:15000}),API.agentGet(`/api/v1/agent/runs/${encodeURIComponent(id)}/timeline?limit=500`,{ms:15000})]);
  if(dr.ok){const d=dr.dados,ri=d.integrity||{};const tools=d.tool_calls||[],approvals=d.approvals||[],decisions=d.policy_decisions||[];detail.innerHTML=line('Run',id)+line('Integridade',ri.state)+line('LSN',`${ri.first_lsn??'—'} → ${ri.last_lsn??'—'}`)+line('Parents quebrados',ri.broken_parents)+line('Tool calls',tools.length)+line('Aprovações',approvals.length)+line('Decisões de policy',decisions.length)+`<details><summary>Detalhe completo</summary><pre>${esc(JSON.stringify(d,null,2))}</pre></details>`;}else detail.textContent='Detalhe indisponível.';
  if(!q.ok){out.textContent='Timeline indisponível.';return;}const rows=q.dados.entries||q.dados.timeline||q.dados.events||q.dados.evidence||[];if(!rows.length){out.textContent='Nenhuma evidência na timeline.';return;}const wrap=document.createElement('div');wrap.className='evidence-list';for(const e of rows){const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('pre');s.textContent=`${e.kind||e.type||'Evidence'} · LSN ${e.integrity?.lsn??e.lsn??'—'}`;p.textContent=JSON.stringify(e,null,2);d.append(s,p);wrap.append(d);}out.replaceChildren(wrap);
 }
};
