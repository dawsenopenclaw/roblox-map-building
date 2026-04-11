'use client'

import Link from 'next/link'
import { Sparkles, Wand2 } from 'lucide-react'
import { SHOWCASE_GAMES } from '@/lib/showcase-data'

/**
 * Animated hero for the dedicated /showcase page. Presents the "Built with
 * ForjeGames" headline, a short supporting line, CTAs, and a strip of live
 * stats aggregated from the showcase data so it always stays in sync.
 */
export default function ShowcaseHero() {
  const totalGames = SHOWCASE_GAMES.length
  const totalParts = SHOWCASE_GAMES.reduce((sum, g) => sum + g.stats.parts, 0)
  const totalScripts = SHOWCASE_GAMES.reduce((sum, g) => sum + g.stats.scripts, 0)
  const avgBuildSec = Math.round(
    SHOWCASE_GAMES.reduce((sum, g) => sum + g.stats.buildTimeSec, 0) / totalGames
  )

  const stats: Array<{ value: string; label: string }> = [
    { value: `${totalGames}`, label: 'Featured builds' },
    { value: `${Math.round(totalParts / 1000)}k+`, label: 'Parts generated' },
    { value: `${totalScripts}`, label: 'Scripts written' },
    { value: `~${Math.round(avgBuildSec / 60)}m`, label: 'Avg build time' },
  ]

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 55%), linear-gradient(to bottom, #070B1A, #050810)',
      }}
    >
      {/* Decorative animated orbs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full opacity-30 showcase-hero-orb"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute top-20 right-[10%] w-[360px] h-[360px] rounded-full opacity-25 showcase-hero-orb-2"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse at center, black 0%, black 35%, transparent 80%)',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
        {/* Eyebrow */}
        <div className="flex justify-center mb-6 showcase-hero-fade-in">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.30)',
              color: '#D4AF37',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Gallery
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white showcase-hero-fade-in"
          style={{ animationDelay: '60ms' }}
        >
          Built with{' '}
          <span
            className="relative inline-block"
            style={{
              color: '#D4AF37',
              textShadow: '0 0 40px rgba(212,175,55,0.45)',
            }}
          >
            ForjeGames
            <span
              className="absolute left-0 right-0 -bottom-2 h-[3px] rounded-full showcase-hero-underline"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #D4AF37 20%, #F5D878 50%, #D4AF37 80%, transparent)',
              }}
              aria-hidden="true"
            />
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mt-8 text-center text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed showcase-hero-fade-in"
          style={{ color: '#8B95B0', animationDelay: '140ms' }}
        >
          Real Roblox games generated from a single prompt. Browse the gallery,
          pick one you like, and launch the editor with the exact prompt loaded —
          then remix it however you want.
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 showcase-hero-fade-in"
          style={{ animationDelay: '220ms' }}
        >
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100"
            style={{
              background:
                'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)',
              boxShadow: '0 10px 30px rgba(212,175,55,0.25)',
            }}
          >
            <Wand2 className="w-4 h-4" />
            Build yours free
          </Link>
          <a
            href="#gallery"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
            style={{
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.25)',
            }}
          >
            Browse gallery
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>

        {/* Stats strip */}
        <div
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto showcase-hero-fade-in"
          style={{ animationDelay: '320ms' }}
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="text-center rounded-xl px-4 py-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#D4AF37' }}>
                {value}
              </p>
              <p className="text-[11px] uppercase tracking-wider mt-1" style={{ color: '#52525B' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes showcaseHeroFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes showcaseHeroUnderline {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes showcaseHeroOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(20px, 30px) scale(1.08); }
        }
        @keyframes showcaseHeroOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, 20px) scale(0.95); }
        }
        .showcase-hero-fade-in {
          opacity: 0;
          animation: showcaseHeroFadeIn 720ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .showcase-hero-underline {
          transform-origin: center;
          animation: showcaseHeroUnderline 900ms cubic-bezier(0.22, 0.61, 0.36, 1) 500ms forwards;
          transform: scaleX(0);
        }
        .showcase-hero-orb {
          animation: showcaseHeroOrb 14s ease-in-out infinite;
        }
        .showcase-hero-orb-2 {
          animation: showcaseHeroOrb2 18s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .showcase-hero-fade-in,
          .showcase-hero-underline,
          .showcase-hero-orb,
          .showcase-hero-orb-2 {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
