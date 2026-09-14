import { API, Falha } from '../api.js';

const esc = s => String(s ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => Number.isFinite(Number(v)) ? Number(v).toLocaleString('pt-BR') : '—';

const status = (label, kind = 'unknown') => `<span class="runtime-status ${kind}">${esc(label)}</span>`;

export const Capabilities = {
  render() {
    return `<section id="capabilities">
      <div class="secttl"><h2>Capacidades & runtime</h2><span class="tag">motor primeiro · módulos depois</span></div>
      <p class="sub">Catálogo das capacidades do HeraclitusDB e do que esta instância consegue provar em tempo de execução. “Não sondado” não significa “ausente”: significa que o dashboard não possui uma leitura segura para afirmar o estado.</p>
      <div class="provenance-banner"><strong>Regra de honestidade:</strong> <span>a UI só marca algo como observado quando recebeu um sinal real do backend. Feature compilável, roadmap e runtime ativo são estados diferentes.</span></div>
      <div id="cap-notice" class="aviso" hidden></div>
      <div class="card">
        <div class="toolbar"><button class="btn" id="cap-refresh">Atualizar runtime</button><span class="muted" id="cap-updated">ainda não sondado</span></div>
        <div class="table-wrap"><table class="cap-table"><thead><tr><th>Capacidade</th><th>O que entrega</th><th>Sinal observado</th><th>Estado</th></tr></thead><tbody id="cap-body"></tbody></table></div>
      </div>
      <div class="grid k2">
        <div class="card"><h3>Capacidades feature-gated</h3><p class="nota">Analytics/DataFusion, Arrow Flight, cold tier/lakehouse e aceleração GPU podem depender de features/configuração do binário. O dashboard não deve transformar documentação do projeto em “ativo agora”.</p></div>
        <div class="card"><h3>Capacidades sem sonda read-only dedicada</h3><p class="nota">Raft/cluster, GPU e partes do planner/retrieval não possuem hoje um endpoint read-only específico consumido por esta UI. Permanecem <strong>NÃO SONDADO</strong> até o Core expor capability discovery.</p></div>
      </div>
    </section>`;
  },
  init() {
    document.getElementById('cap-refresh').onclick = () => this.load();
    document.addEventListener('hera:endpoint-mudou', () => this.load());
    this.load();
  },
  async load() {
    const [stats, state, comp, sentinel, tier, agent, pub] = await Promise.all([
      API.stats(), API.state(), API.get('/compliance/status', {ms:12000}),
      API.get('/sentinel/status', {ms:8000}), API.get('/tier/sealed', {ms:8000}),
      API.agentGet('/api/v1/agent/status', {ms:8000}), API.publicGet('/status', {ms:5000})
    ]);
    const s = stats.ok ? stats.dados : {};
    const core = stats.ok;
    const probe = r => r.ok ? ['observado','good'] : r.falha === Falha.AUTH ? ['sem autorização','warn'] : r.falha === Falha.AUSENTE ? ['não suportado','muted'] : ['indisponível','bad'];
    const rows = [
      ['Log canônico HRKL / LSN','histórico append-only e base das projeções', core ? `head ${num(s.head)} · memtable ${num(s.memtable)}` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Tempo / replay / diff','AS OF, reconstrução temporal e comparação A/B', state.ok ? 'Core /state respondeu; /replay e /diff estão no contrato read-only' : 'Core sem estado observável', state.ok ? ['disponível','good'] : probe(state)],
      ['Grafo temporal','entidades, relações e arestas temporais', core ? `${num(s.graph_nodes)} nós · ${num(s.tgraph_edges)} arestas` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Texto / BM25','índice textual derivado e reconstruível', core ? `${num(s.text_indexed)} itens indexados` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Vetores / HNSW','índice vetorial derivado', core ? `${num(s.vector_indexed)} vetores` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Resolução de entidades','mapeamentos de identidade/entidade', core ? `${num(s.entity_keys)} chaves de entidade` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Ativação ACT-R','estado de ativação derivado do log', core ? `${num(s.activation_tracked)} itens rastreados` : 'sem /stats', core ? ['observado','good'] : probe(stats)],
      ['Integridade & compliance','Merkle, verificação e material de conformidade', comp.ok ? 'snapshot técnico retornado por /compliance/status' : 'sem snapshot', probe(comp)],
      ['Sentinel / SOC','eventos, incidentes e investigação de segurança', sentinel.ok ? 'runtime Sentinel respondeu' : 'sem runtime confirmado', probe(sentinel)],
      ['Cold tier / lakehouse','segmentos selados, receipts e tiering', tier.ok ? 'endpoint /tier/sealed disponível' : 'feature/endpoint não confirmado', probe(tier)],
      ['Agent Evidence & Control','OTLP, MCP gateway, policy, approvals e provas', agent.ok ? `${agent.dados?.summary?.runs ?? 0} runs · gateway ${agent.dados?.mcp_gateway ?? '—'}` : 'módulo Agent não confirmado', probe(agent)],
      ['Dados públicos oficiais','Portal da Transparência e PNCP via proxy allow-listed', pub.ok ? 'proxy de fontes oficiais habilitado' : 'proxy público indisponível', probe(pub)],
      ['Analytics / DataFusion / Arrow Flight','OLAP e stream Arrow quando compilado/configurado','sem sonda read-only dedicada nesta UI',['não sondado','unknown']],
      ['Raft / cluster','replicação distribuída do log','sem endpoint de capability discovery',['não sondado','unknown']],
      ['GPU','aceleração heterogênea quando habilitada','sem endpoint de capability discovery',['não sondado','unknown']],
      ['Retrieval multi-canal','fusão de texto, vetor, ativação e grafo','motor documentado; sem sonda operacional específica',['não sondado','unknown']],
    ];
    const body = document.getElementById('cap-body');
    body.innerHTML = rows.map(([name,desc,signal,st]) => `<tr><td><strong>${esc(name)}</strong></td><td>${esc(desc)}</td><td>${esc(signal)}</td><td>${status(st[0],st[1])}</td></tr>`).join('');
    document.getElementById('cap-updated').textContent = `sondado em ${new Date().toLocaleTimeString('pt-BR')}`;
    const notice = document.getElementById('cap-notice');
    if (!core) { notice.hidden=false; notice.textContent='Core não respondeu: estados dependentes do /stats permanecem indisponíveis. O catálogo não inventa ativação.'; }
    else notice.hidden=true;
  }
};
