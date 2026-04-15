/**
 * build-templates.ts
 *
 * Expert prompt prefixes for the BUILD mode, keyed by game genre.
 *
 * Each template is a 200-300 word world-class instruction that we prepend
 * to the user's prompt before passing it to the build planner. They encode
 * the knowledge a top-3% Roblox developer would bring to a scene: part
 * counts, stud ranges, material palettes, lighting, prop vocabulary, and
 * the architectural rules that make the build feel coherent.
 *
 * NEVER strip the closing instruction that says "now fulfill the user's
 * request below" — the low-context amplifier relies on it.
 */

export type Genre =
  | 'medieval-fantasy'
  | 'dark-fantasy'
  | 'sci-fi'
  | 'cyberpunk'
  | 'post-apocalyptic'
  | 'modern-city'
  | 'tropical-island'
  | 'western-frontier'
  | 'pirate-cove'
  | 'horror-mansion'
  | 'tycoon-simulator'
  | 'obby-parkour'
  | 'racing-track'
  | 'tower-defense'
  | 'rpg-adventure'
  | 'simulator'
  | 'horror'
  | 'generic'

const CLOSING = `\n\nIMPORTANT BUILD RULES:
- Generate AT LEAST 30 parts for any scene. Cities need 50-100+. Full games need 100+.
- NEVER describe the build in marketing language. No "stunning", "captivating", "sleek", "vibrant", "touch of warmth", "sophistication", "grandeur", "luxurious". Talk like a real person showing a friend what they built.
- VARY your colors. Do NOT default to "royal blue, emerald, and gold" for everything. Pick colors that match the THEME — a forest is green/brown, a city is grey/white/glass, a tycoon is industrial grey/green/yellow.
- Use concrete stud values, part counts, and Color3.fromRGB(). Never say "a touch of" or "adding luxury".
- Talk about your build naturally — like showing a friend. 3-6 sentences. What you built, one cool detail, and what to try next. NOT a parts list. NOT a press release.
- ALWAYS add subtle lighting post-effects to Lighting service: Atmosphere(Density=0.3, Glare=0.1, Haze=1.5), BloomEffect(Intensity=0.3, Size=28, Threshold=0.92), ColorCorrectionEffect(Brightness=0.03, Contrast=0.08, Saturation=0.1, TintColor warm), SunRaysEffect(Intensity=0.06, Spread=0.8). Set Technology=Future. These are SUBTLE — real sunlight feel, not a filter.
- Reuse parts via Clone() when possible to keep the tree tidy.`

