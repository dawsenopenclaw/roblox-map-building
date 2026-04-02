'use client'

import React, { useEffect, useState, useRef } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────────

export type ViewportState = 'idle' | 'building' | 'complete'

export interface ViewportPreviewProps {
  state: ViewportState
  /** How many blocks to show in the "complete" scene (clamped 0-12) */
  builtBlockCount?: number
  /** When true, renders a pulse skeleton instead of the viewport scene */
  isLoading?: boolean
  className?: string
}

// ─── Block definitions ──────────────────────────────────────────────────────────

interface BlockDef {
  id: string
  // isometric grid position (col, row — 0-indexed)
  col: number
  row: number
  // height in "units" — drives visual height
  h: number
  // palette
  top: string
  side: string
  dark: string
  delay: number // ms, stagger for building animation
}

const BLOCKS: BlockDef[] = [
  { id: 'b0',  col: 3, row: 3, h: 40, top: '#D4AF37', side: '#A8882B', dark: '#7A6018', delay: 0    },
  { id: 'b1',  col: 4, row: 2, h: 60, top: '#60A5FA', side: '#3B82F6', dark: '#1E40AF', delay: 140  },
  { id: 'b2',  col: 2, row: 4, h: 30, top: '#9CA3AF', side: '#6B7280', dark: '#374151', delay: 280  },
  { id: 'b3',  col: 5, row: 3, h: 50, top: '#D4AF37', side: '#A8882B', dark: '#7A6018', delay: 420  },
  { id: 'b4',  col: 3, row: 5, h: 35, top: '#60A5FA', side: '#3B82F6', dark: '#1E40AF', delay: 560  },
  { id: 'b5',  col: 6, row: 2, h: 45, top: '#9CA3AF', side: '#6B7280', dark: '#374151', delay: 700  },
  { id: 'b6',  col: 2, row: 2, h: 55, top: '#D4AF37', side: '#A8882B', dark: '#7A6018', delay: 840  },
  { id: 'b7',  col: 5, row: 5, h: 28, top: '#9CA3AF', side: '#6B7280', dark: '#374151', delay: 980  },
  { id: 'b8',  col: 4, row: 4, h: 42, top: '#60A5FA', side: '#3B82F6', dark: '#1E40AF', delay: 1120 },
  { id: 'b9',  col: 6, row: 4, h: 38, top: '#D4AF37', side: '#A8882B', dark: '#7A6018', delay: 1260 },
  { id: 'b10', col: 1, row: 3, h: 48, top: '#9CA3AF', side: '#6B7280', dark: '#374151', delay: 1400 },
  { id: 'b11', col: 7, row: 3, h: 32, top: '#60A5FA', side: '#3B82F6', dark: '#1E40AF', delay: 1540 },
]

// ─── Isometric math helpers ─────────────────────────────────────────────────────

// Cell size in px (before isometric skew)
const CELL = 32
// Vertical compression factor
const ISO_Y = 0.5

/**
 * Convert isometric grid col/row to SVG screen x/y (top-left of the top face)
 * Origin is placed so the grid is centred in a 480×320 viewBox.
 */
function isoPos(col: number, row: number): { x: number; y: number } {
  const x = (col - row) * CELL + 240
  const y = (col + row) * CELL * ISO_Y + 80
  return { x, y }
}

// ─── Single animated block ──────────────────────────────────────────────────────

function IsoBlock({
  def,
  visible,
  animating,
}: {
  def: BlockDef
  visible: boolean
  animating: boolean
}) {
  const { x, y } = isoPos(def.col, def.row)
  const h = def.h
  const w = CELL // face width
  const hw = w / 2

  // The four corners of the top (diamond) face
  const topFace = [
    `${x},${y}`,
    `${x + w},${y + w * ISO_Y}`,
    `${x},${y + w * ISO_Y * 2}`,
    `${x - w},${y + w * ISO_Y}`,
  ].join(' ')

  // Left face (light side)
  const leftFace = [
    `${x - w},${y + w * ISO_Y}`,
    `${x},${y + w * ISO_Y * 2}`,
    `${x},${y + w * ISO_Y * 2 + h}`,
    `${x - w},${y + w * ISO_Y + h}`,
  ].join(' ')

  // Right face (dark side)
  const rightFace = [
    `${x},${y + w * ISO_Y * 2}`,
    `${x + w},${y + w * ISO_Y}`,
    `${x + w},${y + w * ISO_Y + h}`,
    `${x},${y + w * ISO_Y * 2 + h}`,
  ].join(' ')

  // Window dots on left face
  const winCols = Math.max(1, Math.floor(hw / 6))
  const winRows = Math.max(1, Math.floor(h / 12))

  const windows: { wx: number; wy: number; lit: boolean }[] = []
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < winCols; c++) {
      // Slight isometric skew for windows on left face
      const px = x - w + 6 + c * ((w - 10) / Math.max(1, winCols))
      const py = y + w * ISO_Y + 8 + r * ((h - 14) / Math.max(1, winRows))
      windows.push({ wx: px, wy: py, lit: (r + c) % 3 !== 0 })
    }
  }

  const animClass = animating ? 'vp-block-drop' : ''

  return (
    <g
      className={animClass}
      style={{
        opacity: visible ? 1 : 0,
        animationDelay: animating ? `${def.delay}ms` : '0ms',
        // CSS var picked up by the keyframe via transform-origin
        // The block drops from above so we use translateY on the whole group
      }}
      aria-hidden="true"
    >
      {/* Top face */}
      <polygon points={topFace} fill={def.top} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
      {/* Top face highlight */}
      <polygon
        points={topFace}
        fill="rgba(255,255,255,0.12)"
        stroke="none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Left face */}
      <polygon points={leftFace} fill={def.side} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />

      {/* Right face */}
      <polygon points={rightFace} fill={def.dark} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />

      {/* Windows */}
      {windows.map((w, i) => (
        <rect
          key={i}
          x={w.wx}
          y={w.wy}
          width={3}
          height={3}
          rx={0.5}
          fill={w.lit ? 'rgba(255,220,100,0.75)' : 'rgba(0,0,0,0.4)'}
        />
      ))}
    </g>
  )
}

