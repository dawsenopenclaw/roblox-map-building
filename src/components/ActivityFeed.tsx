'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType = 'build' | 'achievement' | 'sale' | 'team' | 'system'

export interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  timestamp: string
  href?: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ActivityType, { dot: string; bg: string; icon: React.ReactNode }> = {
  build: {
    dot: 'bg-blue-400',
    bg: 'bg-blue-400/10',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  achievement: {
    dot: 'bg-[#D4AF37]',
    bg: 'bg-[#D4AF37]/10',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  sale: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-400/10',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  team: {
    dot: 'bg-purple-400',
    bg: 'bg-purple-400/10',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  system: {
    dot: 'bg-gray-400',
    bg: 'bg-gray-400/10',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

const ICON_COLOR: Record<ActivityType, string> = {
  build: 'text-blue-400',
  achievement: 'text-[#D4AF37]',
  sale: 'text-emerald-400',
  team: 'text-purple-400',
  system: 'text-gray-400',
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Default demo items ───────────────────────────────────────────────────────

const now = Date.now()
const mins = (n: number) => new Date(now - n * 60_000).toISOString()
const hrs  = (n: number) => new Date(now - n * 3_600_000).toISOString()
const days = (n: number) => new Date(now - n * 86_400_000).toISOString()

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'build',       description: 'Generated "Volcanic Island Arena" — 47 assets placed in 12s', timestamp: mins(3),  href: '/voice' },
  { id: 'a2', type: 'achievement', description: 'Unlocked Speed Builder — 5 maps in 24h. +250 XP',             timestamp: hrs(2),   href: '/settings/profile' },
  { id: 'a3', type: 'sale',        description: '"Medieval Castle Kit" sold to 3 buyers. +1,200 tokens',        timestamp: hrs(5),   href: '/marketplace' },
  { id: 'a4', type: 'build',       description: 'Generated "Sky Kingdom Simulator" — 91 assets placed',         timestamp: hrs(8),   href: '/voice' },
  { id: 'a5', type: 'team',        description: 'Alex (Nova Studios) invited you to collaborate on their RPG',  timestamp: days(1),  href: '/settings' },
  { id: 'a6', type: 'achievement', description: 'Unlocked Marketplace Debut — first asset published. +100 XP',  timestamp: days(1),  href: '/settings/profile' },
  { id: 'a7', type: 'sale',        description: '"Sci-Fi Corridor Pack" downloaded 12 times this week',         timestamp: days(2),  href: '/marketplace' },
  { id: 'a8', type: 'build',       description: 'Generated "Fantasy Forest Village" — 63 assets placed',        timestamp: days(2),  href: '/voice' },
  { id: 'a9', type: 'system',      description: 'Token balance fell below 50 — upgrade to continue building',   timestamp: days(3),  href: '/billing' },
  { id: 'a10',type: 'build',       description: 'Generated "Neon City Tycoon" — 128 assets placed in 18s',      timestamp: days(4),  href: '/voice' },
]

const PAGE_SIZE = 5

// ─── Single item ──────────────────────────────────────────────────────────────

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const cfg = TYPE_CONFIG[item.type]

  const inner = (
    <div className={`group flex gap-3 py-3 transition-colors ${item.href ? 'cursor-pointer hover:bg-white/[0.02] rounded-lg px-2 -mx-2' : ''}`}>
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center ${ICON_COLOR[item.type]}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/[0.07] mt-1.5" aria-hidden="true" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <p className={`text-sm leading-snug ${item.href ? 'text-gray-200 group-hover:text-white' : 'text-gray-300'} transition-colors`}>
          {item.description}
        </p>
        <p className="text-xs text-gray-500 mt-1">{relativeTime(item.timestamp)}</p>
      </div>
    </div>
  )

  if (item.href) {
    return (
      <a href={item.href} className="block no-underline" aria-label={item.description}>
        {inner}
      </a>
    )
  }
  return <div>{inner}</div>
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ActivityFeedProps {
  items?: ActivityItem[]
  className?: string
}

export function ActivityFeed({ items = DEMO_ACTIVITY, className = '' }: ActivityFeedProps) {
  const [page, setPage] = useState(1)
  const visible = items.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < items.length

  return (
    <section className={`${className}`} aria-label="Activity feed">
      <div className="space-y-0">
        {visible.map((item, i) => (
          <ActivityRow key={item.id} item={item} isLast={i === visible.length - 1} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-3 w-full py-2 text-xs font-medium text-gray-400 hover:text-[#D4AF37] border border-white/[0.07] hover:border-[#D4AF37]/30 rounded-lg transition-all duration-150 bg-white/[0.02] hover:bg-[#D4AF37]/[0.04]"
        >
          Load more
        </button>
      )}

      {!hasMore && items.length > PAGE_SIZE && (
        <p className="mt-3 text-center text-xs text-gray-600">All activity loaded</p>
      )}
    </section>
  )
}
