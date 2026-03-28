'use client'
import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function AppTopNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { data } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30000 })
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="h-16 bg-[#0A0E27] border-b border-white/10 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 text-gray-400 hover:text-white"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search projects..."
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Token balance */}
      <div className="flex items-center gap-2 bg-[#0D1231] border border-white/10 rounded-xl px-3 py-2">
        <span className="text-[#FFB81C] text-xs font-semibold">⚡</span>
        <span className="text-white text-sm font-bold">
          {data?.balance !== undefined ? data.balance.toLocaleString() : '—'}
        </span>
        <span className="text-gray-500 text-xs hidden sm:block">tokens</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFB81C] rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-[#0D1231] border border-white/10 rounded-xl shadow-xl z-50 p-4">
            <p className="text-sm font-semibold text-white mb-3">Notifications</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FFB81C] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white">Your voice build completed</p>
                  <p className="text-xs text-gray-500 mt-0.5">2 minutes ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Monthly tokens refreshed</p>
                  <p className="text-xs text-gray-500 mt-0.5">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
          className="w-9 h-9 rounded-full bg-[#FFB81C]/20 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-sm font-bold"
          aria-label="Profile menu"
        >
          U
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#0D1231] border border-white/10 rounded-xl shadow-xl z-50 py-1">
            <Link href="/settings" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5">
              Settings
            </Link>
            <Link href="/billing" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5">
              Billing
            </Link>
            <div className="border-t border-white/10 mt-1 pt-1">
              <Link href="/sign-in" className="block px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5">
                Sign out
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
