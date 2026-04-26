/**
 * /api/lfg/[id]
 *
 * GET    — Get LFG post detail
 * DELETE — Close/remove post (author only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET — post detail
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params

  try {
    const post = await db.lfgPost.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get author info
    const user = await db.user.findUnique({
      where: { id: post.userId },
      select: { displayName: true, username: true, avatarUrl: true },
    })

    return NextResponse.json({
      post: {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        expiresAt: post.expiresAt.toISOString(),
        author: {
          name: user?.displayName || user?.username || 'Anonymous',
          avatar: user?.avatarUrl ?? null,
        },
      },
    })
  } catch (err) {
    console.error('[lfg detail GET]', err)
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — close/remove post (author only)
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  context: RouteContext,
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const post = await db.lfgPost.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'Only the author can close this post' }, { status: 403 })
    }

    await db.lfgPost.update({
      where: { id },
      data: { status: 'closed' },
    })

    return NextResponse.json({ closed: true })
  } catch (err) {
    console.error('[lfg detail DELETE]', err)
    return NextResponse.json({ error: 'Failed to close post' }, { status: 500 })
  }
}
