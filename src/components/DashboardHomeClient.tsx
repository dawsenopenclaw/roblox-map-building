'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  firstName: string
  subscription: string
  tokenBalance: number
  lifetimeSpent: number
}

interface TokenData {
  balance: number
  lifetimeSpent: number
  planLimit: number
}

interface ActivityItem {
  id: string
  icon: string
  label: string
  detail: string
  ts: number
  type: 'build' | 'marketplace' | 'token' | 'project' | 'achievement'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const GOLD = '#D4AF37'

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: '⚡', label: 'AI Generation completed', detail: 'Stone castle entrance arch — 12 tokens', ts: Date.now() - 1000 * 60 * 8, type: 'build' },
  { id: '2', icon: '🏗️', label: 'New project created', detail: 'Medieval Kingdom v2', ts: Date.now() - 1000 * 60 * 34, type: 'project' },
  { id: '3', icon: '🛒', label: 'Marketplace asset saved', detail: 'Fantasy Tree Pack — Free', ts: Date.now() - 1000 * 60 * 61, type: 'marketplace' },
  { id: '4', icon: '🏆', label: 'Achievement unlocked', detail: 'First Build — 50 XP earned', ts: Date.now() - 1000 * 60 * 120, type: 'achievement' },
  { id: '5', icon: '💰', label: 'Tokens purchased', detail: '500 tokens added to balance', ts: Date.now() - 1000 * 60 * 240, type: 'token' },
]

const CHECKLIST = [
  { id: 'profile', label: 'Complete your profile', href: '/settings', done: false },
  { id: 'first_build', label: 'Run your first AI build', href: '/editor', done: false },
  { id: 'marketplace', label: 'Browse the marketplace', href: '/marketplace', done: false },
  { id: 'team', label: 'Invite a team member', href: '/team', done: false },
  { id: 'tokens', label: 'Top up your token balance', href: '/tokens', done: false },
]

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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  sub?: string
}) {
  return (
    <div
      className="rounded-xl border border-gray-800 p-5 flex flex-col gap-3 transition-colors hover:border-gray-700"
      style={{ background: '#242424' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        <span style={{ color: GOLD }} className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-white leading-none">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
          <span className="text-xs text-gray-600">vs last week</span>
        </div>
      )}
    </div>
  )
}

