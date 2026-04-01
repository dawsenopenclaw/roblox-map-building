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
    mockupColor: '#FFB81C',
    mockupLines: [
      { text: '> build a full game economy system', highlight: true },
      { text: '→ CurrencyService: coins + gems + XP', color: '#8B95B0' },
      { text: '→ ShopGui: 3 tabs, 12 items, animations', color: '#8B95B0' },
      { text: '→ Economy balance: 15 coins/kill (tuned)', color: '#FFB81C' },
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
      className="rounded-xl overflow-hidden w-full"
      style={{
        background: '#0F1535',
        border: '1px solid #1A2550',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid #1A2550', background: '#0A0E27' }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: '#FF5F56' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-2 h-2 rounded-full" style={{ background: '#27C93F' }} />
        <span className="ml-3 text-[11px] font-mono" style={{ color: 'rgba(255,184,28,0.4)' }}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-[10px]" style={{ color }}>Active</span>
        </div>
      </div>

      {/* Lines */}
      <div className="p-5 font-mono text-[13px] leading-7 space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{ color: line.highlight ? '#FFFFFF' : (line.color ?? '#8B95B0') }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Bottom accent line */}
      <div
        className="h-0.5"
        style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }}
      />
    </div>
  )
}

export default function FeatureSpotlight() {
  return (
    <section className="py-32 px-6" style={{ background: '#0A0E27' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: '#FFB81C' }}
          >
            How It Works
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
            Built for every layer of your game.
          </h2>
          <p className="text-lg max-w-md mx-auto" style={{ color: '#8B95B0' }}>
            From first idea to published game — ForjeGames covers the full stack.
          </p>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col gap-24">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                feature.flip ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''
              }`}
            >
              {/* Text side */}
              <div>
                <span
                  className="inline-block text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{
                    background: 'rgba(255,184,28,0.08)',
                    color: '#FFB81C',
                    border: '1px solid rgba(255,184,28,0.2)',
                  }}
                >
                  {feature.tag}
                </span>
                <h3
                  className="text-3xl font-bold tracking-tight mb-4"
                  style={{ color: '#FFFFFF' }}
                >
                  {feature.headline}
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#8B95B0' }}>
                  {feature.body}
                </p>
                <ul className="space-y-3">
                  {feature.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,184,28,0.12)', border: '1px solid rgba(255,184,28,0.25)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
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
