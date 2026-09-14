const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'), nav=read('js/components/Navigation.js'), header=read('js/components/Header.js'), time=read('js/components/TimeMachine.js');
const caps=read('js/components/Capabilities.js'), agent=read('js/components/AgentBlackBox.js'), publicData=read('js/components/PublicData.js');
const why=read('js/components/CausalInvestigation.js'), replay=read('js/components/AttackReplay.js');
const ai=read('js/components/ForensicAI.js'), comp=read('js/components/CompliancePanel.js');
const api=read('js/api.js'), login=read('js/components/LoginModal.js'), index=read('index.html');
const platformCss=read('css/platform.css');

// Product identity: HeraclitusDB is the platform, modules remain modules.
assert(app.includes('PlatformOverview.render()'));
assert(app.includes('Capabilities.render()'));
assert(app.includes('PublicData.render()'));
assert(app.includes('AgentBlackBox.render()'));
assert(nav.includes('Agent Black Box'));
assert(nav.includes('Sentinel / SOC'));
assert(nav.includes('Capacidades & runtime'));
assert(caps.includes('Analytics / DataFusion / Arrow Flight'));
assert(caps.includes('Raft / cluster'));
assert(caps.includes('Agent Evidence & Control'));

// Navigation architecture: task-oriented rail + contextual children + command palette.
assert(nav.includes("id: 'data'"));
assert(nav.includes("id: 'investigate'"));
assert(nav.includes("id: 'evidence'"));
assert(nav.includes("id: 'governance'"));
assert(nav.includes('command-palette'));
assert(nav.includes('Ctrl K'));
assert(nav.includes("const RELEASE = '2026.09.14-r4'"));
assert(header.includes('header-breadcrumb'));
assert(header.includes('global-search-button'));
assert(index.includes('hera-dashboard-release'));
assert(index.includes('2026.09.14-r4'));
assert(index.includes('class="skip-link"'));
assert(index.includes('css/styles.css'));
assert(index.includes('css/platform.css'));
assert(!index.includes('css/soc.css'));
assert(!index.includes('govbar-container'));
assert(!fs.existsSync(path.join(root,'css','soc.css')));
assert(platformCss.includes('html.nav-panel-collapsed .wrap'));
assert(platformCss.includes('html.nav-mobile-open #nav'));
assert(platformCss.includes('#soc .soc'));
assert(platformCss.includes('@media (max-width: 900px)'));

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
console.log('Dashboard contracts OK: platform-first, contextual navigation R4, no synthetic claims, public provenance and separate Agent auth.');
