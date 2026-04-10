'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { PostHogProvider } from '@/components/PostHogProvider'
import { COOKIE_CONSENT_KEY } from '@/components/CookieBanner'
import {
  AGE_VERIFIED_KEY,
  initPostHogIfAllowed,
  denyTracking,
} from '@/lib/posthog-safe'

// Re-export AGE_VERIFIED_KEY so existing importers of this module keep working
// after the source of truth moved to lib/posthog-safe.ts.
export { AGE_VERIFIED_KEY }

/**
 * Reads cookie consent + age verification from localStorage and Clerk metadata,
 * then gates PostHog accordingly. This is the single source of truth that
 * prevents analytics from initialising for under-13 users (COPPA compliance).
 */
export function PostHogConsentWrapper({ children }: { children: React.ReactNode }) {
  const [cookieConsent, setCookieConsent] = useState<boolean>(false)
  const [isUnder13, setIsUnder13] = useState<boolean | undefined>(undefined)
  const { user } = useUser()

  // Derive isUnder13 from Clerk publicMetadata (server-authoritative)
  useEffect(() => {
    if (!user) {
      // Not signed in — treat as unverified (PostHog stays off)
      setIsUnder13(undefined)
      return
    }

    const meta = user.publicMetadata as Record<string, unknown> | undefined
    if (meta?.isUnder13 === true) {
      setIsUnder13(true)
      // Clear the age-verified flag and lock PostHog out for the session
      denyTracking()
    } else if (meta?.dateOfBirth) {
      // Age gate completed and user is 13+
      setIsUnder13(false)
      try { localStorage.setItem(AGE_VERIFIED_KEY, 'true') } catch { /* ignore */ }
    } else {
      // Age gate not yet completed — do not initialise analytics
      setIsUnder13(undefined)
    }
  }, [user])

  // Kick off lazy PostHog initialisation the moment both gates are satisfied.
  // This is the ONLY place in the app that triggers init — everywhere else
  // uses safePostHog which no-ops until this runs.
  useEffect(() => {
    if (isUnder13 !== false) return
    if (!cookieConsent) return
    // We pass age=13 as a lower-bound confirmation that the server already
    // cleared this user. The function's internal check enforces age >= 13.
    void initPostHogIfAllowed(13, true)
  }, [isUnder13, cookieConsent])

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
    <PostHogProvider cookieConsent={cookieConsent} isUnder13={isUnder13}>
      {children}
    </PostHogProvider>
  )
}
