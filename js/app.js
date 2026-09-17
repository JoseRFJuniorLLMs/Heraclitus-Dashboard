import { RuntimeMonitor } from './runtime.js';
import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { PlatformOverview } from './components/PlatformOverview.js';
import { Capabilities } from './components/Capabilities.js';
import { PublicData } from './components/PublicData.js';
import { AgentBlackBox } from './components/AgentBlackBox.js';
import { RedTeamSecurity } from './components/RedTeamSecurity.js';
import { LabraAguCase } from './components/LabraAguCase.js';
import { AebStreamCase } from './components/AebStreamCase.js';
import { CgeeCase } from './components/CgeeCase.js';
import { FrdCase } from './components/FrdCase.js';
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

document.addEventListener('DOMContentLoaded', async () => {
  $('#header-container').innerHTML = Header.render();
  $('#nav').innerHTML = Navigation.render();
  const commandPalette = document.getElementById('command-palette');
  if (commandPalette) document.body.appendChild(commandPalette);

  $('#main-content').innerHTML = `
    ${PlatformOverview.render()}${Capabilities.render()}${PublicData.render()}${Fontes.render()}${Atributos.render()}
    ${TimeMachine.render()}${Diff.render()}${Cases.render()}${LabraAguCase.render()}${AebStreamCase.render()}${CgeeCase.render()}${FrdCase.render()}
    ${AttackGraph.render()}${AttackReplay.render()}${CausalInvestigation.render()}${CustodyChain.render()}${MerkleViewer.render()}
    ${CompliancePanel.render()}${AgentBlackBox.render()}${RedTeamSecurity.render()}${SOCPanel.render()}${ExecPanel.render()}${Titular.render()}${ForensicAI.render()}${Modos.render()}
  `;

  const modalContainer=document.createElement('div');modalContainer.innerHTML=LoginModal.render();document.body.appendChild(modalContainer);

  Header.init();LoginModal.init();Navigation.init();PlatformOverview.init();Capabilities.init();PublicData.init();Fontes.init();Atributos.init();TimeMachine.init();Diff.init();Cases.init();LabraAguCase.init();AebStreamCase.init();CgeeCase.init();FrdCase.init();AttackGraph.init();AttackReplay.init();CausalInvestigation.init();CustodyChain.init();MerkleViewer.init();CompliancePanel.init();AgentBlackBox.init();RedTeamSecurity.init();SOCPanel.init();ExecPanel.init();Titular.init();ForensicAI.init();Modos.init();

  await LoginModal.bootstrap();
  RuntimeMonitor.init();
});
