'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ExternalLink, Search, Layout, Users, ShoppingBag, Settings, BarChart3, Zap, Shield, Heart, Code, Globe, CreditCard, Bell, Palette, Key, Plug, FileText } from 'lucide-react'

// ─── All site links ──────────────────────────────────────────────────────────

interface SiteLink {
  href: string
  label: string
  description: string
  category: string
  icon: React.ReactNode
}

const ALL_LINKS: SiteLink[] = [
  // App
  { href: '/dashboard', label: 'Dashboard', description: 'Main app dashboard', category: 'App', icon: <Layout size={14} /> },
  { href: '/editor', label: 'Editor', description: 'AI build editor', category: 'App', icon: <Code size={14} /> },
  { href: '/projects', label: 'Projects', description: 'Your saved projects', category: 'App', icon: <FileText size={14} /> },
  { href: '/marketplace', label: 'Marketplace', description: 'Browse and buy templates', category: 'App', icon: <ShoppingBag size={14} /> },
  { href: '/tokens', label: 'Tokens', description: 'Token balance and usage', category: 'App', icon: <Zap size={14} /> },
  { href: '/earnings', label: 'Earnings', description: 'Creator earnings dashboard', category: 'App', icon: <CreditCard size={14} /> },

  // Settings
  { href: '/settings', label: 'Settings — Profile', description: 'Edit your profile', category: 'Settings', icon: <Settings size={14} /> },
  { href: '/settings?tab=billing', label: 'Settings — Billing', description: 'Manage subscription', category: 'Settings', icon: <CreditCard size={14} /> },
  { href: '/settings?tab=notifications', label: 'Settings — Notifications', description: 'Email & SMS preferences', category: 'Settings', icon: <Bell size={14} /> },
  { href: '/settings?tab=appearance', label: 'Settings — Appearance', description: 'Themes and colors', category: 'Settings', icon: <Palette size={14} /> },
  { href: '/settings?tab=studio', label: 'Settings — Studio', description: 'Roblox Studio plugin', category: 'Settings', icon: <Plug size={14} /> },
  { href: '/settings?tab=api-keys', label: 'Settings — API Keys', description: 'Manage API keys', category: 'Settings', icon: <Key size={14} /> },
  { href: '/settings?tab=connected', label: 'Settings — Connected', description: 'Connected accounts', category: 'Settings', icon: <Globe size={14} /> },

  // Admin
  { href: '/admin', label: 'Admin — Overview', description: 'Admin dashboard home', category: 'Admin', icon: <Shield size={14} /> },
  { href: '/admin/metrics', label: 'Admin — Live Metrics', description: 'Real-time KPIs and charts', category: 'Admin', icon: <BarChart3 size={14} /> },
  { href: '/admin/users', label: 'Admin — Users', description: 'User management', category: 'Admin', icon: <Users size={14} /> },
  { href: '/admin/templates', label: 'Admin — Templates', description: 'Template approval queue', category: 'Admin', icon: <ShoppingBag size={14} /> },
  { href: '/admin/analytics', label: 'Admin — Analytics', description: 'MRR, churn, LTV, funnels', category: 'Admin', icon: <BarChart3 size={14} /> },
  { href: '/admin/charity', label: 'Admin — Charity', description: 'Charity program management', category: 'Admin', icon: <Heart size={14} /> },
  { href: '/admin/links', label: 'Admin — Links', description: 'This page — all site links', category: 'Admin', icon: <Globe size={14} /> },

  // Marketing / Public
  { href: '/', label: 'Homepage', description: 'Public landing page', category: 'Public', icon: <Globe size={14} /> },
  { href: '/pricing', label: 'Pricing', description: 'Plans and pricing', category: 'Public', icon: <CreditCard size={14} /> },
  { href: '/docs', label: 'Docs', description: 'Documentation', category: 'Public', icon: <FileText size={14} /> },
  { href: '/blog', label: 'Blog', description: 'Blog and updates', category: 'Public', icon: <FileText size={14} /> },

  // Auth
  { href: '/sign-in', label: 'Sign In', description: 'Authentication', category: 'Auth', icon: <Users size={14} /> },
  { href: '/sign-up', label: 'Sign Up', description: 'New account creation', category: 'Auth', icon: <Users size={14} /> },
  { href: '/onboarding', label: 'Onboarding', description: 'New user setup flow', category: 'Auth', icon: <Zap size={14} /> },

  // API routes (for reference)
  { href: '/api/admin/stats', label: 'API — Admin Stats', description: 'GET admin statistics', category: 'API', icon: <Code size={14} /> },
  { href: '/api/admin/metrics', label: 'API — Admin Metrics', description: 'GET full metrics', category: 'API', icon: <Code size={14} /> },
  { href: '/api/admin/analytics', label: 'API — Analytics', description: 'GET analytics data', category: 'API', icon: <Code size={14} /> },
  { href: '/api/notifications', label: 'API — Notifications', description: 'GET/PATCH/DELETE notifications', category: 'API', icon: <Code size={14} /> },
  { href: '/api/notifications/preferences', label: 'API — Notification Prefs', description: 'GET/PUT/PATCH preferences', category: 'API', icon: <Code size={14} /> },
  { href: '/api/tokens/balance', label: 'API — Token Balance', description: 'GET token balance', category: 'API', icon: <Code size={14} /> },
  { href: '/api/webhooks/stripe', label: 'API — Stripe Webhooks', description: 'POST Stripe events', category: 'API', icon: <Code size={14} /> },
]

