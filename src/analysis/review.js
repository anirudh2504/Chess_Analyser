import { Chess } from 'chess.js';
import { formatEval, mateFor, whiteWinChance, winChanceFor } from './evaluation';
import {
  PIECE_NAMES,
  PIECE_VALUES,
  epd,
  forkTargets,
  formatLine,
  hangingPieces,
  legalMoveCount,
  materialSwing,
  passTurn,
  playLine,
  sacrificedPiece,
  threatsAfter,
  uciToMove,
} from './tactics';

export const CLASSIFICATIONS = {
  brilliant: { label: 'Brilliant', symbol: '!!', color: '#26c2a3', article: 'a brilliant move' },
  great: { label: 'Great', symbol: '!', color: '#749bbf', article: 'a great move' },
  best: { label: 'Best', symbol: '★', color: '#81b64c', article: 'the best move' },
  excellent: { label: 'Excellent', symbol: '👍', color: '#81b64c', article: 'an excellent move' },
  good: { label: 'Good', symbol: '✓', color: '#95b776', article: 'a good move' },
  book: { label: 'Book', symbol: '📖', color: '#d5a47d', article: 'a book move' },
  forced: { label: 'Forced', symbol: '→', color: '#97af8b', article: 'the only legal move' },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', color: '#f7c631', article: 'an inaccuracy' },
  mistake: { label: 'Mistake', symbol: '?', color: '#ffa459', article: 'a mistake' },
  miss: { label: 'Miss', symbol: '✕', color: '#ff7769', article: 'a miss' },
  blunder: { label: 'Blunder', symbol: '??', color: '#fa412d', article: 'a blunder' },
};

export const SUMMARY_ORDER = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'miss', 'blunder'];

const BAD = new Set(['inaccuracy', 'mistake', 'miss', 'blunder']);

// Expected-points thresholds (loss in win probability for the mover).
function classifyByLoss(loss) {
  if (loss <= 0.02) return 'excellent';
  if (loss <= 0.05) return 'good';
  if (loss <= 0.1) return 'inaccuracy';
  if (loss <= 0.2) return 'mistake';
  return 'blunder';
}

function sanLine(fen, ucis, maxPlies = 8) {
  const moves = playLine(fen, ucis, maxPlies);
  return { moves, text: formatLine(fen, moves.map((move) => move.san)) };
}

function opponentOf(color) {
  return color === 'w' ? 'b' : 'w';
}

function sideName(color) {
  return color === 'w' ? 'White' : 'Black';
}

function joinClauses(clauses) {
  if (clauses.length <= 1) return clauses[0] || '';
  return `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}`;
}

/**
 * Review a single move. `before` and `after` are the engine analyses of the positions before and
 * after the move; `previous` is the review of the opponent's preceding move (or null).
 */
export function reviewMove({ node, before, after, previous, book, inBook }) {
  const mover = node.color === 'White' ? 'w' : 'b';
  const opponent = opponentOf(mover);
  const chess = new Chess(node.fenBeforeMove);
  const move = chess.move(uciToMove(node.playedMove));

  const bestEval = before.lines[0]?.eval ?? before.eval;
  const winBest = winChanceFor(mover, bestEval);
  const winPlayed = winChanceFor(mover, after.eval);
  const isBestMove = node.playedMove === before.bestMove;
  const loss = isBestMove ? 0 : Math.max(0, winBest - winPlayed);
  const secondLine = before.lines[1];
  const previousErred = previous && BAD.has(previous.classification);

  const isBook = inBook && book.has(epd(node.fenAfterMove));
  let classification;
  let sacrifice = null;

  if (legalMoveCount(node.fenBeforeMove) === 1) {
    classification = 'forced';
  } else if (isBook) {
    classification = 'book';
  } else if (loss <= 0.02) {
    sacrifice = sacrificedPiece(node.fenBeforeMove, node.fenAfterMove, move);
    const onlyMoveGap = secondLine ? winBest - winChanceFor(mover, secondLine.eval) : 0;
    const isRecapture = previous?.move?.captured && previous.move.to === move.to && move.captured;

    const isMate = node.sanMove.includes('#');
    // Brilliant: the engine's own top move, a genuine piece sacrifice (not a king move leaving
    // something behind), and the position was not already completely won - unless the sacrifice
    // itself forces mate (e.g. Morphy's 16.Qb8+).
    const forcesMate = mateFor(mover, after.eval);
    const brilliant =
      sacrifice && isBestMove && move.piece !== 'k' && winPlayed >= 0.5 && (winBest <= 0.95 || forcesMate) && !isMate;
    if (brilliant) classification = 'brilliant';
    else if (isBestMove && !isMate && !isRecapture && (onlyMoveGap >= 0.15 || (previousErred && onlyMoveGap >= 0.08))) classification = 'great';
    else if (isBestMove || loss <= 0.005) classification = 'best';
    else classification = 'excellent';
  } else {
    classification = classifyByLoss(loss);
    // Walking into a forced mate is never just an inaccuracy, even in a bad position.
    const allowedMate = mateFor(opponent, after.eval);
    if (allowedMate && !mateFor(opponent, bestEval) && classification !== 'blunder') {
      classification = allowedMate <= 3 || winBest >= 0.1 ? 'blunder' : 'mistake';
    }
    const missedMate = mateFor(mover, bestEval) && !mateFor(mover, after.eval);
    if (BAD.has(classification) && loss > 0.1 && winPlayed >= 0.35 && (previousErred || missedMate)) {
      classification = 'miss';
    }
  }

  const bestLine = before.lines[0] ? sanLine(node.fenBeforeMove, before.lines[0].pv) : { moves: [], text: '' };
  const threatLine = after.lines[0] ? sanLine(node.fenAfterMove, after.lines[0].pv) : { moves: [], text: '' };

  const explanation = explain({
    node,
    move,
    mover,
    opponent,
    classification,
    bestEval,
    winBest,
    winPlayed,
    before,
    after,
    bestLine,
    threatLine,
    sacrifice,
    previous,
    isBestMove,
    book,
  });

  return {
    moveIndex: node.moveIndex,
    move,
    classification,
    loss,
    isBestMove,
    bestMove: before.bestMove,
    bestSan: bestLine.moves[0]?.san || null,
    bestLine,
    threatLine,
    evalBefore: bestEval,
    evaluation: after.eval,
    winBest,
    winPlayed,
    explanation,
    inBook: isBook,
  };
}

