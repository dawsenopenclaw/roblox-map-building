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

// ─── Example prompt cards for empty state ──────────────────────────────
const EXAMPLE_PROMPT_CARDS = [
  { emoji: '\u{1F3E0}', label: 'Build me a house', prompt: 'Build me a house' },
  { emoji: '\u{1F680}', label: 'Make a spaceship', prompt: 'Make a spaceship' },
  { emoji: '\u{1F3AE}', label: 'Create a tycoon game', prompt: 'Create a tycoon game' },
  { emoji: '\u{1F6D2}', label: 'Add a shop system', prompt: 'Add a shop system' },
  { emoji: '\u{1F3F0}', label: 'Build a medieval castle', prompt: 'Build a medieval castle' },
  { emoji: '\u{1F3C1}', label: 'Make me an obby', prompt: 'Make me an obby with checkpoints' },
  { emoji: '\u{1FA81}', label: 'Build a helicopter', prompt: 'Build a helicopter' },
  { emoji: '\u{1F332}', label: 'Create a forest scene', prompt: 'Create a forest scene' },
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
          fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.5rem)' : 'clamp(2.4rem, 4vw, 3.2rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: '#FAFAFA',
          margin: 0,
          textShadow: '0 0 40px rgba(212,175,55,0.08)',
        }}>
          What do you want to build?
        </h1>
        <p style={{
          marginTop: 14,
          fontSize: 16,
          color: '#71717A',
          maxWidth: 460,
          margin: '14px auto 0',
          lineHeight: 1.6,
        }}>
          Describe anything. Forje builds your <RotatingWord3D /> and syncs to Studio.
        </p>
      </div>

      {/* ─── Quick-start card grid ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 14,
        maxWidth: 780,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {QUICK_CARDS.map((card, i) => {
          const isHovered = hoveredCard === i
          return (
            <button
              key={card.title}
              onClick={() => {
                if (card.title === 'Plan a Game') {
                  if (onBuildGame) {
                    onBuildGame(card.prompt)
                  } else {
                    onQuickAction(card.prompt, true)
                  }
                } else if (card.title === 'Free Build') {
                  // Focus the input — don't send empty string
                  onQuickAction('', false)
                } else {
                  onQuickAction(card.prompt, card.autoSend !== false)
                }
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 10,
                padding: '18px 20px',
                borderRadius: 18,
                border: `1px solid ${isHovered ? `${card.color}50` : 'rgba(255,255,255,0.06)'}`,
                background: isHovered
                  ? `rgba(${hexToRgb(card.color)}, 0.06)`
                  : 'rgba(12,15,28,0.5)',
                backdropFilter: 'blur(16px)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'inherit',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered
                  ? `0 12px 32px rgba(0,0,0,0.35), 0 0 20px rgba(${hexToRgb(card.color)}, 0.08), inset 0 1px 0 rgba(255,255,255,0.06)`
                  : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isHovered
                  ? `rgba(${hexToRgb(card.color)}, 0.15)`
                  : `rgba(${hexToRgb(card.color)}, 0.08)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s',
                boxShadow: isHovered ? `0 0 16px rgba(${hexToRgb(card.color)}, 0.12)` : 'none',
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 650,
                  color: isHovered ? '#FAFAFA' : '#E4E4E7',
                  marginBottom: 4, transition: 'color 0.2s',
                  letterSpacing: '-0.01em',
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: 12, lineHeight: 1.5,
                  color: isHovered ? '#A1A1AA' : '#52525B',
                  transition: 'color 0.2s',
                }}>
                  {card.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ─── Try These Prompts — 2-column card grid ─── */}
      <div style={{
        maxWidth: 780,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{ fontSize: 11, color: '#52525B', marginBottom: 10, textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          Or try one of these
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: 8,
        }}>
          {EXAMPLE_PROMPT_CARDS.map((card, i) => (
            <button
              key={card.prompt}
              onClick={() => onQuickAction(card.prompt, true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(12,15,28,0.4)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                fontFamily: 'inherit',
                animation: `msgFadeUp 0.3s ease-out ${i * 0.04}s both`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25), 0 0 12px rgba(212,175,55,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.background = 'rgba(12,15,28,0.4)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{card.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E4E4E7', marginBottom: 2 }}>{card.label}</div>
                <div style={{ fontSize: 10, color: '#52525B', fontWeight: 500 }}>Try this</div>
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
