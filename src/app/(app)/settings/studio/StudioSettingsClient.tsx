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
  /** Unix ms timestamp from the API — converted to a relative string for display */
  lastHeartbeat: number
  connected: boolean
  pluginVersion: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Unix-ms timestamp to a human-readable relative string */
function formatRelative(ms: number): string {
  const diff = Math.max(0, Date.now() - ms)
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minutes ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`
  return `${Math.floor(diff / 86_400_000)} days ago`
}

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
  const [showManual, setShowManual] = useState(false)
  const [os, setOs] = useState<'win' | 'mac'>('win')

  // Detect OS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)) {
      setOs('mac')
    }
  }, [])

  const winPath = '%LOCALAPPDATA%\\Roblox\\Plugins\\'
  const macPath = '~/Documents/Roblox/Plugins/'
  const { copied: pathCopied, copy: copyPath } = useCopy(os === 'win' ? winPath : macPath)

  return (
    <section className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
      <SectionHeader
        title="Install Plugin"
        description="Get the ForjeGames plugin running in Roblox Studio."
      />

      <div className="space-y-6">
        {/* Primary: One-click installer */}
        <StepCard number={1} title="Run the one-click installer">
          <p className="mb-3">
            Downloads and installs the plugin to your Roblox Plugins folder automatically.
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`/api/studio/installer?os=${os}`}
              download={os === 'win' ? 'install-forjegames.bat' : 'install-forjegames.sh'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                bg-[#D4AF37] hover:bg-[#E6A519] text-black transition-colors"
            >
              <Download size={14} />
              {os === 'win' ? 'Download Installer (.bat)' : 'Download Installer (.sh)'}
            </a>
            <button
              onClick={() => setOs(os === 'win' ? 'mac' : 'win')}
              className="px-3 py-2.5 rounded-xl text-xs font-medium border border-white/[0.08]
                text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
            >
              {os === 'win' ? 'Mac?' : 'Windows?'}
            </button>
          </div>
          <p className="mt-2 text-gray-600 text-xs">
            {os === 'win'
              ? 'Double-click the .bat file after downloading. It will install the plugin automatically.'
              : 'Open Terminal, run: chmod +x install-forjegames.sh && ./install-forjegames.sh'}
          </p>
        </StepCard>

        <StepCard number={2} title="Restart Roblox Studio">
          <p>Fully close and reopen Roblox Studio. The <strong className="text-white">ForjeGames</strong> button
          will appear in the Plugins toolbar.</p>
        </StepCard>

        <StepCard number={3} title="Connect">
          Click the ForjeGames button in the toolbar, then enter the connection code from the
          section below.
        </StepCard>
      </div>

      {/* Alternative: manual install */}
      <div className="mt-6 pt-5 border-t border-white/[0.08]">
        <button
          onClick={() => setShowManual((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${showManual ? 'rotate-90' : ''}`}
          />
          Or install manually
        </button>

        {showManual && (
          <div className="mt-3 p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">1. Download the plugin file:</p>
              <a
                href="/plugin/ForjeGames.rbxmx"
                download="ForjeGames.rbxmx"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 transition-colors"
              >
                <Download size={12} />
                Download ForjeGames.rbxmx
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">2. Move it to your Plugins folder:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] font-mono text-xs text-gray-300 select-all">
                  <Terminal size={12} className="text-gray-500 flex-shrink-0" />
                  {os === 'win' ? winPath : macPath}
                </div>
                <button
                  onClick={() => copyPath()}
                  className="flex-shrink-0 px-2 py-2 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-[#D4AF37] transition-colors"
                >
                  {pathCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600">3. Fully close and reopen Roblox Studio.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Error message mapping (settings page copy) ───────────────────────────────

function mapSettingsError(raw: string): { message: string; hint?: string } {
  if (/HttpService.*not enabled|HttpEnabled/i.test(raw)) {
    return {
      message: 'HTTP requests are disabled in Studio.',
      hint: 'Open Game Settings → Security → enable "Allow HTTP Requests"',
    }
  }
  if (/code_expired|code_invalid|invalid_code|expired/i.test(raw)) {
    return {
      message: 'Code expired.',
      hint: 'Click "Generate New Code" above to get a fresh one',
    }
  }
  if (/rate_limit|too many/i.test(raw)) {
    return {
      message: 'Too many attempts.',
      hint: 'Wait 60 seconds, then try again',
    }
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED|network|fetch failed/i.test(raw)) {
    return {
      message: "Can't reach ForjeGames servers.",
      hint: 'Check your internet connection and try again',
    }
  }
  return { message: raw }
}

// ─── Section 2: Connection Code ───────────────────────────────────────────────

function ConnectionCodeSection() {
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'connected' | 'expired'>('idle')
  const [errorMsg, setErrorMsg] = useState<{ message: string; hint?: string } | null>(null)
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
    setErrorMsg(null)
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'fetch failed' })) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { code: string; expiresInSeconds: number }
      setCode(data.code)
      setStatus('pending')
      startPolling(data.code, data.expiresInSeconds)
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'fetch failed'
      setErrorMsg(mapSettingsError(raw))
      setStatus('idle')
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <section className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
      <SectionHeader
        title="Connection Code"
        description="Generate a code and enter it in the Roblox Studio plugin to link your session."
      />

      {/* Connected state */}
      {status === 'connected' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/[0.08] border border-green-500/20 mb-5">
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
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
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
                  borderColor: copied ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)',
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
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <p className="text-xs text-gray-500">Waiting for Studio plugin to enter this code…</p>
            </div>
          )}
        </div>
      )}

      {/* Actionable error banner */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20">
          <p className="text-sm font-semibold text-red-400">{errorMsg.message}</p>
          {errorMsg.hint && (
            <p className="text-xs text-red-400/70 mt-0.5">{errorMsg.hint}</p>
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
              : 'rgba(255,255,255,0.08)'
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

// ─── Connection quality badge ─────────────────────────────────────────────────

function QualityDot({ connected, latencyMs }: { connected: boolean; latencyMs?: number | null }) {
  if (!connected) {
    return <div className="w-2.5 h-2.5 rounded-full bg-gray-600" title="Disconnected" />
  }
  const isHighLatency = typeof latencyMs === 'number' && latencyMs > 100
  return (
    <div className="relative w-2.5 h-2.5 flex-shrink-0" title={latencyMs != null ? `${latencyMs}ms` : 'Connected'}>
      <div
        className={`absolute inset-0 rounded-full animate-ping opacity-60 ${isHighLatency ? 'bg-yellow-400' : 'bg-green-400'}`}
      />
      <div
        className={`relative w-2.5 h-2.5 rounded-full ${isHighLatency ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' : 'bg-green-400 shadow-[0_0_6px_#4ade80]'}`}
      />
    </div>
  )
}

// ─── Section 3: Connected Sessions ────────────────────────────────────────────

function SessionIdCopy({ sessionId }: { sessionId: string }) {
  const { copied, copy } = useCopy(sessionId)
  const short = sessionId.length > 12 ? `${sessionId.slice(0, 6)}…${sessionId.slice(-4)}` : sessionId
  return (
    <button
      onClick={() => copy()}
      title={`Copy session ID: ${sessionId}`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/[0.04] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-gray-500 border border-white/[0.06] hover:border-[#D4AF37]/30 transition-colors"
    >
      <span>{short}</span>
      {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
    </button>
  )
}

function SessionsSection() {
  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [latencyMap, setLatencyMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Fetch real sessions on mount and refresh every 5 s while the tab is open
  useEffect(() => {
    let cancelled = false

    async function fetchSessions() {
      const t0 = Date.now()
      try {
        const res = await fetch('/api/studio/sessions')
        const rtt = Date.now() - t0
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { sessions: StudioSession[] }
        if (!cancelled) {
          setSessions(data.sessions)
          // Apply the same measured RTT to all connected sessions as a proxy
          const map: Record<string, number> = {}
          data.sessions.forEach((s) => { if (s.connected) map[s.sessionId] = rtt })
          setLatencyMap(map)
        }
      } catch {
        // Network error — keep showing last known state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSessions()
    const interval = setInterval(() => { void fetchSessions() }, 5_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  async function handleDisconnect(sessionId: string) {
    setDisconnecting(sessionId)
    // Optimistically remove from local list; the session will also expire
    // naturally after its TTL once the plugin stops heartbeating.
    await new Promise((r) => setTimeout(r, 400))
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    setDisconnecting(null)
  }

  if (loading) {
    return (
      <section className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
        <SectionHeader
          title="Connected Sessions"
          description="Active Roblox Studio instances linked to your account."
        />
        <div className="flex flex-col items-center py-8 text-center">
          <RefreshCw size={22} className="text-gray-600 mb-3 animate-spin" />
          <p className="text-sm text-gray-500">Loading sessions…</p>
        </div>
      </section>
    )
  }

  if (sessions.length === 0) {
    return (
      <section className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
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
    <section className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
      <SectionHeader
        title="Connected Sessions"
        description="Active Roblox Studio instances linked to your account."
      />

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.08]
              hover:border-[#D4AF37]/20 transition-colors"
          >
            {/* Connection quality dot */}
            <QualityDot
              connected={session.connected}
              latencyMs={latencyMap[session.sessionId]}
            />

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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <SessionIdCopy sessionId={session.sessionId} />
                <span className="text-[11px] text-gray-600 font-mono">
                  Place {session.placeId}
                </span>
                <span className="text-[11px] text-gray-600">
                  Last seen {formatRelative(session.lastHeartbeat)}
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
                bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20
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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4AF37]
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Studio Connection</h1>
              <p className="text-sm text-gray-400">
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
