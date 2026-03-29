'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Image,
  Sparkles,
  Users,
  ShoppingBag,
  BarChart2,
  Play,
  ArrowRight,
  ChevronDown,
  Heart,
  Code2,
  Gamepad2,
  Stethoscope,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    Icon: Mic,
    title: 'Voice-to-Game',
    short: 'Speak your idea. Get a playable map.',
    description:
      'Say "build me a medieval castle with a moat and drawbridge" and watch AI generate terrain, assets, and scripts in real-time. Works in any language.',
    color: 'from-violet-500/20 to-violet-500/5',
    accent: '#8B5CF6',
  },
  {
    Icon: Image,
    title: 'Image-to-Map',
    short: 'Drop any image. Get a Roblox map.',
    description:
      'Upload a photo, sketch, Pinterest board, or screenshot. Our vision model reads the scene, sources assets from the marketplace, and assembles a match.',
    color: 'from-blue-500/20 to-blue-500/5',
    accent: '#3B82F6',
  },
  {
    Icon: Sparkles,
    title: 'AI Assets',
    short: 'Textures, props, scripts — one prompt.',
    description:
      'Generate custom textures, 3-D props, Luau scripts, and terrain fills from a single prompt. No Blender, no Studio plugins, no prior experience.',
    color: 'from-[#FFB81C]/20 to-[#FFB81C]/5',
    accent: '#FFB81C',
  },
  {
    Icon: Users,
    title: 'Collaboration',
    short: 'Build with your whole team, live.',
    description:
      'Invite teammates, assign roles, and co-build in real-time. Comment on scenes, review diffs, and ship faster with built-in version control.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: '#10B981',
  },
  {
    Icon: ShoppingBag,
    title: 'Marketplace',
    short: 'Buy, sell, and remix AI assets.',
    description:
      'Browse thousands of community-generated environments, props, and scripts. Remix anything. Sell your own creations and earn passive income.',
    color: 'from-pink-500/20 to-pink-500/5',
    accent: '#EC4899',
  },
  {
    Icon: BarChart2,
    title: 'Analytics',
    short: 'Data-driven iteration, built in.',
    description:
      'Track player retention, session length, revenue, and conversion funnels right inside your dashboard. Know exactly what to improve next.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    accent: '#06B6D4',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Describe Your Vision',
    description:
      'Use voice or text. Describe the world you want — as simple or detailed as you like. Upload a reference image if you have one.',
  },
  {
    number: '02',
    title: 'AI Builds It',
    description:
      'Our pipeline analyzes your input, sources assets from the marketplace, generates missing ones, and assembles the full scene.',
  },
  {
    number: '03',
    title: 'Deploy to Roblox',
    description:
      'One click pushes your creation directly into Roblox Studio. Play-test immediately, iterate fast, ship when ready.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Alex R.',
    role: 'Indie Roblox Dev',
    initials: 'AR',
    color: '#8B5CF6',
    quote:
      'I built my entire obby map in 20 minutes using voice commands. What used to take me a week now takes an afternoon. RobloxForge is insane.',
    game: 'Sky Obby Deluxe',
    players: '48K players',
  },
  {
    name: 'Maya K.',
    role: 'Game Studio Owner',
    initials: 'MK',
    color: '#3B82F6',
    quote:
      'Our team ships 3x faster since adopting RobloxForge. The AI asset generation alone saves us hundreds of hours per project.',
    game: 'Pet Kingdom',
    players: '1.2M players',
  },
  {
    name: 'Jordan T.',
    role: 'Beginner Creator',
    initials: 'JT',
    color: '#10B981',
    quote:
      'I had zero Roblox experience. I described my dream game and RobloxForge built it. I got my first 1,000 players within a week.',
    game: 'Color Flood',
    players: '12K players',
  },
]

const CAUSES = [
  {
    Icon: Code2,
    name: 'Code.org',
    description: 'Teaching kids to code worldwide',
    donated: '$54,200',
  },
  {
    Icon: Gamepad2,
    name: 'Games for Change',
    description: 'Gaming for social good',
    donated: '$41,800',
  },
  {
    Icon: Stethoscope,
    name: "Child's Play",
    description: 'Games for children in hospitals',
    donated: '$28,000',
  },
]

