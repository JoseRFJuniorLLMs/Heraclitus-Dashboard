export const Header = {
  render(){return `<header>
    <div class="brand"><div class="mark">H</div><div><h1>HeraclitusDB</h1><small>Temporal · Verificável · Dados, investigação e proveniência</small></div></div>
    <div class="header-actions">
      <div class="conn demo" id="conn" role="button" tabindex="0" title="Configurar conexão com HeraclitusDB"><span class="led"></span><span id="connlbl">core a ligar…</span></div>
      <button id="userProfileBadge" class="user-badge" type="button">Conectar ao banco</button>
    </div>
  </header>`},
  init(){const open=()=>document.dispatchEvent(new CustomEvent('hera:open-login'));const c=document.getElementById('conn'),b=document.getElementById('userProfileBadge');if(c){c.onclick=open;c.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();open();}}}if(b)b.onclick=open;}
};
