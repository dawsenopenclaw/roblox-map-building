'use client'

import { SignIn, useAuth, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const clerkAppearance = {
  variables: {
    colorPrimary: '#FFB81C',
    colorBackground: '#111113',
    colorText: '#FAFAFA',
    colorTextSecondary: '#71717A',
    colorInputBackground: '#1a1a1c',
    colorInputText: '#FAFAFA',
    colorInputPlaceholder: '#52525B',
    colorNeutral: '#27272a',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    rootBox: '!w-full',
    card: '!bg-transparent !border-none !shadow-none !p-0 !w-full',
    cardBox: '!shadow-none !bg-transparent !w-full',
    main: '!w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    footer: 'hidden',
    formFieldLabel: '!text-zinc-400 !text-xs !font-medium',
    formFieldInput: '!bg-[#1a1a1c] !border !border-white/[0.08] !text-white !rounded-lg !h-10 focus:!border-[#FFB81C] focus:!ring-1 focus:!ring-[#FFB81C]/20 !transition-colors',
    formButtonPrimary: '!bg-[#FFB81C] hover:!bg-[#E6A619] !text-black !font-semibold !rounded-lg !h-10 !shadow-none !transition-colors',
    socialButtonsBlockButton: '!border !border-white/[0.08] !bg-transparent hover:!bg-white/5 !text-white !rounded-lg !h-10 !transition-colors',
    socialButtonsBlockButtonText: '!text-white !font-medium !text-sm',
    dividerLine: '!bg-white/[0.06]',
    dividerText: '!text-zinc-600 !text-xs',
    identityPreviewEditButton: '!text-[#FFB81C]',
    formResendCodeLink: '!text-[#FFB81C]',
    otpCodeFieldInput: '!border-white/[0.08] !bg-[#1a1a1c] !text-white !rounded-lg',
    formFieldAction: '!text-[#FFB81C]',
    backLink: '!text-[#FFB81C]',
    alertText: '!text-sm',
    alternativeMethodsBlockButton: '!border !border-white/[0.08] !bg-transparent hover:!bg-white/5 !text-white !rounded-lg',
  },
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()
  const [ready, setReady] = useState(false)
  const redirectUrl = searchParams.get('redirect_url') || '/editor'

  // Auto-clear stale sessions. If someone lands on /sign-in while "signed in",
  // the session is likely stale (from old Clerk app). Sign them out automatically
  // so the form shows cleanly. If they're truly signed in, they wouldn't be here.
  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      // Sign out silently, then show the form
      signOut().then(() => {
        setReady(true)
      }).catch(() => {
        setReady(true)
      })
    } else {
      setReady(true)
    }
  }, [isLoaded, isSignedIn, signOut])

  if (!ready) {
    return (
      <div className="w-full flex flex-col items-center py-12 gap-3">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#FFB81C', borderTopColor: 'transparent' }} />
        <p className="text-sm text-zinc-500">Preparing...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-sm text-zinc-500 mb-6">Sign in to continue building</p>

      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={redirectUrl}
        appearance={clerkAppearance}
      />

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <p className="text-sm text-center text-zinc-500">
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-[#FFB81C] hover:text-[#E6A619] transition-colors">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}
