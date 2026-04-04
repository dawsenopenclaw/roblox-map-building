'use client'

import { useState } from 'react'

const TABS = [
  {
    id: 'voice',
    label: 'Voice Builder',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    color: '#10B981',
    description: 'Speak your game idea. AI translates voice to terrain, assets, and scripts — live.',
    preview: {
      label: 'VOICE BUILDER',
      statusLabel: 'Listening...',
      statusColor: '#10B981',
      lines: [
        { text: '"Build a medieval castle with stone walls, moat, and a drawbridge"', isPrompt: true },
        { text: '→ Generating terrain (320×320 studs)...', color: '#8B95B0' },
        { text: '→ Placing CastleWall_Stone_v2 × 48', color: '#8B95B0' },
        { text: '→ Filling moat terrain (Water material)', color: '#8B95B0' },
        { text: '→ Scripting drawbridge mechanism', color: '#D4AF37' },
        { text: '→ Lighting: torches + atmospheric fog', color: '#8B95B0' },
        { text: '✓ Done — 4 scripts, 847 parts, 22s', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Mode', value: 'Voice' },
        { label: 'Parts', value: '847' },
        { label: 'Scripts', value: '4' },
        { label: 'Time', value: '22s' },
      ],
    },
  },
  {
    id: 'image',
    label: 'Image to Map',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    color: '#60A5FA',
    description: 'Upload any photo or sketch. AI reads it and generates a matching Roblox map.',
    preview: {
      label: 'IMAGE TO MAP',
      statusLabel: 'Analyzing image...',
      statusColor: '#60A5FA',
      lines: [
        { text: '[image: city_sketch.jpg uploaded]', isPrompt: true },
        { text: '→ Claude Vision: detecting 7 zones', color: '#8B95B0' },
        { text: '→ Depth Pro: generating heightmap', color: '#8B95B0' },
        { text: '→ Placing buildings (downtown zone)', color: '#8B95B0' },
        { text: '→ Road network (23 segments)', color: '#60A5FA' },
        { text: '→ Parks + vegetation (3 biome zones)', color: '#8B95B0' },
        { text: '✓ Map matched 87% to source image', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Mode', value: 'Image' },
        { label: 'Zones', value: '7' },
        { label: 'Roads', value: '23' },
        { label: 'Match', value: '87%' },
      ],
    },
  },
  {
    id: 'chat',
    label: 'Chat Agent',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: '#D4AF37',
    description: 'Chat naturally. ForjeGames understands context and builds iteratively with you.',
    preview: {
      label: 'CHAT AGENT',
      statusLabel: 'Claude 3.5 Sonnet',
      statusColor: '#D4AF37',
      lines: [
        { text: 'You: add neon signs to the shops', isPrompt: true },
        { text: 'ForjeGames: Added 12 neon SurfaceGui signs', color: '#8B95B0' },
        { text: 'You: make the lighting more atmospheric', isPrompt: true },
        { text: 'ForjeGames: Updated Atmosphere + added PointLights', color: '#8B95B0' },
        { text: 'You: balance the economy — coins per kill?', isPrompt: true },
        { text: 'ForjeGames: Analyzing session data... suggested: 15 coins', color: '#D4AF37' },
        { text: '✓ Economy script updated + playtested', color: '#10B981' },
      ],
      rightPanel: [
        { label: 'Model', value: 'Sonnet' },
        { label: 'Turns', value: '14' },
        { label: 'Edits', value: '31' },
        { label: 'FPS', value: '60' },
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
                  <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{s.value}</p>
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
