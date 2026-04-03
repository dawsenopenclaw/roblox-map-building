'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    alternativeMethodsBlockButton: [
      '!border !border-white/[0.07]',
      '!bg-[#0d1030] hover:!bg-white/5',
      '!text-[#FAFAFA] !rounded-xl',
    ].join(' '),
    formFieldAction: '!text-[#FFB81C] hover:!text-[#D4AF37]',
    backLink: '!text-[#FFB81C] hover:!text-[#D4AF37]',
  },
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

// ─── "What you get" perks ─────────────────────────────────────────────────────

const PERKS = [
  {
    label: '1,000 free tokens',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFB81C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'All AI models',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93A10 10 0 0 0 2 12" />
        <path d="M4.93 19.07A10 10 0 0 0 22 12" />
      </svg>
    ),
  },
  {
    label: 'Live Studio sync',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="23,4 23,10 17,10" />
        <polyline points="1,20 1,14 7,14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
]

function WhatYouGet() {
  return (
    <div
      className="mt-5 rounded-xl px-4 py-3.5"
      style={{
        background: 'rgba(124,58,237,0.06)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#52525B' }}>
        What you get
      </p>
      <div className="flex flex-col gap-2">
        {PERKS.map(({ label, icon }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <span className="text-xs" style={{ color: '#A1A1AA' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [clerkError, setClerkError] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/onboarding/age-gate')
    }
  }, [isLoaded, isSignedIn, router])

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
        Start{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #FFB81C 0%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          building
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
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding/age-gate"
          appearance={clerkAppearance}
        />
      )}

      {/* Sign in link */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-sm text-center" style={{ color: '#71717A' }}>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-semibold transition-colors"
            style={{ color: '#FFB81C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#D4AF37' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFB81C' }}
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Trust indicators */}
      <TrustIndicators />

      {/* What you get */}
      <WhatYouGet />

    </div>
  )
}
