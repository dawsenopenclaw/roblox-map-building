'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
// Below-the-fold marketing sections are code-split so they don't bloat the
// initial landing-page JS chunk served to the browser. SSR is kept on
// (default) so the rendered HTML still contains the FAQ / comparison /
// testimonial copy for SEO — only the client-side JS is split into separate
// chunks that load lazily as the user scrolls down.
const TestimonialsSection = dynamic(
  () => import('@/components/marketing/TestimonialsSection')
)
const FaqSection = dynamic(() => import('@/components/marketing/FaqSection'))
const ShowcasePreview = dynamic(
  () => import('@/components/marketing/ShowcasePreview')
)
const ComparisonSection = dynamic(
  () => import('@/components/marketing/ComparisonSection')
)
const ProductPreviewGallery = dynamic(
  () => import('@/components/marketing/ProductPreviewGallery')
)
// Footer rendered by marketing layout

/* ─── Scroll reveal hook ─────────────────────────────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const els = container.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

/* ─── Animated counter ───────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Use a low threshold and observe the closest .reveal ancestor so the
    // counter doesn't race with the reveal fade-in. The .reveal parent starts
    // with opacity:0 + translateY(20px); its own IntersectionObserver adds
    // .visible at threshold 0.1. By observing the parent at the same threshold
    // we ensure the animation fires in sync with the reveal transition.
    const revealParent = el.closest('.reveal') as HTMLElement | null
    const observed = revealParent ?? el

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          // Delay the count-up so it starts after the reveal fade-in begins
          const delay = 300
          setTimeout(() => {
            const duration = 1600
            const start = performance.now()
            const tick = (now: number) => {
              const p = Math.min((now - start) / duration, 1)
              const eased = 1 - Math.pow(1 - p, 3)
              setCount(Math.round(eased * target))
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          }, delay)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(observed)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function IconMic({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function IconCube({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function IconSync({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function IconBrain({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z" />
    </svg>
  )
}

function IconArrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconSparkle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M19.07 19.07l.71.71M3 12h1M20 12h1M4.22 19.78l.7-.7M19.07 4.93l.71-.71" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function IconZap({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconShield({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

/* ─── Pricing card ───────────────────────────────────────────────────────── */

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  recommended,
  description,
  href = '/editor',
  royalAccent,
  onCheckout,
  loading,
}: {
  name: string
  price: string
  period: string
  features: string[]
  cta: string
  recommended?: boolean
  description: string
  href?: string
  royalAccent?: boolean
  /** When provided, the CTA becomes a button that runs this callback instead of navigating to `href`. */
  onCheckout?: () => void | Promise<void>
  /** External loading state — disables the button and shows "Redirecting…". */
  loading?: boolean
}) {
  return (
    <div
      className={`reveal flex flex-col rounded-xl p-6 sm:p-8 pricing-card ${recommended ? 'pricing-card-recommended pricing-card-recommended-border' : 'pricing-card-default'} relative overflow-hidden`}
      style={{
        background: recommended
          ? 'linear-gradient(145deg, #0A0F22 0%, #070B1A 100%)'
          : royalAccent
          ? 'linear-gradient(145deg, #0A0918 0%, #060A14 100%)'
          : '#060A14',
        border: recommended
          ? '1px solid rgba(212,175,55,0.3)'
          : royalAccent
          ? '1px solid rgba(124,58,237,0.25)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: recommended
          ? '0 0 60px rgba(212,175,55,0.12), 0 20px 60px rgba(0,0,0,0.6), 0 4px 0 rgba(212,175,55,0.08)'
          : royalAccent
          ? '0 0 40px rgba(124,58,237,0.08), 0 4px 20px rgba(0,0,0,0.25)'
          : '0 4px 20px rgba(0,0,0,0.25)',
        transform: recommended ? 'translateY(-6px)' : undefined,
      }}
    >
      {/* Royal accent glow orb */}
      {royalAccent && !recommended && (
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
        />
      )}
      {/* Recommended glow orb */}
      {recommended && (
        <div
          className="recommended-glow absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />
      )}

      {/* Badge */}
      {recommended && (
        <div className="absolute top-5 right-5">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide badge-shine">
            Most Popular
          </span>
        </div>
      )}

      <div className="relative z-10">
        <p className="text-sm font-semibold mb-1" style={{ color: recommended ? '#D4AF37' : royalAccent ? '#A78BFA' : '#71717A' }}>{name}</p>
        <p className="text-[13px] mb-6" style={{ color: '#52525B' }}>{description}</p>

        <div className="mb-8">
          <div className="flex items-end gap-1.5">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>{price}</span>
            <span className="mb-2 text-sm" style={{ color: '#52525B' }}>{period}</span>
          </div>
        </div>

        <ul className="flex-1 space-y-3.5 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#A1A1AA' }}>
              <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{
                background: recommended ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)',
                color: recommended ? '#D4AF37' : '#52525B',
              }}>
                <IconCheck size={10} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {(() => {
          const ctaClasses = `block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${recommended ? 'pricing-cta-recommended' : 'pricing-cta-default'} ${loading ? 'opacity-60 cursor-wait' : 'hover:-translate-y-0.5'}`
          const ctaStyle = recommended
            ? {
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#09090b',
                boxShadow: '0 0 24px rgba(212,175,55,0.3)',
              }
            : {
                background: 'rgba(255,255,255,0.05)',
                color: '#A1A1AA',
                border: '1px solid rgba(255,255,255,0.08)',
              }
          const label = loading ? 'Redirecting…' : cta
          if (onCheckout) {
            return (
              <button
                type="button"
                onClick={() => void onCheckout()}
                disabled={loading}
                className={ctaClasses}
                style={ctaStyle}
              >
                {label}
              </button>
            )
          }
          return (
            <Link href={href} className={ctaClasses} style={ctaStyle}>
              {label}
            </Link>
          )
        })()}
      </div>
    </div>
  )
}

