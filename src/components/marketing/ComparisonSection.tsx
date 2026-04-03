import Link from 'next/link'

const ROWS = [
  { feature: 'Luau Scripts',        scriptOnly: true,  forje: true  },
  { feature: '3D Model Generation', scriptOnly: false, forje: true  },
  { feature: 'Terrain & Maps',      scriptOnly: false, forje: true  },
  { feature: 'UI Design',           scriptOnly: false, forje: true  },
  { feature: 'Economy Balance',     scriptOnly: false, forje: true  },
  { feature: 'Audio & SFX',         scriptOnly: false, forje: true  },
  { feature: 'Voice Input',         scriptOnly: false, forje: true  },
  { feature: 'Image-to-Map',        scriptOnly: false, forje: true  },
]

function CheckIcon({ gold }: { gold?: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{
        background: gold ? 'rgba(255,184,28,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${gold ? 'rgba(255,184,28,0.4)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: gold ? '0 0 10px rgba(255,184,28,0.25)' : 'none',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={gold ? '#FFD166' : 'rgba(255,255,255,0.4)'} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function XIcon() {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  )
}

export default function ComparisonSection() {
  return (
    <section className="py-16 px-6" style={{ background: '#0A0E27' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: '#FFB81C' }}
          >
            Beyond Scripting
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
            Script-only tools stop here.
          </h2>
          <p className="text-lg" style={{ color: '#8B95B0' }}>
            ForjeGames builds every layer of your game.
          </p>
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid #1A2550' }}
        >
          {/* Header row */}
          <div
            className="grid grid-cols-3 px-6 py-4"
            style={{ background: '#0F1535', borderBottom: '1px solid #1A2550' }}
          >
            <div />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#8B95B0' }}>
                Script-Only Tools
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-sm font-bold"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 12px rgba(255,184,28,0.6), 0 0 24px rgba(212,175,55,0.3)',
                  letterSpacing: '0.01em',
                }}
              >
                ForjeGames
              </p>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-3 items-center px-6 py-4 transition-colors duration-150"
              style={{
                background: i % 2 === 0 ? '#0A0E27' : '#0D1230',
                borderBottom: i < ROWS.length - 1 ? '1px solid rgba(26,37,80,0.5)' : 'none',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                {row.feature}
              </p>
              <div className="flex justify-center">
                {row.scriptOnly ? <CheckIcon /> : <XIcon />}
              </div>
              <div className="flex justify-center">
                {row.forje ? <CheckIcon gold /> : <XIcon />}
              </div>
            </div>
          ))}

          {/* Bottom CTA row */}
          <div
            className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'rgba(255,184,28,0.04)', borderTop: '1px solid rgba(255,184,28,0.12)' }}
          >
            <p className="text-sm" style={{ color: '#8B95B0' }}>
              One platform. Every game system.
            </p>
            <Link
              href="/editor"
              className="nav-cta-gold text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200"
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
