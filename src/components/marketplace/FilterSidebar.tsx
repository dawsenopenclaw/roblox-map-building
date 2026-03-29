'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Star, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import type { CategoryFacet, SortOption } from './types'

// ─── TemplateCategory values (mirrored from Prisma schema) ───────────────────

const TEMPLATE_CATEGORIES = [
  'GAME_TEMPLATE',
  'MAP_TEMPLATE',
  'UI_KIT',
  'SCRIPT',
  'ASSET',
  'SOUND',
  'PLUGIN',
] as const

export type TemplateCategoryValue = (typeof TEMPLATE_CATEGORIES)[number]

// ─── Display labels ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TemplateCategoryValue, string> = {
  GAME_TEMPLATE: 'Game Templates',
  MAP_TEMPLATE: 'Map Templates',
  UI_KIT: 'UI Kits',
  SCRIPT: 'Scripts',
  ASSET: 'Assets',
  SOUND: 'Sounds',
  PLUGIN: 'Plugins',
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

const RATING_OPTIONS = [4, 3, 2, 1] as const

// ─── FilterState ──────────────────────────────────────────────────────────────

export interface FilterState {
  categories: TemplateCategoryValue[]
  minPrice: number | undefined
  maxPrice: number | undefined
  minRating: number | undefined
  sort: SortOption
}

// ─── useFilterState hook ──────────────────────────────────────────────────────

export function useFilterState(): FilterState {
  const params = useSearchParams()

  const rawCategories = params.getAll('category')
  const categories = rawCategories.filter((c): c is TemplateCategoryValue =>
    (TEMPLATE_CATEGORIES as readonly string[]).includes(c)
  )

  const rawSort = params.get('sort')
  const sort: SortOption = SORT_OPTIONS.some((o) => o.value === rawSort)
    ? (rawSort as SortOption)
    : 'trending'

  const rawMin = params.get('minPrice')
  const rawMax = params.get('maxPrice')
  const rawRating = params.get('minRating')

  return {
    categories,
    minPrice: rawMin ? parseFloat(rawMin) : undefined,
    maxPrice: rawMax ? parseFloat(rawMax) : undefined,
    minRating: rawRating ? parseFloat(rawRating) : undefined,
    sort,
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  facets: CategoryFacet[]
  filters: FilterState
  className?: string
  isLoading?: boolean
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────

export function FilterSidebar({
  facets,
  filters,
  className = '',
  isLoading = false,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.sort !== 'trending'

  const setParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('after') // reset pagination on filter change

      if (value === null || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.delete(key)
        value.forEach((v) => params.append(key, v))
      } else {
        params.set(key, value)
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  function toggleCategory(cat: TemplateCategoryValue) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    setParam('category', next)
  }

  function handleMinPrice(e: React.ChangeEvent<HTMLInputElement>) {
    setParam('minPrice', e.target.value || null)
  }

  function handleMaxPrice(e: React.ChangeEvent<HTMLInputElement>) {
    setParam('maxPrice', e.target.value || null)
  }

  function handleRating(rating: number) {
    setParam('minRating', filters.minRating === rating ? null : String(rating))
  }

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    setParam('sort', e.target.value === 'trending' ? null : e.target.value)
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('minRating')
    params.delete('sort')
    params.delete('after')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const categoryRows = TEMPLATE_CATEGORIES.map((cat) => ({
    category: cat,
    count: facets.find((f) => f.category === cat)?.count ?? 0,
    label: CATEGORY_LABELS[cat],
  }))

  return (
    <aside
      className={`
        flex flex-col gap-6 ${className}
        ${isLoading ? 'opacity-60 pointer-events-none' : ''}
        transition-opacity duration-200
      `}
      aria-label="Search filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/50" />
          <span className="text-sm font-semibold text-white/80">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-150 underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort by">
        <div className="relative">
          <select
            value={filters.sort}
            onChange={handleSort}
            aria-label="Sort by"
            className="
              w-full appearance-none bg-white/5 border border-white/10 rounded-lg
              px-3 py-2.5 text-sm text-white/80 pr-8
              focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20
              cursor-pointer transition-colors duration-150
            "
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Category">
        <div className="flex flex-col gap-1.5">
          {categoryRows.map(({ category, count, label }) => {
            const isChecked = filters.categories.includes(category)
            const isDisabled = count === 0 && !isChecked
            return (
              <label
                key={category}
                className={`
                  flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer
                  transition-colors duration-100 group select-none
                  ${isDisabled ? 'opacity-35 cursor-not-allowed' : 'hover:bg-white/5'}
                  ${isChecked ? 'bg-violet-500/10' : ''}
                `}
              >
                <div
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center shrink-0
                    transition-colors duration-150
                    ${isChecked ? 'bg-violet-500 border-violet-500' : 'border-white/20 group-hover:border-white/40'}
                  `}
                >
                  {isChecked && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggleCategory(category)}
                  aria-label={`Filter by ${label}`}
                />
                <span className={`flex-1 text-sm ${isChecked ? 'text-white' : 'text-white/60'}`}>
                  {label}
                </span>
                <span className={`text-xs tabular-nums ${isChecked ? 'text-violet-400' : 'text-white/30'}`}>
                  {count.toLocaleString()}
                </span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price range">
        <div className="flex items-center gap-2">
          <PriceInput
            value={filters.minPrice}
            onChange={handleMinPrice}
            placeholder="0"
            label="Minimum price in dollars"
          />
          <span className="text-white/30 text-sm shrink-0">to</span>
          <PriceInput
            value={filters.maxPrice}
            onChange={handleMaxPrice}
            placeholder="Any"
            label="Maximum price in dollars"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setParam('minPrice', null)
            setParam('maxPrice', '0')
          }}
          className={`
            mt-2 w-full text-xs px-3 py-1.5 rounded-lg border transition-colors duration-150
            ${
              filters.maxPrice === 0
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                : 'bg-white/3 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5'
            }
          `}
        >
          Free only
        </button>
      </FilterSection>

      {/* Minimum rating */}
      <FilterSection title="Minimum rating">
        <div className="flex flex-col gap-1.5">
          {RATING_OPTIONS.map((rating) => {
            const isActive = filters.minRating === rating
            return (
              <button
                key={rating}
                type="button"
                onClick={() => handleRating(rating)}
                aria-pressed={isActive}
                aria-label={`Minimum ${rating} stars`}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg text-left w-full
                  transition-colors duration-100
                  ${isActive ? 'bg-amber-500/10' : 'hover:bg-white/5'}
                `}
              >
                <StarRow value={rating} isActive={isActive} />
                <span className={`text-xs ${isActive ? 'text-amber-300' : 'text-white/40'}`}>
                  & up
                </span>
              </button>
            )
          })}
        </div>
      </FilterSection>
    </aside>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriceInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: number | undefined
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="flex-1 relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 pointer-events-none">
        $
      </span>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className="
          w-full bg-white/5 border border-white/10 rounded-lg
          pl-5 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25
          focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />
    </div>
  )
}

function StarRow({ value, isActive }: { value: number; isActive: boolean }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 transition-colors duration-100 ${
            i < value
              ? isActive
                ? 'text-amber-400 fill-amber-400'
                : 'text-amber-500/60 fill-amber-500/60'
              : 'text-white/15'
          }`}
        />
      ))}
    </div>
  )
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-white/5 pt-5">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider group-hover:text-white/70 transition-colors duration-150">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-white/30" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        )}
      </button>
      {isOpen && children}
    </div>
  )
}
