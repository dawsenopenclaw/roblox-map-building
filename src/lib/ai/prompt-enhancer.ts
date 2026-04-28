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
    styleDirective: `Use ${sm.materials.join(', ')} materials. Palette: ${sm.palette.map(c => `${c.name} (${c.rgb})`).join(', ')}. No SmoothPlastic.`,
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
  lines.push('[/ARCHITECT_BLUEPRINT]')

  return lines.join('\n')
}
