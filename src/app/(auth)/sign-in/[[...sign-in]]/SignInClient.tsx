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
    <div className="w-full flex justify-center">
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
