import { temporal } from '../temporal.js';

export const TemporalSpine = {
  render() {
    const isHistory = temporal.isHistory();
    const lsnStr = temporal.cursor.lsn.toLocaleString('pt-BR');
    const headStr = temporal.headLsn.toLocaleString('pt-BR');
    const aStr = temporal.range.a.lsn.toLocaleString('pt-BR');
    const bStr = temporal.range.b.lsn.toLocaleString('pt-BR');

    return `
      <div id="temporal-spine" class="temporal-spine ${isHistory ? 'is-history' : 'is-head'}">
        <div class="spine-container">
          <div class="spine-section main-mode">
            <span class="eyebrow">BARRA TEMPORAL GLOBAL</span>
            <div class="mode-buttons" role="group" aria-label="Modo Temporal">
              <button id="spine-mode-live" class="btn-spine ${temporal.mode === 'HEAD' ? 'active' : ''}" title="Acompanhar HEAD em tempo real">
                ● LIVE <small class="head-val">(${headStr})</small>
              </button>
              <button id="spine-mode-asof" class="btn-spine ${temporal.mode === 'AS_OF_LSN' ? 'active' : ''}" title="Navegar no estado histórico (AS OF LSN)">
                ⏱ AS OF LSN
              </button>
              <button id="spine-mode-compare" class="btn-spine ${temporal.mode === 'COMPARE' ? 'active' : ''}" title="Comparar Estado A com Estado B">
                ⇄ COMPARE A ↔ B
              </button>
              <button id="spine-mode-replay" class="btn-spine ${temporal.mode === 'REPLAY' ? 'active' : ''}" title="Replay determinístico dos eventos">
                ▶ REPLAY LAB
              </button>
            </div>
          </div>

          <div class="spine-section playback-controls">
            <div class="step-controls">
              <button id="spine-step-back" class="btn-icon" title="Voltar 1 evento (Shift: 1.000 events)">◀</button>
              <button id="spine-play" class="btn-icon btn-play" title="Iniciar/Pausar Replay (Espaço)">
                ${temporal.replay.playing ? '⏸' : '▶'}
              </button>
              <button id="spine-step-fwd" class="btn-icon" title="Avançar 1 evento (Shift: 1.000 events)">▶</button>
            </div>

            <div class="cursor-box">
              <span class="lbl">CURSOR ATUAL (LSN)</span>
              <input id="spine-lsn-input" type="number" class="spine-input lsn" value="${temporal.cursor.lsn.toString()}" step="1" min="0" max="${temporal.headLsn.toString()}">
            </div>

            <div class="speed-selector">
              <span class="lbl">VELOCIDADE</span>
              <select id="spine-speed-select">
                <option value="0.25" ${temporal.replay.speed === 0.25 ? 'selected' : ''}>0.25x</option>
                <option value="1" ${temporal.replay.speed === 1 ? 'selected' : ''}>1x</option>
                <option value="10" ${temporal.replay.speed === 10 ? 'selected' : ''}>10x</option>
                <option value="100" ${temporal.replay.speed === 100 ? 'selected' : ''}>100x</option>
                <option value="1000" ${temporal.replay.speed === 1000 ? 'selected' : ''}>MAX</option>
              </select>
            </div>
          </div>

          <div class="spine-section range-controls">
            <div class="range-box">
              <span class="lbl">PONTO A</span>
              <input id="spine-range-a" type="number" class="spine-input range" value="${temporal.range.a.lsn.toString()}">
            </div>
            <span class="range-sep">↔</span>
            <div class="range-box">
              <span class="lbl">PONTO B</span>
              <input id="spine-range-b" type="number" class="spine-input range" value="${temporal.range.b.lsn.toString()}">
            </div>
          </div>

          <div class="spine-section axis-controls">
            <span class="lbl">EIXO TEMPORAL</span>
            <div class="axis-buttons">
              <button id="axis-lsn" class="btn-mini ${temporal.axis === 'LSN' ? 'active' : ''}">LSN</button>
              <button id="axis-systime" class="btn-mini ${temporal.axis === 'SYSTEM_TIME' ? 'active' : ''}">System Time</button>
              <button id="axis-validtime" class="btn-mini ${temporal.axis === 'VALID_TIME' ? 'active' : ''}">Valid Time</button>
            </div>
          </div>
        </div>

        ${isHistory ? `
          <div class="spine-history-banner">
            <span class="badge-history">⚠️ VOCÊ ESTÁ VISUALIZANDO O PASSADO (AS OF LSN ${lsnStr})</span>
            <span class="history-detail">HEAD atual é <strong>${headStr}</strong> (${(temporal.headLsn - temporal.cursor.lsn).toLocaleString('pt-BR')} eventos à frente no futuro).</span>
            <button id="spine-jump-head" class="btn-jump-head">Retornar ao HEAD em Tempo Real ➔</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  init() {
    temporal.subscribe((state, eventKey) => {
      const container = document.getElementById('temporal-spine-container');
      if (container) {
        container.innerHTML = this.render();
        this._bindEvents();
      }
    });
    this._bindEvents();
  },

  _bindEvents() {
    const elLive = document.getElementById('spine-mode-live');
    if (elLive) elLive.onclick = () => temporal.setMode('HEAD');

    const elAsof = document.getElementById('spine-mode-asof');
    if (elAsof) elAsof.onclick = () => temporal.setMode('AS_OF_LSN');

    const elCompare = document.getElementById('spine-mode-compare');
    if (elCompare) elCompare.onclick = () => {
      temporal.setMode('COMPARE');
      const navA = document.querySelector('#nav a[data-s="diff"]');
      if (navA) navA.click();
    };

    const elReplay = document.getElementById('spine-mode-replay');
    if (elReplay) elReplay.onclick = () => {
      temporal.setMode('REPLAY');
      const navA = document.querySelector('#nav a[data-s="replay"]');
      if (navA) navA.click();
    };

    const elLsnInput = document.getElementById('spine-lsn-input');
    if (elLsnInput) {
      elLsnInput.onchange = (e) => {
        const val = e.target.value;
        if (val) temporal.setCursor(val, 'AS_OF_LSN');
      };
    }

    const elStepBack = document.getElementById('spine-step-back');
    if (elStepBack) elStepBack.onclick = (e) => temporal.stepBack(e.shiftKey ? 1000n : 1n);

    const elStepFwd = document.getElementById('spine-step-fwd');
    if (elStepFwd) elStepFwd.onclick = (e) => temporal.stepForward(e.shiftKey ? 1000n : 1n);

    const elPlay = document.getElementById('spine-play');
    if (elPlay) elPlay.onclick = () => temporal.togglePlay();

    const elSpeed = document.getElementById('spine-speed-select');
    if (elSpeed) elSpeed.onchange = (e) => temporal.setSpeed(parseFloat(e.target.value));

    const elRangeA = document.getElementById('spine-range-a');
    if (elRangeA) elRangeA.onchange = (e) => temporal.setRangeA(e.target.value);

    const elRangeB = document.getElementById('spine-range-b');
    if (elRangeB) elRangeB.onchange = (e) => temporal.setRangeB(e.target.value);

    const elJump = document.getElementById('spine-jump-head');
    if (elJump) elJump.onclick = () => temporal.setMode('HEAD');

    ['lsn', 'systime', 'validtime'].forEach(ax => {
      const btn = document.getElementById(`axis-${ax}`);
      if (btn) btn.onclick = () => temporal.setAxis(ax.toUpperCase());
    });
  }
};
