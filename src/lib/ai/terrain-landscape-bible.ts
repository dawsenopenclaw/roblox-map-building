/**
 * Terrain & Landscape Bible — teaches AI to generate natural environments in Roblox.
 * 30+ biome types, paths, water features, elevation, vegetation, weather, map layouts.
 */

export const TERRAIN_BIOMES: string = `
=== BIOME TYPES (30+) ===

--- BIOME: TEMPERATE FOREST ---
Dominant terrain materials: Grass, Ground, Mud, LeafyGrass
Base elevation: 0-80 studs. Rolling hills 20-40 studs amplitude.
Color palette:
  - Ground: RGB(101,79,54) — dark loam brown
  - Grass: RGB(87,125,60) — muted mid-green
  - Leaf canopy: RGB(55,100,35) dark green / RGB(160,120,30) autumn mix
  - Tree trunks: RGB(90,65,40) — medium oak brown
  - Rocks: RGB(130,120,110) — weathered grey-brown
Lighting/Atmosphere:
  - Atmosphere.Density: 0.28
  - Atmosphere.Offset: 0.12
  - Atmosphere.Color: RGB(200,215,190)
  - Atmosphere.Decay: RGB(140,160,120)
  - Atmosphere.Glare: 0.05
  - Atmosphere.Haze: 1.6
  - FogEnd: 1800
  - FogStart: 600
  - Ambient: RGB(110,120,100)
  - OutdoorAmbient: RGB(130,145,115)
  - TimeOfDay: "14:00:00"
Skybox tint: soft blue-grey RGB(160,180,200)
Vegetation density: medium — 1 oak/birch per 20x20 studs, 1 bush per 12x12
Ambient sounds: birds chirping (loop), wind through leaves, occasional branch crack
Tree mix: 60% oak, 25% birch, 15% mixed broadleaf

--- BIOME: BOREAL / TAIGA ---
Dominant terrain materials: Ground, Snow, Rock, Mud, LeafyGrass (sparse)
Base elevation: 40-200 studs. Rugged, uneven terrain.
Color palette:
  - Ground: RGB(75,65,55) — dark conifer needle floor
  - Snow patches: RGB(230,235,245) — blue-tinted white
  - Rock outcrops: RGB(105,100,95) — slate grey
  - Pine trunks: RGB(65,45,30) — dark reddish-brown
  - Pine needles: RGB(25,65,35) — very dark green
  - Spruce: RGB(30,70,40)
Lighting/Atmosphere:
  - Atmosphere.Density: 0.35
  - Atmosphere.Offset: 0.08
  - Atmosphere.Color: RGB(180,195,215)
  - Atmosphere.Haze: 2.4
  - FogEnd: 1400
  - FogStart: 400
  - Ambient: RGB(90,100,115)
  - OutdoorAmbient: RGB(110,120,140)
  - TimeOfDay: "10:00:00"
Skybox tint: pale grey-blue RGB(140,160,185)
Vegetation density: dense conifers — 1 pine per 10x10 studs, minimal undergrowth
Ground cover: scattered snow patches (white flat parts, 0.5 studs tall), fallen logs

--- BIOME: TROPICAL RAINFOREST ---
Dominant terrain materials: LeafyGrass, Mud, Ground, Water (streams)
Base elevation: -5 to 60 studs. Flat valley floor, steep ridgelines.
Color palette:
  - Floor: RGB(45,80,30) — very dark saturated green
  - Mud: RGB(110,75,40) — rich red-brown
  - Canopy top: RGB(35,110,25) — bright vivid green
  - Mid canopy: RGB(25,85,20) — medium green
  - Trunk: RGB(60,40,25) — dark tropical wood
  - Moss: RGB(55,95,40)
  - Flowers: RGB(220,60,80) red, RGB(255,180,0) yellow, RGB(180,40,200) purple
Lighting/Atmosphere:
  - Atmosphere.Density: 0.45
  - Atmosphere.Offset: 0.18
  - Atmosphere.Color: RGB(180,210,170)
  - Atmosphere.Haze: 3.2
  - FogEnd: 900
  - FogStart: 200
  - Ambient: RGB(60,90,55)
  - OutdoorAmbient: RGB(80,110,70)
  - Brightness: 1.8
  - TimeOfDay: "12:00:00"
Skybox tint: warm hazy green-white RGB(200,215,180)
Vegetation: extremely dense — 1 large tree per 8x8, massive 40-50 stud canopy height, ferns, vines, palms
Ambient sounds: heavy rain, tropical birds, insects, distant thunder

--- BIOME: SAVANNA ---
Dominant terrain materials: Ground, Sand, LeafyGrass (patchy), Sandstone
Base elevation: 0-30 studs. Very flat with occasional low kopje rock formations.
Color palette:
  - Ground: RGB(175,145,90) — golden tan
  - Dry grass: RGB(195,170,80) — yellow-straw
  - Rock kopje: RGB(140,115,85) — warm sandstone
  - Acacia trunk: RGB(100,75,40)
  - Acacia canopy: RGB(100,140,50) — flat umbrella shape
  - Soil: RGB(160,120,70)
Lighting/Atmosphere:
  - Atmosphere.Density: 0.22
  - Atmosphere.Offset: 0.06
  - Atmosphere.Color: RGB(230,210,170)
  - Atmosphere.Haze: 1.2
  - FogEnd: 2400
  - FogStart: 900
  - Ambient: RGB(160,140,100)
  - OutdoorAmbient: RGB(200,175,120)
  - Brightness: 2.4
  - TimeOfDay: "13:00:00"
Skybox tint: warm golden-blue RGB(200,220,240)
Vegetation: sparse — acacia trees every 40-60 studs, tall grass clumps (2-stud cylinders) every 5-8 studs
Ambient sounds: wind, distant animal calls, cicadas, dry grass rustling

--- BIOME: HOT DESERT ---
Dominant terrain materials: Sand, Sandstone, Rock, Salt (dry lake beds)
Base elevation: -10 to 50 studs. Dunes: sine-wave mounds 10-25 studs tall.
Color palette:
  - Sand dunes: RGB(220,190,130) — warm pale gold
  - Sandstone rock: RGB(190,145,85) — orange-tan
  - Dry salt flat: RGB(240,235,220) — near white
  - Cactus: RGB(80,120,55) — blue-green
  - Rock shadow: RGB(150,110,65)
Lighting/Atmosphere:
  - Atmosphere.Density: 0.15
  - Atmosphere.Offset: 0.03
  - Atmosphere.Color: RGB(255,230,190)
  - Atmosphere.Haze: 0.8
  - FogEnd: 3200
  - FogStart: 1200
  - Ambient: RGB(200,170,110)
  - OutdoorAmbient: RGB(240,210,150)
  - Brightness: 3.0
  - TimeOfDay: "12:30:00"
Skybox tint: bleached hot blue-white RGB(200,225,255)
Vegetation: very sparse — cactus every 60-80 studs, dead scrub bush every 30 studs
Dune generation: `height = 15 * math.sin(x/25) * math.cos(z/18) + 8 * math.sin(x/12)`

--- BIOME: TUNDRA / COLD DESERT ---
Dominant terrain materials: Ground, Snow, Rock, Ice, Mud
Base elevation: 100-400 studs. Exposed plateaus, wind-carved ridges.
Color palette:
  - Frozen ground: RGB(130,120,110) — grey-brown
  - Snow: RGB(225,230,240) — blue-white
  - Ice: RGB(180,210,230) — pale cyan
  - Lichen rock: RGB(95,100,85) — muted olive-grey
  - Dead grass: RGB(150,130,90) — pale straw
Lighting/Atmosphere:
  - Atmosphere.Density: 0.38
  - Atmosphere.Offset: 0.1
  - Atmosphere.Color: RGB(170,195,225)
  - Atmosphere.Haze: 2.8
  - FogEnd: 1600
  - FogStart: 500
  - Ambient: RGB(100,115,135)
  - OutdoorAmbient: RGB(140,155,175)
  - TimeOfDay: "09:00:00"
Skybox tint: pale arctic blue RGB(155,185,220)
Vegetation: near-zero — rare dead shrub, lichen patches (flat dark green discs)

--- BIOME: ARCTIC / POLAR ---
Dominant terrain materials: Snow, Ice, Glacier, Rock
Base elevation: 50-300 studs. Ice sheets, glaciers, pressure ridges.
Color palette:
  - Ice sheet: RGB(200,225,240) — pale blue-white
  - Glacier deep: RGB(100,170,210) — vivid glacier blue
  - Snow surface: RGB(240,245,255) — pure white-blue
  - Exposed rock: RGB(80,85,90) — near black
  - Meltwater pool: RGB(120,190,220) — bright teal-blue
Lighting/Atmosphere:
  - Atmosphere.Density: 0.30
  - Atmosphere.Color: RGB(195,215,240)
  - Atmosphere.Haze: 1.8
  - FogEnd: 2000
  - Ambient: RGB(130,150,175)
  - OutdoorAmbient: RGB(175,195,220)
  - ColorShift_Top: RGB(200,220,255)
  - TimeOfDay: "08:00:00"
Skybox tint: deep polar blue RGB(100,150,210)

--- BIOME: SWAMP / MARSH ---
Dominant terrain materials: Mud, Ground, Water, LeafyGrass (sparse)
Base elevation: -8 to 15 studs. Near-flat, flooded depressions.
Color palette:
  - Murky water: RGB(60,80,50) — dark olive-green
  - Mudbank: RGB(80,60,40) — very dark brown
  - Dead reeds: RGB(130,110,55) — dull straw
  - Cypress trunk: RGB(65,55,45)
  - Moss: RGB(60,90,45) — dark green
  - Algae surface: RGB(70,100,40)
Lighting/Atmosphere:
  - Atmosphere.Density: 0.55
  - Atmosphere.Color: RGB(160,190,150)
  - Atmosphere.Haze: 4.0
  - FogEnd: 700
  - FogStart: 150
  - Ambient: RGB(50,70,45)
  - OutdoorAmbient: RGB(75,95,60)
  - Brightness: 0.8
  - TimeOfDay: "07:30:00"
Skybox tint: murky yellow-green RGB(160,175,130)
Ambient sounds: frogs, crickets, distant splash, dripping water, owl

--- BIOME: MANGROVE ---
Similar to swamp but with defined water channels.
Dominant materials: Mud, Water, Ground
Mangrove root construction: 6-8 diagonal thin cylinders (0.4x0.4x4 studs) spreading from trunk base at 30-45° angles, Material=Wood, Color=RGB(60,45,30)
Water channels: 15-25 stud wide, Terrain Water, depth 4-6 studs
Tidal mudflat: Mud material, flat, RGB(95,70,50)

--- BIOME: CORAL REEF / UNDERWATER ---
Dominant terrain materials: Sand, Rock, Water (surface), Sandstone (seafloor)
Depth: -80 to 0 studs
Color palette:
  - Seafloor sand: RGB(210,190,150) — pale cream sand
  - Coral orange: RGB(220,100,50)
  - Coral pink: RGB(230,130,160)
  - Coral purple: RGB(150,80,180)
  - Seaweed: RGB(30,120,60) — vivid green
  - Deep water: RGB(20,60,120) — very dark blue
Lighting:
  - Ambient: RGB(30,80,130) — underwater blue
  - FogEnd: 200 — very short underwater visibility
  - FogColor: RGB(10,50,100)
  - Brightness: 0.6
Coral construction: short stumpy cylinders (2-4 studs tall, 1-3 studs radius) in clusters of 4-8, bright colors, Material=SmoothPlastic or Neon for glow effect

--- BIOME: VOLCANIC ---
Dominant terrain materials: Basalt, CrackedLava, Rock, Slate, Ground
Base elevation: 0-600 studs (stratovolcano)
Color palette:
  - Basalt flows: RGB(35,30,30) — near black
  - CrackedLava glow: RGB(200,80,10) — deep orange
  - Lava river: RGB(255,120,0) — bright orange (Neon material)
  - Ash ground: RGB(80,75,70) — dark grey
  - Sulfur deposits: RGB(180,160,30) — yellow-grey
Lighting/Atmosphere:
  - Atmosphere.Color: RGB(220,180,130) — warm orange haze
  - Atmosphere.Density: 0.50
  - Atmosphere.Haze: 3.5
  - FogEnd: 800
  - Ambient: RGB(120,60,20) — orange ambient
  - OutdoorAmbient: RGB(160,80,30)
  - Brightness: 1.2
Lava glow: PointLights inside lava channel parts, Brightness=4, Range=20, Color=RGB(255,120,0)
Ambient sounds: deep rumbling, crackling fire, hissing steam vents

--- BIOME: MUSHROOM FOREST ---
Dominant terrain materials: LeafyGrass, Ground, Mud
Base elevation: 0-40 studs. Lumpy, organic terrain.
Color palette:
  - Ground: RGB(80,50,80) — purple-tinted dark
  - Spore mist: RGB(200,160,220) — pale lavender
  - Mushroom cap red: RGB(200,40,30)
  - Mushroom cap purple: RGB(140,50,180)
  - Mushroom cap white spot: RGB(245,245,245)
  - Stalk: RGB(220,200,180) — pale cream
  - Bioluminescent moss: RGB(80,220,120) — bright green (Neon)
Lighting:
  - Ambient: RGB(80,50,110) — purple-dark
  - OutdoorAmbient: RGB(100,60,130)
  - Brightness: 0.5
  - FogEnd: 400, FogColor: RGB(150,100,180)
Mushroom construction (large): cap = flattened sphere (CylinderMesh squashed, scale Y=0.35), stalk = cylinder. Cap diameters: small 4-8 studs, medium 12-20, large 30-50.

--- BIOME: CRYSTAL CAVE ---
Dominant terrain materials: Rock, Slate, Limestone (walls), Ground (floor)
Fully enclosed — no skybox visible. Use cave ceiling parts.
Color palette:
  - Cave walls: RGB(45,40,55) — very dark grey-purple
  - Crystal blue: RGB(80,180,255) — Neon material
  - Crystal purple: RGB(180,80,255) — Neon
  - Crystal teal: RGB(40,220,180) — Neon
  - Crystal pink: RGB(255,100,180) — Neon
  - Stalactite: RGB(100,90,80) — grey-tan
  - Water pool: RGB(20,100,180) — deep blue, transparent
Lighting:
  - Ambient: RGB(20,15,35) — near black purple
  - No outdoor ambient (sealed cave)
  - PointLights inside large crystals: Brightness=3, Range=15
Crystal construction: elongated pyramids (wedge parts or custom meshes), clustered 3-6 together, varying heights 4-20 studs, tilt 0-30°, Neon material for glow

--- BIOME: FLOATING ISLANDS ---
Dominant terrain materials: Grass, LeafyGrass, Rock, Ground, Slate (island undersides)
Islands float 100-500 studs above void.
Color palette:
  - Top grass: RGB(100,165,60) — vivid green
  - Island underside: RGB(120,90,60) — dirt brown tapering to point
  - Rock edge: RGB(110,100,90) — grey
  - Waterfalls: RGB(140,200,240) — pale blue cascade (transparent parts)
  - Cloud wisps: RGB(240,245,255) — near white, transparency 0.7
Island shape: top flat (ellipse 40-120 studs wide), bottom tapers to rough point, 20-60 studs tall total
Connecting bridges: rope bridges or vine bridges (see PATHS section)
Ambient: RGB(130,155,185) — light blue sky ambient

--- BIOME: WASTELAND / POST-APOCALYPTIC ---
Dominant terrain materials: Ground, Concrete, Asphalt, Rock, Slate
Base elevation: -5 to 30 studs. Cracked and broken.
Color palette:
  - Cracked earth: RGB(120,100,75) — dusty tan
  - Concrete rubble: RGB(150,145,135) — grey
  - Rust: RGB(160,70,30) — burnt orange
  - Ash: RGB(95,90,85) — grey
  - Toxic pool: RGB(100,160,20) — neon green, Neon material
  - Dead tree: RGB(65,50,35) — grey-brown
Lighting/Atmosphere:
  - Atmosphere.Color: RGB(210,195,160) — dusty yellow-grey
  - Atmosphere.Haze: 2.0
  - FogEnd: 1200
  - Ambient: RGB(100,90,70)
  - ColorShift_Top: RGB(180,160,110) — desaturated warm
  - Brightness: 0.9

--- BIOME: CHERRY BLOSSOM ---
Dominant terrain materials: LeafyGrass, Ground, Pavement (garden paths), Rock
Base elevation: 0-50 studs. Gently rolling with stone bridges over streams.
Color palette:
  - Grass: RGB(120,160,80) — fresh spring green
  - Cherry blossom petals: RGB(250,190,200) — soft pink
  - Cherry trunk: RGB(80,55,40) — dark reddish-brown
  - Path stones: RGB(170,160,150) — pale grey
  - Stream: RGB(140,185,215) — clear blue
  - Lanterns: RGB(200,80,20) — red-orange (wood)
Lighting/Atmosphere:
  - Atmosphere.Color: RGB(240,215,220) — pink-tinted
  - Atmosphere.Density: 0.20
  - Atmosphere.Haze: 1.2
  - FogEnd: 1600
  - Ambient: RGB(170,155,160) — pink-grey
  - Brightness: 1.6
  - TimeOfDay: "11:00:00"
Ambient sounds: wind chimes, gentle breeze, birds, distant temple bells

--- BIOME: BAMBOO FOREST ---
Dominant terrain materials: LeafyGrass, Ground, Mud (paths)
Base elevation: 0-30 studs. Flat to gently sloped.
Color palette:
  - Ground: RGB(85,105,55) — muted green-brown
  - Bamboo stalk: RGB(130,165,60) — yellow-green
  - Bamboo node: RGB(100,130,45) — darker band
  - Leaf: RGB(80,140,50) — mid green
  - Path mud: RGB(100,75,50) — dark mud
Bamboo construction: cylinder 0.8x0.8 stud diameter, 20-30 studs tall, random slight lean 0-5°. Node rings: torus mesh or thin cylinder disc (1.2x1.2x0.3) every 4-5 studs. Clusters of 3-7 stalks, spacing 2-4 studs within cluster, clusters every 6-8 studs overall.
Lighting: Ambient RGB(90,110,70), Brightness 0.9, filtered green light effect

--- BIOME: AUTUMN FOREST ---
Dominant terrain materials: Ground, LeafyGrass, Mud
Base elevation: 0-70 studs.
Color palette (high variation, randomize per tree):
  - Red maple: RGB(190,50,20)
  - Orange maple: RGB(220,120,20)
  - Yellow birch: RGB(210,180,30)
  - Brown oak: RGB(150,90,30)
  - Ground leaves: RGB(160,100,35) — fallen leaf carpet
  - Trunk: RGB(75,55,35)
Key detail: Leaf fall particles — ParticleEmitter on invisible parts in canopy, emitting flat leaf-colored squares, slow downward drift, lifetime 4-8 seconds
Lighting: Atmosphere.Color RGB(225,195,150) warm golden, Brightness 1.4, TimeOfDay "16:00:00" for low golden sun angle

--- BIOME: ALPINE / MOUNTAIN ---
Dominant terrain materials: Rock, Snow, Slate, Grass (low elevations), Ice (peaks)
Elevation zones:
  - 0-60 studs: Grass + scattered rock
  - 60-120 studs: Rock + Ground, no trees
  - 120-180 studs: Snow patches on rock
  - 180+ studs: Full Snow/Ice/Glacier
Color palette:
  - Alpine grass: RGB(100,130,70) — muted green
  - Rock face: RGB(110,105,100) — medium grey
  - Snow: RGB(235,240,250) — blue-white
  - Ice face: RGB(175,205,230) — glacier blue
Cliff face construction: stacked horizontal block/wedge layers, each slightly offset inward by 0.5-2 studs, Material=Rock or Slate, varying widths 10-30 studs

--- BIOME: COASTAL / BEACH ---
Dominant terrain materials: Sand, Water, Rock (tide pools), LeafyGrass (dunes)
Elevation: -20 (underwater) to 15 studs
Color palette:
  - Wet sand: RGB(195,175,135) — dark damp
  - Dry sand: RGB(230,210,165) — pale gold
  - Tide pool water: RGB(80,160,190) — bright teal
  - Seafoam: RGB(230,240,245) — white-blue
  - Dune grass: RGB(150,160,70) — pale green
  - Beach rock: RGB(140,130,120) — weathered grey
Shore foam: flat white transparent parts (transparency 0.6) at waterline, positioned randomly every 5-10 studs along shore

--- BIOME: DEEP OCEAN ---
Fully submerged. Use SkyBox = black.
Depth: -200 to -30 studs
Color palette:
  - Abyssal floor: RGB(15,20,30) — near black
  - Bioluminescent creatures: Neon material, RGB(0,200,150) and RGB(100,50,200)
  - Hydrothermal vent: RGB(200,100,20) Neon glow + surrounding basalt
Lighting: Ambient RGB(0,10,30), FogEnd 80, FogColor RGB(5,15,40) — extreme fog

--- BIOME: CANYON / BADLANDS ---
Dominant terrain materials: Sandstone, Rock, Sand, Slate
Color layers by elevation (paint each 10-stud band differently):
  - Top layer: RGB(180,130,80) — warm sandstone orange
  - Mid layer: RGB(150,100,60) — dark rust
  - Lower layer: RGB(200,160,100) — pale cream
  - Floor: RGB(160,140,110) — sandy tan
Canyon walls: vertical or near-vertical cliff faces, 60-200 studs tall
Canyon width: 20-80 studs at floor, widens to 60-150 at top (stepped outward)
Mesa construction: flat top (Sandstone), vertical sides (Rock/Slate), height 40-100 studs

--- BIOME: STEPPE / PRAIRIE ---
Dominant terrain materials: LeafyGrass, Ground, Sand (dry patches)
Base elevation: 0-20 studs. Nearly flat — maximum variation 8 studs per 100 stud span.
Color palette:
  - Grass: RGB(165,155,80) — golden straw-yellow
  - Rich grass: RGB(120,150,60) — near stream
  - Dry soil: RGB(170,145,100)
  - Wildflower: RGB(220,80,60) poppies / RGB(80,120,200) cornflowers
Ambient: open sky blue, FogEnd 3500+, very clear atmosphere
Wind grass: use TextureId scrolling or particle emitter for flowing grass motion

--- BIOME: MEDITERRANEAN ---
Dominant terrain materials: Rock, LeafyGrass, Sand, Limestone, Pavement
Base elevation: 0-80 studs. Coastal cliffs and terraced hillsides.
Color palette:
  - White limestone: RGB(240,235,225)
  - Terracotta: RGB(195,95,55) — roof tiles
  - Olive tree: RGB(120,130,60) — silvery green
  - Sea blue: RGB(40,120,200) — vivid Mediterranean
  - Lavender: RGB(160,100,190)
Key props: cypress trees (2x2x25 tight column shape), terracotta flower pots, stone walls (1 stud wide, 3-5 studs tall, Limestone material)

--- BIOME: MOORLAND ---
Dominant terrain materials: Ground, LeafyGrass, Mud, Rock (granite tors)
Base elevation: 50-120 studs. Open exposed upland.
Color palette:
  - Heather: RGB(160,80,150) — purple-pink (small sphere clusters)
  - Peat: RGB(65,50,35) — very dark brown
  - Rough grass: RGB(110,120,65) — dull green
  - Granite tor: RGB(130,125,120) — silver-grey
  - Boggy pool: RGB(55,65,40) — very dark murky
Mist: heavy atmosphere, FogEnd 600, Density 0.60, Haze 3.5

--- BIOME: BAYOU ---
Identical material base to swamp but with raised tree roots, Spanish moss, and fireflies.
Spanish moss: thin hanging string-like parts (0.2x0.2x4-8 studs), transparency 0.3, Color RGB(160,165,120), hanging in chains of 3-6 from branches
Firefly effect: small Neon sphere parts (0.2 diameter) attached to scripts that move randomly in sine patterns, Color RGB(220,230,50)
Water color: RGB(40,60,30) — near black-green

--- BIOME: CLOUD FOREST ---
High elevation (150-300 studs) tropical forest with persistent cloud layer.
Cloud parts: large low-transparency boxes (transparency 0.6-0.75, Color RGB(240,245,255)) woven between tree trunks at mid-level (height 20-40 studs off ground)
Moss coverage: every tree trunk has RGB(70,110,55) coating (thin cylinder wrapper parts), every rock covered with green flat parts
Waterfall frequency: very high — 1 waterfall per 50x50 stud area

--- BIOME: UNDERGROUND CAVERN ---
No skybox. Solid ceiling 30-80 studs above floor.
Dominant materials: Rock, Limestone, Slate, Ground (cave floor), Water (underground lakes)
Color palette:
  - Ceiling stalactite: RGB(95,85,75) — grey-tan
  - Floor stalagmite: RGB(110,95,80)
  - Cave wall: RGB(75,70,65) — dark grey
  - Underground lake: RGB(15,40,70) — very dark blue, nearly opaque
  - Ore vein glint: RGB(200,170,20) Neon — gold vein, RGB(80,200,220) — crystal vein
Lighting: multiple PointLights placed at floor level (Brightness 2, Range 25, warm orange or cool blue depending on zone), overall Ambient RGB(20,18,15)

--- BIOME: LAVA FIELD ---
Dominant terrain materials: CrackedLava, Basalt, Rock, Slate
Same base as volcanic but flatter — lava flows instead of volcano cone.
Lava river channels: 8-20 studs wide, cut 3-5 studs into basalt floor
Active lava: Neon material, Color RGB(255,100,0), PointLight inside each chunk (Brightness=3)
Cooled lava crust: CrackedLava material, Color RGB(40,30,25) — very dark
Lava crust cracking reveals inner glow: use thin elevated Neon parts visible through crack gaps
`

