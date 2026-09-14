import { API, explicarFalha } from './api.js';

const POLL_VISIBLE_MS = 2000;
const POLL_HIDDEN_MS = 10000;

export const RuntimeMonitor = {
  timer:null,inFlight:false,online:null,lastFailure:null,
  init(){
    const schedule=()=>{clearTimeout(this.timer);const wait=document.hidden?POLL_HIDDEN_MS:POLL_VISIBLE_MS;this.timer=setTimeout(async()=>{await this.poll();schedule();},wait);};
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.poll();schedule();});
    document.addEventListener('hera:endpoint-mudou',()=>{this.lastFailure=null;this.poll(true);});
    this.poll();schedule();
  },
  async poll(force=false){if(this.inFlight&&!force)return;this.inFlight=true;try{const response=await API.stats();if(!response.ok){this.applyOffline(response);return;}this.applyOnline(response);}finally{this.inFlight=false;}},
  applyOnline(response){this.online=true;this.lastFailure=null;window.LIVE=true;const connection=document.getElementById('conn'),label=document.getElementById('connlbl');if(connection)connection.className='conn live';if(label)label.textContent=`core · ${Math.round(response.latencia||0)} ms`;document.dispatchEvent(new CustomEvent('hera:stats',{detail:{...(response.dados||{}),_latencia:response.latencia||0}}));},
  applyOffline(response){const failure=explicarFalha(response.falha,response.estado),signature=`${response.falha||''}:${response.estado||''}`;this.online=false;window.LIVE=false;const connection=document.getElementById('conn'),label=document.getElementById('connlbl');if(connection)connection.className=response.falha==='auth'?'conn auth':'conn demo';if(label)label.textContent=response.falha==='auth'?'autenticação necessária':failure.curto;
    if(this.lastFailure!==signature){this.lastFailure=signature;document.dispatchEvent(new CustomEvent('hera:sem-ligacao',{detail:{...response,explicacao:failure}}));if(response.falha==='auth')document.dispatchEvent(new CustomEvent('hera:auth-required',{detail:{...response,explicacao:failure}}));}
  },
};
