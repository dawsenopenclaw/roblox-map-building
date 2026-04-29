/**
 * style-bible.ts — THE definitive art direction for ForjeGames builds.
 *
 * Every build the AI generates references this. It defines what "good" looks like
 * in Roblox and ensures our output matches top games like Adopt Me, Pet Simulator,
 * Brookhaven, and professional asset packs.
 *
 * THE CORE PRINCIPLE: Stylized low-poly with bright saturated colors,
 * clean geometric shapes, and atmospheric lighting. NOT realistic,
 * NOT default grey, NOT flat/boring.
 */

// ═══ DEFAULT STYLE: What EVERY build should look like unless told otherwise ═══

export const DEFAULT_ART_DIRECTION = `
=== FORJE ART DIRECTION (MANDATORY FOR ALL BUILDS) ===

You are building for ROBLOX — a platform where the best games use STYLIZED LOW-POLY art.
Think Adopt Me, Pet Simulator, Brookhaven, Mega Mansion Tycoon. NOT default grey Studio blocks.

THE 10 COMMANDMENTS OF GOOD ROBLOX BUILDS:

1. BRIGHT SATURATED COLORS — never grey, never muddy, never dark unless horror theme
   Good: rgb(65,140,50) bright green, rgb(200,160,60) warm gold, rgb(80,160,220) sky blue
   Bad: rgb(163,162,165) default grey, rgb(100,100,100) dark grey, rgb(50,50,50) near-black

2. LIMITED COLOR PALETTE — 3-5 colors max per build, not a rainbow
   Pick a PRIMARY (60%), SECONDARY (30%), ACCENT (10%) scheme
   Example house: white walls (primary), brown wood trim (secondary), red door (accent)

3. CLEAN GEOMETRIC SHAPES — use Balls for organic (trees, bushes), Wedges for roofs/ramps
   Trees = Cylinder trunk + 3-5 Ball canopy spheres in varied greens
   Roofs = WedgeParts, NEVER flat Part on top of walls
   Columns = Cylinders, not stretched cubes

4. MATERIAL MIXING (modern low-poly style):
   - SmoothPlastic for CLEAN cartoon surfaces (primary material for stylized builds)
   - Concrete for FLAT matte surfaces (walls, floors, modern buildings)
   - Wood/WoodPlanks for warmth (trim, furniture, cabins)
   - Glass for windows (always Transparency 0.3-0.5)
   - Neon for glowing accents (signs, UI elements, sci-fi)
   - Brick for rustic/cozy builds only
   - Metal for industrial/modern accents only
   NEVER: default grey on any material. ALWAYS set explicit Color3.fromRGB.

5. SHADOW GAPS — leave 0.05-0.1 stud gaps between touching parts
   This creates natural shadow lines in Future lighting that make builds pop.
   Don't smash parts flush together — the gap IS the detail.

6. SIZE VARIATION — no two similar parts should be exactly the same size
   Trees: each canopy ball varies ±15% in diameter
   Windows: main windows are one size, accent windows slightly different
   Rocks: every rock is a different size and rotation

7. SLIGHT ROTATION on organic shapes — ±5-15 degrees random
   part.CFrame = CFrame.new(x,y,z) * CFrame.Angles(0, math.rad(math.random(-8,8)), math.rad(math.random(-3,3)))
   This breaks the "computer-generated grid" look instantly.

8. ATMOSPHERIC LIGHTING — Future technology + Atmosphere + Bloom
   EVERY build gets this automatically (injected by build-amplifier).
   But also add PointLights in interiors: warm white rgb(255,220,180), Brightness 1.5, Range 25.

9. DEPTH THROUGH LAYERING — every surface gets 2+ layers
   Walls get baseboards (thin strip at bottom) + crown molding (thin strip at top)
   Windows get frames (4 thin parts around glass)
   Doors get frames + handles + doormats
   Roofs get gutters (thin strip along edge)
   This is what separates 20-part builds from 80-part builds.

10. GROUND IT — every build needs context
    Outdoor: grass terrain + stone path + bushes + flowers
    Indoor: floor material change + area rugs + furniture
    No floating builds. No builds on bare baseplate.

=== END ART DIRECTION ===
`

// ═══ COLOR PALETTES for common build types ═══

