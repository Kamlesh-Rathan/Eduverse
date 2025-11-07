import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import './AskDoubt.css'

function AskDoubt() {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)

  // Generate a short title from the question
  const generateTitle = (question) => {
    // Take first 50 characters and add ellipsis if longer
    const cleaned = question.trim()
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned
  }

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

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const savedConversation = localStorage.getItem('eduverse_conversation')
    if (savedConversation) {
      try {
        setConversation(JSON.parse(savedConversation))
      } catch (error) {
        console.error('Error loading conversation:', error)
      }
    }
  }, [])

  // Save conversation to localStorage (keep last 5 Q&A pairs)
  const saveConversation = (newConversation) => {
    const last5 = newConversation.slice(-5)
    localStorage.setItem('eduverse_conversation', JSON.stringify(last5))
    setConversation(last5)
    // Auto-select the latest conversation
    setSelectedIndex(last5.length - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    const userQuestion = question.trim()
    setQuestion('')

    try {
      // Build context from previous conversations
      const messages = []
      
      // Add conversation history
      conversation.forEach(item => {
        messages.push({ role: 'user', content: item.question })
        messages.push({ role: 'assistant', content: item.answer })
      })

      // Add current question
      messages.push({ role: 'user', content: userQuestion })

      // System prompt with NCERT context
      const systemPrompt = `You are an AI tutor for Indian students preparing for Class 11-12 board exams and competitive exams like JEE/NEET. 
Your expertise covers NCERT syllabus for Maths, Physics, and Chemistry.

When answering questions:
1. Provide clear, student-friendly explanations
2. Reference specific NCERT chapters, topics, or page numbers when relevant
3. Use examples and step-by-step solutions where appropriate
4. Mention which subject and class the topic belongs to
5. Keep answers concise but comprehensive
6. Use proper mathematical notation and scientific terminology
7. When including formulas or equations, use standard LaTeX delimiters:
   - Inline math: $...$
   - Block math: $$...$$
   - Do NOT use [, (, or other non-standard delimiters

Format your response with:
- Main explanation
- NCERT Reference (if applicable): "Class [X], [Subject], Chapter [Y]: [Topic]"
- Additional tips or related concepts (if helpful)

Keep your response under 500 words and make it easy to understand for students.`

      // Call OpenRouter API
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'minimax/minimax-m2:free', // Free model
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EduVerse'
          }
        }
      )

      const aiResponse = response.data.choices[0].message.content

      // Add to conversation
      const newConversation = [
        ...conversation,
        {
          question: userQuestion,
          answer: aiResponse,
          timestamp: new Date().toISOString()
        }
      ]

      saveConversation(newConversation)
    } catch (error) {
      console.error('Error calling OpenRouter API:', error)
      
      let errorMessage = 'Failed to get response. Please try again.'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'API key is invalid or missing. Please check your .env.local file.'
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else {
          errorMessage = `Error: ${error.response.data?.error?.message || 'Unknown error'}`
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.'
      }
      
      const newConversation = [
        ...conversation,
        {
          question: userQuestion,
          answer: `❌ ${errorMessage}`,
          timestamp: new Date().toISOString()
        }
      ]
      saveConversation(newConversation)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear conversation history?')) {
      localStorage.removeItem('eduverse_conversation')
      setConversation([])
      setSelectedIndex(null)
    }
  }

  const selectedConversation = selectedIndex !== null ? conversation[selectedIndex] : null

  return (
    <div className="ask-doubt-container">
      <div className="doubt-header">
        <h1>❓ Ask Your Doubt</h1>
        <p className="doubt-subtitle">Get instant help with Maths, Physics & Chemistry (Class 11-12)</p>
      </div>

      <div className="doubt-layout">
        {/* Sidebar */}
        {conversation.length > 0 && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Previous Doubts</h3>
              <button onClick={clearHistory} className="clear-btn-sidebar" title="Clear History">
                🗑️
              </button>
            </div>
            <div className="sidebar-list">
              {conversation.map((item, index) => (
                <div
                  key={index}
                  className={`sidebar-item ${selectedIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="sidebar-item-number">{index + 1}</div>
                  <div className="sidebar-item-title">{generateTitle(item.question)}</div>
                </div>
              ))}
            </div>
            <div className="sidebar-footer">
              💾 {conversation.length}/5 doubts stored
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content-area">
          <form onSubmit={handleSubmit} className="question-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here... (e.g., 'Explain Newton's second law' or 'How to solve quadratic equations?')"
              className="question-input"
              rows="4"
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={loading || !question.trim()}>
              {loading ? '🤔 Thinking...' : '🚀 Get Answer'}
            </button>
          </form>

          <div className="answer-display-area">
            {conversation.length === 0 ? (
              <div className="empty-state">
                <p>💡 No questions yet. Ask your first doubt above!</p>
                <div className="example-questions">
                  <p><strong>Example questions:</strong></p>
                  <ul>
                    <li>"Explain the concept of limits in calculus"</li>
                    <li>"What is the difference between speed and velocity?"</li>
                    <li>"How do I balance chemical equations?"</li>
                    <li>"Solve: x² + 5x + 6 = 0"</li>
                    <li>"What is Ohm's law and its applications?"</li>
                  </ul>
                </div>
              </div>
            ) : selectedConversation ? (
              <div className="selected-conversation">
                <div className="question-block">
                  <div className="block-header">
                    <span className="block-icon">👤</span>
                    <span className="block-label">Your Question</span>
                  </div>
                  <div className="block-content">{selectedConversation.question}</div>
                </div>
                <div className="answer-block">
                  <div className="block-header">
                    <span className="block-icon">🤖</span>
                    <span className="block-label">AI Answer</span>
                  </div>
                  <div className="block-content markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {preprocessLatex(selectedConversation.answer)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>👈 Select a doubt from the sidebar to view its answer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AskDoubt
