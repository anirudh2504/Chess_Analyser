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
    .sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
    .map(normalizeChessComGame);
}

function normalizeChessComGame(game) {
  const endDate = game.end_time ? new Date(game.end_time * 1000) : null;
  const opening = game.eco?.split('/openings/')?.[1]?.replaceAll('-', ' ') || 'Unknown opening';
  const whiteResult = game.white?.result || '*';
  const blackResult = game.black?.result || '*';
  const winner =
    whiteResult === 'win'
      ? game.white?.username || 'White'
      : blackResult === 'win'
        ? game.black?.username || 'Black'
        : 'Draw';
  const winnerColor = whiteResult === 'win' ? 'White' : blackResult === 'win' ? 'Black' : 'Draw';

  return {
    id: game.url || `${game.white?.username}-${game.black?.username}-${game.end_time}`,
    white: game.white?.username || 'White',
    black: game.black?.username || 'Black',
    result: `${whiteResult} / ${blackResult}`,
    whiteResult,
    blackResult,
    winner,
    winnerColor,
    pgn: game.pgn,
    timeControl: game.time_control || 'Unknown',
    opening,
    openingUrl: game.eco || '',
    rated: Boolean(game.rated),
    rules: game.rules || 'chess',
    date: endDate?.toLocaleDateString() || '',
    rawDate: endDate,
    url: game.url,
  };
}
