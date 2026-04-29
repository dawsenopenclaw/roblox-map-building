/**
 * prompt-enhancer.ts
 * FREE pre-processing step that uses a fast/cheap AI model (Groq + Llama)
 * to analyze a raw user prompt and produce a structured build plan.
 *
 * This runs BEFORE the expensive Anthropic generation and does NOT cost
 * any user credits. The structured plan dramatically improves the quality
 * of the main AI generation by giving it clear, detailed instructions.
 *
 * Usage:
 *   const plan = await enhancePrompt("make a simulator game")
 *   // plan.enhancedPrompt → detailed rewritten prompt
 *   // plan.steps → ordered build steps
 *   // plan.assets → list of assets to create
 */

import Groq from 'groq-sdk'
import { detectBuildScale, getPartTargets, type BuildScale } from './focused-prompt'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PromptIntent =
  | 'build'
  | 'script'
  | 'terrain'
  | 'ui'
  | 'npc'
  | 'vehicle'
  | 'particle'
  | 'image'
  | 'mesh'
  | 'idea'

export type AssetType =
  | 'Part'
  | 'Model'
  | 'Script'
  | 'LocalScript'
  | 'ModuleScript'
  | 'Sound'
  | 'ParticleEmitter'
  | 'UI'

export type Complexity = 'simple' | 'medium' | 'complex' | 'epic'

export interface BuildSectionPlan {
  name: string           // e.g. "Foundation", "Front Wall", "Roof", "Landscaping"
  partCount: number      // how many parts this section should produce
  material: string       // Concrete, Wood, Brick, Metal, Glass, Fabric, Neon, etc.
  color: string          // RGB like "139, 90, 43" or named like "Dark stone grey"
  dimensions: string     // e.g. "24x1x20 studs" or "4x8x0.3 each"
  useLoop: boolean       // whether to use a FOR loop for repeated elements
  loopSpec?: string      // e.g. "8 fence posts, spaced 4 studs apart along Z axis"
  details: string        // specific build instructions for this section
}

export interface EnhancedPromptStep {
  stepNumber: number
  action: string
  service: string // ServerScriptService, Workspace, ReplicatedStorage, etc.
  scriptName?: string
  description: string
}

export interface EnhancedPromptAsset {
  name: string
  type: AssetType
  description: string
}

// ─── Style Modifier Types ──────────────────────────────────────────────────

export type MoodModifier =
  | 'cozy' | 'dark' | 'futuristic' | 'magical' | 'rustic'
  | 'cheerful' | 'elegant' | 'industrial' | 'neutral'

export type ScaleModifier = 'tiny' | 'small' | 'normal' | 'large' | 'massive' | 'detailed'

export type EnvironmentModifier =
  | 'woods' | 'hill' | 'water' | 'city' | 'desert'
  | 'snow' | 'floating' | 'underground' | 'none'

export type TimeModifier = 'night' | 'sunset' | 'dawn' | 'rain' | 'morning' | 'day'

export interface StyleModifiers {
  mood: MoodModifier
  scale: ScaleModifier
  environment: EnvironmentModifier
  time: TimeModifier
  /** Specific RGB palette derived from mood — 5 colors for primary, secondary, accent, trim, detail */
  palette: { name: string; rgb: string }[]
  /** Materials that fit the mood */
  materials: string[]
  /** Lighting instructions derived from mood + time */
  lightingOverride: string
  /** Scale multiplier (1.0 = normal) */
  scaleMultiplier: number
  /** Extra environment elements to add around the build */
  environmentElements: string[]
  /** Raw keywords that triggered each modifier (for debugging) */
  triggerWords: string[]
}

// ─── Style Modifier Detection ──────────────────────────────────────────────

const MOOD_PATTERNS: { pattern: RegExp; mood: MoodModifier; triggerLabel: string }[] = [
  { pattern: /\b(cozy|cosy|warm|homey|homely|snug|comfy|comfortable|inviting|welcoming)\b/i, mood: 'cozy', triggerLabel: 'cozy/warm' },
  { pattern: /\b(dark|creepy|scary|horror|spooky|haunted|sinister|gloomy|ominous|eerie|abandoned|decrepit|cursed)\b/i, mood: 'dark', triggerLabel: 'dark/creepy' },
  { pattern: /\b(futuristic|modern|sleek|sci-?fi|cyber|neon|tech|advanced|hi-?tech|minimalist|contemporary)\b/i, mood: 'futuristic', triggerLabel: 'futuristic/modern' },
  { pattern: /\b(magical|enchanted|fantasy|mystical|fairy|wizard|witch|arcane|ethereal|mythical|elven|fae|sorcerer)\b/i, mood: 'magical', triggerLabel: 'magical/fantasy' },
  { pattern: /\b(rustic|old|weathered|ancient|worn|aged|vintage|antique|medieval|historic|crumbling|decayed)\b/i, mood: 'rustic', triggerLabel: 'rustic/old' },
  { pattern: /\b(cheerful|fun|playful|happy|bright|colorful|colourful|carnival|party|festive|joyful|whimsical)\b/i, mood: 'cheerful', triggerLabel: 'cheerful/fun' },
  { pattern: /\b(elegant|fancy|luxurious|luxury|grand|opulent|royal|palace|mansion|ornate|gilded|regal|majestic)\b/i, mood: 'elegant', triggerLabel: 'elegant/fancy' },
  { pattern: /\b(industrial|gritty|urban|factory|warehouse|steampunk|pipes|metal|brutalist|concrete jungle)\b/i, mood: 'industrial', triggerLabel: 'industrial/gritty' },
]

const SCALE_PATTERNS: { pattern: RegExp; scale: ScaleModifier }[] = [
  { pattern: /\b(tiny|miniature|micro|teeny)\b/i, scale: 'tiny' },
  { pattern: /\b(small|little|mini|compact|petite)\b/i, scale: 'small' },
  { pattern: /\b(large|big|tall|wide|spacious)\b/i, scale: 'large' },
  { pattern: /\b(massive|enormous|giant|huge|colossal|mega|towering|sprawling|vast)\b/i, scale: 'massive' },
  { pattern: /\b(detailed|intricate|complex|elaborate|ornate|decorated)\b/i, scale: 'detailed' },
]

const ENVIRONMENT_PATTERNS: { pattern: RegExp; env: EnvironmentModifier }[] = [
  { pattern: /\b(in the woods|in a forest|forest|woods|grove|woodland|among trees|tree-?lined)\b/i, env: 'woods' },
  { pattern: /\b(on a hill|hilltop|mountain|cliff|ridge|peak|elevated|overlook|bluff|highland)\b/i, env: 'hill' },
  { pattern: /\b(by the water|ocean|lake|river|beach|seaside|coastal|waterfront|dock|harbor|harbour|pond|shore|bay)\b/i, env: 'water' },
  { pattern: /\b(in the city|downtown|urban|street|metropolis|skyscraper|cityscape|neighborhood|block)\b/i, env: 'city' },
  { pattern: /\b(desert|sand|arid|dune|mesa|canyon|badlands|oasis)\b/i, env: 'desert' },
  { pattern: /\b(snow|winter|frozen|ice|arctic|tundra|blizzard|frosty|glacial|cold)\b/i, env: 'snow' },
  { pattern: /\b(floating|in the sky|cloud|skyborne|airborne|heavenly|celestial|above the clouds)\b/i, env: 'floating' },
  { pattern: /\b(underground|cave|cavern|subterranean|tunnel|mine|grotto|crypt|catacomb)\b/i, env: 'underground' },
]

const TIME_PATTERNS: { pattern: RegExp; time: TimeModifier }[] = [
  { pattern: /\b(at night|nighttime|night-?time|midnight|nocturnal|starlit|moonlit|under the stars)\b/i, time: 'night' },
  { pattern: /\b(sunset|dusk|twilight|golden hour|evening)\b/i, time: 'sunset' },
  { pattern: /\b(dawn|sunrise|first light|daybreak)\b/i, time: 'dawn' },
  { pattern: /\b(rain|rainy|storm|stormy|thunder|downpour|drizzle|overcast|cloudy)\b/i, time: 'rain' },
  { pattern: /\b(morning|early|misty morning|foggy morning)\b/i, time: 'morning' },
]

// ─── Mood → palette/material/lighting mappings ─────────────────────────────

interface MoodProfile {
  palette: { name: string; rgb: string }[]
  materials: string[]
  lightingBase: string
}

const MOOD_PROFILES: Record<MoodModifier, MoodProfile> = {
  cozy: {
    palette: [
      { name: 'warm brown', rgb: '139, 90, 43' },
      { name: 'cream', rgb: '245, 230, 200' },
      { name: 'burnt orange', rgb: '200, 120, 50' },
      { name: 'soft gold', rgb: '220, 190, 130' },
      { name: 'deep red accent', rgb: '160, 60, 50' },
    ],
    materials: ['WoodPlanks', 'Fabric', 'Brick', 'Wood', 'Cobblestone'],
    lightingBase: 'Warm ambient. PointLights (Color 255,220,180, Brightness 0.6, Range 20) in every room/area. Atmosphere (Density 0.25, Color 200,180,160). Bloom (Intensity 0.3, Size 24). ColorCorrection (Brightness 0.05, Saturation 0.1, TintColor 255,240,220).',
  },
  dark: {
    palette: [
      { name: 'charcoal', rgb: '40, 40, 45' },
      { name: 'blood red', rgb: '120, 20, 20' },
      { name: 'slate gray', rgb: '70, 70, 80' },
      { name: 'bone white', rgb: '180, 175, 165' },
      { name: 'sickly green accent', rgb: '80, 120, 60' },
    ],
    materials: ['Slate', 'Granite', 'Cobblestone', 'Metal', 'CorrodedMetal'],
    lightingBase: 'Dark oppressive. ClockTime 0. Few dim PointLights (Color 180,160,140, Brightness 0.3, Range 12). Atmosphere (Density 0.5, Color 30,25,35). Bloom (Intensity 0.1, Size 10). ColorCorrection (Brightness -0.1, Contrast 0.2, Saturation -0.2). Fog.',
  },
  futuristic: {
    palette: [
      { name: 'clean white', rgb: '230, 235, 240' },
      { name: 'electric blue', rgb: '0, 150, 255' },
      { name: 'silver', rgb: '190, 195, 200' },
      { name: 'neon cyan accent', rgb: '0, 255, 230' },
      { name: 'dark panel', rgb: '30, 35, 45' },
    ],
    materials: ['Metal', 'Glass', 'Neon', 'DiamondPlate', 'Foil'],
    lightingBase: 'Clean bright futuristic. SpotLights (white, Brightness 1, Range 40). Neon edge strips. Atmosphere (Density 0.1, Color 200,210,230). Bloom (Intensity 0.5, Size 40). ColorCorrection (Contrast 0.15, Saturation 0.05, TintColor 220,230,255).',
  },
  magical: {
    palette: [
      { name: 'deep purple', rgb: '80, 40, 140' },
      { name: 'enchanted gold', rgb: '230, 200, 80' },
      { name: 'mystic teal', rgb: '40, 180, 170' },
      { name: 'starlight white', rgb: '230, 225, 255' },
      { name: 'rose pink accent', rgb: '200, 100, 150' },
    ],
    materials: ['Marble', 'Glass', 'Neon', 'Fabric', 'Ice'],
    lightingBase: 'Ethereal glow. PointLights with varied colors (purple, teal, gold) scattered throughout. Atmosphere (Density 0.3, Color 140,120,180). Bloom (Intensity 0.6, Size 35). ColorCorrection (Saturation 0.25, TintColor 200,190,240). ParticleEmitters for sparkle/fairy dust.',
  },
  rustic: {
    palette: [
      { name: 'weathered stone', rgb: '140, 135, 125' },
      { name: 'old wood', rgb: '110, 75, 45' },
      { name: 'faded brick', rgb: '160, 110, 90' },
      { name: 'moss green', rgb: '80, 110, 60' },
      { name: 'iron gray accent', rgb: '90, 85, 80' },
    ],
    materials: ['Cobblestone', 'Brick', 'Wood', 'Granite', 'Pebble'],
    lightingBase: 'Warm weathered. SpotLights (Color 255,230,190, Brightness 0.5). Atmosphere (Density 0.35, Color 180,170,150). Bloom (Intensity 0.2, Size 20). ColorCorrection (Saturation -0.1, Brightness -0.02). Imperfect feel — add CFrame.Angles(0, math.rad(math.random(-3,3)), 0) jitter to placed parts.',
  },
  cheerful: {
    palette: [
      { name: 'sunny yellow', rgb: '255, 220, 50' },
      { name: 'sky blue', rgb: '80, 180, 255' },
      { name: 'grass green', rgb: '80, 200, 80' },
      { name: 'hot pink accent', rgb: '255, 100, 150' },
      { name: 'bright orange', rgb: '255, 160, 40' },
    ],
    materials: ['Concrete', 'Fabric', 'Neon', 'Wood', 'Glass'],
    lightingBase: 'Bright cheerful. Full daylight ClockTime 14. Atmosphere (Density 0.15, Color 200,220,255). Bloom (Intensity 0.4, Size 30). ColorCorrection (Brightness 0.1, Saturation 0.3, Contrast 0.05). Vivid and saturated everywhere.',
  },
  elegant: {
    palette: [
      { name: 'rich gold', rgb: '200, 170, 60' },
      { name: 'dark mahogany', rgb: '70, 35, 20' },
      { name: 'cream marble', rgb: '240, 235, 225' },
      { name: 'velvet burgundy', rgb: '120, 30, 50' },
      { name: 'polished black', rgb: '25, 25, 30' },
    ],
    materials: ['Marble', 'WoodPlanks', 'Glass', 'Neon', 'Fabric'],
    lightingBase: 'Warm elegant. Chandeliers (PointLight Color 255,240,200, Brightness 0.8, Range 30). Atmosphere (Density 0.2, Color 200,190,180). Bloom (Intensity 0.35, Size 28). ColorCorrection (Contrast 0.1, Saturation 0.1). Gold Neon accent strips on trim.',
  },
  industrial: {
    palette: [
      { name: 'steel gray', rgb: '120, 125, 130' },
      { name: 'rust orange', rgb: '160, 90, 40' },
      { name: 'dark concrete', rgb: '80, 80, 85' },
      { name: 'warning yellow', rgb: '230, 200, 40' },
      { name: 'pipe copper', rgb: '180, 120, 70' },
    ],
    materials: ['DiamondPlate', 'CorrodedMetal', 'Metal', 'Concrete', 'Brick'],
    lightingBase: 'Harsh industrial. Overhead SpotLights (white, Brightness 1.2, Angle 60). Atmosphere (Density 0.3, Color 150,150,160). Bloom (Intensity 0.15, Size 15). ColorCorrection (Saturation -0.15, Contrast 0.15). Exposed pipes, grating, bolted plates.',
  },
  neutral: {
    palette: [
      { name: 'warm gray', rgb: '160, 155, 150' },
      { name: 'soft white', rgb: '235, 230, 225' },
      { name: 'medium brown', rgb: '140, 100, 65' },
      { name: 'muted blue', rgb: '100, 130, 170' },
      { name: 'dark accent', rgb: '60, 55, 50' },
    ],
    materials: ['Concrete', 'Wood', 'Brick', 'Metal', 'Glass'],
    lightingBase: 'Future technology. Atmosphere (Density 0.3, Color 180,195,220). Bloom (Intensity 0.4, Size 30). ColorCorrection (Brightness 0.05, Contrast 0.1, Saturation 0.15). SunRays (Intensity 0.1, Spread 0.3).',
  },
}

