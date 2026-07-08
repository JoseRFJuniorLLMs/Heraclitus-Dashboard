export const TimeMachine = {
  startIdx: 0,
  endIdx: 0,
  cumPos: [],
  cumNet: [],
  cumAnu: [],
  chartMax: 1,
  playTimer: null,
  eventosAtivos: [],
  
  hmSquares: [],
  monthsHtml: "",
  daysHtml: "",
  hHeight: 160,

  render() {
    return `
      <section id="time">
        <div class="secttl">
          <h2>1 · Linha do Tempo Viva & Viagem no Tempo</h2>
          <span class="tag">AUDITORIA POR INTERVALO</span>
        </div>
        <p class="sub">Use as duas chaves na mesma barra para isolar uma janela temporal. O sistema recalculará a integridade e o saldo do período.</p>
        
        <div class="card" id="tlCard">
          <div class="tl-top" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button class="btn" id="playBtn" style="background: var(--azul); color: #fff; padding: 7px 16px; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">▶ Reproduzir</button>
              <div style="font-size: 13px; font-weight: 600; color: var(--muted); line-height: 1.4;">
                Janela LSN: De <span class="mono" id="asofLsnStart" style="color: var(--verde); font-weight: 700;">—</span> até <span class="mono" id="asofLsnEnd" style="color: var(--vermelho); font-weight: 700;">—</span><br/>
                Período: <span class="mono" id="asofDataRange" style="color: var(--azul); font-weight: 700;">—</span>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted);">
              Menos
              <span style="width:10px;height:10px;border-radius:2px;background:#ebedf0;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:2px;background:#9be9a8;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:2px;background:#40c463;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:2px;background:#30a14e;display:inline-block"></span>
              <span style="width:10px;height:10px;border-radius:2px;background:#216e39;display:inline-block"></span>
              Mais
            </div>
          </div>

          <div style="overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px;" id="hmWrap">
            <div id="hmChart" style="width: 100%;"></div>
          </div>

          <div class="svgwrap" id="tlChart" style="width: 100%; overflow: visible; margin-bottom: 20px;"></div>

          <div class="slider-wrap" style="margin: 20px 0 6px; position: relative; height: 32px;">
            <div class="dual-slider-track" style="position: absolute; top: 10px; left: 0; width: 100%; height: 6px; background: #e6e9ed; border-radius: 3px; z-index: 1;"></div>
            <div id="dualSliderHighlight" style="position: absolute; top: 10px; height: 6px; background: var(--azul); opacity: 0.25; border-radius: 3px; z-index: 2;"></div>
            
            <input type="range" id="tlStartSlider" min="0" max="100" value="20" />
            <input type="range" id="tlEndSlider" min="0" max="100" value="80" />
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: -4px;" class="mono">
            <span id="tlStartLabel">01/01/2026</span>
            <span>Arraste o pino verde (Início) e o vermelho (Fim) para recortar o tempo</span>
            <span id="tlEndLabel">31/12/2026</span>
          </div>
        </div>

        <div class="grid k4" id="tlKpis" style="margin: 16px 0;"></div>

        <div class="card" style="margin-top: 16px;">
          <h3>Eventos Contidos no Recorte Temporal</h3>
          <div style="max-height: 280px; overflow-y: auto;">
            <table id="tlTable">
              <thead>
                <tr>
                  <th>LSN</th>
                  <th>Data Oficial</th>
                  <th>Portaria</th>
                  <th>Órgão Beneficiário</th>
                  <th>Tipo Legal</th>
                  <th style="text-align: right;">Valor (R$)</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    if (!document.getElementById('dual-slider-core-styles')) {
      const style = document.createElement('style');
      style.id = 'dual-slider-core-styles';
      style.innerHTML = `
        #tlCard input[type=range] { position: absolute; pointer-events: none; -webkit-appearance: none; width: 100%; background: none; top: 1px; margin: 0; z-index: 3; }
        #tlCard input[type=range]::-webkit-slider-thumb { pointer-events: auto; -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.25); border: 4px solid var(--azul); }
        #tlCard input[type=range]#tlStartSlider::-webkit-slider-thumb { border-color: var(--verde); }
        #tlCard input[type=range]#tlEndSlider::-webkit-slider-thumb { border-color: var(--vermelho); }
        #tlCard input[type=range]::-moz-range-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 50%; background: #fff; cursor: pointer; border: 4px solid var(--azul); }
        #tlCard input[type=range]#tlStartSlider::-moz-range-thumb { border-color: var(--verde); }
        #tlCard input[type=range]#tlEndSlider::-moz-range-thumb { border-color: var(--vermelho); }
      `;
      document.head.appendChild(style);
    }

    if (!window.EVENTOS_FALBACK) {
      window.EVENTOS_FALBACK = this.gerarEventosSinteticos(800);
    }
    
    this.atualizarDataset();
    this.calcularEstruturaHeatmap();

    const sSlider = $('#tlStartSlider');
    const eSlider = $('#tlEndSlider');

    if (sSlider && eSlider) {
      sSlider.oninput = () => {
        this.pararPlayback();
        this.sincronizarPorValores(true);
      };
      sSlider.onchange = () => this.sincronizarPorValores(false);

      eSlider.oninput = () => {
        this.pararPlayback();
        this.sincronizarPorValores(true);
      };
      eSlider.onchange = () => this.sincronizarPorValores(false);
    }

    const playBtn = $('#playBtn');
    if (playBtn) playBtn.onclick = () => this.alternarPlayback();

    this.sincronizarPorValores(false);
  },

  atualizarDataset() {
    this.eventosAtivos = window.EVENTOS || window.EVENTOS_FALBACK || [];
    const n = this.eventosAtivos.length;
    
    this.cumPos = new Array(n); this.cumNet = new Array(n); this.cumAnu = new Array(n);
    
    let p = 0, net = 0, anu = 0;
    for (let i = 0; i < n; i++) {
      const v = this.eventosAtivos[i].valor || 0;
      p += Math.max(v, 0); net += v;
      if (v < 0) anu -= v;
      this.cumPos[i] = p; this.cumNet[i] = net; this.cumAnu[i] = anu;
    }
    this.chartMax = p || 1;
  },

  calcularEstruturaHeatmap() {
    const ev = this.eventosAtivos;
    if (!ev.length) return;

    const anoCorrente = ev[0].data.getFullYear();
    const start = new Date(anoCorrente, 0, 1);
    start.setDate(start.getDate() - start.getDay());
    
    const end = new Date(anoCorrente, 11, 31);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const dayMs = 86400000;
    const totalDays = Math.round((end - start) / dayMs) + 1;
    const weeks = Math.ceil(totalDays / 7);

    const padL = 40, padT = 20;
    const cell = (1320 - padL - 10) / weeks; 
    const SQ = cell - 5;

    const counts = new Map();
    const volumes = new Map();
    ev.forEach(e => {
      const d = new Date(e.data); d.setHours(0,0,0,0);
      counts.set(d.getTime(), (counts.get(d.getTime()) || 0) + 1);
      volumes.set(d.getTime(), (volumes.get(d.getTime()) || 0) + Math.abs(e.valor));
    });

    this.hmSquares = [];
    let monthsHtml = "";
    let lastM = -1;

    for (let d = 0; d < totalDays; d++) {
      const date = new Date(start.getTime() + d * dayMs);
      const col = Math.floor(d / 7);
      const row = date.getDay();
      const time = date.getTime();
      
      const count = counts.get(time) || 0;
      const vol = volumes.get(time) || 0;
      const bucket = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4;
      
      const x = padL + col * cell;
      const y = padT + row * cell;
      
      const dtStr = date.toLocaleDateString('pt-BR');
      const hint = count > 0 
        ? `${count} portarias em ${dtStr} · Volume: R$ ${vol.toLocaleString('pt-BR', {maximumFractionDigits:0})}`
        : `Sem alterações · ${dtStr}`;

      this.hmSquares.push({ x, y, SQ, bucket, ms: time, hint });

      if (row === 0 && date.getMonth() !== lastM) {
        lastM = date.getMonth();
        const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        monthsHtml += `<text x="${x}" y="${padT - 6}" font-size="10" font-weight="700" fill="#5b6471" font-family="Arial">${MES[date.getMonth()]}</text>`;
      }
    }

    this.daysHtml = [[1, "Seg"], [3, "Qua"], [5, "Sex"]].map(([r, l]) => `
      <text x="5" y="${padT + r * cell + SQ - 3}" font-size="10" fill="#5b6471" font-family="Arial">${l}</text>
    `).join('');

    this.hHeight = padT + 7 * cell + 10;
    this.monthsHtml = monthsHtml;
  },

  sincronizarPorValores(skipTable) {
    const n = this.eventosAtivos.length;
    if (!n) return;

    let pStart = +$('#tlStartSlider').value;
    let pEnd = +$('#tlEndSlider').value;

    if (pStart > pEnd) {
      pStart = pEnd;
      $('#tlStartSlider').value = pStart;
    }

    const highlight = $('#dualSliderHighlight');
    if (highlight) {
      highlight.style.left = pStart + "%";
      highlight.style.width = (pEnd - pStart) + "%";
    }

    this.startIdx = Math.max(0, Math.min(n - 1, Math.round((pStart / 100) * (n - 1))));
    this.endIdx = Math.max(0, Math.min(n - 1, Math.round((pEnd / 100) * (n - 1))));

    const evStart = this.eventosAtivos[this.startIdx];
    const evEnd = this.eventosAtivos[this.endIdx];

    $('#asofLsnStart').textContent = `#${evStart.lsn}`;
    $('#asofLsnEnd').textContent = `#${evEnd.lsn}`;
    $('#asofDataRange').innerHTML = `<b>${evStart.data.toLocaleDateString('pt-BR')}</b> até <b>${evEnd.data.toLocaleDateString('pt-BR')}</b>`;
    
    $('#tlStartLabel').textContent = this.eventosAtivos[0].data.toLocaleDateString('pt-BR');
    $('#tlEndLabel').textContent = this.eventosAtivos[n - 1].data.toLocaleDateString('pt-BR');

    let sup = 0, anu = 0, net = 0;
    for (let i = this.startIdx; i <= this.endIdx; i++) {
      const v = this.eventosAtivos[i].valor || 0;
      if (v > 0) sup += v;
      else anu += Math.abs(v);
      net += v;
    }

    $('#tlKpis').innerHTML = `
      <div class="kpi"><div class="lb">Eventos no Recorte</div><div class="v">${fmt(this.endIdx - this.startIdx + 1)} <small>blocos</small></div></div>
      <div class="kpi ok"><div class="lb">Crédito Suplementado</div><div class="v"><small>R$</small> ${fmt(sup)}</div></div>
      <div class="kpi bad"><div class="lb">Anulações</div><div class="v"><small>R$</small> ${fmt(anu)}</div></div>
      <div class="kpi ok"><div class="lb">Saldo Líquido</div><div class="v"><small>R$</small> ${fmt(net)}</div></div>
    `;

    this.renderStairStepChart();
    this.atualizarMascaraHeatmap();

    if (!skipTable) this.renderTabelaAuditoria();
  },

  atualizarMascaraHeatmap() {
    if (!this.hmSquares.length) return;

    const tStart = this.eventosAtivos[this.startIdx].data.getTime();
    const tEnd = this.eventosAtivos[this.endIdx].data.getTime();
    
    // Paleta de cores oficial do GitHub (Modo Claro)
    const HM_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
    
    let rectsHtml = "";
    this.hmSquares.forEach(s => {
      const dentroDoRange = s.ms >= tStart && s.ms <= tEnd;
      const corFinal = HM_COLORS[s.bucket] || HM_COLORS[0];
      const opacidadeFinal = dentroDoRange ? "1" : "0.15";
      
      rectsHtml += `
        <rect x="${s.x}" y="${s.y}" width="${s.SQ}" height="${s.SQ}" rx="2" fill="${corFinal}" opacity="${opacidadeFinal}" style="cursor:pointer; pointer-events: auto;">
          <title>${s.hint}</title>
        </rect>
      `;
    });

    const w = 1320;
    $('#hmChart').innerHTML = `
      <svg viewBox="0 0 ${w} ${this.hHeight}" width="100%" height="${this.hHeight}" style="display:block; overflow:visible;">
        <g>${rectsHtml}</g>
        <g style="pointer-events:none;">${this.monthsHtml}${this.daysHtml}</g>
      </svg>
    `;
  },

  renderStairStepChart() {
    const W = 1320, H = 220, pad = 10;
    const n = this.eventosAtivos.length;
    if (!n) return;

    const X = (idx) => pad + (idx / (n - 1)) * (W - 2 * pad);
    const Y = (v) => H - 20 - (v / this.chartMax) * (H - 55);

    let d = `M ${X(0)} ${Y(0)}`;
    let lastY = Y(0);
    for (let i = 0; i < n; i++) {
      let cx = X(i); let cy = Y(this.cumPos[i]);
      d += ` L ${cx} ${lastY} L ${cx} ${cy}`;    
      lastY = cy;
    }

    const area = d + ` L ${X(n - 1)} ${H} L ${X(0)} ${H} Z`;
    
    const currentXStart = X(this.startIdx);
    const currentYStart = Y(this.cumPos[this.startIdx] || 0);
    const currentXEnd = X(this.endIdx);
    const currentYEnd = Y(this.cumPos[this.endIdx] || 0);
    
    const totalAcumuladoPeriodo = (this.cumPos[this.endIdx] || 0) - (this.cumPos[this.startIdx] || 0);
    const highlightRegion = `<rect x="${currentXStart}" y="5" width="${Math.max(0, currentXEnd - currentXStart)}" height="${H-25}" fill="var(--azul)" fill-opacity="0.08" />`;

    let boxW = 260, boxH = 46;
    let tx = currentXEnd + 12;
    if (tx > W - boxW - 10) tx = currentXStart - boxW - 12;
    let ty = currentYEnd - 55;
    if (ty < 10) ty = currentYEnd + 15;

    const cardBox = `
      <g transform="translate(${tx}, ${ty})">
        <rect width="${boxW}" height="${boxH}" rx="6" fill="#071D41" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.4))"/>
        <text x="12" y="16" font-size="10" font-weight="700" fill="#9fc0ff" font-family="Arial">Delta de Crédito no Recorte:</text>
        <text x="12" y="33" font-size="13" font-weight="800" fill="#FFCD07" font-family="monospace">R$ ${totalAcumuladoPeriodo.toLocaleString('pt-BR', {minimumFractionDigits:2})}</text>
      </g>
    `;

    $('#tlChart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block; overflow:visible;">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--azul)" stop-opacity=".15"/>
            <stop offset="1" stop-color="var(--azul)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#g1)"/>
        <path d="${d}" fill="none" stroke="#a2b4cd" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square"/>
        
        ${highlightRegion}
        
        <line x1="${currentXStart}" y1="5" x2="${currentXStart}" y2="${H-5}" stroke="var(--verde)" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="${currentXStart}" cy="${currentYStart}" r="5" fill="var(--verde)" stroke="#fff" stroke-width="1.5"/>
        
        <line x1="${currentXEnd}" y1="5" x2="${currentXEnd}" y2="${H-5}" stroke="var(--vermelho)" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="${currentXEnd}" cy="${currentYEnd}" r="5" fill="var(--vermelho)" stroke="#fff" stroke-width="1.5"/>
        
        ${cardBox}
      </svg>
    `;
  },

  renderTabelaAuditoria() {
    const tb = $('#tlTable tbody');
    if (!tb) return;
    tb.innerHTML = "";

    let html = "";
    for (let i = this.endIdx; i >= this.startIdx; i--) {
      const e = this.eventosAtivos[i];
      const cls = e.valor < 0 ? 'pill r' : 'pill g';
      html += `
        <tr>
          <td class="mono" style="color:var(--azul); font-weight:700;">#${e.lsn}</td>
          <td>${e.data.toLocaleString('pt-BR')}</td>
          <td class="mono" style="font-size:12px;">${e.portaria}</td>
          <td><b>${e.orgao}</b><div class="muted" style="font-size:11px;">UO ${e.orgaoCod} · Ação ${e.acaoCod}</div></td>
          <td><span class="${cls}">${e.valor < 0 ? 'Anulação' : 'Suplementação'}</span></td>
          <td style="text-align: right; font-weight: 700; color:${e.valor < 0 ? 'var(--vermelho)' : 'var(--azul-esc)'}">
            ${e.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </td>
        </tr>
      `;
    }
    tb.innerHTML = html;
  },

  alternarPlayback() {
    const sSlider = $('#tlStartSlider');
    const eSlider = $('#tlEndSlider');

    if (this.playTimer) { this.pararPlayback(); } else {
      if (+eSlider.value >= 100) {
        sSlider.value = 0;
        eSlider.value = 10;
      }
      const btn = $('#playBtn');
      btn.textContent = "⏸ Pausar"; btn.style.background = "var(--amarelo)"; btn.style.color = "#000";
      
      this.playTimer = setInterval(() => {
        let ev = Math.min(100, (+eSlider.value) + 1);
        eSlider.value = ev;
        this.sincronizarPorValores(true);
        if (ev >= 100) { this.pararPlayback(); this.sincronizarPorValores(false); }
      }, 60);
    }
  },

  pararPlayback() {
    if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null; }
    const btn = $('#playBtn');
    if (btn) { btn.textContent = "▶ Reproduzir"; btn.style.background = "var(--azul)"; btn.style.color = "#fff"; }
  },

  gerarEventosSinteticos(n) {
    const out = []; 
    let t = new Date("2026-01-01T08:00:00").getTime();
    const fim = new Date("2026-12-31T18:00:00").getTime(); 
    const passo = (fim - t) / n;

    for (let i = 0; i < n; i++) {
      t += passo * (0.4 + Math.random() * 1.2);
      const d = new Date(Math.min(t, fim));
      const valor = (Math.random() > 0.18 ? 1 : -1) * (Math.floor(Math.random() * 150) * 200000);
      out.push({
        lsn: i, data: d,
        orgao: ["Ministério da Educação", "Ministério da Saúde", "Ministério da Defesa", "Ministério dos Transportes"][i % 4],
        orgaoCod: "260" + (i % 4), acaoCod: "A4" + i,
        portaria: `PORTARIA-MPO-2026-${1000 + i}`, valor: valor
      });
    }
    return out;
  }
};