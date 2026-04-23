
import '../App.css';
export default function NavBar({ logo = "CHESS_ANALYTICS", onLogoClick }) {
  return (
    <nav className="navbar">
      <div className="navbar__brand" onClick={onLogoClick}>
        <div className="navbar__icon">♟</div>
        <span className="navbar__logo-text">{logo}</span>
      </div>
    </nav>
  );
}