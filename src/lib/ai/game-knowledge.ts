/**
 * Game Knowledge System — Makes the AI an expert Roblox game developer.
 * Used by chat/route.ts system prompt and prompt-enhance.ts for Meshy prompts.
 */

// ─── Game Genres ──────────────────────────────────────────────────────────────

export const GAME_GENRES: Record<string, {
  description: string
  commonElements: string[]
  mapLayout: string
  colorScheme: string
  materials: string[]
  lobbyStyle: string
}> = {
  tycoon: {
    description: "Player builds and manages a business empire, earning money to expand",
    commonElements: ["conveyor belts", "droppers", "upgraders", "collection bin", "purchase buttons", "rebirth portal", "leaderboard", "VIP area"],
    mapLayout: "Linear path from spawn to factory, with expansion plots branching off. Upgrade stations at milestones.",
    colorScheme: "Bright saturated colors. Green for money/profit, gold for premium, white for clean modern look",
    materials: ["SmoothPlastic for machines", "Neon for buttons and indicators", "Metal for conveyors", "DiamondPlate for factory floors"],
    lobbyStyle: "Open spawn area with game logo overhead, leaderboard displays on walls, shop NPC counters, VIP lounge behind glass walls, codes board",
  },
  simulator: {
    description: "Player grinds to level up stats — clicking, fighting, pet collecting, with rebirths for prestige",
    commonElements: ["training zones by difficulty", "pet eggs/hatchery", "rebirth shrine", "shop NPCs", "leaderboard", "quest board", "world portals", "boss arena"],
    mapLayout: "Central hub with portals to themed worlds arranged in a circle. Each world progressively harder. Hub has NPC shops, egg area, and social space",
    colorScheme: "Vibrant anime-inspired. Heavy neon and particle effects. Each world has a distinct color identity",
    materials: ["SmoothPlastic for clean surfaces", "Neon for portals and effects", "ForceField for energy barriers", "Grass for nature zones"],
    lobbyStyle: "Circular hub with world portals around edges, NPC shops in center island, giant egg in the middle, leaderboards on pillars",
  },
  obby: {
    description: "Obstacle course platformer — jump, dodge, and survive to reach the end",
    commonElements: ["checkpoints with flags", "kill bricks (red/neon)", "moving platforms", "spinning blades", "lava pools", "trampolines", "wall jumps", "zip lines"],
    mapLayout: "Linear stages going upward or forward, numbered 1-50+. Each stage is a self-contained challenge. Difficulty increases gradually",
    colorScheme: "Each stage has a unique color theme. Neon red for danger, green for safe zones, rainbow for bonus stages",
    materials: ["SmoothPlastic for platforms", "Neon for kill bricks", "Ice for slippery sections", "Glass for transparent platforms"],
    lobbyStyle: "Spawn pad area with stage select board, skip-stage shop, trail shop, and leaderboard showing fastest times",
  },
  roleplay: {
    description: "Social simulation — Brookhaven/Bloxburg style. Players live, work, drive, and interact",
    commonElements: ["houses with interiors", "vehicles", "job locations", "shops", "school", "hospital", "police station", "park", "roads with lanes"],
    mapLayout: "Town/city grid with roads, intersections, traffic lights. Residential area, commercial district, industrial zone, park/nature area",
    colorScheme: "Realistic muted colors. Pastel for residential, gray/white for commercial, green for parks, asphalt gray for roads",
    materials: ["Brick for buildings", "Concrete for sidewalks", "Grass for lawns", "SmoothPlastic for vehicles", "Wood for residential interiors"],
    lobbyStyle: "Town square with info board, vehicle spawner, apartment selector, job board, and map overview display",
  },
  horror: {
    description: "Scary/survival horror — explore dark environments, solve puzzles, avoid monsters",
    commonElements: ["dark hallways", "flickering lights", "locked doors", "keys/keycards", "jump scare triggers", "hiding spots", "notes/clues", "monster AI"],
    mapLayout: "Enclosed spaces — mansion, hospital, school, asylum. Narrow corridors, dead ends, secret rooms. Non-linear exploration",
    colorScheme: "Very dark. Black, dark red, dark green, sickly yellow. Minimal lighting with harsh shadows. Fog everywhere",
    materials: ["Slate for dark walls", "Wood for creaky floors", "Granite for stone", "CorrodedMetal for decay", "Fabric for tattered curtains"],
    lobbyStyle: "Dark entrance hall with flickering lights, ominous music, difficulty selector, and a 'story so far' board",
  },
  fighting: {
    description: "Combat arena — anime fighters, boxing, battlegrounds. Players fight for rankings",
    commonElements: ["battle arena", "spawn pads", "skill shop/tree", "training dummies", "boss arena", "ranked matchmaking board", "combo display"],
    mapLayout: "Central arena surrounded by training grounds, shops, and boss portals. Safe zone around spawn",
    colorScheme: "Bold high contrast. Red for danger, blue for safe, gold for premium, black for arena floor, neon for special moves",
    materials: ["SmoothPlastic for arena", "Neon for skill effects", "Metal for weapons", "Concrete for training grounds"],
    lobbyStyle: "Spawn island overlooking the arena below, with NPC shops, skill tree board, and teleport to arena",
  },
  racing: {
    description: "Vehicle racing — drive cars, bikes, boats on tracks or open world",
    commonElements: ["race track", "start/finish line", "pit stops", "checkpoints", "garage/showroom", "time trial board", "boost pads"],
    mapLayout: "Looping track with straightaways, hairpin turns, elevation changes, tunnels. Pit area with garage",
    colorScheme: "Asphalt gray track, white lane markings, red/white barriers, green grass borders, bright car colors",
    materials: ["Concrete for track", "Neon for checkpoints", "Metal for barriers", "Grass for scenery", "SmoothPlastic for vehicles"],
    lobbyStyle: "Garage showroom with vehicle select, track preview board, leaderboards, and custom paint shop",
  },
  tower_defense: {
    description: "Place towers to defend against waves of enemies marching along a path",
    commonElements: ["winding enemy path", "tower placement zones", "enemy spawn portal", "base/core to defend", "upgrade station", "wave counter"],
    mapLayout: "Winding path from enemy spawn to player base, with flat placement zones alongside. Multiple lane options for harder maps",
    colorScheme: "Green/brown for terrain paths, bright colors for tower zones, red for enemy spawn, blue for base, gold for upgrades",
    materials: ["Grass for ground", "Cobblestone for paths", "SmoothPlastic for towers", "Neon for projectiles"],
    lobbyStyle: "War room with map table, tower catalog display, difficulty selector, and loadout customization",
  },
  fps: {
    description: "First-person shooter — team or free-for-all combat with guns",
    commonElements: ["spawn rooms per team", "weapon pickups", "cover objects", "objectives (flag, bomb)", "ammo crates", "health packs"],
    mapLayout: "Symmetric or balanced asymmetric. Multiple sightlines, cover positions, flanking routes. 3-lane standard",
    colorScheme: "Military tactical. Tan, olive, gray, brown. Red markers for enemy, blue for friendly, yellow for objectives",
    materials: ["Concrete for buildings", "Metal for industrial", "Brick for cover walls", "Sand for outdoor terrain"],
    lobbyStyle: "Military base with weapon loadout board, team selector, map vote screen, and practice range",
  },
  sandbox: {
    description: "Creative building and exploration — players create whatever they want",
    commonElements: ["building tools UI", "material palette", "save/load system", "flat baseplate", "tool shop", "showcase area"],
    mapLayout: "Large open flat area with tool stations around edges. Personal plot zones. Community showcase area",
    colorScheme: "Neutral base with colorful tools and UI. White grid lines on baseplate",
    materials: ["SmoothPlastic default", "All materials available to players"],
    lobbyStyle: "Creative hub with featured builds display, tool tutorial area, and teleport to personal plots",
  },
}

