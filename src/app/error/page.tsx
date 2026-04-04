'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  'missing-token': {
    title: 'Invalid Link',
    description:
      'This consent link is missing required information. Please ask your child to request a new consent email.',
  },
  'invalid-token': {
    title: 'Invalid Link',
    description:
      'This consent link is invalid or has already been used. Please ask your child to request a new consent email.',
  },
  'expired-token': {
    title: 'Link Expired',
    description:
      'This consent link has expired (links are valid for 48 hours). Please ask your child to request a new consent email from the app.',
  },
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'unknown'
  const msg = ERROR_MESSAGES[reason] ?? {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again or contact support.',
  }

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#f87171]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#f87171]/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative w-20 h-20 rounded-full bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-[#f87171]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">{msg.title}</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">{msg.description}</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:support@forjegames.com"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#f87171]/20 hover:shadow-[#f87171]/30 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }}
            >
              Contact support
            </a>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/25 text-white text-sm font-medium transition-colors"
            >
              Go home
            </Link>
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

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050810]" />}>
      <ErrorContent />
    </Suspense>
  )
}
