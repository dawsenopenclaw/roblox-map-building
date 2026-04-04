import type { Metadata } from 'next'
import Link from 'next/link'
import { BackToTop } from './_components/BackToTop'
// Profile handled by global ProfileButton in root layout

export const metadata: Metadata = {
  title: 'Legal — ForjeGames',
}

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/dmca', label: 'DMCA Policy' },
  { href: '/acceptable-use', label: 'Acceptable Use' },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050810] text-[#FAFAFA]">
      {/* Top nav */}
      <header className="border-b border-white/[0.07] sticky top-0 z-40 bg-[#050810]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#D4AF37] font-bold text-lg tracking-tight">
            ForjeGames
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex gap-6 text-sm text-[#71717A]">
              {legalLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:text-[#FAFAFA] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16 flex gap-16">
        {/* Sidebar — page-level TOC injected by each page; this is the nav sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 space-y-px">
            <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-4 px-3">
              Legal
            </p>
            {legalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-3 py-2 rounded-lg text-sm text-[#71717A] hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Footer strip */}
      <footer className="border-t border-white/[0.06] mt-8 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#52525B]">
          &copy; {new Date().getFullYear()} ForjeGames LLC — Dawsen Porter. All rights reserved.
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
