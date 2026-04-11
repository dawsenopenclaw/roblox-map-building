'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Known providers in display order — any unlisted providers fall through to "Other"
const PROVIDER_META: Record<string, { label: string; color: string }> = {
  anthropic:  { label: 'Anthropic (Claude)',  color: 'text-[#D4AF37]' },
  meshy:      { label: 'Meshy (3D)',          color: 'text-purple-400' },
  fal:        { label: 'Fal (Images)',        color: 'text-blue-400'  },
  resend:     { label: 'Resend (Email)',       color: 'text-green-400' },
  openai:     { label: 'OpenAI',              color: 'text-emerald-400' },
  stripe:     { label: 'Stripe (Fees)',       color: 'text-indigo-400' },
}

type ProviderData = { costUsd: number; tokensUsed?: number; calls?: number }
type ProviderCosts = Record<string, ProviderData | number>
type Snapshot = {
  date: string
  totalCostUsd: number
  totalRevenue: number
  margin: number
  providerCosts: Record<string, number>
}

function formatCurrency(usd: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(usd)
}

function formatCount(n: number | undefined) {
  if (n === undefined || n === 0) return null
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n)
}

export function CostDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
  const { data: snapshots, isLoading } = useSWR<Snapshot[]>(
    `${apiBase}/api/costs/snapshots`,
    fetcher
  )
  const { data: today, isLoading: todayLoading } = useSWR<{
    totalCostUsd: number
    byProvider: ProviderCosts
  }>(
    `${apiBase}/api/costs/today`,
    fetcher,
    { refreshInterval: 60_000 }
  )

  // Normalise provider data to a consistent shape
  const providerRows = Object.entries(today?.byProvider ?? {}).map(([key, raw]) => {
    const data: ProviderData = typeof raw === 'number' ? { costUsd: raw } : raw
    const meta = PROVIDER_META[key.toLowerCase()] ?? { label: key, color: 'text-gray-300' }
    return { key, ...meta, ...data }
  }).sort((a, b) => b.costUsd - a.costUsd)

  return (
    <div className="space-y-6">
      {/* Today's running cost */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-white font-semibold">Today&apos;s API Spend</h2>
          {todayLoading && (
            <span className="text-gray-500 text-xs animate-pulse">Refreshing…</span>
          )}
        </div>

        <p className="text-4xl font-bold text-[#D4AF37] tabular-nums">
          {formatCurrency(today?.totalCostUsd ?? 0)}
        </p>

        {providerRows.length > 0 && (
          <div className="mt-5 border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left text-gray-500 font-normal px-4 py-2">Provider</th>
                  <th className="text-right text-gray-500 font-normal px-4 py-2">Cost</th>
                  <th className="text-right text-gray-500 font-normal px-4 py-2 hidden sm:table-cell">Tokens / Calls</th>
                </tr>
              </thead>
              <tbody>
                {providerRows.map((row) => (
                  <tr key={row.key} className="border-b border-white/5 last:border-0">
                    <td className={`px-4 py-2.5 font-medium ${row.color}`}>{row.label}</td>
                    <td className="px-4 py-2.5 text-right text-white tabular-nums">
                      {formatCurrency(row.costUsd)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400 tabular-nums hidden sm:table-cell">
                      {row.tokensUsed
                        ? `${formatCount(row.tokensUsed)} tok`
                        : row.calls
                          ? `${formatCount(row.calls)} calls`
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!todayLoading && providerRows.length === 0 && (
          <p className="text-gray-500 text-sm mt-4">No spend recorded today yet.</p>
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
          <div className="border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left text-gray-500 font-normal px-4 py-2">Date</th>
                  <th className="text-right text-gray-500 font-normal px-4 py-2">Cost</th>
                  <th className="text-right text-gray-500 font-normal px-4 py-2 hidden sm:table-cell">Revenue</th>
                  <th className="text-right text-gray-500 font-normal px-4 py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {(snapshots ?? []).map((s) => (
                  <tr key={s.date} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-gray-300">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-white tabular-nums">
                      {formatCurrency(s.totalCostUsd)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400 tabular-nums hidden sm:table-cell">
                      {s.totalRevenue > 0 ? formatCurrency(s.totalRevenue) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span
                        className={
                          s.margin >= 60
                            ? 'text-green-400'
                            : s.margin > 0
                              ? 'text-yellow-400'
                              : 'text-gray-500'
                        }
                      >
                        {s.margin > 0 ? `${s.margin.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!snapshots || snapshots.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-6">
                No cost data yet. Data appears after the first day of API usage.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
