'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useIsMobile } from '@/hooks/useMediaQuery'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralStats = {
  invitesSent: number
  signups: number
  tokensEarned: number
  referralCode?: string
  demo: boolean
}

type ReferralRow = {
  id: string
  user: string
  joinedAt: string
  status: 'Signed Up' | 'Pending'
  tokensAwarded: number
}


// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconLink({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function IconUsers({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8zm2 10v-2a4 4 0 00-3-3.87" />
    </svg>
  )
}

function IconGift({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7m0 0a2 2 0 00-2-2 2 2 0 000 4m2-4a2 2 0 012-2 2 2 0 010 4" />
    </svg>
  )
}

function IconCopy({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconZap({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

// X (Twitter) wordmark-style icon
function IconX({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconDiscord({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
    </svg>
  )
}

function IconShare({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralsClient() {
  const { isLoaded } = useUser()
  const isMobile = useIsMobile()

  const [stats, setStats]             = useState<ReferralStats | null>(null)
  const [referrals, setReferrals]     = useState<ReferralRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [linkCopied, setLinkCopied]       = useState(false)
  const [codeCopied, setCodeCopied]       = useState(false)
  const [discordCopied, setDiscordCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // Check for native share API (iOS Safari, Android Chrome)
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Referral code is fetched from the server — never derived client-side.
  // null means the DB is unavailable; undefined means still loading.
  const referralCode = stats?.referralCode ?? null
  const referralCodeDisplay = dataLoading ? '...' : (referralCode ?? 'Not available yet')
  const referralLink = referralCode
    ? `https://forjegames.com/sign-up?ref=${referralCode}`
    : null
  const referralLinkDisplay = dataLoading
    ? 'https://forjegames.com/sign-up?ref=...'
    : (referralLink ?? 'Your referral link will appear here once your account is set up.')

  useEffect(() => {
    if (!isLoaded) return
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((data: ReferralStats & { referrals?: ReferralRow[] }) => {
        setStats({
          invitesSent: data.invitesSent,
          signups: data.signups,
          tokensEarned: data.tokensEarned,
          referralCode: data.referralCode,
          demo: data.demo,
        })
        setReferrals(data.referrals ?? [])
      })
      .catch(() => {
        // API unavailable — leave stats null, show empty state
      })
      .finally(() => setDataLoading(false))
  }, [isLoaded])

  const copyLink = useCallback(async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralLink])

  const copyCode = useCallback(async () => {
    if (!referralCode) return
    try {
      await navigator.clipboard.writeText(referralCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralCode])

  const nativeShare = useCallback(async () => {
    if (!referralLink) return
    try {
      await navigator.share({
        title: 'ForjeGames — Build Roblox Games with AI',
        text: 'I\'ve been building Roblox games with AI on ForjeGames — type what you want and it builds it in Studio. Try it free with my link and we BOTH get 500 bonus tokens!',
        url: referralLink,
      })
    } catch {
      // User cancelled or share failed — fall back to copy
      void copyLink()
    }
  }, [referralLink, copyLink])

  const shareTwitter = useCallback(() => {
    if (!referralLink) return
    const text = encodeURIComponent(
      `I've been building Roblox games with AI on @ForjeGames — type what you want and it builds it in Studio. Try it free: ${referralLink}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
  }, [referralLink])

  const shareDiscord = useCallback(async () => {
    if (!referralLink) return
    const msg =
      `I've been building Roblox games with AI on ForjeGames — type what you want and it builds it in Studio.\n` +
      `Sign up free with my link and we BOTH get 500 bonus tokens: ${referralLink}`
    try {
      await navigator.clipboard.writeText(msg)
      setDiscordCopied(true)
      setTimeout(() => setDiscordCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralLink])

  const STAT_CARDS = [
    {
      label: 'Invites Sent',
      value: dataLoading ? '—' : String(stats?.invitesSent ?? 0),
      sub: 'Links shared',
      icon: <IconLink className="w-4 h-4" />,
      color: '#D4AF37',
    },
    {
      label: 'Signups',
      value: dataLoading ? '—' : String(stats?.signups ?? 0),
      sub: 'Friends joined',
      icon: <IconUsers className="w-4 h-4" />,
      color: '#60a5fa',
    },
    {
      label: 'Tokens Earned',
      value: dataLoading ? '—' : (stats?.tokensEarned ?? 0).toLocaleString(),
      sub: '500 tokens / signup',
      icon: <IconGift className="w-4 h-4" />,
      color: '#34d399',
    },
  ]

  // Mobile touch target: min 44px height
  const btnClass = 'min-h-[44px]'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[env(safe-area-inset-bottom,16px)]">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Referrals</h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: isMobile ? 14 : 14 }}>
          Share your link to earn tokens when friends sign up.
        </p>
      </div>

      {/* Stats — stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 sm:p-5 hover:border-white/20 transition-colors duration-200">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15`, color: stat.color, border: `1px solid ${stat.color}25` }}
              >
                {stat.icon}
              </div>
              <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 12 }}>{stat.label}</p>
            </div>
            <p className="text-white text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-gray-500 mt-1" style={{ fontSize: 13 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Reward callout */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-4 flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
          <IconGift className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="text-green-400 font-semibold" style={{ fontSize: 14 }}>Both you and your friend get 500 bonus tokens</p>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: 13 }}>Credits are awarded instantly when your friend signs up using your referral link or code.</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 sm:p-5 mb-6">
        <p className="text-[#D4AF37] font-semibold mb-3 sm:mb-4 flex items-center gap-2" style={{ fontSize: 14 }}>
          <IconZap />
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your link',     desc: 'Send your unique link or code to a friend.' },
            { step: '2', title: 'Friend signs up',     desc: 'They create a free ForjeGames account using your link.' },
            { step: '3', title: 'Both get 500 tokens', desc: 'You and your friend each receive 500 tokens instantly.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#D4AF37] font-bold" style={{ fontSize: 12 }}>{step}</span>
              </div>
              <div>
                <p className="text-white font-medium" style={{ fontSize: 14 }}>{title}</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: 13 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share section */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
        <p className="font-semibold text-gray-400 uppercase tracking-wider mb-4 sm:mb-5" style={{ fontSize: 12 }}>Your Referral Link</p>

        {/* Native share button — prominent on mobile */}
        {canNativeShare && (
          <button
            onClick={() => void nativeShare()}
            disabled={!referralLink}
            className={`${btnClass} w-full flex items-center justify-center gap-2 font-bold text-black rounded-xl mb-4 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{
              fontSize: 15,
              background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
              boxShadow: '0 0 20px rgba(212,175,55,0.25)',
              padding: '12px 16px',
            }}
          >
            <IconShare className="w-5 h-5" />
            Share Your Link
          </button>
        )}

        {/* Shareable link */}
        <div className="mb-4">
          <label className="block text-gray-500 mb-1.5" style={{ fontSize: 12 }}>Shareable Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-gray-300 font-mono truncate" style={{ fontSize: 13 }}>
              {referralLinkDisplay}
            </div>
            <button
              onClick={() => void copyLink()}
              disabled={!referralLink}
              className={`${btnClass} inline-flex items-center gap-1.5 border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-4 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 14 }}
            >
              {linkCopied
                ? <IconCheck className="w-4 h-4 text-green-400" />
                : <IconCopy className="w-4 h-4" />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="mb-5">
          <label className="block text-gray-500 mb-1.5" style={{ fontSize: 12 }}>Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-3 sm:px-4 py-3 font-mono text-[#D4AF37] font-bold tracking-widest" style={{ fontSize: 14 }}>
              {referralCodeDisplay}
            </div>
            <button
              onClick={() => void copyCode()}
              disabled={!referralCode}
              className={`${btnClass} inline-flex items-center gap-1.5 border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-4 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 14 }}
            >
              {codeCopied
                ? <IconCheck className="w-4 h-4 text-green-400" />
                : <IconCopy className="w-4 h-4" />}
              <span className="hidden sm:inline">{codeCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons — full width on mobile, flex row on desktop */}
        <div className={isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
          <button
            onClick={shareTwitter}
            disabled={!referralLink}
            className={`${btnClass} inline-flex items-center justify-center gap-2 bg-transparent border border-[#1d9bf0]/30 hover:border-[#1d9bf0]/70 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-4 rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{ fontSize: 14 }}
          >
            <IconX />
            Share on X
          </button>
          <button
            onClick={() => void shareDiscord()}
            disabled={!referralLink}
            className={`${btnClass} inline-flex items-center justify-center gap-2 bg-transparent border border-[#5865f2]/30 hover:border-[#5865f2]/70 text-[#5865f2] hover:bg-[#5865f2]/10 px-4 rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{ fontSize: 14 }}
          >
            <IconDiscord />
            Copy for Discord
          </button>
        </div>
        {discordCopied && (
          <p className="text-green-400 mt-2.5 flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <IconCheck className="w-3.5 h-3.5" />
            Copied! Paste it into Discord.
          </p>
        )}
      </div>

      {/* Referrals list — card layout on mobile, table on desktop */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-4 sm:p-6">
        <p className="font-semibold text-gray-400 uppercase tracking-wider mb-4 sm:mb-5" style={{ fontSize: 12 }}>Your Referrals</p>

        {!dataLoading && referrals.length === 0 ? (
          <div className="py-8 sm:py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <IconUsers className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-gray-400" style={{ fontSize: 14 }}>No referrals yet.</p>
            <p className="text-gray-600 mt-1" style={{ fontSize: 13 }}>Share your link to get started.</p>
          </div>
        ) : isMobile ? (
          /* Mobile: card-based layout — no horizontal scroll */
          <div className="space-y-3">
            {referrals.map((row) => (
              <div key={row.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium" style={{ fontSize: 14 }}>@{row.user}</span>
                  <span
                    className={`font-medium px-2.5 py-1 rounded-full border ${
                      row.status === 'Signed Up'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-white/5 text-gray-400 border-white/10'
                    }`}
                    style={{ fontSize: 12 }}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400" style={{ fontSize: 13 }}>{row.joinedAt}</span>
                  {row.tokensAwarded > 0 ? (
                    <span className="text-[#D4AF37] font-semibold" style={{ fontSize: 14 }}>+{row.tokensAwarded} tokens</span>
                  ) : (
                    <span className="text-gray-500" style={{ fontSize: 14 }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: table layout */
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[360px]" style={{ fontSize: 14 }}>
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 font-medium pb-3" style={{ fontSize: 12 }}>User</th>
                  <th className="text-left text-gray-400 font-medium pb-3" style={{ fontSize: 12 }}>Joined</th>
                  <th className="text-right text-gray-400 font-medium pb-3" style={{ fontSize: 12 }}>Tokens</th>
                  <th className="text-right text-gray-400 font-medium pb-3" style={{ fontSize: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referrals.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-white font-medium">@{row.user}</td>
                    <td className="py-3.5 text-gray-400 whitespace-nowrap" style={{ fontSize: 13 }}>{row.joinedAt}</td>
                    <td className="py-3.5 text-right tabular-nums">
                      {row.tokensAwarded > 0 ? (
                        <span className="text-[#D4AF37] font-semibold">+{row.tokensAwarded}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`font-medium px-2 py-0.5 rounded-full border ${
                          row.status === 'Signed Up'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                        style={{ fontSize: 12 }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
