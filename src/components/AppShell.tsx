'use client'
import { useState, useCallback, useMemo, memo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import { AppTopNav } from '@/components/AppTopNav'
import { AchievementToastProvider } from '@/components/AchievementToast'
import { ResponsiveProvider } from '@/components/ui/ResponsiveLayout'
import dynamic from 'next/dynamic'

const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
)
const ShortcutsDialog = dynamic(
  () => import('@/components/ShortcutsDialog').then((m) => m.ShortcutsDialog),
  { ssr: false }
)
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Spotlight } from '@/components/ui/spotlight'

/**
 * Client shell for the app layout.
 *
 * /editor — renders children directly (full-screen, zero chrome)
 * everything else — standard top nav + sidebar + padded main
 *
 * AppShell lives in layout.tsx (persists across navigations). usePathname()
 * causes a re-render on every route change, so the chrome tree (sidebar, nav)
 * is memo-isolated. Only the <main> children slot updates between pages.
 */

// ── Memoised chrome — only re-renders when modal state changes, never on navigation ──
const AppChrome = memo(function AppChrome({
  children,
  sidebarOpen,
  paletteOpen,
  shortcutsOpen,
  onSidebarOpen,
  onSidebarClose,
  onSidebarToggle,
  onPaletteOpen,
  onPaletteClose,
  onShortcutsOpen,
  onShortcutsClose,
  onNewProject,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
  paletteOpen: boolean
  shortcutsOpen: boolean
  onSidebarOpen: () => void
  onSidebarClose: () => void
  onSidebarToggle: () => void
  onPaletteOpen: () => void
  onPaletteClose: () => void
  onShortcutsOpen: () => void
  onShortcutsClose: () => void
  onNewProject: () => void
}) {
  return (
    <>
      {/* ── Standard layout: top nav + left sidebar + padded main ── */}
      <div className="min-h-screen bg-[#050810] flex">
        <AppSidebar isOpen={sidebarOpen} onClose={onSidebarClose} />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopNav
            onMenuOpen={onSidebarOpen}
            onCommandPalette={onPaletteOpen}
          />
          {/* Subtle 1px gold gradient line separating nav from content */}
          <div
            aria-hidden="true"
            style={{
              height: '1px',
              flexShrink: 0,
              background: 'linear-gradient(90deg, transparent 0%, #D4AF3722 30%, #D4AF3730 60%, transparent 100%)',
            }}
          />
          <Spotlight className="flex-1 overflow-hidden" opacity={0.04} radius={500}>
            <main id="main-content" className="h-full p-4 sm:p-6 overflow-auto" tabIndex={-1}>
              {children}
            </main>
          </Spotlight>
        </div>
      </div>

      <AchievementToastProvider />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={onPaletteClose}
        onNewProject={onNewProject}
        onShowShortcuts={onShortcutsOpen}
        onToggleSidebar={onSidebarToggle}
      />

      <ShortcutsDialog
        isOpen={shortcutsOpen}
        onClose={onShortcutsClose}
      />
    </>
  )
})

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isNewEditor = pathname === '/editor'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const handleClose = useCallback(() => {
    setPaletteOpen(false)
    setShortcutsOpen(false)
  }, [])

  const handleNewProject = useCallback(() => {
    router.push('/editor')
  }, [router])

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

  // /editor renders its own full-screen layout — no wrapper chrome
  if (isNewEditor) {
    return (
      <ResponsiveProvider>
        {children}
      </ResponsiveProvider>
    )
  }

  return (
    <ResponsiveProvider>
      <AppChrome
        sidebarOpen={sidebarOpen}
        paletteOpen={paletteOpen}
        shortcutsOpen={shortcutsOpen}
        onSidebarOpen={() => setSidebarOpen(true)}
        onSidebarClose={() => setSidebarOpen(false)}
        onSidebarToggle={() => setSidebarOpen((v) => !v)}
        onPaletteOpen={() => setPaletteOpen(true)}
        onPaletteClose={() => setPaletteOpen(false)}
        onShortcutsOpen={() => setShortcutsOpen(true)}
        onShortcutsClose={() => setShortcutsOpen(false)}
        onNewProject={handleNewProject}
      >
        {children}
      </AppChrome>
    </ResponsiveProvider>
  )
}
