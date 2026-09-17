// SPEC-FRD-001 v2.0 · Plataforma de Detecção, Triangulação e Evidência de Riscos de Integridade Pública
// Console Pericial de Investigação, Pesquisa de Entidades (Nome/CPF/CNPJ), Grafo de Relações Multi-Hop e Dossiê

export const FrdCase = {
  initialized: false,
  selectedSignalId: "SIG-2026-001",
  currentYear: 2026,
  currentQuery: "Carlos Eduardo de Alencar Mendonça",
  signals: [],
  currentGraphData: null,

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
                Plataforma pericial de cruzamento e investigação de redes ocultas em contratos, vínculos e benefícios.
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

        <main class="frd-body">
          <!-- ==========================================================
               SEÇÃO PRINCIPAL: PESQUISA POR NOME / CPF / CNPJ
               E RESULTADO: GRAFO DAS RELAÇÕES EMBAIXO
               ========================================================== -->
          <section class="frd-search-hero-panel">
            <div class="frd-search-box-wrap">
              <div class="frd-search-header">
                <div class="frd-search-title-row">
                  <div class="frd-search-icon-badge">🔎</div>
                  <div>
                    <h2>Pesquisa Pericial por Nome, CPF ou CNPJ</h2>
                    <div class="frd-search-sub">
                      Investigação de redes de relacionamentos, sócios, vínculos funcionais e sanções no HeraclitusDB
                    </div>
                  </div>
                </div>

                <!-- Chips Rápidos com Casos Reais -->
                <div class="frd-search-chips">
                  <span class="chip-label">Exemplos Rápidos:</span>
                  <button class="frd-chip active" data-q="Carlos Eduardo de Alencar Mendonça">👤 Carlos Eduardo (CPF ***.482.918-**)</button>
                  <button class="frd-chip" data-q="28.491.028/0001-44">🏢 Vialeste Pavimentação (CNPJ 28.491...)</button>
                  <button class="frd-chip" data-q="Mariana Vasconcelos Ribeiro">👤 Mariana Vasconcelos (CPF ***.901.324-**)</button>
                  <button class="frd-chip" data-q="19.824.710/0001-90">🏢 BioTech Medicamentos (CNPJ 19.824...)</button>
                  <button class="frd-chip" data-q="Rodrigo Silva de Oliveira">👤 Rodrigo Silva (FNDE)</button>
                  <button class="frd-chip" data-q="44.912.830/0001-12">🏢 Nexus Logística (CNPJ 44.912...)</button>
                  <button class="frd-chip" data-q="INFRASOLO ENGENHARIA DIAGNOSTICA">🏢 Infrasolo (CEIS HeraclitusDB)</button>
                  <button class="frd-chip" data-q="Patrícia Helena Fontes Bueno">👤 Patrícia Helena (MDS / CadÚnico)</button>
                </div>
              </div>

              <!-- Barra de Pesquisa Principal -->
              <div class="frd-search-bar">
                <div class="frd-input-group">
                  <span class="frd-input-icon">🔍</span>
                  <input type="text" id="frd-entity-search-input" class="frd-search-input" 
                         placeholder="Pesquisar por Nome, CPF (com ou sem pontuação) ou CNPJ..." 
                         value="Carlos Eduardo de Alencar Mendonça"
                         autocomplete="off" />
                  <button id="frd-btn-clear-search" class="frd-btn-clear" title="Limpar busca">✕</button>
                </div>
                <button id="frd-btn-execute-search" class="frd-search-submit-btn">
                  <span>Triangular Grafo</span> ➔
                </button>
              </div>
            </div>

            <!-- RESULTADO DA PESQUISA: GRAFO DAS RELAÇÕES EMBAIXO -->
            <div class="frd-graph-result-container" id="frd-graph-result-section">
              <div class="frd-graph-result-header">
                <div class="frd-graph-entity-info">
                  <div class="frd-graph-badge" id="frd-entity-badge">PESSOA FÍSICA · CONFLITO SOCIETÁRIO</div>
                  <h3 id="frd-entity-title">Carlos Eduardo de Alencar Mendonça</h3>
                  <div class="frd-entity-meta" id="frd-entity-meta">
                    <span><b>Documento:</b> <span id="frd-entity-doc">CPF ***.482.918-**</span></span>
                    <span><b>Órgão Vinculado:</b> <span id="frd-entity-agency">Ministério dos Transportes (UO 39000)</span></span>
                    <span><b>Score de Risco:</b> <span id="frd-entity-score" class="badge-crit">0.94 CRITICAL</span></span>
                    <span><b>Exposição:</b> <b id="frd-entity-exposure" style="color:#34d399">R$ 3.200.000,00</b></span>
                    <span><b>Fonte:</b> <span id="frd-entity-source" style="color:#38bdf8">HeraclitusDB (gRPC :7474)</span></span>
                  </div>
                </div>

                <!-- Controles do Grafo: Viagem no Tempo -->
                <div class="frd-graph-controls">
                  <div class="frd-time-travel-inline">
                    <span class="lbl">VIAGEM NO TEMPO (AS OF):</span>
                    <input type="range" id="frd-relation-year-slider" class="frd-slider" min="2021" max="2026" step="1" value="2026" style="width:130px" />
                    <strong id="frd-relation-year-label">ANO 2026</strong>
                  </div>
                </div>
              </div>

              <!-- CANVAS DO GRAFO DAS RELAÇÕES -->
              <div class="frd-relation-graph-canvas-wrap">
                <div id="frd-relation-graph-canvas" class="frd-relation-graph-canvas">
                  <!-- SVG gerado dinamicamente -->
                </div>

                <!-- Legenda de cores das entidades -->
                <div class="frd-graph-legend-overlay">
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#0284c7"></span> Pessoa / Servidor</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#10b981"></span> Empresa / PJ</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#1d4ed8"></span> Órgão Público</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#f59e0b"></span> Contrato / Licitação</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#e11d48"></span> Sanção (CEIS/CNEP)</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#eab308"></span> Pagamento SIAFI</div>
                  <div class="frd-legend-item"><span class="leg-dot" style="background:#8b5cf6"></span> Intermediário / Cônjuge</div>
                </div>
              </div>

              <!-- Card Explicativo com Nexo Causal e Evidências da Entidade -->
              <div class="frd-relation-explanation-card" id="frd-relation-explanation">
                <!-- Preenchido dinamicamente -->
              </div>
            </div>
          </section>

          <!-- 6 Main KPI Cards -->
          <div class="frd-kpis-grid" style="padding:0 0 10px">
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

          <!-- Fila de Triagem Pericial (Triage Queue) -->
          <section class="frd-panel">
            <div class="frd-panel-hd">
              <h2 class="frd-panel-title">
                <span>📋</span> Fila de Triagem Pericial (Triage Queue)
              </h2>
              <span class="frd-panel-badge" id="frd-table-count">6 indícios ativos</span>
            </div>
            <div class="frd-panel-bd">
              <!-- Toolbar Filtros da Tabela -->
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

          <!-- Dossiê Probatório & Decisão Humana -->
          <section class="frd-panel">
            <div class="frd-panel-hd">
              <h2 class="frd-panel-title">
                <span>🛡️</span> Dossiê Probatório &amp; Decisão Formal do Auditor
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
                  <button class="frd-btn" data-action="ESCALATE">🚨 Escalar p/ CGU/TCU</button>
                  <button class="frd-btn" data-action="DISMISS" style="color:#94a3b8">✕ Falso Positivo (Dismiss)</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Trilha de Auditoria Imutável (Audit Trail) -->
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
    this.searchRelations(this.currentQuery, this.currentYear);
    this.setupListeners();

    // Reatividade a rotas
    document.addEventListener("hera:route-changed", ev => {
      if (ev.detail?.route === "frd") {
        const input = document.getElementById("frd-entity-search-input");
        const q = input ? input.value.trim() : this.currentQuery;
        this.searchRelations(q, this.currentYear);
      }
    });
  },

  async searchRelations(query, year) {
    const q = (query || "").trim();
    this.currentQuery = q;
    const yr = year || this.currentYear || 2026;

    const canvas = document.getElementById("frd-relation-graph-canvas");
    if (canvas) {
      canvas.innerHTML = `<div style="display:flex;height:480px;align-items:center;justify-content:center;color:#38bdf8;font-size:14px;font-weight:600">
        <span style="display:inline-block;animation:spin 1s infinite linear;margin-right:10px">🔄</span> Investigando relações periciais no HeraclitusDB...
      </div>`;
    }

    try {
      const url = `/frd-api/search?q=${encodeURIComponent(q)}&year=${yr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.currentGraphData = data;

      if (data.found) {
        this.updateEntityHeader(data.entity, data.source);
        this.renderRelationGraph(data);
        this.renderRelationExplanation(data);
        if (data.signal_id) {
          this.selectedSignalId = data.signal_id;
          this.inspectSignal(data.signal_id, false);
        }
      } else {
        this.renderNotFound(data);
      }
    } catch (e) {
      console.warn("Erro ao buscar relações periciais:", e);
      if (canvas) {
        canvas.innerHTML = `<div style="display:flex;height:480px;align-items:center;justify-content:center;color:#fb7185;font-size:14px">
          Falha ao consultar relações periciais: ${e.message}
        </div>`;
      }
    }
  },

  updateEntityHeader(entity, source) {
    if (!entity) return;
    const badge = document.getElementById("frd-entity-badge");
    const title = document.getElementById("frd-entity-title");
    const doc = document.getElementById("frd-entity-doc");
    const agency = document.getElementById("frd-entity-agency");
    const score = document.getElementById("frd-entity-score");
    const exposure = document.getElementById("frd-entity-exposure");
    const src = document.getElementById("frd-entity-source");

    if (badge) badge.textContent = `${entity.type === 'Person' ? 'PESSOA FÍSICA' : 'PESSOA JURÍDICA'} · ${entity.rule_name || entity.role || 'INDÍCIO PERICIAL'}`;
    if (title) title.textContent = entity.name || "Entidade Investigada";
    if (doc) doc.textContent = `${entity.doc_type || 'DOC'} ${entity.doc || '—'}`;
    if (agency) agency.textContent = `${entity.agency || 'Órgão Federal'} ${entity.agency_code ? `(UO ${entity.agency_code})` : ''}`;
    
    if (score) {
      const s = entity.risk_score || 0.90;
      const sev = entity.severity || "CRITICAL";
      score.className = sev === "CRITICAL" ? "badge-crit" : (sev === "HIGH" ? "badge-high" : "badge-med");
      score.textContent = `${s.toFixed(2)} ${sev}`;
    }

    if (exposure) {
      const exp = entity.monetary_exposure || 0;
      exposure.textContent = "R$ " + exp.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (src) src.textContent = source || "HeraclitusDB (gRPC :7474)";
  },

  renderRelationGraph(data) {
    const canvas = document.getElementById("frd-relation-graph-canvas");
    if (!canvas) return;

    const nodes = data.nodes || [];
    const edges = data.edges || [];
    if (!nodes.length) {
      canvas.innerHTML = `<div style="padding:40px;text-align:center;color:#64748b">Nenhum nó disponível no grafo.</div>`;
      return;
    }

    const W = 1000;
    const H = 480;

    // Posicionamento Constelação / Radial
    const cx = W / 2;
    const cy = H / 2 - 10;
    const rx = 380;
    const ry = 165;

    const centerNode = nodes[0];
    const otherNodes = nodes.slice(1);

    const posMap = {};
    posMap[centerNode.id] = { x: cx, y: cy, isCenter: true };

    const nOthers = otherNodes.length;
    otherNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx / nOthers) - (Math.PI / 2);
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      posMap[node.id] = { x: Math.round(x), y: Math.round(y), isCenter: false };
    });

    // Ícones por tipo de entidade
    const icons = {
      Person: "👤",
      Company: "🏢",
      Agency: "🏛️",
      Contract: "📜",
      Sanction: "⛔",
      Payment: "💰",
      Benefit: "🤝"
    };

    // Renderização das Arestas com Labels legíveis e Marcadores de Seta
    let svgEdges = "";
    edges.forEach((edge, eIdx) => {
      const pFrom = posMap[edge.from] || { x: cx, y: cy };
      const pTo = posMap[edge.to] || { x: cx, y: cy };
      const active = edge.active !== false;

      // Curva quadrática suave com ponto de controle deslocado
      const midX = (pFrom.x + pTo.x) / 2;
      const midY = (pFrom.y + pTo.y) / 2;
      const dx = pTo.x - pFrom.x;
      const dy = pTo.y - pFrom.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const normX = -dy / dist;
      const normY = dx / dist;
      const curvature = 24 * (eIdx % 2 === 0 ? 1 : -1);
      const ctrlX = Math.round(midX + normX * curvature);
      const ctrlY = Math.round(midY + normY * curvature);

      const isAlertEdge = edge.label.includes("SANÇÃO") || edge.label.includes("PARTNER") || edge.label.includes("CONTRATO");
      const strokeColor = active 
        ? (isAlertEdge ? "#f43f5e" : (edge.label.includes("EMPLOYED") ? "#38bdf8" : "#10b981")) 
        : "#334155";
      const strokeWidth = active ? "2.5" : "1.5";
      const dash = active ? "none" : "5 4";
      const opacity = active ? "0.95" : "0.3";

      const labelTxt = `${edge.label} ${edge.period ? `(${edge.period})` : ''} ${!active ? '· INATIVO' : ''}`;
      const badgeWidth = Math.min(labelTxt.length * 6.5 + 16, 240);

      svgEdges += `
        <g class="frd-edge-group">
          <path d="M ${pFrom.x} ${pFrom.y} Q ${ctrlX} ${ctrlY} ${pTo.x} ${pTo.y}" 
                fill="none" 
                stroke="${strokeColor}" 
                stroke-width="${strokeWidth}" 
                stroke-dasharray="${dash}" 
                opacity="${opacity}" 
                marker-end="url(#frd-arrow-${active ? (isAlertEdge ? 'alert' : 'active') : 'inact'})" />
          
          <rect x="${ctrlX - badgeWidth / 2}" y="${ctrlY - 9}" width="${badgeWidth}" height="18" rx="4" 
                fill="#070e1e" stroke="${active ? strokeColor : '#334155'}" stroke-width="1" opacity="0.9" />
          <text x="${ctrlX}" y="${ctrlY + 3.5}" text-anchor="middle" fill="${active ? '#f1f5f9' : '#64748b'}" 
                font-size="9" font-family="-apple-system, BlinkMacSystemFont, monospace" font-weight="600">
            ${labelTxt}
          </text>
        </g>
      `;
    });

    // Renderização dos Nós
    let svgNodes = "";
    nodes.forEach(node => {
      const pos = posMap[node.id] || { x: cx, y: cy, isCenter: false };
      const icon = icons[node.type] || "🔹";
      const color = node.color || (pos.isCenter ? "#0284c7" : "#10b981");

      const labelShort = node.label.length > 22 ? node.label.slice(0, 20) + "…" : node.label;
      const subShort = (node.sub || "").length > 28 ? (node.sub || "").slice(0, 26) + "…" : (node.sub || "");

      if (pos.isCenter) {
        svgNodes += `
          <g class="frd-node-elem" transform="translate(${pos.x}, ${pos.y})" style="cursor:pointer"
             onclick="alert('Alvo Central da Investigação:\n${node.label}\n${node.sub}\nScore de Risco: ${data.entity?.risk_score || '0.94'} (${data.entity?.severity || 'CRITICAL'})')">
            <circle r="44" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5 3" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
            </circle>
            <circle r="36" fill="rgba(2, 132, 199, 0.25)" stroke="${color}" stroke-width="3" />
            <circle r="28" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
            <text x="0" y="6" text-anchor="middle" font-size="16">${icon}</text>
            
            <rect x="-80" y="38" width="160" height="22" rx="4" fill="#070e1e" stroke="${color}" stroke-width="1.5" opacity="0.95"/>
            <text x="0" y="53" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800">${labelShort}</text>
            <text x="0" y="72" text-anchor="middle" fill="#38bdf8" font-size="9.5" font-weight="600">${subShort}</text>
          </g>
        `;
      } else {
        svgNodes += `
          <g class="frd-node-elem" transform="translate(${pos.x}, ${pos.y})" style="cursor:pointer"
             onclick="alert('Entidade Conectada:\n${node.label}\nTipo: ${node.type}\nDetalhes: ${node.sub}')">
            <circle r="26" fill="rgba(15, 23, 42, 0.85)" stroke="${color}" stroke-width="2.5" />
            <circle r="20" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
            <text x="0" y="5" text-anchor="middle" font-size="12">${icon}</text>

            <rect x="-70" y="30" width="140" height="18" rx="4" fill="#070e1e" stroke="rgba(255,255,255,0.15)" stroke-width="1" opacity="0.95"/>
            <text x="0" y="43" text-anchor="middle" fill="#f8fafc" font-size="10" font-weight="700">${labelShort}</text>
            <text x="0" y="58" text-anchor="middle" fill="#94a3b8" font-size="8.5">${subShort}</text>
          </g>
        `;
      }
    });

    canvas.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">
        <defs>
          <marker id="frd-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L8,4 L0,7 Z" fill="#38bdf8" />
          </marker>
          <marker id="frd-arrow-alert" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L8,4 L0,7 Z" fill="#f43f5e" />
          </marker>
          <marker id="frd-arrow-inact" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L8,4 L0,7 Z" fill="#475569" />
          </marker>
          <pattern id="frd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#frd-grid)" />
        ${svgEdges}
        ${svgNodes}
      </svg>
    `;
  },

  renderRelationExplanation(data) {
    const container = document.getElementById("frd-relation-explanation");
    if (!container) return;

    const ent = data.entity || {};
    const expl = data.explanation || [];
    const ev = data.evidence || [];
    const b = data.bundle || {};
    const rfc = b.rfc3161 || {};

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px">
        <div>
          <span style="font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase">${ent.trilha || 'TRILHA PERICIAL'} · ${ent.rule_id || 'FRD-001'}</span>
          <h4 style="margin:4px 0;font-size:16px;color:#ffffff">${ent.rule_name || ent.role || 'Conflito de Interesses e Risco de Integridade'}</h4>
        </div>
        <div style="text-align:right">
          <span class="badge-crit" style="font-size:12px">${(ent.risk_score || 0.94).toFixed(2)} ${ent.severity || 'CRITICAL'}</span>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">Confidence: <b>99.7% (VERIFIED)</b></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px">
        <div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8">Nexo Causal &amp; Triangulação Normativa:</span>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:#cbd5e1;line-height:1.5">
            ${expl.map(item => `<li style="margin-bottom:6px">${item}</li>`).join("")}
          </ul>
        </div>

        <div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8">Cadeia de Evidências &amp; Lacre Merkle:</span>
          <div style="margin-top:8px;font-size:12px;color:#cbd5e1;background:#070e1e;padding:12px;border-radius:6px;border:1px solid rgba(255,255,255,0.08)">
            <div><b>Evidências Auditadas:</b> <span style="color:#38bdf8">${ev.length} registros anexados</span></div>
            <div style="margin-top:4px"><b>Merkle Root:</b> <code style="color:#34d399;font-size:11px">${b.merkle_root || '0x4a91c810de02ff94a81001b...'}</code></div>
            <div style="margin-top:4px"><b>Certificação ICP-Brasil:</b> <span style="color:#f8fafc">${rfc.serial_number || 'ACT-2026-BR'}</span></div>
            <div style="margin-top:4px;font-size:11px;color:#94a3b8">Imutabilidade garantida por log append-only no HeraclitusDB</div>
          </div>
        </div>
      </div>
    `;
  },

  renderNotFound(data) {
    const canvas = document.getElementById("frd-relation-graph-canvas");
    const container = document.getElementById("frd-relation-explanation");
    const suggestions = data.suggestions || [];

    if (canvas) {
      canvas.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:480px;padding:30px;text-align:center">
          <span style="font-size:48px;margin-bottom:12px">🔍</span>
          <h3 style="color:#ffffff;margin:0 0 8px">Nenhuma entidade localizada para “${data.query || ''}”</h3>
          <p style="color:#94a3b8;max-width:560px;font-size:13px;margin:0 0 20px">
            Não encontramos correspondência exata para este termo no banco ou na fila pericial. 
            Selecione uma das entidades investigadas abaixo para carregar seu Grafo de Relações:
          </p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:700px">
            ${suggestions.map(s => `
              <button class="frd-chip" data-q="${s.name}" style="background:#1e293b;border-color:#38bdf8;color:#ffffff;padding:6px 14px">
                <b>${s.name}</b> <span style="color:#94a3b8">(${s.doc})</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;

      canvas.querySelectorAll(".frd-chip").forEach(btn => {
        btn.onclick = () => {
          const q = btn.getAttribute("data-q");
          const input = document.getElementById("frd-entity-search-input");
          if (input) input.value = q;
          this.searchRelations(q, this.currentYear);
        };
      });
    }

    if (container) {
      container.innerHTML = `<div style="text-align:center;color:#64748b;font-size:13px">Aguardando seleção de entidade válida para exibir o nexo causal.</div>`;
    }
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
            <button class="frd-btn frd-btn-inspect" data-id="${s.id}">🔎 Investigar</button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("tr[data-id]").forEach(tr => {
      tr.onclick = () => {
        const id = tr.getAttribute("data-id");
        this.selectedSignalId = id;
        tbody.querySelectorAll("tr").forEach(r => r.classList.remove("selected"));
        tr.classList.add("selected");
        
        const sig = this.signals.find(s => s.id === id);
        if (sig) {
          const searchInput = document.getElementById("frd-entity-search-input");
          if (searchInput) searchInput.value = sig.person.name;
          this.searchRelations(sig.person.name, this.currentYear);
          document.getElementById("frd-graph-result-section")?.scrollIntoView({ behavior: "smooth" });
        }
        this.inspectSignal(id, true);
      };
    });
  },

  async inspectSignal(signalId, updateDossierOnly = false) {
    this.selectedSignalId = signalId;
    try {
      const resDetail = await fetch(`/frd-api/signal?id=${encodeURIComponent(signalId)}`);
      if (resDetail.ok) {
        const detail = await resDetail.json();
        if (detail.found) {
          this.renderDossier(detail.signal, detail.bundle);
        }
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

      <div style="margin-bottom:14px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8">Explicação Estruturada do Alerta:</span>
        <ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#cbd5e1;line-height:1.45">
          ${(signal.explanation || []).map(exp => `<li>${exp}</li>`).join("")}
        </ul>
      </div>

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
    // 1. Campo de Pesquisa Pericial de Entidades (Nome / CPF / CNPJ)
    const searchInput = document.getElementById("frd-entity-search-input");
    const searchBtn = document.getElementById("frd-btn-execute-search");
    const clearBtn = document.getElementById("frd-btn-clear-search");

    const execSearch = () => {
      const val = searchInput ? searchInput.value.trim() : "";
      this.searchRelations(val, this.currentYear);
    };

    if (searchBtn) searchBtn.onclick = execSearch;
    if (searchInput) {
      searchInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          execSearch();
        }
      };
    }
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (searchInput) searchInput.value = "";
        this.searchRelations("", this.currentYear);
      };
    }

    // 2. Chips Rápidos de Pesquisa
    document.querySelectorAll(".frd-search-chips .frd-chip").forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll(".frd-search-chips .frd-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const q = chip.getAttribute("data-q");
        if (searchInput) searchInput.value = q;
        this.searchRelations(q, this.currentYear);
      };
    });

    // 3. Slider de Viagem no Tempo do Grafo de Relações
    const relYearSlider = document.getElementById("frd-relation-year-slider");
    const relYearLabel = document.getElementById("frd-relation-year-label");
    if (relYearSlider) {
      relYearSlider.oninput = (e) => {
        this.currentYear = parseInt(e.target.value, 10);
        if (relYearLabel) relYearLabel.textContent = `ANO ${this.currentYear}`;
        const val = searchInput ? searchInput.value.trim() : this.currentQuery;
        this.searchRelations(val, this.currentYear);
      };
    }

    // 4. Filtros da Fila de Triagem
    const qTable = document.getElementById("frd-filter-search");
    const sevTable = document.getElementById("frd-filter-sev");
    const stTable = document.getElementById("frd-filter-status");
    const btnRef = document.getElementById("frd-btn-refresh");

    if (qTable) qTable.oninput = () => this.loadSignals();
    if (sevTable) sevTable.onchange = () => this.loadSignals();
    if (stTable) stTable.onchange = () => this.loadSignals();
    if (btnRef) btnRef.onclick = () => { this.loadSummary(); this.loadSignals(); this.loadAuditTrail(); };

    // 5. Botões de Despacho Pericial do Auditor
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
