'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconEditor() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function IconSignOut() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

// ─── Nav items (3 total) ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/editor',   label: 'Editor',  Icon: IconEditor },
  { href: '/settings', label: 'Account', Icon: IconGear },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username ?? 'Builder'

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : (user?.username?.[0]?.toUpperCase() ?? 'FG')

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 bg-[#060A14] border-r border-white/[0.07] z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:z-auto`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.07] flex items-center justify-between flex-shrink-0">
          <Link href="/editor" className="flex items-center gap-2 min-w-0">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#0a0a0a] font-black text-sm select-none"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
              aria-hidden="true"
            >
              F
            </span>
            <span className="font-bold text-sm tracking-tight truncate">
              <span style={{ color: '#D4AF37' }}>Forje</span>
              <span className="text-white">Games</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav — flat list, no sections */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Sidebar">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-[#D4AF37]"
                    style={{ animation: 'active-bar-slide 200ms cubic-bezier(0.4,0,0.2,1) forwards' }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`flex-shrink-0 transition-all duration-150 ${
                    active
                      ? 'text-[#D4AF37]'
                      : 'text-gray-400 group-hover:text-[#D4AF37] group-hover:scale-110'
                  }`}
                >
                  <Icon />
                </span>
                <span className="flex-1 truncate">{label}</span>
              </Link>
            )
          })}

          {/* Sign out */}
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="group relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 border border-transparent transition-all duration-150 w-full"
          >
            <span className="flex-shrink-0 transition-all duration-150 text-gray-500 group-hover:text-red-400">
              <IconSignOut />
            </span>
            <span className="flex-1 truncate text-left">Sign Out</span>
          </button>
        </nav>

        {/* User info — simplified */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 select-none"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                color: '#0a0a0a',
              }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <p className="text-xs font-semibold text-white truncate flex-1">{displayName}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
