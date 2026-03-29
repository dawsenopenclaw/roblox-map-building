'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  X,
  Star,
  Download,
  TrendingUp,
  Sparkles,
  Upload,
  Package,
  RefreshCw,
  ChevronDown,
  Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = 'trending' | 'newest' | 'top-rated' | 'price-asc' | 'price-desc'

type CategoryTab = 'all' | 'GAME_TEMPLATE' | 'MAP_TEMPLATE' | 'SCRIPT' | 'UI_KIT' | 'ASSET' | 'SOUND'

interface Creator {
  id: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
}

interface Template {
  id: string
  title: string
  slug: string
  description?: string
  category: string
  priceCents: number
  thumbnailUrl: string | null
  averageRating: number
  reviewCount: number
  downloads: number
  tags: string[]
  createdAt: string
  creator: Creator
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: { value: CategoryTab; label: string; icon: string }[] = [
  { value: 'all',           label: 'All',        icon: '✦' },
  { value: 'MAP_TEMPLATE',  label: 'Maps',        icon: '🗺' },
  { value: 'SCRIPT',        label: 'Scripts',     icon: '⌨' },
  { value: 'UI_KIT',        label: 'UI',          icon: '◻' },
  { value: 'ASSET',         label: '3D Models',   icon: '◈' },
  { value: 'SOUND',         label: 'Audio',       icon: '♪' },
  { value: 'GAME_TEMPLATE', label: 'Game Templates', icon: '◉' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending',   label: 'Trending' },
  { value: 'newest',     label: 'Newest' },
  { value: 'top-rated',  label: 'Top Rated' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
]

const PRICE_FILTERS = [
  { label: 'All Prices', value: '' },
  { label: 'Free',       value: 'free' },
  { label: 'Under $5',   value: 'under5' },
  { label: 'Under $15',  value: 'under15' },
  { label: 'Premium',    value: 'premium' },
]

// ─── Featured Banner ──────────────────────────────────────────────────────────

const FEATURED: Template[] = [
  {
    id: 'feat-1',
    title: 'Ultimate City Builder Kit',
    slug: 'ultimate-city-builder-kit',
    description: 'Complete modular city kit with 200+ assets, traffic systems, NPC logic, and day/night cycle. Used in 3 top-50 games.',
    category: 'GAME_TEMPLATE',
    priceCents: 2999,
    thumbnailUrl: null,
    averageRating: 4.9,
    reviewCount: 142,
    downloads: 8420,
    tags: ['city', 'modular', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c1', displayName: 'ForjeGames', username: 'forjegames', avatarUrl: null },
  },
  {
    id: 'feat-2',
    title: 'Pro Obby Framework',
    slug: 'pro-obby-framework',
    description: 'Full checkpoint system, moving platforms, deadly lava, leaderboards. Drop-in and launch in minutes.',
    category: 'GAME_TEMPLATE',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.7,
    reviewCount: 89,
    downloads: 12300,
    tags: ['obby', 'free', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c2', displayName: 'ObbyDev', username: 'obbydev', avatarUrl: null },
  },
  {
    id: 'feat-3',
    title: 'Anime UI Mega Pack',
    slug: 'anime-ui-mega-pack',
    description: 'Over 80 UI components in anime style — health bars, inventory grids, chat bubbles, quest trackers.',
    category: 'UI_KIT',
    priceCents: 1499,
    thumbnailUrl: null,
    averageRating: 4.8,
    reviewCount: 204,
    downloads: 5670,
    tags: ['anime', 'ui', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c3', displayName: 'UIWizard', username: 'uiwizard', avatarUrl: null },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function creatorInitial(creator: Creator): string {
  return ((creator.displayName ?? creator.username ?? '?')[0] ?? '?').toUpperCase()
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [activeTab, setActiveTab]         = useState<CategoryTab>('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const [sort, setSort]                   = useState<SortOption>('trending')
  const [priceFilter, setPriceFilter]     = useState('')
  const [templates, setTemplates]         = useState<Template[]>([])
  const [total, setTotal]                 = useState(0)
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [showFilters, setShowFilters]     = useState(false)
  const [featuredIndex, setFeaturedIndex] = useState(0)

  // Auto-advance featured banner
  useEffect(() => {
    const id = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % FEATURED.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('category', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('sort', sort)
      if (priceFilter === 'free') {
        params.set('maxPrice', '0')
      } else if (priceFilter === 'under5') {
        params.set('maxPrice', '500')
      } else if (priceFilter === 'under15') {
        params.set('maxPrice', '1500')
      } else if (priceFilter === 'premium') {
        params.set('minPrice', '1500')
      }

      const res = await fetch(`/api/marketplace/templates?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { templates: Template[]; pagination: { total: number } }
      setTemplates(data.templates)
      setTotal(data.pagination?.total ?? data.templates.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery, sort, priceFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchTemplates, searchQuery ? 300 : 0)
    return () => clearTimeout(debounce)
  }, [fetchTemplates, searchQuery])

  const featured = FEATURED[featuredIndex]!

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[#050b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Template Marketplace
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Premium Roblox assets, maps, scripts, and UI kits
              </p>
            </div>

            {/* Submit CTA */}
            <a
              href="/marketplace/submit"
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-amber-500 to-yellow-400 text-black
                hover:from-amber-400 hover:to-yellow-300
                shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]
                transition-all duration-200 shrink-0
              "
            >
              <Upload className="w-4 h-4" />
              Submit Template
            </a>
          </div>

          {/* ── Search + Filters row ─────────────────────────────────────── */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, maps, scripts..."
                className="
                  w-full bg-white/5 border border-white/10 rounded-xl
                  pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30
                  focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10
                  transition-all duration-200
                  [&::-webkit-search-cancel-button]:hidden
                "
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Price filter */}
            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="
                  appearance-none bg-white/5 border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80
                  focus:outline-none focus:border-amber-500/50
                  cursor-pointer transition-all duration-200 min-w-[140px]
                "
              >
                {PRICE_FILTERS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0d1117]">
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="
                  appearance-none bg-white/5 border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80
                  focus:outline-none focus:border-amber-500/50
                  cursor-pointer transition-all duration-200 min-w-[160px]
                "
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0d1117]">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="
                sm:hidden flex items-center gap-2 px-4 py-3 rounded-xl
                bg-white/5 border border-white/10 text-sm text-white/60
                hover:text-white hover:bg-white/8 transition-all duration-150
              "
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Featured Banner ────────────────────────────────────────────── */}
        <section aria-label="Featured templates">
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#111827] to-[#0d1117] shadow-[0_0_60px_rgba(245,158,11,0.08)]">
            {/* Gold top border accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/3 pointer-events-none" />

            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center">
              {/* Thumbnail placeholder */}
              <div className="w-full sm:w-64 shrink-0 aspect-video rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/20 flex items-center justify-center overflow-hidden">
                {featured.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.thumbnailUrl} alt={featured.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <Sparkles className="w-10 h-10 text-amber-400/60 mx-auto" />
                    <span className="text-xs text-amber-400/40 font-medium">Featured</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                    Featured
                  </span>
                  <span className="text-xs text-white/30">{categoryLabel(featured.category)}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {featured.title}
                </h2>

                {featured.description && (
                  <p className="text-sm text-white/55 leading-relaxed max-w-xl">
                    {featured.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.round(featured.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`}
                        />
                      ))}
                    </div>
                    <span className="text-white/70 font-medium tabular-nums">{featured.averageRating.toFixed(1)}</span>
                    <span className="text-white/30">({featured.reviewCount.toLocaleString()})</span>
                  </div>

                  {/* Downloads */}
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Download className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{formatCount(featured.downloads)} downloads</span>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center gap-1.5 text-white/40">
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-300 text-[8px] font-bold">{creatorInitial(featured.creator)}</span>
                    </div>
                    <span>{featured.creator.displayName ?? featured.creator.username}</span>
                  </div>
                </div>

                {/* CTA row */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="
                      inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                      bg-gradient-to-r from-amber-500 to-yellow-400 text-black
                      hover:from-amber-400 hover:to-yellow-300
                      shadow-[0_0_20px_rgba(245,158,11,0.25)]
                      hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]
                      transition-all duration-200
                    "
                  >
                    <Sparkles className="w-4 h-4" />
                    Use Template — {formatPrice(featured.priceCents)}
                  </button>
                  <span className="text-xs text-white/25">
                    {FEATURED.length} featured templates
                  </span>
                </div>
              </div>

              {/* Pagination dots */}
              <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
                {FEATURED.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeaturedIndex(i)}
                    aria-label={`Featured template ${i + 1}`}
                    className={`rounded-full transition-all duration-200 ${
                      i === featuredIndex
                        ? 'w-4 h-1.5 bg-amber-400'
                        : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`
                shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-150 whitespace-nowrap
                ${activeTab === tab.value
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Results header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/40">
            {isLoading ? (
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-white/70 font-medium">{total.toLocaleString()}</span>
                {' '}template{total !== 1 ? 's' : ''}
                {searchQuery && (
                  <> for <span className="text-white/60">&ldquo;{searchQuery}&rdquo;</span></>
                )}
              </>
            )}
          </div>

          {activeTab !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2"
            >
              Clear category
            </button>
          )}
        </div>

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        {error ? (
          <ErrorState message={error} onRetry={fetchTemplates} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState query={searchQuery} onClear={() => { setSearchQuery(''); setActiveTab('all') }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: Template }) {
  const isFree   = template.priceCents === 0
  const isHot    = template.downloads > 1000
  const catLabel = categoryLabel(template.category)

  return (
    <article className="
      group flex flex-col bg-[#111827] border border-white/8 rounded-xl overflow-hidden
      hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]
      transition-all duration-200 cursor-pointer
    ">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-white/5 to-white/2 overflow-hidden">
        {template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-white/8" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {isHot && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-semibold">Hot</span>
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5">
          <span className={`
            px-2 py-0.5 rounded-md text-[11px] font-semibold
            ${isFree
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-black/70 text-white border border-white/15'
            }
          `}>
            {formatPrice(template.priceCents)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Category */}
        <span className="text-[10px] text-amber-400/60 uppercase tracking-widest font-semibold">
          {catLabel}
        </span>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-150">
          {template.title}
        </h3>

        {/* Creator */}
        <div className="flex items-center gap-1.5 mt-auto">
          {template.creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.creator.avatarUrl}
              alt={template.creator.displayName ?? 'Creator'}
              className="w-4 h-4 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-amber-300 text-[8px] font-bold">{creatorInitial(template.creator)}</span>
            </div>
          )}
          <span className="text-xs text-white/35 truncate">
            {template.creator.displayName ?? template.creator.username ?? 'Unknown'}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-white/60 tabular-nums">
              {template.averageRating > 0 ? template.averageRating.toFixed(1) : '—'}
            </span>
            {template.reviewCount > 0 && (
              <span className="text-xs text-white/25">({template.reviewCount.toLocaleString()})</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/25">
            <Download className="w-3 h-3" />
            <span className="text-xs tabular-nums">{formatCount(template.downloads)}</span>
          </div>
        </div>

        {/* Gold CTA */}
        <button
          type="button"
          className="
            mt-1 w-full py-2 rounded-lg font-semibold text-xs
            bg-gradient-to-r from-amber-500 to-yellow-400 text-black
            hover:from-amber-400 hover:to-yellow-300
            shadow-[0_0_12px_rgba(245,158,11,0.15)]
            group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]
            transition-all duration-200
          "
        >
          Use Template
        </button>
      </div>
    </article>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-[#111827] border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2.5 w-16 bg-white/8 rounded" />
        <div className="h-4 w-full bg-white/8 rounded" />
        <div className="h-4 w-3/4 bg-white/8 rounded" />
        <div className="h-3 w-20 bg-white/5 rounded mt-1" />
        <div className="h-7 w-full bg-white/5 rounded mt-1" />
      </div>
    </div>
  )
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <p className="text-white/80 font-semibold">Failed to load templates</p>
        <p className="text-white/35 text-sm mt-1">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm text-white/60 hover:text-white transition-all duration-150"
      >
        Try again
      </button>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
        <Search className="w-7 h-7 text-white/20" />
      </div>
      <div>
        <p className="text-white/80 font-semibold text-lg">No templates found</p>
        {query ? (
          <p className="text-white/35 text-sm mt-2">
            No results for &ldquo;{query}&rdquo;. Try different keywords or remove filters.
          </p>
        ) : (
          <p className="text-white/35 text-sm mt-2">
            Try adjusting your category or price filters.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="
          px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-gradient-to-r from-amber-500 to-yellow-400 text-black
          hover:from-amber-400 hover:to-yellow-300
          transition-all duration-200
        "
      >
        Clear filters
      </button>
    </div>
  )
}
