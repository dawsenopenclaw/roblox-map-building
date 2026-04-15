'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

/**
 * ForjeGames sign-in page.
 *
 * We use Clerk's prebuilt <SignIn /> component so the page automatically
 * renders every authentication strategy enabled in the Clerk dashboard —
 * email, phone, password, Roblox OAuth (custom provider), Google, Apple,
 * passkeys, magic links, etc. — without us maintaining a hand-rolled form
 * per strategy.
 *
 * The previous version of this file was a custom form with only 3 OAuth
 * buttons (Roblox/Google/Apple) and no email or phone inputs. When any
 * OAuth strategy wasn't configured server-side, `authenticateWithRedirect`
 * would throw and the error was swallowed into `console.error`, leaving
 * users staring at a non-functional page. Replacing that with Clerk's
 * built-in component gets us:
 *   - Email + phone + password fields
 *   - Roblox / Google / Apple OAuth buttons
 *   - Inline error messages instead of silent console logs
 *   - Automatic ?redirect_url= handling
 *   - Matching dark theme via the appearance overrides below
 */
export default function SignInClient() {
  const searchParams = useSearchParams()
  // Preserve any ?redirect_url= set by the middleware so users land back
  // where they came from after signing in. Clerk picks this up automatically
  // via forceRedirectUrl when present.
  const redirectUrl = searchParams?.get('redirect_url') ?? undefined

  return (
    <div className="w-full">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
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
            card: 'shadow-none border-0 bg-transparent p-0 gap-6',
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
            footer: 'hidden',
            footerAction: 'text-zinc-400 text-base mt-4',
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
