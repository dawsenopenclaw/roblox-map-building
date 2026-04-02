/**
 * Roblox Open Cloud Asset Upload
 *
 * Uploads GLB/FBX meshes and PNG/JPG textures to Roblox via the Open Cloud
 * Assets v1 API so every generated asset gets a real rbxassetid:// URL instead
 * of a raw CDN link that MeshPart.MeshId cannot accept.
 *
 * API reference:
 *   https://create.roblox.com/docs/reference/cloud/assets/v1
 *
 * Required env vars:
 *   ROBLOX_OPEN_CLOUD_API_KEY  — Open Cloud API key with Asset:Write scope
 *   ROBLOX_CREATOR_ID          — Roblox user ID or group ID
 *   ROBLOX_CREATOR_TYPE        — "User" | "Group"  (defaults to "User")
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadMeshParams {
  meshBuffer: Buffer
  filename: string       // e.g. "castle.glb"
  displayName: string    // human-readable, shown in Creator Hub
  description: string
  creatorId: string
  creatorType: 'User' | 'Group'
}

export interface UploadTextureParams {
  imageBuffer: Buffer
  filename: string       // e.g. "castle_albedo.png"
  displayName: string
  description: string
  creatorId: string
  creatorType: 'User' | 'Group'
}

export interface UploadAssetResult {
  assetId: string        // numeric portion — use as rbxassetid://<assetId>
  rbxAssetId: string     // "rbxassetid://<assetId>" — ready to paste into Luau
  operationId: string    // Open Cloud operation path for status polling
  status: 'complete' | 'pending' | 'failed'
}

/** Internal shape of the Open Cloud create-asset response */
interface RobloxOperationResponse {
  path: string           // e.g. "operations/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  done?: boolean
  error?: { code: number; message: string; details?: unknown[] }
  response?: {
    '@type': string
    assetId: string
    assetVersionNumber?: number
    creatorId?: string
    creatorType?: string
  }
  metadata?: {
    assetId?: string
    assetVersionId?: string
  }
}

/** Internal shape returned while polling an operation */
interface RobloxOperationStatus {
  path: string
  done?: boolean
  error?: { code: number; message: string }
  response?: {
    '@type': string
    assetId: string
    assetVersionNumber?: number
  }
  metadata?: {
    assetId?: string
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OPEN_CLOUD_BASE = 'https://apis.roblox.com'
const ASSETS_ENDPOINT = `${OPEN_CLOUD_BASE}/assets/v1/assets`
const OPERATION_BASE  = `${OPEN_CLOUD_BASE}/assets/v1`

const MAX_MESH_SIZE_BYTES    = 50 * 1024 * 1024   // 50 MB
const MAX_TEXTURE_SIZE_BYTES = 20 * 1024 * 1024   // 20 MB

/** Open Cloud rate limit is 60 requests/min per key — back off on 429 */
const BACKOFF_MS    = [2_000, 4_000, 8_000] as const
const MAX_RETRIES   = 3

/** Poll the operation status at most this many times before giving up */
const MAX_POLL_ATTEMPTS = 30
const POLL_INTERVAL_MS  = 3_000

// ── MIME helpers ──────────────────────────────────────────────────────────────

const MESH_MIME: Record<string, string> = {
  glb: 'model/gltf-binary',
  fbx: 'application/octet-stream',
  obj: 'text/plain',
}

const TEXTURE_MIME: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  tga:  'image/x-tga',
  bmp:  'image/bmp',
}

function extOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

// ── Retry + backoff ───────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response

    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) })
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        await sleep(BACKOFF_MS[attempt] ?? 8_000)
        continue
      }
      throw new Error(`${label}: network error after ${attempt + 1} attempts — ${lastError.message}`)
    }

    // 429 — rate limited
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('retry-after')
      const waitMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1_000
        : (BACKOFF_MS[attempt] ?? 8_000)
      console.warn(`[roblox-upload] ${label}: rate limited — waiting ${waitMs}ms`)
      if (attempt < MAX_RETRIES) {
        await sleep(waitMs)
        continue
      }
    }

    // 500 / 503 — transient server error
    if (res.status === 500 || res.status === 503) {
      if (attempt < MAX_RETRIES) {
        await sleep(BACKOFF_MS[attempt] ?? 8_000)
        continue
      }
    }

    return res
  }

  throw new Error(`${label}: exhausted ${MAX_RETRIES + 1} attempts`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Operation polling ─────────────────────────────────────────────────────────

async function pollOperation(
  operationPath: string,
  apiKey: string,
): Promise<UploadAssetResult> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS)

    const res = await fetchWithRetry(
      `${OPERATION_BASE}/${operationPath}`,
      { headers: { 'x-api-key': apiKey } },
      `pollOperation(${operationPath})`,
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Operation poll failed (${res.status}): ${body}`)
    }

    const op = (await res.json()) as RobloxOperationStatus

    if (op.error) {
      throw new Error(`Roblox upload operation failed: ${op.error.message} (code ${op.error.code})`)
    }

    if (op.done) {
      // Pull assetId from response or metadata — Roblox returns it in either field
      const assetId =
        op.response?.assetId ??
        op.metadata?.assetId

      if (!assetId) {
        throw new Error(`Operation ${operationPath} completed but returned no assetId`)
      }

      return {
        assetId,
        rbxAssetId: `rbxassetid://${assetId}`,
        operationId: operationPath,
        status: 'complete',
      }
    }
  }

  throw new Error(`Operation ${operationPath} did not complete within ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1_000}s`)
}

