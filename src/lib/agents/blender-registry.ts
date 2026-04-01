/**
 * Blender agent registry — 30+ specialized Blender/3D agents for the ForjeGames
 * asset pipeline.  Covers the full lifecycle from raw mesh to Roblox-ready export.
 *
 * Design rules (same as registry.ts):
 *  - Pure data module: no API calls, no side effects at import time
 *  - All bpy operations are exact Python API paths (bpy.ops.*, bpy.context.*, bpy.data.*)
 *  - estimatedTime reflects headless Blender 4.x on a modern CPU, no GPU acceleration assumed
 *  - Roblox constraints are hard limits, not targets
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlenderOutputFormat = 'fbx' | 'obj' | 'glb' | 'blend' | 'png'

export type BlenderCategory =
  | 'modeling'
  | 'texturing'
  | 'rigging'
  | 'animation'
  | 'export'
  | 'optimization'
  | 'terrain'
  | 'character'
  | 'vehicle'
  | 'building'
  | 'weapon'
  | 'furniture'
  | 'environment'
  | 'effect'

export type BlenderAgentModel = 'claude-sonnet' | 'claude-haiku'

/** A single named parameter the agent accepts as input */
export interface BlenderInputParam {
  /** Machine-readable key */
  key: string
  /** Human-readable label shown in the ForjeGames UI */
  label: string
  type: 'string' | 'number' | 'boolean' | 'enum'
  /** Allowed values when type === 'enum' */
  options?: string[]
  defaultValue?: string | number | boolean
  description: string
}

/** Hard Roblox platform constraints this agent must respect */
export interface RobloxConstraints {
  /** Maximum triangle count for the final mesh */
  maxTriangles: number
  /** Maximum texture dimension in pixels (square) */
  maxTexturePx: number
  /** Maximum file size in KB for the exported asset */
  maxFileSizeKb: number
  /** Additional platform notes */
  notes: string[]
}

export interface BlenderAgent {
  id: string
  name: string
  description: string
  /** Human-readable capability tags for routing and search */
  capabilities: string[]
  /** Exact bpy Python operations this agent executes, in execution order */
  blenderOperations: string[]
  /** Input parameters the agent accepts */
  inputParams: BlenderInputParam[]
  outputFormat: BlenderOutputFormat
  /** Expected time to complete in headless Blender on a modern CPU */
  estimatedTime: string
  category: BlenderCategory
  /** Roblox-specific hard constraints the agent enforces */
  robloxConstraints: RobloxConstraints
  /**
   * Suggested next agents in a pipeline.
   * The orchestrator uses this to propose chains automatically.
   */
  defaultChain: string[]
  /** Minimum ForjeGames subscription tier required */
  minTier: 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'
  /** Estimated ForjeGames platform token cost for a single call */
  costPerCall: number
  model: BlenderAgentModel
  /**
   * Approximate output file size range.
   * Used to warn users before long operations.
   */
  outputSizeRange: string
}

// ─── Registry data ────────────────────────────────────────────────────────────

