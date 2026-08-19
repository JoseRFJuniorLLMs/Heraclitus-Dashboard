import { API, explicarFalha } from '../api.js';

/**
 * Modos: SOC · Investigação · Auditor.
 *
 * Não é um ecrã novo — é uma reorganização do que já existe. As mesmas secções,
 * agrupadas pelo que cada pessoa vem cá fazer:
 *
 *  - **SOC** — o analista de plantão: o que está a entrar, de onde, e se parou;
 *  - **Investigação** — o mergulho num caso: linha do tempo, grafo, causalidade;
 *  - **Auditor** — quem vem do TCU, da CGU ou da ANPD: proveniência, integridade,
 *    cadeia de custódia, dados pessoais.
 *
 * O modo Auditor existe porque a pergunta dele é diferente da do analista. O
 * analista pergunta *"o que está a acontecer?"*. O auditor pergunta
 * *"como é que vocês sabem, e conseguem provar que não foi reescrito depois?"*.
 * Misturar as duas coisas no mesmo ecrã serve mal as duas.
 *
 * ## O painel do Auditor
 *
 * Consolida as quatro perguntas que um órgão de controlo faz, todas com
 * resposta medida — nenhuma inventada:
 *
 *  1. o registo está íntegro?            → `/verify`
 *  2. consegue reconstruir o estado?     → `/replay`
 *  3. de onde vieram os dados?           → `/fontes`
 *  4. que dados pessoais existem?        → `/atributos`
 */

const MODOS = {
  soc: {
    rotulo: 'SOC',
    dica: 'Operação: o que está a entrar, de onde, e se parou.',
    seccoes: ['soc', 'fontes', 'exec'],
  },
  investigacao: {
    rotulo: 'Investigação',
    dica: 'Mergulho num caso: linha do tempo, grafo, causalidade.',
    seccoes: ['time', 'replay', 'graph', 'why', 'ia'],
  },
  auditor: {
    rotulo: 'Auditor',
    dica: 'Proveniência, integridade e dados pessoais — para TCU, CGU e ANPD.',
    seccoes: ['auditor', 'custody', 'titular', 'atributos', 'merkle', 'comp'],
  },
};

