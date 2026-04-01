'use client'

import { SignIn } from '@clerk/nextjs'
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
    alertText: '!text-sm',
    alternativeMethodsBlockButton: [
      '!border !border-white/[0.06]',
      '!bg-[#111113] hover:!bg-white/5',
      '!text-[#FAFAFA] !rounded-xl',
    ].join(' '),
  },
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// ─── Demo mode UI ─────────────────────────────────────────────────────────────

function DemoSignIn() {
  const router = useRouter()

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm mb-8" style={{ color: '#A1A1AA' }}>Choose how you want to explore</p>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push('/editor')}
          className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold py-3 text-sm transition-colors duration-150"
          style={{ background: '#D4AF37', color: '#09090b' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#C9A227' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#D4AF37' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="5,3 19,12 5,21 5,3" />
          </svg>
          Open AI Editor
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center justify-center gap-3 rounded-xl border text-sm font-medium py-3 transition-colors duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          View Dashboard
        </motion.button>
      </div>

      <p className="mt-6 text-xs text-center" style={{ color: '#71717A' }}>
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Back to home</Link>
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignInPage() {
  if (IS_DEMO) return <DemoSignIn />

  return (
    <div className="w-full">

      <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm mb-7" style={{ color: '#A1A1AA' }}>Sign in to continue building</p>

      <SignIn
        fallbackRedirectUrl="/editor"
        appearance={clerkAppearance}
      />

      <p className="mt-6 text-sm text-center" style={{ color: '#71717A' }}>
        New to ForjeGames?{' '}
        <Link
          href="/sign-up"
          className="font-semibold transition-colors"
          style={{ color: '#D4AF37' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E4C04A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#D4AF37' }}
        >
          Sign up
        </Link>
      </p>

    </div>
  )
}
