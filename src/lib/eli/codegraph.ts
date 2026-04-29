/**
 * CodeGraph — Persistent Build Knowledge Graph
 *
 * The AI's build brain. Maps relationships between components, materials,
 * techniques, and game mechanics. Persists to PostgreSQL so learning
 * survives deploys. Per-user profiles track what each user builds.
 *
 * Two layers:
 * 1. BOOTSTRAP — hardcoded architectural knowledge (seed data)
 * 2. LEARNED — from real builds, stored in DB per-user + global
 */

import 'server-only'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  type: 'category' | 'component' | 'material' | 'technique' | 'detail' | 'script_system' | 'game_mechanic'
  avgScore: number
  frequency: number
  buildHint?: string
}

export interface GraphEdge {
  from: string
  to: string
  relation: 'requires' | 'suggests' | 'pairs_with' | 'uses_material' | 'uses_technique' | 'needs_script' | 'contains'
  weight: number
}

export interface CodeGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  version: number
}

// ─── Bootstrap Knowledge ────────────────────────────────────────────────────

const BOOTSTRAP_NODES: GraphNode[] = [
  // Categories
  { id: 'house', label: 'House', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'castle', label: 'Castle', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'modern', label: 'Modern Building', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'medieval', label: 'Medieval', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'cottage', label: 'Cottage', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'mansion', label: 'Mansion', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'shop', label: 'Shop/Store', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'cabin', label: 'Cabin', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'map', label: 'Game Map/Scene', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'hub', label: 'Hub/Lobby', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'horror', label: 'Horror', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'rpg', label: 'RPG/Adventure', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'racing', label: 'Racing', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'tycoon', label: 'Tycoon', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'obby', label: 'Obby/Obstacle Course', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'simulator', label: 'Simulator', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'battleground', label: 'Battle Royale/Arena', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'restaurant', label: 'Restaurant/Cafe', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'school', label: 'School/Campus', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'spaceship', label: 'Spaceship/Station', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'pirate', label: 'Pirate Ship/Island', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'city', label: 'City/Town', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'farm', label: 'Farm/Ranch', type: 'category', avgScore: 0, frequency: 0 },

  // Components with build hints
  { id: 'foundation', label: 'Foundation', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Part, Concrete, size ~(wallLen+2, 0.8, wallDepth+2), ground level' },
  { id: 'baseboard', label: 'Baseboard Trim', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Thin Part 0.3 stud tall along wall base, Wood' },
  { id: 'crown_trim', label: 'Crown Trim', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Thin Part along ceiling edge, protruding' },
  { id: 'corner_post', label: 'Corner Posts', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '4 vertical 0.5xHx0.5 Parts at corners, darker' },
  { id: 'window_frame', label: 'Window Frame (4-piece)', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '4 Parts: top/bottom horizontal + 2 side verticals, 0.3 thick' },
  { id: 'window_mullion', label: 'Window Mullion', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'window_sill', label: 'Window Sill', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Horizontal Part below window, wider than frame, 0.2 thick' },
  { id: 'window_glass', label: 'Window Glass', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Part inside frame, Glass, Transparency 0.6' },
  { id: 'door_panel', label: 'Door Panel', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Part recessed 0.2 into wall, Wood, 4x7x0.3' },
  { id: 'door_frame', label: 'Door Frame', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '3 Parts U-shape around door, 0.3 thick' },
  { id: 'door_overhang', label: 'Door Overhang', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'door_knob', label: 'Door Knob', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Small Cylinder 0.3 diameter on door, Metal' },
  { id: 'front_steps', label: 'Front Steps', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '2-4 stacked Parts, each 0.4 tall, decreasing depth' },
  { id: 'gable_roof', label: 'Gable Roof', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '2 angled WedgeParts at ridge, Slate, overhang 1-2 studs' },
  { id: 'flat_roof', label: 'Flat Roof w/ Parapet', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'roof_ridge', label: 'Roof Ridge Beam', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'roof_fascia', label: 'Roof Fascia Board', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'chimney', label: 'Chimney', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Brick body 2x4x2 + wider cap + small Cylinder pot on top' },
  { id: 'porch', label: 'Porch w/ Columns', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Floor Part + 2-4 Cylinder columns + roof overhang' },
  { id: 'balcony', label: 'Balcony w/ Railing', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'pathway', label: 'Pathway', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Flat Parts door→street, alternating colors, Cobblestone' },
  { id: 'tree', label: 'Tree', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Cylinder trunk Brown 1x6x1 + Ball canopy Green size 5-8' },
  { id: 'lamp_post', label: 'Lamp Post', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Cylinder pole + Part head + PointLight(Brightness=1,Range=20)' },
  { id: 'fence', label: 'Fence', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Posts 0.3x3x0.3 every 4 studs + horizontal rails, Wood' },
  { id: 'interior_furniture', label: 'Interior Furniture', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'bookshelf', label: 'Bookshelf', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'ceiling_light', label: 'Ceiling Light', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Small Part on ceiling + PointLight(0.8, Range=15, warm)' },
  { id: 'shutters', label: 'Window Shutters', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'flower_box', label: 'Flower Box', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'tower', label: 'Tower', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'drawbridge', label: 'Drawbridge', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'courtyard', label: 'Courtyard', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'glass_wall', label: 'Glass Wall', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'garage', label: 'Garage', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'plaza', label: 'Central Plaza', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'fountain', label: 'Fountain', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Cylinder basin + center column + top bowl + ParticleEmitter' },
  { id: 'welcome_arch', label: 'Welcome Arch', type: 'component', avgScore: 0, frequency: 0,
    buildHint: '2 pillars + arch Part + SurfaceGui with game name' },
  { id: 'cobblestone_path', label: 'Cobblestone Path', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'bench', label: 'Bench', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'flower_bed', label: 'Flower Bed', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'bush', label: 'Bush/Shrub', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'signpost', label: 'Signpost', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'terrain_ground', label: 'Terrain Ground', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'workspace.Terrain:FillBlock(CFrame, size, Enum.Material.Grass)' },
  { id: 'water_feature', label: 'Pond/River', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'aaa_lighting', label: 'AAA Lighting', type: 'component', avgScore: 0, frequency: 0,
    buildHint: 'Atmosphere{Density=0.3} + BloomEffect{Intensity=0.3} + ColorCorrectionEffect' },
  { id: 'npc', label: 'NPC Character', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'spawn_point', label: 'Spawn Point', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'teleporter', label: 'Teleporter', type: 'component', avgScore: 0, frequency: 0 },

  // Game mechanics
  { id: 'tycoon_dropper', label: 'Tycoon Dropper', type: 'game_mechanic', avgScore: 0, frequency: 0,
    buildHint: 'Part spawns items on timer, clone from ServerStorage, drop onto conveyor' },
  { id: 'tycoon_conveyor', label: 'Tycoon Conveyor', type: 'game_mechanic', avgScore: 0, frequency: 0,
    buildHint: 'Part with BodyVelocity, moves items toward collector' },
  { id: 'tycoon_collector', label: 'Tycoon Collector', type: 'game_mechanic', avgScore: 0, frequency: 0,
    buildHint: 'Touched event destroys item + adds currency to leaderstats' },
  { id: 'tycoon_button', label: 'Tycoon Button', type: 'game_mechanic', avgScore: 0, frequency: 0,
    buildHint: 'BillboardGui price, Touched → check currency → unlock' },
  { id: 'obby_checkpoint', label: 'Obby Checkpoint', type: 'game_mechanic', avgScore: 0, frequency: 0 },
  { id: 'obby_killbrick', label: 'Kill Brick', type: 'game_mechanic', avgScore: 0, frequency: 0 },
  { id: 'obby_platform', label: 'Moving Platform', type: 'game_mechanic', avgScore: 0, frequency: 0,
    buildHint: 'TweenService back-and-forth, or disappearing with CanCollide toggle' },
  { id: 'leaderboard', label: 'Leaderboard', type: 'script_system', avgScore: 0, frequency: 0,
    buildHint: 'leaderstats Folder in Player, IntValue children' },
  { id: 'datastore', label: 'DataStore', type: 'script_system', avgScore: 0, frequency: 0,
    buildHint: 'pcall GetAsync on join, SetAsync on leave' },
  { id: 'shop_system', label: 'Shop System', type: 'script_system', avgScore: 0, frequency: 0,
    buildHint: 'RemoteEvent, server validates price+balance, ScrollingFrame GUI' },
  { id: 'combat_system', label: 'Combat', type: 'script_system', avgScore: 0, frequency: 0 },
  { id: 'inventory_system', label: 'Inventory', type: 'script_system', avgScore: 0, frequency: 0 },
  { id: 'pet_system', label: 'Pet System', type: 'script_system', avgScore: 0, frequency: 0 },

  // Materials
  { id: 'mat_brick', label: 'Brick', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_wood', label: 'Wood/WoodPlanks', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_concrete', label: 'Concrete', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_slate', label: 'Slate', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_glass', label: 'Glass', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_cobblestone', label: 'Cobblestone', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_granite', label: 'Granite', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_metal', label: 'Metal', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_neon', label: 'Neon', type: 'material', avgScore: 0, frequency: 0 },

  // Techniques
  { id: 'tech_vc', label: 'Color Variation', type: 'technique', avgScore: 0, frequency: 0,
    buildHint: 'rgb +/- random(0,15) per channel for organic look' },
  { id: 'tech_terrain', label: 'Terrain Ground', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_lighting', label: 'AAA Lighting', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_particles', label: 'Particle Effects', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_interactive', label: 'ProximityPrompt', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_sound', label: 'Sound Effects', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_animation', label: 'TweenService', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_for_loop', label: 'For-Loop Repetition', type: 'technique', avgScore: 0, frequency: 0 },

  // Details
  { id: 'detail_trim', label: 'Trim Details', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_overhang', label: 'Roof Overhang', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_landscaping', label: 'Landscaping', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_silhouette', label: 'Silhouette Breaking', type: 'detail', avgScore: 0, frequency: 0 },
]

const BOOTSTRAP_EDGES: GraphEdge[] = [
  // House
  { from: 'house', to: 'foundation', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'window_frame', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'window_glass', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'window_sill', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'door_frame', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'door_knob', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'gable_roof', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'ceiling_light', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'aaa_lighting', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'baseboard', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'crown_trim', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'corner_post', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'chimney', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'pathway', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'tree', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'interior_furniture', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'front_steps', relation: 'suggests', weight: 0.7 },
  // Cottage
  { from: 'cottage', to: 'house', relation: 'requires', weight: 1.0 },
  { from: 'cottage', to: 'chimney', relation: 'requires', weight: 0.9 },
  { from: 'cottage', to: 'flower_box', relation: 'suggests', weight: 0.7 },
  { from: 'cottage', to: 'shutters', relation: 'suggests', weight: 0.7 },
  // Castle
  { from: 'castle', to: 'tower', relation: 'requires', weight: 0.9 },
  { from: 'castle', to: 'foundation', relation: 'requires', weight: 0.9 },
  { from: 'castle', to: 'courtyard', relation: 'suggests', weight: 0.7 },
  { from: 'castle', to: 'drawbridge', relation: 'suggests', weight: 0.6 },
  { from: 'castle', to: 'aaa_lighting', relation: 'requires', weight: 0.8 },
  // Modern
  { from: 'modern', to: 'glass_wall', relation: 'suggests', weight: 0.8 },
  { from: 'modern', to: 'flat_roof', relation: 'suggests', weight: 0.7 },
  { from: 'modern', to: 'foundation', relation: 'requires', weight: 0.9 },
  { from: 'modern', to: 'aaa_lighting', relation: 'requires', weight: 0.8 },
  // Mansion
  { from: 'mansion', to: 'house', relation: 'requires', weight: 1.0 },
  { from: 'mansion', to: 'balcony', relation: 'suggests', weight: 0.8 },
  { from: 'mansion', to: 'porch', relation: 'requires', weight: 0.8 },
  // Map/Scene
  { from: 'map', to: 'plaza', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'cobblestone_path', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'lamp_post', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'tree', relation: 'requires', weight: 0.8 },
  { from: 'map', to: 'terrain_ground', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'aaa_lighting', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'spawn_point', relation: 'requires', weight: 0.9 },
  { from: 'map', to: 'fountain', relation: 'suggests', weight: 0.8 },
  { from: 'map', to: 'bench', relation: 'suggests', weight: 0.7 },
  { from: 'map', to: 'bush', relation: 'suggests', weight: 0.6 },
  // Hub
  { from: 'hub', to: 'map', relation: 'requires', weight: 1.0 },
  { from: 'hub', to: 'welcome_arch', relation: 'suggests', weight: 0.8 },
  { from: 'hub', to: 'teleporter', relation: 'suggests', weight: 0.8 },
  // Tycoon
  { from: 'tycoon', to: 'tycoon_dropper', relation: 'requires', weight: 0.95 },
  { from: 'tycoon', to: 'tycoon_conveyor', relation: 'requires', weight: 0.95 },
  { from: 'tycoon', to: 'tycoon_collector', relation: 'requires', weight: 0.95 },
  { from: 'tycoon', to: 'tycoon_button', relation: 'requires', weight: 0.9 },
  { from: 'tycoon', to: 'leaderboard', relation: 'requires', weight: 0.9 },
  { from: 'tycoon', to: 'datastore', relation: 'requires', weight: 0.9 },
  { from: 'tycoon', to: 'spawn_point', relation: 'requires', weight: 0.8 },
  // Obby
  { from: 'obby', to: 'obby_checkpoint', relation: 'requires', weight: 0.95 },
  { from: 'obby', to: 'obby_killbrick', relation: 'requires', weight: 0.9 },
  { from: 'obby', to: 'obby_platform', relation: 'requires', weight: 0.9 },
  { from: 'obby', to: 'datastore', relation: 'requires', weight: 0.8 },
  { from: 'obby', to: 'spawn_point', relation: 'requires', weight: 0.9 },
  // Simulator
  { from: 'simulator', to: 'leaderboard', relation: 'requires', weight: 0.9 },
  { from: 'simulator', to: 'datastore', relation: 'requires', weight: 0.9 },
  { from: 'simulator', to: 'shop_system', relation: 'suggests', weight: 0.8 },
  { from: 'simulator', to: 'pet_system', relation: 'suggests', weight: 0.7 },
  // Materials
  { from: 'house', to: 'mat_brick', relation: 'uses_material', weight: 0.8 },
  { from: 'house', to: 'mat_wood', relation: 'uses_material', weight: 0.9 },
  { from: 'house', to: 'mat_concrete', relation: 'uses_material', weight: 0.7 },
  { from: 'house', to: 'mat_glass', relation: 'uses_material', weight: 0.8 },
  { from: 'castle', to: 'mat_cobblestone', relation: 'uses_material', weight: 0.9 },
  { from: 'castle', to: 'mat_granite', relation: 'uses_material', weight: 0.7 },
  { from: 'modern', to: 'mat_concrete', relation: 'uses_material', weight: 0.9 },
  { from: 'modern', to: 'mat_glass', relation: 'uses_material', weight: 0.9 },
  { from: 'tycoon', to: 'mat_metal', relation: 'uses_material', weight: 0.8 },
  { from: 'pirate', to: 'mat_wood', relation: 'uses_material', weight: 0.9 },
  { from: 'spaceship', to: 'mat_metal', relation: 'uses_material', weight: 0.9 },
  { from: 'spaceship', to: 'mat_neon', relation: 'uses_material', weight: 0.8 },
  // Techniques
  { from: 'house', to: 'tech_vc', relation: 'uses_technique', weight: 0.9 },
  { from: 'house', to: 'tech_lighting', relation: 'uses_technique', weight: 0.8 },
  { from: 'tycoon', to: 'tech_for_loop', relation: 'uses_technique', weight: 0.9 },
  { from: 'tycoon', to: 'tech_interactive', relation: 'uses_technique', weight: 0.9 },
  { from: 'obby', to: 'tech_animation', relation: 'uses_technique', weight: 0.9 },
  { from: 'horror', to: 'tech_sound', relation: 'uses_technique', weight: 0.9 },
  { from: 'horror', to: 'tech_lighting', relation: 'uses_technique', weight: 0.9 },
  // Details
  { from: 'baseboard', to: 'detail_trim', relation: 'pairs_with', weight: 0.9 },
  { from: 'crown_trim', to: 'detail_trim', relation: 'pairs_with', weight: 0.9 },
  { from: 'roof_fascia', to: 'detail_overhang', relation: 'pairs_with', weight: 0.9 },
  { from: 'pathway', to: 'detail_landscaping', relation: 'pairs_with', weight: 0.8 },
  { from: 'tree', to: 'detail_landscaping', relation: 'pairs_with', weight: 0.8 },
  { from: 'chimney', to: 'detail_silhouette', relation: 'pairs_with', weight: 0.7 },
  { from: 'balcony', to: 'detail_silhouette', relation: 'pairs_with', weight: 0.8 },
]

// ─── Singleton ──────────────────────────────────────────────────────────────

let graph: CodeGraph | null = null
let _dbTableReady = false

export function getCodeGraph(): CodeGraph {
  if (graph) return graph
  const nodes = new Map<string, GraphNode>()
  for (const node of BOOTSTRAP_NODES) nodes.set(node.id, { ...node })
  graph = { nodes, edges: [...BOOTSTRAP_EDGES], version: 1 }
  void hydrateFromDb().catch(() => {})
  return graph
}

// ─── DB Persistence ─────────────────────────────────────────────────────────

async function ensureDbTable(): Promise<void> {
  if (_dbTableReady) return
  try {
    const { getDb } = await import('../db')
    const db = getDb()
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS codegraph_nodes (
        id TEXT PRIMARY KEY,
        avg_score REAL DEFAULT 0,
        frequency INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS codegraph_user_builds (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        components TEXT[] DEFAULT '{}',
        score REAL DEFAULT 0,
        prompt TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_cg_ub_user ON codegraph_user_builds(user_id)`)
    _dbTableReady = true
  } catch (err) {
    console.warn('[CodeGraph] DB init failed:', err instanceof Error ? err.message : err)
  }
}

async function hydrateFromDb(): Promise<void> {
  await ensureDbTable()
  try {
    const { getDb } = await import('../db')
    const rows = await getDb().$queryRawUnsafe<Array<{ id: string; avg_score: number; frequency: number }>>(
      `SELECT id, avg_score, frequency FROM codegraph_nodes`
    )
    const g = getCodeGraph()
    for (const row of rows) {
      const node = g.nodes.get(row.id)
      if (node) { node.avgScore = row.avg_score; node.frequency = row.frequency }
    }
    if (rows.length > 0) console.log(`[CodeGraph] Hydrated ${rows.length} learned nodes from DB`)
  } catch { /* bootstrap data is fine */ }
}

async function persistNode(id: string, avgScore: number, frequency: number): Promise<void> {
  await ensureDbTable()
  try {
    const { getDb } = await import('../db')
    await getDb().$executeRawUnsafe(
      `INSERT INTO codegraph_nodes (id, avg_score, frequency, updated_at) VALUES ($1,$2,$3,now())
       ON CONFLICT (id) DO UPDATE SET avg_score=$2, frequency=$3, updated_at=now()`,
      id, avgScore, frequency
    )
  } catch { /* non-blocking */ }
}

async function persistUserBuild(userId: string, category: string, components: string[], score: number, prompt: string): Promise<void> {
  await ensureDbTable()
  try {
    const { getDb } = await import('../db')
    await getDb().$executeRawUnsafe(
      `INSERT INTO codegraph_user_builds (user_id,category,components,score,prompt,created_at) VALUES ($1,$2,$3,$4,$5,now())`,
      userId, category, components, score, prompt.slice(0, 500)
    )
  } catch { /* non-blocking */ }
}

// ─── Query Helpers ──────────────────────────────────────────────────────────

export function getComponentsForCategory(category: string): Array<{ node: GraphNode; relation: string; weight: number }> {
  const g = getCodeGraph()
  const results: Array<{ node: GraphNode; relation: string; weight: number }> = []

  for (const edge of g.edges) {
    if (edge.from === category && (edge.relation === 'requires' || edge.relation === 'suggests')) {
      const target = g.nodes.get(edge.to)
      if (target && target.type !== 'category') {
        results.push({ node: target, relation: edge.relation, weight: edge.weight })
      }
    }
  }

  // Inherit parent category components
  for (const edge of g.edges) {
    if (edge.from === category && edge.relation === 'requires') {
      const target = g.nodes.get(edge.to)
      if (target?.type === 'category') {
        for (const pc of getComponentsForCategory(edge.to)) {
          if (!results.some(r => r.node.id === pc.node.id)) {
            results.push({ ...pc, weight: pc.weight * edge.weight })
          }
        }
      }
    }
  }

  return results.sort((a, b) => b.weight - a.weight)
}

export function getMaterialsForCategory(category: string): string[] {
  const g = getCodeGraph()
  return g.edges
    .filter(e => e.from === category && e.relation === 'uses_material')
    .sort((a, b) => b.weight - a.weight)
    .map(e => g.nodes.get(e.to)?.label ?? '')
    .filter(Boolean)
}

export function getTechniquesForCategory(category: string): Array<{ label: string; hint: string }> {
  const g = getCodeGraph()
  return g.edges
    .filter(e => e.from === category && e.relation === 'uses_technique')
    .sort((a, b) => b.weight - a.weight)
    .map(e => { const n = g.nodes.get(e.to); return n ? { label: n.label, hint: n.buildHint ?? '' } : null })
    .filter((x): x is { label: string; hint: string } => x !== null)
}

export function detectCategory(userPrompt: string): string | null {
  const lower = userPrompt.toLowerCase()
  if (/\b(tycoon|factory)\b/.test(lower)) return 'tycoon'
  if (/\b(obby|obstacle|parkour)\b/.test(lower)) return 'obby'
  if (/\b(simulator|sim)\b/.test(lower)) return 'simulator'
  if (/\b(battle.*royal|arena|pvp)\b/.test(lower)) return 'battleground'
  if (/\b(game\s*map|lobby|spawn|scene|environment)\b/.test(lower)) return 'map'
  if (/\b(hub|central\s*hub)\b/.test(lower)) return 'hub'
  if (/\b(city|town|village)\b/.test(lower)) return 'city'
  if (/\b(farm|ranch|barn)\b/.test(lower)) return 'farm'
  if (/\b(space|spaceship|station)\b/.test(lower)) return 'spaceship'
  if (/\b(pirate|ship|sailing)\b/.test(lower)) return 'pirate'
  if (/\b(horror|haunted|spooky|scary)\b/.test(lower)) return 'horror'
  if (/\b(rpg|adventure|quest)\b/.test(lower)) return 'rpg'
  if (/\b(racing|race|track)\b/.test(lower)) return 'racing'
  if (/\b(restaurant|cafe|diner)\b/.test(lower)) return 'restaurant'
  if (/\b(school|campus)\b/.test(lower)) return 'school'
  if (/\b(cottage|cozy|rustic)\b/.test(lower)) return 'cottage'
  if (/\b(mansion|luxury|villa)\b/.test(lower)) return 'mansion'
  if (/\b(castle|fortress)\b/.test(lower)) return 'castle'
  if (/\b(modern|contemporary|minimalist)\b/.test(lower)) return 'modern'
  if (/\b(medieval|timber)\b/.test(lower)) return 'medieval'
  if (/\b(cabin|lodge)\b/.test(lower)) return 'cabin'
  if (/\b(shop|store|market)\b/.test(lower)) return 'shop'
  if (/\b(house|home|building|residence)\b/.test(lower)) return 'house'
  return null
}

/**
 * Format the graph's knowledge as a comprehensive build intelligence injection.
 * This is what makes builds smart — component lists, build hints, materials, techniques.
 */
export function formatGraphPrompt(userPrompt: string): string {
  const category = detectCategory(userPrompt)
  if (!category) return ''

  const components = getComponentsForCategory(category)
  const materials = getMaterialsForCategory(category)
  const techniques = getTechniquesForCategory(category)
  if (components.length === 0) return ''

  const required = components.filter(c => c.relation === 'requires')
  const suggested = components.filter(c => c.relation === 'suggests')

  const parts: string[] = []
  parts.push(`\n[CODEGRAPH] Build type: ${category.toUpperCase()}`)

  if (required.length) {
    parts.push(`\nREQUIRED (include ALL):`)
    for (const c of required) {
      const hint = c.node.buildHint ? ` → ${c.node.buildHint}` : ''
      const score = c.node.avgScore > 0 ? ` [quality: ${Math.round(c.node.avgScore)}]` : ''
      parts.push(`  - ${c.node.label}${hint}${score}`)
    }
  }

  if (suggested.length) {
    parts.push(`\nSUGGESTED (add for quality):`)
    for (const c of suggested) {
      const hint = c.node.buildHint ? ` → ${c.node.buildHint}` : ''
      parts.push(`  - ${c.node.label}${hint}`)
    }
  }

  if (materials.length) {
    parts.push(`\nMaterials: ${materials.join(', ')} — NEVER SmoothPlastic/Plastic`)
  }

  if (techniques.length) {
    parts.push(`\nTechniques: ${techniques.map(t => `${t.label}${t.hint ? ': ' + t.hint : ''}`).join('; ')}`)
  }

  return parts.join('\n')
}

/**
 * Per-user build profile for personalized AI.
 */
export async function formatUserBuildProfile(userId: string): Promise<string> {
  await ensureDbTable()
  try {
    const { getDb } = await import('../db')
    const rows = await getDb().$queryRawUnsafe<Array<{ category: string; cnt: string; avg_score: number }>>(
      `SELECT category, COUNT(*) as cnt, AVG(score) as avg_score
       FROM codegraph_user_builds WHERE user_id=$1 GROUP BY category ORDER BY cnt DESC LIMIT 10`,
      userId
    )
    if (rows.length === 0) return ''
    const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0)
    return `\n[USER PROFILE] ${total} past builds. Favorites: ${rows.map(r => `${r.category}(${r.cnt}x, avg ${Math.round(r.avg_score)}/100)`).join(', ')}\n`
  } catch { return '' }
}

// ─── Learning ───────────────────────────────────────────────────────────────

export function recordBuildSuccess(category: string, detectedComponents: string[], score: number, userId?: string, prompt?: string): void {
  const g = getCodeGraph()

  const catNode = g.nodes.get(category)
  if (catNode) {
    catNode.frequency++
    catNode.avgScore = (catNode.avgScore * (catNode.frequency - 1) + score) / catNode.frequency
    void persistNode(category, catNode.avgScore, catNode.frequency)
  }

  for (const comp of detectedComponents) {
    const node = g.nodes.get(comp)
    if (node) {
      node.frequency++
      node.avgScore = (node.avgScore * (node.frequency - 1) + score) / node.frequency
      void persistNode(comp, node.avgScore, node.frequency)
    }
  }

  if (userId) void persistUserBuild(userId, category, detectedComponents, score, prompt ?? '')
}

export function detectComponentsInCode(code: string): string[] {
  const lower = code.toLowerCase()
  const found: string[] = []
  const detectors: Array<[string, RegExp]> = [
    ['foundation', /foundation/], ['baseboard', /baseboard/], ['crown_trim', /crown|molding/],
    ['corner_post', /corner.*(?:post|pillar)/], ['window_frame', /win.*frame|frame.*win/],
    ['window_sill', /sill/], ['window_glass', /glass.*transparency/i],
    ['door_panel', /door.*panel/], ['door_frame', /door.*frame/], ['door_knob', /knob|handle/],
    ['front_steps', /step|stair/], ['gable_roof', /wedgepart|W\(/i],
    ['chimney', /chimney/], ['porch', /porch/], ['balcony', /balcony|railing/],
    ['pathway', /path|walkway/], ['tree', /trunk.*canopy|tree/],
    ['lamp_post', /lamp.*post|lamppost/], ['fence', /fence|hedge/],
    ['interior_furniture', /table|chair|couch|bed|desk/],
    ['ceiling_light', /pointlight|spotlight/i], ['shutters', /shutter/],
    ['glass_wall', /glass.*wall/], ['garage', /garage/],
    ['plaza', /plaza|hub.*base/], ['fountain', /fountain/],
    ['welcome_arch', /welcome.*arch|entrance.*arch/],
    ['cobblestone_path', /cobblestone.*path/], ['bench', /bench/],
    ['bush', /bush/], ['signpost', /surfacegui.*sign/i],
    ['terrain_ground', /terrain.*fill/i], ['water_feature', /fillblock.*water/i],
    ['aaa_lighting', /atmosphere|bloomeffect|colorcorrection/i],
    ['npc', /proximityprompt/i], ['spawn_point', /spawnlocation/i],
    ['tycoon_dropper', /dropper|clone.*item/i], ['tycoon_conveyor', /conveyor/i],
    ['tycoon_collector', /collector/i], ['tycoon_button', /purchase.*button|unlock/i],
    ['obby_checkpoint', /checkpoint|stage.*spawn/i], ['obby_killbrick', /kill.*brick|lava/i],
    ['obby_platform', /moving.*platform|disappear/i],
    ['leaderboard', /leaderstats/i], ['datastore', /datastoreservice|getasync/i],
    ['shop_system', /shop.*gui|remoteevent.*buy/i], ['combat_system', /takedamage|hitbox/i],
  ]
  for (const [id, regex] of detectors) if (regex.test(lower)) found.push(id)
  return found
}

/**
 * Summarize conversation into a structured build spec for Plan→Build handoff.
 */
export function summarizeConversationForBuild(messages: Array<{ role: string; content: string }>): string {
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content)
  const allText = messages.map(m => m.content).join(' ')
  if (userMsgs.length === 0) return ''

  const category = detectCategory(allText)
  const parts: string[] = []

  parts.push(`[PLAN→BUILD HANDOFF] Build EXACTLY what the user described in ${userMsgs.length} messages.`)
  parts.push('')
  parts.push(`USER'S VISION (in their words):`)
  for (let i = 0; i < userMsgs.length; i++) {
    parts.push(`  ${i + 1}. "${userMsgs[i].slice(0, 300)}"`)
  }

  if (category) {
    parts.push('')
    parts.push(formatGraphPrompt(allText))
  }

  // Extract specific details
  const colors = allText.match(/\b(red|blue|green|yellow|purple|orange|pink|black|white|gold|silver|brown|dark|light|bright|neon)\b/gi)
  if (colors?.length) parts.push(`\nColors: ${[...new Set(colors)].join(', ')}`)

  const sizes = allText.match(/\b(big|small|huge|tiny|massive|large|medium|tall|short|wide|giant|mini)\b/gi)
  if (sizes?.length) parts.push(`Sizes: ${[...new Set(sizes)].join(', ')}`)

  parts.push('')
  parts.push(`CRITICAL: Build something UNIQUE. Every detail the user mentioned MUST appear. No templates. No generic builds.`)

  return parts.join('\n')
}
