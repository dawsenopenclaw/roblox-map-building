'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

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
    formFieldLabel: '!text-zinc-400 !text-xs !font-medium',
    formFieldInput: '!bg-[#1a1a1c] !border !border-white/[0.08] !text-white !rounded-lg !h-10 focus:!border-[#FFB81C] focus:!ring-1 focus:!ring-[#FFB81C]/20 !transition-colors',
    formButtonPrimary: '!bg-[#FFB81C] hover:!bg-[#E6A619] !text-black !font-semibold !rounded-lg !h-10 !shadow-none !transition-colors',
    socialButtonsBlockButton: '!border !border-white/[0.08] !bg-transparent hover:!bg-white/5 !text-white !rounded-lg !h-10 !transition-colors',
    socialButtonsBlockButtonText: '!text-white !font-medium !text-sm',
    dividerLine: '!bg-white/[0.06]',
    dividerText: '!text-zinc-600 !text-xs',
    footerActionLink: '!text-[#FFB81C] hover:!text-[#E6A619] !font-medium',
    footerActionText: '!text-zinc-500',
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded } = useAuth()
  const redirectUrl = searchParams.get('redirect_url') || '/editor'

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirectUrl)
    }
  }, [isLoaded, isSignedIn, router, redirectUrl])

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-sm text-zinc-500 mb-6">Sign in to continue building</p>

      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
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
