'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, Clock, ShoppingBag, Download, Zap } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Sale = {
  id: string
  amountCents: number
  platformFeeCents: number
  creatorPayoutCents: number
  payoutStatus: string
  createdAt: string
  template: { id: string; title: string } | null
}

type EarningsData = {
  connected: boolean
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
  pendingBalanceCents: number
  totalEarnedCents: number
  lastPayoutAt: string | null
  recentSales: Sale[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const DEMO: EarningsData = {
  connected: false,
  pendingBalanceCents: 0,
  totalEarnedCents: 0,
  lastPayoutAt: null,
  recentSales: [],
}

/** Build monthly bar-chart data from recentSales (last 6 months) */
function buildChartData(sales: Sale[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    months[key] = 0
  }
  for (const s of sales) {
    const d = new Date(s.createdAt)
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    if (key in months) months[key] += s.creatorPayoutCents / 100
  }
  return Object.entries(months).map(([name, value]) => ({ name, value: +value.toFixed(2) }))
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-[#FFB81C] font-bold">${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

// ─── Status pill styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PAID:       'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EarningsClient() {
  const {
    data: raw,
    isLoading,
    error,
    mutate,
  } = useSWR<EarningsData>('/api/marketplace/earnings', fetcher, {
    onErrorRetry: (_err, _key, _config, revalidate, { retryCount }) => {
      if (retryCount >= 2) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    },
  })

  const [onboarding, setOnboarding] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const data: EarningsData = error ? DEMO : (raw ?? DEMO)
  const chartData = buildChartData(data.recentSales ?? [])
  const chartMax = Math.max(...chartData.map(d => d.value), 10)

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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded-xl w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-white/5 rounded-2xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Earnings</h1>
          <p className="text-gray-400 text-sm mt-1">Your marketplace revenue and payout history.</p>
        </div>
        <button
          onClick={() => window.open('/api/earnings/export', '_blank')}
          className="inline-flex items-center gap-2 text-sm border border-white/10 hover:border-white/25 text-gray-300 hover:text-blue-400 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* ── API error banner ── */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm flex items-center justify-between gap-4">
          <span>Could not load live data. Showing cached view.</span>
          <button
            onClick={() => mutate()}
            className="text-xs underline underline-offset-2 hover:text-amber-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stripe Connect CTA (not yet connected) ── */}
      {!data.connected && (
        <div className="bg-[#141414] border border-[#FFB81C]/30 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFB81C]/10 mb-4">
            <Zap size={24} className="text-[#FFB81C]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Set Up Payouts</h2>
          <p className="text-gray-300 text-sm mb-2 max-w-md mx-auto">
            Connect your Stripe Express account to start receiving{' '}
            <span className="text-[#FFB81C] font-semibold">70%</span> of every template sale.
          </p>
          <p className="text-gray-500 text-xs mb-8">
            Payouts triggered automatically when your balance reaches $20.
          </p>

          {/* 70/30 split visual */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-xl px-8 py-5">
              <p className="text-[#FFB81C] text-4xl font-black">70%</p>
              <p className="text-gray-300 text-xs mt-1">You earn</p>
            </div>
            <div className="text-gray-600 text-lg font-bold">+</div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-8 py-5">
              <p className="text-gray-400 text-4xl font-black">30%</p>
              <p className="text-gray-500 text-xs mt-1">Platform fee</p>
            </div>
          </div>

          <button
            onClick={handleConnectStripe}
            disabled={onboarding}
            className="bg-[#FFB81C] hover:bg-[#E6A618] text-black font-bold px-8 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {onboarding ? 'Redirecting...' : 'Connect with Stripe'}
          </button>
          {connectError && <p className="text-red-400 text-sm mt-3">{connectError}</p>}
        </div>
      )}

      {/* ── Connected: full dashboard ── */}
      {data.connected && (
        <>
          {/* Stripe setup incomplete */}
          {!data.chargesEnabled && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-amber-400 font-medium text-sm">Stripe setup incomplete</p>
                <p className="text-gray-400 text-xs mt-0.5">Complete onboarding to unlock payouts</p>
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

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Earned — gold highlight */}
            <div className="bg-[#141414] border border-[#FFB81C]/25 rounded-2xl p-5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-[#FFB81C]" />
                <p className="text-gray-400 text-xs uppercase tracking-wide">Total Earned</p>
              </div>
              <p className="text-[#FFB81C] text-3xl font-black tabular-nums leading-none">
                {fmt(data.totalEarnedCents ?? 0)}
              </p>
              <p className="text-gray-500 text-xs mt-2">All time · your 70%</p>
            </div>

            {/* Pending Payout */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-blue-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide">Pending</p>
              </div>
              <p className="text-white text-2xl font-bold tabular-nums leading-none">
                {fmt(data.pendingBalanceCents ?? 0)}
              </p>
              <p className="text-gray-500 text-xs mt-2">Paid out at $20+</p>
            </div>

            {/* Sales count */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-purple-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide">Sales (30d)</p>
              </div>
              <p className="text-white text-2xl font-bold tabular-nums leading-none">
                {data.recentSales?.length ?? 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">Templates sold</p>
            </div>

            {/* Last Payout */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide">Last Payout</p>
              </div>
              <p className="text-white text-lg font-bold leading-none">
                {data.lastPayoutAt
                  ? new Date(data.lastPayoutAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="text-gray-500 text-xs mt-2">Most recent transfer</p>
            </div>
          </div>

          {/* ── Revenue Chart ── */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-white font-semibold text-base">Revenue — Last 6 Months</h2>
              <p className="text-gray-500 text-xs mt-0.5">Your 70% creator share per month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  domain={[0, Math.ceil(chartMax * 1.2)]}
                  width={50}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 70/30 Split Explanation ── */}
          <div className="bg-[#FFB81C]/5 border border-[#FFB81C]/15 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-[#FFB81C]/15 rounded-xl p-2.5 flex-shrink-0">
              <DollarSign size={16} className="text-[#FFB81C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#FFB81C] font-semibold text-sm">70 / 30 Revenue Split</p>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                You keep{' '}
                <span className="text-[#FFB81C] font-bold">70%</span> of every sale. The platform
                retains <span className="text-gray-200 font-medium">30%</span> to cover payment
                processing, hosting, and marketplace operations. Payouts via{' '}
                <span className="text-white font-medium">Stripe Express</span> — no hidden fees.
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-4 items-center">
              <div className="text-center">
                <p className="text-[#FFB81C] text-2xl font-black leading-none">70%</p>
                <p className="text-gray-500 text-xs mt-1">You</p>
              </div>
              <div className="text-gray-700 font-bold">·</div>
              <div className="text-center">
                <p className="text-gray-500 text-2xl font-black leading-none">30%</p>
                <p className="text-gray-500 text-xs mt-1">Platform</p>
              </div>
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-base mb-5">
              Transaction History{' '}
              <span className="text-gray-500 font-normal text-xs ml-1">(30 days)</span>
            </h2>

            {!data.recentSales?.length ? (
              <div className="py-12 text-center">
                <ShoppingBag size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No sales yet.</p>
                <p className="text-gray-600 text-xs mt-1">
                  Publish your first template to start earning.
                </p>
                <Link
                  href="/marketplace/submit"
                  className="inline-flex items-center gap-2 mt-4 bg-[#FFB81C] hover:bg-[#E6A618] text-black font-bold px-5 py-2 rounded-xl text-sm transition-colors"
                >
                  <ShoppingBag size={13} />
                  Submit Template
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Date</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Template</th>
                      <th className="text-right text-xs text-gray-500 font-medium pb-3">
                        Sale Price
                      </th>
                      <th className="text-right text-xs text-gray-500 font-medium pb-3">
                        Your Payout
                      </th>
                      <th className="text-right text-xs text-gray-500 font-medium pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recentSales.map(sale => {
                      const statusKey = (sale.payoutStatus ?? 'PENDING').toUpperCase()
                      const style = STATUS_STYLES[statusKey] ?? STATUS_STYLES.PENDING
                      const statusLabel =
                        statusKey.charAt(0) + statusKey.slice(1).toLowerCase()
                      return (
                        <tr
                          key={sale.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3.5 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(sale.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 text-white pr-4">
                            {sale.template?.title ?? 'Unknown Template'}
                          </td>
                          <td className="py-3.5 text-gray-300 text-right tabular-nums">
                            {fmt(sale.amountCents)}
                          </td>
                          <td className="py-3.5 text-[#FFB81C] text-right tabular-nums font-semibold">
                            +{fmt(sale.creatorPayoutCents)}
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Payout schedule ── */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 flex items-start gap-3">
            <TrendingUp size={15} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium text-sm">Payouts on the 1st and 15th</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                Balances over $20 are transferred twice monthly via Stripe.{' '}
                <Link
                  href="/billing"
                  className="text-[#FFB81C] hover:text-[#E6A519] transition-colors"
                >
                  Manage payout settings
                </Link>
              </p>
            </div>
          </div>

          {/* ── Submit template CTA ── */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-semibold text-sm">Publish more templates</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Grow your revenue — earn 70% on every sale.
              </p>
            </div>
            <Link
              href="/marketplace/submit"
              className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
            >
              <ShoppingBag size={13} />
              Submit Template
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
