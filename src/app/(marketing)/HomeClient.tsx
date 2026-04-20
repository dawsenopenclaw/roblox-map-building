'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
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
        className="cta-shimmer flex-shrink-0 hover:brightness-110 active:scale-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
          transition: 'transform 0.12s ease-out, box-shadow 0.2s ease-out, filter 0.15s ease',
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

/* ─── Agent Showcase Grid — filterable agent cards ──────────────────────── */

const SHOWCASE_AGENTS = [
  // Build — Featured
  { name: 'Terrain Generator', desc: 'Mountains, rivers, biomes from text', cat: 'build', icon: '▲', color: '#10B981', tier: 'FREE' },
  { name: 'City Builder', desc: 'Full city districts with roads & zoning', cat: 'build', icon: '🏙️', color: '#60A5FA', tier: 'HOBBY' },
  { name: 'NPC Creator', desc: 'Patrol AI, dialogue trees, quest givers', cat: 'build', icon: '👤', color: '#F59E0B', tier: 'FREE' },
  { name: 'Luau Script Writer', desc: 'Production Luau with security best practices', cat: 'build', icon: '◆', color: '#818CF8', tier: 'FREE' },
  { name: 'Combat System', desc: 'Hitbox, damage, combos, blocking, health', cat: 'build', icon: '⚔️', color: '#EF4444', tier: 'HOBBY' },
  { name: 'Vehicle Builder', desc: 'Cars, boats, planes with physics', cat: 'build', icon: '🚗', color: '#F97316', tier: 'HOBBY' },
  { name: 'Obby Architect', desc: 'Obstacle courses with checkpoints & difficulty', cat: 'build', icon: '🏃', color: '#14B8A6', tier: 'FREE' },
  { name: 'Tycoon Builder', desc: 'Droppers, conveyors, upgrades, rebirths', cat: 'build', icon: '🏭', color: '#D4AF37', tier: 'HOBBY' },
  { name: 'Horror Designer', desc: 'Jumpscares, dark lighting, chase AI', cat: 'build', icon: '👻', color: '#A855F7', tier: 'HOBBY' },
  { name: 'Pet System', desc: 'Hatching, rarity tiers, evolution, trading', cat: 'build', icon: '🐾', color: '#EC4899', tier: 'HOBBY' },
  { name: 'Dungeon Generator', desc: 'Procedural rooms, traps, boss encounters', cat: 'build', icon: '🏰', color: '#6366F1', tier: 'HOBBY' },
  { name: 'Simulator Engine', desc: 'Click mechanics, rebirths, world progression', cat: 'build', icon: '🔄', color: '#22D3EE', tier: 'HOBBY' },
  { name: 'Tower Defense', desc: 'Paths, waves, tower placement, upgrades', cat: 'build', icon: '🗼', color: '#84CC16', tier: 'HOBBY' },
  { name: 'Mesh Generator', desc: '3D models from text via Meshy AI', cat: 'build', icon: '🧊', color: '#7C3AED', tier: 'CREATOR' },
  { name: 'UI Designer', desc: 'HUDs, shops, inventories, leaderboards', cat: 'build', icon: '🖼️', color: '#0EA5E9', tier: 'FREE' },
  { name: 'Particle FX Artist', desc: 'Fire, smoke, magic, ambient particles', cat: 'build', icon: '✨', color: '#F59E0B', tier: 'FREE' },
  { name: 'Lighting Expert', desc: 'Atmosphere, PointLights, neon, shadows', cat: 'build', icon: '💡', color: '#FBBF24', tier: 'FREE' },
  { name: 'Weather System', desc: 'Rain, snow, fog, day/night cycles', cat: 'build', icon: '🌧️', color: '#64748B', tier: 'FREE' },
  { name: 'Story Writer', desc: 'Narratives, cutscenes, branching choices', cat: 'build', icon: '📖', color: '#C084FC', tier: 'CREATOR' },
  { name: 'Magic System', desc: 'Spells, mana, elements, cooldowns', cat: 'build', icon: '🔮', color: '#A78BFA', tier: 'HOBBY' },
  { name: 'Boss Builder', desc: 'Attack patterns, phases, health bars', cat: 'build', icon: '🐉', color: '#DC2626', tier: 'HOBBY' },
  { name: 'Crafting System', desc: 'Recipes, workbenches, material gathering', cat: 'build', icon: '🔨', color: '#B45309', tier: 'HOBBY' },
  { name: 'Racing Track', desc: 'Tracks, laps, boost pads, leaderboards', cat: 'build', icon: '🏎️', color: '#059669', tier: 'FREE' },
  { name: 'DataStore Manager', desc: 'Save systems, session lock, migration', cat: 'build', icon: '💾', color: '#3B82F6', tier: 'FREE' },
  // Analyze
  { name: 'Performance Auditor', desc: 'FPS drops, memory leaks, server lag', cat: 'analyze', icon: '📊', color: '#10B981', tier: 'HOBBY' },
  { name: 'Code Reviewer', desc: 'Best practices, anti-patterns, security', cat: 'analyze', icon: '🔍', color: '#6366F1', tier: 'FREE' },
  { name: 'Exploit Detector', desc: 'RemoteEvent abuse, speed hacks, noclip', cat: 'analyze', icon: '🛡️', color: '#EF4444', tier: 'HOBBY' },
  { name: 'Game DNA Scanner', desc: 'Genre analysis, mechanic breakdown', cat: 'analyze', icon: '🧬', color: '#8B5CF6', tier: 'HOBBY' },
  { name: 'Mobile Optimizer', desc: 'Touch controls, FPS, UI scaling', cat: 'analyze', icon: '📱', color: '#0EA5E9', tier: 'HOBBY' },
  { name: 'Retention Analyzer', desc: 'Session length, hooks, engagement loops', cat: 'analyze', icon: '📈', color: '#F59E0B', tier: 'CREATOR' },
  // Optimize
  { name: 'Render Optimizer', desc: 'Draw calls, LOD, streaming, culling', cat: 'optimize', icon: '⚡', color: '#FBBF24', tier: 'HOBBY' },
  { name: 'Network Optimizer', desc: 'Bandwidth, batching, replication', cat: 'optimize', icon: '🌐', color: '#22D3EE', tier: 'HOBBY' },
  { name: 'Script Optimizer', desc: 'Loop perf, table pooling, benchmarks', cat: 'optimize', icon: '🚀', color: '#10B981', tier: 'HOBBY' },
  { name: 'Part Count Optimizer', desc: 'Union, CSG, mesh replacement', cat: 'optimize', icon: '📐', color: '#F97316', tier: 'HOBBY' },
  // Growth
  { name: 'Trend Finder', desc: 'Trending genres, mechanics, viral hooks', cat: 'growth', icon: '🔥', color: '#EF4444', tier: 'CREATOR' },
  { name: 'TikTok Advisor', desc: 'Viral clips, hooks, trending sounds', cat: 'growth', icon: '🎵', color: '#EC4899', tier: 'FREE' },
  { name: 'YouTube Advisor', desc: 'Titles, thumbnails, upload strategy', cat: 'growth', icon: '▶️', color: '#DC2626', tier: 'FREE' },
  { name: 'GamePass Advisor', desc: 'Pricing, bundles, conversion optimization', cat: 'growth', icon: '💰', color: '#D4AF37', tier: 'HOBBY' },
  { name: 'A/B Tester', desc: 'Feature flags, variants, metric tracking', cat: 'growth', icon: '🧪', color: '#7C3AED', tier: 'CREATOR' },
  { name: 'Event Planner', desc: 'Seasonal updates, limited-time modes', cat: 'growth', icon: '🎉', color: '#F59E0B', tier: 'HOBBY' },
] as const

