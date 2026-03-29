import Link from 'next/link'

// ---------------------------------------------------------------------------
// Hero mockup — CSS-only editor UI
// ---------------------------------------------------------------------------

function HeroMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#080B1E] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0D1231] border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        <div className="ml-3 flex-1 bg-[#060916] rounded px-3 py-1 text-xs text-gray-500 font-mono">
          app.forjegames.com/workspace
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex" style={{ height: '380px' }}>

        {/* LEFT — file tree */}
        <div className="w-44 flex-shrink-0 bg-[#0A0E1F] border-r border-white/10 p-3 hidden sm:flex flex-col gap-0.5">
          <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">Workspace</p>
          {[
            { indent: 0, label: 'Terrain', icon: '▼', color: 'text-[#FFB81C]' },
            { indent: 1, label: 'Baseplate', icon: '—', color: 'text-gray-500' },
            { indent: 1, label: 'Water', icon: '—', color: 'text-gray-500' },
            { indent: 0, label: 'Buildings', icon: '▼', color: 'text-[#FFB81C]' },
            { indent: 1, label: 'Castle_Main', icon: '—', color: 'text-white' },
            { indent: 1, label: 'Tower_NW', icon: '—', color: 'text-gray-400' },
            { indent: 1, label: 'Tower_NE', icon: '—', color: 'text-gray-400' },
            { indent: 1, label: 'Drawbridge', icon: '—', color: 'text-gray-400' },
            { indent: 0, label: 'NPCs', icon: '▼', color: 'text-[#FFB81C]' },
            { indent: 1, label: 'Guard_01', icon: '—', color: 'text-gray-500' },
          ].map((row, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-1 py-0.5 rounded ${row.label === 'Castle_Main' ? 'bg-[#FFB81C]/10' : ''}`}
              style={{ paddingLeft: `${4 + row.indent * 12}px` }}
            >
              <span className="text-[9px] text-gray-600 w-3">{row.icon}</span>
              <span className={`text-[10px] ${row.color}`}>{row.label}</span>
            </div>
          ))}
        </div>

        {/* CENTER — viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Viewport */}
          <div className="flex-1 relative bg-[#060916] overflow-hidden">
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Scene */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: '280px', height: '210px' }}>
                {/* Moat / water */}
                <div
                  className="absolute rounded"
                  style={{
                    left: 10, top: 100, width: 260, height: 80,
                    background: 'linear-gradient(180deg, #0d2040 0%, #071428 100%)',
                    border: '1px solid rgba(30,100,180,0.3)',
                  }}
                />
                {/* Castle keep */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    left: 90, top: 40, width: 100, height: 100,
                    background: 'linear-gradient(160deg, #2a3040 0%, #161c30 100%)',
                    border: '1.5px solid rgba(255,184,28,0.4)',
                    boxShadow: '0 0 20px rgba(255,184,28,0.12)',
                  }}
                />
                {/* Corner towers */}
                {[[70, 30], [190, 30], [70, 110], [190, 110]].map(([l, t], i) => (
                  <div
                    key={i}
                    className="absolute rounded-sm"
                    style={{
                      left: l, top: t, width: 22, height: 60,
                      background: 'linear-gradient(160deg, #323848 0%, #1a2030 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
                {/* Drawbridge */}
                <div
                  className="absolute"
                  style={{
                    left: 125, top: 140, width: 30, height: 12,
                    background: '#2a1e10',
                    border: '1px solid rgba(150,100,50,0.4)',
                  }}
                />
                {/* Gold selection ring */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    left: 86, top: 36, width: 108, height: 108,
                    border: '1.5px solid #FFB81C',
                    boxShadow: '0 0 16px rgba(255,184,28,0.2)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Command bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0A0E1F] border-t border-white/10">
            <div className="w-4 h-4 rounded-full bg-[#FFB81C]/20 flex items-center justify-center flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]" />
            </div>
            <span className="text-xs text-[#FFB81C]/80 font-mono flex-1">
              Build me a medieval castle with a moat
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono">Enter</kbd>
            </div>
          </div>
        </div>

        {/* RIGHT — AI output */}
        <div className="w-44 flex-shrink-0 bg-[#0A0E1F] border-l border-white/10 p-3 hidden md:flex flex-col gap-2">
          <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1">AI Output</p>
          {[
            { label: 'Terrain generated', done: true },
            { label: 'Castle placed', done: true },
            { label: 'Moat added', done: true },
            { label: 'Towers placed', done: true },
            { label: 'NPCs spawned', done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.done
                    ? 'bg-[#27C93F]/20 border border-[#27C93F]/40'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {item.done && (
                  <svg className="w-2.5 h-2.5 text-[#27C93F]" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {!item.done && <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] animate-pulse" />}
              </div>
              <span className={`text-[10px] ${item.done ? 'text-gray-300' : 'text-[#FFB81C]'}`}>
                {item.label}
              </span>
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-white/10">
            <div className="text-[9px] text-gray-600 mb-1">Time elapsed</div>
            <div className="text-sm font-mono font-bold text-[#FFB81C]">0:04.2s</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feature card mockups
// ---------------------------------------------------------------------------

function VoiceMockup() {
  const bars = [3, 6, 11, 5, 16, 9, 14, 7, 18, 8, 13, 17, 6, 12, 10, 4, 15, 9, 7, 11]
  return (
    <div className="bg-[#080B1E] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#27C93F] animate-pulse" />
        <span className="text-[11px] font-medium text-gray-300">Listening...</span>
      </div>
      <div className="p-4">
        <div className="flex items-end justify-center gap-[3px] mb-4 h-12">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-[#FFB81C]"
              style={{ height: `${h}px`, opacity: 0.35 + (h / 18) * 0.65 }}
            />
          ))}
        </div>
        <div className="bg-[#0A0E27] rounded-lg p-3 mb-3 border border-white/5">
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-medium">"Build a racing track</span> with banked corners, a pit lane, and grandstands for 500 players..."
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 100, 200].map((delay) => (
              <div
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500">Sourcing assets...</span>
        </div>
      </div>
    </div>
  )
}

function DnaMockup() {
  const bars = [
    { label: 'Retention', value: 87, color: '#FFB81C' },
    { label: 'Monetization', value: 72, color: '#8B5CF6' },
    { label: 'Discovery', value: 91, color: '#27C93F' },
    { label: 'Engagement', value: 65, color: '#3B82F6' },
  ]
  return (
    <div className="bg-[#080B1E] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-300">Pet Simulator X Analysis</span>
        <div className="bg-[#FFB81C]/15 border border-[#FFB81C]/30 rounded px-2 py-0.5 text-[10px] font-bold text-[#FFB81C]">87/100</div>
      </div>
      <div className="p-4 space-y-2.5">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500">{b.label}</span>
              <span className="text-[10px] font-mono font-semibold" style={{ color: b.color }}>{b.value}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${b.value}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
        <div className="pt-1 text-[9px] text-gray-600">Core loop: Collect → Hatch → Trade · Loop time: 8 min</div>
      </div>
    </div>
  )
}

function MarketplaceMockup() {
  const items = [
    { name: 'City Starter', price: '$14.99', tag: 'Best Seller' },
    { name: 'Obby Kit Pro', price: '$9.99', tag: '' },
    { name: 'Simulator Core', price: '$24.99', tag: 'New' },
    { name: 'Horror Map', price: '$7.99', tag: '' },
  ]
  return (
    <div className="bg-[#080B1E] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-300">Template Marketplace</span>
        <span className="text-[10px] text-gray-600">Your cut: 70%</span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="bg-[#0A0E1F] border border-white/5 rounded-lg p-2.5 hover:border-white/15 transition-colors cursor-pointer">
            <div className="w-full rounded-md mb-2 flex items-center justify-center" style={{ height: '40px', background: 'linear-gradient(135deg, #1a2040, #0d1228)' }}>
              <div className="w-6 h-6 rounded-sm bg-white/5 border border-white/10" />
            </div>
            <div className="text-[10px] font-medium text-white truncate">{item.name}</div>
            <div className="flex items-center justify-between mt-0.5">
              {item.tag
                ? <span className="text-[8px] text-[#FFB81C] font-semibold">{item.tag}</span>
                : <span />
              }
              <span className="text-[10px] text-[#27C93F] font-semibold">{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page (server component — no 'use client' needed)
// ---------------------------------------------------------------------------

export default function HomeClient() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-20 pb-16 max-w-7xl mx-auto">
        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #FFB81C 0%, transparent 70%)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
          aria-hidden
        />

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/25 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]" />
            <span className="text-xs font-semibold text-[#FFB81C] tracking-wide">Powered by Claude AI</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center font-bold leading-tight text-white mb-5"
            style={{ fontSize: 'clamp(36px, 6vw, 72px)', letterSpacing: '-0.02em' }}>
          Build Roblox Games
          <br />
          <span style={{ color: '#FFB81C' }}>10x Faster</span> with AI
        </h1>

        {/* Sub */}
        <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed"
           style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
          Describe what you want. AI builds it. No coding required.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto text-center bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-8 py-3.5 rounded-xl text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
          >
            Open Editor
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto text-center border border-white/15 hover:border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Hero mockup */}
        <HeroMockup />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SOCIAL PROOF BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-y border-white/8 py-4 px-4">
        <p className="text-center text-sm text-gray-600">
          Trusted by{' '}
          <span className="text-gray-400 font-medium">200+ Roblox creators</span>
          {' '}·{' '}
          <span className="text-gray-400 font-medium">$12K+ donated to education</span>
          {' '}·{' '}
          Built on Claude AI
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. THREE FEATURES */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-4 sm:px-6 py-24 max-w-7xl mx-auto" id="product">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            Everything you need to ship
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">Three tools. One platform. Zero excuses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#0D1231] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#FFB81C]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/15 border border-[#FFB81C]/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FFB81C]" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 10c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Speak It, Build It</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Describe your game in plain English. AI handles terrain, assets, and scripts automatically.</p>
            </div>
            <VoiceMockup />
          </div>

          {/* Card 2 */}
          <div className="bg-[#0D1231] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#8B5CF6]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#8B5CF6]" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Scan Any Game's DNA</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Paste any Roblox game URL. Get its exact formula — retention hooks, monetization, core loop.</p>
            </div>
            <DnaMockup />
          </div>

          {/* Card 3 */}
          <div className="bg-[#0D1231] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#27C93F]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#27C93F]/15 border border-[#27C93F]/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#27C93F]" viewBox="0 0 20 20" fill="none">
                <path d="M3 17h14M10 3l4 5H6l4-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Sell Your Creations</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Build templates. List them in our marketplace. Keep 70% of every sale, forever.</p>
            </div>
            <MarketplaceMockup />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HOW IT WORKS */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-4 sm:px-6 py-24 bg-[#0D1231]" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              How it works
            </h2>
            <p className="text-gray-500 text-lg">From idea to live game in minutes, not months.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden sm:block absolute top-8 left-[33%] right-[33%] h-px bg-gradient-to-r from-[#FFB81C]/30 via-[#FFB81C]/60 to-[#FFB81C]/30" />

            {[
              {
                step: '01',
                icon: (
                  <svg className="w-7 h-7 text-[#FFB81C]" viewBox="0 0 28 28" fill="none">
                    <path d="M6 8h16M6 14h10M6 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="22" cy="20" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M22 18v2l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Describe',
                desc: 'Tell the AI what you want to build in plain English.',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-7 h-7 text-[#FFB81C]" viewBox="0 0 28 28" fill="none">
                    <path d="M14 5l2 6h6l-5 3.5 2 6L14 17l-5 3.5 2-6L6 11h6l2-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Build',
                desc: 'AI generates terrain, places assets, and writes all the scripts.',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-7 h-7 text-[#FFB81C]" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M11 10l7 4-7 4V10z" fill="currentColor"/>
                  </svg>
                ),
                title: 'Play',
                desc: 'Test in Studio, then publish your game to millions of players.',
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/25 flex items-center justify-center relative z-10">
                  {s.icon}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#FFB81C]/60 tracking-widest uppercase mb-1">Step {s.step}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. FINAL CTA */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-4 sm:px-6 py-24 bg-[#0D1231]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>
            Start building
            <br />
            <span style={{ color: '#FFB81C' }}>right now</span>
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            1,000 free tokens. No credit card. Just open it and build.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-10 py-4 rounded-xl text-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
          >
            Try It Free
          </Link>
          <p className="text-gray-600 text-sm mt-4">
            No credit card required
          </p>
        </div>
      </section>
    </>
  )
}
