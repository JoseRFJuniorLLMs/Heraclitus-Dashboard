import { RuntimeMonitor } from './runtime.js';
import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { PlatformOverview } from './components/PlatformOverview.js';
import { Capabilities } from './components/Capabilities.js';
import { PublicData } from './components/PublicData.js';
import { AgentBlackBox } from './components/AgentBlackBox.js';
import { LabraAguCase } from './components/LabraAguCase.js';
import { SOCPanel } from './components/SOCPanel.js';
import { ExecPanel } from './components/ExecPanel.js';
import { Titular } from './components/Titular.js';
import { Fontes } from './components/Fontes.js';
import { Atributos } from './components/Atributos.js';
import { Modos } from './components/Modos.js';
import { Diff } from './components/Diff.js';
import { Cases } from './components/Cases.js';
import { TimeMachine } from './components/TimeMachine.js';
import { AttackReplay } from './components/AttackReplay.js';
import { AttackGraph } from './components/AttackGraph.js';
import { CausalInvestigation } from './components/CausalInvestigation.js';
import { CustodyChain } from './components/CustodyChain.js';
import { MerkleViewer } from './components/MerkleViewer.js';
import { CompliancePanel } from './components/CompliancePanel.js';
import { ForensicAI } from './components/ForensicAI.js';
import { LoginModal } from './components/LoginModal.js';

window.$ = selector => document.querySelector(selector);
window.$$ = selector => document.querySelectorAll(selector);
window.fmt = number => Number(number).toLocaleString('pt-BR');
window.LIVE = false;

document.addEventListener('DOMContentLoaded', () => {
  $('#header-container').innerHTML = Header.render();
  $('#nav').innerHTML = Navigation.render();

  // A command palette é global. Mantê-la dentro do drawer faria o `transform`
  // mobile arrastar um `position: fixed` para fora da viewport.
  const commandPalette = document.getElementById('command-palette');
  if (commandPalette) document.body.appendChild(commandPalette);

  $('#main-content').innerHTML = `
    ${PlatformOverview.render()}
    ${Capabilities.render()}
    ${PublicData.render()}
    ${Fontes.render()}
    ${Atributos.render()}
    ${TimeMachine.render()}
    ${Diff.render()}
    ${Cases.render()}
    ${LabraAguCase.render()}
    ${AttackGraph.render()}
    ${AttackReplay.render()}
    ${CausalInvestigation.render()}
    ${CustodyChain.render()}
    ${MerkleViewer.render()}
    ${CompliancePanel.render()}
    ${AgentBlackBox.render()}
    ${SOCPanel.render()}
    ${ExecPanel.render()}
    ${Titular.render()}
    ${ForensicAI.render()}
    ${Modos.render()}
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = LoginModal.render();
  document.body.appendChild(modalContainer);

  Header.init();
  LoginModal.init();
  Navigation.init();
  PlatformOverview.init();
  Capabilities.init();
  PublicData.init();
  Fontes.init();
  Atributos.init();
  TimeMachine.init();
  Diff.init();
  Cases.init();
  LabraAguCase.init();
  AttackGraph.init();
  AttackReplay.init();
  CausalInvestigation.init();
  CustodyChain.init();
  MerkleViewer.init();
  CompliancePanel.init();
  AgentBlackBox.init();
  SOCPanel.init();
  ExecPanel.init();
  Titular.init();
  ForensicAI.init();
  Modos.init();

  // Start the single shared heartbeat only after every interested component
  // has registered its listeners, so the first stats sample is never lost.
  RuntimeMonitor.init();
});
