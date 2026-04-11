/**
 * mesh-templates.ts
 *
 * Prompt templates for Meshy text-to-3D and image-to-3D generation.
 *
 * Meshy responds best to prompts that are ~25-60 words, start with the
 * subject, state material/color explicitly, specify style, and include
 * concrete reference words (e.g. "low-poly", "hand-painted", "PBR").
 *
 * Each template adds a theme flavor to the user's short asset description
 * so the final mesh matches the active ForjeGames theme.
 */

export type MeshStyle =
  | 'realistic'
  | 'stylized'
  | 'low-poly'
  | 'cartoon'
  | 'voxel'
  | 'hand-painted'
  | 'pbr'

export interface MeshTemplate {
  /** Stable id. */
  id: string
  /** Human label. */
  name: string
  /** Prefix/suffix wrapper applied to the user's subject description. */
  wrap(subject: string): string
  /** Recommended negative prompt for Meshy. */
  negativePrompt: string
  /** Recommended Meshy settings. */
  settings: {
    artStyle: MeshStyle
    targetPolycount: number
    topology: 'quad' | 'triangle'
    symmetry: 'off' | 'auto' | 'on'
    shouldRemesh: boolean
  }
}

const BASE_NEGATIVE =
  'blurry, low-quality, deformed, distorted, extra limbs, text, watermark, signature, noisy, flat shading, missing parts, incomplete, ugly, low-detail'

export const MESH_TEMPLATES: Record<string, MeshTemplate> = {
  'medieval-prop': {
    id: 'medieval-prop',
    name: 'Medieval prop (hand-painted, low-poly)',
    wrap: (subject) =>
      `A hand-painted low-poly medieval ${subject}, stylized Warcraft art direction, chunky silhouette, warm earth tones (brown, slate, gold), visible brushstroke texture, 3/4 hero pose, neutral lighting, isolated on plain background`,
    negativePrompt: BASE_NEGATIVE + ', photorealistic, sci-fi, neon, chrome, modern',
    settings: { artStyle: 'hand-painted', targetPolycount: 8000, topology: 'quad', symmetry: 'auto', shouldRemesh: true },
  },

  'dark-fantasy-prop': {
    id: 'dark-fantasy-prop',
    name: 'Dark fantasy prop (gothic, weathered)',
    wrap: (subject) =>
      `A gothic weathered ${subject}, Dark Souls / Bloodborne inspired, ornate tarnished metalwork, cracked stone, desaturated palette (slate grey, blood red, tarnished gold), dramatic rim lighting, isolated 3/4 view`,
    negativePrompt: BASE_NEGATIVE + ', bright colors, cheerful, cartoonish, clean',
    settings: { artStyle: 'pbr', targetPolycount: 12000, topology: 'quad', symmetry: 'auto', shouldRemesh: true },
  },

  'sci-fi-prop': {
    id: 'sci-fi-prop',
    name: 'Sci-fi prop (clean PBR, greebled)',
    wrap: (subject) =>
      `A clean sci-fi ${subject}, hard-surface modeling, visible panel seams and greebles, brushed metal and matte plastic, cyan and white accent lights, Mass Effect / Halo aesthetic, isolated on plain background, 3/4 view`,
    negativePrompt: BASE_NEGATIVE + ', rusted, wooden, medieval, organic, hand-painted',
    settings: { artStyle: 'pbr', targetPolycount: 15000, topology: 'quad', symmetry: 'on', shouldRemesh: true },
  },

  'cyberpunk-prop': {
    id: 'cyberpunk-prop',
    name: 'Cyberpunk prop (neon, grime)',
    wrap: (subject) =>
      `A cyberpunk ${subject}, Blade Runner / Cyberpunk 2077 inspired, neon pink and cyan accent lights, grimy textured surfaces, exposed wires and vents, wet-look reflections, 3/4 hero pose, dark background`,
    negativePrompt: BASE_NEGATIVE + ', clean, rural, medieval, daylight',
    settings: { artStyle: 'pbr', targetPolycount: 12000, topology: 'quad', symmetry: 'off', shouldRemesh: true },
  },

  'low-poly-prop': {
    id: 'low-poly-prop',
    name: 'Low-poly prop (faceted, flat color)',
    wrap: (subject) =>
      `A low-poly ${subject}, faceted geometric shapes, flat solid colors, no textures, minimalist style, Firewatch / Monument Valley aesthetic, isolated on plain background, 3/4 view`,
    negativePrompt: BASE_NEGATIVE + ', high-poly, photorealistic, detailed textures',
    settings: { artStyle: 'low-poly', targetPolycount: 2500, topology: 'quad', symmetry: 'auto', shouldRemesh: true },
  },

  'cartoon-character': {
    id: 'cartoon-character',
    name: 'Cartoon character (chibi, Roblox-friendly)',
    wrap: (subject) =>
      `A cute cartoon chibi ${subject}, Roblox-style proportions, large head, simple colorful outfit, friendly expression, T-pose, clean background, soft lighting`,
    negativePrompt: BASE_NEGATIVE + ', realistic, scary, weapons, blood, NSFW',
    settings: { artStyle: 'cartoon', targetPolycount: 10000, topology: 'quad', symmetry: 'on', shouldRemesh: true },
  },

  'realistic-prop': {
    id: 'realistic-prop',
    name: 'Realistic prop (PBR)',
    wrap: (subject) =>
      `A photorealistic ${subject}, PBR materials, accurate proportions, natural lighting, subtle wear and tear, hero product shot, neutral grey background, 3/4 view`,
    negativePrompt: BASE_NEGATIVE + ', cartoon, stylized, flat shading, low-poly',
    settings: { artStyle: 'realistic', targetPolycount: 20000, topology: 'quad', symmetry: 'auto', shouldRemesh: true },
  },

  'voxel-prop': {
    id: 'voxel-prop',
    name: 'Voxel prop (Minecraft style)',
    wrap: (subject) =>
      `A voxel ${subject}, Minecraft / Crossy Road aesthetic, blocky cubic construction, bright saturated palette, no anti-aliasing, isolated on plain background, 3/4 view`,
    negativePrompt: BASE_NEGATIVE + ', smooth, realistic, curved surfaces',
    settings: { artStyle: 'voxel', targetPolycount: 4000, topology: 'quad', symmetry: 'auto', shouldRemesh: false },
  },
}

