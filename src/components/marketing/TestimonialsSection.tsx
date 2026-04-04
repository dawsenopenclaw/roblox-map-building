'use client'

import { useEffect, useRef } from 'react'

const TESTIMONIALS = [
  {
    username: 'PixelCraft_Dev',
    initials: 'PC',
    color: '#FF6B6B',
    quote: 'I built a full tycoon game in a weekend. What used to take me 3 months now takes 2 days. ForjeGames is insane.',
    stars: 5,
    tag: 'Tycoon Creator',
  },
  {
    username: 'NovaBuildz',
    initials: 'NB',
    color: '#4ECDC4',
    quote: 'The Image to Map feature is unlike anything else. I sketched my town layout on paper, uploaded it, and had a full map in Roblox in minutes.',
    stars: 5,
    tag: 'Map Builder',
  },
  {
    username: 'XxShadowRbx',
    initials: 'SX',
    color: '#A855F7',
    quote: 'Voice input is actually fire. I just talk to it while playing and it fixes my scripts live. My dev time is cut in half.',
    stars: 5,
    tag: 'Game Dev',
  },
  {
    username: 'StarterPack99',
    initials: 'SP',
    color: '#F59E0B',
    quote: 'I have zero scripting knowledge. ForjeGames gave me a fully working economy system and leaderboards just from describing what I wanted.',
    stars: 5,
    tag: 'No-Code Builder',
  },
  {
    username: 'TerminalJake',
    initials: 'TJ',
    color: '#10B981',
    quote: 'Switched from another tool and never looked back. The AI actually understands Roblox context — not just generic code gen.',
    stars: 5,
    tag: 'Simulator Dev',
  },
  {
    username: 'IceQueen_Rblx',
    initials: 'IQ',
    color: '#60A5FA',
    quote: 'Generated 3D custom models AND had them textured in 10 minutes. My players thought I hired a professional 3D artist.',
    stars: 5,
    tag: 'RPG Creator',
  },
  {
    username: 'DragonForge_00',
    initials: 'DF',
    color: '#F97316',
    quote: 'Best investment for Roblox dev. The chat agent remembers context, iterates fast, and never breaks my existing code.',
    stars: 5,
    tag: 'Adventure Dev',
  },
  {
    username: 'MaplePark_Rbx',
    initials: 'MP',
    color: '#EC4899',
    quote: 'ForjeGames handled my entire UI redesign. New menus, inventory system, shop UI — all matching my game aesthetic.',
    stars: 5,
    tag: 'UI Designer',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#D4AF37" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[number] }) {
  return (
    <div
      className="flex-shrink-0 w-72 rounded-xl p-5 flex flex-col gap-3 relative"
      style={{
        background: '#0F1535',
        border: '1px solid #1A2550',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Gold quote mark */}
      <div
        aria-hidden="true"
        className="absolute top-4 right-5 text-5xl font-serif leading-none select-none pointer-events-none"
        style={{ color: 'rgba(212,175,55,0.12)', lineHeight: 1, fontFamily: 'Georgia, serif' }}
      >
        &ldquo;
      </div>
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${testimonial.color}22`, color: testimonial.color, border: `1px solid ${testimonial.color}40` }}
        >
          {testimonial.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>
            {testimonial.username}
          </p>
          <p className="text-[11px]" style={{ color: '#8B95B0' }}>
            {testimonial.tag}
          </p>
        </div>
      </div>
      <StarRating count={testimonial.stars} />
      <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>
    </div>
  )
}

export default function TestimonialsSection() {
  const track1Ref = useRef<HTMLDivElement>(null)
  const track2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tracks = [track1Ref.current, track2Ref.current]
    const speeds = [0.4, 0.3]
    // track2 starts mid-way so the rightward scroll looks natural from the start
    let positions = [0, 0]
    let initialized = [false, false]
    let rafId: number

    const animate = () => {
      tracks.forEach((track, idx) => {
        if (!track) return
        const dir = idx === 0 ? -1 : 1
        const half = track.scrollWidth / 2
        // Initialize track2 to -half on first frame so it doesn't jump
        if (!initialized[idx]) {
          initialized[idx] = true
          if (dir === 1) positions[idx] = -half
        }
        positions[idx] += speeds[idx] * dir
        if (positions[idx] <= -half) positions[idx] = 0
        if (positions[idx] >= 0 && dir === 1) positions[idx] = -half
        track.style.transform = `translateX(${positions[idx]}px)`
      })
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const firstHalf = TESTIMONIALS.slice(0, 4)
  const secondHalf = TESTIMONIALS.slice(4)

  return (
    <section className="py-16 overflow-hidden" style={{ background: '#0A0E27' }}>
      <div className="max-w-6xl mx-auto px-6 mb-10 text-center">
        <p
          className="text-[12px] font-medium uppercase tracking-widest mb-3"
          style={{ color: '#D4AF37' }}
        >
          Creator Stories
        </p>
        <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
          What creators are saying
        </h2>
        <p className="text-lg" style={{ color: '#8B95B0' }}>
          Creators building faster with ForjeGames.
        </p>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative mb-3" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
        <div ref={track1Ref} className="flex gap-4 w-max">
          {[...firstHalf, ...firstHalf].map((t, i) => (
            <TestimonialCard key={`r1-${i}`} testimonial={t} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
        <div ref={track2Ref} className="flex gap-4 w-max">
          {[...secondHalf, ...secondHalf].map((t, i) => (
            <TestimonialCard key={`r2-${i}`} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
