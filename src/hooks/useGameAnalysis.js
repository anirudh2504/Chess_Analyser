import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { classifyMove, normalizeCentipawn } from '../utils/classifyMove';
import { metadataFromHeaders, parsePgnToTimeline } from '../utils/pgnParser';

export function useGameAnalysis(analyzeFen) {
  const [gameData, setGameData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [currentMove, setCurrentMove] = useState(-1);
  const [analysisByMove, setAnalysisByMove] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const inFlightMoveRef = useRef(null);

  const loadPgn = useCallback((pgn, fallbackMetadata = {}) => {
    try {
      const parsed = parsePgnToTimeline(pgn);
      setGameData(parsed);
      setMetadata(metadataFromHeaders(parsed.headers, fallbackMetadata));
      setAnalysisByMove({});
      setCurrentMove(parsed.timeline.length ? 0 : -1);
      setStatus('ready');
      setError('');
    } catch (exception) {
      setError(exception.message || 'Could not parse this PGN.');
      setStatus('error');
    }
  }, []);

  const currentNode = useMemo(() => {
    if (!gameData || currentMove < 0) return null;
    return {
      ...gameData.timeline[currentMove],
      ...analysisByMove[currentMove],
    };
  }, [analysisByMove, currentMove, gameData]);

  const boardFen = currentNode?.fenAfterMove || gameData?.initialFen || new Chess().fen();

  useEffect(() => {
    let cancelled = false;
    const node = gameData && currentMove >= 0 ? gameData.timeline[currentMove] : null;

    async function analyzeCurrentMove() {
      if (!node || !analyzeFen) return;
      if (analysisByMove[node.moveIndex]?.bestMove || inFlightMoveRef.current === node.moveIndex) return;

      inFlightMoveRef.current = node.moveIndex;
      setStatus('analyzing');
      setAnalysisByMove((prev) => ({
        ...prev,
        [node.moveIndex]: {
          ...(prev[node.moveIndex] || {}),
          isAnalyzing: true,
        },
      }));

      try {
        const before = await analyzeFen(node.fenBeforeMove, 14);
        if (cancelled) return;

        let after = null;
        try {
          after = await analyzeFen(node.fenAfterMove, 10);
        } catch {
          after = null;
        }

        if (cancelled) return;

        const beforeTurn = node.fenBeforeMove.split(' ')[1];
        const afterTurn = node.fenAfterMove.split(' ')[1];
        const bestEval = normalizeCentipawn(before.score, beforeTurn);
        const playedEval = after ? normalizeCentipawn(after.score, afterTurn) : bestEval;
        const moverPerspectiveLoss =
          node.color === 'White' ? Math.max(0, bestEval - playedEval) : Math.max(0, playedEval - bestEval);
        const playedMatchesBest = before.bestMove === node.playedMove;
        const centipawnLoss = playedMatchesBest ? 0 : Math.round(moverPerspectiveLoss);

        setAnalysisByMove((prev) => ({
          ...prev,
          [node.moveIndex]: {
            bestMove: before.bestMove,
            evaluation: playedEval,
            centipawnLoss,
            classification: classifyMove(centipawnLoss),
            principalVariation: before.principalVariation,
            isAnalyzing: false,
          },
        }));
        inFlightMoveRef.current = null;
        setStatus('ready');
      } catch (exception) {
        if (cancelled) return;
        setAnalysisByMove((prev) => ({
          ...prev,
          [node.moveIndex]: {
            ...(prev[node.moveIndex] || {}),
            isAnalyzing: false,
          },
        }));
        inFlightMoveRef.current = null;
        setError(exception.message || 'Engine analysis failed.');
        setStatus('error');
      }
    }

    analyzeCurrentMove();

    return () => {
      cancelled = true;
      if (node && inFlightMoveRef.current === node.moveIndex) {
        inFlightMoveRef.current = null;
      }
    };
  }, [analyzeFen, currentMove, gameData]);

  const navigateTo = useCallback(
    (index) => {
      if (!gameData) return;
      setCurrentMove(Math.max(0, Math.min(index, gameData.timeline.length - 1)));
    },
    [gameData],
  );

  const nextMove = useCallback(() => navigateTo(currentMove + 1), [currentMove, navigateTo]);
  const previousMove = useCallback(() => navigateTo(currentMove - 1), [currentMove, navigateTo]);
  const resetGame = useCallback(() => {
    setGameData(null);
    setMetadata(null);
    setCurrentMove(-1);
    setAnalysisByMove({});
    setStatus('idle');
    setError('');
  }, []);

  return {
    gameData,
    metadata,
    currentMove,
    currentNode,
    boardFen,
    analysisByMove,
    status,
    error,
    loadPgn,
    navigateTo,
    nextMove,
    previousMove,
    resetGame,
  };
}
