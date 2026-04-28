import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateApiKey } from '@/lib/api-key-auth'

/** GET — list user's API keys (hashed, never raw) */
export async function GET() {
  const session = await auth()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const keys = await db.apiKey.findMany({
    where: { userId: dbUser.id, revokedAt: null },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      tier: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys })
}

/** POST — create a new API key */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Limit to 5 active keys per user
  const activeCount = await db.apiKey.count({
    where: { userId: dbUser.id, revokedAt: null },
  })
  if (activeCount >= 5) {
    return NextResponse.json(
      { error: 'Maximum 5 active API keys. Revoke one first.' },
      { status: 400 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const name = (body.name as string) || 'MCP Integration'

  const { rawKey, keyHash, prefix } = generateApiKey()

  const key = await db.apiKey.create({
    data: {
      userId: dbUser.id,
      name,
      keyHash,
      prefix,
      scopes: ['chat', 'build', 'studio'],
      tier: 'FREE',
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      createdAt: true,
    },
  })

  // Return the raw key ONCE — it's never stored or retrievable again
  return NextResponse.json({
    key: { ...key, rawKey },
    message: 'Save this key — it will not be shown again.',
  })
}

/** DELETE — revoke an API key */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: session.userId },
    select: { id: true },
  })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const keyId = body.keyId as string
  if (!keyId) {
    return NextResponse.json({ error: 'keyId required' }, { status: 400 })
  }

  // Only revoke keys owned by this user
  const result = await db.apiKey.updateMany({
    where: { id: keyId, userId: dbUser.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
