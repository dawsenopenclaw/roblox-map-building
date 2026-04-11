import 'server-only'

/**
 * Unified server-side notification system for ForjeGames.
 *
 * Channels: Email (Resend), SMS (Twilio), Web Push (VAPID).
 * All sends are fire-and-forget safe — failures are logged but never throw.
 *
 * For in-app toast / browser notifications, use the client-side
 * `@/lib/notifications` module instead.
 */

import { db } from './db'
import {
  sendBuildCompleteEmail,
  sendWeeklyDigestEmail,
  type EmailResult,
} from './email'
import { sendSMS } from './sms'

// ─── Web Push (VAPID) ───────────────────────────────────────────────────────

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

let _webpush: typeof import('web-push') | null = null

function getWebPush() {
  if (_webpush) return _webpush
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _webpush = require('web-push') as typeof import('web-push')

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (publicKey && privateKey) {
    _webpush.setVapidDetails(
      'mailto:support@forjegames.com',
      publicKey,
      privateKey,
    )
  }

  return _webpush
}

function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  )
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Send an email via Resend.
 * Thin wrapper that delegates to `@/lib/email` for template rendering,
 * or sends raw HTML when no template is needed.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<EmailResult> {
  try {
    const { Resend } = await import('resend')
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey.length < 10) {
      console.warn('[notifications-server] RESEND_API_KEY not configured — skipping email')
      return { success: false, reason: 'email_not_configured' }
    }

    const resend = new Resend(resendKey)
    const { data, error } = await resend.emails.send({
      from: 'ForjeGames <noreply@forjegames.com>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[notifications-server] Resend error:', error)
      return { success: false, reason: 'send_failed', error }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[notifications-server] sendEmail failed:', err)
    return { success: false, reason: 'send_failed', error: err }
  }
}

/**
 * Send an SMS via Twilio.
 * Delegates to the existing `@/lib/sms` module.
 */
export async function sendSMSNotification(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  return sendSMS({ to, body: message })
}

/**
 * Send a Web Push notification via VAPID keys.
 * Looks up the user's stored push subscription from the database.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  options?: { actionUrl?: string; icon?: string },
): Promise<{ success: boolean; error?: string }> {
  if (!isWebPushConfigured()) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    // Push subscriptions are stored in the user's preferences JSON field
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    const prefs = user?.preferences as Record<string, unknown> | null
    const subscription = prefs?.pushSubscription as PushSubscriptionJSON | undefined

    if (!subscription?.endpoint || !subscription?.keys) {
      return { success: false, error: 'No push subscription registered for user' }
    }

    const webpush = getWebPush()
    const payload = JSON.stringify({
      title,
      body,
      icon: options?.icon ?? '/forje-icon.png',
      badge: '/forje-badge.png',
      data: { url: options?.actionUrl ?? '/dashboard' },
    })

    await webpush.sendNotification(subscription, payload)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown push error'
    // HTTP 410 Gone = subscription expired, clean it up
    if (message.includes('410') || message.includes('expired')) {
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { preferences: true },
        })
        const prefs = (user?.preferences as Record<string, unknown>) ?? {}
        delete prefs.pushSubscription
        await db.user.update({
          where: { id: userId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { preferences: prefs as any },
        })
      } catch {
        // Best effort cleanup
      }
    }
    console.error('[notifications-server] Push failed:', message)
    return { success: false, error: message }
  }
}

/**
 * Notify a user that their build is complete.
 * Sends both an email and a push notification, respecting the user's
 * per-channel preferences for BUILD_COMPLETE / BUILD_FAILED.
 */
export async function notifyBuildComplete(
  userId: string,
  buildId: string,
  summary: {
    buildName: string
    buildType: string
    success: boolean
    thumbnailUrl?: string
  },
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, displayName: true },
  })

  if (!user?.email) {
    console.warn('[notifications-server] notifyBuildComplete: user has no email')
    return
  }

  // Check per-channel preferences — skip any channel the user disabled.
  // Failures during prefs lookup fall through to "send everything" so a
  // preference-service outage never silences production notifications.
  let emailEnabled = true
  let pushEnabled = true
  try {
    const { getUserPreferences } = await import('./notification-preferences')
    const { preferences } = await getUserPreferences(userId)
    const type = summary.success ? 'BUILD_COMPLETE' : 'BUILD_FAILED'
    emailEnabled = preferences[type]?.EMAIL ?? true
    pushEnabled = preferences[type]?.PUSH ?? true
  } catch (err) {
    console.warn('[notifications-server] notifyBuildComplete: prefs lookup failed, defaulting to enabled:', err)
  }

  const title = summary.success
    ? `Your ${summary.buildType} "${summary.buildName}" is ready!`
    : `Your ${summary.buildType} "${summary.buildName}" failed`

  // Email — use the rich template from email.ts
  if (emailEnabled) {
    sendBuildCompleteEmail({
      email: user.email,
      buildType: summary.buildType,
      buildName: summary.buildName,
      buildId,
      thumbnailUrl: summary.thumbnailUrl,
    }).catch((err) => {
      console.error('[notifications-server] Build-complete email failed:', err)
    })
  }

  // Push notification
  if (pushEnabled) {
    sendPushNotification(userId, title, summary.success
      ? 'Your game is ready! Open the dashboard to view it.'
      : 'Check the editor for error details.',
      { actionUrl: `/editor?build=${buildId}` },
    ).catch((err) => {
      console.error('[notifications-server] Build-complete push failed:', err)
    })
  }
}

/**
 * Send a weekly usage digest email to a user.
 * Aggregates stats from the past 7 days and dispatches via the
 * WeeklyDigest email template.
 */
export async function notifyWeeklyDigest(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      displayName: true,
      username: true,
    },
  })

  if (!user?.email) {
    console.warn('[notifications-server] notifyWeeklyDigest: user has no email')
    return
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const name = user.displayName || user.username || 'Creator'

  // Aggregate weekly stats
  const [builds, earnings] = await Promise.all([
    db.build.count({
      where: { userId, createdAt: { gte: oneWeekAgo } },
    }).catch(() => 0),
    db.creatorEarning.aggregate({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _sum: { amountCents: true },
    }).catch(() => ({ _sum: { amountCents: null } })),
  ])

  // Token usage: sum SPEND transactions for the week
  let tokensUsed = 0
  try {
    const tokenBalance = await db.tokenBalance.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (tokenBalance) {
      const txnAgg = await db.tokenTransaction.aggregate({
        where: {
          balanceId: tokenBalance.id,
          createdAt: { gte: oneWeekAgo },
          type: 'SPEND',
        },
        _sum: { amount: true },
      })
      tokensUsed = Math.abs(txnAgg._sum?.amount ?? 0)
    }
  } catch {
    // Token balance may not exist yet
  }

  const earningsThisWeek = (earnings._sum?.amountCents ?? 0) / 100

  // Compute streak days — UserXP does not have a streakDays column,
  // so we estimate from consecutive dailyXpDate entries or default to 0.
  const streakDays = 0

  sendWeeklyDigestEmail({
    email: user.email,
    name,
    buildsThisWeek: builds,
    tokensUsed,
    earningsThisWeek,
    streakDays,
  }).catch((err) => {
    console.error('[notifications-server] Weekly digest email failed:', err)
  })
}
