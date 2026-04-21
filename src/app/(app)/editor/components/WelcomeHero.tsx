'use client'

import { useState, useEffect } from 'react'
import { PRIMARY_PRESETS } from '@/lib/game-presets'

// ─── Rotating words ─────────────────────────────────────────────────────────
const WORDS = ['Game', 'Tycoon', 'Obby', 'Simulator', 'RPG', 'Map', 'World']
const INTERVAL_MS = 2200

// ─── Suggested builds — these map directly to our 200 RAG templates ────────
const SUGGESTED_BUILDS = [
  { label: 'Pirate Ship', prompt: 'Build me a pirate ship with mast, sails, cannons, and a captain cabin', icon: '🏴‍☠️' },
  { label: 'Medieval Castle', prompt: 'Build a medieval castle with towers, battlements, a gatehouse, and a throne room', icon: '🏰' },
  { label: 'Low-Poly Island', prompt: 'Create a low poly floating island with a cottage, palm trees, dock, and rowboat', icon: '🏝️' },
  { label: 'Spaceship', prompt: 'Build a small spaceship with cockpit, wings, engines, and landing gear', icon: '🚀' },
  { label: 'Cozy Cafe', prompt: 'Build a cafe interior with counter, tables, chairs, menu board, and pendant lights', icon: '☕' },
  { label: 'PvP Arena', prompt: 'Create a symmetrical PvP arena with cover walls, team spawns, and a center platform', icon: '⚔️' },
  { label: 'Haunted Graveyard', prompt: 'Build a haunted graveyard with tombstones, iron fence, dead trees, and fog', icon: '👻' },
  { label: 'Farm Scene', prompt: 'Build a farm with a red barn, fenced crop field, silo, tractor, and farmhouse', icon: '🌾' },
  { label: 'Treehouse', prompt: 'Build a treehouse with a big tree, platform, ladder, walls, and rope bridge', icon: '🌳' },
  { label: 'Race Track', prompt: 'Create a race track with starting gate, banked curves, barriers, and finish line', icon: '🏎️' },
  { label: 'Underwater Ruins', prompt: 'Build underwater ruins with broken columns, coral, treasure, and kelp', icon: '🐠' },
  { label: 'Zen Garden', prompt: 'Create a zen garden with raked sand, stepping stones, bonsai tree, and water feature', icon: '🎋' },
]

// ─── Quick action categories ──────────────────────────────────────────────
const QUICK_MODES = [
  { label: 'Build', description: 'Describe any object or scene', prompt: 'Build me a ', icon: '🏗️', color: '#D4AF37' },
  { label: 'Full Game', description: 'Complete game with gameplay', prompt: '/plan ', icon: '🎮', color: '#60A5FA' },
  { label: 'Script', description: 'Luau code for game mechanics', prompt: 'Write a script that ', icon: '📝', color: '#7C3AED' },
  { label: 'Image', description: 'Game art and thumbnails', prompt: '/image ', icon: '🎨', color: '#10B981' },
  { label: '3D Model', description: 'Generate 3D mesh assets', prompt: '/mesh ', icon: '🧊', color: '#F59E0B' },
]

// ─── Full game genre cards ─────────────────────────────────────────────────
const GENRE_CARDS = PRIMARY_PRESETS.map((p) => ({
  id: p.id,
  icon: p.icon,
  label: p.label,
  tagline: p.tagline,
  prompt: p.prompt,
}))

interface WelcomeHeroProps {
  visible: boolean
  onQuickAction: (prompt: string, autoSend: boolean) => void
  onBuildGame?: (prompt: string) => void
}

function RotatingWord() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex(prev => (prev + 1) % WORDS.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])
  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: '5ch',
        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 50%, #D4AF37 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {WORDS[index]}
    </span>
  )
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
        padding: '2rem 1rem',
        gap: '2rem',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Subtle ambient glow behind headline */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Headline */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 7vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          color: '#FAFAFA',
          margin: 0,
        }}>
          Forge your <RotatingWord />
        </h1>
        <p style={{
          marginTop: 12,
          fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)',
          color: '#52525B',
          maxWidth: 380,
          margin: '12px auto 0',
          lineHeight: 1.5,
        }}>
          Click a build below, or type your own idea
        </p>
      </div>

      {/* ═══ SUGGESTED BUILDS ═══ */}
      <div style={{ width: '100%', maxWidth: 680, position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#D4AF37',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ width: 16, height: 1, background: '#D4AF37', opacity: 0.4 }} />
          Click to build instantly
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}>
          {SUGGESTED_BUILDS.map((build) => (
            <button
              key={build.label}
              onClick={() => onQuickAction(build.prompt, true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(212,175,55,0.12)',
                background: 'rgba(212,175,55,0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                textAlign: 'left',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.10)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(212,175,55,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.03)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{build.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E4E4E7', letterSpacing: '-0.01em' }}>
                {build.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ QUICK MODES ═══ */}
      <div style={{ width: '100%', maxWidth: 680 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#52525B',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ width: 16, height: 1, background: '#52525B', opacity: 0.4 }} />
          Or try a different mode
        </p>
        <div style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          {QUICK_MODES.map((mode) => {
            const autoSend = !mode.prompt.endsWith(' ')
            return (
              <button
                key={mode.label}
                onClick={() => onQuickAction(mode.prompt, autoSend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `1px solid ${mode.color}20`,
                  background: `${mode.color}06`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mode.color}15`
                  e.currentTarget.style.borderColor = `${mode.color}40`
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.2), 0 0 12px ${mode.color}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${mode.color}06`
                  e.currentTarget.style.borderColor = `${mode.color}20`
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span style={{ fontSize: 17 }}>{mode.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: mode.color, letterSpacing: '-0.01em' }}>{mode.label}</div>
                  <div style={{ fontSize: 11, color: '#52525B', lineHeight: 1.3 }}>{mode.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ FULL GAME PRESETS ═══ */}
      {onBuildGame && GENRE_CARDS.length > 0 && (
        <div style={{ width: '100%', maxWidth: 680 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#52525B',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ width: 16, height: 1, background: '#52525B', opacity: 0.4 }} />
            Build a complete game
          </p>
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            {GENRE_CARDS.map((g) => (
              <button
                key={g.id}
                onClick={() => onBuildGame(g.prompt)}
                title={g.tagline}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#A1A1AA',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.color = '#E4E4E7'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#A1A1AA'
                }}
              >
                <span style={{ fontSize: 14 }}>{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <p style={{ fontSize: 11, color: '#3F3F46', textAlign: 'center' }}>
        <kbd style={{
          padding: '2px 6px',
          borderRadius: 5,
          border: '1px solid #27272A',
          background: '#18181B',
          fontSize: 10,
          fontFamily: 'inherit',
        }}>Ctrl+K</kbd>{' '}
        command palette &middot;{' '}
        <span style={{ color: '#52525B' }}>Type anything below to get started</span>
      </p>
    </div>
  )
}
