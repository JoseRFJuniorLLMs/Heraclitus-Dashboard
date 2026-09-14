export const Navigation = {
  render(){return `
    <div class="grp">Plataforma</div>
    <a data-s="overview" class="active"><span class="ic">⌂</span> Visão geral</a>
    <a data-s="capabilities"><span class="ic">▦</span> Capacidades & runtime</a>
    <a data-s="public"><span class="ic">▣</span> Dados públicos</a>
    <a data-s="fontes"><span class="ic">◇</span> Fontes & ingestão</a>
    <a data-s="atributos"><span class="ic">▩</span> Mapa de dados</a>
    <div class="grp">Tempo & investigação</div>
    <a data-s="time"><span class="ic">⏱</span> Linha do tempo</a>
    <a data-s="diff"><span class="ic">⇄</span> Comparar A/B</a>
    <a data-s="cases"><span class="ic">▤</span> Casos</a>
    <a data-s="graph"><span class="ic">⬡</span> Grafo & relações</a>
    <a data-s="replay"><span class="ic">▶</span> Reconstituição</a>
    <a data-s="why"><span class="ic">⌖</span> WHY / causalidade</a>
    <div class="grp">Evidência</div>
    <a data-s="custody"><span class="ic">◆</span> Cadeia de custódia</a>
    <a data-s="merkle"><span class="ic">▦</span> Integridade Merkle</a>
    <a data-s="comp"><span class="ic">✓</span> Compliance técnico</a>
    <div class="grp">Módulos</div>
    <a data-s="agent"><span class="ic">◎</span> Agent Black Box</a>
    <a data-s="soc"><span class="ic">◉</span> Sentinel / SOC</a>
    <a data-s="ia"><span class="ic">✦</span> Inteligência assistida</a>
    <div class="grp">Governança</div>
    <a data-s="exec"><span class="ic">▤</span> Painel executivo</a>
    <a data-s="titular"><span class="ic">👤</span> Titular / LGPD</a>
    <a data-s="auditor"><span class="ic">⚖</span> Auditoria</a>
  `},
  init(){
    const go=(id)=>{const target=document.getElementById(id);if(!target)return;$$('#nav a').forEach(x=>x.classList.toggle('active',x.dataset.s===id));$$('#main-content > section').forEach(s=>s.classList.toggle('on',s.id===id));history.replaceState(null,'','#'+id);};
    $$('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.s));
    document.addEventListener('hera:navigate',e=>go(e.detail));
    const initial=location.hash.slice(1); if(initial&&document.getElementById(initial))go(initial); else go('overview');
  }
};
