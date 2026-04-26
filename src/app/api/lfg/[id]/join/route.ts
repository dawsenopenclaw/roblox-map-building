/**
 * /api/lfg/[id]/join
 *
 * POST — Request to join an LFG post. Increments currentMembers,
 *        sets status to "full" when cap reached, notifies author.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
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
      select: { id: true, displayName: true, username: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const post = await db.lfgPost.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'open') {
      return NextResponse.json({ error: 'Post is no longer open' }, { status: 400 })
    }

    if (post.expiresAt < new Date()) {
      // Auto-close expired post
      await db.lfgPost.update({ where: { id }, data: { status: 'closed' } })
      return NextResponse.json({ error: 'Post has expired' }, { status: 400 })
    }

    if (post.userId === user.id) {
      return NextResponse.json({ error: 'Cannot join your own post' }, { status: 400 })
    }

    if (post.currentMembers >= post.maxMembers) {
      return NextResponse.json({ error: 'Post is already full' }, { status: 400 })
    }

    // Increment members, set full if needed
    const newCount = post.currentMembers + 1
    const newStatus = newCount >= post.maxMembers ? 'full' : 'open'

    await db.lfgPost.update({
      where: { id },
      data: {
        currentMembers: newCount,
        status: newStatus,
      },
    })

    // Notify the post author
    const joinerName = user.displayName || user.username || 'Someone'
    await db.notification.create({
      data: {
        userId: post.userId,
        type: 'LFG_JOIN_REQUEST',
        title: 'New group member!',
        body: `${joinerName} joined your LFG post "${post.title}"`,
        actionUrl: `/lfg`,
      },
    })

    return NextResponse.json({
      joined: true,
      currentMembers: newCount,
      status: newStatus,
    })
  } catch (err) {
    console.error('[lfg join POST]', err)
    return NextResponse.json({ error: 'Failed to join post' }, { status: 500 })
  }
}
