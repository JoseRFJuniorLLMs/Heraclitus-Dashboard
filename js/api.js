/**
 * Cliente REST do HeraclitusDB.
 *
 * Regra desta camada: **nunca inventa um número**. Se não conseguir medir,
 * devolve `null` e diz porquê. Quem desenha decide como mostrar a ausência —
 * mas não recebe um valor plausível em vez dela.
 *
 * Endpoints (crates/heraclitus-server/src/rest.rs):
 *   GET /healthz       -> "panta rhei"
 *   GET /stats         -> { head, memtable, vector_indexed, text_indexed,
 *                           graph_nodes, tgraph_edges, entity_keys,
 *                           activation_tracked, views[] }
 *   GET /state         -> head, segmentos, watermarks
 *   GET /verify        -> verificação Merkle do log INTEIRO (relê e re-hasha
 *                         tudo — caro; nunca chamar em temporizador)
 *   GET /live/events   -> SSE com metadados de cada append confirmado
 */

const PADRAO = 'http://127.0.0.1:7475';

/** Distingue os modos de falha em vez de os colapsar num `catch` só. */
export const Falha = {
  TIMEOUT: 'timeout',
  CORS: 'cors',
  REDE: 'rede',
  AUTH: 'auth',
  AUSENTE: 'ausente',
  HTTP: 'http',
  FORMATO: 'formato',
};

export const API = {
  base() {
    return (localStorage.getItem('hera_api') || PADRAO).replace(/\/+$/, '');
  },
  definirBase(v) {
    localStorage.setItem('hera_api', v.replace(/\/+$/, ''));
  },

  /**
   * Credenciais Basic, quando o servidor tem `rest_basic_auth`.
   *
   * Ficam em `sessionStorage` e não em `localStorage`: morrem com o separador.
   * São credenciais de administração de uma base de dados — deixá-las em disco
   * indefinidamente, num painel que pode ficar aberto num ecrã partilhado, é
   * pior do que a inconveniência de as reintroduzir.
   */
  credenciais() {
    return sessionStorage.getItem('hera_auth') || null;
  },
  definirCredenciais(v) {
    if (v) sessionStorage.setItem('hera_auth', v);
    else sessionStorage.removeItem('hera_auth');
  },
  cabecalhos() {
    const c = this.credenciais();
    if (!c) return {};
    // `btoa` só aceita Latin-1: uma password com "ã" ou "€" lançava
    // `InvalidCharacterError`, a exceção subia até ao `catch` genérico do
    // `get`, e o painel diagnosticava "bloqueado por CORS" — mandando o
    // operador afinar o servidor por causa de um acento na password.
    // Codificar em UTF-8 primeiro é o que o RFC 7617 recomenda.
    try {
      const bytes = new TextEncoder().encode(c);
      let bin = '';
      for (const b of bytes) bin += String.fromCharCode(b);
      return { Authorization: 'Basic ' + btoa(bin) };
    } catch {
      return {};
    }
  },

  /**
   * GET com timeout e diagnóstico do erro.
   *
   * O truque do `no-cors`: no browser, uma falha de CORS e uma falha de rede
   * chegam ambas como `TypeError: Failed to fetch` — indistinguíveis. Mas um
   * pedido `mode:'no-cors'` devolve resposta opaca se o servidor estiver mesmo
   * lá. Se o opaco passa e o normal falha, o problema é CORS, não ligação. Sem
   * isto, um servidor a funcionar perfeitamente aparece como "offline" e
   * ninguém percebe porquê.
   */
  async get(caminho, { ms = 4000, texto = false } = {}) {
    const url = this.base() + caminho;
    const ctrl = new AbortController();
    const alarme = setTimeout(() => ctrl.abort(), ms);
    const t0 = performance.now();
    try {
      const r = await fetch(url, {
        cache: 'no-store',
        signal: ctrl.signal,
        headers: this.cabecalhos(),
      });
      const latencia = performance.now() - t0;
      if (!r.ok) {
        const falha =
          r.status === 401 || r.status === 403
            ? Falha.AUTH
            : r.status === 404
              ? Falha.AUSENTE
              : Falha.HTTP;
        // O CORPO de uma resposta de erro é recuperado, não deitado fora. No
        // `/verify` é exatamente aí que vem o motivo da falha de integridade —
        // qual segmento, que raiz não bateu. Descartá-lo deixava o operador
        // com "HTTP 500" e mais nada, no momento em que mais precisa de saber.
        let corpo = null;
        try {
          corpo = await r.json();
        } catch {
          /* corpo não-JSON: fica `null` */
        }
        return { ok: false, falha, estado: r.status, corpo, latencia };
      }
      try {
        const dados = texto ? await r.text() : await r.json();
        return { ok: true, dados, latencia };
      } catch {
        return { ok: false, falha: Falha.FORMATO, latencia };
      }
    } catch (e) {
      const latencia = performance.now() - t0;
      if (e.name === 'AbortError') return { ok: false, falha: Falha.TIMEOUT, latencia };
      try {
        await fetch(url, { mode: 'no-cors', cache: 'no-store' });
        return { ok: false, falha: Falha.CORS, latencia };
      } catch {
        return { ok: false, falha: Falha.REDE, latencia };
      }
    } finally {
      clearTimeout(alarme);
    }
  },

  stats() {
    return this.get('/stats');
  },
  state() {
    return this.get('/state');
  },
  healthz() {
    return this.get('/healthz', { texto: true });
  },
  /** Caro: relê e re-hasha todos os segmentos. Só a pedido explícito. */
  verify() {
    return this.get('/verify', { ms: 120000 });
  },
};

