'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface DnaExample { name: string; score: number; players: string; rating: string; genre: string }

const DNA_EXAMPLES: DnaExample[] = [
  { name: 'Pet Simulator X', score: 92, players: '98K avg',  rating: '94%', genre: 'Pet Sim'   },
  { name: 'Adopt Me',        score: 88, players: '145K avg', rating: '91%', genre: 'Roleplay'  },
]

export const DnaPanel = React.memo(function DnaPanel() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [selectedExample, setSelectedExample] = useState<DnaExample | null>(null)

  const handleScan = () => {
    if (!url.trim() || scanning) return
    setScanning(true)
    setSelectedExample(null)
    setTimeout(() => {
      setScanning(false)
      setSelectedExample({ name: 'Custom Game', score: 76, players: 'N/A', rating: 'N/A', genre: 'Unknown' })
    }, 1400)
  }

  const active = selectedExample

  return (
    <div className="p-4 space-y-4">
      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Analyze any Roblox game</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="https://roblox.com/games/..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-400/50"
        />
        <button
          onClick={handleScan}
          disabled={!url.trim() || scanning}
          className="bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          {scanning ? '...' : 'Scan'}
        </button>
      </div>

      {/* Example scans */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Example Scans</p>
        <div className="space-y-1.5">
          {DNA_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => setSelectedExample(selectedExample?.name === ex.name ? null : ex)}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors',
                selectedExample?.name === ex.name
                  ? 'bg-[#FFB81C]/10 border-[#FFB81C]/30'
                  : 'bg-white/[0.03] border-white/8 hover:bg-white/6 hover:border-white/15',
              ].join(' ')}
            >
              <div>
                <p className="text-xs text-gray-200 font-medium">{ex.name}</p>
                <p className="text-[10px] text-gray-500">{ex.genre}</p>
              </div>
              <div className="text-right">
                <p className={[
                  'text-sm font-bold',
                  ex.score >= 90 ? 'text-emerald-400' : 'text-[#FFB81C]',
                ].join(' ')}>{ex.score}/100</p>
                <p className="text-[10px] text-gray-500">Score</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats for selected */}
      {active && (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-300 font-semibold">{active.name}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Score',   value: `${active.score}/100` },
              { label: 'Players', value: active.players },
              { label: 'Rating',  value: active.rating },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-white/5 rounded-md py-1.5">
                <p className="text-[11px] text-blue-400 font-bold">{value}</p>
                <p className="text-[9px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/game-dna" className="block text-center text-[11px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors">
        View full DNA reports &rarr;
      </Link>
    </div>
  )
})
