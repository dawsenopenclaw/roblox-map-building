'use client'
/**
 * StudioConnectionBanner
 *
 * Renders at the top of the editor in two modes:
 *
 * DISCONNECTED — amber banner with plugin download link + 6-char pairing code.
 *   The code is generated once on mount and refreshed automatically when it
 *   expires.  The component polls /api/studio/auth?action=status to detect
 *   when the plugin claims the code, then transitions to CONNECTED.
 *
 * CONNECTED — compact green pill showing a dot + place name.
 *
 * Animated transitions between states via CSS transitions (no Motion dep needed
 * for this simple show/hide, but Motion is available if the parent wants it).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthGenerateResponse {
  code: string
  expiresInSeconds: number
  expiresAt: number
}

interface AuthStatusResponse {
  status: 'pending' | 'connected' | 'expired'
  claimed: boolean
  sessionId: string | null
  placeName: string | null
  placeId: string | null
  expiresAt: number
  remainingSeconds: number
}

interface StudioConnectionBannerProps {
  /** Lift the resolved sessionId up so the editor can start status polling */
  onConnected?: (sessionId: string, placeName: string | null) => void
  /** Called when user explicitly dismisses the banner */
  onDismiss?: () => void
  /** When true, the banner is not rendered (caller manages visibility) */
  hidden?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Helper: format seconds as m:ss
// ---------------------------------------------------------------------------
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioConnectionBanner({
  onConnected,
  onDismiss,
  hidden = false,
  className = '',
}: StudioConnectionBannerProps) {
  type BannerState = 'loading' | 'code' | 'connected' | 'error'

  const [bannerState, setBannerState] = useState<BannerState>('loading')
  const [code, setCode]               = useState<string>('')
  const [countdown, setCountdown]     = useState<number>(300)
  const [placeName, setPlaceName]     = useState<string | null>(null)
  const [codeCopied, setCodeCopied]   = useState(false)

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeRef      = useRef<string>('')

  // ── Stop all background timers ────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ── Generate a fresh code and start polling for claim ─────────────────────
  const generateCode = useCallback(async () => {
    setBannerState('loading')
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('generate_failed')
      const data = (await res.json()) as AuthGenerateResponse

      setCode(data.code)
      codeRef.current = data.code
      setCountdown(data.expiresInSeconds)
      setBannerState('code')

      // Countdown ticker
      timerRef.current = setInterval(() => {
        setCountdown((t) => {
          if (t <= 1) {
            stopAll()
            // Auto-regenerate when code expires
            void generateCode()
            return 0
          }
          return t - 1
        })
      }, 1000)

      // Poll for claim every 3 s
      pollRef.current = setInterval(async () => {
        try {
          const c = codeRef.current
          if (!c) return
          const sr = await fetch(`/api/studio/auth?action=status&code=${c}`)
          if (!sr.ok) return
          const sd = (await sr.json()) as AuthStatusResponse
          if (sd.claimed && sd.sessionId) {
            stopAll()
            setPlaceName(sd.placeName)
            setBannerState('connected')
            onConnected?.(sd.sessionId, sd.placeName)
          }
        } catch {
          // keep polling
        }
      }, 3000)
    } catch {
      setBannerState('error')
    }
  }, [stopAll, onConnected])

  // Generate on mount (unless already hidden/connected)
  useEffect(() => {
    if (!hidden) void generateCode()
    return stopAll
  }, [hidden, generateCode, stopAll])

  // ── Copy code to clipboard ────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }).catch(() => {/* ignore */})
  }, [code])

  // ── Don't render when hidden ──────────────────────────────────────────────
  if (hidden) return null

  // ── CONNECTED state — compact pill ───────────────────────────────────────
  if (bannerState === 'connected') {
    return (
      <div
        className={`flex items-center gap-2 px-3 h-8 transition-all duration-300 ${className}`}
        style={{
          background: 'rgba(34, 197, 94, 0.06)',
          borderBottom: '1px solid rgba(34, 197, 94, 0.15)',
        }}
        role="status"
        aria-label="Roblox Studio connected"
      >
        {/* Pulsing green dot */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <span className="text-[11px] font-medium text-green-400">
          Studio connected
          {placeName ? (
            <span className="text-green-400/60 font-normal"> — {placeName}</span>
          ) : null}
        </span>
        {/* Spacer */}
        <div className="flex-1" />
        <button
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className="flex items-center justify-center w-5 h-5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    )
  }

  // ── LOADING state ─────────────────────────────────────────────────────────
  if (bannerState === 'loading') {
    return (
      <div
        className={`flex items-center gap-2 px-3 h-8 ${className}`}
        style={{
          background: 'rgba(212,175,55,0.04)',
          borderBottom: '1px solid rgba(212,175,55,0.12)',
        }}
        role="status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse flex-shrink-0" />
        <span className="text-[11px] text-[#D4AF37]/70">Generating connection code...</span>
      </div>
    )
  }

  // ── ERROR state ───────────────────────────────────────────────────────────
  if (bannerState === 'error') {
    return (
      <div
        className={`flex items-center gap-2 px-3 h-8 ${className}`}
        style={{
          background: 'rgba(239,68,68,0.05)',
          borderBottom: '1px solid rgba(239,68,68,0.15)',
        }}
        role="alert"
      >
        <span className="text-[11px] text-red-400/80">Could not reach auth server.</span>
        <button
          onClick={() => void generateCode()}
          className="text-[11px] text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
        >
          Retry
        </button>
        <div className="flex-1" />
        <button onClick={onDismiss} aria-label="Dismiss" className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    )
  }

  // ── CODE state — main connection banner ───────────────────────────────────
  return (
    <div
      className={`flex items-center gap-3 px-3 flex-shrink-0 transition-all duration-300 ${className}`}
      style={{
        height: '36px',
        background: 'rgba(212,175,55,0.05)',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
      }}
      role="status"
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Studio icon */}
        <svg className="w-3.5 h-3.5 text-[#D4AF37]/70 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 6l3-3 3 3M8 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-[11px] text-[#D4AF37]/80 hidden sm:block font-medium whitespace-nowrap">
          Connect Roblox Studio
        </span>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch my-2 flex-shrink-0" style={{ background: 'rgba(212,175,55,0.15)' }} />

      {/* Code display */}
      <button
        onClick={handleCopy}
        title={codeCopied ? 'Copied!' : 'Click to copy code'}
        aria-label={`Pairing code ${code} — click to copy`}
        className="flex items-center gap-1.5 flex-shrink-0 group"
      >
        <span
          className="text-sm font-bold tracking-[0.3em] transition-colors group-hover:text-[#FFB81C]"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: '#D4AF37' }}
        >
          {code || '— — — — — —'}
        </span>
        <span className="text-[9px] text-[#D4AF37]/40 group-hover:text-[#D4AF37]/70 transition-colors">
          {codeCopied ? 'COPIED' : 'COPY'}
        </span>
      </button>

      {/* Countdown */}
      <span
        className="text-[10px] flex-shrink-0 font-mono tabular-nums"
        style={{ color: countdown < 60 ? '#ef4444' : 'rgba(212,175,55,0.4)' }}
        aria-label={`Code expires in ${formatCountdown(countdown)}`}
      >
        {formatCountdown(countdown)}
      </span>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Right: instructions link + dismiss */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="/docs/studio-plugin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors whitespace-nowrap hidden md:block"
        >
          Plugin download
        </a>
        <button
          onClick={onDismiss}
          aria-label="Dismiss Studio banner"
          className="flex items-center justify-center w-5 h-5 rounded text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
