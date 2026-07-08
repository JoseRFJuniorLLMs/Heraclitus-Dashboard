export const Navigation = {
  render() {
    return `
      <div class="grp">Operação</div>
      <a data-s="soc" class="active"><span class="ic">◉</span> Central de Comando (SOC)</a>
      <a data-s="exec"><span class="ic">▤</span> Painel Executivo</a>
      <div class="grp">Investigação</div>
      <a data-s="time"><span class="ic">⏱</span> Linha do Tempo Forense</a>
      <a data-s="replay"><span class="ic">▶</span> Replay de Ataque</a>
      <a data-s="graph"><span class="ic">⬡</span> Grafo de Ataques</a>
      <a data-s="why"><span class="ic">⌖</span> Investigação Causal (WHY)</a>
      <div class="grp">Evidências</div>
      <a data-s="custody"><span class="ic">🛡</span> Cadeia de Custódia</a>
      <a data-s="merkle"><span class="ic">▦</span> Visualizador Merkle</a>
      <div class="grp">Governança</div>
      <a data-s="comp"><span class="ic">✓</span> Conformidade</a>
      <div class="grp">Inteligência</div>
      <a data-s="ia"><span class="ic">✦</span> IA Forense</a>
    `;
  },
  init() {
    $$('#nav a').forEach(a => {
      a.onclick = () => {
        $$('#nav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        $$('section').forEach(s => s.classList.remove('on'));
        $('#' + a.dataset.s).classList.add('on');
      };
    });
  }
};