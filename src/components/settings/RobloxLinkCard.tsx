'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

type RobloxProfile = {
  robloxUserId: string | null
  robloxUsername: string | null
  robloxDisplayName: string | null
  robloxAvatarUrl: string | null
  robloxVerifiedAt: string | null
}

type LinkState = 'idle' | 'input' | 'verifying' | 'linking' | 'unlinking'

// ─── Icons ────────────────────────────────────────────────────────────────────

function RobloxIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M5.04 3L3 18.96 18.96 21 21 5.04 5.04 3zm10.2 11.4l-4.56-.6-.6 4.56-2.52-.36.6-4.56-4.56-.6.36-2.52 4.56.6.6-4.56 2.52.36-.6 4.56 4.56.6-.36 2.52z" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function LinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: '💰', title: 'Unlock Robux payments', desc: 'Accept Robux as payment for your templates and services.' },
  { icon: '🎮', title: 'Sync your game list', desc: 'Import your published games and manage them from ForjeGames.' },
  { icon: '📦', title: 'Import assets directly', desc: 'Pull meshes, textures, and models from your Roblox inventory.' },
  { icon: '🔑', title: 'Verified creator badge', desc: 'Show visitors your linked Roblox identity for trust.' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function RobloxLinkCard() {
  const [profile, setProfile] = useState<RobloxProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<LinkState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Input fields
  const [robloxUserId, setRobloxUserId] = useState('')
  const [robloxUsername, setRobloxUsername] = useState('')
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  // Fetch current linked profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/roblox/link')
      if (res.ok) {
        const data = await res.json()
        setProfile({
          robloxUserId: data.robloxUserId ?? null,
          robloxUsername: data.robloxUsername ?? null,
          robloxDisplayName: data.robloxDisplayName ?? null,
          robloxAvatarUrl: data.robloxAvatarUrl ?? null,
          robloxVerifiedAt: data.robloxVerifiedAt ?? null,
        })
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const isLinked = !!profile?.robloxUserId

  // ─── Verify ──────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!robloxUserId.trim()) {
      setError('Please enter your Roblox user ID.')
      return
    }

    setError(null)
    setState('verifying')

    try {
      const res = await fetch('/api/roblox/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUserId: robloxUserId.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Verification failed.')
        setState('input')
        return
      }

      setVerificationCode(data.verificationCode)
      setRobloxUsername(data.robloxUsername ?? '')

      if (data.verified) {
        setVerified(true)
      }

      setState('input')
    } catch {
      setError('Network error. Please try again.')
      setState('input')
    }
  }

  // ─── Link ────────────────────────────────────────────────────────────────

  const handleLink = async () => {
    if (!verificationCode || !robloxUserId.trim()) return

    setError(null)
    setState('linking')

    try {
      const res = await fetch('/api/roblox/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robloxUserId: robloxUserId.trim(),
          robloxUsername: robloxUsername.trim(),
          verificationCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to link account.')
        setState('input')
        return
      }

      setProfile({
        robloxUserId: data.robloxUserId,
        robloxUsername: data.robloxUsername,
        robloxDisplayName: data.robloxDisplayName,
        robloxAvatarUrl: data.robloxAvatarUrl,
        robloxVerifiedAt: new Date().toISOString(),
      })
      setState('idle')
      setRobloxUserId('')
      setRobloxUsername('')
      setVerificationCode(null)
      setVerified(false)
    } catch {
      setError('Network error. Please try again.')
      setState('input')
    }
  }

  // ─── Unlink ──────────────────────────────────────────────────────────────

  const handleUnlink = async () => {
    setState('unlinking')
    setError(null)

    try {
      const res = await fetch('/api/roblox/link', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to unlink.')
        setState('idle')
        return
      }

      setProfile({
        robloxUserId: null,
        robloxUsername: null,
        robloxDisplayName: null,
        robloxAvatarUrl: null,
        robloxVerifiedAt: null,
      })
      setState('idle')
    } catch {
      setError('Network error. Please try again.')
      setState('idle')
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-48 mb-4" />
        <div className="h-4 bg-white/5 rounded w-64" />
      </div>
    )
  }

  // ─── Linked state ────────────────────────────────────────────────────────

  if (isLinked && profile) {
    const linkedDate = profile.robloxVerifiedAt
      ? new Date(profile.robloxVerifiedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null

    return (
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <RobloxIcon className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-white font-semibold text-sm">Roblox Account</h3>
          <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Linked
          </span>
        </div>

        <div className="flex items-center gap-4 bg-[#111113] border border-white/[0.06] rounded-xl p-4 mb-4">
          {profile.robloxAvatarUrl ? (
            <Image
              src={profile.robloxAvatarUrl}
              alt={profile.robloxUsername ?? 'Roblox avatar'}
              width={48}
              height={48}
              className="rounded-xl"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <RobloxIcon className="w-6 h-6 text-red-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {profile.robloxDisplayName ?? profile.robloxUsername}
            </p>
            <p className="text-gray-400 text-xs truncate">
              @{profile.robloxUsername}
              {profile.robloxUserId && (
                <span className="text-gray-600"> · ID: {profile.robloxUserId}</span>
              )}
            </p>
            {linkedDate && (
              <p className="text-gray-500 text-xs mt-0.5">Linked since {linkedDate}</p>
            )}
          </div>
          <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        <button
          onClick={() => void handleUnlink()}
          disabled={state === 'unlinking'}
          className="text-xs border border-white/20 hover:border-red-500/30 hover:text-red-400 text-gray-400 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {state === 'unlinking' ? 'Unlinking...' : 'Unlink Roblox Account'}
        </button>
      </div>
    )
  }

  // ─── Not linked state ────────────────────────────────────────────────────

  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
          <RobloxIcon className="w-4 h-4 text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-sm">Roblox Account</h3>
      </div>

      {/* Benefits */}
      {state === 'idle' && (
        <>
          <p className="text-gray-400 text-sm mb-4">
            Link your Roblox account to unlock powerful integrations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex gap-3 bg-[#111113] border border-white/[0.06] rounded-xl p-3"
              >
                <span className="text-lg flex-shrink-0">{b.icon}</span>
                <div>
                  <p className="text-white text-xs font-medium">{b.title}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setState('input')}
            className="inline-flex items-center gap-2 text-sm bg-[#D4AF37] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link Roblox Account
          </button>
        </>
      )}

      {/* Verification flow */}
      {state !== 'idle' && (
        <div className="space-y-4">
          {/* Step 1: Enter Roblox User ID */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Roblox User ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={robloxUserId}
                onChange={(e) => setRobloxUserId(e.target.value)}
                placeholder="e.g. 123456789"
                maxLength={20}
                className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
              />
              <button
                onClick={() => void handleVerify()}
                disabled={state === 'verifying' || !robloxUserId.trim()}
                className="px-4 py-2.5 bg-[#1c1c1c] border border-white/10 hover:border-[#D4AF37]/40 text-gray-300 hover:text-[#D4AF37] rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                {state === 'verifying' ? 'Checking...' : 'Look Up'}
              </button>
            </div>
            <p className="text-gray-600 text-[11px] mt-1">
              Find your User ID at roblox.com/users/[ID]/profile
            </p>
          </div>

          {/* Step 2: Verification instructions */}
          {verificationCode && (
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldIcon className="w-4 h-4 text-[#D4AF37]" />
                <p className="text-[#D4AF37] text-xs font-semibold">Verification Required</p>
              </div>

              {robloxUsername && (
                <p className="text-white text-sm mb-2">
                  Found: <strong>@{robloxUsername}</strong>
                </p>
              )}

              {verified ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Verified! Click &quot;Link Account&quot; below to finish.</span>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-xs mb-2">
                    To prove you own this Roblox account, add this code to your Roblox profile
                    description (&quot;About&quot; section):
                  </p>
                  <div className="bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 font-mono text-[#D4AF37] text-sm font-bold tracking-wider select-all mb-2">
                    {verificationCode}
                  </div>
                  <p className="text-gray-500 text-[11px]">
                    After adding the code, click &quot;Look Up&quot; again to verify. You can remove
                    the code from your description after linking.
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setState('idle')
                setError(null)
                setVerificationCode(null)
                setVerified(false)
                setRobloxUserId('')
                setRobloxUsername('')
              }}
              className="text-xs border border-white/10 hover:border-white/20 text-gray-400 px-4 py-2 rounded-xl transition-colors"
            >
              Cancel
            </button>
            {verified && verificationCode && (
              <button
                onClick={() => void handleLink()}
                disabled={state === 'linking'}
                className="inline-flex items-center gap-2 text-xs bg-[#D4AF37] hover:bg-[#E6A519] text-black font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {state === 'linking' ? 'Linking...' : 'Link Account'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
