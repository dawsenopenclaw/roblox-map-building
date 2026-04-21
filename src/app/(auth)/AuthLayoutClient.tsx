'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/editor')
    }
  }, [isLoaded, isSignedIn, router])

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-medium text-sm">Already signed in — redirecting...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: '#050810' }}>
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 50%)',
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Branding header — always visible */}
      <div className="relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 select-none group mb-4">
          <LogoMark />
          <span className="text-2xl font-bold tracking-tight transition-opacity duration-150 group-hover:opacity-80">
            <span className="text-white">Forje</span>
            <span style={{ color: '#D4AF37' }}>Games</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
          The only cursor you ever need for{' '}
          <span style={{ color: '#D4AF37' }}>Roblox</span>
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
          Build complete games from a single prompt — terrain, scripts, 3D assets, all synced live to Studio.
        </p>
      </div>

      {/* Feature pills */}
      <div className="relative z-10 flex flex-wrap justify-center gap-2 mb-8">
        {[
          '144+ AI agents',
          '3D mesh generation',
          '13 image styles',
          'Live Studio sync',
        ].map((feature) => (
          <span
            key={feature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 border border-white/[0.06] bg-white/[0.02]"
          >
            <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
            {feature}
          </span>
        ))}
      </div>

      {/* Auth form */}
      <div className="auth-card-wrapper relative z-10 w-full max-w-md">
        <AuthRedirectGuard>{children}</AuthRedirectGuard>
      </div>

      <SignOutButton />

      <p className="relative z-10 mt-6 text-xs text-zinc-600">
        By continuing you agree to our{' '}
        <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Terms</Link>
        {' & '}
        <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Privacy</Link>
      </p>
    </div>
  )
}
