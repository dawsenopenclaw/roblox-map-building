'use client'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

// Demo data shown when API/DB is unavailable
const DEMO_DATA = {
  connected: false,
  chargesEnabled: false,
  pendingBalanceCents: 0,
  totalEarnedCents: 0,
  lastPayoutAt: null,
  recentSales: [],
}

export default function EarningsPage() {
  const { data: raw, isLoading, error, mutate } = useSWR('/api/marketplace/earnings', fetcher, {
    onErrorRetry: (_err, _key, _config, revalidate, { retryCount }) => {
      if (retryCount >= 2) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    },
  })
  const [onboarding, setOnboarding] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Fall back to demo data if API is unreachable
  const data = error ? DEMO_DATA : raw

  async function handleConnectStripe() {
    setConnectError(null)
    setOnboarding(true)
    try {
      const res = await fetch('/api/marketplace/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        setConnectError(json.error || 'Failed to start onboarding')
        return
      }
      window.location.href = json.url
    } catch {
      setConnectError('Network error — please try again.')
    } finally {
      setOnboarding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded w-48" />
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Creator Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">70% of every sale goes directly to you</p>
      </div>

      {error && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm flex items-center justify-between gap-4">
          <span>Could not load earnings data. Showing cached view.</span>
          <button
            onClick={() => mutate()}
            className="text-xs underline underline-offset-2 hover:text-amber-300 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {!data?.connected ? (
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">&#128179;</div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Stripe to receive payouts</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Set up your Stripe Express account to start receiving 70% of your template sales.
            Payouts when balance reaches $20.
          </p>
          <button
            onClick={handleConnectStripe}
            disabled={onboarding}
            className="bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold px-8 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {onboarding ? 'Redirecting...' : 'Connect with Stripe'}
          </button>
          {connectError && <p className="text-red-400 text-sm mt-3">{connectError}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Setup incomplete banner */}
          {!data.chargesEnabled && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-amber-400 font-medium text-sm">Stripe setup incomplete</p>
                <p className="text-gray-400 text-xs mt-0.5">Complete your Stripe onboarding to receive payouts</p>
              </div>
              <button
                onClick={handleConnectStripe}
                disabled={onboarding}
                className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-60"
              >
                Continue Setup
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Pending Balance</p>
              <p className="text-2xl font-bold text-white">
                ${((data.pendingBalanceCents ?? 0) / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Paid out when &ge; $20</p>
            </div>
            <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-white">
                ${((data.totalEarnedCents ?? 0) / 100).toFixed(2)}
              </p>
            </div>
            <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Last Payout</p>
              <p className="text-2xl font-bold text-white">
                {data.lastPayoutAt ? new Date(data.lastPayoutAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* Recent sales */}
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Recent Sales (30 days)</h2>
            {!data.recentSales?.length ? (
              <p className="text-gray-500 text-sm">No sales yet. Publish your first template!</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.recentSales.map((sale: { id: string; template?: { title: string }; creatorPayoutCents: number; createdAt: string }) => (
                  <div key={sale.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm text-white font-medium">
                        {sale.template?.title || 'Unknown Template'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm text-green-400 font-medium">
                      +${(sale.creatorPayoutCents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600 text-center">
            Platform takes 30% per sale. Payouts processed monthly via Stripe.
          </p>
        </div>
      )}
    </div>
  )
}
