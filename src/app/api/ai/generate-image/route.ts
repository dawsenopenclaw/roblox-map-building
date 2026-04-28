/**
 * POST /api/ai/generate-image — Unified image generation
 *
 * Auto-selects the best provider:
 * - GPT Image (gpt-image-1): UI mockups, game menus, HUD, shops, inventories
 * - Nano Banana (Gemini 2.5 Flash Image): game art, icons, characters, weapons
 * - FAL FLUX Pro: photorealistic, textures, environments
 *
 * Body:
 *   {
 *     prompt: string
 *     style?: ImageStyle     — auto-detected from prompt if not set
 *     provider?: "auto" | "gpt" | "nano" | "fal"
 *     size?: "square" | "landscape" | "portrait"
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { spendTokens, earnTokens } from '@/lib/tokens-server'
import { generateImage, detectImageStyle, type ImageStyle } from '@/lib/ai/image-engine'

export const maxDuration = 90

const NSFW_BLOCKLIST = [
  'nude', 'naked', 'nsfw', 'porn', 'sexual', 'erotic', 'gore',
  'dismember', 'child abuse', 'underage', 'explicit',
]

export async function POST(req: NextRequest) {
  const { user, response: authError } = await getDbUserOrUnauthorized()
  if (authError) return authError

  const body = await req.json()
  const { prompt, style, provider, size } = body as {
    prompt: string
    style?: ImageStyle
    provider?: 'auto' | 'gpt' | 'nano' | 'fal'
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

  // Auto-detect style if not provided
  const resolvedStyle = style || detectImageStyle(prompt)

  // Pre-charge tokens (refund on failure)
  // spendTokens throws on insufficient balance — catch and return 402
  const maxCost = provider === 'gpt' ? 5 : provider === 'fal' ? 5 : 3
  try {
    await spendTokens(user.id, maxCost, `Image: ${prompt.slice(0, 50)}`)
  } catch (spendErr) {
    const msg = spendErr instanceof Error ? spendErr.message : 'Token charge failed'
    return NextResponse.json({ error: msg.includes('Insufficient') ? 'Insufficient tokens' : msg, redirect: '/tokens' }, { status: 402 })
  }

  try {
    const result = await generateImage({
      prompt,
      style: resolvedStyle,
      provider: provider || 'auto',
      size: size || 'auto',
    })

    // Refund difference if cheaper provider was used
    if (result.cost < maxCost) {
      try {
        await earnTokens(user.id, maxCost - result.cost, 'REFUND', 'Refund: cheaper provider used')
      } catch { /* best-effort refund */ }
    }

    return NextResponse.json({
      image: { url: result.url },
      images: [{ url: result.url }], // compatibility with old format
      provider: result.provider,
      model: result.model,
      prompt: result.prompt,
      enhancedPrompt: result.enhancedPrompt,
      style: result.style,
      cost: result.cost,
    })
  } catch (err) {
    // Refund on failure
    try {
      await earnTokens(user.id, maxCost, 'REFUND', 'Refund: image generation failed')
    } catch { /* best-effort refund */ }
    return NextResponse.json({
      error: `Generation failed: ${err instanceof Error ? err.message : 'All providers failed'}`,
    }, { status: 502 })
  }
}
