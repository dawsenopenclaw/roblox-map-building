import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'About',
  description:
    'ForjeGames is an AI-powered Roblox game development platform built by Dawsen Porter. Our mission: make game creation accessible to everyone.',
  path: '/about',
  keywords: ['ForjeGames company', 'Roblox AI platform', 'Dawsen Porter', 'ForjeGames LLC'],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    url: 'https://forjegames.com',
    founder: { '@type': 'Person', name: 'Dawsen Porter' },
    foundingDate: '2026',
    description: 'AI-powered Roblox game development platform.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@forjegames.com',
      contactType: 'customer support',
    },
  },
})

const STATS = [
  { value: '55', label: 'AI Agents', sub: 'Specialized for every game system' },
  { value: '500K+', label: 'Marketplace Assets', sub: 'Verified Roblox-ready assets' },
  { value: '5', label: 'AI Models', sub: 'Claude, Meshy, Fal, Flux, Depth Pro' },
  { value: '10 min', label: 'Time to First Map', sub: 'From sign-up to published game' },
]

const TIMELINE = [
  {
    date: 'Jan 2026',
    event: 'Idea & prototype',
    detail: 'First proof-of-concept: Claude API generating Luau scripts in a textarea.',
  },
  {
    date: 'Mar 2026',
    event: 'Closed beta',
    detail:
      'Landing page, billing, and basic AI chat shipped to first 50 testers.',
  },
  {
    date: 'Mar 29, 2026',
    event: 'General availability',
    detail:
      '55 agents, Studio Plugin, Voice Commands, Image-to-Map, Game DNA Scanner — all live.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-24 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          About
        </p>
        <h1 className="mx-auto mb-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Make game development accessible to everyone
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-white/50">
          ForjeGames gives any creator — beginner or veteran — the same AI toolkit that
          top studios use. You describe what you want. We build it.
        </p>
      </section>

      {/* Stats */}
      <section className="border-b border-white/5 px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#141414] px-4 py-8 text-center"
            >
              <span className="mb-1 text-3xl font-bold text-[#D4AF37]">{s.value}</span>
              <span className="mb-1 text-sm font-semibold text-white">{s.label}</span>
              <span className="text-xs text-white/35">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="mb-8 text-2xl font-bold">The story</h2>
        <div className="space-y-5 text-base leading-relaxed text-white/55">
          <p>
            ForjeGames was founded by{' '}
            <span className="text-white font-medium">Dawsen Porter</span>, a Roblox developer
            who spent years watching talented creators hit the same wall — not knowing how to
            script, not having hours to learn Studio, not being able to afford a team.
          </p>
          <p>
            The insight was simple: the best Roblox games are built by people who understand
            what players want, not necessarily by people who can write Luau. If AI could handle
            the technical layer — terrain generation, scripting, asset sourcing, lighting — then
            the creator&apos;s job becomes purely creative.
          </p>
          <p>
            ForjeGames LLC was incorporated in 2026 with one goal: build the platform that
            removes every technical barrier between an idea and a published Roblox game.
          </p>
          <p>
            Today, ForjeGames ships with 55 AI agents, voice input, image-to-map, 3D generation,
            a Studio Plugin, and a marketplace browser — all in a single editor. And we&apos;re
            just getting started.
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">Timeline</h2>
          <div className="relative">
            <div className="absolute left-[5px] top-0 h-full w-px bg-white/5" />
            <div className="flex flex-col gap-8">
              {TIMELINE.map((t) => (
                <div key={t.date} className="relative pl-7">
                  <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#D4AF37] bg-[#0a0a0a]" />
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    {t.date}
                  </p>
                  <p className="mb-1 text-base font-semibold text-white">{t.event}</p>
                  <p className="text-sm text-white/45">{t.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:support@forjegames.com"
              className="flex flex-col gap-1 rounded-xl border border-white/5 bg-[#141414] p-5 transition hover:border-[#D4AF37]/30"
            >
              <span className="text-lg text-[#D4AF37]">✉</span>
              <span className="text-sm font-semibold text-white">Support</span>
              <span className="text-xs text-white/40">support@forjegames.com</span>
            </a>
            <a
              href="https://twitter.com/forjegames"
              className="flex flex-col gap-1 rounded-xl border border-white/5 bg-[#141414] p-5 transition hover:border-[#D4AF37]/30"
            >
              <span className="text-lg text-[#D4AF37]">𝕏</span>
              <span className="text-sm font-semibold text-white">Twitter / X</span>
              <span className="text-xs text-white/40">@forjegames</span>
            </a>
            <a
              href="https://discord.gg/forjegames"
              className="flex flex-col gap-1 rounded-xl border border-white/5 bg-[#141414] p-5 transition hover:border-[#D4AF37]/30"
            >
              <span className="text-lg text-[#D4AF37]">◈</span>
              <span className="text-sm font-semibold text-white">Discord</span>
              <span className="text-xs text-white/40">discord.gg/forjegames</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
