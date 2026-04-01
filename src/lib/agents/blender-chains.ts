/**
 * Blender agent chains — predefined multi-agent pipelines for common
 * Roblox asset creation workflows.
 *
 * Design rules:
 *  - Pure data module: no API calls, no side effects at import time
 *  - Each step carries its own parameter overrides so the orchestrator
 *    can pass defaults without user input
 *  - estimatedTotalTime is a sum of each agent's estimatedTime
 *  - costPerRun is the sum of each agent's costPerCall
 */

import {
  type BlenderAgent,
  type BlenderCategory,
  type BlenderOutputFormat,
  getAllBlenderAgents,
  getBlenderAgent,
} from './blender-registry'

// ─── Types ─────────────────────────────────────────────────────────────────────

/** One step in a chain with optional parameter overrides for that specific call */
export interface ChainStep {
  /** Agent id from blender-registry */
  agentId: string
  /**
   * Parameter overrides applied when this agent runs inside this chain.
   * Keys must match BlenderInputParam.key values defined in the agent.
   */
  paramOverrides: Record<string, string | number | boolean>
  /**
   * Human-readable description of what this step produces.
   * Shown in the ForjeGames pipeline UI between steps.
   */
  stepDescription: string
  /**
   * If true, this step can be skipped without breaking the chain.
   * Used for optional passes like LOD generation.
   */
  optional: boolean
}

export interface BlenderChain {
  id: string
  name: string
  description: string
  /** Short tag shown on chain cards in the UI */
  tags: string[]
  /** Ordered list of agent steps */
  steps: ChainStep[]
  /** Final output format produced by the last step */
  finalOutputFormat: BlenderOutputFormat
  /** Sum of all step estimatedTime values */
  estimatedTotalTime: string
  /** Sum of all step costPerCall values */
  costPerRun: number
  /** Roblox game genres this chain is most useful for */
  targetGenres: string[]
  /** Minimum ForjeGames subscription tier required (highest of all steps) */
  minTier: 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'
  /**
   * The category of asset produced.
   * Drives icon and filter display in the ForjeGames pipeline library.
   */
  outputCategory: BlenderCategory
  /**
   * A single sentence that describes the quality and style of the output,
   * used in the ForjeGames UI to set user expectations.
   */
  qualityNote: string
}

// ─── Chain definitions ─────────────────────────────────────────────────────────

