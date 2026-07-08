export const CausalInvestigation = {
  render() {
    return `
      <section id="why">
        <div class="secttl"><h2>Investigação Causal</h2><span class="tag">WHY()</span></div>
        <p class="sub">Um clique substitui o cruzamento manual de logs: o sistema renderiza a cadeia de causalidade mínima do incidente.</p>
        <div class="card">
          <button class="btn" id="runWhyBtn">⌖ Encontrar causa raiz</button>
          <div class="flow" id="whyflow" style="margin-top:16px"></div>
        </div>
      </section>
    `;
  },
  init() {
    const whySteps = [{n:'Servidor caiu',k:'bad'},{n:'Banco indisponível',k:'bad'},{n:'Consulta lenta',k:'warn'},{n:'Índice removido',k:'warn'},{n:'Administrador X'},{n:'VPN'},{n:'IP 187.* '},{n:'País: —'}];
    $('#runWhyBtn').onclick = () => {
      $('#whyflow').innerHTML = whySteps.map((s, i) => `
        <div class="step ${s.k || ''}"><div class="n">${s.n}</div></div>
        ${i < whySteps.length - 1 ? '<div class="arrow">→</div>' : ''}
      `).join('');
    };
  }
};