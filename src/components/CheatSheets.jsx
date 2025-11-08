import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import './CheatSheets.css'

function CheatSheets() {
  const [topic, setTopic] = useState('')
  const [currentSheet, setCurrentSheet] = useState(null)
  const [savedSheets, setSavedSheets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSheet, setSelectedSheet] = useState(null)

  // Preprocess LaTeX to ensure proper rendering
  const preprocessLatex = (text) => {
    if (!text) return text
    
    let processed = text
    
    // Convert \[ ... \] to $$ ... $$ (display math)
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => `$$${content}$$`)
    
    // Convert \( ... \) to $ ... $ (inline math)
    processed = processed.replace(/\\\((.*?)\\\)/g, (match, content) => `$${content}$`)
    
    // Convert [ ... ] to $$ ... $$ if it contains LaTeX-like content
    processed = processed.replace(/\[\s*([^[\]]*(?:\\[a-zA-Z]+|[_^{}])[^[\]]*)\s*\]/g, (match, content) => `$$${content}$$`)
    
    return processed
  }

  // Load saved cheat sheets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eduverse_cheatsheets')
    if (saved) {
      try {
        setSavedSheets(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading cheat sheets:', error)
      }
    }
  }, [])

  // Generate a short title from the topic
  const generateTitle = (topic) => {
    const cleaned = topic.trim()
    return cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    const topicText = topic.trim()

    try {
      const systemPrompt = `You are an expert tutor for Indian students (Class 11-12) preparing for CBSE board exams and JEE/NEET.

Create a cheat sheet for the topic: [TOPIC]

STRICT FORMAT REQUIREMENTS:
- Start with "# [Topic Name]"
- Use ONLY bullet points (•) - NO paragraphs
- Each bullet point must be ONE concise line (max 15 words)
- Sub-points use "  - " (two spaces + dash)

STRUCTURE:
1. **Key Concepts** (3-4 bullets)
2. **Important Formulas** (2-3 formulas in LaTeX: use $ for inline)
3. **Key Points to Remember** (2-3 bullets)
4. **NCERT Reference**: Chapter name and number

EXAMPLE FORMAT:
# Newton's Laws of Motion

**Key Concepts:**
- First law: Objects remain at rest or in motion unless acted upon by force
- Second law: F = ma (Force equals mass times acceleration)
  - Force is directly proportional to acceleration
- Third law: Every action has equal and opposite reaction

**Important Formulas:**
- $F = ma$ (Newton's Second Law)
- $F_{net} = \frac{dp}{dt}$ (Rate of change of momentum)

**Key Points:**
- Inertia increases with mass
- Net force causes acceleration, not velocity
- Action-reaction pairs act on different objects

**NCERT Reference:** Class 11 Physics, Chapter 5: Laws of Motion

Keep it SHORT, CLEAR, and EXAM-FOCUSED. Use bullet points ONLY.`

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a cheat sheet for: ${topicText}` }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_CHEATSHEET_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EduVerse - Cheat Sheets'
          }
        }
      )

      const content = response.data.choices[0].message.content

      const newSheet = {
        id: Date.now(),
        topic: topicText,
        content: content,
        timestamp: new Date().toISOString()
      }

      setCurrentSheet(newSheet)
      setSelectedSheet(null)
      setTopic('')

    } catch (error) {
      console.error('Error generating cheat sheet:', error)
      
      let errorMessage = 'Failed to generate cheat sheet. Please try again.'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'API key is invalid or missing. Please check your .env.local file and add VITE_CHEATSHEET_API_KEY.'
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else {
          errorMessage = `Error: ${error.response.data?.error?.message || 'Unknown error'}`
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.'
      }

      setCurrentSheet({
        id: Date.now(),
        topic: topicText,
        content: `❌ ${errorMessage}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!currentSheet) return

    const updated = [currentSheet, ...savedSheets]
    localStorage.setItem('eduverse_cheatsheets', JSON.stringify(updated))
    setSavedSheets(updated)
    alert('✅ Cheat sheet saved successfully!')
  }

  const handleView = (sheet) => {
    setSelectedSheet(sheet)
    setCurrentSheet(null)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this cheat sheet?')) {
      const updated = savedSheets.filter(sheet => sheet.id !== id)
      localStorage.setItem('eduverse_cheatsheets', JSON.stringify(updated))
      setSavedSheets(updated)
      if (selectedSheet?.id === id) {
        setSelectedSheet(null)
      }
    }
  }

  const displaySheet = selectedSheet || currentSheet

  return (
    <div className="cheatsheets-container">
      <div className="cheatsheets-header">
        <h1>📚 Cheat Sheets</h1>
        <p className="cheatsheets-subtitle">Quick reference guides for Maths, Physics & Chemistry</p>
      </div>

      <div className="cheatsheets-layout">
        {/* Sidebar */}
        {savedSheets.length > 0 && (
          <div className="sheets-sidebar">
            <div className="sheets-sidebar-header">
              <h3>Saved Sheets</h3>
              <span className="sheets-count">{savedSheets.length}</span>
            </div>
            <div className="sheets-sidebar-list">
              {savedSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`sheet-item ${selectedSheet?.id === sheet.id ? 'active' : ''}`}
                >
                  <div className="sheet-item-content" onClick={() => handleView(sheet)}>
                    <div className="sheet-item-icon">📄</div>
                    <div className="sheet-item-title">{generateTitle(sheet.topic)}</div>
                  </div>
                  <button
                    className="sheet-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(sheet.id)
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="sheets-main-content">
          <form onSubmit={handleGenerate} className="topic-form">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., 'Newton's Laws', 'Organic Chemistry Reactions', 'Trigonometry Formulas')"
              className="topic-input"
              disabled={loading}
            />
            <button type="submit" className="generate-btn" disabled={loading || !topic.trim()}>
              {loading ? '⏳ Generating...' : '✨ Generate Cheat Sheet'}
            </button>
          </form>

          <div className="sheet-display-area">
            {!displaySheet ? (
              <div className="empty-state">
                <p>💡 No cheat sheet generated yet. Enter a topic above!</p>
                <div className="example-topics">
                  <p><strong>Example topics:</strong></p>
                  <ul>
                    <li>"Newton's Laws of Motion"</li>
                    <li>"Organic Chemistry Reactions"</li>
                    <li>"Trigonometry Formulas"</li>
                    <li>"Thermodynamics Laws"</li>
                    <li>"Calculus Basics"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="sheet-content">
                <div className="sheet-header-bar">
                  <div>
                    <h2>{displaySheet.topic}</h2>
                    <p className="sheet-timestamp">
                      {selectedSheet ? 'Saved' : 'Generated'} on {new Date(displaySheet.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {currentSheet && !selectedSheet && (
                    <button onClick={handleSave} className="save-btn">
                      💾 Save Cheat Sheet
                    </button>
                  )}
                </div>
                <div className="sheet-body markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {preprocessLatex(displaySheet.content)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheatSheets
