'use client'

import { useEffect, useState } from 'react'
import {
  Users, DollarSign, TrendingUp, TrendingDown, Zap, ShoppingBag,
  Award, Target, Activity, Clock, ArrowUp, ArrowDown, RefreshCw,
  BarChart3, Crown, Flame, Heart, Server,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Metrics {
  totalUsers: number
  usersToday: number
  usersLast30: number
  userGrowthPercent: number
  mrrCents: number
  arrCents: number
  revenueGrowth: number
  activeSubscriptions: number
  conversionRate: number
  arpu: number
  totalBuilds: number
  tokensSpentLast30: number
  totalTemplates: number
  totalPurchases: number
  purchasesLast30: number
  topTemplates: { id: string; title: string; category: string; purchaseCount: number; priceCents: number }[]
  topCreators: { userId: string; name: string; totalEarningsCents: number }[]
  subsByTier: { tier: string; count: number }[]
  subsByStatus: { status: string; count: number }[]
  revenueChart: { date: string; revenueCents: number; costCents: number }[]
  signupsChart: { date: string; count: number }[]
  totalAchievements: number
  avgLoginStreak: number
  longestStreak: number
  recentUsers: { id: string; email: string; displayName: string | null; createdAt: string; role: string }[]
  health: { db: string; redis: string; api: string }
  generatedAt: string
}

// ─── Demo data ───────────────────────────────────────────────────────────────

function makeDemoMetrics(): Metrics {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 86_400_000
  return {
    totalUsers: 1284,
    usersToday: 23,
    usersLast30: 312,
    userGrowthPercent: 24,
    mrrCents: 489500,
    arrCents: 5874000,
    revenueGrowth: 18,
    activeSubscriptions: 427,
    conversionRate: 33.3,
    arpu: 1147,
    totalBuilds: 9731,
    tokensSpentLast30: 48200,
    totalTemplates: 156,
    totalPurchases: 892,
    purchasesLast30: 127,
    topTemplates: [
      { id: '1', title: 'Neon City Map Pack', category: 'MAP', purchaseCount: 89, priceCents: 499 },
      { id: '2', title: 'RPG Combat System', category: 'SCRIPT', purchaseCount: 67, priceCents: 999 },
      { id: '3', title: 'Modern UI Kit', category: 'UI', purchaseCount: 54, priceCents: 299 },
      { id: '4', title: 'Vehicle System', category: 'SCRIPT', purchaseCount: 41, priceCents: 799 },
      { id: '5', title: 'Fantasy Terrain Pack', category: 'MAP', purchaseCount: 38, priceCents: 699 },
    ],
    topCreators: [
      { userId: '1', name: 'Alex Chen', totalEarningsCents: 125400 },
      { userId: '2', name: 'Sarah Kim', totalEarningsCents: 89200 },
      { userId: '3', name: 'Marcus Johnson', totalEarningsCents: 67800 },
      { userId: '4', name: 'Luna Rodriguez', totalEarningsCents: 45100 },
      { userId: '5', name: 'Dawsen Porter', totalEarningsCents: 32400 },
    ],
    subsByTier: [
      { tier: 'HOBBY', count: 189 },
      { tier: 'CREATOR', count: 167 },
      { tier: 'STUDIO', count: 71 },
    ],
    subsByStatus: [
      { status: 'ACTIVE', count: 392 },
      { status: 'TRIALING', count: 35 },
      { status: 'PAST_DUE', count: 12 },
      { status: 'CANCELED', count: 88 },
    ],
    revenueChart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo + i * 86_400_000).toISOString().slice(0, 10),
      revenueCents: Math.round(30000 + Math.random() * 40000 + i * 800),
      costCents: Math.round(8000 + Math.random() * 5000),
    })),
    signupsChart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo + i * 86_400_000).toISOString().slice(0, 10),
      count: Math.round(5 + Math.random() * 15 + i * 0.3),
    })),
    totalAchievements: 3847,
    avgLoginStreak: 4,
    longestStreak: 47,
    recentUsers: [
      { id: '1', email: 'newuser1@gmail.com', displayName: 'Alex Builder', createdAt: new Date(now - 120000).toISOString(), role: 'USER' },
      { id: '2', email: 'creator2@gmail.com', displayName: 'Sarah Creates', createdAt: new Date(now - 3600000).toISOString(), role: 'CREATOR' },
      { id: '3', email: 'dev3@gmail.com', displayName: 'Marcus Dev', createdAt: new Date(now - 7200000).toISOString(), role: 'USER' },
    ],
    health: { db: 'ok', redis: 'ok', api: 'ok' },
    generatedAt: new Date().toISOString(),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TIER_COLORS: Record<string, string> = {
  HOBBY: '#60A5FA',
  CREATOR: '#A78BFA',
  STUDIO: '#D4AF37',
  FREE: '#71717A',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22C55E',
  TRIALING: '#60A5FA',
  PAST_DUE: '#F59E0B',
  CANCELED: '#EF4444',
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon, trend, trendLabel }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
}) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-glow, rgba(212,175,55,0.15))' }}>
          <span className="text-[var(--gold,#D4AF37)]">{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
      {trendLabel && <p className="text-[10px] text-gray-600 mt-0.5">{trendLabel}</p>}
    </div>
  )
}

function MiniBarChart({ data, color = 'var(--gold, #D4AF37)', height = 60 }: {
  data: number[]
  color?: string
  height?: number
}) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all hover:opacity-80"
          style={{
            height: `${Math.max((v / max) * 100, 2)}%`,
            background: color,
            opacity: 0.4 + (v / max) * 0.6,
          }}
        />
      ))}
    </div>
  )
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right font-mono">{value}</span>
    </div>
  )
}

