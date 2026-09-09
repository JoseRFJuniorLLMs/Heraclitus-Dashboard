import { temporal } from '../temporal.js';
import { GOLDEN_DEMO } from '../demoData.js';

export const Diff = {
  render() {
    const a = temporal.range.a.lsn;
    const b = temporal.range.b.lsn;
    const diffData = GOLDEN_DEMO.getDiff(a, b);

    return `
      <section id="diff" class="view-section">
        <div class="secttl">
          <h2>Compare State A ↔ State B</h2>
          <span class="tag tag-primary">DIFERENÇA TEMPORAL</span>
        </div>
        <p class="sub">Comparação exata entre dois estados históricos da base de dados com classificação da semântica de alteração e encadeamento causal.</p>

        <!-- CABEÇALHO DUAL STATE -->
        <div class="diff-header-grid">
          <div class="state-card state-a">
            <span class="eyebrow">ESTADO A</span>
            <h3 class="font-mono">LSN ${a.toLocaleString('pt-BR')}</h3>
            <p class="muted font-mono">Hash: ${diffData.hashA}</p>
            <button id="btn-set-cur-a" class="btn-sm">Capturar Cursor Global em A</button>
          </div>

          <div class="diff-vs-badge">⇄</div>

          <div class="state-card state-b">
            <span class="eyebrow">ESTADO B</span>
            <h3 class="font-mono">LSN ${b.toLocaleString('pt-BR')}</h3>
            <p class="muted font-mono">Hash: ${diffData.hashB}</p>
            <button id="btn-set-cur-b" class="btn-sm">Capturar Cursor Global em B</button>
          </div>
        </div>

        <!-- RESUMO DE ALTERAÇÕES -->
        <div class="diff-summary-bar margin-top">
          <div class="sum-item created"><strong>+${diffData.summary.created}</strong> Criados</div>
          <div class="sum-item changed"><strong>~${diffData.summary.changed}</strong> Alterados</div>
          <div class="sum-item removed"><strong>-${diffData.summary.semanticRemoved}</strong> Remoções Semânticas</div>
          <div class="sum-item expired"><strong>!${diffData.summary.validityExpired}</strong> Expirações de Validade</div>
          <div class="sum-item superseded"><strong>↳${diffData.summary.superseded}</strong> Fatos Substituídos</div>
          <div class="sum-item shredded"><strong>🔒${diffData.summary.cryptoShredded}</strong> Crypto-Shredded</div>
        </div>

        <!-- LEGENDA SEMÂNTICA DE REMOÇÃO (SPEC §15) -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">⚖</span>
            <h2>Semântica de Remoção e Alteração</h2>
          </div>
          <div class="bd">
            <div class="semantic-legend-grid">
              <div class="sem-box sem-impossible">
                <strong>PHYSICAL DELETE</strong>
                <p>Impossível no log canônico append-only (o histórico físico nunca é apagado).</p>
              </div>
              <div class="sem-box sem-removal">
                <strong>SEMANTIC REMOVAL</strong>
                <p>Estado derivado desativou o elemento via tombstone ou ordem de revogação.</p>
              </div>
              <div class="sem-box sem-expired">
                <strong>VALIDITY EXPIRATION</strong>
                <p>Fato deixou de ser válido na dimensão de Valid Time no domínio do cliente.</p>
              </div>
              <div class="sem-box sem-superseded">
                <strong>SUPERSEDED FACT</strong>
                <p>Fato substituído por versão/afirmação mais recente recebida no log.</p>
              </div>
              <div class="sem-box sem-shredded">
                <strong>CRYPTO-SHREDDED</strong>
                <p>Dado criptograficamente triturado com remoção de chave (prova LGPD Art. 18).</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TABELA DETALHADA DE DIFERENÇAS COM WHY? -->
        <div class="card margin-top">
          <div class="hd">
            <span class="sec-ico">🔍</span>
            <h2>Diferenças de Estado A → B</h2>
          </div>
          <div class="bd scroll">
            <table>
              <thead>
                <tr>
                  <th>Alvo / Entidade</th>
                  <th>Tipo</th>
                  <th>Semântica da Alteração</th>
                  <th>Detalhes da Mudança</th>
                  <th>LSN de Origem</th>
                  <th>Evento Causal</th>
                  <th>Investigação</th>
                </tr>
              </thead>
              <tbody>
                ${diffData.items.map(item => `
                  <tr>
                    <td><code class="font-mono"><strong>${item.id}</strong></code></td>
                    <td><span class="badge b-sup">${item.type}</span></td>
                    <td><span class="badge ${this._getSemanticBadgeClass(item.change)}">${item.change}</span></td>
                    <td>${item.detail}</td>
                    <td class="num font-mono">${item.lsn.toLocaleString('pt-BR')}</td>
                    <td><code class="font-mono">${item.whyEvent}</code></td>
                    <td>
                      <button class="btn-sm btn-why" data-event="${item.whyEvent}" data-cause="${item.cause}">
                        [ Why? ] ➔
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- DRAWER DE INVESTIGAÇÃO CAUSAL (WHY?) -->
        <div id="why-drawer" class="drawer">
          <div class="drawer-header">
            <h3>Causal Chain (WHY Did This Change?)</h3>
            <button id="close-why-drawer" class="btn-close">✕</button>
          </div>
          <div class="drawer-body" id="why-drawer-body">
            <p class="muted">Clique em [ Why? ] em qualquer item da tabela para inspecionar a causa de origem.</p>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    this._bindEvents();
  },

  _bindEvents() {
    const btnA = document.getElementById('btn-set-cur-a');
    if (btnA) btnA.onclick = () => temporal.setRangeA(temporal.cursor.lsn);

    const btnB = document.getElementById('btn-set-cur-b');
    if (btnB) btnB.onclick = () => temporal.setRangeB(temporal.cursor.lsn);

    const whyBtns = document.querySelectorAll('.btn-why');
    whyBtns.forEach(btn => {
      btn.onclick = () => {
        const evtId = btn.dataset.event;
        const cause = btn.dataset.cause;
        const drawer = document.getElementById('why-drawer');
        const drawerBody = document.getElementById('why-drawer-body');
        if (drawer && drawerBody) {
          drawerBody.innerHTML = `
            <div class="why-waterfall">
              <h4>Cadeia Causal para o evento <code>${evtId}</code>:</h4>
              <div class="waterfall-step step-1">
                <span class="step-num">1</span>
                <div class="step-content">
                  <strong>Evento Ingestado no Log Canônico</strong>
                  <p class="font-mono">ID: ${evtId} (LSN 18,311,491)</p>
                </div>
              </div>
              <div class="waterfall-step step-2">
                <span class="step-num">2</span>
                <div class="step-content">
                  <strong>Causa de Origem Medida</strong>
                  <p>${cause}</p>
                </div>
              </div>
              <div class="waterfall-step step-3">
                <span class="step-num">3</span>
                <div class="step-content">
                  <strong>Resultado no Estado Derivado</strong>
                  <p>Mutação gravada com prova criptográfica Blake3 e carimbo de tempo.</p>
                </div>
              </div>
              <div class="margin-top">
                <button class="btn-primary" onclick="temporal.setCursor(18311491n, 'AS_OF_LSN')">Viajar para o LSN do Evento ➔</button>
              </div>
            </div>
          `;
          drawer.classList.add('open');
        }
      };
    });

    const closeWhy = document.getElementById('close-why-drawer');
    if (closeWhy) {
      closeWhy.onclick = () => {
        const drawer = document.getElementById('why-drawer');
        if (drawer) drawer.classList.remove('open');
      };
    }
  },

  _getSemanticBadgeClass(changeType) {
    switch (changeType) {
      case 'SEMANTIC_REMOVAL': return 'b-ext';
      case 'SUPERSEDED': return 'b-esp';
      case 'VALIDITY_EXPIRED': return 'b-anu';
      case 'CRYPTO_SHRED': return 'b-sup';
      default: return 'b-sup';
    }
  }
};
