'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

// ─── Demo Data ────────────────────────────────────────────────────────────────

const GOLD = '#FFB81C'
const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PLAN_LIMIT = 5_000

interface UsageSegment {
  label: string
  key: string
  tokens: number
  color: string
  icon: string
}

const USAGE_SEGMENTS: UsageSegment[] = [
  { label: 'Builds',   key: 'build',   tokens: 980,  color: GOLD,      icon: '🔨' },
  { label: 'Mesh Gen', key: 'mesh',    tokens: 540,  color: '#60A5FA', icon: '🧊' },
  { label: 'Textures', key: 'texture', tokens: 320,  color: '#34D399', icon: '🎨' },
  { label: 'Scripts',  key: 'script',  tokens: 460,  color: '#A78BFA', icon: '⚙️' },
]
const TOTAL_USED = USAGE_SEGMENTS.reduce((s, u) => s + u.tokens, 0)

interface Transaction {
  id: string
  date: string
  type: 'Build' | 'Mesh' | 'Texture' | 'Script' | 'Purchase' | 'Bonus'
  description: string
  amount: number
  balance: number
}

const TRANSACTIONS: Transaction[] = [
  { id: 't1',  date: '2026-03-29', type: 'Build',    description: 'Castle entrance arch generation',    amount: -28,  balance: 2840 },
  { id: 't2',  date: '2026-03-29', type: 'Script',   description: 'Enemy patrol AI with LOS detection', amount: -32,  balance: 2868 },
  { id: 't3',  date: '2026-03-28', type: 'Texture',  description: 'Mossy cobblestone PBR set 4K',       amount: -8,   balance: 2900 },
  { id: 't4',  date: '2026-03-28', type: 'Build',    description: 'Rolling hills biome generation',     amount: -14,  balance: 2908 },
  { id: 't5',  date: '2026-03-27', type: 'Mesh',     description: 'Fantasy tree pack — 6 variants',     amount: -19,  balance: 2922 },
  { id: 't6',  date: '2026-03-26', type: 'Purchase', description: 'Token top-up — Starter pack',        amount: 500,  balance: 2941 },
  { id: 't7',  date: '2026-03-25', type: 'Build',    description: 'Spawn island terrain generation',    amount: -42,  balance: 2441 },
  { id: 't8',  date: '2026-03-24', type: 'Script',   description: 'Leaderboard sorting & display UI',   amount: -18,  balance: 2483 },
  { id: 't9',  date: '2026-03-23', type: 'Bonus',    description: 'Daily login streak bonus (7 days)',  amount: 50,   balance: 2501 },
  { id: 't10', date: '2026-03-22', type: 'Texture',  description: 'Wooden plank material set',          amount: -6,   balance: 2451 },
]

const TYPE_META: Record<Transaction['type'], { icon: string; color: string }> = {
  Build:    { icon: '🔨', color: GOLD },
  Mesh:     { icon: '🧊', color: '#60A5FA' },
  Texture:  { icon: '🎨', color: '#34D399' },
  Script:   { icon: '⚙️', color: '#A78BFA' },
  Purchase: { icon: '⚡', color: '#10B981' },
  Bonus:    { icon: '🎁', color: '#F59E0B' },
}

const TOKEN_PACKS = [
  { id: 'pack-500',   name: 'Starter', tokens: 500,   price: '$4.99',  priceCents: 499,  pricePerK: '$9.98', badge: null,         popular: false },
  { id: 'pack-2000',  name: 'Builder', tokens: 2000,  price: '$14.99', priceCents: 1499, pricePerK: '$7.50', badge: 'Most Popular', popular: true  },
  { id: 'pack-10000', name: 'Studio',  tokens: 10000, price: '$49.99', priceCents: 4999, pricePerK: '$5.00', badge: '2.5× Value',   popular: false },
]

