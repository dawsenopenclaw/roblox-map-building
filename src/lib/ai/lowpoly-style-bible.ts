// lowpoly-style-bible.ts — Modern Roblox low-poly style guide with color depth
// THE definitive style reference for how ALL builds should look by default.

export const LOWPOLY_STYLE_GUIDE: string = `
=== MODERN LOW-POLY ROBLOX STYLE GUIDE ===
This is the MANDATORY default style. All builds must follow this unless the user
specifically asks for realistic/medieval/gritty style.

--- THE LOOK ---
Clean smooth geometry. Vibrant warm colors. Simple shapes with charm.
Think: Adopt Me, Pet Simulator X, Blox Fruits, Islands, MeepCity.
NOT: gray cobblestone slabs, dark muddy textures, 2016 default Roblox.

--- MATERIAL RULES ---
DEFAULT: Enum.Material.SmoothPlastic for 90% of parts.
  - Walls, floors, roofs, furniture, props, vehicles — all SmoothPlastic.
  - Gives the clean, smooth, modern game look.
ACCENT only: Use textured materials sparingly for detail contrast:
  - Wood grain on a door (1 part out of 40, not all walls)
  - Brick on a fireplace (not the whole house)
  - Cobblestone on a path (not the floor of every room)
  - Metal on a handle or pipe (small accent)
  - Glass for windows (always with Transparency 0.3-0.5)
  - Neon for glowing elements (signs, crystals, effects)
NEVER default to Concrete, Granite, Cobblestone for main surfaces.

--- COLOR DEPTH (CRITICAL) ---
Real games use 3-5 shades of each base color, NOT one flat color.
Use vc() helper to add random variation, PLUS intentional shade variety:

GREENS (nature):
  Bright grass: RGB(80, 190, 70)
  Tree canopy 1: RGB(65, 170, 55)
  Tree canopy 2: RGB(90, 195, 75)
  Tree canopy 3: RGB(55, 155, 50)
  Dark bush: RGB(45, 130, 40)
  Mossy accent: RGB(100, 180, 90)

BROWNS (wood/earth):
  Warm trunk: RGB(140, 100, 55)
  Dark wood: RGB(110, 75, 40)
  Light wood: RGB(170, 130, 75)
  Path/dirt: RGB(180, 140, 90)
  Bark accent: RGB(95, 65, 30)

BLUES (water/sky):
  Sky blue: RGB(100, 180, 235)
  Water surface: RGB(60, 155, 215)
  Deep water: RGB(40, 110, 180)
  Shallow: RGB(90, 190, 220)
  Ice accent: RGB(170, 220, 245)

WARM ACCENTS:
  Orange: RGB(235, 165, 60)
  Coral/pink: RGB(235, 130, 170)
  Red: RGB(225, 75, 75)
  Gold/yellow: RGB(245, 210, 70)
  Purple: RGB(160, 100, 200)

NEUTRALS:
  Warm white: RGB(245, 240, 230)
  Cream: RGB(240, 230, 210)
  Light stone: RGB(195, 190, 180)
  Warm gray: RGB(165, 160, 155)
  Dark accent: RGB(80, 70, 65)

RULE: Every scene needs at least 12 distinct RGB values.
RULE: Vary the SAME object type with 2-3 shades (trees not all one green).
RULE: No RGB value below 40 unless intentional shadow (mushroom cap, cave).
RULE: Warm whites RGB(245,240,230) not cold whites RGB(255,255,255).
`

