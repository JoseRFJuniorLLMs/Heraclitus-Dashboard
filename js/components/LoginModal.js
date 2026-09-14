import { API, explicarFalha } from '../api.js';

export const LoginModal={
  serverAuth:false,
  autoShown:false,
  render(){return `<div id="loginModal" class="login-modal-overlay" style="display:none" aria-hidden="true"><div class="login-modal-card" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <button id="btnCloseLoginModal" class="modal-close" type="button" aria-label="Continuar sem autenticar">×</button>
    <span class="login-kicker">HERACLITUSDB CORE</span><h2 id="loginTitle">Autenticação do banco</h2>
    <p class="sub" id="loginIntro">O Dashboard verifica o Core ao abrir. Se o servidor não tiver credencial no <code>.env</code>, informe usuário e senha aqui. As credenciais do navegador ficam somente na memória desta página.</p>
    <div id="loginServerMode" class="login-server-mode" hidden></div>
    <form id="formLoginModal">
      <label>Endpoint Core<input id="loginEndpoint" value="${API.base()}" required></label>
      <label>Utilizador Core<input id="loginUser" autocomplete="username" required autofocus></label>
      <label>Senha / token Core<input type="password" id="loginPass" autocomplete="current-password" required></label>
      <hr class="soft-rule">
      <details class="login-agent-details"><summary>Agent Black Box · autenticação separada</summary>
        <label>Endpoint Agent Black Box<input id="loginAgentEndpoint" value="${API.agentBase()}"></label>
        <label>Bearer/OIDC Agent <span class="muted">opcional em dev_local</span><input type="password" id="loginAgentToken" autocomplete="off" placeholder="eyJ…"></label>
        <p class="nota"><strong>O Basic do Core nunca é reutilizado no Agent.</strong></p>
      </details>
      <p class="nota"><strong>RBAC vem dos servidores.</strong> O navegador não escolhe nem simula papel de Auditor/Admin.</p>
      <div id="loginError" class="aviso" hidden></div>
      <div class="acao"><button class="btn" type="submit" id="btnSubmitLogin">Conectar ao HeraclitusDB</button><button class="btn ghost" type="button" id="btnLogout">Limpar credenciais do navegador</button></div>
    </form>
  </div></div>`},
  show(reason='manual'){
    const m=document.getElementById('loginModal');if(!m)return;
    const err=document.getElementById('loginError');
    if(reason==='auth'){
      if(err){err.textContent='O HeraclitusDB respondeu que autenticação é necessária. Informe as credenciais do Core.';err.hidden=false;}
      this.autoShown=true;
    }
    m.style.display='flex';m.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>document.getElementById('loginUser')?.focus());
  },
  hide(){const m=document.getElementById('loginModal');if(!m)return;m.style.display='none';m.setAttribute('aria-hidden','true');},
  async bootstrap(){
    let status=null;try{const r=await fetch('/dashboard-api/status',{cache:'no-store'});if(r.ok)status=await r.json();}catch{}
    this.serverAuth=status?.core_auth_mode==='server_env';
    const mode=document.getElementById('loginServerMode');
    if(mode&&this.serverAuth){mode.hidden=false;mode.innerHTML='<strong>Credencial server-side detectada.</strong> O Dashboard tentará conectar usando o <code>.env</code>; a senha não é enviada ao JavaScript.';}
    const check=await API.stats();
    if(check.ok){this.badge(this.serverAuth?'server-env':null);document.dispatchEvent(new CustomEvent('hera:core-authenticated',{detail:{mode:this.serverAuth?'server_env':'browser_memory'}}));return true;}
    if(check.falha==='auth'){this.show('auth');return false;}
    this.badge();return false;
  },
  init(){
    const m=document.getElementById('loginModal'),f=document.getElementById('formLoginModal'),err=document.getElementById('loginError'),submit=document.getElementById('btnSubmitLogin');
    document.getElementById('btnCloseLoginModal').onclick=()=>this.hide();document.addEventListener('hera:open-login',()=>this.show('manual'));
    document.addEventListener('hera:auth-required',()=>{if(!this.autoShown)this.show('auth');});
    document.getElementById('btnLogout').onclick=()=>{API.definirCredenciais(null);API.definirAgentToken(null);this.serverAuth=false;this.badge();document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));this.hide();};
    f.onsubmit=async e=>{e.preventDefault();err.hidden=true;submit.disabled=true;submit.textContent='A verificar…';
      const core=API.definirBase(document.getElementById('loginEndpoint').value);if(core.erro){err.textContent=core.erro;err.hidden=false;submit.disabled=false;submit.textContent='Conectar ao HeraclitusDB';return;}
      const ag=API.definirAgentBase(document.getElementById('loginAgentEndpoint').value);if(ag.erro){err.textContent=ag.erro;err.hidden=false;submit.disabled=false;submit.textContent='Conectar ao HeraclitusDB';return;}
      const user=document.getElementById('loginUser').value.trim(),pass=document.getElementById('loginPass').value;API.definirCredenciais(`${user}:${pass}`);API.definirAgentToken(document.getElementById('loginAgentToken').value);
      const r=await API.stats();submit.disabled=false;submit.textContent='Conectar ao HeraclitusDB';
      if(!r.ok){API.definirCredenciais(null);const x=explicarFalha(r.falha,r.estado);err.textContent=x.longo;err.hidden=false;this.badge();return;}
      this.serverAuth=false;this.autoShown=false;const ar=await API.agentGet('/api/v1/agent/status',{ms:5000});this.badge(user);document.dispatchEvent(new CustomEvent('hera:endpoint-mudou'));document.dispatchEvent(new CustomEvent('hera:core-authenticated',{detail:{mode:'browser_memory'}}));
      if(!ar.ok&&ar.falha==='auth'){err.textContent='Core conectado. O Agent Black Box exige um Bearer/OIDC separado para consultar runs e evidências.';err.hidden=false;return;}
      this.hide();
    };this.badge();
  },
  badge(user){const b=document.getElementById('userProfileBadge');if(!b)return;const cred=API.credenciais(),ag=API.agentTokenConfigurado();if(cred){b.textContent=`Core: ${user||cred.split(':')[0]}${ag?' · Agent autenticado':''}`;b.classList.add('connected');return;}if(this.serverAuth){b.textContent='Core: autenticado (.env)';b.classList.add('connected');return;}b.textContent='Autenticar';b.classList.remove('connected');}
};
