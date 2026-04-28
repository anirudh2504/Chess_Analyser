import { motion } from 'framer-motion';
import { BadgeCheck, BrainCircuit, CheckCircle2, Crown, Moon, Sparkles, Sun } from 'lucide-react';
import ChessComFetcher from './ChessComFetcher';
import PgnImporter from './PgnImporter';
import GameSidebar from './GameSidebar';

const previewSquares = [
  'r', '', 'b', 'q', 'k', 'b', '', 'r',
  'p', 'p', '', '', '', 'p', 'p', 'p',
  '', '', 'n', '', 'p', 'n', '', '',
  '', '', '', 'p', 'P', '', '', '',
  '', '', 'B', '', '', '', '', '',
  '', '', '', '', '', 'N', '', '',
  'P', 'P', 'P', 'P', '', 'P', 'P', 'P',
  'R', 'N', 'B', 'Q', 'R', '', 'K', '',
];

const pieceSymbols = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'N',
  p: 'P',
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  N: 'N',
  P: 'P',
};

export default function LandingPage({
  onImportPgn,
  games,
  onGamesLoaded,
  onSelectGame,
  selectedGameId,
  error,
  theme,
  onToggleTheme,
}) {
  const light = theme === 'light';

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-7xl rounded-xl border p-5 shadow-2xl sm:p-8 ${
          light
            ? 'border-sky-200/80 bg-white/85 shadow-sky-900/10'
            : 'border-sky-300/15 bg-[#061424]/80'
        }`}
      >
        <nav className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded bg-cyanGlow/12 text-cyanGlow">
              <BrainCircuit size={20} />
            </span>
            <span className="font-extrabold uppercase tracking-tight text-white">Chess_Analyser</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded border border-sky-300/20 bg-cyanGlow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyanGlow transition hover:border-cyanGlow/60 hover:bg-cyanGlow/20"
              aria-label="Toggle theme"
            >
              {light ? <Moon size={15} /> : <Sun size={15} />}
              {light ? 'Dark' : 'Light'}
            </button>
            <span className="rounded bg-cyanGlow px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-950">
              Stockfish
            </span>
          </div>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyanGlow/25 bg-cyanGlow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-cyanGlow">
              <BadgeCheck size={14} />
              Powered by Stockfish 16+
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Welcome to <span className="text-cyanGlow">Chess Analyser</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-100/76">
              Import your Chess.com games or PGN files and receive grandmaster-grade move-by-move engine analysis.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-sky-100/80">
              {['Deep Engine Analysis', 'Blunder Detection', 'Accuracy Signals'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyanGlow" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="glass glow-border hidden rounded-lg p-5 lg:block"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative overflow-hidden rounded border border-cyanGlow/20 bg-[#020b16] p-5">
              <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyanGlow/10 blur-3xl" />
              <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-mintGlow/10 blur-3xl" />

              <div className="relative mb-5 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-cyanGlow/80">
                <span>Live Analysis Board</span>
                <Crown size={18} />
              </div>

              <div className="relative grid gap-5 xl:grid-cols-[17rem_1fr]">
                <div className="aspect-square self-start overflow-hidden rounded-md border border-cyanGlow/25 shadow-glow">
                  <div className="grid h-full grid-cols-8">
                    {previewSquares.map((piece, index) => {
                      const row = Math.floor(index / 8);
                      const col = index % 8;
                      const dark = (row + col) % 2 === 1;
                      const whitePiece = piece && piece === piece.toUpperCase();

                      return (
                        <span
                          key={`${piece}-${index}`}
                          className={`grid place-items-center text-xl font-black ${
                            dark ? 'bg-[#0b3a52]' : 'bg-[#d9f5ff]'
                          } ${whitePiece ? 'text-slate-950' : 'text-cyanGlow'}`}
                        >
                          {piece ? pieceSymbols[piece] : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div className="rounded border border-sky-300/10 bg-slate-950/45 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                      <Sparkles size={16} className="text-mintGlow" />
                      Best move found
                    </div>
                    <p className="font-mono text-3xl font-black text-mintGlow">Nf3</p>
                    <p className="mt-1 text-sm text-sky-100/60">Depth 14 - +0.42</p>
                  </div>

                  {[88, 68, 42].map((width, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-sky-100/55">
                        <span>{['Accuracy', 'Pressure', 'Sharpness'][index]}</span>
                        <span>{width}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyanGlow to-mintGlow"
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: 0.2 + index * 0.1, duration: 0.7 }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-6 items-end gap-2">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <motion.span
                        key={index}
                        className="rounded-t bg-cyanGlow/50"
                        style={{ height: `${18 + ((index * 23) % 70)}px` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.24 + index * 0.025 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ['14', 'Depth'],
                  ['0.18', 'Loss'],
                  ['Best', 'Class'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded border border-sky-300/10 bg-cyanGlow/5 px-3 py-2">
                    <p className="text-lg font-black text-white">{value}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-sky-100/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {error ? <p className="mt-8 rounded border border-rose-300/20 bg-rose-400/10 p-4 text-rose-100">{error}</p> : null}

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <ChessComFetcher onGamesLoaded={onGamesLoaded} />
          <PgnImporter onImport={onImportPgn} />
        </section>

        <section className="mt-5">
          <GameSidebar games={games} onSelectGame={onSelectGame} selectedGameId={selectedGameId} />
        </section>
      </div>
    </main>
  );
}
