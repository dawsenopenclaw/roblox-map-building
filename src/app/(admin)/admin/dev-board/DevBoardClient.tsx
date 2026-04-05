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
  ArrowUpRight, ArrowDownRight, Layers, Clock, Cpu, RefreshCw,
  Coins, ChevronDown, ChevronUp, Receipt,
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

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const display = useCountUp(value)
  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : display.toLocaleString()
  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────
function PulseDot({ color = '#22C55E' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  )
}

// ─── Greeting helpers ─────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getStatusMessage(d: {
  signupsToday?: number
  mrrCents?: number
  revenueTodayCents?: number
  revenueWeekCents?: number
}) {
  const signups = d.signupsToday ?? 0
  const revenueToday = (d.revenueTodayCents ?? 0) / 100
  const mrr = (d.mrrCents ?? 0) / 100

  if (revenueToday > 100) return `$${revenueToday.toFixed(0)} in revenue today. Crushing it.`
  if (signups >= 10) return `${signups} new users today. Growth is real.`
  if (signups > 0) return `${signups} new signup${signups > 1 ? 's' : ''} today. Keep shipping.`
  if (mrr > 0) return `MRR holding at $${mrr.toLocaleString()}. Steady.`
  return 'Platform is live. All systems nominal.'
}

function useCurrentTime() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, prefix = '', suffix = '', sub, trend, icon: Icon, accentColor = '#D4AF37',
}: {
  label: string; value: number; prefix?: string; suffix?: string
  sub?: string; trend?: number; icon: LucideIcon; accentColor?: string
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border p-5 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 24px 0 ${accentColor}22, 0 8px 32px -8px rgba(0,0,0,0.5)`,
        borderColor: `${accentColor}30`,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
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
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            trend >= 0
              ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-red-400 bg-red-400/10'
          }`}>
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
    </motion.div>
  )
}

// ─── Revenue chart tooltip ────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const dollars = (payload[0].value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return (
    <div className="bg-[#111113] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-[#D4AF37]">{dollars}</p>
    </div>
  )
}

// ─── Pie colors ──────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  FREE:    '#71717A',
  HOBBY:   '#60A5FA',
  CREATOR: '#D4AF37',
  STUDIO:  '#A855F7',
}

// ─── Activity helpers ─────────────────────────────────────────────────────────
type ActivityEntry = {
  id: string
  action: string
  resource: string
  resourceId: string
  createdAt: string
  userName: string | null
  userEmail: string | null
}

function activityIcon(action: string): string {
  if (action.includes('CREATE') || action.includes('SIGN_UP')) return '+'
  if (action.includes('DELETE')) return '−'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return '~'
  if (action.includes('LOGIN') || action.includes('AUTH')) return '→'
  return '•'
}

