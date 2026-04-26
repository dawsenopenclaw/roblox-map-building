/**
 * Like/unlike a feed post (toggle)
 * POST — toggle like on a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in to like posts' }, { status: 401 })

  const { id: postId } = await params

  try {
    // Check if already liked
    const existing = await db.feedLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (existing) {
      // Unlike
      await db.feedLike.delete({ where: { id: existing.id } })
      await db.feedPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await db.feedLike.create({ data: { postId, userId } })
      await db.feedPost.update({ where: { id: postId }, data: { likes: { increment: 1 } } })
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error('[feed/like] Error:', err)
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 })
  }
}
