import { Chess } from 'chess.js';

export function parsePgnToTimeline(pgn) {
  const loaded = new Chess();
  loaded.loadPgn(pgn, { strict: false });

  const moves = loaded.history({ verbose: true });
  const headers = loaded.header();
  const replay = new Chess();

  const timeline = moves.map((move, index) => {
    const fenBeforeMove = replay.fen();
    const playedMove = replay.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    if (!playedMove) {
      throw new Error(`Could not replay move ${index + 1}: ${move.san}`);
    }

    return {
      moveIndex: index,
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      color: index % 2 === 0 ? 'White' : 'Black',
      sanMove: playedMove.san,
      playedMove: `${playedMove.from}${playedMove.to}${playedMove.promotion || ''}`,
      from: playedMove.from,
      to: playedMove.to,
      fenBeforeMove,
      fenAfterMove: replay.fen(),
      bestMove: null,
      evaluation: null,
      centipawnLoss: null,
      classification: 'Pending',
      principalVariation: [],
      isAnalyzing: false,
    };
  });

  return {
    headers,
    initialFen: new Chess().fen(),
    finalFen: loaded.fen(),
    timeline,
    moves,
  };
}

export function metadataFromHeaders(headers = {}, fallback = {}) {
  return {
    white: headers.White || fallback.white || 'White',
    black: headers.Black || fallback.black || 'Black',
    result: headers.Result || fallback.result || '*',
    event: headers.Event || fallback.event || 'Imported PGN',
    date: headers.Date || fallback.date || '',
    opening: headers.ECOUrl ? headers.ECOUrl.split('/').pop()?.replaceAll('-', ' ') : fallback.opening || 'Unknown opening',
    timeControl: headers.TimeControl || fallback.timeControl || 'Unknown',
    // Which side the fetched Chess.com user played ('w' / 'b'), used to orient the board.
    perspective: fallback.perspective || null,
  };
}
