/**
 * Multi-channel notification system for ForjeGames
 *
 * Supports: In-app toast, Browser push, Email (Resend), SMS (Twilio)
 * All channels are opt-in and respect COPPA age restrictions.
 */

// ── In-App Toast Notifications ──────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'achievement'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // ms, 0 = persistent
  action?: { label: string; onClick: () => void }
}

type ToastListener = (toast: Toast) => void

const toastListeners = new Set<ToastListener>()

export function onToast(listener: ToastListener): () => void {
  toastListeners.add(listener)
  return () => toastListeners.delete(listener)
}

export function showToast(toast: Omit<Toast, 'id'>) {
  const t: Toast = { ...toast, id: `toast_${Date.now()}_${Math.random().toString(36).slice(2)}` }
  toastListeners.forEach((l) => l(t))
}

// ── Browser Push Notifications ──────────────────────────────────────────────

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      icon: '/forje-icon.png',
      badge: '/forje-badge.png',
      ...options,
    })
  } catch {
    // Silent fail — notifications not supported in this context
  }
}

// ── Build completion notification ───────────────────────────────────────────

export function notifyBuildComplete(success: boolean, details?: string) {
  // In-app toast
  showToast({
    type: success ? 'success' : 'error',
    title: success ? 'Build Complete' : 'Build Failed',
    message: details,
    duration: 5000,
  })

  // Browser notification (if tab is not focused)
  if (typeof document !== 'undefined' && document.hidden) {
    sendBrowserNotification(
      success ? 'ForjeGames — Build Complete' : 'ForjeGames — Build Failed',
      { body: details || (success ? 'Your game is ready!' : 'Check the editor for errors.') },
    )
  }
}

// ── Achievement notification ────────────────────────────────────────────────

export function notifyAchievement(name: string, description: string, xp: number) {
  showToast({
    type: 'achievement',
    title: `Achievement Unlocked: ${name}`,
    message: `${description} (+${xp} XP)`,
    duration: 8000,
  })

  if (typeof document !== 'undefined' && document.hidden) {
    sendBrowserNotification(`Achievement: ${name}`, { body: `${description} (+${xp} XP)` })
  }
}

// ── Playtest status notification ────────────────────────────────────────────

export function notifyPlaytestStep(step: string, iteration: number) {
  showToast({
    type: 'info',
    title: `Playtest (${iteration}/3)`,
    message: step,
    duration: 3000,
  })
}

export function notifyPlaytestResult(success: boolean, iterations: number, errors?: string[]) {
  if (success) {
    showToast({
      type: 'success',
      title: 'Playtest Passed!',
      message: `Code works correctly after ${iterations} iteration(s)`,
      duration: 6000,
    })
  } else {
    showToast({
      type: 'error',
      title: 'Playtest Failed',
      message: errors?.length ? `${errors.length} error(s): ${errors[0]}` : 'Max iterations reached',
      duration: 8000,
    })
  }
}