export const COLOR_PALETTES = `
=== CURATED COLOR PALETTES (use these instead of picking random colors) ===

MODERN HOUSE:
  Walls: rgb(240,238,232) warm white | Trim: rgb(60,55,48) dark brown
  Roof: rgb(75,75,80) charcoal | Door: rgb(65,130,180) blue accent
  Windows: rgb(180,210,235) with T=0.35 | Foundation: rgb(160,155,148) warm grey

COZY CABIN:
  Walls: rgb(140,95,50) warm wood | Trim: rgb(90,60,28) dark wood
  Roof: rgb(120,70,35) brown | Stone base: rgb(150,145,135) natural stone
  Window frames: rgb(80,55,25) | Accent: rgb(180,40,35) red

MEDIEVAL CASTLE:
  Walls: rgb(170,165,155) warm stone | Towers: rgb(155,150,140) darker stone
  Roof: rgb(100,65,35) wood shingle | Doors: rgb(70,50,25) dark oak
  Banner: rgb(160,35,40) crimson | Trim: rgb(200,175,60) gold

JAPANESE/ZEN:
  Walls: rgb(230,220,200) paper | Wood: rgb(110,70,35) dark cedar
  Roof: rgb(55,55,60) dark tile | Stone: rgb(165,160,150) garden stone
  Accent: rgb(180,45,45) torii red | Bamboo: rgb(130,160,70) green

TROPICAL/BEACH:
  Sand: rgb(230,215,170) | Water: rgb(60,180,210) with T=0.4
  Palm trunk: rgb(150,120,70) | Leaves: rgb(50,140,50) bright green
  Building: rgb(240,235,220) white | Accent: rgb(230,130,50) coral

SCI-FI/FUTURISTIC:
  Primary: rgb(35,40,55) dark panel | Secondary: rgb(60,65,80) lighter panel
  Accent: rgb(0,200,255) neon cyan (Neon material) | Light: rgb(220,225,235) clean white
  Glass: rgb(150,200,230) with T=0.3 | Warning: rgb(255,180,40) neon orange

HORROR/DARK:
  Walls: rgb(60,55,50) dark | Wood: rgb(55,40,25) rotting
  Metal: rgb(80,75,70) corroded | Accent: rgb(140,30,30) blood red
  Fog: rgb(40,45,55) | Glass: rgb(120,130,140) dirty with T=0.4

CANDY/FUN:
  Primary: rgb(255,140,180) pink | Secondary: rgb(140,210,255) sky blue
  Accent: rgb(255,230,100) yellow | Green: rgb(130,220,130) mint
  Purple: rgb(180,140,230) lavender | White: rgb(250,248,245)

STEAMPUNK:
  Brass: rgb(185,150,70) | Copper: rgb(180,110,60)
  Dark metal: rgb(50,48,45) | Wood: rgb(100,65,30) aged
  Glass: rgb(160,190,140) green tint T=0.3 | Accent: rgb(220,200,40) gold

=== END PALETTES ===
`

// ═══ EXAMPLE BUILDS: What the AI should COPY as its quality target ═══

