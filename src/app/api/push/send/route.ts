import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { promises as fs } from 'fs'
import path from 'path'

const SUBS_FILE = path.join(process.cwd(), 'data', 'push-subscriptions.json')

webpush.setVapidDetails(
  'mailto:support@forjegames.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

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

export async function POST(req: Request) {
  try {
    // Auth check
    const adminSecret = process.env.PUSH_ADMIN_SECRET
    if (!adminSecret) {
      return NextResponse.json({ error: 'Push admin secret not configured' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { title, body: msgBody, url } = body as Record<string, unknown>

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const payload = JSON.stringify({
      title: title.trim(),
      body: typeof msgBody === 'string' ? msgBody.trim() : '',
      url: typeof url === 'string' ? url : '/',
    })

    const subs = await readSubscriptions()
    if (subs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0
    const invalidEndpoints: string[] = []

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            payload
          )
          sent++
        } catch (err) {
          // 410 Gone = subscription expired/unsubscribed — remove it
          if (
            err instanceof Error &&
            'statusCode' in err &&
            (err as { statusCode: number }).statusCode === 410
          ) {
            invalidEndpoints.push(sub.endpoint)
          }
          failed++
          console.error('[push/send] Failed to send to', sub.endpoint, err)
        }
      })
    )

    // Remove invalid subscriptions
    if (invalidEndpoints.length > 0) {
      const cleaned = subs.filter((s) => !invalidEndpoints.includes(s.endpoint))
      await writeSubscriptions(cleaned)
    }

    return NextResponse.json({ success: true, sent, failed, removed: invalidEndpoints.length })
  } catch (e) {
    console.error('[push/send] Unhandled error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
