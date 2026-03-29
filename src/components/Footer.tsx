import Link from 'next/link'

const CURRENT_YEAR = new Date().getFullYear()

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/acceptable-use', label: 'Acceptable Use' },
]

const productLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/marketplace', label: 'Marketplace' },
]

const companyLinks = [
  { href: 'mailto:support@robloxforge.gg', label: 'Support' },
  { href: 'mailto:legal@robloxforge.gg', label: 'Legal' },
  { href: 'mailto:abuse@robloxforge.gg', label: 'Report Abuse' },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-[#FFB81C] font-bold text-lg tracking-tight">
              RobloxForge
            </Link>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              AI-powered Roblox game development. Build faster.
            </p>
            <p className="text-gray-600 text-xs mt-3">
              10% of revenue donated to charity.
              <br />
              <span className="text-gray-700">
                (Not tax-deductible for customers. See{' '}
                <Link href="/terms#charity" className="hover:text-gray-500 transition-colors">
                  Terms §12
                </Link>
                .)
              </span>
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" id="footer-product">
              Product
            </p>
            <ul className="space-y-2" aria-labelledby="footer-product">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" id="footer-legal">
              Legal
            </p>
            <ul className="space-y-2" aria-labelledby="footer-legal">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" id="footer-company">
              Company
            </p>
            <ul className="space-y-2" aria-labelledby="footer-company">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            &copy; {CURRENT_YEAR} RobloxForge LLC — Dawsen Porter. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-700">
              Not affiliated with Roblox Corporation.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
