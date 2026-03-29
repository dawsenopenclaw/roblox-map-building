'use client'

import { TrendingUp, DollarSign, ShoppingBag, Users, Download } from 'lucide-react'
import Link from 'next/link'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Earned', value: '$1,284.50', sub: 'All time', icon: DollarSign, color: '#FFB81C' },
  { label: 'This Month', value: '$142.00', sub: 'Mar 2026', icon: TrendingUp, color: '#60a5fa' },
  { label: 'Templates Sold', value: '38', sub: 'All time', icon: ShoppingBag, color: '#a78bfa' },
  { label: 'Referral Earnings', value: '$56.00', sub: 'All time', icon: Users, color: '#34d399' },
]

type PayoutRow = {
  id: string
  date: string
  description: string
  amount: string
  status: 'Paid' | 'Pending' | 'Processing'
}

const PAYOUTS: PayoutRow[] = [
  { id: 'p1', date: 'Mar 15, 2026', description: 'Template sales — March (1–15)', amount: '$142.00', status: 'Pending' },
  { id: 'p2', date: 'Feb 28, 2026', description: 'Template sales — February', amount: '$198.50', status: 'Paid' },
  { id: 'p3', date: 'Jan 31, 2026', description: 'Template sales — January', amount: '$224.00', status: 'Paid' },
  { id: 'p4', date: 'Dec 31, 2025', description: 'Template sales — December', amount: '$412.00', status: 'Paid' },
  { id: 'p5', date: 'Nov 30, 2025', description: 'Template sales — November', amount: '$308.00', status: 'Paid' },
]

const STATUS_STYLES: Record<PayoutRow['status'], string> = {
  Paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Earnings</h1>
          <p className="text-gray-400 mt-1 text-sm">Your marketplace revenue and payout history.</p>
        </div>
        <button
          onClick={() => window.open('/api/earnings/export', '_blank')}
          className="inline-flex items-center gap-2 text-sm border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-gray-600 text-xs mt-0.5">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Payout schedule banner */}
      <div className="bg-[#FFB81C]/5 border border-[#FFB81C]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <TrendingUp size={16} className="text-[#FFB81C] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[#FFB81C] text-sm font-semibold">Payouts processed on the 1st and 15th</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Earnings from template sales are paid out twice monthly via Stripe.{' '}
            <Link href="/billing" className="text-[#FFB81C] hover:text-[#E6A519] transition-colors">
              Manage payout settings
            </Link>
          </p>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Payout History</p>

        {PAYOUTS.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No payouts yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Date</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Description</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-3">Amount</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {PAYOUTS.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-gray-400 text-xs whitespace-nowrap">{row.date}</td>
                    <td className="py-3.5 text-white pr-4">{row.description}</td>
                    <td className="py-3.5 text-white text-right tabular-nums font-medium">{row.amount}</td>
                    <td className="py-3.5 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-6 bg-[#0D1231] border border-white/10 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">Sell your map templates</p>
          <p className="text-gray-400 text-xs mt-0.5">List your maps on the marketplace and earn 80% of every sale.</p>
        </div>
        <Link
          href="/marketplace/submit"
          className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
        >
          <ShoppingBag size={14} />
          Submit Template
        </Link>
      </div>
    </div>
  )
}
