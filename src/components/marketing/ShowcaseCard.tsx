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
      {/* Thumbnail — styled to look like a real Roblox in-game screenshot */}
      <div
        className="relative overflow-hidden"
        style={{
          height: isDetailed ? 192 : 176,
          background: `linear-gradient(180deg, ${accent}30 0%, ${accent}15 35%, #0A0E20 75%, #050810 100%)`,
        }}
      >
        {/* Thumbnail image — served by the dynamic 400x300 route at
            src/app/(marketing)/showcase/[slug]/thumbnail.tsx. No static
            files required; the rich fallback beneath still shows through
            while the image is loading. */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: `url('${thumbnailSrc}')` }}
          aria-hidden="true"
        />

        {/* Sky / horizon gradient (suggests a skybox behind low-poly terrain) */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${accent}40 0%, ${accent}15 60%, transparent 100%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Low-poly isometric "terrain" suggestion using SVG */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full opacity-55 pointer-events-none"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ height: '55%' }}
        >
          <defs>
            <linearGradient id={`terrain-${game.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
              <stop offset="100%" stopColor="#050810" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          {/* Back mountain layer */}
          <polygon
            points="0,80 60,40 110,70 170,30 230,65 300,25 360,60 400,45 400,120 0,120"
            fill={`${accent}22`}
          />
          {/* Mid layer */}
          <polygon
            points="0,95 50,70 100,90 150,60 210,85 270,55 330,80 400,65 400,120 0,120"
            fill={`${accent}33`}
          />
          {/* Front layer */}
          <polygon
            points="0,110 40,90 90,105 140,85 200,105 260,88 320,102 400,90 400,120 0,120"
            fill={`url(#terrain-${game.id})`}
          />
        </svg>

        {/* Accent radial overlay — like a sun/light source */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-screen pointer-events-none"
          style={{
            background: `radial-gradient(circle at 75% 22%, ${accent}55 0%, ${accent}15 25%, transparent 55%), radial-gradient(ellipse at 30% 90%, ${accent}20 0%, transparent 55%)`,
          }}
        />

        {/* Isometric grid pattern (simulates Roblox baseplate studs) */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'linear-gradient(180deg, transparent 30%, black 60%, black 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 30%, black 60%, black 100%)',
          }}
        />

        {/* Faux HUD — health bar (top-left under genre badge) */}
        <div
          className="absolute left-3 z-10 pointer-events-none"
          style={{ top: 38 }}
          aria-hidden="true"
        >
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{
              background: 'rgba(5,8,16,0.55)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#EF4444" aria-hidden="true">
              <path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-10 11-10 11z" />
            </svg>
            <div
              className="relative w-12 h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: '78%', background: 'linear-gradient(90deg, #22C55E, #4ADE80)' }}
              />
            </div>
          </div>
        </div>

        {/* Faux HUD — mini-map (top-right under "AI Built") */}
        <div
          className="absolute right-3 z-10 pointer-events-none"
          style={{ top: 38 }}
          aria-hidden="true"
        >
          <div
            className="relative w-10 h-10 rounded-md overflow-hidden"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, rgba(5,8,16,0.75) 80%)`,
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: `inset 0 0 8px ${accent}30`,
            }}
          >
            {/* player dot */}
            <div
              className="absolute rounded-full"
              style={{
                top: '50%',
                left: '50%',
                width: 3,
                height: 3,
                transform: 'translate(-50%, -50%)',
                background: '#FAFAFA',
                boxShadow: '0 0 4px #FAFAFA',
              }}
            />
            {/* crosshair lines */}
            <div className="absolute inset-x-1 top-1/2 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="absolute inset-y-1 left-1/2 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>

        {/* Scanline / film grain for a rendered-game feel */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
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