export const LOWPOLY_OBJECTS: string = `
=== LOW-POLY OBJECT RECIPES ===
Every object listed with exact part construction for modern Roblox style.

--- TREES (4 variants, mix them in scenes) ---

Pine tree (5 parts):
  trunk: Cylinder Size(4,1.2,1.2), SmoothPlastic, RGB(120,85,45), rotated 90 on Z
  layer1: WedgePart or Ball Size(6,4,6) at Y=5, SmoothPlastic, RGB(55,160,50)
  layer2: Ball Size(5,3.5,5) at Y=7.5, SmoothPlastic, RGB(60,170,55)
  layer3: Ball Size(3.5,3,3.5) at Y=9.5, SmoothPlastic, RGB(50,150,45)
  top: WedgePart Size(1,2,1) at Y=11, SmoothPlastic, RGB(65,175,55)

Round tree (4 parts):
  trunk: Cylinder Size(5,1.5,1.5), SmoothPlastic, RGB(140,100,55), rotated 90 on Z
  canopy1: Ball Size(8,7,8) at Y=7, SmoothPlastic, RGB(80,185,70)
  canopy2: Ball Size(6,5,6) at Y=9, SmoothPlastic, RGB(70,175,60)
  canopy3: Ball Size(5,4.5,5) at Y=6, offset X+2, SmoothPlastic, RGB(90,195,75)

Palm tree (6 parts):
  trunk: Cylinder Size(8,1,1), SmoothPlastic, RGB(155,115,65), slight angle
  top ring: Cylinder Size(0.5,2,2) at trunk top, SmoothPlastic, RGB(140,100,50)
  leaf1-4: Part Size(0.2,1,5) angled outward at 90-degree intervals, SmoothPlastic, RGB(60,170,50)
  coconut: Ball Size(0.6,0.6,0.6), SmoothPlastic, RGB(110,80,40)

Stump (3 parts):
  base: Cylinder Size(1.5,2.5,2.5), SmoothPlastic, RGB(120,85,45), rotated 90 Z
  rings: Cylinder Size(0.1,2.2,2.2) on top face, SmoothPlastic, RGB(160,130,80)
  mushroom: Ball Size(0.5,0.3,0.5) on side, SmoothPlastic, RGB(220,60,50)

--- ROCKS (3 variants) ---
Large rock: Ball Size(5,3.5,4), SmoothPlastic, RGB(160,155,148)
Medium rock: Ball Size(3,2.2,2.8), SmoothPlastic, RGB(150,145,138)
Small rock: Ball Size(1.5,1,1.3), SmoothPlastic, RGB(170,165,158)
Rock cluster: 3-5 rocks overlapping slightly, each a slightly different gray shade.

--- FLOWERS (5 types, scatter in groups of 3-5) ---
Tulip: Cylinder stem Size(1.5,0.1,0.1) RGB(50,140,40) + Ball head Size(0.5,0.6,0.5) RGB(235,70,90)
Daisy: Cylinder stem + flat Cylinder disc Size(0.15,0.6,0.6) RGB(245,240,230) + Ball center RGB(245,210,70)
Mushroom: Cylinder stem Size(0.6,0.3,0.3) RGB(240,235,220) + Ball cap Size(0.8,0.5,0.8) RGB(220,55,45)
Bush: 2-3 overlapping Balls Size(2-3) in greens RGB(55-80, 140-170, 40-60)
Lily pad: flat Cylinder Size(0.1,1.5,1.5) RGB(50,150,50) on water surface

--- TERRAIN FEATURES ---
Path: Parts 0.15 thick, SmoothPlastic, RGB(180,145,95), laid in connected segments with slight curve
Bridge: flat Part top + 2 side rails + 4 support posts, SmoothPlastic, RGB(140,100,55)
Fence: posts every 6 studs (Cylinder 0.3x3x0.3) + 2 horizontal rails (Part 6x0.2x0.15)
  Color: warm brown RGB(130,90,45)
Pond: flat Cylinder on ground, SmoothPlastic, RGB(60,155,215), Transparency 0.2
  Add 2-3 lily pads on surface + 1-2 small rocks at edge
Waterfall: 3-4 overlapping Parts angled downward, SmoothPlastic, RGB(150,210,240), Transparency 0.3
  Add ParticleEmitter for mist at base

--- STRUCTURES ---
Wooden crate: 6 face Parts + 2 cross strips per face, SmoothPlastic, RGB(180,140,80)
Barrel: Cylinder + 2 band rings, SmoothPlastic, RGB(130,90,45) barrel + RGB(90,85,80) bands
Lantern: small cube base + Glass sides + Neon inside + PointLight Range=12
  Base: SmoothPlastic RGB(50,45,40), Glass RGB(245,220,150) Transparency 0.4
Campfire: 4-5 log cylinders crossed + Neon flame part + PointLight warm
  Logs: SmoothPlastic RGB(100,70,35), Flame: Neon RGB(255,150,40)
Sign post: Cylinder pole + flat Part sign, SmoothPlastic
  Pole: RGB(130,90,45), Sign: RGB(180,140,80), text via SurfaceGui
Bench: 2 side supports + 3 seat slats + 2 back slats, SmoothPlastic, RGB(140,100,55)
Wagon wheel: 8 spoke Parts + outer ring, SmoothPlastic, RGB(110,80,40)

--- BUILDINGS (low-poly style) ---
Cottage: SmoothPlastic walls RGB(245,235,215) + SmoothPlastic roof (angled WedgeParts)
  RGB(180,100,60) warm orange-brown roof
  Door: SmoothPlastic RGB(140,100,55) with contrasting frame
  Windows: Glass + colored frame (match roof color)
  Chimney: SmoothPlastic warm gray + Neon fire inside
  Flower boxes under windows: small Parts with Ball flowers

Shop: SmoothPlastic walls in pastel color + flat roof with awning
  Awning: angled Part in accent color (red, blue, green)
  Sign: Part with SurfaceGui or contrasting color
  Display window: Glass with frame
  Small details: door handle, window frame, trim

--- ITEMS / COLLECTIBLES ---
Coin: Cylinder Size(0.15,1,1), SmoothPlastic RGB(245,210,70)
  Add a sparkle: ParticleEmitter Rate=3, yellow
Gem: WedgePart + inverted WedgePart forming diamond, SmoothPlastic
  Blue: RGB(70,140,230), Red: RGB(220,60,60), Green: RGB(60,200,80), Purple: RGB(160,80,210)
  Add Neon inner glow part + PointLight
Star: 5 thin WedgeParts arranged in star pattern, SmoothPlastic RGB(245,220,80)
Key: flat Part body + Ball head, SmoothPlastic RGB(210,180,60) (gold)
Chest: box body + rounded lid (half cylinder), SmoothPlastic RGB(140,100,55) + Metal bands RGB(90,85,75)
Potion bottle: Cylinder body + Ball stopper, Glass RGB(various) Transparency 0.3
`

