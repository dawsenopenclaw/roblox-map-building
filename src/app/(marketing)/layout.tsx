import Link from 'next/link'
import { Footer } from '@/components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Nav */}
      <nav
        className="border-b border-white/8 bg-[#0A0E27]/90 backdrop-blur-md sticky top-0 z-50"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo + links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-bold text-xl tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
              aria-label="ForjeGames home"
            >
              <span style={{ color: '#FFB81C' }}>Forje</span>
              <span className="text-white">Games</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
              >
                Docs
              </Link>
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  )
}
