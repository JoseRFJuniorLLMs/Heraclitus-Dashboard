import { API, explicarFalha } from '../api.js';

/**
 * Diff histórico — o que mudou entre dois instantes do log.
 *
 * ## Porque é que um diff num log append-only não é o que parece
 *
 * A palavra "diff" faz esperar adições e **remoções**. Aqui não há remoções:
 * num log append-only nada é apagado, por isso a coluna "removido" não existe —
 * e inventá-la seria mentir sobre o que o sistema garante.
 *
 * O que existe são as duas perguntas que quem investiga faz de facto:
 *
 *  - **apareceu** — um valor cujo *primeiro* registo cai dentro da janela. Um
 *    IP, um utilizador, um comando que o sistema nunca tinha visto. É aqui que
 *    mora "esta máquina começou a falar com um destino novo às 03:14".
 *  - **calou-se** — um valor que estava a produzir eventos e parou. Numa
 *    plataforma forense isto pesa tanto como o resto: uma fonte que emudece
 *    pode ser o atacante a desligar o registo. Um SIEM que só sabe contar o que
 *    chega nunca vê o que deixou de chegar.
 *
 * ## Contra o quê se compara
 *
 * Cada janela é comparada com a **janela anterior de igual duração**, e essa
 * escolha não é decorativa. A definição ingénua de "calou-se" — *não apareceu
 * nesta janela* — é verdade sobre quase tudo num log com história: medido aqui,
 * numa janela de 24 h, 527 dos 561 valores "calaram-se" por esse critério. Um
 * número grande, alarmante, e sem informação nenhuma. Contra a janela anterior,
 * "calou-se" volta a significar o que a palavra promete: *estava a falar e
 * parou*.
 *
 * ## Campos quase-únicos
 *
 * Num campo onde cada evento traz um valor diferente — um `ts`, um `uuid`, uma
 * assinatura — "valor nunca antes visto" não é sinal nenhum: *todos* os valores
 * são novos, por construção. Somá-los à manchete enche-a de ruído (neste log,
 * 321 "valores novos" dos quais a esmagadora maioria eram carimbos de tempo).
 * Esses campos ficam **fora dos números do topo** e são marcados na lista, em
 * vez de silenciosamente descartados: quem lê tem de conseguir ver o que não
 * foi contado, e porquê.
 *
 * ## Ingestão, não ocorrência
 *
 * A janela é sobre o carimbo do `append` — quando o registo *entrou*. Não é
 * quando o facto aconteceu no mundo. Um lote importado ontem, de logs da semana
 * passada, cai na janela de ontem. O ecrã diz isto em vez de deixar alguém
 * concluir o contrário a partir de um eixo temporal com ar de verdade.
 */

const PRESETS = [
  { rot: '1 h', ms: 3_600_000 },
  { rot: '24 h', ms: 86_400_000 },
  { rot: '7 dias', ms: 604_800_000 },
  { rot: '30 dias', ms: 2_592_000_000 },
];

