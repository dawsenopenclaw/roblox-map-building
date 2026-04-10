/**
 * Centralized analytics module for ForjeGames.
 *
 * - Client-side: routes through safePostHog (COPPA age-gate + consent enforced)
 * - Server-side: wraps posthog-node via getPostHogClient()
 * - All event names are typed — no raw strings at call sites
 * - Auto-attaches $app: 'ForjeGames' to every event
 * - Batching handled automatically by the PostHog SDKs (flushAt / autocapture)
 */

import { safePostHog } from './posthog-safe'

// ─── Event catalogue ─────────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Auth / signup
  | 'signup_started'
  | 'signup_completed'
  | 'user.signed_up'           // alias used in webhook / server-side handlers
  // Onboarding
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  // Studio
  | 'user.connected_studio'    // first successful Studio plugin connection
  | 'user.downloaded_plugin'   // plugin installer downloaded
  // AI generation
  | 'user.first_build'         // first successful AI map/code generation
  | 'user.generated_3d'        // Meshy / Fal 3D mesh generated
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
  | 'user.subscribed'          // first subscription checkout completed
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  // Tokens
  | 'user.purchased_tokens'    // token pack checkout completed
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
  'user.signed_up': { method?: string; tier?: string }
  onboarding_step_completed: { step: string; stepIndex?: number }
  onboarding_skipped: { atStep?: string }
  'user.connected_studio': { pluginVersion?: string; placeId?: string }
  'user.downloaded_plugin': { version?: string; platform?: string }
  'user.first_build': { promptLength?: number; tokensUsed?: number; durationMs?: number }
  'user.generated_3d': { provider: 'meshy' | 'fal'; prompt?: string; durationMs?: number }
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
  'user.subscribed': { tier: string; billingInterval: 'month' | 'year'; priceCents?: number }
  subscription_upgraded: { fromTier: string; toTier: string; billingInterval?: string }
  subscription_downgraded: { fromTier: string; toTier: string }
  subscription_cancelled: { tier: string; reason?: string }
  'user.purchased_tokens': { packSlug: string; tokenCount?: number; priceCents?: number }
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
    $app: 'ForjeGames',
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
  // Short-circuit on known under-13 context (defence-in-depth).
  if (userContext?.isUnder13 === true) return
  // safePostHog enforces age-gate + cookie-consent + lazy init. It silently
  // no-ops until BOTH gates are satisfied and never throws.
  safePostHog.capture(event as string, {
    ...baseProps(userContext),
    ...(properties as Record<string, unknown>),
  })
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
  // COPPA: never track under-13 users server-side either
  if (userContext?.isUnder13 === true) return
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