// ─── Environment → surrounding elements ────────────────────────────────────

const ENVIRONMENT_ELEMENTS: Record<EnvironmentModifier, string[]> = {
  woods: [
    '8-12 trees surrounding the build (Cyl trunk Wood 95,65,30 + 4 overlapping Ball canopies Grass varying greens) via positions table + loop',
    'Leaf ground cover: scattered small flat green Parts (Grass material, 0.3 stud tall, random rotation)',
    'Dirt path leading to entrance (Pebble material, 100,80,55)',
    'Fallen log prop (Cyl on side, Wood material, moss green patches)',
    'Mushroom clusters (small Cyl stem + Ball cap, 3-4 per cluster)',
    'Dappled light: Atmosphere (Density 0.35, Color 160,180,140), filtered sun feel',
    'Terrain FillBlock Grass base with FillBall earth mounds',
  ],
  hill: [
    'Elevated terrain: build sits on FillBall hill (60+ studs wide, 15-25 studs above base)',
    'Rocky outcrops around base (irregular Parts, Granite material, 130,125,120)',
    'Winding path from bottom to top (Cobblestone alternating tiles via loop)',
    'Wildflowers along path edges (small colored Ball Parts via loop)',
    'Wind-bent tree at summit (angled Cyl trunk)',
    'Retaining stone wall on one side (Cobblestone, loop for stones)',
    'Terrain FillBlock Grass base + FillBall for hill shape',
  ],
  water: [
    'Water body: large Glass Part (transparency 0.4, blue 80,140,200, SurfaceLight underneath)',
    'Sandy beach/shore area (Sand material, 220,200,160)',
    'Dock/pier extending over water (Wood planks via loop, posts underneath)',
    'Rocks along shoreline (irregular Parts, Granite, varying sizes)',
    'Reeds/cattails at water edge (thin Cyl Parts, green)',
    'Small boat or raft prop (Wood Parts)',
    'Wave effect: ParticleEmitter (white, low rate) along water edge',
    'Terrain FillBlock Sand for shore, Water for water area',
  ],
  city: [
    'Road in front of build (Concrete dark gray 70,70,75, yellow center line, white edge lines)',
    'Sidewalk (Concrete lighter 160,160,165)',
    'Street lights every 15 studs via loop (Cyl pole + box lamp + PointLight)',
    'Fire hydrant prop (red Cyl)',
    'Other building facades on either side (simple shells, different heights)',
    'Crosswalk markings (white stripe Parts)',
    'Trash can, newspaper box, bench props on sidewalk',
    'No terrain FillBlock needed — all concrete/asphalt',
  ],
  desert: [
    'Sandy terrain: FillBlock Sand (220,195,155) as base',
    'Cacti (3-5 via loop): tall Cyl + Branch Cyls at angles, Grass material green',
    'Mesa rocks: large irregular Parts stacked, Sandstone/Sand material (200,160,100)',
    'Tumbleweeds: brown Ball Parts scattered',
    'Heat haze: Atmosphere (Density 0.25, Color 230,210,180), warm tint',
    'Sun-bleached bones/skull prop (white Parts)',
    'Cracked ground texture: dark line Parts in dry-mud pattern',
  ],
  snow: [
    'Snow terrain: FillBlock Snow white (240,245,250) as base',
    'Snow-capped elements: white Part layers on top of roof, walls, rocks (0.3-0.5 stud thick)',
    'Icicles hanging from edges (thin WedgeParts, Ice material, transparency 0.2, 200,220,240)',
    'Frozen pond: Glass Part (Ice material, transparency 0.3, pale blue)',
    'Snow-covered pine trees (white Ball canopies instead of green)',
    'Snowman prop (3 stacked white Balls + carrot nose + coal eyes)',
    'Breath/snow particles: ParticleEmitter (white, small, slow drift)',
    'Cold lighting: ColorCorrection TintColor 200,210,240, Atmosphere bluish',
  ],
  floating: [
    'NO ground terrain — build floats in sky',
    'Cloud platforms underneath: white Parts (Fabric material, transparency 0.2, soft shapes)',
    'Chains or pillars hanging down from build into void',
    'Smaller floating rock chunks nearby (Granite, irregular shapes, varying sizes)',
    'Ethereal particles: ParticleEmitter (white/gold sparkles drifting upward)',
    'Sky-blue Atmosphere (Density 0.1, Color 180,210,255), bright SunRays',
    'Waterfalls pouring off edges into nothing (blue Glass + ParticleEmitter)',
    'Rainbow arc nearby (thin colored Parts in arc shape)',
  ],
  underground: [
    'Cave walls enclosing the build: large irregular Parts (Slate/Granite, dark 60,55,50)',
    'Stalactites hanging from ceiling (WedgeParts pointing down, Slate)',
    'Stalagmites rising from floor (WedgeParts pointing up)',
    'Glowing crystals: Neon material Parts (purple/teal/blue, PointLight attached)',
    'Torch brackets on walls (PointLight warm, flickering via script)',
    'Underground pool: small Glass Part (dark blue, slight glow)',
    'Rock rubble scattered on floor (small irregular Parts)',
    'Dark lighting: minimal ambient, rely on torches and crystal glow. Atmosphere (Density 0.6, Color 20,15,25).',
  ],
  none: [],
}

// ─── Time → lighting overrides ─────────────────────────────────────────────

const TIME_LIGHTING: Record<TimeModifier, string> = {
  night: 'ClockTime 0. Dark sky, stars visible. Only artificial lights visible (PointLights, SpotLights, Neon strips). Moon glow. Atmosphere (Density 0.4, Color 20,25,40). ColorCorrection (Brightness -0.15, Saturation -0.1, TintColor 140,150,200). Street lamps and window lights become focal points.',
  sunset: 'ClockTime 17.5. Golden orange sky. Long warm shadows. Atmosphere (Density 0.3, Color 255,180,120). ColorCorrection (Brightness 0.05, Saturation 0.2, TintColor 255,220,180). Bloom (Intensity 0.5). SunRays (Intensity 0.25, Spread 0.5). Everything bathed in golden light.',
  dawn: 'ClockTime 6. Soft pink-purple sky. Gentle light from east. Atmosphere (Density 0.35, Color 220,180,200). ColorCorrection (Brightness 0, Saturation 0.1, TintColor 240,210,220). Mist at ground level (Atmosphere density). Quiet peaceful feel.',
  rain: 'ClockTime 12 but overcast. Dark gray sky. Atmosphere (Density 0.5, Color 100,105,115). ColorCorrection (Brightness -0.05, Saturation -0.15, Contrast 0.1). ParticleEmitter rain (white streaks, fast downward, high rate). Puddle Parts on ground (Glass, 0.1 stud tall, dark blue, transparency 0.3). Wet reflective surfaces.',
  morning: 'ClockTime 8. Soft warm light. Light mist. Atmosphere (Density 0.3, Color 200,210,220). Bloom (Intensity 0.3, Size 25). ColorCorrection (Brightness 0.05, Saturation 0.05). Dewy fresh feel. Fog at low elevation.',
  day: 'ClockTime 14. Standard bright daylight. Atmosphere (Density 0.25, Color 180,200,230). Bloom (Intensity 0.3, Size 28). ColorCorrection (Brightness 0.05, Saturation 0.15). SunRays (Intensity 0.1). Clear sky.',
}

/**
 * Analyzes a user prompt and extracts structured style modifiers.
 * This runs BEFORE Groq enhancement and gives the planner (and the main AI)
 * specific palette, material, lighting, and environment instructions derived
 * from the user's actual words. This is what prevents generic builds.
 */
export function extractStyleModifiers(prompt: string): StyleModifiers {
  const lower = prompt.toLowerCase()
  const triggerWords: string[] = []

  // Detect mood
  let mood: MoodModifier = 'neutral'
  for (const { pattern, mood: m, triggerLabel } of MOOD_PATTERNS) {
    if (pattern.test(lower)) {
      mood = m
      triggerWords.push(`mood:${triggerLabel}`)
      break
    }
  }

  // Detect scale modifier
  let scale: ScaleModifier = 'normal'
  for (const { pattern, scale: s } of SCALE_PATTERNS) {
    if (pattern.test(lower)) {
      scale = s
      triggerWords.push(`scale:${s}`)
      break
    }
  }

  // Detect environment
  let environment: EnvironmentModifier = 'none'
  for (const { pattern, env } of ENVIRONMENT_PATTERNS) {
    if (pattern.test(lower)) {
      environment = env
      triggerWords.push(`env:${env}`)
      break
    }
  }

  // Detect time
  let time: TimeModifier = 'day'
  for (const { pattern, time: t } of TIME_PATTERNS) {
    if (pattern.test(lower)) {
      time = t
      triggerWords.push(`time:${t}`)
      break
    }
  }

  // Look up profiles
  const moodProfile = MOOD_PROFILES[mood]
  const envElements = ENVIRONMENT_ELEMENTS[environment]

  // Build lighting: time overrides mood lighting, but mood tints remain
  let lightingOverride = TIME_LIGHTING[time]
  if (time === 'day' && mood !== 'neutral') {
    // Use mood-specific lighting instead of generic day
    lightingOverride = moodProfile.lightingBase
  }

  // Scale multiplier
  const scaleMultipliers: Record<ScaleModifier, number> = {
    tiny: 0.5,
    small: 0.7,
    normal: 1.0,
    large: 1.5,
    massive: 2.5,
    detailed: 1.0, // same size, more parts
  }

  return {
    mood,
    scale,
    environment,
    time,
    palette: moodProfile.palette,
    materials: moodProfile.materials,
    lightingOverride,
    scaleMultiplier: scaleMultipliers[scale],
    environmentElements: envElements,
    triggerWords,
  }
}

/**
 * Formats style modifiers into a prompt block that can be injected into
 * both the Groq planner and the main AI system prompt.
 */
export function formatStyleModifiersBlock(modifiers: StyleModifiers): string {
  const lines: string[] = []

  lines.push('[STYLE_MODIFIERS — extracted from user prompt]')
  lines.push(`Mood: ${modifiers.mood} | Scale: ${modifiers.scale} (${modifiers.scaleMultiplier}x) | Environment: ${modifiers.environment} | Time: ${modifiers.time}`)
  lines.push('')

  // Palette
  lines.push('COLOR PALETTE (use these specific colors, NOT generic defaults):')
  for (const c of modifiers.palette) {
    lines.push(`  - ${c.name}: Color3.fromRGB(${c.rgb})`)
  }
  lines.push('')

  // Materials
  lines.push(`PREFERRED MATERIALS: ${modifiers.materials.join(', ')}`)
  lines.push('Use these materials predominantly. Mix in 1-2 others for variety but keep the mood consistent.')
  lines.push('')

  // Lighting
  lines.push('LIGHTING SETUP:')
  lines.push(modifiers.lightingOverride)
  lines.push('')

  // Scale
  if (modifiers.scale !== 'normal') {
    lines.push(`SCALE ADJUSTMENT: All dimensions multiplied by ${modifiers.scaleMultiplier}x.`)
    if (modifiers.scale === 'detailed') {
      lines.push('DETAIL MODE: Same physical size, but add 2x the usual detail parts (trim, molding, hardware, decorations).')
    }
    lines.push('')
  }

  // Environment
  if (modifiers.environmentElements.length > 0) {
    lines.push('SURROUNDING ENVIRONMENT (add these around the main build):')
    for (const elem of modifiers.environmentElements) {
      lines.push(`  - ${elem}`)
    }
    lines.push('')
  }

  lines.push('CRITICAL: These modifiers came from analyzing what the user ACTUALLY asked for.')
  lines.push('Do NOT ignore them. Do NOT fall back to generic colors/materials/lighting.')
  lines.push('Every part of the build must reflect this mood, palette, and atmosphere.')
  lines.push('[/STYLE_MODIFIERS]')

  return lines.join('\n')
}

export interface EnhancedPrompt {
  originalPrompt: string
  intent: PromptIntent
  planSummary: string
  steps: EnhancedPromptStep[]
  assetCount: number
  assets: EnhancedPromptAsset[]
  styleDirective: string
  estimatedComplexity: Complexity
  estimatedCredits: number
  enhancedPrompt: string // The rewritten, more detailed prompt
  // v2 blueprint fields
  buildScale: BuildScale
  partTargets: { min: number; target: number; max: number }
  sections: BuildSectionPlan[]
  foundationType: string    // "layered", "basic", "circular", "none"
  lightingSetup: string     // detailed lighting instructions
  exteriorFocus: boolean    // true = facade-first, no interior unless asked
  forLoopSpecs: string[]    // list of things to build with FOR loops
  // v3 style modifier fields
  styleModifiers: StyleModifiers
}

// ─── Defaults & validation ──────────────────────────────────────────────────

const VALID_INTENTS: Set<string> = new Set([
  'build', 'script', 'terrain', 'ui', 'npc', 'vehicle',
  'particle', 'image', 'mesh', 'idea',
])

const VALID_ASSET_TYPES: Set<string> = new Set([
  'Part', 'Model', 'Script', 'LocalScript', 'ModuleScript',
  'Sound', 'ParticleEmitter', 'UI',
])

const VALID_COMPLEXITIES: Set<string> = new Set([
  'simple', 'medium', 'complex', 'epic',
])

const COMPLEXITY_CREDIT_MAP: Record<Complexity, number> = {
  simple: 1,
  medium: 2,
  complex: 5,
  epic: 10,
}

function sanitizeIntent(raw: unknown): PromptIntent {
  if (typeof raw === 'string' && VALID_INTENTS.has(raw)) return raw as PromptIntent
  return 'build'
}

function sanitizeAssetType(raw: unknown): AssetType {
  if (typeof raw === 'string' && VALID_ASSET_TYPES.has(raw)) return raw as AssetType
  return 'Part'
}

function sanitizeComplexity(raw: unknown): Complexity {
  if (typeof raw === 'string' && VALID_COMPLEXITIES.has(raw)) return raw as Complexity
  return 'medium'
}

