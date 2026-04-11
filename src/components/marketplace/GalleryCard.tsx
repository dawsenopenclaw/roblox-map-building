'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import {
  Heart,
  GitFork,
  Eye,
  Package,
  Award,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string
  title: string
  slug: string
  category: string
  priceCents: number
  thumbnailUrl: string | null
  tags: string[]
  likeCount: number
  forkCount: number
  viewCount: number
  featured: boolean
  createdAt: string | Date
  creator: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
}

interface GalleryCardProps {
  item: GalleryItem
  initialLiked?: boolean
  onLike?: (id: string, liked: boolean) => void
  onFork?: (id: string) => void
  onClick?: (id: string) => void
  className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GalleryCard({
  item,
  initialLiked = false,
  onLike,
  onFork,
  onClick,
  className = '',
}: GalleryCardProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(item.likeCount)
  const [isLiking, setIsLiking] = useState(false)

  const isFree = item.priceCents === 0
  const priceDisplay = isFree ? 'Free' : `$${(item.priceCents / 100).toFixed(2)}`

  const categoryLabel = item.category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const creatorName =
    item.creator.displayName ?? item.creator.username ?? 'Unknown'

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isLiking) return
      setIsLiking(true)

      const nextLiked = !liked
      setLiked(nextLiked)
      setLikeCount((c) => c + (nextLiked ? 1 : -1))

      try {
        const res = await fetch(`/api/marketplace/templates/${item.id}/like`, {
          method: 'POST',
        })
        if (!res.ok) {
          // Revert optimistic update
          setLiked(!nextLiked)
          setLikeCount((c) => c + (nextLiked ? -1 : 1))
        } else {
          onLike?.(item.id, nextLiked)
        }
      } catch {
        setLiked(!nextLiked)
        setLikeCount((c) => c + (nextLiked ? -1 : 1))
      } finally {
        setIsLiking(false)
      }
    },
    [liked, isLiking, item.id, onLike]
  )

  const handleFork = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onFork?.(item.id)
    },
    [item.id, onFork]
  )

  return (
    <article
      role="listitem"
      onClick={() => onClick?.(item.id)}
      className={`
        group relative flex flex-col bg-white/[0.03] border border-white/[0.08]
        rounded-xl overflow-hidden cursor-pointer
        hover:-translate-y-1 hover:border-[rgba(212,175,55,0.3)]
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.08)]
        hover:bg-white/[0.05]
        transition-all duration-200
        ${className}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-white/5 overflow-hidden">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={`${item.title} thumbnail`}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-white/10" />
          </div>
        )}

        {/* Featured badge */}
        {item.featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[rgba(212,175,55,0.2)] border border-[rgba(212,175,55,0.4)] flex items-center gap-1">
            <Award className="w-3 h-3 text-[#d4af37]" />
            <span className="text-[#d4af37] text-xs font-semibold">Featured</span>
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
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Category */}
        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">
          {categoryLabel}
        </span>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-150">
          {item.title}
        </h3>

        {/* Creator */}
        <div className="flex items-center gap-1.5 mt-1">
          {item.creator.avatarUrl ? (
            <Image
              src={item.creator.avatarUrl}
              alt={`${creatorName} avatar`}
              width={16}
              height={16}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[rgba(212,175,55,0.3)] flex items-center justify-center">
              <span className="text-[#d4af37] text-[8px] font-bold">
                {creatorName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-white/40 truncate">{creatorName}</span>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/30 border border-white/5"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-white/20">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/5">
          {/* Like button */}
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs
              transition-all duration-150 disabled:opacity-50
              ${liked
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15'
                : 'text-white/40 hover:text-red-400 hover:bg-white/5'
              }
            `}
          >
            <Heart
              className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''}`}
            />
            <span className="tabular-nums">{formatCount(likeCount)}</span>
          </button>

          {/* Fork button */}
          <button
            type="button"
            onClick={handleFork}
            aria-label="Fork this template"
            className="
              flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs
              text-white/40 hover:text-[#d4af37] hover:bg-white/5
              transition-all duration-150
            "
          >
            <GitFork className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatCount(item.forkCount)}</span>
          </button>

          {/* View count */}
          <div className="flex items-center gap-1 text-xs text-white/30">
            <Eye className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatCount(item.viewCount)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
