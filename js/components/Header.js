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
      if (v.trim() && v.trim() !== atual) {
        const r = API.definirBase(v.trim());
        // O `definirBase` passou a RECUSAR enderecos sem esquema (que o fetch
        // trataria como caminho relativo) e enderecos fora do loopback sem
        // HTTPS (que enviariam as credenciais de administracao em claro).
        // Ignorar a recusa deixava o painel a apontar para o sitio errado sem
        // ninguem saber porque.
        if (r && r.erro) {
          alert(['Endereço não aceite:', '', r.erro].join('\n'));
          return;
        }
      }

      // Credenciais, quando o servidor tem `rest_basic_auth`.
      //
      // NÃO se pré-preenche com a credencial atual: punha a password em claro
      // num campo visível, num painel que pode estar num ecrã partilhado. Diz-se
      // apenas se já existe uma.
      const tem = !!API.credenciais();
      const cred = prompt(
        [
          'Credenciais Basic (utilizador:senha), se o servidor as exigir.',
          tem ? 'Já existem credenciais guardadas neste separador.' : '',
          'Vazio = manter as atuais. Escreva "-" para as apagar.',
        ]
          .filter(Boolean)
          .join('\n'),
        ''
      );
      if (cred !== null) {
        const t = cred.trim();
        if (t === '-') API.definirCredenciais(null);
        else if (t) API.definirCredenciais(t);
      }

      // Sem `location.reload()`: a próxima sondagem (1 s) já usa o endereço
      // novo. Recarregar perdia o histórico do sparkline e piscava o painel
      // inteiro por causa de uma mudança de uma linha.
      const rot = document.getElementById('connlbl');
      if (rot) rot.textContent = 'a ligar · ' + API.base();
      btn.className = 'conn demo';
      // Avisa quem depende do endpoint. O fluxo SSE tem de ser reaberto: sem
      // isto continuava agarrado ao servidor anterior enquanto os mostradores
      // já mostravam o novo.
      document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
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