function sanitizeStep(raw: Record<string, unknown>, index: number): EnhancedPromptStep {
  return {
    stepNumber: typeof raw.stepNumber === 'number' ? raw.stepNumber : index + 1,
    action: typeof raw.action === 'string' ? raw.action : 'Build component',
    service: typeof raw.service === 'string' ? raw.service : 'Workspace',
    scriptName: typeof raw.scriptName === 'string' ? raw.scriptName : undefined,
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

function sanitizeAsset(raw: Record<string, unknown>): EnhancedPromptAsset {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Unnamed',
    type: sanitizeAssetType(raw.type),
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

// ─── System prompt for the planner ──────────────────────────────────────────

function buildPlannerSystemPrompt(scale: BuildScale, targets: { min: number; target: number; max: number }): string {
  const scaleRules: Record<BuildScale, string> = {
    prop: `This is a PROP (small object). Target ${targets.target} parts. Use 2+ materials, add detail parts (handles, knobs, labels). Scale relative to Roblox character (5.5 studs tall).`,
    furniture: `This is FURNITURE. Target ${targets.target} parts. Include legs/supports, cushions (Fabric), hardware (small Cyl knobs). Seat height at Y=2.5 for sitting.`,
    vehicle: `This is a VEHICLE. Target ${targets.target} parts. Chassis + hood + trunk + roof. 4 Cyl wheels. Glass windshield (transparency 0.3). Neon headlights + SpotLight. VehicleSeat with MaxSpeed/TurnSpeed/Torque.`,
    building: `This is a BUILDING. Target ${targets.target} parts. EXTERIOR-FIRST (facade, no interior unless user asks). Layered foundation (2-3 stepped layers). Corner posts + crown trim. Glowing windows (SpotLight behind Glass). Interaction zone (Neon circle + SurfaceGui + ProximityPrompt) at entrance. USE FOR LOOPS for repeated windows, fence posts, trim pieces.`,
    scene: `This is a SCENE/ENVIRONMENT. Target ${targets.target} parts. Central focal point. Terrain ground (FillBlock, never part-based ground). Trees (Cyl trunk + Ball canopy via loop). Paths with alternating tile colors. Street lamps via loop. Atmosphere + Bloom + ColorCorrection.`,
    map: `This is a GAME MAP. Target ${targets.target} parts. Central hub at (0,0,0), zones radiate outward. Terrain FillBlock 300x300 base. Paths connect zones (alternating tiles via loop). Street lamps every 20-30 studs (loop). Multiple facade buildings with interaction zones. Perimeter fence (loop). HEAVY use of position tables + loops.`,
    world: `This is a FULL WORLD. Target ${targets.target} parts. Multiple distinct zones/biomes. Terrain FillBlock for ground + FillBall for hills + FillBlock for water. Central spawn plaza. Road network. 5+ building facades. Heavy loop usage for vegetation, lamps, fences, decorations. AAA lighting stack mandatory.`,
  }

  return `You are an EXPERT Roblox build architect. You produce DETAILED blueprints that a code-generating AI translates directly to Luau code. Your plans are so precise that the AI barely needs to think — just follow your blueprint.

${scaleRules[scale]}

PART COUNT: minimum ${targets.min}, target ${targets.target}, maximum ${targets.max}.

CRITICAL RULES:
- NEVER use SmoothPlastic material. Use: Concrete, Wood, Brick, Metal, Glass, Fabric, Neon, Cobblestone, Slate, Marble, Granite, DiamondPlate, Foil, Sand, Ice, WoodPlanks, Pebble, CorrodedMetal, ForceField.
- The code uses helper functions: P(parent, name, size, pos, color, material) for Parts, W(parent, name, size, pos, color, angle) for WedgeParts, Cyl(parent, name, size, pos, color, material) for Cylinders, Ball(parent, name, size, pos, color, material) for Balls.
- FOR LOOPS are essential for repeated elements. One loop creating 12 fence posts = 36 parts from 6 lines of code. Always specify what to loop, how many iterations, and spacing.
- Colors are specified as Color3.fromRGB(r, g, b). Plan SPECIFIC RGB values, not vague descriptions.
- Every outdoor build needs: workspace.Terrain:FillBlock for ground, Atmosphere, Bloom, ColorCorrection. Buildings need SunRays too.
- Buildings are FACADES. 90% exterior detail. Glowing windows = SpotLight behind Glass pointing outward.
- Interaction zones: Neon circle pad (6 stud diameter, transparency 0.3) + SurfaceGui label + ProximityPrompt.

Respond ONLY with valid JSON matching this schema:
{
  "intent": "build|script|terrain|ui|npc|vehicle|particle|image|mesh|idea",
  "planSummary": "1-2 sentence summary",
  "sections": [
    {
      "name": "Foundation",
      "partCount": 4,
      "material": "Concrete",
      "color": "140, 140, 140",
      "dimensions": "26x1x22 studs base layer, 24x1x20 second layer",
      "useLoop": false,
      "loopSpec": "",
      "details": "3-layer stepped foundation. Bottom layer widest (26x1x22), middle (24x1x20), top (22x0.5x18). Dark grey concrete. Each layer centered, creating visible stepped edges."
    },
    {
      "name": "Windows (Front Wall)",
      "partCount": 24,
      "material": "Glass",
      "color": "200, 220, 255",
      "dimensions": "2x3x0.1 glass, 0.3x3x0.3 frame pieces",
      "useLoop": true,
      "loopSpec": "FOR i=1,4: create window at X offset i*5. Each window = glass pane + 4 frame pieces + mullion + sill. Place SpotLight behind each glass (Range 15, Brightness 0.8, warm color) for inhabited glow.",
      "details": "4 identical windows across front wall, evenly spaced. Each: Glass pane (transparency 0.3, SurfaceLight behind), 4-piece Wood frame (dark brown 80,50,30), horizontal mullion dividing glass in half, protruding sill (0.5 stud out)."
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "action": "Create foundation and floor",
      "service": "Workspace",
      "description": "Layered concrete foundation: 3 stepped layers each narrower than below. Floor on top."
    }
  ],
  "assetCount": 5,
  "assets": [
    {
      "name": "HouseModel",
      "type": "Part|Model|Script|LocalScript|ModuleScript|Sound|ParticleEmitter|UI",
      "description": "Main building model containing all structural parts"
    }
  ],
  "foundationType": "layered|basic|circular|none",
  "lightingSetup": "Future technology, Atmosphere (Density 0.3, Color 180,195,220), Bloom (Intensity 0.4, Size 30), ColorCorrection (Brightness 0.05, Contrast 0.1, Saturation 0.15), SunRays (Intensity 0.1, Spread 0.3). SpotLights behind all windows (Range 15, Brightness 0.8, Color 255,240,200).",
  "forLoopSpecs": [
    "4 front windows: loop i=1,4, each at X = startX + i*5, 6 parts per window",
    "12 fence posts: loop i=1,12, each at Z = i*4, Cyl post + horizontal rail",
    "6 trees: loop with positions table, each = Cyl trunk (random height 8-12) + Ball canopy (random size 4-6)"
  ],
  "styleDirective": "Rustic cottage style. Walls: Brick (180,160,140). Roof: Wood (120,70,40). Trim: Wood (200,180,160). Foundation: Concrete (100,100,100). Door: Wood (90,55,25). Windows: Glass with warm SpotLight glow. Neon accents on interaction zone only.",
  "estimatedComplexity": "simple|medium|complex|epic",
  "estimatedCredits": 2,
  "enhancedPrompt": "A short natural-language description of what to build (2-3 sentences max). NOT a spec sheet. NOT numbered steps. Write it like talking to a friend: 'Build a solid oak tree — thick trunk tapering up, three big branches, full bushy canopy of overlapping spheres, roots at the base.' The sections array above has all the technical details — this field is just the vibe."
}

SECTION PLANNING RULES:
- Every building needs: Foundation, Walls (split per side: Front/Back/Left/Right), Roof, Door+Frame, Windows, Exterior Detail (trim/cornices), Landscaping, Lighting, Interaction Zone
- For each section: specify EXACT part count, material, RGB color, dimensions in studs
- If a section has repeated elements (windows, fence posts, tiles, lamps, trees), set useLoop=true and write a specific loopSpec
- Foundation types: "layered" (2-3 stepped layers, each narrower) for buildings, "circular" (concentric Cyl layers) for fountains/plazas, "basic" (single slab) for simple, "none" for vehicles/props
- Lighting ALWAYS includes the full AAA stack for outdoor builds. ALWAYS include SpotLights behind Glass windows.
- The enhancedPrompt should be SO detailed that a code AI just translates it line by line. Include specific RGB values, exact dimensions, loop counts, material names.
- Total parts across all sections should hit the target of ${targets.target} (minimum ${targets.min}).
- Keep the JSON clean, no markdown, no extra text outside the JSON.

STYLE MODIFIER INTEGRATION (CRITICAL):
- The user message may include a [STYLE_MODIFIERS] block with extracted mood, palette, materials, lighting, and environment.
- If present, you MUST use those specific RGB colors, materials, and lighting in your sections. Do NOT invent your own palette.
- The palette colors should map to your sections: primary → walls, secondary → trim/frames, accent → doors/decorations, etc.
- The preferred materials list should be used for the majority of parts. Only deviate for specific functional needs (Glass for windows, Neon for lights).
- Environment elements should become their own sections in your blueprint (e.g., "Surrounding Trees", "Snow Cover", "Water Feature").
- A "cozy cottage in the woods" is NOT the same as a "futuristic cottage in the city". Every adjective changes the build.`
}

// ─── Vague prompt expansion ─────────────────────────────────────────────────

/**
 * Detects short/vague prompts and expands them with specific architectural details.
 * This runs BEFORE the AI planner to give it much better input.
 * Returns the original prompt unchanged if it's already detailed enough.
 */
export function expandVaguePrompt(prompt: string): string {
  const trimmed = prompt.trim()
  const lower = trimmed.toLowerCase()
  const wordCount = trimmed.split(/\s+/).length

  // Only expand if the prompt is short/vague (under 12 words)
  if (wordCount > 12) return trimmed

  // ── Direct match expansions for common vague prompts ──

  const vagueExpansions: { pattern: RegExp; expansion: string }[] = [
    // Buildings
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?house$/i,
      expansion: 'build a detailed 2-story suburban house with brick walls (Brick material, 180,140,120), gable roof with shingles (Wood, 120,70,40), front porch with 4 wooden columns, 6 windows with wooden frames and glass panes with warm SpotLight glow behind each, chimney on the right side, front door with frame and knob, landscaped yard with 4 trees (Cyl trunk + Ball canopy), white picket fence around perimeter via for loop, stone pathway to front door, mailbox near sidewalk, exterior wall trim and crown molding' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?castle$/i,
      expansion: 'build a medieval castle with thick stone walls (Cobblestone material, 140,140,140), 4 corner towers with cone roofs and battlements (crenellations via alternating Parts), main gate with iron portcullis (Metal, dark gray), drawbridge over moat (blue Glass water), courtyard with central stone fountain, main keep building with throne room entrance, wall-mounted torches with PointLight (warm orange glow) every 8 studs via for loop, arrow slit windows, flying banner Parts on towers, guard patrol walkway on walls' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?shop$/i,
      expansion: 'build a detailed shop with brick storefront (Brick, 180,120,100), large display window with wooden frame and Glass pane (transparency 0.3, SpotLight behind), striped fabric awning over window (Fabric, alternating red/white), hanging wooden sign with shop name (SurfaceGui), wooden door with brass knob and small bell Part, counter with register inside, 3 wall shelves with small item Parts, pendant lamp above counter, welcome mat at entrance, street lamp outside, flower box under window' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?tower$/i,
      expansion: 'build a tall medieval stone tower with circular base (Cobblestone, 130,130,130), 5 floor levels getting slightly narrower upward, small arched windows on each level via for loop, wooden balcony at top level with railing, cone-shaped roof (WedgeParts, Wood 100,60,30), spiral staircase inside (Part steps in circular for loop), iron door at base with ProximityPrompt, wall-mounted torch every 2 floors, flag on peak, stone foundation wider than tower' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?bridge$/i,
      expansion: 'build a stone arch bridge spanning 40 studs with 3 arches underneath (WedgeParts + curved Parts), stone railings on both sides with pillar posts every 6 studs via for loop, cobblestone road surface (Cobblestone, 160,160,155), decorative lamp posts on railings every 12 studs with PointLight (warm glow), moss/vine detail Parts on arch undersides (green, Grass material), river of blue Glass Parts underneath, approach ramps on both ends' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?car$/i,
      expansion: 'build a detailed car with chassis body (Metal, 200,30,30 red), separate hood/trunk/roof panels, 4 cylindrical wheels (Cyl, black rubber), glass windshield and rear window (Glass transparency 0.3), Neon headlights with SpotLight (white, Range 30), red Neon tail lights, side mirrors (small Parts), door outlines, bumpers front and rear, VehicleSeat with MaxSpeed 80 and Torque 500, exhaust pipe, license plate Part with SurfaceGui' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?tree$/i,
      expansion: 'build a detailed tree with thick cylindrical trunk (Cyl, Wood material, 100,70,40) slightly tapered upward, 3 main branch Cyl Parts splitting from top of trunk at different angles, large Ball canopy clusters (5-7 overlapping Balls of varying size 4-8 studs, Grass material, varying greens 60-100,140-180,50-80), exposed root Parts at base, small leaf particle ParticleEmitter in canopy, trunk knot detail Parts' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?boat$/i,
      expansion: 'build a wooden boat with hull (Wood material, 140,90,40) shaped using WedgeParts for bow taper, flat deck on top, wooden railing around edges with vertical posts via for loop, small cabin with Glass windows and door, mast with cylindrical pole (Cyl, tall) and fabric sail Part (Fabric, white), anchor on chain (small Parts), VehicleSeat for captain, PointLight lantern hanging from cabin, rope coil detail on deck' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?school$/i,
      expansion: 'build a school building with red brick facade (Brick, 180,80,70), main entrance with double doors and concrete steps, 12 classroom windows in 2 rows via for loop with Glass panes and SpotLight glow, flat roof with rooftop AC units, American flag on pole, "SCHOOL" lettering SurfaceGui above entrance, covered walkway with columns, playground area with swing set and slide Models, parking lot with painted lines, bicycle rack, green lawn with trees' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?restaurant$/i,
      expansion: 'build a restaurant with brick and wood exterior (Brick lower half 160,100,80, WoodPlanks upper 180,150,120), large front window with warm SpotLight glow, fabric awning (Fabric, burgundy), hanging sign with restaurant name SurfaceGui, wooden front door with bell, outdoor seating area with 3 tables and chairs, menu board SurfaceGui by entrance, flower pots flanking door, chimney with smoke ParticleEmitter, street lamp, interior counter with register and kitchen pass-through window' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?park$/i,
      expansion: 'build a park with central fountain (Cyl base, water ParticleEmitter), 8 trees around perimeter via for loop (Cyl trunk + Ball canopy), cobblestone walking paths in X pattern, 4 wooden benches along paths, playground area with slide and swings, grass terrain (FillBlock, green), flower beds with colorful small Parts, iron fence around perimeter with gate entrance, 6 lamp posts along paths via for loop with PointLight, park sign at entrance with SurfaceGui' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?hospital$/i,
      expansion: 'build a hospital with white concrete facade (Concrete, 240,240,245), 3 stories with rows of windows with pale blue Glass, main entrance with automatic sliding door frame, red cross sign (Neon red Parts) on front, emergency entrance on side with red awning, ambulance parked outside (simple vehicle model), reception desk inside entrance, waiting area with chairs, helipad on roof (circle marking), landscaping with bushes and trees, handicap ramp, parking lot' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?spaceship$/i,
      expansion: 'build a spaceship with sleek metal hull (DiamondPlate, 180,180,200), cockpit with glass canopy (Glass transparency 0.2), 2 engine nacelles on wings with Neon blue glow and ParticleEmitter thrust, delta wing shape using WedgeParts, landing gear (Cyl struts), cargo bay door (moving Part), interior cockpit with VehicleSeat and control panel (SurfaceGui with buttons), hull panel line details, antenna on top, weapon hardpoints under wings, running lights (small Neon Parts)' },

    // Game genres
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?obby$/i,
      expansion: 'build an obby (obstacle course) with colorful platforms at increasing heights, starter platform with checkpoint, 10 jumping platforms with varying gaps (easy to hard), spinning cylinder obstacle, disappearing platforms that fade in/out via TweenService loop, wall jump section, lava floor (Neon red, kills on touch), truss climbing section, zip line, conveyor belt, kill brick sections, checkpoint flags every 5 obstacles, finish podium with confetti ParticleEmitter, difficulty signs' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?(tycoon|factory)$/i,
      expansion: 'build a tycoon with starter plot platform (Concrete, 60x60), coin dropper machine (conveyor belt drops coins into collection bin), upgrade buttons on ground (Neon pads with SurfaceGui price label + ProximityPrompt), factory building that grows with upgrades, conveyor belt Parts, storage container, walls that unlock progressively, auto-collector upgrade, rebirth portal, income display BillboardGui, worker NPCs on conveyor' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?simulator$/i,
      expansion: 'build a simulator game area with themed zone (grassy starting area with collectible orbs spawning via for loop), tool/backpack upgrade shop NPC with ScreenGui, sell pad (Neon green Part with ProximityPrompt), leaderboard display, pet egg area with egg pedestals, rebirth portal (glowing ring), VIP area behind invisible wall (gamepass check), multiple zones connected by paths unlocked at coin thresholds, zone portals with cost SurfaceGui' },
  ]

  for (const { pattern, expansion } of vagueExpansions) {
    if (pattern.test(lower)) {
      return expansion
    }
  }

  // ── Genre detection for "make a game" style prompts ──

  const gamePatterns: { pattern: RegExp; expansion: string }[] = [
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?game$/i,
      expansion: 'build a game lobby with central spawn platform (Marble, 40x40), 4 game mode portals around edges (Neon ring + SurfaceGui with game name), decorative fountain in center, leaderboard display boards, shop NPC, overhead welcome sign (SurfaceGui), ambient lighting with Atmosphere and Bloom, trees and benches around perimeter, paths connecting portals, spectator area balcony above' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?fighting\s+game$/i,
      expansion: 'build a fighting game arena with circular stone platform (Cobblestone, 50 stud diameter), raised edges to prevent ring-out, 4 pillar obstacles for cover, weapon rack Models on sides, spectator seating around arena, health bar UI, score display BillboardGui, dramatic overhead lighting with SpotLights pointing down, lava moat around arena (Neon red), entrance tunnels on 2 sides, champion podium' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?horror\s+game$/i,
      expansion: 'build a horror game environment with abandoned house (dark Concrete walls, broken windows, creaky wooden floor), flickering PointLights (script toggles Enabled), long dark hallways, locked doors requiring keys, hiding spots (closets, under beds), ambient fog (Atmosphere density 0.6), creepy sound ambience, scattered furniture knocked over, blood-red Neon accent lights, boarded-up windows, basement entrance, attic with low ceiling' },
    { pattern: /^(build|make|create)\s+(a\s+|me\s+a\s+)?racing\s+game$/i,
      expansion: 'build a racing game track with smooth asphalt road (Concrete, dark gray, 20 stud wide), banked turns, starting grid with lane markings, finish line with checkered pattern, roadside barriers (Metal), grandstand seating, lap counter display (SurfaceGui), 6 VehicleSeats in car Models at start, street lamps along track via for loop, tunnel section, bridge section, pit stop area, overhead banner signs' },
  ]

  for (const { pattern, expansion } of gamePatterns) {
    if (pattern.test(lower)) {
      return expansion
    }
  }

  // ── Keyword-based expansion for semi-vague prompts ──

  // If short (under 8 words) and contains a recognizable subject, add details
  if (wordCount <= 8) {
    const subjectExpansions: { keywords: string[]; details: string }[] = [
      { keywords: ['house', 'home', 'cabin'],
        details: ' with brick walls, shingled roof, front porch with columns, windows with frames and warm SpotLight glow, front door with knob, chimney, landscaped yard with trees and fence, pathway to entrance' },
      { keywords: ['castle', 'fortress', 'keep'],
        details: ' with stone walls and battlements, corner towers with cone roofs, main gate with portcullis, courtyard fountain, wall torches via for loop, arrow slit windows, moat with drawbridge, flying banners' },
      { keywords: ['shop', 'store', 'market'],
        details: ' with brick storefront, display window with awning, hanging sign with SurfaceGui name, wooden door, counter with register inside, shelves with items, street lamp outside, welcome mat' },
      { keywords: ['city', 'town', 'village'],
        details: ' with multiple building facades along a main street, cobblestone road, street lamps every 20 studs via for loop, central town square with fountain, shop signs, park area with trees and benches, crosswalks' },
      { keywords: ['island', 'tropical'],
        details: ' with sandy beach (Sand material), palm trees via for loop (Cyl trunk + Ball fronds), ocean water (blue Glass), rocky cliffs, small hut with thatched roof, dock with boat, treasure chest, volcano in center, coral reef section' },
      { keywords: ['spaceship', 'spacecraft', 'rocket'],
        details: ' with metal hull (DiamondPlate), cockpit glass canopy, engine nacelles with Neon blue thrust glow, delta wings, landing gear, cargo bay, VehicleSeat cockpit with control panel SurfaceGui, running lights' },
      { keywords: ['dungeon', 'cave', 'underground'],
        details: ' with stone corridors (Cobblestone, dark), torches on walls via for loop with PointLight, locked doors, treasure chests, monster spawn points, trap floor tiles, boss room at the end, crumbling pillars, cobwebs' },
      { keywords: ['school', 'classroom'],
        details: ' with brick facade, rows of windows, main entrance with double doors, flagpole, playground area, parking lot, hallways with lockers, classroom desks, chalkboard, gym building' },
      { keywords: ['hospital', 'clinic'],
        details: ' with white concrete exterior, red cross Neon sign, emergency entrance, reception desk, waiting chairs, multiple floor windows, ambulance, helipad on roof, automatic door frame' },
      { keywords: ['pirate', 'ship'],
        details: ' with wooden hull using WedgeParts for bow, 3 masts with fabric sails, crow\'s nest, captain\'s cabin, cannons on sides, anchor, rope railings, plank walkway, treasure hold below deck, Jolly Roger flag' },
      { keywords: ['farm', 'barn'],
        details: ' with red barn (Brick, 180,50,50) with large doors, fenced pasture via for loop, crop plots, farmhouse, windmill, silo, water trough, haybale Parts, tractor model, chicken coop, dirt paths' },
      { keywords: ['arena', 'colosseum', 'stadium'],
        details: ' with circular fighting pit, tiered spectator seating, entrance tunnels, weapon racks, health pickups, dramatic overhead SpotLights, scoreboard SurfaceGui, champion podium, iron gates, sand floor' },
      { keywords: ['temple', 'shrine', 'pyramid'],
        details: ' with stone steps ascending to entrance, tall pillars with ornate capitals, golden accents (Neon, gold), altar inside, torch braziers with fire ParticleEmitter, hieroglyph SurfaceGui on walls, treasure room, guardian statues' },
      { keywords: ['police', 'station'],
        details: ' with concrete building, blue accent stripe, front desk, holding cells with bars, parking lot with police car models, radio tower on roof, evidence room, armory, break room, flagpole, security cameras' },
      { keywords: ['airport', 'runway'],
        details: ' with terminal building (Glass facade), control tower, runway with markings (painted lines), airplane model parked at gate, boarding bridge, luggage carousel inside, check-in counters, waiting area with seats, hangar building' },
      { keywords: ['mountain', 'volcano'],
        details: ' with layered terrain rising to peak, rocky paths, snow cap at top (white material), cave entrance, pine trees on slopes via for loop, waterfall with blue Glass + ParticleEmitter mist, hiking trail, base camp with tent, bridge over ravine' },
    ]

    for (const { keywords, details } of subjectExpansions) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          return trimmed + details
        }
      }
    }
  }

  // Not vague enough to expand, or no matching pattern
  return trimmed
}

