'use client'
import { useState } from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { AppTopNav } from '@/components/AppTopNav'
import { AchievementToastProvider } from '@/components/AchievementToast'

/**
 * Client shell for the app layout.
 * Handles sidebar open/close state without requiring the entire layout to be a client component.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0E27] flex">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopNav onMenuOpen={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 p-4 sm:p-6 overflow-auto" tabIndex={-1}>{children}</main>
      </div>
      <AchievementToastProvider />
    </div>
  )
}
