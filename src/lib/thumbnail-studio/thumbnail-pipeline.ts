/**
 * Thumbnail Studio generation pipeline.
 *
 * Responsibilities:
 *   1. Look up the requested preset from the catalog.
 *   2. Build a rich FAL prompt combining the user idea + preset body.
 *   3. Dispatch to the right FAL model (flux-pro | ideogram-v2 | recraft-v3).
 *   4. If an overlay headline was supplied, render an SVG text layer via
 *      text-renderer and attach it as `overlaySvgDataUri` so the client can
 *      composite it on top of the background at display time. (Server-side
 *      sharp compositing would also be possible here, but keeping the layers
 *      separate gives users a free "re-edit headline" feature without re-
 *      running FAL.)
 *   5. Persist each result as a `GeneratedAsset` row with type='thumbnail'
 *      so it shows up in the user's library alongside icons and GFX renders.
 *
 * This module MUST be called from a route that has already resolved
 * `userId` to the internal DB user id (NOT the Clerk id). Passing a Clerk
 * id will blow up in the Prisma FK — the same class of bug the deep
 * verification agent flagged in Apr-10 findings.
 */

import { db } from '../db'
import {
  getThumbnailPreset,
  type FalThumbnailModel,
  type ThumbnailPreset,
} from './thumbnail-presets'
import { renderTextOverlay } from './text-renderer'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateThumbnailParams {
  /** User idea — short natural-language description (e.g. "pet sim boost"). */
  prompt: string
  /** Preset id from the catalog. */
  presetId: string
  /** Optional overlay headline. Empty or unset = no overlay. */
  headlineText?: string
  /** INTERNAL DB user id (NOT the Clerk id). Resolve at the route boundary. */
  userId: string
  /** Optional session id for studio-session attribution. */
  sessionId?: string
  /** Number of variants to generate (1–3). */
  count: number
}

export interface ThumbnailResultItem {
  /** Row id in the GeneratedAsset table. */
  assetId: string
  /** The raw FAL background image url. */
  imageUrl: string
  /** Base64 SVG overlay data-uri, or `null` if no headline was rendered. */
  overlaySvgDataUri: string | null
  /** The preset used to generate this result — echoed for convenience. */
  presetId: string
  /** Which FAL model actually produced the image. */
  model: FalThumbnailModel
}

export interface ThumbnailResult {
  items: ThumbnailResultItem[]
  /** Aggregate cost in USD reported by the underlying model calls. */
  usdCost: number
}

// ─── FAL routing ────────────────────────────────────────────────────────────

/**
 * Map the preset's recommendedFalModel field to the actual FAL model id.
 * Exposed so the pipeline + tests can swap the mapping without editing the
 * preset catalog.
 */
export const FAL_MODEL_IDS: Record<FalThumbnailModel, string> = {
  'flux-pro': 'fal-ai/flux-pro/v1.1',
  'ideogram-v2': 'fal-ai/ideogram/v2',
  'recraft-v3': 'fal-ai/recraft-v3',
}

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const USD_PER_IMAGE: Record<FalThumbnailModel, number> = {
  'flux-pro': 0.055,
  'ideogram-v2': 0.08,
  'recraft-v3': 0.04,
}

// ─── FAL client — slim version tuned for this pipeline ─────────────────────
// We deliberately don't import the image route's helpers to keep the
// thumbnail pipeline independently unit-testable. The shapes below match
// FAL's documented queue API.

interface FalSubmitResponse {
  request_id: string
}
interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}
interface FalImageResult {
  images?: Array<{ url: string; width?: number; height?: number }>
}

export interface FalClient {
  generate(
    model: string,
    input: Record<string, unknown>,
  ): Promise<FalImageResult>
}

function defaultFalClient(apiKey: string): FalClient {
  return {
    async generate(model, input) {
      const submitRes = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(20_000),
      })
      if (!submitRes.ok) {
        throw new Error(
          `FAL submit failed (${submitRes.status}): ${await submitRes.text()}`,
        )
      }
      const { request_id } = (await submitRes.json()) as FalSubmitResponse

      // Poll up to ~90s.
      const maxAttempts = 30
      const intervalMs = 3_000
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 2_000 : intervalMs))
        const statusRes = await fetch(
          `${FAL_QUEUE_BASE}/${model}/requests/${request_id}/status`,
          {
            headers: { Authorization: `Key ${apiKey}` },
            signal: AbortSignal.timeout(8_000),
          },
        )
        if (!statusRes.ok) continue
        const { status } = (await statusRes.json()) as FalStatusResponse
        if (status === 'FAILED') {
          throw new Error(`FAL job ${request_id} failed`)
        }
        if (status === 'COMPLETED') {
          const resultRes = await fetch(
            `${FAL_QUEUE_BASE}/${model}/requests/${request_id}`,
            {
              headers: { Authorization: `Key ${apiKey}` },
              signal: AbortSignal.timeout(10_000),
            },
          )
          if (!resultRes.ok) throw new Error('FAL result fetch failed')
          return (await resultRes.json()) as FalImageResult
        }
      }
      throw new Error('Thumbnail generation timed out')
    },
  }
}

