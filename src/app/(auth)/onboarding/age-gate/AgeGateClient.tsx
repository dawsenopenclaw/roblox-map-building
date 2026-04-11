'use client'

import { useState, useEffect } from 'react'
import { useSession, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { denyTracking } from '@/lib/posthog-safe'

// ─── Year picker — quick taps, no text input, COPPA compliant ─────────────────

const CURRENT_YEAR = new Date().getFullYear()

// Years from 1990 to current year (most users are 13–35)
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i)

export default function AgeGatePage() {
  const { session } = useSession()
  const { user } = useUser()
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Skip age gate for returning users who already verified
  useEffect(() => {
    if (user?.publicMetadata?.dateOfBirth || user?.unsafeMetadata?.dateOfBirth) {
      router.replace('/editor')
    }
  }, [user, router])

  async function handleContinue() {
    if (!selectedYear) {
      setError('Please select your birth year.')
      return
    }

    setLoading(true)
    setError('')

    // Use Jan 1 of selected year — we only need the year for COPPA purposes
    const dateOfBirth = new Date(`${selectedYear}-01-01T00:00:00Z`).toISOString()

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Couldn't save your age. Please try again or contact support.")
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
        // COPPA: permanently deny tracking for this browser session.
        // denyTracking() clears the age-verified flag and opts out any
        // posthog-js instance that may have been loaded before age confirmation.
        denyTracking()
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
        What year were you born? We need this to keep everyone safe.
      </p>

      {/* Year grid — tap to select */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}
      >
        <div
          className="grid grid-cols-4 gap-px overflow-y-auto"
          style={{ maxHeight: 220, background: 'rgba(255,255,255,0.04)' }}
          role="listbox"
          aria-label="Birth year"
        >
          {YEARS.map((year) => {
            const active = selectedYear === year
            return (
              <button
                key={year}
                role="option"
                aria-selected={active}
                onClick={() => { setSelectedYear(year); setError('') }}
                className="py-3 text-sm font-medium transition-all duration-100 active:scale-95"
                style={{
                  background: active
                    ? 'rgba(212,175,55,0.15)'
                    : 'transparent',
                  color: active ? '#D4AF37' : '#9CA3AF',
                  borderBottom: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected display */}
      {selectedYear && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-lg mb-4"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <span className="text-sm text-gray-300">Born in</span>
          <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>{selectedYear}</span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400 mb-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selectedYear}
        className="w-full rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: '#D4AF37',
          color: '#09090b',
          height: 40,
          boxShadow: selectedYear ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
        }}
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>

      <p className="mt-5 text-xs text-center text-zinc-600">
        Required by COPPA child safety law. We never share this.
      </p>
    </div>
  )
}
