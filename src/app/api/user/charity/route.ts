import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const VALID_SLUGS = ['code-org', 'girls-who-code', 'khan-academy'] as const
const schema = z.object({ charitySlug: z.enum(VALID_SLUGS) })

export async function POST(req: NextRequest) {
  // Demo mode: if auth() throws (no Clerk keys), return demo response
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, ok: true })
  }

  try {

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid charity' }, { status: 400 })

    await db.user.update({ where: { clerkId }, data: { charityChoice: parsed.data.charitySlug } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
