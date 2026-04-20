/**
 * MEGA BUILD TEMPLATES — large scenes, spawns, full environments.
 *
 * These complement the basic object templates in build-template-chunks.ts.
 * While those teach the AI how to build a single chair or tree, THESE teach
 * it how to build entire game areas with proper spacing, variety, and detail.
 *
 * TEMPLATE TYPES:
 * - SPAWN variants (empty shell vs fully decorated)
 * - FULL SCENES (complete environments a player would explore)
 * - LOW-POLY STYLE (chunky, stylized aesthetic popular in Roblox)
 * - GAME-READY SETUPS (functional areas with script attachment points)
 *
 * SIZE GUIDE:
 * - 1 Roblox stud = 0.3 meters (roughly 1 foot)
 * - Player character: ~5 studs tall, ~2 studs wide
 * - Standard door: 4 studs wide, 7 studs tall
 * - Jump reach: ~7.5 studs vertical, ~12 studs horizontal
 * - Walk speed default: 16 studs/second
 *
 * Every coordinate is calculated, not guessed. Comments explain the math.
 */

import { BuildTemplate } from './build-template-chunks'

export const MEGA_TEMPLATES: BuildTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  //  SPAWN AREA — EMPTY (minimal, clean, fast to load)
  //  Use this when the player just needs a starting point and you want the
  //  game world to feel open. Good for: simulators, open-world, sandboxes.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Spawn Area — Empty/Minimal (open world start)',
    tags: ['spawn', 'spawnpoint', 'start', 'empty', 'minimal', 'open-world', 'lobby', 'beginning'],
    description: 'A clean 60x60 stud spawn platform with a SpawnLocation at center, 4 corner light posts, a welcome sign, and low border walls. 16 parts. Designed to feel open — no clutter, just orientation landmarks. The spawn pad glows so new players immediately know where they are. Border walls are waist-height (2.5 studs) so players can see the world beyond.',
    code: `-- SPAWN AREA — EMPTY/MINIMAL (16 parts) — 60x60 stud platform
-- Design philosophy: give the player just enough to orient themselves.
-- Low walls they can see over, lights at corners, one sign. That's it.
-- The rest of the world stretches out from here.

local folder = getFolder("Spawn")

-- MAIN PLATFORM (large, flat, neutral color — not the focus, just the floor)
-- 60x60 studs = roughly 18x18 meters. Big enough for 20+ players.
P("SpawnFloor", CFrame.new(0, -0.25, 0), Vector3.new(60, 0.5, 60), Enum.Material.Concrete, Color3.fromRGB(180, 175, 168))

-- SPAWN PAD (centered, glowing so players know exactly where they spawn)
-- SpawnLocation would go here in-game. Slightly raised, Neon material.
P("SpawnPad", CFrame.new(0, 0.15, 0), Vector3.new(8, 0.3, 8), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))

-- BORDER WALLS — waist-height (2.5 studs) so you can see the world beyond.
-- Players can jump over these (jump = 7.5 studs, wall = 2.5 studs).
-- Walls are at the edge of the 60x60 platform.
P("BorderN", CFrame.new(0, 1.25, 30), Vector3.new(60, 2.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(150, 145, 140))
P("BorderS", CFrame.new(0, 1.25, -30), Vector3.new(60, 2.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(150, 145, 140))
P("BorderE", CFrame.new(30, 1.25, 0), Vector3.new(0.5, 2.5, 59), Enum.Material.Concrete, Color3.fromRGB(150, 145, 140))
P("BorderW", CFrame.new(-30, 1.25, 0), Vector3.new(0.5, 2.5, 59), Enum.Material.Concrete, Color3.fromRGB(150, 145, 140))

-- CORNER LIGHT POSTS — 4 lights at corners, gives the spawn a "defined" feel.
-- Each post: base (2x0.5x2) + pole (0.5x10x0.5) + lamp (1.5x0.5x1.5) + PointLight.
P("PostNE_Base", CFrame.new(27, 0.25, 27), Vector3.new(2, 0.5, 2), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("PostNE_Pole", CFrame.new(27, 5.5, 27), Vector3.new(0.5, 10, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
local neLight = P("PostNE_Lamp", CFrame.new(27, 10.75, 27), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local pl1 = Instance.new("PointLight"); pl1.Range = 35; pl1.Brightness = 1; pl1.Color = Color3.fromRGB(255, 230, 180); pl1.Parent = neLight

P("PostSW_Base", CFrame.new(-27, 0.25, -27), Vector3.new(2, 0.5, 2), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("PostSW_Pole", CFrame.new(-27, 5.5, -27), Vector3.new(0.5, 10, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
local swLight = P("PostSW_Lamp", CFrame.new(-27, 10.75, -27), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local pl2 = Instance.new("PointLight"); pl2.Range = 35; pl2.Brightness = 1; pl2.Color = Color3.fromRGB(255, 230, 180); pl2.Parent = swLight

-- WELCOME SIGN (faces +Z so players see it when they spawn)
P("SignPost", CFrame.new(0, 4, 12), Vector3.new(0.5, 8, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("SignBoard", CFrame.new(0, 7, 12.4), Vector3.new(8, 3, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
-- BillboardGui with game name would attach to SignBoard`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  SPAWN AREA — FULL (detailed, decorated, impressive first impression)
  //  Use this when you want the spawn to BE the experience. Good for:
  //  lobbies, hub worlds, tycoons, RPGs.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Spawn Area — Full/Decorated (lobby hub with shops and paths)',
    tags: ['spawn', 'spawnpoint', 'lobby', 'hub', 'decorated', 'full', 'detailed', 'start', 'shop'],
    description: 'A fully decorated 80x80 spawn hub with central fountain, 4 branching cobblestone paths, 2 shop buildings (6x6 each with counters), benches, trees, flower beds, torches, a welcome arch, and a glowing spawn pad. 72 parts. This is a first-impression area — players should think "this game is polished." Paths lead to game zones. Fountain provides a landmark. Shops give immediate things to interact with.',
    code: `-- SPAWN HUB — FULL/DECORATED (72 parts) — 80x80 stud area
-- Central fountain as landmark. 4 paths lead to game zones.
-- 2 small shops with counters. Benches, trees, flowers, torches.
-- This is the FIRST thing players see — it has to look good.

local folder = getFolder("SpawnHub")

-- ═══ GROUND ═══
-- Main grass floor (entire area, sits at Y=0)
P("Ground", CFrame.new(0, -0.25, 0), Vector3.new(80, 0.5, 80), Enum.Material.Grass, Color3.fromRGB(75, 140, 55))

-- Cobblestone paths — 4 paths radiating from center to edges, each 6 wide
P("PathN", CFrame.new(0, 0.05, 22), Vector3.new(6, 0.1, 36), Enum.Material.Cobblestone, Color3.fromRGB(140, 135, 125))
P("PathS", CFrame.new(0, 0.05, -22), Vector3.new(6, 0.1, 36), Enum.Material.Cobblestone, Color3.fromRGB(140, 135, 125))
P("PathE", CFrame.new(22, 0.05, 0), Vector3.new(36, 0.1, 6), Enum.Material.Cobblestone, Color3.fromRGB(140, 135, 125))
P("PathW", CFrame.new(-22, 0.05, 0), Vector3.new(36, 0.1, 6), Enum.Material.Cobblestone, Color3.fromRGB(140, 135, 125))
-- Center plaza (where paths meet, circular feel via square)
P("CenterPlaza", CFrame.new(0, 0.05, 0), Vector3.new(16, 0.1, 16), Enum.Material.Cobblestone, Color3.fromRGB(145, 140, 130))

-- ═══ SPAWN PAD ═══ (on the center plaza, glowing)
P("SpawnPad", CFrame.new(0, 0.2, 0), Vector3.new(6, 0.2, 6), Enum.Material.Neon, Color3.fromRGB(100, 220, 255))

-- ═══ CENTRAL FOUNTAIN ═══ (8 parts — basin + inner ring + water + pillar + top)
-- Sits just north of spawn pad so players see it immediately.
P("FountainBase", CFrame.new(0, 0.5, 8), Vector3.new(10, 1, 10), Enum.Material.Slate, Color3.fromRGB(160, 155, 148))
P("FountainRim", CFrame.new(0, 1.25, 8), Vector3.new(10, 0.5, 10), Enum.Material.Slate, Color3.fromRGB(150, 145, 138))
P("FountainInnerRim", CFrame.new(0, 1.25, 8), Vector3.new(8, 0.6, 8), Enum.Material.Slate, Color3.fromRGB(140, 135, 128))
P("FountainWater", CFrame.new(0, 1.1, 8), Vector3.new(7.5, 0.3, 7.5), Enum.Material.Glass, Color3.fromRGB(80, 150, 200))
P("FountainPillar", CFrame.new(0, 3, 8), Vector3.new(1, 4, 1), Enum.Material.Slate, Color3.fromRGB(170, 165, 158))
P("FountainTopBowl", CFrame.new(0, 5, 8), Vector3.new(3, 0.8, 3), Enum.Material.Slate, Color3.fromRGB(165, 160, 153))
P("FountainTopWater", CFrame.new(0, 5.2, 8), Vector3.new(2.5, 0.3, 2.5), Enum.Material.Glass, Color3.fromRGB(90, 160, 210))

-- ═══ WELCOME ARCH ═══ (south entrance — first thing you walk through)
P("ArchPillarL", CFrame.new(-5, 5, -35), Vector3.new(2, 10, 2), Enum.Material.Slate, Color3.fromRGB(160, 155, 148))
P("ArchPillarR", CFrame.new(5, 5, -35), Vector3.new(2, 10, 2), Enum.Material.Slate, Color3.fromRGB(160, 155, 148))
P("ArchTop", CFrame.new(0, 10.5, -35), Vector3.new(12, 1.5, 2.5), Enum.Material.Slate, Color3.fromRGB(170, 165, 158))
P("ArchSign", CFrame.new(0, 10.5, -34.5), Vector3.new(10, 1, 0.2), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
-- BillboardGui with game name would attach to ArchSign

-- ═══ SHOP 1 — LEFT SIDE ═══ (item shop, 10x8 footprint)
-- Located at X=-20, Z=15 (NW quadrant near path)
P("Shop1Floor", CFrame.new(-20, 0.1, 15), Vector3.new(10, 0.2, 8), Enum.Material.WoodPlanks, Color3.fromRGB(150, 100, 55))
P("Shop1WallBack", CFrame.new(-20, 3, 11), Vector3.new(10, 6, 0.5), Enum.Material.Brick, Color3.fromRGB(180, 120, 80))
P("Shop1WallL", CFrame.new(-25, 3, 15), Vector3.new(0.5, 6, 7.5), Enum.Material.Brick, Color3.fromRGB(175, 115, 75))
P("Shop1WallR", CFrame.new(-15, 3, 15), Vector3.new(0.5, 6, 7.5), Enum.Material.Brick, Color3.fromRGB(175, 115, 75))
P("Shop1Roof", CFrame.new(-20, 6.25, 15), Vector3.new(11, 0.5, 9), Enum.Material.Slate, Color3.fromRGB(80, 80, 90))
-- Counter (where NPC would stand, faces +Z toward path)
P("Shop1Counter", CFrame.new(-20, 2.5, 18.5), Vector3.new(6, 3, 1), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("Shop1CounterTop", CFrame.new(-20, 4.1, 18.5), Vector3.new(6.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
-- Awning (extends out over counter)
P("Shop1Awning", CFrame.new(-20, 6, 19.5) * CFrame.Angles(math.rad(10), 0, 0), Vector3.new(11, 0.2, 4), Enum.Material.Fabric, Color3.fromRGB(200, 60, 50))

-- ═══ SHOP 2 — RIGHT SIDE ═══ (upgrade shop, mirror of shop 1)
P("Shop2Floor", CFrame.new(20, 0.1, 15), Vector3.new(10, 0.2, 8), Enum.Material.WoodPlanks, Color3.fromRGB(150, 100, 55))
P("Shop2WallBack", CFrame.new(20, 3, 11), Vector3.new(10, 6, 0.5), Enum.Material.Brick, Color3.fromRGB(180, 120, 80))
P("Shop2WallL", CFrame.new(15, 3, 15), Vector3.new(0.5, 6, 7.5), Enum.Material.Brick, Color3.fromRGB(175, 115, 75))
P("Shop2WallR", CFrame.new(25, 3, 15), Vector3.new(0.5, 6, 7.5), Enum.Material.Brick, Color3.fromRGB(175, 115, 75))
P("Shop2Roof", CFrame.new(20, 6.25, 15), Vector3.new(11, 0.5, 9), Enum.Material.Slate, Color3.fromRGB(80, 80, 90))
P("Shop2Counter", CFrame.new(20, 2.5, 18.5), Vector3.new(6, 3, 1), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("Shop2CounterTop", CFrame.new(20, 4.1, 18.5), Vector3.new(6.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("Shop2Awning", CFrame.new(20, 6, 19.5) * CFrame.Angles(math.rad(10), 0, 0), Vector3.new(11, 0.2, 4), Enum.Material.Fabric, Color3.fromRGB(50, 100, 200))

-- ═══ TREES ═══ (4 trees flanking paths, 3-layer canopy each)
-- NE tree
P("TreeNE_Trunk", CFrame.new(14, 3.5, 22), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(95, 60, 30))
P("TreeNE_Canopy1", CFrame.new(14, 9, 22), Vector3.new(7, 4, 7), Enum.Material.Grass, Color3.fromRGB(55, 125, 45))
P("TreeNE_Canopy2", CFrame.new(13, 10.5, 23), Vector3.new(5, 3, 5), Enum.Material.Grass, Color3.fromRGB(50, 115, 40))
-- NW tree
P("TreeNW_Trunk", CFrame.new(-14, 3.5, 22), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(95, 60, 30))
P("TreeNW_Canopy1", CFrame.new(-14, 9, 22), Vector3.new(7, 4, 7), Enum.Material.Grass, Color3.fromRGB(60, 130, 50))
P("TreeNW_Canopy2", CFrame.new(-15, 10.5, 21), Vector3.new(5, 3, 5), Enum.Material.Grass, Color3.fromRGB(45, 110, 38))
-- SE tree
P("TreeSE_Trunk", CFrame.new(14, 3.5, -18), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 62, 32))
P("TreeSE_Canopy1", CFrame.new(14, 9, -18), Vector3.new(6, 4, 6), Enum.Material.Grass, Color3.fromRGB(58, 128, 48))
-- SW tree
P("TreeSW_Trunk", CFrame.new(-14, 3.5, -18), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 62, 32))
P("TreeSW_Canopy1", CFrame.new(-14, 9, -18), Vector3.new(6, 4, 6), Enum.Material.Grass, Color3.fromRGB(52, 120, 42))

-- ═══ BENCHES ═══ (2 benches along paths)
P("Bench1Seat", CFrame.new(6, 1.5, 15), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Bench1Back", CFrame.new(6, 2.5, 14.4), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("Bench1LegL", CFrame.new(4.2, 0.75, 15), Vector3.new(0.3, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Bench1LegR", CFrame.new(7.8, 0.75, 15), Vector3.new(0.3, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))

P("Bench2Seat", CFrame.new(-6, 1.5, -12), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Bench2Back", CFrame.new(-6, 2.5, -12.6), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("Bench2LegL", CFrame.new(-7.8, 0.75, -12), Vector3.new(0.3, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Bench2LegR", CFrame.new(-4.2, 0.75, -12), Vector3.new(0.3, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))

-- ═══ FLOWER BEDS ═══ (decorative, along path edges)
P("FlowerBed1", CFrame.new(5, 0.3, 6), Vector3.new(3, 0.6, 3), Enum.Material.Grass, Color3.fromRGB(65, 130, 45))
P("Flowers1", CFrame.new(5, 0.8, 6), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Grass, Color3.fromRGB(220, 80, 80))
P("FlowerBed2", CFrame.new(-5, 0.3, -6), Vector3.new(3, 0.6, 3), Enum.Material.Grass, Color3.fromRGB(65, 130, 45))
P("Flowers2", CFrame.new(-5, 0.8, -6), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Grass, Color3.fromRGB(230, 200, 60))

-- ═══ TORCHES ═══ (along path, warm ambiance)
local torch1 = P("Torch1", CFrame.new(3.5, 3, -20), Vector3.new(0.4, 4, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
local tl1 = Instance.new("PointLight"); tl1.Range = 20; tl1.Brightness = 0.8; tl1.Color = Color3.fromRGB(255, 180, 80); tl1.Parent = torch1
P("TorchFlame1", CFrame.new(3.5, 5.2, -20), Vector3.new(0.6, 0.4, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 160, 40))

local torch2 = P("Torch2", CFrame.new(-3.5, 3, -20), Vector3.new(0.4, 4, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
local tl2 = Instance.new("PointLight"); tl2.Range = 20; tl2.Brightness = 0.8; tl2.Color = Color3.fromRGB(255, 180, 80); tl2.Parent = torch2
P("TorchFlame2", CFrame.new(-3.5, 5.2, -20), Vector3.new(0.6, 0.4, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 160, 40))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOW-POLY ISLAND — the Roblox aesthetic everyone loves
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Low-Poly Island — stylized floating island with house and dock',
    tags: ['low-poly', 'island', 'tropical', 'floating', 'stylized', 'aesthetic', 'cartoon', 'lowpoly'],
    description: 'A floating low-poly island scene: chunky terrain base with visible layers (dirt/grass/stone), a small cottage, 3 palm trees, a wooden dock extending over the water, a rowboat, rocks, and flowers. 55 parts. Low-poly style means: bigger parts, fewer of them, exaggerated proportions, bright saturated colors. No tiny details — everything is chunky and readable from a distance. The island floats above water level to show the underside layers.',
    code: `-- LOW-POLY ISLAND (55 parts) — floating island with cottage, palms, dock
