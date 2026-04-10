'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import {
  Coins,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Link2,
  Gamepad2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface RobloxLinkStatus {
  linked: boolean
  robloxUserId?: string
  robloxUsername?: string
  robloxDisplayName?: string
  robloxAvatarUrl?: string
  linkedAt?: string
}

interface CreditPack {
  productId: string
  label: string
  credits: number
  robux: number
  usdEquivalent: number
  featured?: boolean
}

// ── Credit packs ────────────────────────────────────────────────────────────

const CREDIT_PACKS: CreditPack[] = [
  {
    productId: 'forje_100_credits',
    label: '100 Credits',
    credits: 100,
    robux: 2860,
    usdEquivalent: 10,
  },
  {
    productId: 'forje_500_credits',
    label: '500 Credits',
    credits: 500,
    robux: 12500,
    usdEquivalent: 43.71,
    featured: true,
  },
  {
    productId: 'forje_1000_credits',
    label: '1,000 Credits',
    credits: 1000,
    robux: 22000,
    usdEquivalent: 76.92,
  },
]

// ── Fetcher ─────────────────────────────────────────────────────────────────

async function linkFetcher(url: string): Promise<RobloxLinkStatus> {
  const res = await fetch(url)
  if (!res.ok) return { linked: false }
  return res.json() as Promise<RobloxLinkStatus>
}

// ── Steps ───────────────────────────────────────────────────────────────────

type Step = 'select' | 'link' | 'instructions' | 'done'

// ── Component ───────────────────────────────────────────────────────────────

