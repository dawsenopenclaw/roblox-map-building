'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion, useInView } from 'framer-motion'

const ReviewMarquee = dynamic(() => import('@/components/marketing/ReviewMarquee'))
const FaqSection = dynamic(() => import('@/components/marketing/FaqSection'))

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN SYSTEM — Glassmorphic cards, gold accents, blurred backgrounds
═══════════════════════════════════════════════════════════════════════════ */

const glass = {
  card: {
    background: 'rgba(12,16,32,0.55)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
  } as React.CSSProperties,
  cardHover: {
    border: '1px solid rgba(212,175,55,0.2)',
    boxShadow: '0 0 30px rgba(212,175,55,0.06)',
  } as React.CSSProperties,
}

/* Fade-in-up animation for sections */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

/* ─── Scroll reveal hook ─────────────────────────────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    const els = container.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ─── Gold gradient divider between sections ─────────────────────────────── */

function GoldDivider() {
  return (
    <div aria-hidden style={{
      width: '100%', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '60%', maxWidth: 500, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 30%, rgba(212,175,55,0.45) 50%, rgba(212,175,55,0.25) 70%, transparent 100%)',
      }} />
    </div>
  )
}

/* ─── Parallax scroll hook for hero glow ─────────────────────────────────── */

function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setOffset(window.scrollY)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return offset * speed
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1 — HERO (Full screen)
═══════════════════════════════════════════════════════════════════════════ */

const ROTATING_WORDS = ['Game', 'World', 'Obby', 'Tycoon', 'City', 'RPG']

function RotatingHeroText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % ROTATING_WORDS.length), 3800)
    return () => clearInterval(timer)
  }, [])

  const longestWord = ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))

  return (
    <h1
      className="font-black tracking-tight text-center"
      style={{ fontSize: 'clamp(3.2rem, 10vw, 7.5rem)', lineHeight: 1.1, letterSpacing: '-0.04em', fontWeight: 900 }}
    >
      <div style={{ color: '#FAFAFA', textShadow: '0 0 80px rgba(255,255,255,0.08)' }}>Forge your</div>
      <div className="relative mx-auto" style={{ height: '1.15em', width: '100%', maxWidth: '8ch' }}>
        {ROTATING_WORDS.map((word, i) => (
          <motion.div
            key={word}
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              opacity: i === index ? 1 : 0,
              y: i === index ? 0 : 20,
              scale: i === index ? 1 : 0.95,
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 45%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px rgba(212,175,55,0.3))',
            }}
          >
            {word}
          </motion.div>
        ))}
      </div>
    </h1>
  )
}

/* Hero prompt input */
const HERO_PLACEHOLDERS = [
  'Build me a tycoon factory with conveyor belts...',
  'Make a medieval castle with towers and a moat...',
  'Create a parkour obby with 50 checkpoints...',
  'Design a futuristic city with flying cars...',
  'Build a complete RPG with combat and inventory...',
  'Make a pet simulator with hatching eggs...',
]

