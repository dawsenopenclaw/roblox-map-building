'use client'

import { SignUp } from '@clerk/nextjs'
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

    /* Header — hide Clerk's default; we supply our own */
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',

    /* Form fields */
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

    /* Footer */
    footerActionLink: '!text-[#D4AF37] hover:!text-[#C9A227] !font-medium !transition-colors',
    footerActionText: '!text-zinc-500',
    footer: 'hidden',

    /* Misc */
    identityPreviewEditButton: '!text-[#D4AF37] hover:!text-[#C9A227]',
    formResendCodeLink: '!text-[#D4AF37] hover:!text-[#C9A227]',
    otpCodeFieldInput: '!border-white/[0.06] !bg-[#111113] !text-[#FAFAFA]',
    alternativeMethodsBlockButton: [
      '!border !border-white/[0.06]',
      '!bg-[#111113] hover:!bg-white/5',
      '!text-[#FAFAFA] !rounded-xl',
    ].join(' '),
  },
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function SignUpPage() {
  const router = useRouter()

  // In demo mode, redirect to the demo login flow
  if (IS_DEMO) {
    return (
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Start building Roblox games with AI
          </p>
        </div>

        <button
          onClick={() => router.push('/editor')}
          className="w-full flex items-center justify-center gap-3 rounded-xl font-medium py-3 text-sm transition-colors duration-150"
          style={{ background: '#D4AF37', color: '#09090b' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#C9A227' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#D4AF37' }}
        >
          Start Building Free
        </button>

        <p className="mt-4 text-sm text-zinc-500 text-center">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-[#D4AF37] hover:text-[#C9A227] font-medium transition-colors">
            Sign in
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
          Create your account
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Start building Roblox games with AI
        </p>
      </div>

      {/* Clerk SignUp */}
      <div className="w-full">
        <SignUp
          forceRedirectUrl="/onboarding/age-gate"
          appearance={clerkAppearance}
        />
      </div>

      {/* Demo bypass — only shown in demo mode */}
      {IS_DEMO && (
        <div className="mt-5 w-full">
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs text-zinc-600 uppercase tracking-widest shrink-0">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <button
            onClick={() => router.push('/editor')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border text-sm font-medium py-2.5 transition-colors duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            Try Demo — Go to Editor
          </button>
          <p className="mt-2 text-center text-xs text-zinc-600">
            No account needed in demo mode
          </p>
        </div>
      )}

      {/* Custom footer */}
      <p className="mt-4 text-sm text-zinc-500 text-center">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#D4AF37] hover:text-[#C9A227] font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="mt-2 text-xs text-zinc-600 text-center">
        Want to see what you get?{' '}
        <Link href="/pricing" className="text-zinc-500 hover:text-[#D4AF37] transition-colors underline underline-offset-2">
          View pricing plans
        </Link>
      </p>

    </div>
  )
}
