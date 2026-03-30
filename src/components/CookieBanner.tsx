'use client'

import { useState, useEffect } from 'react'

export const COOKIE_CONSENT_KEY = 'forje_cookie_consent'

export type ConsentValue = 'accepted' | 'essential'

/** Returns true only when the user has explicitly accepted all cookies. */
export function hasCookieConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(true)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [showCustomise, setShowCustomise] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage unavailable (private browsing, SSR) — stay hidden
    }
  }, [])

  const persist = (value: ConsentValue) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value)
      // Dispatch storage event so other tabs / the layout wrapper can react
      window.dispatchEvent(new StorageEvent('storage', { key: COOKIE_CONSENT_KEY, newValue: value }))
    } catch {
      // ignore
    }
  }

  const acceptAll = () => {
    persist('accepted')
    setVisible(false)
  }

  const acceptEssential = () => {
    persist('essential')
    setVisible(false)
  }

  const saveCustom = () => {
    // If analytics is checked, treat as full acceptance; otherwise essential-only.
    persist(analyticsChecked ? 'accepted' : 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        background: '#141414',
        borderTop: '1px solid #2a2a2a',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
          We use cookies to improve your experience and analyse site usage. See our{' '}
          <a href="/privacy" className="text-[#D4AF37] hover:underline underline-offset-2">
            Privacy Policy
          </a>{' '}
          for details.
        </p>

        {showCustomise && (
          <div className="mb-4 space-y-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg p-4">
            {/* Essential — always on */}
            <label className="flex items-center gap-3 cursor-not-allowed opacity-60">
              <input type="checkbox" checked readOnly disabled className="rounded" />
              <span>
                <strong className="text-white">Essential</strong> — required for the site to work
                (auth sessions, CSRF). Cannot be disabled.
              </span>
            </label>
            {/* Analytics */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={(e) => setAnalyticsChecked(e.target.checked)}
                className="rounded accent-[#D4AF37]"
              />
              <span>
                <strong className="text-white">Analytics</strong> — PostHog usage statistics that
                help us improve the product. Never sold.
              </span>
            </label>
            {/* Marketing */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingChecked}
                onChange={(e) => setMarketingChecked(e.target.checked)}
                className="rounded accent-[#D4AF37]"
              />
              <span>
                <strong className="text-white">Marketing</strong> — personalised promotions and
                re-engagement emails. Requires separate email opt-in.
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {showCustomise ? (
            <button
              type="button"
              onClick={saveCustom}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: '#D4AF37', color: '#0a0a0a' }}
            >
              Save Preferences
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowCustomise(true)}
                className="text-sm px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={acceptEssential}
                className="text-sm px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: '#D4AF37', color: '#0a0a0a' }}
              >
                Accept All
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
