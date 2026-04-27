/**
 * DevForum Building Mastery Knowledge Base
 *
 * Extracted from dozens of top Roblox DevForum threads, Medium articles,
 * and professional builder guides. Every line teaches the AI something
 * practical it can use to generate better builds.
 *
 * Sources include:
 * - devforum.roblox.com/t/guide-of-how-to-improve-your-buildings-long/1606301
 * - devforum.roblox.com/t/advanced-guide-to-efficient-building/2198562
 * - devforum.roblox.com/t/building-tips-and-tricks-guide/20964
 * - devforum.roblox.com/t/ultimate-perlin-noise-terrain-guide/3109400
 * - devforum.roblox.com/t/meshpart-usage-performance-optimizations/1319217
 * - devforum.roblox.com/t/the-importance-of-color-and-how-to-use-color/222075
 * - devforum.roblox.com/t/roblox-lighting-modes/1687174
 * - devforum.roblox.com/t/hyper-realistic-lighting-settings/915802
 * - devforum.roblox.com/t/creating-a-realistic-city/3053768
 * - devforum.roblox.com/t/ideas-on-how-to-create-a-more-spooky-atmosphere/1824887
 * - devforum.roblox.com/t/bringing-back-simple-cars/2148797
 * - devforum.roblox.com/t/tips-and-tricks-for-building/1668709
 * - devforum.roblox.com/t/studs-to-real-life-measurements/1822621
 * - devforum.roblox.com/t/how-to-city-layout/1347903
 * - medium.com/@280134408zaro/hidden-architecture-behind-large-scale-roblox-worlds
 * - And 40+ additional threads
 */

import 'server-only'

// ── Master Knowledge Constant ───────────────────────────────────────────────

