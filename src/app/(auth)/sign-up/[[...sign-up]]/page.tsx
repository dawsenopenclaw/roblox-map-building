'use client'

import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// ─── Clerk appearance ─────────────────────────────────────────────────────────

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
    card: [
      '!bg-transparent',
      '!border-none',
      '!shadow-none',
      '!rounded-none',
      '!p-0',
    ].join(' '),
    cardBox: '!shadow-none !bg-transparent',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    formFieldLabel: 'text-zinc-400 text-xs font-medium tracking-wide uppercase',
    formFieldInput: [
      '!bg-[#1a1a1c]',
      '!border !border-white/[0.06]',
      '!text-[#FAFAFA]',
      '!rounded-xl',
      'focus:!border-[#D4AF37] focus:!ring-1 focus:!ring-[#D4AF37]/30',
      '!transition-colors',
    ].join(' '),
    formButtonPrimary: [
      '!bg-[#D4AF37] hover:!bg-[#C9A227]',
      '!text-[#09090b] !font-semibold',
      '!rounded-xl',
      '!transition-colors !duration-150',
      '!shadow-none',
    ].join(' '),
    socialButtonsBlockButton: [
      '!border !border-white/[0.06]',
      '!bg-[#111113] hover:!bg-white/5',
      '!text-[#FAFAFA]',
      '!rounded-xl',
      '!transition-colors !duration-150',
    ].join(' '),
    socialButtonsBlockButtonText: '!text-[#FAFAFA] !font-medium',
    dividerLine: '!bg-white/[0.06]',
    dividerText: '!text-zinc-500 !text-xs',
    footerActionLink: '!text-[#D4AF37] hover:!text-[#C9A227] !font-medium !transition-colors',
    footerActionText: '!text-zinc-500',
    footer: 'hidden',
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

// ─── Feature highlights (signup page) ────────────────────────────────────────

const HIGHLIGHTS = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    text: 'AI-powered — describe it, we build it',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    text: 'No Luau coding knowledge required',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    text: 'Games ready to publish in minutes',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    text: 'COPPA compliant — safe for all ages',
  },
]

// ─── Demo mode UI ─────────────────────────────────────────────────────────────

function DemoSignUp() {
  const router = useRouter()

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <span aria-hidden>✦</span> Free Forever Plan
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Start Building Free</h1>
        <p className="text-sm mt-1.5" style={{ color: '#A1A1AA' }}>
          Start building Roblox games with AI — no credit card needed
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => router.push('/editor')}
        className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold py-3.5 text-sm transition-colors duration-150"
        style={{ background: '#D4AF37', color: '#09090b' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#C9A227' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#D4AF37' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="5,3 19,12 5,21 5,3" />
        </svg>
        Start Building Free
      </motion.button>

      <p className="mt-4 text-sm text-center" style={{ color: '#71717A' }}>
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold transition-colors" style={{ color: '#D4AF37' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter()

  if (IS_DEMO) return <DemoSignUp />

  return (
    <div className="w-full max-w-sm">

      {/* Free badge + headline */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <span aria-hidden>✦</span> Free Forever Plan
        </motion.div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Start Building Free</h1>
        <p className="text-sm mt-1.5" style={{ color: '#A1A1AA' }}>
          No credit card needed. Ship your first game in under 10 minutes.
        </p>
      </div>

      {/* Feature highlights grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className="flex items-start gap-2 rounded-xl p-2.5 border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: '#D4AF37' }} aria-hidden>{h.icon}</span>
            <span className="text-xs leading-tight" style={{ color: '#A1A1AA' }}>{h.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Clerk SignUp */}
      <SignUp
        fallbackRedirectUrl="/onboarding/age-gate"
        appearance={clerkAppearance}
      />

      {/* Demo bypass — only shown in demo mode */}
      {IS_DEMO && (
        <div className="mt-5 w-full">
          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs uppercase tracking-widest shrink-0" style={{ color: '#52525B' }}>or</span>
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
          <p className="mt-2 text-center text-xs" style={{ color: '#52525B' }}>No account needed in demo mode</p>
        </div>
      )}

      {/* Trust indicators */}
      <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
        {[
          { icon: '🔒', text: 'SSL Secured' },
          { icon: '🛡️', text: 'COPPA Safe' },
          { icon: '✓', text: 'No spam' },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-1 text-xs" style={{ color: '#52525B' }}>
            <span aria-hidden>{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>

      {/* Account switch */}
      <p className="mt-5 text-sm text-center" style={{ color: '#71717A' }}>
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="font-semibold transition-colors"
          style={{ color: '#D4AF37' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E4C04A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#D4AF37' }}
        >
          Sign in
        </Link>
      </p>

      <p className="mt-2 text-xs text-center" style={{ color: '#52525B' }}>
        Want to see what you get?{' '}
        <Link href="/pricing" className="underline underline-offset-2 hover:text-zinc-400 transition-colors" style={{ color: '#52525B' }}>
          View pricing plans
        </Link>
      </p>

    </div>
  )
}
