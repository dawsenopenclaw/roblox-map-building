'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AgeGatePage() {
  const router = useRouter()
  const { track } = useAnalytics()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({ dateOfBirth: new Date(dateOfBirth).toISOString() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        track('error_encountered', { errorType: 'onboarding_age_gate', message: data.error, page: '/onboarding/age-gate' })
        return
      }

      track('onboarding_step_completed', { step: 'age_gate', stepIndex: 1 })
      router.push(data.redirect)
    } catch {
      setError('Network error. Please try again.')
      track('error_encountered', { errorType: 'network_error', page: '/onboarding/age-gate' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#FFB81C]">RobloxForge</h1>
        </div>
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2">When were you born?</h2>
          <p className="text-gray-400 text-sm mb-6">Required by law (COPPA). We use this to protect younger users.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                max={today}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full bg-[#1a1f3e] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFB81C] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
