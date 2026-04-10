import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────────
   ForjeGames vs Competitors — simple ranking/comparison
   Rating: 2 = Full / Yes, 1 = Partial / Limited, 0 = No
─────────────────────────────────────────────────────────────────── */

type Rating = 0 | 1 | 2

type FeatureRow = {
  feature: string
  icon: string
  forje: Rating
  ropilot: Rating
  forgegui: Rating
  bloxtoolkit: Rating
  rebirth: Rating
}

type CompetitorKey = 'ropilot' | 'forgegui' | 'bloxtoolkit' | 'rebirth'

const COMPETITORS: { key: CompetitorKey; name: string; accent: string }[] = [
  { key: 'ropilot', name: 'Ropilot', accent: 'rgba(96,165,250,0.55)' },
  { key: 'forgegui', name: 'ForgeGUI', accent: 'rgba(168,85,247,0.55)' },
  { key: 'bloxtoolkit', name: 'BloxToolkit', accent: 'rgba(34,197,94,0.55)' },
  { key: 'rebirth', name: 'Rebirth', accent: 'rgba(244,63,94,0.55)' },
]

const ROWS: FeatureRow[] = [
  {
    feature: 'Full game generation (terrain + scripts + UI + assets)',
    icon: 'M12 2 2 7l10 5 10-5-10-5Zm0 13L2 10v7l10 5 10-5v-7l-10 5Z',
    forje: 2, ropilot: 1, forgegui: 0, bloxtoolkit: 1, rebirth: 1,
  },
  {
    feature: '3D model generation (Meshy / Blender)',
    icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    forje: 2, ropilot: 0, forgegui: 0, bloxtoolkit: 0, rebirth: 0,
  },
  {
    feature: 'Studio plugin with real-time sync',
    icon: 'M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0ZM12 6v6l4 2',
    forje: 2, ropilot: 2, forgegui: 1, bloxtoolkit: 1, rebirth: 1,
  },
  {
    feature: 'Auto-playtest + bug fixing',
    icon: 'M9 12l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    forje: 2, ropilot: 2, forgegui: 0, bloxtoolkit: 0, rebirth: 0,
  },
  {
    feature: 'Multi-AI provider (Claude, Gemini, Groq)',
    icon: 'M12 2a10 10 0 1 0 10 10M12 2v10l7 7',
    forje: 2, ropilot: 1, forgegui: 0, bloxtoolkit: 0, rebirth: 1,
  },
  {
    feature: 'Cloud session persistence',
    icon: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10Z',
    forje: 2, ropilot: 1, forgegui: 1, bloxtoolkit: 0, rebirth: 1,
  },
  {
    feature: 'Robux payment option',
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    forje: 2, ropilot: 0, forgegui: 2, bloxtoolkit: 0, rebirth: 0,
  },
  {
    feature: 'Marketplace + revenue sharing',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M9 22V12h6v10',
    forje: 2, ropilot: 0, forgegui: 0, bloxtoolkit: 0, rebirth: 0,
  },
]

