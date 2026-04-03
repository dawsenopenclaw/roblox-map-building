'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import HeroScreenshotTabs from '@/components/marketing/HeroScreenshotTabs'
import ShowcasePreview from '@/components/marketing/ShowcasePreview'
import FeatureSpotlight from '@/components/marketing/FeatureSpotlight'
import ComparisonSection from '@/components/marketing/ComparisonSection'
import TestimonialsSection from '@/components/marketing/TestimonialsSection'
import FaqSection from '@/components/marketing/FaqSection'
// Footer rendered by marketing layout

/* ─── CSS-in-JS animation styles ─────────────────────────────────────────── */

const GLOBAL_STYLES = `
  /* ── keyframes ── */
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.25), 0 2px 8px rgba(0,0,0,0.3); }
    50%       { box-shadow: 0 0 0 6px rgba(212,175,55,0.0), 0 2px 8px rgba(0,0,0,0.3); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  @keyframes progress-fill {
    from { width: 0%; }
    to   { width: 72%; }
  }
  @keyframes count-tick {
    from { transform: translateY(4px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes slide-right {
    from { transform: translateX(-100%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes gradient-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes dot-appear {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* ── scroll reveal ── */
  .reveal {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(3px);
    transition:
      opacity  700ms cubic-bezier(0.16,1,0.3,1),
      transform 700ms cubic-bezier(0.16,1,0.3,1),
      filter   600ms cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0px);
  }
  .reveal-delay-1 { transition-delay: 80ms; }
  .reveal-delay-2 { transition-delay: 160ms; }
  .reveal-delay-3 { transition-delay: 240ms; }
  .reveal-delay-4 { transition-delay: 320ms; }
  .reveal-delay-5 { transition-delay: 400ms; }
  .reveal-delay-6 { transition-delay: 480ms; }
  .reveal-delay-7 { transition-delay: 560ms; }

  /* ── cursor blink ── */
  .cursor-blink {
    animation: cursor-blink 1.1s step-start infinite;
  }

  /* ── bento cards ── */
  .bento-card {
    transition:
      transform 300ms cubic-bezier(0.16,1,0.3,1),
      border-color 300ms cubic-bezier(0.16,1,0.3,1),
      box-shadow 300ms cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }
  .bento-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212,175,55,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 400ms ease;
    pointer-events: none;
    z-index: 0;
  }
  .bento-card:hover::before {
    opacity: 1;
  }
  .bento-card:hover {
    transform: translateY(-3px);
    border-color: rgba(212,175,55,0.18) !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08) !important;
  }
  .bento-card > * {
    position: relative;
    z-index: 1;
  }

  /* ── feature icon ── */
  .feature-icon {
    transition: filter 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1), color 300ms cubic-bezier(0.16,1,0.3,1);
  }
  .bento-card:hover .feature-icon {
    filter: drop-shadow(0 0 12px rgba(212,175,55,0.4));
    color: rgba(212,175,55,0.85) !important;
    transform: scale(1.08);
  }

  /* ── pricing cards ── */
  .pricing-card {
    transition:
      transform 300ms cubic-bezier(0.16,1,0.3,1),
      box-shadow 300ms cubic-bezier(0.16,1,0.3,1),
      border-color 300ms cubic-bezier(0.16,1,0.3,1);
  }
  .pricing-card:hover { transform: translateY(-4px); }
  .pricing-card-default:hover {
    border-color: rgba(255,255,255,0.14) !important;
    box-shadow: 0 16px 48px rgba(0,0,0,0.45) !important;
  }
  .pricing-card-recommended:hover {
    border-color: rgba(212,175,55,0.5) !important;
    box-shadow: 0 0 80px rgba(212,175,55,0.18), 0 16px 48px rgba(0,0,0,0.55) !important;
  }

  /* ── CTA button ── */
  .cta-primary {
    transition:
      background 200ms cubic-bezier(0.16,1,0.3,1),
      transform  200ms cubic-bezier(0.16,1,0.3,1),
      box-shadow 200ms cubic-bezier(0.16,1,0.3,1);
  }
  .cta-primary:hover { transform: translateY(-2px); }

  .cta-secondary {
    transition:
      color 200ms cubic-bezier(0.16,1,0.3,1),
      border-color 200ms cubic-bezier(0.16,1,0.3,1),
      transform 200ms cubic-bezier(0.16,1,0.3,1);
  }
  .cta-secondary:hover {
    transform: translateY(-2px);
    color: #FAFAFA !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  /* ── gradient text ── */
  .gradient-text {
    background: linear-gradient(135deg, #FFD166 0%, #FFB81C 30%, #D4AF37 60%, #FFD166 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  /* ── AI badge ── */
  .ai-badge {
    animation: badge-pulse 2.8s ease-in-out infinite;
  }

  /* ── floating mockup ── */
  .mockup-float {
    animation: float 6s ease-in-out infinite;
  }

  /* ── step connector line ── */
  .step-line {
    background: linear-gradient(90deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.1) 100%);
  }

  /* ── recommended glow ── */
  .recommended-glow {
    animation: glow-pulse 3s ease-in-out infinite;
  }

  /* ── progress bar animation ── */
  .progress-bar-fill {
    animation: progress-fill 2.5s cubic-bezier(0.25,1,0.5,1) 1s both;
  }

  /* ── noise overlay ── */
  .noise-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  /* ── grid overlay ── */
  .grid-overlay {
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* ── trust stat hover ── */
  .trust-stat {
    transition: transform 250ms cubic-bezier(0.16,1,0.3,1);
  }
  .trust-stat:hover { transform: translateY(-2px); }

  /* ── section backgrounds ── */
  .section-void { background: #050810; }
  .section-deep { background: #070B1A; }
  .section-navy { background: #0A0F24; }

  /* ── mobile: reduce motion ── */
  @media (max-width: 640px) {
    .reveal {
      filter: none;
      transition:
        opacity  450ms cubic-bezier(0.16,1,0.3,1),
        transform 450ms cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-delay-1, .reveal-delay-2, .reveal-delay-3,
    .reveal-delay-4, .reveal-delay-5, .reveal-delay-6, .reveal-delay-7 {
      transition-delay: 0ms;
    }
    .mockup-float { animation: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal { transition-duration: 0ms; filter: none; }
    .cursor-blink, .ai-badge, .mockup-float, .gradient-text,
    .recommended-glow, .progress-bar-fill { animation: none; }
  }
`

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1600
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setCount(Math.round(eased * target))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Typing animation hook ──────────────────────────────────────────────── */

