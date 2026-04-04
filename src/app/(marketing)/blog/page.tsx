import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Blog',
  description:
    'Tutorials, product news, and deep dives on AI-powered Roblox game development. Written by the ForjeGames team.',
  path: '/blog',
  keywords: ['Roblox AI blog', 'game development tutorials', 'ForjeGames news', 'Roblox tips'],
})

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

const POSTS: Post[] = [
  {
    slug: 'forjegames-launch',
    title: 'Introducing ForjeGames: AI-Powered Roblox Development',
    excerpt:
      'Today we are officially launching ForjeGames — the platform that lets any creator describe a Roblox game in plain English and watch it get built in real time.',
    date: 'March 29, 2026',
    readTime: '5 min read',
    category: 'Announcement',
  },
  {
    slug: 'building-roblox-games-with-ai',
    title: 'How AI is Changing Roblox Game Development',
    excerpt:
      'The 100,000-game problem: most Roblox creators have ideas but get stuck on scripting, terrain, and polish. Here is how AI agents are changing the equation.',
    date: 'March 29, 2026',
    readTime: '8 min read',
    category: 'Deep Dive',
  },
  {
    slug: 'voice-to-game-tutorial',
    title: 'Voice to Game: Build Without Typing',
    excerpt:
      'Step-by-step guide to using ForjeGames Voice Commands. Click the mic, speak your idea, watch it appear in the 3D preview. No keyboard required.',
    date: 'March 29, 2026',
    readTime: '6 min read',
    category: 'Tutorial',
  },
]

const CATEGORIES = ['All', 'Announcement', 'Deep Dive', 'Tutorial']

const CATEGORY_META: Record<string, { bg: string; color: string; border: string }> = {
  Announcement: { bg: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: 'rgba(212,175,55,0.2)' },
  'Deep Dive':  { bg: 'rgba(168,85,247,0.08)', color: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  Tutorial:     { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
}

// Category pill icons (SVG)
const CATEGORY_ICONS: Record<string, ReactNode> = {
  Announcement: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.01c0-2.21-4.03-4-9-4S4 5.8 4 8.01c0 .95.58 1.84 1.58 2.56L5 14l3.24-1.62C9.35 12.77 10.65 13 12 13c4.97 0 9-1.79 9-4z"/>
      <path d="M4 13c0 2.21 4.03 4 9 4 1.35 0 2.65-.23 3.76-.62L20 18l-.58-3.43C20.42 13.85 21 12.96 21 12"/>
    </svg>
  ),
  'Deep Dive': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Tutorial: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
}

const [featured, ...rest] = POSTS

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b px-6 pb-16 pt-32 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0A0E27' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,55,0.10) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <p
            className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            Blog
          </p>
          <h1
            className="mb-4 font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            Ideas, tutorials, updates
          </h1>
          <p className="mx-auto max-w-md text-base" style={{ color: '#71717A' }}>
            Deep dives on AI game development, product announcements, and tutorials from the
            ForjeGames team.
          </p>

          {/* Category filter pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const isAll = cat === 'All'
              const meta = isAll ? null : CATEGORY_META[cat]
              return (
                <span
                  key={cat}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={
                    isAll
                      ? {
                          background: 'rgba(212,175,55,0.1)',
                          color: '#D4AF37',
                          borderColor: 'rgba(212,175,55,0.3)',
                        }
                      : {
                          background: meta?.bg ?? 'rgba(255,255,255,0.04)',
                          color: meta?.color ?? '#71717A',
                          borderColor: meta?.border ?? 'rgba(255,255,255,0.1)',
                        }
                  }
                >
                  {!isAll && CATEGORY_ICONS[cat]}
                  {cat}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured post ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pt-14">
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-2xl p-8 transition-all duration-200 sm:p-10 card-hover"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Top row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {(() => {
                const meta = CATEGORY_META[featured.category]
                return (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                  >
                    {CATEGORY_ICONS[featured.category]}
                    {featured.category}
                  </span>
                )
              })()}
              <span className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.2)' }}>
                Featured
              </span>
              <span className="text-xs" style={{ color: '#52525B' }}>{featured.date}</span>
              <span className="text-xs" style={{ color: '#52525B' }}>{featured.readTime}</span>
            </div>

            <h2
              className="mb-3 font-bold tracking-tight transition-colors group-hover:text-[#D4AF37]"
              style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', lineHeight: 1.15, color: '#FAFAFA' }}
            >
              {featured.title}
            </h2>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed" style={{ color: '#71717A' }}>
              {featured.excerpt}
            </p>

            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              Read article
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        )}
      </section>

      {/* ── Remaining posts grid ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {rest.map((post) => {
            const meta = CATEGORY_META[post.category]
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 card-hover"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                  >
                    {CATEGORY_ICONS[post.category]}
                    {post.category}
                  </span>
                  <span className="text-xs" style={{ color: '#52525B' }}>{post.readTime}</span>
                </div>

                <h2 className="mb-2 flex-1 text-base font-semibold leading-snug transition-colors group-hover:text-[#D4AF37]" style={{ color: '#FAFAFA' }}>
                  {post.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  {post.excerpt}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#52525B' }}>{post.date}</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors group-hover:text-[#D4AF37]"
                    style={{ color: 'rgba(212,175,55,0.5)' }}
                  >
                    Read
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(212,175,55,0.05) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm">
              <p
                className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'rgba(212,175,55,0.6)' }}
              >
                Newsletter
              </p>
              <h2 className="mb-1.5 text-xl font-bold" style={{ color: '#FAFAFA' }}>
                Stay in the loop
              </h2>
              <p className="text-sm" style={{ color: '#71717A' }}>
                New tutorials and product updates — delivered when they ship.
              </p>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FAFAFA',
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                  color: '#09090b',
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
