'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#FFB81C'
const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TOKEN_PACKS = [
  { slug: 'starter', name: 'Starter', tokens: 1_000,  price: '$10.00', pricePerK: '$10.00', badge: null,           popular: false },
  { slug: 'creator', name: 'Creator', tokens: 5_000,  price: '$45.00', pricePerK: '$9.00',  badge: 'Most Popular', popular: true  },
  { slug: 'pro',     name: 'Pro',     tokens: 15_000, price: '$120.00', pricePerK: '$8.00',  badge: 'Best Value',   popular: false },
]

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconCoins({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconZap({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function IconArrowDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 5v14m0 0l-6-6m6 6l6-6" />
    </svg>
  )
}

function IconArrowUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19V5m0 0l-6 6m6-6l6 6" />
    </svg>
  )
}

function IconExternalLink({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BalanceData {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  transactions: ApiTransaction[]
  demo: boolean
}

interface ApiTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  createdAt: string
}

interface BillingStatus {
  plan: string
  tier: string
  tokenLimit: number
  tokensUsed: number
  tokenBalance: number
  renewDate: string | null
  monthlyPrice: string
}

// ─── Purchase Button ──────────────────────────────────────────────────────────

function PurchaseButton({ pack }: { pack: typeof TOKEN_PACKS[number] }) {
  const [loading, setLoading] = useState(false)
  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'token_pack', packSlug: pack.slug }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
      style={{
        background: pack.popular ? GOLD : 'rgba(255,255,255,0.07)',
        color: pack.popular ? '#000' : 'white',
        border: pack.popular ? 'none' : '1px solid rgba(255,255,255,0.10)',
        boxShadow: pack.popular ? `0 2px 14px ${GOLD}50` : 'none',
      }}
    >
      {loading ? 'Redirecting...' : `Buy ${pack.name}`}
    </button>
  )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx, isLast }: { tx: ApiTransaction; isLast: boolean }) {
  const isCredit = tx.type === 'CREDIT'
  const date = new Date(tx.createdAt).toLocaleDateString('en-CA') // YYYY-MM-DD

  return (
    <div
      className={`flex sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.03] ${
        !isLast ? 'border-b border-white/[0.05]' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isCredit ? 'rgba(16,185,129,0.08)' : 'rgba(255,184,28,0.08)',
            border: isCredit ? '1px solid rgba(16,185,129,0.20)' : `1px solid ${GOLD}20`,
            color: isCredit ? '#10B981' : GOLD,
          }}
        >
          {isCredit ? <IconArrowUp /> : <IconArrowDown />}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-200 truncate">{tx.description}</p>
          <span
            className="text-[10px] font-semibold"
            style={{ color: isCredit ? '#10B981' : '#9CA3AF' }}
          >
            {isCredit ? 'Credit' : 'Debit'}
          </span>
        </div>
      </div>
      <span className="hidden sm:block text-[11px] text-gray-600 tabular-nums text-right">{date}</span>
      <span
        className="text-sm font-bold tabular-nums text-right flex-shrink-0"
        style={{ color: isCredit ? '#10B981' : '#D1D5DB' }}
      >
        {isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const { data: balanceData, isLoading: balanceLoading } = useSWR<BalanceData>(
    '/api/tokens/balance',
    fetcher,
    { refreshInterval: 30_000 }
  )
  const { data: billingData } = useSWR<BillingStatus | null>(
    '/api/billing/status',
    fetcher,
    { refreshInterval: 60_000 }
  )

  const balance: number = balanceData?.balance ?? 0
  const lifetimeSpent: number = balanceData?.lifetimeSpent ?? 0
  const transactions: ApiTransaction[] = balanceData?.transactions ?? []
  const isDemoMode: boolean = balanceData?.demo ?? true

  // Use real tier limit from billing status; fall back to 0 while loading
  const planLimit: number = billingData?.tokenLimit ?? 0
  const tokensUsed: number = billingData?.tokensUsed ?? 0
  const renewDate: string | null = billingData?.renewDate ?? null
  const planName: string = billingData?.plan ?? '—'

  // Balance % — only show progress bar if we have a real limit
  const balancePct = planLimit > 0 ? Math.min(100, Math.round((balance / planLimit) * 100)) : 0
  const usedPct = planLimit > 0 ? Math.min(100, Math.round((tokensUsed / planLimit) * 100)) : 0

  return (
    <div className="max-w-5xl mx-auto text-white space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Token Usage</h1>
          <p className="text-gray-500 text-sm mt-1">Track consumption and top up your balance</p>
        </div>
        <Link
          href="/billing"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
          style={{ background: GOLD, boxShadow: `0 0 16px ${GOLD}30` }}
        >
          <IconCoins className="w-4 h-4" />
          Buy Tokens
        </Link>
      </div>

      {/* Demo mode notice */}
      {isDemoMode && !balanceLoading && (
        <div
          className="rounded-xl border px-4 py-3 text-sm text-amber-300 flex items-center gap-2"
          style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.20)' }}
        >
          <IconZap className="w-4 h-4 flex-shrink-0" />
          <span>
            Showing demo data — connect your account to see real token usage.{' '}
            <Link href="/billing" className="underline underline-offset-2 hover:text-amber-200">
              Upgrade plan
            </Link>
          </span>
        </div>
      )}

      {/* Balance Hero */}
      <div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{ background: 'linear-gradient(135deg, #161616 0%, #111111 100%)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-2">Current Balance</p>
            {balanceLoading ? (
              <div className="h-16 w-40 rounded-xl bg-white/[0.06] animate-pulse" />
            ) : (
              <p className="text-6xl font-black tabular-nums" style={{ color: GOLD }}>
                {balance.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {planLimit > 0
                ? <>of {planLimit.toLocaleString()} monthly tokens ({planName} plan)</>
                : <span className="text-gray-600">— monthly limit loading</span>
              }
              {lifetimeSpent > 0 && (
                <> &mdash; {lifetimeSpent.toLocaleString()} spent lifetime</>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Used this month</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {planLimit > 0 ? tokensUsed.toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Resets on</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {renewDate ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar — only render if we have real limit data */}
        {planLimit > 0 && (
          <div>
            <div className="flex justify-between text-[11px] text-gray-600 mb-2">
              <span>{balancePct}% remaining</span>
              <span>{usedPct}% of plan used this month</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${balancePct}%`,
                  background: `linear-gradient(90deg, ${GOLD}aa, ${GOLD})`,
                  boxShadow: `0 0 8px ${GOLD}40`,
                }}
              />
            </div>
          </div>
        )}
        {planLimit === 0 && !balanceLoading && (
          <div className="h-3 rounded-full bg-white/[0.06]" />
        )}
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Transaction History</h2>
          <Link
            href="/billing"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-300 transition-colors"
          >
            View full usage in billing
            <IconExternalLink />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: '#111111' }}>
          {/* Header row */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Description</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Date</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Amount</span>
          </div>

          {balanceLoading ? (
            // Skeleton rows
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`px-5 py-3.5 flex items-center gap-3 ${i < 3 ? 'border-b border-white/[0.05]' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded bg-white/[0.06] animate-pulse w-3/4" />
                  <div className="h-2.5 rounded bg-white/[0.04] animate-pulse w-1/4" />
                </div>
                <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}
              >
                <IconCoins className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
              <p className="text-[11px] text-gray-600 max-w-xs">
                Token activity will appear here once you start using ForjeAI or purchase tokens.
              </p>
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <TransactionRow key={tx.id} tx={tx} isLast={idx === transactions.length - 1} />
            ))
          )}
        </div>
      </div>

      {/* Buy More Tokens */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Buy More Tokens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOKEN_PACKS.map((pack) => {
            const isBestValue = pack.badge === 'Best Value'
            return (
              <div
                key={pack.slug}
                className="rounded-2xl border p-5 flex flex-col transition-all duration-200 relative overflow-hidden"
                style={{
                  background: pack.popular
                    ? `linear-gradient(160deg, ${GOLD}0d 0%, #111111 60%)`
                    : '#111111',
                  borderColor: pack.popular
                    ? `${GOLD}55`
                    : isBestValue
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: pack.popular
                    ? `0 0 32px ${GOLD}18, inset 0 1px 0 ${GOLD}18`
                    : 'none',
                }}
              >
                {pack.badge ? (
                  <span
                    className="self-start text-[9px] font-bold px-2 py-0.5 rounded-full mb-3"
                    style={
                      pack.popular
                        ? { background: GOLD, color: '#000' }
                        : { background: 'rgba(255,255,255,0.10)', color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)' }
                    }
                  >
                    {pack.badge}
                  </span>
                ) : <span className="mb-3 h-5 block" />}
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{pack.name}</p>
                <p className="text-4xl font-black tabular-nums mb-0.5" style={{ color: pack.popular ? GOLD : 'white' }}>
                  {pack.tokens.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-600 mb-1">tokens</p>
                <p className="text-xl font-bold text-white mb-0.5">{pack.price}</p>
                <p className="text-[11px] text-gray-600 mb-5">{pack.pricePerK} per 1k tokens</p>
                <div className="mt-auto">
                  <PurchaseButton pack={pack} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
