import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FlipVertical2, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CLASSIFICATIONS } from '../analysis/review';
import { DEPTH_PRESETS } from '../hooks/useGameReview';
import ClassificationBadge from './review/ClassificationBadge';
import CoachPanel from './review/CoachPanel';
import EvalBar from './review/EvalBar';
import EvalGraph from './review/EvalGraph';
import MoveList from './review/MoveList';
import ReviewSummary from './review/ReviewSummary';

const BEST_ARROW = 'rgba(129, 182, 76, 0.85)';
const THREAT_ARROW = 'rgba(250, 65, 45, 0.75)';
const ENGINE_ARROW = 'rgba(114, 217, 255, 0.85)';

function tint(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function squarePosition(square, orientation, size) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const x = orientation === 'white' ? file : 7 - file;
  const y = orientation === 'white' ? 8 - rank : rank - 1;
  return { left: x * size, top: y * size };
}

function uciArrow(uci, color) {
  return uci && uci.length >= 4 ? [uci.slice(0, 2), uci.slice(2, 4), color] : null;
}

/** Highlights, arrows and the classification badge for whatever is on the board right now. */
function boardDecorations({ review, node, line, retry, currentPosition, isMine }) {
  if (retry) {
    if (!retry.attempt) return { squares: {}, arrows: [], badge: null };
    const color = retry.status === 'correct' ? CLASSIFICATIONS.best.color : CLASSIFICATIONS.mistake.color;
    return {
      squares: { [retry.attempt.from]: { background: tint(color, 0.45) }, [retry.attempt.to]: { background: tint(color, 0.6) } },
      arrows: [],
      badge: { square: retry.attempt.to, classification: retry.status === 'correct' ? 'best' : 'mistake' },
    };
  }

  if (line) {
    const step = line.index >= 0 ? line.moves[line.index] : null;
    const squares = step ? { [step.from]: { background: 'rgba(114, 217, 255, 0.35)' }, [step.to]: { background: 'rgba(114, 217, 255, 0.5)' } } : {};
    const engineBest = currentPosition?.bestMove;
    const arrow = line.kind === 'explore' ? uciArrow(engineBest, ENGINE_ARROW) : null;
    return { squares, arrows: arrow ? [arrow] : [], badge: null };
  }

  if (!node) return { squares: {}, arrows: [], badge: null };

  // Opponent's move: no grading, just a neutral highlight and an arrow for the user's best reply.
  if (!isMine) {
    const reply = uciArrow(review?.threatLine.moves[0]?.uci, BEST_ARROW);
    return {
      squares: { [node.from]: { background: 'rgba(148, 163, 184, 0.35)' }, [node.to]: { background: 'rgba(148, 163, 184, 0.5)' } },
      arrows: reply ? [reply] : [],
      badge: null,
    };
  }

  const color = review ? CLASSIFICATIONS[review.classification].color : '#72d9ff';
  const squares = { [node.from]: { background: tint(color, 0.4) }, [node.to]: { background: tint(color, 0.55) } };
  const arrows = [];
  if (review && !review.isBestMove && !['best', 'book', 'forced'].includes(review.classification)) {
    const best = uciArrow(review.bestMove, BEST_ARROW);
    if (best) arrows.push(best);
    if (['mistake', 'blunder', 'miss'].includes(review.classification)) {
      const threat = uciArrow(review.threatLine.moves[0]?.uci, THREAT_ARROW);
      if (threat) arrows.push(threat);
    }
  }
  return { squares, arrows, badge: review ? { square: node.to, classification: review.classification } : null };
}

const PANEL_WIDTH = 416; // right-hand panel, like chess.com's review sidebar
const EVAL_BAR = 40;
const HEADER = 64;
const NAME_ROWS = 64;

/** Size the board to fit the window, leaving room for the side panel on wide screens. */
function computeLayout() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const wide = width >= 1024;
  const maxWidth = wide ? width - PANEL_WIDTH - EVAL_BAR - 72 : width - EVAL_BAR - 32;
  const maxHeight = height - HEADER - NAME_ROWS - 32;
  const board = Math.floor(Math.max(260, Math.min(maxWidth, wide ? maxHeight : Math.max(maxHeight, 320), 960)));
  return { board, wide };
}

function NavButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex items-center justify-center rounded border border-sky-300/15 py-3 text-sky-50 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={20} />
    </button>
  );
}

