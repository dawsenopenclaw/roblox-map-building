/**
 * RobloxForge Webhook Signature Verification Helper
 *
 * Copy this file into your project to verify incoming webhook signatures.
 * No external dependencies required — uses Node.js built-in `crypto`.
 *
 * Usage (Express / Hono / Fastify / raw Node):
 *
 *   import { verifyWebhookSignature } from './webhook-signature-verification'
 *
 *   app.post('/webhooks/robloxforge', express.raw({ type: 'application/json' }), (req, res) => {
 *     const isValid = verifyWebhookSignature({
 *       secret:    process.env.ROBLOXFORGE_WEBHOOK_SECRET!,
 *       signature: req.headers['x-robloxforge-signature'] as string,
 *       timestamp: req.headers['x-robloxforge-timestamp'] as string,
 *       rawBody:   req.body.toString('utf-8'),   // MUST be the raw, unparsed body string
 *     })
 *
 *     if (!isValid) return res.status(401).send('Invalid signature')
 *
 *     const event = JSON.parse(req.body)
 *     // process event.event, event.data ...
 *     res.status(200).send('ok')
 *   })
 *
 * IMPORTANT: Always read the raw body BEFORE calling JSON.parse.
 * Parsing and re-serializing changes whitespace and key ordering, breaking the signature.
 */

import { createHmac, timingSafeEqual } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerifyOptions {
  /** The shared secret you received when creating the webhook endpoint. */
  secret: string

  /**
   * Value of the `X-RobloxForge-Signature` header.
   * Format: `sha256=<64-char hex string>`
   */
  signature: string

  /**
   * Value of the `X-RobloxForge-Timestamp` header.
   * Unix epoch in seconds (string).
   */
  timestamp: string

  /**
   * The raw, unparsed request body as a UTF-8 string.
   * Do NOT JSON.parse() it first.
   */
  rawBody: string

  /**
   * Maximum age of the request in seconds before it is rejected.
   * Defaults to 300 (5 minutes). Set to 0 to disable replay protection.
   */
  toleranceSec?: number
}

// ---------------------------------------------------------------------------
// Core verification
// ---------------------------------------------------------------------------

/**
 * Verify a RobloxForge webhook signature.
 *
 * Returns `true` if the signature is valid and the request is not older than
 * `toleranceSec` seconds.  Returns `false` otherwise — treat as unauthorized.
 *
 * Security properties:
 *  - HMAC-SHA256 ensures payload integrity (tamper detection)
 *  - Timestamp binding prevents replay attacks
 *  - timingSafeEqual prevents timing-based signature enumeration
 */
export function verifyWebhookSignature(opts: VerifyOptions): boolean {
  const { secret, signature, timestamp, rawBody, toleranceSec = 300 } = opts

  // 1. Validate timestamp format
  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) return false

  // 2. Replay-attack guard
  if (toleranceSec > 0) {
    const nowSec = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSec - ts) > toleranceSec) return false
  }

  // 3. Reconstruct the expected signature
  //    Signing input format: "<timestamp>.<rawBody>"
  const signingInput = `${timestamp}.${rawBody}`
  const expectedHex = createHmac('sha256', secret).update(signingInput, 'utf-8').digest('hex')
  const expected = `sha256=${expectedHex}`

  // 4. Constant-time comparison (prevents timing attacks)
  if (expected.length !== signature.length) return false
  return timingSafeEqual(Buffer.from(expected, 'utf-8'), Buffer.from(signature, 'utf-8'))
}

// ---------------------------------------------------------------------------
// Webhook event types (mirror of server-side catalog)
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

export interface WebhookPayload<T = Record<string, unknown>> {
  /** Unique delivery ID — matches the X-RobloxForge-Delivery header */
  id: string
  /** Event name */
  event: WebhookEvent
  /** Schema version, currently always "v1" */
  version: 'v1'
  /** ISO-8601 UTC timestamp */
  createdAt: string
  /** Event-specific data */
  data: T
}

// ---------------------------------------------------------------------------
// Typed data shapes for each event
// ---------------------------------------------------------------------------

export interface BuildCompletedData {
  buildId: string
  projectId: string
  userId: string
  durationMs: number
  outputUrl?: string
  templateId?: string
  tokensUsed: number
}

export interface BuildFailedData {
  buildId: string
  projectId: string
  userId: string
  errorCode: string
  errorMessage: string
  tokensUsed: number
}

export interface TemplateSoldData {
  templateId: string
  templateName: string
  buyerId: string
  sellerId: string
  priceCents: number
  earningsCents: number
  currency: string
}

export interface TemplateReviewedData {
  templateId: string
  templateName: string
  reviewerId: string
  decision: 'approved' | 'rejected' | 'changes_requested'
  feedback?: string
}

export interface TokenLowData {
  userId: string
  remainingTokens: number
  planQuota: number
  percentRemaining: number
}

export interface TokenDepletedData {
  userId: string
  planQuota: number
  depletedAt: string
}

export interface SubscriptionChangedData {
  userId: string
  previousPlan: string
  newPlan: string
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'trial_started'
  effectiveAt: string
  billingCycleEnd?: string
}

export interface TeamMemberJoinedData {
  teamId: string
  teamName: string
  userId: string
  userEmail: string
  role: string
  invitedBy?: string
  joinedAt: string
}

export interface AchievementUnlockedData {
  userId: string
  achievementId: string
  achievementName: string
  category: string
  xpAwarded: number
  unlockedAt: string
}

// ---------------------------------------------------------------------------
// Request headers reference
// ---------------------------------------------------------------------------

/**
 * Headers sent with every webhook delivery:
 *
 * X-RobloxForge-Signature      sha256=<hmac-hex>
 * X-RobloxForge-Timestamp      Unix epoch seconds (string)
 * X-RobloxForge-Event          e.g. "build.completed"
 * X-RobloxForge-Delivery       Unique delivery ID (matches payload.id)
 * X-RobloxForge-Idempotency-Key  Stable key per delivery attempt group — use for dedup
 * X-RobloxForge-Attempt        Attempt number (1 = first, 2 = first retry, …)
 * User-Agent                   RobloxForge-Webhooks/1.0
 *
 * Retry schedule (on non-2xx or timeout):
 *   Attempt 1 — immediate
 *   Attempt 2 — after 10 seconds
 *   Attempt 3 — after 60 seconds
 *   Attempt 4 — after 300 seconds
 *   After attempt 4 — delivery is dead-lettered, no more retries
 *
 * Use X-RobloxForge-Idempotency-Key to detect and discard duplicate deliveries.
 */
export const WEBHOOK_HEADERS = {
  SIGNATURE: 'x-robloxforge-signature',
  TIMESTAMP: 'x-robloxforge-timestamp',
  EVENT: 'x-robloxforge-event',
  DELIVERY: 'x-robloxforge-delivery',
  IDEMPOTENCY_KEY: 'x-robloxforge-idempotency-key',
  ATTEMPT: 'x-robloxforge-attempt',
} as const
