import { API, explicarFalha } from '../api.js';
export const LoginModal={
  render(){return `<div id="loginModal" class="login-modal-overlay" style="display:none"><div class="login-modal-card">
    <button id="btnCloseLoginModal" class="modal-close" type="button" aria-label="Fechar">×</button>
    <h2>Conectar ao HeraclitusDB</h2><p class="sub">As credenciais ficam somente na memória desta página e são apagadas ao recarregar.</p>
    <form id="formLoginModal">
      <label>Endpoint Core<input id="loginEndpoint" value="${API.base()}" required></label>
      <label>Utilizador<input id="loginUser" autocomplete="username" required></label>
      <label>Senha / token<input type="password" id="loginPass" autocomplete="current-password" required></label>
      <p class="nota"><strong>RBAC vem do servidor.</strong> O navegador não escolhe nem simula papel de Auditor/Admin.</p>
      <div id="loginError" class="aviso" hidden></div>
      <div class="acao"><button class="btn" type="submit" id="btnSubmitLogin">Conectar</button><button class="btn ghost" type="button" id="btnLogout">Desconectar</button></div>
    </form>
  </div></div>`},
  init(){
    const m=document.getElementById('loginModal'),f=document.getElementById('formLoginModal'),err=document.getElementById('loginError'),submit=document.getElementById('btnSubmitLogin');
    const show=()=>m.style.display='flex',hide=()=>m.style.display='none';
    document.getElementById('btnCloseLoginModal').onclick=hide;document.addEventListener('hera:open-login',show);
    document.getElementById('btnLogout').onclick=()=>{API.definirCredenciais(null);this.badge();document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));hide();};
    f.onsubmit=async e=>{e.preventDefault();err.hidden=true;submit.disabled=true;submit.textContent='A verificar…';
      const base=API.definirBase(document.getElementById('loginEndpoint').value); if(base.erro){err.textContent=base.erro;err.hidden=false;submit.disabled=false;submit.textContent='Conectar';return;}
      const user=document.getElementById('loginUser').value.trim(),pass=document.getElementById('loginPass').value;API.definirCredenciais(`${user}:${pass}`);
      const r=await API.stats();submit.disabled=false;submit.textContent='Conectar';
      if(!r.ok){API.definirCredenciais(null);const x=explicarFalha(r.falha,r.estado);err.textContent=x.longo;err.hidden=false;this.badge();return;}
      this.badge(user);document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));hide();
    };this.badge();
  },
  badge(user){const b=document.getElementById('userProfileBadge');if(!b)return;const cred=API.credenciais();b.textContent=cred?`Conectado: ${user||cred.split(':')[0]}`:'Conectar ao banco';b.classList.toggle('connected',!!cred);}
};
