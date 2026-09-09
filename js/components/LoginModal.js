import { API } from '../api.js';

export const LoginModal = {
  render() {
    const cred = API.credenciais();
    const temCredenciais = !!cred;

    return `
      <div id="loginModal" class="login-modal-overlay" style="display: ${temCredenciais ? 'none' : 'flex'}; position: fixed; inset: 0; background: rgba(7, 29, 65, 0.85); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(6px);">
        <div class="login-modal-card" style="background: #ffffff; border-radius: 12px; width: 100%; max-width: 440px; padding: 32px; box-shadow: 0 16px 40px rgba(7, 29, 65, 0.4); border: 1px solid var(--line); position: relative;">
          ${temCredenciais ? `<button id="btnCloseLoginModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 22px; color: var(--muted); cursor: pointer;">&times;</button>` : ''}
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 52px; height: 52px; border-radius: 12px; background: var(--azul); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(19,81,180,0.3);">H</div>
            <h2 style="font-size: 22px; margin: 0 0 6px; color: var(--azul-esc); font-weight: 800;">Autenticação HeraclitusDB</h2>
            <p style="margin: 0; font-size: 13px; color: var(--muted);">Introduza o utilizador e a senha de acesso ao banco de dados</p>
          </div>

          <form id="formLoginModal" onsubmit="return false;">
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Endpoint do HeraclitusDB</label>
              <input type="text" id="loginEndpoint" value="${API.base()}" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; font-family: monospace;" required />
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Utilizador (Basic Auth)</label>
              <input type="text" id="loginUser" placeholder="ex: admin" value="${cred ? cred.split(':')[0] : ''}" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px;" required autofocus />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Senha / Token de Acesso</label>
              <input type="password" id="loginPass" placeholder="••••••••••••" value="${cred && cred.includes(':') ? cred.split(':')[1] : ''}" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px;" required />
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Perfil de Acesso (RBAC)</label>
              <select id="loginRole" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #fff;">
                <option value="auditor">Auditor Forense (Acesso Total + Verificação Probatória)</option>
                <option value="soc">Operador SOC (Investigação Causal + Replay de Ataques)</option>
                <option value="titular">Atendimento ao Titular LGPD (Art. 18)</option>
                <option value="leitor">Leitor de Conformidade (Somente Leitura)</option>
              </select>
            </div>

            <div id="loginError" style="display: none; background: var(--vermelho-bg); color: var(--vermelho); padding: 10px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 16px; font-weight: 600; border-left: 4px solid var(--vermelho);"></div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btnSubmitLogin" class="btn" style="flex: 1; padding: 12px; font-weight: 700; font-size: 14px; background: var(--azul); color: #fff; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>🔒 Entrar & Autenticar</span>
              </button>
              ${temCredenciais ? `<button type="button" id="btnLogout" class="btn" style="background: var(--vermelho-bg); color: var(--vermelho); border: 1px solid var(--vermelho); padding: 12px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">Sair</button>` : ''}
            </div>
          </form>
        </div>
      </div>
    `;
  },

  init() {
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('btnCloseLoginModal');
    const form = document.getElementById('formLoginModal');
    const errDiv = document.getElementById('loginError');
    const logoutBtn = document.getElementById('btnLogout');
    const submitBtn = document.getElementById('btnSubmitLogin');

    if (!modal) return;

    const showModal = () => { modal.style.display = 'flex'; };
    const hideModal = () => {
      if (!API.credenciais()) return; // Não fecha se não tiver credenciais salvos
      modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.onclick = hideModal;
    modal.onclick = (e) => { if (e.target === modal && API.credenciais()) hideModal(); };

    document.addEventListener('hera:open-login', showModal);

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        API.definirCredenciais(null);
        document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
        LoginModal.updateHeaderBadge();
        showModal();
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        errDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ A autenticar…</span>';

        const endpoint = document.getElementById('loginEndpoint').value.trim();
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value;

        if (endpoint) {
          const res = API.definirBase(endpoint);
          if (res && res.erro) {
            errDiv.textContent = res.erro;
            errDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🔒 Entrar & Autenticar</span>';
            return;
          }
        }

        if (!user) {
          errDiv.textContent = 'Por favor introduza o utilizador do HeraclitusDB.';
          errDiv.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🔒 Entrar & Autenticar</span>';
          return;
        }

        const authStr = `${user}:${pass}`;
        API.definirCredenciais(authStr);

        // Testa a autenticação efetuando um pedido GET à API
        const teste = await API.get('/stats', { ms: 5000 });
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🔒 Entrar & Autenticar</span>';

        if (!teste.ok && teste.falha === 'auth') {
          API.definirCredenciais(null);
          errDiv.textContent = 'Falha de Autenticação (HTTP 401): Utilizador ou senha do HeraclitusDB incorretos.';
          errDiv.style.display = 'block';
          return;
        }

        // Sucesso ou conexão estabelecida!
        document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
        LoginModal.updateHeaderBadge();
        modal.style.display = 'none';
      };
    }

    LoginModal.updateHeaderBadge();

    // Se não tiver credenciais salvas, abre o modal automaticamente ao carregar
    if (!API.credenciais()) {
      showModal();
    }
  },

  updateHeaderBadge() {
    const badge = document.getElementById('userProfileBadge');
    if (!badge) return;
    const cred = API.credenciais();
    if (cred) {
      const u = cred.split(':')[0] || 'Autenticado';
      badge.innerHTML = `👤 <span style="font-weight:700;">${u}</span> (Autenticado)`;
      badge.style.background = 'rgba(22, 136, 33, 0.2)';
      badge.style.borderColor = 'rgba(22, 136, 33, 0.4)';
    } else {
      badge.innerHTML = `🔒 Entrar (Não Autenticado)`;
      badge.style.background = 'rgba(229, 34, 7, 0.2)';
      badge.style.borderColor = 'rgba(229, 34, 7, 0.4)';
    }
  }
};