export const LOWPOLY_MAP_EXAMPLE: string = `
=== FULL LOW-POLY MAP GENERATION (100+ parts) ===
When user asks for a "map", "world", "scene", "environment", "forest", "island",
generate a FULL SCENE with terrain + scattered objects using for loops.

EXAMPLE: "Build me a low-poly forest scene"

-- Helper: create tree at position with slight random variation
local function makeTree(x, z, treeType)
  local trunk = Instance.new("Part")
  trunk.Shape = Enum.PartType.Cylinder
  trunk.Size = Vector3.new(math.random(4,6), math.random(10,15)/10, math.random(10,15)/10)
  trunk.CFrame = CFrame.new(x, trunk.Size.X/2, z) * CFrame.Angles(0, 0, math.rad(90))
  trunk.Material = Enum.Material.SmoothPlastic
  trunk.Color = Color3.fromRGB(130+math.random(-15,15), 90+math.random(-10,10), 45+math.random(-10,10))
  trunk.Anchored = true
  trunk.Parent = m

  if treeType == 1 then -- round tree
    for i = 1, 3 do
      local c = Instance.new("Part")
      c.Shape = Enum.PartType.Ball
      local s = 8 - i * 1.5
      c.Size = Vector3.new(s+math.random(-5,5)/10, s-1+math.random(-5,5)/10, s+math.random(-5,5)/10)
      c.CFrame = CFrame.new(x+math.random(-10,10)/10, trunk.Size.X+i*2, z+math.random(-10,10)/10)
      c.Material = Enum.Material.SmoothPlastic
      c.Color = Color3.fromRGB(65+math.random(-15,20), 165+math.random(-15,20), 55+math.random(-10,15))
      c.Anchored = true
      c.Parent = m
    end
  else -- pine tree
    for i = 1, 3 do
      local c = Instance.new("Part")
      c.Shape = Enum.PartType.Ball
      local s = 7 - i * 1.8
      c.Size = Vector3.new(s, s*0.7, s)
      c.CFrame = CFrame.new(x, trunk.Size.X+1+i*2.5, z)
      c.Material = Enum.Material.SmoothPlastic
      c.Color = Color3.fromRGB(50+math.random(-10,15), 150+math.random(-15,20), 42+math.random(-8,12))
      c.Anchored = true
      c.Parent = m
    end
  end
end

-- Helper: rock cluster
local function makeRocks(x, z, count)
  for i = 1, count do
    local r = Instance.new("Part")
    r.Shape = Enum.PartType.Ball
    local s = math.random(10,35)/10
    r.Size = Vector3.new(s, s*0.7, s*0.9)
    r.CFrame = CFrame.new(x+math.random(-20,20)/10, s*0.35, z+math.random(-20,20)/10)
    r.Material = Enum.Material.SmoothPlastic
    r.Color = Color3.fromRGB(150+math.random(-15,15), 145+math.random(-15,15), 138+math.random(-15,15))
    r.Anchored = true
    r.Parent = m
  end
end

-- Helper: flower
local function makeFlower(x, z, color)
  local stem = Instance.new("Part")
  stem.Size = Vector3.new(0.1, 1+math.random(0,5)/10, 0.1)
  stem.CFrame = CFrame.new(x, stem.Size.Y/2, z)
  stem.Material = Enum.Material.SmoothPlastic
  stem.Color = Color3.fromRGB(55, 145, 45)
  stem.Anchored = true
  stem.Parent = m

  local head = Instance.new("Part")
  head.Shape = Enum.PartType.Ball
  head.Size = Vector3.new(0.5, 0.4, 0.5)
  head.CFrame = CFrame.new(x, stem.Size.Y+0.2, z)
  head.Material = Enum.Material.SmoothPlastic
  head.Color = color
  head.Anchored = true
  head.Parent = m
end

-- GROUND PLANE (large green base)
local ground = Instance.new("Part")
ground.Size = Vector3.new(200, 0.5, 200)
ground.CFrame = CFrame.new(0, -0.25, 0)
ground.Material = Enum.Material.SmoothPlastic
ground.Color = Color3.fromRGB(75, 175, 65)
ground.Anchored = true
ground.Parent = m

-- DIRT PATH (winding through scene)
for i = 0, 15 do
  local path = Instance.new("Part")
  path.Size = Vector3.new(6+math.random(-10,10)/10, 0.15, 8)
  local curve = math.sin(i * 0.4) * 15
  path.CFrame = CFrame.new(curve, 0.1, -70 + i * 10) * CFrame.Angles(0, math.sin(i*0.3)*0.15, 0)
  path.Material = Enum.Material.SmoothPlastic
  path.Color = Color3.fromRGB(175+math.random(-10,10), 138+math.random(-8,8), 88+math.random(-8,8))
  path.Anchored = true
  path.Parent = m
end

-- SCATTER TREES (30 trees across the map)
for i = 1, 30 do
  local x = math.random(-80, 80)
  local z = math.random(-80, 80)
  -- Avoid placing on path
  if math.abs(x - math.sin(z*0.04)*15) > 8 then
    makeTree(x, z, math.random(1,2))
  end
end

-- ROCK CLUSTERS (8 clusters of 2-4 rocks)
for i = 1, 8 do
  makeRocks(math.random(-70,70), math.random(-70,70), math.random(2,4))
end

-- FLOWERS (scattered groups)
local flowerColors = {
  Color3.fromRGB(235, 70, 90),   -- red
  Color3.fromRGB(245, 210, 70),  -- yellow
  Color3.fromRGB(235, 130, 170), -- pink
  Color3.fromRGB(170, 120, 220), -- purple
  Color3.fromRGB(240, 240, 235), -- white
}
for i = 1, 25 do
  local x = math.random(-75, 75)
  local z = math.random(-75, 75)
  makeFlower(x, z, flowerColors[math.random(1, #flowerColors)])
end

-- POND with lily pads
local pond = Instance.new("Part")
pond.Shape = Enum.PartType.Cylinder
pond.Size = Vector3.new(0.3, 15, 15)
pond.CFrame = CFrame.new(25, 0.05, 20) * CFrame.Angles(0, 0, math.rad(90))
pond.Material = Enum.Material.SmoothPlastic
pond.Color = Color3.fromRGB(60, 155, 215)
pond.Transparency = 0.15
pond.Anchored = true
pond.Parent = m

for i = 1, 4 do
  local lily = Instance.new("Part")
  lily.Shape = Enum.PartType.Cylinder
  lily.Size = Vector3.new(0.1, 1.2, 1.2)
  lily.CFrame = CFrame.new(25+math.random(-5,5), 0.2, 20+math.random(-5,5)) * CFrame.Angles(0, 0, math.rad(90))
  lily.Material = Enum.Material.SmoothPlastic
  lily.Color = Color3.fromRGB(50+math.random(-8,8), 150+math.random(-10,10), 48+math.random(-8,8))
  lily.Anchored = true
  lily.Parent = m
end

-- FENCE along one side
for i = 0, 8 do
  local post = Instance.new("Part")
  post.Shape = Enum.PartType.Cylinder
  post.Size = Vector3.new(3, 0.3, 0.3)
  post.CFrame = CFrame.new(-85, 1.5, -60+i*8) * CFrame.Angles(0, 0, math.rad(90))
  post.Material = Enum.Material.SmoothPlastic
  post.Color = Color3.fromRGB(130, 90, 45)
  post.Anchored = true
  post.Parent = m

  if i < 8 then
    for r = 1, 2 do
      local rail = Instance.new("Part")
      rail.Size = Vector3.new(0.15, 0.15, 8)
      rail.CFrame = CFrame.new(-85, r*1.2, -56+i*8)
      rail.Material = Enum.Material.SmoothPlastic
      rail.Color = Color3.fromRGB(125, 85, 42)
      rail.Anchored = true
      rail.Parent = m
    end
  end
end

-- BRIDGE over a stream
local bridgeFloor = Instance.new("Part")
bridgeFloor.Size = Vector3.new(6, 0.3, 10)
bridgeFloor.CFrame = CFrame.new(-30, 0.5, 0)
bridgeFloor.Material = Enum.Material.SmoothPlastic
bridgeFloor.Color = Color3.fromRGB(140, 100, 55)
bridgeFloor.Anchored = true
bridgeFloor.Parent = m

-- Bridge rails
for side = -1, 1, 2 do
  local rail = Instance.new("Part")
  rail.Size = Vector3.new(0.2, 1.5, 10)
  rail.CFrame = CFrame.new(-30 + side*2.8, 1.3, 0)
  rail.Material = Enum.Material.SmoothPlastic
  rail.Color = Color3.fromRGB(130, 90, 45)
  rail.Anchored = true
  rail.Parent = m
end

-- CAMPFIRE (center clearing)
local fireBase = Instance.new("Part")
fireBase.Shape = Enum.PartType.Cylinder
fireBase.Size = Vector3.new(0.3, 3, 3)
fireBase.CFrame = CFrame.new(0, 0.15, 0) * CFrame.Angles(0, 0, math.rad(90))
fireBase.Material = Enum.Material.SmoothPlastic
fireBase.Color = Color3.fromRGB(110, 105, 98)
fireBase.Anchored = true
fireBase.Parent = m

for i = 1, 4 do
  local log = Instance.new("Part")
  log.Shape = Enum.PartType.Cylinder
  log.Size = Vector3.new(3, 0.4, 0.4)
  log.CFrame = CFrame.new(0, 0.3, 0) * CFrame.Angles(0, math.rad(i*45), math.rad(15))
  log.Material = Enum.Material.SmoothPlastic
  log.Color = Color3.fromRGB(100+math.random(-10,10), 70+math.random(-8,8), 35+math.random(-5,5))
  log.Anchored = true
  log.Parent = m
end

local flame = Instance.new("Part")
flame.Shape = Enum.PartType.Ball
flame.Size = Vector3.new(1.5, 2, 1.5)
flame.CFrame = CFrame.new(0, 1.2, 0)
flame.Material = Enum.Material.Neon
flame.Color = Color3.fromRGB(255, 160, 40)
flame.Anchored = true
flame.Parent = m

local fireLight = Instance.new("PointLight")
fireLight.Range = 25
fireLight.Brightness = 1.5
fireLight.Color = Color3.fromRGB(255, 180, 80)
fireLight.Parent = flame

-- LIGHTING for the scene
local lighting = game:GetService("Lighting")
lighting.ClockTime = 14.5
lighting.Brightness = 2
lighting.Ambient = Color3.fromRGB(140, 150, 160)
lighting.OutdoorAmbient = Color3.fromRGB(140, 150, 160)

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.3
atmo.Offset = 0.25
atmo.Color = Color3.fromRGB(200, 220, 240)
atmo.Decay = Color3.fromRGB(180, 200, 230)
atmo.Glare = 0
atmo.Haze = 1
atmo.Parent = lighting

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.3
bloom.Size = 24
bloom.Threshold = 2
bloom.Parent = lighting

RESULT: 150+ parts — 30 trees (90+ parts), 8 rock clusters (24+ parts),
25 flowers (50 parts), path (16 parts), pond + lilies, fence, bridge,
campfire, all with lighting. THIS is the bar for "build me a scene".

KEY TECHNIQUES:
1. Helper functions (makeTree, makeRock, makeFlower) for reusable objects
2. math.random() for natural variation in size, position, color
3. Color variation on EVERY object: trunk color varies +-15 RGB per tree
4. Multiple tree types (round vs pine) scattered randomly
5. Avoid overlap with path using distance check
6. Scene tells a STORY: path leads through forest, past pond, over bridge, to campfire
7. Lighting + Atmosphere + Bloom for polish
8. 200x200 stud ground plane (big enough to feel like a world)
`

