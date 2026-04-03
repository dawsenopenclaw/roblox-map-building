'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardActions {
  focusChat: () => void
  toggleViewport: () => void
  closeSidebar: () => void
  sendMessage?: () => void
}

/**
 * Global keyboard shortcuts for the editor.
 *
 * Ctrl/Cmd + /  → Focus chat input
 * Ctrl/Cmd + K  → Focus chat (command palette style)
 * Ctrl/Cmd + \  → Toggle viewport expand
 * Escape        → Close sidebar panel
 */
export function useEditorKeyboard(actions: KeyboardActions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + / or Ctrl/Cmd + K → focus chat
      if (mod && (e.key === '/' || e.key === 'k')) {
        e.preventDefault()
        actions.focusChat()
        return
      }

      // Ctrl/Cmd + \ → toggle viewport
      if (mod && e.key === '\\') {
        e.preventDefault()
        actions.toggleViewport()
        return
      }

      // Escape → close sidebar (only if not in an input)
      if (e.key === 'Escape') {
        const active = document.activeElement
        const isInput =
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLInputElement ||
          active?.getAttribute('contenteditable') === 'true'

        if (isInput) {
          // Blur the input instead of closing sidebar
          ;(active as HTMLElement).blur()
        } else {
          actions.closeSidebar()
        }
        return
      }
    },
    [actions],
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
