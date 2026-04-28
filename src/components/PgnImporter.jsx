import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Play } from 'lucide-react';

const SAMPLE_PGN =
  '[Event "Live Chess"]\n[White "Chess Analyser"]\n[Black "Sample Game"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0';

export default function PgnImporter({ onImport }) {
  const [pgn, setPgn] = useState('');

  return (
    <motion.section
      className="glass glow-border rounded-lg p-5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded bg-cyanGlow/12 text-cyanGlow">
            <FileText size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Import PGN</h2>
            <p className="text-sm text-sky-100/70">Paste any PGN and begin deep engine review.</p>
          </div>
        </div>
        <button
          className="text-xs font-bold uppercase tracking-[0.2em] text-cyanGlow hover:text-white"
          onClick={() => setPgn(SAMPLE_PGN)}
          type="button"
        >
          Example PGN
        </button>
      </div>

      <textarea
        className="min-h-44 w-full resize-y rounded border border-sky-300/15 bg-[#020b16] p-4 text-sm leading-6 text-sky-50 outline-none transition placeholder:text-slate-500 focus:border-cyanGlow/70 focus:shadow-glow"
        placeholder='[Event "Live Chess"]&#10;1. e4 e5 2. Nf3 Nc6...'
        value={pgn}
        onChange={(event) => setPgn(event.target.value)}
      />

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-cyanGlow px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-white"
        type="button"
        onClick={() => onImport(pgn)}
      >
        <Play size={16} />
        Start Analysis
      </button>
    </motion.section>
  );
}
