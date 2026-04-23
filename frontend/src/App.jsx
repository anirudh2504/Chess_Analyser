import './App.css'
import CheckItem from './components/CheckItem'
import HeroChart from './components/HeroChart'
import NavBar from './components/NavBar'

function App() {
  

  return (
    <>
     <div className="page">
      <div className="page__dots" />
      <div className="page__content">
        
        <NavBar/>
        

        <section className="page__section page__hero">
          <div className="hero__inner">
           
            <div className="hero__copy">
               <span className="badge">
               <span className="badge__icon">⚡</span>
               Powered by Stockfish 16.1
               </span>
 
              <h1 className="hero__heading">
                Welcome to{" "}
                <span className="hero__heading--accent">
                  Chess
                  <br />
                  Analyser
                </span>
              </h1>
 
              <p className="hero__body">
                Master the board with precision. Import your games from Chess.com
                or paste PGN strings to receive grandmaster-level insights powered
                by the world's strongest chess engines.
              </p>
 
              <div className="check-item__features">
                <CheckItem label="Deep Engine Analysis" />
                <CheckItem label="Blunder Detection"    />
                <CheckItem label="Accuracy Scores"      />
              </div>
            </div>
 
            
            <div className="hero__chart-wrap">
              <HeroChart/>
            </div>
          </div>
        </section>
        
      </div>
    </div>
      
    </>
  )
}

export default App
