import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maintenance — RobloxForge',
  description: 'RobloxForge is temporarily down for scheduled maintenance.',
}

// Wrench SVG — no lucide import needed, server component stays lightweight
function WrenchIcon() {
  return (
    <svg
      className="w-9 h-9 text-[#FFB81C]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

export default function MaintenancePage() {
  // Values would normally be sourced from env or a status API.
  // Providing sensible defaults so the page renders standalone.
  const estimatedReturn = process.env.MAINTENANCE_UNTIL ?? null
  const statusPageUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? 'https://status.robloxforge.gg'
  const twitterUrl = 'https://twitter.com/RobloxForge'
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL ?? 'https://discord.gg/robloxforge'

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
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-10 shadow-2xl">

          {/* Animated icon wrapper */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center animate-[spin_8s_linear_infinite]"
            style={{ animationTimingFunction: 'steps(24, end)' }}
          >
            <div style={{ animation: 'none' }}>
              <WrenchIcon />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            We&apos;re making things better
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            RobloxForge is down for scheduled maintenance. We&apos;ll be back shortly —
            no data has been lost and your projects are safe.
          </p>

          {/* ETA card */}
          {formattedReturn ? (
            <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-xl px-5 py-4 mb-8">
              <p className="text-xs text-[#FFB81C] uppercase tracking-wider font-medium mb-1">
                Estimated return
              </p>
              <p className="text-white font-semibold">{formattedReturn}</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-8">
              <p className="text-gray-400 text-sm">
                We expect to be back within the next few hours. Thank you for your patience.
              </p>
            </div>
          )}

          {/* Status page subscribe */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our status page for real-time updates and incident notifications.
            </p>
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm transition-colors"
            >
              {/* Bell icon */}
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white text-sm font-medium transition-colors"
              >
                {/* X / Twitter icon */}
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
                {/* Discord icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
