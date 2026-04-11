/**
 * Audio generation pipeline — prompt → FAL audio → Roblox Open Cloud → assetId.
 *
 * Three public entry points:
 *   - generateMusic   → stable-audio / musicgen (long clips, configurable duration)
 *   - generateSFX     → stable-audio (short clips, ~5s)
 *   - generateVoice   → elevenlabs / playht TTS
 *
 * Each calls FAL, downloads the resulting audio file, uploads it to Roblox via
 * the Open Cloud Assets v1 API as `assetType: 'Audio'`, persists a
 * `GeneratedAsset` row, and returns `{ assetId, generatedAssetId, status }`.
 *
 * Moderation note: Roblox audio assets are subject to automated moderation.
 * The Open Cloud create call may return `done: true` while the asset is still
 * in `Reviewing` — we surface that via `status: 'pending_moderation'` so the
 * UI can show "Audio uploading & being moderated by Roblox…".
 *
 * Required env vars:
 *   FAL_KEY                    — FAL API key (also used by the mesh pipeline)
 *   ROBLOX_OPEN_CLOUD_API_KEY  — Open Cloud key with Asset:Write scope
 *   ROBLOX_CREATOR_ID          — Roblox user or group id to own the asset
 *   ROBLOX_CREATOR_TYPE        — "User" | "Group" (defaults to "User")
 */

import 'server-only'
import { db } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AudioKind = 'music' | 'sfx' | 'voice'

export type AudioStatus =
  | 'complete'
  | 'pending_moderation'
  | 'pending'
  | 'failed'

export interface AudioPipelineResult {
  /** Numeric Roblox asset id — usable as `rbxassetid://<assetId>`. May be null if upload did not complete (e.g. moderation still reviewing with no id yet). */
  assetId: string | null
  /** Primary key of the `GeneratedAsset` row that tracks this job. */
  generatedAssetId: string
  /** Pipeline status. `pending_moderation` means Roblox still has the asset in review. */
  status: AudioStatus
  /** FAL request id (or other provider id) for debugging. */
  externalTaskId?: string
  /** Source audio URL returned by FAL (temporary CDN link). */
  sourceUrl?: string
  /** Human-readable moderation state reported by Roblox. */
  moderationState?: string
  /** Optional human-readable message (error text, moderation explainer, etc.) */
  message?: string
}

export interface GenerateMusicOptions {
  prompt: string
  userId: string
  sessionId?: string | null
  /** Clip length in seconds — defaults to 30. */
  durationSeconds?: number
}

export interface GenerateSFXOptions {
  prompt: string
  userId: string
  sessionId?: string | null
  /** Clip length in seconds — defaults to 5. */
  durationSeconds?: number
}

