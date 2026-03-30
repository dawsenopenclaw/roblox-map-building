'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Users, Copy, Check, Gift, Link2, Twitter, MessageCircle, Zap } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCode(userId: string): string {
  // Deterministic 4-digit suffix from clerkId — stable across sessions
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return `FG-${(hash % 9000 + 1000).toString()}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralStats = {
  invitesSent: number
  signups: number
  tokensEarned: number
  demo: boolean
}

type ReferralRow = {
  id: string
  user: string
  joinedAt: string
  status: 'Signed Up' | 'Pending'
  tokensAwarded: number
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_REFERRALS: ReferralRow[] = [
  { id: 'r1', user: 'alex_builds',    joinedAt: 'Mar 20, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r2', user: 'gamesdev99',     joinedAt: 'Mar 14, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r3', user: 'robloxstudio_x', joinedAt: 'Feb 28, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r4', user: 'mapmaker_z',     joinedAt: 'Feb 10, 2026', status: 'Pending',   tokensAwarded: 0   },
  { id: 'r5', user: 'studio_pro7',    joinedAt: 'Jan 22, 2026', status: 'Signed Up', tokensAwarded: 500 },
]

const DEMO_STATS: ReferralStats = {
  invitesSent:  5,
  signups:      4,
  tokensEarned: 2000,
  demo:         true,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralsClient() {
  const { user, isLoaded } = useUser()

  const [stats, setStats]             = useState<ReferralStats | null>(null)
  const [referrals, setReferrals]     = useState<ReferralRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [linkCopied, setLinkCopied]   = useState(false)
  const [codeCopied, setCodeCopied]   = useState(false)

  // Derive stable referral code + canonical link from Clerk user id
  const referralCode = isLoaded && user ? deriveCode(user.id) : '...'
  const referralLink = isLoaded && user
    ? `https://forjegames.com/sign-up?ref=${deriveCode(user.id)}`
    : 'https://forjegames.com/sign-up?ref=...'

  useEffect(() => {
    if (!isLoaded) return
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((data: ReferralStats & { referrals?: ReferralRow[] }) => {
        setStats({ invitesSent: data.invitesSent, signups: data.signups, tokensEarned: data.tokensEarned, demo: data.demo })
        setReferrals(data.referrals ?? DEMO_REFERRALS)
      })
      .catch(() => {
        setStats(DEMO_STATS)
        setReferrals(DEMO_REFERRALS)
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
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }

  const STAT_CARDS = [
    {
      label: 'Invites Sent',
      value: dataLoading ? '—' : String(stats?.invitesSent ?? 0),
      sub: 'Links shared',
      icon: Link2,
      color: '#FFB81C',
    },
    {
      label: 'Signups',
      value: dataLoading ? '—' : String(stats?.signups ?? 0),
      sub: 'Friends joined',
      icon: Users,
      color: '#60a5fa',
    },
    {
      label: 'Tokens Earned',
      value: dataLoading ? '—' : (stats?.tokensEarned ?? 0).toLocaleString(),
      sub: '500 tokens / signup',
      icon: Gift,
      color: '#34d399',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Referrals</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Share ForjeGames with friends — you both get{' '}
          <span className="text-[#FFB81C] font-semibold">500 free tokens</span> when they sign up.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#141414] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                <p className="text-gray-400 text-xs">{stat.label}</p>
              </div>
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* How it works */}
      <div className="bg-[#FFB81C]/5 border border-[#FFB81C]/20 rounded-xl p-5 mb-6">
        <p className="text-[#FFB81C] font-semibold text-sm mb-4 flex items-center gap-2">
          <Zap size={13} />
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your link',     desc: 'Send your unique link or code to a friend.' },
            { step: '2', title: 'Friend signs up',     desc: 'They create a free ForjeGames account using your link.' },
            { step: '3', title: 'Both get 500 tokens', desc: 'You and your friend each receive 500 tokens instantly.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FFB81C]/20 border border-[#FFB81C]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FFB81C] text-xs font-bold">{step}</span>
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
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6 mb-6">
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
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-[#FFB81C]/40 text-gray-300 hover:text-[#FFB81C] px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {linkCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1.5">Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 font-mono text-[#FFB81C] text-sm font-bold tracking-widest">
              {referralCode}
            </div>
            <button
              onClick={() => void copyCode()}
              className="inline-flex items-center gap-1.5 text-sm border border-white/10 hover:border-[#FFB81C]/40 text-gray-300 hover:text-[#FFB81C] px-3 py-3 rounded-xl transition-colors flex-shrink-0"
            >
              {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
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
            <Twitter size={14} />
            Share on X
          </button>
          <button
            onClick={() => void shareDiscord()}
            className="inline-flex items-center gap-2 text-sm bg-transparent border border-[#5865f2]/30 hover:border-[#5865f2]/70 text-[#5865f2] hover:bg-[#5865f2]/10 px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            <MessageCircle size={14} />
            Copy for Discord
          </button>
        </div>
        {linkCopied && (
          <p className="text-green-400 text-xs mt-2.5">Copied! Paste it into Discord.</p>
        )}
      </div>

      {/* Referrals table */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Your Referrals</p>

        {!dataLoading && referrals.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No referrals yet. Share your link to get started.</p>
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
                {(dataLoading ? DEMO_REFERRALS : referrals).map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-white font-medium text-sm">@{row.user}</td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{row.joinedAt}</td>
                    <td className="py-3 text-right tabular-nums">
                      {row.tokensAwarded > 0 ? (
                        <span className="text-[#FFB81C] font-semibold text-sm">+{row.tokensAwarded}</span>
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

        {stats?.demo && !dataLoading && (
          <p className="text-gray-600 text-xs mt-4 text-center">
            Demo data — connect your database to see live referrals.
          </p>
        )}
      </div>
    </div>
  )
}
