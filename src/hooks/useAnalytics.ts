'use client'
/**
 * useAnalytics — lightweight React hook for client-side event tracking.
 *
 * Usage:
 *   const { track, identify } = useAnalytics()
 *   track('voice_build_started', { inputType: 'voice' })
 *
 * Pulls user context from AnalyticsContext if AnalyticsProvider is mounted.
 * Falls back to context-free capture if provider is absent (safe).
 */

import { useCallback, useContext } from 'react'
import { AnalyticsContext } from '@/components/AnalyticsProvider'
import { captureClientEvent } from '@/lib/analytics-client'
import type { AnalyticsEvent, UserContext } from '@/lib/analytics-client'
import { safePostHog } from '@/lib/posthog-safe'

export interface UseAnalyticsReturn {
  /**
   * Fire a typed analytics event.
   * User context (tier, role, streak) is attached automatically.
   */
  track: <E extends AnalyticsEvent>(
    event: E,
    properties?: Record<string, unknown>
  ) => void

  /**
   * Identify the current user in PostHog (client-side).
   * Normally called automatically by AnalyticsProvider on login.
   */
  identify: (userId: string, properties?: Record<string, unknown>) => void

  /** Current user context forwarded from AnalyticsProvider */
  userContext: UserContext | undefined
}

export function useAnalytics(): UseAnalyticsReturn {
  const ctx = useContext(AnalyticsContext)

  const track = useCallback(
    <E extends AnalyticsEvent>(event: E, properties?: Record<string, unknown>) => {
      captureClientEvent(event, properties, ctx?.userContext)
    },
    [ctx?.userContext]
  )

  const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
    // safePostHog.identify enforces the age-verified + consent gates; it is a
    // no-op for any user who hasn't passed the age gate (COPPA defence).
    safePostHog.identify(userId, properties)
  }, [])

  return {
    track,
    identify,
    userContext: ctx?.userContext,
  }
}
