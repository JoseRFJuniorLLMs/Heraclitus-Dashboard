import { API, explicarFalha } from '../api.js';

/**
 * Mapa de atributos — matéria-prima do registo de operações de tratamento
 * (LGPD art. 37).
 *
 * O art. 37 obriga o controlador a manter registo das operações de tratamento.
 * Na prática isso vive quase sempre numa folha de cálculo mantida à mão, que
 * descreve o que alguém se lembrou de escrever — e que envelhece no dia em que
 * um sistema novo começa a gravar um campo que ninguém anotou.
 *
 * Este ecrã inverte a direção: lista o que está **mesmo** no log. Se um serviço
 * começou a gravar `cpf` sem ninguém avisar, aparece aqui.
 *
 * ## Só nomes e contagens
 *
 * Nunca valores. Listar os valores de um campo `cpf` seria despejar os CPFs
 * todos num ecrã — um mapa de tratamento não pode ser a fuga que documenta.
 *
 * ## O que isto não é
 *
 * Não é um ROPA. Falta-lhe a base legal, a finalidade, o prazo de retenção e o
 * responsável por cada operação — que são decisões humanas, não deriváveis do
 * log. É o inventário técnico sobre o qual esse documento se escreve.
 */

/**
 * Campos que costumam carregar dado pessoal, para destacar no mapa.
 *
 * Em português **e** inglês, porque o log real mistura os dois: a primeira
 * versão desta lista era só portuguesa e deixava passar `actor_name` e
 * `actor_id`, que são exatamente os campos que identificam pessoas neste
 * sistema. Uma lista de deteção que só cobre metade das convenções do próprio
 * projeto dá uma falsa sensação de mapa completo.
 */
const SENSIVEIS = [
  // pt
  'cpf', 'cnpj', 'rg', 'nome', 'email', 'telefone', 'celular', 'endereco',
  'nascimento', 'titulo_eleitor', 'pis', 'nis', 'cns', 'matricula', 'titular',
  // en
  'name', 'actor', 'user', 'subject', 'phone', 'address', 'birth', 'ssn',
  // rede — identificam indiretamente
  'ip', 'mac', 'device', 'session',
];

