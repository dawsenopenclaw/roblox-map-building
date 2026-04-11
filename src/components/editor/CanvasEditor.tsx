'use client'

import React, { useReducer, useCallback, useRef, useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type LayerType = 'image' | 'text' | 'shape'
type ShapeKind = 'rectangle' | 'circle'

interface BaseLayer {
  id: string
  name: string
  type: LayerType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  visible: boolean
  locked: boolean
}

interface ImageLayer extends BaseLayer {
  type: 'image'
  src: string
}

interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  color: string
}

interface ShapeLayer extends BaseLayer {
  type: 'shape'
  shape: ShapeKind
  fill: string
  stroke: string
  strokeWidth: number
}

type Layer = ImageLayer | TextLayer | ShapeLayer

interface EditorState {
  layers: Layer[]
  selectedIds: string[]
  zoom: number
  panX: number
  panY: number
  showGrid: boolean
}

type Action =
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'DELETE_LAYERS'; ids: string[] }
  | { type: 'UPDATE_LAYER'; id: string; changes: Partial<Layer> }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; x: number; y: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_STATE'; state: EditorState }

// ── Undo/Redo with history ─────────────────────────────────────────────────

interface HistoryState {
  past: EditorState[]
  present: EditorState
  future: EditorState[]
}

const CANVAS_W = 1024
const CANVAS_H = 768

const initialEditor: EditorState = {
  layers: [],
  selectedIds: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: false,
}

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'ADD_LAYER':
      return { ...state, layers: [...state.layers, action.layer], selectedIds: [action.layer.id] }
    case 'DELETE_LAYERS':
      return {
        ...state,
        layers: state.layers.filter((l) => !action.ids.includes(l.id)),
        selectedIds: state.selectedIds.filter((id) => !action.ids.includes(id)),
      }
    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) => (l.id === action.id ? { ...l, ...action.changes } as Layer : l)),
      }
    case 'REORDER_LAYERS': {
      const arr = [...state.layers]
      const [moved] = arr.splice(action.fromIndex, 1)
      arr.splice(action.toIndex, 0, moved)
      return { ...state, layers: arr }
    }
    case 'SELECT':
      return { ...state, selectedIds: action.ids }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) }
    case 'SET_PAN':
      return { ...state, panX: action.x, panY: action.y }
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }
    case 'SET_STATE':
      return action.state
    default:
      return state
  }
}

type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' }

const UNDOABLE: Action['type'][] = ['ADD_LAYER', 'DELETE_LAYERS', 'UPDATE_LAYER', 'REORDER_LAYERS']

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state
    const prev = state.past[state.past.length - 1]
    return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future] }
  }
  if (action.type === 'REDO') {
    if (state.future.length === 0) return state
    const next = state.future[0]
    return { past: [...state.past, state.present], present: next, future: state.future.slice(1) }
  }
  const newPresent = editorReducer(state.present, action)
  if (newPresent === state.present) return state
  if (UNDOABLE.includes(action.type)) {
    return { past: [...state.past.slice(-49), state.present], present: newPresent, future: [] }
  }
  return { ...state, present: newPresent }
}

// ── Helpers ────────────────────────────────────────────────────────────────

let _idCounter = 0
const uid = () => `layer_${Date.now()}_${++_idCounter}`

const GOLD = '#D4AF37'
const BG = '#0a0a0f'
const PANEL_BG = '#111118'
const SURFACE = '#1a1a24'
const BORDER = '#2a2a3a'
const TEXT_DIM = '#888'
const TEXT = '#e0e0e0'

const btnStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  color: TEXT,
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

// ── Component ──────────────────────────────────────────────────────────────