/* ─── How it works step ──────────────────────────────────────────────────── */

function HowItWorksStep({ n, title, description, delay }: {
  n: string; title: string; description: string; icon?: React.ReactNode; delay: number
}) {
  return (
    <div className={`reveal reveal-delay-${delay} flex flex-col items-center text-center`} style={{ position: 'relative', zIndex: 2 }}>
      <div className="relative mb-6" style={{ width: 96, height: 96 }}>
        {/* Large gold gradient number — the hero element. No icon overlay. */}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(180deg, #FFD966 0%, #D4AF37 50%, rgba(212,175,55,0.35) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.04em',
            // Refined glow on the numbers — tight inner highlight + soft halo
            filter: 'drop-shadow(0 0 1px rgba(255,225,150,0.45)) drop-shadow(0 0 12px rgba(212,175,55,0.25))',
            userSelect: 'none',
          }}
        >
          {n}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: '#71717A' }}>{description}</p>
    </div>
  )
}

/* ─── Hero prompt input — frictionless type-and-go ──────────────────────── */

const HERO_PLACEHOLDERS = [
  'Build a tycoon factory with conveyor belts...',
  'Make a medieval castle with a moat...',
  'Create an obby with moving platforms...',
  'Generate a futuristic space station...',
  'Build a parkour map with checkpoints...',
  'Design a tropical island with palm trees...',
]

