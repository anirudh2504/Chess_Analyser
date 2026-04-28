import { CalendarDays, Clock3, Crown, ExternalLink, Swords } from 'lucide-react';

export default function GameSidebar({ games, onSelectGame, selectedGameId }) {
  if (!games.length) return null;

  return (
    <aside className="glass rounded-lg p-4 lg:max-h-[40rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Fetched Games</h2>
          <p className="text-sm text-sky-100/60">Latest three archive months with result and opening detail</p>
        </div>
        <span className="rounded border border-cyanGlow/25 bg-cyanGlow/10 px-3 py-1 text-xs font-bold text-cyanGlow">
          {games.length}
        </span>
      </div>

      <div className="scrollbar-thin flex max-h-[35rem] flex-col gap-3 overflow-y-auto pr-1">
        {games.map((game) => {
          const selected = selectedGameId === game.id;
          const draw = game.winnerColor === 'Draw';

          return (
            <article
              key={game.id}
              className={`rounded border p-4 transition ${
                selected ? 'border-cyanGlow/70 bg-cyanGlow/12 shadow-glow' : 'border-sky-300/12 bg-slate-950/35'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold text-white">
                    <Swords size={16} className="text-cyanGlow" />
                    {game.white} <span className="text-sky-300/70">vs</span> {game.black}
                  </p>
                  <p className="mt-1 text-sm text-sky-100/60">
                    White: {game.whiteResult} - Black: {game.blackResult}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                    draw
                      ? 'border-amber-300/35 bg-amber-300/10 text-amber-200'
                      : 'border-mintGlow/35 bg-mintGlow/10 text-mintGlow'
                  }`}
                >
                  <Crown size={13} />
                  {draw ? 'Draw' : `${game.winnerColor} won`}
                </span>
              </div>

              <div className="mb-4 rounded border border-sky-300/10 bg-[#020b16]/70 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyanGlow">Opening</p>
                <p className="mt-1 text-sm font-semibold capitalize text-white">{game.opening}</p>
                <p className="mt-2 text-xs text-sky-100/55">
                  {game.rated ? 'Rated' : 'Casual'} - {game.rules} - {game.openingUrl ? 'Chess.com ECO reference available' : 'No ECO reference'}
                </p>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-sky-100/60">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} />
                  {game.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 size={13} />
                  {game.timeControl}
                </span>
                <span>{game.result}</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onSelectGame(game)}
                  className="inline-flex items-center justify-center rounded bg-cyanGlow px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Analyze
                </button>
                {game.url ? (
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded border border-sky-300/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-sky-100 transition hover:border-cyanGlow/60 hover:bg-cyanGlow/10"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
