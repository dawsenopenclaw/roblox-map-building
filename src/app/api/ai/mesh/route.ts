/**
 * POST /api/ai/mesh
 *
 * Generates a real 3D mesh from a text prompt using Meshy AI,
 * with matching PBR textures from Fal AI in parallel.
 *
 * Body:
 *   { prompt: string; quality?: "draft"|"standard"|"premium"; withTextures?: boolean }
 *
 * Returns:
 *   {
 *     meshUrl: string | null        -- GLB download URL
 *     fbxUrl: string | null         -- FBX download URL
 *     thumbnailUrl: string | null
 *     videoUrl: string | null
 *     polygonCount: number | null
 *     textures: { albedo, normal, roughness } | null
 *     luauCode: string              -- ready-to-paste MeshPart script
 *     costEstimateUsd: number
 *     actualCostUsd: number
 *     status: "complete"|"pending"|"demo"
 *     taskId?: string
 *   }
 *
 * GET /api/ai/mesh?taskId=xxx
 *   Poll for status of an async Meshy task
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { meshGenerateSchema, parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import {
  downloadAndUpload,
  downloadAndUploadTexture,
  type UploadAssetResult,
} from '@/lib/roblox-asset-upload'
import {
  enhanceMeshPromptWithGameKnowledge,
  detectTheme,
  GAME_THEMES,
} from '@/lib/ai/game-knowledge'

export const maxDuration = 60

// ── Types ────────────────────────────────────────────────────────────────────

type Quality = 'draft' | 'standard' | 'premium'

type AssetCategory =
  | 'character'
  | 'building'
  | 'weapon'
  | 'vehicle'
  | 'prop'
  | 'furniture'
  | 'environment'
  | 'default'

// postBodySchema lives in @/lib/validations — see meshGenerateSchema

interface MeshyTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  model_urls?: { glb?: string; fbx?: string; usdz?: string; obj?: string }
  thumbnail_url?: string
  video_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

interface FalQueueResponse {
  request_id: string
  response_url: string
  status_url: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalTextureOutput {
  albedo?: { url: string }
  normal?: { url: string }
  roughness?: { url: string }
  images?: Array<{ url: string }>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'
const FAL_QUEUE_BASE = 'https://queue.fal.run'

// Cost estimates in USD
const COST_MESH: Record<Quality, number> = {
  draft:    0.10,  // preview only
  standard: 0.20,  // preview + refine
  premium:  0.30,  // preview + refine + PBR
}
const COST_TEXTURE = 0.08  // Fal PBR texture set

// Professional quality-specific polygon targets — tuned for Roblox
// Higher poly counts = more geometric detail = better looking models.
// Roblox can handle 20K+ polys per MeshPart with LOD enabled.
const POLY_TARGETS: Record<Quality, number> = {
  draft:    8000,   // enough for recognizable silhouette + basic surface detail
  standard: 15000,  // good detail — window frames, door handles, panel seams visible
  premium:  25000,  // high detail — individual shingles, rivets, fabric wrinkles
}

// ── Category detection ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<AssetCategory, string[]> = {
  character: [
    'character', 'person', 'human', 'player', 'npc', 'hero', 'villain',
    'warrior', 'soldier', 'knight', 'mage', 'wizard', 'zombie', 'monster',
    'creature', 'alien', 'robot', 'avatar', 'humanoid', 'figure', 'man',
    'woman', 'child', 'guard', 'boss',
  ],
  building: [
    'building', 'house', 'castle', 'tower', 'shop', 'store', 'skyscraper',
    'warehouse', 'barn', 'church', 'temple', 'palace', 'mansion', 'cottage',
    'hut', 'fort', 'fortress', 'dungeon', 'structure', 'architecture',
    'office', 'hospital', 'school', 'library', 'museum',
  ],
  weapon: [
    'weapon', 'sword', 'gun', 'rifle', 'pistol', 'shotgun', 'bow', 'arrow',
    'axe', 'spear', 'staff', 'wand', 'dagger', 'knife', 'hammer', 'mace',
    'crossbow', 'shield', 'cannon', 'blade', 'katana', 'scythe',
  ],
  vehicle: [
    'vehicle', 'car', 'truck', 'bus', 'bike', 'motorcycle', 'plane',
    'airplane', 'helicopter', 'boat', 'ship', 'submarine', 'tank', 'spaceship',
    'rocket', 'train', 'tram', 'ufo', 'drone', 'jeep', 'van', 'ambulance',
  ],
  furniture: [
    'furniture', 'chair', 'table', 'sofa', 'couch', 'desk', 'bed', 'shelf',
    'bookcase', 'cabinet', 'wardrobe', 'dresser', 'stool', 'lamp',
    'bookshelf', 'nightstand', 'ottoman', 'throne',
  ],
  environment: [
    'environment', 'terrain', 'rock', 'tree', 'cliff', 'mountain', 'island',
    'cave', 'ruins', 'bridge', 'path', 'road', 'ground', 'tile', 'platform',
    'pillar', 'column', 'wall', 'floor', 'landscape', 'nature', 'forest',
    'plant', 'bush', 'mushroom', 'crystal', 'gem',
  ],
  prop: [
    'barrel', 'crate', 'box', 'sign', 'lantern', 'torch', 'candle', 'flag',
    'banner', 'trophy', 'clock', 'vase', 'bottle', 'key', 'chest', 'basket',
    'bucket', 'pot', 'cauldron', 'anvil', 'wheel', 'rope', 'chain', 'ladder',
    'fence', 'gate', 'trapdoor', 'lever', 'button', 'orb', 'potion', 'scroll',
    'book', 'map', 'compass', 'telescope', 'crown', 'ring', 'amulet', 'mask',
    'food', 'pizza', 'burger', 'cake', 'fruit', 'bread', 'fish', 'meat',
    'cup', 'plate', 'bowl', 'mug', 'glass', 'goblet', 'pan', 'frying',
    'fire hydrant', 'mailbox', 'trash', 'garbage', 'dumpster', 'hydrant',
    'parking meter', 'bollard', 'cone', 'barrier', 'newspaper', 'phone booth',
    'vending machine', 'atm', 'speaker', 'microphone', 'camera', 'satellite',
    'computer', 'monitor', 'keyboard', 'phone', 'tv', 'television', 'radio',
    'arcade', 'piano', 'guitar', 'drum', 'instrument', 'tool', 'shovel',
    'pickaxe', 'wrench', 'screwdriver', 'toolbox', 'paint', 'easel',
    'tent', 'campfire', 'sleeping bag', 'backpack', 'suitcase', 'bag',
    'flower', 'pot plant', 'potted', 'decoration', 'ornament', 'statue',
    'fountain', 'well', 'lamp post', 'street light', 'traffic light',
    'bench', 'swing', 'slide', 'seesaw', 'trampoline', 'playground',
  ],
  default: [], // fallback
}

function detectAssetCategory(prompt: string): AssetCategory {
  const lower = prompt.toLowerCase()

  // Check high-specificity categories first (character, building, weapon, vehicle,
  // furniture, environment) before the broad 'prop' catch-all.
  const PRIORITY_ORDER: AssetCategory[] = [
    'character', 'building', 'weapon', 'vehicle', 'furniture', 'environment', 'prop',
  ]

  for (const category of PRIORITY_ORDER) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.length > 0 && keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }

  return 'prop'
}

// ── Prompt templates ──────────────────────────────────────────────────────────
// Enhanced with category-specific detail directives that produce stunning 3D assets
// instead of basic geometric shapes.

const PROMPT_TEMPLATES: Record<AssetCategory, string> = {
  character:
    '{prompt}, highly detailed 3D character model, defined facial features, clothing wrinkles and folds, ' +
    'clean T-pose ready for rigging, quad-dominant mesh, proper edge loops at joints, ' +
    'game-ready Roblox proportions, PBR textures with skin detail, 4K resolution',
  building:
    '{prompt}, highly detailed 3D architectural model, visible brick or stone wall texture, ' +
    'window frames with glass panes, door with frame and handle, roof with shingles or tiles, ' +
    'foundation detail, proper floor heights, clean sharp geometry, PBR materials, game-optimized',
  weapon:
    '{prompt}, highly detailed 3D weapon model, polished blade with fuller groove, ' +
    'leather-wrapped grip with visible binding, ornate guard with filigree detail, ' +
    'metal pommel, hard-surface beveled edges, metallic PBR finish, game-ready topology',
  vehicle:
    '{prompt}, highly detailed 3D vehicle model, smooth body panels with door seams, ' +
    'round wheels with tire tread and hubcaps, headlights and taillights, windshield and windows, ' +
    'mirrors, bumpers, exhaust, proper automotive proportions, PBR car paint material, game-ready',
  prop:
    '{prompt}, highly detailed 3D game prop, defined edges and surface detail, wear and patina, ' +
    'functional-looking parts, proper UV mapping, PBR textures with roughness variation, ' +
    'real-world proportions, optimized triangle count, Roblox compatible',
  furniture:
    '{prompt}, highly detailed 3D furniture model, realistic wood grain or fabric texture, ' +
    'visible joinery and hardware, cushion form detail, proper legs and supports, ' +
    'beveled edges, real-world proportions, PBR materials, game-ready mesh',
  environment:
    '{prompt}, highly detailed 3D environment piece, organic natural shapes, bark texture, ' +
    'leaf clusters with depth, moss and weathering, realistic rock surfaces with cracks, ' +
    'proper base, LOD-friendly silhouette, PBR terrain materials',
  default:
    '{prompt}, highly detailed 3D model, clean topology, defined edges, surface detail, ' +
    'proper UV unwrap, PBR materials with roughness and normal maps, game-ready, ' +
    'optimized for real-time rendering, Roblox compatible',
}

// Category-specific negative prompts for better Meshy results
// Truncated to fit Meshy's 200-char negative_prompt limit
const NEGATIVE_PROMPTS: Record<AssetCategory, string> = {
  building:
    'floating parts, holes in walls, missing roof, blurry textures, disconnected geometry, non-manifold, stretched UVs, deformed, ugly, NSFW',
  vehicle:
    'square wheels, floating parts, missing windows, disconnected panels, blurry, distorted proportions, non-manifold, ugly, NSFW, watermark',
  character:
    'extra limbs, fused fingers, deformed face, floating parts, blurry, distorted proportions, non-manifold geometry, ugly, NSFW, watermark',
  weapon:
    'bent blade, floating parts, wrong proportions, blurry textures, non-manifold geometry, stretched UVs, deformed, ugly, NSFW, watermark',
  furniture:
    'floating legs, disconnected parts, wrong proportions, blurry textures, non-manifold, stretched UVs, deformed, ugly, NSFW, watermark',
  environment:
    'floating parts, disconnected mesh, artificial look, blurry textures, non-manifold, inverted normals, stretched UVs, ugly, NSFW, watermark',
  prop:
    'floating parts, disconnected mesh, blurry textures, non-manifold geometry, inverted normals, stretched UVs, deformed, ugly, NSFW, watermark',
  default:
    'low quality, blurry, distorted, floating parts, disconnected mesh, overlapping faces, non-manifold, inverted normals, stretched UVs, NSFW, watermark, deformed',
}

// Fallback default negative prompt
const NEGATIVE_PROMPT =
  'low quality, blurry, distorted, floating parts, disconnected mesh, overlapping faces, non-manifold geometry, inverted normals, stretched UVs, NSFW, watermark, text, deformed, ugly'

// Theme-specific quality directives prepended to the negative prompt.
// Kept short so they fit within Meshy's 200-char negative_prompt limit when combined.
const THEME_NEGATIVE_DIRECTIVES: Record<string, string> = {
  medieval:   'no modern elements, no plastic look, no neon colors',
  futuristic: 'no medieval elements, no wood textures, no rust',
  tropical:   'no dark colors, no urban elements, no snow',
  space:      'no organic textures, no grass, no warm colors',
  candy:      'no dark colors, no realistic textures, no gritty materials',
  pirate:     'no modern elements, no clean surfaces, no neon',
  japanese:   'no western elements, no neon signs, no clutter',
  cyberpunk:  'no natural materials, no daylight, no clean surfaces',
  winter:     'no warm colors, no tropical elements, no sand',
  haunted:    'no bright colors, no cheerful elements, no clean surfaces',
  underwater: 'no fire, no dry desert, no urban elements',
  wild_west:  'no modern technology, no neon, no sci-fi elements',
}

// Style detection from user prompt
const STYLE_MODIFIERS: Record<string, string> = {
  'low poly':    ', flat shading, low polygon count, minimal vertices, stylized game asset',
  'lowpoly':     ', flat shading, low polygon count, minimal vertices, stylized game asset',
  'cartoon':     ', cartoon style, bright colors, exaggerated proportions, cel shading',
  'realistic':   ', photorealistic, high detail, accurate proportions, natural materials',
  'medieval':    ', medieval style, aged materials, stone and wood, fantasy setting',
  'modern':      ', modern style, clean lines, contemporary design, minimalist',
  'futuristic':  ', sci-fi futuristic, sleek design, glowing elements, high-tech materials',
  'cyberpunk':   ', cyberpunk style, neon lights, dark urban, chrome and holographic',
  'fantasy':     ', fantasy style, magical elements, ornate details, enchanted materials',
  'pirate':      ', pirate theme, weathered wood, rope, barnacles, nautical',
  'japanese':    ', Japanese style, minimalist, bamboo, paper screens, zen aesthetic',
  'steampunk':   ', steampunk style, gears, brass, copper pipes, Victorian industrial',
  'horror':      ', horror style, dark, decayed, eerie, unsettling, cobwebs',
  'cute':        ', cute kawaii style, rounded shapes, pastel colors, chibi proportions',
  'voxel':       ', voxel art style, cubic shapes, pixel art 3D, blocky retro',
  'stylized':    ', stylized art, hand-painted look, clean silhouette, game-ready',
}

// Meshy v2 enforces a 500-char limit on the prompt field and a 200-char limit
// on negative_prompt. Exceeding either causes a 422 validation error from the API.
const MESHY_PROMPT_MAX_CHARS     = 500
const MESHY_NEG_PROMPT_MAX_CHARS = 200

/**
 * Rich expansion templates for common single-word or very short prompts.
 * When a user types just "house" they get a detailed description, not a gray box.
 */
