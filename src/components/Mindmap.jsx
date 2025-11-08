import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Mindmap.css'

let nodeId = 0
const getId = () => `node_${nodeId++}`

function Mindmap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeText, setNodeText] = useState('')
  const [savedMindmaps, setSavedMindmaps] = useState([])
  const [currentMindmapName, setCurrentMindmapName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Load saved mindmaps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('eduverse_mindmaps')
    if (saved) {
      try {
        setSavedMindmaps(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading mindmaps:', error)
      }
    }
  }, [])

  // Handle edge connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }, eds)),
    [setEdges]
  )

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  // Add a new root node
  const addNode = () => {
    if (!nodeText.trim()) {
      alert('Please enter text for the node')
      return
    }

    const newNode = {
      id: getId(),
      type: 'default',
      data: { label: nodeText.trim() },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      style: {
        background: '#2563eb',
        color: 'white',
        border: '2px solid #1e40af',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '600',
      },
    }

    setNodes((nds) => [...nds, newNode])
    setNodeText('')
  }

  // Add a child node connected to selected node
  const addChildNode = () => {
    if (!selectedNode) {
      alert('Please select a parent node first')
      return
    }

    if (!nodeText.trim()) {
      alert('Please enter text for the child node')
      return
    }

    const childId = getId()
    const newNode = {
      id: childId,
      type: 'default',
      data: { label: nodeText.trim() },
      position: {
        x: selectedNode.position.x + 200,
        y: selectedNode.position.y + 100,
      },
      style: {
        background: '#10b981',
        color: 'white',
        border: '2px solid #059669',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '600',
      },
    }

    const newEdge = {
      id: `e${selectedNode.id}-${childId}`,
      source: selectedNode.id,
      target: childId,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
    setNodeText('')
  }

  // Delete selected node and its connected edges
  const deleteNode = () => {
    if (!selectedNode) {
      alert('Please select a node to delete')
      return
    }

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ))
    setSelectedNode(null)
  }

  // Generate mindmap using AI
  const generateAIMindmap = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a topic for the mindmap')
      return
    }

    if (nodes.length > 0) {
      if (!confirm('Generating will replace the current mindmap. Continue?')) {
        return
      }
    }

    setAiLoading(true)

    try {
      const systemPrompt = `You are an expert tutor for Indian Class 11-12 students preparing for CBSE board exams and competitive exams like JEE/NEET. You specialize in Maths, Physics, and Chemistry.

Create a comprehensive mindmap for the given topic following these STRICT RULES:

NODE STRUCTURE:
- Level 0: Main topic (center node)
- Level 1: Major subtopics (3-5 primary branches)
- Level 2: Sub-concepts or categories (2-4 under each Level 1 node)
- Level 3: DETAILED CONTENT NODES - these are the final child nodes

CRITICAL RULE FOR FINAL CHILD NODES (Level 3):
❌ WRONG: Just labels like 'Definition', 'Formula', 'Products', 'Example'
✅ CORRECT: Actual detailed content in the node text itself

Examples of correct Level 3 nodes:
- Instead of 'Definition' → 'Force is push or pull that changes state of motion. Measured in Newtons (N).'
- Instead of 'Formula' → 'F = ma where F is force, m is mass (kg), a is acceleration (m/s²)'
- Instead of 'Example' → 'Pushing a shopping cart - force applied changes its velocity'
- Instead of 'Products' → 'Glucose (C₆H₁₂O₆) and Oxygen (O₂) are produced'

CONTENT GUIDELINES:
1. Level 3 nodes should contain 15-40 words of actual explanation
2. Include formulas using standard notation (use $ for LaTeX if needed: $F = ma$)
3. Reference NCERT chapters when relevant: 'NCERT Class 11 Physics Ch 5'
4. Keep explanations student-friendly and exam-focused
5. Use clear, concise language suitable for Class 11-12 level

JSON FORMAT (strictly follow):
{
  "title": "Topic Name",
  "nodes": [
    {"id": "1", "text": "Main Topic", "parentId": null, "level": 0},
    {"id": "2", "text": "Primary Subtopic", "parentId": "1", "level": 1},
    {"id": "3", "text": "Category or Concept", "parentId": "2", "level": 2},
    {"id": "4", "text": "Detailed explanation here with formulas, definitions, or examples in 15-40 words. This is the actual content, not just a label.", "parentId": "3", "level": 3, "isDetailNode": true}
  ]
}

EXAMPLE STRUCTURE for 'Newton's Second Law':
Level 0: Newton's Second Law
Level 1: Statement, Mathematical Form, Applications, Key Points
Level 2 (under Statement): Verbal Definition, Physical Meaning
Level 3 (under Verbal Definition): 'The acceleration of an object is directly proportional to net force and inversely proportional to mass. Greater force means greater acceleration. NCERT Class 11 Physics Ch 5.'
Level 3 (under Physical Meaning): 'Heavy objects need more force to accelerate. A truck needs more force than a bicycle to reach same speed.'
Level 2 (under Mathematical Form): Formula, Units
Level 3 (under Formula): '$F = ma$ where F is net force (N), m is mass (kg), a is acceleration (m/s²). SI unit is Newton (N) = kg⋅m/s²'

Create 12-20 nodes total. Every branch must end with a detailed content node (Level 3) containing actual information, not labels. Return ONLY valid JSON with no markdown formatting or extra text.`

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-8b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a detailed mindmap for the topic: ${aiTopic.trim()}. Include definitions, formulas, key concepts, applications, and NCERT references where applicable. Make sure final child nodes contain actual explanations, not just category labels.` }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_MINDMAP_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'EduVerse - Mindmap Generator'
          }
        }
      )

      const content = response.data.choices[0].message.content
      
      // Extract JSON from response (handle markdown code blocks and extra text)
      let jsonStr = content.trim()
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const mindmapData = JSON.parse(jsonStr)

      if (!mindmapData.nodes || !Array.isArray(mindmapData.nodes)) {
        throw new Error('Invalid mindmap structure')
      }

      // Create nodes and edges from AI response with hierarchical positioning
      const newNodes = []
      const newEdges = []
      const nodeMap = {}
      const levelGroups = {}

      // Group nodes by level
      mindmapData.nodes.forEach((nodeData) => {
        const level = nodeData.level || 0
        if (!levelGroups[level]) {
          levelGroups[level] = []
        }
        levelGroups[level].push(nodeData)
      })

      // Calculate positions hierarchically
      mindmapData.nodes.forEach((nodeData) => {
        const nodeId = getId()
        nodeMap[nodeData.id] = nodeId

        const level = nodeData.level || 0
        const isRoot = level === 0
        const levelIndex = levelGroups[level].indexOf(nodeData)
        const levelCount = levelGroups[level].length

        let x, y

        if (isRoot) {
          // Center the root node
          x = 500
          y = 50
        } else if (level === 1) {
          // Arrange level 1 nodes in a horizontal line below root
          const spacing = 250
          const totalWidth = (levelCount - 1) * spacing
          x = 500 - totalWidth / 2 + levelIndex * spacing
          y = 200
        } else {
          // Level 2+ nodes: position relative to parent
          const parentData = mindmapData.nodes.find(n => n.id === nodeData.parentId)
          if (parentData) {
            const parentLevel = parentData.level || 0
            const siblings = mindmapData.nodes.filter(n => n.parentId === nodeData.parentId)
            const siblingIndex = siblings.indexOf(nodeData)
            const siblingCount = siblings.length
            
            // Calculate parent position (approximate)
            const parentLevelIndex = levelGroups[parentLevel].indexOf(parentData)
            const parentLevelCount = levelGroups[parentLevel].length
            
            if (parentLevel === 0) {
              x = 500
            } else if (parentLevel === 1) {
              const spacing = 250
              const totalWidth = (parentLevelCount - 1) * spacing
              x = 500 - totalWidth / 2 + parentLevelIndex * spacing
            } else {
              x = 300 + parentLevelIndex * 200
            }
            
            // Spread children horizontally under parent
            const childSpacing = 180
            const totalChildWidth = (siblingCount - 1) * childSpacing
            x = x - totalChildWidth / 2 + siblingIndex * childSpacing
            y = 200 + level * 150
          } else {
            // Fallback positioning
            x = 200 + levelIndex * 200
            y = 200 + level * 150
          }
        }

        // Check if this is a detail node (Level 3 with actual content)
        const isDetailNode = nodeData.isDetailNode === true || (level === 3 && nodeData.text.length > 30)

        // Color coding by level and node type
        let background, border, width, fontSize, padding
        if (level === 0) {
          background = '#2563eb'
          border = '#1e40af'
          width = 180
          fontSize = '14px'
          padding = '10px'
        } else if (level === 1) {
          background = '#10b981'
          border = '#059669'
          width = 160
          fontSize = '14px'
          padding = '10px'
        } else if (level === 2) {
          background = '#f59e0b'
          border = '#d97706'
          width = 150
          fontSize = '14px'
          padding = '10px'
        } else if (isDetailNode) {
          // Detail nodes - larger with different styling
          background = '#fef3c7' // Light yellow
          border = '#f59e0b'
          width = 280
          fontSize = '12px'
          padding = '12px'
        } else {
          background = '#f59e0b'
          border = '#d97706'
          width = 150
          fontSize = '14px'
          padding = '10px'
        }
        
        newNodes.push({
          id: nodeId,
          type: 'default',
          data: { 
            label: nodeData.text,
            isDetailNode: isDetailNode
          },
          position: { x, y },
          style: {
            background,
            color: isDetailNode ? '#78350f' : 'white', // Dark text for detail nodes
            border: `2px solid ${border}`,
            borderRadius: '8px',
            padding,
            fontSize,
            fontWeight: isDetailNode ? '500' : '600',
            width: `${width}px`,
            minHeight: isDetailNode ? '80px' : 'auto',
            whiteSpace: isDetailNode ? 'normal' : 'nowrap',
            wordWrap: isDetailNode ? 'break-word' : 'normal',
            textAlign: isDetailNode ? 'left' : 'center',
            lineHeight: isDetailNode ? '1.4' : '1.2',
          },
        })
      })

      // Second pass: create edges
      mindmapData.nodes.forEach((nodeData) => {
        if (nodeData.parentId && nodeMap[nodeData.parentId]) {
          newEdges.push({
            id: `e${nodeMap[nodeData.parentId]}-${nodeMap[nodeData.id]}`,
            source: nodeMap[nodeData.parentId],
            target: nodeMap[nodeData.id],
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          })
        }
      })

      setNodes(newNodes)
      setEdges(newEdges)
      setCurrentMindmapName(mindmapData.title || aiTopic.trim())
      setAiTopic('')
      setSelectedNode(null)

    } catch (error) {
      console.error('Error generating mindmap:', error)
      
      let errorMessage = 'Failed to generate mindmap. Please try again.'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'API key is invalid or missing. Please check your .env.local file and add VITE_MINDMAP_API_KEY.'
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else {
          errorMessage = `Error: ${error.response.data?.error?.message || 'Unknown error'}`
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error instanceof SyntaxError) {
        errorMessage = 'Failed to parse AI response. Please try again.'
      }

      alert(`❌ ${errorMessage}`)
    } finally {
      setAiLoading(false)
    }
  }

  // Clear all nodes and edges
  const clearMindmap = () => {
    if (confirm('Are you sure you want to clear the entire mindmap?')) {
      setNodes([])
      setEdges([])
      setSelectedNode(null)
      setCurrentMindmapName('')
    }
  }

  // Save current mindmap
  const saveMindmap = () => {
    if (nodes.length === 0) {
      alert('Cannot save an empty mindmap')
      return
    }
    setShowSaveDialog(true)
  }

  const confirmSave = () => {
    if (!currentMindmapName.trim()) {
      alert('Please enter a name for the mindmap')
      return
    }

    const mindmap = {
      id: Date.now(),
      name: currentMindmapName.trim(),
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    }

    const updated = [mindmap, ...savedMindmaps]
    localStorage.setItem('eduverse_mindmaps', JSON.stringify(updated))
    setSavedMindmaps(updated)
    setShowSaveDialog(false)
    alert('✅ Mindmap saved successfully!')
  }

  // Load a saved mindmap
  const loadMindmap = (mindmap) => {
    if (nodes.length > 0) {
      if (!confirm('Loading will replace the current mindmap. Continue?')) {
        return
      }
    }

    setNodes(mindmap.nodes)
    setEdges(mindmap.edges)
    setCurrentMindmapName(mindmap.name)
    setSelectedNode(null)
  }

  // Delete a saved mindmap
  const deleteSavedMindmap = (id) => {
    if (confirm('Are you sure you want to delete this mindmap?')) {
      const updated = savedMindmaps.filter((m) => m.id !== id)
      localStorage.setItem('eduverse_mindmaps', JSON.stringify(updated))
      setSavedMindmaps(updated)
    }
  }

  return (
    <div className="mindmap-container">
      <div className="mindmap-header">
        <h1>🧠 Mindmap Maker</h1>
        <p className="mindmap-subtitle">Create visual mind maps for better understanding</p>
      </div>

      <div className="mindmap-layout">
        {/* Sidebar */}
        {savedMindmaps.length > 0 && (
          <div className="mindmap-sidebar">
            <div className="mindmap-sidebar-header">
              <h3>Saved Mindmaps</h3>
              <span className="mindmap-count">{savedMindmaps.length}</span>
            </div>
            <div className="mindmap-sidebar-list">
              {savedMindmaps.map((mindmap) => (
                <div key={mindmap.id} className="mindmap-item">
                  <div className="mindmap-item-content" onClick={() => loadMindmap(mindmap)}>
                    <div className="mindmap-item-icon">🗺️</div>
                    <div className="mindmap-item-info">
                      <div className="mindmap-item-name">{mindmap.name}</div>
                      <div className="mindmap-item-meta">
                        {mindmap.nodes.length} nodes
                      </div>
                    </div>
                  </div>
                  <button
                    className="mindmap-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSavedMindmap(mindmap.id)
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
        <div className="mindmap-main-content">
          {/* AI Generation */}
          <div className="ai-generation-panel">
            <div className="ai-generation-content">
              <div className="ai-icon">✨</div>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Enter topic (e.g., Newton's Laws, Photosynthesis, Thermodynamics)..."
                className="ai-input"
                disabled={aiLoading}
                onKeyPress={(e) => e.key === 'Enter' && generateAIMindmap()}
              />
              <button 
                onClick={generateAIMindmap} 
                className="btn-generate-ai"
                disabled={aiLoading || !aiTopic.trim()}
              >
                {aiLoading ? '⏳ Generating mindmap...' : '🤖 Generate Mindmap with AI'}
              </button>
              {nodes.length > 0 && (
                <button 
                  onClick={generateAIMindmap} 
                  className="btn-regenerate"
                  disabled={aiLoading || !aiTopic.trim()}
                  title="Regenerate mindmap for current topic"
                >
                  🔄 Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="mindmap-controls">
            <div className="control-group">
              <input
                type="text"
                value={nodeText}
                onChange={(e) => setNodeText(e.target.value)}
                placeholder="Enter node text..."
                className="node-input"
                onKeyPress={(e) => e.key === 'Enter' && addNode()}
              />
              <button onClick={addNode} className="btn-add-node">
                ➕ Add Node
              </button>
              <button 
                onClick={addChildNode} 
                className="btn-add-child"
                disabled={!selectedNode}
              >
                🔗 Add Child
              </button>
              <button 
                onClick={deleteNode} 
                className="btn-delete"
                disabled={!selectedNode}
              >
                🗑️ Delete
              </button>
            </div>
            <div className="control-group">
              <button onClick={saveMindmap} className="btn-save">
                💾 Save
              </button>
              <button onClick={clearMindmap} className="btn-clear">
                🧹 Clear All
              </button>
            </div>
          </div>

          {selectedNode && (
            <div className="selected-node-info">
              <strong>Selected:</strong> {selectedNode.data.label}
            </div>
          )}

          {/* React Flow Canvas */}
          <div className="mindmap-canvas">
            {nodes.length === 0 ? (
              <div className="empty-canvas">
                <h3>👆 Start by adding your first node</h3>
                <p>Enter text above and click "Add Node" to begin</p>
                <div className="tips">
                  <p><strong>Tips:</strong></p>
                  <ul>
                    <li>Click a node to select it</li>
                    <li>Drag nodes to reposition them</li>
                    <li>Add child nodes to create connections</li>
                    <li>Connect nodes by dragging from one to another</li>
                  </ul>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
              >
                <Controls />
                <MiniMap 
                  nodeColor={(node) => node.style?.background || '#2563eb'}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save Mindmap</h3>
            <input
              type="text"
              value={currentMindmapName}
              onChange={(e) => setCurrentMindmapName(e.target.value)}
              placeholder="Enter mindmap name..."
              className="modal-input"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && confirmSave()}
            />
            <div className="modal-buttons">
              <button onClick={confirmSave} className="btn-confirm">
                Save
              </button>
              <button onClick={() => setShowSaveDialog(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Mindmap
