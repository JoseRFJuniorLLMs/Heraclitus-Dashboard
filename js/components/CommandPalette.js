import { temporal } from '../temporal.js';

export const CommandPalette = {
  render() {
    return `
      <dialog id="command-palette-dialog" class="command-palette">
        <div class="cmd-box">
          <div class="cmd-header">
            <span class="cmd-ico">🔍</span>
            <input id="cmd-input" type="search" placeholder="Digite um comando (ex: Go to LSN 18400000, Compare, Replay, Verify)..." autofocus>
            <kbd>ESC para fechar</kbd>
          </div>
          <div class="cmd-results" id="cmd-results">
            <div class="cmd-item" data-cmd="head"><span class="ic">●</span> Retornar ao HEAD em Tempo Real</div>
            <div class="cmd-item" data-cmd="asof_1840"><span class="ic">⏱</span> AS OF LSN 18,400,000</div>
            <div class="cmd-item" data-cmd="compare"><span class="ic">⇄</span> Comparar Ponto A ↔ Ponto B</div>
            <div class="cmd-item" data-cmd="replay"><span class="ic">▶</span> Iniciar Replay Lab</div>
            <div class="cmd-item" data-cmd="verify"><span class="ic">✓</span> Executar db.verify() Integridade Merkle</div>
            <div class="cmd-item" data-cmd="graph"><span class="ic">⬡</span> Abrir Provenance Explorer</div>
          </div>
        </div>
      </dialog>
    `;
  },

  init() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const dialog = document.getElementById('command-palette-dialog');
        if (dialog) {
          if (dialog.open) dialog.close();
          else dialog.showModal();
        }
      }
    });

    const items = document.querySelectorAll('.cmd-item');
    items.forEach(item => {
      item.onclick = () => {
        const cmd = item.dataset.cmd;
        const dialog = document.getElementById('command-palette-dialog');
        if (dialog) dialog.close();

        if (cmd === 'head') temporal.setMode('HEAD');
        else if (cmd === 'asof_1840') temporal.setCursor(18400000n, 'AS_OF_LSN');
        else if (cmd === 'compare') {
          temporal.setMode('COMPARE');
          const a = document.querySelector('#nav a[data-s="diff"]');
          if (a) a.click();
        }
        else if (cmd === 'replay') {
          temporal.setMode('REPLAY');
          const a = document.querySelector('#nav a[data-s="replay"]');
          if (a) a.click();
        }
        else if (cmd === 'verify') {
          const a = document.querySelector('#nav a[data-s="merkle"]');
          if (a) a.click();
        }
        else if (cmd === 'graph') {
          const a = document.querySelector('#nav a[data-s="graph"]');
          if (a) a.click();
        }
      };
    });
  }
};
