import { API, Falha, Ritmo, explicarFalha, ligarFluxo } from '../api.js';
import { Sparkline } from './Sparkline.js';

/**
 * Central de Comando.
 *
 * Princípio desta versão: **nenhum mostrador inventa um valor**. Cada um mostra
 * um número medido, ou um traço com a razão de não haver número. A versão
 * anterior preenchia todo o painel com valores de demonstração convincentes
 * (4.231.880.114 eventos, 1,8 ms de latência, Merkle "íntegra") sempre que a
 * ligação falhava — e a ligação falhava SEMPRE, porque o REST do HeraclitusDB
 * não envia cabeçalhos CORS e o browser bloqueia o pedido. O resultado era um
 * painel que nunca esteve ao vivo e cujo modo falso só se distinguia do real
 * por um selo pequeno no canto. Numa plataforma que se propõe transformar logs
 * em provas jurídicas, esse é o pior sítio possível para números fabricados.
 *
 * O que passou a ser real:
 *  - **Eventos / segundo** — derivado do `head` do `/stats`, que é monotónico:
 *    (head₂ − head₁)/Δt É a taxa de inserção, não uma estimativa;
 *  - **Eventos no log, memtable, índices, grafo** — campos do `/stats` que já
 *    existiam e nunca eram lidos;
 *  - **Latência** — passa a ser a da API, medida, em vez de "latência de
 *    ingestão" inventada;
 *  - **Integridade / Merkle** — só a pedido, via `/verify`, porque esse
 *    endpoint relê e re-hasha TODOS os segmentos. Pô-lo num temporizador seria
 *    martelar o servidor. Enquanto ninguém carrega, diz "não verificado" — que
 *    é a verdade, e é diferente de "100%".
 */

const SEM_FONTE = '—';
const POLL_MS = 1000;