function HealthDot({ status }: { status: string }) {
  const color = status === 'ok' ? '#22C55E' : status === 'degraded' ? '#F59E0B' : '#EF4444'
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'ok' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-30" style={{ background: color }} />}
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [data, setData] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', { cache: 'no-store' })
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsDemo(false)
    } catch {
      setData(makeDemoMetrics())
      setIsDemo(true)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const maxTier = Math.max(...data.subsByTier.map((t) => t.count), 1)
  const maxStatus = Math.max(...data.subsByStatus.map((s) => s.count), 1)

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Live Metrics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDemo && <span className="text-amber-400 mr-2">[Demo Data]</span>}
            Auto-refreshes every 60s &middot; Last: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchMetrics() }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* ─── Primary KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(data.totalUsers)}
          subtitle={`+${data.usersToday} today`}
          icon={<Users size={18} />}
          trend={data.userGrowthPercent}
          trendLabel="vs last 30d"
        />
        <StatCard
          title="Monthly Revenue (MRR)"
          value={formatCents(data.mrrCents)}
          subtitle={`ARR: ${formatCents(data.arrCents)}`}
          icon={<DollarSign size={18} />}
          trend={data.revenueGrowth}
          trendLabel="vs previous 30d"
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(data.activeSubscriptions)}
          subtitle={`${data.conversionRate}% conversion rate`}
          icon={<Crown size={18} />}
        />
        <StatCard
          title="ARPU"
          value={formatCents(data.arpu)}
          subtitle="Average revenue per user"
          icon={<Target size={18} />}
        />
      </div>

      {/* ─── Secondary KPIs ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Users (30d)"
          value={formatNumber(data.usersLast30)}
          icon={<TrendingUp size={18} />}
          trend={data.userGrowthPercent}
        />
        <StatCard
          title="Tokens Spent (30d)"
          value={formatNumber(data.tokensSpentLast30)}
          icon={<Zap size={18} />}
        />
        <StatCard
          title="Marketplace Sales (30d)"
          value={formatNumber(data.purchasesLast30)}
          subtitle={`${data.totalPurchases} all time`}
          icon={<ShoppingBag size={18} />}
        />
        <StatCard
          title="Achievements Earned"
          value={formatNumber(data.totalAchievements)}
          subtitle={`Avg streak: ${data.avgLoginStreak}d / Best: ${data.longestStreak}d`}
          icon={<Award size={18} />}
        />
      </div>

      {/* ─── Charts Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue (30d)</h3>
              <p className="text-xs text-gray-500">Daily revenue vs cost</p>
            </div>
            <BarChart3 size={16} className="text-gray-600" />
          </div>
          <MiniBarChart data={data.revenueChart.map((r) => r.revenueCents)} />
          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
            <span>{data.revenueChart[0]?.date}</span>
            <span>Total: {formatCents(data.revenueChart.reduce((s, r) => s + r.revenueCents, 0))}</span>
            <span>{data.revenueChart[data.revenueChart.length - 1]?.date}</span>
          </div>
        </div>

        {/* Signups Chart */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">New Users (30d)</h3>
              <p className="text-xs text-gray-500">Daily signups</p>
            </div>
            <Users size={16} className="text-gray-600" />
          </div>
          <MiniBarChart data={data.signupsChart.map((s) => s.count)} color="#22C55E" />
          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
            <span>{data.signupsChart[0]?.date}</span>
            <span>Total: {data.signupsChart.reduce((s, r) => s + r.count, 0)}</span>
            <span>{data.signupsChart[data.signupsChart.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* ─── Subscriptions + Marketplace ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sub tiers */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Subscriptions by Tier</h3>
          <div className="space-y-3">
            {data.subsByTier.map((t) => (
              <ProgressBar key={t.tier} label={t.tier} value={t.count} max={maxTier} color={TIER_COLORS[t.tier] || '#71717A'} />
            ))}
          </div>
        </div>

        {/* Sub status */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Status</h3>
          <div className="space-y-3">
            {data.subsByStatus.map((s) => (
              <ProgressBar key={s.status} label={s.status} value={s.count} max={maxStatus} color={STATUS_COLORS[s.status] || '#71717A'} />
            ))}
          </div>
        </div>

        {/* Top templates */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Templates</h3>
          <div className="space-y-2.5">
            {data.topTemplates.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 font-mono">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{t.title}</p>
                  <p className="text-[10px] text-gray-600">{t.category} &middot; {formatCents(t.priceCents)}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{t.purchaseCount} sales</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top Creators + Recent Users + Health ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top creators */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            Top Creators
          </h3>
          <div className="space-y-2.5">
            {data.topCreators.map((c, i) => (
              <div key={c.userId} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <span className="flex-1 text-xs text-white truncate">{c.name}</span>
                <span className="text-xs text-emerald-400 font-mono">{formatCents(c.totalEarningsCents)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            Recent Signups
          </h3>
          <div className="space-y-2.5">
            {data.recentUsers.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {(u.displayName || u.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{u.displayName || u.email}</p>
                  <p className="text-[10px] text-gray-600">{timeAgo(u.createdAt)}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  u.role === 'ADMIN' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                  u.role === 'CREATOR' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-white/5 text-gray-500'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Server size={14} className="text-emerald-400" />
            System Health
          </h3>
          <div className="space-y-4">
            {Object.entries(data.health).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HealthDot status={status} />
                  <span className="text-xs text-gray-300 capitalize">{service}</span>
                </div>
                <span className={`text-xs font-mono ${
                  status === 'ok' ? 'text-emerald-400' : status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {status.toUpperCase()}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Heart size={12} className="text-pink-400" />
                <span className="text-[10px] text-gray-500">
                  {data.totalTemplates} templates &middot; {data.totalBuilds} API calls
                </span>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Generated: {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
