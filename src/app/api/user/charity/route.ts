import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const VALID_SLUGS = ['code-org', 'girls-who-code', 'khan-academy'] as const
const schema = z.object({ charitySlug: z.enum(VALID_SLUGS) })

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid charity' }, { status: 400 })

    await db.user.update({ where: { clerkId }, data: { charityChoice: parsed.data.charitySlug } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('User charity error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
