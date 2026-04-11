import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const sortBy = searchParams.get('sortBy') ?? 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const filter = searchParams.get('filter') // 'recent' | 'active' | 'banned' | null
    const role = searchParams.get('role') // 'ADMIN' | 'USER' | null
    const tier = searchParams.get('tier') // 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO' | null

    // --- Build where clause ---
    const conditions: Record<string, unknown>[] = []

    // Search: email, username, displayName, ID, or clerkId
    if (search) {
      conditions.push({
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
          { displayName: { contains: search, mode: 'insensitive' as const } },
          { id: { equals: search } },
          { clerkId: { equals: search } },
          { robloxUsername: { contains: search, mode: 'insensitive' as const } },
        ],
      })
    }

    // Filters
    if (filter === 'recent') {
      // Users signed up in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      conditions.push({ createdAt: { gte: sevenDaysAgo } })
      conditions.push({ deletedAt: null })
    } else if (filter === 'banned') {
      conditions.push({ deletedAt: { not: null } })
    } else if (filter === 'active') {
      conditions.push({ deletedAt: null })
    }

    if (role) {
      conditions.push({ role })
    }

    if (tier) {
      conditions.push({ subscription: { tier } })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    // --- Determine sort ---
    const allowedSorts: Record<string, Record<string, string>> = {
      createdAt: { createdAt: sortOrder },
      email: { email: sortOrder },
      username: { username: sortOrder },
    }
    const orderBy = allowedSorts[sortBy] ?? { createdAt: 'desc' }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy,
        select: {
          id: true,
          clerkId: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          robloxUsername: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          subscription: { select: { tier: true, status: true, currentPeriodEnd: true } },
          tokenBalance: { select: { balance: true, lifetimeEarned: true, lifetimeSpent: true } },
          _count: { select: { apiUsage: true, builds: true, referralsMade: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        verified: u.subscription?.status === 'ACTIVE' && u.subscription?.tier !== 'FREE',
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        deletedAt: u.deletedAt?.toISOString() ?? null,
        currentPeriodEnd: u.subscription?.currentPeriodEnd?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
