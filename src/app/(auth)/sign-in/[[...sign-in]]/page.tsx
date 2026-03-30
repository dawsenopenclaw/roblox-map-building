'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const clerkAppearance = {
  variables: {
    colorPrimary: '#D4AF37',
    colorBackground: '#111113',
    colorText: '#FAFAFA',
    colorTextSecondary: '#71717A',
    colorInputBackground: '#1a1a1c',
    colorInputText: '#FAFAFA',
    colorInputPlaceholder: '#71717A',
    colorNeutral: '#27272a',
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
      '!bg-[#111113]',
      '!border !border-white/[0.06]',
      '!shadow-none',
      '!rounded-2xl',
    ].join(' '),
    cardBox: '!shadow-none',

    /* Header — hide Clerk's default header; we supply our own above */
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',

    /* Form body */
    formFieldLabel: 'text-zinc-400 text-xs font-medium tracking-wide uppercase',
    formFieldInput: [
      '!bg-[#1a1a1c]',
      '!border !border-white/[0.06]',
      '!text-[#FAFAFA]',
      '!rounded-xl',
      'focus:!border-[#D4AF37] focus:!ring-1 focus:!ring-[#D4AF37]/30',
      '!transition-colors',
    ].join(' '),

    /* Primary CTA button */
    formButtonPrimary: [
      '!bg-[#D4AF37] hover:!bg-[#C9A227]',
      '!text-[#09090b] !font-semibold',
      '!rounded-xl',
      '!transition-colors !duration-150',
      '!shadow-none',
    ].join(' '),

    /* Social OAuth buttons */
    socialButtonsBlockButton: [
      '!border !border-white/[0.06]',
      '!bg-[#111113] hover:!bg-white/5',
      '!text-[#FAFAFA]',
      '!rounded-xl',
      '!transition-colors !duration-150',
    ].join(' '),
    socialButtonsBlockButtonText: '!text-[#FAFAFA] !font-medium',

    /* Divider */
    dividerLine: '!bg-white/[0.06]',
    dividerText: '!text-zinc-500 !text-xs',

    /* Footer links */
    footerActionLink: '!text-[#D4AF37] hover:!text-[#C9A227] !font-medium !transition-colors',
    footerActionText: '!text-zinc-500',
    footer: 'hidden',

    /* Misc */
    identityPreviewEditButton: '!text-[#D4AF37] hover:!text-[#C9A227]',
    formResendCodeLink: '!text-[#D4AF37] hover:!text-[#C9A227]',
    otpCodeFieldInput: '!border-white/[0.06] !bg-[#111113] !text-[#FAFAFA]',
    alertText: '!text-sm',
    alternativeMethodsBlockButton: [
      '!border !border-white/[0.06]',
      '!bg-[#111113] hover:!bg-white/5',
      '!text-[#FAFAFA] !rounded-xl',
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Choose how you want to explore
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => router.push('/editor')}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-medium py-3 text-sm transition-colors duration-150"
            style={{ background: '#D4AF37', color: '#09090b' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#C9A227' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#D4AF37' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            Open AI Editor
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-3 rounded-xl border text-sm font-medium py-3 transition-colors duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            View Dashboard
          </button>

          <button
            onClick={() => router.push('/marketplace')}
            className="w-full flex items-center justify-center gap-3 rounded-xl border text-sm font-medium py-3 transition-colors duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Browse Marketplace
          </button>
        </div>

        <p className="mt-6 text-xs text-zinc-500 text-center">
          <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">
            View pricing
          </Link>
          {' · '}
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
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
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
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
      <p className="mt-4 text-sm text-zinc-500 text-center">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-[#D4AF37] hover:text-[#C9A227] font-medium transition-colors">
          Sign up free
        </Link>
      </p>

      <p className="mt-2 text-xs text-zinc-600 text-center">
        Looking for pricing?{' '}
        <Link href="/pricing" className="text-zinc-500 hover:text-[#D4AF37] transition-colors underline underline-offset-2">
          View plans
        </Link>
      </p>

    </div>
  )
}
