'use client'

import { useState } from 'react'

export default function ParentalConsentPage() {
  const [parentEmail, setParentEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-8 shadow-xl">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-3">Check your parent&apos;s email</h2>
            <p className="text-gray-400 text-sm">
              We sent a consent link to <strong className="text-white">{parentEmail}</strong>. Ask your parent or guardian to click the link to approve your account.
            </p>
            <p className="text-gray-500 text-xs mt-4">The link expires in 48 hours. Your account will be unlocked once they approve.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#FFB81C]">RobloxForge</h1>
        </div>
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2">Parent&apos;s Permission Required</h2>
          <p className="text-gray-400 text-sm mb-6">
            Since you&apos;re under 13, we need a parent or guardian to approve your account. This is required by US law (COPPA). We&apos;ll send them a one-click approval link.
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
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                className="w-full bg-[#1a1f3e] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FFB81C] transition-colors placeholder-gray-600"
              />
            </div>

            <div className="bg-[#0A0E27] rounded-lg p-4 text-xs text-gray-500">
              <strong className="text-gray-400">What we tell your parent:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>What RobloxForge is (AI game dev platform)</li>
                <li>What data we collect (email + DOB)</li>
                <li>How to approve or deny the account</li>
              </ul>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Consent Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
