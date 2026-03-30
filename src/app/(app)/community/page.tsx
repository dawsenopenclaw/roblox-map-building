import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Community — ForjeGames',
  description: 'Meet the creators behind the best Roblox templates. Leaderboards, spotlights, and stats from the ForjeGames creator community.',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Creator = {
  id: string
  displayName: string
  username: string
  tier: 'NOVICE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MYTHIC'
  totalSalesCents: number
  templateCount: number
  averageRating: number
  reviewCount: number
  joinedMonthsAgo: number
  topTemplate: string
  bio: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const CREATORS: Creator[] = [
  {
    id: 'c7',  displayName: 'DevTools',       username: 'dev_tools',      tier: 'PLATINUM',
    totalSalesCents: 184_600, templateCount: 8,  averageRating: 4.7, reviewCount: 412,
    joinedMonthsAgo: 18, topTemplate: 'Admin Panel Script',
    bio: 'Full-stack Roblox dev. I build developer tooling so you can focus on your game.',
  },
  {
    id: 'c5',  displayName: 'LuauLegend',     username: 'luau_legend',    tier: 'PLATINUM',
    totalSalesCents: 155_922, templateCount: 5,  averageRating: 4.9, reviewCount: 280,
    joinedMonthsAgo: 14, topTemplate: 'Combat System v2',
    bio: 'Specialising in combat systems and server-authoritative networking.',
  },
  {
    id: 'c2',  displayName: 'Marcus',          username: 'marcus_dev',     tier: 'PLATINUM',
    totalSalesCents: 112_080, templateCount: 6,  averageRating: 5.0, reviewCount: 195,
    joinedMonthsAgo: 22, topTemplate: 'City Starter Kit',
    bio: 'Map builder and open-source advocate. Half my catalogue is free.',
  },
  {
    id: 'c3',  displayName: 'Sarah',           username: 'sarah_scripts',  tier: 'GOLD',
    totalSalesCents: 80_218,  templateCount: 4,  averageRating: 4.2, reviewCount: 134,
    joinedMonthsAgo: 10, topTemplate: 'Tycoon Framework',
    bio: 'Economy systems and tycoon mechanics — I have shipped 4 top-100 games.',
  },
  {
    id: 'c9',  displayName: 'IslandArtist',    username: 'island_artist',  tier: 'GOLD',
    totalSalesCents: 53_300,  templateCount: 3,  averageRating: 5.0, reviewCount: 89,
    joinedMonthsAgo: 8,  topTemplate: 'Tropical Island Pack',
    bio: 'Environmental artist. Every asset is hand-crafted, no automated meshes.',
  },
  {
    id: 'c10', displayName: 'DungeonCraft',    username: 'dungeon_craft',  tier: 'GOLD',
    totalSalesCents: 71_560,  templateCount: 4,  averageRating: 4.5, reviewCount: 117,
    joinedMonthsAgo: 11, topTemplate: 'Dungeon Crawler Starter',
    bio: 'Procedural generation fanatic. If it can be generated, it should be.',
  },
  {
    id: 'c6',  displayName: 'WorldForge',      username: 'world_forge',    tier: 'GOLD',
    totalSalesCents: 73_480,  templateCount: 5,  averageRating: 4.0, reviewCount: 78,
    joinedMonthsAgo: 13, topTemplate: 'Fantasy Map Bundle',
    bio: 'World-builder and terrain sculptor. 5 biomes, every time.',
  },
  {
    id: 'c4',  displayName: 'DesignPro',       username: 'designpro',      tier: 'SILVER',
    totalSalesCents: 56_643,  templateCount: 3,  averageRating: 4.5, reviewCount: 103,
    joinedMonthsAgo: 7,  topTemplate: 'Modern UI Kit',
    bio: 'UI/UX designer turned Roblox dev. Clean interfaces are my obsession.',
  },
  {
    id: 'c1',  displayName: 'Alex_Builds',     username: 'alex_builds',    tier: 'GOLD',
    totalSalesCents: 27_270,  templateCount: 2,  averageRating: 4.5, reviewCount: 55,
    joinedMonthsAgo: 6,  topTemplate: 'Medieval Castle Pack',
    bio: 'RPG systems developer. Dungeon + quest logic is my bread and butter.',
  },
  {
    id: 'c8',  displayName: 'UIQueen',         username: 'ui_queen',       tier: 'SILVER',
    totalSalesCents: 15_602,  templateCount: 2,  averageRating: 4.0, reviewCount: 52,
    joinedMonthsAgo: 5,  topTemplate: 'Inventory UI Pack',
    bio: 'Inventory and equipment UI specialist. Every pixel matters.',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  NOVICE:   'text-gray-400 bg-gray-400/10 border-gray-400/20',
  SILVER:   'text-gray-200 bg-gray-200/10 border-gray-200/20',
  GOLD:     'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25',
  PLATINUM: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',
  DIAMOND:  'text-blue-300 bg-blue-300/10 border-blue-300/20',
  MYTHIC:   'text-purple-300 bg-purple-300/10 border-purple-300/20',
}

const RANK_STYLES = [
  'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30', // 1 — gold
  'text-gray-200 bg-gray-200/8 border-gray-200/20',      // 2 — silver
  'text-orange-400 bg-orange-400/8 border-orange-400/20', // 3 — bronze
]

const SPOTLIGHT = CREATORS[0]! // DevTools

const TOTAL_STATS = {
  creators:  '2,841',
  templates: '14,200+',
  sales:     '186,000+',
  revenue:   '$1.2M+',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(cents: number): string {
  if (cents >= 100_000) return `$${(cents / 100_000).toFixed(1)}k`
  return `$${(cents / 100).toFixed(0)}`
}

function fmtFull(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function initial(c: Creator): string {
  return c.displayName[0]?.toUpperCase() ?? '?'
}

function Avatar({ creator, size = 'md' }: { creator: Creator; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  return (
    <div className={`${sz} rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0 font-bold text-[#D4AF37]`}>
      {initial(creator)}
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_COLORS[tier] ?? TIER_COLORS.NOVICE!
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style}`}>
      {tier}
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < Math.round(rating) ? 'text-[#D4AF37]' : 'text-white/15'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const byRevenue  = [...CREATORS].sort((a, b) => b.totalSalesCents - a.totalSalesCents).slice(0, 10)
  const byTemplates = [...CREATORS].sort((a, b) => b.templateCount - a.templateCount).slice(0, 10)
  const byRating   = [...CREATORS].sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount).slice(0, 10)

  return (
    <div className="text-white">
      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[#050b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold mb-2">ForjeGames</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                Creator Community
              </h1>
              <p className="text-sm text-white/40 mt-3 max-w-lg">
                The builders behind the Roblox templates. Leaderboards updated daily.
              </p>
            </div>
            <Link
              href="/marketplace/submit"
              className="
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm flex-shrink-0
                bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] text-black
                hover:from-[#c49b2f] hover:to-[#b38a28]
                shadow-[0_0_20px_rgba(212,175,55,0.25)]
                hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]
                transition-all duration-200
              "
            >
              Become a Creator
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── Community Stats ────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { label: 'Creators',   value: TOTAL_STATS.creators,  sublabel: 'registered' },
              { label: 'Templates',  value: TOTAL_STATS.templates, sublabel: 'published' },
              { label: 'Downloads',  value: TOTAL_STATS.sales,     sublabel: 'total sales' },
              { label: 'Paid out',   value: TOTAL_STATS.revenue,   sublabel: 'to creators' },
            ] as const).map(({ label, value, sublabel }) => (
              <div
                key={label}
                className="bg-[#141414] border border-white/8 rounded-2xl p-5 text-center"
              >
                <p className="text-[#D4AF37] text-2xl sm:text-3xl font-black tabular-nums leading-none">{value}</p>
                <p className="text-white/70 font-semibold text-sm mt-1.5">{label}</p>
                <p className="text-white/25 text-xs mt-0.5">{sublabel}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Creator Spotlight ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#c49b2f] rounded-full" />
            <h2 className="text-xl font-bold text-white">Creator Spotlight</h2>
            <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
              March 2026
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/25 bg-gradient-to-br from-[#141414] to-[#0e0e0e] shadow-[0_0_60px_rgba(212,175,55,0.07)]">
            {/* Gold top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/3 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar + badge */}
                <div className="flex flex-col items-center gap-3 sm:w-40 flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/15 border-2 border-[#D4AF37]/30 flex items-center justify-center">
                    <span className="text-[#D4AF37] text-4xl font-black">{initial(SPOTLIGHT)}</span>
                  </div>
                  <TierBadge tier={SPOTLIGHT.tier} />
                  <p className="text-white/30 text-xs text-center">Member for {SPOTLIGHT.joinedMonthsAgo} months</p>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">{SPOTLIGHT.displayName}</h3>
                    <p className="text-white/35 text-sm">@{SPOTLIGHT.username}</p>
                    <p className="text-white/55 text-sm mt-2 leading-relaxed">{SPOTLIGHT.bio}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      { label: 'Total Earned',  value: fmtFull(SPOTLIGHT.totalSalesCents), gold: true },
                      { label: 'Templates',     value: String(SPOTLIGHT.templateCount),    gold: false },
                      { label: 'Avg Rating',    value: SPOTLIGHT.averageRating.toFixed(1), gold: false },
                      { label: 'Reviews',       value: SPOTLIGHT.reviewCount.toLocaleString(), gold: false },
                    ] as const).map(({ label, value, gold }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                        <p className={`text-xl font-black tabular-nums leading-none ${gold ? 'text-[#D4AF37]' : 'text-white'}`}>
                          {value}
                        </p>
                        <p className="text-white/30 text-[10px] uppercase tracking-wide mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/marketplace"
                      className="text-sm font-semibold text-black bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] hover:from-[#c49b2f] hover:to-[#b38a28] px-5 py-2.5 rounded-xl transition-all duration-200"
                    >
                      View templates
                    </Link>
                    <div className="flex items-center gap-1.5 text-white/35 text-xs">
                      <span>Top template:</span>
                      <span className="text-white/60 font-medium">{SPOTLIGHT.topTemplate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Leaderboards ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#c49b2f] rounded-full" />
            <h2 className="text-xl font-bold text-white">Leaderboards</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* By Revenue */}
            <LeaderboardCard
              title="Top Earners"
              subtitle="Total revenue (creator share)"
              creators={byRevenue}
              stat={(c) => fmt(c.totalSalesCents)}
              statLabel="earned"
            />

            {/* By Templates */}
            <LeaderboardCard
              title="Most Prolific"
              subtitle="Number of published templates"
              creators={byTemplates}
              stat={(c) => `${c.templateCount} template${c.templateCount !== 1 ? 's' : ''}`}
              statLabel=""
            />

            {/* By Rating */}
            <LeaderboardCard
              title="Highest Rated"
              subtitle="Average review score (min 5 reviews)"
              creators={byRating}
              stat={(c) => c.averageRating.toFixed(1)}
              statLabel="avg"
              showStars
            />
          </div>
        </section>

        {/* ── Become a Creator CTA ───────────────────────────────────────────── */}
        <section>
          <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#141414] to-[#0e0e0e] p-8 sm:p-12 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

            <p className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold mb-3">Ready to earn?</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Become a Creator</h2>
            <p className="text-white/45 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              Publish your templates on ForjeGames and earn 70% of every sale.
              No listing fees. Instant Stripe payouts when your balance hits $20.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {([
                { label: 'Your cut',         value: '70%',   desc: 'of every sale' },
                { label: 'Listing fee',      value: '$0',    desc: 'free to publish' },
                { label: 'Payout threshold', value: '$20',   desc: 'auto-triggered' },
                { label: 'Templates',        value: '∞',     desc: 'no cap' },
              ] as const).map(({ label, value, desc }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-2xl px-6 py-4 min-w-[110px] text-center">
                  <p className="text-[#D4AF37] text-2xl font-black leading-none">{value}</p>
                  <p className="text-white/70 text-xs font-semibold mt-1">{label}</p>
                  <p className="text-white/25 text-[10px] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/marketplace/submit"
                className="
                  inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm
                  bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] text-black
                  hover:from-[#c49b2f] hover:to-[#b38a28]
                  shadow-[0_0_24px_rgba(212,175,55,0.3)]
                  hover:shadow-[0_0_36px_rgba(212,175,55,0.5)]
                  transition-all duration-200
                "
              >
                Submit Your First Template
              </Link>
              <Link
                href="/marketplace"
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Browse existing templates
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── LeaderboardCard ──────────────────────────────────────────────────────────

function LeaderboardCard({
  title,
  subtitle,
  creators,
  stat,
  statLabel,
  showStars = false,
}: {
  title: string
  subtitle: string
  creators: Creator[]
  stat: (c: Creator) => string
  statLabel: string
  showStars?: boolean
}) {
  return (
    <div className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <p className="text-white/30 text-xs mt-0.5">{subtitle}</p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {creators.map((creator, idx) => {
          const rankStyle = RANK_STYLES[idx] ?? 'text-white/30 bg-white/5 border-transparent'
          const isTop3 = idx < 3
          return (
            <div
              key={creator.id}
              className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] ${isTop3 ? 'bg-white/[0.015]' : ''}`}
            >
              {/* Rank */}
              <span className={`w-6 h-6 rounded-full border text-[11px] font-bold flex items-center justify-center flex-shrink-0 tabular-nums ${rankStyle}`}>
                {idx + 1}
              </span>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${isTop3 ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#D4AF37]' : 'bg-white/5 text-white/40'}`}>
                {initial(creator)}
              </div>

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isTop3 ? 'text-white' : 'text-white/70'}`}>
                  {creator.displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TierBadge tier={creator.tier} />
                </div>
              </div>

              {/* Stat */}
              <div className="text-right flex-shrink-0">
                {showStars ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <Stars rating={creator.averageRating} />
                    <p className="text-[#D4AF37] text-xs font-bold tabular-nums">{stat(creator)}</p>
                  </div>
                ) : (
                  <p className={`text-sm font-bold tabular-nums ${isTop3 ? 'text-[#D4AF37]' : 'text-white/50'}`}>
                    {stat(creator)}
                    {statLabel && <span className="text-white/25 font-normal text-xs ml-0.5"> {statLabel}</span>}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5">
        <Link
          href="/marketplace"
          className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
        >
          View all creators
        </Link>
      </div>
    </div>
  )
}
