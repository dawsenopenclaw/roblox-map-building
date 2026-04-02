'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GlassPanel } from './GlassPanel'
import type { ChatMessage, ModelId, ModelOption } from '@/app/(app)/editor/hooks/useChat'
import { MODELS } from '@/app/(app)/editor/hooks/useChat'

// ─── Showcase example prompts (empty state) ───────────────────────────────────

const SHOWCASE_EXAMPLES = [
  {
    emoji: '🏰',
    label: 'Medieval Castle',
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
    label: 'Cozy Cafe',
    desc: 'Interior with furniture',
    prompt: 'Design a cozy cafe interior with tables, chairs, a coffee counter, and warm lighting',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.25)',
  },
  {
    emoji: '🚀',
    label: 'Space Station',
    desc: 'Sci-fi orbital base',
    prompt: 'Build a space station with docking bays, corridors, control rooms, and starfield windows',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.2)',
  },
  {
    emoji: '🌲',
    label: 'Forest & Lake',
    desc: 'Paths, trees & water',
    prompt: 'Create a forest with winding paths, tall trees, a peaceful lake, and a small wooden dock',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0 4px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#FFB81C',
            opacity: 0.7,
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
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
    0%, 100% { box-shadow: 0 0 8px rgba(255,184,28,0.45), 0 0 16px rgba(255,107,53,0.25); }
    50%       { box-shadow: 0 0 14px rgba(255,184,28,0.7), 0 0 28px rgba(255,107,53,0.4), 0 0 40px rgba(212,175,55,0.2); }
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
`

function MessageBubble({
  msg,
  onRetry,
  onBuildDifferently,
  onDismiss,
}: {
  msg: ChatMessage
  onRetry?: () => void
  onBuildDifferently?: () => void
  onDismiss?: (id: string) => void
}) {
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
    const isSuccess = msg.content.toLowerCase().includes('studio') && !msg.content.toLowerCase().includes('thinking')
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 10, padding: '4px 0' }}>
        <style>{PULSE_STYLE}</style>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isSuccess
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.1) 100%)'
              : 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)',
            border: isSuccess ? '1px solid rgba(74,222,128,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
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
              }}
            >
              {msg.content}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {msg.content}
            </span>
            <TypingDots />
          </div>
        )}
      </div>
    )
  }

  if (isUpgrade) {
    return (
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 14,
          background: 'rgba(212,175,55,0.07)',
          border: '1px solid rgba(212,175,55,0.2)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {msg.content}
      </div>
    )
  }

  if (isSignup) {
    return (
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 14,
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {msg.content}
      </div>
    )
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
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'msgFadeUp 0.25s ease-out forwards',
        }}
      >
        <div
          style={{
            maxWidth: '82%',
            padding: '10px 14px',
            borderRadius: '16px 4px 16px 16px',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: '0 0 16px rgba(212,175,55,0.06)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {displayContent}
          </p>
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
    >
      {/* Avatar with pulsing glow */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          animation: 'avatarGlow 3s ease-in-out infinite',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="#030712">
          <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
        </svg>
      </div>
      <div
        style={{
          maxWidth: '82%',
          padding: '10px 14px',
          borderRadius: '4px 16px 16px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scanning line — visible while streaming */}
        {msg.streaming && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.6) 40%, rgba(139,92,246,0.5) 60%, transparent 100%)',
              animation: 'scanLine 1.4s linear infinite',
              pointerEvents: 'none',
            }}
          />
        )}
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.streaming ? stripCodeBlocksForDisplay(msg.content) : msg.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {msg.hasCode && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: 'rgba(34,197,94,0.8)', fontFamily: 'Inter, sans-serif' }}>
              Built in Studio
            </span>
          )}
          {msg.tokensUsed !== undefined && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
              {msg.tokensUsed.toLocaleString()} tokens
            </span>
          )}
        </div>
      </div>
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
        padding: '12px',
        borderRadius: 12,
        border: `1px solid ${hovered ? example.border : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? example.bg : 'rgba(255,255,255,0.025)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease-out',
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? (hovered ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(10px)',
        boxShadow: hovered ? `0 4px 16px ${example.bg}` : 'none',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: hovered ? example.bg : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? example.border : 'rgba(255,255,255,0.06)'}`,
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

function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '24px 4px 8px',
        transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(255,184,28,0.15) 0%, rgba(212,175,55,0.07) 100%)',
            border: '1px solid rgba(255,184,28,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2L13 7.5H19L14 11l2 6.5L11 14l-4.5 3.5 2-6.5L3 7.5h6L11 2z" fill="#FFB81C" opacity={0.9}/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fafafa', fontFamily: 'Inter, sans-serif' }}>
          What do you want to build?
        </h2>
        <p style={{ margin: '5px 0 0', fontSize: 12, color: '#52525b', fontFamily: 'Inter, sans-serif' }}>
          Pick an example or describe anything
        </p>
      </div>

      {/* 6-card showcase grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SHOWCASE_EXAMPLES.map((ex, i) => (
          <ShowcaseCard
            key={ex.label}
            example={ex}
            delay={i * 40}
            onSelect={onQuickAction}
          />
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
        gap: 8,
        padding: '7px 12px',
        borderRadius: 10,
        background: 'rgba(212,175,55,0.06)',
        border: '1px solid rgba(212,175,55,0.15)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        marginBottom: 2,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
        <path d="M6 1a3.5 3.5 0 0 1 2 6.4V9H4V7.4A3.5 3.5 0 0 1 6 1z" stroke="#FFB81C" strokeWidth="1.1" fill="none"/>
        <path d="M4.5 10.5h3" stroke="#FFB81C" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
      <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
        <span style={{ color: 'rgba(212,175,55,0.7)', fontWeight: 600, marginRight: 4 }}>Tip:</span>
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

function useSpeech(onResult: (text: string) => void) {
  const recRef = useRef<unknown>(null)
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  )

  const toggle = useCallback(() => {
    if (!supported) return
    if (listening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(recRef.current as any)?.stop()
      setListening(false)
      return
    }
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

function ModelSelector({
  selected,
  onChange,
}: {
  selected: ModelId
  onChange: (id: ModelId) => void
}) {
  const [open, setOpen] = useState(false)
  const current = MODELS.find((m) => m.id === selected) ?? MODELS[0]

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
          <span
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(212,175,55,0.15)',
              color: '#FFB81C',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
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
              minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
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
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: model.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{model.label}</span>
                {model.badge && (
                  <span style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(212,175,55,0.15)', color: '#FFB81C', fontSize: 9, fontWeight: 700 }}>
                    {model.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
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
}: ChatPanelProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const taRef = externalRef ?? internalRef
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleVoiceResult = useCallback((text: string) => {
    setInput(input ? `${input} ${text}` : text)
  }, [setInput, input])

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(handleVoiceResult)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSend(input)
    }
  }

  const handleSend = () => onSend(input)

  const hasMessages = messages.length > 0

  return (
    <GlassPanel
      padding="none"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {!hasMessages ? (
          <EmptyState onQuickAction={(prompt) => onSend(prompt)} />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onRetry={onRetry}
              onBuildDifferently={onBuildDifferently}
              onDismiss={onDismiss}
            />
          ))
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
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
        }}
      >
        {/* Sparkle particles near input */}
        {[
          { left: '8%',  top: '18px', delay: 0,   size: 3 },
          { left: '15%', top: '8px',  delay: 0.7, size: 2 },
          { left: '88%', top: '14px', delay: 1.4, size: 2.5 },
          { left: '94%', top: '6px',  delay: 0.3, size: 2 },
          { left: '50%', top: '4px',  delay: 1.1, size: 2 },
        ].map((p, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: 'rgba(56,189,248,0.8)',
              boxShadow: '0 0 4px rgba(56,189,248,0.6)',
              animation: `sparkleFloat 2.4s ease-in-out ${p.delay}s infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Tip of the day — dismissable, shown for first 10 sessions */}
        <TipOfTheDay />

        {/* Top row: model selector + token counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
          {totalTokens > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
              {totalTokens.toLocaleString()} tokens used
            </span>
          )}
        </div>

        {/* Textarea + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            background: 'rgba(3,7,18,0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '10px 12px',
            transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(56,189,248,0.35)'
            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(56,189,248,0.1), 0 0 20px rgba(56,189,248,0.06)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: 'auto',
              opacity: loading ? 0.5 : 1,
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />

          {/* Voice button */}
          {speechSupported && (
            <button
              onClick={toggleSpeech}
              title={listening ? 'Stop listening' : 'Voice input'}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: listening ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                color: listening ? '#F87171' : 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 7.5a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M7 12.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: 'none',
              background:
                !input.trim() || loading
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
              color: !input.trim() || loading ? 'rgba(255,255,255,0.2)' : '#030712',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: !input.trim() || loading ? 'none' : '0 0 12px rgba(212,175,55,0.3)',
              transition: 'all 0.15s',
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

        <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </GlassPanel>
  )
}