export const LOWPOLY_COLOR_DEPTH: string = `
=== COLOR DEPTH TECHNIQUES ===

--- RULE 1: NEVER USE FLAT COLORS ---
Wrong: every tree canopy is RGB(60,160,50)
Right: tree canopies vary between RGB(55,150,45), RGB(70,175,60), RGB(80,190,70), RGB(50,140,42)
Use math.random(-15, 15) added to each RGB channel for natural variation.

--- RULE 2: WARM SHADOWS, COOL HIGHLIGHTS ---
Bottom/shadow areas: slightly warmer (add +10 to red, -5 from blue)
Top/lit areas: slightly cooler (add +5 to blue)
This creates visual depth even on flat SmoothPlastic surfaces.

--- RULE 3: COMPLEMENTARY ACCENTS ---
Green scene? Add orange/red accents: mushroom caps, flowers, berries
Blue scene? Add yellow/gold accents: coins, stars, lantern light
Brown scene? Add green/teal accents: moss, vines, emeralds
Every scene needs a POP of contrasting color (10% of palette).

--- RULE 4: GROUND IS NOT ONE COLOR ---
Base ground: RGB(75, 175, 65)
Under trees: slightly darker RGB(60, 150, 50) (shadow simulation)
Near paths: slightly browner RGB(90, 155, 60) (worn edges)
Near water: slightly bluer-green RGB(65, 165, 80) (moisture)
Use multiple ground Parts with slightly different colors, not one flat plane.

--- RULE 5: DISTANCE COLOR SHIFT ---
Objects further from camera: slightly desaturated, slightly bluer
Near: RGB(80, 190, 70) bright green
Far: RGB(90, 175, 85) slightly muted, shifted toward blue
This creates atmospheric perspective depth.

--- RULE 6: MATERIAL-COLOR INTERACTION ---
SmoothPlastic + bright color = clean cartoon look (DEFAULT)
SmoothPlastic + pastel color = cute/kawaii look
SmoothPlastic + dark color = sleek modern look
Neon + any color = glowing version (use sparingly for magic/tech)
Glass + light color + Transparency 0.3 = clean window/water
ForceField + any color + Transparency 0.6 = ethereal shield/aura

--- RULE 7: THEMED PALETTES (pick one per scene) ---

FOREST: greens (3 shades) + browns (2) + orange/red accent + warm white
BEACH: sand tans (2) + ocean blues (2) + palm green + coral pink
WINTER: whites/light blues (3) + dark pine green + warm brown + red accent
DESERT: tans/oranges (3) + terracotta + cactus green + sky blue
CANDY: pinks (2) + mint green + cream + purple + yellow
VOLCANO: dark reds/oranges (3) + black basalt + lava neon + ash gray
SPACE: dark blues/purples (3) + star white + neon accents + metallic
UNDERWATER: teals/blues (3) + coral pinks/oranges + seafloor browns + bioluminescent neon
`

