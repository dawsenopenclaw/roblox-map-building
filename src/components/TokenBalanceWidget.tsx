'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

/**
 * TokenBalanceWidget — two display modes:
 *   compact: small inline pill for top bars (just the number + coin icon)
 *   full: card with balance + lifetime spent (for dashboard/settings)
 */
export function TokenBalanceWidget({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30000 })

  if (isLoading && compact) return (
    <div style={{
      padding: '4px 10px', borderRadius: 8,
      background: 'rgba(212,175,55,0.06)',
      border: '1px solid rgba(212,175,55,0.15)',
    }}>
      <span style={{ fontSize: 11, color: '#71717A' }}>...</span>
    </div>
  )

  if (isLoading) return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-24 mb-2" />
      <div className="h-8 bg-white/10 rounded w-16" />
    </div>
  )

  const balance = (data?.balance || 0).toLocaleString()

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.15)',
          fontSize: 11,
          fontWeight: 700,
          color: '#D4AF37',
          fontFamily: 'Inter, sans-serif',
        }}
        title={`${balance} tokens remaining`}
        role="status"
        aria-label={`Token balance: ${balance}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">T</text>
        </svg>
        {balance}
      </div>
    )
  }

  return (
    <div
      className="bg-[#141414] border border-white/10 rounded-xl p-4"
      role="status"
      aria-label={`Token balance: ${balance} tokens`}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-gray-300 text-sm font-medium uppercase tracking-wide">Token Balance</p>
      <p className="text-3xl font-bold text-[#D4AF37] mt-1" aria-hidden="true">
        {balance}
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {(data?.lifetimeSpent || 0).toLocaleString()} spent
      </p>
    </div>
  )
}