export const Modos = {
  atual: 'soc',

  barra() {
    return `
      <div class="modos" role="tablist" aria-label="Modo de trabalho">
        ${Object.entries(MODOS)
          .map(
            ([k, m]) =>
              `<button role="tab" class="modo${k === 'soc' ? ' on' : ''}" data-modo="${k}"
                       aria-selected="${k === 'soc'}" title="${m.dica}">${m.rotulo}</button>`
          )
          .join('')}
      </div>
    `;
  },

  /** A secção própria do modo Auditor. */
  render() {
    return `
      <section id="auditor">
        <div class="secttl">
          <h2>Painel do Auditor</h2>
          <span class="tag">TCU · CGU · ANPD</span>
        </div>
        <p class="sub">
          As quatro perguntas de um órgão de controlo, com resposta medida.
          Nenhum destes números é estimado.
        </p>

        <div class="grid k4">
          <div class="kpi" id="au-integ-card">
            <div class="lb">1. Registo íntegro? <span class="fonte"><code>/verify</code></span></div>
            <div class="v" id="au-integ" style="font-size:19px">não verificado</div>
            <div class="acao"><button class="btn" id="au-btn-integ">Verificar</button></div>
          </div>
          <div class="kpi" id="au-replay-card">
            <div class="lb">2. Reconstrói o estado? <span class="fonte"><code>/replay</code></span></div>
            <div class="v" id="au-replay" style="font-size:19px">não testado</div>
            <div class="acao"><button class="btn" id="au-btn-replay">Reconstruir</button></div>
          </div>
          <div class="kpi">
            <div class="lb">3. De onde vêm os dados? <span class="fonte"><code>/fontes</code></span></div>
            <div class="v" id="au-fontes">—</div>
          </div>
          <div class="kpi">
            <div class="lb">4. Dados pessoais <span class="fonte"><code>/atributos</code></span></div>
            <div class="v" id="au-pessoais">—</div>
          </div>
        </div>

        <div class="card">
          <h3>Impressão digital do estado</h3>
          <p class="nota">
            O <code>state_hash</code> resume o estado derivado (grafo, identidades,
            relações) construído a partir do log. <strong>Dois replays do mesmo log têm
            de produzir o mesmo hash</strong> — é o contrato de determinismo do sistema.
            Um auditor pode anotá-lo, reconstruir noutra máquina e comparar.
          </p>
          <div class="mono" id="au-hash" style="word-break:break-all;font-size:13px">—</div>
          <p class="nota" id="au-hash-nota"></p>
        </div>

        <div class="card">
          <h3>O que isto prova — e o que não prova</h3>
          <p class="nota">
            <strong>Prova:</strong> que o registo não foi alterado desde que foi escrito
            (cadeia Merkle), e que o estado apresentado deriva deterministicamente desse
            registo (replay). Ou seja: não é «o painel mostrou isto naquele dia», é
            «consigo reconstruir o que levou a esta conclusão».
          </p>
          <p class="nota">
            <strong>Não prova:</strong> <em>quando</em> foi escrito, perante terceiros.
            Isso exige carimbo do tempo de uma autoridade — RFC 3161 / ICP-Brasil — que
            existe neste sistema mas está <strong>desligado</strong> nesta instalação.
            Nem prova que o que foi registado corresponde ao que aconteceu no mundo:
            garante a integridade do registo, não a veracidade da origem.
          </p>
        </div>

        <div id="au-aviso" class="aviso" role="alert" aria-live="polite" hidden></div>
      </section>
    `;
  },

  init() {
    document.querySelectorAll('[data-modo]').forEach((b) => {
      b.onclick = () => this.trocar(b.dataset.modo);
    });
    const bi = document.getElementById('au-btn-integ');
    const br = document.getElementById('au-btn-replay');
    if (bi) bi.onclick = () => this.verificar();
    if (br) br.onclick = () => this.reconstruir();
    this.trocar('soc');
    this.resumo();
  },

  trocar(modo) {
    const m = MODOS[modo];
    if (!m) return;
    this.atual = modo;

    document.querySelectorAll('[data-modo]').forEach((b) => {
      const on = b.dataset.modo === modo;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });

    // Esconde as entradas de navegação fora do modo, em vez de as desativar:
    // um menu com metade das entradas mortas é pior do que um menu curto.
    let primeira = null;
    document.querySelectorAll('#nav a[data-s]').forEach((a) => {
      const dentro = m.seccoes.includes(a.dataset.s);
      a.style.display = dentro ? '' : 'none';
      if (dentro && !primeira) primeira = a;
    });
    document.querySelectorAll('#nav .grp').forEach((g) => {
      // Um grupo sem entradas visíveis não tem razão para ocupar espaço.
      let n = g.nextElementSibling;
      let algum = false;
      while (n && !n.classList.contains('grp')) {
        if (n.matches('a[data-s]') && n.style.display !== 'none') algum = true;
        n = n.nextElementSibling;
      }
      g.style.display = algum ? '' : 'none';
    });

    if (primeira) primeira.click();
    if (modo === 'auditor') this.resumo();
  },

  async resumo() {
    const [f, a, r] = await Promise.all([
      API.get('/fontes', { ms: 30000 }),
      API.get('/atributos', { ms: 30000 }),
      API.get('/replay', { ms: 15000 }),
    ]);

    if (f.ok) {
      const n = (f.dados.fontes || []).length;
      txt('au-fontes', `${n} fonte(s)`);
    }
    if (a.ok) {
      const campos = (a.dados.campos || []).filter((c) => c.campo !== '_agent');
      const ag = (a.dados.campos || []).find((c) => c.campo === '_agent');
      txt('au-pessoais', `${campos.length} campos · ${ag ? ag.valores_distintos : '?'} titulares`);
    }
    if (r.ok) {
      const h = r.dados.graph_state_hash || '';
      txt('au-hash', h || '—');
      txt(
        'au-hash-nota',
        `Estado no LSN ${r.dados.head ?? '?'}. Anote este valor: uma reconstrução ` +
          'independente do mesmo log tem de produzir exatamente o mesmo hash.'
      );
    }
  },

  async verificar() {
    const b = document.getElementById('au-btn-integ');
    const card = document.getElementById('au-integ-card');
    b.disabled = true;
    b.setAttribute('aria-busy', 'true');
    txt('au-integ', 'a verificar…');

    const r = await API.verify();
    b.disabled = false;
    b.removeAttribute('aria-busy');

    if (!r.ok) {
      const adulteracao = r.estado === 500 && !!r.corpo?.error;
      txt('au-integ', adulteracao ? 'FALHA' : 'não verificado');
      card.className = adulteracao ? 'kpi bad' : 'kpi';
      avisar(adulteracao ? `<strong>Falha de integridade:</strong> ${esc(r.corpo.error)}` : null);
      return;
    }
    const d = r.dados || {};
    const selados = Number(d.sealed);
    if (!Number.isFinite(selados) || selados === 0) {
      // Zero selados não é "íntegro": é "não havia nada para verificar".
      txt('au-integ', 'nada a verificar');
      card.className = 'kpi';
      avisar(
        `<strong>Nenhum segmento selado.</strong> A verificação Merkle só se aplica a ` +
          `segmentos fechados; este log tem ${d.records ?? '?'} registo(s) no segmento ativo. ` +
          'Não é uma falha — mas também não é um atestado.'
      );
      return;
    }
    const parcial = Number(d.sem_raiz || 0) > 0;
    txt('au-integ', parcial ? 'íntegro (parcial)' : 'íntegro');
    card.className = 'kpi ok';
    avisar(null);
  },

  async reconstruir() {
    const b = document.getElementById('au-btn-replay');
    const card = document.getElementById('au-replay-card');
    if (
      !confirm(
        'Reconstruir o estado a partir do LSN 0 e comparar.\n\n' +
          'É a prova de determinismo — mas relê o log inteiro e reconstrói as views ' +
          'vivas. Num log grande demora, e as consultas ficam mais lentas enquanto corre.\n\n' +
          'Continuar?'
      )
    ) {
      return;
    }
    b.disabled = true;
    b.setAttribute('aria-busy', 'true');
    txt('au-replay', 'a reconstruir…');

    const r = await API.get('/replay?executar=1', { ms: 600000 });
    b.disabled = false;
    b.removeAttribute('aria-busy');

    if (!r.ok) {
      txt('au-replay', 'falhou');
      card.className = 'kpi';
      avisar(`<strong>Reconstrução falhou:</strong> ${esc(explicarFalha(r.falha, r.estado).longo)}`);
      return;
    }
    const d = r.dados || {};
    if (d.ok === true) {
      txt('au-replay', 'determinista');
      card.className = 'kpi ok';
      avisar(
        `<strong>Estado reconstruído a partir do LSN 0 é idêntico</strong> ` +
          `(${(d.segundos || 0).toFixed(1)}s). O hash antes e depois bate: ` +
          `<code>${esc(String(d.hash_depois || '').slice(0, 16))}…</code>. ` +
          'Não é «o painel mostrou isto» — é «consigo reconstruir o que levou a esta conclusão».'
      );
      this.resumo();
    } else {
      txt('au-replay', 'DIVERGE');
      card.className = 'kpi bad';
      avisar(
        '<strong>A reconstrução NÃO reproduziu o estado.</strong> ' +
          `Antes <code>${esc(String(d.hash_antes || '').slice(0, 16))}…</code>, ` +
          `depois <code>${esc(String(d.hash_depois || '').slice(0, 16))}…</code>. ` +
          'Isto é um incidente: o estado apresentado não deriva deterministicamente do log.'
      );
    }
  },
};

const txt = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};
const avisar = (html) => {
  const el = document.getElementById('au-aviso');
  if (!el) return;
  if (!html) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = html;
};
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
