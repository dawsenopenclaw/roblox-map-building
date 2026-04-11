import { ImageResponse } from 'next/og'
import { SHOWCASE_GAMES } from '@/lib/showcase-data'

// Generated on-demand at request time instead of at build time. This avoids
// a Satori prerender bug where certain nested flex layouts throw
// "Expected <div> to have explicit display: flex" during `next build`,
// even though the same layout renders correctly at runtime.
export const dynamic = 'force-dynamic'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Per-genre background/accent palettes. Falls back to the ForjeGames gold
 * on brand-default dark if the genre isn't mapped.
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
 * Dynamic 1200x630 OpenGraph card for each showcase game. Rendered at the
 * edge via `next/og` so we don't need to ship 12 static PNGs. Also doubles
 * as the full-size "thumbnail" referenced by `ShowcaseGame.thumbnail`.
 */
export default async function ShowcaseOGImage({
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
          padding: 60,
          background: `linear-gradient(135deg, ${colors.bg} 0%, #000 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header: brand + genre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 28, color: colors.accent, fontWeight: 'bold' }}>
            FORJEGAMES
          </div>
          <div style={{ width: 4, height: 24, background: '#fff', opacity: 0.3 }} />
          <div style={{ fontSize: 22, color: '#fff', opacity: 0.7 }}>
            {game.genre.toUpperCase()}
          </div>
        </div>

        {/* Title + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            {game.title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#fff',
              opacity: 0.85,
              maxWidth: '85%',
            }}
          >
            {game.description}
          </div>
        </div>

        {/* Footer: stats + url */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, color: '#fff', opacity: 0.5 }}>PARTS</div>
              <div
                style={{
                  fontSize: 36,
                  color: colors.accent,
                  fontWeight: 'bold',
                }}
              >
                {game.stats.parts.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, color: '#fff', opacity: 0.5 }}>
                SCRIPTS
              </div>
              <div
                style={{
                  fontSize: 36,
                  color: colors.accent,
                  fontWeight: 'bold',
                }}
              >
                {game.stats.scripts}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, color: '#fff', opacity: 0.5 }}>
                BUILT IN
              </div>
              <div
                style={{
                  fontSize: 36,
                  color: colors.accent,
                  fontWeight: 'bold',
                }}
              >
                {game.stats.buildTimeSec}s
              </div>
            </div>
          </div>
          <div style={{ fontSize: 20, color: '#fff', opacity: 0.6 }}>
            forjegames.com/showcase
          </div>
        </div>
      </div>
    ),
    size,
  )
}

// Intentionally no generateStaticParams — see `dynamic = 'force-dynamic'`
// above. Images are rendered at request time and cached by Vercel's CDN.
