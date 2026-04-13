'use client'

import { useState, useCallback } from 'react'

/**
 * PlacementPanel — interactive part placement toolbar.
 *
 * Lets users place parts/objects at the Studio camera position with
 * one click. No competitor has this — the Roblox plugin API doesn't
 * expose Mouse.Hit for true viewport click-placement, but we CAN
 * place at the camera's current position (which the plugin reports
 * every 2 seconds via the sync context).
 *
 * Features:
 * - Part type selector (Part, Wedge, Cylinder, Sphere)
 * - Preset objects (Tree, Rock, House, Fence, Lamp, etc.)
 * - Size slider (1-20 studs)
 * - Material picker (6 materials)
 * - Color picker
 * - "Place at Camera" button → queues structured command
 */

// ── Part types ──────────────────────────────────────────────────────────────

const PART_TYPES = [
  { id: 'Part', label: 'Block', icon: '◼' },
  { id: 'WedgePart', label: 'Wedge', icon: '◣' },
  { id: 'Cylinder', label: 'Cylinder', icon: '◯' },
  { id: 'Ball', label: 'Sphere', icon: '●' },
] as const

// ── Preset objects (stamps) ─────────────────────────────────────────────────

const PRESET_OBJECTS = [
  { id: 'tree', label: 'Tree', emoji: '🌲', prompt: 'a simple pine tree with brown trunk and green leaves, 2 parts' },
  { id: 'rock', label: 'Rock', emoji: '🪨', prompt: 'a grey stone rock, single part, natural shape' },
  { id: 'house', label: 'House', emoji: '🏠', prompt: 'a small wooden house with walls, roof, and door, 8 parts' },
  { id: 'fence', label: 'Fence', emoji: '🏗️', prompt: 'a wooden fence section, 3 posts with 2 rails' },
  { id: 'lamp', label: 'Lamp', emoji: '💡', prompt: 'a street lamp with a tall pole and a PointLight at the top' },
  { id: 'bench', label: 'Bench', emoji: '🪑', prompt: 'a wooden park bench with backrest' },
  { id: 'barrel', label: 'Barrel', emoji: '🛢️', prompt: 'a wooden barrel, cylinder shape, brown' },
  { id: 'crate', label: 'Crate', emoji: '📦', prompt: 'a wooden crate box, 3x3x3 studs' },
] as const

// ── Materials ───────────────────────────────────────────────────────────────

const MATERIALS = [
  { id: 'Plastic', label: 'Plastic', color: '#a0a0a0' },
  { id: 'Wood', label: 'Wood', color: '#8B6914' },
  { id: 'Concrete', label: 'Concrete', color: '#808080' },
  { id: 'Metal', label: 'Metal', color: '#505050' },
  { id: 'Grass', label: 'Grass', color: '#4CAF50' },
  { id: 'Brick', label: 'Brick', color: '#C0392B' },
] as const

// ── Quick colors ────────────────────────────────────────────────────────────

const COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#333333', label: 'Dark' },
  { hex: '#e74c3c', label: 'Red' },
  { hex: '#3498db', label: 'Blue' },
  { hex: '#2ecc71', label: 'Green' },
  { hex: '#f39c12', label: 'Gold' },
  { hex: '#9b59b6', label: 'Purple' },
  { hex: '#e67e22', label: 'Orange' },
] as const

// ── Component ───────────────────────────────────────────────────────────────

interface PlacementPanelProps {
  /** Whether Studio is connected */
  studioConnected: boolean
  /** Place a raw part via structured command */
  onPlacePart: (opts: {
    partType: string
    size: number
    material: string
    color: string
    name?: string
  }) => void
  /** Place a preset object via AI prompt */
  onPlacePreset: (prompt: string) => void
}

export function PlacementPanel({
  studioConnected,
  onPlacePart,
  onPlacePreset,
}: PlacementPanelProps) {
  const [partType, setPartType] = useState<string>('Part')
  const [size, setSize] = useState(4)
  const [material, setMaterial] = useState('Plastic')
  const [color, setColor] = useState('#ffffff')
  const [expanded, setExpanded] = useState(false)

  const handlePlacePart = useCallback(() => {
    onPlacePart({ partType, size, material, color })
  }, [onPlacePart, partType, size, material, color])

  if (!studioConnected) return null

  return (
    <div
      style={{
        background: 'rgba(10,14,32,0.95)',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(212,175,55,0.06)',
          border: 'none',
          borderBottom: expanded ? '1px solid rgba(212,175,55,0.1)' : 'none',
          color: '#D4AF37',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}
      >
        <span>🔨 Free Build</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Part type selector */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 600 }}>Part Type</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {PART_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setPartType(pt.id)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: 6,
                    border: partType === pt.id ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: partType === pt.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                    color: partType === pt.id ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{pt.icon}</span>
                  <span>{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size slider */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 600 }}>
              Size: {size} studs
            </p>
            <input
              type="range"
              min={1}
              max={20}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#D4AF37' }}
            />
          </div>

          {/* Material picker */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 600 }}>Material</p>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m.id)}
                  title={m.label}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: material === m.id ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                    background: m.color,
                    cursor: 'pointer',
                    position: 'relative' as const,
                  }}
                >
                  {material === m.id && (
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 600 }}>Color</p>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: color === c.hex ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.15)',
                    background: c.hex,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Place button */}
          <button
            onClick={handlePlacePart}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
              color: '#050810',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Place at Camera →
          </button>

          {/* Preset stamps */}
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 600 }}>Quick Objects</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {PRESET_OBJECTS.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => onPlacePreset(`Place a ${obj.prompt} at my current camera position in Studio`)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 9,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    gap: 2,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <span style={{ fontSize: 16 }}>{obj.emoji}</span>
                  <span>{obj.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementPanel
