const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'), nav=read('js/components/Navigation.js'), time=read('js/components/TimeMachine.js');
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
assert(nav.indexOf('Visão geral') < nav.indexOf('Sentinel / SOC'));
assert(nav.includes('Capacidades & runtime'));
assert(nav.includes('Agent Black Box'));
assert(caps.includes('Analytics / DataFusion / Arrow Flight'));
assert(caps.includes('Raft / cluster'));
assert(caps.includes('Agent Evidence & Control'));

// Shell/UI contract: one global navigation system, collapsible, release-identifiable.
assert(nav.includes('nav-shell'));
assert(nav.includes('nav-toggle'));
assert(nav.includes("const RELEASE = '2026.09.14-r3'"));
assert(index.includes('hera-dashboard-release'));
assert(index.includes('2026.09.14-r3'));
assert(index.includes('css/styles.css'));
assert(index.includes('css/platform.css'));
assert(!index.includes('css/soc.css'));
assert(!fs.existsSync(path.join(root,'css','soc.css')));
assert(platformCss.includes('html.nav-collapsed .wrap'));
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
console.log('Dashboard contracts OK: platform-first, single shell, responsive nav, no synthetic claims, public provenance and separate Agent auth.');
