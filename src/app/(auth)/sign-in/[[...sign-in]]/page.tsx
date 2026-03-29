'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

const clerkAppearance = {
  variables: {
    colorPrimary: '#D4AF37',
    colorBackground: '#111827',
    colorText: '#F9FAFB',
    colorTextSecondary: '#9CA3AF',
    colorInputBackground: '#1a2236',
    colorInputText: '#F9FAFB',
    colorInputPlaceholder: '#6B7280',
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

export default function SignInPage() {
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
