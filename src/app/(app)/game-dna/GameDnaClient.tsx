'use client'

import Link from 'next/link'

/**
 * GameDnaClient — entry point for the Game DNA scanner.
 * Users submit a Roblox game URL/ID; the scanner analyses it and
 * redirects to the /game-dna/[id] report page.
 */
export default function GameDnaClient() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-white">
          Game <span className="text-[#FFB81C]">DNA</span> Scanner
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Analyse any Roblox game to extract its DNA — progression loops,
          monetization patterns, and growth opportunities.
        </p>

        <form
          action="/api/game-dna/scan"
          method="POST"
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            name="url"
            required
            placeholder="Roblox game URL or Place ID"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            Scan Game
          </button>
        </form>

        <p className="text-xs text-gray-600">
          View past scans in{" "}
          <Link href="/dashboard" className="text-[#FFB81C] hover:underline">
            your dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
