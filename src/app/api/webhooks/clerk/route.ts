import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import * as Sentry from '@sentry/nextjs'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

type ClerkUserEvent = {
  type: string
  data: {
    // `id` is optional on user.deleted events fired from the Clerk dashboard
    id: string | undefined
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string
    created_at: number
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  let event: ClerkUserEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // Idempotency gate — check the svix-id before any event-specific processing.
    // Svix retries deliver the same svix-id, so a hit here means the event was
    // already fully processed and we can safely short-circuit.
    const alreadyProcessed = await db.auditLog.findFirst({
      where: { action: 'CLERK_WEBHOOK_PROCESSED', resourceId: svixId },
      select: { id: true },
    })
    if (alreadyProcessed) {
      console.warn('[clerk-webhook] duplicate svix-id — skipping', { svixId, eventType: event.type })
      return NextResponse.json({ ok: true })
    }

    if (event.type === 'user.created') {
      const clerkId = event.data.id
      if (!clerkId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

      // Secondary guard: also check by clerkId to handle partially-committed
      // transactions that never recorded the processed-webhook audit entry.
      const existing = await db.user.findUnique({ where: { clerkId } })
      if (existing) {
        console.warn('[clerk-webhook] user.created already processed — skipping duplicate', { clerkId, svixId })
        return NextResponse.json({ ok: true })
      }

      const primaryEmail = event.data.email_addresses.find(
        (e) => e.id === event.data.primary_email_address_id
      )?.email_address
      if (!primaryEmail) return NextResponse.json({ error: 'No primary email' }, { status: 400 })

      await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            clerkId,
            email: primaryEmail,
            displayName:
              [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || null,
            avatarUrl: event.data.image_url,
          },
        })

        // Create FREE subscription
        await tx.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: `pending_${user.id}`, // updated when Stripe customer is created
            tier: 'FREE',
            status: 'ACTIVE',
          },
        })

        // Initialize token balance with 1000 free signup tokens.
        // Upsert guards against a race with onboarding/complete, which can also
        // create the row if the webhook fires after the user hits that endpoint.
        await tx.tokenBalance.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: 1000, lifetimeEarned: 1000 },
          update: {}, // already exists — first writer wins, leave balance untouched
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_CREATED',
            resource: 'user',
            resourceId: user.id,
            metadata: { source: 'clerk_webhook' },
          },
        })
      })

      // Send welcome email (fire and forget)
      sendWelcomeEmail({
        email: primaryEmail,
        name: event.data.first_name || 'Creator',
      }).catch((err) => {
        console.error('[clerk-webhook] Failed to send welcome email:', err)
      })
    }

    if (event.type === 'user.updated') {
      if (!event.data.id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

      const primaryEmail = event.data.email_addresses.find(
        (e) => e.id === event.data.primary_email_address_id
      )?.email_address

      // Guard against P2025 — Clerk may fire user.updated before user.created is
      // processed (race between webhook deliveries). Skip gracefully if the user
      // row doesn't exist yet; the next user.created delivery will create it.
      const existing = await db.user.findUnique({
        where: { clerkId: event.data.id },
        select: { id: true },
      })
      if (existing) {
        await db.user.update({
          where: { clerkId: event.data.id },
          data: {
            email: primaryEmail,
            displayName:
              [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || undefined,
            avatarUrl: event.data.image_url,
          },
        })
      } else {
        console.warn('[clerk-webhook] user.updated received before user.created — skipping', {
          clerkId: event.data.id,
          svixId,
        })
      }
    }

    if (event.type === 'user.deleted') {
      // Clerk may omit `data.id` when the deletion originates from the dashboard.
      // Guard against undefined before writing to the database.
      if (!event.data.id) {
        return NextResponse.json({ error: 'Missing user id in delete event' }, { status: 400 })
      }

      // GDPR/COPPA hard delete — nullify ALL PII and set deletedAt
      await db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { clerkId: event.data.id } })
        if (!user) return // Already deleted or never synced

        // Audit log BEFORE PII wipe so the record exists if the update fails
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_DELETED',
            resource: 'user',
            resourceId: user.id,
            metadata: { source: 'clerk_webhook', clerkId: event.data.id },
          },
        })

        await tx.user.update({
          where: { clerkId: event.data.id },
          data: {
            email: `deleted_${event.data.id}@deleted.invalid`,
            displayName: null,
            avatarUrl: null,
            parentEmail: null,
            parentConsentToken: null,
            parentConsentTokenExp: null,
            dateOfBirth: null,
            deletedAt: new Date(),
          },
        })
      })
    }

    // Mark this svix-id as fully processed so retries are no-ops.
    await db.auditLog.create({
      data: {
        action: 'CLERK_WEBHOOK_PROCESSED',
        resource: 'clerk_webhook',
        resourceId: svixId,
        metadata: { eventType: event.type },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[clerk-webhook] Unhandled error processing event', {
      eventType: event.type,
      svixId,
      error,
    })
    Sentry.captureException(error, {
      tags: { webhook: 'clerk', eventType: event.type },
      extra: { svixId },
    })
    // Transient infrastructure errors (DB connection, timeout) return 500 so Svix
    // retries delivery — the event was not processed. Permanent errors (bad data,
    // logic failures) return 200 to stop retry loops.
    const isTransient = /connect|timeout|ECONNREFUSED|P1001/i.test(message)
    if (isTransient) {
      return NextResponse.json({ error: 'transient_error' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
