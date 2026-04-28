import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';
import { ArrowLeft, Gauge, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EvaluationPanel from './EvaluationPanel';
import MoveNavigator from './MoveNavigator';
import { evaluationPercent } from '../utils/classifyMove';

function squareStyles(node) {
  if (!node) return {};
  return {
    [node.from]: {
      background: 'radial-gradient(circle, rgba(114,217,255,0.65) 0%, rgba(114,217,255,0.18) 62%, transparent 65%)',
    },
    [node.to]: {
      background: 'radial-gradient(circle, rgba(49,246,164,0.72) 0%, rgba(49,246,164,0.16) 62%, transparent 65%)',
    },
  };
}

function bestMoveArrow(bestMove) {
  if (!bestMove || bestMove.length < 4) return [];
  return [[bestMove.slice(0, 2), bestMove.slice(2, 4), 'rgba(49, 246, 164, 0.9)']];
}

export default function AnalyzerBoard({
  boardFen,
  gameData,
  metadata,
  currentNode,
  currentMove,
  analysisByMove,
  engineReady,
  engineError,
  status,
  onNavigate,
  onPrevious,
  onNext,
  onReset,
}) {
  const evalValue = currentNode?.evaluation || 0;
  const whitePercent = evaluationPercent(evalValue);
  const boardWrapRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(520);

  useEffect(() => {
    if (!boardWrapRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(Math.min(672, Math.max(300, entry.contentRect.width)));
      setBoardWidth(nextWidth);
    });

    observer.observe(boardWrapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onReset}
              className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-cyanGlow transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to imports
            </button>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              {metadata?.white} <span className="text-cyanGlow">vs</span> {metadata?.black}
            </h1>
            <p className="mt-2 text-sky-100/62">{metadata?.event} {metadata?.date ? `- ${metadata.date}` : ''}</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded border border-sky-300/15 px-4 py-3 font-bold text-sky-50 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10"
          >
            <Home size={18} />
            New Game
          </button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="space-y-5">
            <motion.div
              className="glass rounded-lg p-3 sm:p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid gap-3 lg:grid-cols-[2rem_minmax(0,40rem)] lg:items-stretch lg:justify-center">
                <div className="order-2 flex h-4 overflow-hidden rounded-full border border-sky-300/15 bg-slate-950 lg:order-1 lg:h-auto lg:w-8 lg:flex-col">
                  <div className="bg-sky-50 transition-all duration-500 lg:w-full" style={{ height: `${whitePercent}%`, width: `${whitePercent}%` }} />
                  <div className="flex-1 bg-slate-950" />
                </div>
                <div ref={boardWrapRef} className="order-1 w-full max-w-[40rem] justify-self-center lg:order-2">
                  <Chessboard
                    id="ChessAnalyserBoard"
                    position={boardFen}
                    arePiecesDraggable={false}
                    customSquareStyles={squareStyles(currentNode)}
                    customArrows={bestMoveArrow(currentNode?.bestMove)}
                    boardWidth={boardWidth}
                    customDarkSquareStyle={{ backgroundColor: '#0b3a52' }}
                    customLightSquareStyle={{ backgroundColor: '#d9f5ff' }}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-sky-100/65">
                <Gauge size={16} className="text-cyanGlow" />
                White advantage rises upward. Green arrow marks Stockfish best move.
              </div>
            </motion.div>

            <EvaluationPanel
              node={currentNode}
              metadata={metadata}
              engineReady={engineReady}
              engineError={engineError}
              status={status}
            />
          </section>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <MoveNavigator
              timeline={gameData.timeline}
              analysisByMove={analysisByMove}
              currentMove={currentMove}
              onNavigate={onNavigate}
              onPrevious={onPrevious}
              onNext={onNext}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
