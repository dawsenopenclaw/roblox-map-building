'use client'

import { useSignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'

export default function SignInClient() {
  const { signIn, isLoaded } = useSignIn()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRobloxSignIn = async () => {
    if (!isLoaded || !signIn) return
    setLoading('roblox')
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_custom_roblox',
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: '/onboarding/age-gate',
      })
    } catch (e) {
      console.error('Roblox sign-in failed:', e)
      setLoading(null)
    }
  }

  const handleOAuthSignIn = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded || !signIn) return
    setLoading(strategy)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: '/onboarding/age-gate',
      })
    } catch (e) {
      console.error(`${strategy} sign-in failed:`, e)
      setLoading(null)
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-sm text-zinc-500 mb-6">Sign in to continue building</p>

      {/* Primary: Roblox Sign In */}
      <button
        onClick={handleRobloxSignIn}
        disabled={!isLoaded || loading !== null}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-lg bg-[#00A2FF] hover:bg-[#0090E0] text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading === 'roblox' ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.164 0L0 18.576l18.836 5.424L24 5.424 5.164 0zm9.358 14.178l-4.701-1.354 1.354-4.7 4.7 1.354-1.353 4.7z" />
          </svg>
        )}
        {loading === 'roblox' ? 'Connecting to Roblox...' : 'Continue with Roblox'}
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-zinc-600" style={{ background: '#0a0d14' }}>or sign in with</span>
        </div>
      </div>

      {/* Secondary: Google & Apple */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuthSignIn('oauth_google')}
          disabled={!isLoaded || loading !== null}
          className="flex items-center justify-center gap-2 h-10 rounded-lg border border-white/[0.08] bg-transparent hover:bg-white/5 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading === 'oauth_google' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google
        </button>

        <button
          onClick={() => handleOAuthSignIn('oauth_apple')}
          disabled={!isLoaded || loading !== null}
          className="flex items-center justify-center gap-2 h-10 rounded-lg border border-white/[0.08] bg-transparent hover:bg-white/5 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading === 'oauth_apple' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          Apple
        </button>
      </div>

      <p className="text-xs text-zinc-600 text-center mt-4">
        Roblox sign-in links your account automatically. Google and Apple are alternative sign-in methods.
      </p>

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <p className="text-sm text-center text-zinc-500">
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-[#D4AF37] hover:text-[#E6A619] transition-colors">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}
