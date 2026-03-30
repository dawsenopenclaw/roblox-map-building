'use client'
/**
 * GlobalShortcuts
 *
 * Renders CommandPalette + ShortcutsDialog globally so they are available on
 * every page (not just the editor).  Wired into the root layout.
 *
 * Keyboard bindings handled here:
 *   Ctrl/Cmd + K  → command palette
 *   Ctrl/Cmd + /  → shortcuts dialog
 *   ?             → shortcuts dialog (when no input/textarea focused)
 */
import { useState, useEffect, useCallback } from 'react'
import { CommandPalette } from '@/components/CommandPalette'
import { ShortcutsDialog } from '@/components/ShortcutsDialog'

function isInputFocused() {
  const tag = document.activeElement?.tagName
  const editable = (document.activeElement as HTMLElement)?.isContentEditable
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable
}

export function GlobalShortcuts() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const openPalette = useCallback(() => {
    setShortcutsOpen(false)
    setPaletteOpen(true)
  }, [])

  const openShortcuts = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(true)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey

      // Ctrl/Cmd+K — command palette
      if (mod && e.key === 'k') {
        e.preventDefault()
        if (paletteOpen) {
          setPaletteOpen(false)
        } else {
          openPalette()
        }
        return
      }

      // Ctrl/Cmd+/ — shortcuts dialog
      if (mod && e.key === '/') {
        e.preventDefault()
        if (shortcutsOpen) {
          setShortcutsOpen(false)
        } else {
          openShortcuts()
        }
        return
      }

      // ? — shortcuts dialog (no modifier, only when no input focused)
      if (e.key === '?' && !mod && !isInputFocused()) {
        e.preventDefault()
        openShortcuts()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, shortcutsOpen, openPalette, openShortcuts])

  return (
    <>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onShowShortcuts={openShortcuts}
      />
      <ShortcutsDialog
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  )
}
