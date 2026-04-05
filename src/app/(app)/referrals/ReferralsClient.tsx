'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralsClient() {
  const { isLoaded } = useUser()

  const [stats, setStats]             = useState<ReferralStats | null>(null)
  const [referrals, setReferrals]     = useState<ReferralRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [linkCopied, setLinkCopied]       = useState(false)
  const [codeCopied, setCodeCopied]       = useState(false)
  const [discordCopied, setDiscordCopied] = useState(false)

  // Referral code is fetched from the server — never derived client-side.
  const referralCode = stats?.referralCode ?? '...'
  const referralLink = stats?.referralCode
    ? `https://forjegames.com/sign-up?ref=${stats.referralCode}`
    : 'https://forjegames.com/sign-up?ref=...'

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(
      `Building Roblox maps with AI on @ForjeGames — sign up free!\n\nUse my link and we both get 500 bonus tokens: ${referralLink}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const shareDiscord = async () => {
    const msg =
      `Hey! I've been using ForjeGames to build Roblox maps with AI.\n` +
      `Sign up free with my link and we BOTH get 500 bonus tokens: ${referralLink}`
    try {
      await navigator.clipboard.writeText(msg)
      setDiscordCopied(true)
      setTimeout(() => setDiscordCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }

  const STAT_CARDS = [
    {
      label: 'Invites Sent',
      value: dataLoading ? '—' : String(stats?.invitesSent ?? 0),
      sub: 'Links shared',
      icon: <IconLink className="w-3.5 h-3.5" />,
      color: '#D4AF37',
    },
    {
      label: 'Signups',
      value: dataLoading ? '—' : String(stats?.signups ?? 0),
      sub: 'Friends joined',
      icon: <IconUsers className="w-3.5 h-3.5" />,
      color: '#60a5fa',
    },
    {
      label: 'Tokens Earned',
      value: dataLoading ? '—' : (stats?.tokensEarned ?? 0).toLocaleString(),
      sub: '500 tokens / signup',
      icon: <IconGift className="w-3.5 h-3.5" />,
      color: '#34d399',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Referrals</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Share your link to earn tokens when friends sign up.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="bg-[#0d0d14] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15`, color: stat.color, border: `1px solid ${stat.color}25` }}
              >
                {stat.icon}
              </div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{stat.label}</p>
            </div>
            <p className="text-white text-2xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-5 mb-6">
        <p className="text-[#D4AF37] font-semibold text-sm mb-4 flex items-center gap-2">
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
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#D4AF37] text-xs font-bold">{step}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share section */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Your Referral Link</p>

        {/* Shareable link */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Shareable Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm font-mono truncate">
              {referralLink}
            </div>
            <button
              onClick={() => void copyLink()}
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {linkCopied
                ? <IconCheck className="w-3.5 h-3.5 text-green-400" />
                : <IconCopy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1.5">Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 font-mono text-[#D4AF37] text-sm font-bold tracking-widest">
              {referralCode}
            </div>
            <button
              onClick={() => void copyCode()}
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {codeCopied
                ? <IconCheck className="w-3.5 h-3.5 text-green-400" />
                : <IconCopy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{codeCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareTwitter}
            className="inline-flex items-center gap-2 text-sm bg-transparent border border-[#1d9bf0]/30 hover:border-[#1d9bf0]/70 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            <IconX />
            Share on X
          </button>
          <button
            onClick={() => void shareDiscord()}
            className="inline-flex items-center gap-2 text-sm bg-transparent border border-[#5865f2]/30 hover:border-[#5865f2]/70 text-[#5865f2] hover:bg-[#5865f2]/10 px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            <IconDiscord />
            Copy for Discord
          </button>
        </div>
        {discordCopied && (
          <p className="text-green-400 text-xs mt-2.5 flex items-center gap-1.5">
            <IconCheck className="w-3 h-3" />
            Copied! Paste it into Discord.
          </p>
        )}
      </div>

      {/* Referrals table */}
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Your Referrals</p>

        {!dataLoading && referrals.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <IconUsers className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm">No referrals yet.</p>
            <p className="text-gray-600 text-xs mt-1">Share your link to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-400 font-medium pb-3">User</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-3">Joined</th>
                  <th className="text-right text-xs text-gray-400 font-medium pb-3">Tokens</th>
                  <th className="text-right text-xs text-gray-400 font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referrals.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-white font-medium text-sm">@{row.user}</td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{row.joinedAt}</td>
                    <td className="py-3 text-right tabular-nums">
                      {row.tokensAwarded > 0 ? (
                        <span className="text-[#D4AF37] font-semibold text-sm">+{row.tokensAwarded}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          row.status === 'Signed Up'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
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
