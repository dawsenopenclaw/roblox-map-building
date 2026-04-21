'use client'

import Link from 'next/link'

/* ──────────────────────────────────────────────────
   Inline SVG icons — all 24×24 viewBox
─────────────────────────────────────────────────── */

function IconMic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8"  y1="22" x2="16" y2="22" />
    </svg>
  )
}

function IconCube() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function IconSync() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.79A2.5 2.5 0 0 1 6.5 9 2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.79A2.5 2.5 0 0 0 17.5 9a2.5 2.5 0 0 0-3-7z" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

/* ──────────────────────────────────────────────────
   Card data
─────────────────────────────────────────────────── */

const CARDS = [
  {
    icon: <IconMic />,
    title: 'Voice to Game',
    description: 'Speak your idea. AI builds it. Terrain, scripts, assets — from a single voice command.',
    cta: 'Try voice input →',
    href: '/voice',
    accentHue: '0',      // red-ish warmth for mic
  },
  {
    icon: <IconCube />,
    title: '3D Mesh Generation',
    description: 'Text or image to a Roblox-ready 3D mesh with PBR textures. Unique assets, not recycled.',
    cta: 'Generate a mesh →',
    href: '/editor',
    accentHue: '200',    // cyan for 3D
  },
  {
    icon: <IconSync />,
    title: 'Live Studio Sync',
    description: 'Every generation pushes directly into Roblox Studio in real time. No copy-paste. No file imports.',
    cta: 'Connect Studio →',
    href: '/download',
    accentHue: '142',    // green for sync
  },
  {
    icon: <IconBrain />,
    title: 'Multi-AI Engine',
    description: 'Multiple AI models working together — the best one for each task, automatically. Switch mid-session.',
    cta: 'See AI modes →',
    href: '/docs/ai-modes',
    accentHue: '270',    // purple for brain/AI
  },
  {
    icon: <IconImage />,
    title: '13 Image Styles',
    description: 'Pixel art, anime, realistic, fantasy, sci-fi — pick a style and every texture matches. Consistent look across your whole game.',
    cta: 'See styles →',
    href: '/editor',
    accentHue: '320',    // pink for images
  },
  {
    icon: <IconShield />,
    title: 'Production-Ready Code',
    description: 'Every Luau script includes anti-exploit guards, server validation, and DataStore best practices. Not just demos — real game code.',
    cta: 'View code quality →',
    href: '/docs/getting-started',
    accentHue: '45',     // warm gold for shield
  },
]

/* ──────────────────────────────────────────────────
   BentoCard component
─────────────────────────────────────────────────── */

interface BentoCardProps {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  href: string
  accentHue: string
}

function BentoCard({ icon, title, description, cta, href, accentHue }: BentoCardProps) {
  return (
    <Link
      href={href}
      className="bento-card"
      style={{ textDecoration: 'none', display: 'block' }}
      data-hue={accentHue}
    >
      <div
        className="bento-card-inner"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: '28px 26px 24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
        }}
      >
        {/* Subtle corner glow — shown on hover via CSS */}
        <div
          className="bento-glow"
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `radial-gradient(circle, hsla(${accentHue},60%,55%,0.12) 0%, transparent 70%)`,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `hsla(${accentHue},50%,50%,0.10)`,
            border: `1px solid hsla(${accentHue},50%,60%,0.20)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `hsl(${accentHue},65%,65%)`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: '#E8EAF0',
            letterSpacing: '-0.2px',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: 1.6,
            color: '#7A8298',
            flex: 1,
          }}
        >
          {description}
        </p>

        {/* Micro CTA */}
        <div
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: `hsl(${accentHue},65%,65%)`,
            letterSpacing: '0.2px',
            marginTop: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: `1px solid hsla(${accentHue},50%,55%,0.30)`,
            paddingBottom: '1px',
            width: 'fit-content',
          }}
        >
          {cta}
        </div>
      </div>

      <style>{`
        .bento-card:hover .bento-card-inner {
          border-color: rgba(212,175,55,0.22);
          background: rgba(255,255,255,0.045);
          box-shadow: 0 0 0 1px rgba(212,175,55,0.06), 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20);
        }
        .bento-card:hover .bento-glow {
          opacity: 1;
        }
      `}</style>
    </Link>
  )
}

/* ──────────────────────────────────────────────────
   Section
─────────────────────────────────────────────────── */

export default function SellingPointsBento() {
  return (
    <section
      className="reveal"
      style={{
        padding: '72px 0 80px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: '#D4AF37',
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'uppercase',
            margin: '0 0 12px',
          }}
        >
          Why ForjeGames
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: '#f0f0f0',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            margin: '0 0 32px',
          }}
        >
          Everything you need.{' '}
          <span style={{ color: '#71717A' }}>Nothing you don&apos;t.</span>
        </h2>

        {/* 3×2 Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
          className="bento-grid"
        >
          {CARDS.map(card => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Responsive: single column on mobile, 2 col on tablet */}
      <style>{`
        @media (max-width: 640px) {
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}
