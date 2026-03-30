'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/ui/toast-notification'
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
  ChevronLeft,
  ChevronRight,
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
  { value: 'all',           label: 'All',            icon: '✦' },
  { value: 'GAME_TEMPLATE', label: 'Full Games',      icon: '◉' },
  { value: 'MAP_TEMPLATE',  label: 'Terrain & Maps',  icon: '🗺' },
  { value: 'SCRIPT',        label: 'Scripts',         icon: '⌨' },
  { value: 'UI_KIT',        label: 'UI & Buildings',  icon: '◻' },
  { value: 'ASSET',         label: 'NPCs & Models',   icon: '◈' },
  { value: 'SOUND',         label: 'Audio',           icon: '♪' },
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
    id: 'demo-5',
    title: 'Combat System v2',
    slug: 'combat-system-v2',
    description: 'Production-ready melee & ranged combat with hitbox detection, combo chains, blocking, dodge rolls, and skill cooldowns. Fully networked via RemoteEvents. Used by 7,800+ games.',
    category: 'SCRIPT',
    priceCents: 1999,
    thumbnailUrl: null,
    averageRating: 5.0,
    reviewCount: 201,
    downloads: 7800,
    tags: ['combat', 'pvp', 'hitbox', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
  },
  {
    id: 'demo-2',
    title: 'City Starter Kit',
    slug: 'city-starter-kit',
    description: 'Free open-source city map with 40+ modular blocks, road networks, street lighting, day/night setup, and mobile optimization. The most downloaded map template on the platform.',
    category: 'MAP_TEMPLATE',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 5.0,
    reviewCount: 128,
    downloads: 9340,
    tags: ['city', 'map', 'free', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c2', displayName: 'Marcus', username: 'marcus_dev', avatarUrl: null },
  },
  {
    id: 'demo-1',
    title: 'Medieval Castle Pack',
    slug: 'medieval-castle-pack',
    description: 'Fully featured medieval castle game template — dungeon systems, NPC enemies with patrol AI, loot tables, quest framework, and mobile-optimized controls. Launch-ready in hours.',
    category: 'GAME_TEMPLATE',
    priceCents: 1499,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 42,
    downloads: 1820,
    tags: ['medieval', 'rpg', 'castle', 'featured'],
    createdAt: new Date().toISOString(),
    creator: { id: 'c1', displayName: 'Alex_Builds', username: 'alex_builds', avatarUrl: null },
  },
]

// ─── Demo templates (shown when API returns empty / during preview) ────────────

const DEMO_GRADIENT_ART: Record<string, string> = {
  'demo-1':  'from-orange-900/60 via-stone-800/80 to-yellow-900/50',
  'demo-2':  'from-sky-900/60 via-slate-800/80 to-blue-900/50',
  'demo-3':  'from-emerald-900/60 via-teal-800/80 to-cyan-900/50',
  'demo-4':  'from-violet-900/60 via-purple-800/80 to-indigo-900/50',
  'demo-5':  'from-red-900/60 via-rose-800/80 to-pink-900/50',
  'demo-6':  'from-green-900/60 via-emerald-800/80 to-lime-900/50',
  'demo-7':  'from-blue-900/60 via-indigo-800/80 to-violet-900/50',
  'demo-8':  'from-fuchsia-900/60 via-purple-800/80 to-pink-900/50',
  'demo-9':  'from-amber-900/60 via-orange-800/80 to-yellow-900/50',
  'demo-10': 'from-slate-900/60 via-gray-800/80 to-zinc-900/50',
  'demo-11': 'from-cyan-900/60 via-sky-800/80 to-teal-900/50',
  'demo-12': 'from-rose-900/60 via-red-800/80 to-orange-900/50',
}

const DEMO_GRID_ICON: Record<string, string> = {
  'demo-1':  '🏰', 'demo-2':  '🏙', 'demo-3':  '⚙',
  'demo-4':  '🎨', 'demo-5':  '⚔', 'demo-6':  '🌿',
  'demo-7':  '🛡', 'demo-8':  '🎒', 'demo-9':  '🌴',
  'demo-10': '⚗', 'demo-11': '🔊', 'demo-12': '🚀',
}

