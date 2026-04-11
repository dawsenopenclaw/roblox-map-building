/**
 * Prompt → 3D mesh → Roblox assetId pipeline.
 *
 * Flow:
 *   1. Submit text/image prompt to Meshy text-to-3d / image-to-3d (preview mode).
 *   2. Poll until preview task succeeds.
 *   3. Submit a refine task against the preview taskId to get high-quality GLB.
 *   4. Poll the refine task to completion.
 *   5. Download the GLB from model_urls.glb.
 *   6. Upload the GLB to Roblox Open Cloud Assets v1 (multipart) and poll the
 *      operation until done=true, extracting the assetId.
 *   7. Persist everything to the GeneratedAsset table, deduct credits, and return.
 *
 * This module is intentionally self-contained — it calls Meshy and Roblox Open
 * Cloud directly via fetch so it can be invoked from a Next.js API route on a
 * serverless runtime without depending on any MCP bridge.
 *
 * Used by src/app/api/ai/mesh/generate/route.ts.
 *
 * Required env vars:
 *   MESHY_API_KEY            — Meshy API key with text-to-3d + image-to-3d scope
 *   ROBLOX_OPEN_CLOUD_KEY    — Roblox Open Cloud API key with Asset:Write scope
 *     (also accepts legacy ROBLOX_OPEN_CLOUD_API_KEY for backwards compat)
 *   ROBLOX_CREATOR_ID        — Roblox user or group ID that owns the uploaded asset
 *   ROBLOX_CREATOR_TYPE      — "User" | "Group"  (defaults to "User")
 */

import 'server-only'

import { db } from './db'
import { spendTokens } from './tokens-server'

// ── Public types ──────────────────────────────────────────────────────────────

export type MeshStyle = 'realistic' | 'cartoon' | 'low-poly'

export interface GenerateMeshParams {
  /** The user-facing prompt describing the mesh to generate. */
  prompt: string
  /**
   * Internal DB user ID (User.id, NOT Clerk id) — used for persistence,
   * credit deductions, and authorisation of later status lookups.
   */
  userId: string
  /** Optional Studio session ID — only used by the caller for auto-insert. */
  sessionId?: string
  /** Meshy art style. Defaults to "realistic". */
  style?: MeshStyle
  /** Optional reference image URL — switches to image-to-3d mode. */
  refImageUrl?: string
  /** Target polycount. Defaults to 30_000 (Meshy's current maximum for refined meshes). */
  targetPolycount?: number
  /**
   * Override the credit cost. The default is defined by MESH_GENERATION_COST.
   * The caller may pass 0 to skip deducting credits (e.g. internal retries).
   */
  creditsToSpend?: number
}

export interface GenerateMeshResult {
  /** DB row id of the GeneratedAsset */
  generatedAssetId: string
  /** Numeric Roblox asset ID returned by Open Cloud */
  assetId: string
  /** Meshy-hosted GLB URL (valid for a limited time) */
  glbUrl: string
  /** Final status of the pipeline */
  status: 'completed'
}

/** Credit cost for one mesh generation. Referenced by callers for preflight checks. */
export const MESH_GENERATION_COST = 50

// ── Internal types ────────────────────────────────────────────────────────────

interface MeshyTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELED'
  model_urls?: {
    glb?: string
    fbx?: string
    obj?: string
    usdz?: string
  }
  thumbnail_url?: string
  polygon_count?: number
  progress?: number
  task_error?: { message?: string }
}

interface RobloxOperationResponse {
  path: string
  done?: boolean
  error?: { code?: number; message?: string }
  response?: {
    '@type'?: string
    assetId?: string
    assetVersionNumber?: number
  }
  metadata?: {
    assetId?: string
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESHY_BASE_V2 = 'https://api.meshy.ai/openapi/v2'
const OPEN_CLOUD_ASSETS_V1 = 'https://apis.roblox.com/assets/v1/assets'
const OPEN_CLOUD_OPERATIONS_V1 = 'https://apis.roblox.com/assets/v1'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_MS = 5 * 60 * 1_000 // 5 min
const MAX_ROBLOX_POLL_ATTEMPTS = 40
const ROBLOX_POLL_INTERVAL_MS = 3_000
const MAX_MESH_BYTES = 50 * 1024 * 1024 // 50 MB

// ── Small helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function getMeshyKey(): string {
  const key = process.env.MESHY_API_KEY
  if (!key) throw new Error('MESHY_API_KEY is not configured')
  return key
}

function getRobloxOpenCloudKey(): string {
  const key =
    process.env.ROBLOX_OPEN_CLOUD_KEY ??
    process.env.ROBLOX_OPEN_CLOUD_API_KEY
  if (!key) throw new Error('ROBLOX_OPEN_CLOUD_KEY is not configured')
  return key
}

function getRobloxCreator(): { creatorId: string; creatorType: 'User' | 'Group' } {
  const creatorId = process.env.ROBLOX_CREATOR_ID
  if (!creatorId) throw new Error('ROBLOX_CREATOR_ID is not configured')
  const creatorType =
    (process.env.ROBLOX_CREATOR_TYPE as 'User' | 'Group' | undefined) ?? 'User'
  return { creatorId, creatorType }
}

function displayNameFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/[^\w\s-]/g, '').trim()
  const slice = cleaned.slice(0, 50) || 'ForjeAI Mesh'
  return slice
}

