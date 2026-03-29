'use client'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SkeletonCard } from '@/components/ui/skeleton-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  title: string
  priceCents: number
  averageRating: number
  reviewCount: number
  downloads: number
  category: string
  thumbnailUrl: string | null
  screenshots: Array<{ url: string }>
  creator: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
  _count: { reviews: number }
}

// ─── Demo data (shown when DB unavailable or returns empty) ───────────────────

const DEMO_TEMPLATES: Template[] = [
  {
    id: 'demo-1',
    title: 'Medieval Castle Pack',
    priceCents: 1499,
    averageRating: 4.5,
    reviewCount: 42,
    downloads: 1820,
    category: 'GAME_TEMPLATE',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c1', displayName: 'Alex_Builds', username: 'alex_builds', avatarUrl: null },
    _count: { reviews: 42 },
  },
  {
    id: 'demo-2',
    title: 'City Starter Kit',
    priceCents: 0,
    averageRating: 5,
    reviewCount: 128,
    downloads: 9340,
    category: 'MAP_TEMPLATE',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c2', displayName: 'Marcus', username: 'marcus_dev', avatarUrl: null },
    _count: { reviews: 128 },
  },
  {
    id: 'demo-3',
    title: 'Tycoon Framework',
    priceCents: 2499,
    averageRating: 4,
    reviewCount: 67,
    downloads: 3210,
    category: 'GAME_TEMPLATE',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c3', displayName: 'Sarah', username: 'sarah_scripts', avatarUrl: null },
    _count: { reviews: 67 },
  },
  {
    id: 'demo-4',
    title: 'Modern UI Kit',
    priceCents: 999,
    averageRating: 4.5,
    reviewCount: 89,
    downloads: 5670,
    category: 'UI_KIT',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c4', displayName: 'DesignPro', username: 'designpro', avatarUrl: null },
    _count: { reviews: 89 },
  },
  {
    id: 'demo-5',
    title: 'Combat System v2',
    priceCents: 1999,
    averageRating: 5,
    reviewCount: 201,
    downloads: 7800,
    category: 'SCRIPT',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
    _count: { reviews: 201 },
  },
  {
    id: 'demo-6',
    title: 'Fantasy Map Bundle',
    priceCents: 3499,
    averageRating: 4,
    reviewCount: 55,
    downloads: 2100,
    category: 'MAP_TEMPLATE',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null },
    _count: { reviews: 55 },
  },
  {
    id: 'demo-7',
    title: 'Admin Panel Script',
    priceCents: 0,
    averageRating: 4.5,
    reviewCount: 310,
    downloads: 14200,
    category: 'SCRIPT',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null },
    _count: { reviews: 310 },
  },
  {
    id: 'demo-8',
    title: 'Inventory UI Pack',
    priceCents: 799,
    averageRating: 4,
    reviewCount: 44,
    downloads: 1950,
    category: 'UI_KIT',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c8', displayName: 'UIQueen', username: 'ui_queen', avatarUrl: null },
    _count: { reviews: 44 },
  },
  {
    id: 'demo-9',
    title: 'Tropical Island Asset Pack',
    priceCents: 1299,
    averageRating: 5,
    reviewCount: 73,
    downloads: 4100,
    category: 'ASSET',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c9', displayName: 'IslandArtist', username: 'island_artist', avatarUrl: null },
    _count: { reviews: 73 },
  },
  {
    id: 'demo-10',
    title: 'Dungeon Crawler Starter',
    priceCents: 1999,
    averageRating: 4.5,
    reviewCount: 96,
    downloads: 3580,
    category: 'GAME_TEMPLATE',
    thumbnailUrl: null,
    screenshots: [],
    creator: { id: 'c10', displayName: 'DungeonCraft', username: 'dungeon_craft', avatarUrl: null },
    _count: { reviews: 96 },
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'GAME_TEMPLATE', label: 'Games' },
  { value: 'MAP_TEMPLATE', label: 'Maps' },
  { value: 'UI_KIT', label: 'UI Kits' },
  { value: 'SCRIPT', label: 'Scripts' },
  { value: 'ASSET', label: 'Assets' },
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'new', label: 'Newest' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              i < full
                ? 'text-[#FFB81C]'
                : i === full && half
                ? 'text-[#FFB81C] opacity-60'
                : 'text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  )
}

function PriceBadge({ priceCents }: { priceCents: number }) {
  if (priceCents === 0) {
    return (
      <span className="text-xs font-bold bg-[#FFB81C]/15 text-[#FFB81C] px-2 py-0.5 rounded-full">
        FREE
      </span>
    )
  }
  return (
    <span className="text-xs font-bold text-[#FFB81C]">
      ${(priceCents / 100).toFixed(2)}
    </span>
  )
}

