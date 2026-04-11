'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { GalleryCard, type GalleryItem } from './GalleryCard'

// ─── Props ──────────────────────────────────────────────────────────────────

interface TrendingSectionProps {
  className?: string
  onItemClick?: (id: string) => void
  onFork?: (id: string) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TrendingSection({
  className = '',
  onItemClick,
  onFork,
}: TrendingSectionProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrending = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/marketplace/trending?limit=12')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.templates ?? [])
    } catch {
      setError('Failed to load trending templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  return (
    <section className={`space-y-6 ${className}`} aria-label="Trending templates">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trending Now</h2>
            <p className="text-xs text-white/40">Most popular templates this week</p>
          </div>
        </div>

        {!isLoading && (
          <button
            type="button"
            onClick={fetchTrending}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs text-white/40 hover:text-white/70
              bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15
              transition-all duration-150
            "
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <p className="text-white/50 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchTrending}
            className="
              px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
              text-sm text-white/70 border border-white/10 hover:border-white/20
              transition-all duration-150
            "
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!isLoading && !error && items.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label="Trending templates grid"
        >
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onClick={onItemClick}
              onFork={onFork}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <TrendingUp className="w-8 h-8 text-white/15" />
          <p className="text-white/40 text-sm">No trending templates yet</p>
        </div>
      )}
    </section>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-16 bg-white/[0.08] rounded" />
        <div className="h-4 w-full bg-white/[0.08] rounded" />
        <div className="h-4 w-2/3 bg-white/[0.08] rounded" />
        <div className="h-3 w-24 bg-white/5 rounded mt-1" />
        <div className="flex gap-4 pt-2 border-t border-white/5">
          <div className="h-3 w-12 bg-white/5 rounded" />
          <div className="h-3 w-12 bg-white/5 rounded" />
          <div className="h-3 w-12 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  )
}
