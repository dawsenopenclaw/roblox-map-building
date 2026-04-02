'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { GlassPanel } from './GlassPanel'
import type { ChatMessage, ModelId, ModelOption } from '@/app/(app)/editor/hooks/useChat'
import { MODELS } from '@/app/(app)/editor/hooks/useChat'

// ─── Quick action chips ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Castle',     icon: '🏰', prompt: 'Build a medieval castle with towers and a moat' },
  { label: 'Forest',     icon: '🌲', prompt: 'Generate a dense forest biome with trees and rocks' },
  { label: 'City Block', icon: '🏙️', prompt: 'Build a city district with roads and tall buildings' },
  { label: 'Dungeon',    icon: '⚔️', prompt: 'Generate a dungeon with corridors and traps' },
  { label: 'NPC',        icon: '🧑', prompt: 'Create an NPC with patrol AI and dialogue system' },
]

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'
  const isStatus = msg.role === 'status'
  const isUpgrade = msg.role === 'upgrade'
  const isSignup = msg.role === 'signup'

  if (isStatus) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 10, padding: '4px 0' }}>
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
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="#030712">
            <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
          </svg>
        </div>
        <TypingDots />
      </div>
    )
  }

  if (isUpgrade) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif' }}>
          Token balance exhausted
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
          Upgrade your plan to keep building.
        </p>
        <a
          href="/billing"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
            color: '#030712',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          Upgrade Plan
        </a>
      </div>
    )
  }

  if (isSignup) {
    return (
      <div
        style={{
          background: 'rgba(99,60,180,0.1)',
          border: '1px solid rgba(99,60,180,0.25)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif' }}>
          Sign up for more messages
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
          Free accounts get unlimited builds.
        </p>
        <a
          href="/sign-up"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6B3CB3 0%, #8B5CF6 100%)',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          Create Free Account
        </a>
      </div>
    )
  }

  if (isSystem) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(74,222,128,0.06)',
          border: '1px solid rgba(74,222,128,0.12)',
          borderRadius: 10,
          alignSelf: 'center',
          maxWidth: '90%',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'rgba(74,222,128,0.9)', fontFamily: 'Inter, sans-serif' }}>
          {msg.content}
        </span>
      </div>
    )
  }

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '78%',
            padding: '10px 14px',
            borderRadius: '16px 16px 4px 16px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.12) 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter, sans-serif', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </p>
        {msg.tokensUsed !== undefined && (
          <span style={{ display: 'block', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
            {msg.tokensUsed.toLocaleString()} tokens
          </span>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '32px 20px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(255,184,28,0.15) 0%, rgba(212,175,55,0.08) 100%)',
            border: '1px solid rgba(255,184,28,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L16.5 9.5H23L17.5 13.5l2 6.5L14 16l-5.5 4 2-6.5L5 9.5h6.5L14 3z" fill="#FFB81C" opacity={0.9}/>
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif' }}>
          ForjeAI is ready
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
          Describe what you want to build in Roblox Studio
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 340 }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,184,28,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,184,28,0.2)'
              e.currentTarget.style.color = '#FFB81C'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
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
            <MessageBubble key={msg.id} msg={msg} />
          ))
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
        }}
      >
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
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '10px 12px',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'rgba(255,184,28,0.25)' }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
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
