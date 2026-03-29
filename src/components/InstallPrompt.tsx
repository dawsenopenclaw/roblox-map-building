'use client'

import { useEffect, useState, useRef } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level ref so the event survives re-renders and route changes
// (beforeinstallprompt fires once per browser session)
let _captured: BeforeInstallPromptEvent | null = null

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(_captured)

  useEffect(() => {
    const dismissed = localStorage.getItem('rf-install-dismissed') === 'true'
    if (dismissed) return

    // Track visit count
    const visits = parseInt(localStorage.getItem('rf-visits') ?? '0', 10) + 1
    localStorage.setItem('rf-visits', String(visits))

    function tryShow(e?: BeforeInstallPromptEvent) {
      const prompt = e ?? _captured
      if (!prompt) return
      promptRef.current = prompt
      _captured = prompt
      if (visits >= 2) {
        setShow(true)
      }
    }

    // If we already captured the event in a previous render/visit, show now
    if (_captured && visits >= 2) {
      promptRef.current = _captured
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const bip = e as BeforeInstallPromptEvent
      _captured = bip
      tryShow(bip)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    const prompt = promptRef.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('rf-install-dismissed', 'true')
    }
    _captured = null
    setShow(false)
  }

  function handleDismiss() {
    localStorage.setItem('rf-install-dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Install RobloxForge"
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 rounded-2xl bg-[#0F1535] border border-[#F5A623]/30 shadow-2xl shadow-black/50 p-4 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Mini icon */}
          <div className="w-10 h-10 rounded-xl bg-[#0A0E27] border border-white/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 40 40" className="w-6 h-6">
              <path
                d="M20 4 L23 13 L18 9 Z"
                fill="#F5A623"
              />
              <path
                d="M20 4 L17 13 L22 9 Z"
                fill="#D4881A"
              />
              <path
                d="M20 13 L23 13 L20 36 L17 13 Z"
                fill="#F5A623"
              />
              <path
                d="M12 20 L28 20 L26 23 L14 23 Z"
                fill="#F5A623"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Add to home screen
            </p>
            <p className="text-xs text-white/50">RobloxForge</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-white/40 hover:text-white/70 transition-colors p-1 -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <p className="text-xs text-white/50 mb-4 leading-relaxed">
        Install RobloxForge for faster access, offline support, and a
        full-screen experience.
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5A623] text-[#0A0E27] text-sm font-semibold hover:bg-[#F5A623]/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
