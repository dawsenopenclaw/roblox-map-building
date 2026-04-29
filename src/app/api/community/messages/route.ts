import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// In-memory message store (persists across requests in the same serverless instance)
// For production, move to Redis or Postgres
const messages: { id: string; username: string; content: string; timestamp: string }[] = [
  {
    id: 'system-1',
    username: 'ForjeBot',
    content: 'Welcome to the ForjeGames community chat! Share your builds, ask for help, and connect with other creators.',
    timestamp: new Date().toISOString(),
  },
]

export async function GET() {
  // Return last 50 messages
  return NextResponse.json({ messages: messages.slice(-50) })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { content?: string }
    const content = (body.content ?? '').trim()
    if (!content || content.length > 280) {
      return NextResponse.json({ error: 'Message must be 1-280 characters' }, { status: 400 })
    }

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: userId.slice(0, 8),
      content,
      timestamp: new Date().toISOString(),
    }

    messages.push(msg)

    // Keep max 200 messages in memory
    if (messages.length > 200) {
      messages.splice(0, messages.length - 200)
    }

    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
