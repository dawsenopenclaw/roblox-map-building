'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { GlassPanel } from './GlassPanel'
import type { ChatMessage, MeshResult, ModelId, ModelOption } from '@/app/(app)/editor/hooks/useChat'
import { MODELS } from '@/app/(app)/editor/hooks/useChat'
import { McpToolCard, type McpToolResult } from './McpToolCard'
import { McpToolbar } from './McpToolbar'
import { ModelPreview } from './ModelPreview'
import { VoiceInputButton } from './VoiceInputButton'
import { CheckpointPanel } from './CheckpointPanel'
import { CheckpointTimeline } from './CheckpointTimeline'
import { computeLineDiff, hasDiff } from '@/lib/simple-diff'
import {
  AIModeSelector,
  ThinkingIndicator,
  PlanDisplay,
  CreativitySlider,
  StyleReferenceUpload,
  ImageStylePresetSelector,
  getModeConfig,
  type AIMode,
  type AIModeConfig,
} from './AIModeSelector'
import { PlaytestToggle } from './PlaytestToggle'
import { EnhanceToggle } from './EnhanceToggle'
import { PlaytestIndicator } from './PlaytestIndicator'
import { ManualBuildPanel } from './ManualBuildPanel'
import { useIsMobile } from '@/hooks/useMediaQuery'

// ─── Empty-state rotating headline (matches marketing site) ───────────────────
// Cycled by EmptyState every 2.4s. Intentionally a different word set than the
// marketing hero so editor users see a curated, action-oriented vocabulary.

const EDITOR_ROTATING_WORDS = [
  'Game',
  'Map',
  'World',
  'Obby',
  'Tycoon',
  'Sim',
  'Quest',
] as const

// ─── Full game presets (empty state — "Build a Full Game" section) ─────────────
// These use the step-by-step builder for complete playable games.
import { PRIMARY_PRESETS, SIMULATOR_PRESETS, TYCOON_PRESETS } from '@/lib/game-presets'

const FULL_GAME_CARDS = PRIMARY_PRESETS.map((p) => ({
  id: p.id,
  emoji: p.icon,
  label: p.label,
  tagline: p.tagline,
  prompt: p.prompt,
}))

// Simulator and Tycoon sub-genres — shown when user wants something specific
const SIM_CARDS = SIMULATOR_PRESETS.map((p) => ({
  id: p.id,
  emoji: p.icon,
  label: p.label,
  tagline: p.tagline,
  prompt: p.prompt,
}))

const TYC_CARDS = TYCOON_PRESETS.map((p) => ({
  id: p.id,
  emoji: p.icon,
  label: p.label,
  tagline: p.tagline,
  prompt: p.prompt,
}))

// ─── Quick build examples (empty state — single-block prompts) ────────────────

const SHOWCASE_EXAMPLES = [
  {
    emoji: '🏰',
    label: 'Castle',
    desc: 'Towers, moat & drawbridge',
    prompt: 'Build me a medieval castle with towers, iron portcullis, and a water moat with drawbridge',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    emoji: '🌆',
    label: 'Neon City',
    desc: 'Skyscrapers & neon lights',
    prompt: 'Create a neon city with tall skyscrapers, glowing signs, and busy streets',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.2)',
  },
  {
    emoji: '🔥',
    label: 'Lava Obby',
    desc: 'Obstacle course over lava',
    prompt: 'Make an obstacle course over lava with moving platforms, jump pads, and checkpoints',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    emoji: '☕',
    label: 'Cafe',
    desc: 'Interior with furniture',
    prompt: 'Design a cozy cafe interior with tables, chairs, a coffee counter, and warm lighting',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.25)',
  },
] as const

// ─── Tip of the day data ───────────────────────────────────────────────────────

const TIPS = [
  "Try saying 'make it bigger' to scale your last build",
  "Say 'add lighting' for atmosphere",
  "Use 'add NPCs' to populate any scene with characters",
  "Say 'optimize this' to reduce part count and improve FPS",
  "Try 'add sound effects' to bring your world to life",
  "Say 'change the style to sci-fi' to retheme any build",
  "Use 'add a spawn point' to set player start location",
  "Say 'make it more detailed' for a higher-quality build",
  'Try /build, /script, or /terrain for targeted generation',
  'Connect Studio to push builds live — no copy-paste ever',
] as const

