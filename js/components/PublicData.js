import { API, explicarFalha } from '../api.js';
const esc = (s) => String(s ?? '—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const PublicData = {
  last: null,
  render() {
    return `
      <section id="public">
        <div class="secttl"><h2>Dados Públicos do Governo</h2><span class="tag">fonte oficial externa</span></div>
        <p class="sub">Consulte Portal da Transparência e PNCP sem confundir resposta externa com evidência já ingerida no HeraclitusDB.</p>
        <div class="provenance-banner"><strong>Regra:</strong> <span>EXTERNO → observado na fonte oficial. HERACLITUS → somente depois da ingestão canônica e atribuição de LSN.</span></div>
        <div class="grid k3">
          <div class="kpi"><div class="lb">Portal da Transparência</div><div class="v small-v" id="pd-portal">a verificar…</div></div>
          <div class="kpi"><div class="lb">PNCP</div><div class="v small-v" id="pd-pncp">a verificar…</div></div>
          <div class="kpi"><div class="lb">Resultado carregado</div><div class="v small-v" id="pd-count">—</div></div>
        </div>
        <div class="card">
          <h3>Consulta oficial</h3>
          <div class="query-grid">
            <label>Fonte<select id="pd-source"><option value="portal">Portal da Transparência</option><option value="pncp">PNCP</option></select></label>
            <label>Conjunto<select id="pd-dataset"></select></label>
            <label class="span2">Parâmetros da API<input id="pd-query" placeholder="ex.: pagina=1&dataInicial=01/09/2026&dataFinal=14/09/2026"></label>
          </div>
          <div class="acao"><button class="btn" id="pd-run">Consultar fonte oficial</button><button class="btn ghost" id="pd-clear">Limpar</button></div>
          <p class="nota">A chave do Portal, quando necessária, fica no processo Python do dashboard. Ela não é enviada ao navegador.</p>
          <div id="pd-notice" class="aviso" hidden></div>
        </div>
        <div class="card"><h3>Resposta <span class="pill b">EXTERNA · NÃO SELADA</span></h3><div id="pd-result" class="vazio-block">Nenhuma consulta executada.</div></div>
      </section>`;
  },
  async init() {
    this.datasets={portal:['orgaos-siafi','contratos','licitacoes','ceis','cnep','cepim','emendas','servidores','viagens','despesas-documentos','notas-fiscais','pessoa-juridica','acordos-leniencia','ceaf','cartoes'],pncp:['contratacoes-publicacao','tipos-contratos']};
    const src=document.getElementById('pd-source'); src.onchange=()=>this.fill(); this.fill();
    document.getElementById('pd-run').onclick=()=>this.run();
    document.getElementById('pd-clear').onclick=()=>{this.last=null;document.getElementById('pd-result').textContent='Nenhuma consulta executada.';document.getElementById('pd-count').textContent='—';};
    const status=await API.publicGet('/status',{ms:5000});
    if(status.ok){
      document.getElementById('pd-portal').textContent=status.dados.portal_transparencia?.configured?'configurado':'falta chave API';
      document.getElementById('pd-pncp').textContent='disponível';
    } else { document.getElementById('pd-portal').textContent='indisponível';document.getElementById('pd-pncp').textContent='indisponível'; }
  },
  fill(){const s=document.getElementById('pd-source').value, d=document.getElementById('pd-dataset');d.innerHTML=this.datasets[s].map(x=>`<option>${esc(x)}</option>`).join('');},
  async run(){
    const source=document.getElementById('pd-source').value,dataset=document.getElementById('pd-dataset').value,q=document.getElementById('pd-query').value.trim();
    const n=document.getElementById('pd-notice'), out=document.getElementById('pd-result'); n.hidden=true;out.textContent='Consultando…';
    const path=`/${source}/${encodeURIComponent(dataset)}${q?'?'+q:''}`; const r=await API.publicGet(path,{ms:30000});
    if(!r.ok){const e=explicarFalha(r.falha,r.estado);n.hidden=false;n.textContent=r.corpo?.message||e.longo;out.textContent='Sem resposta carregada.';return;}
    this.last={source,dataset,query:q,data:r.dados,observedAt:new Date().toISOString()};
    const rows=Array.isArray(r.dados)?r.dados:(r.dados?.data||r.dados?.resultado||r.dados?.items||[]);
    document.getElementById('pd-count').textContent=Array.isArray(rows)?`${rows.length} na resposta`:'objeto';
    const pre=document.createElement('pre');pre.className='json-view';pre.textContent=JSON.stringify(r.dados,null,2);out.replaceChildren(pre);
  }
};
