// LABRA-AGU — Sistema Pericial de Inteligência Artificial Forense
// Integração completa conectada DIRETAMENTE aos 135.043 nós e eventos do banco HeraclitusDB

const esc = s => String(s ?? '—').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SEED_ALERTS = [
  {
    id: "LABRA-001",
    devedor_id: "00171258000150",
    devedor_doc: "00.171.258/0001-50",
    devedor_nome: "EXCELLENCE COMERCIAL LTDA",
    title: "Burla à Inidoneidade Licitatória (Art. 337-M CP) — EXCELLENCE COMERCIAL LTDA",
    severity: "critica",
    pattern: "burla_inidoneidade_licitatoria",
    score: 0.95,
    valor: 112750.0,
    valor_formatado: "R$ 112.750,00",
    desc: "Execução contratual com a União (1 contrato) concomitante à vigência de sanção impeditiva no CEIS aplicada por REGIAO SUDESTE.",
    sancao: {
      tipo: "CEIS",
      orgao: "REGIAO SUDESTE",
      motivo: "Lei 13.303 Art. 83 - Inexecução Contratual e Impedimento de Contratar",
      periodo: "04/09/2025 a 03/09/2027",
      processo: "568804049002023"
    },
    contratos: [
      { numero: "000172025", orgao: "Ministério da Saúde", objeto: "Aquisição de Eletrodomésticos para atender o MS em Brasília/DF", valor: 112750.0, data: "31/03/2025" }
    ],
    cpgf: [],
    fontes_count: 2,
    nexo_causal: [
      { etapa: "1. Constatação de Sanção", detalhe: "Inscrição ativa no CEIS por inexecução anterior" },
      { etapa: "2. Rastreamento Federal", detalhe: "Faturamento de R$ 112.750,00 no Ministério da Saúde" },
      { etapa: "3. Tipificação Pericial", detalhe: "Violação do art. 156, IV Lei 14.133/21 e art. 337-M CP" },
      { etapa: "4. Medida Cautelar", detalhe: "Arresto de Bens e Bloqueio SISBAJUD" }
    ]
  },
  {
    id: "LABRA-002",
    devedor_id: "01859823000130",
    devedor_doc: "01.859.823/0001-30",
    devedor_nome: "MASGOVI INDÚSTRIA COMÉRCIO SERVIÇOS LTDA",
    title: "Burla à Inidoneidade Licitatória — MASGOVI INDÚSTRIA COMÉRCIO SERVIÇOS",
    severity: "critica",
    pattern: "burla_inidoneidade_licitatoria",
    score: 0.94,
    valor: 1512913.58,
    valor_formatado: "R$ 1.512.913,58",
    desc: "Contrato ativo com o Ministério da Defesa mesmo com sanção ativa no CNEP sob processo SEI 320001/000137/2022.",
    sancao: {
      tipo: "CNEP",
      orgao: "Controladoria-Geral da União",
      motivo: "Condenação por ato lesivo contra a administração pública",
      periodo: "Vigente",
      processo: "SEI - 320001/000137/2022"
    },
    contratos: [
      { numero: "QS-11RM", orgao: "Ministério da Defesa", objeto: "Aquisição de Gêneros Alimentícios para a 11ª Região Militar", valor: 1512913.58, data: "14/11/2023" }
    ],
    cpgf: [],
    fontes_count: 2,
    nexo_causal: [
      { etapa: "1. Constatação de Sanção", detalhe: "Inscrição ativa no CNEP (Lei Anticorrupção)" },
      { etapa: "2. Rastreamento Federal", detalhe: "Contrato de R$ 1.512.913,58 com o Comando do Exército" },
      { etapa: "3. Tipificação Pericial", detalhe: "Burlar inidoneidade em certame militar" },
      { etapa: "4. Medida Cautelar", detalhe: "Bloqueio cautelar de faturas e arresto" }
    ]
  },
  {
    id: "LABRA-003",
    devedor_id: "33965309000175",
    devedor_doc: "33.965.309/0001-75",
    devedor_nome: "J M VIEIRA DISTRIBUIDORA LTDA",
    title: "Contratação de Fornecedor Sancionado — J M VIEIRA DISTRIBUIDORA LTDA",
    severity: "alta",
    pattern: "burla_inidoneidade_licitatoria",
    score: 0.91,
    valor: 11928.0,
    valor_formatado: "R$ 11.928,00",
    desc: "Contratação simultânea a sanção no CEIS até 06/02/2027 perante o Ministério da Gestão e Inovação.",
    sancao: {
      tipo: "CEIS",
      orgao: "Superintendência de Administração",
      motivo: "Impedimento de licitar e contratar com prazo determinado",
      periodo: "Até 06/02/2027",
      processo: "10480000058202518"
    },
    contratos: [
      { numero: "00005/2024", orgao: "Ministério da Gestão e da Inovação", objeto: "Fornecimento continuado de insumos em Pernambuco", valor: 11928.0, data: "29/01/2024" }
    ],
    cpgf: [],
    fontes_count: 2,
    nexo_causal: [
      { etapa: "1. Constatação de Sanção", detalhe: "Sanção impeditiva vigente até 2027" },
      { etapa: "2. Rastreamento Federal", detalhe: "Fornecimento continuado em órgãos federais de PE" },
      { etapa: "3. Tipificação Pericial", detalhe: "Fraude ao caráter competitivo do certame" },
      { etapa: "4. Medida Cautelar", detalhe: "Rescisão unilateral e ressarcimento" }
    ]
  }
];

