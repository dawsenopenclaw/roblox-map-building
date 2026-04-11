import type { Metadata } from 'next'
import RobloxLinkCard from '@/components/settings/RobloxLinkCard'

export const metadata: Metadata = {
  title: 'Roblox Account — ForjeGames',
  description: 'Link or manage your Roblox account connection with ForjeGames.',
  robots: { index: false, follow: false },
}

export default function RobloxSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Roblox Account</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Link your Roblox account to unlock Robux payments, game sync, and direct asset imports.
        </p>
      </div>

      {/* Main card */}
      <RobloxLinkCard />

      {/* Info section */}
      <div className="mt-6 bg-[#0d0d14] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-sm mb-3">How linking works</h3>
        <ol className="space-y-3">
          {[
            {
              step: '1',
              title: 'Enter your Roblox User ID',
              desc: 'Find it in your Roblox profile URL: roblox.com/users/[ID]/profile',
            },
            {
              step: '2',
              title: 'Add verification code',
              desc: 'Paste the unique code into your Roblox profile "About" section to prove ownership.',
            },
            {
              step: '3',
              title: 'Verify and link',
              desc: 'We\'ll check your profile, then connect your accounts. You can remove the code after linking.',
            },
          ].map(({ step, title, desc }) => (
            <li key={step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#D4AF37] text-xs font-bold">{step}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Privacy note */}
      <p className="text-gray-600 text-xs mt-4 text-center">
        We only access your public Roblox profile information. You can unlink at any time.
      </p>
    </div>
  )
}
