'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      forceRedirectUrl="/editor"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#FFB81C',
          colorBackground: '#0D1231',
          colorText: '#ffffff',
          colorTextSecondary: '#9ca3af',
          colorInputBackground: '#111827',
          colorInputText: '#ffffff',
        },
        elements: {
          card: 'shadow-xl border border-white/10 bg-[#0D1231]',
          formButtonPrimary: 'bg-[#FFB81C] text-black hover:bg-[#E6A519]',
          footerActionLink: 'text-[#FFB81C] hover:text-[#E6A519]',
          identityPreviewEditButton: 'text-[#FFB81C]',
        },
      }}
    />
  )
}