// ─── Prompt assembly ───────────────────────────────────────────────────────

export function buildFalPrompt(
  userPrompt: string,
  preset: ThumbnailPreset,
): string {
  const trimmed = userPrompt.trim().replace(/^make (me )?(a |an )?/i, '')
  return `${trimmed}. ${preset.prompt}`
}

// ─── Mock-friendly persistence adapter ────────────────────────────────────

export interface PersistenceAdapter {
  create(row: {
    userId: string
    prompt: string
    sourceUrl: string
    metadata: Record<string, unknown>
    tokensCost: number
  }): Promise<{ id: string }>
}

function defaultPersistence(): PersistenceAdapter {
  return {
    async create(row) {
      const asset = await db.generatedAsset.create({
        data: {
          userId: row.userId,
          prompt: row.prompt,
          type: 'thumbnail',
          style: 'thumbnail-studio',
          status: 'ready',
          sourceUrl: row.sourceUrl,
          thumbnailUrl: row.sourceUrl,
          metadata: row.metadata,
          tokensCost: row.tokensCost,
          completedAt: new Date(),
        },
        select: { id: true },
      })
      return { id: asset.id }
    },
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────

export interface GenerateThumbnailDeps {
  fal?: FalClient
  persistence?: PersistenceAdapter
  /** Token cost per generated thumbnail, used for GeneratedAsset.tokensCost. */
  tokensPerThumbnail?: number
}

export async function generateThumbnail(
  params: GenerateThumbnailParams,
  deps: GenerateThumbnailDeps = {},
): Promise<ThumbnailResult> {
  const count = Math.max(1, Math.min(3, params.count))
  const preset = getThumbnailPreset(params.presetId)
  const model = preset.recommendedFalModel
  const modelId = FAL_MODEL_IDS[model]

  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  const fal =
    deps.fal ??
    (apiKey
      ? defaultFalClient(apiKey)
      : {
          // Demo fallback — returns placeholder images so local dev without
          // a FAL key still exercises the whole code path.
          async generate() {
            return {
              images: [
                {
                  url: `https://placehold.co/1920x1080/1a1a2e/d4af37?text=${encodeURIComponent(preset.name)}`,
                  width: 1920,
                  height: 1080,
                },
              ],
            }
          },
        })

  const persistence = deps.persistence ?? defaultPersistence()
  const tokensPerThumbnail = deps.tokensPerThumbnail ?? 15
  const fullPrompt = buildFalPrompt(params.prompt, preset)

  // Submit all `count` jobs in parallel.
  const jobs = Array.from({ length: count }, (_, i) =>
    fal.generate(modelId, {
      prompt: fullPrompt,
      negative_prompt: preset.negativePrompt,
      image_size: 'landscape_16_9',
      num_images: 1,
      seed: Math.floor(Math.random() * 2_147_483_647) + i,
      enable_safety_checker: true,
    }),
  )

  const results = await Promise.all(jobs)
  const imageUrls = results.flatMap((r) => r.images?.map((i) => i.url) ?? [])

  // Overlay is optional. `none` text position means the preset doesn't want
  // overlay text even if the user passed a headline.
  const wantOverlay =
    !!params.headlineText &&
    params.headlineText.trim().length > 0 &&
    preset.composition.textPosition !== 'none'

  const overlay = wantOverlay
    ? renderTextOverlay({
        text: params.headlineText!,
        style: preset.composition.textStyle,
        position: preset.composition.textPosition,
        size: preset.composition.textSize,
        color: '#FFFFFF',
        accentColor: preset.composition.accentColor,
      })
    : null

  // Persist each image as its own GeneratedAsset row.
  const items: ThumbnailResultItem[] = []
  for (const imageUrl of imageUrls) {
    const asset = await persistence.create({
      userId: params.userId,
      prompt: params.prompt,
      sourceUrl: imageUrl,
      metadata: {
        presetId: preset.id,
        presetName: preset.name,
        category: preset.category,
        composition: preset.composition,
        headlineText: params.headlineText ?? null,
        overlaySvgDataUri: overlay?.dataUri ?? null,
        model,
        sessionId: params.sessionId ?? null,
      },
      tokensCost: tokensPerThumbnail,
    })
    items.push({
      assetId: asset.id,
      imageUrl,
      overlaySvgDataUri: overlay?.dataUri ?? null,
      presetId: preset.id,
      model,
    })
  }

  return {
    items,
    usdCost: imageUrls.length * USD_PER_IMAGE[model],
  }
}
