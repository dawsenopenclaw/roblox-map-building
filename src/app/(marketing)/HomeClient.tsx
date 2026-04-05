'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HeroScreenshotTabs from '@/components/marketing/HeroScreenshotTabs'
import ShowcasePreview from '@/components/marketing/ShowcasePreview'
import FeatureSpotlight from '@/components/marketing/FeatureSpotlight'
import ComparisonSection from '@/components/marketing/ComparisonSection'
import TestimonialsSection from '@/components/marketing/TestimonialsSection'
import FaqSection from '@/components/marketing/FaqSection'
import CharityBanner from '@/components/marketing/CharityBanner'
import SubscribeSection from '@/components/marketing/SubscribeSection'
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

function PricingCard({ name, price, period, features, cta, recommended, description, href = '/editor', royalAccent }: {
  name: string; price: string; period: string; features: string[]; cta: string; recommended?: boolean; description: string; href?: string; royalAccent?: boolean
}) {
  return (
    <div
      className={`reveal flex flex-col rounded-2xl p-8 pricing-card ${recommended ? 'pricing-card-recommended pricing-card-recommended-border' : 'pricing-card-default'} relative overflow-hidden`}
      style={{
        background: recommended
          ? 'linear-gradient(145deg, #0E1530 0%, #0B1028 100%)'
          : royalAccent
          ? 'linear-gradient(145deg, #0D0B1E 0%, #090D1C 100%)'
          : '#090D1C',
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
          href={href}
          className={`block text-center py-3 rounded-xl text-sm font-semibold ${recommended ? 'pricing-cta-recommended' : 'pricing-cta-default'}`}
          style={recommended ? {
            background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
            color: '#09090b',
            boxShadow: '0 0 24px rgba(212,175,55,0.3)',
          } : {
            background: 'rgba(255,255,255,0.05)',
            color: '#A1A1AA',
            border: '1px solid rgba(255,255,255,0.08)',
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
          className="w-16 h-16 rounded-full flex items-center justify-center step-number-ring"
          style={{
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.25)',
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
      <div
        ref={pageRef}
        className="min-h-screen"
        style={{ background: '#0A0E27', color: '#FAFAFA', fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
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
                  background: '#FFB81C',
                  boxShadow: '0 0 6px 2px rgba(255,184,28,0.7)',
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

            {/* Headline */}
            <h1
              className="font-bold tracking-tight mb-6"
              style={{
                fontSize: 'clamp(3rem, 8.5vw, 5.75rem)',
                lineHeight: 1.04,
                letterSpacing: '-0.025em',
              }}
            >
              <span className="hero-word hero-word-1">Speak it.</span>{' '}
              <span className="hero-word hero-word-2">Build it.</span>{' '}
              <br />
              <span className="hero-word hero-word-3 gradient-text text-shimmer">Play it.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="reveal reveal-delay-2 leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ color: '#71717A', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)' }}
            >
              The first AI that builds complete Roblox games — not just scripts.
              <br className="hidden sm:block" />
              Voice, image, or text to terrain, assets, scripts, and economy. Live in Studio.
            </p>

            {/* CTA row */}
            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/editor"
                className="cta-primary cta-shimmer inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 32px rgba(255,184,28,0.4), 0 4px 16px rgba(0,0,0,0.4)',
                  letterSpacing: '0.01em',
                }}
              >
                Start Building Free
                <IconArrow size={15} />
              </Link>
              <Link
                href="#showcase"
                className="cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  color: '#A1A1AA',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                Watch Demo
              </Link>
            </div>

            <p className="reveal reveal-delay-4 text-[13px]" style={{ color: '#52525B' }}>
              No account needed &middot; Free forever &middot; Works with Roblox Studio
            </p>
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
            background: 'linear-gradient(to bottom, #070B1A, #0A0E27)',
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
                { value: 5,     suffix: '',  label: 'AI models',            color: '#D4AF37'  },
                { value: 55,    suffix: '+', label: 'Specialized agents',   color: '#60A5FA'  },
                { value: 50,    suffix: '+', label: 'Game templates',       color: '#7C3AED'  },
                { value: 10,    suffix: 'min', label: 'Time to first map',  color: '#10B981'  },
              ].map(({ value, suffix, label, color }, i) => (
                <div key={label} className={`reveal reveal-delay-${i + 1} trust-stat`} style={{ borderColor: `${color}22` }}>
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
          className="py-16 px-6 relative"
          style={{ background: '#0A0E27' }}
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

            {/* Feature grid — 6 specific features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* AI Chat */}
              <div
                className="reveal bento-card rounded-2xl p-7 flex flex-col lg:col-span-2"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 280,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px) scale(1.01)'
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
                <div className="flex items-start gap-4 mb-5">
                  <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                    <IconBrain size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#FAFAFA' }}>AI Script Writer</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                      Natural language to production Luau — context-aware, not generic snippets. Describe any mechanic and watch it generate live with your map structure already in mind.
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
                          {msg.role === 'ai' && <span className="cursor-blink-gold inline-block w-0.5 h-3 ml-1 align-middle" style={{ background: '#D4AF37' }} />}
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
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px) scale(1.01)'
                  el.style.boxShadow = '0 12px 40px rgba(96,165,250,0.1)'
                  el.style.borderColor = 'rgba(96,165,250,0.2)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)', color: '#60A5FA' }}>
                  <IconSync size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Live Studio Sync</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#71717A' }}>
                  Every generation — terrain, script, asset, UI — pushes directly into your open Roblox Studio place in real time. No copy-paste. No file imports. Just build.
                </p>
                <div className="mt-auto flex items-center gap-3 p-3 rounded-lg" style={{
                  background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)',
                }}>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(96,165,250,0.15)' }}>
                      <div className="progress-bar-fill h-1.5 rounded-full" style={{ background: '#60A5FA', width: '78%', '--target-width': '78%' } as React.CSSProperties} />
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
                  background: 'rgba(124,58,237,0.03)',
                  border: '1px solid rgba(124,58,237,0.14)',
                  minHeight: 260,
                  boxShadow: '0 0 32px rgba(124,58,237,0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px) scale(1.01)'
                  el.style.boxShadow = '0 12px 40px rgba(124,58,237,0.15)'
                  el.style.borderColor = 'rgba(124,58,237,0.3)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.boxShadow = '0 0 32px rgba(124,58,237,0.06)'
                  el.style.borderColor = 'rgba(124,58,237,0.14)'
                }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                  <IconSparkle size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>Voice Builder</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  Speak your idea — the AI builds it. Terrain, scripts, and assets generated from a single voice command. No other Roblox tool does this.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Voice input', 'Map-aware', 'Hands-free'].map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full" style={{
                      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* 3D Model Generation */}
              <div
                className="reveal reveal-delay-3 bento-card rounded-2xl p-7 flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: 260,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-4px) scale(1.01)'
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
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#71717A' }}>
                  Text or image to a Roblox-ready 3D mesh with PBR textures — generated by AI and placed directly in your map. Unique assets, not recycled marketplace models.
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
                <h3 className="text-lg font-bold mb-2" style={{ color: '#FAFAFA' }}>50+ Game Templates</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#71717A' }}>
                  Tycoons, simulators, RPGs, obby, shooters — fully wired with economy, UI, and scripts. Launch in minutes, not months.
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

              {/* Safe & Professional */}
              <div
                className="reveal reveal-delay-5 bento-card rounded-2xl p-7 flex flex-col sm:flex-row gap-6 items-start sm:items-center sm:col-span-2 lg:col-span-3"
                style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.18)', color: '#D4AF37' }}>
                  <IconShield size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#FAFAFA' }}>Built for Young Creators — Safe by Default</h3>
                  <p className="text-sm" style={{ color: '#71717A' }}>
                    COPPA-compliant with parental controls, content filtering, and zero data selling. Every generated script ships with server authority and anti-cheat — production-ready from day one.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 flex-shrink-0">
                  {[
                    { value: '12s',    label: 'Avg gen time' },
                    { value: 'COPPA',  label: 'Compliant' },
                    { value: '0',      label: 'Data sold' },
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
          className="py-16 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #070B1A, #0A0F24)' }}
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

            {/* Steps with connecting lines */}
            <div className="relative">
              {/* Connector line — desktop only */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] step-connector-animated"
                style={{ height: 2, borderRadius: 1 }}
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
            MID-PAGE CTA — Fast Prototyping
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-24 px-6 overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #0A0E27, #070B1A)' }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,184,28,0.05) 0%, transparent 65%)',
                'radial-gradient(ellipse 50% 40% at 15% 60%, rgba(124,58,237,0.04) 0%, transparent 60%)',
                'radial-gradient(ellipse 50% 40% at 85% 40%, rgba(99,102,241,0.04) 0%, transparent 60%)',
              ].join(', '),
            }} />
            <div className="absolute inset-x-0 top-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,184,28,0.08) 30%, rgba(255,184,28,0.15) 50%, rgba(255,184,28,0.08) 70%, transparent)' }} />
            <div className="absolute inset-x-0 bottom-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,184,28,0.06) 30%, rgba(255,184,28,0.10) 50%, rgba(255,184,28,0.06) 70%, transparent)' }} />
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            <p className="reveal text-[12px] font-semibold uppercase tracking-[0.12em] mb-5" style={{ color: 'rgba(255,184,28,0.7)' }}>
              For the next superstars
            </p>
            <h2
              className="reveal reveal-delay-1 font-bold tracking-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#FAFAFA' }}
            >
              Fast prototyping for
              <br />
              <span className="gradient-text text-shimmer">the next generation.</span>
            </h2>
            <p className="reveal reveal-delay-2 text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: '#71717A' }}>
              Other tools generate scripts. ForjeGames generates entire games — terrain, 3D models, economy systems, UI, and code. Ship in days, not months. Your moat is built in.
            </p>
            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="cta-primary cta-shimmer inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 40px rgba(255,184,28,0.35), 0 8px 24px rgba(0,0,0,0.4)',
                  letterSpacing: '0.01em',
                }}
              >
                Start Building Free
                <IconArrow size={16} />
              </Link>
              <Link
                href="/pricing"
                className="cta-secondary inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-medium"
                style={{
                  color: '#A1A1AA',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                See pricing
              </Link>
            </div>
            <p className="reveal reveal-delay-4 mt-6 text-[13px]" style={{ color: '#52525B' }}>
              No credit card required &middot; 1,000 free tokens &middot; Cancel anytime
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ══════════════════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-16 px-6 relative overflow-hidden"
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
                  '1,000 tokens / month',
                  'Basic terrain generation',
                  'Basic templates',
                  'Live Studio sync',
                  'Community support',
                ]}
                cta="Get started free"
              />
              <PricingCard
                name="Creator"
                price="$24.99"
                period="/month"
                description="For serious Roblox creators"
                features={[
                  '7,000 tokens / month',
                  'Voice-to-game + image-to-map',
                  'Game DNA scanner',
                  'Marketplace access + selling',
                  'Team collaboration (3 members)',
                  'Priority support',
                ]}
                cta="Start creating"
                href="/sign-up?plan=creator"
                recommended
              />
              <PricingCard
                name="Studio"
                price="$49.99"
                period="/month"
                description="For agencies &amp; studios"
                features={[
                  '20,000 tokens / month',
                  'All Creator features',
                  'Team collaboration (50 members)',
                  'Full API access + SDKs',
                  'White-label exports',
                  'Dedicated support',
                ]}
                cta="Go pro"
                href="/sign-up?plan=studio"
                royalAccent
              />
            </div>

            <div className="reveal mt-10 text-center">
              <p className="text-[13px] mb-3" style={{ color: '#71717A' }}>
                10% of every payment goes to charity.{' '}
                <Link href="/editor" className="link-subtle transition-colors duration-200" style={{ color: '#71717A' }}>
                  Try it free
                </Link>
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {[
                  { icon: <IconCheck size={12} />, label: 'Cancel anytime' },
                  { icon: <IconCheck size={12} />, label: 'No hidden fees' },
                  { icon: <IconShield size={12} />, label: 'Secure payments' },
                ].map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[12px]" style={{ color: '#71717A' }}>
                    <span style={{ color: '#52525B' }}>{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CharityBanner />

        {/* ══════════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════════ */}
        <FaqSection />

        {/* ══════════════════════════════════════════════════════════════════
            NEWSLETTER SUBSCRIBE
        ══════════════════════════════════════════════════════════════════ */}
        <SubscribeSection />

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative py-48 px-6 overflow-hidden"
          style={{ background: '#0A0E27' }}
        >
          {/* Multi-layer depth glow */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', inset: 0,
              background: [
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(212,175,55,0.07) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 30% 60%, rgba(124,58,237,0.06) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(99,102,241,0.06) 0%, transparent 60%)',
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
              Join creators building the next generation of Roblox experiences.
              <br />
              Your first 1,000 tokens are on us.
            </p>

            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="cta-primary cta-shimmer inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)',
                  color: '#09090b',
                  boxShadow: '0 0 48px rgba(255,184,28,0.4), 0 8px 32px rgba(0,0,0,0.5)',
                  letterSpacing: '0.01em',
                }}
              >
                Start Building Free
                <IconArrow size={16} />
              </Link>
              <Link
                href="/pricing"
                className="cta-secondary inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-medium"
                style={{
                  color: '#71717A',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                View pricing
              </Link>
            </div>

            <p className="reveal reveal-delay-4 mt-8 text-[13px]" style={{ color: '#71717A' }}>
              No credit card required &middot; Cancel anytime &middot; 1,000 free tokens to start
            </p>
          </div>
        </section>

      </div>
    </>
  )
}
