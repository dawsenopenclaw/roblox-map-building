'use client'

import { Flame } from 'lucide-react'

export function StreakWidget({ streak = 0 }: { streak?: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141414] border border-[#2a2a2a]">
      <Flame className={`w-5 h-5 ${streak > 0 ? 'text-[#D4AF37]' : 'text-[#808080]'}`} />
      <div>
        <p className="text-sm font-semibold text-white">{streak} day streak</p>
        <p className="text-xs text-[#808080]">{streak > 0 ? 'Keep it going!' : 'Build something today'}</p>
      </div>
    </div>
  )
}
