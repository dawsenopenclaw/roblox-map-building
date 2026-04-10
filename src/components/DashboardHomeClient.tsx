'use client'

import { useState, useEffect, useRef } from 'react'
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

interface BillingStatus {
  plan: string
  tier: string
  status: string
  tokensUsed: number
  tokenLimit: number
  tokenBalance: number
  renewDate: string | null
  monthlyPrice: string
  cancelAtPeriodEnd: boolean
  marketplaceSearches: number
  apiCallsThisMonth: number
  buildsThisMonth: number
}

interface RecentProject {
  id: string
  title: string
  updatedAt: string
  type: string
}

interface DashboardStats {
  buildsThisWeek: number
  activeProjects: number
  streakDays: number
  buildActivity: number[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#D4AF37'

const STARTER_PROMPTS = [
  'Build a tycoon shop with neon signs',
  'Make a forest map with a river',
  'Create a combat system with health bars',
  'Generate a medieval castle',
]

const BUILD_ACTIVITY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

// ─── Stagger animation keyframes injected once ───────────────────────────────

const KEYFRAMES = `
  @keyframes fj-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fj-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fj-bar-grow {
    from { width: 0%; }
  }
  @keyframes fj-prompt-glow-pulse {
    0%, 100% { box-shadow: 0 0 0px ${GOLD}00; }
    50%       { box-shadow: 0 0 12px ${GOLD}40; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fj-animate { animation: none !important; opacity: 1 !important; }
    .fj-bar-animate { transition: none !important; }
  }
`

function useKeyframesOnce() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'fj-dashboard-keyframes'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = KEYFRAMES
    document.head.appendChild(style)
  }, [])
}

