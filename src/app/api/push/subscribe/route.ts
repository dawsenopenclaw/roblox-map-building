import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SUBS_FILE = path.join(process.cwd(), 'data', 'push-subscriptions.json')

// ─── Rate limit: 10 per IP per hour ──────────────────────────────────────────
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 10
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

// ─── Subscription storage helpers ────────────────────────────────────────────

interface PushSubscriptionRecord {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: string
}

async function readSubscriptions(): Promise<PushSubscriptionRecord[]> {
  try {
    const raw = await fs.readFile(SUBS_FILE, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as PushSubscriptionRecord[]
  } catch {
    return []
  }
}

async function writeSubscriptions(subs: PushSubscriptionRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(SUBS_FILE), { recursive: true })
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8')
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
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

    const { endpoint, keys } = body as Record<string, unknown>

    if (
      typeof endpoint !== 'string' ||
      !endpoint.startsWith('https://') ||
      typeof keys !== 'object' ||
      keys === null ||
      typeof (keys as Record<string, unknown>).p256dh !== 'string' ||
      typeof (keys as Record<string, unknown>).auth !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const { p256dh, auth } = keys as { p256dh: string; auth: string }

    const subs = await readSubscriptions()

    // Deduplicate by endpoint — update keys if endpoint already exists
    const existingIndex = subs.findIndex((s) => s.endpoint === endpoint)
    if (existingIndex >= 0) {
      subs[existingIndex] = { endpoint, keys: { p256dh, auth }, createdAt: subs[existingIndex].createdAt }
    } else {
      subs.push({ endpoint, keys: { p256dh, auth }, createdAt: new Date().toISOString() })
    }

    await writeSubscriptions(subs)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[push/subscribe] Unhandled error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
