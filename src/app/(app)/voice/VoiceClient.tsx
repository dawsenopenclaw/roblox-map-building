'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Command, MessageSquare, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVoiceInput } from '@/hooks/useVoiceInput'

// ─── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Command,
    title: 'Voice Commands',
    desc: 'Rotate, scale, delete, undo — all hands-free. Stay in flow.',
  },
  {
    icon: MessageSquare,
    title: 'Natural Language',
    desc: 'No special syntax. Talk like you would to a teammate.',
  },
  {
    icon: Zap,
    title: 'Real-time',
    desc: 'Changes stream into the editor as you speak.',
  },
]

// ─── Animated waveform bars ───────────────────────────────────────────────────

const BAR_COUNT = 24

function Waveform({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.15))
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (active) {
      frameRef.current = setInterval(() => {
        setBars(Array.from({ length: BAR_COUNT }, (_, i) => {
          const t = Date.now() / 600
          const wave = Math.sin(t + i * 0.45) * 0.4 + 0.5
          const jitter = Math.random() * 0.25
          return Math.min(1, Math.max(0.08, wave + jitter))
        }))
      }, 60)
    } else {
      if (frameRef.current) clearInterval(frameRef.current)
      // Animate back to idle
      frameRef.current = setInterval(() => {
        setBars(prev => prev.map((b, i) => {
          const t = Date.now() / 1200
          const idle = Math.sin(t + i * 0.5) * 0.12 + 0.18
          return b + (idle - b) * 0.15
        }))
      }, 80)
    }
    return () => { if (frameRef.current) clearInterval(frameRef.current) }
  }, [active])

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 48 }} aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: `${h * 48}px`,
            background: active
              ? `rgba(212,175,55,${0.4 + h * 0.6})`
              : `rgba(212,175,55,${0.15 + h * 0.3})`,
            transition: active ? 'height 0.06s ease, background 0.06s ease' : 'height 0.12s ease, background 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Mic icon ─────────────────────────────────────────────────────────────────

function MicIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VoiceClient() {
  const router = useRouter()
  const [recentTranscripts, setRecentTranscripts] = useState<string[]>([])
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  const { isListening, state, transcript, interimTranscript, startListening, stopListening, isSupported, error } =
    useVoiceInput({
      autoSubmit: false,
      pauseMs: 2000,
      onTranscript: (text) => {
        if (text.trim()) {
          setRecentTranscripts(prev => [text.trim(), ...prev].slice(0, 5))
        }
      },
    })

  // Check mic permission on mount
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setPermissionState(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown')
        result.onchange = () => {
          setPermissionState(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown')
        }
      })
      .catch(() => { /* permissions API not available */ })
  }, [])

  const isProcessing = state === 'processing'
  const displayText = transcript || interimTranscript || ''
  const hasInterim = Boolean(interimTranscript && !transcript.endsWith(interimTranscript))

  // Send transcript to editor
  const sendToEditor = (text: string) => {
    if (!text.trim()) return
    const encoded = encodeURIComponent(text.trim())
    router.push(`/editor?voice=${encoded}`)
  }

  return (
    <div className="max-w-2xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Hero card */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-10 mb-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Waveform */}
          <Waveform active={isListening} />

          {/* Mic button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported || isProcessing}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
            aria-pressed={isListening}
            className="relative flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isListening
                ? 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
              border: `2px solid ${isListening ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.25)'}`,
              boxShadow: isListening
                ? '0 0 40px rgba(212,175,55,0.25), 0 0 80px rgba(212,175,55,0.08)'
                : '0 0 20px rgba(212,175,55,0.08)',
            }}
          >
            {/* Pulse ring when listening */}
            {isListening && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl"
                style={{
                  border: '2px solid rgba(212,175,55,0.4)',
                  animation: 'voicePulse 1.5s ease-out infinite',
                }}
              />
            )}
            <span
              style={{
                color: isListening ? '#D4AF37' : isProcessing ? '#D4AF37' : 'rgba(212,175,55,0.7)',
                transition: 'color 0.2s',
              }}
            >
              {isProcessing ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"
                    style={{ animation: 'spin 0.8s linear infinite' }} />
                </svg>
              ) : (
                <MicIcon size={28} />
              )}
            </span>
          </button>

          {/* Status text */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {isListening ? (
                <span style={{ color: '#D4AF37' }}>Listening…</span>
              ) : isProcessing ? (
                <span style={{ color: '#D4AF37' }}>Processing…</span>
              ) : (
                <>Voice <span style={{ color: '#D4AF37' }}>Builder</span></>
              )}
            </h1>
            <p className="text-sm text-gray-400">
              {!isSupported
                ? 'Speech recognition is not supported in this browser. Try Chrome or Edge.'
                : permissionState === 'denied'
                  ? 'Microphone access denied. Allow it in browser settings and refresh.'
                  : isListening
                    ? 'Speak now — pauses 2s to capture your command'
                    : 'Click the mic and describe what you want to build'}
            </p>
          </div>

          {/* Live transcript */}
          {(isListening || displayText) && (
            <div
              className="w-full rounded-xl px-4 py-3 text-left min-h-[52px]"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              {displayText ? (
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span>{transcript}</span>
                  {hasInterim && (
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Speak now…
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{
              color: '#F87171',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {error}
            </p>
          )}

          {/* Action buttons after capture */}
          {transcript && !isListening && (
            <div className="flex gap-3 w-full">
              <button
                onClick={() => sendToEditor(transcript)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-100"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)', color: '#050810' }}
              >
                Send to Editor
              </button>
              <button
                onClick={startListening}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Record Again
              </button>
            </div>
          )}

          {/* Tip: use mic in editor */}
          {!isListening && !transcript && (
            <p className="text-xs text-gray-600">
              You can also click the mic icon inside the editor to record in-context
            </p>
          )}
        </div>
      </div>

      {/* Recent transcripts */}
      {recentTranscripts.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Recent
          </p>
          <div className="flex flex-col gap-2">
            {recentTranscripts.map((t, i) => (
              <button
                key={i}
                onClick={() => sendToEditor(t)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'rgba(212,175,55,0.5)' }}>
                  <rect x="3" y="1" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 6a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="7" y1="9" x2="7" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="text-sm text-gray-300 truncate">{t}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className="ml-auto flex-shrink-0" style={{ color: 'rgba(212,175,55,0.4)' }}>
                  <path d="M10 6L2 6M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {FEATURES.map((feat) => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="rounded-xl p-4 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Open Editor
        </Link>
      </div>

      <style>{`
        @keyframes voicePulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
