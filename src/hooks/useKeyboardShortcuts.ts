'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface ShortcutHandlers {
  onCommandPalette: () => void
  onNewProject: () => void
  onToggleSidebar: () => void
  onShowShortcuts: () => void
  onClose: () => void
}

/**
 * Global keyboard shortcut system.
 *
 * Single-key shortcuts:
 *   Cmd/Ctrl+K  — Command palette
 *   Cmd/Ctrl+N  — New project
 *   Cmd/Ctrl+B  — Toggle sidebar
 *   Cmd/Ctrl+/  — Shortcuts help dialog
 *   Escape      — Close any modal/palette
 *
 * Sequence shortcuts (two-key combos via "G then …"):
 *   G D  — Dashboard
 *   G V  — Voice build
 *   G I  — Image-to-map
 *   G M  — Marketplace
 *   G S  — Settings
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const router = useRouter()
  // Track whether we're waiting for the second key of a G-sequence
  const gSequenceActive = useRef(false)
  const gSequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function clearGSequence() {
      gSequenceActive.current = false
      if (gSequenceTimer.current) {
        clearTimeout(gSequenceTimer.current)
        gSequenceTimer.current = null
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const tag = target.tagName
      // Don't fire shortcuts when user is typing in an input/textarea/contenteditable
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable

      const mod = e.metaKey || e.ctrlKey

      // --- Modifier shortcuts (always fire, even in inputs for Cmd combos) ---
      if (mod) {
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault()
          clearGSequence()
          handlers.onCommandPalette()
          return
        }
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault()
          clearGSequence()
          handlers.onNewProject()
          return
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault()
          clearGSequence()
          handlers.onToggleSidebar()
          return
        }
        if (e.key === '/') {
          e.preventDefault()
          clearGSequence()
          handlers.onShowShortcuts()
          return
        }
      }

      // --- Escape: always fires ---
      if (e.key === 'Escape') {
        clearGSequence()
        handlers.onClose()
        return
      }

      // Don't fire bare-key shortcuts when typing
      if (isTyping) return

      // --- G-sequence handling ---
      if (gSequenceActive.current) {
        clearGSequence()
        switch (e.key.toLowerCase()) {
          case 'd':
            router.push('/dashboard')
            break
          case 'v':
            router.push('/voice')
            break
          case 'i':
            router.push('/image-to-map')
            break
          case 'm':
            router.push('/marketplace')
            break
          case 's':
            router.push('/settings')
            break
        }
        return
      }

      if (e.key.toLowerCase() === 'g' && !mod) {
        // Start a 1-second window for the second key
        gSequenceActive.current = true
        gSequenceTimer.current = setTimeout(clearGSequence, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearGSequence()
    }
  }, [handlers, router])
}