const PROMPT_EXPANSIONS: Record<string, string> = {
  // Buildings
  house:     'modern two-story suburban house with pitched shingled roof, front porch with columns, chimney, bay windows with frames, front door with handle, white siding with blue trim, stone foundation',
  castle:    'medieval stone castle with tall keep tower, crenellated battlements, round corner turrets, arched gate entrance with portcullis, flag on top, arrow slit windows, moss on walls',
  tower:     'tall stone watchtower with crenellated top, arched windows on each level, iron torch brackets, heavy wooden door at base, spiral staircase visible through windows',
  shop:      'charming retail storefront with large display window, striped canvas awning, wooden door with brass bell, hanging wooden sign, brick facade, flower boxes under windows',
  cabin:     'rustic log cabin with stone chimney, covered front porch with rocking chair, stacked firewood pile, pitched roof with moss, warm amber window glow',
  barn:      'large red barn with white X-trim doors, sliding double doors, hay loft opening, gambrel roof, copper weathervane, wooden post fencing',

  // Vehicles
  car:       'sleek modern sports sedan, aerodynamic curved body, chrome alloy wheel rims, LED headlights and red taillights, tinted windows, dual chrome exhaust pipes, sport bumper',
  truck:     'heavy-duty pickup truck, raised suspension, large chrome grille, truck bed with liner, roll bar with lights, oversized mud tires with aggressive tread',
  boat:      'classic wooden speedboat, polished mahogany hull, chrome fittings and cleats, leather captain seats, curved windshield, outboard motor with propeller',
  plane:     'single-engine propeller airplane, streamlined silver fuselage, riveted panels, fixed landing gear, cockpit with instruments visible, wing struts, painted tail number',
  spaceship: 'sleek sci-fi starfighter, angular armored hull plates with panel lines, glowing blue engine nacelles, tinted cockpit canopy, weapon hardpoints on wings, landing struts',

  // Characters
  knight:    'medieval plate armor knight in heroic pose, full helm with visor slit, ornate shoulder pauldrons, breastplate with lion heraldry, metal gauntlets, sword sheath at hip, flowing cape',
  wizard:    'wise wizard with long flowing star-covered robe and pointed hat, ornate wooden staff with glowing crystal tip, leather belt with potion vials, long white beard',
  robot:     'humanoid combat robot with polished chrome body, glowing blue visor eyes, articulated hydraulic joints, chest panel with status lights, shoulder antenna, thick armored limbs',
  dragon:    'fearsome western dragon with scaled body, large leather wings spread wide, horned head with sharp teeth, long spiked tail, powerful clawed legs, smoke curling from nostrils',
  zombie:    'shambling undead zombie with torn bloodstained clothing, exposed ribcage, grey-green decayed skin, one arm reaching forward, glowing green eyes, matted hair',

  // Weapons
  sword:     'ornate fantasy longsword, polished steel blade with central fuller groove and etched runes, leather-wrapped grip with brass wire binding, ornate golden crossguard with ruby inset, round metal pommel',
  axe:       'fearsome double-headed battle axe, curved steel blades with etched Norse runes, thick oak haft wrapped in leather strips, spiked iron pommel cap, blood groove details',
  bow:       'elegant elven recurve longbow, carved wooden limbs with leaf and vine motif, leather-wrapped grip, silver-tipped arrow rest, ornate gold nock tips, bowstring taut',
  staff:     'wizard battle staff, ancient gnarled dark wood shaft, glowing purple amethyst crystal sphere at top held by twisted wooden branches, mystic rune carvings along length',
  shield:    'round Viking war shield, reinforced wooden planks with iron rim band, central iron boss dome, leather arm straps, painted red and black heraldic design, battle dents',

  // Furniture
  chair:     'elegant carved wooden dining chair, ornate lattice-pattern backrest, turned legs with claw feet, upholstered red velvet seat cushion, curved armrests with scroll detail',
  table:     'solid oak farmhouse dining table, thick butcher-block plank top with live edge, heavy turned pedestal legs with stretcher bars, warm honey finish, visible wood grain knots',
  bed:       'luxurious four-poster king bed, carved wooden posts with finials, tall upholstered headboard with diamond tufting, thick white mattress with layered bedding, decorative pillows',
  sofa:      'modern tufted sectional sofa, deep cushions with piped edges, button-tufted back, tapered walnut legs, accent throw pillows, soft grey linen upholstery',
  desk:      'executive wooden desk, large leather-inlay work surface, three drawers with antique brass handles, carved cabriole legs, matching leather desk chair',

  // Props
  chest:     'ornate pirate treasure chest, dark aged wood body with hammered iron bands and corner brackets, domed lid with lock hasp, gold coins and jewels spilling out',
  barrel:    'weathered wine barrel, curved oak staves with three hammered iron hoops, bung hole with cork plug, rope carry handle, aged patina and wine stains',
  fountain:  'ornate Renaissance three-tiered stone fountain, carved fish-head water spouts, water cascading down each level, moss and vine detail, wide circular pool base, copper patina',
  lantern:   'antique oil lantern, polished brass octagonal frame, clear glass panels, cotton wick holder inside, ornate ring handle on top, warm amber glow, soot marks',

  // Environment
  tree:      'majestic ancient oak tree, thick gnarled trunk with deep bark texture, massive spreading canopy of dense green leaves, exposed root system at mossy base, bird nest in branch fork',
  rock:      'large weathered granite boulder, layered sedimentary surface with deep cracks and yellow lichen patches, green moss on north face, smaller stones scattered at eroded base',
  mushroom:  'giant fantasy mushroom, thick spotted red cap with white polka dots, pale ribbed gill underside, stout white stalk with ring, smaller mushrooms at base, bioluminescent glow',
}