export const TERRAIN_WATER: string = `
=== WATER FEATURES ===

--- RIVERS ---
Width range: 20-60 studs standard. Mountain streams: 8-15 studs. Major rivers: 60-100 studs.
Method A — Terrain Water: Use workspace.Terrain:FillBlock() or FillCylinder with Water material. Depth 4-8 studs. Pros: looks good. Cons: can't control color precisely.
Method B — Part-based water: Union of flat boxes, Material=SmoothPlastic, Color=RGB(80,140,200), Transparency=0.35. Stack 2 layers for depth illusion.

River bank treatment:
  - Inner bank (near water): Sand or Mud material, 2-4 studs wide strip
  - Outer bank: transition to Grass/LeafyGrass over 6-8 stud band
  - Bank parts: place rounded stones (sphere parts, diameter 1-3 studs, Material=Rock, Color=RGB(130,120,110)) randomly along waterline, density 1 per 8 studs
  - Reeds: thin cylinders (0.3x0.3x3 studs, Material=Grass or Wood, Color=RGB(120,100,40)) in groups of 3-5 at waterline

River curves: break river into segments 20-30 studs long, rotate each segment 5-15° to create natural meandering. Each bend: place gravel/sand bar on inner curve.

Flow indication (part-based):
  - Place thin diagonal transparent planes (Transparency=0.7, Color=RGB(200,230,255)) at slight angle following flow direction, spaced every 5 studs
  - ParticleEmitter on surface: Rate=20, Speed=Vector3.new(0,0,8) in flow direction, Lifetime=1.5, Size=NumberSequence 0.3→0.1, Color white

River crossing: ford = shallow section (2 studs deep max), flat stepping stones every 2-3 studs across

--- LAKES ---
Size range: small pond 20x30 studs, medium lake 80x120 studs, large lake 200x400 studs
Shape: irregular polygon (never perfect rectangle). Minimum 6-8 distinct edge points.
Depth: 6-15 studs at center, shallows at shore (2-3 studs)
Shore construction:
  - Immediate waterline: Sand material 3-5 studs wide
  - Shallow slope: terrain slopes gently 15° from shore into water
  - Dock (if needed): wooden boardwalk extending 10-15 studs into lake, see PATHS section

Lake reflection quality: set Camera FOV to 70, add SurfaceAppearance or just rely on Terrain water reflections
Lily pads: flat cylinder parts (diameter 3-4, height 0.2, Color RGB(50,120,40), Material=Grass) floating at surface, transparency 0, groups of 3-7 scattered across surface

--- OCEAN ---
Terrain Water extending beyond visible range. Place Terrain Water from x=-2000 to x=2000, z=-2000 to z=2000, y=-20 to y=0.
Deep ocean color: modify FogColor to RGB(10,40,80), FogEnd=300 for underwater areas
Wave effect: animated script oscillates large flat plane parts at surface (sine wave Y position, amplitude 0.5 studs, period 3-6 seconds)
Beach→ocean transition: Sand for 15-25 studs, then water begins at 0 elevation, slopes to -20 studs over 30 studs

--- WATERFALL ---
Construction (layered cascade method):
  Step 1: Determine height. Small waterfall: 15-30 studs. Large: 60-120 studs.
  Step 2: Create 4-8 cascade tiers. Each tier = flat ledge of Rock/Slate, 5-15 studs wide, 2-4 studs tall.
  Step 3: Water curtain = series of thin transparent box parts (width of falls, 0.4 studs thick, height = tier drop), Transparency=0.25, Color=RGB(180,220,245), Material=SmoothPlastic or ForceField for shimmer
  Step 4: Mist plunge pool: large ParticleEmitter at base, Rate=80, upward velocity 0-8 studs/s, white particles, Transparency=NumberSequence 0.2→0.9, LightInfluence=1
  Step 5: Pool at base: radius = 1/3 of waterfall height, Terrain Water or Part water
  Step 6: Spray particles on sides: additional emitters at cascade points, horizontal spread

Waterfall sound: Sound object with rushing water audio, placed at top of falls, RollOffMaxDistance=120

--- STREAM ---
Width: 3-8 studs. Follows terrain contours (always flows downhill).
Path method: place 0.8-stud-deep Terrain Water or flat transparent parts following a manually carved channel in terrain.
Stepping stones: sphere/cylinder parts (diameter 2-4, height=water level, Material=Rock) every 3-5 studs

--- FOUNTAIN ---
Base basin: flat cylinder or octagonal shape, 8-12 stud diameter, Material=Concrete or Limestone, 1.5 studs tall walls
Central column: cylinder 1x1x6 studs, topped with decorative sphere or statue
Water jet: ParticleEmitter at top of column, Rate=40, upward velocity 12 studs/s, spread 10°, white particles, transparency 0.3→0.8, falls back as separate emitter
Basin water: flat transparent part inside basin, Transparency=0.3, Color=RGB(100,180,220)

--- INFINITY POOL ---
One or more walls flush with water level — water appears to flow off edge.
Construction: Basin with 3 normal walls (1 stud above water level), 1 wall exactly at water level or 0.2 below.
Place water part exactly at same Y as low wall top.
Scenic backdrop required: cliffside or ocean view.

--- RAPIDS ---
Fast-moving shallow water (1-2 studs deep), lots of exposed rocks.
White water: Neon or ForceField material parts (low transparency 0.4, white-blue), scattered across rapid section in rough diagonal patterns
Rock placement: 30-50% of rapid surface covered with protruding Rock parts (0.5-2 studs above water)
Foam: ParticleEmitter every 8-10 studs, Rate=25, white burst particles, lifetime 0.5s

--- FROZEN LAKE ---
Ice surface: flat parts, Material=Ice or Glacier, Color=RGB(180,210,230), Transparency=0.2
Cracks: thin dark line decals or thin 0.1-stud-tall dark wedge parts in crack patterns
Snow dusting on top: thin white parts, Transparency=0.5
Edges: irregular, jagged ice chunks (wedge parts tilted) at shoreline
Depth visible through ice: dark water color beneath (dark part at -3 studs depth)

--- POND ---
Small lake, 10-30 studs diameter. Surrounded closely by vegetation.
Duckweed: tiny flat green parts (0.5x0.5 squares) scattered on surface, Color=RGB(60,120,40)
Lily pads more dense than large lake (1 per 6 studs²)
Overhanging branches: tree positioned at pond edge with branches extending 4-8 studs over water
`

