import { GovBar } from './components/GovBar.js';
import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { SOCPanel } from './components/SOCPanel.js';
import { ExecPanel } from './components/ExecPanel.js';
import { TimeMachine } from './components/TimeMachine.js';
import { AttackReplay } from './components/AttackReplay.js';
import { AttackGraph } from './components/AttackGraph.js';
import { CausalInvestigation } from './components/CausalInvestigation.js';
import { CustodyChain } from './components/CustodyChain.js';
import { MerkleViewer } from './components/MerkleViewer.js';
import { CompliancePanel } from './components/CompliancePanel.js';
import { ForensicAI } from './components/ForensicAI.js';

window.$ = s => document.querySelector(s);
window.$$ = s => document.querySelectorAll(s);
window.fmt = n => n.toLocaleString('pt-BR');
window.LIVE = false;

document.addEventListener("DOMContentLoaded", async () => {
  $('#govbar-container').innerHTML = GovBar.render();
  $('#header-container').innerHTML = Header.render();
  $('#nav').innerHTML = Navigation.render();

  const main = $('#main-content');
  main.innerHTML = `
    ${SOCPanel.render()}
    ${ExecPanel.render()}
    ${TimeMachine.render()}
    ${AttackReplay.render()}
    ${AttackGraph.render()}
    ${CausalInvestigation.render()}
    ${CustodyChain.render()}
    ${MerkleViewer.render()}
    ${CompliancePanel.render()}
    ${ForensicAI.render()}
  `;

  Header.init();
  Navigation.init();
  SOCPanel.init();
  TimeMachine.init();
  AttackReplay.init();
  AttackGraph.init();
  CausalInvestigation.init();
  CustodyChain.init();
  MerkleViewer.init();
  CompliancePanel.init();
  ForensicAI.init();
});