'use client'

import { useEffect } from 'react'

/**
 * Silently manages push notification subscription after the user
 * has already granted notification permission. Never prompts on its own —
 * that should be triggered explicitly via subscribeToPush() from a UI button.
 *
 * This component ensures that if a user has previously granted permission
 * and has a service worker, their subscription stays active.
 */
export function PushNotificationManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (process.env.NODE_ENV !== 'production') return

    // Only auto-resubscribe if permission was already granted
    if (Notification.permission !== 'granted') return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    // Defer to avoid blocking page load
    const timer = setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing) return // Already subscribed, nothing to do

        // Re-subscribe (permission already granted)
        const { subscribeToPush } = await import('@/lib/push-notifications')
        await subscribeToPush()
      } catch {
        // Silent failure — push is never critical
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return null
}