function useTypingAnimation(phrases: string[], speed = 55, pauseMs = 1800) {
  const [display, setDisplay] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx]
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), speed)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pauseMs)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx((c) => c - 1), speed / 2)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setPhraseIdx((p) => (p + 1) % phrases.length)
    }
  }, [charIdx, deleting, phraseIdx, phrases, speed, pauseMs])

  useEffect(() => {
    setDisplay(phrases[phraseIdx].slice(0, charIdx))
  }, [charIdx, phraseIdx, phrases])

  return display
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

function IconImage({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
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

function IconPlug({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M7 12V9a5 5 0 0 1 10 0v3" />
      <rect x="5" y="12" width="14" height="5" rx="2" />
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

/* ─── Enhanced Editor Mockup ─────────────────────────────────────────────── */

function EditorMockup() {
  const typedText = useTypingAnimation([
    'build a medieval castle with stone walls, 4 towers, and a working drawbridge',
    'generate a tropical island with palm trees, a beach, and hidden caves',
    'create a futuristic city district with neon signs and flying vehicles',
    'add a haunted mansion on the hilltop with fog and flickering lights',
  ])

  return (
    <div
      className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: '#0B0F24',
        border: '1px solid rgba(212,175,55,0.16)',
        boxShadow: [
          '0 0 0 1px rgba(255,255,255,0.04)',
          '0 8px 32px rgba(0,0,0,0.6)',
          '0 32px 72px rgba(0,0,0,0.4)',
          '0 0 80px rgba(212,175,55,0.07)',
          'inset 0 1px 0 rgba(255,255,255,0.05)',
        ].join(', '),
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080C1C' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'rgba(212,175,55,0.5)' }}>
            ForjeGames
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.12)' }}>/</span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>my-game</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] px-2 py-0.5 rounded-md" style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981',
          }}>
            Studio live
          </span>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 288 }}>
        {/* File tree */}
        <div
          className="hidden md:flex flex-col w-44 flex-shrink-0 pt-3"
          style={{ borderRight: '1px solid rgba(255,255,255,0.04)', background: '#080C18' }}
        >
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.3)' }}>
            Explorer
          </p>
          {[
            { depth: 0, label: 'Workspace',    color: '#52525B', icon: '▾' },
            { depth: 1, label: 'Castle',       color: '#D4AF37', icon: '▾', active: true },
            { depth: 2, label: 'Walls',        color: '#71717A', icon: '▸' },
            { depth: 2, label: 'Towers (4)',   color: '#71717A', icon: '▸' },
            { depth: 2, label: 'Gate',         color: '#10B981', icon: '▸', new: true },
            { depth: 1, label: 'Terrain',      color: '#60A5FA', icon: '▸' },
            { depth: 1, label: 'Lighting',     color: '#A78BFA', icon: '▸' },
            { depth: 0, label: 'Scripts',      color: '#52525B', icon: '▾' },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center text-[11px] py-[3px] gap-1"
              style={{
                paddingLeft: 8 + row.depth * 14,
                color: row.color,
                background: row.active ? 'rgba(212,175,55,0.06)' : 'transparent',
                borderLeft: row.active ? '2px solid rgba(212,175,55,0.4)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 8, opacity: 0.6 }}>{row.icon}</span>
              <span>{row.label}</span>
              {row.new && (
                <span className="ml-auto mr-2 text-[9px] px-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>new</span>
              )}
            </div>
          ))}
        </div>

        {/* Viewport */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ background: '#080C1E' }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.6 }} />

          {/* Depth gradient */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)',
          }} />

          {/* Castle scene */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 240, height: 160 }}>
              {/* Left tower */}
              <div className="absolute" style={{ left: 0, bottom: 40, width: 46, height: 96, background: 'linear-gradient(180deg, #252530, #1a1a22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px 3px 0 0' }}>
                {[0, 10, 20, 32].map((bx) => (
                  <div key={bx} style={{ position: 'absolute', left: bx + 1, top: -8, width: 8, height: 8, background: '#252530', border: '1px solid rgba(255,255,255,0.07)' }} />
                ))}
                <div style={{ position: 'absolute', left: 11, top: 24, width: 22, height: 28, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: '11px 11px 0 0' }} />
              </div>

              {/* Right tower */}
              <div className="absolute" style={{ right: 0, bottom: 40, width: 46, height: 96, background: 'linear-gradient(180deg, #252530, #1a1a22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px 3px 0 0' }}>
                {[0, 10, 20, 32].map((bx) => (
                  <div key={bx} style={{ position: 'absolute', left: bx + 1, top: -8, width: 8, height: 8, background: '#252530', border: '1px solid rgba(255,255,255,0.07)' }} />
                ))}
                <div style={{ position: 'absolute', left: 11, top: 24, width: 22, height: 28, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: '11px 11px 0 0' }} />
              </div>

              {/* Main wall */}
              <div className="absolute" style={{ left: 46, bottom: 40, width: 148, height: 64, background: 'linear-gradient(180deg, #1e1e28, #181820)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Battlements */}
                {[0, 16, 32, 48, 64, 80, 96, 112, 128].map((bx) => (
                  <div key={bx} style={{ position: 'absolute', left: bx + 2, top: -6, width: 10, height: 6, background: '#1e1e28', border: '1px solid rgba(255,255,255,0.06)' }} />
                ))}
                {/* Gate — gold glowing */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0" style={{ width: 28, height: 40 }}>
                  <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '14px 14px 0 0', boxShadow: '0 0 12px rgba(212,175,55,0.15) inset' }}>
                    {[7, 14, 21].map((bx) => (
                      <div key={bx} style={{ position: 'absolute', left: bx - 5, top: 4, width: 1, height: 28, background: 'rgba(212,175,55,0.35)' }} />
                    ))}
                  </div>
                  <div className="ai-badge absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                    building...
                  </div>
                </div>
              </div>

              {/* Ground */}
              <div className="absolute" style={{ left: -6, right: -6, bottom: 2, height: 40, background: 'linear-gradient(180deg, #1c2e1c, #162016)', borderRadius: '3px' }} />

              {/* Ambient glow */}
              <div className="absolute" style={{ left: -20, right: -20, bottom: 0, height: 60, background: 'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
            </div>
          </div>

          {/* Selection outline indicator */}
          <div className="absolute" style={{ top: 16, left: 16, fontSize: 10, color: 'rgba(212,175,55,0.5)', fontFamily: 'monospace' }}>
            Gate — selected
          </div>
        </div>

        {/* Properties panel */}
        <div
          className="hidden lg:flex flex-col w-40 flex-shrink-0 pt-3"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', background: '#080C18' }}
        >
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.3)' }}>
            Properties
          </p>
          {[
            { label: 'Parts',     value: '3,491' },
            { label: 'Triangles', value: '18.7k' },
            { label: 'Scripts',   value: '6',     highlight: true },
          ].map((p) => (
            <div key={p.label} className="px-3 mb-4">
              <p className="text-[10px] mb-0.5" style={{ color: '#52525B' }}>{p.label}</p>
              <p className="text-[13px] font-semibold tabular-nums" style={{ color: p.highlight ? '#10B981' : '#E4E4E7' }}>{p.value}</p>
            </div>
          ))}
          <div className="mx-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between mb-1.5">
              <p className="text-[10px]" style={{ color: '#52525B' }}>Tokens</p>
              <p className="text-[10px]" style={{ color: 'rgba(212,175,55,0.5)' }}>620/1k</p>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="progress-bar-fill h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, #FFB81C)', width: '62%' }} />
            </div>
          </div>
          <div className="mx-3 mt-4">
            <p className="text-[10px] mb-1.5" style={{ color: '#52525B' }}>Model</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#A78BFA' }} />
              <p className="text-[11px]" style={{ color: '#A1A1AA' }}>Claude 3.5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#070A18' }}
      >
        <span className="text-sm font-mono font-bold" style={{ color: 'rgba(212,175,55,0.5)' }}>&gt;</span>
        <span className="flex-1 text-sm font-mono truncate" style={{ color: '#E4E4E7' }}>
          {typedText}
          <span className="cursor-blink inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: '#D4AF37' }} />
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525B',
          }}>
            ⌘K
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded" style={{
            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.22)', color: '#D4AF37',
          }}>
            Enter
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Bento feature card ─────────────────────────────────────────────────── */

