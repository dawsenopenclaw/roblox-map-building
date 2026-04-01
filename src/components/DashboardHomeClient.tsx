'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useToast } from '@/components/ui/toast-notification'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  firstName: string
  subscription: string
  tokenBalance: number
  lifetimeSpent: number
  initialPrompt?: string
}

interface TokenData {
  balance: number
  lifetimeSpent: number
  planLimit: number
}

interface DashboardStats {
  buildsThisWeek: number
  activeProjects: number
  streakDays: number
  buildActivity: number[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#FFB81C'

const SPARKLINE_TOKEN = [210, 190, 320, 280, 410, 390, 460]

const BUILD_ACTIVITY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ACTIVITY_MAX = 9

interface RecentBuild {
  id: string
  typeIcon: string
  typeLabel: string
  description: string
  ts: number
  tokens: number
}

interface RecentBuildsData {
  builds: RecentBuild[]
}

interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  current: number
  target: number
  xp: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date())
}

// ─── Sparkline (CSS-only) ─────────────────────────────────────────────────────

function Sparkline({ data, color = GOLD }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 32
  const w = 80
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const d = `M ${pts.join(' L ')}`
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* last dot */}
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, trend, trendUp, sub, sparkline, sparkColor,
}: {
  label: string
  value: string | number
  icon: string
  trend?: string
  trendUp?: boolean
  sub?: string
  sparkline?: number[]
  sparkColor?: string
}) {
  return (
    <div
      className="rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-2 transition-all duration-200 hover:border-white/20 hover:shadow-lg"
      style={{ background: 'linear-gradient(135deg, #161616 0%, #111111 100%)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">{label}</span>
          <p className="text-2xl font-bold text-white mt-1 leading-none tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
        >
          {icon}
        </div>
      </div>
      {sparkline && (
        <div className="mt-1">
          <Sparkline data={sparkline} color={sparkColor ?? GOLD} />
        </div>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-auto pt-1 border-t border-white/[0.06]">
          <span className={`text-[11px] font-bold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
          <span className="text-[11px] text-gray-600">vs last week</span>
        </div>
      )}
    </div>
  )
}

// ─── Activity Bar Chart ───────────────────────────────────────────────────────

function ActivityChart({ activityVals }: { activityVals: number[] }) {
  const actMax = Math.max(...activityVals, 1)
  const total = activityVals.reduce((s, v) => s + v, 0)
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white">Build Activity</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Last 7 days</p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ color: GOLD, background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
        >
          {total} total builds
        </span>
      </div>
      <div
        className="rounded-2xl border border-white/[0.08] p-5"
        style={{ background: '#111111' }}
      >
        <div className="flex items-end gap-2 h-28">
          {activityVals.map((v, i) => {
            const heightPct = (v / actMax) * 100
            const isToday = i === activityVals.length - 1
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-gray-600 tabular-nums">{v}</span>
                <div className="w-full rounded-t-md relative overflow-hidden" style={{ height: `${Math.max(heightPct, v > 0 ? 4 : 0)}%`, minHeight: v > 0 ? 4 : 0 }}>
                  <div
                    className="absolute inset-0 rounded-t-md"
                    style={{
                      background: isToday
                        ? `linear-gradient(180deg, ${GOLD} 0%, ${GOLD}99 100%)`
                        : 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
                      boxShadow: isToday ? `0 0 10px ${GOLD}40` : 'none',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{BUILD_ACTIVITY_DAYS[i]}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: GOLD }} />
            <span className="text-[10px] text-gray-500">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-700" />
            <span className="text-[10px] text-gray-500">Past days</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Recent Builds ────────────────────────────────────────────────────────────

function RecentBuilds({ builds }: { builds: RecentBuild[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Recent Builds</h2>
        <Link
          href="/editor"
          className="text-[11px] font-semibold transition-colors"
          style={{ color: GOLD }}
        >
          New Build →
        </Link>
      </div>
      <div
        className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: '#111111' }}
      >
        {builds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}15` }}
            >
              ⚡
            </div>
            <p className="text-sm font-semibold text-white mb-1">No builds yet</p>
            <p className="text-[12px] text-gray-500 mb-4">Your AI-generated assets will appear here.</p>
            <Link
              href="/editor"
              className="text-xs font-bold px-4 py-2 rounded-lg text-black transition-all hover:opacity-90"
              style={{ background: GOLD }}
            >
              Start building
            </Link>
          </div>
        ) : (
          builds.map((build, idx) => (
            <div
              key={build.id}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.04] ${
                idx < builds.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}15` }}
              >
                {build.typeIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: GOLD, background: `${GOLD}12` }}
                  >
                    {build.typeLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-200 mt-0.5 truncate">{build.description}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-[11px] text-gray-500 tabular-nums">{timeAgo(build.ts)}</span>
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: GOLD }}
                >
                  -{build.tokens} tkn
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

interface ActionDef {
  href: string
  icon: string
  title: string
  description: string
  badge?: string
}

const ACTIONS: ActionDef[] = [
  { href: '/editor',      icon: '⚡', title: 'New Build',         description: 'Generate terrain, scripts, assets with AI' },
  { href: '/marketplace', icon: '🛒', title: 'Browse Marketplace',description: 'Free & premium Roblox assets',  badge: 'New' },
  { href: '/editor',      icon: '🔌', title: 'Connect Studio',    description: 'Sync builds directly to Roblox Studio' },
  { href: '/docs',        icon: '📖', title: 'View Docs',         description: 'API reference and build guides' },
]

function QuickActions() {
  return (
    <section>
      <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.href + a.title}
            href={a.href}
            className="group rounded-2xl border border-white/[0.08] p-4 flex flex-col gap-2 transition-all duration-200 hover:border-[#FFB81C]/30 hover:shadow-lg relative overflow-hidden"
            style={{ background: '#111111' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(circle at 0% 0%, ${GOLD}08 0%, transparent 70%)` }}
            />
            <div className="flex items-center justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-colors"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}18` }}
              >
                {a.icon}
              </div>
              {a.badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#0A0E27', background: GOLD }}
                >
                  {a.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#FFB81C] transition-colors">
                {a.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{a.description}</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-600 group-hover:text-[#FFB81C] transition-colors mt-auto">
              Open
              <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Achievement Progress ─────────────────────────────────────────────────────

function AchievementProgress({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Next Achievements</h2>
        <Link href="/achievements" className="text-[11px] font-semibold transition-colors" style={{ color: GOLD }}>
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {achievements.map((a) => {
          const pct = Math.round((a.current / a.target) * 100)
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-white/[0.08] p-4"
              style={{ background: '#111111' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ color: GOLD, background: `${GOLD}12` }}
                    >
                      +{a.xp} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{a.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}99, ${GOLD})` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums flex-shrink-0">
                  {a.current}/{a.target}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardHomeClient({ firstName, subscription, tokenBalance, lifetimeSpent, initialPrompt }: Props) {
  const { data: tokenData } = useSWR<TokenData>('/api/tokens/balance', fetcher, { refreshInterval: 30000 })
  const { data: statsData } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, { refreshInterval: 60000 })
  const { data: buildsData } = useSWR<RecentBuildsData>('/api/dashboard/recent-builds', fetcher, { refreshInterval: 60000 })
  const { show: showToast } = useToast()
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    setCurrentDate(formatDate())
  }, [])

  // First-visit token balance toast
  useEffect(() => {
    const key = 'fj_dashboard_visited'
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      const balance = tokenData?.balance ?? tokenBalance
      const timer = setTimeout(() => {
        showToast({ variant: 'warning', title: `Your token balance: ${balance.toLocaleString()}`, description: 'Head to the Editor to start building with your tokens.', duration: 5000 })
      }, 800)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const liveBalance = tokenData?.balance ?? tokenBalance
  const liveSpent = tokenData?.lifetimeSpent ?? lifetimeSpent

  const buildsThisWeek = statsData?.buildsThisWeek ?? 0
  const activeProjects = statsData?.activeProjects ?? 0
  const streakDays = statsData?.streakDays ?? 0
  const activityVals = statsData?.buildActivity ?? Array(7).fill(0)

  const recentBuilds = buildsData?.builds ?? []

  const tierLabel = subscription === 'FREE' ? 'Free' : subscription === 'PRO' ? 'Pro' : subscription

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Welcome Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back,{' '}
              <span style={{ color: GOLD }}>{firstName}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              {currentDate || <span className="opacity-0">loading</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
              style={{ color: GOLD, borderColor: `${GOLD}35`, background: `${GOLD}10` }}
            >
              {tierLabel} Plan
            </span>
            <Link
              href="/editor"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: GOLD, boxShadow: `0 0 20px ${GOLD}35` }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open Editor
            </Link>
          </div>
        </div>

        {/* ── Onboarding Prompt Banner ───────────────────────────────────── */}
        {initialPrompt && (
          <div
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-5"
            style={{ background: `${GOLD}08`, borderColor: `${GOLD}30` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.1em] mb-1" style={{ color: GOLD }}>
                Ready to build?
              </p>
              <p className="text-sm text-gray-200 truncate">
                Your prompt: &ldquo;{initialPrompt}&rdquo;
              </p>
            </div>
            <Link
              href={`/editor?prompt=${encodeURIComponent(initialPrompt)}`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
              style={{ background: GOLD }}
            >
              Start Building
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Token Balance"
            value={liveBalance}
            icon="⚡"
            sub={`${liveSpent.toLocaleString()} spent lifetime`}
            sparkline={SPARKLINE_TOKEN}
          />
          <StatCard
            label="Builds This Week"
            value={buildsThisWeek}
            icon="🔨"
            sub="Across all projects"
            sparkColor="#34D399"
          />
          <StatCard
            label="Active Projects"
            value={activeProjects}
            icon="🗂️"
            sparkColor="#60A5FA"
          />
          <StatCard
            label="Streak Days"
            value={streakDays}
            icon="🔥"
            sparkColor="#F59E0B"
          />
        </div>

        {/* ── Body Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left 2/3 */}
          <div className="xl:col-span-2 space-y-6">
            <ActivityChart activityVals={activityVals} />
            <RecentBuilds builds={recentBuilds} />
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <QuickActions />
            <AchievementProgress achievements={[]} />

            {/* Token CTA for FREE users */}
            {subscription === 'FREE' && (
              <section>
                <div
                  className="rounded-2xl border p-5"
                  style={{ background: '#111111', borderColor: `${GOLD}25` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: GOLD }}>⚡</span>
                    <p className="text-sm font-bold text-white">Running low?</p>
                  </div>
                  <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                    Upgrade to Pro for unlimited tokens and priority AI generation.
                  </p>
                  <Link
                    href="/billing"
                    className="block text-center w-full py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
                    style={{ background: GOLD }}
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
