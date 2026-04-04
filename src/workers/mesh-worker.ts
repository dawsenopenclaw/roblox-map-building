/**
 * Mesh Generation Worker
 *
 * Run this in a dedicated process — NOT inside the Next.js app server.
 *
 *   npx tsx src/workers/mesh-worker.ts
 *   # or via scripts/worker.ts which imports and calls bootstrap()
 *
 * Processes 'mesh-generation' jobs from the BullMQ asset-generation queue.
 * On completion it queues the next step (roblox-upload).
 *
 * Job payload flow:
 *   mesh-generation → [worker calls Meshy, updates DB] → roblox-upload
 *
 * The GeneratedAsset record ID is stored in the job's `name` suffix so
 * the worker can find it without a separate lookup. Convention:
 *   job data includes a `_assetId` extension field written by startMeshPipeline.
 *
 * Because BullMQ's typed payload is the canonical MeshGenerationPayload
 * (which doesn't have _assetId), we extend the type here locally and cast safely.
 */

import { setupWorker, addJob } from '@/lib/job-queue'
import type { MeshGenerationPayload, MeshGenerationPayloadWithAsset, MeshGenerationResult, RobloxUploadPayload } from '@/lib/job-queue'
import type { Job } from 'bullmq'
import type { JobResult } from '@/lib/job-queue'
import { createMeshyTask, pollMeshyTask, downloadMeshyAsset } from '@/lib/ai/meshy'
import { generateTextures } from '@/lib/ai/fal'
import { updateAssetStatus } from '@/lib/pipeline/mesh-pipeline'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'

// ── Constants ─────────────────────────────────────────────────────────────────

const TMP_DIR = path.join(os.tmpdir(), 'forgegames-meshes')

// ── Mesh generation processor ─────────────────────────────────────────────────

async function processMeshGeneration(
  job: Job<MeshGenerationPayload, JobResult, 'mesh-generation'>,
): Promise<MeshGenerationResult> {
  const payload  = job.data as MeshGenerationPayloadWithAsset
  const assetId  = payload._assetId
  const apiKey   = process.env.MESHY_API_KEY

  if (!apiKey) {
    throw new Error('MESHY_API_KEY is not configured on the worker process')
  }

  const startMs = Date.now()

  // ── Step 1: Mark as generating ────────────────────────────────────────────

  if (assetId) {
    await updateAssetStatus(assetId, 'generating')
  }

  await job.updateProgress(5)

  // ── Step 2: Create Meshy task ─────────────────────────────────────────────

  console.log(`[mesh-worker] job ${job.id} — creating Meshy task`)

  const taskId = await createMeshyTask({
    prompt:     payload.prompt,
    polyTarget: payload.polyTarget,
    artStyle:   payload.artStyle,
    apiKey,
  })

  if (assetId) {
    await updateAssetStatus(assetId, 'generating', { meshyTaskId: taskId })
  }

  await job.updateProgress(15)

  // ── Step 3: Poll Meshy + optionally generate textures in parallel ─────────

  const falKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  const [meshTask, textures] = await Promise.all([
    pollMeshyTask({
      taskId,
      apiKey,
      onProgress: async (p: number) => {
        // Map Meshy's 0-100 progress into 15-70% of overall job progress
        const scaled = 15 + Math.round(p * 0.55)
        await job.updateProgress(scaled)
      },
    }),
    falKey
      ? generateTextures({ prompt: payload.prompt, apiKey: falKey })
      : Promise.resolve(null),
  ])

  await job.updateProgress(70)

  // ── Step 4: Extract URLs from completed task ──────────────────────────────

  if (meshTask.status === 'IN_PROGRESS') {
    // Polling timed out — store what we have and mark partial
    if (assetId) {
      await updateAssetStatus(assetId, 'generating', {
        meshyTaskId: taskId,
        errorMessage: 'Meshy polling timed out — task still running',
      })
    }

    return {
      meshUrl:      null,
      thumbnailUrl: null,
      polyCount:    null,
      taskId,
    }
  }

  const meshUrl      = meshTask.model_urls?.glb ?? meshTask.model_urls?.fbx ?? meshTask.model_urls?.obj ?? null
  const thumbnailUrl = meshTask.thumbnail_url ?? null
  const polyCount    = meshTask.polygon_count ?? payload.polyTarget

  if (assetId) {
    await updateAssetStatus(assetId, 'optimizing', {
      meshyTaskId:  taskId,
      meshUrl:      meshUrl ?? undefined,
      thumbnailUrl: thumbnailUrl ?? undefined,
      polyCount,
      albedoUrl:    textures?.albedo    ?? undefined,
      normalUrl:    textures?.normal    ?? undefined,
      roughnessUrl: textures?.roughness ?? undefined,
      metallicUrl:  textures?.metallic  ?? undefined,
    })
  }

  await job.updateProgress(80)

  // ── Step 5: Download GLB for Roblox upload ────────────────────────────────

  let localFilePath: string | null = null

  if (meshTask.model_urls) {
    try {
      const downloaded = await downloadMeshyAsset(meshTask)

      await mkdir(TMP_DIR, { recursive: true })
      const fileName = `${taskId}.${downloaded.format}`
      localFilePath  = path.join(TMP_DIR, fileName)
      await writeFile(localFilePath, downloaded.buffer)

      console.log(`[mesh-worker] job ${job.id} — saved mesh to ${localFilePath}`)
    } catch (err) {
      // Non-fatal — upload step will fail gracefully
      console.warn(`[mesh-worker] job ${job.id} — mesh download failed:`, err)
    }
  }

  await job.updateProgress(90)

  // ── Step 6: Enqueue Roblox upload ─────────────────────────────────────────

  if (localFilePath && assetId) {
    const uploadPayload: RobloxUploadPayload & { _assetId?: string } = {
      type:       'roblox-upload',
      assetPath:  localFilePath,
      assetName:  payload.prompt.slice(0, 250),
      creatorId:  process.env.ROBLOX_CREATOR_ID ?? '',
      assetType:  'Model',
      userId:     payload.userId,
      // Carry assetId forward
      _assetId:   assetId,
    }

    await addJob(uploadPayload as RobloxUploadPayload)

    if (assetId) {
      await updateAssetStatus(assetId, 'uploading')
    }
  } else if (assetId) {
    // No Roblox key or no local file — mark ready with just the Meshy URL
    const generationMs = Date.now() - startMs
    await updateAssetStatus(assetId, 'ready', { generationMs })
  }

  await job.updateProgress(100)

  console.log(`[mesh-worker] job ${job.id} — mesh generation complete (task ${taskId})`)

  return {
    meshUrl,
    thumbnailUrl,
    polyCount,
    taskId,
  }
}

