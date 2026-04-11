/**
 * Icon Studio preset library — 30+ opinionated Roblox game icon styles.
 *
 * These presets power the Icon Studio product, a specialised counterpart to
 * the generic /api/ai/image pipeline. Each preset ships a full prompt
 * template, negative prompt, dominant colour palette, and FAL model hints
 * tuned specifically for 512x512 Roblox game library icons.
 *
 * Presets are split across six categories — character, logo, object, face,
 * abstract, and mascot — each with at least five entries so the studio can
 * showcase a rich gallery from day one.
 */

export type IconCategory =
  | 'character'
  | 'logo'
  | 'object'
  | 'face'
  | 'abstract'
  | 'mascot'

export type IconComposition = 'centered' | 'asymmetric' | 'rule-of-thirds'

export type IconBackground = 'gradient' | 'solid' | 'transparent' | 'scene'

export type IconFalModel = 'flux-pro' | 'flux-schnell' | 'flux-dev'

export type IconQualityTier = 'fast' | 'balanced' | 'high'

export interface IconPreset {
  /** Stable identifier — used as the API key and persisted alongside assets. */
  id: string
  /** Human-readable name for the preset card. */
  name: string
  /** Short description shown beneath the preset title. */
  description: string
  /** Category tab the preset lives under. */
  category: IconCategory
  /** FAL prompt prefix — appended before the user's prompt. */
  prompt: string
  /** Negative prompt — things the model should actively avoid. */
  negativePrompt: string
  /** Dominant hex colours that should appear in the final icon. */
  colorPalette: string[]
  /** Composition rule used when describing placement of the subject. */
  composition: IconComposition
  /** Background treatment — drives optional birefnet background removal. */
  background: IconBackground
  /** Recommended FAL FLUX variant. */
  recommendedFalModel: IconFalModel
  /** Quality tier used for cost + steps selection. */
  qualityTier: IconQualityTier
}

// ─── Character icons ────────────────────────────────────────────────────────

