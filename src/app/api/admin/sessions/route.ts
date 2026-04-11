import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Active sessions = users with audit log activity in the last 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)

    // Get recent audit log entries grouped by user
    const recentActivity = await db.auditLog.findMany({
      where: {
        createdAt: { gte: fifteenMinAgo },
        userId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        userId: true,
        action: true,
        resource: true,
        createdAt: true,
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Deduplicate by userId, keeping the most recent entry
    const userMap = new Map<
      string,
      {
        userId: string
        username: string | null
        displayName: string | null
        email: string
        avatarUrl: string | null
        lastActivity: string
        lastAction: string
        lastResource: string
        aiMode: string | null
        activityCount: number
        firstSeen: string
      }
    >()

    for (const entry of recentActivity) {
      if (!entry.userId || !entry.user) continue
      const existing = userMap.get(entry.userId)
      const meta = entry.metadata as Record<string, unknown> | null
      const aiMode = (meta?.aiMode as string) ?? (meta?.provider as string) ?? null

      if (existing) {
        existing.activityCount++
        // Update firstSeen to the earliest
        if (new Date(entry.createdAt) < new Date(existing.firstSeen)) {
          existing.firstSeen = entry.createdAt.toISOString()
        }
      } else {
        userMap.set(entry.userId, {
          userId: entry.userId,
          username: entry.user.username,
          displayName: entry.user.displayName,
          email: entry.user.email,
          avatarUrl: entry.user.avatarUrl,
          lastActivity: entry.createdAt.toISOString(),
          lastAction: entry.action,
          lastResource: entry.resource,
          aiMode,
          activityCount: 1,
          firstSeen: entry.createdAt.toISOString(),
        })
      }
    }

    const sessions = Array.from(userMap.values()).sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )

    return NextResponse.json({ sessions, total: sessions.length })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
