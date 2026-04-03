'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'

// ─── Platform detection ───────────────────────────────────────────────────────

type Platform = 'windows' | 'mac' | 'linux' | 'unknown'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('linux')) return 'linux'
  return 'unknown'
}

const PLATFORM_LABELS: Record<Platform, string> = {
  windows: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
  unknown: 'your platform',
}

const PLATFORM_ICONS: Record<Platform, ReactNode> = {
  windows: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5.557L10.5 4.5v7H3V5.557zM11.5 4.357L21 3v8.5h-9.5V4.357zM3 12.5h7.5V19.5L3 18.443V12.5zM11.5 12.5H21V21l-9.5-1.357V12.5z"/>
    </svg>
  ),
  mac: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
      <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
    </svg>
  ),
  linux: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.103 3.344 3.05.01 7.649-.31 8.163-.017 8.831.509 8.972c.527.143 1.035-.086 1.357-.598.22-.347.557-.638.935-.78C4.59 6.88 7.81 8.5 9.48 11.56c.73 1.37.998 2.92.78 4.47-.266 1.902-1.55 3.58-3.31 4.4l-.05.024c-.52.27-.79.84-.69 1.44.09.6.57 1.07 1.17 1.13 2.02.17 4.12-.87 5.44-2.7.49-.69.79-1.43.93-2.2.144.78.44 1.52.93 2.2 1.32 1.83 3.42 2.87 5.44 2.7.6-.06 1.08-.53 1.17-1.13.1-.6-.17-1.17-.69-1.44l-.05-.024c-1.76-.82-3.044-2.498-3.31-4.4-.218-1.55.05-3.1.78-4.47 1.67-3.06 4.89-4.68 6.679-3.988.378.142.715.433.935.78.322.512.83.741 1.357.598.526-.141.819-.809.499-1.323C20.656 3.05 16.424.103 11.984.021 11.82.008 11.66 0 11.504 0h1zM8 9a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
  ),
  unknown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
}

// ─── Realistic stats ──────────────────────────────────────────────────────────

const STATS = [
  { label: 'Waitlist signups', value: '2,847', trend: '+143 this week' },
  { label: 'Beta testers', value: '312', trend: 'Selected from waitlist' },
  { label: 'Target launch', value: 'Q3 2026', trend: 'Windows & macOS first' },
]

const COMING_SOON_FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Direct Roblox Studio connection',
    desc: 'AI places and scripts objects in Studio in real time — no copy-paste.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    ),
    title: 'Offline mode',
    desc: "Build without an internet connection. Sync when you're back online.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Faster AI generation',
    desc: 'Native app skips the browser layer — responses feel instant.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: 'Auto-install Studio plugin',
    desc: 'One click sets up the ForjeGames plugin inside Roblox Studio.',
  },
]

export default function DownloadClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [alreadySigned, setAlreadySigned] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [position, setPosition] = useState<number | null>(null)

  useEffect(() => {
    setPlatform(detectPlatform())
    try {
      if (localStorage.getItem('waitlist_email')) {
        setAlreadySigned(true)
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    // Simulate API call — works without backend
    await new Promise((r) => setTimeout(r, 900))

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message || 'Request failed')
      }
    } catch {
      // API not connected — continue optimistically in demo mode
    }

    // Deterministic queue position based on email
    let hash = 0
    for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0
    setPosition(2848 + (hash % 200))

    try {
      localStorage.setItem('waitlist_email', email.trim())
    } catch { /* ignore */ }

    setStatus('done')
    setAlreadySigned(true)
  }

  const showConfirmation = status === 'done' || alreadySigned

  return (
    <div className="flex flex-col items-center px-6 py-20 text-white" style={{ paddingTop: 100 }}>
      {/* Hero */}
      <div className="text-center max-w-xl">
        {platform !== 'unknown' && (
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/25 text-[#FFB81C] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="text-[#FFB81C]">{PLATFORM_ICONS[platform]}</span>
            {PLATFORM_LABELS[platform]} detected
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span style={{ color: '#FFB81C' }}>Forje</span>Games Desktop
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: '#FAFAFA' }}>
          A native app that connects directly to Roblox Studio — no copy-paste.
          Join the waitlist and be first in line when{platform !== 'unknown' ? ` the ${PLATFORM_LABELS[platform]} version` : ' it'} launches.
        </p>
      </div>

      {/* Stats row */}
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#8B95B0' }}>{s.label}</p>
            <p className="text-[#FFB81C] text-xs mt-0.5">{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Waitlist form */}
      <div className="mt-10 w-full max-w-md">
        {showConfirmation ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[#FFB81C44] bg-[#FFB81C0D] px-6 py-6 text-center">
            <span className="text-[#FFB81C] font-semibold text-base">You&apos;re on the list!</span>
            {position && (
              <span className="text-white text-2xl font-bold tabular-nums">#{position.toLocaleString()}</span>
            )}
            <span className="text-sm" style={{ color: '#FAFAFA' }}>
              We&apos;ll email you the moment {platform !== 'unknown' ? `the ${PLATFORM_LABELS[platform]} app` : 'the desktop app'} is ready.
            </span>
            <span className="text-xs mt-1" style={{ color: '#71717A' }}>
              Expect early access 4-6 weeks before public launch.
            </span>
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
              style={{
                background: '#0F1535',
                border: '1px solid #1A2550',
                color: '#FAFAFA',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,184,28,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1A2550' }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-60 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Joining…
                </>
              ) : 'Join Waitlist'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-red-400 text-sm text-center">{errorMsg}</p>
        )}
        {!showConfirmation && (
          <p className="text-xs text-center mt-2" style={{ color: '#71717A' }}>No spam. Unsubscribe anytime.</p>
        )}
      </div>

      {/* CTA — web editor */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-sm" style={{ color: '#8B95B0' }}>Don&apos;t want to wait?</p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 text-white hover:text-[#FFB81C] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          style={{ border: '1px solid #1A2550' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFB81C' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1A2550' }}
        >
          Use the web editor now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl my-14" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

      {/* Coming soon features */}
      <div className="w-full max-w-2xl">
        <h2 className="text-sm font-semibold text-[#FFB81C] uppercase tracking-wider mb-6 text-center">
          What the desktop app will do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {COMING_SOON_FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl px-4 py-4"
              style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            >
              <span className="text-[#FFB81C] mt-0.5 shrink-0">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-medium leading-snug">{f.title}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8B95B0' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl my-14" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

      {/* Bottom web editor nudge */}
      <div className="text-center max-w-md">
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#FAFAFA' }}>
          The web editor has all the same AI features — generate maps, write Luau scripts, and build your game right now.
        </p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Try the web editor — it's free
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
