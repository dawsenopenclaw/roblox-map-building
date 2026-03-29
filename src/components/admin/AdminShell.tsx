'use client'

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
} from 'lucide-react'
import { useState } from 'react'

interface AdminUser {
  id: string
  email: string
  role: string
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/templates', label: 'Templates', icon: Layers },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/charity', label: 'Charity', icon: Heart },
]

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: AdminUser
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-[#242424] border-r border-[#3a3a3a] z-30 flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-[#3a3a3a]">
          <div className="w-7 h-7 bg-[#FFB81C] rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white">Admin</span>
          <span className="text-xs text-[#6B7280] ml-auto">ForjeGames</span>
        </div>

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
                    ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                    : 'text-[#6B7280] hover:text-white hover:bg-[#2e2e2e] border border-transparent'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FFB81C]' : 'text-[#6B7280] group-hover:text-white'}`} />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#FFB81C]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#3a3a3a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#FFB81C]">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user.email}</p>
              <p className="text-xs text-[#FFB81C]">{user.role}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center gap-2 text-xs text-[#6B7280] hover:text-white transition-colors"
          >
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar (mobile) */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-[#3a3a3a] bg-[#242424] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white text-sm">Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`ml-auto p-1.5 rounded-lg text-[#6B7280] hover:text-white ${sidebarOpen ? '' : 'hidden'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
