'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Token pack data ─────────────────────────────────────────────────────────

const TOKEN_PACKS = [
  {
    id: 'pack-2k',
    name: 'Starter',
    tokens: 2_000,
    price: '$4',
    priceCents: 400,
    pricePerK: '$2.00',
    highlight: false,
  },
  {
    id: 'pack-5k',
    name: 'Builder',
    tokens: 5_000,
    price: '$9',
    priceCents: 900,
    pricePerK: '$1.80',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'pack-15k',
    name: 'Studio',
    tokens: 15_000,
    price: '$24',
    priceCents: 2400,
    pricePerK: '$1.60',
    highlight: false,
    badge: 'Best Value',
  },
]

// ─── Usage history mock (replace with real API) ──────────────────────────────

const HISTORY = [
  { id: 1, label: 'Voice Build — Roblox Map', time: '2h ago', tokens: -420 },
  { id: 2, label: 'Image to Map conversion', time: '1d ago', tokens: -850 },
  { id: 3, label: 'Game DNA scan', time: '2d ago', tokens: -180 },
  { id: 4, label: 'Tokens purchased — Starter pack', time: '3d ago', tokens: 2000 },
  { id: 5, label: 'AI template generation', time: '5d ago', tokens: -240 },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CoinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 7v1m0 8v1M9.5 9.5A2.5 2.5 0 0112 8a2.5 2.5 0 010 5 2.5 2.5 0 000 5 2.5 2.5 0 002.5-1.5" />
    </svg>
  )
}

function PurchaseButton({ pack }: { pack: typeof TOKEN_PACKS[number] }) {
  const [loading, setLoading] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens', tokens: pack.tokens, priceCents: pack.priceCents }),
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
      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
        pack.highlight
          ? 'bg-[#D4AF37] hover:bg-[#FFB81C] text-[#0a0a0a] shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 hover:-translate-y-0.5'
          : 'bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.10] hover:border-white/20'
      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
    >
      {loading ? 'Redirecting…' : `Buy ${pack.name}`}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const { data } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30_000 })
  const balance: number = data?.balance ?? 0
  const lifetimeSpent: number = data?.lifetimeSpent ?? 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tokens</h1>
        <p className="text-gray-400 text-sm mt-1">
          Purchase token packs to power AI builds, map generation, and more.
        </p>
      </div>

      {/* Balance hero */}
      <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-2xl p-8 mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/70 mb-2">
          Current Balance
        </p>
        <p className="text-6xl font-black text-[#D4AF37] tabular-nums mb-1">
          {balance.toLocaleString()}
        </p>
        <p className="text-gray-400 text-sm mb-6">
          {lifetimeSpent.toLocaleString()} tokens spent lifetime
        </p>
        <div className="flex items-center justify-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <span className="text-[#D4AF37]"><CoinIcon /></span>
            <span className="text-[#D4AF37] font-semibold">Monthly tokens reset with your plan</span>
          </div>
          <Link
            href="/billing"
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-blue-400 hover:border-blue-400/30 hover:bg-white/[0.04] transition-colors"
          >
            View Plan
          </Link>
        </div>
      </div>

      {/* Token packs */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Top Up
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {TOKEN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`bg-[#141414] rounded-2xl p-6 text-center flex flex-col transition-all duration-150 ${
              pack.highlight
                ? 'border border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                : 'border border-white/[0.08] hover:border-white/20'
            }`}
          >
            {pack.badge ? (
              <span
                className={`self-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
                  pack.highlight
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                }`}
              >
                {pack.badge}
              </span>
            ) : (
              <span className="mb-3 h-6" />
            )}

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {pack.name}
            </p>
            <p className="text-4xl font-black text-[#D4AF37] tabular-nums mb-0.5">
              {pack.tokens.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-500 mb-1">tokens</p>
            <p className="text-xl font-bold text-white mb-1">{pack.price}</p>
            <p className="text-xs text-gray-500 mb-5">{pack.pricePerK} per 1k tokens</p>
            <div className="mt-auto">
              <PurchaseButton pack={pack} />
            </div>
          </div>
        ))}
      </div>

      {/* Usage history */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
          Recent Usage
        </h2>
        <div className="space-y-0">
          {HISTORY.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center justify-between py-3 ${
                i < HISTORY.length - 1 ? 'border-b border-white/[0.05]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    row.tokens > 0
                      ? 'bg-green-400/10 border border-green-400/20'
                      : 'bg-white/[0.05] border border-white/[0.08]'
                  }`}
                  aria-hidden="true"
                >
                  <span className={`text-xs font-bold ${row.tokens > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {row.tokens > 0 ? '+' : '−'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.time}</p>
                </div>
              </div>
              <span
                className={`text-sm font-bold tabular-nums ${
                  row.tokens > 0 ? 'text-green-400' : 'text-[#D4AF37]'
                }`}
              >
                {row.tokens > 0 ? '+' : ''}{row.tokens.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
