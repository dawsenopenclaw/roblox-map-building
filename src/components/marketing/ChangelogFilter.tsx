'use client'

import type { ChangelogCategory } from '@/lib/changelog-data'

export type FilterValue = ChangelogCategory | 'All'

const CATEGORY_ORDER: FilterValue[] = [
  'All',
  'AI',
  'Editor',
  'Real-time',
  'Marketplace',
  'Payments',
  'Growth',
  'Security',
  'Plugin',
  'Marketing',
]

interface ChangelogFilterProps {
  active: FilterValue
  counts: Record<FilterValue, number>
  onChange: (value: FilterValue) => void
}

export function ChangelogFilter({ active, counts, onChange }: ChangelogFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter changelog by category"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {CATEGORY_ORDER.map((cat) => {
        const count = counts[cat] || 0
        if (count === 0 && cat !== 'All') return null
        const isActive = active === cat
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
            style={{
              background: isActive ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
              borderColor: isActive ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
              color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.65)',
            }}
          >
            <span>{cat}</span>
            <span
              className="rounded-full px-1.5 text-[10px] font-bold leading-4"
              style={{
                background: isActive ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.5)',
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
