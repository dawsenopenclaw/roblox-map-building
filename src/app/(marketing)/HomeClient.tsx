'use client'

import Link from 'next/link'

/* ─── Floating particle dot ──────────────────────────────────────────────── */
function Particle({
  size,
  top,
  left,
  delay,
  animClass,
}: {
  size: number
  top: string
  left: string
  delay: string
  animClass: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full bg-[#D4AF37] ${animClass}`}
      style={{
        width: size,
        height: size,
        top,
        left,
        animationDelay: delay,
        filter: 'blur(1px)',
      }}
    />
  )
}

/* ─── Editor mockup ──────────────────────────────────────────────────────── */
function EditorMockup() {
  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden mt-14"
      style={{
        background: '#0d1117',
        border: '1px solid rgba(212,175,55,0.22)',
        boxShadow: '0 0 60px rgba(212,175,55,0.10), 0 32px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
        <span
          className="ml-3 text-xs font-mono"
          style={{
            color: 'rgba(212,175,55,0.7)',
            background: 'rgba(212,175,55,0.08)',
            padding: '2px 10px',
            borderRadius: 4,
          }}
        >
          ForjeGames Editor — castle_map.rbxl
        </span>
        <div className="ml-auto flex items-center gap-1">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11 }}
          >
            Connected
          </span>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex" style={{ height: 280 }}>
        {/* Left sidebar — game tree */}
        <div
          className="flex-shrink-0 py-3"
          style={{
            width: 168,
            background: '#0d1117',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12,
          }}
        >
          <p
            className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(212,175,55,0.5)' }}
          >
            Explorer
          </p>
          {[
            { indent: 0, icon: '🗂', label: 'Workspace',   color: '#9CA3AF' },
            { indent: 1, icon: '🏰', label: 'Castle',      color: '#FFB81C' },
            { indent: 2, icon: '🧱', label: 'Walls',       color: '#9CA3AF' },
            { indent: 2, icon: '🗼', label: 'Towers ×4',   color: '#9CA3AF' },
            { indent: 2, icon: '🚪', label: 'Gate',        color: '#9CA3AF' },
            { indent: 1, icon: '🌲', label: 'Terrain',     color: '#10B981' },
            { indent: 2, icon: '⛰️',  label: 'Heightmap',  color: '#9CA3AF' },
            { indent: 1, icon: '💡', label: 'Lighting',    color: '#3B82F6' },
            { indent: 0, icon: '📜', label: 'ServerScript', color: '#9CA3AF' },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-0.5 hover:bg-white/5 cursor-pointer"
              style={{ paddingLeft: 12 + row.indent * 14, color: row.color }}
            >
              <span style={{ fontSize: 11 }}>{row.icon}</span>
              <span style={{ fontSize: 12 }}>{row.label}</span>
            </div>
          ))}
        </div>

        {/* Main canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Grid */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(212,175,55,0.035) 1px, transparent 1px),
                linear-gradient(90deg, rgba(212,175,55,0.035) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Castle blocks — CSS art */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Ground */}
            <div className="relative" style={{ width: 260, height: 180 }}>
              {/* Towers */}
              {[0, 200].map((x) => (
                <div
                  key={x}
                  className="absolute"
                  style={{
                    left: x, bottom: 50, width: 52, height: 110,
                    background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '3px 3px 0 0',
                  }}
                >
                  {/* Battlements */}
                  {[0,12,24,36].map((bx) => (
                    <div key={bx} className="absolute"
                      style={{ left: bx+2, top: -10, width: 8, height: 10,
                        background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ))}
                  {/* Window */}
                  <div className="absolute" style={{
                    left: 14, top: 28, width: 24, height: 32,
                    background: 'rgba(59,130,246,0.25)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 0 8px rgba(59,130,246,0.3)',
                  }} />
                </div>
              ))}
              {/* Main wall */}
              <div className="absolute" style={{
                left: 52, bottom: 50, right: 52 - 260 + 208, height: 70,
                background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Battlements on wall */}
                {[0,12,24,36,48,60,68].map((bx) => (
                  <div key={bx} className="absolute"
                    style={{ left: bx+4, top: -10, width: 8, height: 10,
                      background: '#4b5563', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                ))}
                {/* Gate */}
                <div className="absolute" style={{
                  left: '50%', transform: 'translateX(-50%)', bottom: 0,
                  width: 36, height: 48,
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '18px 18px 0 0',
                }}>
                  {/* Portcullis bars */}
                  {[8,16,24].map((bx) => (
                    <div key={bx} className="absolute" style={{
                      left: bx, top: 4, width: 1, height: 30, background: 'rgba(212,175,55,0.5)'
                    }} />
                  ))}
                </div>
              </div>
              {/* Ground terrain */}
              <div className="absolute" style={{
                left: -10, bottom: 30, right: -10, height: 28,
                background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                borderRadius: 4,
              }}>
                {/* Terrain bumps */}
                {[-8,20,60,110,160,200,230].map((tx) => (
                  <div key={tx} className="absolute" style={{
                    left: tx, top: -5, width: 24, height: 10,
                    background: '#16a34a', borderRadius: '50%',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Top-right overlay — AI status */}
          <div
            className="absolute top-3 right-3 text-xs px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.25)',
              color: '#FFB81C',
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFB81C] animate-glow-pulse mr-1.5" />
            AI building…
          </div>
        </div>

        {/* Right panel — properties */}
        <div
          className="flex-shrink-0 py-3 flex flex-col gap-3"
          style={{
            width: 148,
            background: '#0d1117',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11,
          }}
        >
          <p
            className="px-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(212,175,55,0.5)' }}
          >
            Properties
          </p>
          {[
            { label: 'Parts', value: '2,847' },
            { label: 'Triangles', value: '14.2k' },
            { label: 'Textures', value: '12' },
            { label: 'Scripts', value: '4' },
          ].map((p) => (
            <div key={p.label} className="px-3">
              <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 1 }}>{p.label}</p>
              <p style={{ color: '#F9FAFB', fontWeight: 600 }}>{p.value}</p>
            </div>
          ))}
          <div className="mx-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>AI Tokens</p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 3, height: 4 }}>
              <div style={{ background: '#D4AF37', borderRadius: 3, height: 4, width: '62%' }} />
            </div>
            <p style={{ color: 'rgba(212,175,55,0.7)', marginTop: 3 }}>620 / 1000</p>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: '#161b22', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span style={{ color: 'rgba(212,175,55,0.6)', fontSize: 13 }}>›</span>
        <span
          className="flex-1 text-sm font-mono"
          style={{ color: '#E5E7EB' }}
        >
          build a castle with stone walls, 4 towers, and a working gate
          <span
            className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-glow-pulse"
            style={{ background: '#FFB81C' }}
          />
        </span>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{
            background: 'rgba(212,175,55,0.15)',
            color: '#FFB81C',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          ↵ Enter
        </span>
      </div>
    </div>
  )
}

/* ─── Voice feature mockup ────────────────────────────────────────────────── */
function VoiceMockup() {
  const bars = [4, 7, 12, 9, 15, 11, 8, 14, 10, 6, 13, 9, 16, 7, 11, 5, 14, 8, 12, 6]
  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Waveform */}
      <div className="flex items-center justify-center gap-0.5 h-10 mb-3">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-full animate-glow-pulse"
            style={{
              width: 3,
              height: h,
              background: i > 6 && i < 14
                ? 'linear-gradient(180deg, #FFB81C, #D4AF37)'
                : 'rgba(212,175,55,0.25)',
              animationDelay: `${i * 0.07}s`,
              animationDuration: `${0.6 + (i % 3) * 0.2}s`,
            }}
          />
        ))}
      </div>
      {/* Live transcript */}
      <div
        className="rounded-lg px-3 py-2 text-xs font-mono"
        style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}
      >
        <span className="text-[#FFB81C]">Transcript:</span>
        <span className="text-gray-300 ml-2">"add a volcano in the north with lava particles"</span>
        <span
          className="inline-block w-1 h-3 ml-0.5 align-middle"
          style={{ background: '#FFB81C', borderRadius: 1 }}
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span
          className="w-1.5 h-1.5 rounded-full animate-glow-pulse"
          style={{ background: '#EF4444' }}
        />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Recording · 0:04</span>
        <span className="ml-auto text-xs" style={{ color: '#10B981' }}>8 languages</span>
      </div>
    </div>
  )
}

