/**
 * Image generation style presets for the /api/ai/image pipeline.
 *
 * Each preset injects specific prompt modifiers, image size, and guidance
 * scale tuned for the target output type. These 12 presets compete with
 * BloxToolkit's style system while being optimised for Roblox game assets.
 */

export interface ImageStylePreset {
  /** Human-readable display name. */
  name: string
  /** Prompt text appended to the user's prompt to steer the model. */
  promptSuffix: string
  /** Fal image_size preset string (used by FLUX). */
  size: 'square_hd' | 'square' | 'landscape_16_9' | 'landscape_4_3' | 'portrait_16_9' | 'portrait_4_3'
  /** CFG guidance scale — higher = more prompt adherence. */
  guidance: number
  /** Number of inference steps. */
  steps: number
  /** Default pixel dimensions when size is resolved to exact values. */
  defaultDimensions: { width: number; height: number }
}

export const IMAGE_STYLES: Record<string, ImageStylePreset> = {
  'roblox-icon': {
    name: 'Roblox Icon',
    promptSuffix:
      'Roblox game icon, vibrant colors, centered subject, clean background, suitable for 512x512, bold and eye-catching, app store quality',
    size: 'square_hd',
    guidance: 7.5,
    steps: 30,
    defaultDimensions: { width: 512, height: 512 },
  },
  'game-thumbnail': {
    name: 'Game Thumbnail',
    promptSuffix:
      'Roblox game thumbnail, widescreen cinematic composition, dynamic action scene, vibrant lighting, 16:9 aspect ratio, promotional quality',
    size: 'landscape_16_9',
    guidance: 7.5,
    steps: 30,
    defaultDimensions: { width: 1920, height: 1080 },
  },
  'ui-element': {
    name: 'UI Element',
    promptSuffix:
      'clean UI element, flat design, transparent-ready, crisp edges, game interface asset, minimal detail, scalable vector style',
    size: 'square_hd',
    guidance: 8.0,
    steps: 25,
    defaultDimensions: { width: 512, height: 512 },
  },
  'gfx-render': {
    name: 'GFX Render',
    promptSuffix:
      'Roblox character GFX render, studio lighting, dynamic pose, 3D render quality, depth of field, dramatic composition, high detail',
    size: 'square_hd',
    guidance: 7.0,
    steps: 30,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  cinematic: {
    name: 'Cinematic',
    promptSuffix:
      'cinematic lighting, dramatic shadows, volumetric rays, 8K quality, photorealistic, film grain, anamorphic lens flare',
    size: 'landscape_16_9',
    guidance: 7.0,
    steps: 30,
    defaultDimensions: { width: 1920, height: 1080 },
  },
  neon: {
    name: 'Neon',
    promptSuffix:
      'neon glow, cyberpunk colors, dark background, vibrant purple and cyan, glowing edges, electric atmosphere, synthwave',
    size: 'square_hd',
    guidance: 7.5,
    steps: 28,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  horror: {
    name: 'Horror',
    promptSuffix:
      'dark atmosphere, eerie lighting, muted desaturated colors, dense fog, horror aesthetic, ominous shadows, unsettling mood',
    size: 'landscape_16_9',
    guidance: 7.0,
    steps: 30,
    defaultDimensions: { width: 1920, height: 1080 },
  },
  anime: {
    name: 'Anime',
    promptSuffix:
      'anime art style, cel shading, vibrant colors, manga-inspired, clean line art, expressive, Japanese animation quality',
    size: 'square_hd',
    guidance: 7.5,
    steps: 28,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  'pixel-art': {
    name: 'Pixel Art',
    promptSuffix:
      'pixel art style, retro 8-bit aesthetic, limited color palette, blocky pixels, crisp edges, nostalgic game art',
    size: 'square',
    guidance: 8.0,
    steps: 25,
    defaultDimensions: { width: 512, height: 512 },
  },
  realistic: {
    name: 'Realistic',
    promptSuffix:
      'photorealistic, highly detailed textures, natural lighting, accurate proportions, DSLR quality, sharp focus, high dynamic range',
    size: 'square_hd',
    guidance: 6.5,
    steps: 30,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  cartoon: {
    name: 'Cartoon',
    promptSuffix:
      'bright saturated colors, bold outlines, cartoon style, playful, Roblox-appropriate, kid-friendly, smooth shading',
    size: 'square_hd',
    guidance: 7.5,
    steps: 28,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  'low-poly': {
    name: 'Low Poly',
    promptSuffix:
      'low polygon count, flat shading, geometric shapes, minimalist 3D render, faceted surfaces, clean edges, isometric feel',
    size: 'square_hd',
    guidance: 7.5,
    steps: 25,
    defaultDimensions: { width: 1024, height: 1024 },
  },
  clothing: {
    name: 'Clothing',
    promptSuffix:
      'Roblox classic clothing template, flat UV layout, seamless tileable design, shirt or pants template, 585x559 Roblox clothing dimensions, clean edges, no background',
    size: 'square',
    guidance: 8.0,
    steps: 28,
    defaultDimensions: { width: 585, height: 559 },
  },
} as const

/** All valid style keys, useful for Zod enum validation. */
export const IMAGE_STYLE_KEYS = Object.keys(IMAGE_STYLES) as [string, ...string[]]

/** Look up a style preset with a fallback. */
export function getImageStyle(key: string): ImageStylePreset {
  return IMAGE_STYLES[key] ?? IMAGE_STYLES['roblox-icon']
}
