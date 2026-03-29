import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Access Restricted — ForjeGames',
  description: 'ForjeGames is not available in your region due to U.S. export control laws.',
}

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* 451 Badge */}
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-sm text-red-400 font-medium mb-8">
          HTTP 451 — Unavailable For Legal Reasons
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          ForjeGames is Not Available in Your Region
        </h1>

        <p className="text-gray-300 leading-relaxed mb-6">
          Access to ForjeGames is restricted in your location due to U.S. federal export control
          laws and economic sanctions programs administered by the U.S. Department of the Treasury
          Office of Foreign Assets Control (OFAC) and the U.S. Department of Commerce Bureau of
          Industry and Security (BIS).
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-medium text-white mb-3">Restricted jurisdictions include:</p>
          <ul className="space-y-1 text-sm text-gray-300">
            {[
              'North Korea (Democratic People\'s Republic of Korea)',
              'Iran (Islamic Republic of Iran)',
              'Syria (Syrian Arab Republic)',
              'Cuba',
              'Crimea region (Ukraine/Russia)',
              'Russia (sanctioned entities and individuals)',
              'Other U.S. comprehensively sanctioned territories',
            ].map((country) => (
              <li key={country} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">—</span>
                <span>{country}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          If you believe you have received this message in error — for example, if you are using a
          VPN that routes traffic through a restricted region — please disable your VPN and try
          again. If the issue persists and you believe your access should not be restricted, contact
          us at{' '}
          <a href="mailto:legal@ForjeGames.gg" className="text-[#FFB81C] hover:underline">
            legal@ForjeGames.gg
          </a>
          .
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Return Home
          </Link>
          <a
            href="mailto:legal@ForjeGames.gg"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 text-[#FFB81C] text-sm font-medium transition-colors"
          >
            Contact Legal
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-8">
          This restriction is imposed by law, not by ForjeGames&apos;s policies. We are required
          by U.S. law to deny service to persons in embargoed countries and to those on U.S.
          government sanctions lists. This page is served in compliance with 50 U.S.C. § 1701 et
          seq. (IEEPA), 22 U.S.C. § 2778 (AECA), and 15 C.F.R. Part 730 et seq. (EAR).
        </p>
      </div>
    </div>
  )
}
