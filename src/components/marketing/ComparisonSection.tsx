import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────────
   ComparisonSection — asymmetric card layout
   3 dim competitor cards (left) vs 1 big glowing ForjeGames card (right)
   Visual weight difference IS the argument.
─────────────────────────────────────────────────────────────────── */

const COMPETITORS = [
  {
    name: 'Rebirth',
    price: '$8.99/mo',
    tagline: 'Scripts + 3D via Hunyuan',
    agents: 'Basic AI',
    accent: 'rgba(244,63,94,0.3)',
    accentSolid: 'rgba(244,63,94,0.7)',
  },
  {
    name: 'Lemonade',
    price: 'Free (1/day)',
    tagline: 'Scripts + file sync',
    agents: '15 models via OpenRouter',
    accent: 'rgba(168,85,247,0.3)',
    accentSolid: 'rgba(168,85,247,0.7)',
  },
  {
    name: 'Ropilot',
    price: '$20–250+/mo + BYOK',
    tagline: 'Desktop app + MCP',
    agents: 'Bring your own keys',
    accent: 'rgba(96,165,250,0.3)',
    accentSolid: 'rgba(96,165,250,0.7)',
  },
]

const FORJE_FEATURES = [
  '200+ Specialist AI Agents',
  'Auto Code Review (Security/Perf)',
  '25 Roblox API Knowledge Patterns',
  'Error Self-Repair Learning Loop',
  'Live Studio Sync + Console',
  '3D Mesh + 13 Image Styles',
  'Multi-Script Pipeline',
  'Voice + Image-to-Map Input',
]

function GoldCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: '#D4AF37', flexShrink: 0, marginTop: '1px' }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ComparisonSection() {
  return (
    <section
      id="compare"
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-10 relative scroll-mt-16 overflow-hidden"
      style={{ background: '#050810' }}
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            height: '60%',
            background:
              'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* ── Section Header ── */}
        <div className="text-center mb-14 reveal">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4"
            style={{ color: 'rgba(212,175,55,0.75)', fontFamily: 'monospace' }}
          >
            No contest
          </p>
          <h2
            className="font-bold tracking-tight leading-none mb-2"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 3.75rem)', color: '#FAFAFA' }}
          >
            Built different.
          </h2>
          <h2
            className="font-bold tracking-tight leading-none"
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 3.75rem)',
              background: 'linear-gradient(90deg, #D4AF37 0%, #FFD166 50%, #B8960C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Not even close.
          </h2>
        </div>

        {/* ── Card Grid ── */}
        {/* Desktop: [competitors col] [forje col]  |  Mobile: forje on top, competitors below */}
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-5 reveal">

          {/* ── Left: 3 competitor cards stacked ── */}
          <div className="flex flex-col gap-4 md:gap-3 md:w-[42%]">
            {COMPETITORS.map((c) => (
              <div
                key={c.name}
                className="flex-1 rounded-xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${c.accentSolid}`,
                }}
              >
                {/* Name row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: '#52525B' }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="text-[12px] font-bold px-2 py-0.5 rounded"
                    style={{
                      background: c.accent,
                      color: '#71717A',
                    }}
                  >
                    {c.price}
                  </span>
                </div>

                {/* Details */}
                <p className="text-[13px] leading-relaxed" style={{ color: '#3F3F46' }}>
                  {c.tagline} &middot; {c.agents}
                </p>
              </div>
            ))}
          </div>

          {/* ── Right: ForjeGames hero card ── */}
          <div
            className="md:flex-1 rounded-2xl p-7 sm:p-9 flex flex-col"
            style={{
              background:
                'linear-gradient(145deg, rgba(212,175,55,0.06) 0%, rgba(10,15,32,1) 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 60px rgba(212,175,55,0.1)',
            }}
          >
            {/* Badge */}
            <div className="mb-6 self-start">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  color: '#D4AF37',
                }}
              >
                All-inclusive
              </span>
            </div>

            {/* Name */}
            <h3
              className="font-black tracking-tight mb-1"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
                background: 'linear-gradient(90deg, #D4AF37 0%, #FFD166 60%, #B8960C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.1,
              }}
            >
              ForjeGames
            </h3>

            {/* Price */}
            <p
              className="text-[2.25rem] sm:text-[2.75rem] font-black mb-1"
              style={{ color: '#FAFAFA', lineHeight: 1 }}
            >
              $0 to start
            </p>

            {/* Subtitle */}
            <p
              className="text-[14px] font-medium mb-8"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              1,000 free tokens &middot; No credit card &middot; 40+ agents
            </p>

            {/* Feature checklist */}
            <ul className="space-y-3 mb-8">
              {FORJE_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <GoldCheck />
                  <span
                    className="text-[14px] sm:text-[15px] font-medium leading-snug"
                    style={{ color: '#E4E4E7' }}
                  >
                    {feat}
                  </span>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div
              className="mb-6 mt-auto"
              style={{ height: '1px', background: 'rgba(212,175,55,0.15)' }}
            />

            {/* In-card CTA */}
            <Link
              href="/editor"
              className="nav-cta-gold text-sm font-bold px-6 py-3 rounded-xl text-center transition-all duration-200 block w-full sm:w-auto sm:self-start"
            >
              Start building free
            </Link>
          </div>
        </div>

        {/* ── Bottom CTA row ── */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 reveal">
          <p className="text-[14px]" style={{ color: '#52525B' }}>
            See why builders switch
            <span
              className="mx-2 font-semibold"
              style={{ color: 'rgba(212,175,55,0.5)' }}
            >
              →
            </span>
          </p>
          <Link
            href="/editor"
            className="text-[14px] font-semibold transition-colors duration-150"
            style={{ color: '#D4AF37' }}
          >
            Start free
          </Link>
        </div>
      </div>
    </section>
  )
}
