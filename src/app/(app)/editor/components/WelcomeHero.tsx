'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'

// ─── 3D Rotating word ring ──────────────────────────────────────────────
const ROTATING_WORDS = ['Game', 'Map', 'World', 'Obby', 'Tycoon', 'RPG', 'UI']
const ROTATE_INTERVAL = 2200

function RotatingWord3D() {
  const [index, setIndex] = useState(0)
  const [animClass, setAnimClass] = useState('word-enter')

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimClass('word-exit')
      setTimeout(() => {
        setIndex(i => (i + 1) % ROTATING_WORDS.length)
        setAnimClass('word-enter')
      }, 400)
    }, ROTATE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <style>{`
        .word-enter {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
        }
        .word-exit {
          opacity: 0;
          transform: translateY(-20px) rotateX(40deg);
          transition: opacity 0.3s ease-in, transform 0.3s ease-in;
        }
      `}</style>
      <span
        className={animClass}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 50%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          willChange: 'transform, opacity',
          perspective: '600px',
          filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.3))',
        }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </>
  )
}

// ─── Floating Orbs Background ───────────────────────────────────────────
function FloatingOrbs() {
  return (
    <>
      <style>{`
        @keyframes orbDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(80px, -40px) scale(1.1); }
          50%  { transform: translate(160px, 20px) scale(0.95); }
          75%  { transform: translate(60px, 60px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(-60px, 50px) scale(1.08); }
          50%  { transform: translate(-120px, -20px) scale(0.92); }
          75%  { transform: translate(-40px, -60px) scale(1.04); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(100px, 50px) scale(1.06); }
          66%  { transform: translate(-50px, -30px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        {/* Gold orb — top left */}
        <div style={{
          position: 'absolute',
          top: '10%', left: '8%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 50%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orbDrift1 25s ease-in-out infinite, orbPulse 8s ease-in-out infinite',
        }} />
        {/* Blue orb — top right */}
        <div style={{
          position: 'absolute',
          top: '5%', right: '12%',
          width: 260, height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, rgba(96,165,250,0.015) 50%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orbDrift2 30s ease-in-out infinite, orbPulse 10s ease-in-out 2s infinite',
        }} />
        {/* Purple orb — center */}
        <div style={{
          position: 'absolute',
          top: '40%', left: '35%',
          width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, rgba(124,58,237,0.01) 50%, transparent 70%)',
          filter: 'blur(45px)',
          animation: 'orbDrift3 20s ease-in-out infinite, orbPulse 7s ease-in-out 1s infinite',
        }} />
        {/* Gold orb — bottom right */}
        <div style={{
          position: 'absolute',
          bottom: '15%', right: '20%',
          width: 240, height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.015) 50%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orbDrift1 35s ease-in-out infinite reverse, orbPulse 9s ease-in-out 3s infinite',
        }} />
        {/* Cyan orb — bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '10%', left: '15%',
          width: 160, height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(6,182,212,0.01) 50%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orbDrift2 28s ease-in-out infinite reverse, orbPulse 6s ease-in-out 4s infinite',
        }} />
      </div>
    </>
  )
}

// ─── Quick-start cards — just 2 clear options ──────────────────────────
const QUICK_CARDS = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    title: 'Plan a Game',
    description: 'Tell the AI your idea — it plans every phase, then builds it step by step',
    prompt: 'Let\'s plan a game together',
    color: '#D4AF37',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: 'Free Build',
    description: 'Build anything — castles, spaceships, terrain, scripts, UI, whatever you want',
    prompt: '',
    autoSend: false,
    color: '#22C55E',
  },
]

// ─── 6-card action grid (matches the screenshot layout) ──────────────
const ACTION_CARDS = [
  {
    title: 'Build a Game',
    description: 'Tycoon, obby, simulator, RPG — pick a genre and go',
    prompt: 'Let\'s plan a game together',
    iconColor: '#D4AF37',
    iconBg: 'rgba(212,175,55,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 3v18M3 9h18" />
      </svg>
    ),
  },
  {
    title: 'Write a Script',
    description: 'Leaderboards, shops, combat, doors — any game logic',
    prompt: '',
    autoSend: false,
    iconColor: '#7C3AED',
    iconBg: 'rgba(124,58,237,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 18l2-2-2-2" /><path d="M8 18l-2-2 2-2" /><path d="M14 4l-4 16" />
      </svg>
    ),
  },
  {
    title: 'Generate an Image',
    description: 'Thumbnails, icons, decals, textures — any style',
    prompt: '',
    autoSend: false,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    title: 'Create 3D Model',
    description: 'Weapons, characters, props — AI mesh generation',
    prompt: '',
    autoSend: false,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11z" /><path d="M12 22V11" /><path d="M20 6.5L12 11 4 6.5" />
      </svg>
    ),
  },
  {
    title: 'Design Terrain',
    description: 'Islands, mountains, cities — natural landscapes',
    prompt: '',
    autoSend: false,
    iconColor: '#06B6D4',
    iconBg: 'rgba(6,182,212,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 22L12 2l10 20H2z" /><path d="M7 17h10" /><path d="M9 13h6" />
      </svg>
    ),
  },
  {
    title: 'Get Game Advice',
    description: 'Monetization, design, marketing — expert guidance',
    prompt: '',
    autoSend: false,
    iconColor: '#EC4899',
    iconBg: 'rgba(236,72,153,0.12)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="#EC4899" />
      </svg>
    ),
  },
] as const

interface WelcomeHeroProps {
  visible: boolean
  onQuickAction: (prompt: string, autoSend: boolean) => void
  onBuildGame?: (prompt: string) => void
}

export function WelcomeHero({ visible, onQuickAction, onBuildGame }: WelcomeHeroProps) {
  const isMobile = useIsMobile()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  if (!visible) return null

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem 1.5rem',
        gap: isMobile ? '1.5rem' : '2.5rem',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Floating orbs */}
      <FloatingOrbs />

      {/* ─── Heading ─── */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.5rem)' : 'clamp(2.2rem, 3.5vw, 2.8rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: '#FAFAFA',
          margin: 0,
        }}>
          What are we building?
        </h1>
        <p style={{
          marginTop: 10,
          fontSize: 15,
          color: '#52525B',
          maxWidth: 500,
          margin: '10px auto 0',
          lineHeight: 1.6,
        }}>
          Pick an option or type anything below. The AI handles the rest.
        </p>
      </div>

      {/* ─── 6-card action grid (full width, even height) ─── */}
      <div style={{ maxWidth: 900, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
        }}>
          {ACTION_CARDS.map((card, i) => (
            <button
              key={card.title}
              onClick={() => {
                if (card.title === 'Build a Game') {
                  if (onBuildGame) onBuildGame(card.prompt)
                  else onQuickAction(card.prompt, true)
                } else {
                  onQuickAction(card.prompt, card.autoSend !== false)
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 14,
                padding: '22px 20px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(10,14,28,0.55)',
                backdropFilter: 'blur(24px)',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                fontFamily: 'inherit',
                animation: `msgFadeUp 0.3s ease-out ${i * 0.05}s both`,
                minHeight: isMobile ? 'auto' : 130,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${card.iconColor}40`
                e.currentTarget.style.background = `${card.iconColor}06`
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.35), 0 0 20px ${card.iconColor}08`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.background = 'rgba(10,14,28,0.55)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E4E4E7', marginBottom: 5, letterSpacing: '-0.01em' }}>{card.title}</div>
                <div style={{ fontSize: 12, color: '#52525B', lineHeight: 1.5 }}>{card.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Hint ─── */}
      <p style={{ fontSize: 11, color: '#3F3F46', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        Type below to start &middot;{' '}
        <kbd style={{
          padding: '2px 6px', borderRadius: 5,
          border: '1px solid #27272A', background: '#18181B', fontSize: 10,
        }}>Ctrl+K</kbd> for commands
      </p>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '212,175,55'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
