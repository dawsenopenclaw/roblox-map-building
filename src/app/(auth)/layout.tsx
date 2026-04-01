'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

// ─── Feature carousel data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    label: 'AI Map Builder',
    desc: 'Describe any map and watch it generate in seconds',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    label: 'One-Click Publish',
    desc: 'Push directly to Roblox Studio with zero manual steps',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 8l2 2 4-4" />
      </svg>
    ),
    label: 'No Coding Needed',
    desc: 'Natural language → production-ready Luau scripts',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: '12,000+ Creators',
    desc: 'Join a community shipping games every day',
  },
]

const STATS = [
  { value: '12K+', label: 'Creators' },
  { value: '50K+', label: 'Games Built' },
  { value: '4.9★', label: 'Avg Rating' },
]

// ─── ForjeGames logo mark ─────────────────────────────────────────────────────

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <polygon
        points="16,2 30,10 30,22 16,30 2,22 2,10"
        stroke="#D4AF37"
        strokeWidth="1.5"
        fill="rgba(212,175,55,0.08)"
      />
      <polygon
        points="16,8 24,13 24,19 16,24 8,19 8,13"
        fill="#D4AF37"
        opacity="0.6"
      />
      <circle cx="16" cy="16" r="3" fill="#D4AF37" />
    </svg>
  )
}

// ─── Animated background orbs ────────────────────────────────────────────────

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Large gold radial behind left panel */}
      <div
        className="absolute"
        style={{
          top: '-10%',
          left: '-5%',
          width: '70%',
          height: '80%',
          background: 'radial-gradient(ellipse at 30% 40%, rgba(212,175,55,0.06) 0%, transparent 65%)',
        }}
      />
      {/* Subtle blue complement */}
      <div
        className="absolute animate-float-slow"
        style={{
          bottom: '5%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.04) 0%, transparent 70%)',
          animationDelay: '2s',
        }}
      />
      {/* Right side form glow */}
      <div
        className="absolute"
        style={{
          top: '30%',
          right: '0',
          width: '40%',
          height: '60%',
          background: 'radial-gradient(ellipse at 70% 50%, rgba(212,175,55,0.05) 0%, transparent 70%)',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  )
}

// ─── Rotating feature card ────────────────────────────────────────────────────

function FeatureCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(prev => (prev + 1) % FEATURES.length), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mt-10 w-full max-w-sm">
      {/* Active feature */}
      <div
        className="relative rounded-2xl p-5 border overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212,175,55,0.15)' }}
      >
        {/* Gold shimmer line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex items-start gap-4"
          >
            <div
              className="flex items-center justify-center shrink-0 rounded-xl w-10 h-10"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}
            >
              {FEATURES[active]!.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{FEATURES[active]!.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>{FEATURES[active]!.desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mt-3 justify-center">
        {FEATURES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Feature ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? '20px' : '6px',
              height: '6px',
              background: i === active ? '#D4AF37' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Left branding panel ──────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex flex-col justify-between h-full px-12 py-12 xl:px-16"
    >
      {/* Top: Logo */}
      <Link href="/" className="flex items-center gap-2.5 group select-none w-fit">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <LogoMark size={36} />
        </motion.div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">Forje</span>
          <span style={{ color: '#D4AF37' }}>Games</span>
        </span>
      </Link>

      {/* Middle: headline + carousel */}
      <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-xs font-semibold tracking-[0.12em] uppercase mb-4"
            style={{ color: '#D4AF37' }}
          >
            AI-Powered Game Development
          </p>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white">
            Build Roblox Games
            <br />
            <span style={{ color: '#D4AF37' }}>with AI</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed max-w-xs" style={{ color: '#A1A1AA' }}>
            Describe your vision. Our AI writes the code, builds the maps, and publishes to Roblox — in minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <FeatureCarousel />
        </motion.div>
      </div>

      {/* Bottom: stats + trust */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col gap-5"
      >
        {/* Stats row */}
        <div className="flex items-center gap-6">
          {STATS.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>{stat.value}</span>
              <span className="text-xs" style={{ color: '#71717A' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Trust badge row */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: '⚡', text: 'Free to start' },
            { icon: '🔒', text: 'COPPA compliant' },
            { icon: '🚀', text: 'No credit card' },
          ].map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#A1A1AA', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span aria-hidden>{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex overflow-hidden"
      style={{ background: '#09090b' }}
    >
      <BackgroundOrbs />

      {/* ── Left divider line ── */}
      <div
        className="hidden lg:block absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{
          left: '60%',
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.12) 20%, rgba(212,175,55,0.12) 80%, transparent)',
        }}
        aria-hidden
      />

      {/* ── Left: Branding panel (60%) ── */}
      <div className="hidden lg:flex relative z-10 flex-col" style={{ width: '60%' }}>
        <BrandingPanel />
      </div>

      {/* ── Right: Auth form (40%) ── */}
      <div
        className="relative z-10 flex flex-col w-full lg:w-[40%] min-h-screen"
        style={{ background: 'rgba(17,17,19,0.6)', backdropFilter: 'blur(12px)' }}
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center justify-center pt-10 pb-4">
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <LogoMark size={30} />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Forje</span>
              <span style={{ color: '#D4AF37' }}>Games</span>
            </span>
          </Link>
        </div>

        {/* Mobile tagline */}
        <div className="lg:hidden text-center px-6 pb-6">
          <p className="text-sm" style={{ color: '#71717A' }}>Build Roblox Games with AI</p>
        </div>

        {/* Demo mode banner */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-6 mt-4 lg:mx-8 lg:mt-8 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border"
            style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.18)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37" aria-hidden>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span style={{ color: '#D4AF37' }} className="font-medium">Demo Mode</span>
            <span className="text-zinc-500">— sign in with test credentials or skip to the editor.</span>
          </motion.div>
        )}

        {/* Auth content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-10 xl:px-14"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