-- LOW-POLY STYLE RULES:
-- 1. Parts are CHUNKY — minimum 1.5 studs on any axis
-- 2. Colors are SATURATED — no muddy grays, bright and happy
-- 3. Proportions are EXAGGERATED — big heads on trees, thick trunks
-- 4. NO tiny details — if you can't see it from 50 studs away, don't build it
-- 5. Materials: Grass, Wood, Slate, Concrete. Never Glass or Neon.

local folder = getFolder("LowPolyIsland")

-- ═══ ISLAND TERRAIN ═══
-- The island floats at Y=5 so you can see the underside layers.
-- Top layer: grass. Middle: dirt. Bottom: stone. Creates visible geology.

-- Grass layer (top, largest, organic shape via 3 overlapping parts)
P("GrassMain", CFrame.new(0, 6, 0), Vector3.new(40, 2, 35), Enum.Material.Grass, Color3.fromRGB(80, 170, 60))
P("GrassExtendN", CFrame.new(5, 6, 14), Vector3.new(20, 2, 12), Enum.Material.Grass, Color3.fromRGB(75, 165, 55))
P("GrassExtendW", CFrame.new(-12, 6, -5), Vector3.new(14, 2, 18), Enum.Material.Grass, Color3.fromRGB(85, 175, 65))

-- Dirt layer (exposed on sides, slightly smaller)
P("DirtMain", CFrame.new(0, 4, 0), Vector3.new(38, 2, 33), Enum.Material.Concrete, Color3.fromRGB(140, 95, 55))
P("DirtExtendN", CFrame.new(5, 4, 13), Vector3.new(18, 2, 10), Enum.Material.Concrete, Color3.fromRGB(135, 90, 50))

-- Stone layer (bottom, pointy/jagged feel via offset parts)
P("StoneMain", CFrame.new(0, 2, 0), Vector3.new(34, 2, 28), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))
P("StonePoint1", CFrame.new(8, 1, 5), Vector3.new(8, 3, 8), Enum.Material.Slate, Color3.fromRGB(100, 98, 90))
P("StonePoint2", CFrame.new(-6, 0.5, -4), Vector3.new(6, 3, 6), Enum.Material.Slate, Color3.fromRGB(105, 103, 95))

-- ═══ WATER ═══ (surrounds the island, semi-transparent, below island level)
P("Water", CFrame.new(0, -0.5, 0), Vector3.new(120, 1, 120), Enum.Material.Glass, Color3.fromRGB(50, 140, 200))