function buildMeshyPrompt(rawPrompt: string, category: AssetCategory): string {
  // Clean common command prefixes from user input
  const cleaned = rawPrompt
    .replace(/^(build|create|make|generate|design|craft|add|place|spawn)\s+(me\s+)?(a\s+|an\s+|the\s+)?/i, '')
    .trim()

  // Check for rich expansion of simple prompts
  const cleanedLower = cleaned.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const expansion = PROMPT_EXPANSIONS[cleanedLower]

  let basePrompt: string
  if (expansion) {
    // Use rich expansion for short prompts — this is the key quality upgrade
    basePrompt = expansion
  } else if (cleaned.split(/\s+/).length <= 3) {
    // Short prompt with no template — use the category template with the cleaned input
    const template = PROMPT_TEMPLATES[category] ?? PROMPT_TEMPLATES.default
    basePrompt = template.replace('{prompt}', cleaned)
  } else {
    // User already provided detail — use template to add quality modifiers
    const template = PROMPT_TEMPLATES[category] ?? PROMPT_TEMPLATES.default
    basePrompt = template.replace('{prompt}', cleaned)
  }

  // Detect and append style modifier from user's original prompt
  const lower = rawPrompt.toLowerCase()
  for (const [key, modifier] of Object.entries(STYLE_MODIFIERS)) {
    if (lower.includes(key)) {
      basePrompt += modifier
      break
    }
  }

  // Hard-truncate to Meshy's limit — truncate at a word boundary where possible
  if (basePrompt.length > MESHY_PROMPT_MAX_CHARS) {
    basePrompt = basePrompt.slice(0, MESHY_PROMPT_MAX_CHARS).replace(/[,\s]+$/, '')
  }

  return basePrompt
}

