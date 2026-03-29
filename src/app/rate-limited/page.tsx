'use client'

import { Hourglass, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

const PLAN_PERKS = [
  'Up to 10× higher request limits',
  'Priority queue — your builds go first',
  'Dedicated compute allocation',
]

function RateLimitedContent() {
  const searchParams = useSearchParams()
  const rawSeconds = parseInt(searchParams.get('retry_after') ?? '60', 10)
  const [secondsLeft, setSecondsLeft] = useState(isNaN(rawSeconds) ? 60 : rawSeconds)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.reload()
      return
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse icon on every tick
  useEffect(() => {
    setPulsing(true)
    const t = setTimeout(() => setPulsing(false), 300)
    return () => clearTimeout(t)
  }, [secondsLeft])

  const progress = Math.max(0, Math.min(100, ((rawSeconds - secondsLeft) / rawSeconds) * 100))

  // Format reset time as clock time
  const resetTime = new Date(Date.now() + secondsLeft * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 overflow-hidden">
      {/* Amber ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#FFB81C]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-[#242424]/90 backdrop-blur-sm border border-[#FFB81C]/20 rounded-2xl p-10 shadow-2xl">

          {/* Hourglass icon */}
          <div className="mx-auto mb-6 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#FFB81C]/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-20 h-20 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/25 flex items-center justify-center">
              <Hourglass
                className={`w-9 h-9 text-[#FFB81C] transition-transform duration-300 ${pulsing ? 'scale-125' : 'scale-100'}`}
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Slow down!</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-1">
            You&apos;ve hit the rate limit for your plan.
          </p>

          {/* Reset time */}
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-lg px-4 py-2 mb-6 mt-2">
            <svg className="w-4 h-4 text-[#FFB81C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm text-[#FFB81C] font-medium">
              Resets in{' '}
              <span className="font-bold tabular-nums">{secondsLeft}s</span>
              {' '}— at {resetTime}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-[#FFB81C] to-[#F5A623] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Upgrade pitch */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Want higher limits?</p>

            <ul className="space-y-2 mb-6 text-left max-w-xs mx-auto">
              {PLAN_PERKS.map(perk => (
                <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-[#FFB81C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm transition-all shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/30 hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4" strokeWidth={2.5} />
              Upgrade your plan
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function RateLimitedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a1a]" />}>
      <RateLimitedContent />
    </Suspense>
  )
}
