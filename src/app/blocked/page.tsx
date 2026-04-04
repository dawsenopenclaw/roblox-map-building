import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Access Restricted — ForjeGames',
  description: 'ForjeGames is not available in your region due to U.S. export control laws.',
}

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-6 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#f87171]/7 blur-[120px]" />
      </div>

      <div className="relative max-w-lg w-full text-center">

        {/* 451 Badge */}
        <div className="inline-flex items-center gap-2 bg-[#f87171]/10 border border-[#f87171]/20 rounded-full px-4 py-2 text-xs text-[#f87171] font-semibold uppercase tracking-wider mb-8">
          HTTP 451 — Unavailable For Legal Reasons
        </div>

        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#f87171]/10 animate-ping" style={{ animationDuration: '3.5s' }} />
            <div className="relative w-20 h-20 rounded-full bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-[#f87171]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Access Restricted</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-7">
            Access to ForjeGames is restricted in your location due to U.S. federal export control
            laws and economic sanctions programs administered by OFAC and BIS.
          </p>

          {/* Jurisdiction list */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 text-left mb-7">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Restricted jurisdictions include</p>
            <ul className="space-y-1.5 text-sm text-gray-400">
              {[
                "North Korea (Democratic People's Republic of Korea)",
                'Iran (Islamic Republic of Iran)',
                'Syria (Syrian Arab Republic)',
                'Cuba',
                'Crimea region (Ukraine/Russia)',
                'Russia (sanctioned entities and individuals)',
                'Other U.S. comprehensively sanctioned territories',
              ].map((country) => (
                <li key={country} className="flex items-start gap-2">
                  <span className="text-[#f87171] mt-0.5 shrink-0">—</span>
                  <span>{country}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed mb-7">
            If you believe you received this message in error — for example, if you are using a VPN
            routing through a restricted region — disable your VPN and try again. If the issue
            persists contact us at{' '}
            <a href="mailto:support@forjegames.com" className="text-[#D4AF37] hover:underline">
              support@forjegames.com
            </a>
            .
          </p>

          <a
            href="mailto:support@forjegames.com"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#f87171]/20 hover:shadow-[#f87171]/30 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }}
          >
            Contact Legal
          </a>

          <p className="text-xs text-gray-600 mt-8 leading-relaxed">
            This restriction is imposed by law, not by ForjeGames policy. Served in compliance with
            50 U.S.C. § 1701 et seq. (IEEPA), 22 U.S.C. § 2778 (AECA), and 15 C.F.R. Part 730
            et seq. (EAR).
          </p>
        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}
