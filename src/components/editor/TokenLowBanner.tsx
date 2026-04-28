'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

const LS_DISMISS_KEY = 'forje-token-low-dismissed-at'
const DISMISS_DURATION_MS = 60 * 60 * 1000 // 1 hour

/**
 * Inline banner shown above the chat input when token balance is < 100.
 * Dismissible for 1 hour via localStorage.
 */
export function TokenLowBanner() {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    try {
      const ts = localStorage.getItem(LS_DISMISS_KEY)
      if (ts && Date.now() - Number(ts) < DISMISS_DURATION_MS) {
        setDismissed(true)
      } else {
        setDismissed(false)
      }
    } catch {
      setDismissed(false)
    }
  }, [])

  const { data } = useSWR<{ balance: number }>(
    '/api/tokens/balance',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  )

  if (dismissed || !data || data.balance >= 100) return null

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(LS_DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        marginBottom: 8,
        borderRadius: 12,
        background: 'rgba(212,175,55,0.06)',
        border: '1px solid rgba(212,175,55,0.2)',
        fontFamily: 'Inter, sans-serif',
        animation: 'msgFadeUp 0.2s ease-out forwards',
      }}
      role="status"
    >
      {/* Coin icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.1)" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#D4AF37">T</text>
      </svg>

      <span style={{ flex: 1, fontSize: 12, color: '#A1A1AA', lineHeight: 1.4 }}>
        Running low on tokens&nbsp;&mdash;&nbsp;
        <a
          href="/tokens"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#D4AF37',
            fontWeight: 600,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4AF37' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
        >
          grab more to keep building
        </a>
      </span>

      {/* Buy button */}
      <a
        href="/tokens"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #D4AF37 0%, #C49B2F 100%)',
          color: '#09090b',
          fontSize: 11,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.15s',
          boxShadow: '0 0 8px rgba(212,175,55,0.15)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(212,175,55,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 8px rgba(212,175,55,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Buy 1K Tokens &mdash; $10
      </a>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss low token banner"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.25)',
          cursor: 'pointer',
          padding: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
