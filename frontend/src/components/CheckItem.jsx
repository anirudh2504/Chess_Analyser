import '../App.css';
 
export default function CheckItem({ label }) {
  return (
    <span className="check-item">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.5" stroke="#00d4ff" strokeOpacity="0.5" />
        <path
          d="M5 8l2 2 4-4"
          stroke="#00d4ff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}