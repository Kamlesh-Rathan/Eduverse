import './Navigation.css'

function Navigation({ activeSection, setActiveSection, theme, toggleTheme }) {
  const navItems = [
    { id: 'doubt', label: 'Ask Doubt', icon: '❓' },
    { id: 'cheatsheets', label: 'Cheat Sheets', icon: '📄' },
    { id: 'mindmap', label: 'Mindmap', icon: '🗺️' },
    { id: 'schedule', label: 'Schedule', icon: '📅' }
  ]

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button 
          className="nav-logo"
          onClick={() => setActiveSection('home')}
        >
          🎓 EduVerse
        </button>
        <div className="nav-buttons">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  )
}

export default Navigation
