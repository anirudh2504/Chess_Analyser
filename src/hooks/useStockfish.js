import { useCallback, useEffect, useRef, useState } from 'react';

const ENGINE_URL = '/stockfish/stockfish-nnue-16-single.js';

function parseInfoLine(line) {
  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  const pvMatch = line.match(/\bpv\s+(.+)$/);

  return {
    score: cpMatch
      ? { type: 'cp', value: Number(cpMatch[1]) }
      : mateMatch
        ? { type: 'mate', value: Number(mateMatch[1]) }
        : null,
    pv: pvMatch ? pvMatch[1].trim().split(/\s+/) : [],
  };
}

export function useStockfish() {
  const workerRef = useRef(null);
  const pendingRef = useRef(null);
  const latestInfoRef = useRef({ score: null, pv: [] });
  const [ready, setReady] = useState(false);
  const [engineError, setEngineError] = useState('');

  useEffect(() => {
    const worker = new Worker(ENGINE_URL);
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data : event.data?.data;
      if (!line) return;

      if (line === 'uciok' || line === 'readyok') {
        setReady(true);
      }

      if (line.startsWith('info')) {
        const parsed = parseInfoLine(line);
        latestInfoRef.current = {
          score: parsed.score || latestInfoRef.current.score,
          pv: parsed.pv.length ? parsed.pv : latestInfoRef.current.pv,
        };
      }

      if (line.startsWith('bestmove') && pendingRef.current) {
        const [, bestMove] = line.split(/\s+/);
        const resolve = pendingRef.current.resolve;
        pendingRef.current = null;
        resolve({
          bestMove: bestMove === '(none)' ? null : bestMove,
          score: latestInfoRef.current.score,
          principalVariation: latestInfoRef.current.pv,
        });
      }
    };

    worker.onerror = () => {
      setEngineError('Stockfish failed to load. Run npm install so the WASM assets are copied into public/stockfish.');
    };

    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyzeFen = useCallback((fen, depth = 14) => {
    if (!workerRef.current) {
      return Promise.reject(new Error('Stockfish is not initialized.'));
    }

    if (pendingRef.current) {
      workerRef.current.postMessage('stop');
      pendingRef.current.reject?.(new Error('Analysis was superseded by a newer position.'));
      pendingRef.current = null;
    }

    latestInfoRef.current = { score: null, pv: [] };

    return new Promise((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      workerRef.current.postMessage('ucinewgame');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    });
  }, []);

  return { ready, engineError, analyzeFen };
}
