/**
 * prompt-modifiers.ts — Extract visual/environmental modifiers from user prompts
 *
 * Every build was coming out GENERIC because the AI had no specific instructions
 * about mood, time of day, materials, colors, etc. This module analyzes what
 * the user actually asked for and generates concrete customization instructions
 * so every build is UNIQUE to the request.
 *
 * Flow: user prompt → extractModifiers() → modifiersToInstructions() → injected into system prompt
 */

import 'server-only'

// ── Public types ──────────────────────────────────────────────────────────────

export interface PromptModifiers {
  mood: string[]
  scale: string
  environment: string[]
  timeOfDay: string
  style: string[]
  colorPalette: { primary: string; secondary: string; accent: string; trim: string }
  materials: string[]
  lightingPreset: string
  detailLevel: string
  surroundings: string[]
}

// ── Keyword → modifier maps ──────────────────────────────────────────────────

interface MoodProfile {
  keywords: RegExp
  mood: string
  palette: { primary: string; secondary: string; accent: string; trim: string }
  materials: string[]
  lighting: string
}

const MOOD_PROFILES: MoodProfile[] = [
  {
    keywords: /\b(cozy|warm|homey|comfortable|snug|inviting|cottage|cabin|fireplace|hearth|den)\b/i,
    mood: 'cozy',
    palette: { primary: 'RGB(160,120,80)', secondary: 'RGB(200,170,130)', accent: 'RGB(180,60,40)', trim: 'RGB(100,75,50)' },
    materials: ['WoodPlanks', 'Fabric', 'Brick', 'Wood'],
    lighting: 'warm',
  },
  {
    keywords: /\b(dark|creepy|scary|haunted|horror|sinister|ominous|eerie|spooky|nightmare|cursed|abandoned|decrepit)\b/i,
    mood: 'dark',
    palette: { primary: 'RGB(40,35,45)', secondary: 'RGB(60,55,65)', accent: 'RGB(140,20,20)', trim: 'RGB(30,25,35)' },
    materials: ['Slate', 'Cobblestone', 'Granite', 'CorrodedMetal'],
    lighting: 'minimal',
  },
  {
    keywords: /\b(futuristic|modern|sleek|high-?tech|sci-?fi|cyber|neon|hologram|laser|chrome|metallic)\b/i,
    mood: 'futuristic',
    palette: { primary: 'RGB(20,25,40)', secondary: 'RGB(40,45,60)', accent: 'RGB(0,200,255)', trim: 'RGB(180,180,200)' },
    materials: ['Neon', 'Glass', 'Metal', 'DiamondPlate', 'SmoothPlastic'],
    lighting: 'cold',
  },
  {
    keywords: /\b(magical|enchanted|fantasy|mystical|ethereal|fairy|wizard|witch|spell|potion|arcane|sorcerer|mage)\b/i,
    mood: 'magical',
    palette: { primary: 'RGB(80,40,120)', secondary: 'RGB(40,100,100)', accent: 'RGB(255,200,50)', trim: 'RGB(60,180,140)' },
    materials: ['Neon', 'Glass', 'Marble', 'Foil'],
    lighting: 'mystical',
  },
  {
    keywords: /\b(rustic|old|weathered|ancient|worn|ruined|crumbling|dilapidated|vintage|antique|aged)\b/i,
    mood: 'rustic',
    palette: { primary: 'RGB(140,110,75)', secondary: 'RGB(120,100,80)', accent: 'RGB(90,70,50)', trim: 'RGB(80,65,45)' },
    materials: ['Brick', 'Cobblestone', 'Wood', 'Slate', 'Granite'],
    lighting: 'warm-muted',
  },
  {
    keywords: /\b(cheerful|fun|playful|cute|cartoon|kawaii|bright|colorful|happy|joyful|whimsical|silly)\b/i,
    mood: 'cheerful',
    palette: { primary: 'RGB(255,120,80)', secondary: 'RGB(80,200,120)', accent: 'RGB(255,220,50)', trim: 'RGB(100,150,255)' },
    materials: ['SmoothPlastic', 'Fabric', 'Marble', 'Glass'],
    lighting: 'bright',
  },
  {
    keywords: /\b(elegant|fancy|luxury|luxurious|royal|grand|palace|mansion|opulent|regal|majestic)\b/i,
    mood: 'elegant',
    palette: { primary: 'RGB(40,30,25)', secondary: 'RGB(200,175,140)', accent: 'RGB(210,175,55)', trim: 'RGB(160,140,120)' },
    materials: ['Marble', 'Wood', 'Glass', 'Foil', 'Granite'],
    lighting: 'dramatic-warm',
  },
  {
    keywords: /\b(industrial|gritty|urban|factory|warehouse|foundry|mill|refinery|smelter|forge)\b/i,
    mood: 'industrial',
    palette: { primary: 'RGB(80,80,85)', secondary: 'RGB(60,60,65)', accent: 'RGB(200,150,50)', trim: 'RGB(100,95,90)' },
    materials: ['DiamondPlate', 'CorrodedMetal', 'Metal', 'Concrete', 'Brick'],
    lighting: 'harsh',
  },
  {
    keywords: /\b(tropical|beach|summer|paradise|island|hawaiian|caribbean|tiki|palm|lagoon)\b/i,
    mood: 'tropical',
    palette: { primary: 'RGB(50,180,220)', secondary: 'RGB(80,180,80)', accent: 'RGB(255,220,50)', trim: 'RGB(200,160,100)' },
    materials: ['Sand', 'Wood', 'WoodPlanks', 'Grass', 'Glass'],
    lighting: 'bright-warm',
  },
  {
    keywords: /\b(winter|frozen|ice|arctic|cold|frost|frosty|blizzard|glacial|tundra|snowy)\b/i,
    mood: 'winter',
    palette: { primary: 'RGB(220,230,240)', secondary: 'RGB(180,200,220)', accent: 'RGB(100,160,220)', trim: 'RGB(160,175,190)' },
    materials: ['Ice', 'Snow', 'Glass', 'Marble', 'Glacier'],
    lighting: 'cold-bright',
  },
  {
    keywords: /\b(steampunk|brass|clockwork|victorian-?tech|gears?|cog|steam|airship|dirigible|gadget)\b/i,
    mood: 'steampunk',
    palette: { primary: 'RGB(140,100,50)', secondary: 'RGB(80,60,40)', accent: 'RGB(200,160,60)', trim: 'RGB(120,90,55)' },
    materials: ['Metal', 'Brick', 'Wood', 'DiamondPlate', 'CorrodedMetal'],
    lighting: 'warm-dim',
  },
  {
    keywords: /\b(zen|peaceful|calm|serene|japanese|garden|meditation|tranquil|harmony|temple)\b/i,
    mood: 'zen',
    palette: { primary: 'RGB(100,120,80)', secondary: 'RGB(160,150,130)', accent: 'RGB(180,40,40)', trim: 'RGB(80,70,55)' },
    materials: ['Cobblestone', 'Wood', 'Grass', 'Slate', 'Sand'],
    lighting: 'soft-natural',
  },
  {
    keywords: /\b(military|army|bunker|tactical|barracks|camp|base|fort|fortification|trench|outpost)\b/i,
    mood: 'military',
    palette: { primary: 'RGB(80,90,70)', secondary: 'RGB(100,95,80)', accent: 'RGB(60,55,45)', trim: 'RGB(40,40,35)' },
    materials: ['Concrete', 'Metal', 'DiamondPlate', 'Brick', 'Sand'],
    lighting: 'harsh-cold',
  },
  {
    keywords: /\b(underwater|deep\s?sea|ocean\s?floor|aquatic|submarine|coral|reef|abyss|nautical|marine)\b/i,
    mood: 'underwater',
    palette: { primary: 'RGB(20,60,100)', secondary: 'RGB(30,90,80)', accent: 'RGB(0,200,180)', trim: 'RGB(50,120,150)' },
    materials: ['Glass', 'Neon', 'Marble', 'Slate', 'Ice'],
    lighting: 'cold-dim',
  },
  {
    keywords: /\b(post-?apocalyptic|wasteland|apocalypse|fallout|survivor|desolate|ravaged|destroyed)\b/i,
    mood: 'post-apocalyptic',
    palette: { primary: 'RGB(120,110,90)', secondary: 'RGB(90,80,65)', accent: 'RGB(180,100,40)', trim: 'RGB(60,55,45)' },
    materials: ['CorrodedMetal', 'Concrete', 'Brick', 'Slate', 'Sand'],
    lighting: 'hazy-warm',
  },
  {
    keywords: /\b(candy|sugar|sweet|dessert|cake|chocolate|gummy|lollipop|bubblegum|bakery)\b/i,
    mood: 'candy',
    palette: { primary: 'RGB(255,150,200)', secondary: 'RGB(180,130,255)', accent: 'RGB(255,255,100)', trim: 'RGB(100,220,200)' },
    materials: ['SmoothPlastic', 'Neon', 'Glass', 'Marble', 'Fabric'],
    lighting: 'bright-saturated',
  },
]

