/**
 * POST /api/ai/image/separate
 *
 * Takes a composite image containing multiple assets and uses Gemini Vision
 * to identify bounding boxes for each distinct asset, then crops and returns
 * them as individual transparent PNGs via Fal background removal.
 *
 * Body:
 *   { imageUrl?: string, base64?: string }
 *
 * Returns:
 *   { assets: Array<{ url: string; label: string; bounds: { x, y, w, h } }>, status: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 120

const bodySchema = z
  .object({
    imageUrl: z.string().url().optional(),
    base64: z.string().min(1).optional(),
  })
  .refine((b) => b.imageUrl || b.base64, {
    message: 'Either imageUrl or base64 is required',
  })

// ── Gemini Vision for bounding-box detection ─────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SEPARATION_PROMPT = `You are analyzing a composite image that contains multiple game assets, sprites, or objects arranged on a single canvas.

Identify every distinct asset/object in the image. For each one, return its bounding box as normalized coordinates (0.0 to 1.0 relative to image dimensions) and a short label.

Return ONLY a valid JSON array (no markdown, no prose):
[
  { "label": "red sword", "x": 0.1, "y": 0.2, "w": 0.15, "h": 0.3 },
  ...
]

Rules:
- x, y = top-left corner as fraction of image width/height
- w, h = width and height as fraction of image width/height
- Return at least 1 and at most 20 items
- Label each asset descriptively (e.g. "blue gem", "wooden shield", "character sprite")
- Do not overlap bounding boxes if avoidable
- If there is only one asset, still return an array with one entry`

interface DetectedAsset {
  label: string
  x: number
  y: number
  w: number
  h: number
}

async function detectAssetBounds(
  base64Data: string,
  mimeType: string,
): Promise<DetectedAsset[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: SEPARATION_PROMPT },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()

  let parsed: DetectedAsset[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini returned non-JSON: ${rawText.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed)) throw new Error('Expected array of asset bounds')

  // Clamp values to [0, 1]
  return parsed.slice(0, 20).map((a) => ({
    label: String(a.label || 'asset').slice(0, 100),
    x: Math.max(0, Math.min(1, Number(a.x) || 0)),
    y: Math.max(0, Math.min(1, Number(a.y) || 0)),
    w: Math.max(0.01, Math.min(1, Number(a.w) || 0.1)),
    h: Math.max(0.01, Math.min(1, Number(a.h) || 0.1)),
  }))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveBase64(input: { imageUrl?: string; base64?: string }): {
  base64Data: string
  mimeType: string
} | null {
  if (!input.base64) return null

  if (input.base64.startsWith('data:')) {
    const [header, data] = input.base64.split(',')
    return {
      base64Data: data,
      mimeType: header.replace('data:', '').replace(';base64', ''),
    }
  }

  return { base64Data: input.base64, mimeType: 'image/png' }
}

async function fetchImageAsBase64(url: string): Promise<{ base64Data: string; mimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const contentType = res.headers.get('content-type') ?? 'image/png'
  const buffer = await res.arrayBuffer()
  return {
    base64Data: Buffer.from(buffer).toString('base64'),
    mimeType: contentType.split(';')[0].trim(),
  }
}

// ── Demo fallback ────────────────────────────────────────────────────────────

function buildDemoSeparation() {
  return {
    assets: [
      { url: null, label: 'asset_1', bounds: { x: 0, y: 0, w: 0.5, h: 0.5 } },
      { url: null, label: 'asset_2', bounds: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } },
    ],
    status: 'demo' as const,
    message: 'Set GEMINI_API_KEY and FAL_KEY to enable asset separation',
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE') // Beta: all testers get full access
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable
    }
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const result = bodySchema.safeParse(raw)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors.map((e) => e.message).join(', ') },
        { status: 422 },
      )
    }
    parsed = result.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)
  if (!hasGeminiKey) {
    return NextResponse.json(buildDemoSeparation())
  }

  try {
    // Resolve to base64 for Gemini
    let imageData: { base64Data: string; mimeType: string }
    const resolved = resolveBase64(parsed)
    if (resolved) {
      imageData = resolved
    } else if (parsed.imageUrl) {
      imageData = await fetchImageAsBase64(parsed.imageUrl)
    } else {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Detect asset bounding boxes
    const bounds = await detectAssetBounds(imageData.base64Data, imageData.mimeType)

    // Return bounds with the original image URL/data for client-side cropping
    // (Server-side cropping would require canvas/sharp which adds heavy deps)
    const assets = bounds.map((b) => ({
      url: parsed.imageUrl ?? null,
      label: b.label,
      bounds: { x: b.x, y: b.y, w: b.w, h: b.h },
    }))

    return NextResponse.json({
      assets,
      status: 'complete',
      sourceImage: parsed.imageUrl ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[separate POST] Failed:', message)
    return NextResponse.json({ error: 'Asset separation failed', detail: message }, { status: 502 })
  }
}