function HeroPromptInput() {
  const [prompt, setPrompt] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  // Signed-in state drives the destination: authed users go straight to the
  // editor, guests are routed through sign-up first (they land on /welcome
  // after sign-up, then the welcome flow forwards them to /editor with the
  // preserved prompt query string).
  const { isSignedIn } = useAuth()

  // Animated typing placeholder — only when input is empty + not focused
  useEffect(() => {
    if (focused || prompt.length > 0) return
    const target = HERO_PLACEHOLDERS[placeholderIndex]
    let i = 0
    let typingTimer: ReturnType<typeof setInterval>
    let pauseTimer: ReturnType<typeof setTimeout>

    const typeNext = () => {
      typingTimer = setInterval(() => {
        if (i < target.length) {
          setTypedPlaceholder(target.slice(0, i + 1))
          i++
        } else {
          clearInterval(typingTimer)
          pauseTimer = setTimeout(() => {
            setPlaceholderIndex((prev) => (prev + 1) % HERO_PLACEHOLDERS.length)
            setTypedPlaceholder('')
          }, 2200)
        }
      }, 55)
    }

    typeNext()
    return () => {
      clearInterval(typingTimer)
      clearTimeout(pauseTimer)
    }
  }, [placeholderIndex, focused, prompt.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = prompt.trim()
    // Build the editor target — optionally with the prompt query string that
    // useChat auto-fires when the editor mounts.
    const editorTarget = trimmed
      ? `/editor?prompt=${encodeURIComponent(trimmed)}`
      : '/editor'

    if (isSignedIn) {
      router.push(editorTarget)
      return
    }

    // Guest: force account creation first. Clerk sends the user to /welcome
    // after sign-up (see signUpFallbackRedirectUrl in layout.tsx), and the
    // welcome flow finishes with router.push('/editor') which will carry the
    // prompt through via the redirect_url we set here.
    router.push(`/sign-up?redirect_url=${encodeURIComponent(editorTarget)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative group"
      style={{
        background: focused ? 'rgba(10,14,32,0.85)' : 'rgba(10,14,32,0.6)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${focused ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '6px 6px 6px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s ease-out',
        boxShadow: focused
          ? 'inset 0 1px 0 rgba(255,230,160,0.08), 0 0 0 3px rgba(212,175,55,0.14), 0 0 24px -2px rgba(212,175,55,0.32), 0 0 56px -4px rgba(212,175,55,0.18), 0 0 100px -8px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.4)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Sparkle icon hint */}
      <span
        aria-hidden="true"
        style={{
          color: focused ? '#D4AF37' : '#71717A',
          transition: 'color 0.2s ease-out',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused || prompt ? 'Describe your game...' : typedPlaceholder + (typedPlaceholder.length < HERO_PLACEHOLDERS[placeholderIndex].length ? '|' : '')}
        aria-label="Describe your Roblox game"
        autoComplete="off"
        spellCheck="false"
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#FAFAFA',
          fontSize: 16,
          fontFamily: 'inherit',
          padding: '12px 0',
          fontWeight: 500,
        }}
      />

      <button
        type="submit"
        className="cta-shimmer flex-shrink-0"
        aria-label="Build my game"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
          color: '#09090b',
          border: 'none',
          borderRadius: 10,
          padding: '11px 18px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: 'inset 0 1px 0 rgba(255,230,160,0.4), inset 0 -1px 0 rgba(120,80,0,0.3), 0 0 18px -2px rgba(212,175,55,0.45), 0 0 36px -4px rgba(212,175,55,0.22), 0 0 72px -8px rgba(212,175,55,0.10), 0 4px 16px -2px rgba(0,0,0,0.5)',
          transition: 'transform 0.12s ease-out, box-shadow 0.2s ease-out',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Build
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  )
}

/* ─── Rotating hero text — 3D vertical carousel ─────────────────────────── */

const ROTATING_WORDS = ['Game', 'Map', 'UI', 'Terrain', 'World', 'Scripts', 'Assets']
const ROTATE_INTERVAL_MS = 2400

function RotatingHeroText() {
  // Single-source-of-truth for the active word. React state guarantees the
  // text changes regardless of whether CSS animations are enabled — even
  // users with prefers-reduced-motion will at least see the words cycle.
  // The wheel rotation visual is added on top via a CSS @keyframe that
  // re-fires on every key change (key={index} forces remount).
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % ROTATING_WORDS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  // Find the longest word so the container reserves space (no layout shift)
  const longestWord = ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))
  const currentWord = ROTATING_WORDS[index]

  return (
    <h1
      className="font-bold tracking-tight"
      style={{
        fontSize: 'clamp(3.5rem, 11vw, 8rem)',
        lineHeight: 1.04,
        letterSpacing: '-0.04em',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '0.25em',
      }}
    >
      <span style={{ color: '#FAFAFA' }}>Forge your</span>
      <span
        aria-live="polite"
        aria-label={`your ${currentWord}`}
        style={{
          display: 'inline-block',
          position: 'relative',
          height: '1.15em',
          minWidth: `${longestWord.length}ch`,
          verticalAlign: 'bottom',
          // 3D context — children are NOT flattened, perspective gives depth
          perspective: '800px',
          perspectiveOrigin: '50% 50%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Invisible spacer so width tracks the longest word — no layout jitter */}
        <span aria-hidden="true" style={{ visibility: 'hidden', display: 'inline-block' }}>
          {longestWord}
        </span>

        {/*
          One visible word at a time. `key={index}` forces React to unmount the
          old span and mount a fresh one each cycle, which in turn re-fires the
          CSS @keyframe `forge-word-roll` defined in globals.css. That keyframe
          rolls the new word IN from below; the previous word disappears (it's
          unmounted instantly, which is fine because the new word covers it).
          For a "leaving" effect we render a second span keyed to (index-1)
          that runs the exit keyframe.
        */}
        <span
          key={`leaving-${index}`}
          aria-hidden="true"
          className="forge-word forge-word-leaving"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transformOrigin: '50% 50% -0.55em',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
        >
          {ROTATING_WORDS[(index - 1 + ROTATING_WORDS.length) % ROTATING_WORDS.length]}
        </span>
        <span
          key={`active-${index}`}
          className="forge-word forge-word-entering"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transformOrigin: '50% 50% -0.55em',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
        >
          {currentWord}
        </span>
      </span>
    </h1>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function HomeClient() {
  const pageRef = useReveal()
  // Hero copy is sourced from next-intl so translations load automatically
  // once the active locale's messages bundle is served. The rotating
  // headline (`RotatingHeroText`) stays untranslated for now — swapping
  // words mid-animation across languages is non-trivial and untranslated
  // headlines are intentional brand treatment. See TODO below.
  const tHero = useTranslations('hero')

  // Pricing section on the home page was briefly a 4-tier grid with inline
  // Stripe checkout buttons, but the user asked for a single frictionless
  // CTA that links to /pricing instead. The full plan comparison lives on
  // the degated /pricing page, so the home page just needs a loud hook
  // that routes users there — no inline checkout state needed.

  return (
    <>
      <div
        ref={pageRef}
        className="min-h-screen"
        style={{ background: '#050810', color: '#FAFAFA', fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
      >

        {/* ══════════════════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center text-center overflow-hidden"
          style={{ paddingTop: '14vh', paddingBottom: '8vh', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
        >
          {/* Forge spark CSS animations */}
          <style>{`
            @keyframes forge-drift {
              0%   { transform: translateY(0)   translateX(0)   scale(1);   opacity: 0; }
              10%  { opacity: 1; }
              80%  { opacity: 0.7; }
              100% { transform: translateY(-90px) translateX(var(--drift-x)) scale(0.4); opacity: 0; }
            }
            .forge-spark {
              position: absolute;
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background: #D4AF37;
              box-shadow: 0 0 6px 2px rgba(212,175,55,0.7);
              animation: forge-drift var(--dur) ease-in infinite;
              animation-delay: var(--delay);
              pointer-events: none;
            }
          `}</style>

          {/* Deep radial background — more dramatic gold center glow */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 40%, transparent 70%)',
                'radial-gradient(ellipse 50% 35% at 50% 5%,  rgba(255,184,28,0.08) 0%, transparent 55%)',
                'radial-gradient(ellipse 90% 60% at 50% 0%,  rgba(212,175,55,0.03) 0%, transparent 80%)',
              ].join(', '),
            }} />
            {/* Subtle grid */}
            <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.4 }} />
          </div>

          <div className="relative max-w-4xl mx-auto w-full">

            {/* Forge spark particles — pure CSS, no JS */}
            <div aria-hidden="true" className="absolute left-1/2 top-4 w-0 h-0">
              {/* Spark 1 — drifts left */}
              <span
                className="forge-spark"
                style={{
                  '--drift-x': '-28px',
                  '--dur': '3.2s',
                  '--delay': '0s',
                  left: '-60px',
                  top: '20px',
                } as React.CSSProperties}
              />
              {/* Spark 2 — drifts right */}
              <span
                className="forge-spark"
                style={{
                  '--drift-x': '22px',
                  '--dur': '2.8s',
                  '--delay': '1.1s',
                  left: '40px',
                  top: '30px',
                  background: '#D4AF37',
                  boxShadow: '0 0 6px 2px rgba(212,175,55,0.7)',
                } as React.CSSProperties}
              />
              {/* Spark 3 — drifts center-left */}
              <span
                className="forge-spark"
                style={{
                  '--drift-x': '-8px',
                  '--dur': '3.6s',
                  '--delay': '2.0s',
                  left: '-10px',
                  top: '10px',
                  width: '3px',
                  height: '3px',
                } as React.CSSProperties}
              />
            </div>

            {/* Eyebrow tagline */}
            <p
              className="reveal mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-widest"
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: '#D4AF37',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', display: 'inline-block' }} />
              #1 AI Roblox Game Builder
            </p>

            {/* Rotating Headline */}
            <div className="mb-6">
              <RotatingHeroText />
            </div>

            {/* Subheadline */}
            <p
              className="reveal reveal-delay-2 leading-relaxed max-w-2xl mx-auto mb-8"
              style={{ color: '#71717A', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)' }}
            >
              {tHero('subtitle')}
            </p>

            {/* Inline prompt input — frictionless: type and go */}
            <div className="reveal reveal-delay-3 max-w-2xl mx-auto mb-6">
              <HeroPromptInput />
            </div>

            <p className="reveal reveal-delay-4 text-[13px]" style={{ color: '#52525B' }}>
              No account needed &middot; Free forever &middot; Works with Roblox Studio
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TRUST BAR — animated stats
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-20 px-6 overflow-hidden"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'linear-gradient(to bottom, #050810, #070B1A)',
          }}
        >
          {/* Ambient glow */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(212,175,55,0.025) 0%, transparent 70%)',
          }} />

          <div className="relative max-w-5xl mx-auto">
            <p className="reveal text-center text-[12px] font-semibold uppercase tracking-[0.12em] mb-10" style={{ color: '#3F3F46' }}>
              Trusted by Roblox creators worldwide
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-16 gap-y-8 text-center">
              {[
                { value: 9,   suffix: '',    label: '9 AI Agents',           color: '#D4AF37'  },
                { value: 55,  suffix: '+',   label: 'Roblox asset types',    color: '#60A5FA'  },
                { value: 6,   suffix: '',    label: 'AI models',             color: '#7C3AED'  },
                { value: 10,  suffix: 'min', label: 'Time to first map',     color: '#10B981'  },
              ].map(({ value, suffix, label, color }, i) => (
                <div key={label} className={`reveal reveal-delay-${i + 1} trust-stat`} style={{ borderColor: `${color}22` }}>
                  <p
                    className="text-4xl sm:text-5xl font-bold mb-1 tabular-nums"
                    style={{ color, letterSpacing: '-0.02em' }}
                  >
                    <AnimatedCounter target={value} suffix={suffix} />
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#52525B' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Real-time Studio sync callout */}
            <div className="reveal flex items-center justify-center gap-2 mt-8">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#10B981' }} />
              <span className="text-[12px]" style={{ color: '#3F3F46' }}>Real-time Studio sync — every generation pushes live to Roblox Studio</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HOW IT WORKS — horizontal timeline
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-20 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #070B1A, #050810)' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(212,175,55,0.04) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 15% 50%, rgba(124,58,237,0.04) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 85% 50%, rgba(99,102,241,0.03) 0%, transparent 60%)',
              ].join(', '),
            }} />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                How it works
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Three steps.
                <br />
                <span className="gradient-text">No setup required.</span>
              </h2>
            </div>

            {/* Steps with connecting lines — two segments that stop before each circle */}
            <div className="relative">
              {/*
                The grid is 3 columns. Each column center is at 1/6, 3/6, 5/6 (16.67%, 50%, 83.33%).
                Circle is 64px (4rem) wide, so its half-radius is 2rem.
                We want gaps of about 2.5rem on each side of every circle so the line never touches it.

                Segment 1: from (16.67% + 2.5rem) → (50% - 2.5rem)  — between circles 1 and 2
                Segment 2: from (50% + 2.5rem) → (83.33% - 2.5rem)  — between circles 2 and 3

                Both lines sit at top: 2rem (so they hit the vertical center of the 64px circle).
              */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute step-connector-animated"
                style={{
                  top: '3rem',
                  left: 'calc(16.67% + 3.5rem)',
                  width: 'calc(33.33% - 7rem)',
                  height: 2,
                  borderRadius: 1,
                }}
              />
              <div
                aria-hidden="true"
                className="hidden md:block absolute step-connector-animated"
                style={{
                  top: '3rem',
                  left: 'calc(50% + 3.5rem)',
                  width: 'calc(33.33% - 7rem)',
                  height: 2,
                  borderRadius: 1,
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
                <HowItWorksStep
                  n="1"
                  title="Describe your game"
                  description="Type or speak what you want. Any genre, any mechanic — plain English works. No coding required."
                  icon={<IconMic size={14} />}
                  delay={1}
                />
                <HowItWorksStep
                  n="2"
                  title="AI builds it"
                  description="Watch terrain generate, scripts write themselves, and assets place in real time — streamed live to your Studio."
                  icon={<IconSparkle size={14} />}
                  delay={2}
                />
                <HowItWorksStep
                  n="3"
                  title="Play in Roblox"
                  description="Hit Play in Studio immediately. Iterate, refine, then publish to reach millions of Roblox players."
                  icon={<IconArrow size={14} />}
                  delay={3}
                />
              </div>
            </div>

            {/* CTA below steps */}
            <div className="reveal reveal-delay-4 text-center mt-16">
              <Link
                href="/editor"
                className="cta-ghost-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  color: '#D4AF37',
                }}
              >
                Try it yourself — free
                <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            PRODUCT PREVIEW — real product screenshots (editor, dashboard, pricing)
        ══════════════════════════════════════════════════════════════════ */}
        <ProductPreviewGallery />

        {/* ══════════════════════════════════════════════════════════════════
            BENTO GRID FEATURES
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="py-20 px-6 relative scroll-mt-16"
          style={{ background: '#050810' }}
        >
          {/* Section background */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(212,175,55,0.03) 0%, transparent 70%)',
            }} />
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Section header */}
            <div className="max-w-2xl mb-12">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                Platform
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Not just scripts.
                <br />The whole game.
              </h2>
              <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: '#71717A' }}>
                Other tools stop at code generation. ForjeGames builds terrain, 3D models, UI, economy systems, and scripts — every layer, in one place.
              </p>
            </div>

            {/* Feature grid — clean 2×3 of 6 features, uniform gold accent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* AI Script Writer */}
              <div
                className="reveal bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconBrain size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>AI Script Writer</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Natural language to production Luau — context-aware, not generic snippets. Describe any mechanic and watch it generate live with your map structure already in mind.
                </p>
                <div className="mt-auto pt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
                  <span className="text-[11px]" style={{ color: '#52525B' }}>Live &middot; Context-aware &middot; Luau-native</span>
                </div>
              </div>

              {/* Studio Sync */}
              <div
                className="reveal reveal-delay-1 bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconSync size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Live Studio Sync</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Every generation — terrain, script, asset, UI — pushes directly into your open Roblox Studio place in real time. No copy-paste. No file imports. Just build.
                </p>
                <div className="mt-auto pt-5 flex items-center gap-3 p-3 rounded-lg" style={{
                  background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)',
                }}>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)' }}>
                      <div className="progress-bar-fill h-1.5 rounded-full" style={{ background: '#D4AF37', width: '78%', '--target-width': '78%' } as React.CSSProperties} />
                    </div>
                    <span className="text-[10px]" style={{ color: '#52525B' }}>Syncing to Studio...</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md flex-shrink-0" style={{
                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37',
                  }}>Live</span>
                </div>
              </div>

              {/* Voice Builder */}
              <div
                className="reveal reveal-delay-2 bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconSparkle size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Voice Builder</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Speak your idea — the AI builds it. Terrain, scripts, and assets generated from a single voice command. No other Roblox tool does this.
                </p>
                <div className="mt-auto pt-5 flex flex-wrap gap-2">
                  {['Voice input', 'Map-aware', 'Hands-free'].map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full" style={{
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', color: '#D4AF37',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* 3D Model Generation */}
              <div
                className="reveal reveal-delay-3 bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconCube size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>3D Model Generation</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Text or image to a Roblox-ready 3D mesh with PBR textures — generated by AI and placed directly in your map. Unique assets, not recycled marketplace models.
                </p>
                <div className="mt-auto pt-5 flex items-center justify-center rounded-xl" style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', height: 72,
                }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9" className="mockup-float">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="rgba(212,175,55,0.2)" />
                    <line x1="12" y1="22.08" x2="12" y2="12" stroke="rgba(212,175,55,0.2)" />
                  </svg>
                </div>
              </div>

              {/* Templates */}
              <div
                className="reveal reveal-delay-4 bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconZap size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>50+ Game Templates</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Tycoons, simulators, RPGs, obby, shooters — fully wired with economy, UI, and scripts. Launch in minutes, not months.
                </p>
                <div className="mt-auto pt-5 flex flex-wrap gap-2">
                  {['Tycoon', 'Simulator', 'RPG', 'Obby', '+46 more'].map((genre, i) => (
                    <span key={genre} className="text-[11px] px-2.5 py-1 rounded-full" style={{
                      background: i === 4 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i === 4 ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.06)'}`,
                      color: i === 4 ? '#D4AF37' : '#52525B',
                    }}>{genre}</span>
                  ))}
                </div>
              </div>

              {/* Safe & Professional */}
              <div
                className="reveal reveal-delay-5 bento-card rounded-xl p-6 sm:p-8 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 300,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.12)'
                  el.style.borderColor = 'rgba(212,175,55,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconShield size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Safe by Default</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  COPPA-compliant with parental controls, content filtering, and zero data selling. Every generated script ships with server authority and anti-cheat — production-ready from day one.
                </p>
                <div className="mt-auto pt-5 flex gap-6">
                  {[
                    { value: '12s',    label: 'Avg gen' },
                    { value: 'COPPA',  label: 'Compliant' },
                    { value: '0',      label: 'Data sold' },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <p className="text-xl font-bold" style={{ color: '#D4AF37' }}>{value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#52525B' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            COMPARISON — ForjeGames vs Competitors ranking table
        ══════════════════════════════════════════════════════════════════ */}
        <ComparisonSection />

        {/* ══════════════════════════════════════════════════════════════════
            SHOWCASE
        ══════════════════════════════════════════════════════════════════ */}
        <ShowcasePreview />

        {/* ══════════════════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ══════════════════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-20 px-6 relative overflow-hidden scroll-mt-16"
          style={{ background: 'linear-gradient(to bottom, #070B1A, #050810)' }}
        >
          {/* Glow behind pricing */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 600, height: 400,
              background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 70%)',
            }} />
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Single frictionless CTA card — the full tier comparison
                lives on the degated /pricing page so we don't duplicate it
                on the home. One hook, one click, straight to plans. */}
            <div
              className="reveal rounded-3xl px-8 sm:px-14 py-14 sm:py-16 text-center relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(10,15,34,0.9) 0%, rgba(7,11,26,0.9) 100%)',
                border: '1px solid rgba(212,175,55,0.25)',
                boxShadow:
                  '0 0 80px rgba(212,175,55,0.08), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Ambient gold orb */}
              <div
                aria-hidden="true"
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 55%)',
                  filter: 'blur(20px)',
                }}
              />

              <div className="relative z-10">
                <p
                  className="reveal text-[12px] font-semibold uppercase tracking-[0.14em] mb-5"
                  style={{ color: 'rgba(212,175,55,0.7)' }}
                >
                  Ready to build?
                </p>
                <h2
                  className="reveal reveal-delay-1 font-bold tracking-tight mb-6"
                  style={{
                    fontSize: 'clamp(2rem, 5.5vw, 3.75rem)',
                    lineHeight: 1.08,
                    letterSpacing: '-0.02em',
                    color: '#FAFAFA',
                  }}
                >
                  Wanna generate a game?
                  <br />
                  <span className="gradient-text">Look here.</span>
                </h2>
                <p
                  className="reveal reveal-delay-2 text-base sm:text-lg mb-10 mx-auto max-w-xl"
                  style={{ color: '#A1A1AA' }}
                >
                  Plans start at $0. Upgrades take one click. Custom and
                  enterprise options too.
                </p>

                <Link
                  href="/pricing"
                  className="reveal reveal-delay-3 inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base sm:text-lg font-bold transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background:
                      'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
                    color: '#0A0810',
                    boxShadow:
                      '0 12px 40px rgba(212,175,55,0.35), 0 0 0 1px rgba(212,175,55,0.4)',
                  }}
                >
                  View plans &amp; pricing
                  <span aria-hidden="true">→</span>
                </Link>

                <div className="reveal reveal-delay-4 mt-8 flex items-center justify-center gap-4 flex-wrap">
                  {[
                    { icon: <IconCheck size={12} />, label: 'Cancel anytime' },
                    { icon: <IconCheck size={12} />, label: 'No credit card for Free' },
                    { icon: <IconShield size={12} />, label: 'Secure payments' },
                  ].map(({ icon, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-[12px]"
                      style={{ color: '#71717A' }}
                    >
                      <span style={{ color: '#52525B' }}>{icon}</span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════════ */}
        <FaqSection />

        {/* ══════════════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-32 px-6 overflow-hidden"
          style={{ background: '#050810' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,175,55,0.07) 0%, transparent 60%)',
            }} />
            <div className="absolute top-0 inset-x-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 30%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.08) 70%, transparent 100%)' }} />
          </div>

          <div className="relative max-w-2xl mx-auto text-center">
            <h2
              className="reveal font-bold tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.4rem, 7vw, 5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: '#FAFAFA',
              }}
            >
              Ready to forge
              <br />
              <span className="gradient-text">your game?</span>
            </h2>

            <div className="reveal reveal-delay-1">
              <Link
                href="/editor"
                className="cta-primary cta-shimmer inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 48px rgba(212,175,55,0.4), 0 8px 32px rgba(0,0,0,0.5)',
                  letterSpacing: '0.01em',
                }}
              >
                Start Building Free
                <IconArrow size={16} />
              </Link>
            </div>

            <p className="reveal reveal-delay-2 mt-8 text-[13px]" style={{ color: '#52525B' }}>
              No account needed &middot; Free forever &middot; Works with Roblox Studio
            </p>
          </div>
        </section>

      </div>
    </>
  )
}
