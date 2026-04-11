import { ImageResponse } from 'next/og'
import { SHOWCASE_GAMES } from '@/lib/showcase-data'

// Generated on-demand at request time instead of at build time. See the
// matching opengraph-image.tsx for details — avoids a Satori prerender bug
// where nested flex columns occasionally fail the build-time layout check.
export const dynamic = 'force-dynamic'
export const size = { width: 400, height: 300 }
export const contentType = 'image/png'

/**
 * Per-genre background/accent palettes. Kept in sync with opengraph-image.tsx
 * so the small card thumbnail matches the large OG image.
 */
const GENRE_COLORS: Record<string, { bg: string; accent: string }> = {
  RPG: { bg: '#1a0033', accent: '#9333ea' },
  Tycoon: { bg: '#003319', accent: '#10b981' },
  Obby: { bg: '#331a00', accent: '#f59e0b' },
  Simulator: { bg: '#001a33', accent: '#3b82f6' },
  Racing: { bg: '#330000', accent: '#ef4444' },
  Horror: { bg: '#1a0000', accent: '#dc2626' },
  'Sci-Fi': { bg: '#002233', accent: '#06b6d4' },
  Adventure: { bg: '#001a00', accent: '#84cc16' },
}

/**
 * 400x300 card thumbnail — a compact version of the OG image used by
 * `ShowcaseCard`. Same template as the 1200x630 variant but tighter
 * typography and no footer stats row.
 */
export default async function ShowcaseThumbnail({
  params,
}: {
  params: { slug: string }
}) {
  const game =
    SHOWCASE_GAMES.find((g) => g.id === params.slug) ?? SHOWCASE_GAMES[0]
  const colors = GENRE_COLORS[game.genre] ?? { bg: '#0a0a0f', accent: '#D4AF37' }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 24,
          background: `linear-gradient(135deg, ${colors.bg} 0%, #000 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              color: colors.accent,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            FORJEGAMES
          </div>
          <div
            style={{ width: 2, height: 12, background: '#fff', opacity: 0.3 }}
          />
          <div
            style={{
              fontSize: 11,
              color: '#fff',
              opacity: 0.7,
              letterSpacing: 0.5,
            }}
          >
            {game.genre.toUpperCase()}
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 1.05,
            }}
          >
            {game.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#fff',
              opacity: 0.8,
              maxWidth: '95%',
              lineHeight: 1.35,
            }}
          >
            {game.description}
          </div>
        </div>

        {/* Stat chip */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            fontSize: 11,
            color: colors.accent,
            fontWeight: 'bold',
          }}
        >
          <div style={{ display: 'flex' }}>
            {game.stats.parts.toLocaleString()} PARTS
          </div>
          <div style={{ display: 'flex', opacity: 0.6, color: '#fff' }}>•</div>
          <div style={{ display: 'flex' }}>{game.stats.scripts} SCRIPTS</div>
          <div style={{ display: 'flex', opacity: 0.6, color: '#fff' }}>•</div>
          <div style={{ display: 'flex' }}>{game.stats.buildTimeSec}s</div>
        </div>
      </div>
    ),
    size,
  )
}

// Intentionally no generateStaticParams — see `dynamic = 'force-dynamic'`
// above. Thumbnails are rendered at request time and CDN-cached.
