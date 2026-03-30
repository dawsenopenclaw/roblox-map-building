'use client'

import { useState, useEffect } from 'react'
import { PostHogProvider } from '@/components/PostHogProvider'
import { COOKIE_CONSENT_KEY } from '@/components/CookieBanner'

/**
 * Reads cookie consent from localStorage and re-renders when it changes
 * (e.g. when the user clicks Accept All on the CookieBanner).
 * This is the single source of truth that wires consent into PostHogProvider.
 */
export function PostHogConsentWrapper({ children }: { children: React.ReactNode }) {
  const [cookieConsent, setCookieConsent] = useState<boolean>(false)

  useEffect(() => {
    // Read initial value
    const read = () => {
      try {
        setCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted')
      } catch {
        setCookieConsent(false)
      }
    }
    read()

    // React to changes from the CookieBanner (same tab via StorageEvent dispatch,
    // or other tabs via native storage event)
    const handler = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) read()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <PostHogProvider cookieConsent={cookieConsent}>
      {children}
    </PostHogProvider>
  )
}
