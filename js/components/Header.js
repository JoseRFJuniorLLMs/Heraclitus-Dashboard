import { API } from '../api.js';

export const Header = {
  render() {
    return `
      <header style="background: linear-gradient(120deg, #071D41, #1351B4); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 4px solid #FFCD07; flex-wrap: wrap; gap: 14px;">
        <div class="brand" style="display: flex; align-items: center; gap: 14px;">
          <div class="mark" style="width: 42px; height: 42px; border-radius: 10px; background: #fff; color: #1351B4; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">H</div>
          <div>
            <h1 style="font-size: 20px; margin: 0; font-weight: 800; line-height: 1.1; color: #ffffff;">Heraclitus Forensic Layer</h1>
            <small style="font-size: 12px; opacity: 0.9; color: #cfe0ff;">Plataforma de Integridade Orçamentária e Provas Jurídicas por Criptografia Tempus-Log</small>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="conn demo" id="conn" role="button" tabindex="0" title="Clique para configurar o endpoint REST do HeraclitusDB" style="display: flex; align-items: center; gap: 8px; font-size: 12px; background: rgba(255,255,255,0.12); padding: 7px 14px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.25); cursor: pointer;">
            <span class="led" style="width: 9px; height: 9px; border-radius: 50%; background: #FFCD07; display: inline-block;"></span>
            <span id="connlbl">a ligar…</span>
          </div>

          <button id="userProfileBadge" class="btn" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 12px; font-weight: 700; padding: 7px 16px; border-radius: 40px; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px;">
            👤 Modo Visitante (Entrar)
          </button>
        </div>
      </header>
    `;
  },

  init() {
    const btnConn = document.getElementById('conn');
    const btnLogin = document.getElementById('userProfileBadge');

    if (btnLogin) {
      btnLogin.onclick = () => {
        document.dispatchEvent(new CustomEvent('hera:open-login'));
      };
    }

    if (btnConn) {
      const configurar = () => {
        document.dispatchEvent(new CustomEvent('hera:open-login'));
      };

      btnConn.onclick = configurar;
      btnConn.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          configurar();
        }
      };
    }
  }
};
