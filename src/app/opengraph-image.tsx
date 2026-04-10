import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ForjeGames — AI-Powered Roblox Game Development'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 100,
            fontWeight: 'bold',
            color: '#D4AF37',
            marginBottom: 20,
          }}
        >
          ForjeGames
        </div>
        <div style={{ fontSize: 40, color: '#fff', opacity: 0.9 }}>
          Describe it. Forje it.
        </div>
        <div style={{ fontSize: 24, color: '#aaa', marginTop: 30 }}>
          AI-Powered Roblox Game Development
        </div>
      </div>
    ),
    size,
  )
}