export default function AnalyzerBoard({ review: state, onReset }) {
  const {
    gameData,
    metadata,
    positions,
    reviews,
    summary,
    progress,
    analysisComplete,
    depthPreset,
    setDepthPreset,
    reviewAs,
    setReviewAs,
    myReviews,
    currentIsMine,
    currentMove,
    currentReview,
    currentPosition,
    boardFen,
    line,
    retry,
    engineReady,
    engineError,
    error,
    navigateTo,
    next,
    previous,
    showLine,
    stepLine,
    exitSideLine,
    startRetry,
    retryReset,
    playUserMove,
  } = state;

  const [layout, setLayout] = useState(computeLayout);
  const [orientation, setOrientation] = useState(metadata?.perspective === 'b' ? 'black' : 'white');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const timeline = gameData.timeline;
  const node = currentMove >= 0 ? timeline[currentMove] : null;
  const boardWidth = layout.board;

  useEffect(() => {
    const onResize = () => setLayout(computeLayout());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === 'ArrowRight') next();
      else if (event.key === 'ArrowLeft') previous();
      else if (event.key === 'Escape') exitSideLine();
      else return;
      event.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exitSideLine, next, previous]);

  const evaluation = line || retry ? currentPosition?.eval : positions[currentMove + 1]?.eval;
  const decorations = boardDecorations({ review: currentReview, node, line, retry, currentPosition, isMine: currentIsMine });
  const squareSize = boardWidth / 8;
  const badgePosition = decorations.badge ? squarePosition(decorations.badge.square, orientation, squareSize) : null;
  const retryLocked = retry && retry.status !== 'waiting';
  const topPlayer = orientation === 'white' ? metadata?.black : metadata?.white;
  const bottomPlayer = orientation === 'white' ? metadata?.white : metadata?.black;

  const panelHeight = layout.wide ? boardWidth + NAME_ROWS : undefined;

  useEffect(() => setSelectedSquare(null), [boardFen]);

  // Click-to-move: click one of the side-to-move's pieces, then its destination.
  function handleSquareClick(square) {
    if (retryLocked) return;
    const chess = new Chess(boardFen);
    const piece = chess.get(square);
    if (selectedSquare && selectedSquare !== square && !(piece && piece.color === chess.turn())) {
      playUserMove(selectedSquare, square);
      setSelectedSquare(null);
      return;
    }
    setSelectedSquare(piece && piece.color === chess.turn() && selectedSquare !== square ? square : null);
  }

  const squareStyles = selectedSquare
    ? { ...decorations.squares, [selectedSquare]: { background: 'rgba(114, 217, 255, 0.55)' } }
    : decorations.squares;

  return (
    <main className="min-h-screen px-4 py-3 lg:h-screen lg:overflow-hidden">
      <header className="mx-auto mb-3 flex h-[52px] max-w-[110rem] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            title="Back to imports"
            className="inline-flex shrink-0 items-center gap-2 rounded border border-sky-300/15 px-3 py-2 text-sm font-bold text-cyanGlow transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">
              {metadata?.white} <span className="text-cyanGlow">vs</span> {metadata?.black}
            </h1>
            <p className="truncate text-xs text-sky-100/60">
              {metadata?.event} {metadata?.date ? `- ${metadata.date}` : ''} {metadata?.result ? `- ${metadata.result}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-sky-300/15 p-1 text-xs" role="group" aria-label="Which side did you play?">
            <span className="hidden px-1 text-sky-100/70 md:inline">You played</span>
            {[
              ['w', 'White'],
              ['b', 'Black'],
            ].map(([side, label]) => (
              <button
                key={side}
                type="button"
                onClick={() => {
                  setReviewAs(side);
                  setOrientation(side === 'w' ? 'white' : 'black');
                }}
                aria-pressed={reviewAs === side}
                className={`rounded px-2 py-1 font-bold transition ${
                  reviewAs === side ? 'bg-cyanGlow text-slate-950' : 'text-sky-100/70 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded border border-sky-300/15 px-2 py-1.5 text-xs text-sky-100/70">
            <span className="hidden sm:inline">Depth</span>
            <select
              value={depthPreset}
              onChange={(event) => setDepthPreset(event.target.value)}
              className="rounded bg-slate-950 px-1 py-0.5 font-bold text-white outline-none"
            >
              {Object.entries(DEPTH_PRESETS).map(([key, depth]) => (
                <option key={key} value={key}>
                  {key[0].toUpperCase() + key.slice(1)} ({depth})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onReset}
            title="New game"
            className="inline-flex items-center justify-center gap-2 rounded border border-sky-300/15 px-3 py-2 text-sm font-bold text-sky-50 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10"
          >
            <Home size={16} />
            <span className="hidden sm:inline">New Game</span>
          </button>
        </div>
      </header>

      {(engineError || error) && (
        <p className="mx-auto mb-3 max-w-[110rem] rounded border border-dangerGlow/45 bg-dangerGlow/10 p-2 text-sm text-rose-200">{engineError || error}</p>
      )}

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
        {/* Board column */}
        <motion.section className="shrink-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="flex h-8 items-center truncate pl-10 text-sm font-bold text-white">{topPlayer}</p>
          <div className="flex gap-3">
            <EvalBar evaluation={evaluation} orientation={orientation} height={boardWidth} />
            <div className="relative" style={{ width: boardWidth, height: boardWidth }}>
              <Chessboard
                id="ChessAnalyserBoard"
                position={boardFen}
                boardOrientation={orientation}
                boardWidth={boardWidth}
                arePiecesDraggable={!retryLocked}
                onPieceDrop={(from, to) => playUserMove(from, to)}
                onSquareClick={handleSquareClick}
                autoPromoteToQueen
                customSquareStyles={squareStyles}
                customArrows={decorations.arrows}
                customDarkSquareStyle={{ backgroundColor: '#0b3a52' }}
                customLightSquareStyle={{ backgroundColor: '#d9f5ff' }}
                animationDuration={200}
              />
              {badgePosition && (
                <div
                  className="pointer-events-none absolute z-10"
                  style={{ left: badgePosition.left + squareSize - squareSize * 0.3, top: badgePosition.top - squareSize * 0.12 }}
                >
                  <ClassificationBadge classification={decorations.badge.classification} size={Math.max(18, squareSize * 0.38)} className="ring-2 ring-white/80" />
                </div>
              )}
            </div>
          </div>
          <p className="flex h-8 items-center truncate pl-10 text-sm font-bold text-white">{bottomPlayer}</p>
        </motion.section>

        {/* Review panel */}
        <aside
          className="glass flex w-full flex-col gap-3 rounded-lg p-3 lg:w-[26rem] lg:shrink-0"
          style={{ height: panelHeight }}
        >
          <ReviewSummary summary={summary} metadata={metadata} reviewAs={reviewAs} progress={progress} analysisComplete={analysisComplete} />
          <EvalGraph positions={positions} reviews={myReviews} currentMove={currentMove} totalPositions={timeline.length + 1} onNavigate={navigateTo} />
          <div className="scrollbar-thin max-h-[45%] shrink-0 overflow-y-auto">
            <CoachPanel
              node={node}
              review={currentReview}
              isMine={currentIsMine}
              reviewAs={reviewAs}
              opponentName={reviewAs === 'w' ? metadata?.black : metadata?.white}
              currentPosition={currentPosition}
              line={line}
              retry={retry}
              engineReady={engineReady}
              onShowLine={showLine}
              onSelectLineIndex={(index) => stepLine(index - line.index)}
              onExitSideLine={exitSideLine}
              onRetry={startRetry}
              onRetryReset={retryReset}
            />
          </div>
          <MoveList
            timeline={timeline}
            reviews={reviews}
            reviewAs={reviewAs}
            currentMove={currentMove}
            onNavigate={navigateTo}
            className={layout.wide ? 'min-h-[6rem] flex-1' : 'max-h-72'}
          />
          <div className="grid shrink-0 grid-cols-5 gap-2">
            <NavButton icon={ChevronsLeft} label="First move" onClick={() => navigateTo(-1)} disabled={currentMove < 0 && !line} />
            <NavButton icon={ChevronLeft} label="Previous move (←)" onClick={previous} disabled={currentMove < 0 && !line} />
            <NavButton icon={ChevronRight} label="Next move (→)" onClick={next} disabled={currentMove >= timeline.length - 1 && !line} />
            <NavButton icon={ChevronsRight} label="Last move" onClick={() => navigateTo(timeline.length - 1)} disabled={currentMove >= timeline.length - 1 && !line} />
            <NavButton icon={FlipVertical2} label="Flip board" onClick={() => setOrientation((value) => (value === 'white' ? 'black' : 'white'))} />
          </div>
        </aside>
      </div>
    </main>
  );
}
