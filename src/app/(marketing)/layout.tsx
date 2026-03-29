import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Minimal nav */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="font-bold text-lg tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded"
          aria-label="ForjeGames home"
        >
          <span style={{ color: '#FFB81C' }}>Forje</span>
          <span className="text-white">Games</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] rounded px-2 py-1"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
          >
            Try Free
          </Link>
        </div>
      </nav>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  )
}
