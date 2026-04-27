'use client'

import { useState, useEffect, useRef } from 'react'
import { ForjeLogo } from '@/components/ForjeLogo'

const TOTAL_STEPS = 5
const CURRENT_STEP = 2

function ProgressBar() {
  const pct = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Step {CURRENT_STEP} of {TOTAL_STEPS}</span>
        <span className="text-xs text-[#D4AF37] font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D4AF37] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const RESEND_COOLDOWN = 60

export default function ParentalConsentPage() {
  const [parentEmail, setParentEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function sendConsentEmail() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/parental-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Couldn't send the parental consent email. Check the address and try again.")
        return false
      }
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await sendConsentEmail()
    if (ok) {
      setSent(true)
      startCooldown()
    }
  }

  async function handleResend() {
    const ok = await sendConsentEmail()
    if (ok) startCooldown()
  }

  // ── Sent state ──────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: '#050810' }}>
        <div
          className="pointer-events-none fixed inset-0"
          aria-hidden
          style={{ background: 'radial-gradient(ellipse 600px 500px at 50% 35%, rgba(212,175,55,0.04) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl"><ForjeLogo size={28} useImage /></h1>
          </div>
          <div
            className="rounded-xl p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px rgba(212,175,55,0.03)',
            }}
          >
            <ProgressBar />
            <div className="text-5xl mb-4"><span aria-hidden="true">📧</span></div>
            <h2 className="text-xl font-bold text-white mb-3">Check your parent&apos;s email</h2>
            <p className="text-gray-300 text-sm">
              We sent a consent link to{' '}
              <strong className="text-white">{parentEmail}</strong>.{' '}
              Ask your parent or guardian to click the link to approve your account.
            </p>
            <p className="text-gray-400 text-xs mt-4">
              The link expires in 48 hours. Your account will be unlocked once they approve.
            </p>

            {error && <p role="alert" className="text-red-400 text-sm mt-4">{error}</p>}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="w-full text-black font-bold py-3 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
                  boxShadow: '0 0 24px rgba(212,175,55,0.25)',
                }}
              >
                {loading
                  ? 'Sending…'
                  : cooldown > 0
                  ? `Resend email (${cooldown}s)`
                  : 'Resend email'}
              </button>
              <button
                onClick={() => { setSent(false); setError('') }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
              >
                Wrong email? Change it
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: '#050810' }}>
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{ background: 'radial-gradient(ellipse 600px 500px at 50% 35%, rgba(212,175,55,0.04) 0%, transparent 70%)' }}
      />
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl"><ForjeLogo size={28} useImage /></h1>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px rgba(212,175,55,0.03)',
          }}
        >
          <ProgressBar />

          <h2 className="text-xl font-bold text-white mb-2">One last step — we need a grown-up</h2>
          <p className="text-gray-400 text-sm mb-6">
            We&apos;ll send a quick approval link to your parent or guardian. Once they click it, your account unlocks and you&apos;re in. No paperwork, no waiting around.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-300 mb-2">
                Parent or Guardian&apos;s Email
              </label>
              <input
                id="parentEmail"
                type="email"
                value={parentEmail}
                onChange={(e) => { setParentEmail(e.target.value); setError('') }}
                placeholder="parent@example.com"
                required
                className="w-full text-white rounded-lg px-4 py-3 focus:outline-none transition-colors placeholder-gray-600"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>

            <div
              className="rounded-lg p-4 text-xs text-gray-400"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <strong className="text-gray-300">Here&apos;s what they&apos;ll see:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>A friendly intro to ForjeGames (AI game dev platform)</li>
                <li>What we collect — just your email and birth year</li>
                <li>One button to approve, one to decline</li>
              </ul>
            </div>

            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-black font-bold py-3 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
                boxShadow: '0 0 24px rgba(212,175,55,0.25)',
              }}
            >
              {loading ? 'Sending…' : 'Send approval link'}
            </button>
          </form>
        </div>

        {/* Escape hatches */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-zinc-600">
          <a href="/onboarding/age-gate" className="hover:text-zinc-400 transition-colors">
            ← Wrong birth year?
          </a>
          <span className="text-zinc-800">·</span>
          <a href="/sign-in" className="hover:text-zinc-400 transition-colors">
            Use a different account
          </a>
        </div>
      </div>
    </div>
  )
}
