'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  'missing-token': {
    title: 'Invalid Link',
    description: 'This consent link is missing required information. Please ask your child to request a new consent email.',
  },
  'invalid-token': {
    title: 'Invalid Link',
    description: 'This consent link is invalid or has already been used. Please ask your child to request a new consent email.',
  },
  'expired-token': {
    title: 'Link Expired',
    description: 'This consent link has expired (links are valid for 48 hours). Please ask your child to request a new consent email from the app.',
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#141414] border border-red-500/20 rounded-xl p-8 shadow-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-3">{msg.title}</h2>
          <p className="text-gray-300 text-sm">{msg.description}</p>
          <p className="text-gray-400 text-xs mt-6">
            Need help?{' '}
            <a href="mailto:support@ForjeGames.com" className="text-[#FFB81C]">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <ErrorContent />
    </Suspense>
  )
}
