import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const BG = '#0A0E27'
const GOLD = '#FFB81C'
const DARK_CARD = '#0D1231'
const GRAY = '#9CA3AF'

// Tier colors
const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFB81C',
  PLATINUM: '#60A5FA',
  DIAMOND: '#A78BFA',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'default'
  const name = searchParams.get('name') ?? ''
  const creator = searchParams.get('creator') ?? ''
  const rating = parseFloat(searchParams.get('rating') ?? '0')
  const price = searchParams.get('price') ?? 'Free'
  const score = searchParams.get('score') ?? '0'
  const username = searchParams.get('username') ?? ''
  const tier = (searchParams.get('tier') ?? 'BRONZE').toUpperCase()
  const xp = searchParams.get('xp') ?? '0'
  const sales = searchParams.get('sales') ?? '0'

  const tierColor = TIER_COLORS[tier] ?? GOLD

  // Render stars as unicode
  function renderStars(r: number) {
    const full = Math.round(r)
    return Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('')
  }

  if (type === 'template') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: BG,
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Gold top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: GOLD,
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: GOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#000',
              }}
            >
              R
            </div>
            <span style={{ color: GRAY, fontSize: 18, letterSpacing: 2 }}>ROBLOXFORGE MARKETPLACE</span>
          </div>

          {/* Template name */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                fontSize: name.length > 40 ? 42 : 56,
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.1,
                marginBottom: 24,
                maxWidth: 900,
              }}
            >
              {name || 'Untitled Template'}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              {creator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: DARK_CARD,
                      border: `2px solid ${GOLD}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: GOLD,
                    }}
                  >
                    {creator.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: GRAY, fontSize: 18 }}>by {creator}</span>
                </div>
              )}
              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: GOLD, fontSize: 20 }}>{renderStars(rating)}</span>
                  <span style={{ color: GRAY, fontSize: 18 }}>{rating.toFixed(1)}</span>
                </div>
              )}
              <div
                style={{
                  background: price === 'Free' ? 'rgba(52,211,153,0.15)' : `${GOLD}20`,
                  border: `1px solid ${price === 'Free' ? 'rgba(52,211,153,0.3)' : GOLD + '40'}`,
                  borderRadius: 8,
                  padding: '6px 16px',
                  color: price === 'Free' ? '#34D399' : GOLD,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {price === 'Free' ? 'FREE' : `$${price}`}
              </div>
            </div>
          </div>

          {/* Bottom label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 }}>
            <span style={{ color: GRAY, fontSize: 14 }}>robloxforge.gg</span>
            <span style={{ color: GRAY, fontSize: 14 }}>Roblox Template Marketplace</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  if (type === 'game-dna') {
    const scoreNum = parseInt(score, 10)
    const scoreColor = scoreNum >= 80 ? '#34D399' : scoreNum >= 60 ? GOLD : '#F87171'

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: BG,
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Gold top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'linear-gradient(90deg, #FFB81C, #A78BFA)',
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: GOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#000',
              }}
            >
              R
            </div>
            <span style={{ color: GRAY, fontSize: 18, letterSpacing: 2 }}>ROBLOXFORGE GAME DNA</span>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: 60, alignItems: 'center' }}>
            {/* Left: game info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: GRAY, fontSize: 16, marginBottom: 12, letterSpacing: 1 }}>DNA ANALYSIS REPORT</div>
              <div
                style={{
                  fontSize: name.length > 30 ? 46 : 58,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: 24,
                }}
              >
                {name || 'Unknown Game'}
              </div>
              <div style={{ color: GRAY, fontSize: 18 }}>
                Full genome breakdown + strategic recommendations
              </div>
            </div>

            {/* Right: score circle */}
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: `8px solid ${scoreColor}`,
                background: `${scoreColor}15`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 64, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 18, color: GRAY, marginTop: 6 }}>/ 100</div>
              <div style={{ fontSize: 14, color: scoreColor, marginTop: 4, fontWeight: 600 }}>DNA SCORE</div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
            <span style={{ color: GRAY, fontSize: 14 }}>robloxforge.gg</span>
            <span style={{ color: GRAY, fontSize: 14 }}>AI-Powered Game Analysis</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  if (type === 'profile') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: BG,
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Top bar with tier color */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: tierColor,
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: GOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#000',
              }}
            >
              R
            </div>
            <span style={{ color: GRAY, fontSize: 18, letterSpacing: 2 }}>ROBLOXFORGE CREATOR</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 60 }}>
            {/* Avatar placeholder */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: DARK_CARD,
                border: `4px solid ${tierColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                fontWeight: 800,
                color: tierColor,
                flexShrink: 0,
              }}
            >
              {(username || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: '#FFFFFF' }}>
                {username || 'Creator'}
              </div>
              {/* Tier badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    background: `${tierColor}20`,
                    border: `1px solid ${tierColor}60`,
                    borderRadius: 6,
                    padding: '4px 14px',
                    color: tierColor,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  {tier}
                </div>
                <span style={{ color: GRAY, fontSize: 18 }}>{parseInt(xp).toLocaleString()} XP</span>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: GOLD, fontSize: 28, fontWeight: 700 }}>{parseInt(sales).toLocaleString()}</span>
                  <span style={{ color: GRAY, fontSize: 14 }}>Total Sales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
            <span style={{ color: GRAY, fontSize: 14 }}>robloxforge.gg</span>
            <span style={{ color: GRAY, fontSize: 14 }}>Roblox Creator Platform</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Default
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: GOLD,
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            background: GOLD,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 900,
            color: '#000',
            marginBottom: 40,
          }}
        >
          R
        </div>

        <div style={{ fontSize: 72, fontWeight: 900, color: '#FFFFFF', letterSpacing: -2 }}>
          RobloxForge
        </div>
        <div style={{ fontSize: 26, color: GRAY, marginTop: 16, textAlign: 'center', maxWidth: 700 }}>
          The professional platform for Roblox creators.
          <br />
          Build, analyze, and sell game assets.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {['Game DNA Analysis', 'Template Marketplace', 'Creator Earnings'].map((label) => (
            <div
              key={label}
              style={{
                background: `${GOLD}15`,
                border: `1px solid ${GOLD}30`,
                borderRadius: 24,
                padding: '8px 20px',
                color: GOLD,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 32, color: GRAY, fontSize: 14 }}>
          robloxforge.gg
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
