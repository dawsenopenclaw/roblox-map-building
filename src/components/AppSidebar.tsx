'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'

// ─── Keyframes ────────────────────────────────────────────────────────────────

const SIDEBAR_KEYFRAMES = `
  @keyframes active-bar-slide {
    from { opacity: 0; transform: translateY(-50%) scaleY(0.4); }
    to   { opacity: 1; transform: translateY(-50%) scaleY(1);   }
  }
  @media (prefers-reduced-motion: reduce) {
    [style*="active-bar-slide"] { animation: none !important; }
  }
`

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-2a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  )
}
function IconEditor() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
function IconProjects() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}
function IconMarketplace() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" />
      <circle cx="9" cy="21" r="1" strokeWidth={1.75} />
      <circle cx="19" cy="21" r="1" strokeWidth={1.75} />
    </svg>
  )
}
function IconGift() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}
function IconTokens() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 7v1m0 8v1m-3.5-5.5c0-1.1.9-2 2-2H13a2 2 0 010 4h-1a2 2 0 000 4h2.5" />
    </svg>
  )
}
function IconBilling() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2 10h20" />
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

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { href: '/dashboard',    label: 'Dashboard',    Icon: IconDashboard },
  { href: '/editor',       label: 'Editor',       Icon: IconEditor },
  { href: '/projects',     label: 'Projects',     Icon: IconProjects },
  { href: '/marketplace',  label: 'Marketplace',  Icon: IconMarketplace },
]

const NAV_ACCOUNT = [
  { href: '/tokens',   label: 'Tokens',   Icon: IconTokens },
  { href: '/billing',  label: 'Billing',  Icon: IconBilling },
  { href: '/gifts',    label: 'Gifts',    Icon: IconGift },
  { href: '/settings', label: 'Settings', Icon: IconGear },
]

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  Icon,
  pathname,
  onClose,
}: {
  href: string
  label: string
  Icon: () => React.ReactNode
  pathname: string
  onClose: () => void
}) {
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      onClick={onClose}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_12px_rgba(212,175,55,0.08)]'
          : 'text-gray-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.06] hover:translate-x-[2px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-transparent'
      }`}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
          style={{
            background: '#D4AF37',
            boxShadow: '0 0 8px #D4AF37, 0 0 16px rgba(212,175,55,0.4)',
            animation: 'active-bar-slide 200ms cubic-bezier(0.4,0,0.2,1) forwards',
          }}
          aria-hidden="true"
        />
      )}
      <span
        className={`flex-shrink-0 transition-all duration-200 ${
          active ? 'text-[#D4AF37]' : 'text-gray-400'
        }`}
        style={active ? { filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' } : undefined}
        onMouseEnter={(e) => {
          if (!active) {
            const el = e.currentTarget as HTMLSpanElement
            el.style.color = '#D4AF37'
            el.style.filter = 'drop-shadow(0 0 5px rgba(212,175,55,0.45))'
            el.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            const el = e.currentTarget as HTMLSpanElement
            el.style.color = ''
            el.style.filter = ''
            el.style.transform = ''
          }
        }}
      >
        <Icon />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  )
}

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
      <style>{SIDEBAR_KEYFRAMES}</style>

      {/* Mobile overlay — smoother fade */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      {/* Sidebar — smoother slide on mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 bg-[#060A14] border-r border-white/[0.07] z-50 flex flex-col lg:static lg:z-auto`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
          backgroundImage: 'radial-gradient(ellipse 120% 30% at 50% 100%, rgba(124,58,237,0.03) 0%, transparent 70%)',
        }}
        // On desktop, always visible via CSS override
        aria-label="Main navigation"
      >
        {/* Override: on lg+ always show regardless of transform */}
        <style>{`
          @media (min-width: 1024px) {
            aside[aria-label="Main navigation"] {
              transform: translateX(0) !important;
              position: static !important;
            }
          }
        `}</style>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.07] flex items-center justify-between flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto" aria-label="Sidebar">
          {/* Main group */}
          <div className="space-y-1">
            {NAV_MAIN.map(({ href, label, Icon }) => (
              <NavItem key={href} href={href} label={label} Icon={Icon} pathname={pathname} onClose={onClose} />
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.07]" />

          {/* Account group */}
          <div className="space-y-1">
            {NAV_ACCOUNT.map(({ href, label, Icon }) => (
              <NavItem key={href} href={href} label={label} Icon={Icon} pathname={pathname} onClose={onClose} />
            ))}

            {/* Sign out */}
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="group relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 border border-transparent transition-all duration-200 w-full"
            >
              <span className="flex-shrink-0 transition-all duration-200 text-gray-500 group-hover:text-red-400">
                <IconSignOut />
              </span>
              <span className="flex-1 truncate text-left">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Profile handled by global ProfileButton in root layout */}
      </aside>
    </>
  )
}
