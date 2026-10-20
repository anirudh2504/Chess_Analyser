import { CLASSIFICATIONS } from '../../analysis/review';

export default function ClassificationBadge({ classification, size = 20, className = '' }) {
  const info = CLASSIFICATIONS[classification];
  if (!info) return null;
  return (
    <span
      title={info.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black leading-none text-white shadow ${className}`}
      style={{ width: size, height: size, background: info.color, fontSize: size * 0.5 }}
    >
      {info.symbol}
    </span>
  );
}
