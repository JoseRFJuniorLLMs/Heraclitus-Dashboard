const menuIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
const searchIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>`;

export const Header = {
  render() {
    return `<header class="app-header">
      <div class="header-left">
        <button id="mobile-nav-toggle" class="header-icon-button mobile-nav-toggle" type="button" aria-label="Abrir navegação" title="Abrir navegação">
          ${menuIcon}
        </button>
        <a class="header-brand" href="#overview" aria-label="HeraclitusDB — início">HeraclitusDB</a>
        <div class="header-breadcrumb" aria-label="Localização atual">
          <span id="breadcrumb-area">Início</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <strong id="breadcrumb-page">Visão geral</strong>
        </div>
      </div>

      <div class="header-center">
        <button id="global-search-button" class="global-command" type="button" aria-label="Ir para uma tela">
          ${searchIcon}
          <span>Ir para…</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>

      <div class="header-actions">
        <button class="conn demo" id="conn" type="button" title="Configurar conexão com HeraclitusDB">
          <span class="led" aria-hidden="true"></span><span id="connlbl">core a ligar…</span>
        </button>
        <button id="userProfileBadge" class="user-badge" type="button">Conectar</button>
      </div>
    </header>`;
  },

  init() {
    const openLogin = () => document.dispatchEvent(new CustomEvent('hera:open-login'));
    const connection = document.getElementById('conn');
    const profile = document.getElementById('userProfileBadge');
    const search = document.getElementById('global-search-button');
    const home = document.querySelector('.header-brand');

    if (connection) connection.addEventListener('click', openLogin);
    if (profile) profile.addEventListener('click', openLogin);
    if (search) search.addEventListener('click', () => document.dispatchEvent(new CustomEvent('hera:open-command')));
    if (home) home.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.dispatchEvent(new CustomEvent('hera:navigate', { detail: 'overview' }));
    });

    document.addEventListener('hera:route-changed', event => {
      const area = document.getElementById('breadcrumb-area');
      const page = document.getElementById('breadcrumb-page');
      if (area) area.textContent = event.detail?.areaLabel || 'HeraclitusDB';
      if (page) page.textContent = event.detail?.pageLabel || 'Visão geral';
    });
  },
};
