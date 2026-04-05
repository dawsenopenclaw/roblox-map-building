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
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe"
      style={{
        background: 'rgba(14,14,14,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-5xl mx-auto py-3">
        {showCustomise ? (
          /* ── Expanded customise panel ── */
          <div>
            <div className="mb-3 space-y-2 text-sm text-gray-300">
              <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                <input type="checkbox" checked readOnly disabled className="rounded" />
                <span>
                  <strong className="text-white">Essential</strong>
                  <span className="text-gray-500 ml-1">— auth, security. Always on.</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <span>
                  <strong className="text-white">Analytics</strong>
                  <span className="text-gray-500 ml-1">— PostHog. Never sold.</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <span>
                  <strong className="text-white">Marketing</strong>
                  <span className="text-gray-500 ml-1">— personalised promotions.</span>
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomise(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                style={{ background: '#D4AF37', color: '#0a0a0a' }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* ── Default compact row ── */
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-gray-400 flex-1 min-w-0 leading-snug">
              We use cookies to improve your experience.{' '}
              <a href="/privacy" className="text-[#D4AF37] hover:underline underline-offset-2 whitespace-nowrap">
                Privacy Policy
              </a>
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCustomise(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={acceptEssential}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: '#D4AF37', color: '#0a0a0a' }}
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
