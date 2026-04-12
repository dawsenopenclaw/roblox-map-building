import * as React from 'react'

interface DripDay7Props {
  name: string
  buildsCompleted: number
  tokensRemaining: number
}

export const DripDay7Email = ({ name, buildsCompleted, tokensRemaining }: DripDay7Props) => (
  <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', maxWidth: 560, margin: '0 auto', padding: 32, background: '#0a0a0f', color: '#fafafa' }}>
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 24 }}>Forje</span>
      <span style={{ fontWeight: 800, fontSize: 24 }}>Games</span>
    </div>

    <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>
      {name}, you&apos;ve built {buildsCompleted} thing{buildsCompleted !== 1 ? 's' : ''} in a week
    </h1>

    <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: '0 0 20px' }}>
      That&apos;s awesome. {tokensRemaining < 200 ? `You have ${tokensRemaining} tokens left — ` : ''}Here&apos;s what unlocks when you upgrade:
    </p>

    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <th style={{ textAlign: 'left', padding: '8px 0', color: '#71717a', fontSize: 12, fontWeight: 600 }}>Feature</th>
          <th style={{ textAlign: 'center', padding: '8px 0', color: '#71717a', fontSize: 12, fontWeight: 600 }}>Free</th>
          <th style={{ textAlign: 'center', padding: '8px 0', color: '#D4AF37', fontSize: 12, fontWeight: 600 }}>Starter $9.99</th>
        </tr>
      </thead>
      <tbody style={{ color: '#a1a1aa', fontSize: 13 }}>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <td style={{ padding: '10px 0' }}>Builds per day</td>
          <td style={{ textAlign: 'center', padding: '10px 0' }}>10</td>
          <td style={{ textAlign: 'center', padding: '10px 0', color: '#D4AF37', fontWeight: 600 }}>100</td>
        </tr>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <td style={{ padding: '10px 0' }}>3D mesh generation</td>
          <td style={{ textAlign: 'center', padding: '10px 0' }}>—</td>
          <td style={{ textAlign: 'center', padding: '10px 0', color: '#4ade80' }}>✓</td>
        </tr>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <td style={{ padding: '10px 0' }}>Studio auto-sync</td>
          <td style={{ textAlign: 'center', padding: '10px 0' }}>—</td>
          <td style={{ textAlign: 'center', padding: '10px 0', color: '#4ade80' }}>✓</td>
        </tr>
        <tr>
          <td style={{ padding: '10px 0' }}>Marketplace selling</td>
          <td style={{ textAlign: 'center', padding: '10px 0' }}>—</td>
          <td style={{ textAlign: 'center', padding: '10px 0', color: '#4ade80' }}>✓</td>
        </tr>
      </tbody>
    </table>

    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <a
        href="https://forjegames.com/pricing"
        style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 10,
          background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
          color: '#050810', fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}
      >
        Upgrade and keep building →
      </a>
    </div>

    <p style={{ color: '#52525b', fontSize: 12, textAlign: 'center', margin: '0 0 8px' }}>
      No contracts. Cancel anytime. 10% donated to education charities.
    </p>

    <p style={{ color: '#52525b', fontSize: 11, textAlign: 'center', margin: 0 }}>
      <a href="https://forjegames.com/referrals" style={{ color: '#D4AF37' }}>Share with a friend</a> — you both get 500 bonus tokens.
    </p>
  </div>
)

export default DripDay7Email
