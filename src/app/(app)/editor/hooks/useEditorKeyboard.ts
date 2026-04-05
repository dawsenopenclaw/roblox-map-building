'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardActions {
  openCommandPalette: () => void
  toggleViewport: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  toggleShortcutsHelp: () => void
  focusChatInput: () => void
  newChat?: () => void
}

/** All registered shortcuts — used for the help overlay */
export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Focus chat input', category: 'Navigation' },
  { keys: ['Ctrl', '/'], label: 'Toggle shortcuts help', category: 'Navigation' },
  { keys: ['Ctrl', '\\'], label: 'Toggle viewport expand', category: 'Viewport' },
  { keys: ['Ctrl', 'B'], label: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', 'N'], label: 'New chat', category: 'Chat' },
  { keys: ['Esc'], label: 'Close panel / blur input', category: 'Navigation' },
  { keys: ['?'], label: 'Toggle shortcuts help', category: 'Navigation' },
  { keys: ['Enter'], label: 'Send message', category: 'Chat' },
  { keys: ['Ctrl', 'Enter'], label: 'Send message (alternative)', category: 'Chat' },
  { keys: ['Shift', 'Enter'], label: 'New line in chat', category: 'Chat' },
] as const

/**
 * Global keyboard shortcuts for the editor.
 */
export function useEditorKeyboard(actions: KeyboardActions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const isInput =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.getAttribute('contenteditable') === 'true'

      // Ctrl/Cmd + K → focus chat input
      if (mod && e.key === 'k') {
        e.preventDefault()
        actions.focusChatInput()
        return
      }

      // Ctrl/Cmd + / → toggle shortcuts help
      if (mod && e.key === '/') {
        e.preventDefault()
        actions.toggleShortcutsHelp()
        return
      }

      // Ctrl/Cmd + \ → toggle viewport
      if (mod && e.key === '\\') {
        e.preventDefault()
        actions.toggleViewport()
        return
      }

      // Ctrl/Cmd + B → toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault()
        actions.toggleSidebar()
        return
      }

      // Ctrl/Cmd + N → new chat
      if (mod && e.key === 'n' && actions.newChat) {
        e.preventDefault()
        actions.newChat()
        return
      }

      // ? → toggle shortcuts help (only when not in input)
      if (e.key === '?' && !isInput) {
        e.preventDefault()
        actions.toggleShortcutsHelp()
        return
      }

      // Escape → close things
      if (e.key === 'Escape') {
        if (isInput) {
          ;(target as HTMLElement).blur()
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
