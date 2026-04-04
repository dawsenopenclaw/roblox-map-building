'use client'

import Link from 'next/link'
import { useAuth, useClerk } from '@clerk/nextjs'

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.06)" />
      <polygon points="16,8 24,13 24,19 16,24 8,19 8,13" fill="#D4AF37" opacity="0.5" />
      <circle cx="16" cy="16" r="3" fill="#D4AF37" />
    </svg>
  )
}

function SignOutButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()

  if (!isLoaded || !isSignedIn) return null

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/sign-in' })}
      className="relative z-10 mt-4 text-xs text-zinc-500 hover:text-[#D4AF37] transition-colors"
    >
      Signed in with wrong account? Sign out
    </button>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#09090b' }}>
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{ background: 'radial-gradient(ellipse 500px 400px at 50% 40%, rgba(212,175,55,0.03) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mb-8">
        <Link href="/" className="flex items-center gap-2 select-none">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Forje</span>
            <span style={{ color: '#D4AF37' }}>Games</span>
          </span>
        </Link>
      </div>

      <div
        className="relative z-10 w-full rounded-2xl p-8"
        style={{ maxWidth: '26rem', background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </div>

      <SignOutButton />

      <p className="relative z-10 mt-3 text-xs text-zinc-600">
        By continuing you agree to our{' '}
        <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Terms</Link>
        {' & '}
        <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Privacy</Link>
      </p>
    </div>
  )
}
