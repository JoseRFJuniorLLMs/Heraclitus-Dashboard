import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const StateExplorer = {
  render() {
    const lsn = temporal.cursor.lsn;
    const lsnStr = lsn.toLocaleString('pt-BR');
    const demo = GOLDEN_DEMO;
    const watermarks = demo.getWatermarks();

    return `
      <section id="state" class="view-section">
        <div class="secttl">
          <h2>State Explorer</h2>
          <span class="tag tag-primary">ESTADO AS OF LSN ${lsnStr}</span>
        </div>
        <p class="sub">Reconstrução pontual do estado da base HeraclitusDB para um LSN ou instante de tempo físico/válido.</p>

        <!-- KPI STATE HEADER -->
        <div class="grid k4">
          <div class="kpi hero">
            <div class="lb">LSN SELECIONADO <span class="fonte">cursor global</span></div>
            <div class="v font-mono">${lsnStr}</div>
            <div class="nota">${temporal.isHistory() ? '⚠️ Estado Histórico' : '● HEAD Atual'}</div>
          </div>
          <div class="kpi ok">
            <div class="lb">HASH DO ESTADO <span class="fonte">Blake3 do snapshot</span></div>
            <div class="v font-mono sm">${demo.stateHash.slice(0, 16)}…</div>
            <div class="nota">Íntegro e reproduzível</div>
          </div>
          <div class="kpi">
            <div class="lb">ENTIDADES ATIVAS <span class="fonte">AS OF ${lsnStr}</span></div>
            <div class="v font-mono">14,291</div>
            <div class="nota">12 desativadas semanticamente</div>
          </div>
          <div class="kpi">
            <div class="lb">RELAÇÕES ATIVAS <span class="fonte">HVM temporal</span></div>
            <div class="v font-mono">89,410</div>
            <div class="nota">Grafo reconstruído</div>
          </div>
        </div>

        <!-- CONSULTA TEMPORAL LABORATÓRIO -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">⚡</span>
            <h2>Query Lab Temporal <small>(Execute GQL / Cypher com cláusulas AS OF LSN)</small></h2>
          </div>
          <div class="bd">
            <div class="query-box-wrap">
              <textarea id="state-query-input" class="query-textarea font-mono" rows="3">MATCH (e:Entity)-[r:RELATION]->(x)
AS OF LSN ${lsn.toString()}
WHERE e.type = 'Person' OR e.type = 'Server'
RETURN e, r, x LIMIT 50</textarea>
              <div class="query-actions">
                <button id="btn-run-query" class="btn-primary">Executar Consulta Temporal ➔</button>
                <button id="btn-explain-query" class="btn-out">EXPLAIN Plan</button>
              </div>
            </div>

            <div id="query-results-box" class="query-results margin-top">
              <h4>Resultados Reconstruídos no LSN ${lsnStr}:</h4>
              <div class="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Entidade Origem</th>
                      <th>Relação (HVM Edge)</th>
                      <th>Entidade Destino</th>
                      <th>Valid Time Start</th>
                      <th>Valid Time End</th>
                      <th>Provenance Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code class="font-mono">user:svc-bkp</code></td>
                      <td><span class="badge b-sup">ELEVATED_PRIVILEGE</span></td>
                      <td><code class="font-mono">server:prod-db-02</code></td>
                      <td class="muted">2026-09-08 14:00:00</td>
                      <td class="muted">2026-09-08 14:30:00</td>
                      <td><code class="font-mono">evt_b3_118ebd4</code></td>
                    </tr>
                    <tr>
                      <td><code class="font-mono">person:cpf-091</code></td>
                      <td><span class="badge b-esp">ACCESS_LOGGED</span></td>
                      <td><code class="font-mono">doc:lic-2026-99</code></td>
                      <td class="muted">2026-09-07 10:15:00</td>
                      <td class="muted">9999-12-31 (Ativo)</td>
                      <td><code class="font-mono">evt_b3_1176b63</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW WATERMARKS STATUS -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">🌊</span>
            <h2>Estado das Views Derivadas e Watermarks</h2>
            <span class="tag">SYNC CHECK</span>
          </div>
          <div class="bd">
            <div class="watermarks-grid">
              ${watermarks.views.map(v => `
                <div class="watermark-card ${v.lag > 0 ? 'lagging' : 'synced'}">
                  <div class="wm-title">${v.name}</div>
                  <div class="wm-val font-mono">LSN ${v.watermark.toLocaleString('pt-BR')}</div>
                  <div class="wm-status">
                    ${v.lag === 0 ? '<span class="badge b-rem">100% SYNCED</span>' : `<span class="badge b-ext">LAG -${v.lag} LSN</span>`}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this._bindEvents();
    temporal.subscribe((state) => {
      const sec = document.getElementById('state');
      if (sec && sec.classList.contains('on')) {
        // Refresh state explorer on cursor change
        const txt = document.getElementById('state-query-input');
        if (txt) {
          txt.value = `MATCH (e:Entity)-[r:RELATION]->(x)\nAS OF LSN ${temporal.cursor.lsn.toString()}\nWHERE e.type = 'Person' OR e.type = 'Server'\nRETURN e, r, x LIMIT 50`;
        }
      }
    });
  },

  _bindEvents() {
    const btnRun = document.getElementById('btn-run-query');
    if (btnRun) {
      btnRun.onclick = () => {
        btnRun.textContent = 'Executando no LSN...';
        setTimeout(() => btnRun.textContent = 'Executar Consulta Temporal ➔', 400);
      };
    }
  }
};
