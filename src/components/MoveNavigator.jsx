import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CLASSIFICATION_STYLES } from '../utils/classifyMove';

export default function MoveNavigator({ timeline, analysisByMove, currentMove, onNavigate, onPrevious, onNext }) {
  if (!timeline?.length) return null;

  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-4 rounded border border-cyanGlow/20 bg-cyanGlow/10 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">Current Move</p>
        <p className="mt-1 text-2xl font-black text-white">
          {timeline[currentMove]?.moveNumber}. {timeline[currentMove]?.sanMove}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentMove <= 0}
          className="flex items-center justify-center gap-2 rounded border border-sky-300/15 px-4 py-3 font-bold text-sky-50 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentMove >= timeline.length - 1}
          className="flex items-center justify-center gap-2 rounded border border-sky-300/15 px-4 py-3 font-bold text-sky-50 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      <input
        className="timeline-range w-full"
        type="range"
        min="0"
        max={timeline.length - 1}
        value={currentMove}
        onChange={(event) => onNavigate(Number(event.target.value))}
      />

      <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-sky-100/50">
        <span>Move 1</span>
        <span>{currentMove + 1} / {timeline.length}</span>
      </div>

      <div className="scrollbar-thin mt-4 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
        {timeline.map((move) => {
          const analysis = analysisByMove[move.moveIndex] || {};
          const active = currentMove === move.moveIndex;
          const classification = analysis.classification || 'Pending';
          const style = CLASSIFICATION_STYLES[classification];
          return (
            <button
              key={move.moveIndex}
              type="button"
              onClick={() => onNavigate(move.moveIndex)}
              className={`min-h-10 rounded border px-3 py-2 text-left text-sm font-semibold transition ${
                active ? 'border-cyanGlow bg-cyanGlow text-slate-950 shadow-glow' : style
              }`}
            >
              {move.color === 'White' ? `${move.moveNumber}. ` : ''}
              {move.sanMove}
            </button>
          );
        })}
      </div>
    </section>
  );
}