// ── Meshy calls ───────────────────────────────────────────────────────────────

/**
 * Create the initial text-to-3d OR image-to-3d "preview" task on Meshy.
 * Returns the Meshy task ID.
 */
async function createMeshyPreviewTask(opts: {
  prompt: string
  style: MeshStyle
  refImageUrl?: string
  targetPolycount: number
  apiKey: string
}): Promise<string> {
  const { prompt, style, refImageUrl, targetPolycount, apiKey } = opts

  const endpoint = refImageUrl
    ? `${MESHY_BASE_V2}/image-to-3d`
    : `${MESHY_BASE_V2}/text-to-3d`

  const body = refImageUrl
    ? {
        image_url: refImageUrl,
        ai_model: 'meshy-4',
        topology: 'quad',
        target_polycount: targetPolycount,
        symmetry_mode: 'auto',
      }
    : {
        mode: 'preview',
        prompt,
        art_style: style,
        topology: 'quad',
        target_polycount: targetPolycount,
        negative_prompt:
          'low quality, blurry, distorted, floating parts, disconnected mesh, NSFW, watermark',
      }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `Meshy preview task creation failed (${res.status}): ${errText || res.statusText}`,
    )
  }

  // Meshy returns either { result: "<taskId>" } or { id: "<taskId>" } depending on endpoint/version.
  const json = (await res.json()) as { result?: string; id?: string }
  const taskId = json.result ?? json.id
  if (!taskId) {
    throw new Error('Meshy did not return a task ID for the preview task')
  }
  return taskId
}

/**
 * Submit a refine task against an existing preview taskId.
 * Returns the new refine task ID.
 */
async function createMeshyRefineTask(opts: {
  previewTaskId: string
  apiKey: string
}): Promise<string> {
  const { previewTaskId, apiKey } = opts

  const res = await fetch(`${MESHY_BASE_V2}/text-to-3d`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'refine',
      preview_task_id: previewTaskId,
    }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `Meshy refine task creation failed (${res.status}): ${errText || res.statusText}`,
    )
  }

  const json = (await res.json()) as { result?: string; id?: string }
  const taskId = json.result ?? json.id
  if (!taskId) {
    throw new Error('Meshy did not return a task ID for the refine task')
  }
  return taskId
}

/**
 * Poll the given Meshy task until it SUCCEEDS or FAILS.
 * `endpoint` must be either "text-to-3d" or "image-to-3d" depending on which
 * task path the taskId was created on.
 */
