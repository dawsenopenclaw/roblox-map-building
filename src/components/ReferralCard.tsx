'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReferralCardProps {
  /** Override the auto-fetched referral code (useful when parent already has it). */
  referralCode?: string | null
  /** Override stats (useful when parent already fetched them). */
  stats?: { signups: number; tokensEarned: number }
  /** Compact mode hides the stats row and share buttons. */
  compact?: boolean
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

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

function IconLink({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReferralCard({ referralCode: codeProp, stats: statsProp, compact }: ReferralCardProps) {
  const isMobile = useIsMobile()
  const [code, setCode] = useState<string | null>(codeProp ?? null)
  const [signups, setSignups] = useState(statsProp?.signups ?? 0)
  const [tokensEarned, setTokensEarned] = useState(statsProp?.tokensEarned ?? 0)
  const [loading, setLoading] = useState(!codeProp)
  const [linkCopied, setLinkCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  // Check for native share API
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Fetch from API if no props provided
  useEffect(() => {
    if (codeProp !== undefined) return
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((data: { referralCode?: string; signups?: number; tokensEarned?: number }) => {
        setCode(data.referralCode ?? null)
        if (!statsProp) {
          setSignups(data.signups ?? 0)
          setTokensEarned(data.tokensEarned ?? 0)
        }
      })
      .catch(() => { /* API unavailable */ })
      .finally(() => setLoading(false))
  }, [codeProp, statsProp])

  // Sync props
  useEffect(() => {
    if (codeProp !== undefined) setCode(codeProp)
  }, [codeProp])
  useEffect(() => {
    if (statsProp) {
      setSignups(statsProp.signups)
      setTokensEarned(statsProp.tokensEarned)
    }
  }, [statsProp])

  const referralLink = code ? `https://forjegames.com/sign-up?ref=${code}` : null
  const linkDisplay = loading ? 'Generating your link...' : (referralLink ?? 'Not available yet')

  const copyLink = useCallback(async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralLink])

  const copyCode = useCallback(async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [code])

  const nativeShare = useCallback(async () => {
    if (!referralLink) return
    try {
      await navigator.share({
        title: 'ForjeGames — Build Roblox Games with AI',
        text: 'I\'ve been building Roblox games with AI on ForjeGames — try it free with my link and we BOTH get 500 bonus tokens!',
        url: referralLink,
      })
    } catch {
      void copyLink()
    }
  }, [referralLink, copyLink])

  const shareTwitter = useCallback(() => {
    if (!referralLink) return
    const text = encodeURIComponent(
      `I've been building Roblox games with AI on @ForjeGames — type what you want and it builds it in Studio. Try it free: ${referralLink}`,
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
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralLink])

  // Mobile touch target: min 44px
  const btnClass = 'min-h-[44px]'

  return (
    <div className="bg-[#0d0d14] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
      {/* Header with gold accent line */}
      <div className="h-1 bg-gradient-to-r from-[#D4AF37]/60 via-[#D4AF37] to-[#D4AF37]/60" />

      <div className="p-4 sm:p-6">
        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
            <IconGift className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-white font-semibold" style={{ fontSize: 14 }}>Invite Friends, Earn Tokens</h3>
            <p className="text-gray-500" style={{ fontSize: 13 }}>You both get 500 tokens per signup</p>
          </div>
        </div>

        {/* Stats row — stacked on mobile */}
        {!compact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <IconUsers className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-gray-500 uppercase tracking-wider font-medium" style={{ fontSize: 11 }}>Friends Joined</span>
              </div>
              <p className="text-white text-xl font-bold tabular-nums">{loading ? '—' : signups}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <IconGift className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-gray-500 uppercase tracking-wider font-medium" style={{ fontSize: 11 }}>Credits Earned</span>
              </div>
              <p className="text-white text-xl font-bold tabular-nums">{loading ? '—' : tokensEarned.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Native share button — prominent on mobile */}
        {!compact && canNativeShare && (
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

        {/* Referral link */}
        <div className="mb-3">
          <label className="block text-gray-500 uppercase tracking-wider font-medium mb-1.5" style={{ fontSize: 11 }}>
            Your Referral Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-3 text-gray-300 font-mono truncate" style={{ fontSize: 13 }}>
              <IconLink className="w-3 h-3 text-[#D4AF37] inline mr-1.5 -mt-0.5" />
              {linkDisplay}
            </div>
            <button
              onClick={() => void copyLink()}
              disabled={!referralLink}
              className={`${btnClass} inline-flex items-center gap-1.5 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37]/10 px-4 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed font-medium`}
              style={{ fontSize: 13 }}
            >
              {linkCopied
                ? <><IconCheck className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                : <><IconCopy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="mb-4">
          <label className="block text-gray-500 uppercase tracking-wider font-medium mb-1.5" style={{ fontSize: 11 }}>
            Referral Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1c1c1c] border border-[#D4AF37]/20 rounded-xl px-3 py-3 font-mono text-[#D4AF37] font-bold tracking-widest" style={{ fontSize: 14 }}>
              {loading ? '...' : (code ?? 'N/A')}
            </div>
            <button
              onClick={() => void copyCode()}
              disabled={!code}
              className={`${btnClass} inline-flex items-center gap-1.5 border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] px-4 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 13 }}
            >
              {codeCopied
                ? <IconCheck className="w-3.5 h-3.5 text-green-400" />
                : <IconCopy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Share buttons — full-width stacked on mobile */}
        {!compact && (
          <div className={isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
            <button
              onClick={shareTwitter}
              disabled={!referralLink}
              className={`${btnClass} inline-flex items-center justify-center gap-1.5 bg-transparent border border-[#1d9bf0]/30 hover:border-[#1d9bf0]/70 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-4 rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 14 }}
            >
              <IconX /> Share on X
            </button>
            <button
              onClick={() => void shareDiscord()}
              disabled={!referralLink}
              className={`${btnClass} inline-flex items-center justify-center gap-1.5 bg-transparent border border-[#5865f2]/30 hover:border-[#5865f2]/70 text-[#5865f2] hover:bg-[#5865f2]/10 px-4 rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 14 }}
            >
              <IconDiscord /> Copy for Discord
            </button>
            <button
              onClick={() => void copyLink()}
              disabled={!referralLink}
              className={`${btnClass} inline-flex items-center justify-center gap-1.5 bg-transparent border border-white/10 hover:border-[#D4AF37]/40 text-gray-400 hover:text-[#D4AF37] px-4 rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{ fontSize: 14 }}
            >
              <IconLink className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