export const BUILD_TEMPLATES: Record<Genre, string> = {
  'medieval-fantasy': `You are building a medieval fantasy scene for Roblox. Think "Kingdom of the Sun" or "Elder Kingdom" — chunky low-poly hand-painted stylings, warm golden-hour lighting, 55° geographic latitude, Voxel shadow technology.

REQUIRED SUB-OBJECTS (minimum 45 parts total):
- Castle wall: 60x4x20 stud Slate Part as main wall, crenellated battlements via 3x4x3 stud Slate Parts spaced every 6 studs along the top, slit windows (2x0.5x4 stud cutouts) every 12 studs, buttresses (4x4x16 stud Wedge) every 20 studs.
- Tower: at least one, 10x10x35 stud minimum, Slate walls Color3.fromRGB(91,93,105), conical roof via Cone/Wedge Parts in Wood Color3.fromRGB(106,57,9), arrow slits on 3 faces.
- Gate: 12x2x16 stud archway using Wedge Parts for the arch, WoodPlanks door Color3.fromRGB(90,55,20) 10x1x14 studs, Metal hinges Color3.fromRGB(60,60,65) 1x0.5x3 studs.
- Courtyard: 40x0.5x40 stud Cobblestone floor Color3.fromRGB(120,115,105), bordered by walls on 3 sides.
- Throne room: interior 20x0.5x30 stud floor, throne (6-part assembly: seat 4x3x2, back 4x0.5x6, armrests 0.5x1x3, base 5x1x5) in Wood Color3.fromRGB(106,57,9) with Metal accent Color3.fromRGB(218,134,59).

MATERIAL RULES: Slate for all walls and towers. Wood for doors, furniture, roof beams. WoodPlanks for floors and trim. Metal for hinges, brackets, chandelier chains. Cobblestone for courtyards and paths. Fabric for banners (2x0.1x8 studs, Color3.fromRGB(180,30,30)).

PROPS (minimum 8): torch sconces (Cylinder 0.5x0.5x2 + PointLight Range 12 Brightness 1 Color3.fromRGB(255,160,60)), wooden barrels (Cylinder 3x3x4), hay bales (4x3x3 Grass Color3.fromRGB(190,180,80)), banners, crates (3x3x3 WoodPlanks), shields (2x0.3x2.5 Metal), candelabras, market stalls.

Lighting: ClockTime 8.5, Brightness 2, Ambient Color3.fromRGB(139,115,85), ExposureCompensation -0.2, FogEnd 300, FogColor Color3.fromRGB(180,160,130). Forbidden: Neon, SmoothPlastic, chrome, sci-fi textures.${CLOSING}`,

  'dark-fantasy': `You are building a dark fantasy scene for Roblox — the Dark Souls, Bloodborne, Elden Ring register. Towering gothic silhouettes, fog, oppressive scale.

REQUIRED SUB-OBJECTS (minimum 50 parts total):
- Cathedral structure: main hall 30x0.5x60 studs, walls 4x40x60 studs Slate Color3.fromRGB(42,42,51), vaulted ceiling via angled Wedge Parts meeting at apex 45 studs high.
- Cracked pillars: 4x4x35 stud Cylinders in CorrodedMetal Color3.fromRGB(75,60,46) every 18 studs, at least one broken at 15 studs with debris (3-4 angled Parts CFrame rotated ±5°-15° on ground).
- Gothic archways: Wedge Part arches 12 studs wide x 18 studs tall, at least 3 in the scene, one collapsed (fragments scattered with Transparency 0.05-0.1).
- Braziers: 3x3x4 stud Metal bowls at every column, PointLight Range 8 Brightness 0.6 Color3.fromRGB(255,120,40), Shadows enabled.
- Collapsed section: at least one wall segment tilted ±8° with rubble (6-10 scattered Slate Parts 1x1x2 to 3x2x4 studs, CFrame rotated randomly).
- Boss arena or altar: 8x1x8 stud raised platform, Slate Color3.fromRGB(35,35,45), with a centerpiece (sword in stone, ruined throne, or sacrificial altar).

MATERIAL RULES: Slate for all walls, floors, columns. CorrodedMetal for brackets, chains (Cylinder 0.3x0.3x6), gates, cage bars. Wood Color3.fromRGB(55,35,20) ONLY for rotted beams (tilt ±3° to show decay). Grass Color3.fromRGB(40,60,30) only for overgrown moss patches (flat 0.2-stud Parts on walls/floors).

DECAY DETAILS: Transparency 0.05-0.15 on select decorative parts. Fallen stones have CFrame rotations of ±3°-10°. Flying buttresses via angled 2x2x20 stud Parts joined with WeldConstraints.

Colors: primary Color3.fromRGB(42,42,51), secondary Color3.fromRGB(75,60,46), accent Color3.fromRGB(139,0,0) blood red, highlight Color3.fromRGB(201,179,122) tarnished gold.
Lighting: Future technology, ClockTime 18.5, Brightness 1.2, Ambient Color3.fromRGB(26,26,37), FogEnd 80, FogColor Color3.fromRGB(42,42,51), ExposureCompensation -0.6. Forbidden: bright saturated colors, Neon (except faint rune glows), modern materials, cheerful props.${CLOSING}`,

  'sci-fi': `You are building a sci-fi scene for Roblox in the clean-futurism register — think The Expanse, Mass Effect, or "Star Citizen hangar bay".

REQUIRED SUB-OBJECTS (minimum 50 parts total):
- Corridor module: 12x12x40 stud hallway, Metal walls Color3.fromRGB(44,62,80), floor panels 12x0.5x4 studs with 0.2-stud seam gaps every 4 studs.
- Airlock/blast door: 8x1x10 stud Metal door Color3.fromRGB(60,70,85), frame 10x0.5x12 studs, warning stripes (alternating 1-stud bands of Color3.fromRGB(236,240,241) and Color3.fromRGB(230,126,34)).
- Control console: 6x3x4 stud assembly — base Metal, angled top panel (15° tilt) with Neon screen 4x0.1x2 studs Color3.fromRGB(0,194,255), 3-4 button Parts (0.5x0.3x0.5 Neon in varied colors).
- Greeble panels: at least 5 wall sections with visible bolts (Cylinder 0.3x0.3x0.2), vents (2x0.5x1 stud insets), and pipe runs (Cylinder 0.4x0.4x8 studs Metal Color3.fromRGB(70,80,90)).
- Holographic display: 4x0.1x3 stud Neon Part Color3.fromRGB(0,194,255) Transparency 0.3, mounted on a 0.5-stud arm from wall. At least 2 in the scene.
- Viewport window: 8x0.3x6 stud Glass Transparency 0.4 Color3.fromRGB(180,220,255), Metal frame 0.5 studs wide.

MATERIAL RULES: Metal for all structural walls, floors, ceilings. DiamondPlate for heavy-duty flooring or cargo areas. Neon ONLY for accent lines (0.2x0.2 stud strips along wall-floor joints), screens, and buttons. Glass for viewports and display cases. All angles must be 90° or 45°, all stud values multiples of 2.

Colors: primary Color3.fromRGB(44,62,80) deep steel, secondary Color3.fromRGB(236,240,241) white, accent Color3.fromRGB(0,194,255) cyan, highlight Color3.fromRGB(0,255,160) neon green.
Lighting: Future technology, ClockTime 12, Brightness 3, Ambient Color3.fromRGB(95,127,159), ExposureCompensation 0.2, no fog. PointLights with Color3.fromRGB(0,194,255) Range 5 Brightness 0.8 along corridor floors every 8 studs. Forbidden: Wood, Cobblestone, Brick, medieval or organic details.${CLOSING}`,

  'cyberpunk': `You are building a cyberpunk scene for Roblox — rainy neon Tokyo, Blade Runner, Cyberpunk 2077.

REQUIRED SUB-OBJECTS (minimum 60 parts total):
- Building facade: 20x2x30 stud Concrete walls Color3.fromRGB(13,2,33), stacked 2-3 stories. Each story has a 6x0.3x3 stud Glass storefront (Transparency 0.6) with a Neon sign above it.
- Neon signs: minimum 10 Neon Parts in at least 4 distinct colors — Color3.fromRGB(255,46,147) hot pink, Color3.fromRGB(0,240,255) cyan, Color3.fromRGB(160,32,240) purple, Color3.fromRGB(255,165,0) orange. Each sign 4x0.3x1.5 studs, paired with a PointLight Range 12 Brightness 2 matching color.
- Back alley: 8-stud-wide corridor between buildings, DiamondPlate floor Color3.fromRGB(50,45,55), puddle Parts (2x0.05x3 studs, Reflectance 0.6, Color3.fromRGB(30,15,60)).
- Dangling cables: Cylinder Parts 0.2x0.2x6-12 studs, CorrodedMetal Color3.fromRGB(40,35,45), draped between buildings at varying heights (CFrame angled 15-30°). Minimum 6 cables.
- AC units/vents: 3x2x2 stud DiamondPlate boxes Color3.fromRGB(70,65,75) bolted to walls with 0.3-stud bracket Parts. At least 4 per building face.
- Street level: food stall (8x4x8 stud assembly with CorrodedMetal frame + Neon menu sign), dumpster (4x3x3 CorrodedMetal Color3.fromRGB(45,40,50)), steam vent (1x1x0.5 Part + ParticleEmitter if available).

MATERIAL RULES: Concrete for building walls. DiamondPlate for industrial floors and metal surfaces. CorrodedMetal for pipes, old machinery, dumpsters. Neon ONLY for signs and light strips. Glass Transparency 0.6 for storefronts. No clean or polished surfaces.

Colors: primary Color3.fromRGB(13,2,33), secondary Color3.fromRGB(69,10,158), accent Color3.fromRGB(255,46,147), highlight Color3.fromRGB(0,240,255).
Lighting: Future tech, ClockTime 21.5, Brightness 0.8, Ambient Color3.fromRGB(26,10,58), FogEnd 150, FogColor Color3.fromRGB(42,10,74), ExposureCompensation 0.1. Forbidden: daylight, clean corporate sterility, rural props, Wood, Grass.${CLOSING}`,

  'post-apocalyptic': `You are building a post-apocalyptic scene for Roblox — Fallout, Metro Exodus, The Last of Us.

REQUIRED SUB-OBJECTS (minimum 55 parts total):
- Ruined building: 20x2x24 stud walls, at least one tilted ±5-8° with CFrame rotation. Walls are CorrodedMetal Color3.fromRGB(62,46,31). Upper floors partially collapsed — use 3-5 angled slab Parts as fallen ceiling.
- Exposed rebar: Cylinder Parts 0.3x0.3x4-8 studs, Color3.fromRGB(30,28,25) Metal, protruding from broken walls/floors at random angles. Minimum 6 rebar pieces.
- Shattered windows: frame 4x0.5x5 stud CorrodedMetal, NO glass (Transparency 1 center), 3-4 Wedge glass shards (0.5x0.5x1 stud Glass Color3.fromRGB(180,190,180) Transparency 0.2) stuck in frame edges.
- Rusted vehicle: 12x5x5 stud car hull using 6-8 Parts — body (stretched Box CorrodedMetal Color3.fromRGB(156,74,47)), 4 Cylinder wheels Color3.fromRGB(25,25,25) 2x2x1 studs (one flat/missing), broken windshield frame.
- Survivor camp: 10x10 stud area with tarp shelter (angled 8x0.1x6 stud Fabric Part Color3.fromRGB(90,85,70)), campfire ring (6 Rock Parts 1.5x1.5x1 in circle + PointLight Range 10 Color3.fromRGB(255,140,40)), supply crates.
- Debris field: 10-15 scattered Parts (1x1x1 to 3x2x2 studs) in CrackedLava, CorrodedMetal, and WoodPlanks, CFrame rotated randomly. Old tires (Torus proxy 2x2x0.5), scattered paper (0.5x0.05x0.7 Fabric Color3.fromRGB(200,190,160)).

MATERIAL RULES: CorrodedMetal for all metal surfaces. CrackedLava for damaged concrete/asphalt. WoodPlanks Color3.fromRGB(100,80,55) for weathered wood only. Sand Color3.fromRGB(168,144,96) for ground. Fabric for tarps and cloth.

Colors: primary Color3.fromRGB(62,46,31), secondary Color3.fromRGB(107,91,63), accent Color3.fromRGB(156,74,47) rust, highlight Color3.fromRGB(212,180,96).
Lighting: ShadowMap, ClockTime 16, Brightness 1.8, Ambient Color3.fromRGB(107,91,63), FogEnd 100, FogColor Color3.fromRGB(168,144,96) sepia, ExposureCompensation -0.1. Forbidden: pristine surfaces, bright saturated colors, intact glass, Neon, clean Metal.${CLOSING}`,

  'modern-city': `You are building a modern city scene for Roblox — NYC, Tokyo, Downtown LA.

REQUIRED SUB-OBJECTS (minimum 60 parts total):
- Skyscraper: 20x20x100+ stud tower, Concrete base Color3.fromRGB(74,85,104), Glass curtain wall (rows of 4x0.3x3 stud Glass Parts Transparency 0.4 Color3.fromRGB(226,232,240)) with 0.5-stud Metal mullions between each. Stepped setback at 60 studs. Flat rooftop with AC unit (3x2x2 DiamondPlate) and antenna (Cylinder 0.3x0.3x8).
- Mid-rise buildings: 2-3 buildings, 16x16x40-60 studs, Concrete Color3.fromRGB(90,95,105), window grid (3x0.3x2.5 Glass every 6 studs), ground-floor storefront with awning (4x0.1x2 Fabric Color3.fromRGB(180,40,40)).
- Road: 24-stud-wide Concrete Color3.fromRGB(55,55,60) surface, center line via 4x0.05x1 stud Neon Parts Color3.fromRGB(255,200,0) spaced every 4 studs. Intersection with crosswalk stripes (1x0.05x4 stud white Parts).
- Sidewalk: 4-stud-wide Concrete Color3.fromRGB(160,160,155) flanking every road, curb 0.5 studs raised.
- Street props: lampposts every 16 studs (Cylinder 0.5x0.5x12 Metal Color3.fromRGB(50,50,55) + 2x0.3x0.3 arm + PointLight Range 16 Brightness 1 Color3.fromRGB(255,240,200)), fire hydrants (multi-part Cylinder 1.5x1.5x2.5 Color3.fromRGB(200,40,40)), trash cans (Cylinder 1.5x1.5x2.5 Color3.fromRGB(60,65,60)), parked cars (8x4x3 stud 5-part assemblies).
- Landmark: one building with distinctive stepped massing or crown detail, different color accent.

MATERIAL RULES: Concrete for building walls, sidewalks, roads. Glass Transparency 0.4 for windows. Metal for structural frames, lampposts, railings. DiamondPlate for utility surfaces. Fabric for awnings.

Colors: primary Color3.fromRGB(74,85,104), secondary Color3.fromRGB(226,232,240), accent Color3.fromRGB(59,130,246), highlight Color3.fromRGB(251,191,36) taxi yellow.
Lighting: ShadowMap, ClockTime 13, Brightness 2.5, Ambient Color3.fromRGB(122,134,153), ExposureCompensation 0, FogEnd 500. Forbidden: fantasy props, medieval materials, rural elements, Neon (except traffic markings).${CLOSING}`,

  'tropical-island': `You are building a tropical island scene for Roblox — think "paradise cove", Moana, Far Cry 3.

REQUIRED SUB-OBJECTS (minimum 45 parts total):
- Palm trees (minimum 5): Cylinder trunk 1.5x1.5x14 studs Wood Color3.fromRGB(140,110,60), slight CFrame tilt 5-10°, 4-5 frond Wedge Parts 6x0.2x2 studs LeafyGrass Color3.fromRGB(46,204,113) fanning from top. Vary trunk heights 10-18 studs.
- Beach: Sand terrain or 60x0.5x30 stud Part, Sand material Color3.fromRGB(244,228,188), gently sloping (CFrame tilt 2-3°) into water edge.
- Ocean: Terrain:FillBlock with Material Water, or large 200x0.5x200 stud Part with Glass material Color3.fromRGB(0,206,209) Transparency 0.3 Reflectance 0.2 at Y=0.
- Wooden dock: 4x1x24 stud WoodPlanks platform Color3.fromRGB(160,120,70), supported by 6 Cylinder pilings 1x1x6 studs Wood Color3.fromRGB(120,90,50) every 8 studs, extending into water.
- Tiki hut: 8x8 footprint, 4 Cylinder posts 1x1x8 studs, thatched roof (2 angled 10x0.3x6 WoodPlanks Parts Color3.fromRGB(180,160,90) meeting at ridge), open sides.
- Beach props: lounge chairs (4-part Wood assembly 4x2x2.5 studs), tiki torches (Cylinder 0.4x0.4x5 + PointLight Range 8 Color3.fromRGB(255,180,60)), coconuts (Sphere 1x1x1 Color3.fromRGB(100,70,30)), seashells (0.5x0.2x0.5 Wedge Color3.fromRGB(240,220,200)), surfboard (6x0.2x1.5 angled Part).

MATERIAL RULES: Sand for beaches. Grass for inland areas beyond 30 studs from shore. LeafyGrass for palm fronds and tropical plants. Wood for structures and props. WoodPlanks for dock planking. Rock Color3.fromRGB(130,125,115) for rocky outcrops.

Colors: primary Color3.fromRGB(244,228,188), secondary Color3.fromRGB(46,204,113), accent Color3.fromRGB(0,206,209), highlight Color3.fromRGB(255,107,53).
Lighting: Future tech, ClockTime 14.5, Brightness 3, Ambient Color3.fromRGB(160,196,228), ExposureCompensation 0.3, GeographicLatitude 5, no fog. Forbidden: snow, gothic elements, industrial materials, dark colors.${CLOSING}`,

  'western-frontier': `You are building a western frontier scene for Roblox — Red Dead Redemption, Tombstone, Django Unchained.

REQUIRED SUB-OBJECTS (minimum 50 parts total):
- Saloon: 18x20x16 stud WoodPlanks building Color3.fromRGB(139,69,19), false front facade extending to 24 studs tall, swinging doors (2x 2x0.3x5 stud WoodPlanks Parts with HingeConstraint), "SALOON" sign (Part + SurfaceGui), balcony on second floor (16x3x0.5 stud WoodPlanks + railing posts every 4 studs).
- General store: 16x16x14 stud WoodPlanks building Color3.fromRGB(120,80,40), false front to 20 studs, large window 6x0.3x4 Glass, porch overhang 16x4x0.3 WoodPlanks with 2 support Cylinder posts.
- Main street: 24-stud-wide Sand floor Color3.fromRGB(210,180,140), running 80+ studs. Boardwalks (4x0.5x60 stud WoodPlanks Color3.fromRGB(110,75,35)) flanking both sides, raised 0.5 studs.
- Hitching posts: Cylinder 0.4x0.4x3 stud Wood Color3.fromRGB(100,65,30) posts with horizontal rail Cylinder 0.3x0.3x8 at 2.5 studs height, spaced every 20 studs. At least 3 sets.
- Water tower: 6x6x6 Cylinder barrel WoodPlanks Color3.fromRGB(130,85,45) on 4-leg Metal frame 8 studs tall.
- Wagon: 8x4x3 stud body WoodPlanks Color3.fromRGB(100,65,30), 4 Cylinder wheels 2x0.3x2 Wood, tongue and hitch at front.
- Props: wooden barrels (Cylinder 2x2x3 WoodPlanks), crates (3x3x3), hay bales (4x3x3 Grass Color3.fromRGB(190,175,80)), sheriff star (Metal Part + SurfaceGui on jail building), wanted posters (Part + Decal).

MATERIAL RULES: WoodPlanks for ALL buildings (no clean Wood). Sand for ground/streets. Slate Color3.fromRGB(140,130,120) for stone foundations only. Metal Color3.fromRGB(75,70,65) for railings, horseshoes, hardware.

Colors: primary Color3.fromRGB(139,69,19), secondary Color3.fromRGB(210,180,140), accent Color3.fromRGB(139,0,0), highlight Color3.fromRGB(218,165,32).
Lighting: ShadowMap, ClockTime 17, Brightness 2.3, Ambient Color3.fromRGB(193,154,107), FogEnd 250, FogColor Color3.fromRGB(210,180,140) dust haze, ExposureCompensation 0. Forbidden: Neon, chrome, Glass (except store windows), anything post-1900.${CLOSING}`,

  'pirate-cove': `You are building a pirate cove scene for Roblox — Sea of Thieves, Pirates of the Caribbean.

REQUIRED SUB-OBJECTS (minimum 55 parts total):
- Pirate ship (galleon): Hull 40x12x10 studs using stretched Wedge (bow) + Box (mid) + Wedge (stern) Parts, WoodPlanks Color3.fromRGB(61,40,23). Gunwale railing 0.5-stud Cylinder posts every 4 studs, 3 masts (Cylinder 1x1x30, 1x1x25, 1x1x20 studs Wood Color3.fromRGB(90,65,35)), sails (8x0.1x12 stud flat Parts Fabric Color3.fromRGB(230,220,200) or red Color3.fromRGB(139,0,0) with Jolly Roger Decal on main). Rudder at stern (3x0.3x4 WoodPlanks). Cannon ports: 4 per side (2x2 stud holes with Cylinder 1x1x3 Metal cannons).
- Dock: 4x1x20 stud WoodPlanks platform Color3.fromRGB(110,80,50), Cylinder pilings 1x1x5 every 6 studs, mooring ropes (Cylinder 0.2x0.2x8 Fabric Color3.fromRGB(180,160,120) from ship to dock cleat).
- Cove terrain: Rock cliffs 10-20 studs tall on 2 sides Color3.fromRGB(100,95,85), Sand beach Color3.fromRGB(244,228,188), Water bay.
- Treasure chest: 3x2x2 stud WoodPlanks box Color3.fromRGB(80,55,25) with Metal bands 3x0.2x0.3 Color3.fromRGB(212,162,76), lid hinged open, gold coins inside (5-6 Cylinder 0.5x0.1x0.5 Color3.fromRGB(255,215,0)).
- Props: barrels (Cylinder 2x2x3 WoodPlanks) minimum 4, coiled rope (Torus 2x2x0.5 Fabric Color3.fromRGB(160,140,100)), lanterns (1x1x1.5 Metal + PointLight Range 8 Color3.fromRGB(255,165,0) Brightness 1), crates, rum bottles (Cylinder 0.3x0.3x1 Glass Color3.fromRGB(50,80,50)).

MATERIAL RULES: WoodPlanks for all ship and dock surfaces. Wood for masts and structural beams. Metal for cannons, fittings, brass details Color3.fromRGB(212,162,76). Sand for beaches. Rock for cliffs. Fabric for sails and rope.

Colors: primary Color3.fromRGB(61,40,23), secondary Color3.fromRGB(212,162,76), accent Color3.fromRGB(139,0,0), highlight Color3.fromRGB(244,228,188).
Lighting: ShadowMap, ClockTime 15, Brightness 2.4, Ambient Color3.fromRGB(144,168,192), FogEnd 300, ExposureCompensation 0.1. Forbidden: modern machinery, sci-fi materials, Neon, clean geometry.${CLOSING}`,

  'horror-mansion': `You are building a horror mansion scene for Roblox — Resident Evil 1, Amnesia, Layers of Fear.

REQUIRED SUB-OBJECTS (minimum 55 parts total):
- Grand foyer: 24x0.5x30 stud Wood floor Color3.fromRGB(26,15,8), 4x20x30 stud Slate walls Color3.fromRGB(35,25,18), grand staircase (12 step Parts 8x1x0.5 studs ascending, WoodPlanks Color3.fromRGB(74,47,31), banister Cylinder posts every 3 studs).
- Hallways: 6-stud-wide corridors, Wood floor, Slate walls, 10+ studs long, doors every 12 studs (4x0.5x7 stud Wood Parts Color3.fromRGB(50,30,18), one left ajar at 15° rotation).
- Dining room: 16x0.5x20 stud room, long table (10x3x3 stud Wood Color3.fromRGB(60,35,20)), 6 chairs (3-part each: seat 1.5x1.5x0.3, back 1.5x0.3x2.5, legs), candelabra centerpiece (Metal base + 3 Cylinder candles 0.3x0.3x1.5 Color3.fromRGB(200,185,140) + PointLight Range 6 Brightness 0.4 Color3.fromRGB(255,180,80)).
- Library/study: bookshelves (6x1x8 stud WoodPlanks frames with 5-6 colored book Parts 0.3x0.8x1 stud per shelf), desk with open book, overturned chair.
- Unsettling details (minimum 3): fallen chandelier (Metal frame + 4-5 scattered Glass Parts on floor), bloody drag marks (0.3x0.05x4 stud Parts Color3.fromRGB(100,0,0) Transparency 0.3 on floor), cracked mirror (Part + Decal, Transparency 0.1), portrait with eyes cut out (Part with Decal, small Transparency 1 holes).
- Fireplace: 6x2x6 stud Brick frame Color3.fromRGB(60,40,30), PointLight Range 10 Brightness 0.5 Color3.fromRGB(255,140,40) flickering (attach to script-toggled Part), mantle with clock and candlesticks.

MATERIAL RULES: Wood Color3.fromRGB(26,15,8) for floors (dark, creaky). Slate for exterior and load-bearing walls. WoodPlanks for furniture and paneling. Fabric Color3.fromRGB(70,30,30) for curtains (2x0.1x8 studs) and cloth-draped furniture. Glass Transparency 0.3 for cracked windows. Brick for fireplaces.

LIGHTING IS CRITICAL: Future tech, ClockTime 2, Brightness 0.3, Ambient Color3.fromRGB(10,10,21), FogEnd 60, FogColor Color3.fromRGB(10,10,21), ExposureCompensation -0.8. NO ambient fill — use ONLY PointLights (candles Range 4-6 Brightness 0.3, fireplace Range 10 Brightness 0.5, moonlight through window Range 12 Brightness 0.2 Color3.fromRGB(140,150,200)). Deep shadows between light pools.

Colors: primary Color3.fromRGB(26,15,8), secondary Color3.fromRGB(74,47,31), accent Color3.fromRGB(139,0,0), highlight Color3.fromRGB(196,167,125).
Forbidden: bright lights, cheerful colors, Neon, modern materials, SmoothPlastic.${CLOSING}`,

  'tycoon-simulator': `You are building a tycoon game base for Roblox — Lumber Tycoon, Retail Tycoon, Miner's Haven style. Players buy droppers, upgrade conveyors, and watch cash stack up.

REQUIRED SUB-OBJECTS (minimum 50 parts total):
- Plot base: 200x0.5x200 stud Concrete pad Color3.fromRGB(180,180,175), bordered by 200x1x1 stud Neon frame Color3.fromRGB(39,174,96) on all 4 edges. Corner markers 2x2x2 stud Neon cubes.
- Spawn area: 16x0.5x16 stud SpawnLocation at one corner of the plot, Concrete Color3.fromRGB(236,240,241), with a "WELCOME" sign (4x3x0.3 Part + SurfaceGui, Metal frame).
- Dropper machine: 6x6x8 stud Metal housing Color3.fromRGB(70,80,90), funnel top (4x4x2 Wedge Metal Color3.fromRGB(44,62,80)), dropper pipe (Cylinder 1x1x3 Metal) pointing down, indicator light (1x1x1 Neon Color3.fromRGB(39,174,96)).
- Conveyor belt: 8 sequential 4x0.5x4 stud Parts forming a 32-stud-long belt, Metal Color3.fromRGB(90,95,100), side rails 0.5x1x32 stud Metal Color3.fromRGB(60,65,70). Texture property set for scroll effect. Arrow decals showing direction.
- Collector bin: 8x4x6 stud open-top Metal box Color3.fromRGB(44,62,80), reinforced edges (0.5-stud Metal strips Color3.fromRGB(55,60,70) along all edges), "COLLECTOR" SurfaceGui label.
- Upgrade pedestals: minimum 4, each 3x2x3 stud Concrete base Color3.fromRGB(200,200,195) with Neon button on top (2x0.5x2 Color3.fromRGB(39,174,96)), SurfaceGui showing upgrade name and price ("BUY - $100", "$500", "$2,000", "$10,000"). Spaced every 10 studs along upgrade path.
- Cash display: 6x0.3x3 stud Part mounted on a 0.5-stud arm, Neon Color3.fromRGB(243,156,18), SurfaceGui showing "$0" in large text. Positioned near spawn.

MATERIAL RULES: Concrete for base pad and pedestals. Metal for ALL machinery (droppers, conveyors, collectors). Neon for buttons, borders, indicators, and cash display. DiamondPlate for heavy-duty flooring in machine areas.

Colors: primary Color3.fromRGB(44,62,80), secondary Color3.fromRGB(236,240,241), accent Color3.fromRGB(39,174,96) cash green, highlight Color3.fromRGB(243,156,18) gold.
Lighting: ShadowMap, ClockTime 12, Brightness 2, Ambient Color3.fromRGB(224,224,224), ExposureCompensation 0. Clean and readable. Forbidden: organic shapes, unclear ownership borders, props without gameplay purpose, dark lighting.${CLOSING}`,

  'obby-parkour': `You are building an obby (obstacle course) for Roblox — Tower of Hell, Mega Easy Obby, Escape Room style.

REQUIRED SUB-OBJECTS (minimum 40 parts total, 10-15 stages):
- Start platform: 16x1x16 stud Part, Concrete Color3.fromRGB(46,204,113) GREEN so players know it is safe. SpawnLocation centered. "START" SurfaceGui sign on a 4x3x0.3 Metal post.
- Checkpoint platforms: 8x1x8 stud Parts, Neon Color3.fromRGB(255,255,0) YELLOW, placed between every 2-3 stages. Each checkpoint has a flag pole (Cylinder 0.3x0.3x5 Metal + 2x0.1x1.5 Fabric flag Color3.fromRGB(255,255,0)).
- Standard jump platforms: 4x1x4 to 6x1x6 studs, Concrete Color3.fromRGB(52,152,219) BLUE. Gap between platforms MUST be 4-20 studs horizontal (NEVER more than 22). Height difference MUST be 1-6 studs up (NEVER more than 7). Minimum 8 jump stages.
- Kill bricks: 4x0.5x4 to 8x0.5x8 studs, Neon Color3.fromRGB(231,76,60) RED, Transparency 0.5 so players can see through them. MUST have Touched connection that sets Humanoid.Health = 0. Place between safe platforms as hazards. At least 4 kill brick sections.
- Moving platforms: 4x1x4 stud Metal Color3.fromRGB(149,165,166) on TweenService back-and-forth (8-16 stud travel distance, 2-4 second cycle). At least 2 moving platform stages.
- Narrow beam: 1x1x12 stud balance beam, Concrete Color3.fromRGB(52,152,219), spanning a gap with kill bricks below.
- Disappearing tiles: 3x1x3 stud Parts that go Transparency 1 + CanCollide false after 1.5 seconds of touch, respawn after 3 seconds. Color3.fromRGB(155,89,182) PURPLE. Grid of 3x3 tiles.
- Finish line: 12x1x12 stud Part, Neon Color3.fromRGB(255,215,0) GOLD, with arch made of 2 vertical 1x1x8 Cylinder posts + 1 horizontal 1x1x10 Cylinder, all Neon gold. "FINISH!" SurfaceGui. Confetti ParticleEmitter if available.

STUD PHYSICS REFERENCE: Roblox character jumps ~7.2 studs high, ~24 studs far with full sprint. Design all gaps within these limits. Walking speed is 16 studs/sec.

MATERIAL RULES: Concrete for safe platforms (predictable friction). Neon for checkpoints, kill bricks, and finish. Metal for moving/rotating obstacles. No SmoothPlastic (too slippery for competitive obby). Fabric for flags only.

Colors: primary Color3.fromRGB(52,152,219) path blue, secondary Color3.fromRGB(236,240,241) white, accent Color3.fromRGB(231,76,60) kill red, highlight Color3.fromRGB(46,204,113) checkpoint green.
Lighting: ShadowMap, ClockTime 14, Brightness 3, Ambient Color3.fromRGB(176,208,224), ExposureCompensation 0. Bright and clear. Forbidden: impossible gaps (>22 studs), invisible walls, ambiguous kill zones, dark lighting.${CLOSING}`,

  'racing-track': `You are building a racing track for Roblox — Mario Kart, Forza Horizon, Need for Speed.

REQUIRED SUB-OBJECTS (minimum 60 parts total, closed loop track):
- Track surface: continuous ribbon of Concrete Parts 24 studs wide x 0.5 studs thick, Color3.fromRGB(44,62,80) dark asphalt. Minimum 200 studs of total track length. Lane divider: 0.5x0.05x2 stud Neon Parts Color3.fromRGB(236,240,241) white, spaced every 4 studs down center.
- Start/finish line: 24x0.05x2 stud checkered pattern (alternating 2x0.05x2 black/white Parts), spanning full track width. Overhead arch: 2 vertical Cylinder posts 1x1x10 studs + horizontal bar 1x1x26 studs, all Metal Color3.fromRGB(231,76,60) red. "START" SurfaceGui on arch.
- Turns (minimum 6): varying radius 20-60 studs, banked at ±10-20° CFrame roll. Tight hairpins use 20-stud radius, sweeping bends use 40-60 stud radius. Apex kerbs: 1x0.3x4 stud alternating Color3.fromRGB(231,76,60) red / Color3.fromRGB(236,240,241) white Parts along inner edge.
- Chicane: S-curve section with 2 direction changes in 20 studs, narrowed to 20 studs with barrier islands (2x1x6 stud Concrete Color3.fromRGB(200,200,195)).
- Barriers: Metal guardrails on ALL turns — 0.5x2x variable-length Parts Color3.fromRGB(180,180,180), supported by Cylinder posts 0.4x0.4x2 every 8 studs. Tire walls on tight corners (Cylinder 2x2x1 stud Color3.fromRGB(30,30,30) stacked 2 high, 3-4 per corner).
- Pit stop area: 20x0.5x12 stud Concrete pad Color3.fromRGB(70,75,80) branching off main track, 3 pit bays (6x0.5x10 each) with colored markers (Neon 0.5x0.05x6 stud lines), tool rack prop (4x1x3 Metal Part).
- Grandstand seating: stepped structure — 3 rows of 20x0.5x2 stud Concrete benches at 2-stud height increments, back wall 20x0.5x6 stud, Color3.fromRGB(160,160,165). Seats colored Color3.fromRGB(231,76,60) red. Roof overhang 22x0.1x8 Metal.
- Distance markers: 2x0.3x2 stud Metal signs every 50 studs with SurfaceGui showing distance ("50m", "100m", etc.).

MATERIAL RULES: Concrete for track surface and structures. Metal for barriers, arch, signs. Neon for lane markings and kerbs only. DiamondPlate for pit stop floor. Fabric for flags/banners.

Colors: primary Color3.fromRGB(44,62,80) asphalt, secondary Color3.fromRGB(236,240,241) stripe white, accent Color3.fromRGB(231,76,60) start/warning red, highlight Color3.fromRGB(243,156,18) caution orange.
Lighting: ShadowMap, ClockTime 13, Brightness 2.5, Ambient Color3.fromRGB(176,176,176), ExposureCompensation 0. Forbidden: gaps in track surface, unprotected drop-offs, choke points narrower than 20 studs, unclear racing line.${CLOSING}`,

  'tower-defense': `You are building a tower defense map for Roblox — Bloons TD, Tower Defense Simulator, All Star Tower Defense.

REQUIRED SUB-OBJECTS (minimum 55 parts total, 200x200 stud max map):
- Enemy path: 6-stud-wide ribbon of Concrete Parts Color3.fromRGB(107,66,38) earth brown, winding through the map with at least 8 corners/turns. Path is made of sequential 6x0.5x variable-length Parts joined at angles. Total path length minimum 200 studs. Path MUST be a single clear route from spawn to base.
- Path waypoints: Invisible (Transparency 1) 1x1x1 Parts named "Waypoint1" through "WaypointN" inside a Folder named "Waypoints", placed at every turn and at path start/end. These are what enemy AI follows.
- Spawn portal: 8x8x10 stud arch at path start — 2 Cylinder pillars 2x2x10 Color3.fromRGB(231,76,60) red + arch top Wedge, Neon glow. PointLight Range 12 Color3.fromRGB(255,60,60). "ENEMY SPAWN" SurfaceGui. Floor Part 8x0.5x8 Neon Color3.fromRGB(231,76,60) Transparency 0.3.
- Base to defend: 12x8x12 stud castle/fortress at path end — Slate walls Color3.fromRGB(120,115,105), crenellated top, gate facing the path 4x0.5x6 studs WoodPlanks Color3.fromRGB(100,70,40), flag on top (Cylinder pole 0.3x0.3x4 + Fabric flag 2x0.1x1.5 Color3.fromRGB(59,130,246)). "BASE HP: 100" SurfaceGui.
- Tower placement pads: minimum 12, each 8x0.5x8 stud Parts, Grass Color3.fromRGB(144,238,144) with subtle Transparency 0.1, spaced strategically at path choke points and corners. 0.3-stud raised border Color3.fromRGB(100,200,100). NO pad should overlap the path. Pads near corners are premium positions.
- Terrain fill: Grass material Color3.fromRGB(80,140,60) for ground between path and pads. Decorative rocks (2x2x2 Rock Parts), bushes (2x2x2 LeafyGrass spheres Color3.fromRGB(50,120,40)), trees (Cylinder 1x1x6 + 3x3x3 LeafyGrass sphere) scattered in non-gameplay areas.
- UI markers: wave counter sign (4x0.3x2 Metal Part + SurfaceGui "Wave 1") near spawn, gold counter (similar near base with Color3.fromRGB(243,156,18)).

MATERIAL RULES: Concrete for enemy path. Grass for terrain and tower pads. Slate for base fortress. Rock for decorative boulders. LeafyGrass for vegetation. Neon for spawn portal glow and UI accents only.

Colors: primary Color3.fromRGB(107,66,38) path, secondary Color3.fromRGB(46,204,113) placement green, accent Color3.fromRGB(231,76,60) enemy red, highlight Color3.fromRGB(243,156,18) gold.
Lighting: ShadowMap, ClockTime 14, Brightness 2.5, Ambient Color3.fromRGB(192,192,176), ExposureCompensation 0. Forbidden: ambiguous paths, tower pads overlapping path, unclear spawn/end, paths without waypoint folders.${CLOSING}`,

  'rpg-adventure': `You are building an RPG adventure zone for Roblox — Zelda BotW, Dragon Quest, Hollow Knight starting village.

REQUIRED SUB-OBJECTS (minimum 60 parts total):
- Central plaza: 30x0.5x30 stud Cobblestone floor Color3.fromRGB(142,133,122), with focal statue/fountain (fountain: 6x3x6 stud Slate basin + Cylinder 1x1x4 center pillar + 2x2x1 top bowl, Color3.fromRGB(130,125,115)).
- Shop building: 12x12x10 stud, Slate walls Color3.fromRGB(142,133,122), Wood roof (2 angled 14x0.5x8 Parts meeting at ridge Color3.fromRGB(107,59,26)), door 3x0.5x6 stud Wood Color3.fromRGB(90,50,20) (distinct from wall), 2 windows 2x0.3x2.5 Glass, sign (3x0.3x1.5 Wood + SurfaceGui "SHOP"). Display shelf inside with 3-4 item proxies.
- Inn: 14x14x12 stud, same material palette but different proportions, second floor balcony (14x3x0.5 Wood + railing), chimney (2x2x4 Brick Color3.fromRGB(140,70,40)) on roof with smoke (ParticleEmitter if available). Sign "INN".
- Blacksmith: 10x12x8 stud open-front forge, anvil (2x1x1.5 Metal Color3.fromRGB(60,60,65)), forge fire (PointLight Range 8 Color3.fromRGB(255,120,30) + 2x2x2 Part with CrackedLava material), weapon rack (4x0.5x4 Wood frame with 3 sword proxies 0.3x0.3x3).
- Quest-giver house: 10x10x9 stud, golden door frame accent Color3.fromRGB(245,205,48), exclamation mark sign (Part Color3.fromRGB(245,205,48) "!" SurfaceGui) above door.
- Well: 4x4x3 stud Cobblestone cylinder + 2 Cylinder posts 0.4x0.4x4 + crossbar + rope (Cylinder 0.1x0.1x3 Fabric).
- NPC stand points: Invisible Anchored Parts (Transparency 1, 1x0.1x1) named "NPCSpawn_Shopkeeper", "NPCSpawn_Innkeeper", etc. placed at doorways.
- Market stall: 6x4x6 stud Wood frame with Fabric canopy Color3.fromRGB(180,50,40), table with goods (small colored Parts as produce/potions).
- Living details: flower pots (Cylinder 1x1x1 Brick + LeafyGrass 1.5x1.5x1 sphere Color3.fromRGB(46,180,80)), crates, barrels, hanging lanterns (PointLight Range 10 Color3.fromRGB(255,200,100)), cobblestone path connecting all buildings.

MATERIAL RULES: Cobblestone for plaza and paths. Slate for building walls. Wood for structural beams, doors, furniture. WoodPlanks for floors. Brick for chimneys and planters. Metal for hardware and weapons. LeafyGrass for vegetation.

Colors: primary Color3.fromRGB(107,59,26) wood, secondary Color3.fromRGB(142,133,122) stone, accent Color3.fromRGB(245,205,48) quest gold, highlight Color3.fromRGB(58,166,255) magic blue.
Lighting: ShadowMap, ClockTime 10, Brightness 2.2, Ambient Color3.fromRGB(176,168,136), ExposureCompensation 0. Warm morning feel. Forbidden: empty dead space, identical buildings, purely decorative props without gameplay hooks, modern materials.${CLOSING}`,

  generic: `You are building a real Roblox scene — not a demo, not a concept, a REAL build players will explore.

DETAIL REQUIREMENTS:
- Every object is multi-part. A lamp = base + pole + arm + shade + bulb + PointLight. A tree = trunk + branches + canopy spheres. NEVER use a single Part for any recognizable object.
- Use 2-3 color SHADES per object for depth (light wood + dark wood, not flat brown).
- At least 30 distinct parts for any scene. Single objects need 4-8 parts minimum.
- Coherent material palette (3-5 TEXTURED materials — Wood, Brick, Concrete, Metal, Grass, Slate, Cobblestone). NEVER default to SmoothPlastic.
- Add PointLights to anything that glows. Use warm colors (255,200,100) for indoor lights, cool (200,220,255) for outdoor.
- Set Lighting (ClockTime, Brightness, Ambient) to match the mood.
- Use Color3.fromRGB() for all colors. Every Part needs a purpose — no grey boxes.${CLOSING}`,
}

/**
 * Resolve the best template for a free-text genre hint. Falls back to
 * `generic` when no close match is found.
 */
export function resolveBuildTemplate(genreHint: string | undefined): string {
  if (!genreHint) return BUILD_TEMPLATES.generic
  const normalized = genreHint.toLowerCase().trim()
  if (normalized in BUILD_TEMPLATES) {
    return BUILD_TEMPLATES[normalized as Genre]
  }
  // Fuzzy match on substrings.
  for (const key of Object.keys(BUILD_TEMPLATES) as Genre[]) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return BUILD_TEMPLATES[key]
    }
  }
  return BUILD_TEMPLATES.generic
}
