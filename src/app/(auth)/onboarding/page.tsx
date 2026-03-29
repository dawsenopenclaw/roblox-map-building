'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function OnboardingPage() {
  const router = useRouter()
  const { track } = useAnalytics()

  useEffect(() => {
    track('onboarding_step_completed', { step: 'welcome', stepIndex: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to ForjeGames</h1>
        <p className="text-gray-400 mb-8">Let&apos;s set up your account. This takes 30 seconds.</p>
        <button
          onClick={() => router.push('/onboarding/age-gate')}
          className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
