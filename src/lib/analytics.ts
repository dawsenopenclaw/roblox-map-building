/**
 * Centralized analytics module for RobloxForge.
 *
 * - Client-side: wraps posthog-js (singleton already initialised in PostHogProvider)
 * - Server-side: wraps posthog-node via getPostHogClient()
 * - All event names are typed — no raw strings at call sites
 * - Auto-attaches $app: 'robloxforge' to every event
 * - Batching handled automatically by the PostHog SDKs (flushAt / autocapture)
 */

// ─── Event catalogue ─────────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Auth / signup
  | 'signup_started'
  | 'signup_completed'
  // Onboarding
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  // Voice build
  | 'voice_build_started'
  | 'voice_build_completed'
  | 'voice_build_failed'
  // Image-to-map
  | 'image_map_started'
  | 'image_map_completed'
  // Templates / marketplace
  | 'template_viewed'
  | 'template_purchased'
  | 'template_submitted'
  // Subscriptions
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  // Tokens
  | 'token_purchased'
  | 'token_spent'
  // Game DNA
  | 'game_dna_scanned'
  | 'game_dna_compared'
  // Team
  | 'team_created'
  | 'team_member_invited'
  // API
  | 'api_key_created'
  // Referrals
  | 'referral_link_shared'
  | 'referral_converted'
  // Gamification
  | 'achievement_unlocked'
  | 'streak_milestone_reached'
  // Engagement
  | 'search_performed'
  | 'error_encountered'
  | 'feature_discovery'

// ─── Property shapes per event ───────────────────────────────────────────────

export interface EventProperties {
  signup_started: Record<string, never>
  signup_completed: { method?: string }
  onboarding_step_completed: { step: string; stepIndex?: number }
  onboarding_skipped: { atStep?: string }
  voice_build_started: { inputType: 'voice' | 'text'; prompt?: string }
  voice_build_completed: {
    durationMs?: number
    tokensUsed?: number
    resultLabel?: string
  }
  voice_build_failed: { reason?: string; errorMessage?: string }
  image_map_started: { fileType?: string; fileSizeMb?: number }
  image_map_completed: { durationMs?: number; tokensUsed?: number }
  template_viewed: { templateId: string; templateTitle?: string; priceCents?: number }
  template_purchased: {
    templateId: string
    templateTitle?: string
    priceCents: number
    isFree: boolean
  }
  template_submitted: { templateTitle?: string; category?: string }
  subscription_upgraded: { fromTier: string; toTier: string; billingInterval?: string }
  subscription_downgraded: { fromTier: string; toTier: string }
  subscription_cancelled: { tier: string; reason?: string }
  token_purchased: { packSlug: string; tokenCount?: number; priceCents?: number }
  token_spent: { amount: number; feature?: string }
  game_dna_scanned: { gameId?: string }
  game_dna_compared: { gameIds?: string[] }
  team_created: { teamName?: string }
  team_member_invited: { role?: string }
  api_key_created: { keyName?: string }
  referral_link_shared: { channel?: string }
  referral_converted: { referralCode?: string }
  achievement_unlocked: { achievementId: string; achievementName?: string }
  streak_milestone_reached: { days: number }
  search_performed: { query: string; resultsCount?: number; section?: string }
  error_encountered: { errorType: string; message?: string; page?: string }
  feature_discovery: { featureName: string; page?: string }
}

// ─── User context that's auto-attached when available ────────────────────────

export interface UserContext {
  tier?: string
  role?: string
  streak?: number
  isUnder13?: boolean
}

// ─── Base properties appended to every event ─────────────────────────────────

function baseProps(ctx?: UserContext): Record<string, unknown> {
  return {
    $app: 'robloxforge',
    ...(ctx?.tier && { user_tier: ctx.tier }),
    ...(ctx?.role && { user_role: ctx.role }),
    ...(ctx?.streak !== undefined && { user_streak: ctx.streak }),
    ...(ctx?.isUnder13 !== undefined && { user_is_under_13: ctx.isUnder13 }),
  }
}

// ─── Client-side capture (posthog-js) ────────────────────────────────────────

/**
 * Fire an analytics event from a client component.
 * The PostHog singleton must already be initialised (via PostHogProvider).
 */
export function captureClientEvent<E extends AnalyticsEvent>(
  event: E,
  properties?: EventProperties[E],
  userContext?: UserContext
): void {
  if (typeof window === 'undefined') return
  try {
    // Dynamic import keeps posthog-js out of server bundles
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture(event, {
        ...baseProps(userContext),
        ...(properties as Record<string, unknown>),
      })
    })
  } catch {
    // Never throw — analytics must not break product flows
  }
}

// ─── Server-side capture (posthog-node) ──────────────────────────────────────

/**
 * Fire an analytics event from a server component or API route.
 * Requires the PostHog Node client to be initialised.
 */
export async function captureServerEvent<E extends AnalyticsEvent>(
  distinctId: string,
  event: E,
  properties?: EventProperties[E],
  userContext?: UserContext
): Promise<void> {
  try {
    const { getPostHogClient } = await import('./posthog')
    const client = getPostHogClient()
    if (!client) return
    client.capture({
      distinctId,
      event,
      properties: {
        ...baseProps(userContext),
        ...(properties as Record<string, unknown>),
      },
    })
  } catch {
    // Never throw
  }
}

// ─── Server-side identify ─────────────────────────────────────────────────────

export async function identifyServerUser(
  distinctId: string,
  properties: {
    email?: string
    tier?: string
    role?: string
    isUnder13?: boolean
    createdAt?: string
    displayName?: string
  }
): Promise<void> {
  try {
    const { getPostHogClient } = await import('./posthog')
    const client = getPostHogClient()
    if (!client) return
    client.identify({ distinctId, properties })
  } catch {
    // Never throw
  }
}
