'use client'

const TIER_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  FREE:    { label: 'FREE',    bg: 'rgba(255,255,255,0.05)', color: '#8B95B0', border: '1px solid rgba(255,255,255,0.10)' },
  HOBBY:   { label: 'HOBBY',   bg: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)' },
  CREATOR: { label: 'CREATOR', bg: 'rgba(212,175,55,0.10)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' },
  STUDIO:  { label: 'STUDIO',  bg: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' },
}

const TESTIMONIALS = [
  {
    name: 'Maya Chen',
    role: 'Indie Roblox Dev',
    initials: 'MC',
    tier: 'CREATOR',
    stars: 5,
    quote: 'ForjeGames cut my prototyping time in half — went from 3 weeks to 4 days for our tycoon launch.',
  },
  {
    name: 'Daniel Okafor',
    role: 'Solo Creator, 2.1M visits',
    initials: 'DO',
    tier: 'CREATOR',
    stars: 5,
    quote: 'I shipped a working obby in an afternoon. The Studio sync is the part I never knew I needed.',
  },
  {
    name: 'Priya Ramanathan',
    role: 'Student dev, Grade 11',
    initials: 'PR',
    tier: 'FREE',
    stars: 5,
    quote: 'The free tier actually works. I built my first published game without touching a single line of Luau.',
  },
  {
    name: 'Jordan Whitfield',
    role: 'Studio lead, 8-person team',
    initials: 'JW',
    tier: 'STUDIO',
    stars: 5,
    quote: 'Our team ships 3x faster. The collaboration features and shared build history paid for themselves in a week.',
  },
  {
    name: 'Elena Moretti',
    role: 'Former Unity dev',
    initials: 'EM',
    tier: 'CREATOR',
    stars: 5,
    quote: 'I came from Unity and expected rough edges. ForjeGames is cleaner than most pro tools I pay 10x more for.',
  },
  {
    name: 'Marcus Reyes',
    role: 'Roblox UGC creator',
    initials: 'MR',
    tier: 'HOBBY',
    stars: 5,
    quote: 'Image-to-map is uncanny. I uploaded a concept sketch and had a playable village running in about two minutes.',
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
      className="group h-full flex flex-col gap-5 rounded-xl p-6 relative transition-all duration-150"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
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
        el.style.border = '1px solid rgba(255,255,255,0.06)'
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

      {/* Stars */}
      <StarRating count={testimonial.stars} />

      {/* Quote */}
      <p className="text-[15px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Footer — name + role + tier */}
      <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))' }}>
            {testimonial.name}
          </p>
          <p className="text-[11px] truncate" style={{ color: '#8B95B0' }}>
            {testimonial.role}
          </p>
        </div>
        <TierBadge tier={testimonial.tier} />
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 px-6" style={{ background: 'var(--background, #050810)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'var(--gold, #D4AF37)' }}
          >
            Creator Stories
          </p>
          <h2 className="font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))', fontSize: 'clamp(1.75rem, 5vw, 2.25rem)' }}>
            Loved by Roblox{' '}
            <span style={{ color: 'var(--gold, #D4AF37)' }}>creators</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: '#8B95B0' }}>
            Thousands of builders shipping faster with ForjeGames.
          </p>
        </div>

        {/* 2-col tablet / 3-col desktop grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>

        {/* Mobile: single horizontal scroll row */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6"
          style={{ scrollbarWidth: 'none' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-[85vw] max-w-xs snap-start">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
