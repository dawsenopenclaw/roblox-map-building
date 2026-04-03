'use client'

import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function ClearPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    signOut()
      .then(() => { window.location.href = '/sign-in' })
      .catch(() => { window.location.href = '/sign-in' })
  }, [signOut])

  return (
    <div className="w-full text-center py-12">
      <p className="text-sm text-zinc-500">Clearing session...</p>
    </div>
  )
}
