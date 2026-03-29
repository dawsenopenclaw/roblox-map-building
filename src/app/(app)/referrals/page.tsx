'use client'

import { useState } from 'react'
import { Users, Copy, Check, Gift, TrendingUp, Link2 } from 'lucide-react'
import Link from 'next/link'

// ─── Mock data ────────────────────────────────────────────────────────────────

const REFERRAL_CODE = 'DAWSEN-FG42'
const REFERRAL_LINK = 'https://forjegames.gg/ref/DAWSEN-FG42'

const STATS = [
  { label: 'Total Referrals', value: '12', sub: 'Signed up', icon: Users, color: '#FFB81C' },
  { label: 'Converted', value: '5', sub: 'Upgraded to paid', icon: TrendingUp, color: '#60a5fa' },
  { label: 'Credits Earned', value: '$75.00', sub: 'In account credit', icon: Gift, color: '#34d399' },
]

type ReferralRow = {
  id: string
  user: string
  joinedAt: string
  plan: string
  status: 'Converted' | 'Free'
  credit: string
}

const REFERRALS: ReferralRow[] = [
  { id: 'r1', user: 'alex_builds', joinedAt: 'Mar 20, 2026', plan: 'Pro', status: 'Converted', credit: '$15.00' },
  { id: 'r2', user: 'gamesdev99', joinedAt: 'Mar 14, 2026', plan: 'Pro', status: 'Converted', credit: '$15.00' },
  { id: 'r3', user: 'robloxstudio_x', joinedAt: 'Feb 28, 2026', plan: 'Starter', status: 'Converted', credit: '$5.00' },
  { id: 'r4', user: 'mapmaker_z', joinedAt: 'Feb 10, 2026', plan: 'Free', status: 'Free', credit: '—' },
  { id: 'r5', user: 'studio_pro7', joinedAt: 'Jan 22, 2026', plan: 'Pro', status: 'Converted', credit: '$15.00' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_CODE)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Referrals</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Invite friends and earn $15 credit for every paid conversion.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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

      {/* Share section */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Your Referral Links</p>

        {/* Code */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1.5">Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-3 font-mono text-[#FFB81C] text-sm font-bold tracking-widest">
              {REFERRAL_CODE}
            </div>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {codeCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Referral Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm font-mono truncate">
              {REFERRAL_LINK}
            </div>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {linkCopied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
              {linkCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#FFB81C]/5 border border-[#FFB81C]/20 rounded-xl p-5 mb-6">
        <p className="text-[#FFB81C] font-semibold text-sm mb-3">How it works</p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>1. Share your code or link with a friend.</p>
          <p>2. They sign up and upgrade to any paid plan.</p>
          <p>3. You earn <span className="text-white font-semibold">$15 account credit</span> per paid conversion.</p>
          <p>4. Credits apply automatically to your next invoice.</p>
        </div>
      </div>

      {/* Referrals table */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Your Referrals</p>

        {REFERRALS.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No referrals yet. Share your code to get started.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">User</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Joined</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Plan</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-3">Credit</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {REFERRALS.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-white font-medium text-sm">@{row.user}</td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{row.joinedAt}</td>
                    <td className="py-3 text-gray-300 text-xs">{row.plan}</td>
                    <td className="py-3 text-right text-[#FFB81C] tabular-nums text-sm font-semibold">{row.credit}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          row.status === 'Converted'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-gray-500 border-white/10'
                        }`}
                      >
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
    </div>
  )
}
