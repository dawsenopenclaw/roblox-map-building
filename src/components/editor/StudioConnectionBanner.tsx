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

  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeRef        = useRef<string>('')
  const pollIntervalRef = useRef<number>(5000)   // starts at 5 s, backs off on failure
  const pollFailsRef    = useRef<number>(0)

  // ── Stop all background timers ────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (pollRef.current)  { clearTimeout(pollRef.current);   pollRef.current  = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    // Clear code so any in-flight schedulePoll callback does not reschedule
    codeRef.current = ''
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

      // Reset backoff state for the new code
      pollIntervalRef.current = 5000
      pollFailsRef.current    = 0

      // Poll for claim — starts at 5 s, backs off to 30 s on consecutive failures.
      // Using a self-scheduling setTimeout instead of setInterval so we can
      // adjust the interval dynamically without tearing down the whole loop.
      const schedulePoll = (): void => {
        pollRef.current = setTimeout(async () => {
          try {
            const c = codeRef.current
            if (!c) return
            const sr = await fetch(`/api/studio/auth?action=status&code=${c}`)
            if (!sr.ok) {
              // Server error — back off
              pollFailsRef.current++
              pollIntervalRef.current = Math.min(
                5000 * Math.pow(2, pollFailsRef.current),
                30_000,
              )
            } else {
              // Success — reset backoff
              pollFailsRef.current    = 0
              pollIntervalRef.current = 5000
              const sd = (await sr.json()) as AuthStatusResponse
              if (sd.claimed && sd.sessionId) {
                stopAll()
                setPlaceName(sd.placeName)
                setBannerState('connected')
                onConnected?.(sd.sessionId, sd.placeName)
                return
              }
            }
          } catch {
            // Network failure — back off
            pollFailsRef.current++
            pollIntervalRef.current = Math.min(
              5000 * Math.pow(2, pollFailsRef.current),
              30_000,
            )
          }
          // Reschedule unless stopAll() was called
          if (codeRef.current) schedulePoll()
        }, pollIntervalRef.current) as unknown as ReturnType<typeof setInterval>
      }
      schedulePoll()
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
      className={`flex flex-col items-center gap-2 px-4 py-4 flex-shrink-0 transition-all duration-300 ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(10,27,60,0.95) 100%)',
        borderBottom: '2px solid rgba(212,175,55,0.3)',
      }}
      role="status"
    >
      {/* Top row: label + countdown + dismiss */}
      <div className="flex items-center gap-2 w-full">
        <svg className="w-4 h-4 text-[#FFB81C] flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 6l3-3 3 3M8 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-[#FFB81C] font-semibold">
          Enter this code in the Roblox Studio plugin
        </span>
        <div className="flex-1" />
        <span
          className="text-xs flex-shrink-0 font-mono tabular-nums"
          style={{ color: countdown < 60 ? '#ef4444' : 'rgba(212,175,55,0.5)' }}
        >
          {formatCountdown(countdown)}
        </span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex items-center justify-center w-5 h-5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* BIG CODE — the main focus */}
      <button
        onClick={handleCopy}
        title={codeCopied ? 'Copied!' : 'Click to copy code'}
        aria-label={`Pairing code ${code} — click to copy`}
        className="flex items-center gap-3 group cursor-pointer"
      >
        <div className="flex gap-2">
          {(code || '------').split('').map((char, i) => (
            <span
              key={i}
              className="flex items-center justify-center w-10 h-12 rounded-lg text-xl font-black transition-all group-hover:scale-105"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: '#FFB81C',
                background: 'rgba(255,184,28,0.08)',
                border: '2px solid rgba(255,184,28,0.25)',
                letterSpacing: '0.05em',
              }}
            >
              {char}
            </span>
          ))}
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full transition-colors"
          style={{
            background: codeCopied ? 'rgba(34,197,94,0.15)' : 'rgba(255,184,28,0.1)',
            color: codeCopied ? '#22C55E' : '#D4AF37',
            border: `1px solid ${codeCopied ? 'rgba(34,197,94,0.3)' : 'rgba(255,184,28,0.2)'}`,
          }}
        >
          {codeCopied ? 'COPIED!' : 'COPY'}
        </span>
      </button>

      {/* Bottom row: plugin download link */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-zinc-500">
          Don&apos;t have the plugin?
        </span>
        <a
          href="/api/studio/plugin"
          download="ForjeGames.rbxmx"
          className="text-[11px] text-[#FFB81C] font-semibold hover:underline underline-offset-2 transition-colors"
        >
          Download ForjeGames Plugin
        </a>
      </div>
    </div>
  )
}