const CHAINS: BlenderChain[] = [
  // ─── Full Character ──────────────────────────────────────────────────────────
  {
    id: 'full-character',
    name: 'Full Character',
    description:
      'Complete pipeline from concept to Roblox-ready animated character: mesh, R15 rig, PBR textures, walk cycle, and clean FBX export. Produces a character you can drop straight into an R15-compatible Roblox game.',
    tags: ['character', 'r15', 'animated', 'pbr'],
    steps: [
      {
        agentId: 'character-modeler',
        paramOverrides: { style: 'blocky_roblox', polyTarget: 2000 },
        stepDescription: 'Model R15-compatible humanoid body with separated limb meshes',
        optional: false,
      },
      {
        agentId: 'r15-rigger',
        paramOverrides: { autoWeight: true, includeFingers: false, addIK: false },
        stepDescription: 'Bind R15 armature with correct bone names and auto-weighted skin',
        optional: false,
      },
      {
        agentId: 'uv-unwrapper',
        paramOverrides: { method: 'smart_project', margin: 0.02, texelDensity: 128 },
        stepDescription: 'Unwrap all body parts with optimal texel density',
        optional: false,
      },
      {
        agentId: 'pbr-texture-artist',
        paramOverrides: { resolution: '1024', material: 'custom', tileable: false },
        stepDescription: 'Bake albedo, normal, roughness maps onto character UV layout',
        optional: false,
      },
      {
        agentId: 'walk-cycle-animator',
        paramOverrides: { animationType: 'all_locomotion', frameRate: 30, cycleDuration: 30 },
        stepDescription: 'Generate idle, walk, run, and jump animation actions',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: true, includeArmature: true, outputPath: 'character.fbx' },
        stepDescription: 'Export with correct Roblox FBX settings (scale 0.01, axis -Z/Y)',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '5min 30s',
    costPerRun: 268,
    targetGenres: ['rpg', 'simulator', 'fighting', 'adventure', 'roleplay'],
    minTier: 'CREATOR',
    outputCategory: 'character',
    qualityNote: 'Blocky Roblox-style character with full R15 rig, PBR skin texture, and 4 locomotion animations.',
  },

  // ─── Building ────────────────────────────────────────────────────────────────
  {
    id: 'building',
    name: 'Building',
    description:
      'Full building pipeline: architectural model → UV unwrap → PBR textures → polygon optimization → FBX export. Outputs a production-quality building mesh at an appropriate polygon budget.',
    tags: ['building', 'architecture', 'pbr', 'optimized'],
    steps: [
      {
        agentId: 'architectural-modeler',
        paramOverrides: { buildingType: 'house', stories: 2, footprintW: 20, footprintD: 16, roofStyle: 'gabled' },
        stepDescription: 'Model building exterior with correct stud-grid proportions',
        optional: false,
      },
      {
        agentId: 'uv-unwrapper',
        paramOverrides: { method: 'smart_project', margin: 0.02, texelDensity: 96 },
        stepDescription: 'Unwrap building surfaces for minimal texture stretching',
        optional: false,
      },
      {
        agentId: 'pbr-texture-artist',
        paramOverrides: { resolution: '1024', material: 'RedBrick', tileable: true, roughness: 0.85 },
        stepDescription: 'Apply PBR brick/stone material set (albedo + normal + roughness)',
        optional: false,
      },
      {
        agentId: 'polygon-optimizer',
        paramOverrides: { targetTriangles: 3000, preserveTexture: true, aggressiveness: 'gentle' },
        stepDescription: 'Reduce triangle count to 3 000 while preserving silhouette',
        optional: false,
      },
      {
        agentId: 'collision-generator',
        paramOverrides: { method: 'box', maxHulls: 1 },
        stepDescription: 'Generate simple box collision mesh for physics accuracy',
        optional: true,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'building.fbx' },
        stepDescription: 'Export with Roblox-correct scale and axis settings',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '3min 20s',
    costPerRun: 176,
    targetGenres: ['tycoon', 'roleplay', 'rpg', 'city', 'adventure'],
    minTier: 'CREATOR',
    outputCategory: 'building',
    qualityNote: 'Two-storey house with PBR brick texture, clean 3 000-triangle mesh, and box collision.',
  },

  // ─── Quick Prop ──────────────────────────────────────────────────────────────
  {
    id: 'quick-prop',
    name: 'Quick Prop',
    description:
      'Fastest path from nothing to a Roblox-ready small prop: model → stylized texture → export. No rigging, no PBR baking. Ideal for coins, gems, keys, and decorative items needed in bulk.',
    tags: ['prop', 'fast', 'stylized', 'collectible'],
    steps: [
      {
        agentId: 'prop-modeler',
        paramOverrides: { propType: 'gem', count: 1 },
        stepDescription: 'Model low-poly prop geometry (< 400 triangles)',
        optional: false,
      },
      {
        agentId: 'stylized-texture-artist',
        paramOverrides: { resolution: '256', paletteSize: 6, saturation: 1.4 },
        stepDescription: 'Apply flat Roblox-style diffuse texture',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'prop.fbx' },
        stepDescription: 'Export with Roblox-correct settings',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '33s',
    costPerRun: 43,
    targetGenres: ['simulator', 'rpg', 'adventure', 'obby', 'tycoon'],
    minTier: 'FREE',
    outputCategory: 'modeling',
    qualityNote: 'Stylized low-poly prop under 400 triangles — fast, cheap, and Roblox-ready in under a minute.',
  },

  // ─── Vehicle ─────────────────────────────────────────────────────────────────
  {
    id: 'vehicle',
    name: 'Vehicle',
    description:
      'Complete driveable vehicle pipeline: model body + wheels → custom rig for wheel articulation → PBR paint job → collision mesh → FBX export. Output integrates directly with Roblox VehicleSeat + HingeConstraint scripts.',
    tags: ['vehicle', 'driveable', 'pbr', 'collision', 'physics'],
    steps: [
      {
        agentId: 'vehicle-modeler',
        paramOverrides: { vehicleType: 'car', hasInterior: false, wheelCount: 4, length: 14 },
        stepDescription: 'Model vehicle body and four separate wheel meshes with correct pivots',
        optional: false,
      },
      {
        agentId: 'custom-rigger',
        paramOverrides: { rigType: 'vehicle_wheeled', boneCount: 6, useRigify: false },
        stepDescription: 'Rig wheel joints for HingeConstraint motor animation',
        optional: false,
      },
      {
        agentId: 'pbr-texture-artist',
        paramOverrides: { resolution: '1024', material: 'painted_metal', metallic: 0.6, roughness: 0.4, tileable: false },
        stepDescription: 'Bake vehicle body paint with metallic PBR maps',
        optional: false,
      },
      {
        agentId: 'collision-generator',
        paramOverrides: { method: 'convex_hull', maxHulls: 2 },
        stepDescription: 'Generate convex collision hull for vehicle body physics',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: true, outputPath: 'vehicle.fbx' },
        stepDescription: 'Export with armature for wheel bone-driven rotation scripts',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '5min 52s',
    costPerRun: 231,
    targetGenres: ['racing', 'tycoon', 'roleplay', 'open world', 'fps'],
    minTier: 'CREATOR',
    outputCategory: 'vehicle',
    qualityNote: 'Fully-rigged 4-wheel car with metallic PBR paint, convex collision mesh, and wheel bones ready for VehicleSeat scripts.',
  },

  // ─── Terrain Piece ───────────────────────────────────────────────────────────
  {
    id: 'terrain-piece',
    name: 'Terrain Piece',
    description:
      'Standalone terrain decoration pipeline: sculpt landscape piece → bake high-to-low normal map → generate LOD variants → FBX export. Produces 3 LOD variants ready for Roblox streaming or custom distance scripts.',
    tags: ['terrain', 'landscape', 'lod', 'environment', 'decoration'],
    steps: [
      {
        agentId: 'terrain-modeler',
        paramOverrides: { pieceType: 'cliff_face', width: 30, height: 20, noiseScale: 0.6 },
        stepDescription: 'Generate organic terrain mesh using A.N.T. Landscape noise',
        optional: false,
      },
      {
        agentId: 'uv-unwrapper',
        paramOverrides: { method: 'smart_project', margin: 0.015, texelDensity: 64 },
        stepDescription: 'Unwrap terrain surface for bake-target UV layout',
        optional: false,
      },
      {
        agentId: 'texture-baker',
        paramOverrides: { bakeTypes: 'normal_and_ao', resolution: '1024', cageExtrusion: 0.08, samples: 64 },
        stepDescription: 'Bake high-res surface detail (normal + AO) to low-poly mesh',
        optional: false,
      },
      {
        agentId: 'lod-generator',
        paramOverrides: { lod0Target: 2000, lod1Target: 600, lod2Target: 150 },
        stepDescription: 'Create LOD0 / LOD1 / LOD2 variants at 3 detail levels',
        optional: true,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'terrain_piece.fbx' },
        stepDescription: 'Export all LOD variants with Roblox-correct settings',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '5min 55s',
    costPerRun: 148,
    targetGenres: ['rpg', 'adventure', 'survival', 'open world', 'horror'],
    minTier: 'CREATOR',
    outputCategory: 'terrain',
    qualityNote: 'Cliff face with baked AO + normal detail and 3 LOD variants for Roblox distance streaming.',
  },

  // ─── Tycoon Machine Pack ─────────────────────────────────────────────────────
  {
    id: 'tycoon-machine-pack',
    name: 'Tycoon Machine Pack',
    description:
      'Generates a coordinated set of tycoon machines (dropper, conveyor, collector, upgrade pad) all sharing one texture atlas for minimal draw calls. Perfect for simulator/tycoon games needing consistent visual theming.',
    tags: ['tycoon', 'pack', 'atlas', 'optimized', 'simulator'],
    steps: [
      {
        agentId: 'tycoon-asset-builder',
        paramOverrides: { assetType: 'dropper', theme: 'generic_factory', gridSize: 8 },
        stepDescription: 'Model dropper asset (step 1 of 4-piece pack)',
        optional: false,
      },
      {
        agentId: 'tycoon-asset-builder',
        paramOverrides: { assetType: 'conveyor_straight', theme: 'generic_factory', gridSize: 8 },
        stepDescription: 'Model conveyor segment (step 2 of 4)',
        optional: false,
      },
      {
        agentId: 'tycoon-asset-builder',
        paramOverrides: { assetType: 'collector_funnel', theme: 'generic_factory', gridSize: 8 },
        stepDescription: 'Model collector funnel (step 3 of 4)',
        optional: false,
      },
      {
        agentId: 'tycoon-asset-builder',
        paramOverrides: { assetType: 'upgrade_pad', theme: 'generic_factory', gridSize: 8 },
        stepDescription: 'Model upgrade pad (step 4 of 4)',
        optional: false,
      },
      {
        agentId: 'stylized-texture-artist',
        paramOverrides: { resolution: '512', paletteSize: 8, saturation: 1.2 },
        stepDescription: 'Paint stylized diffuse texture matching factory theme',
        optional: false,
      },
      {
        agentId: 'atlas-packer',
        paramOverrides: { atlasSize: '1024', margin: 0.01, includeMaps: false },
        stepDescription: 'Combine all 4 machine textures into single 1024 atlas',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'tycoon_pack.fbx' },
        stepDescription: 'Export pack with atlas-remapped UVs',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '3min 05s',
    costPerRun: 198,
    targetGenres: ['tycoon', 'simulator', 'idle'],
    minTier: 'CREATOR',
    outputCategory: 'environment',
    qualityNote: '4-piece tycoon machine pack sharing one 1024×1024 atlas texture — single draw call for all machines.',
  },

  // ─── Simulator Pet ───────────────────────────────────────────────────────────
  {
    id: 'simulator-pet',
    name: 'Simulator Pet',
    description:
      'Complete Pet Simulator-style pet pipeline: cute chibi mesh → R15-adjacent rig → stylized texture → idle + walk animations → FBX export. Produces a game-ready pet with floating follow animations.',
    tags: ['simulator', 'pet', 'animated', 'cute', 'chibi'],
    steps: [
      {
        agentId: 'simulator-asset-builder',
        paramOverrides: { assetType: 'pet_cat', style: 'cute_chibi', glowEffect: false },
        stepDescription: 'Sculpt cute chibi pet base mesh with separated head/body/limbs',
        optional: false,
      },
      {
        agentId: 'custom-rigger',
        paramOverrides: { rigType: 'quadruped', boneCount: 8, useRigify: false },
        stepDescription: 'Rig pet with simple quadruped bone chain for locomotion',
        optional: false,
      },
      {
        agentId: 'stylized-texture-artist',
        paramOverrides: { resolution: '512', paletteSize: 6, saturation: 1.5 },
        stepDescription: 'Paint flat stylized diffuse texture with high saturation for cute look',
        optional: false,
      },
      {
        agentId: 'walk-cycle-animator',
        paramOverrides: { animationType: 'all_locomotion', frameRate: 30, cycleDuration: 20, bounceAmount: 1.6 },
        stepDescription: 'Animate idle, walk, and run cycle with exaggerated bounce',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: true, includeArmature: true, outputPath: 'pet.fbx' },
        stepDescription: 'Export pet mesh + rig + animations in single Roblox-ready FBX',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '4min 10s',
    costPerRun: 228,
    targetGenres: ['simulator', 'pet game', 'adventure'],
    minTier: 'CREATOR',
    outputCategory: 'character',
    qualityNote: 'Cute chibi-style pet under 800 tris with full locomotion animations and stylized texture — ready for Pet Sim-style follow mechanics.',
  },

  // ─── FPS Weapon Complete ─────────────────────────────────────────────────────
  {
    id: 'fps-weapon-complete',
    name: 'FPS Weapon Complete',
    description:
      'End-to-end FPS weapon pipeline: detailed viewmodel mesh → PBR military textures → magazine reload + fire animations → FBX export. Ready to drop into an FPS framework with attachment sockets pre-positioned.',
    tags: ['fps', 'weapon', 'viewmodel', 'pbr', 'animated'],
    steps: [
      {
        agentId: 'fps-weapon-builder',
        paramOverrides: { weaponClass: 'assault_rifle', attachments: 'iron_sights', detailLevel: 'viewmodel_high' },
        stepDescription: 'Model high-detail FPS viewmodel with receiver, barrel, magazine, stock',
        optional: false,
      },
      {
        agentId: 'uv-unwrapper',
        paramOverrides: { method: 'smart_project', margin: 0.015, texelDensity: 256 },
        stepDescription: 'Unwrap weapon at high texel density for close-up FPS view',
        optional: false,
      },
      {
        agentId: 'pbr-texture-artist',
        paramOverrides: { resolution: '1024', material: 'painted_metal', metallic: 0.8, roughness: 0.3, tileable: false },
        stepDescription: 'Bake full PBR set — metallic receiver with painted stock',
        optional: false,
      },
      {
        agentId: 'combat-animator',
        paramOverrides: { combatType: 'shoot_gun', windUpFrames: 2, recoveryFrames: 4 },
        stepDescription: 'Animate fire recoil, trigger pull, and muzzle rise',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: true, includeArmature: false, outputPath: 'fps_weapon.fbx' },
        stepDescription: 'Export weapon with baked PBR maps and fire animation',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '5min 05s',
    costPerRun: 208,
    targetGenres: ['fps', 'shooter', 'military', 'survival'],
    minTier: 'STUDIO',
    outputCategory: 'weapon',
    qualityNote: 'High-detail FPS assault rifle with metallic PBR texture, iron sights, and fire recoil animation — viewmodel-ready.',
  },

  // ─── Obby Stage Pack ─────────────────────────────────────────────────────────
  {
    id: 'obby-stage-pack',
    name: 'Obby Stage Pack',
    description:
      'Generates a themed set of 6 essential obby obstacle types all sharing one atlas texture. Ultra-low polygon budget for 500+ instance placement without FPS drop.',
    tags: ['obby', 'obstacle', 'pack', 'atlas', 'ultra-low-poly'],
    steps: [
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'platform_flat', size: 6, theme: 'classic' },
        stepDescription: 'Model standard flat platform',
        optional: false,
      },
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'jump_pad', size: 4, theme: 'classic' },
        stepDescription: 'Model jump pad with bowl shape',
        optional: false,
      },
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'kill_brick_spike', size: 2, theme: 'classic' },
        stepDescription: 'Model spike kill brick cluster',
        optional: false,
      },
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'spinner_blade', size: 4, theme: 'classic' },
        stepDescription: 'Model rotating blade obstacle',
        optional: false,
      },
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'checkpoint_flag', size: 3, theme: 'classic' },
        stepDescription: 'Model checkpoint flag post',
        optional: false,
      },
      {
        agentId: 'obby-builder',
        paramOverrides: { obstacleType: 'portal_ring', size: 4, theme: 'classic' },
        stepDescription: 'Model portal ring teleporter',
        optional: false,
      },
      {
        agentId: 'stylized-texture-artist',
        paramOverrides: { resolution: '256', paletteSize: 5, saturation: 1.3 },
        stepDescription: 'Paint flat-shaded stylized texture pack for all 6 pieces',
        optional: false,
      },
      {
        agentId: 'atlas-packer',
        paramOverrides: { atlasSize: '512', margin: 0.02, includeMaps: false },
        stepDescription: 'Pack all 6 obstacle textures into 512×512 atlas',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'obby_pack.fbx' },
        stepDescription: 'Export 6-piece pack with shared atlas',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '3min 07s',
    costPerRun: 176,
    targetGenres: ['obby', 'parkour', 'adventure'],
    minTier: 'FREE',
    outputCategory: 'environment',
    qualityNote: '6-piece obby pack at < 300 tris each, sharing one 512×512 atlas — safe for 500+ instances without GPU impact.',
  },

  // ─── Roleplay Room ───────────────────────────────────────────────────────────
  {
    id: 'roleplay-room',
    name: 'Roleplay Room',
    description:
      'Generates a complete furnished room for roleplay games: bedroom model → atlas texture → export. 8-piece furniture set with consistent proportions and one shared texture for draw call efficiency.',
    tags: ['roleplay', 'furniture', 'interior', 'pack', 'atlas'],
    steps: [
      {
        agentId: 'roleplay-builder',
        paramOverrides: { roomType: 'bedroom_basic', pieceCount: 8, exportAsSet: false },
        stepDescription: 'Model 8 bedroom furniture pieces with correct R15 scale',
        optional: false,
      },
      {
        agentId: 'stylized-texture-artist',
        paramOverrides: { resolution: '512', paletteSize: 10, saturation: 1.1 },
        stepDescription: 'Paint warm stylized texture for bedroom furniture',
        optional: false,
      },
      {
        agentId: 'atlas-packer',
        paramOverrides: { atlasSize: '1024', margin: 0.01, includeMaps: false },
        stepDescription: 'Pack all 8 furniture textures into shared 1024 atlas',
        optional: false,
      },
      {
        agentId: 'fbx-exporter',
        paramOverrides: { includeAnimation: false, includeArmature: false, outputPath: 'bedroom_pack.fbx' },
        stepDescription: 'Export full bedroom pack',
        optional: false,
      },
    ],
    finalOutputFormat: 'fbx',
    estimatedTotalTime: '4min 30s',
    costPerRun: 132,
    targetGenres: ['roleplay', 'life sim', 'house tycoon'],
    minTier: 'CREATOR',
    outputCategory: 'furniture',
    qualityNote: '8-piece bedroom pack with shared 1024 atlas — consistent style, correct R15 seat heights, single draw call.',
  },
]

