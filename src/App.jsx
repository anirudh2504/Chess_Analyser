import { useEffect, useState } from 'react';
import AnalyzerBoard from './components/AnalyzerBoard';
import LandingPage from './components/LandingPage';
import { useGameAnalysis } from './hooks/useGameAnalysis';
import { useStockfish } from './hooks/useStockfish';

export default function App() {
  const { ready: engineReady, engineError, analyzeFen } = useStockfish();
  const analysis = useGameAnalysis(analyzeFen);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  function handleSelectGame(game) {
    setSelectedGameId(game.id);
    analysis.loadPgn(game.pgn, {
      white: game.white,
      black: game.black,
      result: game.result,
      opening: game.opening,
      date: game.date,
      timeControl: game.timeControl,
      event: 'Chess.com Game',
    });
  }

  function handleImportPgn(pgn) {
    setSelectedGameId(null);
    analysis.loadPgn(pgn);
  }

  function reset() {
    setSelectedGameId(null);
    analysis.resetGame();
  }

  if (analysis.gameData) {
    return (
      <AnalyzerBoard
        boardFen={analysis.boardFen}
        gameData={analysis.gameData}
        metadata={analysis.metadata}
        currentNode={analysis.currentNode}
        currentMove={analysis.currentMove}
        analysisByMove={analysis.analysisByMove}
        engineReady={engineReady}
        engineError={engineError || analysis.error}
        status={analysis.status}
        onNavigate={analysis.navigateTo}
        onPrevious={analysis.previousMove}
        onNext={analysis.nextMove}
        onReset={reset}
      />
    );
  }

  return (
    <LandingPage
      onImportPgn={handleImportPgn}
      games={games}
      onGamesLoaded={setGames}
      onSelectGame={handleSelectGame}
      selectedGameId={selectedGameId}
      error={analysis.error}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
    />
  );
}