/**
 * Get the category-specific negative prompt for Meshy.
 * Falls back to generic negative prompt if category not found.
 */
function getNegativePrompt(category: AssetCategory): string {
  const neg = NEGATIVE_PROMPTS[category] ?? NEGATIVE_PROMPT
  // Enforce Meshy's 200-char limit
  if (neg.length > MESHY_NEG_PROMPT_MAX_CHARS) {
    return neg.slice(0, MESHY_NEG_PROMPT_MAX_CHARS).replace(/,?\s*[^,]*$/, '')
  }
  return neg
}

// ── Collision fidelity per category ──────────────────────────────────────────

const COLLISION_FIDELITY: Record<AssetCategory, string> = {
  character:   'Enum.CollisionFidelity.Hull',
  building:    'Enum.CollisionFidelity.Box',
  weapon:      'Enum.CollisionFidelity.Hull',
  vehicle:     'Enum.CollisionFidelity.Hull',
  prop:        'Enum.CollisionFidelity.Box',
  furniture:   'Enum.CollisionFidelity.Box',
  environment: 'Enum.CollisionFidelity.Box',
  default:     'Enum.CollisionFidelity.Hull',
}

// Default sizes in studs per category (X, Y, Z)
const DEFAULT_SIZES: Record<AssetCategory, [number, number, number]> = {
  character:   [4,  6,  4],
  building:    [20, 20, 20],
  weapon:      [1,  8,  1],
  vehicle:     [12, 6,  20],
  prop:        [4,  4,  4],
  furniture:   [6,  5,  6],
  environment: [16, 8,  16],
  default:     [6,  6,  6],
}

// ── Meshy helpers ─────────────────────────────────────────────────────────────

