/**
 * build-enhancer.ts
 * Post-build enhancement engine for ForjeGames.
 * After every AI build, surfaces 5-8 specific one-click polish actions.
 * No external deps. No AI calls. Pure in-process, < 1 ms.
 *
 * Three public exports:
 *   getBuildEnhancements      — full ranked list for a build (5-8 items)
 *   getContextualEnhancements — smart subset matched to build type
 *   getQuickPolish            — top 3 highest-impact enhancements only
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type EnhancementCategory =
  | 'detail'
  | 'lighting'
  | 'vegetation'
  | 'weathering'
  | 'animation'
  | 'audio'
  | 'performance'
  | 'polish'

export type ImpactLevel = 'high' | 'medium' | 'low'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Enhancement {
  id: string
  icon: string
  title: string
  description: string
  /** The exact prompt to send to the AI to apply this enhancement in one click. */
  prompt: string
  category: EnhancementCategory
  impact: ImpactLevel
  difficulty: DifficultyLevel
}

// ─── Internal catalog entry ───────────────────────────────────────────────────

interface CatalogEntry extends Enhancement {
  /**
   * Tags used for contextual matching.
   * If the intent or description contains any tag, this entry scores higher.
   */
  tags: string[]
  /** Base relevance score used for ranking within the catalog. */
  baseScore: number
}

// ─── Enhancement catalog (80+ entries) ───────────────────────────────────────

