import { API, Falha, Ritmo, explicarFalha, ligarFluxo } from '../api.js';
import { Sparkline } from './Sparkline.js';

const SEM = '—';

/**
 * Heraclitus Sentinel / SOC.
 *
 * /stats comes from the shared RuntimeMonitor. The expensive live SSE stream is
 * opened only while this route is active. Sentinel is therefore a module, not
 * the hidden heartbeat of the whole dashboard.
 */
export const SOCPanel = {
  ritmo: new Ritmo({ janelaMs: 6000, maxAmostras: 90 }),
  fluxo: null,
  linhas: [],
  pintar: null,
  active: false,

  render() {
    return `
      <section id="soc">
        <div class="secttl">
          <h2>Sentinel / SOC</h2>
          <span class="tag">segurança operacional</span>
        </div>
        <p class="sub">Sinais reais do motor e fluxo de eventos enquanto esta superfície está aberta. Sem topologia fictícia, sem estado sintético.</p>

        <div id="aviso" class="aviso" role="alert" aria-live="polite" hidden></div>

        <div class="grid k4">
          <div class="kpi hero">
            <div class="lb">Eventos / segundo <span class="fonte">derivado de <code>/stats.head</code></span></div>
            <div class="v" id="eps">${SEM}</div>
            ${Sparkline.render('spark-eps', { rotulo: 'taxa de inserção' })}
            <div class="nota" id="eps-resumo" aria-live="polite"></div>
          </div>
          <div class="kpi"><div class="lb">Eventos no log <span class="fonte"><code>head</code></span></div><div class="v" id="sealed">${SEM}</div></div>
          <div class="kpi"><div class="lb">Memtable <span class="fonte"><code>memtable</code></span></div><div class="v" id="memt">${SEM}</div></div>
          <div class="kpi"><div class="lb">Latência Core <span class="fonte">ida e volta</span></div><div class="v" id="lat">${SEM}</div></div>
          <div class="kpi"><div class="lb">Índice vetorial</div><div class="v" id="ivec">${SEM}</div></div>
          <div class="kpi"><div class="lb">Índice de texto</div><div class="v" id="itxt">${SEM}</div></div>
          <div class="kpi"><div class="lb">Nós do grafo</div><div class="v" id="ngraf">${SEM}</div></div>
          <div class="kpi"><div class="lb">Arestas temporais</div><div class="v" id="earest">${SEM}</div></div>
        </div>

        <div class="card" id="kpi-integ">
          <div class="toolbar" style="justify-content:space-between">
            <div>
              <h3 style="margin-bottom:4px">Integridade do log</h3>
              <div class="nota" id="verify-nota">A verificação Merkle é explícita porque relê e re-hasha segmentos.</div>
            </div>
            <div class="toolbar">
              <strong id="integ">não verificado</strong>
              <button class="btn" id="btn-verify" type="button">Verificar agora</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="toolbar" style="justify-content:space-between">
            <div>
              <h3 style="margin-bottom:4px">Eventos recentes</h3>
              <div class="nota">O SSE existe somente enquanto esta tela estiver ativa.</div>
            </div>
            <span class="pill b" id="fonte-fluxo">pausado</span>
          </div>
          <div class="table-wrap">
            <table id="stream">
              <thead><tr><th>Hora</th><th>LSN</th><th>Origem</th><th>Tipo</th><th>Bytes</th></tr></thead>
              <tbody><tr><td colspan="5" class="vazio">Abra Sentinel para iniciar o fluxo.</td></tr></tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    Sparkline.init('spark-eps');
    document.getElementById('btn-verify')?.addEventListener('click', () => this.verificarIntegridade());
    document.addEventListener('hera:stats', event => this.comLigacao(event.detail || {}));
    document.addEventListener('hera:sem-ligacao', event => this.semLigacao(event.detail || {}));
    document.addEventListener('hera:route-changed', event => this.setActive(event.detail?.route === 'soc'));
    document.addEventListener('hera:endpoint-mudou', () => {
      this.ritmo.limpar();
      Sparkline.update('spark-eps', []);
      this.linhas = [];
      this.desenharLinhas();
      this.marcarIntegridadeObsoleta('Servidor mudou — a verificação anterior não se aplica.');
      if (this.active) this.reabrirFluxo();
    });

    // Navigation initializes before module listeners. Recover direct #soc loads.
    this.setActive(location.hash.slice(1) === 'soc');
  },

  setActive(active) {
    if (this.active === active) return;
    this.active = active;
    if (active) {
      this.abrirFluxo();
      return;
    }
    this.fecharFluxo();
  },

  comLigacao(stats) {
    this.avisar(null);
    const taxa = this.ritmo.registar(Number(stats.head));
    this.por('eps', taxa === null ? '…' : Math.round(taxa).toLocaleString('pt-BR'));
    Sparkline.update('spark-eps', this.ritmo.serie);

    const valores = this.ritmo.serie.map(item => typeof item === 'number' ? item : item.v).filter(Number.isFinite);
    const resumo = document.getElementById('eps-resumo');
    if (resumo) resumo.textContent = valores.length
      ? `janela recente: mín ${Math.round(Math.min(...valores))} · máx ${Math.round(Math.max(...valores))} ev/s`
      : '';

    this.por('sealed', num(stats.head));
    this.por('memt', num(stats.memtable));
    this.por('ivec', num(stats.vector_indexed));
    this.por('itxt', num(stats.text_indexed));
    this.por('ngraf', num(stats.graph_nodes));
    this.por('earest', num(stats.tgraph_edges));
    this.por('lat', Number.isFinite(Number(stats._latencia)) ? `${Number(stats._latencia).toFixed(1)} ms` : SEM);
  },

  semLigacao(response) {
    this.ritmo.limpar();
    Sparkline.update('spark-eps', []);
    for (const id of ['eps','sealed','memt','lat','ivec','itxt','ngraf','earest']) this.por(id, SEM);
    this.marcarIntegridadeObsoleta('Ligação perdida — a verificação anterior não se aplica.');
    const explicacao = response.explicacao || explicarFalha(response.falha, response.estado);
    this.avisar(`<strong>${esc(explicacao.curto)}.</strong> ${esc(explicacao.longo)}`);
  },

  avisar(html) {
    const el = document.getElementById('aviso');
    if (!el) return;
    const next = html || '';
    if (el.dataset.conteudo === next) return;
    el.dataset.conteudo = next;
    el.hidden = !next;
    el.innerHTML = next;
  },

  marcarIntegridadeObsoleta(motivo) {
    const alvo = document.getElementById('integ');
    const nota = document.getElementById('verify-nota');
    const cartao = document.getElementById('kpi-integ');
    if (!alvo || alvo.textContent === 'não verificado') return;
    alvo.textContent = 'não verificado';
    if (cartao) cartao.className = 'card';
    if (nota) nota.textContent = motivo;
    document.dispatchEvent(new CustomEvent('hera:verify', { detail: { erro: motivo } }));
  },

  async verificarIntegridade() {
    const alvo = document.getElementById('integ');
    const nota = document.getElementById('verify-nota');
    const botao = document.getElementById('btn-verify');
    const cartao = document.getElementById('kpi-integ');
    if (!alvo || !nota || !botao || !cartao) return;

    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    alvo.textContent = 'a verificar…';
    nota.textContent = 'A reler e re-hashar segmentos selados.';
    cartao.className = 'card';

    const started = performance.now();
    const response = await API.verify();
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    botao.disabled = false;
    botao.removeAttribute('aria-busy');

    const when = new Date().toLocaleString('pt-BR');
    if (!response.ok) {
      const reason = response.corpo?.error || explicarFalha(response.falha, response.estado).curto;
      const integrityFailure = response.estado === 500 && !!response.corpo?.error;
      if (response.falha === Falha.TIMEOUT) {
        botao.disabled = true;
        nota.textContent = 'Timeout do cliente. O servidor pode continuar a verificação; nova tentativa liberada em 2 min.';
        setTimeout(() => { botao.disabled = false; }, 120000);
      } else {
        nota.textContent = reason;
      }
      alvo.textContent = integrityFailure ? 'FALHA DE INTEGRIDADE' : 'não verificado';
      cartao.className = integrityFailure ? 'card verify bad' : 'card';
      document.dispatchEvent(new CustomEvent('hera:verify', {
        detail: integrityFailure ? { ok:false, quando:when, detalhe:reason } : { erro:reason }
      }));
      return;
    }

    const data = response.dados || {};
    const sealed = Number(data.sealed);
    const verified = Number(data.merkle_ok);
    if (!Number.isFinite(sealed) || !Number.isFinite(verified)) {
      alvo.textContent = 'inconclusivo';
      nota.textContent = `Resposta em ${seconds}s sem sealed/merkle_ok; nenhum veredicto foi inferido.`;
      document.dispatchEvent(new CustomEvent('hera:verify', { detail:{ erro:'relatório sem veredicto' } }));
      return;
    }
    if (sealed === 0) {
      alvo.textContent = 'nada a verificar';
      nota.textContent = 'Nenhum segmento selado. Isso não é falha e também não é atestado de integridade.';
      document.dispatchEvent(new CustomEvent('hera:verify', { detail:{ erro:'nenhum segmento selado' } }));
      return;
    }

    const withoutRoot = Number(data.sem_raiz ?? sealed - verified);
    const detail = withoutRoot > 0
      ? `${verified} de ${sealed} segmentos selados conferem; ${withoutRoot} sem raiz gravada.`
      : `${verified} de ${sealed} segmentos selados conferem.`;
    alvo.textContent = withoutRoot > 0 ? 'íntegro (parcial)' : 'íntegro';
    cartao.className = 'card verify good';
    nota.textContent = `Verificado em ${seconds}s. ${detail} Vale para o instante verificado.`;
    document.dispatchEvent(new CustomEvent('hera:verify', { detail:{ ok:true, quando:when, detalhe:detail } }));
  },

  abrirFluxo() {
    if (this.fluxo) return;
    const selo = document.getElementById('fonte-fluxo');
    if (selo) {
      selo.className = 'pill b';
      selo.textContent = 'a ligar…';
    }
    this.fluxo = ligarFluxo({
      aoEvento: event => this.novaLinha(event),
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
        }
      }
    });
  },

  fecharFluxo() {
    if (this.fluxo) this.fluxo.fechar();
    this.fluxo = null;
    const selo = document.getElementById('fonte-fluxo');
    if (selo) {
      selo.className = 'pill b';
      selo.textContent = 'pausado';
      selo.title = 'O stream só fica aberto enquanto Sentinel está ativo.';
    }
  },

  reabrirFluxo() {
    this.fecharFluxo();
    if (this.active) this.abrirFluxo();
  },

  novaLinha(event) {
    this.linhas.unshift(event);
    if (this.linhas.length > 50) this.linhas.pop();
    if (this.pintar) return;
    this.pintar = setTimeout(() => {
      this.pintar = null;
      this.desenharLinhas();
    }, 100);
  },

  desenharLinhas() {
    const corpo = document.querySelector('#stream tbody');
    if (!corpo) return;
    if (!this.linhas.length) {
      corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum evento recebido nesta sessão.</td></tr>';
      return;
    }
    corpo.innerHTML = this.linhas.map(event => event.saltados !== undefined
      ? `<tr class="saltados"><td colspan="5">${num(event.saltados)} eventos foram saltados porque a ingestão superou a capacidade visual desta tabela.</td></tr>`
      : `<tr>
          <td class="mono">${hora(event.t_ms)}</td>
          <td class="mono">${num(event.lsn)}</td>
          <td>${esc(event.agent_id)}</td>
          <td>${esc(event.kind)}</td>
          <td class="mono">${num(event.bytes)}</td>
        </tr>`
    ).join('');
  },

  por(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },
};

const num = value => value === undefined || value === null || Number.isNaN(Number(value))
  ? SEM
  : Number(value).toLocaleString('pt-BR');

const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

const hora = ms => {
  if (!Number.isFinite(ms) || ms <= 0) return SEM;
  const data = new Date(ms);
  return Number.isNaN(data.getTime()) ? SEM : data.toLocaleTimeString('pt-BR', { hour12:false });
};
