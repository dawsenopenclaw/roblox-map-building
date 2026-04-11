'use client'

import * as React from 'react'

export interface AvatarProps {
  /** Roblox userId (numeric). If present, used to fetch the headshot. */
  robloxUserId?: number | string
  /** Direct image URL (overrides robloxUserId). */
  src?: string
  /** Display name — used for fallback initials and alt text. */
  name?: string
  /** Pixel size (square). Defaults to 48. */
  size?: number
  /** Roblox thumbnail size bucket. Defaults to 150x150. */
  thumbSize?: 48 | 60 | 100 | 150 | 180 | 352 | 420 | 720
  /** Shape. */
  shape?: 'circle' | 'rounded' | 'square'
  /** Extra className for wrapper. */
  className?: string
  /** Optional click handler — makes the avatar a button. */
  onClick?: () => void
  /** Status ring color — e.g. 'online', 'pro'. */
  ringColor?: string
}

type LoadState = 'loading' | 'loaded' | 'error'

/**
 * Roblox-style headshot fetcher with initials + gradient fallback.
 *
 * Fetches from the public Roblox thumbnails endpoint:
 *   https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=X&size=150x150&format=Png
 *
 * Accessibility:
 * - Renders an img with a descriptive alt ("Avatar for {name}").
 * - Falls back to a decorative gradient + initials if no image is available.
 * - When `onClick` is provided the wrapper becomes a button with proper role.
 */
export function Avatar({
  robloxUserId,
  src,
  name,
  size = 48,
  thumbSize = 150,
  shape = 'circle',
  className,
  onClick,
  ringColor,
}: AvatarProps): React.ReactElement {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | null>(src ?? null)
  const [state, setState] = React.useState<LoadState>(src ? 'loading' : 'loading')

  React.useEffect(() => {
    let cancelled = false
    if (src) {
      setResolvedSrc(src)
      setState('loading')
      return
    }
    if (robloxUserId == null) {
      setResolvedSrc(null)
      setState('error')
      return
    }
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(String(robloxUserId))}&size=${thumbSize}x${thumbSize}&format=Png&isCircular=false`
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { data?: Array<{ state?: string; imageUrl?: string }> }) => {
        if (cancelled) return
        const img = data.data?.[0]
        if (img?.imageUrl && img.state === 'Completed') {
          setResolvedSrc(img.imageUrl)
          setState('loading')
        } else {
          setState('error')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [robloxUserId, src, thumbSize])

  const shapeClass =
    shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const initials = getInitials(name)
  const gradient = gradientFromName(name ?? 'forje')
  const alt = name ? `Avatar for ${name}` : 'User avatar'

  const showFallback = state === 'error' || !resolvedSrc

  const ringStyle: React.CSSProperties = ringColor
    ? { boxShadow: `0 0 0 2px var(--background, #000), 0 0 0 4px ${ringColor}` }
    : {}

  const inner = (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden ${shapeClass}`}
      style={{ width: size, height: size, ...ringStyle }}
    >
      {showFallback ? (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center text-white font-semibold"
          style={{ background: gradient, fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      ) : (
        <img
          src={resolvedSrc ?? undefined}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {!showFallback && state === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse"
          style={{ background: gradient }}
        />
      )}
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={alt}
        className={`inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${shapeClass} ${className ?? ''}`}
      >
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function gradientFromName(name: string): string {
  // Deterministic hash → hue
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  const h2 = (h + 45) % 360
  return `linear-gradient(135deg, hsl(${h} 70% 55%) 0%, hsl(${h2} 70% 45%) 100%)`
}

export default Avatar