function describeGoodMove({ node, move, mover, opponent, after }) {
  const clauses = [];
  const before = new Chess(node.fenBeforeMove);

  if (move.san.includes('#')) return ['It delivers checkmate.'];
  if (before.inCheck()) clauses.push('gets you out of check');
  if (move.flags.includes('k') || move.flags.includes('q')) clauses.push('castles your king to safety');
  if (move.promotion) clauses.push(`promotes to a ${PIECE_NAMES[move.promotion]}`);
  if (move.captured) {
    const recapturable = hangingPieces(node.fenAfterMove, mover, 1).some((piece) => piece.square === move.to);
    clauses.push(recapturable ? `trades on ${move.to}` : `wins the ${PIECE_NAMES[move.captured]} on ${move.to}`);
  }
  const backRank = mover === 'w' ? '1' : '8';
  if (['n', 'b'].includes(move.piece) && move.from[1] === backRank && node.moveNumber <= 15) clauses.push(`develops your ${PIECE_NAMES[move.piece]}`);

  const savedBefore = passTurn(node.fenBeforeMove);
  if (savedBefore && !before.inCheck()) {
    const wasHanging = hangingPieces(savedBefore.fen(), mover, 3).filter((piece) => piece.square !== move.to);
    const stillHanging = new Set(hangingPieces(node.fenAfterMove, mover, 3).map((piece) => piece.square));
    const saved = wasHanging.find((piece) => !stillHanging.has(piece.square));
    if (saved || (wasHanging.some((piece) => piece.square === move.from) && !stillHanging.has(move.to))) {
      const piece = saved || { type: move.piece };
      clauses.push(`keeps your ${PIECE_NAMES[piece.type]} safe`);
    }
  }

  if (move.san.includes('+')) clauses.push(`checks the ${sideName(opponent)} king`);
  const threats = threatsAfter(node.fenAfterMove);
  if (threats[0]) clauses.push(`attacks the ${PIECE_NAMES[threats[0].type]} on ${threats[0].square}`);

  const mate = mateFor(mover, after.eval);
  const sentences = [];
  if (clauses.length) sentences.push(`It ${joinClauses(clauses.slice(0, 3))}.`);
  if (mate) sentences.push(`You have a forced checkmate in ${mate}.`);
  return sentences;
}

