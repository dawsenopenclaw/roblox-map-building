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
    <div className="w-full flex flex-col items-center">
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
            colorInputBackground: 'rgba(255,255,255,0.04)',
            colorInputText: '#FAFAFA',
            borderRadius: '0.75rem',
            fontFamily: 'var(--font-inter, Inter, sans-serif)',
            fontSize: '1rem',
            spacingUnit: '1.1rem',
          },
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none border-0 bg-transparent p-0 gap-6 w-full',
            headerTitle: 'text-2xl sm:text-3xl font-bold text-white mb-1',
            headerSubtitle: 'text-base text-zinc-400',
            socialButtonsBlockButton:
              'border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-white text-base font-medium transition-colors py-3.5 rounded-xl',
            socialButtonsBlockButtonText: 'text-white font-medium text-base',
            dividerLine: 'bg-white/[0.08]',
            dividerText: 'text-zinc-500 text-sm',
            formFieldLabel: 'text-zinc-300 text-sm font-medium mb-1.5',
            formFieldInput:
              'bg-white/[0.04] border border-white/[0.1] text-white text-base placeholder:text-zinc-600 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 py-3 px-4 rounded-xl',
            formButtonPrimary:
              'bg-[#D4AF37] hover:bg-[#E6A619] text-black text-base font-bold transition-colors py-3.5 rounded-xl',
            footer: 'justify-center mt-4',
            footerAction: 'text-zinc-400 text-base',
            footerActionLink: 'text-[#D4AF37] hover:text-[#E6A619] font-semibold text-base',
            identityPreviewText: 'text-zinc-300 text-base',
            identityPreviewEditButton: 'text-[#D4AF37] hover:text-[#E6A619] text-sm',
            formResendCodeLink: 'text-[#D4AF37] hover:text-[#E6A619] text-sm',
            alertText: 'text-red-400 text-sm',
            alert: 'bg-red-500/10 border border-red-500/30 rounded-xl p-4',
            otpCodeFieldInput:
              'bg-white/[0.04] border border-white/[0.1] text-white text-lg focus:border-[#D4AF37]/50 w-12 h-12',
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
