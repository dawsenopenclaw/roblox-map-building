/**
 * Next.js-side notification sender (server components / API routes / webhooks).
 * Mirrors apps/api/src/lib/notifications.ts but uses the Next.js-scoped
 * Prisma and Redis singletons from @/lib/db and @/lib/redis.
 *
 * This avoids cross-app import boundaries and circular dependencies.
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

export function userNotificationChannel(userId: string) {
  return `notif:user:${userId}`
}

/**
 * Create a notification record and push via SSE (Redis pub/sub).
 */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  actionUrl,
  metadata,
  priority = 'medium',
}: SendNotificationOptions) {
  void priority // reserved for future queue routing

  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl: actionUrl ?? null,
    },
  })

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

  redis.publish(userNotificationChannel(userId), payload).catch((err) => {
    console.error('[notifications-client] Redis publish failed:', err)
  })

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

export async function notifyTeamInviteClient(inviteeUserId: string, opts: {
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

export async function notifyReferralConvertedClient(referrerUserId: string, opts: {
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
