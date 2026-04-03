'use client'

import Link from 'next/link'

const SHOWCASE_ITEMS = [
  {
    label: 'Castle RPG',
    tag: 'Fantasy',
    color: '#A855F7',
    parts: '2,847',
    scripts: '12',
    description: 'Stone fortress with working drawbridge, guards, and loot system',
    bgGradient: 'linear-gradient(135deg, #1a0d2e 0%, #2d1454 100%)',
    accentColor: '#A855F7',
  },
  {
    label: 'Urban Tycoon',
    tag: 'Simulator',
    color: '#FFB81C',
    parts: '5,103',
    scripts: '34',
    description: 'City builder with economy, property values, and NPC commuters',
    bgGradient: 'linear-gradient(135deg, #1a1400 0%, #2d2200 100%)',
    accentColor: '#FFB81C',
  },
  {
    label: 'Ocean Survival',
    tag: 'Adventure',
    color: '#60A5FA',
    parts: '1,622',
    scripts: '8',
    description: 'Island chain with crafting, weather system, and underwater caves',
    bgGradient: 'linear-gradient(135deg, #00101a 0%, #001c30 100%)',
    accentColor: '#60A5FA',
  },
  {
    label: 'Ninja Obby',
    tag: 'Obstacle',
    color: '#10B981',
    parts: '890',
    scripts: '5',
    description: 'Procedural obstacle course with checkpoints and leaderboards',
    bgGradient: 'linear-gradient(135deg, #001a0d 0%, #002d18 100%)',
    accentColor: '#10B981',
  },
]

export default function ShowcasePreview() {
  return (
    <section className="py-16 px-6" style={{ background: '#0A0E27' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <p
              className="text-[12px] font-medium uppercase tracking-widest mb-3"
              style={{ color: '#FFB81C' }}
            >
              Showcase
            </p>
            <h2 className="text-4xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>
              See what gets built.
            </h2>
            <p className="text-lg mt-3" style={{ color: '#8B95B0' }}>
              Real games, built with ForjeGames in hours.
            </p>
          </div>
          <Link
            href="/editor"
            className="flex-shrink-0 flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
            style={{
              color: '#FFB81C',
              border: '1px solid rgba(255,184,28,0.25)',
              background: 'rgba(255,184,28,0.06)',
            }}
          >
            Start building
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SHOWCASE_ITEMS.map((item) => (
            <Link
              key={item.label}
              href="/editor"
              className="group rounded-xl overflow-hidden flex flex-col card-hover"
              style={{
                background: '#0F1535',
                border: '1px solid #1A2550',
                textDecoration: 'none',
              }}
            >
              {/* Placeholder screenshot area */}
              <div
                className="h-40 flex items-center justify-center relative overflow-hidden"
                style={{ background: item.bgGradient }}
              >
                {/* Subtle grid overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Glow orb */}
                <div
                  className="absolute w-24 h-24 rounded-full blur-2xl"
                  style={{ background: `${item.accentColor}25` }}
                />
                {/* Label */}
                <div className="relative text-center">
                  <p className="text-xs font-mono mb-1" style={{ color: `${item.accentColor}90` }}>
                    {item.tag}
                  </p>
                  <p className="text-lg font-bold" style={{ color: item.accentColor }}>
                    {item.label}
                  </p>
                </div>
                {/* Corner badge */}
                <div
                  className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{
                    background: `${item.accentColor}15`,
                    border: `1px solid ${item.accentColor}30`,
                    color: item.accentColor,
                  }}
                >
                  AI Built
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2">
                <p className="text-xs leading-relaxed" style={{ color: '#8B95B0' }}>
                  {item.description}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px]" style={{ color: '#8B95B0' }}>
                    <span style={{ color: '#FFFFFF' }}>{item.parts}</span> parts
                  </span>
                  <span className="text-[11px]" style={{ color: '#8B95B0' }}>
                    <span style={{ color: '#FFFFFF' }}>{item.scripts}</span> scripts
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
