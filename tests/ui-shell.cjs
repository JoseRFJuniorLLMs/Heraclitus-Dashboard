const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const index = read('index.html');
const nav = read('js/components/Navigation.js');
const header = read('js/components/Header.js');
const platform = read('css/platform.css');
const labraCss = read('css/labra-case.css');
const aebCss = read('css/aeb-case.css');
const cgeeCss = read('css/cgee-case.css');
const app = read('js/app.js');

const cssLinks = [...index.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(
  cssLinks,
  ['css/styles.css','css/platform.css','css/labra-case.css','css/aeb-case.css','css/cgee-case.css'],
  'runtime must load base shell and isolated use-case stylesheets only'
);
assert.equal(fs.existsSync(path.join(root, 'css', 'soc.css')), false, 'legacy global SOC stylesheet must stay deleted');

for (const required of [
  'const AREAS','nav-rail','nav-context','nav-context-links','command-palette',
  'LABRA-AGU','AEB-STREAM','CGEE','Agent Black Box','Sentinel / SOC','Capacidades & runtime',
  "const RELEASE = '2026.09.14-r8'"
]) assert(nav.includes(required), `navigation architecture is missing ${required}`);
assert(nav.includes('href="#${id}"'), 'contextual destinations must render real href anchors');
assert(!nav.includes('nav-item-copy'));
assert(!nav.includes('nav-scroll'));

assert(!index.includes('govbar-container'));
assert(!app.includes('GovBar'));
assert(index.includes('class="skip-link"'));
assert(index.includes('<aside id="nav"'));
assert(index.includes('id="nav-backdrop"'));
assert(header.includes('header-breadcrumb'));
assert(header.includes('global-search-button'));
assert(header.includes('mobile-nav-toggle'));

for (const required of [
  '.nav-rail','.nav-context','.nav-context-links','.command-palette',
  'html.nav-panel-collapsed .wrap','html.nav-mobile-open #nav','.nav-backdrop',
  '@media (max-width: 900px)','#soc .soc'
]) assert(platform.includes(required), `platform shell CSS is missing ${required}`);

for (const [name,css,prefix] of [
  ['LABRA',labraCss,'.labra-case'],
  ['AEB',aebCss,'.aeb-case'],
  ['CGEE',cgeeCss,'.cgee-case'],
]) {
  assert(css.includes(prefix), `${name} stylesheet missing namespace`);
  assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(css), `${name} CSS leaks a global selector`);
}
assert(labraCss.includes('.labra-case .labra-tabs'));
assert(aebCss.includes('.aeb-case .aeb-architecture'));
assert(cgeeCss.includes('.cgee-case .cgee-tabs'));
assert(cgeeCss.includes('.cgee-case .cgee-hm-grid'));

assert(platform.includes('transform:translateX(-102%)'));
assert(platform.includes('html.nav-mobile-open #nav { transform:translateX(0); }'));

console.log('UI shell contracts OK: R8 rail/context navigation with isolated LABRA, AEB and CGEE surfaces.');
