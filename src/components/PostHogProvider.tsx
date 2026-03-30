'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// posthog-js is loaded dynamically inside useEffect — never at module scope.
// This prevents it from being included in the initial JS bundle AND ensures
// COPPA compliance: under-13 users are never tracked.

function PageViewTracker({ isUnder13 }: { isUnder13?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isUnder13 === true) return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture('$pageview', { $current_url: window.location.href })
    }).catch(() => {/* silent */})
  }, [pathname, searchParams, isUnder13])

  return null
}

interface PostHogProviderProps {
  children: React.ReactNode
  /** COPPA: when true, PostHog is never initialised for this session */
  isUnder13?: boolean
}

export function PostHogProvider({ children, isUnder13 }: PostHogProviderProps) {
  const [PHProvider, setPHProvider] = useState<React.ComponentType<{ client: unknown; children: React.ReactNode }> | null>(null)
  const [phClient, setPhClient] = useState<unknown>(null)

  useEffect(() => {
    // COPPA guard — never initialise PostHog for under-13 users
    if (isUnder13 === true) return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    Promise.all([
      import('posthog-js'),
      import('posthog-js/react'),
    ]).then(([{ default: posthog }, { PostHogProvider: PHProv }]) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false,
        persistence: 'localStorage',
        autocapture: true,
        disable_session_recording: false,
      })
      setPhClient(posthog)
      setPHProvider(() => PHProv as React.ComponentType<{ client: unknown; children: React.ReactNode }>)
    }).catch(() => {/* silent */})
  }, [isUnder13])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !PHProvider || !phClient) {
    return <>{children}</>
  }

  return (
    <PHProvider client={phClient}>
      <PageViewTracker isUnder13={isUnder13} />
      {children}
    </PHProvider>
  )
}
