/**
 * build-cache.ts -- Proven Build Cache System
 *
 * Serves pre-tested, high-quality builds instantly instead of regenerating
 * from scratch every time. When 10 users ask "build me a house", user #1
 * triggers AI generation, and users #2-10 get the cached result in <1s.
 *
 * Flow:
 * 1. User prompt comes in
 * 2. matchProvenBuild() checks against trigger patterns
 * 3. If hit: serve cached code with customization (colors, names)
 * 4. If miss: AI generates as normal, then cacheSuccessfulBuild() saves it
 *
 * This file is used BEFORE calling the AI in the chat route.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProvenBuild {
  id: string
  triggers: RegExp[]
  description: string
  partCount: number
  tags: string[]
  style: 'modern' | 'medieval' | 'rustic' | 'fantasy' | 'sci-fi' | 'japanese' | 'gothic' | 'tropical' | 'industrial' | 'classic'
  /** Pre-generated Luau code. null = template only, filled on first successful generation */
  code: string | null
  /** Fields the customizer can swap out via find-and-replace */
  customizable: { key: string; default: string; description: string }[]
}

export interface CacheMatch {
  build: ProvenBuild
  confidence: number // 0-1, how well the prompt matched
}

// ---------------------------------------------------------------------------
// Boilerplate shared by every cached build
// ---------------------------------------------------------------------------

const BOILERPLATE_HEADER = `-- ForjeGames Proven Build (cached)
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local rid = ChangeHistoryService:TryBeginRecording("ForjeBuild")
local m = Instance.new("Model") m.Name = "ForjeBuild"
local sp = Vector3.new(0, 0, 0)
local gy = 0

local function P(name, cf, size, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.CFrame = cf; p.Size = size
  p.Material = mat; p.Color = col; p.Anchored = true
  p.CastShadow = (size.X > 2 and size.Y > 2)
  p.Parent = parent or m; return p
end
local function W(name, cf, size, mat, col, parent)
  local w = Instance.new("WedgePart"); w.Name = name; w.CFrame = cf; w.Size = size
  w.Material = mat; w.Color = col; w.Anchored = true; w.Parent = parent or m; return w
end
local function Cyl(name, cf, size, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Cylinder
  p.CFrame = cf; p.Size = size; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or m; return p
end
local function Ball(name, cf, diameter, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Ball
  p.CFrame = cf; p.Size = Vector3.one * diameter; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or m; return p
end
`

const BOILERPLATE_FOOTER = `
m.Parent = workspace
m:MoveTo(sp)
if rid then ChangeHistoryService:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end
`

// ---------------------------------------------------------------------------
// The 20 Proven Builds
// ---------------------------------------------------------------------------

