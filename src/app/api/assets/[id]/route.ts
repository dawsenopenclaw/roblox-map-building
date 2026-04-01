import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// ─── GET /api/assets/[id] — get single asset details ─────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

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
      prompt: true,
      type: true,
      style: true,
      status: true,
      meshyTaskId: true,
      meshUrl: true,
      thumbnailUrl: true,
      polyCount: true,
      albedoUrl: true,
      normalUrl: true,
      roughnessUrl: true,
      metallicUrl: true,
      robloxAssetId: true,
      qualityScore: true,
      fileSize: true,
      tokensCost: true,
      generationMs: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  // Users may only view their own assets
  if (asset.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(asset)
}

// ─── DELETE /api/assets/[id] — delete an asset ───────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Fetch first so we can enforce ownership before deleting
  const asset = await db.generatedAsset.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  })

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (asset.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Block deletion while a generation is actively in progress — the Meshy
  // callback still needs a record to write to. Callers should cancel first.
  const inFlight = ['queued', 'generating', 'optimizing', 'uploading']
  if (inFlight.includes(asset.status)) {
    return NextResponse.json(
      { error: 'Cannot delete an asset while it is generating. Cancel the task first.' },
      { status: 409 },
    )
  }

  await db.generatedAsset.delete({ where: { id } })

  return NextResponse.json({ deleted: true })
}
