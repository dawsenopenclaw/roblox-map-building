'use client'

import { useState, useEffect } from 'react'
import { PRIMARY_PRESETS } from '@/lib/game-presets'

// ─── Rotating words — same pattern as the homepage hero ────────────────────
const WORDS = ['Game', 'Tycoon', 'Obby', 'Simulator', 'RPG', 'Map', 'World']
const INTERVAL_MS = 2200

interface QuickAction {
  icon: string
  label: string
  description: string
  prompt: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: '🎮',
    label: 'Plan Game',
    description: 'Full game design with spawn area, gameplay loop, and progression',
    prompt: '/plan Design a complete Roblox game with a spawn area, main gameplay loop, currency system, and 3 levels of progression. Include specific part sizes, materials, and colors.',
    color: '#D4AF37',
  },
  {
    icon: '🏗️',
    label: 'Build Map',
    description: 'Terrain, buildings, and environment',
    prompt: 'Build me a ',
    color: '#60A5FA',
  },
  {
    icon: '📝',
    label: 'Write Script',
    description: 'Luau scripts for gameplay mechanics',
    prompt: 'Write a script that ',
    color: '#7C3AED',
  },
  {
    icon: '🎨',
    label: 'Generate Art',
    description: 'Thumbnails, icons, and textures',
    prompt: '/image Generate a Roblox game thumbnail for ',
    color: '#10B981',
  },
]

// ─── Full game genre cards ──────────────────────────────────────────────────
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
  /** Build a full game via the step-by-step builder */
  onBuildGame?: (prompt: string) => void
}

function RotatingWord() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % WORDS.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const currentWord = WORDS[index]

  return (
    <span
      className="forge-word forge-word-active"
      style={{ display: 'inline-block', minWidth: '5ch' }}
    >
      {currentWord}
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
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        gap: '2rem',
        opacity: 1,
        transition: 'opacity 0.4s ease-out',
        overflow: 'auto',
      }}
    >
      {/* Headline */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#FAFAFA',
            margin: 0,
          }}
        >
          Forge your <RotatingWord />
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: '#71717A',
            maxWidth: 440,
            margin: '12px auto 0',
            lineHeight: 1.5,
          }}
        >
          Describe what you want to build. The AI handles the rest.
        </p>
      </div>

      {/* Quick action cards — 2x2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          maxWidth: 480,
          width: '100%',
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          // "Build Map" and "Write Script" focus the input instead of auto-sending
          const autoSend = !action.prompt.endsWith(' ')
          return (
            <button
              key={action.label}
              onClick={() => onQuickAction(action.prompt, autoSend)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                padding: '16px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${action.color}44`
                e.currentTarget.style.background = `${action.color}08`
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 24 }}>{action.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FAFAFA' }}>
                {action.label}
              </span>
              <span style={{ fontSize: 11, color: '#71717A', lineHeight: 1.4 }}>
                {action.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Full game genre cards */}
      {onBuildGame && (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D4AF37', marginBottom: 8, textAlign: 'center' }}>
            Or build a complete game
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {GENRE_CARDS.map((g) => (
              <button
                key={g.id}
                onClick={() => onBuildGame(g.prompt)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 4px', borderRadius: 8,
                  border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)',
                  color: '#D4AF37', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slash command hint */}
      <p style={{ fontSize: 11, color: '#3F3F46', textAlign: 'center' }}>
        Try <span style={{ color: '#71717A', fontFamily: 'monospace' }}>/plan</span>,{' '}
        <span style={{ color: '#71717A', fontFamily: 'monospace' }}>/game</span>,{' '}
        <span style={{ color: '#71717A', fontFamily: 'monospace' }}>/image</span>, or{' '}
        <span style={{ color: '#71717A', fontFamily: 'monospace' }}>/mesh</span> for specific modes
      </p>
    </div>
  )
}
