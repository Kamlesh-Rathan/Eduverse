import { useState, useCallback, useEffect, memo } from 'react'
import axios from 'axios'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './Mindmap.css'

let nodeId = 0
const getId = () => `node_${nodeId++}`

// Dynamic size calculation function
const calculateNodeSize = (text, isDetailNode = false) => {
  const minWidth = 120
  const maxWidth = isDetailNode ? 400 : 300
  const charWidth = 8
  const padding = 40
  
  let width = Math.min(maxWidth, Math.max(minWidth, text.length * charWidth + padding))
  
  // Calculate height based on text wrapping
  const charsPerLine = Math.floor((width - padding) / charWidth)
  const numLines = Math.ceil(text.length / charsPerLine)
  const lineHeight = 20
  const verticalPadding = 24
  let height = Math.max(50, (numLines * lineHeight) + verticalPadding)
  
  return { width, height }
}

// Custom Editable Node Component
const EditableNode = memo(({ data, id }) => {
  console.log('🔵 EditableNode rendered:', { id, label: data.label, hasOnEdit: !!data.onEdit })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(data.label)
  const [isHovered, setIsHovered] = useState(false)

  const handleStartEdit = (e) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('✏️ Starting edit mode:', { id })
    setIsEditing(true)
    setEditedText(data.label)
  }

  const handleSave = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    console.log('💾 Saving node:', { id, oldText: data.label, newText: editedText })
    const trimmedText = editedText.trim()
    if (!trimmedText) {
      alert('Node text cannot be empty')
      setEditedText(data.label)
      setIsEditing(false)
      return
    }
    if (data.onEdit) {
      console.log('✅ Calling onEdit callback')
      data.onEdit(id, trimmedText)
    } else {
      console.log('❌ No onEdit callback found!')
    }
    setIsEditing(false)
  }

  const handleCancel = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setIsEditing(false)
    setEditedText(data.label)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const isDetailNode = data.isDetailNode || false

  return (
    <div 
      className={`editable-node ${isDetailNode ? 'detail-node' : ''} ${isEditing ? 'editing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        pointerEvents: 'all',
        cursor: 'default',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Pencil Icon Button - Only show when NOT editing */}
      {!isEditing && isHovered && (
        <button
          className="node-edit-button"
          onClick={handleStartEdit}
          onMouseDown={(e) => e.stopPropagation()}
          title="Edit node"
        >
          ✏️
        </button>
      )}

      {isEditing ? (
        <div className="node-edit-container">
          {isDetailNode ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="node-edit-textarea"
              maxLength={500}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '13px',
                background: 'transparent',
                textAlign: 'left',
                color: 'inherit',
                padding: '4px',
              }}
            />
          ) : (
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="node-edit-input"
              maxLength={200}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                background: 'transparent',
                textAlign: 'center',
                color: 'inherit',
                padding: '4px',
              }}
            />
          )}
          
          {/* Save and Cancel Buttons */}
          <div className="node-edit-actions">
            <button
              className="node-save-button"
              onClick={handleSave}
              onMouseDown={(e) => e.stopPropagation()}
              title="Save changes"
            >
              ✓
            </button>
            <button
              className="node-cancel-button"
              onClick={handleCancel}
              onMouseDown={(e) => e.stopPropagation()}
              title="Cancel editing"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="node-content">
          {data.label}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})

EditableNode.displayName = 'EditableNode'

const nodeTypes = {
  editableNode: EditableNode,
}

console.log('🎨 nodeTypes registered:', Object.keys(nodeTypes))

function Mindmap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeText, setNodeText] = useState('')
  const [savedMindmaps, setSavedMindmaps] = useState([])
  const [currentMindmapName, setCurrentMindmapName] = useState('')
  const [currentMindmapId, setCurrentMindmapId] = useState(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Load saved mindmaps from localStorage
  // Brave browser detection and warning
  useEffect(() => {
    const checkBrave = async () => {
      if (navigator.brave && await navigator.brave.isBrave()) {
        console.warn('⚠️ Brave browser detected. If nodes are not editable, try disabling Shields for this site or use Chrome/Firefox.')
      }
    }
    checkBrave()
  }, [])

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
    console.log('🎯 Node selected:', { 
      id: node.id, 
      label: node.data.label,
      level: node.data.level 
    })
    setSelectedNode(node)
  }, [])

  // Handle node text editing
  const handleNodeEdit = useCallback((nodeId, newText) => {
    console.log('📝 handleNodeEdit called:', { nodeId, newText })
    
    setNodes((nds) => {
      console.log('🔄 Current nodes:', nds.length)
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          console.log('✅ Found node to update:', node.id)
          const isDetailNode = node.data.isDetailNode || false
          const { width, height } = calculateNodeSize(newText, isDetailNode)
          console.log('📏 New size:', { width, height })
          
          return {
            ...node,
            data: {
              ...node.data,
              label: newText,
            },
            style: {
              ...node.style,
              width: `${width}px`,
              height: `${height}px`,
            },
          }
        }
        return node
      })
      console.log('✅ Nodes updated')
      return updatedNodes
    })
  }, [setNodes])

  // Add a new root node (Level 0)
  const addRootNode = () => {
    if (!nodeText.trim()) {
      alert('Please enter text for the node')
      return
    }

    const { width, height } = calculateNodeSize(nodeText.trim())

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'editableNode',
      data: { 
        label: nodeText.trim(),
        onEdit: handleNodeEdit,
        level: 0,
      },
      position: { x: 400, y: 50 },
      style: { 
        width: `${width}px`, 
        height: `${height}px`,
        background: '#e3f2fd',
        color: '#000',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    setNodes((nds) => [...nds, newNode])
    setNodeText('')
    setSelectedNode(null)
  }

  // Add Level 1 node (Main Branch)
  const addLevel1Node = () => {
    if (!selectedNode || selectedNode.data.level !== 0) {
      alert('Please select a root node (Level 0) first')
      return
    }

    if (!nodeText.trim()) {
      alert('Please enter text for the node')
      return
    }

    const { width, height } = calculateNodeSize(nodeText.trim())
    
    const level1Children = edges.filter(e => e.source === selectedNode.id).length

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'editableNode',
      data: { 
        label: nodeText.trim(),
        onEdit: handleNodeEdit,
        level: 1,
        parentId: selectedNode.id,
      },
      position: {
        x: selectedNode.position.x + (level1Children * 200) - 100,
        y: selectedNode.position.y + 150,
      },
      style: { 
        width: `${width}px`, 
        height: `${height}px`,
        background: '#c8e6c9',
        color: '#000',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    const newEdge = {
      id: `edge-${Date.now()}`,
      source: selectedNode.id,
      target: newNode.id,
      type: 'smoothstep',
      animated: true,
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
    setNodeText('')
  }

  // Add Level 2 node (Sub-Branch)
  const addLevel2Node = () => {
    if (!selectedNode || selectedNode.data.level !== 1) {
      alert('Please select a Level 1 node first')
      return
    }

    if (!nodeText.trim()) {
      alert('Please enter text for the node')
      return
    }

    const { width, height } = calculateNodeSize(nodeText.trim())
    
    const level2Children = edges.filter(e => e.source === selectedNode.id).length

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'editableNode',
      data: { 
        label: nodeText.trim(),
        onEdit: handleNodeEdit,
        level: 2,
        parentId: selectedNode.id,
      },
      position: {
        x: selectedNode.position.x + (level2Children * 180) - 90,
        y: selectedNode.position.y + 120,
      },
      style: { 
        width: `${width}px`, 
        height: `${height}px`,
        background: '#fff3e0',
        color: '#000',
        border: '2px solid #FF9800',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    const newEdge = {
      id: `edge-${Date.now()}`,
      source: selectedNode.id,
      target: newNode.id,
      type: 'smoothstep',
      animated: true,
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
    setNodeText('')
  }

  // Add Level 3 detail node
  const addLevel3DetailNode = () => {
    console.log('🟡 Add Level 3 Detail Node clicked', {
      selectedNode: selectedNode?.id,
      selectedLevel: selectedNode?.data?.level,
      nodeText: nodeText
    })
    
    if (!selectedNode || selectedNode.data.level !== 2) {
      alert('Please select a Level 2 node first')
      return
    }

    if (!nodeText.trim()) {
      alert('Please enter text for the detail node')
      return
    }

    const { width, height } = calculateNodeSize(nodeText.trim(), true)
    
    const level3Children = edges.filter(e => e.source === selectedNode.id).length

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'editableNode',
      data: { 
        label: nodeText.trim(),
        onEdit: handleNodeEdit,
        level: 3,
        isDetailNode: true,
        parentId: selectedNode.id,
      },
      position: {
        x: selectedNode.position.x + (level3Children * 200) - 100,
        y: selectedNode.position.y + 140,
      },
      style: { 
        width: `${width}px`, 
        height: `${height}px`,
        background: '#fff9c4',
        color: '#000',
        border: '2px solid #FFC107',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    const newEdge = {
      id: `edge-${Date.now()}`,
      source: selectedNode.id,
      target: newNode.id,
      type: 'smoothstep',
      animated: true,
      style: { strokeWidth: 2, stroke: '#FFC107' },
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

        // Calculate dynamic size
        const { width, height } = calculateNodeSize(nodeData.text, isDetailNode)

        // Color coding by level and node type
        const colors = {
          0: { bg: '#e3f2fd', border: '#2196F3' },
          1: { bg: '#c8e6c9', border: '#4CAF50' },
          2: { bg: '#fff3e0', border: '#FF9800' },
          3: { bg: '#fff9c4', border: '#FFC107' }
        }
        
        const color = colors[level] || colors[3]
        const background = color.bg
        const border = color.border
        const fontSize = isDetailNode ? '13px' : '14px'
        const padding = isDetailNode ? '12px' : '8px'
        
        newNodes.push({
          id: nodeId,
          type: 'editableNode',
          data: { 
            label: nodeData.text,
            level: level,
            isDetailNode: isDetailNode,
            onEdit: handleNodeEdit,
          },
          position: { x, y },
          style: {
            background,
            color: '#000',
            border: `2px solid ${border}`,
            borderRadius: '8px',
            padding,
            fontSize,
            fontWeight: '500',
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
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
      setCurrentMindmapId(null) // Reset ID for new AI-generated mindmap
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
      setCurrentMindmapId(null)
    }
  }

  // Save current mindmap
  const saveMindmap = () => {
    if (nodes.length === 0) {
      alert('Cannot save an empty mindmap')
      return
    }
    
    // If editing existing mindmap, update it directly without dialog
    if (currentMindmapId) {
      updateExistingMindmap()
    } else {
      // New mindmap, show save dialog
      setShowSaveDialog(true)
    }
  }

  const updateExistingMindmap = () => {
    const index = savedMindmaps.findIndex(m => m.id === currentMindmapId)
    if (index !== -1) {
      const updatedMindmaps = [...savedMindmaps]
      updatedMindmaps[index] = {
        ...updatedMindmaps[index],
        name: currentMindmapName,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem('eduverse_mindmaps', JSON.stringify(updatedMindmaps))
      setSavedMindmaps(updatedMindmaps)
      alert('✅ Mindmap updated successfully!')
    }
  }

  const confirmSave = () => {
    if (!currentMindmapName.trim()) {
      alert('Please enter a name for the mindmap')
      return
    }

    const mindmap = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: currentMindmapName.trim(),
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [mindmap, ...savedMindmaps]
    localStorage.setItem('eduverse_mindmaps', JSON.stringify(updated))
    setSavedMindmaps(updated)
    setCurrentMindmapId(mindmap.id)
    setShowSaveDialog(false)
    alert('✅ New mindmap saved successfully!')
  }

  // Save as new copy
  const saveAsNewCopy = () => {
    if (nodes.length === 0) {
      alert('Cannot save an empty mindmap')
      return
    }
    setSaveAsName(currentMindmapName + ' (Copy)')
    setShowSaveAsDialog(true)
  }

  const confirmSaveAs = () => {
    if (!saveAsName.trim()) {
      alert('Please enter a name for the new mindmap')
      return
    }

    const mindmap = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: saveAsName.trim(),
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [mindmap, ...savedMindmaps]
    localStorage.setItem('eduverse_mindmaps', JSON.stringify(updated))
    setSavedMindmaps(updated)
    setCurrentMindmapId(mindmap.id)
    setCurrentMindmapName(saveAsName.trim())
    setShowSaveAsDialog(false)
    alert('✅ New copy saved successfully!')
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
    setCurrentMindmapId(mindmap.id)
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
                      {mindmap.updatedAt && (
                        <div className="mindmap-item-date">
                          Updated: {new Date(mindmap.updatedAt).toLocaleDateString()}
                        </div>
                      )}
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

          {/* Edit Mode Indicator */}
          {currentMindmapId && (
            <div className="edit-mode-indicator">
              <span className="edit-icon">✏️</span>
              <span className="edit-text">Editing: <strong>{currentMindmapName}</strong></span>
            </div>
          )}

          {/* Unified Controls Panel */}
          <div className="mindmap-controls">
            {/* Text Input */}
            <div className="control-group">
              <input
                type="text"
                value={nodeText}
                onChange={(e) => setNodeText(e.target.value)}
                placeholder="Enter node text..."
                className="node-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && nodeText.trim()) {
                    if (selectedNode) {
                      if (selectedNode.data.level === 0) {
                        addLevel1Node()
                      } else if (selectedNode.data.level === 1) {
                        addLevel2Node()
                      } else if (selectedNode.data.level === 2) {
                        addLevel3DetailNode()
                      }
                    } else {
                      addRootNode()
                    }
                  }
                }}
              />
            </div>

            {/* Selection Info */}
            {selectedNode && (
              <div className="selection-info">
                <strong>Selected:</strong> {selectedNode.data.label} 
                <span className="selection-level">(Level {selectedNode.data.level ?? 'Unknown'})</span>
              </div>
            )}

            {/* Node Creation Buttons */}
            <div className="control-group button-grid">
              <button
                onClick={addRootNode}
                disabled={!nodeText.trim()}
                className="btn-add-root"
              >
                ➕ Add Root Node
              </button>

              <button
                onClick={addLevel1Node}
                disabled={!nodeText.trim() || !selectedNode || selectedNode.data.level !== 0}
                className="btn-add-level1"
              >
                ➕ Add Main Branch
              </button>

              <button
                onClick={addLevel2Node}
                disabled={!nodeText.trim() || !selectedNode || selectedNode.data.level !== 1}
                className="btn-add-level2"
              >
                ➕ Add Sub-Branch
              </button>

              <button
                onClick={addLevel3DetailNode}
                disabled={!nodeText.trim() || !selectedNode || selectedNode.data.level !== 2}
                className="btn-add-level3"
              >
                ➕ Add Detail Node
              </button>

              <button 
                onClick={deleteNode} 
                className="btn-delete-node"
                disabled={!selectedNode}
              >
                🗑️ Delete Node
              </button>
            </div>

            {/* Save/Clear Buttons */}
            <div className="control-group button-grid">
              <button onClick={saveMindmap} className="btn-save">
                {currentMindmapId ? '💾 Update Mindmap' : '💾 Save New Mindmap'}
              </button>
              {currentMindmapId && (
                <button onClick={saveAsNewCopy} className="btn-save-as">
                  📋 Save As Copy
                </button>
              )}
              <button onClick={clearMindmap} className="btn-clear">
                🧹 Clear All
              </button>
            </div>
          </div>

          {selectedNode && (
            <div className="selected-node-info" style={{ display: 'none' }}>
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
                nodeTypes={nodeTypes}
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
            <h3>Save New Mindmap</h3>
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

      {/* Save As Dialog */}
      {showSaveAsDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveAsDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save As New Copy</h3>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              placeholder="Enter name for new copy..."
              className="modal-input"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && confirmSaveAs()}
            />
            <div className="modal-buttons">
              <button onClick={confirmSaveAs} className="btn-confirm">
                Save Copy
              </button>
              <button onClick={() => setShowSaveAsDialog(false)} className="btn-cancel">
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