async function createMeshyTask(
  rawPrompt: string,
  quality: Quality,
  apiKey: string,
  category?: AssetCategory,
  retryWithCleanMesh = false,
): Promise<string> {
  const resolvedCategory = category ?? detectAssetCategory(rawPrompt)
  // buildMeshyPrompt already calls enhanceMeshPromptWithGameKnowledge internally —
  // do NOT call it again here or the prompt gets double-enhanced and overflows 500 chars.
  let builtPrompt = buildMeshyPrompt(rawPrompt, resolvedCategory)

  if (retryWithCleanMesh) {
    // Append before the 500-char cap so it doesn't get silently dropped
    const suffix = ', clean mesh'
    if (builtPrompt.length + suffix.length <= 500) {
      builtPrompt = builtPrompt + suffix
    }
  }

  // Build theme-aware negative prompt
  const detectedTheme = detectTheme(rawPrompt)
  const themeNegative = detectedTheme && GAME_THEMES[detectedTheme]
    ? THEME_NEGATIVE_DIRECTIVES[detectedTheme] ?? ''
    : ''
  const baseNegative = getNegativePrompt(resolvedCategory)
  const negative_prompt = themeNegative
    ? `${themeNegative}, ${baseNegative}`.slice(0, 200)
    : baseNegative

  const body: Record<string, unknown> = {
    mode: 'preview',
    prompt: builtPrompt,
    negative_prompt,
    art_style: 'realistic',
    topology: 'quad',
    target_polycount: POLY_TARGETS[quality],
    // Enable PBR for standard and premium — draft gets it too so preview has color
    enable_pbr: quality !== 'draft',
  }

  const res = await fetch(`${MESHY_BASE}/v3/text-to-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meshy task creation failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { result: string }
  return data.result
}

/**
 * Creates a Meshy refine task from a completed preview task.
 *
 * This is the CRITICAL step that converts the low-detail gray preview mesh into
 * a fully textured, detailed model. Skipping this is why users get "a single cube".
 *
 * Refine mode takes the preview task ID, re-runs generation at higher detail,
 * and applies PBR textures. Returns the refine task ID.
 */
async function createMeshyRefineTask(
  previewTaskId: string,
  quality: Quality,
  apiKey: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    mode: 'refine',
    preview_task_id: previewTaskId,
    enable_pbr: true,
    // texture_richness controls how detailed the PBR texture bake is.
    // 'high' minimum for any refine — 'medium' produces blurry, low-detail textures.
    texture_richness: quality === 'draft' ? 'high' : 'ultra',
  }

  const res = await fetch(`${MESHY_BASE}/v3/text-to-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meshy refine task creation failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyTask(
  taskId: string,
  apiKey: string,
  /** Hard deadline in ms from now. Defaults to 28s — safe for Vercel's 60s limit
   *  when called twice (preview + refine) with ~2s buffer. */
  deadlineMs = 28_000,
  intervalMs = 4_000,
): Promise<MeshyTask> {
  const deadline = Date.now() + deadlineMs
  let first = true

  while (Date.now() < deadline) {
    // Initial delay before first poll so Meshy has time to start processing
    await new Promise((r) => setTimeout(r, first ? 3_000 : intervalMs))
    first = false

    // Don't bother if we've already blown past the deadline
    if (Date.now() >= deadline) break

    const res = await fetch(`${MESHY_BASE}/v3/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      // 4xx errors (bad key, invalid taskId) are unrecoverable — fail fast
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Meshy poll failed with ${res.status} — check taskId and API key`)
      }
      // 5xx — transient, keep retrying
      continue
    }

    const task = (await res.json()) as MeshyTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }

  // Exhausted time budget — return as still in progress so client can poll via GET
  return { id: taskId, status: 'IN_PROGRESS' }
}

async function getMeshyTask(taskId: string, apiKey: string): Promise<MeshyTask> {
  const res = await fetch(`${MESHY_BASE}/v3/text-to-3d/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Meshy poll failed (${res.status})`)
  return (await res.json()) as MeshyTask
}

// ── Fal texture helpers ───────────────────────────────────────────────────────

