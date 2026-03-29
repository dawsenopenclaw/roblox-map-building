'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ProviderData = { costUsd: number; tokensUsed: number; calls: number }
type ProviderCosts = Record<string, ProviderData | number>
type Snapshot = {
  date: string
  totalCostUsd: number
  totalRevenue: number
  margin: number
  providerCosts: Record<string, number>
}

function formatCurrency(usd: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd)
}

export function CostDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.forjegames.com'
  const { data: snapshots, isLoading } = useSWR<Snapshot[]>(
    `${apiBase}/api/costs/snapshots`,
    fetcher
  )
  const { data: today } = useSWR<{ totalCostUsd: number; byProvider: ProviderCosts }>(
    `${apiBase}/api/costs/today`,
    fetcher,
    { refreshInterval: 60000 }
  )

  return (
    <div className="space-y-6">
      {/* Today's running cost */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Today&apos;s API Spend</h2>
        <p className="text-4xl font-bold text-[#FFB81C]">
          {formatCurrency(today?.totalCostUsd || 0)}
        </p>
        {today?.byProvider && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(today.byProvider).map(([provider, data]) => {
              const costUsd = typeof data === 'number' ? data : (data as ProviderData).costUsd
              return (
                <div key={provider} className="bg-[#0a0a0a] rounded-lg p-3">
                  <p className="text-gray-300 text-xs uppercase">{provider}</p>
                  <p className="text-white font-medium">{formatCurrency(costUsd)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 30-day history */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">30-Day Cost History</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(snapshots || []).map((s) => (
              <div
                key={s.date}
                className="flex items-center justify-between py-2 border-b border-white/5"
              >
                <span className="text-gray-300 text-sm">
                  {new Date(s.date).toLocaleDateString()}
                </span>
                <span className="text-white font-medium">{formatCurrency(s.totalCostUsd)}</span>
                <span
                  className={`text-sm font-medium ${
                    s.margin >= 60
                      ? 'text-green-400'
                      : s.margin > 0
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                  }`}
                >
                  {s.margin > 0 ? `${s.margin.toFixed(1)}% margin` : 'No revenue data'}
                </span>
              </div>
            ))}
            {(!snapshots || snapshots.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">
                No cost data yet. Data appears after the first day of API usage.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
