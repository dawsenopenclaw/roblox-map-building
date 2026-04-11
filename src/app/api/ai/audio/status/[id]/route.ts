/**
 * GET /api/ai/audio/status/[id]
 *
 * Poll status for an in-flight audio generation job.
 * Returns the current `GeneratedAsset` row for the given id, provided the
 * authenticated user owns it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (db as any).generatedAsset.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      prompt: true,
      robloxAssetId: true,
      externalTaskId: true,
      sourceUrl: true,
      moderationState: true,
      errorMessage: true,
      durationMs: true,
      createdAt: true,
      completedAt: true,
      updatedAt: true,
    },
  })

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    id: row.id,
    type: row.type,
    status: row.status,
    prompt: row.prompt,
    assetId: row.robloxAssetId,
    rbxAssetId: row.robloxAssetId ? `rbxassetid://${row.robloxAssetId}` : null,
    externalTaskId: row.externalTaskId,
    sourceUrl: row.sourceUrl,
    moderationState: row.moderationState,
    errorMessage: row.errorMessage,
    durationMs: row.durationMs,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
    message:
      row.status === 'pending_moderation'
        ? 'Audio uploading & being moderated by Roblox...'
        : undefined,
  })
}
