/**
 * Unified Image Engine — GPT Image + Nano Banana + FAL
 *
 * One function call, best provider auto-selected:
 * - GPT Image (gpt-image-1): Best for UI/GUI mockups, game menus, HUD designs
 * - Nano Banana (Gemini 2.5 Flash Image): Best for game art, icons, concept art
 * - FAL FLUX Pro: Best for photorealistic, textures, high-res
 *
 * Each provider has different strengths. The engine picks the best one
 * based on what you're generating, or you can force a specific provider.
 */

import 'server-only'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ImageRequest {
  prompt: string
  style?: ImageStyle
  provider?: 'auto' | 'gpt' | 'nano' | 'fal'
  size?: 'square' | 'landscape' | 'portrait' | 'auto'
  quality?: 'standard' | 'high'
  referenceImage?: string // base64 for editing
}

export interface ImageResult {
  url: string // base64 data URL or hosted URL
  provider: string
  model: string
  prompt: string
  enhancedPrompt?: string
  style: string
  cost: number // token cost
}

export type ImageStyle =
  | 'roblox-icon' | 'game-thumbnail' | 'concept-art' | 'texture'
  | 'ui-mockup' | 'game-menu' | 'hud-design' | 'shop-ui' | 'inventory-ui'
  | '3d-render' | 'pixel-art' | 'anime' | 'realistic' | 'cartoon'
  | 'nano-banana' | 'character-design' | 'weapon-design' | 'vehicle-design'
  | 'environment' | 'logo' | 'loading-screen' | 'badge' | 'effect'

// ─── Style → Provider Routing ────────────────────────────────────────────────
// GPT Image excels at: structured layouts, text in images, UI mockups, menus
// Nano Banana excels at: game art, stylized renders, creative imagery
// FAL excels at: photorealistic, high-res textures, detailed environments

const STYLE_PROVIDER_MAP: Record<ImageStyle, 'gpt' | 'nano' | 'fal'> = {
  // UI/GUI → GPT (best at structured layouts + text rendering)
  'ui-mockup': 'gpt',
  'game-menu': 'gpt',
  'hud-design': 'gpt',
  'shop-ui': 'gpt',
  'inventory-ui': 'gpt',
  'loading-screen': 'gpt',
  'badge': 'gpt',

  // Game art → Nano Banana (fast, creative, free-ish)
  'roblox-icon': 'nano',
  'game-thumbnail': 'nano',
  'concept-art': 'nano',
  'character-design': 'nano',
  'weapon-design': 'nano',
  'vehicle-design': 'nano',
  'nano-banana': 'nano',
  'cartoon': 'nano',
  'anime': 'nano',
  'pixel-art': 'nano',
  'logo': 'nano',
  'effect': 'nano',

  // Photorealistic / textures → FAL
  'texture': 'fal',
  'realistic': 'fal',
  '3d-render': 'fal',
  'environment': 'fal',
}

