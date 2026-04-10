'use client'

import { useState } from 'react'

const TABS = [
  {
    id: 'game',
    label: 'Game',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <line x1="7" y1="12" x2="11" y2="12" />
        <line x1="9" y1="10" x2="9" y2="14" />
        <circle cx="16" cy="11" r="0.5" />
        <circle cx="18" cy="13" r="0.5" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Full playable Roblox games — built from a single prompt, live in Studio.',
    preview: {
      label: 'GAME BUILD',
      statusLabel: 'Building...',
      statusColor: '#D4AF37',
      lines: [
        { text: '"Build a tycoon where you mine gold and hire workers"', isPrompt: true },
        { text: '→ Scaffolding map: mine shaft + base zone', color: '#8B95B0' },
        { text: '→ Writing GoldOre.lua, Conveyor.lua, Hire.lua', color: '#8B95B0' },
        { text: '→ Placing droppers × 6, upgrades × 12', color: '#8B95B0' },
        { text: '→ Wiring economy (DataStore2 + leaderstats)', color: '#D4AF37' },
        { text: '→ Spawning NPCs + shop UI', color: '#8B95B0' },
        { text: '✓ Playable — 11 scripts, 1,240 parts, 38s', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Type', value: 'Tycoon' },
        { label: 'Parts', value: '1.2k' },
        { label: 'Scripts', value: '11' },
        { label: 'Time', value: '38s' },
      ],
    },
  },
  {
    id: 'map',
    label: 'Map',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Cities, castles, arenas — structured maps with props, lighting, and spawn logic.',
    preview: {
      label: 'MAP GENERATOR',
      statusLabel: 'Generating...',
      statusColor: '#D4AF37',
      lines: [
        { text: '"Build a medieval castle with stone walls, moat, drawbridge"', isPrompt: true },
        { text: '→ Heightmap: 320×320 studs', color: '#8B95B0' },
        { text: '→ Placing CastleWall_Stone × 48', color: '#8B95B0' },
        { text: '→ Filling moat (Water material)', color: '#8B95B0' },
        { text: '→ Drawbridge hinge + constraint', color: '#D4AF37' },
        { text: '→ Torches, fog, skybox preset', color: '#8B95B0' },
        { text: '✓ Done — 847 parts, 22s', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Size', value: '320²' },
        { label: 'Parts', value: '847' },
        { label: 'Props', value: '63' },
        { label: 'Time', value: '22s' },
      ],
    },
  },
  {
    id: 'ui',
    label: 'UI',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Shop menus, HUDs, inventory screens — generated ScreenGuis, production-ready.',
    preview: {
      label: 'UI BUILDER',
      statusLabel: 'Designing...',
      statusColor: '#D4AF37',
      lines: [
        { text: '"Make a shop UI with 3 tabs: weapons, pets, coins"', isPrompt: true },
        { text: '→ ScreenGui: ShopMain (Roblox UIGradient)', color: '#8B95B0' },
        { text: '→ TabBar: Weapons / Pets / Coins', color: '#8B95B0' },
        { text: '→ ScrollingFrame × 3 (UIListLayout)', color: '#8B95B0' },
        { text: '→ BuyButton.lua wired to RemoteEvent', color: '#D4AF37' },
        { text: '→ Hover states + sound effects', color: '#8B95B0' },
        { text: '✓ Shop UI ready — 3 tabs, 24 items', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Frames', value: '18' },
        { label: 'Buttons', value: '24' },
        { label: 'Scripts', value: '3' },
        { label: 'Time', value: '14s' },
      ],
    },
  },
  {
    id: 'terrain',
    label: 'Terrain',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20l5-8 4 5 3-4 6 7" />
        <path d="M3 20h18" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Sculpt mountains, rivers, biomes — voxel terrain written directly into Studio.',
    preview: {
      label: 'TERRAIN GENERATOR',
      statusLabel: 'Sculpting...',
      statusColor: '#D4AF37',
      lines: [
        { text: '"Snowy mountain valley with a frozen river"', isPrompt: true },
        { text: '→ Noise pass: ridges + valleys', color: '#8B95B0' },
        { text: '→ Materials: Snow, Rock, Ice', color: '#8B95B0' },
        { text: '→ Carving river channel (Ice)', color: '#8B95B0' },
        { text: '→ Scattering pine trees × 240', color: '#D4AF37' },
        { text: '→ Atmosphere: snow particles + fog', color: '#8B95B0' },
        { text: '✓ Done — 2.1M voxels, 18s', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Voxels', value: '2.1M' },
        { label: 'Biome', value: 'Snow' },
        { label: 'Trees', value: '240' },
        { label: 'Time', value: '18s' },
      ],
    },
  },
  {
    id: 'scripts',
    label: 'Scripts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Production Luau — server-authoritative, anti-cheat ready, context-aware.',
    preview: {
      label: 'SCRIPT WRITER',
      statusLabel: 'Compiling...',
      statusColor: '#D4AF37',
      lines: [
        { text: '"Add a coin magnet power-up — 5s duration, 20 studs"', isPrompt: true },
        { text: '→ CoinMagnet.lua (ServerScriptService)', color: '#8B95B0' },
        { text: '→ RemoteEvent: PickupMagnet', color: '#8B95B0' },
        { text: '→ Tween + Region3 scan for coins', color: '#8B95B0' },
        { text: '→ Glow VFX (Attachment + ParticleEmitter)', color: '#D4AF37' },
        { text: '→ Sanity check: anti-exploit added', color: '#8B95B0' },
        { text: '✓ Script live — 84 lines, 0 errors', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Lang', value: 'Luau' },
        { label: 'Lines', value: '84' },
        { label: 'Errors', value: '0' },
        { label: 'Time', value: '6s' },
      ],
    },
  },
]

export default function HeroScreenshotTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const tab = TABS[activeTab]

  function switchTab(i: number) {
    if (i === activeTab || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setActiveTab(i)
      setTransitioning(false)
    }, 180)
  }

  return (
    <section className="px-6 pb-32">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cursor-blink-hero {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes hst-content-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hst-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .hst-content-enter { animation: hst-content-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
          .hst-shimmer-bar {
            background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%);
            background-size: 400px 100%;
            animation: hst-shimmer 1.6s ease-in-out infinite;
          }
        }
        .hst-tab-btn {
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .hst-tab-btn:focus-visible {
          outline: 2px solid #D4AF37;
          outline-offset: 2px;
        }
      ` }} />

      <div className="max-w-5xl mx-auto">
        {/* Tab row */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-8 mx-auto w-fit"
          style={{
            background: 'rgba(15,21,53,0.8)',
            border: '1px solid rgba(26,37,80,0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {TABS.map((t, i) => {
            const isActive = activeTab === i
            return (
              <button
                key={t.id}
                onClick={() => switchTab(i)}
                className="hst-tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={
                  isActive
                    ? {
                        background: 'rgba(212,175,55,0.12)',
                        color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.3)',
                        boxShadow: '0 0 12px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                      }
                    : {
                        color: '#8B95B0',
                        border: '1px solid transparent',
                      }
                }
                aria-pressed={isActive}
              >
                <span style={{ color: isActive ? '#D4AF37' : '#8B95B0', transition: 'color 0.18s' }}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Description */}
        <p
          key={`desc-${activeTab}`}
          className="hst-content-enter text-center text-base mb-8"
          style={{ color: '#8B95B0' }}
        >
          {tab.description}
        </p>

        {/* Screenshot mockup */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#0C1030',
            border: '1px solid rgba(26,37,80,0.9)',
            boxShadow: `0 12px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px ${tab.color}18`,
            transition: 'box-shadow 0.35s ease',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(26,37,80,0.8)', background: '#080C22' }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
            <span className="ml-4 text-xs font-mono" style={{ color: 'rgba(212,175,55,0.45)' }}>
              ForjeGames — {tab.preview.label}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: tab.preview.statusColor }}
              />
              <span className="text-[11px]" style={{ color: tab.preview.statusColor }}>
                {tab.preview.statusLabel}
              </span>
            </div>
          </div>

          {/* Body */}
          <div
            key={`body-${activeTab}`}
            className={`flex hst-content-enter`}
            style={{ minHeight: 240, opacity: transitioning ? 0 : undefined }}
          >
            {/* Terminal / log area */}
            <div className="flex-1 p-5 font-mono text-[13px] leading-7">
              {transitioning ? (
                // Shimmer skeleton while transitioning
                <div className="space-y-3 pt-1">
                  {[80, 65, 72, 60, 70, 55, 68].map((w, i) => (
                    <div
                      key={i}
                      className="hst-shimmer-bar rounded"
                      style={{ height: 14, width: `${w}%` }}
                    />
                  ))}
                </div>
              ) : (
                tab.preview.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: line.isPrompt ? '#FFFFFF' : line.color ?? '#8B95B0',
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    {line.text}
                    {i === tab.preview.lines.length - 1 && (
                      <span
                        className="inline-block w-0.5 h-3.5 ml-0.5 align-middle"
                        style={{
                          background: '#D4AF37',
                          animation: 'cursor-blink-hero 1.1s step-start infinite',
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right stats panel */}
            <div
              className="hidden sm:flex flex-col w-36 flex-shrink-0 p-4 gap-4"
              style={{ borderLeft: '1px solid rgba(26,37,80,0.8)' }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: 'rgba(212,175,55,0.4)' }}
              >
                Stats
              </p>
              {tab.preview.rightPanel.map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] mb-0.5" style={{ color: '#8B95B0' }}>{s.label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar — gold gradient on active-tab color + gold blend */}
          <div
            className="h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${tab.color}99, #D4AF3766, ${tab.color}99, transparent)`,
              transition: 'background 0.35s ease',
            }}
          />
        </div>
      </div>
    </section>
  )
}
