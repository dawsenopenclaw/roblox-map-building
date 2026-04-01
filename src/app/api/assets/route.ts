import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 20

const VALID_STATUSES = ['queued', 'generating', 'optimizing', 'uploading', 'ready', 'failed'] as const
const VALID_SORT_FIELDS = ['createdAt', 'updatedAt'] as const
const VALID_SORT_DIRS = ['asc', 'desc'] as const

type SortField = (typeof VALID_SORT_FIELDS)[number]
type SortDir = (typeof VALID_SORT_DIRS)[number]

// ─── GET /api/assets — list user's generated assets (paginated) ───────────────

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve internal user id
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)

  // Pagination
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10),
    MAX_PAGE_SIZE,
  )
  const cursor = searchParams.get('cursor') ?? undefined

  // Filters
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const style = searchParams.get('style')

  // Sorting
  const rawSortField = searchParams.get('sortBy') ?? 'createdAt'
  const rawSortDir = searchParams.get('sortDir') ?? 'desc'
  const sortField: SortField = (VALID_SORT_FIELDS as readonly string[]).includes(rawSortField)
    ? (rawSortField as SortField)
    : 'createdAt'
  const sortDir: SortDir = (VALID_SORT_DIRS as readonly string[]).includes(rawSortDir)
    ? (rawSortDir as SortDir)
    : 'desc'

  const where = {
    userId: user.id,
    ...(status && (VALID_STATUSES as readonly string[]).includes(status) ? { status } : {}),
    ...(type ? { type } : {}),
    ...(style ? { style } : {}),
  }

  // Fetch one extra to determine if there is a next page
  const assets = await db.generatedAsset.findMany({
    where,
    orderBy: { [sortField]: sortDir },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      prompt: true,
      type: true,
      style: true,
      status: true,
      thumbnailUrl: true,
      meshUrl: true,
      polyCount: true,
      qualityScore: true,
      tokensCost: true,
      robloxAssetId: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const hasNextPage = assets.length > limit
  const page = hasNextPage ? assets.slice(0, limit) : assets
  const nextCursor = hasNextPage ? page[page.length - 1]?.id : null

  return NextResponse.json({
    assets: page,
    nextCursor,
    hasNextPage,
    limit,
  })
}