export interface GenerateVoiceOptions {
  text: string
  userId: string
  sessionId?: string | null
  /** Voice id (ElevenLabs names or PlayHT ids). Defaults to "Adam". */
  voice?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FAL_BASE = 'https://fal.run'
const FAL_MODEL_MUSIC = 'fal-ai/stable-audio'
const FAL_MODEL_SFX = 'fal-ai/stable-audio'
const FAL_MODEL_VOICE = 'fal-ai/elevenlabs/tts'

const OPEN_CLOUD_BASE = 'https://apis.roblox.com'
const ASSETS_ENDPOINT = `${OPEN_CLOUD_BASE}/assets/v1/assets`
const OPERATIONS_BASE = `${OPEN_CLOUD_BASE}/assets/v1`

const MAX_AUDIO_BYTES = 20 * 1024 * 1024 // 20 MB — Roblox audio hard cap
const FAL_TIMEOUT_MS = 60_000
const DOWNLOAD_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 2_000
const MAX_POLL_ATTEMPTS = 30 // ~60s worst case

const DEFAULT_MUSIC_SECONDS = 30
const DEFAULT_SFX_SECONDS = 5

// ── FAL response shapes ───────────────────────────────────────────────────────

interface FalAudioFile {
  url?: string
  content_type?: string
  file_name?: string
  file_size?: number
}

interface FalAudioResponse {
  request_id?: string
  audio?: FalAudioFile
  audio_file?: FalAudioFile
  audio_url?: string
  output?: FalAudioFile | { url?: string }
}

// ── Roblox Open Cloud response shapes ────────────────────────────────────────

interface RobloxOperationResponse {
  path: string
  done?: boolean
  error?: { code: number; message: string }
  response?: {
    '@type'?: string
    assetId?: string
    assetVersionNumber?: number
    moderationResult?: { moderationState?: string }
  }
  metadata?: {
    assetId?: string
    moderationResult?: { moderationState?: string }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function requireFalKey(): string {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!key) throw new Error('FAL_KEY is not configured')
  return key
}

function requireRobloxAuth(): { apiKey: string; creatorId: string; creatorType: 'User' | 'Group' } {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY
  if (!apiKey) throw new Error('ROBLOX_OPEN_CLOUD_API_KEY is not configured')
  const creatorId = process.env.ROBLOX_CREATOR_ID
  if (!creatorId) throw new Error('ROBLOX_CREATOR_ID is not configured')
  const creatorType = ((process.env.ROBLOX_CREATOR_TYPE as 'User' | 'Group' | undefined) ?? 'User')
  return { apiKey, creatorId, creatorType }
}

function extractFalAudioUrl(payload: FalAudioResponse): string | null {
  if (payload.audio?.url) return payload.audio.url
  if (payload.audio_file?.url) return payload.audio_file.url
  if (payload.audio_url) return payload.audio_url
  if (payload.output && typeof payload.output === 'object' && 'url' in payload.output && payload.output.url) {
    return payload.output.url as string
  }
  return null
}

function guessMimeFromUrl(url: string, fallback = 'audio/mpeg'): string {
  const lower = url.toLowerCase().split('?')[0]
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.ogg')) return 'audio/ogg'
  if (lower.endsWith('.m4a') || lower.endsWith('.aac')) return 'audio/mp4'
  return fallback
}

function sanitizeForName(s: string): string {
  return s.replace(/[^\w\s\-]/g, '').trim().slice(0, 48) || 'ForjeAudio'
}

// ── FAL runners ───────────────────────────────────────────────────────────────

/**
 * Call a FAL `fal.run` synchronous endpoint.
 * Uses the short-lived sync path — avoids the queue flow for simpler audio calls.
 */
async function callFalSync(
  model: string,
  body: Record<string, unknown>,
): Promise<{ response: FalAudioResponse; requestId: string | null }> {
  const apiKey = requireFalKey()

  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FAL_TIMEOUT_MS),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`FAL ${model} failed (${res.status}): ${errText.slice(0, 300)}`)
  }

  const json = (await res.json()) as FalAudioResponse
  const requestId = (json.request_id as string | undefined) ?? null
  return { response: json, requestId }
}

async function downloadAudio(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })
  if (!res.ok) {
    throw new Error(`Failed to download audio from FAL CDN (${res.status})`)
  }
  const arr = await res.arrayBuffer()
  const buffer = Buffer.from(arr)
  if (buffer.length === 0) {
    throw new Error('Downloaded audio is empty')
  }
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new Error(`Audio file too large: ${buffer.length} bytes (max ${MAX_AUDIO_BYTES})`)
  }
  const headerMime = res.headers.get('content-type') ?? ''
  const mimeType = headerMime.startsWith('audio/') ? headerMime : guessMimeFromUrl(url)
  return { buffer, mimeType }
}

// ── Roblox Open Cloud audio upload ────────────────────────────────────────────

interface RobloxUploadResult {
  /** Present when Roblox returned an assetId — may be set even if still moderating. */
  assetId: string | null
  operationPath: string
  /** "Complete" | "Reviewing" | "Rejected" | "Pending" */
  moderationState?: string
  /** True when the asset is fully approved and playable. */
  approved: boolean
}

/**
 * Upload an audio buffer to Roblox Open Cloud Assets and poll the operation
 * until it is either done or we decide the asset is stuck in moderation.
 *
 * Exported for reuse & testing. Throws on network / HTTP errors. Returns a
 * result where `approved = false` means the asset is pending moderation.
 */
