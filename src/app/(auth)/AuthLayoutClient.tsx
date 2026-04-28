'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ForjeLogo } from '@/components/ForjeLogo'
import { useAuth, useClerk } from '@clerk/nextjs'


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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: '#050510' }}>
      {/* Space background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(100,60,180,0.04) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(60,100,180,0.03) 0%, transparent 50%)',
        }}
      />
      {/* Stars layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.2), transparent), radial-gradient(1.5px 1.5px at 15% 60%, rgba(212,175,55,0.4), transparent), radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 50% 70%, rgba(255,255,255,0.2), transparent), radial-gradient(1.5px 1.5px at 65% 85%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 90% 75%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 5% 90%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.15), transparent), radial-gradient(1px 1px at 75% 65%, rgba(212,175,55,0.3), transparent), radial-gradient(1px 1px at 95% 10%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 45% 25%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.15), transparent)',
        }}
      />

      {/* Branding header — always visible */}
      <div className="relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 select-none group mb-4">
          <ForjeLogo size={28} useImage className="transition-opacity duration-150 group-hover:opacity-80" />
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
          '200+ AI agents',
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