/** Mensagem para humanos, e o que fazer a seguir. */
export function explicarFalha(f, estado) {
  switch (f) {
    case Falha.CORS:
      return {
        curto: 'bloqueado por CORS',
        longo:
          'O servidor responde, mas não autoriza pedidos vindos desta página. ' +
          'Autorizar esta origem em `rest_cors_origins` na configuração do ' +
          'HeraclitusDB, ou servir painel e API na mesma origem (nginx).',
      };
    case Falha.AUTH:
      return {
        curto: 'sem autorização',
        longo:
          'O servidor exige autenticação (`rest_basic_auth`). Clique no selo do ' +
          'topo para introduzir as credenciais — ficam só neste separador.',
      };
    case Falha.AUSENTE:
      return { curto: 'endpoint inexistente', longo: 'O servidor não expõe este caminho.' };
    case Falha.TIMEOUT:
      return { curto: 'sem resposta', longo: 'O servidor não respondeu dentro do tempo limite.' };
    case Falha.REDE:
      return {
        curto: 'sem ligação',
        longo: 'Não foi possível contactar o endereço. O serviço está a correr? O endereço está certo?',
      };
    case Falha.HTTP:
      return { curto: `HTTP ${estado}`, longo: `O servidor respondeu com o estado ${estado}.` };
    case Falha.FORMATO:
      return { curto: 'resposta inválida', longo: 'A resposta não era JSON válido.' };
    default:
      return { curto: 'indisponível', longo: 'Origem de dados indisponível.' };
  }
}

/**
 * Taxa de inserção medida a partir do `head`.
 *
 * O `head` é monotónico e conta registos confirmados, portanto
 * `(head₂ − head₁)/Δt` **é** a taxa de inserção real — não uma estimativa, e
 * não precisa de endpoint novo nenhum.
 *
 * A taxa sai de uma janela (default 5 s) e não de duas amostras seguidas: com
 * sondagem a 1 s, o ruído do agendador faz a diferença entre amostras saltar de
 * forma que não corresponde a nada real.
 */
export class Ritmo {
  constructor({ janelaMs = 5000, maxAmostras = 90 } = {}) {
    this.janelaMs = janelaMs;
    this.maxAmostras = maxAmostras;
    this.amostras = [];
    this.serie = [];
  }

  /** Devolve a taxa (ev/s) ou `null` enquanto não houver duas amostras. */
  registar(head, agora = performance.now()) {
    // Um `head` não numérico (campo em falta, `null`, resposta doutro serviço)
    // envenenaria a série com NaN e o sparkline deixava de desenhar sem dizer
    // porquê. Ignorar a amostra é melhor do que propagar o lixo.
    if (!Number.isFinite(head)) return this.taxa();

    const ultima = this.amostras[this.amostras.length - 1];

    // `head` a recuar significa outro servidor ou log recriado: o histórico
    // deixa de ser comparável e mantê-lo dava taxa negativa ou um pico absurdo.
    if (ultima && head < ultima.head) {
      this.amostras = [];
      this.serie = [];
    }

    this.amostras.push({ t: agora, head });
    if (this.amostras.length > this.maxAmostras) this.amostras.shift();

    const anterior = ultima;
    if (anterior) {
      const dt = (agora - anterior.t) / 1000;
      if (dt > 0 && head >= anterior.head) {
        // Guarda-se o INSTANTE junto com o valor. Sem ele, a leitura do
        // sparkline tinha de assumir "1 amostra = 1 segundo" para dizer
        // "há N s" — e essa premissa quebra-se ao primeiro separador em
        // segundo plano, em que o browser estrangula os temporizadores e as
        // amostras passam a valer minutos.
        this.serie.push({ t: agora, v: (head - anterior.head) / dt });
        if (this.serie.length > this.maxAmostras) this.serie.shift();
      }
    }
    return this.taxa();
  }

