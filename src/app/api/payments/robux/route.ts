/**
 * POST /api/payments/robux
 *
 * Webhook handler for Robux purchases. The ForjeGames Roblox experience
 * sends a POST here after a player purchases a GamePass or DevProduct.
 *
 * Body (from Lua HttpService):
 *   {
 *     robloxUserId:   number
 *     productId:      string   -- "forje_100_credits" | "forje_500_credits" | "forje_1000_credits"
 *     purchaseToken:  string   -- unique purchase ID from Roblox
 *     amount:         number   -- Robux amount paid
 *   }
 *
 * Auth: HMAC-SHA256 signature in X-Forje-Signature header using shared secret.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createHmac, timingSafeEqual } from 'crypto'

// ── Credit mapping ──────────────────────────────────────────────────────────

const ROBUX_PRODUCT_MAP: Record<string, { credits: number; robux: number }> = {
  // Aligned with main pricing tiers ($10/$50/$200 = 2860/14300/57200 R$)
  forje_starter:        { credits: 5000,   robux: 2860  },   // Starter — $10/mo
  forje_creator:        { credits: 30000,  robux: 14300 },   // Creator — $50/mo
  forje_studio:         { credits: 150000, robux: 57200 },   // Studio — $200/mo
  // One-time DevProduct top-ups
  forje_credits_2500:   { credits: 2500,   robux: 1430  },   // $5
  forje_credits_15000:  { credits: 15000,  robux: 7150  },   // $25
  // Legacy keys (kept for backward compatibility with existing purchases)
  forje_100_credits:    { credits: 100,    robux: 2860  },
  forje_500_credits:    { credits: 500,    robux: 12500 },
  forje_1000_credits:   { credits: 1000,   robux: 22000 },
}

// ── Validation ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  robloxUserId: z.number().int().positive(),
  productId: z.string(),
  purchaseToken: z.string().min(1),
  amount: z.number().int().positive(),
})

// ── HMAC verification ───────────────────────────────────────────────────────

function verifyHmacSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.ROBUX_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[payments/robux] ROBUX_WEBHOOK_SECRET not set — allowing unsigned request in dev')
      return true
    }
    return false
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  // Constant-time comparison
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Read raw body for HMAC verification
  const rawBody = await req.text()
  const signature = req.headers.get('x-forje-signature') ?? ''

  if (!verifyHmacSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse body
  let body: z.infer<typeof bodySchema>
  try {
    const parsed = bodySchema.safeParse(JSON.parse(rawBody))
    if (!parsed.success) {
      console.error('[payments/robux] Invalid payload:', parsed.error.flatten())
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate productId
  const product = ROBUX_PRODUCT_MAP[body.productId]
  if (!product) {
    console.error('[payments/robux] Unknown productId:', body.productId)
    return NextResponse.json({ error: 'Unknown productId' }, { status: 400 })
  }

  try {
    const { db } = await import('@/lib/db')
    const { earnTokens } = await import('@/lib/tokens-server')

    // ── Idempotency: prevent double-processing via purchaseToken ────────
    const existing = await db.auditLog.findFirst({
      where: {
        action: 'ROBUX_PURCHASE_COMPLETED',
        metadata: { path: ['purchaseToken'], equals: body.purchaseToken },
      },
      select: { id: true },
    })
    if (existing) {
      console.info('[payments/robux] Duplicate purchaseToken, skipping:', body.purchaseToken)
      return NextResponse.json({ success: true, duplicate: true, creditsAdded: 0 })
    }

    // ── Find linked user ────────────────────────────────────────────────
    const user = await db.user.findFirst({
      where: { robloxUserId: String(body.robloxUserId) },
      select: { id: true, clerkId: true },
    })

    if (!user) {
      // Store unclaimed purchase for later when user links their account
      await db.auditLog.create({
        data: {
          action: 'ROBUX_PURCHASE_UNCLAIMED',
          resource: 'robux',
          resourceId: `${body.robloxUserId}_${body.productId}_${body.purchaseToken}`,
          metadata: {
            ...body,
            credits: product.credits,
            status: 'unclaimed',
          },
        },
      })
      console.warn('[payments/robux] No linked user for robloxUserId:', body.robloxUserId)
      return NextResponse.json({ success: true, status: 'unclaimed', creditsAdded: 0 })
    }

    // ── Credit the user ─────────────────────────────────────────────────
    await earnTokens(
      user.id,
      product.credits,
      'PURCHASE',
      `Robux purchase: ${body.productId} (${product.credits} credits)`,
      {
        source: 'robux',
        robloxUserId: body.robloxUserId,
        productId: body.productId,
        purchaseToken: body.purchaseToken,
        robuxAmount: body.amount,
      },
    )

    // ── Record completed purchase ───────────────────────────────────────
    await db.auditLog.create({
      data: {
        action: 'ROBUX_PURCHASE_COMPLETED',
        resource: 'robux',
        resourceId: `${body.robloxUserId}_${body.productId}_${body.purchaseToken}`,
        userId: user.id,
        metadata: {
          ...body,
          credits: product.credits,
          forjeUserId: user.id,
          purchaseToken: body.purchaseToken,
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      },
    })

    console.info('[payments/robux] Purchase credited:', {
      userId: user.id,
      productId: body.productId,
      credits: product.credits,
      robloxUserId: body.robloxUserId,
    })

    return NextResponse.json({
      success: true,
      creditsAdded: product.credits,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[payments/robux] Error processing purchase:', message)
    Sentry.captureException(err, {
      tags: { webhook: 'robux-payment', productId: body.productId },
      extra: { robloxUserId: body.robloxUserId, purchaseToken: body.purchaseToken },
    })

    // Return 500 so the Lua script knows to retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
