'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Package, RefreshCw, TrendingUp, Search } from 'lucide-react'
import { Star } from 'lucide-react'
import type { TemplateSearchItem } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResultsProps {
  templates: TemplateSearchItem[]
  total: number
  nextCursor: string | null
  isLoading?: boolean
  query?: string
  onLoadMore: (cursor: string) => void
  onRetry?: () => void
  error?: string | null
  useInfiniteScroll?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchResults({
  templates,
  total,
  nextCursor,
  isLoading = false,
  query,
  onLoadMore,
  onRetry,
  error,
  useInfiniteScroll = false,
}: SearchResultsProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!useInfiniteScroll || !nextCursor || isLoading || isLoadingMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor) {
          handleLoadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useInfiniteScroll, nextCursor, isLoading, isLoadingMore])

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      onLoadMore(nextCursor)
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextCursor, isLoadingMore, onLoadMore])

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-white/70 font-medium">Something went wrong</p>
          <p className="text-white/40 text-sm mt-1">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="
              px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
              text-sm text-white/70 hover:text-white
              border border-white/10 hover:border-white/20
              transition-all duration-150
            "
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading && templates.length === 0) {
    return (
      <div className="space-y-4">
        <ResultCountBar total={0} query={query} isLoading />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!isLoading && templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <Search className="w-7 h-7 text-white/20" />
        </div>
        <div>
          <p className="text-white/80 font-semibold text-lg">No results found</p>
          {query ? (
            <p className="text-white/40 text-sm mt-2">
              No templates match &ldquo;{query}&rdquo;. Try different keywords or remove some filters.
            </p>
          ) : (
            <p className="text-white/40 text-sm mt-2">
              Try adjusting your filters to find what you&apos;re looking for.
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <SuggestionChip label="Browse all templates" query="" />
          <SuggestionChip label="Game templates" query="game template" />
          <SuggestionChip label="Free assets" query="free" />
          <SuggestionChip label="UI kits" query="UI kit" />
        </div>
      </div>
    )
  }

  // ── Results grid ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <ResultCountBar total={total} query={query} isLoading={isLoading} />

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        role="list"
        aria-label="Search results"
        aria-busy={isLoading}
      >
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}

        {/* Loading more skeletons */}
        {isLoadingMore &&
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={`more-${i}`} />)}
      </div>

      {/* Infinite scroll sentinel */}
      {useInfiniteScroll && nextCursor && (
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      )}

      {/* Load more button (non-infinite) */}
      {!useInfiniteScroll && nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="
              px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10
              text-sm text-white/70 hover:text-white
              border border-white/10 hover:border-white/20
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load more (${total - templates.length} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ResultCountBar ───────────────────────────────────────────────────────────

function ResultCountBar({
  total,
  query,
  isLoading,
}: {
  total: number
  query?: string
  isLoading?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/40 min-h-[1.5rem]">
      {isLoading ? (
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
      ) : (
        <>
          <span>
            <span className="text-white/70 font-medium">{total.toLocaleString()}</span>
            {' '}
            {total === 1 ? 'result' : 'results'}
            {query && (
              <>
                {' for '}
                <span className="text-white/60">&ldquo;{query}&rdquo;</span>
              </>
            )}
          </span>
        </>
      )}
    </div>
  )
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: TemplateSearchItem }) {
  const isFree = template.priceCents === 0
  const priceDisplay = isFree
    ? 'Free'
    : `$${(template.priceCents / 100).toFixed(2)}`

  const categoryLabel = template.category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <article
      role="listitem"
      className="
        group relative flex flex-col bg-white/3 border border-white/8
        rounded-xl overflow-hidden
        hover:border-white/20 hover:bg-white/5
        transition-all duration-200 cursor-pointer
      "
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-white/5 overflow-hidden">
        {template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt={`${template.title} template thumbnail`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-white/10" />
          </div>
        )}

        {/* Price badge */}
        <div
          className={`
            absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-semibold
            ${isFree
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-black/60 text-white border border-white/10'
            }
          `}
        >
          {priceDisplay}
        </div>

        {/* Trending indicator */}
        {template.downloads > 1000 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">Hot</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Category */}
        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">
          {categoryLabel}
        </span>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-150">
          {template.title}
        </h3>

        {/* Creator */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          {template.creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.creator.avatarUrl}
              alt={`${template.creator.displayName ?? template.creator.username ?? 'Unknown creator'} avatar`}
              className="w-4 h-4 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-violet-500/30 flex items-center justify-center">
              <span className="text-violet-300 text-[8px] font-bold">
                {(template.creator.displayName ?? template.creator.username ?? '?')[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-white/40 truncate">
            {template.creator.displayName ?? template.creator.username ?? 'Unknown'}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-white/60 tabular-nums">
              {template.averageRating > 0
                ? template.averageRating.toFixed(1)
                : '—'}
            </span>
            {template.reviewCount > 0 && (
              <span className="text-xs text-white/30">
                ({template.reviewCount.toLocaleString()})
              </span>
            )}
          </div>

          {/* Downloads */}
          <span className="text-xs text-white/30 tabular-nums">
            {formatCount(template.downloads)} downloads
          </span>
        </div>
      </div>
    </article>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white/3 border border-white/8 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-16 bg-white/8 rounded" />
        <div className="h-4 w-full bg-white/8 rounded" />
        <div className="h-4 w-2/3 bg-white/8 rounded" />
        <div className="h-3 w-24 bg-white/5 rounded mt-1" />
      </div>
    </div>
  )
}

// ─── SuggestionChip ───────────────────────────────────────────────────────────

function SuggestionChip({ label, query }: { label: string; query: string }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (query) {
        url.searchParams.set('q', query)
      } else {
        url.searchParams.delete('q')
      }
      url.searchParams.delete('category')
      url.searchParams.delete('minPrice')
      url.searchParams.delete('maxPrice')
      url.searchParams.delete('minRating')
      url.searchParams.delete('after')
      window.history.pushState({}, '', url.toString())
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        px-3 py-1.5 rounded-lg border border-white/10 bg-white/3
        text-xs text-white/50 hover:text-white/80 hover:bg-white/8 hover:border-white/20
        transition-all duration-150
      "
    >
      {label}
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}
