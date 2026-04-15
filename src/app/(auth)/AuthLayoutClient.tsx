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

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-16" style={{ background: '#050810' }}>
      {/* Ambient gold glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{ background: 'radial-gradient(ellipse 800px 600px at 50% 30%, rgba(212,175,55,0.05) 0%, transparent 70%)' }}
      />

      {/* Brand mark + tagline */}
      <div className="relative z-10 mb-10 sm:mb-12 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-3 select-none group">
          <LogoMark />
          <span className="text-2xl sm:text-3xl font-bold tracking-tight transition-opacity duration-150 group-hover:opacity-80">
            <span className="text-white">Forje</span>
            <span style={{ color: '#D4AF37' }}>Games</span>
          </span>
        </Link>
        <p className="mt-4 text-base sm:text-lg text-zinc-500 text-center max-w-sm">
          Build Roblox games with AI — <span className="text-zinc-300">from prompt to playable</span> in minutes.
        </p>
      </div>

      {/* Auth card — glass-morphism, spacious */}
      <div
        className="relative z-10 w-full rounded-2xl p-8 sm:p-10 md:p-12"
        style={{
          maxWidth: '32rem',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 100px rgba(212,175,55,0.04)',
        }}
      >
        {children}
      </div>

      <SignOutButton />

      <p className="relative z-10 mt-6 text-sm text-zinc-600">
        By continuing you agree to our{' '}
        <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 transition-colors duration-150 underline underline-offset-2">Terms</Link>
        {' & '}
        <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 transition-colors duration-150 underline underline-offset-2">Privacy</Link>
      </p>
    </div>
  )
}
