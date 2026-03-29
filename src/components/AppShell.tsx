'use client'
import { useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import { ActivityBar } from '@/components/ActivityBar'
import { AppTopNav } from '@/components/AppTopNav'
import { AchievementToastProvider } from '@/components/AchievementToast'
import { CommandPalette } from '@/components/CommandPalette'
import { ShortcutsDialog } from '@/components/ShortcutsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Spotlight } from '@/components/ui/spotlight'

/**
 * Client shell for the app layout.
 *
 * On /dashboard we render the full-IDE layout:
 *   ActivityBar (far-left icon rail) + full-height editor content (no top nav, no padding)
 *
 * On all other routes we keep the existing top nav + left sidebar + padded main layout.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isEditor = pathname === '/dashboard'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const handleClose = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(false)
  }, [])

  const handleNewProject = useCallback(() => {
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
    <>
      {isEditor ? (
        /* ── IDE layout: activity bar + full-height editor ── */
        <div className="min-h-screen bg-[#0A0E1A] flex overflow-hidden" style={{ height: '100vh' }}>
          <ActivityBar />
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      ) : (
        /* ── Standard layout: top nav + left sidebar + padded main ── */
        <div className="min-h-screen bg-[#0A0E27] flex">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <AppTopNav
              onMenuOpen={() => setSidebarOpen(true)}
              onCommandPalette={() => setPaletteOpen(true)}
            />
            <Spotlight className="flex-1 overflow-hidden" opacity={0.04} radius={500}>
              <main id="main-content" className="h-full p-4 sm:p-6 overflow-auto" tabIndex={-1}>
                {children}
              </main>
            </Spotlight>
          </div>
        </div>
      )}

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
    </>
  )
}
