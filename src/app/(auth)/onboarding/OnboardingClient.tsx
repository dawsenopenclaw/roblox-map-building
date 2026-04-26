'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PRIMARY_PRESETS, SECONDARY_PRESETS, type GamePreset } from '@/lib/game-presets'

// Steps rendered by this page: 3 (profile), 4 (game type), 5 (first build)
// Steps 1-2 (age gate + parental consent) happen at /onboarding/age-gate

const TOTAL_STEPS = 5

// ─── Game types: Roblox genres the user asked for ────────────────────────────
// Popular-first (Simulators + Tycoons are the top two Roblox genres by CCU on
// any given day). The 6 "headline" genres always show; "Explore more" reveals
// the long tail so users never feel boxed in.
//
// Prompts come from src/lib/game-presets.ts — each one is a full game
// BLUEPRINT (~1000 chars) not a 1-line prompt. The AI generates a complete
// playable simulator/tycoon/obby rather than a random collection of parts.
type GameType = GamePreset

const PRIMARY_GAME_TYPES: GameType[] = PRIMARY_PRESETS
const MORE_GAME_TYPES: GameType[] = SECONDARY_PRESETS

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Step {currentStep} of {TOTAL_STEPS}</span>
        <span className="text-xs text-[#D4AF37] font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D4AF37] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Step 3: Profile Setup ───────────────────────────────────────────────────
function ProfileStep({
  onNext,
  onSkip,
}: {
  onNext: (displayName: string) => void
  onSkip: () => void
}) {
  const { user } = useUser()
  const [displayName, setDisplayName] = useState(user?.firstName ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (trimmed.length > 32) { setError('Max 32 characters.'); return }
    onNext(trimmed || user?.firstName || 'Builder')
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">What should we call you?</h2>
      <p className="text-gray-400 text-sm mb-6">
        Optional — we&apos;ll use your account name if you skip.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            maxLength={32}
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError('') }}
            placeholder={user?.firstName ?? 'e.g. AwesomeBuilder99'}
            className="w-full bg-[#141414] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-600"
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
        >
          Skip — use my account name
        </button>
      </form>
    </>
  )
}

