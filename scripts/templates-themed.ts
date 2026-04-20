/**
 * Themed / special build templates — fantasy, sci-fi, seasonal.
 *
 * Same geometry rules as build-template-chunks.ts:
 * - Y position = ground (0) + half the part height
 * - Parts on other parts: Y = base_top + half_own_height
 * - No SmoothPlastic. Ever.
 * - All colors use Color3.fromRGB() with realistic values
 * - PointLights: Instance.new("PointLight") parented to a part
 */

import { BuildTemplate } from './build-template-chunks'

export const THEMED_TEMPLATES: BuildTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════
  // FANTASY / MAGIC (10)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Floating Island — chunk of land with waterfall edge and tree',
    tags: ['floating', 'island', 'fantasy', 'magic', 'sky', 'tree', 'waterfall'],
    description: 'A small floating island with grass top, dirt underside tapered look, a single tree, and a waterfall cascade off one edge. 10 parts.',
    code: `-- FLOATING ISLAND (10 parts) — hovers at Y=20
local folder = getFolder("FloatingIsland")

-- Main land mass (thick disc shape)
P("IslandTop", CFrame.new(0, 22, 0), Vector3.new(20, 2, 16), Enum.Material.Grass, Color3.fromRGB(85, 140, 60))
P("IslandDirt", CFrame.new(0, 20, 0), Vector3.new(18, 2, 14), Enum.Material.Ground, Color3.fromRGB(115, 80, 45))
P("IslandBase", CFrame.new(0, 18, 0), Vector3.new(12, 2, 10), Enum.Material.Rock, Color3.fromRGB(130, 125, 120))
P("IslandTip", CFrame.new(0, 16.5, 0), Vector3.new(6, 1, 5), Enum.Material.Rock, Color3.fromRGB(120, 115, 110))

-- Tree
P("TreeTrunk", CFrame.new(3, 25, -1), Vector3.new(1.5, 6, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 35))
P("TreeCanopy", CFrame.new(3, 29.5, -1), Vector3.new(7, 5, 7), Enum.Material.LeafyGrass, Color3.fromRGB(50, 120, 40))

-- Waterfall (thin neon strips cascading off the edge)
P("WaterfallTop", CFrame.new(-9, 22, 0), Vector3.new(2, 1, 4), Enum.Material.Neon, Color3.fromRGB(120, 180, 255))
P("WaterfallMid", CFrame.new(-10, 18, 0), Vector3.new(1.5, 6, 3), Enum.Material.Neon, Color3.fromRGB(100, 170, 255))
P("WaterfallLow", CFrame.new(-10, 13, 0), Vector3.new(1, 4, 2), Enum.Material.Neon, Color3.fromRGB(80, 160, 250))

-- Small rocks on surface
P("SurfaceRock", CFrame.new(-4, 23.25, 3), Vector3.new(2, 0.5, 1.5), Enum.Material.Rock, Color3.fromRGB(145, 140, 135))
`
  },

  {
    title: 'Dragon Egg Nest — large egg in hay with warm glow',
    tags: ['dragon', 'egg', 'nest', 'fantasy', 'magic', 'glow'],
    description: 'A dragon egg sitting in a nest of hay and twigs with a warm amber glow emanating from the egg. 8 parts.',
    code: `-- DRAGON EGG NEST (8 parts)
local folder = getFolder("DragonEggNest")

-- Nest base (flattened ring of hay)
P("NestBase", CFrame.new(0, 0.5, 0), Vector3.new(10, 1, 10), Enum.Material.Ground, Color3.fromRGB(160, 130, 70))
P("NestRimFront", CFrame.new(0, 1.5, 4.5), Vector3.new(8, 2, 1.5), Enum.Material.Ground, Color3.fromRGB(150, 120, 65))
P("NestRimBack", CFrame.new(0, 1.5, -4.5), Vector3.new(8, 2, 1.5), Enum.Material.Ground, Color3.fromRGB(150, 120, 65))
P("NestRimLeft", CFrame.new(-4.5, 1.5, 0), Vector3.new(1.5, 2, 7), Enum.Material.Ground, Color3.fromRGB(145, 115, 60))
P("NestRimRight", CFrame.new(4.5, 1.5, 0), Vector3.new(1.5, 2, 7), Enum.Material.Ground, Color3.fromRGB(145, 115, 60))

-- Twigs scattered
P("Twig1", CFrame.new(3, 1.1, 2) * CFrame.Angles(0, math.rad(35), math.rad(10)), Vector3.new(4, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 60, 30))
P("Twig2", CFrame.new(-2, 1.1, -1) * CFrame.Angles(0, math.rad(-50), math.rad(-8)), Vector3.new(3.5, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(85, 55, 28))

-- Dragon Egg (large, oval-ish using a tall part)
local egg = P("DragonEgg", CFrame.new(0, 3.5, 0), Vector3.new(3, 5, 3), Enum.Material.Marble, Color3.fromRGB(140, 40, 50))
local glow = Instance.new("PointLight")
glow.Range = 16
glow.Brightness = 1.5
glow.Color = Color3.fromRGB(255, 160, 50)
glow.Parent = egg
`
  },

  {
    title: 'Enchanted Well — stone well with glowing water and runes',
    tags: ['well', 'enchanted', 'magic', 'fantasy', 'runes', 'glow', 'water'],
    description: 'A circular stone well with glowing blue water inside, rune-marked pillars, and a wooden cross-beam with rope. 12 parts.',
    code: `-- ENCHANTED WELL (12 parts)
local folder = getFolder("EnchantedWell")

-- Stone base ring
P("WellBase", CFrame.new(0, 1.5, 0), Vector3.new(8, 3, 8), Enum.Material.Cobblestone, Color3.fromRGB(130, 125, 120))
-- Hollow center (darker interior wall representation)
P("WellInner", CFrame.new(0, 1.5, 0), Vector3.new(5, 3.1, 5), Enum.Material.Cobblestone, Color3.fromRGB(60, 58, 55))

-- Glowing water surface
local water = P("GlowingWater", CFrame.new(0, 1.2, 0), Vector3.new(4.8, 0.3, 4.8), Enum.Material.Neon, Color3.fromRGB(60, 160, 255))
local waterGlow = Instance.new("PointLight")
waterGlow.Range = 20
waterGlow.Brightness = 2
waterGlow.Color = Color3.fromRGB(80, 180, 255)
waterGlow.Parent = water

-- Stone rim (top lip)
P("WellRim", CFrame.new(0, 3.25, 0), Vector3.new(8.5, 0.5, 8.5), Enum.Material.Cobblestone, Color3.fromRGB(140, 135, 130))

-- Two support pillars
P("PillarLeft", CFrame.new(-3.5, 5.5, 0), Vector3.new(0.8, 5, 0.8), Enum.Material.Cobblestone, Color3.fromRGB(120, 115, 110))
P("PillarRight", CFrame.new(3.5, 5.5, 0), Vector3.new(0.8, 5, 0.8), Enum.Material.Cobblestone, Color3.fromRGB(120, 115, 110))

-- Rune blocks on pillars (small neon accents)
P("RuneLeft", CFrame.new(-3.5, 5.5, 0.41), Vector3.new(0.5, 1, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))
P("RuneRight", CFrame.new(3.5, 5.5, 0.41), Vector3.new(0.5, 1, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))

-- Cross beam
P("CrossBeam", CFrame.new(0, 8, 0), Vector3.new(8, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(100, 65, 35))

-- Rope hanging down
P("Rope", CFrame.new(0, 5.5, 0), Vector3.new(0.2, 5, 0.2), Enum.Material.Fabric, Color3.fromRGB(160, 140, 100))

-- Bucket
P("Bucket", CFrame.new(0, 3.5, 0), Vector3.new(1.2, 1, 1.2), Enum.Material.Metal, Color3.fromRGB(100, 95, 90))
`
  },

  {
    title: 'Fairy House — tiny house inside a mushroom cap',
    tags: ['fairy', 'mushroom', 'tiny', 'fantasy', 'magic', 'house'],
    description: 'A fairy-sized house built into a large mushroom. Spotted cap, stem door, tiny windows, and a small glow inside. 10 parts.',
    code: `-- FAIRY HOUSE (10 parts)
local folder = getFolder("FairyHouse")

-- Mushroom stem (the "house" body)
P("Stem", CFrame.new(0, 3, 0), Vector3.new(4, 6, 4), Enum.Material.Concrete, Color3.fromRGB(220, 200, 170))

-- Mushroom cap (wide, flat top)
P("CapBase", CFrame.new(0, 7, 0), Vector3.new(10, 2, 10), Enum.Material.Concrete, Color3.fromRGB(200, 50, 50))
P("CapTop", CFrame.new(0, 8.5, 0), Vector3.new(7, 1, 7), Enum.Material.Concrete, Color3.fromRGB(190, 45, 45))
P("CapTip", CFrame.new(0, 9.25, 0), Vector3.new(3, 0.5, 3), Enum.Material.Concrete, Color3.fromRGB(180, 40, 40))

-- White spots on cap
P("Spot1", CFrame.new(3, 7.8, 2), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Concrete, Color3.fromRGB(245, 245, 240))
P("Spot2", CFrame.new(-2, 7.8, -3), Vector3.new(1, 0.3, 1), Enum.Material.Concrete, Color3.fromRGB(245, 245, 240))
P("Spot3", CFrame.new(0, 8.3, 3), Vector3.new(0.8, 0.3, 0.8), Enum.Material.Concrete, Color3.fromRGB(245, 245, 240))

-- Door (arched look = small dark rectangle)
P("Door", CFrame.new(0, 1.5, 2.01), Vector3.new(1.2, 2, 0.1), Enum.Material.Wood, Color3.fromRGB(80, 50, 25))

-- Window (small, round-ish)
P("Window", CFrame.new(1.5, 3.5, 2.01), Vector3.new(0.8, 0.8, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 220, 100))

-- Interior glow
local glowPart = P("InteriorGlow", CFrame.new(0, 2, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 200, 80))
local light = Instance.new("PointLight")
light.Range = 12
light.Brightness = 1
light.Color = Color3.fromRGB(255, 200, 80)
light.Parent = glowPart
`
  },

  {
    title: 'Giant Sword in Ground — massive blade stuck in stone',
    tags: ['sword', 'giant', 'fantasy', 'epic', 'weapon', 'stone', 'excalibur'],
    description: 'A huge sword driven blade-down into a cracked stone platform. Blade, cross-guard, grip, and pommel. 9 parts.',
    code: `-- GIANT SWORD IN GROUND (9 parts)
local folder = getFolder("GiantSword")

-- Stone platform (cracked ground)
P("StonePlatform", CFrame.new(0, 0.75, 0), Vector3.new(12, 1.5, 12), Enum.Material.Slate, Color3.fromRGB(120, 115, 110))
P("CrackRing", CFrame.new(0, 1.55, 0), Vector3.new(5, 0.1, 5), Enum.Material.Rock, Color3.fromRGB(90, 85, 80))

-- Blade (tall, thin — lower half embedded in stone)
P("Blade", CFrame.new(0, 8, 0), Vector3.new(0.5, 14, 2.5), Enum.Material.Metal, Color3.fromRGB(200, 210, 220))

-- Blade edge highlights
P("BladeEdgeL", CFrame.new(-0.3, 8, 0), Vector3.new(0.05, 13, 2.3), Enum.Material.Metal, Color3.fromRGB(230, 235, 240))
P("BladeEdgeR", CFrame.new(0.3, 8, 0), Vector3.new(0.05, 13, 2.3), Enum.Material.Metal, Color3.fromRGB(230, 235, 240))

-- Cross-guard
P("CrossGuard", CFrame.new(0, 15.25, 0), Vector3.new(1, 1, 6), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))

-- Grip (leather-wrapped)
P("Grip", CFrame.new(0, 17.75, 0), Vector3.new(0.8, 4, 0.8), Enum.Material.Fabric, Color3.fromRGB(60, 35, 20))

-- Pommel
P("Pommel", CFrame.new(0, 20, 0), Vector3.new(1.5, 1, 1.5), Enum.Material.Metal, Color3.fromRGB(170, 150, 55))

-- Faint glow at blade insertion point
local glowPart = P("InsertionGlow", CFrame.new(0, 1.6, 0), Vector3.new(3, 0.2, 3), Enum.Material.Neon, Color3.fromRGB(180, 200, 255))
local glow = Instance.new("PointLight")
glow.Range = 10
glow.Brightness = 0.8
glow.Color = Color3.fromRGB(180, 200, 255)
glow.Parent = glowPart
`
  },

  {
    title: 'Ruined Castle Wall — broken crumbling wall section with ivy',
    tags: ['castle', 'ruins', 'wall', 'fantasy', 'medieval', 'broken', 'ivy'],
    description: 'A crumbling castle wall section with irregular top edge, scattered rubble at the base, and patches of ivy/moss. 12 parts.',
    code: `-- RUINED CASTLE WALL (12 parts)
local folder = getFolder("RuinedCastleWall")

-- Main wall section (tall, partially broken)
P("WallMain", CFrame.new(0, 5, 0), Vector3.new(16, 10, 2), Enum.Material.Cobblestone, Color3.fromRGB(130, 125, 115))

-- Broken top — staggered blocks to simulate crumbling
P("BrokenTop1", CFrame.new(-5, 10.5, 0), Vector3.new(3, 1, 2), Enum.Material.Cobblestone, Color3.fromRGB(125, 120, 110))
P("BrokenTop2", CFrame.new(-1, 11, 0), Vector3.new(2, 2, 2), Enum.Material.Cobblestone, Color3.fromRGB(128, 123, 113))
P("BrokenTop3", CFrame.new(4, 10.75, 0), Vector3.new(4, 1.5, 2), Enum.Material.Cobblestone, Color3.fromRGB(122, 117, 108))

-- Rubble at base
P("Rubble1", CFrame.new(-3, 0.5, 2) * CFrame.Angles(0, math.rad(20), math.rad(15)), Vector3.new(2, 1, 1.5), Enum.Material.Cobblestone, Color3.fromRGB(115, 110, 105))
P("Rubble2", CFrame.new(5, 0.4, 1.5) * CFrame.Angles(0, math.rad(-30), math.rad(8)), Vector3.new(1.5, 0.8, 1), Enum.Material.Cobblestone, Color3.fromRGB(110, 105, 100))
P("Rubble3", CFrame.new(2, 0.3, 2.5), Vector3.new(1, 0.6, 0.8), Enum.Material.Cobblestone, Color3.fromRGB(120, 115, 108))

-- Arrow slit (dark inset)
P("ArrowSlit", CFrame.new(-3, 6, 1.01), Vector3.new(0.4, 2.5, 0.1), Enum.Material.Concrete, Color3.fromRGB(30, 28, 25))

-- Ivy patches (leafy green accents on wall face)
P("Ivy1", CFrame.new(3, 4, 1.05), Vector3.new(3, 4, 0.2), Enum.Material.LeafyGrass, Color3.fromRGB(45, 100, 35))
P("Ivy2", CFrame.new(-6, 7, 1.05), Vector3.new(2, 3, 0.2), Enum.Material.LeafyGrass, Color3.fromRGB(50, 110, 40))
P("Ivy3", CFrame.new(6, 2, 1.05), Vector3.new(2, 2.5, 0.2), Enum.Material.LeafyGrass, Color3.fromRGB(40, 95, 30))
`
  },

  {
    title: 'Ancient Altar — stone slab with rune circle, candles, offerings',
    tags: ['altar', 'ancient', 'rune', 'ritual', 'fantasy', 'magic', 'candle'],
    description: 'A stone altar slab on a raised platform with a glowing rune circle, candles at corners, and offering bowls. 12 parts.',
    code: `-- ANCIENT ALTAR (12 parts)
local folder = getFolder("AncientAltar")

-- Stepped platform
P("PlatformBase", CFrame.new(0, 0.5, 0), Vector3.new(12, 1, 12), Enum.Material.Slate, Color3.fromRGB(100, 95, 90))
P("PlatformStep", CFrame.new(0, 1.25, 0), Vector3.new(9, 0.5, 9), Enum.Material.Slate, Color3.fromRGB(110, 105, 100))

-- Altar slab (thick stone table)
P("AltarSlab", CFrame.new(0, 2.5, 0), Vector3.new(6, 1.5, 4), Enum.Material.Granite, Color3.fromRGB(90, 85, 80))

-- Rune circle on platform (flat neon disc)
local runeCircle = P("RuneCircle", CFrame.new(0, 1.55, 0), Vector3.new(8, 0.1, 8), Enum.Material.Neon, Color3.fromRGB(120, 50, 200))
local runeGlow = Instance.new("PointLight")
runeGlow.Range = 14
runeGlow.Brightness = 1.2
runeGlow.Color = Color3.fromRGB(140, 60, 220)
runeGlow.Parent = runeCircle

-- Candles at four corners
P("Candle1", CFrame.new(4, 2, 4), Vector3.new(0.4, 2, 0.4), Enum.Material.Concrete, Color3.fromRGB(230, 220, 190))
P("Candle2", CFrame.new(-4, 2, 4), Vector3.new(0.4, 2, 0.4), Enum.Material.Concrete, Color3.fromRGB(230, 220, 190))
P("Candle3", CFrame.new(4, 2, -4), Vector3.new(0.4, 2, 0.4), Enum.Material.Concrete, Color3.fromRGB(230, 220, 190))
P("Candle4", CFrame.new(-4, 2, -4), Vector3.new(0.4, 2, 0.4), Enum.Material.Concrete, Color3.fromRGB(230, 220, 190))

-- Offering bowl on slab
P("OfferingBowl", CFrame.new(0, 3.5, 0), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Metal, Color3.fromRGB(170, 140, 50))

-- Offering contents (glowing orb)
local orb = P("OfferingOrb", CFrame.new(0, 3.9, 0), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Neon, Color3.fromRGB(200, 80, 255))
local orbGlow = Instance.new("PointLight")
orbGlow.Range = 8
orbGlow.Brightness = 1.5
orbGlow.Color = Color3.fromRGB(200, 80, 255)
orbGlow.Parent = orb
`
  },

  {
    title: "Witch's Cauldron — large pot, fire, green glow, shelf",
    tags: ['witch', 'cauldron', 'potion', 'fantasy', 'magic', 'fire', 'spooky'],
    description: 'A large iron cauldron over a fire with bubbling green potion glow, plus a nearby ingredient shelf. 11 parts.',
    code: `-- WITCH'S CAULDRON (11 parts)
local folder = getFolder("WitchCauldron")

-- Cauldron body (large pot)
P("CauldronBody", CFrame.new(0, 2.5, 0), Vector3.new(6, 5, 6), Enum.Material.Metal, Color3.fromRGB(50, 48, 45))
P("CauldronRim", CFrame.new(0, 5.25, 0), Vector3.new(6.5, 0.5, 6.5), Enum.Material.Metal, Color3.fromRGB(60, 58, 55))

-- Cauldron legs (3 short stumps)
P("Leg1", CFrame.new(-2, 0.4, 1.5), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Metal, Color3.fromRGB(45, 43, 40))
P("Leg2", CFrame.new(2, 0.4, 1.5), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Metal, Color3.fromRGB(45, 43, 40))
P("Leg3", CFrame.new(0, 0.4, -2), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Metal, Color3.fromRGB(45, 43, 40))

-- Green potion surface
local potionSurface = P("PotionSurface", CFrame.new(0, 4.5, 0), Vector3.new(5, 0.3, 5), Enum.Material.Neon, Color3.fromRGB(50, 220, 60))
local potionGlow = Instance.new("PointLight")
potionGlow.Range = 18
potionGlow.Brightness = 2
potionGlow.Color = Color3.fromRGB(50, 220, 60)
potionGlow.Parent = potionSurface

-- Fire underneath
P("FireLog1", CFrame.new(-0.5, 0.3, 0) * CFrame.Angles(0, math.rad(30), 0), Vector3.new(3, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(80, 45, 20))
P("FireLog2", CFrame.new(0.5, 0.3, 0) * CFrame.Angles(0, math.rad(-30), 0), Vector3.new(3, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(75, 40, 18))

-- Ingredient shelf nearby
P("ShelfFrame", CFrame.new(6, 3, 0), Vector3.new(3, 6, 1), Enum.Material.Wood, Color3.fromRGB(90, 55, 30))
P("ShelfBoard1", CFrame.new(6, 2, 0), Vector3.new(3.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 35))
P("ShelfBoard2", CFrame.new(6, 4.5, 0), Vector3.new(3.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 35))
`
  },

  {
    title: 'Floating Crystal Formation — hovering crystals with central glow',
    tags: ['crystal', 'floating', 'magic', 'fantasy', 'gem', 'glow'],
    description: 'Five angled crystal shards hovering above a stone base with a central energy glow. 9 parts.',
    code: `-- FLOATING CRYSTAL FORMATION (9 parts)
local folder = getFolder("FloatingCrystals")

-- Stone base
P("StoneBase", CFrame.new(0, 0.5, 0), Vector3.new(8, 1, 8), Enum.Material.Slate, Color3.fromRGB(100, 95, 90))

-- Central energy core (small neon sphere)
local core = P("EnergyCore", CFrame.new(0, 6, 0), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Neon, Color3.fromRGB(180, 100, 255))
local coreGlow = Instance.new("PointLight")
coreGlow.Range = 24
coreGlow.Brightness = 3
coreGlow.Color = Color3.fromRGB(180, 100, 255)
coreGlow.Parent = core

-- Crystal shards (angled, hovering)
P("Crystal1", CFrame.new(0, 8, 0) * CFrame.Angles(0, 0, math.rad(5)), Vector3.new(1.2, 5, 1.2), Enum.Material.Ice, Color3.fromRGB(160, 80, 240))
P("Crystal2", CFrame.new(3, 5.5, 0) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(1, 4, 1), Enum.Material.Ice, Color3.fromRGB(140, 60, 220))
P("Crystal3", CFrame.new(-2.5, 5, 2) * CFrame.Angles(0, math.rad(45), math.rad(-15)), Vector3.new(0.8, 3.5, 0.8), Enum.Material.Ice, Color3.fromRGB(170, 90, 250))
P("Crystal4", CFrame.new(-1, 4.5, -3) * CFrame.Angles(0, math.rad(-30), math.rad(25)), Vector3.new(1.1, 4, 1.1), Enum.Material.Ice, Color3.fromRGB(150, 70, 230))
P("Crystal5", CFrame.new(2, 4, -2) * CFrame.Angles(0, math.rad(60), math.rad(-10)), Vector3.new(0.9, 3, 0.9), Enum.Material.Ice, Color3.fromRGB(130, 55, 210))

-- Ground rune
P("GroundRune", CFrame.new(0, 1.05, 0), Vector3.new(6, 0.1, 6), Enum.Material.Neon, Color3.fromRGB(150, 80, 240))
`
  },

  {
    title: 'Dark Portal — ominous archway with red/black glow and chains',
    tags: ['portal', 'dark', 'evil', 'fantasy', 'gateway', 'nether', 'chains'],
    description: 'An ominous stone archway with a swirling red/black neon portal surface, flanking chains, and eerie glow. 12 parts.',
    code: `-- DARK PORTAL (12 parts)
local folder = getFolder("DarkPortal")

-- Base platform
P("PortalBase", CFrame.new(0, 0.5, 0), Vector3.new(14, 1, 6), Enum.Material.Slate, Color3.fromRGB(40, 35, 35))

-- Left pillar
P("PillarL", CFrame.new(-5, 7, 0), Vector3.new(2, 12, 2), Enum.Material.Cobblestone, Color3.fromRGB(50, 45, 45))
P("PillarLCap", CFrame.new(-5, 13.25, 0), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Cobblestone, Color3.fromRGB(55, 50, 48))

-- Right pillar
P("PillarR", CFrame.new(5, 7, 0), Vector3.new(2, 12, 2), Enum.Material.Cobblestone, Color3.fromRGB(50, 45, 45))
P("PillarRCap", CFrame.new(5, 13.25, 0), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Cobblestone, Color3.fromRGB(55, 50, 48))

-- Arch top
P("Arch", CFrame.new(0, 13.5, 0), Vector3.new(12, 1.5, 2), Enum.Material.Cobblestone, Color3.fromRGB(50, 45, 45))

-- Portal surface (neon, fills the archway)
local portalSurface = P("PortalSurface", CFrame.new(0, 7.5, 0), Vector3.new(8, 12, 0.3), Enum.Material.Neon, Color3.fromRGB(180, 20, 20))
local portalGlow = Instance.new("PointLight")
portalGlow.Range = 24
portalGlow.Brightness = 2.5
portalGlow.Color = Color3.fromRGB(200, 30, 30)
portalGlow.Parent = portalSurface

-- Dark inner edge
P("PortalEdge", CFrame.new(0, 7.5, -0.2), Vector3.new(8.5, 12.5, 0.1), Enum.Material.Neon, Color3.fromRGB(30, 5, 5))

-- Chains (vertical strips hanging from arch)
P("ChainL", CFrame.new(-3, 10, 1), Vector3.new(0.3, 6, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 65, 60))
P("ChainR", CFrame.new(3, 9, 1), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 65, 60))

-- Skull decoration on arch
P("SkullDecor", CFrame.new(0, 13.5, 1.1), Vector3.new(1.5, 1.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(200, 195, 180))
`
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCI-FI / MODERN (10)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Satellite Dish — large dish on gimbal mount with base station',
    tags: ['satellite', 'dish', 'antenna', 'sci-fi', 'space', 'communication', 'radar'],
    description: 'A large satellite dish on a rotating mount with a support pylon and small base station building. 10 parts.',
    code: `-- SATELLITE DISH (10 parts)
local folder = getFolder("SatelliteDish")

-- Base station building
P("BaseStation", CFrame.new(5, 2, 0), Vector3.new(6, 4, 4), Enum.Material.Metal, Color3.fromRGB(160, 165, 170))
P("BaseRoof", CFrame.new(5, 4.25, 0), Vector3.new(6.5, 0.5, 4.5), Enum.Material.Metal, Color3.fromRGB(140, 145, 150))

-- Support pylon
P("Pylon", CFrame.new(-3, 5, 0), Vector3.new(2, 10, 2), Enum.Material.Metal, Color3.fromRGB(130, 135, 140))

-- Gimbal mount
P("GimbalBase", CFrame.new(-3, 10.5, 0), Vector3.new(3, 1, 3), Enum.Material.Metal, Color3.fromRGB(120, 125, 130))
P("GimbalArm", CFrame.new(-3, 12, 0) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(1, 3, 1), Enum.Material.Metal, Color3.fromRGB(115, 120, 125))

-- Dish (wide, thin, angled)
P("DishBack", CFrame.new(-3, 14, -2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(10, 0.3, 10), Enum.Material.Metal, Color3.fromRGB(200, 205, 210))
P("DishFront", CFrame.new(-3, 14.2, -1.8) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(9, 0.2, 9), Enum.Material.Metal, Color3.fromRGB(220, 225, 230))

-- Feed horn (small rod pointing at dish center)
P("FeedHorn", CFrame.new(-3, 14, 2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(0.4, 0.4, 4), Enum.Material.Metal, Color3.fromRGB(100, 105, 110))

-- Cable from dish to base
P("Cable", CFrame.new(1, 5, 0), Vector3.new(0.3, 8, 0.3), Enum.Material.Fabric, Color3.fromRGB(40, 40, 40))

-- Antenna light (red blinking)
local light = P("AntennaLight", CFrame.new(-3, 15, -3), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 30, 30))
local beacon = Instance.new("PointLight")
beacon.Range = 10
beacon.Brightness = 1
beacon.Color = Color3.fromRGB(255, 30, 30)
beacon.Parent = light
`
  },

  {
    title: 'Robot / Mech — humanoid mech suit with cockpit',
    tags: ['robot', 'mech', 'mecha', 'sci-fi', 'armor', 'humanoid'],
    description: 'A standing humanoid mech suit with torso cockpit, arms, legs, and head visor. 15 parts.',
    code: `-- ROBOT / MECH (15 parts) — stands about 20 studs tall
local folder = getFolder("MechSuit")

-- Feet
P("FootL", CFrame.new(-3, 0.5, 0), Vector3.new(3, 1, 4), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))
P("FootR", CFrame.new(3, 0.5, 0), Vector3.new(3, 1, 4), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))

-- Lower legs
P("ShinL", CFrame.new(-3, 3.5, 0), Vector3.new(2, 5, 2), Enum.Material.Metal, Color3.fromRGB(100, 105, 110))
P("ShinR", CFrame.new(3, 3.5, 0), Vector3.new(2, 5, 2), Enum.Material.Metal, Color3.fromRGB(100, 105, 110))

-- Upper legs (thighs)
P("ThighL", CFrame.new(-3, 7.5, 0), Vector3.new(2.5, 3, 2.5), Enum.Material.Metal, Color3.fromRGB(110, 115, 120))
P("ThighR", CFrame.new(3, 7.5, 0), Vector3.new(2.5, 3, 2.5), Enum.Material.Metal, Color3.fromRGB(110, 115, 120))

-- Torso / cockpit
P("Torso", CFrame.new(0, 11.5, 0), Vector3.new(8, 5, 4), Enum.Material.Metal, Color3.fromRGB(130, 135, 140))
P("CockpitGlass", CFrame.new(0, 11.5, 2.1), Vector3.new(4, 2.5, 0.2), Enum.Material.Glass, Color3.fromRGB(140, 200, 230))

-- Shoulders
P("ShoulderL", CFrame.new(-5.5, 13, 0), Vector3.new(3, 2, 3), Enum.Material.Metal, Color3.fromRGB(140, 145, 150))
P("ShoulderR", CFrame.new(5.5, 13, 0), Vector3.new(3, 2, 3), Enum.Material.Metal, Color3.fromRGB(140, 145, 150))

-- Arms
P("ArmL", CFrame.new(-5.5, 10, 0), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(95, 100, 105))
P("ArmR", CFrame.new(5.5, 10, 0), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(95, 100, 105))

-- Head
P("Head", CFrame.new(0, 15, 0), Vector3.new(4, 3, 3), Enum.Material.Metal, Color3.fromRGB(120, 125, 130))

-- Visor
local visor = P("Visor", CFrame.new(0, 15.2, 1.55), Vector3.new(3, 1, 0.1), Enum.Material.Neon, Color3.fromRGB(50, 200, 255))
local visorGlow = Instance.new("PointLight")
visorGlow.Range = 8
visorGlow.Brightness = 1
visorGlow.Color = Color3.fromRGB(50, 200, 255)
visorGlow.Parent = visor

-- Exhaust vents on back
P("ExhaustVent", CFrame.new(0, 12, -2.3), Vector3.new(3, 2, 0.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
`
  },

  {
    title: 'Hologram Projector — base unit with holographic display',
    tags: ['hologram', 'projector', 'sci-fi', 'tech', 'neon', 'display', 'futuristic'],
    description: 'A tech base unit projecting a holographic display upward, with a console panel. 9 parts.',
    code: `-- HOLOGRAM PROJECTOR (9 parts)
local folder = getFolder("HologramProjector")

-- Base unit
P("BaseUnit", CFrame.new(0, 0.75, 0), Vector3.new(6, 1.5, 4), Enum.Material.Metal, Color3.fromRGB(50, 55, 65))
P("BaseTop", CFrame.new(0, 1.6, 0), Vector3.new(5, 0.2, 3), Enum.Material.Metal, Color3.fromRGB(60, 65, 75))

-- Projector lens (emitter ring)
local lens = P("ProjectorLens", CFrame.new(0, 1.85, 0), Vector3.new(2, 0.3, 2), Enum.Material.Neon, Color3.fromRGB(50, 180, 255))
local lensGlow = Instance.new("PointLight")
lensGlow.Range = 6
lensGlow.Brightness = 1
lensGlow.Color = Color3.fromRGB(50, 180, 255)
lensGlow.Parent = lens

-- Holographic display (transparent neon shapes floating above)
local holoBase = P("HoloBase", CFrame.new(0, 4, 0), Vector3.new(3, 0.1, 3), Enum.Material.Neon, Color3.fromRGB(60, 200, 255))
local holoGlow = Instance.new("PointLight")
holoGlow.Range = 12
holoGlow.Brightness = 1.5
holoGlow.Color = Color3.fromRGB(60, 200, 255)
holoGlow.Parent = holoBase

P("HoloShape1", CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(45), 0), Vector3.new(2, 2, 0.05), Enum.Material.Neon, Color3.fromRGB(70, 210, 255))
P("HoloShape2", CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(-45), 0), Vector3.new(2, 2, 0.05), Enum.Material.Neon, Color3.fromRGB(70, 210, 255))

-- Console panel
P("ConsoleFront", CFrame.new(0, 1.2, 2.5) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(4, 0.2, 2), Enum.Material.Metal, Color3.fromRGB(45, 50, 60))
P("ConsoleScreen", CFrame.new(0, 1.35, 2.5) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(3, 0.05, 1.5), Enum.Material.Neon, Color3.fromRGB(40, 160, 220))
`
  },

  {
    title: 'Cryo Pod — vertical tube with frost effect and control panel',
    tags: ['cryo', 'pod', 'cryogenic', 'sci-fi', 'freeze', 'stasis', 'capsule'],
    description: 'A vertical cryogenic stasis pod with glass door, frost-colored accents, base unit, and control panel. 10 parts.',
    code: `-- CRYO POD (10 parts)
local folder = getFolder("CryoPod")

-- Base platform
P("PodBase", CFrame.new(0, 0.5, 0), Vector3.new(5, 1, 4), Enum.Material.Metal, Color3.fromRGB(70, 75, 85))

-- Pod frame (back wall)
P("PodFrame", CFrame.new(0, 5, -1.5), Vector3.new(4, 8, 1), Enum.Material.Metal, Color3.fromRGB(80, 85, 95))

-- Pod sides
P("PodSideL", CFrame.new(-2, 5, 0), Vector3.new(0.5, 8, 3), Enum.Material.Metal, Color3.fromRGB(75, 80, 90))
P("PodSideR", CFrame.new(2, 5, 0), Vector3.new(0.5, 8, 3), Enum.Material.Metal, Color3.fromRGB(75, 80, 90))

-- Glass door (front)
P("GlassDoor", CFrame.new(0, 5, 1), Vector3.new(3.5, 7.5, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 220, 240))

-- Frost accent strips
local frost = P("FrostEffect", CFrame.new(0, 3, 1.15), Vector3.new(2.5, 3, 0.1), Enum.Material.Neon, Color3.fromRGB(180, 230, 255))
local frostGlow = Instance.new("PointLight")
frostGlow.Range = 8
frostGlow.Brightness = 0.8
frostGlow.Color = Color3.fromRGB(180, 230, 255)
frostGlow.Parent = frost

-- Pod top cap
P("PodCap", CFrame.new(0, 9.25, 0), Vector3.new(4.5, 0.5, 3.5), Enum.Material.Metal, Color3.fromRGB(80, 85, 95))

-- Control panel (angled screen to the side)
P("PanelStand", CFrame.new(4, 3, 0), Vector3.new(1, 6, 1), Enum.Material.Metal, Color3.fromRGB(65, 70, 80))
P("PanelScreen", CFrame.new(4, 5, 0.8) * CFrame.Angles(math.rad(-15), 0, 0), Vector3.new(2, 2.5, 0.2), Enum.Material.Neon, Color3.fromRGB(40, 180, 120))

-- Status indicator
P("StatusLight", CFrame.new(0, 9.5, 0.5), Vector3.new(0.5, 0.2, 0.5), Enum.Material.Neon, Color3.fromRGB(50, 255, 100))
`
  },

  {
    title: 'Control Room Console — curved desk with screens, buttons, chair',
    tags: ['control', 'console', 'desk', 'sci-fi', 'command', 'monitor', 'chair'],
    description: 'A curved mission-control style console desk with multiple screens, button panels, and a swivel chair. 12 parts.',
    code: `-- CONTROL ROOM CONSOLE (12 parts)
local folder = getFolder("ControlConsole")

-- Curved desk (approximated with 3 angled sections)
P("DeskCenter", CFrame.new(0, 2, 0), Vector3.new(8, 4, 2), Enum.Material.Metal, Color3.fromRGB(55, 60, 70))
P("DeskLeft", CFrame.new(-5.5, 2, 1.5) * CFrame.Angles(0, math.rad(30), 0), Vector3.new(4, 4, 2), Enum.Material.Metal, Color3.fromRGB(55, 60, 70))
P("DeskRight", CFrame.new(5.5, 2, 1.5) * CFrame.Angles(0, math.rad(-30), 0), Vector3.new(4, 4, 2), Enum.Material.Metal, Color3.fromRGB(55, 60, 70))

-- Desk surface
P("DeskSurface", CFrame.new(0, 4.1, 0), Vector3.new(8.5, 0.2, 2.5), Enum.Material.Metal, Color3.fromRGB(65, 70, 80))

-- Main screen (large center)
P("MainScreen", CFrame.new(0, 6.5, -0.5) * CFrame.Angles(math.rad(-5), 0, 0), Vector3.new(6, 4, 0.2), Enum.Material.Neon, Color3.fromRGB(30, 120, 200))

-- Side screens (smaller)
P("ScreenL", CFrame.new(-5, 5.5, 1) * CFrame.Angles(math.rad(-5), math.rad(30), 0), Vector3.new(3, 2.5, 0.2), Enum.Material.Neon, Color3.fromRGB(30, 150, 180))
P("ScreenR", CFrame.new(5, 5.5, 1) * CFrame.Angles(math.rad(-5), math.rad(-30), 0), Vector3.new(3, 2.5, 0.2), Enum.Material.Neon, Color3.fromRGB(30, 150, 180))

-- Button panels on desk surface
P("ButtonPanelL", CFrame.new(-2.5, 4.25, 0.5), Vector3.new(2, 0.15, 1), Enum.Material.Neon, Color3.fromRGB(200, 50, 50))
P("ButtonPanelR", CFrame.new(2.5, 4.25, 0.5), Vector3.new(2, 0.15, 1), Enum.Material.Neon, Color3.fromRGB(50, 200, 50))

-- Chair
P("ChairSeat", CFrame.new(0, 2.5, 4), Vector3.new(3, 0.5, 3), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("ChairBack", CFrame.new(0, 4.5, 5.3), Vector3.new(3, 4, 0.5), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("ChairBase", CFrame.new(0, 1.25, 4), Vector3.new(1, 2.5, 1), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
`
  },

  {
    title: 'Landing Pad — helipad circle with edge lights and wind sock',
    tags: ['landing', 'pad', 'helipad', 'helicopter', 'airport', 'sci-fi', 'modern'],
    description: 'A raised landing pad platform with an H marking, perimeter lights, and a wind sock pole. 11 parts.',
    code: `-- LANDING PAD (11 parts)
local folder = getFolder("LandingPad")

-- Main platform
P("PadBase", CFrame.new(0, 0.5, 0), Vector3.new(24, 1, 24), Enum.Material.Concrete, Color3.fromRGB(140, 140, 140))
P("PadSurface", CFrame.new(0, 1.1, 0), Vector3.new(22, 0.2, 22), Enum.Material.Concrete, Color3.fromRGB(160, 160, 160))

-- H marking (two vertical bars + crossbar)
P("H_Left", CFrame.new(-2, 1.25, 0), Vector3.new(1, 0.1, 8), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("H_Right", CFrame.new(2, 1.25, 0), Vector3.new(1, 0.1, 8), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("H_Cross", CFrame.new(0, 1.25, 0), Vector3.new(5, 0.1, 1.5), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))

-- Edge lights (4 corners)
local l1 = P("EdgeLight1", CFrame.new(10, 1.5, 10), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
local l1g = Instance.new("PointLight"); l1g.Range = 8; l1g.Brightness = 1; l1g.Color = Color3.fromRGB(50, 255, 50); l1g.Parent = l1
local l2 = P("EdgeLight2", CFrame.new(-10, 1.5, 10), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
local l2g = Instance.new("PointLight"); l2g.Range = 8; l2g.Brightness = 1; l2g.Color = Color3.fromRGB(50, 255, 50); l2g.Parent = l2
local l3 = P("EdgeLight3", CFrame.new(10, 1.5, -10), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
local l3g = Instance.new("PointLight"); l3g.Range = 8; l3g.Brightness = 1; l3g.Color = Color3.fromRGB(50, 255, 50); l3g.Parent = l3
local l4 = P("EdgeLight4", CFrame.new(-10, 1.5, -10), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
local l4g = Instance.new("PointLight"); l4g.Range = 8; l4g.Brightness = 1; l4g.Color = Color3.fromRGB(50, 255, 50); l4g.Parent = l4

-- Wind sock pole
P("WindPole", CFrame.new(12, 4, -12), Vector3.new(0.4, 8, 0.4), Enum.Material.Metal, Color3.fromRGB(150, 150, 150))
P("WindSock", CFrame.new(12.8, 7.5, -12) * CFrame.Angles(0, 0, math.rad(15)), Vector3.new(2.5, 0.8, 0.8), Enum.Material.Fabric, Color3.fromRGB(255, 100, 30))
`
  },

  {
    title: 'Security Checkpoint — barrier arms, guard booth, scanner arch',
    tags: ['security', 'checkpoint', 'barrier', 'guard', 'gate', 'modern', 'booth'],
    description: 'A security checkpoint with a guard booth, barrier arm gate, and a walk-through scanner arch. 11 parts.',
    code: `-- SECURITY CHECKPOINT (11 parts)
local folder = getFolder("SecurityCheckpoint")

-- Guard booth
P("BoothWalls", CFrame.new(-6, 3, 0), Vector3.new(5, 6, 4), Enum.Material.Metal, Color3.fromRGB(160, 165, 170))
P("BoothRoof", CFrame.new(-6, 6.25, 0), Vector3.new(5.5, 0.5, 4.5), Enum.Material.Metal, Color3.fromRGB(140, 145, 150))
P("BoothWindow", CFrame.new(-3.45, 4, 0), Vector3.new(0.1, 2.5, 3), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))

-- Barrier arm post
P("BarrierPost", CFrame.new(0, 2, 0), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(200, 200, 50))

-- Barrier arm (horizontal)
P("BarrierArm", CFrame.new(4, 4, 0), Vector3.new(8, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(220, 30, 30))

-- Scanner arch
P("ScannerLeft", CFrame.new(10, 4, -2), Vector3.new(1, 8, 1), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))
P("ScannerRight", CFrame.new(10, 4, 2), Vector3.new(1, 8, 1), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))
P("ScannerTop", CFrame.new(10, 8.25, 0), Vector3.new(1, 0.5, 5), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))

-- Scanner indicator light
local indicator = P("ScannerLight", CFrame.new(10, 8.5, 0), Vector3.new(0.5, 0.2, 0.5), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
local scanGlow = Instance.new("PointLight")
scanGlow.Range = 6
scanGlow.Brightness = 1
scanGlow.Color = Color3.fromRGB(50, 255, 50)
scanGlow.Parent = indicator

-- Road markings (lane stripes)
P("LaneStripe1", CFrame.new(5, 0.05, -3), Vector3.new(16, 0.1, 0.3), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("LaneStripe2", CFrame.new(5, 0.05, 3), Vector3.new(16, 0.1, 0.3), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
`
  },

  {
    title: 'Server Rack Room — rows of server towers with blinking lights',
    tags: ['server', 'rack', 'data', 'center', 'tech', 'sci-fi', 'computer'],
    description: 'Two rows of server rack towers with blinking status lights and cable trays on top. 12 parts.',
    code: `-- SERVER RACK ROOM (12 parts)
local folder = getFolder("ServerRackRoom")

-- Floor
P("RaisedFloor", CFrame.new(0, 0.25, 0), Vector3.new(18, 0.5, 12), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))

-- Server racks — Row 1 (left)
P("Rack1A", CFrame.new(-4, 5, -3), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Rack1B", CFrame.new(-4, 5, 0), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Rack1C", CFrame.new(-4, 5, 3), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))

-- Server racks — Row 2 (right)
P("Rack2A", CFrame.new(4, 5, -3), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Rack2B", CFrame.new(4, 5, 0), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Rack2C", CFrame.new(4, 5, 3), Vector3.new(3, 9, 2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))

-- Status LED strips on racks (neon accents)
local led1 = P("LED_Row1", CFrame.new(-2.45, 5, 0), Vector3.new(0.1, 7, 8), Enum.Material.Neon, Color3.fromRGB(30, 200, 80))
local ledGlow1 = Instance.new("PointLight"); ledGlow1.Range = 6; ledGlow1.Brightness = 0.5; ledGlow1.Color = Color3.fromRGB(30, 200, 80); ledGlow1.Parent = led1
local led2 = P("LED_Row2", CFrame.new(2.45, 5, 0), Vector3.new(0.1, 7, 8), Enum.Material.Neon, Color3.fromRGB(30, 200, 80))
local ledGlow2 = Instance.new("PointLight"); ledGlow2.Range = 6; ledGlow2.Brightness = 0.5; ledGlow2.Color = Color3.fromRGB(30, 200, 80); ledGlow2.Parent = led2

-- Cable trays overhead
P("CableTray1", CFrame.new(-4, 9.75, 0), Vector3.new(3.5, 0.3, 10), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("CableTray2", CFrame.new(4, 9.75, 0), Vector3.new(3.5, 0.3, 10), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
`
  },

  {
    title: 'Vending / Gacha Machine — colorful machine with glass window',
    tags: ['vending', 'gacha', 'machine', 'modern', 'arcade', 'prize', 'capsule'],
    description: 'A colorful vending/gacha machine with a glass display window showing prizes, coin slot, and dispensing chute. 10 parts.',
    code: `-- VENDING / GACHA MACHINE (10 parts)
local folder = getFolder("GachaMachine")

-- Main body
P("MachineBody", CFrame.new(0, 4, 0), Vector3.new(5, 8, 4), Enum.Material.Metal, Color3.fromRGB(200, 50, 60))

-- Top dome area
P("TopDome", CFrame.new(0, 8.5, 0), Vector3.new(5.2, 1, 4.2), Enum.Material.Metal, Color3.fromRGB(220, 60, 70))

-- Glass display window
P("GlassWindow", CFrame.new(0, 5, 2.05), Vector3.new(3.5, 4, 0.1), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))

-- Interior display (colorful prizes visible through glass)
P("PrizeDisplay", CFrame.new(0, 5, 1.5), Vector3.new(3, 3.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 200, 50))

-- Header sign
local sign = P("HeaderSign", CFrame.new(0, 8.75, 2.05), Vector3.new(4, 1.2, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 255, 100))
local signGlow = Instance.new("PointLight")
signGlow.Range = 10
signGlow.Brightness = 1
signGlow.Color = Color3.fromRGB(255, 255, 100)
signGlow.Parent = sign

-- Coin slot
P("CoinSlot", CFrame.new(1.5, 3, 2.05), Vector3.new(0.8, 0.3, 0.1), Enum.Material.Metal, Color3.fromRGB(180, 180, 50))

-- Crank / button
P("CrankButton", CFrame.new(1.5, 2, 2.2), Vector3.new(0.8, 0.8, 0.4), Enum.Material.Metal, Color3.fromRGB(255, 80, 80))

-- Dispensing chute
P("Chute", CFrame.new(0, 0.75, 2.2), Vector3.new(2.5, 1.5, 0.5), Enum.Material.Metal, Color3.fromRGB(170, 40, 50))

-- Base
P("MachineBase", CFrame.new(0, 0.25, 0), Vector3.new(5.5, 0.5, 4.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
`
  },

  {
    title: 'Neon Sign — glowing sign frame with letter placeholders',
    tags: ['neon', 'sign', 'glow', 'modern', 'retro', 'text', 'light'],
    description: 'A wall-mounted neon sign frame with glowing neon letter placeholder bars and mounting brackets. 10 parts.',
    code: `-- NEON SIGN (10 parts)
local folder = getFolder("NeonSign")

-- Back panel
P("BackPanel", CFrame.new(0, 8, 0), Vector3.new(14, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(25, 25, 30))

-- Frame border
P("FrameTop", CFrame.new(0, 11.15, 0), Vector3.new(14.5, 0.3, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("FrameBottom", CFrame.new(0, 4.85, 0), Vector3.new(14.5, 0.3, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("FrameLeft", CFrame.new(-7.1, 8, 0), Vector3.new(0.3, 6, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("FrameRight", CFrame.new(7.1, 8, 0), Vector3.new(0.3, 6, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))

-- Neon letter bars (simulate "OPEN" or similar text)
local n1 = P("NeonBar1", CFrame.new(-4.5, 8, 0.35), Vector3.new(2, 3, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 50, 100))
local g1 = Instance.new("PointLight"); g1.Range = 10; g1.Brightness = 1.5; g1.Color = Color3.fromRGB(255, 50, 100); g1.Parent = n1
local n2 = P("NeonBar2", CFrame.new(-1.5, 8, 0.35), Vector3.new(2, 3, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 50, 100))
local n3 = P("NeonBar3", CFrame.new(1.5, 8, 0.35), Vector3.new(2, 3, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 50, 100))
local n4 = P("NeonBar4", CFrame.new(4.5, 8, 0.35), Vector3.new(2, 3, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 50, 100))

-- Mounting brackets
P("BracketL", CFrame.new(-6, 11.5, -0.5), Vector3.new(0.3, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
`
  },

  // ═══════════════════════════════════════════════════════════════════
  // SEASONAL / EVENT (10)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Christmas Tree — decorated tree with star, ornaments, presents',
    tags: ['christmas', 'tree', 'holiday', 'xmas', 'presents', 'star', 'ornament', 'seasonal'],
    description: 'A Christmas tree with layered foliage tiers, star on top, ornament accents, and presents underneath. 14 parts.',
    code: `-- CHRISTMAS TREE (14 parts)
local folder = getFolder("ChristmasTree")

-- Tree trunk
P("Trunk", CFrame.new(0, 1.5, 0), Vector3.new(1.5, 3, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 30))

-- Tree tiers (bottom to top, progressively smaller)
P("Tier1", CFrame.new(0, 4.5, 0), Vector3.new(10, 3, 10), Enum.Material.LeafyGrass, Color3.fromRGB(30, 90, 25))
P("Tier2", CFrame.new(0, 7, 0), Vector3.new(7.5, 3, 7.5), Enum.Material.LeafyGrass, Color3.fromRGB(35, 100, 30))
P("Tier3", CFrame.new(0, 9.5, 0), Vector3.new(5, 3, 5), Enum.Material.LeafyGrass, Color3.fromRGB(40, 110, 35))
P("Tier4", CFrame.new(0, 11.5, 0), Vector3.new(3, 2, 3), Enum.Material.LeafyGrass, Color3.fromRGB(45, 115, 38))

-- Star on top
local star = P("Star", CFrame.new(0, 13, 0), Vector3.new(1.5, 1.5, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 230, 50))
local starGlow = Instance.new("PointLight")
starGlow.Range = 14
starGlow.Brightness = 2
starGlow.Color = Color3.fromRGB(255, 230, 50)
starGlow.Parent = star

-- Ornaments (small colored spheres on tree)
P("Ornament1", CFrame.new(4, 4.5, 2), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 40, 40))
P("Ornament2", CFrame.new(-3, 5, -3), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Neon, Color3.fromRGB(50, 50, 255))
P("Ornament3", CFrame.new(2, 7.5, 3), Vector3.new(0.7, 0.7, 0.7), Enum.Material.Neon, Color3.fromRGB(255, 200, 50))
P("Ornament4", CFrame.new(-1, 9, -2), Vector3.new(0.7, 0.7, 0.7), Enum.Material.Neon, Color3.fromRGB(50, 220, 50))

-- Presents underneath
P("Present1", CFrame.new(3, 0.75, 2), Vector3.new(2, 1.5, 2), Enum.Material.Concrete, Color3.fromRGB(200, 40, 40))
P("Present2", CFrame.new(-2, 0.5, 3), Vector3.new(1.5, 1, 1.5), Enum.Material.Concrete, Color3.fromRGB(40, 40, 200))
P("PresentBow", CFrame.new(3, 1.6, 2), Vector3.new(2.2, 0.2, 0.4), Enum.Material.Fabric, Color3.fromRGB(255, 215, 0))
`
  },

  {
    title: 'Snowman — stacked snowballs with hat, scarf, carrot nose, stick arms',
    tags: ['snowman', 'snow', 'winter', 'holiday', 'seasonal', 'frozen'],
    description: 'A classic three-ball snowman with top hat, scarf, carrot nose, coal eyes, and stick arms. 11 parts.',
    code: `-- SNOWMAN (11 parts)
local folder = getFolder("Snowman")

-- Three stacked snowballs (bottom to top)
P("BottomBall", CFrame.new(0, 2.5, 0), Vector3.new(5, 5, 5), Enum.Material.Concrete, Color3.fromRGB(240, 245, 250))
P("MiddleBall", CFrame.new(0, 6.5, 0), Vector3.new(3.5, 3.5, 3.5), Enum.Material.Concrete, Color3.fromRGB(240, 245, 250))
P("HeadBall", CFrame.new(0, 9.5, 0), Vector3.new(2.5, 2.5, 2.5), Enum.Material.Concrete, Color3.fromRGB(240, 245, 250))

-- Top hat
P("HatBrim", CFrame.new(0, 10.85, 0), Vector3.new(2.8, 0.2, 2.8), Enum.Material.Concrete, Color3.fromRGB(25, 25, 25))
P("HatTop", CFrame.new(0, 11.85, 0), Vector3.new(2, 2, 2), Enum.Material.Concrete, Color3.fromRGB(25, 25, 25))

-- Carrot nose
P("Nose", CFrame.new(0, 9.5, 1.4), Vector3.new(0.3, 0.3, 1.2), Enum.Material.Concrete, Color3.fromRGB(230, 130, 30))

-- Coal eyes
P("EyeL", CFrame.new(-0.4, 10, 1.2), Vector3.new(0.3, 0.3, 0.2), Enum.Material.Concrete, Color3.fromRGB(20, 20, 20))
P("EyeR", CFrame.new(0.4, 10, 1.2), Vector3.new(0.3, 0.3, 0.2), Enum.Material.Concrete, Color3.fromRGB(20, 20, 20))

-- Scarf
P("Scarf", CFrame.new(0, 8, 0), Vector3.new(3.8, 0.5, 3.8), Enum.Material.Fabric, Color3.fromRGB(200, 30, 30))

-- Stick arms
P("ArmL", CFrame.new(-2.5, 6.5, 0) * CFrame.Angles(0, 0, math.rad(30)), Vector3.new(3, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(80, 50, 25))
P("ArmR", CFrame.new(2.5, 6.5, 0) * CFrame.Angles(0, 0, math.rad(-30)), Vector3.new(3, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(80, 50, 25))
`
  },

  {
    title: 'Jack-o-Lantern — carved pumpkin with candle glow inside',
    tags: ['pumpkin', 'halloween', 'jack-o-lantern', 'spooky', 'seasonal', 'candle'],
    description: 'A carved pumpkin with triangle eyes, jagged mouth, stem, and warm candle glow inside. 9 parts.',
    code: `-- JACK-O-LANTERN (9 parts)
local folder = getFolder("JackOLantern")

-- Pumpkin body
P("PumpkinBody", CFrame.new(0, 3, 0), Vector3.new(6, 5, 6), Enum.Material.Concrete, Color3.fromRGB(220, 120, 20))

-- Pumpkin ridges (vertical strips on sides to give shape)
P("Ridge1", CFrame.new(3.05, 3, 0), Vector3.new(0.2, 4.5, 1.5), Enum.Material.Concrete, Color3.fromRGB(200, 110, 15))
P("Ridge2", CFrame.new(-3.05, 3, 0), Vector3.new(0.2, 4.5, 1.5), Enum.Material.Concrete, Color3.fromRGB(200, 110, 15))

-- Stem
P("Stem", CFrame.new(0, 5.75, 0), Vector3.new(0.8, 1, 0.8), Enum.Material.Wood, Color3.fromRGB(70, 90, 30))

-- Carved face — eyes (dark triangles = small dark blocks)
P("EyeL", CFrame.new(-1.2, 3.8, 3.05), Vector3.new(1, 1, 0.2), Enum.Material.Concrete, Color3.fromRGB(30, 20, 5))
P("EyeR", CFrame.new(1.2, 3.8, 3.05), Vector3.new(1, 1, 0.2), Enum.Material.Concrete, Color3.fromRGB(30, 20, 5))

-- Mouth (jagged grin)
P("Mouth", CFrame.new(0, 2.2, 3.05), Vector3.new(3, 1, 0.2), Enum.Material.Concrete, Color3.fromRGB(30, 20, 5))

-- Interior candle glow
local glowPart = P("CandleGlow", CFrame.new(0, 2, 0), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(255, 180, 40))
local glow = Instance.new("PointLight")
glow.Range = 14
glow.Brightness = 2
glow.Color = Color3.fromRGB(255, 160, 30)
glow.Parent = glowPart
`
  },

  {
    title: 'Haunted House Facade — creepy front with broken windows and crooked door',
    tags: ['haunted', 'house', 'halloween', 'spooky', 'facade', 'horror', 'seasonal'],
    description: 'A creepy house front facade with crooked door, broken windows, patchy roof, and cobweb accents. 13 parts.',
    code: `-- HAUNTED HOUSE FACADE (13 parts)
local folder = getFolder("HauntedFacade")

-- Main wall
P("FacadeWall", CFrame.new(0, 6, 0), Vector3.new(18, 12, 1), Enum.Material.Wood, Color3.fromRGB(60, 45, 35))

-- Roof (pitched, uneven)
P("RoofLeft", CFrame.new(-3, 13, 0) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(10, 0.5, 2), Enum.Material.Wood, Color3.fromRGB(40, 30, 25))
P("RoofRight", CFrame.new(3, 13, 0) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(10, 0.5, 2), Enum.Material.Wood, Color3.fromRGB(38, 28, 22))

-- Crooked door
P("Door", CFrame.new(-1, 3.5, 0.55) * CFrame.Angles(0, 0, math.rad(5)), Vector3.new(3, 5, 0.2), Enum.Material.Wood, Color3.fromRGB(35, 25, 18))
P("DoorKnob", CFrame.new(0, 3.5, 0.75), Vector3.new(0.4, 0.4, 0.2), Enum.Material.Metal, Color3.fromRGB(140, 100, 50))

-- Windows (broken = partially dark, partially glass)
P("WindowL_Frame", CFrame.new(-5, 8, 0.55), Vector3.new(3, 3, 0.2), Enum.Material.Wood, Color3.fromRGB(50, 38, 28))
P("WindowL_Glass", CFrame.new(-5, 8.5, 0.6), Vector3.new(2, 1.5, 0.1), Enum.Material.Glass, Color3.fromRGB(100, 120, 140))
P("WindowR_Frame", CFrame.new(5, 8.5, 0.55), Vector3.new(3, 3, 0.2), Enum.Material.Wood, Color3.fromRGB(50, 38, 28))
P("WindowR_Dark", CFrame.new(5, 8.5, 0.6), Vector3.new(2, 2, 0.1), Enum.Material.Concrete, Color3.fromRGB(15, 12, 10))

-- Cobweb accent (thin triangular-ish shape in corner)
P("Cobweb", CFrame.new(-8, 11, 0.55), Vector3.new(2, 2, 0.05), Enum.Material.Fabric, Color3.fromRGB(200, 200, 195))

-- Chimney (leaning)
P("Chimney", CFrame.new(6, 14, 0) * CFrame.Angles(0, 0, math.rad(-8)), Vector3.new(2, 4, 1.5), Enum.Material.Brick, Color3.fromRGB(100, 55, 40))

-- Eerie interior glow
local eerieLight = P("EerieGlow", CFrame.new(-5, 8, -0.5), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
local eGlow = Instance.new("PointLight")
eGlow.Range = 10
eGlow.Brightness = 0.8
eGlow.Color = Color3.fromRGB(100, 255, 100)
eGlow.Parent = eerieLight
`
  },

  {
    title: 'Easter Egg Hunt Area — hidden eggs, basket, bunny statue',
    tags: ['easter', 'egg', 'hunt', 'spring', 'bunny', 'seasonal', 'basket'],
    description: 'An easter egg hunt area with colorful eggs placed in grass patches, a wicker basket, and a bunny statue. 12 parts.',
    code: `-- EASTER EGG HUNT AREA (12 parts)
local folder = getFolder("EasterEggHunt")

-- Grass patches
P("GrassPatch1", CFrame.new(0, 0.15, 0), Vector3.new(20, 0.3, 16), Enum.Material.Grass, Color3.fromRGB(80, 140, 55))
P("GrassTuft1", CFrame.new(-5, 0.5, 3), Vector3.new(2, 1, 2), Enum.Material.LeafyGrass, Color3.fromRGB(60, 130, 45))
P("GrassTuft2", CFrame.new(6, 0.5, -4), Vector3.new(2.5, 1, 2), Enum.Material.LeafyGrass, Color3.fromRGB(65, 135, 50))

-- Colorful eggs (various positions, "hidden" in grass)
P("EggRed", CFrame.new(-4, 0.5, 2), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Concrete, Color3.fromRGB(220, 50, 50))
P("EggBlue", CFrame.new(7, 0.5, -3), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Concrete, Color3.fromRGB(50, 100, 220))
P("EggYellow", CFrame.new(2, 0.5, 5), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Concrete, Color3.fromRGB(240, 220, 50))
P("EggPurple", CFrame.new(-7, 0.5, -5), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Concrete, Color3.fromRGB(160, 50, 200))
P("EggGreen", CFrame.new(0, 0.5, -6), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Concrete, Color3.fromRGB(50, 200, 80))

-- Wicker basket
P("Basket", CFrame.new(0, 1, 0), Vector3.new(3, 2, 3), Enum.Material.Wood, Color3.fromRGB(180, 140, 80))
P("BasketHandle", CFrame.new(0, 2.75, 0), Vector3.new(0.3, 1.5, 3), Enum.Material.Wood, Color3.fromRGB(170, 130, 75))

-- Bunny statue
P("BunnyBody", CFrame.new(8, 2, 0), Vector3.new(2, 3, 1.5), Enum.Material.Concrete, Color3.fromRGB(240, 235, 230))
`
  },

  {
    title: 'Fireworks Launch Pad — tubes, fuse, control box, safety barrier',
    tags: ['fireworks', 'launch', 'celebration', 'event', 'seasonal', 'new year', 'july'],
    description: 'A fireworks launch station with angled mortar tubes, fuse wires, a control box, and safety barriers. 11 parts.',
    code: `-- FIREWORKS LAUNCH PAD (11 parts)
local folder = getFolder("FireworksLaunchPad")

-- Ground platform
P("LaunchPlatform", CFrame.new(0, 0.25, 0), Vector3.new(10, 0.5, 8), Enum.Material.Concrete, Color3.fromRGB(150, 150, 150))

-- Mortar tubes (3, slightly angled outward)
P("Tube1", CFrame.new(-2.5, 2.5, 0) * CFrame.Angles(0, 0, math.rad(5)), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Tube2", CFrame.new(0, 2.5, 0), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Tube3", CFrame.new(2.5, 2.5, 0) * CFrame.Angles(0, 0, math.rad(-5)), Vector3.new(1.5, 4, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))

-- Fuse wire connecting tubes
P("FuseWire", CFrame.new(0, 0.6, 1.5), Vector3.new(7, 0.1, 0.1), Enum.Material.Fabric, Color3.fromRGB(200, 160, 50))

-- Control box
P("ControlBox", CFrame.new(0, 1, 5), Vector3.new(2, 2, 1.5), Enum.Material.Metal, Color3.fromRGB(40, 80, 40))
P("ControlButton", CFrame.new(0, 2.1, 5.5), Vector3.new(0.6, 0.3, 0.2), Enum.Material.Neon, Color3.fromRGB(255, 30, 30))

-- Safety barriers (orange/white striped approximation)
P("Barrier1", CFrame.new(-6, 1.5, 0), Vector3.new(0.5, 3, 0.5), Enum.Material.Concrete, Color3.fromRGB(255, 140, 0))
P("Barrier2", CFrame.new(6, 1.5, 0), Vector3.new(0.5, 3, 0.5), Enum.Material.Concrete, Color3.fromRGB(255, 140, 0))
P("BarrierRope", CFrame.new(0, 2.5, 0), Vector3.new(12, 0.15, 0.15), Enum.Material.Fabric, Color3.fromRGB(255, 200, 50))
`
  },

  {
    title: 'Birthday Party Setup — table with cake, presents, balloons, banner',
    tags: ['birthday', 'party', 'cake', 'presents', 'balloons', 'celebration', 'seasonal'],
    description: 'A birthday party table with a tiered cake, wrapped presents, balloon columns, and a hanging banner. 14 parts.',
    code: `-- BIRTHDAY PARTY SETUP (14 parts)
local folder = getFolder("BirthdayParty")

-- Table
P("TableTop", CFrame.new(0, 3.1, 0), Vector3.new(10, 0.3, 5), Enum.Material.Wood, Color3.fromRGB(180, 120, 70))
P("TableLeg1", CFrame.new(-4, 1.5, -2), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(160, 100, 55))
P("TableLeg2", CFrame.new(4, 1.5, -2), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(160, 100, 55))
P("TableLeg3", CFrame.new(-4, 1.5, 2), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(160, 100, 55))
P("TableLeg4", CFrame.new(4, 1.5, 2), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(160, 100, 55))

-- Cake (two tiers)
P("CakeBase", CFrame.new(0, 3.8, 0), Vector3.new(2.5, 1, 2.5), Enum.Material.Concrete, Color3.fromRGB(255, 220, 200))
P("CakeTop", CFrame.new(0, 4.6, 0), Vector3.new(1.8, 0.6, 1.8), Enum.Material.Concrete, Color3.fromRGB(255, 180, 200))

-- Candle on cake
local candle = P("Candle", CFrame.new(0, 5.2, 0), Vector3.new(0.15, 0.8, 0.15), Enum.Material.Neon, Color3.fromRGB(255, 200, 50))
local flame = Instance.new("PointLight")
flame.Range = 6
flame.Brightness = 1
flame.Color = Color3.fromRGB(255, 200, 50)
flame.Parent = candle

-- Presents on table
P("Present1", CFrame.new(3, 3.75, 0), Vector3.new(1.5, 1, 1.5), Enum.Material.Concrete, Color3.fromRGB(50, 150, 220))
P("Present2", CFrame.new(-3, 3.6, 1), Vector3.new(1, 0.8, 1), Enum.Material.Concrete, Color3.fromRGB(220, 50, 150))

-- Balloon columns (tall pillars with neon top = balloon)
P("BalloonStickL", CFrame.new(-7, 4, 0), Vector3.new(0.1, 8, 0.1), Enum.Material.Fabric, Color3.fromRGB(200, 200, 200))
P("BalloonL", CFrame.new(-7, 8.5, 0), Vector3.new(1.5, 2, 1.5), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("BalloonStickR", CFrame.new(7, 4, 0), Vector3.new(0.1, 8, 0.1), Enum.Material.Fabric, Color3.fromRGB(200, 200, 200))
P("BalloonR", CFrame.new(7, 8.5, 0), Vector3.new(1.5, 2, 1.5), Enum.Material.Concrete, Color3.fromRGB(50, 150, 255))
`
  },

  {
    title: 'Campfire Story Circle — log seats, central fire, marshmallow sticks',
    tags: ['campfire', 'fire', 'camping', 'outdoor', 'log', 'marshmallow', 'seasonal'],
    description: 'A campfire circle with log bench seats, central fire pit with warm glow, and marshmallow roasting sticks. 12 parts.',
    code: `-- CAMPFIRE STORY CIRCLE (12 parts)
local folder = getFolder("CampfireCircle")

-- Fire pit ring (stone circle)
P("PitRing", CFrame.new(0, 0.4, 0), Vector3.new(4, 0.8, 4), Enum.Material.Rock, Color3.fromRGB(110, 105, 100))
P("PitInner", CFrame.new(0, 0.3, 0), Vector3.new(2.5, 0.6, 2.5), Enum.Material.Ground, Color3.fromRGB(40, 35, 30))

-- Fire logs
P("FireLog1", CFrame.new(-0.3, 0.7, 0) * CFrame.Angles(0, math.rad(30), 0), Vector3.new(2, 0.4, 0.4), Enum.Material.Wood, Color3.fromRGB(70, 40, 18))
P("FireLog2", CFrame.new(0.3, 0.7, 0) * CFrame.Angles(0, math.rad(-30), 0), Vector3.new(2, 0.4, 0.4), Enum.Material.Wood, Color3.fromRGB(65, 35, 15))

-- Fire glow (neon block)
local firePart = P("FireGlow", CFrame.new(0, 1.2, 0), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 130, 20))
local fireLight = Instance.new("PointLight")
fireLight.Range = 24
fireLight.Brightness = 2.5
fireLight.Color = Color3.fromRGB(255, 150, 40)
fireLight.Parent = firePart

-- Log seats around the fire (4 logs)
P("LogSeat1", CFrame.new(0, 0.6, 5) * CFrame.Angles(0, math.rad(10), 0), Vector3.new(4, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(90, 55, 30))
P("LogSeat2", CFrame.new(0, 0.6, -5) * CFrame.Angles(0, math.rad(-5), 0), Vector3.new(4, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(85, 52, 28))
P("LogSeat3", CFrame.new(5, 0.6, 0) * CFrame.Angles(0, math.rad(90), 0), Vector3.new(4, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(88, 53, 29))
P("LogSeat4", CFrame.new(-5, 0.6, 0) * CFrame.Angles(0, math.rad(85), 0), Vector3.new(4, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(82, 50, 26))

-- Marshmallow sticks (2, leaning toward fire)
P("MarshmallowStick1", CFrame.new(2.5, 1.5, 4) * CFrame.Angles(math.rad(-40), math.rad(20), 0), Vector3.new(0.15, 4, 0.15), Enum.Material.Wood, Color3.fromRGB(100, 70, 35))
P("MarshmallowStick2", CFrame.new(-3, 1.5, -3.5) * CFrame.Angles(math.rad(35), math.rad(-15), 0), Vector3.new(0.15, 4, 0.15), Enum.Material.Wood, Color3.fromRGB(100, 70, 35))
`
  },

  {
    title: 'Trophy Podium — 1st/2nd/3rd podium with trophy and confetti',
    tags: ['trophy', 'podium', 'winner', 'competition', 'award', 'event', 'seasonal'],
    description: 'A three-tier winners podium (1st tallest center, 2nd left, 3rd right) with a gold trophy on top and confetti accents. 10 parts.',
    code: `-- TROPHY PODIUM (10 parts)
local folder = getFolder("TrophyPodium")

-- Base platform
P("BasePlatform", CFrame.new(0, 0.25, 0), Vector3.new(14, 0.5, 6), Enum.Material.Concrete, Color3.fromRGB(180, 180, 185))

-- 1st place podium (center, tallest)
P("Podium1st", CFrame.new(0, 3, 0), Vector3.new(4, 5, 4), Enum.Material.Concrete, Color3.fromRGB(255, 215, 0))

-- 2nd place podium (left, medium)
P("Podium2nd", CFrame.new(-4.5, 2, 0), Vector3.new(4, 3, 4), Enum.Material.Concrete, Color3.fromRGB(192, 192, 200))

-- 3rd place podium (right, shortest)
P("Podium3rd", CFrame.new(4.5, 1.5, 0), Vector3.new(4, 2, 4), Enum.Material.Concrete, Color3.fromRGB(180, 120, 60))

-- Number labels (flat neon on front face)
P("Label1", CFrame.new(0, 3, 2.05), Vector3.new(1.5, 2, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 255, 200))
P("Label2", CFrame.new(-4.5, 2, 2.05), Vector3.new(1.5, 1.5, 0.1), Enum.Material.Neon, Color3.fromRGB(220, 220, 230))
P("Label3", CFrame.new(4.5, 1.5, 2.05), Vector3.new(1.5, 1.2, 0.1), Enum.Material.Neon, Color3.fromRGB(200, 150, 80))

-- Gold trophy on 1st place
P("TrophyBase", CFrame.new(0, 5.75, 0), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 40))
local trophy = P("TrophyCup", CFrame.new(0, 6.75, 0), Vector3.new(1.2, 1.5, 1.2), Enum.Material.Metal, Color3.fromRGB(255, 215, 0))
local trophyGlow = Instance.new("PointLight")
trophyGlow.Range = 10
trophyGlow.Brightness = 1
trophyGlow.Color = Color3.fromRGB(255, 230, 100)
trophyGlow.Parent = trophy
`
  },

  {
    title: 'Flag Display — 3 flag poles with colored flags on stone base',
    tags: ['flag', 'pole', 'display', 'ceremony', 'event', 'patriotic', 'seasonal'],
    description: 'Three flag poles of varying height on a stone base, each flying a differently colored flag. 10 parts.',
    code: `-- FLAG DISPLAY (10 parts)
local folder = getFolder("FlagDisplay")

-- Stone base
P("StoneBase", CFrame.new(0, 0.5, 0), Vector3.new(14, 1, 4), Enum.Material.Granite, Color3.fromRGB(140, 135, 130))

-- Center pole (tallest)
P("PoleCenter", CFrame.new(0, 8, 0), Vector3.new(0.4, 15, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("PoleCapCenter", CFrame.new(0, 15.75, 0), Vector3.new(0.8, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(220, 200, 50))

-- Left pole (medium)
P("PoleLeft", CFrame.new(-5, 6.5, 0), Vector3.new(0.4, 12, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("PoleCapLeft", CFrame.new(-5, 12.75, 0), Vector3.new(0.8, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(220, 200, 50))

-- Right pole (shorter)
P("PoleRight", CFrame.new(5, 5.5, 0), Vector3.new(0.4, 10, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("PoleCapRight", CFrame.new(5, 10.75, 0), Vector3.new(0.8, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(220, 200, 50))

-- Flags (hanging from top of each pole)
P("FlagCenter", CFrame.new(1.5, 14, 0), Vector3.new(3, 2, 0.1), Enum.Material.Fabric, Color3.fromRGB(30, 60, 180))
P("FlagLeft", CFrame.new(-3.5, 11.5, 0), Vector3.new(3, 2, 0.1), Enum.Material.Fabric, Color3.fromRGB(200, 40, 40))
P("FlagRight", CFrame.new(6.5, 9.5, 0), Vector3.new(3, 2, 0.1), Enum.Material.Fabric, Color3.fromRGB(50, 160, 50))
`
  },

]
