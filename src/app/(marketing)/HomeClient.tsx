'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
// Footer rendered by marketing layout

/* ─── CSS-in-JS animation styles injected once ──────────────────────────── */

const GLOBAL_STYLES = `
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
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
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.18), 0 2px 8px rgba(0,0,0,0.3); }
    50%       { box-shadow: 0 0 0 4px rgba(212,175,55,0.06), 0 2px 8px rgba(0,0,0,0.3); }
  }

  /* ── scroll reveal ── */
  .reveal {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(2px);
    transition:
      opacity  600ms cubic-bezier(0.16,1,0.3,1),
      transform 600ms cubic-bezier(0.16,1,0.3,1),
      filter   500ms cubic-bezier(0.16,1,0.3,1);
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

  /* ── cursor ── */
  .cursor-blink {
    animation: cursor-blink 1.1s step-start infinite;
  }

  /* ── feature card hover ── */
  .feature-card {
    transition: transform 250ms cubic-bezier(0.16,1,0.3,1);
  }
  .feature-card:hover {
    transform: translateY(-2px);
  }
  .feature-card:hover .feature-icon {
    filter: drop-shadow(0 0 8px rgba(212,175,55,0.25));
    color: rgba(212,175,55,0.7) !important;
    transition: filter 250ms cubic-bezier(0.16,1,0.3,1), color 250ms cubic-bezier(0.16,1,0.3,1);
  }
  .feature-icon {
    transition: filter 250ms cubic-bezier(0.16,1,0.3,1), color 250ms cubic-bezier(0.16,1,0.3,1);
  }

  /* ── pricing card hover ── */
  .pricing-card {
    transition:
      transform 250ms cubic-bezier(0.16,1,0.3,1),
      box-shadow 250ms cubic-bezier(0.16,1,0.3,1),
      border-color 250ms cubic-bezier(0.16,1,0.3,1);
  }
  .pricing-card:hover {
    transform: translateY(-3px);
  }
  .pricing-card-default:hover {
    border-color: rgba(255,255,255,0.12) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
  }
  .pricing-card-recommended:hover {
    border-color: rgba(212,175,55,0.42) !important;
    box-shadow: 0 0 48px rgba(212,175,55,0.1), 0 8px 32px rgba(0,0,0,0.5) !important;
  }

  /* ── CTA primary button ── */
  .cta-primary {
    transition:
      background 200ms cubic-bezier(0.16,1,0.3,1),
      transform  200ms cubic-bezier(0.16,1,0.3,1),
      box-shadow 200ms cubic-bezier(0.16,1,0.3,1);
  }
  .cta-primary:hover {
    transform: translateY(-1px);
  }

  /* ── editor mockup badge pulse ── */
  .ai-badge {
    animation: badge-pulse 2.8s ease-in-out infinite;
  }

  /* ── section gradient fades ── */
  .section-fade-down {
    background: linear-gradient(to bottom, #09090b 0%, #0c0c0e 100%);
  }
  .section-fade-up {
    background: linear-gradient(to bottom, #0c0c0e 0%, #09090b 100%);
  }
  .section-dark {
    background: #0c0c0e;
  }

  /* ── mobile: reduce motion ── */
  @media (max-width: 640px) {
    .reveal {
      filter: none;
      transition:
        opacity  400ms cubic-bezier(0.16,1,0.3,1),
        transform 400ms cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-delay-1,
    .reveal-delay-2,
    .reveal-delay-3,
    .reveal-delay-4,
    .reveal-delay-5,
    .reveal-delay-6 {
      transition-delay: 0ms;
    }
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
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

/* ─── SVG Icons (20px, stroke-based) ────────────────────────────────────── */

function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function IconCube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function IconSync() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z" />
    </svg>
  )
}

function IconPlug() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M7 12V9a5 5 0 0 1 10 0v3" />
      <rect x="5" y="12" width="14" height="5" rx="2" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
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
          const duration = 1400
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

/* ─── Editor mockup ──────────────────────────────────────────────────────── */

function EditorMockup() {
  return (
    <div
      className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden"
      style={{
        background: '#111113',
        border: '1px solid rgba(212,175,55,0.14)',
        boxShadow: [
          '0 8px 32px rgba(0,0,0,0.5)',
          '0 32px 64px rgba(0,0,0,0.3)',
          '0 0 0 1px rgba(255,255,255,0.03)',
          '0 0 60px rgba(212,175,55,0.05)',
          'inset 0 1px 0 rgba(255,255,255,0.04)',
        ].join(', '),
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0f' }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
        <span className="ml-4 text-xs font-mono" style={{ color: 'rgba(212,175,55,0.45)' }}>
          ForjeGames — Editor
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
          <span className="text-[11px]" style={{ color: '#10B981' }}>Studio connected</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 272 }}>
        {/* File tree */}
        <div
          className="hidden md:flex flex-col w-40 flex-shrink-0 pt-3"
          style={{ borderRight: '1px solid rgba(255,255,255,0.04)', background: '#111113' }}
        >
          <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.35)' }}>
            Explorer
          </p>
          {[
            { depth: 0, label: 'Workspace',   color: '#52525B' },
            { depth: 1, label: 'Castle',      color: '#A1A1AA' },
            { depth: 2, label: 'Walls',       color: '#52525B' },
            { depth: 2, label: 'Towers (4)',  color: '#52525B' },
            { depth: 1, label: 'Terrain',     color: '#10B981' },
            { depth: 1, label: 'Lighting',    color: '#60A5FA' },
            { depth: 0, label: 'Scripts',     color: '#52525B' },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center text-[11px] py-[3px]"
              style={{ paddingLeft: 12 + row.depth * 12, color: row.color }}
            >
              {row.label}
            </div>
          ))}
        </div>

        {/* Viewport */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background: '#0e0e10',
            boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.06)',
          }}
        >
          {/* Subtle grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* Castle illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 220, height: 150 }}>
              {[0, 172].map((x) => (
                <div key={x} className="absolute" style={{
                  left: x, bottom: 36, width: 44, height: 90,
                  background: 'linear-gradient(180deg, #1e1e22, #16161a)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '2px 2px 0 0',
                }}>
                  {[0, 10, 20, 30].map((bx) => (
                    <div key={bx} style={{ position: 'absolute', left: bx + 2, top: -7, width: 7, height: 7, background: '#1e1e22', border: '1px solid rgba(255,255,255,0.07)' }} />
                  ))}
                  <div style={{ position: 'absolute', left: 10, top: 22, width: 22, height: 26,
                    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: '11px 11px 0 0' }} />
                </div>
              ))}
              <div className="absolute" style={{
                left: 44, bottom: 36, width: 128, height: 58,
                background: 'linear-gradient(180deg, #1c1c20, #16161a)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-7 h-9" style={{
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px 14px 0 0',
                }}>
                  {[6,12,18].map((bx) => (
                    <div key={bx} style={{ position: 'absolute', left: bx - 5, top: 3, width: 1, height: 22, background: 'rgba(212,175,55,0.3)' }} />
                  ))}
                </div>
              </div>
              <div className="absolute" style={{
                left: -4, right: -4, bottom: 2, height: 36,
                background: 'linear-gradient(180deg, #1a2e1a, #162416)',
                borderRadius: '2px',
              }} />
            </div>
          </div>

          {/* Status pill — gently pulsing */}
          <div
            className="ai-badge absolute top-3 right-3 flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(212,175,55,0.07)',
              border: '1px solid rgba(212,175,55,0.18)',
              color: '#D4AF37',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            AI building...
          </div>
        </div>

        {/* Properties panel */}
        <div
          className="hidden lg:flex flex-col w-36 flex-shrink-0 pt-3"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', background: '#111113' }}
        >
          <p className="px-3 mb-3 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.35)' }}>
            Properties
          </p>
          {[
            { label: 'Parts',     value: '2,847' },
            { label: 'Triangles', value: '14.2k' },
            { label: 'Scripts',   value: '4'     },
          ].map((p) => (
            <div key={p.label} className="px-3 mb-3">
              <p className="text-[10px] mb-0.5" style={{ color: '#52525B' }}>{p.label}</p>
              <p className="text-[12px] font-semibold" style={{ color: '#E4E4E7' }}>{p.value}</p>
            </div>
          ))}
          <div className="mx-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] mb-1.5" style={{ color: '#52525B' }}>Tokens used</p>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-1 rounded-full" style={{ width: '62%', background: '#D4AF37' }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(212,175,55,0.5)' }}>620 / 1,000</p>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0f' }}
      >
        <span className="text-sm font-mono" style={{ color: 'rgba(212,175,55,0.4)' }}>&gt;</span>
        <span className="flex-1 text-sm font-mono truncate" style={{ color: '#E4E4E7' }}>
          build a castle with stone walls, 4 towers, and a working gate
          <span className="cursor-blink inline-block w-0.5 h-3.5 ml-0.5 align-middle" style={{ background: '#D4AF37' }} />
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded" style={{
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37'
        }}>
          Enter
        </span>
      </div>
    </div>
  )
}

/* ─── Feature card — with hover depth ───────────────────────────────────── */

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="reveal feature-card">
      <div className="feature-icon mb-3" style={{ color: '#71717A' }}>{icon}</div>
      <h3 className="text-base font-medium mb-1.5" style={{ color: '#FAFAFA' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>{description}</p>
    </div>
  )
}

/* ─── Pricing card ───────────────────────────────────────────────────────── */

function PricingCard({ name, price, period, features, cta, recommended }: {
  name: string; price: string; period: string; features: string[]; cta: string; recommended?: boolean
}) {
  return (
    <div
      className={`reveal flex flex-col rounded-xl p-7 pricing-card ${recommended ? 'pricing-card-recommended' : 'pricing-card-default'}`}
      style={{
        background: '#111113',
        border: recommended ? '1px solid rgba(212,175,55,0.28)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: recommended
          ? '0 0 40px rgba(212,175,55,0.07), 0 4px 24px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      <p className="text-sm font-medium mb-5" style={{ color: recommended ? '#D4AF37' : '#A1A1AA' }}>{name}</p>
      <div className="mb-6">
        <span className="text-4xl font-semibold tracking-tight" style={{ color: '#FAFAFA' }}>{price}</span>
        <span className="ml-1 text-sm" style={{ color: '#71717A' }}>{period}</span>
      </div>
      <ul className="flex-1 space-y-3 mb-7">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#A1A1AA' }}>
            <span className="mt-0.5 flex-shrink-0" style={{ color: recommended ? '#D4AF37' : '#52525B' }}>
              <IconCheck />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/editor"
        className="block text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
        style={recommended ? {
          background: '#D4AF37',
          color: '#09090b',
        } : {
          background: 'transparent',
          color: '#A1A1AA',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          if (recommended) {
            el.style.background = '#C4A030'
          } else {
            el.style.borderColor = 'rgba(255,255,255,0.18)'
            el.style.color = '#FAFAFA'
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          if (recommended) {
            el.style.background = '#D4AF37'
          } else {
            el.style.borderColor = 'rgba(255,255,255,0.08)'
            el.style.color = '#A1A1AA'
          }
        }}
      >
        {cta}
      </Link>
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
        style={{ background: '#09090b', color: '#FAFAFA' }}
      >

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6"
          style={{ minHeight: '100vh', paddingTop: '10vh', paddingBottom: '8vh' }}
        >
          {/* Radial depth gradient behind headline */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(212,175,55,0.04) 0%, transparent 70%)',
                'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 60%)',
              ].join(', '),
            }}
          />

          <div className="relative max-w-3xl mx-auto w-full">
            {/* Status pill */}
            <div
              className="reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] mb-10"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A1A1AA',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              Open beta — free to start
            </div>

            {/* Headline */}
            <h1
              className="reveal reveal-delay-1 font-semibold leading-[1.08] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)', color: '#FAFAFA' }}
            >
              Build games{' '}
              <span style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #e8c84a 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                with AI
              </span>
            </h1>

            <p
              className="reveal reveal-delay-2 text-lg leading-relaxed max-w-xl mx-auto mb-10"
              style={{ color: '#71717A' }}
            >
              Describe your game. ForjeGames generates terrain, assets, and scripts — live in Roblox Studio.
            </p>

            {/* CTA row */}
            <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <Link
                href="/editor"
                className="cta-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
                style={{
                  background: '#D4AF37',
                  color: '#09090b',
                  boxShadow: '0 0 20px rgba(212,175,55,0.2), 0 4px 12px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = '#C4A030'
                  el.style.boxShadow = '0 0 32px rgba(212,175,55,0.32), 0 6px 16px rgba(0,0,0,0.5)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = '#D4AF37'
                  el.style.boxShadow = '0 0 20px rgba(212,175,55,0.2), 0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                Start building
                <IconArrow />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
                style={{
                  color: '#A1A1AA',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#FAFAFA'
                  el.style.borderColor = 'rgba(255,255,255,0.16)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#A1A1AA'
                  el.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                View pricing
              </Link>
            </div>

            <p className="reveal reveal-delay-4 text-[13px]" style={{ color: '#52525B' }}>
              No credit card required &middot; 1,000 free tokens
            </p>
          </div>

          {/* Editor mockup — floating shadow */}
          <div
            className="reveal reveal-delay-5 relative w-full max-w-4xl mx-auto mt-16 px-2"
            style={{
              filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.45)) drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
            }}
          >
            <EditorMockup />
          </div>
        </section>

        {/* ── Social proof strip ────────────────────────────────────────── */}
        <section
          className="py-14 px-6 section-fade-down"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-[13px] mb-8 reveal" style={{ color: '#52525B', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 'inherit', fontSize: 'inherit' }}>
              Powering the next generation of Roblox creators
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 text-center">
              {[
                { value: 50000, suffix: '+', label: 'Assets generated' },
                { value: 1200,  suffix: '+', label: 'Games built'      },
                { value: 5,     suffix: '',  label: 'AI models'        },
                { value: 99,    suffix: '%', label: 'Uptime'           },
              ].map(({ value, suffix, label }, i) => (
                <div key={label} className={`reveal reveal-delay-${i + 1}`}>
                  <p className="text-2xl font-semibold mb-0.5 tabular-nums" style={{ color: '#FAFAFA' }}>
                    <AnimatedCounter target={value} suffix={suffix} />
                  </p>
                  <p className="text-xs" style={{ color: '#52525B' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-32 px-6"
          style={{ background: '#09090b' }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-20 reveal">
              <h2 className="text-4xl font-semibold tracking-tight mb-4" style={{ color: '#FAFAFA' }}>
                Every tool you need.
              </h2>
              <p className="text-lg max-w-md" style={{ color: '#71717A' }}>
                From a single sentence to a full game world.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
              {[
                {
                  icon: <IconMic />,
                  title: 'Voice input',
                  description: 'Speak your vision. ForjeGames translates natural language into game elements in seconds.',
                },
                {
                  icon: <IconImage />,
                  title: 'Image to map',
                  description: 'Upload a photo or sketch. AI analyzes it and generates a matching terrain layout with assets placed.',
                },
                {
                  icon: <IconCube />,
                  title: '3D generation',
                  description: 'Generate custom models with Meshy AI. PBR textures applied automatically. Game-ready in one click.',
                },
                {
                  icon: <IconSync />,
                  title: 'Live Studio sync',
                  description: 'Changes appear in your Roblox Studio place instantly. Every operation is undoable.',
                },
                {
                  icon: <IconBrain />,
                  title: 'AI agents',
                  description: 'Claude, GPT-4o, Gemini. Each model optimized for different tasks. Switch mid-conversation.',
                },
                {
                  icon: <IconPlug />,
                  title: 'Marketplace',
                  description: 'Search 500K+ Roblox assets. Browse, preview, and insert models directly into your scene.',
                },
              ].map(({ icon, title, description }, i) => (
                <div
                  key={title}
                  className={`reveal reveal-delay-${Math.min(i + 1, 6)}`}
                >
                  <Feature icon={icon} title={title} description={description} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="py-32 px-6 section-dark">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20 reveal">
              <h2 className="text-4xl font-semibold tracking-tight mb-4" style={{ color: '#FAFAFA' }}>
                How it works.
              </h2>
              <p className="text-lg" style={{ color: '#71717A' }}>
                Three steps. No setup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {[
                {
                  n: '01',
                  title: 'Describe',
                  description: 'Type, speak, or upload an image. Be as specific or as vague as you want.',
                },
                {
                  n: '02',
                  title: 'AI builds',
                  description: 'Terrain, assets, scripts, lighting — all generated automatically and pushed to Studio.',
                },
                {
                  n: '03',
                  title: 'Play',
                  description: 'Test in Studio, iterate with AI, or publish directly to Roblox.',
                },
              ].map(({ n, title, description }, i) => (
                <div key={n} className={`reveal reveal-delay-${i + 1} flex gap-5`}>
                  <span
                    className="flex-shrink-0 text-5xl font-light leading-none select-none"
                    style={{ color: 'rgba(255,255,255,0.07)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {n}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#FAFAFA' }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Editor preview (full-width showcase) ──────────────────────── */}
        <section
          className="py-32 px-6 section-fade-up"
          style={{ background: 'linear-gradient(to bottom, #0c0c0e 0%, #09090b 100%)' }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 reveal">
              <h2 className="text-4xl font-semibold tracking-tight mb-4" style={{ color: '#FAFAFA' }}>
                The editor.
              </h2>
              <p className="text-lg max-w-md mx-auto" style={{ color: '#71717A' }}>
                Chat on the left. Your Roblox world on the right. Changes are live.
              </p>
            </div>
            <div
              className="reveal"
              style={{
                filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.45)) drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
              }}
            >
              <EditorMockup />
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="py-32 px-6 section-dark">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16 reveal">
              <h2 className="text-4xl font-semibold tracking-tight mb-4" style={{ color: '#FAFAFA' }}>
                Pricing.
              </h2>
              <p className="text-lg" style={{ color: '#71717A' }}>
                Start free. Scale when you&rsquo;re ready.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
              <PricingCard
                name="Free"
                price="$0"
                period="/forever"
                features={[
                  '1,000 tokens',
                  'All AI models',
                  'Marketplace access',
                  'Community support',
                ]}
                cta="Get started"
              />
              <PricingCard
                name="Creator"
                price="$15"
                period="/month"
                features={[
                  '50,000 tokens / month',
                  'Priority AI processing',
                  'Custom mesh generation',
                  'Studio plugin sync',
                  'Email support',
                ]}
                cta="Start creating"
                recommended
              />
              <PricingCard
                name="Studio"
                price="$50"
                period="/month"
                features={[
                  '200,000 tokens / month',
                  'Team collaboration',
                  'API access + SDKs',
                  'Game DNA analysis',
                  'Priority support',
                ]}
                cta="Go pro"
              />
            </div>

            <p className="mt-8 text-[13px] reveal" style={{ color: '#52525B' }}>
              10% of every payment goes to charity.{' '}
              <Link href="/pricing" className="transition-colors duration-200 hover:underline" style={{ color: '#A1A1AA' }}>
                Full pricing details
              </Link>
            </p>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <section
          className="py-40 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #0c0c0e 0%, #09090b 100%)' }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(212,175,55,0.05) 0%, transparent 60%)',
            }}
          />
          <div className="relative max-w-lg mx-auto text-center">
            <h2 className="reveal text-4xl sm:text-5xl font-semibold tracking-tight mb-4" style={{ color: '#FAFAFA' }}>
              Ready to build?
            </h2>
            <p className="reveal reveal-delay-1 text-lg mb-10" style={{ color: '#71717A' }}>
              Your first 1,000 tokens are free.
            </p>
            <Link
              href="/editor"
              className="reveal reveal-delay-2 cta-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
              style={{
                background: '#D4AF37',
                color: '#09090b',
                boxShadow: '0 0 20px rgba(212,175,55,0.2), 0 4px 12px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#C4A030'
                el.style.boxShadow = '0 0 32px rgba(212,175,55,0.32), 0 6px 16px rgba(0,0,0,0.5)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#D4AF37'
                el.style.boxShadow = '0 0 20px rgba(212,175,55,0.2), 0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              Start building
              <IconArrow />
            </Link>
          </div>
        </section>

      </div>
    </>
  )
}