// Category icon mapping for the thumbnail placeholder
const CATEGORY_ICONS: Record<string, string> = {
  GAME_TEMPLATE: '🎮',
  MAP_TEMPLATE: '🗺️',
  UI_KIT: '🖼️',
  SCRIPT: '📜',
  ASSET: '📦',
  SOUND: '🔊',
}

function TemplateCard({ template, index }: { template: Template; index: number }) {
  const thumb = template.thumbnailUrl || template.screenshots?.[0]?.url
  const creatorName =
    template.creator?.displayName || template.creator?.username || 'Unknown'
  const icon = CATEGORY_ICONS[template.category] || '🎮'

  return (
    <AnimatedCard
      index={index}
      className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden group hover:border-[#FFB81C]/30 transition-colors"
    >
      <Link href={`/marketplace/${template.id}`} className="block">
        {/* Thumbnail */}
        <div className="h-40 bg-[#111640] flex items-center justify-center overflow-hidden relative">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={template.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-5xl opacity-25 group-hover:opacity-40 transition-opacity">
              {icon}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-3">
          <p className="text-white text-sm font-semibold truncate group-hover:text-[#FFB81C] transition-colors">
            {template.title}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">by {creatorName}</p>

          <div className="flex items-center justify-between mt-2">
            <StarRating rating={template.averageRating} count={template.reviewCount} />
            <PriceBadge priceCents={template.priceCents} />
          </div>

          <div className="flex items-center gap-1 mt-1.5">
            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs text-gray-600">{template.downloads.toLocaleString()}</span>
          </div>

          <button className="mt-3 w-full bg-white/5 hover:bg-[#FFB81C]/10 border border-white/10 hover:border-[#FFB81C]/30 text-gray-300 hover:text-[#FFB81C] text-xs font-medium py-1.5 rounded-lg transition-colors">
            View
          </button>
        </div>
      </Link>
    </AnimatedCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('trending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Fetch real templates — fall back to demo data on error or empty
  const params = new URLSearchParams({
    ...(category ? { category } : {}),
    sort,
    ...(search ? { search } : {}),
    page: String(page),
    limit: '24',
  })

  const { data, isLoading } = useSWR(`/api/marketplace/templates?${params}`, fetcher, {
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if (retryCount >= 1) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    },
  })

  const apiTemplates: Template[] = data?.templates ?? []
  const hasRealData = apiTemplates.length > 0
  const pagination = data?.pagination

  // Client-side filter demo data to match search/category (mirrors server behavior)
  const filteredDemo = useMemo(() => {
    let list = DEMO_TEMPLATES
    if (category) list = list.filter(t => t.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          (t.creator.displayName ?? '').toLowerCase().includes(q) ||
          (t.creator.username ?? '').toLowerCase().includes(q),
      )
    }
    if (sort === 'top-rated') list = [...list].sort((a, b) => b.averageRating - a.averageRating)
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents)
    return list
  }, [category, search, sort])

  // Decide which templates to render
  const templates = hasRealData ? apiTemplates : filteredDemo
  const isDemo = !hasRealData && !isLoading

  const totalLabel = hasRealData
    ? `${pagination?.total?.toLocaleString() ?? templates.length} template${(pagination?.total ?? templates.length) !== 1 ? 's' : ''}`
    : `${filteredDemo.length} template${filteredDemo.length !== 1 ? 's' : ''} (demo)`

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">
            Discover templates and assets from top creators
          </p>
        </div>
        <Link
          href="/marketplace/submit"
          className="bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          + Submit Template
        </Link>
      </div>

      {/* Demo notice */}
      {isDemo && !isLoading && (
        <div className="mb-4 bg-[#FFB81C]/10 border border-[#FFB81C]/30 rounded-xl px-4 py-3 text-sm text-[#FFB81C]">
          Preview mode — connect a database to see live templates. Showing example content.
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 mb-6">
        {/* Search bar */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search templates..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="bg-white/5 border border-white/10 text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category tabs + sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-[#FFB81C] text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1) }}
            className="ml-auto bg-white/5 border border-white/10 text-gray-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#FFB81C]/30"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {totalLabel}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} imageHeight={160} lines={3} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        // Only reaches here if demo data was also filtered to empty
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium text-white mb-1">No templates match your search</p>
          <button
            onClick={() => { setSearch(''); setCategory('') }}
            className="text-sm text-[#FFB81C] hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, i) => (
              <TemplateCard key={template.id} template={template} index={i} />
            ))}
          </div>

          {/* Pagination (only for real data) */}
          {hasRealData && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-sm disabled:opacity-40 hover:border-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
