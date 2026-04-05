'use client'
/**
 * GlobalShortcuts
 *
 * Renders CommandPalette + ShortcutsDialog globally so they are available on
 * every page (not just the editor).  Wired into the root layout.
 *
 * Keyboard bindings handled here:
 *   Ctrl/Cmd + K  → focus editor chat input (navigate to /editor if not there)
 *   Ctrl/Cmd + /  → toggle shortcuts help overlay
 *   Ctrl/Cmd + ,  → go to /settings
 *   Ctrl/Cmd + B  → go to /billing (skipped when on /editor — editor owns Ctrl+B)
 *   Ctrl/Cmd + G  → go to /gifts
 *   ?             → shortcuts dialog (when no input/textarea focused)
 *   Escape        → close any open overlay
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
)
const ShortcutsDialog = dynamic(
  () => import('@/components/ShortcutsDialog').then((m) => m.ShortcutsDialog),
  { ssr: false }
)

function isInputFocused() {
  const tag = document.activeElement?.tagName
  const editable = (document.activeElement as HTMLElement)?.isContentEditable
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable
}

export function GlobalShortcuts() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const openPalette = useCallback(() => {
    setShortcutsOpen(false)
    setPaletteOpen(true)
  }, [])

  const openShortcuts = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(true)
  }, [])

  const closeAll = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(false)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      const onEditor = pathname?.startsWith('/editor')

      // Ctrl/Cmd+K — focus editor chat input / navigate to editor
      if (mod && e.key === 'k') {
        e.preventDefault()
        if (onEditor) {
          // On the editor page: dispatch event so the editor's own hook focuses the textarea.
          // The editor's useEditorKeyboard will open the command palette on its own listener,
          // so we additionally dispatch a custom event for textarea focus.
          window.dispatchEvent(new CustomEvent('focus-editor-chat'))
        } else {
          router.push('/editor')
        }
        return
      }

      // Ctrl/Cmd+/ — shortcuts dialog
      if (mod && e.key === '/') {
        // Skip on /editor — useEditorKeyboard handles it there (focuses chat input)
        if (onEditor) return
        e.preventDefault()
        if (shortcutsOpen) {
          setShortcutsOpen(false)
        } else {
          openShortcuts()
        }
        return
      }

      // Ctrl/Cmd+, — go to settings
      if (mod && e.key === ',') {
        e.preventDefault()
        closeAll()
        router.push('/settings')
        return
      }

      // Ctrl/Cmd+B — go to billing (skip on /editor where Ctrl+B = toggle sidebar)
      if (mod && e.key === 'b' && !onEditor) {
        e.preventDefault()
        closeAll()
        router.push('/billing')
        return
      }

      // Ctrl/Cmd+G — go to gifts
      if (mod && e.key === 'g') {
        e.preventDefault()
        closeAll()
        router.push('/gifts')
        return
      }

      // ? — shortcuts dialog (no modifier, only when no input focused)
      if (e.key === '?' && !mod && !isInputFocused()) {
        e.preventDefault()
        openShortcuts()
        return
      }

      // Escape — close any open overlay managed here
      if (e.key === 'Escape' && (paletteOpen || shortcutsOpen)) {
        closeAll()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, shortcutsOpen, openPalette, openShortcuts, closeAll, router, pathname])

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
