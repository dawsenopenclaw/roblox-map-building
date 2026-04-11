/**
 * Icon Studio generation pipeline.
 *
 * Given a preset id and a user prompt, this module:
 *   1. Looks up the preset and composes a full FAL prompt (preset prefix +
 *      user prompt + composition/background/palette hints).
 *   2. Submits N parallel FLUX jobs to the recommended model at square_hd
 *      (1024x1024) — Roblox icons are 512x512 but we render higher and let
 *      the downstream downscaler (or Roblox itself) do the final sizing.
 *   3. Optionally runs clarity-upscaler for hero-quality output.
 *   4. Optionally runs birefnet background removal for transparent icons.
 *   5. Persists a GeneratedAsset row (type='icon') for each result so the
 *      library, billing, and history views all pick them up for free.
 *
 * This module is self-contained and safe to import from API routes on a
 * serverless runtime. It NEVER reads Clerk state — callers must resolve the
 * internal dbUserId at the route boundary before invoking.
 */

import 'server-only'

import { db } from '@/lib/db'
import {
  getIconPreset,
  falModelPath,
  stepsForTier,
  guidanceForTier,
  type IconPreset,
} from './icon-presets'

// ─── Types ────────────────────────────────────────────────────────────────

export interface GenerateIconParams {
  /** The user-facing prompt describing the icon content. */
  prompt: string
  /** Preset id from ICON_PRESETS. */
  presetId: string
  /**
   * Internal DB user id (User.id) — NOT a Clerk id. Callers must resolve at
   * the route boundary so billing + persistence point at the correct row.
   */
  userId: string
  /** Optional Studio session id — stored in metadata for cross-linking. */
  sessionId?: string
  /** How many icons to generate in parallel. 1-4. */
  count: number
  /** Optional override — run clarity-upscaler after generation. */
  upscale?: boolean
  /** Optional override — strip background via birefnet. */
  removeBackground?: boolean
  /** Optional seed for deterministic output (per-image seed is base+i). */
  seed?: number
}

export interface IconResult {
  /** FAL-hosted icon URL (post-upscale, post-bg-removal). */
  url: string
  /** DB row id (GeneratedAsset.id) for the persisted icon. */
  generatedAssetId: string
  /** The preset id this icon was rendered with. */
  presetId: string
  /** Seed used for this icon, for reproducibility. */
  seed: number
  /** Width and height of the delivered image. */
  width: number
  height: number
}

export interface IconGenerationResponse {
  /** Delivered icons, in request order. */
  icons: IconResult[]
  /** Preset used for all icons in the batch. */
  preset: IconPreset
  /** Total wall-clock generation milliseconds for the batch. */
  generationMs: number
  /** The full FAL prompt that was submitted. */
  enrichedPrompt: string
}

// ─── FAL queue primitives ─────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_BG_MODEL = 'fal-ai/birefnet'
const FAL_UPSCALE_MODEL = 'fal-ai/clarity-upscaler'

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalImageOutput {
  images?: Array<{ url: string; width: number; height: number }>
}

interface FalSingleOutput {
  image?: { url: string; width: number; height: number }
}

