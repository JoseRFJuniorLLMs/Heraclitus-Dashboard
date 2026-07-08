export const Header = {
  render() {
    return `
      <header>
        <div class="brand">
          <div class="mark">H</div>
          <div><h1>Heraclitus Forensic Layer</h1><small>A primeira plataforma que transforma logs em provas jurídicas</small></div>
        </div>
        <div class="conn demo" id="conn" title="Clique para configurar o endpoint REST do HeraclitusDB">
          <span class="led"></span><span id="connlbl">demo — sem conexão</span>
        </div>
      </header>
    `;
  },
  init() {
    const connBtn = $('#conn');
    if (connBtn) {
      connBtn.onclick = () => {
        const v = prompt('Endpoint REST do HeraclitusDB:', localStorage.getItem('hera_api') || 'http://127.0.0.1:7475');
        if (v) {
          localStorage.setItem('hera_api', v);
          window.location.reload();
        }
      };
    }
  }
};