// ── Environment detection ─────────────────────────────────────────────────────

interface EnvironmentProfile {
  keywords: RegExp
  env: string
  surroundings: string[]
}

const ENVIRONMENT_PROFILES: EnvironmentProfile[] = [
  {
    keywords: /\b(forest|woods|jungle|grove|woodland|rainforest|thicket|timber)\b/i,
    env: 'forest',
    surroundings: ['trees', 'undergrowth', 'leaf litter', 'moss', 'fallen logs', 'ferns'],
  },
  {
    keywords: /\b(mountain|hill|cliff|peak|highland|alpine|summit|ridge|plateau)\b/i,
    env: 'mountain',
    surroundings: ['rocky terrain', 'boulders', 'elevation changes', 'snow caps', 'cliff faces'],
  },
  {
    keywords: /\b(ocean|lake|river|beach|shore|coast|harbor|port|dock|pier|marina|bay|cove)\b/i,
    env: 'waterfront',
    surroundings: ['water terrain', 'dock', 'sand', 'waves', 'boats', 'seaweed'],
  },
  {
    keywords: /\b(city|downtown|urban|street|block|alley|skyscraper|metropolis|district)\b/i,
    env: 'city',
    surroundings: ['road', 'sidewalk', 'street lights', 'nearby buildings', 'traffic', 'signs'],
  },
  {
    keywords: /\b(desert|sand|dune|arid|mesa|sahara|oasis|cactus|canyon)\b/i,
    env: 'desert',
    surroundings: ['sand terrain', 'cacti', 'rock formations', 'tumbleweeds', 'heat haze'],
  },
  {
    keywords: /\b(snow|winter|arctic|frozen|tundra|ice|glacier|blizzard|polar)\b/i,
    env: 'snowfield',
    surroundings: ['snow ground', 'ice patches', 'frost particles', 'bare trees', 'icicles'],
  },
  {
    keywords: /\b(sky|floating|cloud|heaven|aerial|airborne|skyline|celestial)\b/i,
    env: 'sky',
    surroundings: ['cloud platforms', 'no ground', 'ethereal glow', 'floating rocks', 'wind particles'],
  },
  {
    keywords: /\b(cave|underground|dungeon|tunnel|mine|crypt|catacomb|grotto)\b/i,
    env: 'cave',
    surroundings: ['rock walls', 'crystals', 'stalactites', 'stalagmites', 'darkness', 'glowing mushrooms'],
  },
  {
    keywords: /\b(space|void|asteroid|station|cosmic|galaxy|nebula|orbital|zero\s?gravity)\b/i,
    env: 'space',
    surroundings: ['stars', 'metal platforms', 'no gravity feel', 'nebula skybox', 'asteroids'],
  },
  {
    keywords: /\b(swamp|marsh|bayou|bog|wetland|mangrove|fen)\b/i,
    env: 'swamp',
    surroundings: ['murky water', 'dead trees', 'fog', 'moss', 'lily pads', 'fireflies'],
  },
  {
    keywords: /\b(farm|field|meadow|prairie|countryside|ranch|pasture|orchard|vineyard)\b/i,
    env: 'countryside',
    surroundings: ['grass', 'crops', 'fence', 'barn', 'hay bales', 'windmill'],
  },
  {
    keywords: /\b(ruins?|temple|ancient|lost|crumbled|overgrown|relic|forgotten|derelict)\b/i,
    env: 'ruins',
    surroundings: ['broken walls', 'overgrown vines', 'crumbled stone', 'pillars', 'moss-covered debris'],
  },
  {
    keywords: /\b(volcano|lava|magma|volcanic|eruption|molten|infernal|hellscape)\b/i,
    env: 'volcanic',
    surroundings: ['lava flows', 'obsidian rock', 'smoke', 'ash', 'glowing cracks', 'basalt columns'],
  },
  {
    keywords: /\b(garden|park|courtyard|patio|terrace|gazebo|greenhouse|botanical)\b/i,
    env: 'garden',
    surroundings: ['flower beds', 'hedges', 'fountain', 'stone path', 'benches', 'pergola'],
  },
]