// ─── Purchase Button ──────────────────────────────────────────────────────────

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
      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50"
      style={{
        background: pack.popular ? GOLD : 'rgba(255,255,255,0.07)',
        color: pack.popular ? '#000' : 'white',
        border: pack.popular ? 'none' : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {loading ? 'Redirecting…' : `Buy ${pack.name}`}
    </button>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart() {
  let cumulative = 0
  const stops = USAGE_SEGMENTS.map((seg) => {
    const pct = (seg.tokens / TOTAL_USED) * 100
    const start = cumulative
    cumulative += pct
    return { ...seg, start, end: cumulative }
  })
  const conicGradient = `conic-gradient(${stops.map((s) => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`).join(', ')})`

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative flex-shrink-0">
        <div className="w-40 h-40 rounded-full" style={{ background: conicGradient }} />
        <div
          className="absolute inset-0 m-auto w-[96px] h-[96px] rounded-full flex flex-col items-center justify-center"
          style={{ background: '#111111' }}
        >
          <p className="text-2xl font-bold text-white tabular-nums">{TOTAL_USED.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">used</p>
        </div>
      </div>
      <div className="flex-1 w-full space-y-3">
        {USAGE_SEGMENTS.map((seg) => {
          const pct = ((seg.tokens / TOTAL_USED) * 100).toFixed(1)
          return (
            <div key={seg.key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${seg.color}12`, border: `1px solid ${seg.color}20` }}>
                {seg.icon}
              </div>
              <div className="flex-1 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300 w-16">{seg.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: seg.color }} />
                </div>
                <span className="text-[11px] text-gray-500 w-10 text-right tabular-nums">{pct}%</span>
                <span className="text-sm font-bold text-white w-12 text-right tabular-nums">
                  {seg.tokens.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const { data } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30_000 })
  const balance: number = data?.balance ?? 2840
  const lifetimeSpent: number = data?.lifetimeSpent ?? 15_240
  const balancePct = Math.round((balance / PLAN_LIMIT) * 100)

  return (
    <div className="max-w-5xl mx-auto text-white space-y-8 pb-12">

      {/* ── Header ───────────────────────────────────────────────────────── */}
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
          <span>⚡</span>
          Buy Tokens
        </Link>
      </div>

      {/* ── Balance Hero ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{ background: 'linear-gradient(135deg, #161616 0%, #111111 100%)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-2">Current Balance</p>
            <p className="text-6xl font-black tabular-nums" style={{ color: GOLD }}>
              {balance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              of {PLAN_LIMIT.toLocaleString()} monthly tokens &mdash; {lifetimeSpent.toLocaleString()} spent lifetime
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Used this month</p>
              <p className="text-xl font-bold text-white tabular-nums">{TOTAL_USED.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Resets in</p>
              <p className="text-xl font-bold text-white tabular-nums">2 days</p>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-gray-600 mb-2">
            <span>{balancePct}% remaining</span>
            <span>{(PLAN_LIMIT - balance).toLocaleString()} used of plan</span>
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
      </div>

      {/* ── Usage Breakdown ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: '#111111' }}>
        <h2 className="text-sm font-bold text-white mb-5">Usage Breakdown</h2>
        <DonutChart />
      </div>

      {/* ── Transaction History ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Transaction History</h2>
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: '#111111' }}>
          {/* Header row */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Description</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Date</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Amount</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Balance</span>
          </div>
          {TRANSACTIONS.map((tx, idx) => {
            const meta = TYPE_META[tx.type]
            const isPositive = tx.amount > 0
            return (
              <div
                key={tx.id}
                className={`flex sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.03] ${
                  idx < TRANSACTIONS.length - 1 ? 'border-b border-white/[0.05]' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}20` }}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 truncate">{tx.description}</p>
                    <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{tx.type}</span>
                  </div>
                </div>
                <span className="hidden sm:block text-[11px] text-gray-600 tabular-nums text-right">{tx.date}</span>
                <span className={`text-sm font-bold tabular-nums text-right flex-shrink-0 ${isPositive ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {isPositive ? '+' : ''}{tx.amount}
                </span>
                <span className="text-sm font-semibold text-white tabular-nums text-right flex-shrink-0">
                  {tx.balance.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Buy More Tokens ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Buy More Tokens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border p-5 flex flex-col transition-all duration-200 relative overflow-hidden"
              style={{
                background: pack.popular ? `${GOLD}08` : '#111111',
                borderColor: pack.popular ? `${GOLD}40` : 'rgba(255,255,255,0.08)',
                boxShadow: pack.popular ? `0 0 24px ${GOLD}10` : 'none',
              }}
            >
              {pack.badge ? (
                <span
                  className="self-start text-[9px] font-bold px-2 py-0.5 rounded-full mb-3"
                  style={{ background: GOLD, color: '#000' }}
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
          ))}
        </div>
      </div>
    </div>
  )
}
