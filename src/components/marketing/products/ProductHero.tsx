'use client'

/**
 * ProductHero — reusable hero block for ForjeGames product landing pages.
 *
 * Dark background with gold accent (matches existing marketing tokens).
 * Accessible: semantic heading order, keyboard-reachable CTAs, decorative
 * illustrations marked aria-hidden.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

export interface ProductHeroProps {
  eyebrow: string
  headline: string
  sub: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  /** Optional right-column illustration slot. */
  illustration?: ReactNode
  /** Optional small rating cluster above the CTAs. */
  rating?: { stars: number; text: string }
}

export default function ProductHero({
  eyebrow,
  headline,
  sub,
  ctaPrimary,
  ctaSecondary,
  illustration,
  rating,
}: ProductHeroProps) {
  return (
    <section
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
      aria-labelledby="product-hero-heading"
    >
      {/* Decorative gold radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(800px 400px at 50% 0%, rgba(212,175,55,0.14), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                borderColor: 'rgba(212,175,55,0.4)',
                background: 'rgba(212,175,55,0.08)',
                color: '#D4AF37',
              }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: '#D4AF37' }}
              />
              {eyebrow}
            </span>
            <h1
              id="product-hero-heading"
              className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              {headline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              {sub}
            </p>

            {rating && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={i < rating.stars ? '#D4AF37' : 'rgba(255,255,255,0.15)'}
                    >
                      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-zinc-400">{rating.text}</span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={ctaPrimary.href}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
                style={{
                  background:
                    'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                  boxShadow: '0 0 30px rgba(212,175,55,0.35)',
                }}
              >
                {ctaPrimary.label}
              </Link>
              {ctaSecondary && (
                <Link
                  href={ctaSecondary.href}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
                >
                  {ctaSecondary.label}
                </Link>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              No credit card required. Free to start. Cancel anytime.
            </p>
          </div>

          <div
            className="relative flex items-center justify-center"
            aria-hidden={illustration ? undefined : 'true'}
          >
            {illustration ?? (
              <div
                className="aspect-square w-full max-w-md rounded-3xl border border-white/10"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 100%)',
                  boxShadow:
                    '0 30px 100px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
