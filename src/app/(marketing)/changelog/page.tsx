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
    version: 'v1.2.0',
    date: 'April 23, 2026',
    label: 'Patch',
    headline: 'Editor Visual Overhaul + Bug Blitz — 33 bugs fixed, new feedback system',
    items: [
      { type: 'feat', text: 'Post-build feedback card — quality score ring (0-100), part count, model badge, and contextual quick-action pills after every build' },
      { type: 'feat', text: 'Floating orbs background — 6 ambient orbs slowly drifting across the editor (gold, blue, purple, cyan, amber)' },
      { type: 'feat', text: 'Cyberglass input bar — gradient glass with animated shimmer sweep, blur(30px) + saturate(1.4), gold glow on focus' },
      { type: 'feat', text: 'Editor top bar glow — gold gradient edge line, all buttons with hover glow effects, model selector dropdown in header' },
      { type: 'feat', text: 'Welcome hero redesign — 6 quick-start cards (Build, Script, Image, 3D, Terrain, Advice) with hover lift and color glow' },
      { type: 'feat', text: 'Mode switcher pill bar — clean horizontal pills with gold underline glow on active mode' },
      { type: 'feat', text: 'Right sidebar — AI Context panel showing camera position, part count, nearby parts when Studio connected' },
      { type: 'feat', text: 'Session drawer cyberglass — gradient glass background, gold dot indicators, smooth slide animation, hover-reveal delete' },
      { type: 'fix', text: 'Script mode now generates actual Script instances instead of Part-based builds — UI mode selection overrides intent detection' },
      { type: 'fix', text: 'Quick action buttons (Terrain, City, 3D) now use proper mode prefixes (/terrain, /mesh) and detailed prompts' },
      { type: 'fix', text: 'Terrain, Image, Mesh mode buttons now correctly route through their dedicated AI pipelines' },
      { type: 'fix', text: 'Fixed RightSidebar type mismatch — now uses real StudioContext type from useStudioConnection' },
      { type: 'fix', text: 'Fixed 67 hardcoded Inter font references — now uses Geist Sans system font for crisp rendering' },
      { type: 'perf', text: 'Message bubbles use gradient glass with saturate(1.1) — cleaner visual separation' },
      { type: 'perf', text: 'Suggestion pills upgraded — gradient backgrounds, backdrop blur, layered shadows, gold glow on hover' },
    ],
  },
  {
    version: 'v1.1.0',
    date: 'April 21, 2026',
    label: 'Beta',
    headline: 'Beta Launch — 200 agents, ELI brain, quality tiers, Discord testers',
    items: [
      { type: 'feat', text: '200 specialist AI agents — covering every Roblox game system from terrain to NPC to economy' },
      { type: 'feat', text: 'ELI build intelligence — learns from every build outcome to improve future generations' },
      { type: 'feat', text: '5-tier quality system — Quick/Fast/Standard/Detailed/Ultra with increasing part counts and detail' },
      { type: 'feat', text: 'Multi-stage build pipeline — Plan→Build→Verify→Enhance→Ship for complex builds' },
      { type: 'feat', text: 'Completeness auditor — verifies AI built everything it described, auto-retries if incomplete' },
      { type: 'feat', text: '15 automated cloud agents running 24/7 — quality grinder, SEO, security, performance' },
      { type: 'feat', text: 'Discord integration — automated bug tracker, leaderboard, beta team channels' },
      { type: 'feat', text: 'PWA installable — install ForjeGames as a desktop/mobile app' },
      { type: 'fix', text: 'Fixed Clerk sign-in rendering empty for authenticated users' },
      { type: 'fix', text: 'Fixed 16 bugs reported by beta testers in first 24 hours' },
      { type: 'perf', text: 'System prompts compressed 60% — doubled effective token budget for AI responses' },
    ],
  },
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
      { type: 'feat', text: 'Stripe subscriptions: Pro and Studio plans with 3-day free trial' },
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

const TYPE_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  feat: { label: 'New', bg: 'rgba(16,185,129,0.08)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  fix:  { label: 'Fix', bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  perf: { label: 'Perf', bg: 'rgba(168,85,247,0.08)', color: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  break: { label: 'Breaking', bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.2)' },
}

const LABEL_META: Record<Release['label'], { bg: string; color: string; border: string }> = {
  Launch: { bg: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: 'rgba(212,175,55,0.25)' },
  Beta:   { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  Alpha:  { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' },
  Patch:  { bg: 'rgba(168,85,247,0.08)', color: '#c084fc', border: 'rgba(192,132,252,0.25)' },
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b px-6 pb-20 pt-32 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#050810' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,55,0.09) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <p
            className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            Changelog
          </p>
          <h1
            className="mb-4 font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            What&apos;s new
          </h1>
          <p className="mx-auto max-w-md text-base" style={{ color: '#71717A' }}>
            Every feature, fix, and improvement — in chronological order.
          </p>
        </div>
      </section>

      {/* ── Release Timeline ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.05) 100%)' }}
          />

          <div className="flex flex-col gap-16">
            {RELEASES.map((release, ri) => {
              const lm = LABEL_META[release.label]
              return (
                <div key={release.version} className="reveal relative pl-9">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2"
                    style={{
                      borderColor: ri === 0 ? '#D4AF37' : 'rgba(212,175,55,0.35)',
                      background: ri === 0 ? '#D4AF37' : '#050810',
                      boxShadow: ri === 0 ? '0 0 14px rgba(212,175,55,0.55)' : 'none',
                    }}
                  />

                  {/* Release card */}
                  <div
                    className="rounded-2xl p-6 sm:p-7"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: ri === 0 ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Header row */}
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <span className="text-xl font-bold" style={{ color: '#FAFAFA' }}>
                        {release.version}
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: lm.bg, color: lm.color, borderColor: lm.border }}
                      >
                        {release.label}
                      </span>
                      <span className="text-sm" style={{ color: '#52525B' }}>
                        {release.date}
                      </span>
                    </div>

                    <h2 className="mb-6 text-base font-semibold" style={{ color: 'rgba(250,250,250,0.8)' }}>
                      {release.headline}
                    </h2>

                    {/* Items */}
                    <div className="flex flex-col gap-2.5">
                      {release.items.map((item, i) => {
                        const meta = TYPE_META[item.type]
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <span
                              className="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold"
                              style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                            >
                              {meta.label}
                            </span>
                            <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                              {item.text}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Subscribe strip ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t px-6 py-16 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 80% at 50% 50%, rgba(212,175,55,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-sm">
          <p
            className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            Stay updated
          </p>
          <h2 className="mb-3 text-xl font-bold" style={{ color: '#FAFAFA' }}>
            Get release announcements
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
            Follow{' '}
            <a
              href="https://twitter.com/forjegames"
              className="transition-colors hover:underline"
              style={{ color: '#D4AF37' }}
            >
              @forjegames
            </a>{' '}
            on X or join{' '}
            <a
              href="https://discord.gg/forjegames"
              className="transition-colors hover:underline"
              style={{ color: '#D4AF37' }}
            >
              Discord
            </a>{' '}
            to get notified the moment we ship.
          </p>
        </div>
      </section>
    </div>
  )
}
