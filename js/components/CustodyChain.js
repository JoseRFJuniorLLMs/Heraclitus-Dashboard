import { API, explicarFalha } from '../api.js';

/**
 * Cadeia de Custódia — real.
 *
 * A versão anterior mostrava três recibos de carimbo ICP-Brasil **inventados**
 * (`TST-2026-44120`, raiz Merkle falsa, estado "verificado"). Recibos de
 * carimbo são o artefacto probatório do produto: fabricá-los, marcá-los como
 * verificados e pô-los numa secção chamada "não-repúdio" é o oposto exato do
 * que a secção afirma.
 *
 * O que a substitui vem do `/state`, que o painel nunca chegou a usar: cada
 * segmento selado com a sua **raiz Merkle**, e o `/verify/:segment` para
 * verificar um a um. É o que se entrega a um auditor — e é verificável à
 * frente dele.
 *
 * O diagrama do ciclo de vida fica: é um diagrama conceptual, não afirma
 * estado sobre nada.
 */

const PASSOS = [
  { n: 'Captura do evento' },
  { n: 'Hash do registo', h: 'blake3' },
  { n: 'Árvore Merkle' },
  { n: 'Selagem do segmento', h: 'raiz no rodapé' },
  { n: 'Verificação', h: '/verify' },
];