export const TERRAIN_ELEVATION: string = `
=== ELEVATION SYSTEMS ===

--- HEIGHT GENERATION FORMULAS ---
All heights computed in Luau. baseHeight = terrain Y origin.

Simple rolling hills:
  height = baseHeight + amplitude * math.sin(x / frequency) * math.cos(z / frequency)
  Typical values: amplitude=25, frequency=80

Multi-octave hills (more natural):
  height = baseHeight
    + 30 * math.sin(x/90) * math.cos(z/75)
    + 12 * math.sin(x/35 + 1.2) * math.cos(z/40 + 0.8)
    + 5  * math.sin(x/18 + 2.5) * math.cos(z/15 + 1.9)
    + 2  * math.sin(x/8  + 0.5) * math.cos(z/9  + 3.1)

Mountain terrain:
  height = baseHeight
    + 150 * math.max(0, math.sin(x/200) * math.cos(z/180))^1.5
    + 40  * math.sin(x/60) * math.cos(z/55)
    + 15  * math.sin(x/25) * math.cos(z/20)

Cliff generation: sharp height discontinuity
  if x > cliffEdge then height = height + cliffDrop end
  cliffDrop = 40-120 studs for dramatic cliffs

Canyon carving: invert the mountain formula
  height = baseHeight - 60 * math.max(0, 1 - (math.abs(x - canyonCenter) / canyonHalfWidth))

--- HILL TYPES ---

Gentle Hill:
  Amplitude: 15-25 studs
  Frequency: 60-100 studs
  Slope: never exceeds 20°
  Suitable for: farms, meadows, casual landscapes

Medium Hill:
  Amplitude: 30-55 studs
  Frequency: 40-70 studs
  Slope: 20-40°
  Suitable for: forests, temperate zones

Steep Hill:
  Amplitude: 60-90 studs
  Frequency: 30-50 studs
  Slope: 40-60°
  Requires: switchback paths, no direct vertical movement

--- MOUNTAINS ---
Total height: 150-400 studs
Peak shape: multiple overlapping mounds (2-4 peaks per mountain range)
Snow line: above 150 studs switch terrain material to Snow/Ice
Rock band: 80-150 studs use Rock/Slate material
Snow cap construction (part-based): flattened sphere parts (white, semi-transparent) placed at peak, diameter = peak width * 1.2

Mountain range layout: chain of 4-8 individual peaks, each offset by 80-150 studs, heights varying 60-80% of tallest peak. Ridge connection: saddles between peaks at 60-70% of adjacent peak heights.

--- CLIFFS ---
Vertical drop: 30-200 studs
Face material: Rock (lower), Slate (mid), Limestone (upper weathered band)
Construction (part-based cliff face):
  - Stack horizontal wedge/block layers 2-4 studs tall
  - Each layer slightly set back 0.2-0.5 studs from lower layer
  - Occasional protruding ledge: one layer extends 1-3 studs outward, 0.5-1 stud thick
  - Color variation per layer: alternate between RGB(105,95,85) and RGB(130,120,110)
  - Crack details: thin 0.1 stud dark parts in vertical and diagonal lines on face

Cliff base: talus slope — pile of Rock sphere/irregular parts at cliff bottom, 10-20 studs deep, radius = cliff height / 3

Cliff top: slight overhang (top layer extends 1 stud outward), sparse grass and scrub

--- VALLEYS ---
U-shaped valley (glacial):
  Width at base: 60-120 studs
  Side slope: 50-70° — relatively steep, fairly uniform
  Used for: rivers, meadows between mountains
  Base is flat for 30-50 stud width before slopes begin

V-shaped valley (river-carved):
  Width at base: 20-40 studs
  Side slope: 30-50° — continuous slope from ridge to stream
  River always present at base
  Formula: height = baseHeight + slopeAngle * math.abs(x - valleyCenter)

--- CANYONS ---
Width: 15-50 studs floor, 50-120 studs top
Depth: 60-200 studs below surrounding plateau
Wall stratification: horizontal color bands every 15-25 studs height
  Band 1 (top): RGB(200,160,100) sandstone cream
  Band 2: RGB(175,120,70) rust orange
  Band 3: RGB(150,100,55) dark red
  Band 4 (bottom): RGB(130,90,45) dark brown
Floor material: Sand at bottom, scattered Rock boulders

--- MESAS / PLATEAUS ---
Flat top: 40-200 studs wide, Material=Sandstone or Rock
Vertical sides: same cliff construction as above, 40-100 studs tall
Edge treatment: slight rounding on top edge (1-2 stud chamfer of additional small parts)
Access: either no access (purely decorative), switchback path, or rope bridge from adjacent formation

--- ROLLING TERRAIN (gentle waves) ---
Best for: open world RPG, peaceful simulator zones
Amplitude: 8-15 studs
Frequency: 100-150 studs
Add micro-variation: + 2 * math.sin(x/10) * math.cos(z/12)
Result: feels alive but navigable without jumping

--- HEIGHT COLOR MAPPING ---
For part-based terrain, color each piece by its Y position:
  Y < 5:   RGB(195,175,135) — sandy beach
  Y 5-15:  RGB(90,130,65)  — low grass
  Y 15-40: RGB(80,115,55)  — mid grass
  Y 40-70: RGB(100,90,70)  — upper grass/dirt mix
  Y 70-100: RGB(110,100,90) — grey rock
  Y 100-130: RGB(130,120,110) — pale rock
  Y 130-160: RGB(180,185,195) — rocky snow mix
  Y 160+:  RGB(235,240,250) — snow

--- TERRAIN VOXEL API (Roblox Terrain Object) ---
Fill a region with material:
  local region = Region3.new(
    Vector3.new(x1, y1, z1),
    Vector3.new(x2, y2, z2)
  )
  workspace.Terrain:FillBlock(
    CFrame.new((x1+x2)/2, (y1+y2)/2, (z1+z2)/2),
    Vector3.new(x2-x1, y2-y1, z2-z1),
    Enum.Material.Grass
  )

Replace terrain in region:
  workspace.Terrain:ReplaceMaterial(
    region, 4, -- voxel resolution (4 studs per voxel)
    Enum.Material.Grass,
    Enum.Material.Snow
  )

Read height at point (raycast method):
  local ray = Ray.new(Vector3.new(x, 500, z), Vector3.new(0, -1000, 0))
  local hit, pos = workspace:FindPartOnRay(ray)
  local groundY = pos.Y

Bulk terrain generation loop:
  for x = startX, endX, 4 do
    for z = startZ, endZ, 4 do
      local h = computeHeight(x, z)
      local mat = getMaterial(h)
      workspace.Terrain:FillBlock(
        CFrame.new(x, h/2, z),
        Vector3.new(4, h, 4),
        mat
      )
    end
  end
`

export const TERRAIN_PATHS: string = `
=== PATHS & ROADS ===

--- DIRT TRAIL ---
Width: 4-6 studs
Material: Ground or Mud
Color: RGB(130,100,65) — worn earth
Height: flush with surrounding terrain, slightly depressed 0.2 studs
Edge treatment: no defined edge — ground transitions organically to grass over 1-2 stud band
Path curve method: break into 3-5 stud segments, rotate each segment 5-12° for natural winding
Wheel ruts: two parallel shallow depressions (0.15 stud depth), 2 studs apart, same material
Occasional mud puddle: flat transparent part RGB(80,65,50) transparency 0.4, placed in low spots

--- COBBLESTONE PATH ---
Width: 5-8 studs
Material: Pavement or Concrete
Color base: RGB(150,140,130) — grey-tan
Individual cobbles: 0.6x0.4x0.4 stud boxes, slightly varied heights (0 to 0.1 stud protrusion), colors varying from RGB(130,120,110) to RGB(165,155,140)
Mortar gaps: Material=Concrete, Color=RGB(100,95,90), 0.1 stud wide strips between cobbles
Edge: raised kerb stones, 0.5 studs taller than path center, Material=Limestone or Rock
Moss growing in cracks: occasional green RGB(60,100,50) flat tiny parts

--- ASPHALT ROAD ---
Width: 12-20 studs (2-lane), 6-10 studs (1-lane)
Material: Asphalt
Color: RGB(60,58,55) — very dark grey
Center line marking: thin (0.2 stud wide) yellow parts, Color RGB(220,200,50), dashed (every 4 studs on, 2 studs off)
Edge line: white continuous strip, 0.3 studs wide
Shoulder: 2-3 stud wide Concrete or Pavement edge, Color RGB(120,115,110)
Road crown: center is 0.2 studs higher than edges (water runoff)

--- WOODEN BOARDWALK ---
Width: 4-6 studs
Planks: 4 stud long × 4 stud wide × 0.3 stud thick boxes, Material=WoodPlanks
  Color: RGB(130,100,65) new wood / RGB(100,80,50) weathered / RGB(75,60,40) old
  Plank gap: 0.1 stud between each plank
Supports: vertical posts every 4 studs, cylinder 0.4x0.4x variable height, Material=WoodPlanks
  Support crossbeam: 4-stud span horizontal cylinder connecting posts, 0.3 diameter
Railing (optional): post height = 3 studs above deck, horizontal rail along top
Uses: pier, swamp walkway, treehouse connection, beach deck

--- STONE BRIDGE ---
Span: 12-30 studs across water/gap
Arch construction: semicircle of wedge parts forming arch shape, 3-5 studs wide arch, Material=Limestone or Rock
  Arch height: span/2 studs tall
  Keystones: slightly protruding center block, 1 stud wider than flanking pieces
Roadway: 6-8 stud wide, flat parts on top of arches, Material=Pavement or Limestone
  Slight crown: center 0.15 studs higher
Parapet walls: 1 stud wide × 2 stud tall walls along both sides, Material=Limestone
  Crenellations (medieval): 1x1x0.8 raised blocks every 2 studs along parapet top
Abutments: solid stone block anchors on each bank, 4x4x variable depth into terrain

--- SUSPENSION BRIDGE ---
Span: 30-100 studs
Towers: two vertical rectangles, 2x2 stud base, height = span/3 studs, Material=Metal or Concrete
Main cables: thin cylinder (0.3 diameter) connecting tower tops with catenary sag (curve follows y = a*cosh(x/a), approximate with 6-10 angled segments), Color=RGB(80,80,80) metal
Vertical suspender cables: thin cylinders (0.15 diameter) dropping from main cable to deck every 3-4 studs
Deck: planks or concrete, 6 stud wide
Anchor blocks: large cube (4x4x4) at ground level past each tower where main cables terminate

--- RAILROAD TRACKS ---
Width between rails: 5 studs
Rails: 2 parallel cylinders, 0.3x0.3 studs, Material=Metal, Color=RGB(100,90,80) weathered steel
Ties/sleepers: 6x1x0.4 WoodPlanks box every 2 studs under rails, Color=RGB(70,50,35) dark treated wood
Ballast: rough Rock/Gravel material fill between and around ties, extending 1 stud either side of track

--- HIGHWAY ---
Width: 24-30 studs (4 lanes)
Material: Asphalt, Color RGB(50,48,46) — very dark
Lane lines: white dashed (every 6 studs) between lanes, double yellow center
Shoulder: 3-4 stud wide Asphalt strip, slightly lighter color
Guard rail: thin Metal parts along edge, 1 stud tall, posts every 4 studs
Overpass: elevated 15-25 studs above terrain, supported by concrete pillars (4x4 stud columns every 20 studs)

--- SIDEWALK ---
Width: 3-4 studs
Material: Concrete or Pavement, Color RGB(180,175,170)
Height: 0.4 studs above road level
Curb: vertical face 0.4 studs, Material=Concrete
Crack details: thin dark line parts at irregular intervals
Curb cut: every 20-30 studs, section drops to road level (accessibility ramp, 2 stud wide, 0.4 stud slope)

--- RIVER CROSSING / FORD ---
Width: full river width (15-40 studs)
Depth at crossing: 1.5-2 studs maximum
Construction: raise terrain at crossing point to create shallower section, scatter stepping stones
Surface: Terrain Sand underwater + scattered Rock parts protruding 0.3-0.5 studs above water
Markers: two wooden posts on each bank (1x1x4 stud cylinders with WoodPlanks material)

--- CURVING ROADS (TECHNIQUE) ---
Step 1: Define waypoints (list of Vector3 points)
Step 2: For each consecutive pair of points, compute direction vector and angle
Step 3: Place a road segment (flat box, width=roadWidth, length=distance between points)
Step 4: Orient each segment to face next waypoint using CFrame.lookAt()
Step 5: Stagger waypoints minimum 5-8 studs apart for smooth curves
Step 6: At curve intersections, add a fill quad part to close the gap between angled segments
Angle per segment: 5-15° for gradual curves, up to 30° for sharp turns
Banking on curves: tilt road segment on local X axis by 5-15° (lean into curve)

--- ELEVATION HANDLING ON PATHS ---
Slope limit: paths should not exceed 35° gradient for walkability
Switchback: for slopes >35°, create zigzag path. Each leg: 20-30 studs horizontal, then 180° turn at landing platform (4x4 stud rest area)
Steps: for very steep sections, add step risers every 2-3 studs. Step height: 0.8-1.2 studs. Step depth: 2-3 studs.
Stair construction: each step = flat box (path width × step depth × 0.8-1.2 studs tall), stack offset by step depth, Material=Concrete or Limestone
`

