'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GradientText } from '@/components/ui/gradient-text'
import { Dock } from '@/components/ui/dock'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/voice', label: 'Voice Build', icon: '🎙️' },
  { href: '/image-to-map', label: 'Image to Map', icon: '🗺️' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛒' },
  { href: '/achievements', label: 'Achievements', icon: '🏆' },
  { href: '/game-dna', label: 'Game DNA', icon: '🧬' },
  { href: '/team', label: 'Team', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

function NavIcon({ icon }: { icon: string }) {
  return <span className="text-lg w-6 h-6 flex items-center justify-center" aria-hidden="true">{icon}</span>
}

export function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const dockItems = NAV_ITEMS.map((item) => ({
    id: item.href,
    label: item.label,
    icon: <NavIcon icon={item.icon} />,
    href: item.href,
    active: pathname === item.href || pathname.startsWith(item.href + '/'),
  }))

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
        className={`fixed top-0 left-0 h-full w-64 bg-[#0D1231] border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:z-auto`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            <GradientText>RobloxForge</GradientText>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white" aria-label="Close navigation">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav — full labels visible, dock magnification on icon area */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Sidebar">
          {/* On wide sidebar we show full nav links; the Dock effect enriches the icon scaling */}
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className="text-base w-6 h-6 flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-125"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom: plan badge */}
        <div className="px-4 pb-6">
          <div className="bg-[#111640] border border-white/10 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Current Plan</p>
            <p className="text-sm font-semibold text-white">Creator</p>
            <Link
              href="/billing"
              className="mt-2 block text-center text-xs text-[#FFB81C] hover:underline"
            >
              Upgrade plan
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
