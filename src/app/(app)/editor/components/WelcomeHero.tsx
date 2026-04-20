'use client'

import { useState, useEffect } from 'react'
import { PRIMARY_PRESETS } from '@/lib/game-presets'

// ─── Rotating words ─────────────────────────────────────────────────────────
const WORDS = ['Game', 'Tycoon', 'Obby', 'Simulator', 'RPG', 'Map', 'World']
const INTERVAL_MS = 2200

// ─── Suggested builds — these map directly to our 200 RAG templates ────────
// Users click one and it auto-sends. No guessing, no blank input.
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

// ─── Quick action categories (below the suggested builds) ──────────────────
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
    <span className="forge-word forge-word-active" style={{ display: 'inline-block', minWidth: '5ch' }}>
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
        padding: '1.5rem 1rem',
        gap: '1.5rem',
        overflow: 'auto',
      }}
    >
      {/* Headline — compact */}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#FAFAFA',
          margin: 0,
        }}>
          Forge your <RotatingWord />
        </h1>
        <p style={{
          marginTop: 8,
          fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
          color: '#71717A',
          maxWidth: 400,
          margin: '8px auto 0',
          lineHeight: 1.5,
        }}>
          Click a build below, or type your own idea
        </p>
      </div>

      {/* ═══ SUGGESTED BUILDS — the main thing users should click ═══ */}
      <div style={{ width: '100%', maxWidth: 640 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#D4AF37',
          marginBottom: 8,
        }}>
          Click to build instantly
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}>
          {SUGGESTED_BUILDS.map((build) => (
            <button
              key={build.label}
              onClick={() => onQuickAction(build.prompt, true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(212,175,55,0.15)',
                background: 'rgba(212,175,55,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.12)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.04)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{build.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E4E4E7' }}>
                {build.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ QUICK MODES — what else you can do ═══ */}
      <div style={{ width: '100%', maxWidth: 640 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#71717A',
          marginBottom: 8,
        }}>
          Or try a different mode
        </p>
        <div style={{
          display: 'flex',
          gap: 8,
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
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${mode.color}22`,
                  background: `${mode.color}08`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mode.color}18`
                  e.currentTarget.style.borderColor = `${mode.color}44`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${mode.color}08`
                  e.currentTarget.style.borderColor = `${mode.color}22`
                }}
              >
                <span style={{ fontSize: 15 }}>{mode.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: mode.color }}>{mode.label}</div>
                  <div style={{ fontSize: 10, color: '#52525B' }}>{mode.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ FULL GAME PRESETS ═══ */}
      {onBuildGame && GENRE_CARDS.length > 0 && (
        <div style={{ width: '100%', maxWidth: 640 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#71717A',
            marginBottom: 8,
          }}>
            Build a complete game
          </p>
          <div style={{
            display: 'flex',
            gap: 6,
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
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#A1A1AA',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#E4E4E7'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
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
        <kbd style={{ padding: '2px 5px', borderRadius: 4, border: '1px solid #27272A', background: '#18181B', fontSize: 10 }}>Ctrl+K</kbd>{' '}
        command palette &middot;{' '}
        <span style={{ color: '#52525B' }}>Type anything below to get started</span>
      </p>
    </div>
  )
}
