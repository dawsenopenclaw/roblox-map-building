'use client'

/**
 * /connect — One-click Roblox Studio plugin connection page.
 *
 * Flow:
 *  1. Auto-generates a 6-char code on mount.
 *  2. Polls /api/studio/auth?action=status&code=XXXXXX for plugin claim.
 *  3. On claim: shows success animation + redirect to /editor.
 *  4. "Already have the plugin?" skip button jumps to code entry immediately.
 *  5. Download button fetches /api/studio/plugin.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'ready' | 'connected' | 'connecting'

interface CodeStatus {
  status: 'pending' | 'connected' | 'expired'
  claimed: boolean
  sessionId: string | null
  placeName: string | null
  remainingSeconds: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const REDIRECT_DELAY_MS = 2_500
const POLL_INTERVAL_MS  = 2_000
const CODE_TTL_SECS     = 300

// ── Sub-components ─────────────────────────────────────────────────────────

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        background: done ? '#10b981' : '#D4AF37',
        color:      done ? '#fff'    : '#000',
      }}
    >
      {done ? '✓' : n}
    </span>
  )
}

function PulseDot({ color = '#D4AF37' }: { color?: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{
        background: color,
        animation:  'fj-pulse 1.4s ease-in-out infinite',
      }}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ConnectPage() {
  const router = useRouter()

  const [phase,            setPhase]            = useState<Phase>('loading')
  const [code,             setCode]             = useState<string>('')
  const [expiresAt,        setExpiresAt]        = useState<number>(0)
  const [remaining,        setRemaining]        = useState<number>(CODE_TTL_SECS)
  const [connectedPlace,   setConnectedPlace]   = useState<string | null>(null)
  const [downloadClicked,  setDownloadClicked]  = useState(false)
  const [codeError,        setCodeError]        = useState<string | null>(null)
  const [regenerating,     setRegenerating]     = useState(false)

  const pollTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Generate a fresh code from the server
  const generateCode = useCallback(async () => {
    setRegenerating(true)
    setCodeError(null)
    try {
      const res  = await fetch('/api/studio/auth?action=generate')
      const data = (await res.json()) as { code: string; expiresAt: number; expiresInSeconds: number }
      setCode(data.code)
      setExpiresAt(data.expiresAt)
      setRemaining(data.expiresInSeconds ?? CODE_TTL_SECS)
      setPhase('ready')
    } catch {
      setCodeError('Failed to generate code. Check your connection.')
    } finally {
      setRegenerating(false)
    }
  }, [])

  // Countdown timer for code expiry
  const startCountdown = useCallback((exp: number) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    countdownTimerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((exp - Date.now()) / 1000))
      setRemaining(secs)
      if (secs === 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        // Auto-regenerate
        void generateCode()
      }
    }, 1_000)
  }, [generateCode])

  // Poll for plugin claim
  const startPolling = useCallback((activeCode: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)

    const check = async () => {
      if (!activeCode) return
      try {
        const res  = await fetch(`/api/studio/auth?action=status&code=${encodeURIComponent(activeCode)}`)
        const data = (await res.json()) as CodeStatus
        if (data.status === 'connected' && data.claimed) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          setConnectedPlace(data.placeName)
          setPhase('connected')
          setTimeout(() => {
            router.push(data.sessionId ? `/editor?session=${data.sessionId}` : '/editor')
          }, REDIRECT_DELAY_MS)
        } else if (data.status === 'expired') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          void generateCode()
        }
      } catch {
        // silent — keep polling
      }
    }

    void check()
    pollTimerRef.current = setInterval(check, POLL_INTERVAL_MS)
  }, [generateCode, router])

  // Init
  useEffect(() => {
    void generateCode()
    return () => {
      if (pollTimerRef.current)      clearInterval(pollTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [generateCode])

  // When code changes, restart countdown + polling
  useEffect(() => {
    if (!code || phase === 'connected') return
    startCountdown(expiresAt)
    startPolling(code)
  }, [code, expiresAt, phase, startCountdown, startPolling])

  const fmtRemaining = () => {
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes fj-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes fj-success {
          0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes fj-spin {
          to { transform: rotate(360deg); }
        }
        .fj-code-letter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 60px;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 26px;
          font-weight: 700;
          color: #D4AF37;
          letter-spacing: 0;
        }
      `}</style>

      <div className="flex min-h-screen flex-col items-center bg-gray-950 px-6 py-14">

        {/* Logo */}
        <div
          className="mb-1 text-3xl font-bold"
          style={{ color: '#D4AF37', letterSpacing: '-0.5px' }}
        >
          ForjeGames
        </div>
        <p className="mb-12 text-sm" style={{ color: '#555' }}>
          Connect Roblox Studio to your editor
        </p>

        {/* ── Success state ── */}
        {phase === 'connected' && (
          <div
            className="mb-8 w-full max-w-lg rounded-2xl border p-8 text-center"
            style={{
              background:    '#0d2b1e',
              borderColor:   '#10b981',
              animation:     'fj-success 0.4s ease forwards',
            }}
          >
            <div className="mb-3 text-5xl">✓</div>
            <h2 className="mb-1 text-xl font-bold" style={{ color: '#10b981' }}>
              Connected!
            </h2>
            <p className="text-sm" style={{ color: '#6ee7b7' }}>
              {connectedPlace
                ? `Linked to "${connectedPlace}". Redirecting to editor…`
                : 'Plugin connected. Redirecting to editor…'}
            </p>
          </div>
        )}

        {/* ── Main card ── */}
        {phase !== 'connected' && (
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border"
            style={{ background: '#111', borderColor: '#1e1e1e' }}
          >
            {/* Card header */}
            <div className="border-b px-7 py-6" style={{ borderColor: '#1a1a1a' }}>
              <h1 className="text-lg font-bold text-white">
                Connect Roblox Studio
              </h1>
              <p className="mt-1 text-sm" style={{ color: '#555' }}>
                3 steps — takes about 2 minutes on first setup
              </p>
            </div>

            {/* Steps */}
            <div className="divide-y px-7" style={{ borderColor: '#191919' }}>

              {/* Step 1 — Download */}
              <div className="flex gap-5 py-6">
                <StepBadge n={1} done={downloadClicked} />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 font-semibold text-white">
                    Download the plugin
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: '#666' }}>
                    Download <code style={{ color: '#D4AF37', fontSize: 12 }}>ForjeGames.lua</code> — a single file that connects Studio to your editor.
                  </p>
                  <a
                    href="/api/studio/plugin"
                    download="ForjeGames.lua"
                    onClick={() => setDownloadClicked(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-opacity hover:opacity-85"
                    style={{ background: '#D4AF37', color: '#000' }}
                  >
                    ↓ Download ForjeGames.lua
                  </a>
                </div>
              </div>

              {/* Step 2 — Install */}
              <div className="flex gap-5 py-6">
                <StepBadge n={2} done={false} />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 font-semibold text-white">
                    Place it in your Plugins folder
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: '#666' }}>
                    Move the file to the right folder, then <strong className="text-white">fully close and reopen Roblox Studio</strong>.
                  </p>

                  <div className="mb-3 space-y-2 text-sm">
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#0d0d0d', border: '1px solid #222' }}
                    >
                      <span className="mr-2 text-xs font-bold uppercase" style={{ color: '#555' }}>Windows</span>
                      <code style={{ color: '#D4AF37', fontSize: 11, fontFamily: 'monospace' }}>
                        %LOCALAPPDATA%\Roblox\Plugins\ForjeGames.lua
                      </code>
                    </div>
                    <div
                      className="rounded-lg p-3"
                      style={{ background: '#0d0d0d', border: '1px solid #222' }}
                    >
                      <span className="mr-2 text-xs font-bold uppercase" style={{ color: '#555' }}>Mac</span>
                      <code style={{ color: '#D4AF37', fontSize: 11, fontFamily: 'monospace' }}>
                        ~/Documents/Roblox/Plugins/ForjeGames.lua
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 — Enter code */}
              <div className="flex gap-5 py-6">
                <StepBadge n={3} done={false} />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 font-semibold text-white">
                    Enter this code in Studio
                  </h2>
                  <p className="mb-5 text-sm leading-relaxed" style={{ color: '#666' }}>
                    In Roblox Studio, click the <strong style={{ color: '#D4AF37' }}>ForjeGames</strong> toolbar button, then type this code:
                  </p>

                  {/* Code display */}
                  {phase === 'loading' || regenerating ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-5 w-5 rounded-full border-2"
                        style={{
                          borderColor:       '#D4AF37 transparent transparent transparent',
                          animation:         'fj-spin 0.7s linear infinite',
                        }}
                      />
                      <span className="text-sm" style={{ color: '#555' }}>
                        Generating code…
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex gap-2">
                        {code.split('').map((char, i) => (
                          <div key={i} className="fj-code-letter">{char}</div>
                        ))}
                      </div>

                      <div className="mb-4 flex items-center gap-3 text-xs" style={{ color: '#555' }}>
                        <PulseDot />
                        <span>Waiting for Studio connection…</span>
                        <span
                          className="ml-auto font-mono"
                          style={{ color: remaining < 60 ? '#ef4444' : '#555' }}
                        >
                          {fmtRemaining()}
                        </span>
                        <button
                          onClick={() => void generateCode()}
                          className="underline transition-colors hover:text-white"
                          style={{ color: '#555' }}
                        >
                          New code
                        </button>
                      </div>
                    </>
                  )}

                  {codeError && (
                    <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>
                      {codeError}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Skip link */}
        {phase !== 'connected' && (
          <p className="mt-6 text-sm" style={{ color: '#444' }}>
            Already have the plugin?{' '}
            <a href="/editor" className="underline transition-colors hover:text-white" style={{ color: '#555' }}>
              Go to the editor →
            </a>
          </p>
        )}

      </div>
    </>
  )
}