const FAQS = [
  {
    q: 'Do I need to know how to code?',
    a: 'No. RobloxForge handles all the scripting. You describe what you want and we build it. If you do know Lua/Luau, you can refine and extend the generated code.',
  },
  {
    q: 'What is a token?',
    a: 'Tokens are the currency for AI operations. A simple terrain build costs ~50 tokens. A complex interactive game system might cost ~500. Free tier includes 500 tokens/month to get started.',
  },
  {
    q: 'Does RobloxForge work on mobile?',
    a: 'The web platform is fully mobile-responsive. Roblox Studio integration requires desktop.',
  },
  {
    q: 'Is my content safe?',
    a: 'All content is stored encrypted. You own everything you create — we never claim rights to your games or assets.',
  },
  {
    q: "Does this comply with Roblox's Terms of Service?",
    a: "Yes. RobloxForge is a third-party development tool, not a bot or exploit. We comply fully with Roblox's Developer Terms of Use.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. One-click cancellation in your billing settings. No penalties, no retention dark patterns. Your data stays accessible for 30 days after cancellation.',
  },
  {
    q: 'What is the 10% charity donation?',
    a: '10% of every dollar of revenue goes to a verified charity of your choice. You select the cause in your settings. This is a company commitment, not a tax deduction for customers.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — all paid plans include a 14-day free trial. No credit card required for the Free tier.',
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
}: {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => Math.floor(v).toLocaleString())

  useEffect(() => {
    if (inView) spring.set(target)
  }, [inView, target, spring])

  return (
    <span ref={ref}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
      className={`relative bg-gradient-to-br ${feature.color} border border-white/10 rounded-2xl p-6 cursor-default group transition-all duration-300 hover:border-white/20 hover:shadow-xl`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${feature.accent}20`, border: `1px solid ${feature.accent}40` }}
      >
        <feature.Icon className="w-6 h-6" style={{ color: feature.accent }} />
      </div>
      <h3
        className="text-lg font-semibold text-white mb-1 transition-colors"
        style={{ color: expanded ? feature.accent : undefined }}
      >
        {feature.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-2">{feature.short}</p>
      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="text-gray-300 text-sm leading-relaxed overflow-hidden"
          >
            {feature.description}
          </motion.p>
        )}
      </AnimatePresence>
      <div
        className="absolute bottom-3 right-4 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: feature.accent }}
      >
        hover to learn more
      </div>
    </motion.div>
  )
}

function TestimonialCard({
  t,
  index,
}: {
  t: (typeof TESTIMONIALS)[0]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="bg-[#0A0E27] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: `${t.color}25`, color: t.color, border: `1px solid ${t.color}40` }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{t.name}</p>
          <p className="text-gray-500 text-xs">{t.role}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white text-xs font-medium">{t.game}</p>
          <p className="text-[#FFB81C] text-xs">{t.players}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-[#FFB81C]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">"{t.quote}"</p>
    </motion.div>
  )
}

function SectionFade({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 sm:hidden"
        >
          <Link
            href="/sign-up"
            className="flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3.5 rounded-2xl shadow-2xl shadow-[#FFB81C]/30 text-sm"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CharityProgressBar({ donated, goal }: { donated: number; goal: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const pct = Math.min((donated / goal) * 100, 100)

  return (
    <div ref={ref} className="w-full max-w-lg mx-auto">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>${donated.toLocaleString()} donated</span>
        <span>goal: ${goal.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#FFB81C] to-[#FFD700]"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [causeIndex, setCauseIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCauseIndex((i) => (i + 1) % CAUSES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <StickyCTA />

      <div>
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#06071A] via-[#0A0E27] to-transparent" />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#FFB81C] rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.04, 0.08, 0.04] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet-600 rounded-full blur-3xl"
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-4 py-1.5 text-sm text-[#FFB81C] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#FFB81C] animate-pulse" />
              Now in open beta — join{' '}
              <AnimatedCounter target={8547} suffix="+" /> creators
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              Build Roblox Games in{' '}
              <span className="text-[#FFB81C]">Minutes,</span>
              <br />
              Not Months
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Speak your idea. Upload a reference image. Watch AI turn it into a playable Roblox
              game — complete with terrain, assets, and scripts.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
            >
              <Link
                href="/sign-up"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-medium text-lg px-8 py-4 rounded-xl transition-all hover:bg-white/5"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Demo
              </a>
            </motion.div>

            {/* Demo video placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              id="demo"
              className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D1231] to-[#080B1E] aspect-video flex items-center justify-center group cursor-pointer shadow-2xl shadow-black/60"
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.01)_2px,rgba(255,255,255,0.01)_4px)]" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[#FFB81C]/5" />

              <div className="relative text-center z-10">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 rounded-full bg-[#FFB81C]/20 border-2 border-[#FFB81C] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FFB81C]/30 transition-colors shadow-lg shadow-[#FFB81C]/20"
                >
                  <Play className="w-8 h-8 text-[#FFB81C] ml-1 fill-current" />
                </motion.div>
                <p className="text-gray-300 text-sm font-medium">Watch: Voice-to-Game in 60 seconds</p>
                <p className="text-gray-600 text-xs mt-1">Demo video launching soon</p>
              </div>

              <div className="absolute top-4 left-4 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm">
                2:47
              </div>
              <div className="absolute top-4 right-4 bg-[#FFB81C]/20 border border-[#FFB81C]/30 rounded-lg px-2.5 py-1 text-xs text-[#FFB81C] backdrop-blur-sm">
                HD
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Social proof bar                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-white/10 bg-[#0D1231]/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { target: 8547, suffix: '+', prefix: '', label: 'Creators' },
                { target: 45000, suffix: '+', prefix: '', label: 'Games Built' },
                { target: 2100000, suffix: '+', prefix: '', label: 'Hours Saved' },
                { target: 124000, suffix: '', prefix: '$', label: 'Donated' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-[#FFB81C]">
                    <AnimatedCounter
                      target={stat.target}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      duration={2.2}
                    />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Features                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <SectionFade className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Build
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              One platform. Every tool a Roblox creator needs — from your first game to a full
              studio. Hover each card to see more.
            </p>
          </SectionFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How It Works                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section id="how-it-works" className="bg-[#0D1231]/50 border-y border-white/10 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionFade className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-xl mx-auto">From idea to playable game in three steps.</p>
            </SectionFade>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#FFB81C]/50 via-[#FFB81C] to-[#FFB81C]/50" />
              {STEPS.map((step, i) => (
                <SectionFade key={step.number} delay={i * 0.1} className="text-center relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/30 flex items-center justify-center mx-auto mb-6"
                  >
                    <span className="text-[#FFB81C] font-bold text-xl font-mono">{step.number}</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </SectionFade>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Pricing preview                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <SectionFade className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Start free. Scale when you need to. No surprises.
            </p>
          </SectionFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { tier: 'Free', price: '$0', tokens: '500 tokens/mo', cta: 'Get started', highlight: false },
              { tier: 'Hobby', price: '$4.99', tokens: '2,000 tokens/mo', cta: 'Start trial', highlight: false },
              { tier: 'Creator', price: '$14.99', tokens: '7,000 tokens/mo', cta: 'Start trial', highlight: true },
              { tier: 'Studio', price: '$49.99', tokens: '20,000 tokens/mo', cta: 'Start trial', highlight: false },
            ].map((plan, i) => (
              <SectionFade key={plan.tier} delay={i * 0.08}>
                <div
                  className={`relative rounded-2xl p-6 border h-full ${
                    plan.highlight
                      ? 'bg-[#FFB81C]/5 border-[#FFB81C]/40 ring-2 ring-[#FFB81C]/30 shadow-xl shadow-[#FFB81C]/10'
                      : 'bg-[#0D1231] border-white/10'
                  }`}
                >
                  {plan.highlight && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#FFB81C]/10 to-transparent pointer-events-none" />
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-[#FFB81C]/30">
                          Most Popular
                        </span>
                      </div>
                    </>
                  )}
                  <p className="text-lg font-bold text-white mb-1">{plan.tier}</p>
                  <p className="text-3xl font-bold text-white mb-1">
                    {plan.price}
                    <span className="text-sm text-gray-500 font-normal">/mo</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-6">{plan.tokens}</p>
                  <Link
                    href="/pricing"
                    className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${
                      plan.highlight
                        ? 'bg-[#FFB81C] hover:bg-[#E6A519] text-black shadow-md shadow-[#FFB81C]/20'
                        : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </SectionFade>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/pricing"
              className="text-[#FFB81C] hover:underline text-sm font-medium inline-flex items-center gap-1"
            >
              View full pricing and feature comparison
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Testimonials                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-[#0D1231]/50 border-y border-white/10 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionFade className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Creators Love It</h2>
              <p className="text-gray-400">Real results from real Roblox developers.</p>
            </SectionFade>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.name} t={t} index={i} />
              ))}
            </div>

            {/* Partner strip */}
            <SectionFade delay={0.3} className="mt-16 text-center">
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-6 font-semibold">
                Trusted by creators from
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {['Roblox DevForum', 'Creator Marketplace', 'DevLog Weekly', 'Roblox Blog', 'GameDev.net'].map(
                  (name) => (
                    <span key={name} className="text-gray-600 font-semibold text-sm tracking-wide">
                      {name}
                    </span>
                  )
                )}
              </div>
            </SectionFade>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Charity section                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <SectionFade>
            <div className="bg-gradient-to-br from-[#0D1231] to-[#111640] border border-[#FFB81C]/20 rounded-3xl p-8 sm:p-12 text-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,184,28,0.05)_0%,transparent_70%)] pointer-events-none" />

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative mb-4 flex justify-center"
              >
                <Heart className="w-12 h-12 text-[#FFB81C] fill-[#FFB81C]" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">
                10% of Every Dollar Goes to Charity
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed relative">
                Every game you build helps someone learn to code. Each subscription and token
                purchase sends 10% to a cause you choose.
              </p>

              <div className="relative mb-10">
                <CharityProgressBar donated={124000} goal={200000} />
              </div>

              {/* Rotating charity spotlight */}
              <div className="relative mb-10 max-w-sm mx-auto">
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-4 font-semibold">
                  Charity spotlight
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={causeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="bg-[#0A0E27] rounded-2xl p-5 border border-white/10"
                  >
                    <CAUSES[causeIndex].Icon className="w-8 h-8 text-[#FFB81C] mx-auto mb-3" />
                    <p className="text-white font-semibold">{CAUSES[causeIndex].name}</p>
                    <p className="text-gray-500 text-sm mt-1">{CAUSES[causeIndex].description}</p>
                    <p className="text-[#FFB81C] font-bold mt-2 text-lg">
                      {CAUSES[causeIndex].donated} donated
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5 mt-3">
                  {CAUSES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCauseIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === causeIndex ? 'bg-[#FFB81C] w-3' : 'bg-white/20 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Link
                href="/sign-up"
                className="relative inline-block bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-[#FFB81C]/30"
              >
                Build Something Good
              </Link>
              <p className="text-gray-600 text-xs mt-4 relative">
                Charity donations are a company commitment. Not tax-deductible for customers. See{' '}
                <Link href="/terms#charity" className="hover:text-gray-400">
                  Terms §12
                </Link>
                .
              </p>
            </div>
          </SectionFade>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FAQ                                                               */}
        {/* ---------------------------------------------------------------- */}
        <section id="faq" className="bg-[#0D1231]/50 border-t border-white/10 py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionFade className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </SectionFade>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  layout
                  className="bg-[#0A0E27] border border-white/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                  >
                    <span className="text-white font-medium">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Final CTA                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          <SectionFade>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Build?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
              Join <AnimatedCounter target={8547} suffix="+" /> creators. Start free — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-xl px-12 py-5 rounded-xl transition-all shadow-2xl shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Building Free
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-medium text-lg px-8 py-5 rounded-xl transition-all hover:bg-white/5"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Free tier includes 500 tokens/month. No credit card required.
            </p>
          </SectionFade>
        </section>
      </div>
    </>
  )
}
