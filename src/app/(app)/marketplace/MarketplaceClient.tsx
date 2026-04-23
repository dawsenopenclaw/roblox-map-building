'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
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
  LayoutGrid,
  Gamepad2,
  Map,
  Code2,
  Building,
  Users,
  Music,
  Heart,
  GitFork,
  Flame,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = 'trending' | 'newest' | 'top-rated' | 'price-asc' | 'price-desc' | 'most-liked' | 'most-forked'

type CategoryTab = 'all' | 'trending-feed' | 'GAME_TEMPLATE' | 'MAP_TEMPLATE' | 'SCRIPT' | 'UI_KIT' | 'ASSET' | 'SOUND'

interface Creator {
  id: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
}

interface ForkedFromEntry {
  originalItem: {
    id: string
    title: string
    slug: string
  } | null
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
  likeCount?: number
  forkCount?: number
  viewCount?: number
  forkedFrom?: ForkedFromEntry[] | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: { value: CategoryTab; label: string; icon: LucideIcon }[] = [
  { value: 'all',           label: 'All',            icon: LayoutGrid },
  { value: 'trending-feed', label: 'Trending',       icon: Flame },
  { value: 'GAME_TEMPLATE', label: 'Full Games',      icon: Gamepad2 },
  { value: 'MAP_TEMPLATE',  label: 'Terrain & Maps',  icon: Map },
  { value: 'SCRIPT',        label: 'Scripts',         icon: Code2 },
  { value: 'UI_KIT',        label: 'UI & Buildings',  icon: Building },
  { value: 'ASSET',         label: 'NPCs & Models',   icon: Users },
  { value: 'SOUND',         label: 'Audio',           icon: Music },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending',    label: 'Trending' },
  { value: 'newest',      label: 'Newest' },
  { value: 'top-rated',   label: 'Top Rated' },
  { value: 'most-liked',  label: 'Most Liked' },
  { value: 'most-forked', label: 'Most Forked' },
  { value: 'price-asc',   label: 'Price: Low → High' },
  { value: 'price-desc',  label: 'Price: High → Low' },
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
    id: 'demo-1',
    title: 'Pet Simulator Starter Kit',
    slug: 'pet-simulator-starter-kit',
    description: 'Complete pet sim foundation — egg hatching with rarity rolls, pet inventory, stat scaling, world zones with portals, coin farming loops, and leaderboards. Fully networked, mobile-ready. The fastest path from idea to playable sim on the platform.',
    category: 'GAME_TEMPLATE',
    priceCents: 999,
    thumbnailUrl: null,
    averageRating: 4.9,
    reviewCount: 312,
    downloads: 4820,
    tags: ['pet-sim', 'simulator', 'eggs', 'featured'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c1', displayName: 'ForjeGames', username: 'forgegames', avatarUrl: null },
  },
  {
    id: 'demo-5',
    title: 'Advanced Combat Engine',
    slug: 'advanced-combat-engine',
    description: 'Studio-grade melee and ranged combat — hitbox detection, combo chains, blocking, dodge rolls, and configurable skill cooldowns. Fully server-authoritative via RemoteEvents with built-in anti-exploit guards. Plug in, configure, ship.',
    category: 'SCRIPT',
    priceCents: 1999,
    thumbnailUrl: null,
    averageRating: 4.8,
    reviewCount: 241,
    downloads: 6130,
    tags: ['combat', 'pvp', 'hitbox', 'featured'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
  },
  {
    id: 'demo-3',
    title: 'Tropical Island Terrain Pack',
    slug: 'tropical-island-terrain-pack',
    description: 'Hand-sculpted tropical archipelago with 6 biomes — coral reef shallows, dense jungle, volcanic highlands, white sand beaches, mangrove swamps, and a hidden sea cave. 120+ custom props included. Free and open-source forever.',
    category: 'MAP_TEMPLATE',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.7,
    reviewCount: 189,
    downloads: 8940,
    tags: ['tropical', 'terrain', 'free', 'featured'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c3', displayName: 'MapMaster', username: 'map_master', avatarUrl: null },
  },
]

// ─── Demo templates (shown when API returns empty / during preview) ────────────

const DEMO_GRADIENT_ART: Record<string, string> = {
  'demo-1':  'from-violet-900/60 via-purple-800/80 to-indigo-900/50',
  'demo-2':  'from-emerald-900/60 via-teal-800/80 to-cyan-900/50',
  'demo-3':  'from-amber-900/60 via-orange-800/80 to-yellow-900/50',
  'demo-4':  'from-blue-900/60 via-sky-800/80 to-cyan-900/50',
  'demo-5':  'from-red-900/60 via-rose-800/80 to-pink-900/50',
  'demo-6':  'from-fuchsia-900/60 via-purple-800/80 to-pink-900/50',
  'demo-7':  'from-slate-900/60 via-gray-800/80 to-zinc-900/50',
  'demo-8':  'from-green-900/60 via-emerald-800/80 to-lime-900/50',
  'demo-9':  'from-orange-900/60 via-stone-800/80 to-yellow-900/50',
  'demo-10': 'from-indigo-900/60 via-blue-800/80 to-violet-900/50',
  'demo-11': 'from-cyan-900/60 via-sky-800/80 to-teal-900/50',
  'demo-12': 'from-rose-900/60 via-red-800/80 to-orange-900/50',
}

const DEMO_GRID_ICON: Record<string, string> = {
  'demo-1':  '◉',  'demo-2':  '◈',  'demo-3':  '◆',
  'demo-4':  '◻',  'demo-5':  '◉',  'demo-6':  '◈',
  'demo-7':  '◉',  'demo-8':  '◈',  'demo-9':  '◆',
  'demo-10': '◻',  'demo-11': '◉',  'demo-12': '◈',
}

const DEMO_TEMPLATES: Template[] = [
  {
    id: 'demo-1', title: 'Pet Simulator Starter Kit', slug: 'pet-simulator-starter-kit',
    description: 'Complete pet sim foundation — egg hatching with rarity rolls, pet inventory, stat scaling, world zones with portals, coin farming loops, and a global leaderboard. Launch-ready in hours.',
    category: 'GAME_TEMPLATE', priceCents: 999, thumbnailUrl: null,
    averageRating: 4.9, reviewCount: 312, downloads: 4820,
    tags: ['pet-sim', 'simulator', 'eggs', 'tycoon'], createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c1', displayName: 'ForjeGames', username: 'forgegames', avatarUrl: null },
  },
  {
    id: 'demo-2', title: 'Merchant NPC Bundle', slug: 'merchant-npc-bundle',
    description: 'Six fully-scripted NPC archetypes — shopkeeper, quest giver, blacksmith, innkeeper, wandering trader, and guard captain. Each has contextual dialogue trees, proximity detection, and a configurable shop UI. Drop into any game instantly.',
    category: 'ASSET', priceCents: 499, thumbnailUrl: null,
    averageRating: 4.6, reviewCount: 148, downloads: 3210,
    tags: ['npc', 'dialogue', 'shop', 'characters'], createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c2', displayName: 'BuildPro', username: 'buildpro', avatarUrl: null },
  },
  {
    id: 'demo-3', title: 'Tropical Island Terrain Pack', slug: 'tropical-island-terrain-pack',
    description: 'Hand-sculpted tropical archipelago with 6 biomes — coral reef shallows, dense jungle, volcanic highlands, white sand beaches, mangrove swamps, and a hidden sea cave. 120+ custom props, free forever.',
    category: 'MAP_TEMPLATE', priceCents: 0, thumbnailUrl: null,
    averageRating: 4.7, reviewCount: 189, downloads: 8940,
    tags: ['tropical', 'terrain', 'free', 'island'], createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c3', displayName: 'MapMaster', username: 'map_master', avatarUrl: null },
  },
  {
    id: 'demo-4', title: 'Dark Mode HUD Kit', slug: 'dark-mode-hud-kit',
    description: 'Sleek dark UI system with 30+ pre-built screens — health/stamina bars, minimap frame, inventory slots, quest tracker, settings panel, and notification toasts. Fully responsive, mobile-tested, and easy to recolor.',
    category: 'UI_KIT', priceCents: 799, thumbnailUrl: null,
    averageRating: 4.8, reviewCount: 203, downloads: 5670,
    tags: ['ui', 'hud', 'dark', 'mobile'], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c4', displayName: 'DesignPro', username: 'designpro', avatarUrl: null },
  },
  {
    id: 'demo-5', title: 'Advanced Combat Engine', slug: 'advanced-combat-engine',
    description: 'Server-authoritative combat system with hitbox detection, combo chains, blocking, dodge rolls, skill cooldowns, and status effects. Built-in anti-exploit guards and configurable damage curves. Plug in, configure, ship.',
    category: 'SCRIPT', priceCents: 1999, thumbnailUrl: null,
    averageRating: 4.8, reviewCount: 241, downloads: 6130,
    tags: ['combat', 'pvp', 'hitbox', 'skills'], createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
  },
  {
    id: 'demo-6', title: 'Modern City Vehicle Pack', slug: 'modern-city-vehicle-pack',
    description: 'Eight driveable vehicles — sedan, SUV, sports car, delivery truck, police cruiser, taxi, motorbike, and bicycle. Realistic physics tuning, functioning headlights, seat animations, and horn SFX. Works with any city map.',
    category: 'ASSET', priceCents: 1299, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 97, downloads: 2870,
    tags: ['vehicles', 'cars', 'driving', 'city'], createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null },
  },
  {
    id: 'demo-7', title: 'Tycoon Framework Pro', slug: 'tycoon-framework-pro',
    description: 'Battle-tested tycoon foundation used in 500+ published games. Conveyor systems, upgrade trees, droppers with configurable rates, auto-collectors, and a rebirth system. Fully modular — swap out any component independently.',
    category: 'GAME_TEMPLATE', priceCents: 2499, thumbnailUrl: null,
    averageRating: 4.6, reviewCount: 178, downloads: 4380,
    tags: ['tycoon', 'simulator', 'conveyor', 'economy'], createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null },
  },
  {
    id: 'demo-8', title: 'Fantasy Castle Building Kit', slug: 'fantasy-castle-building-kit',
    description: '200+ modular castle pieces — towers, walls, gates, battlements, interior rooms, dungeon corridors, and throne halls. Snap-fit design with matching textures. Includes a pre-assembled showcase castle to clone and edit.',
    category: 'UI_KIT', priceCents: 0, thumbnailUrl: null,
    averageRating: 4.4, reviewCount: 134, downloads: 7650,
    tags: ['castle', 'building', 'medieval', 'free'], createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c8', displayName: 'ForjeGames', username: 'forgegames', avatarUrl: null },
  },
  {
    id: 'demo-9', title: 'Mountain Highlands Terrain', slug: 'mountain-highlands-terrain',
    description: 'Epic mountain range spanning three distinct elevation zones — alpine meadows, pine forests, and snow-capped peaks with a glacial lake valley at the center. Optimized for streaming, includes SkyBox and atmospheric fog preset.',
    category: 'MAP_TEMPLATE', priceCents: 499, thumbnailUrl: null,
    averageRating: 4.5, reviewCount: 86, downloads: 2190,
    tags: ['mountain', 'terrain', 'snow', 'nature'], createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c9', displayName: 'MapMaster', username: 'map_master', avatarUrl: null },
  },
  {
    id: 'demo-10', title: 'DataStore Manager', slug: 'datastore-manager',
    description: 'Production-grade save system with automatic retry logic, queue batching, session-lock anti-duplication, and migration support. Handles player joins/leaves, server shutdown saves, and exposes a clean API for other systems to hook into.',
    category: 'SCRIPT', priceCents: 0, thumbnailUrl: null,
    averageRating: 4.9, reviewCount: 427, downloads: 12800,
    tags: ['datastore', 'save', 'free', 'essential'], createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c10', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
  },
  {
    id: 'demo-11', title: 'Ambient World Audio Pack', slug: 'ambient-world-audio-pack',
    description: '80+ layered ambient audio tracks — jungle dawn, ocean waves, mountain wind, dungeon drips, city traffic, and tavern chatter. Includes a smart AudioZone script that crossfades tracks as players move through regions.',
    category: 'SOUND', priceCents: 499, thumbnailUrl: null,
    averageRating: 4.6, reviewCount: 72, downloads: 3100,
    tags: ['audio', 'ambient', 'sfx', 'atmosphere'], createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c11', displayName: 'SoundForge', username: 'sound_forge', avatarUrl: null },
  },
  {
    id: 'demo-12', title: 'Obby Challenge Pack', slug: 'obby-challenge-pack',
    description: 'Thirty hand-designed obstacle courses ranging from beginner to expert difficulty. Moving platforms, spinning blades, lava floors, ice slides, and conveyor belts — all modular so you can rearrange and mix stages freely.',
    category: 'GAME_TEMPLATE', priceCents: 299, thumbnailUrl: null,
    averageRating: 4.3, reviewCount: 105, downloads: 5420,
    tags: ['obby', 'obstacle', 'platformer', 'stages'], createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 'c12', displayName: 'BuildPro', username: 'buildpro', avatarUrl: null },
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
        showToast({ variant: 'info', title: 'Browse 12 starter templates', description: 'Pet sims, terrain packs, NPC bundles, vehicles, UI kits, combat scripts, and more — all ready to import.', duration: 5000 })
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
      // Dedicated trending feed tab → hit the trending API
      if (activeTab === 'trending-feed') {
        const res = await fetch(`/api/marketplace/trending?limit=20`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as { templates: Template[] }
        setTemplates(data.templates ?? [])
        setTotal(data.templates?.length ?? 0)
        setTotalPages(1)
        return
      }

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
      <div className="border-b border-white/5" style={{ background: '#050810' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Marketplace
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Premium templates, scripts, maps, and UI kits — built by creators, for creators
              </p>
              {/* Quick stats */}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-white/25 flex items-center gap-1"><Package className="w-3 h-3" /> {templates.length > 0 ? `${templates.length}+ templates` : '12 demo templates'}</span>
                <span className="text-xs text-white/25 flex items-center gap-1"><Users className="w-3 h-3" /> Free + paid</span>
                <span className="text-xs text-white/25 flex items-center gap-1"><Flame className="w-3 h-3" /> Updated daily</span>
              </div>
            </div>

            {/* Submit CTA */}
            <a
              href="/marketplace/submit"
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-bold text-sm
                bg-gradient-to-br from-[#D4AF37] to-[#C8962A] text-white
                hover:brightness-110 active:scale-[0.97]
                shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]
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
                className="input-premium pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
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
                aria-label="Filter by price"
                className="
                  appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80 font-medium
                  hover:bg-white/[0.07] hover:border-white/15
                  focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/15
                  cursor-pointer transition-all duration-150 w-full sm:min-w-[140px]
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
                aria-label="Sort templates"
                className="
                  appearance-none bg-white/[0.04] border border-white/10 rounded-xl
                  px-4 py-3 pr-9 text-sm text-white/80 font-medium
                  hover:bg-white/[0.07] hover:border-white/15
                  focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/15
                  cursor-pointer transition-all duration-150 w-full sm:min-w-[160px]
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
            className="relative rounded-xl overflow-hidden border border-[#D4AF37]/35 shadow-[0_0_60px_rgba(212,175,55,0.08)] card-premium"
            style={{ backdropFilter: 'blur(14px)' }}
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
              <tab.icon size={14} strokeWidth={2} aria-hidden="true" />
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
          <EmptyState query={searchQuery} onClear={() => { setSearchQuery(''); setActiveTab('all'); setPriceFilter('') }} />
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
  const { show: showToast } = useToast()
  const isFree   = template.priceCents === 0
  const isHot    = template.downloads > 1000
  const catLabel = categoryLabel(template.category)
  const isDemoTemplate = template.id.startsWith('demo-')

  // Optimistic like/fork state
  const [liked, setLiked]       = useState(false)
  const [likeCount, setLikeCount] = useState<number>(template.likeCount ?? 0)
  const [forkCount, setForkCount] = useState<number>(template.forkCount ?? 0)
  const [likePending, setLikePending] = useState(false)
  const [forkPending, setForkPending] = useState(false)

  const forkedFromOriginal = template.forkedFrom?.[0]?.originalItem ?? null

  // Fetch initial like status (skip for demo rows)
  useEffect(() => {
    if (isDemoTemplate) return
    let cancelled = false
    fetch(`/api/marketplace/templates/${template.id}/like`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.liked === 'boolean') {
          setLiked(data.liked)
        }
      })
      .catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [template.id, isDemoTemplate])

  const handleLike = async (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (likePending) return
    if (isDemoTemplate) {
      showToast({ variant: 'info', title: 'Demo template', description: 'Sign in and browse real templates to like them.' })
      return
    }
    setLikePending(true)
    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}/like`, { method: 'POST' })
      if (!res.ok) {
        if (res.status === 401) {
          showToast({ variant: 'info', title: 'Sign in to like templates' })
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
        // Revert
        setLiked(wasLiked)
        setLikeCount((c) => c + (wasLiked ? 1 : -1))
      } else {
        const data = await res.json() as { liked: boolean }
        setLiked(data.liked)
      }
    } catch {
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
      showToast({ variant: 'error', title: 'Could not update like — try again' })
    } finally {
      setLikePending(false)
    }
  }

  const handleFork = async (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (forkPending) return
    if (isDemoTemplate) {
      showToast({ variant: 'info', title: 'Demo template', description: 'Sign in and browse real templates to fork them.' })
      return
    }
    setForkPending(true)
    try {
      const res = await fetch(`/api/marketplace/templates/${template.id}/fork`, { method: 'POST' })
      if (!res.ok) {
        if (res.status === 401) {
          showToast({ variant: 'info', title: 'Sign in to fork templates' })
        } else if (res.status === 400) {
          const data = await res.json().catch(() => ({}))
          showToast({ variant: 'info', title: data?.error ?? 'Cannot fork this template' })
        } else {
          showToast({ variant: 'error', title: 'Fork failed — try again' })
        }
      } else {
        const data = await res.json() as { templateId: string; slug?: string }
        setForkCount((c) => c + 1)
        showToast({
          variant: 'success',
          title: 'Remix created',
          description: 'A draft copy is now in your templates — open it from the submit page to publish.',
        })
        if (data?.templateId) {
          // Navigate to the new fork's detail page
          window.location.href = `/marketplace/${data.templateId}`
        }
      }
    } catch {
      showToast({ variant: 'error', title: 'Fork failed — try again' })
    } finally {
      setForkPending(false)
    }
  }

  return (
    <Link
      href={`/marketplace/${template.id}`}
      className="
        group flex flex-col card-premium card-premium-hover rounded-xl overflow-hidden
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
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[75%]">
          {isHot && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-semibold">Hot</span>
            </span>
          )}
          {forkedFromOriginal && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center gap-1 max-w-full"
              title={`Forked from ${forkedFromOriginal.title}`}
            >
              <GitFork className="w-2.5 h-2.5 text-violet-300" />
              <span className="text-violet-200 text-[10px] font-semibold truncate">
                Remix of {forkedFromOriginal.title}
              </span>
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

        {/* Social actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLike}
            disabled={likePending}
            aria-label={liked ? 'Unlike template' : 'Like template'}
            aria-pressed={liked}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium
              border transition-all duration-150
              ${liked
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/20'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/8'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-400' : ''}`} />
            <span className="tabular-nums">{formatCount(likeCount)}</span>
          </button>
          <button
            type="button"
            onClick={handleFork}
            disabled={forkPending}
            aria-label="Fork template"
            className="
              flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium
              bg-white/5 border border-white/10 text-white/50
              hover:text-violet-200 hover:bg-violet-500/10 hover:border-violet-500/30
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <GitFork className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatCount(forkCount)}</span>
          </button>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-1">
          <div
            className="
              flex-1 py-2 rounded-lg font-semibold text-xs text-center
              bg-gradient-to-r from-amber-500 to-yellow-400 text-black
              group-hover:from-amber-400 group-hover:to-yellow-300
              shadow-[0_0_12px_rgba(245,158,11,0.15)]
              group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]
              transition-all duration-200
            "
          >
            {isFree ? 'Use Free' : formatPrice(template.priceCents)}
          </div>
          <div
            onClick={(e) => { e.preventDefault(); window.location.href = `/editor?template=${template.slug || template.id}` }}
            className="
              px-3 py-2 rounded-lg text-xs font-medium text-center
              bg-white/5 border border-white/10 text-white/60
              hover:bg-white/10 hover:text-white hover:border-white/20
              transition-all duration-150 cursor-pointer
            "
            title="Open in Editor"
          >
            <Code2 className="w-3.5 h-3.5 inline" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col card-premium rounded-xl overflow-hidden animate-pulse">
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
  const isFiltered = !!query

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isFiltered ? 'bg-white/5 border border-white/8' : 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'}`}>
        {isFiltered
          ? <Search className="w-7 h-7 text-white/20" />
          : <Upload className="w-7 h-7 text-[#D4AF37]/70" />
        }
      </div>
      <div>
        {isFiltered ? (
          <>
            <p className="text-white/80 font-semibold text-lg">No templates found</p>
            <p className="text-white/35 text-sm mt-2">
              No results for &ldquo;{query}&rdquo;. Try different keywords or remove filters.
            </p>
          </>
        ) : (
          <>
            <p className="text-white font-bold text-lg">Be the first to publish a template</p>
            <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
              Share your Roblox scripts, maps, and game templates with the community and earn 70% of every sale.
            </p>
          </>
        )}
      </div>
      {isFiltered ? (
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
      ) : (
        <a
          href="/marketplace/submit"
          className="
            inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
            bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] text-black
            hover:from-[#c49b2f] hover:to-[#b38a28]
            shadow-[0_0_20px_rgba(212,175,55,0.2)]
            hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]
            transition-all duration-200
          "
        >
          <Upload className="w-4 h-4" />
          Publish Your First Template
        </a>
      )}
    </div>
  )
}
