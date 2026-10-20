import { Chess } from 'chess.js';

export const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

export function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] };
}

export function moveToUci(move) {
  return `${move.from}${move.to}${move.promotion || ''}`;
}

export function epd(fen) {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** Material of `color` minus material of the opponent, in pawns. */
export function materialBalance(chess, color) {
  let balance = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      balance += (piece.color === color ? 1 : -1) * PIECE_VALUES[piece.type];
    }
  }
  return balance;
}

/**
 * Replay a UCI line from `fen`. Returns the verbose moves (with `fen` after each one).
 * Stops quietly at the first illegal move, which can happen with stale engine output.
 */
export function playLine(fen, ucis, maxPlies = Infinity) {
  const chess = new Chess(fen);
  const moves = [];
  for (const uci of ucis.slice(0, maxPlies)) {
    let move;
    try {
      move = chess.move(uciToMove(uci));
    } catch {
      break;
    }
    if (!move) break;
    moves.push({ ...move, uci, fen: chess.fen() });
  }
  return moves;
}

/** Format SAN moves with move numbers, e.g. "12. Nf3 Bg4 13. h3" or "12... Bg4 13. h3". */
export function formatLine(fen, sanMoves) {
  const [, turn, , , , fullmove] = fen.split(' ');
  let moveNumber = Number(fullmove) || 1;
  let white = turn === 'w';
  return sanMoves
    .map((san, index) => {
      let text = '';
      if (white) text = `${moveNumber}. ${san}`;
      else text = index === 0 ? `${moveNumber}... ${san}` : san;
      if (!white) moveNumber += 1;
      white = !white;
      return text;
    })
    .join(' ');
}

/**
 * Material change for `color` along a line, measured at a "settled" point: after the last ply
 * that is not immediately followed by a capture, so half-finished exchanges are not counted.
 */
export function materialSwing(fen, ucis, color, maxPlies = 10) {
  const start = new Chess(fen);
  const base = materialBalance(start, color);
  const moves = playLine(fen, ucis);
  if (!moves.length) return { swing: 0, moves };

  let settledIndex = Math.min(moves.length, maxPlies) - 1;
  while (settledIndex > 0 && moves[settledIndex + 1]?.captured) settledIndex -= 1;
  const settled = new Chess(moves[settledIndex].fen);
  return { swing: materialBalance(settled, color) - base, moves, settledIndex };
}

/**
 * Static exchange evaluation: how much material the side to move wins by starting a capture
 * sequence on `square` (0 if capturing there is not worth it). Uses real legal moves, so pins
 * and discovered attackers are respected.
 */
export function staticExchange(chess, square, depth = 0) {
  if (depth > 12) return 0;
  const captures = chess
    .moves({ verbose: true })
    .filter((move) => move.to === square && move.captured);
  if (!captures.length) return 0;

  captures.sort((a, b) => PIECE_VALUES[a.piece] - PIECE_VALUES[b.piece]);
  const capture = captures[0];
  const gained = PIECE_VALUES[capture.captured] + (capture.promotion ? PIECE_VALUES[capture.promotion] - 1 : 0);
  chess.move(capture);
  const reply = staticExchange(chess, square, depth + 1);
  chess.undo();
  return Math.max(0, gained - reply);
}

/** Pieces of `color` that the side to move in `fen` can win material against. */
export function hangingPieces(fen, color, minValue = 1) {
  const chess = new Chess(fen);
  if (chess.turn() === color) return [];
  const result = [];
  chess.board().forEach((row) =>
    row.forEach((piece) => {
      if (!piece || piece.color !== color || piece.type === 'k' || PIECE_VALUES[piece.type] < minValue) return;
      const gain = staticExchange(chess, piece.square);
      if (gain > 0) result.push({ square: piece.square, type: piece.type, gain });
    }),
  );
  return result.sort((a, b) => b.gain - a.gain);
}

/** Same position with the other side to move (en passant cleared), or null if that is illegal. */
export function passTurn(fen) {
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  try {
    return new Chess(parts.join(' '));
  } catch {
    return null;
  }
}

/** What the side that just moved threatens to win next move, if the opponent did nothing. */
export function threatsAfter(fenAfterMove) {
  const chess = new Chess(fenAfterMove);
  if (chess.inCheck()) return [];
  const mover = chess.turn() === 'w' ? 'b' : 'w';
  const passed = passTurn(fenAfterMove);
  if (!passed) return [];
  const opponent = mover === 'w' ? 'b' : 'w';
  return hangingPieces(passed.fen(), opponent, 3);
}

/**
 * Detect a fork: after `move`, the moved piece attacks two or more enemy targets that are worth
 * more than it or are undefended (the king always counts).
 */
export function forkTargets(fenAfterMove, move) {
  const chess = new Chess(fenAfterMove);
  const attacker = move.color;
  const victim = attacker === 'w' ? 'b' : 'w';
  const attackerValue = PIECE_VALUES[move.promotion || move.piece];
  const targets = [];
  chess.board().forEach((row) =>
    row.forEach((piece) => {
      if (!piece || piece.color !== victim) return;
      const attackers = chess.attackers(piece.square, attacker);
      if (!attackers.includes(move.to)) return;
      const defended = chess.isAttacked(piece.square, victim);
      if (piece.type === 'k' || PIECE_VALUES[piece.type] > attackerValue || (!defended && PIECE_VALUES[piece.type] >= 3)) {
        targets.push(piece);
      }
    }),
  );
  return targets.length >= 2 ? targets : [];
}

/**
 * A move is a sacrifice when, afterwards, the opponent can win material from the mover
 * (by static exchange) worth clearly more than whatever the move itself captured.
 */
export function sacrificedPiece(fenBeforeMove, fenAfterMove, move) {
  const captured = move.captured ? PIECE_VALUES[move.captured] : 0;
  // Pieces that were already en prise before the move are not being sacrificed by it.
  const passed = passTurn(fenBeforeMove);
  const alreadyHanging = new Set(passed ? hangingPieces(passed.fen(), move.color, 3).map((piece) => `${piece.square}${piece.type}`) : []);
  const hanging = hangingPieces(fenAfterMove, move.color, 3).filter((piece) => !alreadyHanging.has(`${piece.square}${piece.type}`));
  const biggest = hanging[0];
  if (!biggest) return null;
  if (biggest.gain - captured < 2) return null;
  return biggest;
}

export function legalMoveCount(fen) {
  return new Chess(fen).moves().length;
}
