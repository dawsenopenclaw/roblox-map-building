/**
 * GET /api/ai/generations
 *
 * Returns the authenticated user's past 3D generations, newest first.
 * Supports offset-based pagination via `?limit=N&offset=N`.
 *
 * Response:
 *   { total: number, generations: GenerationItem[] }
 *
 * DELETE /api/ai/generations?id=xxx
 *
 * Soft-deletes a generation by setting deletedAt (or hard-deletes if no
 * deletedAt column — falls back to hard delete via status="deleted").
 *
 * Auth: Clerk (required — 401 if unauthenticated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const rawLimit  = parseInt(searchParams.get('limit')  ?? String(DEFAULT_LIMIT), 10)
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10)

  const limit  = Number.isFinite(rawLimit)  && rawLimit  > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0

  try {
    const [total, generations] = await Promise.all([
      db.generatedAsset.count({
        where: { userId: user.id, NOT: { status: 'deleted' } },
      }),
      db.generatedAsset.findMany({
        where:   { userId: user.id, NOT: { status: 'deleted' } },
        orderBy: { createdAt: 'desc' },
        skip:    offset,
        take:    limit,
        select: {
          id:           true,
          prompt:       true,
          type:         true,
          style:        true,
          status:       true,
          thumbnailUrl: true,
          meshUrl:      true,
          normalUrl:    true,
          roughnessUrl: true,
          metallicUrl:  true,
          albedoUrl:    true,
          polyCount:    true,
          qualityScore: true,
          tokensCost:   true,
          generationMs: true,
          errorMessage: true,
          createdAt:    true,
          updatedAt:    true,
        },
      }),
    ])

    return NextResponse.json({ total, generations })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch generations', detail: message },
      { status: 502 },
    )
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const assetId = searchParams.get('id')?.trim()
  if (!assetId) {
    return NextResponse.json(
      { error: 'id query parameter is required' },
      { status: 400 },
    )
  }

  try {
    const existing = await db.generatedAsset.findFirst({
      where: { id: assetId, userId: user.id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Asset not found or does not belong to this user' },
        { status: 404 },
      )
    }

    // Soft-delete via status flag (schema has no deletedAt on GeneratedAsset)
    await db.generatedAsset.update({
      where: { id: assetId },
      data:  { status: 'deleted' },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete generation', detail: message },
      { status: 502 },
    )
  }
}
