const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const app=read('js/app.js'),runtime=read('js/runtime.js'),nav=read('js/components/Navigation.js'),time=read('js/components/TimeMachine.js');
const cases=read('js/components/Cases.js'),useCases=read('js/useCases.js'),labra=read('js/components/LabraAguCase.js'),aeb=read('js/components/AebStreamCase.js'),cgee=read('js/components/CgeeCase.js');
const login=read('js/components/LoginModal.js'),agent=read('js/components/AgentBlackBox.js'),redteam=read('js/components/RedTeamSecurity.js'),api=read('js/api.js'),server=read('server.py'),index=read('index.html');

// R10 product architecture: use cases live under Cases, not as unrelated rail areas.
assert(nav.includes("const RELEASE = '2026.09.15-r10'"));
assert(nav.includes("id:'cases'"));
for(const route of ["['cases','Catálogo de casos']","['labra','LABRA-AGU']","['aeb','AEB-STREAM']","['cgee','CGEE · Integridade Orçamentária']"]) assert(nav.includes(route),route);
assert(!nav.includes("{id:'labra',label:'LABRA-AGU'"));
assert(!nav.includes("{id:'aeb',label:'AEB-STREAM'"));
assert(!nav.includes("{id:'cgee',label:'CGEE'"));
for(const required of ['LabraAguCase.render()','AebStreamCase.render()','CgeeCase.render()','Cases.render()']) assert(app.includes(required),required);

// Canonical registry is shared by the Cases hub.
for(const id of ["id:'labra'","id:'aeb'","id:'cgee'"]) assert(useCases.includes(id),id);
for(const snap of ['9b5d9bcada759e23e12c2d995be17dca6e42a8e1','b8e9de466e9071a4b1c490a4faabb249dda36e9b','31951717036bd39d9bc898a80686f3907ffd8699']) assert(useCases.includes(snap),snap);
assert(cases.includes('usecase-grid'));
assert(cases.includes('CASOS PERSISTIDOS NO CORE'));
assert(cases.includes("API.get('/cases'"));

// LABRA reproduces the source project's four primary React tabs and also exposes its real serve.py runtime.
for(const text of ['Alertas de Fraude','Mapa de Relações','Emitir Diretriz','Heraclitus Explorer','Agente real','dashboard/src/App.jsx','agent/graph_timeline.py','http://127.0.0.1:8770']) assert(labra.includes(text),text);
assert(labra.includes('origin-runtime-frame'));
assert(labra.includes('data-labra-alert'));
assert(labra.includes('labra-relation-graph'));
assert(labra.includes('labra-river-track'));
assert(!/method\s*:\s*['"]POST['"]/i.test(labra),'general LABRA host must not mutate');

// AEB shows the original dashboard.py itself, so globe/telemetry/alerts remain faithful to the source runtime.
for(const text of ['Painel orbital original','dashboard.py','http://127.0.0.1:7480','TLE','SGP4','H × S × E','simular_telemetria()']) assert(aeb.includes(text),text);
assert(aeb.includes('origin-runtime-frame'));
assert(aeb.includes('/aeb-api/data'));

// CGEE shows original painel.html/runtime plus a truthful native timeline based only on runtime events.
for(const text of ['Painel original','Linha do tempo viva','WHY & integridade','painel_server.py','http://127.0.0.1:8000','/cgee-api/timeline?limit=5000']) assert(cgee.includes(text),text);
assert(cgee.includes('cgee-native-heatmap'));
assert(!cgee.includes('gerarEventosSinteticos'));

// Global temporal identity restored from the original dashboard concept, but now with real Core events.
for(const text of ['Temporal Reconstruction Workbench','BARRA TEMPORAL GLOBAL','Temporal Activity Map','52 SEMANAS','Eventos percorridos','Intervalo LSN percorrido',"/security/events?limit=5000"]) assert(time.includes(text),text);
assert(time.includes('for(let i=0;i<364;i++)'));
assert(!time.includes('GOLDEN_DEMO'));
assert(!time.includes('generateActivityMap'));

// Authentication must be part of startup behavior, not a hidden manual-only modal.
assert(app.includes('await LoginModal.bootstrap()'));
assert(login.includes('async bootstrap()'));
assert(login.includes("this.show('auth')"));
assert(login.includes("document.addEventListener('hera:auth-required'"));
assert(runtime.includes("new CustomEvent('hera:auth-required'"));
assert(runtime.includes("'autenticação necessária'"));
assert(login.includes("Core: autenticado (.env)"));

// Trust boundaries and read-only host.
for(const component of fs.readdirSync(path.join(root,'js','components')).filter(f=>f.endsWith('.js'))){const source=read(path.join('js','components',component));assert(!/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(source),`${component} exposes mutating HTTP method`);}
assert(!api.includes('localStorage.setItem'));
assert(!api.includes('sessionStorage'));
assert(api.includes('agentTokenMemory'));
assert(server.includes('RELEASE = "2026.09.15-r10"'));
assert(server.includes('frame-src '));
for(const port of ['8770','7480','8000']) assert(server.includes(port),port);
assert(server.includes('forward_browser_auth=False'));
assert(server.includes('def do_POST(self): self.error(405'));

// Agent Black Box remains a first-class platform module.
assert(agent.includes('/api/v1/agent/status'));
assert(agent.includes('/api/v1/agent/runs'));
assert(agent.includes('bypass_protection'));
assert(redteam.includes('/api/v1/agent/red-team/events'));
assert(redteam.includes('Contrato de verdade'));
assert(app.includes('RedTeamSecurity'));
assert(nav.includes("['redteam','Red Team / Agent Security']"));
assert(server.includes('red-team/events'));

assert(index.includes('2026.09.15-r10'));
assert(index.includes('css/r9.css'));
console.log('Dashboard contracts OK: R10 Cases, temporal identity, startup auth and red-team evidence.');