const LS_TIP_KEY = 'fg_tip_session_count'
const LS_TIP_DISMISSED = 'fg_tip_dismissed_v1'
const MAX_TIP_SESSIONS = 10

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0 4px' }}>
      <div
        style={{
          width: 48,
          height: 2,
          borderRadius: 2,
          background: 'rgba(212,175,55,0.12)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.7) 40%, rgba(212,175,55,0.9) 50%, rgba(212,175,55,0.7) 60%, transparent 100%)',
            animation: 'shimmerBar 1.6s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

// Strip partial or complete code blocks from streaming content so raw Lua
// never flashes on screen. Handles both open (no closing ```) and closed blocks.
function stripCodeBlocksForDisplay(content: string): string {
  // Remove fully closed code blocks: ```lang\n...\n```
  let result = content.replace(/```(?:lua|luau|[a-z]*)?\s*\n[\s\S]*?```/g, '')
  // Remove any open (still-streaming) code block: ``` to end of string
  result = result.replace(/```[\s\S]*$/g, '')
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

// ─── Luau syntax highlighting ─────────────────────────────────────────────────

function highlightLuau(code: string): React.ReactNode[] {
  type Span = { start: number; end: number; type: 'keyword' | 'string' | 'comment' | 'number' }
  const spans: Span[] = []

  const addMatches = (re: RegExp, type: Span['type']) => {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, type })
    }
  }

  // Priority: comments (highest) > strings > numbers > keywords
  addMatches(/(--\[\[[\s\S]*?\]\]|--[^\n]*)/g, 'comment')
  addMatches(/(["'])(?:\\.|(?!\1)[^\\])*?\1/g, 'string')
  addMatches(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?|0x[0-9a-fA-F]+)\b/g, 'number')
  addMatches(/\b(local|function|if|then|else|elseif|end|for|while|do|repeat|until|return|break|continue|in|and|or|not|true|false|nil|self|type|export|import)\b/g, 'keyword')

  spans.sort((a, b) => a.start - b.start)
  const resolved: Span[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start < cursor) continue
    resolved.push(span)
    cursor = span.end
  }

  const colorMap: Record<Span['type'], string> = {
    keyword: '#D4AF37',
    string: '#4ADE80',
    comment: 'rgba(255,255,255,0.28)',
    number: '#67E8F9',
  }

  const nodes: React.ReactNode[] = []
  let pos = 0
  for (const span of resolved) {
    if (pos < span.start) nodes.push(code.slice(pos, span.start))
    nodes.push(
      <span key={span.start} style={{ color: colorMap[span.type] }}>
        {code.slice(span.start, span.end)}
      </span>
    )
    pos = span.end
  }
  if (pos < code.length) nodes.push(code.slice(pos))
  return nodes
}

// ─── LuauCodeBlock component ──────────────────────────────────────────────────

// Robust clipboard copy — tries navigator.clipboard first, falls back to
// the legacy execCommand approach for cases where the Clipboard API fails
// silently (e.g. iframe sandboxing, focus issues, permission denied).
function copyToClipboard(text: string): boolean {
  // Try modern API first
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback below
      fallbackCopy(text)
    })
    return true
  }
  return fallbackCopy(text)
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// ─── Simple hash for feedback dedup ───────────────────────────────────────────
function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

// ─── Code feedback buttons ───────────────────────────────────────────────────
function CodeFeedbackButtons({ code }: { code: string }) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'done'>('idle')

  const submitFeedback = async (worked: boolean) => {
    if (feedbackState !== 'idle') return
    setFeedbackState('submitting')
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: `code-${simpleHash(code)}`,
          thumbsUp: worked,
        }),
      })
    } catch {
      // Swallow — feedback is best-effort
    }
    setFeedbackState('done')
  }

  if (feedbackState === 'done') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'rgba(74,222,128,0.7)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Thanks for the feedback!
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
          marginRight: 2,
        }}
      >
        Did this work?
      </span>
      <button
        onClick={() => submitFeedback(true)}
        disabled={feedbackState === 'submitting'}
        title="This code worked"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 10,
          padding: '2px 7px',
          borderRadius: 4,
          border: '1px solid rgba(74,222,128,0.2)',
          background: 'rgba(74,222,128,0.06)',
          color: 'rgba(74,222,128,0.7)',
          cursor: feedbackState === 'submitting' ? 'wait' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
          opacity: feedbackState === 'submitting' ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (feedbackState === 'idle') {
            e.currentTarget.style.background = 'rgba(74,222,128,0.12)'
            e.currentTarget.style.borderColor = 'rgba(74,222,128,0.35)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(74,222,128,0.06)'
          e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)'
        }}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 8 6 12 14 4" />
        </svg>
        Worked
      </button>
      <button
        onClick={() => submitFeedback(false)}
        disabled={feedbackState === 'submitting'}
        title="This code broke"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 10,
          padding: '2px 7px',
          borderRadius: 4,
          border: '1px solid rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.06)',
          color: 'rgba(239,68,68,0.7)',
          cursor: feedbackState === 'submitting' ? 'wait' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
          opacity: feedbackState === 'submitting' ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (feedbackState === 'idle') {
            e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
        }}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
        Broke
      </button>
    </div>
  )
}

function LuauCodeBlock({
  code,
  onSendToStudio,
  studioConnected,
}: {
  code: string
  onSendToStudio?: (luauCode: string) => void
  studioConnected?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)

  const handleCopy = async () => {
    copyToClipboard(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRun = () => {
    if (!onSendToStudio) return
    onSendToStudio(code)
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 4,
        borderRadius: 10,
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'rgba(212,175,55,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
          }}
        >
          Luau
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {studioConnected && onSendToStudio && (
            <button
              onClick={handleRun}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 5,
                border: sent ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(212,175,55,0.3)',
                background: sent ? 'rgba(74,222,128,0.1)' : 'rgba(212,175,55,0.1)',
                color: sent ? 'rgba(74,222,128,0.85)' : 'rgba(212,175,55,0.85)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {sent ? 'Sent!' : 'Run in Studio'}
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
              color: copied ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '10px 12px',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.72)',
          overflowX: 'auto',
          maxHeight: 320,
          overflowY: 'auto',
          whiteSpace: 'pre',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        <code>{highlightLuau(code)}</code>
      </pre>
      <CodeFeedbackButtons code={code} />
    </div>
  )
}

// ─── Content renderer: splits prose and fenced code blocks ───────────────────

function RenderMessageContent({
  content,
  onSendToStudio,
  studioConnected,
}: {
  content: string
  onSendToStudio?: (luauCode: string) => void
  studioConnected?: boolean
}) {
  const parts: React.ReactNode[] = []
  const fenceRe = /```(?:lua|luau|[a-z]*)?\n([\s\S]*?)```/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  fenceRe.lastIndex = 0
  while ((m = fenceRe.exec(content)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={key++} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {content.slice(last, m.index)}
        </span>
      )
    }
    parts.push(
      <LuauCodeBlock
        key={key++}
        code={m[1].trimEnd()}
        onSendToStudio={onSendToStudio}
        studioConnected={studioConnected}
      />
    )
    last = m.index + m[0].length
  }
  if (last < content.length) {
    parts.push(
      <span key={key++} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {content.slice(last)}
      </span>
    )
  }
  return <>{parts}</>
}

// ─── Build success particle burst (CSS-only) ─────────────────────────────────

function BuildSuccessCelebration() {
  const DOTS = [
    { angle: 0,   dist: 26 },
    { angle: 60,  dist: 30 },
    { angle: 120, dist: 24 },
    { angle: 180, dist: 28 },
    { angle: 240, dist: 26 },
    { angle: 300, dist: 32 },
  ]
  return (
    <>
      <style>{`
        @keyframes particleBurst {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          60%  { opacity: 0.9; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
        }
        @keyframes goldTextPulse {
          0%   { color: rgba(74,222,128,0.9); }
          40%  { color: #D4AF37; text-shadow: 0 0 12px rgba(212,175,55,0.6); }
          100% { color: rgba(74,222,128,0.9); text-shadow: none; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}
      >
        {DOTS.map((dot, i) => {
          const rad = (dot.angle * Math.PI) / 180
          const tx = Math.round(Math.cos(rad) * dot.dist)
          const ty = Math.round(Math.sin(rad) * dot.dist)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: i % 3 === 0 ? 5 : 4,
                height: i % 3 === 0 ? 5 : 4,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#D4AF37' : '#FFB81C',
                marginTop: -2,
                marginLeft: -2,
                ['--tx' as string]: `${tx}px`,
                ['--ty' as string]: `${ty}px`,
                animation: `particleBurst 0.7s cubic-bezier(0.2, 0.8, 0.4, 1) ${i * 40}ms forwards`,
              } as React.CSSProperties}
            />
          )
        })}
      </div>
    </>
  )
}

// Pulse animation for "Sent to Studio" success dot + all chat sci-fi animations
const PULSE_STYLE = `
  @keyframes statusPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.55; transform: scale(0.85); }
  }
  @keyframes thinkingPulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 1; }
  }
  @keyframes avatarGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(212,175,55,0.45), 0 0 16px rgba(255,107,53,0.25); }
    50%       { box-shadow: 0 0 14px rgba(212,175,55,0.7), 0 0 28px rgba(255,107,53,0.4), 0 0 40px rgba(212,175,55,0.2); }
  }
  @keyframes msgFadeUp {
    0%   { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes scanLine {
    0%   { top: 0%; opacity: 0.7; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes chipGlow {
    0%, 100% { box-shadow: 0 0 0px rgba(212,175,55,0); }
    50%       { box-shadow: 0 0 10px rgba(212,175,55,0.3), 0 0 20px rgba(212,175,55,0.15); }
  }
  @keyframes sparkleFloat {
    0%   { transform: translateY(0) scale(1); opacity: 0.6; }
    50%  { transform: translateY(-6px) scale(1.2); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 0.6; }
  }
  @keyframes inputPanelGlow {
    0%, 100% { border-color: rgba(56,189,248,0.15); }
    33%       { border-color: rgba(139,92,246,0.2); }
    66%       { border-color: rgba(212,175,55,0.22); }
  }
  /* ── Message reveal animations ─────────────────────────────────── */
  @keyframes bubbleReveal {
    0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes userBubbleIn {
    0%   { opacity: 0; transform: translateY(6px) scale(0.97); box-shadow: 0 0 20px rgba(212,175,55,0.15); }
    60%  { opacity: 1; transform: translateY(0) scale(1.01); box-shadow: 0 0 20px rgba(212,175,55,0.15); }
    100% { opacity: 1; transform: translateY(0) scale(1); box-shadow: none; }
  }
  @keyframes borderPulseOnce {
    0%   { opacity: 1; }
    50%  { opacity: 0.6; }
    100% { opacity: 0; }
  }
  @keyframes streamingShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  /* ── Scroll-to-bottom pulse ─────────────────────────────────────── */
  @keyframes scrollBtnPulse {
    0%   { box-shadow: 0 0 0 0 rgba(212,175,55,0.55), 0 2px 12px rgba(212,175,55,0.45); }
    40%  { box-shadow: 0 0 0 8px rgba(212,175,55,0.0), 0 2px 16px rgba(212,175,55,0.6); }
    100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.0), 0 2px 12px rgba(212,175,55,0.45); }
  }
  /* ── Empty state orb ────────────────────────────────────────────── */
  @keyframes orbFloat {
    0%,  100% { transform: translateY(0px) scale(1); }
    50%        { transform: translateY(-8px) scale(1.03); }
  }
  @keyframes orbGlowPulse {
    0%,  100% { box-shadow: 0 0 40px rgba(212,175,55,0.18), 0 0 80px rgba(212,175,55,0.08); }
    50%        { box-shadow: 0 0 60px rgba(212,175,55,0.28), 0 0 110px rgba(212,175,55,0.14); }
  }
  @keyframes cardBob {
    0%,  100% { transform: translateY(0px); }
    50%        { transform: translateY(-3px); }
  }
`

// ─── Guest signup prompt card ────────────────────────────────────────────────

const SIGNUP_FADE_STYLE = `
  @keyframes signupFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

const GUEST_TOKEN_LIMIT = 100

function SignupPromptCard() {
  const [tokensUsed, setTokensUsed] = useState(0)

  useEffect(() => {
    const stored = Number(localStorage.getItem('fg_guest_tokens') ?? '0')
    setTokensUsed(Math.min(stored, GUEST_TOKEN_LIMIT))
  }, [])

  const pct = Math.round((tokensUsed / GUEST_TOKEN_LIMIT) * 100)

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '8px 0' }}>
      <style>{SIGNUP_FADE_STYLE}</style>
      <div
        style={{
          animation: 'signupFadeIn 0.35s ease-out both',
          padding: '20px 22px',
          borderRadius: 16,
          background: 'linear-gradient(145deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.03) 100%)',
          border: '1px solid rgba(212,175,55,0.35)',
          boxShadow: '0 0 0 1px rgba(212,175,55,0.08) inset, 0 8px 32px rgba(0,0,0,0.35)',
          maxWidth: 380,
          width: '100%',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Token usage line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#D4AF37" strokeWidth="1.4"/>
              <path d="M5 7h4M7 5v4" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#D4AF37', letterSpacing: '-0.01em' }}>
            You used {tokensUsed} free tokens!
          </p>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{
            height: 6, borderRadius: 99,
            background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 99,
              background: 'linear-gradient(90deg, #D4AF37 0%, #C8962A 100%)',
              transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
              {tokensUsed}/{GUEST_TOKEN_LIMIT} tokens
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Free limit</span>
          </div>
        </div>

        {/* Value prop */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
            Sign up free to get{' '}
            <span style={{ color: '#D4AF37', fontWeight: 600 }}>1,000 tokens/month</span>
            {' '}— enough to build entire Roblox worlds.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href="/sign-up"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '9px 16px',
              borderRadius: 9,
              background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
              color: '#050810',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              boxShadow: '0 2px 12px rgba(212,175,55,0.3)',
              transition: 'opacity 0.15s',
            }}
          >
            Sign Up Free
          </a>
          <a
            href="/sign-in"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '9px 16px',
              borderRadius: 9,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 500,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            Sign In
          </a>
        </div>

        {/* No credit card */}
        <p style={{ margin: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          No credit card required
        </p>
      </div>
    </div>
  )
}

// PERF: MessageBubble is wrapped in React.memo at the bottom of its definition.
// Before the memo, typing in the ChatPanel textarea (setInput) caused EVERY
// bubble to re-render on every keystroke. Memoization keeps stable bubbles
// untouched and lets React reconcile only the newly-streaming one.
function MessageBubbleImpl({
  msg,
  userPrompt,
  previousCode,
  onRetry,
  onBuildDifferently,
  onDismiss,
  onEditAndResend,
  onSendToStudio,
  studioConnected,
}: {
  msg: ChatMessage
  userPrompt?: string
  previousCode?: string
  onRetry?: () => void
  onBuildDifferently?: () => void
  onDismiss?: (id: string) => void
  onEditAndResend?: (id: string, newContent: string) => void
  onSendToStudio?: (luauCode: string) => void
  studioConnected?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  // Brief scan animation: start true for already-complete messages, or fires when streaming→complete
  const prevStreamingRef = useRef(msg.streaming)
  const [newFlash, setNewFlash] = useState(() => !msg.streaming)
  useEffect(() => {
    // Streaming just finished → trigger flash
    if (prevStreamingRef.current && !msg.streaming) {
      setNewFlash(true)
    }
    prevStreamingRef.current = msg.streaming
  }, [msg.streaming])
  useEffect(() => {
    if (newFlash) {
      const t = setTimeout(() => setNewFlash(false), 1400)
      return () => clearTimeout(t)
    }
  }, [newFlash])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [msg.content])

  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'
  const isStatus = msg.role === 'status'
  const isUpgrade = msg.role === 'upgrade'
  const isSignup = msg.role === 'signup'
  const isBuildError = msg.role === 'build-error'

  if (isBuildError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '8px 0' }}>
        <div
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 14,
            padding: '16px 20px',
            maxWidth: 460,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <p style={{ color: '#f87171', fontWeight: 700, fontSize: 14, margin: '0 0 8px 0' }}>
            Build failed after 3 attempts
          </p>
          {msg.buildError && (
            <pre
              style={{
                color: 'rgba(255,255,255,0.38)',
                fontSize: 11,
                lineHeight: 1.5,
                margin: '0 0 12px 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: '8px 10px',
                maxHeight: 110,
                overflowY: 'auto',
              }}
            >
              {msg.buildError.slice(0, 600)}
            </pre>
          )}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 14px 0' }}>
            Try describing what you want differently, or start fresh.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={onRetry}
              style={{
                background: 'rgba(212,175,55,0.14)',
                color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.32)',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Try again
            </button>
            <button
              onClick={onBuildDifferently}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Build it differently
            </button>
            <button
              onClick={() => onDismiss?.(msg.id)}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Skip this
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isStatus) {
    const contentLower = msg.content.toLowerCase()
    const isSuccess = contentLower.includes('studio') && !contentLower.includes('thinking') && !contentLower.includes('failed') && !contentLower.includes('connect')
    const isBuildSent = contentLower.includes('check your viewport') || contentLower.includes('sent to roblox studio')
    // Two states that should include an action CTA:
    //   - "Failed to push to Studio" — offer a retry
    //   - "Connect Studio plugin to push" — offer a pair-studio link
    const isStudioNotConnected = contentLower.includes('connect studio plugin')
    const isStudioPushFailed = contentLower.includes('failed to push to studio')
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 10, padding: '4px 0' }}>
        <style>{PULSE_STYLE}</style>
        {/* Avatar dot — use position:relative so particles burst from its center */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isSuccess
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.1) 100%)'
              : 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 100%)',
            border: isSuccess ? '1px solid rgba(74,222,128,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {isSuccess ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5L5 9l4.5-5" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#030712">
              <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
            </svg>
          )}
          {/* Particle burst on "check your viewport" — plays once on mount */}
          {isBuildSent && <BuildSuccessCelebration />}
        </div>

        {isSuccess ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 10px',
              borderRadius: 8,
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.18)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 6px rgba(74,222,128,0.7)',
                animation: 'statusPulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: 'rgba(74,222,128,0.9)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                animation: isBuildSent ? 'goldTextPulse 0.8s ease-out forwards' : undefined,
              }}
            >
              {msg.content}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {msg.content}
            </span>
            {/* Inline CTAs — only shown for the two "Studio didn't receive
                the code" states. Everything else falls through to the
                default typing-dots indicator so normal status messages
                keep their pending look. */}
            {isStudioNotConnected && (
              <a
                href="/connect"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#D4AF37',
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.32)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Pair Studio →
              </a>
            )}
            {isStudioPushFailed && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#D4AF37',
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.32)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Retry push
              </button>
            )}
            {!isStudioNotConnected && !isStudioPushFailed && <TypingDots />}
          </div>
        )}
      </div>
    )
  }

  if (isUpgrade) {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.25)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#D4AF37' }}>
          You&apos;re out of tokens
        </p>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {typeof msg.tokenBalance === 'number' && typeof msg.tokenRequired === 'number'
            ? `This message needs ${msg.tokenRequired.toLocaleString()} tokens — you have ${msg.tokenBalance.toLocaleString()}. Top up or upgrade to continue.`
            : msg.content || 'Your AI token balance is empty. Get more tokens to keep building.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <a
            href="/tokens"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#D4AF37',
              color: '#050810',
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Get Tokens
          </a>
          <a
            href="/billing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            View Plans
          </a>
        </div>
      </div>
    )
  }

  if (isSignup) {
    return <SignupPromptCard />
  }

  if (isSystem) {
    return (
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}
      >
        {msg.content}
      </div>
    )
  }

  if (isUser) {
    // Strip internal prefixes ([AUTO-RETRY attempt N/M], [FORJE_STEP:N/M]) from display
    const displayContent = msg.content
      .replace(/^\[AUTO-RETRY attempt \d+\/\d+\]\s*/, '')
      .replace(/^\[FORJE_STEP:\d+\/\d+\]\s*/, '')

    const handleEditStart = () => {
      setEditValue(displayContent)
      setEditing(true)
      // Focus textarea on next tick after render
      setTimeout(() => {
        editTextareaRef.current?.focus()
        editTextareaRef.current?.select()
      }, 0)
    }

    const handleEditCancel = () => {
      setEditing(false)
      setEditValue('')
    }

    const handleEditSave = () => {
      const trimmed = editValue.trim()
      if (!trimmed || !onEditAndResend) return
      setEditing(false)
      setEditValue('')
      onEditAndResend(msg.id, trimmed)
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleEditSave()
      }
      if (e.key === 'Escape') {
        handleEditCancel()
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'userBubbleIn 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ maxWidth: '80%', position: 'relative' }}>
          {/* Pencil edit button — appears on hover, only when not editing */}
          {!editing && onEditAndResend && (
            <button
              onClick={handleEditStart}
              title="Edit message"
              style={{
                position: 'absolute',
                top: 6,
                right: -30,
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: '1px solid rgba(212,175,55,0.2)',
                background: 'rgba(212,175,55,0.08)',
                color: 'rgba(212,175,55,0.7)',
                cursor: 'pointer',
                padding: 0,
                opacity: hovered ? 1 : 0,
                pointerEvents: hovered ? 'auto' : 'none',
                transition: 'opacity 0.15s, background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.18)'
                e.currentTarget.style.color = '#D4AF37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                e.currentTarget.style.color = 'rgba(212,175,55,0.7)'
              }}
            >
              {/* Pencil icon (inline SVG — no lucide-react import needed) */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}

          {editing ? (
            /* ── Edit mode ────────────────────────────────────────── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'opacity 0.15s',
              }}
            >
              <textarea
                ref={editTextareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={Math.max(2, editValue.split('\n').length)}
                style={{
                  width: '100%',
                  minWidth: 260,
                  padding: '12px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  background: 'rgba(10,10,26,0.85)',
                  border: '1.5px solid #D4AF37',
                  color: 'var(--text-primary, rgba(255,255,255,0.9))',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  boxShadow: '0 0 16px rgba(212,175,55,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 12,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={!editValue.trim()}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: editValue.trim() ? '#D4AF37' : 'rgba(212,175,55,0.3)',
                    color: editValue.trim() ? '#030712' : 'rgba(3,7,18,0.5)',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    cursor: editValue.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  Save &amp; Resend
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal display mode ──────────────────────────────── */
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '18px 18px 4px 18px',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary, rgba(255,255,255,0.9))', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {displayContent}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        animation: 'msgFadeUp 0.3s ease-out forwards',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar with pulsing glow */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="#030712">
          <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
        </svg>
      </div>
      <div
        style={{
          maxWidth: '85%',
          padding: '14px 18px',
          borderRadius: '18px 18px 18px 4px',
          background: msg.streaming
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.025)',
          border: newFlash
            ? '1px solid rgba(212,175,55,0.35)'
            : msg.streaming
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'bubbleReveal 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          transition: 'border-color 0.4s ease-out, background 0.3s ease-out',
          boxShadow: newFlash
            ? '0 0 24px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Streaming shimmer overlay — only visible while streaming */}
        {msg.streaming && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(105deg, transparent 20%, rgba(212,175,55,0.03) 50%, transparent 80%)',
              backgroundSize: '200% 100%',
              animation: 'streamingShimmer 2s linear infinite',
              pointerEvents: 'none',
              borderRadius: 'inherit',
            }}
          />
        )}
        {/* Border flash overlay — fires once when streaming completes */}
        {newFlash && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 'inherit',
              border: '1px solid rgba(212,175,55,0.4)',
              animation: 'borderPulseOnce 1.2s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
          {msg.streaming
            ? <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stripCodeBlocksForDisplay(msg.content)}</span>
            : <RenderMessageContent content={msg.content} onSendToStudio={onSendToStudio} studioConnected={studioConnected} />
          }
        </div>
        {!msg.streaming && msg.meshResult && (
          <MeshResultCard mesh={msg.meshResult} onSendToStudio={onSendToStudio} />
        )}
        {/*
          Manual build fallback: when Studio isn't connected and the AI
          generated code, show the copy/paste + .rbxmx download safety net.
          This is the non-negotiable path that ensures every user can use
          ForjeGames regardless of plugin status.
        */}
        {!msg.streaming && !studioConnected && msg.luauCode && msg.role === 'assistant' && (
          <ManualBuildPanel luauCode={msg.luauCode} prompt={userPrompt} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {msg.hasCode && (
            <CodePreviewBadge luauCode={msg.luauCode} previousCode={previousCode} executedInStudio={msg.executedInStudio} />
          )}
          {/*
            Replay-to-Studio button — appears on any assistant message that
            has luauCode stored AND Studio is connected. This is the escape
            hatch for users who typed build prompts before connecting their
            plugin — once they connect, they can click this to send the old
            code to Studio without re-running the AI (saves tokens, keeps
            iteration tight). Hidden while streaming, and hidden entirely
            when Studio isn't connected (ManualBuildPanel handles that
            case with copy + download options).
          */}
          {msg.hasCode && !msg.streaming && studioConnected && msg.luauCode && msg.role === 'assistant' && (
            <button
              onClick={() => {
                if (msg.luauCode && onSendToStudio) {
                  onSendToStudio(msg.luauCode)
                }
              }}
              title="Send this code to Studio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 5,
                border: '1px solid rgba(212,175,55,0.25)',
                background: 'rgba(212,175,55,0.08)',
                color: '#D4AF37',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.15)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Send to Studio
            </button>
          )}
          {msg.hasCode && !msg.streaming && (
            <ShareBuildButton prompt={userPrompt} />
          )}
          {msg.tokensUsed !== undefined && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
              {msg.tokensUsed.toLocaleString()} tokens
            </span>
          )}
          {/* Copy button — appears on hover, hidden while streaming */}
          {!msg.streaming && (
            <button
              onClick={handleCopy}
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 5,
                border: '1px solid rgba(255,255,255,0.07)',
                background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                color: copied ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.3)',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: hovered ? 1 : 0,
                pointerEvents: hovered ? 'auto' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }
              }}
            >
              {copied ? (
                <>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M1 6V1h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoized wrapper: re-renders only when msg identity/content or the
// callback refs change. The parent passes stable callbacks from useChat
// (all wrapped in useCallback) so this delivers a real win.
const MessageBubble = React.memo(MessageBubbleImpl)

// ─── Mesh Result Card ────────────────────────────────────────────────────────

function MeshResultCard({
  mesh,
  onSendToStudio,
}: {
  mesh: MeshResult
  onSendToStudio?: (luauCode: string) => void
}) {
  const [luauCopied, setLuauCopied] = useState(false)

  const handleCopyLuau = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!mesh.luauCode) return
    await navigator.clipboard.writeText(mesh.luauCode).catch(() => {})
    setLuauCopied(true)
    setTimeout(() => setLuauCopied(false), 1500)
  }

  const handleSendToStudio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mesh.luauCode && onSendToStudio) onSendToStudio(mesh.luauCode)
  }

  const isDemo = mesh.status === 'demo'
  const isPending = mesh.status === 'pending'
  const isComplete = mesh.status === 'complete'

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 10,
        border: '1px solid rgba(212,175,55,0.2)',
        background: 'rgba(212,175,55,0.04)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Preview row — 3D when GLB is available, thumbnail fallback otherwise */}
      {(mesh.glbUrl || mesh.thumbnailUrl) && (
        <div style={{ padding: '10px 12px 0' }}>
          <div
            style={{
              width: '100%',
              height: 150,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#080B16',
            }}
          >
            {mesh.glbUrl ? (
              <ModelPreview
                glbUrl={mesh.glbUrl}
                thumbnailUrl={mesh.thumbnailUrl}
                width="100%"
                height={150}
                autoRotate
                showToggle
                expandable
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mesh.thumbnailUrl!}
                alt="3D mesh preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, padding: '10px 12px', alignItems: 'flex-start' }}>
        <div style={{ width: 0, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L9 3.5V6.5L5 9L1 6.5V3.5L5 1Z" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(212,175,55,0.9)' }}>
              {isComplete ? '3D Mesh Ready' : isPending ? 'Generating…' : 'Demo Preview'}
            </span>
            {isDemo && (
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                DEMO
              </span>
            )}
          </div>
          {mesh.polygonCount !== null && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
              {mesh.polygonCount.toLocaleString()} polygons
            </div>
          )}
          {isPending && mesh.taskId && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              Task: {mesh.taskId.slice(0, 16)}…
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isComplete && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            flexWrap: 'wrap',
          }}
        >
          {/* Download GLB */}
          {mesh.glbUrl && (
            <a
              href={mesh.glbUrl}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 5,
                background: 'rgba(212,175,55,0.12)',
                color: 'rgba(212,175,55,0.85)',
                border: '1px solid rgba(212,175,55,0.25)',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1v5M2 5l2.5 2.5L7 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 8h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Download GLB
            </a>
          )}

          {/* Download FBX (fallback if no GLB) */}
          {!mesh.glbUrl && mesh.fbxUrl && (
            <a
              href={mesh.fbxUrl}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 5,
                background: 'rgba(212,175,55,0.12)',
                color: 'rgba(212,175,55,0.85)',
                border: '1px solid rgba(212,175,55,0.25)',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1v5M2 5l2.5 2.5L7 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 8h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Download FBX
            </a>
          )}

          {/* Copy Luau */}
          {mesh.luauCode && (
            <button
              onClick={handleCopyLuau}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 5,
                background: luauCopied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                color: luauCopied ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.5)',
                border: luauCopied ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {luauCopied ? (
                <>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                    <path d="M1 6V1h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy Luau
                </>
              )}
            </button>
          )}

          {/* Send to Studio */}
          {mesh.luauCode && onSendToStudio && (
            <button
              onClick={handleSendToStudio}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 5,
                background: 'rgba(99,102,241,0.12)',
                color: 'rgba(165,180,252,0.85)',
                border: '1px solid rgba(99,102,241,0.25)',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 4.5h6M5 2l2.5 2.5L5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send to Studio
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Share Build Button ──────────────────────────────────────────────────────

function ShareBuildButton({ prompt }: { prompt?: string }) {
  const [shared, setShared] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const description = prompt
      ? prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '')
      : 'Roblox game'
    const text = `I just forjed a ${description} with @ForjeGames! Try it free: forjegames.com`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setShared(true)
    setTimeout(() => setShared(false), 3000)
  }

  return (
    <button
      onClick={handleShare}
      title="Copy shareable text to clipboard"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        padding: '2px 7px',
        borderRadius: 4,
        background: shared ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)',
        color: shared ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.6)',
        border: `1px solid ${shared ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.15)'}`,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!shared) {
          e.currentTarget.style.background = 'rgba(212,175,55,0.15)'
          e.currentTarget.style.color = 'rgba(212,175,55,0.9)'
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!shared) {
          e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
          e.currentTarget.style.color = 'rgba(212,175,55,0.6)'
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
        }
      }}
    >
      {shared ? (
        <>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied! Share on X/Discord
        </>
      ) : (
        <>
          {/* Share2 icon */}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share this build
        </>
      )}
    </button>
  )
}

