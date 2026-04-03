'use client'

import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

export default function ImageToMapClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6">
        <ImageIcon className="w-8 h-8 text-[#FFB81C]" />
      </div>
      <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] border border-[#FFB81C]/25 mb-4">
        Coming Soon
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Image to Map</h1>
      <p className="text-gray-400 max-w-md mb-8">
        Drop a photo or sketch and watch it become a Roblox map.
      </p>
      <Link href="/editor" className="text-sm font-semibold text-[#FFB81C] hover:text-[#FFD966] transition-colors">
        ← Back to Editor
      </Link>
    </div>
  )
}
