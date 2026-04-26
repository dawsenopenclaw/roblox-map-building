/**
 * /api/lfg
 *
 * GET  — List open LFG posts (paginated, filter by gameType)
 * POST — Create a new LFG post
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET — list open LFG posts
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const gameType = url.searchParams.get('gameType') || undefined
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: { in: ['open'] },
      expiresAt: { gt: new Date() },
    }
    if (gameType && gameType !== 'all') {
      where.gameType = gameType
    }

    const [posts, total] = await Promise.all([
      db.lfgPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.lfgPost.count({ where }),
    ])

    // Resolve poster names from Clerk
    const userIds = [...new Set(posts.map((p) => p.userId))]
    const clerk = await clerkClient()
    const userMap: Record<string, { name: string; avatar: string | null }> = {}

    // Look up internal user IDs -> clerk IDs
    if (userIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, clerkId: true, displayName: true, username: true, avatarUrl: true },
      })
      for (const u of users) {
        userMap[u.id] = {
          name: u.displayName || u.username || 'Anonymous',
          avatar: u.avatarUrl ?? null,
        }
      }
    }

    const enriched = posts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      gameType: p.gameType,
      lookingFor: p.lookingFor,
      maxMembers: p.maxMembers,
      currentMembers: p.currentMembers,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      expiresAt: p.expiresAt.toISOString(),
      author: userMap[p.userId] ?? { name: 'Anonymous', avatar: null },
    }))

    return NextResponse.json({
      posts: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[lfg GET]', err)
    return NextResponse.json({ error: 'Failed to load LFG posts' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — create a new LFG post
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, description, gameType, lookingFor, maxMembers } = body

    if (!title || !description || !gameType || !lookingFor) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, gameType, lookingFor' },
        { status: 400 },
      )
    }

    // Resolve internal user ID
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for existing open post by this user (limit 1 active post)
    const existing = await db.lfgPost.findFirst({
      where: {
        userId: user.id,
        status: 'open',
        expiresAt: { gt: new Date() },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active LFG post. Close it first.' },
        { status: 409 },
      )
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now

    const post = await db.lfgPost.create({
      data: {
        userId: user.id,
        title: title.slice(0, 100),
        description: description.slice(0, 500),
        gameType: gameType.slice(0, 30),
        lookingFor: lookingFor.slice(0, 50),
        maxMembers: Math.min(10, Math.max(2, parseInt(maxMembers, 10) || 4)),
        currentMembers: 1,
        status: 'open',
        expiresAt,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('[lfg POST]', err)
    return NextResponse.json({ error: 'Failed to create LFG post' }, { status: 500 })
  }
}
