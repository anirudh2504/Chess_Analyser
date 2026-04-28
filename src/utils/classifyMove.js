export const CLASSIFICATION_STYLES = {
  Best: 'border-mintGlow/40 bg-mintGlow/10 text-mintGlow',
  Good: 'border-sky-300/40 bg-sky-300/10 text-sky-200',
  Inaccuracy: 'border-amber-300/45 bg-amber-300/10 text-amber-200',
  Mistake: 'border-orange-400/45 bg-orange-400/10 text-orange-200',
  Blunder: 'border-dangerGlow/45 bg-dangerGlow/10 text-rose-200',
  Pending: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
};

export function classifyMove(centipawnLoss = 0) {
  if (centipawnLoss <= 20) return 'Best';
  if (centipawnLoss <= 60) return 'Good';
  if (centipawnLoss <= 120) return 'Inaccuracy';
  if (centipawnLoss <= 250) return 'Mistake';
  return 'Blunder';
}

export function normalizeCentipawn(score, turn) {
  if (!score) return 0;
  if (score.type === 'mate') {
    const mateScore = score.value > 0 ? 100000 - Math.abs(score.value) : -100000 + Math.abs(score.value);
    return turn === 'w' ? mateScore : -mateScore;
  }

  return turn === 'w' ? score.value : -score.value;
}

export function scoreToDisplay(cp = 0) {
  if (Math.abs(cp) > 90000) return cp > 0 ? 'M+' : 'M-';
  const pawns = cp / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

export function evaluationPercent(cp = 0) {
  const clamped = Math.max(-700, Math.min(700, cp));
  return 50 + (clamped / 700) * 50;
}
