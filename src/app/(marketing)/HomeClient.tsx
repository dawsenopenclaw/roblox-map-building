'use client'

import React from 'react'
import Link from 'next/link'

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function IconMic({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function IconImage({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function IconCube({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function IconSearch({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconBrain({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a6 6 0 0 0-6 6c0 1.66.68 3.16 1.76 4.24L12 16l4.24-3.76A6 6 0 0 0 12 2Z" />
      <path d="M12 16v6" />
      <path d="M8 22h8" />
    </svg>
  )
}

function IconPlug({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconArrow({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconStar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  )
}

/* ─── Editor Mockup ──────────────────────────────────────────────────────── */

function EditorMockup() {
  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: '#0d1117',
        border: '1px solid rgba(212,175,55,0.18)',
        boxShadow: '0 0 80px rgba(212,175,55,0.08), 0 40px 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
        <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
        <span className="ml-3 text-xs font-mono text-[rgba(212,175,55,0.6)]">
          ForjeGames Editor
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10B981]">
            Connected
          </span>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex" style={{ height: 260 }}>
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-[160px] flex-shrink-0 py-3 border-r border-white/[0.04]" style={{ background: '#0d1117' }}>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(212,175,55,0.4)]">
            Explorer
          </p>
          {[
            { indent: 0, icon: '📂', label: 'Workspace', color: '#6B7280' },
            { indent: 1, icon: '🏰', label: 'Castle', color: '#FFB81C' },
            { indent: 2, icon: '🧱', label: 'Walls', color: '#6B7280' },
            { indent: 2, icon: '🗼', label: 'Towers x4', color: '#6B7280' },
            { indent: 1, icon: '🌲', label: 'Terrain', color: '#10B981' },
            { indent: 1, icon: '💡', label: 'Lighting', color: '#3B82F6' },
            { indent: 0, icon: '📜', label: 'Scripts', color: '#6B7280' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-[3px] text-[11px]" style={{ paddingLeft: 12 + row.indent * 12, color: row.color }}>
              <span className="text-[10px]">{row.icon}</span>
              <span>{row.label}</span>
            </div>
          ))}
        </div>

        {/* Main viewport */}
        <div className="flex-1 relative overflow-hidden">
          {/* Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Castle CSS art */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 240, height: 160 }}>
              {/* Towers */}
              {[0, 184].map((x) => (
                <div key={x} className="absolute" style={{
                  left: x, bottom: 40, width: 48, height: 100,
                  background: 'linear-gradient(180deg, #374151, #1f2937)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '2px 2px 0 0',
                }}>
                  {[0, 11, 22, 33].map((bx) => (
                    <div key={bx} className="absolute" style={{ left: bx + 2, top: -8, width: 7, height: 8, background: '#374151', border: '1px solid rgba(255,255,255,0.08)' }} />
                  ))}
                  <div className="absolute" style={{ left: 12, top: 24, width: 22, height: 28, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '11px 11px 0 0', boxShadow: '0 0 6px rgba(59,130,246,0.2)' }} />
                </div>
              ))}
              {/* Wall */}
              <div className="absolute" style={{
                left: 48, bottom: 40, width: 136, height: 64,
                background: 'linear-gradient(180deg, #4b5563, #374151)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {/* Gate */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-10 bg-black/70 border border-white/10" style={{ borderRadius: '16px 16px 0 0' }}>
                  {[8, 14, 20].map((bx) => (
                    <div key={bx} className="absolute" style={{ left: bx - 6, top: 3, width: 1, height: 26, background: 'rgba(212,175,55,0.4)' }} />
                  ))}
                </div>
              </div>
              {/* Ground */}
              <div className="absolute -left-2 -right-2 bottom-6 h-6 rounded bg-gradient-to-b from-green-800 to-green-900" />
            </div>
          </div>

          {/* AI status badge */}
          <div className="absolute top-3 right-3 text-[11px] px-2.5 py-1.5 rounded-lg bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] text-[#FFB81C]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFB81C] mr-1.5 animate-pulse" />
            AI building...
          </div>
        </div>

        {/* Right panel */}
        <div className="hidden lg:flex flex-col w-[140px] flex-shrink-0 py-3 border-l border-white/[0.04]" style={{ background: '#0d1117' }}>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(212,175,55,0.4)]">Properties</p>
          {[
            { label: 'Parts', value: '2,847' },
            { label: 'Triangles', value: '14.2k' },
            { label: 'Scripts', value: '4' },
          ].map((p) => (
            <div key={p.label} className="px-3 mb-2">
              <p className="text-[10px] text-white/30">{p.label}</p>
              <p className="text-[12px] font-semibold text-white/90">{p.value}</p>
            </div>
          ))}
          <div className="mx-3 mt-1 pt-2 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/30 mb-1">Tokens</p>
            <div className="h-1 rounded-full bg-white/[0.08]">
              <div className="h-1 rounded-full bg-[#D4AF37]" style={{ width: '62%' }} />
            </div>
            <p className="text-[10px] text-[rgba(212,175,55,0.6)] mt-1">620 / 1,000</p>
          </div>
        </div>
      </div>

      {/* Command bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04]" style={{ background: '#161b22' }}>
        <span className="text-[rgba(212,175,55,0.5)] text-sm font-mono">&gt;</span>
        <span className="flex-1 text-sm font-mono text-[#E5E7EB] truncate">
          build a castle with stone walls, 4 towers, and a working gate
          <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-[#FFB81C] animate-pulse" />
        </span>
        <span className="text-[10px] px-2 py-1 rounded bg-[rgba(212,175,55,0.12)] text-[#FFB81C] border border-[rgba(212,175,55,0.2)]">
          Enter
        </span>
      </div>
    </div>
  )
}

/* ─── Feature Card ───────────────────────────────────────────────────────── */

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div
      className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#141414',
        border: '1px solid #2a2a2a',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2a2a'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[rgba(212,175,55,0.08)] text-[#D4AF37]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-[#9CA3AF]">{description}</p>
    </div>
  )
}

/* ─── Step Card ──────────────────────────────────────────────────────────── */

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4 bg-[rgba(212,175,55,0.1)] text-[#D4AF37] border border-[rgba(212,175,55,0.2)]">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#9CA3AF] max-w-[260px]">{description}</p>
    </div>
  )
}

/* ─── Pricing Card ───────────────────────────────────────────────────────── */

function PricingCard({ name, price, period, features, cta, featured }: {
  name: string; price: string; period: string; features: string[]; cta: string; featured?: boolean
}) {
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col"
      style={{
        background: featured ? '#1c1c1c' : '#141414',
        border: featured ? '1px solid rgba(212,175,55,0.3)' : '1px solid #2a2a2a',
        boxShadow: featured ? '0 0 40px rgba(212,175,55,0.08)' : 'none',
      }}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#D4AF37] text-black">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-sm text-[#6B7280]">{period}</span>
      </div>
      <ul className="flex-1 space-y-3 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#B0B0B0]">
            <IconCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/editor"
        className="block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200"
        style={{
          background: featured ? 'linear-gradient(135deg, #D4AF37, #FFB81C)' : 'transparent',
          color: featured ? '#030712' : '#D4AF37',
          border: featured ? 'none' : '1px solid rgba(212,175,55,0.3)',
        }}
      >
        {cta}
      </Link>
    </div>
  )
}

/* ─── Main Landing Page ──────────────────────────────────────────────────── */

export default function HomeClient() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,10,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB81C)', color: '#030712' }}>
              F
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">ForjeGames</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">Docs</Link>
            <Link href="/download" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">Download</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-[#9CA3AF] hover:text-white transition-colors px-3 py-2">Sign in</Link>
            <Link
              href="/editor"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB81C)', color: '#030712' }}
            >
              Open Editor
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 60%)',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.15)] text-[#D4AF37]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Now in open beta
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Build Roblox Games</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB81C, #FFF0A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with AI
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe what you want to build. ForjeGames generates terrain, assets, scripts, and full game worlds — directly in Roblox Studio.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2.5 font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #FFB81C)',
                color: '#030712',
                boxShadow: '0 0 30px rgba(212,175,55,0.3), 0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              Open Editor — Free
              <IconArrow className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 text-[#D4AF37] border border-[rgba(212,175,55,0.25)] hover:bg-[rgba(212,175,55,0.05)]"
            >
              View Pricing
            </Link>
          </div>

          <p className="text-sm text-[#6B7280]">
            No credit card required &middot; 1,000 free tokens &middot; Cancel anytime
          </p>

          {/* Editor mockup */}
          <div className="mt-16">
            <EditorMockup />
          </div>
        </div>
      </section>

      {/* ── Social proof ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">Assets Generated</p>
            </div>
            <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
            <div>
              <p className="text-2xl font-bold text-white">1,200+</p>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">Maps Built</p>
            </div>
            <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
            <div>
              <p className="text-2xl font-bold text-white">5</p>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">AI Models</p>
            </div>
            <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <IconStar key={i} className="w-4 h-4 text-[#D4AF37]" />
                ))}
              </div>
              <p className="text-sm font-semibold text-white ml-1">4.9</p>
              <p className="text-xs text-[#6B7280] ml-1">rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need to build</h2>
            <p className="text-lg text-[#9CA3AF] max-w-xl mx-auto">
              From a single command to a full game world. Every tool, one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<IconMic />}
              title="Voice to Game"
              description="Speak your vision — terrain, buildings, NPCs. ForjeGames translates your words into playable game elements in seconds."
            />
            <FeatureCard
              icon={<IconImage />}
              title="Image to Map"
              description="Upload a photo, sketch, or reference image. AI analyzes it and generates a matching terrain layout with assets placed."
            />
            <FeatureCard
              icon={<IconCube />}
              title="3D Mesh Generation"
              description="Generate custom 3D models with Meshy AI. PBR textures applied automatically via Fal. Game-ready in one click."
            />
            <FeatureCard
              icon={<IconSearch />}
              title="500K+ Marketplace Assets"
              description="Search the entire Roblox asset marketplace. Browse, preview, and insert models directly into your scene."
            />
            <FeatureCard
              icon={<IconBrain />}
              title="Multi-Model AI"
              description="Choose your engine — Claude, GPT-4o, Gemini, Grok. Each optimized for different tasks. Switch models mid-conversation."
            />
            <FeatureCard
              icon={<IconPlug />}
              title="Studio Plugin"
              description="Real-time sync with Roblox Studio. Changes appear in your place instantly. Every operation is undoable."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#0d0d0d' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-lg text-[#9CA3AF]">Three steps. Zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines (hidden on mobile) */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-[rgba(212,175,55,0.3)] via-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.3)]" />

            <StepCard
              number={1}
              title="Describe"
              description="Type, speak, or upload an image of what you want to build. Be as specific or vague as you want."
            />
            <StepCard
              number={2}
              title="AI Builds"
              description="ForjeGames generates terrain, places assets, writes scripts, and configures lighting — all automatically."
            />
            <StepCard
              number={3}
              title="Play"
              description="Your game is ready. Test it in Studio, iterate with AI, or publish directly to Roblox."
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple pricing</h2>
            <p className="text-lg text-[#9CA3AF]">Start free. Scale when you need to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
              cta="Get Started"
            />
            <PricingCard
              name="Creator"
              price="$15"
              period="/month"
              features={[
                '50,000 tokens/month',
                'Priority AI processing',
                'Custom mesh generation',
                'Studio plugin sync',
                'Email support',
              ]}
              cta="Start Creating"
              featured
            />
            <PricingCard
              name="Studio"
              price="$50"
              period="/month"
              features={[
                '200,000 tokens/month',
                'Team collaboration',
                'API access + SDKs',
                'Game DNA analysis',
                'Priority support',
              ]}
              cta="Go Pro"
            />
          </div>

          <p className="text-center text-sm text-[#6B7280] mt-8">
            10% of every payment goes to charity. <Link href="/pricing" className="text-[#D4AF37] hover:underline">See full pricing details</Link>
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] opacity-20" style={{
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.3) 0%, transparent 60%)',
          }} />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to build?
          </h2>
          <p className="text-lg text-[#9CA3AF] mb-8">
            Join thousands of creators building Roblox games faster with AI.
          </p>

          <Link
            href="/editor"
            className="inline-flex items-center gap-2.5 font-bold text-lg px-10 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #FFB81C)',
              color: '#030712',
              boxShadow: '0 0 40px rgba(212,175,55,0.3), 0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            Get Started Free
            <IconArrow className="w-5 h-5" />
          </Link>

          <p className="text-sm text-[#6B7280] mt-4">
            No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <div className="space-y-3">
                <Link href="/editor" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Editor</Link>
                <Link href="/pricing" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Pricing</Link>
                <Link href="/download" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Download</Link>
                <Link href="/docs" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Documentation</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Features</h4>
              <div className="space-y-3">
                <span className="block text-sm text-[#6B7280]">Voice to Game</span>
                <span className="block text-sm text-[#6B7280]">Image to Map</span>
                <span className="block text-sm text-[#6B7280]">3D Generation</span>
                <span className="block text-sm text-[#6B7280]">Studio Plugin</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-3">
                <Link href="/terms" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/dmca" className="block text-sm text-[#6B7280] hover:text-white transition-colors">DMCA</Link>
                <Link href="/acceptable-use" className="block text-sm text-[#6B7280] hover:text-white transition-colors">Acceptable Use</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <div className="space-y-3">
                <span className="block text-sm text-[#6B7280]">ForjeGames LLC</span>
                <span className="block text-sm text-[#6B7280]">Built by Dawsen Porter</span>
                <a href="mailto:support@forjegames.com" className="block text-sm text-[#6B7280] hover:text-white transition-colors">support@forjegames.com</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/[0.04]">
            <p className="text-sm text-[#6B7280]">&copy; {new Date().getFullYear()} ForjeGames LLC. All rights reserved.</p>
            <p className="text-xs text-[#4B5563] mt-2 sm:mt-0">10% of revenue donated to charity</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
