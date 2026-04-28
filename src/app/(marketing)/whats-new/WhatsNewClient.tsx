'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Rocket,
  Users,
  Mic,
  Clapperboard,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

import {
  CHANGELOG,
  COMING_SOON,
  RELEASE_META,
  countByCategory,
} from '@/lib/changelog-data'
import { ChangelogCard } from '@/components/marketing/ChangelogCard'
import { ChangelogFilter, type FilterValue } from '@/components/marketing/ChangelogFilter'
import { ShareButtons } from '@/components/ShareButtons'

const COMING_SOON_ICONS: Record<string, LucideIcon> = {
  Users,
  Rocket,
  Mic,
  Clapperboard,
}

const PAGE_URL = 'https://forjegames.com/whats-new'
const SHARE_TEXT =
  'ForjeGames 3.0 just shipped 34 features — in-plugin AI chat, MCP integration, API keys, 3-8x build quality, and 10 new AI specialists:'

export function WhatsNewClient() {
  const [filter, setFilter] = useState<FilterValue>('All')

  const counts = useMemo(
    () => countByCategory(CHANGELOG) as Record<FilterValue, number>,
    [],
  )

  const filtered = useMemo(() => {
    if (filter === 'All') return CHANGELOG
    return CHANGELOG.filter((e) => e.category === filter)
  }, [filter])

  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b px-6 pb-24 pt-28 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Ambient gold glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 60%)',
          }}
        />
        {/* Faint starfield */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35), transparent)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Eyebrow pill */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
            style={{
              background: 'rgba(212,175,55,0.08)',
              borderColor: 'rgba(212,175,55,0.25)',
              color: '#D4AF37',
            }}
          >
            <Sparkles size={12} aria-hidden="true" />
            <span>{RELEASE_META.releaseDate} release</span>
          </div>

          {/* Headline */}
          <h1
            className="mb-5 font-bold tracking-tight"
            style={{
              fontSize: 'clamp(2.25rem, 6vw, 4.25rem)',
              lineHeight: 1.05,
              color: '#FAFAFA',
            }}
          >
            <span style={{ color: '#D4AF37' }}>ForjeGames 3.0</span>
            <br />
            34 features — plugin AI chat, MCP, and more
          </h1>

          {/* Subhero */}
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Build from inside Studio, connect from Claude Code or Cursor, generate API keys, and enjoy 3-8x more detailed builds. Everything shipped today.
          </p>

          {/* Stats strip */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3 sm:gap-0">
            <StatPill value={RELEASE_META.stats.linesOfCode} label="lines of new code" />
            <Divider />
            <StatPill value={`${RELEASE_META.stats.featureCount}`} label="features shipped" />
            <Divider />
            <StatPill
              value={`${RELEASE_META.stats.vulnerabilityCount}`}
              label="security vulnerabilities"
            />
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                boxShadow: '0 0 28px rgba(212,175,55,0.4)',
              }}
            >
              Get started free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              See pricing
            </Link>
          </div>

          {/* Share */}
          <div className="mt-8 flex items-center justify-center">
            <ShareButtons url={PAGE_URL} text={SHARE_TEXT} compact />
          </div>
        </div>
      </section>

      {/* ── Filter + Grid ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'rgba(212,175,55,0.7)' }}
          >
            The full list
          </p>
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Every feature we shipped
          </h2>
          <p className="mx-auto max-w-xl text-sm text-zinc-500">
            Filter by category to explore what matters most to you. Click any
            card to see the details.
          </p>
        </div>

        <div className="mb-10">
          <ChangelogFilter active={filter} counts={counts} onChange={setFilter} />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
            >
              <ChangelogCard entry={entry} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">
            No features in this category yet.
          </p>
        )}
      </section>

      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <section
        className="border-t px-6 py-20"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p
              className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'rgba(96,165,250,0.7)' }}
            >
              What is next
            </p>
            <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              Coming soon
            </h2>
            <p className="mx-auto max-w-xl text-sm text-zinc-500">
              The next wave of features already in active development. Join the
              beta program to try them first.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMING_SOON.map((item, i) => {
              const Icon = COMING_SOON_ICONS[item.icon] || Rocket
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-4 rounded-2xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'rgba(96,165,250,0.08)',
                      border: '1px solid rgba(96,165,250,0.22)',
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} style={{ color: '#60A5FA' }} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {item.title}
                      </h3>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: 'rgba(96,165,250,0.08)',
                          borderColor: 'rgba(96,165,250,0.22)',
                          color: '#60A5FA',
                        }}
                      >
                        {item.eta}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/beta/invite"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Join the beta program
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t px-6 py-24 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(212,175,55,0.1) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to build your next game in minutes?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-zinc-400">
            Every feature above is live right now, on every plan — including
            the free tier. Jump into the editor and start shipping.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                boxShadow: '0 0 28px rgba(212,175,55,0.4)',
              }}
            >
              Get started free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Read the docs
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <ShareButtons url={PAGE_URL} text={SHARE_TEXT} compact />
          </div>
        </div>
      </section>
    </div>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-5">
      <span className="text-2xl font-bold text-white sm:text-3xl">{value}</span>
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="hidden h-8 w-px sm:block"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    />
  )
}