export const QUALITY_EXAMPLE_TREE = `
=== QUALITY TARGET: Stylized Low-Poly Tree (18 parts) ===
-- This is the MINIMUM quality level for a tree. Copy this style.
local m = Instance.new("Model") m.Name = "StylizedTree"
-- Grass patch at base (grounds the tree)
local grass = Instance.new("Part") grass.Shape = Enum.PartType.Cylinder grass.Name = "GrassPatch"
grass.Size = Vector3.new(0.3, 14, 14) grass.Anchored = true
grass.CFrame = CFrame.new(0, 0.15, 0) * CFrame.Angles(0, 0, math.rad(90))
grass.Material = Enum.Material.Grass grass.Color = Color3.fromRGB(65, 140, 50) grass.Parent = m
-- Shadow disc (subtle dark circle under tree)
local shadow = Instance.new("Part") shadow.Shape = Enum.PartType.Cylinder shadow.Name = "Shadow"
shadow.Size = Vector3.new(0.1, 12, 12) shadow.Anchored = true
shadow.CFrame = CFrame.new(0, 0.05, 0) * CFrame.Angles(0, 0, math.rad(90))
shadow.Material = Enum.Material.Grass shadow.Color = Color3.fromRGB(35, 80, 30) shadow.Parent = m
-- Chunky trunk (short and thick, NOT a tall thin pole)
local trunk = Instance.new("Part") trunk.Shape = Enum.PartType.Cylinder trunk.Name = "Trunk"
trunk.Size = Vector3.new(5, 3.5, 3.5) trunk.Anchored = true
trunk.CFrame = CFrame.new(0, 2.5, 0) * CFrame.Angles(0, 0, math.rad(90))
trunk.Material = Enum.Material.Wood trunk.Color = Color3.fromRGB(100, 67, 33) trunk.Parent = m
-- Canopy: 5 overlapping balls in VARIED greens (NOT a single ball)
local canopyColors = {
  Color3.fromRGB(50, 130, 45), Color3.fromRGB(60, 145, 50),
  Color3.fromRGB(45, 120, 40), Color3.fromRGB(55, 135, 48), Color3.fromRGB(65, 150, 55)
}
local canopyData = {
  {size=Vector3.new(10, 7, 10), pos=Vector3.new(0, 8, 0)},       -- center big
  {size=Vector3.new(7, 5, 7), pos=Vector3.new(3, 7, 2)},         -- right
  {size=Vector3.new(6, 5, 7), pos=Vector3.new(-3, 7.5, -1)},     -- left
  {size=Vector3.new(8, 5, 8), pos=Vector3.new(0, 10, 0)},        -- top
  {size=Vector3.new(5, 4, 6), pos=Vector3.new(1, 6.5, -3)},      -- front low
}
for i, data in ipairs(canopyData) do
  local leaf = Instance.new("Part") leaf.Shape = Enum.PartType.Ball
  leaf.Name = "Canopy_"..i leaf.Anchored = true
  leaf.Size = data.size leaf.CFrame = CFrame.new(data.pos) * CFrame.Angles(0, math.rad(i*72), 0)
  leaf.Material = Enum.Material.SmoothPlastic leaf.Color = canopyColors[i]
  leaf.Parent = m
end
-- Small rocks at base for detail
for i = 1, 3 do
  local rock = Instance.new("Part") rock.Shape = Enum.PartType.Ball rock.Name = "Rock_"..i
  rock.Anchored = true
  local sz = 0.8 + math.random() * 0.6
  rock.Size = Vector3.new(sz, sz * 0.7, sz * 0.9)
  rock.CFrame = CFrame.new(math.random(-4, 4), sz * 0.3, math.random(-4, 4))
    * CFrame.Angles(0, math.rad(math.random(360)), math.rad(math.random(-10, 10)))
  rock.Material = Enum.Material.Slate rock.Color = Color3.fromRGB(140 + math.random(-10,10), 135 + math.random(-10,10), 125 + math.random(-10,10))
  rock.Parent = m
end
=== END QUALITY TARGET ===
`

