import { Footer } from '@/components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Marketing nav */}
      <nav className="border-b border-white/10 bg-[#0A0E27]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-[#FFB81C] font-bold text-xl tracking-tight">
            RobloxForge
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Start Free
            </a>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
