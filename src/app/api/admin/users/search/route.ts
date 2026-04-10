import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  try {
    const where = {
      OR: [
        { email: { contains: query, mode: 'insensitive' as const } },
        { username: { contains: query, mode: 'insensitive' as const } },
        { displayName: { contains: query, mode: 'insensitive' as const } },
        { clerkId: { equals: query } },
        { id: { equals: query } },
      ],
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          deletedAt: true,
          robloxUsername: true,
          subscription: {
            select: { tier: true, status: true, currentPeriodEnd: true },
          },
          tokenBalance: {
            select: { balance: true, lifetimeEarned: true, lifetimeSpent: true },
          },
          _count: {
            select: { builds: true, referralsMade: true },
          },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Search failed' },
      { status: 500 }
    )
  }
}
