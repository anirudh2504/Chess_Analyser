import { useMemo, useState } from 'react';
import { CalendarDays, Crown, ExternalLink, Flame, Search, Timer, Zap } from 'lucide-react';

const TIME_CLASSES = [
  { key: 'all', label: 'All' },
  { key: 'bullet', label: 'Bullet', icon: Zap },
  { key: 'blitz', label: 'Blitz', icon: Flame },
  { key: 'rapid', label: 'Rapid', icon: Timer },
  { key: 'daily', label: 'Daily', icon: CalendarDays },
];
const ICONS = Object.fromEntries(TIME_CLASSES.filter((entry) => entry.icon).map((entry) => [entry.key, entry.icon]));

const OUTCOME_STYLES = {
  win: { label: 'Won', className: 'border-mintGlow/40 bg-mintGlow/10 text-mintGlow' },
  loss: { label: 'Lost', className: 'border-dangerGlow/45 bg-dangerGlow/10 text-rose-200' },
  draw: { label: 'Draw', className: 'border-slate-500/40 bg-slate-500/10 text-slate-300' },
};

const PAGE_SIZE = 20;

function Player({ color, name, rating, winner, highlight }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={`h-3 w-3 shrink-0 rounded-sm border ${color === 'w' ? 'border-slate-300 bg-sky-50' : 'border-slate-500 bg-slate-800'}`}
      />
      <span className={`truncate ${highlight ? 'font-bold text-white' : 'text-sky-100/80'}`}>{name}</span>
      {rating ? <span className="shrink-0 text-xs text-sky-100/45">({rating})</span> : null}
      {winner ? <Crown size={12} className="shrink-0 text-amber-300" aria-label="Winner" /> : null}
    </div>
  );
}

function outcomeFor(game) {
  if (game.outcome) return game.outcome;
  return game.winnerColor === 'Draw' ? 'draw' : null;
}

export default function GameSidebar({ games, onSelectGame, selectedGameId }) {
  const [timeClass, setTimeClass] = useState('all');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const result = { all: games.length };
    games.forEach((game) => {
      result[game.timeClass] = (result[game.timeClass] || 0) + 1;
    });
    return result;
  }, [games]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games.filter(
      (game) =>
        (timeClass === 'all' || game.timeClass === timeClass) &&
        (!needle || `${game.white} ${game.black} ${game.opening}`.toLowerCase().includes(needle)),
    );
  }, [games, query, timeClass]);

  if (!games.length) return null;

  const record = games.reduce(
    (totals, game) => {
      if (game.outcome) totals[game.outcome] += 1;
      return totals;
    },
    { win: 0, loss: 0, draw: 0 },
  );
  const hasPerspective = games.some((game) => game.perspective);

  return (
    <section className="glass rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Recent Games</h2>
          <p className="text-sm text-sky-100/60">
            {games.length} games from the last three months
            {hasPerspective ? (
              <>
                {' · '}
                <span className="text-mintGlow">{record.win}W</span> / <span className="text-rose-200">{record.loss}L</span> /{' '}
                <span className="text-slate-300">{record.draw}D</span>
              </>
            ) : null}
          </p>
        </div>
        <label className="relative block sm:w-64">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-100/40" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search opponent or opening"
            className="w-full rounded border border-sky-300/15 bg-[#020b16] py-2 pl-9 pr-3 text-sm text-sky-50 outline-none transition placeholder:text-slate-500 focus:border-cyanGlow/70"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {TIME_CLASSES.filter((entry) => entry.key === 'all' || counts[entry.key]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTimeClass(key);
              setVisible(PAGE_SIZE);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
              timeClass === key
                ? 'border-cyanGlow bg-cyanGlow/15 text-cyanGlow'
                : 'border-sky-300/15 text-sky-100/70 hover:border-cyanGlow/50 hover:text-white'
            }`}
          >
            {Icon ? <Icon size={13} /> : null}
            {label}
            <span className="opacity-60">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Column headings (desktop) */}
      <div className="hidden grid-cols-[6.5rem_minmax(0,1.3fr)_7.5rem_minmax(0,1fr)_3.5rem_6.5rem_8rem] gap-4 border-b border-sky-300/10 px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100/45 lg:grid">
        <span>Time</span>
        <span>Players</span>
        <span>Result</span>
        <span>Opening</span>
        <span className="text-center">Moves</span>
        <span>Date</span>
        <span />
      </div>

      <div className="scrollbar-thin max-h-[34rem] overflow-y-auto pr-1">
        {filtered.slice(0, visible).map((game) => {
          const selected = selectedGameId === game.id;
          const outcome = outcomeFor(game);
          const style = outcome ? OUTCOME_STYLES[outcome] : null;
          const Icon = ICONS[game.timeClass] || Timer;
          const supported = game.rules === 'chess';

          return (
            <article
              key={game.id}
              className={`grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-sky-300/10 px-3 py-3 text-sm transition last:border-0 lg:grid-cols-[6.5rem_minmax(0,1.3fr)_7.5rem_minmax(0,1fr)_3.5rem_6.5rem_8rem] lg:items-center ${
                selected ? 'bg-cyanGlow/10' : 'hover:bg-cyanGlow/5'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-sky-100/70">
                <Icon size={15} className="shrink-0 text-cyanGlow" />
                {game.timeControlLabel}
              </span>

              <div className="col-span-2 min-w-0 space-y-1 lg:col-span-1">
                <Player color="w" name={game.white} rating={game.whiteRating} winner={game.winnerColor === 'White'} highlight={game.perspective === 'w'} />
                <Player color="b" name={game.black} rating={game.blackRating} winner={game.winnerColor === 'Black'} highlight={game.perspective === 'b'} />
              </div>

              <div className="row-start-1 col-start-2 flex flex-col items-end gap-1 lg:col-start-auto lg:row-start-auto lg:items-start">
                {style ? (
                  <span className={`rounded border px-2 py-0.5 text-xs font-black uppercase tracking-[0.1em] ${style.className}`}>{style.label}</span>
                ) : (
                  <span className="text-xs font-bold text-white">{game.winnerColor} won</span>
                )}
                {game.reason ? <span className="text-[11px] text-sky-100/50">{game.reason}</span> : null}
              </div>

              <p className="col-span-2 truncate text-xs text-sky-100/70 lg:col-span-1" title={game.opening}>
                {game.opening}
              </p>

              <span className="hidden text-center text-xs text-sky-100/60 lg:block">{game.moves || '--'}</span>
              <span className="hidden text-xs text-sky-100/60 lg:block">{game.date}</span>

              <div className="col-span-2 flex items-center gap-2 lg:col-span-1 lg:justify-end">
                <span className="mr-auto text-xs text-sky-100/50 lg:hidden">
                  {game.moves ? `${game.moves} moves · ` : ''}
                  {game.date}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectGame(game)}
                  disabled={!supported}
                  title={supported ? 'Review this game' : 'Chess variants are not supported yet'}
                  className="rounded bg-cyanGlow px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Review
                </button>
                {game.url ? (
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on Chess.com"
                    className="grid h-8 w-8 place-items-center rounded border border-sky-300/15 text-sky-100/70 transition hover:border-cyanGlow/60 hover:text-white"
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}

        {!filtered.length && <p className="py-8 text-center text-sm text-sky-100/50">No games match these filters.</p>}
      </div>

      {filtered.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((count) => count + PAGE_SIZE)}
          className="mt-3 w-full rounded border border-sky-300/15 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-100/70 transition hover:border-cyanGlow/60 hover:text-white"
        >
          Show more ({filtered.length - visible} left)
        </button>
      )}
    </section>
  );
}
