'use client'

import { useState, useEffect } from 'react'

/**
 * PWA Install Prompt — shows a banner encouraging users to install
 * ForjeGames as a desktop/mobile app. Uses the beforeinstallprompt event.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    try {
      if (localStorage.getItem('pwa_install_dismissed') === '1') {
        setDismissed(true)
        return
      }
    } catch {}

    // Check if already in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed || installed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('pwa_install_dismissed', '1') } catch {}
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(10,14,28,0.95)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.08)',
        maxWidth: 440,
        width: 'calc(100% - 40px)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
        border: '1px solid rgba(212,175,55,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#FAFAFA', margin: 0 }}>
          Install ForjeGames
        </p>
        <p style={{ fontSize: 11, color: '#71717A', margin: '2px 0 0' }}>
          Get the desktop app — works offline with Studio
        </p>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: '#D4AF37',
          color: '#09090b',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'filter 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none', border: 'none', color: '#52525B',
          cursor: 'pointer', padding: 4, flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#A1A1AA'}
        onMouseLeave={e => e.currentTarget.style.color = '#52525B'}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/**
 * Hook to check if the app is running as an installed PWA.
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false)
  useEffect(() => {
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches)
  }, [])
  return isPWA
}
