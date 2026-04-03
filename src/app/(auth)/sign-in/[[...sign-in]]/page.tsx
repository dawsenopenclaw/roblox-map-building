'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Clerk appearance ─────────────────────────────────────────────────────────

const clerkAppearance = {
  variables: {
    colorPrimary: '#7C3AED',
    colorBackground: '#0d1030',
    colorText: '#FAFAFA',
    colorTextSecondary: '#71717A',
    colorInputBackground: '#131736',
    colorInputText: '#FAFAFA',
    colorInputPlaceholder: '#71717A',
    colorNeutral: '#1e2347',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    borderRadius: '10px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    spacingUnit: '16px',
  },
  elements: {
    rootBox: '!w-full',
    card: '!bg-transparent !border-none !shadow-none !rounded-none !p-0 !w-full',
    cardBox: '!shadow-none !bg-transparent !w-full',
    main: '!w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    formFieldLabel: '!text-zinc-400 !text-xs !font-medium !tracking-wide !uppercase',
    formFieldInput: [
      '!bg-[#131736]',
      '!border !border-white/[0.07]',
      '!text-[#FAFAFA]',
      '!rounded-xl',
      '!h-11',
      'focus:!border-[#7C3AED] focus:!ring-1 focus:!ring-[#7C3AED]/30',
      '!transition-colors',
    ].join(' '),
    formButtonPrimary: [
      '!bg-gradient-to-br !from-[#7C3AED] !to-[#6366F1]',
      'hover:!from-[#6D28D9] hover:!to-[#5355e8]',
      '!text-white !font-semibold',
      '!rounded-xl !h-11',
      '!transition-all !duration-150',
      '!shadow-none',
    ].join(' '),
    socialButtonsBlockButton: [
      '!border !border-white/[0.07]',
      '!bg-[#0d1030] hover:!bg-white/5',
      '!text-[#FAFAFA]',
      '!rounded-xl !h-11',
      '!transition-colors !duration-150',
    ].join(' '),
    socialButtonsBlockButtonText: '!text-[#FAFAFA] !font-medium',
    dividerLine: '!bg-white/[0.07]',
    dividerText: '!text-zinc-500 !text-xs',
    footerActionLink: '!text-[#FFB81C] hover:!text-[#D4AF37] !font-medium !transition-colors',
    footerActionText: '!text-zinc-500',
    identityPreviewEditButton: '!text-[#FFB81C] hover:!text-[#D4AF37]',
    formResendCodeLink: '!text-[#FFB81C] hover:!text-[#D4AF37]',
    otpCodeFieldInput: '!border-white/[0.07] !bg-[#0d1030] !text-[#FAFAFA] !rounded-lg',
    alertText: '!text-sm',
    alternativeMethodsBlockButton: [
      '!border !border-white/[0.07]',
      '!bg-[#0d1030] hover:!bg-white/5',
      '!text-[#FAFAFA] !rounded-xl',
    ].join(' '),
    formFieldAction: '!text-[#FFB81C] hover:!text-[#D4AF37]',
    backLink: '!text-[#FFB81C] hover:!text-[#D4AF37]',
  },
}

// ─── Trust indicators ─────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    label: '256-bit encryption',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: 'COPPA compliant',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'No credit card',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="20,6 9,17 4,12" />
      </svg>
    ),
  },
]

function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
      {TRUST_ITEMS.map(({ label, icon }) => (
        <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#52525B' }}>
          <span style={{ color: '#71717A' }}>{icon}</span>
          {label}
        </span>
      ))}
    </div>
  )
}

// ─── Accent line ──────────────────────────────────────────────────────────────

function AccentLine() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 60,
        height: 2,
        background: 'linear-gradient(90deg, #FFB81C, #7C3AED)',
        borderRadius: 2,
        transformOrigin: 'left center',
        marginTop: 10,
        marginBottom: 26,
      }}
    />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded } = useAuth()
  const [clerkError, setClerkError] = useState(false)
  const redirectUrl = searchParams.get('redirect_url') ?? '/editor'

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirectUrl)
    }
  }, [isLoaded, isSignedIn, router, redirectUrl])

  useEffect(() => {
    const timer = setTimeout(() => {
      const clerkEl = document.querySelector('[data-clerk-component]')
      if (!clerkEl) setClerkError(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full">

      {/* Heading */}
      <h1 className="text-[1.6rem] font-bold tracking-tight leading-tight" style={{ color: '#FAFAFA' }}>
        Welcome{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #FFB81C 0%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          back
        </span>
      </h1>

      <AccentLine />

      {clerkError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400 text-sm font-medium mb-2">Authentication service unavailable</p>
          <p className="text-zinc-500 text-xs mb-4">
            Please try refreshing the page. If the issue persists, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', color: '#fff' }}
          >
            Refresh page
          </button>
        </div>
      ) : (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={redirectUrl}
          appearance={clerkAppearance}
        />
      )}

      {/* Sign up link */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-sm text-center" style={{ color: '#71717A' }}>
          New to ForjeGames?{' '}
          <Link
            href="/sign-up"
            className="font-semibold transition-colors"
            style={{ color: '#FFB81C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#D4AF37' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFB81C' }}
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Trust indicators */}
      <TrustIndicators />

    </div>
  )
}