const AGENT_CATEGORIES = [
  { key: 'all', label: 'All Agents', count: 144 },
  { key: 'build', label: 'Build', count: 80 },
  { key: 'analyze', label: 'Analyze', count: 20 },
  { key: 'optimize', label: 'Optimize', count: 16 },
  { key: 'growth', label: 'Growth', count: 28 },
] as const

function AgentShowcaseGrid() {
  const [filter, setFilter] = useState<string>('all')
  const [showAll, setShowAll] = useState(false)

  const filtered = filter === 'all'
    ? SHOWCASE_AGENTS
    : SHOWCASE_AGENTS.filter(a => a.cat === filter)

  const displayed = showAll ? filtered : filtered.slice(0, 20)

  return (
    <div>
      {/* Filter tabs */}
      <div className="reveal reveal-delay-2 flex flex-wrap justify-center gap-2 mb-10">
        {AGENT_CATEGORIES.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setShowAll(false) }}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
            style={filter === key ? {
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#D4AF37',
              boxShadow: '0 0 12px rgba(212,175,55,0.15)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#71717A',
            }}
            onMouseEnter={(e) => { if (filter !== key) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A1A1AA'; } }}
            onMouseLeave={(e) => { if (filter !== key) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#71717A'; } }}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {displayed.map((agent, i) => (
          <div
            key={agent.name}
            className="group relative rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-default"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${agent.color}10`
              e.currentTarget.style.borderColor = `${agent.color}33`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0 mt-0.5">{agent.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#FAFAFA' }}>{agent.name}</p>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: agent.tier === 'FREE' ? 'rgba(16,185,129,0.15)' : agent.tier === 'HOBBY' ? 'rgba(96,165,250,0.15)' : 'rgba(212,175,55,0.15)',
                      color: agent.tier === 'FREE' ? '#10B981' : agent.tier === 'HOBBY' ? '#60A5FA' : '#D4AF37',
                    }}
                  >
                    {agent.tier}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: '#52525B' }}>{agent.desc}</p>
              </div>
            </div>

            {/* Chainable indicator */}
            <div className="mt-2 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
              <span className="text-[10px]" style={{ color: '#3F3F46' }}>Chainable</span>
            </div>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {filtered.length > 20 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: '#D4AF37',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(212,175,55,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {showAll ? 'Show less' : `Show all ${filtered.length} agents`}
          </button>
        </div>
      )}

    </div>
  )
}

/* ─── AI Demo Chat Bubbles — iMessage-style animated conversation ────────── */

const DEMO_MESSAGES = [
  { role: 'user' as const, text: 'Build me a medieval castle with a moat and drawbridge' },
  { role: 'ai' as const, text: 'On it! Selecting best agents for this build...' },
  { role: 'agent' as const, label: 'Terrain Agent', text: 'Generating castle foundation — 120×80 stud footprint with moat channel' },
  { role: 'agent' as const, label: 'Build Agent', text: 'Placing stone walls, towers (4), gatehouse with working drawbridge' },
  { role: 'agent' as const, label: 'Script Agent', text: 'Writing drawbridge mechanism — ProximityPrompt to lower/raise' },
  { role: 'agent' as const, label: 'Lighting Agent', text: 'Adding torch PointLights in warm amber, moonlight atmosphere' },
  { role: 'ai' as const, text: 'Done! 847 parts placed, 3 scripts written. Hit Play to explore your castle.' },
]

function AIDemoChatBubbles() {
  const [visibleCount, setVisibleCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          // Stagger messages in
          DEMO_MESSAGES.forEach((_, i) => {
            setTimeout(() => setVisibleCount(i + 1), 600 + i * 900)
          })
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-3 min-h-[320px]">
      {DEMO_MESSAGES.map((msg, i) => {
        if (i >= visibleCount) return null
        const isUser = msg.role === 'user'
        const isAgent = msg.role === 'agent'
        const isLast = i === visibleCount - 1

        return (
          <div
            key={i}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{
              animation: 'idm-bubble-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              opacity: 0,
            }}
          >
            <div
              className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
              style={isUser ? {
                background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
                color: '#050810',
                fontWeight: 600,
                borderBottomRightRadius: 6,
                boxShadow: '0 2px 12px rgba(212,175,55,0.3)',
              } : isAgent ? {
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#C4B5FD',
                borderBottomLeftRadius: 6,
              } : {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E4E4E7',
                borderBottomLeftRadius: 6,
              }}
            >
              {isAgent && (
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#818CF8' }}>
                  {msg.label}
                </span>
              )}
              {msg.text}
            </div>
          </div>
        )
      })}

      {/* Typing indicator shown between messages */}
      {visibleCount > 0 && visibleCount < DEMO_MESSAGES.length && (
        <div className="flex justify-start">
          <div
            className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottomLeftRadius: 6,
            }}
          >
            <span className="idm-typing-dot" style={{ animationDelay: '0ms' }} />
            <span className="idm-typing-dot" style={{ animationDelay: '150ms' }} />
            <span className="idm-typing-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── AI Build Preview — animated progress visualization ────────────────── */

function AIBuildPreview() {
  const [progress, setProgress] = useState(0)
  const [activeAgent, setActiveAgent] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const agents = [
    { name: 'Terrain Agent', color: '#10B981', icon: '▲' },
    { name: 'Build Agent', color: '#D4AF37', icon: '■' },
    { name: 'Script Agent', color: '#818CF8', icon: '◆' },
    { name: 'Lighting Agent', color: '#F59E0B', icon: '●' },
  ]

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          let p = 0
          const agentNames = agents.map(a => a.name)
          const interval = setInterval(() => {
            p += 1
            setProgress(p)
            setActiveAgent(agentNames[Math.min(Math.floor(p / 25), agentNames.length - 1)])
            if (p >= 100) clearInterval(interval)
          }, 80)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col gap-5">
      {/* Fake viewport */}
      <div
        className="flex-1 rounded-xl relative overflow-hidden min-h-[200px]"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Animated grid floor */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,${0.03 + progress * 0.001}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,${0.03 + progress * 0.001}) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          transform: `perspective(500px) rotateX(45deg) scale(2)`,
          transformOrigin: 'center bottom',
        }} />

        {/* Build blocks appearing */}
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <div className="flex items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const h = [40, 65, 55, 80, 45, 70, 90, 50, 75, 60, 85, 48][i]
              const visible = progress > (i * 8)
              const agentColor = agents[Math.min(Math.floor(i / 3), agents.length - 1)].color
              return (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: 16,
                    height: visible ? h : 0,
                    background: `linear-gradient(to top, ${agentColor}88, ${agentColor}44)`,
                    border: visible ? `1px solid ${agentColor}66` : 'none',
                    transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: visible ? `0 0 12px ${agentColor}33` : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Part counter */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold" style={{
          background: 'rgba(0,0,0,0.6)',
          color: '#D4AF37',
          border: '1px solid rgba(212,175,55,0.2)',
        }}>
          {Math.round(progress * 8.47)} parts
        </div>
      </div>

      {/* Agent status bars */}
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent) => {
          const isActive = activeAgent === agent.name
          const isDone = agents.indexOf(agent) < agents.findIndex(a => a.name === activeAgent)
          return (
            <div
              key={agent.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
              style={{
                background: isActive ? `${agent.color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? `${agent.color}33` : 'rgba(255,255,255,0.05)'}`,
                color: isActive ? agent.color : isDone ? '#3F3F46' : '#52525B',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ fontSize: 10 }}>{agent.icon}</span>
              <span className="font-medium truncate">{agent.name}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full ml-auto animate-pulse" style={{ background: agent.color }} />}
              {isDone && <span className="ml-auto text-[10px]">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4AF37, #10B981)',
            transition: 'width 0.15s linear',
            boxShadow: '0 0 8px rgba(212,175,55,0.4)',
          }}
        />
      </div>
    </div>
  )
}

/* ─── Rotating hero text — 3D vertical ring carousel ─────────────────────── */

const ROTATING_WORDS = ['Game', 'Map', 'UI', 'Terrain', 'World', 'Scripts', 'Assets']
const ROTATE_INTERVAL_MS = 2200

/**
 * A true ferris-wheel text carousel. All N words sit at fixed positions
 * around a vertical (X-axis) 3D ring. On every tick we rotate the whole
 * ring by (360/N)° so the next word arrives at the front. The word facing
 * the camera gets full opacity + sharp text; words on the back half are
 * hidden by backface-visibility. Because every word is positioned as a
 * ring node, the motion is continuous circular vertical — not a
 * slide-up-and-disappear.
 *
 * Layout math (radius):
 *   - Each word ~1em tall
 *   - Equal spacing of 360/N° between nodes
 *   - To avoid adjacent nodes clipping, we use radius = 1em / (2 * tan(π/N))
 *     which gives the circumscribed circle of a regular N-gon with side 1em.
 *     For N=7 that's ~1.04em. We round up to 1.2em for breathing room.
 *
 * Reduced motion: we keep the ring static and just swap the visible word
 * (display:block on the active node, display:none elsewhere). The
 * prefers-reduced-motion branch is handled in globals.css.
 */
function RotatingHeroText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % ROTATING_WORDS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const count = ROTATING_WORDS.length
  const stepDeg = 360 / count
  // Rotate the whole ring so the active word sits at angle 0 (front-facing).
  // Positive ringRotation combined with negative per-word angles below makes
  // the ring roll "up and over the top": the outgoing word lifts up and
  // exits over the top of the container while the next word rises into the
  // front position from below. This is the direction the product asked for
  // ("one goes up and out, new one comes from under and comes in").

  const longestWord = ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))
  const currentWord = ROTATING_WORDS[index]
  const ringRotation = index * stepDeg

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
          // Reserve width for the longest word so the line doesn't reflow
          // as the ring spins. Tiny extra padding to keep glow clear of edges.
          minWidth: `${longestWord.length + 0.5}ch`,
          verticalAlign: 'bottom',
          // 3D context for the ring
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Invisible spacer so width stays locked to the longest word */}
        <span
          aria-hidden="true"
          style={{
            visibility: 'hidden',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          {longestWord}
        </span>

        {/* The ring itself — rotates on X axis. Each child word is
            positioned at a fixed angle around the circumference via
            rotateX(angle) translateZ(radius). */}
        <span
          className="forge-ring"
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${ringRotation}deg)`,
            transition: 'transform 0.9s cubic-bezier(0.32, 0.72, 0.24, 1)',
            willChange: 'transform',
          }}
        >
          {ROTATING_WORDS.map((word, i) => {
            // Per-word angle is NEGATED so that, combined with the positive
            // ringRotation, the outgoing word exits over the top and the
            // incoming word rises from below. Total on-screen angle for
            // word i = ringRotation + (-i * stepDeg) = (index - i) * stepDeg,
            // which is 0 for the active word, negative (below center) for
            // the next word, and positive (above center) for the previous.
            const angle = -i * stepDeg
            const isActive = i === index
            return (
              <span
                key={word}
                className={`forge-word${isActive ? ' forge-word-active' : ''}`}
                aria-hidden={isActive ? undefined : 'true'}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  // Position this node on the ring circumference. Radius
                  // scales with font-size via `em` so the wheel stays
                  // proportional across breakpoints. height: 100% +
                  // flex-center guarantee the element's transform-origin
                  // (50% 50%) is the RING's center so the wheel pivots
                  // cleanly instead of wobbling off its baseline.
                  transform: `rotateX(${angle}deg) translateZ(1.2em)`,
                  transformOrigin: '50% 50%',
                  backfaceVisibility: 'hidden',
                  // Hide nodes that are > 90° off-axis so we don't show
                  // mirrored/upside-down words peeking from the sides when
                  // the browser ignores backface-visibility (Safari bug).
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.6s ease-out',
                  willChange: 'transform, opacity',
                }}
              >
                {word}
              </span>
            )
          })}
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
          style={{ paddingTop: '16vh', paddingBottom: '10vh', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
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

          {/* Aurora animated background — organic drifting gradient orbs */}
          <div aria-hidden="true" className="aurora-hero" />

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
            <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.3 }} />
          </div>

          <motion.div
            className="relative max-w-4xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >

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
            <motion.p
              className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-widest"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: '#D4AF37',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', display: 'inline-block' }} />
              #1 AI Roblox Game Builder
            </motion.p>

            {/* Rotating Headline */}
            <motion.div
              className="mb-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <RotatingHeroText />
            </motion.div>

            {/* Subheadline */}
            <motion.p
              className="leading-relaxed max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: '#71717A', fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }}
            >
              {tHero('subtitle')}
            </motion.p>

            {/* Inline prompt input — frictionless: type and go */}
            <motion.div
              className="max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroPromptInput />
            </motion.div>

            <motion.p
              className="text-[13px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              style={{ color: '#52525B' }}
            >
              No account needed &middot; Free forever &middot; Works with Roblox Studio
            </motion.p>

            {/* Model transparency strip */}
            <motion.p
              className="mt-5 text-[11px] uppercase tracking-[0.14em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              style={{ color: '#3F3F46' }}
            >
              Powered by{' '}
              <span style={{ color: '#A1A1AA' }}>Claude Sonnet 4.6</span>
              <span className="mx-2 opacity-40">·</span>
              <span style={{ color: '#A1A1AA' }}>GPT-5</span>
              <span className="mx-2 opacity-40">·</span>
              <span style={{ color: '#A1A1AA' }}>Flux</span>
              <span className="mx-2 opacity-40">·</span>
              <span style={{ color: '#A1A1AA' }}>Meshy 3D</span>
            </motion.p>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            AGENT ARSENAL — 2nd section, the flex
        ══════════════════════════════════════════════════════════════════ */}

        <section
          className="relative py-28 px-6 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #050810, #0A0F1E)' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)',
                'radial-gradient(ellipse 40% 60% at 20% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)',
                'radial-gradient(ellipse 40% 60% at 80% 50%, rgba(239,68,68,0.04) 0%, transparent 60%)',
                'radial-gradient(ellipse 80% 30% at 50% 100%, rgba(16,185,129,0.06) 0%, transparent 60%)',
              ].join(', '),
            }} />
          </div>

          <style>{`
            @keyframes arsenal-pulse {
              0%, 100% { transform: scale(1); opacity: 0.15; }
              50% { transform: scale(1.3); opacity: 0; }
            }
            .arsenal-ring { animation: arsenal-pulse 3s ease-in-out infinite; }
            .arsenal-ring-2 { animation: arsenal-pulse 3s ease-in-out infinite; animation-delay: 1s; }
            .arsenal-ring-3 { animation: arsenal-pulse 3s ease-in-out infinite; animation-delay: 2s; }
          `}</style>

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.div className="mb-6 relative inline-block"
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                  <div className="arsenal-ring absolute w-40 h-40 rounded-full border-2" style={{ borderColor: 'rgba(212,175,55,0.2)' }} />
                  <div className="arsenal-ring-2 absolute w-56 h-56 rounded-full border" style={{ borderColor: 'rgba(212,175,55,0.1)' }} />
                  <div className="arsenal-ring-3 absolute w-72 h-72 rounded-full border" style={{ borderColor: 'rgba(212,175,55,0.05)' }} />
                </div>
                <span className="font-black tabular-nums" style={{
                  fontSize: 'clamp(5rem, 15vw, 10rem)', lineHeight: 1, letterSpacing: '-0.04em',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 40%, #D4AF37 60%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 40px rgba(212,175,55,0.3))',
                }}>
                  <AnimatedCounter target={144} />
                </span>
              </motion.div>

              <motion.p className="text-[12px] font-bold uppercase tracking-[0.2em] mb-6"
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }} style={{ color: '#D4AF37' }}>
                AI Agents &amp; Counting
              </motion.p>

              <motion.h2 className="font-bold tracking-tight mb-6"
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FAFAFA' }}>
                The largest AI agent army<br />
                <span className="gradient-text">ever built for Roblox.</span>
              </motion.h2>

              <motion.p className="max-w-2xl mx-auto mb-4"
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.55 }}
                style={{ color: '#71717A', fontSize: '1.05rem', lineHeight: 1.7 }}>
                Every agent is a specialist. Chain them together and they build entire games —
                terrain, scripts, UI, lighting, NPCs, combat, economy — all from one prompt.
              </motion.p>

              <motion.div className="flex flex-wrap justify-center gap-3 text-[13px] font-semibold mb-2"
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}>
                {[
                  { label: 'Build', count: 80, color: '#D4AF37' },
                  { label: 'Analyze', count: 20, color: '#818CF8' },
                  { label: 'Optimize', count: 16, color: '#10B981' },
                  { label: 'Growth', count: 28, color: '#F59E0B' },
                ].map(({ label, count, color }) => (
                  <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                    background: `${color}10`, border: `1px solid ${color}25`, color,
                  }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {count} {label}
                  </span>
                ))}
              </motion.div>
            </div>

            <AgentShowcaseGrid />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            COMPETITORS — 3rd section, we destroy them
        ══════════════════════════════════════════════════════════════════ */}

        <section
          className="relative py-24 px-6 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #0A0F1E, #050810)' }}
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                No contest
              </p>
              <h2 className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}>
                Built different.{' '}
                <span className="gradient-text">Not even close.</span>
              </h2>
            </div>

            <ComparisonSection />

            {/* Quick stat flex */}
            <div className="reveal mt-10 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                {[
                  { name: 'ForjeGames', agents: '144+', color: '#D4AF37', bold: true },
                  { name: 'Ropilot', agents: '3', color: '#52525B', bold: false },
                  { name: 'Rebirth', agents: '5', color: '#52525B', bold: false },
                  { name: 'Lemonade', agents: '2', color: '#52525B', bold: false },
                  { name: 'ForgeGUI', agents: '1', color: '#52525B', bold: false },
                ].map(({ name, agents, color, bold }) => (
                  <div key={name}>
                    <p className={`text-2xl ${bold ? 'font-black' : 'font-semibold'} tabular-nums mb-1`} style={{ color }}>{agents}</p>
                    <p className="text-[11px]" style={{ color: bold ? '#A1A1AA' : '#3F3F46' }}>{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            AI LIVE DEMO — 4th, proof it works
        ══════════════════════════════════════════════════════════════════ */}

        <section
          className="relative py-28 px-6 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #050810, #0A0F1E)' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)',
              'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(212,175,55,0.05) 0%, transparent 70%)',
            ].join(', '),
          }} />

          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                See it in action
              </p>
              <h2 className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}>
                You talk.{' '}
                <span className="gradient-text">AI builds.</span>
              </h2>
            </div>

            <div className="reveal reveal-delay-2 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="rounded-2xl p-1" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(212,175,55,0.3))' }}>
                <div className="rounded-[14px] p-6 h-full" style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
                      <span className="text-xs font-bold" style={{ color: '#050810' }}>F</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>ForjeGames AI</p>
                      <p className="text-[11px]" style={{ color: '#10B981' }}>Online — 144 agents available</p>
                    </div>
                  </div>
                  <AIDemoChatBubbles />
                </div>
              </div>
              <div className="rounded-2xl p-1" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(16,185,129,0.3))' }}>
                <div className="rounded-[14px] p-6 h-full flex flex-col" style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
                      <span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
                      <span className="w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
                    </div>
                    <p className="text-xs font-medium ml-2" style={{ color: '#52525B' }}>Roblox Studio — Live Preview</p>
                  </div>
                  <AIBuildPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HOW IT WORKS — 5th, 3 steps friction removal
        ══════════════════════════════════════════════════════════════════ */}

        <section
          className="py-28 px-6 relative overflow-hidden"
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
            BENTO GRID FEATURES — 6th, the detail
        ══════════════════════════════════════════════════════════════════ */}

        <section
          id="features"
          className="py-28 px-6 relative scroll-mt-16"
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
            <div className="max-w-2xl mb-16">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                Platform
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-6"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Not just scripts.
                <br />The whole game.
              </h2>
              <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: '#71717A' }}>
                Other tools stop at code generation. ForjeGames builds terrain, 3D models, UI, economy systems, and scripts — every layer, in one place.
              </p>
            </div>

            {/* Asymmetric bento grid — hero feature spans 2 cols, trust anchor spans full width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* AI Script Writer — hero feature, spans 2 cols */}
              <div
                className="reveal bento-card rounded-2xl p-7 sm:p-9 flex flex-col lg:col-span-2"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 280,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className="flex-1">
                    <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                      <IconBrain size={22} />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>AI Script Writer</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                      Natural language to production Luau — context-aware, not generic snippets. Describe any mechanic and watch it generate live with your map structure already in mind.
                    </p>
                  </div>
                  {/* Code preview mockup — only visible on wide layout */}
                  <div className="hidden sm:flex flex-col gap-2 p-4 rounded-xl flex-shrink-0 w-64" style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)',
                    fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, color: '#52525B',
                  }}>
                    <span><span style={{ color: '#7C3AED' }}>local</span> <span style={{ color: '#D4AF37' }}>coins</span> = player:WaitForChild(<span style={{ color: '#22C55E' }}>&quot;leaderstats&quot;</span>)</span>
                    <span><span style={{ color: '#7C3AED' }}>function</span> <span style={{ color: '#60A5FA' }}>onTouch</span>(hit)</span>
                    <span>  coins.Value = coins.Value + <span style={{ color: '#D4AF37' }}>10</span></span>
                    <span><span style={{ color: '#7C3AED' }}>end</span></span>
                  </div>
                </div>
                <div className="mt-auto pt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
                  <span className="text-[11px]" style={{ color: '#52525B' }}>Live &middot; Context-aware &middot; Luau-native</span>
                </div>
              </div>

              {/* Studio Sync */}
              <div
                className="reveal reveal-delay-1 bento-card rounded-2xl p-7 sm:p-9 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 280,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconSync size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>Live Studio Sync</h3>
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
                className="reveal reveal-delay-2 bento-card rounded-2xl p-7 sm:p-9 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconSparkle size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>Voice Builder</h3>
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
                className="reveal reveal-delay-3 bento-card rounded-2xl p-7 sm:p-9 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconCube size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>3D Model Generation</h3>
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
                className="reveal reveal-delay-4 bento-card rounded-2xl p-7 sm:p-9 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <IconZap size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>50+ Game Templates</h3>
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

              {/* Safe & Professional — trust anchor, spans full width */}
              <div
                className="reveal reveal-delay-5 bento-card rounded-2xl p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center gap-6 lg:col-span-3"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex-1">
                  <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                    <IconShield size={22} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>Safe by Default</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                    COPPA-compliant with parental controls, content filtering, and zero data selling. Every generated script ships with server authority and anti-cheat — production-ready from day one.
                  </p>
                </div>
                <div className="flex gap-8 sm:gap-10 flex-shrink-0">
                  {[
                    { value: '12s',    label: 'Avg gen' },
                    { value: 'COPPA',  label: 'Compliant' },
                    { value: '0',      label: 'Data sold' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#D4AF37' }}>{value}</p>
                      <p className="text-[11px] mt-1" style={{ color: '#52525B' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            PRICING — 7th, money time
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-28 px-6 relative overflow-hidden scroll-mt-16"
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
          className="relative py-36 px-6 overflow-hidden"
          style={{ background: '#050810' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,175,55,0.08) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 30% 80%, rgba(124,58,237,0.04) 0%, transparent 50%)',
                'radial-gradient(ellipse 60% 40% at 70% 80%, rgba(99,102,241,0.03) 0%, transparent 50%)',
              ].join(', '),
            }} />
            <div className="section-divider absolute top-0 inset-x-0" />
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
