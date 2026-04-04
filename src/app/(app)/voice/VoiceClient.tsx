'use client'

import { useState, useEffect } from 'react'
import { Mic, Wand2, Command, MessageSquare, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: Mic,
    title: 'Speak → Build',
    desc: 'Say "add a medieval castle with a moat" and watch it generate in seconds.',
  },
  {
    icon: Command,
    title: 'Voice Commands',
    desc: 'Rotate, scale, delete, undo — all hands-free. Stay in flow.',
  },
  {
    icon: MessageSquare,
    title: 'Natural Language',
    desc: 'No special syntax. Talk like you would to a teammate.',
  },
  {
    icon: Zap,
    title: 'Real-time',
    desc: 'Changes appear as you speak — no press-to-confirm step.',
  },
]

// Number of bars in the audio wave
const BAR_COUNT = 20

export default function VoiceClient() {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.2))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Animate idle wave
    const interval = setInterval(() => {
      setBars(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const t = Date.now() / 800
          const wave = Math.sin(t + i * 0.5) * 0.35 + 0.4
          const jitter = Math.random() * 0.15
          return Math.min(1, Math.max(0.08, wave + jitter))
        })
      )
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-3xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12 mb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          {/* Mic + wave animation */}
          <div className="flex flex-col items-center gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212,175,55,0.25)',
                boxShadow: '0 0 30px rgba(212,175,55,0.12)',
              }}
            >
              <Mic className="w-7 h-7 text-[#D4AF37]" />
            </div>

            {/* Audio wave bars */}
            <div
              className="flex items-center gap-[3px] h-10"
              aria-label="Audio wave animation"
              aria-hidden="true"
            >
              {bars.map((height, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: '3px',
                    height: `${height * 40}px`,
                    background: mounted
                      ? `rgba(212,175,55,${0.3 + height * 0.6})`
                      : 'rgba(212,175,55,0.2)',
                    transition: 'height 0.08s ease, background 0.08s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 mb-4">
            Coming Soon
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Voice{' '}
            <span
              className="text-[#D4AF37]"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}
            >
              Builder
            </span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
            Describe your game out loud and watch it come to life.
            The fastest way to build has no keyboard.
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="group rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <a
          href="mailto:hello@forjegames.com?subject=Voice%20Builder%20Waitlist"
          className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          <Wand2 className="w-4 h-4" />
          Join Waitlist
        </a>
      </div>
    </div>
  )
}