// ── Roblox upload processor ───────────────────────────────────────────────────

async function processRobloxUpload(
  job: Job<RobloxUploadPayload, JobResult, 'roblox-upload'>,
): Promise<JobResult> {
  const payload = job.data as RobloxUploadPayload & { _assetId?: string }
  const assetId = payload._assetId

  const robloxApiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY

  if (!robloxApiKey) {
    // Roblox upload is optional — mark ready without it
    console.warn('[mesh-worker] ROBLOX_OPEN_CLOUD_API_KEY not set — skipping upload')
    if (assetId) {
      await updateAssetStatus(assetId, 'ready')
    }
    return {
      assetId:     '',
      rbxAssetUrl: '',
      operationId: '',
    }
  }

  await job.updateProgress(10)

  if (assetId) {
    await updateAssetStatus(assetId, 'uploading')
  }

  // Dynamic import to avoid pulling open-cloud deps into the hot path
  const { uploadToRoblox, pollUploadStatus } = await import('@/lib/roblox/open-cloud')

  const fileName = path.basename(payload.assetPath)

  const { operationId } = await uploadToRoblox({
    filePath:    payload.assetPath,
    fileName,
    assetType:   payload.assetType === 'MeshPart' ? 'Model' : (payload.assetType as 'Model' | 'Decal' | 'Audio'),
    description: `Generated by ForjeAI: ${payload.assetName}`,
  })

  await job.updateProgress(50)

  // Poll for moderation
  const result = await pollUploadStatus(operationId)

  if (result.done && result.assetId) {
    if (assetId) {
      await updateAssetStatus(assetId, 'ready', {
        robloxAssetId: result.assetId,
      })
    }

    await job.updateProgress(100)
    console.log(`[mesh-worker] job ${job.id} — Roblox upload complete: ${result.assetId}`)

    return {
      assetId:     result.assetId,
      rbxAssetUrl: `rbxassetid://${result.assetId}`,
      operationId,
    }
  }

  // Moderation rejected or timed out
  const reason = result.done
    ? `Moderation result: ${result.moderationResult ?? 'rejected'}`
    : 'Moderation polling timed out'

  if (assetId) {
    await updateAssetStatus(assetId, 'failed', { errorMessage: reason })
  }

  throw new Error(reason)
}

// ── bootstrap ─────────────────────────────────────────────────────────────────

/**
 * Registers processors and starts the BullMQ worker.
 * Call from scripts/worker.ts or any standalone Node process.
 */
export function bootstrap() {
  const worker = setupWorker({
    'mesh-generation': processMeshGeneration as Parameters<typeof setupWorker>[0]['mesh-generation'],
    'roblox-upload':   processRobloxUpload   as Parameters<typeof setupWorker>[0]['roblox-upload'],
  })

  console.log('[mesh-worker] Worker started — listening for mesh-generation + roblox-upload jobs')
  return worker
}

// ── Auto-start when run directly ──────────────────────────────────────────────

// Detect if this file is the entry point (tsx src/workers/mesh-worker.ts)
if (require.main === module) {
  bootstrap()
}
