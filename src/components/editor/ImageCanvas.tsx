'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ImageCanvasProps {
  width: number
  height: number
  template?: 'icon' | 'thumbnail' | 'shirt' | 'pants' | 'gfx'
  onExport?: (blob: Blob, filename: string) => void
  initialImages?: Array<{ url: string; name: string }>
}

interface Layer {
  id: string
  name: string
  type: 'image' | 'text'
  visible: boolean
  opacity: number
  x: number
  y: number
  width: number
  height: number
  // Image layers
  image?: HTMLImageElement
  // Text layers
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
}

interface HistoryEntry {
  layers: Layer[]
}

type Tool = 'select' | 'text' | 'pan'

// ── Template sizes ───────────────────────────────────────────────────────────

const TEMPLATE_SIZES: Record<string, { w: number; h: number; label: string }> = {
  icon:      { w: 512,  h: 512,  label: 'Game Icon (512x512)' },
  thumbnail: { w: 1920, h: 1080, label: 'Thumbnail (1920x1080)' },
  shirt:     { w: 585,  h: 559,  label: 'Shirt Template (585x559)' },
  pants:     { w: 585,  h: 559,  label: 'Pants Template (585x559)' },
  gfx:       { w: 1024, h: 1024, label: 'GFX Render (1024x1024)' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let _layerId = 0
function nextLayerId() { return `layer_${++_layerId}_${Date.now()}` }

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ ...l }))
}

// ── Gold accent color tokens ─────────────────────────────────────────────────

const C = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.3)',
  goldFaint: 'rgba(212,175,55,0.08)',
  bg: 'rgba(10,14,32,0.92)',
  bgPanel: 'rgba(14,20,40,0.95)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(212,175,55,0.25)',
  text: 'rgba(255,255,255,0.85)',
  textDim: 'rgba(255,255,255,0.5)',
  danger: '#ef4444',
}

// ── Inline styles (no Tailwind dependency) ───────────────────────────────────

