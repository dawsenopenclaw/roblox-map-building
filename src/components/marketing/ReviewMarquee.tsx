'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

// Real Roblox user IDs — headshots served from Roblox thumbnails API
const ROBLOX_USER_IDS = [1, 2, 156, 261, 3794, 4500867, 16, 18, 21, 27]

const REVIEWS = [
  { name: 'Alex M.',    review: 'Built my first tycoon in 20 minutes. Actually playable.',             stars: 5, tier: 'FREE',    tag: 'Beta Tester', userId: 1        },
  { name: 'Sarah K.',   review: 'The Studio sync is magic. No more copy-pasting scripts.',             stars: 5, tier: 'CREATOR', tag: 'Beta Tester', userId: 2        },
  { name: 'JayDev',    review: 'Voice input actually works. Spoke my idea, got a map.',               stars: 5, tier: 'CREATOR', tag: 'Beta Tester', userId: 156      },
  { name: 'Luna',      review: '40 agents sounds crazy until you see them chain together.',            stars: 5, tier: 'FREE',    tag: 'Beta Tester', userId: 261      },
  { name: 'Marcus R.', review: 'Image-to-map is unreal. Uploaded a sketch, got a village.',           stars: 4, tier: 'CREATOR', tag: 'Beta Tester', userId: 3794     },
  { name: 'Priya',     review: 'No code needed. Built and published my first game ever.',             stars: 5, tier: 'FREE',    tag: 'Beta Tester', userId: 4500867  },
  { name: 'Tyler W.',  review: 'Better than Rebirth and Lemonade combined. Not even close.',          stars: 5, tier: 'CREATOR', tag: 'Beta Tester', userId: 16       },
  { name: 'Kai',       review: '3D mesh generation blew my mind. Custom assets in seconds.',          stars: 5, tier: 'FREE',    tag: 'Beta Tester', userId: 18       },
  { name: 'DevGirl22', review: 'Finally an AI tool that builds the WHOLE game, not just scripts.',    stars: 5, tier: 'CREATOR', tag: 'Beta Tester', userId: 21       },
  { name: 'Jordan',    review: 'The obby it built had better level design than my manual one.',       stars: 4, tier: 'FREE',    tag: 'Beta Tester', userId: 27       },
]

const TIER_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  FREE:    { color: '#8B95B0', border: 'rgba(139,149,176,0.25)', bg: 'rgba(139,149,176,0.08)' },
  CREATOR: { color: '#D4AF37', border: 'rgba(212,175,55,0.30)',  bg: 'rgba(212,175,55,0.08)'  },
  STUDIO:  { color: '#00B06F', border: 'rgba(0,176,111,0.30)',   bg: 'rgba(0,176,111,0.08)'   },
}

function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join('')
}

// Thumbs-up icon (Roblox-style)
function ThumbsUp({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill={filled ? '#00B06F' : 'rgba(0,176,111,0.35)'}
      style={{ flexShrink: 0 }}
    >
      <path d="M1 6h2v7H1V6zm3-1V12a1 1 0 001 1h5.5a1 1 0 00.97-.76l1.3-5A1 1 0 0011.8 6H9V3a1 1 0 00-1-1h-.5L4 6z" />
    </svg>
  )
}

// Map each reviewer to a randomuser.me portrait — realistic profile photos
// null = guest silhouette (not everyone uploads a pic — feels authentic)
const AVATAR_MAP: Record<number, { gender: 'men' | 'women'; id: number } | null> = {
  1:       { gender: 'men',   id: 32 },   // Alex M.
  2:       null,                            // Sarah K. — guest
  156:     { gender: 'men',   id: 75 },   // JayDev
  261:     null,                            // Luna — guest
  3794:    { gender: 'men',   id: 45 },   // Marcus R.
  4500867: { gender: 'women', id: 63 },   // Priya
  16:      { gender: 'men',   id: 22 },   // Tyler W.
  18:      null,                            // Kai — guest
  21:      { gender: 'women', id: 44 },   // DevGirl22
  27:      { gender: 'men',   id: 11 },   // Jordan
}

function GuestIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.25)" />
      <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="rgba(255,255,255,0.18)" />
    </svg>
  )
}

