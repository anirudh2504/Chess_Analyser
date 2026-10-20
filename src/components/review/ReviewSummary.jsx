import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CLASSIFICATIONS, SUMMARY_ORDER } from '../../analysis/review';
import ClassificationBadge from './ClassificationBadge';

/** Accuracy and move breakdown for the user's side only. */
export default function ReviewSummary({ summary, metadata, reviewAs, progress, analysisComplete }) {
  const [expanded, setExpanded] = useState(false);
  const myName = reviewAs === 'w' ? metadata?.white : metadata?.black;

  if (!analysisComplete || !summary) {
    return (
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-[0.16em] text-cyanGlow">Reviewing your moves...</span>
          <span className="text-sky-100/60">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950">
          <div className="h-full rounded-full bg-cyanGlow transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    );
  }

  const { accuracy, counts } = summary;
  const mistakes = (counts.inaccuracy || 0) + (counts.mistake || 0) + (counts.miss || 0) + (counts.blunder || 0);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className={`rounded px-3 py-1.5 text-center ${reviewAs === 'w' ? 'bg-sky-50' : 'bg-slate-800'}`}
          style={{ color: reviewAs === 'w' ? '#0f172a' : '#f0f9ff' }}
        >
          <p className="text-2xl font-black leading-none">{accuracy?.toFixed(1) ?? '--'}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] opacity-60">Accuracy</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white" title={myName}>{myName}</p>
          <p className="text-xs text-sky-100/60">
            {mistakes ? `${mistakes} move${mistakes === 1 ? '' : 's'} to improve` : 'No mistakes - clean game!'}
            {counts.brilliant ? ` · ${counts.brilliant} brilliant` : ''}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {SUMMARY_ORDER.map((key) => (
            <div key={key} className="flex items-center gap-2" style={{ color: CLASSIFICATIONS[key].color }}>
              <ClassificationBadge classification={key} size={16} />
              <span className="flex-1 font-semibold">{CLASSIFICATIONS[key].label}</span>
              <span className="font-bold">{counts[key] || 0}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs capitalize text-sky-100/55" title={summary.opening || metadata?.opening}>
          {summary.opening || metadata?.opening}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-cyanGlow hover:text-white"
        >
          {expanded ? 'Hide' : 'Move breakdown'}
          <ChevronDown size={14} className={`transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