// ─── Step 4: Game Type / Genre ───────────────────────────────────────────────
function GameTypeStep({
  onPick,
  onSkip,
}: {
  onPick: (gameType: GameType) => void
  onSkip: () => void
}) {
  const [showMore, setShowMore] = useState(false)
  const visible = showMore
    ? [...PRIMARY_GAME_TYPES, ...MORE_GAME_TYPES]
    : PRIMARY_GAME_TYPES

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">What do you want to build?</h2>
      <p className="text-gray-400 text-sm mb-6">
        Pick a genre — we&apos;ll kick off the AI with a matching prompt. One click, we handle the rest.
      </p>

      {/* Genre grid — 2 cols, square-ish cards. Clicking a card is the
          primary action; no separate Continue button needed. */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {visible.map((g) => (
          <button
            key={g.id}
            onClick={() => onPick(g)}
            className="group p-4 rounded-xl border border-white/10 bg-[#141414] text-left transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.98]"
          >
            <div className="text-3xl mb-2">{g.icon}</div>
            <div className="text-sm font-semibold text-white group-hover:text-[#D4AF37]">
              {g.label}
            </div>
            {g.tagline && (
              <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                {g.tagline}
              </div>
            )}
            <div className="text-[10px] text-[#D4AF37]/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to build →
            </div>
          </button>
        ))}
      </div>

      {/* Explore more — expands the grid to reveal the long tail */}
      {!showMore ? (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="w-full border border-white/10 bg-white/5 text-gray-300 text-sm font-medium py-3 rounded-lg hover:border-[#D4AF37]/50 hover:text-white transition-colors mb-2"
        >
          Explore more genres ({MORE_GAME_TYPES.length} more) ↓
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowMore(false)}
          className="w-full border border-white/10 bg-white/5 text-gray-400 text-sm py-2 rounded-lg hover:text-white transition-colors mb-2"
        >
          Show fewer
        </button>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
      >
        Skip — I have my own idea
      </button>
    </>
  )
}

// ─── Step 5: First Build Prompt (frictionless) ───────────────────────────────
// The user said "make it more frictionless" — so the prompt step now does
// the minimum possible work:
//   • Pre-filled with the prompt from the previous genre step
//   • Big primary CTA that starts building on a single click
//   • Optional edit via a small "Write my own" expander
//   • No required form fields — any path ends at /editor
function FirstBuildStep({
  suggestedPrompt,
  displayName,
  onFinish,
  loading,
  error,
  onRetry,
}: {
  suggestedPrompt: string
  displayName: string
  onFinish: (prompt: string) => void
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const [prompt, setPrompt] = useState(suggestedPrompt)
  const [customMode, setCustomMode] = useState(false)
  const [slowWarning, setSlowWarning] = useState(false)

  // Keep the prompt in sync if the user navigates back to step 4 and
  // picks a different genre, then returns here.
  useEffect(() => {
    if (!customMode) setPrompt(suggestedPrompt)
  }, [suggestedPrompt, customMode])

  // Show slow warning after 15 seconds of loading
  useEffect(() => {
    if (!loading) { setSlowWarning(false); return }
    const timer = setTimeout(() => setSlowWarning(true), 15000)
    return () => clearTimeout(timer)
  }, [loading])

  // Loading state — full-screen overlay within the card
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {/* Pulsing gold spinner */}
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-6" />
        <h2 className="text-lg font-bold text-white mb-2">
          Generating your first build...
        </h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          The AI is creating your game. This usually takes a few seconds.
        </p>
        {slowWarning && (
          <p className="text-yellow-400/80 text-xs text-center animate-pulse">
            This is taking longer than usual...
          </p>
        )}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          We couldn&apos;t start your build, but you can try again or jump straight to the editor.
        </p>
        <button
          onClick={onRetry}
          className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors mb-3"
        >
          Try again
        </button>
        <a
          href="/editor"
          className="w-full text-center text-gray-400 text-sm py-2 hover:text-white transition-colors block"
        >
          Skip to editor
        </a>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">
        You&apos;re all set, {displayName || 'Builder'}!
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Here&apos;s what we&apos;ll kick off for you. Hit start and the AI takes over.
      </p>

      {/* Selected prompt preview — big, readable, one-tap edit */}
      {!customMode ? (
        <div
          className="mb-4 p-4 rounded-xl border"
          style={{
            background: 'linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)',
            borderColor: 'rgba(212,175,55,0.25)',
          }}
        >
          <div className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold mb-1.5">
            Your first build
          </div>
          <p className="text-white text-sm leading-relaxed">{prompt}</p>
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="mt-3 text-xs text-gray-400 hover:text-[#D4AF37] transition-colors"
          >
            Want to tweak it? Write my own →
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">
            Your prompt
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe what you want to build…"
            autoFocus
            className="w-full bg-[#141414] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-600 resize-none text-sm"
          />
          <button
            type="button"
            onClick={() => { setCustomMode(false); setPrompt(suggestedPrompt) }}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Back to suggested prompt
          </button>
        </div>
      )}

      {/* Primary CTA — one tap ends the flow */}
      <button
        onClick={() => onFinish(prompt.trim() || suggestedPrompt)}
        disabled={loading}
        className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-lg hover:bg-[#E6A519] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        style={{ boxShadow: '0 0 24px rgba(212,175,55,0.3)' }}
      >
        Start building →
      </button>

      {/* Escape hatch — go to editor without a prompt queued */}
      <button
        type="button"
        onClick={() => onFinish('')}
        disabled={loading}
        className="w-full text-gray-500 text-sm py-3 hover:text-gray-300 transition-colors"
      >
        Just take me to the editor
      </button>
    </>
  )
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────
export default function OnboardingWizardPage() {
  const router = useRouter()
  const { track } = useAnalytics()
  const { user } = useUser()

  // Steps 1 (age-gate) and 2 (parental-consent) already completed before this page.
  // This page handles steps 3, 4, 5.
  const [wizardStep, setWizardStep] = useState<3 | 4 | 5>(3)
  const [displayName, setDisplayName] = useState('')
  const [suggestedPrompt, setSuggestedPrompt] = useState(PRIMARY_GAME_TYPES[0].prompt)
  const [pickedGameTypeId, setPickedGameTypeId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState(false)
  const [lastPrompt, setLastPrompt] = useState('')

  useEffect(() => {
    track('onboarding_step_started', { step: 'wizard', stepIndex: wizardStep })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardStep])

  function handleProfileNext(name: string) {
    setDisplayName(name)
    track('onboarding_step_completed', { step: 'profile', stepIndex: 3 })
    setWizardStep(4)
  }

  function handleGameTypePick(g: GameType) {
    setPickedGameTypeId(g.id)
    setSuggestedPrompt(g.prompt)
    track('onboarding_step_completed', { step: 'game_type', stepIndex: 4, gameTypeId: g.id })
    setWizardStep(5)
  }

  function handleGameTypeSkip() {
    track('onboarding_step_skipped', { step: 'game_type', stepIndex: 4 })
    setWizardStep(5)
  }

  async function handleFinish(prompt: string) {
    setFinishing(true)
    setFinishError(false)
    setLastPrompt(prompt)
    try {
      const res = await fetch('/api/onboarding/wizard-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: pickedGameTypeId ?? 'all',
          skipped: false,
          displayName,
          firstPrompt: prompt,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      track('onboarding_step_completed', { step: 'first_build', stepIndex: 5 })
      track('onboarding_completed', { firstPrompt: prompt, gameTypeId: pickedGameTypeId })

      // Auto-redeem referral code if the user arrived via a referral link.
      // The code was persisted in localStorage by the sign-up page.
      try {
        const refCode = localStorage.getItem('fg_referral_code')
        if (refCode) {
          localStorage.removeItem('fg_referral_code')
          await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: refCode }),
          })
          track('referral_auto_redeemed', { referralCode: refCode })
        }
      } catch {
        // Non-fatal — referral redemption failure should never block onboarding.
      }

      // Use a HARD navigation (window.location.href) instead of router.push
      // so Clerk reissues the JWT with the latest publicMetadata claims and
      // the middleware re-evaluates against fresh claims. router.push() only
      // triggers a client-side transition and middleware may still see the
      // stale JWT, causing /editor -> /onboarding redirect loops after users
      // finished the wizard. Hard navigation is bullet-proof and costs one
      // extra page load — acceptable at the end of a 5-step wizard.
      const target = prompt
        ? `/editor?prompt=${encodeURIComponent(prompt)}`
        : '/editor'
      window.location.href = target
    } catch {
      setFinishing(false)
      setFinishError(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#D4AF37]">ForjeGames</h1>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
          <ProgressBar currentStep={wizardStep} />

          {wizardStep === 3 && (
            <ProfileStep
              onNext={handleProfileNext}
              onSkip={() => handleProfileNext(user?.firstName ?? 'Builder')}
            />
          )}
          {wizardStep === 4 && (
            <GameTypeStep onPick={handleGameTypePick} onSkip={handleGameTypeSkip} />
          )}
          {wizardStep === 5 && (
            <FirstBuildStep
              suggestedPrompt={suggestedPrompt}
              displayName={displayName}
              onFinish={handleFinish}
              loading={finishing}
              error={finishError}
              onRetry={() => handleFinish(lastPrompt || suggestedPrompt)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
