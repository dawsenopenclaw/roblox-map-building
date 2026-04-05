import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Connected accounts stub — returns disconnected state until
 * robloxUsername/githubUsername fields are added to the User model.
 */

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    roblox: { connected: false, username: null, connectedAt: null },
    github: { connected: false, username: null, connectedAt: null },
  })
}
