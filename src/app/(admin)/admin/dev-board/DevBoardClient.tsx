'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  DollarSign, Users, TrendingUp, Zap, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, Layers, Clock, Cpu, RefreshCw, WifiOff,
  Coins, Star, Package, BarChart2,
  type LucideIcon,
} from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

// ─── Animated counter ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const diff = target - start
    if (diff === 0) return
    const t0 = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(start + diff * ease))
      if (p < 1) { raf = requestAnimationFrame(tick) }
      else { prev.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const display = useCountUp(value)
  return <span className="tabular-nums">{prefix}{display.toLocaleString()}{suffix}</span>
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────
function PulseDot({ color = '#22C55E' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, prefix = '', suffix = '', sub, trend, icon: Icon, accentColor = '#FFB81C',
}: {
  label: string; value: number; prefix?: string; suffix?: string
  sub?: string; trend?: number; icon: LucideIcon; accentColor?: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor } as React.CSSProperties} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-white mb-0.5">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Chart tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111113] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-bold text-white">${(payload[0].value / 100).toFixed(2)}</p>
    </div>
  )
}

// ─── Pie colors ──────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  FREE: '#71717A',
  HOBBY: '#60A5FA',
  CREATOR: '#FFB81C',
  STUDIO: '#A855F7',
}

// ─── Activity icon ───────────────────────────────────────────────────────────
function activityIcon(action: string) {
  if (action.includes('CREATE') || action.includes('SIGN_UP')) return '+'
  if (action.includes('DELETE')) return '−'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return '~'
  if (action.includes('LOGIN') || action.includes('AUTH')) return '→'
  return '•'
}

function activityColor(action: string) {
  if (action.includes('CREATE') || action.includes('SIGN_UP')) return '#22C55E'
  if (action.includes('DELETE')) return '#EF4444'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return '#FFB81C'
  return '#60A5FA'
}

