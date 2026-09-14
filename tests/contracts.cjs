const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'), runtime=read('js/runtime.js'), nav=read('js/components/Navigation.js'), header=read('js/components/Header.js'), time=read('js/components/TimeMachine.js');
const caps=read('js/components/Capabilities.js'), agent=read('js/components/AgentBlackBox.js'), publicData=read('js/components/PublicData.js');
const labra=read('js/components/LabraAguCase.js'), labraCss=read('css/labra-case.css');
const why=read('js/components/CausalInvestigation.js'), replay=read('js/components/AttackReplay.js'), soc=read('js/components/SOCPanel.js');
const ai=read('js/components/ForensicAI.js'), comp=read('js/components/CompliancePanel.js'), titular=read('js/components/Titular.js');
const api=read('js/api.js'), login=read('js/components/LoginModal.js'), index=read('index.html');
const platformCss=read('css/platform.css');

// Product identity: HeraclitusDB is the platform, modules/use-cases remain subordinate surfaces.
assert(app.includes('PlatformOverview.render()'));
assert(app.includes('Capabilities.render()'));
assert(app.includes('PublicData.render()'));
assert(app.includes('AgentBlackBox.render()'));
assert(app.includes('LabraAguCase.render()'));
assert(app.includes('LabraAguCase.init()'));
assert(nav.includes('Agent Black Box'));
assert(nav.includes('Sentinel / SOC'));
assert(nav.includes('LABRA-AGU'));
assert(nav.includes("id:'labra'"));
assert(nav.includes('Capacidades & runtime'));
assert(caps.includes('Analytics / DataFusion / Arrow Flight'));
assert(caps.includes('Raft / cluster'));
assert(caps.includes('Agent Evidence & Control'));

// Navigation architecture: task-oriented rail + contextual children + command palette.
assert(nav.includes("id:'data'"));
assert(nav.includes("id:'investigate'"));
assert(nav.includes("id:'evidence'"));
assert(nav.includes("id:'governance'"));
assert(nav.includes('command-palette'));
assert(nav.includes('Ctrl K'));
assert(nav.includes("const RELEASE = '2026.09.14-r6'"));
assert(header.includes('header-breadcrumb'));
assert(header.includes('global-search-button'));
assert(index.includes('hera-dashboard-release'));
assert(index.includes('2026.09.14-r6'));
assert(index.includes('class="skip-link"'));
assert(index.includes('css/styles.css'));
assert(index.includes('css/platform.css'));
assert(index.includes('css/labra-case.css'));
assert(!index.includes('css/soc.css'));
assert(!index.includes('govbar-container'));
assert(!fs.existsSync(path.join(root,'css','soc.css')));
assert(!fs.existsSync(path.join(root,'js','components','GovBar.js')));
assert(platformCss.includes('html.nav-panel-collapsed .wrap'));
assert(platformCss.includes('html.nav-mobile-open #nav'));
assert(platformCss.includes('#soc .soc'));
assert(platformCss.includes('@media (max-width: 900px)'));

// LABRA-AGU is a versioned first-class use case, not an iframe or unpinned remote blob.
assert(labra.includes("const SNAPSHOT = '9b5d9bcada759e23e12c2d995be17dca6e42a8e1'"));
assert(labra.includes('CASO DE USO · RECUPERAÇÃO DE ATIVOS'));
assert(labra.includes('pipeline.py'));
assert(labra.includes('HeraclitusDB'));
assert(labra.includes('triangulacao_offshore'));
assert(labra.includes('evaluation/harness.py'));
assert(labra.includes('/labra-api/health'));
assert(labra.includes('/labra-api/devedores'));
assert(!labra.includes('<iframe'));
assert(labraCss.includes('.labra-case'));
assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(labraCss), 'LABRA stylesheet must not own global shell selectors');

// Runtime architecture: one shared Core heartbeat; Sentinel owns only its route-scoped SSE.
assert(app.includes("import { RuntimeMonitor } from './runtime.js'"));
assert(app.includes('RuntimeMonitor.init()'));
assert(runtime.includes('API.stats()'));
assert(runtime.includes("new CustomEvent('hera:stats'"));
assert(runtime.includes('POLL_HIDDEN_MS'));
assert(!soc.includes('API.stats()'));
assert(!soc.includes('setInterval('));
assert(soc.includes("event.detail?.route === 'soc'"));
assert(soc.includes('this.fecharFluxo()'));
assert(!soc.includes('drawMap('));
assert(!soc.includes('Topologia'));

// General dashboard is genuinely read-only. No component may sneak in a write.
for (const component of fs.readdirSync(path.join(root,'js','components')).filter(f => f.endsWith('.js'))) {
  const source = read(path.join('js','components',component));
  assert(!/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(source), `${component} exposes a mutating HTTP method`);
}
assert(!titular.includes('/eliminar'));
assert(titular.includes('Console read-only'));

// No synthetic forensic claims.
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

// Credentials remain memory-only and Core != Agent identity plane.
assert(!api.includes('sessionStorage'));
assert(!api.includes('localStorage.setItem'));
assert(api.includes('agentTokenMemory'));
assert(api.includes("Authorization:`Bearer ${agentTokenMemory}`"));
assert(login.includes('Bearer/OIDC Agent'));
assert(login.includes('Não reutilizamos o Basic do Core no Agent'));

assert(index.includes('js/app.js'));
console.log('Dashboard contracts OK: R6 platform-first, LABRA-AGU case use, Agent/Sentinel isolation, read-only UI and public provenance.');
