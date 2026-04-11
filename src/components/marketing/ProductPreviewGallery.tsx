'use client'

/**
 * ProductPreviewGallery — "See the editor in action" marketing section.
 *
 * Shows real screenshots of the ForjeGames product (dashboard, editor, pricing)
 * served via next/image for automatic WebP/AVIF optimization so the ~3–5MB
 * source PNGs never hit the client. Images live in `/public/showcase/`.
 */

import Image from 'next/image'

type PreviewSlide = {
  id: string
  src: string
  alt: string
  caption: string
  sublabel: string
  accent: string
}

const SLIDES: readonly PreviewSlide[] = [
  {
    id: 'editor',
    src: '/showcase/forjegames-state3.png',
    alt: 'ForjeGames editor interface showing AI agents building a Roblox map in real time',
    caption: 'AI Editor',
    sublabel: 'Nine specialised agents, one live Studio sync',
    accent: '#D4AF37',
  },
  {
    id: 'dashboard',
    src: '/showcase/forjegames-state5.png',
    alt: 'ForjeGames dashboard showing recent builds, token balance, and agent activity',
    caption: 'Dashboard',
    sublabel: 'Projects, tokens, builds — one glance',
    accent: '#60A5FA',
  },
  {
    id: 'pricing',
    src: '/showcase/forjegames-pricing-raw.png',
    alt: 'ForjeGames pricing page showing Free, Starter, Creator, and Studio tiers',
    caption: 'Transparent pricing',
    sublabel: '$0 to $200 with a custom token slider',
    accent: '#7C3AED',
  },
] as const

export default function ProductPreviewGallery() {
  return (
    <section
      className="relative py-24 px-6 overflow-hidden"
      style={{
        background:
          'linear-gradient(to bottom, #050810 0%, #070B1A 50%, #050810 100%)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      aria-labelledby="product-preview-heading"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.035) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            See it in action
          </p>
          <h2
            id="product-preview-heading"
            className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#FAFAFA',
            }}
          >
            Built for speed.
            <br />
            <span className="gradient-text">Every pixel earned.</span>
          </h2>
          <p
            className="reveal reveal-delay-2 mx-auto max-w-2xl text-[15px] leading-relaxed"
            style={{ color: '#71717A' }}
          >
            No demos. No mockups. Real screenshots of the editor, dashboard, and
            billing — exactly what you&apos;ll see after signup.
          </p>
        </div>

        {/* Gallery grid — 3-up on md, stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SLIDES.map((slide, i) => (
            <figure
              key={slide.id}
              className={`reveal reveal-delay-${i + 2} group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1`}
              style={{
                background: 'rgba(10, 14, 32, 0.55)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${slide.accent}55`
                el.style.boxShadow = `inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 16px 40px rgba(0,0,0,0.55), 0 0 32px ${slide.accent}22`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                el.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
              }}
            >
              {/* Screenshot — next/image handles optimization (WebP/AVIF, responsive sizes) */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority={i === 0}
                />
                {/* Bottom gradient for caption legibility */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(5,8,16,0.85), transparent)',
                  }}
                />
                {/* Accent corner badge */}
                <span
                  className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    background: `${slide.accent}1A`,
                    border: `1px solid ${slide.accent}35`,
                    color: slide.accent,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  Live
                </span>
              </div>

              {/* Caption */}
              <figcaption
                className="p-5 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <p
                  className="text-[15px] font-semibold mb-1"
                  style={{ color: '#FAFAFA' }}
                >
                  {slide.caption}
                </p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#71717A' }}>
                  {slide.sublabel}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
