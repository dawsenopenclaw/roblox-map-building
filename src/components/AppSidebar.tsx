'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TierBadge } from '@/components/TierBadge'
import type { Tier } from '@/components/TierBadge'

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21V12h6v9" />
    </svg>
  )
}
function IconMic() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  )
}
function IconMap() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5-2V4l5 2m0 14l6-2m-6 2V6m6 12l5 2V4l-5-2m0 14V6" />
    </svg>
  )
}
function IconStore() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9h18M3 9l2-5h14l2 5M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 21v-6h6v6" />
    </svg>
  )
}
function IconDna() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 3c0 4 10 4 10 8S7 15 7 19M17 3c0 4-10 4-10 8s10 4 10 8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 6h14M5 18h14" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 18l5-5 4 4 5-6 4 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21h18" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function IconBilling() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'ai-tools',
    label: 'AI Tools',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
      { href: '/voice',     label: 'Voice Build', Icon: IconMic },
      { href: '/image-to-map', label: 'Image to Map', Icon: IconMap },
      { href: '/game-dna',  label: 'Game DNA',   Icon: IconDna },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    items: [
      { href: '/marketplace', label: 'Browse Assets', Icon: IconStore },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { href: '/dashboard/cost-tracker', label: 'Analytics',   Icon: IconChart },
      { href: '/team',      label: 'Team',         Icon: IconUsers },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', Icon: IconGear },
      { href: '/billing',  label: 'Billing',  Icon: IconBilling },
    ],
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionGroup({
  section,
  defaultOpen = true,
  pathname,
  onClose,
}: {
  section: typeof SECTIONS[number]
  defaultOpen?: boolean
  pathname: string
  onClose: () => void
}) {
  const hasActive = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const [open, setOpen] = useState(defaultOpen || hasActive)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 group"
        aria-expanded={open}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 group-hover:text-gray-400 transition-colors">
          {section.label}
        </span>
        <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
          <IconChevron open={open} />
        </span>
      </button>

      {open && (
        <div className="space-y-0.5 mb-3">
          {section.items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span
                  className={`flex-shrink-0 transition-all duration-150 ${
                    active ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  <Icon />
                </span>
                <span className="flex-1 truncate">{label}</span>
                {active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

// Placeholder user data — swap for real auth hook when available
const MOCK_USER = {
  initials: 'FG',
  name: 'ForgeUser',
  tier: 'BUILDER' as Tier,
}

export function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

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
        className={`fixed top-0 left-0 h-full w-60 bg-[#111827] border-r border-white/[0.07] z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:z-auto`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            {/* Forge hex icon */}
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#0A0E1A] font-black text-sm select-none"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
              aria-hidden="true"
            >
              F
            </span>
            <span className="font-bold text-sm tracking-tight truncate">
              <span style={{ color: '#D4AF37' }}>Forge</span>
              <span className="text-white">Games</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1" aria-label="Sidebar">
          {SECTIONS.map((section, i) => (
            <SectionGroup
              key={section.id}
              section={section}
              defaultOpen={i === 0}
              pathname={pathname}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* User avatar + tier badge */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 select-none"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                color: '#0A0E1A',
              }}
              aria-hidden="true"
            >
              {MOCK_USER.initials}
            </div>

            {/* Name + tier */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{MOCK_USER.name}</p>
              <div className="mt-0.5">
                <TierBadge tier={MOCK_USER.tier} size="sm" showIcon />
              </div>
            </div>

            {/* Settings shortcut */}
            <Link
              href="/settings"
              className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Open settings"
            >
              <IconGear />
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
