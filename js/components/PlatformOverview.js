import { API } from '../api.js';

const num = (v) => Number.isFinite(v) ? Number(v).toLocaleString('pt-BR') : '—';

export const PlatformOverview = {
  render() {
    return `
      <section id="overview" class="on">
        <div class="secttl"><h2>HeraclitusDB</h2><span class="tag">plataforma temporal e verificável</span></div>
        <p class="sub">Estado real do motor, proveniência e módulos. Sem agentes, SOC ou dados públicos fictícios como requisito para o banco existir.</p>
        <div id="ov-aviso" class="aviso" hidden></div>
        <div class="grid k4">
          <div class="kpi"><div class="lb">Head LSN <span class="fonte"><code>/stats</code></span></div><div class="v" id="ov-head">—</div></div>
          <div class="kpi"><div class="lb">Memtable <span class="fonte"><code>/stats</code></span></div><div class="v" id="ov-mem">—</div></div>
          <div class="kpi"><div class="lb">Nós do grafo</div><div class="v" id="ov-graph">—</div></div>
          <div class="kpi"><div class="lb">Arestas temporais</div><div class="v" id="ov-edges">—</div></div>
          <div class="kpi"><div class="lb">Texto indexado</div><div class="v" id="ov-text">—</div></div>
          <div class="kpi"><div class="lb">Vetores indexados</div><div class="v" id="ov-vector">—</div></div>
          <div class="kpi" id="ov-integrity-card"><div class="lb">Integridade</div><div class="v" id="ov-integrity" style="font-size:20px">não verificada</div></div>
          <div class="kpi"><div class="lb">Agentes de IA <span class="fonte">módulo opcional</span></div><div class="v" id="ov-agent" style="font-size:20px">a verificar…</div></div>
        </div>
        <div class="grid k2">
          <div class="card">
            <h3>Capacidades da plataforma</h3>
            <div class="cap-grid">
              <button class="cap" data-go="fontes"><strong>Dados & ingestão</strong><span>fontes, retenção, atributos</span></button>
              <button class="cap" data-go="time"><strong>Tempo</strong><span>LSN, janela A/B, reconstrução</span></button>
              <button class="cap" data-go="graph"><strong>Grafo & relações</strong><span>relações observadas, proveniência</span></button>
              <button class="cap" data-go="custody"><strong>Integridade</strong><span>Merkle, cadeia de custódia</span></button>
              <button class="cap" data-go="agent"><strong>Agent Black Box</strong><span>evidência e controle de agentes</span></button>
              <button class="cap" data-go="soc"><strong>Sentinel / SOC</strong><span>segurança como módulo</span></button>
            </div>
          </div>
          <div class="card">
            <h3>Fronteiras de confiança</h3>
            <ol class="trust-list">
              <li><strong>Fonte externa oficial</strong><span>CGU/Portal, PNCP etc. Ainda não é evidência Heraclitus.</span></li>
              <li><strong>Ingerido no log</strong><span>Recebe LSN e passa a integrar o histórico canônico append-only.</span></li>
              <li><strong>Derivado</strong><span>Índices, grafo, texto, vetores e análises podem ser reconstruídos.</span></li>
              <li><strong>Verificado</strong><span>Integridade só é afirmada após verificação real, nunca por decoração da UI.</span></li>
            </ol>
          </div>
        </div>
      </section>`;
  },
  init() {
    document.querySelectorAll('#overview [data-go]').forEach(b => b.onclick = () => document.dispatchEvent(new CustomEvent('hera:navigate', {detail:b.dataset.go})));
    document.addEventListener('hera:stats', e => this.applyStats(e.detail));
    document.addEventListener('hera:verify', e => this.applyVerify(e.detail));
    document.addEventListener('hera:sem-ligacao', () => this.offline());
    this.checkAgent();
  },
  applyStats(s) {
    const set = (id,v) => { const e=document.getElementById(id); if(e)e.textContent=num(v); };
    set('ov-head', s?.head); set('ov-mem', s?.memtable); set('ov-graph', s?.graph_nodes);
    set('ov-edges', s?.tgraph_edges); set('ov-text', s?.text_indexed); set('ov-vector', s?.vector_indexed);
    const a=document.getElementById('ov-aviso'); if(a)a.hidden=true;
  },
  applyVerify(v) {
    const e=document.getElementById('ov-integrity'), c=document.getElementById('ov-integrity-card'); if(!e||!c)return;
    if(v?.erro){e.textContent='não verificada';c.className='kpi';}
    else if(v?.ok){e.textContent='íntegra no instante verificado';c.className='kpi ok';}
    else{e.textContent='FALHA';c.className='kpi bad';}
  },
  offline() {
    const a=document.getElementById('ov-aviso'); if(!a)return; a.hidden=false;
    a.innerHTML='<strong>HeraclitusDB não está acessível.</strong> As áreas externas de dados públicos continuam utilizáveis, mas nenhum dado externo deve ser apresentado como selado no banco.';
  },
  async checkAgent() {
    const el=document.getElementById('ov-agent'); if(!el)return;
    const r=await API.agentGet('/api/v1/agent/status',{ms:3500});
    if(!r.ok){el.textContent='não conectado';return;}
    const s=r.dados?.summary || {};
    el.textContent=`${num(s.runs)} runs · ${num(s.tool_calls)} tools`;
  }
};
