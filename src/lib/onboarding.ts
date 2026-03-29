/**
 * Onboarding state management via Clerk public metadata.
 *
 * Metadata shape stored in Clerk user.publicMetadata:
 * {
 *   onboarding?: {
 *     completed: boolean
 *     completedAt: string (ISO)
 *     interest: 'games' | 'maps' | 'assets' | 'all'
 *     skipped: boolean
 *   }
 * }
 *
 * No DB migration needed — metadata lives in Clerk.
 */

export type OnboardingInterest = 'games' | 'maps' | 'assets' | 'all'

export interface OnboardingMetadata {
  completed: boolean
  completedAt?: string
  interest?: OnboardingInterest
  skipped?: boolean
}

// ─── Client-side helpers ──────────────────────────────────────────────────────

/**
 * Mark onboarding complete. Calls the API route which updates Clerk metadata.
 */
export async function completeOnboarding(
  interest: OnboardingInterest,
  skipped = false,
): Promise<void> {
  await fetch('/api/onboarding/wizard-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interest, skipped }),
  })
}

/**
 * Check onboarding status. Returns null on error (assume not completed).
 */
export async function getOnboardingStatus(): Promise<OnboardingMetadata | null> {
  try {
    const res = await fetch('/api/onboarding/wizard-status')
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ─── Step config ─────────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'interest', label: 'Your Goal' },
  { id: 'demo', label: 'Try It' },
  { id: 'plan', label: 'Choose Plan' },
  { id: 'done', label: "You're Ready" },
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id']

export const TOTAL_STEPS = ONBOARDING_STEPS.length
