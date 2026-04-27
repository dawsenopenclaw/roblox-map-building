/**
 * Client-side service worker registration.
 * Call once at app startup — safe to call multiple times (no-ops if already registered).
 * Never throws — SW failure must never break the app.
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Skipping registration in dev mode')
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope)

        // Check for updates every 30 minutes
        setInterval(() => {
          reg.update().catch(() => {})
        }, 30 * 60 * 1000)
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err)
      })
  })
}

/**
 * Unregister the service worker — useful for debugging or forced resets.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      const result = await reg.unregister()
      console.log('[SW] Unregistered:', result)
      return result
    }
    return false
  } catch {
    return false
  }
}
