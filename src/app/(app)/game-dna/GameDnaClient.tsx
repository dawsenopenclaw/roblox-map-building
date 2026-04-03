'use client'

import Link from 'next/link'

/**
 * GameDnaClient — entry point for the Game DNA scanner.
 * Users submit a Roblox game URL/ID; the scanner analyses it and
 * redirects to the /game-dna/[id] report page.
 */
export default function GameDnaClient() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#FFB81C]/70 uppercase tracking-widest">AI Feature</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Game <span className="text-[#FFB81C]">DNA</span> Scanner
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
          Analyse any Roblox game to extract its DNA — progression loops,
          monetisation patterns, and growth opportunities.
        </p>
      </div>

      {/* Search card with premium glow */}
      <div className="relative">
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 80%, #FFB81C 0%, transparent 70%)' }}
        />
        <div className="relative bg-[#141414] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center gap-6">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)' }}
          >
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <p className="text-white font-semibold text-lg">Scan any Roblox game</p>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Paste a game URL or Place ID to generate a full DNA report — loops, monetisation, and growth gaps.
            </p>
          </div>

          {/* Input + button */}
          <form
            action="/api/game-dna/scan"
            method="POST"
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xl"
          >
            <input
              type="text"
              name="url"
              required
              placeholder="Roblox game URL or Place ID"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
            <button
              type="submit"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              Scan Game
            </button>
          </form>

          <p className="text-xs text-gray-600">
            View past scans in{' '}
            <Link href="/dashboard" className="text-[#FFB81C] hover:underline">
              your dashboard
            </Link>
            .
          </p>
        </div>
      </div>

      {/* What DNA analyses */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What Game DNA Analyses</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Progression Loops',
              desc: 'Core gameplay cycles, reward cadence, player retention hooks and where they break.',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
            },
            {
              title: 'Monetisation Patterns',
              desc: 'GamePass pricing, developer product placement, UGC strategy, and conversion funnel analysis.',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: 'Growth Opportunities',
              desc: 'Gaps versus top competitors, missing systems, and AI-generated action plan to climb the charts.',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#141414] border border-white/[0.08] rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center text-[#FFB81C]">
                {item.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent scans placeholder */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Scans</p>
        <p className="text-gray-500 text-sm text-center py-6">
          No scans yet. Enter a game URL above to get started.
        </p>
      </div>

    </div>
  )
}
