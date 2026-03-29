/**
 * Webhook event catalog — type-safe, versioned, Zod-validated.
 *
 * Every event follows the same envelope:
 *   { id, event, version: "v1", createdAt, data: <event-specific shape> }
 *
 * Adding a new event:
 *  1. Define a Zod schema for its `data` payload below.
 *  2. Add the event name to the WebhookEvent union.
 *  3. Add an entry to WEBHOOK_EVENT_CATALOG.
 *  4. Update VALID_EVENTS in routes/webhooks.ts.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Envelope (shared across all events)
// ---------------------------------------------------------------------------

export const WebhookEnvelopeSchema = z.object({
  /** Unique delivery ID (hex string). Matches X-ForjeGames-Delivery header. */
  id: z.string(),
  /** Event name */
  event: z.string(),
  /** Schema version — always "v1" for now */
  version: z.literal('v1'),
  /** ISO-8601 UTC timestamp when the event was created */
  createdAt: z.string().datetime(),
  /** Event-specific payload */
  data: z.record(z.unknown()),
})

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  version: 'v1'
  createdAt: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Per-event data schemas (v1)
// ---------------------------------------------------------------------------

// build.completed
const BuildCompletedDataSchema = z.object({
  buildId: z.string(),
  projectId: z.string(),
  userId: z.string(),
  durationMs: z.number().int().nonnegative(),
  outputUrl: z.string().url().optional(),
  templateId: z.string().optional(),
  tokensUsed: z.number().int().nonnegative(),
})

// build.failed
const BuildFailedDataSchema = z.object({
  buildId: z.string(),
  projectId: z.string(),
  userId: z.string(),
  errorCode: z.string(),
  errorMessage: z.string(),
  tokensUsed: z.number().int().nonnegative(),
})

// template.sold
const TemplateSoldDataSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  priceCents: z.number().int().positive(),
  earningsCents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
})

// template.reviewed
const TemplateReviewedDataSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  reviewerId: z.string(),
  /** approved | rejected | changes_requested */
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  feedback: z.string().optional(),
})

// token.low  — fired when balance drops below 20% of plan quota
const TokenLowDataSchema = z.object({
  userId: z.string(),
  remainingTokens: z.number().int().nonnegative(),
  planQuota: z.number().int().positive(),
  percentRemaining: z.number().min(0).max(100),
})

// token.depleted — fired when balance reaches 0
const TokenDepletedDataSchema = z.object({
  userId: z.string(),
  planQuota: z.number().int().positive(),
  depletedAt: z.string().datetime(),
})

// subscription.changed
const SubscriptionChangedDataSchema = z.object({
  userId: z.string(),
  previousPlan: z.string(),
  newPlan: z.string(),
  changeType: z.enum(['upgrade', 'downgrade', 'cancel', 'reactivate', 'trial_started']),
  effectiveAt: z.string().datetime(),
  billingCycleEnd: z.string().datetime().optional(),
})

// team.member_joined
const TeamMemberJoinedDataSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  role: z.string(),
  invitedBy: z.string().optional(),
  joinedAt: z.string().datetime(),
})

// achievement.unlocked
const AchievementUnlockedDataSchema = z.object({
  userId: z.string(),
  achievementId: z.string(),
  achievementName: z.string(),
  category: z.string(),
  xpAwarded: z.number().int().nonnegative(),
  unlockedAt: z.string().datetime(),
})

// ---------------------------------------------------------------------------
// Event union and catalog
// ---------------------------------------------------------------------------

export type WebhookEvent =
  | 'build.completed'
  | 'build.failed'
  | 'template.sold'
  | 'template.reviewed'
  | 'token.low'
  | 'token.depleted'
  | 'subscription.changed'
  | 'team.member_joined'
  | 'achievement.unlocked'

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  'build.completed',
  'build.failed',
  'template.sold',
  'template.reviewed',
  'token.low',
  'token.depleted',
  'subscription.changed',
  'team.member_joined',
  'achievement.unlocked',
]

export type WebhookEventDataSchema = z.ZodObject<any> | z.ZodRecord<any>

export interface WebhookEventDefinition {
  event: WebhookEvent
  description: string
  dataSchema: WebhookEventDataSchema
  sampleData: Record<string, unknown>
}

