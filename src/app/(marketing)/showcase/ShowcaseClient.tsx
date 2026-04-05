'use client'

import { Bell, Sparkles, Star, Zap, Trophy, Layers } from 'lucide-react'

// Shimmer placeholder card
function PlaceholderCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Thumbnail shimmer */}
      <div
        className="w-full h-36 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.06) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
            animationDelay: `${delay}ms`,
          }}
        />
        {/* Decorative grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{ border: '0.5px solid rgba(212,175,55,0.15)' }}
            />
          ))}
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="w-7 h-7 text-white/10" />
        </div>
      </div>
      {/* Card body shimmer */}
      <div className="p-4 space-y-2">
        <div
          className="h-3 w-3/4 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            animation: 'shimmer 2s ease-in-out infinite',
            animationDelay: `${delay + 100}ms`,
          }}
        />
        <div
          className="h-2.5 w-1/2 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.04)',
            animation: 'shimmer 2s ease-in-out infinite',
            animationDelay: `${delay + 200}ms`,
          }}
        />
        <div className="flex items-center gap-2 pt-1">
          <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-2 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="ml-auto flex items-center gap-1">
            <Star className="w-3 h-3 text-[#D4AF37]/30" />
            <div className="h-2 w-6 rounded-full" style={{ background: 'rgba(212,175,55,0.15)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const COMING_FEATURES = [
  { icon: Trophy, label: 'Top Builds' },
  { icon: Sparkles, label: 'Editor Picks' },
  { icon: Star, label: 'Community Votes' },
  { icon: Zap, label: 'Trending Now' },
]

export default function ShowcaseClient() {
  return (
    <div className="max-w-5xl mx-auto pb-16 pt-2 px-4">

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12 mb-10 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 0 30px rgba(212,175,55,0.1)',
            }}
          >
            <Trophy className="w-6 h-6 text-[#D4AF37]" />
          </div>

          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 mb-4">
            Preview
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Creator{' '}
            <span
              className="text-[#D4AF37]"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}
            >
              Showcase
            </span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
            The best community builds in one place — featured maps, trending creations,
            and editor picks. All powered by ForjeGames.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {COMING_FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <Icon className="w-3 h-3 text-[#D4AF37]/60" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Placeholder gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {[0, 80, 160, 240, 320, 400].map((delay) => (
          <PlaceholderCard key={delay} delay={delay} />
        ))}
      </div>

      {/* Notify CTA */}
      <div
        className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <Bell className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white font-bold">Creator showcases launching soon</p>
          <p className="text-gray-400 text-sm mt-0.5">
            The best community builds in one place. Get notified when we launch.
          </p>
        </div>
        <a
          href="mailto:hello@forjegames.com?subject=Showcase%20Waitlist"
          className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100 whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          <Bell className="w-3.5 h-3.5" />
          Get Notified
        </a>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