export async function uploadAudioToRoblox(
  audioBuffer: Buffer,
  displayName: string,
  description: string,
  opts?: { mimeType?: string; filename?: string },
): Promise<RobloxUploadResult> {
  const { apiKey, creatorId, creatorType } = requireRobloxAuth()

  if (audioBuffer.length === 0) {
    throw new Error('uploadAudioToRoblox: empty buffer')
  }
  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    throw new Error(`uploadAudioToRoblox: buffer too large (${audioBuffer.length} bytes)`)
  }

  const mimeType = opts?.mimeType ?? 'audio/mpeg'
  const filename = opts?.filename ?? `${sanitizeForName(displayName)}.${mimeType === 'audio/wav' ? 'wav' : 'mp3'}`

  // Build multipart form — `request` JSON part + `fileContent` binary part.
  const form = new FormData()
  const metadata = {
    assetType: 'Audio',
    displayName: sanitizeForName(displayName),
    description: description.slice(0, 1000),
    creationContext: {
      creator:
        creatorType === 'User'
          ? { userId: creatorId }
          : { groupId: creatorId },
    },
  }
  form.append('request', JSON.stringify(metadata))
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType })
  form.append('fileContent', blob, filename)

  const res = await fetch(ASSETS_ENDPOINT, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Roblox audio upload failed (${res.status}): ${body.slice(0, 300)}`)
  }

  const op = (await res.json()) as RobloxOperationResponse

  if (op.error) {
    throw new Error(
      `Roblox audio upload rejected: ${op.error.message} (code ${op.error.code})`,
    )
  }

  // If the operation is already done synchronously, extract the assetId.
  if (op.done) {
    return normalizeOperation(op)
  }

  // Poll until done (or we hit the cap — audio moderation can be slower than
  // the poll window, so we surface `pending_moderation` if the asset id is not
  // yet available).
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS)

    const pollRes = await fetch(`${OPERATIONS_BASE}/${op.path}`, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    if (!pollRes.ok) continue

    const polled = (await pollRes.json()) as RobloxOperationResponse
    if (polled.error) {
      throw new Error(
        `Roblox audio upload failed during polling: ${polled.error.message}`,
      )
    }
    if (polled.done) {
      return normalizeOperation(polled)
    }
  }

  // Timed out waiting — most likely still in moderation. The operation will
  // eventually complete on Roblox's side; we return what we know.
  return {
    assetId: null,
    operationPath: op.path,
    moderationState: 'Reviewing',
    approved: false,
  }
}

function normalizeOperation(op: RobloxOperationResponse): RobloxUploadResult {
  const assetId = op.response?.assetId ?? op.metadata?.assetId ?? null
  const moderationState =
    op.response?.moderationResult?.moderationState ??
    op.metadata?.moderationResult?.moderationState

  // Roblox considers audio "approved" when moderationState is absent (legacy)
  // or exactly "Approved". Anything else means we should treat it as pending.
  const approved = !!assetId && (!moderationState || moderationState === 'Approved')

  return {
    assetId,
    operationPath: op.path,
    moderationState,
    approved,
  }
}

// ── Persistence helpers ───────────────────────────────────────────────────────

async function createGeneratedAssetRow(args: {
  userId: string
  prompt: string
  type: 'music' | 'sfx' | 'voice'
}): Promise<{ id: string }> {
  // The live schema has a required `style` field with a default; newer fields
  // (externalTaskId, sourceUrl, moderationState, metadata, completedAt) are
  // all optional so the create stays forward/backward compatible with the
  // mesh agent's concurrent changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (db as any).generatedAsset.create({
    data: {
      userId: args.userId,
      prompt: args.prompt,
      type: args.type,
      status: 'generating',
      style: 'default',
    },
    select: { id: true },
  })
  return row as { id: string }
}

async function updateGeneratedAssetRow(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).generatedAsset.update({
      where: { id },
      data: patch,
    })
  } catch (err) {
    console.warn('[audio-pipeline] Failed to update GeneratedAsset row', id, err)
  }
}

// ── Shared body of the pipeline ───────────────────────────────────────────────

interface RunPipelineArgs {
  kind: AudioKind
  userId: string
  prompt: string
  displayName: string
  description: string
  falModel: string
  falBody: Record<string, unknown>
  durationSeconds?: number
}

async function runAudioPipeline(args: RunPipelineArgs): Promise<AudioPipelineResult> {
  const { kind, userId, prompt, displayName, description, falModel, falBody, durationSeconds } = args

  const startedAt = Date.now()
  const row = await createGeneratedAssetRow({
    userId,
    prompt,
    type: kind,
  })

  let externalTaskId: string | null = null
  let sourceUrl: string | null = null

  try {
    // 1. Call FAL
    const { response, requestId } = await callFalSync(falModel, falBody)
    externalTaskId = requestId

    const audioUrl = extractFalAudioUrl(response)
    if (!audioUrl) {
      throw new Error(`FAL ${falModel} returned no audio URL`)
    }
    sourceUrl = audioUrl

    // 2. Download
    const { buffer, mimeType } = await downloadAudio(audioUrl)

    // 3. Upload to Roblox
    const upload = await uploadAudioToRoblox(buffer, displayName, description, {
      mimeType,
    })

    const durationMs = Date.now() - startedAt

    if (upload.approved && upload.assetId) {
      await updateGeneratedAssetRow(row.id, {
        status: 'ready',
        robloxAssetId: upload.assetId,
        externalTaskId,
        sourceUrl,
        moderationState: upload.moderationState ?? 'Approved',
        durationMs: durationSeconds ? durationSeconds * 1000 : durationMs,
        generationMs: durationMs,
        fileSize: buffer.length,
        completedAt: new Date(),
      })
      return {
        assetId: upload.assetId,
        generatedAssetId: row.id,
        status: 'complete',
        externalTaskId: externalTaskId ?? undefined,
        sourceUrl: sourceUrl ?? undefined,
        moderationState: upload.moderationState,
      }
    }

    // Pending moderation — asset is uploaded but not yet playable.
    await updateGeneratedAssetRow(row.id, {
      status: 'pending_moderation',
      robloxAssetId: upload.assetId ?? null,
      externalTaskId,
      sourceUrl,
      moderationState: upload.moderationState ?? 'Reviewing',
      durationMs: durationSeconds ? durationSeconds * 1000 : durationMs,
      generationMs: durationMs,
      fileSize: buffer.length,
    })

    return {
      assetId: upload.assetId,
      generatedAssetId: row.id,
      status: 'pending_moderation',
      externalTaskId: externalTaskId ?? undefined,
      sourceUrl: sourceUrl ?? undefined,
      moderationState: upload.moderationState ?? 'Reviewing',
      message:
        'Audio uploaded to Roblox and is currently being moderated. It may take a few minutes before the asset becomes playable in Studio.',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[audio-pipeline] ${kind} generation failed:`, message)

    await updateGeneratedAssetRow(row.id, {
      status: 'failed',
      errorMessage: message.slice(0, 500),
      externalTaskId: externalTaskId ?? undefined,
      sourceUrl: sourceUrl ?? undefined,
    })

    return {
      assetId: null,
      generatedAssetId: row.id,
      status: 'failed',
      externalTaskId: externalTaskId ?? undefined,
      sourceUrl: sourceUrl ?? undefined,
      message,
    }
  }
}

