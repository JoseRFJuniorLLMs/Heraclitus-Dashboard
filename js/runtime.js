import { API, explicarFalha } from './api.js';

const POLL_VISIBLE_MS = 2000;
const POLL_HIDDEN_MS = 10000;

/**
 * Platform-wide health/stats monitor.
 *
 * Sentinel is a module, so it must not secretly own the heartbeat that feeds
 * the rest of the console. This service performs one shared /stats poll and
 * broadcasts a stable event consumed by Overview, Executive and Sentinel.
 */
export const RuntimeMonitor = {
  timer: null,
  inFlight: false,
  online: null,

  init() {
    const schedule = () => {
      clearTimeout(this.timer);
      const wait = document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS;
      this.timer = setTimeout(async () => {
        await this.poll();
        schedule();
      }, wait);
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.poll();
      schedule();
    });
    document.addEventListener('hera:endpoint-mudou', () => this.poll(true));

    this.poll();
    schedule();
  },

  async poll(force = false) {
    if (this.inFlight && !force) return;
    this.inFlight = true;
    try {
      const response = await API.stats();
      if (!response.ok) {
        this.applyOffline(response);
        return;
      }
      this.applyOnline(response);
    } finally {
      this.inFlight = false;
    }
  },

  applyOnline(response) {
    this.online = true;
    window.LIVE = true;
    const connection = document.getElementById('conn');
    const label = document.getElementById('connlbl');
    if (connection) connection.className = 'conn live';
    if (label) label.textContent = `core · ${Math.round(response.latencia || 0)} ms`;

    document.dispatchEvent(new CustomEvent('hera:stats', {
      detail: { ...(response.dados || {}), _latencia: response.latencia || 0 }
    }));
  },

  applyOffline(response) {
    const changed = this.online !== false;
    this.online = false;
    window.LIVE = false;
    const failure = explicarFalha(response.falha, response.estado);
    const connection = document.getElementById('conn');
    const label = document.getElementById('connlbl');
    if (connection) connection.className = 'conn demo';
    if (label) label.textContent = failure.curto;

    if (changed) {
      document.dispatchEvent(new CustomEvent('hera:sem-ligacao', {
        detail: { ...response, explicacao: failure }
      }));
    }
  },
};
