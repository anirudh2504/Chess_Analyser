const ENGINE_URL = '/stockfish/stockfish-18-lite-single.js';

function parseInfoLine(line) {
  if (!line.startsWith('info') || line.includes(' string ') || line.includes(' bound')) return null;
  const depth = line.match(/\bdepth (\d+)/);
  const multipv = line.match(/\bmultipv (\d+)/);
  const cp = line.match(/\bscore cp (-?\d+)/);
  const mate = line.match(/\bscore mate (-?\d+)/);
  const pv = line.match(/\bpv\s+(.+)$/);
  if (!depth || (!cp && !mate) || !pv) return null;

  return {
    depth: Number(depth[1]),
    multipv: multipv ? Number(multipv[1]) : 1,
    score: cp ? { type: 'cp', value: Number(cp[1]) } : { type: 'mate', value: Number(mate[1]) },
    pv: pv[1].trim().split(/\s+/),
  };
}

class EngineWorker {
  constructor(url) {
    this.worker = new Worker(url);
    this.job = null;
    this.lines = [];
    this.multiPv = 1;
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.worker.onerror = () => reject(new Error('Stockfish failed to load. Run npm install so the WASM assets are copied into public/stockfish.'));
    });
    this.worker.onmessage = (event) => this.handleLine(typeof event.data === 'string' ? event.data : event.data?.data);
    this.send('uci');
    this.send('setoption name Hash value 32');
    this.send('isready');
  }

  send(command) {
    this.worker.postMessage(command);
  }

  handleLine(line) {
    if (!line) return;
    if (line === 'readyok') {
      this.resolveReady?.();
      this.resolveReady = null;
      return;
    }

    const info = parseInfoLine(line);
    if (info && this.job) {
      this.lines[info.multipv - 1] = info;
      return;
    }

    if (line.startsWith('bestmove') && this.job) {
      const [, bestMove] = line.split(/\s+/);
      const { resolve, cancelled } = this.job;
      const lines = this.lines.filter(Boolean);
      this.job = null;
      this.lines = [];
      if (!cancelled) resolve({ bestMove: bestMove === '(none)' ? null : bestMove, lines });
      this.onIdle?.();
    }
  }

  run({ fen, depth, multiPv, resolve, reject }) {
    this.job = { resolve, reject, cancelled: false };
    this.lines = [];
    if (multiPv !== this.multiPv) {
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.multiPv = multiPv;
    }
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
  }

  cancel() {
    if (!this.job) return;
    this.job.cancelled = true;
    this.job.reject(new Error('cancelled'));
    this.send('stop');
  }

  terminate() {
    this.worker.terminate();
  }
}

/**
 * A small pool of single-threaded Stockfish workers. Positions are independent, so analysing
 * several at once gives near-linear speedup without needing SharedArrayBuffer/COOP headers.
 */
export class StockfishPool {
  constructor(size = defaultPoolSize()) {
    this.workers = Array.from({ length: size }, () => new EngineWorker(ENGINE_URL));
    this.queue = [];
    this.workers.forEach((worker) => {
      worker.onIdle = () => this.pump();
    });
    this.ready = Promise.all(this.workers.map((worker) => worker.ready));
  }

  analyze(fen, { depth = 16, multiPv = 1, priority = false } = {}) {
    return new Promise((resolve, reject) => {
      const job = { fen, depth, multiPv, resolve, reject };
      if (priority) this.queue.unshift(job);
      else this.queue.push(job);
      this.pump();
    });
  }

  pump() {
    for (const worker of this.workers) {
      if (!this.queue.length) return;
      if (!worker.job) worker.run(this.queue.shift());
    }
  }

  cancelAll() {
    const pending = this.queue.splice(0);
    pending.forEach((job) => job.reject(new Error('cancelled')));
    this.workers.forEach((worker) => worker.cancel());
  }

  terminate() {
    this.cancelAll();
    this.workers.forEach((worker) => worker.terminate());
  }
}

function defaultPoolSize() {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
  return Math.max(1, Math.min(6, cores - 1));
}
