import * as React from 'react'

interface DripDay7Props {
  name: string
  buildsCompleted: number
  tokensRemaining: number
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const DripDay7Email = ({ name, buildsCompleted, tokensRemaining }: DripDay7Props) => (
  <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32, background: '#0a0a0a', color: '#fafafa' }}>
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 24 }}>Forje</span>
      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 24 }}>Games</span>
    </div>

    <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>
      Builders like you are creating games, {name}
    </h1>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 20px' }}>
      It&apos;s been a week since you joined. Creators on ForjeGames have shipped hundreds of
      games — obbies, tycoons, RPGs, horror maps. Every one started as a text prompt.
    </p>

    {buildsCompleted > 0 ? (
      <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', color: '#D4AF37', fontWeight: 700, fontSize: 28 }}>
          {buildsCompleted}
        </p>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: 14 }}>
          build{buildsCompleted !== 1 ? 's' : ''} created so far
        </p>
      </div>
    ) : (
      <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: 14, textAlign: 'center' }}>
          You haven&apos;t built anything yet — your {tokensRemaining} tokens are waiting.
        </p>
      </div>
    )}

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 8px' }}>
      What you get on the free plan:
    </p>
    <ul style={{ margin: '0 0 20px', paddingLeft: 20, color: '#a1a1aa', lineHeight: 2 }}>
      <li><strong style={{ color: '#D4AF37' }}>10 builds/day</strong> — resets at midnight</li>
      <li><strong style={{ color: '#D4AF37' }}>200+ AI agents</strong> — each one specializes in a different part of your game</li>
      <li><strong style={{ color: '#D4AF37' }}>200+ templates</strong> — obbies, tycoons, RPGs, and more</li>
    </ul>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 24px' }}>
      No scripting, no 3D modeling, no hours in Studio. Just type what you want.
    </p>

    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <a
        href={`${baseUrl}/editor`}
        style={{
          display: 'inline-block', padding: '14px 36px', borderRadius: 10,
          background: '#D4AF37',
          color: '#0a0a0a', fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}
      >
        Build Something Now
      </a>
    </div>

    {tokensRemaining < 200 && (
      <p style={{ color: '#52525b', fontSize: 13, textAlign: 'center', margin: '0 0 16px' }}>
        Only {tokensRemaining} tokens left. <a href={`${baseUrl}/pricing`} style={{ color: '#D4AF37' }}>Upgrade</a> for more.
      </p>
    )}

    <div style={{ borderTop: '1px solid #222', paddingTop: 16, textAlign: 'center' }}>
      <p style={{ color: '#52525b', fontSize: 12, margin: '0 0 4px' }}>
        No contracts. Cancel anytime. 10% goes to education charities.
      </p>
      <p style={{ color: '#52525b', fontSize: 12, margin: '0 0 4px' }}>
        <a href={`${baseUrl}/unsubscribe`} style={{ color: '#666' }}>Unsubscribe</a>
        {' · '}
        <a href={`${baseUrl}/privacy`} style={{ color: '#666' }}>Privacy</a>
      </p>
      <p style={{ color: '#3f3f46', fontSize: 11, margin: 0 }}>
        ForjeGames LLC &middot; 2261 Market Street #4671 &middot; San Francisco, CA 94114
      </p>
    </div>
  </div>
)

export default DripDay7Email
