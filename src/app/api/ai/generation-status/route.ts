/**
 * GET /api/ai/generation-status?assetId=xxx
 * GET /api/ai/generation-status?jobId=xxx   (legacy BullMQ-only polling)
 *
 * Preferred: poll by assetId — returns the full GeneratedAsset record from the
 * database, updated at each pipeline stage by the worker.
 *
 * Legacy: poll by jobId — returns raw BullMQ job state + progress.
 *
 * Response shapes:
 *
 *   assetId mode (status field mirrors pipeline stages):
 *     { assetId, status: "queued"|"generating"|"optimizing"|"uploading"|"ready"|"failed",
 *       meshUrl, thumbnailUrl, polyCount, albedoUrl, normalUrl, roughnessUrl, metallicUrl,
 *       robloxAssetId, rbxAssetUrl, errorMessage, tokensCost, generationMs,
 *       createdAt, updatedAt }
 *
 *   jobId mode (BullMQ state):
 *     { jobId, type, state: "waiting"|"active"|"completed"|"failed"|"delayed"|"unknown",
 *       progress: 0-100, result, failReason, createdAt, finishedAt }
 *
 * Auth: Clerk (required — 401 if unauthenticated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getJobStatus } from '@/lib/job-queue'
import { getAssetStatus } from '@/lib/pipeline/mesh-pipeline'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const assetId = searchParams.get('assetId')?.trim()
  const jobId   = searchParams.get('jobId')?.trim()

  // ── assetId mode — preferred ───────────────────────────────────────────────

  if (assetId) {
    try {
      const asset = await getAssetStatus(assetId, userId)

      if (!asset) {
        return NextResponse.json(
          { error: 'Asset not found or does not belong to this user' },
          { status: 404 },
        )
      }

      return NextResponse.json({
        assetId:       asset.id,
        status:        asset.status,
        prompt:        asset.prompt,
        type:          asset.type,
        style:         asset.style,
        meshUrl:       asset.meshUrl,
        thumbnailUrl:  asset.thumbnailUrl,
        polyCount:     asset.polyCount,
        albedoUrl:     asset.albedoUrl,
        normalUrl:     asset.normalUrl,
        roughnessUrl:  asset.roughnessUrl,
        metallicUrl:   asset.metallicUrl,
        robloxAssetId: asset.robloxAssetId,
        rbxAssetUrl:   asset.robloxAssetId ? `rbxassetid://${asset.robloxAssetId}` : null,
        errorMessage:  asset.errorMessage,
        tokensCost:    asset.tokensCost,
        generationMs:  asset.generationMs,
        createdAt:     asset.createdAt,
        updatedAt:     asset.updatedAt,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Failed to fetch asset status', detail: message },
        { status: 502 },
      )
    }
  }

  // ── jobId mode — legacy BullMQ polling ────────────────────────────────────

  if (jobId) {
    try {
      const status = await getJobStatus(jobId)
      return NextResponse.json(status)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Failed to fetch job status', detail: message },
        { status: 502 },
      )
    }
  }

  return NextResponse.json(
    { error: 'assetId or jobId query parameter is required' },
    { status: 400 },
  )
}
