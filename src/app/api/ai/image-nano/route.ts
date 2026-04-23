/**
 * POST /api/ai/image-nano
 *
 * Nano Banana (Gemini 2.5 Flash Image) — Google's best image generation model.
 * Uses your existing GEMINI_API_KEY. ~$0.04 per image.
 *
 * Capabilities:
 * - Text to image (any style — photorealistic, cartoon, pixel art, 3D render)
 * - Image editing (inpaint, outpaint, restyle)
 * - Multi-image fusion
 * - Roblox game art: icons, thumbnails, textures, UI elements, concept art
 *
 * Body:
 *   {
 *     prompt: string          — what to generate
 *     style?: string          — "roblox-icon" | "game-thumbnail" | "concept-art" | "texture" | "ui-element" | "3d-render" | "pixel-art" | "anime" | "realistic" | "cartoon"
 *     referenceImage?: string — base64 image for editing/restyling
 *     size?: "square" | "landscape" | "portrait"
 *   }
 *
 * Returns:
 *   { image: { url: string }, prompt: string, model: "gemini-2.5-flash-image" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { spendTokens } from '@/lib/tokens-server'

export const maxDuration = 60

const GEMINI_KEY = process.env.GEMINI_API_KEY
const IMAGE_CREDIT_COST = 3 // Cheaper than FAL since we use our own Gemini key

// Style prompt prefixes
const STYLE_PREFIXES: Record<string, string> = {
  'roblox-icon': 'Create a Roblox game icon. Clean, bold, eye-catching with bright colors. The image should work as a square thumbnail on the Roblox game page. Style: 3D rendered, cartoon-ish, fun, high contrast.',
  'game-thumbnail': 'Create a Roblox game thumbnail. Wide format, action-packed scene, showing gameplay. Bold text-friendly composition with space for a title. Style: 3D rendered, dynamic angles, exciting.',
  'concept-art': 'Create concept art for a Roblox game. Detailed environment design showing architecture, lighting, mood. Style: professional concept art, painterly, atmospheric.',
  'texture': 'Create a seamless tileable texture for a Roblox game. The texture should tile perfectly on all edges. Style: clean, game-ready, consistent lighting.',
  'ui-element': 'Create a UI element for a Roblox game. Clean design with rounded corners, subtle gradients. Style: modern mobile game UI, crisp edges, readable at small sizes.',
  '3d-render': 'Create a 3D rendered scene. Clean geometry, good lighting, professional rendering. Style: Pixar-quality 3D render, soft shadows, ambient occlusion.',
  'pixel-art': 'Create pixel art. Clean pixels, limited color palette, retro game aesthetic. Style: 16-bit or 32-bit pixel art, no anti-aliasing on edges.',
  'anime': 'Create in anime/manga style. Clean lines, expressive characters, vibrant colors. Style: Japanese animation quality, cel-shaded look.',
  'realistic': 'Create a photorealistic image. Natural lighting, detailed textures, realistic proportions. Style: photography quality, sharp focus.',
  'cartoon': 'Create in a fun cartoon style. Bold outlines, bright saturated colors, exaggerated proportions. Style: modern cartoon, like a kids show or comic book.',
  'nano-banana': 'Create a 3D figurine in the Nano Banana style. Cute, stylized, collectible figure on a simple background. Clean 3D render with soft lighting.',
}

// NSFW filter
const NSFW_BLOCKLIST = [
  'nude', 'naked', 'nsfw', 'porn', 'sexual', 'erotic', 'gore', 'dismember',
  'child abuse', 'underage', 'explicit',
]

export async function POST(req: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
  }

  const { user, response: authError } = await getDbUserOrUnauthorized()
  if (authError) return authError

  const body = await req.json()
  const { prompt, style, referenceImage, size } = body as {
    prompt: string
    style?: string
    referenceImage?: string
    size?: 'square' | 'landscape' | 'portrait'
  }

  if (!prompt || prompt.length < 2) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  // NSFW check
  const lower = prompt.toLowerCase()
  if (NSFW_BLOCKLIST.some(term => lower.includes(term))) {
    return NextResponse.json({ error: 'Content not allowed' }, { status: 400 })
  }

  // Build the full prompt with style prefix
  const stylePrefix = STYLE_PREFIXES[style || 'cartoon'] || ''
  const fullPrompt = stylePrefix
    ? `${stylePrefix}\n\nSubject: ${prompt}`
    : prompt

  // Spend tokens
  const spend = await spendTokens(user.id, IMAGE_CREDIT_COST, `Nano Banana image: ${prompt.slice(0, 50)}`)
  if (!spend.success) {
    return NextResponse.json({ error: 'Insufficient tokens', redirect: '/tokens' }, { status: 402 })
  }

  try {
    // Build request parts
    const parts: Array<Record<string, unknown>> = [{ text: fullPrompt }]

    // Add reference image if provided (for editing/restyling)
    if (referenceImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: referenceImage.replace(/^data:image\/\w+;base64,/, ''),
        },
      })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
        signal: AbortSignal.timeout(45_000),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[NanoBanana] Gemini error:', res.status, errText.slice(0, 200))
      // Refund tokens on failure
      await spendTokens(user.id, -IMAGE_CREDIT_COST, 'Refund: image generation failed')
      return NextResponse.json({ error: 'Image generation failed' }, { status: 502 })
    }

    const data = await res.json()
    const candidate = data?.candidates?.[0]?.content?.parts

    if (!candidate || !Array.isArray(candidate)) {
      await spendTokens(user.id, -IMAGE_CREDIT_COST, 'Refund: no image in response')
      return NextResponse.json({ error: 'No image generated' }, { status: 502 })
    }

    // Find the image part in the response
    const imagePart = candidate.find(
      (p: Record<string, unknown>) => p.inlineData && (p.inlineData as Record<string, unknown>).mimeType?.toString().startsWith('image/')
    )

    if (!imagePart) {
      // Gemini returned text only — no image
      const textPart = candidate.find((p: Record<string, unknown>) => p.text)
      await spendTokens(user.id, -IMAGE_CREDIT_COST, 'Refund: text-only response')
      return NextResponse.json({
        error: 'Model returned text instead of image',
        text: (textPart as Record<string, unknown>)?.text || 'No output',
      }, { status: 422 })
    }

    const imageData = (imagePart as { inlineData: { data: string; mimeType: string } }).inlineData

    // Return as base64 data URL
    const dataUrl = `data:${imageData.mimeType};base64,${imageData.data}`

    return NextResponse.json({
      image: { url: dataUrl },
      prompt: prompt,
      enhancedPrompt: fullPrompt.slice(0, 200),
      model: 'gemini-2.5-flash-image',
      style: style || 'cartoon',
      cost: IMAGE_CREDIT_COST,
    })
  } catch (err) {
    console.error('[NanoBanana] Error:', err)
    await spendTokens(user.id, -IMAGE_CREDIT_COST, 'Refund: generation error')
    return NextResponse.json({
      error: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, { status: 500 })
  }
}
