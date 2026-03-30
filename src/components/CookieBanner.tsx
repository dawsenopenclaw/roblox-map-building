'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage unavailable (private browsing, SSR) — stay hidden
    }
  }, [])

  const accept = (value: 'all' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4"
      style={{
        background: '#141414',
        borderTop: '1px solid #2a2a2a',
      }}
    >
      <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
        We use cookies to improve your experience and analyse site usage. See our{' '}
        <a href="/privacy" className="text-[#D4AF37] hover:underline underline-offset-2">
          Privacy Policy
        </a>{' '}
        for details.
      </p>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => accept('essential')}
          className="text-sm px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => accept('all')}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: '#D4AF37', color: '#0a0a0a' }}
        >
          Accept All
        </button>
      </div>
    </div>
  )
}
