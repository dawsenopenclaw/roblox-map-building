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

export async function notifyTeamInvite(userId: string, opts: {
  teamName: string
  inviterName: string
  inviteToken: string
}) {
  return sendNotification({
    userId,
    type: 'TEAM_INVITE',
    title: `Team invite: ${opts.teamName}`,
    body: `${opts.inviterName} invited you to join "${opts.teamName}".`,
    actionUrl: `/teams/invite?token=${opts.inviteToken}`,
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
    actionUrl: '/tokens',
    metadata: { balance },
    priority: 'high',
  })
}

export async function notifyTokenDepleted(userId: string) {
  return sendNotification({
    userId,
    type: 'TOKEN_DEPLETED',
    title: 'Tokens depleted',
    body: 'You have run out of tokens. Purchase more to continue generating.',
    actionUrl: '/tokens',
    priority: 'critical',
  })
}

export async function notifyReviewReceived(userId: string, opts: {
  templateTitle: string
  rating: number
  reviewerName?: string
}) {
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating)
  return sendNotification({
    userId,
    type: 'REVIEW_RECEIVED',
    title: `New review: ${stars}`,
    body: `${opts.reviewerName ?? 'Someone'} left a ${opts.rating}-star review on "${opts.templateTitle}".`,
    actionUrl: '/marketplace',
    metadata: opts,
    priority: 'medium',
  })
}

export async function notifyPayoutCompleted(userId: string, amountCents: number) {
  return sendNotification({
    userId,
    type: 'PAYOUT_COMPLETED',
    title: 'Payout completed',
    body: `$${(amountCents / 100).toFixed(2)} has been transferred to your connected bank account.`,
    actionUrl: '/earnings',
    metadata: { amountCents },
    priority: 'high',
  })
}

export async function notifyPayoutFailed(userId: string, amountCents: number) {
  return sendNotification({
    userId,
    type: 'PAYOUT_FAILED',
    title: 'Payout failed',
    body: `A payout of $${(amountCents / 100).toFixed(2)} could not be processed. Check your connected account.`,
    actionUrl: '/earnings',
    metadata: { amountCents },
    priority: 'critical',
  })
}

export async function notifySystemAnnouncement(userId: string, opts: {
  title: string
  body: string
  href?: string
}) {
  return sendNotification({
    userId,
    type: 'SYSTEM',
    title: opts.title,
    body: opts.body,
    actionUrl: opts.href,
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

  const {
    sendBuildCompleteEmail,
    sendTokenLowEmail,
    sendSaleNotificationEmail,
  } = await import('./email')
  const meta = opts.metadata as Record<string, unknown> | undefined

  // Guard: warn but don't crash when RESEND_API_KEY is a placeholder
  const resendKey = process.env.RESEND_API_KEY ?? ''
  if (!resendKey || resendKey === 'placeholder' || resendKey.length < 10) {
    console.warn('[notifications-client] RESEND_API_KEY not configured — skipping email for', opts.type)
    return
  }

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
    case 'TOKEN_DEPLETED':
      await sendTokenLowEmail({
        email: user.email,
        name: user.displayName || 'Creator',
        tokenCount: Number(meta?.balance ?? 0),
      })
      break
    case 'SALE':
    case 'TEMPLATE_PURCHASED':
      await sendSaleNotificationEmail({
        email: user.email,
        templateName: String(meta?.templateTitle ?? 'Template'),
        saleAmount: Number(meta?.amountCents ?? 0) / 100,
      })
      break
    // ACHIEVEMENT_UNLOCKED, TEAM_INVITE, REVIEW_RECEIVED, PAYOUT_COMPLETED,
    // PAYOUT_FAILED, SYSTEM, WEEKLY_DIGEST, REFERRAL_EARNED:
    // email templates for these types can be added here as they are built.
    default:
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
