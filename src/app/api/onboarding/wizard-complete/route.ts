import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'

const schema = z.object({
  interest: z.enum(['games', 'maps', 'assets', 'all']),
  skipped: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)

  const existing = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...existing,
      onboarding: {
        completed: true,
        completedAt: new Date().toISOString(),
        interest: parsed.data.interest,
        skipped: parsed.data.skipped,
      },
    },
  })

  return NextResponse.json({ ok: true })
}