const CATEGORIES = ['App', 'Settings', 'Admin', 'Public', 'Auth', 'API']
const STORAGE_KEY = 'forje-favorite-links'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LinksPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setFavorites(new Set(JSON.parse(saved))) } catch { /* ignore */ }
    }
  }, [])

  const toggleFavorite = (href: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const filtered = ALL_LINKS.filter((link) => {
    if (showFavoritesOnly && !favorites.has(link.href)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      link.label.toLowerCase().includes(q) ||
      link.description.toLowerCase().includes(q) ||
      link.href.toLowerCase().includes(q) ||
      link.category.toLowerCase().includes(q)
    )
  })

  const favoriteLinks = ALL_LINKS.filter((l) => favorites.has(l.href))

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">All Site Links</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {ALL_LINKS.length} links &middot; {favorites.size} favorited &middot; Click the star to favorite
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FFB81C]/30 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            showFavoritesOnly
              ? 'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/20'
              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          <Star size={12} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          Favorites ({favorites.size})
        </button>
      </div>

      {/* Favorites quick bar */}
      {favoriteLinks.length > 0 && !showFavoritesOnly && (
        <div className="bg-[#0A0F1A] border border-[#FFB81C]/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-[#FFB81C] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Star size={12} fill="currentColor" />
            Quick Access
          </h3>
          <div className="flex flex-wrap gap-2">
            {favoriteLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFB81C]/5 hover:bg-[#FFB81C]/10 border border-[#FFB81C]/15 hover:border-[#FFB81C]/30 rounded-lg text-xs text-white transition-colors"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Links by category */}
      {CATEGORIES.map((cat) => {
        const catLinks = filtered.filter((l) => l.category === cat)
        if (catLinks.length === 0) return null

        return (
          <div key={cat}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {cat} ({catLinks.length})
            </h2>
            <div className="bg-[#0A0F1A] border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
              {catLinks.map((link) => {
                const isFav = favorites.has(link.href)
                return (
                  <div key={link.href} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                    {/* Favorite toggle */}
                    <button
                      onClick={() => toggleFavorite(link.href)}
                      className={`flex-shrink-0 transition-colors ${
                        isFav ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]/60'
                      }`}
                      aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>

                    {/* Icon */}
                    <span className="text-gray-500 flex-shrink-0">{link.icon}</span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{link.label}</p>
                      <p className="text-[11px] text-gray-600">{link.description}</p>
                    </div>

                    {/* Path */}
                    <code className="text-[10px] text-gray-600 font-mono hidden sm:block flex-shrink-0 max-w-[200px] truncate">
                      {link.href}
                    </code>

                    {/* Open link */}
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-white transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No links match "{search}"</p>
        </div>
      )}
    </div>
  )
}