export const SOCPanel = {
  ritmo: new Ritmo({ janelaMs: 5000, maxAmostras: 90 }),
  fluxo: null,
  linhas: [],
  ligado: false,

  render() {
    const semFonte = (titulo) =>
      `title="Sem origem de dados no servidor. ${titulo}" data-semfonte="1"`;

    return `
      <section id="soc" class="on">
        <div class="secttl">
          <h2>Central de Comando</h2>
          <span class="tag">SOC · tempo real</span>
        </div>
        <p class="sub">Fluxo de eventos de firewalls, servidores, bancos, APIs e dispositivos de rede, com prova criptográfica na ingestão.</p>

        <div id="aviso" class="aviso" hidden></div>

        <div class="grid k4">
          <div class="kpi hero">
            <div class="lb">Eventos / segundo <span class="fonte">medido do <code>/stats</code></span></div>
            <div class="v" id="eps">${SEM_FONTE}</div>
            ${Sparkline.render('spark-eps', { rotulo: 'taxa de inserção' })}
          </div>
          <div class="kpi ok">
            <div class="lb">Eventos no log <span class="fonte"><code>head</code></span></div>
            <div class="v" id="sealed">${SEM_FONTE}</div>
          </div>
          <div class="kpi">
            <div class="lb">Na memtable <span class="fonte"><code>memtable</code></span></div>
            <div class="v" id="memt">${SEM_FONTE}</div>
          </div>
          <div class="kpi">
            <div class="lb">Latência da API <span class="fonte">ida e volta</span></div>
            <div class="v" id="lat">${SEM_FONTE}</div>
          </div>

          <div class="kpi">
            <div class="lb">Índice vetorial <span class="fonte"><code>vector_indexed</code></span></div>
            <div class="v" id="ivec">${SEM_FONTE}</div>
          </div>
          <div class="kpi">
            <div class="lb">Índice de texto <span class="fonte"><code>text_indexed</code></span></div>
            <div class="v" id="itxt">${SEM_FONTE}</div>
          </div>
          <div class="kpi">
            <div class="lb">Nós do grafo <span class="fonte"><code>graph_nodes</code></span></div>
            <div class="v" id="ngraf">${SEM_FONTE}</div>
          </div>
          <div class="kpi">
            <div class="lb">Arestas temporais <span class="fonte"><code>tgraph_edges</code></span></div>
            <div class="v" id="earest">${SEM_FONTE}</div>
          </div>

          <div class="kpi span2" id="kpi-integ">
            <div class="lb">
              Integridade do log
              <span class="fonte">verificação Merkle a pedido</span>
            </div>
            <div class="v" id="integ" style="font-size:20px">não verificado</div>
            <div class="acao">
              <button class="btn" id="btn-verify">Verificar agora</button>
              <span class="nota" id="verify-nota">Relê e re-hasha todos os segmentos — pode demorar.</span>
            </div>
          </div>
          <div class="kpi" ${semFonte('Viria de uma regra de deteção sobre os eventos; ainda não existe.')}>
            <div class="lb">Eventos suspeitos</div>
            <div class="v">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Viria de um motor de correlação de incidentes; ainda não existe.')}>
            <div class="lb">Último selo ICP-Brasil</div>
            <div class="v" style="font-size:18px">${SEM_FONTE}</div>
          </div>
        </div>

        <div class="card">
          <h3>Mapa vivo da infraestrutura</h3>
          <div class="soc" style="background:#fff;border-color:var(--line)">
            <svg id="map" viewBox="0 0 880 300" style="width:100%;height:auto"></svg>
          </div>
          <div class="legend">
            <span><i style="background:#41d160"></i>fluxo normal</span>
            <span><i style="background:#FFCD07"></i>anomalia</span>
            <span><i style="background:#ff5b4a"></i>ataque</span>
            <span class="nota">Topologia ilustrativa — ainda não vem do servidor.</span>
          </div>
        </div>

        <div class="card">
          <h3>Eventos recentes <span class="pill b" id="fonte-fluxo">a ligar…</span></h3>
          <table id="stream">
            <thead><tr><th>Hora</th><th>LSN</th><th>Origem</th><th>Tipo</th><th>Bytes</th></tr></thead>
            <tbody><tr><td colspan="5" class="vazio">Sem fluxo ligado.</td></tr></tbody>
          </table>
        </div>
      </section>
    `;
  },

  init() {
    this.drawMap();
    Sparkline.init('spark-eps');

    const botao = document.getElementById('btn-verify');
    if (botao) botao.onclick = () => this.verificarIntegridade();

    this.sondar();
    setInterval(() => this.sondar(), POLL_MS);
    this.abrirFluxo();
  },

  // ── ligação ─────────────────────────────────────────────────────────────

  async sondar() {
    const r = await API.stats();
    if (!r.ok) return this.semLigacao(r);
    this.comLigacao(r.dados, r.latencia);
  },

  comLigacao(s, latencia) {
    if (!this.ligado) {
      this.ligado = true;
      window.LIVE = true;
      this.avisar(null);
      const conn = document.getElementById('conn');
      if (conn) {
        conn.className = 'conn live';
        document.getElementById('connlbl').textContent = 'ao vivo · ' + API.base();
      }
    }

    const taxa = this.ritmo.registar(s.head ?? 0);
    this.por('eps', taxa === null ? '…' : Math.round(taxa).toLocaleString('pt-BR'));
    Sparkline.update('spark-eps', this.ritmo.serie);

    this.por('sealed', num(s.head));
    this.por('memt', num(s.memtable));
    this.por('ivec', num(s.vector_indexed));
    this.por('itxt', num(s.text_indexed));
    this.por('ngraf', num(s.graph_nodes));
    this.por('earest', num(s.tgraph_edges));
    this.por('lat', `${latencia.toFixed(1)}<small> ms</small>`, true);
  },

  semLigacao(r) {
    if (this.ligado || this.ligado === false) {
      this.ligado = false;
      window.LIVE = false;
      const conn = document.getElementById('conn');
      if (conn) {
        conn.className = 'conn demo';
        document.getElementById('connlbl').textContent =
          explicarFalha(r.falha, r.estado).curto + ' · ' + API.base();
      }
    }
    this.ritmo.limpar();
    Sparkline.update('spark-eps', []);
    // Traços, não números plausíveis. Um painel sem ligação tem de PARECER
    // um painel sem ligação.
    for (const id of ['eps', 'sealed', 'memt', 'lat', 'ivec', 'itxt', 'ngraf', 'earest']) {
      this.por(id, SEM_FONTE);
    }
    const e = explicarFalha(r.falha, r.estado);
    this.avisar(
      `<strong>Sem dados ao vivo — ${e.curto}.</strong> ${e.longo}` +
        (r.falha === Falha.CORS
          ? ' <em>Nada abaixo é dado real: os mostradores ficam a traço de propósito.</em>'
          : '')
    );
  },

  avisar(html) {
    const el = document.getElementById('aviso');
    if (!el) return;
    if (!html) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = html;
  },

  // ── integridade, só a pedido ────────────────────────────────────────────

  async verificarIntegridade() {
    const alvo = document.getElementById('integ');
    const nota = document.getElementById('verify-nota');
    const botao = document.getElementById('btn-verify');
    const cartao = document.getElementById('kpi-integ');
    if (!alvo) return;

    botao.disabled = true;
    alvo.textContent = 'a verificar…';
    nota.textContent = 'A reler e re-hashar todos os segmentos.';
    cartao.className = 'kpi span2';

    const t0 = performance.now();
    const r = await API.verify();
    const seg = ((performance.now() - t0) / 1000).toFixed(1);
    botao.disabled = false;

    if (!r.ok) {
      const e = explicarFalha(r.falha, r.estado);
      alvo.textContent = 'não verificado';
      nota.textContent = `Falhou: ${e.curto}.`;
      cartao.className = 'kpi span2';
      return;
    }

    const d = r.dados || {};
    // O relatório traz por segmento se a raiz recomputada bate com a guardada.
    const ok = d.ok === true || d.merkle_ok === d.segments || d.corrupt === 0;
    alvo.textContent = ok ? 'íntegro' : 'FALHA DE INTEGRIDADE';
    cartao.className = ok ? 'kpi span2 ok' : 'kpi span2 bad';
    nota.textContent =
      `Verificado agora, em ${seg}s. ` +
      (d.segments !== undefined ? `${d.segments} segmentos, ${d.records ?? '?'} registos.` : '') +
      ' Vale para este instante, não para sempre.';
  },

  // ── fluxo de appends ────────────────────────────────────────────────────

  abrirFluxo() {
    const selo = document.getElementById('fonte-fluxo');
    this.fluxo = ligarFluxo({
      aoEvento: (ev) => this.novaLinha(ev),
      aoEstado: ({ estado, motivo }) => {
        if (!selo) return;
        if (estado === 'ligado') {
          selo.className = 'pill g';
          selo.textContent = 'ao vivo';
        } else if (estado === 'reconectando') {
          selo.className = 'pill y';
          selo.textContent = 'a reconectar';
        } else {
          selo.className = 'pill y';
          selo.textContent = 'indisponível';
          selo.title = motivo || '';
          const corpo = document.querySelector('#stream tbody');
          if (corpo) {
            corpo.innerHTML =
              `<tr><td colspan="5" class="vazio">${motivo || 'Fluxo indisponível.'}</td></tr>`;
          }
        }
      },
    });
  },

  novaLinha(ev) {
    this.linhas.unshift(ev);
    if (this.linhas.length > 50) this.linhas.pop();
    const corpo = document.querySelector('#stream tbody');
    if (!corpo) return;
    corpo.innerHTML = this.linhas
      .map(
        (e) => `<tr>
          <td class="mono">${hora(e.t)}</td>
          <td class="mono">${num(e.lsn)}</td>
          <td>${esc(e.agent_id)}</td>
          <td>${esc(e.kind)}</td>
          <td class="mono">${num(e.bytes)}</td>
        </tr>`
      )
      .join('');
  },

  // ── util ────────────────────────────────────────────────────────────────

  por(id, valor, html = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = valor;
    else el.textContent = valor;
  },

  drawMap(hot = {}) {
    const base = [
      ['Internet', 60, 150], ['Firewall', 200, 150], ['Roteador', 200, 60],
      ['Servidor A', 360, 90], ['Servidor B', 360, 210], ['API', 520, 90],
      ['Active Dir.', 520, 210], ['Postgres', 680, 150], ['Backup', 820, 150],
    ];
    const icons = {
      Internet: '🌐', Firewall: '🧱', Roteador: '📡', 'Servidor A': '🖥️',
      'Servidor B': '🖥️', API: '⚙️', 'Active Dir.': '🔑', Postgres: '🛢️', Backup: '🔄',
    };
    const nodes = base.map(([n, x, y]) => [n, x, y, hot[n] || '#41d160']);
    const edges = [[0,1],[1,2],[1,3],[1,4],[3,5],[4,5],[3,6],[5,7],[6,7],[7,8]];
    let h = '';
    edges.forEach(([a, b]) => {
      const c = nodes[b][3] === '#ff5b4a' || nodes[a][3] === '#ff5b4a' ? '#ff5b4a' : '#a2b4cd';
      h += `<line x1="${nodes[a][1]}" y1="${nodes[a][2]}" x2="${nodes[b][1]}" y2="${nodes[b][2]}" stroke="${c}" stroke-width="2" opacity=".8"/>`;
    });
    nodes.forEach(([n, x, y, c]) => {
      h += `
        <circle cx="${x}" cy="${y}" r="16" fill="#f8f9fa" stroke="${c}" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${c}" stroke-width="2" opacity=".4">
          <animate attributeName="r" values="16;24;16" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <text x="${x}" y="${y}" font-size="16" text-anchor="middle" dominant-baseline="central">${icons[n] || '💻'}</text>
        <text x="${x}" y="${y + 32}" fill="var(--azul-esc)" font-weight="600" font-size="11" text-anchor="middle" font-family="Arial">${n}</text>`;
    });
    const mapa = document.getElementById('map');
    if (mapa) mapa.innerHTML = h;
  },
};

const num = (v) => (v === undefined || v === null ? SEM_FONTE : Number(v).toLocaleString('pt-BR'));
const esc = (s) =>
  String(s ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const hora = (t) => {
  if (!t) return '—';
  const d = new Date(t);
  return isNaN(d) ? '—' : d.toLocaleTimeString('pt-BR', { hour12: false });
};