export const Diff = {
  ultimo: null,

  render() {
    return `
      <section id="diff">
        <div class="secttl">
          <h2>Comparar dois momentos</h2>
          <span class="tag">AS OF ↔ AS OF</span>
        </div>
        <p class="sub">
          O que existe agora que não existia antes — e o que existia e deixou de aparecer.
        </p>

        <div class="card">
          <h3>Janela</h3>
          <div class="kpi-acao" id="dz-presets">
            ${PRESETS.map(
              (p, i) =>
                `<button class="btn${i ? ' ghost' : ''}" data-janela="${p.ms}">últimas ${p.rot}</button>`
            ).join('')}
          </div>
          <div class="dz-lsn">
            <label>ou por LSN: de
              <input id="dz-de" type="number" min="0" step="1" inputmode="numeric" placeholder="0" />
            </label>
            <label>até
              <input id="dz-ate" type="number" min="0" step="1" inputmode="numeric" placeholder="head" />
            </label>
            <button class="btn ghost" id="dz-lsn-btn">Comparar</button>
          </div>
          <p class="nota" id="dz-janela">—</p>
        </div>

        <div class="grid k4">
          <div class="kpi">
            <div class="lb">Eventos na janela <span class="fonte"><code>/diff</code></span></div>
            <div class="v" id="dz-eventos">—</div>
          </div>
          <div class="kpi">
            <div class="lb">Valores nunca antes vistos</div>
            <div class="v" id="dz-novos">—</div>
            <p class="nota">primeiro registo na janela; sem campos quase-únicos</p>
          </div>
          <div class="kpi">
            <div class="lb">Valores que se calaram</div>
            <div class="v" id="dz-silencio">—</div>
            <p class="nota">ativos na janela anterior; zero nesta</p>
          </div>
          <div class="kpi">
            <div class="lb">Campos com atividade</div>
            <div class="v" id="dz-campos">—</div>
          </div>
        </div>

        <div class="card">
          <h3>Por campo</h3>
          <p class="nota">
            <strong>novo</strong> = o primeiro registo deste valor cai na janela.
            <strong>janela anterior</strong> = quantos eventos produziu na janela anterior de
            igual duração — é contra essa coluna que «calou-se» e «disparou» se medem.
          </p>
          <div id="dz-tabela"><p class="nota">Escolhe uma janela acima.</p></div>
        </div>

        <div class="card">
          <h3>Como ler isto</h3>
          <p class="nota">
            <strong>Não há coluna «removido»</strong> — e não é um esquecimento. O log é
            append-only: nada é apagado, por isso um diff aqui nunca pode mostrar uma
            remoção. O que substitui essa coluna é <em>calou-se</em>: o valor continua no
            registo, mas parou de produzir eventos.
          </p>
          <p class="nota">
            <strong>Tudo se compara com a janela anterior de igual duração.</strong> Sem esse
            termo de comparação, «calou-se» significaria apenas «não apareceu agora» — o que é
            verdade sobre quase todos os valores de um log com história, e por isso inútil.
            Medido neste log: numa janela de 24 h, 527 de 561 valores «calavam-se» por esse
            critério ingénuo. Contra a janela anterior, sobram os que de facto pararam.
          </p>
          <p class="nota">
            <strong>O tempo é o da ingestão</strong>, não o da ocorrência. A janela usa o
            carimbo do momento em que o registo entrou no log. Um lote importado hoje, de
            logs da semana passada, cai na janela de hoje. Para uma janela que não dependa
            de relógio nenhum, usa a comparação por LSN — é a forma que um auditor cita.
          </p>
        </div>

        <div id="dz-aviso" class="aviso" role="alert" aria-live="polite" hidden></div>
      </section>
    `;
  },

  init() {
    // Carregamento preguicoso: o diff percorre todas as chaves do indice, e
    // fazer isso no arranque penaliza quem nunca abre este ecra. Dispara na
    // primeira vez que a seccao e aberta, e nunca mais automaticamente — dai
    // em diante quem escolhe a janela e o utilizador.
    const entrada = document.querySelector('#nav a[data-s="diff"]');
    if (entrada) {
      entrada.addEventListener('click', () => {
        if (this.ultimo) return;
        this.carregar(`?de_ms=${Date.now() - 86_400_000}&topo=8`);
      });
    }

    document.querySelectorAll('#dz-presets [data-janela]').forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll('#dz-presets .btn').forEach((x) => x.classList.add('ghost'));
        b.classList.remove('ghost');
        this.carregar(`?de_ms=${Date.now() - Number(b.dataset.janela)}&topo=8`);
      };
    });
    const btn = document.getElementById('dz-lsn-btn');
    if (btn) {
      btn.onclick = () => {
        const de = document.getElementById('dz-de').value.trim();
        const ate = document.getElementById('dz-ate').value.trim();
        if (de === '' && ate === '') {
          this.aviso('Indica pelo menos um dos dois LSN, ou usa um dos botões de janela.');
          return;
        }
        document.querySelectorAll('#dz-presets .btn').forEach((x) => x.classList.add('ghost'));
        const p = new URLSearchParams({ topo: '8' });
        if (de !== '') p.set('de', de);
        if (ate !== '') p.set('ate', ate);
        this.carregar('?' + p);
      };
    }
  },

  async carregar(qs) {
    txt('dz-eventos', '…');
    const r = await API.get('/diff' + qs, { ms: 60000 });
    if (!r.ok) {
      ['dz-eventos', 'dz-novos', 'dz-silencio', 'dz-campos'].forEach((i) => txt(i, '—'));
      this.aviso(
        `<strong>Não foi possível comparar:</strong> ${esc(explicarFalha(r.falha, r.estado).longo)}`
      );
      return;
    }
    this.aviso(null);
    this.ultimo = r.dados;
    this.pintar(r.dados);
  },

  pintar(d) {
    const campos = d.campos || [];
    // Campos onde quase todo o evento traz um valor distinto (ts, uuid,
    // assinaturas): "valor novo" ali é uma tautologia, não um sinal. Ficam fora
    // das somas do topo — e o ecrã diz que ficaram, em vez de os apagar.
    const uteis = campos.filter((c) => !quaseUnico(c));
    const soma = (k) => uteis.reduce((a, c) => a + (c[k] || 0), 0);
    const ativos = campos.filter((c) => c.eventos > 0).length;
    const ignorados = campos.length - uteis.length;

    txt('dz-eventos', fmt(d.eventos || 0));
    txt('dz-novos', fmt(soma('valores_novos')));
    txt('dz-silencio', fmt(soma('valores_silenciosos')));
    txt('dz-campos', `${fmt(ativos)} de ${fmt(campos.length)}`);
    const nn = document.querySelector('#dz-novos')?.closest('.kpi')?.querySelector('.nota');
    if (nn) {
      nn.textContent = ignorados
        ? `primeiro registo na janela · ${ignorados} campo(s) quase-único(s) fora da conta`
        : 'primeiro registo dentro da janela';
    }

    const cs = document.getElementById('dz-silencio')?.closest('.kpi');
    if (cs) cs.className = soma('valores_silenciosos') > 0 ? 'kpi warn' : 'kpi';

    txt(
      'dz-janela',
      `LSN ${fmt(d.de)} → ${fmt(d.ate)} (head ${fmt(d.head)}) · ` +
        `${quando(d.de_ms)} → ${quando(d.ate_ms)} · tempo de ingestão · ` +
        `comparada com LSN ${fmt(d.anterior_de)} → ${fmt(d.anterior_ate)}`
    );
    const de = document.getElementById('dz-de');
    const ate = document.getElementById('dz-ate');
    if (de && ate) {
      de.value = d.de;
      ate.value = d.ate;
    }

    const alvo = document.getElementById('dz-tabela');
    if (!alvo) return;
    const comAtividade = campos.filter((c) => c.eventos > 0 || c.eventos_anterior > 0);
    if (!comAtividade.length) {
      alvo.innerHTML = '<p class="nota">Nenhum campo com atividade nesta janela.</p>';
      return;
    }

    alvo.innerHTML = comAtividade
      .map((c) => {
        const linhas = (c.topo || [])
          .filter((v) => v.eventos > 0 || v.anterior > 0)
          .map(
            (v) => `
              <tr>
                <td class="mono">${esc(corta(v.valor))}${
                  v.novo ? ' <span class="pill novo">novo</span>' : ''
                }</td>
                <td class="mono">${fmt(v.eventos)}</td>
                <td class="mono">${v.anterior ? fmt(v.anterior) : '—'}</td>
                <td class="mono">${variacao(v)}</td>
              </tr>`
          )
          .join('');
        return `
          <div class="dz-campo">
            <div class="dz-campo-h">
              <strong class="mono">${esc(c.campo)}</strong>
              ${
                quaseUnico(c)
                  ? '<span class="pill y" title="Quase um valor distinto por evento — ' +
                    '«valor novo» não distingue nada aqui, por isso este campo fica fora ' +
                    'dos totais do topo.">quase-único</span>'
                  : ''
              }
              <span class="nota">
                ${fmt(c.eventos)} evento(s) · ${fmt(c.eventos_anterior)} na anterior ·
                ${c.valores_novos ? `<span class="pill novo">${fmt(c.valores_novos)} novo(s)</span>` : 'sem valores novos'}
                ${
                  c.valores_silenciosos
                    ? ` · <span class="pill silencio">${fmt(c.valores_silenciosos)} calado(s)</span>`
                    : ''
                }
                · ${fmt(c.valores_total)} valores distintos no total
              </span>
            </div>
            ${
              linhas
                ? `<table><thead><tr><th>valor</th><th>na janela</th><th>janela anterior</th><th>variação</th></tr></thead><tbody>${linhas}</tbody></table>`
                : '<p class="nota">Nenhum valor ativo — só valores que se calaram.</p>'
            }
          </div>`;
      })
      .join('');
  },

  aviso(html) {
    const el = document.getElementById('dz-aviso');
    if (!el) return;
    if (!html) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = html;
  },
};