async function generateFalTextures(
  prompt: string,
  apiKey: string,
  resolution = 1024,
): Promise<{ albedo: string; normal: string; roughness: string } | null> {
  const texturePrompt = `${prompt}, seamless PBR game texture, physically based rendering, 4K detail, no visible tiling, clean UV mapping, neutral studio lighting`

  // Fal queue: submit to fast-sdxl (general image gen) — returns a single albedo image.
  // fal-ai/fast-sdxl/texture does not exist; fast-sdxl is the correct image gen endpoint.
  // Fal queue pattern: POST to queue.fal.run/{model}, poll /requests/{id}/status,
  // fetch result from /requests/{id}.
  const MODEL = 'fal-ai/fast-sdxl'

  const submitRes = await fetch(`${FAL_QUEUE_BASE}/${MODEL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify({
      prompt: texturePrompt,
      image_size: { width: resolution, height: resolution },
      num_images: 1,
      output_format: 'png',
      enable_safety_checker: false,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!submitRes.ok) {
    // Texture generation is non-critical — fall back gracefully
    console.warn(`[mesh] Fal submit failed: ${submitRes.status}`)
    return null
  }

  const queue = (await submitRes.json()) as FalQueueResponse
  const requestId = queue.request_id
  if (!requestId) return null

  // Poll for completion — hard cap at 20s so textures don't eat Vercel's 60s budget.
  // Meshy preview (~28s) + refine (~28s) + buffer leaves ~4s for textures —
  // textures run in parallel with refine so we get ~28s total for them too.
  const FAL_POLL_DEADLINE = Date.now() + 25_000
  for (let i = 0; i < 8; i++) {
    if (Date.now() >= FAL_POLL_DEADLINE) return null
    await new Promise((r) => setTimeout(r, 3_000))
    if (Date.now() >= FAL_POLL_DEADLINE) return null

    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/${MODEL}/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      },
    )

    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/${MODEL}/requests/${requestId}`,
        {
          headers: { Authorization: `Key ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
      if (!resultRes.ok) return null

      const output = (await resultRes.json()) as FalTextureOutput

      // Named PBR maps (if the model supports them)
      if (output.albedo?.url && output.normal?.url && output.roughness?.url) {
        return {
          albedo: output.albedo.url,
          normal: output.normal.url,
          roughness: output.roughness.url,
        }
      }

      // Fallback: images[] array — fast-sdxl returns a single albedo image.
      // Use it as albedo only; normal and roughness will be null placeholders.
      // Guard: check array has at least one valid entry before accessing.
      if (output.images && output.images.length > 0 && output.images[0]?.url) {
        return {
          albedo: output.images[0].url,
          // fast-sdxl doesn't produce normal/roughness — use the albedo as a
          // visual stand-in. The Luau code will note these need manual maps.
          normal: output.images[0].url,
          roughness: output.images[0].url,
        }
      }
      return null
    }
    if (status.status === 'FAILED') return null
  }

  return null
}

// ── Luau code generator ───────────────────────────────────────────────────────

function generateMeshPartLuau(params: {
  prompt: string
  meshUrl: string | null
  textures: { albedo: string; normal: string; roughness: string } | null
  polygonCount: number | null
  taskId: string
  category?: AssetCategory
  /** Real rbxassetid:// strings from Roblox Open Cloud upload — skips manual steps */
  rbxMeshId?: string
  rbxTextureIds?: { albedo: string; normal: string; roughness: string }
}): string {
  const { prompt, meshUrl, textures, taskId } = params
  const category: AssetCategory = params.category ?? detectAssetCategory(prompt)
  const collisionFidelity = COLLISION_FIDELITY[category]
  const [sx, sy, sz] = DEFAULT_SIZES[category]

  // Sanitize for Lua identifier — must start with a letter, no special chars
  const identBase = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  // Prefix with 'asset_' if first character is a digit or the string is empty
  const safeName = /^[0-9_]/.test(identBase) || identBase.length === 0
    ? `asset_${identBase}`.slice(0, 46)
    : identBase

  // Sanitize for use inside Lua double-quoted string literals — escape backslashes
  // and double-quotes so the generated code is always syntactically valid.
  const displayName = prompt.slice(0, 50).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')

  // Prefer the real rbxassetid:// if the upload already succeeded
  const meshLine = params.rbxMeshId
    ? `meshPart.MeshId = "${params.rbxMeshId}"`
    : meshUrl
      ? `-- IMPORTANT: Upload the GLB file to Roblox and replace this MeshId\n\tmeshPart.MeshId = "rbxassetid://YOUR_ASSET_ID"  -- source: ${meshUrl}`
      : `-- No mesh URL yet — poll GET /api/ai/mesh?taskId=${taskId} then upload the GLB`

  // Prefer real uploaded texture IDs; fall back to placeholder comment with source URLs
  const surfaceAppearanceBlock = params.rbxTextureIds
    ? `
\tlocal sa = Instance.new("SurfaceAppearance")
\tsa.AlphaMode    = Enum.AlphaMode.Overlay
\tsa.ColorMap     = "${params.rbxTextureIds.albedo}"
\tsa.NormalMap    = "${params.rbxTextureIds.normal}"
\tsa.RoughnessMap = "${params.rbxTextureIds.roughness}"
\tsa.MetalnessMap = ""  -- optional: add a metalness map if available
\tsa.Parent = meshPart`
    : textures?.albedo
      ? `
\tlocal sa = Instance.new("SurfaceAppearance")
\tsa.AlphaMode = Enum.AlphaMode.Overlay
\t-- Upload textures to Roblox Asset Manager and paste the asset IDs below
\tsa.ColorMap    = "rbxassetid://ALBEDO_ASSET_ID"    -- source: ${textures.albedo}
\tsa.NormalMap   = "rbxassetid://NORMAL_ASSET_ID"    -- source: ${textures.normal}
\tsa.RoughnessMap = "rbxassetid://ROUGHNESS_ASSET_ID" -- source: ${textures.roughness}
\tsa.MetalnessMap = ""  -- optional: upload a metalness map if available
\tsa.Parent = meshPart`
      : `
\t-- No textures generated. Add a SurfaceAppearance manually if needed.`

  // Plain number string — no locale commas — so the Lua print line is valid.
  const polyCountDisplay = params.polygonCount != null ? String(params.polygonCount) : 'unknown'

  return `--!strict
--[[
  ForjeAI Generated Mesh: ${displayName}
  Category:      ${category}
  Polygon Count: ${polyCountDisplay}
  Quality:       auto-detected
  Task ID:       ${taskId}

  IMPORTANT: Run this code in the Studio COMMAND BAR or inside a Plugin script.
  It will NOT work as a regular Script/LocalScript in the Explorer because it uses
  ChangeHistoryService and Selection, which are Plugin-only services.

  SETUP INSTRUCTIONS:
${params.rbxMeshId
  ? `  Assets were automatically uploaded to Roblox — MeshId and textures are pre-filled.
  1. Paste this script into the Studio Command Bar and press Enter
  2. Adjust Size and CFrame to match your scene layout`
  : `  1. Download the GLB from the meshUrl in the API response
  2. In Studio: Asset Manager > Import 3D > select your GLB
  3. Copy the new rbxassetid and paste it into MeshId below
  4. (Optional) Upload albedo/normal/roughness PNGs and update SurfaceAppearance IDs
  5. Paste this script into the Studio Command Bar and press Enter
  6. Adjust Size and CFrame to match your scene layout`}
--]]

local CollectionService  = game:GetService("CollectionService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection          = game:GetService("Selection")

local function create_${safeName}(): Model
\t-- Place near the camera so it lands in view immediately
\tlocal camera  = workspace.CurrentCamera
\tlocal spawnCF = camera.CFrame * CFrame.new(0, 0, -${Math.max(sx, sy, sz) * 2})

\tlocal model = Instance.new("Model")
\tmodel.Name = "${displayName}"

\tlocal meshPart = Instance.new("MeshPart")
\tmeshPart.Name = "${displayName}"
\t${meshLine}
\tmeshPart.Size             = Vector3.new(${sx}, ${sy}, ${sz})
\tmeshPart.CFrame           = spawnCF
\tmeshPart.Anchored         = true
\tmeshPart.CastShadow       = true
\tmeshPart.CollisionFidelity = ${collisionFidelity}
\tmeshPart.RenderFidelity   = Enum.RenderFidelity.Automatic
\tmeshPart.Parent           = model
${surfaceAppearanceBlock}

\tmodel.PrimaryPart = meshPart
\tmodel.Parent      = workspace

\t-- Tag for ForjeAI asset tracking
\tCollectionService:AddTag(model, "ForjeAI")
\tCollectionService:AddTag(meshPart, "ForjeAI")

\treturn model
end

-- Record for undo support (TryBeginRecording is the modern API)
local rid = ChangeHistoryService:TryBeginRecording("ForjeAI Place: ${displayName}")

local ok, builtModel = pcall(create_${safeName})

if ok and builtModel then
\t-- Select the placed model in Studio Explorer
\tSelection:Set({ builtModel })
end

if rid then
\tChangeHistoryService:FinishRecording(rid, ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel)
end
if not ok then warn("[ForjeAI] Mesh placement error: " .. tostring(builtModel)) end

print(string.format("[ForjeAI] Placed '%s' (%s) — polygon count: ${polyCountDisplay}", builtModel.Name, "${category}"))
`
}

// ── Demo thumbnail placeholder (SVG, no external dependency) ─────────────────

const DEMO_THUMBNAIL =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
    '<rect width="128" height="128" fill="#1a1a2e"/>' +
    '<polygon points="64,20 100,90 28,90" fill="none" stroke="#D4AF37" stroke-width="3"/>' +
    '<text x="64" y="112" text-anchor="middle" fill="#D4AF37" font-size="10" font-family="sans-serif">3D DEMO</text>' +
    '</svg>',
  ).toString('base64')

// ── Demo response ─────────────────────────────────────────────────────────────

function demoResponse(prompt: string) {
  const category = detectAssetCategory(prompt)
  return NextResponse.json({
    meshUrl: null,
    fbxUrl: null,
    thumbnailUrl: DEMO_THUMBNAIL,
    videoUrl: null,
    polygonCount: null,
    textures: null,
    luauCode: generateMeshPartLuau({
      prompt,
      meshUrl: null,
      textures: null,
      polygonCount: null,
      taskId: 'demo-task',
      category,
    }),
    costEstimateUsd: 0,
    actualCostUsd: 0,
    status: 'demo',
    category,
    message: 'Set MESHY_API_KEY to generate real 3D models. Set FAL_KEY to generate textures.',
  })
}

// ── GET — poll existing task ──────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE')
    if (tierDenied) return tierDenied
  }

  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) {
    return NextResponse.json({ error: 'taskId query param required' }, { status: 400 })
  }

  const apiKey = process.env.MESHY_API_KEY
  if (!apiKey) {
    // No key — return a demo polling response instead of a hard error
    return NextResponse.json({
      status: 'demo',
      progress: 100,
      taskId,
      meshUrl: null,
      message: 'Set MESHY_API_KEY to poll real tasks.',
    })
  }

  try {
    const task = await getMeshyTask(taskId, apiKey)
    if (task.status !== 'SUCCEEDED') {
      return NextResponse.json({ status: 'pending', progress: task.progress ?? 0, taskId })
    }

    const glbUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? null

    // Attempt Roblox upload so the polled response also gets real asset IDs
    let rbxMeshId: string | undefined

    const robloxApiKey  = process.env.ROBLOX_OPEN_CLOUD_API_KEY
    const robloxCreator = process.env.ROBLOX_CREATOR_ID

    if (robloxApiKey && robloxCreator && glbUrl) {
      const meshResult = await downloadAndUpload(glbUrl, `mesh_${taskId}`, {
        description: `ForjeAI polled mesh — task ${taskId}`,
      }).catch((err: unknown) => {
        console.error('[mesh GET] Roblox mesh upload failed:', err instanceof Error ? err.message : err)
        return null
      })
      if (meshResult) rbxMeshId = meshResult.rbxAssetId
    }

    return NextResponse.json({
      meshUrl: glbUrl,
      fbxUrl: task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      videoUrl: task.video_url ?? null,
      polygonCount: task.polygon_count ?? null,
      textures: null,
      luauCode: generateMeshPartLuau({
        prompt: `mesh_${taskId}`,
        meshUrl: glbUrl,
        textures: null,
        polygonCount: task.polygon_count ?? null,
        taskId,
        rbxMeshId,
      }),
      status: 'complete',
      taskId,
      rbxMeshId:     rbxMeshId ?? null,
      rbxTextureIds: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[mesh GET] Poll failed:', message)
    return NextResponse.json({ error: 'Poll failed' }, { status: 502 })
  }
}

// ── POST — generate new mesh ──────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE')
    if (tierDenied) return tierDenied

    // Rate limit: 20 AI requests per minute per user
    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before generating another mesh.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable — allow through rather than hard-fail
    }
  }

  // Parse + validate body
  const parsed = await parseBody(req, meshGenerateSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const prompt = parsed.data.prompt.trim()
  const quality: Quality = parsed.data.quality ?? 'standard'
  const withTextures = parsed.data.withTextures ?? true

  const meshyKey = process.env.MESHY_API_KEY
  const falKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // Detect category once — used for both prompt building and Luau code gen
  const category = detectAssetCategory(prompt)

  // Cost estimate (always returned even in demo)
  const costEstimateUsd = COST_MESH[quality] + (withTextures && falKey ? COST_TEXTURE : 0)

  // If no Meshy key, try free pipeline before falling back to demo
  if (!meshyKey) {
    try {
      const { generateFreeMesh, generateMeshImportLuau } = await import('@/lib/free-mesh-pipeline')
      const freeResult = await generateFreeMesh(prompt)

      if (freeResult.status === 'complete' && freeResult.meshUrl) {
        return NextResponse.json({
          meshUrl: freeResult.meshUrl,
          fbxUrl: null,
          thumbnailUrl: freeResult.thumbnailUrl,
          videoUrl: null,
          polygonCount: freeResult.polygonCount,
          textures: null,
          luauCode: generateMeshImportLuau(freeResult.meshUrl, prompt.slice(0, 50)),
          costEstimateUsd: 0,
          actualCostUsd: 0,
          status: 'complete',
          category,
          model: freeResult.model,
          message: 'Generated via free AI pipeline (HuggingFace Spaces)',
        })
      }

      // Image was generated but 3D conversion failed — return partial result
      if (freeResult.thumbnailUrl) {
        return NextResponse.json({
          meshUrl: null,
          fbxUrl: null,
          thumbnailUrl: freeResult.thumbnailUrl,
          videoUrl: null,
          polygonCount: null,
          textures: null,
          luauCode: null,
          costEstimateUsd: 0,
          actualCostUsd: 0,
          status: 'pending',
          category,
          model: freeResult.model,
          message: freeResult.error ?? '3D conversion in progress — concept image shown.',
        })
      }
    } catch (err) {
      console.warn('[mesh] Free pipeline failed:', err instanceof Error ? err.message : String(err))
    }
    return demoResponse(prompt)
  }

  let actualCostUsd = 0

  try {
    // Step 1: Start Meshy preview task — with one retry on failure
    let taskId: string
    try {
      taskId = await createMeshyTask(prompt, quality, meshyKey, category)
    } catch (firstErr) {
      // Retry once with "clean mesh" appended to the prompt
      try {
        taskId = await createMeshyTask(prompt, quality, meshyKey, category, true)
      } catch {
        // Surface the original error if retry also fails
        throw firstErr
      }
    }

    actualCostUsd += COST_MESH[quality]

    // Step 2: Poll preview task until it completes (needed before we can refine)
    const previewTask = await pollMeshyTask(taskId, meshyKey)

    // If preview is still running, return pending — client will poll via GET
    if (previewTask.status === 'IN_PROGRESS') {
      return NextResponse.json({
        meshUrl: null,
        fbxUrl: null,
        thumbnailUrl: null,
        videoUrl: null,
        polygonCount: null,
        textures: null,
        luauCode: generateMeshPartLuau({ prompt, meshUrl: null, textures: null, polygonCount: null, taskId, category }),
        costEstimateUsd,
        actualCostUsd,
        status: 'pending',
        category,
        taskId,
        message: `3D model preview still generating. Poll GET /api/ai/mesh?taskId=${taskId}`,
      })
    }

    // Start Fal texture generation NOW in parallel with the refine step to save time.
    // Returns a tuple [textures, textureWasBilled] to avoid closure mutation races.
    const texturePromise: Promise<[{ albedo: string; normal: string; roughness: string } | null, boolean]> =
      withTextures && falKey
        ? generateFalTextures(prompt, falKey).then((t) => [t, t !== null] as [typeof t, boolean])
        : Promise.resolve([null, false] as [null, false])

    // Step 3: Start refine task — this is what produces the detailed textured mesh.
    // Without this step users only get the low-quality preview (gray single-color blob).
    // For 'draft' quality we skip refine to keep it fast, but still get preview colors.
    let finalTask = previewTask
    if (quality !== 'draft') {
      try {
        const refineTaskId = await createMeshyRefineTask(taskId, quality, meshyKey)
        // 24s budget for refine — preview used ~28s, leaving ~28s before Vercel kills us.
        // Textures run in parallel so they don't count against this budget.
        const refinedTask = await pollMeshyTask(refineTaskId, meshyKey, 24_000)
        // Only use refine result if it actually succeeded — fall back to preview on failure
        if (refinedTask.status === 'SUCCEEDED') {
          finalTask = refinedTask
          taskId = refineTaskId
        }
      } catch (refineErr) {
        console.warn('[mesh] Refine step failed, using preview result:', refineErr instanceof Error ? refineErr.message : String(refineErr))
        // finalTask remains as previewTask — still a usable mesh
      }
    }

    // Use the refined (or preview fallback) task result
    const task = finalTask

    // Await textures (were running in parallel with refine)
    const [textures, textureBilled] = await texturePromise
    if (textureBilled) actualCostUsd += COST_TEXTURE

    const meshUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? null

    // ── Roblox Open Cloud upload ─────────────────────────────────────────────
    // Upload the mesh and all three texture maps to Roblox in parallel so the
    // generated Luau code contains real rbxassetid:// URLs — no manual steps.
    let rbxMeshId: string | undefined
    let rbxTextureIds: { albedo: string; normal: string; roughness: string } | undefined

    const robloxApiKey   = process.env.ROBLOX_OPEN_CLOUD_API_KEY
    const robloxCreator  = process.env.ROBLOX_CREATOR_ID

    if (robloxApiKey && robloxCreator && meshUrl) {
      const safeDisplayName = prompt.slice(0, 50)

      // Upload mesh + textures concurrently — texture uploads are independent
      const meshUploadPromise = downloadAndUpload(meshUrl, safeDisplayName, {
        description: `ForjeAI generated mesh (${category}) — task ${taskId}`,
      }).catch((err: unknown) => {
        console.error('[mesh POST] Roblox mesh upload failed:', err instanceof Error ? err.message : err)
        return null
      })

      const textureUploadPromise: Promise<{ albedo: string; normal: string; roughness: string } | null> =
        textures
          ? Promise.all([
              downloadAndUploadTexture(textures.albedo,   `${safeDisplayName} Albedo`,   { description: `Albedo map — ${taskId}` }),
              downloadAndUploadTexture(textures.normal,   `${safeDisplayName} Normal`,   { description: `Normal map — ${taskId}` }),
              downloadAndUploadTexture(textures.roughness,`${safeDisplayName} Roughness`,{ description: `Roughness map — ${taskId}` }),
            ])
              .then(([a, n, r]: [UploadAssetResult, UploadAssetResult, UploadAssetResult]) => ({
                albedo:    a.rbxAssetId,
                normal:    n.rbxAssetId,
                roughness: r.rbxAssetId,
              }))
              .catch((err: unknown) => {
                console.error('[mesh POST] Roblox texture upload failed:', err instanceof Error ? err.message : err)
                return null
              })
          : Promise.resolve(null)

      const [meshResult, textureResult] = await Promise.all([meshUploadPromise, textureUploadPromise])

      if (meshResult) rbxMeshId = meshResult.rbxAssetId
      if (textureResult) rbxTextureIds = textureResult
    }
    // ── End Roblox upload ────────────────────────────────────────────────────

    const luauCode = generateMeshPartLuau({
      prompt,
      meshUrl,
      textures,
      polygonCount: task.polygon_count ?? null,
      taskId,
      category,
      rbxMeshId,
      rbxTextureIds,
    })

    return NextResponse.json({
      meshUrl,
      fbxUrl: task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      videoUrl: task.video_url ?? null,
      polygonCount: task.polygon_count ?? null,
      textures,
      luauCode,
      costEstimateUsd,
      actualCostUsd,
      status: 'complete',
      category,
      taskId,
      // Expose the real IDs so the client can use them directly if needed
      rbxMeshId:     rbxMeshId ?? null,
      rbxTextureIds: rbxTextureIds ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[mesh POST] Generation failed:', message)
    return NextResponse.json({ error: 'Mesh generation failed' }, { status: 502 })
  }
}
