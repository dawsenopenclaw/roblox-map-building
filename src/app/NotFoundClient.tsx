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

export default function NotFoundClient() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/dashboard?search=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 overflow-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#FFB81C 1px, transparent 1px), linear-gradient(90deg, #FFB81C 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow behind card */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-[#FFB81C]/5 blur-[120px]" />
      </div>

      <div className="relative max-w-lg w-full text-center">
        {/* Giant 404 behind card */}
        <p
          className="absolute -top-16 left-1/2 -translate-x-1/2 text-[160px] font-black leading-none select-none pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #FFB81C 0%, #F5A623 40%, #FFB81C08 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden="true"
        >
          404
        </p>

        <div className="relative bg-[#242424]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div
              className="absolute inset-0 rounded-full bg-[#FFB81C]/10 animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#FFB81C]/30 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-[#FFB81C]"
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
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-gray-400 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
            This page doesn&apos;t exist or may have been moved.
            Your projects are safe — let us point you in the right direction.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for a page..."
              className="flex-1 bg-[#1a1a1a] border border-white/10 focus:border-[#FFB81C]/50 text-white placeholder-gray-600 text-sm rounded-xl px-4 py-2.5 outline-none transition-colors"
            />
            <button
              type="submit"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0"
            >
              Search
            </button>
          </form>

          {/* Primary CTA */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-8 py-3 rounded-xl transition-all text-sm shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/30 hover:-translate-y-0.5 mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
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
