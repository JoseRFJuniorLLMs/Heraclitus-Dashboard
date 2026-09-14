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
const app = read('js/app.js');

const cssLinks = [...index.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(cssLinks, ['css/styles.css', 'css/platform.css', 'css/labra-case.css'], 'runtime must load the base shell and isolated use-case stylesheet only');
assert.equal(fs.existsSync(path.join(root, 'css', 'soc.css')), false, 'legacy global SOC stylesheet must stay deleted');

// Information architecture: global rail + contextual pane, not a flat mega-menu.
for (const required of [
  'const AREAS', 'nav-rail', 'nav-context', 'nav-context-links', 'command-palette',
  'LABRA-AGU', 'Agent Black Box', 'Sentinel / SOC', 'Capacidades & runtime', "const RELEASE = '2026.09.14-r6'"
]) {
  assert(nav.includes(required), `navigation architecture is missing ${required}`);
}
assert(nav.includes('href="#${id}"'), 'contextual destinations must render real href anchors');
assert(!nav.includes('nav-item-copy'), 'legacy flat sidebar item-with-hint pattern must not return');
assert(!nav.includes('nav-scroll'), 'legacy all-items scroll container must not return');

// Global chrome is singular: no extra top identity strip.
assert(!index.includes('govbar-container'));
assert(!app.includes('GovBar'));
assert(index.includes('class="skip-link"'));
assert(index.includes('<aside id="nav"'));
assert(index.includes('id="nav-backdrop"'));
assert(header.includes('header-breadcrumb'));
assert(header.includes('global-search-button'));
assert(header.includes('mobile-nav-toggle'));

for (const required of [
  '.nav-rail', '.nav-context', '.nav-context-links', '.command-palette',
  'html.nav-panel-collapsed .wrap', 'html.nav-mobile-open #nav', '.nav-backdrop',
  '@media (max-width: 900px)', '#soc .soc'
]) {
  assert(platform.includes(required), `platform shell CSS is missing ${required}`);
}

// LABRA owns only its case-use namespace. It may not redefine the application shell.
assert(labraCss.includes('.labra-case .labra-hero'));
assert(labraCss.includes('.labra-case .labra-tabs'));
assert(labraCss.includes('.labra-case .labra-architecture'));
assert(!/(^|})\s*(?:body|header|nav|main|aside|html|\*)\b/.test(labraCss), 'LABRA CSS leaks a global selector into the platform shell');

// Mobile navigation is a drawer. The old horizontal mega-menu must not return.
assert(platform.includes('transform:translateX(-102%)'));
assert(platform.includes('html.nav-mobile-open #nav { transform:translateX(0); }'));

console.log('UI shell contracts OK: R6 rail/context navigation, LABRA isolated case surface, command palette, breadcrumb and mobile drawer.');
