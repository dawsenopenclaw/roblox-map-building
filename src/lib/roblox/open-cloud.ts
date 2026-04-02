/**
 * Roblox Open Cloud Asset API — upload and moderation polling.
 *
 * Env vars required:
 *   ROBLOX_OPEN_CLOUD_API_KEY  — Open Cloud API key with asset:write scope
 *   ROBLOX_CREATOR_ID          — Roblox user ID or group ID (numeric string)
 *   ROBLOX_CREATOR_TYPE        — "User" | "Group"
 *
 * Docs: https://create.roblox.com/docs/reference/cloud/assets/v1
 */

import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import FormData from 'form-data'

// ── Constants ─────────────────────────────────────────────────────────────────

const OPEN_CLOUD_BASE     = 'https://apis.roblox.com/assets/v1'
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  // 100 MB hard limit from Roblox
const POLL_MAX_ATTEMPTS   = 30
const POLL_INTERVAL_MS    = 3_000

// ── Types ────────────────────────────────────────────────────────────────────

export type RobloxAssetType = 'Model' | 'Decal' | 'Audio'

export interface UploadToRobloxParams {
  /** Absolute path to the GLB/FBX/PNG file on disk */
  filePath:    string
  fileName:    string
  assetType:   RobloxAssetType
  description: string
}

export interface UploadResult {
  /** Roblox asset ID (numeric string) */
  assetId:     string
  /** Long-running operation ID for polling moderation status */
  operationId: string
}

export interface PollUploadStatusResult {
  done:               boolean
  /** Present when done === true and moderation passed */
  assetId?:           string
  /** Human-readable moderation outcome e.g. "approved", "rejected" */
  moderationResult?:  string
}

// MIME types Roblox accepts per asset type
const MIME_MAP: Record<RobloxAssetType, Record<string, string>> = {
  Model:  { glb: 'model/gltf-binary', fbx: 'application/octet-stream', obj: 'text/plain' },
  Decal:  { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' },
  Audio:  { mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConfig(): { apiKey: string; creatorId: string; creatorType: 'User' | 'Group' } {
  const apiKey      = process.env.ROBLOX_OPEN_CLOUD_API_KEY
  const creatorId   = process.env.ROBLOX_CREATOR_ID
  const creatorType = process.env.ROBLOX_CREATOR_TYPE as 'User' | 'Group' | undefined

  if (!apiKey)    throw new Error('ROBLOX_OPEN_CLOUD_API_KEY is not configured')
  if (!creatorId) throw new Error('ROBLOX_CREATOR_ID is not configured')

  return {
    apiKey,
    creatorId,
    creatorType: creatorType ?? 'User',
  }
}

function getMimeType(fileName: string, assetType: RobloxAssetType): string {
  const ext = path.extname(fileName).toLowerCase().slice(1)
  return MIME_MAP[assetType]?.[ext] ?? 'application/octet-stream'
}

// ── uploadToRoblox ────────────────────────────────────────────────────────────

/**
 * Uploads a local file to Roblox Open Cloud.
 *
 * Roblox returns a long-running Operation ID — the asset is not yet live.
 * Call `pollUploadStatus(operationId)` to wait for moderation to complete.
 */
export async function uploadToRoblox(params: UploadToRobloxParams): Promise<UploadResult> {
  const { filePath, fileName, assetType, description } = params
  const { apiKey, creatorId, creatorType } = getConfig()

  // Validate file exists and is within size limit
  const stats = await stat(filePath)
  if (stats.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File ${fileName} is ${(stats.size / 1024 / 1024).toFixed(1)} MB — exceeds Roblox 100 MB limit`
    )
  }

  const mimeType = getMimeType(fileName, assetType)

  // Build multipart form — Roblox Open Cloud expects:
  //   - fileContent: the binary file
  //   - request: JSON metadata
  const form = new FormData()

  const requestMetadata = {
    assetType,
    displayName: fileName.replace(/\.[^.]+$/, ''),
    description,
    ...(creatorType === 'User'
      ? { creationContext: { creator: { userId: creatorId } } }
      : { creationContext: { creator: { groupId: creatorId } } }),
  }

  form.append('request', JSON.stringify(requestMetadata), {
    contentType: 'application/json',
  })

  form.append('fileContent', createReadStream(filePath), {
    filename:    fileName,
    contentType: mimeType,
    knownLength: stats.size,
  })

  const res = await fetch(`${OPEN_CLOUD_BASE}/assets`, {
    method:  'POST',
    headers: {
      'x-api-key': apiKey,
      ...form.getHeaders(),
    },
    // Node 18+ fetch does not support FormData from the `form-data` package directly
    // so we convert to a Buffer first
    body: await streamToBuffer(form) as unknown as BodyInit,
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Roblox Open Cloud upload failed (${res.status}): ${body}`)
  }

  const operation = (await res.json()) as {
    path:     string   // "operations/{operationId}"
    done?:    boolean
    response?: { assetId?: string }
  }

  const operationId = operation.path.split('/').pop() ?? operation.path

  // If Roblox returned it as immediately done (rare), extract assetId now
  const immediateAssetId = operation.response?.assetId

  return {
    assetId:     immediateAssetId ?? '',
    operationId,
  }
}

// ── pollUploadStatus ──────────────────────────────────────────────────────────

/**
 * Polls a Roblox Open Cloud operation until moderation completes.
 *
 * Returns `{ done: false }` if still in progress after POLL_MAX_ATTEMPTS.
 */
export async function pollUploadStatus(operationId: string): Promise<PollUploadStatusResult> {
  const { apiKey } = getConfig()

  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS))

    const res = await fetch(`${OPEN_CLOUD_BASE}/operations/${operationId}`, {
      headers: { 'x-api-key': apiKey },
      signal:  AbortSignal.timeout(10_000),
    })

    if (!res.ok) continue

    const operation = (await res.json()) as {
      done?:    boolean
      response?: { assetId?: string; moderationResult?: { decision?: string } }
      error?:   { code?: number; message?: string }
    }

    if (operation.error) {
      throw new Error(
        `Roblox operation ${operationId} errored: ${operation.error.message ?? JSON.stringify(operation.error)}`
      )
    }

    if (operation.done) {
      const assetId          = operation.response?.assetId
      const moderationResult = operation.response?.moderationResult?.decision ?? 'approved'

      if (!assetId) {
        // Moderation rejected
        return {
          done:              true,
          moderationResult,
        }
      }

      return {
        done:             true,
        assetId,
        moderationResult,
      }
    }
  }

  return { done: false }
}

// ── waitForUpload ─────────────────────────────────────────────────────────────

/**
 * Convenience wrapper: upload a file then wait for moderation to complete.
 * Returns the rbxassetid:// URL.
 *
 * Throws if moderation rejects the asset.
 */
export async function uploadAndWait(params: UploadToRobloxParams): Promise<string> {
  const { operationId } = await uploadToRoblox(params)
  const result = await pollUploadStatus(operationId)

  if (!result.done) {
    throw new Error(`Roblox moderation timed out for operation ${operationId}`)
  }

  if (!result.assetId) {
    throw new Error(
      `Roblox asset was rejected by moderation: ${result.moderationResult ?? 'unknown reason'}`
    )
  }

  return `rbxassetid://${result.assetId}`
}

// ── Utils ─────────────────────────────────────────────────────────────────────

async function streamToBuffer(form: FormData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    form.on('data',  (chunk: Buffer) => chunks.push(chunk))
    form.on('end',   () => resolve(Buffer.concat(chunks)))
    form.on('error', reject)
  })
}
