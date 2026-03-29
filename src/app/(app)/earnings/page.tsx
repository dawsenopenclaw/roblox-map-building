'use client'
import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

type EarningsSummary = {
  summary: {
    totalRevenue: string
    netRevenue: string
    pending: string
    salesCount: number
  }
  chart: Array<{ date: string; revenue: string }>
}

const DEMO: EarningsSummary = {
  summary: { totalRevenue: '0.00', netRevenue: '0.00', pending: '0.00', salesCount: 0 },
  chart: [
    { date: 'Mon', revenue: '0' },
    { date: 'Tue', revenue: '0' },
    { date: 'Wed', revenue: '0' },
    { date: 'Thu', revenue: '0' },
    { date: 'Fri', revenue: '0' },
    { date: 'Sat', revenue: '0' },
    { date: 'Sun', revenue: '0' },
  ],
}

type Transaction = {
  id: string
  templateName: string | null
  amountUsd: string
  netUsd: string
  status: string
  createdAt: string
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsSummary>(DEMO)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [sumRes, txRes] = await Promise.all([
          fetch(`${API_BASE}/api/earnings/summary?period=weekly`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/earnings/transactions?limit=20`, { credentials: 'include' }),
        ])
        if (sumRes.ok) setData(await sumRes.json())
        if (txRes.ok) {
          const d = await txRes.json()
          setTransactions(d.transactions ?? [])
        }
      } catch {
        // offline — demo state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const maxRevenue = Math.max(...data.chart.map((d) => parseFloat(d.revenue)), 1)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Creator Earnings</h1>
        <p className="text-gray-400 mt-1 text-sm">Track your marketplace revenue and payouts.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Total Earned</p>
          <p className="text-xl font-bold text-white">
            {loading ? '...' : `$${data.summary.totalRevenue}`}
          </p>
        </div>
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">This Month</p>
          <p className="text-xl font-bold text-green-400">
            {loading ? '...' : `$${data.summary.netRevenue}`}
          </p>
        </div>
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Pending</p>
          <p className="text-xl font-bold text-[#FFB81C]">
            {loading ? '...' : `$${data.summary.pending}`}
          </p>
        </div>
      </div>

      {/* CSS bar chart — last 7 days */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-6">Last 7 Days</h2>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {data.chart.map((day) => {
              const pct = (parseFloat(day.revenue) / maxRevenue) * 100
              const isEmpty = parseFloat(day.revenue) === 0
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-28">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: isEmpty ? '4px' : `${pct}%`,
                        backgroundColor: isEmpty ? 'rgba(255,255,255,0.08)' : '#FFB81C',
                        minHeight: '4px',
                      }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs">{day.date}</span>
                </div>
              )
            })}
          </div>
        )}
        {!loading && maxRevenue === 1 && (
          <p className="text-gray-600 text-xs text-center mt-4">
            Publish a template to start earning
          </p>
        )}
      </div>

      {/* Recent Sales */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Recent Sales</h2>
        {loading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No sales yet — publish a template to start earning
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left pb-3 pr-4">Template</th>
                  <th className="text-right pb-3 pr-4">Amount</th>
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
        )}
      </div>

      {/* Payout Info */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1">Payout Info</h2>
        <p className="text-gray-500 text-sm mb-5">
          Next payout: Set up Stripe Connect to receive payouts
        </p>
        <a
          href="/settings/payouts"
          className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#FFB81C]/90 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Connect Stripe
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  )
}
