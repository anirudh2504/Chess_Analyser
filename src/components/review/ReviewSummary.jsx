import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CLASSIFICATIONS, SUMMARY_ORDER } from '../../analysis/review';
import ClassificationBadge from './ClassificationBadge';

export default function ReviewSummary({ summary, metadata, progress, analysisComplete }) {
  const [expanded, setExpanded] = useState(false);

  if (!analysisComplete || !summary) {
    return (
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-[0.16em] text-cyanGlow">Reviewing game...</span>
          <span className="text-sky-100/60">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950">
          <div className="h-full rounded-full bg-cyanGlow transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    );
  }

  const { accuracy, counts } = summary;
  return (
    <div>
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">Accuracy</span>
        <span className="truncate text-center text-xs text-sky-100/60" title={metadata?.white}>{metadata?.white}</span>
        <span className="truncate text-center text-xs text-sky-100/60" title={metadata?.black}>{metadata?.black}</span>

        <span />
        <span className="rounded bg-sky-50 py-1 text-center text-lg font-black text-slate-900">{accuracy.w?.toFixed(1) ?? '--'}</span>
        <span className="rounded bg-slate-800 py-1 text-center text-lg font-black" style={{ color: '#f0f9ff' }}>{accuracy.b?.toFixed(1) ?? '--'}</span>

        {expanded &&
          SUMMARY_ORDER.map((key) => (
            <div key={key} className="contents">
              <span className="flex items-center gap-2" style={{ color: CLASSIFICATIONS[key].color }}>
                <ClassificationBadge classification={key} size={16} />
                <span className="font-semibold">{CLASSIFICATIONS[key].label}</span>
              </span>
              <span className="text-center font-bold" style={{ color: CLASSIFICATIONS[key].color }}>{counts.w[key] || 0}</span>
              <span className="text-center font-bold" style={{ color: CLASSIFICATIONS[key].color }}>{counts.b[key] || 0}</span>
            </div>
          ))}
      </div>
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
