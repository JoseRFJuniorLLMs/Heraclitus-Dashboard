export const Header = {
  render(){return `<header class="app-header">
    <div class="brand">
      <div class="mark" aria-hidden="true">H</div>
      <div class="brand-copy">
        <div class="brand-line"><h1>HeraclitusDB</h1><span class="product-badge">Platform Console</span></div>
        <small>Temporal · Verificável · Proveniência · Investigação</small>
      </div>
    </div>
    <div class="header-actions">
      <div class="conn demo" id="conn" role="button" tabindex="0" title="Configurar conexão com HeraclitusDB">
        <span class="led" aria-hidden="true"></span><span id="connlbl">core a ligar…</span>
      </div>
      <button id="userProfileBadge" class="user-badge" type="button">Conectar</button>
    </div>
  </header>`},
  init(){
    const open=()=>document.dispatchEvent(new CustomEvent('hera:open-login'));
    const c=document.getElementById('conn'),b=document.getElementById('userProfileBadge');
    if(c){c.onclick=open;c.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();open();}}}
    if(b)b.onclick=open;
  }
};
