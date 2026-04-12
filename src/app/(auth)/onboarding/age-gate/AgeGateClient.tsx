'use client'

import { useState, useEffect } from 'react'
import { useSession, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { denyTracking } from '@/lib/posthog-safe'

// ─── Year picker — big tap targets, wide range, scrollable ─────────────────────

const CURRENT_YEAR = new Date().getFullYear()

// Years from 1940 to current year. Descending so "recent" is at top (most users
// are 13–35). The previous layout was a cramped 4-col scroll that cut off at
// 1990 — anyone 35+ couldn't even pick their year.
const YEARS = Array.from({ length: CURRENT_YEAR - 1939 }, (_, i) => CURRENT_YEAR - i)

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
        denyTracking()
      }

      // Default: go straight to /editor. The wizard at /onboarding is still
      // reachable but the user asked for a frictionless path to editor, so
      // we no longer force-route everyone through the name/template/prompt
      // questions after the age gate. Under-13 users still get sent to the
      // parental-consent flow via the API response.
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
      <h1 className="text-2xl font-bold text-white mb-1">One quick thing</h1>
      <p className="text-sm text-zinc-500 mb-6">
        What year were you born? We only use this to keep everyone safe.
      </p>

      {/* Year grid — 3 cols, big tap targets. Scroll hint via gradient mask. */}
      <div
        className="relative rounded-xl mb-4 overflow-hidden"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div
          className="grid grid-cols-3 gap-2 p-2 overflow-y-auto"
          style={{ maxHeight: 260 }}
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
                type="button"
                onClick={() => { setSelectedYear(year); setError('') }}
                className="rounded-lg text-base font-semibold transition-all duration-150 active:scale-95"
                style={{
                  background: active
                    ? 'linear-gradient(180deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.12) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  color: active ? '#FFD966' : '#D1D5DB',
                  border: active
                    ? '1px solid rgba(212,175,55,0.5)'
                    : '1px solid rgba(255,255,255,0.06)',
                  padding: '14px 0',
                  boxShadow: active ? '0 0 16px rgba(212,175,55,0.2)' : 'none',
                }}
              >
                {year}
              </button>
            )
          })}
        </div>
        {/* Scroll fade at bottom to hint there's more below */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(10,13,20,0.8) 100%)',
          }}
        />
      </div>

      {/* Selected display */}
      {selectedYear && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg mb-4"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <span className="text-sm text-gray-300">Born in</span>
          <span className="text-base font-bold" style={{ color: '#D4AF37' }}>
            {selectedYear}
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400 mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selectedYear}
        className="w-full rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: '#D4AF37',
          color: '#09090b',
          height: 48,
          boxShadow: selectedYear ? '0 0 24px rgba(212,175,55,0.35)' : 'none',
        }}
      >
        {loading ? 'Saving…' : 'Continue →'}
      </button>

      <p className="mt-5 text-xs text-center text-zinc-600">
        Required by COPPA child safety law. We never share this.
      </p>
    </div>
  )
}