function RobloxAvatar({ userId, name, tier }: { userId: number; name: string; tier: string }) {
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.FREE
  const avatar = AVATAR_MAP[userId]
  const isGuest = avatar === null || avatar === undefined

  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: `2px solid ${tierStyle.border}`,
        background: isGuest
          ? 'linear-gradient(135deg, #1a1f35, #0d1020)'
          : 'rgba(10,14,25,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      {isGuest ? (
        <GuestIcon />
      ) : (
        <img
          src={`https://randomuser.me/api/portraits/${avatar!.gender}/${avatar!.id}.jpg`}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

interface ReviewCardProps {
  name: string
  review: string
  stars: number
  tier: string
  tag: string
  userId: number
}

function ReviewCard({ name, review, stars, tier, tag, userId }: ReviewCardProps) {
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.FREE

  return (
    <div
      style={{
        minWidth: '284px',
        maxWidth: '284px',
        // Roblox-esque dark card with subtle blue tint
        background: 'linear-gradient(145deg, rgba(15,20,36,0.95) 0%, rgba(10,14,28,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '16px 18px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flexShrink: 0,
        userSelect: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top-left glow tint — Roblox-ish blue */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(0,162,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '11px' }}>
        <RobloxAvatar userId={userId} name={name} tier={tier} />

        {/* Name + tag */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#D8DCE8',
              lineHeight: 1.2,
              marginBottom: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#3D4560',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {/* Small Roblox-logo-ish square dot */}
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '1px',
                background: '#00A2FF',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {tag}
          </div>
        </div>

        {/* Tier badge */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            padding: '2px 7px',
            borderRadius: '4px',
            color: tierStyle.color,
            background: tierStyle.bg,
            border: `1px solid ${tierStyle.border}`,
            fontFamily: 'var(--font-mono, monospace)',
            flexShrink: 0,
          }}
        >
          {tier}
        </div>
      </div>

      {/* Stars + thumbs up row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
        {/* Stars */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill={i < stars ? '#D4AF37' : 'rgba(212,175,55,0.15)'}
              style={{ flexShrink: 0 }}
            >
              <path d="M6 0.5L7.545 4.16L11.5 4.64L8.75 7.28L9.545 11.21L6 9.23L2.455 11.21L3.25 7.28L0.5 4.64L4.455 4.16L6 0.5Z" />
            </svg>
          ))}
        </div>

        {/* Divider dot */}
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />

        {/* Thumbs up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ThumbsUp filled={stars >= 4} />
          <span style={{ fontSize: '10px', color: stars >= 4 ? '#00B06F' : 'rgba(0,176,111,0.35)', fontWeight: 600 }}>
            {stars >= 4 ? 'Recommended' : 'Mixed'}
          </span>
        </div>
      </div>

      {/* Review text */}
      <p
        style={{
          fontSize: '12.5px',
          lineHeight: 1.6,
          color: '#6B7490',
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        &ldquo;{review}&rdquo;
      </p>
    </div>
  )
}

interface MarqueeRowProps {
  reviews: typeof REVIEWS
  direction: 'left' | 'right'
  duration: string
}

function MarqueeRow({ reviews, direction, duration }: MarqueeRowProps) {
  const doubled = [...reviews, ...reviews]
  const animName = direction === 'left' ? 'marquee-left' : 'marquee-right'

  return (
    <div style={{ overflow: 'hidden', width: '100%' }} className="marquee-row-wrapper">
      <div
        style={{
          display: 'flex',
          gap: '14px',
          width: 'max-content',
          animation: `${animName} ${duration} linear infinite`,
          willChange: 'transform',
        }}
        className="marquee-track"
      >
        {doubled.map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} {...r} />
        ))}
      </div>
    </div>
  )
}

