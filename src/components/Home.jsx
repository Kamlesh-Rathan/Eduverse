import './Home.css'

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="app-title">EduVerse</h1>
        <p className="tagline">AI-Powered Learning Ecosystem</p>
        <div className="welcome-card">
          <h2>Welcome, Student! 👋</h2>
          <p className="welcome-text">
            Your all-in-one platform for mastering Class 11-12 subjects and 
            preparing for board exams and competitive tests like JEE/NEET.
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span className="feature-text">AI Doubt Solver</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span className="feature-text">NCERT-Based</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Smart Scheduling</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗺️</span>
              <span className="feature-text">Visual Mindmaps</span>
            </div>
          </div>
        </div>
        <div className="cta-section">
          <p className="cta-text">Get started by selecting a feature from the navigation above!</p>
        </div>
      </div>
    </div>
  )
}

export default Home
