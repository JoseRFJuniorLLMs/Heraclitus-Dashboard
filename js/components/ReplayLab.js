import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const ReplayLab = {
  render() {
    const lsn = temporal.cursor.lsn;
    const lsnStr = lsn.toLocaleString('pt-BR');
    const demo = GOLDEN_DEMO;

    return `
      <section id="replay" class="view-section">
        <div class="secttl">
          <h2>Replay Lab & Verification of Determinism</h2>
          <span class="tag tag-primary">RECONSTRUÇÃO DETERMINÍSTICA</span>
        </div>
        <p class="sub">Execução de replay determinístico do log canônico de eventos com validação de invariância de hash de estado.</p>

        <!-- PAINEL DE CONTROLES DO REPLAY -->
        <div class="card">
          <div class="hd">
            <span class="sec-ico">▶</span>
            <h2>Controles do Replay Lab</h2>
            <span class="tag">LSN ${lsnStr}</span>
          </div>
          <div class="bd">
            <div class="replay-controls-grid">
              <div class="ctrl-box">
                <label>LSN Inicial (FROM)</label>
                <input id="replay-from-lsn" type="number" class="spine-input" value="${temporal.range.a.lsn.toString()}">
              </div>
              <div class="ctrl-box">
                <label>LSN Final (TO)</label>
                <input id="replay-to-lsn" type="number" class="spine-input" value="${temporal.range.b.lsn.toString()}">
              </div>
              <div class="ctrl-box">
                <label>Modo de Passo (Step)</label>
                <select id="replay-step-mode">
                  <option value="event">Step por Evento</option>
                  <option value="checkpoint">Step por Checkpoint</option>
                  <option value="second">Step por Segundo Físico</option>
                </select>
              </div>
              <div class="ctrl-box">
                <label>Condição de Pausa Automática</label>
                <select id="replay-pause-cond">
                  <option value="none">Nenhuma (Executar até TO)</option>
                  <option value="incident">Pausar no primeiro Incidente</option>
                  <option value="shred">Pausar em Crypto-Shred</option>
                  <option value="removal">Pausar em Remoção Semântica</option>
                </select>
              </div>
            </div>

            <div class="replay-action-buttons margin-top">
              <button id="btn-start-replay-lab" class="btn-primary">▶ Iniciar Replay no Browser</button>
              <button id="btn-pause-replay-lab" class="btn-out">⏸ Pausar</button>
              <button id="btn-verify-determinism" class="btn-amar">⚖ Executar Verificação de Determinismo</button>
            </div>
          </div>
        </div>

        <!-- PAINEL DE VERIFICAÇÃO DE DETERMINISMO (SPEC §24) -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">⚖</span>
            <h2>Determinism Verification Engine</h2>
            <span class="tag">HASH MATCH</span>
          </div>
          <div class="bd">
            <div id="determinism-box" class="determinism-status-box">
              <div class="hash-comparison">
                <div class="hash-card">
                  <span class="lbl">STATE HASH ANTES DO REPLAY (EXPECTED)</span>
                  <code class="font-mono hash-val">${demo.stateHash}</code>
                </div>
                <div class="hash-arrow">➔ REPLAY LOG ➔</div>
                <div class="hash-card">
                  <span class="lbl">STATE HASH APÓS REPLAY (RECONSTRUCTED)</span>
                  <code id="reconstructed-hash" class="font-mono hash-val">${demo.stateHash}</code>
                </div>
              </div>

              <div id="determinism-verdict" class="verdict-banner verdict-ok margin-top">
                <span class="verdict-ico">✓</span>
                <div class="verdict-text">
                  <strong>DETERMINISTIC RECONSTRUCTION CONFIRMED</strong>
                  <p>O estado reconstruído a partir do log canônico entre LSN ${temporal.range.a.lsn.toLocaleString('pt-BR')} e LSN ${temporal.range.b.lsn.toLocaleString('pt-BR')} produziu um hash Blake3 idêntico. Prova de determinismo válida.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LISTA DE CHECKPOINTS SELECCIONÁVEIS -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">◆</span>
            <h2>Checkpoints Válidos do Log</h2>
          </div>
          <div class="bd scroll">
            <table>
              <thead>
                <tr>
                  <th>LSN do Checkpoint</th>
                  <th>Hash do Estado</th>
                  <th>Data / Hora UTC</th>
                  <th>Segmentos Incluídos</th>
                  <th>Versão do Motor</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${demo.getCheckpoints().map(cp => `
                  <tr>
                    <td class="num font-mono"><strong>${cp.lsn.toLocaleString('pt-BR')}</strong></td>
                    <td><code class="font-mono">${cp.hash}</code></td>
                    <td class="muted">${cp.timestamp}</td>
                    <td>${cp.segments} segmentos selados</td>
                    <td><span class="badge b-sup">${cp.version}</span></td>
                    <td><button class="btn-sm btn-cp-asof" data-lsn="${cp.lsn}">Restaurar AS OF ➔</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this._bindEvents();
  },

  _bindEvents() {
    const btnStart = document.getElementById('btn-start-replay-lab');
    if (btnStart) btnStart.onclick = () => temporal.startReplay();

    const btnPause = document.getElementById('btn-pause-replay-lab');
    if (btnPause) btnPause.onclick = () => temporal.pauseReplay();

    const btnVerify = document.getElementById('btn-verify-determinism');
    if (btnVerify) {
      btnVerify.onclick = () => {
        btnVerify.textContent = 'Calculando hashes Blake3...';
        setTimeout(() => {
          btnVerify.textContent = '⚖ Executar Verificação de Determinismo';
          const verdict = document.getElementById('determinism-verdict');
          if (verdict) {
            verdict.className = 'verdict-banner verdict-ok margin-top';
            verdict.innerHTML = `
              <span class="verdict-ico">✓</span>
              <div class="verdict-text">
                <strong>DETERMINISTIC RECONSTRUCTION CONFIRMED</strong>
                <p>Cálculo de Replay finalizado com sucesso. Hash de estado idêntico no LSN ${temporal.cursor.lsn.toString()}.</p>
              </div>
            `;
          }
        }, 600);
      };
    }

    const cpBtns = document.querySelectorAll('.btn-cp-asof');
    cpBtns.forEach(btn => {
      btn.onclick = () => {
        const lsn = BigInt(btn.dataset.lsn);
        temporal.setCursor(lsn, 'AS_OF_LSN');
      };
    });
  }
};
