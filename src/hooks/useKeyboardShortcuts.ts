'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface ShortcutHandlers {
  onCommandPalette: () => void
  onNewProject: () => void
  onToggleSidebar: () => void
  onShowShortcuts: () => void
  onClose: () => void
  /** Ctrl+Enter — send chat message (editor only; no-op elsewhere) */
  onSendChat?: () => void
  /** Ctrl+M — cycle / toggle model selector (editor only; no-op elsewhere) */
  onToggleModelSelector?: () => void
  /** Ctrl+Shift+V — toggle voice input (editor only; no-op elsewhere) */
  onToggleVoiceInput?: () => void
}

/**
 * Global keyboard shortcut system.
 *
 * Modifier shortcuts (fire even while typing):
 *   Cmd/Ctrl+K        — Command palette
 *   Cmd/Ctrl+N        — New project
 *   Cmd/Ctrl+B        — Toggle sidebar
 *   Cmd/Ctrl+/        — Shortcuts help dialog
 *   Cmd/Ctrl+Enter    — Send chat message
 *   Cmd/Ctrl+M        — Toggle model selector
 *   Cmd/Ctrl+Shift+V  — Toggle voice input
 *   Escape            — Close any modal/palette
 *
 * Bare-key shortcuts (skipped while typing in inputs):
 *   ?          — Show shortcuts dialog
 *
 * Sequence shortcuts (two-key combos via "G then …"):
 *   G D  — Dashboard
 *   G E  — Editor
 *   G M  — Marketplace
 *   G V  — Voice build
 *   G I  — Image-to-map
 *   G S  — Settings
 *   G B  — Billing
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const router = useRouter()
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
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable

      const mod = e.metaKey || e.ctrlKey

      // ── Modifier shortcuts (always fire) ────────────────────────────────────
      if (mod) {
        // Ctrl+K — Command palette (skip if target opted out via data-no-palette)
        if (e.key === 'k' || e.key === 'K') {
          const noPalette = (target as HTMLElement).dataset?.noPalette === 'true'
          if (!noPalette) {
            e.preventDefault()
            clearGSequence()
            handlers.onCommandPalette()
            return
          }
        }

        // Ctrl+N — New project
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault()
          clearGSequence()
          handlers.onNewProject()
          return
        }

        // Ctrl+B — Toggle sidebar
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault()
          clearGSequence()
          handlers.onToggleSidebar()
          return
        }

        // Ctrl+/ — Shortcuts dialog
        if (e.key === '/') {
          e.preventDefault()
          clearGSequence()
          handlers.onShowShortcuts()
          return
        }

        // Ctrl+Enter — Send chat message
        if (e.key === 'Enter') {
          e.preventDefault()
          clearGSequence()
          handlers.onSendChat?.()
          return
        }

        // Ctrl+Shift+V — Toggle voice input
        if ((e.key === 'v' || e.key === 'V') && e.shiftKey) {
          e.preventDefault()
          clearGSequence()
          handlers.onToggleVoiceInput?.()
          return
        }

        // Ctrl+M — Toggle model selector
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault()
          clearGSequence()
          handlers.onToggleModelSelector?.()
          return
        }
      }

      // ── Escape: always fires ─────────────────────────────────────────────────
      if (e.key === 'Escape') {
        clearGSequence()
        handlers.onClose()
        return
      }

      // Don't fire bare-key shortcuts while typing
      if (isTyping) return

      // ── ? — Show shortcuts dialog ────────────────────────────────────────────
      if (e.key === '?') {
        e.preventDefault()
        clearGSequence()
        handlers.onShowShortcuts()
        return
      }

      // ── G-sequence navigation ────────────────────────────────────────────────
      if (gSequenceActive.current) {
        clearGSequence()
        switch (e.key.toLowerCase()) {
          case 'd':
            router.push('/dashboard')
            break
          case 'e':
            router.push('/editor')
            break
          case 'm':
            router.push('/marketplace')
            break
          case 'v':
            router.push('/voice')
            break
          case 'i':
            router.push('/image-to-map')
            break
          case 's':
            router.push('/settings')
            break
          case 'b':
            router.push('/billing')
            break
        }
        return
      }

      if (e.key.toLowerCase() === 'g' && !mod) {
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
