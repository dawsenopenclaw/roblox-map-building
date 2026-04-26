/**
 * Community Feed API
 *
 * GET  — List recent posts (paginated, filterable by channel)
 * POST — Create a new post or reply
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const MAX_CONTENT_LENGTH = 500
const VALID_CHANNELS = ['general', 'looking-for-team', 'showcase', 'help']

// ── Online presence (Redis) ─────────────────────────────────────────────────

function getRedis() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch { return null }
}

async function markOnline(userId: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(`fj:online:${userId}`, '1', 'EX', 120) // 2 min TTL
  } catch { /* non-fatal */ }
}

async function getOnlineCount(): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    const keys = await r.keys('fj:online:*')
    return keys.length
  } catch { return 0 }
}

// ── Clerk user lookup helper ────────────────────────────────────────────────

async function getUserMap(userIds: string[]): Promise<Record<string, { name: string; avatar: string | null }>> {
  const map: Record<string, { name: string; avatar: string | null }> = {}
  if (userIds.length === 0) return map
  try {
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({ userId: userIds, limit: userIds.length })
    for (const u of users.data) {
      map[u.id] = {
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username || 'User',
        avatar: u.imageUrl || null,
      }
    }
  } catch { /* fallback */ }
  for (const id of userIds) {
    if (!map[id]) map[id] = { name: 'User', avatar: null }
  }
  return map
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || 'general'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 50)
  const parentId = searchParams.get('parentId') // fetch replies to a specific post

  // Mark user as online
  if (userId) markOnline(userId).catch(() => {})

  try {
    const where: Record<string, unknown> = parentId
      ? { replyToId: parentId }
      : {
          channel: VALID_CHANNELS.includes(channel) ? channel : 'general',
          replyToId: null, // only top-level posts
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        }

    const posts = await db.feedPost.findMany({
      where,
      orderBy: { createdAt: parentId ? 'asc' : 'desc' },
      take: limit,
    })

    const userIds = [...new Set(posts.map(p => p.userId))]
    const userMap = await getUserMap(userIds)

    // Check which posts the current user has liked
    let likedSet = new Set<string>()
    if (userId && posts.length > 0) {
      try {
        const likes = await db.feedLike.findMany({
          where: { userId, postId: { in: posts.map(p => p.id) } },
          select: { postId: true },
        })
        likedSet = new Set(likes.map(l => l.postId))
      } catch { /* non-fatal */ }
    }

    const enrichedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      channel: p.channel,
      likes: p.likes,
      liked: likedSet.has(p.id),
      replyToId: p.replyToId,
      replyCount: p.replyCount,
      createdAt: p.createdAt.toISOString(),
      author: userMap[p.userId] || { name: 'User', avatar: null },
      isOwn: p.userId === userId,
    }))

    const onlineCount = await getOnlineCount()

    return NextResponse.json({
      posts: enrichedPosts,
      onlineCount,
      nextCursor: posts.length >= limit ? posts[posts.length - 1].createdAt.toISOString() : null,
    })
  } catch (err) {
    console.error('[feed] GET error:', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}

// ── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to post' }, { status: 401 })

  try {
    const body = await req.json()
    const content = (body.content || '').trim().slice(0, MAX_CONTENT_LENGTH)
    const channel = VALID_CHANNELS.includes(body.channel) ? body.channel : 'general'
    const replyToId = body.replyToId || null

    if (!content) {
      return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 })
    }

    // Rate limit: max 20 posts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await db.feedPost.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 20) {
      return NextResponse.json({ error: 'Slow down! Max 20 posts per hour.' }, { status: 429 })
    }

    // If replying, verify parent exists and increment its reply count
    if (replyToId) {
      const parent = await db.feedPost.findUnique({ where: { id: replyToId } })
      if (!parent) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      await db.feedPost.update({ where: { id: replyToId }, data: { replyCount: { increment: 1 } } })
    }

    const post = await db.feedPost.create({
      data: { userId, content, channel, replyToId },
    })

    // Mark online
    markOnline(userId).catch(() => {})

    // Get author info
    const userMap = await getUserMap([userId])

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        channel: post.channel,
        likes: 0,
        liked: false,
        replyToId: post.replyToId,
        replyCount: 0,
        createdAt: post.createdAt.toISOString(),
        author: userMap[userId] || { name: 'User', avatar: null },
        isOwn: true,
      },
    })
  } catch (err) {
    console.error('[feed] POST error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