const CATALOG: CatalogEntry[] = [

  // ── BUILDINGS (20) ──────────────────────────────────────────────────────────

  {
    id: 'building-window-depth',
    icon: '🪟',
    title: 'Add window depth',
    description: 'Recess windows 0.5 studs with frames — the single fastest way to kill the "flat box" look.',
    prompt: 'For every window on the building, recess the window glass 0.5 studs into the wall and add a thin Part frame (0.1 studs thick, matching wall color + 1 tone darker) around each opening. Parent all window frames to the building model.',
    category: 'detail',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'house', 'castle', 'shop', 'tower', 'structure', 'wall', 'window'],
    baseScore: 9,
  },
  {
    id: 'building-floor-ledges',
    icon: '🏗️',
    title: 'Add floor ledges',
    description: 'Horizontal trim band between each floor breaks up monotonous wall surfaces.',
    prompt: 'Add a horizontal ledge trim (0.5 studs tall, 0.3 studs proud of the wall) running the full perimeter of the building at each floor boundary. Use a color 2 shades darker than the main wall.',
    category: 'detail',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'house', 'castle', 'tower', 'apartment', 'office'],
    baseScore: 8,
  },
  {
    id: 'building-roof-overhang',
    icon: '🏠',
    title: 'Add roof overhang',
    description: 'Extend the roof 1 stud past the walls with a fascia board — makes the building look grounded.',
    prompt: 'Extend the existing roof geometry 1 stud outward on all sides to create an overhang. Add a thin fascia Part (0.4 studs tall, matching roof color) along the perimeter underside of the overhang.',
    category: 'detail',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'house', 'cabin', 'shop', 'roof'],
    baseScore: 8,
  },
  {
    id: 'building-foundation-base',
    icon: '🧱',
    title: 'Add foundation base',
    description: 'A raised stone base under the building visually roots it to the ground.',
    prompt: 'Add a foundation base Part that extends 0.5 studs outward from all wall edges and 1.5 studs downward into the terrain. Set Material to SmoothPlastic, Color to a dark grey (RGB 80,80,80). Add a subtle ledge cap on top.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'house', 'castle', 'tower', 'structure'],
    baseScore: 7,
  },
  {
    id: 'building-door-frames',
    icon: '🚪',
    title: 'Add door frames',
    description: 'Recessed doorways with header beams add immediate architectural believability.',
    prompt: 'For each door opening: recess the door 0.4 studs into the wall, add a header beam Part (same width as door + 0.4 studs, 0.5 studs tall, 0.3 studs proud) above the opening, and add side jamb Parts along both vertical edges. Use a color 2 shades darker than the wall.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'house', 'castle', 'dungeon', 'door'],
    baseScore: 7,
  },
  {
    id: 'building-corner-quoins',
    icon: '🏛️',
    title: 'Add corner quoins',
    description: 'Alternating stone blocks on corners is the classic mark of a well-detailed building.',
    prompt: 'Add corner quoins along all vertical building corners: alternating large/small stone Part blocks (Material: SmoothPlastic, alternating sizes 1.5×1 and 1×1.5 studs) that protrude 0.25 studs from the wall face, stacked the full height of the building. Use a slightly lighter color than the main wall.',
    category: 'detail',
    impact: 'high',
    difficulty: 'medium',
    tags: ['building', 'castle', 'tower', 'manor', 'stone', 'medieval'],
    baseScore: 9,
  },
  {
    id: 'building-wall-weathering',
    icon: '🎨',
    title: 'Add wall weathering',
    description: 'A color gradient (darker at the base) makes buildings feel aged and real.',
    prompt: 'Split the wall Parts into three vertical zones: bottom third (darken color by 15%, add slight brown tint), middle third (original color), top third (lighten by 5%). If walls are single Parts, union-split them into thirds first. Apply Texture property "Grime" or equivalent on the bottom zone.',
    category: 'weathering',
    impact: 'high',
    difficulty: 'medium',
    tags: ['building', 'castle', 'ruin', 'old', 'weathered', 'aged'],
    baseScore: 8,
  },
  {
    id: 'building-chimney',
    icon: '🏚️',
    title: 'Add chimney',
    description: 'An offset chimney with a cap immediately reads as a lived-in building.',
    prompt: 'Add a chimney: a tall Part (2×2 studs base, 6 studs tall) offset toward one corner of the roof, matching wall material. Add a chimney cap (slightly wider flat Part on top, 0.3 studs overhang). Add a ParticleEmitter inside the chimney top emitting grey smoke particles with LightEmission 0.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'house', 'cabin', 'cottage', 'chimney', 'smoke'],
    baseScore: 6,
  },
  {
    id: 'building-balconies',
    icon: '🏢',
    title: 'Add balconies',
    description: 'Railed balconies on upper floors create visual interest and break up flat facades.',
    prompt: 'Add balconies to upper-floor windows: a floor slab (0.3 studs thick, 3 studs deep, full window width + 0.5 studs each side), a railing along the front (thin vertical balusters every 0.75 studs, a top rail Part), and a bottom-of-slab bracket on each side. Use SmoothPlastic matching the wall trim color.',
    category: 'detail',
    impact: 'high',
    difficulty: 'medium',
    tags: ['building', 'apartment', 'tower', 'shop', 'balcony'],
    baseScore: 8,
  },
  {
    id: 'building-window-shutters',
    icon: '🪟',
    title: 'Add window shutters',
    description: 'Flanking shutters on windows double the visual mass without complex geometry.',
    prompt: 'For each window, add two shutter Parts flanking the window (each half the window width, full window height, 0.15 studs thick, flush with the wall face). Set them slightly open (rotate 20 degrees outward). Use a darker complementary color to the wall.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'house', 'cottage', 'shop', 'window'],
    baseScore: 6,
  },
  {
    id: 'building-entrance-awning',
    icon: '⛱️',
    title: 'Add entrance awning',
    description: 'A fabric or metal awning over the entrance gives the building an identity.',
    prompt: 'Add an awning above the main entrance: a slightly angled wedge Part (3 studs wide, 2 studs deep, 0.2 studs thick, angled 15 degrees downward) with Texture material set to Fabric or SmoothPlastic in a complementary accent color. Add thin support arm Parts below each outer corner.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'shop', 'restaurant', 'cafe', 'storefront'],
    baseScore: 6,
  },
  {
    id: 'building-rooftop-ac',
    icon: '❄️',
    title: 'Add AC units on roof',
    description: 'Rooftop HVAC boxes are the fastest way to make a modern building feel real.',
    prompt: 'Add 2-4 AC/HVAC units on the rooftop: grey SmoothPlastic box Parts (2×2×1.5 studs each), offset from the roof edge, with small fan-grill decal on one face and a small exhaust pipe Part. Group them naturally, slightly varied orientations.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'apartment', 'office', 'urban', 'modern', 'city'],
    baseScore: 5,
  },
  {
    id: 'building-signage',
    icon: '🪧',
    title: 'Add signage',
    description: 'A SurfaceGui shop sign makes it immediately clear what this building is.',
    prompt: 'Add a sign above the main entrance: a flat Part (4 studs wide, 1.5 studs tall, 0.2 studs deep) with a SurfaceGui containing a bold TextLabel (shop/building name, FontFace: GothamBold, white text on dark background). Add a thin frame Part around the sign in a complementary accent color.',
    category: 'polish',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'shop', 'store', 'cafe', 'restaurant', 'bar', 'sign'],
    baseScore: 8,
  },
  {
    id: 'building-gutters',
    icon: '🌧️',
    title: 'Add gutters',
    description: 'Thin gutter Parts along the roofline add the micro-detail that separates good from great.',
    prompt: 'Add gutter Parts along all roof edges: thin half-pipe-shaped Parts (0.3 studs wide, 0.3 studs tall, matching roof color, darker by 10%) running the full length of each roof edge. Add a small downspout (0.2×0.2 stud vertical tube) at each corner running down the wall.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['building', 'house', 'cabin', 'cottage'],
    baseScore: 4,
  },
  {
    id: 'building-window-planters',
    icon: '🌸',
    title: 'Add window planters',
    description: 'Flower boxes under windows inject life and color without complex foliage.',
    prompt: 'Add a window box planter below each ground-floor window: a shallow box Part (window width, 0.5 studs tall, 0.5 studs deep) in a terracotta or dark wood color. Add small MeshPart flowers or grass tufts inside each box. Anchor to the wall face just below the window sill.',
    category: 'vegetation',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['building', 'house', 'shop', 'cottage', 'flower', 'planter'],
    baseScore: 6,
  },
  {
    id: 'building-interior-lights',
    icon: '💡',
    title: 'Add interior lights',
    description: 'PointLights inside each room give warmth and the impression of habitation.',
    prompt: 'Add a PointLight inside each room/area of the building: attach a PointLight to a small ceiling-anchor Part at the center of each room. Set Brightness 2, Range 15, Color RGB(255, 220, 180) for warm light. Parent to the room group.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'house', 'dungeon', 'castle', 'interior', 'room'],
    baseScore: 8,
  },
  {
    id: 'building-night-glow',
    icon: '🌃',
    title: 'Add night window glow',
    description: 'Warm light bleeding from windows at night is the signature of a great night scene.',
    prompt: 'For each window glass Part, add a PointLight child with Brightness 1.5, Range 8, Color RGB(255, 200, 120). Also set the window Part Material to Neon with Color RGB(255, 220, 160) at low transparency (0.6) to simulate interior warmth from outside.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['building', 'house', 'castle', 'shop', 'night', 'glow', 'window'],
    baseScore: 9,
  },
  {
    id: 'building-brick-variation',
    icon: '🧱',
    title: 'Add brick color variation',
    description: 'Mixing 2-3 slightly different brick tones breaks the tiled-texture monotony.',
    prompt: 'For every wall Part with Material set to Brick or SmoothPlastic representing brickwork: randomly assign one of three subtle color variations (base color ± 5-8 RGB units per channel). Use a script that iterates wall Parts and assigns color from a small palette array. Preserve the original dominant color as 70% of Parts.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['building', 'castle', 'house', 'brick', 'wall'],
    baseScore: 7,
  },
  {
    id: 'building-glass-reflections',
    icon: '✨',
    title: 'Add glass reflections',
    description: 'SurfaceAppearance with a metalness map on windows creates convincing glass.',
    prompt: 'For all window glass Parts: set Material to Glass, Transparency 0.3, Reflectance 0.6. Add a SurfaceAppearance child with MetalnessMap set to a white gradient texture and RoughnessMap to near-zero. Ensure CastShadow is false on each glass Part.',
    category: 'polish',
    impact: 'high',
    difficulty: 'medium',
    tags: ['building', 'tower', 'office', 'glass', 'window', 'modern'],
    baseScore: 8,
  },
  {
    id: 'building-fire-escape',
    icon: '🔥',
    title: 'Add fire escape',
    description: 'A metal ladder and platform on the side sells the urban building fantasy instantly.',
    prompt: 'Add a fire escape on one side of the building: a zigzag metal ladder using thin dark-grey SmoothPlastic Parts, with a small landing platform (grated texture via SurfaceAppearance) at each floor level. Add handrail Parts along each landing edge. Offset 0.1 studs from the wall face.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['building', 'apartment', 'urban', 'city', 'fire escape'],
    baseScore: 6,
  },

  // ── TERRAIN / NATURE (15) ────────────────────────────────────────────────────

  {
    id: 'terrain-ground-vegetation',
    icon: '🌿',
    title: 'Add ground vegetation',
    description: 'Scattered grass tufts and small plants break up flat ground surfaces.',
    prompt: 'Scatter small vegetation props across the terrain ground: use 3-4 varieties of small grass tufts and low plants (MeshParts or Unions, 0.5-1.5 studs tall). Distribute randomly with 1-3 stud spacing, varying scale by ±20%. Cluster more densely near trees and water edges.',
    category: 'vegetation',
    impact: 'high',
    difficulty: 'easy',
    tags: ['terrain', 'nature', 'forest', 'grass', 'outdoor', 'environment', 'park'],
    baseScore: 9,
  },
  {
    id: 'terrain-fallen-leaves',
    icon: '🍂',
    title: 'Add fallen leaves',
    description: 'Scattered autumn leaves on the ground immediately establish season and atmosphere.',
    prompt: 'Create fallen leaf decals: thin flat Parts (0.05 studs thick, 0.3-0.6 studs wide, irregular polygon shapes via Union) in autumn colors (orange RGB(210,100,30), red RGB(160,50,40), yellow RGB(220,170,30)). Scatter 50-100 of them within 3 studs of tree bases, lying flat on the terrain. Vary rotation on Y-axis randomly.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['terrain', 'forest', 'autumn', 'leaves', 'nature', 'fall'],
    baseScore: 7,
  },
  {
    id: 'terrain-rocks-boulders',
    icon: '🪨',
    title: 'Add rocks and boulders',
    description: 'Natural rock formations anchor the scene and give players navigation landmarks.',
    prompt: 'Add rock formations across the terrain: use 3 sizes of irregular boulder MeshParts (small 1-2 studs, medium 3-5 studs, large 8-12 studs). Apply SmoothPlastic material with grey/brown color variation. Group rocks in natural clusters of 2-5, partially embedded in terrain. Add moss-colored (RGB 60,100,50) highlight areas on shaded faces.',
    category: 'detail',
    impact: 'high',
    difficulty: 'easy',
    tags: ['terrain', 'nature', 'forest', 'mountain', 'outdoor', 'rock', 'stone'],
    baseScore: 8,
  },
  {
    id: 'terrain-mushrooms',
    icon: '🍄',
    title: 'Add mushrooms',
    description: 'Small prop mushrooms near trees and logs make the scene feel like a real forest floor.',
    prompt: 'Place 15-25 mushroom props near tree bases and fallen logs: use small MeshPart mushrooms in groups of 1-3, varying between red-capped (RGB 200,60,40) and brown-capped (RGB 120,70,30) varieties. Scale between 0.5-1.2 studs tall. Cluster within 1-2 studs of tree roots.',
    category: 'vegetation',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['terrain', 'forest', 'nature', 'mushroom', 'enchanted'],
    baseScore: 6,
  },
  {
    id: 'terrain-wildflowers',
    icon: '🌼',
    title: 'Add wildflowers',
    description: 'Colorful small flowers in grass patches inject life and color contrast.',
    prompt: 'Scatter wildflower props across grassy terrain: use small MeshPart or billboard flowers (dandelions RGB(230,200,0), white daisies, blue cornflowers RGB(80,100,200)). Cluster in patches of 5-10 flowers, spaced 0.5-1 stud apart within each cluster. Place 8-12 clusters across the scene.',
    category: 'vegetation',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['terrain', 'grass', 'meadow', 'forest', 'spring', 'flower'],
    baseScore: 6,
  },
  {
    id: 'terrain-tree-roots',
    icon: '🌳',
    title: 'Add visible tree roots',
    description: 'Surface roots radiating from tree bases make trees look truly rooted in the world.',
    prompt: 'For each large tree, add 4-6 root Parts radiating outward from the base: thin, curved Parts (using CylinderMesh or wedge Unions) that start at ground level at the trunk and curve downward into the terrain at a distance of 2-3 studs. Match the bark color/material of the tree trunk.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['terrain', 'forest', 'tree', 'nature', 'root'],
    baseScore: 7,
  },
  {
    id: 'terrain-moss-on-rocks',
    icon: '🌱',
    title: 'Add moss on rocks',
    description: 'Green-tinted SurfaceAppearance on rock faces sells wetness and age.',
    prompt: 'For all boulder and rock Parts in the scene: add a secondary overlapping thin Part on the top and north-facing sides of each rock, with Material Grass, Color RGB(55,90,45), Transparency 0.1. These moss layer Parts should closely conform to the rock shape, scaled 0.05 studs larger than the underlying rock face.',
    category: 'weathering',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['terrain', 'forest', 'rock', 'nature', 'moss', 'wet', 'cave'],
    baseScore: 7,
  },
  {
    id: 'terrain-puddles',
    icon: '💧',
    title: 'Add puddles',
    description: 'Transparent blue flat parts in depressions create instant wet-weather atmosphere.',
    prompt: 'Add 5-10 puddle Parts in terrain depressions and near building bases: flat circular/irregular Parts (0.05 studs thick, 1-4 studs diameter), Material Glass, Color RGB(150,170,200), Transparency 0.4, Reflectance 0.8. Slightly sink them into the terrain surface (-0.02 studs). Add a subtle PointLight child with Brightness 0.3 for reflective shimmer.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['terrain', 'rain', 'urban', 'street', 'outdoor', 'puddle', 'wet'],
    baseScore: 6,
  },
  {
    id: 'terrain-path-edges',
    icon: '🛤️',
    title: 'Add path edge transitions',
    description: 'Grass-to-dirt transitions at path borders eliminate the hard-edge artifact.',
    prompt: 'Along both edges of all paths: add a 0.5-stud-wide transition strip using terrain modification — blend the path material (Pavement/Ground) into Grass using gradual Terrain:FillBall operations at low density. Add small gravel Parts (0.2 stud spheres, grey, scattered) within 0.3 studs of path edges.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['terrain', 'path', 'road', 'outdoor', 'nature'],
    baseScore: 6,
  },
  {
    id: 'terrain-bird-nests',
    icon: '🪺',
    title: 'Add bird nests',
    description: 'A hidden nest in a large tree rewards observant players and adds micro-storytelling.',
    prompt: 'In the 2-3 largest trees, add a bird nest in a high branch fork: a small bowl-shaped Union Part (1.5 studs wide, 0.5 studs deep) in a dark brown twig color (RGB 80,55,30), with 2-3 small egg Parts (white/speckled, 0.3 stud spheres) inside. Parent the nest to the tree model.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['terrain', 'forest', 'tree', 'nature', 'bird', 'nest'],
    baseScore: 4,
  },
  {
    id: 'terrain-vines-on-walls',
    icon: '🌿',
    title: 'Add vines on walls',
    description: 'Climbing vegetation on walls blends architecture into landscape naturally.',
    prompt: 'Add ivy/vine climbing Parts on walls adjacent to terrain: thin flat Parts (0.08 studs thick) in leaf-green color (RGB 55,110,45), Material Grass, arranged in irregular vertical clusters climbing from ground to mid-wall height. Vary the individual cluster widths (0.5-1.5 studs) and heights. Parent to the building model.',
    category: 'vegetation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['terrain', 'building', 'castle', 'ruin', 'vine', 'ivy', 'nature'],
    baseScore: 8,
  },
  {
    id: 'terrain-hanging-moss',
    icon: '🌾',
    title: 'Add hanging moss',
    description: 'Drooping moss from old tree branches is the visual signature of swamps and ancient forests.',
    prompt: 'On old/large trees: add hanging moss drapes as thin tapered Parts (0.2 studs wide, 1-3 studs long) in pale green color (RGB 100,130,80), hanging from lower branches. Cluster 3-6 strands per major branch, slightly varied lengths and slight outward lean. Use Material Fabric for slight translucency.',
    category: 'vegetation',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['terrain', 'forest', 'swamp', 'ancient', 'moss', 'jungle'],
    baseScore: 6,
  },
  {
    id: 'terrain-butterfly-particles',
    icon: '🦋',
    title: 'Add butterflies',
    description: 'Particle-based butterflies drifting over flowers sell the living-world fantasy.',
    prompt: 'Add butterfly particle effects in flower-heavy areas: attach ParticleEmitters to anchor Parts above flower clusters. Use a butterfly sprite texture, Rate 0.3, Lifetime 8-12 seconds, Speed 1-2, SpreadAngle wide, LightEmission 0.1, Size sequence 0.5-0.8-0.5. Give each emitter a soft loop motion via TweenService on position.',
    category: 'animation',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['terrain', 'nature', 'flower', 'meadow', 'spring', 'butterfly'],
    baseScore: 7,
  },
  {
    id: 'terrain-water-ripples',
    icon: '🌊',
    title: 'Add water ripples',
    description: 'Animated ring particles on water surfaces create the illusion of current.',
    prompt: 'For all water surfaces (rivers, lakes, ponds): add ParticleEmitters anchored at the water surface emitting ring/circle sprites outward. Rate 1, Lifetime 3, Size 0.1 to 2 (expanding), Transparency 0 to 1 (fading), LightEmission 0.1, Rotation 0 to 360. Space multiple emitters 4-8 studs apart across the water area.',
    category: 'animation',
    impact: 'high',
    difficulty: 'easy',
    tags: ['terrain', 'water', 'river', 'lake', 'pond', 'ocean'],
    baseScore: 8,
  },
  {
    id: 'terrain-ground-fog',
    icon: '🌫️',
    title: 'Add low ground fog',
    description: 'A thin fog layer hugging the ground creates instant mystery and depth.',
    prompt: 'Add low ground fog using a ParticleEmitter on a flat anchor Part at ground level: large white/grey billboard particles (Size 8-15), very slow drift (Speed 0.3), long Lifetime 20 seconds, Transparency start 0.85 end 1.0, Rate 2. Position emitters every 15 studs across low-lying terrain areas. Set ZOffset -1 so fog renders behind objects.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'medium',
    tags: ['terrain', 'forest', 'swamp', 'night', 'fog', 'atmosphere', 'mysterious'],
    baseScore: 9,
  },

  // ── STREETS / URBAN (15) ─────────────────────────────────────────────────────

  {
    id: 'urban-curbs',
    icon: '🛣️',
    title: 'Add curbs',
    description: 'Raised curb edges along roads are the cheapest way to elevate urban scene quality.',
    prompt: 'Add curb Parts along all road edges: 0.4 studs tall, 0.5 studs wide, the full length of each road edge. Set Material to SmoothPlastic, Color RGB(180,180,180). Align flush with the road surface top and sidewalk level. Add a 45-degree chamfer on the road-facing upper edge using a thin wedge Part.',
    category: 'detail',
    impact: 'high',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'road', 'curb'],
    baseScore: 8,
  },
  {
    id: 'urban-crosswalks',
    icon: '🦓',
    title: 'Add crosswalks',
    description: 'White stripe crosswalk patterns at intersections complete the urban vocabulary.',
    prompt: 'At each intersection and pedestrian crossing: add a series of flat white Parts (0.05 studs thick, 0.8 studs wide, 2 studs long) spaced 0.4 studs apart across the road width, flush with the road surface. Set Reflectance 0.1. Group each crosswalk set and label it CrosswalkGroup.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'road', 'crosswalk', 'pedestrian'],
    baseScore: 6,
  },
  {
    id: 'urban-manhole-covers',
    icon: '🔘',
    title: 'Add manhole covers',
    description: 'Circular cast-iron manhole details in roads are the micro-detail players remember.',
    prompt: 'Add 3-5 manhole cover decals in road surfaces: flat circular Parts (0.05 studs thick, 1.5 studs diameter), Material SmoothPlastic, Color RGB(80,80,80), with a SurfaceGui or Decal showing a grate pattern. Position flush with or 0.02 studs above the road surface, offset from lane centers.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'road'],
    baseScore: 4,
  },
  {
    id: 'urban-street-lights',
    icon: '🏮',
    title: 'Add street lights',
    description: 'Proper pole + light fixture street lamps transform a grey road into a real street.',
    prompt: 'Add street lights every 12-15 studs along roads: a vertical pole Part (0.4×0.4 studs base, 8 studs tall, dark grey SmoothPlastic), a curved arm Part extending 2 studs horizontally at the top, and a small lantern-head Union at the end. Add a PointLight inside the lantern head: Brightness 3, Range 18, Color RGB(255, 210, 140).',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'road', 'night', 'light', 'lamp'],
    baseScore: 9,
  },
  {
    id: 'urban-benches',
    icon: '🪑',
    title: 'Add street benches',
    description: 'Benches along pathways add human scale and give NPCs a purpose.',
    prompt: 'Add park/street benches along pathways and open areas: two leg-support Parts (dark grey, 0.2 studs thick, L-shaped), a seat slab Part (2 studs long, 0.6 studs wide, 0.15 studs thick, wood-brown SmoothPlastic), and a backrest Part angled 10 degrees rearward. Space benches every 20-30 studs. Add a Seat SeatPart on the bench surface.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'park', 'bench'],
    baseScore: 6,
  },
  {
    id: 'urban-trash-cans',
    icon: '🗑️',
    title: 'Add trash cans',
    description: 'Corner trash cans are the single most recognizable urban micro-prop.',
    prompt: 'Add trash cans at street corners and near building entrances: a cylinder Union (0.8 studs diameter, 1.2 studs tall, dark grey SmoothPlastic), with a lid Part (slightly larger diameter disc, 0.15 studs thick) on top. Add a subtle rim weld detail around the mid-section. Space every 15-20 studs in urban areas.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'alley'],
    baseScore: 4,
  },
  {
    id: 'urban-fire-hydrants',
    icon: '🚒',
    title: 'Add fire hydrants',
    description: 'Bright red hydrants at intersections are an instantly read urban signal.',
    prompt: 'Add fire hydrant props at street intersections and corners: a Union of a base flange, barrel, dome top, and two side nozzle stubs. Color: bright red RGB(200,30,30). Height: 1 stud. Position on the sidewalk 0.2 studs from the curb edge. Add a subtle SurfaceAppearance metalness map for the chrome cap detail.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'fire hydrant'],
    baseScore: 5,
  },
  {
    id: 'urban-bollards',
    icon: '🚧',
    title: 'Add bollards',
    description: 'Pedestrian-area posts define the boundary between foot traffic and vehicles.',
    prompt: 'Add bollard posts along pedestrian zones and plaza edges: short cylinder Parts (0.3 stud diameter, 1.2 studs tall, dark grey or yellow SmoothPlastic). Space them 1.5 studs apart in rows. Add a small domed cap Part on each. Optionally, add a thin chain Part looping between bollards for a roped-off area look.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'plaza', 'pedestrian', 'bollard'],
    baseScore: 4,
  },
  {
    id: 'urban-power-lines',
    icon: '⚡',
    title: 'Add power lines',
    description: 'Cables sagging between poles fill the sky and sell a lived-in urban scene.',
    prompt: 'Add power line cables between existing utility poles: use thin cylinder Parts (0.1 stud diameter) in dark grey, creating a slight sag by using 3 segments at slightly different heights (a shallow catenary approximation). String 2-3 cable lines between each pair of poles. Ensure CastShadow is false to avoid performance cost.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['urban', 'street', 'city', 'power', 'wire', 'cable', 'pole'],
    baseScore: 6,
  },
  {
    id: 'urban-newspaper-boxes',
    icon: '📰',
    title: 'Add newspaper boxes',
    description: 'Old-school street furniture that players immediately recognize as "real city".',
    prompt: 'Add 2-3 newspaper/vending machine boxes near corners and storefronts: box-shaped Parts (0.6×0.5×1 studs), with a SurfaceGui on the front face showing a newspaper headline TextLabel. Use bright accent colors (red, blue, yellow). Add a small coin slot detail Part on one side.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'newspaper', 'vending'],
    baseScore: 4,
  },
  {
    id: 'urban-bike-racks',
    icon: '🚲',
    title: 'Add bike racks',
    description: 'U-shaped bike racks near shops add human-scale detail without any polygon cost.',
    prompt: 'Add bike racks near shop entrances: U-shaped tube Part unions (0.15 stud diameter pipe, 1 stud wide, 1 stud tall) in dark grey SmoothPlastic. Anchor flush with the sidewalk. Optionally, park 1-2 bicycle props leaning against the rack at slight angles.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'shop', 'bike'],
    baseScore: 4,
  },
  {
    id: 'urban-parking-meters',
    icon: '🅿️',
    title: 'Add parking meters',
    description: 'Thin parking meters along parking spots instantly establish the urban context.',
    prompt: 'Add parking meters next to parking spaces: a thin vertical pole Part (0.15 studs, 1.5 studs tall, grey), with a small box head Part (0.3×0.3×0.4 studs) on top in grey/green. Add a SurfaceGui with a simple "P" or time-display TextLabel. Align one meter per parking space.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'parking', 'meter'],
    baseScore: 3,
  },
  {
    id: 'urban-bus-stops',
    icon: '🚌',
    title: 'Add bus stops',
    description: 'A bench + shelter + sign makes a bus stop that players instantly understand.',
    prompt: 'Add a bus stop structure: a back wall Part (4 studs wide, 3 studs tall, 0.2 studs thick, clear glass Transparency 0.5), a roof overhang Part (4.5 studs wide, 0.3 studs thick extending 1.5 studs forward), two vertical support pole Parts, a bench inside, and a BillboardGui sign on a pole reading "BUS STOP" with a route number.',
    category: 'detail',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['urban', 'street', 'city', 'bus', 'transit', 'stop'],
    baseScore: 5,
  },
  {
    id: 'urban-traffic-lights',
    icon: '🚦',
    title: 'Add traffic lights',
    description: 'Functional traffic lights at intersections with color-change scripts sell the city.',
    prompt: 'Add traffic lights at each road intersection: a pole (8 studs tall, grey), a horizontal arm, and a 3-light housing Union (red/yellow/green NeonPart circles). Add a LocalScript that cycles light colors every 8 seconds (green 5s, yellow 1s, red 5s) using TweenService on light Color and Brightness. Parent each signal to a TrafficLights folder.',
    category: 'animation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['urban', 'street', 'city', 'traffic', 'light', 'intersection'],
    baseScore: 9,
  },
  {
    id: 'urban-drain-grates',
    icon: '🔲',
    title: 'Add drain grates',
    description: 'Grated drain covers along curbs are the grounding micro-detail of any street.',
    prompt: 'Add storm drain grates along curbs every 10-15 studs: flat rectangular Parts (0.5×1 stud, 0.05 studs thick) flush with the road/curb, dark grey, with a SurfaceAppearance grate texture or a Decal showing a grill pattern. Place one at each curb low point and near crosswalks.',
    category: 'detail',
    impact: 'low',
    difficulty: 'easy',
    tags: ['urban', 'street', 'city', 'drain', 'grate'],
    baseScore: 3,
  },

  // ── NPCs / CHARACTERS (10) ──────────────────────────────────────────────────

  {
    id: 'npc-idle-animation',
    icon: '🧍',
    title: 'Add idle animation',
    description: 'Breathing and look-around idle animations make NPCs feel alive, not frozen.',
    prompt: 'For each NPC in the scene: add an idle animation using AnimationTrack. Create an Animation instance with AnimationId set to a breathing/idle loop (or generate a subtle BodyGyro-based look-around via script). Play the animation on the NPC\'s Humanoid.Animator at Priority Idle. Use a 0.8-1.2 random playback speed per NPC.',
    category: 'animation',
    impact: 'high',
    difficulty: 'easy',
    tags: ['npc', 'character', 'mob', 'guard', 'villager', 'merchant'],
    baseScore: 9,
  },
  {
    id: 'npc-patrol-route',
    icon: '🔄',
    title: 'Add patrol route',
    description: 'NPCs wandering between waypoints make the world feel inhabited.',
    prompt: 'For each NPC without a patrol: add 3-5 invisible Part waypoints near the NPC\'s starting position. Write a Script that uses PathfindingService to move the NPC between waypoints sequentially, waiting 2-4 seconds at each stop, with a randomized wait variance. Use a walk animation during movement.',
    category: 'animation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['npc', 'character', 'guard', 'enemy', 'patrol'],
    baseScore: 8,
  },
  {
    id: 'npc-dialogue',
    icon: '💬',
    title: 'Add dialogue system',
    description: 'A ProximityPrompt with chat bubbles gives NPCs purpose and world-building.',
    prompt: 'Add a dialogue system to each NPC: attach a ProximityPrompt (ActionText "Talk", MaxActivationDistance 8) to the HumanoidRootPart. Connect Triggered to a LocalScript that displays a BillboardGui chat bubble above the NPC\'s head with 2-3 lines of contextual dialogue. Cycle through lines on repeated triggers.',
    category: 'animation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['npc', 'character', 'villager', 'merchant', 'quest', 'dialogue'],
    baseScore: 9,
  },
  {
    id: 'npc-name-tag',
    icon: '🏷️',
    title: 'Add name tag',
    description: 'A BillboardGui name above the head lets players know who they\'re talking to.',
    prompt: 'For each NPC: add a BillboardGui parented to the Head, Size UDim2(0,140,0,40), StudsOffset Vector3(0,2.5,0). Add a TextLabel child filling the frame with the NPC\'s name in GothamBold font, white text, slight drop shadow, transparent background. Set AlwaysOnTop false.',
    category: 'polish',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['npc', 'character', 'villager', 'merchant', 'boss', 'guard'],
    baseScore: 7,
  },
  {
    id: 'npc-shadow-decal',
    icon: '🌑',
    title: 'Add shadow decal',
    description: 'A soft blob shadow under each NPC grounds them to the surface.',
    prompt: 'Add a flat circular shadow decal under each NPC: a Part (1.8 stud diameter circle, 0.05 studs thick, black Transparency 0.6, CanCollide false, CastShadow false) attached to the HumanoidRootPart via a Weld, offset down to be flush with the ground. Use a Script to keep the shadow flat on the surface via RayCast each frame.',
    category: 'polish',
    impact: 'low',
    difficulty: 'medium',
    tags: ['npc', 'character'],
    baseScore: 4,
  },
  {
    id: 'npc-footstep-sounds',
    icon: '👣',
    title: 'Add footstep sounds',
    description: 'Material-based footstep sounds are the audio detail that players notice subconsciously.',
    prompt: 'Add footstep sounds to each NPC: attach a Script to each NPC that detects the material under their HumanoidRootPart via RayCast each 0.4 seconds while walking, then plays a Sound from a table keyed by material (e.g. Grass → rustling, SmoothPlastic → hard step, Ground → dirt crunch). Randomize pitch ±10% per step.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['npc', 'character', 'audio', 'footstep'],
    baseScore: 7,
  },
  {
    id: 'npc-emotion-system',
    icon: '😊',
    title: 'Add emotion expressions',
    description: 'Facial expression changes on interaction make NPCs feel like real characters.',
    prompt: 'For each NPC with a face Decal: create a simple emotion system using a table of face texture IDs (neutral, happy, surprised, sad). On ProximityPrompt trigger, switch the face Decal.Texture to the "happy" variant for 3 seconds then revert to neutral. Use TweenService to smoothly transition.',
    category: 'animation',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['npc', 'character', 'emotion', 'expression'],
    baseScore: 5,
  },
  {
    id: 'npc-interaction-particles',
    icon: '✨',
    title: 'Add interaction sparkle',
    description: 'A sparkle effect on NPCs shows players they can interact — a key UX signal.',
    prompt: 'Add a proximity sparkle effect to each interactable NPC: attach a ParticleEmitter to the HumanoidRootPart (or a small floating Part above the head) emitting star/sparkle sprites, Rate 1.5, Lifetime 1.5, Speed 1, LightEmission 0.4, Color gold RGB(255,200,50). Disable the emitter when the player is within 4 studs (ProximityPrompt visible).',
    category: 'polish',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['npc', 'character', 'merchant', 'quest giver', 'sparkle'],
    baseScore: 7,
  },
  {
    id: 'npc-schedule',
    icon: '🕐',
    title: 'Add day/night schedule',
    description: 'NPCs going inside at night and appearing in the morning create living-world magic.',
    prompt: 'Add a schedule system to each NPC via a Script that reads game.Lighting.ClockTime. Define: daytime positions/routes (6:00-20:00) and nighttime state (NPC walks to a door anchor, plays a "go inside" animation, then becomes invisible/anchored). Use TweenService to smoothly move to schedule positions.',
    category: 'animation',
    impact: 'high',
    difficulty: 'hard',
    tags: ['npc', 'character', 'schedule', 'day night'],
    baseScore: 8,
  },
  {
    id: 'npc-voice-lines',
    icon: '🔊',
    title: 'Add voice line sounds',
    description: 'Ambient voice line Sounds playing on proximity make NPCs feel fully present.',
    prompt: 'Add ambient voice line sounds to each NPC: attach 2-3 Sound instances to the NPC\'s HumanoidRootPart referencing short ambient audio clips (greetings, ambient muttering). Use a Script with a randomized timer (15-45 seconds) to play a random Sound when a player is within 12 studs. Set RollOffMaxDistance 18, Volume 0.6.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['npc', 'character', 'audio', 'voice'],
    baseScore: 6,
  },

  // ── LIGHTING / ATMOSPHERE (10) ───────────────────────────────────────────────

  {
    id: 'lighting-golden-hour',
    icon: '🌅',
    title: 'Add golden hour lighting',
    description: 'Sunset lighting setup makes any scene look like a professional screenshot.',
    prompt: 'Apply a golden hour lighting setup: set game.Lighting.ClockTime to 17.5. Set Lighting.Ambient RGB(60,40,30), Lighting.OutdoorAmbient RGB(80,60,40), Lighting.Brightness 2.5, Lighting.ColorShift_Bottom RGB(255,140,60), Lighting.ColorShift_Top RGB(255,180,80). Set Atmosphere.Density 0.35, Atmosphere.Haze 0.4, Atmosphere.Color RGB(255,160,80). Add a ColorCorrectionEffect with Saturation 0.2, TintColor RGB(255,220,180).',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'atmosphere', 'sunset', 'golden', 'outdoor'],
    baseScore: 9,
  },
  {
    id: 'lighting-volumetric-fog',
    icon: '🌫️',
    title: 'Add volumetric fog',
    description: 'Atmosphere density settings create the cinematic volumetric fog look.',
    prompt: 'Add volumetric fog via Atmosphere: set Atmosphere.Density 0.5, Atmosphere.Offset 0.1, Atmosphere.Haze 0.6, Atmosphere.Color RGB(180,200,220), Atmosphere.Decay RGB(100,120,140). Set Lighting.FogStart 60, Lighting.FogEnd 300, Lighting.FogColor RGB(180,200,210). Add a DepthOfFieldEffect with InFocusRadius 25, FarIntensity 0.3.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'atmosphere', 'fog', 'forest', 'mysterious', 'horror'],
    baseScore: 8,
  },
  {
    id: 'lighting-sun-rays',
    icon: '☀️',
    title: 'Add god rays',
    description: 'SunRays post-effect with correct settings produces dramatic light shaft visuals.',
    prompt: 'Enable SunRays in Lighting: add a SunRaysEffect child to game.Lighting with Intensity 0.3 and Spread 0.5. Set Lighting.ClockTime to create angled sun. Set Atmosphere.Density 0.3. For forest scenes, add 3-5 SpotLight instances angled down through canopy openings with Brightness 5, Range 20, Angle 25, Color RGB(255,230,180).',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'forest', 'cathedral', 'god rays', 'sun', 'outdoor'],
    baseScore: 9,
  },
  {
    id: 'lighting-rain-effects',
    icon: '🌧️',
    title: 'Add rain effects',
    description: 'Particle rain + wet surface reflectance creates the complete rainy scene.',
    prompt: 'Add rain: create a Part above the map area with a ParticleEmitter (rain drop sprite, Rate 200, Lifetime 1.5, Speed 50 downward, Size 0.05×0.3, LightEmission 0). Add RainSound to workspace. Increase Reflectance by 0.2 on all ground/road Parts. Set Atmosphere.Density 0.5, Atmosphere.Color grey RGB(150,160,170). Optionally add splash ParticleEmitters at ground level.',
    category: 'animation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['lighting', 'rain', 'weather', 'outdoor', 'atmosphere'],
    baseScore: 8,
  },
  {
    id: 'lighting-dynamic-shadows',
    icon: '🌓',
    title: 'Enable dynamic shadows',
    description: 'Switching to ShadowMap technology makes every object cast real-time shadows.',
    prompt: 'Enable high-quality dynamic shadows: set game.Lighting.Technology to Enum.Technology.ShadowMap. Set Lighting.ShadowSoftness 0.25. On all large structural Parts, ensure CastShadow is true. On all small detail Props (nuts, bolts, tiny decals), set CastShadow false to preserve performance. Set Lighting.Brightness 2.0.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'shadow', 'quality', 'performance'],
    baseScore: 8,
  },
  {
    id: 'lighting-neon-signs',
    icon: '🔆',
    title: 'Add neon signs',
    description: 'Glowing neon signs on shop facades are the defining visual of urban night scenes.',
    prompt: 'Add neon signs to shops/buildings: text or logo Parts with Material set to Neon, Color matching the sign\'s theme (e.g., red RGB(255,40,40), blue RGB(40,100,255), pink RGB(255,60,180)). Add a PointLight child to each neon Part: Brightness 2, Range 10, matching Color. Add a SurfaceGui with the business name in a bold font as the sign text.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'urban', 'city', 'night', 'neon', 'shop', 'sign'],
    baseScore: 9,
  },
  {
    id: 'lighting-campfire',
    icon: '🔥',
    title: 'Add campfire light',
    description: 'Flickering orange PointLight on a campfire is the most atmospheric scene anchor.',
    prompt: 'Add a campfire: a small log pile Union (brown SmoothPlastic), a fire ParticleEmitter (orange/yellow sprites, Rate 15, Lifetime 0.8, Size 0.5-0) above it, and a PointLight parented to the fire Part with Brightness 4, Range 20, Color RGB(255,140,40). Add a Script that randomly tweens the PointLight Brightness between 3-5 every 0.1-0.3 seconds to simulate flicker. Add a crackling Sound.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'easy',
    tags: ['lighting', 'campfire', 'forest', 'outdoor', 'night', 'fire'],
    baseScore: 9,
  },
  {
    id: 'lighting-underwater-caustics',
    icon: '🌊',
    title: 'Add underwater caustics',
    description: 'Light pattern decals on the underwater floor sell the submerged scene completely.',
    prompt: 'For underwater scenes: add caustic light pattern decals on the ocean/pool floor using flat Parts with animated Decal textures. Add multiple PointLights at water surface level (Brightness 2, Range 15, Color RGB(120,180,220)) that slowly TweenService-animate position in a circular pattern to simulate moving light refraction.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'medium',
    tags: ['lighting', 'water', 'ocean', 'underwater', 'swimming', 'pool'],
    baseScore: 8,
  },
  {
    id: 'lighting-aurora',
    icon: '🌌',
    title: 'Add aurora borealis',
    description: 'Night sky aurora particle ribbons are the most visually stunning sky effect.',
    prompt: 'Add aurora borealis: create 3-4 large flat ribbon Parts high in the sky (40-60 studs up), Material Neon, semi-transparent (Transparency 0.4), in aurora colors (green RGB(50,220,80), cyan RGB(50,180,200), purple RGB(120,50,200)). Add a Script that slowly TweenService-animates their Size and Rotation on the Y and Z axes to create a rippling curtain effect over 8-12 second cycles.',
    category: 'lighting',
    impact: 'high',
    difficulty: 'medium',
    tags: ['lighting', 'night', 'sky', 'aurora', 'tundra', 'space', 'fantasy'],
    baseScore: 8,
  },
  {
    id: 'lighting-lightning-storm',
    icon: '⛈️',
    title: 'Add lightning storm',
    description: 'Random flash effects and thunder sounds create intense atmospheric events.',
    prompt: 'Add a lightning storm system: a Script in ServerScriptService that randomly (every 8-20 seconds) fires a RemoteEvent to all clients. Client-side LocalScript: plays a thunder Sound with random pitch 0.8-1.1, and runs a sequence of 3 rapid Lighting.Brightness tweens (0.5→10→0.5→8→2) over 0.3 seconds using TweenService to simulate lightning flash.',
    category: 'animation',
    impact: 'high',
    difficulty: 'medium',
    tags: ['lighting', 'storm', 'rain', 'thunder', 'weather', 'horror', 'atmosphere'],
    baseScore: 8,
  },

  // ── AUDIO (10) ───────────────────────────────────────────────────────────────

  {
    id: 'audio-ambient-soundscape',
    icon: '🎶',
    title: 'Add ambient soundscape',
    description: 'Wind, birds, or traffic looping at low volume makes silence feel intentional.',
    prompt: 'Add an ambient soundscape matching the scene type: for outdoor/nature scenes add bird calls and wind (Sound in SoundService, RollOffMaxDistance 9999, Looped true, Volume 0.4). For urban scenes add distant traffic and crowd murmur. For indoor scenes add HVAC hum and distant footsteps. Set 3D spatial Sound only in localized areas; use SoundService for global ambience.',
    category: 'audio',
    impact: 'high',
    difficulty: 'easy',
    tags: ['audio', 'ambient', 'outdoor', 'nature', 'forest', 'urban', 'city'],
    baseScore: 9,
  },
  {
    id: 'audio-door-sounds',
    icon: '🚪',
    title: 'Add door sounds',
    description: 'Open/close sound effects on interactable doors are the most noticed ambient audio.',
    prompt: 'For each interactable door: add a Sound instance in the door Part for open (short creak/click, Volume 0.7) and close (heavier thud/click). In the door\'s Script, play the appropriate Sound on open/close transition using Sound:Play(). Use different sounds for wooden doors vs metal doors based on door material.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['audio', 'door', 'building', 'interior', 'interaction'],
    baseScore: 6,
  },
  {
    id: 'audio-water-sounds',
    icon: '💧',
    title: 'Add water sounds',
    description: 'Looping water audio near rivers and oceans is the easiest immersion win.',
    prompt: 'Add spatial water sounds to all water bodies: attach a Sound instance to an anchor Part at the center of each water area (river, lake, fountain). Use a looping water/stream audio (Volume 0.5 for small streams, 0.8 for rivers, 0.3 for ocean). Set RollOffMode InverseTapered, RollOffMaxDistance scaled to water body size.',
    category: 'audio',
    impact: 'high',
    difficulty: 'easy',
    tags: ['audio', 'water', 'river', 'lake', 'ocean', 'fountain', 'terrain'],
    baseScore: 8,
  },
  {
    id: 'audio-music-zones',
    icon: '🎵',
    title: 'Add area music zones',
    description: 'Different background music per zone is the AAA open-world standard.',
    prompt: 'Add area-based music zones: create invisible box Parts marking each zone (Town, Forest, Dungeon, Shop) with a Script that detects when LocalPlayer enters/exits via .Touched / Region3 check. On zone enter: fade out current background track, fade in zone-specific track over 2 seconds. Use TweenService on Sound.Volume for smooth transitions.',
    category: 'audio',
    impact: 'high',
    difficulty: 'medium',
    tags: ['audio', 'music', 'zone', 'area', 'ambient'],
    baseScore: 8,
  },
  {
    id: 'audio-cave-echo',
    icon: '🏔️',
    title: 'Add cave/indoor echo',
    description: 'Reverb effect in caves and large indoor spaces is the audio detail players feel.',
    prompt: 'Add reverb/echo to cave and large interior spaces: attach an EqualizerSoundEffect and a ReverbSoundEffect to all Sounds parented inside cave/dungeon/large-hall structures. Set ReverbSoundEffect.DecayTime 2.5 for caves, 1.2 for halls. Boost EqualizerSoundEffect low-mid slightly (+3dB at 300Hz). Apply to all ambient and footstep sounds in those zones.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'medium',
    tags: ['audio', 'cave', 'dungeon', 'indoor', 'echo', 'reverb'],
    baseScore: 7,
  },
  {
    id: 'audio-ui-sounds',
    icon: '🖱️',
    title: 'Add UI interaction sounds',
    description: 'Click and hover sounds on buttons make the UI feel polished and responsive.',
    prompt: 'Add UI sound effects to all interactive GUI elements: in each button\'s LocalScript, play a click Sound (short, crisp, 0.5s, Volume 0.6) on MouseButton1Click and a hover Sound (soft, brief, Volume 0.3) on MouseEnter. Use SoundService:PlayLocalSound() to avoid spatial rolloff. Reuse the same Sound instances — don\'t create new ones per click.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['audio', 'ui', 'button', 'click', 'hover', 'sound'],
    baseScore: 7,
  },
  {
    id: 'audio-weather-sounds',
    icon: '🌩️',
    title: 'Add weather sounds',
    description: 'Rain, wind, and thunder tied to weather state completes the environmental audio.',
    prompt: 'Add weather audio: create a WeatherAudio folder in SoundService with Sounds for rain (looped, Volume 0), thunder (one-shot, Volume 0), wind (looped, Volume 0). In the weather control Script, tween Sound.Volume up/down as weather state changes. Set rain volume to 0.6 during rain, thunder plays one-shot randomly during storms. Wind rises gradually before storms.',
    category: 'audio',
    impact: 'high',
    difficulty: 'medium',
    tags: ['audio', 'weather', 'rain', 'thunder', 'wind', 'storm'],
    baseScore: 8,
  },
  {
    id: 'audio-crowd-noise',
    icon: '👥',
    title: 'Add crowd ambience',
    description: 'Distant crowd noise in busy areas makes an empty map feel populated.',
    prompt: 'Add crowd ambience to town squares, markets, and busy areas: attach a looping crowd/chatter Sound to anchor Parts at area centers. Volume 0.3, RollOffMaxDistance 30, Looped true. Use a PitchShiftSoundEffect on each Sound with Octave randomized ±0.1 so multiple crowd sources don\'t perfectly stack. Reduce volume during quiet hours (if day/night system exists).',
    category: 'audio',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['audio', 'crowd', 'urban', 'town', 'market', 'busy'],
    baseScore: 6,
  },
  {
    id: 'audio-machinery-sounds',
    icon: '⚙️',
    title: 'Add machinery sounds',
    description: 'Looping mechanical hum from factories and workshops grounds the industrial setting.',
    prompt: 'For factory, workshop, or industrial structures: attach looping machinery Sound instances to each major machine Part (press, generator, conveyor). Use low-frequency hum sounds (Volume 0.5, RollOffMaxDistance 20). Add a Script that randomizes a subtle PitchShiftSoundEffect Octave 0.95-1.05 on each machine to avoid perfect unison from multiple machines.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['audio', 'factory', 'industrial', 'workshop', 'machine', 'engine'],
    baseScore: 6,
  },
  {
    id: 'audio-fire-sound',
    icon: '🔥',
    title: 'Add fire crackling sound',
    description: 'A looping fire crackle Sound on campfires and torches completes the fire effect.',
    prompt: 'For all fire/flame effects in the scene: attach a looping fire crackle Sound to each fire Part or campfire anchor. Volume 0.5, RollOffMaxDistance 15, Looped true. Add a PitchShiftSoundEffect with Octave randomized per fire source so multiple fires don\'t sound identical. Set EmitterSize 3 on each Sound for natural spatial spread.',
    category: 'audio',
    impact: 'medium',
    difficulty: 'easy',
    tags: ['audio', 'fire', 'campfire', 'torch', 'lighting', 'outdoor'],
    baseScore: 7,
  },

  // ── PERFORMANCE (5) ──────────────────────────────────────────────────────────

  {
    id: 'performance-lod-system',
    icon: '⚡',
    title: 'Add LOD detail reduction',
    description: 'Swapping high-detail Props to simplified versions at distance doubles FPS.',
    prompt: 'Add a LOD (Level of Detail) system: write a Script that runs on the client, checks LocalPlayer character position each 2 seconds, and for all Props tagged "HasLOD" — if distance > 60 studs, swap to LOD_Low model; if distance > 120 studs, set Transparency 1; if closer than 60 studs, restore original. Use CollectionService tags to mark Props.',
    category: 'performance',
    impact: 'high',
    difficulty: 'hard',
    tags: ['performance', 'optimization', 'fps', 'lod', 'large map'],
    baseScore: 8,
  },
  {
    id: 'performance-streaming',
    icon: '📡',
    title: 'Enable workspace streaming',
    description: 'StreamingEnabled with optimized radius cuts load time by 60% for large maps.',
    prompt: 'Enable streaming: set Workspace.StreamingEnabled true, Workspace.StreamingMinRadius 64, Workspace.StreamingTargetRadius 128. Ensure all critical Parts (spawn, doors, triggers) are in a Folder tagged "PersistentContent" and set their Workspace.StreamingIntegrityMode appropriately. Remove CastShadow from all Parts smaller than 1 stud.',
    category: 'performance',
    impact: 'high',
    difficulty: 'medium',
    tags: ['performance', 'optimization', 'streaming', 'large map', 'mobile'],
    baseScore: 9,
  },
  {
    id: 'performance-shadow-cull',
    icon: '🌑',
    title: 'Cull unnecessary shadows',
    description: 'Disabling CastShadow on small props is the quickest render time win.',
    prompt: 'Reduce shadow draw calls: write a Script that iterates all BasePart descendants in Workspace. For any Part with size smaller than 1.5 studs in all dimensions, set CastShadow to false. For any Part with Material Neon or Transparency > 0.5, set CastShadow false. Print a count of how many were modified.',
    category: 'performance',
    impact: 'high',
    difficulty: 'easy',
    tags: ['performance', 'optimization', 'shadow', 'fps'],
    baseScore: 8,
  },
  {
    id: 'performance-union-cleanup',
    icon: '🔧',
    title: 'Replace CSG unions with MeshParts',
    description: 'Exporting Unions as MeshParts cuts render cost by up to 70% for complex geometry.',
    prompt: 'Identify all UnionOperation Parts in the scene that have more than 8 triangles. For each: use AssetService to export the union geometry, re-import as a MeshPart, and replace the Union in the hierarchy. Preserve Position, Orientation, Material, Color, and Parent. Log each replacement. Skip Unions that are functional parts of scripts (check for Script children).',
    category: 'performance',
    impact: 'high',
    difficulty: 'hard',
    tags: ['performance', 'optimization', 'union', 'mesh', 'geometry'],
    baseScore: 7,
  },
  {
    id: 'performance-texture-atlas',
    icon: '🗺️',
    title: 'Consolidate to texture atlas',
    description: 'Batching Props using a single texture atlas cuts draw calls from 100 to 1.',
    prompt: 'Implement texture atlasing: identify all Props that use individual small textures (less than 128×128 or single color). Create a 512×512 texture atlas combining these. Apply the atlas SurfaceAppearance to all batched Props and adjust UV offsets on each to reference the correct atlas region. This reduces draw calls proportionally to the number of unique textures merged.',
    category: 'performance',
    impact: 'high',
    difficulty: 'hard',
    tags: ['performance', 'optimization', 'texture', 'atlas', 'draw calls'],
    baseScore: 7,
  },
]

