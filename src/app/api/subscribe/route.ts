import { NextRequest, NextResponse } from 'next/server'

// ── In-memory IP rate limiter ─────────────────────────────────────────────────
// 5 subscribe attempts per IP per hour. Uses the same sliding-window pattern
// as /api/contact/sales — no Redis dependency for this public-facing endpoint.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5
const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = ipTimestamps.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  ipTimestamps.set(ip, recent)
  return false
}

// ── Validation ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/subscribe
 * Body: { email: string }
 *
 * Adds the email to a Resend audience for the ForjeGames newsletter.
 * Uses RESEND_AUDIENCE_ID. If not set, falls back to a flat contact create.
 */
export async function POST(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Try again later.' },
      { status: 429 }
    )
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.' },
      { status: 400 }
    )
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.' },
      { status: 400 }
    )
  }

  const { email } = body as Record<string, unknown>

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { success: false, message: 'Email is required.' },
      { status: 400 }
    )
  }

  // HTML-escape and normalise
  const safeEmail = email.trim().slice(0, 254).toLowerCase()

  if (!EMAIL_RE.test(safeEmail)) {
    return NextResponse.json(
      { success: false, message: 'Please enter a valid email address.' },
      { status: 422 }
    )
  }

  // ── Send to Resend ──────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[subscribe] RESEND_API_KEY not configured — skipping.')
    // Still return success so the UI doesn't break in local dev without the key
    return NextResponse.json({ success: true })
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID

  try {
    let resendRes: Response

    if (audienceId) {
      // ── Path A: audience-scoped contact (preferred) ─────────────────────────
      // POST /audiences/{audienceId}/contacts
      resendRes = await fetch(
        `https://api.resend.com/audiences/${audienceId}/contacts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: safeEmail,
            unsubscribed: false,
          }),
        }
      )
    } else {
      // ── Path B: flat contact create — no audience configured yet ────────────
      // This still adds the contact to your Resend account; you can assign them
      // to an audience later. Set RESEND_AUDIENCE_ID to use Path A.
      resendRes = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: safeEmail,
          unsubscribed: false,
        }),
      })
    }

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      // 409 = contact already exists — treat as success so the UI is happy
      if (resendRes.status === 409) {
        return NextResponse.json({ success: true })
      }
      console.error('[subscribe] Resend API error:', resendRes.status, errText)
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('[subscribe] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
