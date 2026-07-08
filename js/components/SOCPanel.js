export const SOCPanel = {
  render() {
    return `
      <section id="soc" class="on">
        <div class="secttl"><h2>Central de Comando</h2><span class="tag">SOC · tempo real</span></div>
        <p class="sub">Fluxo de eventos de firewalls, servidores, bancos, APIs e dispositivos de rede, com prova criptográfica na ingestão.</p>
        <div class="grid k4">
          <div class="kpi"><div class="lb">Eventos / segundo</div><div class="v" id="eps">—</div></div>
          <div class="kpi ok"><div class="lb">Eventos selados</div><div class="v" id="sealed">—</div></div>
          <div class="kpi warn"><div class="lb">Eventos suspeitos</div><div class="v" id="susp">—</div></div>
          <div class="kpi bad"><div class="lb">Incidentes ativos</div><div class="v" id="inc">—</div></div>
          <div class="kpi ok"><div class="lb">Integridade do log</div><div class="v" id="integ">—</div></div>
          <div class="kpi"><div class="lb">Último selo ICP-Brasil</div><div class="v" id="icp" style="font-size:18px">—</div></div>
          <div class="kpi ok"><div class="lb">Merkle Tree</div><div class="v" id="merk" style="font-size:18px">—</div></div>
          <div class="kpi"><div class="lb">Latência de ingestão</div><div class="v" id="lat">—<small> ms</small></div></div>
        </div>
        <div class="card">
          <h3>Mapa vivo da infraestrutura</h3>
          <!-- Ajustado background e borda para o padrão claro -->
          <div class="soc" style="background: #ffffff; border-color: var(--line);"><svg id="map" viewBox="0 0 880 300" style="width:100%;height:auto"></svg></div>
          <div class="legend"><span><i style="background:#41d160"></i>fluxo normal</span><span><i style="background:#FFCD07"></i>anomalia</span><span><i style="background:#ff5b4a"></i>ataque</span></div>
        </div>
        <div class="card"><h3>Eventos recentes</h3><table id="stream"><thead><tr><th>Hora</th><th>Origem</th><th>Tipo</th><th>Severidade</th><th>Hash (blake3)</th></tr></thead><tbody></tbody></table></div>
      </section>
    `;
  },
  init() {
    this.drawMap();
    this.drawStream();
    this.startPolling();
  },
  drawMap(hot = {}) {
    const base = [['Internet',60,150],['Firewall',200,150],['Roteador',200,60],['Servidor A',360,90],['Servidor B',360,210],['API',520,90],['Active Dir.',520,210],['Postgres',680,150],['Backup',820,150]];
    
    const icons = {
      'Internet': '🌐',
      'Firewall': '🧱',
      'Roteador': '📡',
      'Servidor A': '🖥️',
      'Servidor B': '🖥️',
      'API': '⚙️',
      'Active Dir.': '🔑',
      'Postgres': '🛢️',
      'Backup': '🔄'
    };

    const nodes = base.map(([n,x,y]) => [n,x,y,(hot[n] || '#41d160')]);
    const edges = [[0,1],[1,2],[1,3],[1,4],[3,5],[4,5],[3,6],[5,7],[6,7],[7,8]];
    let h = '';

    // Renderizar conexões com contraste adaptado para fundo branco
    edges.forEach(([a,b]) => {
      const c = nodes[b][3] === '#ff5b4a' || nodes[a][3] === '#ff5b4a' ? '#ff5b4a' : '#a2b4cd';
      h += `<line x1="${nodes[a][1]}" y1="${nodes[a][2]}" x2="${nodes[b][1]}" y2="${nodes[b][2]}" stroke="${c}" stroke-width="2" opacity=".8"/>`;
    });

    // Renderizar objetos
    nodes.forEach(([n,x,y,c]) => {
      const emoticon = icons[n] || '💻';
      h += `
        <!-- Base clara e brilho de status atrás do emoticon -->
        <circle cx="${x}" cy="${y}" r="16" fill="#f8f9fa" stroke="${c}" stroke-width="2" opacity="1"/>
        <circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${c}" stroke-width="2" opacity=".4">
          <animate attributeName="r" values="16;24;16" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Emoticon centralizado -->
        <text x="${x}" y="${y}" font-size="16" text-anchor="middle" dominant-baseline="central">${emoticon}</text>
        
        <!-- Identificador do Objeto alterado para Azul Escuro (var(--azul-esc)) para leitura no fundo branco -->
        <text x="${x}" y="${y+32}" fill="var(--azul-esc)" font-weight="600" font-size="11" text-anchor="middle" font-family="Arial">${n}</text>
      `;
    });

    $('#map').innerHTML = h;
  },
  drawStream() {
    const rows = [['09:41:02','187.* (BR)','VPN login','média','b3:9f2a…e71c'],['09:41:00','fw-01 Fortinet','regra violada','alta','b3:1d04…aa90'],['09:40:58','srv-B Linux','sudo escalou','alta','b3:77e1…3c2b'],['09:40:55','pg-prod','DELETE em users','crítica','b3:c0de…9911'],['09:40:51','srv-B','outbound 3GB','crítica','b3:beef…4420']];
    const sev = {'média':'y','alta':'y','crítica':'r','baixa':'g'};
    $('#stream tbody').innerHTML = rows.map(r => `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="pill ${sev[r[3]]||'b'}">${r[3]}</span></td><td class="mono">${r[4]}</td></tr>`).join('');
  },
  async startPolling() {
    const loadData = async () => {
      const base = localStorage.getItem('hera_api') || '/forensic/api';
      try {
        const r = await fetch(base + '/stats', { cache: 'no-store' });
        if (r.ok) {
          const s = await r.json();
          window.LIVE = true;
          $('#conn').className = 'conn live'; $('#connlbl').textContent = 'ao vivo · ' + base;
          if(s.head) { $('#sealed').textContent = fmt(s.head); }
          $('#integ').textContent = '100%';
        }
      } catch (e) {
        window.LIVE = false;
        $('#sealed').textContent = '4.231.880.114';
        $('#icp').textContent = 'hoje 09:14';
        $('#integ').textContent = '100%';
        $('#lat').innerHTML = '1.8 <small>ms</small>';
        $('#eps').textContent = fmt(18420);
        $('#merk').textContent = 'íntegra';
      }
    };
    loadData();
    setInterval(loadData, 4000);
  }
};