const BLENDER_REGISTRY: BlenderAgent[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // MODELING (10)
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 'mesh-sculptor',
    name: 'Mesh Sculptor',
    description:
      'Creates organic shapes — trees, rocks, boulders, terrain pieces, creatures — using Blender sculpt mode followed by automatic retopology to a clean low-poly mesh. Ideal for natural environment assets.',
    capabilities: ['organic', 'sculpt', 'tree', 'rock', 'boulder', 'creature', 'nature', 'terrain', 'retopo', 'lowpoly'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_uv_sphere_add()',
      'bpy.ops.object.mode_set(mode="SCULPT")',
      'bpy.ops.sculpt.dynamic_topology_toggle()',
      'bpy.context.scene.tool_settings.sculpt.detail_size = 4',
      'bpy.ops.sculpt.brush_stroke()',            // driven by agent prompt interpretation
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="REMESH")',
      'bpy.context.object.modifiers["Remesh"].mode = "SMOOTH"',
      'bpy.context.object.modifiers["Remesh"].octree_depth = 6',
      'bpy.ops.object.modifier_apply(modifier="Remesh")',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.3',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
    ],
    inputParams: [
      { key: 'shape', label: 'Shape Type', type: 'enum', options: ['tree', 'rock', 'boulder', 'coral', 'mushroom', 'stump', 'log', 'crystal', 'vine', 'generic'], defaultValue: 'rock', description: 'Base shape archetype to start sculpt from' },
      { key: 'polyTarget', label: 'Target Polygon Count', type: 'number', defaultValue: 800, description: 'Final triangle count after retopo (max 4000 for Roblox)' },
      { key: 'style', label: 'Art Style', type: 'enum', options: ['realistic', 'stylized', 'cartoony', 'low-poly-flat'], defaultValue: 'stylized', description: 'Visual style influencing sculpt detail level' },
      { key: 'scale', label: 'Real-world Scale (studs)', type: 'number', defaultValue: 5, description: '1 Roblox stud = 0.28m; this sets the bounding box width' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '45s',
    category: 'modeling',
    robloxConstraints: {
      maxTriangles: 4000,
      maxTexturePx: 1024,
      maxFileSizeKb: 512,
      notes: ['Roblox importer rejects meshes with >10 000 triangles per MeshPart', 'Avoid n-gons — triangulate before export'],
    },
    defaultChain: ['pbr-texture-artist', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 55,
    model: 'claude-sonnet',
    outputSizeRange: '80 KB – 300 KB',
  },

  {
    id: 'hard-surface-modeler',
    name: 'Hard Surface Modeler',
    description:
      'Builds mechanical and architectural hard-surface assets — buildings, crates, barrels, machinery, sci-fi panels — using box modeling with loop cuts, bevels, and subdivision. Outputs clean topology with flat normals.',
    capabilities: ['hard surface', 'box modeling', 'building', 'vehicle', 'weapon', 'furniture', 'machinery', 'sci-fi', 'bevel', 'subdivision'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide()',
      'bpy.ops.mesh.bevel(offset=0.05, segments=2)',
      'bpy.ops.mesh.extrude_region_move()',
      'bpy.ops.mesh.inset_faces(thickness=0.02)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="SUBSURF")',
      'bpy.context.object.modifiers["Subdivision"].levels = 1',
      'bpy.ops.object.modifier_apply(modifier="Subdivision")',
      'bpy.ops.object.modifier_add(type="WEIGHTED_NORMAL")',
      'bpy.ops.object.modifier_apply(modifier="WeightedNormal")',
    ],
    inputParams: [
      { key: 'assetType', label: 'Asset Type', type: 'enum', options: ['crate', 'barrel', 'wall_panel', 'door', 'window_frame', 'pillar', 'fence', 'table', 'shelf', 'container', 'generic'], defaultValue: 'crate', description: 'Hard surface archetype' },
      { key: 'detailLevel', label: 'Detail Level', type: 'enum', options: ['game_ready', 'mid_poly', 'high_poly'], defaultValue: 'game_ready', description: 'game_ready targets <2000 tris, high_poly up to 8000' },
      { key: 'width', label: 'Width (studs)', type: 'number', defaultValue: 4, description: 'Bounding box width in Roblox studs' },
      { key: 'height', label: 'Height (studs)', type: 'number', defaultValue: 4, description: 'Bounding box height in Roblox studs' },
      { key: 'depth', label: 'Depth (studs)', type: 'number', defaultValue: 4, description: 'Bounding box depth in Roblox studs' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '30s',
    category: 'modeling',
    robloxConstraints: {
      maxTriangles: 2000,
      maxTexturePx: 1024,
      maxFileSizeKb: 256,
      notes: ['Use flat shading for stylized Roblox look', 'Avoid sub-1-stud detail — invisible at normal play distance'],
    },
    defaultChain: ['uv-unwrapper', 'pbr-texture-artist', 'fbx-exporter'],
    minTier: 'HOBBY',
    costPerCall: 40,
    model: 'claude-sonnet',
    outputSizeRange: '40 KB – 180 KB',
  },

  {
    id: 'architectural-modeler',
    name: 'Architectural Modeler',
    description:
      'Builds houses, castles, towers, bridges, walls, and dungeons with correct proportions and modular connectors so pieces tile seamlessly in Roblox. Maintains consistent stud-grid alignment.',
    capabilities: ['architecture', 'house', 'castle', 'tower', 'bridge', 'wall', 'dungeon', 'modular', 'building', 'structure'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide()',
      'bpy.ops.mesh.extrude_region_move()',
      'bpy.ops.mesh.edge_face_add()',
      'bpy.ops.mesh.merge_normals()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="ARRAY")',
      'bpy.context.object.modifiers["Array"].count = 1',
      'bpy.ops.object.modifier_add(type="MIRROR")',
      'bpy.ops.object.modifier_apply(modifier="Mirror")',
      'bpy.ops.object.modifier_apply(modifier="Array")',
    ],
    inputParams: [
      { key: 'buildingType', label: 'Building Type', type: 'enum', options: ['house', 'castle_wall', 'tower', 'bridge', 'ruin', 'dungeon_room', 'gate', 'stairs', 'arch', 'balcony'], defaultValue: 'house', description: 'Architecture type to generate' },
      { key: 'stories', label: 'Number of Stories', type: 'number', defaultValue: 1, description: 'Floor count (each ~8 studs tall)' },
      { key: 'footprintW', label: 'Footprint Width (studs)', type: 'number', defaultValue: 16, description: 'Width on the stud grid' },
      { key: 'footprintD', label: 'Footprint Depth (studs)', type: 'number', defaultValue: 16, description: 'Depth on the stud grid' },
      { key: 'roofStyle', label: 'Roof Style', type: 'enum', options: ['flat', 'gabled', 'hip', 'tower_conical', 'crenellated', 'none'], defaultValue: 'gabled', description: 'Roof geometry type' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '1min',
    category: 'building',
    robloxConstraints: {
      maxTriangles: 5000,
      maxTexturePx: 2048,
      maxFileSizeKb: 600,
      notes: ['Snap all verts to 1-stud grid for seamless tiling', 'Keep door openings 4 studs wide × 7 studs tall for R15 characters'],
    },
    defaultChain: ['uv-unwrapper', 'pbr-texture-artist', 'polygon-optimizer', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 65,
    model: 'claude-sonnet',
    outputSizeRange: '120 KB – 500 KB',
  },

  {
    id: 'vehicle-modeler',
    name: 'Vehicle Modeler',
    description:
      'Models cars, trucks, boats, planes, and karts with separated wheel meshes, interior detail, and proper pivot points for constraint-based Roblox vehicle scripts.',
    capabilities: ['vehicle', 'car', 'truck', 'boat', 'plane', 'kart', 'wheel', 'interior', 'pivot'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide()',
      'bpy.ops.mesh.bevel(offset=0.08, segments=3)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.mesh.primitive_cylinder_add()',           // wheels
      'bpy.context.object.rotation_euler[1] = 1.5708',  // 90° for wheel orientation
      'bpy.ops.object.duplicate_move()',                 // 4 wheel copies
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY")',
      'bpy.ops.object.parent_set(type="OBJECT")',
      'bpy.ops.object.modifier_add(type="MIRROR")',
      'bpy.ops.object.modifier_apply(modifier="Mirror")',
    ],
    inputParams: [
      { key: 'vehicleType', label: 'Vehicle Type', type: 'enum', options: ['car', 'truck', 'sports_car', 'kart', 'boat', 'speedboat', 'plane', 'helicopter', 'bus', 'motorbike'], defaultValue: 'car', description: 'Vehicle archetype' },
      { key: 'hasInterior', label: 'Include Interior', type: 'boolean', defaultValue: false, description: 'Add seats, dashboard, steering wheel' },
      { key: 'wheelCount', label: 'Wheel Count', type: 'number', defaultValue: 4, description: '2 (motorbike), 4 (car), 6 (truck)' },
      { key: 'length', label: 'Length (studs)', type: 'number', defaultValue: 14, description: 'Vehicle length bumper to bumper' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '2min',
    category: 'vehicle',
    robloxConstraints: {
      maxTriangles: 6000,
      maxTexturePx: 1024,
      maxFileSizeKb: 512,
      notes: ['Export wheels as separate child meshes — Roblox VehicleSeat expects HingeConstraint on each axle', 'Body pivot at center-bottom of chassis', 'Keep overall width < 8 studs so vehicle fits standard roads'],
    },
    defaultChain: ['custom-rigger', 'pbr-texture-artist', 'collision-generator', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 75,
    model: 'claude-sonnet',
    outputSizeRange: '150 KB – 600 KB',
  },

  {
    id: 'character-modeler',
    name: 'Character Modeler',
    description:
      'Models R15-compatible humanoid characters with correct limb proportions, separated body parts (Head, UpperTorso, LowerTorso, LeftUpperArm, etc.), and attachment points matching Roblox R15 spec.',
    capabilities: ['character', 'humanoid', 'r15', 'avatar', 'npc', 'body', 'limb', 'attachment'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5)',   // Head
      'bpy.ops.mesh.primitive_cube_add(size=1)',            // UpperTorso
      'bpy.context.object.scale = (0.9, 0.55, 0.65)',
      'bpy.ops.mesh.primitive_cube_add()',                  // LowerTorso
      'bpy.context.object.scale = (0.9, 0.55, 0.45)',
      'bpy.ops.mesh.primitive_cylinder_add(radius=0.22)',   // UpperArm
      'bpy.ops.object.duplicate_move()',                    // x4 for all limbs
      'bpy.ops.object.modifier_add(type="SUBSURF")',
      'bpy.context.object.modifiers["Subdivision"].levels = 1',
      'bpy.ops.object.modifier_apply(modifier="Subdivision")',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY")',
      'bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)',
    ],
    inputParams: [
      { key: 'style', label: 'Character Style', type: 'enum', options: ['blocky_roblox', 'rounded', 'realistic', 'chibi', 'robot', 'alien', 'skeleton'], defaultValue: 'blocky_roblox', description: 'Body proportion and silhouette style' },
      { key: 'gender', label: 'Base Proportions', type: 'enum', options: ['neutral', 'masculine', 'feminine', 'child'], defaultValue: 'neutral', description: 'Proportion preset (not cosmetic)' },
      { key: 'armor', label: 'Include Armor Layer', type: 'boolean', defaultValue: false, description: 'Add separate armor mesh on top of base body' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '1min 30s',
    category: 'character',
    robloxConstraints: {
      maxTriangles: 3000,
      maxTexturePx: 1024,
      maxFileSizeKb: 400,
      notes: [
        'Each R15 body part must be a separate mesh named exactly: Head, UpperTorso, LowerTorso, LeftUpperArm, RightUpperArm, LeftLowerArm, RightLowerArm, LeftHand, RightHand, LeftUpperLeg, RightUpperLeg, LeftLowerLeg, RightLowerLeg, LeftFoot, RightFoot',
        'RootPart attachment must be at 0,0,0',
        'Character height should be ~5 studs for correct R15 scale',
      ],
    },
    defaultChain: ['r15-rigger', 'pbr-texture-artist', 'walk-cycle-animator', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 80,
    model: 'claude-sonnet',
    outputSizeRange: '100 KB – 400 KB',
  },

  {
    id: 'weapon-modeler',
    name: 'Weapon Modeler',
    description:
      'Models swords, guns, staffs, shields, and bows with correct grip positions, proper pivot points at handle base, and clean silhouettes optimized for Roblox Tool objects.',
    capabilities: ['weapon', 'sword', 'gun', 'staff', 'shield', 'bow', 'axe', 'dagger', 'hammer', 'wand', 'grip'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide(number_cuts=4)',
      'bpy.ops.mesh.extrude_region_move()',
      'bpy.ops.mesh.bevel(offset=0.04, segments=2)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.origin_set(type="ORIGIN_CURSOR")',   // cursor placed at grip base
      'bpy.context.scene.cursor.location = (0, 0, 0)',
      'bpy.ops.object.modifier_add(type="MIRROR")',
      'bpy.context.object.modifiers["Mirror"].use_axis[0] = True',
      'bpy.ops.object.modifier_apply(modifier="Mirror")',
      'bpy.ops.mesh.normals_make_consistent(inside=False)',
    ],
    inputParams: [
      { key: 'weaponType', label: 'Weapon Type', type: 'enum', options: ['sword', 'greatsword', 'dagger', 'axe', 'hammer', 'staff', 'wand', 'gun_pistol', 'gun_rifle', 'bow', 'shield', 'spear', 'scythe'], defaultValue: 'sword', description: 'Weapon archetype' },
      { key: 'theme', label: 'Theme', type: 'enum', options: ['fantasy', 'sci-fi', 'medieval', 'modern', 'ancient', 'cursed', 'holy', 'elemental'], defaultValue: 'fantasy', description: 'Visual theme driving silhouette and surface details' },
      { key: 'handleLength', label: 'Handle Length (studs)', type: 'number', defaultValue: 2, description: 'Length of grip section' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '25s',
    category: 'weapon',
    robloxConstraints: {
      maxTriangles: 1500,
      maxTexturePx: 512,
      maxFileSizeKb: 150,
      notes: ['Origin must be at grip base so Roblox hand attachment aligns correctly', 'Blade edge should point along +Y axis when held', 'Avoid internal geometry — Roblox physics engine prefers convex hulls for hitbox generation'],
    },
    defaultChain: ['pbr-texture-artist', 'fbx-exporter'],
    minTier: 'HOBBY',
    costPerCall: 45,
    model: 'claude-sonnet',
    outputSizeRange: '30 KB – 120 KB',
  },

  {
    id: 'furniture-modeler',
    name: 'Furniture Modeler',
    description:
      'Models chairs, tables, beds, shelves, sofas, appliances, and decorative items for roleplay and tycoon games. Maintains consistent scale relative to R15 characters.',
    capabilities: ['furniture', 'chair', 'table', 'bed', 'shelf', 'sofa', 'couch', 'desk', 'lamp', 'wardrobe', 'appliance', 'roleplay', 'tycoon'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide(number_cuts=2)',
      'bpy.ops.mesh.inset_faces(thickness=0.05)',
      'bpy.ops.mesh.extrude_region_move()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="BEVEL")',
      'bpy.context.object.modifiers["Bevel"].width = 0.03',
      'bpy.context.object.modifiers["Bevel"].segments = 2',
      'bpy.ops.object.modifier_apply(modifier="Bevel")',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")',
    ],
    inputParams: [
      { key: 'furnitureType', label: 'Furniture Type', type: 'enum', options: ['chair', 'dining_chair', 'armchair', 'sofa', 'table_coffee', 'table_dining', 'bed_single', 'bed_double', 'shelf', 'bookcase', 'wardrobe', 'tv_stand', 'desk', 'lamp_floor', 'lamp_table', 'refrigerator', 'stove', 'sink', 'toilet', 'bathtub'], defaultValue: 'chair', description: 'Furniture piece to generate' },
      { key: 'style', label: 'Style', type: 'enum', options: ['modern', 'rustic', 'medieval', 'futuristic', 'kawaii', 'luxury'], defaultValue: 'modern', description: 'Aesthetic style' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '20s',
    category: 'furniture',
    robloxConstraints: {
      maxTriangles: 1200,
      maxTexturePx: 512,
      maxFileSizeKb: 120,
      notes: ['Seat surfaces should be 2.5 studs above ground for correct R15 sit height', 'Table tops at 4 studs', 'Keep geometry convex for accurate Roblox collision'],
    },
    defaultChain: ['stylized-texture-artist', 'fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 35,
    model: 'claude-haiku',
    outputSizeRange: '20 KB – 80 KB',
  },

  {
    id: 'prop-modeler',
    name: 'Prop Modeler',
    description:
      'Generates small game props: coins, gems, keys, potions, food items, signs, barrels, chests, and tools. Optimized for very low polygon counts since props appear in large quantities.',
    capabilities: ['prop', 'coin', 'gem', 'key', 'potion', 'food', 'sign', 'barrel', 'chest', 'tool', 'small item', 'collectible'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2)',   // gem / coin base
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.select_all(action="SELECT")',
      'bpy.ops.mesh.bevel(offset=0.1, segments=1, vertex_only=True)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.5',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
      'bpy.ops.object.shade_flat()',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")',
    ],
    inputParams: [
      { key: 'propType', label: 'Prop Type', type: 'enum', options: ['coin', 'gem', 'key', 'potion_small', 'potion_large', 'food_apple', 'food_bread', 'food_meat', 'sign_post', 'barrel', 'crate', 'chest_small', 'chest_large', 'scroll', 'book', 'lantern', 'candle', 'mushroom', 'flower_pot', 'bottle'], defaultValue: 'gem', description: 'Small prop type to generate' },
      { key: 'count', label: 'Variant Count', type: 'number', defaultValue: 1, description: 'How many prop variants to generate (1-5)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '8s',
    category: 'modeling',
    robloxConstraints: {
      maxTriangles: 400,
      maxTexturePx: 256,
      maxFileSizeKb: 40,
      notes: ['Coin/gem props often used 100+ at a time — absolute minimum polygon count is critical', 'Consider vertex-color-only workflow (no texture) for coins and gems to save texture memory'],
    },
    defaultChain: ['stylized-texture-artist', 'fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 15,
    model: 'claude-haiku',
    outputSizeRange: '5 KB – 30 KB',
  },

  {
    id: 'terrain-modeler',
    name: 'Terrain Piece Modeler',
    description:
      'Creates standalone landscape mesh pieces: cliff faces, cave entrances, rock arches, floating islands, and hill outcroppings for use as decorative MeshParts layered over Roblox Terrain.',
    capabilities: ['terrain', 'cliff', 'cave', 'arch', 'island', 'hill', 'outcrop', 'landscape', 'environment', 'natural'],
    blenderOperations: [
      'bpy.ops.mesh.landscape_add()',           // A.N.T Landscape addon
      'bpy.context.scene.ant_landscape.mesh_size_x = 20',
      'bpy.context.scene.ant_landscape.mesh_size_y = 20',
      'bpy.context.scene.ant_landscape.subdivision_x = 64',
      'bpy.context.scene.ant_landscape.noise_type = "STUCCI"',
      'bpy.ops.object.convert(target="MESH")',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.15',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
      'bpy.ops.mesh.normals_make_consistent(inside=False)',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")',
    ],
    inputParams: [
      { key: 'pieceType', label: 'Piece Type', type: 'enum', options: ['cliff_face', 'cliff_edge', 'cave_entrance', 'rock_arch', 'floating_island', 'hill_top', 'rocky_outcrop', 'waterfall_face', 'canyon_wall', 'plateau'], defaultValue: 'cliff_face', description: 'Terrain piece archetype' },
      { key: 'width', label: 'Width (studs)', type: 'number', defaultValue: 30, description: 'Piece width' },
      { key: 'height', label: 'Height (studs)', type: 'number', defaultValue: 20, description: 'Piece height' },
      { key: 'noiseScale', label: 'Surface Roughness', type: 'number', defaultValue: 0.5, description: '0.0 = smooth, 1.0 = very rough' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '35s',
    category: 'terrain',
    robloxConstraints: {
      maxTriangles: 3500,
      maxTexturePx: 2048,
      maxFileSizeKb: 400,
      notes: ['Terrain pieces sit atop Roblox native Terrain — ensure bottom face is flat for easy placement', 'Use CanCollide=false on decoration-only pieces to save physics budget'],
    },
    defaultChain: ['texture-baker', 'lod-generator', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 50,
    model: 'claude-sonnet',
    outputSizeRange: '60 KB – 300 KB',
  },

  {
    id: 'boolean-master',
    name: 'Boolean Master',
    description:
      'Creates complex shapes impossible to box-model by chaining union, difference, and intersection Boolean operations: arched windows, gear teeth, ornate frames, perforated panels, and interlocking pieces.',
    capabilities: ['boolean', 'union', 'difference', 'intersection', 'hole', 'cutout', 'arch', 'gear', 'ornate', 'complex', 'perforated'],
    blenderOperations: [
      'bpy.ops.object.modifier_add(type="BOOLEAN")',
      'bpy.context.object.modifiers["Boolean"].operation = "DIFFERENCE"',
      'bpy.context.object.modifiers["Boolean"].object = cutter_obj',
      'bpy.context.object.modifiers["Boolean"].solver = "EXACT"',
      'bpy.ops.object.modifier_apply(modifier="Boolean")',
      'bpy.ops.object.modifier_add(type="BOOLEAN")',
      'bpy.context.object.modifiers["Boolean"].operation = "UNION"',
      'bpy.ops.object.modifier_apply(modifier="Boolean")',
      'bpy.ops.mesh.remove_doubles(threshold=0.001)',
      'bpy.ops.mesh.normals_make_consistent(inside=False)',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
    ],
    inputParams: [
      { key: 'baseShape', label: 'Base Shape', type: 'enum', options: ['cube', 'cylinder', 'sphere', 'arch', 'frame'], defaultValue: 'cube', description: 'Starting geometry before boolean operations' },
      { key: 'operation', label: 'Primary Operation', type: 'enum', options: ['subtract_holes', 'add_details', 'combine_parts', 'arch_cutout', 'gear_teeth'], defaultValue: 'subtract_holes', description: 'Boolean strategy to apply' },
      { key: 'complexity', label: 'Operation Count', type: 'number', defaultValue: 2, description: 'Number of boolean operations to chain (1-6)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '50s',
    category: 'modeling',
    robloxConstraints: {
      maxTriangles: 4000,
      maxTexturePx: 1024,
      maxFileSizeKb: 400,
      notes: ['Boolean meshes often produce non-manifold edges — run Mesh > Cleanup > Fill Holes after each operation', 'Exact solver (bpy) required for clean results; Fast solver leaves artifacts'],
    },
    defaultChain: ['uv-unwrapper', 'pbr-texture-artist', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 60,
    model: 'claude-sonnet',
    outputSizeRange: '70 KB – 350 KB',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TEXTURING (5)
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 'pbr-texture-artist',
    name: 'PBR Texture Artist',
    description:
      'Generates full PBR texture sets (albedo, normal, roughness, metallic) using Blender shader nodes and baking. Outputs 4 PNG maps at the specified resolution, ready for Roblox SurfaceAppearance.',
    capabilities: ['pbr', 'texture', 'albedo', 'normal map', 'roughness', 'metallic', 'bake', 'surface appearance', 'material'],
    blenderOperations: [
      'bpy.ops.object.material_slot_add()',
      'mat = bpy.data.materials.new(name="PBR_Material")',
      'mat.use_nodes = True',
      'bpy.ops.node.add_node(type="ShaderNodeTexImage")',
      'bpy.ops.node.add_node(type="ShaderNodeNormalMap")',
      'bpy.ops.node.add_node(type="ShaderNodeBsdfPrincipled")',
      'bpy.context.scene.render.engine = "CYCLES"',
      'bpy.context.scene.cycles.samples = 64',
      'bpy.ops.object.bake(type="DIFFUSE")',
      'bpy.ops.object.bake(type="NORMAL")',
      'bpy.ops.object.bake(type="ROUGHNESS")',
      'bpy.ops.image.save_as(filepath="albedo.png")',
    ],
    inputParams: [
      { key: 'resolution', label: 'Texture Resolution', type: 'enum', options: ['256', '512', '1024', '2048'], defaultValue: '1024', description: 'Square texture size in pixels' },
      { key: 'material', label: 'Material Type', type: 'enum', options: ['wood', 'stone', 'metal', 'fabric', 'leather', 'plastic', 'glass', 'concrete', 'sand', 'grass', 'ice', 'lava', 'magic', 'painted_metal', 'rusty_metal', 'ceramic', 'bark', 'custom'], defaultValue: 'stone', description: 'Physical material to simulate' },
      { key: 'metallic', label: 'Metallic Value', type: 'number', defaultValue: 0, description: '0.0 = dielectric, 1.0 = full metal' },
      { key: 'roughness', label: 'Roughness Value', type: 'number', defaultValue: 0.7, description: '0.0 = mirror, 1.0 = fully rough' },
      { key: 'tileable', label: 'Tileable Texture', type: 'boolean', defaultValue: true, description: 'Whether texture should tile seamlessly' },
    ],
    outputFormat: 'png',
    estimatedTime: '1min 30s',
    category: 'texturing',
    robloxConstraints: {
      maxTriangles: 0,  // texturing agent, not mesh
      maxTexturePx: 1024,
      maxFileSizeKb: 512,
      notes: ['Roblox SurfaceAppearance supports AlbedoMap, NormalMap, RoughnessMap, MetalnessMap', 'Max texture upload = 1024px; 2048 requires SurfaceAppearance and streaming enabled', 'Normal maps must be OpenGL convention (green channel up)'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 50,
    model: 'claude-sonnet',
    outputSizeRange: '80 KB – 400 KB (4 maps total)',
  },

  {
    id: 'stylized-texture-artist',
    name: 'Stylized Texture Artist',
    description:
      'Creates flat/toon textures in the Roblox stylized art style: limited palette, no specular, sharp color bands, and hand-painted appearance. Faster and cheaper than PBR.',
    capabilities: ['stylized', 'toon', 'cartoon', 'flat shading', 'hand painted', 'low-fi', 'roblox style', 'cel shading', 'palette'],
    blenderOperations: [
      'bpy.ops.object.material_slot_add()',
      'mat = bpy.data.materials.new(name="Stylized")',
      'mat.use_nodes = True',
      'nodes = mat.node_tree.nodes',
      'bpy.ops.node.add_node(type="ShaderNodeTexImage")',
      'bpy.ops.node.add_node(type="ShaderNodeBsdfDiffuse")',    // no specular
      'bpy.context.scene.render.engine = "CYCLES"',
      'bpy.context.scene.cycles.samples = 16',                  // low samples for flat look
      'bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"})',
      'bpy.ops.image.save_as(filepath="diffuse.png")',
    ],
    inputParams: [
      { key: 'resolution', label: 'Texture Resolution', type: 'enum', options: ['128', '256', '512'], defaultValue: '256', description: 'Low resolution is intentional for Roblox style' },
      { key: 'paletteSize', label: 'Palette Colors', type: 'number', defaultValue: 8, description: 'Number of distinct colors (4-16)' },
      { key: 'saturation', label: 'Saturation Boost', type: 'number', defaultValue: 1.3, description: 'Color saturation multiplier (1.0 = neutral)' },
    ],
    outputFormat: 'png',
    estimatedTime: '20s',
    category: 'texturing',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 512,
      maxFileSizeKb: 80,
      notes: ['Stylized textures use Decal or Texture object in Roblox, not SurfaceAppearance', 'Avoid gradients — they compress poorly at low resolutions'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 20,
    model: 'claude-haiku',
    outputSizeRange: '5 KB – 60 KB',
  },

  {
    id: 'uv-unwrapper',
    name: 'UV Unwrapper',
    description:
      'Computes optimal UV unwraps for any mesh: smart project for mechanical assets, seam-based unwrap for organic shapes, and lightmap UV for baked assets. Minimises stretching and maximises texel density.',
    capabilities: ['uv', 'unwrap', 'seam', 'texel density', 'lightmap', 'smart project', 'atlas', 'stretching', 'uv layout'],
    blenderOperations: [
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.select_all(action="SELECT")',
      'bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)',
      'bpy.ops.uv.pack_islands(margin=0.01)',
      'bpy.ops.uv.average_islands_scale()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.mesh.uv_texture_add()',
      'bpy.ops.uv.export_layout(filepath="uv_layout.png", size=(1024, 1024))',
    ],
    inputParams: [
      { key: 'method', label: 'Unwrap Method', type: 'enum', options: ['smart_project', 'seam_based', 'cube_projection', 'cylinder_projection', 'sphere_projection', 'lightmap'], defaultValue: 'smart_project', description: 'Unwrap algorithm to use' },
      { key: 'margin', label: 'Island Margin', type: 'number', defaultValue: 0.02, description: 'Pixel gap between UV islands (0.01-0.05)' },
      { key: 'texelDensity', label: 'Target Texel Density', type: 'number', defaultValue: 128, description: 'Texels per Roblox stud' },
    ],
    outputFormat: 'blend',
    estimatedTime: '10s',
    category: 'texturing',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 1024,
      maxFileSizeKb: 0,
      notes: ['Roblox uses UV channel 0 for texture mapping', 'UV channel 1 used for SurfaceAppearance lightmap baking'],
    },
    defaultChain: ['pbr-texture-artist'],
    minTier: 'HOBBY',
    costPerCall: 15,
    model: 'claude-haiku',
    outputSizeRange: 'In-place .blend modification',
  },

  {
    id: 'texture-baker',
    name: 'Texture Baker',
    description:
      'Bakes high-poly mesh detail (normal, AO, cavity, curvature) down to a low-poly mesh normal map so Roblox gets visual detail without the polygon cost.',
    capabilities: ['bake', 'high to low', 'normal bake', 'ao bake', 'cavity', 'curvature', 'detail transfer', 'projection'],
    blenderOperations: [
      'bpy.context.scene.render.engine = "CYCLES"',
      'bpy.context.scene.cycles.device = "CPU"',
      'bpy.context.scene.cycles.samples = 128',
      'bpy.ops.object.bake(type="NORMAL", use_selected_to_active=True, cage_extrusion=0.05)',
      'bpy.ops.object.bake(type="AO", use_selected_to_active=True)',
      'bpy.ops.object.bake(type="COMBINED", use_selected_to_active=True)',
      'bpy.ops.image.save_as(filepath="baked_normal.png")',
      'bpy.ops.image.save_as(filepath="baked_ao.png")',
    ],
    inputParams: [
      { key: 'bakeTypes', label: 'Maps to Bake', type: 'enum', options: ['normal_only', 'normal_and_ao', 'full_pbr', 'combined_diffuse'], defaultValue: 'normal_and_ao', description: 'Which texture channels to bake' },
      { key: 'resolution', label: 'Bake Resolution', type: 'enum', options: ['512', '1024', '2048'], defaultValue: '1024', description: 'Output texture resolution' },
      { key: 'cageExtrusion', label: 'Cage Extrusion', type: 'number', defaultValue: 0.05, description: 'Ray-cast distance from low-poly surface in meters' },
      { key: 'samples', label: 'Cycle Samples', type: 'number', defaultValue: 64, description: 'Rendering samples per pixel (higher = less noise, slower)' },
    ],
    outputFormat: 'png',
    estimatedTime: '3min',
    category: 'texturing',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 1024,
      maxFileSizeKb: 512,
      notes: ['Baking requires both high-poly and low-poly meshes in the same .blend scene', 'Normal maps use OpenGL convention — Roblox SurfaceAppearance expects this format'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 45,
    model: 'claude-sonnet',
    outputSizeRange: '100 KB – 500 KB',
  },

  {
    id: 'material-library',
    name: 'Material Library',
    description:
      'Applies pre-built materials from a 100+ entry library: wood planks, cobblestone, marble, rusted metal, fabric, leather, glass, ice, lava, and more. No baking required — references pre-made PBR maps.',
    capabilities: ['material', 'preset', 'library', 'wood', 'stone', 'metal', 'fabric', 'glass', 'ice', 'lava', 'marble', 'cobblestone'],
    blenderOperations: [
      'bpy.ops.wm.append(directory="//MaterialLibrary.blend/Material/", filename="WoodPlanks_01")',
      'bpy.context.object.active_material = bpy.data.materials["WoodPlanks_01"]',
      'bpy.ops.node.add_node(type="ShaderNodeMapping")',
      'node_mapping.inputs["Scale"].default_value = (scale_x, scale_y, 1)',
      'bpy.ops.object.bake(type="DIFFUSE")',
      'bpy.ops.image.save_as(filepath="output_albedo.png")',
    ],
    inputParams: [
      { key: 'materialName', label: 'Material Name', type: 'enum', options: ['WoodPlanks', 'CobblestoneMoss', 'MarbleWhite', 'MarbleBlack', 'RustedMetal', 'PolishedMetal', 'GoldMetal', 'SilverMetal', 'RedBrick', 'GraniteDark', 'SandDry', 'MudWet', 'GrassDry', 'GrassLush', 'SnowPacked', 'IceSmooth', 'LavaGlowing', 'WaterShallow', 'FabricRough', 'LeatherBrown', 'ConcreteCracked', 'TileFloor', 'GlassPlain', 'CrystalBlue', 'CrystalPurple'], defaultValue: 'WoodPlanks', description: 'Preset material from library' },
      { key: 'scale', label: 'Tiling Scale', type: 'number', defaultValue: 1.0, description: 'UV tiling multiplier (0.5 = larger tiles, 2.0 = smaller tiles)' },
    ],
    outputFormat: 'png',
    estimatedTime: '15s',
    category: 'texturing',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 1024,
      maxFileSizeKb: 256,
      notes: ['All library materials are pre-cleared for Roblox upload (no DMCA issues)', 'Library materials include albedo + normal — roughness/metallic optional'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 12,
    model: 'claude-haiku',
    outputSizeRange: '40 KB – 200 KB',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // RIGGING & ANIMATION (5)
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 'r15-rigger',
    name: 'R15 Rigger',
    description:
      'Sets up an R15-compatible armature with exactly the correct bone hierarchy, naming, and rest pose matching Roblox R15 spec. Adds Motor6D-equivalent attachment points for direct Roblox import.',
    capabilities: ['r15', 'rig', 'armature', 'bone', 'humanoid', 'motor6d', 'attachment', 'character', 'avatar'],
    blenderOperations: [
      'bpy.ops.object.armature_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.armature.bone_primitive_add(name="RootPart")',
      'bpy.ops.armature.bone_primitive_add(name="HumanoidRootPart")',
      'bpy.ops.armature.bone_primitive_add(name="LowerTorso")',
      'bpy.ops.armature.bone_primitive_add(name="UpperTorso")',
      'bpy.ops.armature.bone_primitive_add(name="Head")',
      'bpy.ops.armature.parent_set(type="CONNECTED")',
      'bpy.ops.object.mode_set(mode="POSE")',
      'bpy.ops.object.parent_set(type="ARMATURE_AUTO")',
      'bpy.ops.pose.armature_apply()',
    ],
    inputParams: [
      { key: 'autoWeight', label: 'Auto Weight Paint', type: 'boolean', defaultValue: true, description: 'Run automatic vertex weight assignment after rigging' },
      { key: 'includeFingers', label: 'Include Finger Bones', type: 'boolean', defaultValue: false, description: 'Add individual finger bones (expensive, rarely needed for Roblox)' },
      { key: 'addIK', label: 'Add IK Constraints', type: 'boolean', defaultValue: false, description: 'Add Inverse Kinematics for animator convenience (stripped on export)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '40s',
    category: 'rigging',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: [
        'Bone names must match Roblox R15 part names exactly',
        'Bind pose must be T-pose at rest',
        'FBX export: use BIN_FBX format, Armature → Include Armature = true, Add Leaf Bones = false',
      ],
    },
    defaultChain: ['walk-cycle-animator', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 55,
    model: 'claude-sonnet',
    outputSizeRange: 'In-place .blend modification',
  },

  {
    id: 'custom-rigger',
    name: 'Custom Rigger',
    description:
      'Rigs any non-humanoid model: vehicles, creatures, mechanical props, and creatures with non-standard bone counts. Uses Blender\'s Rigify or manual bone placement guided by the model\'s articulation needs.',
    capabilities: ['custom rig', 'creature', 'vehicle rig', 'mechanical', 'non-humanoid', 'quadruped', 'wing', 'tail', 'tentacle', 'articulation'],
    blenderOperations: [
      'bpy.ops.object.armature_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.armature.bone_primitive_add()',
      'bpy.ops.armature.extrude_move()',
      'bpy.ops.armature.symmetrize()',
      'bpy.ops.object.mode_set(mode="POSE")',
      'bpy.ops.pose.constraint_add(type="COPY_ROTATION")',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.parent_set(type="ARMATURE_AUTO")',
      'bpy.ops.object.vertex_group_clean(group_select_mode="ALL", limit=0.01)',
    ],
    inputParams: [
      { key: 'rigType', label: 'Rig Type', type: 'enum', options: ['quadruped', 'bird', 'fish', 'dragon', 'vehicle_wheeled', 'vehicle_tracked', 'spider', 'snake', 'mechanical_arm', 'custom'], defaultValue: 'quadruped', description: 'Articulation type to rig' },
      { key: 'boneCount', label: 'Approximate Bone Count', type: 'number', defaultValue: 12, description: 'Target number of bones (keep low for Roblox)' },
      { key: 'useRigify', label: 'Use Rigify Meta-Rig', type: 'boolean', defaultValue: false, description: 'Use Rigify addon for advanced IK/FK setup' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '2min',
    category: 'rigging',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Roblox AnimationController supports custom bone hierarchies', 'Motor6D joints drive bone animation in-engine — FBX bones map to these at import', 'Keep bone count ≤ 60 for reliable Roblox import'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 65,
    model: 'claude-sonnet',
    outputSizeRange: 'In-place .blend modification',
  },

  {
    id: 'walk-cycle-animator',
    name: 'Walk Cycle Animator',
    description:
      'Generates walk, run, and idle animations for R15 or custom rigs using Blender\'s action editor. Outputs keyframed FBX animations compatible with Roblox AnimationTrack.',
    capabilities: ['walk cycle', 'run cycle', 'idle', 'animation', 'locomotion', 'keyframe', 'action', 'r15 animation'],
    blenderOperations: [
      'bpy.ops.action.new()',
      'bpy.context.object.animation_data.action.name = "WalkCycle"',
      'bpy.ops.object.mode_set(mode="POSE")',
      'bpy.ops.pose.select_all(action="SELECT")',
      'bpy.context.scene.frame_set(0)',
      'bpy.ops.pose.rot_clear()',
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(15)',                            // mid-stride
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(30)',                            // full cycle
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.ops.graph.interpolation_type(type="BEZIER")',
    ],
    inputParams: [
      { key: 'animationType', label: 'Animation Type', type: 'enum', options: ['idle', 'walk', 'run', 'sprint', 'crouch_walk', 'swim', 'climb', 'jump', 'fall', 'land', 'all_locomotion'], defaultValue: 'walk', description: 'Animation to generate' },
      { key: 'frameRate', label: 'Frame Rate', type: 'number', defaultValue: 30, description: 'Animation FPS (Roblox default is 30)' },
      { key: 'cycleDuration', label: 'Cycle Frames', type: 'number', defaultValue: 30, description: 'Total frames for one full animation loop' },
      { key: 'bounceAmount', label: 'Bounce Exaggeration', type: 'number', defaultValue: 1.0, description: '0.5 = subtle, 2.0 = very cartoony bounce' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '45s',
    category: 'animation',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Roblox AnimationTrack plays back at 30 FPS by default', 'Export animation as separate FBX from mesh — Roblox imports animations and meshes separately', 'Looping animations must have identical first and last keyframes'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 60,
    model: 'claude-sonnet',
    outputSizeRange: '20 KB – 80 KB (animation FBX)',
  },

  {
    id: 'combat-animator',
    name: 'Combat Animator',
    description:
      'Creates attack, block, dodge, stagger, and death animations optimized for Roblox combat systems. Includes hit timing metadata so server scripts sync hitbox activation to keyframes.',
    capabilities: ['combat animation', 'attack', 'block', 'dodge', 'stagger', 'death', 'hit', 'swing', 'slash', 'punch', 'kick', 'cast'],
    blenderOperations: [
      'bpy.ops.action.new()',
      'bpy.context.object.animation_data.action.name = "Attack_01"',
      'bpy.ops.object.mode_set(mode="POSE")',
      'bpy.context.scene.frame_set(0)',
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(5)',    // wind-up
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(10)',   // impact frame — hitbox activates here
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(20)',   // recovery
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.ops.graph.interpolation_type(type="BACK")',  // snappy follow-through
    ],
    inputParams: [
      { key: 'combatType', label: 'Combat Type', type: 'enum', options: ['sword_slash', 'sword_stab', 'heavy_slam', 'punch_left', 'punch_right', 'kick', 'block_stand', 'dodge_roll', 'dodge_sidestep', 'stagger_hit', 'death_fall', 'magic_cast_hand', 'magic_cast_staff', 'shoot_arrow', 'shoot_gun'], defaultValue: 'sword_slash', description: 'Combat animation type' },
      { key: 'windUpFrames', label: 'Wind-Up Frames', type: 'number', defaultValue: 6, description: 'Frames before impact — longer = weightier feel' },
      { key: 'recoveryFrames', label: 'Recovery Frames', type: 'number', defaultValue: 12, description: 'Frames after impact — longer = more punishing cooldown' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '30s',
    category: 'animation',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Impact frame number must be documented in metadata so Lua hitbox script activates at the correct AnimationTrack:GetTimeOfKeyframe()', 'Keep total animation ≤ 30 frames for snappy combat feel'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 55,
    model: 'claude-sonnet',
    outputSizeRange: '15 KB – 50 KB',
  },

  {
    id: 'emote-animator',
    name: 'Emote Animator',
    description:
      'Creates expressive character emote animations: dances, waves, sits, laughs, points, cheers, and victory poses. Designed for Roblox emote systems and social gameplay.',
    capabilities: ['emote', 'dance', 'wave', 'sit', 'laugh', 'point', 'cheer', 'victory', 'social', 'expression', 'gesture'],
    blenderOperations: [
      'bpy.ops.action.new()',
      'bpy.context.object.animation_data.action.name = "Emote_Dance"',
      'bpy.ops.object.mode_set(mode="POSE")',
      'bpy.ops.pose.select_all(action="SELECT")',
      'bpy.context.scene.frame_end = 60',   // most emotes 2s at 30fps
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(15)',
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(30)',
      'bpy.ops.anim.keyframe_insert_menu(type="LocRotScale")',
      'bpy.context.scene.frame_set(60)',
      'bpy.ops.graph.interpolation_type(type="BEZIER")',
      'bpy.ops.graph.smooth()',
    ],
    inputParams: [
      { key: 'emoteType', label: 'Emote Type', type: 'enum', options: ['wave', 'dance_simple', 'dance_hype', 'sit_crossleg', 'sit_chair', 'laugh', 'point', 'cheer', 'thumbs_up', 'facepalm', 'shrug', 'flex', 'bow', 'salute', 'victory_arms'], defaultValue: 'wave', description: 'Emote archetype' },
      { key: 'looping', label: 'Looping', type: 'boolean', defaultValue: true, description: 'Whether emote loops or plays once' },
      { key: 'speedMultiplier', label: 'Speed Multiplier', type: 'number', defaultValue: 1.0, description: '0.5 = slow and dramatic, 2.0 = fast and energetic' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '35s',
    category: 'animation',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Emotes play via AnimationTrack with Looped=true or Looped=false', 'For sit emotes, HumanoidStateType must be set to Seated in server script', 'Roblox emote system uses specific AnimationId slots — document the emote name'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'HOBBY',
    costPerCall: 40,
    model: 'claude-haiku',
    outputSizeRange: '15 KB – 60 KB',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // EXPORT & OPTIMIZATION (5)
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 'polygon-optimizer',
    name: 'Polygon Optimizer',
    description:
      'Reduces triangle count using Decimate, Remesh, and manual topology cleanup while preserving silhouette and important surface detail. Targets a specified polygon budget.',
    capabilities: ['optimize', 'decimate', 'reduce', 'polygon count', 'triangle', 'retopo', 'lowpoly', 'budget', 'lod'],
    blenderOperations: [
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].decimate_type = "COLLAPSE"',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.5',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.remove_doubles(threshold=0.001)',
      'bpy.ops.mesh.dissolve_degenerate(threshold=0.001)',
      'bpy.ops.mesh.normals_make_consistent(inside=False)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'print(f"Final triangles: {sum(len(p.vertices) - 2 for p in bpy.context.object.data.polygons)}")',
    ],
    inputParams: [
      { key: 'targetTriangles', label: 'Target Triangle Count', type: 'number', defaultValue: 1500, description: 'Desired final triangle count' },
      { key: 'preserveTexture', label: 'Preserve UV Maps', type: 'boolean', defaultValue: true, description: 'Keep existing UV islands (may slightly degrade reduction quality)' },
      { key: 'aggressiveness', label: 'Aggressiveness', type: 'enum', options: ['gentle', 'moderate', 'aggressive'], defaultValue: 'moderate', description: 'Trade-off between quality and polygon reduction' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '15s',
    category: 'optimization',
    robloxConstraints: {
      maxTriangles: 10000,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Roblox hard cap: 10 000 triangles per MeshPart for non-skinned', '20 000 for SkinMeshes (character meshes)', 'Aim for ≤ 2000 tris for background props, ≤ 5000 for hero assets'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 20,
    model: 'claude-haiku',
    outputSizeRange: 'Reduces file by 30-80%',
  },

  {
    id: 'lod-generator',
    name: 'LOD Generator',
    description:
      'Creates 3 Level of Detail variants (LOD0, LOD1, LOD2) for a mesh at 100%, 35%, and 10% polygon counts. Used by Roblox streaming + custom LOD scripts to swap meshes based on camera distance.',
    capabilities: ['lod', 'level of detail', 'streaming', 'distance', 'performance', 'lod0', 'lod1', 'lod2', 'detail reduction'],
    blenderOperations: [
      'lod0 = bpy.context.object',
      'lod1 = lod0.copy(); bpy.context.collection.objects.link(lod1)',
      'bpy.context.view_layer.objects.active = lod1',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.35',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
      'lod2 = lod1.copy(); bpy.context.collection.objects.link(lod2)',
      'bpy.context.view_layer.objects.active = lod2',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.28',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
    ],
    inputParams: [
      { key: 'lod0Target', label: 'LOD0 Triangles (Full)', type: 'number', defaultValue: 2000, description: 'Full-detail count — shown within 30 studs' },
      { key: 'lod1Target', label: 'LOD1 Triangles (Mid)', type: 'number', defaultValue: 700, description: 'Mid-detail count — shown 30-100 studs' },
      { key: 'lod2Target', label: 'LOD2 Triangles (Far)', type: 'number', defaultValue: 200, description: 'Low-detail count — shown >100 studs' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '25s',
    category: 'optimization',
    robloxConstraints: {
      maxTriangles: 2000,
      maxTexturePx: 0,
      maxFileSizeKb: 0,
      notes: ['Roblox does not natively support LOD switching — LOD variants need a custom LocalScript using camera distance checks', 'Name variants: AssetName_LOD0, AssetName_LOD1, AssetName_LOD2'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 25,
    model: 'claude-haiku',
    outputSizeRange: '3 FBX files at 3 sizes',
  },

  {
    id: 'fbx-exporter',
    name: 'FBX Exporter',
    description:
      'Applies the exact Blender FBX export settings required for clean Roblox import: correct scale (0.01), triangulation, smooth normals, and forward/up axis alignment. Validates before export.',
    capabilities: ['export', 'fbx', 'roblox import', 'scale', 'axis', 'triangulate', 'bake animation', 'finalize'],
    blenderOperations: [
      'bpy.ops.object.select_all(action="SELECT")',
      'bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.quads_convert_to_tris()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.export_scene.fbx(',
      '  filepath=output_path,',
      '  use_selection=True,',
      '  global_scale=0.01,',          // Roblox expects 0.01 scale
      '  apply_unit_scale=True,',
      '  apply_scale_options="FBX_SCALE_ALL",',
      '  axis_forward="-Z",',          // Roblox forward axis
      '  axis_up="Y",',
      '  mesh_smooth_type="FACE",',
      '  use_triangles=True,',
      '  add_leaf_bones=False,',
      '  bake_anim=True,',
      '  bake_anim_simplify_factor=1.0',
      ')',
    ],
    inputParams: [
      { key: 'includeAnimation', label: 'Include Animations', type: 'boolean', defaultValue: false, description: 'Bake and include animation tracks in FBX' },
      { key: 'includeArmature', label: 'Include Armature', type: 'boolean', defaultValue: false, description: 'Export rigging skeleton with mesh' },
      { key: 'outputPath', label: 'Output Filename', type: 'string', defaultValue: 'asset.fbx', description: 'Output filename (no spaces, no special chars)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '5s',
    category: 'export',
    robloxConstraints: {
      maxTriangles: 10000,
      maxTexturePx: 1024,
      maxFileSizeKb: 4096,
      notes: ['Roblox FBX importer requires global_scale=0.01 — without this, meshes appear 100x too large', 'axis_forward="-Z", axis_up="Y" matches Roblox coordinate convention', 'FBX binary format (BIN_FBX) is preferred over ASCII — smaller file, faster import'],
    },
    defaultChain: [],
    minTier: 'FREE',
    costPerCall: 8,
    model: 'claude-haiku',
    outputSizeRange: 'Varies by mesh',
  },

  {
    id: 'collision-generator',
    name: 'Collision Generator',
    description:
      'Generates optimized convex hull or box collision meshes for complex visual meshes. Outputs separate low-poly collision geometry that Roblox uses for physics simulation while the visual mesh stays high detail.',
    capabilities: ['collision', 'convex hull', 'hitbox', 'physics', 'collider', 'bounding', 'decompose', 'v-hacd'],
    blenderOperations: [
      'bpy.ops.object.duplicate()',
      'bpy.context.object.name = "Collision_" + base_name',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.convex_hull()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.2',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
      'bpy.context.object.display_type = "WIRE"',
      'bpy.context.object.hide_render = True',
    ],
    inputParams: [
      { key: 'method', label: 'Collision Method', type: 'enum', options: ['convex_hull', 'box', 'cylinder', 'sphere', 'vhacd_decompose'], defaultValue: 'convex_hull', description: 'Collision shape strategy' },
      { key: 'maxHulls', label: 'Max Convex Hulls (V-HACD)', type: 'number', defaultValue: 4, description: 'For vhacd_decompose: number of convex sub-pieces (1 = single hull)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '12s',
    category: 'optimization',
    robloxConstraints: {
      maxTriangles: 200,
      maxTexturePx: 0,
      maxFileSizeKb: 30,
      notes: ['Roblox uses CollisionFidelity=Precise for MeshPart collision — a separate low-poly mesh keeps physics cheap', 'Collision mesh must be named [AssetName]_Collision to be recognized by import pipeline', 'Avoid concave collision shapes — use V-HACD decomposition instead'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'HOBBY',
    costPerCall: 18,
    model: 'claude-haiku',
    outputSizeRange: '5 KB – 25 KB',
  },

  {
    id: 'atlas-packer',
    name: 'Atlas Packer',
    description:
      'Combines multiple individual textures into a single power-of-two texture atlas. Reduces Roblox draw calls from N to 1 for asset groups that share materials.',
    capabilities: ['atlas', 'texture pack', 'sprite sheet', 'drawcall', 'combine', 'pack', 'uvs remap', 'batch'],
    blenderOperations: [
      'bpy.ops.object.select_all(action="SELECT")',
      'bpy.ops.object.join()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.uv.select_all(action="SELECT")',
      'bpy.ops.uv.pack_islands(margin=0.01)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.bake(type="DIFFUSE")',    // re-bake onto shared atlas UV
      'bpy.ops.image.resize(size=(2048, 2048))',
      'bpy.ops.image.save_as(filepath="texture_atlas.png")',
    ],
    inputParams: [
      { key: 'atlasSize', label: 'Atlas Size', type: 'enum', options: ['512', '1024', '2048'], defaultValue: '1024', description: 'Output atlas texture size (square)' },
      { key: 'margin', label: 'Island Margin', type: 'number', defaultValue: 0.01, description: 'Pixel gap between islands to prevent bleeding' },
      { key: 'includeMaps', label: 'Include Normal Map Atlas', type: 'boolean', defaultValue: false, description: 'Also produce a normal map atlas alongside albedo atlas' },
    ],
    outputFormat: 'png',
    estimatedTime: '45s',
    category: 'optimization',
    robloxConstraints: {
      maxTriangles: 0,
      maxTexturePx: 2048,
      maxFileSizeKb: 1024,
      notes: ['Atlasing reduces Roblox render draw calls — critical for tile-based levels with 50+ repeated props', 'Roblox max atlas: 2048×2048; all individual textures must fit within this'],
    },
    defaultChain: ['fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 30,
    model: 'claude-haiku',
    outputSizeRange: '100 KB – 800 KB',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SPECIALIZED GAME AGENTS (5+)
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: 'tycoon-asset-builder',
    name: 'Tycoon Asset Builder',
    description:
      'Models tycoon-specific mechanical assets: conveyor belts, droppers (item spawners), collectors, upgrade pads, cash registers, factory machines, and padlock purchase zones. All sized for correct tycoon grid placement.',
    capabilities: ['tycoon', 'conveyor', 'dropper', 'collector', 'upgrader', 'factory', 'cash register', 'padlock', 'purchase pad', 'machine'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide()',
      'bpy.ops.mesh.extrude_region_move()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="ARRAY")',
      'bpy.context.object.modifiers["Array"].count = 5',         // conveyor belt segments
      'bpy.context.object.modifiers["Array"].use_relative_offset = True',
      'bpy.ops.object.modifier_apply(modifier="Array")',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")',
    ],
    inputParams: [
      { key: 'assetType', label: 'Tycoon Asset', type: 'enum', options: ['conveyor_straight', 'conveyor_turn', 'dropper', 'collector_funnel', 'upgrade_pad', 'cash_register', 'padlock_door', 'factory_press', 'factory_mixer', 'storage_bin', 'purchase_button'], defaultValue: 'dropper', description: 'Tycoon machine type' },
      { key: 'theme', label: 'Theme', type: 'enum', options: ['generic_factory', 'pizza_kitchen', 'burger_restaurant', 'candy_factory', 'mining_operation', 'space_station', 'medieval_blacksmith', 'car_garage'], defaultValue: 'generic_factory', description: 'Visual theme of the tycoon' },
      { key: 'gridSize', label: 'Grid Size (studs)', type: 'number', defaultValue: 8, description: 'Snaps output to this grid unit for tycoon layout' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '30s',
    category: 'environment',
    robloxConstraints: {
      maxTriangles: 1500,
      maxTexturePx: 512,
      maxFileSizeKb: 150,
      notes: ['Tycoon assets appear 50-200x per game — aggressive polygon budget critical', 'Conveyor meshes must be sized in exact stud increments for seamless tiling'],
    },
    defaultChain: ['stylized-texture-artist', 'fbx-exporter'],
    minTier: 'HOBBY',
    costPerCall: 40,
    model: 'claude-haiku',
    outputSizeRange: '25 KB – 120 KB',
  },

  {
    id: 'obby-builder',
    name: 'Obby Builder',
    description:
      'Models obby-specific obstacle assets: jump pads, kill bricks, moving platforms, spinning blades, lava tiles, checkpoints, zip lines, and portals — all sized to standard Roblox stud grid.',
    capabilities: ['obby', 'obstacle', 'jump pad', 'kill brick', 'moving platform', 'spinner', 'checkpoint', 'lava', 'zip line', 'portal', 'obstacle course'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add(size=4)',    // standard 4-stud platform
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.bevel(offset=0.1, segments=2)',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.shade_smooth()',
      'bpy.ops.object.modifier_add(type="SOLIDIFY")',
      'bpy.context.object.modifiers["Solidify"].thickness = 0.3',
      'bpy.ops.object.modifier_apply(modifier="Solidify")',
      'bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")',
    ],
    inputParams: [
      { key: 'obstacleType', label: 'Obstacle Type', type: 'enum', options: ['platform_flat', 'platform_moving', 'platform_disappearing', 'jump_pad', 'kill_brick_flat', 'kill_brick_spike', 'spinner_blade', 'rotating_beam', 'checkpoint_arch', 'checkpoint_flag', 'lava_tile', 'ice_tile', 'sticky_tile', 'bounce_mushroom', 'zip_line_handle', 'portal_ring', 'conveyor_platform'], defaultValue: 'platform_flat', description: 'Obstacle archetype' },
      { key: 'size', label: 'Platform Size (studs)', type: 'number', defaultValue: 6, description: 'Width/depth of platform in Roblox studs' },
      { key: 'theme', label: 'Visual Theme', type: 'enum', options: ['classic', 'space', 'candy', 'lava_world', 'ice_world', 'jungle', 'neon_grid', 'medieval', 'underwater'], defaultValue: 'classic', description: 'Aesthetic theme' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '12s',
    category: 'environment',
    robloxConstraints: {
      maxTriangles: 300,
      maxTexturePx: 256,
      maxFileSizeKb: 30,
      notes: ['Obby platforms are instanced 500+ times — keep under 300 triangles absolutely', 'Kill bricks must be named correctly for BrickColor red convention and Touched event scripts'],
    },
    defaultChain: ['stylized-texture-artist', 'fbx-exporter'],
    minTier: 'FREE',
    costPerCall: 15,
    model: 'claude-haiku',
    outputSizeRange: '5 KB – 25 KB',
  },

  {
    id: 'simulator-asset-builder',
    name: 'Simulator Asset Builder',
    description:
      'Builds simulator game assets: pets (cats, dogs, dragons, mythicals), eggs of all rarities, backpacks/bags for carry capacity, area multiplier totems, and currency orbs. Outputs ready-to-animate separate meshes.',
    capabilities: ['simulator', 'pet', 'egg', 'backpack', 'multiplier', 'orb', 'currency', 'carry', 'rarity', 'hatch'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5)',    // egg base
      'bpy.ops.object.mode_set(mode="SCULPT")',
      'bpy.ops.sculpt.brush_stroke()',                       // add bumps/texture
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.modifier_add(type="SUBSURF")',
      'bpy.context.object.modifiers["Subdivision"].levels = 2',
      'bpy.ops.object.modifier_apply(modifier="Subdivision")',
      'bpy.ops.object.modifier_add(type="DECIMATE")',
      'bpy.context.object.modifiers["Decimate"].ratio = 0.4',
      'bpy.ops.object.modifier_apply(modifier="Decimate")',
    ],
    inputParams: [
      { key: 'assetType', label: 'Simulator Asset', type: 'enum', options: ['pet_cat', 'pet_dog', 'pet_bunny', 'pet_dragon', 'pet_phoenix', 'pet_unicorn', 'pet_ghost', 'pet_robot', 'egg_common', 'egg_rare', 'egg_epic', 'egg_legendary', 'egg_mythical', 'backpack_small', 'backpack_large', 'backpack_magical', 'multiplier_totem', 'orb_gold', 'orb_crystal', 'orb_dark'], defaultValue: 'egg_common', description: 'Simulator item type' },
      { key: 'style', label: 'Art Style', type: 'enum', options: ['cute_chibi', 'realistic', 'blocky_roblox', 'glowing_crystal', 'cosmic'], defaultValue: 'cute_chibi', description: 'Visual style matching target game aesthetic' },
      { key: 'glowEffect', label: 'Include Glow Geometry', type: 'boolean', defaultValue: false, description: 'Add transparent outer glow mesh (for legendary/mythical rarity)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '45s',
    category: 'character',
    robloxConstraints: {
      maxTriangles: 800,
      maxTexturePx: 512,
      maxFileSizeKb: 80,
      notes: ['Pets hover/follow player — keep under 800 tris; 50+ pets on screen simultaneously at peak', 'Eggs must have clean equator seam for hatch-open animation split', 'Separate glow mesh uses SurfaceAppearance Transparency for Roblox render'],
    },
    defaultChain: ['stylized-texture-artist', 'r15-rigger', 'walk-cycle-animator', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 55,
    model: 'claude-sonnet',
    outputSizeRange: '30 KB – 150 KB',
  },

  {
    id: 'roleplay-builder',
    name: 'Roleplay Builder',
    description:
      'Generates full room sets for roleplay games: complete bedroom, kitchen, living room, bathroom, and office asset packs. Each piece scales correctly to R15 characters and tiles with other pieces.',
    capabilities: ['roleplay', 'house', 'room', 'bedroom', 'kitchen', 'living room', 'bathroom', 'furniture set', 'interior'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_plane_add(size=20)',    // room floor
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.extrude_region_move()',           // walls
      'bpy.ops.mesh.loop_cut_and_slide()',            // window/door cuts
      'bpy.ops.mesh.face_split()',
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.object.join()',                        // combine into room shell
      'bpy.ops.object.origin_set(type="ORIGIN_CURSOR")',
      'bpy.context.scene.cursor.location = (0, 0, 0)',
    ],
    inputParams: [
      { key: 'roomType', label: 'Room Type', type: 'enum', options: ['bedroom_basic', 'bedroom_luxury', 'kitchen_modern', 'kitchen_rustic', 'living_room', 'bathroom', 'office', 'garage', 'nursery', 'game_room', 'dining_room'], defaultValue: 'bedroom_basic', description: 'Room type to generate as a furniture pack' },
      { key: 'pieceCount', label: 'Pieces in Set', type: 'number', defaultValue: 8, description: 'Number of furniture pieces in the pack (4-15)' },
      { key: 'exportAsSet', label: 'Export as Single File', type: 'boolean', defaultValue: false, description: 'Pack all pieces into one FBX vs individual files per piece' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '3min',
    category: 'furniture',
    robloxConstraints: {
      maxTriangles: 8000,
      maxTexturePx: 1024,
      maxFileSizeKb: 800,
      notes: ['Export individual pieces for flexibility (chairs, tables separately)', 'Verify R15 character fits: 6-stud ceiling clearance, 4-stud door openings', 'Roleplay games load rooms per player — set total pack budget carefully'],
    },
    defaultChain: ['stylized-texture-artist', 'atlas-packer', 'fbx-exporter'],
    minTier: 'CREATOR',
    costPerCall: 70,
    model: 'claude-sonnet',
    outputSizeRange: '200 KB – 800 KB (full pack)',
  },

  {
    id: 'fps-weapon-builder',
    name: 'FPS Weapon Builder',
    description:
      'Builds detailed FPS-view weapons with all visible components: receiver, barrel, magazine, scope rail, stock, and handle. Modeled for first-person view with correct sight lines and attachment socket positions.',
    capabilities: ['fps', 'gun', 'rifle', 'pistol', 'shotgun', 'sniper', 'attachment', 'scope', 'magazine', 'first person', 'viewmodel'],
    blenderOperations: [
      'bpy.ops.mesh.primitive_cube_add()',              // receiver block
      'bpy.ops.object.mode_set(mode="EDIT")',
      'bpy.ops.mesh.loop_cut_and_slide(number_cuts=8)',
      'bpy.ops.mesh.bevel(offset=0.03, segments=3)',
      'bpy.ops.mesh.extrude_region_move()',             // barrel extrusion
      'bpy.ops.object.mode_set(mode="OBJECT")',
      'bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.8)',  // barrel cylinder
      'bpy.ops.object.join()',
      'bpy.ops.object.modifier_add(type="MIRROR")',
      'bpy.ops.object.modifier_apply(modifier="Mirror")',
      'bpy.ops.object.origin_set(type="ORIGIN_CURSOR")',
    ],
    inputParams: [
      { key: 'weaponClass', label: 'Weapon Class', type: 'enum', options: ['pistol', 'revolver', 'smg', 'assault_rifle', 'battle_rifle', 'shotgun', 'sniper_rifle', 'lmg', 'dmr', 'rocket_launcher', 'crossbow', 'energy_rifle'], defaultValue: 'assault_rifle', description: 'FPS weapon category' },
      { key: 'attachments', label: 'Default Attachments', type: 'enum', options: ['none', 'iron_sights', 'red_dot', 'acog_scope', 'suppressor', 'foregrip', 'laser'], defaultValue: 'iron_sights', description: 'Pre-attached accessories to model' },
      { key: 'detailLevel', label: 'Detail Level', type: 'enum', options: ['worldmodel_low', 'viewmodel_high'], defaultValue: 'viewmodel_high', description: 'viewmodel_high = seen in first person (up to 5000 tris); worldmodel_low = dropped on ground (≤800 tris)' },
    ],
    outputFormat: 'fbx',
    estimatedTime: '2min 30s',
    category: 'weapon',
    robloxConstraints: {
      maxTriangles: 5000,
      maxTexturePx: 1024,
      maxFileSizeKb: 400,
      notes: ['FPS viewmodels only show the weapon and player arms — model only what is visible', 'Export magazine as separate mesh for reload animation', 'Muzzle flash attachment point must be at exact barrel tip (local origin at 0,barrel_length,0)'],
    },
    defaultChain: ['pbr-texture-artist', 'combat-animator', 'fbx-exporter'],
    minTier: 'STUDIO',
    costPerCall: 85,
    model: 'claude-sonnet',
    outputSizeRange: '150 KB – 500 KB',
  },
]

// ─── Lookup helpers ────────────────────────────────────────────────────────────

/** Returns a copy of the full Blender registry — never mutate the returned array */
export function getAllBlenderAgents(): BlenderAgent[] {
  return [...BLENDER_REGISTRY]
}

/** Returns one Blender agent by id, or undefined */
export function getBlenderAgent(id: string): BlenderAgent | undefined {
  return BLENDER_REGISTRY.find((a) => a.id === id)
}

/** Returns all Blender agents in a specific category */
export function getBlenderAgentsByCategory(category: BlenderCategory): BlenderAgent[] {
  return BLENDER_REGISTRY.filter((a) => a.category === category)
}

/** Returns all agents within a Roblox triangle budget */
export function getBlenderAgentsUnderTriBudget(maxTriangles: number): BlenderAgent[] {
  return BLENDER_REGISTRY.filter(
    (a) => a.robloxConstraints.maxTriangles === 0 || a.robloxConstraints.maxTriangles <= maxTriangles
  )
}

/** Returns agents that can output a specific format */
export function getBlenderAgentsByFormat(format: BlenderOutputFormat): BlenderAgent[] {
  return BLENDER_REGISTRY.filter((a) => a.outputFormat === format)
}

/** Returns the default pipeline chain for an agent as fully-resolved BlenderAgent objects */
export function resolveChain(agentId: string): BlenderAgent[] {
  const agent = getBlenderAgent(agentId)
  if (!agent) return []
  return agent.defaultChain
    .map((id) => getBlenderAgent(id))
    .filter((a): a is BlenderAgent => a !== undefined)
}

/** Estimated total token cost for an entire resolved chain starting from agentId */
export function estimateChainCost(agentId: string): number {
  const start = getBlenderAgent(agentId)
  if (!start) return 0
  const chain = resolveChain(agentId)
  return [start, ...chain].reduce((sum, a) => sum + a.costPerCall, 0)
}
