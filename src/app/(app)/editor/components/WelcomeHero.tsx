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

// ─── Quick-start cards ──────────────────────────────────────────────────
const QUICK_CARDS = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 3v18M3 9h18" />
        <path d="M14 14l3 3M14 17l3-3" />
      </svg>
    ),
    title: 'Build a Game',
    description: 'Tycoon, obby, simulator, RPG — pick a genre and go',
    prompt: '/plan Build me a complete game. What genre should we start with?',
    color: '#D4AF37',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 18l2-2-2-2" />
        <path d="M8 18l-2-2 2-2" />
        <path d="M14 4l-4 16" />
      </svg>
    ),
    title: 'Write a Script',
    description: 'Leaderboards, shops, combat, doors — any game logic',
    prompt: 'Write a script that ',
    autoSend: false,
    color: '#7C3AED',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
    title: 'Generate an Image',
    description: 'Thumbnails, icons, decals, textures — any style',
    prompt: '/image ',
    autoSend: false,
    color: '#10B981',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
    title: 'Create 3D Model',
    description: 'Weapons, characters, props — AI mesh generation',
    prompt: '/mesh ',
    autoSend: false,
    color: '#F59E0B',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 22L12 2l10 20H2z" />
        <path d="M7 17h10" />
        <path d="M9 13h6" />
      </svg>
    ),
    title: 'Design Terrain',
    description: 'Islands, mountains, cities — natural landscapes',
    prompt: '/terrain Generate natural terrain with ',
    autoSend: false,
    color: '#06B6D4',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" fill="#EC4899" />
      </svg>
    ),
    title: 'Get Game Advice',
    description: 'Monetization, design, marketing — expert guidance',
    prompt: '/think I need advice on ',
    autoSend: false,
    color: '#EC4899',
  },
]

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
                if (card.title === 'Build a Game' && onBuildGame) {
                  onBuildGame(card.prompt)
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

      {/* ─── Try These Prompts ─── */}
      <div style={{
        maxWidth: 780,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{ fontSize: 11, color: '#52525B', marginBottom: 8, textAlign: 'center', fontWeight: 600 }}>
          Try a prompt
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          justifyContent: 'center',
        }}>
          {[
            'Build a medieval castle with a throne room',
            'Create a combat system with abilities',
            'Make an obby with checkpoints and timer',
            'Build a horror atmosphere with jump scares',
            'Create a racing system with leaderboards',
            'Build a pet following system',
            'Add an inventory with equippable items',
            'Create an NPC dialogue system',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => onQuickAction(prompt, true)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: '#71717A',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                e.currentTarget.style.color = '#D4AF37'
                e.currentTarget.style.background = 'rgba(212,175,55,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#71717A'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              {prompt}
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
