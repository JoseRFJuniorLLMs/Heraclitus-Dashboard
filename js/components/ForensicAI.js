export const ForensicAI = {
  render() {
    return `
      <section id="ia">
        <div class="secttl"><h2>IA Forense</h2><span class="tag">grafo + vetor + texto</span></div>
        <p class="sub">A IA não consulta só logs — navega pelo grafo temporal, pela proveniência e pelas evidências criptográficas.</p>
        <div class="card">
          <div id="chat" style="min-height:120px;display:flex;flex-direction:column;gap:10px"></div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <input id="q" placeholder="Ex: Por que esse servidor ficou lento?" style="flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
            <button class="btn" id="askBtn">Perguntar</button>
          </div>
          <div style="margin-top:10px;font-size:12px;color:var(--muted)">Sugestões:
            <span class="pill b tag-suggest" style="cursor:pointer">Mostre os eventos desta invasão</span>
            <span class="pill b tag-suggest" style="cursor:pointer">Qual foi o primeiro evento da cadeia?</span>
            <span class="pill b tag-suggest" style="cursor:pointer">Existe padrão semelhante nos últimos 6 meses?</span>
          </div>
        </div>
      </section>
    `;
  },
  init() {
    const chat = $('#chat');
    const input = $('#q');

    const triggerAsk = (text) => {
      if (!text) return;
      chat.innerHTML += `<div style="align-self:flex-end;background:var(--azul);color:#fff;padding:8px 12px;border-radius:12px 12px 2px 12px;max-width:80%; text-align:right;">${text}</div>`;
      chat.innerHTML += `<div style="align-self:flex-start;background:#fff;border:1px solid var(--line);padding:10px 14px;border-radius:12px 12px 12px 2px;max-width:85%">Navegando pelo grafo temporal e pela proveniência… <b>3 eventos</b> contribuíram para a cadeia INC-2026-0012. Primeiro evento: <b class="mono">02:13 login VPN (IP 187.*)</b>. <span class="pill b">ver no grafo</span> <span class="pill b">abrir cadeia causal</span><br><small style="color:#888">Resposta ancorada em eventos selados e verificáveis (db.verify ✓).</small></div>`;
      input.value = '';
      chat.scrollTop = chat.scrollHeight;
    };

    $('#askBtn').onclick = () => triggerAsk(input.value.trim());
    $$('.tag-suggest').forEach(el => {
      el.onclick = () => triggerAsk(el.textContent);
    });
  }
};