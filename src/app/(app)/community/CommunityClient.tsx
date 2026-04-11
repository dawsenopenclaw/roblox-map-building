'use client'

import { useState } from 'react'
import { Users, Share2, MessageSquare, Handshake, Trophy, Bell, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: Share2,
    title: 'Share Templates',
    desc: 'Publish your best builds as reusable templates for the whole community.',
  },
  {
    icon: MessageSquare,
    title: 'Get Feedback',
    desc: 'Post your work-in-progress and get structured critiques from fellow builders.',
  },
  {
    icon: Handshake,
    title: 'Collaborate',
    desc: 'Find co-creators for your next project and build together in real time.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    desc: 'Climb the ranks. Top builds, most-used templates, fastest builders — all tracked.',
  },
]

export default function CommunityClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading' || status === 'done') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { success?: boolean; message?: string }
      if (!res.ok || !data.success) {
        setErrorMsg(data.message ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setErrorMsg('Network error — please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12 mb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow orb */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white/40" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white/40" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Creator{' '}
            <span
              className="text-[#D4AF37]"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}
            >
              Community
            </span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
            The place where ForjeGames builders connect, share work, and grow together.
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {FEATURES.map((feat) => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="group rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/35"
              style={{
                background: 'rgba(10, 14, 32, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Email signup */}
      <div
        className="rounded-xl p-6 sm:p-8 text-center"
        style={{
          background: 'rgba(10, 14, 32, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <Bell className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <h2 className="text-white font-bold text-lg mb-1">Get notified at launch</h2>
        <p className="text-gray-400 text-sm mb-5">
          Be first in when the community opens. No spam, one email.
        </p>

        {status === 'done' ? (
          <p className="text-[#D4AF37] font-semibold text-sm">
            You&apos;re on the list. We&apos;ll reach out soon.
          </p>
        ) : (
          <div className="max-w-sm mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                placeholder="your@email.com"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#D4AF37]/40 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)' }}
              >
                {status === 'loading' ? 'Sending…' : 'Notify Me'}
              </button>
            </form>
            {status === 'error' && errorMsg && (
              <p className="mt-2 text-red-400 text-xs text-left">{errorMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
