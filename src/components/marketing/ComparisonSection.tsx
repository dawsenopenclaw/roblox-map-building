import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────────
   ForjeGames vs Competitors — simple ranking/comparison
   Rating: 2 = Full / Yes, 1 = Partial / Limited, 0 = No
─────────────────────────────────────────────────────────────────── */

type Rating = 0 | 1 | 2

type FeatureRow = {
  feature: string
  forje: Rating
  ropilot: Rating
  forgegui: Rating
  bloxtoolkit: Rating
  rebirth: Rating
}

const COMPETITORS = ['Ropilot', 'ForgeGUI', 'BloxToolkit', 'Rebirth'] as const

const ROWS: FeatureRow[] = [
  { feature: 'Full game generation (terrain + scripts + UI + assets)',
    forje: 2, ropilot: 1, forgegui: 0, bloxtoolkit: 1, rebirth: 1 },
  { feature: '3D model generation (Meshy / Blender)',
    forje: 2, ropilot: 0, forgegui: 0, bloxtoolkit: 0, rebirth: 0 },
  { feature: 'Studio plugin with real-time sync',
    forje: 2, ropilot: 2, forgegui: 1, bloxtoolkit: 1, rebirth: 1 },
  { feature: 'Auto-playtest + bug fixing',
    forje: 2, ropilot: 2, forgegui: 0, bloxtoolkit: 0, rebirth: 0 },
  { feature: 'Multi-AI provider (Claude, Gemini, Groq)',
    forje: 2, ropilot: 1, forgegui: 0, bloxtoolkit: 0, rebirth: 1 },
  { feature: 'Cloud session persistence',
    forje: 2, ropilot: 1, forgegui: 1, bloxtoolkit: 0, rebirth: 1 },
  { feature: 'Robux payment option',
    forje: 2, ropilot: 0, forgegui: 2, bloxtoolkit: 0, rebirth: 0 },
  { feature: 'Marketplace + revenue sharing',
    forje: 2, ropilot: 0, forgegui: 0, bloxtoolkit: 0, rebirth: 0 },
]

/* ──────────────────────────────────────────────────────────────────
   Rating dot — green (Yes), yellow (Partial), red (No)
─────────────────────────────────────────────────────────────────── */
function RatingDot({ value, highlighted = false }: { value: Rating; highlighted?: boolean }) {
  const styles = {
    2: {
      bg: highlighted ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.45)',
      dot: '#22C55E',
      label: 'Yes',
    },
    1: {
      bg: 'rgba(234,179,8,0.12)',
      border: 'rgba(234,179,8,0.40)',
      dot: '#EAB308',
      label: 'Partial',
    },
    0: {
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.32)',
      dot: '#EF4444',
      label: 'No',
    },
  }[value]

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
      aria-label={styles.label}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: styles.dot, boxShadow: `0 0 6px ${styles.dot}80` }}
      />
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: styles.dot }}>
        {styles.label}
      </span>
    </div>
  )
}

/* Mobile-only compact dot (no label, saves space in stacked cards) */
function CompactDot({ value }: { value: Rating }) {
  const color = value === 2 ? '#22C55E' : value === 1 ? '#EAB308' : '#EF4444'
  const label = value === 2 ? 'Yes' : value === 1 ? 'Partial' : 'No'
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color }}>
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
      />
      {label}
    </span>
  )
}