export const PROVEN_BUILDS: ProvenBuild[] = [
  // 1. House
  {
    id: 'house-modern',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhouse\b/i,
      /\bhouse\b.*\b(build|make|create|generate)\b/i,
      /\bsimple\s+house\b/i,
      /\bmodern\s+house\b/i,
      /\bfamily\s+home\b/i,
    ],
    description: 'Modern 2-story house with garage, porch, interior walls, staircase, windows, doors, chimney, and landscaping. Concrete foundation, brick walls, wood trim, glass windows.',
    partCount: 65,
    tags: ['house', 'home', 'residential', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '200, 195, 185', description: 'Main wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 60, 50', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '240, 235, 225', description: 'Window/door trim color RGB' },
      { key: 'BUILD_NAME', default: 'Modern_House', description: 'Model name' },
    ],
  },

  // 2. Castle
  {
    id: 'castle-medieval',
    triggers: [
      /\b(build|make|create|generate)\b.*\bcastle\b/i,
      /\bcastle\b.*\b(build|make|create|generate)\b/i,
      /\bmedieval\s+castle\b/i,
      /\bfortress\b/i,
    ],
    description: '4-tower castle with curtain walls, gatehouse with portcullis, courtyard, keep/donjon, crenellated battlements, arrow slits, drawbridge, and flag poles. Stone and brick materials.',
    partCount: 90,
    tags: ['castle', 'medieval', 'fortress', 'tower', 'kingdom'],
    style: 'medieval',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '140, 135, 125', description: 'Stone wall color RGB' },
      { key: 'ROOF_COLOR', default: '60, 55, 70', description: 'Tower roof color RGB' },
      { key: 'TRIM_COLOR', default: '100, 90, 80', description: 'Trim/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Medieval_Castle', description: 'Model name' },
    ],
  },

  // 3. Shop / Store
  {
    id: 'shop-store',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(shop|store)\b/i,
      /\b(shop|store)\b.*\b(build|make|create|generate)\b/i,
      /\bretail\s+(shop|store)\b/i,
      /\bitem\s+shop\b/i,
    ],
    description: 'Corner shop with large display windows, awning, door with bell, interior shelving, checkout counter, storage room in back, signage above entrance, and potted plants outside.',
    partCount: 55,
    tags: ['shop', 'store', 'retail', 'commercial', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '220, 210, 190', description: 'Storefront color RGB' },
      { key: 'ROOF_COLOR', default: '70, 65, 60', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '180, 50, 50', description: 'Awning/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Shop', description: 'Model name' },
    ],
  },

  // 4. Medieval Village
  {
    id: 'medieval-village',
    triggers: [
      /\bmedieval\s+village\b/i,
      /\bvillage\b.*\bmedieval\b/i,
      /\b(build|make|create)\b.*\bvillage\b/i,
    ],
    description: 'Cluster of 4-5 timber-frame cottages around a central well, market stall with cloth awning, blacksmith forge with anvil, cobblestone paths, wooden fences, haystacks, and barrels.',
    partCount: 120,
    tags: ['village', 'medieval', 'town', 'cottages', 'market'],
    style: 'medieval',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '210, 195, 170', description: 'Plaster/daub wall color RGB' },
      { key: 'ROOF_COLOR', default: '120, 100, 70', description: 'Thatch roof color RGB' },
      { key: 'TRIM_COLOR', default: '80, 55, 35', description: 'Timber frame color RGB' },
      { key: 'BUILD_NAME', default: 'Medieval_Village', description: 'Model name' },
    ],
  },

  // 5. Modern City Block
  {
    id: 'city-block',
    triggers: [
      /\bmodern\s+city\b/i,
      /\bcity\s+block\b/i,
      /\b(build|make|create)\b.*\bcity\b/i,
      /\bskyscraper/i,
      /\bdowntown\b/i,
    ],
    description: '3 buildings of varying heights (4, 8, 12 stories), glass curtain walls, concrete bases, street with sidewalks, crosswalk, street lamps, bench, fire hydrant, traffic light, and dumpster in alley.',
    partCount: 130,
    tags: ['city', 'modern', 'skyscraper', 'urban', 'downtown'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '180, 190, 200', description: 'Building facade color RGB' },
      { key: 'ROOF_COLOR', default: '90, 95, 100', description: 'Roof/top color RGB' },
      { key: 'TRIM_COLOR', default: '60, 65, 70', description: 'Steel/metal trim color RGB' },
      { key: 'BUILD_NAME', default: 'City_Block', description: 'Model name' },
    ],
  },

  // 6. Tycoon Map
  {
    id: 'tycoon-map',
    triggers: [
      /\btycoon\b/i,
      /\btycoon\s+map\b/i,
      /\btycoon\s+(base|starter|template)\b/i,
    ],
    description: 'Tycoon baseplate with spawn pad, dropper conveyor belt, collector bin, upgrade pads (3 tiers), sell area, rebirth shrine, leaderboard display, fenced perimeter, and entry gate.',
    partCount: 75,
    tags: ['tycoon', 'game', 'dropper', 'conveyor', 'baseplate'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '100, 100, 110', description: 'Base color RGB' },
      { key: 'ROOF_COLOR', default: '50, 180, 80', description: 'Accent/button color RGB' },
      { key: 'TRIM_COLOR', default: '255, 215, 0', description: 'Gold highlight color RGB' },
      { key: 'BUILD_NAME', default: 'Tycoon_Map', description: 'Model name' },
    ],
  },

  // 7. Obby Course
  {
    id: 'obby-course',
    triggers: [
      /\bobby\b/i,
      /\bobby\s+course\b/i,
      /\bobstacle\s+course\b/i,
      /\bparkour\b/i,
      /\b(build|make|create)\b.*\bobby\b/i,
    ],
    description: '15-stage obby with jumping platforms, moving platforms (marked), kill bricks (red), checkpoints (green pads), wall jumps, lava floor section, spinning bars, zipline poles, and finish podium with confetti emitter.',
    partCount: 80,
    tags: ['obby', 'obstacle', 'parkour', 'course', 'game'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '50, 120, 200', description: 'Platform color RGB' },
      { key: 'ROOF_COLOR', default: '200, 40, 40', description: 'Kill brick color RGB' },
      { key: 'TRIM_COLOR', default: '40, 200, 80', description: 'Checkpoint color RGB' },
      { key: 'BUILD_NAME', default: 'Obby_Course', description: 'Model name' },
    ],
  },

  // 8. Lobby / Hub
  {
    id: 'lobby-hub',
    triggers: [
      /\blobby\b/i,
      /\bhub\b/i,
      /\bspawn\s*(area|room|lobby)\b/i,
      /\b(build|make|create)\b.*\b(lobby|hub)\b/i,
    ],
    description: 'Open-air lobby with central spawn platform, 4 game portal arches (labeled), info board, donation board, settings NPC stand, fountain in center, benches, ambient torches, and welcome banner overhead.',
    partCount: 70,
    tags: ['lobby', 'hub', 'spawn', 'portal', 'game'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '170, 170, 180', description: 'Floor/wall color RGB' },
      { key: 'ROOF_COLOR', default: '60, 60, 80', description: 'Arch/frame color RGB' },
      { key: 'TRIM_COLOR', default: '255, 200, 50', description: 'Accent/gold color RGB' },
      { key: 'BUILD_NAME', default: 'Lobby_Hub', description: 'Model name' },
    ],
  },

  // 9. Restaurant
  {
    id: 'restaurant',
    triggers: [
      /\b(build|make|create|generate)\b.*\brestaurant\b/i,
      /\brestaurant\b/i,
      /\bdiner\b/i,
      /\bcafe\b/i,
    ],
    description: 'Restaurant with dining area (6 tables with chairs), kitchen behind counter with stove/fridge props, bar with stools, large front windows, neon open sign, outdoor patio with umbrella table, bathroom doors, and tiled floor.',
    partCount: 85,
    tags: ['restaurant', 'diner', 'cafe', 'food', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '190, 170, 140', description: 'Wall color RGB' },
      { key: 'ROOF_COLOR', default: '100, 45, 35', description: 'Roof/awning color RGB' },
      { key: 'TRIM_COLOR', default: '220, 200, 160', description: 'Interior accent color RGB' },
      { key: 'BUILD_NAME', default: 'Restaurant', description: 'Model name' },
    ],
  },

  // 10. School
  {
    id: 'school',
    triggers: [
      /\b(build|make|create|generate)\b.*\bschool\b/i,
      /\bschool\b.*\b(build|make|create|generate)\b/i,
      /\bclassroom\b/i,
    ],
    description: '2-story school with 4 classrooms (desks, whiteboard, teacher desk), hallway with lockers, principal office, cafeteria with long tables, gymnasium with basketball hoop, flagpole out front, front steps, and clock tower.',
    partCount: 110,
    tags: ['school', 'classroom', 'education', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '200, 180, 150', description: 'Brick wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 75, 70', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '150, 40, 40', description: 'Trim/door color RGB' },
      { key: 'BUILD_NAME', default: 'School', description: 'Model name' },
    ],
  },

  // 11. Hospital
  {
    id: 'hospital',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhospital\b/i,
      /\bhospital\b/i,
      /\bclinic\b/i,
      /\bmedical\s+(center|building)\b/i,
    ],
    description: 'Hospital with ER entrance (red cross sign), reception lobby, 3 patient rooms with beds, operating theater, waiting room with chairs, pharmacy counter, ambulance bay, rooftop helipad marked with H, and elevator shaft.',
    partCount: 95,
    tags: ['hospital', 'medical', 'clinic', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '230, 235, 240', description: 'Clean white wall color RGB' },
      { key: 'ROOF_COLOR', default: '90, 100, 110', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '200, 50, 50', description: 'Red cross/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Hospital', description: 'Model name' },
    ],
  },

  // 12. Garage
  {
    id: 'garage',
    triggers: [
      /\b(build|make|create|generate)\b.*\bgarage\b/i,
      /\bgarage\b/i,
      /\bcar\s+shop\b/i,
      /\bmechanic\b/i,
    ],
    description: '2-bay garage with roll-up doors, car lift, toolboxes, tire rack, oil drum props, office with desk, waiting area, neon sign, concrete floor with oil stains (dark patches), and exterior parking spots.',
    partCount: 60,
    tags: ['garage', 'mechanic', 'car', 'automotive', 'building'],
    style: 'industrial',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '160, 160, 165', description: 'Metal wall color RGB' },
      { key: 'ROOF_COLOR', default: '70, 70, 75', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '200, 160, 40', description: 'Warning/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Garage', description: 'Model name' },
    ],
  },

  // 13. Lighthouse
  {
    id: 'lighthouse',
    triggers: [
      /\b(build|make|create|generate)\b.*\blighthouse\b/i,
      /\blighthouse\b/i,
      /\bbeacon\b/i,
    ],
    description: 'Tall cylindrical lighthouse (6 stacked sections tapering upward), glass lantern room at top with SpotLight, spiral staircase inside (wedge parts), keeper cottage at base, rocky cliff foundation, dock with wooden planks, and fence railing.',
    partCount: 70,
    tags: ['lighthouse', 'beacon', 'coastal', 'ocean'],
    style: 'classic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '230, 225, 215', description: 'White tower color RGB' },
      { key: 'ROOF_COLOR', default: '180, 40, 40', description: 'Red stripe color RGB' },
      { key: 'TRIM_COLOR', default: '60, 60, 55', description: 'Base/trim color RGB' },
      { key: 'BUILD_NAME', default: 'Lighthouse', description: 'Model name' },
    ],
  },

  // 14. Pirate Ship
  {
    id: 'pirate-ship',
    triggers: [
      /\b(build|make|create|generate)\b.*\bpirate\s+ship\b/i,
      /\bpirate\s+ship\b/i,
      /\bgalleon\b/i,
      /\b(build|make|create)\b.*\bship\b/i,
    ],
    description: 'Pirate galleon with curved hull (multiple wedge parts), 3 masts with yard arms, crow\'s nest on main mast, captain cabin at stern with windows, cannons on both sides (cylinder parts), anchor, ship wheel, plank walkway, Jolly Roger flag pole, and rope rails.',
    partCount: 100,
    tags: ['pirate', 'ship', 'galleon', 'ocean', 'boat'],
    style: 'rustic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '110, 75, 45', description: 'Hull wood color RGB' },
      { key: 'ROOF_COLOR', default: '200, 190, 170', description: 'Sail color RGB' },
      { key: 'TRIM_COLOR', default: '60, 50, 35', description: 'Dark wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Pirate_Ship', description: 'Model name' },
    ],
  },

  // 15. Spaceship
  {
    id: 'spaceship',
    triggers: [
      /\b(build|make|create|generate)\b.*\bspaceship\b/i,
      /\bspaceship\b/i,
      /\bspace\s*craft\b/i,
      /\bstarship\b/i,
      /\bspaceship\b.*\b(build|make|create)\b/i,
    ],
    description: 'Sci-fi spaceship with sleek fuselage, angled wings, cockpit with glass canopy, twin engine nacelles (cylinder), thruster glow parts (neon), landing gear struts, cargo bay door, antenna array, hull panel lines (thin parts), and underside turret.',
    partCount: 80,
    tags: ['spaceship', 'spacecraft', 'space', 'sci-fi', 'vehicle'],
    style: 'sci-fi',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '160, 165, 175', description: 'Hull metal color RGB' },
      { key: 'ROOF_COLOR', default: '40, 120, 200', description: 'Accent glow color RGB' },
      { key: 'TRIM_COLOR', default: '60, 60, 65', description: 'Dark panel color RGB' },
      { key: 'BUILD_NAME', default: 'Spaceship', description: 'Model name' },
    ],
  },

  // 16. Treehouse
  {
    id: 'treehouse',
    triggers: [
      /\b(build|make|create|generate)\b.*\btree\s*house\b/i,
      /\btree\s*house\b/i,
    ],
    description: 'Large tree trunk (stacked brown cylinders) with branch platforms at 3 heights, main cabin with windows and door, rope bridge to second platform, rope ladder, tire swing (torus/cylinder), leaf canopy (green balls), lanterns on hooks, and small balcony with railing.',
    partCount: 75,
    tags: ['treehouse', 'tree', 'nature', 'cabin', 'building'],
    style: 'rustic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '130, 90, 50', description: 'Wood/trunk color RGB' },
      { key: 'ROOF_COLOR', default: '60, 130, 50', description: 'Leaf canopy color RGB' },
      { key: 'TRIM_COLOR', default: '180, 150, 100', description: 'Light wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Treehouse', description: 'Model name' },
    ],
  },

  // 17. Underground Bunker
  {
    id: 'underground-bunker',
    triggers: [
      /\b(build|make|create|generate)\b.*\bbunker\b/i,
      /\bbunker\b/i,
      /\bunderground\s+(base|bunker|lair)\b/i,
      /\bsecret\s+base\b/i,
    ],
    description: 'Underground bunker accessed via hatch on surface. Interior has command room with screens (neon parts), bunk beds room, armory with weapon racks, generator room (cylinder props), storage crates, ventilation ducts (long thin parts), blast door, and emergency exit tunnel.',
    partCount: 85,
    tags: ['bunker', 'underground', 'military', 'base', 'secret'],
    style: 'industrial',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '120, 125, 120', description: 'Concrete wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 85, 80', description: 'Ceiling color RGB' },
      { key: 'TRIM_COLOR', default: '180, 160, 50', description: 'Warning stripe color RGB' },
      { key: 'BUILD_NAME', default: 'Underground_Bunker', description: 'Model name' },
    ],
  },

  // 18. Japanese Temple
  {
    id: 'japanese-temple',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(japanese|japan)\s+temple\b/i,
      /\bjapanese\s+temple\b/i,
      /\bshinto\s+(shrine|temple)\b/i,
      /\bpagoda\b/i,
      /\btorii\b/i,
    ],
    description: '3-tier pagoda with curved roofs (wedge parts angled), torii gate entrance (red), stone lanterns along path, koi pond (blue transparent part), zen garden area with raked sand (light part), cherry blossom trees (pink ball clusters), wooden veranda, and bell tower.',
    partCount: 95,
    tags: ['japanese', 'temple', 'pagoda', 'shrine', 'torii'],
    style: 'japanese',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '210, 190, 155', description: 'Wood/panel color RGB' },
      { key: 'ROOF_COLOR', default: '50, 55, 65', description: 'Roof tile color RGB' },
      { key: 'TRIM_COLOR', default: '180, 40, 35', description: 'Torii red color RGB' },
      { key: 'BUILD_NAME', default: 'Japanese_Temple', description: 'Model name' },
    ],
  },

  // 19. Haunted Mansion
  {
    id: 'haunted-mansion',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhaunted\b/i,
      /\bhaunted\s+(house|mansion)\b/i,
      /\bspooky\s+(house|mansion|building)\b/i,
      /\bhorror\s+house\b/i,
    ],
    description: 'Victorian haunted mansion with crooked tower, broken windows (partially transparent), grand entrance with cracked steps, overgrown fence (tilted parts), graveyard with tombstones, dead tree, cobweb corners (thin white parts), creaky porch, boarded-up windows, and eerie green PointLights inside.',
    partCount: 90,
    tags: ['haunted', 'mansion', 'horror', 'spooky', 'gothic'],
    style: 'gothic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '90, 80, 75', description: 'Decayed wall color RGB' },
      { key: 'ROOF_COLOR', default: '45, 40, 50', description: 'Dark roof color RGB' },
      { key: 'TRIM_COLOR', default: '60, 55, 50', description: 'Rotted wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Haunted_Mansion', description: 'Model name' },
    ],
  },

  // 20. Fantasy Tower
  {
    id: 'fantasy-tower',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(wizard|mage|fantasy)\s+tower\b/i,
      /\bwizard\s+tower\b/i,
      /\bmage\s+tower\b/i,
      /\bfantasy\s+tower\b/i,
      /\bsorcerer\b.*\btower\b/i,
    ],
    description: 'Tall spiral wizard tower with stone base, progressively narrower sections, conical roof with glowing orb (neon ball), floating ring platforms, crystal formations (diamond-shaped transparent parts), arched windows, balcony at top, bookshelf interior, cauldron room, and mystical particle emitters (purple/blue).',
    partCount: 85,
    tags: ['fantasy', 'wizard', 'tower', 'magic', 'mage'],
    style: 'fantasy',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '120, 110, 130', description: 'Stone tower color RGB' },
      { key: 'ROOF_COLOR', default: '70, 40, 120', description: 'Purple roof color RGB' },
      { key: 'TRIM_COLOR', default: '100, 180, 255', description: 'Magic glow color RGB' },
      { key: 'BUILD_NAME', default: 'Fantasy_Tower', description: 'Model name' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Runtime cache for dynamically learned builds
// ---------------------------------------------------------------------------

const runtimeCache: Map<string, { code: string; partCount: number; hitCount: number; lastUsed: number }> = new Map()

const MAX_RUNTIME_CACHE = 50

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Match a user prompt against all proven builds.
 * Returns the best match with confidence, or null if nothing fits.
 */
export function matchProvenBuild(prompt: string): CacheMatch | null {
  const normalized = prompt.toLowerCase().trim()

  let bestMatch: ProvenBuild | null = null
  let bestScore = 0

  for (const build of PROVEN_BUILDS) {
    let score = 0

    // Check regex triggers
    for (const trigger of build.triggers) {
      if (trigger.test(normalized)) {
        score += 0.6
        break // one trigger match is enough
      }
    }

    // Check tag overlap
    for (const tag of build.tags) {
      if (normalized.includes(tag)) {
        score += 0.1
      }
    }

    // Check style keyword
    if (normalized.includes(build.style)) {
      score += 0.15
    }

    // Penalize if prompt is very specific/long (probably wants something custom)
    if (prompt.length > 150) {
      score *= 0.7
    }

    // Penalize if prompt mentions "custom", "unique", "special", "specific"
    if (/\b(custom|unique|special|specific|exactly|precise)\b/i.test(normalized)) {
      score *= 0.5
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = build
    }
  }

  // Minimum threshold
  if (!bestMatch || bestScore < 0.5) {
    return null
  }

  // Also check runtime cache for better matches
  const runtimeHit = findRuntimeCacheHit(normalized)
  if (runtimeHit && runtimeHit.confidence > bestScore && runtimeHit.code) {
    return {
      build: {
        id: `runtime-${runtimeHit.key}`,
        triggers: [],
        description: 'Dynamically cached from a previous successful build',
        partCount: runtimeHit.partCount,
        tags: [],
        style: 'modern',
        code: runtimeHit.code,
        customizable: [],
      },
      confidence: runtimeHit.confidence,
    }
  }

  return {
    build: bestMatch,
    confidence: Math.min(bestScore, 1),
  }
}

// ---------------------------------------------------------------------------
// Runtime cache lookup
// ---------------------------------------------------------------------------

function normalizeForCacheKey(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\b(a|an|the|me|my|please|can you|could you|i want|i need|make|build|create|generate)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findRuntimeCacheHit(prompt: string): { key: string; code: string; partCount: number; confidence: number } | null {
  const normalizedPrompt = normalizeForCacheKey(prompt)
  const promptWordsArr = normalizedPrompt.split(' ').filter((w: string) => w.length > 2)
  const promptWords = new Set(promptWordsArr)

  let bestKey = ''
  let bestOverlap = 0

  runtimeCache.forEach((_, key) => {
    const keyWordsArr = key.split(' ').filter((w: string) => w.length > 2)
    const keyWords = new Set(keyWordsArr)
    let overlap = 0
    promptWordsArr.forEach(word => {
      if (keyWords.has(word)) overlap++
    })
    const score = overlap / Math.max(promptWords.size, keyWords.size, 1)
    if (score > bestOverlap) {
      bestOverlap = score
      bestKey = key
    }
  })

  if (bestOverlap >= 0.6 && bestKey) {
    const entry = runtimeCache.get(bestKey)!
    entry.hitCount++
    entry.lastUsed = Date.now()
    return {
      key: bestKey,
      code: entry.code,
      partCount: entry.partCount,
      confidence: bestOverlap,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Customization
// ---------------------------------------------------------------------------

/**
 * Apply simple find-and-replace customizations to cached code based on the prompt.
 * Handles color swaps, name changes, and basic material changes.
 */
export function customizeProvenBuild(code: string, prompt: string, build?: ProvenBuild): string {
  let result = code

  // Apply model name from prompt
  const nameMatch = prompt.match(/(?:called|named)\s+"?([^"]+)"?/i)
  if (nameMatch) {
    result = result.replace(/m\.Name\s*=\s*"[^"]*"/, `m.Name = "${nameMatch[1].trim()}"`)
  }

  // Color customization from prompt
  const colorMap: Record<string, string> = {
    red: '200, 50, 50',
    blue: '50, 80, 200',
    green: '50, 160, 60',
    yellow: '220, 200, 50',
    purple: '120, 50, 180',
    pink: '220, 100, 150',
    orange: '220, 130, 40',
    black: '35, 35, 35',
    white: '240, 240, 240',
    gray: '140, 140, 140',
    grey: '140, 140, 140',
    brown: '120, 80, 45',
    gold: '212, 175, 55',
    cyan: '50, 200, 200',
    teal: '50, 160, 160',
  }

  // Check if user mentioned a color for the walls/main color
  for (const [colorName, rgb] of Object.entries(colorMap)) {
    const colorRegex = new RegExp(`\\b${colorName}\\b`, 'i')
    if (colorRegex.test(prompt)) {
      // Replace the WALL_COLOR placeholder or the first common wall color
      if (build?.customizable) {
        const wallCustom = build.customizable.find(c => c.key === 'WALL_COLOR')
        if (wallCustom) {
          result = result.replace(
            new RegExp(`Color3\\.fromRGB\\(${escapeRegex(wallCustom.default)}\\)`, 'g'),
            `Color3.fromRGB(${rgb})`
          )
        }
      }
      break // only apply first color match to walls
    }
  }

  // Material customization
  const materialMap: Record<string, string> = {
    wooden: 'Enum.Material.Wood',
    wood: 'Enum.Material.Wood',
    stone: 'Enum.Material.Cobblestone',
    brick: 'Enum.Material.Brick',
    metal: 'Enum.Material.Metal',
    concrete: 'Enum.Material.Concrete',
    marble: 'Enum.Material.Marble',
    ice: 'Enum.Material.Ice',
    glass: 'Enum.Material.Glass',
    neon: 'Enum.Material.Neon',
  }

  for (const [keyword, material] of Object.entries(materialMap)) {
    if (prompt.toLowerCase().includes(keyword)) {
      // Replace the primary wall material
      if (result.includes('Enum.Material.Brick')) {
        result = result.replace(/Enum\.Material\.Brick/g, material)
      } else if (result.includes('Enum.Material.Concrete')) {
        result = result.replace(/Enum\.Material\.Concrete/g, material)
      }
      break
    }
  }

  // Scale customization
  if (/\b(big|large|huge|massive|giant)\b/i.test(prompt)) {
    result = addScaleMultiplier(result, 1.5)
  } else if (/\b(small|tiny|mini|little)\b/i.test(prompt)) {
    result = addScaleMultiplier(result, 0.6)
  }

  return result
}

function addScaleMultiplier(code: string, scale: number): string {
  // Insert scale multiplier after sp/gy definitions
  const scaleBlock = `local _scale = ${scale}\n`
  const spLine = code.indexOf('local gy =')
  if (spLine !== -1) {
    const insertAt = code.indexOf('\n', spLine) + 1
    return code.slice(0, insertAt) + scaleBlock + code.slice(insertAt)
  }
  return code
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Learning: cache successful builds at runtime
// ---------------------------------------------------------------------------

/**
 * Save a successful build to the runtime cache so future similar prompts
 * get instant results. Called when a build scores well (e.g. > 60 quality score).
 */
export function cacheSuccessfulBuild(prompt: string, code: string, partCount: number): void {
  const key = normalizeForCacheKey(prompt)
  if (!key || key.length < 5) return
  if (!code || code.length < 200) return // too small to be real

  // Don't cache scripts, only builds
  if (code.includes('ServerScriptService') || code.includes('.Source') || code.includes('RemoteEvent')) {
    return
  }

  // Evict oldest if at capacity
  if (runtimeCache.size >= MAX_RUNTIME_CACHE) {
    let oldestKey = ''
    let oldestTime = Infinity
    runtimeCache.forEach((v, k) => {
      if (v.lastUsed < oldestTime) {
        oldestTime = v.lastUsed
        oldestKey = k
      }
    })
    if (oldestKey) runtimeCache.delete(oldestKey)
  }

  runtimeCache.set(key, {
    code,
    partCount,
    hitCount: 0,
    lastUsed: Date.now(),
  })

  console.log(`[BuildCache] Cached build: "${key}" (${partCount} parts, ${code.length} chars)`)
}

// ---------------------------------------------------------------------------
// Utility: build full Luau from a proven build template
// ---------------------------------------------------------------------------

/**
 * Wraps a proven build's code (or a runtime-cached code) with the standard
 * boilerplate header/footer so it's ready to execute in Studio.
 */
export function wrapWithBoilerplate(buildCode: string, buildName: string): string {
  const header = BOILERPLATE_HEADER.replace('m.Name = "ForjeBuild"', `m.Name = "${buildName}"`)
  return header + '\n' + buildCode + '\n' + BOILERPLATE_FOOTER
}

/**
 * Get a proven build by ID (for direct lookups).
 */
export function getProvenBuildById(id: string): ProvenBuild | undefined {
  return PROVEN_BUILDS.find(b => b.id === id)
}

/**
 * Update a proven build's code (called when AI generates code for a template).
 * This fills in the `code` field so future requests skip AI entirely.
 */
export function setProvenBuildCode(id: string, code: string, partCount?: number): boolean {
  const build = PROVEN_BUILDS.find(b => b.id === id)
  if (!build) return false
  build.code = code
  if (partCount) build.partCount = partCount
  console.log(`[BuildCache] Set code for proven build "${id}" (${code.length} chars, ${partCount ?? build.partCount} parts)`)
  return true
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getCacheStats(): {
  provenBuilds: number
  provenWithCode: number
  runtimeCached: number
  runtimeTotalHits: number
} {
  let provenWithCode = 0
  for (const b of PROVEN_BUILDS) {
    if (b.code) provenWithCode++
  }
  let totalHits = 0
  runtimeCache.forEach(v => {
    totalHits += v.hitCount
  })
  return {
    provenBuilds: PROVEN_BUILDS.length,
    provenWithCode,
    runtimeCached: runtimeCache.size,
    runtimeTotalHits: totalHits,
  }
}
