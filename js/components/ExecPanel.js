/**
 * Painel Executivo.
 *
 * Este é o painel que o próprio subtítulo destina a *"diretores, SGD/MGI e
 * órgãos de controle"* — e era o pior do produto. Tinha **seis** valores
 * fixos no código (integridade 99,9999%, 4.231.880.114 eventos selados,
 * conformidade 100%, 4 incidentes, 283 ataques bloqueados, carimbo ICP "hoje
 * 09:14") e o `init()` estava vazio: nunca fez um único pedido a nada.
 *
 * O mais grave não era nenhum dos números. Era esta frase, também fixa:
 *
 *   "db.verify() — cadeia Merkle íntegra, sem violação retroativa detectada.
 *    Pronto para auditoria de TCU / CGU / ANPD."
 *
 * Uma afirmação de integridade criptográfica, nomeando órgãos de controlo
 * federais, escrita à mão e nunca verificada. Numa plataforma que se vende como
 * produtora de provas jurídicas, isso não é uma maquete: é uma alegação falsa
 * sobre a prova.
 *
 * Agora: o que é medido vem do `/stats`; a integridade vem do `/verify` e só
 * quando alguém a manda correr; o resto está marcado como sem fonte.
 *
 * Escuta os eventos que o `SOCPanel` publica (`hera:stats`, `hera:verify`), em
 * vez de sondar por conta própria — dois painéis a bater no mesmo endpoint em
 * temporizadores independentes seria o dobro do tráfego para o mesmo número.
 */

const SEM_FONTE = '—';

export const ExecPanel = {
  render() {
    const semFonte = (porque) =>
      `title="Sem origem de dados no servidor. ${porque}" data-semfonte="1"`;

    return `
      <section id="exec">
        <div class="secttl"><h2>Painel Executivo</h2><span class="tag">Gestão</span></div>
        <p class="sub">Indicadores de alto nível para diretores, SGD/MGI e órgãos de controle.</p>
        <div class="grid k3">
          <div class="kpi" id="ex-integ-card">
            <div class="lb">Integridade <span class="fonte">Merkle, a pedido</span></div>
            <div class="v" id="ex-integ" style="font-size:26px">não verificado</div>
          </div>
          <div class="kpi ok">
            <div class="lb">Eventos no log <span class="fonte"><code>head</code></span></div>
            <div class="v" id="ex-head" style="font-size:34px">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Exigiria um motor de avaliação de conformidade; ainda não existe.')}>
            <div class="lb">Conformidade</div>
            <div class="v" style="font-size:34px">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Exigiria correlação de incidentes; ainda não existe.')}>
            <div class="lb">Incidentes</div>
            <div class="v" style="font-size:34px">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Viria do gateway de ingestão, não do log; ainda não ligado.')}>
            <div class="lb">Ataques bloqueados</div>
            <div class="v" style="font-size:34px">${SEM_FONTE}</div>
          </div>
          <div class="kpi" ${semFonte('Viria dos recibos RFC 3161 em <code>/tier/receipts</code>; ainda não ligado.')}>
            <div class="lb">Último carimbo ICP</div>
            <div class="v" style="font-size:22px">${SEM_FONTE}</div>
          </div>
        </div>
        <div class="card">
          <h3>Status de saúde jurídica</h3>
          <div class="verify" id="ex-juridico">
            <span style="font-size:18px">○</span>
            <span>
              <strong>Não verificado nesta sessão.</strong>
              A cadeia Merkle só pode ser declarada íntegra depois de
              <code>db.verify()</code> correr de facto. Use “Verificar agora” na
              Central de Comando; o resultado aparece aqui, com a hora.
            </span>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    document.addEventListener('hera:stats', (e) => this.aplicar(e.detail));
    document.addEventListener('hera:sem-ligacao', () => this.limpar());
    document.addEventListener('hera:verify', (e) => this.aplicarVerificacao(e.detail));
  },

  aplicar(s) {
    const el = document.getElementById('ex-head');
    if (el) el.textContent = Number.isFinite(s?.head) ? Number(s.head).toLocaleString('pt-BR') : SEM_FONTE;
  },

  limpar() {
    const el = document.getElementById('ex-head');
    if (el) el.textContent = SEM_FONTE;
  },

  /**
   * `estado`: `{ ok: boolean, quando: string, detalhe: string }` ou
   * `{ erro: string }`. Nunca se declara íntegro sem um `ok === true` vindo de
   * uma chamada real ao `/verify`.
   */
  aplicarVerificacao(estado) {
    const v = document.getElementById('ex-integ');
    const cartao = document.getElementById('ex-integ-card');
    const juridico = document.getElementById('ex-juridico');
    if (!v || !juridico) return;

    if (estado?.erro) {
      v.textContent = 'não verificado';
      cartao.className = 'kpi';
      juridico.innerHTML =
        `<span style="font-size:18px">○</span><span><strong>Verificação falhou:</strong> ${escapar(estado.erro)}. ` +
        'Sem resultado, não há afirmação a fazer sobre a cadeia.</span>';
      return;
    }

    if (estado?.ok) {
      v.textContent = 'íntegro';
      cartao.className = 'kpi ok';
      juridico.innerHTML =
        `<span style="font-size:18px">✓</span><span><strong>Cadeia Merkle íntegra</strong> — verificada em ` +
        `${escapar(estado.quando || 'agora')}. ${escapar(estado.detalhe || '')} ` +
        '<em>Vale para este instante e para o estado verificado; não é um selo permanente.</em></span>';
    } else {
      v.textContent = 'FALHA';
      cartao.className = 'kpi bad';
      juridico.innerHTML =
        '<span style="font-size:18px">✕</span><span><strong>Falha de integridade detetada.</strong> ' +
        'A cadeia Merkle não confere. Isto é um incidente — preservar o estado e escalar.</span>';
    }
  },
};

const escapar = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