// ── Core upload helper ────────────────────────────────────────────────────────

interface CoreUploadParams {
  fileBuffer: Buffer
  filename: string
  mimeType: string
  assetType: 'Model' | 'Decal' | 'Image'
  displayName: string
  description: string
  creatorId: string
  creatorType: 'User' | 'Group'
  apiKey: string
}

async function coreUpload(params: CoreUploadParams): Promise<UploadAssetResult> {
  const {
    fileBuffer, filename, mimeType, assetType,
    displayName, description, creatorId, creatorType, apiKey,
  } = params

  // Build the multipart/form-data body manually — Node 18+ fetch supports FormData
  const form = new FormData()

  // Metadata JSON part (must be named "request")
  const metadata = {
    assetType,
    displayName,
    description,
    creationContext: {
      creator: {
        ...(creatorType === 'User'
          ? { userId: creatorId }
          : { groupId: creatorId }),
      },
    },
  }
  form.append('request', JSON.stringify(metadata))

  // File binary part (must be named "fileContent")
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType })
  form.append('fileContent', blob, filename)

  const res = await fetchWithRetry(
    ASSETS_ENDPOINT,
    {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form,
    },
    `upload(${filename})`,
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Roblox asset upload failed (${res.status}): ${body}`)
  }

  const op = (await res.json()) as RobloxOperationResponse

  if (op.error) {
    throw new Error(`Roblox upload rejected: ${op.error.message} (code ${op.error.code})`)
  }

  // Some small assets are synchronously done in the initial response
  if (op.done) {
    const assetId =
      op.response?.assetId ??
      op.metadata?.assetId

    if (!assetId) {
      throw new Error(`Upload returned done=true but no assetId for ${filename}`)
    }

    logUpload({ filename, assetId, assetType })

    return {
      assetId,
      rbxAssetId: `rbxassetid://${assetId}`,
      operationId: op.path,
      status: 'complete',
    }
  }

  // Async case — poll until done
  const result = await pollOperation(op.path, apiKey)
  logUpload({ filename, assetId: result.assetId, assetType })
  return result
}

// ── Cost / audit logging ──────────────────────────────────────────────────────

interface UploadLog {
  filename: string
  assetId: string
  assetType: string
}

function logUpload(entry: UploadLog): void {
  // In production this would write to a DB / analytics pipeline.
  // For now emit a structured console line that PostHog / Sentry can ingest.
  console.log(
    JSON.stringify({
      event: 'roblox_asset_upload',
      filename: entry.filename,
      assetId: entry.assetId,
      assetType: entry.assetType,
      timestamp: new Date().toISOString(),
    }),
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Uploads a GLB or FBX mesh buffer to Roblox Open Cloud.
 *
 * @returns UploadAssetResult with `rbxAssetId` ready for MeshPart.MeshId
 */
export async function uploadMeshToRoblox(params: UploadMeshParams): Promise<UploadAssetResult> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY
  if (!apiKey) throw new Error('ROBLOX_OPEN_CLOUD_API_KEY is not configured')

  const ext = extOf(params.filename)
  const mimeType = MESH_MIME[ext]
  if (!mimeType) {
    throw new Error(
      `Unsupported mesh format ".${ext}" — supported: ${Object.keys(MESH_MIME).join(', ')}`,
    )
  }

  if (params.meshBuffer.byteLength > MAX_MESH_SIZE_BYTES) {
    throw new Error(
      `Mesh file too large: ${(params.meshBuffer.byteLength / 1024 / 1024).toFixed(1)} MB ` +
      `(max ${MAX_MESH_SIZE_BYTES / 1024 / 1024} MB)`,
    )
  }

  return coreUpload({
    fileBuffer:   params.meshBuffer,
    filename:     params.filename,
    mimeType,
    assetType:    'Model',
    displayName:  params.displayName,
    description:  params.description,
    creatorId:    params.creatorId,
    creatorType:  params.creatorType,
    apiKey,
  })
}

/**
 * Uploads a PNG/JPG texture buffer to Roblox Open Cloud as a Decal/Image asset.
 *
 * @returns UploadAssetResult with `rbxAssetId` ready for SurfaceAppearance maps
 */
export async function uploadTextureToRoblox(params: UploadTextureParams): Promise<UploadAssetResult> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY
  if (!apiKey) throw new Error('ROBLOX_OPEN_CLOUD_API_KEY is not configured')

  const ext = extOf(params.filename)
  const mimeType = TEXTURE_MIME[ext]
  if (!mimeType) {
    throw new Error(
      `Unsupported texture format ".${ext}" — supported: ${Object.keys(TEXTURE_MIME).join(', ')}`,
    )
  }

  if (params.imageBuffer.byteLength > MAX_TEXTURE_SIZE_BYTES) {
    throw new Error(
      `Texture file too large: ${(params.imageBuffer.byteLength / 1024 / 1024).toFixed(1)} MB ` +
      `(max ${MAX_TEXTURE_SIZE_BYTES / 1024 / 1024} MB)`,
    )
  }

  return coreUpload({
    fileBuffer:   params.imageBuffer,
    filename:     params.filename,
    mimeType,
    assetType:    'Decal',
    displayName:  params.displayName,
    description:  params.description,
    creatorId:    params.creatorId,
    creatorType:  params.creatorType,
    apiKey,
  })
}

