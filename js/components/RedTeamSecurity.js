import { API, explicarFalha } from '../api.js';

const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('pt-BR'):v??'—';
const time=n=>{const ms=Number(n)/1e6;return Number.isFinite(ms)?new Date(ms).toLocaleString('pt-BR'):'—'};
const badge=(text,kind='')=>`<span class="tag ${kind}">${esc(text)}</span>`;

export const RedTeamSecurity={
  events:[],
  render(){return `<section id="redteam">
    <div class="secttl"><h2>Red Team · Agent Security</h2><span class="tag">evidência real · HRKL</span></div>
    <p class="sub">Tentativas adversariais autorizadas contra a instância local. O painel separa <strong>telemetria do laboratório</strong> das decisões nativas do Gateway. Nada aqui transforma um relato do runner em prova de que o upstream foi ou não atingido.</p>
    <div id="rt-notice" class="aviso" hidden></div>
    <div class="grid k4">
      <div class="kpi"><div class="lb">Probes registrados</div><div class="v" id="rt-total">—</div></div>
      <div class="kpi"><div class="lb">Bloqueados</div><div class="v" id="rt-blocked">—</div></div>
      <div class="kpi"><div class="lb">Chegaram ao upstream</div><div class="v" id="rt-upstream">—</div></div>
      <div class="kpi"><div class="lb">Último LSN</div><div class="v" id="rt-lsn">—</div></div>
    </div>
    <div class="grid k2">
      <div class="card"><h3>Estado do herói</h3><div id="rt-state" class="op-list"><div class="muted">A carregar…</div></div></div>
      <div class="card"><h3>Campanhas</h3><div id="rt-campaigns" class="op-list"><div class="muted">A carregar…</div></div></div>
    </div>
    <div class="card"><h3>Linha do tempo dos ataques <button id="rt-refresh" class="btn" style="float:right">Atualizar</button></h3>
      <div class="table-wrap"><table><thead><tr><th>Hora</th><th>Campanha</th><th>Vetor</th><th>Alvo</th><th>Resultado</th><th>Motivo</th><th>Upstream</th><th>LSN</th></tr></thead><tbody id="rt-body"><tr><td colspan="8" class="vazio">A carregar…</td></tr></tbody></table></div>
    </div>
    <div class="card"><h3>Contrato de verdade</h3><p class="nota"><strong>redteam_lab</strong> prova que o relatório do laboratório foi anexado ao HRKL naquele LSN. <strong>PolicyEvaluated, ToolDenied, approvals e ExternalEffectObserved</strong> são a evidência independente do HeraclitusDB. Uma demonstração séria mostra os dois lados, porque computadores também sabem mentir quando a interface facilita.</p></div>
  </section>`},
  init(){document.getElementById('rt-refresh')?.addEventListener('click',()=>this.load());document.addEventListener('hera:endpoint-mudou',()=>this.load());this.load();},
  async load(){
    const [ev,st]=await Promise.all([
      API.agentGet('/api/v1/agent/red-team/events?limit=500',{ms:15000}),
      API.agentGet('/api/v1/agent/status',{ms:8000})
    ]);
    const notice=document.getElementById('rt-notice');
    if(!ev.ok){const x=explicarFalha(ev.falha,ev.estado);notice.hidden=false;notice.innerHTML=`<strong>Red Team Evidence indisponível.</strong> ${esc(x.longo)} A API precisa expor <code>/api/v1/agent/red-team/events</code>.`;this.clear();return;}
    notice.hidden=true;
    this.events=ev.dados?.events||[];
    const sum=ev.dados?.summary||{};
    const last=this.events[0]||{};
    document.getElementById('rt-total').textContent=fmt(sum.returned??this.events.length);
    document.getElementById('rt-blocked').textContent=fmt(sum.blocked??this.events.filter(e=>e.blocked).length);
    document.getElementById('rt-upstream').textContent=fmt(sum.reached_upstream??this.events.filter(e=>Number(e.upstream_delta)>0).length);
    document.getElementById('rt-lsn').textContent=fmt(last.lsn);
    const line=(k,v)=>`<div class="op-line"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`;
    const s=st.ok?st.dados:{};
    document.getElementById('rt-state').innerHTML=line('Gateway',s.mcp_gateway??'—')+line('Bypass protection',s.bypass_protection??'—')+line('Evidence log',s.evidence_log??'—')+line('Capture',s.capture?.mode??'—')+line('Native DENY',fmt(s.gateway?.deny))+line('Approval replay rejects',fmt(s.gateway?.approval_replay_rejected));
    const campaigns=new Map();for(const e of this.events){const id=e.campaign_id||'manual',c=campaigns.get(id)||{n:0,b:0,u:0};c.n++;if(e.blocked)c.b++;if(Number(e.upstream_delta)>0)c.u++;campaigns.set(id,c)}
    document.getElementById('rt-campaigns').innerHTML=campaigns.size?[...campaigns.entries()].map(([id,c])=>line(id,`${c.n} probes · ${c.b} bloqueados · ${c.u} upstream`)).join(''):'<div class="vazio">Nenhuma campanha registrada.</div>';
    this.draw();
  },
  clear(){['rt-total','rt-blocked','rt-upstream','rt-lsn'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—'});document.getElementById('rt-body').innerHTML='<tr><td colspan="8" class="vazio">Sem dados.</td></tr>';document.getElementById('rt-state').textContent='—';document.getElementById('rt-campaigns').textContent='—';},
  draw(){const body=document.getElementById('rt-body');if(!this.events.length){body.innerHTML='<tr><td colspan="8" class="vazio">Nenhum ataque de laboratório registrado no HRKL.</td></tr>';return;}body.innerHTML=this.events.map(e=>{
    const result=e.blocked?badge(e.result||'blocked','ok'):Number(e.upstream_delta)>0?badge(e.result||'reached-upstream','bad'):badge(e.result||'observed');
    return `<tr><td>${esc(time(e.observed_at_unix_nanos))}</td><td class="mono">${esc(e.campaign_id)}</td><td>${esc(e.vector)}</td><td class="mono">${esc(e.target)}</td><td>${result}</td><td class="mono">${esc(e.reason_code)}</td><td>${Number(e.upstream_delta)>0?'SIM':'não'}</td><td class="mono">${esc(e.lsn)}</td></tr>`;
  }).join('');}
};