export const LOWPOLY_ITEMS: string = `
=== LOW-POLY GAME ITEMS AND COLLECTIBLES ===
Small detailed props that make scenes feel alive and game-ready.

--- COINS AND CURRENCY ---
Gold coin: Cylinder Size(0.15,1,1), SmoothPlastic RGB(245,210,70)
  Add ParticleEmitter: Rate=3, Color=yellow, Size=0.2, Lifetime=0.5
  Optional: slow spin via script (CFrame.Angles Y rotation)
Silver coin: same but RGB(200,200,210)
Gem (diamond shape): 2 WedgeParts mirrored, SmoothPlastic
  Ruby: RGB(220,50,60), Sapphire: RGB(50,100,220), Emerald: RGB(50,180,70)
  Add Neon inner glow Ball at 0.5 size, PointLight Range=6
Money bag: Ball body RGB(180,160,80) + cylinder top tied RGB(140,120,60)

--- FOOD/CONSUMABLES ---
Apple: Ball Size(0.8,0.8,0.8) RGB(220,50,50) + tiny cylinder stem RGB(80,60,30)
Banana: curved Part (slight angle) RGB(245,220,70)
Potion: Cylinder body + Ball cork, Glass colored Transparency 0.3
  Health: RGB(220,50,60), Speed: RGB(50,150,220), Strength: RGB(180,100,220)
Cake: Cylinder base RGB(230,200,160) + thin Cylinder frosting RGB(245,180,200) + Ball cherry RGB(220,40,50)

--- TOOLS/WEAPONS (low-poly style) ---
Sword: flat Part blade RGB(190,195,205) + Part handle RGB(140,100,55)
  Simple, clean, 4-5 parts max. No heavy detail.
Shield: Ball (half, flattened Y) RGB(180,50,50) + Part cross emblem RGB(245,220,70)
Bow: curved Part (bent) RGB(140,100,55) + thin Part string RGB(220,215,200)
Magic staff: Cylinder shaft RGB(120,80,45) + Ball orb on top, Neon RGB(120,80,230)
  Add PointLight + subtle ParticleEmitter

--- FURNITURE (clean style) ---
Chair: seat Part + 4 leg cylinders + back Part, all SmoothPlastic in matching color
Table: top Part + 4 legs, SmoothPlastic warm wood or painted color
Lamp: base cylinder + shade (Part), PointLight inside, warm glow
Bookshelf: back Part + 3-4 shelf Parts + colored book Parts (thin slices)
Bed: frame Parts + mattress Part (slightly puffy, lighter color) + pillow Ball

--- VEHICLES (low-poly) ---
Car: rounded box body + 4 cylinder wheels + windshield Glass
  Headlights: Neon cylinders + SpotLight
  All SmoothPlastic in bright color (red, blue, yellow)
Boat: hull (stretched Part, tapered) + mast cylinder + sail WedgePart
  Hull: SmoothPlastic RGB(140,100,55), Sail: SmoothPlastic RGB(245,240,230)

--- NATURE PROPS ---
Mushroom: Cylinder stem RGB(240,235,220) + Ball cap RGB(220,55,45) with white dots
  Dots: 3-4 tiny Ball parts RGB(245,240,235) on cap surface
Log: Cylinder on its side RGB(110,80,40), rings visible on ends (lighter circle)
Leaf pile: 3-4 flat Parts slightly overlapping, various autumn colors
Bird: 2 WedgePart wings + Ball body + tiny WedgePart beak
  Body: RGB(220,70,70) or RGB(50,130,220), Beak: RGB(245,200,60)
Butterfly: 2 thin Parts (wings) + tiny Part body, bright colors
  Wings: various bright colors with slight Transparency 0.1
`

export const LOWPOLY_STYLE_BIBLE: string = LOWPOLY_STYLE_GUIDE + '\n\n' + LOWPOLY_COLOR_DEPTH + '\n\n' + LOWPOLY_OBJECTS + '\n\n' + LOWPOLY_MAP_EXAMPLE + '\n\n' + LOWPOLY_ITEMS