/**
 * Downloads a mesh from a URL (e.g. Meshy CDN) and uploads it to Roblox.
 *
 * This is the primary convenience wrapper used in the mesh generation route:
 *   downloadAndUpload(glbUrl, "Castle (ForjeAI)") → "rbxassetid://12345678"
 */
export async function downloadAndUpload(
  meshUrl: string,
  displayName: string,
  options?: {
    description?: string
    creatorId?: string
    creatorType?: 'User' | 'Group'
  },
): Promise<UploadAssetResult> {
  const creatorId   = options?.creatorId   ?? process.env.ROBLOX_CREATOR_ID
  const creatorType = options?.creatorType ?? (process.env.ROBLOX_CREATOR_TYPE as 'User' | 'Group' | undefined) ?? 'User'

  if (!creatorId) {
    throw new Error('ROBLOX_CREATOR_ID is not configured and no creatorId was provided')
  }

  // Derive filename from URL, preserving extension
  const urlPath  = new URL(meshUrl).pathname
  const rawName  = urlPath.split('/').pop() ?? 'mesh.glb'
  const ext      = extOf(rawName)
  const safeExt  = ext in MESH_MIME ? ext : 'glb'
  const filename = rawName.endsWith(`.${safeExt}`) ? rawName : `mesh.${safeExt}`

  // Download
  const downloadRes = await fetch(meshUrl, { signal: AbortSignal.timeout(60_000) })
  if (!downloadRes.ok) {
    throw new Error(`Failed to download mesh from ${meshUrl} (${downloadRes.status})`)
  }

  const arrayBuffer = await downloadRes.arrayBuffer()
  const meshBuffer  = Buffer.from(arrayBuffer)

  // Validate size before attempting upload
  if (meshBuffer.byteLength > MAX_MESH_SIZE_BYTES) {
    throw new Error(
      `Downloaded mesh too large to upload: ` +
      `${(meshBuffer.byteLength / 1024 / 1024).toFixed(1)} MB (max 50 MB)`,
    )
  }

  return uploadMeshToRoblox({
    meshBuffer,
    filename,
    displayName,
    description: options?.description ?? `ForjeAI generated asset: ${displayName}`,
    creatorId,
    creatorType,
  })
}

/**
 * Downloads a texture image from a URL and uploads it to Roblox.
 *
 * Used for Meshy/Fal albedo, normal, and roughness maps.
 */
export async function downloadAndUploadTexture(
  textureUrl: string,
  displayName: string,
  options?: {
    description?: string
    creatorId?: string
    creatorType?: 'User' | 'Group'
  },
): Promise<UploadAssetResult> {
  const creatorId   = options?.creatorId   ?? process.env.ROBLOX_CREATOR_ID
  const creatorType = options?.creatorType ?? (process.env.ROBLOX_CREATOR_TYPE as 'User' | 'Group' | undefined) ?? 'User'

  if (!creatorId) {
    throw new Error('ROBLOX_CREATOR_ID is not configured and no creatorId was provided')
  }

  const urlPath  = new URL(textureUrl).pathname
  const rawName  = urlPath.split('/').pop() ?? 'texture.png'
  const ext      = extOf(rawName)
  const safeExt  = ext in TEXTURE_MIME ? ext : 'png'
  const filename = rawName.endsWith(`.${safeExt}`) ? rawName : `texture.${safeExt}`

  const downloadRes = await fetch(textureUrl, { signal: AbortSignal.timeout(30_000) })
  if (!downloadRes.ok) {
    throw new Error(`Failed to download texture from ${textureUrl} (${downloadRes.status})`)
  }

  const arrayBuffer  = await downloadRes.arrayBuffer()
  const imageBuffer  = Buffer.from(arrayBuffer)

  return uploadTextureToRoblox({
    imageBuffer,
    filename,
    displayName,
    description: options?.description ?? `ForjeAI texture: ${displayName}`,
    creatorId,
    creatorType,
  })
}
