'use client'

import { useState, useEffect, useRef } from 'react'

const TOTAL_STEPS = 5
const CURRENT_STEP = 2

function ProgressBar() {
  const pct = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Step {CURRENT_STEP} of {TOTAL_STEPS}</span>
        <span className="text-xs text-[#FFB81C] font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-500 ease-out"
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
        setError(data.error || 'Something went wrong. Please try again.')
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#FFB81C]">ForjeGames</h1>
          </div>
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
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
                className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#FFB81C]">ForjeGames</h1>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
          <ProgressBar />

          <h2 className="text-xl font-bold text-white mb-2">Parent&apos;s Permission Required</h2>
          <p className="text-gray-400 text-sm mb-6">
            Since you&apos;re under 13, we need a parent or guardian to approve your account.
            This is required by US law (COPPA). We&apos;ll send them a one-click approval link.
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
                className="w-full bg-[#141414] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFB81C] transition-colors placeholder-gray-600"
              />
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-4 text-xs text-gray-400">
              <strong className="text-gray-300">What we tell your parent:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>What ForjeGames is (AI game dev platform)</li>
                <li>What data we collect (email + date of birth)</li>
                <li>How to approve or deny the account</li>
              </ul>
            </div>

            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Send Consent Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
