import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const TemporalExplorer = {
  selectedEvent: null,

  render() {
    const activityData = GOLDEN_DEMO.generateActivityMap();
    const events = GOLDEN_DEMO.getCanonicalEvents(80, temporal.cursor.lsn);
    const lsnStr = temporal.cursor.lsn.toLocaleString('pt-BR');

    return `
      <section id="timeline" class="on view-section">
        <div class="secttl">
          <h2>Temporal Explorer</h2>
          <span class="tag tag-primary">VISÃO OPERACIONAL TEMPORAL</span>
        </div>
        <p class="sub">Navegação, reconstrução, proveniência e verificação de integridade histórica da base HeraclitusDB.</p>

        <!-- CAMADA 1: TEMPORAL ACTIVITY MAP (52 Semanas) -->
        <div class="card card-activity">
          <div class="hd">
            <span class="sec-ico">▣</span>
            <h2>Temporal Activity Map <small>(52 semanas de densidade no log)</small></h2>
            <div class="activity-metric-selector">
              <label>Métrica:
                <select id="activity-metric">
                  <option value="events">Events (Eventos/dia)</option>
                  <option value="entities">Entities Changed</option>
                  <option value="incidents">Sentinel Incidents</option>
                  <option value="proofs">Verified Proofs</option>
                </select>
              </label>
            </div>
            <span class="tag">52 SEMANAS</span>
          </div>
          <div class="bd">
            <div class="heatmap-grid" id="heatmap-grid">
              ${activityData.map((d, idx) => `
                <div class="heat-cell level-${d.level} ${d.incidents ? 'has-incident' : ''}"
                     data-date="${d.date}"
                     data-count="${d.count}"
                     title="${d.date}: ${d.count} eventos ${d.incidents ? '(1 Incidente Sentinel)' : ''}"></div>
              `).join('')}
            </div>
            <div class="heatmap-legend">
              <span>Menos atividade</span>
              <div class="cells">
                <span class="heat-cell level-0"></span>
                <span class="heat-cell level-1"></span>
                <span class="heat-cell level-2"></span>
                <span class="heat-cell level-3"></span>
                <span class="heat-cell level-4"></span>
              </div>
              <span>Mais atividade</span>
              <span class="legend-incident">● Incidente Sentinel</span>
            </div>
          </div>
        </div>

        <!-- CAMADA 2: HISTORY RIVER (Multi-lane Synchronized Visualization) -->
        <div class="card card-history-river">
          <div class="hd">
            <span class="sec-ico">🌊</span>
            <h2>History River <small>(Lanes de log, fontes, entidades, views e proveniência)</small></h2>
            <span class="tag tag-demo">AS OF LSN ${lsnStr}</span>
          </div>
          <div class="bd">
            <div class="river-container">
              <div class="river-lane">
                <div class="lane-title">Canonical Log</div>
                <div class="lane-track">
                  ${events.slice(0, 15).map(e => `
                    <div class="river-node node-event ${e.sealed ? 'sealed' : ''}"
                         data-lsn="${e.lsn}"
                         style="left: ${((Number(e.lsn % 1000n)) / 10)}%"
                         title="LSN ${e.lsn}: ${e.kind} (${e.source})">
                      <span class="dot"></span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="river-lane">
                <div class="lane-title">Sources (Fontes)</div>
                <div class="lane-track">
                  <div class="source-bar bar-forge" style="left: 0%; width: 95%" title="forge (ativa)">forge</div>
                  <div class="source-bar bar-iam" style="left: 10%; width: 80%" title="iam_gateway">iam_gateway</div>
                  <div class="source-bar bar-pg" style="left: 20%; width: 40%; background: #e52207;" title="pg_sync (gap detectado no LSN 18,440,100)">pg_sync GAP</div>
                </div>
              </div>

              <div class="river-lane">
                <div class="lane-title">Derived Views</div>
                <div class="lane-track">
                  <div class="view-marker mark-ok" style="left: 95%" title="Graph HVM (watermark = HEAD)">Graph 100%</div>
                  <div class="view-marker mark-lag" style="left: 88%" title="Vector HNSW (-218 LSN lag)">Vector (-218 LSN)</div>
                </div>
              </div>

              <div class="river-lane">
                <div class="lane-title">Sentinel & Proofs</div>
                <div class="lane-track">
                  <div class="incident-marker" style="left: 65%" title="INC-2026-0012: Anomalia de acesso">▲ INC-0012</div>
                  <div class="proof-marker" style="left: 30%" title="Segment Seal b3:1100aa">◆ Seal 118</div>
                  <div class="proof-marker" style="left: 70%" title="RFC3161 Timestamp SERPRO">◆ Timestamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABELA VIRTUALIZADA DE EVENTOS -->
        <div class="card card-event-table">
          <div class="hd">
            <span class="sec-ico">📋</span>
            <h2>Log Canônico de Eventos <small>(Reconstrução determinística em tempo real)</small></h2>
            <div class="table-tools">
              <input id="event-search" type="search" placeholder="Filtrar por LSN, tipo, entidade, fonte..." class="input-search">
            </div>
          </div>
          <div class="bd scroll">
            <table id="canonical-events-table">
              <thead>
                <tr>
                  <th>LSN</th>
                  <th>System Time</th>
                  <th>Valid Time</th>
                  <th>Kind</th>
                  <th>Source</th>
                  <th>Entity Target</th>
                  <th>Merkle Root</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(e => `
                  <tr class="event-row" data-lsn="${e.lsn}">
                    <td class="num font-mono"><strong>${e.lsn.toLocaleString('pt-BR')}</strong></td>
                    <td class="muted">${e.systemTime.replace('T', ' ').slice(0, 19)}</td>
                    <td class="muted">${e.validTime.replace('T', ' ').slice(0, 19)}</td>
                    <td><span class="badge b-sup">${e.kind}</span></td>
                    <td><span class="code-source">${e.source}</span></td>
                    <td><code class="font-mono">${e.entity}</code></td>
                    <td class="font-mono muted">${e.merkleRoot.slice(0, 14)}…</td>
                    <td><span class="badge ${e.verified ? 'b-rem' : 'b-esp'}">${e.verified ? 'VERIFIED' : 'ACTIVE'}</span></td>
                    <td><button class="btn-sm btn-inspect" data-lsn="${e.lsn}">Inspecionar ➔</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- EVENT INSPECTOR (Drawer Lateral) -->
        <div id="event-inspector-drawer" class="drawer ${this.selectedEvent ? 'open' : ''}">
          <div class="drawer-header">
            <h3>Event Inspector</h3>
            <button id="close-drawer" class="btn-close">✕</button>
          </div>
          <div class="drawer-body" id="drawer-content">
            ${this._renderDrawerContent(events[0])}
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this._bindEvents();
    temporal.subscribe((state, eventKey) => {
      const sec = document.getElementById('timeline');
      if (sec && sec.classList.contains('on')) {
        const eventsTable = document.querySelector('#canonical-events-table tbody');
        if (eventsTable) {
          const events = GOLDEN_DEMO.getCanonicalEvents(80, temporal.cursor.lsn);
          eventsTable.innerHTML = events.map(e => `
            <tr class="event-row" data-lsn="${e.lsn}">
              <td class="num font-mono"><strong>${e.lsn.toLocaleString('pt-BR')}</strong></td>
              <td class="muted">${e.systemTime.replace('T', ' ').slice(0, 19)}</td>
              <td class="muted">${e.validTime.replace('T', ' ').slice(0, 19)}</td>
              <td><span class="badge b-sup">${e.kind}</span></td>
              <td><span class="code-source">${e.source}</span></td>
              <td><code class="font-mono">${e.entity}</code></td>
              <td class="font-mono muted">${e.merkleRoot.slice(0, 14)}…</td>
              <td><span class="badge ${e.verified ? 'b-rem' : 'b-esp'}">${e.verified ? 'VERIFIED' : 'ACTIVE'}</span></td>
              <td><button class="btn-sm btn-inspect" data-lsn="${e.lsn}">Inspecionar ➔</button></td>
            </tr>
          `).join('');
          this._bindRowClick();
        }
      }
    });
  },

  _bindEvents() {
    this._bindRowClick();

    const btnClose = document.getElementById('close-drawer');
    if (btnClose) {
      btnClose.onclick = () => {
        const drawer = document.getElementById('event-inspector-drawer');
        if (drawer) drawer.classList.remove('open');
      };
    }

    const heatCells = document.querySelectorAll('.heat-cell');
    heatCells.forEach(cell => {
      cell.onclick = () => {
        const date = cell.dataset.date;
        if (date) {
          // Adjust cursor LSN proportionally
          temporal.setCursor(temporal.headLsn - 50000n, 'AS_OF_SYSTEM_TIME');
        }
      };
    });
  },

  _bindRowClick() {
    const inspectBtns = document.querySelectorAll('.btn-inspect');
    inspectBtns.forEach(btn => {
      btn.onclick = () => {
        const lsn = BigInt(btn.dataset.lsn);
        const events = GOLDEN_DEMO.getCanonicalEvents(80, temporal.cursor.lsn);
        const evt = events.find(e => e.lsn === lsn) || events[0];
        const drawer = document.getElementById('event-inspector-drawer');
        const drawerContent = document.getElementById('drawer-content');
        if (drawer && drawerContent) {
          drawerContent.innerHTML = this._renderDrawerContent(evt);
          drawer.classList.add('open');
          this._bindDrawerActions(evt);
        }
      };
    });
  },

  _renderDrawerContent(evt) {
    if (!evt) return '<p class="muted">Nenhum evento selecionado.</p>';
    const canonicalRef = `hera://database/main/event/${evt.id}?lsn=${evt.lsn}`;

    return `
      <div class="evt-details">
        <div class="detail-group">
          <label>CANONICAL REFERENCE (ENDEREÇO COPIÁVEL)</label>
          <div class="copy-box">
            <code class="font-mono">${canonicalRef}</code>
            <button id="btn-copy-ref" class="btn-sm">Copiar</button>
          </div>
        </div>

        <div class="grid-2col margin-top">
          <div><label>LSN</label><p class="val font-mono">${evt.lsn.toString()}</p></div>
          <div><label>EVENT ID</label><p class="val font-mono">${evt.id}</p></div>
          <div><label>HLC</label><p class="val font-mono">${evt.hlc.toString()}</p></div>
          <div><label>KIND</label><p class="val"><span class="badge b-sup">${evt.kind}</span></p></div>
          <div><label>SYSTEM TIME</label><p class="val muted">${evt.systemTime}</p></div>
          <div><label>VALID TIME</label><p class="val muted">${evt.validTime}</p></div>
          <div><label>SOURCE</label><p class="val"><code>${evt.source}</code></p></div>
          <div><label>MERKLE ROOT</label><p class="val font-mono">${evt.merkleRoot}</p></div>
        </div>

        <div class="detail-group margin-top">
          <label>PAYLOAD DO FACTO (JSON CANÔNICO)</label>
          <pre class="json-code">${JSON.stringify(evt.payload, null, 2)}</pre>
        </div>

        <div class="drawer-actions margin-top">
          <button id="btn-set-asof-here" class="btn-action primary">Fixar AS OF neste LSN</button>
          <button id="btn-set-point-a" class="btn-action">Definir como Ponto A (Compare)</button>
          <button id="btn-set-point-b" class="btn-action">Definir como Ponto B (Compare)</button>
        </div>
      </div>
    `;
  },

  _bindDrawerActions(evt) {
    const btnAsof = document.getElementById('btn-set-asof-here');
    if (btnAsof) btnAsof.onclick = () => temporal.setCursor(evt.lsn, 'AS_OF_LSN');

    const btnA = document.getElementById('btn-set-point-a');
    if (btnA) btnA.onclick = () => temporal.setRangeA(evt.lsn);

    const btnB = document.getElementById('btn-set-point-b');
    if (btnB) btnB.onclick = () => temporal.setRangeB(evt.lsn);

    const btnCopy = document.getElementById('btn-copy-ref');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const ref = `hera://database/main/event/${evt.id}?lsn=${evt.lsn}`;
        navigator.clipboard.writeText(ref);
        btnCopy.textContent = 'Copiado!';
        setTimeout(() => btnCopy.textContent = 'Copiar', 2000);
      };
    }
  }
};
