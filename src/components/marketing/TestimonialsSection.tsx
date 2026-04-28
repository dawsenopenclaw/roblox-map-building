'use client'

import { useState, useEffect } from 'react'

type LiveReview = {
  id: string
  name: string
  review: string
  stars: number
  avatarUrl: string | null
  createdAt: string
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < count ? '#D4AF37' : 'rgba(212,175,55,0.15)'} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('')
}

function TestimonialCard({ review }: { review: LiveReview }) {
  const hasAvatar = !!review.avatarUrl

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
      <StarRating count={review.stars} />

      {/* Quote */}
      <p className="text-[15px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
        &ldquo;{review.review}&rdquo;
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
          style={{
            background: hasAvatar ? 'rgba(10,14,25,0.8)' : 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(255,184,28,0.15) 100%)',
            border: '1px solid rgba(212,175,55,0.35)',
            color: '#D4AF37',
          }}
        >
          {hasAvatar ? (
            <img src={review.avatarUrl!} alt={review.name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            getInitials(review.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))' }}>
            {review.name}
          </p>
          <p className="text-[11px] truncate" style={{ color: '#D4AF37' }}>
            Verified Builder
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<LiveReview[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setReviews(data); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // Don't render the section at all if no reviews
  if (loaded && reviews.length === 0) return null
  // Don't render until loaded to avoid flash
  if (!loaded) return null

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
            Real feedback from builders using ForjeGames.
          </p>
        </div>

        {/* 2-col tablet / 3-col desktop grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((r) => (
            <TestimonialCard key={r.id} review={r} />
          ))}
        </div>

        {/* Mobile: single horizontal scroll row */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6"
          style={{ scrollbarWidth: 'none' }}>
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="flex-shrink-0 w-[85vw] max-w-xs snap-start">
              <TestimonialCard review={r} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
