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
 * - medium.com/@280134408zaro/hidden-architecture-behind-large-scale-roblox-worlds
 * - And 20+ additional threads
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
      'prop', 'furniture', 'decoration', 'decor', 'interior', 'detail',
      'table', 'chair', 'desk', 'shelf', 'crate', 'barrel', 'sign',
      'poster', 'vent', 'pipe', 'wire', 'lamp', 'plant', 'book',
      'kitchen', 'bathroom', 'bedroom', 'living room', 'office',
      'house', 'room', 'indoor', 'furnish',
    ],
    startMarker: 'PROP BUILDING:',
    endMarker: 'COLOR & AESTHETICS:',
  },
  {
    name: 'color',
    keywords: [
      'color', 'colour', 'palette', 'aesthetic', 'scheme', 'theme',
      'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink',
      'warm', 'cool', 'vibrant', 'pastel', 'dark', 'bright', 'mood',
      'atmosphere', 'tone', 'contrast', 'saturation', 'hue',
    ],
    startMarker: 'COLOR & AESTHETICS:',
    endMarker: 'WATER & NATURE:',
  },
  {
    name: 'water',
    keywords: [
      'water', 'ocean', 'river', 'lake', 'waterfall', 'pond', 'stream',
      'wave', 'swim', 'boat', 'beach', 'shore', 'reef', 'underwater',
      'fountain', 'rain', 'flood', 'dam',
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
    endMarker: '(END)', // special sentinel — we go to end of string
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

  // Take sections with score > 0, max 4
  const selected = scored.filter((s) => s.score > 0).slice(0, 4)

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
