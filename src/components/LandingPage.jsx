import { motion } from 'framer-motion';
import { BadgeCheck, BrainCircuit, CheckCircle2, Crown, Moon, Sun } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { CLASSIFICATIONS } from '../analysis/review';
import ClassificationBadge from './review/ClassificationBadge';
import ChessComFetcher from './ChessComFetcher';
import PgnImporter from './PgnImporter';
import GameSidebar from './GameSidebar';

// Morphy's Opera Game, right after the brilliant 16.Qb8+.
const PREVIEW_FEN = '1Q2kb1r/p2n1ppp/4q3/4p1B1/4P3/8/PPP2PPP/2KR4 b k - 1 16';
const PREVIEW_COUNTS = [
  ['brilliant', 2, 0],
  ['great', 3, 0],
  ['best', 9, 6],
  ['mistake', 0, 1],
  ['blunder', 0, 1],
];

function ReviewPreview() {
  const boardSize = 288;
  const square = boardSize / 8;

  return (
    <div className="relative overflow-hidden rounded-lg border border-cyanGlow/20 bg-[#020b16] p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyanGlow/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-mintGlow/10 blur-3xl" />

      <div className="relative mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-cyanGlow/80">
        <span>Game Review</span>
        <Crown size={16} />
      </div>

      <div className="relative flex items-start gap-5">
        <div className="flex shrink-0 gap-2">
          <div className="relative w-3 overflow-hidden rounded-sm bg-[#1f2933]" style={{ height: boardSize }}>
            <div className="absolute inset-x-0 bottom-0 h-[92%] bg-sky-50" />
          </div>
          <div className="pointer-events-none relative overflow-hidden rounded-md shadow-glow" style={{ width: boardSize }}>
            <Chessboard
              id="LandingPreviewBoard"
              position={PREVIEW_FEN}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              animationDuration={0}
              customSquareStyles={{
                b3: { background: 'rgba(38, 194, 163, 0.45)' },
                b8: { background: 'rgba(38, 194, 163, 0.6)' },
              }}
              customArrows={[['d1', 'd8', 'rgba(129, 182, 76, 0.85)']]}
              customDarkSquareStyle={{ backgroundColor: '#0b3a52' }}
              customLightSquareStyle={{ backgroundColor: '#d9f5ff' }}
            />
            <span className="absolute" style={{ left: square * 2 - square * 0.32, top: 2 }}>
              <ClassificationBadge classification="brilliant" size={22} className="ring-2 ring-white/80" />
            </span>
          </div>
        </div>

        <div className="flex w-56 shrink-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded bg-sky-50 py-2">
              <p className="text-xl font-black text-slate-900">99.1</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Morphy</p>
            </div>
            <div className="rounded bg-slate-800 py-2">
              <p className="text-xl font-black" style={{ color: '#f0f9ff' }}>85.2</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Opponents</p>
            </div>
          </div>

          <div className="rounded border border-sky-300/10 bg-slate-950/50 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <ClassificationBadge classification="brilliant" size={20} />
              <p className="text-sm font-extrabold" style={{ color: CLASSIFICATIONS.brilliant.color }}>
                Qb8+ is a brilliant move
              </p>
            </div>
            <p className="text-xs leading-relaxed text-sky-100/70">
              You sacrifice your queen. Black must take it, and Rd8# follows.
            </p>
          </div>

          <div className="space-y-1.5 text-xs">
            {PREVIEW_COUNTS.map(([key, white, black]) => (
              <div key={key} className="flex items-center gap-2">
                <ClassificationBadge classification={key} size={16} />
                <span className="flex-1 font-semibold" style={{ color: CLASSIFICATIONS[key].color }}>
                  {CLASSIFICATIONS[key].label}
                </span>
                <span className="w-5 text-center font-bold text-white">{white}</span>
                <span className="w-5 text-center font-bold text-sky-100/50">{black}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

        <section className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_auto]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyanGlow/25 bg-cyanGlow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-cyanGlow">
              <BadgeCheck size={14} />
              Powered by Stockfish 18
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Welcome to <span className="text-cyanGlow">Chess Analyser</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-100/76">
              Import your Chess.com games or a PGN and get a full game review: every move rated, your mistakes explained, and the better line shown on the board.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-sky-100/80">
              {['Brilliant & blunder detection', 'Best line and threats', 'Accuracy for both players'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyanGlow" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="glass glow-border hidden justify-self-center rounded-xl p-3 md:block xl:justify-self-end"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ReviewPreview />
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
