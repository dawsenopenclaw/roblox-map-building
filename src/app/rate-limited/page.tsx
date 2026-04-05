'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

const PLAN_PERKS = [
  'Up to 10x higher request limits',
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

  const resetTime = new Date(Date.now() + secondsLeft * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#D4AF37]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-20 h-20 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center">
              <svg
                className={`w-9 h-9 text-[#D4AF37] transition-transform duration-300 ${pulsing ? 'scale-125' : 'scale-100'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Slow Down</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            You&apos;ve hit the rate limit for your plan.
          </p>

          {/* Reset time badge */}
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg px-4 py-2 mb-6 mt-2">
            <svg className="w-4 h-4 text-[#D4AF37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm text-[#D4AF37] font-medium">
              Resets in{' '}
              <span className="font-bold tabular-nums">{secondsLeft}s</span>
              {' '}— at {resetTime}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-8">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #D4AF37 0%, #E6A519 100%)',
              }}
            />
          </div>

          {/* Upgrade pitch */}
          <div className="border-t border-white/[0.07] pt-7">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Want higher limits?</p>

            <ul className="space-y-2 mb-6 text-left max-w-xs mx-auto">
              {PLAN_PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#D4AF37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
              Upgrade your plan
            </Link>
          </div>

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}

export default function RateLimitedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050810]" />}>
      <RateLimitedContent />
    </Suspense>
  )
}
