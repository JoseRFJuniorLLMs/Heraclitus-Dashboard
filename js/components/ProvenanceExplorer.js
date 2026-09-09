import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const ProvenanceExplorer = {
  render() {
    const graphData = GOLDEN_DEMO.getProvenanceGraph(temporal.cursor.lsn);
    const lsnStr = temporal.cursor.lsn.toLocaleString('pt-BR');

    return `
      <section id="graph" class="view-section">
        <div class="secttl">
          <h2>Provenance Explorer</h2>
          <span class="tag tag-primary">GRAFO DE PROVENIÊNCIA</span>
        </div>
        <p class="sub">Rastreabilidade ponta-a-ponta da linhagem de eventos, fatos, entidades, views e incidentes delimitada pelo cursor AS OF LSN ${lsnStr}.</p>

        <!-- GRAPH CANVAS CARD -->
        <div class="card">
          <div class="hd">
            <span class="sec-ico">⬡</span>
            <h2>Grafo Temporal Causal</h2>
            <div class="graph-legend">
              <span class="legend-node node-event">● Event</span>
              <span class="legend-node node-fact">● Fact</span>
              <span class="legend-node node-entity">● Entity</span>
              <span class="legend-node node-incident">● Incident</span>
              <span class="legend-node node-receipt">● Receipt</span>
            </div>
            <span class="tag">AS OF LSN ${lsnStr}</span>
          </div>
          <div class="bd">
            <div class="provenance-graph-container" id="provenance-canvas">
              <svg width="100%" height="400" viewBox="0 0 900 400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#1351B4" />
                  </marker>
                </defs>

                <!-- EDGES -->
                <line x1="120" y1="120" x2="280" y2="120" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="200" y="110" fill="#FFCD07" font-size="11" text-anchor="middle">CAUSED_BY</text>

                <line x1="280" y1="120" x2="440" y2="120" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="360" y="110" fill="#FFCD07" font-size="11" text-anchor="middle">DERIVED_FROM</text>

                <line x1="280" y1="120" x2="280" y2="240" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="290" y="180" fill="#FFCD07" font-size="11" text-anchor="middle">RESOLVED_TO</text>

                <line x1="440" y1="120" x2="600" y2="120" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="520" y="110" fill="#FFCD07" font-size="11" text-anchor="middle">PRODUCED_BY</text>

                <line x1="600" y1="120" x2="760" y2="120" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="680" y="110" fill="#FFCD07" font-size="11" text-anchor="middle">SUPPORTED_BY</text>

                <line x1="760" y1="120" x2="760" y2="240" stroke="#1351B4" stroke-width="2" marker-end="url(#arrow)" />
                <text x="770" y="180" fill="#FFCD07" font-size="11" text-anchor="middle">DEPENDS_ON</text>

                <!-- NODES -->
                <!-- Node 1: Event -->
                <g class="graph-node-grp" transform="translate(120, 120)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#071D41" stroke="#1351B4" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">Login VPN</text>
                  <text x="0" y="12" fill="#FFCD07" font-size="9" text-anchor="middle">LSN 18,440,000</text>
                </g>

                <!-- Node 2: Event -->
                <g class="graph-node-grp" transform="translate(280, 120)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#071D41" stroke="#e52207" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">Privilégio elevado</text>
                  <text x="0" y="12" fill="#FFCD07" font-size="9" text-anchor="middle">LSN 18,440,050</text>
                </g>

                <!-- Node 3: Entity -->
                <g class="graph-node-grp" transform="translate(280, 240)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#12264a" stroke="#168821" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">svc-bkp</text>
                  <text x="0" y="12" fill="#cfe0ff" font-size="9" text-anchor="middle">ENTITY Target</text>
                </g>

                <!-- Node 4: Event -->
                <g class="graph-node-grp" transform="translate(440, 120)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#071D41" stroke="#1351B4" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">Movimento lateral</text>
                  <text x="0" y="12" fill="#FFCD07" font-size="9" text-anchor="middle">LSN 18,440,100</text>
                </g>

                <!-- Node 5: Fact -->
                <g class="graph-node-grp" transform="translate(600, 120)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#12264a" stroke="#FFCD07" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">Acesso Postgres</text>
                  <text x="0" y="12" fill="#cfe0ff" font-size="9" text-anchor="middle">FACT Derivado</text>
                </g>

                <!-- Node 6: Incident -->
                <g class="graph-node-grp" transform="translate(760, 120)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#e52207" stroke="#fff" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">INC-2026-0012</text>
                  <text x="0" y="12" fill="#fff" font-size="9" text-anchor="middle">Sentinel Anomalia</text>
                </g>

                <!-- Node 7: Receipt -->
                <g class="graph-node-grp" transform="translate(760, 240)">
                  <rect x="-60" y="-20" width="120" height="40" rx="8" fill="#12264a" stroke="#168821" stroke-width="2"/>
                  <text x="0" y="-3" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">Proof b3:9f2a…</text>
                  <text x="0" y="12" fill="#168821" font-size="9" text-anchor="middle">VERIFIED RECEIPT</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    // bind graph interactivity
  }
};
