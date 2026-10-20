const CHESSCOM_BASE = 'https://api.chess.com/pub';

export async function fetchChessComGames(username) {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Enter a Chess.com username.');
  }

  const archiveResponse = await fetch(`${CHESSCOM_BASE}/player/${encodeURIComponent(cleanUsername)}/games/archives`);
  if (!archiveResponse.ok) {
    throw new Error(`Could not find public archives for ${cleanUsername}.`);
  }

  const { archives = [] } = await archiveResponse.json();
  const lastThreeArchives = archives.slice(-3).reverse();
  const archivePayloads = await Promise.all(
    lastThreeArchives.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) return { games: [] };
      return response.json();
    }),
  );

  return archivePayloads
    .flatMap((payload) => payload.games || [])
    .filter((game) => game.pgn)
    .sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
    .map((game) => normalizeChessComGame(game, cleanUsername));
}

const LOSS_REASONS = {
  checkmated: 'by checkmate',
  resigned: 'by resignation',
  timeout: 'on time',
  abandoned: 'by abandonment',
  lose: '',
  kingofthehill: 'king reached the hill',
  threecheck: 'by three checks',
  bughousepartnerlose: 'partner lost',
};

const DRAW_REASONS = {
  agreed: 'by agreement',
  repetition: 'by repetition',
  stalemate: 'by stalemate',
  insufficient: 'insufficient material',
  '50move': '50-move rule',
  timevsinsufficient: 'timeout vs insufficient material',
};

/** "English-Opening-Four-Knights...8.a3-O-O-9.d3" -> "English Opening Four Knights" */
function openingName(ecoUrl) {
  const slug = ecoUrl?.split('/openings/')?.[1];
  if (!slug) return 'Unknown opening';
  return decodeURIComponent(slug)
    .split(/\.\.\.|-\d+\./)[0]
    .replace(/-/g, ' ')
    .trim();
}

function formatTimeControl(timeControl, timeClass) {
  if (!timeControl) return '';
  if (timeClass === 'daily' || timeControl.includes('/')) {
    const seconds = Number(timeControl.split('/')[1]) || 86400;
    const days = Math.round(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const [base, increment] = timeControl.split('+').map(Number);
  const minutes = base >= 60 ? `${base / 60}` : `${base}s`;
  return increment ? `${minutes} | ${increment}` : `${minutes} min`;
}

function countMoves(pgn) {
  let max = 0;
  for (const match of pgn.matchAll(/(?:^|\s)(\d+)\.\s/g)) max = Math.max(max, Number(match[1]));
  return max;
}

function normalizeChessComGame(game, username) {
  const endDate = game.end_time ? new Date(game.end_time * 1000) : null;
  const whiteResult = game.white?.result || '*';
  const blackResult = game.black?.result || '*';
  const winnerColor = whiteResult === 'win' ? 'White' : blackResult === 'win' ? 'Black' : 'Draw';
  const winner = winnerColor === 'White' ? game.white?.username : winnerColor === 'Black' ? game.black?.username : 'Draw';
  const loserResult = winnerColor === 'White' ? blackResult : winnerColor === 'Black' ? whiteResult : whiteResult;
  const reason = winnerColor === 'Draw' ? DRAW_REASONS[loserResult] ?? loserResult : LOSS_REASONS[loserResult] ?? loserResult;

  const lower = username.toLowerCase();
  const perspective =
    game.white?.username?.toLowerCase() === lower ? 'w' : game.black?.username?.toLowerCase() === lower ? 'b' : null;
  const outcome =
    winnerColor === 'Draw' ? 'draw' : perspective && (winnerColor === 'White') === (perspective === 'w') ? 'win' : perspective ? 'loss' : null;

  return {
    id: game.url || `${game.white?.username}-${game.black?.username}-${game.end_time}`,
    white: game.white?.username || 'White',
    black: game.black?.username || 'Black',
    whiteRating: game.white?.rating ?? null,
    blackRating: game.black?.rating ?? null,
    result: `${whiteResult} / ${blackResult}`,
    whiteResult,
    blackResult,
    winner,
    winnerColor,
    reason,
    perspective,
    outcome,
    pgn: game.pgn,
    timeControl: game.time_control || 'Unknown',
    timeControlLabel: formatTimeControl(game.time_control, game.time_class),
    timeClass: game.time_class || 'rapid',
    opening: openingName(game.eco),
    openingUrl: game.eco || '',
    moves: countMoves(game.pgn),
    rated: Boolean(game.rated),
    rules: game.rules || 'chess',
    date: endDate?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) || '',
    rawDate: endDate,
    url: game.url,
  };
}
