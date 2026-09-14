import { API, explicarFalha } from '../api.js';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CompliancePanel={
 render(){return `<section id="comp"><div class="secttl"><h2>Compliance técnico</h2><span class="tag">evidência, não certificação</span></div><p class="sub">Mostra o estado que o servidor realmente expõe. “Configurado” ou “verificado” não significa certificação legal por CGU, TCU, ANPD, ITI ou qualquer terceiro.</p><div id="co-notice" class="aviso" hidden></div><div class="card"><div class="acao"><button class="btn" id="co-load">Atualizar estado</button></div><div id="co-body" class="vazio-block">Nenhum estado consultado.</div></div></section>`},
 init(){document.getElementById('co-load').onclick=()=>this.load();this.load();},
 async load(){const out=document.getElementById('co-body'),n=document.getElementById('co-notice');out.textContent='Consultando…';n.hidden=true;const r=await API.get('/compliance/status',{ms:20000});if(!r.ok){const e=explicarFalha(r.falha,r.estado);n.hidden=false;n.innerHTML=`<strong>Compliance indisponível.</strong> ${esc(e.longo)}`;out.textContent='Sem dados.';return;}const p=document.createElement('pre');p.className='json-view';p.textContent=JSON.stringify(r.dados,null,2);out.replaceChildren(p);}
};
