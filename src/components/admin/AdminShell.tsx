'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Layers,
  BarChart3,
  Heart,
  Shield,
  ChevronRight,
  Menu,
  X,
  Link2,
  Radio,
  CreditCard,
  Ticket,
  Kanban,
  Activity,
  PieChart,
  ArrowLeft,
} from 'lucide-react'
// Profile handled by global ProfileButton in root layout

interface AdminUser {
  id: string
  email: string
  role: string
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/dev-board', label: 'Dev Board', icon: Kanban },
  { href: '/admin/metrics', label: 'Live Metrics', icon: Activity },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/offers', label: 'Custom Offers', icon: Ticket },
  { href: '/admin/templates', label: 'Templates', icon: Layers },
  { href: '/admin/analytics', label: 'Analytics', icon: PieChart },
  { href: '/admin/charity', label: 'Charity', icon: Heart },
  { href: '/admin/links', label: 'All Links', icon: Link2 },
  { href: '/admin/studio', label: 'Studio', icon: Radio },
]

export function AdminShell({
  children,
  user,
  isDemo = false,
}: {
  children: React.ReactNode
  user: AdminUser
  isDemo?: boolean
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-[#141414] border-r border-[#1c1c1c] z-30 flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-[#1c1c1c] flex-shrink-0">
          <div className="w-7 h-7 bg-[#D4AF37] rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white">Admin</span>
          <span className="text-xs text-[#B0B0B0] ml-auto">ForjeGames</span>
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div className="mx-3 mt-3 px-3 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg">
            <p className="text-xs text-[#D4AF37] font-medium">Demo Mode</p>
            <p className="text-xs text-[#B0B0B0] mt-0.5">Showing sample data</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${active
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#1c1c1c] border border-transparent'
                  }
                `}
              >
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#D4AF37]' : 'text-[#B0B0B0] group-hover:text-white'}`}
                />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#D4AF37]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c1c1c] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37]">
              {(user.email[0] ?? 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user.email}</p>
              <p className="text-xs text-[#D4AF37]">{user.role}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center gap-2 text-xs text-[#B0B0B0] hover:text-white transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — mobile only */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-[#1c1c1c] bg-[#141414] lg:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white text-sm">Admin</span>
          <div className="ml-auto flex items-center gap-2">
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