export const CustodyChain = {
  render() {
    return `
      <section id="custody">
        <div class="secttl">
          <h2>Cadeia de Custódia</h2>
          <span class="tag">não-repúdio</span>
        </div>
        <p class="sub">
          O ciclo de vida de cada registo, da captura à verificação — e o estado real
          de cada segmento selado deste log.
        </p>

        <div class="card">
          <h3>Ciclo de vida <span class="tag tag-demo">diagrama</span></h3>
          <div class="flow" id="custflow"></div>
        </div>

        <div class="card">
          <h3>Segmentos selados <span class="pill b" id="cust-selo">—</span></h3>
          <p class="nota">
            Cada segmento fechado carrega no rodapé a raiz Merkle das suas folhas.
            Verificar relê e re-hasha o segmento e compara com a raiz gravada — se
            um único byte tiver mudado, não bate.
          </p>
          <table id="cust-segs">
            <thead><tr><th>Segmento</th><th>LSN</th><th>Raiz Merkle</th><th>Estado</th><th></th></tr></thead>
            <tbody><tr><td colspan="5" class="vazio">A carregar…</td></tr></tbody>
          </table>
        </div>

        <div class="card">
          <h3>Carimbo do tempo ICP-Brasil</h3>
          <div id="cust-icp" class="nota"></div>
        </div>

        <div id="cust-aviso" class="aviso" role="alert" aria-live="polite" hidden></div>
      </section>
    `;
  },

  init() {
    const fluxo = document.getElementById('custflow');
    if (fluxo) {
      fluxo.innerHTML = PASSOS.map(
        (s, i) =>
          `<div class="step"><div class="n">${s.n}</div>${s.h ? `<div class="t mono">${s.h}</div>` : ''}</div>` +
          (i < PASSOS.length - 1 ? '<div class="arrow">→</div>' : '')
      ).join('');
    }
    this.carregar();
  },

  async carregar() {
    const selo = document.getElementById('cust-selo');
    const corpo = document.querySelector('#cust-segs tbody');
    const icp = document.getElementById('cust-icp');
    if (!corpo) return;

    const r = await API.state();
    if (!r.ok) {
      const e = explicarFalha(r.falha, r.estado);
      selo.className = 'pill y';
      selo.textContent = 'indisponível';
      corpo.innerHTML = `<tr><td colspan="5" class="vazio">${esc(e.longo)}</td></tr>`;
      return;
    }

    const segs = r.dados.sealed_segments || [];
    selo.className = segs.length ? 'pill g' : 'pill b';
    selo.textContent = `${segs.length} selado(s)`;

    if (!segs.length) {
      // Zero selados NÃO é uma falha: um log jovem tem só o segmento ativo, que
      // por definição ainda não tem rodapé nem raiz. Dizê-lo evita que alguém
      // leia a tabela vazia como "a cadeia não existe".
      corpo.innerHTML =
        `<tr><td colspan="5" class="vazio">Nenhum segmento selado ainda — o log tem ` +
        `${r.dados.head_lsn} registo(s) no segmento ativo, que só ganha raiz Merkle ao fechar. ` +
        `Não é uma falha de integridade: é um log novo.</td></tr>`;
    } else {
      corpo.innerHTML = segs
        .map(
          (s) => `<tr data-seg="${esc(String(s.id))}">
            <td class="mono">#${esc(String(s.id))}</td>
            <td class="mono">${esc(String(s.base_lsn ?? '?'))}–${esc(String(s.max_lsn ?? '?'))}</td>
            <td class="mono" title="${esc(s.blake3_root || '')}">${curto(s.blake3_root)}</td>
            <td><span class="pill b" id="est-${esc(String(s.id))}">por verificar</span></td>
            <td><button class="btn" data-verificar="${esc(String(s.id))}">Verificar</button></td>
          </tr>`
        )
        .join('');
      corpo.querySelectorAll('[data-verificar]').forEach((b) => {
        b.onclick = () => this.verificarSegmento(b.dataset.verificar, b);
      });
    }

    // Watermarks: o atraso das views é um sinal operacional que o `/state` já
    // expõe e que nada mostrava. Uma view atrasada devolve estado velho às
    // consultas, sem erro nenhum a assinalá-lo.
    const w = r.dados.views || {};
    const atraso = (r.dados.head_lsn ?? 0) - (w.min_watermark ?? 0);
    icp.innerHTML =
      `<strong>Carimbo não configurado neste servidor.</strong> O daemon de conformidade ` +
      `(RFC 3161 / ICP-Brasil) existe mas está desligado — <code>compliance_enabled = false</code>. ` +
      `Enquanto assim for, a integridade é garantida pela cadeia Merkle acima, que prova ` +
      `<em>que não foi alterado</em>, mas não prova <em>quando</em> foi escrito perante terceiros.` +
      `<br><br><strong>Atraso das views:</strong> ${atraso} evento(s) atrás do log ` +
      `(head ${r.dados.head_lsn}, watermark ${w.min_watermark ?? '?'}). ` +
      (atraso > 100
        ? '<span class="pill y">as consultas podem devolver estado antigo</span>'
        : '<span class="pill g">em dia</span>');
  },

  async verificarSegmento(id, botao) {
    const est = document.getElementById(`est-${id}`);
    if (!est) return;
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    est.className = 'pill b';
    est.textContent = 'a verificar…';

    const r = await API.get(`/verify/${encodeURIComponent(id)}`, { ms: 120000 });
    botao.disabled = false;
    botao.removeAttribute('aria-busy');

    if (!r.ok) {
      est.className = 'pill y';
      est.textContent = explicarFalha(r.falha, r.estado).curto;
      return;
    }
    const d = r.dados || {};
    // Só se declara verificado com um sinal POSITIVO: a raiz recomputada tem de
    // bater com a gravada. Ausência de campos não é prova de nada.
    const bate =
      d.ok === true ||
      (typeof d.computed_root === 'string' &&
        typeof d.stored_root === 'string' &&
        d.computed_root === d.stored_root);
    if (bate) {
      est.className = 'pill g';
      est.textContent = 'íntegro';
    } else if (d.stored_root === null || d.stored_root === undefined) {
      est.className = 'pill b';
      est.textContent = 'sem raiz gravada';
      est.title = 'Segmento selado sem raiz no rodapé — não verificável, e não é falha.';
    } else {
      est.className = 'pill r';
      est.textContent = 'NÃO CONFERE';
    }
  },
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const curto = (h) => {
  if (!h) return '<span class="nota">sem raiz</span>';
  const s = String(h);
  return s.length > 18 ? esc(s.slice(0, 8)) + '…' + esc(s.slice(-6)) : esc(s);
};