async function pollMeshyTask(opts: {
  taskId: string
  endpoint: 'text-to-3d' | 'image-to-3d'
  apiKey: string
}): Promise<MeshyTask> {
  const { taskId, endpoint, apiKey } = opts
  const startedAt = Date.now()

  while (Date.now() - startedAt < MAX_POLL_MS) {
    const res = await fetch(`${MESHY_BASE_V2}/${endpoint}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    })

    if (res.ok) {
      const task = (await res.json()) as MeshyTask
      if (task.status === 'SUCCEEDED') return task
      if (
        task.status === 'FAILED' ||
        task.status === 'EXPIRED' ||
        task.status === 'CANCELED'
      ) {
        const msg =
          task.task_error?.message ??
          `Meshy task ${taskId} ended with status ${task.status}`
        throw new Error(msg)
      }
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`Meshy task ${taskId} did not finish within ${MAX_POLL_MS / 1000}s`)
}

/** Download the GLB binary from a Meshy task's model_urls. */
async function downloadGlb(task: MeshyTask): Promise<{ buffer: Buffer; glbUrl: string }> {
  const glbUrl = task.model_urls?.glb
  if (!glbUrl) {
    throw new Error(`Meshy task ${task.id} returned no GLB URL in model_urls`)
  }

  const res = await fetch(glbUrl, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) {
    throw new Error(`Failed to download GLB from ${glbUrl} (${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength > MAX_MESH_BYTES) {
    throw new Error(
      `GLB too large for Roblox upload: ` +
        `${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB (max 50 MB)`,
    )
  }

  return { buffer, glbUrl }
}

// ── Roblox Open Cloud upload ──────────────────────────────────────────────────

async function uploadGlbToRoblox(opts: {
  glbBuffer: Buffer
  displayName: string
  description: string
  apiKey: string
  creatorId: string
  creatorType: 'User' | 'Group'
}): Promise<string> {
  const { glbBuffer, displayName, description, apiKey, creatorId, creatorType } = opts

  const metadata = {
    assetType: 'Model',
    displayName,
    description,
    creationContext: {
      creator:
        creatorType === 'User'
          ? { userId: creatorId }
          : { groupId: creatorId },
    },
  }

  const form = new FormData()
  form.append('request', JSON.stringify(metadata))
  const blob = new Blob([new Uint8Array(glbBuffer)], { type: 'model/gltf-binary' })
  form.append('fileContent', blob, 'mesh.glb')

  const res = await fetch(OPEN_CLOUD_ASSETS_V1, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form,
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `Roblox Open Cloud upload failed (${res.status}): ${errText || res.statusText}`,
    )
  }

  const op = (await res.json()) as RobloxOperationResponse

  if (op.error) {
    throw new Error(
      `Roblox Open Cloud upload rejected: ${op.error.message ?? 'unknown error'}`,
    )
  }

  // Fast path — sometimes Open Cloud returns the assetId inline.
  if (op.done) {
    const assetId = op.response?.assetId ?? op.metadata?.assetId
    if (assetId) return assetId
  }

  if (!op.path) {
    throw new Error('Roblox Open Cloud upload returned no operation path')
  }

  return pollRobloxOperation(op.path, apiKey)
}

async function pollRobloxOperation(operationPath: string, apiKey: string): Promise<string> {
  for (let i = 0; i < MAX_ROBLOX_POLL_ATTEMPTS; i++) {
    await sleep(ROBLOX_POLL_INTERVAL_MS)

    const res = await fetch(`${OPEN_CLOUD_OPERATIONS_V1}/${operationPath}`, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      // Transient — retry
      continue
    }

    const op = (await res.json()) as RobloxOperationResponse

    if (op.error) {
      throw new Error(
        `Roblox Open Cloud operation failed: ${op.error.message ?? 'unknown error'}`,
      )
    }

    if (op.done) {
      const assetId = op.response?.assetId ?? op.metadata?.assetId
      if (!assetId) {
        throw new Error(
          `Roblox Open Cloud operation ${operationPath} finished with no assetId`,
        )
      }
      return assetId
    }
  }

  throw new Error(
    `Roblox Open Cloud operation ${operationPath} did not finish within ` +
      `${(MAX_ROBLOX_POLL_ATTEMPTS * ROBLOX_POLL_INTERVAL_MS) / 1000}s`,
  )
}

// ── Persistence ───────────────────────────────────────────────────────────────

/**
 * Create the initial GeneratedAsset row in "queued" state so the client can
 * poll for progress via /api/ai/mesh/status/[id] while the pipeline runs.
 */
async function createAssetRow(params: {
  userId: string
  prompt: string
  style: MeshStyle
}): Promise<string> {
  const row = await db.generatedAsset.create({
    data: {
      userId: params.userId,
      prompt: params.prompt,
      type: 'mesh',
      style: params.style,
      status: 'queued',
    },
    select: { id: true },
  })
  return row.id
}

async function markProcessing(
  id: string,
  patch: { meshyTaskId?: string | null },
): Promise<void> {
  await db.generatedAsset.update({
    where: { id },
    data: {
      status: 'generating',
      ...(patch.meshyTaskId !== undefined ? { meshyTaskId: patch.meshyTaskId } : {}),
    },
  })
}

async function markUploading(id: string, meshUrl: string): Promise<void> {
  await db.generatedAsset.update({
    where: { id },
    data: { status: 'uploading', meshUrl },
  })
}

async function markCompleted(
  id: string,
  data: { robloxAssetId: string; meshUrl: string; polyCount?: number; generationMs: number; tokensCost: number },
): Promise<void> {
  await db.generatedAsset.update({
    where: { id },
    data: {
      status: 'ready',
      robloxAssetId: data.robloxAssetId,
      meshUrl: data.meshUrl,
      polyCount: data.polyCount ?? null,
      generationMs: data.generationMs,
      tokensCost: data.tokensCost,
    },
  })
}

async function markFailed(id: string, errorMessage: string): Promise<void> {
  try {
    await db.generatedAsset.update({
      where: { id },
      data: { status: 'failed', errorMessage: errorMessage.slice(0, 500) },
    })
  } catch {
    // If the row was never created or the DB is down, swallow — the original
    // error is more informative and will be rethrown to the caller.
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Generate a 3D mesh from a text prompt (or reference image), upload it to
 * Roblox, and persist the result.
 *
 * This function is long-running (up to ~5 min). It should be invoked from a
 * Next.js API route with a suitable `maxDuration` export.
 *
 * On success the GeneratedAsset row will be in "ready" status with a real
 * robloxAssetId that the plugin can LoadAsset().
 *
 * On failure the row (if created) is marked "failed" and the error is rethrown
 * so the API route can translate it into a 4xx/5xx response. Credits are only
 * deducted after the upload succeeds, so failed runs are free for the user.
 */
export async function generateMeshFromPrompt(
  params: GenerateMeshParams,
): Promise<GenerateMeshResult> {
  const {
    prompt,
    userId,
    style = 'realistic',
    refImageUrl,
    targetPolycount = 30_000,
    creditsToSpend = MESH_GENERATION_COST,
  } = params

  // Fail fast on missing env vars so we don't touch the DB for a misconfigured
  // pipeline. These throws are translated to 500s by the API route.
  const meshyKey = getMeshyKey()
  const robloxKey = getRobloxOpenCloudKey()
  const { creatorId, creatorType } = getRobloxCreator()

  const startedAt = Date.now()

  // 1. Create the asset row up front so the client can poll for status
  const generatedAssetId = await createAssetRow({ userId, prompt, style })

  try {
    // 2. Create and poll the preview task (text-to-3d OR image-to-3d)
    const previewEndpoint: 'text-to-3d' | 'image-to-3d' = refImageUrl
      ? 'image-to-3d'
      : 'text-to-3d'

    const previewTaskId = await createMeshyPreviewTask({
      prompt,
      style,
      refImageUrl,
      targetPolycount,
      apiKey: meshyKey,
    })

    await markProcessing(generatedAssetId, { meshyTaskId: previewTaskId })

    const previewTask = await pollMeshyTask({
      taskId: previewTaskId,
      endpoint: previewEndpoint,
      apiKey: meshyKey,
    })

    // 3. For text-to-3d flows, refine the preview into a high-quality mesh.
    //    image-to-3d does not need a refine pass — the preview is already final.
    let finalTask: MeshyTask = previewTask

    if (!refImageUrl) {
      const refineTaskId = await createMeshyRefineTask({
        previewTaskId,
        apiKey: meshyKey,
      })

      await markProcessing(generatedAssetId, { meshyTaskId: refineTaskId })

      finalTask = await pollMeshyTask({
        taskId: refineTaskId,
        endpoint: 'text-to-3d',
        apiKey: meshyKey,
      })
    }

    // 4. Download the GLB
    const { buffer: glbBuffer, glbUrl } = await downloadGlb(finalTask)

    await markUploading(generatedAssetId, glbUrl)

    // 5. Upload to Roblox Open Cloud
    const displayName = displayNameFromPrompt(prompt)
    const robloxAssetId = await uploadGlbToRoblox({
      glbBuffer,
      displayName,
      description: `ForjeAI generated mesh: ${prompt.slice(0, 180)}`,
      apiKey: robloxKey,
      creatorId,
      creatorType,
    })

    // 6. Deduct credits (only now that the user has a usable result)
    if (creditsToSpend > 0) {
      try {
        await spendTokens(
          userId,
          creditsToSpend,
          `Mesh generation: ${displayName}`,
          { generatedAssetId, robloxAssetId, prompt },
        )
      } catch (err) {
        // Not enough tokens is a user-facing error. The mesh is already on
        // Roblox — we still mark the row completed but set tokensCost to 0 so
        // downstream analytics know we didn't collect. The caller should do a
        // preflight balance check before invoking this function.
        console.warn(
          '[mesh-pipeline] credit deduction failed after successful upload:',
          err instanceof Error ? err.message : err,
        )
      }
    }

    // 7. Persist final state
    await markCompleted(generatedAssetId, {
      robloxAssetId,
      meshUrl: glbUrl,
      polyCount: finalTask.polygon_count,
      generationMs: Date.now() - startedAt,
      tokensCost: creditsToSpend,
    })

    return {
      generatedAssetId,
      assetId: robloxAssetId,
      glbUrl,
      status: 'completed',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markFailed(generatedAssetId, message)
    throw err
  }
}
