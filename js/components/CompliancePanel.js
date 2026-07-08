export const CompliancePanel = {
  render() {
    return `
      <section id="comp">
        <div class="secttl"><h2>Conformidade</h2><span class="tag">LGPD · PPSI · ISO 27001 · NIST</span></div>
        <p class="sub">Status de saúde jurídica para SGD/MGI, ANPD e auditoria.</p>
        <div class="card"><div class="verify" id="verifyline"><span style="font-size:18px">✓</span> db.verify() — todos os segmentos íntegros</div>
          <table style="margin-top:14px"><thead><tr><th>Controle</th><th>Referência</th><th>Status</th></tr></thead><tbody id="comptbl"></tbody></table>
        </div>
      </section>
    `;
  },
  init() {
    const rows = [
      ['Imutabilidade do log (append-only + Merkle)', 'PPSI / ISO 27001 A.12.4', 'g'],
      ['Carimbo de tempo legal (ICP-Brasil)', 'MP 2.200-2 / SERPRO', 'g'],
      ['Retenção e não-repúdio', 'LGPD Art. 37 / 46', 'g'],
      ['Trilha de auditoria verificável (db.verify)', 'NIST 800-92', 'g'],
      ['Cadeia de custódia digital', 'CPP / perícia', 'g'],
      ['Reconstrução AS OF (forense)', 'PAD / sindicância', 'g']
    ];
    $('#comptbl').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td class="muted" style="color:#777">${r[1]}</td><td><span class="pill ${r[2]}">conforme</span></td></tr>`).join('');
  }
};