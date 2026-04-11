/**
 * POST /api/webhooks/roblox
 *
 * Webhook endpoint that receives purchase confirmations from the ForjeGames
 * Roblox experience.  When a player purchases a GamePass or DevProduct
 * in-game, the Lua script sends a POST here with purchase details.
 *
 * The endpoint:
 *   1. Verifies the request using the shared webhook secret
 *   2. Matches the Roblox user to a ForjeGames account
 *   3. Credits the user's token/credit balance
 *   4. Updates the pending purchase audit log entry
 *
 * Body (from Lua HttpService):
 *   {
 *     type:           'gamepass_purchase' | 'devproduct_purchase'
 *     robloxUserId:   number
 *     robloxUsername?: string
 *     tier:           string
 *     gamePassId?:    number
 *     productId?:     number
 *     purchaseId?:    string
 *     timestamp:      number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ── Robux credit amounts (must match billing/robux route) ───────────────────

const ROBUX_CREDITS: Record<string, number> = {
  starter: 500,
  pro: 1200,
  studio: 3500,
  credits_100: 100,
  credits_500: 500,
}

// ── Validation ──────────────────────────────────────────────────────────────

const webhookSchema = z.object({
  type: z.enum(['gamepass_purchase', 'devproduct_purchase']),
  robloxUserId: z.number().int().positive(),
  robloxUsername: z.string().optional(),
  tier: z.string(),
  gamePassId: z.number().optional(),
  productId: z.number().optional(),
  purchaseId: z.string().optional(),
  timestamp: z.number(),
})

// ── Webhook secret verification ─────────────────────────────────────────────

function verifyWebhookSecret(req: NextRequest): boolean {
  // Standardized env var name is ROBUX_WEBHOOK_SECRET (matches .env.example
  // and the /api/payments/robux/link endpoint). Fall back to the legacy
  // ROBLOX_WEBHOOK_SECRET name for back-compat with older deployments.
  const secret =
    process.env.ROBUX_WEBHOOK_SECRET ?? process.env.ROBLOX_WEBHOOK_SECRET
  if (!secret) {
    // In development, allow unsigned requests with a warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('[roblox-webhook] ROBUX_WEBHOOK_SECRET not set — allowing unsigned request in dev')
      return true
    }
    return false
  }

  // The Lua script should send the secret as a header
  const headerSecret = req.headers.get('x-roblox-webhook-secret')
  if (!headerSecret) return false

  // Constant-time comparison to prevent timing attacks
  if (secret.length !== headerSecret.length) return false
  let mismatch = 0
  for (let i = 0; i < secret.length; i++) {
    mismatch |= secret.charCodeAt(i) ^ headerSecret.charCodeAt(i)
  }
  return mismatch === 0
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // FAIL-SAFE: The Lua client (packages/studio-plugin/RobuxPayment.lua) ships
  // with a stubbed `hmacSign` that returns the raw secret, which both breaks
  // the signature check AND leaks the secret on every request. Until a real
  // HMAC implementation lands, refuse this webhook in production to prevent
  // silent credit loss and forged purchases. See the big WARNING block in
  // RobuxPayment.lua for details.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        error: 'Robux webhook temporarily disabled',
        reason: 'hmac_not_implemented',
      },
      { status: 503 },
    )
  }

  // Verify webhook authenticity
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  let body: z.infer<typeof webhookSchema>
  try {
    const raw = await req.json()
    const parsed = webhookSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('[roblox-webhook] Invalid payload:', parsed.error.flatten())
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const credits = ROBUX_CREDITS[body.tier]
  if (!credits) {
    console.error('[roblox-webhook] Unknown tier:', body.tier)
    return NextResponse.json({ error: 'Unknown tier' }, { status: 400 })
  }

  try {
    const { db } = await import('@/lib/db')
    const { earnTokens } = await import('@/lib/tokens-server')

    // Idempotency gate — serializable transaction + conditional check prevents
    // concurrent deliveries of the same purchase from both passing the guard
    // and double-crediting. We look for an existing marker first and then
    // insert a reservation row in the same tx. Conflicting concurrent calls
    // will serialization-fail and be treated as duplicates.
    const idemKey = body.type === 'gamepass_purchase' && body.gamePassId
      ? `${body.robloxUserId}_${body.gamePassId}`
      : null

    if (body.type === 'devproduct_purchase' && body.purchaseId) {
      try {
        const firstDelivery = await db.$transaction(
          async (tx) => {
            const existing = await tx.auditLog.findFirst({
              where: {
                action: 'ROBUX_PURCHASE_COMPLETED',
                metadata: { path: ['purchaseId'], equals: body.purchaseId },
              },
              select: { id: true },
            })
            if (existing) return false
            // Reserve the idempotency slot immediately so concurrent deliveries
            // either see this row or hit a serialization failure.
            await tx.auditLog.create({
              data: {
                action: 'ROBUX_PURCHASE_RESERVED',
                resource: 'robux',
                resourceId: `reserve_${body.purchaseId}`,
                metadata: { purchaseId: body.purchaseId, tier: body.tier },
              },
            })
            return true
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        )
        if (!firstDelivery) {
          console.info('[roblox-webhook] Duplicate purchaseId, skipping:', body.purchaseId)
          return NextResponse.json({ received: true, duplicate: true })
        }
      } catch (err) {
        const code = (err as { code?: string } | null)?.code
        if (code === 'P2034' || /40001|serialization/i.test(String(err))) {
          return NextResponse.json({ received: true, duplicate: true })
        }
        throw err
      }
    }

    // For GamePass purchases, check by a composite key of robloxUserId +
    // gamePassId. The previous implementation keyed on gamePassId alone,
    // which meant once any user bought a given GamePass, every subsequent
    // purchase of the same GamePass by a DIFFERENT user was silently
    // dropped as a "duplicate". We store the composite on the audit log
    // row below as `gamePassIdemKey` and look it up here.
    if (body.type === 'gamepass_purchase' && body.gamePassId && idemKey) {
      try {
        const firstDelivery = await db.$transaction(
          async (tx) => {
            const existing = await tx.auditLog.findFirst({
              where: {
                action: 'ROBUX_PURCHASE_COMPLETED',
                metadata: { path: ['gamePassIdemKey'], equals: idemKey },
              },
              select: { id: true },
            })
            if (existing) return false
            await tx.auditLog.create({
              data: {
                action: 'ROBUX_PURCHASE_RESERVED',
                resource: 'robux',
                resourceId: `reserve_${idemKey}`,
                metadata: { gamePassIdemKey: idemKey, tier: body.tier },
              },
            })
            return true
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        )
        if (!firstDelivery) {
          console.info('[roblox-webhook] Duplicate gamepass purchase, skipping:', idemKey)
          return NextResponse.json({ received: true, duplicate: true })
        }
      } catch (err) {
        const code = (err as { code?: string } | null)?.code
        if (code === 'P2034' || /40001|serialization/i.test(String(err))) {
          return NextResponse.json({ received: true, duplicate: true })
        }
        throw err
      }
    }

    // Find the ForjeGames user linked to this Roblox account.
    // Users link their Roblox account via the settings page, which stores
    // the robloxUserId on the user record. We OR in robloxUsername as a
    // secondary match, but only when the payload actually includes one —
    // otherwise a null username would match every user whose robloxUsername
    // column is NULL.
    const userOrClauses: Prisma.UserWhereInput[] = [
      { robloxUserId: String(body.robloxUserId) },
    ]
    if (body.robloxUsername && body.robloxUsername.length > 0) {
      userOrClauses.push({ robloxUsername: body.robloxUsername })
    }
    const user = await db.user.findFirst({
      where: { OR: userOrClauses },
      select: { id: true, clerkId: true },
    })

    if (!user) {
      // No linked account found -- store the purchase for later claim
      await db.auditLog.create({
        data: {
          action: 'ROBUX_PURCHASE_UNCLAIMED',
          resource: 'robux',
          resourceId: `${body.robloxUserId}_${body.tier}_${body.timestamp}`,
          metadata: {
            ...body,
            credits,
            status: 'unclaimed',
          },
        },
      })
      console.warn('[roblox-webhook] No linked user for robloxUserId:', body.robloxUserId)
      return NextResponse.json({ received: true, status: 'unclaimed' })
    }

    // Credit the user's token balance
    await earnTokens(
      user.id,
      credits,
      'PURCHASE',
      `Robux purchase: ${body.tier} (${credits} credits)`,
      {
        source: 'robux',
        robloxUserId: body.robloxUserId,
        robloxUsername: body.robloxUsername,
        tier: body.tier,
        purchaseId: body.purchaseId,
        gamePassId: body.gamePassId,
        productId: body.productId,
      },
    )

    // Record the completed purchase. `gamePassIdemKey` is a composite of
    // robloxUserId + gamePassId and is the key we use for GamePass
    // idempotency checks above — see the comment on the duplicate-check
    // block.
    const gamePassIdemKey = body.gamePassId
      ? `${body.robloxUserId}_${body.gamePassId}`
      : undefined
    await db.auditLog.create({
      data: {
        action: 'ROBUX_PURCHASE_COMPLETED',
        resource: 'robux',
        resourceId: `${body.robloxUserId}_${body.tier}_${body.timestamp}`,
        userId: user.id,
        metadata: {
          ...body,
          credits,
          forjeUserId: user.id,
          status: 'completed',
          purchaseId: body.purchaseId,
          gamePassId: body.gamePassId,
          gamePassIdemKey,
        },
      },
    })

    // Update any pending purchase audit logs to 'completed' for polling
    await db.auditLog.updateMany({
      where: {
        action: 'ROBUX_PURCHASE_INITIATED',
        userId: user.id,
        metadata: { path: ['tier'], equals: body.tier },
      },
      data: {
        metadata: {
          tier: body.tier,
          credits,
          robloxUserId: body.robloxUserId,
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      },
    })

    console.info('[roblox-webhook] Purchase credited:', {
      userId: user.id,
      tier: body.tier,
      credits,
      robloxUserId: body.robloxUserId,
    })

    return NextResponse.json({ received: true, status: 'credited' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[roblox-webhook] Error processing purchase:', message)
    Sentry.captureException(err, {
      tags: { webhook: 'roblox', type: body.type },
      extra: { robloxUserId: body.robloxUserId, tier: body.tier },
    })

    // Return 500 so the Lua script knows to retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
