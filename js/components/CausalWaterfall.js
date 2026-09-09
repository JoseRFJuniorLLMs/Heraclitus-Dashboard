import { temporal } from '../temporal.js';

export const CausalWaterfall = {
  render() {
    return `
      <section id="waterfall" class="view-section">
        <div class="secttl">
          <h2>Causal Waterfall</h2>
          <span class="tag tag-primary">REPRESENTAÇÃO LINEAR DE CAUSALIDADE</span>
        </div>
        <p class="sub">Visão encadeada em cascata inspirada em distributed tracing, aplicada à árvore causal de eventos do log canônico.</p>

        <div class="card">
          <div class="hd">
            <span class="sec-ico">🌊</span>
            <h2>Cadeia Causal Principal <small>(INC-2026-0012)</small></h2>
          </div>
          <div class="bd">
            <div class="waterfall-container">
              <div class="wf-row depth-0">
                <span class="wf-lsn">LSN 18,440,000</span>
                <span class="wf-node node-evt">Event 1120: Login VPN (IP 187.*)</span>
                <span class="wf-bar" style="width: 80%; left: 0%;"></span>
              </div>
              <div class="wf-row depth-1">
                <span class="wf-lsn">LSN 18,440,050</span>
                <span class="wf-node node-evt">└─ Event 1131: Elevado privilégio svc-bkp</span>
                <span class="wf-bar" style="width: 60%; left: 15%;"></span>
              </div>
              <div class="wf-row depth-2">
                <span class="wf-lsn">LSN 18,440,100</span>
                <span class="wf-node node-evt">    └─ Resolution: Entidade Resolvida (Server B)</span>
                <span class="wf-bar" style="width: 45%; left: 30%;"></span>
              </div>
              <div class="wf-row depth-3">
                <span class="wf-lsn">LSN 18,440,120</span>
                <span class="wf-node node-fact">        └─ Fact: Fato Afirmado (Acesso Postgres)</span>
                <span class="wf-bar" style="width: 30%; left: 45%;"></span>
              </div>
              <div class="wf-row depth-4">
                <span class="wf-lsn">LSN 18,440,150</span>
                <span class="wf-node node-inc">            └─ Incident: INC-2026-0012 Disparado</span>
                <span class="wf-bar bar-inc" style="width: 15%; left: 60%;"></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },
  init() {}
};
