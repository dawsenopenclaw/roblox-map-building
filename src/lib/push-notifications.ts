/**
 * Client-side web push notification subscription management.
 * Uses VAPID for authentication. Subscriptions are sent to
 * POST /api/notifications/subscribe for server-side storage.
 */

/**
 * Convert a base64url VAPID key to a Uint8Array for pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Returns the current service worker registration, or null.
 */
async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Check if the user is currently subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  const reg = await getSWRegistration()
  if (!reg) return false
  try {
    const sub = await reg.pushManager.getSubscription()
    return sub !== null
  } catch {
    return false
  }
}

/**
 * Subscribe to push notifications.
 * Requests notification permission, creates a push subscription,
 * and sends it to the server.
 *
 * Returns the PushSubscription on success, or null on failure.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Not supported in this browser')
    return null
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
    return null
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('[Push] Permission denied:', permission)
    return null
  }

  const reg = await getSWRegistration()
  if (!reg) {
    console.warn('[Push] No service worker registration')
    return null
  }

  try {
    // Check for existing subscription
    let subscription = await reg.pushManager.getSubscription()

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisuallyIndicatedPermission: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      } as PushSubscriptionOptionsInit)
    }

    // Send to server
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    })

    if (!res.ok) {
      console.warn('[Push] Server subscription save failed:', res.status)
    }

    console.log('[Push] Subscribed successfully')
    return subscription
  } catch (err) {
    console.error('[Push] Subscribe failed:', err)
    return null
  }
}

/**
 * Unsubscribe from push notifications.
 * Also notifies the server to remove the stored subscription.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const reg = await getSWRegistration()
  if (!reg) return false

  try {
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return true // Already unsubscribed

    const result = await subscription.unsubscribe()

    // Notify server
    await fetch('/api/notifications/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {}) // Best effort

    console.log('[Push] Unsubscribed:', result)
    return result
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err)
    return false
  }
}
