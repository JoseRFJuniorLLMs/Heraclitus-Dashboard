const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'js/components/Navigation.js'), 'utf8');
const platform = fs.readFileSync(path.join(root, 'css/platform.css'), 'utf8');

const cssLinks = [...index.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(cssLinks, ['css/styles.css', 'css/platform.css'], 'runtime must load only the base and platform shell stylesheets');
assert.equal(fs.existsSync(path.join(root, 'css', 'soc.css')), false, 'legacy global SOC stylesheet must stay deleted');

for (const required of [
  '.nav-shell', '.nav-head', '.nav-scroll', '.nav-footer', '#nav a.active',
  'html.nav-collapsed .wrap', '@media (max-width: 900px)', '#soc .soc'
]) {
  assert(platform.includes(required), `platform shell CSS is missing ${required}`);
}

for (const required of [
  'nav-shell', 'nav-toggle', 'aria-current', 'Platform Console', '2026.09.14-r3'
]) {
  assert(nav.includes(required), `navigation shell is missing ${required}`);
}

// Guard against the exact regression that produced the broken screenshot:
// a module stylesheet loaded after the platform base with global element rules.
const cssDir = path.join(root, 'css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
assert.deepEqual(cssFiles.sort(), ['platform.css', 'styles.css']);

console.log('UI shell contracts OK: single global shell, isolated SOC, collapsible responsive navigation.');
