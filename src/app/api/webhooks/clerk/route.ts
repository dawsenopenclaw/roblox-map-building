import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

type ClerkUserEvent = {
  type: string
  data: {
    id: string
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

  if (event.type === 'user.created') {
    const primaryEmail = event.data.email_addresses.find(
      (e) => e.id === event.data.primary_email_address_id
    )?.email_address
    if (!primaryEmail) return NextResponse.json({ error: 'No primary email' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          clerkId: event.data.id,
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

      // Initialize token balance with 100 free signup tokens
      await tx.tokenBalance.create({
        data: { userId: user.id, balance: 100, lifetimeEarned: 100 },
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
  }

  if (event.type === 'user.updated') {
    const primaryEmail = event.data.email_addresses.find(
      (e) => e.id === event.data.primary_email_address_id
    )?.email_address
    await db.user.update({
      where: { clerkId: event.data.id },
      data: {
        email: primaryEmail,
        displayName:
          [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || undefined,
        avatarUrl: event.data.image_url,
      },
    })
  }

  if (event.type === 'user.deleted') {
    // Soft delete — preserves audit trail and relational data
    await db.user.update({
      where: { clerkId: event.data.id },
      data: { email: `deleted_${event.data.id}@deleted.invalid` },
    })
  }

  return NextResponse.json({ ok: true })
}
