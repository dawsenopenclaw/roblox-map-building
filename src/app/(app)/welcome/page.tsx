'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { completeOnboarding, type OnboardingInterest } from '@/lib/onboarding'

// ─── Types ────────────────────────────────────────────────────────────────────

type Interest = OnboardingInterest

const TOTAL_STEPS = 3

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step - 1
              ? 'bg-[#FFB81C]/60'
              : i === step - 1
              ? 'bg-[#FFB81C]'
              : 'bg-white/10'
          }`}
        />
      ))}
      <span className="text-gray-400 text-xs ml-1 whitespace-nowrap">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  )
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

const INTERESTS: { id: Interest; icon: string; label: string }[] = [
  { id: 'games', icon: '🎮', label: 'Games' },
  { id: 'maps', icon: '🗺️', label: 'Maps' },
  { id: 'assets', icon: '🎨', label: 'Assets' },
  { id: 'all', icon: '✨', label: 'Everything' },
]

function StepWelcome({
  firstName,
  selected,
  onSelect,
}: {
  firstName: string
  selected: Interest | null
  onSelect: (v: Interest) => void
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome to ForjeGames{firstName ? `, ${firstName}` : ''}! 🎮
      </h1>
      <p className="text-gray-300 mb-8">
        What do you want to build?
      </p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {INTERESTS.map((item) => {
          const active = selected === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-xl border text-sm font-semibold transition-all ${
                active
                  ? 'border-[#FFB81C] bg-[#FFB81C]/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Try It ───────────────────────────────────────────────────────────

const DEMO_STEPS = [
  'Parsing prompt...',
  'Generating terrain...',
  'Placing structures...',
  'Adding details...',
  'Generating scripts...',
  'Done!',
]

// Each suggestion is the completion after "Build me a "
const SUGGESTIONS = [
  'medieval castle',
  'racing track',
  'tycoon game',
]

function StepTryIt() {
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [demoStep, setDemoStep] = useState(-1)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runDemo = (prompt: string) => {
    if (!prompt.trim() || running) return
    setDone(false)
    setRunning(true)
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
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Let's build something right now.</h2>
      <p className="text-gray-300 mb-6">Type what you want:</p>

      {/* Input */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          Build me a
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runDemo(input ? `Build me a ${input}` : `Build me a ${SUGGESTIONS[0]}`)}
          placeholder="medieval castle"
          disabled={running}
          className="w-full bg-[#141414] border border-white/15 rounded-xl pl-24 pr-20 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-400/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => runDemo(input ? `Build me a ${input}` : `Build me a ${SUGGESTIONS[0]}`)}
          disabled={running}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#FFB81C] text-black text-xs font-bold rounded-lg hover:bg-[#E6A519] disabled:opacity-40 transition-all"
        >
          {running ? '...' : 'Go →'}
        </button>
      </div>

      {/* Suggestions */}
      {!running && !done && (
        <div className="flex flex-col gap-1.5 mb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-left text-xs text-gray-400 hover:text-gray-300 transition-colors px-1"
            >
              "Build me a {s}"
            </button>
          ))}
        </div>
      )}

      {/* Build log */}
      {(running || done) && (
        <div className="bg-[#0A0D1A] border border-white/10 rounded-xl p-4 font-mono text-xs">
          {DEMO_STEPS.slice(0, Math.min(demoStep + 1, DEMO_STEPS.length)).map((s, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-[#FFB81C]">›</span>
              <span className={i < demoStep ? 'text-gray-400' : 'text-gray-200'}>{s}</span>
              {i < demoStep && <span className="ml-auto text-emerald-400">done</span>}
              {i === demoStep && running && (
                <span className="ml-auto text-[#FFB81C] animate-pulse">running</span>
              )}
            </div>
          ))}
          {done && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-semibold">Build complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Ready ────────────────────────────────────────────────────────────

function StepReady() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-5">🎉</div>
      <h2 className="text-3xl font-bold text-white mb-3">You're Ready!</h2>
      <p className="text-gray-300 text-lg mb-8">Welcome aboard!</p>

      <div className="bg-[#141414] border border-[#FFB81C]/20 rounded-xl py-5 px-4 mb-2">
        <p className="text-[#FFB81C] text-3xl font-bold">1,000</p>
        <p className="text-gray-300 text-sm mt-0.5">Free tokens to start building</p>
      </div>

      <p className="text-gray-500 text-xs mt-3">No credit card required. Tokens never expire.</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [interest, setInterest] = useState<Interest | null>(null)
  const [finishing, setFinishing] = useState(false)

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  const canNext =
    step === 1 ? interest !== null :
    step === 2 ? true :
    true

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }
    // Final step — finish onboarding
    setFinishing(true)
    try {
      await completeOnboarding(interest ?? 'all', false)
    } catch {
      // Non-fatal — metadata update failed, proceed anyway
    }
    router.push('/editor')
  }

  const handleSkip = async () => {
    setFinishing(true)
    try {
      await completeOnboarding(interest ?? 'all', true)
    } catch {
      // Non-fatal — metadata update failed, proceed anyway
    }
    router.push('/editor')
  }

  const nextLabel =
    step === TOTAL_STEPS
      ? finishing ? 'Launching...' : 'Go to Editor →'
      : 'Next →'

  return (
    <div className="min-h-screen bg-[#080B1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ProgressBar step={step} />

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 sm:p-7">
          {step === 1 && (
            <StepWelcome
              firstName={firstName}
              selected={interest}
              onSelect={setInterest}
            />
          )}
          {step === 2 && <StepTryIt />}
          {step === 3 && <StepReady />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleSkip}
              disabled={finishing}
              className="text-gray-400 text-sm hover:text-gray-300 transition-colors disabled:opacity-40"
            >
              Skip
            </button>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={finishing}
                  className="text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canNext || finishing}
                className="px-5 py-2.5 bg-[#FFB81C] text-black text-sm font-bold rounded-xl hover:bg-[#E6A519] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {nextLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
