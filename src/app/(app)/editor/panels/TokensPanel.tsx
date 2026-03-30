'use client'

import React from 'react'
import Link from 'next/link'

const RECENT_USAGE = [
  { cmd: 'Build castle with moat',   tokens: 42 },
  { cmd: 'Add NPC patrol system',    tokens: 38 },
  { cmd: 'Generate forest biome',    tokens: 51 },
  { cmd: 'Create race track layout', tokens: 29 },
  { cmd: 'Design dungeon entrance',  tokens: 35 },
]

export interface TokensPanelProps {
  tokensUsed: number
}

export default function TokensPanel({ tokensUsed }: TokensPanelProps) {
  const TOKEN_LIMIT = 1000
  const balance = 1000
  const remaining = Math.max(0, balance - tokensUsed)
  const usedPct = Math.min(100, (tokensUsed / TOKEN_LIMIT) * 100)
  const barColor = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f97316' : '#60A5FA'

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-400/8 border border-blue-400/20 rounded-xl p-4 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Balance</p>
        <p className="text-3xl font-bold text-blue-400">{remaining.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">tokens</p>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-gray-500">Used this session</span>
          <span className="text-[10px] text-blue-400">{tokensUsed} / {TOKEN_LIMIT.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usedPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      <Link href="/pricing" className="flex items-center justify-center gap-2 w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
        Buy More
      </Link>

      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Recent Usage</p>
        <div className="space-y-1">
          {RECENT_USAGE.map(({ cmd, tokens }) => (
            <div key={cmd} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
              <p className="text-[11px] text-gray-300 truncate flex-1 mr-2">{cmd}</p>
              <span className="text-[10px] text-blue-400/70 font-medium flex-shrink-0">{tokens}t</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
