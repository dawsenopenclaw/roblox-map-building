'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { TierBadge } from '@/components/TierBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'GAME_TEMPLATE', label: 'Game Templates' },
  { value: 'MAP_TEMPLATE', label: 'Map Templates' },
  { value: 'UI_KIT', label: 'UI Kits' },
  { value: 'SCRIPT', label: 'Scripts' },
  { value: 'ASSET', label: 'Assets' },
  { value: 'SOUND', label: 'Sounds' },
]

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'new', label: 'Newest' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-3 h-3 ${i < full ? 'text-[#FFB81C]' : i === full && half ? 'text-[#FFB81C]' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  )
}

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
  creator: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null }
  _count: { reviews: number }
}

export default function MarketplacePage() {
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('trending')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({
    ...(category ? { category } : {}),
    sort,
    ...(search ? { search } : {}),
    page: String(page),
    limit: '24',
  })

  const { data, isLoading } = useSWR(`/api/marketplace/templates?${params}`, fetcher)

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }, [searchInput])

  const templates: Template[] = data?.templates || []
  const pagination = data?.pagination

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Discover templates and assets from top creators</p>
        </div>
        <Link
          href="/marketplace/submit"
          className="bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          + Submit Template
        </Link>
      </div>

      {/* Search + filters */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-[#FFB81C]/10 border border-[#FFB81C]/30 text-[#FFB81C] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#FFB81C]/20 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-[#FFB81C] text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1) }}
            className="ml-auto bg-white/5 border border-white/10 text-gray-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {pagination && (
        <p className="text-sm text-gray-500 mb-4">
          {pagination.total.toLocaleString()} template{pagination.total !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium text-white mb-1">No templates found</p>
          <p className="text-sm">Try adjusting your filters or be the first to submit one!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((template) => {
              const thumb = template.thumbnailUrl || template.screenshots?.[0]?.url
              const creatorName = template.creator?.displayName || template.creator?.username || 'Unknown'
              return (
                <Link
                  key={template.id}
                  href={`/marketplace/${template.id}`}
                  className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group"
                >
                  <div className="h-40 bg-[#111640] flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={template.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-20">🎮</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold truncate group-hover:text-[#FFB81C] transition-colors">
                      {template.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{creatorName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <StarRating rating={template.averageRating} count={template.reviewCount} />
                      <span className="text-xs font-bold text-[#FFB81C]">
                        {template.priceCents === 0 ? 'Free' : `$${(template.priceCents / 100).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-xs text-gray-600">{template.downloads.toLocaleString()} downloads</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
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
