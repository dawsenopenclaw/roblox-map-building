'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign,
  Users,
  TrendingUp,
  Gift,
  RefreshCw,
  Loader2,
  Check,
  Search,
  CreditCard,
  Layers,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BillingStats {
  mrrCents: number
  totalRevenueCents: number
  arpuCents: number
  activeSubscriptions: number
  tierBreakdown: Record<string, number>
  recentTransactions: {
    id: string
    amount: number
    currency: string
    status: string
    description: string | null
    created: number
    customerEmail: string | null
  }[]
  giftHistory: {
    id: string
    action: string
    resourceId: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
    user: { email: string } | null
  }[]
}

interface QuickGiftUser {
  id: string
  email: string
  displayName: string | null
  username: string | null
  tokenBalance: { balance: number } | null
}

type SubscriptionTier = 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'

const GIFT_PRESETS = [500, 1000, 5000, 10000, 50000, 100000]

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-[#1c1c1c] text-[#B0B0B0]',
  HOBBY: 'bg-blue-900/40 text-blue-300',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  STUDIO: 'bg-[#c9a227]/10 text-[#c9a227]',
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

function makeDemoStats(): BillingStats {
  return {
    mrrCents: 489500,
    totalRevenueCents: 5_874_000,
    arpuCents: 2340,
    activeSubscriptions: 209,
    tierBreakdown: { FREE: 1075, HOBBY: 120, CREATOR: 72, STUDIO: 17 },
    recentTransactions: [
      { id: 'pi_1', amount: 2900, currency: 'usd', status: 'succeeded', description: 'Creator plan', created: Date.now() / 1000 - 3600, customerEmail: 'alice@example.com' },
      { id: 'pi_2', amount: 900, currency: 'usd', status: 'succeeded', description: 'Hobby plan', created: Date.now() / 1000 - 7200, customerEmail: 'bob@example.com' },
      { id: 'pi_3', amount: 7900, currency: 'usd', status: 'succeeded', description: 'Studio plan', created: Date.now() / 1000 - 14400, customerEmail: 'carol@example.com' },
      { id: 'pi_4', amount: 2900, currency: 'usd', status: 'failed', description: 'Creator plan', created: Date.now() / 1000 - 28800, customerEmail: 'dave@example.com' },
      { id: 'pi_5', amount: 900, currency: 'usd', status: 'succeeded', description: 'Hobby plan', created: Date.now() / 1000 - 86400, customerEmail: 'eve@example.com' },
    ],
    giftHistory: [
      { id: 'al_1', action: 'admin.gift_tokens', resourceId: 'u1', metadata: { amount: 5000, reason: 'Contest prize', targetEmail: 'alice@example.com', newBalance: 7400 }, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), user: { email: 'dawsenporter@example.com' } },
      { id: 'al_2', action: 'admin.gift_tokens', resourceId: 'u2', metadata: { amount: 1000, reason: 'Bug compensation', targetEmail: 'bob@example.com', newBalance: 1800 }, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), user: { email: 'dawsenporter@example.com' } },
      { id: 'al_3', action: 'admin.set_tier', resourceId: 'u3', metadata: { previousTier: 'HOBBY', newTier: 'STUDIO', reason: 'Partnership deal' }, createdAt: new Date(Date.now() - 86400000).toISOString(), user: { email: 'dawsenporter@example.com' } },
    ],
  }
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-[#c9a227]/10 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#B0B0B0] uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-[#555] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatUSD(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function timeAgo(ts: number | string) {
  const ms = typeof ts === 'number' ? ts * 1000 : new Date(ts).getTime()
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Quick Gift Sidebar ─────────────────────────────────────────────────────────

function QuickGiftSidebar({ onGifted }: { onGifted: () => void }) {
  const [userSearch, setUserSearch] = useState('')
  const [results, setResults] = useState<QuickGiftUser[]>([])
  const [selectedUser, setSelectedUser] = useState<QuickGiftUser | null>(null)
  const [searching, setSearching] = useState(false)
  const [amount, setAmount] = useState(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=6`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data.users ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300)
    return () => clearTimeout(t)
  }, [userSearch, searchUsers])

  const effectiveAmount = useCustom ? parseInt(customAmount || '0', 10) : amount

  const handleGift = async () => {
    if (!selectedUser) { setError('Select a user first'); return }
    if (effectiveAmount < 1 || effectiveAmount > 1_000_000) { setError('Amount must be 1–1,000,000'); return }
    if (!reason.trim()) { setError('Reason is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/gift-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, amount: effectiveAmount, reason: reason.trim(), type: 'GIFT' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSelectedUser(null)
        setUserSearch('')
        setReason('')
        setAmount(1000)
        setCustomAmount('')
        setUseCustom(false)
        onGifted()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-[#c9a227]" />
        <h3 className="text-white font-bold text-sm">Quick Gift Tokens</h3>
      </div>

      {/* User picker */}
      <div>
        <p className="text-xs text-[#B0B0B0] mb-1.5">User</p>
        {selectedUser ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl">
            <div className="w-6 h-6 bg-[#c9a227] rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              {selectedUser.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {selectedUser.displayName || selectedUser.username || selectedUser.email}
              </p>
              <p className="text-[#B0B0B0] text-xs truncate">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => { setSelectedUser(null); setUserSearch('') }}
              className="text-[#B0B0B0] hover:text-white transition-colors flex-shrink-0"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0B0B0]" />
            <input
              type="text"
              placeholder="Search user..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0B0B0] animate-spin" />
            )}
            {results.length > 0 && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setResults([]); setUserSearch('') }}
                    className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                  >
                    <div className="w-5 h-5 bg-[#c9a227]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#c9a227] flex-shrink-0">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">{u.displayName || u.username || u.email}</p>
                      <p className="text-[#B0B0B0] text-xs truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-[#555] flex-shrink-0 tabular-nums">
                      {(u.tokenBalance?.balance ?? 0).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Amount presets */}
      <div>
        <p className="text-xs text-[#B0B0B0] mb-1.5">Amount</p>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {GIFT_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(p); setUseCustom(false) }}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                !useCustom && amount === p
                  ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
                  : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#B0B0B0] hover:border-[#c9a227]/30'
              }`}
            >
              {p >= 1000 ? `${p / 1000}k` : p}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUseCustom(true)}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            useCustom
              ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
              : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#B0B0B0] hover:border-[#c9a227]/30'
          }`}
        >
          Custom
        </button>
        {useCustom && (
          <input
            type="number"
            min={1}
            max={1000000}
            placeholder="1 – 1,000,000"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors"
          />
        )}
      </div>

      {/* Reason */}
      <div>
        <p className="text-xs text-[#B0B0B0] mb-1.5">Reason</p>
        <input
          type="text"
          placeholder="Contest prize, compensation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleGift}
        disabled={loading || success || !selectedUser}
        className="w-full py-2.5 bg-[#c9a227] hover:bg-[#b8921f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <Check className="w-4 h-4" />
        ) : (
          <Gift className="w-4 h-4" />
        )}
        {success ? 'Gifted!' : `Gift ${effectiveAmount >= 1 ? effectiveAmount.toLocaleString() : '—'} Tokens`}
      </button>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function BillingDashboardClient() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Map from existing stats shape + fetch gift history separately
      const [giftsRes] = await Promise.all([
        fetch('/api/admin/audit-log?action=admin.gift_tokens&limit=20').catch(() => null),
      ])
      const gifts = giftsRes?.ok ? (await giftsRes.json()).logs ?? [] : []
      setStats({
        mrrCents: data.mrrCents ?? 0,
        totalRevenueCents: data.totalRevenueCents ?? 0,
        arpuCents: data.arpuCents ?? 0,
        activeSubscriptions: data.activeSubscriptions ?? 0,
        tierBreakdown: data.tierBreakdown ?? {},
        recentTransactions: data.recentTransactions ?? [],
        giftHistory: gifts,
      })
      setIsDemo(false)
    } catch {
      setStats(makeDemoStats())
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tierTotal = Object.values(stats.tierBreakdown).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing Dashboard</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">Revenue, subscriptions, and token gifting overview</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#c9a227] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="MRR"
          value={formatUSD(stats.mrrCents)}
          sub="Monthly recurring revenue"
          icon={<DollarSign className="w-5 h-5 text-[#c9a227]" />}
        />
        <StatCard
          title="Total Revenue"
          value={formatUSD(stats.totalRevenueCents)}
          sub="All-time collected"
          icon={<TrendingUp className="w-5 h-5 text-[#c9a227]" />}
        />
        <StatCard
          title="ARPU"
          value={formatUSD(stats.arpuCents)}
          sub="Avg revenue per user"
          icon={<Users className="w-5 h-5 text-[#c9a227]" />}
        />
        <StatCard
          title="Active Subs"
          value={stats.activeSubscriptions.toLocaleString()}
          sub="Paid subscriptions"
          icon={<CreditCard className="w-5 h-5 text-[#c9a227]" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: transactions + gift history */}
        <div className="xl:col-span-2 space-y-6">

          {/* Tier breakdown */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4 text-[#c9a227]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Subscriptions by Tier</h2>
            </div>
            <div className="space-y-3">
              {(['STUDIO', 'CREATOR', 'HOBBY', 'FREE'] as SubscriptionTier[]).map((tier) => {
                const count = stats.tierBreakdown[tier] ?? 0
                const pct = Math.round((count / tierTotal) * 100)
                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[tier]}`}>{tier}</span>
                      <span className="text-white font-semibold tabular-nums">{count.toLocaleString()} <span className="text-[#555] font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tier === 'STUDIO' ? 'bg-[#c9a227]' :
                          tier === 'CREATOR' ? 'bg-purple-500' :
                          tier === 'HOBBY' ? 'bg-blue-500' : 'bg-[#333]'
                        }`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Stripe transactions */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-[#c9a227]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Transactions</h2>
            </div>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-[#B0B0B0] text-sm py-4">No recent transactions</p>
            ) : (
              <div className="space-y-1">
                {stats.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 py-3 border-b border-[#1c1c1c] last:border-0"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      tx.status === 'succeeded' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{tx.customerEmail ?? 'Unknown'}</p>
                      <p className="text-[#555] text-xs truncate">{tx.description ?? 'Payment'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${
                        tx.status === 'succeeded' ? 'text-[#c9a227]' : 'text-red-400'
                      }`}>
                        {tx.status === 'succeeded' ? '+' : ''}{formatUSD(tx.amount)}
                      </p>
                      <p className="text-xs text-[#555]">{timeAgo(tx.created)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token gift history */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Gift className="w-4 h-4 text-[#c9a227]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Token Gift History</h2>
            </div>
            {stats.giftHistory.length === 0 ? (
              <p className="text-[#B0B0B0] text-sm py-4">No gifts recorded yet</p>
            ) : (
              <div className="space-y-1">
                {stats.giftHistory.map((log) => {
                  const meta = log.metadata ?? {}
                  const isGift = log.action === 'admin.gift_tokens'
                  return (
                    <div key={log.id} className="flex items-start gap-4 py-3 border-b border-[#1c1c1c] last:border-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isGift ? 'bg-[#c9a227]/10' : 'bg-purple-900/20'
                      }`}>
                        {isGift
                          ? <Gift className="w-3.5 h-3.5 text-[#c9a227]" />
                          : <Layers className="w-3.5 h-3.5 text-purple-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        {isGift ? (
                          <>
                            <p className="text-white text-sm">
                              <span className="text-[#c9a227] font-bold">+{(meta.amount as number)?.toLocaleString()}</span>
                              {' tokens → '}
                              <span className="truncate">{(meta.targetEmail as string) ?? log.resourceId}</span>
                            </p>
                            <p className="text-[#555] text-xs truncate">{meta.reason as string}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-white text-sm">
                              Tier changed:{' '}
                              <span className="text-[#B0B0B0]">{meta.previousTier as string}</span>
                              {' → '}
                              <span className="text-[#c9a227]">{meta.newTier as string}</span>
                            </p>
                            <p className="text-[#555] text-xs">{meta.reason as string}</p>
                          </>
                        )}
                        <p className="text-[#444] text-xs mt-0.5">{timeAgo(log.createdAt)} by {log.user?.email ?? 'admin'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: quick gift */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <QuickGiftSidebar onGifted={fetchStats} />
          </div>
        </div>
      </div>
    </div>
  )
}