export const DEVFORUM_BUILDING_KNOWLEDGE = `
=== DEVFORUM BUILDING MASTERY (extracted from top Roblox developers) ===

TERRAIN TECHNIQUES:
- Perlin noise is the standard for procedural terrain. Use math.noise(x, y, z) which returns -0.5 to 0.5. Add 0.5 to normalize to 0-1.
- Key parameters: Scale ~10 (zoom level), Frequency ~0.4 (feature density), Amplitude ~10 (height range), ChunkSize ~2 (voxel size).
- Offset generation: Use Random.new(Seed) to get xOffset and zOffset in range -100000 to 100000. Values outside this range cause distortion.
- Noise sampling: sampleX = x / Scale * Frequency + xOffset; sampleZ = z / Scale * Frequency + zOffset.
- Height calculation: baseY = math.clamp((math.noise(sampleX, sampleZ) + 0.5), 0, 1); y = baseY * Amplitude.
- Part sizing: Set height to y * 2 + 1 to prevent holes between terrain blocks.
- Color by elevation: Snow at 0.8+ (255,255,255), Grass at 0.5+ (44,93,40), Shallow water at 0.25+ (110,168,255), Deep ocean at 0+ (48,89,149).
- Water smoothing: Use InverseLerp to flatten water areas. If baseY <= threshold return 0, else interpolate between threshold and 1.
- Biomes: Use separate noise layers with different frequency/offset params. Apply thresholds to assign biome types. Blend transitions with smoothing.
- Performance: Include task.wait() in outer loops to prevent studio crashes. Can generate huge maps in under 2 seconds with efficient loops.
- Convert parts to terrain using Part to Terrain plugin for natural ground coverage.
- Terrain Grow tool at low strength smooths terrain more naturally than the Smooth tool.
- Terrain Grow at low strength also blends different terrain material types seamlessly.
- Paint terrain after generating to add material variety (darker greens for shade, lighter for sun).

LIGHTING MASTERY:
- ALWAYS use Future lighting for quality builds. It enables realistic shadows, reflections, and dependent lighting.
- Future mode uses ~700MB client memory vs 450MB for Compatibility. Only use Compatibility for massive low-poly maps.
- ShadowMap (~550MB) is a good middle ground. Voxel (~600MB) works for obbies where shadows are disabled.
- Test lighting at graphics levels 2, 4, 8, and 10 — player settings drastically change appearance.
- Hyper-realistic lighting preset: Brightness 2.3, EnvironmentSpecularScale 1, ShadowSoftness 0.1, Technology Future.
- ColorCorrectionEffect: Saturation 0.1, Contrast 0.1. Keep subtle — heavy correction looks artificial.
- Sunrays: Intensity 0.2, Spread 0.7. Adds atmospheric light streaks without overwhelming.
- Bloom: Intensity 0.1, Size 0.4, Threshold 0.8. Too much bloom makes everything glow unrealistically.
- Atmosphere: Glare 10, Haze 1.55. These values create a natural atmospheric depth effect.
- Ambient/shadow colors should be cool-toned gray. ColorShift_Bottom should be pale yellow in daytime, cool white at night.
- Use multiple light sources (PointLights, SurfaceLights) rather than relying on sun alone.
- Warm lights (orange/yellow tones) for interiors, cool lights (blue tones) for exteriors and moonlight.
- Household interior lighting should mimic ~3000K warm white temperature.
- Layer effects progressively: start with sun rays, add Depth of Field, then Color Correction, then Bloom.
- Depth of Field focuses foreground while blurring background — great for cinematic depth.
- Clouds rank 4.5/5 for lag impact — REMOVE dynamic clouds unless absolutely essential.
- Night scenes benefit from custom skies with enlarged moons and increased star density.
- Water beneath structures creates mirror reflections when WaterReflectance = 1.
- Neon material is the MOST performance-expensive material due to brightness calculations.
- Disable CastShadow on objects that are already in shadow or on tiny decorative details.

LOW-POLY BUILDING:
- Low poly in Roblox means low brick count with clean geometric shapes.
- ALWAYS use SmoothPlastic material for the classic flat-shaded low-poly look (exception: ForjeGames avoids SmoothPlastic — use Concrete or Wood for stylized low-poly instead).
- Favor Parts, Wedges, and CornerWedges. Minimize Spheres and Cylinders which look too smooth.
- Keep part counts intentionally low — the style is defined by deliberate simplicity.
- Use 5-10 sided shapes for recognizable low-poly silhouettes.
- Sharp edges over rounded surfaces. Angular design is the hallmark of good low-poly.
- Bright, saturated colors work best with low-poly. High contrast between adjacent parts.
- Layer glass parts over neon parts for a glossy glow effect.
- GapFill plugin creates sharper polygonal surfaces that better mimic 3D modeling results.
- Three variants of each model using color, rotation, and size variation creates natural variety without more unique models.
- Low-poly textures make a big visual difference even without detailed geometry.
- Avoid super inverted angles — they create distorted geometry and break the clean style.
- For low-poly terrain: create mesh planes in Blender, add edge loops, manipulate vertices, extrude for height.
- Export from Blender as .obj or .fbx, import into Studio via MeshPart. Always anchor imported meshes.

PROP BUILDING:
- Props are space fillers that serve contextual purposes. Every prop should feel intentional, not random.
- Industrial props: metal crates, barrels, palettes, forklifts, shelving, barriers, fencing, vents.
- Decorative props: posters, signage, direction maps, plants, alarm lights, spilled drinks.
- Environmental storytelling: place props that tell a story about who uses the space.
- Study real-world environments for authentic prop placement — offices, warehouses, homes, schools.
- Use three shades per color to add depth with fewer parts.
- Fill empty spaces with supplementary elements: signs, vents, wires, pipes, cracks, stains.
- Furniture should use 1/5-stud grid for detail. Main structures use 1-stud grid.
- Scale based on multiples: 4, 8, 16, 32, 64, 128 studs for consistent proportions.
- Even-numbered dimensions maintain grid alignment through rotation.
- Always anchor all props and furniture to prevent physics lag.

COLOR & AESTHETICS:
- Red: action, attention-grabbing. Use for highlights, buttons, danger zones. Don't overuse.
- Orange: warmth, fall themes. Mid-ground between red and yellow energy.
- Yellow: joyfulness, food, youth. Appeals to younger audiences in roleplay games.
- Green: nature, well-being, money, luck. Most readily perceived by humans. Calming effect.
- Blue: trust, calmness, technology, sky/ocean. Statistically most favored color. Great for UI neutrals.
- Violet: royalty, magic, mystery. Works for fantasy and premium themes.
- Pink: romance, softness. Good accent color.
- Brown: earth, old age, outdoor scenery. Essential for natural environments.
- White: order, purity, cleanliness. Medical/clean contexts.
- Black: power, evil, fear. Creates moody atmosphere. Use for shadows and depth.
- NEVER use overly vibrant colors on large surfaces — causes eye strain.
- Colors opposite on the color wheel create maximum contrast and visual pop.
- Mix saturation levels to prevent washed-out or stressful visuals.
- Use Google Material Design palette for aesthetically pleasing color schemes.
- Apply golden ratio positioning for natural visual appeal.
- Use 9-grid layout with center intersections as focal points.
- Three shades per color (light, medium, dark) adds depth without complexity.
- Consistent palette across a build creates cohesion — random colors look amateur.
- Tint lights specific colors to establish mood throughout a scene.
- Sharp contrast between light and dark colors (white and gray) creates architectural interest.

WATER & NATURE:
- Roblox native water is limited. For quality waterfalls, use layered beams approach.
- Layered beams complementing each other creates dynamic waterfalls with visual depth.
- Mesh-flipbook particles are an alternative for waterfall effects with interesting results.
- Add subtle mist effects and minimal foam accents for realism without performance hit.
- Multiple beam layers create 3D appearance rather than flat waterfall visuals.
- Prioritize effects that feel dynamic and stylized without being performance-heavy.
- Roblox lacks native flow maps — use creative workarounds with existing tools.
- For oceans: Gerstner waves system creates realistic wave animations.
- Water terrain beneath buildings creates reflection effects when configured properly.
- Set WaterReflectance to 1 and calibrate wave speed/size for mirror-like surfaces.
- Rivers are challenging — standard water parts create visual inconsistency with wave systems.
- Trees: create custom models or source from toolbox. Always add variety in size and rotation.
- Rocks: use wedges and irregular parts. Never place identical rocks side by side.
- Grass: convert floor parts to terrain grass material for natural ground coverage.

PROFESSIONAL WORKFLOW:
- Phase 1 REFERENCE: Collect detailed references. Steal the best parts from every reference image. Combine best aspects from multiple sources.
- Phase 2 LAYOUT: Create clear visual indication of project scope. Use rough shapes to define space.
- Phase 3 SKETCH: Work quickly with simple boxes. Grey for structures, color-coded for landmarks. Speed prevents burnout.
- Phase 4 GREYBOX: Build detailed planning layer atop sketch. Implement accumulated design ideas. Fill entire map.
- Phase 5 MODEL: Use Blender for complex and simple elements (pillars, supports, details). Export as mesh.
- Phase 6 ART PASS: Iterative refinement. Layer detail and polish. Balance deadlines vs quality.
- Greyboxing principle: Subdivide into smaller sections until each piece feels manageable and perfectible.
- Work bottom-up: break complex projects into manageable components that assemble into finished pieces.
- Use dual monitors: references on one screen, Studio on the other.
- Specialize in specific building styles rather than trying to master everything at once.
- Detail addition: after basic layout solidifies, gradually add signs, vents, wires, props.
- A 7-month project is normal for complex maps. Don't rush. Staged development prevents burnout.
- Essential plugins: F3X (resize), ResizeAlign (gap alignment), Archimedes (curves), Part to Terrain, Brushtool 2.1 (organic scattering), Model Reflect (symmetry), Power Selectors (multi-select), Stravant GapFill (gap elimination).
- Challenge yourself with complex shapes to improve adaptability and skill.
- Never use GapFill as a substitute for learning Blender — it's a crutch that limits growth.

PERFORMANCE OPTIMIZATION:
- Maximum 5000 parts within player rendering area for 60fps on low-spec devices.
- Buildings WITHOUT interiors: 100-600 parts each. Buildings WITH interiors: up to 2000 parts.
- At 9000 parts in view, expect 25-30fps on low-end devices.
- Greedy meshing reduces part count dramatically: 15,931 instances down to 508 in one test.
- Greedy meshing algorithm: find starting block, expand along one axis until empty/visited, then expand perpendicular.
- MeshPart RenderFidelity: Performance (background), Automatic (important objects), Precise (landmarks only).
- CollisionFidelity: Box (lowest cost, walkthrough objects), Hull (trees/branches), Default (complex shapes with holes), PreciseConvexDecomposition (rarely needed).
- Disable CanCollide AND CanTouch on non-interactive decorations. Set their CollisionFidelity to Box.
- Reuse identical MeshIDs across instances — engine downloads mesh once and reuses geometry.
- NEVER use UnionOperations in production. They create excessive triangles, weird collisions, prevent instancing, and are 99% unnecessary.
- Convert unions to MeshParts: export as OBJ, reimport as single MeshPart with texture.
- Use basic Roblox Parts for cubes — they load faster than imported cube meshes.
- Workspace Streaming: players load parts up to defined limit (default 1024 studs). Allows massive worlds.
- Always anchor all constructions — unanchored parts cause physics lag.
- Neon material is most performance-expensive. Glass is 3/5 lag. Lights are 3/5 lag.
- Chunk-based world streaming: divide world into 100x100 stud grids. Activate nearby entities, deactivate distant ones.
- This approach reduces server load by 40-70%.
- Server tick budget is 30 Hz. AI loops, pathfinding, physics, and remote events all consume this budget.
- Remote events fired every frame is the #1 network mistake. Send only on state changes, batch updates.
- NPC pathfinding: recalculate every 0.5-1.5 seconds, not every frame. 10 NPCs pathfinding simultaneously drops server by 20%.
- AI should sleep when players are far away. Use cheap hitbox interactions instead of full physics.
- MeshPart collision simplification: convert to box or hull shapes. 100 decorative meshes cost less than 1 poorly-optimized collision mesh.
- Network ownership: player movement objects to client, bosses to server, static objects have no physics.
- The bigger the vision, the smaller the simulation must become. Large worlds maintain illusion of scale with minimal active simulation.

COMMON MISTAKES TO AVOID:
- Using too many neon/glass materials — performance killer and looks amateurish.
- Leaving parts unanchored — causes physics simulation lag.
- Enabling dynamic clouds without need — 4.5/5 lag severity.
- Using UnionOperations instead of MeshParts — laggy, fragile, and unnecessary.
- Flat terrain with no variation — always add hills, valleys, and elevation changes.
- Identical props placed side by side — use 3 variants with color/rotation/size changes.
- Overusing Bloom effect — makes everything too bright or washed out.
- Ignoring low-end devices — always test at graphics level 2.
- Building at wrong scale — use Roblox character (5 studs tall) as reference.
- Fractional stud measurements like 1/5 stud — creates precision errors in unions.
- Not using references — professional builders ALWAYS collect references first.
- Starting with details instead of layout — work big to small, rough to refined.
- Placing lights everywhere — each light costs performance. Use strategically.
- Using SpecialMeshes instead of MeshParts — SpecialMeshes need 2 instances and lack fidelity options.
- Firing RemoteEvents every frame — batch updates and send only on state changes.
- Not testing across different graphics levels (2, 4, 8, 10) before shipping.
- Random color choices instead of a cohesive palette — looks unprofessional.
- Too many scripts running simultaneously — consolidate where possible.
- Using Precise collision on decorative objects — use Box for anything non-interactive.
- Building everything from scratch when toolbox has quality free models available.

SCALE & PROPORTION REFERENCE:
- Roblox character is approximately 5 studs tall (with head).
- Standard door: 3 studs wide, 7 studs tall.
- Standard wall height: 12-16 studs (residential), 20-30 studs (commercial).
- Standard floor thickness: 1 stud.
- Standard wall thickness: 1 stud (interior), 1-2 studs (exterior).
- Window: 3-4 studs wide, 4-5 studs tall, placed 3-4 studs from floor.
- Staircase: each step 1 stud deep, 1 stud tall, 4-6 studs wide.
- Table height: 3.5 studs. Chair seat: 2.5 studs. Counter: 4 studs.
- Sidewalk: 6-8 studs wide. Road lane: 8-12 studs wide.
- Ceiling: walls + floor thickness, typically 13-17 studs floor-to-floor.
- Use even-numbered dimensions to maintain grid alignment through rotation.
- Scale based on power-of-two multiples: 4, 8, 16, 32, 64, 128 studs.

MATERIAL GUIDE:
- Concrete: rough, industrial, modern. Good for walls, foundations, urban buildings.
- Wood: warm, natural, residential. Good for floors, furniture, cabins, fences.
- Brick: traditional, sturdy, textured. Good for exterior walls, chimneys, paths.
- Metal: cold, industrial, futuristic. Good for beams, railings, machinery, sci-fi.
- Granite: heavy, durable, premium. Good for monuments, countertops, fancy buildings.
- Marble: luxury, classical, clean. Good for pillars, floors, statues, museums.
- Slate: dark, natural, layered. Good for roofs, pathways, fantasy builds.
- Grass: natural ground cover. Better to use terrain grass than part grass for large areas.
- Sand: beach, desert, dry environments. Pair with warm lighting.
- Ice: frozen environments, magical effects. Partially transparent.
- Fabric: soft goods, curtains, cushions. Adds warmth to interiors.
- Foil: metallic shine, wrapping, sci-fi accents. Highly reflective.
- Glass: windows, displays, modern architecture. 3/5 performance cost — use sparingly.
- Neon: glowing accents, signs, sci-fi. MOST expensive material — use VERY sparingly.
- DiamondPlate: industrial floors, metal surfaces with grip pattern.
- CorrodedMetal: aged, abandoned, post-apocalyptic environments.
- Cobblestone: medieval, old town, village paths.
- Pebble: natural ground, river beds, garden paths.
- SmoothPlastic: flat shading, low-poly style, clean surfaces. Common for cartoony builds.
- ForceField: energy shields, barriers, magical effects. Very niche use.

RESIDENTIAL HOUSES:
- Starter house (small): 20x16 stud footprint, 14 studs to roof peak. 4 rooms: living room (10x8), kitchen (10x8), bedroom (10x8), bathroom (6x6).
- Construction sequence: 1) Foundation (footprint + 1 stud border, 1 stud tall, Concrete). 2) Exterior walls (1-2 studs thick, 12 studs tall). 3) Interior walls (1 stud thick). 4) Floor/ceiling (1 stud thick). 5) Roof. 6) Windows/doors. 7) Interior furnish. 8) Exterior detail.
- Foundation: extends 1 stud past walls on all sides. Concrete material, darker than walls (130,130,135). 1-2 studs tall visible above ground.
- Exterior wall construction: place a box frame first (4 walls). Cut window openings (3x4 studs, placed 3 studs from floor). Cut door opening (3x7 studs).
- Interior wall: 1 stud thick, full floor-to-ceiling height. Leave 3x7 stud door openings. Lighter color than exterior.
- Pitched roof: two angled planes meeting at ridge. Use wedge parts or angled regular parts at 30-45 degrees. Overhang 1-2 studs past walls.
- Gable end: triangular wall section filling the gap between wall top and roof. Match exterior wall material.
- Hip roof: all four sides slope up to a ridge. More complex — use wedges on all sides. Better rain shed and wind resistance.
- Roof materials: Slate (gray, formal), Wood (brown, rustic), Brick (terracotta, Mediterranean), Concrete (flat roofs). Never use Metal for residential.
- Two-story house: 30x20 stud footprint. First floor 13 studs (12 wall + 1 ceiling). Second floor 13 studs. Total to roof peak: 30-35 studs.
- Staircase (interior): 4-6 studs wide. Each step 1x1 stud. Total run: 12-13 steps for one floor (12-13 studs horizontal, 12-13 studs vertical). Add railing.
- L-shaped staircase: runs 6 steps, landing (3x3 studs), turns 90 degrees, runs 6 more steps. Saves horizontal space.
- Railing: vertical posts (0.3x0.3x3 studs) every 2 studs, horizontal top rail connecting them. Wood or Metal.
- Ranch house: single story, long and low. 40x20 stud footprint. Low-pitched roof. Attached garage on one end.
- Colonial house: two stories, symmetrical facade. Center door with windows evenly spaced on both sides. 5 windows across second floor.
- Victorian house: ornate trim, bay windows (3 angled windows projecting 2 studs from wall), wraparound porch, multiple roof peaks, decorative brackets.
- Cabin/cottage: 16x12 stud footprint. Log walls (brown cylinders stacked horizontally or Wood with dark horizontal lines). Steep roof for snow. Stone chimney.
- Apartment unit: 16x20 studs per unit. Open plan living/kitchen, one bedroom, one bathroom. Stack 4-8 units vertically. Shared hallway access.
- Porch: 16x6 stud platform, 1 stud above ground. 4-6 columns (1x6x1 studs) supporting roof extension. Railing between columns.
- Bay window: three windows at angles (center straight, sides at 30-45 degrees). Projects 2-3 studs from wall. Add small roof above and shelf below.
- Dormer window: small gabled projection from roof slope. Window 2x3 studs, mini roof above. Provides light to attic rooms.
- Garage: 12x16 studs (single), 20x16 studs (double). Door 10x8 studs (single) or 18x8 studs (double). Concrete floor, drywall interior.
- Mudroom/entryway: 4x6 stud transition space inside front door. Coat hooks on wall (small cylinders), shoe rack (3x1x1.5 studs), small bench.
- Laundry room: 6x6 stud minimum. Washer 2x2x3.5 studs + dryer 2x2x3.5 studs side by side. Utility sink. Shelving above.
- House exterior colors: warm neutrals (beige 210,200,180, cream 240,235,220, sage 180,195,170), trim white (245,245,245), dark accents (shutters, door).
- Shutters: decorative panels flanking windows. 1x0.3x4 studs each. Dark contrasting color (navy, forest green, black).
- Front door color: red (170,40,40), navy (30,40,70), forest green (40,80,50), or bright accent. Always different from wall color.
- Pro tip: Every house needs at least one focal point on the facade — a prominent door, a bay window, or a porch. Don't make a flat box.
- Pro tip: Vary window sizes between floors. First floor often has taller windows (4-5 studs) than second floor (3-4 studs).
- Pro tip: Add window sills (3x0.5x0.3 stud ledge below each window) and header trim (3x0.3x0.3 above each window).
- Common mistake: All walls same color. Use different colors/materials for foundation, walls, trim, and roof.
- Common mistake: Perfectly flat yard. Terrain should gently slope away from house foundation for drainage realism.
- Common mistake: No eaves (roof overhang). Roof must extend 1-2 studs past walls. Without it, the house looks like a box with a hat.

SCHOOL CAMPUS:
- Main building: 60x40 stud footprint per wing. H-shape or L-shape layout. 2-3 stories. Brick exterior walls.
- Classroom: 16x12 studs interior. 6-8 student desks (2x1.5x3 studs) in rows. Teacher desk (3x2x3.5 studs) at front. Whiteboard (6x0.1x3 studs) on wall.
- Student desk: 2x1.5x3 studs with attached chair. Metal frame, Wood top. Place in rows of 3-4, columns of 2-3.
- Hallway: 6-8 studs wide. Lockers along both walls (1x1x5 studs each, Metal, alternating 2-3 colors). Numbered doors every 16 studs for classrooms.
- Locker: 1x1x5 studs, Metal material. Small handle detail (0.1x0.1x0.3 stud). Vent slits at top (thin dark lines). Color: blue, red, green, or gray.
- Gymnasium: 40x60 studs interior, 20+ studs ceiling height. Wood floor. Basketball hoops at each end. Bleachers along one wall.
- Bleachers: tiered seating 5 rows deep. Each row 1 stud tall, 2 studs deep. Wood or Metal seats. Total depth 10 studs, height 5 studs.
- Cafeteria: 30x40 studs. Long tables with attached benches (12x2x3 studs). Serving counter along one wall. Kitchen behind with service window.
- Library: 20x30 studs. Bookshelves (4x1x8 studs) in rows 4 studs apart. Reading area with comfortable chairs. Circulation desk near entrance.
- Science lab: 16x14 studs. Lab benches 6x2x4 studs (Granite top for chemical resistance). Stools 1x1x3.5 studs. Fume hood on wall (3x2x6 studs).
- Computer lab: 16x12 studs. Desks along walls with monitors (1.5x0.2x1 stud screens on stands). Rolling chairs. Server rack in corner.
- Principal office: 10x10 studs. Large desk (4x2x3.5 studs), leather chair, filing cabinet (1.5x1x4 studs Metal), bookshelves, visitor chairs.
- Nurse office: 8x10 studs. Exam bed (3x6x2.5 studs), desk, supply cabinet, curtain divider (0.1 stud Fabric on rail).
- Playground area: 30x30 studs adjacent to building. Equipment (see parks section). Rubber surface. Boundary fence.
- Sports field: 80x50 studs. Grass terrain with white line markings. Track around perimeter (4 studs wide, Pebble material).
- Parking lot (school): 40x30 studs. Spaces angled 45 degrees for easier pull-in. Faculty section closer to building, visitor section near entrance.
- Flagpole: Metal cylinder 0.5x20x0.5 studs. Base plate 2x0.5x2 studs. Flag 3x0.1x2 studs (Fabric). Place at main entrance.
- School bus: yellow (255,200,0) bus body 16x3x5 studs. Black trim. Stop sign on left side (1x0.1x1 stud red octagon). Flat front.
- Clock tower: if prominent, 4x4x25 stud tower rising from building. Clock face (circle 3 stud diameter with SurfaceGui) on all 4 sides.
- School color palette: Brick walls (170,85,60), concrete trim (200,200,205), institutional green (80,130,95), floor tile (beige 200,190,170).
- Pro tip: Schools need clear wayfinding — different colored hallway sections, room numbers visible above doors, directional signs at intersections.
- Pro tip: Add bulletin boards (3x0.2x2 studs, cork-colored) in hallways with small paper prop parts pinned to them.
- Common mistake: Hallways too narrow. School hallways need 6-8 studs for character traffic flow.
- Common mistake: Classrooms too small. 16x12 studs is MINIMUM for a functional classroom with desk layout.

MILITARY AND BUNKER:
- Military base perimeter: chain-link fence with barbed wire (see industrial section). Double gate entrance with guard booth and barrier arms.
- Barracks: 40x12 stud interior. Bunk beds (3x6x5 studs, two beds stacked) in rows of 6-10. Footlockers (2x1x1 stud Metal) at bed ends.
- Bunk bed: lower bed frame 3x6x2 studs (Metal), upper frame at 4 studs height. Ladder on one end (0.5x1x2 Metal rungs). Gray/OD green bedding.
- Command center: 20x16 studs. Large central table (8x4x3.5 studs) with map/screens. Monitors on walls. Communications equipment (Metal boxes with antennas).
- Watchtower: 4x4x16 stud platform on 4 legs. Enclosed top with windows on all sides. Searchlight (SpotLight) mounted on rail. Ladder access.
- Bunker entrance: reinforced concrete door 4x8 studs, 2 studs thick. Set into hillside or underground. Blast-resistant frame (3-stud-thick concrete border).
- Underground bunker: rooms connected by 4-stud-wide corridors. Low ceilings (8-10 studs). Concrete everywhere. Emergency lighting (red PointLights, dim).
- Sandbag wall: stacked sandbags (1.5x0.5x1 stud each, Sand material, tan color). Alternating rows like brickwork. 3-4 rows tall for chest-height cover.
- Helipad: flat 20x20 stud concrete platform. White circle 12 studs diameter painted on surface. H marking in center. Approach lights at edges.
- Radar dish: large satellite dish 6-10 stud diameter (concave surface). Mounted on Metal pedestal 4-8 studs tall. Rotates on base.
- Ammo crate: 2x1x1 stud Wood or Metal box, olive drab green (80,90,60). Stenciled markings (SurfaceGui text). Stack in storage areas.
- Tank/APC: body 8x4x3 studs. Turret on top 3x3x1.5 studs with barrel (cylinder 0.5x4x0.5 extending forward). Tracks on sides (DiamondPlate).
- Camouflage: mix 3-4 earth tones in irregular patches: dark green (50,70,40), brown (110,85,50), tan (160,145,110), black (30,35,25).
- Military color palette: OD green (80,90,60), desert tan (180,165,130), navy (30,40,55), concrete gray (150,150,155), black equipment (25,25,30).
- Obstacle course: walls to climb (8 studs tall), cargo net (grid of thin parts), balance beam (0.5x0.5x12 studs at 3 stud height), tunnel crawl (3x3 stud opening).
- Pro tip: Military builds need order and uniformity. Beds in straight lines, vehicles in rows, equipment on racks. Disorder means combat zone.
- Pro tip: Add camouflage netting (thin parts draped over equipment, green/brown) for field deployments.
- Common mistake: Too colorful. Military uses earth tones and neutrals almost exclusively. Bright colors only on hazard/warning markings.
- Common mistake: No wear and tear. Active bases have tire tracks, worn paths, scuff marks, and dust on vehicles.

UNDERWATER BUILDS:
- Underwater dome: Glass hemisphere 20-40 studs diameter. Metal frame ribs every 15 degrees. Interior dry with normal gravity. Exterior water terrain.
- Submarine: cylindrical body 20x6x6 studs. Conning tower on top 4x3x4 studs. Fins at rear (wedges). Propeller (4 blade parts on central shaft). Metal throughout.
- Coral reef: irregular colored formations. Use bright colors (red 200,60,80, orange 230,130,50, purple 130,70,160). Build from clusters of spheres and cylinders.
- Seaweed: tall thin green parts (0.3x6x0.5 studs) swaying from ocean floor. Use various greens. Cluster in groups of 5-10.
- Underwater lighting: blue-green tinted PointLights (0,150,180). Brightness decreases with depth. Caustic patterns from surface light.
- Bubble column: ParticleEmitter with white/light-blue spherical particles rising slowly. Place at volcanic vents, damaged pipes, air sources.
- Shipwreck: take a boat structure (see vehicles), break it apart. Tilt 30-45 degrees. Add CorrodedMetal, coral growth, seaweed attachment.
- Treasure chest: 2x1.5x1.5 stud Wood box with curved lid. Gold coins scattered around (tiny yellow cylinders 0.3 stud). Necklaces (thin parts).
- Underwater cave: darker than surface caves. Bioluminescent accents (tiny Neon parts in blue/green). Smoother walls (water erosion).
- Anchor: Metal, 2x3x0.5 studs cross shape with curved hook ends. Chain (alternating small dark cylinders) leading to surface.
- Porthole window: circular Glass part 2 stud diameter with thick Metal ring frame (0.5 stud border). Used in submarines and underwater bases.
- Pressure door: circular Metal door 4 stud diameter with central wheel lock (1 stud circle with 4 spokes). Thick frame (1 stud).
- Kelp forest: tall seaweed (0.5x15x0.5 studs) with leaf-like branches. Dense coverage. Creates underwater forest canopy effect.
- Sea floor: Sand terrain with rock outcroppings. Scatter shells (tiny pebble parts) and starfish (5-pointed flat parts, orange).
- Pro tip: Underwater scenes need ParticleEmitters for floating debris/plankton (tiny white parts, very slow movement, low density).
- Pro tip: Use Atmosphere with blue-green tint (0,80,100) and high Density (0.6) to simulate water visual.
- Common mistake: Forgetting water pressure logic. Deeper structures should have thicker walls and smaller windows.
- Common mistake: Bright full lighting underwater. Deeper water should be progressively darker. Use fewer, dimmer lights at depth.

SEASONAL AND WEATHER:
- Winter scene: Snow terrain on ground. White parts on rooftops (0.5 stud thick layer). Icicles (thin white/Ice wedges hanging from eaves, 0.3x2x0.3 studs).
- Snow accumulation: 0.3-0.5 stud white parts on top of any horizontal surface — fences, mailboxes, benches, car roofs. Thicker on north-facing surfaces.
- Frozen pond: flat Ice material surface 10-20 studs across with slight white frosting at edges. Crack lines (thin dark parts) across surface.
- Snowman: 3 stacked spheres — base 3 studs, middle 2 studs, head 1.5 studs. All white. Carrot nose (orange cone), coal eyes (tiny black spheres), stick arms.
- Winter color palette: snow white (240,245,255), ice blue (180,210,240), bare wood brown (90,65,40), evergreen (30,70,35), gray sky (160,165,175).
- Autumn/fall: trees with orange (220,140,40), red (180,50,30), yellow (230,200,50) canopy parts mixed with remaining green. Fallen leaves scattered on ground.
- Autumn details: pumpkins (orange spheres 1-2 studs with green stem), hay bales (cylinder 2x2x3, Sand material), corn stalks (bundled yellow cylinders).
- Spring: cherry blossom trees (pink canopy 200,150,170), flower patches everywhere, bright green new growth on bushes. Rain puddles (flat blue parts).
- Rain effects: ParticleEmitter covering the map area. Thin white streaks falling downward quickly. Size 0.02x2 stud. Rate 200+.
- Wet surfaces: darken all ground materials by 20-30 RGB values when raining. Add subtle reflective sheen (thin Glass overlay 0.95 Transparency).
- Fog settings: Atmosphere Density 0.4-0.8, Offset 0, Color matching sky. Light fog: Density 0.2, heavy fog: Density 0.7. Reduces visibility gradually.
- Thunderstorm: dark Atmosphere (Density 0.5, dark gray), rain particles, occasional flash (script toggles Brightness between normal and 5 for 0.1 seconds).
- Sunset sky: ColorCorrectionEffect with warm TintColor (255,220,180). Atmosphere Glare 10, orange-tinted. Sunrays Intensity 0.3, warm Spread.
- Night time: Lighting ClockTime 0 (midnight) or 22 (late evening). Ambient (10,15,25). OutdoorAmbient (20,25,40). Stars visible in skybox.
- Lava/volcanic: flowing lava is orange Neon parts (255,100,0) with ParticleEmitter for heat shimmer. Basalt rock (very dark Concrete 30,25,20).
- Sandstorm: ParticleEmitter with tan/brown particles moving horizontally. Reduce visibility with Atmosphere Density 0.6, Offset 0.5, tan Color.
- Tropical: bright saturated colors, palm trees, turquoise water (50,200,200), white sand, bright flowers. High saturation ColorCorrectionEffect.
- Arctic/tundra: flat terrain, snow everywhere, minimal vegetation, ice formations (Ice material in blue-white). Very bright ambient (200,210,230).
- Pro tip: Seasonal builds need consistent theming. If it's winter, EVERYTHING has snow — not just the ground. Every surface collects weather.
- Pro tip: Weather affects lighting. Overcast days have no hard shadows (reduce ShadowSoftness to 1). Sunny days have crisp shadows (ShadowSoftness 0.05).
- Common mistake: Putting snow only on the ground. It should be on rooftops, fence posts, car hoods, tree branches — every upward-facing surface.
- Common mistake: Bright sunny lighting in a rain scene. Overcast weather means dim, gray-blue ambient with no visible sun.

BUILDING STYLE RECIPES:
RECIPE - Small Suburban House (45-60 parts):
- Step 1: Foundation plate 22x18x1 studs, Concrete (150,150,155). Position at Y=0.5.
- Step 2: Exterior walls — 4 wall boxes. Front/back 22x1x12 studs, sides 16x1x12 studs. Brick material (170,85,60). Leave openings for 2 windows (front) and 1 door.
- Step 3: Cut front door opening 3x7 studs centered. Add door part 3x0.5x7 studs (Wood, red 170,40,40).
- Step 4: Cut window openings 3x4 studs. Place Glass panes (3x0.2x4, Transparency 0.3). Add Wood frames (0.3 stud border around each window).
- Step 5: Interior dividing wall 10x1x12 studs creating two rooms. Door opening 3x7 studs.
- Step 6: Ceiling/second floor plate 22x18x1 studs at Y=13.
- Step 7: Roof — two wedges meeting at ridge line. Each 22x6x9 studs. Slate material (87,57,44). Overhang 1 stud each side.
- Step 8: Chimney 2x2x6 studs rising from roof, offset right. Brick material matching walls.
- Step 9: Porch — platform 10x4x1 studs at front. Two columns 1x5x1 studs supporting roof extension.
- Step 10: Exterior detail — window sills, door frame, foundation border, bushes (3-4 green spheres at base).
- Total: approximately 50 parts. Clean, recognizable house.

RECIPE - Medieval Watchtower (35-50 parts):
- Step 1: Base platform 10x10x2 studs, Cobblestone (130,125,120). Slightly wider than tower.
- Step 2: Tower walls — cylinder 8 studs diameter, 30 studs tall, 2 studs thick. Or square: 8x8 exterior, 4x4 interior. Cobblestone material.
- Step 3: Arrow slits — three 0.5x3 stud openings per wall face at 10, 16, 22 stud heights.
- Step 4: Battlement top — 8 merlons (1.5x1.5x3 studs each) with 1.5 stud gaps between them around the perimeter.
- Step 5: Interior floors — platforms at 10 and 20 studs with ladder holes (2x2 stud openings).
- Step 6: Conical roof — wedge assembly or cone 9 studs diameter, 6 studs tall. Slate material, dark gray.
- Step 7: Door at ground level — 3x6 studs, Wood with Metal bands (horizontal dark strips across door).
- Step 8: Torch brackets — 4 small Metal parts on exterior, one per face, with PointLights (Range 12, warm orange).
- Step 9: Flag at peak — 0.5x0.1x3 stud pole with 2x0.1x1 stud Fabric flag.
- Step 10: Base detail — scattered rocks, moss patches, worn path leading to door.
- Total: approximately 40 parts. Reads clearly as medieval tower.

RECIPE - Sci-Fi Corridor Section (30-40 parts):
- Step 1: Floor 8x1x20 studs, DiamondPlate material (60,65,75). This is one straight corridor section.
- Step 2: Left and right walls 1x8x20 studs, Concrete (40,45,55). Place on each side of floor.
- Step 3: Ceiling 8x1x20 studs matching floor material. Creates enclosed box corridor.
- Step 4: Neon accent strips — four 0.2x0.2x20 stud parts. Place at floor-wall junctions (2 strips) and ceiling-wall junctions (2 strips). Neon cyan (0,170,255).
- Step 5: Floor panel lines — 3 thin dark parts (8x0.1x0.1 studs) across floor every 4 studs creating panel grid.
- Step 6: Wall panels — inset rectangles (2x0.2x3 studs, slightly darker) every 4 studs along walls creating recessed panel detail.
- Step 7: Door frame at one end — 4x7 stud opening with 0.5-stud Metal frame border. Warning stripes on frame.
- Step 8: Overhead light — 2x0.3x1 stud white Neon rectangle at ceiling center every 5 studs (3-4 lights per section).
- Step 9: Ventilation grate — 2x2 stud DiamondPlate recessed in wall at 6 stud height. One per wall.
- Step 10: Pipe run — 2-3 thin colored cylinders (0.3 stud diameter) along upper wall-ceiling junction.
- Total: approximately 35 parts. Instantly reads as sci-fi corridor.

RECIPE - Park with Fountain (40-55 parts):
- Step 1: Ground — 40x40 stud flat terrain, Grass material. Gentle hill in one corner (2-3 studs rise).
- Step 2: Paths — cross pattern, 4 studs wide, Cobblestone (170,170,175). From each edge to center. Curves at intersections.
- Step 3: Central fountain — octagonal basin 8x1x8 studs, Granite. Central pedestal 1x3x1. Top bowl 2x0.5x2.
- Step 4: Water in fountain — blue Glass parts in basin (0.3 studs thick, slight glow) or ParticleEmitter for spray.
- Step 5: Benches — 4 park benches (4x1.5x2.5 studs each) facing fountain from cardinal directions, 4 studs from basin edge.
- Step 6: Trees — 4 large trees (see nature section, oak-style) at compass points, 12 studs from center. Vary height 12-16 studs.
- Step 7: Lamp posts — 4 posts (1x8x1 Metal) at path intersections. PointLight Range 20 warm white.
- Step 8: Flower beds — 4 curved bed areas between paths. Dark terrain border with small colored flower parts.
- Step 9: Trash cans — 2 pairs (green+blue cylinders) at path entrances.
- Step 10: Entry gate — low stone wall (3x2x3 studs per side) with open 4-stud gateway. Name plaque on front.
- Total: approximately 50 parts. Complete functional park.

RECIPE - Spooky Abandoned House (50-70 parts):
- Step 1: Start with the Suburban House recipe above but use darker colors. Walls (90,80,75), roof (50,45,40).
- Step 2: Damage windows — replace 2 of 4 glass panes with broken versions (multiple small Glass parts with gaps). Board up one window with Wood planks.
- Step 3: Tilt the front door 20 degrees open. Add a dark void behind it (black part).
- Step 4: Crack the walls — thin dark lines (0.1 stud) branching from windows and foundation. 3-5 cracks total.
- Step 5: Overgrown yard — tall grass parts (0.3x2x0.3 studs, dark green) scattered randomly. Ivy climbing one wall.
- Step 6: Roof damage — remove one section of roof (leave a 4x4 stud hole). Add broken timber (angled Wood parts) around hole.
- Step 7: Porch collapse — tilt one porch column, sag the porch roof 1 stud on that side. Broken railing.
- Step 8: Interior visible through broken windows — overturned chair, fallen bookshelf, debris on floor (small scattered parts).
- Step 9: Lighting — Atmosphere Density 0.4, gray-blue. One flickering PointLight inside (warm, low brightness). No exterior lights.
- Step 10: Surrounding — dead tree (bare trunk, no canopy), overgrown fence (picket fence with missing sections and vine growth).
- Total: approximately 65 parts. Immediately creepy and atmospheric.

STUD TO REAL-WORLD CONVERSION:
- 1 Roblox stud = 0.28 meters (28 centimeters) — this is the official Roblox standard.
- 1 foot = approximately 1.09 studs. 1 meter = approximately 3.57 studs. 1 inch = approximately 0.09 studs.
- Roblox character (R15): approximately 5 studs tall = 1.4 meters = 4.6 feet. This represents a young person/teen.
- Real adult human: 5.5-6.5 feet = 6-7 studs. Roblox intentionally scales characters smaller for gameplay.
- Standard room height (8 feet IRL): 8.7 studs. In Roblox we use 12-14 studs for rooms because characters need headroom above their 5-stud height.
- Standard door (6.8 feet x 2.8 feet IRL): 7.4 x 3 studs. Simplified to 7x3 studs in Roblox builds.
- Standard car length (15 feet IRL): 16.3 studs. Simplified to 10-12 studs in Roblox for gameplay.
- Road lane (12 feet IRL): 13 studs. Simplified to 8-10 studs in Roblox for denser gameplay feel.
- Two-story house height (25 feet IRL): 27 studs. In Roblox, 26-32 studs to roof peak.
- Tree height varies: small ornamental (15 feet = 16 studs), medium shade tree (30 feet = 33 studs), large oak (60 feet = 65 studs). Roblox trees often 12-30 studs.
- Scaling philosophy: Roblox builds should be approximately 70-80% of real-world proportions for optimal gameplay. Slightly compressed.
- Doorways in Roblox need minimum 3 studs wide and 7 studs tall for comfortable character passage. Real proportions would be 3x7.4 studs.
- Furniture is often slightly oversized relative to character (120% scale) for visual clarity and gameplay interaction.
- Test all builds by walking a character through them. If the character clips through walls, doorways feel tight, or can't reach table tops, adjust.
- 1 kilometer = 3571 studs. 1 mile = 5748 studs. Most Roblox maps are 500-4000 studs across.
- Pro tip: Don't obsess over exact real-world conversion. Gameplay feel matters more than mathematical accuracy.
- Pro tip: Scale consistency within a build matters more than global accuracy. If doors are 3x7, keep ALL doors 3x7.

MEDIEVAL CONSTRUCTION:
- Medieval builds use Cobblestone, Brick, Wood, and Slate materials almost exclusively. Never use Metal or DiamondPlate.
- Castle wall thickness: 3-4 studs minimum. Real castles had walls 8-12 feet thick. In studs that means 3-4 studs for gameplay, 6+ studs for realism.
- Castle tower (round): use cylinders 12-16 studs diameter, 40-80 studs tall. Cap with a cone-shaped roof using wedges angled inward.
- Castle tower (square): 16x16 stud footprint, walls 2-3 studs thick, 50-70 studs tall. Add a crenellated top.
- Crenellations (battlements): alternating 2x2x3 stud merlons with 2-stud gaps between them along the wall top. Place walkway 2 studs below merlon tops.
- Curtain wall: 2-3 studs thick, 20-30 studs tall, running between towers. Add a wall walk (3 studs wide) on the inside at 16-18 studs height.
- Gatehouse: 8-10 studs wide opening, 10-12 studs tall archway. Build a portcullis from vertical Metal bars (0.5x8x0.5 studs each, spaced 1 stud apart).
- Drawbridge: 10x1x12 stud Wood plank that hinges down over a moat. Moat is 8-12 studs wide, 4-6 studs deep, filled with water terrain.
- Arrow slits: thin vertical gaps in walls, 0.5 studs wide, 3-4 studs tall, cut into 3-stud-thick walls. Place at 6-stud intervals along curtain walls.
- Keep (main building): 30x30 to 50x50 stud footprint, 40-60 studs tall. Multiple floors at 14-stud intervals. Walls 3-4 studs thick.
- Great hall inside keep: 20x30 studs minimum. Long wooden tables (12x2x3.5 studs) with benches (12x1x2.5 studs) on both sides.
- Throne: 3x3x6 stud chair, Granite or Wood material, placed on a raised platform (8x6x2 studs) at one end of the great hall.
- Dungeon: below ground level (negative Y). Cells 6x6x8 studs with Metal bar doors. Dark, no windows. Use CorrodedMetal for chains and shackles.
- Spiral staircase in tower: use wedge parts 4x1x2 studs, rotated 22.5 degrees each step around a 2-stud-diameter central pillar.
- Castle roof: steep pitch using wedges at 45-60 degree angles. Slate material. Add small dormer windows (2x3 studs) for detail.
- Courtyard: open area 40x40+ studs inside walls. Include a well (cylinder 3-stud diameter, 4 studs tall, Cobblestone), stables (10x16x10 studs), and a forge.
- Medieval house: 12x16 stud footprint, 12-14 studs tall to roof peak. First floor Cobblestone walls, second floor Wood frame with white plaster (white Concrete).
- Half-timbered walls: alternate dark Wood beams (1x12x1 studs) with lighter panels (white or cream Concrete) between them. Beams at 3-4 stud intervals.
- Thatched roof: use Sand or Pebble material at a steep 50-55 degree angle. Overlap layers slightly for depth.
- Medieval church/chapel: 16x30 stud footprint, 24 studs tall. Pointed arch windows (use two wedges meeting at the top). Bell tower on one end, 10x10x35 studs.
- Stone bridge: 8-10 studs wide, arched underside. Use Cobblestone. Arch radius 6-8 studs. Low walls on each side, 2 studs tall.
- Market stalls: 6x6 stud footprint, 8 studs tall. Wood frame with Fabric canopy (colored awning). Open front for goods display.
- Castle color palette: walls Cobblestone (163,162,165), dark mortar (99,95,98), Wood beams (105,64,40), roof Slate (63,127,95 dark green or 87,57,44 brown).
- Torch holders: small Metal bracket (1x0.5x0.5 studs) on wall with a PointLight (Range 15, Brightness 1, warm orange Color3 255,170,60).
- Banner/tapestry: flat 0.2-stud-thick rectangle, 2x4 studs, Fabric material, colored to faction colors. Hang from walls and towers.
- Wooden palisade (early medieval): vertical Wood logs (cylinder 1x8x1 studs) placed in a row with 0 gap. Sharpened tops using cone wedges.
- Murder holes: 2x2 stud openings in gatehouse ceiling above the entrance passage, used to pour hazards on attackers.
- Machicolations: stone brackets projecting 2 studs out from wall top with openings between them for dropping projectiles.
- Pro tip: Medieval builds should look weathered and uneven. Slightly offset stones (0.1-0.2 stud random displacement) and use color variation on stone parts.
- Pro tip: Add moss (small green parts, 0.1 studs thick) at wall bases and in cracks. Use dark Concrete (52,70,45) for moss color.
- Common mistake: Making medieval walls too thin (1 stud). They should be 2-4 studs thick minimum or they look like cardboard.
- Common mistake: Using perfectly clean materials. Add dirt stains (dark brown 0.1-stud decal parts) at bases of walls and around high-traffic areas.

MODERN ARCHITECTURE:
- Modern buildings emphasize clean lines, large glass panels, and minimalist geometry. Materials: Concrete, Glass, Metal.
- Apartment building: 30x20 stud footprint per unit. Stack 4-8 floors at 14-stud intervals. Exterior walls 1-2 studs thick, Concrete or Brick.
- Balcony: 6x3 stud platform projecting from wall. Metal railing (1-stud-tall posts every 2 studs, horizontal bar at top). Floor: Concrete 1 stud thick.
- Glass facade (curtain wall): continuous Glass panels 4x12 studs, separated by thin Metal mullions (0.2x12x0.2 studs). Creates modern office look.
- Office building: 40x40 to 60x60 stud footprint, 6-20 floors. Ground floor lobby 20+ studs tall (double height). Upper floors 14 studs each.
- Office interior: open plan with cubicle dividers (0.5x4x5 stud panels). Desks 4x2x3.5 studs. Office chairs 1.5x1.5x4 studs (Fabric seat, Metal frame).
- Skyscraper: 30x30+ stud footprint, 100-300 studs tall. Taper slightly toward top (reduce footprint by 2 studs every 5 floors for visual interest).
- Skyscraper crown: add distinctive top — antenna (cylinder 0.5x20 studs), spire (cone), or stepped setbacks. The top 10% defines the silhouette.
- Parking garage: 40x60 stud footprint per level. Ramp between levels: 20 studs long, 8 studs wide, 4 stud rise. Concrete throughout.
- Parking space: 4x8 stud rectangle. Lane between rows: 8 studs wide. Paint lines using 0.1-stud-thick yellow parts.
- Elevator shaft: 4x4 stud interior, running full building height. Metal doors 3x7 studs on each floor. Concrete shaft walls 1 stud thick.
- Lobby: 30x20 stud minimum. Marble or Granite floor. Reception desk 8x2x4 studs. Glass entrance doors. Potted plants (cylinder 2x3 studs with green sphere top).
- Rooftop: HVAC units (4x4x3 Metal boxes), antenna arrays (thin Metal cylinders), water tank (cylinder 4x6 studs), rooftop access door (3x7 studs).
- Fire escape: Metal staircase on building exterior. Each flight: 8 studs long, 4 studs rise. Landing platform 4x4 studs. Railing 3 studs tall.
- Modern house: 30x40 stud footprint, flat roof or low-pitch. Large windows (6x5 studs). Mix Concrete walls with Wood accent panels. Garage 12x16 studs.
- Sliding glass door: 6x7 stud opening with 0.2-stud-thick Glass panel. Frame in dark Metal.
- Modern kitchen: island counter 6x3x4 studs. Cabinets 3x1x4 studs along wall. Fridge 2x2x6 studs Metal. Stove 2x2x4 studs.
- Bathroom (modern): toilet 1.5x2x3 studs, sink 2x1.5x3.5 studs (wall-mounted), shower 4x4 stud glass enclosure, mirror 3x0.2x3 studs.
- Concrete color palette: light gray (200,200,200), medium gray (163,162,165), dark gray (99,95,98), charcoal (50,50,50).
- Glass tinting: use Glass material with slight blue tint (200,220,240) for modern buildings, green tint (200,230,210) for office towers.
- Modern accent colors: use one bold color (red, orange, or blue) sparingly on doors, signs, or trim against neutral gray/white/black.
- Pro tip: Modern buildings need sharp 90-degree corners. No rounded edges unless intentionally organic/futuristic.
- Pro tip: Add window reflections by placing a slightly transparent (0.7 Transparency) Glass part over a dark backing (30,30,40).
- Pro tip: Concrete panel joints — add thin dark lines (0.1x0.1 stud dark gray parts) between large wall sections to suggest prefab panels.
- Common mistake: Making glass walls fully transparent. Use 0.3-0.5 Transparency so the glass reads as a surface, not invisible.
- Common mistake: Flat featureless walls. Add recesses, overhangs, material changes, or subtle color shifts every 8-12 studs vertically.

SCI-FI FUTURISTIC BUILDING:
- Sci-fi builds rely on Metal, Neon (sparingly), Glass, and Foil materials. Concrete for station hulls and corridors.
- Color palette: dark base (20,25,35 navy), accent glow (0,170,255 cyan or 140,0,255 purple or 0,255,130 green), panel gray (80,85,95).
- Space station hull: double-layered walls. Outer hull 2 studs thick Metal (60,65,75). Inner wall 1 stud Concrete (40,45,55). 1-stud gap between for pipes/wires.
- Corridor: 6 studs wide, 8 studs tall. Floor panels 2x6x0.5 studs with 0.1-stud gaps between them (DiamondPlate). Ceiling same pattern.
- Neon accent strips: 0.2x0.2 stud strips of Neon material running along wall-floor and wall-ceiling junctions. Use cyan (0,170,255) or white.
- Limit neon to edge accents only — max 5% of visible surfaces. Neon is the most expensive material for rendering.
- Holographic panel: 3x0.1x2 stud Glass part with 0.6 Transparency and a SurfaceGui displaying text/images. Add faint PointLight behind it.
- Sliding sci-fi door: 3x7 stud Metal panel that splits vertically (two 1.5x7 panels). Frame in darker Metal with neon accent lines.
- Airlock: double door system with 4x4x8 stud chamber between. Warning stripes (yellow/black diagonal) on door frames.
- Warning stripes: alternate yellow (255,200,0) and black (20,20,20) diagonal bands, each 1 stud wide, on hazard areas and door frames.
- Control panel/console: 4x1x3 stud angled surface (15-20 degree tilt toward operator). Glass top with SurfaceGui. Buttons are small 0.3x0.3x0.1 neon cylinders.
- Server room: racks are 2x4x8 stud Metal boxes with rows of tiny neon indicator lights (0.2-stud cubes, green/blue/red).
- Reactor core: central cylinder 6-10 stud diameter, 12-20 studs tall, Glass with inner Neon glow. Surrounding walkway with Metal grating (DiamondPlate).
- Hangar bay: massive open space 60x80x30 studs minimum. Large door on one wall (40x20 studs). Catwalks at 15-stud height. Cargo crates scattered.
- Cargo crate (sci-fi): 4x4x4 studs, Metal with colored stripe on side indicating contents. Stack in groups of 3-8.
- Alien architecture: use non-orthogonal angles (15, 30, 60 degrees). Organic curves via wedges and cylinders. Materials: Slate or Granite in unusual colors (purple, teal).
- Alien color palette: bioluminescent greens (0,200,130), deep purples (80,0,120), bone white (230,225,210), obsidian black (15,10,20).
- Space window: large Glass panel (8x6 studs minimum) looking out onto a dark skybox with stars. Frame in thick Metal (1-stud border).
- Gravity plating: DiamondPlate floor panels with subtle blue Neon lines in a grid pattern (every 4 studs).
- Pipe/conduit runs: cylinders 0.5-1 stud diameter running along walls and ceilings. Group in bundles of 3-5. Color-code: red=power, blue=coolant, yellow=data.
- Ventilation grate: 2x2 stud Metal part with DiamondPlate material, recessed 0.2 studs into wall. Place every 8-12 studs along corridors.
- Pro tip: Sci-fi environments feel alive with subtle particle effects — steam from vents, sparks from damaged panels, holographic flicker.
- Pro tip: Use asymmetry in sci-fi. Unlike medieval symmetry, futuristic builds feel more authentic with off-center elements and irregular layouts.
- Pro tip: Layer materials — Metal base with Glass overlay with Neon accent. Three-layer depth makes surfaces interesting.
- Common mistake: Too much neon everywhere. It kills performance and looks like a toy. Use neon as accent lines only.
- Common mistake: Perfectly clean sci-fi. Add scorch marks (dark Concrete patches), exposed wiring (thin colored cylinders), and panel damage.

NATURAL ENVIRONMENT:
- Rivers: dig a channel 6-10 studs wide, 3-5 studs deep into terrain. Fill with water terrain. Banks should slope gradually, not cliff.
- River bends: never make rivers straight. Curve every 30-50 studs. Outside of bends should be deeper, inside shallower.
- Waterfall: create a cliff face 10-30 studs tall. Water terrain at top and bottom. Add layered beam effects for falling water visuals.
- Waterfall mist: ParticleEmitter at the base with white/light-blue color, 0.5-1 stud size, 50-100 lifetime, low speed (1-3), high spread.
- Waterfall pool: excavate terrain 4-6 studs deep at base. Surround with rocks (irregular Granite parts 2-4 studs each).
- Cave entrance: arch shape 8-12 studs wide, 8-10 studs tall. Use dark Slate or Granite. Scatter small rocks at entrance.
- Cave interior: irregular walls (offset parts 0.5-1 stud randomly). Very dark ambient. Occasional PointLights (Range 8, dim warm tones).
- Stalactites: inverted cone/wedge shapes hanging from cave ceiling. 1-2 studs wide, 2-6 studs long. Granite material, gray-brown color (120,110,100).
- Stalagmites: cone shapes rising from floor, slightly shorter than stalactites. Match material. Place some pairs aligned vertically.
- Crystal cave: use Glass or Ice material in vibrant colors (purple, blue, teal). PointLight inside each crystal. Clusters of 3-7 crystals.
- Cliff face: stack irregular Granite parts 60-100 studs tall. Vary width (2-6 studs) and depth (1-3 studs). Add ledges every 15-20 studs.
- Beach: terrain transition from Grass to Sand over 10-15 studs. Gently slope from land to water level. Add small rocks and driftwood at waterline.
- Beach details: shells (tiny 0.3-stud flat pebbles), driftwood (brown cylinders 3-6 studs long at random angles), sandcastle (4-part stack, 2x2x1 cubes).
- Forest: trees every 8-15 studs (random spacing). Mix 3-4 tree types. Vary height 15-30 studs. Add undergrowth (small green parts 1-3 studs tall).
- Tree construction: trunk is a brown cylinder 1-2 studs diameter, 8-15 studs tall. Canopy is 3-5 green spheres/parts clustered at top, 6-12 stud radius.
- Pine tree: trunk cylinder 1 stud diameter, 12-20 studs tall. Canopy is 3-4 stacked cones decreasing in size (8,6,4 stud diameter). Dark green (34,85,40).
- Oak tree: thick trunk 2 studs diameter, 8-12 studs tall. Broad canopy of overlapping spheres, 10-14 stud spread. Medium green (75,130,55).
- Palm tree: curved trunk (use angled cylinders), 12-18 studs tall. Crown of 5-7 elongated leaf parts fanning out. Trunk color (140,100,50).
- Mountain: terrain rise of 80-200 studs over 100-200 stud horizontal distance. Snow terrain above 70% height. Rock terrain on steep faces. Grass below.
- Mountain peak: jagged rocks at summit. Use irregular Granite parts angled 15-30 degrees. Snow-capped: white top 20% of mountain.
- Fallen tree: trunk lying at ground level, 10-15 studs long. Broken end with jagged wedge cuts. Moss on top side (dark green parts).
- Mushrooms (large): cylinder stem 1x3x1 studs, half-sphere cap 3x1x3 studs. Red with white spots, or brown. Place in shaded forest areas.
- Rock formations: cluster 5-12 irregular parts. Largest 4-6 studs, smallest 1-2 studs. Granite material. Gray-brown tones. Never perfectly aligned.
- Flower patch: tiny colored parts (0.5x0.5x0.5) in clusters of 8-15. Mix 2-3 colors. Place in open meadow areas with grass terrain.
- Pond: small water body 10-20 studs across, 2-4 studs deep. Irregular shape. Lily pads (flat green circles 1.5 studs diameter on surface).
- Swamp: shallow murky water (adjust water color darker), dead trees (bare trunks, no canopy), hanging moss (thin green parts dangling from branches).
- Pro tip: Nothing in nature is the same color. Vary every tree, rock, and bush by 5-15 RGB values from neighbors.
- Pro tip: Lean trees slightly (2-5 degree tilt). Add accumulated dirt at bases. Place fallen leaves around tree roots.
- Pro tip: Use terrain painting to blend materials at transitions — never have a hard edge between grass and sand.
- Common mistake: Placing trees in a grid pattern. Real forests have random spacing with occasional clearings.
- Common mistake: Flat ground between features. Add gentle rolling hills (2-4 stud elevation changes over 20-30 studs).

CITY TOWN PLANNING:
- Start with roads first, then fill blocks with buildings. Road layout defines the entire city feel.
- Road hierarchy: highways (4+ lanes, 32+ studs wide), arterials (2-4 lanes, 20-32 studs), collectors (2 lanes, 16-20 studs), local streets (2 lanes, 12-16 studs).
- Lane width: 8 studs per lane minimum. Include 1-stud painted center line (yellow, 0.1 studs thick) and edge lines (white).
- Sidewalk: 6-8 studs wide. Concrete material, slightly lighter than road (180,180,180 vs 60,60,65). Curb height: 0.5-1 stud above road.
- Crosswalk: white stripes 1 stud wide, 6 studs long, spaced 1 stud apart across road width. Place at every intersection.
- Intersection: roads meet at 90 degrees. Total intersection area = combined road widths. Add stop lines 1 stud from edge.
- Traffic light: pole 1x1x12 studs Metal. Signal box 1.5x1x3.5 studs at top with three 0.8-stud-diameter circles (red/yellow/green, top to bottom).
- Street lamp: pole 1x1x14 studs Metal (60,60,65). Arm extending 3 studs horizontally at top. Light fixture 1.5x1x1 stud with PointLight (Range 30, Brightness 1, warm white).
- Place street lamps every 16-20 studs along both sides of roads, alternating sides.
- City block: 60x60 to 100x100 stud blocks between streets. Downtown blocks smaller (60x60), suburban larger (100x120).
- Downtown: buildings wall-to-wall with zero setback from sidewalk. Taller buildings (40-200 studs). Mixed commercial/office.
- Suburban: buildings set back 10-20 studs from sidewalk. Single-family homes 20-40 studs tall. Front yards with grass terrain.
- Commercial strip: single-story shops (14-16 studs tall) with large display windows. Shared parking lot behind (40x30 studs).
- Parking lot: asphalt (dark Concrete 50,50,55). Spaces 4x8 studs. Driving lanes 8 studs wide. Painted lines 0.1 studs thick, yellow.
- Highway: 4 lanes (32 studs wide) with concrete median barrier 2 studs wide, 3 studs tall. On/off ramps curve at 15-30 degree angles.
- Highway overpass: road surface 40+ studs above ground on Concrete pillars (4x4 stud columns every 20 studs). Guardrails 3 studs tall on both sides.
- Bus stop: small shelter 4x6x8 studs with Glass walls and Metal frame. Bench inside (4x1x2.5 studs). Sign pole with route info.
- Alley: 4-6 studs wide between buildings. Add dumpsters (3x2x3 studs, dark green Metal), trash bags, pipes on walls, fire escape ladders.
- Manhole cover: circular Metal part 2 stud diameter, 0.1 studs thick, placed flush with road surface. Dark gray DiamondPlate texture.
- Fire hydrant: 1x1x2.5 stud shape, red (200,30,30). Place every 30-40 studs along sidewalks near intersections.
- Utility pole: Wood cylinder 1x16x1 studs with crossarm 6 studs wide near top. Wires are thin dark parts connecting between poles every 30 studs.
- Median with trees: 4-6 studs wide between lanes. Grass terrain with small trees (8-12 studs tall) every 10-15 studs.
- Roundabout: circular intersection 30-40 stud outer diameter. Central island 10-15 studs diameter with landscaping. Single lane around.
- Cul-de-sac: dead-end with circular turnaround 20 studs diameter. 4-6 houses arranged around the circle.
- Speed bump: 4x(road width) stud raised strip, 0.5 studs tall, rounded top. Yellow paint stripes.
- Storm drain: 2x0.5 stud dark opening at curb level. Place at low points and intersections for realism.
- Road color: dark asphalt (55,55,60 Concrete), lighter worn asphalt (75,75,80), curb (160,160,165).
- Pro tip: Study Google Maps satellite view of real cities for block layout inspiration. Grid cities (NYC) vs organic (European).
- Pro tip: Vary building heights along a street. Never make all buildings the same height — creates a boring skyline.
- Pro tip: Add trees along streets between sidewalk and road (tree-lined boulevard). One tree every 12-16 studs in a 3-stud median strip.
- Common mistake: Roads too narrow. 12 studs is MINIMUM for a two-lane road. 16-20 feels right.
- Common mistake: No transition between zones. Gradually shift from dense downtown to spaced suburban over several blocks.
- Common mistake: Forgetting infrastructure — no power lines, no storm drains, no fire hydrants. These tiny details sell realism.

INTERIOR DECORATION:
- Room size minimums: bedroom 12x12 studs, bathroom 8x8 studs, kitchen 12x10 studs, living room 16x14 studs, hallway 4 studs wide.
- Floor-to-ceiling: 12-14 studs for residential (cozy), 16-20 studs for commercial (spacious). Never below 10 studs.
- Living room: couch 6x2x3 studs (Fabric, warm color). Coffee table 3x2x1.5 studs (Wood). TV 4x0.2x2.5 studs (black, on stand or wall-mounted).
- TV stand: 5x1.5x2 studs Wood or Metal. Place 1 stud below TV. Add small prop items (books, remote, plant).
- Bookshelf: 4x1x8 studs, Wood frame with 4-5 shelves. Fill 60-70% of shelves with book blocks (various colored 0.3x1x0.8 parts).
- Couch construction: base 6x2x1.5 studs, back 6x0.5x2 studs (angled 5 degrees back), arms 0.5x2x2 studs on each end. All Fabric material.
- Armchair: 2.5x2x1.5 stud base, 2.5x0.5x2 stud back, 0.5x2x2 stud arms. Same Fabric, darker or contrasting color from couch.
- Rug: flat 0.1-stud-thick rectangle under coffee table, 8x5 studs. Fabric material, patterned or solid contrasting color.
- Kitchen: cabinets along wall 3x1x4 studs each (Wood front, dark interior). Counter 1 stud thick on top. Sink cutout in counter.
- Kitchen island: 6x3x4 studs with overhang on one side for bar stools. Granite or Concrete top, Wood or painted base.
- Stove/oven: 2x2x4 studs, Metal. Top surface with 4 burner circles (dark cylinders 0.5 stud diameter, 0.1 studs tall). Oven door on front.
- Refrigerator: 2x2x6 studs, Metal material, light gray (200,200,210). Handle on right side (0.2x0.2x1 stud). Top portion slightly recessed for freezer.
- Sink: counter-mounted. Basin: recessed 1 stud into counter. Faucet: small curved cylinder 0.3x1.5x0.5 studs above basin. Metal material.
- Kitchen table: 4x3x3.5 studs. Wood top 0.5 studs thick on 4 legs (0.5x0.5x3 studs each). Chairs around perimeter.
- Dining chair: seat 1.5x1.5x2.5 studs, back 1.5x0.2x2 studs. Wood legs. Place 0.5 studs from table edge.
- Bedroom: bed centered on one wall. Nightstands flanking. Dresser on opposite wall. Closet door on side wall.
- Single bed: 3x5x2 studs. Headboard 3x0.5x2 studs (Wood). Mattress 3x5x0.5 studs (white Fabric). Pillow 1.5x0.3x1 stud (white).
- Double bed: 5x6x2 studs. Headboard 5x0.5x2.5 studs. Two pillows. Comforter slightly overhanging sides (5.5x6.5x0.3 studs, colored Fabric).
- Nightstand: 1.5x1.5x2.5 studs, Wood. Place lamp on top: base 0.5x0.5x0.3, shaft 0.3x1x0.3, shade (cone 1x0.8x1 stud, Fabric). PointLight Range 12.
- Dresser: 4x1.5x4 studs, Wood. Add 6-8 drawer faces (horizontal lines at 1-stud intervals, using slightly recessed parts or color variation).
- Wardrobe/closet: 4x2x7 studs, Wood. Door fronts 2x0.3x6.5 studs. Interior has hanging rod (cylinder across top) and shelf.
- Bathroom: toilet against wall, sink on adjacent wall, shower/tub on third wall, mirror above sink.
- Toilet: base 1.5x2x1.5 studs (white), bowl on top 1.5x1.5x1 stud (rounded), tank behind 1.5x0.5x2 studs. All white Concrete.
- Bathtub: 5x2x2 studs, white interior, darker exterior. Faucet at one end. Surround with tile (alternate 0.5-stud squares of two similar whites).
- Shower: 4x4x8 stud enclosure with Glass walls (0.3 Transparency). Showerhead at 7 studs height. Drain in floor (small dark circle).
- Bathroom mirror: 3x0.1x2.5 studs, Glass material on wall above sink. Frame with thin Metal border (0.2 studs).
- Towel rack: thin Metal bar 2 studs wide, mounted to wall at 4 stud height. Draped fabric part for towel (2x0.3x1.5 studs).
- Wall art/picture frame: 2x0.2x1.5 studs, Wood frame around colored center panel. Hang at 5-6 stud height (eye level for Roblox characters).
- Potted plant: cylinder pot 1x1x1 stud (Concrete or Brick material), green sphere or parts above for foliage 1.5-2 stud diameter.
- Curtains: 0.2-stud-thick Fabric panels flanking windows. Each panel 2x0.2x5 studs. Gathered slightly (1.5 studs wide at top, 2 at bottom).
- Light switch: 0.5x0.1x0.8 stud white part on wall next to door, at 4 stud height. Tiny detail that adds realism.
- Ceiling fan: central cylinder 1x0.5x1, four blade parts 3x0.1x0.5 studs extending outward. Mount to ceiling center. Add PointLight.
- Pro tip: Rooms feel empty without wall decorations. Add at least 2-3 items per wall: pictures, shelves, clocks, switches.
- Pro tip: Color-coordinate rooms. Pick 2-3 colors per room and stick to them for furniture, walls, and accents.
- Pro tip: Leave 2-stud walkways between furniture. Characters need 2 studs to pass through comfortably.
- Common mistake: Giant furniture. A real chair is ~2.5 studs tall for the seat. Don't make 4-stud-tall chairs.
- Common mistake: Empty walls. In real homes, walls have baseboards (0.3x0.3 stud strip at floor level), crown molding (0.3x0.3 at ceiling), and trim.
- Common mistake: Forgetting ceiling lights. Every room needs at least one overhead light source (PointLight or SpotLight).

EXTERIOR DETAILING:
- Front garden: 8-12 studs deep from house to sidewalk. Mix grass terrain with flower beds (2-3 stud wide strips of darker terrain or parts).
- Fence (wooden picket): posts 1x1x4 studs every 4 studs. Horizontal rails 4x0.5x0.5 at 1 and 3 studs height. Vertical pickets 0.5x0.5x3.5 every 1 stud.
- Fence (chain link): Metal posts 1x1x5 studs every 6 studs. Wire mesh simulated by a single Glass part (0.1 thick) between posts with cross-hatching texture.
- Fence (iron): Metal vertical bars 0.3x0.3x5 studs every 1.5 studs. Horizontal rail at top and 2/3 height. Decorative spear points at top.
- Fence (stone wall): Cobblestone or Brick, 2 studs thick, 3-4 studs tall. Cap stones on top (2x0.5x1 studs).
- Mailbox: post 0.5x0.5x4 studs (Wood). Box on top 1.5x1x1 stud (Metal, dark blue or black). Flag on side (small red rectangle).
- Garden path: stepping stones 2x0.2x2 studs, Cobblestone material, spaced 1 stud apart leading from sidewalk to front door. Slightly irregular placement.
- Flower bed: low border 0.3 studs tall around an area of darker terrain. Flowers are small colored parts (0.3-0.5 studs) on thin green stems.
- Hedge: long green box 2x2x3 studs, Grass material (dark green 45,90,35). Place along property lines. Trim to rectangular shape.
- Bush (round): sphere or cluster of green parts 2-3 stud diameter at ground level. Darker green than grass. Place near house foundations.
- Park bench: seat 4x1.5x2.5 studs (Wood planks). Backrest 4x0.5x2 studs (Wood). Metal arm frames on each end. Place facing paths or views.
- Trash can (residential): cylinder 1.5x2x1.5 studs, dark green or black. Lid on top (cylinder 1.6x0.2x1.6). Place at curb on collection day builds.
- Dumpster: 4x2x3 studs, dark green Metal. Lid panels on top. Placed in alleys behind commercial buildings.
- Street bench: same as park bench but Metal frame, 5x1.5x2.5 studs. Place at bus stops and park entrances.
- Outdoor table (cafe): round top 3x0.5x3 studs (white Metal), central pedestal 0.5x2.5x0.5 studs. Umbrella: pole 0.3x4x0.3 stud, shade cone 4x1x4 studs (Fabric, colored).
- Planter box: 3x2x2 studs, Brick or Wood. Filled with dark terrain and plants/flowers above rim.
- Birdbath: pedestal 1x2x1 Granite, shallow bowl on top 2x0.5x2 Granite. Place in gardens.
- Garden gnome/statue: decorative 1x1x2 stud figure. Concrete material, painted. Place in gardens for whimsy.
- Grill/BBQ: 2x1.5x3 studs, black Metal. Lid on top (half-cylinder). Legs with wheels. Place on patios.
- Patio: 10x8 stud flat area adjacent to house. Brick or Cobblestone material. Slightly raised 0.5 studs above ground.
- Driveway: 8-10 studs wide, Concrete (lighter than sidewalk, 190,190,195). From garage to road, 10-20 studs long.
- Garage door: 10x8 studs, Metal material, white or beige. Horizontal panel lines every 2 studs (subtle 0.1-stud recesses).
- Gutter and downspout: gutter is 0.3-stud half-cylinder along roof edge. Downspout is 0.5x0.5 vertical tube from gutter to ground at building corners.
- Window box: 3x1x1 stud Wood box mounted below window exterior. Filled with small colorful flower parts.
- Porch light: small fixture 0.5x0.5x1 stud next to front door with PointLight (Range 10, warm yellow).
- Doorbell: tiny 0.2x0.1x0.3 stud part next to door at 4 stud height.
- House numbers: small 0.1-stud-thick number parts on wall next to front door, 0.5 studs tall. White or brass colored.
- Chimney: 2x2x6 studs rising from roof. Brick material. Cap on top (3x0.5x3 studs). Place off-center on roof.
- Pro tip: Exterior detail density should decrease with distance from the player path. Heavily detail areas players walk through, simplify distant buildings.
- Pro tip: Add leaves/debris in corners where walls meet ground. Nothing in nature has perfectly clean edges.
- Pro tip: Vary fence section angles slightly (1-2 degrees) to prevent the "factory-made" look.
- Common mistake: Flat yards. Real lawns have gentle 1-2 stud slopes for drainage. Add subtle terrain height variation.
- Common mistake: No transition from building to ground. Add foundation visible (1-2 studs of darker concrete at base of walls).

BRIDGES AND STRUCTURES:
- Wooden bridge: 6-8 studs wide, Wood plank deck (0.5 studs thick). Side railings 3 studs tall with vertical posts every 3 studs.
- Simple plank bridge: individual planks 6x0.3x1 studs laid across support beams. Two support beams (1x1 cylinder) span underneath.
- Rope bridge: plank walkway 4 studs wide with rope railings (thin brown cylinders 0.3 stud diameter). Sag the bridge 2-3 studs at center using angled sections.
- Stone arch bridge: Cobblestone or Brick material. Arch span 12-20 studs. Arch thickness 2 studs. Road surface 8 studs wide on top. Low walls on both sides.
- Arch construction: build with wedge parts angled to form semicircle. Each wedge spans ~15 degrees. Keystone at center top.
- Suspension bridge (small): two towers 2x2x20 studs on each side. Main cables (cylinders 0.3 studs) draped in catenary curve between towers. Vertical suspender cables every 4 studs to deck.
- Suspension bridge (large): towers 4x4x40+ studs. Deck 10-12 studs wide. Main cables 0.5 stud diameter. Deck suspended 8-15 studs above water.
- Highway overpass: Concrete deck 12-16 studs wide, supported by pillars 4x4 studs every 20 studs. Deck thickness 2 studs. Guardrails 3 studs tall (Metal).
- Train trestle: lattice of Wood or Metal beams in X-patterns. Base supports every 12 studs, each pair of legs forming an A-frame.
- Covered bridge: wooden bridge with walls and roof enclosing the roadway. 8 studs wide interior, 10 studs tall. Gable roof. Wood throughout.
- Drawbridge (modern): Metal deck 12 studs wide, hinged at one end. Tower mechanism 4x4x16 studs on each side with counterweights.
- Footbridge (modern): thin Metal deck 4 studs wide, single arch support underneath, Glass or wire railings. Minimalist design.
- Aqueduct: series of arches 10-12 studs tall, 8 studs wide. Water channel on top 3 studs wide, 2 studs deep. Cobblestone material.
- Pier/dock: Wood planks extending 20-40 studs into water. Width 6-8 studs. Support pilings (Wood cylinders 1x1 stud) every 6 studs.
- Dock details: cleats (small 0.5-stud Metal parts for tying boats), bollards (1x1x1.5 stud cylinders), rope coils, lanterns.
- Pro tip: Bridges need to feel structurally logical. Every bridge needs visible supports — no floating decks.
- Pro tip: Add wear marks on bridge surfaces. Slightly darker color on the walking/driving path, lighter on edges.
- Common mistake: Bridges too narrow. A bridge should be at least as wide as the road it connects.
- Common mistake: No railing or guard. Every elevated walkway needs safety rails 3 studs tall minimum.

VEHICLES:
- Car (basic): body 6x2x3 studs (base Color3). Cabin is 4x2x2 studs raised on top with Glass windows. 4 cylinder wheels 1x3x3 studs.
- Car body construction: start with 6x1x11 base block (Wood or Metal). Add cabin block centered on top. Carve out wheel wells using negative space.
- Car wheel: cylinder 1x3x3 studs, black (30,30,30). Hubcap: smaller cylinder 0.2x2x2 studs, silver Metal, placed on outer face.
- Wheel placement: four corners of base, inset 0.5 studs from edges. Use HingeConstraints with Motor type for driving.
- VehicleSeat: place centered on base, facing forward. Weld to chassis. TurnSpeed and MaxSpeed set via properties.
- Truck: cab 4x3x4 studs. Bed behind cab 6x3x2 studs (open top). Total length 10-12 studs. Larger wheels 1x4x4 studs.
- Pickup truck: cab 5x3x4 studs, bed 5x3x2 studs. Slightly raised suspension — 1 stud gap between body and ground.
- Bus: 16x3x5 studs body. Windows along sides (Glass, 2x3 studs each, spaced 0.5 studs apart). Door on right side 2x4 studs.
- Boat (rowboat): hull 6x2x1.5 studs, tapered at bow. Use wedges for bow shape. Wood material, brown. Two bench seats (3x1x0.5 studs).
- Speedboat: hull 10x3x2 studs with pointed bow. Windshield (Glass, angled 30 degrees). Outboard motor at stern (1x1x2 stud block with cylinder propeller).
- Sailboat: hull 12x3x2 studs. Mast center 0.5x0.5x12 stud cylinder. Sail: triangular arrangement of flat white Fabric parts.
- Helicopter: body 6x3x3 studs. Tail boom 6x1x1 stud extending back. Main rotor: 4 blades each 6x0.3x0.5 studs on central hub. Tail rotor: 2 small blades.
- Airplane (small): fuselage cylinder 2x2x10 studs. Wings: 12x0.3x3 stud flat parts extending from center. Tail: vertical (2x0.2x2) and horizontal (4x0.2x1) stabilizers.
- Motorcycle: frame 4x1x2 studs. Seat 2x1x0.5 studs. Front fork angled 15 degrees. Two wheels 1x2x2 studs.
- Bicycle: frame triangle of thin parts (0.3 stud thickness). Two wheels 0.5x2x2 studs. Seat, handlebars. Keep total under 15 parts.
- Train engine: 8x4x5 stud body. Smokestack cylinder 1x2x1 at front. Cowcatcher (wedge) at front base. 6 wheels (3 per side).
- Wheel friction: enable CustomPhysicalProperties on wheels. Base friction 0.43. Racing: rear 2.0, front 0.2. Normal: all 0.5.
- Wheel elasticity: set to 0 for better ground contact and less bouncing.
- Car color tip: body one solid color, trim/accents a second color, windows transparent dark (30,30,40 Glass).
- Pro tip: Cars need at least 15-20 parts to look recognizable. Fewer looks like a box on wheels.
- Pro tip: Add headlights (small Neon or Glass parts at front with SpotLight, Range 40), taillights (small red Neon parts at rear).
- Pro tip: Slightly round the car roof edges using wedges. Sharp box cabins look unnatural.
- Common mistake: Wheels too small. Standard car wheels should be 3 studs diameter. Too small makes the car look like it's dragging.
- Common mistake: No wheel wells. Cut out space in the body where wheels sit — don't just attach wheels to the outside surface.

SHOPS AND COMMERCIAL:
- Storefront: 16-20 studs wide facade, 14-16 studs tall (single story). Large display window 8-10 studs wide, 6 studs tall, starting 2 studs from floor.
- Shop entrance: recessed 1-2 studs from facade. Glass door 3x7 studs. Floor mat area 3x2 studs at entrance.
- Awning: 16x4x2 stud triangular cross-section extending from building. Fabric material in shop brand color. Support brackets every 4 studs.
- Retractable awning: thinner profile, 0.3 studs thick, curved gently downward. Metal frame with Fabric cover.
- Shop sign: 8x0.5x2 studs mounted above door or window. Lit signs: add SurfaceLight facing outward, or use Neon material text.
- Hanging sign: 2x0.5x2 studs perpendicular to building face, hanging from bracket 2 studs from wall. Metal bracket with decorative scroll.
- Display window: Glass front with interior spot-lit (SpotLight pointing at merchandise). Show mannequins, products, or themed displays.
- Interior counter: 8-10 studs long, 2 studs deep, 4 studs tall. Wood or Granite top. Glass display case front (0.5 Transparency).
- Cash register area: counter with register (1.5x1x1 stud Metal box with small screen), card reader (0.3x0.3x0.5), receipt paper.
- Shelving (retail): 4x1x6 stud units with 4 shelves. Products are small colored blocks 0.5-1 stud each arranged in rows.
- Clothing rack: horizontal Metal bar 4x0.2x0.2 studs suspended at 4 stud height on two vertical supports. Hang colored Fabric rectangles as clothing.
- Restaurant interior: tables 3x3x3.5 studs with 2-4 chairs. Booth seating along walls (4x2x4 stud bench with 4x0.5x4 stud back, Fabric).
- Bar/counter seating: tall stools 1x1x4.5 studs (Metal frame, Fabric top). Place 2 studs apart along bar counter.
- Pizza shop: counter with Glass sneeze guard (3 studs tall Glass panel above counter). Display pizza (flat colored circle 2 studs diameter).
- Coffee shop: espresso machine on counter (2x1x2 studs Metal), chalkboard menu on wall (3x0.1x2 studs, dark part with text SurfaceGui).
- Bakery: glass display cases 4x2x3 studs with bread/pastry items (small brown/golden parts inside). Warm lighting (3000K PointLights).
- Grocery store: aisles of shelving 4 studs apart. End caps (displays at aisle ends). Produce section with colored items (green, red, yellow spheroids).
- Neon sign: use Neon material parts shaped into letters/logos. Keep sign under 10 Neon parts total. PointLight behind for glow spill.
- Window decals: 0.05-stud-thick colored parts on window interior displaying hours, logos, or promotions.
- Commercial color: each shop should have its own 2-3 color brand identity. Awning, sign, and door all match.
- Pro tip: Stagger shop widths along a street (12, 16, 20, 14 studs). Uniform widths look fake.
- Pro tip: Add a sandwich board sign (A-frame) on the sidewalk in front of shops. 1.5x0.5x2.5 studs, Wood.
- Pro tip: Restaurants need visible kitchen through a service window. Even a simple opening with warm light behind it adds depth.
- Common mistake: Empty shop interiors. Even if players can see inside, there should be furniture, shelving, and props.
- Common mistake: All shops identical. Vary facade treatment, colors, sign styles, and awning types.

PARKS AND RECREATION:
- Park layout: central open green space (grass terrain) 40x40+ studs. Paths (Cobblestone or Concrete, 4 studs wide) in loops and crosses.
- Playground: 20x20 stud area with rubber ground (Pebble material, dark red-brown 120,60,40). Equipment spaced 6-8 studs apart.
- Swing set: A-frame 8x2x8 studs (Metal). Crossbar at top. 2-3 swing chains (thin cylinders) hanging down with seat (2x0.3x1 stud) at 2 studs height.
- Slide: ladder 2x1x6 studs (Metal rungs). Platform 3x3x6 studs. Slide surface 2x8x0.2 studs angled from platform to ground. Metal, smooth.
- Monkey bars: two A-frames 8 studs apart, 6 studs tall. Horizontal bars (cylinders 0.3 stud) connecting at top, spaced 1.5 studs apart.
- Seesaw: central fulcrum 1x2x1.5 studs. Plank 8x1x0.3 studs balanced on top. Handles at each end (small cylinders).
- Climbing wall: 6x1x8 stud flat part with colored hand-holds (small 0.3-stud cylinders protruding from surface in random pattern).
- Sandbox: 6x1x6 stud frame (Wood), filled with Sand terrain/material. Bucket and shovel props (tiny parts).
- Basketball court: 28x15 stud flat area (Concrete). Lines painted on surface (white 0.1 stud parts). Hoop at each end: pole 1x10x1, backboard 3x0.3x2, rim cylinder.
- Tennis court: 24x12 studs, green surface (dyed Concrete 50,120,50). Net at center 12x0.1x3 studs. White lines.
- Soccer/football field: 60x40 studs minimum. Grass terrain. White line markings. Goals at each end: 8x0.5x4 stud Metal frame with net (thin parts or mesh).
- Swimming pool: 20x10 stud rectangular excavation, 4 studs deep. Water terrain inside. Concrete deck 4 studs wide around perimeter.
- Pool details: ladder (Metal, 2 rungs), diving board (4x1x0.3 stud plank on 1x1x3 stud support), lane dividers (thin floating parts).
- Fountain: central basin 6x1x6 studs (Granite or Marble). Central pedestal 1x3x1 stud. Water effect on top (small blue Glass parts or ParticleEmitter).
- Ornamental fountain: tiered design — bottom basin 8x1x8, middle basin 4x1x4 raised 3 studs, top piece 1x2x1. Water cascading between levels.
- Picnic area: wooden tables 5x3x3 studs with attached benches. Placed under trees for shade. Grill nearby (2x1x3 Metal).
- Gazebo: octagonal platform 8 stud diameter, 0.5 studs tall (Wood). 8 posts (1x6x1 studs) at edges. Octagonal roof above. Bench seating inside.
- Dog park: fenced area 30x20 studs with chain-link fence. Double gate entry (prevents escapes). Open grass inside.
- Jogging path: 3-stud-wide Concrete or Pebble path winding through park. Mark distance with small posts every 20 studs.
- Statue/monument: Granite pedestal 3x3x4 studs. Figure or abstract shape on top 2x2x5 studs. Plaque on front 2x0.1x1 stud.
- Park lighting: shorter lamp posts 1x8x1 studs (vs 14-stud street lamps). Warmer light (PointLight Range 20, warm yellow). Path-level lighting.
- Trash/recycling bins: paired 1x1x2 stud cylinders, one green (trash) one blue (recycling). Place at path intersections.
- Pro tip: Parks feel empty without people-scale props. Add benches facing views, trash cans at path junctions, and water fountains (small 1x3x1 Metal on post).
- Pro tip: Scatter fallen leaves (tiny brown/orange flat parts) under deciduous trees. Seasonal detail.
- Pro tip: Bird bath or small pond with lily pads creates a peaceful focal point.
- Common mistake: Flat park with just grass. Add gentle hills, varied terrain, clusters of trees creating canopy areas.
- Common mistake: No paths connecting features. Every park element should be reachable via a pathway.

INDUSTRIAL BUILDINGS:
- Factory footprint: 40x60 to 80x120 studs. Height 20-30 studs to roof ridge. Steel frame with corrugated walls.
- Corrugated wall: Metal material, gray (140,140,145). Simulate ridges with alternating 0.1-stud offsets every 2 studs along the surface.
- Factory roof: sawtooth pattern (series of angled sections with vertical Glass windows facing north for natural light). Each tooth 12-16 studs wide.
- Loading dock: raised platform 4 studs above ground, 8-12 studs deep. Dock doors 10x10 studs. Bumpers at edge (1x1x1 stud yellow-black rubber blocks).
- Warehouse: similar to factory but open interior. Metal shelving racks 4x2x12 studs in rows 6 studs apart. Pallets on floor (3x0.3x3 studs Wood).
- Smokestack: cylinder 3-4 stud diameter, 40-80 studs tall. Brick or Concrete material. Add smoke (ParticleEmitter at top, gray, slow rise).
- Crane (tower): lattice mast 4x4 studs, 40-60 studs tall (Metal beams in X-pattern). Horizontal jib 30-40 studs long at top. Counterweight at short end.
- Crane (mobile): truck base 8x3x3 studs. Telescoping boom 20+ studs long, angled upward. Outrigger legs extending from base.
- Conveyor belt: 2-stud-wide surface on Metal frame 3 studs tall. Running 10-30 studs long. DiamondPlate belt surface.
- Forklift: compact vehicle 4x3x2 stud body. Mast at front 0.5x4x0.5 studs. Fork tines 2x0.2x3 studs. Yellow body (255,200,0).
- Industrial pipe: cylinders 1-2 stud diameter running along walls and between buildings. Paint-coded: red=fire, blue=water, green=chemical, yellow=gas.
- Storage tank: large cylinder 6-10 stud diameter, 8-16 studs tall. Metal material, white or silver. Ladder running up side. Access platform at top.
- Silo: tall cylinder 6 stud diameter, 20-30 studs tall. Concrete material. Conical roof. Access ladder. Fill spout at top, discharge at bottom.
- Chain-link fence with barbed wire: standard chain-link fence (see exterior section) plus angled arm at top with thin sharp zigzag wire parts.
- Guard booth: 4x4x8 stud structure at gate entrance. Glass windows on all sides. Barrier arm (thin red/white striped cylinder) across road.
- Control room: interior with multiple monitors (Glass panels 2x0.2x1.5 studs on desks). Console panels with buttons and switches.
- Electrical substation: fenced area 20x20 studs. Transformer boxes 3x2x4 studs (Metal, gray). Insulators (small ceramic-colored cylinders on top). Warning signs.
- Shipping container: 12x4x4 studs, CorrodedMetal for weathered look or Metal for new. Ridged sides (vertical lines every 1 stud). Doors on one short end.
- Industrial color palette: safety yellow (255,200,0), warning red (200,30,30), machinery gray (120,120,125), rust (139,90,43), concrete (170,170,175).
- Caution stripes: diagonal alternating yellow and black bands on hazardous equipment, floor edges, and door frames.
- Pro tip: Industrial buildings need visible infrastructure — pipes, conduits, junction boxes, fire extinguisher cabinets, exit signs.
- Pro tip: Add oil stains (dark 0.1-stud flat parts) on workshop floors and near machinery.
- Pro tip: Broken/discarded items (bent Metal parts, scattered nuts/bolts) near work areas add authenticity.
- Common mistake: Too clean. Industrial environments are grimy. Use CorrodedMetal, darken floors near doorways, add wear patterns.
- Common mistake: No signage. Industrial spaces have safety signs, exit markers, zone labels everywhere. Add colored signs on walls.

HORROR ATMOSPHERIC:
- Abandoned building base: start with a normal building, then systematically damage it. Break windows, add holes in walls, tilt doors off hinges.
- Broken window: Glass part with irregular missing pieces. Create by using multiple smaller Glass parts with gaps between them, leaving 30-50% open.
- Boarded-up window: 3-4 Wood planks (3x0.3x0.5 studs each) nailed across window opening at various angles. Nails are tiny dark cylinders.
- Cracked wall: add thin dark line parts (0.1 stud wide) in branching patterns across walls. Widen cracks near base and around damage points.
- Peeling wallpaper: layer a thin colored part (0.05 studs) over wall, then partially remove sections, leaving curled edges (small angled parts).
- Overgrown vegetation: green parts climbing up walls from ground. Start thick at base (2-3 studs wide), thin out toward top. Irregular spread.
- Ivy on walls: small green flat parts (0.5x0.1x0.5 studs) clustered in branching patterns from ground upward. Cover 20-40% of abandoned wall surfaces.
- Cobwebs: thin white parts in corner areas (where wall meets ceiling, between objects). Very thin — 0.05 studs thick. Triangle shapes.
- Broken furniture: take normal furniture pieces (see interior section) and tilt, break apart, or leave on their side. Scatter pieces.
- Fallen chandelier/light: broken fixture on floor with scattered Glass/Metal fragments (small parts around impact point).
- Blood stains (horror): dark red flat parts (139,0,0 at 0.1 studs thick) on floors and walls. Splatter pattern — irregular shapes and drips.
- Rust and decay: CorrodedMetal on any Metal surfaces. Mix orange-brown (139,90,43) stain parts on Concrete walls at water runoff points.
- Water damage: dark stain (brown/gray patches, 0.05 studs thick) on ceilings spreading from a central point. Ceiling parts sagging 0.5-1 stud.
- Broken floorboards: Wood floor with 2-3 planks missing (gaps showing dark void below). Remaining planks slightly tilted.
- Debris: scattered small parts on floor — broken plaster (white chunks 0.5-1 stud), wood splinters (thin brown parts), glass shards (tiny clear parts).
- Fog/atmosphere: Atmosphere object with Density 0.5-0.8, Offset 0, Color dark gray (40,40,50). Creates oppressive visibility limitation.
- Horror lighting preset: Brightness 0.5, Ambient (20,20,30), no sunrays, no bloom. ColorCorrectionEffect: Saturation -0.3, Contrast 0.2, Brightness -0.05.
- Flickering light: PointLight with script that randomly toggles Enabled and varies Brightness between 0.2-0.8 every 0.1-0.5 seconds.
- Single light source: one working light in an otherwise dark room creates dramatic shadows and tension. SpotLight with narrow angle (30 degrees).
- Red emergency light: PointLight Color (200,0,0), Range 15, Brightness 0.5. Mount on wall rotating fixture for sweeping effect.
- Scratches on walls: thin parallel line parts (3-4 lines, each 0.05x0.05x1 stud) grouped together at angles, dark color on light walls.
- Door ajar: rotate door 15-30 degrees open. Add creak sound. Darkness visible through gap.
- Tilted picture frames: wall art rotated 5-15 degrees off-level. Some fallen on floor, face-down.
- Dirty mirror: Glass part with overlay of semi-transparent dark spots (0.2 Transparency gray parts in irregular patches).
- Graffiti/writing: thin colored parts spelling words on walls, or SurfaceGui with text. Red paint dripping down from letters.
- Cemetery elements: headstones (1.5x0.5x2.5 Granite, rounded top), iron fence (see exterior), dead trees (bare trunks), fog, lanterns (dim warm light).
- Asylum/hospital: long corridors 4 studs wide, 10 studs tall. Fluorescent light (bright white, flickering). Padded walls (Fabric, off-white/stained). Wheelchair props.
- Basement: low ceiling (8 studs), exposed pipes overhead, single bulb light, concrete walls stained with water damage, storage boxes and old furniture.
- Pro tip: Horror is about what you CAN'T see. Use fog, darkness, and partial visibility. Don't over-light horror scenes.
- Pro tip: Sound is 50% of horror. Pair visual builds with ambient audio — creaking, wind, distant footsteps, water dripping.
- Pro tip: Asymmetry and disorder create unease. Tilt objects, break patterns, make things slightly wrong.
- Pro tip: Contrast between safe and scary areas makes horror effective. Start in a normal area, gradually deteriorate.
- Common mistake: Relying only on darkness. Too dark and players can't see anything — use selective dim lighting to guide and scare.
- Common mistake: Over-the-top gore everywhere. Subtlety is scarier than excess. One blood stain in an unexpected place beats a room covered in red.
- Common mistake: Forgetting environmental storytelling. Scattered notes, overturned chairs, drag marks — tell a story through the environment.

FANTASY BUILDS:
- Enchanted forest: oversized trees (trunks 3-4 studs diameter, 25-40 studs tall). Glowing mushrooms (Neon stems, Glass caps, 2-3 studs tall) scattered at bases.
- Bioluminescent plants: use Neon material in blue (0,100,200) or green (0,180,100) for flower centers and mushroom caps. PointLight Range 6 inside each.
- Fairy village: tiny houses 4x4x5 studs built into tree trunks or mushroom caps. Round doors 1.5x2 studs. Warm light inside.
- Fairy house details: acorn cap roof (half-sphere, brown), leaf door (green wedge), flower window boxes, lanterns on tiny chains.
- Floating island: main landmass 30-50 studs across, 8-15 studs thick. Underside irregular with dangling roots and rock. Waterfalls off edges.
- Floating island support: optional chains or energy beams connecting to ground. Or just let it float — fantasy doesn't need physics justification.
- Crystal cave: large crystal clusters 4-8 studs tall made from Glass or Ice material in purple (140,50,200), blue (50,100,220), teal (0,180,180).
- Crystal construction: each crystal is an elongated part (1x4x1 studs) with pointed top (wedge). Group 5-10 at various angles for a cluster.
- Crystal lighting: PointLight inside each major crystal. Color matches crystal. Range 8-12. Creates colored light pools on cave walls.
- Magical tower: spiral design ascending 60-100 studs. Base 12x12 studs, tapering to 6x6 at top. Wrap staircase around exterior.
- Wizard tower details: star/moon motifs (0.1-stud decorative parts on walls), library inside (floor-to-ceiling bookshelves), crystal ball on desk (Glass sphere 1.5 studs).
- Enchanted bridge: stone arch with glowing rune carvings (tiny Neon parts embedded in Cobblestone surface, blue or gold).
- Magical portal: circular frame 8-10 studs diameter. Stone or Metal frame 1 stud thick. Interior: swirling Neon/Glass effect (purple/blue ParticleEmitter).
- Treehouse village: platforms at 15-25 stud height in large trees. Connected by rope bridges (see bridges section). Ladders to ground.
- Dragon lair: massive cave 40x30x20 studs. Gold treasure pile (hundreds of tiny yellow/gold parts scattered in mounds). Scorched walls (black/dark brown).
- Potion shop: shelves with colored Glass bottles (cylinders 0.3x1x0.3 studs in red, green, blue, purple). Cauldron (cylinder 2x1.5x2, dark Metal, green glow inside).
- Mushroom house (large): stem is cylinder 4x12x4 studs, Concrete beige. Cap is half-sphere 10x4x10 studs, red with white spots.
- Cobblestone village path: 4-stud-wide path with irregular stone pattern. Mix 2-3 gray shades. Moss between stones (tiny dark green parts).
- Castle turret (fantasy): narrower and taller than medieval (8x8x40 studs). Conical roof with exaggerated height. Purple or blue roof color.
- Magical fountain: standard fountain (see parks) but water replaced with glowing liquid (Neon particles, purple or gold). Floating droplets (small Glass spheres).
- Enchanted weapon display: sword (thin elongated part 0.2x4x0.5 studs with guard and handle), mounted on wall with bracket. Subtle glow (PointLight Range 4).
- Elf architecture: organic curves, integrated with nature. Walls blend into tree trunks. Leaf-shaped windows. White/silver/green palette.
- Dwarf architecture: heavy stone, geometric, underground. Low ceilings (8-10 studs). Wide corridors. Granite/Metal. Gold accents. Forge with lava.
- Fantasy color palettes: enchanted forest (emerald 0,155,80, gold 200,170,50, deep purple 80,20,120), ice kingdom (ice blue 150,200,255, white, silver), fire realm (red 200,40,20, orange 230,130,30, black).
- Magical barrier/forcefield: ForceField material in dome or wall shape. Low Transparency (0.3). Add particle effect at edges.
- Vine growth: thin green cylinders (0.2 stud) winding along surfaces. Add leaf parts (0.5x0.1x0.3 green) every 2 studs along vine.
- Mystical fog: Atmosphere Density 0.3, blue-purple tint. ParticleEmitter for localized ground-level mist (white, very slow, large size).
- Pro tip: Fantasy builds break real-world rules intentionally. Use impossible proportions, floating objects, and unnatural colors.
- Pro tip: Every magical element needs a light source. Glowing crystals, enchanted fires, luminous plants — fantasy environments MUST feel lit from within.
- Pro tip: Mix natural materials (Wood, Cobblestone) with magical accents (Neon, Glass). The contrast between mundane and magical sells the fantasy.
- Common mistake: Making everything glow. Reserve Neon for specific magical elements. Overuse kills the special feeling and tanks performance.
- Common mistake: Forgetting scale. Fantasy can be oversized (giant mushrooms, massive trees) but internal consistency matters — pick a scale and stick with it.

EXPANDED COMMON MISTAKES (TOP 30):
- Mistake 1: Uniform wall color. Real walls have slight shade variation. Use 2-3 similar tones (vary by 5-10 RGB per section).
- Mistake 2: No baseboards or crown molding. Add 0.3x0.3 stud strips at floor-wall and ceiling-wall junctions for instant quality.
- Mistake 3: Doors too small. Standard Roblox door minimum 3x7 studs. Double doors 6x8 studs. Glass doors 3x7 with 0.2-stud frame.
- Mistake 4: Flat roofs on houses. Most residential buildings have pitched roofs at 30-45 degrees. Only use flat for modern/commercial.
- Mistake 5: Ignoring the underside. If players can see under a bridge, staircase, or platform, it needs detail. Exposed beams, pipes, or structure.
- Mistake 6: Single-material buildings. Mix at least 2-3 materials per building: stone base, wood upper walls, slate roof, for example.
- Mistake 7: No edge trim. Window frames (0.2-0.5 stud border), door frames, roof edges, corner trim. Edges define shapes.
- Mistake 8: Floating builds. Every structure needs a visible connection to the ground: foundation, supports, pilings, legs, or terrain merge.
- Mistake 9: Symmetry obsession. Real buildings have asymmetric elements: offset doors, different window sizes on different floors, additions.
- Mistake 10: No depth in walls. Recess windows 0.5 studs, project ledges 0.5 studs, add pilasters or columns. Flat facades look like textures.
- Mistake 11: Oversized furniture. Kitchen table should be 3.5 studs tall, not 5. Chair seats at 2.5 studs, not 4. Test with character reference.
- Mistake 12: One light temperature everywhere. Interiors warm (orange-yellow), exteriors cool (blue-white). Mix creates visual confusion.
- Mistake 13: Ignoring gravity logic. Even in fantasy, buildings need apparent structural support. Arches, buttresses, pillars where weight bears.
- Mistake 14: No ground clutter. Bare terrain around buildings looks unfinished. Add bushes, rocks, path edges, fallen leaves at minimum.
- Mistake 15: Using default Part colors. The default medium-stone-grey (163,162,165) screams "unfinished". Always choose intentional colors.
- Mistake 16: Mismatched scale between buildings. If one house uses 14-stud walls, all houses in that area should too. Consistency matters.
- Mistake 17: Forgetting back sides. Players can usually walk around buildings. The back needs windows, details, AC units, pipes — not blank walls.
- Mistake 18: No roof overhang. Roofs should extend 1-2 studs past walls. Flush roofs look wrong and have no shadow lines.
- Mistake 19: Skipping steps on stairs. Each step should be ~1 stud tall, ~1 stud deep. Taller steps feel like climbing ladders.
- Mistake 20: Glass everywhere. One or two Glass accent walls per building is impactful. Every wall Glass is performance-killing and visually cold.
- Mistake 21: Ignoring negative space. Not every surface needs parts. Alcoves, archways, cutouts, and recesses create visual interest.
- Mistake 22: No transition zones. Buildings need porches, awnings, or overhangs at entrances — transitional spaces between inside and outside.
- Mistake 23: Part misalignment. Misaligned edges (0.001 stud off) cause visible Z-fighting. Snap to grid religiously. Check joints.
- Mistake 24: Monochrome environments. Even realistic styles need at least 5-7 distinct colors. Monotone builds feel lifeless.
- Mistake 25: Copying reference exactly. References are inspiration, not blueprints. Adapt real-world designs to Roblox proportions and gameplay.
- Mistake 26: No weathering. New-looking materials everywhere feels sterile. Add CorrodedMetal patches, dirt stains, paint chips to high-traffic areas.
- Mistake 27: Uniform vegetation. Real areas have mixed plant types: tall trees, medium bushes, ground cover, flowers, dead plants. Mix everything.
- Mistake 28: Leaving interiors visible but empty. If a window lets players see inside, that room needs furniture, lighting, and props.
- Mistake 29: Over-detailing background buildings. Buildings 100+ studs from player paths need less detail. Reduce part count, simplify shapes.
- Mistake 30: Not using the Roblox character as a measuring stick. Spawn a default character and compare everything to it before finalizing.

OPTIMIZATION TECHNIQUES:
- StreamingEnabled: set Workspace.StreamingEnabled = true. StreamingMinRadius (default 64 studs), StreamingTargetRadius (default 1024 studs).
- StreamingEnabled reduces client memory by only loading nearby instances. Critical for maps over 10K parts.
- StreamingIntegrityMode: Default (no guarantee parts exist), PauseOutsideLoadedArea (pauses when player outruns streaming).
- For 30-50K part maps: StreamingMinRadius 128, StreamingTargetRadius 256-512. Keeps visible area manageable.
- For 100K+ part maps: StreamingMinRadius 64, StreamingTargetRadius 128-256. Aggressive streaming for massive worlds.
- ModelStreamingMode on Models: Default (streams normally), Atomic (all or nothing for grouped parts), Persistent (always loaded, use for HUD/tools).
- Mark critical gameplay models (spawns, checkpoints, tools) as Persistent. Everything decorative stays Default.
- Part-to-MeshPart conversion: select related parts, export as OBJ, reimport as single MeshPart. A 200-part building becomes 1 MeshPart.
- MeshPart instancing: if you have 50 identical trees, use 1 MeshPart + 49 clones with same MeshId. Engine renders mesh data once.
- Texture atlasing: combine multiple textures into one image. Apply via TextureId and use UV mapping. Reduces draw calls.
- RenderFidelity per object: Automatic for most. Performance for distant/background objects. Precise only for hero pieces the player inspects up close.
- CollisionFidelity hierarchy: Box (cheapest, use for decorations) > Hull (medium, use for walkable surfaces) > Default > PreciseConvexDecomposition (expensive).
- Disable CanCollide + CanTouch + CanQuery on purely visual parts. Set Anchored true. This removes them from physics simulation entirely.
- CastShadow = false on small parts (under 1 stud), interior parts not near windows, and parts already in shadow. Saves significant GPU time.
- Light count limit: aim for under 30 active lights in player view at any time. Each additional light multiplies shadow map calculations.
- PointLight vs SpotLight vs SurfaceLight: SpotLight is cheapest (one direction). PointLight is most expensive (all directions). Choose carefully.
- Decals vs Parts for detail: a wall texture via Decal is 1 draw call. The same pattern built from parts could be 50+. Use Decals for flat detail.
- Part count targets by game type: obby (under 5K), roleplay (10-30K with streaming), open world (30-100K with aggressive streaming), showcase (unlimited with streaming).
- Server-side: keep script count under 200. Consolidate logic into fewer scripts. Module scripts don't count toward script thread overhead the same way.
- Terrain vs Parts for ground: Terrain is GPU-rendered voxels, not physics parts. A terrain mountain with 50K voxels costs less than 500 brick parts.
- LOD (Level of Detail) manual approach: create 2-3 versions of complex models. Swap based on distance using script or StreamingEnabled behavior.
- Avoid Humanoids on non-player models. Each Humanoid runs constant state checks. Use AnimationController for animated NPCs that don't need pathfinding.
- Batch similar materials: group parts using the same material and color together. The renderer can batch-draw these more efficiently.
- Transparency sorting: transparent parts (Glass, ForceField) are more expensive to render than opaque. Minimize overlapping transparent surfaces.
- ZOffset on Decals: prevents Z-fighting without moving parts. Set small negative value (-0.01) on overlapping surfaces.
- Pro tip: Use the MicroProfiler (Ctrl+F6 in Studio) to identify actual bottlenecks before optimizing randomly.
- Pro tip: Test on mobile/tablet. If it runs on a 3-year-old phone, it runs everywhere.
- Pro tip: Keep draw distance in mind. Objects 500+ studs away can be much simpler. Nobody notices low detail at distance.
- Common mistake: Optimizing the wrong thing. Profile first. Often it's one bad script, not 1000 extra parts, causing lag.
- Common mistake: Using unions for detail work. Unions can't be instanced, have worse collision, and bloat file size. Always prefer MeshParts.

ROOFING TECHNIQUES:
- Flat roof: simplest — single horizontal part on top of walls. Add 0.5-stud parapet walls around edges. Slight slope (1 stud over 20 studs) for drainage.
- Gable roof: two rectangular planes meeting at a ridge. Each at 30-45 degrees. Classic residential look. Overhang walls by 1-2 studs.
- Gable construction: use two large wedge parts or angled rectangular parts. Ridge runs along the long axis of the building.
- Hip roof: all four sides slope inward. No vertical gable walls. More complex but looks professional. Use 4 triangular slope sections meeting at peak.
- Gambrel roof (barn): each side has two slopes — steep lower section (60 degrees) and shallow upper (25 degrees). Creates more headroom.
- Mansard roof: like gambrel but on all four sides. Steep lower walls (nearly vertical, 70-80 degrees) with shallow top. French architectural style.
- Shed roof (mono-pitch): single sloping plane. One wall taller than opposite. Modern/industrial look. Simple to construct. 10-20 degree slope.
- Dormer: small gabled projection from main roof slope. Adds window to attic space. 4x4 stud opening with mini gable roof above.
- Eaves: roof overhangs past wall by 1-2 studs. Add fascia board (thin strip along roof edge). Soffit (underside panel between wall and roof edge).
- Ridge cap: 0.3-stud part running along the peak where two roof slopes meet. Slightly different color/material than roof surface.
- Chimney through roof: chimney rises through roof surface. Add flashing (thin Metal parts around chimney base where it meets roof). Cricket/saddle behind chimney.
- Gutter: half-cylinder 0.3 stud diameter running along bottom edge of roof. Connect to downspout (vertical tube) at corners.
- Skylight: Glass rectangle 2x3 studs flush with or slightly raised from roof surface. Metal frame. Add interior PointLight.
- Roof color by style: asphalt shingle gray (80,80,85), terracotta (180,90,50), slate dark (55,60,65), wood shake brown (110,80,50), modern flat white (220,220,225).
- Multi-level roof: main ridge with cross-gables at perpendicular. Creates L or T shaped roofline. Vary heights by 2-4 studs between sections.
- Pro tip: Roofs define the building silhouette. A boring roof makes the whole building boring. Add dormers, chimneys, or varied heights.
- Pro tip: Roof color should contrast with walls. Dark roof on light walls or light roof on dark walls. Matching roof-to-wall looks flat.
- Common mistake: Roof with no overhang. Always extend roof past walls. No overhang = no shadow line = flat appearance.
- Common mistake: Single flat plane roof on a house. Even a slight pitch (5-10 degrees) dramatically improves appearance.

ASIAN ARCHITECTURE:
- Pagoda: multi-tiered tower. Each tier is a floor (8x8 studs) with sweeping curved roof extending 3-4 studs past walls. 3-7 tiers stacked.
- Curved roof (East Asian): simulate with 2-3 angled wedge sections per side. Outer edges curve upward at tips. Distinguish from Western straight slopes.
- Torii gate: two vertical pillars 1.5x1.5x10 studs, red (200,30,30). Two horizontal crossbeams at top (8 studs long), upper beam curves upward at ends.
- Japanese garden: raked gravel (Sand material, light gray), carefully placed rocks (3-5 per garden), pruned trees, stone lantern (Granite stack), bamboo fence.
- Zen garden: flat area 20x20 studs, Sand terrain with circular rake patterns (thin dark lines). Large feature rocks. No plants.
- Bamboo fence: vertical green cylinders (0.3x4x0.3 studs) in a row with horizontal ties. Natural green (80,120,50).
- Stone lantern (toro): Granite stack — base 2x0.5x2, shaft 1x2x1, firebox 2x2x2 (with cutout for light), cap 2.5x0.5x2.5, finial 0.5x1x0.5.
- Shoji screen (sliding door): 3x0.2x7 stud frame (Wood, light tan) with translucent white panel (Glass, 0.6 Transparency). Grid pattern overlay.
- Tatami floor: alternating rectangular mats (3x0.1x2 studs) in a herringbone-like pattern. Fabric material, straw yellow (200,190,140). Dark border lines.
- Chinese dragon details: serpentine body from cylinders, decorative whiskers, crest spines along back. Place on rooftop ridges or as statues.
- Temple entrance: broad staircase (10-16 studs wide), ornate pillars (red cylinders 1.5 stud diameter), heavy double doors, guardian statues flanking entry.
- East Asian color palette: vermilion red (200,30,30), lacquer black (10,10,15), gold accent (200,170,50), jade green (0,120,80), white plaster (240,235,225).
- Roof tiles: simulate with slightly overlapping rows of small parts. Slate or Brick material. Gray for Japanese, colored glazed for Chinese.
- Paper lantern: sphere or cylinder 1.5x2x1.5 studs, Fabric material, warm red or white. PointLight inside (Range 8, warm).
- Pro tip: Asian architecture emphasizes horizontal lines and natural integration. Buildings should feel grounded and connected to landscape.
- Pro tip: Use odd numbers for architectural elements (3, 5, 7 windows/pillars). Even numbers are avoided in traditional East Asian design.
- Common mistake: Using Western proportions. Asian roofs have wider overhangs and are more prominent relative to wall height.
- Common mistake: Too many bright colors. Traditional Japanese is restrained — mostly wood tones and white. Chinese is more colorful but still deliberate.

PIRATE AND NAUTICAL:
- Pirate ship hull: elongated oval shape 20x6x4 studs. Bow pointed (wedge), stern squared. Wood material, dark brown (80,55,35). Planking lines.
- Ship deck: flat Wood surface with planking detail (thin darker lines every 2 studs running bow to stern). Slightly raised stern deck (quarterdeck).
- Mast: central Wood cylinder 0.5x20x0.5 studs. Crossbeam (yard) at 12 studs: 10x0.3x0.3. Crow's nest at 16 studs: circular Metal platform 3 stud diameter.
- Sail: large triangular or rectangular Fabric part attached to mast and yard. White or off-white. Slightly curved for wind-filled look.
- Ship wheel: circular Metal/Wood frame 2 stud diameter with 6-8 handles. Mounted on pedestal at stern on quarterdeck.
- Cannon: short cylinder body 0.8x2x0.8 studs, Metal. Mounted on Wood carriage 1x1.5x0.5 studs. 6-8 per broadside, evenly spaced.
- Treasure island: small island 30x30 studs. Palm trees, sandy beach, rocky interior, hidden cave entrance, X-marks-the-spot (red X on ground).
- Dock/wharf: extend from shore 20-40 studs into water. Wood planks on pilings. Bollards for tying ships. Cargo crates and barrels scattered.
- Barrel: cylinder 1.5x2x1.5 studs, Wood material. Metal bands (thin dark rings) at top and bottom thirds. Stack in groups.
- Rope coil: small circular part 1x0.3x1 stud, brown Fabric/rope texture. Place on deck near masts and bollards.
- Rum bottle/crate: tiny props on tables or scattered. Bottles 0.2x0.8x0.2 Glass. Crates 1x1x1 Wood.
- Pirate flag: 2x0.1x1.5 stud black Fabric with white skull design (SurfaceGui or white parts). Mounted on mast or pole.
- Port town: wooden buildings along waterfront. Docks extending into harbor. Tavern with swinging sign. Market stalls.
- Lighthouse: cylindrical tower 4 stud diameter, 30-40 studs tall. White with red stripes (bands every 8 studs). Rotating SpotLight at top.
- Rowboat: small hull 4x2x1 stud, tapered bow. Two bench seats. Two oars (thin 3-stud cylinders).
- Pirate color palette: weathered wood (80,55,35), sail white (230,225,215), rope tan (160,140,100), cannon dark (40,40,45), ocean blue (40,90,140).
- Pro tip: Pirate environments should feel weathered and salty. Use CorrodedMetal on any Metal parts. Darken wood toward waterline.
- Pro tip: Add water splash particles where ship meets water. Barnacle details (small gray lumps) on hull below waterline.
- Common mistake: Clean pristine ship. Pirate ships are battered — add repairs, patches, worn ropes, and stained sails.
- Common mistake: Ship too small. A ship hull needs at least 16-20 studs length to fit deck details and look proportional.

WESTERN FRONTIER:
- Saloon: 16x12 stud footprint. False front facade (wall extends 4 studs above actual roof). Swinging doors (2x0.3x4 studs, hinged). Covered porch.
- Saloon interior: bar counter along back wall (10x2x4 studs, Wood). Mirror behind bar. Piano in corner (3x2x4 studs). Card tables (3x3x3.5 studs round).
- Sheriff office: 12x10 studs. Front desk, gun rack on wall (thin horizontal bars), jail cell in back (Metal bars enclosing 6x6 stud area).
- General store: 14x10 studs. Shelving with goods, counter with scale, barrel displays outside. Covered porch with rocking chairs.
- Water tower: cylindrical tank 4x4x4 studs on 4 tall legs (0.5x8x0.5 studs). Wood material. Conical roof. Place prominently on high ground.
- Hitching post: horizontal Wood bar 6x0.3x0.3 studs on two vertical posts at 3 stud height. Place in front of every building.
- Tumbleweeds: spherical cluster of thin brown parts, 1-2 studs diameter. Scatter along streets and empty lots.
- Covered wagon: box body 5x3x3 studs (Wood), white canvas cover (arched Fabric top 5x3x2 studs), 4 wheels 1x2x2 studs.
- Mine entrance: timber frame 4x6 stud opening in hillside. Rails on ground (thin Metal, 2 studs apart) leading in. Lantern on frame.
- Western fence: split rail — horizontal Wood rails (4x0.3x0.3) in zigzag pattern supported by crossed posts at corners.
- Windmill: tower 4x4x12 studs (Wood or Brick). Four blade assembly at top, each blade 6x0.3x1 stud, mounted on central hub.
- Western color palette: dusty tan (190,170,140), weathered wood (120,95,65), rust red (160,70,50), faded blue sky (150,180,210), desert sand (210,190,150).
- Cactus: tall saguaro — central cylinder 1x6x1 studs (green 60,120,45) with 1-2 arm branches curving upward. Small barrel cactus: 1x1x1 sphere.
- Horse trough: 4x1x1.5 stud Wood basin on short legs. Place near hitching posts. Fill with water (blue part inside).
- Pro tip: Western towns are dusty. Use Sand/Pebble terrain for streets, not Concrete. Buildings should have faded, sun-bleached colors.
- Pro tip: False fronts on buildings are the defining feature. The facade is taller and wider than the actual building behind it.
- Common mistake: Too many buildings. Real frontier towns were small — 6-10 buildings along one main street.
- Common mistake: Clean new lumber. Western buildings use weathered, darkened wood. Age everything.

SPORTS ARENA AND STADIUM:
- Stadium footprint: 80x60 studs for a small arena, 120x80 for a medium field. Playing field in center, seating around perimeter.
- Seating tiers: rows of 1x1x1 stud seats on stepped platforms. Each tier rises 1 stud and goes back 1.5 studs. 10-20 rows for small, 30+ for large.
- Seat color: uniform within sections, different between. Home side one color, away side another. VIP section different. Creates visual blocks.
- Press box: enclosed room (8x4x4 studs) high on one side with Glass front. Contains desks, monitors, microphones.
- Scoreboard: large flat surface 8x0.5x4 studs. Dark background with SurfaceGui for numbers/text. Mount high on one end.
- Floodlights: 4-6 tall poles (1x30x1 studs) at corners with clusters of SpotLights (Range 60+, white, pointed at field).
- Concession stand: small building 6x4x8 studs under seating. Counter, menu board, small kitchen inside.
- Ticket booth: 3x3x8 stud structure at entrance with window. Queue barriers (stanchion posts with rope between them).
- Entrance gate: 10-16 stud wide opening with turnstile barriers (1x3x1 stud Metal barriers with rotating arm).
- Locker room: 12x10 studs. Lockers along walls, benches in center (4x1x2 studs), shower area, whiteboard for strategy.
- Running track: 4-stud-wide oval around field. Pebble material, brick red color (180,70,50). Lane markings (white lines).
- Goal posts: Football style — two vertical Metal poles 0.5x12x0.5 studs, 6 studs apart, connected by crossbar at 4 stud height. Yellow (255,220,0).
- Soccer goal: 8x0.5x4 stud Metal frame. Netting simulated by thin white cross-hatched parts or single semi-transparent part.
- Basketball hoop: backboard 3x0.3x2 studs (white, slightly transparent). Rim 1.5 stud diameter circle at center. Net below. Pole 1x10x1 studs.
- Baseball diamond: infield 30x30 studs, dirt/sand terrain. Bases at corners (white 1x0.1x1 studs). Pitcher mound slightly raised.
- Pro tip: Stadiums feel epic with scale. Make them larger than you think necessary. Empty space in the middle is fine — the field needs room.
- Pro tip: Add team logos/colors to seating sections, banners hanging from upper levels, and sponsor signs around the field border.
- Common mistake: Flat seating. Seats must step up at an angle so rear rows can see over front rows. 1 stud rise per row minimum.
- Common mistake: No barrier between field and seats. Add a low wall (2-3 studs) or fence between playing surface and first row.

RELIGIOUS AND CEREMONIAL:
- Church: 20x40 stud footprint. Nave (main hall) 16x30 studs, 20+ studs tall ceiling. Entry porch. Bell tower on one side.
- Church steeple: 6x6 stud base rising from roof, tapering to a point. Total height 30-40 studs above roof. Cross at peak (1x3x0.3 studs).
- Stained glass window: large Glass parts (4x6 studs or larger) with multiple colored sections. Use separate colored Glass pieces in a pattern.
- Pews: long wooden benches 6x1x2.5 studs with 6x0.5x2 stud backs. Rows spaced 2 studs apart down the nave. 8-12 rows.
- Altar: raised platform (8x4x1 studs) at the front of the nave. Altar table 4x2x3.5 studs (Marble or Wood, ornate).
- Pulpit: elevated speaking platform 2x2x5 studs, accessed by small staircase. Wood with decorative front panel.
- Bell tower: 6x6 stud square tower, 30-40 studs tall. Open arched windows near top for bell. Bell is a cylinder 2x2x2 studs.
- Graveyard: adjacent to church. Headstones (1.5x0.5x2.5 Granite) in rows 3 studs apart. Iron fence perimeter. Some tilted with age.
- Temple (generic): larger footprint 30x30+. Columned entrance (4-6 pillars, cylinder 2x12x2 studs, Marble). Symmetrical layout.
- Mosque dome: large hemisphere 12-20 stud diameter on cylindrical base. Minaret tower (cylinder 2x30x2 studs) nearby. Crescent finial at dome top.
- Pyramid: square base 30x30+ studs, rising to point. Use stepped layers or smooth angled surfaces. Granite or Sand material.
- Amphitheater (ancient): semi-circular tiered seating (see stadium section) around a flat circular stage 20 stud diameter. Cobblestone material.
- Memorial wall: long vertical surface 20x0.5x8 studs (Granite, dark). Names via SurfaceGui. Bench in front. Flags at ends.
- Pro tip: Religious buildings have tall interiors relative to floor area. Ceiling height should be at least 1.5x wall width for the main hall.
- Pro tip: Use Marble pillars and arched windows to instantly communicate formal/sacred architecture.
- Common mistake: Not enough interior height. Church naves need 20+ stud ceilings. Low ceilings lose the grand feeling.
- Common mistake: Perfectly uniform headstones. Real cemeteries have varied stone shapes, sizes, and states of weathering.

AMUSEMENT PARK:
- Roller coaster track: thin Metal rails (0.3 stud wide) in pairs 2 studs apart. Support columns every 8-12 studs. Track curves built from angled sections.
- Coaster lift hill: steep incline (45-60 degrees). Chain mechanism visual (thin dark line up center). Anti-rollback visual (small notched parts).
- Coaster loop: circular track section 15-20 stud diameter. Support structure underneath the loop. Uses many angled track segments.
- Ferris wheel: large circle 20-30 stud diameter. Central axle. 6-8 gondola cars (2x2x2 stud boxes) hanging from rim, evenly spaced.
- Carousel/merry-go-round: circular platform 10 stud diameter. Central pole. Horses (small figurines) on poles around the edge. Canopy roof.
- Bumper cars: flat arena 20x20 studs with low wall border. Small car bodies (2x1.5x1.5 studs each) with pole to ceiling grid for electricity visual.
- Ticket booth: small structure 3x3x8 studs. Window with overhang. Sign with ride name. Queue fence leading to ride entrance.
- Queue fence: stanchion posts (0.3x3x0.3 studs) every 3 studs with rope/chain between them. Creates switchback path.
- Food stand: cart or small booth 4x3x8 studs. Colorful awning. Menu sign. Specific theme (popcorn, cotton candy, hot dogs).
- Prize booth: counter with shelves of stuffed animals (small colored spheres/cylinders). Awning. Game area in front.
- Cotton candy cart: 3x2x5 stud wheeled cart. Large cylinder for spinner. Pink/blue cotton candy props (small fluffy sphere on stick).
- Entrance arch: large decorated arch 16x2x12 studs. Bold colorful letters for park name. Lights along the arch (small Neon dots).
- Park pathway: wide (6-8 studs), Cobblestone or painted Concrete. Gentle curves. Directional signs at intersections.
- Theme zone: cluster buildings and rides with consistent color/material theme. Different zone = different palette.
- Park bench (themed): match the zone theme. Western zone gets rustic wood, sci-fi zone gets metal/neon, fantasy zone gets ornate stone.
- Amusement color palette: primary colors (red 220,40,40, blue 40,80,200, yellow 255,220,0), white trim (245,245,245), cotton candy pink (255,150,180).
- Pro tip: Amusement parks need visual landmarks — a tall ride or icon visible from everywhere helps navigation and creates excitement.
- Pro tip: Mix ride types: thrill rides (coasters), family rides (carousel), water rides, dark rides (indoor). Variety keeps interest.
- Common mistake: Rides too close together. Leave 10-15 stud gaps between attractions for queues, paths, and scenery.
- Common mistake: No theming. Bare metal rides feel sterile. Add scenery, paintings, themed structures around and within ride areas.

TEXTURE AND SURFACE DETAIL:
- Wall paneling: divide large wall surfaces into panels using recessed or protruding lines every 4-8 studs. Creates visual rhythm.
- Horizontal siding: thin horizontal lines (0.1 stud recesses) every 1-2 studs across wall surface. Wood material. Common residential exterior.
- Vertical board-and-batten: wide boards (2 studs) with thin battens (0.3 studs) covering gaps. Alternate slightly different shades.
- Wainscoting: lower 3-4 studs of interior wall has different material/color from upper portion. Dividing rail (chair rail) at transition.
- Crown molding: decorative strip 0.3x0.3 studs at ceiling-wall junction. Profile detail using wedge edge. Adds formal interior feel.
- Baseboard: 0.3x0.3 stud strip running along floor-wall junction. Slightly lighter or darker than wall. Essential for polished interiors.
- Herringbone pattern: parts angled 45 degrees alternating direction in rows. Used for brick walkways and wood floors. Each brick 1x0.5x0.2 studs.
- Checkerboard floor: alternating two colors in grid pattern. Each tile 1x0.1x1 or 2x0.1x2 studs. Classic for diners, kitchens, bathrooms.
- Tiled wall: grid of slightly offset small parts (1x0.1x1 studs) with thin grout lines (gaps or darker lines). Marble or Granite material.
- Running bond (brick): standard brick pattern offset by half each row. Each brick 1.5x0.5x0.5 studs. Brick material with dark mortar lines.
- Corrugated surface: alternating ridge and valley (0.1 stud variation) across surface. Metal material. Industrial walls and roofs.
- Concrete block wall: grid of 1.5x1x1 stud blocks with thin mortar lines. Subtle color variation between blocks. Industrial and utilitarian.
- Mosaic: tiny colored parts (0.3x0.1x0.3 studs) arranged in patterns or images. Marble or Glass material. Used for floors or feature walls.
- Weathering effects: darker color streaks (0.1 stud thick parts) running down from window sills, roof edges, and any horizontal surface.
- Rust streaks: orange-brown (180,100,40) thin parts running down from Metal fixtures (bolts, brackets, hinges) on walls.
- Graffiti/tags: small colored parts or SurfaceGui on urban walls. Concentrate in alleys, underpasses, and abandoned buildings.
- Floor transitions: where two floor materials meet, add a thin transition strip (0.2x0.1x(width) stud Metal or Wood part) for a clean edge.
- Pro tip: Surface detail is what separates beginner builds from professional ones. One recessed panel line across a wall adds more than 10 new parts.
- Pro tip: Texture pattern should match building style. Don't put herringbone brick on a sci-fi base or corrugated metal on a Victorian house.
- Common mistake: Applying heavy texture everywhere. Use detailed surfaces as accents — a feature wall, an entry floor, a fireplace surround.
- Common mistake: Mismatched texture scale. If bricks are 1.5 studs wide on walls, keep that scale consistent. Don't mix 1-stud and 3-stud bricks.

TROPICAL RESORT:
- Resort main building: 40x30 stud footprint. Open-air lobby with thatched roof (Sand material, 45-degree pitch). White walls, large archways instead of windows.
- Tiki hut: circular or octagonal, 6-8 stud diameter. Thatched conical roof extending 2 studs past walls. Open sides or half-walls. Bamboo frame.
- Thatched roof construction: Sand or Pebble material in warm tan (200,180,140). Layer at steep angle. Rough edges at bottom (irregular trim).
- Beach cabana: 6x6 stud platform with 4 posts and fabric canopy (white Fabric). Two lounge chairs inside. Gauzy curtain sides (Glass 0.8 Transparency).
- Pool (resort): free-form shape 30x15 studs, 3-4 studs deep. Water terrain fill. Concrete deck 6 studs wide around. Mosaic tile edge detail.
- Infinity pool edge: one side of pool at cliff/platform edge. Water level flush with edge. Creates visual of water merging with horizon.
- Swim-up bar: bar counter 6x2x2 studs partially in pool. Stools in water (Metal frame with Fabric cushion). Thatched roof over bar area.
- Waterslide: tube or open channel (3 stud wide, 1 stud deep) spiraling from 20+ stud height to pool. Metal or colored Concrete. Support structure.
- Hammock: between two palm trees or posts 4-6 studs apart. Fabric part slightly curved/sagging in center. 2 studs off ground.
- Tiki torch: thin Wood pole 0.3x5x0.3 studs with flame at top. PointLight (Range 10, warm orange). Place along paths every 6-8 studs.
- Tropical bar: open-air structure 8x4x8 studs. Counter with bamboo facing. Shelves with bottles behind. Overhead fan (see ceiling fan in interiors).
- Surfboard rack: angled frame 4x2x4 studs holding 3-4 surfboards (thin colored ovals 0.2x5x1 studs). Place near beach.
- Outdoor shower: single post 0.5x7x0.5 studs with showerhead. Small platform 2x2 studs. Wooden slat floor. Near pool/beach entrance.
- Tropical garden: large-leaf plants (4-5 studs tall), bird of paradise flowers (orange/purple), plumeria (white/yellow), hibiscus (red/pink). Lush and dense.
- Resort path: Cobblestone or flagstone (irregular shaped pieces) through manicured gardens. Lined with tropical plants and landscape lighting.
- Overwater bungalow: small house 12x10 studs on stilts 4-6 studs above water. Glass floor panel (see-through to water below). Thatched roof.
- Resort color palette: ocean turquoise (50,200,200), sand beige (220,200,170), palm green (50,120,60), sunset coral (230,120,80), white (245,245,245).
- Pro tip: Tropical resorts use natural materials (wood, bamboo, thatch) mixed with luxury touches (Glass, Marble). The contrast sells paradise.
- Pro tip: Open-air design is key. Remove walls where possible. Use archways, open-sided structures, and minimal barriers between indoor and outdoor.
- Common mistake: Enclosed buildings like a cold-climate design. Tropical architecture maximizes airflow with open walls, high ceilings, and outdoor living.
- Common mistake: Uniform vegetation. Tropical environments are lush and dense. Use many different plant types packed closely together.

POST-APOCALYPTIC:
- Ruined building: start with normal structure. Remove 30-40% of walls and roof. Add debris at base. Tilt remaining walls 5-10 degrees off vertical.
- Collapsed floor: floor part broken into 2-3 pieces with gaps. One piece tilted downward. Debris pile below. Exposed rebar (thin Metal rods sticking up).
- Rebar: thin Metal cylinders (0.2 stud diameter) protruding from broken concrete edges. Rust colored (180,100,50). Bent at random angles.
- Overgrown ruins: vegetation growing through and over destroyed buildings. Vines on walls, grass through cracked floors, trees growing inside roofless rooms.
- Abandoned car: regular car body (see vehicles) with CorrodedMetal material. Flat tires (wheels at slightly lower Y). Broken windows. Rust patches.
- Makeshift shelter: corrugated Metal sheets leaning against wall. Tarp (Fabric) stretched over opening. Interior: sleeping bag, supply crate, lantern.
- Barricade: stacked furniture, car parts, sandbags, wood pallets blocking a road or doorway. Haphazard angles. 4-8 parts.
- Supply cache: collection of salvaged items. Ammo boxes, water jugs (blue cylinders), canned food (small cylinders), medical kit (white box with red cross).
- Burned-out building: walls standing but interior gutted. Black char marks (dark Concrete 20,20,25) on walls. No roof. Ash debris on floor.
- Crater: circular depression 6-12 studs diameter, 2-4 studs deep. Scorched earth (black terrain) radiating from center. Debris scattered around rim.
- Fallout shelter sign: yellow and black triangular sign (1x0.1x1 stud) on concrete walls. The universal civil defense symbol.
- Makeshift bridge: car hoods, doors, and wood planks spanning a gap. Rope lashings (thin brown cylinders) at joints. Rickety appearance.
- Scavenged power: car battery (1x0.5x0.5 stud) connected by wires to a single dim light bulb. Or generator (2x1x1.5 Metal box) for larger setups.
- Warning signs: hand-painted messages on walls (SurfaceGui text). "DANGER", "KEEP OUT", "INFECTED ZONE", "SAFE HOUSE ->".
- Camp perimeter: trip wire (thin barely-visible part at 1 stud height), tin cans on string (tiny cylinders), barbed wire (zigzag Metal).
- Water collection: barrel under gutter downspout, tarps angled into containers, solar still (Glass sheet over excavation).
- Post-apocalyptic palette: rust (180,100,50), char black (25,20,20), military green (70,80,55), concrete gray (140,140,145), dried blood brown (100,40,30).
- CorrodedMetal: use on ALL exposed metal surfaces. No clean metal in apocalypse settings. Everything has weathered for years.
- Makeshift weapon rack: Metal frame against wall holding improvised weapons: pipe (cylinder), bat (tapered cylinder), blade (thin pointed part).
- Camp fire: circle of rocks (8 small Granite parts in ring). Wood pile center (small brown cylinders in teepee arrangement). PointLight (Range 12, warm).
- Pro tip: Post-apocalyptic is about resourcefulness. Every structure should look built from scavenged parts. Nothing matches or is purpose-built.
- Pro tip: Nature is reclaiming the world. Vegetation growth increases dramatically on anything abandoned. Roots crack foundations, vines cover walls.
- Pro tip: Tell stories through the environment. A child's toy near a barricade, a last meal on a table, messages scratched into walls.
- Common mistake: Too organized. Apocalypse survivors don't have matching furniture or neat layouts. Everything is improvised and asymmetric.
- Common mistake: Forgetting the passage of time. Years of weathering means faded colors, corroded metals, rotted wood, and dust everywhere.

MUSEUM AND GALLERY:
- Museum lobby: 30x20 stud open space. High ceiling (20+ studs). Information desk center. Map display. Gift shop entrance.
- Gallery room: 16x16 studs per room. White walls (245,245,245). Polished floor (Granite or Marble, light gray). Minimal furniture. Art on walls.
- Art display: paintings are flat colored rectangles (various sizes 1-3 studs) in frames (0.3 stud Wood or Metal border). Hang at 4-5 stud height (eye level).
- Sculpture pedestal: 2x2x3 stud white Marble base. Sculpture on top (abstract or figurative, 2-4 studs tall). SpotLight from ceiling aimed at sculpture.
- Display case: 3x2x4 stud Glass box on pedestal. Metal frame edges. Interior object visible. Small label/plaque at base (0.5x0.1x0.3 stud).
- Museum lighting: SpotLights aimed at each display piece from ceiling. Dim ambient (dark walls between spotlit areas). Creates dramatic gallery effect.
- Interactive exhibit: table or platform with buttons (small Neon circles) and display screen (Glass with SurfaceGui). Hands-on learning area.
- Dinosaur skeleton: large frame 20x4x10 studs made from white/bone-colored (230,220,200) parts. Long tail, small head, large body. Wire stand supports.
- Natural history diorama: recessed wall display 8x4x6 studs. Painted background (flat part). Terrain floor. Taxidermy animal figures. Vegetation.
- Museum bench: simple 4x1x2 stud bench (Wood or leather Fabric top, Metal frame) centered in gallery room facing wall art.
- Security stanchion: red rope on Metal posts between visitor path and displays. Posts every 3 studs with Fabric rope connecting.
- Emergency exit sign: small green rectangle (1x0.1x0.5 stud, Neon green) above doors. Required in every room. Points toward exits.
- Gift shop: small room 10x8 studs with shelving, postcards (tiny colored rectangles), books, and souvenir items. Register at counter.
- Pro tip: Museum spaces need LOTS of empty floor. Don't pack displays too tightly. The negative space makes each piece feel important.
- Pro tip: Consistent lighting across all display pieces. Each artwork should have its own SpotLight at the same angle and brightness.
- Common mistake: Too much on the walls. Professional galleries space artworks 4-6 studs apart. Crowding cheapens the presentation.
- Common mistake: Colored walls in gallery spaces. Keep walls white or very light gray. The art should be the color, not the walls.

CONSTRUCTION SITE:
- Site perimeter: temporary chain-link fence panels 8x0.1x6 studs (Metal with Glass fill for mesh). Orange/red privacy mesh on lower half.
- Scaffolding: Metal frame grid. Vertical poles 0.3x6x0.3 studs. Horizontal bars connecting at 6-stud intervals. Wood plank walkways between levels.
- Scaffolding detail: diagonal braces (0.3x8x0.3 at 45 degrees) between levels. Toe boards at edges. Access ladder at one end.
- Partially built structure: foundation and first floor walls complete. Upper floors showing exposed frame (Metal beams without walls). Rebar sticking up from columns.
- Concrete form: Wood frames (box shapes) surrounding poured concrete columns. Temporary support shores (angled Wood braces).
- Tower crane: see industrial section. The defining landmark of any construction site. Tall enough to be visible from distance.
- Excavator: body 4x3x3 studs on tracks. Arm extending 6-8 studs with bucket at end. Yellow (255,200,0). Cab with Glass.
- Bulldozer: low body 5x3x2 studs. Blade at front 4x0.3x2 studs. Tracks on sides. Yellow body.
- Concrete mixer truck: truck body 8x3x3. Rotating drum on back 3x4x3 studs (angled cylinder). Chute extending from rear.
- Porta-potty: 2x2x6 stud box, blue or green plastic (Concrete material in blue/green). Door with vent slots. Place in row of 2-4.
- Safety cone: small orange cone (0.5x1x0.5 stud cylinder tapered at top). Orange (255,130,0) with white reflective band. Scatter around work zones.
- Hard hat: not visible at building scale, but yellow hard hat props on tables/racks communicate construction theme.
- Construction sign: 4x0.1x3 stud orange/yellow part with text. "CAUTION: CONSTRUCTION AREA", "AUTHORIZED PERSONNEL ONLY". At site entrance.
- Material pile: stacked lumber (4x0.3x0.3 stud bundles, Wood), rebar bundles, gravel pile (gray Pebble terrain), sand pile.
- Dumpster (construction): larger than residential, 6x3x3 studs. Filled with debris (random parts above rim). Bright yellow or green.
- Construction color palette: safety orange (255,130,0), caution yellow (255,220,0), equipment yellow (255,200,0), steel gray (100,105,110), concrete (170,170,175).
- Pro tip: Construction sites are controlled chaos. Equipment, materials, and workers occupy different zones but everything is connected by dirt roads.
- Pro tip: Mud everywhere. Ground around construction is never clean grass. Use darker terrain, tire tracks (dark line parts), and puddles.
- Common mistake: Neat and organized site. Real construction sites have scattered materials, temporary pathways, and overlapping work zones.
- Common mistake: Missing safety elements. Construction sites have high-vis colors EVERYWHERE — cones, signs, barriers, vests, equipment paint.

AIRPORT:
- Terminal building: 80x40 stud footprint minimum. Long and rectangular. Glass curtain wall facade (see modern architecture). High ceiling lobby 20+ studs.
- Check-in counter: long counter 20x2x4 studs with 4-6 stations. Scale at each (1x0.5x0.5 Metal on counter). Belt behind counter (conveyor 2 studs wide).
- Security checkpoint: queue maze (stanchion ropes). X-ray machine (3x2x3 Metal box with small opening). Metal detector arch (3x1x7 studs). Belt conveyor.
- Gate area: waiting seats in rows (see lobby seating). Large windows overlooking tarmac. Gate desk (4x2x4 studs). Flight info display (4x0.2x2 Glass with SurfaceGui).
- Jet bridge: enclosed walkway 4x6x30 studs extending from terminal at slight downward angle. Accordion walls (Metal with pleated sections). Glass windows.
- Runway: 200+ studs long, 12 studs wide. Concrete (dark gray 100,100,105). White center line. Threshold markings (white stripes at ends).
- Taxiway: 8 studs wide connecting runway to terminal. Yellow center line. Concrete same as runway.
- Control tower: cylindrical or rectangular shaft 4x4x40+ studs. Glass-enclosed observation deck at top 8x8x6 studs. Antennas on roof.
- Hangar: large open building 60x40x20 studs. Massive door on one end (40x16 studs, Metal). Interior supports (Metal trusses). Concrete floor.
- Baggage claim: conveyor belt in oval loop 20x8 studs. Belt surface 2 studs wide, 1 stud above floor. Luggage props (small colored boxes on belt).
- Airport parking garage: multi-level (see modern architecture parking). Covered walkway connecting to terminal. Pay station at exit.
- Windsock: pole 1x6x1 studs with conical Fabric tube (1 stud opening, tapered to 0.3 studs) at top. Orange-white stripes.
- Commercial airplane: fuselage cylinder 4x4x30 studs. Wings extending 20 studs each side (thin 20x0.3x4 parts). Tail: vertical (3x0.2x4) + horizontal (6x0.2x1.5). Engines: cylinders 2x3x2 under wings.
- Airport color palette: terminal white (240,240,245), floor tile beige (200,195,180), signage blue (0,80,160), runway gray (100,100,105), safety yellow (255,200,0).
- Wayfinding signs: blue background with white text/arrows. Hang from ceiling at junctions. Gate numbers, baggage, exits, restrooms.
- Pro tip: Airports feel huge because of their horizontal scale. Make the terminal LONG — 100+ studs if possible. Height is secondary to length.
- Pro tip: Add moving walkway (flat belt conveyor in floor, 2 studs wide, 20+ studs long) in long terminal corridors.
- Common mistake: Terminal too small. Even a small airport terminal should be at least 60 studs long to feel believable.
- Common mistake: No tarmac. The area between terminal and runway needs apron space — flat concrete 30+ studs wide with painted markings.

HOSPITAL:
- Hospital exterior: 40x30 stud footprint per wing. 3-5 stories. Brick or Concrete lower, lighter upper floors. Emergency entrance with covered drive-through.
- Emergency entrance: wide drive-under canopy 16x12 studs on pillars. Red "EMERGENCY" sign with Neon. Automatic doors (Glass, 6x8 studs).
- Reception/waiting: 20x16 studs. Counter (8x2x4 studs). Rows of chairs (connected seats, 6x1x2.5 studs per row). TV on wall. Magazines on table.
- Patient room: 12x10 studs. Hospital bed (3x6x2.5 studs, Metal frame, white bedding). Bedside table. IV stand (thin pole 0.3x5x0.3 with bag).
- Hospital bed: Metal frame 3x6x1 stud. Adjustable head section raised 15 degrees. White Fabric mattress. Guard rails on sides (0.3x3x1.5 Metal).
- Operating room: 14x12 studs. Central table (2x5x3 studs, Metal). Overhead light (large circular 3x0.3x3 stud disc with multiple SpotLights). Equipment carts.
- Nurse station: central desk area 8x4x4 studs in hallway hub. Monitors, phone system, patient charts (small white rectangles). Open top for visibility.
- Hospital hallway: 6 studs wide minimum. Handrails on both walls (0.5 stud from wall, 3 studs height). Floor: two-tone (center strip lighter). Clean white walls.
- Ambulance: van body 8x3x4 studs. White with red stripe. Red cross on sides. Rear doors opening. Light bar on top (red/blue Neon, 2x0.3x0.3).
- Wheelchair: seat 1.5x1.5x2 studs. Two large rear wheels (1x2x2 studs). Two small front casters. Footrest extending forward. Metal frame.
- Stretcher/gurney: flat surface 2x6x3 studs on wheeled frame. White mattress pad. Collapsible legs (X-pattern support).
- Medical equipment: heart monitor (1x0.5x1.5 stud box with Glass screen), defibrillator (1x0.5x1 stud with paddles), oxygen tank (cylinder 0.5x2x0.5).
- Pharmacy: counter with security glass (Glass with small service window). Shelving behind filled with medicine boxes (tiny colored blocks in rows).
- Cafeteria: standard cafeteria layout (see school section). Serving line, tables, vending machines (2x1x5 stud boxes with Glass front and product display).
- Hospital color palette: clinical white (245,245,250), floor green (180,200,180), accent blue (60,130,200), emergency red (200,30,30), equipment gray (160,165,170).
- Pro tip: Hospital corridors have color-coded floor lines leading to different departments. Add thin colored stripes running along hallway floors.
- Pro tip: Every room needs a hand sanitizer dispenser (small 0.3x0.3x0.5 white box on wall by door). Tiny detail, big realism.
- Common mistake: Hospital rooms too small. 12x10 is minimum — need space for bed, equipment, chair, and walking around.
- Common mistake: No signage. Hospitals have signs EVERYWHERE — room numbers, department names, directional arrows, safety notices.

PRISON:
- Cell block: long corridor with cells on one or both sides. Each cell 6x8 studs with Metal bar front. 2-3 levels with walkways.
- Prison cell: 6x8 studs interior. Bunk bed (3x6x5 Metal). Toilet (1.5x2x2.5, no seat — Metal). Sink (1.5x1x3 Metal wall-mount). Small shelf.
- Cell bars: vertical Metal bars 0.3x7x0.3 studs, spaced 0.5 studs apart across 3-stud opening. Door section: bars in frame that slides open.
- Guard tower: 6x6x20 stud tower at fence corners. Enclosed top with windows all around. Searchlight (SpotLight, Range 60). Exterior ladder or stairs.
- Exercise yard: 40x40 studs enclosed by high walls (20+ studs). Concrete floor. Basketball hoop. Weight bench (3x1x2 Metal). Guard walkway above.
- Perimeter wall: Concrete, 2-3 studs thick, 20+ studs tall. Razor wire at top (zigzag thin Metal, shiny). Guard walkway at top interior side.
- Mess hall: 30x20 studs. Long Metal tables with attached benches (10x2x3 studs). Serving line with tray rail and sneeze guard.
- Warden office: 12x10 studs. Large desk, filing cabinets, monitors showing security camera feeds (multiple small Glass panels with dark content).
- Visitation room: 12x12 studs. Counter dividing room in half with Glass partition (4 studs tall above counter). Phone handsets on both sides.
- Solitary confinement: 4x6 stud cell with solid Metal door (no bars). Slot in door for food tray. Single dim overhead light. Bare concrete.
- Security checkpoint: Metal detector, search area, multiple locked doors with buzzer system (small box on wall with button).
- Prison color palette: institutional gray (170,170,175), cinderblock (155,155,160), bar metal (80,85,90), floor concrete (140,140,145), orange jumpsuit (230,120,30).
- Pro tip: Prisons feel oppressive through repetition. Identical cells, long identical corridors, uniform colors. The monotony IS the design.
- Pro tip: Add security cameras (small dark box 0.5x0.5x1 stud with tiny cylinder lens) at corridor intersections and in common areas.
- Common mistake: Cells too big. Prison cells are deliberately small. 6x8 studs maximum for a standard cell.
- Common mistake: Windows too large or too many. Prisons minimize windows. Small, high windows (1x2 studs, 6+ studs from floor) with bars.

FARM AND RURAL:
- Barn: 24x16 stud footprint. Gambrel roof (see roofing). Large double doors on one end (12x10 studs). Red (170,50,40) or weathered brown.
- Barn interior: open central aisle 6 studs wide. Hay storage in loft above (second level). Horse stalls along sides (6x8 studs each, Wood partition walls).
- Silo: see industrial section. Place adjacent to barn. Connected by covered walkway or conveyor.
- Farmhouse: two-story, Victorian or Colonial style (see residential). Wraparound porch. White with colored shutters. Large kitchen.
- Chicken coop: 6x4x4 stud structure. Wood with wire mesh windows (Glass fill). Small door for chickens (1x1.5 studs). Nesting boxes inside (1x1x1 Wood cubes in row).
- Tractor: body 5x3x3 studs, green or red. Large rear wheels (1x4x4 studs). Small front wheels (1x2x2). Cab with roof. Exhaust pipe (small cylinder).
- Hay bale (rectangular): 2x1.5x1.5 studs, Sand or Fabric material, straw yellow (200,185,130). Stack in barn or field.
- Hay bale (round): cylinder 2x2x2 studs. Same material and color. Place in fields after harvest.
- Fence (farm): post and rail. Posts 1x4x1 studs (Wood) every 6 studs. Three horizontal rails between posts at 1, 2, and 3 stud heights.
- Windmill (farm): see western section. Used for pumping water. Place near stock tank.
- Stock tank: oval Metal trough 4x1.5x2 studs. Water inside (blue Glass part). Place near barn for livestock.
- Scarecrow: cross-shaped frame of Wood sticks (0.3x5x0.3 vertical, 0.3x3x0.3 horizontal arms). Old clothes (Fabric parts draped). Hat on top.
- Crop field: rows of small green parts (0.3x1x0.3) in straight lines 1 stud apart. Different crops: corn (taller, yellow top), wheat (golden), vegetables (varied).
- Dirt road: 8 studs wide, brown terrain. Tire track ruts (darker lines). No painted markings. Connect farm buildings to main road.
- Farm pond: irregular shape 15x10 studs, 3 studs deep. Cattails at edges (thin green cylinders 0.3x4x0.3 with brown top puff).
- Farm color palette: barn red (170,50,40), weathered wood (130,110,80), straw gold (200,185,130), fresh green (60,130,45), soil brown (100,80,55).
- Pro tip: Farms are spread out. Buildings are 20-40 studs apart. Don't cluster everything together — the space between is part of the design.
- Pro tip: Add worn paths between frequently used buildings (darker grass or dirt trail). Animals and people create paths over time.
- Common mistake: Farm too neat. Working farms have mud, scattered equipment, partial repairs, and organized messiness.
- Common mistake: Only building the barn. A farm has a house, barn, silo, coop, fences, fields, pond, and equipment shed at minimum.

UNDERGROUND AND SEWER:
- Sewer tunnel: circular cross-section 8 studs diameter or rectangular 6x6 studs. Brick or Concrete walls. Running water channel (2 studs wide, 1 stud deep) in center floor.
- Walkway ledge: 2-stud-wide raised platform on one or both sides of water channel. Concrete surface. Handrail on water side.
- Manhole access: vertical shaft 3x3 studs from surface to tunnel, 8-12 studs deep. Metal ladder rungs (0.5 stud cylinders) on one wall. Manhole cover at top.
- Junction room: larger chamber 12x12 studs where multiple tunnels converge. Higher ceiling (8-10 studs). Central platform or walkway bridges.
- Pipe junction: large pipes (2-4 stud diameter cylinders) crossing or merging. Valve wheels (1 stud diameter circles) on pipe joints.
- Grate floor: DiamondPlate with slight transparency or cross-hatch pattern suggesting drainage below. Used in industrial sewer areas.
- Sewer water: dark water terrain or dark blue/green flat parts in the channel. Slightly reflective. Never clean blue — use murky green-brown.
- Underground lab: hidden beneath normal building. Access via hidden door or elevator. Clean white interior contrasting with rough tunnel access.
- Subway station: platform 40x6 studs. Track trench 4 studs below platform level. Tile walls. Benches. Route map. Digital display.
- Subway tunnel: 8 stud diameter bore. Two rail tracks (thin Metal strips on Wood ties every 2 studs). Emergency walkway on one side.
- Subway train: long car 20x4x4 studs. Doors at 6-stud intervals (2x4 stud openings). Windows along sides. Numbered car exterior.
- Mine shaft: wood-braced rectangular tunnel 4x6 studs. Timber frame every 6 studs (Wood beams). Rails on floor. Ore cart (2x1.5x1 Metal on wheels).
- Catacombs: low ceiling tunnel (6-7 studs) with bone/skull details in alcove recesses along walls. Cobblestone or Brick. Torch lighting only.
- Secret passage: hidden behind bookshelf, fireplace, or wall panel. Narrow (3 studs wide). Low ceiling. Stone walls. Leads to hidden room.
- Underground river: water terrain channel 6-10 studs wide flowing through cave. Banks of Granite rock. Cave overhead. Dim blue-green lighting.
- Bunker complex: interconnected rooms via narrow corridors (4 studs wide). Blast doors (see military). Generator room, supply room, sleeping quarters.
- Underground mushroom garden: bioluminescent mushrooms (see fantasy) growing in underground chamber. Blue-green glow. Moist stone walls.
- Sewer color palette: wet brick (130,90,70), concrete gray (130,130,135), water murky (60,80,50), rust (150,90,40), slime green (80,110,50).
- Pro tip: Underground spaces need visible light sources — every torch, lamp, or glowing element should be intentionally placed with corresponding PointLight.
- Pro tip: Add dripping water effects (tiny ParticleEmitters on ceiling) and water stains on walls below ceiling joints.
- Pro tip: Underground atmospherics — slightly foggy (Atmosphere Density 0.15-0.25), damp air feel, echo suggestion through spatial audio design.
- Common mistake: Underground rooms too bright. Only areas near light sources should be lit. Everything else fades to near-darkness.
- Common mistake: Clean underground. Sewers, mines, and tunnels are dirty. Add grime (dark patches), puddles, and scattered debris.
- Common mistake: Flat uniform tunnel. Real underground spaces have uneven floors, varying heights, and widened chambers at intersections.

QUICK REFERENCE - PART SIZES FOR COMMON OBJECTS:
- Street lamp: pole 1x14x1, arm 3x0.5x0.5, lamp 1.5x1x1 studs
- Park bench: seat 4x1.5x2.5, back 4x0.5x2, arm frames each end
- Fire hydrant: body 1x2.5x1, red (200,30,30)
- Mailbox: post 0.5x4x0.5, box 1.5x1x1
- Traffic light: pole 1x12x1, signal box 1.5x3.5x1
- Dumpster: 4x3x2, dark green Metal
- Shipping container: 12x4x4
- Trash can (residential): cylinder 1.5x2x1.5
- Stop sign: pole 0.5x7x0.5, octagon 1.5x0.1x1.5 red
- Newspaper box: 1x3x1.5, yellow or blue Metal
- Utility box: 1x2x1.5, green or gray Metal, near utility poles
- Bike rack: serpentine Metal tubes 4x1x3
- Parking meter: thin pole 0.3x4x0.3, meter head 0.5x0.5x0.5
- Phone booth: 2x2x7 Glass and Metal frame, red or silver
- Bus shelter: 6x3x8 Metal frame, Glass walls, bench inside
- Flag: pole 0.5x12x0.5, flag 3x0.1x2 Fabric
- Satellite dish (small): 1.5x0.5x1.5 on pole, residential
- AC unit: 2x2x2 Metal box, on rooftop or side of building
- Window AC: 2x1x1.5, Metal, protruding from window
- Antenna (TV): thin metal cross on roof, 0.3x3x0.3 vertical with 2-stud horizontal
- Clothesline: thin rope/part between two 0.3x5x0.3 poles, 6-8 studs apart. Hang fabric rectangles.
- Barrel (wood): cylinder 1.5x2x1.5, Wood, dark bands at top/bottom thirds
- Crate (wood): 2x2x2, Wood, darker cross-board detail
- Sandbag: 1.5x0.5x1, Sand material, tan (170,155,120)
- Oil drum: cylinder 1x2x1, Metal, often rusted or colored (blue, red, black)
- Pallet: 3x0.3x3, Wood, with gap pattern on top
- Road barrier: 3x2x1, orange/white striped, with flashing light on top
- Jersey barrier: 4x2x1.5, Concrete, K-shape profile for highway medians
- Bollard: cylinder 0.5x2.5x0.5, Metal or Concrete, along sidewalks to prevent vehicle access
- Chain post: 0.5x3x0.5 Metal post, chain (small dark cylinders) connecting to next post
- Ladder: two vertical rails 0.3x(height)x0.3, rungs (0.3x1.5x0.3) every 1 stud between them
- Pipe elbow: two cylinder segments meeting at 90 degrees, same diameter
- Valve wheel: circle 1 stud diameter with 4 spokes, mounted on pipe
- Fire extinguisher: cylinder 0.5x1.5x0.5, red, mounted on wall bracket at 3-4 stud height
- First aid kit: 1x0.1x0.8, white with red cross, mounted on wall
- Exit sign: 1x0.1x0.5, green Neon, above every exit door
- Clock: circle 1.5 stud diameter, white face, thin frame, mounted on wall at 6 stud height
- Vending machine: 2x1x5, Metal and Glass front, product display rows inside, at hallways/lobbies
- ATM machine: 1.5x1x5, Metal with Glass screen, recessed into wall or freestanding
- Newspaper stand: 1.5x1x4, Glass front, Metal frame, on sidewalks near intersections
- Water fountain (drinking): 1x1x3.5, Metal, wall-mounted or on pedestal, in hallways/parks
- Dumpster lid: hinged Metal panels on top of dumpster, 4x0.2x1.5 each
- Antenna tower (cell): lattice Metal structure 4x4x40+ studs, panel antennas near top
- Satellite dish (large): 6-10 stud diameter concave surface, Metal pedestal, on rooftops or ground
- Security camera: 0.5x1x0.5 Metal box with small lens cylinder, mounted on wall/ceiling bracket
- Sprinkler head: tiny 0.2x0.3x0.2 Metal part flush with ceiling, in every commercial room
- Smoke detector: small 1x0.3x1 white disc on ceiling, in every interior room
- Thermostat: 0.5x0.1x0.8 white rectangle on wall at 4 stud height, in offices and homes
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface KnowledgeSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const SECTIONS: KnowledgeSection[] = [
  {
    name: 'terrain',
    keywords: [
      'terrain', 'ground', 'landscape', 'hill', 'mountain', 'valley', 'island',
      'perlin', 'noise', 'procedural', 'generate terrain', 'biome', 'elevation',
      'grass', 'sand', 'snow', 'desert', 'forest', 'cliff', 'cave',
    ],
    startMarker: 'TERRAIN TECHNIQUES:',
    endMarker: 'LIGHTING MASTERY:',
  },
  {
    name: 'lighting',
    keywords: [
      'light', 'lighting', 'shadow', 'atmosphere', 'bloom', 'sunray', 'sun ray',
      'color correction', 'depth of field', 'dof', 'fog', 'ambient', 'brightness',
      'future lighting', 'shadowmap', 'glow', 'neon', 'dark', 'night', 'day',
      'dawn', 'dusk', 'sunset', 'sunrise', 'golden hour', 'moonlight', 'sky',
      'realistic', 'hyper realistic',
    ],
    startMarker: 'LIGHTING MASTERY:',
    endMarker: 'LOW-POLY BUILDING:',
  },
  {
    name: 'lowpoly',
    keywords: [
      'low poly', 'lowpoly', 'low-poly', 'cartoony', 'cartoon', 'stylized',
      'simple', 'minimal', 'minimalist', 'flat', 'geometric', 'angular',
      'wedge', 'clean', 'cute',
    ],
    startMarker: 'LOW-POLY BUILDING:',
    endMarker: 'PROP BUILDING:',
  },
  {
    name: 'props',
    keywords: [
      'prop', 'decoration', 'decor', 'detail',
      'crate', 'barrel', 'sign', 'poster', 'vent', 'pipe', 'wire',
    ],
    startMarker: 'PROP BUILDING:',
    endMarker: 'COLOR & AESTHETICS:',
  },
  {
    name: 'color',
    keywords: [
      'color', 'colour', 'palette', 'aesthetic', 'scheme', 'theme',
      'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink',
      'warm', 'cool', 'vibrant', 'pastel', 'bright', 'mood',
      'tone', 'contrast', 'saturation', 'hue',
    ],
    startMarker: 'COLOR & AESTHETICS:',
    endMarker: 'WATER & NATURE:',
  },
  {
    name: 'water',
    keywords: [
      'water', 'ocean', 'river', 'lake', 'waterfall', 'pond', 'stream',
      'wave', 'swim', 'beach', 'shore', 'reef', 'underwater',
      'rain', 'flood', 'dam',
    ],
    startMarker: 'WATER & NATURE:',
    endMarker: 'PROFESSIONAL WORKFLOW:',
  },
  {
    name: 'workflow',
    keywords: [
      'workflow', 'process', 'plan', 'planning', 'organize', 'efficient',
      'professional', 'greybox', 'reference', 'layout', 'sketch', 'phase',
      'plugin', 'blender', 'export', 'import', 'pipeline', 'method',
    ],
    startMarker: 'PROFESSIONAL WORKFLOW:',
    endMarker: 'PERFORMANCE OPTIMIZATION:',
  },
  {
    name: 'performance',
    keywords: [
      'performance', 'optimize', 'optimization', 'lag', 'fps', 'frame',
      'part count', 'mesh', 'meshpart', 'union', 'render', 'collision',
      'streaming', 'server', 'client', 'memory', 'network', 'remote',
      'fast', 'slow', 'efficient', 'greedy mesh',
    ],
    startMarker: 'PERFORMANCE OPTIMIZATION:',
    endMarker: 'COMMON MISTAKES TO AVOID:',
  },
  {
    name: 'mistakes',
    keywords: [
      'mistake', 'avoid', 'wrong', 'bad', 'dont', "don't", 'never',
      'problem', 'issue', 'fix', 'bug', 'error', 'ugly', 'broken',
    ],
    startMarker: 'COMMON MISTAKES TO AVOID:',
    endMarker: 'SCALE & PROPORTION REFERENCE:',
  },
  {
    name: 'scale',
    keywords: [
      'scale', 'proportion', 'size', 'dimension', 'stud', 'height',
      'width', 'door', 'wall', 'window', 'stair', 'floor', 'ceiling',
      'road', 'sidewalk', 'table', 'chair', 'counter', 'measure',
      'building', 'house', 'room',
    ],
    startMarker: 'SCALE & PROPORTION REFERENCE:',
    endMarker: 'MATERIAL GUIDE:',
  },
  {
    name: 'materials',
    keywords: [
      'material', 'concrete', 'wood', 'brick', 'metal', 'granite',
      'marble', 'slate', 'glass', 'neon', 'fabric', 'foil', 'ice',
      'cobblestone', 'diamond plate', 'corroded', 'pebble', 'smooth',
      'surface', 'texture',
    ],
    startMarker: 'MATERIAL GUIDE:',
    endMarker: 'RESIDENTIAL HOUSES:',
  },
  {
    name: 'residential',
    keywords: [
      'house', 'home', 'residential', 'cottage', 'cabin', 'ranch',
      'colonial', 'victorian', 'porch', 'garage', 'roof', 'chimney',
      'staircase', 'foundation', 'gable', 'dormer', 'bay window',
      'laundry', 'mudroom', 'apartment', 'two story', 'two-story',
    ],
    startMarker: 'RESIDENTIAL HOUSES:',
    endMarker: 'SCHOOL CAMPUS:',
  },
  {
    name: 'school',
    keywords: [
      'school', 'classroom', 'locker', 'hallway', 'gymnasium', 'gym',
      'cafeteria', 'library', 'science lab', 'computer lab', 'principal',
      'nurse', 'campus', 'education', 'student', 'teacher', 'bleacher',
      'flagpole', 'school bus',
    ],
    startMarker: 'SCHOOL CAMPUS:',
    endMarker: 'MILITARY AND BUNKER:',
  },
  {
    name: 'military',
    keywords: [
      'military', 'army', 'base', 'barracks', 'bunker', 'tank',
      'soldier', 'war', 'battle', 'combat', 'weapon', 'gun',
      'camouflage', 'watchtower', 'helipad', 'radar', 'sandbag',
      'obstacle course', 'command center', 'navy', 'airforce',
    ],
    startMarker: 'MILITARY AND BUNKER:',
    endMarker: 'UNDERWATER BUILDS:',
  },
  {
    name: 'underwater',
    keywords: [
      'underwater', 'ocean', 'submarine', 'coral', 'reef', 'seaweed',
      'shipwreck', 'treasure', 'deep sea', 'diving', 'aquarium',
      'bubble', 'kelp', 'anchor', 'porthole', 'atlantis',
    ],
    startMarker: 'UNDERWATER BUILDS:',
    endMarker: 'SEASONAL AND WEATHER:',
  },
  {
    name: 'seasonal',
    keywords: [
      'winter', 'snow', 'ice', 'frozen', 'christmas', 'autumn', 'fall',
      'spring', 'summer', 'rain', 'storm', 'thunder', 'fog', 'weather',
      'season', 'sunset', 'night', 'lava', 'volcano', 'sandstorm',
      'tropical', 'arctic', 'tundra', 'icicle', 'snowman', 'pumpkin',
    ],
    startMarker: 'SEASONAL AND WEATHER:',
    endMarker: 'BUILDING STYLE RECIPES:',
  },
  {
    name: 'recipes',
    keywords: [
      'recipe', 'step by step', 'tutorial', 'how to build', 'guide',
      'construction sequence', 'build a house', 'build a tower',
      'build a corridor', 'build a park', 'build steps', 'walkthrough',
      'beginner', 'starter', 'example build', 'template',
    ],
    startMarker: 'BUILDING STYLE RECIPES:',
    endMarker: 'STUD TO REAL-WORLD CONVERSION:',
  },
  {
    name: 'conversion',
    keywords: [
      'stud', 'meter', 'feet', 'foot', 'inch', 'real world', 'real-world',
      'conversion', 'convert', 'measurement', 'scale', 'proportion',
      'how big', 'how tall', 'how wide', 'dimension', 'size',
    ],
    startMarker: 'STUD TO REAL-WORLD CONVERSION:',
    endMarker: 'MEDIEVAL CONSTRUCTION:',
  },
  {
    name: 'medieval',
    keywords: [
      'medieval', 'castle', 'keep', 'tower', 'drawbridge', 'moat',
      'dungeon', 'battlement', 'crenellation', 'portcullis', 'gatehouse',
      'knight', 'throne', 'kingdom', 'fortress', 'rampart', 'parapet',
      'courtyard', 'blacksmith', 'forge', 'tavern', 'village',
      'half-timber', 'thatched', 'cobblestone', 'old', 'ancient', 'rpg',
    ],
    startMarker: 'MEDIEVAL CONSTRUCTION:',
    endMarker: 'MODERN ARCHITECTURE:',
  },
  {
    name: 'modern',
    keywords: [
      'modern', 'apartment', 'office', 'skyscraper', 'glass facade',
      'parking', 'elevator', 'lobby', 'contemporary', 'urban',
      'penthouse', 'condo', 'high-rise', 'highrise', 'downtown',
      'commercial', 'corporate', 'business', 'rooftop', 'fire escape',
    ],
    startMarker: 'MODERN ARCHITECTURE:',
    endMarker: 'SCI-FI FUTURISTIC BUILDING:',
  },
  {
    name: 'scifi',
    keywords: [
      'sci-fi', 'scifi', 'futuristic', 'space', 'station', 'spaceship',
      'neon', 'hologram', 'holographic', 'alien', 'cyberpunk', 'cyber',
      'reactor', 'hangar', 'corridor', 'airlock', 'laser', 'robot',
      'android', 'mech', 'tech', 'server room', 'control panel',
    ],
    startMarker: 'SCI-FI FUTURISTIC BUILDING:',
    endMarker: 'NATURAL ENVIRONMENT:',
  },
  {
    name: 'nature',
    keywords: [
      'nature', 'natural', 'river', 'waterfall', 'cave', 'cliff',
      'beach', 'forest', 'mountain', 'tree', 'rock', 'pond',
      'swamp', 'mushroom', 'flower', 'pine', 'oak', 'palm',
      'stalactite', 'crystal', 'meadow', 'wilderness', 'outdoor',
      'landscape', 'environment', 'terrain', 'valley',
    ],
    startMarker: 'NATURAL ENVIRONMENT:',
    endMarker: 'CITY TOWN PLANNING:',
  },
  {
    name: 'city',
    keywords: [
      'city', 'town', 'road', 'street', 'intersection', 'traffic',
      'sidewalk', 'crosswalk', 'highway', 'lane', 'block', 'urban',
      'suburban', 'zoning', 'downtown', 'neighborhood', 'alley',
      'parking lot', 'bus stop', 'fire hydrant', 'utility pole',
      'street lamp', 'manhole', 'roundabout', 'cul-de-sac',
    ],
    startMarker: 'CITY TOWN PLANNING:',
    endMarker: 'INTERIOR DECORATION:',
  },
  {
    name: 'interior',
    keywords: [
      'interior', 'furniture', 'living room', 'kitchen', 'bathroom',
      'bedroom', 'couch', 'sofa', 'bed', 'table', 'chair', 'desk',
      'shelf', 'bookshelf', 'lamp', 'rug', 'curtain', 'mirror',
      'toilet', 'sink', 'shower', 'bathtub', 'fridge', 'refrigerator',
      'stove', 'oven', 'cabinet', 'dresser', 'wardrobe', 'closet',
      'indoor', 'furnish', 'room', 'house interior',
    ],
    startMarker: 'INTERIOR DECORATION:',
    endMarker: 'EXTERIOR DETAILING:',
  },
  {
    name: 'exterior',
    keywords: [
      'exterior', 'garden', 'fence', 'mailbox', 'street lamp', 'bench',
      'trash can', 'dumpster', 'patio', 'driveway', 'garage', 'chimney',
      'gutter', 'porch', 'yard', 'lawn', 'hedge', 'bush', 'flower bed',
      'planter', 'birdbath', 'grill', 'bbq', 'outdoor', 'curb',
    ],
    startMarker: 'EXTERIOR DETAILING:',
    endMarker: 'BRIDGES AND STRUCTURES:',
  },
  {
    name: 'bridges',
    keywords: [
      'bridge', 'arch', 'suspension', 'overpass', 'pier', 'dock',
      'trestle', 'aqueduct', 'covered bridge', 'drawbridge',
      'footbridge', 'walkway', 'span', 'crossing',
    ],
    startMarker: 'BRIDGES AND STRUCTURES:',
    endMarker: 'VEHICLES:',
  },
  {
    name: 'vehicles',
    keywords: [
      'car', 'truck', 'bus', 'boat', 'ship', 'plane', 'airplane',
      'helicopter', 'motorcycle', 'bike', 'bicycle', 'train',
      'vehicle', 'wheel', 'chassis', 'engine', 'drive', 'racing',
      'speedboat', 'sailboat', 'forklift',
    ],
    startMarker: 'VEHICLES:',
    endMarker: 'SHOPS AND COMMERCIAL:',
  },
  {
    name: 'shops',
    keywords: [
      'shop', 'store', 'storefront', 'retail', 'restaurant', 'cafe',
      'coffee', 'bakery', 'grocery', 'pizza', 'bar', 'counter',
      'awning', 'display window', 'shelving', 'commercial',
      'neon sign', 'menu', 'food', 'market',
    ],
    startMarker: 'SHOPS AND COMMERCIAL:',
    endMarker: 'PARKS AND RECREATION:',
  },
  {
    name: 'parks',
    keywords: [
      'park', 'playground', 'swing', 'slide', 'fountain', 'pool',
      'swimming', 'basketball', 'tennis', 'soccer', 'football',
      'sports', 'field', 'court', 'picnic', 'gazebo', 'statue',
      'monument', 'recreation', 'jogging', 'dog park',
    ],
    startMarker: 'PARKS AND RECREATION:',
    endMarker: 'INDUSTRIAL BUILDINGS:',
  },
  {
    name: 'industrial',
    keywords: [
      'factory', 'warehouse', 'industrial', 'crane', 'conveyor',
      'smokestack', 'silo', 'loading dock', 'forklift', 'pipe',
      'shipping container', 'storage tank', 'substation', 'guard booth',
      'manufacturing', 'workshop', 'power plant',
    ],
    startMarker: 'INDUSTRIAL BUILDINGS:',
    endMarker: 'HORROR ATMOSPHERIC:',
  },
  {
    name: 'horror',
    keywords: [
      'horror', 'scary', 'spooky', 'haunted', 'abandoned', 'creepy',
      'dark', 'asylum', 'cemetery', 'graveyard', 'blood', 'cobweb',
      'broken', 'decay', 'rust', 'fog', 'eerie', 'sinister',
      'ghost', 'zombie', 'nightmare', 'basement', 'dungeon',
    ],
    startMarker: 'HORROR ATMOSPHERIC:',
    endMarker: 'FANTASY BUILDS:',
  },
  {
    name: 'fantasy',
    keywords: [
      'fantasy', 'magic', 'magical', 'enchanted', 'fairy', 'wizard',
      'crystal', 'floating island', 'portal', 'dragon', 'elf',
      'dwarf', 'potion', 'mushroom', 'treehouse', 'tower',
      'kingdom', 'enchant', 'mystical', 'mythical', 'spell',
      'bioluminescent', 'glowing', 'rune',
    ],
    startMarker: 'FANTASY BUILDS:',
    endMarker: 'EXPANDED COMMON MISTAKES (TOP 30):',
  },
  {
    name: 'expandedMistakes',
    keywords: [
      'mistake', 'avoid', 'wrong', 'bad', 'dont', "don't", 'never',
      'problem', 'issue', 'fix', 'ugly', 'broken', 'common error',
      'beginner', 'newbie', 'amateur', 'improve', 'better',
    ],
    startMarker: 'EXPANDED COMMON MISTAKES (TOP 30):',
    endMarker: 'OPTIMIZATION TECHNIQUES:',
  },
  {
    name: 'optimizationTechniques',
    keywords: [
      'optimize', 'optimization', 'streaming enabled', 'part count',
      'meshpart', 'performance', 'lag', 'fps', 'render fidelity',
      'collision fidelity', 'instancing', 'draw call', 'lod',
      'level of detail', 'batch', 'memory', 'mobile',
    ],
    startMarker: 'OPTIMIZATION TECHNIQUES:',
    endMarker: 'ROOFING TECHNIQUES:',
  },
  {
    name: 'roofing',
    keywords: [
      'roof', 'gable', 'hip roof', 'mansard', 'gambrel', 'shed roof',
      'dormer', 'eave', 'overhang', 'chimney', 'skylight', 'gutter',
      'shingle', 'pitch', 'ridge', 'attic',
    ],
    startMarker: 'ROOFING TECHNIQUES:',
    endMarker: 'ASIAN ARCHITECTURE:',
  },
  {
    name: 'asian',
    keywords: [
      'asian', 'japanese', 'chinese', 'pagoda', 'torii', 'temple',
      'zen', 'bamboo', 'tatami', 'shoji', 'garden', 'lantern',
      'oriental', 'east asian', 'samurai', 'ninja', 'dojo',
      'cherry blossom', 'sakura', 'shrine',
    ],
    startMarker: 'ASIAN ARCHITECTURE:',
    endMarker: 'PIRATE AND NAUTICAL:',
  },
  {
    name: 'pirate',
    keywords: [
      'pirate', 'ship', 'nautical', 'sail', 'mast', 'cannon',
      'treasure', 'dock', 'wharf', 'lighthouse', 'harbor', 'port',
      'anchor', 'barrel', 'rum', 'island', 'plank', 'hull',
      'jolly roger', 'crew', 'captain',
    ],
    startMarker: 'PIRATE AND NAUTICAL:',
    endMarker: 'WESTERN FRONTIER:',
  },
  {
    name: 'western',
    keywords: [
      'western', 'cowboy', 'saloon', 'sheriff', 'frontier', 'desert',
      'mine', 'ranch', 'windmill', 'cactus', 'tumbleweed', 'wagon',
      'wild west', 'gold rush', 'outlaw', 'horse', 'stable',
    ],
    startMarker: 'WESTERN FRONTIER:',
    endMarker: 'SPORTS ARENA AND STADIUM:',
  },
  {
    name: 'sports',
    keywords: [
      'stadium', 'arena', 'sports', 'basketball', 'soccer', 'football',
      'baseball', 'tennis', 'track', 'field', 'scoreboard', 'bleacher',
      'seating', 'floodlight', 'goal', 'hoop', 'court',
      'locker room', 'concession',
    ],
    startMarker: 'SPORTS ARENA AND STADIUM:',
    endMarker: 'RELIGIOUS AND CEREMONIAL:',
  },
  {
    name: 'religious',
    keywords: [
      'church', 'temple', 'mosque', 'cathedral', 'chapel', 'steeple',
      'bell tower', 'stained glass', 'pew', 'altar', 'pulpit',
      'graveyard', 'cemetery', 'pyramid', 'memorial', 'amphitheater',
      'religious', 'sacred', 'worship',
    ],
    startMarker: 'RELIGIOUS AND CEREMONIAL:',
    endMarker: 'AMUSEMENT PARK:',
  },
  {
    name: 'amusement',
    keywords: [
      'amusement', 'theme park', 'roller coaster', 'ferris wheel',
      'carousel', 'bumper car', 'ride', 'carnival', 'circus',
      'cotton candy', 'ticket', 'funfair', 'water slide',
      'attraction', 'queue',
    ],
    startMarker: 'AMUSEMENT PARK:',
    endMarker: 'TEXTURE AND SURFACE DETAIL:',
  },
  {
    name: 'texture',
    keywords: [
      'texture', 'surface', 'pattern', 'panel', 'siding', 'wainscoting',
      'molding', 'baseboard', 'herringbone', 'checkerboard', 'tile',
      'brick pattern', 'corrugated', 'mosaic', 'weathering', 'graffiti',
      'detail', 'trim', 'floor pattern',
    ],
    startMarker: 'TEXTURE AND SURFACE DETAIL:',
    endMarker: 'TROPICAL RESORT:',
  },
  {
    name: 'tropical',
    keywords: [
      'tropical', 'resort', 'beach', 'tiki', 'pool', 'cabana',
      'hammock', 'palm', 'bungalow', 'vacation', 'island', 'paradise',
      'waterslide', 'surf', 'thatched', 'bamboo', 'luau', 'hawaii',
    ],
    startMarker: 'TROPICAL RESORT:',
    endMarker: 'POST-APOCALYPTIC:',
  },
  {
    name: 'postapocalyptic',
    keywords: [
      'apocalypse', 'post-apocalyptic', 'apocalyptic', 'ruins', 'ruined',
      'destroyed', 'wasteland', 'survival', 'zombie', 'fallout',
      'collapsed', 'abandoned', 'scavenge', 'barricade', 'shelter',
      'overgrown', 'nuclear', 'radiation', 'dystopia', 'bunker',
    ],
    startMarker: 'POST-APOCALYPTIC:',
    endMarker: 'MUSEUM AND GALLERY:',
  },
  {
    name: 'museum',
    keywords: [
      'museum', 'gallery', 'art', 'exhibit', 'display', 'sculpture',
      'painting', 'artifact', 'dinosaur', 'history', 'science center',
      'aquarium', 'planetarium', 'showcase',
    ],
    startMarker: 'MUSEUM AND GALLERY:',
    endMarker: 'CONSTRUCTION SITE:',
  },
  {
    name: 'construction',
    keywords: [
      'construction', 'scaffold', 'scaffolding', 'excavator', 'bulldozer',
      'crane', 'concrete mixer', 'hard hat', 'safety cone', 'building site',
      'work zone', 'porta potty', 'construction site', 'rebar',
    ],
    startMarker: 'CONSTRUCTION SITE:',
    endMarker: 'AIRPORT:',
  },
  {
    name: 'airport',
    keywords: [
      'airport', 'terminal', 'runway', 'airplane', 'plane', 'jet',
      'gate', 'baggage', 'flight', 'hangar', 'control tower',
      'check-in', 'security', 'boarding', 'tarmac', 'aviation',
    ],
    startMarker: 'AIRPORT:',
    endMarker: 'HOSPITAL:',
  },
  {
    name: 'hospital',
    keywords: [
      'hospital', 'medical', 'doctor', 'nurse', 'patient', 'emergency',
      'ambulance', 'surgery', 'operating room', 'pharmacy', 'clinic',
      'wheelchair', 'stretcher', 'iv', 'bed', 'health',
    ],
    startMarker: 'HOSPITAL:',
    endMarker: 'PRISON:',
  },
  {
    name: 'prison',
    keywords: [
      'prison', 'jail', 'cell', 'inmate', 'guard', 'warden',
      'barbed wire', 'bars', 'solitary', 'exercise yard', 'lockdown',
      'correctional', 'detention', 'penitentiary',
    ],
    startMarker: 'PRISON:',
    endMarker: 'FARM AND RURAL:',
  },
  {
    name: 'farm',
    keywords: [
      'farm', 'barn', 'rural', 'tractor', 'hay', 'silo',
      'chicken', 'coop', 'crop', 'field', 'harvest', 'scarecrow',
      'farmhouse', 'pasture', 'livestock', 'cattle', 'ranch',
      'country', 'windmill', 'agriculture',
    ],
    startMarker: 'FARM AND RURAL:',
    endMarker: 'UNDERGROUND AND SEWER:',
  },
  {
    name: 'underground',
    keywords: [
      'underground', 'sewer', 'tunnel', 'subway', 'metro', 'mine',
      'catacomb', 'secret passage', 'bunker', 'basement', 'cavern',
      'drain', 'pipe', 'manhole', 'shaft', 'below ground',
    ],
    startMarker: 'UNDERGROUND AND SEWER:',
    endMarker: 'QUICK REFERENCE - PART SIZES FOR COMMON OBJECTS:',
  },
  {
    name: 'quickReference',
    keywords: [
      'size', 'dimension', 'how big', 'how tall', 'measurement',
      'reference', 'street lamp', 'fire hydrant', 'bench', 'sign',
      'vending machine', 'dumpster', 'barrier', 'ladder', 'pipe',
      'quick', 'common objects', 'prop size',
    ],
    startMarker: 'QUICK REFERENCE - PART SIZES FOR COMMON OBJECTS:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the sections of building knowledge relevant to the user's prompt.
 * This prevents overwhelming the AI with the full knowledge base on every request.
 *
 * - Matches keywords from each section against the lowercased prompt
 * - Always includes 'mistakes' and 'scale' sections (universally useful)
 * - Returns max 4 sections to keep context manageable
 */
export function getRelevantBuildingKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  // Score each section by keyword matches
  const scored = SECTIONS.map((section) => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1 // Multi-word matches are stronger signals
      }
    }
    // Always-relevant sections get a baseline boost
    if (section.name === 'mistakes') score += 0.5
    if (section.name === 'scale') score += 0.5
    return { section, score }
  })

  // Sort by score descending, take top sections
  scored.sort((a, b) => b.score - a.score)

  // Take sections with score > 0, max 5
  const selected = scored.filter((s) => s.score > 0).slice(0, 5)

  // If nothing matched, return scale + mistakes + performance as safe defaults
  if (selected.length === 0) {
    const defaults = ['scale', 'mistakes', 'performance']
    const fallback = scored.filter((s) => defaults.includes(s.section.name))
    return extractSections(fallback.map((s) => s.section))
  }

  return extractSections(selected.map((s) => s.section))
}

function extractSections(sections: KnowledgeSection[]): string {
  const fullText = DEVFORUM_BUILDING_KNOWLEDGE
  const parts: string[] = [
    '=== BUILDING KNOWLEDGE (matched to your request) ===\n',
  ]

  for (const section of sections) {
    const startIdx = fullText.indexOf(section.startMarker)
    if (startIdx === -1) continue

    let endIdx: number
    if (section.endMarker === '(END)') {
      endIdx = fullText.length
    } else {
      endIdx = fullText.indexOf(section.endMarker, startIdx)
      if (endIdx === -1) endIdx = fullText.length
    }

    parts.push(fullText.slice(startIdx, endIdx).trim())
    parts.push('') // blank line separator
  }

  return parts.join('\n')
}
