'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const clerkAppearance = {
  variables: {
    colorPrimary: '#D4AF37',
    colorBackground: '#141414',
    colorText: '#F9FAFB',
    colorTextSecondary: '#9CA3AF',
    colorInputBackground: '#1a2236',
    colorInputText: '#F9FAFB',
    colorInputPlaceholder: '#B0B0B0',
    colorNeutral: '#374151',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    borderRadius: '10px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    spacingUnit: '16px',
  },
  elements: {
    /* Outer card */
    card: [
      'bg-surface-2',
      'border border-border-subtle/50',
      'shadow-card-lg',
      'rounded-2xl',
      '!shadow-none',
      'ring-1 ring-white/5',
    ].join(' '),
    cardBox: 'shadow-none',

    /* Header — hide Clerk's default header; we supply our own above */
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',

    /* Form body */
    formFieldLabel: 'text-muted text-xs font-medium tracking-wide uppercase',
    formFieldInput: [
      'bg-[#0d1117]',
      'border border-border-subtle',
      'text-foreground',
      'placeholder-muted-subtle',
      'rounded-xl',
      'focus:border-gold focus:ring-1 focus:ring-gold/40',
      'transition-colors',
    ].join(' '),

    /* Primary CTA button */
    formButtonPrimary: [
      'bg-gold hover:bg-gold-light',
      'text-background font-semibold',
      'rounded-xl',
      'transition-colors duration-150',
      'shadow-gold-sm hover:shadow-gold',
    ].join(' '),

    /* Social OAuth buttons */
    socialButtonsBlockButton: [
      'border border-border-subtle',
      'bg-surface hover:bg-surface-elevated',
      'text-foreground',
      'rounded-xl',
      'transition-colors duration-150',
    ].join(' '),
    socialButtonsBlockButtonText: 'text-foreground font-medium',

    /* Divider */
    dividerLine: 'bg-border-subtle',
    dividerText: 'text-muted text-xs',

    /* Footer links */
    footerActionLink: 'text-gold hover:text-gold-light font-medium transition-colors',
    footerActionText: 'text-muted',
    footer: 'hidden', // we render our own footer below

    /* Misc */
    identityPreviewEditButton: 'text-gold hover:text-gold-light',
    formResendCodeLink: 'text-gold hover:text-gold-light',
    otpCodeFieldInput: 'border-border-subtle bg-surface text-foreground',
    alertText: 'text-sm',
    alternativeMethodsBlockButton: [
      'border border-border-subtle',
      'bg-surface hover:bg-surface-elevated',
      'text-foreground rounded-xl',
    ].join(' '),
  },
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function SignInPage() {
  const router = useRouter()

  // In demo mode, show demo login options instead of Clerk (which fails with test keys on prod)
  if (IS_DEMO) {
    return (
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to ForjeGames
          </h1>
          <p className="text-[#B0B0B0] text-sm mt-2">
            Choose how you want to explore
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => router.push('/editor')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#D4AF37] hover:bg-[#FFB81C] text-[#0a0a0a] font-bold py-3.5 text-base transition-all duration-150 shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 hover:-translate-y-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            Open AI Editor
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:bg-[#1c1c1c] text-white font-semibold py-3 text-sm transition-all duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            View Dashboard
          </button>

          <button
            onClick={() => router.push('/marketplace')}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:bg-[#1c1c1c] text-white font-semibold py-3 text-sm transition-all duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Browse Marketplace
          </button>
        </div>

        <div className="mt-6 px-4 py-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center">
          <p className="text-xs text-[#D4AF37]">
            Demo Mode — No account needed. Full access to all features.
          </p>
        </div>

        <p className="mt-4 text-xs text-[#808080] text-center">
          <Link href="/pricing" className="text-[#60A5FA] hover:text-[#93C5FD] transition-colors">
            View pricing plans
          </Link>
          {' · '}
          <Link href="/" className="text-[#60A5FA] hover:text-[#93C5FD] transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">

      {/* Page heading */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted text-sm mt-1">
          Sign in to continue building
        </p>
      </div>

      {/* Clerk SignIn */}
      <div className="w-full">
        <SignIn
          forceRedirectUrl="/editor"
          appearance={clerkAppearance}
        />
      </div>

      {/* Custom footer */}
      <p className="mt-4 text-sm text-muted text-center">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-gold hover:text-gold-light font-medium transition-colors">
          Sign up free
        </Link>
      </p>

      <p className="mt-2 text-xs text-muted-subtle text-center">
        Looking for pricing?{' '}
        <Link href="/pricing" className="text-muted hover:text-gold transition-colors underline underline-offset-2">
          View plans
        </Link>
      </p>

    </div>
  )
}
