/**
 * POST /api/game-scanner   — scan a Roblox game and return its DNA genome
 * GET  /api/game-scanner   — return the authenticated user's scan history
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { checkGenerationLimit, incrementGenerationCounter } from '@/lib/generation-limits'
import { scanGame } from '@/lib/ai/game-scanner'
import { db } from '@/lib/db'

// Resolve internal DB userId from Clerk userId
async function resolveInternalUserId(clerkId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const scanSchema = z.object({
  /** Raw placeId (numeric) or full Roblox game URL */
  placeId:  z.string().optional(),
  gameUrl:  z.string().optional(),
}).refine(
  (b) => b.placeId ?? b.gameUrl,
  { message: 'Provide either placeId or gameUrl' },
)

const historySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// ── POST — run a scan ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Beta: all testers get full access
  const tierDenied = await requireTier(userId, 'FREE')
  if (tierDenied) return tierDenied

  const internalId = await resolveInternalUserId(userId)
  if (!internalId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check build counter (scanner counts as a "build" operation)
  const limit = await checkGenerationLimit(internalId, 'build')
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:     'Daily scan limit reached',
        remaining: 0,
        limit:     limit.limit,
        resetsAt:  limit.resetsAt,
      },
      { status: 429 },
    )
  }

  const parsed = await parseBody(req, scanSchema)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

  const { placeId, gameUrl } = parsed.data
  const input = (placeId ?? gameUrl) as string

  try {
    const result = await scanGame(input, internalId)
    // Increment counter only after a successful scan
    await incrementGenerationCounter(internalId, 'build')

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Scan failed', detail: message },
      { status: 502 },
    )
  }
}

// ── GET — scan history ────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const parsed = historySchema.safeParse({
    page:  url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 422 })
  }

  const { page, limit } = parsed.data
  const skip = (page - 1) * limit

  // Resolve internal userId from clerkId
  const user = await db.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [scans, total] = await Promise.all([
    db.gameScan.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
      include: { genome: true },
    }),
    db.gameScan.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({
    scans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
