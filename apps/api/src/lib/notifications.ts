/**
 * Server-side notification sender.
 * Creates DB records and delivers via SSE push (Redis pub/sub) + optional email.
 *
 * Priority tiers:
 *  critical — immediate push
 *  high     — push within 1 min (still immediate in practice; flag for future queue)
 *  medium   — batched hourly digest
 *  low      — daily digest
 */

import { db } from './db'
import { redis } from './redis'
import type { NotificationType } from '@prisma/client'

// ─── Types ──────────────────────────────────────────────────────────────────

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

export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  body: string
  read: boolean
  actionUrl: string | null
  createdAt: Date
}

// ─── Channel routing ─────────────────────────────────────────────────────────

/**
 * Map notification type → delivery channels.
 * "sse"   — in-app real-time push via Server-Sent Events
 * "email" — send an email (future: queue to email service)
 */
function resolveChannels(type: NotificationType, priority: NotificationPriority): string[] {
  const channels: string[] = ['sse'] // always deliver in-app

  // Email for high-signal events
  const emailTypes: NotificationType[] = [
    'SALE',
    'TEAM_INVITE',
    'REFERRAL_EARNED',
    'TOKEN_DEPLETED',
    'BUILD_COMPLETE',
    'ACHIEVEMENT_UNLOCKED',
  ]

  if (emailTypes.includes(type) || priority === 'critical') {
    channels.push('email')
  }

  return channels
}

// ─── Redis pub/sub key ───────────────────────────────────────────────────────

export function userNotificationChannel(userId: string) {
  return `notif:user:${userId}`
}

// ─── Core sender ─────────────────────────────────────────────────────────────

/**
 * Create a notification record and push it to all resolved channels.
 * Returns the created notification.
 */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  actionUrl,
  metadata,
  priority = 'medium',
}: SendNotificationOptions): Promise<NotificationRecord> {
  // 1. Persist to DB
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl: actionUrl ?? null,
    },
  })

  const channels = resolveChannels(type, priority)

  // 2. SSE push via Redis pub/sub
  if (channels.includes('sse')) {
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
    // Fire and forget — SSE delivery is best-effort
    redis.publish(userNotificationChannel(userId), payload).catch((err) => {
      console.error('[notifications] Redis publish failed:', err)
    })
  }

  // 3. Email channel — delegate to email service (best-effort, non-blocking)
  if (channels.includes('email')) {
    queueEmailNotification({ userId, type, title, body, actionUrl, metadata }).catch((err) => {
      console.error('[notifications] Email queue failed:', err)
    })
  }

  return notification
}

/**
 * Send the same notification to multiple users in parallel.
 * Internally batches DB inserts and pub/sub publishes.
 */