// ── Public entry points ───────────────────────────────────────────────────────

export async function generateMusic(
  opts: GenerateMusicOptions,
): Promise<AudioPipelineResult> {
  const duration = Math.max(5, Math.min(120, Math.floor(opts.durationSeconds ?? DEFAULT_MUSIC_SECONDS)))
  return runAudioPipeline({
    kind: 'music',
    userId: opts.userId,
    prompt: opts.prompt,
    displayName: `ForjeAI Music: ${opts.prompt}`,
    description: `AI-generated music from prompt: "${opts.prompt.slice(0, 200)}"`,
    falModel: FAL_MODEL_MUSIC,
    falBody: { prompt: opts.prompt, seconds_total: duration },
    durationSeconds: duration,
  })
}

export async function generateSFX(
  opts: GenerateSFXOptions,
): Promise<AudioPipelineResult> {
  const duration = Math.max(1, Math.min(30, Math.floor(opts.durationSeconds ?? DEFAULT_SFX_SECONDS)))
  return runAudioPipeline({
    kind: 'sfx',
    userId: opts.userId,
    prompt: opts.prompt,
    displayName: `ForjeAI SFX: ${opts.prompt}`,
    description: `AI-generated sound effect from prompt: "${opts.prompt.slice(0, 200)}"`,
    falModel: FAL_MODEL_SFX,
    falBody: { prompt: opts.prompt, seconds_total: duration },
    durationSeconds: duration,
  })
}

export async function generateVoice(
  opts: GenerateVoiceOptions,
): Promise<AudioPipelineResult> {
  const voice = (opts.voice ?? 'Adam').slice(0, 64)
  const text = opts.text.slice(0, 500)
  return runAudioPipeline({
    kind: 'voice',
    userId: opts.userId,
    prompt: text,
    displayName: `ForjeAI Voice: ${text.slice(0, 32)}`,
    description: `AI-generated voice line: "${text}"`,
    falModel: FAL_MODEL_VOICE,
    falBody: { text, voice },
  })
}
