'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  RefreshCw,
  Plug,
  Unplug,
  Monitor,
  Clock,
  ChevronRight,
  Terminal,
  Wifi,
  WifiOff,
  CircleDot,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioSession {
  sessionId: string
  placeName: string
  placeId: string
  lastSeen: string
  connected: boolean
  pluginVersion: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SESSIONS: StudioSession[] = [
  {
    sessionId: 'ses_1',
    placeName: 'Medieval Kingdom',
    placeId: '7291038201',
    lastSeen: '2 minutes ago',
    connected: true,
    pluginVersion: '1.0.0',
  },
  {
    sessionId: 'ses_2',
    placeName: 'Tycoon Master',
    placeId: '4820193847',
    lastSeen: '3 hours ago',
    connected: false,
    pluginVersion: '1.0.0',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCopy(text: string, delay = 2000) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), delay)
    } catch {
      // clipboard unavailable
    }
  }
  return { copied, copy }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
        <span className="text-[#D4AF37] text-sm font-bold">{number}</span>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  )
}

// ─── Section 1: Install Plugin ────────────────────────────────────────────────

function InstallSection() {
  const [showLoadstring, setShowLoadstring] = useState(false)
  const loadstring = `loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()`
  const { copied: lsCopied, copy: copyLs } = useCopy(loadstring)

  return (
    <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
      <SectionHeader
        title="Install Plugin"
        description="Get the ForjeGames plugin running in Roblox Studio."
      />

      <div className="space-y-6">
        <StepCard number={1} title="Download the ForjeGames plugin">
          <a
            href="/api/studio/plugin"
            download="ForjeGames.lua"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-[#D4AF37] hover:bg-[#c4a030] text-black transition-colors"
          >
            <Download size={14} />
            Download ForjeGames.lua
          </a>
        </StepCard>

        <StepCard number={2} title="Place it in your Plugins folder">
          <p>Copy the downloaded file to:</p>
          <div
            className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-black/40 border border-[#2a2a2a] font-mono text-xs text-gray-300 select-all"
          >
            <Terminal size={12} className="text-gray-500 flex-shrink-0" />
            %LOCALAPPDATA%\Roblox\Plugins\
          </div>
          <p className="mt-2 text-gray-500 text-xs">
            On Mac: ~/Documents/Roblox/Plugins/
          </p>
        </StepCard>

        <StepCard number={3} title="Open Roblox Studio">
          The ForjeGames button appears in the Plugins toolbar. Click it to open the connection
          dialog.
        </StepCard>
      </div>

      {/* Alternative: loadstring */}
      <div className="mt-6 pt-5 border-t border-[#2a2a2a]">
        <button
          onClick={() => setShowLoadstring((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${showLoadstring ? 'rotate-90' : ''}`}
          />
          Or install from the Studio Command Bar
        </button>

        {showLoadstring && (
          <div className="mt-3 p-3 rounded-xl bg-black/50 border border-[#2a2a2a]">
            <p className="text-xs text-gray-500 mb-2">
              Open Studio &rarr; View &rarr; Command Bar, then paste:
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs font-mono text-[#D4AF37] break-all leading-relaxed">
                {loadstring}
              </code>
              <button
                onClick={copyLs}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                  bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
              >
                {lsCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {lsCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section 2: Connection Code ───────────────────────────────────────────────

function ConnectionCodeSection() {
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'connected' | 'expired'>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { copied, copy } = useCopy(code ?? '')

  const clearPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    pollRef.current = null
    countdownRef.current = null
  }, [])

  const startPolling = useCallback(
    (generatedCode: string, expiresIn: number) => {
      const expiry = Date.now() + expiresIn * 1000
      setExpiresAt(expiry)
      setSecondsLeft(expiresIn)

      // Countdown timer
      countdownRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
        setSecondsLeft(remaining)
        if (remaining === 0) {
          clearPolling()
          setStatus('expired')
        }
      }, 1000)

      // Status poll
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/studio/auth?action=status&code=${generatedCode}`)
          if (!res.ok) return
          const data = (await res.json()) as { status: string; claimed: boolean }
          if (data.status === 'connected') {
            clearPolling()
            setStatus('connected')
          } else if (data.status === 'expired') {
            clearPolling()
            setStatus('expired')
          }
        } catch {
          // network error — keep polling
        }
      }, 3000)
    },
    [clearPolling],
  )

  useEffect(() => {
    return () => clearPolling()
  }, [clearPolling])

  async function generateCode() {
    clearPolling()
    setStatus('loading')
    setCode(null)
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as { code: string; expiresInSeconds: number }
      setCode(data.code)
      setStatus('pending')
      startPolling(data.code, data.expiresInSeconds)
    } catch {
      setStatus('idle')
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
      <SectionHeader
        title="Connection Code"
        description="Generate a code and enter it in the Roblox Studio plugin to link your session."
      />

      {/* Connected state */}
      {status === 'connected' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20 mb-5">
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
          <div>
            <p className="text-sm font-semibold text-green-300">Studio Connected</p>
            <p className="text-xs text-green-500/70 mt-0.5">
              Roblox Studio is now linked to the editor.
            </p>
          </div>
          <Check size={18} className="ml-auto text-green-400" />
        </div>
      )}

      {/* Code display */}
      {code && status !== 'connected' && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Your code
            </p>
            {status === 'pending' && expiresAt && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} />
                Expires in {formatTime(secondsLeft)}
              </span>
            )}
            {status === 'expired' && (
              <span className="text-xs text-red-400 font-medium">Expired</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex-1 flex items-center justify-center py-4 rounded-xl font-mono text-4xl
                font-bold tracking-[0.3em] border select-all"
              style={{
                background:
                  status === 'expired'
                    ? 'rgba(239,68,68,0.05)'
                    : 'rgba(212,175,55,0.06)',
                borderColor:
                  status === 'expired'
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(212,175,55,0.25)',
                color: status === 'expired' ? '#ef4444' : '#D4AF37',
                opacity: status === 'expired' ? 0.6 : 1,
              }}
            >
              {code}
            </div>
            {status !== 'expired' && (
              <button
                onClick={() => copy()}
                disabled={!code}
                className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium
                  transition-colors disabled:opacity-50"
                style={{
                  background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: copied ? 'rgba(74,222,128,0.25)' : '#2a2a2a',
                  color: copied ? '#4ade80' : '#9ca3af',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {status === 'pending' && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-xs text-gray-500">Waiting for Studio plugin to enter this code…</p>
            </div>
          )}
        </div>
      )}

      {/* Generate / Regenerate button */}
      <button
        onClick={generateCode}
        disabled={status === 'loading'}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold
          transition-all disabled:opacity-50"
        style={{
          background:
            status === 'connected'
              ? 'rgba(74,222,128,0.08)'
              : status === 'idle' || status === 'expired'
              ? 'rgba(212,175,55,0.1)'
              : 'rgba(255,255,255,0.04)',
          border: `1px solid ${
            status === 'connected'
              ? 'rgba(74,222,128,0.2)'
              : status === 'idle' || status === 'expired'
              ? 'rgba(212,175,55,0.3)'
              : '#2a2a2a'
          }`,
          color:
            status === 'connected'
              ? '#4ade80'
              : status === 'idle' || status === 'expired'
              ? '#D4AF37'
              : '#6b7280',
        }}
      >
        {status === 'loading' ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Generating…
          </>
        ) : status === 'connected' ? (
          <>
            <RefreshCw size={14} />
            Generate New Code
          </>
        ) : status === 'pending' ? (
          <>
            <RefreshCw size={14} />
            Regenerate Code
          </>
        ) : (
          <>
            <Plug size={14} />
            Generate Connection Code
          </>
        )}
      </button>

      <p className="text-xs text-gray-600 mt-3 text-center leading-relaxed">
        Open the ForjeGames plugin in Roblox Studio and enter this code in the connection dialog.
      </p>
    </section>
  )
}

