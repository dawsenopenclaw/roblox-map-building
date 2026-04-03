'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { CreditCard, Zap, TrendingUp, Bot, Package, Star, Crown, Building2, Sparkles } from 'lucide-react'

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
  gradient: string
}

type BillingStatus = {
  plan: string
  tier: string
  status: string
  tokensUsed: number
  tokenLimit: number
  tokenBalance: number
  renewDate: string | null
  monthlyPrice: string
  cancelAtPeriodEnd: boolean
}

// ─── Free plan defaults (shown when not subscribed or data unavailable) ───────

const FREE_DEFAULTS: BillingStatus = {
  plan: 'Free',
  tier: 'FREE',
  status: 'ACTIVE',
  tokensUsed: 0,
  tokenLimit: 1000,
  tokenBalance: 1000,
  renewDate: null,
  monthlyPrice: 'Free',
  cancelAtPeriodEnd: false,
}

// ─── Tier config ──────────────────────────────────────────────────────────────

type TierConfig = {
  icon: React.ReactNode
  gradient: string
  glowColor: string
  badgeBg: string
  badgeBorder: string
}

function getTierConfig(tier: string): TierConfig {
  switch (tier) {
    case 'HOBBY':
      return {
        icon: <Star size={18} />,
        gradient: 'from-[#FFB81C]/20 via-[#FFB81C]/8 to-transparent',
        glowColor: 'shadow-[0_0_24px_rgba(255,184,28,0.18)]',
        badgeBg: 'bg-[#FFB81C]/15',
        badgeBorder: 'border-[#FFB81C]/40',
      }
    case 'CREATOR':
      return {
        icon: <Crown size={18} />,
        gradient: 'from-purple-500/20 via-purple-500/8 to-transparent',
        glowColor: 'shadow-[0_0_24px_rgba(168,85,247,0.18)]',
        badgeBg: 'bg-purple-500/15',
        badgeBorder: 'border-purple-500/40',
      }
    case 'STUDIO':
      return {
        icon: <Building2 size={18} />,
        gradient: 'from-blue-500/20 via-blue-500/8 to-transparent',
        glowColor: 'shadow-[0_0_24px_rgba(59,130,246,0.18)]',
        badgeBg: 'bg-blue-500/15',
        badgeBorder: 'border-blue-500/40',
      }
    default: // FREE
      return {
        icon: <Zap size={18} />,
        gradient: 'from-white/8 via-white/4 to-transparent',
        glowColor: '',
        badgeBg: 'bg-white/10',
        badgeBorder: 'border-white/20',
      }
  }
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetcher(url: string): Promise<BillingStatus | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json() as BillingStatus | null
  return data
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentRow['status'] }) {
  const styles = {
    Paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  )
}

function SectionDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  )
}

