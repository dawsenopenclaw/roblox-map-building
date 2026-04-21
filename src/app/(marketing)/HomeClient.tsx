'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'

// Below-the-fold sections are code-split for performance
const AgentOrbital = dynamic(() => import('@/components/marketing/AgentOrbital'))
const SellingPointsBento = dynamic(() => import('@/components/marketing/SellingPointsBento'))
const ReviewMarquee = dynamic(() => import('@/components/marketing/ReviewMarquee'))
const ComparisonSection = dynamic(() => import('@/components/marketing/ComparisonSection'))
const FaqSection = dynamic(() => import('@/components/marketing/FaqSection'))

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
  const { isSignedIn } = useAuth()

  // Animated typing placeholder
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
    const editorTarget = trimmed
      ? `/editor?prompt=${encodeURIComponent(trimmed)}`
      : '/editor'

    if (isSignedIn) {
      router.push(editorTarget)
      return
    }

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

/* ─── Rotating hero text ─────────────────────────────────────────────────── */

const ROTATING_WORDS = ['Game', 'Map', 'UI', 'Terrain', 'World', 'Scripts', 'Assets']
const ROTATE_INTERVAL_MS = 2200

function RotatingHeroText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % ROTATING_WORDS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const longestWord = ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))
  const currentWord = ROTATING_WORDS[index]
  const stepDeg = 360 / ROTATING_WORDS.length
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
          minWidth: `${longestWord.length + 0.5}ch`,
          verticalAlign: 'bottom',
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <span
          aria-hidden="true"
          style={{ visibility: 'hidden', display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {longestWord}
        </span>

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
                  transform: `rotateX(${angle}deg) translateZ(1.2em)`,
                  transformOrigin: '50% 50%',
                  backfaceVisibility: 'hidden',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.6s ease-out',
                  willChange: 'transform, opacity',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 50%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
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

/* ─── How It Works — 3-step flow ──────────────────────────────────────────── */

const STEPS = [
  {
    num: '01',
    title: 'Describe your game',
    desc: 'Type, speak, or upload an image. Plain English — no code, no templates, no setup.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'AI agents build it',
    desc: '40+ specialist agents coordinate — terrain, scripts, assets, lighting, economy — all at once.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Play it in Studio',
    desc: 'Everything syncs live to Roblox Studio. Hit play. Your game is already there.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
]

function HowItWorks() {
  return (
    <section className="reveal py-20 sm:py-28 px-6 relative" style={{ background: '#050810' }}>
      {/* Subtle divider line */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', maxWidth: 500, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }} />

      <div className="max-w-4xl mx-auto text-center">
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-mono, monospace)' }}>
          How it works
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#f0f0f0', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 48 }}>
          Three steps. Zero friction.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {STEPS.map((step, i) => (
            <div key={step.num} className="reveal flex flex-col items-center text-center" style={{ animationDelay: `${i * 150}ms` }}>
              {/* Step icon in circle */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#D4AF37', marginBottom: 20,
              }}>
                {step.icon}
              </div>
              {/* Step number */}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8, opacity: 0.6 }}>{step.num}</span>
              {/* Title */}
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#E8EAF0', marginBottom: 8, letterSpacing: '-0.01em' }}>{step.title}</h3>
              {/* Description */}
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#71717A', maxWidth: 260, margin: '0 auto' }}>{step.desc}</p>

              {/* Connector arrow (only between steps on desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block" aria-hidden style={{
                  position: 'absolute',
                  top: '50%',
                  right: -20,
                  transform: 'translateY(-50%)',
                }}>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA — repeat the prompt input at bottom ──────────────────────── */

function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-28 px-6 text-center" style={{ background: '#050810' }}>
      <div className="max-w-2xl mx-auto">
        <h2
          className="reveal font-bold tracking-tight mb-4"
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            lineHeight: 1.15,
            color: '#FAFAFA',
          }}
        >
          Your game is one prompt away.
        </h2>
        <p className="reveal text-sm mb-8" style={{ color: '#71717A' }}>
          Start free with 1,000 tokens — no credit card needed.
        </p>
        <div className="reveal max-w-xl mx-auto mb-6">
          <HeroPromptInput />
        </div>
        <p className="reveal text-[12px]" style={{ color: '#3F3F46' }}>
          No account needed &middot; Free forever &middot; Works with Roblox Studio
        </p>
      </div>
    </section>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function HomeClient() {
  const pageRef = useReveal()
  const tHero = useTranslations('hero')

  return (
    <>
      <div
        ref={pageRef}
        className="min-h-screen"
        style={{ background: '#050810', color: '#FAFAFA', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)' }}
      >

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center text-center overflow-hidden"
          style={{ paddingTop: '16vh', paddingBottom: '10vh', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
        >
          {/* Aurora animated background */}
          <div aria-hidden="true" className="aurora-hero" />

          {/* Deep radial gold glow */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 40%, transparent 70%)',
                'radial-gradient(ellipse 50% 35% at 50% 5%,  rgba(255,184,28,0.08) 0%, transparent 55%)',
                'radial-gradient(ellipse 90% 60% at 50% 0%,  rgba(212,175,55,0.03) 0%, transparent 80%)',
              ].join(', '),
            }} />
            <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.3 }} />
          </div>

          <motion.div
            className="relative max-w-4xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow badge */}
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

            {/* Functional prompt input */}
            <motion.div
              className="max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroPromptInput />
            </motion.div>

            {/* Reassurance */}
            <motion.p
              className="text-[13px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              style={{ color: '#52525B' }}
            >
              Start free with 1,000 tokens &middot; No credit card &middot; Works with Roblox Studio
            </motion.p>

            {/* Powered by strip */}
            <motion.p
              className="mt-5 text-[11px] uppercase tracking-[0.14em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              style={{ color: '#3F3F46' }}
            >
              Powered by{' '}
              <span style={{ color: '#A1A1AA' }}>9 AI Agents</span>
              <span className="mx-2 opacity-40">&middot;</span>
              <span style={{ color: '#A1A1AA' }}>200+ Templates</span>
              <span className="mx-2 opacity-40">&middot;</span>
              <span style={{ color: '#A1A1AA' }}>3D Mesh Gen</span>
              <span className="mx-2 opacity-40">&middot;</span>
              <span style={{ color: '#A1A1AA' }}>13 Image Styles</span>
            </motion.p>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — AGENT ORBITAL
        ═══════════════════════════════════════════════════════════════ */}
        <AgentOrbital />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — SELLING POINTS BENTO
        ═══════════════════════════════════════════════════════════════ */}
        <SellingPointsBento />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3.5 — HOW IT WORKS
        ═══════════════════════════════════════════════════════════════ */}
        <HowItWorks />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — PLAYER REVIEWS
        ═══════════════════════════════════════════════════════════════ */}
        <ReviewMarquee />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5 — COMPETITOR COMPARISON
        ═══════════════════════════════════════════════════════════════ */}
        <ComparisonSection />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6 — FINAL CTA + FAQ
        ═══════════════════════════════════════════════════════════════ */}
        <FinalCTA />
        <FaqSection />

      </div>
    </>
  )
}
