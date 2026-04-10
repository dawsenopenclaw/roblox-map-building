'use client'

const FEATURES = [
  {
    id: 'voice',
    tag: 'Voice to Game',
    headline: 'Describe it. AI builds it.',
    body: 'Speak your game idea out loud — or type it in plain English. ForjeGames understands Roblox context: it knows what a tycoon, obby, or simulator means, and builds accordingly. Terrain, assets, scripts, lighting — all from a single sentence.',
    bullets: [
      'Natural language understood, not just commands',
      'Iterative: "make it bigger", "add more torches" — AI refines',
      'Builds 10–100x faster than manual Studio work',
    ],
    mockupLabel: 'VOICE INPUT',
    mockupColor: '#10B981',
    mockupLines: [
      { text: '🎙 "build a pirate island with a hidden cave"', highlight: true },
      { text: '→ Terrain: tropical + sand + cliff biomes', color: '#8B95B0' },
      { text: '→ Assets: ShipWreck, PalmTree × 22, Chest × 3', color: '#8B95B0' },
      { text: '→ Secret cave: tunnel + glow + loot system', color: '#10B981' },
      { text: '✓ Done — 23 seconds', color: '#10B981' },
    ],
    flip: false,
  },
  {
    id: 'assets',
    tag: 'Custom 3D Assets',
    headline: 'Any asset. Any style. Instantly.',
    body: 'ForjeGames taps the Meshy and Tripo pipelines to generate custom 3D models from text or images, then applies PBR textures automatically. Models are game-ready — properly scaled, optimized, and inserted directly into your scene.',
    bullets: [
      'Text-to-3D and image-to-3D via Meshy + Tripo',
      'PBR textures: albedo, normal, roughness, metallic',
      'Auto-scaled to Roblox\'s 5-stud character system',
    ],
    mockupLabel: '3D GENERATION',
    mockupColor: '#A855F7',
    mockupLines: [
      { text: '> generate: ancient stone idol, weathered', highlight: true },
      { text: '→ Meshy: generating mesh (4.2s)...', color: '#8B95B0' },
      { text: '→ Fal: applying PBR texture set', color: '#8B95B0' },
      { text: '→ Scaling: 4 studs (game-ready)', color: '#A855F7' },
      { text: '✓ Inserted at cursor position', color: '#10B981' },
    ],
    flip: true,
  },
  {
    id: 'systems',
    tag: 'Complete Game Systems',
    headline: 'Economy, UI, scripts, audio. All at once.',
    body: 'ForjeGames does not stop at terrain. It designs and implements full game systems: shop UIs with currency logic, enemy AI, leaderboards, audio systems with ambient and reactive sound, and economy balance — all in one pass.',
    bullets: [
      'Economy: coins, XP, shop, virtual currency — balanced',
      'UI: inventory, shop, HUD — styled to your game',
      'Audio: ambient + event-driven SFX auto-placed',
    ],
    mockupLabel: 'GAME SYSTEMS',
    mockupColor: '#D4AF37',
    mockupLines: [
      { text: '> build a full game economy system', highlight: true },
      { text: '→ CurrencyService: coins + gems + XP', color: '#8B95B0' },
      { text: '→ ShopGui: 3 tabs, 12 items, animations', color: '#8B95B0' },
      { text: '→ Economy balance: 15 coins/kill (tuned)', color: '#D4AF37' },
      { text: '✓ 4 scripts, 1 UI module, playtested', color: '#10B981' },
    ],
    flip: false,
  },
]

interface MockupLine {
  text: string
  highlight?: boolean
  color?: string
}

function FeatureMockup({ lines, label, color }: { lines: MockupLine[]; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: 'rgba(12,16,48,0.9)',
        border: '1px solid rgba(26,37,80,0.9)',
        boxShadow: `0 12px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025), 0 0 30px ${color}14`,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = `0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 50px ${color}28`
        el.style.borderColor = `${color}40`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = `0 12px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025), 0 0 30px ${color}14`
        el.style.borderColor = 'rgba(26,37,80,0.9)'
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(26,37,80,0.8)', background: 'rgba(8,12,34,0.95)' }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: '#FF5F56' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: '#27C93F' }} />
        <span className="ml-3 text-[11px] font-mono" style={{ color: 'rgba(212,175,55,0.45)' }}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-[10px]" style={{ color }}>Active</span>
        </div>
      </div>

      {/* Lines */}
      <div className="p-4 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-6 sm:leading-7 space-y-0.5 overflow-x-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className="whitespace-nowrap"
            style={{ color: line.highlight ? '#FFFFFF' : (line.color ?? '#8B95B0') }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Bottom accent line — color blend with gold */}
      <div
        className="h-px"
        style={{ background: `linear-gradient(to right, transparent, ${color}80, #D4AF3750, ${color}80, transparent)` }}
      />
    </div>
  )
}

export default function FeatureSpotlight() {
  return (
    <section
      className="py-12 sm:py-16 px-6"
      style={{
        background: '#080C22',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow — top center */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {/* Radial glow — bottom left */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-10%',
          width: '50%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-6xl mx-auto" style={{ position: 'relative' }}>
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'var(--gold, #D4AF37)' }}
          >
            How It Works
          </p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))', letterSpacing: '-0.02em', fontSize: 'clamp(1.75rem, 5vw, 2.25rem)' }}
          >
            Built for every layer of your game.
          </h2>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: '#8B95B0' }}>
            From first idea to published game — ForjeGames covers the full stack.
          </p>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col gap-10 sm:gap-14">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center ${
                feature.flip ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''
              }`}
            >
              {/* Text side */}
              <div className="min-w-0">
                {/* Tag pill */}
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
                  style={{
                    background: 'rgba(212,175,55,0.07)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.2)',
                    boxShadow: '0 0 12px rgba(212,175,55,0.08)',
                  }}
                >
                  {/* Gold dot */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#D4AF37',
                      boxShadow: '0 0 6px rgba(212,175,55,0.6)',
                    }}
                  />
                  {feature.tag}
                </span>

                <h3
                  className="font-bold tracking-tight mb-4"
                  style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))', letterSpacing: '-0.015em', fontSize: 'clamp(1.5rem, 4vw, 1.875rem)' }}
                >
                  {feature.headline}
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#8B95B0' }}>
                  {feature.body}
                </p>

                <ul className="space-y-3">
                  {feature.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {/* Icon well */}
                      <span
                        className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(212,175,55,0.10)',
                          border: '1px solid rgba(212,175,55,0.22)',
                          boxShadow: '0 0 8px rgba(212,175,55,0.08)',
                        }}
                      >
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup side */}
              <FeatureMockup
                lines={feature.mockupLines}
                label={feature.mockupLabel}
                color={feature.mockupColor}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