// ─── Isometric floor grid (SVG) ─────────────────────────────────────────────────

function IsoFloor() {
  const lines: React.ReactNode[] = []
  const cols = 10
  const rows = 8
  for (let c = 0; c <= cols; c++) {
    const start = isoPos(c, 0)
    const end = isoPos(c, rows)
    lines.push(
      <line
        key={`col-${c}`}
        x1={start.x} y1={start.y}
        x2={end.x}   y2={end.y}
        stroke="rgba(96,165,250,0.12)"
        strokeWidth="0.75"
        className="vp-grid-pulse"
      />
    )
  }
  for (let r = 0; r <= rows; r++) {
    const start = isoPos(0, r)
    const end = isoPos(cols, r)
    lines.push(
      <line
        key={`row-${r}`}
        x1={start.x} y1={start.y}
        x2={end.x}   y2={end.y}
        stroke="rgba(212,175,55,0.10)"
        strokeWidth="0.75"
        className="vp-grid-pulse"
      />
    )
  }
  return <g aria-hidden="true">{lines}</g>
}

// ─── Particle ───────────────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  y: number
  size: number
  dur: number
  delay: number
  color: string
}

const PARTICLE_COLORS = [
  'rgba(212,175,55,0.55)',
  'rgba(96,165,250,0.45)',
  'rgba(255,255,255,0.35)',
  'rgba(212,175,55,0.30)',
]

function makeParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 15 + Math.floor((i * 47) % 70),
    y: 20 + Math.floor((i * 31) % 60),
    size: 2 + (i % 3),
    dur: 3 + (i % 4),
    delay: (i * 0.37) % 4,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  }))
}

const PARTICLES = makeParticles(18)

// ─── ViewportPreview component ──────────────────────────────────────────────────

