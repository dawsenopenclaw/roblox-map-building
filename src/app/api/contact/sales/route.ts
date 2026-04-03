// Required env vars:
// RESEND_API_KEY            — already configured
// SALES_NOTIFICATION_EMAIL  — where email notifications go (default: sales@forjegames.com)
// SMS_GATEWAY_EMAIL         — carrier email-to-SMS gateway (e.g. 3039561840@txt.att.net)

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try { return await handlePost(req) } catch (e) {
    console.error('[contact/sales] Unhandled error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handlePost(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, message, budget } = body as Record<string, unknown>

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof message !== 'string' || !message.trim()
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const safeName      = name.trim()
  const safeEmail     = email.trim()
  const safeMessage   = message.trim()
  const safeTokenNeed = typeof budget === 'string' ? budget.trim() : ''

  // 1. Send email notification via Resend
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'ForjeGames <onboarding@resend.dev>',
          to: process.env.SALES_NOTIFICATION_EMAIL ?? 'sales@forjegames.com',
          subject: `Custom Token Request from ${safeName}`,
          html: `
            <h2>Custom Token Plan Request</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Token Need:</strong> ${safeTokenNeed || 'Not specified'}</p>
            <p><strong>What they're building:</strong></p>
            <p>${safeMessage.replace(/\n/g, '<br />')}</p>
          `,
        }),
      })
    }
  } catch (e) {
    console.error('Failed to send sales notification email:', e)
  }

  // 2. Send SMS via carrier email-to-SMS gateway (free, no Twilio needed)
  try {
    const resendKey = process.env.RESEND_API_KEY
    const smsGateway = process.env.SMS_GATEWAY_EMAIL // e.g. 3039561840@txt.att.net
    if (resendKey && smsGateway) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'ForjeGames <onboarding@resend.dev>',
          to: smsGateway,
          subject: '',
          text: `ForjeGames Lead:\n${safeName} (${safeEmail})\nTokens: ${safeTokenNeed || 'N/A'}\n${safeMessage.slice(0, 120)}`,
        }),
      })
    }
  } catch (e) {
    console.error('Failed to send SMS notification:', e)
  }

  return NextResponse.json({ success: true })
}