// ── Scale detection ──────────────────────────────────────────────────────────

interface ScaleProfile {
  keywords: RegExp
  scale: string
  multiplier: number
  partMultiplier: number
}

const SCALE_PROFILES: ScaleProfile[] = [
  { keywords: /\b(tiny|small|mini|little|miniature|pocket|micro)\b/i, scale: 'tiny', multiplier: 0.5, partMultiplier: 0.6 },
  { keywords: /\b(large|big|tall|wide|spacious|grand|expansive)\b/i, scale: 'large', multiplier: 1.5, partMultiplier: 1.3 },
  { keywords: /\b(huge|massive|enormous|giant|mega|epic|colossal|gargantuan|towering)\b/i, scale: 'huge', multiplier: 2.5, partMultiplier: 2.0 },
  { keywords: /\b(detailed|intricate|complex|ornate|elaborate|decorated|embellished)\b/i, scale: 'detailed', multiplier: 1.0, partMultiplier: 2.0 },
]

// ── Time of day detection ────────────────────────────────────────────────────

interface TimeProfile {
  keywords: RegExp
  time: string
  clockTime: number
  description: string
}

const TIME_PROFILES: TimeProfile[] = [
  { keywords: /\b(night|midnight|dark|nocturnal|nighttime|moonlit|starlit)\b/i, time: 'night', clockTime: 0, description: 'stars, artificial lights, moon glow' },
  { keywords: /\b(sunset|dusk|evening|twilight|golden\s?hour)\b/i, time: 'sunset', clockTime: 17.5, description: 'golden warm light, long shadows, orange sky tint' },
  { keywords: /\b(sunrise|dawn|morning|daybreak|first\s?light)\b/i, time: 'sunrise', clockTime: 6, description: 'soft warm light, gentle shadows, pink-orange horizon' },
  { keywords: /\b(noon|midday|bright|sunny|daytime|clear)\b/i, time: 'day', clockTime: 14, description: 'clear sky, strong directional shadows, bright' },
  { keywords: /\b(storm|rain|thunder|lightning|tempest|downpour|overcast|cloudy)\b/i, time: 'storm', clockTime: 12, description: 'overcast, rain particles, dark clouds, dramatic' },
  { keywords: /\b(fog|mist|misty|hazy|foggy|murky|shrouded)\b/i, time: 'foggy', clockTime: 8, description: 'low visibility, atmospheric density 0.5+, muted colors' },
]

