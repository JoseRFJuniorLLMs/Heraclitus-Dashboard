import { API, explicarFalha } from '../api.js';

/**
 * Fontes de ingestão — e o silêncio.
 *
 * Numa plataforma forense, **uma fonte que se cala é um incidente**. Pode ser
 * um serviço em baixo, um agente mal configurado — ou o atacante a desligar o
 * log antes de agir. É a funcionalidade mais básica de um SIEM, e não existia
 * aqui.
 *
 * A deteção é por comparação com o ritmo próprio de cada fonte: uma que
 * escrevia de minuto a minuto e está calada há uma hora é suspeita; uma que
 * escreve uma vez por dia, não. Um limiar único para todas produziria alarmes
 * falsos nas lentas e silêncio nas rápidas.
 *
 * Mostra também **retenção**: o registo mais antigo do log. Os dois lados
 * importam — o Marco Civil (12.965/2014) obriga a guardar registos de conexão
 * 1 ano e de aplicação 6 meses; a LGPD obriga a não guardar além do necessário.
 */

const SEM = '—';
/** Quantos períodos médios de silêncio antes de assinalar. */
const FATOR_SILENCIO = 5;

export const Fontes = {
  render() {
    return `
      <section id="fontes">
        <div class="secttl">
          <h2>Fontes de ingestão</h2>
          <span class="tag">quem escreve · quem se calou</span>
        </div>
        <p class="sub">
          Cada origem que escreve no log, com o seu ritmo próprio. Uma fonte em silêncio
          é assinalada — num sistema forense pode ser o atacante a desligar o registo.
        </p>

        <div class="grid k4">
          <div class="kpi ok">
            <div class="lb">Fontes ativas <span class="fonte">índice <code>_agent</code></span></div>
            <div class="v" id="fo-ativas">${SEM}</div>
          </div>
          <div class="kpi" id="fo-silencio-card">
            <div class="lb">Em silêncio</div>
            <div class="v" id="fo-silencio">${SEM}</div>
          </div>
          <div class="kpi">
            <div class="lb">Registo mais antigo <span class="fonte">retenção</span></div>
            <div class="v" id="fo-antigo" style="font-size:17px">${SEM}</div>
          </div>
          <div class="kpi">
            <div class="lb">Janela coberta</div>
            <div class="v" id="fo-janela" style="font-size:17px">${SEM}</div>
          </div>
        </div>

        <div class="card">
          <h3>Origens <span class="pill b" id="fo-selo">—</span>
            <button class="btn" id="fo-atualizar" style="float:right">Atualizar</button>
          </h3>
          <table id="fo-tab">
            <thead><tr>
              <th>Fonte</th><th>Eventos</th><th>Primeiro</th><th>Último</th>
              <th>Ritmo médio</th><th>Estado</th>
            </tr></thead>
            <tbody><tr><td colspan="6" class="vazio">A carregar…</td></tr></tbody>
          </table>
          <p class="nota">
            O ritmo médio é <em>janela ÷ eventos</em> — grosseiro, mas suficiente para
            distinguir uma fonte de minuto a minuto de uma diária. O silêncio é
            assinalado a partir de ${FATOR_SILENCIO}× esse intervalo.
          </p>
        </div>

        <div id="fo-aviso" class="aviso" role="alert" aria-live="polite" hidden></div>
      </section>
    `;
  },

  init() {
    const b = document.getElementById('fo-atualizar');
    if (b) b.onclick = () => this.carregar();
    this.carregar();
  },

  async carregar() {
    const corpo = document.querySelector('#fo-tab tbody');
    const selo = document.getElementById('fo-selo');
    if (!corpo) return;

    const r = await API.get('/fontes', { ms: 30000 });
    if (!r.ok) {
      const e = explicarFalha(r.falha, r.estado);
      selo.className = 'pill y';
      selo.textContent = 'indisponível';
      corpo.innerHTML = `<tr><td colspan="6" class="vazio">${esc(e.longo)}</td></tr>`;
      return;
    }

    const d = r.dados;
    const lista = d.fontes || [];
    const agora = Date.now();

    txt('fo-antigo', quando(d.mais_antigo_ms));
    txt('fo-janela', janela(d.mais_antigo_ms, d.mais_recente_ms));

    let silenciosas = 0;
    const linhas = lista.map((f) => {
      const span = (f.ultimo_ms || 0) - (f.primeiro_ms || 0);
      // Intervalo médio entre eventos desta fonte. Com um só evento não há
      // ritmo que estimar — e nesse caso não se assinala nada, porque não há
      // base para comparar.
      const intervalo = f.eventos > 1 && span > 0 ? span / (f.eventos - 1) : null;
      const parado = f.ultimo_ms ? agora - f.ultimo_ms : null;
      const mudo = intervalo !== null && parado !== null && parado > intervalo * FATOR_SILENCIO;
      if (mudo) silenciosas++;
      return { f, intervalo, parado, mudo };
    });

    txt('fo-ativas', String(lista.length - silenciosas));
    txt('fo-silencio', String(silenciosas));
    const card = document.getElementById('fo-silencio-card');
    if (card) card.className = silenciosas ? 'kpi bad' : 'kpi ok';

    selo.className = lista.length ? 'pill g' : 'pill b';
    selo.textContent = `${lista.length} fonte(s)`;

    corpo.innerHTML = linhas.length
      ? linhas
          .map(
            ({ f, intervalo, parado, mudo }) => `<tr>
              <td>${esc(f.agente)}</td>
              <td class="mono">${Number(f.eventos).toLocaleString('pt-BR')}</td>
              <td class="mono">${quando(f.primeiro_ms)}</td>
              <td class="mono">${quando(f.ultimo_ms)}</td>
              <td class="mono">${intervalo === null ? SEM : duracao(intervalo)}</td>
              <td>${
                mudo
                  ? `<span class="pill r">calada há ${duracao(parado)}</span>`
                  : intervalo === null
                    ? '<span class="pill b">evento único</span>'
                    : '<span class="pill g">a escrever</span>'
              }</td>
            </tr>`
          )
          .join('')
      : '<tr><td colspan="6" class="vazio">Nenhuma fonte indexada. Se o log tem eventos, o índice pode ser anterior ao campo <code>_agent</code> — um rebuild resolve.</td></tr>';

    const aviso = document.getElementById('fo-aviso');
    if (silenciosas > 0) {
      aviso.hidden = false;
      aviso.innerHTML =
        `<strong>${silenciosas} fonte(s) em silêncio.</strong> Uma origem que deixou de ` +
        'escrever pode ser um serviço em baixo, um agente mal configurado — ou registo ' +
        'a ser suprimido. Vale confirmar cada uma antes de assumir a explicação benigna.';
    } else {
      aviso.hidden = true;
    }
  },
};

const txt = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};
const esc = (s) =>
  String(s ?? '—').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const quando = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return SEM;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? SEM : d.toLocaleString('pt-BR');
};
const duracao = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return SEM;
  const s = ms / 1000;
  if (s < 90) return `${Math.round(s)}s`;
  const m = s / 60;
  if (m < 90) return `${Math.round(m)}min`;
  const h = m / 60;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
};
const janela = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b > a ? duracao(b - a) : SEM);
