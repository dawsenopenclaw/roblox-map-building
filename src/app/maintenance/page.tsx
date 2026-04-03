import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Maintenance — ForjeGames',
  description: 'ForjeGames is temporarily down for scheduled maintenance.',
}

export default function MaintenancePage() {
  const estimatedReturn = process.env.MAINTENANCE_UNTIL ?? null
  const statusPageUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? 'https://status.forjegames.gg'
  const twitterUrl = 'https://twitter.com/ForjeGames'
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL ?? 'https://discord.gg/forjegames'

  let formattedReturn: string | null = null
  if (estimatedReturn) {
    try {
      formattedReturn = new Date(estimatedReturn).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    } catch {
      // ignore invalid date strings
    }
  }

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[550px] h-[550px] rounded-full bg-[#7C3AED]/8 blur-[130px]" />
      </div>

      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(90deg, #7C3AED 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-lg w-full text-center">
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Animated icon */}
          <div
            className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center"
            style={{ animation: 'spin 8s linear infinite', animationTimingFunction: 'steps(24, end)' }}
          >
            <div style={{ animation: 'none' }}>
              <svg
                className="w-9 h-9 text-[#7C3AED]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
            <span className="text-[#7C3AED] text-xs font-semibold uppercase tracking-wider">Scheduled Maintenance</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            We&apos;re making things better
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-7">
            ForjeGames is undergoing scheduled maintenance. We&apos;ll be back shortly —
            no data has been lost and your projects are safe.
          </p>

          {/* ETA card */}
          {formattedReturn ? (
            <div className="bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded-xl px-5 py-4 mb-8">
              <p className="text-xs text-[#7C3AED] uppercase tracking-wider font-medium mb-1">
                Estimated return
              </p>
              <p className="text-white font-semibold text-lg">{formattedReturn}</p>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4 mb-8">
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4 text-[#7C3AED] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Expected back within the next few hours
              </div>
            </div>
          )}

          {/* Status page CTA */}
          <div className="border-t border-white/[0.07] pt-7 mb-7">
            <p className="text-gray-400 text-sm mb-5">
              Subscribe to our status page for real-time updates and incident notifications.
            </p>
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/25 hover:shadow-[#7C3AED]/40 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Subscribe to updates
            </a>
          </div>

          {/* Social links */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Follow for live updates</p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </a>
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#5865F2]/30 hover:border-[#5865F2]/60 text-[#5865F2] text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </a>
            </div>
          </div>

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#FFB81C] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}