// ─── Visual Themes ────────────────────────────────────────────────────────────

export const GAME_THEMES: Record<string, {
  colors: string[]
  materials: string[]
  props: string[]
  atmosphere: string
  lighting: string
}> = {
  medieval: {
    colors: ["brown", "stone gray", "dark green", "gold", "deep red"],
    materials: ["Brick", "Cobblestone", "Wood", "Slate", "Granite"],
    props: ["castle tower", "drawbridge", "torch", "banner", "throne", "wooden barrel", "iron gate", "stone well"],
    atmosphere: "Warm torchlight, slight fog, overcast sky",
    lighting: "Warm amber PointLights for torches, dim ambient, strong shadows",
  },
  futuristic: {
    colors: ["cyan", "white", "dark blue", "neon purple", "silver"],
    materials: ["SmoothPlastic", "Neon", "DiamondPlate", "Glass", "Metal"],
    props: ["hologram display", "hover pad", "laser door", "energy shield", "control panel", "neon strip lighting"],
    atmosphere: "Clean and bright, slight blue tint, high-tech feel",
    lighting: "Cool blue ambient, neon accent strips, bright white spotlights",
  },
  tropical: {
    colors: ["bright green", "sand yellow", "ocean blue", "coral pink", "coconut brown"],
    materials: ["Grass", "Sand", "SmoothPlastic", "Wood", "WoodPlanks"],
    props: ["palm tree", "tiki torch", "beach hut", "surfboard", "hammock", "coconut drink", "beach umbrella"],
    atmosphere: "Bright sunny day, warm golden light, clear water",
    lighting: "Bright warm sunlight, blue-tinted water reflections, golden hour feel",
  },
  space: {
    colors: ["black", "white", "neon blue", "silver", "deep purple"],
    materials: ["Metal", "Neon", "Glass", "SmoothPlastic", "DiamondPlate"],
    props: ["rocket ship", "space station module", "asteroid", "satellite dish", "cryo pod", "airlock door"],
    atmosphere: "Dark void with stars, no atmosphere, stark lighting contrast",
    lighting: "Single harsh sun light, no ambient, point lights for interior",
  },
  candy: {
    colors: ["pink", "purple", "bright blue", "yellow", "mint green", "white"],
    materials: ["SmoothPlastic", "Neon", "Ice", "Glass"],
    props: ["lollipop", "gumball machine", "candy cane", "donut", "cupcake tower", "chocolate river"],
    atmosphere: "Bright, cheerful, saturated, dreamlike",
    lighting: "Soft warm ambient, pink-tinted, no harsh shadows",
  },
  pirate: {
    colors: ["brown", "dark red", "gold", "navy blue", "cream"],
    materials: ["Wood", "WoodPlanks", "Cobblestone", "Fabric", "Metal"],
    props: ["pirate ship", "cannon", "treasure chest", "dock", "rope bridge", "skull flag", "rum barrel"],
    atmosphere: "Ocean breeze, overcast with dramatic clouds, saltwater mist",
    lighting: "Warm sunset tones, lantern point lights, slight fog over water",
  },
  japanese: {
    colors: ["red", "white", "pink", "dark wood brown", "black"],
    materials: ["Wood", "SmoothPlastic", "Grass", "Slate", "Brick"],
    props: ["torii gate", "cherry blossom tree", "pagoda", "stone lantern", "koi pond", "bamboo fence", "zen garden"],
    atmosphere: "Serene, misty morning, cherry petals floating",
    lighting: "Soft diffused light, pink tint during cherry blossom, warm lantern glow",
  },
  cyberpunk: {
    colors: ["neon pink", "neon cyan", "dark purple", "black", "electric yellow"],
    materials: ["Neon", "Metal", "Glass", "SmoothPlastic", "DiamondPlate"],
    props: ["neon sign", "hologram ad", "cyber vehicle", "rain puddle", "vending machine", "drone"],
    atmosphere: "Dark rainy night, neon reflections on wet streets, dense and gritty",
    lighting: "Dark ambient, heavy neon glow, colored fog, rain particles",
  },
  winter: {
    colors: ["white", "ice blue", "silver", "dark green", "red"],
    materials: ["Ice", "SmoothPlastic", "Wood", "Fabric", "Glass"],
    props: ["snowman", "christmas tree", "ice castle", "ski lodge", "frozen lake", "gift box", "candy cane"],
    atmosphere: "Cold crisp air, falling snow, frost on everything",
    lighting: "Cool blue ambient, warm interior lights, white particle snow",
  },
  haunted: {
    colors: ["dark purple", "black", "dark green", "blood red", "sickly yellow"],
    materials: ["Slate", "CorrodedMetal", "Wood", "Granite", "Fabric"],
    props: ["tombstone", "dead tree", "cobweb", "broken fence", "floating candle", "pumpkin", "coffin"],
    atmosphere: "Thick fog, dark and eerie, distant thunder, creaking sounds",
    lighting: "Very dim ambient, green-tinted fog, flickering PointLights, moon spotlight from above",
  },
  underwater: {
    colors: ["deep blue", "teal", "coral orange", "sandy yellow", "seaweed green"],
    materials: ["Glass", "SmoothPlastic", "Sand", "Neon", "Granite"],
    props: ["coral reef", "submarine", "bubble column", "treasure chest", "anchor", "seaweed", "jellyfish"],
    atmosphere: "Blue-green underwater light, floating particles, caustic light patterns",
    lighting: "Blue ambient, caustic god rays from above, bioluminescent neon accents",
  },
  wild_west: {
    colors: ["brown", "tan", "dusty red", "gold", "weathered wood"],
    materials: ["Wood", "WoodPlanks", "Sand", "Brick", "CorrodedMetal"],
    props: ["saloon", "water tower", "cactus", "mine cart", "wanted poster", "horse hitching post", "tumbleweed"],
    atmosphere: "Hot dusty desert, high noon sun, dry and barren",
    lighting: "Harsh overhead sun, warm amber tint, dust particles, long shadows",
  },
}

