/**
 * POST /api/ai/texture
 *
 * Generates a tileable texture image from a text description.
 *
 * REAL mode  (FAL_API_KEY set):  calls Fal AI Flux Pro image generation.
 * DEMO mode  (no key):           returns placeholder data instantly.
 *
 * Body:    { prompt: string; resolution?: "512" | "1024" | "2048" }
 * Returns: { textureUrl, resolution, status, message? }
 */

import { NextRequest, NextResponse } from 'next/server'

type Resolution = '512' | '1024' | '2048'

interface FalResult {
  images?: { url: string; width: number; height: number }[]
  image?: { url: string }
}

// ── Fal AI helper ────────────────────────────────────────────────────────────

async function generateWithFal(
  prompt: string,
  resolution: Resolution,
  apiKey: string,
): Promise<string> {
  const size = parseInt(resolution, 10)

  const res = await fetch('https://queue.fal.run/fal-ai/flux-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: `${prompt}, seamless tileable texture, high detail, game asset, top-down view`,
      image_size: { width: size, height: size },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fal AI request failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as FalResult

  const url =
    data.images?.[0]?.url ??
    data.image?.url

  if (!url) throw new Error('Fal AI returned no image URL')
  return url
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let prompt: string
  let resolution: Resolution

  try {
    const body = (await req.json()) as { prompt?: unknown; resolution?: unknown }

    if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    prompt = body.prompt.trim()
    resolution =
      body.resolution === '512' || body.resolution === '2048'
        ? (body.resolution as Resolution)
        : '1024'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const apiKey = process.env.FAL_API_KEY

  // ── DEMO MODE ─────────────────────────────────────────────────────────────
  if (!apiKey) {
    return NextResponse.json({
      textureUrl: null,
      thumbnailUrl: '/demo/mesh-preview.svg',
      resolution,
      status: 'demo',
      message: 'In production, this generates a real texture via Fal AI Flux Pro',
    })
  }

  // ── REAL MODE ─────────────────────────────────────────────────────────────
  try {
    const textureUrl = await generateWithFal(prompt, resolution, apiKey)
    return NextResponse.json({ textureUrl, resolution, status: 'complete' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Texture generation failed', detail: message }, { status: 502 })
  }
}
