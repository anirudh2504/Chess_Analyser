import { whiteWinChance } from '../../analysis/evaluation';
import { CLASSIFICATIONS } from '../../analysis/review';

const WIDTH = 600;
const HEIGHT = 90;
const MARKED = new Set(['brilliant', 'great', 'miss', 'mistake', 'blunder']);

/** Win-chance graph of the whole game. Click anywhere to jump to that move. */
export default function EvalGraph({ positions, reviews, currentMove, totalPositions, onNavigate }) {
  if (totalPositions < 2) return null;
  const step = WIDTH / (totalPositions - 1);
  const points = [];
  for (let index = 0; index < totalPositions; index += 1) {
    if (!positions[index]) break;
    points.push([index * step, HEIGHT * (1 - whiteWinChance(positions[index].eval))]);
  }

  const area = points.length
    ? `M0,${HEIGHT} ${points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} L${points[points.length - 1][0].toFixed(1)},${HEIGHT} Z`
    : '';
  const cursorX = (currentMove + 1) * step;

  function handleClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onNavigate(Math.round(ratio * (totalPositions - 1)) - 1);
  }

  return (
    <div className="relative h-20 w-full cursor-pointer overflow-hidden rounded bg-[#1f2933]" onClick={handleClick}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Evaluation graph">
        <path d={area} fill="#f0f9ff" />
        <line x1="0" x2={WIDTH} y1={HEIGHT / 2} y2={HEIGHT / 2} stroke="#72d9ff" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
        <line x1={cursorX} x2={cursorX} y1="0" y2={HEIGHT} stroke="#72d9ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {reviews.map((review, index) =>
        review && MARKED.has(review.classification) && points[index + 1] ? (
          <span
            key={index}
            title={`${CLASSIFICATIONS[review.classification].label}: ${review.move.san}`}
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-900"
            style={{
              left: `${(points[index + 1][0] / WIDTH) * 100}%`,
              top: `${(points[index + 1][1] / HEIGHT) * 100}%`,
              background: CLASSIFICATIONS[review.classification].color,
            }}
          />
        ) : null,
      )}
    </div>
  );
}
