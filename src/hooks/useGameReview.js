import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { StockfishPool } from '../engine/stockfishPool';
import { fromEngineScore, winChanceFor } from '../analysis/evaluation';
import { loadOpeningBook } from '../analysis/openings';
import { computeAccuracy, countClassifications, reviewMove } from '../analysis/review';
import { epd, moveToUci, playLine } from '../analysis/tactics';
import { metadataFromHeaders, parsePgnToTimeline } from '../utils/pgnParser';

export const DEPTH_PRESETS = { fast: 12, standard: 16, deep: 20 };

function terminalAnalysis(fen) {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return { fen, eval: { type: 'mate', value: 0, winner }, lines: [], bestMove: null, terminal: true };
  }
  if (chess.isGameOver()) {
    return { fen, eval: { type: 'cp', value: 0 }, lines: [], bestMove: null, terminal: true };
  }
  return null;
}

// Engine results are cached per (depth, multiPv, position) for the session, and whole-game reviews
// are saved in localStorage, so reopening a game or reloading the page never re-runs the engine.
const positionCache = new Map();
const STORAGE_PREFIX = 'chess-analyser:review:v1:';

function gameKey(fens, depth) {
  let hash = 5381;
  const text = fens.join('|');
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
  return `${STORAGE_PREFIX}${depth}:${fens.length}:${(hash >>> 0).toString(36)}`;
}

function loadSavedReview(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : null;
  } catch {
    return null;
  }
}

function saveReview(key, positions) {
  try {
    localStorage.setItem(key, JSON.stringify(positions));
  } catch {
    // Storage full or blocked: drop older saved reviews and try once more.
    try {
      Object.keys(localStorage)
        .filter((storageKey) => storageKey.startsWith(STORAGE_PREFIX))
        .forEach((storageKey) => localStorage.removeItem(storageKey));
      localStorage.setItem(key, JSON.stringify(positions));
    } catch {
      // Caching is best-effort.
    }
  }
}

async function analyzePosition(pool, fen, options) {
  const terminal = terminalAnalysis(fen);
  if (terminal) return terminal;
  const cacheKey = `${options.depth}:${options.multiPv}:${fen}`;
  if (positionCache.has(cacheKey)) return positionCache.get(cacheKey);
  const turn = fen.split(' ')[1];
  const result = await pool.analyze(fen, options);
  const lines = result.lines.map((line) => ({ eval: fromEngineScore(line.score, turn), pv: line.pv, depth: line.depth }));
  const analysis = { fen, eval: lines[0]?.eval || { type: 'cp', value: 0 }, lines, bestMove: result.bestMove || lines[0]?.pv[0] || null };
  positionCache.set(cacheKey, analysis);
  return analysis;
}

