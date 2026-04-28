'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

type LiveReview = {
  id: string
  name: string
  review: string
  stars: number
  avatarUrl: string | null
  createdAt: string
}

// ─── Small icons ────────────────────────────────────────────────────────────

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

function GuestIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.25)" />
      <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="rgba(255,255,255,0.18)" />
    </svg>
  )
}

// ─── Star rating selector ───────────────────────────────────────────────────

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

// ─── Review submit form ─────────────────────────────────────────────────────

function ReviewSubmitForm({ onSubmitted }: { onSubmitted?: () => void }) {
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit')
      }
      setStatus('success')
      setText('')
      setStars(0)
      onSubmitted?.()
    } catch (err) {
      console.error('[ReviewMarquee] Review submission failed:', err instanceof Error ? err.message : err)
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.')
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
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Live review card ───────────────────────────────────────────────────────

function LiveReviewCard({ r }: { r: LiveReview }) {
  const hasAvatar = !!r.avatarUrl

  return (
    <div
      style={{
        minWidth: '280px',
        maxWidth: '320px',
        background: 'linear-gradient(145deg, rgba(15,20,36,0.9) 0%, rgba(10,14,28,0.95) 100%)',
        border: '1px solid rgba(212,175,55,0.18)',
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
            border: '2px solid rgba(212,175,55,0.25)',
            background: hasAvatar ? 'rgba(10,14,25,0.8)' : 'linear-gradient(135deg, #1a1f35, #0d1020)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {hasAvatar ? (
            <img src={r.avatarUrl!} alt={`${r.name || 'User'} avatar`} width={40} height={40} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <GuestIcon />
          )}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EAF0' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: '#D4AF37' }}>Verified Builder</div>
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

// ─── Marquee row (scrolling reviews) ────────────────────────────────────────

function MarqueeRow({ reviews, direction, duration }: { reviews: LiveReview[]; direction: 'left' | 'right'; duration: string }) {
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
          <LiveReviewCard key={`${r.id}-${i}`} r={r} />
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
          border: '1px solid rgba(212,175,55,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#C8CCE0',
          margin: '0 0 6px',
        }}
      >
        Be the first to share your experience
      </p>
      <p
        style={{
          fontSize: '13px',
          color: '#4A5070',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        No reviews yet. Try ForjeGames and let others know what you think.
      </p>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ReviewMarquee() {
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([])
  const [loaded, setLoaded] = useState(false)

  function fetchReviews() {
    fetch('/api/reviews')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setLiveReviews(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }

  useEffect(() => { fetchReviews() }, [])

  const hasReviews = liveReviews.length > 0
  // Split reviews into two rows for marquee when we have enough
  const midpoint = Math.ceil(liveReviews.length / 2)
  const topRow = liveReviews.slice(0, midpoint)
  const bottomRow = liveReviews.slice(midpoint)

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
          {hasReviews ? 'Builders are talking.' : 'Leave a review. What will you build?'}
        </h2>
        <p style={{ fontSize: '15px', color: '#3D4560', margin: 0, letterSpacing: '0.2px' }}>
          {hasReviews ? 'Real reviews from real creators.' : 'Be the first to share your experience.'}
        </p>
      </div>

      {/* Reviews or empty state */}
      {loaded && !hasReviews && <EmptyState />}

      {hasReviews && liveReviews.length < 4 && (
        /* Few reviews — show as a centered flex row */
        <div style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '0 24px',
          marginBottom: '24px',
        }}>
          {liveReviews.map(r => (
            <LiveReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {hasReviews && liveReviews.length >= 4 && (
        /* Enough reviews for marquee animation */
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
          <MarqueeRow reviews={topRow} direction="left" duration="32s" />
          {bottomRow.length > 0 && (
            <MarqueeRow reviews={bottomRow} direction="right" duration="38s" />
          )}
        </div>
      )}

      {/* Review submit form */}
      <div style={{ marginTop: '44px' }}>
        <ReviewSubmitForm onSubmitted={fetchReviews} />
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
          Try ForjeGames free
        </Link>
      </div>
    </section>
  )
}