// ─── Building Standards ───────────────────────────────────────────────────────

export const ROBLOX_BUILDING = {
  sizes: {
    player: { height: 5, width: 2, depth: 1 },
    door: { width: 4, height: 7, depth: 0.5 },
    window: { width: 4, height: 4, depth: 0.3 },
    wall: { height: 10, thickness: 1 },
    floor: { thickness: 1 },
    ceiling: { thickness: 0.5 },
    room: { minWidth: 12, minDepth: 12, height: 10 },
    hallway: { width: 6, height: 10 },
    stairStep: { height: 1, depth: 2, width: 6 },
    fence: { height: 4, thickness: 0.5 },
    road: { width: 20, laneWidth: 6 },
    sidewalk: { width: 6 },
  },
  materials: {
    SmoothPlastic: "Default modern. Vehicles, UI elements, modern buildings, toys, clean surfaces",
    Brick: "Textured brick. Houses, walls, chimneys, old buildings, schools",
    Cobblestone: "Rough stone. Paths, medieval, castles, bridges, old streets",
    Concrete: "Smooth gray. Sidewalks, modern buildings, foundations, parking lots, highways",
    Wood: "Smooth wood. Furniture, floors, fences, decks, cabins, doors",
    WoodPlanks: "Plank texture. Docks, rustic buildings, ship decks, barn walls, boardwalks",
    Metal: "Shiny metal. Machines, vehicles, industrial, sci-fi, weapons, railings",
    DiamondPlate: "Industrial metal. Factory floors, heavy machinery, military vehicles",
    Granite: "Stone texture. Monuments, countertops, gravestones, luxury floors",
    Marble: "Polished stone. Luxury buildings, statues, columns, hotel lobbies",
    Grass: "Green grass. Terrain, lawns, parks, sports fields, nature areas",
    Sand: "Sandy texture. Beaches, deserts, sandbox areas, construction sites",
    Ice: "Slippery translucent. Winter themes, ice castles, frozen lakes, obby hazards",
    Neon: "Self-illuminating glow. Buttons, effects, signs, portals, danger zones, futuristic",
    Glass: "Transparent. Windows, display cases, futuristic panels, aquariums",
    Slate: "Dark rough stone. Dark themes, caves, dungeons, horror walls",
    Fabric: "Soft texture. Cushions, tents, banners, curtains, beds, sofas",
    CorrodedMetal: "Rusty. Abandoned buildings, horror, decay, junkyard, post-apocalyptic",
    ForceField: "Translucent energy. Shields, portals, magic effects, barriers, VIP walls",
    Pebble: "Small rocks. Garden paths, creek beds, gravel driveways",
  },
  rules: [
    "ALWAYS anchor all parts (Anchored = true)",
    "Group ALL parts in a Model container",
    "Set the Model's PrimaryPart to the largest/base part",
    "Use WeldConstraints between touching parts",
    "Place builds at camera position using workspace.CurrentCamera.CFrame",
    "Wrap in ChangeHistoryService waypoints for undo support",
    "Tag generated parts with SetAttribute('fj_generated', true)",
    "Use Color3.fromRGB() for all colors — pick GOOD colors, not all gray",
    "NEVER build a single cube — minimum 8-10 parts for any object",
    "Use realistic proportions based on player height (5 studs)",
    "Add interior details for buildings (floors, walls, doors, windows)",
    "Add PointLights inside buildings and near features for atmosphere",
  ],
}

