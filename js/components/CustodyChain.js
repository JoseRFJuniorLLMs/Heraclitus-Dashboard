export const CustodyChain = {
  render() {
    return `
      <section id="custody">
        <div class="secttl"><h2>Cadeia de Custódia Digital</h2><span class="tag">não-repúdio</span></div>
        <p class="sub">O ciclo de vida e a blindagem de cada registro, da captura à verificação.</p>
        <div class="card"><div class="flow" id="custflow"></div></div>
        <div class="card"><h3>Recibos de carimbo de tempo (ICP-Brasil via SERPRO)</h3>
          <table><thead><tr><th>Recibo</th><th>Merkle root</th><th>Carimbo</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td class="mono">TST-2026-44120</td><td class="mono">b3:9f2a…e71c</td><td>hoje 09:14</td><td><span class="pill g">verificado</span></td></tr>
            <tr><td class="mono">TST-2026-44119</td><td class="mono">b3:1d04…aa90</td><td>hoje 08:14</td><td><span class="pill g">verificado</span></td></tr>
            <tr><td class="mono">TST-2026-44118</td><td class="mono">b3:77e1…3c2b</td><td>hoje 07:14</td><td><span class="pill g">verificado</span></td></tr>
          </tbody></table>
        </div>
      </section>
    `;
  },
  init() {
    const custodySteps = [{n:'Captura do evento'},{n:'Geração do hash',h:'blake3'},{n:'Árvore Merkle'},{n:'Merkle Root'},{n:'Carimbo ICP-Brasil',h:'SERPRO'},{n:'Assinatura'},{n:'Verificado'}];
    $('#custflow').innerHTML = custodySteps.map((s, i) => `
      <div class="step"><div class="n">${s.n}</div>${s.h ? `<div class="t mono">${s.h}</div>` : ''}</div>
      ${i < custodySteps.length - 1 ? '<div class="arrow">→</div>' : ''}
    `).join('');
  }
};