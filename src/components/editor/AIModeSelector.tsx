'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

// ─── AI Mode Types ───────────────────────────────────────────────────────────

export type AIMode =
  | 'build'        // Default: generate Roblox game code
  | 'think'        // Deep reasoning mode (like ChatGPT thinking)
  | 'plan'         // Plan before building (like Rebirth's plan mode)
  | 'image'        // Image/asset generation (like ForgeGUI)
  | 'script'       // Pure Luau scripting
  | 'terrain'      // Terrain generation via MCP
  | 'mesh'         // 3D model generation
  | 'debug'        // Bug detection & fixing (like Ropilot/Rebirth)
  | 'idea'         // Game idea brainstorming (like BloxToolkit)

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
  /** Credit multiplier (1 = base cost) */
  creditMultiplier: number
  /** Keyboard shortcut hint */
  shortcut?: string
}

// ─── Mode Configurations ─────────────────────────────────────────────────────

export const AI_MODES: AIModeConfig[] = [
  {
    id: 'build',
    label: 'Build',
    shortLabel: 'Build',
    description: 'Generate full Roblox game features from text',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 10V4a1 1 0 011-1h8a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    color: '#D4AF37',
    bgColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.25)',
    placeholder: 'Describe what you want to build...',
    systemPrefix: '',
    creditMultiplier: 1,
    shortcut: '1',
  },
  {
    id: 'think',
    label: 'Think',
    shortLabel: 'Think',
    description: 'Deep reasoning — AI thinks step-by-step before answering',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5.5 10.5C5.5 10.5 6 12 7 12s1.5-1.5 1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="5.5" cy="5.5" r="0.6" fill="currentColor"/>
        <circle cx="8.5" cy="5.5" r="0.6" fill="currentColor"/>
        <path d="M5.8 7.2a1.5 1.5 0 002.4 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
    color: '#A78BFA',
    bgColor: 'rgba(167,139,250,0.08)',
    borderColor: 'rgba(167,139,250,0.25)',
    badge: 'DEEP',
    badgeColor: '#A78BFA',
    placeholder: 'Ask a complex question — AI will reason through it...',
    systemPrefix: '[THINKING_MODE] Think step-by-step. Show your reasoning process before giving the final answer. Consider multiple approaches and pick the best one.',
    showsReasoning: true,
    creditMultiplier: 2,
    shortcut: '2',
  },
  {
    id: 'plan',
    label: 'Plan',
    shortLabel: 'Plan',
    description: 'AI explores and plans before building — review before execution',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 5h4M5 7h4M5 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.08)',
    borderColor: 'rgba(56,189,248,0.25)',
    badge: 'NEW',
    badgeColor: '#38BDF8',
    placeholder: 'Describe your game — AI will create a detailed plan first...',
    systemPrefix: '[PLAN_MODE] Before writing any code, create a detailed build plan. List every component, script, and asset that will be needed. Present this as a numbered checklist. Wait for user approval before executing.',
    showsPlan: true,
    creditMultiplier: 1,
    shortcut: '3',
  },
  {
    id: 'image',
    label: 'Image',
    shortLabel: 'Image',
    description: 'Generate game icons, thumbnails, and UI assets',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="4.5" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
        <path d="M1.5 9.5l3-3 2.5 2 2-1.5 3.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#F472B6',
    bgColor: 'rgba(244,114,182,0.08)',
    borderColor: 'rgba(244,114,182,0.25)',
    badge: 'PRO',
    badgeColor: '#F472B6',
    placeholder: 'Describe the icon, thumbnail, or asset you want...',
    systemPrefix: '[IMAGE_MODE] Generate a Roblox game asset image. Focus on Roblox-appropriate art style with clean edges, vibrant colors, and proper dimensions.',
    creditMultiplier: 3,
    shortcut: '4',
  },
  {
    id: 'script',
    label: 'Script',
    shortLabel: 'Script',
    description: 'Pure Luau code generation — scripts, modules, systems',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 4l-2.5 3L4 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 4l2.5 3L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 2L6 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    color: '#4ADE80',
    bgColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
    placeholder: 'Describe the script or system you need...',
    systemPrefix: '[SCRIPT_MODE] Generate clean, optimized Luau code for Roblox. Use proper Roblox API patterns, type annotations, and modular architecture. Include comments explaining complex logic.',
    creditMultiplier: 1,
    shortcut: '5',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    shortLabel: 'Terrain',
    description: 'Procedural terrain generation via Terrain Forge',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 11l3-5 2 2 3-6 4 9H1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#34D399',
    bgColor: 'rgba(52,211,153,0.08)',
    borderColor: 'rgba(52,211,153,0.25)',
    placeholder: 'Describe the terrain — mountains, rivers, biomes...',
    systemPrefix: '[TERRAIN_MODE] Generate terrain using the Terrain Forge MCP tools. Create heightmaps, paint materials, and sculpt the landscape.',
    creditMultiplier: 2,
    shortcut: '6',
  },
  {
    id: 'mesh',
    label: '3D Model',
    shortLabel: '3D',
    description: 'Generate 3D meshes and assets via Meshy AI',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1l5 3v6l-5 3-5-3V4l5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M7 7v6M7 7l5-3M7 7L2 4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#FB923C',
    bgColor: 'rgba(251,146,60,0.08)',
    borderColor: 'rgba(251,146,60,0.25)',
    badge: 'PRO',
    badgeColor: '#FB923C',
    placeholder: 'Describe the 3D model you want to generate...',
    systemPrefix: '[MESH_MODE] Generate a 3D model using the Asset Alchemist MCP tools. Create detailed meshes with PBR textures.',
    creditMultiplier: 5,
    shortcut: '7',
  },
  {
    id: 'debug',
    label: 'Debug',
    shortLabel: 'Debug',
    description: 'Detect and fix bugs in your game — auto-test and repair',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 4V2M3 6L1 5M11 6l2-1M3 10l-2 1M11 10l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M5.5 7.5h3M7 6v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
    placeholder: 'Paste an error or describe the bug...',
    systemPrefix: '[DEBUG_MODE] Analyze the code for bugs and issues. Provide a clear diagnosis, then generate a fixed version. Explain what was wrong and why the fix works.',
    showsReasoning: true,
    creditMultiplier: 1,
    shortcut: '8',
  },
  {
    id: 'idea',
    label: 'Ideas',
    shortLabel: 'Ideas',
    description: 'Generate viral game concepts with monetization, trends & development plans',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5a4 4 0 013 6.7V10a1 1 0 01-1 1H5a1 1 0 01-1-1V8.2A4 4 0 017 1.5z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5.5 12.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    color: '#FBBF24',
    bgColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.25)',
    placeholder: 'Describe a game idea, or just say "surprise me" for viral concepts...',
    systemPrefix: `[IDEA_MODE] You are a viral Roblox game idea generator — the best in the industry.
For each idea, structure your response with these sections:
## [Game Title]
**Genre**: [genre tag] | **Trending Score**: [X/100] | **Complexity**: [Easy/Medium/Hard] | **Revenue Potential**: [Low/Medium/High/Mega]

**Viral Hook**: [the ONE thing that makes players share this]
**Unique Selling Point**: [what makes it different from every competitor]

**Core Gameplay Loop**:
- Micro (30s): [what players do every 30 seconds]
- Session (5-15min): [the progression cycle per session]
- Meta (days/weeks): [long-term goals that keep them coming back]

**Key Mechanics**: [4-6 specific mechanics]

**Monetization**:
- GamePasses: [name] ([price]R$), [name] ([price]R$), [name] ([price]R$)
- DevProducts: [name] ([price]R$), [name] ([price]R$)

**Target Audience**: [age range, platform, player type]
**Similar Games**: [2-3 real Roblox games that prove this market]
**Trend Alignment**: [what 2026 trends this capitalizes on]
**Retention Hooks**: [daily rewards, streaks, FOMO, social features]
**Development Roadmap**: MVP -> Alpha -> Beta -> Launch milestones

Generate 3 ideas unless asked for a different number. Be specific and creative — combine 2-3 proven patterns in unexpected ways.`,
    creditMultiplier: 1,
    shortcut: '9',
  },
]