// ─── Intent Detection Helpers ─────────────────────────────────────────────────

// IMPORTANT: Keep keywords specific enough to avoid false-positives on common words.
// Bad: "dark", "build", "car", "wave" — match too many unrelated prompts.
// Good: "tycoon", "obby", "roleplay" — genre-specific compound or rare words only.
const GENRE_KEYWORDS: Record<string, string[]> = {
  tycoon: ["tycoon", "conveyor belt", "dropper", "upgrader", "money printer", "rebirth portal"],
  simulator: ["simulator", "pet simulator", "egg hatch", "grind simulator", "prestige simulator"],
  obby: ["obby", "obstacle course", "parkour game", "kill brick", "checkpoint game"],
  roleplay: ["roleplay", "brookhaven", "bloxburg", "town roleplay", "life simulator"],
  horror: ["horror game", "scary game", "haunted house game", "asylum horror", "survival horror"],
  fighting: ["fighting game", "combat arena", "pvp arena", "battleground", "anime fighter", "boxing game"],
  racing: ["racing game", "race track", "drift game", "racing simulator"],
  tower_defense: ["tower defense", "td game", "wave defense", "defend the base"],
  fps: ["fps game", "first person shooter", "tactical shooter", "military shooter"],
  sandbox: ["sandbox game", "creative mode", "freeform building"],
}

