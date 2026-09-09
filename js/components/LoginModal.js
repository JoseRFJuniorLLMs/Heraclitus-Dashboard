import { API } from '../api.js';

export const LoginModal = {
  render() {
    const cred = API.credenciais();
    let usuarioAtual = 'Visitante (Demonstração)';
    if (cred) {
      const parts = cred.split(':');
      usuarioAtual = parts[0] || 'Usuário Autenticado';
    }

    return `
      <div id="loginModal" class="login-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(7, 29, 65, 0.7); z-index: 2000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="login-modal-card" style="background: #ffffff; border-radius: 12px; width: 100%; max-width: 440px; padding: 28px; box-shadow: 0 12px 32px rgba(7, 29, 65, 0.3); border: 1px solid var(--line); position: relative;">
          <button id="btnCloseLoginModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 20px; color: var(--muted); cursor: pointer;">&times;</button>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--azul); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; margin-bottom: 10px;">H</div>
            <h2 style="font-size: 20px; margin: 0 0 4px; color: var(--azul-esc); font-weight: 800;">Autenticação RBAC · gov.br</h2>
            <p style="margin: 0; font-size: 13px; color: var(--muted);">Acesso restrito à plataforma HeraclitusDB</p>
          </div>

          <form id="formLoginModal" onsubmit="return false;">
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Endpoint do Servidor</label>
              <input type="text" id="loginEndpoint" value="${API.base()}" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; font-family: monospace;" required />
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Utilizador / Operador</label>
              <input type="text" id="loginUser" placeholder="ex: admin.auditor" value="${cred ? cred.split(':')[0] : ''}" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px;" required />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Senha / Token de Acesso</label>
              <input type="password" id="loginPass" placeholder="••••••••••••" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px;" />
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--azul-esc); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Perfil de Acesso (RBAC)</label>
              <select id="loginRole" style="width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: #fff;">
                <option value="auditor">Auditor Forense (Acesso Total + Verificação Probatória)</option>
                <option value="soc">Operador SOC (Investigação Causal + Replay de Ataques)</option>
                <option value="titular">Atendimento ao Titular LGPD (Art. 18)</option>
                <option value="leitor">Leitor de Conformidade (Somente Leitura)</option>
              </select>
            </div>

            <div id="loginError" style="display: none; background: var(--vermelho-bg); color: var(--vermelho); padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 14px; font-weight: 600;"></div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btnSubmitLogin" class="btn" style="flex: 1; padding: 12px; font-weight: 700; font-size: 14px; background: var(--azul); color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                🔒 Entrar / Autenticar
              </button>
              ${cred ? `<button type="button" id="btnLogout" class="btn" style="background: var(--vermelho-bg); color: var(--vermelho); border: 1px solid var(--vermelho); padding: 12px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">Sair</button>` : ''}
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

    if (!modal) return;

    const showModal = () => { modal.style.display = 'flex'; };
    const hideModal = () => { modal.style.display = 'none'; };

    if (closeBtn) closeBtn.onclick = hideModal;
    modal.onclick = (e) => { if (e.target === modal) hideModal(); };

    // Disparadores externos para abrir o modal
    document.addEventListener('hera:open-login', showModal);

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        API.definirCredenciais(null);
        document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
        hideModal();
        LoginModal.updateHeaderBadge();
      };
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        errDiv.style.display = 'none';

        const endpoint = document.getElementById('loginEndpoint').value.trim();
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value;

        if (endpoint) {
          const res = API.definirBase(endpoint);
          if (res && res.erro) {
            errDiv.textContent = res.erro;
            errDiv.style.display = 'block';
            return;
          }
        }

        if (user) {
          const authStr = `${user}:${pass}`;
          API.definirCredenciais(authStr);
        } else {
          API.definirCredenciais(null);
        }

        document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
        LoginModal.updateHeaderBadge();
        hideModal();
      };
    }

    LoginModal.updateHeaderBadge();
  },

  updateHeaderBadge() {
    const badge = document.getElementById('userProfileBadge');
    if (!badge) return;
    const cred = API.credenciais();
    if (cred) {
      const u = cred.split(':')[0] || 'Autenticado';
      badge.innerHTML = `👤 <span style="font-weight:700;">${u}</span> (RBAC)`;
      badge.style.background = 'rgba(22, 136, 33, 0.2)';
      badge.style.borderColor = 'rgba(22, 136, 33, 0.4)';
    } else {
      badge.innerHTML = `👤 Modo Visitante`;
      badge.style.background = 'rgba(255, 255, 255, 0.15)';
      badge.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }
};