// PERF: Build O(1) lookup maps at module load. `getModeConfig` is called on
// every render of ChatPanel + NewEditorClient + AIModeSelector — each call
// previously did a linear AI_MODES.find (9 iterations). Map.get is ~free.
// `AI_MODE_BY_SHORTCUT` is used by the global keydown handler which fires on
// literally every keystroke, including every character typed into the chat
// textarea.
const AI_MODE_BY_ID: Map<AIMode, AIModeConfig> = new Map(
  AI_MODES.map((m) => [m.id, m] as const),
)
const AI_MODE_BY_SHORTCUT: Map<string, AIModeConfig> = new Map(
  AI_MODES.filter((m) => m.shortcut).map((m) => [m.shortcut!, m] as const),
)

export function getModeConfig(mode: AIMode): AIModeConfig {
  return AI_MODE_BY_ID.get(mode) ?? AI_MODES[0]
}

// ─── Thinking/Reasoning Display ──────────────────────────────────────────────

export function ThinkingIndicator({ mode, thinkingText }: { mode: AIMode; thinkingText?: string }) {
  const config = getModeConfig(mode)
  const [dots, setDots] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    const elapsedTimer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearInterval(dotTimer); clearInterval(elapsedTimer) }
  }, [])

  const statusLabel = config.showsPlan ? 'Planning' : config.showsReasoning ? 'Thinking' : 'Generating'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 16px',
      borderRadius: 12,
      background: config.bgColor,
      border: `1px solid ${config.borderColor}`,
      animation: 'bubbleReveal 0.3s ease-out forwards',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: config.color,
          animation: 'statusPulse 2s ease-in-out infinite',
        }}>
          {config.icon}
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: config.color,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.01em',
        }}>
          {statusLabel}{dots}
        </span>
        <span style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.25)',
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: 'tabular-nums',
          marginLeft: 'auto',
        }}>
          {elapsed}s
        </span>
      </div>

      {/* Thinking text stream */}
      {thinkingText && (
        <div style={{
          fontSize: 12,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Inter, sans-serif',
          fontStyle: 'italic',
          maxHeight: 120,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${config.borderColor} transparent`,
          borderLeft: `2px solid ${config.borderColor}`,
          paddingLeft: 10,
        }}>
          {thinkingText}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        height: 2, borderRadius: 1,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          animation: 'streamingShimmer 2s linear infinite',
          backgroundSize: '200% 100%',
        }} />
      </div>
    </div>
  )
}

// ─── Plan Display Component ──────────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Plan content */}
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)',
            border: 'none',
            color: '#030712',
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(56,189,248,0.3)',
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

// ─── Creativity/Novelty Slider (inspired by BloxToolkit) ─────────────────────

export function CreativitySlider({
  value,
  onChange,
}: {
  value: number // 0-100
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

// ─── Style Reference Upload (inspired by ForgeGUI) ──────────────────────────

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
      {/* Existing refs */}
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

      {/* Add button */}
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

// ─── Main Mode Selector Pill Bar ─────────────────────────────────────────────

export function AIModeSelector({
  activeMode,
  onModeChange,
  compact = false,
}: {
  activeMode: AIMode
  onModeChange: (mode: AIMode) => void
  compact?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showMore, setShowMore] = useState(false)
  const activeConfig = getModeConfig(activeMode)

  // Primary modes shown as pills, rest in dropdown
  const primaryModes: AIMode[] = ['build', 'think', 'plan', 'script', 'image', 'idea']
  const moreModes: AIMode[] = ['terrain', 'mesh', 'debug']

  // Keyboard shortcut: Alt+number to switch modes
  // PERF: bail out BEFORE doing the map lookup on non-Alt keys so the common
  // case (typing into the chat textarea) short-circuits immediately.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const mode = AI_MODE_BY_SHORTCUT.get(e.key)
      if (mode) {
        e.preventDefault()
        onModeChange(mode.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onModeChange])

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showMore) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMore])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      position: 'relative',
    }}>
      {/* Primary mode pills */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '2px 0',
        }}
      >
        {primaryModes.map(modeId => {
          const config = AI_MODE_BY_ID.get(modeId)!
          const isActive = activeMode === modeId
          return (
            <button
              key={modeId}
              onClick={() => onModeChange(modeId)}
              title={`${config.label}: ${config.description}${config.shortcut ? ` (Alt+${config.shortcut})` : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: compact ? '4px 8px' : '5px 10px',
                borderRadius: 8,
                border: isActive
                  ? `1px solid ${config.borderColor}`
                  : '1px solid transparent',
                background: isActive
                  ? config.bgColor
                  : 'transparent',
                color: isActive ? config.color : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s ease-out',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{config.icon}</span>
              {!compact && config.shortLabel}
              {config.badge && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: config.badgeColor ?? config.color,
                  background: `${config.bgColor}`,
                  border: `1px solid ${config.borderColor}`,
                  padding: '1px 4px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>
                  {config.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* More dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMore(v => !v)}
          title="More modes"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: showMore ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
            background: showMore ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: 'rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2.5" cy="6" r="1" fill="currentColor"/>
            <circle cx="6" cy="6" r="1" fill="currentColor"/>
            <circle cx="9.5" cy="6" r="1" fill="currentColor"/>
          </svg>
        </button>

        {showMore && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 6,
            background: 'rgba(12,16,36,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 6,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 50,
            animation: 'msgFadeUp 0.15s ease-out forwards',
          }}>
            {moreModes.map(modeId => {
              const config = AI_MODE_BY_ID.get(modeId)!
              const isActive = activeMode === modeId
              return (
                <button
                  key={modeId}
                  onClick={() => { onModeChange(modeId); setShowMore(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive ? config.bgColor : 'transparent',
                    color: isActive ? config.color : 'rgba(255,255,255,0.6)',
                    fontSize: 12,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                    {config.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{config.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                      {config.description}
                    </div>
                  </div>
                  {config.badge && (
                    <span style={{
                      fontSize: 8, fontWeight: 700,
                      color: config.badgeColor ?? config.color,
                      padding: '2px 5px',
                      borderRadius: 4,
                      border: `1px solid ${config.borderColor}`,
                      letterSpacing: '0.05em',
                    }}>
                      {config.badge}
                    </span>
                  )}
                  {config.shortcut && (
                    <span style={{
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Alt+{config.shortcut}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Active mode credit indicator */}
      {activeConfig.creditMultiplier > 1 && (
        <span style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.25)',
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: 'tabular-nums',
          marginLeft: 2,
        }}>
          {activeConfig.creditMultiplier}x
        </span>
      )}
    </div>
  )
}

// ─── Image Style Preset Data ────────────────────────────────────────────────

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

// ─── Image Style Preset Selector ────────────────────────────────────────────

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
      {/* Label */}
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
        {/* Hover preview tooltip */}
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

      {/* Style pills grid */}
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
              {/* Color dot indicator */}
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