// ─── Build-type signal maps ───────────────────────────────────────────────────

/**
 * Maps broad build-type keywords to enhancement tag priorities.
 * The score multiplier is applied to enhancements whose tags match.
 */
const BUILD_TYPE_SIGNALS: Array<{
  keywords: string[]
  boostTags: string[]
  multiplier: number
}> = [
  {
    keywords: ['castle', 'medieval', 'kingdom', 'fortress', 'dungeon', 'keep', 'tower'],
    boostTags: ['castle', 'medieval', 'building', 'lighting', 'npc', 'dungeon', 'torch', 'fire'],
    multiplier: 1.6,
  },
  {
    keywords: ['house', 'home', 'cottage', 'cabin', 'residential', 'suburban'],
    boostTags: ['house', 'building', 'window', 'roof', 'garden', 'outdoor'],
    multiplier: 1.5,
  },
  {
    keywords: ['forest', 'woods', 'jungle', 'nature', 'wilderness', 'biome'],
    boostTags: ['forest', 'terrain', 'nature', 'tree', 'vegetation', 'audio'],
    multiplier: 1.6,
  },
  {
    keywords: ['city', 'town', 'urban', 'street', 'downtown', 'district'],
    boostTags: ['urban', 'street', 'city', 'building', 'lighting', 'neon'],
    multiplier: 1.6,
  },
  {
    keywords: ['shop', 'store', 'market', 'mall', 'cafe', 'restaurant', 'bar'],
    boostTags: ['shop', 'building', 'sign', 'neon', 'urban'],
    multiplier: 1.5,
  },
  {
    keywords: ['npc', 'character', 'villager', 'guard', 'merchant', 'enemy', 'mob', 'boss'],
    boostTags: ['npc', 'character', 'animation', 'audio'],
    multiplier: 1.7,
  },
  {
    keywords: ['night', 'dark', 'midnight', 'dusk', 'horror', 'spooky'],
    boostTags: ['night', 'lighting', 'neon', 'glow', 'fog', 'atmosphere'],
    multiplier: 1.6,
  },
  {
    keywords: ['rain', 'storm', 'weather', 'thunder', 'wet'],
    boostTags: ['rain', 'weather', 'storm', 'audio', 'atmosphere'],
    multiplier: 1.7,
  },
  {
    keywords: ['underwater', 'ocean', 'sea', 'water', 'lake', 'river'],
    boostTags: ['water', 'ocean', 'underwater', 'terrain', 'audio'],
    multiplier: 1.6,
  },
  {
    keywords: ['cave', 'mine', 'underground', 'tunnel'],
    boostTags: ['cave', 'dungeon', 'lighting', 'audio', 'echo'],
    multiplier: 1.6,
  },
  {
    keywords: ['ruin', 'abandoned', 'broken', 'destroyed', 'old', 'ancient'],
    boostTags: ['ruin', 'weathered', 'aged', 'moss', 'vine', 'old'],
    multiplier: 1.7,
  },
  {
    keywords: ['fantasy', 'magic', 'enchanted', 'wizard', 'fairy', 'mystical'],
    boostTags: ['enchanted', 'fantasy', 'particle', 'aurora', 'sparkle', 'glow'],
    multiplier: 1.6,
  },
  {
    keywords: ['factory', 'industrial', 'warehouse', 'workshop', 'engine'],
    boostTags: ['factory', 'industrial', 'machine', 'audio'],
    multiplier: 1.6,
  },
  {
    keywords: ['large', 'big', 'massive', 'open world', 'huge', 'expansive'],
    boostTags: ['performance', 'optimization', 'streaming', 'lod'],
    multiplier: 1.8,
  },
]

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreEntry(entry: CatalogEntry, intentLower: string, descLower: string): number {
  let score = entry.baseScore

  // Boost entries whose tags appear in the intent or description
  for (const tag of entry.tags) {
    if (intentLower.includes(tag) || descLower.includes(tag)) {
      score += 3
    }
  }

  // Apply build-type signal multipliers
  for (const signal of BUILD_TYPE_SIGNALS) {
    const isMatchedBuildType = signal.keywords.some(
      (kw) => intentLower.includes(kw) || descLower.includes(kw)
    )
    if (!isMatchedBuildType) continue

    const tagOverlap = entry.tags.filter((t) => signal.boostTags.includes(t)).length
    if (tagOverlap > 0) {
      score *= signal.multiplier * (1 + (tagOverlap - 1) * 0.1)
    }
  }

  // Bias toward high-impact items
  if (entry.impact === 'high') score += 2
  if (entry.impact === 'low') score -= 1

  return score
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns 5-8 enhancements relevant to the build, ranked by contextual score.
 * Caps at 2 enhancements per category to ensure variety.
 */
export function getBuildEnhancements(
  intent: string,
  buildDescription: string
): Enhancement[] {
  const intentLower = intent.toLowerCase()
  const descLower = buildDescription.toLowerCase()

  const scored = CATALOG.map((entry) => ({
    entry,
    score: scoreEntry(entry, intentLower, descLower),
  }))

  scored.sort((a, b) => b.score - a.score)

  const categoryCount: Record<EnhancementCategory, number> = {
    detail: 0,
    lighting: 0,
    vegetation: 0,
    weathering: 0,
    animation: 0,
    audio: 0,
    performance: 0,
    polish: 0,
  }

  const result: Enhancement[] = []

  for (const { entry } of scored) {
    const count = categoryCount[entry.category]
    if (count >= 2) continue
    categoryCount[entry.category] = count + 1

    result.push({
      id: entry.id,
      icon: entry.icon,
      title: entry.title,
      description: entry.description,
      prompt: entry.prompt,
      category: entry.category,
      impact: entry.impact,
      difficulty: entry.difficulty,
    })

    if (result.length >= 8) break
  }

  // Always return at least 5 — if strict category cap blocked us, relax it
  if (result.length < 5) {
    for (const { entry } of scored) {
      if (result.some((r) => r.id === entry.id)) continue
      result.push({
        id: entry.id,
        icon: entry.icon,
        title: entry.title,
        description: entry.description,
        prompt: entry.prompt,
        category: entry.category,
        impact: entry.impact,
        difficulty: entry.difficulty,
      })
      if (result.length >= 5) break
    }
  }

  return result
}

/**
 * Smart contextual enhancement picker.
 * Selects the most relevant enhancements for what was just built.
 * Defaults to returning up to 6 items.
 */
export function getContextualEnhancements(
  intent: string,
  description: string,
  maxItems = 6
): Enhancement[] {
  const intentLower = intent.toLowerCase()
  const descLower = description.toLowerCase()

  const scored = CATALOG.map((entry) => ({
    entry,
    score: scoreEntry(entry, intentLower, descLower),
  }))

  scored.sort((a, b) => b.score - a.score)

  // No category cap for contextual — allow more same-category items when highly relevant
  const result: Enhancement[] = []

  for (const { entry } of scored) {
    result.push({
      id: entry.id,
      icon: entry.icon,
      title: entry.title,
      description: entry.description,
      prompt: entry.prompt,
      category: entry.category,
      impact: entry.impact,
      difficulty: entry.difficulty,
    })
    if (result.length >= maxItems) break
  }

  return result
}

/**
 * Returns the top 3 highest-impact enhancements for a quick polish pass.
 * Only considers items with impact "high" and difficulty "easy" or "medium".
 */
export function getQuickPolish(description: string): Enhancement[] {
  const descLower = description.toLowerCase()

  const candidates = CATALOG.filter(
    (entry) =>
      entry.impact === 'high' &&
      (entry.difficulty === 'easy' || entry.difficulty === 'medium')
  )

  const scored = candidates.map((entry) => ({
    entry,
    score: scoreEntry(entry, descLower, descLower),
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map(({ entry }) => ({
    id: entry.id,
    icon: entry.icon,
    title: entry.title,
    description: entry.description,
    prompt: entry.prompt,
    category: entry.category,
    impact: entry.impact,
    difficulty: entry.difficulty,
  }))
}
