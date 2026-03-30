/**
 * Client-side analytics — safe for 'use client' components.
 * Wraps posthog-js only. Never imports posthog-node.
 */

export type AnalyticsEvent =
  | 'signup_started' | 'signup_completed'
  | 'onboarding_step_started' | 'onboarding_step_completed' | 'onboarding_step_skipped' | 'onboarding_skipped' | 'onboarding_completed'
  | 'voice_build_started' | 'voice_build_completed' | 'voice_build_failed'
  | 'image_map_started' | 'image_map_completed'
  | 'template_viewed' | 'template_purchased' | 'template_submitted'
  | 'subscription_upgraded' | 'subscription_downgraded' | 'subscription_cancelled'
  | 'token_purchased' | 'token_spent'
  | 'game_dna_scanned' | 'game_dna_compared'
  | 'team_created' | 'team_member_invited'
  | 'api_key_created'
  | 'referral_link_shared' | 'referral_converted'
  | 'achievement_unlocked' | 'streak_milestone_reached'
  | 'search_performed' | 'error_encountered' | 'feature_discovery'

export interface UserContext {
  tier?: string
  role?: string
  streak?: number
  isUnder13?: boolean
}

function baseProps(ctx?: UserContext): Record<string, unknown> {
  return {
    $app: 'ForjeGames',
    ...(ctx?.tier && { user_tier: ctx.tier }),
    ...(ctx?.role && { user_role: ctx.role }),
    ...(ctx?.streak !== undefined && { user_streak: ctx.streak }),
    ...(ctx?.isUnder13 !== undefined && { user_is_under_13: ctx.isUnder13 }),
  }
}

export function captureClientEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
  userContext?: UserContext
): void {
  if (typeof window === 'undefined') return
  if (userContext?.isUnder13 === true) return
  try {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture(event, {
        ...baseProps(userContext),
        ...properties,
      })
    })
  } catch {
    // Never throw — analytics must not break product flows
  }
}
