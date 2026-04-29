'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

// ─── AI Mode Types ───────────────────────────────────────────────────────────
// ONE unified AI bot. Two states: Chat (talk freely) and Build (generate code).
// The AI handles scripts, terrain, images, mesh, debugging — everything.
// Users toggle Build ON when ready to create, OFF when talking/planning.

export type AIMode = 'plan' | 'build'

// Backward compat aliases — old code may reference these
export type LegacyAIMode = 'plan' | 'think' | 'script' | 'terrain' | 'mesh' | 'debug' | 'idea' | 'image'

/** Map old mode names to unified modes */
export function normalizeAIMode(mode: string): AIMode {
  if (mode === 'build') return 'build'
  // Everything else is plan — the AI figures out what to do
  return 'plan'
}

export interface AIModeConfig {
  id: AIMode
  label: string
  shortLabel: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  badge?: string
  badgeColor?: string
  placeholder: string
  /** System prompt prefix injected before user message */
  systemPrefix: string
  /** Whether this mode uses streaming with reasoning display */
  showsReasoning?: boolean
  /** Whether this mode should show a planning step before execution */
  showsPlan?: boolean
  /** Credit multiplier (1 = base cost, 0 = free) */
  creditMultiplier: number
  /** Keyboard shortcut hint */
  shortcut?: string
}

// ─── Mode Configurations ─────────────────────────────────────────────────────

export const AI_MODES: AIModeConfig[] = [
  {
    id: 'plan',
    label: 'Plan',
    shortLabel: 'Plan',
    description: 'Talk freely about your game — Forje remembers everything for when you build',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H8l-3 2.5V11H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 6.5h6M5 8.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.08)',
    borderColor: 'rgba(56,189,248,0.25)',
    placeholder: 'Talk about your game idea — describe your vision, ask questions, plan together...',
    systemPrefix: '',
    showsPlan: false,
    showsReasoning: false,
    creditMultiplier: 0, // Chat is FREE
    shortcut: '1',
  },
  {
    id: 'build',
    label: 'Build',
    shortLabel: 'Build',
    description: 'Generate code, scripts, builds, terrain, UI — everything in Roblox Studio',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 12V5a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6.5 8h3M8 6.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
    color: '#D4AF37',
    bgColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.25)',
    placeholder: 'Describe what you want to build — Forje will create it in Studio...',
    systemPrefix: '',
    creditMultiplier: 1,
    shortcut: '2',
  },
]

// PERF: O(1) lookup maps
const AI_MODE_BY_ID: Map<AIMode, AIModeConfig> = new Map(
  AI_MODES.map((m) => [m.id, m] as const),
)
const AI_MODE_BY_SHORTCUT: Map<string, AIModeConfig> = new Map(
  AI_MODES.filter((m) => m.shortcut).map((m) => [m.shortcut!, m] as const),
)

export function getModeConfig(mode: AIMode | string): AIModeConfig {
  const normalized = normalizeAIMode(mode)
  return AI_MODE_BY_ID.get(normalized) ?? AI_MODES[1] // default to build
}

// ─── Thinking/Building Indicator ────────────────────────────────────────────

