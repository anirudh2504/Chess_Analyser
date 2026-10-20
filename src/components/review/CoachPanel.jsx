import { CheckCircle2, CornerUpLeft, Eye, Lightbulb, RotateCcw, Swords, XCircle } from 'lucide-react';
import { formatEval } from '../../analysis/evaluation';
import { CLASSIFICATIONS } from '../../analysis/review';
import { formatLine } from '../../analysis/tactics';
import ClassificationBadge from './ClassificationBadge';

const BAD = new Set(['inaccuracy', 'mistake', 'miss', 'blunder']);
const LINE_TITLES = { best: 'Best line', threat: 'Opponent\'s best reply', explore: 'Your analysis' };

function ActionButton({ icon: Icon, children, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-extrabold uppercase tracking-[0.1em] transition ${
        primary
          ? 'bg-cyanGlow text-slate-950 shadow-glow hover:bg-white'
          : 'border border-sky-300/15 text-sky-50 hover:border-cyanGlow/60 hover:bg-cyanGlow/10'
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function LineChips({ line, onSelect }) {
  const [, turn, , , , fullmove] = line.startFen.split(' ');
  let moveNumber = Number(fullmove) || 1;
  let white = turn === 'w';
  return (
    <div className="flex flex-wrap gap-1 font-mono text-sm">
      {line.moves.map((move, index) => {
        const prefix = white ? `${moveNumber}.` : index === 0 ? `${moveNumber}...` : '';
        if (!white) moveNumber += 1;
        white = !white;
        return (
          <button
            key={`${index}-${move.uci}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`rounded px-1.5 py-0.5 transition ${
              index === line.index ? 'bg-cyanGlow font-bold text-slate-950' : 'text-sky-100/80 hover:bg-cyanGlow/10'
            }`}
          >
            {prefix && <span className="mr-1 opacity-60">{prefix}</span>}
            {move.san}
          </button>
        );
      })}
    </div>
  );
}

export default function CoachPanel({
  node,
  review,
  currentPosition,
  line,
  retry,
  engineReady,
  onShowLine,
  onSelectLineIndex,
  onExitSideLine,
  onRetry,
  onRetryReset,
}) {
  if (retry) {
    return (
      <section className="rounded-lg border border-sky-300/10 bg-slate-950/30 p-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">
          <RotateCcw size={14} /> Retry
        </p>
        {retry.status === 'waiting' && (
          <p className="text-lg font-bold text-white">Find a better move for {node.color}. Drag a piece on the board.</p>
        )}
        {retry.status === 'correct' && (
          <p className="flex items-center gap-2 text-lg font-bold text-mintGlow">
            <CheckCircle2 size={20} /> {retry.attempt.san} is correct!
          </p>
        )}
        {retry.status === 'wrong' && (
          <p className="flex items-center gap-2 text-lg font-bold text-rose-200">
            <XCircle size={20} /> {retry.attempt.san} isn't the best move.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {retry.status === 'wrong' && <ActionButton icon={RotateCcw} onClick={onRetryReset} primary>Try again</ActionButton>}
          {retry.status !== 'correct' && <ActionButton icon={Lightbulb} onClick={() => onShowLine('best')}>Show solution</ActionButton>}
          <ActionButton icon={CornerUpLeft} onClick={onExitSideLine}>Back to game</ActionButton>
        </div>
      </section>
    );
  }

  if (line) {
    const engineLine = currentPosition?.bestMoves?.length
      ? formatLine(currentPosition.fen, currentPosition.bestMoves.map((move) => move.san))
      : null;
    return (
      <section className="rounded-lg border border-sky-300/10 bg-slate-950/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">{LINE_TITLES[line.kind]}</p>
          <span className="rounded bg-slate-950/60 px-2 py-1 font-mono text-sm font-bold text-white">
            {currentPosition ? formatEval(currentPosition.eval) : engineReady ? '...' : '--'}
          </span>
        </div>
        <LineChips line={line} onSelect={onSelectLineIndex} />
        {line.kind === 'explore' && (
          <p className="mt-3 text-xs text-sky-100/60">
            Engine: {engineLine || 'calculating...'}
          </p>
        )}
        <p className="mt-3 text-xs text-sky-100/50">Use ← → to step through the line. Drag pieces to try your own moves.</p>
        <div className="mt-4">
          <ActionButton icon={CornerUpLeft} onClick={onExitSideLine} primary>Back to game</ActionButton>
        </div>
      </section>
    );
  }

  if (!node) {
    return (
      <section className="rounded-lg border border-sky-300/10 bg-slate-950/30 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">Coach</p>
        <p className="mt-2 text-lg font-bold text-white">Starting position</p>
        <p className="mt-1 text-sm text-sky-100/60">Press → or click a move to walk through the review.</p>
      </section>
    );
  }

  if (!review) {
    return (
      <section className="rounded-lg border border-sky-300/10 bg-slate-950/30 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">Coach</p>
        <p className="mt-2 text-lg font-bold text-white">{node.moveNumber}{node.color === 'White' ? '.' : '...'} {node.sanMove}</p>
        <p className="mt-1 text-sm text-sky-100/60">{engineReady ? 'Analyzing this move...' : 'Loading Stockfish...'}</p>
      </section>
    );
  }

  const info = CLASSIFICATIONS[review.classification];
  const isBad = BAD.has(review.classification);

  return (
    <section className="rounded-lg border border-sky-300/10 bg-slate-950/30 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClassificationBadge classification={review.classification} size={30} />
          <p className="text-lg font-extrabold leading-tight" style={{ color: info.color }}>{review.explanation.headline}</p>
        </div>
        <span className="shrink-0 rounded bg-slate-950/60 px-2 py-1 font-mono text-sm font-bold text-white">{formatEval(review.evaluation)}</span>
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-sky-100/85">
        {review.explanation.sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>

      {!review.isBestMove && review.bestSan && !['best', 'book', 'forced'].includes(review.classification) && (
        <div className="mt-4 flex items-center gap-3 rounded border border-mintGlow/30 bg-mintGlow/10 p-3">
          <ClassificationBadge classification="best" size={22} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-mintGlow">{review.bestSan} is best</p>
            <p className="truncate font-mono text-xs text-sky-100/60" title={review.bestLine.text}>{review.bestLine.text}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {review.bestLine.moves.length > 0 && (
          <ActionButton icon={Lightbulb} onClick={() => onShowLine('best')} primary={isBad}>
            {review.isBestMove ? 'Show line' : 'Show best'}
          </ActionButton>
        )}
        {review.threatLine.moves.length > 0 && (
          <ActionButton icon={isBad ? Swords : Eye} onClick={() => onShowLine('threat')}>
            {isBad ? 'Show threat' : 'Show follow-up'}
          </ActionButton>
        )}
        {isBad && <ActionButton icon={RotateCcw} onClick={onRetry}>Retry</ActionButton>}
      </div>
    </section>
  );
}
