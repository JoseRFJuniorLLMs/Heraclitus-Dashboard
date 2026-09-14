const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html'),nav=read('js/components/Navigation.js'),platform=read('css/platform.css'),r9=read('css/r9.css'),app=read('js/app.js');

const cssLinks=[...index.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(cssLinks,['css/styles.css','css/platform.css','css/labra-case.css','css/aeb-case.css','css/cgee-case.css','css/r9.css']);
assert(index.includes('2026.09.14-r9'));
assert(index.includes('class="skip-link"'));
assert(index.includes('<aside id="nav"'));

for(const required of ['nav-rail','nav-context','command-palette','Catálogo de casos','LABRA-AGU','AEB-STREAM','CGEE · Integridade Orçamentária',"const RELEASE = '2026.09.14-r9'"]) assert(nav.includes(required),required);
assert.equal((nav.match(/id:'cases'/g)||[]).length,1,'Cases must be one primary area');
assert(!nav.includes("id:'labra',label:'LABRA-AGU'"));
assert(!nav.includes("id:'aeb',label:'AEB-STREAM'"));
assert(!nav.includes("id:'cgee',label:'CGEE'"));

for(const required of ['.usecase-grid','.origin-runtime-frame','.labra-origin-view','.aeb-origin-view','.cgee-origin-view','.temporal-github-grid','.login-modal-overlay']) assert(r9.includes(required),required);
assert(r9.includes('@media(max-width:760px)'));
assert(platform.includes('html.nav-mobile-open #nav'));
assert(platform.includes('.command-palette'));
assert(app.includes('await LoginModal.bootstrap()'));

console.log('UI shell contracts OK: R9 Cases hierarchy, faithful case frames, temporal workbench, responsive shell and startup auth.');