// IMPORTANT: Avoid single common words — "ship", "snow", "ice", "neon", "ghost",
// "zombie", "anime" all appear in non-themed prompts constantly.
// Require compound phrases or clearly theme-specific terms.
const THEME_KEYWORDS: Record<string, string[]> = {
  medieval: ["medieval", "medieval castle", "knight kingdom", "dungeon crawler", "dragon lair", "sword and shield"],
  futuristic: ["futuristic", "sci-fi", "scifi", "high-tech city", "space station", "futuristic building"],
  tropical: ["tropical", "tropical island", "beach resort", "tiki bar", "tropical paradise"],
  space: ["outer space", "space station", "alien planet", "space exploration", "cosmic", "zero gravity"],
  candy: ["candy land", "candy world", "candy theme", "sweet kingdom", "sugar rush", "candy castle"],
  pirate: ["pirate", "pirate ship", "pirate cove", "buccaneer", "treasure island"],
  japanese: ["japanese", "japan theme", "sakura", "cherry blossom", "samurai", "ninja dojo", "torii gate", "zen garden"],
  cyberpunk: ["cyberpunk", "neon city", "dystopian city", "blade runner style", "cyber city"],
  winter: ["winter wonderland", "snowy", "christmas theme", "frozen kingdom", "north pole", "arctic"],
  haunted: ["haunted", "halloween", "haunted house", "spooky graveyard", "ghost town"],
  underwater: ["underwater", "deep sea", "ocean floor", "underwater city", "atlantis", "aquatic base"],
  wild_west: ["wild west", "western town", "cowboy", "saloon", "frontier town"],
}

