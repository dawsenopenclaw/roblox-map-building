'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { OnboardingStep } from '@/components/OnboardingStep'
import { ConfettiCanvas } from '@/components/ConfettiCanvas'
import { completeOnboarding, type OnboardingInterest } from '@/lib/onboarding'

// ─── Types ────────────────────────────────────────────────────────────────────

type Interest = OnboardingInterest

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ firstName }: { firstName: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 bg-[#FFB81C]/10 border border-[#FFB81C]/30 rounded-2xl flex items-center justify-center mx-auto mb-6"
      >
        <svg className="w-10 h-10 text-[#FFB81C]" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-white mb-3"
      >
        Welcome to RobloxForge{firstName ? `, ${firstName}` : ''}
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-lg mb-8 leading-relaxed"
      >
        The AI-powered platform that turns your ideas into fully-playable Roblox experiences — in minutes, not months.
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 gap-3 text-left"
      >
        {[
          { icon: '🎙️', title: 'Voice to Game', desc: 'Speak a prompt — get a working map' },
          { icon: '🖼️', title: 'Image to Map', desc: 'Upload any image, extract terrain' },
          { icon: '🧬', title: 'Game DNA Scanner', desc: 'Analyze top games and clone their DNA' },
          { icon: '🛒', title: 'Asset Marketplace', desc: 'Sell your creations, earn Robux' },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3"
          >
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-white text-sm font-semibold">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Step 2: Interest selector ────────────────────────────────────────────────

const INTERESTS: { id: Interest; icon: string; title: string; desc: string }[] = [
  { id: 'games', icon: '🎮', title: 'Full Games', desc: 'Complete experiences with gameplay loops' },
  { id: 'maps', icon: '🗺️', title: 'Maps & Worlds', desc: 'Beautiful environments and terrain' },
  { id: 'assets', icon: '🧱', title: 'Assets & Templates', desc: 'Sell scripts, models, and maps' },
  { id: 'all', icon: '✨', title: 'Everything', desc: 'I want to explore all features' },
]

function StepInterest({
  selected,
  onSelect,
}: {
  selected: Interest | null
  onSelect: (v: Interest) => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What do you want to build?</h2>
      <p className="text-gray-400 mb-6">
        We will personalize your experience based on your goal. You can change this later.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map((item) => {
          const active = selected === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative text-left p-4 rounded-xl border transition-all ${
                active
                  ? 'border-[#FFB81C] bg-[#FFB81C]/10 shadow-[0_0_20px_rgba(255,184,28,0.15)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="interest-check"
                  className="absolute top-2 right-2 w-5 h-5 bg-[#FFB81C] rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-white text-sm font-semibold">{item.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Mini demo ────────────────────────────────────────────────────────

const DEMO_STEPS = [
  'Parsing prompt...',
  'Generating terrain mesh...',
  'Placing castle keep...',
  'Adding battlements & towers...',
  'Decorating courtyard...',
  'Generating Luau scripts...',
  'Exporting to Roblox...',
]

function StepDemo() {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [demoStep, setDemoStep] = useState(-1)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runDemo = (prompt: string) => {
    if (!prompt.trim() || running) return
    setRunning(true)
    setDone(false)
    setDemoStep(0)
    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      if (idx >= DEMO_STEPS.length) {
        clearInterval(intervalRef.current!)
        setDemoStep(DEMO_STEPS.length)
        setDone(true)
        setRunning(false)
      } else {
        setDemoStep(idx)
      }
    }, 450)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Try the magic</h2>
      <p className="text-gray-400 mb-6">Type a build prompt below to see RobloxForge in action.</p>

      {/* Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runDemo(input)}
          placeholder='Try: "build a medieval castle"'
          disabled={running}
          className="w-full bg-[#0D1231] border border-white/15 rounded-xl px-4 py-3 pr-24 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => runDemo(input || 'build a medieval castle')}
          disabled={running}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#FFB81C] text-black text-xs font-bold rounded-lg hover:bg-[#E6A519] disabled:opacity-50 transition-all"
        >
          {running ? '...' : 'Build'}
        </button>
      </div>

      {/* Quick-fill suggestions */}
      {!running && !done && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['Build a castle', 'Create a volcano island', 'Make a forest dungeon'].map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); runDemo(s) }}
              className="text-xs text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:border-[#FFB81C]/40 hover:text-[#FFB81C] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Build log */}
      <AnimatePresence>
        {(running || done) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#0A0D1A] border border-white/10 rounded-xl p-4 font-mono text-xs overflow-hidden"
          >
            {DEMO_STEPS.slice(0, Math.min(demoStep + 1, DEMO_STEPS.length)).map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="text-[#FFB81C]">›</span>
                <span className="text-gray-300">{s}</span>
                {i < demoStep && (
                  <span className="ml-auto text-emerald-400">done</span>
                )}
                {i === demoStep && running && (
                  <span className="ml-auto text-[#FFB81C] animate-pulse">running</span>
                )}
              </motion.div>
            ))}

            {done && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-semibold">Build complete — 247 parts, 3 scripts generated</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!running && !done && (
        <p className="text-gray-600 text-xs text-center mt-4">
          This is a live demo simulation of the AI engine
        </p>
      )}
    </div>
  )
}

// ─── Step 4: Plan selector ────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: ['500 AI tokens / month', 'Voice & image builds', 'Community marketplace', '3 active projects'],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: ['10,000 AI tokens / month', 'Priority AI queue', 'Game DNA Scanner', 'Unlimited projects', 'Revenue sharing'],
    cta: 'Start Free Trial',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '$39',
    period: '/month',
    highlight: false,
    features: ['50,000 AI tokens / month', 'Team collaboration', 'Dedicated support', 'Custom webhooks', 'White-label exports'],
    cta: 'Contact Us',
  },
]

function StepPlan({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Choose your plan</h2>
      <p className="text-gray-400 mb-6">
        Start free — no credit card required. Upgrade anytime as you grow.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const active = selected === plan.id
          return (
            <motion.button
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                active
                  ? 'border-[#FFB81C] bg-[#FFB81C]/8 shadow-[0_0_20px_rgba(255,184,28,0.12)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-xs bg-[#FFB81C] text-black font-semibold px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-xl font-bold ${active ? 'text-[#FFB81C]' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    active ? 'border-[#FFB81C] bg-[#FFB81C]' : 'border-white/30'
                  }`}
                >
                  {active && (
                    <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {plan.features.map((f) => (
                  <span key={f} className="text-gray-400 text-xs flex items-center gap-1">
                    <span className="text-[#FFB81C]">+</span> {f}
                  </span>
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function StepDone({ firstName }: { firstName: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 bg-gradient-to-br from-[#FFB81C] to-[#E6A519] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,184,28,0.4)]"
      >
        <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-3xl font-bold text-white mb-3"
      >
        {firstName ? `${firstName}, you're` : "You're"} ready to build!
      </motion.h2>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-gray-400 text-lg mb-8"
      >
        Your workspace is set up. Go build something amazing.
      </motion.p>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          { num: '500', label: 'Free tokens' },
          { num: '10+', label: 'AI tools' },
          { num: '∞', label: 'Possibilities' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#0D1231] border border-white/10 rounded-xl py-3 px-2"
          >
            <p className="text-[#FFB81C] text-xl font-bold">{item.num}</p>
            <p className="text-gray-400 text-xs">{item.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizardPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [interest, setInterest] = useState<Interest | null>(null)
  const [plan, setPlan] = useState('free')
  const [completing, setCompleting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const next = () => go(step + 1)
  const back = () => go(step - 1)

  const handleSkip = async () => {
    setCompleting(true)
    try {
      await completeOnboarding(interest ?? 'all', true)
    } catch {
      // Non-fatal — metadata save failed but we still redirect
    }
    router.push('/dashboard')
  }

  const handleFinish = async () => {
    setCompleting(true)
    setShowConfetti(true)
    try {
      await completeOnboarding(interest ?? 'all', false)
    } catch {
      // Non-fatal — metadata save failed but we still redirect
    }
    // Short delay so confetti is visible before redirect
    setTimeout(() => router.push('/dashboard'), 2400)
  }

  const stepProps = { step, direction, onBack: back, onSkip: handleSkip }

  return (
    <>
      {showConfetti && <ConfettiCanvas />}

      {step === 0 && (
        <OnboardingStep {...stepProps} onNext={next} nextLabel="Let's go" hideBack hideSkip={false}>
          <StepWelcome firstName={firstName} />
        </OnboardingStep>
      )}

      {step === 1 && (
        <OnboardingStep
          {...stepProps}
          onNext={next}
          nextDisabled={interest === null}
          nextLabel="Continue"
        >
          <StepInterest selected={interest} onSelect={setInterest} />
        </OnboardingStep>
      )}

      {step === 2 && (
        <OnboardingStep {...stepProps} onNext={next} nextLabel="Next">
          <StepDemo />
        </OnboardingStep>
      )}

      {step === 3 && (
        <OnboardingStep {...stepProps} onNext={next} nextLabel="Almost there">
          <StepPlan selected={plan} onSelect={setPlan} />
        </OnboardingStep>
      )}

      {step === 4 && (
        <OnboardingStep
          {...stepProps}
          onNext={handleFinish}
          nextLabel={completing ? 'Launching...' : 'Go to Dashboard'}
          nextDisabled={completing}
          hideSkip
        >
          <StepDone firstName={firstName} />
        </OnboardingStep>
      )}
    </>
  )
}