function UsageMeter({ stat }: { stat: UsageStat }) {
  const pct = Math.min(100, Math.round((stat.used / stat.limit) * 100))
  const isHigh = pct >= 80
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span style={{ color: stat.color }}>{stat.icon}</span>
          {stat.label}
        </div>
        <span className="text-gray-400 text-xs tabular-nums font-medium">
          {stat.used.toLocaleString()} / {stat.limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
              : stat.gradient,
          }}
        />
      </div>
      <p className="text-gray-600 text-xs text-right">{pct}% used</p>
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-white/[0.07] rounded-lg animate-pulse ${className ?? ''}`} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingClient() {
  const { data: rawBilling, isLoading } = useSWR<BillingStatus | null>(
    '/api/billing/status',
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fall back to Free defaults if null response (DB not connected) or still loading
  const billing: BillingStatus = rawBilling ?? FREE_DEFAULTS

  const tokenPct = Math.min(100, Math.round((billing.tokensUsed / billing.tokenLimit) * 100))
  const tokensRemaining = Math.max(0, billing.tokenLimit - billing.tokensUsed)
  const tierConfig = getTierConfig(billing.tier)

  const usageStats: UsageStat[] = [
    {
      label: 'Tokens Used',
      used: billing.tokensUsed,
      limit: billing.tokenLimit,
      icon: <Bot size={14} />,
      color: '#FFB81C',
      gradient: 'linear-gradient(90deg, #FFB81C 0%, #E6A519 100%)',
    },
    {
      label: 'Marketplace Searches',
      used: 0,
      limit: 500,
      icon: <Package size={14} />,
      color: '#60a5fa',
      gradient: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
    },
    {
      label: 'API Calls',
      used: 0,
      limit: 10_000,
      icon: <Zap size={14} />,
      color: '#a78bfa',
      gradient: 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)',
    },
  ]

  const payments: PaymentRow[] = []

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json() as { url: string; demo?: boolean }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      window.location.href = '/billing'
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Gradient Header ── */}
      <div className="relative mb-10 pb-8">
        {/* Ambient glow behind header */}
        <div className="absolute -top-6 -left-4 w-64 h-32 bg-[#FFB81C]/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-[#FFB81C]/70 uppercase tracking-[0.15em] mb-2">
                Account Billing
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {isLoading ? (
                  <SkeletonBlock className="h-10 w-32 inline-block" />
                ) : (
                  <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                    {billing.plan} Plan
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Manage your plan, tokens, and payment history.
              </p>
            </div>
            {!isLoading && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${tierConfig.badgeBg} ${tierConfig.badgeBorder}`}>
                <span className="text-[#FFB81C]">{tierConfig.icon}</span>
                <span className="text-sm font-bold text-white">{billing.tier}</span>
              </div>
            )}
          </div>
        </div>
        {/* Bottom fade divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="space-y-5">

        {/* ── Current Plan ── */}
        <div className={`relative overflow-hidden bg-[#0F1320] border border-white/[0.08] rounded-2xl p-7 ${tierConfig.glowColor}`}>
          {/* Tier gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${tierConfig.gradient} pointer-events-none`} />
          <div className="relative">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] mb-5">Current Plan</p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                {isLoading ? (
                  <div className="space-y-2.5 mb-2">
                    <SkeletonBlock className="h-9 w-28" />
                    <SkeletonBlock className="h-4 w-56" />
                    <SkeletonBlock className="h-3 w-40 mt-2" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-white">{billing.plan}</span>
                      <span className={`inline-flex items-center gap-1.5 ${tierConfig.badgeBg} border ${tierConfig.badgeBorder} text-[#FFB81C] text-xs font-bold px-3 py-1.5 rounded-full`}
                        style={{ textShadow: '0 0 8px rgba(255,184,28,0.5)' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] inline-block animate-pulse" />
                        {billing.status === 'ACTIVE' || billing.status === 'TRIALING' ? 'Active' : billing.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {billing.tokenLimit.toLocaleString()} tokens/month
                      {billing.tier !== 'FREE' ? ' · Full AI access · Priority builds' : ' · Basic AI access'}
                    </p>
                    <p className="text-gray-500 text-xs mt-2.5">
                      <span className="text-white font-semibold text-sm">
                        {billing.monthlyPrice}{billing.monthlyPrice !== 'Free' ? '/mo' : ''}
                      </span>
                      {billing.renewDate && (
                        <span className="ml-1.5">
                          · {billing.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} {billing.renewDate}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2.5 flex-shrink-0">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-[#FFB81C]/20"
                >
                  <TrendingUp size={14} />
                  {billing.tier === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
                </Link>
                <button
                  onClick={openBillingPortal}
                  className="text-xs text-gray-500 hover:text-[#FFB81C] text-center transition-colors"
                >
                  Manage billing →
                </button>
              </div>
            </div>
          </div>
        </div>

        <SectionDivider />

        {/* ── Token Balance ── */}
        <div className="relative overflow-hidden bg-[#0F1320] border border-white/[0.08] rounded-2xl p-7">
          {/* Subtle gold ambient */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB81C]/[0.04] rounded-full blur-3xl pointer-events-none translate-x-16 -translate-y-16" />
          <div className="relative">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] mb-6">Token Balance</p>

            {isLoading ? (
              <div className="space-y-3 mb-6">
                <SkeletonBlock className="h-14 w-36" />
                <SkeletonBlock className="h-3 w-52" />
                <SkeletonBlock className="h-2 w-full mt-3" />
              </div>
            ) : (
              <>
                {/* Big number with glow */}
                <div className="flex items-end gap-3 mb-1.5">
                  <span
                    className="text-6xl font-bold tabular-nums leading-none"
                    style={{
                      color: '#FFB81C',
                      textShadow: '0 0 40px rgba(255,184,28,0.35), 0 0 80px rgba(255,184,28,0.12)',
                    }}
                  >
                    {tokensRemaining.toLocaleString()}
                  </span>
                  <span className="text-gray-500 text-base mb-1.5">remaining</span>
                </div>
                <p className="text-gray-600 text-xs mb-5">
                  of {billing.tokenLimit.toLocaleString()} total this month
                </p>

                {/* Progress bar — gradient */}
                <div className="relative h-2 bg-white/[0.07] rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${tokenPct}%`,
                      background: tokenPct >= 80
                        ? 'linear-gradient(90deg, #fbbf24 0%, #f87171 60%, #ef4444 100%)'
                        : 'linear-gradient(90deg, #FFB81C 0%, #f59e0b 50%, #FFB81C 100%)',
                      boxShadow: tokenPct >= 80
                        ? '0 0 8px rgba(239,68,68,0.6)'
                        : '0 0 8px rgba(255,184,28,0.5)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mb-6">
                  <span>{billing.tokensUsed.toLocaleString()} used</span>
                  <span>{tokenPct}%</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/tokens"
                className="inline-flex items-center gap-2 text-sm font-semibold border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 hover:bg-[#FFB81C]/5 text-[#FFB81C] px-4 py-2.5 rounded-xl transition-colors"
              >
                <Zap size={14} />
                Buy More Tokens
              </Link>
              <Link
                href="/tokens"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Need more tokens? →
              </Link>
            </div>
          </div>
        </div>

        <SectionDivider />

        {/* ── Usage Breakdown ── */}
        <div className="bg-[#0F1320] border border-white/[0.08] rounded-2xl p-7">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={14} className="text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em]">Usage This Month</p>
          </div>
          {isLoading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                  <SkeletonBlock className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {usageStats.map(stat => (
                <UsageMeter key={stat.label} stat={stat} />
              ))}
            </div>
          )}
        </div>

        <SectionDivider />

        {/* ── Payment History ── */}
        <div className="bg-[#0F1320] border border-white/[0.08] rounded-2xl p-7">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-gray-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em]">Payment History</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={openBillingPortal}
                className="text-xs text-[#FFB81C] hover:text-[#E6A519] flex items-center gap-1.5 transition-colors"
              >
                View all in Stripe →
              </button>
              <button
                onClick={openBillingPortal}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors"
              >
                <CreditCard size={11} />
                Payment methods
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between gap-4">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-4 flex-1" />
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                <CreditCard size={18} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">No payment history yet.</p>
              <button
                onClick={openBillingPortal}
                className="text-xs text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors mt-1.5"
              >
                View in Stripe →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-gray-600 font-medium pb-3">Date</th>
                    <th className="text-left text-xs text-gray-600 font-medium pb-3">Description</th>
                    <th className="text-right text-xs text-gray-600 font-medium pb-3">Amount</th>
                    <th className="text-right text-xs text-gray-600 font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.map(row => (
                    <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-gray-500 text-xs whitespace-nowrap">{row.date}</td>
                      <td className="py-4 text-white pr-4">{row.description}</td>
                      <td className="py-4 text-white text-right tabular-nums font-medium">{row.amount}</td>
                      <td className="py-4 text-right">
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
