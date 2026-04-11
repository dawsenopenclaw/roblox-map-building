'use client'

import { useCallback, useRef, useState } from 'react'
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export type GallerySortOption = 'trending' | 'newest' | 'most-liked' | 'most-forked'
export type GalleryPriceFilter = 'all' | 'free' | 'paid'

export interface GalleryCategory {
  value: string
  label: string
}

export interface GallerySearchFilters {
  query: string
  category: string | null
  sort: GallerySortOption
  price: GalleryPriceFilter
}

interface GallerySearchBarProps {
  filters: GallerySearchFilters
  onFiltersChange: (filters: GallerySearchFilters) => void
  className?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300

const CATEGORIES: GalleryCategory[] = [
  { value: 'MAP_TEMPLATE', label: 'Maps' },
  { value: 'SCRIPT', label: 'Scripts' },
  { value: 'ASSET', label: 'Models' },
  { value: 'UI_KIT', label: 'UI' },
  { value: 'SOUND', label: 'Effects' },
  { value: 'GAME_TEMPLATE', label: 'Games' },
  { value: 'PLUGIN', label: 'Plugins' },
]

const SORT_OPTIONS: { value: GallerySortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-liked', label: 'Most Liked' },
  { value: 'most-forked', label: 'Most Forked' },
]

const PRICE_OPTIONS: { value: GalleryPriceFilter; label: string }[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function GallerySearchBar({
  filters,
  onFiltersChange,
  className = '',
}: GallerySearchBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [inputValue, setInputValue] = useState(filters.query)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateFilters = useCallback(
    (partial: Partial<GallerySearchFilters>) => {
      onFiltersChange({ ...filters, ...partial })
    },
    [filters, onFiltersChange]
  )

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      setInputValue(q)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateFilters({ query: q })
      }, DEBOUNCE_MS)
    },
    [updateFilters]
  )

  const handleClear = useCallback(() => {
    setInputValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    updateFilters({ query: '' })
  }, [updateFilters])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      updateFilters({ query: inputValue })
    },
    [inputValue, updateFilters]
  )

  const hasActiveFilters =
    filters.category !== null ||
    filters.sort !== 'trending' ||
    filters.price !== 'all'

  const clearAllFilters = useCallback(() => {
    setInputValue('')
    onFiltersChange({ query: '', category: null, sort: 'trending', price: 'all' })
  }, [onFiltersChange])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search row */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSubmit} className="flex-1" role="search">
          <div
            className="
              flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200
              bg-white/5 border-white/10 hover:border-white/20
              focus-within:border-[rgba(212,175,55,0.4)] focus-within:bg-white/[0.08]
              focus-within:ring-2 focus-within:ring-[rgba(212,175,55,0.15)]
            "
          >
            <Search className="w-4 h-4 text-white/40 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={inputValue}
              onChange={handleQueryChange}
              placeholder="Search templates, maps, scripts, UI kits..."
              autoComplete="off"
              spellCheck={false}
              className="
                flex-1 bg-transparent text-white placeholder:text-white/30
                text-sm outline-none min-w-0
                [&::-webkit-search-cancel-button]:hidden
                [&::-webkit-search-decoration]:hidden
              "
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="
                  shrink-0 p-0.5 rounded-full text-white/40 hover:text-white/70
                  hover:bg-white/10 transition-colors duration-150
                "
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Filter toggle button */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border text-sm
            transition-all duration-200 shrink-0
            ${showFilters || hasActiveFilters
              ? 'bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)] text-[#d4af37]'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
            }
          `}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          )}
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div
          className="
            flex flex-wrap items-center gap-3 px-4 py-3
            bg-white/[0.03] border border-white/[0.08] rounded-xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Category filter */}
          <FilterDropdown
            label="Category"
            value={filters.category}
            options={[
              { value: null, label: 'All Categories' },
              ...CATEGORIES.map((c) => ({ value: c.value as string | null, label: c.label })),
            ]}
            onChange={(v) => updateFilters({ category: v })}
          />

          {/* Sort */}
          <FilterDropdown
            label="Sort"
            value={filters.sort}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => updateFilters({ sort: v as GallerySortOption })}
          />

          {/* Price */}
          <FilterDropdown
            label="Price"
            value={filters.price}
            options={PRICE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => updateFilters({ price: v as GalleryPriceFilter })}
          />

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="
                ml-auto text-xs text-[#d4af37] hover:text-[#e6c55a]
                underline underline-offset-2 transition-colors duration-150
              "
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.category && (
            <FilterPill
              label={CATEGORIES.find((c) => c.value === filters.category)?.label ?? filters.category}
              onRemove={() => updateFilters({ category: null })}
            />
          )}
          {filters.sort !== 'trending' && (
            <FilterPill
              label={SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? filters.sort}
              onRemove={() => updateFilters({ sort: 'trending' })}
            />
          )}
          {filters.price !== 'all' && (
            <FilterPill
              label={PRICE_OPTIONS.find((o) => o.value === filters.price)?.label ?? filters.price}
              onRemove={() => updateFilters({ price: 'all' })}
            />
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-white/30 hover:text-white/50 transition-colors duration-150"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

// ─── FilterDropdown ─────────────────────────────────────────────────────────

function FilterDropdown<T extends string | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label

  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value === '' ? null : e.target.value
          onChange(v as T)
        }}
        aria-label={label}
        className="
          appearance-none bg-white/5 border border-white/10 rounded-lg
          pl-3 pr-7 py-2 text-xs text-white/70
          focus:outline-none focus:border-[rgba(212,175,55,0.4)] focus:ring-1 focus:ring-[rgba(212,175,55,0.2)]
          cursor-pointer transition-colors duration-150
          hover:border-white/20 hover:bg-white/[0.08]
        "
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value ?? ''} className="bg-[#1a1a2e]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
    </div>
  )
}

// ─── FilterPill ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="
      inline-flex items-center gap-1 px-2 py-1 rounded-md
      bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]
      text-xs text-[#d4af37]
    ">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="p-0.5 rounded hover:bg-white/10 transition-colors duration-100"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  )
}