export function ThinkingIndicator({ mode, thinkingText }: { mode: AIMode | string; thinkingText?: string }) {
  const normalized = normalizeAIMode(mode)
  const [dots, setDots] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    const elapsedTimer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(dotTimer); clearInterval(elapsedTimer) }
  }, [])

  const statusLabel = normalized === 'plan' ? 'Thinking' : 'Building'

  const BUILD_PHASES = [
    { label: 'Understanding your request', threshold: 0 },
    { label: 'Designing your build', threshold: 2 },
    { label: 'Generating Luau code', threshold: 5 },
    { label: 'Sending to Studio', threshold: 10 },
    { label: 'Waiting for confirmation', threshold: 15 },
  ] as const

  const currentPhaseIdx = [...BUILD_PHASES].reverse().findIndex(p => elapsed >= p.threshold)
  const phaseIdx = currentPhaseIdx >= 0 ? BUILD_PHASES.length - 1 - currentPhaseIdx : 0
  const isBuild = normalized === 'build'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 16px',
      borderRadius: 12,
      background: isBuild ? 'rgba(212,175,55,0.04)' : 'rgba(56,189,248,0.04)',
      border: `1px solid ${isBuild ? 'rgba(212,175,55,0.12)' : 'rgba(56,189,248,0.12)'}`,
      animation: 'bubbleReveal 0.3s ease-out forwards',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isBuild ? '#D4AF37' : '#38BDF8',
          animation: 'pulse 1.5s ease-in-out infinite',
          boxShadow: `0 0 8px ${isBuild ? 'rgba(212,175,55,0.4)' : 'rgba(56,189,248,0.4)'}`,
        }} />
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: isBuild ? '#D4AF37' : '#38BDF8',
          fontFamily: 'Inter, sans-serif',
        }}>
          {statusLabel}{dots}
        </span>
        <span style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
          marginLeft: 'auto',
        }}>
          {elapsed}s
        </span>
      </div>

      {/* Build progress phases */}
      {isBuild && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 16 }}>
          {BUILD_PHASES.map((phase, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: i <= phaseIdx ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: i < phaseIdx ? '#D4AF37' : i === phaseIdx ? '#F0C850' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
              }} />
              <span style={{
                fontSize: 11, color: i <= phaseIdx ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                fontFamily: 'Inter, sans-serif',
              }}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Thinking text display */}
      {thinkingText && (
        <div style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'pre-wrap',
          maxHeight: 120,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          paddingLeft: 16,
        }}>
          {thinkingText}
        </div>
      )}

      {/* Shimmer bar */}
      <div style={{
        height: 2, borderRadius: 1,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isBuild
            ? 'linear-gradient(90deg, transparent, #D4AF37, #F0C850, #D4AF37, transparent)'
            : 'linear-gradient(90deg, transparent, #38BDF8, #7DD3FC, #38BDF8, transparent)',
          animation: 'streamingShimmer 2s linear infinite',
          backgroundSize: '200% 100%',
        }} />
      </div>
    </div>
  )
}

// ─── Plan Display Component (kept for backward compat) ─────────────────────

export function PlanDisplay({
  planText,
  onApprove,
  onEdit,
  onCancel,
}: {
  planText: string
  onApprove: () => void
  onEdit: () => void
  onCancel: () => void
}) {
  const steps = planText.split('\n').filter(line => /^\d+[\.\)]/.test(line.trim()))

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: 14,
      background: 'rgba(56,189,248,0.05)',
      border: '1px solid rgba(56,189,248,0.2)',
      animation: 'bubbleReveal 0.3s ease-out forwards',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="2" stroke="#38BDF8" strokeWidth="1.3"/>
          <path d="M5 5h4M5 7h4M5 9h2" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8', fontFamily: 'Inter, sans-serif' }}>
          Build Plan
        </span>
        <span style={{
          fontSize: 10, color: 'rgba(56,189,248,0.6)',
          fontFamily: 'Inter, sans-serif',
          marginLeft: 'auto',
        }}>
          {steps.length} steps
        </span>
      </div>

      <div style={{
        fontSize: 13,
        lineHeight: 1.7,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'pre-wrap',
        maxHeight: 280,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(56,189,248,0.15) transparent',
      }}>
        {planText}
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
            border: 'none',
            color: '#030712',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(212,175,55,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Build This
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '9px 16px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Edit Plan
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 14px',
            borderRadius: 9,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Creativity/Novelty Slider ─────────────────────────────────────────────

export function CreativitySlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 0',
    }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
        Safe
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1,
          height: 4,
          appearance: 'none',
          background: `linear-gradient(90deg, rgba(56,189,248,0.4) ${value}%, rgba(255,255,255,0.08) ${value}%)`,
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.6)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
        Creative
      </span>
    </div>
  )
}

