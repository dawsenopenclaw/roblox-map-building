'use client'

const TIER_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  FREE:    { label: 'FREE',    bg: 'rgba(255,255,255,0.05)', color: '#8B95B0', border: '1px solid rgba(255,255,255,0.10)' },
  HOBBY:   { label: 'HOBBY',   bg: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)' },
  CREATOR: { label: 'CREATOR', bg: 'rgba(212,175,55,0.10)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' },
  STUDIO:  { label: 'STUDIO',  bg: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' },
}

const TESTIMONIALS = [
  {
    username: '@RobloxDev_Jake',
    initials: 'RJ',
    tier: 'CREATOR',
    stars: 5,
    quote: 'Built a full tycoon in 20 minutes. The AI placed assets, wrote scripts, and set up the economy. Insane.',
  },
  {
    username: '@LunaBuilds',
    initials: 'LB',
    tier: 'HOBBY',
    stars: 5,
    quote: 'Voice commands are a game-changer. I just say what I want and it appears in Studio.',
  },
  {
    username: '@CodeMaster99',
    initials: 'CM',
    tier: 'CREATOR',
    stars: 5,
    quote: 'Switched from Lemonade. ForjeGames does terrain AND assets, not just scripts.',
  },
  {
    username: '@PixelQueen',
    initials: 'PQ',
    tier: 'FREE',
    stars: 5,
    quote: 'The free tier is actually usable. Most tools give you nothing for free.',
  },
  {
    username: '@StudioPro_Max',
    initials: 'SM',
    tier: 'STUDIO',
    stars: 5,
    quote: 'My team of 5 ships games 3x faster now. The collaboration features are worth every penny.',
  },
  {
    username: '@NovaDev',
    initials: 'ND',
    tier: 'HOBBY',
    stars: 5,
    quote: 'Image-to-map blew my mind. Uploaded a photo and got a playable map in 2 minutes.',
  },
  {
    username: '@BuilderBen',
    initials: 'BB',
    tier: 'CREATOR',
    stars: 5,
    quote: 'The economy designer alone is worth the subscription. Balanced my game\'s currency in one session.',
  },
  {
    username: '@RoDevGirl',
    initials: 'RG',
    tier: 'FREE',
    stars: 5,
    quote: 'Finally an AI tool that doesn\'t require a PhD to use. Type, build, play.',
  },
  {
    username: '@MegaCraft',
    initials: 'MC',
    tier: 'STUDIO',
    stars: 5,
    quote: 'We publish 2 games a month now. Before ForjeGames it was 1 every 3 months.',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#D4AF37" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.FREE
  return (
    <span
      className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: style.bg, color: style.color, border: style.border }}
    >
      {style.label}
    </span>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[number] }) {
  return (
    <div
      className="group flex flex-col gap-4 rounded-2xl p-5 relative transition-all duration-300"
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-3px)'
        el.style.border = '1px solid rgba(212,175,55,0.20)'
        el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.06)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.border = '1px solid rgba(255,255,255,0.07)'
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)'
      }}
    >
      {/* Decorative quote mark */}
      <span
        aria-hidden="true"
        className="absolute top-4 right-5 text-5xl font-serif select-none pointer-events-none"
        style={{ color: 'rgba(212,175,55,0.08)', lineHeight: 1, fontFamily: 'Georgia, serif' }}
      >
        &ldquo;
      </span>

      {/* Header row */}
      <div className="flex items-center gap-3">
        {/* Gold circle avatar with initials */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(255,184,28,0.15) 100%)',
            border: '1px solid rgba(212,175,55,0.35)',
            color: '#D4AF37',
          }}
        >
          {testimonial.initials}
        </div>
        <div className="min-w-0 flex flex-col gap-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#FFFFFF' }}>
            {testimonial.username}
          </p>
          <TierBadge tier={testimonial.tier} />
        </div>
      </div>

      {/* Stars */}
      <StarRating count={testimonial.stars} />

      {/* Quote */}
      <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-6" style={{ background: '#0A0E27' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: '#D4AF37' }}
          >
            Creator Stories
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
            Loved by Roblox{' '}
            <span style={{ color: '#D4AF37' }}>creators</span>
          </h2>
          <p className="text-lg" style={{ color: '#8B95B0' }}>
            Thousands of builders shipping faster with ForjeGames.
          </p>
        </div>

        {/* 3×3 grid — desktop */}
        {/* Mobile: horizontal scroll (single row) */}
        <div
          className="hidden md:grid gap-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>

        {/* Mobile: single horizontal scroll row */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-72 snap-start">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
