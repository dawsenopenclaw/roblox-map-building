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
import { captureClientEvent } from '@/lib/analytics'
import type { AnalyticsEvent, EventProperties, UserContext } from '@/lib/analytics'

export interface UseAnalyticsReturn {
  /**
   * Fire a typed analytics event.
   * User context (tier, role, streak) is attached automatically.
   */
  track: <E extends AnalyticsEvent>(
    event: E,
    properties?: EventProperties[E]
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
    <E extends AnalyticsEvent>(event: E, properties?: EventProperties[E]) => {
      captureClientEvent(event, properties, ctx?.userContext)
    },
    [ctx?.userContext]
  )

  const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return
    import('posthog-js').then(({ default: posthog }) => {
      posthog.identify(userId, properties)
    }).catch(() => {/* silent */})
  }, [])

  return {
    track,
    identify,
    userContext: ctx?.userContext,
  }
}