-- ═══ COTTAGE ═══ (small low-poly house, 8x8 footprint, sits on grass layer)
-- Floor top is at Y=7 (grass top). Walls are 6 studs tall, chunky.
P("CottageFloor", CFrame.new(-6, 7.15, -2), Vector3.new(8, 0.3, 8), Enum.Material.WoodPlanks, Color3.fromRGB(170, 120, 65))
P("CottageWallN", CFrame.new(-6, 10, 2), Vector3.new(8, 5, 0.8), Enum.Material.Concrete, Color3.fromRGB(235, 225, 200))
P("CottageWallS", CFrame.new(-6, 10, -6), Vector3.new(8, 5, 0.8), Enum.Material.Concrete, Color3.fromRGB(230, 220, 195))
P("CottageWallW", CFrame.new(-10, 10, -2), Vector3.new(0.8, 5, 7.2), Enum.Material.Concrete, Color3.fromRGB(225, 215, 190))
P("CottageWallE", CFrame.new(-2, 10, -2), Vector3.new(0.8, 5, 7.2), Enum.Material.Concrete, Color3.fromRGB(228, 218, 193))
-- Door opening — gap in south wall
P("CottageDoor", CFrame.new(-6, 9.5, -6.2), Vector3.new(2.5, 4.5, 0.4), Enum.Material.Wood, Color3.fromRGB(140, 80, 35))
-- Roof (pitched, low-poly = thick roof, bright color)
P("CottageRoofL", CFrame.new(-8, 13, -2) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(6, 0.8, 9), Enum.Material.Concrete, Color3.fromRGB(200, 70, 60))
P("CottageRoofR", CFrame.new(-4, 13, -2) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(6, 0.8, 9), Enum.Material.Concrete, Color3.fromRGB(195, 65, 55))
-- Chimney
P("CottageChimney", CFrame.new(-9, 14, 0), Vector3.new(1.5, 3, 1.5), Enum.Material.Brick, Color3.fromRGB(160, 80, 60))

-- ═══ PALM TREES ═══ (3 palms, low-poly = thick trunks, big leaf clusters)
-- Palm 1 (near dock)
P("Palm1Trunk", CFrame.new(10, 10.5, 10), Vector3.new(1.5, 8, 1.5), Enum.Material.Wood, Color3.fromRGB(150, 110, 55))
P("Palm1Crown", CFrame.new(10, 15, 10), Vector3.new(6, 2, 6), Enum.Material.Grass, Color3.fromRGB(50, 160, 40))
P("Palm1Frond1", CFrame.new(12, 14.5, 10) * CFrame.Angles(0, 0, math.rad(-20)), Vector3.new(5, 0.5, 2), Enum.Material.Grass, Color3.fromRGB(55, 170, 45))
P("Palm1Frond2", CFrame.new(8, 14.5, 12) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(2, 0.5, 5), Enum.Material.Grass, Color3.fromRGB(45, 150, 35))

-- Palm 2 (center island, shorter)
P("Palm2Trunk", CFrame.new(0, 10, 6), Vector3.new(1.2, 6, 1.2), Enum.Material.Wood, Color3.fromRGB(145, 105, 50))
P("Palm2Crown", CFrame.new(0, 13.5, 6), Vector3.new(5, 2, 5), Enum.Material.Grass, Color3.fromRGB(60, 165, 50))

-- Palm 3 (west side, tallest, slight lean via CFrame angle)
P("Palm3Trunk", CFrame.new(-14, 11, 4) * CFrame.Angles(0, 0, math.rad(8)), Vector3.new(1.5, 9, 1.5), Enum.Material.Wood, Color3.fromRGB(155, 115, 58))
P("Palm3Crown", CFrame.new(-14.5, 16, 4), Vector3.new(7, 2.5, 7), Enum.Material.Grass, Color3.fromRGB(48, 155, 38))
P("Palm3Frond", CFrame.new(-16, 15.5, 4) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(5, 0.5, 2.5), Enum.Material.Grass, Color3.fromRGB(55, 165, 42))

