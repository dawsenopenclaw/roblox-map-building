'use client'

import { SignUp, useAuth, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    alternativeMethodsBlockButton: '!border !border-white/[0.08] !bg-transparent hover:!bg-white/5 !text-white !rounded-lg',
  },
}

export default function SignUpPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/editor')
    }
  }, [isLoaded, isSignedIn, router])

  async function handleSignOut() {
    setClearing(true)
    await signOut()
    window.location.href = '/sign-up'
  }

  if (isLoaded && isSignedIn) {
    return (
      <div className="w-full text-center">
        <h1 className="text-xl font-bold text-white mb-2">You&apos;re already signed in</h1>
        <p className="text-sm text-zinc-500 mb-6">Want to create a different account?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/editor"
            className="w-full block rounded-lg font-semibold text-sm text-center py-2.5 transition-colors text-black"
            style={{ background: '#FFB81C' }}
          >
            Go to Editor
          </Link>
          <button
            onClick={handleSignOut}
            disabled={clearing}
            className="w-full rounded-lg text-sm py-2.5 transition-colors text-zinc-400 hover:text-white border border-white/[0.08] hover:bg-white/5"
          >
            {clearing ? 'Signing out...' : 'Sign out and create new account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
      <p className="text-sm text-zinc-500 mb-6">Start building Roblox games with AI — free</p>

      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/editor"
        appearance={clerkAppearance}
      />

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <p className="text-sm text-center text-zinc-500">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-[#FFB81C] hover:text-[#E6A619] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
