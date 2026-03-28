import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-10">
          {/* 404 display */}
          <p className="text-8xl font-bold text-[#FFB81C]/20 font-mono mb-2">404</p>
          <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            This page doesn't exist or may have been moved.
            Don't worry — your projects are safe.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/dashboard"
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Back to Home
            </Link>
          </div>

          {/* Quick nav */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Quick links</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: '/voice', label: 'Voice Build' },
                { href: '/image-to-map', label: 'Image to Map' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/settings', label: 'Settings' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-[#FFB81C] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
