/**
 * Next.js-side notification sender (server components / API routes / webhooks).
 * Persists to DB, pushes via Redis SSE, dispatches email/SMS based on user prefs.
 * Gracefully degrades if DB/Redis aren't reachable.
 */

import { db } from './db'
import { redis } from './redis'
import type { NotificationType } from '@prisma/client'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface SendNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  priority?: NotificationPriority
}

function userChannel(userId: string) {
  return `notif:user:${userId}`
}

/**
 * Create a notification record and push via enabled channels.
 */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  actionUrl,
  metadata,
}: SendNotificationOptions) {
  // 1. Persist to DB
  const notification = await db.notification.create({
    data: { userId, type, title, body, actionUrl: actionUrl ?? null },
  })

  // 2. Resolve enabled channels
  let channels: string[] = ['IN_APP']
  try {
    const { getEnabledChannels } = await import('./notification-preferences')
    channels = await getEnabledChannels(userId, type)
  } catch {
    // Preference engine not ready — default to in-app only
  }

  // 3. SSE push via Redis pub/sub
  if (channels.includes('IN_APP')) {
    const payload = JSON.stringify({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt.toISOString(),
      read: false,
      metadata: metadata ?? null,
    })
    redis.publish(userChannel(userId), payload).catch(() => {})
  }

  // 4. Email
  if (channels.includes('EMAIL')) {
    dispatchEmail({ userId, type, title, body, metadata }).catch((err) => {
      console.error('[notifications-client] Email failed:', err)
    })
  }

  // 5. SMS
  if (channels.includes('SMS')) {
    dispatchSMS({ userId, title, body }).catch((err) => {
      console.error('[notifications-client] SMS failed:', err)
    })
  }

  return notification
}

// ─── Typed convenience senders ───────────────────────────────────────────────

export async function notifyTemplateSoldClient(creatorUserId: string, opts: {
  templateTitle: string
  amountCents: number
}) {
  return sendNotification({
    userId: creatorUserId,
    type: 'SALE',
    title: 'Template sold',
    body: `"${opts.templateTitle}" was purchased for $${(opts.amountCents / 100).toFixed(2)}.`,
    actionUrl: '/earnings',
    metadata: opts,
    priority: 'high',
  })
}

export async function notifyAchievementUnlockedClient(userId: string, opts: {
  name: string
  description: string
  xpReward: number
}) {
  return sendNotification({
    userId,
    type: 'ACHIEVEMENT_UNLOCKED',
    title: `Achievement unlocked: ${opts.name}`,
    body: `${opts.description} (+${opts.xpReward} XP)`,
    actionUrl: '/dashboard',
    metadata: opts,
    priority: 'medium',
  })
}

// ─── Email dispatch ──────────────────────────────────────────────────────────

async function dispatchEmail(opts: {
  userId: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
}) {
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, displayName: true },
  })
  if (!user?.email) return

  const { sendBuildCompleteEmail, sendTokenLowEmail } = await import('./email')
  const meta = opts.metadata as Record<string, unknown> | undefined

  switch (opts.type) {
    case 'BUILD_COMPLETE':
      await sendBuildCompleteEmail({
        email: user.email,
        buildType: String(meta?.mode ?? 'map'),
        buildName: String(meta?.prompt ?? 'Untitled').slice(0, 60),
        buildId: String(meta?.buildId ?? ''),
        thumbnailUrl: meta?.thumbnailUrl ? String(meta.thumbnailUrl) : undefined,
      })
      break
    case 'TOKEN_LOW':
      await sendTokenLowEmail({
        email: user.email,
        name: user.displayName || 'Creator',
        tokenCount: Number(meta?.balance ?? 0),
      })
      break
  }
}

// ─── SMS dispatch ────────────────────────────────────────────────────────────

async function dispatchSMS(opts: {
  userId: string
  title: string
  body: string
}) {
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: { phone: true },
  })
  if (!user?.phone) return

  const { sendSMS } = await import('./sms')
  const message = `ForjeGames: ${opts.title} — ${opts.body}`.slice(0, 155)
  await sendSMS({ to: user.phone, body: message })
}
