export const GovBar = {
  render() {
    return `
      <div class="govbar" style="background: #0C326F; color: #fff; font-size: 12px; padding: 6px 20px; display: flex; gap: 14px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <b style="font-weight: 800; letter-spacing: 0.5px; color: #FFCD07; font-size: 14px;">gov.br</b>
        <span class="dot" style="width: 6px; height: 6px; border-radius: 50%; background: #168821; display: inline-block;"></span>
        <span style="font-weight: 600; opacity: 0.9;">Plataforma de Integridade Orçamentária & Evidência Digital · Uso Oficial</span>
      </div>
    `;
  }
};