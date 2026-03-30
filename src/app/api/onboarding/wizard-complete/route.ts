import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'

const schema = z.object({
  interest: z.enum(['games', 'maps', 'assets', 'all']),
  skipped: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!userId) {
    return NextResponse.json({ demo: true, ok: true, redirectUrl: '/editor' })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  try {
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
  } catch (err) {
    // Non-fatal — metadata update failed but we still let the user proceed
    return NextResponse.json({ ok: true, clerkError: true })
  }

  return NextResponse.json({ ok: true })
}