export async function sendBulkNotifications(
  userIds: string[],
  options: Omit<SendNotificationOptions, 'userId'>
): Promise<void> {
  if (userIds.length === 0) return

  const { type, title, body, actionUrl, metadata, priority = 'medium' } = options
  const channels = resolveChannels(type, priority)

  // Batch DB inserts
  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      actionUrl: actionUrl ?? null,
    })),
    skipDuplicates: true,
  })

  // Fetch created records for the SSE payload
  const created = await db.notification.findMany({
    where: {
      userId: { in: userIds },
      type,
      title,
      body,
      // Approximate "just created" — within last 5 seconds
      createdAt: { gte: new Date(Date.now() - 5000) },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Push to each user's channel
  if (channels.includes('sse')) {
    const publishPromises = created.map((notif) => {
      const payload = JSON.stringify({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        actionUrl: notif.actionUrl,
        createdAt: notif.createdAt.toISOString(),
        read: false,
        metadata: metadata ?? null,
      })
      return redis.publish(userNotificationChannel(notif.userId), payload).catch((err) => {
        console.error('[notifications] Redis bulk publish failed:', err)
      })
    })
    await Promise.allSettled(publishPromises)
  }
}

// ─── Convenience typed senders ───────────────────────────────────────────────

export async function notifyBuildComplete(userId: string, opts: {
  mode: string
  prompt: string
  tokensSpent: number
  durationMs: number
}) {
  return sendNotification({
    userId,
    type: 'BUILD_COMPLETE',
    title: 'Build complete',
    body: `Your ${opts.mode} build "${opts.prompt.slice(0, 60)}" finished in ${Math.round(opts.durationMs / 1000)}s.`,
    actionUrl: '/dashboard',
    metadata: opts,
    priority: 'high',
  })
}

export async function notifyBuildFailed(userId: string, opts: {
  mode: string
  prompt: string
  error: string
}) {
  return sendNotification({
    userId,
    type: 'BUILD_FAILED',
    title: 'Build failed',
    body: `Your ${opts.mode} build encountered an error: ${opts.error.slice(0, 100)}`,
    actionUrl: '/dashboard',
    metadata: opts,
    priority: 'high',
  })
}

export async function notifyTemplateSold(creatorUserId: string, opts: {
  templateTitle: string
  amountCents: number
  buyerName?: string
}) {
  const dollars = (opts.amountCents / 100).toFixed(2)
  return sendNotification({
    userId: creatorUserId,
    type: 'SALE',
    title: 'Template sold',
    body: `"${opts.templateTitle}" was purchased for $${dollars}.${opts.buyerName ? ` Buyer: ${opts.buyerName}` : ''}`,
    actionUrl: '/earnings',
    metadata: opts,
    priority: 'high',
  })
}

export async function notifyTokenLow(userId: string, balance: number) {
  return sendNotification({
    userId,
    type: 'TOKEN_LOW',
    title: 'Token balance low',
    body: `You have ${balance} tokens remaining. Top up to keep building.`,
    actionUrl: '/pricing',
    metadata: { balance },
    priority: 'critical',
  })
}

export async function notifyTokenDepleted(userId: string) {
  return sendNotification({
    userId,
    type: 'TOKEN_DEPLETED',
    title: 'Tokens depleted',
    body: 'You have no tokens left. Purchase more to continue generating.',
    actionUrl: '/pricing',
    priority: 'critical',
  })
}

export async function notifyAchievementUnlocked(userId: string, opts: {
  name: string
  description: string
  xpReward: number
  icon: string
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

export async function notifyTeamInvite(inviteeUserId: string, opts: {
  teamName: string
  inviterName: string
  inviteToken: string
  role: string
}) {
  return sendNotification({
    userId: inviteeUserId,
    type: 'TEAM_INVITE',
    title: `Team invite: ${opts.teamName}`,
    body: `${opts.inviterName} invited you to join "${opts.teamName}" as ${opts.role.toLowerCase()}.`,
    actionUrl: `/team/join/${opts.inviteToken}`,
    metadata: opts,
    priority: 'high',
  })
}

export async function notifyReferralConverted(referrerUserId: string, opts: {
  commissionCents: number
}) {
  const dollars = (opts.commissionCents / 100).toFixed(2)
  return sendNotification({
    userId: referrerUserId,
    type: 'REFERRAL_EARNED',
    title: 'Referral converted',
    body: `Someone signed up with your referral link. You earned $${dollars}.`,
    actionUrl: '/dashboard',
    metadata: opts,
    priority: 'medium',
  })
}

// ─── Email queue ────────────────────────────────────────────────────────────────

/**
 * Queue an email notification by type.
 * Maps notification types to their corresponding email template functions.
 * This should be called asynchronously and is best-effort — failures are logged but not thrown.
 */
async function queueEmailNotification(opts: {
  userId: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: opts.userId },
      select: { email: true, displayName: true },
    })
    if (!user?.email) return

    // Lazy-load email functions to avoid circular dependencies
    const {
      sendBuildCompleteEmail,
      sendTokenLowEmail,
      sendParentalConsentEmail,
    } = await import('./email')

    const metadata = opts.metadata as Record<string, unknown> | undefined

    switch (opts.type) {
      case 'BUILD_COMPLETE':
        await sendBuildCompleteEmail({
          email: user.email,
          buildType: String(metadata?.mode ?? 'map'),
          buildName: String(metadata?.prompt ?? 'Untitled').slice(0, 60),
          buildId: String(metadata?.buildId ?? ''),
          thumbnailUrl: metadata?.thumbnailUrl ? String(metadata.thumbnailUrl) : undefined,
        })
        break

      case 'TOKEN_LOW':
        await sendTokenLowEmail({
          email: user.email,
          name: user.displayName || 'Creator',
          tokenCount: Number(metadata?.balance ?? 0),
        })
        break

      case 'SALE':
      case 'TEAM_INVITE':
      case 'REFERRAL_EARNED':
      case 'ACHIEVEMENT_UNLOCKED':
      case 'TOKEN_DEPLETED':
      case 'BUILD_FAILED':
        // These notifications don't have email templates yet
        break
    }
  } catch (err) {
    console.error('[notifications] queueEmailNotification failed:', err)
  }
}
