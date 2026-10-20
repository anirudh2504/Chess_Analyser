import { useEffect, useRef } from 'react';
import ClassificationBadge from './ClassificationBadge';

export default function MoveList({ timeline, reviews, currentMove, onNavigate, className = '' }) {
  const listRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll only the list itself (scrollIntoView would also scroll the page).
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list) return;
    if (!active) {
      list.scrollTop = 0;
      return;
    }
    const top = active.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 8;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
  }, [currentMove]);

  const rows = [];
  for (let index = 0; index < timeline.length; index += 2) rows.push([timeline[index], timeline[index + 1]]);

  function cell(node) {
    if (!node) return <span />;
    const review = reviews[node.moveIndex];
    const active = node.moveIndex === currentMove;
    return (
      <button
        ref={active ? activeRef : null}
        type="button"
        onClick={() => onNavigate(node.moveIndex)}
        className={`flex min-h-8 items-center gap-2 rounded px-2 py-1 text-left text-sm font-semibold transition ${
          active ? 'bg-cyanGlow text-slate-950 shadow-glow' : 'text-sky-50 hover:bg-cyanGlow/10'
        }`}
      >
        {review ? <ClassificationBadge classification={review.classification} size={16} /> : <span className="h-4 w-4 rounded-full border border-sky-300/20" />}
        {node.sanMove}
      </button>
    );
  }

  return (
    <div ref={listRef} className={`scrollbar-thin relative overflow-y-auto pr-1 ${className}`}>
      {rows.map(([white, black]) => (
        <div key={white.moveIndex} className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-1 odd:bg-slate-950/20">
          <span className="pl-1 text-xs text-sky-100/45">{white.moveNumber}.</span>
          {cell(white)}
          {cell(black)}
        </div>
      ))}
    </div>
  );
}
