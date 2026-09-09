import { temporal } from './temporal.js';
import { GovBar } from './components/GovBar.js';
import { Header } from './components/Header.js';
import { TemporalSpine } from './components/TemporalSpine.js';
import { Navigation } from './components/Navigation.js';
import { TemporalExplorer } from './components/TemporalExplorer.js';
import { StateExplorer } from './components/StateExplorer.js';
import { Diff } from './components/Diff.js';
import { ProvenanceExplorer } from './components/ProvenanceExplorer.js';
import { CausalWaterfall } from './components/CausalWaterfall.js';
import { ReplayLab } from './components/ReplayLab.js';
import { MerkleViewer } from './components/MerkleViewer.js';
import { ViewWatermarks } from './components/ViewWatermarks.js';
import { SOCPanel } from './components/SOCPanel.js';
import { ExecPanel } from './components/ExecPanel.js';
import { Fontes } from './components/Fontes.js';
import { CustodyChain } from './components/CustodyChain.js';
import { CommandPalette } from './components/CommandPalette.js';

window.$ = s => document.querySelector(s);
window.$$ = s => document.querySelectorAll(s);
window.fmt = n => n.toLocaleString('pt-BR');

document.addEventListener("DOMContentLoaded", async () => {
  // Render containers
  const gov = $('#govbar-container');
  if (gov) gov.innerHTML = GovBar.render();

  const hdr = $('#header-container');
  if (hdr) hdr.innerHTML = Header.render();

  const spineContainer = $('#temporal-spine-container');
  if (spineContainer) spineContainer.innerHTML = TemporalSpine.render();

  const nav = $('#nav');
  if (nav) nav.innerHTML = Navigation.render();

  const cmdPal = $('#command-palette-container');
  if (cmdPal) cmdPal.innerHTML = CommandPalette.render();

  const main = $('#main-content');
  if (main) {
    main.innerHTML = `
      ${TemporalExplorer.render()}
      ${StateExplorer.render()}
      ${Diff.render()}
      ${ProvenanceExplorer.render()}
      ${CausalWaterfall.render()}
      ${ReplayLab.render()}
      ${MerkleViewer.render()}
      ${ViewWatermarks.render()}
      ${SOCPanel.render()}
      ${ExecPanel.render()}
      ${Fontes.render()}
      ${CustodyChain.render()}
    `;
  }

  // Initialize interactive components
  Header.init();
  TemporalSpine.init();
  Navigation.init();
  TemporalExplorer.init();
  StateExplorer.init();
  Diff.init();
  ProvenanceExplorer.init();
  CausalWaterfall.init();
  ReplayLab.init();
  MerkleViewer.init();
  ViewWatermarks.init();
  SOCPanel.init();
  ExecPanel.init();
  Fontes.init();
  CustodyChain.init();
  CommandPalette.init();

  // Check URL parameters for view navigation
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam) {
    const navItem = document.querySelector(`#nav a[data-s="${viewParam}"]`);
    if (navItem) navItem.click();
  }
});