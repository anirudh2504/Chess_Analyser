import './App.css'
import NavBar from './components/NavBar'

function App() {
  

  return (
    <>
     <div className="page">
      <div className="page__dots" />
      <div className="page__content">
        {/* ── Navigation ── */}
        <NavBar/>
        
      </div>
    </div>
      
    </>
  )
}

export default App
