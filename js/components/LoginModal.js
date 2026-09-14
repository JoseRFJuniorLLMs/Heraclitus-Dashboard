import { API, explicarFalha } from '../api.js';
export const LoginModal={
  render(){return `<div id="loginModal" class="login-modal-overlay" style="display:none"><div class="login-modal-card">
    <button id="btnCloseLoginModal" class="modal-close" type="button" aria-label="Fechar">×</button>
    <h2>Conectar ao HeraclitusDB</h2><p class="sub">Credenciais ficam somente na memória desta página e são apagadas ao recarregar. Core e Agent são domínios de autenticação separados.</p>
    <form id="formLoginModal">
      <label>Endpoint Core<input id="loginEndpoint" value="${API.base()}" required></label>
      <label>Utilizador Core<input id="loginUser" autocomplete="username" required></label>
      <label>Senha / token Core<input type="password" id="loginPass" autocomplete="current-password" required></label>
      <hr class="soft-rule">
      <label>Endpoint Agent Black Box<input id="loginAgentEndpoint" value="${API.agentBase()}"></label>
      <label>Bearer/OIDC Agent <span class="muted">opcional em dev_local</span><input type="password" id="loginAgentToken" autocomplete="off" placeholder="eyJ…"></label>
      <p class="nota"><strong>Não reutilizamos o Basic do Core no Agent.</strong> Isso evita enviar a credencial do banco a uma superfície com identidade própria.</p>
      <p class="nota"><strong>RBAC vem dos servidores.</strong> O navegador não escolhe nem simula papel de Auditor/Admin.</p>
      <div id="loginError" class="aviso" hidden></div>
      <div class="acao"><button class="btn" type="submit" id="btnSubmitLogin">Conectar</button><button class="btn ghost" type="button" id="btnLogout">Desconectar</button></div>
    </form>
  </div></div>`},
  init(){
    const m=document.getElementById('loginModal'),f=document.getElementById('formLoginModal'),err=document.getElementById('loginError'),submit=document.getElementById('btnSubmitLogin');
    const show=()=>m.style.display='flex',hide=()=>m.style.display='none';
    document.getElementById('btnCloseLoginModal').onclick=hide;document.addEventListener('hera:open-login',show);
    document.getElementById('btnLogout').onclick=()=>{API.definirCredenciais(null);API.definirAgentToken(null);this.badge();document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));hide();};
    f.onsubmit=async e=>{e.preventDefault();err.hidden=true;submit.disabled=true;submit.textContent='A verificar…';
      const core=API.definirBase(document.getElementById('loginEndpoint').value);if(core.erro){err.textContent=core.erro;err.hidden=false;submit.disabled=false;submit.textContent='Conectar';return;}
      const ag=API.definirAgentBase(document.getElementById('loginAgentEndpoint').value);if(ag.erro){err.textContent=ag.erro;err.hidden=false;submit.disabled=false;submit.textContent='Conectar';return;}
      const user=document.getElementById('loginUser').value.trim(),pass=document.getElementById('loginPass').value;API.definirCredenciais(`${user}:${pass}`);API.definirAgentToken(document.getElementById('loginAgentToken').value);
      const r=await API.stats();submit.disabled=false;submit.textContent='Conectar';
      if(!r.ok){API.definirCredenciais(null);const x=explicarFalha(r.falha,r.estado);err.textContent=x.longo;err.hidden=false;this.badge();return;}
      const ar=await API.agentGet('/api/v1/agent/status',{ms:5000});
      this.badge(user);document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));
      if(!ar.ok&&ar.falha==='auth'){err.textContent='Core conectado. O módulo Agent exige um Bearer/OIDC válido; configure o token para consultar runs e evidências.';err.hidden=false;return;}
      hide();
    };this.badge();
  },
  badge(user){const b=document.getElementById('userProfileBadge');if(!b)return;const cred=API.credenciais();const ag=API.agentTokenConfigurado();b.textContent=cred?`Core: ${user||cred.split(':')[0]}${ag?' · Agent autenticado':''}`:'Conectar ao banco';b.classList.toggle('connected',!!cred);}
};
