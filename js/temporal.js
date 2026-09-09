/**
 * Global Temporal Context for Heraclitus Temporal Reconstruction Workbench.
 * Encapsulates single temporal state shared across all components:
 * - mode: 'HEAD' | 'AS_OF_LSN' | 'AS_OF_SYSTEM_TIME' | 'VALID_TIME' | 'COMPARE' | 'REPLAY'
 * - cursor: { lsn: BigInt, hlc: BigInt, systemTimeMs: Number, validTime: String }
 * - range: { a: TemporalPoint, b: TemporalPoint }
 * - axis: 'LSN' | 'SYSTEM_TIME' | 'VALID_TIME'
 */

export class TemporalState {
  constructor() {
    this.listeners = new Set();
    this.headLsn = 18492102n;
    this.mode = 'HEAD';
    this.axis = 'LSN';
    this.cursor = {
      lsn: 18492102n,
      hlc: 1172238140029n,
      systemTimeMs: Date.now(),
      validTime: new Date().toISOString()
    };
    this.range = {
      a: { lsn: 18200000n, label: 'Point A (LSN 18,200,000)' },
      b: { lsn: 18492102n, label: 'Point B (HEAD)' }
    };
    this.filters = {
      source: '',
      kind: '',
      entity: '',
      search: ''
    };
    this.replay = {
      playing: false,
      speed: 1,
      timer: null
    };

    this._readUrlParams();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(eventKey = 'update') {
    this._updateUrlParams();
    for (const listener of this.listeners) {
      try {
        listener(this, eventKey);
      } catch (err) {
        console.error('TemporalState listener error:', err);
      }
    }
  }

  setHeadLsn(lsn) {
    this.headLsn = BigInt(lsn);
    if (this.mode === 'HEAD') {
      this.cursor.lsn = this.headLsn;
    }
    this.notify('head');
  }

  setCursor(lsn, mode = 'AS_OF_LSN') {
    const val = BigInt(lsn);
    if (val > this.headLsn) {
      this.cursor.lsn = this.headLsn;
      this.mode = 'HEAD';
    } else if (val === this.headLsn) {
      this.cursor.lsn = this.headLsn;
      this.mode = 'HEAD';
    } else {
      this.cursor.lsn = val;
      this.mode = mode;
    }
    this.notify('cursor');
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'HEAD') {
      this.cursor.lsn = this.headLsn;
    }
    this.notify('mode');
  }

  setRangeA(lsn) {
    this.range.a.lsn = BigInt(lsn);
    this.notify('range');
  }

  setRangeB(lsn) {
    this.range.b.lsn = BigInt(lsn);
    this.notify('range');
  }

  setAxis(axis) {
    this.axis = axis;
    this.notify('axis');
  }

  stepBack(count = 1n) {
    const next = this.cursor.lsn - count;
    if (next >= 0n) {
      this.setCursor(next, 'AS_OF_LSN');
    }
  }

  stepForward(count = 1n) {
    const next = this.cursor.lsn + count;
    if (next <= this.headLsn) {
      this.setCursor(next, next === this.headLsn ? 'HEAD' : 'AS_OF_LSN');
    }
  }

  togglePlay(onStep) {
    if (this.replay.playing) {
      this.pauseReplay();
    } else {
      this.startReplay(onStep);
    }
  }

  startReplay(onStep) {
    this.replay.playing = true;
    this.mode = 'REPLAY';
    this.notify('replay_start');
    const intervalMs = Math.max(20, 200 / this.replay.speed);
    this.replay.timer = setInterval(() => {
      if (this.cursor.lsn >= this.headLsn) {
        this.pauseReplay();
        return;
      }
      this.cursor.lsn += BigInt(Math.max(1, Math.floor(10 * this.replay.speed)));
      if (this.cursor.lsn > this.headLsn) this.cursor.lsn = this.headLsn;
      if (onStep) onStep(this.cursor.lsn);
      this.notify('cursor');
    }, intervalMs);
  }

  pauseReplay() {
    this.replay.playing = false;
    if (this.replay.timer) {
      clearInterval(this.replay.timer);
      this.replay.timer = null;
    }
    this.notify('replay_pause');
  }

  setSpeed(speed) {
    this.replay.speed = speed;
    this.notify('replay_speed');
  }

  isHistory() {
    return this.mode !== 'HEAD' && this.cursor.lsn < this.headLsn;
  }

  _readUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('lsn')) this.cursor.lsn = BigInt(params.get('lsn'));
      if (params.has('mode')) this.mode = params.get('mode');
      if (params.has('a')) this.range.a.lsn = BigInt(params.get('a'));
      if (params.has('b')) this.range.b.lsn = BigInt(params.get('b'));
      if (params.has('axis')) this.axis = params.get('axis');
    } catch (e) {
      // url parse fallback
    }
  }

  _updateUrlParams() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', this.mode);
      url.searchParams.set('lsn', this.cursor.lsn.toString());
      url.searchParams.set('a', this.range.a.lsn.toString());
      url.searchParams.set('b', this.range.b.lsn.toString());
      url.searchParams.set('axis', this.axis);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }
}

export const temporal = new TemporalState();
window.temporal = temporal;