export const TERRAIN_VEGETATION: string = `
=== VEGETATION SYSTEMS ===

--- OAK TREE ---
Trunk: cylinder, diameter 3 studs (radius 1.5), height 18-22 studs, Material=Wood, Color=RGB(85,60,38)
Trunk taper: place 2nd cylinder at top half, diameter 2 studs, height 12 studs, same color (overlap 4 studs with lower cylinder)
Root flare: 4 smaller flattened cylinders (diameter 3, height 0.8) radiating from base at 45° intervals, slightly angled downward
Main canopy: sphere, diameter 20-26 studs, Material=LeafyGrass or Neon (slightly glowing greens for stylized), Color=RGB(55,95,38)
Secondary canopy: 2-3 smaller spheres (diameter 12-16) offset from center by 5-7 studs, slightly lower, Color=RGB(65,105,42) and RGB(45,85,30) (color variation)
Branch suggestion: 2-3 diagonal cylinders (diameter 0.8, length 8-12 studs) protruding from trunk at 40-60° angle before canopy, Material=Wood

--- PINE / SPRUCE TREE ---
Trunk: cylinder, diameter 2 studs, height 24-30 studs, Material=Wood, Color=RGB(60,42,28)
Cone layers (5-7 layers from bottom to top):
  Layer 1 (bottom): cone-like arrangement. Use flattened cylinder or actual CylinderMesh with top radius 0. Diameter 16 studs, height 2.5 studs. Y position: 8 studs above ground.
  Layer 2: diameter 13 studs, height 2.5 studs, Y = 12 studs
  Layer 3: diameter 10 studs, height 2 studs, Y = 15.5 studs
  Layer 4: diameter 8 studs, height 2 studs, Y = 18.5 studs
  Layer 5: diameter 6 studs, height 2 studs, Y = 21 studs
  Layer 6: diameter 4 studs, height 1.5 studs, Y = 23 studs
  Top spike: cylinder 0.8 diameter, 3 studs tall, Y = 25 studs
All cone layers: Material=LeafyGrass, Color=RGB(28,65,35)

--- PALM TREE ---
Trunk: cylinder, diameter 2 studs, height 20-24 studs, Material=Wood, Color=RGB(130,105,65)
Trunk curve: instead of single straight cylinder, use 3-4 segments each tilted 3-5° — creates natural slight lean. Total lean at top: 10-15° from vertical.
Trunk rings: 12-15 thin disc parts (diameter 2.4, height 0.3) placed every 1.5-2 studs along trunk, Color=RGB(100,80,45) — palm node rings
Fronds (8-10 per tree): each frond = flat elongated wedge part, 12-16 studs long × 2 studs wide × 0.3 studs thick, Material=LeafyGrass, Color=RGB(60,130,45)
  Arrange fronds radiating from trunk top, each tilted 20-40° downward, evenly spaced around 360°
  Coconuts (optional): 3-5 sphere parts, diameter 1.2 studs, Color=RGB(100,80,30), clustered at base of fronds

--- BIRCH TREE ---
Trunk: cylinder, diameter 1.8 studs, height 16-20 studs, Material=SmoothPlastic or Wood, Color=RGB(220,215,205) — white
  Bark markings: 8-12 thin horizontal rectangle parts (3-4 studs wide × 1 stud tall × 0.1 studs deep), Color=RGB(50,40,30) dark, placed at random heights around trunk circumference
Canopy: more open than oak — 2-3 irregular sphere parts, diameter 10-14 studs, Color=RGB(120,160,55) bright spring green, positioned with gaps between them
Branch structure: more visible than oak — 4-6 thin branches (diameter 0.5, length 6-10 studs)

--- WILLOW TREE ---
Trunk: cylinder, diameter 4 studs, height 14-18 studs, Material=Wood, Color=RGB(90,70,45), slight lean 5-8°
Main branches: 6-8 large branches (diameter 1.5, length 8-12 studs) spreading wide and upward from trunk top, then immediately drooping
Hanging fronds: 20-30 thin cylinder parts (diameter 0.3, length 6-12 studs) hanging from branch ends and trunk top, Material=LeafyGrass, Color=RGB(100,150,55), completely vertical
  Cluster 3-5 fronds per attachment point, slightly offset positions

--- DEAD / BARE TREE ---
Trunk: cylinder, diameter 2.5 studs, height 15-20 studs, Material=Wood, Color=RGB(85,75,65) — grey-brown
Branches: 4-6 irregular branches, no leaves. Branches fork 1-2 times. Branch diameter: 0.6 base, 0.3 tips
Material: Wood, Color=RGB(80,70,60)
Optional: 1-2 branches broken off mid-length, leaning at 45° with lower end touching ground
Used in: wasteland, swamp, autumn forest edges, horror biomes

--- BUSH ---
Standard bush: sphere or slightly flattened sphere, diameter 3-6 studs, Material=LeafyGrass
  Color options: RGB(60,100,40), RGB(45,85,30), RGB(70,110,50)
  Place 1-3 overlapping spheres of slightly different sizes for natural shape
  Base: 0.5-stud-tall cylinder (diameter = 60% of main sphere) as ground connection
Flowering bush: same structure but add 15-25 tiny sphere parts (diameter 0.4) on canopy surface as flowers
  Flower colors: RGB(230,80,80) red, RGB(240,180,20) yellow, RGB(200,120,200) purple, RGB(245,245,200) white

--- TALL GRASS CLUMP ---
3-8 thin cylinders or flattened wedge parts per clump
  Cylinder: diameter 0.2-0.3, height 2-4 studs, Material=LeafyGrass
  Color: RGB(120,155,55) green or RGB(175,160,75) dry yellow
  Each blade tilts randomly 5-20° from vertical, random rotation around Y
  Clump footprint: 1.5-3 stud diameter
  Placement density: 1 clump per 6-10 studs² in grassland, 1 per 3-4 studs² near water

--- FLOWER ---
Stem: thin cylinder, 0.15 diameter, 1.5-2.5 studs tall, Material=LeafyGrass, Color=RGB(60,120,40)
Leaves: 2 small flat parts (1x0.3x0.5), angled 45° outward from stem at mid-height
Petals: 5-6 flat parts (0.8x0.4x0.1) arranged radially at stem top, angled 15-30° upward
  Petal colors: red RGB(210,50,40), yellow RGB(235,200,20), purple RGB(160,60,180), white RGB(245,245,245), pink RGB(235,130,160)
Center: sphere, diameter 0.5, Color=RGB(200,170,30) yellow center
Individual flowers placed randomly, facing random Y rotations, grouped 3-8 per patch

--- MUSHROOM ---
Small (1-2 stud cap diameter):
  Stalk: cylinder 0.3x0.3x0.8, Material=SmoothPlastic, Color=RGB(220,210,195) cream
  Cap: sphere flattened to Y scale 0.5, diameter 1-2 studs, Material=SmoothPlastic, Color=RGB(180,40,30) red or RGB(140,80,40) brown
  White spots: 3-5 sphere parts (diameter 0.15), Color=RGB(245,245,245), embedded in cap surface

Large (8-20 stud cap diameter):
  Stalk: cylinder 2x2x6-8 studs, Color=RGB(200,190,175)
  Cap: sphere scaled Y=0.4 to Y=0.6, diameter 8-20 studs
  Gills underneath cap: 8-12 thin flat parts radiating inward from cap edge, Color=RGB(180,165,150)

--- CORAL ---
Construction: irregular stump cluster. 4-8 cylinders of varying heights (2-8 studs) and diameters (0.5-2 studs), branching at tops with 2-3 child cylinders each
  Material: SmoothPlastic (hard coral) or ForceField (soft glow coral)
  Colors: RGB(220,100,50) orange, RGB(200,60,120) pink, RGB(80,150,200) blue, RGB(50,180,130) teal
  All coral parts castShadow=false (underwater, no shadows needed)

--- SEAWEED ---
Tall cylinder, 0.5x0.5x10-20 studs, Material=LeafyGrass, Color=RGB(30,120,55)
Slight tilt: 5-15° lean suggesting current direction
Thin leaf parts at intervals: 8-10 flat parts (2x0.5x0.2) branching from main stalk every 2 studs, alternating sides
Dense clusters: 4-8 stalks per cluster, spaced 0.5-1 stud apart

--- CACTUS ---
Barrel cactus: cylinder, diameter 3-4 studs, height 4-6 studs, Material=LeafyGrass, Color=RGB(80,120,55) blue-green
  Ribs: 8-10 thin vertical wedge parts on surface, height = cactus height, width 0.3, depth 0.2
  Spines: tiny white cylinder parts (0.1 diameter, 0.4 long) radiating from ribs

Saguaro cactus:
  Main trunk: cylinder 2 diameter × 10-15 studs tall, Color=RGB(75,115,50)
  Arms: 2-4 cylinder branches, 1.5 diameter, 6-8 studs long, branching from trunk at 4-8 stud height
    Each arm: first segment horizontal 3 studs, then upward vertical 5-6 studs (L-shape)
  Ribbing: thin vertical strips on all surfaces

--- VINE ---
Construction: chain of thin cylinder parts (0.2 diameter, 2-3 studs long) linked end-to-end
  Random angular deviation per segment: 10-25° from previous direction
  Material=LeafyGrass, Color=RGB(55,100,35)
  Leaf nodes: small sphere (diameter 0.5) attached every 3rd cylinder, Color=RGB(65,120,40)
  Vines drape vertically from trees and cliff faces, can wrap around trunks with helical placement

--- FALLEN LOG ---
Trunk: cylinder, diameter 2-4 studs, length 12-20 studs, Material=Wood, Color=RGB(80,58,38)
  Slightly sunk into ground: 0.3-0.5 studs below terrain surface
  Rotated randomly in horizontal plane, tilted 0-8° from horizontal
Moss covering: thin semi-cylinder (half-pipe shape) of LeafyGrass color on top side, transparency 0, Color=RGB(55,95,40)
Mushrooms growing on log: 3-6 small mushrooms along log length

--- STUMP ---
Cylinder: diameter 4-6 studs, height 2-3 studs, Material=Wood, Color=RGB(90,65,40)
Growth rings on top: concentric circle line decals or 5-7 thin disc parts of slightly alternating color
Bark texture: 6-8 thin vertical strip parts on side, slight ridges
Moss on top: LeafyGrass flat part
Broken branch remains: 1-2 short (2-3 stud) cylinder stubs at various angles from top edge

--- FOREST DENSITY REFERENCE ---
Sparse (open woodland): 1 tree per 40x40 studs = 0.000625 trees/stud²
Medium (forest): 1 tree per 20x20 studs = 0.0025 trees/stud²
Dense (thick forest): 1 tree per 10x10 studs = 0.01 trees/stud²
Very dense (jungle): 1 tree per 6x6 studs = 0.028 trees/stud²

Random placement within zone:
  for i = 1, treeCount do
    local x = zoneX + math.random() * zoneWidth
    local z = zoneZ + math.random() * zoneDepth
    local groundY = getGroundHeight(x, z)
    placeTree(x, groundY, z, randomTreeType())
  end

--- VEGETATION PLACEMENT RULES ---
1. Never place trees in water (check Y position against water level)
2. Never place trees on slope >50° (check neighboring point height difference)
3. Trees get shorter at higher elevation (multiply height by 1 - elevation/maxElevation * 0.4)
4. Randomize each tree's scale: baseScale * (0.85 + math.random() * 0.30) — ±15-30% variation
5. Randomize rotation: math.random() * 360 degrees around Y axis
6. Cluster same tree species: use biased random within cluster radius 15-25 studs, then new cluster center
7. Place underbrush (bushes, ferns) at 3× the density of trees
8. Tall grass fills open gaps between trees and rocks
`