export default function ComparisonSection() {
  return (
    <section
      id="compare"
      className="py-16 sm:py-20 px-6 relative scroll-mt-16"
      style={{ background: '#050810' }}
    >
      {/* soft gold glow */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(212,175,55,0.035) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-3"
            style={{ color: 'rgba(212,175,55,0.65)' }}
          >
            ForjeGames vs Competitors
          </p>
          <h2
            className="font-bold tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#FAFAFA',
            }}
          >
            Builds full games. Here&apos;s how we compare.
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: '#8B95B0' }}
          >
            Other tools generate scripts. ForjeGames builds the whole game.
          </p>
        </div>

        {/* ═══════════════ DESKTOP TABLE (md+) ═══════════════ */}
        <div
          className="hidden md:block rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                <th
                  className="text-left px-5 py-4 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: '#8B95B0', width: '32%' }}
                >
                  Feature
                </th>
                <th
                  className="text-center px-3 py-4 text-sm font-bold"
                  style={{
                    color: '#FFD166',
                    borderLeft: '2px solid rgba(212,175,55,0.55)',
                    background: 'rgba(212,175,55,0.06)',
                    textShadow: '0 0 12px rgba(212,175,55,0.35)',
                  }}
                >
                  ForjeGames
                </th>
                {COMPETITORS.map((name) => (
                  <th
                    key={name}
                    className="text-center px-3 py-4 text-sm font-medium"
                    style={{ color: '#A1A1AA' }}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                const rowBg = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                return (
                  <tr
                    key={row.feature}
                    style={{
                      background: rowBg,
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: '#E4E4E7' }}
                    >
                      {row.feature}
                    </td>
                    <td
                      className="text-center px-3 py-4"
                      style={{
                        borderLeft: '2px solid rgba(212,175,55,0.55)',
                        background: 'rgba(212,175,55,0.045)',
                      }}
                    >
                      <RatingDot value={row.forje} highlighted />
                    </td>
                    <td className="text-center px-3 py-4">
                      <RatingDot value={row.ropilot} />
                    </td>
                    <td className="text-center px-3 py-4">
                      <RatingDot value={row.forgegui} />
                    </td>
                    <td className="text-center px-3 py-4">
                      <RatingDot value={row.bloxtoolkit} />
                    </td>
                    <td className="text-center px-3 py-4">
                      <RatingDot value={row.rebirth} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ═══════════════ MOBILE STACKED CARDS (< md) ═══════════════ */}
        <div className="md:hidden space-y-4">
          {/* ForjeGames card (highlighted) */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.28)',
              borderLeft: '3px solid rgba(212,175,55,0.7)',
              boxShadow: '0 0 24px rgba(212,175,55,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-bold"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 10px rgba(212,175,55,0.35)',
                }}
              >
                ForjeGames
              </h3>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  color: '#FFD166',
                }}
              >
                Best
              </span>
            </div>
            <ul className="space-y-2.5">
              {ROWS.map((row) => (
                <li
                  key={row.feature}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-[13px] leading-snug flex-1" style={{ color: '#E4E4E7' }}>
                    {row.feature}
                  </span>
                  <CompactDot value={row.forje} />
                </li>
              ))}
            </ul>
          </div>

          {/* Competitor cards */}
          {COMPETITORS.map((name) => {
            const key = name.toLowerCase() as 'ropilot' | 'forgegui' | 'bloxtoolkit' | 'rebirth'
            return (
              <div
                key={name}
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <h3 className="text-base font-semibold mb-4" style={{ color: '#E4E4E7' }}>
                  {name}
                </h3>
                <ul className="space-y-2.5">
                  {ROWS.map((row) => (
                    <li
                      key={row.feature}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="text-[13px] leading-snug flex-1" style={{ color: '#A1A1AA' }}>
                        {row.feature}
                      </span>
                      <CompactDot value={row[key]} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Footer: legend + footnote + CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8B95B0' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E80' }} />
              Yes
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8B95B0' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#EAB308', boxShadow: '0 0 6px #EAB30880' }} />
              Partial
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8B95B0' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444', boxShadow: '0 0 6px #EF444480' }} />
              No
            </span>
            <span className="text-[11px]" style={{ color: '#52525B' }}>
              &middot; Last updated April 2026
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/editor"
            className="nav-cta-gold text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 w-full sm:w-auto text-center"
          >
            Try ForjeGames free
          </Link>
        </div>
      </div>
    </section>
  )
}
