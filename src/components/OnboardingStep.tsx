'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TOTAL_STEPS } from '@/lib/onboarding'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingStepProps {
  step: number
  direction: number // +1 = forward, -1 = backward
  children: React.ReactNode
  onNext?: () => void
  onBack?: () => void
  onSkip?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
  hideSkip?: boolean
  hideNext?: boolean
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
}

const transition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              width: active ? 24 : 8,
              backgroundColor: done || active ? '#FFB81C' : 'rgba(255,255,255,0.15)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="h-2 rounded-full"
          />
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingStep({
  step,
  direction,
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideBack = false,
  hideSkip = false,
  hideNext = false,
}: OnboardingStepProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FFB81C] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">ForjeGames</span>
        </div>

        <span className="text-gray-400 text-sm">
          {step + 1} of {TOTAL_STEPS}
        </span>

        {!hideSkip && (
          <button
            onClick={onSkip}
            className="text-gray-400 text-sm hover:text-gray-300 transition-colors"
          >
            Skip
          </button>
        )}
        {hideSkip && <div className="w-10" />}
      </div>

      {/* Progress dots */}
      <div className="px-6 mt-6">
        <ProgressDots current={step} />
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="w-full max-w-lg"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {(!hideNext || !hideBack) && (
        <div className="px-6 pb-10 flex items-center gap-3">
          {!hideBack && (
            <button
              onClick={onBack}
              className="flex-none px-5 py-3 rounded-xl text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
            >
              Back
            </button>
          )}
          {!hideNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all bg-[#FFB81C] text-black hover:bg-[#E6A519] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