// ─── Main enhancer function ─────────────────────────────────────────────────

export async function enhancePrompt(
  rawPrompt: string,
  context?: string,
): Promise<EnhancedPrompt> {
  // ── Step 1: Extract style modifiers from the ORIGINAL prompt (before expansion) ──
  // This captures the user's actual words like "cozy", "in the woods", "at night"
  const styleModifiers = extractStyleModifiers(rawPrompt)

  // Expand vague prompts BEFORE detecting scale and calling AI
  const expandedPrompt = expandVaguePrompt(rawPrompt)

  // Apply scale modifier to part targets
  const scale = detectBuildScale(expandedPrompt)
  const baseTargets = getPartTargets(scale)

  // Adjust targets based on scale modifier
  const scaleAdjust = styleModifiers.scale === 'detailed' ? 2.0 :
    styleModifiers.scale === 'massive' ? 1.5 :
    styleModifiers.scale === 'large' ? 1.3 :
    styleModifiers.scale === 'tiny' ? 0.6 :
    styleModifiers.scale === 'small' ? 0.8 : 1.0
  const targets = {
    min: Math.round(baseTargets.min * scaleAdjust),
    target: Math.round(baseTargets.target * scaleAdjust),
    max: Math.round(baseTargets.max * scaleAdjust),
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    // Graceful fallback when Groq is not configured — return a minimal plan
    // so the rest of the pipeline still works.
    return buildFallbackPlan(rawPrompt, scale, targets, styleModifiers)
  }

  const groq = new Groq({ apiKey })

  // ── Step 2: Inject style modifiers into the Groq planner prompt ──
  const styleBlock = formatStyleModifiersBlock(styleModifiers)
  const userContent = context
    ? `Context: ${context}\n\nUser request: ${expandedPrompt}\n\nBuild scale: ${scale} (target ${targets.target} parts, min ${targets.min}, max ${targets.max})\n\n${styleBlock}`
    : `${expandedPrompt}\n\nBuild scale: ${scale} (target ${targets.target} parts, min ${targets.min}, max ${targets.max})\n\n${styleBlock}`

  const systemPrompt = buildPlannerSystemPrompt(scale, targets)

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      console.warn('[prompt-enhancer] Empty response from Groq, using fallback')
      return buildFallbackPlan(rawPrompt, scale, targets, styleModifiers)
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return buildEnhancedPromptResult(rawPrompt, parsed, scale, targets, styleModifiers)
  } catch (err) {
    console.error('[prompt-enhancer] Groq API error, using fallback:', err instanceof Error ? err.message : err)
    return buildFallbackPlan(rawPrompt, scale, targets, styleModifiers)
  }
}

// ─── Parse & sanitize the Groq response ─────────────────────────────────────

function sanitizeSection(raw: Record<string, unknown>): BuildSectionPlan {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Section',
    partCount: typeof raw.partCount === 'number' ? raw.partCount : 5,
    material: typeof raw.material === 'string' ? raw.material : 'Concrete',
    color: typeof raw.color === 'string' ? raw.color : '140, 140, 140',
    dimensions: typeof raw.dimensions === 'string' ? raw.dimensions : '',
    useLoop: typeof raw.useLoop === 'boolean' ? raw.useLoop : false,
    loopSpec: typeof raw.loopSpec === 'string' ? raw.loopSpec : undefined,
    details: typeof raw.details === 'string' ? raw.details : '',
  }
}

function buildEnhancedPromptResult(
  originalPrompt: string,
  parsed: Record<string, unknown>,
  scale: BuildScale,
  targets: { min: number; target: number; max: number },
  styleModifiers?: StyleModifiers,
): EnhancedPrompt {
  const intent = sanitizeIntent(parsed.intent)
  const complexity = sanitizeComplexity(parsed.estimatedComplexity)

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : []
  const steps = rawSteps.map((s: unknown, i: number) =>
    sanitizeStep((s && typeof s === 'object' ? s : {}) as Record<string, unknown>, i),
  )

  const rawAssets = Array.isArray(parsed.assets) ? parsed.assets : []
  const assets = rawAssets.map((a: unknown) =>
    sanitizeAsset((a && typeof a === 'object' ? a : {}) as Record<string, unknown>),
  )

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : []
  const sections = rawSections.map((s: unknown) =>
    sanitizeSection((s && typeof s === 'object' ? s : {}) as Record<string, unknown>),
  )

  const rawForLoops = Array.isArray(parsed.forLoopSpecs) ? parsed.forLoopSpecs : []
  const forLoopSpecs = rawForLoops.filter((s: unknown): s is string => typeof s === 'string')

  return {
    originalPrompt,
    intent,
    planSummary: typeof parsed.planSummary === 'string' ? parsed.planSummary : `Build: ${originalPrompt}`,
    steps,
    assetCount: typeof parsed.assetCount === 'number' ? parsed.assetCount : assets.length,
    assets,
    styleDirective: typeof parsed.styleDirective === 'string'
      ? parsed.styleDirective
      : 'Use Concrete, Wood, Brick, Metal materials with realistic colors.',
    estimatedComplexity: complexity,
    estimatedCredits: typeof parsed.estimatedCredits === 'number'
      ? parsed.estimatedCredits
      : COMPLEXITY_CREDIT_MAP[complexity],
    enhancedPrompt: typeof parsed.enhancedPrompt === 'string'
      ? parsed.enhancedPrompt
      : originalPrompt,
    // v2 blueprint fields
    buildScale: scale,
    partTargets: targets,
    sections,
    foundationType: typeof parsed.foundationType === 'string' ? parsed.foundationType : 'basic',
    lightingSetup: typeof parsed.lightingSetup === 'string' ? parsed.lightingSetup : 'Future technology + Atmosphere + Bloom + ColorCorrection',
    exteriorFocus: ['building', 'scene', 'map', 'world'].includes(scale),
    forLoopSpecs,
    // v3 style modifiers
    styleModifiers: styleModifiers || extractStyleModifiers(originalPrompt),
  }
}

// ─── Fallback when Groq is unavailable ──────────────────────────────────────

