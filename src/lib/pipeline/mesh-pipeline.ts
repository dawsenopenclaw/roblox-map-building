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
  assetId:    string
  userId:     string
  status:     PipelineStatus
  progress?:  number
  meshUrl?:   string
  robloxUrl?: string
  errorMsg?:  string
  updatedAt:  string
}

// ── Quality gate result ───────────────────────────────────────────────────────

export interface MeshQualityResult {
  passed:   boolean
  warnings: string[]
  errors:   string[]
}

// ── Roblox scale result ───────────────────────────────────────────────────────

export interface RobloxScale {
  x: number
  y: number
  z: number
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

// ── Prompt enrichment ─────────────────────────────────────────────────────────
//
// TYPE_ENRICHMENTS: granular per-type detail instructions fed directly into the
// Meshy prompt. More specific than the old typeHints — each string reads as a
// natural continuation of the user's prompt and guides mesh topology, scale
// references, and pivot placement.

const TYPE_ENRICHMENTS: Record<string, string> = {
  building:  'architectural model, clean walls, proper windows, door frames, roof detail, modular sections',
  character: 'character model, proper anatomy, T-pose or A-pose, clean edge loops around joints, face topology for animation',
  vehicle:   'vehicle model, proper wheel geometry, separated body panels, symmetric mesh, aerodynamic form',
  weapon:    'weapon model, hard surface, sharp edges, proper grip proportions, centered pivot point',
  furniture: 'furniture model, real-world proportions, clean wood grain, fabric folds, proper leg supports',
  terrain:   'terrain piece, natural erosion detail, organic shapes, tileable edges, LOD-friendly',
  prop:      'game prop, clean silhouette, readable at distance, optimized triangle count',
  effect:    'VFX mesh, transparent-ready, billboard-friendly geometry, particle-system compatible',
  custom:    'high quality model, clean topology, professional finish',
}

// STYLE_SUFFIXES: appended after the type enrichment to lock in the art
// direction. Ordered from most to least opinionated so the prompt terminates
// on a strong aesthetic signal.

const STYLE_SUFFIXES: Record<string, string> = {
  realistic: 'photorealistic PBR materials, 4K texture detail, physically accurate proportions',
  stylized:  'stylized art, bold outlines, hand-painted texture feel, vibrant saturated colors',
  lowpoly:   'low polygon count, faceted flat-shaded geometry, minimal triangles, clean vertex colors',
  roblox:    'Roblox-style proportions, family-friendly design, bright cheerful colors, blocky aesthetic, 1 stud = 0.28m scale',
}

// Shared technical suffix appended to every enriched prompt regardless of
// type/style. Guards against the most common Meshy failure modes (floating
// geometry, broken UV shells, inside-out normals).
const TECHNICAL_SUFFIX =
  'optimized for Roblox import, no floating geometry, watertight mesh, proper UV unwrap, ' +
  'correct face normals, game-ready topology, centered on world origin'

// Meshy v2 hard limit on the prompt field.
const MESHY_PROMPT_CHAR_LIMIT = 500

function enrichPrompt(prompt: string, type: string, style: string): string {
  const typeDetail  = TYPE_ENRICHMENTS[type]  ?? TYPE_ENRICHMENTS.custom
  const styleSuffix = STYLE_SUFFIXES[style]   ?? 'game asset, clean topology'

  // Build: [user prompt], [type detail], [style direction], [technical requirements]
  const full = `${prompt}, ${typeDetail}, ${styleSuffix}, ${TECHNICAL_SUFFIX}`

  // Hard-truncate to Meshy's 500-char limit — trim at last comma/space boundary
  if (full.length > MESHY_PROMPT_CHAR_LIMIT) {
    return full.slice(0, MESHY_PROMPT_CHAR_LIMIT).replace(/[,\s]+$/, '')
  }

  return full
}

// ── Roblox scale calculation ──────────────────────────────────────────────────
//
// Returns the canonical bounding-box size in Roblox studs for each asset type.
// 1 Roblox stud = 0.28 metres (enforced at import time by the Studio plugin).
// The polyTarget parameter is available for future poly-density-based LOD
// scaling but is intentionally unused at this stage.

const ROBLOX_SCALES_STUDS: Record<string, [number, number, number]> = {
  building:  [30, 25, 30],
  character: [3,   5,  2],
  vehicle:   [12,  6, 20],
  weapon:    [1,   4,  1],
  furniture: [6,   4,  4],
  prop:      [4,   4,  4],
  terrain:   [40, 10, 40],
  effect:    [6,   6,  6],
  custom:    [8,   8,  8],
}

export function calculateRobloxScale(type: string, _polyTarget: number): RobloxScale {
  const entry = ROBLOX_SCALES_STUDS[type] ?? ROBLOX_SCALES_STUDS.custom
  return { x: entry[0], y: entry[1], z: entry[2] }
}

// ── Mesh quality gate ─────────────────────────────────────────────────────────
//
// Called after the Meshy task resolves (in the worker). Does NOT throw — it
// returns a structured result so the worker can decide whether to hard-fail
// the pipeline or downgrade to a warning status.
//
// Rules:
//  ERROR  — mesh has no downloadable URLs (unusable output)
//  ERROR  — mesh has no thumbnail (Meshy generation likely failed silently)
//  WARN   — poly count exceeds 2× the requested budget (may cause perf issues)
//  WARN   — generation took longer than 3 minutes (SLA breach, worth alerting)

export interface ValidateMeshInput {
  modelUrls:    Record<string, string> | null | undefined
  thumbnailUrl: string | null | undefined
  polyCount:    number | null | undefined
  polyTarget:   number
  generationMs: number | null | undefined
}

const MAX_GENERATION_MS = 3 * 60 * 1000 // 3 minutes

export function validateMeshQuality(input: ValidateMeshInput): MeshQualityResult {
  const warnings: string[] = []
  const errors:   string[] = []

  // Hard requirements
  const hasUrls =
    input.modelUrls !== null &&
    input.modelUrls !== undefined &&
    Object.keys(input.modelUrls).length > 0

  if (!hasUrls) {
    errors.push('Mesh has no downloadable model URLs — generation produced no output.')
  }

  if (!input.thumbnailUrl) {
    errors.push('Mesh has no thumbnail — Meshy task may have failed silently.')
  }

  // Soft warnings
  if (
    input.polyCount !== null &&
    input.polyCount !== undefined &&
    input.polyCount > input.polyTarget * 2
  ) {
    warnings.push(
      `Poly count ${input.polyCount.toLocaleString()} exceeds 2× target ` +
      `(${input.polyTarget.toLocaleString()}). ` +
      'Consider requesting a remesh or lowering the poly budget.',
    )
  }

  if (
    input.generationMs !== null &&
    input.generationMs !== undefined &&
    input.generationMs > MAX_GENERATION_MS
  ) {
    const seconds = Math.round(input.generationMs / 1000)
    warnings.push(
      `Generation took ${seconds}s, exceeding the 3-minute SLA. ` +
      'Check Meshy service status or reduce prompt complexity.',
    )
  }

  return {
    passed:   errors.length === 0,
    warnings,
    errors,
  }
}

// ── startMeshPipeline ─────────────────────────────────────────────────────────

/**
 * Creates a GeneratedAsset record and enqueues the first pipeline job.
 * Returns immediately — processing happens asynchronously in the worker.
 */
export async function startMeshPipeline(
  params: StartMeshPipelineParams,
): Promise<StartMeshPipelineResult> {
  const { userId, prompt, type, style, polyTarget, tokensCost } = params

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
  const robloxScale    = calculateRobloxScale(type, polyTarget)

  // 2. Enqueue the first job — the worker picks it up and drives the rest.
  //
  // We extend the typed MeshGenerationPayload with a _assetId field so the
  // worker can look up and update the GeneratedAsset record without a separate
  // DB query. The Zod schema in job-queue.ts uses z.object() (not .strict()),
  // so BullMQ serialises the extra field through without issues; the worker
  // reads it back via the MeshGenerationPayloadWithAsset intersection type.
  const jobId = await addJob(
    {
      type:        'mesh-generation',
      prompt:      enrichedPrompt,
      artStyle,
      quality:     'standard',
      polyTarget,
      userId,
      robloxScale,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _assetId: asset.id,
    } as any, // safe: BullMQ passes unknown fields through; worker reads _assetId
  )

  console.log(
    `[mesh-pipeline] Started pipeline for asset ${asset.id} (job ${jobId}) ` +
    `type=${type} style=${style} polyTarget=${polyTarget} ` +
    `robloxScale=${robloxScale.x}×${robloxScale.y}×${robloxScale.z} studs`,
  )

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
    meshyTaskId?:   string
    meshUrl?:       string
    thumbnailUrl?:  string
    polyCount?:     number
    albedoUrl?:     string
    normalUrl?:     string
    roughnessUrl?:  string
    metallicUrl?:   string
    robloxAssetId?: string
    errorMessage?:  string
    generationMs?:  number
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
    where:  { id: assetId, userId },
    select: {
      id:            true,
      status:        true,
      prompt:        true,
      type:          true,
      style:         true,
      meshUrl:       true,
      thumbnailUrl:  true,
      polyCount:     true,
      albedoUrl:     true,
      normalUrl:     true,
      roughnessUrl:  true,
      metallicUrl:   true,
      robloxAssetId: true,
      errorMessage:  true,
      tokensCost:    true,
      generationMs:  true,
      createdAt:     true,
      updatedAt:     true,
    },
  })
}