const S = {
  panel: {
    background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: 8, display: 'flex', flexDirection: 'column' as const, gap: 4,
    fontSize: 12, color: C.text, minWidth: 180,
  },
  btn: {
    background: 'rgba(212,175,55,0.12)', border: `1px solid ${C.goldDim}`,
    borderRadius: 6, padding: '5px 10px', color: C.gold, fontSize: 11,
    cursor: 'pointer', fontWeight: 600, transition: 'background 0.15s',
  },
  btnSmall: {
    background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4,
    padding: '2px 6px', color: C.textDim, fontSize: 10, cursor: 'pointer',
  },
  layerRow: (selected: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
    borderRadius: 4, cursor: 'pointer',
    background: selected ? C.goldFaint : 'transparent',
    border: `1px solid ${selected ? C.goldDim : 'transparent'}`,
  }),
  input: {
    background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 4,
    padding: '4px 8px', color: C.text, fontSize: 11, outline: 'none', width: '100%',
  },
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImageCanvas({ width, height, template, onExport, initialImages }: ImageCanvasProps) {
  const tpl = template ? TEMPLATE_SIZES[template] : null
  const canvasW = tpl?.w ?? width
  const canvasH = tpl?.h ?? height

  // State
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<HistoryEntry[]>([{ layers: [] }])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png')

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; startX: number; startY: number; layerX: number; layerY: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  // ── History management ───────────────────────────────────────────────────

  const pushHistory = useCallback((newLayers: Layer[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1)
      const next = [...trimmed, { layers: cloneLayers(newLayers) }]
      // Cap at 50 entries
      if (next.length > 50) next.shift()
      return next
    })
    setHistoryIdx((prev) => Math.min(prev + 1, 50))
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const newIdx = historyIdx - 1
    setHistoryIdx(newIdx)
    setLayers(cloneLayers(history[newIdx].layers))
  }, [history, historyIdx])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const newIdx = historyIdx + 1
    setHistoryIdx(newIdx)
    setLayers(cloneLayers(history[newIdx].layers))
  }, [history, historyIdx])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo() }
      if (e.key === 'Delete' && selectedIds.size > 0) {
        const next = layers.filter((l) => !selectedIds.has(l.id))
        setLayers(next)
        pushHistory(next)
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, layers, selectedIds, pushHistory])

  // ── Load initial images ────────────────────────────────────────────────

  useEffect(() => {
    if (!initialImages?.length) return
    initialImages.forEach((img) => addImageFromUrl(img.url, img.name))
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Canvas rendering ───────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background checkerboard (transparency indicator)
    const tileSize = 16
    for (let y = 0; y < canvasH; y += tileSize) {
      for (let x = 0; x < canvasW; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0
        ctx.fillStyle = isLight ? '#2a2a3e' : '#242438'
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }

    // Draw layers bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue
      ctx.globalAlpha = layer.opacity

      if (layer.type === 'image' && layer.image) {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)
      }

      if (layer.type === 'text' && layer.text) {
        ctx.font = `${layer.fontSize ?? 24}px ${layer.fontFamily ?? 'sans-serif'}`
        ctx.fillStyle = layer.color ?? '#ffffff'
        ctx.fillText(layer.text, layer.x, layer.y + (layer.fontSize ?? 24))
      }

      ctx.globalAlpha = 1

      // Selection outline
      if (selectedIds.has(layer.id)) {
        ctx.strokeStyle = C.gold
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(layer.x - 1, layer.y - 1, layer.width + 2, layer.height + 2)
        ctx.setLineDash([])
      }
    }
  }, [layers, selectedIds, canvasW, canvasH])

  // ── Add image layer ────────────────────────────────────────────────────

  const addImageFromUrl = useCallback((url: string, name?: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Fit within canvas while preserving aspect ratio
      const scale = Math.min(canvasW / img.width, canvasH / img.height, 1)
      const w = img.width * scale
      const h = img.height * scale
      const newLayer: Layer = {
        id: nextLayerId(), name: name ?? `Image ${layers.length + 1}`,
        type: 'image', visible: true, opacity: 1,
        x: (canvasW - w) / 2, y: (canvasH - h) / 2,
        width: w, height: h, image: img,
      }
      setLayers((prev) => {
        const next = [...prev, newLayer]
        pushHistory(next)
        return next
      })
    }
    img.src = url
  }, [canvasW, canvasH, layers.length, pushHistory])

  // ── Add text layer ─────────────────────────────────────────────────────

  const addTextLayer = useCallback(() => {
    if (!textInput.trim()) return
    const fontSize = 32
    const newLayer: Layer = {
      id: nextLayerId(), name: `Text: ${textInput.slice(0, 20)}`,
      type: 'text', visible: true, opacity: 1,
      x: canvasW / 4, y: canvasH / 2,
      width: textInput.length * fontSize * 0.6, height: fontSize + 8,
      text: textInput, fontSize, fontFamily: 'sans-serif', color: '#ffffff',
    }
    setLayers((prev) => {
      const next = [...prev, newLayer]
      pushHistory(next)
      return next
    })
    setTextInput('')
  }, [textInput, canvasW, canvasH, pushHistory])

  // ── Mouse handlers ─────────────────────────────────────────────────────

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { cx: 0, cy: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      cx: (e.clientX - rect.left) * scaleX,
      cy: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse = pan
    if (e.button === 1 || activeTool === 'pan') {
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      return
    }

    const { cx, cy } = getCanvasCoords(e)

    // Hit test layers top to bottom (reverse order)
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (!l.visible) continue
      if (cx >= l.x && cx <= l.x + l.width && cy >= l.y && cy <= l.y + l.height) {
        if (e.shiftKey) {
          setSelectedIds((prev) => {
            const next = new Set(prev)
            next.has(l.id) ? next.delete(l.id) : next.add(l.id)
            return next
          })
        } else {
          setSelectedIds(new Set([l.id]))
        }
        dragRef.current = { id: l.id, startX: cx, startY: cy, layerX: l.x, layerY: l.y }
        return
      }
    }

    // Clicked empty space -- deselect
    if (!e.shiftKey) setSelectedIds(new Set())
  }, [layers, activeTool, pan, getCanvasCoords])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Pan
    if (panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy })
      return
    }

    // Drag layer
    if (dragRef.current) {
      const { cx, cy } = getCanvasCoords(e)
      const dx = cx - dragRef.current.startX
      const dy = cy - dragRef.current.startY
      setLayers((prev) =>
        prev.map((l) =>
          l.id === dragRef.current!.id
            ? { ...l, x: dragRef.current!.layerX + dx, y: dragRef.current!.layerY + dy }
            : l,
        ),
      )
    }
  }, [getCanvasCoords])

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      pushHistory(layers)
      dragRef.current = null
    }
    panStartRef.current = null
  }, [layers, pushHistory])

  // Zoom with scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.1, Math.min(5, prev + delta)))
  }, [])

  // ── Layer operations ───────────────────────────────────────────────────

  const toggleVisibility = (id: string) => {
    const next = layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    setLayers(next)
  }

  const setLayerOpacity = (id: string, opacity: number) => {
    const next = layers.map((l) => (l.id === id ? { ...l, opacity } : l))
    setLayers(next)
    pushHistory(next)
  }

  const removeLayer = (id: string) => {
    const next = layers.filter((l) => l.id !== id)
    setLayers(next)
    pushHistory(next)
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const moveLayer = (id: string, dir: -1 | 1) => {
    const idx = layers.findIndex((l) => l.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= layers.length) return
    const next = [...layers]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    setLayers(next)
    pushHistory(next)
  }

  // ── Export ─────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const offscreen = document.createElement('canvas')
    offscreen.width = canvasW
    offscreen.height = canvasH
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    for (const layer of layers) {
      if (!layer.visible) continue
      ctx.globalAlpha = layer.opacity
      if (layer.type === 'image' && layer.image) {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height)
      }
      if (layer.type === 'text' && layer.text) {
        ctx.font = `${layer.fontSize ?? 24}px ${layer.fontFamily ?? 'sans-serif'}`
        ctx.fillStyle = layer.color ?? '#ffffff'
        ctx.fillText(layer.text, layer.x, layer.y + (layer.fontSize ?? 24))
      }
      ctx.globalAlpha = 1
    }

    const mime = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
    const ext = exportFormat === 'jpeg' ? 'jpg' : 'png'
    const filename = `forje-${template ?? 'canvas'}-${Date.now()}.${ext}`

    offscreen.toBlob((blob) => {
      if (!blob) return
      if (onExport) {
        onExport(blob, filename)
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
      }
    }, mime, 0.95)
  }, [layers, canvasW, canvasH, exportFormat, template, onExport])

  // ── Import file ────────────────────────────────────────────────────────

  const handleFileImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => {
      const files = input.files
      if (!files) return
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            addImageFromUrl(reader.result, file.name)
          }
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }, [addImageFromUrl])

  // ── Render ─────────────────────────────────────────────────────────────

  const canvasDisplayW = Math.min(canvasW, 800)
  const canvasDisplayH = (canvasDisplayW / canvasW) * canvasH

  return (
    <div style={{ display: 'flex', gap: 12, width: '100%', height: '100%', minHeight: 500 }}>
      {/* Left: Layers panel */}
      <div style={{ ...S.panel, width: 200, flexShrink: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: C.gold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Layers
          </span>
          <span style={{ fontSize: 10, color: C.textDim }}>{layers.length}</span>
        </div>

        {layers.slice().reverse().map((layer) => (
          <div key={layer.id} style={S.layerRow(selectedIds.has(layer.id))} onClick={() => setSelectedIds(new Set([layer.id]))}>
            {/* Visibility toggle */}
            <button
              style={{ ...S.btnSmall, padding: '1px 4px', fontSize: 9 }}
              onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id) }}
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? '\u25C9' : '\u25CB'}
            </button>

            {/* Name */}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
              {layer.name}
            </span>

            {/* Reorder */}
            <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 1) }} title="Move up">{'\u25B2'}</button>
            <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, -1) }} title="Move down">{'\u25BC'}</button>

            {/* Delete */}
            <button
              style={{ ...S.btnSmall, color: C.danger }}
              onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
              title="Remove"
            >
              X
            </button>
          </div>
        ))}

        {/* Opacity slider for selected */}
        {selectedIds.size === 1 && (() => {
          const sel = layers.find((l) => l.id === [...selectedIds][0])
          if (!sel) return null
          return (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 10, color: C.textDim }}>Opacity: {Math.round(sel.opacity * 100)}%</label>
              <input
                type="range" min={0} max={1} step={0.01} value={sel.opacity}
                onChange={(e) => setLayerOpacity(sel.id, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: C.gold }}
              />
            </div>
          )
        })()}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
          <button style={S.btn} onClick={handleFileImport}>+ Import Image</button>
        </div>
      </div>

      {/* Center: Canvas area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center', padding: '6px 8px',
          background: C.bgPanel, borderRadius: 8, border: `1px solid ${C.border}`,
        }}>
          {/* Tool buttons */}
          {([['select', 'Select (V)', '\u25E8'], ['text', 'Text (T)', 'T'], ['pan', 'Pan (H)', '\u2B82']] as const).map(([tool, title, icon]) => (
            <button
              key={tool}
              style={{
                ...S.btn,
                background: activeTool === tool ? 'rgba(212,175,55,0.25)' : 'transparent',
                border: `1px solid ${activeTool === tool ? C.gold : C.border}`,
                minWidth: 28, textAlign: 'center',
              }}
              onClick={() => setActiveTool(tool)}
              title={title}
            >
              {icon}
            </button>
          ))}

          <span style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />

          {/* Undo / Redo */}
          <button style={S.btn} onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)">Undo</button>
          <button style={S.btn} onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Shift+Z)">Redo</button>

          <span style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />

          {/* Zoom */}
          <span style={{ fontSize: 10, color: C.textDim }}>Zoom:</span>
          <span style={{ fontSize: 11, color: C.text, minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button style={S.btnSmall} onClick={() => setZoom(1)}>Reset</button>

          <div style={{ flex: 1 }} />

          {/* Template label */}
          {tpl && <span style={{ fontSize: 10, color: C.goldDim }}>{tpl.label}</span>}

          {/* Export */}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg')}
            style={{ ...S.input, width: 60, padding: '3px 4px' }}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
          <button style={{ ...S.btn, background: 'rgba(212,175,55,0.2)' }} onClick={handleExport}>
            Export
          </button>
        </div>

        {/* Text input (shown when text tool active) */}
        {activeTool === 'text' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder="Type text and press Enter or click Add..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTextLayer() }}
            />
            <button style={S.btn} onClick={addTextLayer}>Add Text</button>
          </div>
        )}

        {/* Canvas viewport */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflow: 'hidden', background: 'rgba(0,0,0,0.4)',
            borderRadius: 8, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: activeTool === 'pan' ? 'grab' : activeTool === 'text' ? 'text' : 'default',
          }}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{
              width: canvasDisplayW * zoom,
              height: canvasDisplayH * zoom,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              imageRendering: zoom > 2 ? 'pixelated' : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', gap: 12, padding: '4px 8px', fontSize: 10, color: C.textDim,
          background: C.bgPanel, borderRadius: 6, border: `1px solid ${C.border}`,
        }}>
          <span>Canvas: {canvasW} x {canvasH}</span>
          <span>Layers: {layers.length}</span>
          <span>Selected: {selectedIds.size}</span>
          <span>History: {historyIdx + 1}/{history.length}</span>
        </div>
      </div>
    </div>
  )
}
