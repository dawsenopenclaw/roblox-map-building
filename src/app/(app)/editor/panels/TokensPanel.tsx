'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  createdAt: string
}

interface TokenBalanceData {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
  transactions: Transaction[]
  demo: boolean
}

export interface TokensPanelProps {
  tokensUsed: number
}

export default function TokensPanel({ tokensUsed }: TokensPanelProps) {
  const [data, setData] = useState<TokenBalanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/tokens/balance')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // network failure — leave data null, UI shows fallback
      } finally {
        setLoading(false)
      }
    }
    fetchBalance()
  }, [])

  // Derive values — fall back to safe defaults while loading or on error
  const balance = data?.balance ?? 1000
  const TOKEN_LIMIT = data?.lifetimeEarned ?? 1000
  const remaining = Math.max(0, balance - tokensUsed)
  const usedPct = Math.min(100, (tokensUsed / TOKEN_LIMIT) * 100)

  const recentUsage = data
    ? data.transactions
        .filter((t) => t.type === 'DEBIT')
        .slice(0, 5)
        .map((t) => ({ cmd: t.description, tokens: t.amount }))
    : []

  // Threshold states
  const isCritical = remaining <= 50   // red
  const isWarning  = remaining <= 200  // yellow
  const isLow      = remaining <= 100  // prominent Buy More

  // Derive colours from state
  const accentColor = isCritical
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : '#60A5FA'

  const balanceBg = isCritical
    ? 'rgba(239,68,68,0.07)'
    : isWarning
    ? 'rgba(245,158,11,0.07)'
    : 'rgba(96,165,250,0.08)'

  const balanceBorder = isCritical
    ? 'rgba(239,68,68,0.22)'
    : isWarning
    ? 'rgba(245,158,11,0.22)'
    : 'rgba(96,165,250,0.20)'

  const barColor = isCritical
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : '#60A5FA'

  return (
    <div className="p-4 space-y-4">
      {/* Balance card — colour-shifts by state */}
      <div
        className="rounded-xl p-4 text-center transition-colors duration-300"
        style={{
          background: balanceBg,
          border: `1px solid ${balanceBorder}`,
        }}
      >
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Balance</p>
        <p
          className="text-3xl font-bold transition-colors duration-300"
          style={{ color: accentColor }}
        >
          {loading ? '…' : remaining.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">tokens remaining</p>

        {/* Inline warning label */}
        {isCritical && (
          <p
            className="text-[10px] font-semibold mt-2 tracking-wide"
            style={{ color: '#ef4444' }}
          >
            Critical — upgrade now to continue building
          </p>
        )}
        {!isCritical && isWarning && (
          <p
            className="text-[10px] font-semibold mt-2 tracking-wide"
            style={{ color: '#f59e0b' }}
          >
            Running low — consider upgrading soon
          </p>
        )}
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-gray-500">Used this session</span>
          <span
            className="text-[10px] font-medium transition-colors duration-300"
            style={{ color: accentColor }}
          >
            {tokensUsed} / {TOKEN_LIMIT.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usedPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Buy More — always present but elevated when low */}
      {isLow ? (
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full text-sm font-bold px-4 py-2.5 rounded-lg transition-all duration-200"
          style={{
            background: isCritical
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #D4AF37, #D4AF37)',
            color: isCritical ? '#fff' : '#09090b',
            boxShadow: isCritical
              ? '0 0 18px rgba(239,68,68,0.3)'
              : '0 0 18px rgba(212,175,55,0.25)',
          }}
        >
          {isCritical ? '⚡ Upgrade Now' : 'Buy More Tokens'}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full bg-[#D4AF37] hover:bg-[#E6A519] text-black text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          Buy More
        </Link>
      )}

      {/* Recent usage */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Recent Usage</p>
        {loading ? (
          <p className="text-[11px] text-gray-500 text-center py-3">Loading…</p>
        ) : recentUsage.length === 0 ? (
          <p className="text-[11px] text-gray-500 text-center py-3">No usage yet</p>
        ) : (
          <div className="space-y-1">
            {recentUsage.map(({ cmd, tokens }) => (
              <div key={cmd} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
                <p className="text-[11px] text-gray-300 truncate flex-1 mr-2">{cmd}</p>
                <span
                  className="text-[10px] font-medium flex-shrink-0"
                  style={{ color: `${accentColor}99` }}
                >
                  {tokens}t
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