export default function RobuxPaymentCard() {
  const [step, setStep] = useState<Step>('select')
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)
  const [linkCode, setLinkCode] = useState('')
  const [linkRobloxId, setLinkRobloxId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  const { data: linkStatus, mutate: refreshLink } = useSWR<RobloxLinkStatus>(
    '/api/payments/robux/link',
    linkFetcher,
    { revalidateOnFocus: false },
  )

  const isLinked = linkStatus?.linked ?? false

  // When user selects a pack, move to next step
  const handleSelectPack = useCallback(
    (pack: CreditPack) => {
      setSelectedPack(pack)
      if (isLinked) {
        setStep('instructions')
      } else {
        setStep('link')
      }
    },
    [isLinked],
  )

  // Link Roblox account
  const handleLink = useCallback(async () => {
    if (!linkRobloxId || !linkCode) return
    setLinking(true)
    setLinkError(null)

    try {
      const res = await fetch('/api/payments/robux/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robloxUserId: Number(linkRobloxId),
          verificationCode: linkCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setLinkError(data.error ?? 'Failed to link account')
        setLinking(false)
        return
      }

      setLinkSuccess(true)
      await refreshLink()

      // Auto-advance to instructions after a brief delay
      setTimeout(() => {
        setStep('instructions')
        setLinkSuccess(false)
      }, 1500)
    } catch {
      setLinkError('Network error. Please try again.')
    } finally {
      setLinking(false)
    }
  }, [linkRobloxId, linkCode, refreshLink])

  // Reset to selection
  const handleBack = useCallback(() => {
    setStep('select')
    setSelectedPack(null)
    setLinkError(null)
    setLinkSuccess(false)
  }, [])

  return (
    <div className="relative overflow-hidden bg-[#0F1320] border border-white/[0.08] rounded-2xl">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00B06F]/60 to-transparent" />

      <div className="p-6 sm:p-7">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#00B06F]/10 border border-[#00B06F]/20 flex items-center justify-center">
            <Coins size={18} className="text-[#00B06F]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pay with Robux</h3>
            <p className="text-xs text-gray-500">
              Purchase credits using Robux (~286 R$/$1)
            </p>
          </div>
        </div>

        {/* ── Linked account status ── */}
        {isLinked && linkStatus && (
          <div className="flex items-center gap-3 mb-5 bg-[#00B06F]/5 border border-[#00B06F]/15 rounded-xl px-4 py-3">
            <ShieldCheck size={16} className="text-[#00B06F] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#00B06F] font-medium">Roblox Account Linked</p>
              <p className="text-xs text-gray-400 truncate">
                {linkStatus.robloxDisplayName ?? linkStatus.robloxUsername ?? `User ${linkStatus.robloxUserId}`}
              </p>
            </div>
            <Check size={14} className="text-[#00B06F] flex-shrink-0" />
          </div>
        )}

        {/* ── Step: Select Credit Pack ── */}
        {step === 'select' && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] mb-4">
              Choose a credit pack
            </p>
            <div className="grid gap-3">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.productId}
                  onClick={() => handleSelectPack(pack)}
                  className={`group relative w-full text-left overflow-hidden rounded-xl p-4 transition-all border ${
                    pack.featured
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.04] hover:border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.08)]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-[#00B06F]/30 hover:bg-[#00B06F]/[0.03]'
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                      Best Value
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm">{pack.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#00B06F] font-bold">
                          {pack.robux.toLocaleString()} R$
                        </span>
                        <span className="text-gray-600">
                          ~${pack.usdEquivalent.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">{pack.credits.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">credits</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-600 group-hover:text-[#00B06F] transition-colors"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* How it works mini-guide */}
            <div className="mt-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] mb-3">
                How it works
              </p>
              <ol className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-[#00B06F] font-bold min-w-[14px]">1.</span>
                  {isLinked ? 'Select a credit pack above' : 'Link your Roblox account (one-time setup)'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00B06F] font-bold min-w-[14px]">2.</span>
                  Visit the ForjeGames Roblox experience
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00B06F] font-bold min-w-[14px]">3.</span>
                  Purchase the GamePass with your Robux
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00B06F] font-bold min-w-[14px]">4.</span>
                  Credits added to your account automatically
                </li>
              </ol>
            </div>
          </>
        )}

        {/* ── Step: Link Roblox Account ── */}
        {step === 'link' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 size={14} className="text-[#00B06F]" />
              <p className="text-sm font-semibold text-white">Link Your Roblox Account</p>
            </div>
            <p className="text-xs text-gray-500">
              Visit the{' '}
              <a
                href="https://www.roblox.com/games/forjegames"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00B06F] hover:underline"
              >
                ForjeGames Roblox experience
              </a>
              {' '}to get your verification code, then enter it below.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">
                  Roblox User ID
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={linkRobloxId}
                  onChange={(e) => setLinkRobloxId(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456789"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00B06F]/40 focus:ring-1 focus:ring-[#00B06F]/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="e.g. A3F29B"
                  maxLength={6}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 font-mono tracking-wider focus:outline-none focus:border-[#00B06F]/40 focus:ring-1 focus:ring-[#00B06F]/20 transition-colors"
                />
              </div>
            </div>

            {linkError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-xs">{linkError}</p>
              </div>
            )}

            {linkSuccess && (
              <div className="bg-[#00B06F]/10 border border-[#00B06F]/20 rounded-xl p-3 flex items-center gap-2">
                <Check size={14} className="text-[#00B06F]" />
                <p className="text-[#00B06F] text-xs font-medium">Account linked successfully!</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleLink}
                disabled={linking || !linkRobloxId || linkCode.length < 4}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#00B06F] hover:bg-[#00994F] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {linking ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    Link Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Instructions ── */}
        {step === 'instructions' && selectedPack && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Gamepad2 size={14} className="text-[#00B06F]" />
              <p className="text-sm font-semibold text-white">Complete Your Purchase</p>
            </div>

            {/* Selected pack summary */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{selectedPack.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedPack.credits.toLocaleString()} credits
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#00B06F] font-bold">
                    {selectedPack.robux.toLocaleString()} R$
                  </p>
                  <p className="text-xs text-gray-600">
                    ~${selectedPack.usdEquivalent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <ol className="space-y-3">
              <li className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3">
                <span className="w-6 h-6 rounded-full bg-[#00B06F]/15 border border-[#00B06F]/30 text-[#00B06F] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-sm text-white font-medium">Open the ForjeGames experience</p>
                  <a
                    href="https://www.roblox.com/games/forjegames"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#00B06F] hover:underline mt-1"
                  >
                    <ExternalLink size={11} />
                    Open in Roblox
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3">
                <span className="w-6 h-6 rounded-full bg-[#00B06F]/15 border border-[#00B06F]/30 text-[#00B06F] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-sm text-white font-medium">
                    Purchase the &quot;{selectedPack.label}&quot; GamePass
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Costs {selectedPack.robux.toLocaleString()} Robux from your balance
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3">
                <span className="w-6 h-6 rounded-full bg-[#00B06F]/15 border border-[#00B06F]/30 text-[#00B06F] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-sm text-white font-medium">Credits added automatically</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedPack.credits.toLocaleString()} credits will appear in your account within seconds
                  </p>
                </div>
              </li>
            </ol>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-colors"
              >
                Back
              </button>
              <a
                href="https://www.roblox.com/games/forjegames"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#00B06F] hover:bg-[#00994F] text-white transition-colors flex items-center justify-center gap-2"
              >
                <Gamepad2 size={14} />
                Open Roblox Experience
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
