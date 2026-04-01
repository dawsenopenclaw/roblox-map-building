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
    <div className="w-full max-w-sm">
      <HeaderBlock
        heading="Welcome back"
        sub="Choose how you want to explore"
      />

      <div className="w-full space-y-3 mt-8">
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

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push('/marketplace')}
          className="w-full flex items-center justify-center gap-3 rounded-xl border text-sm font-medium py-3 transition-colors duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Browse Marketplace
        </motion.button>
      </div>

      <FooterLinks>
        <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">View pricing</Link>
        {' · '}
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Back to home</Link>
      </FooterLinks>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function HeaderBlock({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div className="mb-2">
      <h1 className="text-2xl font-bold text-white tracking-tight">{heading}</h1>
      <p className="text-sm mt-1.5" style={{ color: '#A1A1AA' }}>{sub}</p>
    </div>
  )
}

function FooterLinks({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-xs text-center" style={{ color: '#71717A' }}>
      {children}
    </p>
  )
}

// ─── Bullet proof points ──────────────────────────────────────────────────────

const BULLETS = [
  { icon: '✦', text: '50,000+ games built on ForjeGames' },
  { icon: '✦', text: 'Generate maps and scripts in seconds' },
  { icon: '✦', text: 'Publish directly to Roblox Studio' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignInPage() {
  if (IS_DEMO) return <DemoSignIn />

  return (
    <div className="w-full max-w-sm">

      {/* Heading */}
      <HeaderBlock
        heading="Welcome back"
        sub="Sign in to continue building"
      />

      {/* Social proof */}
      <div
        className="mt-5 mb-6 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border"
        style={{ background: 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.12)' }}
      >
        {/* Avatar stack */}
        <div className="flex -space-x-2 shrink-0">
          {['#4F46E5', '#0EA5E9', '#10B981'].map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: color, borderColor: '#111113', zIndex: 3 - i }}
              aria-hidden
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#A1A1AA' }}>
          Join <span className="font-semibold text-white">10,000+</span> game creators building with AI
        </p>
      </div>

      {/* Clerk SignIn */}
      <SignIn
        fallbackRedirectUrl="/editor"
        appearance={clerkAppearance}
      />

      {/* Feature bullets */}
      <div className="mt-6 space-y-2">
        {BULLETS.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#D4AF37' }} aria-hidden>{b.icon}</span>
            <span className="text-xs" style={{ color: '#71717A' }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Account switch */}
      <p className="mt-4 text-sm text-center" style={{ color: '#71717A' }}>
        New to ForjeGames?{' '}
        <Link href="/sign-up" className="font-semibold transition-colors" style={{ color: '#D4AF37' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E4C04A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#D4AF37' }}
        >
          Start building free
        </Link>
      </p>

      <p className="mt-2 text-xs text-center" style={{ color: '#52525B' }}>
        Curious about plans?{' '}
        <Link href="/pricing" className="underline underline-offset-2 hover:text-zinc-400 transition-colors" style={{ color: '#52525B' }}>
          View pricing
        </Link>
      </p>

    </div>
  )
}
