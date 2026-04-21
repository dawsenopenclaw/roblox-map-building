'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInClient() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirect_url') ?? undefined

  return (
    <div className="w-full flex justify-center">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl ?? '/onboarding/age-gate'}
      />
    </div>
  )
}
