// Evaluations are stored from White's point of view:
//   { type: 'cp', value: 35 }              White is up 0.35
//   { type: 'mate', value: -3 }            Black mates in 3
//   { type: 'mate', value: 0, winner }     The position on the board is already checkmate

export function fromEngineScore(score, turn) {
  const sign = turn === 'w' ? 1 : -1;
  if (score.type === 'mate') {
    const value = score.value * sign;
    return { type: 'mate', value, winner: value > 0 ? 'w' : 'b' };
  }
  return { type: 'cp', value: score.value * sign };
}

const WIN_K = 0.00368208;

/** Probability (0..1) that White wins, using the logistic model Lichess publishes. */
export function whiteWinChance(evaluation) {
  if (!evaluation) return 0.5;
  if (evaluation.type === 'mate') return evaluation.winner === 'w' ? 1 : 0;
  return 1 / (1 + Math.exp(-WIN_K * evaluation.value));
}

export function winChanceFor(color, evaluation) {
  const white = whiteWinChance(evaluation);
  return color === 'w' ? white : 1 - white;
}

/** Mate in N for `color`, or null. */
export function mateFor(color, evaluation) {
  if (evaluation?.type !== 'mate' || evaluation.winner !== color) return null;
  return Math.abs(evaluation.value);
}

export function formatEval(evaluation) {
  if (!evaluation) return '...';
  if (evaluation.type === 'mate') {
    if (evaluation.value === 0) return evaluation.winner === 'w' ? '1-0' : '0-1';
    return `${evaluation.winner === 'w' ? '' : '-'}M${Math.abs(evaluation.value)}`;
  }
  const pawns = evaluation.value / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

/** Short label for the eval bar, e.g. "1.3" or "M4". */
export function formatEvalShort(evaluation) {
  if (!evaluation) return '0.0';
  if (evaluation.type === 'mate') return evaluation.value === 0 ? '#' : `M${Math.abs(evaluation.value)}`;
  return Math.abs(evaluation.value / 100).toFixed(1);
}

/** White's share of the eval bar, 0..100. */
export function evalBarPercent(evaluation) {
  return whiteWinChance(evaluation) * 100;
}