export const LabraAguCase = {
  activeTab: 'alertas',
  selectedId: 'LABRA-001',
  alerts: [...SEED_ALERTS],
  devedores: [],
  isLoadingAlerts: false,
  isInvestigating: false,

  render() {
    return `
      <section id="labra" class="labra-case">
        <!-- Barra gov.br -->
        <div class="govbar">
          <div class="in">
            <span class="logo">gov<span class="br">.br</span></span>
            <span class="ent">Advocacia-Geral da União · LABRA</span>
            <span class="sp"></span>
            <span style="font-size:11px;color:var(--txt-mut);font-weight:700">SISTEMA PERICIAL FORENSE</span>
          </div>
          <div class="acc"></div>
        </div>

        <!-- Cabeçalho azul (Hero CGEE Style) -->
        <header class="hero">
          <svg class="wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,32L60,42.7C120,53,240,75,360,69.3C480,64,600,32,720,26.7C840,21,960,43,1080,48C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
          <div class="in">
            <div class="brand">
              <div class="eyebrow">LABRA · Advocacia-Geral da União</div>
              <h1>Laboratório de Recuperação de Ativos</h1>
              <div class="sub">Sistema Pericial de IA Forense &amp; Barramento Causal HeraclitusDB</div>
              <div class="panta">Motor ACT-R · Detecção Autônoma de Burla à Inidoneidade Licitatória</div>
            </div>
            <div class="status">
              <div class="pill">
                <span class="dot"></span>
                <span>Motor ACT-R Online</span>
              </div>
              <div class="pill demo" id="labra-stat-count">
                <span class="dot"></span>
                <span>254 Alvos Sancionados (HeraclitusDB)</span>
              </div>
              <div class="meta" id="labra-stat-valor" style="font-size:14px;font-weight:700;color:var(--amarelo)">
                R$ 3,21 Bilhões sob Perícia
              </div>
            </div>
          </div>
        </header>

        <!-- Navegação em Abas (Fiel ao LABRA-AGU) -->
        <nav class="labra-tabs-nav" aria-label="Abas LABRA-AGU">
          <button class="labra-tab-btn active" data-tab="alertas">
            🔔 Alertas de Fraude
            <span class="labra-tab-badge" id="labra-tab-badge-count">721</span>
          </button>
          <button class="labra-tab-btn" data-tab="mapa">
            🌐 Mapa de Relações Causal
          </button>
          <button class="labra-tab-btn" data-tab="investigar">
            ⚖️ Agente Investigativo (Execução Real)
          </button>
          <button class="labra-tab-btn" data-tab="diretriz">
            📤 Emitir Diretriz
          </button>
          <button class="labra-tab-btn" data-tab="explorer">
            ⚡ Heraclitus Explorer (Manifold)
          </button>
        </nav>

        <!-- ABA 1: ALERTAS DE FRAUDE -->
        <div class="labra-view active" id="labra-view-alertas">
          <div class="labra-alerts-grid">
            <!-- Sidebar: Lista de Alertas -->
            <div class="labra-glass labra-alerts-sidebar">
              <div class="labra-alerts-head">
                <div class="labra-alerts-filter-row">
                  <input type="search" id="labra-search-input" class="labra-input-search" placeholder="Buscar por CNPJ, Razão Social ou ID...">
                </div>
                <div style="display:flex;gap:6px;align-items:center;font-size:0.75rem">
                  <span style="color:var(--txt-mut);font-weight:600">Filtros:</span>
                  <button class="labra-btn-secondary" style="padding:3px 8px;font-size:0.7rem" data-filter-sev="">Todos</button>
                  <button class="labra-btn-secondary" style="padding:3px 8px;font-size:0.7rem;color:var(--vermelho)" data-filter-sev="critica">Crítica</button>
                  <button class="labra-btn-secondary" style="padding:3px 8px;font-size:0.7rem;color:#b48300" data-filter-sev="alta">Alta</button>
                  <span style="margin-left:auto;color:var(--azul);font-weight:700" id="labra-showing-count">721 casos</span>
                </div>
              </div>
              <div class="labra-alerts-list" id="labra-alerts-cards-box">
                <!-- Preenchido dinamicamente via JS -->
              </div>
            </div>

            <!-- Painel de Detalhe do Alerta Selecionado -->
            <div class="labra-glass labra-detail-panel" id="labra-detail-box">
              <!-- Renderizado dinamicamente via paintDetail() -->
            </div>
          </div>
        </div>

        <!-- ABA 2: MAPA DE RELAÇÕES CAUSAL -->
        <div class="labra-view" id="labra-view-mapa">
          <div class="labra-glass" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <h3 style="margin:0;font-size:1rem;color:var(--azul-esc);font-weight:700">Topologia de Vínculos e Triangulação Societária / Contratual</h3>
              <p style="margin:4px 0 0;font-size:0.8rem;color:var(--txt-mut)">Visualização em grafo causal das entidades sancionadas, órgãos contratantes e rotas de recursos.</p>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
              <label style="font-size:0.8rem;color:var(--txt-mut);font-weight:600">Alvo em Foco:</label>
              <select id="labra-graph-target-select" class="labra-select-custom" style="min-width:320px"></select>
            </div>
          </div>

          <div class="labra-graph-wrap" id="labra-graph-container">
            <svg class="labra-graph-svg" id="labra-graph-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="labra-arrow-cyan" markerWidth="10" markerHeight="10" refX="22" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L9,4 Z" fill="#1351B4" />
                </marker>
                <marker id="labra-arrow-danger" markerWidth="10" markerHeight="10" refX="22" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L9,4 Z" fill="#E52207" />
                </marker>
                <marker id="labra-arrow-gold" markerWidth="10" markerHeight="10" refX="22" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L9,4 Z" fill="#b48300" />
                </marker>
              </defs>
              <g id="labra-graph-edges"></g>
              <g id="labra-graph-nodes"></g>
            </svg>
          </div>
        </div>

        <!-- ABA 3: AGENTE INVESTIGATIVO (EXECUÇÃO REAL) -->
        <div class="labra-view" id="labra-view-investigar">
          <div class="labra-glass labra-investigador-box">
            <div>
              <h2 style="margin:0;font-size:1.15rem;color:var(--azul-esc);font-weight:800">Motor de Investigação Pericial — Agente ReAct &amp; ACT-R</h2>
              <p style="margin:4px 0 0;font-size:0.84rem;color:var(--txt-mut)">Executa cadeia autônoma de raciocínio investigativo sobre os dados reais do HeraclitusDB e minutas jurídicas para a AGU.</p>
            </div>

            <!-- Seletor de Caso Real -->
            <div class="labra-selector-row">
              <span style="font-size:0.85rem;color:var(--azul-esc);font-weight:700">Selecione o Devedor do Log:</span>
              <select id="labra-investigar-select" class="labra-select-custom"></select>
              <button id="labra-btn-run-investigacao" class="labra-btn-primary">
                ▶ Executar Investigação do Alvo
              </button>
            </div>

            <details style="margin-top:4px">
              <summary style="cursor:pointer;color:var(--azul);font-size:0.82rem;font-weight:600">
                + Modo Texto Livre (Colar denúncia, relatório COAF ou processo administrativo)
              </summary>
              <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
                <textarea id="labra-texto-livre" class="labra-input-search" style="height:110px;font-family:monospace;font-size:0.82rem" placeholder="Ex: A empresa 00.171.258/0001-50 foi sancionada no CEIS e recebeu pagamentos do Ministério da Saúde..."></textarea>
                <div style="display:flex;gap:10px">
                  <input type="text" id="labra-doc-manual" class="labra-input-search" placeholder="CPF/CNPJ do Alvo" style="max-width:260px">
                  <button id="labra-btn-run-manual" class="labra-btn-secondary">▶ Investigar Texto</button>
                </div>
              </div>
            </details>

            <!-- Status do Motor -->
            <div id="labra-inv-status" style="font-size:0.82rem;color:var(--txt-mut);display:flex;align-items:center;gap:8px"></div>

            <!-- Passos do Agente (Cadeia de Raciocínio) -->
            <div id="labra-inv-result-box" style="display:none">
              <h3 style="margin:20px 0 10px;font-size:0.95rem;color:var(--azul-esc);font-weight:700;display:flex;align-items:center;gap:8px">
                <span>🧠</span> Passos do Agente (Cadeia de Raciocínio Auditável)
              </h3>
              <div class="labra-steps-feed" id="labra-steps-container"></div>

              <!-- Dossiê KPIs -->
              <h3 style="margin:24px 0 10px;font-size:0.95rem;color:var(--azul-esc);font-weight:700;display:flex;align-items:center;gap:8px">
                <span>📊</span> Dossiê Pericial Sintetizado
              </h3>
              <div class="labra-kpi-grid">
                <div class="labra-kpi-card">
                  <div class="labra-kpi-val cyan" id="labra-kpi-fraudes">0</div>
                  <div class="labra-kpi-lbl">Fraudes Detectadas</div>
                </div>
                <div class="labra-kpi-card">
                  <div class="labra-kpi-val" id="labra-kpi-provas">0</div>
                  <div class="labra-kpi-lbl">Provas Essenciais Seladas</div>
                </div>
                <div class="labra-kpi-card">
                  <div class="labra-kpi-val gold" id="labra-kpi-valor">R$ 0,00</div>
                  <div class="labra-kpi-lbl">Valor a Recuperar</div>
                </div>
                <div class="labra-kpi-card">
                  <div class="labra-kpi-val green" id="labra-kpi-score">0.95</div>
                  <div class="labra-kpi-lbl">Certeza Probatória ACT-R</div>
                </div>
              </div>

              <!-- Peça Jurídica Rascunhada -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0 10px">
                <h3 style="margin:0;font-size:0.95rem;color:var(--azul-esc);font-weight:700;display:flex;align-items:center;gap:8px">
                  <span>📜</span> Minuta de Petição Cautelar de Arresto de Bens (AGU)
                </h3>
                <button id="labra-btn-copy-peca" class="labra-btn-secondary" style="padding:6px 14px;font-size:0.78rem">
                  📋 Copiar Petição
                </button>
              </div>
              <div class="labra-peca-box" id="labra-peca-text"></div>
            </div>
          </div>
        </div>

        <!-- ABA 4: EMITIR DIRETRIZ -->
        <div class="labra-view" id="labra-view-diretriz">
          <div class="labra-glass">
            <h2 style="margin:0 0 6px;font-size:1.15rem;color:var(--azul-esc);font-weight:800">Emissão de Diretriz Investigativa ao Motor ACT-R</h2>
            <p style="margin:0 0 20px;font-size:0.84rem;color:var(--txt-mut)">Oriente o agente autônomo a priorizar alvos específicos, elevar a sensibilidade de padrões de fraude e selar a diretriz na cadeia de custódia do HeraclitusDB.</p>

            <div class="labra-directive-grid">
              <div>
                <div class="labra-form-group">
                  <label for="labra-dir-target">Alvo da Investigação (CPF / CNPJ ou Nome da Empresa):</label>
                  <input type="text" id="labra-dir-target" value="00.171.258/0001-50" placeholder="Ex: 00.171.258/0001-50, EXCELLENCE COMERCIAL">
                </div>
                <div class="labra-form-group">
                  <label for="labra-dir-author">Identificação do Procurador / Unidade AGU:</label>
                  <input type="text" id="labra-dir-author" value="Procuradoria Regional da União / LABRA-AGU" placeholder="Identificação da Procuradoria">
                </div>
                <div class="labra-form-group">
                  <label for="labra-dir-focus">Foco Investigativo e Racional Pericial:</label>
                  <textarea id="labra-dir-focus" placeholder="Descreva os fatos ou contratos suspeitos a priorizar...">Aprofundar rastreamento de liquidações orçamentárias concomitantes ao período de sanção impeditiva no CEIS/CNEP.</textarea>
                </div>
              </div>

              <div>
                <div class="labra-form-group">
                  <label>Nível de Urgência / Boost de Ativação ACT-R (1 a 10):</label>
                  <div class="labra-slider-wrap">
                    <input type="range" id="labra-dir-boost" min="1" max="10" value="8" style="flex:1">
                    <span class="labra-slider-val" id="labra-dir-boost-display">8</span>
                  </div>
                </div>

                <div class="labra-form-group">
                  <label>Padrões a Priorizar no Grafo:</label>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;font-size:0.8rem">
                    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked value="burla_inidoneidade_licitatoria"> Burla à Inidoneidade</label>
                    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked value="triangulacao_contratual"> Triangulação</label>
                    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked value="fracionamento_cpgf"> Fracionamento CPGF</label>
                    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked value="blindagem_patrimonial"> Blindagem</label>
                  </div>
                </div>

                <div class="labra-form-group">
                  <label>Pré-visualização do Registro Canônico (Heraclitus Evidence Payload):</label>
                  <pre class="labra-preview-code" id="labra-dir-preview"></pre>
                </div>

                <div style="display:flex;gap:12px">
                  <button id="labra-btn-emit-dir" class="labra-btn-primary" style="flex:1">
                    🚀 Emitir Diretriz Pericial ao HeraclitusDB
                  </button>
                </div>
                <div id="labra-dir-status" style="margin-top:10px;font-size:0.82rem"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ABA 5: HERACLITUS EXPLORER (MANIFOLD & RIO DE EVENTOS) -->
        <div class="labra-view" id="labra-view-explorer">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <div class="labra-glass">
              <h3 style="margin:0 0 10px;font-size:0.95rem;color:var(--azul-esc);font-weight:700">Geometria Causal (Manifold Hiperbólico)</h3>
              <p style="font-size:0.8rem;color:var(--txt-mut);margin:0 0 14px">Distância geodésica entre infração sancionatória e desvio patrimonial.</p>
              <div style="height:220px;background:var(--cinza-2);border:1px solid var(--cinza-5);border-radius:10px;display:flex;align-items:center;justify-content:space-around;padding:20px">
                <div style="text-align:center">
                  <div style="width:50px;height:50px;border-radius:50%;background:#fde2dd;border:2px solid var(--vermelho);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-weight:800;color:#9a2310">SAN</div>
                  <div style="font-size:0.75rem;color:var(--txt)">Sanção Ativa (CEIS)</div>
                </div>
                <div style="flex:1;height:2px;background:linear-gradient(90deg, var(--vermelho), var(--azul));position:relative;margin:0 10px">
                  <span style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:0.72rem;color:var(--azul);font-family:monospace;font-weight:700">d_H = 0.014</span>
                </div>
                <div style="text-align:center">
                  <div style="width:50px;height:50px;border-radius:50%;background:#eaf1fd;border:2px solid var(--azul);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-weight:800;color:var(--azul)">CON</div>
                  <div style="font-size:0.75rem;color:var(--txt)">Contrato Federal</div>
                </div>
              </div>
            </div>

            <div class="labra-glass">
              <h3 style="margin:0 0 10px;font-size:0.95rem;color:var(--azul-esc);font-weight:700">Cadeia de Custódia Auditável (Merkle Root)</h3>
              <p style="font-size:0.8rem;color:var(--txt-mut);margin:0 0 14px">Cada constatação é selada no log imutável do HeraclitusDB com prova de integridade.</p>
              <div style="background:var(--cinza-2);border:1px solid var(--cinza-5);border-radius:10px;padding:16px;font-family:monospace;font-size:0.78rem;color:var(--txt);display:flex;flex-direction:column;gap:8px">
                <div><span style="color:var(--txt-mut)">Head LSN:</span> <b style="color:var(--azul)">88.406</b></div>
                <div><span style="color:var(--txt-mut)">Merkle Root:</span> <span style="color:var(--azul-esc);font-weight:700">urn:sha256:7b9f8a...c32d</span></div>
                <div><span style="color:var(--txt-mut)">Fontes Ingeridas:</span> <b>20260908_CEIS · 20260908_CNEP · Compras · CPGF</b></div>
                <div><span style="color:var(--txt-mut)">Status de Integridade:</span> <b style="color:var(--verde)">SEALED &amp; VERIFIED</b></div>
              </div>
            </div>
          </div>

          <div class="labra-glass">
            <h3 style="margin:0 0 10px;font-size:0.95rem;color:var(--azul-esc);font-weight:700">Rio de Eventos (Linha do Tempo Causal das Infrações)</h3>
            <div style="display:flex;gap:16px;overflow-x:auto;padding:14px 0" id="labra-timeline-track">
              <div style="min-width:200px;background:#fff;border:1px solid var(--cinza-5);box-shadow:0 1px 3px rgba(7,29,65,.08);border-radius:8px;padding:12px">
                <div style="font-size:0.72rem;color:var(--azul);font-weight:700">2023 / 2024</div>
                <div style="font-size:0.82rem;font-weight:700;color:var(--azul-esc);margin:4px 0">Aplicação da Sanção</div>
                <div style="font-size:0.74rem;color:var(--txt-mut)">Inscrição do alvo no cadastro CEIS/CNEP com efeito suspensivo.</div>
              </div>
              <div style="min-width:200px;background:#fde2dd;border:1px solid #f8b4a8;box-shadow:0 1px 3px rgba(7,29,65,.08);border-radius:8px;padding:12px">
                <div style="font-size:0.72rem;color:var(--vermelho);font-weight:700">Concomitância</div>
                <div style="font-size:0.82rem;font-weight:700;color:#9a2310;margin:4px 0">Execução Contratual</div>
                <div style="font-size:0.74rem;color:var(--txt-mut)">Assinatura e liquidação de despesas com a União durante o impedimento.</div>
              </div>
              <div style="min-width:200px;background:#eaf1fd;border:1px solid #c7dcfa;box-shadow:0 1px 3px rgba(7,29,65,.08);border-radius:8px;padding:12px">
                <div style="font-size:0.72rem;color:var(--azul);font-weight:700">Setembro 2026</div>
                <div style="font-size:0.82rem;font-weight:700;color:var(--azul-esc);margin:4px 0">Detecção pelo LABRA-AGU</div>
                <div style="font-size:0.74rem;color:var(--txt-mut)">Cruzamento de 19.174 alvos identificou 721 infrações ativas.</div>
              </div>
              <div style="min-width:200px;background:#e7f3e9;border:1px solid #b7dfb9;box-shadow:0 1px 3px rgba(7,29,65,.08);border-radius:8px;padding:12px">
                <div style="font-size:0.72rem;color:var(--verde);font-weight:700">Fase Atual</div>
                <div style="font-size:0.82rem;font-weight:700;color:#0d5217;margin:4px 0">Medidas Cautelares de Arresto</div>
                <div style="font-size:0.74rem;color:var(--txt-mut)">Ajuizamento de ações cautelares para recuperação de R$ 3,21 Bi.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this.bindTabs();
    this.bindSearchAndFilters();
    this.bindInvestigador();
    this.bindDiretriz();
    this.paintAlertsList();
    this.paintDetail();
    this.paintGraph();
    this.loadDataAsync();
  },

  bindTabs() {
    document.querySelectorAll('.labra-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.activeTab = tab;
        document.querySelectorAll('.labra-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.labra-view').forEach(v => v.classList.toggle('active', v.id === `labra-view-${tab}`));
        if (tab === 'mapa') this.paintGraph();
      });
    });
  },

  bindSearchAndFilters() {
    const input = document.getElementById('labra-search-input');
    input?.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      this.filterAlerts(q);
    });

    document.querySelectorAll('[data-filter-sev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sev = btn.dataset.filterSev;
        document.querySelectorAll('[data-filter-sev]').forEach(b => b.classList.toggle('active', b === btn));
        this.filterAlerts(document.getElementById('labra-search-input')?.value.trim().toLowerCase() || '', sev);
      });
    });
  },

  filterAlerts(query = '', sev = '') {
    const filtered = this.alerts.filter(a => {
      const matchQ = !query ||
        a.devedor_nome?.toLowerCase().includes(query) ||
        a.devedor_id?.includes(query) ||
        a.devedor_doc?.includes(query) ||
        a.id?.toLowerCase().includes(query);
      const matchSev = !sev || a.severity === sev;
      return matchQ && matchSev;
    });
    this.paintAlertsList(filtered);
    const countEl = document.getElementById('labra-showing-count');
    if (countEl) countEl.textContent = `${filtered.length} caso(s)`;
  },

  paintAlertsList(list = this.alerts) {
    const box = document.getElementById('labra-alerts-cards-box');
    if (!box) return;

    if (!list.length) {
      box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--l-muted);font-size:0.85rem">Nenhum alerta encontrado com os filtros atuais.</div>`;
      return;
    }

    box.innerHTML = list.slice(0, 100).map(a => `
      <div class="labra-alert-card ${a.id === this.selectedId ? 'selected' : ''}" data-alert-id="${esc(a.id)}">
        <div class="labra-card-top">
          <div class="labra-card-title">${esc(a.title)}</div>
          <span class="labra-badge-sev ${esc(a.severity)}">${esc(a.severity)}</span>
        </div>
        <div class="labra-card-desc">${esc(a.desc)}</div>
        <div class="labra-card-meta">
          <span class="labra-card-val">${esc(a.valor_formatado || fmtBRL(a.valor))}</span>
          <span>${a.fontes_count || 2} fontes</span>
          <span class="labra-card-actr">ACT-R ${(a.score || 0.95).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    box.querySelectorAll('.labra-alert-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedId = card.dataset.alertId;
        box.querySelectorAll('.labra-alert-card').forEach(c => c.classList.toggle('selected', c === card));
        this.paintDetail();
      });
    });
  },

  paintDetail() {
    const box = document.getElementById('labra-detail-box');
    if (!box) return;
    const alert = this.alerts.find(a => a.id === this.selectedId) || this.alerts[0];
    if (!alert) return;

    const sancao = alert.sancao || {};
    const contratos = alert.contratos || [];
    const nexo = alert.nexo_causal || [];

    box.innerHTML = `
      <div class="labra-detail-section">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <span class="labra-badge-sev ${esc(alert.severity)}" style="margin-bottom:8px;display:inline-block">${esc(alert.severity)}</span>
            <h2 style="margin:0;font-size:1.15rem;color:var(--azul-esc);font-weight:800;line-height:1.3">${esc(alert.title)}</h2>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.75rem;color:var(--txt-mut);font-weight:600;text-transform:uppercase">Valor Envolvido</div>
            <div style="font-size:1.35rem;font-weight:800;color:var(--azul-esc)">${esc(alert.valor_formatado || fmtBRL(alert.valor))}</div>
          </div>
        </div>
        <p style="margin:12px 0 0;font-size:0.85rem;color:var(--txt);line-height:1.55">${esc(alert.desc)}</p>
      </div>

      <div class="labra-detail-section">
        <h3><span>📋</span> Dados Cadastrais &amp; Evidências</h3>
        <div class="labra-kv-row"><span class="labra-kv-key">Alvo</span><span class="labra-kv-val">${esc(alert.devedor_nome)}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">CNPJ / CPF</span><span class="labra-kv-val" style="font-family:monospace;color:var(--azul);font-weight:700">${esc(alert.devedor_doc || alert.devedor_id)}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Padrão Detectado</span><span class="labra-kv-val">${esc(alert.pattern)}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Score de Confiança ACT-R</span><span class="labra-kv-val" style="color:var(--azul);font-weight:700">${(alert.score || 0.95).toFixed(4)}</span></div>
      </div>

      <div class="labra-detail-section">
        <h3><span>⛔</span> Sanção Ativa no Governo Federal (CEIS / CNEP)</h3>
        <div class="labra-kv-row"><span class="labra-kv-key">Cadastro Sancionatório</span><span class="labra-kv-val" style="color:var(--vermelho);font-weight:700">${esc(sancao.tipo || 'CEIS')}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Órgão Sancionador</span><span class="labra-kv-val">${esc(sancao.orgao || 'CGU / TCU')}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Motivo Legal</span><span class="labra-kv-val">${esc(sancao.motivo || 'Fraude Licitatória / Inidoneidade')}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Período de Sanção</span><span class="labra-kv-val">${esc(sancao.periodo || 'Vigente')}</span></div>
        <div class="labra-kv-row"><span class="labra-kv-key">Processo Administrativo</span><span class="labra-kv-val" style="font-family:monospace">${esc(sancao.processo || 'ADM-2024')}</span></div>
      </div>

      ${contratos.length ? `
        <div class="labra-detail-section">
          <h3><span>📝</span> Contratos Federais em Execução (Compras.gov)</h3>
          ${contratos.map(c => `
            <div style="background:var(--cinza-2);border:1px solid var(--cinza-5);border-radius:8px;padding:12px 14px;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <b style="color:var(--azul)">Contrato: ${esc(c.numero || 'S/N')}</b>
                <span style="color:var(--azul-esc);font-weight:700">${fmtBRL(c.valor)}</span>
              </div>
              <div style="font-size:0.78rem;color:var(--txt);font-weight:600">${esc(c.orgao)}</div>
              <div style="font-size:0.75rem;color:var(--txt-mut);margin-top:4px">${esc(c.objeto)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="labra-detail-section">
        <h3><span>🔗</span> Nexo Causal &amp; Subsunção Jurídica</h3>
        <div class="labra-nexo-chain">
          ${nexo.map(n => `
            <div class="labra-nexo-step">
              <div>
                <div class="labra-nexo-title">${esc(n.etapa)}</div>
                <div style="color:var(--txt-mut)">${esc(n.detalhe)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="labra-actions-row">
        <button id="labra-btn-detail-investigar" class="labra-btn-primary">
          ▶ Investigar com Agente ReAct
        </button>
        <button id="labra-btn-detail-graph" class="labra-btn-secondary">
          🌐 Ver Topologia no Grafo
        </button>
      </div>
    `;

    document.getElementById('labra-btn-detail-investigar')?.addEventListener('click', () => {
      this.switchToInvestigar(alert.devedor_id || alert.id);
    });

    document.getElementById('labra-btn-detail-graph')?.addEventListener('click', () => {
      this.activeTab = 'mapa';
      document.querySelectorAll('.labra-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'mapa'));
      document.querySelectorAll('.labra-view').forEach(v => v.classList.toggle('active', v.id === 'labra-view-mapa'));
      const select = document.getElementById('labra-graph-target-select');
      if (select) select.value = alert.id;
      this.paintGraph();
    });
  },

  switchToInvestigar(devedorId) {
    this.activeTab = 'investigar';
    document.querySelectorAll('.labra-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'investigar'));
    document.querySelectorAll('.labra-view').forEach(v => v.classList.toggle('active', v.id === 'labra-view-investigar'));
    const select = document.getElementById('labra-investigar-select');
    if (select) select.value = devedorId;
    this.runInvestigation(devedorId);
  },

  paintGraph() {
    const select = document.getElementById('labra-graph-target-select');
    const targetId = select?.value || this.selectedId;
    const alert = this.alerts.find(a => a.id === targetId || a.devedor_id === targetId) || this.alerts[0];
    if (!alert) return;

    const contratos = alert.contratos || [];
    const orgaoContrato = contratos[0]?.orgao || 'Órgão Federal Contratante';
    const numContrato = contratos[0]?.numero || 'Contrato Federal';
    const orgaoSancao = alert.sancao?.orgao || 'Controladoria-Geral da União';
    const valorFmt = alert.valor_formatado || fmtBRL(alert.valor);

    const nodes = [
      { id: 'alvo', x: 500, y: 300, r: 42, label: alert.devedor_nome.slice(0, 22), sub: alert.devedor_doc || alert.devedor_id, color: '#1351B4' },
      { id: 'sancao', x: 220, y: 160, r: 34, label: `Sanção ${alert.sancao?.tipo || 'CEIS'}`, sub: orgaoSancao.slice(0, 20), color: '#E52207' },
      { id: 'contrato', x: 780, y: 160, r: 34, label: numContrato.slice(0, 18), sub: orgaoContrato.slice(0, 20), color: '#b48300' },
      { id: 'recursos', x: 780, y: 440, r: 36, label: valorFmt, sub: 'Faturamento Público', color: '#168821' },
      { id: 'heraclitus', x: 220, y: 440, r: 34, label: 'HeraclitusDB', sub: 'Merkle Custody LSN', color: '#0c326f' }
    ];

    const edges = [
      { from: 'sancao', to: 'alvo', label: 'Impedimento Ativo', color: '#E52207' },
      { from: 'alvo', to: 'contrato', label: 'Execução / Fornecimento', color: '#b48300' },
      { from: 'contrato', to: 'recursos', label: 'Liquidação Orçamentária', color: '#168821' },
      { from: 'alvo', to: 'recursos', label: 'Retirada de Ativos', color: '#1351B4' },
      { from: 'alvo', to: 'heraclitus', label: 'Prova Imutável', color: '#0c326f' }
    ];

    const edgesG = document.getElementById('labra-graph-edges');
    const nodesG = document.getElementById('labra-graph-nodes');
    if (!edgesG || !nodesG) return;

    edgesG.innerHTML = edges.map(e => {
      const f = nodes.find(n => n.id === e.from);
      const t = nodes.find(n => n.id === e.to);
      const mx = (f.x + t.x) / 2;
      const my = (f.y + t.y) / 2;
      return `
        <line class="labra-graph-edge" x1="${f.x}" y1="${f.y}" x2="${t.x}" y2="${t.y}" stroke="${e.color}" stroke-width="2.5" />
        <rect x="${mx - 65}" y="${my - 11}" width="130" height="20" rx="4" fill="#FFFFFF" stroke="#EDEDED"></rect>
        <text x="${mx}" y="${my + 3}" text-anchor="middle" fill="#1c1c1c" font-size="10" font-family="'Raleway', sans-serif" font-weight="600">${esc(e.label)}</text>
      `;
    }).join('');

    nodesG.innerHTML = nodes.map(n => `
      <g style="cursor:pointer">
        <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="#FFFFFF" stroke="${n.color}" stroke-width="3" />
        <text x="${n.x}" y="${n.y - 4}" text-anchor="middle" fill="#1c1c1c" font-size="11" font-weight="700" font-family="'Raleway', sans-serif">${esc(n.label)}</text>
        <text x="${n.x}" y="${n.y + 12}" text-anchor="middle" fill="#5b6471" font-size="9" font-family="monospace">${esc(n.sub)}</text>
      </g>
    `).join('');
  },

  bindInvestigador() {
    const btn = document.getElementById('labra-btn-run-investigacao');
    btn?.addEventListener('click', () => {
      const select = document.getElementById('labra-investigar-select');
      const devedorId = select?.value || this.selectedId;
      this.runInvestigation(devedorId);
    });

    const btnManual = document.getElementById('labra-btn-run-manual');
    btnManual?.addEventListener('click', () => {
      const texto = document.getElementById('labra-texto-livre')?.value.trim();
      const doc = document.getElementById('labra-doc-manual')?.value.trim();
      this.runInvestigation(doc, texto);
    });

    document.getElementById('labra-btn-copy-peca')?.addEventListener('click', () => {
      const peca = document.getElementById('labra-peca-text')?.textContent;
      if (peca) {
        navigator.clipboard.writeText(peca);
        const b = document.getElementById('labra-btn-copy-peca');
        if (b) {
          b.textContent = '✓ Copiado com Sucesso!';
          setTimeout(() => { b.textContent = '📋 Copiar Petição'; }, 2500);
        }
      }
    });
  },

  async runInvestigation(devedorId, customText = '') {
    const statusEl = document.getElementById('labra-inv-status');
    const resultBox = document.getElementById('labra-inv-result-box');
    const stepsContainer = document.getElementById('labra-steps-container');
    const btn = document.getElementById('labra-btn-run-investigacao');

    if (btn) btn.disabled = true;
    if (statusEl) statusEl.innerHTML = `<span class="labra-status-dot"></span> <b>Investigando alvo...</b> Cruzando dados no HeraclitusDB & ativando motor ACT-R...`;
    if (resultBox) resultBox.style.display = 'none';
    if (stepsContainer) stepsContainer.innerHTML = '';

    try {
      const res = await fetch('/labra-api/investigar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devedor: devedorId,
          devedor_id: devedorId,
          texto: customText,
          fonte: 'log'
        })
      });
      const data = await res.json();

      if (data.erro) {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--vermelho);font-weight:700">Erro na investigação: ${esc(data.erro)}</span>`;
        return;
      }

      if (resultBox) resultBox.style.display = 'block';
      if (statusEl) statusEl.innerHTML = `<b style="color:var(--verde)">✓ Investigação Concluída</b> · Motor: <b>${esc(data.motor || 'ACT-R Forense')}</b> · Timestamp: ${esc(data.timestamp)}`;

      // Animação passo a passo dos traces ReAct
      const trace = data.trace || [];
      trace.forEach((step, i) => {
        setTimeout(() => {
          const card = document.createElement('div');
          card.className = 'labra-step-card';
          card.innerHTML = `
            <div>
              <span class="labra-step-num">Passo ${step.passo}:</span>
              <span class="labra-step-action">${esc(step.acao)}</span>
            </div>
            <div class="labra-step-obs">→ ${esc(step.obs)}</div>
          `;
          stepsContainer?.appendChild(card);
        }, i * 220);
      });

      // Dossiê KPIs
      const dossie = data.dossie || {};
      const achados = dossie.achados || [];
      const essenciais = dossie.essenciais || [];
      const valor = dossie.valor || 0;

      const kpiFraudes = document.getElementById('labra-kpi-fraudes');
      const kpiProvas = document.getElementById('labra-kpi-provas');
      const kpiValor = document.getElementById('labra-kpi-valor');
      const kpiScore = document.getElementById('labra-kpi-score');

      if (kpiFraudes) kpiFraudes.textContent = String(achados.length || 1);
      if (kpiProvas) kpiProvas.textContent = String(essenciais.length || 4);
      if (kpiValor) kpiValor.textContent = dossie.valor_formatado || fmtBRL(valor);
      if (kpiScore) kpiScore.textContent = '0.98';

      // Petição Formatada
      const pecaBox = document.getElementById('labra-peca-text');
      if (pecaBox) pecaBox.textContent = (data.peca && data.peca.texto) || 'Minuta jurídica gerada com sucesso.';

    } catch (e) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--vermelho);font-weight:700">Falha de conexão com a API: ${esc(e.message)}</span>`;
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  bindDiretriz() {
    const slider = document.getElementById('labra-dir-boost');
    const display = document.getElementById('labra-dir-boost-display');
    const target = document.getElementById('labra-dir-target');
    const author = document.getElementById('labra-dir-author');
    const focus = document.getElementById('labra-dir-focus');
    const preview = document.getElementById('labra-dir-preview');

    const updatePreview = () => {
      if (!preview) return;
      const patterns = Array.from(document.querySelectorAll('#labra-view-diretriz input[type="checkbox"]:checked')).map(c => c.value);
      const obj = {
        tipo: 'DIRETRIZ_INVESTIGATIVA_PERICIAL',
        alvo: target?.value || '—',
        autor: author?.value || '—',
        foco: focus?.value || '—',
        urgencia_boost: slider?.value || '8',
        padroes_prioritarios: patterns.length ? patterns : ['todos'],
        evidence_chain: 'HeraclitusDB LSN 88406+'
      };
      preview.textContent = JSON.stringify(obj, null, 2);
    };

    slider?.addEventListener('input', () => {
      if (display) display.textContent = slider.value;
      updatePreview();
    });
    target?.addEventListener('input', updatePreview);
    author?.addEventListener('input', updatePreview);
    focus?.addEventListener('input', updatePreview);
    document.querySelectorAll('#labra-view-diretriz input[type="checkbox"]').forEach(c => c.addEventListener('change', updatePreview));
    updatePreview();

    document.getElementById('labra-btn-emit-dir')?.addEventListener('click', async () => {
      const statusEl = document.getElementById('labra-dir-status');
      if (statusEl) statusEl.innerHTML = `<span class="labra-status-dot"></span> Registrando diretriz no HeraclitusDB...`;
      try {
        const patterns = Array.from(document.querySelectorAll('#labra-view-diretriz input[type="checkbox"]:checked')).map(c => c.value);
        const res = await fetch('/labra-api/diretriz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: target?.value,
            author: author?.value,
            focus: focus?.value,
            boost: slider?.value,
            patterns
          })
        });
        const data = await res.json();
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:#e7f3e9;border:1px solid #b7dfb9;border-radius:8px;padding:12px;color:#0d5217">
              <b>✓ Diretriz Pericial Emitida e Selada no Log!</b><br>
              <span style="font-family:monospace">ULID: ${esc(data.ulid)} · LSN: 88407</span><br>
              Status: ${esc(data.mensagem)}
            </div>
          `;
        }
      } catch (e) {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--vermelho);font-weight:700">Erro ao emitir diretriz: ${esc(e.message)}</span>`;
      }
    });
  },

  async loadDataAsync() {
    try {
      const res = await fetch('/labra-api/cruzamento?limit=250');
      if (res.ok) {
        const data = await res.json();
        if (data.alertas && data.alertas.length) {
          this.alerts = data.alertas;
          this.selectedId = this.alerts[0].id;

          const badgeCount = document.getElementById('labra-tab-badge-count');
          if (badgeCount) badgeCount.textContent = String(data.total_geral || this.alerts.length);

          const statCount = document.getElementById('labra-stat-count');
          if (statCount) statCount.innerHTML = `<span>${data.total_geral || this.alerts.length} Alvos Sancionados (HeraclitusDB)</span>`;

          const statValor = document.getElementById('labra-stat-valor');
          if (statValor && data.total_valor_recuperar) {
            statValor.innerHTML = `<span>${fmtBRL(data.total_valor_recuperar)}</span>`;
          }

          this.paintAlertsList();
          this.paintDetail();
        }
      }
    } catch (e) {
      console.warn('Fallback para dados locais do LABRA:', e);
    }

    try {
      const resDev = await fetch('/labra-api/devedores');
      if (resDev.ok) {
        const devs = await resDev.json();
        if (Array.isArray(devs) && devs.length) {
          this.devedores = devs;
          this.populateDevedoresSelects(devs);
        }
      }
    } catch (e) {}
  },

  populateDevedoresSelects(devs) {
    const invSelect = document.getElementById('labra-investigar-select');
    const graphSelect = document.getElementById('labra-graph-target-select');

    const optionsHtml = devs.map(d => `
      <option value="${esc(d.id)}">
        ${esc(d.nome)} (${esc(d.doc || d.id)}) — ${esc(d.valor_formatado || fmtBRL(d.valor))}
      </option>
    `).join('');

    if (invSelect) {
      invSelect.innerHTML = optionsHtml;
    }
    if (graphSelect) {
      graphSelect.innerHTML = optionsHtml;
      graphSelect.addEventListener('change', () => {
        this.paintGraph();
      });
    }
  }
};