export const TERRAIN_WEATHER: string = `
=== WEATHER EFFECTS ===

--- RAIN ---
Primary emitter: large invisible Part (400x400 studs, 1 stud thick, Material=Air or Transparency=1) placed 80 studs above ground center
ParticleEmitter properties:
  Texture: rbxassetid://6735840888 (raindrop line texture) or generate with thin white line
  Rate: 400 (light rain) / 800 (moderate) / 1500 (heavy rain)
  Speed: NumberRange.new(40, 55) — fast downward
  Rotation: 0
  SpreadAngle: Vector2.new(5, 5) — very slight spread
  Lifetime: NumberRange.new(0.8, 1.4)
  Size: NumberSequence — 0.1 at birth, 0.1 through life, 0 at end
  LightInfluence: 0.2
  LockedToPart: false (falls with world gravity)
  VelocityInheritance: 0
  Acceleration: Vector3.new(0, -8, 0)
  Color: ColorSequence RGB(180,200,225) — light blue-grey

Rain atmosphere changes:
  Atmosphere.Density: increase to 0.45 (from biome default)
  Atmosphere.Haze: increase by 1.0
  FogEnd: reduce by 40%
  Ambient: desaturate and darken by 15%

Rain puddles: spawn flat transparent parts (diameter 2-5, height 0.05) on ground surfaces after rain starts. Slow ripple animation: scale X and Z grow from 0→2 over 1 second, transparency 0→0.8, then remove.

Rain sound: Sound in workspace, rbxassetid for rain ambience, Volume=0.7, RollOffMaxDistance=0 (global sound)

Wet surfaces: use SurfaceAppearance.Roughness reduction on visible surface materials, or place semi-transparent flat parts over surfaces (Color=RGB(100,130,160), Transparency=0.7)

--- SNOW ---
ParticleEmitter properties (attach to overhead invisible plane):
  Rate: 60 (light) / 150 (moderate) / 300 (blizzard)
  Speed: NumberRange.new(2, 6)
  SpreadAngle: Vector2.new(25, 25) — wider than rain
  Lifetime: NumberRange.new(4, 8) — slow fall
  Size: NumberSequence — 0.3 to 0.5 — larger flakes
  LockedToPart: false
  Acceleration: Vector3.new(math.sin(time()) * 2, -3, 0) — slight wind sway
  Color: white RGB(245,248,255)
  Rotation: NumberRange.new(0, 360), RotSpeed: NumberRange.new(-20, 20)
  Transparency: NumberSequence 0.1→0.3→0.1

Snow accumulation (visual): over time, spawn flat white cylinder/box parts on horizontal surfaces, starting thin (0.2 studs) and growing to 1-2 studs depth via Tween on Size property

--- FOG ---
Light fog:
  Atmosphere.Density: 0.35, Atmosphere.Haze: 2.5
  FogEnd: 800, FogStart: 200
  FogColor: RGB(200,205,210)

Heavy fog (horror/swamp):
  Atmosphere.Density: 0.65, Atmosphere.Haze: 5.0
  FogEnd: 300, FogStart: 40
  FogColor: RGB(180,185,180)

Rolling ground fog: place several large low-transparency box parts (Transparency=0.6, Color=RGB(220,225,220)) at ground level (Y=0 to Y=3), drift them slowly using Tween or BodyVelocity

--- SANDSTORM ---
Horizontal particle emitter: large plane (400x200 studs) on one side of play area, emitting horizontally
  Rate: 600
  Speed: NumberRange.new(25, 45)
  SpreadAngle: Vector2.new(8, 30) — horizontal spread
  Lifetime: NumberRange.new(1.5, 3)
  Color: ColorSequence RGB(200,170,120) tan
  Transparency: NumberSequence 0.6→0.2→0.6 (opacity spike in middle)
  Size: NumberSequence 0.5→2.0→0.3

Visibility reduction:
  FogEnd: 200
  FogColor: RGB(210,185,140)
  Atmosphere.Density: 0.70
  Atmosphere.Color: RGB(220,195,150)

Screen tint: GUI ColorRect, warm brown tint, transparency 0.7

Sand sound: ambient hissing SFX, Volume=0.5

--- THUNDERSTORM ---
Combines heavy rain (above) plus:

Lightning flash:
  local flash = Instance.new("ColorCorrectionEffect", game.Lighting)
  flash.Brightness = 0
  game:GetService("RunService").Heartbeat:Connect(function()
    if math.random(1, 200) == 1 then -- ~0.5% chance per frame
      local tween = TweenService:Create(flash, TweenInfo.new(0.05), {Brightness = 0.8})
      tween:Play()
      tween.Completed:Wait()
      TweenService:Create(flash, TweenInfo.new(0.1), {Brightness = 0}):Play()
    end
  end)

Thunder sound: delayed after flash (distance estimation: 1 second per 340 studs). Loud rumble SFX.

PointLight in sky: brief Brightness=15, Range=2000, white, duration 0.05 seconds at flash time

--- WIND ---
Wind leaf particles: ParticleEmitter on each tree canopy
  Texture: small leaf sprite (square, leaf-colored)
  Rate: 3-8 leaves per second per tree
  Speed: NumberRange.new(4, 12)
  SpreadAngle: Vector2.new(30, 20)
  Lifetime: NumberRange.new(2, 5)
  Acceleration: Vector3.new(8, -2, 3) — drifts sideways and down

Grass sway script: apply oscillating CFrame rotation to grass clump parts
  local t = tick()
  grassPart.CFrame = baseCFrame * CFrame.Angles(math.sin(t * 2 + offset) * 0.15, 0, math.cos(t * 1.5 + offset) * 0.1)

Wind sound: ambient breeze sound, Volume scales with wind intensity (0.1 light to 0.6 strong)

--- HEAT HAZE ---
Used in: desert, volcanic, summer tarmac
PostProcessing: DepthOfField with slight defocus at mid-range
Alternatively: animate UV scroll on transparent plane above hot surfaces
ColorCorrection: slight desaturation, increase Brightness by 0.1, warm color shift

--- SUNSET / SUNRISE ATMOSPHERE ---
TimeOfDay: "06:30:00" (sunrise) or "19:00:00" (sunset)
Atmosphere.Color: RGB(255,175,100) warm orange
Atmosphere.Density: 0.25
Atmosphere.Haze: 1.8
ColorShift_Top: RGB(255,200,130) warm gold
Ambient: RGB(180,130,80)
OutdoorAmbient: RGB(220,160,90)
FogColor: RGB(230,180,130)

--- NIGHT ATMOSPHERE ---
TimeOfDay: "00:00:00"
Ambient: RGB(20,25,35) — very dark blue
OutdoorAmbient: RGB(30,35,50)
Brightness: 0.15
Atmosphere.Density: 0.20 (clear night)
Stars: ensure Skybox shows stars (dark sky)
Moon glow: PointLight high in sky, Brightness=0.5, Range=5000, Color=RGB(200,210,230)
`

export const TERRAIN_MAP_LAYOUTS: string = `
=== MAP LAYOUTS BY GAME TYPE ===

--- TYCOON MAP ---
Total area: 800x800 studs baseplate (supports 4-6 tycoons with separation)
Per-player zone: 200x200 studs minimum, 260x260 comfortable

Zone layout:
  ┌─────────────────────┐
  │ BUTTON ZONE (front) │ — 30x200 studs, flat, paved
  │ COLLECTION BELT     │ — 10 stud wide conveyor path from production to collection
  │ PRODUCTION AREA     │ — 120x150 stud main build zone
  │ STORAGE / EXIT      │ — rear 40 studs
  └─────────────────────┘

Ground: flat Asphalt or Concrete baseplate, 0 elevation
Zone separation: 20 stud gap between zones, filled with decorative terrain or water
Conveyor paths: 10 stud wide, slight raised edge (1 stud), material Asphalt
Button zones: paved area with clear markers (colored BillboardGui above buttons)
Player spawn: 10x10 stud pad at entrance to each zone, Material=Pavement, Color=RGB(200,200,255) team color
Elevation: zones are completely flat. Optional 2-stud raised platform for main production building.

Zone border markers: 0.5 stud tall strip of colored Metal/SmoothPlastic around zone perimeter
  Color by team: Red zone = RGB(180,40,40), Blue = RGB(40,80,180), Green = RGB(40,160,60), Yellow = RGB(200,180,20)

--- OBBY MAP ---
Total height: 500-2000 studs vertical
Width envelope: 100 stud safe zone radius
Below all platforms: void (workspace.FallenPartsDestroyHeight set to -200)
Spawn: 20x20 stud solid platform, Material=SmoothPlastic, Color=RGB(80,200,80) green

Checkpoint placement: every 10-15 obstacles, CheckpointPart (10x2x10 stud flat glowing platform), Color=RGB(255,220,0) yellow
  Checkpoints must be clearly visible — add BillboardGui "CHECKPOINT" text and PointLight RGB(255,220,0) Brightness=2

Platform types and exact specs:
  Static platform: flat box, 8-20 studs wide × 0.8 studs tall × 8-20 studs deep, various heights
  Moving platform: same as static + BodyPosition/TweenService oscillation, 20-40 stud travel distance
  Spinning platform: circular platform on rotating axle, AngularVelocity 30-90°/sec
  Shrinking platform: TweenService scales from 100% to 30% and back over 3-5 seconds
  Conveyor: platform with SurfaceType=Conveyor, speed 10-30 studs/sec
  Lava floor: flat platform, Material=Neon, Color=RGB(255,80,0), KillBrick script on touch
  Ice platform: Material=Ice or Glacier, AreContainsConnections=false (no friction), very slippery
  Ladder: series of 2-stud-wide × 0.5-stud-deep rungs, spacing 2 studs vertical

Gap distances by difficulty:
  Easy: 4-8 stud gaps, 2-4 stud drops between platforms
  Medium: 8-14 stud gaps, 5-10 stud drops
  Hard: 14-22 stud gaps, 10-20 stud drops, moving targets
  Expert: 22-35 stud gaps, timing required, multiple hazards

Visual biome sections (every 30-50 obstacles):
  Section 1: Grassland (green platforms, trees as background)
  Section 2: Sky/clouds (white cloud-like platforms, blue fog)
  Section 3: Lava world (dark rock platforms, orange glow below)
  Section 4: Ice world (ice blue platforms, snow particles)
  Section 5: Final boss section (dramatic, grand platform, portals)

--- RPG OPEN WORLD ---
Total terrain: 2048x2048 studs
Coordinate origin (0,0,0) = world center

Biome zone map (each zone ~512x512 studs unless noted):
  NW quadrant: Temperate Forest — main starting zone
  NE quadrant: Mountain Range — high-level zone, 200+ stud peaks
  SW quadrant: Swamp/Marsh — mid-level zone
  SE quadrant: Desert — high-level zone
  Center: Main Town / Hub — 200x200 stud paved area

Main Town layout (200x200 studs, centered at 0,0,0):
  Central plaza: 40x40, Pavement, fountain in center
  Market district: east side, 60x60, stalls and buildings
  Residential: north side, 50x80
  Guild hall: west side, prominent 20x30 building
  Dungeon entrance: south side, 10x10 decorated arch portal

Roads connecting zones:
  North road: 12 studs wide, from town north gate to mountain pass at (0, 80, -900)
  East road: from town east to desert town at (900, 0, 0)
  South road: 10 studs wide, curving to swamp village at (-400, 0, 700)
  West road: to forest village at (-700, 0, -200)

Dungeon entrances:
  1 per biome zone, marked by large stone arch (4 studs wide, 6 studs tall, 3 stud span)
  Portal inside = teleport to dungeon interior (separate place)

Resource node placement:
  Forest: trees (harvestable), 200 trees per 512x512 zone
  Mountain: ore veins on cliff faces, 30-50 per zone
  Swamp: herb patches, 40-60 per zone
  Desert: cactus, sandstone deposits, 30 per zone

Spawn location: Town center plaza. SpawnLocation part (10x1x10, Neutral=true)

--- BATTLE ROYALE ---
Island shape: irregular circle, ~1000 stud diameter (500 stud radius from center)
Ocean surrounds island: Terrain Water from radius 500 to 1500

Central zone (radius 0-150):
  High ground: mountain peak 60-80 studs elevation
  Military base or landmark building (50x50 stud compound)

Mid zone (radius 150-350):
  Varied terrain: hills 20-35 studs, valleys, 4-6 named locations
  Named locations: 6-8 clusters of 5-12 buildings, spaced 100-150 studs apart

Outer zone (radius 350-500):
  Mostly flat with scattered small structures
  Beach shore at radius 450-500

Zone shrink markers: glowing ring of PointLights at current safe zone boundary, Neon parts in cyan RGB(0,220,220)

Drop zones / loot tier system:
  Hot zones (high loot, center): military base, large compound
  Medium zones: towns, warehouses
  Cold zones (low loot, perimeter): farmhouses, shacks

Terrain elevation variation: use multi-octave noise
  amplitude1=35 frequency1=250
  amplitude2=15 frequency2=100
  amplitude3=6 frequency3=45
  Combined gives interesting island topography with natural ridgelines

High ground advantage zones: 3-4 hilltops with commanding views (elevation 40-60 studs), provide clear sightlines 200+ studs

--- HORROR MAP ---
Total area: 300x300 studs (claustrophobic, not open world)
Lighting: Ambient RGB(8,8,12) — near total darkness. Single torch/light sources.
Atmosphere: FogEnd=80, FogStart=20, FogColor=RGB(8,10,8) — green-black fog
Brightness: 0.05

Layout type: maze / labyrinth with dead ends
Path width: 8-12 studs (wide enough to run but not safe)
Wall height: 15-20 studs (tall enough to feel enclosed)
Wall material: Concrete or Brick, Color=RGB(35,30,28) — very dark

Key zones:
  Entry area: brief open space 30x30 studs, no cover, sparse trees
  Forest section: dense dead trees (50+ in 100x100 area), paths twist
  Abandoned building: 20x30 stud structure, broken windows, debris inside
  Underground section: 0-30 stud tall ceiling, narrow 6-stud paths, dark
  Final zone: open clearing 40x40, central shrine/objective

Scare placement:
  Jump scare triggers: invisible parts at path corners that play sudden sound
  Ambient creaks: Sound objects on structures, triggered by proximity
  Eye glow in distance: pair of Neon sphere (0.3 diameter) RGB(255,50,0) visible 50 studs away

Path design rules:
  Never straight for more than 20 studs — always curves or corners
  Dead ends every 3-4 intersections (30% of paths lead nowhere)
  At least 2 valid paths to objective (no softlock)
  Checkpoints = lit areas (PointLight Brightness=2, yellow, 1 per major zone cleared)

--- RACING TRACK ---
Track width: 20 studs (standard) / 30 studs (super-wide)
Lap length: 600-1200 studs total path length
Wall height: 4 studs (prevents cars from flying off)
  Wall material: Concrete, Color=RGB(180,175,170)

Turn types and dimensions:
  Gentle turn (sweeping): radius 50-80 studs, arc length 60-100 studs, bank angle 5-12°
  Medium turn: radius 30-50 studs, arc length 50-80 studs, bank angle 10-20°
  Hairpin turn: radius 15-25 studs, 180° turn, arc length 80-120 studs, bank 5-8°
  Chicane: alternating 45° left/right turns over 30-stud section

Banking technique: rotate track segment on local Z axis (lean into curve)
  Bank angle formula: bank = math.atan2(speed², radius * g) in degrees, approx 12-20° for racing

Track surface zones:
  Main track: Asphalt, RGB(50,48,46)
  Pit lane: alongside main straight, Concrete, RGB(160,155,150)
  Run-off area: outside tight corners, Pavement or Sand (slower than asphalt)
  Curbing (rumble strips): alternate red/white 1x1 stud tiles at track edges

Elevation changes:
  Uphill section: 3-8° gradient over 50-100 studs
  Downhill: same gradient, provides speed boost
  Jump ramp: 15-20° ramp over 10 studs, 10-15 stud gap, landing ramp
  Tunnel: enclosed section 12x8 stud internal cross-section, 30-60 studs long

Lap markers: start/finish line = white painted stripe across track width + overhead gantry (arch with BillboardGui "START/FINISH")
  Checkpoint gates: thin arch at every 25% of lap, records progress

--- SIMULATOR MAP ---
Central hub: 100x100 stud area
  Paved (Pavement material), central teleport pads, shop buildings
  Clear visual zones radiating outward
  Entrance clearly marked: large gate arch

Farming zone (200x200 studs, offset north):
  Flat terrain, 0 elevation
  Plot grid: 4x4 stud plots arranged in 5x5 grids (25 plots per grid block)
  Path between plot blocks: 3 stud dirt trail
  Irrigation channel: 2 stud wide water strip along zone edge
  Barn building: 20x15 stud, WoodPlanks material, red Color=RGB(160,30,20)

Mining zone (200x200 studs, offset east):
  Terrain: rough, 0-20 stud elevation hills
  Ore nodes: Rock sphere clusters (3-5 spheres, 2-4 stud diameter each), colored by ore type
    Iron: RGB(130,120,110) grey
    Gold: RGB(200,160,30) gold
    Crystal: RGB(80,180,255) blue Neon
  Mine entrance: tunnel 6x6 stud entrance cut into hillside

Fishing zone (west, adjacent to water body):
  Lake 100x80 studs
  Dock: wooden boardwalk extending 15 studs into lake
  Fishing spots: marked circles at dock end (ColorPart rings)

Combat/dungeon zone (south, 150x150 studs):
  Enclosed area with walls 8 studs tall
  Monster spawn pads: glowing red circles (flat PointLight parts)
  Boss chamber: central 30x30 stud room with dramatic lighting (red PointLights)

Teleport system between hub and zones:
  Hub pads: 4x4 stud glowing platform per zone (Neon material, zone color)
  Destination pads: matching colors at zone entry points

--- TOWER DEFENSE MAP ---
Path design: single winding path from enemy spawn to player base
Path width: 8 studs — enemies walk in, towers shoot from sides
Total path length: 300-600 studs
Turns: 6-10 direction changes, each 45° or 90°

Path elevation changes:
  Include 1-2 elevated sections (10-20 stud tall ramp) — forces towers to aim differently
  1 underground tunnel section (optional, limits tower placement above)

Tower placement zones: flat areas BESIDE the path
  Width: 20-30 studs on each side
  Material: Grass or Pavement, flat
  Tower slot indicators: 4x4 stud pads, Color=RGB(80,200,80) green when available

Enemy spawn: large glowing red area, 30x30 studs. BillboardGui "ENEMY SPAWN"
Player base: 20x20 stud structure at path end. Must be visible from path to motivate defense.

Path material: Asphalt (enemies are always visible)
Path borders: 1-stud raised edge of Concrete preventing enemy escape

Checkpoint checkmarks: at each path turn, large marker (flag/pole) lets players estimate wave position

--- SURVIVAL MAP ---
Island progression: concentric difficulty rings
  Ring 1 (radius 0-80): Beach + Fishing — safe starting zone, coconuts, fish
  Ring 2 (radius 80-200): Forest — wood, berries, small animals, wolf spawn
  Ring 3 (radius 200-350): Highland forest — iron ore, caves, bears
  Ring 4 (radius 350-500): Mountain peak — rare crystals, dragons, extreme cold

Beach zone details:
  Width: 25-35 studs of Sand before forest begins
  Coconut palms: 1 every 15 studs along beach, see Palm Tree construction above
  Drift wood: 3-6 fallen logs on beach
  Tide pools: small rock depressions (2-4 stud diameter), Terrain Water, fish visible

Forest zone:
  Mixed oak/pine/birch, medium density (1 per 20x20 stud)
  Herb patches: 8-12 per 100x100 stud area (flowers in specific colors = collectible)
  Cave entrances: 1 per 80x80 stud area — small arched opening (5x4 stud arch in hillside)
  Campfire site suggestion: cleared 10x10 area with pre-built fire pit (ring of rocks, wood pile)

Highland zone:
  Rocky terrain: 30-50 stud hills, Rock material replacing Grass above elevation 30
  Ore veins (visual): discolored patches of terrain or clusters of colored sphere parts in cliff faces
  Bear spawn pads (flat ground areas): 5x5 stud markers in forest clearings

Mountain peak:
  Above elevation 100: Snow material
  Above elevation 150: Ice/Glacier
  Peak elevation: 200-250 studs
  Dragon nest: flat 15x15 stud area of Basalt at peak, surrounded by bones (white cylinder parts)

Water sources:
  River runs from mountain (elevation 120) to beach (elevation 0)
  Width 10 studs at source, 25 studs at coast
  4 fishing spots along river (marked by signs or flat platforms)

Spawn point: beach, east side, SpawnLocation 10x1x10 with BillboardGui "START"
`