const CHARACTER_PRESETS: readonly IconPreset[] = [
  {
    id: 'character-anime-hero',
    name: 'Anime Hero',
    description: 'High-contrast anime protagonist with dynamic lighting.',
    category: 'character',
    prompt:
      'roblox game icon, anime hero character, dynamic action pose, cel shaded, dramatic rim light, sharp facial features, vibrant hair, centered composition, 512x512, app store quality, bold outlines',
    negativePrompt:
      'blurry, text, watermark, extra limbs, ugly, lowres, jpeg artifacts, realistic photography',
    colorPalette: ['#ff3366', '#2b0fff', '#ffd166', '#0a0a23'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
  {
    id: 'character-chibi-mascot',
    name: 'Chibi Mascot',
    description: 'Adorable oversized-head chibi character.',
    category: 'character',
    prompt:
      'roblox game icon, chibi style character, oversized head, tiny body, sparkly eyes, ultra cute, soft pastel shading, centered, 512x512, sticker-like, clean outlines',
    negativePrompt:
      'gore, scary, photorealistic, text, watermark, blurry, extra fingers',
    colorPalette: ['#ffafcc', '#a0c4ff', '#fffaa0', '#ffffff'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'character-pixel-hero',
    name: 'Pixel Hero',
    description: 'Retro 16-bit pixel art hero sprite.',
    category: 'character',
    prompt:
      'roblox game icon, 16 bit pixel art hero, crisp pixel edges, limited palette, retro jrpg protagonist, front facing pose, centered, 512x512, no anti aliasing, clean pixels',
    negativePrompt:
      'smooth gradients, blurry, photorealistic, watermark, text, 3d render',
    colorPalette: ['#1a1c2c', '#5d275d', '#ef7d57', '#ffcd75'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
  {
    id: 'character-lowpoly-hero',
    name: 'Low-Poly Hero',
    description: 'Faceted low-poly character in dramatic pose.',
    category: 'character',
    prompt:
      'roblox game icon, low poly 3d hero character, flat shaded triangular faces, faceted geometry, dramatic studio lighting, centered, 512x512, geometric minimalism',
    negativePrompt:
      'smooth subdivision, photorealistic, blurry, text, watermark, noise',
    colorPalette: ['#2ec4b6', '#ff9f1c', '#e71d36', '#011627'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'character-blocky',
    name: 'Blocky Character',
    description: 'Classic Roblox blocky avatar style.',
    category: 'character',
    prompt:
      'roblox game icon, classic blocky roblox avatar, boxy limbs, bright primary colours, action pose, studio lighting, centered, 512x512, roblox-authentic',
    negativePrompt:
      'realistic body, text, watermark, blurry, low quality, extra limbs',
    colorPalette: ['#e63946', '#f1c40f', '#2a9d8f', '#264653'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'character-cyberpunk',
    name: 'Cyberpunk Character',
    description: 'Neon-lit cyberpunk warrior with tech details.',
    category: 'character',
    prompt:
      'roblox game icon, cyberpunk character with neon tech armour, rim lighting, glowing cybernetic details, rain-slick urban backdrop, centered, 512x512, synthwave palette',
    negativePrompt:
      'bright daylight, text, watermark, blurry, low quality, boring pose',
    colorPalette: ['#ff00a0', '#00e5ff', '#1b0030', '#7a00ff'],
    composition: 'asymmetric',
    background: 'scene',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
]

// ─── Logo icons ─────────────────────────────────────────────────────────────

const LOGO_PRESETS: readonly IconPreset[] = [
  {
    id: 'logo-bold-text',
    name: 'Bold Text Logo',
    description: 'Thick extruded 3D text logo with shine.',
    category: 'logo',
    prompt:
      'roblox game icon, bold extruded 3d text logo, thick chunky letters, shiny bevel, metallic highlight, centered, 512x512, app store ready',
    negativePrompt:
      'thin letters, blurry, lowres, watermark, misspelled text, unreadable',
    colorPalette: ['#ffdd00', '#ff6a00', '#101010', '#ffffff'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
  {
    id: 'logo-emblem',
    name: 'Circular Emblem',
    description: 'Symmetric circular emblem with iconography.',
    category: 'logo',
    prompt:
      'roblox game icon, circular emblem badge, symmetric design, central iconography, ornate border, crisp edges, centered, 512x512',
    negativePrompt:
      'asymmetric, messy, blurry, watermark, text clutter, low quality',
    colorPalette: ['#b8860b', '#1e3a8a', '#ffffff', '#2b1a0e'],
    composition: 'centered',
    background: 'transparent',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'logo-shield-crest',
    name: 'Shield Crest',
    description: 'Medieval-style shield crest with bold heraldry.',
    category: 'logo',
    prompt:
      'roblox game icon, medieval shield crest, heraldic design, gold and red, bold charges, centered, 512x512, fantasy game branding',
    negativePrompt:
      'modern style, blurry, watermark, text, lowres, asymmetric mess',
    colorPalette: ['#b22222', '#ffd700', '#2b1a0e', '#ffffff'],
    composition: 'centered',
    background: 'transparent',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'logo-ribbon-banner',
    name: 'Ribbon Banner',
    description: 'Curved ribbon banner wrapping a central icon.',
    category: 'logo',
    prompt:
      'roblox game icon, ornate ribbon banner wrapping central emblem, rich gradient, award-style, centered, 512x512, crisp vector-like finish',
    negativePrompt:
      'flat paper, blurry, watermark, text misspelled, cluttered',
    colorPalette: ['#c81d25', '#f2e394', '#1e293b', '#ffffff'],
    composition: 'centered',
    background: 'transparent',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'logo-neon-sign',
    name: 'Neon Sign',
    description: 'Glowing neon tube sign against dark wall.',
    category: 'logo',
    prompt:
      'roblox game icon, glowing neon tube sign, saturated glow, dark brick wall backdrop, centered, 512x512, 80s aesthetic',
    negativePrompt:
      'daylight, muted, blurry, text unreadable, watermark, lowres',
    colorPalette: ['#ff00ff', '#00ffff', '#0a0014', '#ffffff'],
    composition: 'centered',
    background: 'scene',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
]

// ─── Object icons ──────────────────────────────────────────────────────────

const OBJECT_PRESETS: readonly IconPreset[] = [
  {
    id: 'object-glowing-weapon',
    name: 'Glowing Weapon',
    description: 'Fantasy weapon crackling with magical energy.',
    category: 'object',
    prompt:
      'roblox game icon, glowing fantasy weapon, magical energy effects, dramatic rim light, dark moody background, centered, 512x512, loot-drop style',
    negativePrompt:
      'dull, blurry, watermark, text, cluttered, extra weapons',
    colorPalette: ['#00e5ff', '#ffdd00', '#1a0030', '#ffffff'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
  {
    id: 'object-magic-crystal',
    name: 'Magic Crystal',
    description: 'Faceted magical crystal with inner glow.',
    category: 'object',
    prompt:
      'roblox game icon, faceted magic crystal with inner glow, refractive facets, sparkles, centered, 512x512, premium loot item',
    negativePrompt:
      'dull rock, blurry, watermark, text, lowres, extra clutter',
    colorPalette: ['#8a2be2', '#00ffff', '#ffffff', '#0a0014'],
    composition: 'centered',
    background: 'transparent',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'object-treasure-chest',
    name: 'Treasure Chest',
    description: 'Overflowing wooden treasure chest spilling gold.',
    category: 'object',
    prompt:
      'roblox game icon, wooden treasure chest overflowing with gold coins and gems, warm glow, centered, 512x512, loot-drop hero shot',
    negativePrompt:
      'empty, blurry, watermark, text, lowres, ugly',
    colorPalette: ['#8b4513', '#ffd700', '#ff3366', '#ffffff'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'object-vehicle',
    name: 'Stylised Vehicle',
    description: 'Hero-shot stylised game vehicle.',
    category: 'object',
    prompt:
      'roblox game icon, stylised cartoon vehicle hero shot, exaggerated proportions, motion blur streaks, centered, 512x512, toy-like finish',
    negativePrompt:
      'realistic photo, blurry, watermark, text, lowres, boring angle',
    colorPalette: ['#ff4500', '#1e90ff', '#f5f5f5', '#101010'],
    composition: 'asymmetric',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'object-item-icon',
    name: 'Inventory Item',
    description: 'Clean flat inventory item icon on neutral backdrop.',
    category: 'object',
    prompt:
      'roblox game icon, clean flat inventory item, crisp outline, single subject, centered, 512x512, ui-ready asset',
    negativePrompt:
      'messy, multiple items, blurry, watermark, text, noisy background',
    colorPalette: ['#f4f4f5', '#18181b', '#2563eb', '#ef4444'],
    composition: 'centered',
    background: 'transparent',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
]

// ─── Face icons ────────────────────────────────────────────────────────────

const FACE_PRESETS: readonly IconPreset[] = [
  {
    id: 'face-smug',
    name: 'Smug Expression',
    description: 'Iconic smug face, viral-ready.',
    category: 'face',
    prompt:
      'roblox game icon, ultra smug character face close up, one raised eyebrow, smirk, exaggerated expression, vibrant, centered, 512x512, meme-worthy',
    negativePrompt:
      'neutral face, blurry, watermark, text, lowres, realistic photo',
    colorPalette: ['#ffd166', '#ef476f', '#06d6a0', '#073b4c'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'face-action-hero',
    name: 'Action Hero',
    description: 'Determined action-hero face with intense eyes.',
    category: 'face',
    prompt:
      'roblox game icon, determined action hero face close up, intense eyes, jawline lit by rim light, centered, 512x512, blockbuster poster style',
    negativePrompt:
      'bored, blurry, watermark, text, lowres, extra faces',
    colorPalette: ['#e63946', '#1d3557', '#f1faee', '#a8dadc'],
    composition: 'centered',
    background: 'scene',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
  {
    id: 'face-cute-big-eyes',
    name: 'Cute Big Eyes',
    description: 'Adorable face with huge sparkling eyes.',
    category: 'face',
    prompt:
      'roblox game icon, ultra cute face with huge sparkling eyes, blushing cheeks, soft pastel lighting, centered, 512x512, kid-friendly',
    negativePrompt:
      'scary, realistic photo, blurry, watermark, text, lowres',
    colorPalette: ['#ffafcc', '#bde0fe', '#fff3b0', '#ffffff'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'face-evil-villain',
    name: 'Evil Villain',
    description: 'Sinister villain face with glowing red eyes.',
    category: 'face',
    prompt:
      'roblox game icon, sinister villain face close up, glowing red eyes, dramatic under-lighting, dark background, centered, 512x512, spooky but stylised',
    negativePrompt:
      'friendly, blurry, watermark, text, lowres, gore, realistic photo',
    colorPalette: ['#b91c1c', '#0a0a0a', '#f59e0b', '#ffffff'],
    composition: 'centered',
    background: 'scene',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'high',
  },
  {
    id: 'face-surprised',
    name: 'Surprised Face',
    description: 'Over-the-top shocked face with O-mouth.',
    category: 'face',
    prompt:
      'roblox game icon, over the top surprised face, wide open O mouth, wide eyes, exclamation mark above head, centered, 512x512, meme-worthy',
    negativePrompt:
      'calm, blurry, watermark, text distorted, lowres',
    colorPalette: ['#fbbf24', '#ef4444', '#1e293b', '#ffffff'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
]

// ─── Abstract icons ────────────────────────────────────────────────────────

const ABSTRACT_PRESETS: readonly IconPreset[] = [
  {
    id: 'abstract-gradient-burst',
    name: 'Gradient Burst',
    description: 'Explosive radial gradient burst.',
    category: 'abstract',
    prompt:
      'roblox game icon, explosive radial gradient burst, vibrant saturated colours, dynamic rays, centered, 512x512, abstract hype energy',
    negativePrompt:
      'flat dull, blurry, watermark, text, lowres, muted',
    colorPalette: ['#ff6a00', '#ffd700', '#ff007a', '#ffffff'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
  {
    id: 'abstract-light-beam',
    name: 'Light Beam',
    description: 'Dramatic light beams piercing darkness.',
    category: 'abstract',
    prompt:
      'roblox game icon, dramatic light beams piercing through darkness, volumetric rays, lens flare, centered, 512x512, epic cinematic',
    negativePrompt:
      'flat, blurry, watermark, text, lowres, dim',
    colorPalette: ['#ffffff', '#fde047', '#0c0a09', '#f59e0b'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'abstract-geometric',
    name: 'Geometric Pattern',
    description: 'Bold geometric shapes in a stylised composition.',
    category: 'abstract',
    prompt:
      'roblox game icon, bold geometric shapes composition, flat colours, sharp edges, rule of thirds, centered, 512x512, poster-style',
    negativePrompt:
      'organic shapes, blurry, watermark, text, lowres',
    colorPalette: ['#ff006e', '#8338ec', '#3a86ff', '#ffbe0b'],
    composition: 'rule-of-thirds',
    background: 'solid',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
  {
    id: 'abstract-particle-swirl',
    name: 'Particle Swirl',
    description: 'Swirling magical particle vortex.',
    category: 'abstract',
    prompt:
      'roblox game icon, swirling magical particle vortex, glowing motes, depth, centered, 512x512, ethereal energy',
    negativePrompt:
      'static, dull, blurry, watermark, text, lowres',
    colorPalette: ['#7c3aed', '#22d3ee', '#f472b6', '#0f172a'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'abstract-glitch',
    name: 'Glitch Aesthetic',
    description: 'RGB split glitch art with scanlines.',
    category: 'abstract',
    prompt:
      'roblox game icon, glitch art aesthetic, rgb split, scanlines, datamoshed, centered, 512x512, edgy cyber vibe',
    negativePrompt:
      'clean, blurry, watermark, text unreadable, lowres',
    colorPalette: ['#ff0040', '#00ffe1', '#0a0a0a', '#ffffff'],
    composition: 'asymmetric',
    background: 'solid',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
]

// ─── Mascot icons ──────────────────────────────────────────────────────────

const MASCOT_PRESETS: readonly IconPreset[] = [
  {
    id: 'mascot-animal',
    name: 'Animal Mascot',
    description: 'Friendly cartoon animal mascot.',
    category: 'mascot',
    prompt:
      'roblox game icon, friendly cartoon animal mascot, big expressive eyes, thumbs up pose, bright colours, centered, 512x512, brand mascot quality',
    negativePrompt:
      'scary, realistic photo, blurry, watermark, text, lowres',
    colorPalette: ['#f97316', '#facc15', '#ffffff', '#1e293b'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'mascot-monster',
    name: 'Monster Mascot',
    description: 'Cute cartoon monster mascot with fangs.',
    category: 'mascot',
    prompt:
      'roblox game icon, cute cartoon monster mascot, little fangs, big eyes, fluffy body, centered, 512x512, sticker-ready',
    negativePrompt:
      'terrifying, realistic, blurry, watermark, text, lowres',
    colorPalette: ['#a855f7', '#22d3ee', '#facc15', '#ffffff'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'mascot-food',
    name: 'Food Mascot',
    description: 'Anthropomorphic food character with arms and legs.',
    category: 'mascot',
    prompt:
      'roblox game icon, anthropomorphic food character, arms and legs, cheerful face, centered, 512x512, brand mascot',
    negativePrompt:
      'uncooked realistic photo, blurry, watermark, text, lowres',
    colorPalette: ['#ef4444', '#fde047', '#fff7ed', '#1e293b'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'mascot-bot',
    name: 'Robot Mascot',
    description: 'Chunky friendly robot mascot.',
    category: 'mascot',
    prompt:
      'roblox game icon, chunky friendly robot mascot, glowing visor eyes, round body, centered, 512x512, tech brand mascot',
    negativePrompt:
      'evil terminator, blurry, watermark, text, lowres, scary',
    colorPalette: ['#3b82f6', '#e5e7eb', '#f59e0b', '#0f172a'],
    composition: 'centered',
    background: 'gradient',
    recommendedFalModel: 'flux-pro',
    qualityTier: 'balanced',
  },
  {
    id: 'mascot-slime',
    name: 'Slime Mascot',
    description: 'Gelatinous slime with googly eyes.',
    category: 'mascot',
    prompt:
      'roblox game icon, gelatinous slime mascot, googly eyes, glossy highlight, jiggly silhouette, centered, 512x512, sticker-ready',
    negativePrompt:
      'realistic gore, blurry, watermark, text, lowres',
    colorPalette: ['#22c55e', '#a7f3d0', '#ffffff', '#064e3b'],
    composition: 'centered',
    background: 'solid',
    recommendedFalModel: 'flux-schnell',
    qualityTier: 'fast',
  },
]

// ─── Exports ───────────────────────────────────────────────────────────────

/** The complete catalogue, ordered category-by-category. */
export const ICON_PRESETS: readonly IconPreset[] = [
  ...CHARACTER_PRESETS,
  ...LOGO_PRESETS,
  ...OBJECT_PRESETS,
  ...FACE_PRESETS,
  ...ABSTRACT_PRESETS,
  ...MASCOT_PRESETS,
]

/** Lookup map by id — O(1) preset resolution. */
export const ICON_PRESETS_BY_ID: Readonly<Record<string, IconPreset>> =
  Object.freeze(
    Object.fromEntries(ICON_PRESETS.map((p) => [p.id, p])),
  )

/** Convenience — the list of all valid preset ids, typed for Zod enum. */
export const ICON_PRESET_IDS = ICON_PRESETS.map((p) => p.id) as [
  string,
  ...string[],
]

/** Group presets by category — used by the UI for tabbed navigation. */
export function getPresetsByCategory(): Record<IconCategory, IconPreset[]> {
  const grouped: Record<IconCategory, IconPreset[]> = {
    character: [],
    logo: [],
    object: [],
    face: [],
    abstract: [],
    mascot: [],
  }
  for (const preset of ICON_PRESETS) {
    grouped[preset.category].push(preset)
  }
  return grouped
}

/** Look up a preset by id with a typed fallback. Throws if not found. */
export function getIconPreset(id: string): IconPreset {
  const preset = ICON_PRESETS_BY_ID[id]
  if (!preset) {
    throw new Error(`Unknown icon preset id: ${id}`)
  }
  return preset
}

/** Map the abstract quality tier to FLUX inference step budget. */
export function stepsForTier(tier: IconQualityTier): number {
  switch (tier) {
    case 'fast':
      return 16
    case 'balanced':
      return 28
    case 'high':
      return 40
  }
}

/** Map the abstract quality tier to FLUX guidance scale. */
export function guidanceForTier(tier: IconQualityTier): number {
  switch (tier) {
    case 'fast':
      return 6.5
    case 'balanced':
      return 7.5
    case 'high':
      return 8.5
  }
}

/** Resolve the FAL model path for a given preset's recommended model. */
export function falModelPath(model: IconFalModel): string {
  switch (model) {
    case 'flux-pro':
      return 'fal-ai/flux-pro/v1.1'
    case 'flux-schnell':
      return 'fal-ai/flux/schnell'
    case 'flux-dev':
      return 'fal-ai/flux/dev'
  }
}
