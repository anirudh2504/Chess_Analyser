import { evalBarPercent, formatEvalShort, whiteWinChance } from '../../analysis/evaluation';

/** Vertical eval bar. White's share grows from the bottom when White is at the bottom. */
export default function EvalBar({ evaluation, orientation = 'white', height }) {
  const whitePercent = evalBarPercent(evaluation);
  const whiteAhead = whiteWinChance(evaluation) >= 0.5;
  const whiteAtBottom = orientation === 'white';
  const label = formatEvalShort(evaluation);
  const labelAtBottom = whiteAhead === whiteAtBottom;

  return (
    <div
      className="relative w-7 shrink-0 overflow-hidden rounded border border-sky-300/15 bg-[#1f2933]"
      style={{ height }}
      aria-label={`Evaluation ${label}`}
    >
      <div
        className="absolute inset-x-0 bg-sky-50 transition-all duration-500"
        style={whiteAtBottom ? { bottom: 0, height: `${whitePercent}%` } : { top: 0, height: `${whitePercent}%` }}
      />
      <span
        className={`absolute inset-x-0 text-center text-[10px] font-black ${labelAtBottom ? 'bottom-1' : 'top-1'}`}
        style={{ color: whiteAhead ? '#0f172a' : '#f0f9ff' }}
      >
        {label}
      </span>
    </div>
  );
}
