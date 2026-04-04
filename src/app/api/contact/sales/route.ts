import { NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX = 3
const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = ipTimestamps.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  ipTimestamps.set(ip, recent)
  return false
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    return await handlePost(req)
  } catch (e) {
    console.error('[contact/sales] Unhandled error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handlePost(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, message, budget } = body as Record<string, unknown>

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof email !== 'string' ||
    !email.trim() ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const safeName = name.trim().slice(0, 100)
  const safeEmail = email.trim().slice(0, 254)
  const safeMessage = message.trim().slice(0, 2000)
  const safeTokenNeed = typeof budget === 'string' ? budget.trim().slice(0, 100) : ''

  if (!EMAIL_RE.test(safeEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[contact/sales] RESEND_API_KEY not configured — notifications skipped')
    return NextResponse.json({ success: true })
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'ForjeGames <onboarding@resend.dev>'

  // 1. Send email notification via Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: process.env.SALES_NOTIFICATION_EMAIL ?? 'sales@forjegames.com',
        subject: `Custom Token Request from ${esc(safeName)}`,
        html: `
          <h2>Custom Token Plan Request</h2>
          <p><strong>Name:</strong> ${esc(safeName)}</p>
          <p><strong>Email:</strong> ${esc(safeEmail)}</p>
          <p><strong>Token Need:</strong> ${esc(safeTokenNeed) || 'Not specified'}</p>
          <p><strong>What they're building:</strong></p>
          <p>${esc(safeMessage).replace(/\n/g, '<br />')}</p>
        `,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[contact/sales] Resend email failed:', res.status, err)
    }
  } catch (e) {
    console.error('[contact/sales] Failed to send email:', e)
  }

  // 2. Push notification via ntfy.sh (free, instant, no signup)
  try {
    const ntfyTopic = process.env.NTFY_TOPIC
    if (ntfyTopic) {
      const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        headers: {
          Title: `New Lead: ${safeName}`,
          Priority: 'high',
          Tags: 'moneybag',
        },
        body: `Tokens: ${safeTokenNeed || 'N/A'}\nEmail: ${safeEmail}\n${safeMessage.slice(0, 200)}${safeMessage.length > 200 ? '...' : ''}`,
      })
      if (!res.ok) {
        console.error('[contact/sales] ntfy push failed:', res.status)
      }
    }
  } catch (e) {
    console.error('[contact/sales] Failed to send push notification:', e)
  }

  return NextResponse.json({ success: true })
}
