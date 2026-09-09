import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const ViewWatermarks = {
  render() {
    const wm = GOLDEN_DEMO.getWatermarks();
    const headStr = wm.head.toLocaleString('pt-BR');

    return `
      <section id="watermarks-view" class="view-section">
        <div class="secttl">
          <h2>Derived View Watermarks & Synchronization</h2>
          <span class="tag tag-primary">DESEMPENHO DAS VIEWS</span>
        </div>
        <p class="sub">Monitoramento de watermarks do motor de views em relação ao log HEAD canônico (${headStr}).</p>

        <div class="card">
          <div class="hd">
            <span class="sec-ico">🌊</span>
            <h2>Watermarks de Índices e Motores Derivados</h2>
            <span class="tag">HEAD ${headStr}</span>
          </div>
          <div class="bd">
            <div class="watermarks-list">
              ${wm.views.map(v => `
                <div class="wm-row-item ${v.lag > 0 ? 'is-lag' : 'is-sync'}">
                  <div class="wm-info">
                    <strong>${v.name}</strong>
                    <span class="muted font-mono">Watermark: LSN ${v.watermark.toLocaleString('pt-BR')}</span>
                  </div>
                  <div class="wm-progress">
                    <div class="wm-bar-fill" style="width: ${Math.max(10, 100 - (v.lag / 5))}%"></div>
                  </div>
                  <div class="wm-badge-col">
                    ${v.lag === 0 ? '<span class="badge b-rem">100% SYNCED</span>' : `<span class="badge b-ext">-${v.lag} LSN LAG</span>`}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  },
  init() {}
};