// ─── Section 3: Connected Sessions ────────────────────────────────────────────

function SessionsSection() {
  const [sessions, setSessions] = useState<StudioSession[]>(DEMO_SESSIONS)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  async function handleDisconnect(sessionId: string) {
    setDisconnecting(sessionId)
    await new Promise((r) => setTimeout(r, 600))
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    setDisconnecting(null)
  }

  if (sessions.length === 0) {
    return (
      <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
        <SectionHeader
          title="Connected Sessions"
          description="Active Roblox Studio instances linked to your account."
        />
        <div className="flex flex-col items-center py-8 text-center">
          <WifiOff size={28} className="text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">No active Studio sessions.</p>
          <p className="text-xs text-gray-600 mt-1">
            Connect Studio above to start building.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
      <SectionHeader
        title="Connected Sessions"
        description="Active Roblox Studio instances linked to your account."
      />

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-[#2a2a2a]
              hover:border-white/10 transition-colors"
          >
            {/* Status dot */}
            <div className="flex-shrink-0">
              {session.connected ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Monitor size={13} className="text-gray-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-white truncate">{session.placeName}</p>
                {session.connected && (
                  <span className="flex-shrink-0 text-[10px] font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-gray-600 font-mono">
                  Place {session.placeId}
                </span>
                <span className="text-[11px] text-gray-600">
                  Last seen {session.lastSeen}
                </span>
                <span className="text-[11px] text-gray-600">
                  v{session.pluginVersion}
                </span>
              </div>
            </div>

            {/* Disconnect */}
            <button
              onClick={() => handleDisconnect(session.sessionId)}
              disabled={disconnecting === session.sessionId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-white/[0.03] hover:bg-red-500/10 border border-white/8 hover:border-red-500/20
                text-gray-500 hover:text-red-400 transition-all disabled:opacity-50"
            >
              <Unplug size={11} />
              {disconnecting === session.sessionId ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudioSettingsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back nav */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200
            transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20
              flex items-center justify-center">
              <CircleDot size={18} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Studio Connection</h1>
              <p className="text-sm text-gray-500">
                Link Roblox Studio to the ForjeGames web editor.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          <InstallSection />
          <ConnectionCodeSection />
          <SessionsSection />
        </div>

        {/* Docs link */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Wifi size={13} />
          <span>
            Need help?{' '}
            <Link href="/docs/studio" className="text-[#D4AF37] hover:underline">
              Read the Studio docs
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
