import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const meta = clerkUser.publicMetadata as Record<string, unknown>
    const onboarding = (meta?.onboarding ?? null) as {
      completed?: boolean
      completedAt?: string
      interest?: string
      skipped?: boolean
    } | null

    return NextResponse.json(onboarding ?? { completed: false })
  } catch (err) {
    // Return incomplete status so the wizard shows instead of crashing
    return NextResponse.json({ completed: false })
  }
}
