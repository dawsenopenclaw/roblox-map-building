import type { Metadata } from 'next'
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

const CATEGORY_COLOR: Record<string, string> = {
  Announcement: 'text-[#FFB81C] bg-[#FFB81C]/10',
  'Deep Dive': 'text-purple-400 bg-purple-400/10',
  Tutorial: 'text-blue-400 bg-blue-400/10',
}

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>
      {/* Hero */}
      <section
        className="relative border-b border-white/[0.06] px-6 pt-32 pb-16 text-center overflow-hidden"
        style={{ background: '#0A0E27' }}
      >
        {/* Radial gold glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(255,184,28,0.10) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#FFB81C]">
            Blog
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Ideas, tutorials, updates
          </h1>
          <p className="mx-auto max-w-md text-base text-white/45">
            Deep dives on AI game development, product announcements, and tutorials from the
            ForjeGames team.
          </p>
        </div>
      </section>

      {/* Post cards */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-col gap-6">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 rounded-2xl p-7 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:[border-color:rgba(255,184,28,0.25)] sm:flex-row"
              style={{
                background: '#0F1535',
                border: '1px solid #1A2550',
              }}
            >
              {/* Category dot */}
              <div className="hidden h-2 w-2 shrink-0 translate-y-2.5 rounded-full bg-[#FFB81C] sm:block" />

              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CATEGORY_COLOR[post.category]}`}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-white/25">{post.date}</span>
                  <span className="text-xs text-white/25">{post.readTime}</span>
                </div>

                <h2 className="mb-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-[#FFB81C]">
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/45">{post.excerpt}</p>

                <div className="mt-4 text-xs font-medium text-[#FFB81C]/50 transition-colors group-hover:text-[#FFB81C]">
                  Read article →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{ background: '#0F1535', border: '1px solid #1A2550' }}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#FFB81C]">
            Newsletter
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Stay in the loop</h2>
          <p className="mb-6 text-sm text-white/45">
            Get notified when we publish new tutorials and product updates.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:ring-2 focus:ring-[#FFB81C]/40"
              style={{
                background: '#060B1E',
                border: '1px solid #1A2550',
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: '#FFB81C' }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
