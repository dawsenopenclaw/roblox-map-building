import { Footer } from '@/components/Footer'
import { NavLogo } from '@/components/NavLogo'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Marketing nav */}
      <nav className="border-b border-white/10 bg-[#0A0E27]/80 backdrop-blur-sm sticky top-0 z-50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <NavLogo />
          <div className="hidden md:flex items-center gap-6">
            <a href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded">Pricing</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
            >
              Start Free
            </a>
          </div>
        </div>
      </nav>
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
