
import '../App.css';
export default function NavBar({ logo = "CHESS_ANALYSER"}) {
  return (
    <nav className="navbar">
      <div className="navbar__brand" >
        <div className="navbar__icon">♟</div>
        <span className="navbar__logo-text">{logo}</span>
      </div>
    </nav>
  );
}