function staggerStyle(index: number, baseDelay = 0): React.CSSProperties {
  return {
    animation: `fj-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${baseDelay + index * 80}ms both`,
  }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = GOLD }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 32
  const w = 80
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    // Smooth clamp so the line never sits exactly at 0 or h
    const y = h - ((v - min) / range) * (h * 0.85) - h * 0.075
    return `${x},${y}`
  })
  const d = `M ${pts.join(' L ')}`
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`
  const gradId = `sg-${color.replace('#', '')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="75%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path
        d={d}
        stroke={color}
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}60)` }}
      />
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * (h * 0.85) - h * 0.075}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const ROYAL = '#7C3AED'

function StatCard({
  label, value, icon, trend, trendUp, sub, sparkline, sparkColor, primary, royalAccent,
}: {
  label: string
  value: string | number
  icon: string
  trend?: string
  trendUp?: boolean
  sub?: string
  sparkline?: number[]
  sparkColor?: string
  primary?: boolean
  royalAccent?: boolean
}) {
  const accentColor = primary ? GOLD : royalAccent ? ROYAL : null
  const baseBorder = primary ? `${GOLD}30` : royalAccent ? `${ROYAL}30` : 'rgba(255,255,255,0.06)'
  const baseInset = 'inset 0 1px 0 rgba(255,255,255,0.04)'
  return (
    <div
      className="group rounded-xl border p-6 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        background: primary
          ? `linear-gradient(135deg, rgba(26,20,0,0.72) 0%, rgba(10,14,32,0.62) 100%)`
          : royalAccent
          ? `linear-gradient(135deg, rgba(19,13,31,0.72) 0%, rgba(10,14,32,0.62) 100%)`
          : 'rgba(10,14,32,0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: baseBorder,
        boxShadow: baseInset,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${GOLD}55`
        el.style.boxShadow = `${baseInset}, 0 8px 32px ${(accentColor ?? GOLD)}22`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = baseBorder
        el.style.boxShadow = baseInset
      }}
    >
      {/* Accent strip on primary/royal cards */}
      {(primary || royalAccent) && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
          style={{ background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}80, ${accentColor}00)` }}
        />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">{label}</span>
          <p
            className="text-2xl font-bold mt-1 leading-none tabular-nums"
            style={{ color: primary ? GOLD : royalAccent ? '#A78BFA' : '#FAFAFA' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{
            background: royalAccent ? `${ROYAL}12` : `${GOLD}12`,
            border: `1px solid ${royalAccent ? `${ROYAL}20` : `${GOLD}20`}`,
          }}
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
        className="rounded-xl border border-white/[0.06] p-6"
        style={{
          background: 'rgba(10,14,32,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-end gap-2 h-28">
          {activityVals.map((v, i) => {
            const heightPct = (v / actMax) * 100
            const isToday = i === activityVals.length - 1
            // Alternate: even indices use gold, odd indices use royal purple
            const useRoyal = !isToday && i % 2 === 1
            const barColor = isToday ? GOLD : useRoyal ? '#7C3AED' : '#374151'
            const barColorEnd = isToday ? `${GOLD}99` : useRoyal ? '#6366F1' : '#1f2937'
            const barGlow = isToday
              ? `0 0 12px ${GOLD}50, 0 -2px 8px ${GOLD}30`
              : useRoyal
              ? '0 0 8px rgba(124,58,237,0.4)'
              : 'none'
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-gray-600 tabular-nums">{v}</span>
                <div
                  className="w-full rounded-t-md relative overflow-hidden"
                  style={{ height: `${Math.max(heightPct, v > 0 ? 4 : 0)}%`, minHeight: v > 0 ? 4 : 0 }}
                >
                  <div
                    className="absolute inset-0 rounded-t-md"
                    style={{
                      background: `linear-gradient(180deg, ${barColor} 0%, ${barColorEnd} 100%)`,
                      boxShadow: barGlow,
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
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7C3AED' }} />
            <span className="text-[10px] text-gray-500">Active days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-700" />
            <span className="text-[10px] text-gray-500">Quiet days</span>
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
          className="text-[11px] font-semibold transition-all hover:opacity-80 hover:translate-x-0.5 inline-block"
          style={{ color: GOLD }}
        >
          New Build →
        </Link>
      </div>
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden transition-colors duration-200 hover:border-[#D4AF37]/30"
        style={{
          background: 'rgba(10,14,32,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {builds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}
            >
              🏗️
            </div>
            <p className="text-sm font-bold text-white mb-1.5">Your first build is one prompt away</p>
            <p className="text-[12px] text-gray-500 mb-5 max-w-[240px] leading-relaxed">
              Describe what you want to create and ForjeAI will build it — terrain, scripts, assets and all.
            </p>
            <Link
              href="/editor"
              className="text-xs font-bold px-5 py-2.5 rounded-lg text-black transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(212,175,55,0.45)]"
              style={{ background: GOLD, boxShadow: `0 0 16px ${GOLD}30` }}
            >
              Open Editor
            </Link>
            <a
              href="https://discord.gg/forjegames"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all hover:opacity-90"
              style={{
                color: '#5865F2',
                background: 'rgba(88,101,242,0.08)',
                borderColor: 'rgba(88,101,242,0.2)',
              }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join our Discord
            </a>
          </div>
        ) : (
          builds.map((build, idx) => (
            <div
              key={build.id}
              className={`group flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.04] ${
                idx < builds.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
              style={{ borderLeftColor: 'transparent', borderLeft: '2px solid transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = `${GOLD}40`
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent'
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                style={{
                  background: `${GOLD}10`,
                  border: `1px solid ${GOLD}15`,
                  boxShadow: `0 0 0px ${GOLD}00`,
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 10px ${GOLD}35`
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0px ${GOLD}00`
                }}
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
  { href: '/editor',      icon: '⚡', title: 'Open Editor',        description: 'Generate terrain, scripts, assets with AI', badge: 'Gold' },
  { href: '/marketplace', icon: '🛒', title: 'Browse Marketplace', description: 'Free & premium Roblox assets' },
  { href: '/download',    icon: '🔌', title: 'Download Plugin',    description: 'Sync builds directly to Roblox Studio' },
  { href: '/referrals',   icon: '🎁', title: 'Invite a Friend',    description: 'Share ForjeAI and earn bonus tokens' },
]

function QuickActions() {
  return (
    <section>
      <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
        {ACTIONS.map((a) => {
          const isGold = a.badge === 'Gold'
          return (
            <Link
              key={a.href + a.title}
              href={a.href}
              className="group rounded-xl border p-6 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden"
              style={{
                background: isGold
                  ? `linear-gradient(135deg, rgba(26,20,0,0.72) 0%, rgba(10,14,32,0.62) 100%)`
                  : 'rgba(10,14,32,0.6)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderColor: isGold ? `${GOLD}35` : 'rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = `${GOLD}55`
                el.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px ${GOLD}1f`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = isGold ? `${GOLD}35` : 'rgba(255,255,255,0.06)'
                el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              {/* Top accent line for gold card */}
              {isGold && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                  style={{ background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}80, ${GOLD}00)` }}
                />
              )}
              {/* Radial hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${GOLD}08 0%, transparent 70%)` }}
              />
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200 group-hover:scale-110"
                  style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}18` }}
                >
                  {a.icon}
                </div>
              </div>
              <div>
                <p
                  className="text-sm font-semibold transition-colors"
                  style={{ color: isGold ? GOLD : 'var(--text-primary, rgba(255,255,255,0.9))' }}
                >
                  {a.title}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{a.description}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-600 group-hover:text-[#D4AF37] transition-colors mt-auto">
                Open
                <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ─── Achievement Progress ─────────────────────────────────────────────────────

function AchievementBar({ pct }: { pct: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animated])

  return (
    <div ref={barRef} className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: animated ? `${pct}%` : '0%',
          background: `linear-gradient(90deg, ${GOLD}99, ${GOLD})`,
          transition: animated ? 'width 900ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          boxShadow: animated && pct > 10 ? `0 0 6px ${GOLD}50` : 'none',
        }}
      />
    </div>
  )
}

function AchievementProgress({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Next Achievements</h2>
        <span className="text-[11px] font-semibold" style={{ color: GOLD }}>
          Progress
        </span>
      </div>
      <div className="space-y-3">
        {achievements.map((a) => {
          const pct = Math.round((a.current / a.target) * 100)
          return (
            <div
              key={a.id}
              className="rounded-xl border border-white/[0.06] p-6 transition-colors duration-200 hover:border-[#D4AF37]/30"
              style={{
                background: 'rgba(10,14,32,0.6)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
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
                <AchievementBar pct={pct} />
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

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function CircularRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={GOLD}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
          filter: `drop-shadow(0 0 4px ${GOLD}80)`,
        }}
      />
    </svg>
  )
}

// ─── Token Balance Widget ─────────────────────────────────────────────────────

function TokenBalanceWidget({
  billing,
  fallbackBalance,
}: {
  billing: BillingStatus | null | undefined
  fallbackBalance: number
}) {
  const balance = billing?.tokenBalance ?? fallbackBalance
  const limit   = billing?.tokenLimit   ?? 0
  const used    = billing?.tokensUsed   ?? 0
  const pct     = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const remaining = limit > 0 ? limit - used : balance

  return (
    <div
      className="rounded-2xl border p-8 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, rgba(26,20,0,0.78) 0%, rgba(10,14,32,0.62) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: `${GOLD}30`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px ${GOLD}12`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}55`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}30`
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}70, ${GOLD}00)` }} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em]">Token Balance</p>
          <p className="text-3xl font-bold tabular-nums mt-1 leading-none" style={{ color: GOLD }}>
            {balance.toLocaleString()}
          </p>
          {limit > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              of {limit.toLocaleString()}/month
            </p>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <CircularRing pct={pct} size={88} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold tabular-nums" style={{ color: GOLD }}>
              {pct}%
            </span>
            <span className="text-[9px] text-gray-600 leading-none">used</span>
          </div>
        </div>
      </div>

      {limit > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500">{used.toLocaleString()} used</span>
            <span className="text-gray-500">{remaining.toLocaleString()} left</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${GOLD}99, ${GOLD})`,
                boxShadow: pct > 5 ? `0 0 6px ${GOLD}50` : 'none',
                transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>
        </div>
      )}

      {billing?.renewDate && (
        <p className="text-[10px] text-gray-600">Renews {billing.renewDate}</p>
      )}
    </div>
  )
}

// ─── Usage This Month Bar ─────────────────────────────────────────────────────

function UsageThisMonth({ billing }: { billing: BillingStatus | null | undefined }) {
  if (!billing || billing.tokenLimit === 0) return null

  const { tokensUsed, tokenLimit, buildsThisMonth, apiCallsThisMonth } = billing
  const usedPct  = Math.min(100, Math.round((tokensUsed / tokenLimit) * 100))
  const freePct  = 100 - usedPct

  const bars: { label: string; value: number; max: number; color: string }[] = [
    { label: 'Tokens used',   value: tokensUsed,       max: tokenLimit, color: GOLD },
    { label: 'Builds',        value: buildsThisMonth,  max: Math.max(buildsThisMonth, 10), color: '#7C3AED' },
    { label: 'API calls',     value: apiCallsThisMonth, max: Math.max(apiCallsThisMonth, 50), color: '#34D399' },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white">Usage This Month</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">{usedPct}% of token allowance consumed</p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums"
          style={{ color: GOLD, background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
        >
          {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
        </span>
      </div>

      <div
        className="rounded-xl border border-white/[0.06] p-6 space-y-4 transition-colors duration-200 hover:border-[#D4AF37]/30"
        style={{
          background: 'rgba(10,14,32,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Stacked token bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
            <span>Token split</span>
            <span>{freePct}% remaining</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            <div
              className="h-full rounded-l-full"
              style={{
                width: `${usedPct}%`,
                background: `linear-gradient(90deg, ${GOLD}bb, ${GOLD})`,
                boxShadow: usedPct > 5 ? `0 0 8px ${GOLD}50` : 'none',
                transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                minWidth: usedPct > 0 ? 4 : 0,
              }}
            />
            <div
              className="h-full flex-1 rounded-r-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: GOLD }} />
              <span className="text-[10px] text-gray-500">Used</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-white/10" />
              <span className="text-[10px] text-gray-500">Remaining</span>
            </div>
          </div>
        </div>

        {/* Individual stat bars */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          {bars.map(({ label, value, max, color }) => {
            const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-gray-400">{label}</span>
                  <span className="tabular-nums font-semibold" style={{ color }}>
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      opacity: 0.85,
                      transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                      minWidth: pct > 0 ? 4 : 0,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Recent Projects ──────────────────────────────────────────────────────────

function RecentProjects({ builds }: { builds: RecentBuild[] }) {
  // Reuse RecentBuild data but present as "projects" — dedupe by typeLabel and show latest 3
  const projects = builds.slice(0, 3)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Recent Projects</h2>
        <Link
          href="/editor"
          className="text-[11px] font-semibold transition-all hover:opacity-80 hover:translate-x-0.5 inline-block"
          style={{ color: GOLD }}
        >
          New Project →
        </Link>
      </div>
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden transition-colors duration-200 hover:border-[#D4AF37]/30"
        style={{
          background: 'rgba(10,14,32,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}
            >
              🗂️
            </div>
            <p className="text-sm font-bold text-white mb-1">No projects yet</p>
            <p className="text-[12px] text-gray-500 mb-4 max-w-[220px] leading-relaxed">
              Your builds will appear here once you start creating.
            </p>
            <Link
              href="/editor"
              className="text-xs font-bold px-4 py-2 rounded-lg text-black transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              style={{ background: GOLD }}
            >
              Start Building
            </Link>
          </div>
        ) : (
          projects.map((build, idx) => (
            <Link
              key={build.id}
              href={`/editor?build=${build.id}`}
              className={`group flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.04] ${
                idx < projects.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}15` }}
              >
                {build.typeIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                  {build.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: GOLD, background: `${GOLD}12` }}
                  >
                    {build.typeLabel}
                  </span>
                  <span className="text-[11px] text-gray-500">{timeAgo(build.ts)}</span>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-[#D4AF37] transition-colors flex-shrink-0"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  FREE:    { color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)' },
  HOBBY:   { color: GOLD,      bg: `${GOLD}10`,              border: `${GOLD}35` },
  CREATOR: { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.35)' },
  STUDIO:  { color: '#34D399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)' },
}

function PlanBadge({ tier }: { tier: string }) {
  const key = tier.toUpperCase()
  const styles = PLAN_COLORS[key] ?? PLAN_COLORS.FREE
  return (
    <span
      className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
      style={{ color: styles.color, borderColor: styles.border, background: styles.bg }}
    >
      {key}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── New-User Hero ────────────────────────────────────────────────────────────

const CAPABILITIES = [
  { icon: '🏔️', label: 'Terrain generation',  desc: 'Mountains, rivers, caves from a single prompt' },
  { icon: '⚙️', label: 'Luau scripts',         desc: 'Game logic, combat, data stores — fully wired up' },
  { icon: '🧊', label: '3D models',             desc: 'Buildings, props, vehicles placed into your map' },
  { icon: '🖥️', label: 'UI screens',            desc: 'Health bars, shops, leaderboards — styled and working' },
]

function NewUserHero({ firstName, tokenBalance, subscription }: { firstName: string; tokenBalance: number; subscription: string }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,12,0,0.78) 0%, rgba(10,14,32,0.62) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: `${GOLD}22`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px ${GOLD}08`,
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}70, transparent)` }} />

      <div className="p-8">
        {/* Greeting */}
        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Welcome,{' '}
            <span style={{ color: GOLD }}>{firstName}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-lg">
            ForjeAI turns plain descriptions into fully built Roblox game worlds — terrain,
            scripts, models and UI — in seconds. Your{' '}
            <span className="text-white font-semibold">{tokenBalance.toLocaleString()} tokens</span>
            {' '}are loaded and ready.
          </p>
        </div>

        {/* Capability tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {CAPABILITIES.map(({ icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl p-3.5 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-2xl select-none">{icon}</span>
              <p className="text-xs font-semibold text-white leading-tight">{label}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Primary CTA row */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/editor"
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-black transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_32px_rgba(212,175,55,0.55)]"
            style={{ background: GOLD, boxShadow: `0 0 24px ${GOLD}40` }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Building
          </Link>
          {subscription === 'FREE' && (
            <Link
              href="/billing"
              className="text-xs font-semibold px-4 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
            >
              View plans
            </Link>
          )}
          <span className="text-[11px] text-gray-600 ml-1">No code needed — just describe what you want.</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardHomeClient({ firstName, subscription, tokenBalance, lifetimeSpent, initialPrompt }: Props) {
  useKeyframesOnce()

  const { data: tokenData } = useSWR<TokenData>('/api/tokens/balance', fetcher, { refreshInterval: 30000 })
  const { data: statsData } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, { refreshInterval: 60000 })
  const { data: buildsData } = useSWR<RecentBuildsData>('/api/dashboard/recent-builds', fetcher, { refreshInterval: 60000 })
  const { data: billingData } = useSWR<BillingStatus | null>('/api/billing/status', fetcher, { refreshInterval: 120000 })
  const { show: showToast } = useToast()
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    setCurrentDate(formatDate())
  }, [])

  // First-visit welcome toast (only once, only after data is ready)
  useEffect(() => {
    const key = 'fj_dashboard_visited'
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      const balance = tokenData?.balance ?? tokenBalance
      if (balance > 0) {
        const timer = setTimeout(() => {
          showToast({ variant: 'success', title: `${balance.toLocaleString()} tokens ready`, description: 'Describe your game and ForjeAI will build it.', duration: 4000 })
        }, 600)
        return () => clearTimeout(timer)
      }
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

  const activeTier = billingData?.tier ?? subscription

  // A user is "new" when stats have loaded and they have zero lifetime builds
  const statsLoaded = statsData !== undefined
  const isNewUser = statsLoaded && buildsThisWeek === 0 && liveSpent === 0 && recentBuilds.length === 0

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── New-user hero — shown instead of the normal header for first-timers ── */}
        {isNewUser ? (
          <div
            className="fj-animate"
            style={{ animation: 'fj-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0ms both' }}
          >
            <NewUserHero firstName={firstName} tokenBalance={liveBalance} subscription={subscription} />
          </div>
        ) : (
        <>

        {/* ── Returning-user welcome header ────────────────────────────── */}
        <div
          className="fj-animate flex items-start justify-between gap-4 flex-wrap"
          style={{ animation: 'fj-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0ms both' }}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back,{' '}
              <span
                style={{
                  color: GOLD,
                  display: 'inline-block',
                  animation: 'fj-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 80ms both',
                }}
              >
                {firstName}
              </span>
            </h1>
            <p
              className="text-gray-500 text-sm mt-1.5"
              style={{ animation: 'fj-fade-in 0.5s ease 180ms both' }}
            >
              {currentDate || <span className="opacity-0">loading</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0" style={{ animation: 'fj-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) 120ms both' }}>
            <PlanBadge tier={activeTier} />
            <Link
              href="/editor"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-black transition-all hover:opacity-95 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(212,175,55,0.5)]"
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
            className="fj-animate flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-5"
            style={{
              background: `${GOLD}08`,
              borderColor: `${GOLD}30`,
              animation: 'fj-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) 160ms both',
            }}
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
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-95 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(212,175,55,0.45)]"
              style={{ background: GOLD }}
            >
              Start Building
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── Starter Prompt Pills ───────────────────────────────────────── */}
        <div
          className="fj-animate flex flex-wrap gap-2"
          style={{ animation: 'fj-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) 200ms both' }}
        >
          {STARTER_PROMPTS.map((prompt, i) => (
            <Link
              key={prompt}
              href={`/editor?prompt=${encodeURIComponent(prompt)}`}
              className="relative text-[12px] px-3 py-1.5 rounded-lg border transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#71717A',
                animationDelay: `${240 + i * 40}ms`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(212,175,55,0.08)'
                el.style.borderColor = 'rgba(212,175,55,0.25)'
                el.style.color = GOLD
                el.style.boxShadow = `0 0 14px ${GOLD}28`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.color = '#71717A'
                el.style.boxShadow = 'none'
              }}
            >
              {prompt}
            </Link>
          ))}
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            <StatCard
              key="balance"
              label="Token Balance"
              value={liveBalance}
              icon="⚡"
              sub={liveSpent === 0 ? 'Nothing spent yet' : `${liveSpent.toLocaleString()} spent lifetime`}
              primary
            />,
            <StatCard
              key="builds"
              label="Builds This Week"
              value={buildsThisWeek}
              icon="🔨"
              sub={buildsThisWeek === 0 ? 'No builds yet — start creating' : 'Across all projects'}
              sparkColor="#34D399"
            />,
            <StatCard
              key="projects"
              label="Active Projects"
              value={activeProjects}
              icon="🗂️"
              sub={activeProjects === 0 ? 'Open the editor to begin' : undefined}
              sparkColor="#7C3AED"
              royalAccent
            />,
            <StatCard
              key="streak"
              label="Streak Days"
              value={streakDays}
              icon="🔥"
              sub={streakDays === 0 ? 'Build today to start your streak' : undefined}
              sparkColor="#F59E0B"
            />,
          ].map((card, i) => (
            <div key={i} className="fj-animate" style={staggerStyle(i, 280)}>
              {card}
            </div>
          ))}
        </div>

        {/* ── Body Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left 2/3 */}
          <div className="xl:col-span-2 space-y-6">

            {/* Token Balance Widget + Usage side-by-side on wide screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="fj-animate" style={staggerStyle(0, 360)}>
                <TokenBalanceWidget billing={billingData} fallbackBalance={liveBalance} />
              </div>
              <div className="fj-animate" style={staggerStyle(1, 360)}>
                <UsageThisMonth billing={billingData} />
              </div>
            </div>

            <div className="fj-animate" style={staggerStyle(0, 450)}>
              <ActivityChart activityVals={activityVals} />
            </div>
            <div className="fj-animate" style={staggerStyle(1, 450)}>
              <RecentBuilds builds={recentBuilds} />
            </div>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <div className="fj-animate" style={staggerStyle(2, 450)}>
              <QuickActions />
            </div>

            <div className="fj-animate" style={staggerStyle(3, 450)}>
              <RecentProjects builds={recentBuilds} />
            </div>

            {/* Token CTA for FREE users */}
            {activeTier === 'FREE' && (
              <div className="fj-animate" style={staggerStyle(4, 450)}>
                <section>
                  <div
                    className="rounded-xl border p-6 transition-colors duration-200 hover:border-[#D4AF37]/50"
                    style={{
                      background: 'rgba(10,14,32,0.6)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      borderColor: `${GOLD}25`,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: GOLD }}>⚡</span>
                      <p className="text-sm font-bold text-white">Running low?</p>
                    </div>
                    <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                      Upgrade for more tokens and priority AI generation.
                    </p>
                    <Link
                      href="/billing"
                      className="block text-center w-full py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-95 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(212,175,55,0.45)]"
                      style={{ background: GOLD }}
                    >
                      View Plans
                    </Link>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