const txt = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
/**
 * Um campo onde quase todo o evento traz um valor diferente.
 *
 * O limiar (90 %) é uma escolha, não uma medição — mas a alternativa era pior:
 * sem ele, a manchete «valores nunca antes vistos» é dominada por carimbos de
 * tempo, e um operador lê 321 onde o sinal real era 6. Campos com poucos
 * eventos ficam de fora da regra: com 3 eventos e 3 valores, a razão é 1 sem
 * que isso diga o que quer que seja sobre o campo.
 */
const quaseUnico = (c) => (c.postings_total || 0) >= 20 && c.valores_total >= 0.9 * c.postings_total;
/**
 * Variação face à janela anterior.
 *
 * Sem base de comparação não há percentagem que se possa escrever: dividir por
 * zero dá infinito, e «+100%» ou «+∞%» seriam grandezas inventadas. Um valor que
 * não existia antes é **novo** — uma afirmação diferente, e mais forte, do que
 * qualquer percentagem.
 */
const variacao = (v) => {
  if (!v.anterior) return v.eventos ? '<span class="pill novo">novo</span>' : '—';
  if (!v.eventos) return '<span class="pill silencio">parou</span>';
  const p = Math.round(((v.eventos - v.anterior) / v.anterior) * 100);
  if (p === 0) return 'igual';
  return `<span class="pill ${p > 0 ? 'b' : 'y'}">${p > 0 ? '+' : ''}${fmt(p)}%</span>`;
};
const corta = (s) => (String(s).length > 56 ? String(s).slice(0, 55) + '…' : String(s));
const quando = (ms) =>
  ms ? new Date(Number(ms)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