// ─── Style Prompt Enhancement ────────────────────────────────────────────────
const STYLE_PROMPTS: Record<ImageStyle, string> = {
  'roblox-icon': 'Create a Roblox game icon. Square format, bold and eye-catching, bright colors, clean 3D rendered style that works as a small thumbnail.',
  'game-thumbnail': 'Create a Roblox game thumbnail. Wide format, action-packed, dynamic camera angle, shows exciting gameplay moment. Space for title text.',
  'concept-art': 'Professional game concept art. Detailed environment design, atmospheric lighting, painterly style. Show depth and mood.',
  'texture': 'Seamless tileable game texture. Must tile perfectly on all edges. Consistent lighting, no shadows that break tiling.',
  'ui-mockup': 'Design a modern Roblox game UI screen. Dark theme with rounded corners, gold (#D4AF37) accents, clean typography, proper spacing. Show the full screen layout with all elements clearly visible. Include icons, buttons, text labels, and data displays.',
  'game-menu': 'Design a Roblox game menu UI. Dark glassmorphism background, neon accents, smooth gradients. Include: title, menu buttons (Play, Shop, Settings, Inventory), character preview area, currency display. Professional mobile game quality.',
  'hud-design': 'Design a Roblox game HUD overlay. Transparent background elements. Include: health bar, stamina bar, minimap, currency counter, hotbar slots, level indicator. Clean, minimal, non-intrusive. Modern mobile game style.',
  'shop-ui': 'Design a Roblox game shop/store UI. Grid of item cards with: item image, name, price, rarity border color, buy button. Include currency display, category tabs, search bar. Dark theme, gold accents, premium feel.',
  'inventory-ui': 'Design a Roblox inventory/backpack UI. Grid layout with item slots, equipped items section, item details panel (stats, description, equip button). Rarity colors: Common=gray, Uncommon=green, Rare=blue, Epic=purple, Legendary=gold.',
  '3d-render': 'Create a 3D rendered scene. Clean geometry, professional lighting, Pixar quality. Soft shadows, ambient occlusion, depth of field.',
  'pixel-art': 'Create pixel art. Clean pixels, limited color palette, no anti-aliasing. 16-bit or 32-bit retro style.',
  'anime': 'Create in anime/manga style. Clean cel-shaded look, expressive, vibrant colors.',
  'realistic': 'Create a photorealistic image. Natural lighting, detailed textures, photography quality.',
  'cartoon': 'Fun cartoon style. Bold outlines, bright saturated colors, exaggerated proportions like a kids show.',
  'nano-banana': 'Create a cute 3D figurine in the Nano Banana style. Collectible figure on a clean background, soft studio lighting.',
  'character-design': 'Design a Roblox game character. Blocky Roblox proportions, unique outfit, accessories, expression. Show front and side views. Clean rendering.',
  'weapon-design': 'Design a Roblox game weapon. Stylized low-poly design, glowing effects, multiple color variants. Show the weapon from multiple angles.',
  'vehicle-design': 'Design a Roblox game vehicle. Stylized low-poly, clean geometry, bright colors, spoiler/decals/wheels visible. Show 3/4 view.',
  'environment': 'Design a Roblox game environment. Wide shot showing terrain, buildings, props, lighting. Atmospheric, explorable, game-ready.',
  'logo': 'Create a game logo/wordmark. Bold 3D text with effects (glow, shadow, gradient). Clean on dark background. Memorable and readable.',
  'loading-screen': 'Design a Roblox game loading screen. Full screen, atmospheric background, centered logo, loading bar at bottom, tips text area. Premium quality.',
  'badge': 'Design a game achievement badge/icon. Circular or shield shape, metallic look, embossed details. Gold/silver/bronze variants.',
  'effect': 'Design a game visual effect/particle. Transparent background. Could be: magic spell, explosion, aura, trail, impact. Stylized and colorful.',
}

// ─── GPT Image Generation ────────────────────────────────────────────────────
async function generateWithGPT(prompt: string, style: ImageStyle, size: string): Promise<ImageResult | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const stylePrompt = STYLE_PROMPTS[style] || ''
  const fullPrompt = stylePrompt ? `${stylePrompt}\n\nSubject: ${prompt}` : prompt

  const sizeMap: Record<string, string> = {
    'square': '1024x1024',
    'landscape': '1536x1024',
    'portrait': '1024x1536',
    'auto': '1024x1024',
  }

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: 1,
        size: sizeMap[size] || '1024x1024',
        quality: 'auto',
        output_format: 'png',
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      console.error('[GPT Image]', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = await res.json()
    const imageB64 = data?.data?.[0]?.b64_json
    if (!imageB64) return null

    return {
      url: `data:image/png;base64,${imageB64}`,
      provider: 'openai',
      model: 'gpt-image-1',
      prompt,
      enhancedPrompt: fullPrompt.slice(0, 200),
      style,
      cost: 5,
    }
  } catch (err) {
    console.error('[GPT Image] Error:', err)
    return null
  }
}

// ─── Nano Banana (Gemini 2.5 Flash Image) ────────────────────────────────────
async function generateWithNano(prompt: string, style: ImageStyle): Promise<ImageResult | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const stylePrompt = STYLE_PROMPTS[style] || ''
  const fullPrompt = stylePrompt ? `${stylePrompt}\n\nSubject: ${prompt}` : prompt

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 1,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      }
    )

    if (!res.ok) {
      console.error('[Nano Banana]', res.status)
      return null
    }

    const data = await res.json()
    const parts = data?.candidates?.[0]?.content?.parts
    if (!parts) return null

    const imagePart = parts.find(
      (p: Record<string, unknown>) => p.inlineData && (p.inlineData as Record<string, unknown>).mimeType?.toString().startsWith('image/')
    )
    if (!imagePart) return null

    const imageData = (imagePart as { inlineData: { data: string; mimeType: string } }).inlineData

    return {
      url: `data:${imageData.mimeType};base64,${imageData.data}`,
      provider: 'google',
      model: 'gemini-2.5-flash-image',
      prompt,
      enhancedPrompt: fullPrompt.slice(0, 200),
      style,
      cost: 3,
    }
  } catch (err) {
    console.error('[Nano Banana] Error:', err)
    return null
  }
}