/**
 * Match a free-text theme hint to the best Meshy template.
 */
export function resolveMeshTemplate(themeHint: string | undefined, subject: string): { template: MeshTemplate; prompt: string } {
  const hint = (themeHint ?? '').toLowerCase()
  let template: MeshTemplate
  if (hint.includes('dark') || hint.includes('gothic')) template = MESH_TEMPLATES['dark-fantasy-prop']!
  else if (hint.includes('cyber') || hint.includes('neon')) template = MESH_TEMPLATES['cyberpunk-prop']!
  else if (hint.includes('sci') || hint.includes('space') || hint.includes('futur')) template = MESH_TEMPLATES['sci-fi-prop']!
  else if (hint.includes('medieval') || hint.includes('fantasy') || hint.includes('castle')) template = MESH_TEMPLATES['medieval-prop']!
  else if (hint.includes('low-poly') || hint.includes('lowpoly')) template = MESH_TEMPLATES['low-poly-prop']!
  else if (hint.includes('voxel') || hint.includes('minecraft')) template = MESH_TEMPLATES['voxel-prop']!
  else if (hint.includes('cartoon') || hint.includes('chibi')) template = MESH_TEMPLATES['cartoon-character']!
  else if (hint.includes('realistic') || hint.includes('pbr')) template = MESH_TEMPLATES['realistic-prop']!
  else template = MESH_TEMPLATES['low-poly-prop']!

  return {
    template,
    prompt: template.wrap(subject.trim()),
  }
}