export const QUALITY_EXAMPLE_HOUSE = `
=== QUALITY TARGET: Stylized House (80+ parts) ===
-- A PROPER house uses FOR LOOPS for efficiency. Key patterns:

-- Foundation: layered concrete base
for i = 0, 1 do
  P("Foundation_"..i, CFrame.new(sp.X, gy + 0.15 + i*0.3, sp.Z),
    Vector3.new(26 - i*0.5, 0.3, 18 - i*0.3), "Concrete", Color3.fromRGB(160, 155, 148))
end

-- Walls with corner posts (NOT 4 flat rectangles)
-- Front wall
P("FrontWall", CFrame.new(sp.X, gy+5, sp.Z-8.5), Vector3.new(24, 9, 0.8), "Concrete", Color3.fromRGB(240, 238, 232))
-- Add corner posts for depth
for _, xOff in ipairs({-12, 12}) do
  P("CornerPost", CFrame.new(sp.X+xOff, gy+5, sp.Z-8.5), Vector3.new(1, 9.2, 1), "Concrete", Color3.fromRGB(225, 222, 215))
end

-- Windows with FRAMES (4 parts per window, not just glass)
for i = 0, 2 do
  local wx = sp.X - 8 + i * 8
  P("Window_"..i, CFrame.new(wx, gy+5.5, sp.Z-8.9), Vector3.new(3, 3.5, 0.1), "Glass", Color3.fromRGB(180, 210, 235))
  -- Frame parts (top, bottom, left, right)
  P("WinFrame_T"..i, CFrame.new(wx, gy+7.35, sp.Z-8.85), Vector3.new(3.4, 0.2, 0.15), "Wood", Color3.fromRGB(60, 55, 48))
  P("WinFrame_B"..i, CFrame.new(wx, gy+3.65, sp.Z-8.85), Vector3.new(3.4, 0.2, 0.15), "Wood", Color3.fromRGB(60, 55, 48))
  P("WinFrame_L"..i, CFrame.new(wx-1.6, gy+5.5, sp.Z-8.85), Vector3.new(0.2, 3.5, 0.15), "Wood", Color3.fromRGB(60, 55, 48))
  P("WinFrame_R"..i, CFrame.new(wx+1.6, gy+5.5, sp.Z-8.85), Vector3.new(0.2, 3.5, 0.15), "Wood", Color3.fromRGB(60, 55, 48))
  -- Window sill
  P("Sill_"..i, CFrame.new(wx, gy+3.55, sp.Z-9.1), Vector3.new(3.6, 0.15, 0.5), "Wood", Color3.fromRGB(60, 55, 48))
end

-- Roof with WedgeParts (NOT a flat Part)
W("RoofL", CFrame.new(sp.X-6.5, gy+11, sp.Z), Vector3.new(13, 3, 18.5), "Slate", Color3.fromRGB(75, 75, 80))
W("RoofR", CFrame.new(sp.X+6.5, gy+11, sp.Z) * CFrame.Angles(0,0,math.rad(180)), Vector3.new(13, 3, 18.5), "Slate", Color3.fromRGB(75, 75, 80))

-- Trim: baseboards along EVERY wall bottom
P("Baseboard_F", CFrame.new(sp.X, gy+0.5, sp.Z-8.9), Vector3.new(24.2, 0.4, 0.15), "Wood", Color3.fromRGB(60, 55, 48))

-- Door with frame + handle + doormat
P("Door", CFrame.new(sp.X, gy+4, sp.Z-8.9), Vector3.new(2.5, 6.5, 0.15), "Wood", Color3.fromRGB(65, 130, 180))
P("DoorFrame_T", CFrame.new(sp.X, gy+7.35, sp.Z-8.85), Vector3.new(3, 0.3, 0.2), "Wood", Color3.fromRGB(55, 50, 42))
P("DoorHandle", CFrame.new(sp.X+0.9, gy+4, sp.Z-9.05), Vector3.new(0.15, 0.15, 0.15), "Metal", Color3.fromRGB(200, 195, 185))
P("Doormat", CFrame.new(sp.X, gy+0.35, sp.Z-9.8), Vector3.new(3, 0.08, 1.5), "Fabric", Color3.fromRGB(100, 85, 65))

-- Landscaping: bushes, path, flowers
for i = 1, 4 do
  local bx = sp.X + (i-2.5) * 5
  Ball("Bush_"..i, CFrame.new(bx, gy+1, sp.Z-10) * CFrame.Angles(0, math.rad(i*40), 0),
    Vector3.new(2.5 + math.random()*1, 2 + math.random()*0.5, 2.5 + math.random()*1),
    "SmoothPlastic", Color3.fromRGB(50 + i*5, 120 + math.random(20), 40 + i*3))
end

-- Interior PointLight (warm)
local light = Instance.new("PointLight")
light.Color = Color3.fromRGB(255, 220, 180) light.Brightness = 1.5 light.Range = 25
-- Parent to ceiling part

=== This is 80+ parts with loops. COPY THIS QUALITY LEVEL. ===
`

// ═══ WHAT MAKES A BUILD "BAD" vs "GOOD" ═══

export const GOOD_VS_BAD = `
=== GOOD vs BAD BUILDS (learn the difference) ===

BAD TREE (what we NEVER want):
  - 1 brown cylinder + 1 green ball = 2 parts, looks like a lollipop
  - Default grey or dark muddy colors
  - Sitting on bare baseplate with no ground detail
  - All parts perfectly aligned on grid

GOOD TREE (what we ALWAYS produce):
  - Chunky short trunk (not a thin pole) + 3-5 overlapping canopy balls in varied greens
  - Grass patch + shadow disc at base
  - Small rocks scattered around
  - Slight rotation on organic parts for natural feel
  - Bright saturated greens, warm brown trunk

BAD HOUSE:
  - 4 grey walls + 1 flat roof = 5 parts, looks like a box
  - No windows, or windows are just colored rectangles on walls
  - No door detail, no trim, no foundation
  - Floating on baseplate

GOOD HOUSE:
  - Layered foundation + walls with corner posts + window FRAMES + door with handle
  - Wedge roof (not flat) with gutters + chimney
  - Baseboards + crown molding on every wall
  - Front porch with posts + railing
  - Landscaping: bushes, path, flowers, mailbox
  - Interior: furniture, lights, rugs
  - 80-200+ parts using FOR LOOPS for repeated elements

BAD GUI:
  - White frames with black text, no rounding, no effects
  - Buttons that don't respond to hover/click
  - No animations, no sound effects

GOOD GUI:
  - Dark background (#1a1a2e) with gold accents (#D4AF37)
  - UICorner (8px) on everything + UIStroke (1px, subtle)
  - Hover: slight scale up + color shift via TweenService
  - Click: bounce animation + click sound
  - Open/close: slide + fade via TweenService
  - UIGradient for depth on headers

=== END GOOD vs BAD ===
`