export function useGameReview() {
  const poolRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState('');

  const [gameData, setGameData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [positions, setPositions] = useState([]);
  const [book, setBook] = useState(null);
  const [depthPreset, setDepthPreset] = useState('standard');
  const [currentMove, setCurrentMove] = useState(-1);
  const [error, setError] = useState('');

  // A side line being shown on the board: engine best line, opponent threat, or the user's own moves.
  const [line, setLine] = useState(null);
  const [retry, setRetry] = useState(null);
  const [liveAnalysis, setLiveAnalysis] = useState({});
  const reviewCacheRef = useRef([]);

  useEffect(() => {
    const pool = new StockfishPool();
    poolRef.current = pool;
    pool.ready.then(() => setEngineReady(true)).catch((exception) => setEngineError(exception.message));
    loadOpeningBook().then(setBook);
    return () => {
      pool.terminate();
      poolRef.current = null;
    };
  }, []);

  const fens = useMemo(() => {
    if (!gameData?.timeline.length) return [];
    return [gameData.timeline[0].fenBeforeMove, ...gameData.timeline.map((node) => node.fenAfterMove)];
  }, [gameData]);

  // Analyse every position of the game up front, like a full game review.
  useEffect(() => {
    const pool = poolRef.current;
    if (!pool || !fens.length) return undefined;
    let cancelled = false;
    const depth = DEPTH_PRESETS[depthPreset];
    const key = gameKey(fens, depth);
    reviewCacheRef.current = [];

    const saved = loadSavedReview(key);
    if (saved?.length === fens.length) {
      setPositions(saved);
      return undefined;
    }
    setPositions([]);

    const results = [];
    let remaining = fens.length;
    fens.forEach((fen, index) => {
      analyzePosition(pool, fen, { depth, multiPv: 2 })
        .then((analysis) => {
          if (cancelled) return;
          results[index] = analysis;
          remaining -= 1;
          if (remaining === 0) saveReview(key, results);
          setPositions((previous) => {
            const next = previous.slice();
            next[index] = analysis;
            return next;
          });
        })
        .catch((exception) => {
          if (!cancelled && exception.message !== 'cancelled') setError(exception.message);
        });
    });

    return () => {
      cancelled = true;
      pool.cancelAll();
    };
  }, [fens, depthPreset]);

  const analyzedCount = positions.filter(Boolean).length;
  const progress = fens.length ? analyzedCount / fens.length : 0;
  const analysisComplete = fens.length > 0 && analyzedCount === fens.length;

  const reviews = useMemo(() => {
    if (!gameData || !book) return [];
    const cache = reviewCacheRef.current;
    let inBook = true;
    for (let index = 0; index < gameData.timeline.length; index += 1) {
      if (!cache[index]) {
        const before = positions[index];
        const after = positions[index + 1];
        if (!before || !after || (index > 0 && !cache[index - 1])) break;
        cache[index] = reviewMove({
          node: gameData.timeline[index],
          before,
          after,
          previous: cache[index - 1] || null,
          book,
          inBook,
        });
      }
      inBook = inBook && cache[index].classification === 'book';
    }
    return cache.slice();
  }, [book, gameData, positions]);

  const summary = useMemo(() => {
    if (!analysisComplete || reviews.length !== gameData.timeline.length) return null;
    const lastBook = [...reviews].reverse().find((review) => review.inBook);
    return {
      accuracy: computeAccuracy(positions.map((position) => position.eval), reviews),
      counts: countClassifications(reviews),
      opening: lastBook ? book.get(epd(gameData.timeline[lastBook.moveIndex].fenAfterMove)) : null,
    };
  }, [analysisComplete, book, gameData, positions, reviews]);

  const loadPgn = useCallback((pgn, fallbackMetadata = {}) => {
    try {
      const parsed = parsePgnToTimeline(pgn);
      reviewCacheRef.current = [];
      setPositions([]);
      setGameData(parsed);
      setMetadata(metadataFromHeaders(parsed.headers, fallbackMetadata));
      setCurrentMove(-1);
      setLine(null);
      setRetry(null);
      setError('');
    } catch (exception) {
      setError(exception.message || 'Could not parse this PGN.');
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameData(null);
    setMetadata(null);
    setPositions([]);
    setCurrentMove(-1);
    setLine(null);
    setRetry(null);
    setError('');
  }, []);

  const navigateTo = useCallback(
    (index) => {
      if (!gameData) return;
      setLine(null);
      setRetry(null);
      setCurrentMove(Math.max(-1, Math.min(index, gameData.timeline.length - 1)));
    },
    [gameData],
  );

  const mainFen = currentMove >= 0 ? gameData?.timeline[currentMove].fenAfterMove : gameData?.initialFen;

  const showLine = useCallback((kind) => {
    const review = reviewCacheRef.current[currentMove];
    if (!review) return;
    const node = gameData.timeline[currentMove];
    const source = kind === 'best' ? review.bestLine : review.threatLine;
    const startFen = kind === 'best' ? node.fenBeforeMove : node.fenAfterMove;
    if (!source.moves.length) return;
    setRetry(null);
    setLine({ kind, startFen, moves: source.moves, index: 0 });
  }, [currentMove, gameData]);

  const stepLine = useCallback((delta) => {
    setLine((current) => {
      if (!current) return current;
      const index = Math.max(-1, Math.min(current.moves.length - 1, current.index + delta));
      return { ...current, index };
    });
  }, []);

  const next = useCallback(() => {
    if (line) {
      if (line.index < line.moves.length - 1) stepLine(1);
      return;
    }
    navigateTo(currentMove + 1);
  }, [currentMove, line, navigateTo, stepLine]);

  const previous = useCallback(() => {
    if (line) {
      if (line.index >= 0) stepLine(-1);
      else setLine(null);
      return;
    }
    navigateTo(currentMove - 1);
  }, [currentMove, line, navigateTo, stepLine]);

  const startRetry = useCallback(() => {
    const review = reviewCacheRef.current[currentMove];
    if (!review) return;
    setLine(null);
    setRetry({ moveIndex: currentMove, fen: gameData.timeline[currentMove].fenBeforeMove, status: 'waiting', attempt: null });
  }, [currentMove, gameData]);

  /** Handle a piece dropped on the board. Returns true if the move was accepted. */
  const playUserMove = useCallback(
    (from, to, promotion = 'q') => {
      if (retry) {
        const review = reviewCacheRef.current[retry.moveIndex];
        const before = positions[retry.moveIndex];
        const chess = new Chess(retry.fen);
        let move;
        try {
          move = chess.move({ from, to, promotion });
        } catch {
          return false;
        }
        const uci = moveToUci(move);
        const mover = move.color;
        const alternative = before.lines.find((candidate) => candidate.pv[0] === uci);
        const goodEnough = alternative && review.winBest - winChanceFor(mover, alternative.eval) <= 0.02;
        if (uci === review.bestMove || goodEnough) {
          setRetry({ ...retry, status: 'correct', attempt: { san: move.san, fen: chess.fen(), from, to } });
        } else {
          setRetry({ ...retry, status: 'wrong', attempt: { san: move.san, fen: chess.fen(), from, to } });
        }
        return true;
      }

      const baseFen = line ? (line.index >= 0 ? line.moves[line.index].fen : line.startFen) : mainFen;
      const chess = new Chess(baseFen);
      let move;
      try {
        move = chess.move({ from, to, promotion });
      } catch {
        return false;
      }
      const step = { ...move, uci: moveToUci(move), fen: chess.fen() };

      if (!line && gameData.timeline[currentMove + 1]?.playedMove === step.uci) {
        navigateTo(currentMove + 1);
        return true;
      }
      if (line) {
        const moves = [...line.moves.slice(0, line.index + 1), step];
        setLine({ kind: 'explore', startFen: line.startFen, moves, index: moves.length - 1 });
      } else {
        setLine({ kind: 'explore', startFen: mainFen, moves: [step], index: 0 });
      }
      return true;
    },
    [currentMove, gameData, line, mainFen, navigateTo, positions, retry],
  );

  const retryReset = useCallback(() => setRetry((current) => current && { ...current, status: 'waiting', attempt: null }), []);
  const exitSideLine = useCallback(() => {
    setLine(null);
    setRetry(null);
  }, []);

  const boardFen = retry
    ? retry.attempt?.fen || retry.fen
    : line
      ? line.index >= 0
        ? line.moves[line.index].fen
        : line.startFen
      : mainFen;

  // Live engine output for positions off the main line.
  useEffect(() => {
    const pool = poolRef.current;
    if (!pool || !line || !boardFen || liveAnalysis[boardFen]) return;
    let cancelled = false;
    analyzePosition(pool, boardFen, { depth: DEPTH_PRESETS[depthPreset], multiPv: 1, priority: true })
      .then((analysis) => {
        if (cancelled) return;
        const bestMoves = analysis.lines[0] ? playLine(boardFen, analysis.lines[0].pv, 8) : [];
        setLiveAnalysis((previousAnalysis) => ({ ...previousAnalysis, [boardFen]: { ...analysis, bestMoves } }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [boardFen, depthPreset, line, liveAnalysis]);

  const currentPosition = useMemo(() => {
    if (line) return liveAnalysis[boardFen] || null;
    return positions[currentMove + 1] || null;
  }, [boardFen, currentMove, line, liveAnalysis, positions]);

  return {
    engineReady,
    engineError,
    error,
    gameData,
    metadata,
    positions,
    reviews,
    summary,
    progress,
    analysisComplete,
    depthPreset,
    setDepthPreset,
    currentMove,
    currentReview: currentMove >= 0 ? reviews[currentMove] || null : null,
    currentPosition,
    boardFen,
    line,
    retry,
    loadPgn,
    resetGame,
    navigateTo,
    next,
    previous,
    showLine,
    stepLine,
    exitSideLine,
    startRetry,
    retryReset,
    playUserMove,
  };
}