export const WEBHOOK_EVENT_CATALOG: Record<WebhookEvent, WebhookEventDefinition> = {
  'build.completed': {
    event: 'build.completed',
    description: 'A build job completed successfully.',
    dataSchema: BuildCompletedDataSchema,
    sampleData: {
      buildId: 'bld_abc123',
      projectId: 'proj_xyz789',
      userId: 'usr_abc123',
      durationMs: 12340,
      outputUrl: 'https://cdn.forjegames.com/builds/bld_abc123.rbxl',
      templateId: 'tpl_abc123',
      tokensUsed: 150,
    },
  },
  'build.failed': {
    event: 'build.failed',
    description: 'A build job failed.',
    dataSchema: BuildFailedDataSchema,
    sampleData: {
      buildId: 'bld_abc124',
      projectId: 'proj_xyz789',
      userId: 'usr_abc123',
      errorCode: 'SANDBOX_TIMEOUT',
      errorMessage: 'Build exceeded the 120s time limit.',
      tokensUsed: 50,
    },
  },
  'template.sold': {
    event: 'template.sold',
    description: 'A template was purchased by a user.',
    dataSchema: TemplateSoldDataSchema,
    sampleData: {
      templateId: 'tpl_abc123',
      templateName: 'City Block Pack v2',
      buyerId: 'usr_buyer001',
      sellerId: 'usr_abc123',
      priceCents: 999,
      earningsCents: 799,
      currency: 'USD',
    },
  },
  'template.reviewed': {
    event: 'template.reviewed',
    description: 'A moderator reviewed a template submission.',
    dataSchema: TemplateReviewedDataSchema,
    sampleData: {
      templateId: 'tpl_abc123',
      templateName: 'City Block Pack v2',
      reviewerId: 'usr_mod001',
      decision: 'approved',
      feedback: 'Looks great!',
    },
  },
  'token.low': {
    event: 'token.low',
    description: 'Token balance fell below 20% of plan quota.',
    dataSchema: TokenLowDataSchema,
    sampleData: {
      userId: 'usr_abc123',
      remainingTokens: 1000,
      planQuota: 10000,
      percentRemaining: 10,
    },
  },
  'token.depleted': {
    event: 'token.depleted',
    description: 'Token balance reached zero.',
    dataSchema: TokenDepletedDataSchema,
    sampleData: {
      userId: 'usr_abc123',
      planQuota: 10000,
      depletedAt: new Date().toISOString(),
    },
  },
  'subscription.changed': {
    event: 'subscription.changed',
    description: 'User subscription plan changed.',
    dataSchema: SubscriptionChangedDataSchema,
    sampleData: {
      userId: 'usr_abc123',
      previousPlan: 'starter',
      newPlan: 'pro',
      changeType: 'upgrade',
      effectiveAt: new Date().toISOString(),
    },
  },
  'team.member_joined': {
    event: 'team.member_joined',
    description: 'A new member joined a team.',
    dataSchema: TeamMemberJoinedDataSchema,
    sampleData: {
      teamId: 'team_abc123',
      teamName: 'Dream Builders',
      userId: 'usr_new001',
      userEmail: 'alice@example.com',
      role: 'member',
      invitedBy: 'usr_abc123',
      joinedAt: new Date().toISOString(),
    },
  },
  'achievement.unlocked': {
    event: 'achievement.unlocked',
    description: 'A user unlocked an achievement.',
    dataSchema: AchievementUnlockedDataSchema,
    sampleData: {
      userId: 'usr_abc123',
      achievementId: 'ach_first_build',
      achievementName: 'First Build',
      category: 'milestones',
      xpAwarded: 100,
      unlockedAt: new Date().toISOString(),
    },
  },
}

// ---------------------------------------------------------------------------
// Runtime validation helper
// ---------------------------------------------------------------------------

/**
 * Validate an event's data payload against its schema.
 * Returns { success, data } or { success: false, error }.
 */
export function validateEventData(
  event: WebhookEvent,
  data: unknown
): { success: true; data: Record<string, unknown> } | { success: false; error: z.ZodError } {
  const definition = WEBHOOK_EVENT_CATALOG[event]
  const result = definition.dataSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> }
  }
  return { success: false, error: result.error }
}
