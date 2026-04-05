'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GlassPanel } from './GlassPanel'
import type { ChatMessage, MeshResult, ModelId, ModelOption } from '@/app/(app)/editor/hooks/useChat'
import { MODELS } from '@/app/(app)/editor/hooks/useChat'
import { McpToolCard, type McpToolResult } from './McpToolCard'
import { McpToolbar } from './McpToolbar'
import { ModelPreview } from './ModelPreview'

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
  const [tokensUsed, setTokensUsed] = useState(GUEST_TOKEN_LIMIT)

  useEffect(() => {
    const stored = Number(localStorage.getItem('fg_guest_tokens') ?? GUEST_TOKEN_LIMIT)
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
              background: 'linear-gradient(90deg, #D4AF37 0%, #FFB81C 100%)',
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
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
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

function MessageBubble({
  msg,
  onRetry,
  onBuildDifferently,
  onDismiss,
  onEditAndResend,
  onSendToStudio,
}: {
  msg: ChatMessage
  onRetry?: () => void
  onBuildDifferently?: () => void
  onDismiss?: (id: string) => void
  onEditAndResend?: (id: string, newContent: string) => void
  onSendToStudio?: (luauCode: string) => void
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
              : 'linear-gradient(135deg, #D4AF37 0%, #FF6B35 100%)',
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
          {msg.content || 'Your AI token balance is empty. Get more tokens to keep building.'}
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
                  color: 'white',
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
              <p style={{ margin: 0, fontSize: 14, color: 'white', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.streaming ? stripCodeBlocksForDisplay(msg.content) : msg.content}
        </p>
        {!msg.streaming && msg.meshResult && (
          <MeshResultCard mesh={msg.meshResult} onSendToStudio={onSendToStudio} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {msg.hasCode && (
            <CodePreviewBadge luauCode={msg.luauCode} />
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

// ─── Code Preview Badge ──────────────────────────────────────────────────────

function CodePreviewBadge({ luauCode }: { luauCode?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

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
          background: 'rgba(34,197,94,0.15)',
          color: 'rgba(34,197,94,0.8)',
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
        Built in Studio
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
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
              Luau
            </span>
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
          {/* Code */}
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

function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 20,
        padding: '0 20px 28px',
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
          What do you want to build?
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
          Describe anything — terrain, buildings, cities, props
        </p>
      </div>

      {/* Template cards — one click sends immediately */}
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
              color: '#D4AF37',
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
                  <span style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(212,175,55,0.15)', color: '#D4AF37', fontSize: 9, fontWeight: 700 }}>
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
}: ChatPanelProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const taRef = externalRef ?? internalRef
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Model selector visibility — hidden behind gear by default, shown after first message
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  // Extra input controls (image + voice) — hidden until user has messages or expands
  const [inputExtrasOpen, setInputExtrasOpen] = useState(false)

  const handleVoiceResult = useCallback((text: string) => {
    setInput(input ? `${input} ${text}` : text)
  }, [setInput, input])

  const { listening, supported: speechSupported, toggle: toggleSpeech } = useSpeech(handleVoiceResult)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Once messages appear, keep extras accessible
  const hasMessages = messages.length > 0
  useEffect(() => {
    if (hasMessages) setInputExtrasOpen(true)
  }, [hasMessages])

  const [sendPressed, setSendPressed] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <GlassPanel
      padding="none"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* MCP Toolbar — always visible at the top */}
      {/* McpToolbar hidden — keep UI clean */}

      {/* Messages area — hidden in compact mode */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: compact ? '0' : hasMessages ? '20px 16px' : '0',
          display: compact ? 'none' : 'flex',
          flexDirection: 'column',
          gap: 16,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.06) transparent',
          background: 'linear-gradient(180deg, rgba(12,16,36,0.15) 0%, rgba(8,12,28,0.35) 100%)',
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
              onEditAndResend={onEditAndResend}
              onSendToStudio={onSendToStudio}
            />
          ))
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

        {/* Tip of the day — dismissable, shown for first 10 sessions */}
        <TipOfTheDay />

        {/* Textarea + actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.03)',
            borderRadius: 14,
            padding: '10px 12px',
            transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212,175,55,0.15), 0 0 16px rgba(212,175,55,0.08)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
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

          {/* Image upload — only shown when extras open */}
          {inputExtrasOpen && (
            <label
              title="Upload an image"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
                animation: 'msgFadeUp 0.15s ease-out forwards',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
                  e.currentTarget.style.color = '#D4AF37'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="4.5" cy="5.5" r="1.25" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M1.5 10l3-3.5 2.5 2.5 2-1.5L13 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setInput(input ? `${input}\n[Uploaded: ${file.name}]` : `[Uploaded: ${file.name}] Describe what to build from this image`)
                  e.target.value = ''
                }}
              />
            </label>
          )}

          {/* Voice button — only shown when extras open */}
          {inputExtrasOpen && speechSupported && (
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
                animation: 'msgFadeUp 0.15s ease-out forwards',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 7.5a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M7 12.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}

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
                  : 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
              color: !input.trim() || loading ? 'rgba(255,255,255,0.2)' : '#030712',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: !input.trim() || loading ? 'none' : '0 0 12px rgba(212,175,55,0.3)',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6 }}>
            {/* Left: gear icon opens model selector inline */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setModelSelectorOpen((v) => !v)}
                title="Model settings"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
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

            {/* Right: hints + char count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                }}>
                  /build · /script · /terrain
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
    </GlassPanel>
  )
}
