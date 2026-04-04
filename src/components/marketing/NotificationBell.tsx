'use client'

import { useEffect, useState } from 'react'

type SubState = 'idle' | 'subscribing' | 'subscribed' | 'denied'

const STORAGE_KEY = 'fg_push_subscribed'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    buffer[i] = rawData.charCodeAt(i)
  }
  return buffer.buffer
}

export default function NotificationBell() {
  const [state, setState] = useState<SubState>('idle')
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if already subscribed
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setState('subscribed')
      return
    }

    // Check if permission was denied
    if ('Notification' in window && Notification.permission === 'denied') {
      setState('denied')
      return
    }

    // Flag first visit for pulse animation
    const visited = sessionStorage.getItem('fg_visited')
    if (!visited) {
      setIsFirstVisit(true)
      sessionStorage.setItem('fg_visited', '1')
    }
  }, [])

  async function handleClick() {
    if (state === 'subscribed' || state === 'denied' || state === 'subscribing') return

    // Browser support check
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    setState('subscribing')

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      // Register / get existing service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) throw new Error('VAPID public key not configured')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const subJson = subscription.toJSON()

      // Send to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
        }),
      })

      if (!res.ok) {
        throw new Error(`Subscribe API returned ${res.status}`)
      }

      localStorage.setItem(STORAGE_KEY, 'true')
      setState('subscribed')
      setIsFirstVisit(false)
    } catch (err) {
      console.error('[NotificationBell] Subscribe failed:', err)
      // If permission was denied during the flow
      if ('Notification' in window && Notification.permission === 'denied') {
        setState('denied')
      } else {
        setState('idle')
      }
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null

  // Don't show if push isn't supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip label */}
      {state !== 'subscribed' && state !== 'denied' && (
        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 shadow-lg">
          {state === 'subscribing' ? 'Enabling…' : 'Get notified'}
        </span>
      )}

      <button
        onClick={handleClick}
        disabled={state === 'subscribed' || state === 'denied' || state === 'subscribing'}
        aria-label={
          state === 'subscribed'
            ? 'Notifications on'
            : state === 'denied'
              ? 'Notifications blocked'
              : 'Enable push notifications'
        }
        className={[
          'group relative flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
          state === 'subscribed'
            ? 'cursor-default bg-[#D4AF37]/10 text-[#D4AF37] ring-1 ring-[#D4AF37]/30'
            : state === 'denied'
              ? 'cursor-default bg-gray-800 text-gray-500 ring-1 ring-gray-700'
              : state === 'subscribing'
                ? 'cursor-wait bg-gray-800 text-gray-300 ring-1 ring-gray-700'
                : 'bg-gray-900 text-[#D4AF37] ring-1 ring-[#D4AF37]/40 hover:bg-gray-800 hover:ring-[#D4AF37]/70 active:scale-95',
          // Pulse on first visit
          state === 'idle' && isFirstVisit ? 'animate-pulse-gold' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Bell icon */}
        {state === 'subscribing' ? (
          <span className="flex h-5 w-5 items-center justify-center">
            <svg
              className="h-4 w-4 animate-spin text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </span>
        ) : state === 'subscribed' ? (
          <span className="relative flex h-5 w-5 items-center justify-center">
            {/* Filled bell */}
            <svg className="h-5 w-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Checkmark badge */}
            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#D4AF37]">
              <svg className="h-2 w-2 text-gray-950" viewBox="0 0 12 12" fill="currentColor">
                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        ) : state === 'denied' ? (
          <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          // Outline bell — idle
          <svg className="h-5 w-5 text-[#D4AF37] transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}

        {/* Label */}
        <span className="text-xs font-semibold">
          {state === 'subscribed'
            ? 'Notifications on'
            : state === 'denied'
              ? 'Blocked'
              : state === 'subscribing'
                ? 'Enabling…'
                : 'Get notified'}
        </span>
      </button>

      {state === 'denied' && (
        <a
          href="https://support.google.com/chrome/answer/3220216"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 underline hover:text-gray-400"
        >
          How to unblock
        </a>
      )}

      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
        }
        .animate-pulse-gold {
          animation: pulse-gold 2s ease-in-out 3;
        }
      `}</style>
    </div>
  )
}