  taxa() {
    if (this.amostras.length < 2) return null;
    const fim = this.amostras[this.amostras.length - 1];
    let inicio = this.amostras[0];
    for (const a of this.amostras) {
      if (fim.t - a.t <= this.janelaMs) {
        inicio = a;
        break;
      }
    }
    const dt = (fim.t - inicio.t) / 1000;
    if (dt <= 0) return null;
    const r = (fim.head - inicio.head) / dt;
    return Number.isFinite(r) ? Math.max(0, r) : null;
  }

  limpar() {
    this.amostras = [];
    this.serie = [];
  }
}

/**
 * Fluxo de appends ao vivo (SSE), sobre `fetch` e não sobre `EventSource`.
 *
 * **Porque não `EventSource`:** ele não deixa enviar cabeçalhos. Assim que o
 * servidor tiver `rest_basic_auth` — que é o que produção exige — o fluxo
 * levava 401 e não havia forma de o autenticar sem pôr o segredo no URL, onde
 * acabaria em logs de acesso e no histórico do browser. Além disso o
 * `EventSource` esconde o código HTTP: um 404, um 401 e uma quebra de rede
 * chegam todos como o mesmo `onerror` anónimo, e era impossível dizer ao
 * utilizador o que se passa. Com `fetch` vê-se o estado e envia-se o
 * `Authorization`.
 *
 * O custo é ter de partir o protocolo SSE à mão — são ~20 linhas: blocos
 * separados por linha em branco, linhas `data:` concatenadas.
 */
export function ligarFluxo({ aoEvento, aoEstado }) {
  let ctrl = null;
  let parado = false;
  let tentativa = 0;
  let alarme = null;

  const fechar = () => {
    parado = true;
    // O temporizador de recuo TEM de ser cancelável. Sem isto, um `fechar()`
    // durante a espera deixava um `correr()` agendado que disparava depois e
    // ressuscitava o fluxo — e ao mudar de endpoint ficavam dois fluxos vivos,
    // um deles contra o servidor antigo.
    if (alarme) clearTimeout(alarme);
    alarme = null;
    if (ctrl) ctrl.abort();
    ctrl = null;
  };

  const correr = async () => {
    if (parado) return;
    ctrl = new AbortController();
    let resp;
    try {
      resp = await fetch(API.base() + '/live/events', {
        headers: Object.assign({ Accept: 'text/event-stream' }, API.cabecalhos()),
        cache: 'no-store',
        signal: ctrl.signal,
      });
    } catch (e) {
      if (parado || e.name === 'AbortError') return;
      // Mesmo diagnóstico do `get`: distinguir CORS de rede.
      let falha = Falha.REDE;
      try {
        await fetch(API.base() + '/live/events', { mode: 'no-cors', cache: 'no-store' });
        falha = Falha.CORS;
      } catch {
        /* fica REDE */
      }
      return desistir(falha);
    }

    if (!resp.ok || !resp.body) {
      const f =
        resp.status === 404
          ? Falha.AUSENTE
          : resp.status === 401 || resp.status === 403
            ? Falha.AUTH
            : Falha.HTTP;
      return desistir(f, resp.status);
    }

    tentativa = 0;
    aoEstado({ estado: 'ligado' });

    const leitor = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    try {
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        // O SSE aceita \n\n e \r\n\r\n como fim de bloco.
        buf = buf.replace(/\r\n/g, '\n');
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const bloco = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const dados = bloco
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
          if (!dados) continue; // keep-alive (comentário `:`)
          try {
            aoEvento(JSON.parse(dados));
          } catch {
            /* linha malformada: ignorar em vez de derrubar o fluxo */
          }
        }
      }
    } catch (e) {
      if (parado || e.name === 'AbortError') return;
    }

    if (parado) return;
    // O servidor fechou. Reconectar com recuo, porque aqui já se sabe que o
    // endpoint existe e responde — foi a ligação que caiu.
    aoEstado({ estado: 'reconectando' });
    agendar();
  };

  /**
   * Falhas estruturais (não existe, não autoriza, CORS) NÃO são retentadas: um
   * ciclo contra um 404 só enche a consola e esconde o problema real.
   */
  const desistir = (falha, estado) => {
    const e = explicarFalha(falha, estado);
    aoEstado({ estado: 'indisponivel', falha, motivo: e.longo, curto: e.curto });
  };

  const agendar = () => {
    if (parado) return;
    tentativa = Math.min(tentativa + 1, 6);
    alarme = setTimeout(correr, Math.min(1000 * 2 ** (tentativa - 1), 30000));
  };

  correr();
  return {
    fechar,
    /** Fecha o que estiver aberto antes de reabrir — nunca acumula fluxos. */
    reabrir: () => {
      fechar();
      parado = false;
      tentativa = 0;
      correr();
    },
  };
}
