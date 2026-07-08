export const ExecPanel = {
  render() {
    return `
      <section id="exec">
        <div class="secttl"><h2>Painel Executivo</h2><span class="tag">Gestão</span></div>
        <p class="sub">Indicadores de alto nível para diretores, SGD/MGI e órgãos de controle.</p>
        <div class="grid k3">
          <div class="kpi ok"><div class="lb">Integridade</div><div class="v" style="font-size:34px">99.9999<small>%</small></div></div>
          <div class="kpi"><div class="lb">Eventos selados</div><div class="v" style="font-size:34px">4.231.880.114</div></div>
          <div class="kpi ok"><div class="lb">Conformidade</div><div class="v" style="font-size:34px">100<small>%</small></div></div>
          <div class="kpi bad"><div class="lb">Incidentes</div><div class="v" style="font-size:34px">4</div></div>
          <div class="kpi ok"><div class="lb">Ataques bloqueados</div><div class="v" style="font-size:34px">283</div></div>
          <div class="kpi"><div class="lb">Último carimbo ICP</div><div class="v" style="font-size:22px">hoje 09:14</div></div>
        </div>
        <div class="card"><h3>Status de saúde jurídica</h3>
          <div class="verify"><span style="font-size:18px">✓</span> db.verify() — cadeia Merkle íntegra, sem violação retroativa detectada. Pronto para auditoria de TCU / CGU / ANPD.</div>
        </div>
      </section>
    `;
  },
  init() {}
};