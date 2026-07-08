export const AttackGraph = {
  render() {
    return `
      <section id="graph">
        <div class="secttl"><h2>Grafo de Ataques</h2><span class="tag">engine de grafos</span></div>
        <p class="sub">Em vez de listas, relações. Cada ligação carrega probabilidade, evidências, score, origem, timestamp e proveniência.</p>
        <div class="card"><div class="soc"><svg id="attg" viewBox="0 0 880 320" style="width:100%;height:auto"></svg></div></div>
      </section>
    `;
  },
  init() {
    const ns = [['IP 187.*',70,160],['Firewall',200,160],['Servidor B',330,90],['Usuário svc-bkp',330,230],['Processo',470,160],['Postgres',610,90],['Tabela users',610,230],['Arquivo dump',780,160]];
    const es = [[0,1,.98],[1,2,.91],[2,4,.88],[3,4,.74],[4,5,.95],[5,6,.97],[6,7,.93]];
    let h = '';
    es.forEach(([a,b,p]) => { h += `<line x1="${ns[a][1]}" y1="${ns[a][2]}" x2="${ns[b][1]}" y2="${ns[b][2]}" stroke="#ff5b4a" stroke-width="2"/><text x="${(ns[a][1]+ns[b][1])/2}" y="${(ns[a][2]+ns[b][2])/2-6}" fill="#FFCD07" font-size="10" text-anchor="middle">${p}</text>`; });
    ns.forEach(([n,x,y]) => { h += `<rect x="${x-46}" y="${y-16}" width="92" height="32" rx="7" fill="#12264a" stroke="#ff5b4a"/><text x="${x}" y="${y+4}" fill="#cfe0ff" font-size="11" text-anchor="middle" font-family="Arial">${n}</text>`; });
    $('#attg').innerHTML = h;
  }
};