// ─── FAL FLUX Pro ────────────────────────────────────────────────────────────
async function generateWithFal(prompt: string, style: ImageStyle, size: string): Promise<ImageResult | null> {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY
  if (!key) return null

  const stylePrompt = STYLE_PROMPTS[style] || ''
  const fullPrompt = stylePrompt ? `${stylePrompt}\n\nSubject: ${prompt}` : prompt

  const sizeMap: Record<string, { width: number; height: number }> = {
    'square': { width: 1024, height: 1024 },
    'landscape': { width: 1344, height: 768 },
    'portrait': { width: 768, height: 1344 },
    'auto': { width: 1024, height: 1024 },
  }
  const dims = sizeMap[size] || sizeMap.square

  try {
    const res = await fetch('https://queue.fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${key}` },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: dims,
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        safety_tolerance: '2',
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const requestId = data.request_id
    if (!requestId) return null

    // Poll for completion
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${key}` },
      })
      if (!statusRes.ok) continue
      const status = await statusRes.json()
      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}`, {
          headers: { Authorization: `Key ${key}` },
        })
        const result = await resultRes.json()
        const imageUrl = result?.images?.[0]?.url
        if (imageUrl) {
          return {
            url: imageUrl,
            provider: 'fal',
            model: 'flux-pro-v1.1',
            prompt,
            enhancedPrompt: fullPrompt.slice(0, 200),
            style,
            cost: 5,
          }
        }
        break
      }
      if (status.status === 'FAILED') break
    }
    return null
  } catch (err) {
    console.error('[FAL] Error:', err)
    return null
  }
}

// ─── Main: Generate Image ────────────────────────────────────────────────────
export async function generateImage(req: ImageRequest): Promise<ImageResult> {
  const style: ImageStyle = req.style || 'cartoon'
  const size = req.size || 'auto'
  const provider = req.provider || 'auto'

  // Auto-select provider based on style
  const selectedProvider = provider === 'auto'
    ? STYLE_PROVIDER_MAP[style] || 'nano'
    : provider

  // Try selected provider first, then fallbacks
  const providerOrder = selectedProvider === 'gpt'
    ? [generateWithGPT, generateWithNano, generateWithFal]
    : selectedProvider === 'nano'
    ? [generateWithNano, generateWithGPT, generateWithFal]
    : [generateWithFal, generateWithNano, generateWithGPT]

  for (const generator of providerOrder) {
    const result = await generator(req.prompt, style, size)
    if (result) return result
  }

  throw new Error('All image providers failed')
}

// ─── Detect Style from Prompt ────────────────────────────────────────────────
export function detectImageStyle(prompt: string): ImageStyle {
  const lower = prompt.toLowerCase()

  // UI/GUI detection (→ GPT)
  if (lower.includes('ui') || lower.includes('gui') || lower.includes('interface') || lower.includes('screen'))
    return 'ui-mockup'
  if (lower.includes('menu') || lower.includes('main menu') || lower.includes('pause menu'))
    return 'game-menu'
  if (lower.includes('hud') || lower.includes('health bar') || lower.includes('stamina') || lower.includes('minimap'))
    return 'hud-design'
  if (lower.includes('shop') || lower.includes('store') || lower.includes('buy'))
    return 'shop-ui'
  if (lower.includes('inventory') || lower.includes('backpack') || lower.includes('slots'))
    return 'inventory-ui'
  if (lower.includes('loading') || lower.includes('splash'))
    return 'loading-screen'
  if (lower.includes('badge') || lower.includes('achievement'))
    return 'badge'
  if (lower.includes('logo') || lower.includes('wordmark') || lower.includes('title'))
    return 'logo'

  // Game art detection
  if (lower.includes('icon'))
    return 'roblox-icon'
  if (lower.includes('thumbnail') || lower.includes('cover'))
    return 'game-thumbnail'
  if (lower.includes('character') || lower.includes('avatar') || lower.includes('skin'))
    return 'character-design'
  if (lower.includes('weapon') || lower.includes('sword') || lower.includes('gun'))
    return 'weapon-design'
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('boat'))
    return 'vehicle-design'
  if (lower.includes('concept') || lower.includes('art'))
    return 'concept-art'
  if (lower.includes('environment') || lower.includes('landscape') || lower.includes('scene'))
    return 'environment'
  if (lower.includes('texture') || lower.includes('material') || lower.includes('tileable'))
    return 'texture'
  if (lower.includes('pixel'))
    return 'pixel-art'
  if (lower.includes('anime') || lower.includes('manga'))
    return 'anime'
  if (lower.includes('3d') || lower.includes('render'))
    return '3d-render'
  if (lower.includes('realistic') || lower.includes('photo'))
    return 'realistic'
  if (lower.includes('nano') || lower.includes('figurine'))
    return 'nano-banana'
  if (lower.includes('effect') || lower.includes('particle') || lower.includes('spell'))
    return 'effect'

  return 'cartoon'
}

export { STYLE_PROMPTS, STYLE_PROVIDER_MAP }
