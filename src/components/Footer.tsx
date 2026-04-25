import Link from 'next/link'
import { ForjeLogo } from '@/components/ForjeLogo'

// Server Component — no interactivity
const PRODUCT_LINKS = [
  { href: '/editor', label: 'Editor' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/templates', label: 'Templates' },
  { href: '/download', label: 'Studio Plugin' },
  { href: '/whats-new', label: "What's New" },
]

const RESOURCES_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/blog', label: 'Blog' },
  { href: '/help', label: 'Help Center' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/status', label: 'Status' },
]

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/acceptable-use', label: 'Acceptable Use' },
]

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/affiliates', label: 'Affiliates' },
  { href: 'mailto:support@forjegames.com', label: 'Support' },
  { href: 'https://discord.gg/forjegames', label: 'Discord' },
  { href: 'https://twitter.com/forjegames', label: 'Twitter / X' },
]

const SOCIAL_LINKS = [
  {
    href: 'https://twitter.com/forjegames',
    label: 'Twitter / X',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: 'https://discord.gg/forjegames',
    label: 'Discord',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    href: 'https://github.com/forjegames',
    label: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com/@forjegames',
    label: 'YouTube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        className="text-xs font-semibold uppercase tracking-widest mb-4 text-zinc-300"
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
                className="text-sm text-[#8B95B0] hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-sm text-[#8B95B0] hover:text-white transition-colors"
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

export default function Footer() {
  return (
    <footer className="relative bg-[#050810] mt-auto">
      {/* Gold accent gradient line */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 25%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0.25) 75%, transparent 100%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14">

        {/* Brand row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <Link
              href="/"
              className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded"
              aria-label="ForjeGames home"
            >
              <ForjeLogo size={24} />
            </Link>
            <p className="text-[#8B95B0] text-sm mt-2 max-w-xs leading-relaxed">
              Your game. Forjed by AI.
            </p>
            <p className="text-[#6B7394] text-xs mt-1">
              Built by Forje Labs
            </p>
          </div>
        </div>

        {/* 4-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <FooterColumn id="footer-product"   title="Product"   links={PRODUCT_LINKS} />
          <FooterColumn id="footer-resources" title="Resources" links={RESOURCES_LINKS} />
          <FooterColumn id="footer-legal"     title="Legal"     links={LEGAL_LINKS} />
          <FooterColumn id="footer-company"   title="Company"   links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[#8B95B0]">
            &copy; {new Date().getFullYear()} ForjeGames LLC. All rights reserved.
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
                className="p-2.5 rounded-lg text-[#8B95B0] hover:text-white hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {s.icon}
              </a>
            ))}
          </nav>

          <p className="text-xs text-[#6B7394] sm:text-right">
            Not affiliated with Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  )
}
