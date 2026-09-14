const RELEASE = '2026.09.14-r3';

const GROUPS = [
  {
    title: 'Plataforma',
    items: [
      ['overview', '◆', 'Visão geral', 'motor, índices e integridade'],
      ['capabilities', '▦', 'Capacidades & runtime', 'o que existe e o que está ativo'],
      ['public', '▣', 'Dados públicos', 'Portal da Transparência e PNCP'],
      ['fontes', '◇', 'Fontes & ingestão', 'origens, silêncio e retenção'],
      ['atributos', '▤', 'Mapa de dados', 'campos e cardinalidades'],
    ],
  },
  {
    title: 'Tempo & investigação',
    items: [
      ['time', '◫', 'Linha do tempo', 'atividade e janelas temporais'],
      ['diff', '⇄', 'Comparar A/B', 'mudanças entre dois estados'],
      ['cases', '▥', 'Casos', 'investigações persistidas'],
      ['graph', '⬡', 'Grafo & relações', 'entidades e vínculos'],
      ['replay', '▷', 'Reconstituição', 'replay verificável'],
      ['why', '⌖', 'WHY / causalidade', 'origem e explicação'],
    ],
  },
  {
    title: 'Evidência',
    items: [
      ['custody', '◇', 'Cadeia de custódia', 'proveniência ponta a ponta'],
      ['merkle', '▦', 'Integridade Merkle', 'provas e verificação'],
      ['comp', '✓', 'Compliance técnico', 'estado técnico comprovável'],
    ],
  },
  {
    title: 'Módulos',
    items: [
      ['agent', '◎', 'Agent Black Box', 'runs, tools, policy e evidência'],
      ['soc', '◉', 'Sentinel / SOC', 'segurança como módulo'],
      ['ia', '✦', 'Inteligência assistida', 'explicação sem inventar fatos'],
    ],
  },
  {
    title: 'Governança',
    items: [
      ['exec', '▤', 'Painel executivo', 'visão de decisão'],
      ['titular', '○', 'Titular / LGPD', 'pegada e acessos'],
      ['auditor', '⚖', 'Auditoria', 'trilha e controles'],
    ],
  },
];

function item([id, icon, label, hint]) {
  return `<a data-s="${id}" role="button" tabindex="0" title="${label}">
    <span class="ic" aria-hidden="true">${icon}</span>
    <span class="nav-item-copy">
      <span class="nav-label">${label}</span>
      <small>${hint}</small>
    </span>
  </a>`;
}

export const Navigation = {
  render() {
    return `<div class="nav-shell">
      <div class="nav-head">
        <div class="nav-workspace">
          <span class="nav-workspace-mark" aria-hidden="true">H</span>
          <span class="nav-workspace-copy">
            <strong>Platform Console</strong>
            <small>operações & evidência</small>
          </span>
        </div>
        <button id="nav-toggle" class="nav-toggle" type="button" aria-label="Recolher navegação" aria-expanded="true" title="Recolher navegação">
          <span aria-hidden="true">‹</span>
        </button>
      </div>
      <div class="nav-scroll">
        ${GROUPS.map(g => `<div class="nav-group"><div class="grp">${g.title}</div>${g.items.map(item).join('')}</div>`).join('')}
      </div>
      <div class="nav-footer">
        <span class="nav-release-dot" aria-hidden="true"></span>
        <span class="nav-release-copy"><strong>HeraclitusDB Dashboard</strong><small>${RELEASE}</small></span>
      </div>
    </div>`;
  },

  init() {
    const links = [...document.querySelectorAll('#nav a[data-s]')];
    const toggle = document.getElementById('nav-toggle');

    const go = (id) => {
      const target = document.getElementById(id);
      if (!target) return;
      links.forEach(x => {
        const active = x.dataset.s === id;
        x.classList.toggle('active', active);
        if (active) x.setAttribute('aria-current', 'page');
        else x.removeAttribute('aria-current');
      });
      document.querySelectorAll('#main-content > section').forEach(s => s.classList.toggle('on', s.id === id));
      history.replaceState(null, '', '#' + id);
      document.getElementById('main-content')?.focus?.({ preventScroll: true });
      if (window.matchMedia('(max-width: 900px)').matches) {
        target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    };

    links.forEach(a => {
      a.onclick = () => go(a.dataset.s);
      a.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go(a.dataset.s);
        }
      };
    });

    if (toggle) {
      toggle.onclick = () => {
        const collapsed = document.documentElement.classList.toggle('nav-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Expandir navegação' : 'Recolher navegação');
        toggle.title = collapsed ? 'Expandir navegação' : 'Recolher navegação';
        toggle.querySelector('span').textContent = collapsed ? '›' : '‹';
      };
    }

    document.addEventListener('hera:navigate', e => go(e.detail));
    const initial = location.hash.slice(1);
    if (initial && document.getElementById(initial)) go(initial);
    else go('overview');
  },
};
