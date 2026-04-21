import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const url = new URL(req.url)
    const action = url.searchParams.get('action') ?? undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200)
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10) || 0

    const where: Record<string, unknown> = {}
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          metadata: true,
          createdAt: true,
          user: { select: { email: true, displayName: true } },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
        user: l.user ? { email: l.user.email } : null,
      })),
      total,
      limit,
      offset,
    })
  } catch (err) {
    console.error('[admin/audit-log] error:', err)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
