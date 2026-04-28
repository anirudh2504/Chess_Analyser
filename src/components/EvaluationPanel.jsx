import { Activity, Brain, Gauge, LineChart } from 'lucide-react';
import { CLASSIFICATION_STYLES, scoreToDisplay } from '../utils/classifyMove';

export default function EvaluationPanel({ node, metadata, engineReady, engineError, status, className = '' }) {
  const classification = node?.classification || 'Pending';

  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className}`}>
      <section className="glass rounded-lg p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-cyanGlow">
          <Gauge size={16} />
          Evaluation
        </div>
        <div className="text-4xl font-extrabold text-white">{node?.evaluation == null ? '...' : scoreToDisplay(node.evaluation)}</div>
        <p className="mt-2 text-sm text-sky-100/60">
          {engineError || (engineReady ? (status === 'analyzing' || node?.isAnalyzing ? 'Stockfish is calculating this position.' : 'Engine result locked for this move.') : 'Loading Stockfish WASM...')}
        </p>
      </section>

      <section className="glass rounded-lg p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-cyanGlow">
          <Brain size={16} />
          Best Move
        </div>
        <p className="text-2xl font-extrabold text-white">{node?.bestMove || 'Analyzing...'}</p>
        <p className="mt-2 text-sm text-sky-100/60">Played move: {node?.playedMove || '--'} ({node?.sanMove || '--'})</p>
      </section>

      <section className={`rounded-lg border p-5 ${CLASSIFICATION_STYLES[classification]}`}>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em]">
          <Activity size={16} />
          Classification
        </div>
        <p className="text-3xl font-extrabold">{classification}</p>
        <p className="mt-2 text-sm opacity-80">Centipawn loss: {node?.centipawnLoss ?? '--'}</p>
      </section>

      <section className="glass rounded-lg p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-cyanGlow">
          <LineChart size={16} />
          Principal Variation
        </div>
        <p className="min-h-12 break-words rounded border border-sky-300/10 bg-slate-950/45 p-3 font-mono text-sm text-sky-100/80">
          {node?.principalVariation?.length ? node.principalVariation.join(' ') : 'Waiting for engine line...'}
        </p>
      </section>

      <section className="glass rounded-lg p-5 text-sm">
        <h3 className="mb-3 text-base font-bold text-white">Game Metadata</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sky-100/68">
          <dt>White</dt>
          <dd className="text-right text-white">{metadata?.white}</dd>
          <dt>Black</dt>
          <dd className="text-right text-white">{metadata?.black}</dd>
          <dt>Result</dt>
          <dd className="text-right text-white">{metadata?.result}</dd>
          <dt>Opening</dt>
          <dd className="text-right capitalize text-white">{metadata?.opening}</dd>
        </dl>
      </section>
    </div>
  );
}
