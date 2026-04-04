import 'server-only'

/**
 * SMS notification service via Twilio.
 * Gracefully degrades if Twilio credentials aren't configured.
 */

import type Twilio from 'twilio'

let _client: ReturnType<typeof Twilio> | null = null

function getClient() {
  if (_client) return _client

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[sms] Twilio credentials not configured — SMS disabled')
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio') as typeof Twilio
  _client = twilio(accountSid, authToken)
  return _client
}

function getFromNumber(): string {
  return process.env.TWILIO_FROM_NUMBER || ''
}

// ─── Send SMS ────────────────────────────────────────────────────────────────

export async function sendSMS({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const client = getClient()
  if (!client) {
    return { success: false, error: 'Twilio not configured' }
  }

  const from = getFromNumber()
  if (!from) {
    return { success: false, error: 'TWILIO_FROM_NUMBER not set' }
  }

  try {
    const message = await client.messages.create({ to, from, body })
    return { success: true, sid: message.sid }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sms] Send failed:', msg)
    return { success: false, error: msg }
  }
}

// ─── Typed SMS senders (match email patterns) ────────────────────────────────

export async function sendBuildCompleteSMS(phone: string, buildName: string) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your build "${buildName.slice(0, 40)}" is ready! Open the dashboard to view it.`,
  })
}

export async function sendBuildFailedSMS(phone: string, error: string) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your build failed — ${error.slice(0, 80)}. Check your dashboard for details.`,
  })
}

export async function sendTokenLowSMS(phone: string, balance: number) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: You have ${balance} tokens left. Top up at forjegames.com/pricing to keep building.`,
  })
}

export async function sendTokenDepletedSMS(phone: string) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your tokens are depleted. Purchase more at forjegames.com/pricing to continue generating.`,
  })
}

export async function sendSaleNotificationSMS(phone: string, templateName: string, amountCents: number) {
  const dollars = (amountCents / 100).toFixed(2)
  return sendSMS({
    to: phone,
    body: `ForjeGames: You earned $${dollars} from "${templateName.slice(0, 30)}"! View your earnings at forjegames.com/earnings.`,
  })
}

export async function sendTeamInviteSMS(phone: string, teamName: string, inviterName: string) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: ${inviterName} invited you to join "${teamName}". Check your notifications to accept.`,
  })
}

export async function sendReferralConvertedSMS(phone: string, amountCents: number) {
  const dollars = (amountCents / 100).toFixed(2)
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your referral converted! You earned $${dollars}. Keep sharing your link!`,
  })
}

export async function sendPaymentFailedSMS(phone: string) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your payment failed. Update your billing at forjegames.com/settings to keep your account active.`,
  })
}

export async function sendTrialEndingSMS(phone: string, daysLeft: number) {
  return sendSMS({
    to: phone,
    body: `ForjeGames: Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade at forjegames.com/pricing to keep building.`,
  })
}