const DEMO_TEMPLATES: Template[] = [
  {
    id: 'demo-1', title: 'Medieval Castle Pack', slug: 'medieval-castle-pack',
    category: 'GAME_TEMPLATE', priceCents: 1499, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 42, downloads: 1820,
    tags: ['medieval', 'rpg'], createdAt: new Date().toISOString(),
    creator: { id: 'c1', displayName: 'Alex_Builds', username: 'alex_builds', avatarUrl: null },
  },
  {
    id: 'demo-2', title: 'City Starter Kit', slug: 'city-starter-kit',
    category: 'MAP_TEMPLATE', priceCents: 0, thumbnailUrl: null,
    averageRating: 5.0, reviewCount: 128, downloads: 9340,
    tags: ['city', 'free'], createdAt: new Date().toISOString(),
    creator: { id: 'c2', displayName: 'Marcus', username: 'marcus_dev', avatarUrl: null },
  },
  {
    id: 'demo-3', title: 'Tycoon Framework', slug: 'tycoon-framework',
    category: 'GAME_TEMPLATE', priceCents: 2499, thumbnailUrl: null,
    averageRating: 4.0, reviewCount: 67, downloads: 3210,
    tags: ['tycoon', 'simulator'], createdAt: new Date().toISOString(),
    creator: { id: 'c3', displayName: 'Sarah', username: 'sarah_scripts', avatarUrl: null },
  },
  {
    id: 'demo-4', title: 'Modern UI Kit', slug: 'modern-ui-kit',
    category: 'UI_KIT', priceCents: 999, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 89, downloads: 5670,
    tags: ['ui', 'modern'], createdAt: new Date().toISOString(),
    creator: { id: 'c4', displayName: 'DesignPro', username: 'designpro', avatarUrl: null },
  },
  {
    id: 'demo-5', title: 'Combat System v2', slug: 'combat-system-v2',
    category: 'SCRIPT', priceCents: 1999, thumbnailUrl: null,
    averageRating: 5.0, reviewCount: 201, downloads: 7800,
    tags: ['combat', 'pvp'], createdAt: new Date().toISOString(),
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
  },
  {
    id: 'demo-6', title: 'Fantasy Map Bundle', slug: 'fantasy-map-bundle',
    category: 'MAP_TEMPLATE', priceCents: 3499, thumbnailUrl: null,
    averageRating: 4.0, reviewCount: 55, downloads: 2100,
    tags: ['fantasy', 'rpg'], createdAt: new Date().toISOString(),
    creator: { id: 'c6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null },
  },
  {
    id: 'demo-7', title: 'Admin Panel Script', slug: 'admin-panel-script',
    category: 'SCRIPT', priceCents: 0, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 310, downloads: 14200,
    tags: ['admin', 'free'], createdAt: new Date().toISOString(),
    creator: { id: 'c7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null },
  },
  {
    id: 'demo-8', title: 'Inventory UI Pack', slug: 'inventory-ui-pack',
    category: 'UI_KIT', priceCents: 799, thumbnailUrl: null,
    averageRating: 4.0, reviewCount: 44, downloads: 1950,
    tags: ['inventory', 'gui'], createdAt: new Date().toISOString(),
    creator: { id: 'c8', displayName: 'UIQueen', username: 'ui_queen', avatarUrl: null },
  },
  {
    id: 'demo-9', title: 'Tropical Island Pack', slug: 'tropical-island-asset-pack',
    category: 'ASSET', priceCents: 1299, thumbnailUrl: null,
    averageRating: 5.0, reviewCount: 73, downloads: 4100,
    tags: ['tropical', 'island'], createdAt: new Date().toISOString(),
    creator: { id: 'c9', displayName: 'IslandArtist', username: 'island_artist', avatarUrl: null },
  },
  {
    id: 'demo-10', title: 'Dungeon Crawler Starter', slug: 'dungeon-crawler-starter',
    category: 'GAME_TEMPLATE', priceCents: 1999, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 96, downloads: 3580,
    tags: ['dungeon', 'roguelike'], createdAt: new Date().toISOString(),
    creator: { id: 'c10', displayName: 'DungeonCraft', username: 'dungeon_craft', avatarUrl: null },
  },
  {
    id: 'demo-11', title: 'Ambient Audio SFX Pack', slug: 'ambient-audio-sfx-pack',
    category: 'SOUND', priceCents: 599, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 38, downloads: 2200,
    tags: ['audio', 'sfx'], createdAt: new Date().toISOString(),
    creator: { id: 'c11', displayName: 'SoundForge', username: 'sound_forge', avatarUrl: null },
  },
  {
    id: 'demo-12', title: 'Space Shooter Template', slug: 'space-shooter-template',
    category: 'GAME_TEMPLATE', priceCents: 2999, thumbnailUrl: null,
    averageRating: 4.8, reviewCount: 77, downloads: 2900,
    tags: ['space', 'shooter'], createdAt: new Date().toISOString(),
    creator: { id: 'c12', displayName: 'StarBuilder', username: 'star_builder', avatarUrl: null },
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
  const { show: showToast } = useToast()

  const [activeTab, setActiveTab]         = useState<CategoryTab>('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const [sort, setSort]                   = useState<SortOption>('trending')
  const [priceFilter, setPriceFilter]     = useState('')
  const [templates, setTemplates]         = useState<Template[]>([])
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [showFilters, setShowFilters]     = useState(false)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [featuredPaused, setFeaturedPaused] = useState(false)

  // First-visit info toast
  useEffect(() => {
    const key = 'fj_marketplace_visited'
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      const timer = setTimeout(() => {
        showToast({ variant: 'info', title: 'Browse 12 templates in 6 categories', description: 'Game templates, maps, scripts, UI kits, models, and audio — all ready to import.', duration: 5000 })
      }, 600)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-advance featured banner (paused on hover/focus)
  useEffect(() => {
    if (featuredPaused) return
    const id = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % FEATURED.length)
    }, 5000)
    return () => clearInterval(id)
  }, [featuredPaused])

  // Track whether filter change (vs pagination) triggered the fetch
  const filterVersion = useRef(0)

  const doFetch = useCallback(async (pageNum: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('category', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('sort', sort)
      params.set('page', String(pageNum))
      params.set('limit', '12')
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
      const data = await res.json() as { templates: Template[]; pagination: { total: number; totalPages: number } }
      setTemplates(data.templates)
      setTotal(data.pagination?.total ?? data.templates.length)
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery, sort, priceFilter])

  // When filters change: reset page to 1 then fetch
  useEffect(() => {
    filterVersion.current += 1
    const version = filterVersion.current
    const delay = searchQuery ? 350 : 0
    const timer = setTimeout(() => {
      if (version !== filterVersion.current) return
      setPage(1)
      void doFetch(1)
    }, delay)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, sort, priceFilter])

  // When page changes (via pagination buttons), fetch immediately
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    void doFetch(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Guard: index may be stale if FEATURED length changes
  const safeFeaturedIndex = FEATURED.length > 0 ? featuredIndex % FEATURED.length : 0
  const featured = FEATURED[safeFeaturedIndex] ?? FEATURED[0]

  return (
    <div className="text-white">
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
                  focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10
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

            {/* Price filter — always visible on sm+, hidden on mobile until showFilters */}
            <div className={`relative ${showFilters ? '' : 'hidden sm:block'}`}>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="
                  appearance-none bg-white/5 border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80
                  focus:outline-none focus:border-blue-400/50
                  cursor-pointer transition-all duration-200 w-full sm:min-w-[140px]
                "
              >
                {PRICE_FILTERS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#1c1c1c]">
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            {/* Sort — always visible on sm+, hidden on mobile until showFilters */}
            <div className={`relative ${showFilters ? '' : 'hidden sm:block'}`}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="
                  appearance-none bg-white/5 border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80
                  focus:outline-none focus:border-blue-400/50
                  cursor-pointer transition-all duration-200 w-full sm:min-w-[160px]
                "
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#1c1c1c]">
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
        {featured && <section aria-label="Featured templates">
          <div
            className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#141414] to-[#1c1c1c] shadow-[0_0_60px_rgba(245,158,11,0.08)]"
            onMouseEnter={() => setFeaturedPaused(true)}
            onMouseLeave={() => setFeaturedPaused(false)}
            onFocus={() => setFeaturedPaused(true)}
            onBlur={() => setFeaturedPaused(false)}
          >
            {/* Gold top border accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/3 pointer-events-none" />

            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center">
              {/* Thumbnail / CSS art */}
              <div className={`relative w-full sm:w-72 shrink-0 aspect-video rounded-xl border border-amber-500/20 flex items-center justify-center overflow-hidden bg-gradient-to-br ${DEMO_GRADIENT_ART[featured.id] ?? 'from-amber-500/10 to-yellow-600/5'}`}>
                {featured.thumbnailUrl ? (
                  <Image src={featured.thumbnailUrl} alt={featured.title} fill className="object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <span className="text-6xl opacity-50 select-none block" aria-hidden="true">
                      {DEMO_GRID_ICON[featured.id] ?? '🎮'}
                    </span>
                    <span className="text-xs text-white/25 font-medium uppercase tracking-widest">
                      {categoryLabel(featured.category)}
                    </span>
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
                  <a
                    href={`/marketplace/${featured.id}`}
                    className="
                      inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                      bg-gradient-to-r from-amber-500 to-yellow-400 text-black
                      hover:from-amber-400 hover:to-yellow-300
                      shadow-[0_0_20px_rgba(245,158,11,0.25)]
                      hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]
                      transition-all duration-200 no-underline
                    "
                  >
                    <Sparkles className="w-4 h-4" />
                    Use Template — {formatPrice(featured.priceCents)}
                  </a>
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
        </section>}

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
          // On API error fall back to demo grid so the page always looks populated
          <div className="space-y-4">
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400/80 text-xs">
              Preview mode — showing demo templates. Connect the database to see live listings.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEMO_TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} gradientClass={DEMO_GRADIENT_ART[t.id]} iconChar={DEMO_GRID_ICON[t.id]} />
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : templates.length === 0 && !searchQuery && activeTab === 'all' ? (
          // Empty DB with no filters — show demo grid
          <div className="space-y-4">
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400/80 text-xs">
              Preview mode — showing demo templates. Be the first to submit a real template.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEMO_TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} gradientClass={DEMO_GRADIENT_ART[t.id]} iconChar={DEMO_GRID_ICON[t.id]} />
              ))}
            </div>
          </div>
        ) : templates.length === 0 ? (
          <EmptyState query={searchQuery} onClear={() => { setSearchQuery(''); setActiveTab('all') }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                bg-white/5 border border-white/10 text-white/60
                hover:text-white hover:bg-white/8 hover:border-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                // Clamp so no button exceeds valid page range
                pageNum = Math.max(1, Math.min(totalPages, pageNum))
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`
                      w-9 h-9 rounded-xl text-sm font-medium transition-all duration-150
                      ${pageNum === page
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        : 'bg-white/5 border border-transparent text-white/50 hover:text-white/80 hover:bg-white/8'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                bg-white/5 border border-white/10 text-white/60
                hover:text-white hover:bg-white/8 hover:border-white/20
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  gradientClass,
  iconChar,
}: {
  template: Template
  gradientClass?: string
  iconChar?: string
}) {
  const isFree   = template.priceCents === 0
  const isHot    = template.downloads > 1000
  const catLabel = categoryLabel(template.category)

  return (
    <Link
      href={`/marketplace/${template.id}`}
      className="
        group flex flex-col bg-[#141414] border border-white/8 rounded-xl overflow-hidden
        hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]
        transition-all duration-200 cursor-pointer no-underline
      "
    >
      {/* Thumbnail */}
      <div className={`relative aspect-video overflow-hidden ${gradientClass ? `bg-gradient-to-br ${gradientClass}` : 'bg-gradient-to-br from-white/5 to-white/2'}`}>
        {template.thumbnailUrl ? (
          <Image
            src={template.thumbnailUrl}
            alt={template.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : gradientClass ? (
          /* CSS art placeholder — gradient + category icon */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-500">
            <span className="text-4xl opacity-60 select-none" aria-hidden="true">{iconChar ?? '🎮'}</span>
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-semibold">{catLabel}</span>
          </div>
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
            <Image
              src={template.creator.avatarUrl}
              alt={template.creator.displayName ?? 'Creator'}
              width={16}
              height={16}
              className="w-4 h-4 rounded-full object-cover"
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
        <div
          className="
            mt-1 w-full py-2 rounded-lg font-semibold text-xs text-center
            bg-gradient-to-r from-amber-500 to-yellow-400 text-black
            group-hover:from-amber-400 group-hover:to-yellow-300
            shadow-[0_0_12px_rgba(245,158,11,0.15)]
            group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]
            transition-all duration-200
          "
        >
          Use Template
        </div>
      </div>
    </Link>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-[#141414] border border-white/5 rounded-xl overflow-hidden animate-pulse">
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