// ── Style detection (architectural) ──────────────────────────────────────────

interface StyleProfile {
  keywords: RegExp
  style: string
  features: string
}

const STYLE_PROFILES: StyleProfile[] = [
  { keywords: /\b(medieval|castle|kingdom|knight|feudal|dark\s?ages|fortress|keep|citadel)\b/i, style: 'medieval', features: 'stone walls, wood beams, iron fixtures, battlements, torches' },
  { keywords: /\b(modern|contemporary|minimalist|clean\s?lines?|geometric|bauhaus)\b/i, style: 'modern', features: 'glass, concrete, clean lines, open plan, flat roofs' },
  { keywords: /\b(victorian|gothic|ornate|gargoyle|pointed\s?arch|stained\s?glass)\b/i, style: 'victorian', features: 'detailed trim, pointed arches, dark wood, ornamental iron' },
  { keywords: /\b(japanese|asian|zen|pagoda|shoji|tatami|torii)\b/i, style: 'japanese', features: 'curved roofs, sliding doors, bamboo, stone lanterns, wood screens' },
  { keywords: /\b(western|cowboy|frontier|saloon|wild\s?west)\b/i, style: 'western', features: 'wood planks, swinging doors, dusty, barrel, hitching post' },
  { keywords: /\b(egyptian|pyramid|pharaoh|sphinx|hieroglyph|obelisk)\b/i, style: 'egyptian', features: 'sandstone, massive columns, gold accents, hieroglyphs, angled walls' },
  { keywords: /\b(greek|roman|classical|parthenon|column|toga)\b/i, style: 'classical', features: 'marble, ionic/doric columns, pediments, arches, friezes' },
  { keywords: /\b(cyberpunk|neon\s?city|dystopian|blade\s?runner|neon\s?noir)\b/i, style: 'cyberpunk', features: 'dark base + neon accents, rain, hologram effects, gritty metal' },
  { keywords: /\b(fairy|whimsical|storybook|enchanted|mushroom\s?house|hobbit)\b/i, style: 'fairy', features: 'round shapes, bright colors, oversized flowers, organic curves' },
  { keywords: /\b(pirate|ship|nautical|treasure|seafaring|buccaneer)\b/i, style: 'pirate', features: 'weathered wood, rope, sails, cannons, barrels, skulls' },
  { keywords: /\b(art\s?deco|gatsby|1920s|roaring\s?twenties)\b/i, style: 'art-deco', features: 'geometric patterns, gold trim, symmetry, stepped forms, chrome' },
  { keywords: /\b(viking|norse|longhouse|rune|mead\s?hall)\b/i, style: 'viking', features: 'heavy timber, dragon carvings, thatched roof, longship shapes, stone base' },
]