/* ─── DNA feature mockup ──────────────────────────────────────────────────── */
function DNAMockup() {
  const traits = [
    { label: 'Engagement',    pct: 94, color: '#10B981' },
    { label: 'Monetization',  pct: 71, color: '#D4AF37' },
    { label: 'Retention',     pct: 88, color: '#3B82F6' },
    { label: 'Virality',      pct: 65, color: '#A78BFA' },
  ]
  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white">Game DNA Score</span>
        <span
          className="text-lg font-bold"
          style={{ color: '#FFB81C' }}
        >
          83
          <span className="text-xs text-gray-400 font-normal ml-0.5">/100</span>
        </span>
      </div>
      <div className="space-y-2.5">
        {traits.map((t) => (
          <div key={t.label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t.label}</span>
              <span style={{ color: t.color, fontWeight: 600 }}>{t.pct}%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${t.pct}%`,
                  background: `linear-gradient(90deg, ${t.color}99, ${t.color})`,
                  boxShadow: `0 0 6px ${t.color}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Marketplace feature mockup ─────────────────────────────────────────── */
function MarketplaceMockup() {
  const templates = [
    { name: 'Obby World',   icon: '🏃', rating: '4.9', uses: '12k' },
    { name: 'Tycoon Base',  icon: '🏭', rating: '4.8', uses: '9k'  },
    { name: 'RPG Starter',  icon: '⚔️',  rating: '4.7', uses: '7k'  },
    { name: 'Race Track',   icon: '🏎️',  rating: '4.9', uses: '5k'  },
  ]
  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white">Templates</span>
        <span className="text-xs" style={{ color: '#D4AF37' }}>248 total</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => (
          <div
            key={t.name}
            className="rounded-lg p-2.5 hover:border-[rgba(212,175,55,0.3)] transition-colors cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="text-lg mb-1">{t.icon}</div>
            <p className="text-xs font-medium text-white truncate">{t.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px]" style={{ color: '#FFB81C' }}>★ {t.rating}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.uses}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature card ────────────────────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
  mockup,
}: {
  icon: React.ReactNode
  title: string
  description: string
  mockup: React.ReactNode
}) {
  return (
    <div
      className="group rounded-2xl p-6 flex flex-col transition-all duration-300 cursor-default"
      style={{
        background: 'rgba(17,24,39,0.6)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.border = '1px solid rgba(212,175,55,0.35)'
        el.style.boxShadow = '0 0 32px rgba(212,175,55,0.10), 0 8px 32px rgba(0,0,0,0.4)'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.border = '1px solid rgba(255,255,255,0.07)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
        style={{
          background: 'rgba(212,175,55,0.10)',
          border: '1px solid rgba(212,175,55,0.22)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
      {mockup}
    </div>
  )
}

/* ─── Step card ───────────────────────────────────────────────────────────── */
function StepCard({
  number,
  icon,
  title,
  description,
  isLast,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  isLast?: boolean
}) {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Connector line */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-14 left-1/2 w-full h-px"
          style={{
            background: 'linear-gradient(90deg, rgba(212,175,55,0.4), rgba(212,175,55,0.1))',
            transform: 'translateX(50%)',
          }}
        />
      )}

      {/* Icon circle */}
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center mb-6 relative z-10"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 70%)',
          border: '1px solid rgba(212,175,55,0.3)',
          boxShadow: '0 0 32px rgba(212,175,55,0.12)',
        }}
      >
        {icon}
        {/* Step number badge */}
        <span
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #D4AF37, #FFB81C)',
            color: '#030712',
          }}
        >
          {number}
        </span>
      </div>

      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed max-w-xs">{description}</p>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function HomeClient() {
  return (
    <div className="relative flex flex-col items-center overflow-hidden" style={{ background: '#030712' }}>

      {/* ── Subtle grid background ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ═══════════════════════ HERO ═══════════════════════════════════════ */}
      <section
        className="relative w-full flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center"
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full animate-glow-pulse"
          style={{
            width: 700,
            height: 700,
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -54%)',
            background:
              'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(255,184,28,0.05) 45%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />

        {/* Floating particles */}
        <Particle size={5}  top="18%"  left="10%"  delay="0s"    animClass="animate-float" />
        <Particle size={3}  top="25%"  left="84%"  delay="1.2s"  animClass="animate-float-slow" />
        <Particle size={6}  top="62%"  left="6%"   delay="0.6s"  animClass="animate-float-x" />
        <Particle size={4}  top="70%"  left="90%"  delay="2s"    animClass="animate-float" />
        <Particle size={3}  top="40%"  left="93%"  delay="0.3s"  animClass="animate-float-slow" />
        <Particle size={5}  top="12%"  left="68%"  delay="1.8s"  animClass="animate-float-x" />
        <Particle size={3}  top="78%"  left="44%"  delay="0.9s"  animClass="animate-float" />
        <Particle size={4}  top="52%"  left="18%"  delay="2.4s"  animClass="animate-float-slow" />

        <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">

          {/* Logo mark */}
          <div
            className="w-18 h-18 rounded-2xl flex items-center justify-center mb-8"
            style={{
              width: 72, height: 72,
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 32px rgba(212,175,55,0.18)',
            }}
          >
            <svg className="w-9 h-9" viewBox="0 0 28 28" fill="none" style={{ color: '#FFB81C' }}>
              <path d="M14 4L4 10v8l10 6 10-6v-8L14 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M4 10l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M14 16v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.28)',
              color: '#D4AF37',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-glow-pulse"
              style={{ background: '#FFB81C' }}
            />
            AI-Powered Game Builder
          </div>

          {/* Headline */}
          <h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold mb-6 animate-gradient-x"
            style={{
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              background: 'linear-gradient(90deg, #D4AF37 0%, #FFB81C 35%, #FFF0A0 55%, #FFB81C 75%, #D4AF37 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ForjeGames
          </h1>

          {/* Tagline */}
          <p
            className="text-xl sm:text-2xl md:text-3xl text-white mb-4 max-w-2xl font-semibold"
            style={{ lineHeight: 1.4 }}
          >
            Build Roblox Games with AI —<br className="hidden sm:block" />
            From Idea to Playable in Minutes
          </p>
          <p className="text-base text-gray-200 mb-10 max-w-lg leading-relaxed">
            Type what you want. Watch it appear. No scripting. No Studio expertise required.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
            {/* Primary CTA */}
            <div className="relative group">
              <div
                aria-hidden="true"
                className="absolute -inset-[2px] rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, #D4AF37, #FFB81C, #FFF0A0, #D4AF37)',
                  backgroundSize: '200% 100%',
                  animation: 'border-spin 2.5s linear infinite',
                  filter: 'blur(6px)',
                }}
              />
              <Link
                href="/editor"
                className="relative inline-flex items-center gap-2.5 font-bold text-lg px-10 py-4 rounded-[13px] transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
                  color: '#030712',
                  boxShadow: '0 0 24px rgba(212,175,55,0.40), 0 4px 20px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 44px rgba(212,175,55,0.70), 0 4px 28px rgba(0,0,0,0.6)'
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 0 24px rgba(212,175,55,0.40), 0 4px 20px rgba(0,0,0,0.5)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                Start Building Free
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Secondary CTA */}
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-base font-medium px-6 py-4 rounded-[13px] transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#9CA3AF',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.color = '#fff'
                el.style.borderColor = 'rgba(255,255,255,0.25)'
                el.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.color = '#9CA3AF'
                el.style.borderColor = 'rgba(255,255,255,0.12)'
                el.style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 8v4M10 6h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              See how it works
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-sm text-gray-300 mb-10">
            1,000 free tokens&nbsp;&nbsp;·&nbsp;&nbsp;No credit card&nbsp;&nbsp;·&nbsp;&nbsp;Works with Roblox Studio
          </p>

          {/* Editor mockup */}
          <EditorMockup />

          {/* Social proof stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 mb-4">
            {[
              { stat: '50,000+', label: 'Games Created' },
              { stat: '12 min',  label: 'Avg. to Playable' },
              { stat: '94%',     label: 'User Satisfaction' },
              { stat: 'Free',    label: 'To Start' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="text-2xl font-extrabold"
                  style={{
                    background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.stat}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Availability strip */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Available as</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 px-5 py-2.5 rounded-xl transition-all duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(212,175,55,0.35)'
                  el.style.background = 'rgba(212,175,55,0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(255,255,255,0.1)'
                  el.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                {/* Globe icon */}
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" style={{ color: '#D4AF37' }}>
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 2c-2 3-2 13 0 16M10 2c2 3 2 13 0 16M2 10h16" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Web Editor
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 px-5 py-2.5 rounded-xl transition-all duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(212,175,55,0.35)'
                  el.style.background = 'rgba(212,175,55,0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(255,255,255,0.1)'
                  el.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                {/* Download icon */}
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" style={{ color: '#D4AF37' }}>
                  <path d="M10 3v9m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 14v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Desktop App
              </Link>
            </div>
            <p className="text-xs text-gray-500">Desktop connects directly to Roblox Studio.</p>
          </div>

        </div>
      </section>

      {/* Section divider */}
      <div className="w-full max-w-5xl px-6 my-2">
        <div className="divider-gold" />
      </div>

      {/* ═══════════════════════ FEATURES ════════════════════════════════════ */}
      <section className="relative w-full max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.22)',
              color: '#D4AF37',
            }}
          >
            What You Get
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-white mb-5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Everything you need to<br />
            <span style={{ color: '#FFB81C' }}>ship faster</span>
          </h2>
          <p className="text-gray-200 text-lg max-w-xl mx-auto leading-relaxed">
            ForjeGames handles the hard parts — scripting, terrain, assets — so you can focus on making your game fun.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: '#FFB81C' }}>
                <path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M19 10a7 7 0 01-14 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
            title="Voice-to-Build"
            description="Speak your idea and watch the game build itself. Supports 8 languages with live transcript feedback."
            mockup={<VoiceMockup />}
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: '#FFB81C' }}>
                <path d="M12 3L3 8l9 5 9-5-9-5zM3 16l9 5 9-5M3 12l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            }
            title="Game DNA"
            description="AI analyzes your game's engagement, monetization, and retention potential with a single score."
            mockup={<DNAMockup />}
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: '#FFB81C' }}>
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
            title="Asset Marketplace"
            description="248+ professional templates. One click to deploy a full game world. Rated by real developers."
            mockup={<MarketplaceMockup />}
          />
        </div>
      </section>

      {/* Section divider */}
      <div className="w-full max-w-5xl px-6 my-2">
        <div className="divider-gold" />
      </div>

      {/* ═══════════════════════ HOW IT WORKS ════════════════════════════════ */}
      <section className="relative w-full max-w-5xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.22)',
              color: '#D4AF37',
            }}
          >
            How It Works
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-white mb-5"
            style={{ letterSpacing: '-0.03em' }}
          >
            Three steps to your<br />
            <span style={{ color: '#FFB81C' }}>first Roblox game</span>
          </h2>
          <p className="text-gray-200 text-lg max-w-xl mx-auto leading-relaxed">
            No experience needed. If you can describe a game, you can build one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-6">
          <StepCard
            number={1}
            icon={
              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" style={{ color: '#FFB81C' }}>
                <rect x="8" y="14" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M16 24h16M16 31h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="36" cy="12" r="6" fill="rgba(212,175,55,0.15)" stroke="currentColor" strokeWidth="2" />
                <path d="M33 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Describe Your Game"
            description={"Type or say what you want to build. \"Medieval castle with lava moat\" — that's all it takes."}
          />
          <StepCard
            number={2}
            icon={
              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" style={{ color: '#FFB81C' }}>
                <path d="M24 8L8 18v12l16 8 16-8V18L24 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M8 18l16 8 16-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M24 26v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="24" r="4" fill="rgba(212,175,55,0.25)" />
              </svg>
            }
            title="AI Builds It Live"
            description="Watch terrain, structures, scripts, and lighting appear in real-time. Average build: under 12 minutes."
          />
          <StepCard
            number={3}
            icon={
              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" style={{ color: '#FFB81C' }}>
                <path d="M24 8v32M14 18l10-10 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 38h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="36" cy="34" r="5" fill="rgba(16,185,129,0.15)" stroke="#10B981" strokeWidth="2" />
                <path d="M33.5 34l1.5 1.5 3-3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Publish to Roblox"
            description="One click exports and publishes directly to Roblox Studio. Your game goes live in minutes."
            isLast
          />
        </div>
      </section>

      {/* Section divider */}
      <div className="w-full max-w-5xl px-6 my-2">
        <div className="divider-gold" />
      </div>

      {/* ═══════════════════════ BOTTOM CTA ══════════════════════════════════ */}
      <section className="relative w-full px-4 py-28 overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-[600px] h-[600px] rounded-full animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%)',
              filter: 'blur(20px)',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.28)',
              color: '#D4AF37',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] animate-glow-pulse" />
            Ready to build?
          </div>

          <h2
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.05 }}
          >
            Try it now.
          </h2>

          <p
            className="text-xl sm:text-2xl text-white mb-4 font-medium leading-relaxed"
          >
            Type <span style={{ color: '#FFB81C', fontStyle: 'italic' }}>"build a castle"</span> and watch
            <br className="hidden sm:block" /> AI do the rest.
          </p>
          <p className="text-base text-gray-200 mb-10 max-w-md leading-relaxed">
            1,000 free tokens on signup. No credit card. No scripting knowledge needed.
            Your game will be ready before you finish your coffee.
          </p>

          {/* CTA */}
          <div className="relative group mb-5">
            <div
              aria-hidden="true"
              className="absolute -inset-[3px] rounded-[16px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(90deg, #D4AF37, #FFB81C, #FFF0A0, #D4AF37)',
                backgroundSize: '200% 100%',
                animation: 'border-spin 2.5s linear infinite',
                filter: 'blur(8px)',
              }}
            />
            <Link
              href="/editor"
              className="relative inline-flex items-center gap-3 font-extrabold text-xl px-12 py-5 rounded-[14px] transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
                color: '#030712',
                boxShadow: '0 0 30px rgba(212,175,55,0.50), 0 8px 24px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 0 56px rgba(212,175,55,0.80), 0 8px 32px rgba(0,0,0,0.6)'
                el.style.transform = 'translateY(-3px) scale(1.02)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 0 30px rgba(212,175,55,0.50), 0 8px 24px rgba(0,0,0,0.5)'
                el.style.transform = 'translateY(0) scale(1)'
              }}
            >
              Start Building Free
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-gray-300">
            Join 50,000+ creators already building on ForjeGames
          </p>
        </div>
      </section>

    </div>
  )
}
