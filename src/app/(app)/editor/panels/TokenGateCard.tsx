'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/notifications'

const TIERS = [
  {
    name: 'Free',
    tokens: '1,000',
    price: null,
    highlight: false,
    description: 'Included with every account',
  },
  {
    name: 'Creator',
    tokens: '50,000 / mo',
    price: '$15',
    highlight: true,
    description: 'Best for active builders',
  },
  {
    name: 'Studio',
    tokens: '200,000 / mo',
    price: '$50',
    highlight: false,
    description: 'Teams & power users',
  },
]

export default function TokenGateCard() {
  const router = useRouter()
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(9,9,11,0.98) 60%)',
        border: '1px solid rgba(212,175,55,0.22)',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '460px',
        boxShadow: '0 0 40px rgba(212,175,55,0.06), 0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          ⚡
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>
            You&apos;re out of tokens
          </p>
          <p style={{ fontSize: '12px', color: '#71717a', margin: 0, marginTop: '1px' }}>
            Upgrade to keep building without interruption
          </p>
        </div>
      </div>

      {/* Tier cards */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            style={{
              flex: 1,
              borderRadius: '10px',
              padding: '12px 10px',
              background: tier.highlight
                ? 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.06))'
                : 'rgba(255,255,255,0.03)',
              border: tier.highlight
                ? '1px solid rgba(212,175,55,0.4)'
                : '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
              textAlign: 'center' as const,
            }}
          >
            {tier.highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: '-9px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#D4AF37',
                  color: '#09090b',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                Most popular
              </div>
            )}
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: tier.highlight ? '#D4AF37' : '#a1a1aa',
                margin: 0,
                marginBottom: '4px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
              }}
            >
              {tier.name}
            </p>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#f4f4f5',
                margin: 0,
                marginBottom: '2px',
              }}
            >
              {tier.tokens}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: tier.highlight ? '#D4AF37' : '#52525b',
                margin: 0,
                fontWeight: tier.price ? 600 : 400,
              }}
            >
              {tier.price ?? 'Free'}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/pricing"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, #D4AF37, #D4AF37)',
          color: '#09090b',
          fontWeight: 700,
          fontSize: '13px',
          textDecoration: 'none',
          boxSizing: 'border-box' as const,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
      >
        Upgrade Now
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Free alternatives */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() =>
            showToast({
              type: 'info',
              title: 'Coming soon',
              message: 'Rewarded ads will be available in a future update.',
            })
          }
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#71717a',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.18)'
            el.style.color = '#a1a1aa'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.08)'
            el.style.color = '#71717a'
          }}
        >
          Watch an ad
          <span style={{ marginLeft: '4px', opacity: 0.5 }}>(+50 tokens)</span>
        </button>
        <button
          onClick={() => router.push('/referrals')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#71717a',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.18)'
            el.style.color = '#a1a1aa'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.08)'
            el.style.color = '#71717a'
          }}
        >
          Invite a friend
          <span style={{ marginLeft: '4px', opacity: 0.5 }}>(+200 tokens)</span>
        </button>
      </div>
    </div>
  )
}