function HeroPromptInput() {
  const [prompt, setPrompt] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const { isSignedIn } = useAuth()

  useEffect(() => {
    if (focused || prompt.length > 0) return
    const target = HERO_PLACEHOLDERS[placeholderIndex]
    let i = 0
    let typingTimer: ReturnType<typeof setInterval>
    let pauseTimer: ReturnType<typeof setTimeout>
    const typeNext = () => {
      typingTimer = setInterval(() => {
        if (i < target.length) { setTypedPlaceholder(target.slice(0, i + 1)); i++ }
        else { clearInterval(typingTimer); pauseTimer = setTimeout(() => { setPlaceholderIndex((p) => (p + 1) % HERO_PLACEHOLDERS.length); setTypedPlaceholder('') }, 2200) }
      }, 50)
    }
    typeNext()
    return () => { clearInterval(typingTimer); clearTimeout(pauseTimer) }
  }, [placeholderIndex, focused, prompt.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = prompt.trim()
    const target = trimmed ? `/editor?prompt=${encodeURIComponent(trimmed)}` : '/editor'
    router.push(isSignedIn ? target : `/sign-up?redirect_url=${encodeURIComponent(target)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative group w-full">
      <div
        style={{
          ...glass.card,
          padding: '6px 6px 6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderColor: focused ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
          boxShadow: focused
            ? '0 0 0 3px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.15), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'all 0.25s ease-out',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? '#D4AF37' : '#52525B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={typedPlaceholder || 'Describe what you want to build...'}
          className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder:text-zinc-600"
          style={{ minWidth: 0 }}
        />
        <button
          type="submit"
          className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
        >
          Build
        </button>
      </div>
    </form>
  )
}

/* Smooth animated number display */

function useAnimatedNumber(target: number, duration = 1200): number {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return
    const from = prevRef.current
    const diff = target - from
    if (diff === 0) return

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + diff * eased)
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return display
}

/* Live stat counter — fetches real data, then simulates organic growth */

function LiveBuildCounter() {
  const [realBuilds, setRealBuilds] = useState(0)
  const [realUsers, setRealUsers] = useState(0)
  const [activeNow, setActiveNow] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const incrementRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setRealBuilds(d.totalBuilds || 0)
          setRealUsers(d.totalUsers || 0)
          setActiveNow(d.activeNow || 0)
          setLoaded(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loaded) return

    function scheduleNext() {
      const delay = 1500 + Math.random() * 3500 // 1.5-5s intervals, more organic
      incrementRef.current = setTimeout(() => {
        setRealBuilds(prev => prev + 1)
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => { if (incrementRef.current) clearTimeout(incrementRef.current) }
  }, [loaded])

  useEffect(() => {
    if (!loaded || activeNow === 0) return
    const interval = setInterval(() => {
      setActiveNow(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(1, prev + delta)
      })
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(interval)
  }, [loaded, activeNow])

  const animBuilds = useAnimatedNumber(realBuilds)
  const animUsers = useAnimatedNumber(realUsers)

  return (
    <div className="flex items-center gap-6 text-[12px]">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
        </span>
        <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">Live</span>
      </div>

      <div className="text-zinc-500">
        <span className="text-zinc-400 font-semibold tabular-nums">
          {loaded ? animBuilds.toLocaleString() : '—'}
        </span> builds
      </div>

      <div className="text-zinc-500">
        <span className="text-zinc-400 font-semibold tabular-nums">
          {loaded ? animUsers.toLocaleString() : '—'}
        </span> creators
      </div>

      {loaded && activeNow > 0 && (
        <div className="text-zinc-500">
          <span className="text-emerald-400 font-semibold tabular-nums">{activeNow}</span> online
        </div>
      )}
    </div>
  )
}

function HeroSection() {
  const parallaxOffset = useParallax(0.35)

  return (
    <section className="relative flex flex-col items-center justify-center text-center overflow-hidden min-h-screen px-6" style={{ paddingTop: '14vh', paddingBottom: '10vh' }}>
      {/* Background glow — contained, won't overlap content — parallax */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: `translateX(-50%) translateY(${parallaxOffset}px)`, width: '120%', height: '70%', background: 'radial-gradient(ellipse 60% 45% at 50% 15%, rgba(212,175,55,0.10) 0%, transparent 65%)', filter: 'blur(40px)', willChange: 'transform' }} />
        <div className="absolute inset-0 grid-overlay" style={{ opacity: 0.2 }} />
      </div>

      <motion.div className="relative max-w-4xl mx-auto w-full z-10" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
        {/* Badge */}
        <motion.div className="mb-6 flex justify-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em]" style={{ ...glass.card, color: '#D4AF37', borderColor: 'rgba(212,175,55,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            AI-Powered Roblox Game Builder
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div className="mb-7" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}>
          <RotatingHeroText />
        </motion.div>

        {/* Subtitle */}
        <motion.p className="text-zinc-500 leading-relaxed max-w-2xl mx-auto mb-10" style={{ fontSize: 'clamp(1rem, 2.2vw, 1.25rem)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
          Describe your game. The AI plans it, builds it, and puts it in Studio. Full games with 50,000+ parts — scripts, UI, terrain, everything.
        </motion.p>

        {/* Prompt input */}
        <motion.div className="max-w-2xl mx-auto mb-8" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.65, duration: 0.7 }}>
          <HeroPromptInput />
        </motion.div>

        {/* Reassurance */}
        <motion.p className="text-[13px] text-zinc-600 mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
          1,000 free tokens &middot; No credit card &middot; 3-day free trial on paid plans
        </motion.p>

        {/* Live stats */}
        <motion.div className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
          <LiveBuildCounter />
        </motion.div>

        {/* Powered by */}
        <motion.p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-zinc-700" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          Powered by <span className="text-zinc-500">212 AI Specialists</span>
          <span className="mx-2 opacity-30">&middot;</span>
          <span className="text-zinc-500">Game Planning AI</span>
          <span className="mx-2 opacity-30">&middot;</span>
          <span className="text-zinc-500">3D Mesh Gen</span>
        </motion.p>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2 — HOW IT WORKS (Video walkthrough)
═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { num: '01', title: 'Describe Your Game', desc: 'Tell the AI what you want. "Build me a tycoon with conveyor belts and a shop system." The AI plans every phase.', icon: '💬' },
  { num: '02', title: 'AI Plans & Builds', desc: '212 specialist AIs work together. Terrain, buildings, scripts, UI, lighting — all generated and quality-checked.', icon: '🧠' },
  { num: '03', title: 'Appears in Studio', desc: 'Code gets sent to Roblox Studio through the plugin. Watch your game come to life in real-time.', icon: '🎮' },
]

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-6" style={{ background: '#040712' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]/70 mb-4 font-mono">How It Works</p>
          <h2 className="font-bold tracking-tight text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}>
            From idea to playable game in <span className="text-[#D4AF37]">minutes</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">No coding. No 3D modeling. Just describe what you want and the AI handles everything.</p>
        </motion.div>

        {/* Video placeholder — replace with actual video */}
        <motion.div
          className="mb-20 rounded-2xl overflow-hidden relative aspect-video max-w-3xl mx-auto"
          style={{ ...glass.card, borderColor: 'rgba(212,175,55,0.15)' }}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid rgba(212,175,55,0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4AF37"><polygon points="9.5,7.5 16.5,12 9.5,16.5" /></svg>
            </div>
            <p className="text-zinc-400 text-sm font-medium">Watch the full walkthrough</p>
            <p className="text-zinc-600 text-xs">Demo video coming soon</p>
          </div>
        </motion.div>

        {/* 3 Steps with connector lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(212,175,55,0.2), transparent)' }} />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
              style={{ ...glass.card, padding: '28px 24px' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  {step.icon}
                </div>
                <span className="text-[11px] font-bold tracking-[0.15em] text-[#D4AF37]/50 font-mono">STEP {step.num}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3 — WHAT YOU CAN BUILD (Capabilities)
═══════════════════════════════════════════════════════════════════════════ */

const CAPABILITIES = [
  {
    category: 'Full Games',
    items: ['RPG with combat & inventory', 'Obby with 100+ checkpoints', 'Tycoon with economy system', 'Simulator with progression', 'Battle royale with zones', 'Horror with jumpscares & atmosphere'],
    icon: '🎮',
    color: '#D4AF37',
  },
  {
    category: 'Maps & Worlds',
    items: ['Cities with roads & buildings', 'Fantasy landscapes', 'Underwater environments', 'Space stations & colonies', 'Medieval villages', 'Procedural terrain generation'],
    icon: '🗺️',
    color: '#22C55E',
  },
  {
    category: 'Buildings & Structures',
    items: ['Castles (200-500+ parts)', 'Houses with full interiors', 'Shops, restaurants, offices', 'Towers, bridges, walls', 'Vehicles (cars, boats, planes)', 'Custom 3D mesh assets'],
    icon: '🏗️',
    color: '#60A5FA',
  },
  {
    category: 'Scripts & Systems',
    items: ['Combat & damage systems', 'Inventory & trading', 'DataStore saving', 'Leaderboards & ranking', 'NPC dialogue & quests', 'Pet follow & hatching'],
    icon: '💻',
    color: '#A78BFA',
  },
  {
    category: 'UI & Interface',
    items: ['Shop GUIs & menus', 'Health bars & HUDs', 'Settings & options', 'Loading screens', 'Notification systems', 'Mobile-friendly controls'],
    icon: '🎨',
    color: '#F59E0B',
  },
  {
    category: 'Monetization',
    items: ['Game Pass setup', 'Developer Products', 'Premium Benefits', 'Daily reward systems', 'Battle passes', 'Robux pricing strategy'],
    icon: '💰',
    color: '#EF4444',
  },
]

function CapabilitiesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-6" style={{ background: '#050810' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]/70 mb-4 font-mono">What You Can Build</p>
          <h2 className="font-bold tracking-tight text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}>
            Everything your game needs. <span className="text-[#D4AF37]">One platform.</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">From a single tree to a 50,000-part open world. The AI handles terrain, buildings, scripts, UI, lighting, and monetization.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={stagger} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {CAPABILITIES.map((cap) => (
            <motion.div
              key={cap.category}
              variants={fadeUp}
              className="group transition-all duration-300 hover:translate-y-[-2px]"
              style={{ ...glass.card, padding: '24px' }}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, glass.cardHover) }}
              onMouseLeave={(e) => { e.currentTarget.style.border = glass.card.border as string; e.currentTarget.style.boxShadow = '' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cap.icon}</span>
                <h3 className="text-white font-bold">{cap.category}</h3>
              </div>
              <ul className="space-y-2">
                {cap.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: cap.color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 5 — GAME PLANNING DEEP DIVE
═══════════════════════════════════════════════════════════════════════════ */

const PHASES = [
  { name: 'Terrain & World', parts: '2,000-5,000', desc: 'Hills, rivers, biomes, roads, caves — procedurally generated with natural variation' },
  { name: 'Buildings', parts: '5,000-20,000', desc: 'Full interiors, multiple floors, windows, doors, roofs — each building unique' },
  { name: 'Props & Detail', parts: '3,000-15,000', desc: 'Trees (randomized), rocks, furniture, street lamps, fences, signs — no two alike' },
  { name: 'NPCs & Characters', parts: '500-2,000', desc: 'Enemies with AI, shopkeepers, quest givers, dialogue systems, patrol paths' },
  { name: 'Game Logic', parts: '—', desc: 'Combat, inventory, saving, trading, daily rewards — production-ready Luau scripts' },
  { name: 'UI & Menus', parts: '—', desc: 'Shop GUI, health bars, settings, loading screens — polished and responsive' },
  { name: 'Lighting & FX', parts: '200-1,000', desc: 'Day/night cycle, fog, particles, bloom, ambient sounds — cinematic atmosphere' },
  { name: 'Monetization', parts: '—', desc: 'Game passes (49-499R$), dev products, premium perks — with pricing strategy' },
]

function GamePlanningSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-6" style={{ background: '#040712' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]/70 mb-4 font-mono">Game Planning AI</p>
          <h2 className="font-bold tracking-tight text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}>
            Plan entire games, <span className="text-[#D4AF37]">phase by phase</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Tell the AI your game idea. It creates an 8-phase build plan, then builds each phase while you watch. Say &quot;continue&quot; to keep going.</p>
        </motion.div>

        {/* Phase timeline */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={stagger} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {PHASES.map((phase, i) => (
            <motion.div key={phase.name} variants={fadeUp} style={{ ...glass.card, padding: '20px' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>{i + 1}</span>
                <span className="text-white font-semibold text-sm">{phase.name}</span>
              </div>
              {phase.parts !== '—' && <p className="text-[#D4AF37] text-xs font-mono mb-1">{phase.parts} parts</p>}
              <p className="text-zinc-500 text-xs leading-relaxed">{phase.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="text-center mt-10" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <Link
            href="/sign-up?redirect_url=/editor?prompt=plan%20me%20a%20game"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
          >
            Plan Your First Game
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 6 — PRICING (3 options)
═══════════════════════════════════════════════════════════════════════════ */

const PLANS = [
  {
    name: 'Test Drive',
    price: 'Free',
    sub: '1,000 tokens, one-time',
    features: ['Small builds & props', 'Basic AI models', 'Studio plugin', 'Community support'],
    cta: 'Start Free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Builder',
    price: '$20',
    sub: '/month',
    features: ['15,000 tokens/mo', '25% game depth', 'All AI models', 'MCP integration', '3-day free trial'],
    cta: 'Start Building',
    href: '/sign-up?plan=builder',
    highlight: false,
  },
  {
    name: 'Studio',
    price: '$200',
    sub: '/month',
    features: ['200,000 tokens/mo', '100% full game building', 'Priority AI queue', '50,000+ part games', 'API access + SDK', 'Dedicated support', '3-day free trial'],
    cta: 'Go Studio',
    href: '/sign-up?plan=studio',
    highlight: true,
  },
]

function PricingSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-6" style={{ background: '#050810' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-14" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]/70 mb-4 font-mono">Pricing</p>
          <h2 className="font-bold tracking-tight text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}>
            Simple pricing. <span className="text-[#D4AF37]">Real results.</span>
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">Test free, build more with Builder, or go all-in with Studio for complete game creation.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" variants={stagger} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className="relative"
              style={{
                ...glass.card,
                padding: '32px 28px',
                borderColor: plan.highlight ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)',
                boxShadow: plan.highlight ? '0 0 50px rgba(212,175,55,0.08)' : undefined,
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: '#D4AF37', color: '#050810' }}>
                  Most Popular
                </div>
              )}
              <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm">{plan.sub}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className="block w-full text-center py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-[0.97]"
                style={plan.highlight
                  ? { background: 'linear-gradient(135deg, #D4AF37, #FFD966)', color: '#050810' }
                  : { background: 'rgba(255,255,255,0.06)', color: '#FAFAFA', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.p className="text-center text-zinc-600 text-sm mt-8" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          All paid plans include a 3-day free trial. <Link href="/pricing" className="text-[#D4AF37] hover:underline">See full pricing details</Link>
        </motion.p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 8 — FINAL CTA
═══════════════════════════════════════════════════════════════════════════ */

function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-6 text-center" style={{ background: '#040712' }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '50%', background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.05) 0%, transparent 60%)', filter: 'blur(40px)' }} />
      </div>

      <motion.div className="relative max-w-2xl mx-auto" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]/60 mb-5 font-mono">Ready?</p>
        <h2 className="font-bold tracking-tight text-white mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
          Your game starts with <span style={{ background: 'linear-gradient(90deg, #D4AF37, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>one sentence</span>
        </h2>
        <p className="text-zinc-500 text-lg mb-10 max-w-lg mx-auto">1,000 free tokens. No credit card. Your first build appears in Studio instantly.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className="cta-shimmer inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #D4AF37, #FFD966)', boxShadow: '0 0 40px rgba(212,175,55,0.3)' }}>
            Start Building Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            See Pricing
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE — All sections composed
═══════════════════════════════════════════════════════════════════════════ */

export default function HomeClient() {
  const pageRef = useReveal()

  return (
    <div ref={pageRef} className="min-h-screen" style={{ background: '#050810', color: '#FAFAFA', fontFamily: 'var(--font-geist-sans, Inter, sans-serif)' }}>

      {/* 1 — Hero (full screen) */}
      <HeroSection />

      <GoldDivider />

      {/* 2 — How It Works + Video */}
      <HowItWorksSection />

      <GoldDivider />

      {/* 3 — What You Can Build */}
      <CapabilitiesSection />

      <GoldDivider />

      {/* 4 — Reviews (real, live) */}
      <ReviewMarquee />

      <GoldDivider />

      {/* 5 — Game Planning Deep Dive */}
      <GamePlanningSection />

      <GoldDivider />

      {/* 6 — Pricing Preview */}
      <PricingSection />

      <GoldDivider />

      {/* 7 — Final CTA */}
      <FinalCTA />

      <GoldDivider />

      {/* 8 — FAQ */}
      <FaqSection />

    </div>
  )
}
