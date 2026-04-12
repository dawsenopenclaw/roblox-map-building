'use client'

import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

/**
 * ForjeGames sign-up page. See SignInClient for rationale — we use
 * Clerk's prebuilt <SignUp /> so email, phone, password, Roblox OAuth
 * (custom), Google, Apple, and any other enabled strategies all render
 * automatically, with proper inline error handling instead of the
 * swallowed console.error behavior the old hand-rolled form had.
 */
export default function SignUpClient() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirect_url') ?? undefined

  return (
    <div className="w-full flex justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl ?? '/onboarding/age-gate'}
        appearance={{
          variables: {
            colorPrimary: '#D4AF37',
            colorBackground: 'transparent',
            colorText: '#FAFAFA',
            colorTextSecondary: '#A1A1AA',
            colorInputBackground: 'rgba(255,255,255,0.03)',
            colorInputText: '#FAFAFA',
            borderRadius: '0.625rem',
            fontFamily: 'var(--font-inter, Inter, sans-serif)',
          },
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none border-0 bg-transparent p-0',
            headerTitle: 'text-xl font-bold text-white',
            headerSubtitle: 'text-sm text-zinc-500',
            socialButtonsBlockButton:
              'border border-white/[0.08] bg-transparent hover:bg-white/5 text-white text-sm font-medium transition-colors',
            socialButtonsBlockButtonText: 'text-white font-medium',
            dividerLine: 'bg-white/[0.06]',
            dividerText: 'text-zinc-600 text-xs',
            formFieldLabel: 'text-zinc-300 text-xs font-medium',
            formFieldInput:
              'bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20',
            formButtonPrimary:
              'bg-[#D4AF37] hover:bg-[#E6A619] text-black font-semibold transition-colors',
            footer: 'hidden',
            footerAction: 'text-zinc-500 text-sm',
            footerActionLink: 'text-[#D4AF37] hover:text-[#E6A619] font-semibold',
            identityPreviewText: 'text-zinc-300',
            identityPreviewEditButton: 'text-[#D4AF37] hover:text-[#E6A619]',
            formResendCodeLink: 'text-[#D4AF37] hover:text-[#E6A619]',
            alertText: 'text-red-400 text-sm',
            alert: 'bg-red-500/10 border border-red-500/30 rounded-md',
            otpCodeFieldInput:
              'bg-white/[0.03] border border-white/[0.08] text-white focus:border-[#D4AF37]/50',
          },
          layout: {
            socialButtonsPlacement: 'top',
            socialButtonsVariant: 'blockButton',
            showOptionalFields: true,
          },
        }}
      />
    </div>
  )
}