export const Atributos = {
  render() {
    return `
      <section id="atributos">
        <div class="secttl">
          <h2>Mapa de dados</h2>
          <span class="tag">LGPD · art. 37</span>
        </div>
        <p class="sub">
          Que categorias de dados estão realmente a ser tratadas, derivadas do log —
          não de um documento mantido à mão.
        </p>

        <div class="grid k4">
          <div class="kpi ok">
            <div class="lb">Campos indexados</div>
            <div class="v" id="at-campos">—</div>
          </div>
          <div class="kpi" id="at-sens-card">
            <div class="lb">Possível dado pessoal</div>
            <div class="v" id="at-sensiveis">—</div>
          </div>
          <div class="kpi">
            <div class="lb">Valores distintos <span class="fonte">soma</span></div>
            <div class="v" id="at-valores">—</div>
          </div>
          <div class="kpi">
            <div class="lb">Titulares distintos <span class="fonte"><code>_agent</code></span></div>
            <div class="v" id="at-titulares">—</div>
          </div>
        </div>

        <div class="card">
          <h3>Campos no log <span class="pill b" id="at-selo">—</span></h3>
          <p class="nota">
            <strong>Só nomes e contagens.</strong> Os valores nunca saem daqui: listar o
            conteúdo de um campo <code>cpf</code> transformaria o mapa de conformidade na
            maior fuga do sistema.
          </p>
          <table id="at-tab">
            <thead><tr><th>Campo</th><th>Valores distintos</th><th>Classificação</th></tr></thead>
            <tbody><tr><td colspan="3" class="vazio">A carregar…</td></tr></tbody>
          </table>
        </div>

        <div class="card">
          <h3>O que falta para ser um ROPA</h3>
          <p class="nota">
            Isto é o inventário <strong>técnico</strong>. Um registo de operações de
            tratamento precisa ainda de <strong>base legal</strong>, <strong>finalidade</strong>,
            <strong>prazo de retenção</strong> e <strong>responsável</strong> por cada
            operação — decisões humanas, que não se derivam do log. O valor deste ecrã é
            garantir que esse documento não descreve um sistema diferente do que está a
            correr.
          </p>
        </div>

        <div id="at-aviso" class="aviso" role="alert" aria-live="polite" hidden></div>
      </section>
    `;
  },

  init() {
    this.carregar();
  },

  async carregar() {
    const corpo = document.querySelector('#at-tab tbody');
    const selo = document.getElementById('at-selo');
    if (!corpo) return;

    const r = await API.get('/atributos', { ms: 30000 });
    if (!r.ok) {
      const e = explicarFalha(r.falha, r.estado);
      selo.className = 'pill y';
      selo.textContent = 'indisponível';
      corpo.innerHTML = `<tr><td colspan="3" class="vazio">${esc(e.longo)}</td></tr>`;
      return;
    }

    const campos = (r.dados.campos || []).filter((c) => c.campo !== '_agent');
    const agente = (r.dados.campos || []).find((c) => c.campo === '_agent');

    const suspeitos = campos.filter((c) => marcado(c.campo));
    const total = campos.reduce((a, c) => a + Number(c.valores_distintos || 0), 0);

    txt('at-campos', String(campos.length));
    txt('at-sensiveis', String(suspeitos.length));
    txt('at-valores', total.toLocaleString('pt-BR'));
    txt('at-titulares', agente ? Number(agente.valores_distintos).toLocaleString('pt-BR') : '—');

    const card = document.getElementById('at-sens-card');
    if (card) card.className = suspeitos.length ? 'kpi warn' : 'kpi';

    selo.className = campos.length ? 'pill g' : 'pill b';
    selo.textContent = `${campos.length} campo(s)`;

    corpo.innerHTML = campos.length
      ? campos
          .map(
            (c) => `<tr>
              <td class="mono">${esc(c.campo)}</td>
              <td class="mono">${Number(c.valores_distintos).toLocaleString('pt-BR')}</td>
              <td>${
                marcado(c.campo)
                  ? '<span class="pill y">possível dado pessoal</span>'
                  : '<span class="pill b">técnico</span>'
              }</td>
            </tr>`
          )
          .join('')
      : '<tr><td colspan="3" class="vazio">Nenhum campo indexado. Se o log tem eventos com atributos, o índice pode precisar de rebuild.</td></tr>';

    const aviso = document.getElementById('at-aviso');
    if (suspeitos.length) {
      aviso.hidden = false;
      // A classificação é por NOME, não por conteúdo — e isso tem de ser dito.
      // Um campo `documento` com CPFs lá dentro não é apanhado; um campo
      // `ip_servidor` é marcado sem ser dado pessoal de ninguém.
      aviso.innerHTML =
        `<strong>${suspeitos.length} campo(s) com nome típico de dado pessoal:</strong> ` +
        suspeitos.map((c) => `<code>${esc(c.campo)}</code>`).join(', ') +
        '. <em>A classificação é pelo NOME do campo, não pelo conteúdo</em> — um campo ' +
        'chamado <code>documento</code> cheio de CPFs não é apanhado, e um <code>ip_servidor</code> ' +
        'é marcado sem ser dado pessoal de ninguém. Serve para levantar a pergunta, não para a responder.';
    } else {
      aviso.hidden = true;
    }
  },
};

/**
 * Correspondência por PALAVRA, não por substring.
 *
 * A primeira versão usava `includes()` e marcava
 * `__heraclitus_authenticated_principal` como dado pessoal — porque `ip` casa
 * dentro de pr**in**c**ip**al. Tokens de duas letras (`ip`, `rg`, `cns`) fazem
 * isso com meio dicionário. Um classificador que grita em campos técnicos
 * treina o operador a ignorar os avisos, que é pior do que não os dar.
 *
 * Parte-se o nome pelos separadores habituais (`_`, `-`, `.`, camelCase) e
 * compara-se token a token. `actor_name` casa em `actor` e `name`;
 * `principal` não casa em nada.
 */
const marcado = (campo) => {
  const tokens = String(campo)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens.some((t) => SENSIVEIS.includes(t));
};
const txt = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};
const esc = (s) =>
  String(s ?? '—').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
