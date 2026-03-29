'use client'
import { useState, useCallback, useMemo } from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { AppTopNav } from '@/components/AppTopNav'
import { AchievementToastProvider } from '@/components/AchievementToast'
import { CommandPalette } from '@/components/CommandPalette'
import { ShortcutsDialog } from '@/components/ShortcutsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

/**
 * Client shell for the app layout.
 * Handles sidebar open/close state, command palette, shortcuts dialog,
 * and global keyboard shortcuts without requiring the layout to be a client component.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const handleClose = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(false)
  }, [])

  const handleNewProject = useCallback(() => {
    // Navigate to projects — extend with a creation modal when that UI exists
    window.location.href = '/projects'
  }, [])

  const shortcutHandlers = useMemo(
    () => ({
      onCommandPalette: () => setPaletteOpen((v) => !v),
      onNewProject: handleNewProject,
      onToggleSidebar: () => setSidebarOpen((v) => !v),
      onShowShortcuts: () => setShortcutsOpen((v) => !v),
      onClose: handleClose,
    }),
    [handleClose, handleNewProject],
  )

  useKeyboardShortcuts(shortcutHandlers)

  return (
    <div className="min-h-screen bg-[#0A0E27] flex">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppTopNav
          onMenuOpen={() => setSidebarOpen(true)}
          onCommandPalette={() => setPaletteOpen(true)}
        />
        <main id="main-content" className="flex-1 p-4 sm:p-6 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>

      <AchievementToastProvider />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewProject={handleNewProject}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      <ShortcutsDialog
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  )
}