export function detectGenre(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return genre
  }
  return null
}

export function detectTheme(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return theme
  }
  return null
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

export function buildGameKnowledgePrompt(conversationContext?: string): string {
  const detectedGenre = conversationContext ? detectGenre(conversationContext) : null
  const detectedTheme = conversationContext ? detectTheme(conversationContext) : null

  let prompt = `
## ROBLOX GAME EXPERTISE

You are an expert Roblox game developer. You understand every game genre, visual theme, and building technique.

### Building Standards
${ROBLOX_BUILDING.rules.map(r => `- ${r}`).join('\n')}

### Standard Sizes (in studs)
- Player: 5 tall, 2 wide | Door: 4w × 7h | Window: 4w × 4h | Wall: 10 tall, 1 thick
- Room minimum: 12×12×10 | Hallway: 6 wide | Road: 20 wide (6 per lane)

### Material Guide (use the RIGHT material for the context)
${Object.entries(ROBLOX_BUILDING.materials).map(([m, desc]) => `- **${m}**: ${desc}`).join('\n')}
`

  if (detectedGenre && GAME_GENRES[detectedGenre]) {
    const g = GAME_GENRES[detectedGenre]
    prompt += `
### ACTIVE GENRE: ${detectedGenre.toUpperCase()}
${g.description}
**Must-have elements:** ${g.commonElements.join(', ')}
**Map layout:** ${g.mapLayout}
**Color scheme:** ${g.colorScheme}
**Materials:** ${g.materials.join(', ')}
**Lobby style:** ${g.lobbyStyle}
`
  }

  if (detectedTheme && GAME_THEMES[detectedTheme]) {
    const t = GAME_THEMES[detectedTheme]
    prompt += `
### ACTIVE THEME: ${detectedTheme.toUpperCase()}
**Colors:** ${t.colors.join(', ')}
**Materials:** ${t.materials.join(', ')}
**Props to include:** ${t.props.join(', ')}
**Atmosphere:** ${t.atmosphere}
**Lighting:** ${t.lighting}
`
  }

  if (!detectedGenre && !detectedTheme) {
    prompt += `
### Genre Quick Reference
${Object.entries(GAME_GENRES).map(([name, g]) => `- **${name}**: ${g.description}. Key elements: ${g.commonElements.slice(0, 4).join(', ')}`).join('\n')}

### Theme Quick Reference
${Object.entries(GAME_THEMES).map(([name, t]) => `- **${name}**: Colors: ${t.colors.slice(0, 3).join(', ')}. Materials: ${t.materials.slice(0, 3).join(', ')}`).join('\n')}
`
  }

  return prompt
}

// ─── Mesh Prompt Enhancer (for Meshy API) ─────────────────────────────────────

export function enhanceMeshPromptWithGameKnowledge(prompt: string): string {
  const genre = detectGenre(prompt)
  const theme = detectTheme(prompt)

  let enhanced = prompt

  if (genre && GAME_GENRES[genre]) {
    const g = GAME_GENRES[genre]
    enhanced += `, ${g.colorScheme.split('.')[0].toLowerCase()}, game-ready, Roblox ${genre} game style`
  }

  if (theme && GAME_THEMES[theme]) {
    const t = GAME_THEMES[theme]
    enhanced += `, ${t.colors.slice(0, 2).join(' and ')} color palette, ${t.materials.slice(0, 2).join(' and ')} materials, ${t.atmosphere.split(',')[0].toLowerCase()}`
  }

  // Cap at 500 chars for Meshy
  return enhanced.slice(0, 500)
}
