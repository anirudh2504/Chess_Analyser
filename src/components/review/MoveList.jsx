import { useEffect, useRef } from 'react';
import ClassificationBadge from './ClassificationBadge';

export default function MoveList({ timeline, reviews, reviewAs, currentMove, onNavigate, className = '' }) {
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
    const mine = node.color[0].toLowerCase() === reviewAs;
    let marker = <span className="h-4 w-4" />;
    if (mine) {
      marker = review ? (
        <ClassificationBadge classification={review.classification} size={16} />
      ) : (
        <span className="h-4 w-4 rounded-full border border-sky-300/20" />
      );
    }
    return (
      <button
        ref={active ? activeRef : null}
        type="button"
        onClick={() => onNavigate(node.moveIndex)}
        className={`flex min-h-8 items-center gap-2 rounded px-2 py-1 text-left text-sm transition ${
          active
            ? 'bg-cyanGlow font-semibold text-slate-950 shadow-glow'
            : mine
              ? 'font-semibold text-sky-50 hover:bg-cyanGlow/10'
              : 'font-normal text-sky-100/45 hover:bg-cyanGlow/10'
        }`}
      >
        {marker}
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
