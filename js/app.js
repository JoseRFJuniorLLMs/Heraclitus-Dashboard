import { GovBar } from './components/GovBar.js';
import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { SOCPanel } from './components/SOCPanel.js';
import { ExecPanel } from './components/ExecPanel.js';
import { Titular } from './components/Titular.js';
import { Fontes } from './components/Fontes.js';
import { Atributos } from './components/Atributos.js';
import { Modos } from './components/Modos.js';
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
  $('#nav').innerHTML = Modos.barra() + Navigation.render();

  const main = $('#main-content');
  main.innerHTML = `
    ${SOCPanel.render()}
    ${ExecPanel.render()}
    ${Titular.render()}
    ${Fontes.render()}
    ${Atributos.render()}
    ${Modos.render()}
    ${TimeMachine.render()}
    ${AttackReplay.render()}
    ${AttackGraph.render()}
    ${CausalInvestigation.render()}
    ${CustodyChain.render()}
    ${MerkleViewer.render()}
    ${CompliancePanel.render()}
    ${ForensicAI.render()}
  `;

  // Marcação central de proveniência. As secções ligadas a dados reais são
  // exatamente estas duas; TODAS as outras mostram dados de demonstração e têm
  // de o dizer — na interface, não só no README.
  //
  // Estava a ser feito de forma dispersa e incompleta: 8 das 10 secções não
  // tinham marca nenhuma, e várias exibiam números grandes e convincentes
  // (12.000.000 de eventos na linha do tempo, 2.200 na conformidade) que um
  // visitante não tinha como distinguir de medições. Fazer isto num sítio só
  // garante que uma secção nova nasce marcada por omissão, em vez de nascer a
  // parecer real.
  const LIGADAS = new Set(['soc', 'exec', 'titular', 'fontes', 'atributos', 'custody', 'auditor']);
  for (const sec of document.querySelectorAll('#main-content > section')) {
    if (LIGADAS.has(sec.id)) continue;
    const titulo = sec.querySelector('.secttl');
    if (!titulo || titulo.querySelector('.tag-demo')) continue;
    const marca = document.createElement('span');
    marca.className = 'tag tag-demo';
    marca.textContent = 'dados de demonstração';
    marca.title =
      'Esta área ainda não está ligada ao HeraclitusDB. Os valores são ' +
      'ilustrativos e não devem ser lidos como medições.';
    titulo.appendChild(marca);
  }

  Header.init();
  Navigation.init();
  SOCPanel.init();
  ExecPanel.init(); // faltava: o painel executivo nunca era inicializado
  Titular.init();
  Fontes.init();
  Atributos.init();
  Modos.init(); // por ultimo: filtra a navegacao ja construida
  TimeMachine.init();
  AttackReplay.init();
  AttackGraph.init();
  CausalInvestigation.init();
  CustodyChain.init();
  MerkleViewer.init();
  CompliancePanel.init();
  ForensicAI.init();
});