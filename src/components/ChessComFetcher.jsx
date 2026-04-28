import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserRound } from 'lucide-react';
import { fetchChessComGames } from '../utils/chesscomApi';

export default function ChessComFetcher({ onGamesLoaded }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFetch() {
    setError('');
    setLoading(true);
    try {
      const games = await fetchChessComGames(username);
      onGamesLoaded(games);
      if (!games.length) setError('No public games found in the latest three archive months.');
    } catch (exception) {
      setError(exception.message || 'Could not fetch games.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      className="glass glow-border rounded-lg p-5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded bg-cyanGlow/12 text-cyanGlow">
          <UserRound size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Use your Chess.com Account</h2>
          <p className="text-sm text-sky-100/70">Fetch and analyze your public Chess.com games instantly.</p>
        </div>
      </div>

      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-sky-200/80">Chess.com username</label>
      <input
        className="w-full rounded border border-sky-300/15 bg-[#020b16] px-4 py-3 text-sm text-sky-50 outline-none transition placeholder:text-slate-500 focus:border-cyanGlow/70 focus:shadow-glow"
        placeholder="e.g. GothamChess"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleFetch();
        }}
      />

      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-cyanGlow px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={loading}
        onClick={handleFetch}
      >
        <Search size={16} />
        {loading ? 'Fetching Games' : 'Fetch Games'}
      </button>
    </motion.section>
  );
}
