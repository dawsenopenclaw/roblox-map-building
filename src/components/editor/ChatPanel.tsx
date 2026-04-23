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
// ─── Build Feedback Card — shown after every build with quality + stats ──────

function BuildFeedbackCard({
  qualityScore,
  partCount,
  executedInStudio,
  model,
  onSend,
  luauCode,
  prompt,
}: {
  qualityScore: number
  partCount?: number
  executedInStudio?: boolean
  model?: string
  onSend?: (msg: string) => void
  luauCode?: string
  prompt?: string
}) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  const submitVote = (worked: boolean) => {
    if (voted) return
    setVoted(worked ? 'up' : 'down')
    // Persist to learning system with full context
    fetch('/api/ai/build-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promptHash: luauCode ? simpleHash(luauCode) : 'unknown',
        code: luauCode || '',
        worked,
        score: worked ? Math.max(qualityScore, 70) : Math.min(qualityScore, 40),
        model: 'user-vote',
        prompt: prompt || undefined,
        userVote: worked,
      }),
    }).catch(() => {})
  }

  const tier = qualityScore >= 80 ? 'great' : qualityScore >= 60 ? 'good' : qualityScore >= 40 ? 'fair' : 'low'
  const tierConfig = {
    great: { label: 'Great Build', color: '#4ADE80', bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.15)', icon: '✓', hint: 'Looking solid. You can refine details or move on.' },
    good:  { label: 'Good Build',  color: '#D4AF37', bg: 'rgba(212,175,55,0.06)',  border: 'rgba(212,175,55,0.15)',  icon: '◆', hint: 'Decent foundation. Try "add more detail" or "make it bigger" to improve.' },
    fair:  { label: 'Needs Work',  color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)',  icon: '!', hint: 'Could be better. Try rephrasing or breaking it into smaller steps.' },
    low:   { label: 'Try Again',   color: '#EF4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)',   icon: '✗', hint: 'This one missed the mark. Try a simpler prompt or be more specific.' },
  }
  const cfg = tierConfig[tier]

  const quickActions = tier === 'great'
    ? ['Add lighting and atmosphere', 'Add more detail to this build', 'What should I build next?']
    : tier === 'good'
    ? ['Make it more detailed', 'Fix any issues with this build', 'Enhance the materials and colors']
    : ['Try building this again with more detail', 'Break this into smaller steps', 'Show me a simpler version']

  return (
    <div
      style={{
        width: '100%',
        marginTop: 8,
        padding: '12px 14px',
        borderRadius: 14,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
        animation: 'msgFadeUp 0.3s ease-out forwards',
      }}
    >
      {/* Header row — score + label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Score ring */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `conic-gradient(${cfg.color} ${qualityScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#0a0e1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: cfg.color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {qualityScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color, lineHeight: 1.2 }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              Quality Score
            </div>
          </div>
        </div>

        {/* Stats badges */}
        <div style={{ display: 'flex', gap: 6 }}>
          {partCount !== undefined && partCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, fontWeight: 600, color: '#A1A1AA',
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="4" height="4" rx="0.5" />
                <rect x="7" y="1" width="4" height="4" rx="0.5" />
                <rect x="1" y="7" width="4" height="4" rx="0.5" />
                <rect x="7" y="7" width="4" height="4" rx="0.5" />
              </svg>
              {partCount} parts
            </span>
          )}
          {executedInStudio && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
              fontSize: 10, fontWeight: 600, color: '#22C55E',
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="2 6 5 9 10 3" />
              </svg>
              In Studio
            </span>
          )}
          {model && (
            <span style={{
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10, color: '#52525B',
            }}>
              {model.split('-')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Hint text */}
      <p style={{
        fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
        margin: '0 0 8px 0',
      }}>
        {cfg.hint}
      </p>

      {/* Quick action pills */}
      {onSend && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => onSend(action)}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                fontSize: 10,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                opacity: 0.8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.background = cfg.bg
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '0.8'
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Vote buttons — "Did this work?" */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 6, paddingTop: 8,
        borderTop: `1px solid ${cfg.border}`,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginRight: 2 }}>
          {voted ? 'Thanks for the feedback!' : 'Did this build work?'}
        </span>
        {!voted && (
          <>
            <button
              onClick={() => submitVote(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 8,
                border: '1px solid rgba(74,222,128,0.2)',
                background: 'rgba(74,222,128,0.06)',
                color: 'rgba(74,222,128,0.8)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.12)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.06)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="2 8 6 12 14 4" />
              </svg>
              Worked
            </button>
            <button
              onClick={() => submitVote(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.06)',
                color: 'rgba(239,68,68,0.8)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
              Broke
            </button>
          </>
        )}
        {voted && (
          <span style={{
            fontSize: 10,
            color: voted === 'up' ? 'rgba(74,222,128,0.7)' : 'rgba(239,68,68,0.7)',
            fontWeight: 600,
          }}>
            {voted === 'up' ? 'Recorded as working — this helps future builds' : 'Recorded — we\'ll learn from this'}
          </span>
        )}
      </div>
    </div>
  )
}

function CodeFeedbackButtons({ code, prompt }: { code: string; prompt?: string }) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'done'>('idle')

  const submitFeedback = async (worked: boolean) => {
    if (feedbackState !== 'idle') return
    setFeedbackState('submitting')
    try {
      // Send to prompt optimizer (in-memory)
      fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: `code-${simpleHash(code)}`,
          thumbsUp: worked,
        }),
      }).catch(() => {})

      // Persist to BuildFeedback DB for the learning system
      // CRITICAL: include `prompt` so findSimilarSuccesses() can retrieve
      // this feedback for future builds with similar prompts
      fetch('/api/ai/build-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptHash: simpleHash(code),
          code,
          worked,
          score: worked ? 75 : 25,
          model: 'user-vote',
          prompt: prompt || undefined,
          userVote: worked,
          errorMessage: worked ? undefined : 'User reported: build did not work',
        }),
      }).catch(() => {})
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
            fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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

// ─── Conversation feedback buttons — appears on non-code AI messages ────────
// Thumbs up/down for conversation quality + interactive follow-up questions
function ConversationFeedbackButtons({
  messageId,
  content,
  onSend,
}: {
  messageId: string
  content: string
  onSend: (msg: string) => void
}) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'thumbsUp' | 'thumbsDown' | 'done'>('idle')

  const submitFeedback = async (positive: boolean) => {
    if (feedbackState !== 'idle') return
    setFeedbackState(positive ? 'thumbsUp' : 'thumbsDown')
    try {
      fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: `conv-${messageId}`,
          thumbsUp: positive,
          conversational: true,
        }),
      }).catch(() => {})
    } catch {
      // Best-effort
    }
    setTimeout(() => setFeedbackState('done'), 1200)
  }

  // Extract [FOLLOWUP] questions from the content
  const followups: string[] = []
  const followupMatch = content.match(/\[FOLLOWUP\]([\s\S]*?)(?:\[SUGGESTIONS\]|$)/)
  if (followupMatch) {
    followupMatch[1]
      .split('\n')
      .map(s => s.trim().replace(/^[-*]\s*/, ''))
      .filter(s => s.length > 0 && s.length < 120)
      .slice(0, 3)
      .forEach(q => followups.push(q))
  }

  if (feedbackState === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.6)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)' }}>
          Thanks! That helps me get better.
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {/* Followup question pills */}
      {followups.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {followups.map((q, i) => (
            <button
              key={i}
              onClick={() => onSend(q)}
              style={{
                padding: '5px 10px',
                borderRadius: 16,
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.15)',
                color: 'rgba(212,175,55,0.8)',
                fontSize: 11,
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                lineHeight: 1.3,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.14)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      {/* Thumbs up/down */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', marginRight: 2 }}>
          Helpful?
        </span>
        <button
          onClick={() => submitFeedback(true)}
          disabled={feedbackState !== 'idle'}
          title="Helpful response"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 6,
            border: feedbackState === 'thumbsUp' ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.08)',
            background: feedbackState === 'thumbsUp' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
            color: feedbackState === 'thumbsUp' ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.35)',
            cursor: feedbackState !== 'idle' ? 'default' : 'pointer',
            fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (feedbackState === 'idle') {
              e.currentTarget.style.background = 'rgba(74,222,128,0.1)'
              e.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)'
              e.currentTarget.style.color = 'rgba(74,222,128,0.8)'
            }
          }}
          onMouseLeave={(e) => {
            if (feedbackState === 'idle') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
            }
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        </button>
        <button
          onClick={() => submitFeedback(false)}
          disabled={feedbackState !== 'idle'}
          title="Not helpful"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 6,
            border: feedbackState === 'thumbsDown' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
            background: feedbackState === 'thumbsDown' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
            color: feedbackState === 'thumbsDown' ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.35)',
            cursor: feedbackState !== 'idle' ? 'default' : 'pointer',
            fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (feedbackState === 'idle') {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
              e.currentTarget.style.color = 'rgba(239,68,68,0.8)'
            }
          }}
          onMouseLeave={(e) => {
            if (feedbackState === 'idle') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
            }
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function LuauCodeBlock({
  code,
  onSendToStudio,
  studioConnected,
  prompt,
}: {
  code: string
  onSendToStudio?: (luauCode: string) => void
  studioConnected?: boolean
  prompt?: string
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
      <CodeFeedbackButtons code={code} prompt={prompt} />
    </div>
  )
}

// ─── Content renderer: splits prose and fenced code blocks ───────────────────

/** Lightweight markdown renderer — handles bold, italic, inline code, lists, headers */
function MarkdownText({ text }: { text: string }) {
  // Process line by line for block-level elements, then inline formatting
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headers
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) {
      elements.push(<div key={key++} style={{ fontSize: 14, fontWeight: 700, color: '#D4AF37', margin: '10px 0 4px' }}>{formatInline(h3[1])}</div>)
      continue
    }
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) {
      elements.push(<div key={key++} style={{ fontSize: 15, fontWeight: 700, color: '#D4AF37', margin: '12px 0 4px' }}>{formatInline(h2[1])}</div>)
      continue
    }
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) {
      elements.push(<div key={key++} style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37', margin: '14px 0 6px' }}>{formatInline(h1[1])}</div>)
      continue
    }

    // Bullet list items
    const bullet = line.match(/^[\s]*[-*•]\s+(.+)/)
    if (bullet) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '2px 0' }}>
          <span style={{ color: '#D4AF37', fontSize: 10, marginTop: 5, flexShrink: 0 }}>●</span>
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatInline(bullet[1])}</span>
        </div>
      )
      continue
    }

    // Numbered list items
    const numbered = line.match(/^[\s]*(\d+)[.)]\s+(.+)/)
    if (numbered) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '2px 0' }}>
          <span style={{ color: 'rgba(212,175,55,0.7)', fontSize: 12, fontWeight: 600, flexShrink: 0, minWidth: 16, textAlign: 'right' }}>{numbered[1]}.</span>
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatInline(numbered[2])}</span>
        </div>
      )
      continue
    }

    // Empty lines → small gap
    if (!line.trim()) {
      elements.push(<div key={key++} style={{ height: 6 }} />)
      continue
    }

    // Regular text with inline formatting
    elements.push(
      <span key={key++} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>
        {formatInline(line)}
      </span>
    )
  }

  return <>{elements}</>
}

/** Format inline markdown: **bold**, *italic*, `code`, ~~strike~~ */
function formatInline(text: string): React.ReactNode {
  // Split on inline patterns and rebuild with styled spans
  const parts: React.ReactNode[] = []
  // Process: `code`, **bold**, *italic*
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const match = m[0]
    if (match.startsWith('`')) {
      parts.push(
        <code key={key++} style={{
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: '0.88em',
          fontFamily: 'var(--font-geist-mono, monospace)',
          color: '#D4AF37',
        }}>
          {match.slice(1, -1)}
        </code>
      )
    } else if (match.startsWith('**')) {
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{match.slice(2, -2)}</strong>)
    } else if (match.startsWith('*')) {
      parts.push(<em key={key++} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>{match.slice(1, -1)}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

function RenderMessageContent({
  content,
  onSendToStudio,
  studioConnected,
  prompt,
}: {
  content: string
  onSendToStudio?: (luauCode: string) => void
  studioConnected?: boolean
  prompt?: string
}) {
  // Strip [FOLLOWUP] section from display — it's parsed separately by ConversationFeedbackButtons
  const cleanContent = content.replace(/\[FOLLOWUP\][\s\S]*?(?=\[SUGGESTIONS\]|$)/, '').trim()
  const parts: React.ReactNode[] = []
  const fenceRe = /```(?:lua|luau|[a-z]*)?\n([\s\S]*?)```/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  fenceRe.lastIndex = 0
  while ((m = fenceRe.exec(cleanContent)) !== null) {
    if (m.index > last) {
      parts.push(
        <MarkdownText key={key++} text={cleanContent.slice(last, m.index)} />
      )
    }
    parts.push(
      <LuauCodeBlock
        key={key++}
        code={m[1].trimEnd()}
        onSendToStudio={onSendToStudio}
        studioConnected={studioConnected}
        prompt={prompt}
      />
    )
    last = m.index + m[0].length
  }
  if (last < cleanContent.length) {
    parts.push(
      <MarkdownText key={key++} text={cleanContent.slice(last)} />
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
  onSelectBuildOption,
  onSend,
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
  onSelectBuildOption?: (optionPrompt: string) => void
  onSend?: (msg: string) => void
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
  const isBuildPreview = msg.role === 'build-preview'

  // ── Build Preview Cards ─────────────────────────────────────────────────
  if (isBuildPreview && msg.buildOptions && msg.buildOptions.length > 0) {
    return (
      <div style={{ margin: '12px 0' }}>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
          margin: '0 0 10px 0',
        }}>
          Pick a direction for your build:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {msg.buildOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                if (onSelectBuildOption) {
                  const blueprint = `Build "${opt.name}": ${opt.description}\n\nKey features: ${opt.features.join(', ')}\nMaterials: ${opt.materials.join(', ')}\nStyle: ${opt.style}, approximately ${opt.estimatedParts} parts`
                  onSelectBuildOption(blueprint)
                }
              }}
              style={{
                flex: '1 1 140px',
                maxWidth: 220,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#D4AF37',
                  background: 'rgba(212,175,55,0.12)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: 0.5,
                }}>
                  {opt.style.toUpperCase()}
                </span>
                <span style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  ~{opt.estimatedParts} parts
                </span>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 600,
                margin: '0 0 6px 0',
                lineHeight: 1.3,
              }}>
                {opt.name}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                lineHeight: 1.5,
                margin: '0 0 8px 0',
              }}>
                {opt.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {opt.materials.slice(0, 4).map((m, j) => (
                  <span key={j} style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

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
            fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                    fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                    fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                padding: '14px 22px',
                borderRadius: '20px 20px 6px 20px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212,175,55,0.15)',
                backdropFilter: 'blur(20px) saturate(1.1)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
                boxShadow: '0 4px 16px rgba(212,175,55,0.06), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,230,160,0.06)',
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: 500 }}>
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
        gap: 12,
        alignItems: 'flex-start',
        animation: 'msgFadeUp 0.3s ease-out forwards',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar with enhanced glow */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          background: 'linear-gradient(135deg, #D4AF37 0%, #C49B2F 50%, #B8962E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          boxShadow: msg.streaming
            ? '0 0 16px rgba(212,175,55,0.35), 0 0 32px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,230,160,0.3)'
            : '0 2px 10px rgba(0,0,0,0.3), 0 0 8px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,230,160,0.2)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 12 12" fill="#030712">
          <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
        </svg>
      </div>
      <div
        style={{
          maxWidth: '85%',
          padding: '16px 22px',
          borderRadius: '20px 20px 20px 6px',
          background: msg.streaming
            ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)',
          border: newFlash
            ? '1px solid rgba(212,175,55,0.35)'
            : msg.streaming
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
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
        <div style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', lineHeight: 1.6 }}>
          {msg.streaming
            ? (msg.content
                ? <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stripCodeBlocksForDisplay(msg.content)}</span>
                : <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Generating code — this may take a moment for complex builds<TypingDots /></span>
              )
            : <RenderMessageContent content={msg.content} onSendToStudio={onSendToStudio} studioConnected={studioConnected} prompt={userPrompt} />
          }
        </div>
        {!msg.streaming && msg.meshResult && (
          <MeshResultCard mesh={msg.meshResult} onSendToStudio={onSendToStudio} />
        )}
        {/* Conversation feedback — thumbs up/down + follow-up questions for non-code messages */}
        {/* Timestamp */}
        {!msg.streaming && msg.timestamp && (
          <span style={{
            display: 'block',
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'var(--font-geist-mono, monospace)',
            marginTop: 4,
          }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {msg.model && msg.role === 'assistant' && ` · ${msg.model}`}
            {msg.tokensUsed && msg.role === 'assistant' ? ` · ${msg.tokensUsed} tokens` : ''}
          </span>
        )}
        {!msg.streaming && msg.role === 'assistant' && !msg.hasCode && onSend && (
          <ConversationFeedbackButtons
            messageId={msg.id}
            content={msg.content}
            onSend={onSend}
          />
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
          {/* Build Feedback Card — post-build quality + stats */}
          {!msg.streaming && msg.hasCode && msg.qualityScore !== undefined && msg.qualityScore > 0 && (
            <BuildFeedbackCard
              qualityScore={msg.qualityScore}
              partCount={msg.buildPartCount}
              executedInStudio={msg.executedInStudio}
              model={msg.model}
              onSend={onSend}
              luauCode={msg.luauCode}
              prompt={userPrompt}
            />
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)' }}>
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
        fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
        fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                    fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
          lineHeight: 1.3,
          transition: 'color 0.18s',
        }}>
          {example.label}
        </div>
        <div style={{
          fontSize: 11,
          color: '#3f3f46',
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
      <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', lineHeight: 1.4 }}>
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
            fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
          fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
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
  /** Pre-build preview mode — shows 3 concept options before generating code */
  previewMode?: boolean
  onPreviewModeToggle?: (enabled: boolean) => void
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
  previewMode = false,
  onPreviewModeToggle,
  simplified = false,
}: ChatPanelProps & { simplified?: boolean }) {
  const isMobile = useIsMobile()
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const taRef = externalRef ?? internalRef
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
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
  const modeConfig = getModeConfig(aiMode)
  const [creativity, setCreativity] = useState(50)
  const [styleRefs, setStyleRefs] = useState<File[]>([])
  const [stylePreset, setStylePreset] = useState<string | null>(null)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const isScrolledUpRef = useRef(false)
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

  const handleVoiceSubmit = useCallback((text: string) => {
    if (text.trim()) onSend(text.trim())
  }, [onSend])

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

  // Auto-scroll during streaming: if the user is near the bottom, keep them
  // pinned as streaming content grows. Throttled to avoid layout thrashing.
  const streamScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isStreamingMsg = messages.some(m => m.streaming)
  useEffect(() => {
    if (isStreamingMsg && isNearBottomRef.current) {
      streamScrollTimerRef.current = setInterval(() => {
        if (isNearBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }
      }, 200)
    }
    return () => {
      if (streamScrollTimerRef.current) {
        clearInterval(streamScrollTimerRef.current)
        streamScrollTimerRef.current = null
      }
    }
  }, [isStreamingMsg, messages])

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
          onSelectBuildOption={onSend}
          onSend={onSend}
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
    onSend,
  ])

  const hasMessages = messages.length > 0

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

  // ── Mode switcher config ──
  const MODE_PILLS: { mode: AIMode; label: string; color: string }[] = [
    { mode: 'build', label: 'Build', color: '#D4AF37' },
    { mode: 'script', label: 'Script', color: '#7C3AED' },
    { mode: 'image', label: 'Image', color: '#10B981' },
    { mode: 'mesh', label: '3D Mesh', color: '#F59E0B' },
    { mode: 'terrain' as AIMode, label: 'Terrain', color: '#06B6D4' },
    { mode: 'plan', label: 'Plan', color: '#60A5FA' },
  ]

  // Placeholder text per mode
  const modePlaceholders: Record<string, string> = {
    build: 'Build a castle, spaceship, tycoon factory...',
    script: 'Leaderboard, shop system, NPC dialog...',
    image: 'Game thumbnail, icon, texture, decal...',
    mesh: 'Sword, helmet, potion, character model...',
    terrain: 'Island, mountain range, city landscape...',
    plan: 'Plan a tycoon, RPG, simulator...',
  }

  return (
    <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Mode Switcher Pill Bar ── */}
      {onAIModeChange && hasMessages && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
            background: 'rgba(5,8,16,0.5)',
          }}
        >
          {MODE_PILLS.map(({ mode, label, color }) => {
            const active = aiMode === mode
            return (
              <button
                key={mode}
                onClick={() => onAIModeChange(mode)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: active ? `1px solid ${color}30` : '1px solid transparent',
                  background: active ? `${color}10` : 'transparent',
                  color: active ? color : '#71717A',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: active ? `0 0 16px ${color}10` : 'none',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent' } }}
              >
                {label}
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '50%',
                    height: 2,
                    borderRadius: 1,
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    boxShadow: `0 0 8px ${color}40`,
                    transition: 'all 0.2s ease-out',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Messages Area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: compact ? 'none' : 'block',
          scrollbarWidth: 'none',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: hasMessages ? '24px 20px' : '0',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          minHeight: '100%',
        }}>
          {hasMessages ? renderedMessages : null}

          {mcpToolResult && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 38 }}>
              <McpToolCard tool={mcpToolResult} />
            </div>
          )}

          {activeMcpTool && (
            <div style={{ paddingLeft: 38 }}>
              <McpToolIndicator toolName={activeMcpTool} />
            </div>
          )}

          {isThinking && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 38 }}>
              <div style={{ maxWidth: 460, width: '100%' }}>
                <ThinkingIndicator mode={aiMode} thinkingText={thinkingText} />
              </div>
            </div>
          )}

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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {showScrollBtn && !compact && (
        <button
          onClick={scrollToBottom}
          title="Scroll to bottom"
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            width: 32,
            height: 32,
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
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 8l5 5 5-5" stroke="#1a1400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              minWidth: 16, height: 16, borderRadius: 8,
              background: '#FF4444', border: '1.5px solid #0c1024',
              color: '#fff', fontSize: 9, fontWeight: 700,
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Input Area — ChatGPT-style bottom bar ── */}
      <div
        style={{
          flexShrink: 0,
          padding: isMobile ? '10px 12px 16px' : '12px 20px 20px',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Suggestion pills — above input */}
        {suggestions.length > 0 && !loading && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            animation: 'msgFadeUp 0.25s ease-out forwards',
          }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSend(s)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.03) 100%)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  color: 'rgba(212,175,55,0.9)',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.08) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2), 0 0 12px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#D4AF37'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.03) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = 'rgba(212,175,55,0.9)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Image mode controls */}
        {aiMode === 'image' && (
          <>
            <ImageStylePresetSelector
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
            {onImageOptionsChange && imageOptions && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onImageOptionsChange({ ...imageOptions, removeBackground: !imageOptions.removeBackground })}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 999,
                    border: `1px solid ${imageOptions.removeBackground ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    background: imageOptions.removeBackground ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    color: imageOptions.removeBackground ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  }}
                >
                  {imageOptions.removeBackground ? '✓ ' : ''}Remove BG
                </button>
                <button
                  type="button"
                  onClick={() => onImageOptionsChange({ ...imageOptions, upscale: !imageOptions.upscale })}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 999,
                    border: `1px solid ${imageOptions.upscale ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    background: imageOptions.upscale ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    color: imageOptions.upscale ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  }}
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

        {/* Playtest indicator */}
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

        {/* ── Main input container — cyberglass ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            background: 'linear-gradient(135deg, rgba(15,20,40,0.65) 0%, rgba(20,25,50,0.55) 50%, rgba(15,20,40,0.65) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            padding: '14px 18px',
            transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out',
            backdropFilter: 'blur(30px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
            e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.10), 0 0 80px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,230,160,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)'
          }}
        >
          {/* Cyberglass animated shimmer */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 40%, rgba(212,175,55,0.04) 50%, rgba(255,255,255,0.03) 60%, transparent 80%)',
            backgroundSize: '200% 100%',
            animation: 'glassShimmer 6s ease-in-out infinite',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }} />
          {/* Top highlight edge */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            pointerEvents: 'none',
          }} />
          {/* Attached image preview */}
          {(imagePreviewUrl || pastedImagePreview) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 0 8px',
              animation: 'msgFadeUp 0.15s ease-out forwards',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl || pastedImagePreview || ''}
                alt="Attached"
                style={{
                  width: 48, height: 48, borderRadius: 8,
                  objectFit: 'cover',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              />
              <span style={{ fontSize: 11, color: '#A1A1AA', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', flex: 1 }}>
                {imageFile?.name || 'Pasted image'}
              </span>
              {imageFile && (
                <button
                  onClick={() => onImageFile?.(null)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#F87171',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Input row: attach + textarea + voice + send */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Attach image (paperclip) */}
            <label
              title="Attach image"
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: 'none', background: 'rgba(255,255,255,0.04)',
                color: '#52525B', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A1A1AA' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#52525B' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  onImageFile?.(file)
                  if (!input.trim()) setInput('Build a Roblox map based on this image')
                  e.target.value = ''
                }}
              />
            </label>

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={imageFile
                ? `Describe what to build from "${imageFile.name}"...`
                : `Message Forje... ${modePlaceholders[aiMode] || ''}`
              }
              rows={1}
              data-no-palette="true"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '8px 0',
                color: '#FAFAFA',
                fontSize: isMobile ? 16 : 15,
                fontFamily: 'inherit',
                lineHeight: 1.5,
                fontWeight: 400,
                maxHeight: textareaMaxHeight,
                overflowY: 'auto',
                opacity: loading ? 0.5 : 1,
                minHeight: isMobile ? 44 : undefined,
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, textareaMaxHeight)}px`
              }}
            />

            {/* Voice input */}
            <div style={{ flexShrink: 0 }}>
              <VoiceInputButton onSubmit={handleVoiceSubmit} disabled={loading} />
            </div>

            {/* Send / Stop button */}
            {loading ? (
              <button
                onClick={() => {
                  // Trigger page-level abort by reloading chat state
                  // The AbortController in useChat will clean up the fetch
                  window.dispatchEvent(new CustomEvent('forje-stop-generating'))
                }}
                aria-label="Stop generating"
                title="Stop generating"
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  border: '1.5px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#EF4444',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && !imageFile}
                aria-label="Send message"
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  border: 'none',
                  background: (input.trim() || imageFile)
                    ? 'linear-gradient(135deg, #D4AF37 0%, #C49B2F 100%)'
                    : 'rgba(255,255,255,0.04)',
                  color: (input.trim() || imageFile)
                    ? '#09090b' : '#3F3F46',
                  cursor: (input.trim() || imageFile)
                    ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: sendPressed ? 'scale(0.88)' : 'scale(1)',
                  boxShadow: (input.trim() || imageFile)
                    ? '0 0 20px rgba(212,175,55,0.25), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,230,160,0.3)'
                    : 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom info row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 6, marginTop: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Saved indicator */}
              <span style={{
                fontSize: 10, color: 'rgba(74,222,128,0.55)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                opacity: showSaved ? 1 : 0, transition: 'opacity 0.35s ease',
                pointerEvents: 'none',
              }}>Saved</span>
              {/* Mode indicator */}
              {aiMode !== 'build' && (
                <span style={{
                  fontSize: 10, color: modeConfig.color,
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)', opacity: 0.7,
                }}>
                  {modeConfig.label} mode
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {totalTokens > 0 && (
                <span style={{
                  fontSize: 10,
                  color: totalTokens > 800 ? 'rgba(239,68,68,0.7)' : totalTokens > 400 ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {totalTokens.toLocaleString()} tokens
                </span>
              )}
              {showCharCount && (
                <span style={{
                  fontSize: 10,
                  color: charCountWarning ? 'rgba(249,115,22,0.8)' : 'rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {input.length} / {MAX_INPUT}
                </span>
              )}
              {showSlashHint && (
                <span style={{
                  fontSize: 10, color: 'rgba(139,92,246,0.8)',
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  animation: 'msgFadeUp 0.15s ease-out forwards',
                }}>
                  /build · /script · /terrain · /think · /plan
                </span>
              )}
              {!showCharCount && !showSlashHint && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)' }}>
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
        @keyframes glassShimmer {
          0%   { background-position: 200% center; }
          50%  { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  )
}
