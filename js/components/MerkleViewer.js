import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const MerkleViewer = {
  render() {
    const lsnStr = temporal.cursor.lsn.toLocaleString('pt-BR');

    return `
      <section id="merkle" class="view-section">
        <div class="secttl">
          <h2>Integrity & Cryptographic Proofs</h2>
          <span class="tag tag-primary">PROVA CRIPTOGRÁFICA</span>
        </div>
        <p class="sub">Validação de integridade do log canônico, selagem de segmentos Merkle e carimbos de tempo ICP-Brasil (RFC 3161).</p>

        <!-- OPERAÇÃO VERIFY COMPLETA -->
        <div class="card">
          <div class="hd">
            <span class="sec-ico">▦</span>
            <h2>Verificação de Integridade de Segmentos</h2>
            <span class="tag">OPERAÇÃO A PEDIDO</span>
          </div>
          <div class="bd">
            <p>A verificação completa (<code>GET /verify</code>) relê e recalcula os hashes Blake3 de todos os segmentos selados. É uma operação intencional para auditorias.</p>
            <div class="verify-action-row margin-top">
              <button id="btn-run-full-verify" class="btn-primary">✓ Executar Verificação Completa do Log (db.verify)</button>
              <span id="verify-last-time" class="muted">Última verificação: 2026-09-08 17:41 UTC (Segmentos 1..124)</span>
            </div>

            <div id="verify-line-result" class="verify-line margin-top">
              <span class="verdict-ico">✓</span> <strong>db.verify()</strong> — Todos os segmentos selados estão íntegros e ancorados na raiz Merkle.
            </div>
          </div>
        </div>

        <!-- TIMELINE DE SEGMENTOS -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">📦</span>
            <h2>Segmentos do Log Canônico</h2>
          </div>
          <div class="bd">
            <div class="segments-grid">
              <div class="segment-card seg-verified">
                <span class="seg-num">SEGMENTO 118</span>
                <span class="seg-range font-mono">LSNs 17,500,000..18,000,000</span>
                <div class="seg-status"><span class="badge b-rem">VERIFIED + RFC3161</span></div>
                <div class="seg-hash font-mono">b3:1100aa22bb33cc44</div>
              </div>
              <div class="segment-card seg-verified">
                <span class="seg-num">SEGMENTO 119</span>
                <span class="seg-range font-mono">LSNs 18,000,001..18,200,000</span>
                <div class="seg-status"><span class="badge b-rem">VERIFIED</span></div>
                <div class="seg-hash font-mono">b3:4455dd66ee778899</div>
              </div>
              <div class="segment-card seg-verified">
                <span class="seg-num">SEGMENTO 120</span>
                <span class="seg-range font-mono">LSNs 18,200,001..18,400,000</span>
                <div class="seg-status"><span class="badge b-rem">VERIFIED</span></div>
                <div class="seg-hash font-mono">b3:9900112233445566</div>
              </div>
              <div class="segment-card seg-active">
                <span class="seg-num">SEGMENTO 121 (ATIVO)</span>
                <span class="seg-range font-mono">LSNs 18,400,001..HEAD</span>
                <div class="seg-status"><span class="badge b-esp">EM INGESTÃO / ATIVO</span></div>
                <div class="seg-hash font-mono">b3:9f2a87c114e05b76</div>
              </div>
            </div>
          </div>
        </div>

        <!-- VISUALIZADOR DE ÁRVORE MERKLE POR EVENTO -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">🌳</span>
            <h2>Prova de Inclusão Merkle por Evento (Per-Event Proof)</h2>
          </div>
          <div class="bd">
            <div class="proof-inspector-wrap">
              <div class="proof-input-row">
                <label>LSN do Evento:
                  <input id="proof-lsn-input" type="number" class="spine-input" value="${temporal.cursor.lsn.toString()}">
                </label>
                <button id="btn-fetch-proof" class="btn-primary">Gerar Prova de Inclusão ➔</button>
              </div>

              <div id="proof-result-box" class="proof-result margin-top">
                <h4>Caminho de Prova Merkle (Inclusion Proof Path):</h4>
                <div class="merkle-tree-svg">
                  <svg width="100%" height="220" viewBox="0 0 600 220">
                    <line x1="300" y1="30" x2="180" y2="90" stroke="#1351B4" stroke-width="2"/>
                    <line x1="300" y1="30" x2="420" y2="90" stroke="#1351B4" stroke-width="2"/>
                    <line x1="180" y1="90" x2="110" y2="150" stroke="#1351B4" stroke-width="2"/>
                    <line x1="180" y1="90" x2="250" y2="150" stroke="#1351B4" stroke-width="2"/>

                    <!-- Root -->
                    <g transform="translate(300, 30)">
                      <rect x="-50" y="-15" width="100" height="30" rx="6" fill="#071D41" stroke="#168821" stroke-width="2"/>
                      <text x="0" y="4" fill="#fff" font-size="10" text-anchor="middle">Merkle Root</text>
                    </g>
                    <!-- Node L -->
                    <g transform="translate(180, 90)">
                      <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#12264a" stroke="#1351B4" stroke-width="2"/>
                      <text x="0" y="4" fill="#cfe0ff" font-size="9" text-anchor="middle">Hash L1</text>
                    </g>
                    <!-- Node R -->
                    <g transform="translate(420, 90)">
                      <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#12264a" stroke="#1351B4" stroke-width="2"/>
                      <text x="0" y="4" fill="#cfe0ff" font-size="9" text-anchor="middle">Hash R1</text>
                    </g>
                    <!-- Leaf Target -->
                    <g transform="translate(110, 150)">
                      <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#168821" stroke="#fff" stroke-width="2"/>
                      <text x="0" y="4" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle">Event Leaf</text>
                    </g>
                  </svg>
                </div>

                <div class="proof-actions">
                  <button id="btn-copy-proof-json" class="btn-out">Copiar Prova JSON</button>
                  <button id="btn-download-proof" class="btn-out">Baixar Recibo de Evidência (.json)</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RFC 3161 / ICP-BRASIL TIMESTAMP -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">🛡</span>
            <h2>Carimbo de Tempo Legal (RFC 3161 / ICP-Brasil / SERPRO)</h2>
          </div>
          <div class="bd">
            <div class="rfc-chain">
              <div class="rfc-step">EVENT LOG ➔</div>
              <div class="rfc-step">MERKLE ROOT ➔</div>
              <div class="rfc-step">RFC3161 IMPRINT ➔</div>
              <div class="rfc-step">TSA RESPONSE (SERPRO) ➔</div>
              <div class="rfc-step certified">ICP-BRASIL CERTIFIED</div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this._bindEvents();
  },

  _bindEvents() {
    const btnVerify = document.getElementById('btn-run-full-verify');
    if (btnVerify) {
      btnVerify.onclick = () => {
        btnVerify.textContent = 'Relendo e verificando todos os segmentos...';
        setTimeout(() => {
          btnVerify.textContent = '✓ Executar Verificação Completa do Log (db.verify)';
          const res = document.getElementById('verify-line-result');
          if (res) {
            res.innerHTML = `<span class="verdict-ico">✓</span> <strong>db.verify() OK</strong> — Re-hash completo concluído em 42ms. 124 segmentos 100% íntegros.`;
          }
        }, 800);
      };
    }

    const btnProof = document.getElementById('btn-fetch-proof');
    if (btnProof) {
      btnProof.onclick = () => {
        btnProof.textContent = 'Gerando prova...';
        setTimeout(() => btnProof.textContent = 'Gerar Prova de Inclusão ➔', 300);
      };
    }
  }
};