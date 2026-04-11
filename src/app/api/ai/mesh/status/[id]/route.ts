/**
 * GET /api/ai/mesh/status/[id]
 *
 * Returns the current state of a mesh generation job by its GeneratedAsset
 * row id. Used by the client to poll long-running jobs submitted via
 * /api/ai/mesh/generate.
 *
 * Only the owning user can read the status.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const asset = await db.generatedAsset.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      prompt: true,
      style: true,
      type: true,
      meshyTaskId: true,
      meshUrl: true,
      thumbnailUrl: true,
      polyCount: true,
      robloxAssetId: true,
      tokensCost: true,
      generationMs: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Owner-only access. Admins use a different endpoint.
  if (asset.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    id: asset.id,
    status: asset.status,
    prompt: asset.prompt,
    style: asset.style,
    type: asset.type,
    meshyTaskId: asset.meshyTaskId,
    meshUrl: asset.meshUrl,
    thumbnailUrl: asset.thumbnailUrl,
    polyCount: asset.polyCount,
    assetId: asset.robloxAssetId,
    tokensCost: asset.tokensCost,
    generationMs: asset.generationMs,
    errorMessage: asset.errorMessage,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  })
}
