import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Changelog',
  description:
    'Release notes for ForjeGames. Track every update, new feature, and fix as we ship the fastest AI-powered Roblox development platform.',
  path: '/changelog',
  keywords: ['ForjeGames updates', 'Roblox AI changelog', 'ForjeGames release notes'],
})

interface Release {
  version: string
  date: string
  label: 'Launch' | 'Beta' | 'Alpha' | 'Patch'
  headline: string
  items: { type: 'feat' | 'fix' | 'perf' | 'break'; text: string }[]
}

const RELEASES: Release[] = [
  {
    version: 'v1.0.0',
    date: 'March 29, 2026',
    label: 'Launch',
    headline: 'General Availability — ForjeGames is live',
    items: [
      { type: 'feat', text: 'AI chat editor with 50/50 split-pane layout and live 3D preview' },
      { type: 'feat', text: '55 specialized AI agents (terrain, scripting, economy, NPC, audio, and more)' },
      { type: 'feat', text: 'Voice-to-game: speak any build command hands-free via Web Speech API' },
      { type: 'feat', text: 'Image-to-map: upload sketch or photo → full Roblox map via Claude Vision + Depth Pro' },
      { type: 'feat', text: 'Roblox Studio Plugin — sync AI output directly into your place file' },
      { type: 'feat', text: 'Marketplace browser: search and insert 500K+ Roblox assets in-editor' },
      { type: 'feat', text: '3D asset generation via Meshy AI — any prop, structure, or character on demand' },
      { type: 'feat', text: 'Texture generation via Fal.ai Flux Pro — tileable PBR maps from text prompts' },
      { type: 'feat', text: 'Game DNA scanner — analyze any public Roblox game, clone its patterns' },
      { type: 'feat', text: 'Creator gamification: 6-tier progression (Novice → Mythic), 30 achievements, daily streaks' },
      { type: 'feat', text: 'Token economy: Starter (free, 50/day), Pro ($29/mo), Studio ($79/mo), Team ($149/mo)' },
      { type: 'feat', text: 'Stripe billing with usage metering per AI token consumed' },
      { type: 'feat', text: 'COPPA-compliant Clerk auth with under-13 parental consent flow' },
      { type: 'feat', text: 'PostHog analytics, Sentry error monitoring, OpenTelemetry tracing' },
    ],
  },
  {
    version: 'v0.9.0',
    date: 'March 1, 2026',
    label: 'Beta',
    headline: 'Closed Beta — landing page, auth, and billing foundations',
    items: [
      { type: 'feat', text: 'Marketing site: homepage, pricing, docs hub, and download page' },
      { type: 'feat', text: 'Clerk authentication: email/password, Google OAuth, Discord OAuth' },
      { type: 'feat', text: 'Stripe subscriptions: Pro and Studio plans with 14-day free trial' },
      { type: 'feat', text: 'Basic AI chat: single-agent Luau script generation (Claude 3.5 Sonnet)' },
      { type: 'feat', text: 'Token balance widget and usage dashboard' },
      { type: 'feat', text: 'Onboarding flow: 5-step wizard with demo mode for unauthenticated users' },
      { type: 'fix', text: 'Fixed Clerk webhook signature verification on Vercel Edge runtime' },
      { type: 'fix', text: 'Fixed Stripe webhook idempotency for duplicate payment events' },
      { type: 'perf', text: 'ISR on marketing pages (revalidate: 3600) — cut TTFB by 340ms' },
    ],
  },
  {
    version: 'v0.8.0',
    date: 'January 15, 2026',
    label: 'Alpha',
    headline: 'Internal Alpha — initial prototype',
    items: [
      { type: 'feat', text: 'Proof-of-concept: Claude API → Luau script output in a raw textarea' },
      { type: 'feat', text: 'Basic Next.js 15 app scaffolded with App Router and TypeScript strict mode' },
      { type: 'feat', text: 'Neon Postgres + Prisma ORM schema v1: users, projects, token_ledger' },
      { type: 'feat', text: 'Vercel deployment pipeline with preview environments per PR' },
      { type: 'perf', text: 'Edge middleware for auth gating — <5ms overhead measured on Vercel' },
    ],
  },
]

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  feat: { label: 'New', color: 'text-emerald-400 bg-emerald-400/10' },
  fix: { label: 'Fix', color: 'text-blue-400 bg-blue-400/10' },
  perf: { label: 'Perf', color: 'text-purple-400 bg-purple-400/10' },
  break: { label: 'Breaking', color: 'text-red-400 bg-red-400/10' },
}

const LABEL_COLOR: Record<Release['label'], string> = {
  Launch: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20',
  Beta: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Alpha: 'text-white/50 bg-white/5 border-white/10',
  Patch: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-20 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          Changelog
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          What&apos;s new
        </h1>
        <p className="mx-auto max-w-md text-base text-white/45">
          Every feature, fix, and improvement — in chronological order.
        </p>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5.5px] top-0 h-full w-px bg-white/5" />

          <div className="flex flex-col gap-14">
            {RELEASES.map((release) => (
              <div key={release.version} className="relative pl-8">
                {/* Dot */}
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-[#D4AF37] bg-[#0a0a0a]" />

                {/* Header */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-xl font-bold text-white">{release.version}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LABEL_COLOR[release.label]}`}
                  >
                    {release.label}
                  </span>
                  <span className="text-sm text-white/30">{release.date}</span>
                </div>

                <h2 className="mb-5 text-base font-semibold text-white/80">{release.headline}</h2>

                {/* Items */}
                <div className="flex flex-col gap-2.5">
                  {release.items.map((item, i) => {
                    const meta = TYPE_LABEL[item.type]
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <p className="text-sm leading-relaxed text-white/55">{item.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe strip */}
      <section className="border-t border-white/5 px-6 py-12 text-center">
        <p className="mb-2 text-sm font-medium text-white/60">Stay updated</p>
        <p className="mx-auto max-w-sm text-sm text-white/35">
          Follow{' '}
          <a href="https://twitter.com/forjegames" className="text-[#D4AF37] hover:underline">
            @forjegames
          </a>{' '}
          on X or join{' '}
          <a href="https://discord.gg/forjegames" className="text-[#D4AF37] hover:underline">
            Discord
          </a>{' '}
          to get release announcements as they drop.
        </p>
      </section>
    </div>
  )
}