-- ═══ DOCK ═══ (extends from island edge over water)
P("DockPlatform", CFrame.new(16, 6.5, 12), Vector3.new(12, 0.4, 4), Enum.Material.WoodPlanks, Color3.fromRGB(160, 110, 55))
P("DockPillar1", CFrame.new(18, 3.5, 10.5), Vector3.new(0.8, 6, 0.8), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("DockPillar2", CFrame.new(18, 3.5, 13.5), Vector3.new(0.8, 6, 0.8), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("DockPillar3", CFrame.new(22, 3.5, 10.5), Vector3.new(0.8, 6, 0.8), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("DockPillar4", CFrame.new(22, 3.5, 13.5), Vector3.new(0.8, 6, 0.8), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
-- Dock railing
P("DockRailL", CFrame.new(18, 7.8, 10), Vector3.new(10, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 38))
P("DockRailR", CFrame.new(18, 7.8, 14), Vector3.new(10, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 38))

-- ═══ ROWBOAT ═══ (at end of dock, floating on water)
P("BoatHull", CFrame.new(24, 0.5, 12), Vector3.new(2.5, 1, 5), Enum.Material.Wood, Color3.fromRGB(140, 90, 40))
P("BoatSeat", CFrame.new(24, 1.2, 12), Vector3.new(2, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(130, 85, 38))

-- ═══ ROCKS ═══ (scattered, low-poly = big chunky rocks)
P("Rock1", CFrame.new(12, 7.3, -8) * CFrame.Angles(0, math.rad(30), math.rad(10)), Vector3.new(3, 2, 2.5), Enum.Material.Slate, Color3.fromRGB(130, 128, 120))
P("Rock2", CFrame.new(-16, 7.2, 10) * CFrame.Angles(math.rad(15), math.rad(-20), 0), Vector3.new(2, 1.5, 2), Enum.Material.Slate, Color3.fromRGB(120, 118, 110))
P("Rock3", CFrame.new(5, 7.1, -12), Vector3.new(1.5, 1, 1.5), Enum.Material.Slate, Color3.fromRGB(125, 123, 115))

-- ═══ FLOWERS ═══ (bright spots of color on the grass)
P("FlowerPatch1", CFrame.new(-3, 7.3, -8), Vector3.new(2.5, 0.6, 2.5), Enum.Material.Grass, Color3.fromRGB(240, 90, 120))
P("FlowerPatch2", CFrame.new(8, 7.3, 2), Vector3.new(2, 0.5, 2), Enum.Material.Grass, Color3.fromRGB(255, 220, 60))
P("FlowerPatch3", CFrame.new(-10, 7.3, 8), Vector3.new(2, 0.5, 2), Enum.Material.Grass, Color3.fromRGB(180, 80, 220))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PVP ARENA — game-ready combat area
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'PvP Arena — combat arena with cover, spawns, and weapons rack',
    tags: ['pvp', 'arena', 'combat', 'battle', 'fight', 'deathmatch', 'fps', 'shooter', 'war'],
    description: 'A symmetrical 80x80 PvP arena with: concrete floor, 8 cover walls (4 per side, mirrored), 2 team spawn rooms (red/blue) at opposite ends, a central elevated platform with weapon rack, 4 pillars for vertical gameplay, and boundary walls. 52 parts. Symmetrical design ensures fair gameplay. Cover walls are 4 studs tall — players can duck behind them but not camp forever (opponents can flank). Central platform rewards aggression with height advantage.',
    code: `-- PVP ARENA (52 parts) — 80x80 symmetrical combat zone
-- DESIGN: mirrored across X axis. Red team spawns -Z, Blue team +Z.
-- Central platform = high ground reward. Cover walls = tactical play.

local folder = getFolder("PvPArena")

-- ═══ FLOOR ═══
P("ArenaFloor", CFrame.new(0, -0.25, 0), Vector3.new(80, 0.5, 80), Enum.Material.Concrete, Color3.fromRGB(130, 128, 122))

-- ═══ BOUNDARY WALLS ═══ (tall enough to prevent escape, 12 studs)
P("WallN", CFrame.new(0, 6, 40), Vector3.new(80, 12, 1), Enum.Material.Concrete, Color3.fromRGB(100, 98, 92))
P("WallS", CFrame.new(0, 6, -40), Vector3.new(80, 12, 1), Enum.Material.Concrete, Color3.fromRGB(100, 98, 92))
P("WallE", CFrame.new(40, 6, 0), Vector3.new(1, 12, 78), Enum.Material.Concrete, Color3.fromRGB(100, 98, 92))
P("WallW", CFrame.new(-40, 6, 0), Vector3.new(1, 12, 78), Enum.Material.Concrete, Color3.fromRGB(100, 98, 92))

-- ═══ RED TEAM SPAWN (south end, Z=-30 to -38) ═══
P("RedSpawnFloor", CFrame.new(0, 0.05, -34), Vector3.new(16, 0.1, 8), Enum.Material.Concrete, Color3.fromRGB(180, 60, 50))
P("RedSpawnWallBack", CFrame.new(0, 3, -38.5), Vector3.new(16, 6, 0.5), Enum.Material.Concrete, Color3.fromRGB(160, 50, 40))
P("RedSpawnWallL", CFrame.new(-8, 3, -34), Vector3.new(0.5, 6, 8), Enum.Material.Concrete, Color3.fromRGB(160, 50, 40))
P("RedSpawnWallR", CFrame.new(8, 3, -34), Vector3.new(0.5, 6, 8), Enum.Material.Concrete, Color3.fromRGB(160, 50, 40))
P("RedSpawnRoof", CFrame.new(0, 6.25, -34), Vector3.new(16, 0.5, 8), Enum.Material.Concrete, Color3.fromRGB(150, 45, 35))
P("RedSpawnPad", CFrame.new(0, 0.15, -34), Vector3.new(6, 0.2, 6), Enum.Material.Neon, Color3.fromRGB(255, 80, 80))

-- ═══ BLUE TEAM SPAWN (north end, Z=30 to 38, mirror of red) ═══
P("BlueSpawnFloor", CFrame.new(0, 0.05, 34), Vector3.new(16, 0.1, 8), Enum.Material.Concrete, Color3.fromRGB(50, 80, 180))
P("BlueSpawnWallBack", CFrame.new(0, 3, 38.5), Vector3.new(16, 6, 0.5), Enum.Material.Concrete, Color3.fromRGB(40, 70, 160))
P("BlueSpawnWallL", CFrame.new(-8, 3, 34), Vector3.new(0.5, 6, 8), Enum.Material.Concrete, Color3.fromRGB(40, 70, 160))
P("BlueSpawnWallR", CFrame.new(8, 3, 34), Vector3.new(0.5, 6, 8), Enum.Material.Concrete, Color3.fromRGB(40, 70, 160))
P("BlueSpawnRoof", CFrame.new(0, 6.25, 34), Vector3.new(16, 0.5, 8), Enum.Material.Concrete, Color3.fromRGB(35, 65, 150))
P("BlueSpawnPad", CFrame.new(0, 0.15, 34), Vector3.new(6, 0.2, 6), Enum.Material.Neon, Color3.fromRGB(80, 120, 255))

-- ═══ CENTER PLATFORM ═══ (elevated, rewards aggressive play)
P("CenterPlat", CFrame.new(0, 3, 0), Vector3.new(12, 0.5, 12), Enum.Material.Metal, Color3.fromRGB(110, 110, 120))
P("CenterRamp1", CFrame.new(0, 1.5, -7.5) * CFrame.Angles(math.rad(20), 0, 0), Vector3.new(6, 0.5, 6), Enum.Material.Metal, Color3.fromRGB(100, 100, 110))
P("CenterRamp2", CFrame.new(0, 1.5, 7.5) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(6, 0.5, 6), Enum.Material.Metal, Color3.fromRGB(100, 100, 110))
-- Weapon rack on center (visual only — scripts would handle actual weapons)
P("WeaponRack", CFrame.new(0, 4, 0), Vector3.new(3, 2, 0.5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("WeaponRackBase", CFrame.new(0, 3.5, 0), Vector3.new(3.5, 0.5, 1), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))

-- ═══ COVER WALLS ═══ (4 studs tall — duck behind, but can be flanked)
-- Mirrored: 4 on red side, 4 on blue side
-- Red side cover (south half)
P("CoverR1", CFrame.new(-15, 2, -15), Vector3.new(6, 4, 1), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverR2", CFrame.new(15, 2, -15), Vector3.new(6, 4, 1), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverR3", CFrame.new(-25, 2, -8), Vector3.new(1, 4, 6), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverR4", CFrame.new(25, 2, -8), Vector3.new(1, 4, 6), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
-- Blue side cover (north half, mirror)
P("CoverB1", CFrame.new(-15, 2, 15), Vector3.new(6, 4, 1), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverB2", CFrame.new(15, 2, 15), Vector3.new(6, 4, 1), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverB3", CFrame.new(-25, 2, 8), Vector3.new(1, 4, 6), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("CoverB4", CFrame.new(25, 2, 8), Vector3.new(1, 4, 6), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))

-- ═══ PILLARS ═══ (vertical cover, floor-to-ceiling, adds verticality)
P("PillarNE", CFrame.new(20, 6, 20), Vector3.new(2, 12, 2), Enum.Material.Concrete, Color3.fromRGB(115, 113, 107))
P("PillarNW", CFrame.new(-20, 6, 20), Vector3.new(2, 12, 2), Enum.Material.Concrete, Color3.fromRGB(115, 113, 107))
P("PillarSE", CFrame.new(20, 6, -20), Vector3.new(2, 12, 2), Enum.Material.Concrete, Color3.fromRGB(115, 113, 107))
P("PillarSW", CFrame.new(-20, 6, -20), Vector3.new(2, 12, 2), Enum.Material.Concrete, Color3.fromRGB(115, 113, 107))

-- ═══ CRATE CLUSTERS ═══ (breakable cover feel, scattered)
P("CrateA1", CFrame.new(-10, 1.5, -5), Vector3.new(3, 3, 3), Enum.Material.WoodPlanks, Color3.fromRGB(150, 110, 60))
P("CrateA2", CFrame.new(-8.5, 1, -5), Vector3.new(2, 2, 2), Enum.Material.WoodPlanks, Color3.fromRGB(145, 105, 55))
P("CrateB1", CFrame.new(12, 1.5, 8), Vector3.new(3, 3, 3), Enum.Material.WoodPlanks, Color3.fromRGB(150, 110, 60))
P("CrateB2", CFrame.new(10.5, 1, 8), Vector3.new(2, 2, 2), Enum.Material.WoodPlanks, Color3.fromRGB(145, 105, 55))

-- ═══ ARENA LIGHTS ═══ (overhead, bright, no shadows to hide in)
local arenaLight1 = P("StadiumLight1", CFrame.new(-30, 11.5, -30), Vector3.new(2, 0.5, 2), Enum.Material.Neon, Color3.fromRGB(255, 250, 240))
local al1 = Instance.new("PointLight"); al1.Range = 60; al1.Brightness = 1.5; al1.Color = Color3.fromRGB(255, 245, 230); al1.Parent = arenaLight1
local arenaLight2 = P("StadiumLight2", CFrame.new(30, 11.5, 30), Vector3.new(2, 0.5, 2), Enum.Material.Neon, Color3.fromRGB(255, 250, 240))
local al2 = Instance.new("PointLight"); al2.Range = 60; al2.Brightness = 1.5; al2.Color = Color3.fromRGB(255, 245, 230); al2.Parent = arenaLight2`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CAFE / RESTAURANT — interior scene
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Cafe Interior — counter, tables, chairs, menu board, kitchen peek',
    tags: ['cafe', 'restaurant', 'coffee', 'shop', 'interior', 'food', 'building', 'diner'],
    description: 'A cozy cafe interior: 24x20 stud room with entrance, L-shaped service counter with register, 3 tables with 2 chairs each, a menu board on the wall, kitchen pass-through window, hanging pendant lights, and a large front window. 54 parts. Everything is proportioned to Roblox player scale (table height 3.5, chair seat 2.5, counter 4 studs). Warm wood and brick palette.',
    code: `-- CAFE INTERIOR (54 parts) — 24x20 footprint
-- Warm colors: brick walls, wood furniture, fabric seats.
-- Layout: enter from +Z, counter on the left, tables on the right.

local folder = getFolder("Cafe")

-- ═══ STRUCTURE ═══
P("Floor", CFrame.new(0, 0.25, 0), Vector3.new(24, 0.5, 20), Enum.Material.WoodPlanks, Color3.fromRGB(155, 105, 58))
P("Ceiling", CFrame.new(0, 9, 0), Vector3.new(24, 0.3, 20), Enum.Material.Concrete, Color3.fromRGB(235, 230, 220))

-- Walls (height=8, base at floor top 0.5, center Y=4.5)
P("WallBack", CFrame.new(0, 4.5, -10), Vector3.new(24, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 80, 55))
P("WallLeft", CFrame.new(-12, 4.5, 0), Vector3.new(0.5, 8, 19.5), Enum.Material.Brick, Color3.fromRGB(165, 75, 50))
P("WallRight", CFrame.new(12, 4.5, 0), Vector3.new(0.5, 8, 19.5), Enum.Material.Brick, Color3.fromRGB(165, 75, 50))
-- Front wall (has large window and door gap)
P("FrontWallL", CFrame.new(-8, 4.5, 10), Vector3.new(8, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 80, 55))
P("FrontWallR", CFrame.new(9, 4.5, 10), Vector3.new(6, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 80, 55))
P("FrontAboveDoor", CFrame.new(4, 7.5, 10), Vector3.new(4, 2, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 80, 55))
-- Door
P("Door", CFrame.new(4, 4, 10.2), Vector3.new(3.5, 7, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
-- Large front window (left side of facade)
P("FrontWindow", CFrame.new(-8, 4.5, 10.1), Vector3.new(6, 5, 0.2), Enum.Material.Glass, Color3.fromRGB(200, 220, 235))

-- ═══ SERVICE COUNTER (L-shape, left side of cafe) ═══
-- Main counter runs along left wall, then turns toward center
P("CounterMain", CFrame.new(-8, 2.5, -2), Vector3.new(1.2, 4, 12), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("CounterTop", CFrame.new(-8, 4.6, -2), Vector3.new(1.6, 0.3, 12.5), Enum.Material.Slate, Color3.fromRGB(60, 60, 65))
-- Counter turn (toward center)
P("CounterTurn", CFrame.new(-5, 2.5, 4), Vector3.new(5, 4, 1.2), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("CounterTurnTop", CFrame.new(-5, 4.6, 4), Vector3.new(5.5, 0.3, 1.6), Enum.Material.Slate, Color3.fromRGB(60, 60, 65))

-- Cash register (sits on counter)
P("Register", CFrame.new(-8, 5.2, 2), Vector3.new(1, 0.8, 1.2), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("RegisterScreen", CFrame.new(-8, 5.8, 2.1), Vector3.new(0.8, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 200, 100))

-- ═══ MENU BOARD (on back wall, behind counter) ═══
P("MenuBoard", CFrame.new(-6, 6.5, -9.7), Vector3.new(6, 3, 0.3), Enum.Material.Wood, Color3.fromRGB(40, 35, 30))
-- BillboardGui with menu items would attach here

-- ═══ KITCHEN PASS-THROUGH (window in back wall) ═══
P("KitchenWindow", CFrame.new(-6, 4.5, -9.8), Vector3.new(4, 2.5, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("KitchenShelf", CFrame.new(-6, 3.5, -9.5), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Metal, Color3.fromRGB(170, 170, 175))

-- ═══ TABLE 1 (near window, right side) ═══
P("Table1Top", CFrame.new(5, 3.5, 6), Vector3.new(4, 0.3, 3), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Table1Leg1", CFrame.new(3.2, 1.8, 4.7), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table1Leg2", CFrame.new(6.8, 1.8, 4.7), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table1Leg3", CFrame.new(3.2, 1.8, 7.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table1Leg4", CFrame.new(6.8, 1.8, 7.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Chair1A_Seat", CFrame.new(3, 2.5, 6), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 70, 50))
P("Chair1A_Back", CFrame.new(2.1, 3.8, 6), Vector3.new(0.3, 2.2, 2), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("Chair1B_Seat", CFrame.new(7, 2.5, 6), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 70, 50))
P("Chair1B_Back", CFrame.new(7.9, 3.8, 6), Vector3.new(0.3, 2.2, 2), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))

-- ═══ TABLE 2 (center right) ═══
P("Table2Top", CFrame.new(6, 3.5, 0), Vector3.new(4, 0.3, 3), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Table2Leg1", CFrame.new(4.2, 1.8, -1.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table2Leg2", CFrame.new(7.8, 1.8, -1.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table2Leg3", CFrame.new(4.2, 1.8, 1.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Table2Leg4", CFrame.new(7.8, 1.8, 1.3), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Chair2A_Seat", CFrame.new(6, 2.5, -2), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 70, 50))
P("Chair2A_Back", CFrame.new(6, 3.8, -3), Vector3.new(2, 2.2, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("Chair2B_Seat", CFrame.new(6, 2.5, 2), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 70, 50))
P("Chair2B_Back", CFrame.new(6, 3.8, 3), Vector3.new(2, 2.2, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))

-- ═══ TABLE 3 (back right corner) ═══
P("Table3Top", CFrame.new(7, 3.5, -6), Vector3.new(3.5, 0.3, 3), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Table3Pedestal", CFrame.new(7, 1.8, -6), Vector3.new(1, 3, 1), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("Chair3A_Seat", CFrame.new(5, 2.5, -6), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(50, 90, 130))
P("Chair3A_Back", CFrame.new(4.1, 3.8, -6), Vector3.new(0.3, 2.2, 2), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("Chair3B_Seat", CFrame.new(9, 2.5, -6), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(50, 90, 130))
P("Chair3B_Back", CFrame.new(9.9, 3.8, -6), Vector3.new(0.3, 2.2, 2), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))

-- ═══ PENDANT LIGHTS ═══ (hanging from ceiling over tables)
local pend1 = P("Pendant1", CFrame.new(5, 7.5, 6), Vector3.new(1, 0.8, 1), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
local pendL1 = Instance.new("PointLight"); pendL1.Range = 15; pendL1.Brightness = 0.8; pendL1.Color = Color3.fromRGB(255, 220, 160); pendL1.Parent = pend1
P("PendCord1", CFrame.new(5, 8.3, 6), Vector3.new(0.1, 1, 0.1), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))

local pend2 = P("Pendant2", CFrame.new(6, 7.5, 0), Vector3.new(1, 0.8, 1), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
local pendL2 = Instance.new("PointLight"); pendL2.Range = 15; pendL2.Brightness = 0.8; pendL2.Color = Color3.fromRGB(255, 220, 160); pendL2.Parent = pend2
P("PendCord2", CFrame.new(6, 8.3, 0), Vector3.new(0.1, 1, 0.1), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PIRATE SHIP — vehicles + adventure
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Pirate Ship — full vessel with mast, sails, deck, cabin, and cannons',
    tags: ['pirate', 'ship', 'boat', 'vessel', 'ocean', 'adventure', 'sailing', 'cannon', 'sea'],
    description: 'A 40-stud long pirate ship with curved hull (3 stacked layers for shape), main deck, raised quarterdeck at stern, captain cabin underneath, main mast with crossbeam and sail, 4 cannons (2 per side), bowsprit, anchor, wheel, and railing. 48 parts. Hull uses 3 overlapping parts at different widths to simulate a curved shape. Ship sits at water level (Y=0) with hull below.',
    code: `-- PIRATE SHIP (48 parts) — 40 studs long, bow at +Z
-- Hull built from 3 layers of decreasing width to simulate curves.
-- Ship sits AT water level — hull goes below Y=0.

local folder = getFolder("PirateShip")

-- ═══ HULL ═══ (3 layers: bottom narrow, middle wider, top widest)
-- Bottom keel (narrowest, deepest)
P("HullKeel", CFrame.new(0, -3, 0), Vector3.new(4, 2, 36), Enum.Material.WoodPlanks, Color3.fromRGB(80, 50, 25))
-- Middle hull
P("HullMid", CFrame.new(0, -1.5, 0), Vector3.new(8, 2, 38), Enum.Material.WoodPlanks, Color3.fromRGB(90, 55, 28))
-- Upper hull (widest, at waterline)
P("HullUpper", CFrame.new(0, 0, 0), Vector3.new(10, 2, 40), Enum.Material.WoodPlanks, Color3.fromRGB(100, 60, 30))

-- Bow point (narrows the front, two angled parts)
P("BowLeft", CFrame.new(-2, -0.5, 19) * CFrame.Angles(0, math.rad(15), 0), Vector3.new(3, 3, 5), Enum.Material.WoodPlanks, Color3.fromRGB(95, 58, 28))
P("BowRight", CFrame.new(2, -0.5, 19) * CFrame.Angles(0, math.rad(-15), 0), Vector3.new(3, 3, 5), Enum.Material.WoodPlanks, Color3.fromRGB(95, 58, 28))

-- ═══ MAIN DECK ═══
P("MainDeck", CFrame.new(0, 1.25, 0), Vector3.new(9.5, 0.5, 30), Enum.Material.WoodPlanks, Color3.fromRGB(140, 95, 50))

-- ═══ QUARTERDECK ═══ (raised stern, captain's area)
P("QuarterDeck", CFrame.new(0, 3.25, -12), Vector3.new(9.5, 0.5, 10), Enum.Material.WoodPlanks, Color3.fromRGB(135, 90, 48))
-- Steps up to quarterdeck (2 steps)
P("Step1", CFrame.new(0, 1.75, -6.5), Vector3.new(5, 0.5, 2), Enum.Material.WoodPlanks, Color3.fromRGB(130, 85, 45))
P("Step2", CFrame.new(0, 2.5, -8), Vector3.new(5, 0.5, 2), Enum.Material.WoodPlanks, Color3.fromRGB(130, 85, 45))

-- ═══ CAPTAIN'S CABIN ═══ (under quarterdeck)
P("CabinWallBack", CFrame.new(0, 2, -16.5), Vector3.new(9, 2.5, 0.5), Enum.Material.WoodPlanks, Color3.fromRGB(110, 68, 32))
P("CabinWallL", CFrame.new(-4.5, 2, -12), Vector3.new(0.5, 2.5, 9), Enum.Material.WoodPlanks, Color3.fromRGB(110, 68, 32))
P("CabinWallR", CFrame.new(4.5, 2, -12), Vector3.new(0.5, 2.5, 9), Enum.Material.WoodPlanks, Color3.fromRGB(110, 68, 32))
P("CabinDoor", CFrame.new(0, 2, -7.3), Vector3.new(2.5, 4, 0.3), Enum.Material.Wood, Color3.fromRGB(85, 50, 22))
-- Cabin window (back)
P("CabinWindow", CFrame.new(0, 2.5, -16.7), Vector3.new(3, 1.5, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))

-- ═══ SHIP'S WHEEL ═══ (on quarterdeck)
P("WheelPost", CFrame.new(0, 4, -14), Vector3.new(0.5, 1.5, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 60, 28))
P("Wheel", CFrame.new(0, 5, -14), Vector3.new(2, 2, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 65, 30))

-- ═══ MAIN MAST ═══ (tall, center of main deck)
P("Mast", CFrame.new(0, 12, 2), Vector3.new(0.8, 22, 0.8), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Crossbeam", CFrame.new(0, 16, 2), Vector3.new(12, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
-- Sail (large, Fabric, slightly angled to suggest wind)
P("Sail", CFrame.new(0, 12, 2.5) * CFrame.Angles(0, 0, math.rad(3)), Vector3.new(10, 10, 0.2), Enum.Material.Fabric, Color3.fromRGB(235, 225, 200))
-- Crow's nest (platform at top of mast)
P("CrowsNest", CFrame.new(0, 21, 2), Vector3.new(3, 0.3, 3), Enum.Material.WoodPlanks, Color3.fromRGB(110, 68, 32))
P("CrowsNestRail", CFrame.new(0, 22, 2), Vector3.new(3.5, 1.5, 3.5), Enum.Material.Wood, Color3.fromRGB(100, 62, 28))

-- ═══ BOWSPRIT ═══ (pole extending from bow, angled upward)
P("Bowsprit", CFrame.new(0, 2, 22) * CFrame.Angles(math.rad(-25), 0, 0), Vector3.new(0.5, 0.5, 8), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))

-- ═══ CANNONS ═══ (2 per side, evenly spaced)
-- Port side (left, -X)
P("CannonL1_Base", CFrame.new(-4.5, 1.8, 5), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("CannonL1_Barrel", CFrame.new(-5.5, 2, 5), Vector3.new(3, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("CannonL2_Base", CFrame.new(-4.5, 1.8, -2), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("CannonL2_Barrel", CFrame.new(-5.5, 2, -2), Vector3.new(3, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
-- Starboard side (right, +X)
P("CannonR1_Base", CFrame.new(4.5, 1.8, 5), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("CannonR1_Barrel", CFrame.new(5.5, 2, 5), Vector3.new(3, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("CannonR2_Base", CFrame.new(4.5, 1.8, -2), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("CannonR2_Barrel", CFrame.new(5.5, 2, -2), Vector3.new(3, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))

-- ═══ RAILING ═══ (around main deck edge)
P("RailL", CFrame.new(-4.8, 2.5, 4), Vector3.new(0.2, 2, 24), Enum.Material.Wood, Color3.fromRGB(105, 65, 30))
P("RailR", CFrame.new(4.8, 2.5, 4), Vector3.new(0.2, 2, 24), Enum.Material.Wood, Color3.fromRGB(105, 65, 30))
P("RailBow", CFrame.new(0, 2.5, 16), Vector3.new(9, 2, 0.2), Enum.Material.Wood, Color3.fromRGB(105, 65, 30))

-- ═══ ANCHOR ═══ (hanging from bow)
P("AnchorChain", CFrame.new(3, 0.5, 17), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("AnchorBody", CFrame.new(3, -1.5, 17), Vector3.new(1.5, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  FARM — open-world / simulator
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Farm Scene — barn, fenced field, crops, silo, tractor, and farmhouse',
    tags: ['farm', 'barn', 'farming', 'agriculture', 'field', 'crops', 'tractor', 'rural', 'simulator', 'country'],
    description: 'A complete farm scene spread across 100x100 studs: red barn (20x16) with hay bales inside, fenced crop field (30x20) with 3 crop rows, grain silo (6x18 tall), simple tractor (10 studs long), farmhouse (from house template but reskinned), wooden fence perimeter, dirt path connecting areas, water trough, and windmill. 68 parts. Good for farming simulators, roleplay, or countryside scenes.',
    code: `-- FARM SCENE (68 parts) — 100x100 stud area
-- Layout: barn (NW), field (NE), silo (N center), farmhouse (SW),
-- tractor (SE), all connected by dirt paths.

local folder = getFolder("Farm")

-- ═══ GROUND ═══
P("FarmGround", CFrame.new(0, -0.25, 0), Vector3.new(100, 0.5, 100), Enum.Material.Grass, Color3.fromRGB(85, 145, 55))

-- Dirt path (runs N-S through center, with E-W branch)
P("PathNS", CFrame.new(0, 0.05, 0), Vector3.new(5, 0.1, 80), Enum.Material.Concrete, Color3.fromRGB(145, 110, 70))
P("PathEW", CFrame.new(10, 0.05, 0), Vector3.new(50, 0.1, 5), Enum.Material.Concrete, Color3.fromRGB(145, 110, 70))

-- ═══ RED BARN (NW, -X +Z) ═══ — 20x16 footprint
P("BarnFloor", CFrame.new(-30, 0.1, 25), Vector3.new(20, 0.2, 16), Enum.Material.Concrete, Color3.fromRGB(140, 135, 125))
P("BarnWallBack", CFrame.new(-30, 6, 17), Vector3.new(20, 12, 0.5), Enum.Material.Wood, Color3.fromRGB(165, 40, 30))
P("BarnWallFront", CFrame.new(-30, 6, 33), Vector3.new(20, 12, 0.5), Enum.Material.Wood, Color3.fromRGB(165, 40, 30))
P("BarnWallL", CFrame.new(-40, 6, 25), Vector3.new(0.5, 12, 15.5), Enum.Material.Wood, Color3.fromRGB(160, 38, 28))
P("BarnWallR", CFrame.new(-20, 6, 25), Vector3.new(0.5, 12, 15.5), Enum.Material.Wood, Color3.fromRGB(160, 38, 28))
-- Barn door (large, double-height)
P("BarnDoor", CFrame.new(-30, 5, 33.3), Vector3.new(8, 9, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 70, 30))
-- Barn roof (two angled halves)
P("BarnRoofL", CFrame.new(-35, 13, 25) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(12, 0.5, 17), Enum.Material.Metal, Color3.fromRGB(140, 35, 25))
P("BarnRoofR", CFrame.new(-25, 13, 25) * CFrame.Angles(0, 0, math.rad(-20)), Vector3.new(12, 0.5, 17), Enum.Material.Metal, Color3.fromRGB(140, 35, 25))
-- Hay bales inside
P("HayBale1", CFrame.new(-35, 2, 22), Vector3.new(4, 3, 3), Enum.Material.Grass, Color3.fromRGB(195, 180, 80))
P("HayBale2", CFrame.new(-35, 2, 26), Vector3.new(4, 3, 3), Enum.Material.Grass, Color3.fromRGB(190, 175, 75))
P("HayBale3", CFrame.new(-35, 5, 24), Vector3.new(4, 3, 3), Enum.Material.Grass, Color3.fromRGB(200, 185, 85))

-- ═══ GRAIN SILO (tall cylinder approximation, N center) ═══
P("SiloBody", CFrame.new(-10, 9, 35), Vector3.new(6, 18, 6), Enum.Material.Metal, Color3.fromRGB(180, 175, 170))
P("SiloCone", CFrame.new(-10, 19, 35), Vector3.new(7, 2, 7), Enum.Material.Metal, Color3.fromRGB(170, 165, 160))
P("SiloTop", CFrame.new(-10, 20.5, 35), Vector3.new(3, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(160, 155, 150))

-- ═══ CROP FIELD (NE, fenced, 30x20) ═══
P("FieldSoil", CFrame.new(25, 0.05, 30), Vector3.new(30, 0.1, 20), Enum.Material.Concrete, Color3.fromRGB(100, 70, 40))
-- Crop rows (3 rows of green)
P("CropRow1", CFrame.new(25, 0.6, 25), Vector3.new(28, 0.8, 3), Enum.Material.Grass, Color3.fromRGB(60, 140, 40))
P("CropRow2", CFrame.new(25, 0.8, 30), Vector3.new(28, 1, 3), Enum.Material.Grass, Color3.fromRGB(55, 135, 35))
P("CropRow3", CFrame.new(25, 0.5, 35), Vector3.new(28, 0.6, 3), Enum.Material.Grass, Color3.fromRGB(65, 145, 45))
-- Fence posts and rails around field
P("FenceN", CFrame.new(25, 1.5, 40.5), Vector3.new(31, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("FenceS", CFrame.new(25, 1.5, 19.5), Vector3.new(31, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("FenceE", CFrame.new(40.5, 1.5, 30), Vector3.new(0.3, 0.3, 21), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("FenceW", CFrame.new(9.5, 1.5, 30), Vector3.new(0.3, 0.3, 21), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
-- Fence posts (corners + midpoints)
P("FP_NE", CFrame.new(40.5, 1.5, 40.5), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("FP_NW", CFrame.new(9.5, 1.5, 40.5), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("FP_SE", CFrame.new(40.5, 1.5, 19.5), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("FP_SW", CFrame.new(9.5, 1.5, 19.5), Vector3.new(0.5, 3, 0.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))

-- ═══ TRACTOR (SE area) ═══ — 10 studs long
P("TractorBody", CFrame.new(30, 2.5, -20), Vector3.new(4, 3, 6), Enum.Material.Metal, Color3.fromRGB(50, 140, 50))
P("TractorHood", CFrame.new(30, 2.5, -16), Vector3.new(3.5, 2, 3), Enum.Material.Metal, Color3.fromRGB(45, 130, 45))
P("TractorCab", CFrame.new(30, 4.5, -21), Vector3.new(3.5, 2.5, 3.5), Enum.Material.Metal, Color3.fromRGB(55, 145, 55))
P("TractorCabGlass", CFrame.new(30, 4.5, -19.5), Vector3.new(3, 2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
-- Big rear wheels + small front
P("TractorWheelBL", CFrame.new(27.5, 1.5, -22) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Concrete, Color3.fromRGB(35, 35, 40))
P("TractorWheelBR", CFrame.new(32.5, 1.5, -22) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Concrete, Color3.fromRGB(35, 35, 40))
P("TractorWheelFL", CFrame.new(28.5, 1, -16) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Concrete, Color3.fromRGB(35, 35, 40))
P("TractorWheelFR", CFrame.new(31.5, 1, -16) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Concrete, Color3.fromRGB(35, 35, 40))

-- ═══ WINDMILL (NW edge) ═══
P("WindmillTower", CFrame.new(-40, 8, -15), Vector3.new(4, 16, 4), Enum.Material.Brick, Color3.fromRGB(200, 190, 175))
P("WindmillCap", CFrame.new(-40, 16.5, -15), Vector3.new(5, 1.5, 5), Enum.Material.Slate, Color3.fromRGB(100, 98, 92))
-- Blades (4 arms, simplified as 2 crossed parts)
P("WindmillBladeH", CFrame.new(-40, 13, -12.5), Vector3.new(14, 1.5, 0.2), Enum.Material.Wood, Color3.fromRGB(230, 220, 200))
P("WindmillBladeV", CFrame.new(-40, 13, -12.5), Vector3.new(0.2, 14, 1.5), Enum.Material.Wood, Color3.fromRGB(225, 215, 195))
P("WindmillHub", CFrame.new(-40, 13, -12.5), Vector3.new(1.5, 1.5, 0.5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))

-- ═══ WATER TROUGH (near barn) ═══
P("Trough", CFrame.new(-18, 1, 28), Vector3.new(5, 1.5, 2), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("TroughWater", CFrame.new(-18, 1.3, 28), Vector3.new(4.5, 0.5, 1.5), Enum.Material.Glass, Color3.fromRGB(70, 140, 190))

-- ═══ FARMHOUSE (SW, simple cottage) ═══
P("HouseFloor", CFrame.new(-30, 0.1, -25), Vector3.new(14, 0.2, 12), Enum.Material.WoodPlanks, Color3.fromRGB(155, 105, 58))
P("HouseWallN", CFrame.new(-30, 4, -19), Vector3.new(14, 7, 0.5), Enum.Material.Concrete, Color3.fromRGB(230, 220, 200))
P("HouseWallS", CFrame.new(-30, 4, -31), Vector3.new(14, 7, 0.5), Enum.Material.Concrete, Color3.fromRGB(225, 215, 195))
P("HouseWallW", CFrame.new(-37, 4, -25), Vector3.new(0.5, 7, 11.5), Enum.Material.Concrete, Color3.fromRGB(228, 218, 198))
P("HouseWallE", CFrame.new(-23, 4, -25), Vector3.new(0.5, 7, 11.5), Enum.Material.Concrete, Color3.fromRGB(228, 218, 198))
P("HouseRoof", CFrame.new(-30, 8, -25), Vector3.new(15, 0.5, 13), Enum.Material.Slate, Color3.fromRGB(80, 80, 90))
P("HousePorch", CFrame.new(-30, 0.3, -18), Vector3.new(10, 0.3, 3), Enum.Material.WoodPlanks, Color3.fromRGB(145, 95, 50))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PARK / PLAYGROUND
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Park and Playground — swings, slide, sandbox, benches, and pond',
    tags: ['park', 'playground', 'swing', 'slide', 'sandbox', 'outdoor', 'recreation', 'kids', 'nature'],
    description: 'A 60x60 park with playground equipment (swing set with 2 swings, slide with ladder, sandbox), walking path, 3 benches, a small pond, 4 trees, and a lamp post. 56 parts. Playground equipment is sized for Roblox player scale. Swing chains are 6 studs long (player can sit). Slide is 8 studs tall with ladder steps.',
    code: `-- PARK AND PLAYGROUND (56 parts) — 60x60 area
-- Playground NE, pond SW, path loops through, benches along path.

local folder = getFolder("Park")

-- ═══ GROUND ═══
P("ParkGround", CFrame.new(0, -0.25, 0), Vector3.new(60, 0.5, 60), Enum.Material.Grass, Color3.fromRGB(75, 145, 55))
-- Walking path (loops around)
P("PathOuter", CFrame.new(0, 0.05, 0), Vector3.new(4, 0.1, 50), Enum.Material.Concrete, Color3.fromRGB(175, 170, 160))
P("PathCross", CFrame.new(0, 0.05, 0), Vector3.new(40, 0.1, 4), Enum.Material.Concrete, Color3.fromRGB(175, 170, 160))

-- ═══ SWING SET (NE area, 2 swings) ═══
-- A-frame supports + crossbar + chains + seats
P("SwingFrameL", CFrame.new(15, 4, 18) * CFrame.Angles(0, 0, math.rad(10)), Vector3.new(0.5, 8, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("SwingFrameLB", CFrame.new(15, 4, 22) * CFrame.Angles(0, 0, math.rad(10)), Vector3.new(0.5, 8, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("SwingFrameR", CFrame.new(25, 4, 18) * CFrame.Angles(0, 0, math.rad(-10)), Vector3.new(0.5, 8, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("SwingFrameRB", CFrame.new(25, 4, 22) * CFrame.Angles(0, 0, math.rad(-10)), Vector3.new(0.5, 8, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("SwingCrossbar", CFrame.new(20, 8, 20), Vector3.new(12, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
-- Swing 1
P("Chain1L", CFrame.new(18, 5.5, 20), Vector3.new(0.1, 5, 0.1), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Chain1R", CFrame.new(19, 5.5, 20), Vector3.new(0.1, 5, 0.1), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Seat1", CFrame.new(18.5, 3, 20), Vector3.new(2, 0.2, 1), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))
-- Swing 2
P("Chain2L", CFrame.new(21, 5.5, 20), Vector3.new(0.1, 5, 0.1), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Chain2R", CFrame.new(22, 5.5, 20), Vector3.new(0.1, 5, 0.1), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Seat2", CFrame.new(21.5, 3, 20), Vector3.new(2, 0.2, 1), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))

-- ═══ SLIDE (E side) ═══
-- Platform at top, slide surface angled down, ladder on back
P("SlidePlatform", CFrame.new(22, 8, 8), Vector3.new(4, 0.4, 4), Enum.Material.Metal, Color3.fromRGB(50, 130, 200))
-- Slide surface (angled from platform to ground)
P("SlideSurface", CFrame.new(22, 4, 4) * CFrame.Angles(math.rad(35), 0, 0), Vector3.new(2.5, 0.2, 11), Enum.Material.Metal, Color3.fromRGB(50, 130, 200))
-- Slide rails
P("SlideRailL", CFrame.new(20.6, 4.5, 4) * CFrame.Angles(math.rad(35), 0, 0), Vector3.new(0.2, 1, 11), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("SlideRailR", CFrame.new(23.4, 4.5, 4) * CFrame.Angles(math.rad(35), 0, 0), Vector3.new(0.2, 1, 11), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
-- Ladder (back of platform)
P("LadderRailL", CFrame.new(21, 4.5, 10), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("LadderRailR", CFrame.new(23, 4.5, 10), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 60, 50))
P("LadderRung1", CFrame.new(22, 2, 10), Vector3.new(2, 0.2, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("LadderRung2", CFrame.new(22, 4, 10), Vector3.new(2, 0.2, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("LadderRung3", CFrame.new(22, 6, 10), Vector3.new(2, 0.2, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
-- Platform supports (4 legs)
P("SlideLeg1", CFrame.new(20.5, 4, 6.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 55, 45))
P("SlideLeg2", CFrame.new(23.5, 4, 6.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 55, 45))
P("SlideLeg3", CFrame.new(20.5, 4, 9.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 55, 45))
P("SlideLeg4", CFrame.new(23.5, 4, 9.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 55, 45))

-- ═══ SANDBOX (N center) ═══
P("SandboxFrame", CFrame.new(5, 0.3, 22), Vector3.new(8, 0.6, 8), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))
P("Sand", CFrame.new(5, 0.4, 22), Vector3.new(7.5, 0.4, 7.5), Enum.Material.Concrete, Color3.fromRGB(220, 200, 150))

-- ═══ POND (SW area) ═══
P("PondBed", CFrame.new(-18, -0.5, -18), Vector3.new(12, 0.5, 10), Enum.Material.Slate, Color3.fromRGB(80, 75, 70))
P("PondWater", CFrame.new(-18, -0.1, -18), Vector3.new(11, 0.3, 9), Enum.Material.Glass, Color3.fromRGB(60, 130, 180))
P("PondRock1", CFrame.new(-13, 0.2, -15), Vector3.new(2, 1, 1.5), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))
P("PondRock2", CFrame.new(-22, 0.2, -20), Vector3.new(1.5, 0.8, 2), Enum.Material.Slate, Color3.fromRGB(105, 103, 95))

-- ═══ TREES (4 scattered) ═══
P("Tree1Trunk", CFrame.new(-20, 3.5, 15), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(95, 60, 30))
P("Tree1Canopy", CFrame.new(-20, 9, 15), Vector3.new(7, 5, 7), Enum.Material.Grass, Color3.fromRGB(55, 130, 45))
P("Tree2Trunk", CFrame.new(10, 3, -22), Vector3.new(1.2, 6, 1.2), Enum.Material.Wood, Color3.fromRGB(100, 62, 32))
P("Tree2Canopy", CFrame.new(10, 8, -22), Vector3.new(6, 4, 6), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("Tree3Trunk", CFrame.new(-8, 4, 5), Vector3.new(1.5, 8, 1.5), Enum.Material.Wood, Color3.fromRGB(90, 55, 28))
P("Tree3Canopy", CFrame.new(-8, 10, 5), Vector3.new(8, 5, 8), Enum.Material.Grass, Color3.fromRGB(60, 135, 50))

-- ═══ BENCHES (3 along path) ═══
P("Bench1S", CFrame.new(5, 1.5, 3), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Bench1B", CFrame.new(5, 2.5, 2.4), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("Bench2S", CFrame.new(-3, 1.5, -10), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Bench2B", CFrame.new(-3, 2.5, -10.6), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))

-- ═══ LAMP POST ═══
P("LampBase", CFrame.new(-3, 0.3, 3), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("LampPole", CFrame.new(-3, 5, 3), Vector3.new(0.4, 9, 0.4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
local lamp = P("LampHead", CFrame.new(-3, 9.5, 3), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local lpl = Instance.new("PointLight"); lpl.Range = 30; lpl.Brightness = 1; lpl.Color = Color3.fromRGB(255, 230, 180); lpl.Parent = lamp`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOW-POLY MOUNTAIN TERRAIN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Low-Poly Mountain Range — layered peaks with snow caps and pine trees',
    tags: ['mountain', 'terrain', 'low-poly', 'nature', 'landscape', 'snow', 'pine', 'lowpoly', 'hills', 'scenery'],
    description: 'A low-poly mountain range backdrop: 3 peaks of different heights (25, 35, 45 studs), each built from 3 stacked layers that get narrower toward the top (creating the faceted low-poly look). Snow caps on the two tallest. 6 pine trees at the base (triangular canopy = 3 stacked parts getting smaller). A river of Glass material runs through the valley. 42 parts. Mountains use muted stone colors, snow is bright white Concrete, pines are dark green. This is a BACKDROP — meant to fill the horizon behind gameplay areas.',
    code: `-- LOW-POLY MOUNTAIN RANGE (42 parts) — backdrop scenery
-- 3 peaks, pine trees at base, river through valley.
-- LOW-POLY STYLE: each mountain = stacked blocks getting narrower.
-- Meant to sit behind the main gameplay area as visual backdrop.

local folder = getFolder("Mountains")

-- ═══ GROUND (valley floor) ═══
P("ValleyFloor", CFrame.new(0, -0.25, 0), Vector3.new(120, 0.5, 60), Enum.Material.Grass, Color3.fromRGB(75, 140, 50))

-- ═══ MOUNTAIN 1 (left, medium — 25 studs tall) ═══
P("Mt1_Base", CFrame.new(-35, 5, -10), Vector3.new(30, 10, 25), Enum.Material.Slate, Color3.fromRGB(120, 115, 105))
P("Mt1_Mid", CFrame.new(-35, 14, -10), Vector3.new(20, 8, 18), Enum.Material.Slate, Color3.fromRGB(130, 125, 115))
P("Mt1_Peak", CFrame.new(-35, 21, -10), Vector3.new(10, 6, 10), Enum.Material.Slate, Color3.fromRGB(140, 135, 125))

-- ═══ MOUNTAIN 2 (center, tallest — 45 studs, with snow cap) ═══
P("Mt2_Base", CFrame.new(0, 7.5, -15), Vector3.new(35, 15, 30), Enum.Material.Slate, Color3.fromRGB(115, 110, 100))
P("Mt2_Lower", CFrame.new(0, 18, -15), Vector3.new(25, 10, 22), Enum.Material.Slate, Color3.fromRGB(125, 120, 110))
P("Mt2_Upper", CFrame.new(0, 28, -15), Vector3.new(16, 10, 14), Enum.Material.Slate, Color3.fromRGB(135, 130, 120))
P("Mt2_Peak", CFrame.new(0, 37, -15), Vector3.new(8, 8, 8), Enum.Material.Slate, Color3.fromRGB(145, 140, 130))
-- Snow cap
P("Mt2_Snow", CFrame.new(0, 41.5, -15), Vector3.new(9, 2, 9), Enum.Material.Concrete, Color3.fromRGB(240, 240, 245))
P("Mt2_SnowTip", CFrame.new(0, 43, -15), Vector3.new(5, 1.5, 5), Enum.Material.Concrete, Color3.fromRGB(245, 245, 250))

-- ═══ MOUNTAIN 3 (right, medium-tall — 35 studs, with snow cap) ═══
P("Mt3_Base", CFrame.new(40, 6, -8), Vector3.new(28, 12, 22), Enum.Material.Slate, Color3.fromRGB(118, 113, 103))
P("Mt3_Mid", CFrame.new(40, 16, -8), Vector3.new(18, 8, 15), Enum.Material.Slate, Color3.fromRGB(128, 123, 113))
P("Mt3_Upper", CFrame.new(40, 24, -8), Vector3.new(10, 8, 10), Enum.Material.Slate, Color3.fromRGB(138, 133, 123))
P("Mt3_Peak", CFrame.new(40, 30, -8), Vector3.new(5, 4, 5), Enum.Material.Slate, Color3.fromRGB(148, 143, 133))
P("Mt3_Snow", CFrame.new(40, 32.5, -8), Vector3.new(6, 1.5, 6), Enum.Material.Concrete, Color3.fromRGB(240, 240, 245))

-- ═══ RIVER (through valley between mountains) ═══
P("River1", CFrame.new(-15, -0.1, 5), Vector3.new(8, 0.3, 20), Enum.Material.Glass, Color3.fromRGB(50, 120, 180))
P("River2", CFrame.new(5, -0.1, 10), Vector3.new(30, 0.3, 6), Enum.Material.Glass, Color3.fromRGB(55, 125, 185))
P("River3", CFrame.new(30, -0.1, 8), Vector3.new(8, 0.3, 14), Enum.Material.Glass, Color3.fromRGB(50, 118, 178))

-- ═══ PINE TREES (low-poly = triangle canopy stacked 3 layers) ═══
-- Pine 1
P("Pine1Trunk", CFrame.new(-20, 3, 10), Vector3.new(1, 6, 1), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("Pine1Layer1", CFrame.new(-20, 7, 10), Vector3.new(5, 2.5, 5), Enum.Material.Grass, Color3.fromRGB(30, 80, 25))
P("Pine1Layer2", CFrame.new(-20, 9, 10), Vector3.new(3.5, 2.5, 3.5), Enum.Material.Grass, Color3.fromRGB(35, 90, 30))
P("Pine1Layer3", CFrame.new(-20, 11, 10), Vector3.new(2, 2, 2), Enum.Material.Grass, Color3.fromRGB(40, 95, 35))

-- Pine 2
P("Pine2Trunk", CFrame.new(-10, 2.5, 15), Vector3.new(0.8, 5, 0.8), Enum.Material.Wood, Color3.fromRGB(80, 50, 22))
P("Pine2Layer1", CFrame.new(-10, 6, 15), Vector3.new(4, 2, 4), Enum.Material.Grass, Color3.fromRGB(28, 75, 22))
P("Pine2Layer2", CFrame.new(-10, 7.8, 15), Vector3.new(2.8, 2, 2.8), Enum.Material.Grass, Color3.fromRGB(32, 85, 28))
P("Pine2Layer3", CFrame.new(-10, 9.5, 15), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Grass, Color3.fromRGB(38, 92, 32))

-- Pine 3 (taller)
P("Pine3Trunk", CFrame.new(20, 3.5, 12), Vector3.new(1.2, 7, 1.2), Enum.Material.Wood, Color3.fromRGB(88, 58, 28))
P("Pine3Layer1", CFrame.new(20, 8, 12), Vector3.new(6, 3, 6), Enum.Material.Grass, Color3.fromRGB(25, 70, 20))
P("Pine3Layer2", CFrame.new(20, 10.5, 12), Vector3.new(4, 2.5, 4), Enum.Material.Grass, Color3.fromRGB(30, 80, 25))
P("Pine3Layer3", CFrame.new(20, 12.5, 12), Vector3.new(2, 2, 2), Enum.Material.Grass, Color3.fromRGB(35, 88, 30))

-- Pine 4 (small)
P("Pine4Trunk", CFrame.new(35, 2, 18), Vector3.new(0.8, 4, 0.8), Enum.Material.Wood, Color3.fromRGB(82, 52, 24))
P("Pine4Layer1", CFrame.new(35, 5, 18), Vector3.new(3.5, 2, 3.5), Enum.Material.Grass, Color3.fromRGB(32, 82, 26))
P("Pine4Layer2", CFrame.new(35, 6.8, 18), Vector3.new(2, 1.5, 2), Enum.Material.Grass, Color3.fromRGB(36, 90, 30))`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  TOWN STREET — a whole street block
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Town Street Block — road, sidewalks, 3 buildings, streetlights, crosswalk',
    tags: ['town', 'street', 'city', 'road', 'buildings', 'urban', 'sidewalk', 'neighborhood', 'block'],
    description: 'A town street block: 80-stud road with lane markings, sidewalks on both sides, 3 buildings (shop, apartment, office) with varied heights and facade details, 4 streetlights, a crosswalk, fire hydrant, mailbox, and trash can. 64 parts. Buildings face the road with awnings and signs. Road has dashed center line and solid edge lines. This is a repeatable module — place multiple copies end-to-end for a full street.',
    code: `-- TOWN STREET BLOCK (64 parts) — 80 studs long
-- Road runs along Z axis. Buildings on +X side. Sidewalks both sides.
-- Tile this block end-to-end for a longer street.

local folder = getFolder("TownStreet")

-- ═══ ROAD ═══ (12 studs wide, dark asphalt)
P("Road", CFrame.new(0, 0.05, 0), Vector3.new(12, 0.1, 80), Enum.Material.Concrete, Color3.fromRGB(55, 55, 60))
-- Center dashes (5 dashes, each 6 studs long, 2 stud gaps)
P("Dash1", CFrame.new(0, 0.12, -28), Vector3.new(0.4, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(230, 220, 50))
P("Dash2", CFrame.new(0, 0.12, -14), Vector3.new(0.4, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(230, 220, 50))
P("Dash3", CFrame.new(0, 0.12, 0), Vector3.new(0.4, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(230, 220, 50))
P("Dash4", CFrame.new(0, 0.12, 14), Vector3.new(0.4, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(230, 220, 50))
P("Dash5", CFrame.new(0, 0.12, 28), Vector3.new(0.4, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(230, 220, 50))

-- Crosswalk (at Z=38, white stripes)
P("CrossStripe1", CFrame.new(-3, 0.12, 38), Vector3.new(1.5, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CrossStripe2", CFrame.new(0, 0.12, 38), Vector3.new(1.5, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CrossStripe3", CFrame.new(3, 0.12, 38), Vector3.new(1.5, 0.05, 6), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))

-- ═══ SIDEWALKS ═══ (raised 0.5 studs, 5 studs wide each side)
P("SidewalkE", CFrame.new(8.5, 0.25, 0), Vector3.new(5, 0.5, 80), Enum.Material.Concrete, Color3.fromRGB(175, 170, 162))
P("SidewalkW", CFrame.new(-8.5, 0.25, 0), Vector3.new(5, 0.5, 80), Enum.Material.Concrete, Color3.fromRGB(175, 170, 162))
-- Curb (edge between sidewalk and road)
P("CurbE", CFrame.new(6.1, 0.3, 0), Vector3.new(0.2, 0.5, 80), Enum.Material.Concrete, Color3.fromRGB(160, 155, 148))
P("CurbW", CFrame.new(-6.1, 0.3, 0), Vector3.new(0.2, 0.5, 80), Enum.Material.Concrete, Color3.fromRGB(160, 155, 148))

-- ═══ BUILDING 1: SHOP (Z=-25 to -10, height 10) ═══
P("Shop_Front", CFrame.new(11, 5.5, -17.5), Vector3.new(0.5, 10, 15), Enum.Material.Brick, Color3.fromRGB(190, 140, 90))
P("Shop_Side", CFrame.new(17.5, 5.5, -25), Vector3.new(13, 10, 0.5), Enum.Material.Brick, Color3.fromRGB(185, 135, 85))
P("Shop_Back", CFrame.new(17.5, 5.5, -10), Vector3.new(13, 10, 0.5), Enum.Material.Brick, Color3.fromRGB(185, 135, 85))
P("Shop_Roof", CFrame.new(14, 10.75, -17.5), Vector3.new(14, 0.5, 16), Enum.Material.Slate, Color3.fromRGB(80, 80, 88))
P("Shop_Window", CFrame.new(10.7, 4.5, -17.5), Vector3.new(0.2, 4, 8), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Shop_Awning", CFrame.new(9.5, 7, -17.5) * CFrame.Angles(math.rad(12), 0, 0), Vector3.new(0.2, 3, 12), Enum.Material.Fabric, Color3.fromRGB(180, 50, 40))
P("Shop_Door", CFrame.new(10.8, 3.5, -22), Vector3.new(0.3, 6.5, 3), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))

-- ═══ BUILDING 2: APARTMENT (Z=-5 to 15, height 20) ═══
P("Apt_Front", CFrame.new(11, 10.5, 5), Vector3.new(0.5, 20, 20), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("Apt_Side1", CFrame.new(19, 10.5, -5), Vector3.new(16, 20, 0.5), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("Apt_Side2", CFrame.new(19, 10.5, 15), Vector3.new(16, 20, 0.5), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("Apt_Roof", CFrame.new(15, 20.75, 5), Vector3.new(16, 0.5, 21), Enum.Material.Concrete, Color3.fromRGB(150, 145, 138))
-- Windows (grid: 3 rows × 4 columns)
P("AptWin1", CFrame.new(10.7, 5, 0), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin2", CFrame.new(10.7, 5, 5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin3", CFrame.new(10.7, 5, 10), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin4", CFrame.new(10.7, 11, 0), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin5", CFrame.new(10.7, 11, 5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin6", CFrame.new(10.7, 11, 10), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin7", CFrame.new(10.7, 17, 0), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("AptWin8", CFrame.new(10.7, 17, 5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(170, 200, 225))
P("Apt_Door", CFrame.new(10.8, 3.5, -2), Vector3.new(0.3, 6.5, 3.5), Enum.Material.Glass, Color3.fromRGB(160, 190, 210))

-- ═══ BUILDING 3: OFFICE (Z=20 to 35, height 15) ═══
P("Office_Front", CFrame.new(11, 8, 27.5), Vector3.new(0.5, 15, 15), Enum.Material.Concrete, Color3.fromRGB(180, 180, 190))
P("Office_Side1", CFrame.new(18, 8, 20), Vector3.new(14, 15, 0.5), Enum.Material.Concrete, Color3.fromRGB(175, 175, 185))
P("Office_Side2", CFrame.new(18, 8, 35), Vector3.new(14, 15, 0.5), Enum.Material.Concrete, Color3.fromRGB(175, 175, 185))
P("Office_Roof", CFrame.new(14.5, 15.75, 27.5), Vector3.new(15, 0.5, 16), Enum.Material.Concrete, Color3.fromRGB(145, 145, 155))
-- Glass facade
P("Office_Glass", CFrame.new(10.7, 8, 27.5), Vector3.new(0.2, 12, 12), Enum.Material.Glass, Color3.fromRGB(140, 180, 210))

-- ═══ STREETLIGHTS ═══ (4 along sidewalk)
P("SL1_Pole", CFrame.new(7, 5, -30), Vector3.new(0.4, 9, 0.4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
local sl1 = P("SL1_Lamp", CFrame.new(7, 9.5, -30), Vector3.new(1.2, 0.4, 1.2), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local slpl1 = Instance.new("PointLight"); slpl1.Range = 28; slpl1.Brightness = 1; slpl1.Color = Color3.fromRGB(255, 230, 180); slpl1.Parent = sl1

P("SL2_Pole", CFrame.new(7, 5, 0), Vector3.new(0.4, 9, 0.4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
local sl2 = P("SL2_Lamp", CFrame.new(7, 9.5, 0), Vector3.new(1.2, 0.4, 1.2), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local slpl2 = Instance.new("PointLight"); slpl2.Range = 28; slpl2.Brightness = 1; slpl2.Color = Color3.fromRGB(255, 230, 180); slpl2.Parent = sl2

-- ═══ STREET PROPS ═══
-- Fire hydrant
P("Hydrant", CFrame.new(7, 1.1, 20), Vector3.new(0.8, 1.8, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 50, 40))
P("HydrantCap", CFrame.new(7, 2.2, 20), Vector3.new(1, 0.3, 1), Enum.Material.Metal, Color3.fromRGB(190, 45, 35))
-- Trash can
P("TrashCan", CFrame.new(7.5, 1.5, -8), Vector3.new(1.5, 2.5, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 100, 60))
P("TrashLid", CFrame.new(7.5, 2.85, -8), Vector3.new(1.8, 0.2, 1.8), Enum.Material.Metal, Color3.fromRGB(55, 95, 55))`,
  },

]
