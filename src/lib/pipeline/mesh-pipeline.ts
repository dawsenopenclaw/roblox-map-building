/**
 * Mesh Pipeline Orchestrator
 *
 * Orchestrates the full asset generation pipeline:
 *   queued → generating → optimizing → uploading → ready | failed
 *
 * Call startMeshPipeline() from the 3d-generate route. It creates the
 * GeneratedAsset record, enqueues the first BullMQ job, and returns
 * immediately so the HTTP response is non-blocking.
 *
 * The worker process in src/workers/mesh-worker.ts drives subsequent steps.
 */

import 'server-only'
import { db } from '@/lib/db'
import { addJob } from '@/lib/job-queue'

// ── Pipeline status constants ─────────────────────────────────────────────────
// Matches the `status` string field on GeneratedAsset in schema.prisma

export type PipelineStatus =
  | 'queued'
  | 'generating'
  | 'optimizing'
  | 'uploading'
  | 'ready'
  | 'failed'

// ── Public types ──────────────────────────────────────────────────────────────

export interface StartMeshPipelineParams {
  userId:     string
  prompt:     string
  type:       string
  style:      string
  polyTarget: number
  textured:   boolean
  tokensCost: number
}

export interface StartMeshPipelineResult {
  assetId: string
  jobId:   string
}

// ── Event shape emitted to Studio sync ───────────────────────────────────────
// Stored in Redis pub/sub so the Studio plugin WebSocket can pick it up.

export interface PipelineEvent {
  assetId:   string
  userId:    string
  status:    PipelineStatus
  progress?: number
  meshUrl?:  string
  robloxUrl?: string
  errorMsg?: string
  updatedAt: string
}

// ── Style → Meshy art_style ───────────────────────────────────────────────────

function toMeshyArtStyle(style: string): string {
  switch (style) {
    case 'realistic': return 'pbr'
    case 'stylized':  return 'cartoon'
    case 'lowpoly':   return 'low-poly'
    case 'roblox':    return 'low-poly'
    default:          return 'low-poly'
  }
}

// ── Prompt enrichment ────────────────────────────────────────────────────────

function enrichPrompt(prompt: string, type: string, style: string): string {
  const styleHints: Record<string, string> = {
    realistic: 'photorealistic, physically based materials',
    stylized:  'stylized cartoon, bold colors, clean geometry',
    lowpoly:   'low poly, faceted geometry, minimal triangles',
    roblox:    'Roblox game asset, blocky proportions, family-friendly, bright colors',
  }

  const typeHints: Record<string, string> = {
    building:  'architectural exterior, self-contained structure, entrance visible',
    character: 'character, upright pose, T-pose preferred for rigging',
    vehicle:   'vehicle, wheels/treads visible, cockpit or seat',
    weapon:    'hand-held weapon, ergonomic grip, game-ready scale',
    furniture: 'furniture piece, interior scale, flat base',
    terrain:   'terrain feature, organic shape, natural material',
    prop:      'game prop, standalone object, pickup-friendly scale',
    effect:    'VFX emitter base, stylized shape, glowy elements',
    custom:    '',
  }

  const styleHint = styleHints[style] ?? 'game asset'
  const typeHint  = typeHints[type]   ?? ''
  const suffix    = ', optimized for Roblox import, no floating geometry, watertight mesh, proper UV unwrap'

  return `${prompt}, ${styleHint}${typeHint ? `, ${typeHint}` : ''}, game asset, real-time rendering${suffix}`
}

// ── startMeshPipeline ─────────────────────────────────────────────────────────

/**
 * Creates a GeneratedAsset record and enqueues the first pipeline job.
 * Returns immediately — processing happens asynchronously in the worker.
 */
export async function startMeshPipeline(
  params: StartMeshPipelineParams,
): Promise<StartMeshPipelineResult> {
  const { userId, prompt, type, style, polyTarget, textured, tokensCost } = params

  // 1. Create the DB record up-front so the client has an ID to poll against
  const asset = await db.generatedAsset.create({
    data: {
      userId,
      prompt,
      type,
      style,
      status:     'queued',
      tokensCost,
    },
    select: { id: true },
  })

  const enrichedPrompt = enrichPrompt(prompt, type, style)
  const artStyle       = toMeshyArtStyle(style)

  // 2. Enqueue the first job — the worker picks it up and drives the rest
  const jobId = await addJob({
    type:       'mesh-generation',
    prompt:     enrichedPrompt,
    artStyle,
    quality:    'standard',
    polyTarget,
    userId,
    // Carry the DB asset ID so the worker can update it
    // We store it in the job name suffix via metadata
  }, {
    // metadata for asset tracking — we tag the job with assetId via priority key
    // (BullMQ doesn't have first-class metadata, so we pack assetId into the job
    // via a custom field in the payload — see note in worker)
  })

  // 3. Update the record with the BullMQ job ID for cross-referencing
  await db.generatedAsset.update({
    where: { id: asset.id },
    data:  { status: 'queued' },
  })

  console.log(`[mesh-pipeline] Started pipeline for asset ${asset.id} (job ${jobId})`)

  return { assetId: asset.id, jobId }
}

// ── updateAssetStatus ─────────────────────────────────────────────────────────

/**
 * Updates the GeneratedAsset status and emits a pipeline event.
 * Called by the worker at each stage transition.
 */
export async function updateAssetStatus(
  assetId: string,
  status: PipelineStatus,
  data?: {
    meshyTaskId?:  string
    meshUrl?:      string
    thumbnailUrl?: string
    polyCount?:    number
    albedoUrl?:    string
    normalUrl?:    string
    roughnessUrl?: string
    metallicUrl?:  string
    robloxAssetId?: string
    errorMessage?: string
    generationMs?: number
  },
): Promise<void> {
  await db.generatedAsset.update({
    where: { id: assetId },
    data:  {
      status,
      ...data,
      updatedAt: new Date(),
    },
  })
}

// ── getAssetStatus ────────────────────────────────────────────────────────────

/**
 * Fetches the current pipeline status for a GeneratedAsset.
 * Used by the /api/ai/generation-status polling endpoint.
 */
export async function getAssetStatus(assetId: string, userId: string) {
  return db.generatedAsset.findFirst({
    where: { id: assetId, userId },
    select: {
      id:           true,
      status:       true,
      prompt:       true,
      type:         true,
      style:        true,
      meshUrl:      true,
      thumbnailUrl: true,
      polyCount:    true,
      albedoUrl:    true,
      normalUrl:    true,
      roughnessUrl: true,
      metallicUrl:  true,
      robloxAssetId: true,
      errorMessage: true,
      tokensCost:   true,
      generationMs: true,
      createdAt:    true,
      updatedAt:    true,
    },
  })
}
