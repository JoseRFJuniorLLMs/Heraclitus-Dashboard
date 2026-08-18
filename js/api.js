/**
 * Cliente REST do HeraclitusDB.
 *
 * Regra desta camada: **nunca inventa um número**. Se não conseguir medir,
 * devolve `null` e diz porquê. Quem desenha decide como mostrar a ausência —
 * mas não recebe um valor plausível em vez dela.
 *
 * Endpoints reais do servidor (crates/heraclitus-server/src/rest.rs):
 *   GET /healthz            -> "panta rhei"
 *   GET /stats              -> { head, memtable, vector_indexed, text_indexed,
 *                                graph_nodes, tgraph_edges, entity_keys,
 *                                activation_tracked, views[] }
 *   GET /state              -> head, segmentos (id/versão/selado/raiz Merkle), watermarks
 *   GET /verify             -> verificação Merkle do log INTEIRO (relê e re-hasha
 *                              tudo — caro; nunca chamar em temporizador)
 *   GET /live/events        -> SSE com o fluxo de appends (AINDA NÃO EXISTE no
 *                              servidor; ver `estadoDoFluxo`)
 */

const PADRAO = 'http://127.0.0.1:7475';

/** Distingue os modos de falha em vez de os colapsar num `catch` só. */
export const Falha = {
  TIMEOUT: 'timeout',
  CORS: 'cors',
  REDE: 'rede',
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
   * GET com timeout e diagnóstico do erro.
   *
   * O truque do `no-cors`: no browser, uma falha de CORS e uma falha de rede
   * chegam ambas como `TypeError: Failed to fetch` — indistinguíveis. Mas um
   * pedido `mode:'no-cors'` devolve uma resposta opaca se o servidor estiver
   * mesmo lá. Se o opaco passa e o normal falha, o problema é CORS, não
   * ligação. Sem isto, um servidor a funcionar perfeitamente aparece como
   * "offline" e ninguém percebe porquê.
   */
  async get(caminho, { ms = 4000, texto = false } = {}) {
    const url = this.base() + caminho;
    const ctrl = new AbortController();
    const alarme = setTimeout(() => ctrl.abort(), ms);
    const t0 = performance.now();
    try {
      const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      const latencia = performance.now() - t0;
      if (!r.ok) {
        return { ok: false, falha: Falha.HTTP, estado: r.status, latencia };
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
      // Distinguir CORS de rede.
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
          'O REST do HeraclitusDB não envia `Access-Control-Allow-Origin`. ' +
          'Servir o painel na mesma origem (nginx) ou autorizar esta origem na config do servidor.',
      };
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
 * O `head` é monotónico e conta os registos confirmados, portanto
 * `(head₂ − head₁) / Δt` **é** a taxa de inserção real — não uma estimativa.
 * Não é preciso endpoint novo nenhum para a obter.
 *
 * A taxa mostrada é calculada sobre uma janela (default 5 s) em vez de sobre
 * duas amostras seguidas: com polling de 1 s, o ruído do agendador faz a
 * diferença entre amostras saltar de forma que não corresponde a nada real.
 */
export class Ritmo {
  constructor({ janelaMs = 5000, maxAmostras = 90 } = {}) {
    this.janelaMs = janelaMs;
    this.maxAmostras = maxAmostras;
    this.amostras = []; // { t, head }
    this.serie = []; // taxa instantânea por amostra, para o sparkline
  }

  /** Devolve a taxa (ev/s) ou `null` enquanto não houver duas amostras. */
  registar(head, agora = performance.now()) {
    const ultima = this.amostras[this.amostras.length - 1];

    // `head` a recuar significa outro servidor ou log recriado: o histórico
    // anterior deixa de ser comparável e mantê-lo produziria uma taxa negativa
    // ou um pico absurdo.
    if (ultima && head < ultima.head) {
      this.amostras = [];
      this.serie = [];
    }

    this.amostras.push({ t: agora, head });
    if (this.amostras.length > this.maxAmostras) this.amostras.shift();

    if (ultima) {
      const dt = (agora - ultima.t) / 1000;
      if (dt > 0) {
        this.serie.push(Math.max(0, (head - ultima.head) / dt));
        if (this.serie.length > this.maxAmostras) this.serie.shift();
      }
    }

    return this.taxa();
  }

  taxa() {
    if (this.amostras.length < 2) return null;
    const fim = this.amostras[this.amostras.length - 1];
    // A amostra mais antiga ainda dentro da janela.
    let inicio = this.amostras[0];
    for (const a of this.amostras) {
      if (fim.t - a.t <= this.janelaMs) {
        inicio = a;
        break;
      }
    }
    const dt = (fim.t - inicio.t) / 1000;
    if (dt <= 0) return null;
    return Math.max(0, (fim.head - inicio.head) / dt);
  }

  limpar() {
    this.amostras = [];
    this.serie = [];
  }
}

/**
 * Fluxo de appends ao vivo (SSE).
 *
 * O log já emite cada append confirmado num broadcast interno
 * (`Log::tail_subscribe`, heraclitus-log/src/lib.rs:1091) — falta só um
 * endpoint que o exponha. Enquanto o servidor não tiver `/live/events`, isto
 * reporta `indisponivel` e **não** entra em ciclo de reconexão: um 404 em
 * repetição só enche a consola e esconde o problema real.
 */
export function ligarFluxo({ aoEvento, aoEstado }) {
  let fonte = null;
  let vivo = false;

  const fechar = () => {
    if (fonte) {
      fonte.close();
      fonte = null;
    }
  };

  const abrir = () => {
    fechar();
    try {
      fonte = new EventSource(API.base() + '/live/events');
    } catch {
      aoEstado({ estado: 'indisponivel', motivo: 'O browser não conseguiu abrir o fluxo.' });
      return;
    }

    fonte.onopen = () => {
      vivo = true;
      aoEstado({ estado: 'ligado' });
    };

    fonte.onmessage = (m) => {
      try {
        aoEvento(JSON.parse(m.data));
      } catch {
        /* linha malformada: ignorar em vez de derrubar o fluxo */
      }
    };

    fonte.onerror = () => {
      // O EventSource não expõe o código HTTP. Se nunca chegou a abrir, o
      // endpoint provavelmente não existe — desiste e diz isso, em vez de
      // reconectar para sempre contra um 404.
      if (!vivo) {
        fechar();
        aoEstado({
          estado: 'indisponivel',
          motivo:
            'O servidor não expõe `/live/events`. O fluxo de appends existe no ' +
            'log (Log::tail_subscribe) mas ainda não tem endpoint HTTP.',
        });
      } else {
        aoEstado({ estado: 'reconectando' });
      }
    };
  };

  abrir();
  return { fechar, reabrir: abrir };
}
