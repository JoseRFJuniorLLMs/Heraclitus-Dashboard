export const Navigation = {
  render() {
    return `
      <div class="grp">▣ Temporal Explorer</div>
      <a data-s="timeline" class="active"><span class="ic">⏱</span> Timeline & History River</a>
      <a data-s="state"><span class="ic">⚡</span> State Explorer (AS OF)</a>
      <a data-s="diff"><span class="ic">⇄</span> Compare A ↔ B</a>

      <div class="grp">◎ Investigation</div>
      <a data-s="graph"><span class="ic">⬡</span> Provenance Explorer</a>
      <a data-s="waterfall"><span class="ic">🌊</span> Causal Waterfall</a>
      <a data-s="custody"><span class="ic">🛡</span> Cadeia de Custódia</a>

      <div class="grp">▶ Reconstruction</div>
      <a data-s="replay"><span class="ic">▶</span> Replay Lab & Determinismo</a>

      <div class="grp">◆ Evidence & Integrity</div>
      <a data-s="merkle"><span class="ic">▦</span> Integrity & Merkle Proofs</a>

      <div class="grp">◇ Data & Engine</div>
      <a data-s="watermarks-view"><span class="ic">🌊</span> View Lag Watermarks</a>
      <a data-s="fontes"><span class="ic">◇</span> Sources & Gap Health</a>

      <div class="grp">⚡ Sentinel Lens</div>
      <a data-s="soc"><span class="ic">◉</span> Live Incident Lens</a>

      <div class="grp">⚙ System</div>
      <a data-s="exec"><span class="ic">▤</span> System Health & Stats</a>
    `;
  },
  init() {
    $$('#nav a').forEach(a => {
      a.onclick = () => {
        $$('#nav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        $$('.view-section').forEach(s => s.classList.remove('on'));
        const target = $('#' + a.dataset.s);
        if (target) target.classList.add('on');
      };
    });
  }
};