'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShareButtons } from '@/components/ShareButtons'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://robloxforge.gg'

type Period = 'daily' | 'weekly' | 'monthly'

type EarningsSummary = {
  summary: {
    totalRevenue: string
    netRevenue: string
    paidOut: string
    pending: string
    salesCount: number
  }
  chart: Array<{ date: string; revenue: string }>
  templateBreakdown: Array<{
    templateId: string
    name: string
    sales: number
    revenue: string
    revenueCents: number
  }>
  milestones: {
    current: number
    next: number | null
    achieved: number[]
  }
}

type Transaction = {
  id: string
  templateName: string | null
  amountUsd: string
  netUsd: string
  status: string
  createdAt: string
}

const MILESTONES = [
  { label: '$100', cents: 10000 },
  { label: '$1K', cents: 100000 },
  { label: '$10K', cents: 1000000 },
]

function MilestoneCelebration({ achieved }: { achieved: number[] }) {
  if (achieved.length === 0) return null
  const latest = MILESTONES.filter((m) => achieved.includes(m.cents)).pop()
  if (!latest) return null

  return (
    <div className="bg-gradient-to-r from-[#FFB81C]/20 to-transparent border border-[#FFB81C]/30 rounded-2xl p-6 mb-8 flex items-center gap-4 flex-wrap">
      <div className="text-4xl">&#127881;</div>
      <div className="flex-1 min-w-0">
        <p className="text-[#FFB81C] font-bold text-lg">Milestone Achieved!</p>
        <p className="text-gray-300 text-sm">
          You've earned over <strong>{latest.label}</strong> on RobloxForge!
        </p>
      </div>
      <ShareButtons
        url={`${APP_URL}/marketplace`}
        text={`Just hit the ${latest.label} earnings milestone on RobloxForge! Selling Roblox templates has never been easier.`}
        compact
      />
    </div>
  )
}

export default function EarningsPage() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  useEffect(() => {
    fetchSummary()
    fetchTransactions()
  }, [period])

  async function fetchSummary() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/earnings/summary?period=${period}`, {
        credentials: 'include',
      })
      if (res.ok) setSummary(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function fetchTransactions(nextCursor?: string) {
    setTxLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (nextCursor) params.set('cursor', nextCursor)
      const res = await fetch(`${API_BASE}/api/earnings/transactions?${params}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setTransactions((prev) => (nextCursor ? [...prev, ...data.transactions] : data.transactions))
        setHasMore(data.hasMore)
        setCursor(data.nextCursor)
      }
    } finally {
      setTxLoading(false)
    }
  }

  const statCards = [
    { label: 'Gross Revenue', value: `$${summary?.summary.totalRevenue ?? '0.00'}`, color: 'text-white' },
    { label: 'Net Revenue', value: `$${summary?.summary.netRevenue ?? '0.00'}`, color: 'text-green-400' },
    { label: 'Paid Out', value: `$${summary?.summary.paidOut ?? '0.00'}`, color: 'text-blue-400' },
    { label: 'Pending', value: `$${summary?.summary.pending ?? '0.00'}`, color: 'text-[#FFB81C]' },
    { label: 'Total Sales', value: String(summary?.summary.salesCount ?? 0), color: 'text-white' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Creator Earnings</h1>
        <p className="text-gray-400 mt-1 text-sm">Track your marketplace revenue and payouts.</p>
      </div>

      {/* Milestones */}
      {summary && <MilestoneCelebration achieved={summary.milestones.achieved} />}

      {/* Milestone progress */}
      {summary?.milestones.next && (
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-medium">Next Milestone</p>
            <p className="text-gray-400 text-sm">
              ${((summary.milestones.current) / 100).toFixed(2)} / ${(summary.milestones.next / 100).toFixed(0)}
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#FFB81C] transition-all"
              style={{
                width: `${Math.min(100, (summary.milestones.current / summary.milestones.next) * 100)}%`,
              }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {MILESTONES.find((m) => m.cents === summary.milestones.next)?.label} milestone
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">Revenue Over Time</h2>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                  period === p
                    ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                    : 'text-gray-400 hover:text-white border border-white/10 hover:border-white/30'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading chart...</div>
          </div>
        ) : !summary?.chart.length ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No revenue data yet.</p>
              <p className="text-gray-600 text-xs mt-1">
                Publish templates to the marketplace to start earning.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={summary.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#0D1231',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
                formatter={(v: number) => [`$${v}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#FFB81C"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#FFB81C' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Template breakdown */}
      {summary?.templateBreakdown && summary.templateBreakdown.length > 0 && (
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">Per-Template Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left pb-3 pr-4">Template</th>
                  <th className="text-right pb-3 pr-4">Sales</th>
                  <th className="text-right pb-3">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.templateBreakdown.map((t) => (
                  <tr key={t.templateId} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white font-medium">{t.name}</td>
                    <td className="py-3 pr-4 text-gray-400 text-right">{t.sales}</td>
                    <td className="py-3 text-right text-green-400 font-medium">${t.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout schedule */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Payout Schedule</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Minimum Payout</p>
            <p className="text-white font-semibold">$10.00</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Payout Schedule</p>
            <p className="text-white font-semibold">1st of each month</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Method</p>
            <p className="text-white font-semibold">Stripe (bank/PayPal)</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="text-sm border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors">
            Setup Payout Method
          </button>
          <button className="text-sm border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors">
            Download 1099
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No transactions yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left pb-3 pr-4">Template</th>
                    <th className="text-right pb-3 pr-4">Gross</th>
                    <th className="text-right pb-3 pr-4">Net</th>
                    <th className="text-right pb-3 pr-4">Status</th>
                    <th className="text-right pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-white">{tx.templateName ?? 'Unknown'}</td>
                      <td className="py-3 pr-4 text-gray-400 text-right">${tx.amountUsd}</td>
                      <td className="py-3 pr-4 text-green-400 text-right font-medium">${tx.netUsd}</td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            tx.status === 'PAID'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : tx.status === 'PROCESSING'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-right">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <button
                onClick={() => fetchTransactions(cursor ?? undefined)}
                disabled={txLoading}
                className="mt-4 w-full border border-white/10 hover:border-white/30 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {txLoading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
