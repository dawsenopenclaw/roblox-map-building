'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAnalytics } from '@/hooks/useAnalytics'

// Steps rendered by this page: 3 (profile), 4 (game type), 5 (first build)
// Steps 1-2 (age gate + parental consent) happen at /onboarding/age-gate

const TOTAL_STEPS = 5

// ─── Game types: Roblox genres the user asked for ────────────────────────────
// Popular-first (Simulators + Tycoons are the top two Roblox genres by CCU on
// any given day). The 6 "headline" genres always show; "Explore more" reveals
// the long tail so users never feel boxed in.
interface GameType {
  id: string
  label: string
  icon: string
  // Prompt that gets sent to the AI when the user clicks this card
  prompt: string
}

const PRIMARY_GAME_TYPES: GameType[] = [
  { id: 'simulator',      label: 'Simulator',     icon: '🎮', prompt: 'Build me a Roblox simulator game where players collect upgrades, level up, and earn coins from an automatic loop.' },
  { id: 'tycoon',         label: 'Tycoon',        icon: '💰', prompt: 'Build me a Roblox tycoon with droppers, conveyors, upgrade buttons, and a pad to claim the base.' },
  { id: 'obby',           label: 'Obby',          icon: '🧗', prompt: 'Build me a 20-stage Roblox obby with increasing difficulty, checkpoints, and a leaderboard.' },
  { id: 'tower_defense',  label: 'Tower Defense', icon: '🏹', prompt: 'Build me a Roblox tower defense game with 10 waves of enemies, placeable towers, and a base to defend.' },
  { id: 'rpg',            label: 'RPG',           icon: '⚔️', prompt: 'Build me a Roblox RPG with quests, NPCs, a combat system, and gear that drops from enemies.' },
  { id: 'horror',         label: 'Horror',        icon: '😱', prompt: 'Build me a Roblox horror game with a dark atmospheric map, jump scares, and an escape objective.' },
]

const MORE_GAME_TYPES: GameType[] = [
  { id: 'racing',    label: 'Racing',     icon: '🏎️', prompt: 'Build me a Roblox racing game with multiple tracks, selectable cars, power-ups, and a lap timer.' },
  { id: 'fighting',  label: 'Fighting',   icon: '🥊', prompt: 'Build me a Roblox fighting game with 5 fighters, special moves, health bars, and a KO system.' },
  { id: 'roleplay',  label: 'Roleplay',   icon: '🏙️', prompt: 'Build me a Roblox roleplay city with jobs, houses, shops, and vehicles.' },
  { id: 'survival',  label: 'Survival',   icon: '🔥', prompt: 'Build me a Roblox survival game with hunger, crafting, monsters at night, and a shelter to build.' },
  { id: 'shooter',   label: 'Shooter',    icon: '🔫', prompt: 'Build me a Roblox PvP shooter with weapons, spawn points, a kill feed, and a battle map.' },
  { id: 'kart',      label: 'Kart Race',  icon: '🏁', prompt: 'Build me a Roblox kart racing game with 4 tracks, power-ups, and shortcut jumps.' },
  { id: 'adventure', label: 'Adventure',  icon: '🗺️', prompt: 'Build me a Roblox adventure game with hidden treasures, puzzles, and story NPCs.' },
  { id: 'sandbox',   label: 'Sandbox',    icon: '🏗️', prompt: 'Build me a Roblox sandbox building game where players place blocks and share creations.' },
  { id: 'city',      label: 'City Map',   icon: '🌆', prompt: 'Build me a modern Roblox city map with roads, skyscrapers, parks, and traffic.' },
  { id: 'castle',    label: 'Castle',     icon: '🏰', prompt: 'Build me a Roblox medieval castle with a moat, towers, drawbridge, and a throne room.' },
  { id: 'island',    label: 'Island',     icon: '🌴', prompt: 'Build me a Roblox tropical island with a beach, palm trees, hidden caves, and a dock.' },
  { id: 'space',     label: 'Space',      icon: '🚀', prompt: 'Build me a Roblox space station with docking bays, zero-gravity sections, and an airlock.' },
]

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
            <div className="text-[11px] text-gray-500 mt-1">Click to start building →</div>
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
}: {
  suggestedPrompt: string
  displayName: string
  onFinish: (prompt: string) => void
  loading: boolean
}) {
  const [prompt, setPrompt] = useState(suggestedPrompt)
  const [customMode, setCustomMode] = useState(false)

  // Keep the prompt in sync if the user navigates back to step 4 and
  // picks a different genre, then returns here.
  useEffect(() => {
    if (!customMode) setPrompt(suggestedPrompt)
  }, [suggestedPrompt, customMode])

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
        {loading ? 'Starting…' : 'Start building →'}
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
    try {
      await fetch('/api/onboarding/wizard-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: pickedGameTypeId ?? 'all',
          skipped: false,
          displayName,
          firstPrompt: prompt,
        }),
      })
      track('onboarding_step_completed', { step: 'first_build', stepIndex: 5 })
      track('onboarding_completed', { firstPrompt: prompt, gameTypeId: pickedGameTypeId })
    } catch {
      // Non-fatal — proceed to editor regardless so the user is never stuck.
    } finally {
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
            />
          )}
        </div>
      </div>
    </div>
  )
}
