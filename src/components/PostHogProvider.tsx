'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { safePostHog, initPostHogIfAllowed } from '@/lib/posthog-safe'

// posthog-js is loaded dynamically — never at module scope. All initialisation
// and tracking calls go through @/lib/posthog-safe, which enforces the COPPA
// age-gate and cookie-consent gates as a single choke-point.

function PageViewTracker({ isUnder13, cookieConsent }: { isUnder13?: boolean; cookieConsent?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // COPPA: block when under-13 or age gate not yet completed (undefined)
    if (isUnder13 !== false) return
    if (cookieConsent !== true) return
    safePostHog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams, isUnder13, cookieConsent])

  return null
}

interface PostHogProviderProps {
  children: React.ReactNode
  /** COPPA: when true, PostHog is never initialised for this session */
  isUnder13?: boolean
  /** Cookie consent banner: PostHog is only initialised when the user has explicitly accepted */
  cookieConsent?: boolean
}

export function PostHogProvider({ children, isUnder13, cookieConsent }: PostHogProviderProps) {
  const [PHProvider, setPHProvider] = useState<React.ComponentType<{ client: unknown; children: React.ReactNode }> | null>(null)
  const [phClient, setPhClient] = useState<unknown>(null)

  useEffect(() => {
    // COPPA guard — never initialise PostHog for under-13 users.
    // Also block when isUnder13 is undefined (age gate not yet completed).
    if (isUnder13 !== false) return
    // Cookie consent guard — must have explicit consent before any tracking
    if (cookieConsent !== true) return
    // Kick off lazy init via the safe wrapper. This is idempotent and
    // concurrent-safe — it no-ops if already initialised. The wrapper owns
    // the actual posthog.init() call; we just need the react context provider.
    let cancelled = false
    Promise.all([
      initPostHogIfAllowed(13, true),
      import('posthog-js/react'),
    ]).then(([posthog, { PostHogProvider: PHProv }]) => {
      if (cancelled || !posthog) return
      setPhClient(posthog)
      setPHProvider(() => PHProv as React.ComponentType<{ client: unknown; children: React.ReactNode }>)
    }).catch(() => {/* silent */})
    return () => { cancelled = true }
  }, [isUnder13, cookieConsent])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !PHProvider || !phClient) {
    return <>{children}</>
  }

  return (
    <PHProvider client={phClient}>
      <PageViewTracker isUnder13={isUnder13} cookieConsent={cookieConsent} />
      {children}
    </PHProvider>
  )
}
