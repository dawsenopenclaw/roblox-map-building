'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const QUICK_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/voice', label: 'Voice Build' },
  { href: '/image-to-map', label: 'Image to Map' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/settings', label: 'Settings' },
]

export default function NotFound() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    // Route to dashboard with search param — dashboard can handle it
    router.push(`/dashboard?search=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-10">
          {/* Compass / question mark illustration */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-[#FFB81C]/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative w-24 h-24 rounded-full bg-[#0A0E27] border-2 border-[#FFB81C]/30 flex items-center justify-center">
              <CompassIcon />
            </div>
          </div>

          {/* 404 badge */}
          <p className="text-7xl font-bold text-[#FFB81C]/15 font-mono mb-1 select-none">
            404
          </p>

          <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-gray-400 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
            This page doesn't exist or may have been moved.
            Your projects are safe — let us point you in the right direction.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-7">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for a page..."
              className="flex-1 bg-[#0A0E27] border border-white/10 focus:border-[#FFB81C]/50 text-white placeholder-gray-600 text-sm rounded-xl px-4 py-2.5 outline-none transition-colors"
            />
            <button
              type="submit"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0"
            >
              Search
            </button>
          </form>

          {/* Primary action */}
          <Link
            href="/dashboard"
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-8 py-3 rounded-xl transition-colors text-sm inline-block mb-8"
          >
            Go to Dashboard
          </Link>

          {/* Quick links */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Quick links</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {QUICK_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-[#FFB81C] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompassIcon() {
  return (
    <svg
      className="w-10 h-10 text-[#FFB81C]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
      />
    </svg>
  )
}
