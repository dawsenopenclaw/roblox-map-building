'use client'

import { motion } from 'framer-motion'

interface OnboardingShellProps {
  currentStep: number
  totalSteps: number
  children: React.ReactNode
}

export function OnboardingShell({ currentStep, totalSteps, children }: OnboardingShellProps) {
  const pct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs" style={{ color: '#A1A1AA' }}>
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-semibold" style={{ color: '#FFB81C' }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4AF37, #FFB81C)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      {children}
    </div>
  )
}