// ── Detail level detection ───────────────────────────────────────────────────

function detectDetailLevel(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (/\b(simple|basic|minimal|plain|bare|rough|quick)\b/.test(lower)) return 'simple'
  if (/\b(detailed|intricate|complex|ornate|elaborate|decorated|embellished|fancy)\b/.test(lower)) return 'detailed'
  if (/\b(ultra|hyper|insane|maximum|extreme|incredible|professional|masterpiece)\b/.test(lower)) return 'intricate'
  return 'normal'
}

// ── Main extraction function ─────────────────────────────────────────────────

export function extractModifiers(prompt: string): PromptModifiers {
  const moods: string[] = []
  let bestPalette: MoodProfile['palette'] | null = null
  const allMaterials: string[] = []
  let lightingPreset = 'natural'

  // Mood detection — collect all matching moods
  for (const profile of MOOD_PROFILES) {
    if (profile.keywords.test(prompt)) {
      moods.push(profile.mood)
      if (!bestPalette) {
        bestPalette = profile.palette
        lightingPreset = profile.lighting
      }
      for (const mat of profile.materials) {
        if (!allMaterials.includes(mat)) allMaterials.push(mat)
      }
    }
  }

  // Scale detection
  let scale = 'normal'
  for (const profile of SCALE_PROFILES) {
    if (profile.keywords.test(prompt)) {
      scale = profile.scale
      break
    }
  }

  // Environment detection
  const environments: string[] = []
  const surroundings: string[] = []
  for (const profile of ENVIRONMENT_PROFILES) {
    if (profile.keywords.test(prompt)) {
      environments.push(profile.env)
      for (const s of profile.surroundings) {
        if (!surroundings.includes(s)) surroundings.push(s)
      }
    }
  }

  // Time of day
  let timeOfDay = 'day'
  for (const profile of TIME_PROFILES) {
    if (profile.keywords.test(prompt)) {
      timeOfDay = profile.time
      break
    }
  }

  // Style detection
  const styles: string[] = []
  for (const profile of STYLE_PROFILES) {
    if (profile.keywords.test(prompt)) {
      styles.push(profile.style)
    }
  }

  // Detail level
  const detailLevel = detectDetailLevel(prompt)

  // Default palette if nothing matched
  const palette = bestPalette ?? {
    primary: 'RGB(140,130,120)',
    secondary: 'RGB(180,170,160)',
    accent: 'RGB(60,120,180)',
    trim: 'RGB(100,90,80)',
  }

  // Default materials if nothing matched
  if (allMaterials.length === 0) {
    allMaterials.push('Concrete', 'Wood', 'Brick', 'Glass')
  }

  return {
    mood: moods.length > 0 ? moods : ['neutral'],
    scale,
    environment: environments.length > 0 ? environments : ['outdoor'],
    timeOfDay,
    style: styles.length > 0 ? styles : ['standard'],
    colorPalette: palette,
    materials: allMaterials,
    lightingPreset,
    detailLevel,
    surroundings,
  }
}

