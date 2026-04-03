/**
 * Shared Fal AI helpers.
 *
 * Extracted from src/app/api/ai/3d-generate/route.ts so both the Next.js
 * route and the background worker can call them without duplication.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface FalTextureSet {
  albedo:    string | null
  normal:    string | null
  roughness: string | null
  metallic:  string | null
}

interface FalQueueResponse  { request_id: string }
interface FalStatusResponse { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }
interface FalTextureOutput  {
  albedo?:    { url: string }
  normal?:    { url: string }
  roughness?: { url: string }
  metallic?:  { url: string }
  images?:    Array<{ url: string }>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'

function getApiKey(): string | null {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!key) {
    console.warn('[fal] FAL_KEY is not configured — texture generation disabled')
    return null
  }
  return key
}

// ── generateTextures ──────────────────────────────────────────────────────────

/**
 * Generates a PBR texture set (albedo, normal, roughness, metallic) via Fal AI.
 *
 * Returns null if:
 *   - FAL_KEY is not set
 *   - The API request fails at any step (non-throwing, graceful degradation)
 *
 * Throws only on unexpected errors that should surface to the caller.
 */
export async function generateTextures(params: {
  prompt:       string
  apiKey?:      string
  resolution?:  number
  maxAttempts?: number
  intervalMs?:  number
}): Promise<FalTextureSet | null> {
  const {
    prompt,
    resolution  = 1024,
    maxAttempts = 15,
    intervalMs  = 4_000,
  } = params

  const apiKey = params.apiKey ?? getApiKey()
  if (!apiKey) {
    return null
  }

  try {
    const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt:        `${prompt}, seamless PBR texture, physically based rendering, game asset, high detail`,
        resolution,
        output_format: 'png',
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!submitRes.ok) return null

    const queue = (await submitRes.json()) as FalQueueResponse
    const reqId = queue.request_id

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise<void>((r) => setTimeout(r, intervalMs))

      const statusRes = await fetch(
        `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}/status`,
        {
          headers: { Authorization: `Key ${apiKey}` },
          signal:  AbortSignal.timeout(8_000),
        },
      )
      if (!statusRes.ok) continue

      const status = (await statusRes.json()) as FalStatusResponse

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}`,
          {
            headers: { Authorization: `Key ${apiKey}` },
            signal:  AbortSignal.timeout(10_000),
          },
        )
        if (!resultRes.ok) return null

        const out = (await resultRes.json()) as FalTextureOutput
        return {
          albedo:    out.albedo?.url    ?? out.images?.[0]?.url ?? null,
          normal:    out.normal?.url    ?? out.images?.[1]?.url ?? null,
          roughness: out.roughness?.url ?? out.images?.[2]?.url ?? null,
          metallic:  out.metallic?.url  ?? null,
        }
      }

      if (status.status === 'FAILED') return null
    }

    return null
  } catch {
    return null
  }
}
