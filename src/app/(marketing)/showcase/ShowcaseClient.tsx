'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const AssetShowcase3D = dynamic(() => import('@/components/AssetShowcase3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 520,
      color: 'rgba(212,175,55,0.6)',
      fontSize: 14,
    }}>
      Loading 3D viewer...
    </div>
  ),
})

interface ShowcaseGame {
  title: string
  genre: string
  accent: string
  parts: string
  scripts: string
  buildTime: string
  description: string
}

const SHOWCASE_GAMES: ShowcaseGame[] = [
  {
    title: 'Castle Siege RPG',
    genre: 'Fantasy',
    accent: '#A855F7',
    parts: '2,847',
    scripts: '12',
    buildTime: 'Built in 45 minutes',
    description: 'A full medieval siege game with wave-based enemies, castle defenses, and loot drops.',
  },
  {
    title: 'Urban Tycoon',
    genre: 'Simulator',
    accent: '#FFB81C',
    parts: '5,103',
    scripts: '34',
    buildTime: 'Built in 2 hours',
    description: 'Build and manage a sprawling city empire — hire workers, upgrade buildings, dominate the market.',
  },
  {
    title: 'Ocean Survival',
    genre: 'Adventure',
    accent: '#60A5FA',
    parts: '1,622',
    scripts: '8',
    buildTime: 'Built in 30 minutes',
    description: 'Stranded at sea. Craft rafts, hunt for resources, and survive the deep ocean threats.',
  },
  {
    title: 'Ninja Obby Pro',
    genre: 'Obstacle',
    accent: '#10B981',
    parts: '890',
    scripts: '5',
    buildTime: 'Built in 15 minutes',
    description: 'A brutal precision platformer with 50 stages, checkpoints, and speed-run leaderboards.',
  },
  {
    title: 'Space Station',
    genre: 'Sci-Fi',
    accent: '#F97316',
    parts: '3,200',
    scripts: '18',
    buildTime: 'Built in 1 hour',
    description: 'Command a deep-space station, manage oxygen systems, repel alien raids, and explore the void.',
  },
  {
    title: 'Pet Simulator',
    genre: 'Simulator',
    accent: '#EC4899',
    parts: '4,500',
    scripts: '28',
    buildTime: 'Built in 3 hours',
    description: 'Collect, evolve, and trade hundreds of pets across vibrant biomes with auto-farming mechanics.',
  },
]

function ShowcaseCard({ game }: { game: ShowcaseGame }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#0F1535',
        border: `1px solid ${hovered ? game.accent : '#1A2550'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 8px 32px ${game.accent}30`
          : '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'default',
      }}
    >
      {/* Gradient placeholder */}
      <div
        style={{
          height: 160,
          background: `linear-gradient(135deg, ${game.accent}22 0%, ${game.accent}44 50%, ${game.accent}18 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          position: 'relative',
          borderBottom: `1px solid ${hovered ? game.accent + '60' : '#1A2550'}`,
          transition: 'border-color 0.2s ease',
        }}
      >
        {/* Decorative grid lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${game.accent}12 1px, transparent 1px), linear-gradient(90deg, ${game.accent}12 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#FFFFFF',
          textAlign: 'center',
          zIndex: 1,
          textShadow: `0 0 24px ${game.accent}80`,
          padding: '0 16px',
        }}>
          {game.title}
        </span>
        {/* Genre pill */}
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: game.accent,
          backgroundColor: `${game.accent}20`,
          border: `1px solid ${game.accent}50`,
          borderRadius: 20,
          padding: '3px 10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          zIndex: 1,
        }}>
          {game.genre}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <p style={{
          fontSize: 13,
          color: '#8B95B0',
          lineHeight: 1.55,
          margin: '0 0 14px',
        }}>
          {game.description}
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}>
          <StatChip label="Parts" value={game.parts} accent={game.accent} />
          <StatChip label="Scripts" value={game.scripts} accent={game.accent} />
        </div>

        {/* Build time */}
        <div style={{
          fontSize: 12,
          color: game.accent,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke={game.accent} strokeWidth="1.5" />
            <path d="M6 3.5V6l1.5 1.5" stroke={game.accent} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {game.buildTime}
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#0A0E27',
      border: '1px solid #1A2550',
      borderRadius: 6,
      padding: '4px 8px',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#8B95B0' }}>{label}</span>
    </div>
  )
}

export default function ShowcaseClient() {
  return (
    <div style={{ backgroundColor: '#0A0E27', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        paddingTop: 120,
        paddingBottom: 72,
        textAlign: 'center',
        borderBottom: '1px solid #1A2550',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <div style={{ height: 1, width: 32, backgroundColor: '#FFB81C' }} />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#FFB81C',
              textTransform: 'uppercase',
            }}>
              Showcase
            </span>
            <div style={{ height: 1, width: 32, backgroundColor: '#FFB81C' }} />
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '0 0 16px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            Built with ForjeGames.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 18,
            color: '#8B95B0',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 560,
            marginInline: 'auto',
          }}>
            Real games created by real creators using AI. From first prompt to published game.
          </p>
        </div>
      </div>

      {/* Gallery grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 80px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 24 }}>
          {SHOWCASE_GAMES.map((game) => (
            <ShowcaseCard key={game.title} game={game} />
          ))}
        </div>
      </div>

      {/* 3D Viewer section */}
      <div style={{
        borderTop: '1px solid #1A2550',
        borderBottom: '1px solid #1A2550',
        backgroundColor: '#0D1230',
        padding: '48px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#FFB81C',
              textTransform: 'uppercase',
            }}>
              Interactive Preview
            </span>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '8px 0 0',
            }}>
              Explore in 3D
            </h2>
          </div>
          <AssetShowcase3D />
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center',
        padding: '96px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 250,
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '0 0 32px',
            letterSpacing: '-0.02em',
          }}>
            Ready to build yours?
          </h2>

          <Link
            href="/editor"
            style={{
              display: 'inline-block',
              backgroundColor: '#FFB81C',
              color: '#0A0E27',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 36px',
              borderRadius: 8,
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'background-color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D4AF37'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFB81C'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Start building free
          </Link>

          <p style={{
            fontSize: 13,
            color: '#8B95B0',
            marginTop: 12,
            marginBottom: 0,
          }}>
            No credit card required
          </p>
        </div>
      </div>

    </div>
  )
}
