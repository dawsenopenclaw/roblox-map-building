'use client'

import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function SignUpClient() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams?.get('redirect_url') ?? undefined

  useEffect(() => {
    const ref = searchParams?.get('ref')
    if (ref && ref.trim().length > 0) {
      try {
        localStorage.setItem('fg_referral_code', ref.trim())
      } catch { /* localStorage unavailable */ }
    }
  }, [searchParams])

  return (
    <div className="w-full flex justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={redirectUrl ?? '/onboarding/age-gate'}
      />
    </div>
  )
}
