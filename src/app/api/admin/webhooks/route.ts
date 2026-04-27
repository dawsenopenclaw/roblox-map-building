import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { getDLQ, retryDLQItem, clearDLQItem } from '@/lib/webhook-retry'

export const dynamic = 'force-dynamic'

/** GET — List dead-letter queue items */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200)

  const items = await getDLQ(limit)
  return NextResponse.json({ items, count: items.length })
}

/** POST — Retry a specific DLQ item by ID */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.id || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
  }

  const result = await retryDLQItem(body.id)
  return NextResponse.json(result)
}

/** DELETE — Clear (acknowledge) a DLQ item by ID */
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.id || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
  }

  await clearDLQItem(body.id)
  return NextResponse.json({ ok: true })
}
