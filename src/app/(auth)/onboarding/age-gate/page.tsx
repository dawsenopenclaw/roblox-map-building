'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

const TOTAL_STEPS = 5
const CURRENT_STEP = 1

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

export default function AgeGatePage() {
  const router = useRouter()
  const { track } = useAnalytics()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Cap the max selectable date to today — prevents future-date bypass
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateOfBirth) {
      setError('Please enter your date of birth.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`).toISOString() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        track('error_encountered', {
          errorType: 'onboarding_age_gate',
          message: data.error,
          page: '/onboarding/age-gate',
        })
        return
      }

      track('onboarding_step_completed', { step: 'age_gate', stepIndex: 1 })

      // API returns: under-13 → /onboarding/parental-consent, 13+ → /onboarding/wizard
      // Override any old redirect that pointed straight to /dashboard.
      const redirect: string = data.redirect ?? (data.isUnder13 ? '/onboarding/parental-consent' : '/onboarding')
      router.push(redirect === '/dashboard' ? '/onboarding' : redirect)
    } catch {
      setError('Network error. Please try again.')
      track('error_encountered', { errorType: 'network_error', page: '/onboarding/age-gate' })
    } finally {
      setLoading(false)
    }
  }

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

          <h2 className="text-xl font-bold text-white mb-2">When were you born?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Required by law (COPPA). We use this only to protect younger users.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                min="1900-01-01"
                max={today}
                value={dateOfBirth}
                onChange={(e) => { setDateOfBirth(e.target.value); setError('') }}
                required
                className="w-full bg-[#141414] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFB81C] transition-colors [color-scheme:dark]"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
