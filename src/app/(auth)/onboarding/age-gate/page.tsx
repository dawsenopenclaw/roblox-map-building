'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@clerk/nextjs'

export default function AgeGatePage() {
  const { session } = useSession()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
  }, [])

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
        setLoading(false)
        return
      }

      if (data.demo) {
        window.location.href = '/editor'
        return
      }

      // Force Clerk to issue a new JWT with the updated dateOfBirth claim
      if (session) {
        try {
          await session.getToken({ skipCache: true })
        } catch {
          // fallback — hard reload will re-fetch claims
        }
      }

      if (data.isUnder13 === true) {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.opt_out_capturing()
        }).catch(() => {})
      }

      const redirect = data.redirect ?? (data.isUnder13 ? '/onboarding/parental-consent' : '/editor')

      // Hard navigation so middleware re-evaluates with fresh claims
      window.location.href = redirect
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-white mb-1">One quick thing</h1>
      <p className="text-sm text-zinc-500 mb-6">
        We need your date of birth to keep everyone safe.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="dob" className="block text-xs font-medium text-zinc-400 mb-1.5">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            min="1900-01-01"
            max={today}
            value={dateOfBirth}
            onChange={(e) => { setDateOfBirth(e.target.value); setError('') }}
            required
            autoComplete="bday"
            className="w-full rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none transition-colors [color-scheme:dark]"
            style={{
              background: '#1a1a1c',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : dateOfBirth ? 'rgba(255,184,28,0.4)' : 'rgba(255,255,255,0.08)'}`,
              height: 40,
            }}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !dateOfBirth}
          className="w-full rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: '#FFB81C',
            color: '#09090b',
            height: 40,
          }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>

      <p className="mt-5 text-xs text-center text-zinc-600">
        We collect this to comply with COPPA child safety laws.
      </p>
    </div>
  )
}