// ─── Code Preview Badge ──────────────────────────────────────────────────────

function CodePreviewBadge({ luauCode, previousCode, executedInStudio }: { luauCode?: string; previousCode?: string; executedInStudio?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const diffLines = previousCode && luauCode ? computeLineDiff(previousCode, luauCode) : null
  const diffAvailable = diffLines !== null && hasDiff(diffLines)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!luauCode) return
    await navigator.clipboard.writeText(luauCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ width: '100%' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 4,
          background: executedInStudio ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
          color: executedInStudio ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, sans-serif',
          border: 'none',
          cursor: luauCode ? 'pointer' : 'default',
          transition: 'all 0.15s',
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transformOrigin: 'center', transition: 'transform 0.15s' }}
          />
        </svg>
        {executedInStudio ? 'Built in Studio' : 'View code'}
      </button>

      {expanded && luauCode && (
        <div
          style={{
            marginTop: 8,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            animation: 'codeExpand 0.2s ease-out',
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
                Luau
              </span>
              {diffAvailable && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDiff((v) => !v) }}
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: showDiff
                      ? '1px solid rgba(212,175,55,0.4)'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: showDiff
                      ? 'rgba(212,175,55,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    color: showDiff
                      ? 'rgba(212,175,55,0.9)'
                      : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {showDiff ? 'Show code' : 'Show changes'}
                </button>
              )}
            </div>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 10,
                color: copied ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.3)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {/* Diff view */}
          {showDiff && diffLines && (
            <pre
              style={{
                margin: 0,
                padding: '8px 0',
                fontSize: 11,
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                overflowX: 'auto',
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
            >
              {diffLines.map((line, i) => {
                const bg =
                  line.type === 'added'
                    ? 'rgba(74,222,128,0.08)'
                    : line.type === 'removed'
                      ? 'rgba(239,68,68,0.08)'
                      : 'transparent'
                const color =
                  line.type === 'added'
                    ? 'rgba(74,222,128,0.85)'
                    : line.type === 'removed'
                      ? 'rgba(248,113,113,0.85)'
                      : 'rgba(255,255,255,0.35)'
                const prefix =
                  line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
                return (
                  <div
                    key={i}
                    style={{
                      display: 'block',
                      padding: '0 10px',
                      background: bg,
                      color,
                      borderLeft: line.type === 'added'
                        ? '2px solid rgba(74,222,128,0.4)'
                        : line.type === 'removed'
                          ? '2px solid rgba(239,68,68,0.4)'
                          : '2px solid transparent',
                    }}
                  >
                    <span style={{ opacity: 0.5, userSelect: 'none', marginRight: 8 }}>{prefix}</span>
                    {line.content}
                  </div>
                )
              })}
            </pre>
          )}
          {/* Code (normal view) */}
          {!showDiff && (
            <pre
              style={{
                margin: 0,
                padding: '8px 10px',
                fontSize: 11,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                overflowX: 'auto',
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
            >
              {luauCode.slice(0, 2000)}
              {luauCode.length > 2000 && '\n... (truncated)'}
            </pre>
          )}
        </div>
      )}
      <style>{`
        @keyframes codeExpand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 300px; }
        }
      `}</style>
    </div>
  )
}

