/**
 * Community Feed API
 *
 * GET  — List recent posts (paginated, filterable by channel)
 * POST — Create a new post
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const MAX_CONTENT_LENGTH = 500
const POSTS_PER_PAGE = 30
const VALID_CHANNELS = ['general', 'looking-for-team', 'showcase', 'help']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || 'general'
  const cursor = searchParams.get('cursor') // for pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 50)

  try {
    const posts = await db.feedPost.findMany({
      where: {
        channel: VALID_CHANNELS.includes(channel) ? channel : 'general',
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch user info from Clerk for all unique userIds
    const userIds = [...new Set(posts.map(p => p.userId))]
    const userMap: Record<string, { name: string; avatar: string | null }> = {}

    try {
      const clerk = await clerkClient()
      const users = await clerk.users.getUserList({ userId: userIds, limit: userIds.length })
      for (const u of users.data) {
        userMap[u.id] = {
          name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username || 'User',
          avatar: u.imageUrl || null,
        }
      }
    } catch {
      // Clerk unavailable — use fallback names
      for (const id of userIds) {
        userMap[id] = { name: 'User', avatar: null }
      }
    }

    const enrichedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      channel: p.channel,
      likes: p.likes,
      createdAt: p.createdAt.toISOString(),
      author: userMap[p.userId] || { name: 'User', avatar: null },
      isOwn: false, // will be set client-side
    }))

    return NextResponse.json({
      posts: enrichedPosts,
      nextCursor: posts.length >= limit ? posts[posts.length - 1].createdAt.toISOString() : null,
    })
  } catch (err) {
    console.error('[feed] GET error:', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to post' }, { status: 401 })

  try {
    const body = await req.json()
    const content = (body.content || '').trim().slice(0, MAX_CONTENT_LENGTH)
    const channel = VALID_CHANNELS.includes(body.channel) ? body.channel : 'general'

    if (!content) {
      return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 })
    }

    // Rate limit: max 10 posts per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await db.feedPost.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 10) {
      return NextResponse.json({ error: 'Slow down! Max 10 posts per hour.' }, { status: 429 })
    }

    const post = await db.feedPost.create({
      data: { userId, content, channel },
    })

    // Get author info
    let authorName = 'User'
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      authorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || 'User'
    } catch { /* fallback */ }

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        channel: post.channel,
        likes: 0,
        createdAt: post.createdAt.toISOString(),
        author: { name: authorName, avatar: null },
        isOwn: true,
      },
    })
  } catch (err) {
    console.error('[feed] POST error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
