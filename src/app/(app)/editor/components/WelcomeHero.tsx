'use client'

import { useState, useEffect, useRef } from 'react'

// ─── 3D Rotating word ring (matches homepage) ──────────────────────────────
const ROTATING_WORDS = ['Game', 'Map', 'World', 'Obby', 'Tycoon', 'RPG', 'UI']
const ROTATE_INTERVAL = 2200

function RotatingWord3D() {
  const [index, setIndex] = useState(0)
  const [animClass, setAnimClass] = useState('word-enter')

  useEffect(() => {
    const timer = setInterval(() => {
      // Slide out
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
        }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </>
  )
}

// ─── Animated demo — simulates a real AI build conversation ─────────────────
const DEMO_STEPS = [
  { type: 'user' as const, text: 'Build me a pirate ship with cannons and sails' },
  { type: 'thinking' as const, text: 'Planning build: hull, deck, mast, sails, cannons, cabin...' },
  { type: 'ai' as const, text: "I'll build your pirate ship with a wooden hull, tall mast with cloth sails, 6 cannons, and a captain's cabin on the stern." },
  { type: 'building' as const, text: 'Building... 47 parts placed', parts: 47 },
  { type: 'done' as const, text: 'Pirate ship deployed to Studio' },
]

function AnimatedDemo() {
  const [step, setStep] = useState(0)
  const [typing, setTyping] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const cursor = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(cursor)
  }, [])

  // Type out user message, then reveal AI steps one by one
  useEffect(() => {
    if (step === 0) {
      // Type user message character by character
      const msg = DEMO_STEPS[0].text
      let i = 0
      const timer = setInterval(() => {
        if (i <= msg.length) {
          setTyping(msg.slice(0, i))
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => setStep(1), 600)
        }
      }, 40)
      return () => clearInterval(timer)
    }
    if (step > 0 && step < DEMO_STEPS.length) {
      const delay = step === 1 ? 1200 : step === 3 ? 2000 : 1500
      const timer = setTimeout(() => setStep(s => s + 1), delay)
      return () => clearTimeout(timer)
    }
    if (step >= DEMO_STEPS.length) {
      // Restart loop after pause
      const timer = setTimeout(() => {
        setStep(0)
        setTyping('')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [step])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 520,
        background: 'rgba(8,10,22,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '20px 20px 16px',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 120,
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Demo header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#52525B', fontWeight: 600, letterSpacing: '0.05em',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            display: 'inline-block', boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          LIVE PREVIEW
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', opacity: 0.6 }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 160 }}>
        {/* User message — always visible while typing or after */}
        <div style={{
          alignSelf: 'flex-end',
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: '14px 14px 4px 14px',
          padding: '10px 14px',
          maxWidth: '85%',
          fontSize: 13,
          color: '#E4E4E7',
          lineHeight: 1.5,
          opacity: step >= 0 ? 1 : 0,
          transition: 'opacity 0.3s',
        }}>
          {step === 0 ? (
            <>{typing}<span style={{ opacity: showCursor ? 1 : 0, color: '#D4AF37' }}>|</span></>
          ) : DEMO_STEPS[0].text}
        </div>

        {/* AI thinking */}
        {step >= 1 && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            borderRadius: '14px 14px 14px 4px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12,
            color: step >= 2 ? '#52525B' : '#A1A1AA',
            lineHeight: 1.5,
            maxWidth: '90%',
            opacity: 1,
            transition: 'all 0.4s',
          }}>
            {step === 1 && (
              <span style={{ display: 'flex', gap: 3 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#D4AF37',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </span>
            )}
            {step >= 2 && <span style={{ color: '#D4AF37', flexShrink: 0 }}>F</span>}
            <span>{step === 1 ? DEMO_STEPS[1].text : step >= 2 ? DEMO_STEPS[2].text : ''}</span>
          </div>
        )}

        {/* Building progress */}
        {step >= 3 && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.15)',
            fontSize: 12,
            color: '#22c55e',
            display: 'flex', alignItems: 'center', gap: 8,
            maxWidth: '85%',
          }}>
            {step === 3 ? (
              <>
                <span className="spin" style={{ display: 'inline-block' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </span>
                Building... 47 parts placed
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Pirate ship deployed to Studio
              </>
            )}
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 4px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 10px rgba(34,197,94,0.6); }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Suggestion chips — quick-start prompts ────────────────────────────────
const SUGGESTIONS = [
  { label: 'Pirate ship', prompt: 'Build me a pirate ship with mast, sails, cannons, and a captain cabin', icon: '🏴‍☠️' },
  { label: 'Medieval castle', prompt: 'Build a medieval castle with towers, battlements, a gatehouse, and a throne room', icon: '🏰' },
  { label: 'Tycoon factory', prompt: 'Build a tycoon factory with conveyor belts, machines, and a cash register', icon: '🏭' },
  { label: 'Floating island', prompt: 'Create a low poly floating island with a cottage, palm trees, dock, and rowboat', icon: '🏝️' },
  { label: 'PvP arena', prompt: 'Create a symmetrical PvP arena with cover walls, team spawns, and a center platform', icon: '⚔️' },
  { label: 'Race track', prompt: 'Create a race track with starting gate, banked curves, barriers, and finish line', icon: '🏎️' },
]

// ─── Mode pills ───────────────────────────────────────────────────────────
const MODES = [
  { label: 'Build', prompt: 'Build me a ', color: '#D4AF37' },
  { label: 'Full Game', prompt: '/plan ', color: '#60A5FA' },
  { label: 'Script', prompt: 'Write a script that ', color: '#7C3AED' },
  { label: 'Image', prompt: '/image ', color: '#10B981' },
  { label: '3D Model', prompt: '/mesh ', color: '#F59E0B' },
]

interface WelcomeHeroProps {
  visible: boolean
  onQuickAction: (prompt: string, autoSend: boolean) => void
  onBuildGame?: (prompt: string) => void
}

export function WelcomeHero({ visible, onQuickAction, onBuildGame }: WelcomeHeroProps) {
  if (!visible) return null

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        gap: '1.5rem',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* ─── Greeting with animated rotating words ─── */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, marginTop: '0.5rem' }}>
        {/* Ambient glow */}
        <div aria-hidden style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 120,
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.2rem)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          color: '#FAFAFA',
          margin: 0,
        }}>
          Forge your <RotatingWord3D />
        </h1>
        <p style={{
          marginTop: 12,
          fontSize: 15,
          color: '#52525B',
          maxWidth: 420,
          margin: '12px auto 0',
          lineHeight: 1.6,
        }}>
          Describe anything. Forje builds it and syncs to Studio.
        </p>
      </div>

      {/* ─── Live demo ─── */}
      <AnimatedDemo />

      {/* ─── Suggestion chips ─── */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 560,
      }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onQuickAction(s.prompt, true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: '#A1A1AA',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.10)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
              e.currentTarget.style.color = '#E4E4E7'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = '#A1A1AA'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── Mode pills ─── */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {MODES.map((m) => {
          const autoSend = !m.prompt.endsWith(' ')
          return (
            <button
              key={m.label}
              onClick={() => onQuickAction(m.prompt, autoSend)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${m.color}25`,
                background: `${m.color}08`,
                color: m.color,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${m.color}18`
                e.currentTarget.style.borderColor = `${m.color}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${m.color}08`
                e.currentTarget.style.borderColor = `${m.color}25`
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {/* ─── Hint ─── */}
      <p style={{ fontSize: 11, color: '#3F3F46', textAlign: 'center' }}>
        Type below to start &middot;{' '}
        <kbd style={{
          padding: '1px 5px', borderRadius: 4,
          border: '1px solid #27272A', background: '#18181B', fontSize: 10,
        }}>Ctrl+K</kbd> for commands
      </p>
    </div>
  )
}