export const TERRAIN_LANDSCAPE_BIBLE: string = `
========================================
TERRAIN & LANDSCAPE BIBLE v1.0
ForjeGames AI Knowledge System
========================================

${TERRAIN_BIOMES}

${TERRAIN_WATER}

${TERRAIN_ELEVATION}

${TERRAIN_PATHS}

${TERRAIN_VEGETATION}

${TERRAIN_WEATHER}

${TERRAIN_MAP_LAYOUTS}

=== GENERAL TERRAIN RULES ===

1. MINIMUM PART COUNT: Natural terrain zones use minimum 30 parts. Do not represent a forest with 3 trees.
2. SCALE REFERENCE: 1 stud = approximately 0.28 meters (28cm). Average Roblox character is 5 studs tall (1.4m). Use this when designing realistic environments.
3. MATERIAL RULES:
   - NEVER use SmoothPlastic for terrain, ground, rocks, soil, or natural surfaces. Use Concrete, Rock, Slate, Wood, Grass, LeafyGrass, Ground, Mud, Sand, Sandstone, Basalt, CrackedLava, Ice, Snow, Glacier, Limestone.
   - SmoothPlastic only for: manmade objects, signs, UI elements, artificial surfaces.
   - Neon material: sparingly for glowing effects (lava, crystals, lights, bioluminescence). NOT for regular terrain.
4. COLOR VARIATION: Do not use the same exact RGB for every tree or every rock. Introduce ±10-15 RGB variation per instance using math.random(-12, 12) offset on each channel.
5. PERFORMANCE:
   - Use Unions for complex shapes that are static (rocks, logs, ruins)
   - Use Models with PrimaryPart for moving objects
   - Anchor all static terrain parts (Anchored=true)
   - CanCollide=false for decorative foliage (small flowers, grass, particles)
   - Use LOD: place high-detail props (bark texture parts, rock crevice details) only within 100 studs of likely player paths
6. TERRAIN vs PARTS:
   - Roblox Terrain voxels (FillBlock/FillCylinder): best for large open terrain, ground surface, water bodies
   - Part-based: best for specific details, stylized/low-poly look, precise control, props and vegetation
   - Mixed approach: use Terrain for ground layer + Parts for all props, structures, and detailed features
7. LIGHTING APPROACH:
   - Always set Lighting.Ambient, Lighting.OutdoorAmbient, Lighting.Brightness
   - Always configure Atmosphere object (Density, Haze, Color, Offset, Decay)
   - FogEnd and FogStart should match biome distance/visibility expectations
   - TimeOfDay string format: "HH:MM:SS" — use 24h format
   - ShadowSoftness: 0.15 (sharp outdoor) to 0.50 (overcast/diffuse)
8. SKYBOX: choose SkyboxBk/Dn/Ft/Lf/Rt/Up textures matching biome sky color. If no custom skybox, set Sky colors via Atmosphere to approximate desired mood.
9. AUDIO ZONES: place Sound objects inside invisible Parts at key locations. Use RollOffMaxDistance to define audible radius. Loop=true for ambient sounds. Ambient sounds per biome are essential for immersion.
10. TRANSITION ZONES: between biomes, create a 30-50 stud blending zone where both biome materials and props are mixed. Trees from both biomes, terrain colors average between both palettes. Never abrupt cutoffs.

=== QUICK REFERENCE: PART DIMENSIONS ===

Oak Tree total height: 20-25 studs (trunk 18-22 + canopy center sphere adds height)
Pine Tree total height: 26-35 studs
Palm Tree total height: 22-28 studs
Birch Tree total height: 18-23 studs
Willow Tree total height: 18-24 studs
Bush height: 2-5 studs
Tall grass height: 2-4 studs
Mushroom (small): 1.5-3 studs total height
Mushroom (large): 8-20 studs total height
Player character height: 5 studs
Standard door: 4 studs tall × 2.5 studs wide
Standard wall: 10 studs tall
Standard room interior: 10-12 studs ceiling height

=== PATH WIDTH REFERENCE ===
Foot path (1 person):      3-4 studs
Foot path (2 people):      5-6 studs
Cart/vehicle track:        8-10 studs
1-lane road:               10-12 studs
2-lane road:               18-22 studs
4-lane highway:            28-34 studs
Boardwalk/pier:            4-8 studs
Railway:                   6-8 studs between rail centers
Cobblestone plaza:         free-form, typically 20-60 stud span

=== WATER DEPTH REFERENCE ===
Puddle:                0.1-0.3 studs
Stream:                0.5-1.5 studs
Ford/crossing:         1.5-2.5 studs
Shallow river:         2-4 studs
Deep river:            4-8 studs
Lake shallow zone:     1-3 studs (within 10 studs of shore)
Lake deep zone:        6-15 studs
Ocean shallow:         2-10 studs
Ocean deep:            50-200 studs
Waterfall plunge pool: 4-8 studs deep, radius = fall height/3

=== ELEVATION QUICK REFERENCE ===
Sea level:          Y = 0
Beach:              Y = 0 to 3
Low terrain:        Y = 0 to 20
Rolling hills:      Y = 20 to 60
Hills:              Y = 60 to 100
Mountain base:      Y = 100 to 150
Mountain mid:       Y = 150 to 250
Mountain peak:      Y = 250 to 400
Snow line:          Y = 150 (temperate) / Y = 80 (polar)
Tree line:          Y = 120 (no trees above this in alpine biome)
Cloud layer (low):  Y = 100-150 (for cloud forest biome)
Sky platform min:   Y = 200 (floating islands)

=== SECTION: ROCK & BOULDER CONSTRUCTION ===

Natural rocks are critical for breaking up flat terrain and adding visual interest.
NEVER use a single sphere for a rock. Always cluster 3-7 pieces.

--- SMALL ROCK CLUSTER (diameter 2-6 stud spread) ---
  Part 1: sphere, diameter 2.5, slight tilt CFrame.Angles(0.3, 0.7, -0.2), Material=Rock, Color=RGB(120,110,100)
  Part 2: sphere, diameter 1.8, offset +1.2 X +0.3 Y +0.8 Z, CFrame.Angles(-0.2, 1.1, 0.4), same material, Color=RGB(130,120,108)
  Part 3: sphere, diameter 1.2, offset -0.8 X +0.1 Y +1.2 Z, slightly darker
  Partially sink into ground: Y offset = -0.3 to -0.6 studs (rocks look embedded)

--- MEDIUM BOULDER (4-10 stud diameter equivalent) ---
  Core: sphere diameter 5, Material=Rock, Color=RGB(110,105,98)
  Top slab: flattened sphere (scale Y=0.4) diameter 4, placed on top, slight CFrame offset
  Crack lines: thin (0.1 stud) dark wedge parts running diagonally across face
  Lichen: flat LeafyGrass parts (1x1, transparency 0) randomly on top and north face
  Sink depth: -0.8 to -1.5 studs into terrain

--- LARGE ROCK FORMATION (10-25 stud spread) ---
  Central mass: irregular cluster of 3-4 large spheres (diameter 6-10) merging together
  Flanking rocks: 4-6 medium rocks around base
  Vertical faces: achieved by using box parts (flattened, tilted 80-85° from horizontal) leaning against sphere cluster
  Colors vary: RGB(100,95,88) darkest crevice fill, RGB(140,130,120) sunlit faces
  Moss pockets: LeafyGrass color patches in shaded areas (RGB 55,95,42)

--- ROCK WALL / NATURAL STONE WALL ---
  Height: 3-8 studs
  Construction: stack irregular box parts (width varies 2-5 studs, height 0.8-1.5, depth 1-2 studs)
  Slight offset each row: +/-0.2 studs horizontal
  Color variation per stone: RGB(115,105,95) to RGB(145,135,125)
  Capstones: slightly larger/taller stones on top row
  Gaps: occasional 0.2-0.4 stud gap between some stones (dark Material inside)

--- CLIFF FACE DETAIL TECHNIQUE ---
Step 1: Main cliff body — large solid blocks of Rock/Slate material
Step 2: Surface variation — glue flat box parts (0.3-0.8 stud thick) onto face at random positions, creating ledge and recess variation
Step 3: Horizontal fracture lines — thin dark boxes (0.1 stud tall) running across face at irregular height intervals (every 4-8 studs)
Step 4: Vertical crack network — thin parts (0.1 stud wide) running diagonally or vertically 10-30 studs
Step 5: Rock fall debris — 8-15 small/medium rocks at cliff base (talus pile)
Step 6: Vegetation: grass tufts and flowers on ledges wider than 1 stud
Step 7: Water seep: thin transparent parts on cliff face after rain

=== SECTION: RUINS & ANCIENT STRUCTURES ===

Ruins add history and visual interest to natural environments.

--- STONE RUIN WALLS ---
Original wall height: 8-15 studs. Ruined: partially collapsed.
Crumbling top: instead of flat wall top, use randomly removed blocks and irregular stepped pattern at top
  Remove 20-40% of top layer blocks
  Some blocks tilted 10-30° from original position
  Some blocks fallen: same material blocks on ground near wall base, tilted 30-70°
Material: Limestone, Rock, Slate, Concrete depending on era
Color: RGB(155,145,130) aged stone, RGB(130,120,108) darker weathered sections
Moss coverage: LeafyGrass color flat parts covering 30-60% of exposed stone surfaces

--- COLLAPSED ARCHWAY ---
Original arch span: 6-10 studs, height 7-10 studs
Construction of ruins:
  One standing pier (4x3x7 stud rectangle block, Material=Limestone)
  One partially standing pier (same, but 60% height, top broken off)
  Collapsed keystone blocks: 3-5 arch stones lying on ground, scattered 3-8 studs from arch base
  Rubble pile: smaller sphere/box parts (diameter 0.4-1.5) at base of both piers and scattered around

--- BROKEN COLUMNS ---
Full column: cylinder 1.5 diameter × 12 studs tall, Material=Limestone, Color=RGB(195,185,170)
Capital: flattened cylinder (diameter 3, height 0.8) at top
Base: flattened cylinder (diameter 2.5, height 0.6) at bottom
Broken version:
  Lower section: keep bottom 4-6 studs standing
  Top section: rotated 45-90° and resting on ground 2-5 studs from base
  Crack at break point: dark thin parts at fracture
Fallen column: entire cylinder horizontal on ground, sunk 0.3 studs into terrain

--- ANCIENT TEMPLE PLATFORM ---
3 rising tiers:
  Base tier: 40x40x2 stud platform, Limestone, Color=RGB(180,170,155)
  Mid tier: 28x28x2.5 stud, offset slightly, darker RGB(165,155,140)
  Top tier: 18x18x3 stud, darkest RGB(150,140,128)
Stairs: on each side, 8-step staircase descending from top to base
  Each step: 2 studs deep × 0.6 studs tall × 5 studs wide
Columns at corners: 4 per tier level, full or broken (ruined version: 2-3 broken)
Altar at peak: 4x4x1.5 stud central stone block, slightly elevated

=== SECTION: ENVIRONMENTAL STORYTELLING PROPS ===

These small details make environments feel lived-in and real.

--- CAMPFIRE ---
Ring of 6-8 rocks: sphere parts (diameter 0.8-1.2), arranged in 2.5 stud radius circle
Log pile inside ring: 2-3 short cylinder segments (diameter 0.6, length 2.5), arranged in X pattern
Ash layer: flat circle (diameter 3, height 0.1), Color=RGB(80,75,70), Material=Concrete
Fire (active): ParticleEmitter or BillboardGui flame texture at log center
  If using parts: orange/yellow Neon sphere (diameter 0.8), PointLight Brightness=4 Range=15 Color=RGB(255,120,30)
Smoke: ParticleEmitter upward, grey-white particles, Rate=8, speed 2-4 up

--- ABANDONED CART ---
Frame: 4 flat box parts forming rectangle (8x4x0.3 studs total), WoodPlanks material
Wheels: 4 cylinder parts (diameter 2.5, depth 0.4), Color=RGB(70,50,30) WoodPlanks, with hub sphere
Axles: 2 cylinder parts connecting wheel pairs, diameter 0.3
Tilted: rotate entire cart 8-15° off-level (broken wheel implied)
Contents: optionally add crates/sacks inside cart bed

--- WOODEN FENCE ---
Posts: 0.4x0.4x3 stud cylinders (or boxes), every 4 studs, Material=WoodPlanks, Color=RGB(110,80,50)
Rails: 2 horizontal rails between posts (0.3x0.3x4 stud cylinders), at heights 1 and 2.3 studs
Corner posts: slightly larger (0.6 diameter)
Broken sections: rotate 1-2 rails to be angled 15-45°, tip 1-2 posts to 30° lean

--- GRAVESTONE ---
Base: box 1.5x0.3x0.6 studs, Material=Limestone, Color=RGB(160,155,148)
Stone: box 1x0.3x1.8 studs (wider at base tapering option using wedge), same material
Rounded top: half-sphere or wedge arrangement at stone top
Inscription: decal or BillboardGui with faded text (low transparency)
Lean: tilt 5-15° off vertical — aged gravestone
Optional cross shape: two thin planks or stone parts in cross formation instead of slab

--- WELL ---
Base ring: 8-12-sided polygon approximation using box parts (or cylinder, diameter 4, wall 0.5, height 1.5)
Material: Limestone or Brick
Well depth: 8-12 studs below base ring (dark interior)
Rope/chain: thin cylinder parts or chain link model hanging from crossbar
Crossbar: horizontal cylinder (0.4 diameter × 6 studs), mounted on two 1x1x3 wooden supports
Bucket: small box (1.5x1.5x1.2) attached to rope bottom
Water inside: flat transparent part at Y = -8, dark blue-grey

--- SCARECROW ---
Body: cylinder or box (0.6x0.6x5 studs tall), WoodPlanks material (post), wearing BillboardGui or part-based clothes
Arms: horizontal cylinder through body at shoulder height (0.4 diameter × 4 studs each side)
Head: sphere (diameter 1.8) on top, Color=RGB(195,165,85) burlap-like beige
Hat: flat cylinder (diameter 2.5, height 0.3) + smaller cylinder hat band

=== SECTION: DAY/NIGHT CYCLE REFERENCE ===

TimeOfDay string format: "HH:MM:SS"

Dawn (05:00-06:30):
  Ambient: RGB(100,90,100) dark cool purple
  OutdoorAmbient: RGB(150,120,100) warm pink
  Atmosphere.Color: RGB(230,170,120) warm pink-orange
  Brightness: 0.9
  FogColor: RGB(200,160,130)

Morning (06:30-09:00):
  Ambient: RGB(120,120,110)
  OutdoorAmbient: RGB(180,170,150)
  Atmosphere.Color: RGB(220,210,190)
  Brightness: 1.4

Midday (11:00-14:00):
  Ambient: RGB(140,145,140)
  OutdoorAmbient: RGB(210,210,200)
  Atmosphere.Color: RGB(200,210,220) neutral cool
  Brightness: 2.2-2.8

Afternoon (15:00-17:30):
  Ambient: RGB(150,135,115)
  OutdoorAmbient: RGB(220,195,160) warm gold
  Atmosphere.Color: RGB(225,205,170)
  Brightness: 1.8

Sunset (17:30-19:30):
  Ambient: RGB(140,100,70)
  OutdoorAmbient: RGB(230,150,80)
  Atmosphere.Color: RGB(255,160,80)
  Brightness: 1.2
  FogColor: RGB(235,170,110)

Dusk (19:30-21:00):
  Ambient: RGB(60,60,80)
  OutdoorAmbient: RGB(90,80,110)
  Brightness: 0.5

Night (21:00-04:00):
  Ambient: RGB(20,22,30)
  OutdoorAmbient: RGB(30,32,45)
  Brightness: 0.12-0.18
  FogEnd: 600 (dark limits visibility)

=== SECTION: LUAU TERRAIN GENERATION SCRIPTS ===

--- BASIC HEIGHTMAP GENERATOR ---
  local TERRAIN = workspace.Terrain
  local RESOLUTION = 4 -- studs per voxel
  local WIDTH = 512
  local DEPTH = 512
  local BASE_Y = -20

  local function getHeight(x, z)
    return BASE_Y
      + 30 * math.sin(x/90)  * math.cos(z/75)
      + 12 * math.sin(x/35 + 1.2) * math.cos(z/40 + 0.8)
      + 5  * math.sin(x/18 + 2.5) * math.cos(z/15 + 1.9)
  end

  local function getMaterial(y)
    if y < 2  then return Enum.Material.Sand
    elseif y < 20 then return Enum.Material.Grass
    elseif y < 40 then return Enum.Material.LeafyGrass
    elseif y < 60 then return Enum.Material.Ground
    elseif y < 90 then return Enum.Material.Rock
    elseif y < 120 then return Enum.Material.Slate
    else return Enum.Material.Snow
    end
  end

  for x = -WIDTH/2, WIDTH/2, RESOLUTION do
    for z = -DEPTH/2, DEPTH/2, RESOLUTION do
      local h = getHeight(x, z)
      local mat = getMaterial(h)
      local center = CFrame.new(x, (BASE_Y + h) / 2, z)
      local size = Vector3.new(RESOLUTION, h - BASE_Y, RESOLUTION)
      TERRAIN:FillBlock(center, size, mat)
    end
    task.wait() -- prevent timeout on large maps
  end

--- TREE FOREST GENERATOR ---
  local function placeTree(x, y, z, treeType)
    local model = Instance.new("Model")
    model.Name = treeType .. "Tree"
    model.Parent = workspace.Trees

    if treeType == "Oak" then
      -- Trunk
      local trunk = Instance.new("Part")
      trunk.Size = Vector3.new(3, 20, 3)
      trunk.CFrame = CFrame.new(x, y + 10, z)
      trunk.Material = Enum.Material.Wood
      trunk.Color = Color3.fromRGB(85, 60, 38)
      trunk.Anchored = true
      trunk.Parent = model
      -- Canopy
      local canopy = Instance.new("Part")
      canopy.Shape = Enum.PartType.Ball
      canopy.Size = Vector3.new(24, 22, 24)
      canopy.CFrame = CFrame.new(x, y + 26, z)
      canopy.Material = Enum.Material.LeafyGrass
      canopy.Color = Color3.fromRGB(55 + math.random(-12,12), 95 + math.random(-10,10), 38 + math.random(-8,8))
      canopy.Anchored = true
      canopy.CanCollide = false
      canopy.Parent = model
    end
    return model
  end

  -- Place forest
  local ZONE_X, ZONE_Z = -200, -200
  local ZONE_W, ZONE_D = 400, 400
  local SPACING = 20 -- medium density
  for x = ZONE_X, ZONE_X + ZONE_W, SPACING do
    for z = ZONE_Z, ZONE_Z + ZONE_D, SPACING do
      -- Add jitter
      local jx = x + math.random(-8, 8)
      local jz = z + math.random(-8, 8)
      local groundY = getGroundHeight(jx, jz)
      placeTree(jx, groundY, jz, "Oak")
    end
  end

--- RIVER PATH GENERATOR ---
  -- Define river waypoints
  local waypoints = {
    Vector3.new(-200, 0, -300),
    Vector3.new(-150, 0, -200),
    Vector3.new(-80,  0, -150),
    Vector3.new(-20,  0, -100),
    Vector3.new(40,   0, -20),
    Vector3.new(80,   0, 60),
    Vector3.new(100,  0, 150),
  }

  local RIVER_WIDTH = 25
  local RIVER_DEPTH = 5
  for i = 1, #waypoints - 1 do
    local p1 = waypoints[i]
    local p2 = waypoints[i + 1]
    local center = (p1 + p2) / 2
    local length = (p2 - p1).Magnitude
    local cf = CFrame.lookAt(center, p2) * CFrame.new(0, -RIVER_DEPTH/2, 0)
    workspace.Terrain:FillBlock(cf, Vector3.new(RIVER_WIDTH, RIVER_DEPTH, length + 2), Enum.Material.Water)
  end

--- CLOUD LAYER GENERATOR ---
  local function spawnCloud(x, y, z)
    local cloud = Instance.new("Part")
    cloud.Size = Vector3.new(
      math.random(30, 80),
      math.random(8, 18),
      math.random(25, 60)
    )
    cloud.CFrame = CFrame.new(x, y, z)
    cloud.Material = Enum.Material.SmoothPlastic
    cloud.Color = Color3.fromRGB(240, 245, 255)
    cloud.Transparency = 0.65 + math.random() * 0.15
    cloud.Anchored = true
    cloud.CanCollide = false
    cloud.CastShadow = false
    cloud.Parent = workspace.Clouds
    -- Drift script
    local bodyVel = Instance.new("BodyVelocity", cloud)
    bodyVel.Velocity = Vector3.new(math.random(1,3), 0, math.random(-1, 1))
    bodyVel.MaxForce = Vector3.new(math.huge, 0, math.huge)
  end

  for i = 1, 30 do
    spawnCloud(
      math.random(-400, 400),
      math.random(100, 140),
      math.random(-400, 400)
    )
  end

=== SECTION: BIOME TRANSITION TECHNIQUE ===

Transitions between adjacent biomes should never be abrupt. Apply a blend zone 30-50 studs wide.

BLEND ZONE RULES:
1. Terrain material: use both biome materials in 50/50 random patches within blend zone
   Implementation: for each voxel in blend zone, if math.random() > 0.5 then use biome A material else biome B material
2. Vegetation: place trees from both biomes, with biome A density fading from 100% to 0% across zone width, biome B density fading 0% to 100%
   Formula: biomeA_prob = 1 - (distFromBiomeA / blendWidth), biomeB_prob = distFromBiomeA / blendWidth
3. Color palette: lerp between biome color palettes based on distance into blend zone
4. Atmosphere: cannot blend Atmosphere properties directly. Place at boundary. Use FogEnd to hide sharp Atmosphere change.
5. Vegetation edge: taller trees of biome A cast shadows into biome B for 10-20 studs, creates natural shading edge
6. Water features: rivers serve as natural biome boundaries (forest on one bank, savanna on other is believable)
7. Road/path as boundary: paved path can mark transition point, one side forest one side town

EXAMPLE TRANSITIONS:
  Forest → Mountain: trees thin out, ground transforms from LeafyGrass to Ground to Rock over 40 studs, boulders increase
  Beach → Forest: sand fades, first plants are beach grass then dune shrubs then coastal trees then full forest canopy
  Desert → Oasis: abrupt 20-stud transition acceptable here (oasis is dramatic contrast)
  Swamp → Forest: ground dries from Mud to Ground, water pockets decrease, trees change from bald cypress to oaks
  Snow → Alpine rock: Snow material, tree line ends, pure rock fields for 30 studs before snow peaks begin

=== SECTION: LANDMARK DESIGN ===

Every large map needs 3-5 memorable landmarks that players use for navigation.

--- LANDMARK TYPES ---

NATURAL LANDMARKS:
  Giant tree (2x normal scale): trunk 6x6x45 studs, canopy 50-stud diameter. Unmistakable silhouette from 300+ studs.
  Unique rock formation: tall spire rock (3x3x60 stud spike, tilted slightly), visible from far.
  Waterfall (tall): 80+ stud drop, visible and audible from 200 studs.
  Mountain peak: summit has distinctive shaped rock crown (ring of stones or single tall spike).

MANMADE LANDMARKS:
  Tower: 5x5 base, 40-60 studs tall, crenellated top. Visible 400+ studs in clear biome.
  Lighthouse: cylinder 3 diameter × 40 studs, rotating PointLight at top (Brightness=8, Range=500, SpotLight).
  Statue: 15-20 studs tall, distinctive silhouette (humanoid, animal, abstract).
  Ruins: partially collapsed castle or temple, 50x50 stud footprint.
  Bridge crossing memorable gorge: 80+ stud span suspension bridge, players remember crossing it.

LANDMARK PLACEMENT RULES:
  1. Maximum 1 landmark visible from any given point (otherwise all are diluted)
  2. Landmarks cluster naturally: ruin near dramatic cliff, lighthouse on coastal headland
  3. Landmarks serve navigation: player says "go past the big tree then turn right toward the mountain"
  4. Light them at night: PointLights, SpotLights, or glowing Neon elements on landmarks
  5. Sound signature: each landmark has associated ambient sound (tower bell, waterfall roar, wind through ruins)

=== SECTION: PERFORMANCE OPTIMIZATION FOR LARGE TERRAIN ===

Part count targets by map type:
  Small map (100x100): under 2,000 parts
  Medium map (500x500): under 8,000 parts
  Large map (1000x1000): under 20,000 parts
  Open world (2048x2048): under 50,000 parts (use Terrain voxels for base layer)

LOD (Level of Detail) system:
  Close range (0-50 studs): full detail — bark lines on trees, individual rock crevices, flower petals
  Mid range (50-150 studs): medium detail — trees without individual branch parts, rocks without cracks
  Far range (150-500 studs): billboard/impostor only — single flat part with texture, or simple shape
  Very far (500+ studs): hidden or replaced with painted terrain texture

Streaming implementation:
  Use workspace.StreamingEnabled = true
  Set workspace.StreamingMinRadius = 64 (minimum always loaded radius)
  Set workspace.StreamingTargetRadius = 256 (target radius)

Model optimization checklist:
  [ ] All static parts Anchored = true
  [ ] Decorative foliage: CanCollide = false, CastShadow = false
  [ ] Small parts (<0.5 studs): CanCollide = false
  [ ] Use Unions for 3+ parts that never move
  [ ] Transparent parts minimum — never stack >3 transparent parts (tanks FPS)
  [ ] ParticleEmitters: Rate ≤ 50 for ambient effects
  [ ] Sound: RollOffMaxDistance set (don't use 0 = global for all sounds)
  [ ] Neon material: maximum 100 parts with Neon in entire scene
  [ ] Resize unnecessary parts — a 4x4 stud rock near player costs same as 400x400 stud terrain block

=== SECTION: CAVE SYSTEM DESIGN ===

Caves break surface monotony and reward exploration.

--- CAVE ENTRANCE ---
Shape: irregular arch, 5-8 studs wide × 4-7 studs tall
Not a rectangle: use angled wedge parts to create rough jagged opening
Rock pile around base: 8-15 boulders (diameter 1-4 studs)
Dripping water: vertical thin transparent parts (0.1x0.1x0.5) falling from cave ceiling lip
Moss and vegetation: heavy LeafyGrass color parts around entrance frame
Darkness visible inside: black fog (FogEnd 30) inside cave zone

--- CAVE TUNNEL ---
Width: 8-14 studs
Height: 6-10 studs
Ceiling shape: curved arch (approximated with 5-7 wedge parts forming arc)
Floor: rough — varies ±1 stud height, Material=Ground or Limestone
Walls: irregular, use sphere parts partially embedded in wall for rounded features
Stalactite ceiling:
  Cone parts (SpecialMesh type Wedge or CylinderMesh) pointing downward
  Diameter: 0.5-2 studs at top, tapering to point
  Height: 2-8 studs
  Color: RGB(95,85,75) grey-tan
  Density: 1 stalactite per 4-6 studs² of ceiling
Stalagmite floor:
  Same as stalactite but pointing upward, diameter wider at base
  Height: 1-5 studs
  Density: 1 per 8-10 studs² of floor

--- CAVE CHAMBER (large open room) ---
Dimensions: 30-80 studs wide × 20-50 studs tall
Multiple entrances/exits: 2-4 tunnels entering at different angles
Underground lake: 20-40 stud diameter, Terrain Water or very dark transparent parts
Crystal cluster focal point: see Crystal Cave biome section, placed at chamber center or on central rock island
Drip stalactites: sound of dripping water (Sound with short-interval volume pulse)
Phosphorescent moss: Neon material flat parts on walls, Color=RGB(80,220,80) very dim green glow
  PointLights inside: Brightness=0.5, Range=8 — barely lights surrounding area

=== SECTION: ISLAND GENERATION ===

Creating self-contained island maps:

--- SMALL ISLAND (50-100 stud diameter) ---
Profile: oval/kidney shape — use 8-12 terrain FillCylinder/FillBlock operations overlapping
Center elevation: 15-25 studs
Edge elevation: 0 (sea level)
  Shell of sand: 5-8 stud wide Sand material ring at shore
  Inner ground: Ground or LeafyGrass
  Central hill: Rock/Ground top
Vegetation: 6-15 palm trees or tropical trees
Dock: wooden boardwalk extending 10 studs off one beach

--- MEDIUM ISLAND (200-400 stud diameter) ---
Terrain variation: include 2-3 distinct zones
  Main beach: 200° arc of sandy shore (not full circle — more natural)
  Rocky promontory: 60° arc of cliff faces rising 20-30 studs
  Lagoon: sheltered semi-circular cove, calm clear water
  Jungle interior: dense tropical trees, 80-100 stud central forest mass
Freshwater source: stream from central hill to beach, or inland pond
Ruins or structure: old stone fort, abandoned cottage, or buried treasure site

--- ATOLL (ring-shaped island) ---
Outer ring: 15-25 stud wide land band, sandy, low elevation (2-4 studs above sea)
Central lagoon: turquoise shallow water, Terrain Water inside ring, depth 4-6 studs
Lagoon color: bright teal (different from ocean — shallow + sandy bottom = turquoise)
Breaks in ring: 1-3 channel openings 10-20 studs wide where ocean connects to lagoon
Coral just inside ring: see coral construction above

--- ARCHIPELAGO LAYOUT ---
Group of 5-12 islands in 1000x1000 stud ocean zone
Spacing: 100-300 studs between islands
Size variation: largest island 400 stud diameter, smallest 30 studs
Connecting factor: all islands share same geological origin (same rock color, same tree species)
Navigation challenge: shallow reef areas between islands (1-2 stud depth) — impassable to boats but visible through water

=== SECTION: WINTER ENVIRONMENTS ===

Converting any biome to winter:

--- SNOW COVERAGE ---
Step 1: Replace all Grass, LeafyGrass, Ground material with Snow using Terrain:ReplaceMaterial()
  workspace.Terrain:ReplaceMaterial(entireMapRegion, 4, Enum.Material.Grass, Enum.Material.Snow)
  workspace.Terrain:ReplaceMaterial(entireMapRegion, 4, Enum.Material.LeafyGrass, Enum.Material.Snow)
Step 2: Top of all horizontal parts: place thin white flat parts (height 0.3) covering top surfaces
  Condition: only on nearly-horizontal parts (check CFrame.RightVector and LookVector vs Y axis)
  Thickness: 0.3 studs flat parts, Material=Snow, Color=RGB(235,240,250)
Step 3: Tree branches get snow caps:
  Add white flattened sphere (scale Y=0.2) on top of each canopy sphere, diameter = 110% of canopy diameter
  Color RGB(235,240,250)
Step 4: Icicles on overhangs (drip formation pointing down):
  Same as stalactite construction — inverted cone parts, Material=Ice or Glacier
  Color RGB(180,215,235)
  Length: 0.8-3 studs
  Placed every 2-4 studs along roof edges and cliff overhangs

--- FROZEN POND / ICE SHEET ---
Remove Terrain Water from existing pond/lake
Replace with Ice material (Terrain:FillBlock with Ice material)
OR Part-based: large flat boxes, Material=Glacier or SmoothPlastic
  Color: RGB(180,210,235) — blue-white
  Transparency: 0.15-0.25 (see through slightly to dark "depth" below)

--- WINTER ATMOSPHERE ---
  Atmosphere.Color: RGB(185,200,220) — cold blue-grey
  Atmosphere.Density: 0.32
  Atmosphere.Haze: 2.0
  FogEnd: 1200
  FogColor: RGB(200,210,225)
  Ambient: RGB(100,110,130) — cold blue-grey
  OutdoorAmbient: RGB(150,160,180)
  Brightness: 1.0 (reduced sun strength in winter)
  ColorShift_Top: RGB(185,200,230) — blue winter light from above

=== SECTION: SPECIAL EFFECT ENVIRONMENTS ===

--- AURORA BOREALIS ---
  Requires night atmosphere (TimeOfDay 22:00+)
  Implementation: series of large transparent vertical planes (200x100 studs), transparency 0.75
  Colors: ColorSequence across plane width — green RGB(0,200,80) → teal RGB(0,180,180) → purple RGB(140,0,200)
  Position: Y = 300-600 studs high
  Gentle oscillation: TweenService morphs Y position ±20 studs over 8-12 seconds

--- SANDSTORM TRAVEL EFFECT ---
Reduce render distance to near-zero:
  FogEnd: 40, FogStart: 5, FogColor: RGB(200,170,120)
Player effects: GUI sandy color overlay, health drain if prolonged exposure
Particles: see WEATHER section sandstorm

--- UNDERWATER ZONE ---
Transition point: player crosses water surface, new ambient music starts
  Atmosphere changes: FogEnd 80, FogColor RGB(10,50,100)
  Ambient: RGB(10,40,100)
  Gravity: workspace.Gravity = 8 (reduced from default 196 for swim effect)
  Background hum: low ambient sound
  Particle effects: bubble streams rising from sea floor, particle emitters attached to coral

--- VOLCANO ERUPTION EVENT ---
  Phase 1 (rumble): PointLight inside volcano intensifies, Tween Brightness 2→8 over 10s
  Phase 2 (eruption): Lava particle emitters at crater rim activate, Rate 200, upward velocity 50
    Lava bombs: spawn Neon sphere parts (diameter 1-3) with BodyVelocity upward and outward
    Each lava bomb: on touch, spawn fire ParticleEmitter at contact point
  Phase 3 (lava flow): spawn/extend Neon flat parts flowing down predefined channels
  Phase 4 (ash fall): overhead particle emitter, grey ash particles, Rate 100

=== SECTION: SOUND DESIGN REFERENCE ===

Sound placement strategy:
  Global (Volume ≥ 0.5, RollOffMaxDistance=0): wind, rain during storms
  Zone (RollOffMaxDistance 100-200): waterfall, market crowd, bonfire crackle
  Point (RollOffMaxDistance 20-50): specific NPC voice, small fountain, door creak
  Directional (SpotSound=true): waterfall from specific direction

Biome ambient sound combos:
  Temperate forest: birds (0.3 vol), wind-through-leaves (0.2), occasional branch-snap (0.1 random)
  Tropical: intense insects (0.5), bird calls (0.3), rain (0.4 if raining)
  Desert: wind-howl (0.25), distant sandstorm (variable), complete-silence-base (immersive)
  Cave: drip-water (0.2, echoing), bat-flutter (random 0.4), deep-rumble (0.1 bass hum)
  Beach: ocean-waves (0.6), seagulls (0.2), sand-wind (0.15)
  Swamp: frogs (0.4), insects (0.3), bubbling-mud (0.2), owl (random night)
  Snow/Arctic: howling-wind (0.5), blizzard-roar (0.7 during storm), crunch-footsteps (handled by character)
  Volcanic: deep-rumbling (0.6), fire-crackle (0.3), hissing-steam (0.4 at vents)

Reverb for enclosed spaces:
  Cave: ReverbType = Hall, Reverb = 3.0
  Forest: ReverbType = Forest, Reverb = 0.8
  Open field: ReverbType = None
  Underwater: use EQSoundEffect to dampen high frequencies (LowFreq boost, HiFreq cut)

=== SECTION: MINIMAP DESIGN PRINCIPLES ===

Colors to use when generating map icons/overlays:
  Forest: RGB(45,130,40) dark green
  Water: RGB(40,100,200) blue
  Road/path: RGB(210,185,140) tan
  Mountain: RGB(130,110,90) grey-brown
  Desert: RGB(220,195,140) tan-gold
  Snow: RGB(230,235,245) white-blue
  Town/settlement: RGB(220,200,160) light tan (buildings)
  Dungeon: RGB(80,60,90) dark purple
  Safe zone: RGB(40,200,80) bright green ring
  Danger zone: RGB(200,40,40) red ring
  Objective: RGB(255,220,0) gold star or circle

Minimap scale reference:
  Small map (200x200 stud play area): 1 pixel = 2 studs
  Medium map (1000x1000): 1 pixel = 5 studs
  Large open world (2048x2048): 1 pixel = 8-10 studs

=== SECTION: TERRAIN MATERIALS COMPLETE REFERENCE ===

All valid Roblox terrain materials and their best use cases:

Grass          — Standard grass ground, meadows, lowlands. Color: auto-green or custom.
LeafyGrass     — Darker richer grass, forest floors, jungle. Slightly different render.
Ground         — Dirt, soil, bare earth. Transition between grass and rock.
Mud            — Wet earth, swamp floor, river banks. Darker than Ground.
Sand           — Beach, desert floor, riverbed. Pale tan auto-color.
Sandstone      — Cliff faces, desert rock, southwestern terrain. Warmer orange-tan.
Rock           — Mountain terrain, cliff faces, rocky outcrops. Standard grey.
Slate          — Dark grey rock, cave walls, darker cliff faces.
Limestone      — Pale rock, coastal cliffs, ruins material.
Basalt         — Black volcanic rock. Very dark grey.
CrackedLava    — Cooled lava surface with cracks. Dark with crack pattern.
Glacier        — Blue-tinted ice, glacial terrain. Semi-transparent looking.
Ice            — Clear/white ice. Frozen lakes, arctic surface.
Snow           — White snow surface. Mountains, arctic, winter.
Water          — Terrain water. Actual water rendering.
Air            — Empty voxel. Used to carve tunnels and caves.
Concrete       — Grey urban material. Roads, buildings, bunkers.
Asphalt        — Dark road surface. Smoother than Concrete.
Pavement       — Light grey paving stones. Sidewalks, plazas.
WoodPlanks     — Brown wood flooring. Docks, boardwalks, floors.
Salt           — White crystalline material. Salt flats, mineral deposits.

NOT available as Terrain materials (use Parts instead):
  Metal, Neon, SmoothPlastic, Brick, Marble, Granite, DiamondPlate, Fabric, Foil, Glass, etc.
  These are Part materials only.

=== SECTION: BIOME-SPECIFIC TERRAIN COLOR CUSTOMIZATION ===

Roblox Terrain allows color customization via Terrain.WaterColor and individual material appearances.
For Part-based terrain, use these exact RGB values per biome:

Temperate Forest ground parts: RGB(101,79,54)
Boreal Forest ground: RGB(75,65,55)
Tropical floor: RGB(45,80,30)
Savanna ground: RGB(175,145,90)
Hot desert sand: RGB(220,190,130)
Tundra ground: RGB(130,120,110)
Arctic ice: RGB(200,225,240)
Swamp mud: RGB(80,60,40)
Volcanic basalt: RGB(35,30,30)
Mushroom ground: RGB(80,50,80)
Crystal cave rock: RGB(45,40,55)
Beach sand (dry): RGB(230,210,165)
Beach sand (wet): RGB(195,175,135)
Prairie grass: RGB(165,155,80)
Mediterranean rock: RGB(175,160,140)
Moorland peat: RGB(65,50,35)
Canyon top: RGB(180,130,80)
Canyon mid: RGB(150,100,60)
Canyon bottom floor: RGB(160,140,110)
Alpine grass zone: RGB(100,130,70)
Alpine rock zone: RGB(110,105,100)
Alpine snow zone: RGB(235,240,250)

Water colors by context:
  Clear mountain stream: RGB(140,195,220)
  Deep lake: RGB(45,90,160)
  Tropical ocean shallow: RGB(50,175,195)
  Tropical ocean deep: RGB(15,75,150)
  Murky swamp: RGB(40,60,35)
  Arctic meltwater: RGB(100,180,220)
  Desert oasis: RGB(80,165,200)
  Lava channel (NEON): RGB(255,100,0)
  Bioluminescent underwater: RGB(0,190,140) Neon

Sky platform min:   Y = 200 (floating islands)
`
