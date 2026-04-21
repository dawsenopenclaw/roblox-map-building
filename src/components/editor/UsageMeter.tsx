'use client'

import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/**
 * UsageMeter — compact daily build usage indicator for the editor top bar.
 *
 * Shows "{used}/{limit} builds today" with a thin color-coded progress bar.
 * Green >50% remaining, amber 20-50%, red <20%, gold glow at 0.
 * Links to /pricing when exhausted.
 * Hidden for STUDIO tier (unlimited).
 */
export function UsageMeter() {
  const { data, isLoading } = useSWR<{ used: number; limit: number; tier: string }>(
    '/api/usage/daily',
    fetcher,
    { refreshInterval: 30_000 },
  )

  // Loading skeleton
  if (isLoading || !data) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          minWidth: 80,
          height: 28,
        }}
      >
        <span style={{ fontSize: 11, color: '#52525B' }}>...</span>
      </div>
    )
  }

  // STUDIO tier = unlimited, don't show meter
  if (data.tier === 'STUDIO' || data.limit === -1) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.15)',
          fontSize: 11,
          fontWeight: 700,
          color: '#D4AF37',
          fontFamily: 'Inter, sans-serif',
        }}
        title="Unlimited daily builds"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
        </svg>
        Unlimited
      </div>
    )
  }

  const { used, limit } = data
  const remaining = Math.max(0, limit - used)
  const pct = limit > 0 ? remaining / limit : 0
  const exhausted = remaining === 0

  // Color coding
  let barColor = '#22C55E' // green
  let textColor = '#A1A1AA'
  if (pct <= 0.2) {
    barColor = '#EF4444' // red
    textColor = '#EF4444'
  } else if (pct <= 0.5) {
    barColor = '#F59E0B' // amber
    textColor = '#F59E0B'
  }

  if (exhausted) {
    barColor = '#D4AF37'
    textColor = '#D4AF37'
  }

  const fillWidth = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  const meterContent = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
        padding: '4px 10px',
        borderRadius: 8,
        background: exhausted ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${exhausted ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
        minWidth: 100,
        maxWidth: 200,
        fontFamily: 'Inter, sans-serif',
        cursor: exhausted ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...(exhausted
          ? { boxShadow: '0 0 8px rgba(212,175,55,0.15)' }
          : {}),
      }}
      title={exhausted ? 'Daily limit reached — upgrade for more' : `${remaining} builds remaining today`}
      role="status"
      aria-label={exhausted ? 'Daily build limit reached' : `${used} of ${limit} daily builds used`}
    >
      {/* Text row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
          {exhausted ? 'Upgrade for more' : `${used}/${limit} builds`}
        </span>
        {!exhausted && (
          <span style={{ fontSize: 9, color: '#52525B', whiteSpace: 'nowrap' }}>today</span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 3,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${fillWidth}%`,
            height: '100%',
            borderRadius: 2,
            background: barColor,
            transition: 'width 0.4s ease, background 0.3s ease',
          }}
        />
      </div>
    </div>
  )

  if (exhausted) {
    return <Link href="/pricing" style={{ textDecoration: 'none' }}>{meterContent}</Link>
  }

  return meterContent
}

/** SWR key for external mutate calls: mutate('/api/usage/daily') */
export const USAGE_DAILY_KEY = '/api/usage/daily'