export function ViewportPreview({ state, builtBlockCount = 0, isLoading = false, className = '' }: ViewportPreviewProps) {
  // Track which blocks are visible (for building animation stagger)
  const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set())
  const [animatingSet, setAnimatingSet] = useState<Set<string>>(new Set())
  const buildTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clampedCount = Math.max(0, Math.min(BLOCKS.length, builtBlockCount))

  // On state change drive the animation
  useEffect(() => {
    // Clear any pending timers
    buildTimers.current.forEach(clearTimeout)
    buildTimers.current = []

    if (state === 'idle') {
      setVisibleSet(new Set())
      setAnimatingSet(new Set())
      return
    }

    if (state === 'building') {
      // Reset then stagger blocks in
      setVisibleSet(new Set())
      setAnimatingSet(new Set())

      BLOCKS.forEach((b) => {
        const t = setTimeout(() => {
          setAnimatingSet((prev) => new Set([...prev, b.id]))
          setVisibleSet((prev) => new Set([...prev, b.id]))
        }, b.delay)
        buildTimers.current.push(t)
      })

      return () => {
        buildTimers.current.forEach(clearTimeout)
      }
    }

    if (state === 'complete') {
      // Show the first `clampedCount` blocks (or all if 0) instantly, no animation
      const toShow = clampedCount === 0
        ? new Set(BLOCKS.map((b) => b.id))
        : new Set(BLOCKS.slice(0, clampedCount).map((b) => b.id))
      setVisibleSet(toShow)
      setAnimatingSet(new Set())
    }
  }, [state, clampedCount])

  // Derived
  const showParticles = state === 'idle'
  const showBuilding  = state === 'building'
  const showComplete  = state === 'complete'

  // Loading skeleton — shown before the viewport is ready
  if (isLoading) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden select-none ${className}`}
        style={{ background: 'linear-gradient(170deg, #0A1628 0%, #0D1F3C 45%, #0f0f0f 100%)' }}
        aria-label="Viewport loading"
        role="status"
        aria-busy="true"
      >
        {/* Skeleton grid lines */}
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={`h-${pct}`}
              className="absolute left-0 right-0 h-px animate-pulse"
              style={{ top: `${pct}%`, background: 'rgba(212,175,55,0.3)' }}
            />
          ))}
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={`v-${pct}`}
              className="absolute top-0 bottom-0 w-px animate-pulse"
              style={{ left: `${pct}%`, background: 'rgba(96,165,250,0.2)' }}
            />
          ))}
        </div>
        {/* Skeleton block placeholders */}
        <div className="absolute inset-0 flex items-center justify-center gap-3" aria-hidden="true">
          {[40, 64, 48, 56, 36].map((h, i) => (
            <div
              key={i}
              className="animate-pulse rounded-sm"
              style={{
                width: '28px',
                height: `${h}px`,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.15)',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>
        {/* Loading label */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
          <span className="text-[10px] text-white/30 animate-pulse">Loading viewport...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'linear-gradient(170deg, #0A1628 0%, #0D1F3C 45%, #0f0f0f 100%)' }}
      aria-label="Animated viewport preview"
      role="img"
    >
      {/* ── Stars ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {([
          [8,5],[15,2],[22,7],[31,1],[38,6],[45,3],[55,2],[63,6],[70,1],[78,4],[85,7],[92,3],
          [12,13],[28,10],[42,14],[58,11],[73,8],[88,12],[20,18],[50,16],[65,20],
        ] as [number,number][]).map(([sx, sy], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${sx}%`, top: `${sy}%`,
              width:  i % 3 === 0 ? '2px' : '1px',
              height: i % 3 === 0 ? '2px' : '1px',
              opacity: 0.2 + (i % 4) * 0.1,
            }}
          />
        ))}
      </div>

      {/* ── Main SVG scene ────────────────────────────────────────── */}
      <svg
        viewBox="0 0 480 320"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Ambient gradient */}
        <defs>
          <radialGradient id="vp-ambient" cx="50%" cy="60%" r="55%">
            <stop offset="0%"   stopColor="rgba(212,175,55,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="vp-ambient-blue" cx="50%" cy="40%" r="45%">
            <stop offset="0%"   stopColor="rgba(96,165,250,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="480" height="320" fill="url(#vp-ambient)" />
        <rect width="480" height="320" fill="url(#vp-ambient-blue)" />

        {/* Floor grid */}
        <IsoFloor />

        {/* Blocks — rendered back-to-front (higher col+row = front) */}
        {[...BLOCKS]
          .sort((a, b) => (a.col + a.row) - (b.col + b.row))
          .map((def) => (
            <IsoBlock
              key={def.id}
              def={def}
              visible={visibleSet.has(def.id)}
              animating={animatingSet.has(def.id)}
            />
          ))}

        {/* Ground shadow ellipse */}
        <ellipse
          cx="240" cy="265"
          rx="160" ry="18"
          fill="rgba(0,0,0,0.35)"
          style={{ filter: 'blur(6px)' }}
        />
      </svg>

      {/* ── Floating particles (idle) ──────────────────────────────── */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full vp-particle"
              style={{
                left:    `${p.x}%`,
                top:     `${p.y}%`,
                width:   `${p.size}px`,
                height:  `${p.size}px`,
                background: p.color,
                animationDuration:  `${p.dur}s`,
                animationDelay:     `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Building progress bar ─────────────────────────────────── */}
      {showBuilding && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full vp-build-progress"
            style={{ background: 'linear-gradient(90deg, #D4AF37, #60A5FA, #D4AF37)' }}
          />
        </div>
      )}

      {/* ── Overlay text ──────────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-2 vp-fade-in">
            {/* Pulsing cube icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 0 16px rgba(212,175,55,0.1)',
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z"
                  stroke="#D4AF37"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <path d="M10 2V18M2 6.5L18 6.5" stroke="#D4AF37" strokeWidth="0.75" strokeOpacity="0.5" />
              </svg>
            </div>
            <p className="text-xs font-semibold tracking-wide text-white/70">Ready to build</p>
            <p className="text-[10px] text-white/35">Type a command to start</p>
          </div>
        )}

        {state === 'building' && (
          <div className="flex flex-col items-center gap-1.5 vp-fade-in">
            <div className="flex items-center gap-2">
              {/* Animated dots */}
              <span className="vp-typing-dot" style={{ animationDelay: '0ms'   }} />
              <span className="vp-typing-dot" style={{ animationDelay: '160ms' }} />
              <span className="vp-typing-dot" style={{ animationDelay: '320ms' }} />
            </div>
            <p className="text-xs font-semibold text-[#D4AF37] tracking-wide">Building…</p>
          </div>
        )}

        {showComplete && (
          <div className="flex flex-col items-center gap-1.5 vp-fade-in">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#10B981]"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0"
                style={{ boxShadow: '0 0 6px #10B981' }}
              />
              Build complete
            </div>
          </div>
        )}
      </div>

      {/* ── Edge vignette ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
