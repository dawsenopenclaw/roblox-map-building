/**
 * style-bible.ts — THE definitive art direction for ForjeGames builds.
 *
 * Every build the AI generates references this. It defines what "good" looks like.
 *
 * REALITY CHECK: Top Roblox games (Adopt Me, Pet Sim) use imported Blender meshes.
 * We build with Instance.new("Part") — boxes, cylinders, balls, wedges.
 * Our goal: the BEST possible Part-based builds. Clean, colorful, stylized.
 * Think cartoon/toy aesthetic — chunky proportions, bright colors, clean geometry.
 * NOT trying to replicate mesh-quality — embrace the blocky Part style and make it GOOD.
 */

// ═══ DEFAULT STYLE: What EVERY build should look like unless told otherwise ═══

export const DEFAULT_ART_DIRECTION = `
=== FORJE ART DIRECTION (MANDATORY FOR ALL BUILDS) ===

You build with Instance.new("Part") — Box, Ball, Cylinder, Wedge shapes only.
You CANNOT import meshes from Blender. Work WITH the blocky Part style, not against it.
The goal: TOY-LIKE, CHUNKY, COLORFUL builds. Think cartoon/toy aesthetic.
Embrace simple geometric shapes but make them LOOK GOOD through color, proportion, and detail.

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
=== QUALITY TARGET: Part-Based Stylized Tree (25+ parts) ===
-- Best achievable with Instance.new("Part"). Chunky, colorful, toy-like.
-- KEY: short thick trunk, visible branch arms, MANY overlapping canopy balls,
-- each slightly different size/color/rotation. Ground context (grass, rocks).

-- TRUNK: short and THICK — ratio 1:2 (width:height), NOT a thin pole
-- Use 2-3 cylinder segments slightly offset for organic shape
Cyl("Trunk_Base", CFrame.new(0,1.5,0), Vector3.new(4, 3, 4), "Wood", Color3.fromRGB(105,72,38))
Cyl("Trunk_Mid", CFrame.new(0.3,4,0.2), Vector3.new(3, 2.5, 3), "Wood", Color3.fromRGB(95,65,33))
-- BRANCH ARMS: 2-3 thick cylinders angled outward (visible, not hidden by canopy)
Cyl("Branch_L", CFrame.new(-2.5,5.5,0)*CFrame.Angles(0,0,math.rad(35)), Vector3.new(1.5, 4, 1.5), "Wood", Color3.fromRGB(90,60,30))
Cyl("Branch_R", CFrame.new(2,6,1)*CFrame.Angles(0,0,math.rad(-30)), Vector3.new(1.2, 3.5, 1.2), "Wood", Color3.fromRGB(98,67,35))
-- ROOT BUMPS: 3 wedge/ball shapes at trunk base
Ball("Root1", CFrame.new(1.5,0.5,1), Vector3.new(2,1.2,1.5), "Wood", Color3.fromRGB(85,58,28))
Ball("Root2", CFrame.new(-1.2,0.4,-0.8), Vector3.new(1.8,1,1.3), "Wood", Color3.fromRGB(88,60,30))

-- CANOPY: 7-10 overlapping balls, VARIED sizes (biggest 10-12 studs, smallest 4-5)
-- Each gets a DIFFERENT green — spread across hue range, not one flat color
-- Flatten Y slightly (size Y = size X * 0.7) for puffy cloud shape, not perfect sphere
for i, d in ipairs({
  {s=Vector3.new(11,7,10), p=Vector3.new(0,9,0), c=Color3.fromRGB(55,140,48)},
  {s=Vector3.new(8,5.5,8), p=Vector3.new(4,8,2), c=Color3.fromRGB(65,155,52)},
  {s=Vector3.new(7,5,8), p=Vector3.new(-4,8.5,-1), c=Color3.fromRGB(48,125,42)},
  {s=Vector3.new(9,6,9), p=Vector3.new(0,11.5,0), c=Color3.fromRGB(58,145,50)},
  {s=Vector3.new(6,4,6), p=Vector3.new(2,7,-3), c=Color3.fromRGB(70,160,55)},
  {s=Vector3.new(5,3.5,5.5), p=Vector3.new(-3,10,2), c=Color3.fromRGB(52,135,45)},
  {s=Vector3.new(4,3,4.5), p=Vector3.new(3,11,1), c=Color3.fromRGB(62,150,50)},
}) do
  Ball("Leaf_"..i, CFrame.new(d.p)*CFrame.Angles(0,math.rad(i*51),0), d.s, "SmoothPlastic", d.c)
end

-- GROUND: grass disc + darker shadow disc + 2-3 rocks + small flower clusters
Cyl("GrassPatch", CFrame.new(0,0.15,0)*CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3,16,16), "Grass", Color3.fromRGB(65,135,48))
Cyl("Shadow", CFrame.new(0,0.05,0)*CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.08,13,13), "Grass", Color3.fromRGB(40,85,30))
for i = 1, 3 do
  Ball("Rock_"..i, CFrame.new((i-2)*3.5, 0.4, math.random(-3,3))*CFrame.Angles(0,math.rad(i*120),math.rad(math.random(-8,8))),
    Vector3.new(1+math.random()*0.8, 0.7+math.random()*0.4, 0.9+math.random()*0.6), "Slate",
    Color3.fromRGB(135+math.random(-12,12), 130+math.random(-12,12), 120+math.random(-12,12)))
end

-- WHAT MAKES THIS GOOD:
-- 1. Trunk is SHORT and THICK (not a telephone pole)
-- 2. Visible branch arms break the silhouette
-- 3. 7 canopy balls in VARIED greens (not 1 flat green ball)
-- 4. Each ball is slightly FLAT (Y < X) for puffy cloud look
-- 5. Slight rotation on each ball prevents grid-perfect look
-- 6. Ground context: grass patch + shadow + rocks
-- 7. Root bumps add character at the base
-- Total: ~25 parts from compact loop code

-- WHAT A BAD TREE LOOKS LIKE:
-- 1 thin brown cylinder + 1 green ball = lollipop. NEVER do this.
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
