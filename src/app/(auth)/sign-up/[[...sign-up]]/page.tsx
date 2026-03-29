'use client'

import { SignUp } from '@clerk/nextjs'
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

    /* Header — hide Clerk's default; we supply our own */
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',

    /* Form fields */
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

    /* Footer */
    footerActionLink: 'text-gold hover:text-gold-light font-medium transition-colors',
    footerActionText: 'text-muted',
    footer: 'hidden',

    /* Misc */
    identityPreviewEditButton: 'text-gold hover:text-gold-light',
    formResendCodeLink: 'text-gold hover:text-gold-light',
    otpCodeFieldInput: 'border-border-subtle bg-surface text-foreground',
    alternativeMethodsBlockButton: [
      'border border-border-subtle',
      'bg-surface hover:bg-surface-elevated',
      'text-foreground rounded-xl',
    ].join(' '),
  },
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function SignUpPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center">

      {/* Page heading */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Create your account
        </h1>
        <p className="text-muted text-sm mt-1">
          Start building Roblox games with AI
        </p>
      </div>

      {/* Feature pill */}
      <div className="mb-5 flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full px-3 py-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="#D4AF37"
          aria-hidden
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
        <span className="text-gold text-xs font-medium">
          Free plan — no credit card required
        </span>
      </div>

      {/* Clerk SignUp */}
      <div className="w-full">
        <SignUp
          forceRedirectUrl="/onboarding"
          appearance={clerkAppearance}
        />
      </div>

      {/* Demo bypass */}
      {IS_DEMO && (
        <div className="mt-5 w-full">
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-xs text-muted uppercase tracking-widest shrink-0">or</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>
          <button
            onClick={() => router.push('/editor')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/8 hover:bg-gold/15 text-gold font-semibold py-2.5 text-sm transition-colors duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            Try Demo — Go to Editor
          </button>
          <p className="mt-2 text-center text-xs text-muted-subtle">
            No account needed in demo mode
          </p>
        </div>
      )}

      {/* Custom footer */}
      <p className="mt-4 text-sm text-muted text-center">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-gold hover:text-gold-light font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="mt-2 text-xs text-muted-subtle text-center">
        Want to see what you get?{' '}
        <Link href="/pricing" className="text-muted hover:text-gold transition-colors underline underline-offset-2">
          View pricing plans
        </Link>
      </p>

    </div>
  )
}
