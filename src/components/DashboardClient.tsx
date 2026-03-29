'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { AnimatedCard } from '@/components/ui/animated-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useAnalytics } from '@/hooks/useAnalytics'
import { OnboardingTooltips } from '@/components/OnboardingTooltips'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  firstName: string
  subscription: string
}

interface TokenData {
  balance: number
  lifetimeSpent: number
  planLimit: number
}

interface GamificationData {
  xp: { totalXp: number; tier: string }
  streak: {
    loginStreak: number
    buildStreak: number
    lastLoginDate: string | null
    streakDays: boolean[]
  }
}

interface ActivityEvent {
  id?: string
  action: string
  description: string
  timestamp: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const QUICK_ACTIONS = [
  {
    href: '/voice',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    label: 'Voice Build',
    description: 'Speak your map into existence',
    color: '#FFB81C',
    shortcut: 'V',
  },
  {
    href: '/image-to-map',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    label: 'Image to Map',
    description: 'Upload a reference image',
    color: '#60A5FA',
    shortcut: 'I',
  },
  {
    href: '/projects/new',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    label: 'New Project',
    description: 'Start from a blank canvas',
    color: '#A78BFA',
    shortcut: 'N',
  },
  {
    href: '/marketplace',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
    label: 'Templates',
    description: 'Browse the asset library',
    color: '#34D399',
    shortcut: 'T',
  },
]

const DEMO_PROJECTS = [
  {
    id: '1',
    name: 'Medieval Castle',
    lastEdited: '2 hours ago',
    buildType: 'Voice Build',
    tokensUsed: 240,
    status: 'active',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    id: '2',
    name: 'Tropical Island Map',
    lastEdited: '1 day ago',
    buildType: 'Image to Map',
    tokensUsed: 380,
    status: 'published',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: '3',
    name: 'Racing Track',
    lastEdited: '3 days ago',
    buildType: 'Voice Build',
    tokensUsed: 180,
    status: 'draft',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
]

const DEMO_ACTIVITY: ActivityEvent[] = [
  { id: '1', action: 'build', description: 'Published "Medieval Castle" to Roblox', timestamp: Date.now() - 1000 * 60 * 12 },
  { id: '2', action: 'sale', description: 'Template "Tropical Starter Pack" sold for $14.99', timestamp: Date.now() - 1000 * 60 * 45 },
  { id: '3', action: 'token', description: 'Purchased 500 tokens', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
  { id: '4', action: 'build', description: 'Voice Build completed for "Racing Track"', timestamp: Date.now() - 1000 * 60 * 60 * 5 },
  { id: '5', action: 'achievement', description: 'Unlocked "Speed Builder" achievement', timestamp: Date.now() - 1000 * 60 * 60 * 24 },
]

const ACTION_ICONS: Record<string, React.ReactNode> = {
  build: (
    <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    </div>
  ),
  sale: (
    <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    </div>
  ),
  token: (
    <div className="w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </div>
  ),
  achievement: (
    <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    </div>
  ),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'published': return 'bg-green-500/15 text-green-400 border-green-500/20'
    case 'active': return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    default: return 'bg-white/5 text-gray-400 border-white/10'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/8 rounded-lg animate-pulse ${className}`} />
  )
}

function StatCard({
  label,
  value,
  numericValue,
  icon,
  trend,
  delay = 0,
}: {
  label: string
  value: string
  /** If provided, AnimatedCounter is used instead of static text */
  numericValue?: number
  icon: React.ReactNode
  trend?: string
  delay?: number
}) {
  return (
    <AnimatedCard
      index={Math.round(delay * 20)}
      className="bg-[#0D1231] border border-white/10 rounded-xl p-4 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center flex-shrink-0 text-[#FFB81C]">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">
          {numericValue !== undefined ? (
            <AnimatedCounter value={numericValue} />
          ) : (
            value
          )}
        </p>
        {trend && <p className="text-xs text-green-400 mt-0.5">{trend}</p>}
      </div>
    </AnimatedCard>
  )
}

function TokenRing({ balance, limit }: { balance: number; limit: number }) {
  const pct = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1E2451" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#FFB81C"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

// Mini sparkline — renders last N data points as an SVG path
function Sparkline({ data, color = '#FFB81C' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const d = `M ${pts.join(' L ')}`

  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
      />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({ firstName, subscription }: DashboardProps) {
  const router = useRouter()
  const { track } = useAnalytics()
  const [searchOpen, setSearchOpen] = useState(false)
  const [, forceUpdate] = useState(0)

  const { data: tokenData, isLoading: tokenLoading } = useSWR<TokenData>(
    '/api/tokens/balance',
    fetcher,
    { refreshInterval: 30_000 },
  )

  const { data: gamData, isLoading: gamLoading } = useSWR<GamificationData>(
    '/api/gamification/status',
    fetcher,
    { refreshInterval: 60_000 },
  )

  // Refresh "X ago" timestamps
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  // Track dashboard load — detect first-ever visit via localStorage
  useEffect(() => {
    const FIRST_VISIT_KEY = 'rf_dashboard_visited'
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(FIRST_VISIT_KEY)) {
      localStorage.setItem(FIRST_VISIT_KEY, '1')
      track('signup_completed', { method: 'clerk' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (mod && e.key === 'n') {
        e.preventDefault()
        router.push('/projects/new')
      }
      if (e.key === 'Escape') setSearchOpen(false)
    },
    [router],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const balance = tokenData?.balance ?? 0
  const lifetimeSpent = tokenData?.lifetimeSpent ?? 0
  const planLimit = tokenData?.planLimit ?? 1000
  const loginStreak = gamData?.streak?.loginStreak ?? 0
  const buildStreak = gamData?.streak?.buildStreak ?? 0
  const xp = gamData?.xp?.totalXp ?? 0

  // Fake sparkline: last 7 days of token usage (mock trend)
  const sparkData = [80, 120, 95, 200, 160, 240, balance]

  // 7-day streak calendar
  const streakDays = gamData?.streak?.streakDays ?? [true, true, true, false, true, true, true]
  const nextMilestone = Math.ceil(loginStreak / 7) * 7

  return (
    <>
      {/* ─── Post-onboarding contextual tooltips ──────────────────────────── */}
      <OnboardingTooltips />

      {/* ─── Cmd+K Search overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-32 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0D1231] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                  placeholder="Search projects, templates, commands..."
                />
                <kbd className="text-xs text-gray-600 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
              </div>
              <div className="p-2">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${a.color}15`, color: a.color }}>
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-sm text-white group-hover:text-[#FFB81C] transition-colors">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.description}</p>
                    </div>
                    <kbd className="ml-auto text-xs text-gray-600 border border-white/10 rounded px-1.5 py-0.5">{a.shortcut}</kbd>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Welcome ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, {firstName || 'Builder'} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {loginStreak > 0
              ? `Day ${loginStreak} streak — keep the momentum going.`
              : "What are you building today?"}
          </p>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 bg-[#0D1231] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 hover:border-white/20 hover:text-white transition-colors group"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Search</span>
          <kbd className="hidden sm:flex items-center gap-0.5 text-xs border border-white/10 rounded px-1 py-0.5 text-gray-600 group-hover:border-white/20 transition-colors">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </motion.div>

      {/* ─── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Total Builds"
          value="14"
          numericValue={14}
          trend="+3 this week"
          delay={0.05}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          }
        />
        <StatCard
          label="Tokens Used"
          value={lifetimeSpent > 0 ? lifetimeSpent.toLocaleString() : '2,480'}
          numericValue={lifetimeSpent > 0 ? lifetimeSpent : 2480}
          trend="This month"
          delay={0.1}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
        />
        <StatCard
          label="Marketplace Revenue"
          value="$42.97"
          trend="+$14.99 today"
          delay={0.15}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
      </div>

      {/* ─── Quick action cards ────────────────────────────────────────────── */}
      <div data-tour="quick-actions" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
          >
            <Link
              href={action.href}
              onClick={() => track('feature_discovery', { featureName: action.label, page: '/dashboard' })}
              className="group relative block bg-[#0D1231] border border-white/10 rounded-xl p-4 overflow-hidden transition-all duration-200 hover:border-[#FFB81C]/40 hover:shadow-[0_0_20px_rgba(255,184,28,0.08)]"
            >
              {/* Gold glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                style={{ background: `radial-gradient(ellipse at top left, ${action.color}08 0%, transparent 70%)` }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110"
                style={{ background: `${action.color}15`, border: `1px solid ${action.color}30`, color: action.color }}
              >
                {action.icon}
              </div>
              <p className="text-white text-sm font-semibold group-hover:text-[#FFB81C] transition-colors relative z-10">
                {action.label}
              </p>
              <p className="text-gray-500 text-xs mt-0.5 relative z-10">{action.description}</p>
              <kbd
                className="absolute bottom-3 right-3 text-xs text-gray-600 border border-white/8 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {action.shortcut}
              </kbd>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ─── Widgets row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

        {/* Enhanced Token Balance */}
        {tokenLoading ? (
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 animate-pulse">
            <SkeletonBlock className="h-3 w-28 mb-4" />
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <SkeletonBlock className="h-8 w-24 mb-2" />
                <SkeletonBlock className="h-3 w-16 mb-4" />
                <SkeletonBlock className="h-7 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            data-tour="token-balance"
            className="bg-[#0D1231] border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Token Balance</p>
              <span className="text-xs text-gray-500">{subscription || 'FREE'}</span>
            </div>
            <div className="flex items-center gap-4">
              <TokenRing balance={balance} limit={planLimit} />
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold text-[#FFB81C]">
                  <AnimatedCounter value={balance} />
                </p>
                <p className="text-gray-500 text-xs mt-0.5">of {planLimit.toLocaleString()} remaining</p>
                <div className="mt-2">
                  <Sparkline data={sparkData} />
                </div>
              </div>
            </div>
            <Link
              href="/tokens"
              className="mt-3 w-full flex items-center justify-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 hover:bg-[#FFB81C]/20 text-[#FFB81C] text-sm font-medium rounded-lg py-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Buy more tokens
            </Link>
          </motion.div>
        )}

        {/* Enhanced Streak Widget */}
        {gamLoading ? (
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 animate-pulse">
            <SkeletonBlock className="h-3 w-28 mb-4" />
            <SkeletonBlock className="h-10 w-32 mb-4" />
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonBlock key={i} className="flex-1 h-7 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            data-tour="streak-widget"
            className="bg-[#0D1231] border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Streak</p>
              {buildStreak > 0 && (
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                  <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="text-blue-400 text-xs font-bold">{buildStreak}d build</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="text-3xl"
              >
                🔥
              </motion.div>
              <div>
                <p className="text-3xl font-bold text-white">{loginStreak}</p>
                <p className="text-xs text-gray-500">day streak</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Next milestone</p>
                <p className="text-sm font-semibold text-[#FFB81C]">{nextMilestone} days</p>
              </div>
            </div>

            {/* 7-day calendar */}
            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-600">{day}</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className={`w-full aspect-square rounded-md flex items-center justify-center text-xs transition-colors ${
                      streakDays[i]
                        ? 'bg-[#FFB81C]/20 border border-[#FFB81C]/30 text-[#FFB81C]'
                        : 'bg-white/5 border border-white/8 text-gray-600'
                    }`}
                  >
                    {streakDays[i] ? '✓' : '·'}
                  </motion.div>
                </div>
              ))}
            </div>

            {xp > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">{xp.toLocaleString()} XP earned</span>
                <Link href="/achievements" className="text-xs text-[#FFB81C] hover:underline">
                  View achievements →
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Plan / Subscription widget */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="bg-[#0D1231] border border-white/10 rounded-xl p-4 flex flex-col"
        >
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Current Plan</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{subscription || 'FREE'}</p>
              <p className="text-xs text-gray-500">Active plan</p>
            </div>
          </div>
          <div className="mt-auto space-y-2">
            <Link
              href="/billing"
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-white text-sm font-medium rounded-lg py-2 transition-colors"
            >
              Manage billing
            </Link>
            <Link
              href="/billing"
              className="w-full flex items-center justify-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 hover:bg-[#FFB81C]/20 text-[#FFB81C] text-sm font-medium rounded-lg py-2 transition-colors"
            >
              Upgrade plan
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ─── Two-column: Projects + Activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Projects (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-[#FFB81C] hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PROJECTS.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
                whileHover={{ y: -2 }}
                className="group bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className={`h-32 bg-gradient-to-br ${project.gradient} relative overflow-hidden flex items-center justify-center`}>
                  <div className="text-5xl opacity-20">🎮</div>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(10,14,39,0.6)_100%)]" />
                  <div className={`absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white font-semibold text-sm group-hover:text-[#FFB81C] transition-colors">
                    {project.name}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-500">{project.lastEdited}</span>
                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/8">
                      {project.buildType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs text-[#FFB81C]">⚡</span>
                    <span className="text-xs text-gray-500">{project.tokensUsed} tokens</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* New project card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.41, duration: 0.35 }}
              whileHover={{ y: -2 }}
            >
              <Link
                href="/projects/new"
                className="group block bg-[#0D1231] border border-dashed border-white/15 rounded-xl h-full min-h-[180px] flex flex-col items-center justify-center hover:border-[#FFB81C]/40 hover:bg-[#FFB81C]/[0.02] transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#FFB81C]/10 flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110">
                  <svg className="w-6 h-6 text-gray-500 group-hover:text-[#FFB81C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <p className="text-gray-500 group-hover:text-[#FFB81C] text-sm font-medium transition-colors">
                  New Project
                </p>
                <p className="text-gray-600 text-xs mt-1">Start from scratch</p>
              </Link>
            </motion.div>
          </div>

          {/* Empty state (shown when no projects) */}
          {/* Uncomment to test: */}
          {/* <div className="text-center py-16 bg-[#0D1231] border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4 opacity-30">🎮</div>
            <p className="text-white font-semibold">No projects yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first project to get started</p>
            <Link href="/projects/new" className="inline-flex items-center gap-2 mt-4 bg-[#FFB81C]/10 border border-[#FFB81C]/20 text-[#FFB81C] text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#FFB81C]/20 transition-colors">
              + New Project
            </Link>
          </div> */}
        </div>

        {/* Activity Feed (1/3 width) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Activity</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {DEMO_ACTIVITY.map((event, idx) => (
                  <motion.div
                    key={event.id ?? idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.06, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    {ACTION_ICONS[event.action] ?? (
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">⚡</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-snug">{event.description}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{timeAgo(event.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {DEMO_ACTIVITY.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="text-4xl mb-3 opacity-20">📭</div>
                <p className="text-gray-500 text-sm font-medium">No activity yet</p>
                <p className="text-gray-600 text-xs mt-1">Actions will appear here</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ─── Keyboard shortcut hint (bottom) ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-gray-700">
          Press{' '}
          <kbd className="text-gray-500 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
          {' '}to search &nbsp;·&nbsp;{' '}
          <kbd className="text-gray-500 border border-white/10 rounded px-1.5 py-0.5">⌘N</kbd>
          {' '}new project
        </p>
      </motion.div>
    </>
  )
}