interface BentoCardProps {
  icon: React.ReactNode
  title: string
  description: string
  size?: 'normal' | 'wide' | 'tall'
  accent?: string
  children?: React.ReactNode
  delay?: number
}

function BentoCard({ icon, title, description, size = 'normal', children, delay = 0 }: BentoCardProps) {
  const delayClass = delay > 0 ? `reveal-delay-${delay}` : ''
  return (
    <div
      className={`reveal ${delayClass} bento-card rounded-2xl p-6 flex flex-col gap-4`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        gridColumn: size === 'wide' ? 'span 2' : undefined,
        gridRow: size === 'tall' ? 'span 2' : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="feature-icon w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.12)',
            color: '#D4AF37',
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold mb-1.5" style={{ color: '#FAFAFA' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>{description}</p>
      </div>
      {children}
    </div>
  )
}

/* ─── Pricing card ───────────────────────────────────────────────────────── */

function PricingCard({ name, price, period, features, cta, recommended, description }: {
  name: string; price: string; period: string; features: string[]; cta: string; recommended?: boolean; description: string
}) {
  return (
    <div
      className={`reveal flex flex-col rounded-2xl p-8 pricing-card ${recommended ? 'pricing-card-recommended' : 'pricing-card-default'} relative overflow-hidden`}
      style={{
        background: recommended ? 'linear-gradient(145deg, rgba(18,26,62,0.50), rgba(15,21,53,0.50))' : 'rgba(12,15,31,0.40)',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        border: recommended ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: recommended
          ? '0 0 60px rgba(212,175,55,0.1), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
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
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37',
          }}>
            Most popular
          </span>
        </div>
      )}

      <div className="relative z-10">
        <p className="text-sm font-semibold mb-1" style={{ color: recommended ? '#D4AF37' : '#71717A' }}>{name}</p>
        <p className="text-[13px] mb-6" style={{ color: '#52525B' }}>{description}</p>

        <div className="mb-8">
          <div className="flex items-end gap-1.5">
            <span className="text-5xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>{price}</span>
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

        <Link
          href="/editor"
          className="block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200"
          style={recommended ? {
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
            color: '#09090b',
            boxShadow: '0 0 24px rgba(212,175,55,0.3)',
          } : {
            background: 'rgba(255,255,255,0.05)',
            color: '#A1A1AA',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            if (recommended) {
              el.style.boxShadow = '0 0 40px rgba(212,175,55,0.45)'
              el.style.transform = 'translateY(-1px)'
            } else {
              el.style.borderColor = 'rgba(255,255,255,0.16)'
              el.style.color = '#FAFAFA'
              el.style.background = 'rgba(255,255,255,0.08)'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            if (recommended) {
              el.style.boxShadow = '0 0 24px rgba(212,175,55,0.3)'
              el.style.transform = 'translateY(0)'
            } else {
              el.style.borderColor = 'rgba(255,255,255,0.08)'
              el.style.color = '#A1A1AA'
              el.style.background = 'rgba(255,255,255,0.05)'
            }
          }}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}

/* ─── How it works step ──────────────────────────────────────────────────── */

function HowItWorksStep({ n, title, description, icon, delay }: {
  n: string; title: string; description: string; icon: React.ReactNode; delay: number
}) {
  return (
    <div className={`reveal reveal-delay-${delay} flex flex-col items-center text-center`}>
      <div className="relative mb-6">
        {/* Number ring */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 0 24px rgba(212,175,55,0.08)',
          }}
        >
          <span className="text-xl font-bold" style={{ color: 'rgba(212,175,55,0.7)' }}>{n}</span>
        </div>
        {/* Icon overlay */}
        <div
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#D4AF37', color: '#09090b' }}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3" style={{ color: '#FAFAFA' }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: '#71717A' }}>{description}</p>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function HomeClient() {
  const pageRef = useReveal()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
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
          style={{ minHeight: '100vh', paddingTop: '12vh', paddingBottom: '8vh', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
        >
          {/* Deep radial background */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(212,175,55,0.05) 0%, transparent 70%)',
                'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(96,165,250,0.03) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 80% 60%, rgba(167,139,250,0.03) 0%, transparent 60%)',
              ].join(', '),
            }} />
            {/* Subtle grid */}
            <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.5 }} />
          </div>

          <div className="relative max-w-4xl mx-auto w-full">

            {/* Floating badge */}
            <div
              className="reveal inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] mb-10 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#A1A1AA',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#10B981' }} />
              Open beta is live — free to start
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span style={{ color: '#D4AF37' }}>1,000 free tokens</span>
            </div>

            {/* Headline */}
            <h1
              className="reveal reveal-delay-1 font-bold tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Build Roblox games
              <br />
              <span className="gradient-text">with AI in minutes</span>
            </h1>

            {/* Subheadline */}
            <p
              className="reveal reveal-delay-2 text-xl leading-relaxed max-w-2xl mx-auto mb-12"
              style={{ color: '#71717A', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}
            >
              Describe your world. ForjeGames generates terrain, builds assets,
              <br className="hidden sm:block" />
              writes scripts, and syncs directly to your Roblox Studio — live.
            </p>

            {/* CTA row */}
            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <Link
                href="/editor"
                className="cta-primary inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 28px rgba(212,175,55,0.3), 0 4px 16px rgba(0,0,0,0.4)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 48px rgba(212,175,55,0.5), 0 8px 24px rgba(0,0,0,0.5)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 28px rgba(212,175,55,0.3), 0 4px 16px rgba(0,0,0,0.4)'
                }}
              >
                Start building free
                <IconArrow size={15} />
              </Link>
              <Link
                href="/editor"
                className="cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  color: '#A1A1AA',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Try the editor
              </Link>
            </div>

            <p className="reveal reveal-delay-4 text-[13px]" style={{ color: '#3F3F46' }}>
              No credit card required &middot; No setup &middot; Works with Roblox Studio
            </p>
          </div>

          {/* Editor mockup — hero centrepiece */}
          <div
            className="reveal reveal-delay-5 mockup-float relative w-full max-w-4xl mx-auto mt-20 px-2"
            style={{
              filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.55)) drop-shadow(0 8px 24px rgba(212,175,55,0.05))',
            }}
          >
            <EditorMockup />
          </div>

          {/* Scroll indicator */}
          <div
            className="reveal reveal-delay-6 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40"
            aria-hidden="true"
          >
            <span className="text-[11px] tracking-widest uppercase" style={{ color: '#52525B' }}>Scroll</span>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #52525B, transparent)' }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HERO SCREENSHOT TABS
        ══════════════════════════════════════════════════════════════════ */}
        <HeroScreenshotTabs />

        {/* ══════════════════════════════════════════════════════════════════
            TRUST BAR — animated stats
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-16 px-6 overflow-hidden"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'linear-gradient(to bottom, #070B1A, #050810)',
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
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 text-center">
              {[
                { value: 50000, suffix: '+', label: 'Assets generated',     color: '#D4AF37'  },
                { value: 1200,  suffix: '+', label: 'Games built',          color: '#60A5FA'  },
                { value: 8400,  suffix: '+', label: 'Active creators',      color: '#A78BFA'  },
                { value: 99,    suffix: '%', label: 'Uptime SLA',           color: '#10B981'  },
              ].map(({ value, suffix, label, color }, i) => (
                <div key={label} className={`reveal reveal-delay-${i + 1} trust-stat`}>
                  <p
                    className="text-3xl font-bold mb-1 tabular-nums"
                    style={{ color, letterSpacing: '-0.02em' }}
                  >
                    <AnimatedCounter target={value} suffix={suffix} />
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#52525B' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            BENTO GRID FEATURES
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="py-32 px-6 relative"
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
            <div className="max-w-2xl mb-20">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                Platform
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Every tool your
                <br />game studio needs.
              </h2>
              <p className="reveal reveal-delay-2 text-lg leading-relaxed" style={{ color: '#71717A' }}>
                From a single sentence to a complete Roblox world. AI-powered at every step.
              </p>
            </div>

            {/* Feature grid — 6 specific features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* AI Chat */}
              <div
                className="reveal bento-card rounded-2xl p-7 flex flex-col lg:col-span-2"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 280,
                }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                    <IconBrain size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#FAFAFA' }}>AI Chat</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                      Natural language to production Luau. Describe any mechanic — combat, economy, physics — and watch it generate live.
                    </p>
                  </div>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden" style={{
                  background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)', minHeight: 120,
                }}>
                  <div className="flex flex-col gap-2 p-4">
                    {([
                      { role: 'user', text: 'Add a coin magnet power-up that pulls nearby coins for 5 seconds' },
                      { role: 'ai',   text: 'Creating CoinMagnet.lua — 20 stud radius, 5s duration, glow VFX on pickup...' },
                    ] as const).map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                          <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <span style={{ fontSize: 8, color: '#D4AF37' }}>F</span>
                          </div>
                        )}
                        <div
                          className={`text-[12px] leading-relaxed px-3 py-2 rounded-xl max-w-[85%]`}
                          style={{
                            background: msg.role === 'user' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                            border: msg.role === 'user' ? '1px solid rgba(212,175,55,0.18)' : '1px solid rgba(255,255,255,0.06)',
                            color: msg.role === 'user' ? '#D4AF37' : '#A1A1AA',
                          }}
                        >
                          {msg.text}
                          {msg.role === 'ai' && <span className="cursor-blink inline-block w-0.5 h-3 ml-1 align-middle" style={{ background: '#D4AF37' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                  <span className="text-[11px]" style={{ color: '#52525B' }}>Live &middot; Context-aware &middot; Luau-native</span>
                </div>
              </div>

              {/* Studio Sync */}
              <div
                className="reveal reveal-delay-1 bento-card rounded-2xl p-7 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 280,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)', color: '#60A5FA' }}>
                  <IconSync size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Studio Sync</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#71717A' }}>
                  Real-time connection to Roblox Studio. Every change appears live in your place — no copy-paste, no waiting.
                </p>
                <div className="mt-auto flex items-center gap-3 p-3 rounded-lg" style={{
                  background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)',
                }}>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(96,165,250,0.15)' }}>
                      <div className="progress-bar-fill h-1.5 rounded-full" style={{ background: '#60A5FA', width: '78%' }} />
                    </div>
                    <span className="text-[10px]" style={{ color: '#52525B' }}>Syncing to Studio...</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md flex-shrink-0" style={{
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981',
                  }}>Live</span>
                </div>
              </div>

              {/* Workspace Intelligence */}
              <div
                className="reveal reveal-delay-2 bento-card rounded-2xl p-7 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)', color: '#A78BFA' }}>
                  <IconSparkle size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Workspace Intelligence</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  The AI knows your entire map — scripts, parts, structure. Suggestions are always contextual, never generic.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Map-aware', 'Script-aware', 'No hallucinations'].map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full" style={{
                      background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)', color: '#A78BFA',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* 3D Preview */}
              <div
                className="reveal reveal-delay-3 bento-card rounded-2xl p-7 flex flex-col"
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
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>3D Preview</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#71717A' }}>
                  See your builds in the browser before they hit Studio. Interactive 3D viewer with PBR textures included.
                </p>
                <div className="mt-auto flex items-center justify-center rounded-xl" style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', height: 72,
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="0.9" className="mockup-float">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="rgba(212,175,55,0.2)" />
                    <line x1="12" y1="22.08" x2="12" y2="12" stroke="rgba(212,175,55,0.2)" />
                  </svg>
                </div>
              </div>

              {/* Templates */}
              <div
                className="reveal reveal-delay-4 bento-card rounded-2xl p-7 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)', color: '#10B981' }}>
                  <IconZap size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Templates</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#71717A' }}>
                  50+ pre-built game templates — tycoons, simulators, RPGs, obby, shooters. Fully wired, ready to customize.
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {['Tycoon', 'Simulator', 'RPG', 'Obby', '+46 more'].map((genre, i) => (
                    <span key={genre} className="text-[11px] px-2.5 py-1 rounded-full" style={{
                      background: i === 4 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i === 4 ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.06)'}`,
                      color: i === 4 ? '#10B981' : '#52525B',
                    }}>{genre}</span>
                  ))}
                </div>
              </div>

              {/* Professional Code */}
              <div
                className="reveal reveal-delay-5 bento-card rounded-2xl p-7 flex flex-col sm:flex-row gap-6 items-start sm:items-center sm:col-span-2 lg:col-span-3"
                style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.18)', color: '#D4AF37' }}>
                  <IconShield size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#FAFAFA' }}>Professional Code</h3>
                  <p className="text-sm" style={{ color: '#71717A' }}>
                    Production-ready Luau — typed, modular, optimized. Server authority, rate limiting, and anti-cheat baked in. Ship games you are proud of.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 flex-shrink-0">
                  {[
                    { value: '12s',  label: 'Avg gen time' },
                    { value: '99%',  label: 'Uptime' },
                    { value: '0',    label: 'Config needed' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>{value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#52525B' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HOW IT WORKS — horizontal timeline
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-32 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #070B1A, #0A0F24)' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(212,175,55,0.04) 0%, transparent 60%)',
            }} />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-20">
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

            {/* Steps with connecting lines */}
            <div className="relative">
              {/* Connector line — desktop only */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)]"
                style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.25) 100%)' }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
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
                className="cta-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  color: '#D4AF37',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(212,175,55,0.15)'
                  el.style.boxShadow = '0 0 24px rgba(212,175,55,0.15)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(212,175,55,0.1)'
                  el.style.boxShadow = 'none'
                }}
              >
                Try it yourself — free
                <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SHOWCASE PREVIEW
        ══════════════════════════════════════════════════════════════════ */}
        <ShowcasePreview />

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE SPOTLIGHT
        ══════════════════════════════════════════════════════════════════ */}
        <FeatureSpotlight />

        {/* ══════════════════════════════════════════════════════════════════
            COMPARISON SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <ComparisonSection />

        {/* ══════════════════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ══════════════════════════════════════════════════════════════════
            EDITOR PREVIEW — second look
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="py-32 px-6 relative overflow-hidden"
          style={{ background: '#050810' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 70%)',
            }} />
          </div>
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                The Editor
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Chat on the left.
                <br />
                <span className="gradient-text">Your Roblox world on the right.</span>
              </h2>
              <p className="reveal reveal-delay-2 text-lg max-w-md mx-auto" style={{ color: '#71717A' }}>
                One interface. Every tool you need. Changes are always live.
              </p>
            </div>
            <div
              className="reveal reveal-delay-3"
              style={{
                filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.55)) drop-shadow(0 0 40px rgba(212,175,55,0.04))',
              }}
            >
              <EditorMockup />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-32 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #070B1A, #0A0F24)' }}
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

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(212,175,55,0.6)' }}>
                Pricing
              </p>
              <h2
                className="reveal reveal-delay-1 font-bold tracking-tight mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FAFAFA' }}
              >
                Start free.
                <br />
                <span className="gradient-text">Scale when you are ready.</span>
              </h2>
              <p className="reveal reveal-delay-2 text-lg" style={{ color: '#71717A' }}>
                No credit card to start. Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              <PricingCard
                name="Free"
                price="$0"
                period="/forever"
                description="Perfect for trying ForjeGames"
                features={[
                  '1,000 tokens to start',
                  'All AI models included',
                  'Marketplace access',
                  'Live Studio sync',
                  'Community support',
                ]}
                cta="Get started free"
              />
              <PricingCard
                name="Creator"
                price="$15"
                period="/month"
                description="For serious Roblox creators"
                features={[
                  '50,000 tokens / month',
                  'Priority AI processing',
                  'Custom 3D mesh generation',
                  'Studio plugin sync',
                  'Image-to-map feature',
                  'Email support',
                ]}
                cta="Start creating"
                recommended
              />
              <PricingCard
                name="Studio"
                price="$50"
                period="/month"
                description="For teams and game studios"
                features={[
                  '200,000 tokens / month',
                  'Team collaboration (5 seats)',
                  'Full API access + SDKs',
                  'Game DNA analysis',
                  'Dedicated account manager',
                  'Priority support',
                ]}
                cta="Go pro"
              />
            </div>

            <div className="reveal mt-10 text-center">
              <p className="text-[13px] mb-3" style={{ color: '#3F3F46' }}>
                10% of every payment goes to charity.{' '}
                <Link href="/editor" className="transition-colors duration-200" style={{ color: '#71717A' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#A1A1AA' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717A' }}
                >
                  Try it free
                </Link>
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {[
                  { icon: <IconCheck size={12} />, label: 'Cancel anytime' },
                  { icon: <IconCheck size={12} />, label: 'No hidden fees' },
                  { icon: <IconShield size={12} />, label: 'Secure payments' },
                ].map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[12px]" style={{ color: '#3F3F46' }}>
                    <span style={{ color: '#52525B' }}>{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════════ */}
        <FaqSection />

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-48 px-6 overflow-hidden"
          style={{ background: '#050810' }}
        >
          {/* Multi-layer depth glow */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,175,55,0.07) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 30% 60%, rgba(167,139,250,0.03) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(96,165,250,0.03) 0%, transparent 60%)',
              ].join(', '),
            }} />
            {/* Subtle grid */}
            <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.3 }} />
            {/* Horizontal line */}
            <div className="absolute top-0 inset-x-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 30%, rgba(212,175,55,0.15) 50%, rgba(212,175,55,0.08) 70%, transparent 100%)' }} />
          </div>

          <div className="relative max-w-2xl mx-auto text-center">
            {/* Eyebrow */}
            <div
              className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold uppercase tracking-[0.1em] mb-8"
              style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.14)',
                color: 'rgba(212,175,55,0.7)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
              Free to start
            </div>

            <h2
              className="reveal reveal-delay-1 font-bold tracking-tight mb-6"
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

            <p
              className="reveal reveal-delay-2 text-xl mb-12"
              style={{ color: '#52525B', lineHeight: 1.7 }}
            >
              Join 8,400+ creators building the next generation of Roblox experiences.
              <br />
              Your first 1,000 tokens are on us.
            </p>

            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/editor"
                className="cta-primary inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 40px rgba(212,175,55,0.35), 0 8px 24px rgba(0,0,0,0.5)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 64px rgba(212,175,55,0.55), 0 12px 32px rgba(0,0,0,0.6)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 40px rgba(212,175,55,0.35), 0 8px 24px rgba(0,0,0,0.5)'
                }}
              >
                Start building free
                <IconArrow size={16} />
              </Link>
              <Link
                href="/editor"
                className="cta-secondary inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-medium"
                style={{
                  color: '#71717A',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                Try the editor
              </Link>
            </div>

            <p className="reveal reveal-delay-4 mt-8 text-[13px]" style={{ color: '#27272A' }}>
              No credit card required &middot; Cancel anytime &middot; Loved by 8,400+ creators
            </p>
          </div>
        </section>

      </div>
    </>
  )
}