// ─── Quick Action Card ────────────────────────────────────────────────────────

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-800 p-5 flex flex-col gap-3 transition-all duration-200 hover:border-[#D4AF37]/50 cursor-pointer"
      style={{ background: '#242424' }}
      // gold glow on hover via inline style + group-hover driven shadow
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 transition-colors group-hover:bg-[#D4AF37]/15"
        style={{ background: 'rgba(212,175,55,0.08)' }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 group-hover:text-[#D4AF37] transition-colors mt-auto">
        Open
        <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// ─── Checklist Item ───────────────────────────────────────────────────────────

function CheckItem({
  item,
  checked,
  onToggle,
}: {
  item: (typeof CHECKLIST)[0]
  checked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors group">
      <button
        onClick={() => onToggle(item.id)}
        aria-label={checked ? `Mark "${item.label}" incomplete` : `Mark "${item.label}" complete`}
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
          checked
            ? 'border-transparent'
            : 'border-gray-600 hover:border-[#D4AF37] bg-transparent'
        }`}
        style={checked ? { background: GOLD } : {}}
      >
        {checked && (
          <svg className="w-3 h-3 text-gray-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <Link
        href={item.href}
        className={`flex-1 text-sm transition-colors ${checked ? 'text-gray-600 line-through' : 'text-gray-300 hover:text-white'}`}
      >
        {item.label}
      </Link>
      {!checked && (
        <svg className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardHomeClient({ firstName, subscription, tokenBalance, lifetimeSpent }: Props) {
  const { data: tokenData } = useSWR<TokenData>('/api/tokens/balance', fetcher, { refreshInterval: 30000 })
  const [activity] = useState<ActivityItem[]>(DEMO_ACTIVITY)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [currentDate, setCurrentDate] = useState('')

  // Hydration-safe date rendering
  useEffect(() => {
    setCurrentDate(formatDate())
  }, [])

  const liveBalance = tokenData?.balance ?? tokenBalance
  const liveSpent = tokenData?.lifetimeSpent ?? lifetimeSpent

  const completedCount = checked.size
  const totalCount = CHECKLIST.length

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tierLabel = subscription === 'FREE' ? 'Free' : subscription === 'PRO' ? 'Pro' : subscription

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ color: GOLD, borderColor: `${GOLD}40`, background: `${GOLD}10` }}
            >
              {tierLabel} Plan
            </span>
            <Link
              href="/editor"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-950 transition-opacity hover:opacity-90"
              style={{ background: GOLD }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open Editor
            </Link>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Token Balance"
            value={liveBalance}
            icon="⚡"
            trend="12%"
            trendUp
            sub={`${liveSpent.toLocaleString()} spent lifetime`}
          />
          <StatCard
            label="Active Projects"
            value={3}
            icon="🏗️"
            trend="1 new"
            trendUp
            sub="2 updated this week"
          />
          <StatCard
            label="AI Generations"
            value={47}
            icon="🤖"
            trend="8%"
            trendUp
            sub="This month"
          />
          <StatCard
            label="Marketplace Sales"
            value="$0.00"
            icon="🛒"
            sub="Publish assets to earn"
          />
        </div>

        {/* ── Body Grid: Actions + Activity + Checklist ─────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left 2/3: Quick Actions + Activity */}
          <div className="xl:col-span-2 space-y-6">

            {/* Quick Actions */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ActionCard
                  href="/editor"
                  icon="⚡"
                  title="Start Building"
                  description="Open the AI editor and build your Roblox game with natural language commands."
                />
                <ActionCard
                  href="/marketplace"
                  icon="🛒"
                  title="Browse Marketplace"
                  description="Discover thousands of free and premium assets to drop into your project."
                />
                <ActionCard
                  href="/earnings"
                  icon="📊"
                  title="View Analytics"
                  description="Track token usage, AI generation stats, and project performance."
                />
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                  Recent Activity
                </h2>
                <Link
                  href="/settings"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  View all
                </Link>
              </div>
              <div
                className="rounded-xl border border-gray-800 overflow-hidden"
                style={{ background: '#242424' }}
              >
                {activity.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/5 ${
                      idx < activity.length - 1 ? 'border-b border-gray-800/70' : ''
                    }`}
                  >
                    {/* Icon bubble */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{ background: `${GOLD}10` }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 leading-snug">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5 tabular-nums">
                      {timeAgo(item.ts)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right 1/3: Getting Started Checklist */}
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                  Getting Started
                </h2>
                <span className="text-xs text-gray-500 tabular-nums">
                  {completedCount}/{totalCount}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-gray-800 mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / totalCount) * 100}%`,
                    background: GOLD,
                  }}
                />
              </div>

              <div
                className="rounded-xl border border-gray-800 overflow-hidden"
                style={{ background: '#242424' }}
              >
                <div className="p-2">
                  {CHECKLIST.map((item) => (
                    <CheckItem
                      key={item.id}
                      item={item}
                      checked={checked.has(item.id)}
                      onToggle={toggleCheck}
                    />
                  ))}
                </div>
              </div>

              {completedCount === totalCount && (
                <div
                  className="mt-4 rounded-xl border px-5 py-4 text-center"
                  style={{ borderColor: `${GOLD}40`, background: `${GOLD}08` }}
                >
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>
                    All done! You're a pro.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Explore advanced features in the editor.
                  </p>
                </div>
              )}
            </section>

            {/* Token Top-up CTA (show only for FREE) */}
            {subscription === 'FREE' && (
              <section>
                <div
                  className="rounded-xl border p-5"
                  style={{ background: '#242424', borderColor: `${GOLD}30` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: GOLD }}>⚡</span>
                    <p className="text-sm font-semibold text-white">Running low?</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Upgrade to Pro for unlimited tokens and priority AI generation.
                  </p>
                  <Link
                    href="/billing"
                    className="block text-center w-full py-2 rounded-lg text-sm font-semibold text-gray-950 transition-opacity hover:opacity-90"
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