function pieceList(types) {
  const counts = {};
  types.forEach((type) => {
    counts[type] = (counts[type] || 0) + 1;
  });
  const words = ['', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  return joinClauses(
    Object.entries(counts)
      .sort(([a], [b]) => PIECE_VALUES[b] - PIECE_VALUES[a])
      .map(([type, count]) => (count === 1 ? `a ${PIECE_NAMES[type]}` : `${words[count] || count} ${PIECE_NAMES[type]}s`)),
  );
}

/** Net pieces lost and won by `color` over a line, with equal trades cancelled out. */
function netMaterial({ moves, settledIndex }, color) {
  const lost = [];
  const won = [];
  moves.slice(0, settledIndex + 1).forEach((step) => {
    if (step.captured) (step.color === color ? won : lost).push(step.captured);
  });
  for (const type of [...won]) {
    const index = lost.indexOf(type);
    if (index >= 0) {
      lost.splice(index, 1);
      won.splice(won.indexOf(type), 1);
    }
  }
  return { lost, won };
}

function describeMistake({ node, move, mover, opponent, bestEval, before, after, bestLine, threatLine, winBest, winPlayed }) {
  const sentences = [];
  const mateAgainst = mateFor(opponent, after.eval);
  const mateAgainstAlready = mateFor(opponent, bestEval);
  const missedMate = mateFor(mover, bestEval);
  const keepsMate = mateFor(mover, after.eval);

  if (missedMate && !keepsMate) {
    sentences.push(`You missed a forced checkmate in ${missedMate}: ${bestLine.text}.`);
  }
  if (mateAgainst && !mateAgainstAlready) {
    sentences.push(`This allows ${sideName(opponent)} to force checkmate in ${mateAgainst}: ${threatLine.text}.`);
  } else if (mateAgainst) {
    sentences.push(`You were already facing mate, and this makes it faster (mate in ${mateAgainst}).`);
  }

  // Material: what happens after the played move vs. after the best move.
  const playedUcis = [node.playedMove, ...(after.lines[0]?.pv || [])];
  const played = materialSwing(node.fenBeforeMove, playedUcis, mover);
  const best = materialSwing(node.fenBeforeMove, before.lines[0]?.pv || [], mover);

  if (!mateAgainst && !missedMate) {
    const reply = threatLine.moves[0];
    const fork = reply ? forkTargets(reply.fen, reply) : [];

    if (fork.length) {
      const names = fork.map((piece) => (piece.type === 'k' ? 'king' : `${PIECE_NAMES[piece.type]} on ${piece.square}`));
      sentences.push(`This allows a fork: ${reply.san} attacks your ${joinClauses(names)}.`);
    }

    if (played.swing <= -2 && best.swing - played.swing >= 2) {
      // Only call a piece "hanging" if the opponent's very next move wins it by force.
      const hanging = hangingPieces(node.fenAfterMove, mover, 1);
      // ...and only if that piece accounts for most of what is lost.
      const hangingTarget =
        reply?.captured &&
        PIECE_VALUES[reply.captured] >= Math.abs(played.swing) - 1 &&
        hanging.find((piece) => piece.square === reply.to);
      if (hangingTarget && reply.to === move.to) {
        sentences.push(`Your ${PIECE_NAMES[reply.captured]} on ${move.to} is not safe there: ${sideName(opponent)} wins it with ${reply.san}.`);
      } else if (hangingTarget) {
        sentences.push(`This leaves your ${PIECE_NAMES[reply.captured]} on ${reply.to} hanging, and ${reply.san} wins it.`);
      } else if (!fork.length) {
        const { lost, won } = netMaterial(played, mover);
        const result = lost.length ? `you lose ${pieceList(lost)}${won.length ? ` for ${pieceList(won)}` : ''}` : 'you lose material';
        sentences.push(`This loses material: after ${threatLine.text}, ${result}.`);
      }
    } else if (best.swing >= 2 && best.swing - played.swing >= 2) {
      const bestCapture = [...best.moves].filter((step) => step.color === mover && step.captured).sort((a, b) => PIECE_VALUES[b.captured] - PIECE_VALUES[a.captured])[0];
      const bestFork = best.moves[0] ? forkTargets(best.moves[0].fen, best.moves[0]) : [];
      if (bestFork.length) sentences.push(`You missed a fork with ${best.moves[0].san}, which wins material.`);
      else if (bestCapture) sentences.push(`You missed a chance to win the ${PIECE_NAMES[bestCapture.captured]}: ${bestLine.text}.`);
      else sentences.push(`You missed a chance to win material: ${bestLine.text}.`);
    } else if (move.captured && hangingPieces(node.fenAfterMove, mover, 1).some((piece) => piece.square === move.to)) {
      sentences.push(`The capture on ${move.to} doesn't work: ${sideName(opponent)} can take back and comes out ahead.`);
    }
  }

  if (!sentences.length) {
    const change = `(${formatEval(bestEval)} → ${formatEval(after.eval)})`;
    if (winBest >= 0.55 && winPlayed < 0.55) sentences.push(`This throws away your advantage ${change}.`);
    else if (winBest >= 0.55) sentences.push(`Your position is still good, but this gives back part of your advantage ${change}.`);
    else if (winBest >= 0.45 && winPlayed < 0.45) sentences.push(`This hands ${sideName(opponent)} the advantage ${change}.`);
    else if (winBest >= 0.45) sentences.push(`This lets the position slip ${change}.`);
    else sentences.push(`You were already worse, and this makes your position even harder to hold ${change}.`);
  }

  if (threatLine.moves[0] && !mateAgainst) {
    sentences.push(`${sideName(opponent)}'s best reply is ${threatLine.moves[0].san}.`);
  }
  return sentences;
}

function explain(context) {
  const { node, move, mover, opponent, classification, after, bestLine, sacrifice, previous, isBestMove, book, winPlayed } = context;
  const info = CLASSIFICATIONS[classification];
  const headline = `${node.sanMove} is ${info.article}`;
  let sentences = [];

  if (classification === 'book') {
    const name = book.get(epd(node.fenAfterMove));
    sentences.push(name ? `This is opening theory: ${name}.` : 'This is a well-known opening move.');
  } else if (classification === 'forced') {
    sentences.push('It was the only legal move.');
  } else if (classification === 'brilliant') {
    const mate = mateFor(mover, after.eval);
    sentences.push(
      `You sacrifice your ${PIECE_NAMES[sacrifice.type]} on ${sacrifice.square}. ${sideName(opponent)} can take it, but ${
        mate ? `that runs into a forced mate in ${mate}` : 'the engine line shows you come out on top'
      }.`,
    );
  } else if (BAD.has(classification)) {
    sentences = describeMistake(context);
    if (bestLine.moves[0]) sentences.push(`Best was ${bestLine.moves[0].san}.`);
  } else {
    if (classification === 'great') {
      const keeps = winPlayed >= 0.6 ? 'keeps your advantage' : winPlayed >= 0.4 ? 'holds the balance' : 'keeps you in the game';
      const punished = previous && BAD.has(previous.classification) ? `, and it punishes ${sideName(opponent)}'s ${previous.classification}` : '';
      sentences.push(`It's the only good move here: it ${keeps}${punished}.`);
    }
    sentences.push(...describeGoodMove(context));
    if (!isBestMove && bestLine.moves[0]) {
      sentences.push(classification === 'best' ? `${bestLine.moves[0].san} is just as good.` : `Best was ${bestLine.moves[0].san}.`);
    }
  }

  return { headline, sentences };
}

/**
 * Lichess-style accuracy: each move scores 0-100 from the drop in win chance, and the game score
 * combines a volatility-weighted mean with a harmonic mean.
 */
export function computeAccuracy(positionEvals, reviews) {
  const wins = positionEvals.map((evaluation) => whiteWinChance(evaluation) * 100);
  if (wins.length < 2) return { w: null, b: null };

  const windowSize = Math.max(2, Math.min(8, Math.floor(wins.length / 10)));
  const weights = reviews.map((_, index) => {
    const start = Math.max(0, Math.min(index, wins.length - windowSize));
    const window = wins.slice(start, start + windowSize);
    const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
    const deviation = Math.sqrt(window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / window.length);
    return Math.max(0.5, Math.min(12, deviation));
  });

  const perColor = { w: [], b: [] };
  reviews.forEach((review, index) => {
    const color = index % 2 === 0 ? 'w' : 'b';
    const sign = color === 'w' ? 1 : -1;
    const winBefore = 50 + sign * (wins[index] - 50);
    const winAfter = 50 + sign * (wins[index + 1] - 50);
    const drop = review?.isBestMove ? 0 : Math.max(0, winBefore - winAfter);
    const accuracy = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * drop) - 3.1669 + 1));
    perColor[color].push({ accuracy, weight: weights[index] });
  });

  const score = (entries) => {
    if (!entries.length) return null;
    const weighted = entries.reduce((sum, entry) => sum + entry.accuracy * entry.weight, 0) / entries.reduce((sum, entry) => sum + entry.weight, 0);
    const harmonic = entries.length / entries.reduce((sum, entry) => sum + 1 / Math.max(entry.accuracy, 1), 0);
    return Math.min(100, (weighted + harmonic) / 2);
  };

  return { w: score(perColor.w), b: score(perColor.b) };
}

export function countClassifications(reviews) {
  const counts = { w: {}, b: {} };
  reviews.forEach((review, index) => {
    if (!review) return;
    const color = index % 2 === 0 ? 'w' : 'b';
    counts[color][review.classification] = (counts[color][review.classification] || 0) + 1;
  });
  return counts;
}