function buildFallbackPlan(
  rawPrompt: string,
  scale?: BuildScale,
  targets?: { min: number; target: number; max: number },
  modifiers?: StyleModifiers,
): EnhancedPrompt {
  const s = scale || detectBuildScale(rawPrompt)
  const t = targets || getPartTargets(s)
  const sm = modifiers || extractStyleModifiers(rawPrompt)
  return {
    originalPrompt: rawPrompt,
    intent: 'build',
    planSummary: rawPrompt,
    steps: [
      {
        stepNumber: 1,
        action: 'Build the requested content',
        service: 'Workspace',
        description: rawPrompt,
      },
    ],
    assetCount: 1,
    assets: [],
    styleDirective: `Use ${sm.materials.join(', ')} materials. Palette: ${sm.palette.map(c => `${c.name} (${c.rgb})`).join(', ')}. Default SmoothPlastic for modern look.`,
    estimatedComplexity: 'medium',
    estimatedCredits: 2,
    enhancedPrompt: rawPrompt,
    buildScale: s,
    partTargets: t,
    sections: [],
    foundationType: ['building', 'scene', 'map', 'world'].includes(s) ? 'layered' : 'basic',
    lightingSetup: sm.lightingOverride,
    exteriorFocus: ['building', 'scene', 'map', 'world'].includes(s),
    forLoopSpecs: [],
    styleModifiers: sm,
  }
}

// ─── Helper: format enhanced plan as context for the main AI ────────────────

/**
 * Formats an EnhancedPrompt into a system-prompt-injectable context block.
 * Include this in the main AI's system prompt to give it a structured plan
 * to follow, resulting in higher quality output.
 */
export function formatEnhancedPlanContext(plan: EnhancedPrompt): string {
  const lines: string[] = []

  lines.push('[ARCHITECT_BLUEPRINT]')
  lines.push(`Summary: ${plan.planSummary}`)
  lines.push(`Scale: ${plan.buildScale} | Parts: target ${plan.partTargets.target} (min ${plan.partTargets.min}, max ${plan.partTargets.max})`)
  lines.push(`Intent: ${plan.intent} | Complexity: ${plan.estimatedComplexity}`)
  lines.push(`Foundation: ${plan.foundationType}`)
  lines.push(`Exterior-first: ${plan.exteriorFocus ? 'YES — facade only, no interior unless user asked' : 'no'}`)
  lines.push(`Style: ${plan.styleDirective}`)
  lines.push('')

  // ── v3: Inject style modifiers from user prompt analysis ──
  if (plan.styleModifiers) {
    lines.push(formatStyleModifiersBlock(plan.styleModifiers))
    lines.push('')
  }

  // Detailed section blueprints — the core upgrade
  if (plan.sections.length > 0) {
    lines.push('=== SECTION-BY-SECTION BLUEPRINT ===')
    lines.push('Follow these sections IN ORDER. Use P()/W()/Cyl()/Ball() helpers. Use FOR loops where specified.')
    lines.push('')
    let totalPlannedParts = 0
    for (const sec of plan.sections) {
      totalPlannedParts += sec.partCount
      lines.push(`--- ${sec.name} (${sec.partCount} parts) ---`)
      lines.push(`  Material: ${sec.material} | Color: Color3.fromRGB(${sec.color})`)
      lines.push(`  Dimensions: ${sec.dimensions}`)
      if (sec.useLoop && sec.loopSpec) {
        lines.push(`  FOR LOOP: ${sec.loopSpec}`)
      }
      lines.push(`  Details: ${sec.details}`)
      lines.push('')
    }
    lines.push(`Total planned parts across sections: ${totalPlannedParts}`)
    lines.push('')
  }

  // FOR loop specifications
  if (plan.forLoopSpecs.length > 0) {
    lines.push('=== FOR LOOP SPECIFICATIONS ===')
    lines.push('These MUST be implemented as for loops, not individual P() calls:')
    for (const spec of plan.forLoopSpecs) {
      lines.push(`  - ${spec}`)
    }
    lines.push('')
  }

  // Lighting setup
  if (plan.lightingSetup) {
    lines.push('=== LIGHTING SETUP ===')
    lines.push(plan.lightingSetup)
    lines.push('')
  }

  // Build steps (execution order)
  if (plan.steps.length > 0) {
    lines.push('=== EXECUTION ORDER ===')
    for (const s of plan.steps) {
      lines.push(`  ${s.stepNumber}. [${s.service}] ${s.action} — ${s.description}${s.scriptName ? ` (${s.scriptName})` : ''}`)
    }
    lines.push('')
  }

  // Assets
  if (plan.assets.length > 0) {
    lines.push(`=== ASSETS (${plan.assetCount}) ===`)
    for (const a of plan.assets) {
      lines.push(`  - ${a.name} (${a.type}): ${a.description}`)
    }
    lines.push('')
  }

  lines.push('=== BUILD VISION (what to describe to the user) ===')
  lines.push(plan.enhancedPrompt)
  lines.push('')
  lines.push('IMPORTANT: The sections above are your INTERNAL blueprint. Do NOT show them to the user. Instead, describe the build in 3-5 casual sentences — paint the vibe, not the spec sheet. Then output the Luau code.')
  lines.push('REMEMBER: Use P()/W()/Cyl()/Ball() helpers. Use FOR loops for repeated elements. NEVER use SmoothPlastic. Hit the part target.')

  // ── v4: Prompt expansion templates, blueprint injection, reference games ──

  const expanded = expandPromptTemplate(plan.originalPrompt)
  if (expanded) {
    lines.push('')
    lines.push('=== EXPANDED PROMPT SPECIFICATION ===')
    lines.push('The user\'s prompt matched a known building type. Use this detailed spec as your build guide:')
    lines.push(expanded)
    lines.push('=== END EXPANDED SPEC ===')
  }

  const blueprintCtx = injectBlueprintContext(plan.originalPrompt)
  if (blueprintCtx) {
    lines.push('')
    lines.push(blueprintCtx)
  }

  const refGame = injectReferenceGameContext(plan.originalPrompt)
  if (refGame) {
    lines.push('')
    lines.push('=== REFERENCE GAME CONTEXT ===')
    lines.push('This prompt matches a known game genre. Reference this for scripting patterns and structure:')
    lines.push(refGame)
    lines.push('=== END REFERENCE ===')
  }

  lines.push('[/ARCHITECT_BLUEPRINT]')

  return lines.join('\n')
}

// ─── Prompt expansion templates ──────────────────────────────────────────────

/**
 * Checks if a raw prompt matches a common building/structure type and returns
 * a MUCH more detailed expanded specification. Returns null if no match.
 * Use this to give the AI very precise construction details for known types.
 */