// ─── Showcase card ─────────────────────────────────────────────────────────────

interface ShowcaseExample {
  readonly emoji: string
  readonly label: string
  readonly desc: string
  readonly prompt: string
  readonly color: string
  readonly bg: string
  readonly border: string
}

function ShowcaseCard({
  example,
  delay,
  onSelect,
}: {
  example: ShowcaseExample
  delay: number
  onSelect: (prompt: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), delay + 120)
    return () => clearTimeout(t)
  }, [delay])

  // Staggered bob delay so cards feel alive independently
  const bobDelay = (delay / 40) * 0.35

  return (
    <button
      onClick={() => onSelect(example.prompt)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        padding: '10px 12px',
        borderRadius: 12,
        border: `1px solid ${hovered ? example.color : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? example.bg : 'rgba(255,255,255,0.025)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease-out',
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible
          ? hovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)'
          : 'translateY(10px) scale(1)',
        boxShadow: hovered
          ? `0 4px 16px ${example.bg}, 0 0 0 1px ${example.color}22, 0 0 18px ${example.color}33`
          : 'none',
        minWidth: 140,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        animation: cardVisible && !hovered ? `cardBob 4.5s ease-in-out ${bobDelay}s infinite` : undefined,
      }}
    >
      {/* "Try it" label — fades in on hover */}
      <div
        style={{
          position: 'absolute',
          top: 7,
          right: 8,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: example.color,
          fontFamily: 'Inter, sans-serif',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.18s ease-out',
          pointerEvents: 'none',
          textTransform: 'uppercase',
        }}
      >
        Try it
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: hovered ? example.bg : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? example.color : 'rgba(255,255,255,0.06)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.18s',
          flexShrink: 0,
        }}
      >
        {example.emoji}
      </div>
      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: hovered ? '#fafafa' : '#a1a1aa',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.3,
          transition: 'color 0.18s',
        }}>
          {example.label}
        </div>
        <div style={{
          fontSize: 11,
          color: '#3f3f46',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.4,
          marginTop: 2,
        }}>
          {example.desc}
        </div>
      </div>
    </button>
  )
}

// ─── Empty state / showcase ────────────────────────────────────────────────────

function EmptyState({ onQuickAction, onBuildGame }: { onQuickAction: (prompt: string) => void; onBuildGame?: (prompt: string) => void }) {
  // Cycle the rotating word in the heading every 2.4s — matches the marketing
  // site's hero. We re-key the rotating span on every change so the CSS
  // @keyframe `forge-word-roll-in` (defined in globals.css) re-fires.
  const [rotIndex, setRotIndex] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setRotIndex(i => (i + 1) % EDITOR_ROTATING_WORDS.length), 2400)
    return () => clearInterval(t)
  }, [])
  const currentWord = EDITOR_ROTATING_WORDS[rotIndex]
  const longestWord = EDITOR_ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 24,
        padding: '0 20px 28px',
        animation: 'msgFadeUp 0.4s ease-out forwards',
      }}
    >
      {/* Animated forge icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 60%, transparent 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 32px rgba(212,175,55,0.18), inset 0 0 16px rgba(212,175,55,0.06)',
          marginBottom: -4,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v3M12 19v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>

      {/* Heading — matches marketing site rotating "Forge your X" pattern */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 700,
            color: '#fafafa',
            letterSpacing: '-0.02em',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '0.3em',
            flexWrap: 'wrap',
            justifyContent: 'center',
            // 3D context for the rotating word's wheel transform
            perspective: '600px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          <span>Forge your</span>
          <span
            aria-live="polite"
            style={{
              position: 'relative',
              display: 'inline-block',
              minWidth: `${longestWord.length}ch`,
              height: '1.15em',
              verticalAlign: 'baseline',
              transformStyle: 'preserve-3d',
            }}
          >
            <span aria-hidden="true" style={{ visibility: 'hidden', display: 'inline-block' }}>
              {longestWord}
            </span>
            <span
              key={`leaving-${rotIndex}`}
              aria-hidden="true"
              className="forge-word forge-word-leaving"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transformOrigin: '50% 50% -0.55em',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              {EDITOR_ROTATING_WORDS[(rotIndex - 1 + EDITOR_ROTATING_WORDS.length) % EDITOR_ROTATING_WORDS.length]}
            </span>
            <span
              key={`active-${rotIndex}`}
              className="forge-word forge-word-entering"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transformOrigin: '50% 50% -0.55em',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              {currentWord}
            </span>
          </span>
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          Describe anything — or pick a starting point below
        </p>
      </div>

      {/* ── Build a Full Game section ────────────────────────────────── */}
      {onBuildGame && (
        <div style={{ width: '100%', maxWidth: 560 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: '#D4AF37',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Build a Full Game
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 16,
          }}>
            {FULL_GAME_CARDS.map((g) => (
              <button
                key={g.id}
                onClick={() => onBuildGame(g.prompt)}
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: '1px solid rgba(212,175,55,0.2)',
                  background: 'rgba(212,175,55,0.04)',
                  color: '#D4AF37',
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: 22 }}>{g.emoji}</span>
                <span>{g.label}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 400, lineHeight: 1.3, textAlign: 'center' as const }}>
                  {g.tagline}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Simulator + Tycoon variant grids ─────────────────────────── */}
      {onBuildGame && (
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Simulators column */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(139,92,246,0.8)', marginBottom: 6, textAlign: 'center' }}>
                Simulators
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                {SIM_CARDS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onBuildGame(g.prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.04)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)' }}
                  >
                    <span style={{ fontSize: 16 }}>{g.emoji}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tycoons column */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(34,197,94,0.8)', marginBottom: 6, textAlign: 'center' }}>
                Tycoons
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                {TYC_CARDS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onBuildGame(g.prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8,
                      border: '1px solid rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.04)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.15)' }}
                  >
                    <span style={{ fontSize: 16 }}>{g.emoji}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick build cards ─────────────────────────────────────────── */}
      <p style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.25)',
        marginBottom: 6,
        textAlign: 'center',
      }}>
        or try a quick build
      </p>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 560,
          width: '100%',
        }}
      >
        {SHOWCASE_EXAMPLES.slice(0, 4).map((ex) => (
          <button
            key={ex.label}
            onClick={() => onQuickAction(ex.prompt)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 12,
              border: `1px solid ${ex.border}`,
              background: ex.bg,
              color: ex.color,
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{ex.emoji}</span>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Tip of the day ────────────────────────────────────────────────────────────

export function TipOfTheDay() {
  const [tip, setTip] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_TIP_DISMISSED) === 'true') return
      const raw = localStorage.getItem(LS_TIP_KEY)
      const count = raw ? parseInt(raw, 10) : 0
      if (count >= MAX_TIP_SESSIONS) return
      localStorage.setItem(LS_TIP_KEY, String(count + 1))
      const idx = count % TIPS.length
      setTip(TIPS[idx])
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    } catch {
      // ignore
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      try { localStorage.setItem(LS_TIP_DISMISSED, 'true') } catch { /* ignore */ }
      setDismissed(true)
    }, 250)
  }, [])

  if (!tip || dismissed) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 8,
        background: 'rgba(212,175,55,0.05)',
        border: '1px solid rgba(212,175,55,0.12)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        marginBottom: 1,
      }}
    >
      {/* Gold lightbulb icon */}
      <svg width="11" height="11" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 1a4 4 0 0 1 2.5 7.1V10H3.5V8.1A4 4 0 0 1 6 1z" fill="#D4AF37" opacity="0.85"/>
        <path d="M4 11.5h4M4.5 13h3" stroke="#D4AF37" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
      </svg>
      <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
        <span style={{ color: 'rgba(212,175,55,0.75)', fontWeight: 600, marginRight: 4 }}>Tip:</span>
        {tip}
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss tip"
        style={{
          flexShrink: 0,
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)',
          padding: 0,
          borderRadius: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Speech recognition hook ──────────────────────────────────────────────────

type SRCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  start(): void
  stop(): void
}

function useSpeech(onResult: (text: string) => void) {
  const recRef = useRef<InstanceType<SRCtor> | null>(null)
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  )

  const toggle = useCallback(() => {
    if (!supported) return
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    const win = window as typeof window & {
      webkitSpeechRecognition?: SRCtor
      SpeechRecognition?: SRCtor
    }
    const SR = win.webkitSpeechRecognition ?? win.SpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript
      if (t?.trim()) onResult(t.trim())
    }
    recRef.current = rec
    rec.start()
  }, [supported, listening, onResult])

  return { listening, supported, toggle }
}

// ─── Model selector dropdown ──────────────────────────────────────────────────
// User-facing AI model picker. Shows Auto (default), Claude Sonnet 4, GPT-4o,
// Gemini Flash (free), and Groq Llama (free). Premium models show a lock icon
// for free-tier users. Selection is persisted in localStorage as forje_preferred_model.

function ModelSelector({
  selected,
  onChange,
}: {
  selected: ModelId
  onChange: (id: ModelId) => void
}) {
  const [open, setOpen] = useState(false)
  const current = MODELS.find((m) => m.id === selected) ?? MODELS[0]

  // Provider icon SVGs (inline, tiny)
  const providerIcon = (modelId: string) => {
    switch (modelId) {
      case 'auto':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )
      case 'claude-sonnet-4':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" fill="currentColor" opacity="0.8"/>
          </svg>
        )
      case 'gpt-4o':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      case 'gemini-flash':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.8"/>
          </svg>
        )
      case 'groq-llama':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" opacity="0.8"/>
          </svg>
        )
      default:
        return <div style={{ width: 14, height: 14 }} />
    }
  }

  const badgeStyle = (model: (typeof MODELS)[number]): React.CSSProperties => {
    if (model.free) {
      return {
        padding: '1px 6px',
        borderRadius: 4,
        background: 'rgba(34,197,94,0.15)',
        color: '#4ade80',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }
    }
    if (model.premium) {
      return {
        padding: '1px 6px',
        borderRadius: 4,
        background: 'rgba(212,175,55,0.15)',
        color: '#D4AF37',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }
    }
    return {
      padding: '1px 6px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.5)',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.04em',
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, flexShrink: 0 }} />
        {current.label}
        {current.badge && (
          <span style={badgeStyle(current)}>
            {current.badge}
          </span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: 0,
              zIndex: 50,
              background: '#0a0a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 6,
              minWidth: 260,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '6px 10px 8px',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              AI Model
            </div>

            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => { onChange(model.id); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: selected === model.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: selected === model.id ? 'white' : 'rgba(255,255,255,0.55)',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s',
                }}
              >
                {/* Provider icon */}
                <div style={{ color: model.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {providerIcon(model.id)}
                </div>

                {/* Label + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: selected === model.id ? 600 : 400 }}>{model.label}</span>
                    {selected === model.id && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 5" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {model.description && (
                    <div style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.3)',
                      marginTop: 1,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {model.description}
                    </div>
                  )}
                </div>

                {/* Badge */}
                {model.badge && (
                  <span style={badgeStyle(model)}>
                    {model.premium ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                          <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M4.5 5V3.5a1.5 1.5 0 013 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {model.badge}
                      </span>
                    ) : model.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Footer hint */}
            <div style={{
              padding: '8px 10px 4px',
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              fontFamily: 'Inter, sans-serif',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              marginTop: 4,
            }}>
              Free models have rate limits. Premium models use your token balance.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── MCP Quick-Action Bar ─────────────────────────────────────────────────────

const MCP_QUICK_ACTIONS = [
  {
    id: 'gen-3d',
    label: 'Generate 3D Model',
    prompt: 'Generate a 3D model of ',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.22)',
  },
  {
    id: 'create-terrain',
    label: 'Create Terrain',
    prompt: 'Create terrain with ',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
      </svg>
    ),
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.22)',
  },
  {
    id: 'plan-city',
    label: 'Plan City',
    prompt: 'Plan a city district with ',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <path d="M3 9l9-7 9 7"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
  },
] as const

const MCP_QUICK_ACTION_STYLES = `
  @keyframes mcpQaFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

function McpQuickActions({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <>
      <style>{MCP_QUICK_ACTION_STYLES}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexWrap: 'wrap',
          padding: '6px 0 2px',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
            fontFamily: 'Inter, sans-serif',
            marginRight: 2,
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          Quick
        </span>
        {MCP_QUICK_ACTIONS.map((action, i) => (
          <button
            key={action.id}
            onClick={() => onAction(action.prompt)}
            title={`Start: "${action.prompt}..."`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 7,
              background: action.bg,
              border: `1px solid ${action.border}`,
              color: action.color,
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease-out',
              animation: `mcpQaFadeIn 0.22s ease-out ${i * 0.05}s both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.82'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${action.bg}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Active MCP tool indicator (shown while AI uses a tool mid-stream) ────────

function McpToolIndicator({ toolName }: { toolName: string }) {
  const label = toolName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 6,
        background: 'rgba(212,175,55,0.07)',
        border: '1px solid rgba(212,175,55,0.22)',
        marginTop: 5,
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 13 13"
        fill="none"
        style={{ animation: 'mcpSpin 0.9s linear infinite', flexShrink: 0 }}
      >
        <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(212,175,55,0.2)" strokeWidth="1.5"/>
        <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span
        style={{
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          color: 'rgba(212,175,55,0.8)',
          fontWeight: 500,
        }}
      >
        Using {label}...
      </span>
      <style>{`@keyframes mcpSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages: ChatMessage[]
  input: string
  setInput: (v: string) => void
  loading: boolean
  onSend: (text: string) => void
  selectedModel: ModelId
  setSelectedModel: (id: ModelId) => void
  totalTokens: number
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  suggestions?: string[]
  /** Called when user clicks "Try again" on a build-error card */
  onRetry?: () => void
  /** Called when user clicks "Build it differently" — clears context */
  onBuildDifferently?: () => void
  /** Called when user clicks "Skip this" — dismisses the error by message id */
  onDismiss?: (id: string) => void
  /** When true, shows only the input bar (viewport expanded mode) */
  compact?: boolean
  /** Active MCP tool name being used by the AI right now (shown as inline indicator) */
  activeMcpTool?: string | null
  /** MCP result card data to render inline in the chat feed */
  mcpToolResult?: McpToolResult | null
  /** Called when the user edits a user message and re-sends it */
  onEditAndResend?: (id: string, newContent: string) => void
  /** Called when user clicks "Send to Studio" on a mesh result card */
  onSendToStudio?: (luauCode: string) => void
  /** Whether Roblox Studio is currently connected — enables "Run in Studio" on code blocks */
  studioConnected?: boolean
  /** Epoch-ms timestamp from useChat.savedAt — bumped each time messages are persisted. Drives the "Saved" flash. */
  savedAt?: number
  /** Currently attached image file (for Image-to-Map / vision) */
  imageFile?: File | null
  /** Called when user attaches or removes an image */
  onImageFile?: (file: File | null) => void
  /** Active AI mode (build, think, plan, image, script, etc.) */
  aiMode?: AIMode
  /** Called when user switches AI mode */
  onAIModeChange?: (mode: AIMode) => void
  /** Text from AI reasoning/thinking step — shown during Think/Debug modes */
  thinkingText?: string
  /** Whether AI is currently in the thinking/reasoning phase */
  isThinking?: boolean
  /** Plan text returned by Plan mode — shown for user approval before building */
  planText?: string | null
  /** Called when user approves the plan */
  onApprovePlan?: () => void
  /** Called when user wants to edit the plan */
  onEditPlan?: () => void
  /** Called when user cancels the plan */
  onCancelPlan?: () => void
  /** Auto-playtest state */
  autoPlaytestEnabled?: boolean
  onAutoPlaytestToggle?: (enabled: boolean) => void
  playtestState?: { running: boolean; currentStep: string; iteration: number; result: 'idle' | 'running' | 'passed' | 'failed'; steps: Array<{ action: string; details: string; timestamp: number }> }
  onCancelPlaytest?: () => void
  /** Auto-enhance toggle */
  autoEnhanceEnabled?: boolean
  onAutoEnhanceToggle?: (enabled: boolean) => void
  /** Current session ID for checkpoints */
  sessionId?: string
  /** Called when user restores to a checkpoint — truncates messages to this index */
  onRestoreCheckpoint?: (messageIndex: number) => void
  /** Checkpoint data and handlers */
  checkpoints?: import('@/lib/checkpoints').Checkpoint[]
  onSaveCheckpoint?: (label?: string) => void
  onRestoreToCheckpoint?: (checkpointId: string) => void
  onDeleteCheckpoint?: (checkpointId: string) => void
  /**
   * Image mode options (BUG 9). When present, these drive the style preset
   * selector and background-removal / upscale toggles shown under the mode
   * pill when `aiMode === 'image'`. Plumbed through from useChat.
   */
  imageOptions?: { style: string; removeBackground: boolean; upscale: boolean }
  onImageOptionsChange?: (opts: { style: string; removeBackground: boolean; upscale: boolean }) => void
  /**
   * BUG 2: Build direction — lets the user choose whether the next prompt
   * continues the current build, pivots direction, or starts fresh.
   */
  buildDirection?: 'continue' | 'pivot' | 'start-over'
  onBuildDirectionChange?: (dir: 'continue' | 'pivot' | 'start-over') => void
  /** Step-by-step game builder — triggers /api/ai/build-game with a full preset */
  onBuildGame?: (prompt: string) => void
}

export function ChatPanel({
  messages,
  input,
  setInput,
  loading,
  onSend,
  selectedModel,
  setSelectedModel,
  totalTokens,
  textareaRef: externalRef,
  suggestions = [],
  onRetry,
  onBuildDifferently,
  onDismiss,
  compact = false,
  activeMcpTool = null,
  mcpToolResult = null,
  onEditAndResend,
  onSendToStudio,
  studioConnected = false,
  savedAt = 0,
  imageFile = null,
  onImageFile,
  aiMode = 'build',
  onAIModeChange,
  thinkingText,
  isThinking = false,
  planText = null,
  onApprovePlan,
  onEditPlan,
  autoPlaytestEnabled = false,
  onAutoPlaytestToggle,
  playtestState,
  onCancelPlaytest,
  autoEnhanceEnabled = true,
  onAutoEnhanceToggle,
  onCancelPlan,
  sessionId,
  onRestoreCheckpoint,
  checkpoints = [],
  onSaveCheckpoint,
  onRestoreToCheckpoint,
  onDeleteCheckpoint,
  imageOptions,
  onImageOptionsChange,
  buildDirection = 'continue',
  onBuildDirectionChange,
  onBuildGame,
  /** When true, hides mode tabs, checkpoints, enhance, build direction —
   *  used by SimplifiedEditor for a clean chat-first experience. */
  simplified = false,
}: ChatPanelProps & { simplified?: boolean }) {
  const isMobile = useIsMobile()
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const taRef = externalRef ?? internalRef
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // On mobile the textarea is allowed to grow up to 40% of viewport height;
  // on desktop it caps at 120px. `textareaMaxHeight` is read in both the
  // initial style and the onInput auto-grow handler.
  const [textareaMaxHeight, setTextareaMaxHeight] = useState<number>(120)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const compute = () => {
      setTextareaMaxHeight(isMobile ? Math.round(window.innerHeight * 0.4) : 120)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [isMobile])
  // AI Mode config for current mode
  const modeConfig = getModeConfig(aiMode)
  // Creativity slider for Idea mode
  const [creativity, setCreativity] = useState(50)
  // Style references for Image mode
  const [styleRefs, setStyleRefs] = useState<File[]>([])
  // Style preset for Image mode (12 presets)
  const [stylePreset, setStylePreset] = useState<string | null>(null)
  // Model selector visibility — hidden behind gear by default, shown after first message
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  // Extra input controls (image + voice) — hidden until user has messages or expands
  const [inputExtrasOpen, setInputExtrasOpen] = useState(false)
  // Scroll-to-bottom button visibility + unread badge
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const isScrolledUpRef = useRef(false)
  // "Saved" flash indicator — visible briefly after each persistence write
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (savedAt === 0) return
    setShowSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 1200)
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [savedAt])

  // Voice: auto-submit transcript directly as a message (same UX as VoiceInputButton)
  const handleVoiceSubmit = useCallback((text: string) => {
    if (text.trim()) onSend(text.trim())
  }, [onSend])

  // Image preview URL for the attached file
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return }
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  // BUG 8: track both a "scrolled up" state (for the FAB visibility) and an
  // "is near bottom" state (for auto-scroll decisions). Near-bottom threshold
  // is tighter (~100px) so we only snap the user down when they're already at
  // the tail of the conversation. If they've deliberately scrolled up to read
  // history we leave them alone — previously ANY message update (including
  // mid-stream content appends) would scrollIntoView() and fight the user.
  const isNearBottomRef = useRef(true)
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const scrolledUp = distFromBottom > 200
    const nearBottom = distFromBottom < 100
    setShowScrollBtn(scrolledUp)
    isScrolledUpRef.current = scrolledUp
    isNearBottomRef.current = nearBottom
    // Reset unread count when user scrolls back to bottom
    if (!scrolledUp) setUnreadCount(0)
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const start = el.scrollTop
    const end = el.scrollHeight - el.clientHeight
    const distance = end - start
    if (distance <= 0) return
    const duration = Math.min(400, Math.max(180, distance * 0.4))
    let startTime: number | null = null
    // Cubic-bezier ease-out approximation via requestAnimationFrame
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      el.scrollTop = start + distance * easeOutCubic(progress)
      if (progress < 1) requestAnimationFrame(step)
      else setUnreadCount(0)
    }
    requestAnimationFrame(step)
  }, [])

  // BUG 8: only auto-scroll when a NEW message is appended (message count
  // changes) AND the user is near the bottom. Mid-stream content edits (which
  // mutate the last assistant message in place) must NOT yank the user back
  // to the bottom if they've scrolled up to read history.
  const prevMessageCountRef = useRef(messages.length)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current
    const nextCount = messages.length
    prevMessageCountRef.current = nextCount

    // Only react to NEW messages, not in-place content edits
    if (nextCount <= prevCount) return

    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // User is scrolled up — show badge + pulse instead of yanking them back
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      setUnreadCount((n) => n + 1)
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 900)
    }
  }, [messages])

  // PERF: Build MessageBubble elements in a single forward pass so we can O(1)
  // look up each message's nearest preceding user message and the most recent
  // prior assistant luau code. This replaces an O(n²) per-render scan that
  // allocated fresh arrays for every message on every keystroke (setInput
  // triggers a full ChatPanel render).
  //
  // Only depends on `messages` + the stable callbacks — so typing in the
  // textarea no longer forces the entire bubble list to be recomputed.
  const renderedMessages = useMemo(() => {
    let lastUserContent: string | undefined = undefined
    let lastAssistantLuau: string | undefined = undefined
    const out: React.ReactNode[] = []
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      const precedingUser = lastUserContent
      const precedingCode =
        msg.role === 'assistant' && msg.hasCode ? lastAssistantLuau : undefined
      out.push(
        <MessageBubble
          key={msg.id}
          msg={msg}
          userPrompt={precedingUser}
          previousCode={precedingCode}
          onRetry={onRetry}
          onBuildDifferently={onBuildDifferently}
          onDismiss={onDismiss}
          onEditAndResend={onEditAndResend}
          onSendToStudio={onSendToStudio}
          studioConnected={studioConnected}
        />,
      )
      // Advance trailing state AFTER rendering so the current message sees
      // strictly-prior history (matches original semantics of slice(0, idx)).
      if (msg.role === 'user') lastUserContent = msg.content
      if (msg.role === 'assistant' && msg.luauCode) lastAssistantLuau = msg.luauCode
    }
    return out
  }, [
    messages,
    onRetry,
    onBuildDifferently,
    onDismiss,
    onEditAndResend,
    onSendToStudio,
    studioConnected,
  ])

  // Once messages appear, keep extras accessible
  const hasMessages = messages.length > 0
  useEffect(() => {
    if (hasMessages) setInputExtrasOpen(true)
  }, [hasMessages])

  const [sendPressed, setSendPressed] = useState(false)

  // Clipboard image paste — Ctrl+V with an image on clipboard
  const [pastedImagePreview, setPastedImagePreview] = useState<string | null>(null)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file && onImageFile) {
          onImageFile(file)
          // Show a brief preview flash
          const url = URL.createObjectURL(file)
          setPastedImagePreview(url)
          setTimeout(() => {
            setPastedImagePreview(null)
            URL.revokeObjectURL(url)
          }, 3000)
        }
        return
      }
    }
  }, [onImageFile])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey
    // Ctrl/Cmd+Enter — send message (alternative to plain Enter)
    if (mod && e.key === 'Enter') {
      e.preventDefault()
      onSend(input)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSend(input)
    }
  }

  const handleSend = () => {
    setSendPressed(true)
    setTimeout(() => setSendPressed(false), 150)
    onSend(input)
  }

  const MAX_INPUT = 4000
  const showCharCount = input.length > 0
  const charCountWarning = input.length > MAX_INPUT * 0.85
  const showSlashHint = input === '/'

  // In simplified mode, skip GlassPanel (its overflow:hidden + blur fights
  // the flex scroll chain). Use a plain div that participates in flex layout.
  const Wrapper = simplified ? 'div' : GlassPanel
  const wrapperProps = simplified
    ? { style: { flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' as const, position: 'relative' as const } }
    : { padding: 'none' as const, style: { flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' as const, position: 'relative' as const } }

  return (
    <Wrapper {...wrapperProps}>
      {/* MCP Toolbar — always visible at the top */}
      {/* McpToolbar hidden — keep UI clean */}

      {/* Messages area — hidden in compact mode */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: compact ? 'none' : 'block',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.06) transparent',
          background: 'linear-gradient(180deg, rgba(12,16,36,0.15) 0%, rgba(8,12,28,0.35) 100%)',
          position: 'relative',
        }}
      >
        {/* Inner wrapper: flex-column for gap spacing, flexShrink:0 so content
            overflows the scroll container instead of being compressed by flex. */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: compact ? '0' : hasMessages ? '20px 16px' : '0',
          minHeight: '100%',
        }}>
        {!hasMessages ? (
          <EmptyState onQuickAction={(prompt) => onSend(prompt)} onBuildGame={onBuildGame} />
        ) : (
          // PERF: Single forward pass computes both "nearest preceding user message"
          // and "previous assistant luau code" for every message. Previous impl did
          // `[...messages.slice(0, idx)].reverse().find(...)` TWICE per message which
          // is O(n²) and was allocating/copying arrays for every message on every
          // re-render (e.g. every keystroke in the textarea).
          renderedMessages
        )}

        {/* MCP tool result card — appears after messages when a tool completes/fails */}
        {mcpToolResult && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 38 }}>
            <McpToolCard tool={mcpToolResult} />
          </div>
        )}

        {/* Active MCP tool indicator — shown mid-stream while AI calls a tool */}
        {activeMcpTool && (
          <div style={{ paddingLeft: 38 }}>
            <McpToolIndicator toolName={activeMcpTool} />
          </div>
        )}
        {/* Thinking/Reasoning indicator — shown during Think/Debug modes */}
        {isThinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 38 }}>
            <div style={{ maxWidth: 460, width: '100%' }}>
              <ThinkingIndicator mode={aiMode} thinkingText={thinkingText} />
            </div>
          </div>
        )}

        {/* Plan display — shown when Plan mode returns a plan for review */}
        {planText && onApprovePlan && onEditPlan && onCancelPlan && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 38 }}>
            <div style={{ maxWidth: 520, width: '100%' }}>
              <PlanDisplay
                planText={planText}
                onApprove={onApprovePlan}
                onEdit={onEditPlan}
                onCancel={onCancelPlan}
              />
            </div>
          </div>
        )}

        {/* Suggestion chips — clickable next actions */}
        {suggestions.length > 0 && !loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSend(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'rgba(212,175,55,0.9)',
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: 'nowrap',
                  animation: `chipGlow 3s ease-in-out ${i * 0.4}s infinite`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.18)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(212,175,55,0.35), 0 0 28px rgba(212,175,55,0.15)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.color = 'rgba(255,200,50,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.color = 'rgba(212,175,55,0.9)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>{/* end inner wrapper */}
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && !compact && (
        <button
          onClick={scrollToBottom}
          title="Scroll to bottom"
          style={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#D4AF37',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPulsing
              ? '0 0 0 6px rgba(212,175,55,0.25), 0 2px 12px rgba(212,175,55,0.55)'
              : '0 2px 12px rgba(212,175,55,0.45)',
            zIndex: 10,
            transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
            animation: isPulsing ? 'scrollBtnPulse 0.9s cubic-bezier(0.4,0,0.2,1)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,55,0.65)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(212,175,55,0.45)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 8l5 5 5-5" stroke="#1a1400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: '#FF4444',
              border: '1.5px solid #0c1024',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              pointerEvents: 'none',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Checkpoint panel — save/restore conversation state */}
      {sessionId && onSaveCheckpoint && onRestoreToCheckpoint && onDeleteCheckpoint && !compact && (
        <CheckpointPanel
          checkpoints={checkpoints}
          messageCount={messages.length}
          onSave={onSaveCheckpoint}
          onRestore={onRestoreToCheckpoint}
          onDelete={onDeleteCheckpoint}
          loading={loading}
        />
      )}

      {/* Checkpoint timeline — visual dot timeline */}
      {checkpoints.length > 0 && onRestoreToCheckpoint && onDeleteCheckpoint && !compact && !simplified && (
        <CheckpointTimeline
          checkpoints={checkpoints}
          currentMessageCount={messages.length}
          onRestore={onRestoreToCheckpoint}
          onDelete={onDeleteCheckpoint}
          loading={loading}
        />
      )}

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
        }}
      >
        {/* MCP quick-action buttons — hidden for clean UI */}
        {false && !compact && (
          <McpQuickActions
            onAction={(prompt) => {
              setInput(prompt)
              // Focus textarea so user can complete the prompt
              setTimeout(() => {
                const ta = document.querySelector<HTMLTextAreaElement>('textarea')
                ta?.focus()
                const len = prompt.length
                ta?.setSelectionRange(len, len)
              }, 30)
            }}
          />
        )}

        {/* Tip of the day — hidden in simplified mode */}
        {!simplified && <TipOfTheDay />}

        {/* AI Mode Selector — hidden in simplified mode (icons are in the editor shell) */}
        {!simplified && onAIModeChange && (
          <AIModeSelector
            activeMode={aiMode}
            onModeChange={onAIModeChange}
            compact={compact}
          />
        )}

        {/* Mode-specific controls */}
        {aiMode === 'idea' && (
          <CreativitySlider value={creativity} onChange={setCreativity} />
        )}
        {aiMode === 'image' && (
          <>
            <ImageStylePresetSelector
              // Drive the preset selector from useChat's imageOptions when
              // available so the chosen style actually reaches /api/ai/image
              // (BUG 9). Falls back to local state for older callers.
              selectedStyle={
                imageOptions && imageOptions.style !== 'auto'
                  ? imageOptions.style
                  : stylePreset ?? ''
              }
              onStyleChange={(key) => {
                setStylePreset(key)
                if (onImageOptionsChange) {
                  onImageOptionsChange({
                    style: key,
                    removeBackground: imageOptions?.removeBackground ?? false,
                    upscale: imageOptions?.upscale ?? false,
                  })
                }
              }}
            />
            {/* Background removal + HD upscale toggles (BUG 9) */}
            {onImageOptionsChange && imageOptions && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '4px 2px' }}>
                <button
                  type="button"
                  onClick={() => onImageOptionsChange({
                    ...imageOptions,
                    removeBackground: !imageOptions.removeBackground,
                  })}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${imageOptions.removeBackground ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    background: imageOptions.removeBackground ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    color: imageOptions.removeBackground ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  title="Run background removal on the generated image"
                >
                  {imageOptions.removeBackground ? '✓ ' : ''}Remove BG
                </button>
                <button
                  type="button"
                  onClick={() => onImageOptionsChange({
                    ...imageOptions,
                    upscale: !imageOptions.upscale,
                  })}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${imageOptions.upscale ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    background: imageOptions.upscale ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    color: imageOptions.upscale ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  title="Upscale the generated image to 2x resolution"
                >
                  {imageOptions.upscale ? '✓ ' : ''}HD Upscale
                </button>
              </div>
            )}
            <StyleReferenceUpload
              references={styleRefs}
              onAdd={(f) => setStyleRefs(prev => [...prev, f])}
              onRemove={(i) => setStyleRefs(prev => prev.filter((_, idx) => idx !== i))}
            />
          </>
        )}

        {/* Playtest indicator — shows autonomous test progress */}
        {playtestState && playtestState.result !== 'idle' && (
          <PlaytestIndicator
            running={playtestState.running}
            currentStep={playtestState.currentStep}
            iteration={playtestState.iteration}
            result={playtestState.result}
            steps={playtestState.steps}
            onCancel={onCancelPlaytest}
          />
        )}

        {/* Auto toggles row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!simplified && onAutoPlaytestToggle && studioConnected && (
            <PlaytestToggle
              enabled={autoPlaytestEnabled}
              onToggle={onAutoPlaytestToggle}
              studioConnected={studioConnected}
            />
          )}
          {!simplified && onAutoEnhanceToggle && (
            <EnhanceToggle
              enabled={autoEnhanceEnabled}
              onToggle={onAutoEnhanceToggle}
            />
          )}
        </div>

        {/* BUG 2: Build direction chips — hidden in simplified mode */}
        {!simplified && onBuildDirectionChange && hasMessages && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              fontFamily: 'Inter, sans-serif',
            }}
            role="radiogroup"
            aria-label="Build direction"
          >
            {(['continue', 'pivot', 'start-over'] as const).map((dir) => {
              const label = dir === 'start-over' ? 'Start over' : dir.charAt(0).toUpperCase() + dir.slice(1)
              const active = buildDirection === dir
              return (
                <button
                  key={dir}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onBuildDirectionChange(dir)}
                  title={
                    dir === 'continue'
                      ? 'Refine or add to the current build (default)'
                      : dir === 'pivot'
                      ? 'Change direction — prepends "Change direction:" to your prompt'
                      : 'Clear chat history and start fresh'
                  }
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.10)'}`,
                    background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {/* Textarea + actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${modeConfig.id !== 'build' ? modeConfig.borderColor.replace('0.25', '0.18') : 'rgba(255,255,255,0.10)'}`,
            borderRadius: 14,
            padding: '10px 14px',
            transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
          }}
          onFocusCapture={(e) => {
            // Use modeConfig.borderColor directly — it's already an rgba
            // string. The previous string-munging only worked for colours
            // already in rgb(...) form and produced garbage output for hex
            // values, so non-build modes never got their focus tint.
            e.currentTarget.style.borderColor = modeConfig.borderColor
            e.currentTarget.style.boxShadow = `0 0 0 1px ${modeConfig.bgColor}, 0 0 16px ${modeConfig.bgColor}`
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = modeConfig.id !== 'build' ? modeConfig.borderColor.replace('0.25', '0.12') : 'rgba(255,255,255,0.06)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Pasted image preview thumbnail */}
          {pastedImagePreview && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0',
              animation: 'msgFadeUp 0.15s ease-out forwards',
            }}>
              <img
                src={pastedImagePreview}
                alt="Pasted image"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  objectFit: 'cover',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              />
              <span style={{
                fontSize: 10,
                color: 'rgba(212,175,55,0.7)',
                fontFamily: 'Inter, sans-serif',
              }}>
                Image pasted from clipboard
              </span>
            </div>
          )}

          {/* Textarea row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>

          {/* + button — expands image/voice extras. Always visible; extras toggle on click */}
          <button
            onClick={() => setInputExtrasOpen((v) => !v)}
            title={inputExtrasOpen ? 'Hide extras' : 'Attach image or use voice'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: inputExtrasOpen ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)',
              background: inputExtrasOpen ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
              color: inputExtrasOpen ? '#D4AF37' : 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!inputExtrasOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            }}
            onMouseLeave={(e) => {
              if (!inputExtrasOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d={inputExtrasOpen ? 'M2 6h8' : 'M6 2v8M2 6h8'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>

          {/* AI quick actions — shown when extras open in simplified mode */}
          {simplified && inputExtrasOpen && (
            <div style={{
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
              animation: 'msgFadeUp 0.15s ease-out forwards',
            }}>
              {/* AI Modes */}
              {[
                { mode: 'build' as const, icon: '🏗️', label: 'Build', color: '#D4AF37', prompt: '' },
                { mode: 'plan' as const, icon: '📋', label: 'Plan', color: '#60A5FA', prompt: '' },
                { mode: 'script' as const, icon: '📝', label: 'Script', color: '#7C3AED', prompt: '' },
                { mode: 'image' as const, icon: '🎨', label: 'Image', color: '#10B981', prompt: '' },
                { mode: 'mesh' as const, icon: '🧊', label: '3D', color: '#F59E0B', prompt: '' },
                { mode: 'think' as const, icon: '🧠', label: 'Think', color: '#EC4899', prompt: '' },
              ].map(({ mode, icon, label, color }) => (
                <button
                  key={mode}
                  onClick={() => { if (onAIModeChange) onAIModeChange(mode) }}
                  title={`Switch to ${label} mode`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 8px',
                    borderRadius: 7,
                    border: `1px solid ${aiMode === mode ? `${color}55` : 'rgba(255,255,255,0.06)'}`,
                    background: aiMode === mode ? `${color}15` : 'rgba(255,255,255,0.02)',
                    color: aiMode === mode ? color : '#71717A',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  {label}
                </button>
              ))}

              {/* Separator */}
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)', margin: '0 2px', flexShrink: 0 }} />

              {/* Quick prompts — one-click actions that send pre-filled prompts */}
              {[
                { icon: '📍', label: 'Spawn Area', prompt: 'Build a spawn area with a lobby, teleporters, and a welcome sign' },
                { icon: '🎯', label: 'Cursor Place', prompt: 'Place a new object exactly where my camera is looking in Studio' },
                { icon: '✨', label: 'Enhance', prompt: 'Enhance what I just built — add more detail, better materials, lighting, and polish' },
                { icon: '🌍', label: 'Terrain', prompt: 'Generate natural terrain with hills, water, trees, and a path system' },
                { icon: '💡', label: 'Lighting', prompt: 'Add atmospheric lighting — ambient light, point lights, fog, and a skybox' },
                { icon: '🎮', label: 'Game Loop', prompt: '/plan Design a complete gameplay loop with currency, upgrades, and progression' },
                { icon: '🏪', label: 'Shop', prompt: 'Build an in-game shop with 6 items, a purchase system, and UI' },
                { icon: '🧹', label: 'Clean Up', prompt: 'Clean up my workspace — organize parts into folders, remove duplicates, anchor everything' },
                { icon: '🐛', label: 'Debug', prompt: '/think Look at my current build and find any bugs, missing parts, or things that could break' },
                { icon: '🔊', label: 'Sounds', prompt: 'Add ambient sounds — background music, footstep sounds, and UI click sounds' },
              ].map(({ icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => {
                    onSend(prompt)
                    setInputExtrasOpen(false)
                  }}
                  title={prompt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 8px',
                    borderRadius: 7,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    color: '#A1A1AA',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                    e.currentTarget.style.color = '#D4AF37'
                    e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#A1A1AA'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                >
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Image upload — only shown when extras open */}
          {inputExtrasOpen && (
            <label
              title={imageFile ? `Image attached: ${imageFile.name} (click to change)` : 'Attach image for Image-to-Map'}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: imageFile ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: imageFile ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                color: imageFile ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
                animation: 'msgFadeUp 0.15s ease-out forwards',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!loading && !imageFile) {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
                  e.currentTarget.style.color = '#D4AF37'
                }
              }}
              onMouseLeave={(e) => {
                if (!imageFile) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                }
              }}
            >
              {imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreviewUrl}
                  alt="Attached"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="4.5" cy="5.5" r="1.25" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M1.5 10l3-3.5 2.5 2.5 2-1.5L13 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  onImageFile?.(file)
                  if (!input.trim()) {
                    setInput('Build a Roblox map based on this image')
                  }
                  e.target.value = ''
                }}
              />
            </label>
          )}

          {/* Remove image button — shown when an image is attached */}
          {inputExtrasOpen && imageFile && (
            <button
              onClick={() => onImageFile?.(null)}
              title="Remove attached image"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.12)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: -6,
                marginBottom: 14,
                zIndex: 1,
                transition: 'all 0.15s',
                animation: 'msgFadeUp 0.15s ease-out forwards',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Voice button — uses VoiceInputButton for waveform + transcript overlay */}
          {inputExtrasOpen && (
            <div style={{ animation: 'msgFadeUp 0.15s ease-out forwards', flexShrink: 0 }}>
              <VoiceInputButton
                onSubmit={handleVoiceSubmit}
                disabled={loading}
              />
            </div>
          )}

          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={imageFile ? `Describe what to build from "${imageFile.name}"...` : modeConfig.placeholder}
            rows={1}
            disabled={loading}
            data-no-palette="true"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'rgba(255,255,255,0.85)',
              // 16px on mobile to prevent iOS Safari from auto-zooming on focus
              fontSize: isMobile ? 16 : 14,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
              maxHeight: textareaMaxHeight,
              overflowY: 'auto',
              opacity: loading ? 0.5 : 1,
              // Larger minimum tap area on mobile for accessibility
              minHeight: isMobile ? 44 : undefined,
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, textareaMaxHeight)}px`
            }}
          />

          {/* Send button — enabled when there's text OR an image attached */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || loading}
            aria-label="Send message"
            style={{
              width: isMobile ? 44 : 32,
              height: isMobile ? 44 : 32,
              minWidth: isMobile ? 44 : 32,
              minHeight: isMobile ? 44 : 32,
              borderRadius: isMobile ? 12 : 9,
              border: 'none',
              background:
                (!input.trim() && !imageFile) || loading
                  ? 'rgba(255,255,255,0.05)'
                  : `linear-gradient(135deg, ${modeConfig.color} 0%, ${modeConfig.color} 100%)`,
              color: (!input.trim() && !imageFile) || loading ? 'rgba(255,255,255,0.2)' : '#030712',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!input.trim() && !imageFile) || loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: (!input.trim() && !imageFile) || loading ? 'none' : `0 0 12px ${modeConfig.bgColor.replace('0.08', '0.3')}`,
              transition: 'all 0.12s ease-out',
              transform: sendPressed ? 'scale(0.92)' : 'scale(1)',
            }}
          >
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="8 8"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 7L2 7M9 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          </div>

          {/* Bottom row: gear (model) + hints + char count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            paddingTop: 6,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 6 : 0,
            rowGap: isMobile ? 4 : 0,
          }}>
            {/* Left: gear icon opens model selector inline */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setModelSelectorOpen((v) => !v)}
                title="Model settings"
                aria-label="Model settings"
                style={{
                  width: isMobile ? 44 : 24,
                  height: isMobile ? 44 : 24,
                  minWidth: isMobile ? 44 : 24,
                  minHeight: isMobile ? 44 : 24,
                  borderRadius: isMobile ? 10 : 6,
                  border: modelSelectorOpen ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  background: modelSelectorOpen ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                  color: modelSelectorOpen ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
              {modelSelectorOpen && (
                <div style={{ animation: 'msgFadeUp 0.15s ease-out forwards' }}>
                  <ModelSelector selected={selectedModel} onChange={(id) => { setSelectedModel(id); setModelSelectorOpen(false) }} />
                </div>
              )}
            </div>

            {/* Right: saved indicator + hints + char count */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: 'flex-end',
              minWidth: 0,
            }}>
              {/* "Saved" flash — appears briefly after messages are persisted */}
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(74,222,128,0.55)',
                  fontFamily: 'Inter, sans-serif',
                  opacity: showSaved ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                Saved
              </span>
              {/* Session token counter — visible reminder of usage */}
              {totalTokens > 0 && (
                <span style={{
                  fontSize: 10,
                  color: totalTokens > 800 ? 'rgba(239,68,68,0.7)' : totalTokens > 400 ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.3)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  ⚡ {totalTokens.toLocaleString()} tokens
                </span>
              )}
              {/* Estimated cost */}
              {input.trim().length > 20 && (
                <span style={{
                  fontSize: 10,
                  color: 'rgba(212,175,55,0.5)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  ~{Math.max(1, Math.ceil(input.split(/\s+/).length * 1.3 * 0.01 * 100) / 100).toFixed(2)}¢
                </span>
              )}
              {/* Slash command hint */}
              {showSlashHint && (
                <span style={{
                  fontSize: 10,
                  color: 'rgba(139,92,246,0.8)',
                  fontFamily: 'Inter, sans-serif',
                  animation: 'msgFadeUp 0.15s ease-out forwards',
                  whiteSpace: isMobile ? 'normal' : 'nowrap',
                  lineHeight: 1.4,
                  maxWidth: isMobile ? '100%' : undefined,
                  wordBreak: 'break-word',
                }}>
                  /build · /script · /terrain · /think · /plan · /debug
                </span>
              )}
              {/* Active mode indicator (when not build) */}
              {aiMode !== 'build' && !showCharCount && !showSlashHint && (
                <span style={{
                  fontSize: 10,
                  color: modeConfig.color,
                  fontFamily: 'Inter, sans-serif',
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', transform: 'scale(0.75)' }}>{modeConfig.icon}</span>
                  {modeConfig.label} mode
                  {modeConfig.creditMultiplier > 1 && <span style={{ opacity: 0.6 }}>· {modeConfig.creditMultiplier}x credits</span>}
                </span>
              )}
              {/* Char count — appears when typing */}
              {showCharCount && (
                <span style={{
                  fontSize: 10,
                  color: charCountWarning ? 'rgba(249,115,22,0.8)' : 'rgba(255,255,255,0.18)',
                  fontFamily: 'Inter, sans-serif',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.2s',
                }}>
                  {input.length} / {MAX_INPUT}
                </span>
              )}
              {!showCharCount && !showSlashHint && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: 'Inter, sans-serif' }}>
                  Enter to send
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </Wrapper>
  )
}
