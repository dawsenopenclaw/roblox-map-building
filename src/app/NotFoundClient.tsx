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
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-[#D4AF37]/7 blur-[130px]" />
      </div>

      <div className="relative max-w-lg w-full text-center">
        {/* Giant 404 watermark */}
        <p
          className="absolute -top-14 left-1/2 -translate-x-1/2 text-[140px] font-black leading-none select-none pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #D4AF37 0%, #FFD966 40%, rgba(212,175,55,0.04) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden="true"
        >
          404
        </p>

        <div className="relative bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon — premium gold glow */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div
              className="relative w-20 h-20 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(212,175,55,0.28), inset 0 0 20px rgba(212,175,55,0.08)' }}
            >
              <svg
                className="w-9 h-9 text-[#D4AF37]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Page Not Found</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            This page doesn&apos;t exist or may have been moved.
            Your projects are safe — let us point you in the right direction.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a page..."
              className="flex-1 bg-white/[0.04] border border-white/[0.07] focus:border-[#D4AF37]/40 text-white placeholder-gray-600 text-sm rounded-xl px-4 py-2.5 outline-none transition-colors"
            />
            <button
              type="submit"
              className="text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
            >
              Search
            </button>
          </form>

          {/* Primary CTA */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-black font-bold px-8 py-3 rounded-xl transition-all text-sm shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5 mb-8"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Dashboard
          </Link>

          {/* Quick links */}
          <div className="border-t border-white/[0.07] pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Quick links</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}