// ─── Lookup helpers ────────────────────────────────────────────────────────────

/** Returns a copy of the full chains registry */
export function getAllChains(): BlenderChain[] {
  return [...CHAINS]
}

/** Returns one chain by id, or undefined */
export function getChain(id: string): BlenderChain | undefined {
  return CHAINS.find((c) => c.id === id)
}

/** Returns all chains that target a specific Roblox genre */
export function getChainsByGenre(genre: string): BlenderChain[] {
  return CHAINS.filter((c) =>
    c.targetGenres.some((g) => g.toLowerCase() === genre.toLowerCase())
  )
}

/** Returns all chains available for a given subscription tier */
export function getChainsByTier(tier: 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'): BlenderChain[] {
  const order: Record<string, number> = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }
  return CHAINS.filter((c) => order[c.minTier] <= order[tier])
}

/** Returns chains within a cost budget */
export function getChainsByMaxCost(maxCost: number): BlenderChain[] {
  return CHAINS.filter((c) => c.costPerRun <= maxCost)
}

/**
 * Returns all unique agent ids used across all chains.
 * Useful for validating that every referenced agent exists in blender-registry.
 */
export function getAllReferencedAgentIds(): string[] {
  const ids = new Set<string>()
  for (const chain of CHAINS) {
    for (const step of chain.steps) {
      ids.add(step.agentId)
    }
  }
  return [...ids].sort()
}

