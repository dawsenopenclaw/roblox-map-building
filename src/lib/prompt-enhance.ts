/**
 * Smart Prompt Enhancement for 3D Asset Generation
 *
 * Detects what the user wants, applies category-specific quality modifiers,
 * and produces rich descriptive prompts that generate stunning 3D assets
 * instead of basic shapes.
 *
 * Used by both the Meshy 3D mesh pipeline and the Luau code generation path.
 */

// ── Category types ───────────────────────────────────────────────────────────

export type AssetCategory =
  | 'building'
  | 'vehicle'
  | 'character'
  | 'furniture'
  | 'weapon'
  | 'environment'
  | 'prop'
  | 'food'
  | 'clothing'
  | 'instrument'
  | 'default'

// ── Category detection (broad keyword matching) ──────────────────────────────

const CATEGORY_PATTERNS: Array<{ category: AssetCategory; keywords: string[] }> = [
  {
    category: 'building',
    keywords: [
      'house', 'castle', 'tower', 'shop', 'store', 'building', 'church',
      'temple', 'palace', 'mansion', 'cottage', 'cabin', 'fort', 'fortress',
      'barn', 'warehouse', 'hotel', 'restaurant', 'cafe', 'school',
      'hospital', 'library', 'museum', 'office', 'apartment', 'skyscraper',
      'hut', 'tent', 'igloo', 'bunker', 'cathedral', 'mosque', 'tavern',
      'inn', 'dungeon', 'prison', 'jail', 'arena', 'colosseum', 'stadium',
      'lighthouse', 'windmill', 'mill', 'garage', 'shed', 'gazebo',
      'pagoda', 'shrine', 'chapel',
    ],
  },
  {
    category: 'vehicle',
    keywords: [
      'car', 'truck', 'bus', 'bike', 'motorcycle', 'bicycle', 'plane',
      'airplane', 'helicopter', 'boat', 'ship', 'submarine', 'tank',
      'spaceship', 'rocket', 'train', 'tram', 'ufo', 'drone', 'van',
      'ambulance', 'firetruck', 'police car', 'taxi', 'jeep', 'suv',
      'sports car', 'race car', 'formula', 'go kart', 'kart', 'scooter',
      'skateboard', 'hovercraft', 'jet', 'fighter', 'bomber', 'sailboat',
      'yacht', 'canoe', 'kayak', 'raft', 'tractor', 'bulldozer',
      'excavator', 'crane', 'forklift',
    ],
  },
  {
    category: 'character',
    keywords: [
      'character', 'person', 'human', 'player', 'npc', 'hero', 'villain',
      'warrior', 'soldier', 'knight', 'mage', 'wizard', 'zombie', 'monster',
      'creature', 'alien', 'robot', 'avatar', 'figure', 'man', 'woman',
      'child', 'guard', 'boss', 'dragon', 'demon', 'angel', 'elf', 'dwarf',
      'orc', 'goblin', 'skeleton', 'ghost', 'pirate', 'ninja', 'samurai',
      'viking', 'gladiator', 'astronaut', 'cowboy', 'clown', 'chef',
      'doctor', 'nurse', 'firefighter', 'police', 'king', 'queen',
      'prince', 'princess', 'pet', 'dog', 'cat', 'horse', 'bear',
    ],
  },
  {
    category: 'furniture',
    keywords: [
      'chair', 'table', 'sofa', 'couch', 'desk', 'bed', 'shelf',
      'bookcase', 'cabinet', 'wardrobe', 'dresser', 'stool', 'bench',
      'bookshelf', 'nightstand', 'ottoman', 'throne', 'crib', 'hammock',
      'rocking chair', 'armchair', 'loveseat', 'futon', 'credenza',
      'hutch', 'sideboard', 'buffet', 'vanity', 'mirror', 'lamp',
      'chandelier', 'rug', 'carpet', 'curtain', 'blinds',
    ],
  },
  {
    category: 'weapon',
    keywords: [
      'sword', 'gun', 'rifle', 'pistol', 'shotgun', 'bow', 'arrow',
      'axe', 'spear', 'staff', 'wand', 'dagger', 'knife', 'hammer',
      'mace', 'crossbow', 'shield', 'cannon', 'blade', 'katana',
      'scythe', 'trident', 'halberd', 'flail', 'whip', 'gauntlet',
      'grenade', 'bomb', 'rocket launcher', 'sniper', 'revolver',
      'rapier', 'claymore', 'sabre', 'machete', 'shuriken', 'kunai',
      'nunchaku', 'bo staff', 'slingshot', 'blunderbuss',
    ],
  },
  {
    category: 'environment',
    keywords: [
      'tree', 'rock', 'mountain', 'cliff', 'island', 'cave', 'ruins',
      'bridge', 'terrain', 'landscape', 'forest', 'bush', 'mushroom',
      'crystal', 'gem', 'pillar', 'column', 'boulder', 'stone',
      'waterfall', 'river', 'lake', 'pond', 'volcano', 'glacier',
      'canyon', 'desert', 'oasis', 'coral', 'reef',
    ],
  },
  {
    category: 'food',
    keywords: [
      'pizza', 'burger', 'cake', 'pie', 'donut', 'bread', 'fruit',
      'apple', 'banana', 'sushi', 'taco', 'hotdog', 'ice cream',
      'cookie', 'cupcake', 'chocolate', 'candy', 'popcorn', 'sandwich',
      'steak', 'chicken', 'fish', 'lobster', 'shrimp', 'pasta',
    ],
  },
  {
    category: 'clothing',
    keywords: [
      'hat', 'helmet', 'crown', 'armor', 'cape', 'cloak', 'robe',
      'boot', 'shoe', 'glove', 'ring', 'necklace', 'amulet', 'mask',
      'backpack', 'bag', 'belt', 'scarf', 'glasses', 'goggles',
    ],
  },
  {
    category: 'instrument',
    keywords: [
      'guitar', 'piano', 'drum', 'violin', 'flute', 'trumpet',
      'saxophone', 'harp', 'cello', 'bass', 'ukulele', 'banjo',
      'accordion', 'organ', 'xylophone', 'tuba', 'clarinet',
    ],
  },
  {
    category: 'prop',
    keywords: [
      'barrel', 'crate', 'box', 'sign', 'lantern', 'torch', 'candle',
      'flag', 'trophy', 'clock', 'vase', 'bottle', 'key', 'chest',
      'basket', 'bucket', 'pot', 'cauldron', 'anvil', 'wheel', 'rope',
      'ladder', 'fence', 'gate', 'lever', 'button', 'orb', 'potion',
      'scroll', 'book', 'map', 'compass', 'telescope', 'coin', 'gem',
    ],
  },
]

