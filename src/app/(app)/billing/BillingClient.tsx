'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { CreditCard, Zap, TrendingUp, Package, Bot } from 'lucide-react'

// Metadata moved to layout or handled via document title

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentRow = {
  id: string
  date: string
  description: string
  amount: string
  status: 'Paid' | 'Pending' | 'Failed'
}

type UsageStat = {
  label: string
  used: number
  limit: number
  icon: React.ReactNode
  color: string
}

// ─── Mock data (replace with real API fetches) ────────────────────────────────

const PLAN = 'Pro'
const PLAN_DESCRIPTION = '5,000 tokens/month · Full AI access · Priority builds'
const TOKENS_USED = 3_760
const TOKEN_LIMIT = 5_000
const RENEW_DATE = 'April 28, 2026'
const MONTHLY_PRICE = '$29'

const USAGE_STATS: UsageStat[] = [
  { label: 'AI Generations', used: 142, limit: 200, icon: <Bot size={15} />, color: '#FFB81C' },
  { label: 'Marketplace Searches', used: 58, limit: 500, icon: <Package size={15} />, color: '#60a5fa' },
  { label: 'API Calls', used: 3_420, limit: 10_000, icon: <Zap size={15} />, color: '#a78bfa' },
]

const PAYMENTS: PaymentRow[] = [
  { id: 'inv_001', date: 'Mar 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
  { id: 'inv_002', date: 'Feb 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
  { id: 'inv_003', date: 'Jan 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
  { id: 'inv_004', date: 'Dec 28, 2025', description: 'Starter Plan — Monthly', amount: '$9.00', status: 'Paid' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentRow['status'] }) {
  const styles = {
    Paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  )
}

function UsageMeter({ stat }: { stat: UsageStat }) {
  const pct = Math.min(100, Math.round((stat.used / stat.limit) * 100))
  const isHigh = pct >= 80
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-300 text-sm">
          <span style={{ color: stat.color }}>{stat.icon}</span>
          {stat.label}
        </div>
        <span className="text-gray-300 text-xs tabular-nums">
          {stat.used.toLocaleString()} / {stat.limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isHigh ? '#f87171' : stat.color,
          }}
        />
      </div>
      <p className="text-gray-500 text-xs text-right">{pct}% used</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingClient() {
  const tokenPct = Math.min(100, Math.round((TOKENS_USED / TOKEN_LIMIT) * 100))
  const tokensRemaining = TOKEN_LIMIT - TOKENS_USED

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json() as { url: string; demo?: boolean }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Fallback: stay on billing page
      window.location.href = '/billing'
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Billing</h1>
        <p className="text-gray-300 mt-1 text-sm">Manage your plan, tokens, and payment history.</p>
      </div>

      <div className="space-y-4">

        {/* ── Current Plan ── */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Plan</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl font-bold text-white">{PLAN}</span>
                {/* Gold tier badge */}
                <span className="inline-flex items-center gap-1 bg-[#FFB81C]/15 text-[#FFB81C] border border-[#FFB81C]/30 text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] inline-block" />
                  Active
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{PLAN_DESCRIPTION}</p>
              <p className="text-gray-400 text-xs mt-2">
                <span className="text-white font-semibold">{MONTHLY_PRICE}/mo</span>
                {' '}· Renews {RENEW_DATE}
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <TrendingUp size={14} />
                Upgrade Plan
              </Link>
              <button
                onClick={openBillingPortal}
                className="text-xs text-gray-300 hover:text-blue-400 text-center transition-colors"
              >
                Manage billing →
              </button>
            </div>
          </div>
        </div>

        {/* ── Token Balance ── */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Token Balance</p>

          {/* Big number */}
          <div className="flex items-end gap-3 mb-1">
            <span className="text-5xl font-bold text-[#FFB81C] tabular-nums leading-none">
              {tokensRemaining.toLocaleString()}
            </span>
            <span className="text-gray-300 text-sm mb-1">remaining</span>
          </div>
          <p className="text-gray-400 text-xs mb-4">of {TOKEN_LIMIT.toLocaleString()} total this month</p>

          {/* Progress bar */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-1">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${tokenPct}%`,
                background: tokenPct >= 80
                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                  : 'linear-gradient(90deg, #FFB81C, #E6A519)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-5">
            <span>{TOKENS_USED.toLocaleString()} used</span>
            <span>{tokenPct}%</span>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 hover:bg-[#FFB81C]/5 text-[#FFB81C] px-4 py-2.5 rounded-xl transition-colors"
          >
            <Zap size={14} />
            Buy More Tokens
          </Link>
        </div>

        {/* ── Usage Breakdown ── */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Usage This Month</p>
          <div className="space-y-5">
            {USAGE_STATS.map(stat => (
              <UsageMeter key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* ── Payment History ── */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment History</p>
            <button
              onClick={openBillingPortal}
              className="text-xs text-[#FFB81C] hover:text-[#E6A519] flex items-center gap-1 transition-colors"
            >
              <CreditCard size={12} />
              Manage payment methods
            </button>
          </div>

          {PAYMENTS.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Description</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-3">Amount</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {PAYMENTS.map(row => (
                    <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 text-gray-300 text-xs whitespace-nowrap">{row.date}</td>
                      <td className="py-3.5 text-white pr-4">{row.description}</td>
                      <td className="py-3.5 text-white text-right tabular-nums font-medium">{row.amount}</td>
                      <td className="py-3.5 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
