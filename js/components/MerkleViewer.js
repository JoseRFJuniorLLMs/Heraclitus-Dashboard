export const MerkleViewer = {
  render() {
    return `
      <section id="merkle">
        <div class="secttl"><h2>Visualizador Merkle</h2><span class="tag">blake3</span></div>
        <p class="sub">Árvore interativa: cada nó muda de cor quando validado. Uma violação no passado quebra a raiz na hora.</p>
        <div class="card"><div class="soc"><svg id="mtree" viewBox="0 0 880 280" style="width:100%;height:auto"></svg></div>
          <div style="margin-top:12px;display:flex;gap:10px">
            <button class="btn g" id="verifyTreeBtn">Verificar (db.verify)</button>
            <button class="btn ghost" id="simulateViolationBtn">Simular violação</button>
          </div>
        </div>
      </section>
    `;
  },
  init() {
    this.drawTree(true);
    $('#verifyTreeBtn').onclick = () => this.drawTree(true);
    $('#simulateViolationBtn').onclick = () => this.drawTree(false);
  },
  drawTree(TREEOK) {
    let h = '';
    const line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e3a64" stroke-width="2"/>`;
    const node = (x, y, t, ok, bad) => {
      const c = bad ? '#ff5b4a' : (ok ? '#41d160' : '#1e3a64');
      return `<rect x="${x-26}" y="${y-13}" width="52" height="26" rx="6" fill="#0e1f3d" stroke="${c}" stroke-width="2"/><circle cx="${x+18}" cy="${y-7}" r="3" fill="${c}"/><text x="${x-4}" y="${y+4}" fill="#cfe0ff" font-size="10" text-anchor="middle">${t}</text>`;
    };
    
    h += line(440, 40, 240, 110) + line(440, 40, 640, 110);
    [240, 640].forEach((p, i) => { const ch = i === 0 ? [140, 340] : [540, 740]; ch.forEach(c => h += line(p, 110, c, 180)); });
    const map = { 140: [80, 200], 340: [300, 420], 540: [520, 640], 740: [740, 840] };
    Object.entries(map).forEach(([p, ch]) => ch.forEach(c => h += line(+p, 180, c, 250)));
    
    h += node(440, 40, 'Root', TREEOK);
    [240, 640].forEach(p => h += node(p, 110, 'Seg', TREEOK));
    [140, 340, 540, 740].forEach(p => h += node(p, 180, 'Seg', TREEOK));
    
    const bad = !TREEOK ? 420 : -1;
    [80, 200, 300, 420, 520, 640, 740, 840].forEach(p => h += node(p, 250, 'Ev', TREEOK || p !== bad, p === bad));
    
    $('#mtree').innerHTML = h;
  }
};