export function expandPromptTemplate(rawPrompt: string): string | null {
  const lower = rawPrompt.toLowerCase()

  // Helper: check if any keyword appears in the prompt
  const has = (...words: string[]) => words.some(w => lower.includes(w))

  // ── RESIDENTIAL ──

  if (has('house', 'home', 'suburb') && !has('tree', 'house') && !has('store')) {
    return `Build a two-story suburban house. EXTERIOR: WoodPlanks siding walls (Color3.fromRGB(220,200,175)), Slate gable roof with 0.5-stud overhang (Color3.fromRGB(80,75,70)), 6 glass windows (2x3 each, Glass transparency 0.25, SpotLight behind Color 255,240,200 Brightness 0.8), front door (Wood Color3.fromRGB(100,60,30) with small knob Cyl), brick chimney on right side (Brick Color3.fromRGB(160,100,80)), rain gutters along roof edge (thin Metal parts), front porch with 4 Cyl columns (Wood), concrete front steps (3 steps Concrete 160,160,160). INTERIOR: living room (couch = 3 Parts Fabric 140,90,70, TV = flat black Part with Neon screen, coffee table = WoodPlanks), kitchen (counter L-shape WoodPlanks, stove = Metal box + Neon burners, fridge = tall white Metal Part), bedroom (bed = frame Wood + mattress Fabric 200,200,220, dresser 3 drawers, bedside lamp PointLight warm), bathroom (toilet Cyl+Box white, sink Box white, tub long Box), wooden staircase connecting floors (10 steps = loop, Wood WoodPlanks). LANDSCAPING: grass yard (Terrain FillBlock Grass), stone path to door (Cobblestone alternating tiles via loop), 2 round bushes (Ball Parts Grass 70,130,60), mailbox (WoodPlanks box + Cyl post), white picket fence perimeter (loop, Wood posts + horizontal rails). LIGHTING: warm PointLights (Color3.fromRGB(255,220,180) Brightness 0.6 Range 20) in every room, porch SpotLight, Atmosphere (Density 0.25, Color 200,210,220), Bloom (Intensity 0.3). Materials: WoodPlanks walls, Slate roof, Glass windows, Brick chimney, Concrete foundation. Minimum 80 parts.`
  }

  if (has('castle', 'fortress', 'medieval keep')) {
    return `Build a medieval castle with: WALLS: 4 thick outer walls (Cobblestone Color3.fromRGB(130,125,120) 40x12x3 each), battlement crenellations via loop (alternating merlons 2x3x2 and gaps 2x3x1, 10 per wall side), wall-walk platform behind battlements. TOWERS: 4 corner towers (Cyl 5 stud radius, 16 studs tall, same Cobblestone), cone roofs on each (WedgeParts in octagonal arrangement, Slate 80,75,70), arrow-slit windows on each tower level (loop, small Glass openings). GATE: main gatehouse front-center, portcullis (Metal grid of Cyl bars, dark gray Color3.fromRGB(50,50,55)), drawbridge (Wood planks over moat, hinged look). MOAT: blue Glass water ring around base (Glass transparency 0.4 Color3.fromRGB(60,100,160)). COURTYARD: inner courtyard 30x30, central stone fountain (Cyl base + Cyl bowl + Cyl jet Part white), stone path to keep. KEEP: central 3-story tower building (Cobblestone 14x28x14), Slate roof, arched entrance. DETAILS: wall-mounted iron torches every 8 studs via loop (PointLight warm Color3.fromRGB(255,180,80) Range 15 Brightness 0.7), flying banner Parts on each tower top (Fabric red+gold), stone steps inside towers (loop). LIGHTING: ClockTime 14, dark stone atmosphere (Density 0.3 Color 160,165,170), Bloom (0.2). Minimum 100 parts.`
  }

  if (has('tycoon')) {
    return `Build a tycoon starter plot with: BASE PLOT: flat concrete platform 60x60 studs (Concrete Color3.fromRGB(100,100,105)), bright boundary edge line (Neon Color3.fromRGB(50,200,255) 0.3 stud wide border via loop). COIN DROPPER: machine at back of plot (Metal box 4x6x4, conveyor belt Part on top = DiamondPlate, coin Parts spawning = small Cyl gold Color3.fromRGB(255,200,50), collection bin at end). UPGRADE BUTTONS: 5 ground-level pads in a row (Neon parts, each different color, SurfaceGui price label, ProximityPrompt "Buy" with cost icon), spacing 8 studs apart via loop. FACTORY SHELL (unlocks at upgrade 1): simple building facade (Metal walls, Glass windows, roll-up door frame), conveyor belt inside running along floor. STORAGE CONTAINER (upgrade 2): Metal container 8x4x4 at side of plot. WALLS: 4 plot boundary walls that unlock progressively (thin invisible Parts that become visible with Neon trim). AUTO-COLLECTOR (upgrade 3): floor vacuum pad (Neon green circle), income BillboardGui above it. REBIRTH PORTAL: at far end, glowing ring (Neon Cyl outline, ParticleEmitter sparkles, SurfaceGui "REBIRTH x2 income"). LIGHTING: Neon accents on all interactive parts, Atmosphere (Density 0.2), Bloom (Intensity 0.4, Size 30). Minimum 60 parts.`
  }

  if (has('obby', 'obstacle course')) {
    return `Build an obstacle course (obby) with: START PLATFORM: large safe spawn platform (Concrete 20x2x20 bright Color3.fromRGB(80,160,80)), checkpoint sign SurfaceGui "START", welcome archway. SECTION 1 - GAPS: 8 jumping platforms (Neon + Concrete, varying sizes 4x1x4 to 2x1x2, increasing gaps from 4 to 8 studs, heights vary +2 studs each). SECTION 2 - SPINNER: horizontal spinning cylinder (Cyl 16 stud long, Neon red, script rotates CFrame at 120 deg/s), platforms to jump to on each side. SECTION 3 - DISAPPEARING: 6 platforms on timer (SurfaceGui countdown, TweenService transparency 0→1 loop, Concrete Color3.fromRGB(200,80,80)). SECTION 4 - LAVA FLOOR: narrow path over lava (Neon orange floor = kill brick, platforms 2 studs wide across, zigzag layout). SECTION 5 - TRUSS CLIMB: tall vertical truss (Truss Part 2x20x2) leading to next section, small landing at top. SECTION 6 - CONVEYOR: conveyor belt working against player (DiamondPlate, velocity -20 via BodyVelocity), must sprint. SECTION 7 - KILLBRICKS: alternating safe/kill checkered floor (loop, safe = Concrete green, kill = Neon red). FINISH: raised podium (Marble white), "FINISH" Neon text SurfaceGui, confetti ParticleEmitter (multi-color burst). CHECKPOINTS: flag Parts every 3 sections (loop, Color3 gold Neon). LIGHTING: colorful Bloom, bright ClockTime 14. Minimum 70 parts.`
  }

  if (has('cafe', 'coffee shop', 'coffeehouse')) {
    return `Build a cozy cafe with: EXTERIOR: brick storefront (Brick Color3.fromRGB(160,110,80) 20x12x16 building), striped fabric awning over window (Fabric alternating brown/cream via loop), large display window (Glass transparency 0.2 with warm SpotLight glow Color3.fromRGB(255,230,190)), wooden front door with small bell Part overhead (Bell = Cyl gold), hanging sign SurfaceGui "CAFE" with coffee cup icon above door, window box with flower Parts (small colored Balls), outdoor bistro table + 2 chairs (Wood WoodPlanks). INTERIOR: service counter L-shape (WoodPlanks Color3.fromRGB(130,90,55) with Glass front), espresso machine (Metal box + Cyl spouts + Neon buttons), pastry display case (Glass box with small food Parts inside), cash register (Metal box + Neon screen SurfaceGui), menu chalkboard SurfaceGui on wall. SEATING AREA: 4 tables (round WoodPlanks) each with 2-4 chairs (Wood with Fabric seat cushions Color3.fromRGB(120,70,50)), hanging pendant lamps above each table (PointLight Color3.fromRGB(255,220,160) Brightness 0.5 Range 12), bookshelf on one wall (WoodPlanks shelves with small Part books). WALLS/FLOOR: exposed brick accent wall (Brick Color3.fromRGB(160,100,70)), WoodPlanks floor (warm brown Color3.fromRGB(140,90,50)), ceiling beams (WoodPlanks dark). LIGHTING: very warm atmosphere, Bloom Intensity 0.4, ColorCorrection TintColor (255,245,225). Minimum 75 parts.`
  }

  if (has('school', 'classroom', 'elementary') && !has('fish')) {
    return `Build a school building with: EXTERIOR: red brick facade (Brick Color3.fromRGB(180,80,70) 50x14x30), flat roof with rooftop HVAC boxes (Metal gray), main entrance double doors (dark Wood with Glass panels), concrete steps (3 steps, loop), 12 classroom windows in 2 rows of 6 via loop (Glass transparency 0.25, SpotLight behind each, WoodPlanks frames), American flag on metal pole (Fabric red/white/blue layers), "SCHOOL" SurfaceGui sign above entrance, concrete foundation border (Concrete Color3.fromRGB(160,160,165)). CLASSROOMS (2): each room has rows of 5 desks (WoodPlanks desktop + Metal legs via inner loop), teacher's desk at front (larger WoodPlanks), chalkboard SurfaceGui on wall (dark green Part), globe prop (Ball Neon), bookshelf on side wall. HALLWAY: connecting hallway (Concrete floor, Metal locker row both sides via loop 10 lockers each, ceiling fluorescent lights = white flat Parts via loop). GYM BUILDING: attached box structure (Concrete 30x16x20), basketball hoop pair (Metal pole + Cyl ring), hardwood floor (WoodPlanks). CAFETERIA AREA: long tables with attached bench seats (WoodPlanks, Metal legs, 3 tables via loop), lunch counter at one end. EXTERIOR: playground with swing set (Metal frame + Fabric seat chains), slide (WedgePart Neon yellow), trees via loop (Cyl + Ball canopy). LIGHTING: bright fluorescent interior (white SpotLights), Atmosphere Density 0.2. Minimum 90 parts.`
  }

  if (has('hospital', 'clinic', 'medical center')) {
    return `Build a hospital with: EXTERIOR: white concrete building (Concrete Color3.fromRGB(240,240,245) 50x18x35 main block), large red cross sign (Neon red Parts mounted on front), 3 floors of windows via loop (pale blue Glass transparency 0.3, each with metal frame), main entrance automatic door frame (Metal), "EMERGENCY" red awning on side entrance (Fabric red Color3.fromRGB(200,30,30)), concrete ramp + steps, flagpole with flag, parking lot stripes via loop. LOBBY: reception desk (white Marble counter, Metal frame), waiting chairs in rows (Metal legs + Fabric seat Color3.fromRGB(100,140,200) via loop x6), wall-mounted TV Part (flat black SurfaceGui), tiled floor (Concrete white + gray alternating via loop), overhead fluorescent lights (white flat Parts via loop). EXAM ROOM: exam table (white Metal + Fabric), wall equipment panel SurfaceGui, privacy curtain (thin Fabric Part), sink (white Ceramic Metal box). ER BAY: gurney (Metal frame + white Fabric), IV stand (thin Cyl Metal), monitor Part (SurfaceGui vitals). ROOFTOP: helipad (Concrete circle with H marking = flat Neon yellow Parts), rooftop AC units (Metal boxes), safety railing loop. AMBULANCE: simple vehicle parked outside (white Metal body, red Neon stripe, Cyl wheels). LIGHTING: clinical white interior lights, exterior Atmosphere Density 0.2, Bloom 0.2. Minimum 85 parts.`
  }

  if (has('police station', 'police') && has('station')) {
    return `Build a police station with: EXTERIOR: gray concrete building (Concrete Color3.fromRGB(150,150,160) 40x12x30), blue accent horizontal stripe (Neon Color3.fromRGB(30,80,200) runs along facade), "POLICE" SurfaceGui above main entrance, flagpole, security camera Props on corners (small Cyl + box), parking lot with 2 police car models (white Metal body + blue Neon light bar + Cyl wheels). LOBBY: front desk (heavy Concrete counter), waiting bench (Metal + Fabric), cork board SurfaceGui on wall (wanted posters), tiled floor alternating loop, fluorescent ceiling lights loop. HOLDING CELLS: row of 3 cells (thick Metal bar door via loop of Cyl bars, Concrete walls, metal bench inside each, barred window). OFFICES: 4 desks (WoodPlanks) with computer screens (SurfaceGui flat Part), filing cabinets (Metal), partition walls between desks. ARMORY: locked metal door, gun rack (Metal frame), equipment lockers (Metal boxes via loop). BREAK ROOM: small table + chairs, coffee machine, fridge. GARAGE: attached 2-car garage bay (Concrete floor, Metal roll-up door frame, police car inside). RADIO TOWER: Metal tower on roof (Cyl mast + cross arms + Neon blink light). LIGHTING: interior white fluorescents, exterior spotlight on entrance, Atmosphere Density 0.25. Minimum 80 parts.`
  }

  if (has('fire station', 'firehouse')) {
    return `Build a fire station with: EXTERIOR: classic red brick building (Brick Color3.fromRGB(190,60,50) 40x14x30), large white bay doors (3 bays, white Metal roll-up frames), "FIRE STATION" SurfaceGui sign on facade, brass pole visible inside (Cyl gold Color3.fromRGB(200,170,80) running from 2nd floor to bay), American flag + department flag on poles. GARAGE BAYS: 3 large bays (Concrete floor Color3.fromRGB(100,100,105)), fire truck model in center bay (red Metal body, Cyl wheels, ladder on top = Metal rungs via loop, Neon emergency lights), hose racks on wall (Cyl coiled Parts orange), equipment wall with axes, shovels (simple Parts). LIVING QUARTERS (2nd floor): kitchen (counter + stove + fridge WoodPlanks/Metal), dining table (Wood 8-seater, chairs Fabric), bunk beds (Wood frame + Fabric mattress, 4 bunks via loop), TV room with couch (Fabric). TRAINING AREA (yard): concrete practice pad, metal training tower (3 stories Metal frame + ladder), practice hose connection (Cyl hydrant red). POLE BAY: brass Cyl pole (Color3.fromRGB(200,170,80)) with platform opening on each floor. EXTERIOR: driveway apron (Concrete), trees flanking building (Cyl + Ball loop x4), fire hydrant (red Cyl + cap). LIGHTING: warm living quarters (PointLight 255,220,180), bright bay lights (white SpotLight), Atmosphere Density 0.2. Minimum 85 parts.`
  }

  if (has('restaurant', 'diner', 'eatery') && !has('cafe')) {
    return `Build a restaurant with: EXTERIOR: brick lower half (Brick Color3.fromRGB(160,100,80)) and WoodPlanks upper half facade (WoodPlanks Color3.fromRGB(180,150,120)), large front window (Glass transparency 0.2, warm SpotLight glow), fabric awning (Fabric burgundy Color3.fromRGB(120,30,50)), hanging sign SurfaceGui, wooden front door, outdoor seating (2 tables, 4 chairs each, WoodPlanks with Metal legs), flower pots flanking door (Cyl terracotta + Ball green). DINING AREA: 6 tables (round WoodPlanks, tablecloth = thin white Fabric Part on top), 4 chairs each (Wood frame + Fabric seat Color3.fromRGB(80,40,30) via loop), wall sconce lamps (PointLight warm Color3.fromRGB(255,220,160) Brightness 0.4 Range 10), framed art Parts on walls (flat Parts with SurfaceGui), hardwood floor (WoodPlanks alternating plank direction), wainscoting trim at half-wall height. BAR AREA: long bar counter (dark WoodPlanks + Granite top), 6 bar stools (Cyl pedestal + Fabric seat via loop), shelves behind bar with bottle Parts (Cyl glass green/brown). KITCHEN (pass-through visible): stainless steel surfaces (Metal), grill/stove Parts, heat lamp over pass window. RESTROOMS: 2 doors labeled M/F SurfaceGui, tile floor (Concrete loop), sink + toilet per room. LIGHTING: warm mood interior, pendant lamps above tables (PointLight 255,200,150 Brightness 0.5 loop), candle Parts on tables (small Neon flame Parts), Bloom Intensity 0.35, ColorCorrection TintColor (255,240,220). Minimum 90 parts.`
  }

  if (has('apartment', 'apartment building', 'flats')) {
    return `Build an apartment building with: EXTERIOR: 4-story concrete and brick building (Concrete Color3.fromRGB(200,195,190) main walls, Brick accent band Color3.fromRGB(160,110,80) at 1st floor), rows of balconies via loop (each balcony = WoodPlanks floor + Metal railing posts + horizontal rail), grid of windows via nested loop (4 floors x 6 units wide, Glass transparency 0.25, warm SpotLight behind each), main lobby entrance with Metal/Glass door, building number SurfaceGui above entrance, mailbox bank (12 small Metal boxes via loop). LOBBY: marble floor (Marble loop tiles), reception desk (Marble counter), elevator doors (Metal, 2 doors slide look), stairwell door. UNIT INTERIORS (show 1 sample unit): open plan living/kitchen (WoodPlanks floor), kitchen counter + fridge + stove (WoodPlanks/Metal), couch (Fabric gray) + TV (flat black SurfaceGui), bedroom (bed + dresser), bathroom (sink + toilet + tub). ROOF: accessible rooftop (Concrete), safety railing loop around perimeter, water tower (Cyl tank + Cyl supports), HVAC units (Metal boxes). EXTERIOR GROUNDS: concrete sidewalk, parking lot loop (white line stripes), trees via loop x4 (Cyl + Ball canopy), bike rack (Metal), dumpster enclosure (Concrete walls). LIGHTING: warm units (PointLight per unit window), lobby white fluorescents, exterior Atmosphere Density 0.25. Minimum 100 parts.`
  }

  if ((has('shop', 'store') || has('market')) && !has('stock')) {
    return `Build a retail shop/store with: EXTERIOR: storefront (Brick Color3.fromRGB(175,120,90) 20x10x16), large display window (Glass transparency 0.15 with warm SpotLight), fabric awning in store color (Fabric Color3.fromRGB(50,100,160)), hanging sign above door (SurfaceGui store name), wooden door with bell prop, potted plants flanking entrance (Cyl terracotta + Ball Grass green), window decal SurfaceGui "OPEN". SALES FLOOR: product display shelves (4 WoodPlanks shelving units, 3 tiers each, small colored Part products on each shelf via loop), central product island display table (WoodPlanks), hanging clothing rack (Metal rod + Cyl hangers via loop if clothing store). COUNTER: checkout counter (WoodPlanks + Glass front display case), cash register (Metal + Neon SurfaceGui screen), credit card reader (small Metal Part), shelf behind counter with products. BACK ROOM: storage shelves (Metal industrial, boxes via loop), staff desk, back exit door. FITTING ROOM: 2 curtained booths (thin Fabric curtain Part + Metal rod). LIGHTING: bright retail lighting (white SpotLights in grid via loop), accent spotlights on display items (SpotLight Brightness 1.5), warm storefront window glow, Bloom Intensity 0.3. Minimum 70 parts.`
  }

  if (has('park') && !has('car') && !has('theme')) {
    return `Build a public park with: TERRAIN: grass base (Terrain FillBlock Grass 100x1x100 Color3.fromRGB(90,160,75)), small hill mound (FillBall terrain). PATHS: cobblestone walking paths in X pattern (Cobblestone Color3.fromRGB(150,140,130) alternating tile via loop), brick border edging along paths (Brick Color3.fromRGB(160,100,80) thin border loop). FOUNTAIN: central fountain (Cyl base 8 stud Marble, Cyl bowl 6 stud Marble Color3.fromRGB(200,195,190), small Cyl center spout, water Part white Glass + ParticleEmitter water spray). TREES: 8 trees around perimeter via for loop (positions table, each = Cyl trunk Wood Color3.fromRGB(100,70,40) + 3 overlapping Ball canopies Grass varying greens). SEATING: 4 wooden benches along paths (WoodPlanks seat + back + Metal legs), 2 picnic tables (WoodPlanks). PLAYGROUND: swing set (Metal A-frame + Cyl top bar + 2 Fabric seat chains + seat), slide structure (Concrete platform + WedgePart slide Neon yellow + ladder rungs via loop). FLOWER BEDS: 4 flower beds (Pebble border, small colored Ball flower Parts clustered). LAMP POSTS: 6 along paths via for loop (Cyl Metal pole + box lamp head + PointLight Color3.fromRGB(255,220,180) Brightness 0.6 Range 20). FENCE: iron fence perimeter (Metal dark, vertical bar posts via loop + horizontal rails, gate entrance with archway). PARK SIGN: entrance sign SurfaceGui. LIGHTING: bright day, Atmosphere Density 0.2 Color (180,200,230), Bloom 0.3. Minimum 80 parts.`
  }

  if (has('gas station', 'petrol station', 'fuel station')) {
    return `Build a gas station with: CANOPY: large flat-roof canopy over pumps (Metal white Color3.fromRGB(240,240,245) 30x5x20, supported by 4 Metal columns), "GAS" SurfaceGui sign mounted on canopy front, LED light strip under canopy edge (Neon white via loop). PUMPS: 3 pump islands (each island = Concrete base 2x0.5x1, pump machine = Metal box 1x4x0.5 with Neon price SurfaceGui, nozzle = small Cyl Parts, hose = thin Cyl), pump islands spaced 6 studs apart via loop. CONVENIENCE STORE: attached small building (Concrete Color3.fromRGB(240,240,245) 20x8x14), large window (Glass transparency 0.2 with SpotLight), glass door, refrigerator wall visible (Glass front, Neon blue interior light), counter + register, snack shelves (Metal shelves + small Parts). PARKING: concrete driveway (Concrete Color3.fromRGB(100,100,105) surrounding building), curb cuts, painted parking stripes (white flat Parts via loop). SIGNAGE: tall price sign pole (Cyl Metal + SurfaceGui price board), road sign at entrance. TRASH: outdoor trash can (Cyl dark Metal) + Recycle box. LIGHTING: bright overhead from canopy (white SpotLight pointing down per pump via loop), store interior warm, exterior Atmosphere Density 0.2, Bloom 0.3. Minimum 65 parts.`
  }

  if (has('library')) {
    return `Build a library with: EXTERIOR: stone and brick building (Granite Color3.fromRGB(160,155,148) 40x12x30), neoclassical front columns (4 Cyl Marble Color3.fromRGB(230,225,220) tall, evenly spaced), wide stone steps (5 steps loop Granite), large arched window above entrance (Glass transparency 0.2 semicircle look), "LIBRARY" engraved SurfaceGui sign on facade, lamp posts flanking entrance (Metal + PointLight loop). MAIN READING ROOM: high ceiling (4 stud clear height), dark WoodPlanks floor, large tables with reading lamps (6 tables via loop, each WoodPlanks top + Metal legs + desk lamp PointLight warm), individual reading carrels along walls (WoodPlanks dividers + chair). BOOKSHELVES: tall shelving units lining walls (WoodPlanks 3 tiers, dark Color3.fromRGB(90,60,30) via loop x8), shelf-row dividers, small Part books of varying colors via inner loop. RECEPTION DESK: large curved wood counter (WoodPlanks Color3.fromRGB(100,65,35)), computer terminal SurfaceGui, return slot box, catalogue display. PERIODICAL SECTION: comfortable armchairs (Fabric warm brown + soft cushion Color3.fromRGB(150,100,70)), side tables with lamp. STUDY ROOMS: 2 small glass-walled rooms (Glass walls + Wood door). LIGHTING: warm reading light (PointLight Color3.fromRGB(255,230,190) Brightness 0.5 every table), ceiling pendant chandeliers (PointLight Brightness 0.4 Range 30), Bloom 0.3, ColorCorrection TintColor (255,245,225). Minimum 90 parts.`
  }

  if (has('church', 'chapel', 'cathedral')) {
    return `Build a church with: EXTERIOR: stone Gothic facade (Granite Color3.fromRGB(170,165,158) 24x20x40 nave), pointed arch windows with stained glass look (Glass transparency 0.1 colored Parts = Neon blue/red/gold alternating via loop), tall bell tower on front-left (Granite 8x30x8), belfry with arched openings (4 sides, small arch frames), bell prop inside (Cyl bronze Color3.fromRGB(180,140,60)), cross on tower peak (2 Part Neon gold cross), double wooden front doors (dark Wood, ornate frame), stone steps 4 wide (loop), flying buttress Props on sides. NAVE INTERIOR: long central aisle (Marble floor Color3.fromRGB(230,225,215)), rows of wooden pews either side (WoodPlanks via nested loop x10 pairs), kneeling cushion Fabric per pew, columns along sides (Cyl Marble, loop). ALTAR AREA: raised platform (Marble), altar table (WoodPlanks + white Fabric cloth), cross centerpiece (Neon gold Parts), candle Parts (Cyl white + small Neon flame tip x6). ORGAN: pipe organ back wall (Metal pipes of varying height via loop, keyboard Part SurfaceGui). LIGHTING: colored Neon light shafts from stained glass (SpotLight behind each window, colored), chandelier (PointLight warm Color3.fromRGB(255,230,180) Brightness 0.4 hang center nave), Bloom Intensity 0.45, Atmosphere Density 0.3 Color (180,175,190). Minimum 100 parts.`
  }

  if (has('barn') && !has('dance')) {
    return `Build a farm barn with: EXTERIOR: classic red barn (Brick Color3.fromRGB(180,50,50) 30x18x20), gambrel roof (WedgeParts + slope Parts, dark Wood Color3.fromRGB(90,55,30)), large double barn doors (center, Wood planks vertical, hinges = Metal cylinders), hayloft window (upper center, open square opening), weathervane on peak (Cyl post + Metal arrow + rooster Parts). INTERIOR (visible through doors): hay loft upper floor (WoodPlanks flooring, hay bale Props = Box Parts Fabric yellow Color3.fromRGB(220,180,80) stacked), ladder to loft (rungs via loop), wooden support posts (Cyl Wood Color3.fromRGB(100,65,30) x6 via loop). ANIMAL STALLS: 4 horse stalls (wooden partitions WoodPlanks, gate door on each, hay on floor), water trough (Wood box + Glass water surface). EQUIPMENT AREA: tractor model (Metal body + large Cyl wheels + Neon headlights), plow attachment, pitchfork/shovel Props (thin Cyl handles). SILO: attached cylindrical silo (Cyl Metal Color3.fromRGB(160,150,140) 8 stud radius 24 tall, cone top, metal hatch). FENCED PASTURE: wooden fence perimeter via loop (WoodPlanks horizontal rails + vertical posts), gate entrance. TERRAIN: FillBlock Grass base, muddy path to barn (Pebble/Sand). LIGHTING: hanging lanterns inside (PointLight warm Color3.fromRGB(255,200,130) Brightness 0.5 Range 18, Cyl lantern body), Atmosphere Density 0.3 Color (190,185,175), morning feel. Minimum 85 parts.`
  }

  if (has('lighthouse')) {
    return `Build a lighthouse with: TOWER: cylindrical tower (Cyl Brick Color3.fromRGB(240,235,220) striped with red Brick Color3.fromRGB(200,50,50) bands every 5 studs alternating via loop, 4 stud radius, 40 studs tall), tapering slightly at top (slightly narrower radius at each band). LAMP ROOM: glass enclosure at top (Cyl Glass transparency 0.2 Color3.fromRGB(180,220,255), 4-5 stud radius, 4 tall), rotating Neon beam inside (SpotLight Neon Color3.fromRGB(255,255,200) Brightness 5 Range 200), lamp housing (Metal octagonal top above glass). GALLERY/BALCONY: wraparound walkway at lamp room base (WoodPlanks ring platform, Metal railing loop). SPIRAL STAIRCASE INSIDE: loop of ~20 Part steps winding up interior (WoodPlanks step + Metal handrail), positioned with math.sin/cos rotation. KEEPER'S COTTAGE: attached small stone cottage at base (Cobblestone Color3.fromRGB(150,145,138) 12x8x10), tiled roof (Slate), chimney (Brick), arched doorway, small windows Glass, flower garden border. DOCK: wooden dock extending to water (WoodPlanks planks via loop, Cyl pilings underneath via loop), moored small boat. TERRAIN: rocky cliff base (FillBall Terrain Stone, irregular rocks = Granite Parts), ocean water (FillBlock Water or blue Glass large Part). LIGHTING: animated rotating SpotLight, warm cottage PointLight, Atmosphere Density 0.3 ocean feel. Minimum 80 parts.`
  }

  if (has('prison', 'jail', 'penitentiary')) {
    return `Build a prison with: PERIMETER WALLS: 4 tall concrete outer walls (Concrete Color3.fromRGB(150,148,145) 60x16x4 each), guard tower at each corner (square 6x12x6 Concrete box on top of wall section, Metal railing around top, searchlight SpotLight). MAIN BUILDING: 3-story concrete cellblock (Concrete Color3.fromRGB(140,138,135) 40x18x30), barred windows on each floor via loop (Metal bar Cyl grid in window opening). CELL BLOCK: interior corridor (Concrete floor), 2 rows of cells (metal bar doors per cell = Cyl bars loop, Concrete bunk beds inside each, toilet + sink white Parts, small barred window). GUARD STATION: elevated control room (Glass walls, SpotLight scanning, radio Parts). YARD: open concrete exercise yard (Concrete Color3.fromRGB(130,128,125) 40x1x40), basketball hoop (Metal pole + ring), bench seating around perimeter (Metal). ENTRANCE: main gatehouse (Concrete, double security door frame, guard booth). WATCHTOWERS: 4 perimeter towers (Concrete base Cyl, wooden platform top, searchlight SpotLight white Range 80 Brightness 2). RAZOR WIRE: Neon white thin wire Parts along wall tops via loop. LIGHTING: harsh overhead lights (white SpotLight grid via loop), searchlight animation, gray overcast atmosphere, Atmosphere Density 0.4 Color (130,130,140), ColorCorrection Saturation -0.2. Minimum 100 parts.`
  }

  if (has('space station')) {
    return `Build a space station with: MAIN HABITAT MODULE: central Cyl tube (DiamondPlate Color3.fromRGB(180,182,190) 8 stud radius 30 long, horizontal), end caps on each side (flat Cyl discs). SIDE MODULES: 2 perpendicular habitat modules (Cyl DiamondPlate 6 stud radius 20 long) branching off main module via connector tunnels (smaller Cyl 3 stud radius 5 long = airlock nodes). SOLAR PANELS: 2 pairs of large flat solar array wings (DiamondPlate Color3.fromRGB(30,50,150) dark blue 20x0.3x8, supported by Cyl truss arms via loop, 4 panels per side). BRIDGE/COCKPIT MODULE: forward node (Metal sphere 8 stud Cyl, Neon windows Color3.fromRGB(0,180,255) on front, SurfaceGui control screens inside). AIRLOCK: external cylindrical hatch (Metal Cyl 3 stud radius, PointLight blue above it). DOCKING PORT: docking ring at one end (Neon ring outline, docking clamps = small Metal Parts via loop). EXTERIOR DETAILS: radiator fins (thin flat Metal Parts along hull via loop), antenna array (thin Cyl Parts + box receiver), thruster pods (Cyl blocks at corners with Neon blue ParticleEmitter). INTERIOR (one module): white curved walls Metal, Foil material floor, equipment rack SurfaceGui screens, 2 seat consoles (SurfaceGui), EVA suit lockers. LIGHTING: Neon edge strips on all module joints (Color3.fromRGB(0,160,255)), interior white SpotLights, no Atmosphere (space), stars backdrop (dark sky, no FillBlock). Minimum 80 parts.`
  }

  if (has('pirate ship') || (has('pirate') && has('ship'))) {
    return `Build a pirate ship with: HULL: ship hull lower body (WedgeParts bow taper + flat sides, Wood Color3.fromRGB(100,65,30), 8x6x40 main body, curved bottom WedgeParts), barnacle detail Parts on lower hull (Pebble material small Parts). DECKS: 3 deck levels (flat WoodPlanks, dark Color3.fromRGB(110,75,40) each 8x1x36), railing posts via loop on each deck edge (thin Cyl Wood + horizontal rail). MASTS: 3 masts (tall Cyl Wood Color3.fromRGB(120,80,45) heights 30/35/30 studs), crow's nest on main mast (WoodPlanks circle platform + Cyl railing), rigging ropes (thin Cyl Parts diagonal connecting masts). SAILS: 3 main sails (Fabric Color3.fromRGB(235,225,200) billowed look via slight rotation, attached to horizontal Cyl yardarms), Jolly Roger flag (Fabric black Color3.fromRGB(20,20,20) + skull detail SurfaceGui). CAPTAIN'S CABIN: rear cabin structure (WoodPlanks Color3.fromRGB(120,80,40) 8x6x8), Glass stern windows with warm PointLight, door, interior table + captain's chair. CANNONS: 4 cannons per side via loop (Cyl dark Metal Color3.fromRGB(50,50,55) + 2-wheel carriage), cannon ports in hull sides. ANCHOR: Cyl chain links (loop) + anchor Part (Metal dark). BOW FIGUREHEAD: decorative carved Part WoodPlanks woman or monster at prow. BELOW DECK (visible if looking down): cargo hold with treasure chest Props (Metal + Fabric), barrel Props (Cyl WoodPlanks). LIGHTING: warm lantern PointLights on each mast (Color3.fromRGB(255,190,100) Brightness 0.5), ocean water FillBlock underneath, Atmosphere Density 0.3 oceanic. Minimum 90 parts.`
  }

  if (has('treehouse', 'tree house')) {
    return `Build a treehouse with: MAIN TREE: massive oak trunk (Cyl Wood Color3.fromRGB(100,70,40) 6 stud radius 30 tall), 4 large branch Cyl Parts splitting from top (angles 30-45 degrees), exposed root Parts at base (WedgeParts angled outward), trunk bark detail WedgeParts. CANOPY: 7 overlapping Ball canopies (Grass material, varying greens Color3.fromRGB(60,130,55) to Color3.fromRGB(90,165,70), sizes 8-14 studs, clustered around upper branches). MAIN PLATFORM: treehouse floor (WoodPlanks Color3.fromRGB(140,100,60) 14x1x14, resting on branch with support brackets = Metal L-shapes), safety railing around edge (WoodPlanks posts via loop + horizontal rails). TREEHOUSE STRUCTURE: small cabin on platform (WoodPlanks walls 10x6x10, Thatch/WoodPlanks sloped roof, 2 windows Glass transparency 0.3, Dutch door wood). LADDER: rope ladder from ground to platform (Cyl post rungs via loop, thin side rails), or wooden ladder (WoodPlanks steps loop). ROPE BRIDGE: suspension bridge to second smaller platform (WoodPlanks plank steps via loop, Cyl rope rails sagging at center). SECOND PLATFORM: smaller observation deck (WoodPlanks 8x8), tire swing hanging from branch (Cyl tire black + Cyl rope). SLIDE: wooden slide from platform to ground (WedgePart WoodPlanks Color3.fromRGB(180,140,90) angled). INTERIOR: small sleeping loft inside cabin (Fabric mattress, WoodPlanks frame), window flower box, bunting decorations (small colored Fabric triangles loop). LIGHTING: warm lantern on platform (PointLight Color3.fromRGB(255,210,150) Range 15), Atmosphere Density 0.3 forest feel. Minimum 75 parts.`
  }

  if (has('underwater base', 'underwater lab', 'undersea')) {
    return `Build an underwater base with: MAIN DOME: large hemisphere glass dome (Ball/Cyl Glass transparency 0.25 Color3.fromRGB(140,200,230) 20 stud radius), metal frame ribs on dome exterior (Metal dark bars via loop along dome surface). CONNECTOR TUNNELS: 3 cylindrical tunnels branching from main dome (Cyl Glass 4 stud radius transparency 0.3, Metal ribs), connecting to side modules. SIDE LABS: 3 smaller domes or Cyl modules (Glass + Metal, 10 stud radius), each with different interior = research lab (equipment Parts SurfaceGui), sleeping quarters (beds Fabric), control center (SurfaceGui screens). AIRLOCK: vertical cylindrical airlock shaft (Metal Cyl), inner + outer door frames (Metal rings), water fill/drain pipes (Cyl Metal). INTERIOR FLOORS: flat Metal/Concrete floors inside dome, blue ambient Neon lighting from floor (Neon strips along floor edge loop). OCEAN EXTERIOR: FillBlock Water/Glass large blue Part surrounding everything (Glass transparency 0.5 Color3.fromRGB(20,60,120) huge cube), ocean floor (Sand/Pebble Terrain), coral Props (Cyl + Ball Parts Neon pink/orange), fish ParticleEmitter (small white Parts slow drift), seaweed Parts (green WedgeParts swaying look). SUPPORT PILLARS: Metal support legs from dome base to ocean floor (Cyl Metal 2 stud radius via loop). EXTERIOR LIGHTS: green/teal Neon search lights pointing outward (SpotLight Color3.fromRGB(30,255,180) Range 40), SurfaceGui depth meter on exterior. LIGHTING: deep blue underwater atmosphere (ColorCorrection TintColor 100,150,220, Brightness -0.15), Bloom Intensity 0.5. Minimum 90 parts.`
  }

  if (has('wizard tower', 'mage tower', 'magic tower')) {
    return `Build a wizard tower with: TOWER STRUCTURE: tall slim tower (Cobblestone Color3.fromRGB(90,85,100) 6 stud radius, 50 studs tall), slight taper at top, flying buttresses on lower third (WedgeParts Granite connecting to ground). EXTERIOR: moon/star motif carvings (flat Neon gold Color3.fromRGB(200,180,60) Parts embedded in wall, star shapes), arched wooden front door (dark Wood + iron knocker Cyl). SPIRAL FLOORS: 5 distinct levels (each 8-10 studs apart), spiral staircase connecting all (loop ~25 steps math.sin/cos CFrame). GROUND FLOOR: workshop (cauldron = Cyl Metal + Neon green bubbles Part + ParticleEmitter steam, workbench WoodPlanks with tool Parts, bookshelves round walls via loop). LEVEL 2 - LIBRARY: circular bookshelf (WoodPlanks shelves hugging curved wall via loop), large map/globe on table, rolling ladder (Cyl pole + rungs). LEVEL 3 - SLEEPING QUARTERS: round bed (Ball Fabric Color3.fromRGB(80,40,120)), constellation ceiling (Neon star Parts on ceiling via loop), telescope Part. LEVEL 4 - POTION LAB: Cyl flasks of different Neon colors (loop), shelf of ingredient jars, glowing crystal centerpiece (Ball Neon Color3.fromRGB(150,50,255) + PointLight). ROOFTOP: open parapet with Neon blue flame braziers (Cyl + ParticleEmitter blue fire), weather vane (Metal), owl perch (Wood). MAGICAL EFFECTS: ParticleEmitter sparkles throughout (Neon gold, slow rise), colored PointLights on each floor, crystal lights. LIGHTING: magical purple ambiance, Bloom Intensity 0.6 Size 40, ColorCorrection TintColor (180,150,220), Atmosphere Density 0.3. Minimum 85 parts.`
  }

  if (has('arena') || has('colosseum') || (has('stadium') && !has('sports'))) {
    return `Build a combat arena/colosseum with: OUTER WALL: elliptical outer wall ring (Granite Color3.fromRGB(170,160,145) segmented via loop of Parts, 3 tiers of arched openings = small arch frame Parts via nested loop), overall 80x80 stud footprint. SEATING: tiered spectator seating in concentric rings (loop of WedgePart steps upward each row, Concrete Color3.fromRGB(160,155,148) seating Parts), crowd detail Props (small cylinder figures). ARENA FLOOR: sand fighting pit (Sand Color3.fromRGB(220,200,160) 40x0.5x40 ellipse), center drain grate (Metal grid). ENTRANCE TUNNELS: 2 dark tunnel archways opposite sides (Concrete/Stone, portcullis bars = Cyl Metal loop, SpotLight at tunnel exit). OBSTACLES: scattered stone pillar Props in arena (Cyl Granite, 4 of varying heights), crumbling wall section (Brick, irregular breakable look). LIGHTING RIGS: overhead wooden crane arms (Wood) with hanging torch basket Props (Cyl + PointLight orange Color3.fromRGB(255,160,60) Brightness 1 Range 25 via loop), dramatic downward SpotLights. CHAMPION'S PODIUM: raised stone dais on one end (Marble Color3.fromRGB(220,215,208)), throne chair (WoodPlanks + Fabric seat Color3.fromRGB(120,30,30)), trophy pedestal. SCOREBOARD: SurfaceGui billboard on arena wall. UNDERGROUND PASSAGE: below-ground tunnel (Concrete dark, cell doors). LIGHTING: dramatic ClockTime 15 sharp shadows, sand dust Atmosphere (Density 0.35 Color 200,190,170), Bloom 0.25, intense SpotLights. Minimum 100 parts.`
  }

  if (has('city') || has('downtown') || (has('town') && !has('ghost') && !has('old'))) {
    return `Build a city block/town with: ROAD NETWORK: main street (Concrete Color3.fromRGB(80,80,85) 16 stud wide center, yellow center line Neon = flat loop, white edge lines, crosswalk stripes via loop), 2 side streets branching off. BUILDINGS (4 facades along street): building 1 = brick 3-story (Brick Color3.fromRGB(160,100,80), shop on ground floor, apartments above, windows via nested loop), building 2 = glass office tower (Metal + Glass), building 3 = restaurant (WoodPlanks facade, awning Fabric), building 4 = corner store (Brick smaller). SIDEWALKS: Concrete Color3.fromRGB(160,160,165) 6 stud wide both sides. STREET LAMPS: every 15 studs via loop (Cyl Metal pole 12 tall + box lamp head + PointLight Color3.fromRGB(255,230,190) Brightness 0.7 Range 25). STREET FURNITURE: fire hydrant (Cyl red loop x2), trash can (Cyl dark Metal loop x3), newspaper box (Metal box), bench x2 (Metal + WoodPlanks), bus stop shelter (Metal + Glass). VEHICLES: 3 parked car models along curb (simple Metal body + Cyl wheels, varying colors). CENTRAL SQUARE: small plaza 30x30 (Marble tile loop, central statue/monument, fountain). TREES: street trees every 20 studs via loop (Cyl trunk + Ball canopy x6). LIGHTING: city night feel (ClockTime 21, all street lamps on, neon signs Neon Parts on buildings, Atmosphere Density 0.4 Color 60,70,100), Bloom Intensity 0.5. Minimum 120 parts.`
  }

  if (has('village') && !has('city')) {
    return `Build a small village with: CENTRAL WELL: stone well centerpiece (Cyl Cobblestone base 4 radius + Brick walls + Wood roof overhang + Cyl winch + Chain loop). VILLAGE SQUARE: cobblestone plaza (Cobblestone alternating tiles via loop 30x30), market stalls (3 stalls = WoodPlanks counter + Fabric color awning + items on display). SMALL HOUSES (4): each cottage (Brick walls Color3.fromRGB(180,150,130) 12x8x10, Thatch/Wood sloped roof, 2 windows Glass, wooden door, flower garden border, chimney Brick). PATHS: dirt paths connecting buildings (Pebble/Sand Color3.fromRGB(180,160,135) meandering, bordered by stones via loop). CHURCH/HALL: central community building (Cobblestone larger 20x12x16, small bell tower). BLACKSMITH: forge building (Metal + Brick, anvil prop Metal, furnace with fire ParticleEmitter red/orange, water bucket). POND: small decorative pond (Glass water transparency 0.4, Pebble/Sand shore, 2 ducks = white Ball + Wing WedgeParts). FENCE LINES: wooden fence connecting between houses (WoodPlanks posts + rails via loop). TREES: 6-8 oak trees scattered (Cyl trunk + Ball canopy loop, varying sizes). LAMP POSTS: 4 iron lamp posts at square corners (Cyl Metal + lantern PointLight Color3.fromRGB(255,200,140)). TERRAIN: FillBlock Grass base, small hill behind village. LIGHTING: cozy warm, Bloom 0.35, Atmosphere Density 0.3 Color (190,185,175), early evening feel. Minimum 90 parts.`
  }

  if (has('dungeon') && !has('master') && !has('dragon')) {
    return `Build a dungeon with: ENTRANCE: dark staircase descending (stone WedgeParts loop, Cobblestone Color3.fromRGB(70,65,60)), iron gate at top (Cyl bar grid Metal), skull warning on wall SurfaceGui. MAIN CORRIDORS: 3 intersecting stone corridors (Cobblestone walls 4 stud wide 6 high 30 long + Slate floor Color3.fromRGB(55,52,48), torch brackets via loop = Metal arm + Cyl torch + PointLight Color3.fromRGB(255,160,60) Range 12 Brightness 0.7 flickering). ROOMS (4): room 1 = entry chamber (larger 20x20, crumbling pillars Cyl Cobblestone x4), room 2 = prisoner cells (bar doors loop Cyl Metal dark, skeleton Props, chains = Cyl links loop), room 3 = treasure vault (locked Metal door, chest Props = Metal/WoodPlanks with Neon gold glow, coins = small disc Parts Neon gold scattered), room 4 = boss chamber (raised platform Cobblestone, imposing throne Cobblestone/Metal, ritual circle Neon red). TRAPS: pressure plate floor tiles (Neon dark red alternating safe tiles), spike trap zone (thin WedgeParts pointing up Neon dark red). CEILING FEATURES: stalactites via loop (WedgeParts pointing down Cobblestone varying heights), cobwebs = thin white Parts crisscross corners. WATER HAZARD: shallow flooded passage (Glass water blue transparent, slows movement). GLOWING CRYSTALS: Neon crystal clusters (Ball Parts varying purple/blue/teal, PointLight matching color). LIGHTING: very dark, almost no ambient, rely on torch PointLights and crystal glow, Atmosphere Density 0.7 Color (20,15,25), ColorCorrection Brightness -0.2. Minimum 90 parts.`
  }

  if (has('spaceship') && !has('space station') && !has('launch')) {
    return `Build a spaceship with: MAIN HULL: sleek fuselage (DiamondPlate Color3.fromRGB(185,190,200) 8x5x36 main body), WedgeParts for nose taper (front 3 WedgeParts narrowing to point), rear engine block (Metal 8x5x4). WINGS: 2 delta wings (WedgePart DiamondPlate each 14x1x18 sweeping back), winglet fins at tips (WedgeParts). ENGINE NACELLES: 2 engine pods under wings (Cyl Metal 3 stud radius 8 long), Neon blue engine glow interior (Neon Color3.fromRGB(0,150,255) disc inside nacelle + PointLight), ParticleEmitter thrust exhaust. COCKPIT: forward glass canopy (Ball/Cyl Glass transparency 0.15 Color3.fromRGB(120,180,255)), VehicleSeat inside at pilot position, SurfaceGui control dashboard panel. LANDING GEAR: 3 Cyl strut legs (Metal, 2 front + 1 rear) each with flat Cyl foot pad, retracted/deployed look. CARGO BAY DOORS: center-bottom pair of hinged door Parts (Metal, show outline). HULL DETAILS: panel line grooves = thin dark flat Parts on surface (loop, 0.1 stud protrusion), intake vents (Metal grill Parts), small Neon running lights along wing edge (loop). WEAPONS: 2 under-wing hardpoints (Metal mounting pylon + laser cannon Cyl). MARKINGS: Neon stripe along fuselage side (Color3.fromRGB(255,50,50)), hull number SurfaceGui. LIGHTING: Neon engine glow, running light Neons, exterior no atmosphere (space), dramatic directional light from "star". Minimum 75 parts.`
  }

  if (has('train station', 'railway station', 'train depot')) {
    return `Build a train station with: MAIN TERMINAL BUILDING: Victorian brick facade (Brick Color3.fromRGB(170,115,85) 50x16x25), large arched windows (Glass transparency 0.2 with iron frame = Metal semicircle top, SpotLight behind each via loop), central clock tower (Brick square 10x10x24, SurfaceGui clock face all 4 sides, bell Cyl top), grand entrance archway (brick arch, double doors). PLATFORMS: 2 platform slabs (Concrete Color3.fromRGB(160,160,165) 60x0.8x10 each, with yellow safety edge line = Neon Color3.fromRGB(230,200,30) loop), platform canopy roof (Metal arched frame + Glass/Metal roof panels via loop for each bay). TRACKS: 2 railway tracks (Metal gray sleeper bars via loop + thin Metal rail lines x2 per track), ballast gravel (Pebble Parts scattered). TRAIN MODEL: locomotive (Metal Color3.fromRGB(30,30,35) engine + boiler Cyl + stack Cyl smoke ParticleEmitter + cab + tender car, headlight SpotLight white + red Neon tail light), 2 passenger cars (Metal box with windows via loop + WoodPlanks interior floor visible). WAITING AREA: wooden benches on platform (WoodPlanks loop x6), hanging pendant clocks (SurfaceGui), newsstand (small Metal + WoodPlanks kiosk). TICKET HALL INTERIOR: marble tile floor (Marble loop), ticket windows (small counter with Glass divider x4 via loop, SurfaceGui departure board above), departure board SurfaceGui main wall (trains list). LIGHTING: warm platform lamps (PointLight Color3.fromRGB(255,220,180) loop per bay), interior chandeliers, era-appropriate warm Atmosphere Density 0.25, Bloom 0.3. Minimum 100 parts.`
  }

  // No match
  return null
}

