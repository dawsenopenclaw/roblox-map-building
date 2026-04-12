import * as React from 'react'

interface DripDay3Props {
  name: string
  buildsCompleted: number
}

export const DripDay3Email = ({ name, buildsCompleted }: DripDay3Props) => (
  <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32, background: '#0a0a0f', color: '#fafafa' }}>
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 24 }}>Forje</span>
      <span style={{ fontWeight: 800, fontSize: 24 }}>Games</span>
    </div>

    <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>
      Hey {name} — here&apos;s what other creators are building
    </h1>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 20px' }}>
      You&apos;ve been on ForjeGames for 3 days now{buildsCompleted > 0 ? ` and completed ${buildsCompleted} build${buildsCompleted > 1 ? 's' : ''}` : ''}. Here&apos;s what other creators shipped this week:
    </p>

    <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#D4AF37' }}>Popular builds this week:</p>
      <ul style={{ margin: 0, paddingLeft: 20, color: '#a1a1aa', lineHeight: 2 }}>
        <li><strong style={{ color: '#fafafa' }}>Mining Simulator</strong> — with rebirths, upgrades, and auto-mining</li>
        <li><strong style={{ color: '#fafafa' }}>Medieval Castle</strong> — drawbridge, throne room, torches</li>
        <li><strong style={{ color: '#fafafa' }}>20-Stage Obby</strong> — kill bricks, moving platforms, leaderboard</li>
      </ul>
    </div>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 24px' }}>
      Each of these was built by typing ONE prompt. The AI handles scripts, lighting, leaderstats — everything.
    </p>

    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <a
        href="https://forjegames.com/editor"
        style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 10,
          background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
          color: '#050810', fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}
      >
        Build something right now →
      </a>
    </div>

    <p style={{ color: '#52525b', fontSize: 12, textAlign: 'center', margin: 0 }}>
      You&apos;re on the Free plan with 10 builds/day. <a href="https://forjegames.com/pricing" style={{ color: '#D4AF37' }}>Upgrade</a> for 100+ builds and 3D meshes.
    </p>
  </div>
)

export default DripDay3Email
