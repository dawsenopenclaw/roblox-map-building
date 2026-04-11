'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Sparkles,
  PlayCircle,
  Image as ImageIcon,
  Wand2,
  PenTool,
  Cpu,
  Zap,
  Cloud,
  Bell,
  ShieldCheck,
  GitBranch,
  Plug,
  Coins,
  LayoutDashboard,
  History,
  BellRing,
  Brain,
  Flag,
  UserCheck,
  Users,
  ShieldAlert,
  Eye,
  Lock,
  Languages,
  Film,
  Smartphone,
  Ticket,
  BookOpen,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

import { formatChangelogDate, type ChangelogEntry } from '@/lib/changelog-data'

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  PlayCircle,
  Image: ImageIcon,
  Wand2,
  PenTool,
  Cpu,
  Zap,
  Cloud,
  Bell,
  ShieldCheck,
  GitBranch,
  Plug,
  Coins,
  LayoutDashboard,
  History,
  BellRing,
  Brain,
  Flag,
  UserCheck,
  Users,
  ShieldAlert,
  Eye,
  Lock,
  Languages,
  Film,
  Smartphone,
  Ticket,
  BookOpen,
}

const CATEGORY_META: Record<
  ChangelogEntry['category'],
  { color: string; bg: string; border: string }
> = {
  AI:          { color: '#D4AF37', bg: 'rgba(212,175,55,0.08)',  border: 'rgba(212,175,55,0.22)' },
  Editor:      { color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.22)' },
  'Real-time': { color: '#34D399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.22)' },
  Marketplace: { color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.22)' },
  Payments:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)' },
  Growth:      { color: '#EC4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.22)' },
  Security:    { color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)' },
  Plugin:      { color: '#22D3EE', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.22)' },
  Marketing:   { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)' },
}

const BADGE_META: Record<NonNullable<ChangelogEntry['badge']>, { color: string; bg: string; border: string }> = {
  New:      { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.28)' },
  Improved: { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.28)' },
  Security: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.28)' },
}

interface ChangelogCardProps {
  entry: ChangelogEntry
}

export function ChangelogCard({ entry }: ChangelogCardProps) {
  const [expanded, setExpanded] = useState(false)

  const cat = CATEGORY_META[entry.category]
  const Icon = (entry.icon && ICON_MAP[entry.icon]) || CircleDot
  const badge = entry.badge ? BADGE_META[entry.badge] : null

  return (
    <article
      className="group relative flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
      }}
    >
      {/* Header row: icon + badges */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
          aria-hidden="true"
        >
          <Icon size={20} style={{ color: cat.color }} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
          >
            {entry.category}
          </span>
          {badge && (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
            >
              {entry.badge}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold leading-snug text-white">
        {entry.title}
      </h3>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">
        {entry.description}
      </p>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] rounded"
        aria-expanded={expanded}
        aria-controls={`changelog-details-${entry.id}`}
      >
        <span>{expanded ? 'Hide details' : 'Show details'}</span>
        <ChevronDown
          size={14}
          className="transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        />
      </button>

      {/* Details */}
      {expanded && (
        <div
          id={`changelog-details-${entry.id}`}
          className="mt-4 rounded-xl p-4"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <ul className="flex flex-col gap-2">
            {entry.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <span
                  className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full"
                  style={{ background: cat.color }}
                  aria-hidden="true"
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          {entry.docsHref && (
            <Link
              href={entry.docsHref}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
              style={{ color: cat.color }}
            >
              Read the docs
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      )}

      {/* Footer: date + inspired by */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <time className="text-[11px] font-medium text-zinc-500" dateTime={entry.date}>
          {formatChangelogDate(entry.date)}
        </time>
        {entry.inspiredBy && entry.inspiredBy.length > 0 && (
          <span className="text-[11px] text-zinc-500">
            Inspired by{' '}
            <span className="font-medium text-zinc-400">
              {entry.inspiredBy.join(', ')}
            </span>
          </span>
        )}
      </div>
    </article>
  )
}
