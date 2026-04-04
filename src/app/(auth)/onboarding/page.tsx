'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAnalytics } from '@/hooks/useAnalytics'

// Steps rendered by this page: 3 (profile), 4 (templates), 5 (first build)
// Steps 1-2 (age gate + parental consent) happen at /onboarding/age-gate

const TOTAL_STEPS = 5

const TEMPLATES = [
  { id: 'city', label: 'City / Town', icon: '🏙️', prompt: 'Build me a modern city map with roads and skyscrapers' },
  { id: 'castle', label: 'Castle / Fantasy', icon: '🏰', prompt: 'Build me a medieval castle with a moat and towers' },
  { id: 'race', label: 'Race Track', icon: '🏎️', prompt: 'Build me a race track with banked corners and a pit lane' },
  { id: 'dungeon', label: 'Dungeon', icon: '⚔️', prompt: 'Build me a dark dungeon with corridors and traps' },
  { id: 'island', label: 'Tropical Island', icon: '🌴', prompt: 'Build me a tropical island with a beach and palm trees' },
  { id: 'space', label: 'Space Station', icon: '🚀', prompt: 'Build me a futuristic space station with docking bays' },
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
}: {
  onNext: (displayName: string) => void
}) {
  const { user } = useUser()
  const [displayName, setDisplayName] = useState(user?.firstName ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) { setError('Please enter a display name.'); return }
    if (trimmed.length > 32) { setError('Max 32 characters.'); return }
    onNext(trimmed)
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">What should we call you?</h2>
      <p className="text-gray-400 text-sm mb-6">This is how you appear to other builders.</p>
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
            placeholder="e.g. AwesomeBuilder99"
            required
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
      </form>
    </>
  )
}

// ─── Step 4: Choose Template ─────────────────────────────────────────────────
function TemplateStep({
  onNext,
  onSkip,
}: {
  onNext: (templateId: string, prompt: string) => void
  onSkip: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">What do you want to build?</h2>
      <p className="text-gray-400 text-sm mb-6">Pick a starting template — you can change it anytime.</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            aria-pressed={selected === t.id}
            className={`p-4 rounded-lg border text-left transition-all ${
              selected === t.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-white/10 bg-[#141414] hover:border-white/30'
            }`}
          >
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="text-sm font-semibold text-white">{t.label}</div>
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if (!selected) return
          const t = TEMPLATES.find((x) => x.id === selected)!
          onNext(t.id, t.prompt)
        }}
        disabled={!selected}
        className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-2"
      >
        Continue
      </button>
      <button
        onClick={onSkip}
        className="w-full text-gray-400 text-sm py-2 hover:text-white transition-colors"
      >
        Skip — I&apos;ll decide later
      </button>
    </>
  )
}

// ─── Step 5: First Build Prompt ──────────────────────────────────────────────
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

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-1">
        You&apos;re all set, {displayName || 'Builder'}!
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Tell the AI what to build. You can edit this or type anything.
      </p>
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Try saying:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            'Build me a castle',
            'Make a race track',
            'Create a city map',
          ].map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe what you want to build…"
          className="w-full bg-[#141414] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-600 resize-none"
        />
      </div>
      <button
        onClick={() => onFinish(prompt.trim())}
        disabled={loading || !prompt.trim()}
        className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting…' : 'Start Building →'}
      </button>
    </>
  )
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────
export default function OnboardingWizardPage() {
  const router = useRouter()
  const { track } = useAnalytics()

  // Steps 1 (age-gate) and 2 (parental-consent) already completed before this page.
  // This page handles steps 3, 4, 5.
  const [wizardStep, setWizardStep] = useState<3 | 4 | 5>(3)
  const [displayName, setDisplayName] = useState('')
  const [suggestedPrompt, setSuggestedPrompt] = useState('Build me a castle')
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

  function handleTemplateNext(templateId: string, prompt: string) {
    setSuggestedPrompt(prompt)
    track('onboarding_step_completed', { step: 'template', stepIndex: 4, templateId })
    setWizardStep(5)
  }

  function handleTemplateSkip() {
    track('onboarding_step_skipped', { step: 'template', stepIndex: 4 })
    setWizardStep(5)
  }

  async function handleFinish(prompt: string) {
    setFinishing(true)
    try {
      await fetch('/api/onboarding/wizard-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: 'all',
          skipped: false,
          displayName,
          firstPrompt: prompt,
        }),
      })
      track('onboarding_step_completed', { step: 'first_build', stepIndex: 5 })
      track('onboarding_completed', { firstPrompt: prompt })
    } catch {
      // Non-fatal — proceed to dashboard regardless
    } finally {
      const encoded = encodeURIComponent(prompt)
      router.push(`/dashboard?prompt=${encoded}`)
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
            <ProfileStep onNext={handleProfileNext} />
          )}
          {wizardStep === 4 && (
            <TemplateStep onNext={handleTemplateNext} onSkip={handleTemplateSkip} />
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