// ── Convert modifiers to AI-readable instructions ────────────────────────────

export function modifiersToInstructions(mods: PromptModifiers): string {
  const lines: string[] = []

  lines.push('\n--- BUILD CUSTOMIZATION (extracted from user prompt) ---')

  // Mood
  if (mods.mood[0] !== 'neutral') {
    const moodDesc = mods.mood.join(', ')
    lines.push(`MOOD: ${moodDesc}`)
    // Add mood-specific behavior rules
    if (mods.mood.includes('cozy')) lines.push('  → Use warm colors (browns, oranges, creams). Soft PointLights (Brightness 1, warm Color3). Round edges. Fabric/cushion details.')
    if (mods.mood.includes('dark')) lines.push('  → Dark palette. Minimal lighting — scattered dim PointLights. Shadows. Broken/cracked details. Avoid bright colors.')
    if (mods.mood.includes('futuristic')) lines.push('  → Cool blue/cyan palette. Neon accent strips. Glass panels. Sharp geometric shapes. LED-style lighting.')
    if (mods.mood.includes('magical')) lines.push('  → Glowing elements (Neon material). Purple/gold/teal accents. Floating particles. Sparkle effects. Ethereal fog.')
    if (mods.mood.includes('rustic')) lines.push('  → Muted earth tones. Imperfect shapes (not perfectly aligned). Weathered textures. Brick/Cobblestone. Overgrown vines.')
    if (mods.mood.includes('cheerful')) lines.push('  → Saturated bright colors. Round shapes. Oversized details. Multiple color accents. Playful proportions.')
    if (mods.mood.includes('elegant')) lines.push('  → Gold/marble/dark wood. Chandeliers with PointLights. Symmetrical design. Crown molding. Marble floors.')
    if (mods.mood.includes('industrial')) lines.push('  → Grays/metals. Exposed pipes (Cylinders). DiamondPlate floors. Rivets. Harsh overhead SpotLights.')
    if (mods.mood.includes('tropical')) lines.push('  → Bright blues/greens/yellows. Palm trees. Sand terrain. Thatched textures. Bright natural light.')
    if (mods.mood.includes('winter')) lines.push('  → Whites/blues/silvers. Ice (Glass + blue tint). Snow material ground. Frost particles. Cool blue lighting.')
    if (mods.mood.includes('steampunk')) lines.push('  → Bronze/copper/leather tones. Gear shapes (Cylinders). Pipes everywhere. Pressure gauges. Warm gas-light glow.')
    if (mods.mood.includes('zen')) lines.push('  → Muted greens/browns. Clean lines. Asymmetric balance. Stone lanterns. Raked sand/gravel. Minimal parts, maximum calm.')
    if (mods.mood.includes('military')) lines.push('  → Camo greens/browns. Concrete walls. Sandbag barriers. Chain-link fence. Harsh fluorescent lighting.')
    if (mods.mood.includes('underwater')) lines.push('  → Deep blues/teals. Caustic light patterns (PointLights through Glass). Bubble particles. Coral shapes. Wavy organic forms.')
    if (mods.mood.includes('post-apocalyptic')) lines.push('  → Dusty browns/grays. Broken/tilted parts. Overgrown vegetation. Rust (CorrodedMetal). Debris scattered.')
    if (mods.mood.includes('candy')) lines.push('  → Pinks/purples/pastels. Smooth rounded shapes. Oversized sweets. Glossy SmoothPlastic. Bright sparkly lighting.')
  }

  // Scale
  const scaleInstructions: Record<string, string> = {
    tiny: 'Scale 0.5x normal. Fewer parts but still detailed. Miniature proportions. 60% of normal part count.',
    normal: 'Standard Roblox scale. Character = 5.5 studs tall. Normal part count.',
    large: 'Scale 1.5x normal. More spacious. 130% normal part count. Wider corridors, taller walls.',
    huge: 'Scale 2.5x normal. MASSIVE build. 200% part count. Epic proportions. Towering structures.',
    detailed: 'Normal scale but 200% part count. Extra decorative details, trim pieces, small props, texture variation.',
  }
  lines.push(`SCALE: ${mods.scale} → ${scaleInstructions[mods.scale] || scaleInstructions.normal}`)

  // Environment
  if (mods.environment[0] !== 'outdoor') {
    lines.push(`ENVIRONMENT: ${mods.environment.join(', ')}`)
    if (mods.surroundings.length > 0) {
      lines.push(`  → Surround build with: ${mods.surroundings.join(', ')}`)
    }
    // Environment-specific terrain/atmosphere
    if (mods.environment.includes('forest')) lines.push('  → Grass terrain base. 4-8 trees (Cyl trunk + Ball canopy). Dappled light. Leaf ground cover (flat green Parts).')
    if (mods.environment.includes('mountain')) lines.push('  → Rocky terrain. Elevation changes. Boulders (irregular Parts, Slate). Thin atmosphere (high FogEnd).')
    if (mods.environment.includes('waterfront')) lines.push('  → Water terrain at edges. Dock/pier (WoodPlanks). Sand transition. Wave particles.')
    if (mods.environment.includes('city')) lines.push('  → Asphalt road. Concrete sidewalk. Street lamps (Cyl+Ball+PointLight). Building facades nearby.')
    if (mods.environment.includes('desert')) lines.push('  → Sand terrain. Cacti (Cyl+Ball, green). Rock formations (irregular Slate Parts). High ambient brightness.')
    if (mods.environment.includes('snowfield')) lines.push('  → Snow terrain. Ice patches (Glass, blue tint). Frost particles. Bare trees. Low Atmosphere temperature color.')
    if (mods.environment.includes('sky')) lines.push('  → NO ground terrain. Floating cloud platforms (white Glass, 0.3 transparency). Ethereal skybox. Wind particles.')
    if (mods.environment.includes('cave')) lines.push('  → Rock walls enclosing (large Parts, Slate/Granite). Stalactites hanging (inverted cones). Glowing crystals (Neon Parts). Dark, PointLights only.')
    if (mods.environment.includes('space')) lines.push('  → No terrain. Metal platforms (DiamondPlate). Star particles. Nebula skybox color. Floating debris.')
    if (mods.environment.includes('swamp')) lines.push('  → Murky water terrain. Dead trees (gray trunks, no canopy). Dense fog (Atmosphere density 0.5). Moss (green Fabric Parts on surfaces).')
    if (mods.environment.includes('countryside')) lines.push('  → Grass terrain. Wooden fence (loop). Hay bales (yellow Cyl). Dirt path (brown terrain). Wildflowers.')
    if (mods.environment.includes('ruins')) lines.push('  → Broken walls (Parts at angles). Overgrown vines (green Cyl on walls). Crumbled stone debris. Moss patches.')
    if (mods.environment.includes('volcanic')) lines.push('  → Basalt terrain. Lava flows (Neon orange Parts). Smoke particles. Obsidian boulders (black Slate). Red ambient glow.')
    if (mods.environment.includes('garden')) lines.push('  → Grass terrain. Flower beds (colored Ball Parts). Hedges (green rectangular Parts). Stone path. Fountain centerpiece.')
  }

  // Time of day
  const timeProfile = TIME_PROFILES.find(t => t.time === mods.timeOfDay)
  if (timeProfile) {
    lines.push(`TIME OF DAY: ${mods.timeOfDay} → ClockTime ${timeProfile.clockTime}. ${timeProfile.description}`)
  } else {
    lines.push(`TIME OF DAY: ${mods.timeOfDay} → ClockTime 14. Clear sky, standard lighting.`)
  }

  // Style
  if (mods.style[0] !== 'standard') {
    const styleDetails = STYLE_PROFILES.filter(s => mods.style.includes(s.style))
    for (const s of styleDetails) {
      lines.push(`STYLE: ${s.style} → ${s.features}`)
    }
  }

  // Color palette
  lines.push(`COLOR PALETTE:`)
  lines.push(`  Primary: ${mods.colorPalette.primary} (main surfaces, walls)`)
  lines.push(`  Secondary: ${mods.colorPalette.secondary} (secondary surfaces, trim)`)
  lines.push(`  Accent: ${mods.colorPalette.accent} (doors, highlights, features)`)
  lines.push(`  Trim: ${mods.colorPalette.trim} (edges, borders, details)`)

  // Materials
  lines.push(`MATERIALS: ${mods.materials.join(', ')}`)

  // Detail level
  const detailInstructions: Record<string, string> = {
    simple: 'Minimal decoration. Focus on form over detail. Fewer small parts.',
    normal: 'Standard decoration. Window frames, door handles, basic trim.',
    detailed: 'Extra decoration. Wall trim, flower boxes, detailed furniture, textured surfaces, small props.',
    intricate: 'MAXIMUM detail. Every surface decorated. Multiple trim layers. Interior AND exterior detail. Ornamental elements.',
  }
  lines.push(`DETAIL LEVEL: ${mods.detailLevel} → ${detailInstructions[mods.detailLevel] || detailInstructions.normal}`)

  // Lighting preset
  const lightingInstructions: Record<string, string> = {
    'natural': 'Standard outdoor lighting. Ambient (127,127,127). OutdoorAmbient (127,127,127).',
    'warm': 'Warm PointLights (Color3 255,200,150). Amber ambient. Bloom Intensity 0.3.',
    'cold': 'Cool blue PointLights (Color3 150,200,255). Blue-tinted ambient. High contrast.',
    'minimal': 'Very dark ambient (30,30,40). Sparse PointLights. High shadow density. Bloom off.',
    'mystical': 'Purple/teal ambient. Neon glow sources. Bloom Intensity 0.6. Fog with color.',
    'warm-muted': 'Soft warm ambient (140,130,110). Low-intensity PointLights. Gentle bloom.',
    'bright': 'High ambient (200,200,200). Bright outdoor. Bloom 0.4. Saturated ColorCorrection.',
    'dramatic-warm': 'Warm directional. High contrast. Gold PointLights. Bloom 0.5. Rich shadows.',
    'harsh': 'Bright white SpotLights. High contrast. Industrial fluorescent feel.',
    'bright-warm': 'Bright warm ambient (200,190,170). Strong sunlight. Golden tint.',
    'cold-bright': 'Bright cool ambient (190,200,220). Blue-white sunlight. Crisp shadows.',
    'warm-dim': 'Dim warm amber (100,80,50). Gas-lamp feel. Low ambient. Cozy darkness.',
    'soft-natural': 'Soft diffused light. Low contrast. Gentle shadows. Natural ambient.',
    'harsh-cold': 'Cool fluorescent (180,190,200). Sharp shadows. Military bunker feel.',
    'cold-dim': 'Deep blue ambient (30,50,80). Scattered bioluminescent PointLights. Underwater caustics.',
    'hazy-warm': 'Overcast warm (150,130,100). Atmosphere density 0.4. Muted sun. Dusty.',
    'bright-saturated': 'Very bright. Saturated colors via ColorCorrection (Saturation 0.3). Bloom 0.5.',
  }
  lines.push(`LIGHTING: ${mods.lightingPreset} → ${lightingInstructions[mods.lightingPreset] || lightingInstructions.natural}`)

  lines.push('--- END BUILD CUSTOMIZATION ---\n')

  return lines.join('\n')
}
