from pathlib import Path

# App wiring.
p=Path('js/app.js'); t=p.read_text()
if "RedTeamSecurity" not in t:
    t=t.replace("import { AgentBlackBox } from './components/AgentBlackBox.js';\n", "import { AgentBlackBox } from './components/AgentBlackBox.js';\nimport { RedTeamSecurity } from './components/RedTeamSecurity.js';\n",1)
    t=t.replace("${CompliancePanel.render()}${AgentBlackBox.render()}${SOCPanel.render()}", "${CompliancePanel.render()}${AgentBlackBox.render()}${RedTeamSecurity.render()}${SOCPanel.render()}",1)
    t=t.replace("CompliancePanel.init();AgentBlackBox.init();SOCPanel.init();", "CompliancePanel.init();AgentBlackBox.init();RedTeamSecurity.init();SOCPanel.init();",1)
p.write_text(t)

# Navigation and release.
p=Path('js/components/Navigation.js'); t=p.read_text()
t=t.replace("const RELEASE = '2026.09.14-r9';", "const RELEASE = '2026.09.15-r10';")
old="{id:'agent',label:'Agent Black Box',icon:ICONS.agent,defaultRoute:'agent',description:'Runs, ferramentas, policy e evidência de agentes.',routes:[['agent','Agent Black Box']]},"
new="{id:'agent',label:'Agent Black Box',icon:ICONS.agent,defaultRoute:'agent',description:'Runs, ferramentas, policy, evidência e qualificação adversarial de agentes.',routes:[['agent','Agent Black Box'],['redteam','Red Team / Agent Security']]},"
if "['redteam','Red Team / Agent Security']" not in t:
    if old not in t: raise SystemExit('agent nav marker missing')
    t=t.replace(old,new,1)
p.write_text(t)

# Read-only proxy route. Dashboard only reads the evidence endpoint; the attack
# runner writes directly to the Agent API.
p=Path('server.py'); t=p.read_text()
t=t.replace('RELEASE = "2026.09.14-r9"','RELEASE = "2026.09.15-r10"')
t=t.replace('server_version="HeraclitusDashboard/9"','server_version="HeraclitusDashboard/10"')
t=t.replace('"User-Agent":"Heraclitus-Dashboard/9"','"User-Agent":"Heraclitus-Dashboard/10"')
old='r"evidence/[A-Za-z0-9_.:-]+(?:/proof)?|policies(?:/[A-Za-z0-9_.:-]+)?|approvals(?:/[A-Za-z0-9_.:-]+)?))$"'
new='r"evidence/[A-Za-z0-9_.:-]+(?:/proof)?|red-team/events|policies(?:/[A-Za-z0-9_.:-]+)?|approvals(?:/[A-Za-z0-9_.:-]+)?))$"'
if 'red-team/events' not in t:
    if old not in t: raise SystemExit('agent read regex marker missing')
    t=t.replace(old,new,1)
p.write_text(t)

# Browser shell carries the same release identity.
p=Path('index.html'); t=p.read_text().replace('2026.09.14-r9','2026.09.15-r10'); p.write_text(t)

# Contract tests. Current file groups declarations on a single line, so patch
# that exact shape instead of assuming one declaration per line.
p=Path('tests/contracts.cjs'); t=p.read_text()
t=t.replace("const login=read('js/components/LoginModal.js'),agent=read('js/components/AgentBlackBox.js'),api=read('js/api.js'),server=read('server.py'),index=read('index.html');",
            "const login=read('js/components/LoginModal.js'),agent=read('js/components/AgentBlackBox.js'),redteam=read('js/components/RedTeamSecurity.js'),api=read('js/api.js'),server=read('server.py'),index=read('index.html');")
t=t.replace('// R9 product architecture:', '// R10 product architecture:')
t=t.replace("assert(nav.includes(\"const RELEASE = '2026.09.14-r9'\"));", "assert(nav.includes(\"const RELEASE = '2026.09.15-r10'\"));")
t=t.replace("assert(server.includes('RELEASE = \"2026.09.14-r9\"'));", "assert(server.includes('RELEASE = \"2026.09.15-r10\"'));")
t=t.replace("assert(index.includes('2026.09.14-r9'));", "assert(index.includes('2026.09.15-r10'));")
anchor="assert(agent.includes('bypass_protection'));"
if "redteam.includes('/api/v1/agent/red-team/events')" not in t:
    if anchor not in t: raise SystemExit('contracts assertion marker missing')
    t=t.replace(anchor,anchor+"\nassert(redteam.includes('/api/v1/agent/red-team/events'));\nassert(redteam.includes('Contrato de verdade'));\nassert(app.includes('RedTeamSecurity'));\nassert(nav.includes(\"['redteam','Red Team / Agent Security']\"));\nassert(server.includes('red-team/events'));",1)
t=t.replace("console.log('Dashboard contracts OK: R9 Cases hub, source-faithful LABRA/AEB/CGEE, temporal identity and startup authentication.');",
            "console.log('Dashboard contracts OK: R10 Cases, temporal identity, startup auth and red-team evidence.');")
p.write_text(t)

# README product surface.
p=Path('README.md'); t=p.read_text()
t=t.replace('## Navegação R9','## Navegação R10')
if 'Red Team / Agent Security' not in t:
    t=t.replace('├── Agent Black Box\n', '├── Agent Black Box\n│   └── Red Team / Agent Security\n',1)
    t += '''\n\n## Red Team / Agent Security\n\nA tela `#redteam` lê `/api/v1/agent/red-team/events` pela superfície Agent somente-leitura. Ela mostra apenas eventos reais persistidos pelo Agent Evidence log. O Dashboard não injeta ataques, não escreve approvals e não ativa policies.\n\nA UI distingue explicitamente telemetria do runner (`redteam_lab`) de decisões nativas do Gateway. Um registro do laboratório prova a persistência daquele relato no HRKL; o bloqueio real é corroborado por `PolicyEvaluated`, `ToolDenied`, approvals, `ExternalEffectObserved` e pelo delta do upstream.\n'''
p.write_text(t)

print('dashboard R10 red-team patch applied')
