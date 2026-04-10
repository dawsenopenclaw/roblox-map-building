'use client'

import Link from 'next/link'
import {
  buildShowcaseEditorHref,
  buildShowcaseThumbnailSrc,
  formatBuildTime,
  formatPartCount,
  type ShowcaseGame,
} from '@/lib/showcase-data'

interface ShowcaseCardProps {
  game: ShowcaseGame
  /**
   * "compact" = home page 4-up grid (no features list, no CTA button).
   * "detailed" = /showcase gallery card with features and an explicit CTA.
   */
  variant?: 'compact' | 'detailed'
}

/**
 * Reusable showcase card used by both the landing page preview section and
 * the dedicated /showcase gallery page. Clicking anywhere on the card sends
 * the user to the editor with the original prompt pre-loaded.
 */
export default function ShowcaseCard({ game, variant = 'compact' }: ShowcaseCardProps) {
  const href = buildShowcaseEditorHref(game)
  const thumbnailSrc = buildShowcaseThumbnailSrc(game)
  const isDetailed = variant === 'detailed'
  const accent = game.accentColor

  return (
    <Link
      href={href}
      className="group rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
      style={{
        background: 'rgba(10, 14, 32, 0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = `${accent}55`
        el.style.boxShadow = `inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 24px ${accent}18`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'rgba(255, 255, 255, 0.06)'
        el.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
      }}
      aria-label={`Try the "${game.title}" prompt in the editor`}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{
          height: isDetailed ? 192 : 176,
          background: `linear-gradient(135deg, ${accent}12 0%, #050810 100%)`,
        }}
      >
        {/* Thumbnail image — served by the dynamic 400x300 route at
            src/app/(marketing)/showcase/[slug]/thumbnail.tsx. No static
            files required; the gradient underneath still shows through
            while the image is loading. */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: `url('${thumbnailSrc}')` }}
          aria-hidden="true"
        />

        {/* Accent radial overlay */}
        <div
          className="absolute inset-0 opacity-60 mix-blend-screen"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${accent}20 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${accent}10 0%, transparent 50%)`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Corner badges */}
        <div
          className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full z-10"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            color: accent,
            boxShadow: `0 0 10px ${accent}20`,
            backdropFilter: 'blur(6px)',
          }}
        >
          AI Built
        </div>
        <div
          className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full z-10"
          style={{
            background: 'rgba(5,8,16,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {game.genre}
        </div>

        {/* Bottom gradient fade + title */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 flex items-end p-4"
          style={{
            background:
              'linear-gradient(to top, #0F1535 10%, rgba(15,21,53,0.6) 60%, transparent 100%)',
          }}
        >
          <div>
            <p className="text-base font-bold text-white leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {game.title}
            </p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: `${accent}CC` }}>
              {game.difficulty}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-[13px] leading-relaxed" style={{ color: '#8B95B0' }}>
          {game.description}
        </p>

        {isDetailed && game.features.length > 0 && (
          <ul className="space-y-1 mt-1">
            {game.features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="text-[11.5px] flex items-start gap-1.5"
                style={{ color: '#A8B2CD' }}
              >
                <span
                  className="inline-block w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: accent }}
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Stats row */}
        <div
          className="flex items-center gap-4 pt-2 mt-auto border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span className="text-[11px] flex items-center gap-1.5" style={{ color: '#8B95B0' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span className="text-white/90 font-medium">{formatPartCount(game.stats.parts)}</span>
            parts
          </span>
          <span className="text-[11px] flex items-center gap-1.5" style={{ color: '#8B95B0' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="text-white/90 font-medium">{game.stats.scripts}</span>
            scripts
          </span>
          <span className="text-[11px] flex items-center gap-1.5 ml-auto" style={{ color: '#8B95B0' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-white/90 font-medium">{formatBuildTime(game.stats.buildTimeSec)}</span>
          </span>
        </div>

        {isDetailed && (
          <div
            className="mt-1 flex items-center justify-between gap-2 text-[12px] font-semibold px-3.5 py-2.5 rounded-lg transition-colors"
            style={{
              background: `${accent}12`,
              border: `1px solid ${accent}30`,
              color: accent,
            }}
          >
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Try this prompt
            </span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  )
}