// ─── Style Reference Upload ──────────────────────────────────────────────

export function StyleReferenceUpload({
  references,
  onAdd,
  onRemove,
  maxRefs = 5,
}: {
  references: File[]
  onAdd: (file: File) => void
  onRemove: (index: number) => void
  maxRefs?: number
}) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = references.map(f => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [references])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 0',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {previewUrls.map((url, i) => (
        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Style ref ${i + 1}`}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1px solid rgba(244,114,182,0.3)',
            }}
          />
          <button
            onClick={() => onRemove(i)}
            style={{
              position: 'absolute',
              top: -4, right: -4,
              width: 14, height: 14,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.8)',
              border: '1px solid rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}

      {references.length < maxRefs && (
        <label style={{
          width: 36, height: 36,
          borderRadius: 8,
          border: '1px dashed rgba(244,114,182,0.25)',
          background: 'rgba(244,114,182,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          color: 'rgba(244,114,182,0.5)',
          transition: 'all 0.15s',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onAdd(file)
              e.target.value = ''
            }}
          />
        </label>
      )}

      <span style={{
        fontSize: 10,
        color: 'rgba(244,114,182,0.4)',
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        marginLeft: 4,
      }}>
        Style refs ({references.length}/{maxRefs})
      </span>
    </div>
  )
}

// ─── BUILD TOGGLE — The main UI component ────────────────────────────────────
// Simple, prominent toggle. Chat mode (off) = talk freely. Build mode (on) = generate.
// This replaces the old 9-mode pill bar with a clean power switch.

export function AIModeSelector({
  activeMode,
  onModeChange,
  compact = false,
}: {
  activeMode: AIMode | string
  onModeChange: (mode: AIMode) => void
  compact?: boolean
}) {
  const normalized = normalizeAIMode(activeMode)
  const isBuild = normalized === 'build'

  // Keyboard shortcut: Alt+B = toggle build mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        onModeChange(isBuild ? 'plan' : 'build')
      }
      // Alt+1 = Plan, Alt+2 = Build
      if (e.key === '1') { e.preventDefault(); onModeChange('plan') }
      if (e.key === '2') { e.preventDefault(); onModeChange('build') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onModeChange, isBuild])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 3,
    }}>
      {/* Toggle Switch */}
      <button
        onClick={() => onModeChange(isBuild ? 'plan' : 'build')}
        title={`${isBuild ? 'Build Mode ON' : 'Chat Mode'} (Alt+B to toggle)`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: compact ? '5px 14px' : '7px 18px',
          borderRadius: 10,
          border: isBuild
            ? '1.5px solid rgba(212,175,55,0.4)'
            : '1.5px solid rgba(56,189,248,0.25)',
          background: isBuild
            ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.06) 100%)'
            : 'rgba(56,189,248,0.06)',
          color: isBuild ? '#D4AF37' : '#38BDF8',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.25s ease-out',
          letterSpacing: '-0.01em',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Power indicator dot */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isBuild ? '#D4AF37' : '#38BDF8',
          boxShadow: isBuild
            ? '0 0 8px rgba(212,175,55,0.5)'
            : '0 0 6px rgba(56,189,248,0.3)',
          transition: 'all 0.25s',
        }} />

        {/* Mode icon */}
        {isBuild ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 12V5a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6.5 8h3M8 6.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H8l-3 2.5V11H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 6.5h6M5 8.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )}

        {/* Mode label */}
        <span>{isBuild ? 'Build' : 'Plan'}</span>

        {/* Build mode glow effect */}
        {isBuild && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.05), transparent)',
            pointerEvents: 'none',
          }} />
        )}
      </button>

      {/* Keyboard hint */}
      {!compact && (
        <span style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.2)',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          padding: '0 4px',
        }}>
          Alt+B
        </span>
      )}
    </div>
  )
}

// ─── Image Style Presets (kept for image generation sub-feature) ────────────

export interface ImageStyleOption {
  key: string
  label: string
  color: string
  bgColor: string
  description: string
}

export const IMAGE_STYLE_PRESETS: ImageStyleOption[] = [
  { key: 'roblox-icon', label: 'Icon', color: '#D4AF37', bgColor: 'rgba(212,175,55,0.15)', description: 'Roblox game icon, 512x512, bold and centered' },
  { key: 'game-thumbnail', label: 'Thumbnail', color: '#38BDF8', bgColor: 'rgba(56,189,248,0.15)', description: 'Widescreen cinematic game thumbnail' },
  { key: 'ui-element', label: 'UI', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.15)', description: 'Clean flat UI element, scalable' },
  { key: 'gfx-render', label: 'GFX', color: '#A78BFA', bgColor: 'rgba(167,139,250,0.15)', description: 'Studio-lit character GFX render' },
  { key: 'cinematic', label: 'Cinematic', color: '#FB923C', bgColor: 'rgba(251,146,60,0.15)', description: 'Dramatic cinematic lighting, film quality' },
  { key: 'neon', label: 'Neon', color: '#E879F9', bgColor: 'rgba(232,121,249,0.15)', description: 'Cyberpunk neon glow, synthwave vibes' },
  { key: 'horror', label: 'Horror', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)', description: 'Dark eerie atmosphere, ominous shadows' },
  { key: 'cartoon', label: 'Cartoon', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.15)', description: 'Bold outlines, bright kid-friendly style' },
  { key: 'low-poly', label: 'Low Poly', color: '#34D399', bgColor: 'rgba(52,211,153,0.15)', description: 'Geometric faceted 3D, minimalist' },
  { key: 'realistic', label: 'Realistic', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.15)', description: 'Photorealistic, DSLR quality detail' },
  { key: 'anime', label: 'Anime', color: '#F472B6', bgColor: 'rgba(244,114,182,0.15)', description: 'Cel-shaded anime art, manga-inspired' },
  { key: 'pixel-art', label: 'Pixel', color: '#4ADE80', bgColor: 'rgba(74,222,128,0.15)', description: 'Retro 8-bit pixel art, limited palette' },
  { key: 'clothing', label: 'Clothing', color: '#C084FC', bgColor: 'rgba(192,132,252,0.15)', description: 'Roblox shirt/pants UV templates' },
]

export function ImageStylePresetSelector({
  selectedStyle,
  onStyleChange,
}: {
  selectedStyle: string
  onStyleChange: (styleKey: string) => void
}) {
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null)

  const hoveredPreset = useMemo(
    () => IMAGE_STYLE_PRESETS.find(s => s.key === hoveredStyle),
    [hoveredStyle],
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '8px 0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(244,114,182,0.6)',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Style Preset
        </span>
        {hoveredPreset && (
          <span style={{
            fontSize: 10,
            color: hoveredPreset.color,
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'italic',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease-out',
          }}>
            {hoveredPreset.description}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        {IMAGE_STYLE_PRESETS.map(preset => {
          const isActive = selectedStyle === preset.key
          return (
            <button
              key={preset.key}
              onClick={() => onStyleChange(preset.key)}
              onMouseEnter={() => setHoveredStyle(preset.key)}
              onMouseLeave={() => setHoveredStyle(null)}
              title={preset.description}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: isActive
                  ? `1.5px solid ${preset.color}`
                  : '1px solid rgba(255,255,255,0.08)',
                background: isActive
                  ? preset.bgColor
                  : 'rgba(255,255,255,0.02)',
                color: isActive
                  ? preset.color
                  : 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.12s ease-out',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = preset.color
                  e.currentTarget.style.borderColor = `${preset.color}55`
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }
              }}
            >
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: preset.color,
                marginRight: 5,
                opacity: isActive ? 1 : 0.5,
                boxShadow: isActive ? `0 0 6px ${preset.color}80` : 'none',
                transition: 'all 0.12s ease-out',
              }} />
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