/* ──────────────────────────────────────────────────────────────────
   Rating dot — green (Yes), yellow (Partial), red (No)
─────────────────────────────────────────────────────────────────── */
function RatingDot({ value, highlighted = false }: { value: Rating; highlighted?: boolean }) {
  const styles = {
    2: {
      bg: highlighted ? 'rgba(34,197,94,0.22)' : 'rgba(34,197,94,0.14)',
      border: 'rgba(34,197,94,0.55)',
      dot: '#22C55E',
      label: 'Yes',
    },
    1: {
      bg: 'rgba(234,179,8,0.14)',
      border: 'rgba(234,179,8,0.48)',
      dot: '#EAB308',
      label: 'Partial',
    },
    0: {
      bg: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.40)',
      dot: '#EF4444',
      label: 'No',
    },
  }[value]

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
      aria-label={styles.label}
    >
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: styles.dot, boxShadow: `0 0 10px ${styles.dot}B0` }}
      />
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: styles.dot }}>
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
    <span className="inline-flex items-center gap-2 text-[12px] font-semibold" style={{ color }}>
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}B0` }}
      />
      {label}
    </span>
  )
}

/* Inline icon next to each feature label for quick scanning */
function FeatureIcon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
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

      <div className="relative max-w-6xl mx-auto">
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
            style={{ color: '#A8B3C8' }}
          >
            Other tools generate scripts. ForjeGames builds the whole game.
          </p>
        </div>

        {/* ═══════════════ DESKTOP TABLE (md+) ═══════════════ */}
        <div
          className="hidden md:block rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.02)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="sticky top-0 z-10"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,21,53,0.96) 0%, rgba(10,14,32,0.92) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <th
                  className="text-left px-6 py-5 text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: '#A8B3C8', width: '34%' }}
                >
                  Feature
                </th>
                <th
                  className="text-center px-3 py-5 text-[15px] font-extrabold"
                  style={{
                    color: '#FFD166',
                    borderLeft: '2px solid rgba(212,175,55,0.65)',
                    borderRight: '2px solid rgba(212,175,55,0.65)',
                    background:
                      'linear-gradient(180deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.08) 100%)',
                    textShadow: '0 0 14px rgba(212,175,55,0.5)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l2.39 7.36H22l-6.2 4.51 2.4 7.36L12 16.73l-6.2 4.5 2.4-7.36L2 9.36h7.61L12 2z" />
                    </svg>
                    ForjeGames
                  </div>
                </th>
                {COMPETITORS.map((c) => (
                  <th
                    key={c.name}
                    className="text-center px-3 py-5 text-[14px] font-semibold"
                    style={{
                      color: '#C7CEDB',
                      borderBottom: `2px solid ${c.accent}`,
                    }}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                const rowBg = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)'
                return (
                  <tr
                    key={row.feature}
                    style={{
                      background: rowBg,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <td
                      className="px-6 py-5 text-[15px] font-semibold"
                      style={{ color: '#ECEDF1' }}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'rgba(212,175,55,0.75)' }}>
                          <FeatureIcon path={row.icon} />
                        </span>
                        <span className="leading-snug">{row.feature}</span>
                      </div>
                    </td>
                    <td
                      className="text-center px-3 py-5"
                      style={{
                        borderLeft: '2px solid rgba(212,175,55,0.65)',
                        borderRight: '2px solid rgba(212,175,55,0.65)',
                        background:
                          'linear-gradient(180deg, rgba(212,175,55,0.09) 0%, rgba(212,175,55,0.04) 100%)',
                      }}
                    >
                      <RatingDot value={row.forje} highlighted />
                    </td>
                    <td className="text-center px-3 py-5">
                      <RatingDot value={row.ropilot} />
                    </td>
                    <td className="text-center px-3 py-5">
                      <RatingDot value={row.forgegui} />
                    </td>
                    <td className="text-center px-3 py-5">
                      <RatingDot value={row.bloxtoolkit} />
                    </td>
                    <td className="text-center px-3 py-5">
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
              background:
                'linear-gradient(180deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 100%)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderLeft: '3px solid rgba(212,175,55,0.8)',
              boxShadow: '0 0 28px rgba(212,175,55,0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-extrabold flex items-center gap-2"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 10px rgba(212,175,55,0.4)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.39 7.36H22l-6.2 4.51 2.4 7.36L12 16.73l-6.2 4.5 2.4-7.36L2 9.36h7.61L12 2z" />
                </svg>
                ForjeGames
              </h3>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.45)',
                  color: '#FFD166',
                }}
              >
                Best
              </span>
            </div>
            <ul className="space-y-3">
              {ROWS.map((row) => (
                <li
                  key={row.feature}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-[14px] font-medium leading-snug flex-1 flex items-start gap-2" style={{ color: '#ECEDF1' }}>
                    <span style={{ color: 'rgba(212,175,55,0.75)' }}>
                      <FeatureIcon path={row.icon} />
                    </span>
                    {row.feature}
                  </span>
                  <CompactDot value={row.forje} />
                </li>
              ))}
            </ul>
          </div>

          {/* Competitor cards */}
          {COMPETITORS.map((c) => (
            <div
              key={c.name}
              className="rounded-xl p-5"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderLeft: `3px solid ${c.accent}`,
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: '#ECEDF1' }}>
                {c.name}
              </h3>
              <ul className="space-y-3">
                {ROWS.map((row) => (
                  <li
                    key={row.feature}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-[14px] font-medium leading-snug flex-1 flex items-start gap-2" style={{ color: '#C7CEDB' }}>
                      <span style={{ color: 'rgba(168,179,200,0.6)' }}>
                        <FeatureIcon path={row.icon} />
                      </span>
                      {row.feature}
                    </span>
                    <CompactDot value={row[c.key]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer: legend + footnote + CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#A8B3C8' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55EB0' }} />
              Yes
            </span>
            <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#A8B3C8' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EAB308', boxShadow: '0 0 8px #EAB308B0' }} />
              Partial
            </span>
            <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#A8B3C8' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444', boxShadow: '0 0 8px #EF4444B0' }} />
              No
            </span>
            <span className="text-[12px]" style={{ color: '#6B7699' }}>
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
