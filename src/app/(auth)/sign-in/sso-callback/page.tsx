'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