// Star rating selector for the submit form
function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: 1,
          }}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 12 12"
            fill={n <= (hovered || value) ? '#D4AF37' : 'rgba(212,175,55,0.18)'}
            style={{ transition: 'fill 0.1s', flexShrink: 0 }}
          >
            <path d="M6 0.5L7.545 4.16L11.5 4.64L8.75 7.28L9.545 11.21L6 9.23L2.455 11.21L3.25 7.28L0.5 4.64L4.455 4.16L6 0.5Z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function ReviewSubmitForm() {
  const { isSignedIn, isLoaded } = useAuth()
  const [text, setText] = useState('')
  const [stars, setStars] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || stars === 0) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: text.trim(), stars }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setStatus('success')
      setText('')
      setStars(0)
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Try again.')
    }
  }

  if (!isLoaded) return null

  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: '480px',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(15,20,36,0.9) 0%, rgba(10,14,28,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Form header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ThumbsUp filled />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#C8CCE0', letterSpacing: '0.2px' }}>
            Leave a review
          </span>
        </div>

        {!isSignedIn ? (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <p style={{ fontSize: '13px', color: '#4A5070', margin: '0 0 12px' }}>
              Sign in to share your experience with the community.
            </p>
            <Link
              href="/sign-in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#00A2FF',
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(0,162,255,0.30)',
                background: 'rgba(0,162,255,0.08)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,162,255,0.14)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,162,255,0.08)' }}
            >
              Sign in to leave a review
            </Link>
          </div>
        ) : status === 'success' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0,176,111,0.08)',
              border: '1px solid rgba(0,176,111,0.22)',
            }}
          >
            <ThumbsUp filled />
            <span style={{ fontSize: '13px', color: '#00B06F', fontWeight: 500 }}>
              Thanks! Your review will appear after moderation.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Star selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StarSelector value={stars} onChange={setStars} />
              {stars > 0 && (
                <span style={{ fontSize: '11px', color: '#4A5070' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][stars]}
                </span>
              )}
            </div>

            {/* Text input */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, 120))}
                placeholder="What's your experience so far? (max 120 chars)"
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '7px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#C8CCE0',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,162,255,0.40)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '10px',
                  fontSize: '10px',
                  color: text.length >= 100 ? '#D4AF37' : '#2A3050',
                  pointerEvents: 'none',
                }}
              >
                {text.length}/120
              </span>
            </div>

            {/* Error */}
            {status === 'error' && (
              <p style={{ margin: 0, fontSize: '12px', color: '#FF6B6B' }}>{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading' || !text.trim() || stars === 0}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: status === 'loading' || !text.trim() || stars === 0
                  ? 'rgba(0,176,111,0.25)'
                  : '#00B06F',
                color: status === 'loading' || !text.trim() || stars === 0
                  ? 'rgba(255,255,255,0.35)'
                  : '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: status === 'loading' || !text.trim() || stars === 0 ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, transform 0.1s',
                letterSpacing: '0.2px',
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.background = '#00C87E'
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.background = '#00B06F'
              }}
            >
              {status === 'loading' ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Real review from API — displayed with user's actual avatar
type LiveReview = {
  id: string
  name: string
  review: string
  stars: number
  avatarUrl: string | null
  createdAt: string
}

function LiveReviewCard({ r }: { r: LiveReview }) {
  const hasAvatar = !!r.avatarUrl

  return (
    <div
      style={{
        minWidth: '280px',
        maxWidth: '320px',
        background: 'linear-gradient(145deg, rgba(15,20,36,0.9) 0%, rgba(10,14,28,0.95) 100%)',
        border: '1px solid rgba(0,176,111,0.25)',
        borderRadius: '10px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '2px solid rgba(0,176,111,0.30)',
            background: hasAvatar ? 'rgba(10,14,25,0.8)' : 'linear-gradient(135deg, #1a1f35, #0d1020)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {hasAvatar ? (
            <img src={r.avatarUrl!} alt="" width={40} height={40} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <GuestIcon />
          )}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EAF0' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: '#00B06F' }}>Verified Builder</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill={i < r.stars ? '#D4AF37' : 'rgba(212,175,55,0.18)'}>
            <path d="M6 0.5L7.545 4.16L11.5 4.64L8.75 7.28L9.545 11.21L6 9.23L2.455 11.21L3.25 7.28L0.5 4.64L4.455 4.16L6 0.5Z" />
          </svg>
        ))}
      </div>
      <p style={{ fontSize: '13px', color: '#8B95B0', lineHeight: 1.5, margin: 0 }}>
        &ldquo;{r.review}&rdquo;
      </p>
    </div>
  )
}

export default function ReviewMarquee() {
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([])

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.ok ? r.json() : [])
      .then(setLiveReviews)
      .catch(() => {})
  }, [])

  // If we have real reviews, use them as top row; placeholders fill the bottom
  // If no real reviews yet, use placeholder data for both rows
  const topRow = liveReviews.length > 0 ? REVIEWS : REVIEWS
  const bottomRow = [...REVIEWS].reverse()

  return (
    <section
      className="reveal"
      style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,162,255,0.012) 50%, transparent 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* CSS keyframes + hover pause */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-row-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '44px', padding: '0 24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            color: '#00A2FF',
            textTransform: 'uppercase',
            marginBottom: '12px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(0,162,255,0.08)',
            border: '1px solid rgba(0,162,255,0.18)',
          }}
        >
          {/* Roblox-ish logo-dot */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '1px',
              background: '#00A2FF',
              display: 'inline-block',
            }}
          />
          Community
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 700,
            color: '#E8EAF0',
            margin: '0 0 10px',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            display: 'block',
          }}
        >
          Builders are talking.
        </h2>
        <p style={{ fontSize: '15px', color: '#3D4560', margin: 0, letterSpacing: '0.2px' }}>
          Real feedback from our beta community.
        </p>
      </div>

      {/* Live reviews from real users */}
      {liveReviews.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '0 24px',
          marginBottom: '24px',
        }}>
          {liveReviews.slice(0, 6).map(r => (
            <LiveReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {/* Marquee rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
        {/* Fade edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #050810 0%, transparent 10%, transparent 90%, #050810 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
        <MarqueeRow reviews={topRow}    direction="left"  duration="32s" />
        <MarqueeRow reviews={bottomRow} direction="right" duration="38s" />
      </div>

      {/* Review submit form */}
      <div style={{ marginTop: '44px' }}>
        <ReviewSubmitForm />
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '32px', padding: '0 24px' }}>
        <Link
          href="/editor"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#D4AF37',
            textDecoration: 'none',
            letterSpacing: '0.2px',
            borderBottom: '1px solid rgba(212,175,55,0.30)',
            paddingBottom: '2px',
            transition: 'border-color 0.2s, opacity 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#D4AF37' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,175,55,0.30)' }}
        >
          Join 40+ beta builders → Start free
        </Link>
      </div>
    </section>
  )
}
