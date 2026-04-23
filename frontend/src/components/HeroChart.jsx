// components/HeroChart.jsx
import '../App.css';

const BAR_HEIGHTS = [40,65,45,80,55,90,70,85,60,95,75,88,50,78,92,65,82,58,70,88,45,75,60,95,80];
const GRID_LINES  = [0, 1, 2, 3];

export default function HeroChart() {
  return (
    <div className="hero-chart">
     
      {GRID_LINES.map((i) => (
        <div
          key={i}
          className="hero-chart__grid-line"
          style={{ top: `${20 + i * 20}%` }}
        />
      ))}

      
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`hero-chart__bar ${i > 20 ? "hero-chart__bar--active" : "hero-chart__bar--inactive"}`}
          style={{ height: `${h}%` }}
        />
      ))}

      
      <div className="hero-chart__pieces">♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</div>

      
      <div className="hero-chart__glow" />
    </div>
  );
}