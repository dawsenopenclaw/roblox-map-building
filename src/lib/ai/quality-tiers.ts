/**
 * Quality Tier System — Scales build output from beginner to god-tier
 *
 * Each tier defines minimum standards for parts, lighting, interactivity,
 * detail, and polish. The AI gets tier-specific instructions that force
 * progressively higher output quality.
 *
 * Tiers:
 *   1. Starter   — Simple, clean, functional (free tier default)
 *   2. Builder   — Detailed with interiors and lighting
 *   3. Pro       — Production-quality with interactivity and effects
 *   4. Master    — Showcase-quality with scripted elements and polish
 *   5. Legendary — Competition-winning, fully interactive, cinematic
 */

export type QualityTier = 'starter' | 'builder' | 'pro' | 'master' | 'legendary'

export interface TierConfig {
  name: string
  label: string
  minParts: number
  maxParts: number
  minLights: number
  minInteractive: number
  minColors: number
  requiresInterior: boolean
  requiresWedgeRoofs: boolean
  requiresEffects: boolean
  requiresScriptedElements: boolean
  requiresCinematicLighting: boolean
  promptModifier: string
}

const TIER_CONFIGS: Record<QualityTier, TierConfig> = {
  starter: {
    name: 'Starter',
    label: 'Clean & Simple',
    minParts: 20,
    maxParts: 120,
    minLights: 1,
    minInteractive: 0,
    minColors: 3,
    requiresInterior: false,
    requiresWedgeRoofs: true,
    requiresEffects: false,
    requiresScriptedElements: false,
    requiresCinematicLighting: false,
    promptModifier: `QUALITY TIER: STARTER — Clean, simple, functional.
- 20-120 parts. Focus on correct proportions and clean geometry.
- Use 3+ different colors with vc() variation.
- Roofs MUST use W() wedge helper, not flat Parts.
- At least 1 PointLight for atmosphere.
- No empty shells — buildings need a floor and basic furniture.`,
  },

  builder: {
    name: 'Builder',
    label: 'Detailed & Polished',
    minParts: 35,
    maxParts: 200,
    minLights: 3,
    minInteractive: 1,
    minColors: 5,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: false,
    requiresScriptedElements: false,
    requiresCinematicLighting: false,
    promptModifier: `QUALITY TIER: BUILDER — Detailed with character.
- 35-200 parts. Every surface needs thought — no plain boxes.
- INTERIORS ARE MANDATORY: furniture, counters, shelves, rugs, wall art.
- 3+ PointLights with warm tones (255,200,140) for cozy atmosphere.
- At least 1 interactive element: ProximityPrompt on doors, or ClickDetector on something.
- Trim and baseboards on walls. Window sills. Door frames with handles.
- 5+ different colors. Wood grain variation with vc(). Brick shade variation.
- W() for all roofs. Cyl() for poles/columns. Ball() for foliage.`,
  },

  pro: {
    name: 'Pro',
    label: 'Production Quality',
    minParts: 50,
    maxParts: 400,
    minLights: 5,
    minInteractive: 3,
    minColors: 8,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: false,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: PRO — Production-ready, publishable quality.
- 80-300 parts for buildings, 200-2000 for maps. USE FOR LOOPS for repeated elements (windows, fence posts, tiles, lamps, trees). Real Roblox games have 14K-25K parts. A single lighthouse = 430 parts. Your builds must be professional.
- FULL INTERIORS: multiple rooms, each with purpose-specific furniture.
- 5+ PointLights/SpotLights with varied warmth — kitchen lights brighter, bedroom dimmer.
- 3+ interactive elements: doors (ProximityPrompt), clickable buttons, SurfaceGui signs with text.
- Fire/Smoke/ParticleEmitter on at least one element (chimney smoke, torch fire, fountain spray).
- AAA LIGHTING: Atmosphere(Density=0.3,Offset=0.25) + Bloom(0.4) + CC(Saturation=-0.1) + SunRays. SET EnvironmentDiffuseScale=1 AND EnvironmentSpecularScale=1 — this is the #1 quality difference.
- TERRAIN: Use workspace.Terrain:FillBlock for ground planes on ALL outdoor builds. Part-based ground looks amateur.
- 8+ colors with vc() variation on EVERY surface — no flat uniform colors anywhere.
- SILHOUETTE: Break the box outline — roof overhangs, chimneys, balconies, porches, awnings, bay windows.
- NEGATIVE SPACE: Covered walkways, recessed doorways, overhanging eaves that catch shadows.
- Landscaping: paths, fences, planters, trees (Cyl+Ball), terrain hills.
- Edge detail: window frames with sills, door trim with threshold, baseboards, crown molding.
- USE ALL HELPERS: P(), W(), Cyl(), Ball(). Flat-box builds are unacceptable.
- ORGANIC VARIATION: vary window sizes by 0.5 studs, offset parts by 0.1-0.2 studs for natural imperfection.`,
  },

  master: {
    name: 'Master',
    label: 'Showcase Quality',
    minParts: 80,
    maxParts: 600,
    minLights: 8,
    minInteractive: 5,
    minColors: 10,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: true,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: MASTER — Showcase, award-winning quality.
- 80-600 parts. Every single part is intentional and detailed.
- SCRIPTED ELEMENTS: doors that TweenService open/close with sound, lights that flicker (randomized Brightness/Range in loop), NPCs with ProximityPrompt dialogue.
- RICH INTERIORS: every room furnished with 5+ props. Kitchen has appliances, bedroom has bedside tables + lamps + books.
- 8+ light sources with purposeful placement — accent PointLights, task SpotLights, warm ambient bounce lights (Brightness 0.3, Range 50+ behind walls).
- ADVANCED PARTICLES: Smoke on chimneys with NumberSequence transparency curves, Fire on torches, ParticleEmitter dust motes in light beams (Rate=3, slow speed, long lifetime).
- AAA LIGHTING: EnvironmentDiffuseScale=1, EnvironmentSpecularScale=1, Atmosphere with Offset=0.25 and Decay color. CC Saturation=-0.15 for cinematic look.
- TERRAIN: FillBlock for ground, FillBall for hills, Water for ponds. Never use Parts for terrain.
- BEAM EFFECTS: Use Beam between Attachments for light rays through windows, magical connections, rope bridges.
- HIGHLIGHT: Add Highlight instances on key objects for magical auras or interactive indicators.
- Sound instances for ambience (crackling fire, wind, water).
- 10+ colors, every material intentional. No two walls the exact same shade.
- SILHOUETTE MASTERY: dormers, bay windows, covered porches, pergolas, terraces, varying roof heights.
- Outdoor landscaping: varied trees with multiple Ball() canopy clusters at different heights, rock formations (2-3 Balls different sizes), flower beds, paths with different materials.
- Architectural detail: crown molding, chair rail, wainscoting, decorative arches, corbels.`,
  },

  legendary: {
    name: 'Legendary',
    label: 'God Tier',
    minParts: 100,
    maxParts: 1000,
    minLights: 12,
    minInteractive: 8,
    minColors: 12,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: true,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: LEGENDARY — This is the ceiling. Museum-quality, fully alive.
- 100-1000 parts, every one of them justified and detailed.
- FULLY SCRIPTED: doors open with TweenService + Sound. Lights flicker (Brightness oscillation in task.spawn loop). NPCs wander with PathfindingService. Buttons trigger events. Signs display dynamic text via SurfaceGui.
- IMMERSIVE AUDIO: ambient Sound instances everywhere — wind, birds, water, fire crackling.
- PARTICLE MASTERY: Smoke with NumberSequence transparency curves, Fire with size variation, ParticleEmitter for dust motes (Rate=3, lifetime=12, transparency 0.6→1), embers (Rate=5, upward velocity, orange→red ColorSequence), fog wisps (Rate=1, Size=10+, slow).
- CINEMATIC STACK: EnvironmentDiffuseScale=1, EnvironmentSpecularScale=1, Atmosphere(Density=0.3,Offset=0.25,Decay), Bloom(0.4,24,0.95), CC(Saturation=-0.15,Contrast=0.15), SunRays(0.08), DepthOfFieldEffect(FarIntensity=0.1,FocusDistance=100).
- TERRAIN EVERYWHERE: FillBlock ground, FillBall hills, Water ponds, Sand beaches. NO Part-based terrain.
- BEAM + TRAIL: light rays through stained glass (Beam with LightEmission=1), rope bridges, magical effects, Trail on moving elements.
- HIGHLIGHT: auras on magical items, hover indicators on interactive objects.
- INTERIORS that tell stories: books on shelves, food on tables, paintings on walls, rugs under furniture, clocks on mantels.
- MATERIALS: 12+ colors. Weathering: CorrodedMetal patches on old metal, green-tinted Granite for mossy stone. Wood grain variation with vc(baseColor, 0.15).
- SILHOUETTE: every angle has visual interest. Dormers, bay windows, covered porches, pergolas, varying roof heights, chimneys with caps, antennas, weathervanes.
- NEGATIVE SPACE: arcaded walkways, covered terraces, recessed balconies, deep window reveals (0.5 stud inset).
- LANDSCAPING: mature trees (2-3 Cyl trunks + 4-5 Ball canopy clusters at varying heights), garden beds with colored Parts, stone walls, gravel paths (Pebble material), water features (Glass + ParticleEmitter spray), benches, lampposts with SpotLights.
- BOUNCE LIGHTING: place warm PointLights (Brightness=0.3, Range=50) behind walls and under terrain to simulate indirect light.
- This build should make someone stop and say "wait, an AI made this?"`,
  },
}

export function getTierConfig(tier: QualityTier): TierConfig {
  return TIER_CONFIGS[tier]
}

export function getTierFromSubscription(plan: string | null): QualityTier {
  if (!plan) return 'starter'
  switch (plan) {
    case 'free': return 'starter'
    case 'starter': return 'builder'
    case 'creator': return 'pro'
    case 'studio': return 'master'
    default: return 'builder'
  }
}

export function getAllTiers(): Array<{ tier: QualityTier; config: TierConfig }> {
  return (Object.keys(TIER_CONFIGS) as QualityTier[]).map(tier => ({
    tier,
    config: TIER_CONFIGS[tier],
  }))
}

/**
 * Returns the prompt modifier for the given tier.
 * This gets injected into the build instruction to force higher quality.
 */
export function getTierPromptModifier(tier: QualityTier): string {
  return TIER_CONFIGS[tier].promptModifier
}
