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
    minParts: 15,
    maxParts: 40,
    minLights: 1,
    minInteractive: 0,
    minColors: 3,
    requiresInterior: false,
    requiresWedgeRoofs: true,
    requiresEffects: false,
    requiresScriptedElements: false,
    requiresCinematicLighting: false,
    promptModifier: `QUALITY TIER: STARTER — Clean, simple, functional.
- 15-40 parts. Focus on correct proportions and clean geometry.
- Use 3+ different colors with vc() variation.
- Roofs MUST use W() wedge helper, not flat Parts.
- At least 1 PointLight for atmosphere.
- No empty shells — buildings need a floor and basic furniture.`,
  },

  builder: {
    name: 'Builder',
    label: 'Detailed & Polished',
    minParts: 25,
    maxParts: 55,
    minLights: 3,
    minInteractive: 1,
    minColors: 5,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: false,
    requiresScriptedElements: false,
    requiresCinematicLighting: false,
    promptModifier: `QUALITY TIER: BUILDER — Detailed with character.
- 25-55 parts. Every surface needs thought — no plain boxes.
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
    minParts: 35,
    maxParts: 65,
    minLights: 5,
    minInteractive: 3,
    minColors: 8,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: false,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: PRO — Production-ready, publishable quality.
- 35-65 parts. This should look like a real Roblox game environment.
- FULL INTERIORS: multiple rooms, each with purpose-specific furniture.
- 5+ PointLights/SpotLights with varied warmth — kitchen lights brighter, bedroom dimmer.
- 3+ interactive elements: doors that could open (ProximityPrompt), clickable buttons, SurfaceGui signs with text.
- Fire/Smoke/ParticleEmitter on at least one element (chimney smoke, torch fire, fountain spray).
- CINEMATIC LIGHTING: Atmosphere + BloomEffect + ColorCorrectionEffect in Lighting service.
- 8+ colors with vc() variation on every surface.
- Landscaping around buildings: paths, fences, planters, trees (Cyl+Ball).
- Edge detail: window frames, door trim, roof overhangs, gutters, awnings.
- USE ALL HELPERS: P(), W(), Cyl(), Ball(). Flat-box builds are unacceptable.`,
  },

  master: {
    name: 'Master',
    label: 'Showcase Quality',
    minParts: 50,
    maxParts: 75,
    minLights: 8,
    minInteractive: 5,
    minColors: 10,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: true,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: MASTER — Showcase, award-winning quality.
- 50-75 parts. Every single part is intentional and detailed.
- SCRIPTED ELEMENTS: doors that TweenService open/close, lights that flicker, NPCs with ProximityPrompt dialogue.
- RICH INTERIORS: every room furnished with 5+ props. Kitchen has appliances, bedroom has bedside tables + lamps + books.
- 8+ light sources with purposeful placement — accent lights, task lights, ambient lights.
- Particle effects: Smoke on chimneys, Fire on torches, Sparkles on treasure, ParticleEmitter for dust/atmosphere.
- FULL CINEMATIC LIGHTING: Atmosphere(Density=0.3) + Bloom(0.3) + CC(warm tint) + SunRays.
- Sound instances for ambience (crackling fire, wind, water).
- 10+ colors, every material intentional. No two walls the exact same shade.
- Outdoor landscaping: varied trees, rock formations, flower beds, paths with different materials.
- Architectural detail: crown molding, chair rail, wainscoting, decorative arches.`,
  },

  legendary: {
    name: 'Legendary',
    label: 'God Tier',
    minParts: 60,
    maxParts: 80,
    minLights: 12,
    minInteractive: 8,
    minColors: 12,
    requiresInterior: true,
    requiresWedgeRoofs: true,
    requiresEffects: true,
    requiresScriptedElements: true,
    requiresCinematicLighting: true,
    promptModifier: `QUALITY TIER: LEGENDARY — This is the ceiling. Museum-quality, fully alive.
- 60-80 parts, every one of them justified and detailed.
- FULLY SCRIPTED: doors open with TweenService + sound. Lights flicker realistically. NPCs wander with PathfindingService. Buttons trigger events. Signs display dynamic text.
- IMMERSIVE AUDIO: ambient sounds everywhere — wind, birds, water, fire crackling, footstep echoes.
- PARTICLE MASTERY: Smoke(chimneys), Fire(torches), ParticleEmitter(dust motes in light beams, leaves falling, rain, snow, embers).
- CINEMATIC: Atmosphere + Bloom + CC + SunRays + DepthOfField for camera focus.
- INTERIORS that tell stories: books on shelves, food on tables, clothes in wardrobes, paintings on walls, rugs under furniture, clocks on mantels.
- MATERIALS: 12+ colors, every surface unique. Weathering on metal (CorrodedMetal patches). Moss on old stone (green tint on Granite). Wood grain variation.
- LANDSCAPING: mature trees (multiple Cyl+Ball clusters), garden beds, stone walls, gravel paths, water features, benches, lampposts with SpotLights.
- ARCHITECTURAL PERFECTION: columns, arches, cornices, balustrades, dormers, bay windows, covered porches, decorative brackets.
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
