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
  /** `null` = ainda nao sondado; evita anunciar falha antes da 1a tentativa. */
  ligado: null,

  render() {
    // A marca "sem fonte" era so um `::after` de CSS mais um `title`. Nenhum
    // dos dois chega a um leitor de ecra: o conteudo gerado por CSS nao e
    // anunciado de forma fiavel e o `title` e ignorado na maioria dos casos.
    // Quem usa leitor recebia o traco `—` sem qualquer razao para ele. Passa a
    // haver texto REAL no DOM, escondido visualmente mas lido.
    const semFonte = (titulo) =>
      `title="Sem origem de dados no servidor. ${titulo}" data-semfonte="1"`;
    const razao = (t) => `<span class="so-leitor">Sem origem de dados no servidor. ${t}</span>`;

    return `
      <section id="soc" class="on">
        <div class="secttl">
          <h2>Central de Comando</h2>
          <span class="tag">SOC · tempo real</span>
        </div>
        <p class="sub">Fluxo de eventos de firewalls, servidores, bancos, APIs e dispositivos de rede, com prova criptográfica na ingestão.</p>

        <div id="aviso" class="aviso" role="alert" aria-live="assertive" hidden></div>

        <div class="grid k4">
          <div class="kpi hero">
            <div class="lb">Eventos / segundo <span class="fonte">medido do <code>/stats</code></span></div>
            <div class="v" id="eps">${SEM_FONTE}</div>
            ${Sparkline.render('spark-eps', { rotulo: 'taxa de inserção' })}
            <div class="nota" id="eps-resumo" aria-live="polite"></div>
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
            <div class="lb">Eventos suspeitos ${razao('Viria de uma regra de deteção sobre os eventos; ainda não existe.')}</div>
            <div class="v">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Viria de um motor de correlação de incidentes; ainda não existe.')}>
            <div class="lb">Último selo ICP-Brasil ${razao('Viria de um motor de correlação de incidentes; ainda não existe.')}</div>
            <div class="v" style="font-size:18px">${SEM_FONTE}</div>
          </div>
        </div>

        <div class="card" data-ilustrativo="1">
          <h3>Topologia <span class="tag tag-demo">ilustrativa</span></h3>
          <p class="nota">
            Estas nove máquinas são um exemplo de arquitetura, <strong>não</strong> um
            inventário monitorizado. Nenhuma foi medida. Quando existir um endpoint de
            topologia, o mapa volta a ter estado — e aí as cores querem dizer alguma coisa.
          </p>
          <div class="soc" style="background:#fff;border-color:var(--line)">
            <svg id="map" viewBox="0 0 880 300" role="img"
                 aria-label="Diagrama ilustrativo de uma arquitetura de rede com nove componentes. Sem dados de estado."
                 style="width:100%;height:auto"></svg>
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

    // Mudar de servidor ou de credenciais tem de reabrir o fluxo. Sem isto, os
    // mostradores passavam a mostrar o servidor NOVO enquanto a tabela
    // continuava a receber eventos do ANTIGO — duas verdades no mesmo ecrã,
    // sem nada a assinalar qual era qual.
    document.addEventListener('hera:endpoint-mudou', () => {
      this.ritmo.limpar();
      Sparkline.update('spark-eps', []);
      this.linhas = [];
      this.desenharLinhas();
      this.marcarIntegridadeObsoleta('Servidor mudou — verificação anterior já não se aplica.');
      if (this.fluxo) this.fluxo.reabrir();
    });
  },

  /**
   * O veredicto de integridade é de um instante e de um servidor. Quando a
   * ligação cai ou o endpoint muda, deixá-lo a dizer "íntegro" a verde é
   * afirmar sobre algo que já não se está a observar.
   */
  marcarIntegridadeObsoleta(motivo) {
    const alvo = document.getElementById('integ');
    const nota = document.getElementById('verify-nota');
    const cartao = document.getElementById('kpi-integ');
    if (!alvo || alvo.textContent === 'não verificado') return;
    alvo.textContent = 'não verificado';
    if (cartao) cartao.className = 'kpi span2';
    if (nota) nota.textContent = motivo;
    document.dispatchEvent(new CustomEvent('hera:verify', { detail: { erro: motivo } }));
  },

  // ── ligação ─────────────────────────────────────────────────────────────

  /** Guarda contra sondagens sobrepostas — ver `sondar`. */
  sondando: false,

  async sondar() {
    // Sem esta guarda, uma sondagem lenta (o servidor a engasgar, a rede a
    // hesitar) ainda estava em voo quando a seguinte partia. As respostas
    // podiam chegar TROCADAS, e a mais antiga trazia um `head` menor: o
    // `Ritmo` lia isso como "log recriado" e apagava os 90 segundos de
    // histórico do sparkline. O sintoma era o gráfico a limpar-se sozinho de
    // vez em quando, sem nada no ecrã que o explicasse.
    if (this.sondando) return;
    this.sondando = true;
    try {
      const r = await API.stats();
      if (!r.ok) return this.semLigacao(r);
      this.comLigacao(r.dados, r.latencia);
    } finally {
      this.sondando = false;
    }
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

    // `s.head` cru, sem `?? 0`: um campo em falta viraria 0, que é MENOR que o
    // head anterior e disparava o reset de "log recriado", apagando o histórico
    // do sparkline por causa de uma resposta incompleta. O `Ritmo` ignora
    // valores não numéricos.
    const taxa = this.ritmo.registar(s.head);
    this.por('eps', taxa === null ? '…' : Math.round(taxa).toLocaleString('pt-BR'));
    Sparkline.update('spark-eps', this.ritmo.serie);
    // O sparkline so se lia com o ponteiro por cima. Um resumo textual da
    // serie deixa o minimo/maximo disponivel a quem navega por teclado ou usa
    // leitor de ecra — e a quem simplesmente nao quer andar a apontar.
    const vs = this.ritmo.serie.map((x) => (typeof x === 'number' ? x : x.v));
    const resumo = document.getElementById('eps-resumo');
    if (resumo) {
      resumo.textContent = vs.length
        ? `últimos ${vs.length}s: mín ${Math.round(Math.min(...vs))} · máx ${Math.round(Math.max(...vs))} ev/s`
        : '';
    }

    this.por('sealed', num(s.head));
    this.por('memt', num(s.memtable));
    this.por('ivec', num(s.vector_indexed));
    this.por('itxt', num(s.text_indexed));
    this.por('ngraf', num(s.graph_nodes));
    this.por('earest', num(s.tgraph_edges));
    this.por('lat', `${latencia.toFixed(1)}<small> ms</small>`, true);

    // O Painel Executivo escuta em vez de sondar por conta própria: dois
    // painéis a bater no mesmo endpoint em temporizadores independentes seria
    // o dobro do tráfego para exatamente o mesmo número.
    document.dispatchEvent(new CustomEvent('hera:stats', { detail: s }));
  },

  semLigacao(r) {
    // Só na TRANSIÇÃO. Antes estava `if (this.ligado || this.ligado === false)`,
    // que é sempre verdadeiro — reescrevia o selo e o aviso a cada segundo sem
    // nada ter mudado.
    if (this.ligado !== false) {
      this.ligado = false;
      window.LIVE = false;
      const conn = document.getElementById('conn');
      if (conn) {
        conn.className = 'conn demo';
        document.getElementById('connlbl').textContent =
          explicarFalha(r.falha, r.estado).curto + ' · ' + API.base();
      }
    }
    document.dispatchEvent(new CustomEvent('hera:sem-ligacao'));
    this.marcarIntegridadeObsoleta('Ligação perdida — a verificação anterior já não se aplica.');
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
    // Só reescreve se MUDOU. A região é `aria-live="assertive"`, portanto
    // qualquer alteração ao conteúdo faz o leitor de ecrã interromper o que
    // está a dizer e reanunciar. Reescrever a cada segundo — que era o que
    // acontecia — transformava o aviso numa metralhadora que tornava o painel
    // inutilizável para quem usa leitor. A guarda de transição no `semLigacao`
    // não chegava: o `avisar` era chamado fora dela.
    const novo = html || '';
    if (el.dataset.conteudo === novo) return;
    el.dataset.conteudo = novo;
    if (!novo) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = novo;
  },

  // ── integridade, só a pedido ────────────────────────────────────────────

  async verificarIntegridade() {
    const alvo = document.getElementById('integ');
    const nota = document.getElementById('verify-nota');
    const botao = document.getElementById('btn-verify');
    const cartao = document.getElementById('kpi-integ');
    // Guardas em TODOS, nao so no primeiro: se a marcacao mudar, o codigo
    // rebentava a meio de uma operacao que ja tinha sido lancada no servidor.
    if (!alvo || !nota || !botao || !cartao) return;

    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    alvo.textContent = 'a verificar…';
    nota.textContent = 'A reler e re-hashar todos os segmentos.';
    cartao.className = 'kpi span2';

    const t0 = performance.now();
    const r = await API.verify();
    const seg = ((performance.now() - t0) / 1000).toFixed(1);
    botao.disabled = false;
    botao.removeAttribute('aria-busy');
    // Devolver o foco: desativar o botao a meio descarta-o para o body, e quem
    // navega por teclado ficava sem saber onde estava.
    try { botao.focus({ preventScroll: true }); } catch { /* sem foco */ }

    const quando = new Date().toLocaleString('pt-BR');

    // ── falha ────────────────────────────────────────────────────────────
    // Uma raiz Merkle que não bate faz o `Log::verify` devolver `Err`, e o
    // servidor responde 500 com o motivo no corpo. É o caso mais importante
    // do produto inteiro: adulteração detectada.
    if (!r.ok) {
      const motivo = r.corpo?.error || explicarFalha(r.falha, r.estado).curto;
      const adulteracao = r.estado === 500 && !!r.corpo?.error;
      // Um TIMEOUT nao significa que o servidor parou: ele continua a reler e
      // re-hashar todos os segmentos. Reativar o botao convidava a cliques
      // repetidos que empilhavam verificacoes caras umas sobre as outras.
      if (r.falha === Falha.TIMEOUT) {
        botao.disabled = true;
        nota.textContent =
          'Excedeu o tempo de espera — mas o servidor CONTINUA a verificar. ' +
          'O botão fica bloqueado 2 min para não empilhar verificações.';
        setTimeout(() => { botao.disabled = false; }, 120000);
      }
      alvo.textContent = adulteracao ? 'FALHA DE INTEGRIDADE' : 'não verificado';
      cartao.className = adulteracao ? 'kpi span2 bad' : 'kpi span2';
      nota.textContent = motivo;
      document.dispatchEvent(
        new CustomEvent('hera:verify', {
          detail: adulteracao ? { ok: false, quando, detalhe: motivo } : { erro: motivo },
        })
      );
      return;
    }

    // ── sucesso ──────────────────────────────────────────────────────────
    // O contrato é `{ok, segments, sealed, records, merkle_ok, sem_raiz}`.
    // `segments` inclui o segmento ATIVO, que nunca está selado — comparar
    // `merkle_ok` com `segments` nunca dava verdadeiro e fazia o painel gritar
    // falha em bases perfeitamente sãs. Compara-se com `sealed`.
    const d = r.dados || {};
    const selados = Number(d.sealed);
    const verificados = Number(d.merkle_ok);
    const base = `${d.records ?? '?'} registos em ${d.segments ?? '?'} segmentos (1 ativo, por selar).`;

    if (!Number.isFinite(selados) || !Number.isFinite(verificados)) {
      // Servidor antigo, sem os campos novos. Não se inventa um veredicto.
      alvo.textContent = 'inconclusivo';
      cartao.className = 'kpi span2';
      nota.textContent =
        `Respondeu em ${seg}s mas sem os campos que decidem (sealed, merkle_ok). ` +
        'Servidor anterior à correção do contrato.';
      document.dispatchEvent(
        new CustomEvent('hera:verify', { detail: { erro: 'relatório sem veredicto' } })
      );
      return;
    }

    if (selados === 0) {
      // Nada selado ainda: não é falha, mas também não é atestado nenhum.
      // Dizer "íntegro" aqui seria declarar limpo aquilo que não se verificou.
      alvo.textContent = 'nada a verificar';
      cartao.className = 'kpi span2';
      nota.textContent =
        `${base} Nenhum segmento selado ainda — a verificação Merkle só se ` +
        'aplica a segmentos fechados. Sem selados, não há o que atestar.';
      document.dispatchEvent(
        new CustomEvent('hera:verify', { detail: { erro: 'nenhum segmento selado' } })
      );
      return;
    }

    const semRaiz = Number(d.sem_raiz ?? selados - verificados);
    const detalhe =
      semRaiz > 0
        ? `${verificados} de ${selados} segmentos selados conferem; ${semRaiz} sem raiz gravada.`
        : `${verificados} de ${selados} segmentos selados conferem.`;

    alvo.textContent = semRaiz > 0 ? 'íntegro (parcial)' : 'íntegro';
    cartao.className = 'kpi span2 ok';
    nota.textContent =
      `Verificado em ${seg}s. ${detalhe} ${base} ` +
      'Vale para este instante, não para sempre.';
    document.dispatchEvent(
      new CustomEvent('hera:verify', { detail: { ok: true, quando, detalhe } })
    );
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

  /** Pedido de desenho pendente — ver `novaLinha`. */
  pintar: null,

  novaLinha(ev) {
    this.linhas.unshift(ev);
    if (this.linhas.length > 50) this.linhas.pop();
    // Redesenhar a tabela inteira POR EVENTO era viável a 10 eventos/s e
    // suicida a 12 000: o separador bloqueava assim que uma ingestão a sério
    // começasse. Coalesce-se, portanto.
    //
    // Mas **não** com `requestAnimationFrame`, que foi a primeira tentativa:
    // um separador oculto não compõe frames, logo o rAF nunca dispara e a
    // tabela congela para SEMPRE enquanto os eventos continuam a entrar.
    // Medido: 50 eventos recebidos, pedido de desenho pendente, tabela ainda
    // no texto inicial. Um painel num segundo monitor adormecido, ou atrás de
    // outro separador, ficava parado sem nada a indicá-lo — e voltar a olhar
    // não o descongelava.
    //
    // `setTimeout` dispara em separadores ocultos (estrangulado para ~1/s, que
    // para uma tabela é de sobra) e coalesce igualmente bem.
    if (this.pintar) return;
    this.pintar = setTimeout(() => {
      this.pintar = null;
      this.desenharLinhas();
    }, 100);
  },

  desenharLinhas() {
    const corpo = document.querySelector('#stream tbody');
    if (!corpo) return;
    corpo.innerHTML = this.linhas
      .map((e) =>
        // O canal do servidor tem 4096 de folga; um cliente mais lento que a
        // ingestão fica para trás e o broadcast descarta. O servidor avisa com
        // `{saltados: n}` — e essa linha TEM de se ver. Uma tabela que salta
        // 200 mil eventos em silêncio mente sobre o que mostra.
        e.saltados !== undefined
          ? `<tr class="saltados"><td colspan="5">⚠ ${num(e.saltados)} eventos saltados —
               a ingestão está mais rápida do que este painel consegue acompanhar.</td></tr>`
          : `<tr>
              <td class="mono">${hora(e.t_ms)}</td>
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
    // Cinzento, sem verde e sem pulsar.
    //
    // O verde vinha por OMISSAO — `hot` esta sempre vazio porque nunca houve
    // fonte de estado — e a legenda ao lado dizia que verde e "fluxo normal".
    // Nove maquinas nomeadas (Postgres, Active Directory, Firewall), a pulsar,
    // todas verdes: quem olhava concluia que estavam a ser monitorizadas e
    // estavam bem. Num painel forense o verde nao e decoracao, e um veredicto —
    // e este era emitido sobre infraestrutura que nao existe.
    //
    // Pior: isto vivia dentro da Central de Comando, o unico painel que NAO
    // leva selo de demonstracao por ter mostradores reais. Conteudo fabricado
    // encostado a numeros medidos.
    const NEUTRO = '#8a94a6';
    const nodes = base.map(([n, x, y]) => [n, x, y, hot[n] || NEUTRO]);
    const edges = [[0,1],[1,2],[1,3],[1,4],[3,5],[4,5],[3,6],[5,7],[6,7],[7,8]];
    let h = '';
    edges.forEach(([a, b]) => {
      const c = '#c3cbd8';
      h += `<line x1="${nodes[a][1]}" y1="${nodes[a][2]}" x2="${nodes[b][1]}" y2="${nodes[b][2]}" stroke="${c}" stroke-width="2" opacity=".8"/>`;
    });
    nodes.forEach(([n, x, y, c]) => {
      h += `
        <circle cx="${x}" cy="${y}" r="16" fill="#f8f9fa" stroke="${c}" stroke-width="2"/>
        <text x="${x}" y="${y}" font-size="16" text-anchor="middle" dominant-baseline="central">${icons[n] || '💻'}</text>
        <text x="${x}" y="${y + 32}" fill="var(--muted)" font-weight="600" font-size="11" text-anchor="middle" font-family="Arial">${n}</text>`;
    });
    const mapa = document.getElementById('map');
    if (mapa) mapa.innerHTML = h;
  },
};

const num = (v) => (v === undefined || v === null ? SEM_FONTE : Number(v).toLocaleString('pt-BR'));
// Escapa tambem a aspa SIMPLES: os valores entram em template literals que
// podem acabar dentro de atributos, e `'` sozinho ja chega para escapar de um
// atributo delimitado por plicas. O `kind` vem de `EventKind::Custom(s)`, que
// nao e um conjunto fechado — o servidor aceita a string que o produtor mandar.
const esc = (s) =>
  String(s ?? '—').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
/**
 * O servidor envia `t_ms` — milissegundos desde a época, já extraídos do HLC
 * (`ts_hlc >> 16`). A conversão é feita no servidor porque o `>>` do JavaScript
 * é de 32 bits e truncava um HLC de 64.
 */
const hora = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR', { hour12: false });
};
