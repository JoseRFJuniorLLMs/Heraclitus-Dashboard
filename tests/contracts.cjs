const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');

const app=read('js/app.js'), runtime=read('js/runtime.js'), nav=read('js/components/Navigation.js'), header=read('js/components/Header.js'), time=read('js/components/TimeMachine.js');
const caps=read('js/components/Capabilities.js'), agent=read('js/components/AgentBlackBox.js'), publicData=read('js/components/PublicData.js');
const labra=read('js/components/LabraAguCase.js'), labraCss=read('css/labra-case.css');
const aeb=read('js/components/AebStreamCase.js'), aebCss=read('css/aeb-case.css');
const cgee=read('js/components/CgeeCase.js'), cgeeCss=read('css/cgee-case.css');
const why=read('js/components/CausalInvestigation.js'), replay=read('js/components/AttackReplay.js'), soc=read('js/components/SOCPanel.js');
const ai=read('js/components/ForensicAI.js'), comp=read('js/components/CompliancePanel.js'), titular=read('js/components/Titular.js');
const api=read('js/api.js'), login=read('js/components/LoginModal.js'), index=read('index.html');
const platformCss=read('css/platform.css');

// Product identity: HeraclitusDB is the platform; use cases are first-class but subordinate surfaces.
for (const required of [
  'PlatformOverview.render()','Capabilities.render()','PublicData.render()','AgentBlackBox.render()',
  'LabraAguCase.render()','AebStreamCase.render()','CgeeCase.render()',
  'LabraAguCase.init()','AebStreamCase.init()','CgeeCase.init()'
]) assert(app.includes(required), required);
for (const required of ['Agent Black Box','Sentinel / SOC','LABRA-AGU','AEB-STREAM','CGEE','Capacidades & runtime',"id:'labra'","id:'aeb'","id:'cgee'"]) assert(nav.includes(required), required);
assert(caps.includes('Analytics / DataFusion / Arrow Flight'));
assert(caps.includes('Raft / cluster'));
assert(caps.includes('Agent Evidence & Control'));

// Navigation architecture and release observability.
for (const required of ["id:'data'","id:'investigate'","id:'evidence'","id:'governance'",'command-palette','Ctrl K',"const RELEASE = '2026.09.14-r8'"]) assert(nav.includes(required), required);
assert(header.includes('header-breadcrumb'));
assert(header.includes('global-search-button'));
assert(index.includes('hera-dashboard-release'));
assert(index.includes('2026.09.14-r8'));
assert(index.includes('class="skip-link"'));
for (const css of ['css/styles.css','css/platform.css','css/labra-case.css','css/aeb-case.css','css/cgee-case.css']) assert(index.includes(css), css);
assert(!index.includes('css/soc.css'));
assert(!index.includes('govbar-container'));
assert(!fs.existsSync(path.join(root,'css','soc.css')));
assert(!fs.existsSync(path.join(root,'js','components','GovBar.js')));
assert(platformCss.includes('html.nav-panel-collapsed .wrap'));
assert(platformCss.includes('html.nav-mobile-open #nav'));
assert(platformCss.includes('#soc .soc'));

// LABRA remains versioned and isolated.
assert(labra.includes("const SNAPSHOT = '9b5d9bcada759e23e12c2d995be17dca6e42a8e1'"));
assert(labra.includes('/labra-api/health'));
assert(labra.includes('/labra-api/devedores'));
assert(!labra.includes('<iframe'));
assert(labraCss.includes('.labra-case'));
assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(labraCss), 'LABRA stylesheet leaks global selectors');

// AEB-STREAM remains versioned with honest real/simulated boundaries.
assert(aeb.includes("const SNAPSHOT = 'b8e9de466e9071a4b1c490a4faabb249dda36e9b'"));
assert(aeb.includes('SGP4'));
assert(aeb.includes('simular_telemetria()'));
assert(aeb.includes('TLE/órbita:'));
assert(aeb.includes('/aeb-api/data'));
assert(aeb.includes('TERMICA_SALTO'));
assert(!aeb.includes('<iframe'));
assert(aebCss.includes('.aeb-case'));
assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(aebCss), 'AEB stylesheet leaks global selectors');

