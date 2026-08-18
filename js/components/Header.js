import { API } from '../api.js';

export const Header = {
  render() {
    return `
      <header>
        <div class="brand">
          <div class="mark">H</div>
          <div>
            <h1>Heraclitus Forensic Layer</h1>
            <small>A primeira plataforma que transforma logs em provas jurídicas</small>
          </div>
        </div>
        <div class="conn demo" id="conn" role="button" tabindex="0"
             title="Clique para configurar o endpoint REST do HeraclitusDB">
          <span class="led"></span><span id="connlbl">a ligar…</span>
        </div>
      </header>
    `;
  },

  init() {
    const btn = document.getElementById('conn');
    if (!btn) return;

    const configurar = () => {
      const atual = API.base();
      const v = prompt('Endpoint REST do HeraclitusDB:', atual);
      if (!v || v.trim() === atual) return;
      API.definirBase(v.trim());
      // Sem `location.reload()`: a próxima sondagem (1 s) já usa o endereço
      // novo. Recarregar a página perdia o histórico do sparkline e piscava o
      // painel inteiro por causa de uma mudança de uma linha.
      document.getElementById('connlbl').textContent = 'a ligar · ' + API.base();
      btn.className = 'conn demo';
    };

    btn.onclick = configurar;
    btn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        configurar();
      }
    };
  },
};
