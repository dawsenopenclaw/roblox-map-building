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
  Announcement: 'text-[#D4AF37] bg-[#D4AF37]/10',
  'Deep Dive': 'text-purple-400 bg-purple-400/10',
  Tutorial: 'text-blue-400 bg-blue-400/10',
}

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-20 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          Blog
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Ideas, tutorials, updates
        </h1>
        <p className="mx-auto max-w-md text-base text-white/45">
          Deep dives on AI game development, product announcements, and tutorials from the
          ForjeGames team.
        </p>
      </section>

      {/* Post cards */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-col gap-6">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#141414] p-7 transition-all hover:border-[#D4AF37]/25 hover:bg-[#1a1a1a] sm:flex-row"
            >
              {/* Category dot */}
              <div className="hidden h-2 w-2 shrink-0 translate-y-2.5 rounded-full bg-[#D4AF37] sm:block" />

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

                <h2 className="mb-2 text-lg font-semibold leading-snug text-white group-hover:text-[#D4AF37] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/45">{post.excerpt}</p>

                <div className="mt-4 text-xs font-medium text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors">
                  Read article →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
