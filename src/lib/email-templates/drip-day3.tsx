import * as React from 'react'

interface DripDay3Props {
  name: string
  buildsCompleted: number
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export const DripDay3Email = ({ name, buildsCompleted }: DripDay3Props) => (
  <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32, background: '#0a0a0a', color: '#fafafa' }}>
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 24 }}>Forje</span>
      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 24 }}>Games</span>
    </div>

    <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>
      {name}, did you try building yet?
    </h1>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 20px' }}>
      {buildsCompleted > 0
        ? `You've already made ${buildsCompleted} build${buildsCompleted > 1 ? 's' : ''} — nice work. Here's what other creators shipped this week:`
        : "Other creators are already shipping games from a single prompt. Here's what they built this week:"}
    </p>

    <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <ul style={{ margin: 0, paddingLeft: 20, color: '#a1a1aa', lineHeight: 2.2 }}>
        <li><strong style={{ color: '#fafafa' }}>Neon Obby Tower</strong> — 50 stages with glowing platforms</li>
        <li><strong style={{ color: '#fafafa' }}>Pizza Tycoon</strong> — upgrades, workers, delivery van</li>
        <li><strong style={{ color: '#fafafa' }}>Haunted Forest RPG</strong> — enemy AI, loot drops, boss fights</li>
        <li><strong style={{ color: '#fafafa' }}>Space Station Escape</strong> — puzzles and zero-gravity zones</li>
      </ul>
    </div>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 24px' }}>
      Each one was built by typing ONE prompt. The AI handles scripts, lighting, terrain — everything.
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
        Open the Editor
      </a>
    </div>

    <div style={{ borderTop: '1px solid #222', paddingTop: 16, textAlign: 'center' }}>
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

export default DripDay3Email
