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
  { value: '5+', label: 'AI Models', sub: 'Best model for each task, automatically' },
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
    detail: 'Landing page, billing, and basic AI chat shipped to first 50 testers.',
  },
  {
    date: 'Mar 29, 2026',
    event: 'General availability',
    detail:
      '200+ agents, Studio Plugin, Voice Commands, Image-to-Map, Game DNA Scanner — all live.',
  },
]

const VALUES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Speed by default',
    body:
      'A great idea loses momentum every hour it sits unbuilt. ForjeGames removes the technical delay — terrain, scripts, and assets in minutes, not months.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Creator-first, always',
    body:
      'We build for the 13-year-old with a great game idea and zero Luau knowledge. If it needs a tutorial to get started, we shipped the wrong thing.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'The whole game, not half',
    body:
      'Scripts alone don\'t make a game. We build every layer — terrain, 3D assets, UI, economy, and code — so creators never hit a wall mid-project.',
  },
]

const CONTACT = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: 'Support',
    sub: 'support@forjegames.com',
    href: 'mailto:support@forjegames.com',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    label: 'Twitter / X',
    sub: '@forjegames',
    href: 'https://twitter.com/forjegames',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.033.05a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 13.87 13.87 0 0 0 1.197-1.95.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.196 1.95a.077.077 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
    label: 'Discord',
    sub: 'discord.gg/forjegames',
    href: 'https://discord.gg/forjegames',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b px-6 pb-24 pt-32 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#050810' }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(212,175,55,0.10) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p
            className="reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            About ForjeGames
          </p>
          <h1
            className="reveal mb-6 font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            Your idea deserves to{' '}
            <span style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              exist in Roblox
            </span>
          </h1>
          <p className="reveal mx-auto max-w-xl text-base leading-relaxed" style={{ color: '#71717A' }}>
            ForjeGames removes every technical wall between your idea and a published Roblox game.
            Terrain, 3D models, scripts, UI, economy — built by AI, synced to Studio, ready to play.
          </p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="border-b px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="reveal flex flex-col items-center rounded-2xl px-4 py-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span
                className="mb-1 text-3xl font-bold tabular-nums"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {s.value}
              </span>
              <span className="mb-1 text-sm font-semibold" style={{ color: '#FAFAFA' }}>{s.label}</span>
              <span className="text-xs" style={{ color: '#52525B' }}>{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
          Origin
        </p>
        <h2 className="mb-8 text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
          The story
        </h2>
        <div className="space-y-5 text-base leading-relaxed" style={{ color: '#71717A' }}>
          <p>
            ForjeGames was founded by{' '}
            <span className="font-medium" style={{ color: '#FAFAFA' }}>Dawsen Porter</span>, a Roblox
            developer who spent years watching talented creators hit the same wall — not knowing how to
            script, not having hours to learn Studio, not being able to afford a team.
          </p>
          <p>
            The frustration was personal. Great game ideas were dying because the creator didn&apos;t
            know Luau. Imaginative worlds never shipped because terrain took too long to build by hand.
            The tools that existed either generated snippets with no context, or required a full
            engineering background to operate. None of them built the whole game.
          </p>
          <p>
            The insight was simple: the best Roblox games are built by people who understand what
            players want — not necessarily by people who can write Luau. If AI could handle the full
            technical layer — terrain generation, 3D modeling, scripting, UI, economy — then the
            creator&apos;s job becomes purely creative.
          </p>
          <p>
            ForjeGames LLC was incorporated in 2026 with one goal: build the platform that removes
            every technical barrier between an idea and a published Roblox game.
          </p>
          <p>
            Today, ForjeGames ships with 200+ AI agents, voice input, image-to-map, 3D generation, a
            Studio Plugin, UI builder, economy designer, and a marketplace browser — all in a single
            editor. We&apos;re the only platform that covers every layer. And we&apos;re just
            getting started.
          </p>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
            Milestones
          </p>
          <h2 className="mb-12 text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
            Timeline
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[7px] top-0 h-full w-px"
              style={{ background: 'linear-gradient(to bottom, #D4AF37 0%, rgba(212,175,55,0.15) 100%)' }}
            />

            <div className="flex flex-col gap-10">
              {TIMELINE.map((t, i) => (
                <div key={t.date} className="reveal relative pl-9">
                  {/* Dot */}
                  <div
                    className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2"
                    style={{
                      borderColor: '#D4AF37',
                      background: i === TIMELINE.length - 1 ? '#D4AF37' : '#050810',
                      boxShadow: i === TIMELINE.length - 1 ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                    }}
                  />

                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(212,175,55,0.7)' }}>
                    {t.date}
                  </p>
                  <p className="mb-1.5 text-base font-semibold" style={{ color: '#FAFAFA' }}>
                    {t.event}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                    {t.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
              What drives us
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              Our values
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="reveal rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: '#D4AF37',
                  }}
                >
                  {v.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold" style={{ color: '#FAFAFA' }}>
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Team ──────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
              Who builds ForjeGames
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              Our AI team
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: '#71717A' }}>
              ForjeGames is built by one founder and 55 specialized AI agents — each handling a
              different layer of game creation, from terrain to texture to economy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { role: 'Terrain Architect',  model: 'ForjeAI',  specialty: 'Procedural world & map generation',  initials: 'TA', color: '#10B981', bg: 'rgba(16,185,129,0.15)'   },
              { role: 'Script Engineer',    model: 'ForjeAI',  specialty: 'Luau scripting & game systems',       initials: 'SE', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
              { role: 'Economy Designer',   model: 'ForjeAI',  specialty: 'Monetization & balance tuning',       initials: 'ED', color: '#D4AF37', bg: 'rgba(212,175,55,0.15)'  },
              { role: 'UI Builder',         model: 'ForjeAI',  specialty: 'ScreenGuis, menus & HUD design',      initials: 'UB', color: '#F472B6', bg: 'rgba(244,114,182,0.15)' },
              { role: '3D Generator',       model: 'ForjeAI',  specialty: 'Text & image to 3D mesh creation',   initials: '3D', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
              { role: 'Texture Artist',     model: 'ForjeAI',  specialty: 'PBR texture & material synthesis',   initials: 'TX', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
            ].map((member) => (
              <div
                key={member.role}
                className="reveal flex items-start gap-3 rounded-xl p-4 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: member.bg, color: member.color }}
                >
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>{member.role}</p>
                  <p className="text-xs" style={{ color: member.color }}>{member.model}</p>
                  <p className="mt-0.5 text-xs" style={{ color: '#52525B' }}>{member.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-16" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
              Reach us
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              Contact
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CONTACT.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="reveal flex flex-col gap-3 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 card-hover"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span style={{ color: '#D4AF37' }}>{c.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>{c.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>{c.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t px-6 py-24 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-xl">
          <h2
            className="mb-4 font-bold tracking-tight"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            Your game idea is waiting.
          </h2>
          <p className="mb-8 text-base" style={{ color: '#71717A' }}>
            Start free. No credit card. No code required. First map in 10 minutes.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
              color: '#09090b',
            }}
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  )
}
