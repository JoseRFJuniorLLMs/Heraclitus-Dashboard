import { API, explicarFalha } from '../api.js';
import { USE_CASES } from '../useCases.js';

const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const caseCard = item => `<article class="usecase-card usecase-${item.accent}" data-case="${item.id}">
  <div class="usecase-card-top"><span class="usecase-kicker">CASO DE USO</span><span class="usecase-snapshot">${item.snapshot.slice(0,10)}</span></div>
  <h3>${esc(item.name)}</h3><p>${esc(item.subtitle)}</p>
  <div class="usecase-capabilities">${item.capabilities.map(cap=>`<span>${esc(cap)}</span>`).join('')}</div>
  <div class="usecase-meta"><span>Fonte: ${esc(item.sourceUi)}</span><span>Runtime: ${esc(item.runtime.replace('http://',''))}</span></div>
  <div class="usecase-actions"><button class="btn usecase-open" type="button" data-route="${item.id}">Abrir caso completo</button><a class="btn ghost" href="${item.repo}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>
</article>`;

export const Cases={
  render(){return `<section id="cases" class="cases-hub">
    <div class="secttl"><h2>Casos de uso</h2><span class="tag">aplicações sobre HeraclitusDB</span></div>
    <p class="sub">Cada caso abaixo é uma aplicação independente, reconstruída a partir do respectivo projeto fonte. LABRA-AGU, AEB-STREAM e CGEE não são variações do mesmo template: cada um preserva sua própria interface, domínio, runtime e capacidades.</p>
    <div class="usecase-grid">${USE_CASES.map(caseCard).join('')}</div>

    <div class="cases-divider"><span>CASOS PERSISTIDOS NO CORE</span></div>
    <div class="card cases-core-card">
      <div class="cases-core-head"><div><h3>Investigações retornadas por <code>/cases</code></h3><p>Esta lista vem do HeraclitusDB Core e é diferente dos casos de uso acima.</p></div><button class="btn" id="cs-load" type="button">Atualizar do Core</button></div>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Estado</th><th>Título</th><th>LSN</th><th>Detalhes</th></tr></thead><tbody id="cs-body"><tr><td colspan="5" class="vazio">Aguardando consulta.</td></tr></tbody></table></div>
    </div>
    <div class="card"><h3>Detalhe do caso persistido</h3><div id="cs-detail" class="vazio-block">Selecione um caso retornado pelo Core.</div></div>
  </section>`},
  init(){
    document.querySelectorAll('.usecase-open').forEach(button=>button.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('hera:navigate',{detail:button.dataset.route}))));
    const load=document.getElementById('cs-load');if(load)load.onclick=()=>this.load();
  },
  async load(){const body=document.getElementById('cs-body'),r=await API.get('/cases',{ms:20000});if(!r.ok){body.innerHTML=`<tr><td colspan="5" class="vazio">${esc(explicarFalha(r.falha,r.estado).longo)}</td></tr>`;return;}const rows=Array.isArray(r.dados)?r.dados:(r.dados.cases||r.dados.items||[]);if(!rows.length){body.innerHTML='<tr><td colspan="5" class="vazio">Nenhum caso persistido retornado pelo Core.</td></tr>';return;}body.innerHTML=rows.map((x,i)=>`<tr><td class="mono">${esc(x.case_id||x.id)}</td><td>${esc(x.state||x.status)}</td><td>${esc(x.title||x.name)}</td><td class="mono">${esc(x.lsn||x.last_lsn||x.at_lsn)}</td><td><button class="btn ghost cs-open" data-i="${i}">abrir</button></td></tr>`).join('');body.querySelectorAll('.cs-open').forEach(b=>b.onclick=()=>this.open(rows[Number(b.dataset.i)]));},
  async open(row){const id=row.case_id||row.id,out=document.getElementById('cs-detail');if(!id){out.textContent='Caso sem identificador consultável.';return;}out.textContent='Consultando…';const r=await API.get(`/cases/${encodeURIComponent(id)}`,{ms:20000});const data=r.ok?r.dados:row;const p=document.createElement('pre');p.className='json-view';p.textContent=JSON.stringify(data,null,2);out.replaceChildren(p);}
};
