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
      if (v === null) return; // cancelou
      if (v.trim() && v.trim() !== atual) API.definirBase(v.trim());

      // Credenciais, quando o servidor tem `rest_basic_auth`. Pergunta-se
      // sempre porque não há forma de saber de antemão se são precisas — e
      // deixar em branco é a resposta certa quando não são.
      const cred = prompt(
        'Credenciais Basic (utilizador:senha), se o servidor as exigir.\n' +
          'Deixe vazio se não houver. Ficam só neste separador, nunca em disco.',
        API.credenciais() || ''
      );
      if (cred !== null) API.definirCredenciais(cred.trim() || null);

      // Sem `location.reload()`: a próxima sondagem (1 s) já usa o endereço
      // novo. Recarregar perdia o histórico do sparkline e piscava o painel
      // inteiro por causa de uma mudança de uma linha.
      const rot = document.getElementById('connlbl');
      if (rot) rot.textContent = 'a ligar · ' + API.base();
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
