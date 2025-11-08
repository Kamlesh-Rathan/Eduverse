import { useState } from 'react'
import Home from './components/Home'
import Navigation from './components/Navigation'
import AskDoubt from './components/AskDoubt'
import CheatSheets from './components/CheatSheets'
import Mindmap from './components/Mindmap'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('home')

  return (
    <div className="app">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="main-content">
        {activeSection === 'home' && <Home />}
        {activeSection === 'doubt' && <AskDoubt />}
        {activeSection === 'cheatsheets' && <CheatSheets />}
        {activeSection === 'mindmap' && <Mindmap />}
        {activeSection === 'schedule' && (
          <div className="placeholder-section">
            <h2>Schedule</h2>
            <p>Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