async function falSubmit(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FAL submit failed (${res.status}): ${err}`)
  }
  const data = (await res.json()) as FalQueueResponse
  return data.request_id
}

async function falPoll<T>(
  model: string,
  requestId: string,
  apiKey: string,
  maxAttempts = 40,
  intervalMs = 3_000,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // First poll is a short wait, subsequent polls use the configured interval
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1_500 : intervalMs))

    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/${model}/requests/${requestId}`,
        {
          headers: { Authorization: `Key ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
      if (!resultRes.ok) throw new Error('FAL result fetch failed')
      return (await resultRes.json()) as T
    }

    if (status.status === 'FAILED') {
      throw new Error(`FAL job ${requestId} failed`)
    }
  }

  throw new Error('Icon generation timed out')
}

// ─── Prompt composition ───────────────────────────────────────────────────

/**
 * Build the final FAL prompt by combining the preset's prefix with the
 * user-supplied prompt and composition/background/palette hints. Kept
 * pure + exported so the unit tests can assert on it directly.
 */
export function buildIconPrompt(
  preset: IconPreset,
  userPrompt: string,
): string {
  const clean = userPrompt.trim()
  const palette = preset.colorPalette.join(', ')
  const compositionHint = {
    centered: 'centered subject, symmetrical balance',
    asymmetric: 'asymmetric dynamic layout',
    'rule-of-thirds': 'rule-of-thirds framing',
  }[preset.composition]
  const backgroundHint = {
    gradient: 'vibrant gradient background',
    solid: 'clean solid colour background',
    transparent: 'subject on transparent-ready neutral background',
    scene: 'immersive scene background with atmospheric depth',
  }[preset.background]

  // Order matters — put the subject first so FLUX weights it highest.
  return [
    clean,
    preset.prompt,
    compositionHint,
    backgroundHint,
    `dominant palette: ${palette}`,
    'roblox game library quality, app store ready, high detail',
  ].join(', ')
}

// ─── Post-processing helpers ──────────────────────────────────────────────

async function upscaleIcon(
  imageUrl: string,
  apiKey: string,
): Promise<{ url: string; width: number; height: number }> {
  const requestId = await falSubmit(
    FAL_UPSCALE_MODEL,
    { image_url: imageUrl, scale: 2 },
    apiKey,
  )
  const output = await falPoll<FalSingleOutput>(
    FAL_UPSCALE_MODEL,
    requestId,
    apiKey,
    40,
    4_000,
  )
  return {
    url: output.image?.url ?? imageUrl,
    width: output.image?.width ?? 1024,
    height: output.image?.height ?? 1024,
  }
}

async function removeIconBackground(
  imageUrl: string,
  apiKey: string,
): Promise<string> {
  const requestId = await falSubmit(
    FAL_BG_MODEL,
    { image_url: imageUrl },
    apiKey,
  )
  const output = await falPoll<FalSingleOutput>(
    FAL_BG_MODEL,
    requestId,
    apiKey,
    25,
  )
  return output.image?.url ?? imageUrl
}

// ─── Main entry point ────────────────────────────────────────────────────

/**
 * Generate N icons for the given preset + user prompt. Caller is responsible
 * for token billing — this function only handles FAL orchestration and DB
 * persistence. On failure it records a failed GeneratedAsset row per image
 * so the user's history still reflects the attempt.
 */
export async function generateIcon(
  params: GenerateIconParams,
): Promise<IconGenerationResponse> {
  const preset = getIconPreset(params.presetId)
  const count = Math.max(1, Math.min(4, params.count))
  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  if (!apiKey) {
    throw new Error('FAL_KEY is not configured')
  }

  const enrichedPrompt = buildIconPrompt(preset, params.prompt)
  const negativePrompt = preset.negativePrompt
  const model = falModelPath(preset.recommendedFalModel)
  const steps = stepsForTier(preset.qualityTier)
  const guidance = guidanceForTier(preset.qualityTier)
  const baseSeed = params.seed ?? Math.floor(Math.random() * 2_147_483_647)

  const startedAt = Date.now()

  // Create "queued" GeneratedAsset rows up-front so the UI can reference
  // generatedAssetId even if the FAL call later fails mid-flight.
  const assetRows = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      db.generatedAsset.create({
        data: {
          userId: params.userId,
          prompt: params.prompt,
          type: 'icon',
          style: preset.id,
          status: 'generating',
          tokensCost: 0,
          metadata: {
            presetId: preset.id,
            category: preset.category,
            composition: preset.composition,
            background: preset.background,
            seed: baseSeed + i,
            sessionId: params.sessionId ?? null,
            enrichedPrompt,
          },
        },
        select: { id: true },
      }),
    ),
  )

  try {
    // Submit all jobs in parallel — one FAL request per icon for diversity.
    const requestIds = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        falSubmit(
          model,
          {
            prompt: enrichedPrompt,
            negative_prompt: negativePrompt,
            image_size: 'square_hd',
            num_inference_steps: steps,
            guidance_scale: guidance,
            num_images: 1,
            seed: baseSeed + i,
            enable_safety_checker: true,
          },
          apiKey,
        ),
      ),
    )

    const outputs = await Promise.all(
      requestIds.map((id) => falPoll<FalImageOutput>(model, id, apiKey)),
    )

    // Flatten to one image per job in order, fall back to a placeholder URL
    // if FAL returned an empty array for some reason.
    let urls: Array<{ url: string; width: number; height: number }> =
      outputs.map((out, i) => {
        const img = out.images?.[0]
        if (!img) {
          throw new Error(`FAL returned no image for job ${i}`)
        }
        return { url: img.url, width: img.width, height: img.height }
      })

    // Optional upscale to 2048x2048.
    if (params.upscale) {
      urls = await Promise.all(urls.map((u) => upscaleIcon(u.url, apiKey)))
    }

    // Optional background removal — only meaningful when preset opts in OR
    // the caller explicitly requested it.
    if (params.removeBackground || preset.background === 'transparent') {
      const bgUrls = await Promise.all(
        urls.map((u) => removeIconBackground(u.url, apiKey)),
      )
      urls = urls.map((u, i) => ({ ...u, url: bgUrls[i] }))
    }

    const generationMs = Date.now() - startedAt

    // Persist the final URLs + mark rows as ready.
    const icons: IconResult[] = await Promise.all(
      urls.map(async (u, i) => {
        const row = assetRows[i]
        await db.generatedAsset.update({
          where: { id: row.id },
          data: {
            status: 'ready',
            sourceUrl: u.url,
            thumbnailUrl: u.url,
            generationMs,
            completedAt: new Date(),
          },
        })
        return {
          url: u.url,
          generatedAssetId: row.id,
          presetId: preset.id,
          seed: baseSeed + i,
          width: u.width,
          height: u.height,
        }
      }),
    )

    return { icons, preset, generationMs, enrichedPrompt }
  } catch (err) {
    // Mark every queued row as failed so the history view is truthful.
    const message = err instanceof Error ? err.message : 'Unknown error'
    await Promise.all(
      assetRows.map((row) =>
        db.generatedAsset
          .update({
            where: { id: row.id },
            data: { status: 'failed', errorMessage: message },
          })
          .catch(() => undefined),
      ),
    )
    throw err
  }
}

// ─── Remix (img2img) ─────────────────────────────────────────────────────

export interface RemixIconParams {
  /** Source GeneratedAsset row id to remix. */
  sourceAssetId: string
  /** User prompt describing the tweak. */
  tweakPrompt: string
  /** Internal DB user id (User.id). */
  userId: string
  /** Optional strength of the tweak, 0.1-1.0. */
  strength?: number
}

/**
 * Generate a variation of an existing icon using FAL image-to-image.
 * Always resolves the source row through the caller's userId so cross-user
 * remixing is impossible.
 */
export async function remixIcon(
  params: RemixIconParams,
): Promise<IconResult> {
  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!apiKey) throw new Error('FAL_KEY is not configured')

  const source = await db.generatedAsset.findFirst({
    where: {
      id: params.sourceAssetId,
      userId: params.userId,
      type: 'icon',
    },
    select: {
      id: true,
      sourceUrl: true,
      prompt: true,
      style: true,
      metadata: true,
    },
  })
  if (!source) {
    throw new Error('Source icon not found or not owned by caller')
  }
  if (!source.sourceUrl) {
    throw new Error('Source icon has no image url to remix')
  }

  const preset = getIconPreset(source.style)
  const enrichedPrompt = buildIconPrompt(preset, params.tweakPrompt)
  const strength = Math.min(1, Math.max(0.1, params.strength ?? 0.55))
  const seed = Math.floor(Math.random() * 2_147_483_647)

  const row = await db.generatedAsset.create({
    data: {
      userId: params.userId,
      prompt: params.tweakPrompt,
      type: 'icon',
      style: preset.id,
      status: 'generating',
      tokensCost: 0,
      metadata: {
        presetId: preset.id,
        remixOf: source.id,
        strength,
        seed,
        enrichedPrompt,
      },
    },
    select: { id: true },
  })

  try {
    // FLUX image-to-image endpoint accepts the same prompt format plus
    // image_url + strength. We use flux/dev for the best tweak quality.
    const model = 'fal-ai/flux/dev/image-to-image'
    const requestId = await falSubmit(
      model,
      {
        prompt: enrichedPrompt,
        negative_prompt: preset.negativePrompt,
        image_url: source.sourceUrl,
        strength,
        num_inference_steps: stepsForTier(preset.qualityTier),
        guidance_scale: guidanceForTier(preset.qualityTier),
        num_images: 1,
        seed,
        enable_safety_checker: true,
      },
      apiKey,
    )

    const output = await falPoll<FalImageOutput>(model, requestId, apiKey)
    const img = output.images?.[0]
    if (!img) throw new Error('FAL remix returned no image')

    await db.generatedAsset.update({
      where: { id: row.id },
      data: {
        status: 'ready',
        sourceUrl: img.url,
        thumbnailUrl: img.url,
        completedAt: new Date(),
      },
    })

    return {
      url: img.url,
      generatedAssetId: row.id,
      presetId: preset.id,
      seed,
      width: img.width,
      height: img.height,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await db.generatedAsset
      .update({
        where: { id: row.id },
        data: { status: 'failed', errorMessage: message },
      })
      .catch(() => undefined)
    throw err
  }
}

// ─── Cost constants ──────────────────────────────────────────────────────

/** Token cost per generated icon (before upscale/bg removal surcharge). */
export const ICON_GENERATION_COST = 5

/** Token cost per icon remix. */
export const ICON_REMIX_COST = 8