// ─── Time ago ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function DevBoardClient() {
  const { data, isLoading, mutate } = useSWR('/api/admin/dev-board', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (data?.fetchedAt) setLastRefresh(new Date(data.fetchedAt))
  }, [data?.fetchedAt])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading metrics...</p>
        </div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-zinc-400 text-sm">Failed to load metrics</p>
          <button
            onClick={() => mutate()}
            className="text-sm text-[#FFB81C] hover:text-[#E6A519] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const d = data

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Dev Board
            <PulseDot />
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Live platform metrics — refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={() => mutate()}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Revenue Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="MRR"
          value={Math.round((d.mrrCents ?? 0) / 100)}
          prefix="$"
          icon={DollarSign}
          accentColor="#22C55E"
          sub="Monthly recurring"
        />
        <StatCard
          label="Revenue Today"
          value={Math.round((d.revenueTodayCents ?? 0) / 100)}
          prefix="$"
          icon={TrendingUp}
          accentColor="#FFB81C"
        />
        <StatCard
          label="Revenue This Week"
          value={Math.round((d.revenueWeekCents ?? 0) / 100)}
          prefix="$"
          icon={TrendingUp}
          accentColor="#60A5FA"
        />
        <StatCard
          label="Revenue 30d"
          value={Math.round((d.revenueMonthCents ?? 0) / 100)}
          prefix="$"
          icon={DollarSign}
          accentColor="#A855F7"
        />
      </div>

      {/* ─── Users Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={d.totalUsers ?? 0}
          icon={Users}
          accentColor="#FFB81C"
        />
        <StatCard
          label="Signups Today"
          value={d.signupsToday ?? 0}
          icon={Users}
          accentColor="#22C55E"
          trend={d.signupsToday > 0 ? 100 : 0}
        />
        <StatCard
          label="Signups This Week"
          value={d.signupsWeek ?? 0}
          icon={Users}
          accentColor="#60A5FA"
        />
        <StatCard
          label="Signups This Month"
          value={d.signupsMonth ?? 0}
          icon={Users}
          accentColor="#A855F7"
        />
      </div>

      {/* ─── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart (2/3) */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFB81C]" />
              Revenue — Last 30 Days
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.revenueChart ?? []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB81C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFB81C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#52525B', fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#52525B', fontSize: 10 }}
                  tickFormatter={(v: number) => `$${v / 100}`}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenueCents"
                  stroke="#FFB81C"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Pie (1/3) */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#A855F7]" />
            Subscriptions
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.subsByTier ?? []}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {(d.subsByTier ?? []).map((entry: { tier: string }, i: number) => (
                    <Cell key={i} fill={TIER_COLORS[entry.tier] ?? '#71717A'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {(d.subsByTier ?? []).map((s: { tier: string; count: number }) => (
              <div key={s.tier} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[s.tier] ?? '#71717A' }} />
                <span className="text-zinc-400">{s.tier}</span>
                <span className="text-white font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Token Economy + API Usage ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Economy */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[#FFB81C]" />
            Token Economy
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Balance', value: d.tokenBalance ?? 0, color: '#FFB81C' },
              { label: 'Avg Balance', value: d.tokenAvgBalance ?? 0, color: '#60A5FA' },
              { label: 'Tokens Bought', value: d.tokensBoughtAmount ?? 0, color: '#22C55E' },
              { label: 'Tokens Spent', value: d.tokensSpentAmount ?? 0, color: '#EF4444' },
              { label: 'Lifetime Earned', value: d.tokenLifetimeEarned ?? 0, color: '#A855F7' },
              { label: 'Lifetime Spent', value: d.tokenLifetimeSpent ?? 0, color: '#F59E0B' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}
              >
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{item.label}</p>
                <p className="text-lg font-bold text-white tabular-nums">
                  <AnimatedNumber value={item.value} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* API Usage */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <Cpu className="w-4 h-4 text-[#60A5FA]" />
            API Usage
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-3 bg-blue-500/[0.06] border border-blue-500/[0.12]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Today</p>
              <p className="text-lg font-bold text-white tabular-nums">
                <AnimatedNumber value={d.apiUsageToday ?? 0} />
              </p>
            </div>
            <div className="rounded-xl p-3 bg-purple-500/[0.06] border border-purple-500/[0.12]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">This Week</p>
              <p className="text-lg font-bold text-white tabular-nums">
                <AnimatedNumber value={d.apiUsageWeek ?? 0} />
              </p>
            </div>
            <div className="rounded-xl p-3 bg-amber-500/[0.06] border border-amber-500/[0.12]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">This Month</p>
              <p className="text-lg font-bold text-white tabular-nums">
                <AnimatedNumber value={d.apiUsageMonth ?? 0} />
              </p>
            </div>
          </div>

          {/* Provider breakdown */}
          {(d.apiUsageByProvider ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">By Provider (30d)</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.apiUsageByProvider ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="provider"
                      type="category"
                      tick={{ fill: '#A1A1AA', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111113',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="calls" fill="#60A5FA" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Row: Templates + Activity ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Templates */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FFB81C]" />
              Top Templates
            </h3>
            <span className="text-xs text-zinc-500">{d.totalTemplates ?? 0} total</span>
          </div>
          <div className="space-y-2">
            {(d.topTemplates ?? []).slice(0, 6).map((t: { id: string; title: string; purchases: number; downloads: number; averageRating: number; priceCents: number }, i: number) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-xs text-zinc-600 w-5 text-center font-bold">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    {t.purchases} purchases · {t.downloads} downloads · {t.averageRating?.toFixed(1) ?? '—'} rating
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#FFB81C] tabular-nums">
                  ${((t.priceCents ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            {(d.topTemplates ?? []).length === 0 && (
              <p className="text-sm text-zinc-600 text-center py-4">No templates yet</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#22C55E]" />
              Recent Activity
              <PulseDot color="#22C55E" />
            </h3>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {(d.recentActivity ?? []).map((a: { id: string; action: string; resource: string; resourceId: string; createdAt: string; userName: string | null; userEmail: string | null }) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0"
                  style={{ background: `${activityColor(a.action)}12`, color: activityColor(a.action) }}
                >
                  {activityIcon(a.action)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">
                    <span className="font-semibold">{a.userName ?? a.userEmail ?? 'System'}</span>
                    {' '}
                    <span className="text-zinc-400">{a.action.toLowerCase().replace(/_/g, ' ')}</span>
                    {' '}
                    <span className="text-zinc-500">{a.resource?.toLowerCase()}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-zinc-600" />
                    <span className="text-[10px] text-zinc-600">{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            {(d.recentActivity ?? []).length === 0 && (
              <p className="text-sm text-zinc-600 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Projects + Extra Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={d.totalProjects ?? 0}
          icon={Layers}
          accentColor="#60A5FA"
        />
        <StatCard
          label="Published Templates"
          value={d.totalTemplates ?? 0}
          icon={Layers}
          accentColor="#A855F7"
        />
        <StatCard
          label="Token Purchases"
          value={d.tokensBoughtCount ?? 0}
          icon={Zap}
          accentColor="#22C55E"
          sub={`$${(((d.tokensBoughtAmount ?? 0) * 0.01)).toFixed(0)} revenue`}
        />
        <StatCard
          label="API Calls (30d)"
          value={d.apiUsageMonth ?? 0}
          icon={Cpu}
          accentColor="#F59E0B"
        />
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-[11px] text-zinc-700">
          ForjeGames Dev Board — Data refreshes every 30 seconds
        </p>
      </div>
    </div>
  )
}