// ─── Blueprint injection ──────────────────────────────────────────────────────

/**
 * Scans the prompt for object keywords that match blueprints from the
 * object-blueprints library files and injects their build specs.
 * Uses try/catch dynamic-require so it works even if blueprint files
 * don't exist yet (returns empty string in that case).
 * Maximum 5 blueprints injected to keep context size manageable.
 */
export function injectBlueprintContext(prompt: string): string {
  const lower = prompt.toLowerCase()
  const injected: { label: string; spec: string }[] = []

  // We use a synchronous require-based approach since this function
  // is called from a sync context inside formatEnhancedPlanContext.
  // Each import is wrapped in try/catch — if the file doesn't exist yet,
  // we silently skip it. The files can be populated incrementally.

  type BlueprintMap = Record<string, { keywords: string[]; buildSpec: string }>

  const sources: BlueprintMap[] = []

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./object-blueprints') as { BLUEPRINTS?: BlueprintMap }
    if (mod.BLUEPRINTS) sources.push(mod.BLUEPRINTS)
  } catch {
    // file doesn't exist yet — skip
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./object-blueprints-expanded') as { EXPANDED_BLUEPRINTS?: BlueprintMap }
    if (mod.EXPANDED_BLUEPRINTS) sources.push(mod.EXPANDED_BLUEPRINTS)
  } catch {
    // file doesn't exist yet — skip
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./object-blueprints-rooms') as { ROOM_BLUEPRINTS?: BlueprintMap }
    if (mod.ROOM_BLUEPRINTS) sources.push(mod.ROOM_BLUEPRINTS)
  } catch {
    // file doesn't exist yet — skip
  }

  if (sources.length === 0) return ''

  for (const blueprintMap of sources) {
    if (injected.length >= 5) break
    for (const [label, entry] of Object.entries(blueprintMap)) {
      if (injected.length >= 5) break
      // Check if any of this blueprint's keywords appear in the prompt
      const matched = entry.keywords.some((kw: string) => lower.includes(kw.toLowerCase()))
      if (matched) {
        // Avoid duplicate labels
        if (!injected.some(i => i.label === label)) {
          injected.push({ label, spec: entry.buildSpec })
        }
      }
    }
  }

  if (injected.length === 0) return ''

  const lines: string[] = []
  lines.push('=== OBJECT BLUEPRINTS (use these exact specs) ===')
  for (const { label, spec } of injected) {
    lines.push(`[${label}]: ${spec}`)
  }
  lines.push('===')
  return lines.join('\n')
}

// ─── Reference game injection ─────────────────────────────────────────────────

/**
 * If the prompt matches a known game type/genre, returns a trimmed excerpt
 * from the reference game library for that genre (scripting patterns, layout,
 * structure). Returns null if no match or if reference-games file doesn't exist.
 */
export function injectReferenceGameContext(prompt: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./reference-games') as {
      getReferenceGame?: (prompt: string) => string | null
    }
    if (typeof mod.getReferenceGame !== 'function') return null

    const ref = mod.getReferenceGame(prompt)
    if (!ref) return null

    // Trim to first 3000 chars to keep context size manageable
    return ref.length > 3000 ? ref.slice(0, 3000) + '\n...[trimmed]' : ref
  } catch {
    // reference-games file doesn't exist yet — skip
    return null
  }
}