// CGEE is a pinned budget-integrity use case. The GitHub-style temporal spine is real-runtime only.
assert(cgee.includes("const SNAPSHOT = '31951717036bd39d9bc898a80686f3907ffd8699'"));
assert(cgee.includes('CASO DE USO · INTEGRIDADE ORÇAMENTÁRIA E VIAGEM NO TEMPO'));
assert(cgee.includes('heatmap diário estilo GitHub'));
assert(cgee.includes('ingest_amostra.py'));
assert(cgee.includes('val_acrescimo - val_reducao'));
assert(cgee.includes('/cgee-api/stats'));
assert(cgee.includes('/cgee-api/timeline?limit=2500'));
assert(cgee.includes('/cgee-api/verify'));
assert(cgee.includes('/cgee-api/why?portaria='));
assert(cgee.includes('Nenhum dado sintético foi injetado'));
assert(cgee.includes('Uma cadeia causal mais profunda exige o backend causal'));
assert(!cgee.includes('<iframe'));
assert(cgeeCss.includes('.cgee-case .cgee-hm-grid'));
assert(cgeeCss.includes('#216e39'));
assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(cgeeCss), 'CGEE stylesheet leaks global selectors');

// Runtime architecture: one shared Core heartbeat; Sentinel owns route-scoped SSE.
assert(app.includes("import { RuntimeMonitor } from './runtime.js'"));
assert(app.includes('RuntimeMonitor.init()'));
assert(runtime.includes('API.stats()'));
assert(runtime.includes("new CustomEvent('hera:stats'"));
assert(runtime.includes('POLL_HIDDEN_MS'));
assert(!soc.includes('API.stats()'));
assert(!soc.includes('setInterval('));
assert(soc.includes("event.detail?.route === 'soc'"));
assert(soc.includes('this.fecharFluxo()'));

// General dashboard is genuinely read-only.
for (const component of fs.readdirSync(path.join(root,'js','components')).filter(f => f.endsWith('.js'))) {
  const source = read(path.join('js','components',component));
  assert(!/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(source), `${component} exposes a mutating HTTP method`);
}
assert(!titular.includes('/eliminar'));
assert(titular.includes('Console read-only'));

// No synthetic forensic claims in generic platform surfaces.
assert(!time.includes('gerarEventosSinteticos'));
assert(!time.includes('EVENTOS_FALBACK'));
assert(!replay.includes('INC-2026-0012'));
assert(!why.includes('Servidor caiu'));
assert(!ai.includes('db.verify ✓'));
assert(!comp.includes('todos os segmentos íntegros'));

// Agent Black Box contract.
assert(agent.includes('/api/v1/agent/status'));
assert(agent.includes('/api/v1/agent/runs'));
assert(agent.includes('q.dados.entries'));
assert(agent.includes('bypass_protection'));

// Public provenance contract.
assert(publicData.includes('EXTERNAL_UNSEALED'));
assert(publicData.includes('heraclitus.external-observation/v1'));
assert(publicData.includes("crypto.subtle.digest('SHA-256'"));

// Credentials remain memory-only and identity planes remain separated.
assert(!api.includes('sessionStorage'));
assert(!api.includes('localStorage.setItem'));
assert(api.includes('agentTokenMemory'));
assert(api.includes("Authorization:`Bearer ${agentTokenMemory}`"));
assert(login.includes('Bearer/OIDC Agent'));
assert(login.includes('Não reutilizamos o Basic do Core no Agent'));

assert(index.includes('js/app.js'));
console.log('Dashboard contracts OK: R8 platform-first with LABRA, AEB and CGEE use cases; temporal truth and read-only trust boundaries enforced.');
