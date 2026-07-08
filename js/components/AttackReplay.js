export const AttackReplay = {
  render() {
    return `
      <section id="replay">
        <div class="secttl"><h2>Replay de Ataque</h2><span class="tag">reconstituição</span></div>
        <p class="sub">Quando um incidente acontece, o sistema monta o replay automático. Cada passo tem hash, prova e cadeia causal.</p>
        <div class="card"><h3>INC-2026-0012 · acesso indevido a banco</h3>
          <div class="flow" id="replayflow"></div>
        </div>
      </section>
    `;
  },
  init() {
    const steps = [
      {t:'02:13', n:'Login VPN', h:'b3:9f2a…'},{t:'02:14', n:'Privilégio elevado', k:'warn', h:'b3:1d04…'},
      {t:'02:15', n:'Movimento lateral', k:'warn', h:'b3:77e1…'},{t:'02:16', n:'Banco acessado', k:'bad', h:'b3:c0de…'},
      {t:'02:17', n:'DELETE users', k:'bad', h:'b3:9911…'},{t:'02:18', n:'Exfiltração 3GB', k:'bad', h:'b3:beef…'}
    ];
    $('#replayflow').innerHTML = steps.map((s, i) => `
      <div class="step ${s.k || ''}"><div class="t">${s.t || ''}</div><div class="n">${s.n}</div>${s.h ? `<div class="t mono">${s.h}</div>` : ''}</div>
      ${i < steps.length - 1 ? '<div class="arrow">→</div>' : ''}
    `).join('');
  }
};