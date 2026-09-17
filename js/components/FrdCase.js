// SPEC-FRD-001 v2.0 · Plataforma de Detecção, Triangulação e Evidência de Riscos de Integridade Pública
// Console Pericial de Investigação, Grafo Temporal, Triagem, Dossiê Probatório e Trilha de Auditoria

export const FrdCase = {
  initialized: false,
  selectedSignalId: "SIG-2026-001",
  currentYear: 2026,
  signals: [],

  render() {
    return `
      <section id="frd" class="frd-case">
        <!-- Hero Header -->
        <header class="frd-hero">
          <div class="frd-hero-top">
            <div>
              <span class="frd-eyebrow">SPEC-FRD-001 v2.0 · Módulo Pericial</span>
              <h1 class="frd-title">Detecção, Triangulação e Evidência de Riscos de Integridade Pública</h1>
              <div class="frd-subtitle">
                Plataforma de inteligência pericial orientada a indícios em contratos, vínculos e benefícios.
                Regras normativas versionadas, grafo temporal multicamadas e cadeia de custódia Merkle BLAKE3.
              </div>
            </div>
            <div class="frd-status-badge">
              <span class="frd-status-dot"></span>
              <span id="frd-engine-status">HRKL V6 · gRPC :7474 · REST :7475</span>
            </div>
          </div>
        </header>

        <!-- Executive Snapshot Bar (Seção 28) -->
        <div class="frd-exec-bar">
          <div class="frd-exec-item">
            <span>Snapshot LSN:</span>
            <strong id="frd-snapshot-lsn">18.492.950</strong>
          </div>
          <div class="frd-exec-item">
            <span>Data Freshness:</span>
            <strong id="frd-freshness">12 min</strong>
          </div>
          <div class="frd-exec-item">
            <span>Integridade Matemática:</span>
            <strong id="frd-merkle-status" style="color:#34d399">VERIFIED (Merkle BLAKE3 ✓)</strong>
          </div>
          <div class="frd-exec-item" style="margin-left:auto">
            <span>Princípio Operacional:</span>
            <span style="font-style:italic;color:#38bdf8">"Nenhuma inferência sem proveniência · Regra não é condenação"</span>
          </div>
        </div>

        <!-- 6 Main KPI Cards -->
        <div class="frd-kpis-grid">
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Críticos (0.85–1.00)</div>
            <div class="frd-kpi-val crit" id="kpi-crit">2</div>
            <div class="frd-kpi-sub">Trilhas A &amp; D prioritárias</div>
          </div>
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Altos (0.65–0.84)</div>
            <div class="frd-kpi-val high" id="kpi-high">3</div>
            <div class="frd-kpi-sub">Trilhas B, E &amp; G</div>
          </div>
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Médios (0.40–0.64)</div>
            <div class="frd-kpi-val med" id="kpi-med">1</div>
            <div class="frd-kpi-sub">Triangulação Multi-Hop</div>
          </div>
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Em Revisão / Triagem</div>
            <div class="frd-kpi-val rev" id="kpi-rev">2</div>
            <div class="frd-kpi-sub">Despachos em aberto</div>
          </div>
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Arquivados (Dismissed)</div>
            <div class="frd-kpi-val" id="kpi-dismiss">0</div>
            <div class="frd-kpi-sub">Falso positivo com justificativa</div>
          </div>
          <div class="frd-kpi-card">
            <div class="frd-kpi-label">Exposição Contratual</div>
            <div class="frd-kpi-val exp" id="kpi-exp">R$ 14,53 mi</div>
            <div class="frd-kpi-sub">Volume monitorado</div>
          </div>
        </div>

        <main class="frd-body">
          <!-- Seção 29: Fila de Triagem -->
          <section class="frd-panel">
            <div class="frd-panel-hd">
              <h2 class="frd-panel-title">
                <span>📋</span> Fila de Triagem Pericial (Triage Queue)
              </h2>
              <span class="frd-panel-badge" id="frd-table-count">6 indícios ativos</span>
            </div>
            <div class="frd-panel-bd">
              <!-- Toolbar Filtros -->
              <div class="frd-toolbar">
                <input type="text" id="frd-filter-search" class="frd-input" placeholder="Filtrar por nome, CPF, CNPJ ou órgão..." style="flex:1;min-width:240px">
                <select id="frd-filter-sev" class="frd-select">
                  <option value="">Todas as severidades</option>
                  <option value="CRITICAL">Apenas CRITICAL</option>
                  <option value="HIGH">Apenas HIGH</option>
                  <option value="MEDIUM">Apenas MEDIUM</option>
                </select>
                <select id="frd-filter-status" class="frd-select">
                  <option value="">Todos os status</option>
                  <option value="NEW">Novos (NEW)</option>
                  <option value="UNDER_REVIEW">Em Revisão (UNDER_REVIEW)</option>
                  <option value="TRIAGE">Em Triagem (TRIAGE)</option>
                  <option value="ESCALATED">Escalados (ESCALATED)</option>
                  <option value="DISMISSED">Arquivados (DISMISSED)</option>
                </select>
                <button class="frd-btn" id="frd-btn-refresh">🔄 Atualizar Fila</button>
              </div>

              <!-- Tabela de Sinais -->
              <div class="frd-table-wrap">
                <table id="frd-table">
                  <thead>
                    <tr>
                      <th>Risco / Score</th>
                      <th>Confiança</th>
                      <th>Trilha &amp; Regra</th>
                      <th>Agente Público</th>
                      <th>Empresa Contratada</th>
                      <th>Órgão Federal</th>
                      <th style="text-align:right">Exposição</th>
                      <th>Evidências</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody id="frd-table-body">
                    <tr><td colspan="10" style="text-align:center;padding:20px;color:#64748b">Carregando sinais periciais...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Seções 30, 31 & 32: Split View (Grafo Temporal + Dossiê Probatório) -->
          <div class="frd-investigation-grid">
            <!-- Grafo e Time Travel (Seções 30 & 31) -->
            <section class="frd-panel">
              <div class="frd-panel-hd">
                <h2 class="frd-panel-title">
                  <span>🕸️</span> Triangulação em Grafo Temporal Multi-Hop
                </h2>
                <span class="frd-panel-badge" id="frd-graph-sig-label">Sinal Selecionado</span>
              </div>
              <div class="frd-panel-bd">
                <!-- Slider Time Travel -->
                <div class="frd-time-travel">
                  <span style="font-size:12px;font-weight:700;color:#94a3b8">VIAGEM NO TEMPO:</span>
                  <input type="range" id="frd-time-slider" class="frd-slider" min="2022" max="2026" step="1" value="2026">
                  <span id="frd-time-val" style="font-weight:800;font-size:13px;color:#38bdf8;min-width:70px">ANO 2026</span>
                </div>

                <div class="frd-graph-canvas" id="frd-graph-canvas">
                  <!-- SVG gerado dinamicamente -->
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-top:8px">
                  <span>Nós: Pessoa, Órgão, Empresa, Contrato, Pagamento e Sanção.</span>
                  <span>Arestas avaliam <code>intersection(valid_period) != ∅</code></span>
                </div>
              </div>
            </section>

            <!-- Dossiê Probatório & Decisão Humana (Seções 32, 33 & 26) -->
            <section class="frd-panel">
              <div class="frd-panel-hd">
                <h2 class="frd-panel-title">
                  <span>🛡️</span> Dossiê Probatório &amp; Decisão
                </h2>
                <span class="frd-panel-badge" style="color:#34d399">RFC 3161 · Merkle BLAKE3</span>
              </div>
              <div class="frd-panel-bd">
                <div id="frd-dossier-content" class="frd-dossier">
                  <p style="color:#64748b;text-align:center;padding:20px">Selecione um sinal na tabela para abrir o dossiê probatório.</p>
                </div>

                <!-- Decisão Humana (Seção 33) -->
                <div class="frd-decision-bar">
                  <h4 style="margin:0 0 8px;font-size:13px;color:#f8fafc">DESPACHO PERICIAL DO AUDITOR (Decisão Humana):</h4>
                  <textarea id="frd-decision-text" class="frd-input" style="width:100%;height:54px;font-size:12px;resize:none" placeholder="Informe a justificativa técnica para o despacho formal..."></textarea>
                  <div class="frd-decision-actions">
                    <button class="frd-btn frd-btn-primary" data-action="ACKNOWLEDGE">✓ Em Triagem</button>
                    <button class="frd-btn" data-action="REQUEST_MORE_DATA">📋 Solicitar Diligência</button>
                    <button class="frd-btn frd-btn-danger" data-action="ESCALATE">🚨 Escalar p/ CGU/TCU</button>
                    <button class="frd-btn" data-action="DISMISS" style="color:#94a3b8">✕ Falso Positivo (Dismiss)</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- Seção 34: Trilha de Auditoria Imutável (Audit Trail) -->
          <section class="frd-panel">
            <div class="frd-panel-hd">
              <h2 class="frd-panel-title">
                <span>📜</span> Trilha de Auditoria Imutável (Audit Trail)
              </h2>
              <span class="frd-panel-badge">Append-Only Log HRKL</span>
            </div>
            <div class="frd-panel-bd">
              <ul class="frd-audit-feed" id="frd-audit-feed">
                <!-- Feed preenchido dinamicamente -->
              </ul>
            </div>
          </section>
        </main>
      </section>
    `;
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.loadSummary();
    this.loadSignals();
    this.loadAuditTrail();
    this.setupListeners();
  },

  async loadSummary() {
    try {
      const res = await fetch("/frd-api/summary");
      if (!res.ok) return;
      const data = await res.json();
      
      const c = data.counts || {};
      const kCrit = document.getElementById("kpi-crit");
      const kHigh = document.getElementById("kpi-high");
      const kMed = document.getElementById("kpi-med");
      const kRev = document.getElementById("kpi-rev");
      const kDis = document.getElementById("kpi-dismiss");
      const kExp = document.getElementById("kpi-exp");
      const sLsn = document.getElementById("frd-snapshot-lsn");
      const sFresh = document.getElementById("frd-freshness");
      const sMerkle = document.getElementById("frd-merkle-status");

      if (kCrit) kCrit.textContent = c.critical || 0;
      if (kHigh) kHigh.textContent = c.high || 0;
      if (kMed) kMed.textContent = c.medium || 0;
      if (kRev) kRev.textContent = c.under_review || 0;
      if (kDis) kDis.textContent = c.dismissed || 0;
      if (kExp) {
        const v = data.contractual_exposure_total || 0;
        kExp.textContent = "R$ " + (v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " mi";
      }
      if (data.core) {
        if (sLsn) sLsn.textContent = (data.core.head_lsn || 18492950).toLocaleString("pt-BR");
        if (sFresh) sFresh.textContent = data.core.data_freshness || "12 min";
        if (sMerkle) sMerkle.textContent = data.core.merkle_verified ? "VERIFIED (Merkle BLAKE3 ✓)" : "VERIFY PENDING";
      }
    } catch (e) {
      console.warn("Erro ao carregar summary FRD:", e);
    }
  },

  async loadSignals() {
    try {
      const qInput = document.getElementById("frd-filter-search");
      const sevInput = document.getElementById("frd-filter-sev");
      const stInput = document.getElementById("frd-filter-status");

      const params = new URLSearchParams();
      if (qInput && qInput.value.trim()) params.set("q", qInput.value.trim());
      if (sevInput && sevInput.value) params.set("severity", sevInput.value);
      if (stInput && stInput.value) params.set("status", stInput.value);

      const res = await fetch("/frd-api/signals?" + params.toString());
      if (!res.ok) return;
      const data = await res.json();
      this.signals = data.signals || [];

      const countBadge = document.getElementById("frd-table-count");
      if (countBadge) countBadge.textContent = `${this.signals.length} indícios ativos`;

      this.renderTable(this.signals);

      // Auto-inspect first signal if present
      if (this.signals.length && !this.signals.some(s => s.id === this.selectedSignalId)) {
        this.selectedSignalId = this.signals[0].id;
      }
      if (this.selectedSignalId) {
        this.inspectSignal(this.selectedSignalId);
      }
    } catch (e) {
      console.warn("Erro ao carregar sinais FRD:", e);
    }
  },

  renderTable(signals) {
    const tbody = document.getElementById("frd-table-body");
    if (!tbody) return;

    if (!signals.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:#64748b">Nenhum indício localizado para os filtros selecionados.</td></tr>`;
      return;
    }

    tbody.innerHTML = signals.map(s => {
      const isSel = s.id === this.selectedSignalId ? "class='selected'" : "";
      const sevBadge = s.severity === "CRITICAL" ? `<span class="badge-crit">${s.risk_score.toFixed(2)} CRITICAL</span>` :
                       s.severity === "HIGH" ? `<span class="badge-high">${s.risk_score.toFixed(2)} HIGH</span>` :
                       `<span class="badge-med">${s.risk_score.toFixed(2)} MED</span>`;
      
      const stBadgeCls = s.status === "NEW" ? "st-new" :
                         s.status === "UNDER_REVIEW" ? "st-review" :
                         s.status === "ESCALATED" ? "st-escalated" : "st-dismiss";

      return `
        <tr ${isSel} data-id="${s.id}" style="cursor:pointer">
          <td>${sevBadge}</td>
          <td><span style="font-family:monospace;font-size:11px;color:#38bdf8">${(s.confidence * 100).toFixed(1)}%</span></td>
          <td>
            <div style="font-weight:700;color:#f8fafc">${s.rule_id}</div>
            <div style="font-size:11px;color:#94a3b8">${s.trilha}</div>
          </td>
          <td>
            <div style="font-weight:600;color:#e2e8f0">${s.person.name}</div>
            <div style="font-size:11px;color:#64748b">CPF ${s.person.cpf_masked} · SIAPE ${s.person.siape || '—'}</div>
          </td>
          <td>
            <div style="font-weight:600;color:#e2e8f0">${s.company.name}</div>
            <div style="font-size:11px;color:#64748b">CNPJ ${s.company.cnpj}</div>
          </td>
          <td>
            <div style="font-weight:600;color:#e2e8f0">${s.person.agency}</div>
            <div style="font-size:11px;color:#64748b">UO ${s.person.agency_code || '—'}</div>
          </td>
          <td style="text-align:right;font-weight:700;color:#34d399">
            R$ ${s.monetary_exposure.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td>
            <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:rgba(56,189,248,0.1);color:#38bdf8">
              ${(s.evidence || []).length} ev.
            </span>
          </td>
          <td><span class="badge-status ${stBadgeCls}">${s.status}</span></td>
          <td>
            <button class="frd-btn frd-btn-inspect" data-id="${s.id}">🔎 Dossiê</button>
          </td>
        </tr>
      `;
    }).join("");

    // Click handler on row
    tbody.querySelectorAll("tr[data-id]").forEach(tr => {
      tr.onclick = (ev) => {
        const id = tr.getAttribute("data-id");
        this.selectedSignalId = id;
        tbody.querySelectorAll("tr").forEach(r => r.classList.remove("selected"));
        tr.classList.add("selected");
        this.inspectSignal(id);
      };
    });
  },

  async inspectSignal(signalId) {
    this.selectedSignalId = signalId;
    const labelBadge = document.getElementById("frd-graph-sig-label");
    if (labelBadge) labelBadge.textContent = `Indício ${signalId}`;

    try {
      const [resDetail, resGraph] = await Promise.all([
        fetch(`/frd-api/signal?id=${encodeURIComponent(signalId)}`),
        fetch(`/frd-api/graph?id=${encodeURIComponent(signalId)}&year=${this.currentYear}`)
      ]);

      if (resDetail.ok) {
        const detail = await resDetail.json();
        if (detail.found) {
          this.renderDossier(detail.signal, detail.bundle);
        }
      }

      if (resGraph.ok) {
        const graph = await resGraph.json();
        this.renderGraph(graph);
      }
    } catch (e) {
      console.warn("Erro ao inspecionar sinal:", e);
    }
  },

  renderDossier(signal, bundle) {
    const container = document.getElementById("frd-dossier-content");
    if (!container) return;

    const b = bundle || {};
    const rfc = b.rfc3161 || {};

    container.innerHTML = `
      <div class="frd-dossier-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span style="font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase">${signal.trilha} · REGRA ${signal.rule_id}</span>
            <h3 style="margin:4px 0;font-size:18px;color:#ffffff">${signal.rule_name}</h3>
          </div>
          <span class="badge-crit" style="font-size:13px">${signal.risk_score.toFixed(2)} ${signal.severity}</span>
        </div>
        <div class="frd-dossier-meta">
          <span>Confiança: <b>${(signal.confidence * 100).toFixed(1)}% (${signal.confidence_level})</b></span>
          <span>Analysis LSN: <b>#${signal.analysis_lsn}</b></span>
          <span>Exposição: <b style="color:#34d399">R$ ${signal.monetary_exposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
        </div>
      </div>

      <!-- Explicação Causal Estruturada (Seção 22) -->
      <div style="margin-bottom:14px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8">Explicação Estruturada do Alerta:</span>
        <ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#cbd5e1;line-height:1.45">
          ${(signal.explanation || []).map(exp => `<li>${exp}</li>`).join("")}
        </ul>
      </div>

      <!-- Evidence Sets E1..En (Seção 23) -->
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8">Conjunto Probatório (Evidence Sets):</span>
      <div class="frd-evidence-list">
        ${(signal.evidence || []).map(ev => `
          <div class="frd-evidence-card">
            <div class="frd-evidence-title">
              <span>[${ev.id}] Fonte: ${ev.source}</span>
              <span style="color:#38bdf8">LSN #${ev.lsn} · Linha ${ev.row}</span>
            </div>
            <div class="frd-evidence-desc">${ev.desc}</div>
            <div class="frd-evidence-hash">SHA-256: ${ev.hash}</div>
          </div>
        `).join("")}
      </div>

      <!-- Lacre Criptográfico Merkle & RFC 3161 (Seções 26 & 27) -->
      <div class="frd-seal-box">
        <div class="frd-seal-title">
          <span>🔒</span> LACRE PROBATÓRIO CRIPTOGRÁFICO (RFC 3161 / ICP-BRASIL)
        </div>
        <div style="color:#cbd5e1">
          <b>Leaf Hash:</b> <code style="color:#38bdf8">${b.evidence_leaf_hash || '—'}</code><br/>
          <b>Merkle Root:</b> <code style="color:#34d399">${b.merkle_root || '—'}</code><br/>
          <b>Autoridade Certificadora:</b> ${rfc.tsa_authority || 'Heraclitus-Compliance / ICP-Brasil'}<br/>
          <b>Serial do Carimbo:</b> ${rfc.serial_number || 'ACT-2026-BR'} · Algoritmo: ${rfc.hash_algorithm || 'SHA-256'}
        </div>
      </div>
    `;
  },

  renderGraph(graphData) {
    const canvas = document.getElementById("frd-graph-canvas");
    if (!canvas) return;

    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];

    const W = canvas.clientWidth || 620;
    const H = 380;

    // Position nodes horizontally and vertically
    // P1 (Servidor) -> Left; Agency & Company -> Mid; Contract, Payment, Sanction -> Right
    const positions = {
      P1: { x: 70, y: 160 },
      P2: { x: 70, y: 300 },
      A1: { x: 280, y: 80 },
      C1: { x: 280, y: 260 },
      CT1: { x: 490, y: 170 },
      PAY1: { x: 490, y: 70 },
      SANC1: { x: 490, y: 320 },
      BEN1: { x: 280, y: 340 }
    };

    let svgEdges = "";
    edges.forEach(e => {
      const fromPos = positions[e.from] || { x: 100, y: 100 };
      const toPos = positions[e.to] || { x: 200, y: 200 };
      const active = e.active !== false;

      const strokeColor = active ? (e.label.includes("PARTNER") ? "#f43f5e" : "#38bdf8") : "#334155";
      const strokeWidth = active ? "2.5" : "1";
      const dash = active ? "none" : "4 4";
      const opacity = active ? "1" : "0.35";

      const mx = (fromPos.x + toPos.x) / 2;
      const my = (fromPos.y + toPos.y) / 2 - 12;

      svgEdges += `
        <path d="M${fromPos.x},${fromPos.y} Q${mx},${my - 20} ${toPos.x},${toPos.y}" 
              fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" opacity="${opacity}" />
        <text x="${mx}" y="${my}" fill="${active ? '#94a3b8' : '#475569'}" font-size="10" font-family="monospace" text-anchor="middle">
          ${e.label} (${e.period})
        </text>
      `;
    });

    let svgNodes = "";
    nodes.forEach(n => {
      const pos = positions[n.id] || { x: 150, y: 150 };
      svgNodes += `
        <g transform="translate(${pos.x}, ${pos.y})">
          <circle r="22" fill="${n.color}" stroke="#ffffff" stroke-width="2" />
          <text x="0" y="5" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">${n.id}</text>
          <text x="0" y="34" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">${n.label.slice(0, 18)}</text>
          <text x="0" y="47" fill="#64748b" font-size="9" text-anchor="middle">${(n.sub || '').slice(0, 24)}</text>
        </g>
      `;
    });

    canvas.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="display:block">
        <defs>
          <linearGradient id="frd-grad-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#070d19" />
            <stop offset="1" stop-color="#0b1326" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#frd-grad-bg)" />
        ${svgEdges}
        ${svgNodes}
      </svg>
    `;
  },

  async loadAuditTrail() {
    try {
      const res = await fetch("/frd-api/audit");
      if (!res.ok) return;
      const data = await res.json();
      const events = data.events || [];

      const feed = document.getElementById("frd-audit-feed");
      if (!feed) return;

      feed.innerHTML = events.map(ev => `
        <li class="frd-audit-item">
          <div class="frd-audit-lsn">LSN #${ev.lsn}</div>
          <div class="frd-audit-body">
            <div style="display:flex;justify-content:space-between">
              <strong style="color:#f8fafc">${ev.action} · ${ev.signal_id || 'SISTEMA'}</strong>
              <span class="frd-audit-meta">${ev.timestamp}</span>
            </div>
            <div style="color:#cbd5e1;margin-top:2px">${ev.details}</div>
            <div class="frd-audit-meta" style="margin-top:4px">Operador: <b>${ev.actor}</b> · Regra: ${ev.rule || '—'}</div>
          </div>
        </li>
      `).join("");
    } catch (e) {
      console.warn("Erro ao carregar audit trail:", e);
    }
  },

  setupListeners() {
    // Search / Filters
    const qInput = document.getElementById("frd-filter-search");
    const sevInput = document.getElementById("frd-filter-sev");
    const stInput = document.getElementById("frd-filter-status");
    const btnRef = document.getElementById("frd-btn-refresh");

    if (qInput) qInput.oninput = () => this.loadSignals();
    if (sevInput) sevInput.onchange = () => this.loadSignals();
    if (stInput) stInput.onchange = () => this.loadSignals();
    if (btnRef) btnRef.onclick = () => { this.loadSummary(); this.loadSignals(); this.loadAuditTrail(); };

    // Time Travel Slider
    const slider = document.getElementById("frd-time-slider");
    const sliderVal = document.getElementById("frd-time-val");
    if (slider) {
      slider.oninput = (e) => {
        this.currentYear = parseInt(e.target.value, 10);
        if (sliderVal) sliderVal.textContent = `ANO ${this.currentYear}`;
        if (this.selectedSignalId) {
          this.inspectSignal(this.selectedSignalId);
        }
      };
    }

    // Decision Buttons
    document.querySelectorAll(".frd-decision-actions button[data-action]").forEach(btn => {
      btn.onclick = async () => {
        const action = btn.getAttribute("data-action");
        const textField = document.getElementById("frd-decision-text");
        const justification = textField ? textField.value.trim() : "";

        if (!justification && action !== "ACKNOWLEDGE") {
          alert("Por favor, preencha uma breve justificativa técnica para este despacho formal.");
          return;
        }

        try {
          const res = await fetch("/frd-api/decision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signal_id: this.selectedSignalId,
              action: action,
              justification: justification || "Despacho registrado na fila de triagem pericial.",
              auditor: "auditor.pericial.01"
            })
          });

          if (res.ok) {
            const data = await res.json();
            alert(data.message || "Decisão registrada com sucesso!");
            if (textField) textField.value = "";
            this.loadSummary();
            this.loadSignals();
            this.loadAuditTrail();
          }
        } catch (err) {
          alert("Erro ao registrar decisão: " + err);
        }
      };
    });
  }
};
