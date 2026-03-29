'use client'

import { Hourglass } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

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

  // Pulse the icon on every tick
  useEffect(() => {
    setPulsing(true)
    const t = setTimeout(() => setPulsing(false), 300)
    return () => clearTimeout(t)
  }, [secondsLeft])

  const progress = Math.max(0, Math.min(100, ((rawSeconds - secondsLeft) / rawSeconds) * 100))

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-10 shadow-2xl">

          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center">
            <Hourglass
              className={`w-9 h-9 text-[#FFB81C] transition-transform duration-300 ${pulsing ? 'scale-110' : 'scale-100'}`}
              strokeWidth={1.5}
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Slow down!</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            You&apos;ve exceeded the rate limit. Please wait{' '}
            <span className="text-[#FFB81C] font-semibold tabular-nums">{secondsLeft}</span>{' '}
            {secondsLeft === 1 ? 'second' : 'seconds'} and you&apos;ll be redirected automatically.
          </p>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-[#FFB81C] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Need higher limits?</p>
            <p className="text-gray-400 text-sm mb-5">
              Upgrade your plan for significantly higher request limits, priority processing,
              and dedicated throughput.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm transition-colors"
            >
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
    <Suspense fallback={<div className="min-h-screen bg-[#0A0E27]" />}>
      <RateLimitedContent />
    </Suspense>
  )
}