function activityColor(action: string): string {
  if (action.includes('CREATE') || action.includes('SIGN_UP')) return '#22C55E'
  if (action.includes('DELETE')) return '#EF4444'
  if (action.includes('UPDATE') || action.includes('CHANGE')) return '#60A5FA'
  if (action.includes('LOGIN') || action.includes('AUTH')) return '#A855F7'
  return '#71717A'
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

// ─── Quick Pulse Bar ──────────────────────────────────────────────────────────
function QuickPulse({ d }: { d: {
  totalUsers?: number
  mrrCents?: number
  recentActivity?: ActivityEntry[]
}}) {
  const mrr = ((d.mrrCents ?? 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const lastSignup = (d.recentActivity ?? []).find(
    a => a.action.includes('SIGN_UP') || a.action.includes('CREATE_USER')
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-3"
      style={{
        background: 'linear-gradient(90deg, rgba(212,175,55,0.06) 0%, rgba(34,197,94,0.04) 100%)',
        borderColor: 'rgba(212,175,55,0.15)',
      }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <PulseDot color="#22C55E" />
        <span className="text-xs font-semibold text-emerald-400">LIVE</span>
      </div>

      <div className="w-px h-4 bg-white/10 hidden sm:block" />

      {/* Active users */}
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-400">
          <span className="text-white font-semibold">{(d.totalUsers ?? 0).toLocaleString()}</span>
          {' '}total users
        </span>
      </div>

      <div className="w-px h-4 bg-white/10 hidden sm:block" />

      {/* Last signup */}
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-400">
          Last signup:{' '}
          <span className="text-white font-semibold">
            {lastSignup ? timeAgo(lastSignup.createdAt) : 'n/a'}
          </span>
        </span>
      </div>

      {/* Spacer pushes MRR right */}
      <div className="flex-1" />

      {/* MRR callout */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">MRR</span>
        <span className="text-xl font-bold text-[#D4AF37] tabular-nums">{mrr}</span>
      </div>
    </motion.div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const [showAll, setShowAll] = useState(false)
  const PAGE = 10
  const visible = showAll ? entries : entries.slice(0, PAGE)
  const hasMore = entries.length > PAGE

  return (
    <div className="space-y-0.5">
      <AnimatePresence initial={false}>
        {visible.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15, delay: idx * 0.02 }}
            className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.025] transition-colors group"
          >
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0"
              style={{ background: `${activityColor(a.action)}12`, color: activityColor(a.action) }}
            >
              {activityIcon(a.action)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white leading-snug">
                <span className="font-semibold">{a.userName ?? a.userEmail ?? 'System'}</span>
                {' '}
                <span style={{ color: activityColor(a.action) + 'cc' }}>
                  {a.action.toLowerCase().replace(/_/g, ' ')}
                </span>
                {' '}
                <span className="text-zinc-500">{a.resource?.toLowerCase()}</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-zinc-700" />
                <span className="text-[10px] text-zinc-600">{timeAgo(a.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/[0.03]"
        >
          {showAll ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show {entries.length - PAGE} more</>
          )}
        </button>
      )}

      {entries.length === 0 && (
        <p className="text-sm text-zinc-600 text-center py-4">No recent activity</p>
      )}
    </div>
  )
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function DevBoardClient() {
  const { data, isLoading, mutate } = useSWR('/api/admin/dev-board', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const currentTime = useCurrentTime()

  useEffect(() => {
    if (data?.fetchedAt) setLastRefresh(new Date(data.fetchedAt))
  }, [data?.fetchedAt])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
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
            className="text-sm text-[#D4AF37] hover:text-[#E6A519] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const d = data

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">

      {/* ─── Greeting Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, Dawsen 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{getStatusMessage(d)}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-600">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-zinc-700">
              synced {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ─── Quick Pulse Bar ──────────────────────────────────────────────── */}
      <QuickPulse d={d} />

      {/* ─── Revenue Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          accentColor="#D4AF37"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={d.totalUsers ?? 0}
          icon={Users}
          accentColor="#D4AF37"
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
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              Revenue — Last 30 Days
            </h3>
            <span className="text-xs text-zinc-600 tabular-nums">
              {((d.revenueMonthCents ?? 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.revenueChart ?? []} margin={{ left: 0, right: 4 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#D4AF37" stopOpacity={0.45} />
                    <stop offset="60%"  stopColor="#FFB81C" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
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
                  tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenueCents"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#D4AF37', stroke: '#111', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Subscription Pie (1/3) */}
        <Panel>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#A855F7]" />
            Subscriptions
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {Object.entries(TIER_COLORS).map(([tier, color]) => (
                    <radialGradient key={tier} id={`pie-${tier}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </radialGradient>
                  ))}
                </defs>
                <Pie
                  data={d.subsByTier ?? []}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={70}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {(d.subsByTier ?? []).map((entry: { tier: string }, i: number) => (
                    <Cell
                      key={i}
                      fill={`url(#pie-${entry.tier})`}
                      style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any) => `${value} users`) as any}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 justify-center">
            {(d.subsByTier ?? []).map((s: { tier: string; count: number }) => (
              <div key={s.tier} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[s.tier] ?? '#71717A' }} />
                <span className="text-zinc-400">{s.tier}</span>
                <span className="text-white font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ─── Token Economy + API Usage ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Economy */}
        <Panel>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            Token Economy
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Balance',    value: d.tokenBalance ?? 0,        color: '#D4AF37' },
              { label: 'Avg Balance',      value: d.tokenAvgBalance ?? 0,     color: '#60A5FA' },
              { label: 'Tokens Bought',    value: d.tokensBoughtAmount ?? 0,  color: '#22C55E' },
              { label: 'Tokens Spent',     value: d.tokensSpentAmount ?? 0,   color: '#EF4444' },
              { label: 'Lifetime Earned',  value: d.tokenLifetimeEarned ?? 0, color: '#A855F7' },
              { label: 'Lifetime Spent',   value: d.tokenLifetimeSpent ?? 0,  color: '#F59E0B' },
            ].map((item) => (
              <motion.div
                key={item.label}
                className="rounded-xl p-3"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}
                whileHover={{ scale: 1.015, borderColor: `${item.color}30` }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{item.label}</p>
                <p className="text-lg font-bold text-white tabular-nums">
                  <AnimatedNumber value={item.value} />
                </p>
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* API Usage */}
        <Panel>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
            <Cpu className="w-4 h-4 text-[#60A5FA]" />
            API Usage
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Today',      value: d.apiUsageToday ?? 0,  bg: 'bg-blue-500/[0.06]',   border: 'border-blue-500/[0.12]' },
              { label: 'This Week',  value: d.apiUsageWeek ?? 0,   bg: 'bg-purple-500/[0.06]', border: 'border-purple-500/[0.12]' },
              { label: 'This Month', value: d.apiUsageMonth ?? 0,  bg: 'bg-amber-500/[0.06]',  border: 'border-amber-500/[0.12]' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-3 ${item.bg} border ${item.border}`}>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{item.label}</p>
                <p className="text-lg font-bold text-white tabular-nums">
                  <AnimatedNumber value={item.value} />
                </p>
              </div>
            ))}
          </div>

          {/* Provider breakdown */}
          {(d.apiUsageByProvider ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">By Provider (30d)</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.apiUsageByProvider ?? []} layout="vertical">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#60A5FA" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
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
                    <Bar dataKey="calls" fill="url(#barGrad)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ─── Service Costs ────────────────────────────────────────────────── */}
      {d.costBreakdown && (() => {
        const cb = d.costBreakdown as {
          costTodayCents: number
          costThisWeekCents: number
          costTotal30dCents: number
          costByProvider: Array<{ provider: string; calls: number; costCents: number }>
          costChart: Array<{ date: string; costCents: number }>
        }
        const fmtUsd = (cents: number) =>
          (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

        return (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Cost Today"
                value={Math.round(cb.costTodayCents / 100)}
                prefix="$"
                icon={Receipt}
                accentColor="#EF4444"
                sub="AI service spend"
              />
              <StatCard
                label="Cost This Week"
                value={Math.round(cb.costThisWeekCents / 100)}
                prefix="$"
                icon={Receipt}
                accentColor="#F97316"
              />
              <StatCard
                label="Cost 30d"
                value={Math.round(cb.costTotal30dCents / 100)}
                prefix="$"
                icon={Receipt}
                accentColor="#D4AF37"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cost by provider horizontal bar */}
              <Panel>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-[#D4AF37]" />
                  Service Costs (30d)
                </h3>
                {cb.costByProvider.length > 0 ? (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cb.costByProvider} layout="vertical">
                        <defs>
                          <linearGradient id="costBarGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fill: '#52525B', fontSize: 10 }}
                          tickFormatter={(v: number) => `$${(v / 100).toFixed(2)}`}
                          axisLine={false}
                          tickLine={false}
                        />
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
                          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                          formatter={((v: any) => [`${fmtUsd(v)}`, 'Cost']) as any}
                        />
                        <Bar dataKey="costCents" fill="url(#costBarGrad)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 text-center py-8">No cost data yet</p>
                )}
              </Panel>

              {/* Daily cost trend area chart */}
              <Panel>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                    Daily Cost Trend
                  </h3>
                  <span className="text-xs text-zinc-600 tabular-nums">
                    {fmtUsd(cb.costTotal30dCents)} total
                  </span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cb.costChart} margin={{ left: 0, right: 4 }}>
                      <defs>
                        <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#EF4444" stopOpacity={0.4} />
                          <stop offset="60%"  stopColor="#D4AF37" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
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
                        tickFormatter={(v: number) => `$${(v / 100).toFixed(2)}`}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#111113',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#71717A', marginBottom: 4 }}
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                          formatter={((v: any) => [`${fmtUsd(v)}`, 'Cost']) as any}
                      />
                      <Area
                        type="monotone"
                        dataKey="costCents"
                        stroke="#EF4444"
                        strokeWidth={2.5}
                        fill="url(#costAreaGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#EF4444', stroke: '#111', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </div>
        )
      })()}

      {/* ─── Bottom Row: Templates + Activity ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Templates */}
        <Panel>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              Top Templates
            </h3>
            <span className="text-xs text-zinc-500">{d.totalTemplates ?? 0} total</span>
          </div>
          <div className="space-y-1">
            {(d.topTemplates ?? []).slice(0, 6).map((t: {
              id: string; title: string; purchases: number
              downloads: number; averageRating: number; priceCents: number
            }, i: number) => (
              <motion.div
                key={t.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-xs text-zinc-600 w-5 text-center font-bold">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    {t.purchases.toLocaleString()} purchases · {t.downloads.toLocaleString()} downloads
                    {t.averageRating ? ` · ★ ${t.averageRating.toFixed(1)}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#D4AF37] tabular-nums flex-shrink-0">
                  {((t.priceCents ?? 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </motion.div>
            ))}
            {(d.topTemplates ?? []).length === 0 && (
              <p className="text-sm text-zinc-600 text-center py-4">No templates yet</p>
            )}
          </div>
        </Panel>

        {/* Activity Feed */}
        <Panel>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#22C55E]" />
              Recent Activity
              <PulseDot color="#22C55E" />
            </h3>
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {(d.recentActivity ?? []).length} events
            </span>
          </div>
          <ActivityFeed entries={d.recentActivity ?? []} />
        </Panel>
      </div>

      {/* ─── Projects + Extra Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          ForjeGames Dev Board — refreshes every 30s · {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
