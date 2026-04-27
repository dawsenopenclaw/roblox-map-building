/**
 * Client-side analytics — safe for 'use client' components.
 * Routes all capture calls through safePostHog, which enforces the COPPA
 * age-gate and cookie-consent gates. Never imports posthog-node.
 */

import { safePostHog } from './posthog-safe'

export type AnalyticsEvent =
  | 'signup_started' | 'signup_completed'
  | 'user.signed_up'
  | 'onboarding_step_started' | 'onboarding_step_completed' | 'onboarding_step_skipped' | 'onboarding_skipped' | 'onboarding_completed'
  | 'user.connected_studio' | 'user.downloaded_plugin'
  | 'user.first_build' | 'user.generated_3d'
  | 'voice_build_started' | 'voice_build_completed' | 'voice_build_failed'
  | 'image_map_started' | 'image_map_completed'
  | 'template_viewed' | 'template_purchased' | 'template_submitted'
  | 'user.subscribed' | 'user.purchased_tokens'
  | 'subscription_upgraded' | 'subscription_downgraded' | 'subscription_cancelled'
  | 'token_purchased' | 'token_spent'
  | 'game_dna_scanned' | 'game_dna_compared'
  | 'team_created' | 'team_member_invited'
  | 'api_key_created'
  | 'referral_link_shared' | 'referral_converted'
  | 'achievement_unlocked' | 'streak_milestone_reached'
  | 'search_performed' | 'error_encountered' | 'feature_discovery'
  // ── Funnel events (signup → editor → build → pay) ──
  | 'editor_opened' | 'build_sent' | 'build_success' | 'second_build'
  | 'payment_started' | 'payment_completed'

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
  // Extra short-circuit for under-13 (defence-in-depth over safePostHog's gate).
  if (userContext?.isUnder13 === true) return
  // safePostHog enforces: browser-only, age-verified, cookie-consented,
  // POSTHOG_KEY configured. Any failure is a silent no-op — never throws.
  safePostHog.capture(event, {
    ...baseProps(userContext),
    ...properties,
  })
}
