'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  GAME_TEMPLATES_MARKETPLACE,
  GAME_GENRES,
  GENRE_COLORS,
  type GameTemplateMarketplace,
  type GameGenre,
} from '@/lib/game-templates-marketplace'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterGenre = 'All' | GameGenre
type SortOption = 'popular' | 'newest' | 'rating'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  intermediate: { label: 'Intermediate', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  advanced:     { label: 'Advanced',     color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
}

// Stable sort indexes so "newest" ordering is deterministic
const TEMPLATE_ORDER = Object.fromEntries(
  GAME_TEMPLATES_MARKETPLACE.map((t, i) => [t.id, i])
)

// Synthetic ratings and use-counts derived from template-generator.ts SEED_TEMPLATES
const TEMPLATE_META: Record<string, { rating: number; useCount: number }> = {
  'sigma-clicker':      { rating: 0.95, useCount: 1240 },
  'find-skibidi':       { rating: 0.92, useCount: 870 },
  'only-up-obby':       { rating: 0.94, useCount: 1560 },
  'pet-hatch':          { rating: 0.96, useCount: 1890 },
  'punch-sim':          { rating: 0.93, useCount: 1120 },
  'speed-run':          { rating: 0.91, useCount: 980 },
  'merge-sim':          { rating: 0.90, useCount: 760 },
  'would-you-rather':   { rating: 0.91, useCount: 640 },
  'brainrot-tycoon':    { rating: 0.94, useCount: 1340 },
  'escape-backrooms':   { rating: 0.92, useCount: 580 },
  'tower-defense-full': { rating: 0.93, useCount: 1050 },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterTab({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  const accent = color ?? '#D4AF37'
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-xs font-medium transition-all duration-150"
      style={{
        padding: '5px 13px',
        borderRadius: '6px',
        background: active ? `rgba(${hexToRgb(accent)},0.15)` : 'transparent',
        border: `1px solid ${active ? `rgba(${hexToRgb(accent)},0.45)` : 'rgba(255,255,255,0.07)'}`,
        color: active ? accent : '#71717a',
      }}
    >
      {label}
    </button>
  )
}

function GenreBadge({ genre }: { genre: GameGenre }) {
  const color = GENRE_COLORS[genre] ?? '#D4AF37'
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{
        background: `rgba(${hexToRgb(color)},0.15)`,
        color,
        border: `1px solid rgba(${hexToRgb(color)},0.3)`,
      }}
    >
      {genre}
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: GameTemplateMarketplace['difficulty'] }) {
  const s = DIFFICULTY_STYLES[difficulty]
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating * 5)
  return (
    <span className="flex items-center gap-0.5" aria-label={`${(rating * 5).toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M5 1l1.12 2.27 2.5.36-1.81 1.76.43 2.5L5 6.75 2.76 7.89l.43-2.5L1.38 3.63l2.5-.36L5 1z"
            fill={i < stars ? '#D4AF37' : '#3f3f46'}
          />
        </svg>
      ))}
    </span>
  )
}

function TemplateCard({
  template,
  onUse,
}: {
  template: GameTemplateMarketplace
  onUse: (t: GameTemplateMarketplace) => void
}) {
  const [hovered, setHovered] = useState(false)
  const meta = TEMPLATE_META[template.id] ?? { rating: 0.9, useCount: 500 }
  const accent = template.accentColor

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: hovered
          ? `linear-gradient(145deg, rgba(${hexToRgb(accent)},0.10) 0%, rgba(255,255,255,0.02) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? `rgba(${hexToRgb(accent)},0.45)` : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? `0 0 24px rgba(${hexToRgb(accent)},0.15)` : 'none',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Icon + name */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 flex items-center justify-center text-2xl"
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `linear-gradient(135deg, rgba(${hexToRgb(accent)},0.25), rgba(${hexToRgb(accent)},0.08))`,
              border: `1px solid rgba(${hexToRgb(accent)},0.35)`,
            }}
          >
            {template.thumbnail}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 leading-tight truncate">{template.name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <GenreBadge genre={template.genre} />
              <DifficultyBadge difficulty={template.difficulty} />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">{template.description}</p>
      </div>

      {/* Features (first 3) */}
      <div className="px-5 pb-4 flex flex-col gap-1.5">
        {template.features.slice(0, 3).map((f) => (
          <div key={f} className="flex items-start gap-2">
            <svg
              className="flex-shrink-0 mt-0.5"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke={accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] text-zinc-400 leading-relaxed">{f}</span>
          </div>
        ))}
        {template.features.length > 3 && (
          <p className="text-[11px] text-zinc-600 pl-5">
            +{template.features.length - 3} more features
          </p>
        )}
      </div>

      {/* Stats row */}
      <div
        className="px-5 py-3 flex items-center gap-3 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <StarRating rating={meta.rating} />
        <span className="text-[11px] text-zinc-500">
          {meta.useCount.toLocaleString()} uses
        </span>
        <span className="text-[11px] text-zinc-600">·</span>
        <span className="text-[11px] text-zinc-500">
          ~{template.lineCount.toLocaleString()} lines
        </span>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        <button
          onClick={() => onUse(template)}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-xl transition-all duration-150 active:scale-95"
          style={{
            padding: '10px 0',
            background: hovered
              ? `linear-gradient(135deg, ${accent}, rgba(${hexToRgb(accent)},0.75))`
              : `rgba(${hexToRgb(accent)},0.12)`,
            color: hovered ? '#0a0a0b' : accent,
            border: `1px solid rgba(${hexToRgb(accent)},0.4)`,
          }}
        >
          Use Template
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export default function GameTemplatesClient() {
  const router = useRouter()
  const [activeGenre, setActiveGenre] = useState<FilterGenre>('All')
  const [sort, setSort] = useState<SortOption>('popular')
  const [search, setSearch] = useState('')
  const [sortOpen, setSortOpen] = useState(false)

  const SORT_LABELS: Record<SortOption, string> = {
    popular: 'Popular',
    newest:  'Newest',
    rating:  'Rating',
  }

  const filtered = useMemo(() => {
    let items = [...GAME_TEMPLATES_MARKETPLACE]

    // Genre filter
    if (activeGenre !== 'All') {
      items = items.filter((t) => t.genre === activeGenre)
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q) ||
          t.features.some((f) => f.toLowerCase().includes(q))
      )
    }

    // Sort
    if (sort === 'popular') {
      items.sort(
        (a, b) =>
          (TEMPLATE_META[b.id]?.useCount ?? 0) - (TEMPLATE_META[a.id]?.useCount ?? 0)
      )
    } else if (sort === 'rating') {
      items.sort(
        (a, b) =>
          (TEMPLATE_META[b.id]?.rating ?? 0) - (TEMPLATE_META[a.id]?.rating ?? 0)
      )
    } else {
      // newest — use original array order (most recently added last → reverse)
      items.sort((a, b) => (TEMPLATE_ORDER[b.id] ?? 0) - (TEMPLATE_ORDER[a.id] ?? 0))
    }

    return items
  }, [activeGenre, sort, search])

  function handleUseTemplate(t: GameTemplateMarketplace) {
    const encoded = encodeURIComponent(t.generationPrompt)
    router.push(`/editor?template=${encoded}`)
  }

  return (
    <div
      className="min-h-screen font-inter"
      style={{ background: '#09090b', color: '#e4e4e7' }}
    >
      {/* Page header */}
      <div
        className="sticky top-0 z-20 px-6 py-4"
        style={{
          background: 'rgba(9,9,11,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Game Templates</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {GAME_TEMPLATES_MARKETPLACE.length} publish-ready games — pick one, ForjeAI builds it for you
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M1.5 3.5h10M3.5 6.5h6M5.5 9.5h2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                {SORT_LABELS[sort]}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2.5 4l2.5 2.5L7.5 4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {sortOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 z-30 flex flex-col py-1 rounded-xl overflow-hidden min-w-[140px]"
                  style={{
                    background: '#18181b',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {(['popular', 'newest', 'rating'] as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSort(opt); setSortOpen(false) }}
                      className="text-left text-xs px-4 py-2 transition-colors"
                      style={{
                        color: sort === opt ? '#D4AF37' : '#a1a1aa',
                        background: sort === opt ? 'rgba(212,175,55,0.08)' : 'transparent',
                      }}
                    >
                      {SORT_LABELS[opt]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search + genre filters */}
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div
              className="flex items-center gap-2 max-w-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '9px',
                padding: '7px 11px',
              }}
            >
              <svg className="flex-shrink-0 text-zinc-600" width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Genre filter tabs */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              style={{ scrollbarWidth: 'none' }}
            >
              <FilterTab
                label="All"
                active={activeGenre === 'All'}
                onClick={() => setActiveGenre('All')}
              />
              {GAME_GENRES.map((genre) => (
                <FilterTab
                  key={genre}
                  label={genre}
                  active={activeGenre === genre}
                  color={GENRE_COLORS[genre]}
                  onClick={() => setActiveGenre(genre)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-sm text-zinc-400 font-medium">No templates found</p>
            <p className="text-xs text-zinc-600 mt-1">
              Try a different genre or clear your search
            </p>
            <button
              onClick={() => { setSearch(''); setActiveGenre('All') }}
              className="mt-4 text-xs font-medium underline underline-offset-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-6">
              {filtered.length} template{filtered.length !== 1 ? 's' : ''}
              {activeGenre !== 'All' ? ` in ${activeGenre}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => (
                <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dismiss sort dropdown when clicking outside */}
      {sortOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSortOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
