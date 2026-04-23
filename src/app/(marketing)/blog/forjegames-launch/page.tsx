import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Introducing ForjeGames: AI-Powered Roblox Development',
  description:
    'ForjeGames is officially live. Describe any Roblox game in plain English and watch 200+ AI agents build it in real time — terrain, scripts, assets, and all.',
  path: '/blog/forjegames-launch',
  keywords: ['ForjeGames launch', 'AI Roblox builder', 'Roblox game development platform'],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Introducing ForjeGames: AI-Powered Roblox Development',
  datePublished: '2026-03-29',
  url: 'https://forjegames.com/blog/forjegames-launch',
  author: { '@type': 'Person', name: 'Dawsen Porter' },
  publisher: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    logo: { '@type': 'ImageObject', url: 'https://forjegames.com/logo.png', width: 400, height: 400 },
  },
  description:
    'ForjeGames is officially live. Describe any Roblox game in plain English and watch 200+ AI agents build it in real time — terrain, scripts, assets, and all.',
  isPartOf: { '@type': 'WebSite', name: 'ForjeGames', url: 'https://forjegames.com' },
}

export default function LaunchBlogPost() {
  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Breadcrumb */}
      <div className="border-b border-white/5 px-6 py-3 text-xs text-white/30">
        <Link href="/blog" className="hover:text-[#D4AF37]">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-white/60">Announcement</span>
      </div>

      <article className="mx-auto max-w-2xl px-6 py-20">
        {/* Meta */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
            Announcement
          </span>
          <span className="text-xs text-white/30">March 29, 2026</span>
          <span className="text-xs text-white/30">5 min read</span>
          <span className="text-xs text-white/30">By Dawsen Porter</span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Introducing ForjeGames: AI-Powered Roblox Development
        </h1>

        <p className="mb-8 text-lg leading-relaxed text-white/55">
          Today we are officially launching ForjeGames — the platform that lets any creator describe
          a Roblox game in plain English and watch it get built in real time.
        </p>

        {/* Divider */}
        <div className="mb-10 h-px bg-white/5" />

        {/* Body */}
        <div className="prose-custom space-y-6 text-base leading-relaxed text-white/60">
          <p>
            Building a Roblox game is hard. Not because of ideas — creators have endless ideas. It
            is hard because of the technical gap between &ldquo;I want a zombie survival map with
            fog and five safe zones&rdquo; and the hours of Lua scripting, terrain editing, and
            asset sourcing that sentence actually represents.
          </p>

          <p>
            ForjeGames closes that gap. You describe what you want. Our 200+ AI agents — each
            specialized for a different part of game development — collaborate to build it. Terrain
            agent handles the map. Scripting agent writes the Luau. Economy agent balances the
            numbers. NPC agent writes the dialogue. All working in parallel, all streaming into your
            editor in real time.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">What ships today</h2>

          <p>
            ForjeGames v1.0.0 launches with the full platform:
          </p>

          <ul className="space-y-2 pl-5 list-disc marker:text-[#D4AF37]">
            <li>
              <strong className="text-white">AI Chat Editor</strong> — 50/50 split pane with live 3D
              preview. Type a prompt, watch the map update in real time.
            </li>
            <li>
              <strong className="text-white">55 AI Agents</strong> — terrain, scripting, NPC, economy,
              audio, VFX, lighting, and more. Each is fine-tuned for its domain.
            </li>
            <li>
              <strong className="text-white">Voice Commands</strong> — click the mic, speak your idea.
              No typing required.
            </li>
            <li>
              <strong className="text-white">Image to Map</strong> — upload a sketch and receive a fully
              built Roblox map. Powered by Claude Vision, Depth Pro, and SAM2.
            </li>
            <li>
              <strong className="text-white">Studio Plugin</strong> — sync AI output directly into
              Roblox Studio. No copy-paste.
            </li>
            <li>
              <strong className="text-white">Marketplace Browser</strong> — search and insert 500K+
              Roblox assets without leaving the editor.
            </li>
            <li>
              <strong className="text-white">One-click Publish</strong> — push directly to Roblox via
              Open Cloud API. Live in seconds.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Who it is for</h2>

          <p>
            ForjeGames is built for three types of creators:
          </p>

          <p>
            <strong className="text-white">Beginners</strong> who have never touched Studio and would not
            know where to start. ForjeGames gives them a working game on day one.
          </p>

          <p>
            <strong className="text-white">Intermediate creators</strong> who know Studio but spend most of
            their time on repetitive tasks — scripting leaderboards, building terrain, sourcing assets.
            ForjeGames handles the repetitive parts so they can focus on what makes their game unique.
          </p>

          <p>
            <strong className="text-white">Studios</strong> who want to prototype faster. Instead of a
            developer spending a week on a proof-of-concept, ForjeGames can ship it in an hour.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">Pricing</h2>

          <p>
            ForjeGames is free to start. Starter plan: 50 AI tokens per day, enough to explore the
            platform and ship small projects. Pro is $29/month for 2,000 tokens per day. Studio is
            $79/month for 10,000 tokens and full access to 3D generation and texture synthesis.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-4">What is next</h2>

          <p>
            We are shipping fast. On the near-term roadmap: a mobile companion app, a multiplayer
            co-building mode, a template marketplace where creators can sell their AI-built game
            templates, and deeper Roblox Open Cloud integration for analytics and in-game economy
            management.
          </p>

          <p>
            If you have ideas, feedback, or run into anything rough around the edges, join the Discord
            or email support@forjegames.com. We read every message.
          </p>

          <p className="text-white font-medium">
            Let&apos;s build something. &mdash; Dawsen
          </p>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/editor"
            className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e5c547]"
          >
            Open the editor →
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
          >
            ← Back to blog
          </Link>
        </div>
      </article>
    </div>
    </>
  )
}