/**
 * Detect the asset category from a user prompt.
 * Returns the first matching high-specificity category, or 'default'.
 */
export function detectCategory(prompt: string): AssetCategory {
  const lower = prompt.toLowerCase()
  for (const { category, keywords } of CATEGORY_PATTERNS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'default'
}

// ── Meshy prompt enhancement ────────────────────────────────────────────────

/**
 * Category-specific descriptors that tell Meshy exactly what "good" looks like
 * for each type of object. These go far beyond generic "game-ready" directives.
 */
const CATEGORY_DESCRIPTORS: Record<AssetCategory, string> = {
  building:
    'detailed architectural model, clean exterior walls with visible window frames and door frames, ' +
    'pitched roof with ridge detail and eaves, textured facade with brick or stone pattern, ' +
    'foundation and steps, properly proportioned floors, clean geometry, sharp edges',

  vehicle:
    'detailed vehicle model, smooth aerodynamic body panels, round wheels with tire tread and ' +
    'hubcap detail, visible headlights and taillights, windshield and side windows, ' +
    'door seams, mirrors, exhaust pipe, proper automotive proportions',

  character:
    'detailed character model, clean T-pose ready for rigging, proper humanoid proportions, ' +
    'defined face features, clothing folds and texture, separate fingers, shoe detail, ' +
    'belt and accessory detail, quad-dominant clean topology, game-ready mesh',

  furniture:
    'detailed furniture model, proper joinery detail, realistic wood grain or fabric texture, ' +
    'smooth cushion forms, visible legs and supports, hardware detail like hinges and handles, ' +
    'real-world proportions, clean beveled edges',

  weapon:
    'detailed weapon model, sharp blade edge with fuller groove, leather-wrapped grip with ' +
    'visible stitching, ornate crossguard with filigree, metal pommel with gem inset, ' +
    'proper blade curvature, hard-surface beveled edges, metallic PBR finish',

  environment:
    'detailed environment piece, organic natural shapes, realistic bark texture on trunks, ' +
    'leaf clusters with depth, moss and lichen detail, weathered rock surfaces with cracks, ' +
    'proper ground-level base, LOD-friendly silhouette',

  prop:
    'detailed game prop, clean mesh with defined edges, proper UV seams, realistic material ' +
    'textures, wear and tear detail, functional looking parts, proper scale relative to ' +
    'game characters, optimized triangle count',

  food:
    'detailed food model, appetizing realistic appearance, proper food textures and colors, ' +
    'visible layers and toppings, glossy finish where appropriate, plate or wrapper detail, ' +
    'accurate proportions, mouth-watering presentation',

  clothing:
    'detailed wearable model, realistic cloth draping and folds, visible stitching and seams, ' +
    'proper material textures (leather, fabric, metal), buckle and clasp detail, ' +
    'clean attachment points, game-ready topology',

  instrument:
    'detailed instrument model, accurate body shape and proportions, visible strings or keys, ' +
    'wood grain or metallic finish, hardware detail like tuning pegs and bridges, ' +
    'proper sound hole or bell shape, polished surface reflections',

  default:
    'high quality detailed 3D model, clean topology, proper UV unwrap, PBR materials, ' +
    'game-ready optimized mesh, defined edges and surface detail',
}

/**
 * Rich expansion templates for common single-word requests.
 * When a user types just "house", they get a detailed description instead of a gray box.
 */
const EXPANSION_TEMPLATES: Record<string, string> = {
  // Buildings
  house:     'two-story suburban house with pitched shingled roof, front porch with columns, chimney, bay windows, front door with frame, garage, white siding with blue trim',
  castle:    'medieval stone castle with tall keep tower, crenellated battlements, round corner turrets, arched gate entrance, drawbridge, flag on top, arrow slit windows',
  tower:     'tall stone watchtower with crenellated top, arched windows on each level, spiral staircase visible, torch brackets, heavy wooden door at base',
  shop:      'charming storefront with large display window, striped awning, wooden door with bell, hanging sign, brick facade, flower boxes under windows',
  cabin:     'rustic log cabin with stone chimney, covered front porch, wooden rocking chair, stacked firewood, pitched roof with snow, warm window glow',
  church:    'white wooden church with tall steeple and cross, arched stained glass windows, double front doors, stone steps, bell tower',
  barn:      'large red barn with white trim, sliding double doors, hay loft opening, gambrel roof, weathervane on top, wooden fencing nearby',

  // Vehicles
  car:       'sleek modern sedan, aerodynamic body with smooth curves, chrome wheel rims, LED headlights and taillights, tinted windows, sport bumper, dual exhaust',
  truck:     'heavy-duty pickup truck, tall suspension, large chrome grille, bed with liner, roll bar, oversized tires with aggressive tread, fog lights',
  boat:      'classic wooden speedboat, polished mahogany hull, chrome cleats and trim, leather seats, steering wheel, windshield, outboard motor',
  plane:     'single-engine propeller airplane, streamlined fuselage, fixed landing gear, cockpit windows, wing struts, tail rudder and elevators',
  spaceship: 'sleek sci-fi starship, angular hull plates with panel lines, glowing blue engine nacelles, cockpit canopy, weapon hardpoints, landing struts',

  // Characters
  knight:    'medieval plate armor knight, full helm with visor, shoulder pauldrons, breastplate with heraldry, gauntlets, greaves, sword sheath at hip, cape',
  wizard:    'elderly wizard with long flowing robe and hood, ornate staff with glowing crystal tip, leather belt with potion vials, long beard, pointed hat',
  robot:     'humanoid robot with polished chrome body, glowing blue visor eyes, articulated joints, chest panel with lights, antenna, thick hydraulic limbs',
  dragon:    'fearsome dragon with scaled body, large leather wings spread wide, horned head, sharp teeth, long spiked tail, powerful clawed legs, fire breath glow',
  zombie:    'shambling zombie with torn clothing, exposed ribs, green-grey decayed skin, one arm reaching forward, glowing eyes, dirt and blood stains',

  // Weapons
  sword:     'ornate fantasy longsword, polished steel blade with central fuller groove, leather-wrapped grip with wire binding, ornate crossguard with gem inset, round metal pommel',
  axe:       'double-headed battle axe, curved steel blades with etched runes, thick wooden haft wrapped in leather, spiked pommel cap, blood groove details',
  bow:       'elegant elven longbow, recurve limbs with carved leaf motif, leather grip, bowstring, arrow rest, ornate gold tips',
  staff:     'wizard battle staff, gnarled dark wood shaft, glowing purple crystal sphere at top held by twisted branches, rune carvings along length, metal foot cap',
  shield:    'round Viking shield, wooden planks with iron rim, central boss dome, leather arm straps on back, painted heraldic design, battle damage marks',

  // Furniture
  chair:     'elegant wooden dining chair, carved backrest with lattice pattern, turned legs with pad feet, upholstered fabric seat, armrests with scroll detail',
  table:     'solid oak dining table, thick plank top with beveled edge, turned pedestal legs with stretcher bars, warm honey finish, visible wood grain',
  bed:       'luxurious king bed, tall upholstered headboard with tufting, thick mattress with white bedding, decorative pillows, wooden bed frame, nightstand',
  sofa:      'modern sectional sofa, deep cushions with piping detail, tufted back, tapered wooden legs, throw pillows, soft fabric upholstery',
  desk:      'executive wooden desk, large work surface with leather inlay, three drawers with brass handles, carved legs, matching desk chair',
  bookshelf: 'tall wooden bookshelf, five shelves filled with colorful books, decorative bookends, small potted plant, framed photo, carved crown molding',

  // Props
  chest:     'ornate treasure chest, dark wood body with iron bands and corner brackets, domed lid, heavy padlock, gold coins and jewels spilling out',
  barrel:    'weathered wooden barrel, curved oak staves with three iron hoops, bung hole plug, rope handle, slight wear and patina',
  lantern:   'antique oil lantern, polished brass frame, clear glass panels, wick holder inside, ring handle on top, warm amber glow',
  fountain:  'ornate three-tiered stone fountain, carved basin with fish spouts, water cascading down each level, moss detail, circular pool base',

  // Environment
  tree:      'majestic oak tree, thick gnarled trunk with bark texture, spreading canopy of dense green leaves, exposed root system at base, bird nest in branch fork',
  rock:      'large weathered boulder, layered sedimentary surface with cracks and lichens, moss patches, smaller stones scattered at base',
  mushroom:  'giant fantasy mushroom, thick spotted red cap with white spots, pale ribbed underside, stout white stalk, smaller mushrooms at base, magical glow',
}

/**
 * Negative prompt tailored per category — tells Meshy what to avoid.
 * Meshy v2 enforces 200 char limit on negative_prompt.
 */
const CATEGORY_NEGATIVES: Record<AssetCategory, string> = {
  building:
    'floating parts, holes in walls, missing roof, blurry textures, disconnected geometry, non-manifold, stretched UVs, deformed, ugly, NSFW',
  vehicle:
    'square wheels, floating parts, missing windows, disconnected panels, blurry, distorted proportions, non-manifold, ugly, NSFW',
  character:
    'extra limbs, fused fingers, deformed face, floating parts, blurry, distorted proportions, non-manifold geometry, ugly, NSFW',
  furniture:
    'floating legs, disconnected parts, wrong proportions, blurry textures, non-manifold, stretched UVs, deformed, ugly, NSFW',
  weapon:
    'bent blade, floating parts, wrong proportions, blurry textures, non-manifold geometry, stretched UVs, deformed, ugly, NSFW',
  environment:
    'floating parts, disconnected mesh, artificial look, blurry textures, non-manifold, inverted normals, stretched UVs, ugly, NSFW',
  prop:
    'floating parts, disconnected mesh, blurry textures, non-manifold geometry, inverted normals, stretched UVs, deformed, ugly, NSFW',
  food:
    'unappetizing, blurry, distorted shape, floating parts, non-manifold, ugly, NSFW, watermark, text',
  clothing:
    'flat cloth, no folds, floating parts, blurry, distorted, non-manifold geometry, stretched UVs, deformed, ugly, NSFW',
  instrument:
    'wrong proportions, floating parts, blurry textures, non-manifold, disconnected mesh, deformed, ugly, NSFW',
  default:
    'low quality, blurry, distorted, floating parts, disconnected mesh, overlapping faces, non-manifold, inverted normals, stretched UVs, NSFW',
}

// Meshy prompt char limit
const MESHY_PROMPT_MAX = 500

/**
 * Enhance a user prompt for Meshy 3D generation.
 *
 * Takes a raw user prompt like "house" and produces a rich, category-aware
 * description that generates stunning 3D models. Stays under Meshy's 500-char limit.
 *
 * @param userPrompt  Raw user input, e.g. "build me a house"
 * @param category    Optional pre-detected category (auto-detected if omitted)
 * @returns           { prompt, negativePrompt, category }
 */
export function enhancePrompt(
  userPrompt: string,
  category?: AssetCategory,
): {
  prompt: string
  negativePrompt: string
  category: AssetCategory
} {
  const resolvedCategory = category ?? detectCategory(userPrompt)

  // Clean up common command prefixes
  const cleaned = userPrompt
    .replace(/^(build|create|make|generate|design|craft|add|place|spawn)\s+(me\s+)?(a\s+|an\s+|the\s+)?/i, '')
    .trim()

  // Check if this is a single-word/short request that matches an expansion template
  const cleanedLower = cleaned.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const expansion = EXPANSION_TEMPLATES[cleanedLower]

  // Build the enhanced prompt
  let enhanced: string
  if (expansion) {
    // Use the rich expansion for short/simple prompts
    enhanced = expansion
  } else if (cleaned.split(/\s+/).length <= 3) {
    // Short prompt but no template — prepend category descriptor
    enhanced = `${cleaned}, ${CATEGORY_DESCRIPTORS[resolvedCategory]}`
  } else {
    // User already provided detail — just append quality modifiers
    enhanced = `${cleaned}, ${CATEGORY_DESCRIPTORS[resolvedCategory]}`
  }

  // Append universal quality suffix (Roblox-optimized)
  const qualitySuffix = ', game-ready, clean low-poly stylized, vibrant colors, Roblox compatible'
  enhanced += qualitySuffix

  // Truncate at word boundary to fit Meshy's limit
  if (enhanced.length > MESHY_PROMPT_MAX) {
    enhanced = enhanced.slice(0, MESHY_PROMPT_MAX).replace(/,?\s*[^,]*$/, '')
  }

  return {
    prompt: enhanced,
    negativePrompt: CATEGORY_NEGATIVES[resolvedCategory] ?? CATEGORY_NEGATIVES.default,
    category: resolvedCategory,
  }
}

// ── Luau code generation enhancement ─────────────────────────────────────────

/**
 * Detailed Luau build templates for common objects.
 * These are injected into the AI system prompt so it has concrete examples
 * of HIGH-QUALITY multi-part builds instead of single-cube outputs.
 */
export const LUAU_BUILD_TEMPLATES = `
=== DETAILED BUILD TEMPLATES (reference these for quality) ===

TEMPLATE: DETAILED HOUSE (25+ parts)
\`\`\`
-- Foundation
P("Foundation",CFrame.new(sp+Vector3.new(0,0.25,0)),Vector3.new(22,0.5,16),Enum.Material.Concrete,Color3.fromRGB(140,135,130),folder)
-- Floor
P("Floor",CFrame.new(sp+Vector3.new(0,0.75,0)),Vector3.new(20,0.5,14),Enum.Material.WoodPlanks,Color3.fromRGB(160,120,75),folder)
-- Front Wall (with window cutouts)
P("FrontWallLeft",CFrame.new(sp+Vector3.new(-7,6,-7)),Vector3.new(6,10,0.8),Enum.Material.SmoothPlastic,Color3.fromRGB(220,215,205),folder)
P("FrontWallRight",CFrame.new(sp+Vector3.new(7,6,-7)),Vector3.new(6,10,0.8),Enum.Material.SmoothPlastic,Color3.fromRGB(220,215,205),folder)
P("FrontWallTop",CFrame.new(sp+Vector3.new(0,10,-7)),Vector3.new(8,2,0.8),Enum.Material.SmoothPlastic,Color3.fromRGB(220,215,205),folder)
-- Back Wall
P("BackWall",CFrame.new(sp+Vector3.new(0,6,7)),Vector3.new(20,10,0.8),Enum.Material.SmoothPlastic,Color3.fromRGB(215,210,200),folder)
-- Side Walls
P("LeftWall",CFrame.new(sp+Vector3.new(-10,6,0)),Vector3.new(0.8,10,14),Enum.Material.SmoothPlastic,Color3.fromRGB(218,213,203),folder)
P("RightWall",CFrame.new(sp+Vector3.new(10,6,0)),Vector3.new(0.8,10,14),Enum.Material.SmoothPlastic,Color3.fromRGB(218,213,203),folder)
-- Front Windows (Glass)
local w1=P("WindowLeft",CFrame.new(sp+Vector3.new(-3,7,-7)),Vector3.new(4,4,0.2),Enum.Material.Glass,Color3.fromRGB(180,215,240),folder)
w1.Transparency=0.4
local w2=P("WindowRight",CFrame.new(sp+Vector3.new(3,7,-7)),Vector3.new(4,4,0.2),Enum.Material.Glass,Color3.fromRGB(180,215,240),folder)
w2.Transparency=0.4
-- Window Frames
P("WinFrameL",CFrame.new(sp+Vector3.new(-3,7,-7.15)),Vector3.new(4.4,4.4,0.1),Enum.Material.Wood,Color3.fromRGB(90,70,50),folder)
P("WinFrameR",CFrame.new(sp+Vector3.new(3,7,-7.15)),Vector3.new(4.4,4.4,0.1),Enum.Material.Wood,Color3.fromRGB(90,70,50),folder)
-- Front Door
P("Door",CFrame.new(sp+Vector3.new(0,4.5,-7)),Vector3.new(4,7.5,0.5),Enum.Material.Wood,Color3.fromRGB(100,65,30),folder)
P("DoorFrame",CFrame.new(sp+Vector3.new(0,4.5,-7.1)),Vector3.new(4.6,8,0.2),Enum.Material.Wood,Color3.fromRGB(80,55,25),folder)
P("DoorKnob",CFrame.new(sp+Vector3.new(1.5,4.5,-7.3)),Vector3.new(0.3,0.3,0.3),Enum.Material.Metal,Color3.fromRGB(180,170,150),folder)
-- Roof (pitched with 2 WedgeParts)
local r1=Instance.new("WedgePart") r1.Name="RoofLeft" r1.Size=Vector3.new(22,6,9) r1.CFrame=CFrame.new(sp+Vector3.new(0,14,-4.5))*CFrame.Angles(0,math.rad(180),0) r1.Material=Enum.Material.Slate r1.Color=Color3.fromRGB(75,60,50) r1.Anchored=true r1.Parent=folder
local r2=Instance.new("WedgePart") r2.Name="RoofRight" r2.Size=Vector3.new(22,6,9) r2.CFrame=CFrame.new(sp+Vector3.new(0,14,4.5)) r2.Material=Enum.Material.Slate r2.Color=Color3.fromRGB(75,60,50) r2.Anchored=true r2.Parent=folder
-- Chimney
P("Chimney",CFrame.new(sp+Vector3.new(6,15,3)),Vector3.new(2,5,2),Enum.Material.Brick,Color3.fromRGB(150,80,60),folder)
P("ChimneyTop",CFrame.new(sp+Vector3.new(6,17.75,3)),Vector3.new(2.5,0.5,2.5),Enum.Material.Concrete,Color3.fromRGB(120,115,110),folder)
-- Porch
P("PorchFloor",CFrame.new(sp+Vector3.new(0,0.5,-9)),Vector3.new(10,0.3,4),Enum.Material.WoodPlanks,Color3.fromRGB(140,100,60),folder)
P("PorchRoofBeam",CFrame.new(sp+Vector3.new(0,8.5,-9)),Vector3.new(10,0.3,4),Enum.Material.WoodPlanks,Color3.fromRGB(130,95,55),folder)
P("PorchPillarL",CFrame.new(sp+Vector3.new(-4,4.5,-10.5)),Vector3.new(0.6,8,0.6),Enum.Material.SmoothPlastic,Color3.fromRGB(230,225,220),folder)
P("PorchPillarR",CFrame.new(sp+Vector3.new(4,4.5,-10.5)),Vector3.new(0.6,8,0.6),Enum.Material.SmoothPlastic,Color3.fromRGB(230,225,220),folder)
-- Interior Light
local lp=P("LightFixture",CFrame.new(sp+Vector3.new(0,10.5,0)),Vector3.new(1,0.3,1),Enum.Material.Neon,Color3.fromRGB(255,220,160),folder)
local pl=Instance.new("PointLight") pl.Color=Color3.fromRGB(255,200,140) pl.Brightness=2 pl.Range=25 pl.Parent=lp
-- Porch Light
local pp=P("PorchLight",CFrame.new(sp+Vector3.new(0,8,-9.5)),Vector3.new(0.5,0.5,0.5),Enum.Material.Neon,Color3.fromRGB(255,210,140),folder)
local pl2=Instance.new("PointLight") pl2.Color=Color3.fromRGB(255,190,120) pl2.Brightness=1.5 pl2.Range=15 pl2.Parent=pp
\`\`\`

TEMPLATE: DETAILED CAR (15+ parts)
\`\`\`
-- Body
P("Body",CFrame.new(sp+Vector3.new(0,2,0)),Vector3.new(5,2,12),Enum.Material.SmoothPlastic,Color3.fromRGB(180,35,40),folder)
-- Hood (sloped)
local hood=Instance.new("WedgePart") hood.Name="Hood" hood.Size=Vector3.new(5,1,4) hood.CFrame=CFrame.new(sp+Vector3.new(0,2.5,-4.5))*CFrame.Angles(0,math.rad(180),0) hood.Material=Enum.Material.SmoothPlastic hood.Color=Color3.fromRGB(175,30,35) hood.Anchored=true hood.Parent=folder
-- Trunk (sloped)
local trunk=Instance.new("WedgePart") trunk.Name="Trunk" trunk.Size=Vector3.new(5,1,3) trunk.CFrame=CFrame.new(sp+Vector3.new(0,2.5,4)) trunk.Material=Enum.Material.SmoothPlastic trunk.Color=Color3.fromRGB(175,30,35) trunk.Anchored=true trunk.Parent=folder
-- Cabin
P("Cabin",CFrame.new(sp+Vector3.new(0,3.5,0)),Vector3.new(4.5,1.5,5),Enum.Material.SmoothPlastic,Color3.fromRGB(170,25,30),folder)
-- Windshield
local ws=P("Windshield",CFrame.new(sp+Vector3.new(0,3.5,-2.6)),Vector3.new(4,1.4,0.2),Enum.Material.Glass,Color3.fromRGB(200,220,240),folder)
ws.Transparency=0.4
-- Rear Window
local rw=P("RearWindow",CFrame.new(sp+Vector3.new(0,3.5,2.6)),Vector3.new(4,1.4,0.2),Enum.Material.Glass,Color3.fromRGB(200,220,240),folder)
rw.Transparency=0.4
-- Wheels (4 cylinders)
for _,offset in ipairs({{-2.8,0.7,-3.5},{2.8,0.7,-3.5},{-2.8,0.7,3.5},{2.8,0.7,3.5}}) do
  local w=Instance.new("Part") w.Name="Wheel" w.Shape=Enum.PartType.Cylinder w.Size=Vector3.new(0.8,1.6,1.6)
  w.CFrame=CFrame.new(sp+Vector3.new(offset[1],offset[2],offset[3]))*CFrame.Angles(0,0,math.rad(90))
  w.Material=Enum.Material.Slate w.Color=Color3.fromRGB(30,30,30) w.Anchored=true w.Parent=folder
  local hub=Instance.new("Part") hub.Name="Hubcap" hub.Shape=Enum.PartType.Cylinder hub.Size=Vector3.new(0.1,1,1)
  hub.CFrame=w.CFrame*CFrame.new(offset[1]>0 and 0.4 or -0.4,0,0)
  hub.Material=Enum.Material.Metal hub.Color=Color3.fromRGB(200,200,205) hub.Anchored=true hub.Parent=folder
end
-- Headlights
P("HeadlightL",CFrame.new(sp+Vector3.new(-1.8,2.2,-6)),Vector3.new(1,0.6,0.2),Enum.Material.Neon,Color3.fromRGB(255,250,220),folder)
P("HeadlightR",CFrame.new(sp+Vector3.new(1.8,2.2,-6)),Vector3.new(1,0.6,0.2),Enum.Material.Neon,Color3.fromRGB(255,250,220),folder)
-- Taillights
P("TaillightL",CFrame.new(sp+Vector3.new(-1.8,2.2,5.5)),Vector3.new(1,0.5,0.2),Enum.Material.Neon,Color3.fromRGB(255,20,20),folder)
P("TaillightR",CFrame.new(sp+Vector3.new(1.8,2.2,5.5)),Vector3.new(1,0.5,0.2),Enum.Material.Neon,Color3.fromRGB(255,20,20),folder)
-- Bumpers
P("FrontBumper",CFrame.new(sp+Vector3.new(0,1.3,-6.1)),Vector3.new(5.2,0.8,0.4),Enum.Material.Metal,Color3.fromRGB(60,60,65),folder)
P("RearBumper",CFrame.new(sp+Vector3.new(0,1.3,5.6)),Vector3.new(5.2,0.8,0.4),Enum.Material.Metal,Color3.fromRGB(60,60,65),folder)
-- Side Mirrors
P("MirrorL",CFrame.new(sp+Vector3.new(-2.8,3.2,-1.5)),Vector3.new(0.3,0.4,0.6),Enum.Material.SmoothPlastic,Color3.fromRGB(170,25,30),folder)
P("MirrorR",CFrame.new(sp+Vector3.new(2.8,3.2,-1.5)),Vector3.new(0.3,0.4,0.6),Enum.Material.SmoothPlastic,Color3.fromRGB(170,25,30),folder)
\`\`\`

TEMPLATE: DETAILED TREE (8+ parts)
\`\`\`
-- Trunk
local trunk=Instance.new("Part") trunk.Name="Trunk" trunk.Shape=Enum.PartType.Cylinder trunk.Size=Vector3.new(8,1.8,1.8)
trunk.CFrame=CFrame.new(sp+Vector3.new(0,4,0))*CFrame.Angles(0,0,math.rad(90))
trunk.Material=Enum.Material.Wood trunk.Color=Color3.fromRGB(100,70,40) trunk.Anchored=true trunk.Parent=folder
-- Root flare
local root=Instance.new("Part") root.Name="RootFlare" root.Shape=Enum.PartType.Cylinder root.Size=Vector3.new(1.5,2.5,2.5)
root.CFrame=CFrame.new(sp+Vector3.new(0,0.75,0))*CFrame.Angles(0,0,math.rad(90))
root.Material=Enum.Material.Wood root.Color=Color3.fromRGB(85,60,35) root.Anchored=true root.Parent=folder
-- Branch
local br=Instance.new("Part") br.Name="Branch" br.Shape=Enum.PartType.Cylinder br.Size=Vector3.new(4,0.5,0.5)
br.CFrame=CFrame.new(sp+Vector3.new(2,6.5,0))*CFrame.Angles(0,0,math.rad(30))
br.Material=Enum.Material.Wood br.Color=Color3.fromRGB(90,65,38) br.Anchored=true br.Parent=folder
-- Main canopy
local c1=Instance.new("Part") c1.Name="Canopy" c1.Shape=Enum.PartType.Ball c1.Size=Vector3.new(7,6,7)
c1.CFrame=CFrame.new(sp+Vector3.new(0,10,0)) c1.Material=Enum.Material.Grass c1.Color=Color3.fromRGB(60,120,40) c1.Anchored=true c1.Parent=folder
-- Secondary canopy layers (for depth)
local c2=Instance.new("Part") c2.Name="CanopyL" c2.Shape=Enum.PartType.Ball c2.Size=Vector3.new(5,4.5,5)
c2.CFrame=CFrame.new(sp+Vector3.new(-2.5,9,1)) c2.Material=Enum.Material.Grass c2.Color=vc(Color3.fromRGB(55,110,35),0.08) c2.Anchored=true c2.Parent=folder
local c3=Instance.new("Part") c3.Name="CanopyR" c3.Shape=Enum.PartType.Ball c3.Size=Vector3.new(5,4.5,5)
c3.CFrame=CFrame.new(sp+Vector3.new(2.5,9.5,-1)) c3.Material=Enum.Material.Grass c3.Color=vc(Color3.fromRGB(65,125,45),0.08) c3.Anchored=true c3.Parent=folder
-- Top tuft
local c4=Instance.new("Part") c4.Name="CanopyTop" c4.Shape=Enum.PartType.Ball c4.Size=Vector3.new(4,3.5,4)
c4.CFrame=CFrame.new(sp+Vector3.new(0,12.5,0)) c4.Material=Enum.Material.Grass c4.Color=vc(Color3.fromRGB(70,130,50),0.08) c4.Anchored=true c4.Parent=folder
\`\`\`

TEMPLATE: DETAILED TABLE + CHAIRS (12+ parts)
\`\`\`
-- Table top
P("TableTop",CFrame.new(sp+Vector3.new(0,3.5,0)),Vector3.new(5,0.3,3),Enum.Material.WoodPlanks,Color3.fromRGB(160,120,70),folder)
-- Table legs (4)
for _,pos in ipairs({{-2.1,1.75,-1.1},{2.1,1.75,-1.1},{-2.1,1.75,1.1},{2.1,1.75,1.1}}) do
  P("TableLeg",CFrame.new(sp+Vector3.new(pos[1],pos[2],pos[3])),Vector3.new(0.4,3.2,0.4),Enum.Material.Wood,Color3.fromRGB(140,100,55),folder)
end
-- Table stretcher bars
P("StretcherL",CFrame.new(sp+Vector3.new(0,0.8,-1.1)),Vector3.new(4.2,0.2,0.2),Enum.Material.Wood,Color3.fromRGB(135,95,50),folder)
P("StretcherR",CFrame.new(sp+Vector3.new(0,0.8,1.1)),Vector3.new(4.2,0.2,0.2),Enum.Material.Wood,Color3.fromRGB(135,95,50),folder)
-- Chair (repeat at 4 positions around table)
for i,cpos in ipairs({{0,0,-2.5,0},{0,0,2.5,180},{-3.5,0,0,90},{3.5,0,0,-90}}) do
  local cx,cy,cz,rot=cpos[1],cpos[2],cpos[3],cpos[4]
  local cf=CFrame.new(sp+Vector3.new(cx,0,cz))*CFrame.Angles(0,math.rad(rot),0)
  P("Seat"..i,cf*CFrame.new(0,2.2,0),Vector3.new(2,0.3,2),Enum.Material.WoodPlanks,Color3.fromRGB(150,110,65),folder)
  P("Backrest"..i,cf*CFrame.new(0,3.5,-0.9),Vector3.new(2,2.5,0.3),Enum.Material.WoodPlanks,Color3.fromRGB(145,105,60),folder)
  for j,lp in ipairs({{-0.7,1.1,0.5},{0.7,1.1,0.5},{-0.7,1.1,-0.5},{0.7,1.1,-0.5}}) do
    P("ChairLeg"..i.."_"..j,cf*CFrame.new(lp[1],lp[2],lp[3]),Vector3.new(0.3,2,0.3),Enum.Material.Wood,Color3.fromRGB(130,90,50),folder)
  end
end
\`\`\`

QUALITY RULES FOR ALL BUILDS:
1. MINIMUM 15 parts for any single object. More parts = more detail = more impressive.
2. Always use 2-3 slightly different color shades (vc() helper) for natural variation.
3. Doors are 4W x 7.5H studs. Windows are 3-4W x 3-4H. Ceilings at 11 studs from floor.
4. ALWAYS add PointLight to light sources (Brightness=2-4, Range=15-40).
5. Use proper materials: SmoothPlastic for modern painted surfaces, Brick/Cobblestone/Granite for stone, WoodPlanks for exposed wood, Metal for metal, Glass with Transparency 0.3-0.5.
6. Group everything in a Model with PrimaryPart set.
7. Add WeldConstraints between connected parts that should move together.
8. Vary wall thickness (0.5-1.0 studs), never paper-thin.
9. Include trim, molding, and edge detail — these 2-3 extra parts make builds look 10x better.
10. Position EVERYTHING using CFrame.new(sp + Vector3.new(x,y,z)) for camera-relative placement.
`
