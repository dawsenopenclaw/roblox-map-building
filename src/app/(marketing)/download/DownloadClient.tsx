'use client'

import { useState } from 'react'
import Link from 'next/link'

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

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) throw new Error('Request failed')

      // Persist locally so the form stays "done" on revisit
      try {
        localStorage.setItem('waitlist_email', email.trim())
      } catch {
        // localStorage unavailable — not critical
      }

      setStatus('done')
    } catch {
      setErrorMsg('Something went wrong — try again.')
      setStatus('error')
    }
  }

  // Check if already signed up this session
  const alreadySigned =
    typeof window !== 'undefined' && !!localStorage.getItem('waitlist_email')

  return (
    <div className="flex flex-col items-center px-6 py-20 text-white">
      {/* Hero */}
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span style={{ color: '#FFB81C' }}>Forje</span>Games Desktop
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          The desktop app isn't ready yet. Sign up and we'll email you the moment it launches.
        </p>
      </div>

      {/* Waitlist form */}
      <div className="mt-10 w-full max-w-md">
        {status === 'done' || alreadySigned ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[#FFB81C44] bg-[#FFB81C0D] px-6 py-5 text-center">
            <span className="text-[#FFB81C] font-semibold text-base">You're on the list.</span>
            <span className="text-gray-300 text-sm">We'll notify you when the desktop app is ready.</span>
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-60 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              {status === 'loading' ? 'Sending…' : 'Notify Me'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-red-400 text-sm text-center">{errorMsg}</p>
        )}
      </div>

      {/* CTA — web editor */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-gray-400 text-sm">Don't want to wait?</p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 border border-white/15 hover:border-[#FFB81C] text-white hover:text-[#FFB81C] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Use the web editor now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl border-t border-white/10 my-14" />

      {/* Coming soon features */}
      <div className="w-full max-w-2xl">
        <h2 className="text-sm font-semibold text-[#FFB81C] uppercase tracking-wider mb-6 text-center">
          What the desktop app will do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {COMING_SOON_FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-4">
              <span className="text-[#FFB81C] mt-0.5 shrink-0">{f.icon}</span>
              <div>
                <p className="text-white text-sm font-medium leading-snug">{f.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl border-t border-white/10 my-14" />

      {/* Bottom web editor nudge */}
      <div className="text-center max-w-md">
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
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
