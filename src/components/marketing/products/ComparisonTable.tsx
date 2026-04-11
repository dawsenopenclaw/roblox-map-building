'use client'

/**
 * ComparisonTable — ForjeGames vs alternative comparison.
 *
 * Renders a real HTML <table> for screen-reader friendliness. Boolean values
 * become a checkmark/X with aria-label so AT users get "included" / "not
 * included" semantics. On narrow viewports the table switches to a stacked
 * card layout for readability.
 */

import type { ComparisonRow } from '@/lib/marketing/product-copy'

export interface ComparisonTableProps {
  title: string
  subtitle?: string
  headerForje: string
  headerAlternative: string
  rows: ComparisonRow[]
}

function renderCell(value: string | boolean, positive: boolean) {
  if (typeof value === 'boolean') {
    const label = value ? 'Included' : 'Not included'
    return (
      <span
        className={
          value
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full'
            : 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-zinc-500'
        }
        style={
          value
            ? { background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }
            : undefined
        }
        aria-label={label}
        role="img"
      >
        {value ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        )}
      </span>
    )
  }
  return (
    <span className={positive ? 'font-semibold text-white' : 'text-zinc-400'}>
      {value}
    </span>
  )
}

export default function ComparisonTable({
  title,
  subtitle,
  headerForje,
  headerAlternative,
  rows,
}: ComparisonTableProps) {
  return (
    <section className="relative py-20 md:py-28" aria-labelledby="comparison-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="comparison-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-zinc-400 md:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Desktop table */}
        <div className="mt-12 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="bg-white/[0.03]">
                <th
                  scope="col"
                  className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Feature
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#D4AF37' }}
                >
                  {headerForje}
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {headerAlternative}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={
                    idx % 2 === 0
                      ? 'border-t border-white/[0.06]'
                      : 'border-t border-white/[0.06] bg-white/[0.01]'
                  }
                  style={
                    row.highlight
                      ? { background: 'rgba(212,175,55,0.06)' }
                      : undefined
                  }
                >
                  <th
                    scope="row"
                    className="p-4 text-left font-medium text-zinc-300"
                  >
                    {row.label}
                  </th>
                  <td className="p-4">{renderCell(row.forje, true)}</td>
                  <td className="p-4">{renderCell(row.alternative, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="mt-10 space-y-3 md:hidden">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              style={row.highlight ? { background: 'rgba(212,175,55,0.06)' } : undefined}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {row.label}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: '#D4AF37' }}>
                    {headerForje}
                  </div>
                  <div className="mt-1">{renderCell(row.forje, true)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {headerAlternative}
                  </div>
                  <div className="mt-1">{renderCell(row.alternative, false)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