/**
 * Validates that every agent id referenced in every chain resolves to a real
 * BlenderAgent in blender-registry.  Returns an array of broken references —
 * an empty array means the registry is consistent.
 */
export function validateChainIntegrity(): { chainId: string; missingAgentId: string }[] {
  const broken: { chainId: string; missingAgentId: string }[] = []
  for (const chain of CHAINS) {
    for (const step of chain.steps) {
      if (!getBlenderAgent(step.agentId)) {
        broken.push({ chainId: chain.id, missingAgentId: step.agentId })
      }
    }
  }
  return broken
}

/**
 * Returns a flat ordered list of BlenderAgent objects for a given chain,
 * resolving each step against blender-registry.
 * Steps whose agentId cannot be resolved are omitted.
 */
export function resolveChainAgents(chainId: string): BlenderAgent[] {
  const chain = getChain(chainId)
  if (!chain) return []
  return chain.steps
    .map((s) => getBlenderAgent(s.agentId))
    .filter((a): a is BlenderAgent => a !== undefined)
}

/**
 * Builds a human-readable summary string for a chain suitable for display
 * in the ForjeGames pipeline builder UI.
 */
export function chainSummary(chainId: string): string {
  const chain = getChain(chainId)
  if (!chain) return 'Chain not found'
  const stepNames = chain.steps
    .map((s) => {
      const agent = getBlenderAgent(s.agentId)
      return agent ? agent.name : s.agentId
    })
    .join(' → ')
  return `${chain.name} | ${chain.estimatedTotalTime} | ${chain.costPerRun} tokens | ${stepNames}`
}
