/**
 * Sparkline da taxa de inserção.
 *
 * Série única, portanto **sem legenda** — o título do cartão nomeia-a. Cor:
 * `--azul` (#1351B4) do DSgov, que valida contra fundo branco (contraste ~7:1).
 *
 * Nota de cor, medida e não estimada: o amarelo do DSgov (#FFCD07) **reprova**
 * como cor de marca sobre branco — luminosidade 0,867, fora da banda, e
 * contraste de 1,5:1. Serve como fundo com texto escuro por cima (é o que a
 * classe `.pill.y` faz), nunca como traço ou ponto isolado num cartão claro.
 * Por isso a série é azul e os estados usam pílulas com texto, não pontos de cor.
 *
 * O traço mantém 2px reais em qualquer largura via `vector-effect`, já que o
 * `preserveAspectRatio="none"` estica o viewBox horizontalmente.
 */

const L = 240; // largura do viewBox
const A = 48; // altura do viewBox
const PAD = 3; // folga vertical para o ponto final não ficar cortado

export const Sparkline = {
  /** Marcação inicial. `id` identifica esta instância no DOM. */
  render(id, { rotulo = 'taxa de inserção' } = {}) {
    return `
      <div class="spark" id="${id}-wrap">
        <svg id="${id}" viewBox="0 0 ${L} ${A}" preserveAspectRatio="none"
             role="img" aria-label="${rotulo}: sem dados"
             style="width:100%;height:48px;display:block;overflow:visible">
          <path id="${id}-area" fill="var(--azul)" fill-opacity=".10" d=""/>
          <path id="${id}-linha" fill="none" stroke="var(--azul)" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round"
                vector-effect="non-scaling-stroke" d=""/>
          <line id="${id}-cruz" y1="0" y2="${A}" stroke="var(--azul-esc)" stroke-width="1"
                stroke-dasharray="3 3" vector-effect="non-scaling-stroke" opacity="0"/>
          <circle id="${id}-fim" r="3.5" fill="var(--azul)" stroke="#fff" stroke-width="2"
                  vector-effect="non-scaling-stroke" opacity="0"/>
          <rect id="${id}-alvo" x="0" y="0" width="${L}" height="${A}" fill="transparent"
                style="cursor:crosshair"/>
        </svg>
        <div class="spark-lida" id="${id}-lida"></div>
      </div>
    `;
  },

  /**
   * Redesenha com a série toda. `serie` são taxas por amostra, mais antiga
   * primeiro. Com menos de 2 pontos não há linha que desenhar.
   */
  update(id, serie, { unidade = 'ev/s' } = {}) {
    const svg = document.getElementById(id);
    if (!svg) return;
    const linha = document.getElementById(`${id}-linha`);
    const area = document.getElementById(`${id}-area`);
    const fim = document.getElementById(`${id}-fim`);

    if (!serie || serie.length < 2) {
      linha.setAttribute('d', '');
      area.setAttribute('d', '');
      fim.setAttribute('opacity', '0');
      svg.setAttribute('aria-label', 'taxa de inserção: sem dados suficientes');
      return;
    }

    // Escala: sempre a partir do zero. Um sparkline com base flutuante
    // exagera oscilações pequenas e faz um sistema estável parecer errático.
    const max = Math.max(...serie, 1);
    const px = (i) => (i / (serie.length - 1)) * L;
    const py = (v) => A - PAD - (v / max) * (A - 2 * PAD);

    const pontos = serie.map((v, i) => `${px(i).toFixed(2)},${py(v).toFixed(2)}`);
    linha.setAttribute('d', `M${pontos.join('L')}`);
    area.setAttribute('d', `M0,${A}L${pontos.join('L')}L${L},${A}Z`);

    fim.setAttribute('cx', L.toFixed(2));
    fim.setAttribute('cy', py(serie[serie.length - 1]).toFixed(2));
    fim.setAttribute('opacity', '1');

    const atual = Math.round(serie[serie.length - 1]);
    svg.setAttribute(
      'aria-label',
      `taxa de inserção: ${atual} ${unidade} agora, máximo ${Math.round(max)} nos últimos ${serie.length} instantes`
    );

    svg.__serie = serie;
    svg.__unidade = unidade;
  },

  /** Liga o cruzamento de leitura. Chamar uma vez, depois de o SVG existir. */
  init(id) {
    const svg = document.getElementById(id);
    const alvo = document.getElementById(`${id}-alvo`);
    const cruz = document.getElementById(`${id}-cruz`);
    const lida = document.getElementById(`${id}-lida`);
    if (!svg || !alvo) return;

    const mover = (ev) => {
      const serie = svg.__serie;
      if (!serie || serie.length < 2) return;
      const caixa = svg.getBoundingClientRect();
      const fracao = Math.min(1, Math.max(0, (ev.clientX - caixa.left) / caixa.width));
      const i = Math.round(fracao * (serie.length - 1));
      cruz.setAttribute('x1', ((i / (serie.length - 1)) * L).toFixed(2));
      cruz.setAttribute('x2', ((i / (serie.length - 1)) * L).toFixed(2));
      cruz.setAttribute('opacity', '.55');
      const atras = serie.length - 1 - i;
      lida.textContent =
        atras === 0
          ? `${Math.round(serie[i]).toLocaleString('pt-BR')} ${svg.__unidade} · agora`
          : `${Math.round(serie[i]).toLocaleString('pt-BR')} ${svg.__unidade} · há ${atras}s`;
    };

    const sair = () => {
      cruz.setAttribute('opacity', '0');
      lida.textContent = '';
    };

    alvo.addEventListener('pointermove', mover);
    alvo.addEventListener('pointerleave', sair);
  },
};
