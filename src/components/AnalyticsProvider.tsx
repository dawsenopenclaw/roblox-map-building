'use client'
/**
 * AnalyticsProvider
 *
 * Wraps authenticated areas of the app and:
 *   1. Identifies the user in PostHog on mount / when user changes
 *   2. Exposes UserContext to all children via AnalyticsContext
 *   3. Tracks session_start on mount and session_end on unmount
 *   4. Resets PostHog on logout (user becomes null)
 *
 * Usage — place inside your authenticated layout, inside PostHogProvider:
 *
 *   <PostHogProvider>
 *     <AnalyticsProvider userId={userId} tier={tier} role={role}>
 *       {children}
 *     </AnalyticsProvider>
 *   </PostHogProvider>
 */

import { createContext, useEffect, useRef } from 'react'
import type { UserContext } from '@/lib/analytics-client'

// ─── Context ─────────────────────────────────────────────────────────────────

interface AnalyticsContextValue {
  userContext: UserContext
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AnalyticsProviderProps {
  children: React.ReactNode
  /** Clerk / DB user ID used as the PostHog distinct_id */
  userId?: string | null
  /** e.g. 'FREE', 'HOBBY', 'CREATOR', 'STUDIO' */
  tier?: string
  /** e.g. 'user', 'admin', 'creator' */
  role?: string
  /** Daily build streak count */
  streak?: number
  /** Whether the user is under 13 (COPPA) */
  isUnder13?: boolean
  /** User email (only sent to PostHog server-side; included here for identify) */
  email?: string
  /** Account creation ISO timestamp */
  createdAt?: string
  /** Display name */
  displayName?: string
}

export function AnalyticsProvider({
  children,
  userId,
  tier,
  role,
  streak,
  isUnder13,
  email,
  createdAt,
  displayName,
}: AnalyticsProviderProps) {
  const prevUserIdRef = useRef<string | null | undefined>(undefined)
  const sessionStartRef = useRef<number>(Date.now())

  const userContext: UserContext = { tier, role, streak, isUnder13 }

  // ── Identify / reset on user change ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId

    // Skip initial undefined → undefined (provider mounted but no user yet)
    if (prevUserId === undefined && !userId) return

    import('posthog-js').then(({ default: posthog }) => {
      if (!userId) {
        // Logged out — reset distinct_id to anonymous
        posthog.reset()
        return
      }

      // Identify with full user properties
      posthog.identify(userId, {
        $app: 'ForjeGames',
        ...(email && { email }),
        ...(tier && { tier }),
        ...(role && { role }),
        ...(streak !== undefined && { streak }),
        ...(isUnder13 !== undefined && { is_under_13: isUnder13 }),
        ...(createdAt && { created_at: createdAt }),
        ...(displayName && { display_name: displayName }),
      })
    }).catch(() => {/* silent */})
  }, [userId, tier, role, streak, isUnder13, email, createdAt, displayName])

  // ── Session tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return

    sessionStartRef.current = Date.now()

    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture('session_start', {
        $app: 'ForjeGames',
        user_tier: tier,
        user_role: role,
      })
    }).catch(() => {/* silent */})

    return () => {
      const durationMs = Date.now() - sessionStartRef.current
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture('session_end', {
          $app: 'ForjeGames',
          user_tier: tier,
          duration_ms: durationMs,
          duration_minutes: Math.round(durationMs / 60000),
        })
      }).catch(() => {/* silent */})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <AnalyticsContext.Provider value={{ userContext }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
