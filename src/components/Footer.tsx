'use client'

import Link from 'next/link'

const PRODUCT_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/docs', label: 'Documentation' },
  { href: '/blog', label: 'Blog' },
]

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: 'mailto:support@forjegames.gg', label: 'Support' },
  { href: 'mailto:legal@forjegames.gg', label: 'Legal' },
  { href: 'mailto:abuse@forjegames.gg', label: 'Report Abuse' },
]

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/acceptable-use', label: 'Acceptable Use' },
  { href: '/terms#charity', label: 'Charity Policy' },
]

const COMMUNITY_LINKS = [
  { href: 'https://discord.gg/forjegames', label: 'Discord Server' },
  { href: 'https://github.com/forjegames', label: 'GitHub' },
  { href: 'https://twitter.com/forjegames', label: 'Twitter / X' },
  { href: 'https://youtube.com/@forjegames', label: 'YouTube' },
  { href: '/changelog', label: 'Changelog' },
]

const SOCIAL_LINKS = [
  {
    href: 'https://twitter.com/forjegames',
    label: 'Twitter / X',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: 'https://discord.gg/forjegames',
    label: 'Discord',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    href: 'https://github.com/forjegames',
    label: 'GitHub',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com/@forjegames',
    label: 'YouTube',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

function FooterColumn({
  id,
  title,
  links,
}: {
  id: string
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p
        id={id}
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: '#D4AF37' }}
      >
        {title}
      </p>
      <ul className="space-y-2.5" aria-labelledby={id}>
        {links.map((l) => (
          <li key={l.href}>
            {l.href.startsWith('mailto:') || l.href.startsWith('http') ? (
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#111827] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* Brand + charity badge row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div>
            <Link
              href="/"
              className="inline-block font-extrabold text-2xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded"
              aria-label="ForjeGames home"
            >
              <span style={{ color: '#D4AF37' }}>Forje</span>
              <span className="text-white">Games</span>
            </Link>
            <p className="text-gray-400 text-sm mt-2 max-w-xs leading-relaxed">
              AI-powered Roblox game development. Build professional games faster than ever.
            </p>
          </div>

          {/* Charity badge */}
          <div
            className="flex items-center gap-3 self-start rounded-xl px-4 py-3 border"
            style={{
              background: 'rgba(212, 175, 55, 0.07)',
              borderColor: 'rgba(212, 175, 55, 0.22)',
            }}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              style={{ color: '#D4AF37' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                10% donated to charity
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Not tax-deductible. See{' '}
                <Link
                  href="/terms#charity"
                  className="hover:text-gray-300 transition-colors underline underline-offset-2"
                >
                  Terms §12
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* 4-column link grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <FooterColumn id="footer-product" title="Product" links={PRODUCT_LINKS} />
          <FooterColumn id="footer-company" title="Company" links={COMPANY_LINKS} />
          <FooterColumn id="footer-legal" title="Legal" links={LEGAL_LINKS} />
          <FooterColumn id="footer-community" title="Community" links={COMMUNITY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2026 ForjeGames. All rights reserved.
          </p>

          {/* Social icon row */}
          <nav className="flex items-center gap-1" aria-label="Social media links">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </nav>

          <p className="text-xs text-gray-600 sm:text-right">
            Not affiliated with Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