export function CanvasEditor() {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialEditor,
    future: [],
  })
  const state = history.present
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const [dragLayerId, setDragLayerId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [resizing, setResizing] = useState<{ id: string; corner: string } | null>(null)
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, lx: 0, ly: 0 })
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [dragReorderIdx, setDragReorderIdx] = useState<number | null>(null)

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingTextId) return
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }) }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }) }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedIds.length) dispatch({ type: 'DELETE_LAYERS', ids: state.selectedIds })
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        dispatch({ type: 'SELECT', ids: state.layers.map((l) => l.id) })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.selectedIds, state.layers, editingTextId])

  // ── Zoom (scroll wheel) ─────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom * factor })
  }, [state.zoom])

  // ── Pan (middle mouse) ──────────────────────────────────────────────
  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, px: state.panX, py: state.panY }
    }
  }, [state.panX, state.panY])

  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      dispatch({
        type: 'SET_PAN',
        x: panStart.current.px + (e.clientX - panStart.current.x),
        y: panStart.current.py + (e.clientY - panStart.current.y),
      })
    }
    if (dragLayerId) {
      const layer = state.layers.find((l) => l.id === dragLayerId)
      if (layer && !layer.locked) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left - state.panX) / state.zoom - dragOffset.current.x
        const y = (e.clientY - rect.top - state.panY) / state.zoom - dragOffset.current.y
        dispatch({ type: 'UPDATE_LAYER', id: dragLayerId, changes: { x, y } })
      }
    }
    if (resizing) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = (e.clientX - resizeStart.current.x) / state.zoom
      const dy = (e.clientY - resizeStart.current.y) / state.zoom
      let { w, h, lx, ly } = resizeStart.current
      const c = resizing.corner
      let nw = w, nh = h, nx = lx, ny = ly
      if (c.includes('e')) nw = Math.max(20, w + dx)
      if (c.includes('w')) { nw = Math.max(20, w - dx); nx = lx + (w - nw) }
      if (c.includes('s')) nh = Math.max(20, h + dy)
      if (c.includes('n')) { nh = Math.max(20, h - dy); ny = ly + (h - nh) }
      dispatch({ type: 'UPDATE_LAYER', id: resizing.id, changes: { width: nw, height: nh, x: nx, y: ny } })
    }
  }, [isPanning, dragLayerId, resizing, state.layers, state.zoom, state.panX, state.panY])

  const onCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragLayerId(null)
    setResizing(null)
  }, [])

  // ── Fit to screen ───────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    const container = canvasRef.current
    if (!container) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const scale = Math.min(cw / CANVAS_W, ch / CANVAS_H) * 0.9
    dispatch({ type: 'SET_ZOOM', zoom: scale })
    dispatch({ type: 'SET_PAN', x: (cw - CANVAS_W * scale) / 2, y: (ch - CANVAS_H * scale) / 2 })
  }, [])

  // ── Add layers ──────────────────────────────────────────────────────
  const addImageLayer = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        dispatch({
          type: 'ADD_LAYER',
          layer: { id: uid(), type: 'image', name: file.name, x: 100, y: 100, width: 200, height: 200, rotation: 0, visible: true, locked: false, src: reader.result as string },
        })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  const addTextLayer = useCallback(() => {
    dispatch({
      type: 'ADD_LAYER',
      layer: { id: uid(), type: 'text', name: 'Text', x: 100, y: 100, width: 200, height: 40, rotation: 0, visible: true, locked: false, text: 'Double-click to edit', fontSize: 24, fontFamily: 'Inter, sans-serif', color: '#ffffff' },
    })
  }, [])

  const addShapeLayer = useCallback((shape: ShapeKind) => {
    dispatch({
      type: 'ADD_LAYER',
      layer: { id: uid(), type: 'shape', name: shape, x: 100, y: 100, width: 150, height: 150, rotation: 0, visible: true, locked: false, shape, fill: GOLD, stroke: '#ffffff', strokeWidth: 0 },
    })
  }, [])

  // ── Export PNG ──────────────────────────────────────────────────────
  const exportPNG = useCallback(async (transparent: boolean) => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')!
    if (!transparent) {
      ctx.fillStyle = '#1a1a24'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    }
    for (const layer of state.layers) {
      if (!layer.visible) continue
      ctx.save()
      ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-layer.width / 2, -layer.height / 2)
      if (layer.type === 'image') {
        const img = new Image()
        img.src = layer.src
        await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r() })
        ctx.drawImage(img, 0, 0, layer.width, layer.height)
      } else if (layer.type === 'text') {
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
        ctx.fillStyle = layer.color
        ctx.textBaseline = 'top'
        ctx.fillText(layer.text, 0, 0)
      } else if (layer.type === 'shape') {
        ctx.fillStyle = layer.fill
        if (layer.strokeWidth > 0) { ctx.strokeStyle = layer.stroke; ctx.lineWidth = layer.strokeWidth }
        if (layer.shape === 'rectangle') {
          ctx.fillRect(0, 0, layer.width, layer.height)
          if (layer.strokeWidth > 0) ctx.strokeRect(0, 0, layer.width, layer.height)
        } else {
          ctx.beginPath()
          ctx.ellipse(layer.width / 2, layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          if (layer.strokeWidth > 0) ctx.stroke()
        }
      }
      ctx.restore()
    }
    const link = document.createElement('a')
    link.download = 'canvas-export.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [state.layers])

  // ── Layer click on canvas ───────────────────────────────────────────
  const onLayerMouseDown = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation()
    if (layer.locked) return
    const ids = e.shiftKey
      ? state.selectedIds.includes(layer.id)
        ? state.selectedIds.filter((id) => id !== layer.id)
        : [...state.selectedIds, layer.id]
      : [layer.id]
    dispatch({ type: 'SELECT', ids })
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    dragOffset.current = {
      x: (e.clientX - rect.left - state.panX) / state.zoom - layer.x,
      y: (e.clientY - rect.top - state.panY) / state.zoom - layer.y,
    }
    setDragLayerId(layer.id)
  }, [state.selectedIds, state.zoom, state.panX, state.panY])

  const onHandleMouseDown = useCallback((e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation()
    const layer = state.layers.find((l) => l.id === id)
    if (!layer) return
    setResizing({ id, corner })
    resizeStart.current = { x: e.clientX, y: e.clientY, w: layer.width, h: layer.height, lx: layer.x, ly: layer.y }
  }, [state.layers])

  // ── Canvas click deselect ──────────────────────────────────────────
  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
      dispatch({ type: 'SELECT', ids: [] })
    }
  }, [])

  // ── Render helpers ──────────────────────────────────────────────────
  const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
  const handlePos = (c: string, w: number, h: number): [number, number] => {
    const mx = w / 2
    const map: Record<string, [number, number]> = {
      nw: [0, 0], ne: [w, 0], sw: [0, h], se: [w, h],
      n: [mx, 0], s: [mx, h], e: [w, h / 2], w: [0, h / 2],
    }
    return map[c] || [0, 0]
  }
  const handleCursor = (c: string) => {
    const map: Record<string, string> = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' }
    return map[c] || 'default'
  }

  const renderLayer = (layer: Layer) => {
    if (!layer.visible) return null
    const selected = state.selectedIds.includes(layer.id)
    const style: React.CSSProperties = {
      position: 'absolute',
      left: layer.x,
      top: layer.y,
      width: layer.width,
      height: layer.height,
      transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
      cursor: layer.locked ? 'not-allowed' : 'move',
      outline: selected ? `2px solid ${GOLD}` : 'none',
      outlineOffset: 2,
      userSelect: 'none',
    }
    let content: React.ReactNode = null
    if (layer.type === 'image') {
      content = <img src={(layer as ImageLayer).src} alt={layer.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
    } else if (layer.type === 'text') {
      const tl = layer as TextLayer
      const isEditing = editingTextId === layer.id
      content = isEditing ? (
        <textarea
          autoFocus
          value={tl.text}
          onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: layer.id, changes: { text: e.target.value } })}
          onBlur={() => setEditingTextId(null)}
          style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: tl.color, fontSize: tl.fontSize, fontFamily: tl.fontFamily, resize: 'none', outline: 'none', padding: 0 }}
        />
      ) : (
        <div style={{ color: tl.color, fontSize: tl.fontSize, fontFamily: tl.fontFamily, overflow: 'hidden', width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {tl.text}
        </div>
      )
    } else if (layer.type === 'shape') {
      const sl = layer as ShapeLayer
      if (sl.shape === 'circle') {
        content = (
          <svg width="100%" height="100%" viewBox={`0 0 ${sl.width} ${sl.height}`}>
            <ellipse cx={sl.width / 2} cy={sl.height / 2} rx={sl.width / 2 - (sl.strokeWidth || 0)} ry={sl.height / 2 - (sl.strokeWidth || 0)} fill={sl.fill} stroke={sl.stroke} strokeWidth={sl.strokeWidth} />
          </svg>
        )
      } else {
        content = <div style={{ width: '100%', height: '100%', background: sl.fill, border: sl.strokeWidth ? `${sl.strokeWidth}px solid ${sl.stroke}` : 'none', boxSizing: 'border-box' }} />
      }
    }
    return (
      <div
        key={layer.id}
        style={style}
        onMouseDown={(e) => onLayerMouseDown(e, layer)}
        onDoubleClick={() => { if (layer.type === 'text') setEditingTextId(layer.id) }}
      >
        {content}
        {selected && !layer.locked && handles.map((c) => {
          const [hx, hy] = handlePos(c, layer.width, layer.height)
          return (
            <div
              key={c}
              onMouseDown={(e) => onHandleMouseDown(e, layer.id, c)}
              style={{
                position: 'absolute', left: hx - 5, top: hy - 5, width: 10, height: 10,
                background: GOLD, border: '1px solid #000', borderRadius: 2,
                cursor: handleCursor(c), zIndex: 10,
              }}
            />
          )
        })}
      </div>
    )
  }

  // ── Layer panel helpers ─────────────────────────────────────────────
  const selectedLayer = state.layers.find((l) => state.selectedIds.length === 1 && l.id === state.selectedIds[0])

  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, overflow: 'hidden' }}>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: `1px solid ${BORDER}`, background: PANEL_BG, flexShrink: 0 }}>
        <button style={{ ...btnStyle, opacity: history.past.length ? 1 : 0.4 }} onClick={() => dispatch({ type: 'UNDO' })} title="Undo (Ctrl+Z)">Undo</button>
        <button style={{ ...btnStyle, opacity: history.future.length ? 1 : 0.4 }} onClick={() => dispatch({ type: 'REDO' })} title="Redo (Ctrl+Y)">Redo</button>

        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />

        <button style={btnStyle} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom / 1.2 })}>-</button>
        <span style={{ minWidth: 48, textAlign: 'center', color: TEXT_DIM }}>{Math.round(state.zoom * 100)}%</span>
        <button style={btnStyle} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom * 1.2 })}>+</button>
        <button style={btnStyle} onClick={fitToScreen}>Fit</button>

        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />

        <button style={{ ...btnStyle, background: state.showGrid ? GOLD : SURFACE, color: state.showGrid ? '#000' : TEXT }} onClick={() => dispatch({ type: 'TOGGLE_GRID' })}>Grid</button>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative' }}>
          <button style={{ ...btnStyle, background: GOLD, color: '#000', fontWeight: 600 }} onClick={() => setShowExportMenu(!showExportMenu)}>Export PNG</button>
          {showExportMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 4, zIndex: 100, minWidth: 160 }}>
              <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px' }} onClick={() => { exportPNG(false); setShowExportMenu(false) }}>With background</button>
              <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px', marginTop: 2 }} onClick={() => { exportPNG(true); setShowExportMenu(false) }}>Transparent</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Canvas ─────────────────────────────────────────────────── */}
        <div
          ref={canvasRef}
          style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: isPanning ? 'grabbing' : 'default' }}
          onWheel={onWheel}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          onClick={onCanvasClick}
        >
          <div data-canvas="true" style={{ position: 'absolute', left: state.panX, top: state.panY, width: CANVAS_W * state.zoom, height: CANVAS_H * state.zoom, background: SURFACE, boxShadow: '0 4px 40px rgba(0,0,0,0.5)', transformOrigin: '0 0' }}>
            <div style={{ transform: `scale(${state.zoom})`, transformOrigin: '0 0', width: CANVAS_W, height: CANVAS_H, position: 'relative' }} onClick={onCanvasClick} data-canvas="true">
              {state.showGrid && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}
              {state.layers.map(renderLayer)}
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div style={{ width: 260, borderLeft: `1px solid ${BORDER}`, background: PANEL_BG, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Layer actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontWeight: 600, flex: 1, color: GOLD }}>Layers</span>
            <div style={{ position: 'relative' }}>
              <button style={btnStyle} onClick={() => setShowAddMenu(!showAddMenu)}>+ Add</button>
              {showAddMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 4, zIndex: 100, minWidth: 130 }}>
                  <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px' }} onClick={() => { addImageLayer(); setShowAddMenu(false) }}>Image</button>
                  <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px', marginTop: 2 }} onClick={() => { addTextLayer(); setShowAddMenu(false) }}>Text</button>
                  <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px', marginTop: 2 }} onClick={() => { addShapeLayer('rectangle'); setShowAddMenu(false) }}>Rectangle</button>
                  <button style={{ ...btnStyle, width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 4, padding: '6px 10px', marginTop: 2 }} onClick={() => { addShapeLayer('circle'); setShowAddMenu(false) }}>Circle</button>
                </div>
              )}
            </div>
            <button
              style={{ ...btnStyle, opacity: state.selectedIds.length ? 1 : 0.4 }}
              onClick={() => { if (state.selectedIds.length) dispatch({ type: 'DELETE_LAYERS', ids: state.selectedIds }) }}
            >
              Del
            </button>
          </div>

          {/* Layer list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
            {[...state.layers].reverse().map((layer, vi) => {
              const realIndex = state.layers.length - 1 - vi
              const selected = state.selectedIds.includes(layer.id)
              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => setDragReorderIdx(realIndex)}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={() => {
                    if (dragReorderIdx !== null && dragReorderIdx !== realIndex) {
                      dispatch({ type: 'REORDER_LAYERS', fromIndex: dragReorderIdx, toIndex: realIndex })
                    }
                    setDragReorderIdx(null)
                  }}
                  onClick={(e) => {
                    const ids = e.shiftKey
                      ? selected ? state.selectedIds.filter((id) => id !== layer.id) : [...state.selectedIds, layer.id]
                      : [layer.id]
                    dispatch({ type: 'SELECT', ids })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, marginBottom: 2, cursor: 'grab',
                    background: selected ? 'rgba(212,175,55,0.15)' : 'transparent',
                    border: selected ? `1px solid ${GOLD}40` : '1px solid transparent',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: SURFACE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, overflow: 'hidden' }}>
                    {layer.type === 'image' && <img src={(layer as ImageLayer).src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {layer.type === 'text' && <span style={{ color: TEXT_DIM }}>T</span>}
                    {layer.type === 'shape' && <div style={{ width: 14, height: 14, background: (layer as ShapeLayer).fill, borderRadius: (layer as ShapeLayer).shape === 'circle' ? '50%' : 2 }} />}
                  </div>
                  {/* Name */}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{layer.name}</span>
                  {/* Visibility */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_LAYER', id: layer.id, changes: { visible: !layer.visible } }) }}
                    style={{ background: 'none', border: 'none', color: layer.visible ? TEXT : TEXT_DIM, cursor: 'pointer', padding: 2, fontSize: 14 }}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? '\u25C9' : '\u25CE'}
                  </button>
                  {/* Lock */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_LAYER', id: layer.id, changes: { locked: !layer.locked } }) }}
                    style={{ background: 'none', border: 'none', color: layer.locked ? GOLD : TEXT_DIM, cursor: 'pointer', padding: 2, fontSize: 12 }}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? '\u{1F512}' : '\u{1F513}'}
                  </button>
                </div>
              )
            })}
            {state.layers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: TEXT_DIM }}>
                No layers yet.<br />Click "+ Add" to start.
              </div>
            )}
          </div>

          {/* ── Properties panel ────────────────────────────────────── */}
          {selectedLayer && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              <div style={{ fontWeight: 600, color: GOLD, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Properties</div>
              <PropertyRow label="Name">
                <input
                  value={selectedLayer.name}
                  onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { name: e.target.value } })}
                  style={inputStyle}
                />
              </PropertyRow>
              <PropertyRow label="Position">
                <NumInput value={Math.round(selectedLayer.x)} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { x: v } })} />
                <NumInput value={Math.round(selectedLayer.y)} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { y: v } })} />
              </PropertyRow>
              <PropertyRow label="Size">
                <NumInput value={Math.round(selectedLayer.width)} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { width: v } })} />
                <NumInput value={Math.round(selectedLayer.height)} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { height: v } })} />
              </PropertyRow>
              <PropertyRow label="Rotation">
                <NumInput value={Math.round(selectedLayer.rotation)} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { rotation: v } })} />
              </PropertyRow>
              {selectedLayer.type === 'text' && (
                <>
                  <PropertyRow label="Font size">
                    <NumInput value={(selectedLayer as TextLayer).fontSize} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { fontSize: v } })} />
                  </PropertyRow>
                  <PropertyRow label="Color">
                    <input type="color" value={(selectedLayer as TextLayer).color} onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { color: e.target.value } })} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  </PropertyRow>
                  <PropertyRow label="Font">
                    <select value={(selectedLayer as TextLayer).fontFamily} onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { fontFamily: e.target.value } })} style={{ ...inputStyle, padding: '2px 4px' }}>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="monospace">Monospace</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Comic Sans MS', cursive">Comic Sans</option>
                    </select>
                  </PropertyRow>
                </>
              )}
              {selectedLayer.type === 'shape' && (
                <>
                  <PropertyRow label="Fill">
                    <input type="color" value={(selectedLayer as ShapeLayer).fill} onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { fill: e.target.value } })} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  </PropertyRow>
                  <PropertyRow label="Stroke">
                    <input type="color" value={(selectedLayer as ShapeLayer).stroke} onChange={(e) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { stroke: e.target.value } })} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                    <NumInput value={(selectedLayer as ShapeLayer).strokeWidth} onChange={(v) => dispatch({ type: 'UPDATE_LAYER', id: selectedLayer.id, changes: { strokeWidth: v } })} />
                  </PropertyRow>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small sub-components ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 4,
  color: TEXT,
  padding: '2px 6px',
  fontSize: 12,
  width: '100%',
  outline: 'none',
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 60, fontSize: 11, color: TEXT_DIM, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>{children}</div>
    </div>
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ ...inputStyle, width: 56, textAlign: 'center' }}
    />
  )
}

export type { Layer, LayerType, ShapeKind, EditorState }
