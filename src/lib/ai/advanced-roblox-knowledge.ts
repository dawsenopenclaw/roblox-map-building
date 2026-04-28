/**
 * advanced-roblox-knowledge.ts
 * Massive advanced Roblox development knowledge base.
 *
 * This is KNOWLEDGE, not code templates. It teaches the AI professional
 * Roblox development techniques that separate amateur builds from
 * front-page game builds.
 *
 * Sections:
 *   1. Advanced Building Techniques (mesh, surface, constraints, CFrame, terrain, lighting)
 *   2. Advanced Scripting Architecture (modules, client-server, DataStore, state machines, events)
 *   3. Exploit Prevention (every common exploit and countermeasure)
 *   4. Performance Optimization (part count, pooling, streaming, profiling)
 *   5. Professional Visual Effects (particles, beams, trails, screen effects, camera)
 *   6. Sound Design Deep-Dive (spatial audio, groups, music, ambient, material footsteps)
 *   7. Monetization Best Practices (GamePass, DevProducts, Premium, MarketplaceService)
 *
 * Injected into AI prompts for complex builds and advanced scripting tasks.
 */

export const ADVANCED_ROBLOX_KNOWLEDGE: string = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 1: ADVANCED BUILDING TECHNIQUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Professional Roblox builders use a toolbox far beyond simple Part placement.
This section covers the advanced geometry, surfacing, constraint, math, terrain,
and lighting techniques that make builds indistinguishable from front-page games.

────────────────────────────────────────────────────────────────────────────────
1.1 MESH-BASED DETAIL — When to Use What
────────────────────────────────────────────────────────────────────────────────

Three mesh types exist. Choosing the right one matters enormously:

PART (BasePart):
  The workhorse. Use for walls, floors, slabs, trim strips, structural geometry.
  Shape options: Block (default), Ball (sphere), Cylinder, Wedge, CornerWedge.
  Fastest render, lowest memory, best collision. Always the first choice.
  Use WedgeParts for slopes, ramps, pitched roofs, angled trim.
  Use CornerWedgeParts for hip-roof corners and diagonal transitions.
  Cylinders orient along the Y axis by default — rotate 90 degrees with
  CFrame.Angles(0, 0, math.rad(90)) for horizontal pipes and poles.
  Ball shapes for domes, sphere tops, rounded finials, decorative orbs.

SPECIALMESH (inside a Part):
  Reshapes a Part's visual without changing its collision box. The collision
  stays as the original Part shape. This is key for performance — complex
  visuals with simple collision.

  MeshType options and when to use each:
    Sphere — organic shapes (bushes, clouds, body parts, rounded boulders,
             balloon clusters, fruit). Scale non-uniformly for oval shapes:
             Scale = Vector3.new(1.5, 0.8, 1.2) on a 4x4x4 Part creates
             a flattened ellipsoid perfect for bushes or mushroom caps.
    Cylinder — pipes, poles, pillars, smokestacks, telescope tubes, well walls,
               cannon barrels, log cross-sections. Scale X stretches length,
               Y and Z control cross-section oval shape.
    Head — rounded box. Perfect for TV screens, monitor housings, suitcases,
           cushions, loaf-of-bread shapes, treasure chests lids, pill shapes.
           Gives a soft bevel to what would otherwise be a sharp-edged block.
    Wedge — slopes, ramps, angled surfaces, saw-tooth roofs, display stands.
            Same as WedgePart visually but allows SpecialMesh Scale override.
    Block — default. Rarely needed since Part is already a block. Use only
            when you need non-uniform Scale that distorts from the Part size.
    Brick — subtly rounded edges. Use for actual bricks, cobblestones,
            rounded-edge furniture, wooden blocks, crates that look worn.
            The rounding is slight but prevents the razor-sharp CG look.
    Torso — old R6 torso shape. Rarely used except for NPC construction.
    FileMesh — loads a custom .mesh file from a Roblox asset ID. Use for:
               complex organic shapes (animal heads, weapon models, vehicle
               bodies, decorative elements) that cannot be built from
               primitives. Set MeshId = "rbxassetid://XXXXX" and optionally
               TextureId for the diffuse texture. Scale and Offset let you
               resize and reposition the mesh within the Part's bounds.

  NON-UNIFORM SCALING TRICKS:
    A 2x2x2 Part with SpecialMesh Scale (3, 0.5, 3) = flat wide disc.
    A 1x4x1 Part with SpecialMesh Sphere Scale (1, 1.5, 1) = tall oval egg.
    A 1x1x1 Part with SpecialMesh Cylinder Scale (6, 1, 1) = long thin rod.
    Tapered columns: two Parts stacked — bottom wider (Scale 1.2,1,1.2),
    top narrower (Scale 0.8,1,0.8). Overlap by 0.1 studs at the seam.
    Organic tree trunks: 3-4 stacked cylinders with decreasing Scale going up.

MESHPART:
  An actual mesh asset (FBX/OBJ uploaded to Roblox). The mesh IS the collision.
  Use for: imported 3D models (vehicles, characters, complex props).
  Advantages: exact visual-collision match, LOD support, PBR textures.
  Disadvantages: requires external 3D modeling, heavier than Parts, cannot
  be resized non-uniformly at runtime (Scale is locked after import).
  CollisionFidelity options: Default (convex hull), Box, Hull, PreciseConvexDecomposition.
  Use Box for best performance on decorative meshes players dont walk on.
  Use PreciseConvexDecomposition only for walkable complex terrain meshes.
  RenderFidelity: Automatic (LOD), Precise (always full detail — use for hero props).

DECISION TREE:
  Can it be built from 2-10 primitives? → Use Parts + SpecialMesh.
  Is it a complex organic shape? → Use MeshPart (imported asset).
  Do you need non-uniform stretching of a simple shape? → SpecialMesh on a Part.
  Does collision need to be simple while visual is complex? → SpecialMesh (collision stays as Part).
  Is it a player-interactable prop? → MeshPart with PreciseConvexDecomposition.

────────────────────────────────────────────────────────────────────────────────
1.2 SURFACE DECORATION — Textures, Decals, GUIs, and Lights
────────────────────────────────────────────────────────────────────────────────

Bare geometry looks sterile. Professional builds layer surface details:

TEXTURE vs DECAL:
  Both are images applied to a Part face. The critical difference:
  Texture TILES (repeats across the surface). Use for: brick patterns, floor tiles,
    wood grain, fabric weave, roof shingles, grass overlays, cobblestone paths.
    Properties: StudsPerTileU and StudsPerTileV control repeat density.
    Example: brick wall Texture with StudsPerTileU=4, StudsPerTileV=2 means
    the brick pattern repeats every 4 studs horizontally, 2 studs vertically.
    A 20-stud-wide wall shows 5 repeats of the pattern. Adjust to match scale.
    OffsetStudsU/V shift the pattern — use to avoid seam alignment between
    adjacent walls (offset by half a tile on the neighbor).
    Transparency: 0 to 1. Use 0.3-0.5 Transparency to let the Part material
    show through partially — creates a worn/weathered look.

  Decal STRETCHES (single image fills the entire face). Use for: signs, posters,
    logos, floor markings, wall art, graffiti, specific one-off images, maps,
    wanted posters, menu boards, screen content, brand logos, warning signs.
    A Decal on a 10x5 Part face stretches to fill the 10x5 area.
    Use square source images to avoid distortion on rectangular faces.
    ZIndex controls layering when multiple Decals overlap on the same face.

  COMMON PATTERNS:
    Weathered wall: Part with Brick material + Texture (crack overlay, Transparency 0.6).
    Tiled floor: Part with SmoothPlastic + Texture (tile pattern, StudsPerTile 2x2).
    Shop sign: Part + Decal with the shop name/logo image.
    Floor marking: Flat Part + Decal (arrows, lines, hazard stripes).
    Brick variation: Texture on every 3rd brick Part with a slightly different
    brick pattern creates visual variety without different materials.

SURFACEGUI — Dynamic Text and Interactive Panels:
  Parented to a Part, renders a 2D GUI on the Part face. Use for:
    Shop signs with dynamic text (price changes, "OPEN/CLOSED").
    Player name displays above NPC heads or shop counters.
    Digital clocks (update TextLabel.Text from a script every second).
    Score displays, leaderboards shown on in-game screens.
    Computer/TV screens with animated content.
    Control panels with buttons (TextButton works inside SurfaceGui).
    Map displays, radar screens, mini-maps.
    Dynamic billboards that change content based on game state.

  SurfaceGui properties:
    Face = Enum.NormalId.Front (or Back, Left, Right, Top, Bottom).
    CanvasSize = Vector2.new(width, height) — resolution of the GUI.
    PixelsPerStud = 50 (default). Higher = sharper text. 100 for readable small text.
    LightInfluence = 0 makes it self-illuminated (screens, signs).
    LightInfluence = 1 means it dims in shadows (realistic paper/labels).
    MaxDistance = 50-100 — how far away players can see it.
    SizingMode = FixedSize (GUI is pixel-accurate) vs PixelsPerStud (scales with Part).

  SurfaceGui TextLabel tips:
    Font = Enum.Font.GothamBold for clean modern text.
    Font = Enum.Font.Arcade for retro game displays.
    Font = Enum.Font.Fantasy for medieval/RPG signs.
    TextScaled = true to auto-fit, but set TextWrapped = true too.
    RichText = true for bold/italic/color markup in sign text.

SURFACELIGHT — Wall-Mounted Light Panels:
  Creates a flat, directional light that emits from a Part face. Use for:
    Ceiling panel lights (fluorescent strip lights in modern buildings).
    Backlit signs (attach to the sign Part, face outward).
    Floor uplights (dramatic architectural lighting from ground level).
    Wall wash lights (face = Front on a wall-mounted Part).
  Properties: Range (6-16), Brightness (0.5-2), Angle (90-180 for spread),
  Face (which side emits), Color (warm white for interiors, cool for modern).
  Combine with a Neon-material Part as the light fixture housing.

────────────────────────────────────────────────────────────────────────────────
1.3 CONSTRAINT-BASED BUILDS — Physics-Driven Interactivity
────────────────────────────────────────────────────────────────────────────────

Constraints connect Parts with physical relationships. They make builds
interactive and dynamic instead of static showcases.

WELDCONSTRAINT — Permanent Joint:
  Welds two Parts together so they move as one rigid body. Use for:
    Multi-part props that should act as one object (desk + lamp, car body + wheels frame).
    NPC body assembly (weld limbs to torso).
    Destructible buildings (weld pieces, then destroy weld to "break" them apart).
  How: WeldConstraint.Part0 = partA, WeldConstraint.Part1 = partB. Thats it.
  Both Parts must NOT be Anchored for the weld to have any effect during physics.
  For anchored decoration, WeldConstraint still keeps relative positioning if
  one Part is later unanchored (useful for destructible builds).
  Performance: lighter than ManualWeld. Use WeldConstraint over Weld/ManualWeld always.

HINGECONSTRAINT — Rotational Joint:
  One Part rotates around a single axis relative to another. Use for:
    Doors: Attachment0 at door edge (hinge side), Attachment1 on frame.
      Set ActuatorType = Motor, AngularVelocity = 2, MotorMaxTorque = 10000.
      To open: set TargetAngle = 90. To close: set TargetAngle = 0.
    Gates: same as door but with larger Parts.
    Drawbridges: horizontal hinge at the base, drops down.
    Windmill blades: continuous rotation, ActuatorType = Motor, AngularVelocity = 1.
    Clock hands: slow rotation, AngularVelocity = 0.017 (1 revolution/minute).
    Hinged lids: treasure chest lid, mailbox flap, trapdoor.
    Turnstiles: bi-directional hinge with limits (LimitsEnabled, UpperAngle, LowerAngle).
  Attachments matter: Attachment0 goes in the MOVING Part, Attachment1 in the STATIC Part.
  The axis of rotation is the Attachment0 primary axis (usually Y axis for vertical hinges).

PRISMATICCONSTRAINT — Linear Slide:
  One Part slides along a single axis. Use for:
    Elevators: Part slides along Y axis between floors.
      Set ActuatorType = Servo, Speed = 5, TargetPosition = floorHeight.
      Change TargetPosition to move between floors.
    Sliding doors: Part slides along X or Z to open.
      TargetPosition = 0 (closed), TargetPosition = doorWidth (open).
    Retractable bridges: extends outward over a gap.
    Pistons: mechanical movement in factories, machines.
    Conveyor gates: block or allow passage.
    Secret walls: slide a bookshelf to reveal a hidden passage.
  LimitsEnabled = true prevents overshooting. Set UpperLimit and LowerLimit.
  Restitution = 0 prevents bouncing at limits.

SPRINGCONSTRAINT — Elastic Connection:
  Two Parts connected by a spring force. Use for:
    Bouncy platforms: player lands, platform compresses, springs back.
      Set Stiffness = 100-500 (higher = less compression), Damping = 5-20.
    Vehicle suspension: connect wheel to chassis with spring.
      FreeLength = 3 (resting distance), Stiffness = 200, Damping = 10.
    Trampoline: high Stiffness (500+), low Damping (2), FreeLength = 0.5.
    Rope bridges with bounce: spring between each plank.
    Punching bag: spring from ceiling mount to bag.
    Bobblehead decorations: weak spring (Stiffness 5, Damping 1).
  Coils visible by default (CoilsEnabled). Set to false for invisible springs.
  LimitsEnabled prevents over-extension (MaxLength) and over-compression (MinLength).

ROPECONSTRAINT — Hanging Connection:
  Maximum-distance constraint — Parts can get closer but not farther than Length.
  Use for:
    Hanging signs: Rope from ceiling beam to sign Part. Length = distance between.
    Chandeliers: multiple ropes from ceiling to chandelier frame.
    Rope bridges: series of RopeConstraints between plank Parts.
    Swing sets: Rope from top bar to seat.
    Wrecking balls: Rope from crane arm to ball.
    Hanging lanterns, banners, chains, vines.
  Visible = true shows the rope. Thickness = 0.1-0.3 for thin ropes, 0.5+ for chains.
  Color can be set for the visible rope.
  Restitution controls how bouncy the rope is at max extension (0 = no bounce).

ALIGNPOSITION / ALIGNORIENTATION — Smooth Following:
  AlignPosition makes a Part smoothly move toward a target position.
  AlignOrientation makes a Part smoothly rotate toward a target orientation.
  Use for:
    Floating platforms that follow a path (set Position target each frame).
    Camera-facing billboards (AlignOrientation toward camera CFrame).
    Homing projectiles (AlignPosition toward target, with MaxForce limiting turn speed).
    Magnetic attraction effects (Part drifts toward player).
    NPC look-at behavior (AlignOrientation head toward nearest player).
    Hovering vehicles (AlignPosition with Y offset above ground via raycast).
  MaxForce / MaxTorque controls how aggressively it tracks. Low = lazy drift. High = snap.
  Responsiveness (0-200) controls speed. Higher = faster convergence.
  RigidityEnabled = true makes it instant (teleport to target). Usually false for smooth.
  Mode: OneAttachment (world-space target) or TwoAttachment (relative to another Part).

BALLSOCKETCONSTRAINT — Universal Joint:
  Allows rotation on all three axes around a point. Use for:
    Ragdoll joints (shoulder, hip, neck).
    Chain links (each link ball-socketed to the next).
    Wrecking ball attachment point.
    Joystick/lever controls.
  LimitsEnabled with UpperAngle constrains the cone of rotation.
  TwistLimitsEnabled constrains spin around the connection axis.

────────────────────────────────────────────────────────────────────────────────
1.4 ADVANCED CFRAME MATH — Precision Placement
────────────────────────────────────────────────────────────────────────────────

CFrame (Coordinate Frame) is the foundation of all positioning in Roblox.
Mastering CFrame math is what separates precise, professional builds from
wobbly amateur ones.

FUNDAMENTALS:
  CFrame = position + orientation combined in a single 4x4 matrix.
  CFrame.new(x, y, z) = position only, default orientation (facing -Z).
  CFrame.Angles(rx, ry, rz) = rotation only, at origin. RADIANS not degrees.
    Convert degrees: math.rad(45) = 0.785 radians.
  Combine: CFrame.new(10, 5, 0) * CFrame.Angles(0, math.rad(45), 0)
    = position at (10,5,0) rotated 45 degrees around Y axis.
  Order matters: position * rotation != rotation * position.
    Always do CFrame.new(pos) * CFrame.Angles(rot) for intuitive behavior.

CFRAME.LOOKAT — Orienting Toward a Target:
  CFrame.lookAt(position, targetPosition) creates a CFrame at position
  facing toward targetPosition. Use for:
    Spotlights aimed at a stage: light.CFrame = CFrame.lookAt(lightPos, stageCenter)
    NPC facing the player: npc.HumanoidRootPart.CFrame = CFrame.lookAt(npcPos, playerPos)
    Security cameras: camera.CFrame = CFrame.lookAt(cameraPos, areaCenter)
    Cannons aimed at target: barrel.CFrame = CFrame.lookAt(cannonPos, targetPos)
  Third argument is the up vector (default Vector3.yAxis). Change for wall-mounted objects.

TOWORLDSPACE / TOOBJECTSPACE — Relative Positioning:
  CFrame:ToWorldSpace(localCFrame) converts from local coordinates to world.
  CFrame:ToObjectSpace(worldCFrame) converts from world to local coordinates.
  Use for:
    Placing a decoration relative to a Part regardless of the Parts rotation:
      local surfacePoint = wall.CFrame:ToWorldSpace(CFrame.new(0, 0, -wall.Size.Z/2 - 0.1))
      This gives a point just in front of the wall face, even if the wall is rotated.
    Building relative to a root Part:
      local root = CFrame.new(100, 0, 200)
      for each part in building:
        part.CFrame = root:ToWorldSpace(part.localOffset)
      This lets you place the entire building anywhere by changing root.
    Checking if a point is "in front of" an object:
      local relative = object.CFrame:ToObjectSpace(CFrame.new(point))
      if relative.Position.Z < 0 then -- point is in front of the object

DISTRIBUTING PARTS IN A CIRCLE:
  For circular arrangements (fence posts, columns, arena seating, tower turrets):
    local center = CFrame.new(0, 0, 0)
    local count = 12
    local radius = 20
    for i = 1, count do
      local angle = math.rad(360 / count * i)
      local position = center * CFrame.Angles(0, angle, 0) * CFrame.new(0, 0, radius)
      -- position.Position is the world coordinate for this post
      -- position.LookVector points outward from center (useful for fences facing out)
      -- To face inward: position * CFrame.Angles(0, math.rad(180), 0)
    end

  Applications:
    Circular fence: 24 posts at radius 30, rails between each pair.
    Arena pillars: 8 columns at radius 40, arches between adjacent pairs.
    Clock numbers: 12 positions at radius 5, SurfaceGui TextLabels.
    Chandelier arms: 6 arms at radius 3, each holding a candle.
    Tower crenellations: alternating tall/short blocks around tower top.

SPIRAL PLACEMENT:
  Add increasing Y per step for helixes and spiral staircases:
    for i = 1, steps do
      local angle = math.rad(360 / stepsPerRevolution * i)
      local y = stepHeight * i
      local cf = CFrame.new(0, y, 0) * CFrame.Angles(0, angle, 0) * CFrame.new(0, 0, radius)
      -- Place step Part at cf
    end
  A spiral staircase with 20 steps, 0.8 stud rise per step, 10-stud radius,
  12 steps per full revolution creates a dramatic tower interior.

ARC PLACEMENT:
  For arches, bridges, domes (partial circles):
    local startAngle = math.rad(-90)  -- bottom left
    local endAngle = math.rad(90)     -- bottom right
    local segments = 12
    for i = 0, segments do
      local t = i / segments
      local angle = startAngle + (endAngle - startAngle) * t
      local x = math.cos(angle) * radius
      local y = math.sin(angle) * radius + yOffset
      -- Place Part at (x, y, z) with rotation matching the arc tangent
      local rotation = CFrame.Angles(0, 0, angle)
    end

GRID PLACEMENT WITH VARIATION:
  For natural-looking forests, rock fields, village layouts:
    for x = 1, gridWidth do
      for z = 1, gridDepth do
        -- Base grid position
        local bx = x * spacing
        local bz = z * spacing
        -- Random offset for organic feel (never perfectly aligned)
        local ox = (math.random() - 0.5) * spacing * 0.4
        local oz = (math.random() - 0.5) * spacing * 0.4
        -- Random rotation for variety
        local ry = math.rad(math.random(0, 360))
        -- Random scale variation (0.8x to 1.2x)
        local scale = 0.8 + math.random() * 0.4
        local cf = CFrame.new(bx + ox, 0, bz + oz) * CFrame.Angles(0, ry, 0)
        -- Place tree/rock/bush at cf with size * scale
      end
    end

────────────────────────────────────────────────────────────────────────────────
1.5 TERRAIN SCULPTING — Procedural Landscapes
────────────────────────────────────────────────────────────────────────────────

Terrain in Roblox is a voxel grid (4-stud resolution). The API uses Region3
volumes filled with specific materials. Professional terrain uses layered
techniques, not single FillBlock calls.

FILLBLOCK(cframe, size, material):
  Fills a rectangular volume. Use for: flat areas, roads, paths, floors,
  water bodies, foundation pads, plateaus.
  The CFrame positions the CENTER of the block. Size is in studs.
  Road: FillBlock(CFrame.new(0,0,0), Vector3.new(200,4,10), Enum.Material.Asphalt)
  Lake: FillBlock(CFrame.new(0,-5,0), Vector3.new(60,8,40), Enum.Material.Water)
  Plateau: FillBlock(CFrame.new(0,10,0), Vector3.new(80,20,80), Enum.Material.Rock)

FILLBALL(center, radius, material):
  Fills a sphere. Use for: hills, boulders, organic mounds, island shapes.
  Rolling hills: 8-15 FillBall calls with radius 15-40 at varying Y heights (5-30).
  Cluster 2-3 balls together for mountain ranges. Leave gaps for valleys.
  Boulder field: 10-20 FillBall calls with radius 3-8, Rock/Slate material,
  scattered randomly across the landscape.
  Smooth terrain: many overlapping small FillBalls create smoother surfaces
  than few large ones. 20 balls radius 15 > 5 balls radius 30.

FILLCYLINDER(cframe, height, radius, material):
  Fills a cylinder. Use for: tunnels (horizontal), tower foundations, well shafts,
  volcanic craters (Air material to carve out), columns, cliff pillars.
  Tunnel: FillCylinder at horizontal CFrame, height=length, radius=5, Air material
  to carve a tunnel through existing terrain.

FILLWEDGE(cframe, size, material):
  Fills a wedge shape. Use for: ramps, cliff faces, terraced hillsides,
  road embankments, river banks.

REPLACEMATERIAL(region, resolution, oldMaterial, newMaterial):
  Swaps one material for another in a region. Use for:
    Biome transitions: replace Grass with Snow above Y=50.
    Path weathering: replace Grass with Mud along walkways.
    Seasonal changes: replace LeafyGrass with Snow for winter.
    Erosion effects: replace Rock with Sand at coastlines.

READVOXELS / WRITEVOXELS:
  Low-level access to the terrain voxel grid. Each voxel is 4x4x4 studs.
  ReadVoxels returns two 3D arrays: materials and occupancy (0 to 1).
  WriteVoxels sets both arrays. Use for:
    Precise terrain editing (smoothing, custom shapes).
    Terrain import from heightmaps.
    Runtime terrain modification (digging, building).
    Smooth blending between materials (partial occupancy).

LAYERED TERRAIN TECHNIQUE (professional approach):
  Layer 1 — Base ground: Large FillBlock with primary ground material (Grass/Sand/Snow).
  Layer 2 — Elevation: Multiple FillBall for hills and mountains.
  Layer 3 — Water: FillBlock at negative Y offsets for rivers and lakes.
  Layer 4 — Material transitions: ReplaceMaterial for biome edges.
  Layer 5 — Detail: Small FillBall for boulders, small FillBlock for paths.
  Layer 6 — Carving: FillBlock/FillBall with Air material to create caves and overhangs.

RIVER CARVING:
  A river is a series of overlapping FillBlock calls with Water material,
  placed along a path at Y=-2 to Y=-5. Make it curve by placing blocks at
  slight angles. Add Mud terrain at the edges (FillBlock 2 studs wider than
  the water, Y=0) for natural riverbanks. Add Sand at the river delta/end.
  Depth variation: deeper in the middle (lower Y), shallower at edges.

MOUNTAIN BUILDING:
  Start with a large base FillBall (radius 40, Y=10, Grass).
  Stack 3-4 progressively smaller FillBalls on top (radius 30/20/15, increasing Y).
  Replace top 25% with Rock or Snow material.
  Add irregular FillBalls on the sides for ridges and outcrops.
  Carve paths using thin FillBlock with Air or Mud material winding up the mountain.

────────────────────────────────────────────────────────────────────────────────
1.6 LIGHTING MASTERY — Cinematic Atmosphere
────────────────────────────────────────────────────────────────────────────────

Lighting technology choices:
  Future: Best quality. Soft shadows, global illumination simulation, accurate
    reflections. Use for: showcases, horror games, cinematic games. Higher GPU cost.
  ShadowMap: Good balance. Hard shadows, decent quality. Use for: most games.
    Good performance on mobile. Default choice for games targeting wide audiences.
  Compatibility: Minimal shadows, flat lighting. Use only for: low-end device
    targeting, retro aesthetic, voxel-art games where flat shading is intentional.

POINTLIGHT — Omnidirectional Glow:
  Emits light equally in all directions from its parent Part position. Use for:
    Lamps: Range 12-20, Brightness 1-2, warm Color3 (255, 230, 180).
    Fireplaces: Range 15-25, Brightness 1.5-2.5, orange Color3 (255, 150, 50).
    Torches: Range 8-12, Brightness 1-1.5, fire Color3 (255, 180, 60).
    Candles: Range 4-8, Brightness 0.5-1, warm yellow.
    Magic orbs: Range 10-16, Brightness 2-3, blue/purple/green (fantasy color).
    Neon signs: Range 6-10, Brightness 1.5, matching the sign color.
  Shadows = true for main lights, false for fill lights and small accents.
  Place INSIDE the light fixture Part for correct origin.

SPOTLIGHT — Directional Cone:
  Emits a cone of light in the direction of its parent Parts front face. Use for:
    Street lights: Angle 80-120, Range 30-50, Brightness 2-3, Face = Bottom.
    Flashlights: Angle 30-45, Range 40-60, Brightness 2, white.
    Stage lights: Angle 20-40, Range 50-80, Brightness 3-5, colored.
    Search lights: Angle 10-20, Range 100+, Brightness 3, white. Animate rotation.
    Car headlights: Angle 45-60, Range 40, Brightness 2, slightly warm white.
    Security lights: Angle 90-120, Range 20-30, Brightness 2.
  Face property: which face of the parent Part the light aims from.
  Typically Face = Bottom for downward-facing fixtures, Face = Front for aimed lights.

SURFACELIGHT — Flat Panel Emission:
  Emits light from an entire face of the parent Part. Use for:
    Ceiling panels: Face = Bottom, Range 8-14, Brightness 1-2.
    Backlit signs: Face = Front, Range 4-8, Brightness 1.
    Floor uplights: Face = Top, Range 6-10, Brightness 1-1.5.
    Screen glow: Face matching screen direction, Range 4-6, Brightness 0.5-1.
    Under-shelf lighting: Face = Bottom on a shelf Part, Range 3-5, subtle.
  Angle controls spread. 0 = straight out only. 180 = hemisphere.

NEON MATERIAL:
  Self-illuminating — appears bright without a light source. But does NOT cast
  light on surrounding objects. Always pair with a PointLight or SpotLight
  if you want the neon Part to actually illuminate its surroundings.
  Use for: glowing signs, sci-fi panels, magic crystals, lava, power cores,
  LED strips, holographic displays, light saber blades, tron-style lines.
  Color the Neon Part with bright saturated colors. The material handles the glow.

GLOBAL LIGHTING PROPERTIES:
  Brightness: sun intensity. 1 = normal, 3 = harsh desert, 0.5 = overcast.
  Ambient: fills all shadows uniformly. Too bright = washed out, no contrast.
    Good values: Color3.fromRGB(30-80, 30-80, 40-100). Tint toward scene mood.
  OutdoorAmbient: ambient light that only affects outdoor areas (under the sky).
    Usually slightly brighter than Ambient. Both should have similar tint.
  ColorShift_Top: tints light hitting top surfaces (sky color influence).
  ColorShift_Bottom: tints light hitting bottom surfaces (ground bounce).

TIME-OF-DAY PRESETS (ClockTime value and mood):
  Dawn (5.5-7): Warm orange/pink sky, low sun, long shadows. Ambient (50,40,60).
    Atmosphere.Color warm, Brightness 1-1.5, SunRays visible.
  Morning (7-10): Clean light, shortening shadows. Brightness 2, crisp.
  Midday (11-14): Neutral white, harsh shadows, bright. Brightness 2.5-3.
  Golden Hour (16-18): Rich gold light, dramatic long shadows. Brightness 2.
    ColorCorrection.TintColor warm gold. Best for screenshots.
  Dusk (18-19.5): Pink/purple sky, fading light. Ambient warm, Brightness 1.
  Night (20-5): Dark blue/black. Brightness 0.5, Ambient (10,10,30).
    Stars visible, moonlight cold. PointLights become dominant.
  Midnight (0): Darkest. Moon directly overhead. Ambient (5,5,15).

────────────────────────────────────────────────────────────────────────────────
1.7 UNION AND NEGATION OPERATIONS
────────────────────────────────────────────────────────────────────────────────

UnionOperation: combines multiple Parts into a single mesh. Use for:
  Complex shapes that cant be built from a single primitive.
  Archways (block + negated cylinder), rounded corners, cutouts.
  Reduces Part count (good for performance) but unions are heavier to render
  than equivalent separate Parts in most cases.
NegateOperation: subtracts a Parts volume from a union. Use for:
  Windows (negate a block from a wall), doors, holes, channels, pipe passages.
  Archways: negate a half-cylinder from a wall block.
Limitations: unions can fail with complex geometry. Keep source parts simple.
  RenderFidelity = Precise for accurate union rendering.
  CollisionFidelity = PreciseConvexDecomposition for walkable unions.
  SmoothingAngle = 30-60 degrees for smooth surface transitions in the union.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 2: ADVANCED SCRIPTING ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How professional Roblox games structure their code. This is what separates
a pile of scripts from a maintainable, scalable game codebase.

────────────────────────────────────────────────────────────────────────────────
2.1 MODULE PATTERN — Service-Based Architecture
────────────────────────────────────────────────────────────────────────────────

The gold standard for professional Roblox games. Every system is a ModuleScript
that follows the same interface: new(), Init(), Start(), Destroy().

PATTERN:
  -- ServerScriptService/Services/CombatService.lua
  local CombatService = {}
  CombatService.__index = CombatService

  function CombatService.new()
      local self = setmetatable({}, CombatService)
      self._connections = {}  -- track all event connections for cleanup
      self._cache = {}        -- per-player state cache
      return self
  end

  function CombatService:Init()
      -- Phase 1: Setup. Runs before any service starts.
      -- Create RemoteEvents, bind to other services, set up data structures.
      -- Do NOT access other services here (they may not be Init'd yet).
      self._damageRemote = Instance.new("RemoteEvent")
      self._damageRemote.Name = "DamageEvent"
      self._damageRemote.Parent = game:GetService("ReplicatedStorage"):FindFirstChild("Remotes")
  end

  function CombatService:Start()
      -- Phase 2: Activate. Runs after ALL services have Init'd.
      -- Safe to call other services. Connect events. Start game loops.
      table.insert(self._connections, self._damageRemote.OnServerEvent:Connect(function(player, targetId, abilityId)
          self:_handleDamage(player, targetId, abilityId)
      end))
  end

  function CombatService:Destroy()
      -- Cleanup: disconnect all events, clear caches.
      for _, conn in self._connections do
          conn:Disconnect()
      end
      table.clear(self._connections)
      table.clear(self._cache)
  end

  return CombatService

WHY THIS PATTERN MATTERS:
  1. Predictable initialization: Init runs first (setup), Start runs second (activate).
     This prevents "service X isnt ready yet" race conditions.
  2. Testability: each service can be instantiated independently for unit testing.
  3. Clean shutdown: Destroy() ensures no leaked connections or memory.
  4. Encapsulation: internal state (_cache, _connections) is private by convention.
  5. Scalability: adding a new system = adding a new module following the same pattern.

SERVICE COMMUNICATION:
  Services should communicate through well-defined interfaces, not by reaching
  into each others internal state. Three patterns:

  Direct call: ServiceA calls ServiceB:SomeMethod(). Simple, synchronous.
    Use when the caller needs the result immediately.
    Example: CombatService calls InventoryService:HasWeapon(player, weaponId)

  Event-driven: ServiceA fires a BindableEvent, ServiceB listens.
    Use when multiple services need to react to the same event.
    Example: When a player levels up, fire "PlayerLevelUp" event.
    CombatService, UIService, AchievementService all listen independently.

  Signal pattern: custom lightweight signal (see section 2.5).
    Use when BindableEvent overhead is unnecessary (no Instance creation).

INITIALIZATION ORDER (the bootstrap script):
  -- ServerScriptService/Main.lua
  local Services = {
      require(script.Parent.Services.DataService).new(),
      require(script.Parent.Services.CombatService).new(),
      require(script.Parent.Services.EconomyService).new(),
      require(script.Parent.Services.InventoryService).new(),
      require(script.Parent.Services.QuestService).new(),
  }
  -- Phase 1: Init all
  for _, service in Services do service:Init() end
  -- Phase 2: Start all
  for _, service in Services do service:Start() end
  -- Store references for cross-service access
  shared.Services = {}
  for _, service in Services do
      shared.Services[service.Name or "Unknown"] = service
  end

────────────────────────────────────────────────────────────────────────────────
2.2 CLIENT-SERVER ARCHITECTURE — The Trust Boundary
────────────────────────────────────────────────────────────────────────────────

The most critical concept in Roblox development: the server is TRUTH, the
client is a LIAR.

FUNDAMENTAL RULES:
  1. Server is authority for ALL game state: player health, currency, inventory,
     positions (authoritative), scores, quest progress, NPC health, game rounds.
  2. Client REQUESTS actions. Server VALIDATES and EXECUTES (or rejects).
  3. Client does PREDICTION for responsiveness — move immediately, attack
     immediately, but the server confirms or corrects.
  4. NEVER send damage amounts from client to server. Client says "I attacked
     target X with ability Y." Server looks up the damage from its own data.
  5. NEVER send currency amounts. Client says "buy item X." Server checks
     the price, checks the balance, deducts server-side.

REMOTEEVENT — Fire and Forget:
  Client → Server: "I pressed attack," "I picked up item at position X."
  Server → Client: "Your health is now 50," "Animation X should play."
  Server → All Clients: "Player X scored a point," "Round started."
  No return value. Asynchronous. Use for the majority of game communication.

  Patterns:
    Client fires, server validates:
      -- Client: attackRemote:FireServer(targetHumanoid)
      -- Server: attackRemote.OnServerEvent:Connect(function(player, target)
      --   if not isValidTarget(player, target) then return end
      --   if isOnCooldown(player) then return end
      --   applyDamage(player, target)
      -- end)

    Server broadcasts to all:
      -- Server: roundRemote:FireAllClients("RoundStart", mapName, duration)
      -- Client: roundRemote.OnClientEvent:Connect(function(event, ...)

    Server fires to specific player:
      -- Server: rewardRemote:FireClient(player, "coins", 50)

REMOTEFUNCTION — Request/Response:
  Client asks, server answers. SYNCHRONOUS from the clients perspective.
  Use for: checking prices, getting inventory, asking "can I do X?"
  CAUTION: a malicious client can yield the RemoteFunction callback forever,
  causing the server thread to hang. ALWAYS add a timeout or use RemoteEvent instead.

  Pattern:
    -- Server: shopFunc.OnServerInvoke = function(player, itemId)
    --   local item = catalog[itemId]
    --   if not item then return false, "Item not found" end
    --   if playerCoins[player] < item.price then return false, "Not enough coins" end
    --   playerCoins[player] -= item.price
    --   addToInventory(player, itemId)
    --   return true, "Purchase successful"
    -- end

    -- Client: local success, msg = shopFunc:InvokeServer("sword_01")

REPLICATION RULES:
  Changes to workspace from server replicate to all clients automatically.
  Changes to workspace from client are LOCAL ONLY — other clients dont see them.
  Instances in ServerStorage are invisible to clients (safe for secrets, configs).
  Instances in ReplicatedStorage are visible to ALL clients (shared assets, remotes).
  Instances in ServerScriptService are invisible to clients (server code).
  Instances in StarterPlayerScripts are cloned to each players PlayerScripts.
  Instances in StarterCharacterScripts are cloned each time the character spawns.

CLIENT PREDICTION:
  For responsive gameplay, the client acts immediately and the server corrects:
    1. Player presses "move right." Client moves character immediately.
    2. Client sends movement input to server.
    3. Server simulates the movement, applies physics, checks for cheats.
    4. Server sends back the authoritative position.
    5. Client reconciles: if server position differs significantly (>2 studs),
       smoothly interpolate the character to the server position.
  This is why networked movement feels smooth even with 100ms+ latency.

────────────────────────────────────────────────────────────────────────────────
2.3 DATASTORE PATTERNS — Persistent Player Data
────────────────────────────────────────────────────────────────────────────────

DataStore is Roblox's built-in key-value persistence. Getting it right is
critical — bad DataStore code causes data loss, which causes player churn.

SESSION LOCKING:
  Problem: Player joins Server A, data loads. Player disconnects and instantly
  joins Server B. Server A hasn't saved yet. Server B loads stale data.
  Server A saves after Server B loaded → Server B's changes get overwritten.

  Solution: Session lock. When loading data, write a "lock" with the server's
  JobId and a timestamp. Before saving, verify the lock still belongs to you.
  If another server took the lock, ABORT your save (your data is stale).

  Implementation:
    On load: set data._lockJobId = game.JobId, data._lockTime = os.time()
    On save: UpdateAsync checks if _lockJobId still matches game.JobId.
      If not, do NOT write — another server owns this data now.
    On leave: clear _lockJobId before final save.
    Timeout: if _lockTime is older than 30 minutes, assume the server crashed
    and allow a new server to take the lock.

DATA VERSIONING:
  Always store a version number with player data. When you change the data schema
  (add new fields, rename fields, restructure), increment the version.
  On load, check the version and run migration functions:
    if data.version == 1 then migrateV1toV2(data) end
    if data.version == 2 then migrateV2toV3(data) end
  This prevents crashes when loading old player data after an update.

ORDERED DATASTORE:
  A separate DataStore type optimized for leaderboards.
  Keys must be strings, values must be integers.
  GetSortedAsync(ascending, pageSize) returns pages of sorted entries.
  Use for: global leaderboards (top 100 players by coins/kills/level).
  Update only when the players score changes, not constantly.
  Cache the leaderboard data and refresh every 60 seconds, not on every request.

DATASTORE BUDGET:
  Roblox limits DataStore API calls: 60 + 10 * playerCount per minute.
  With 50 players: 60 + 500 = 560 calls/minute.
  GetAsync = 1 call. SetAsync = 1 call. UpdateAsync = 1 call (but read+write).
  Plan your save frequency accordingly. Auto-save every 300 seconds is safe for
  up to 100 players. Every 120 seconds is fine for small servers (<20 players).

RETRY WITH EXPONENTIAL BACKOFF:
  DataStore calls can fail (throttling, network issues). Always wrap in pcall:
    local MAX_RETRIES = 3
    for attempt = 1, MAX_RETRIES do
      local success, result = pcall(function()
        return dataStore:UpdateAsync(key, updateFunction)
      end)
      if success then return result end
      if attempt < MAX_RETRIES then
        task.wait(2 ^ attempt)  -- 2s, 4s, 8s
      end
    end
    warn("DataStore save failed after", MAX_RETRIES, "attempts")

UPDATEASYNC vs SETASYNC:
  SetAsync blindly writes. If two servers call SetAsync simultaneously, the
  last one wins, overwriting the others changes.
  UpdateAsync reads the current value first, lets you transform it, then writes.
  If the value changed between read and write, it retries automatically.
  ALWAYS use UpdateAsync for player data. SetAsync is only acceptable for
  write-once data (like recording a one-time event).

BACKUP DATASTORE:
  Write a copy of player data to a secondary DataStore every 10 saves.
  Name it "PlayerData_Backup" vs "PlayerData". If the primary gets corrupted,
  you can restore from backup. This has saved many games from data wipes.

BINDTOCLOSE:
  game:BindToClose(function() ... end) runs when the server shuts down.
  You get 30 seconds max. Save ALL connected players data.
  Use task.spawn for parallel saves, then wait for all to complete:
    game:BindToClose(function()
      local threads = {}
      for _, player in game:GetService("Players"):GetPlayers() do
        table.insert(threads, task.spawn(function()
          savePlayerData(player)
        end))
      end
      -- Wait up to 25 seconds for all saves
      local start = os.clock()
      while os.clock() - start < 25 do
        if allSavesComplete then break end
        task.wait(0.5)
      end
    end)

────────────────────────────────────────────────────────────────────────────────
2.4 STATE MACHINE PATTERN — Game States, NPC AI, UI
────────────────────────────────────────────────────────────────────────────────

State machines are the cleanest way to manage complex behavior. Anytime something
has distinct "modes" with different behaviors, use a state machine.

STRUCTURE:
  States: named conditions (Idle, Walking, Attacking, Dead, Shopping).
  Transitions: rules for moving between states (Idle → Walking when input detected).
  Enter/Exit callbacks: code that runs when entering or leaving a state.
  Update: per-frame logic specific to the current state.

  local StateMachine = {}
  StateMachine.__index = StateMachine

  function StateMachine.new(initialState, stateDefinitions)
    local self = setmetatable({}, StateMachine)
    self.states = stateDefinitions  -- table of {enter, exit, update} per state
    self.currentState = nil
    self:transitionTo(initialState)
    return self
  end

  function StateMachine:transitionTo(newState)
    if self.currentState and self.states[self.currentState].exit then
      self.states[self.currentState].exit()
    end
    self.currentState = newState
    if self.states[newState].enter then
      self.states[newState].enter()
    end
  end

  function StateMachine:update(dt)
    if self.states[self.currentState].update then
      self.states[self.currentState].update(dt)
    end
  end

USE CASES:
  Game round system:
    States: Lobby, Countdown, Playing, GameOver, Intermission.
    Lobby.enter: teleport players to lobby, enable voting.
    Countdown.enter: start 10s timer, show countdown GUI.
    Playing.enter: teleport to map, enable combat, start game timer.
    Playing.update: check win conditions each frame.
    GameOver.enter: announce winner, disable combat, show results.
    Intermission.enter: reset scores, wait 15s, transition to Lobby.

  NPC behavior:
    States: Idle, Patrol, Chase, Attack, Flee, Dead.
    Idle.update: wait random 2-5 seconds, then transition to Patrol.
    Patrol.update: follow waypoints. If player within 30 studs → Chase.
    Chase.update: pathfind toward player. If within 5 studs → Attack. If player > 50 studs → Patrol.
    Attack.update: deal damage every 1.5s. If target dead → Idle. If target out of range → Chase.
    Flee.update: run away from threat. If health > 50% → Chase. If safe → Idle.
    Dead.enter: play death animation, drop loot, start respawn timer.

  UI panels:
    States: Closed, Opening, Open, Closing.
    Closed: GUI invisible, not processing input.
    Opening: tween animation playing (slide in, fade in). On complete → Open.
    Open: GUI visible, processing input, updating content.
    Closing: tween animation playing. On complete → Closed.
    This prevents double-open bugs and animation interruption.

────────────────────────────────────────────────────────────────────────────────
2.5 EVENT-DRIVEN ARCHITECTURE — Decoupled Systems
────────────────────────────────────────────────────────────────────────────────

BINDABLEEVENT — Roblox Instance-Based:
  Creates an Instance in the DataModel that scripts can fire and listen to.
  Server→Server communication between ModuleScripts.
  Use for: player died event, level up event, round state change, achievement unlocked.
  Create in ReplicatedStorage or ServerStorage depending on visibility needs.

  Pattern:
    -- EventBus module (shared)
    local EventBus = {}
    local events = {}

    function EventBus.getEvent(name)
      if not events[name] then
        local e = Instance.new("BindableEvent")
        e.Name = name
        e.Parent = game:GetService("ServerStorage"):FindFirstChild("Events")
        events[name] = e
      end
      return events[name]
    end

    function EventBus.fire(name, ...)
      EventBus.getEvent(name):Fire(...)
    end

    function EventBus.listen(name, callback)
      return EventBus.getEvent(name).Event:Connect(callback)
    end

CUSTOM SIGNAL CLASS (no Instance overhead):
  For high-frequency events where creating Instances is wasteful:

    local Signal = {}
    Signal.__index = Signal

    function Signal.new()
      local self = setmetatable({}, Signal)
      self._listeners = {}
      return self
    end

    function Signal:Connect(fn)
      table.insert(self._listeners, fn)
      return {
        Disconnect = function()
          local idx = table.find(self._listeners, fn)
          if idx then table.remove(self._listeners, idx) end
        end
      }
    end

    function Signal:Fire(...)
      for _, fn in self._listeners do
        task.spawn(fn, ...)
      end
    end

  Use inside services for internal event dispatching without Instance creation.

WHEN TO USE EVENTS vs DIRECT CALLS:
  Direct call: one service needs a specific answer from another.
    CombatService:GetPlayerDamage(player) → returns number.
  Event: something happened and multiple systems might care.
    "PlayerDied" → combat resets, UI shows death screen, stats update, achievement checks.
  Rule of thumb: if more than one system needs to react, use an event.
  If only one system needs the result, use a direct call.

────────────────────────────────────────────────────────────────────────────────
2.6 COLLECTIONSERVICE — Tag-Based Entity Systems
────────────────────────────────────────────────────────────────────────────────

CollectionService lets you tag Instances and iterate over all tagged Instances.
This is the professional way to build entity systems.

  local CS = game:GetService("CollectionService")

  -- Tag all pickup Parts in the editor with "Pickup"
  -- Then handle them uniformly in code:
  for _, pickup in CS:GetTagged("Pickup") do
    pickup.Touched:Connect(function(hit)
      local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
      if player then
        awardCurrency(player, pickup:GetAttribute("Value") or 10)
        pickup:Destroy()
      end
    end)
  end

  -- Listen for new tagged instances (added at runtime):
  CS:GetInstanceAddedSignal("Pickup"):Connect(function(pickup)
    -- same setup as above
  end)

  -- Listen for removal:
  CS:GetInstanceRemovedSignal("Pickup"):Connect(function(pickup)
    -- cleanup if needed
  end)

Use cases: "Lava" tag on all damaging Parts, "Checkpoint" on all save points,
"Enemy" on all NPC models, "Interactable" on all ProximityPrompt objects,
"DayNightLight" on all lights that should toggle with the day/night cycle.

────────────────────────────────────────────────────────────────────────────────
2.7 PROMISE / ASYNC PATTERNS
────────────────────────────────────────────────────────────────────────────────

Roblox Luau doesn't have native Promises, but the community pattern is standard:

TASK-BASED ASYNC:
  task.spawn(fn) — runs fn in a new thread immediately.
  task.defer(fn) — runs fn at end of current frame (after all synchronous code).
  task.delay(seconds, fn) — runs fn after a delay.
  task.wait(seconds) — yields current thread for seconds.

  Parallel async operations:
    local results = {}
    local threads = {}
    for i, url in urls do
      threads[i] = task.spawn(function()
        results[i] = fetchData(url)
      end)
    end
    -- Wait for all to complete (simple approach):
    task.wait(5)  -- timeout
    -- Or use a more robust completion signal.

PCALL WRAPPING:
  Every external call (DataStore, HTTP, MarketplaceService) MUST be pcalled:
    local success, result = pcall(function()
      return dataStore:GetAsync(key)
    end)
    if not success then
      warn("DataStore error:", result)
      -- handle error: return default data, retry, etc.
    end

DEBOUNCE PATTERN:
  Prevents a function from running too frequently:
    local debounce = {}
    function debouncedAction(player, action)
      local key = player.UserId .. "_" .. action
      if debounce[key] then return end
      debounce[key] = true
      task.delay(1, function() debounce[key] = nil end)
      -- actual action code here
    end


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 3: EXPLOIT PREVENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Roblox games are attacked by exploiters constantly. Every popular game gets
targeted within days. These are the attacks and defenses.

────────────────────────────────────────────────────────────────────────────────
3.1 MOVEMENT EXPLOITS
────────────────────────────────────────────────────────────────────────────────

SPEED HACKING:
  Attack: Exploiter modifies Humanoid.WalkSpeed or directly sets velocity.
  Detection: Server samples player position every 1-2 seconds. Calculate
    distance traveled vs maximum possible distance (WalkSpeed * deltaTime * 1.5).
    The 1.5 multiplier accounts for network jitter and legitimate speed boosts.
  Response: if distance > maxPossible for 3+ consecutive checks, teleport player
    back to last valid position. Log the violation. After 5 violations, kick.
  Do NOT just set WalkSpeed on the server — exploiters change it client-side
  and the server's value gets overwritten by client physics.

TELEPORT HACKING:
  Attack: Exploiter sets HumanoidRootPart.CFrame to any position.
  Detection: Track position deltas. If a player moves more than 100 studs
    in a single frame (or between two server position samples), flag it.
    Exception: legitimate teleports (game teleporter pads, respawns).
    Maintain a "expectedTeleport" flag that your own teleport code sets.
  Response: teleport back to last valid position. Log.

NOCLIP:
  Attack: Exploiter disables collision (CanCollide = false on character parts)
    to walk through walls.
  Detection: Raycast from the players previous position to current position.
    If the ray hits a wall/floor between the two points, the player noclipped.
    Only check when the player is moving (magnitude > 1 stud between samples).
  Response: teleport to last valid position.
  Alternative: use invisible collision-only Parts (Transparency 1, CanCollide true)
    in critical areas (vault doors, VIP rooms). Even if they noclip the visible
    walls, the invisible barriers remain server-authoritative.

FLYING:
  Attack: Exploiter gives themselves a BodyVelocity or sets gravity to 0.
  Detection: Raycast downward from the player position. If the nearest surface
    is more than jumpHeight + 5 studs below for 3+ consecutive seconds (and
    the player is not on a platform or in a vehicle), they are likely flying.
  Response: apply a downward force, teleport to ground, or kick.
  Exception: ladders, swimming, zip lines, jump pads — track these states.

────────────────────────────────────────────────────────────────────────────────
3.2 COMBAT EXPLOITS
────────────────────────────────────────────────────────────────────────────────

DAMAGE HACKING:
  Attack: Client fires RemoteEvent with inflated damage value.
  Prevention: NEVER include damage amount in the RemoteEvent args.
    Client sends: ("Attack", targetId, abilityId)
    Server looks up: abilities[abilityId].baseDamage, applies modifiers from
    server-side player stats, then deals the calculated damage.
  The client NEVER tells the server how much damage to deal.

COOLDOWN BYPASS:
  Attack: Client fires attack RemoteEvent faster than intended cooldown.
  Prevention: Track cooldowns SERVER-SIDE per player per ability:
    local cooldowns = {}
    remote.OnServerEvent:Connect(function(player, abilityId)
      local key = player.UserId .. "_" .. abilityId
      local now = os.clock()
      if cooldowns[key] and now - cooldowns[key] < ability.cooldown then
        return  -- still on cooldown, ignore
      end
      cooldowns[key] = now
      -- process ability
    end)

RANGE EXPLOIT:
  Attack: Client claims to hit a target that is actually 100 studs away.
  Prevention: Server checks distance between attacker and target:
    local distance = (attacker.Position - target.Position).Magnitude
    if distance > ability.maxRange * 1.2 then  -- 20% tolerance for latency
      return  -- too far, reject
    end

KILL AURA:
  Attack: Exploiter hits all players in range simultaneously.
  Prevention: server validates that only one target is hit per attack,
    or at most the weapon's intended AoE count. Track attack targets per frame.

────────────────────────────────────────────────────────────────────────────────
3.3 ECONOMY EXPLOITS
────────────────────────────────────────────────────────────────────────────────

CURRENCY HACKING:
  Attack: Exploiter modifies leaderstats values on the client.
  Prevention: Leaderstats are replicated from server to client, but client
    changes do NOT replicate back. HOWEVER, if your code reads leaderstats
    on the client and sends that value to the server, that is exploitable.
    ALWAYS use a server-side variable as the source of truth for currency.
    Leaderstats are for DISPLAY ONLY — update them from the server.

ITEM DUPLICATION:
  Attack: Rapidly fire "buy" and "sell" on the same item, or disconnect
    mid-transaction to exploit race conditions.
  Prevention: use transactions with locks:
    local processing = {}
    function purchaseItem(player, itemId)
      local key = player.UserId
      if processing[key] then return false end
      processing[key] = true
      -- validate, deduct, add to inventory
      processing[key] = nil
      return true
    end
  Also verify inventory state AFTER the transaction, not just before.

REMOTE SPAM:
  Attack: Exploiter fires RemoteEvents thousands of times per second.
  Prevention: rate limit per player per remote:
    local rateLimits = {}
    local MAX_PER_SECOND = 30

    function isRateLimited(player, remoteName)
      local key = player.UserId .. "_" .. remoteName
      local now = os.clock()
      if not rateLimits[key] then rateLimits[key] = {count=0, resetTime=now+1} end
      if now > rateLimits[key].resetTime then
        rateLimits[key] = {count=0, resetTime=now+1}
      end
      rateLimits[key].count += 1
      if rateLimits[key].count > MAX_PER_SECOND then
        return true  -- rate limited
      end
      return false
    end

    remote.OnServerEvent:Connect(function(player, ...)
      if isRateLimited(player, "AttackRemote") then
        warn(player.Name, "rate limited on AttackRemote")
        return
      end
      -- handle normally
    end)

────────────────────────────────────────────────────────────────────────────────
3.4 DATA SECURITY
────────────────────────────────────────────────────────────────────────────────

GUI MANIPULATION:
  Attack: Exploiter changes GUI values (e.g., sets price TextLabel to "0"
    then fires buy remote).
  Prevention: NEVER read values from client GUI to determine server actions.
    The server must look up all prices, stats, and quantities from its own data.

SERVERSTORAGE PROTECTION:
  Clients CANNOT access ServerStorage or ServerScriptService. Put sensitive
  data here: item catalogs with prices, ability definitions, secret keys,
  admin lists, anti-cheat thresholds.

REPLICATEDSTORAGE CAUTION:
  Clients CAN see EVERYTHING in ReplicatedStorage. Do NOT put:
    Admin scripts, secret configurations, encrypted keys, cheat detection
    thresholds, or any logic you dont want exploiters to read.
  DO put: shared modules (UI components, utility functions), RemoteEvents/Functions,
    shared assets (models, sounds, animations), shared type definitions.

STRING FILTERING:
  Any text input from players (chat, signs, names) MUST be filtered through
  TextService:FilterStringAsync() before displaying to other players.
  This is a Roblox REQUIREMENT — failure to filter text can get your game
  taken down.

MODULEDETECTION:
  Exploiters can require() any ModuleScript in ReplicatedStorage. If you have
  a module that performs admin actions, it MUST check the caller:
    function AdminModule.resetPlayer(callerPlayer, targetPlayer)
      if not isAdmin(callerPlayer) then return end  -- verify caller is admin
      -- proceed
    end


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 4: PERFORMANCE OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A game that lags loses players. Performance is a feature.

────────────────────────────────────────────────────────────────────────────────
4.1 PART COUNT AND RENDERING
────────────────────────────────────────────────────────────────────────────────

TARGETS (frames per second depends on device):
  Mobile (phone/tablet): <10,000 Parts total. Target 30+ FPS.
  Console/mid PC: <25,000 Parts. Target 60 FPS.
  High-end PC: <50,000 Parts with StreamingEnabled. Target 60 FPS.
  With StreamingEnabled and good LOD: up to 100,000+ Parts possible.

REDUCING PART COUNT:
  Merge decorative details that players never interact with (using UnionOperation).
  Use Texture tiling instead of individual small Parts for surface detail.
  Use Decals for flat detail instead of protruding Parts.
  Use BillboardGui for overhead indicators instead of 3D Part assemblies.
  Remove Parts that players never see (inside solid walls, underground).
  Use MeshParts for complex objects — one MeshPart vs 20 primitives.

────────────────────────────────────────────────────────────────────────────────
4.2 INSTANCE CREATION OPTIMIZATION
────────────────────────────────────────────────────────────────────────────────

Instance.new() is expensive. The golden rule: set ALL properties BEFORE
setting Parent. When you set Parent, Roblox fires change events, updates
the spatial hash, and replicates to clients. Setting properties after parenting
causes redundant updates.

  BAD (fires events on every property change after parenting):
    local part = Instance.new("Part")
    part.Parent = workspace
    part.Size = Vector3.new(4, 1, 4)
    part.Position = Vector3.new(0, 5, 0)
    part.Material = Enum.Material.Brick
    part.Color = Color3.fromRGB(180, 100, 60)
    part.Anchored = true

  GOOD (one event batch when parented):
    local part = Instance.new("Part")
    part.Size = Vector3.new(4, 1, 4)
    part.Position = Vector3.new(0, 5, 0)
    part.Material = Enum.Material.Brick
    part.Color = Color3.fromRGB(180, 100, 60)
    part.Anchored = true
    part.Parent = workspace  -- set parent LAST

BULK CREATION:
  When creating many Parts (terrain detail, forests, crowds):
    Create them all with Parent = nil.
    Set all properties.
    Then parent them all at once to a Model, then parent the Model to workspace.
    This batches the replication into one network update.

────────────────────────────────────────────────────────────────────────────────
4.3 OBJECT POOLING
────────────────────────────────────────────────────────────────────────────────

Creating and destroying Instances every frame (projectiles, particles, damage
numbers, UI notifications) causes garbage collection spikes.

POOL PATTERN:
  Pre-create N instances at game start. Store them in a "pool" (table).
  When you need one: take it from the pool, configure it, parent it.
  When done: unparent it (or move to nil parent), reset properties, return to pool.

  local ObjectPool = {}
  ObjectPool.__index = ObjectPool

  function ObjectPool.new(template, initialSize)
    local self = setmetatable({}, ObjectPool)
    self._available = {}
    self._template = template
    for i = 1, initialSize do
      local clone = template:Clone()
      clone.Parent = nil
      table.insert(self._available, clone)
    end
    return self
  end

  function ObjectPool:get()
    if #self._available > 0 then
      return table.remove(self._available)
    end
    -- Pool empty, create a new one (grows dynamically)
    return self._template:Clone()
  end

  function ObjectPool:release(instance)
    instance.Parent = nil
    table.insert(self._available, instance)
  end

USE FOR: projectiles (bullets, arrows, magic bolts), damage number popups,
particle effect containers, enemy NPCs (respawn = reuse from pool),
collectible coins, UI notification frames, trail effects.

────────────────────────────────────────────────────────────────────────────────
4.4 STREAMING AND LOD
────────────────────────────────────────────────────────────────────────────────

STREAMRINGENABLED (workspace property):
  Automatically loads/unloads Parts based on player proximity.
  StreamingMinRadius: Parts within this distance are always loaded (default 64).
  StreamingTargetRadius: Parts loaded up to this distance as budget allows (256).
  StreamOutBehavior: what happens to far-away Parts.
    Default: remove from client memory entirely.
    LowMemory: only stream out when device is low on memory.
    Opportunistic: stream out when they are far and not visible.

  Critical for large maps. A 2000x2000 stud map with 50K Parts is unplayable
  without streaming. With streaming, only ~5K Parts near the player are loaded.

  GOTCHAS:
    Scripts that reference Parts by path (workspace.Building.Door) can fail
    if the Part hasnt streamed in yet. Use WaitForChild() or :StreamIn() to
    ensure the Part exists before accessing it.
    Anchored Parts stream more reliably than unanchored physics Parts.
    Models with ModelStreamingMode = Persistent never stream out (use for
    critical gameplay elements like spawn points).
    Models with ModelStreamingMode = Nonatomic allow partial streaming
    (some children loaded, others not). Atomic loads all-or-nothing.

LOD (LEVEL OF DETAIL):
  Show simpler models at distance, detailed models up close.
  Manual LOD: create 2-3 versions of complex models. Script-swap based on
  distance: if distance > 200 then show LOD2, if > 500 then show LOD3.
  MeshPart RenderFidelity = Automatic lets Roblox handle LOD for mesh assets.
  For Part-based builds: merge distant decorative Parts into unions to reduce count.

────────────────────────────────────────────────────────────────────────────────
4.5 COLLISION OPTIMIZATION
────────────────────────────────────────────────────────────────────────────────

COLLISION GROUPS:
  PhysicsService:RegisterCollisionGroup("Players")
  PhysicsService:RegisterCollisionGroup("Projectiles")
  PhysicsService:RegisterCollisionGroup("Decorations")
  PhysicsService:CollisionGroupSetCollidable("Projectiles", "Decorations", false)
  PhysicsService:CollisionGroupSetCollidable("Players", "Decorations", true)

  This prevents unnecessary collision checks between objects that should never
  interact (bullets vs decorative props, NPCs vs other NPCs, etc).
  Significantly reduces physics solver workload in combat-heavy games.

CANQUERY AND CANCOLLIDE:
  CanCollide = false: Part ignores physics collisions (passes through everything).
  CanQuery = false: Part is invisible to Raycasts and spatial queries.
  CanTouch = false: Part doesnt fire .Touched events.
  Set all three to false for purely visual Parts (distant decorations, skybox elements).
  Set CanCollide = false + CanQuery = true for trigger zones (area detection without physics).

────────────────────────────────────────────────────────────────────────────────
4.6 FRAME BUDGET AND TIMING
────────────────────────────────────────────────────────────────────────────────

HEARTBEAT vs RENDERSTEPPED vs STEPPED:
  Heartbeat: fires AFTER physics simulation each frame. Use for: game logic,
    NPC AI updates, damage-over-time, position tracking, most gameplay code.
    This is the default choice for "every frame" logic.
  RenderStepped: fires BEFORE rendering each frame. CLIENT ONLY. Use for:
    camera manipulation, first-person viewmodel updates, UI that must be
    perfectly synced with the render frame. Expensive code here causes visible stutter.
  Stepped: fires BEFORE physics each frame. Use for: applying forces, setting
    velocities, anything that needs to happen before physics resolves.

  BUDGET: at 60 FPS, each frame has ~16.67ms total. Physics, rendering, and
  networking consume most of this. Your script budget is roughly 4-6ms per frame.
  Use MicroProfiler (Ctrl+F6 in Studio) to see exactly where time is spent.

DEBOUNCE AND THROTTLING:
  Not everything needs to run every frame:
    NPC pathfinding: update every 0.5-1 second, not every frame.
    UI stat updates: refresh every 0.1-0.5 seconds.
    Distance checks: every 0.25-1 seconds for non-critical systems.
    DataStore saves: every 300 seconds.
    Leaderboard refresh: every 60 seconds.

  Pattern:
    local lastUpdate = 0
    local UPDATE_INTERVAL = 0.5
    RunService.Heartbeat:Connect(function()
      local now = os.clock()
      if now - lastUpdate < UPDATE_INTERVAL then return end
      lastUpdate = now
      -- expensive logic here
    end)

────────────────────────────────────────────────────────────────────────────────
4.7 MEMORY MANAGEMENT
────────────────────────────────────────────────────────────────────────────────

DISCONNECT EVENTS:
  Every :Connect() returns a connection. Store it and call :Disconnect() when
  the object is done. Failure to disconnect = memory leak + ghost behavior.
  Especially critical for per-player connections (disconnect on PlayerRemoving).

DESTROY INSTANCES:
  Instance:Destroy() removes from parent AND disconnects all event connections.
  Always Destroy temporary effects, UI elements, projectiles when done.
  Do NOT just set Parent = nil — that leaves the Instance in memory with
  active connections.

TABLE CLEANUP:
  Large tables holding per-player data must be cleaned on PlayerRemoving:
    Players.PlayerRemoving:Connect(function(player)
      playerData[player.UserId] = nil
      cooldowns[player.UserId] = nil
      combatState[player.UserId] = nil
    end)

PARALLEL LUAU:
  Roblox supports multi-threaded Luau via task.desynchronize() / task.synchronize().
  Code between desynchronize and synchronize runs on a worker thread.
  Use for: expensive calculations (pathfinding, terrain generation, AI decisions)
  that dont need to access the DataModel.
  CANNOT: create/destroy/parent Instances, fire events, or access most services
  while desynchronized. Do the heavy math desynchronized, then synchronize
  to apply results.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 5: PROFESSIONAL VISUAL EFFECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Effects that make games feel polished and alive.

────────────────────────────────────────────────────────────────────────────────
5.1 PARTICLEEMITTER DEEP-DIVE
────────────────────────────────────────────────────────────────────────────────

ParticleEmitter is the most versatile effect tool in Roblox. Every property:

  Rate: particles per second. 10-30 for subtle, 50-100 for dense, 200+ for explosions.
  Lifetime: NumberRange — how long each particle lives. min-max seconds.
    Short (0.1-0.5): sparks, impacts, flashes.
    Medium (0.5-2): fire, smoke, magic.
    Long (2-5): snow, rain, floating dust.
  Speed: NumberRange — initial velocity. Higher = faster particles.
  SpreadAngle: Vector2 — cone of emission. (0,0) = focused beam. (180,180) = sphere.
    (360,0) = flat disc. (45,45) = narrow cone.
  EmissionDirection: which face particles emit from (Top, Front, etc).

  Size: NumberSequence — particle size over its lifetime.
    Fire: starts large (2-3), shrinks to 0 (rising flame shape).
    Smoke: starts small (1), grows large (5-8) (expanding cloud).
    Sparkle: stays small (0.3-0.5) throughout.
    Explosion: large start (5), rapid shrink to 0.

  Color: ColorSequence — color over lifetime.
    Fire: bright yellow (0s) → orange (0.3s) → dark red (0.7s) → black/transparent (1s).
    Smoke: light gray → dark gray → transparent.
    Magic: bright white → accent color → dark.
    Health: green (full) → yellow (half) → red (low) — for health bar particles.

  Transparency: NumberSequence — opacity over lifetime.
    Most effects: 0 (opaque) at start → 1 (invisible) at end = fade out.
    Pulse: 1 → 0 → 1 = flash in the middle of lifetime.
    Ghost: 0.5 → 0.8 → 1 = always partially transparent.

  Rotation: NumberRange — initial rotation of each particle (degrees).
    Random rotation (0, 360) makes particles look natural, not uniform.
  RotSpeed: NumberRange — rotation speed. Slight spin (10-30) adds life.
    Debris/sparks: high spin (100-360).

  Drag: slows particles over time. 0 = no drag. 2-5 = particles decelerate.
    Fire: Drag 2 (flames slow as they rise). Sparks: Drag 5 (arc and fall).
  Acceleration: Vector3 — constant force. (0,-10,0) = gravity pulling particles down.
    Smoke: (0, 2, 0) = gentle upward drift. Rain: (0, -50, 0) = fast fall.
    Snow: (0, -2, 0) = gentle fall. Sparks: (0, -20, 0) = arc downward.

  LightEmission: 0-1. At 1, particle colors ADD to the scene (glow effect).
    Use 0.8-1 for fire, magic, energy effects. Use 0 for smoke, dust, debris.
  LightInfluence: 0-1. At 0, particles are self-illuminated (unaffected by scene light).
    Use 0 for UI particles, glowing effects. Use 1 for realistic dust/smoke.

  Texture: asset ID for the particle image. Default = white square.
    Use rbxasset://textures/particles/sparkles_main.dds for sparkles.
    Use rbxasset://textures/particles/smoke_main.dds for soft clouds.
    Use rbxasset://textures/particles/fire_main.dds for fire.
    Custom textures: upload a white-on-transparent PNG for best color control.

EFFECT RECIPES:

  FIRE (campfire, torch):
    Rate = 40-60, Lifetime = (0.3, 1.0), Speed = (3, 6)
    Size: {0, 2.5}, {0.4, 1.5}, {1, 0}  (shrinks as it rises)
    Color: {0, Color3.new(1,0.9,0.3)}, {0.4, Color3.new(1,0.4,0)}, {1, Color3.new(0.3,0,0)}
    Transparency: {0, 0.2}, {0.7, 0.5}, {1, 1}
    SpreadAngle = (15, 15), EmissionDirection = Top
    Acceleration = (0, 3, 0), Drag = 2, LightEmission = 1
    Pair with: PointLight (orange, Brightness 2, Range 16, Shadows true)

  SMOKE (chimney, exhaust):
    Rate = 15-25, Lifetime = (2, 4), Speed = (1, 3)
    Size: {0, 1}, {0.5, 4}, {1, 7}  (expands as it rises)
    Color: {0, Color3.new(0.5,0.5,0.5)}, {1, Color3.new(0.2,0.2,0.2)}
    Transparency: {0, 0.3}, {0.5, 0.6}, {1, 1}
    SpreadAngle = (10, 10), Drag = 1, Acceleration = (0, 1.5, 0)
    LightEmission = 0, LightInfluence = 1
    RotSpeed = (-20, 20), Rotation = (0, 360)

  MAGIC SPARKLE (enchantment, healing, buff):
    Rate = 25-40, Lifetime = (0.3, 0.8), Speed = (1, 4)
    Size: {0, 0.5}, {0.5, 0.3}, {1, 0}
    Color: white or gold base, accent color at 0.5 lifetime
    Transparency: {0, 0.2}, {1, 1}
    SpreadAngle = (180, 180), LightEmission = 1
    Texture = sparkle texture

  RAIN:
    Rate = 200-400, Lifetime = (0.8, 1.5), Speed = (30, 50)
    Size: {0, 0.1}, {1, 0.1}  (thin streaks)
    Color: light blue/white, Transparency: {0, 0.3}, {1, 0.6}
    SpreadAngle = (5, 5), EmissionDirection = Top (from high invisible Part at Y=200)
    Acceleration = (0, -10, 0), LightEmission = 0
    IMPORTANT: parent the emitter to a large invisible Part high above the map.
    Set the Parts Size to cover the play area width (200x1x200).

  SNOW:
    Rate = 50-100, Lifetime = (3, 6), Speed = (1, 4)
    Size: {0, 0.3}, {1, 0.5}
    Color: white, Transparency: {0, 0.1}, {0.8, 0.3}, {1, 1}
    SpreadAngle = (45, 45), Drag = 3, Acceleration = (0, -2, 0)
    RotSpeed = (-30, 30), Rotation = (0, 360)

  DUST/POLLEN (floating in sunbeams):
    Rate = 5-10, Lifetime = (4, 8), Speed = (0.2, 0.5)
    Size: {0, 0.1}, {0.5, 0.15}, {1, 0.1}
    Color: warm yellow/white, Transparency: {0, 0.5}, {0.5, 0.3}, {1, 0.8}
    SpreadAngle = (180, 180), Drag = 1
    LightEmission = 0.5, LightInfluence = 0.5

  WATERFALL MIST:
    Rate = 60-100, Lifetime = (1, 3), Speed = (2, 5)
    Size: {0, 0.5}, {0.5, 2}, {1, 4}
    Color: white/light blue, Transparency: {0, 0.4}, {0.5, 0.6}, {1, 1}
    SpreadAngle = (60, 60), EmissionDirection = Front (facing outward from falls)
    Acceleration = (0, -3, 0), Drag = 2

────────────────────────────────────────────────────────────────────────────────
5.2 BEAM EFFECTS — Lines of Energy
────────────────────────────────────────────────────────────────────────────────

Beams render a textured strip between two Attachments. Use for:
  Lasers, lightning bolts, connection lines, tractor beams, web strands,
  energy tethers, bridge force fields, portal edges, scanner lines.

Properties:
  Attachment0 / Attachment1: start and end points (Attachments in Parts).
  Width0 / Width1: width at each end. Same = uniform beam. Different = tapered.
  Color: ColorSequence over the beams length.
  Transparency: NumberSequence over the beams length.
  Segments: more segments = smoother curves (default 10, use 20-30 for curves).
  CurveSize0 / CurveSize1: control bezier curve (positive = bow outward).
    Lightning: random CurveSize0/CurveSize1 values, update every 0.1s.
  TextureLength: how many studs per texture repeat. Smaller = more repeats.
  TextureSpeed: scroll speed. Positive = flows from 0 to 1. Use 1-3 for energy flow.
  LightEmission: 0-1. Set to 1 for glowing beams (lasers, energy).
  FaceCamera: true makes the beam always face the player (billboard effect).

LIGHTNING EFFECT:
  Create 3-5 overlapping Beams between same Attachments.
  Each Beam: different Width (0.1, 0.3, 0.8), different Transparency.
  Core beam: thin (0.1), bright white, Transparency 0.
  Glow beams: wider (0.3-0.8), accent color, Transparency 0.3-0.7.
  Animate: every 0.05-0.1 seconds, randomize CurveSize0 and CurveSize1
  between -5 and 5 for jagged lightning appearance.

────────────────────────────────────────────────────────────────────────────────
5.3 TRAIL EFFECTS
────────────────────────────────────────────────────────────────────────────────

Trails render a fading strip behind a moving Part. Requires two Attachments
on the same Part, defining the "edge" of the trail.

Use for: sword swipes, speed trails, magic wand traces, vehicle exhaust,
bullet tracers, teleport afterimages.

Properties:
  Attachment0 / Attachment1: two points on the moving Part. The trail renders
    between these two points as the Part moves. For a sword: one Attachment
    at the hilt, one at the tip.
  Lifetime: how long the trail persists behind the moving Part. 0.2-0.5 for fast
    actions (sword swipes), 1-3 for persistent trails (speed lines).
  Color: ColorSequence. Can change color from new to old trail.
  Transparency: NumberSequence. Usually {0, 0} → {1, 1} (fade out).
  MinLength: minimum distance the Part must move before a new trail segment.
    Lower = smoother trail (0.1). Higher = performance savings (1).
  WidthScale: NumberSequence. Can taper the trail (wide at Part, thin at tail).
  TextureLength: repeating texture along the trail length.
  LightEmission: 1 for glowing trails (magic, energy).

SWORD SWIPE SETUP:
  Two Attachments on the blade Part:
    Attachment0: Position = (0, -bladeLength/2, 0) (hilt end)
    Attachment1: Position = (0, bladeLength/2, 0) (tip)
  Trail: Lifetime = 0.15-0.3, Color = white or weapon element color,
    Transparency = {0, 0}, {1, 1}, LightEmission = 0.8 for energy weapons.
  Enable the Trail only during attack animations, disable when idle.

────────────────────────────────────────────────────────────────────────────────
5.4 SCREEN EFFECTS — Post-Processing
────────────────────────────────────────────────────────────────────────────────

These go in Lighting (global) or Camera (per-player):

COLORCORRECTION:
  Brightness: -1 to 1. Subtle adjustments (0.05-0.1). Use for mood shifts.
  Contrast: -1 to 1. Higher = more vivid darks/lights. 0.1-0.2 for cinematic.
  Saturation: -1 to 1. Negative = desaturated/gray. Use -0.3 for rain, -1 for death.
  TintColor: multiplies all colors. Use for mood:
    Horror: Color3.fromRGB(255, 200, 200) = slight red tint.
    Underwater: Color3.fromRGB(150, 200, 255) = blue tint.
    Flashback: Color3.fromRGB(255, 230, 180) = sepia warm.
    Night vision: Color3.fromRGB(150, 255, 150) = green tint.

BLOOM:
  Makes bright areas glow. Intensity (0-1), Size (1-56), Threshold (0-2).
  Subtle: Intensity 0.3, Size 24, Threshold 1.2 (only very bright things bloom).
  Dreamy: Intensity 0.8, Size 40, Threshold 0.8 (everything blooms softly).
  Sci-fi: Intensity 1, Size 30, Threshold 0.9 (strong neon glow).

SUNRAYS:
  Visible light shafts from the sun. Intensity (0-1), Spread (0-1).
  Forest: Intensity 0.1, Spread 0.5 = subtle rays through tree canopy.
  Cathedral: Intensity 0.15, Spread 0.3 = dramatic window light shafts.
  Skip entirely for night scenes, indoor scenes, or overcast weather.

BLUR:
  Uniform blur. Size (0-56). Use for:
    Paused game overlay: Blur Size 24 behind pause menu.
    Depth-of-field alternative: apply briefly during cutscene transitions.
    Loading screen: blur the game world behind a loading UI.
  Do NOT leave blur active during gameplay — it ruins playability.

DEPTHOFFIELD:
  Cinematic focus effect. FocusDistance = distance to sharp area.
  InFocusRadius = range around FocusDistance thats sharp.
  FarIntensity / NearIntensity = blur strength outside focus zone.
  Use subtly (FarIntensity 0.1-0.2) for a cinematic feel without hurting gameplay.
  Turn off during competitive/fast-paced gameplay.

────────────────────────────────────────────────────────────────────────────────
5.5 CAMERA EFFECTS
────────────────────────────────────────────────────────────────────────────────

FOV (Field of View):
  Default = 70 degrees. Lower = zoomed in (50 = telephoto feel). Higher = wide angle.
  Speed effect: when player sprints, tween FOV from 70 → 85 over 0.3s. Revert on stop.
  Aim-down-sights: tween FOV from 70 → 45 for zoom effect.
  Horror jumpscare: snap FOV to 120 then tween back to 70 quickly.

CFRAME.LOOKAT FOR CUTSCENES:
  Smooth camera movement between points:
    local startCF = CFrame.lookAt(startPos, lookTarget)
    local endCF = CFrame.lookAt(endPos, lookTarget)
    -- Tween: interpolate between startCF and endCF over duration
    -- Use camera.CameraType = Enum.CameraType.Scriptable
    -- TweenService:Create(camera, TweenInfo.new(3, Enum.EasingStyle.Sine), {CFrame = endCF})

SCREEN SHAKE:
  Apply random offsets to camera CFrame for impact/explosion feel:
    local shakeIntensity = 1  -- studs of offset
    local shakeDuration = 0.3
    local start = os.clock()
    RunService.RenderStepped:Connect(function()
      local elapsed = os.clock() - start
      if elapsed > shakeDuration then return end
      local fade = 1 - (elapsed / shakeDuration)  -- fade out
      local offset = Vector3.new(
        (math.random() - 0.5) * 2 * shakeIntensity * fade,
        (math.random() - 0.5) * 2 * shakeIntensity * fade,
        0
      )
      camera.CFrame = camera.CFrame * CFrame.new(offset)
    end)

SPRING-DAMPER CAMERA FOLLOW:
  For smooth third-person cameras that dont feel rigid:
    Maintain a "desired" position and a "current" position.
    Each frame: current = current + (desired - current) * damping * dt
    Damping of 5-10 gives a smooth, responsive follow.
    This absorbs sudden movements and gives a professional camera feel.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 6: SOUND DESIGN DEEP-DIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sound is 50% of immersion. A silent game feels dead. Professional audio
implementation uses layered systems, spatial positioning, and dynamic mixing.

────────────────────────────────────────────────────────────────────────────────
6.1 SOUND ARCHITECTURE
────────────────────────────────────────────────────────────────────────────────

SOUNDSERVICE vs WORKSPACE SOUNDS:
  Sound in SoundService: plays globally, same volume everywhere. Non-spatial.
    Use for: background music, UI sounds, global announcements, ambient bed tracks.
  Sound in a workspace Part: spatial audio. Volume depends on player distance.
    Use for: environmental sounds (waterfall, fire, machinery), prop sounds
    (radio playing, TV audio), interaction feedback (door creak, switch click).

ROLLOFFMODE — How Sound Fades with Distance:
  InverseTapered (recommended): Natural sound fallback. Full volume within
    RollOffMinDistance, then smoothly fades to zero at RollOffMaxDistance.
    Most realistic for outdoor environments.
  Linear: Constant fade rate from min to max distance. Predictable but less natural.
    Good for UI-like spatial sounds where exact control matters.
  Inverse: Sharp drop-off near the source, very quiet at distance. Old default.
    Rarely the best choice — InverseTapered is almost always better.
  InverseTaperedSquared: Even sharper drop-off. Use for very localized sounds
    (whispers, small flames, ticking clocks).

  RollOffMinDistance: distance at which sound starts fading (default 10).
    Small props (candle, clock): 3-5 studs.
    Medium sources (fireplace, fountain): 10-15 studs.
    Large sources (waterfall, explosion): 20-40 studs.
  RollOffMaxDistance: distance at which sound is silent (default 10000).
    Set this to a reasonable value! Default 10000 means the sound is audible
    across the entire map. Typical: 40-100 for props, 100-200 for ambient,
    200-500 for large environmental features.

────────────────────────────────────────────────────────────────────────────────
6.2 SOUNDGROUP HIERARCHY
────────────────────────────────────────────────────────────────────────────────

Professional games organize audio into groups for independent volume control:

  SoundService
    SoundGroup "Master" (Volume 1.0)
      SoundGroup "Music" (Volume 0.3)
      SoundGroup "SFX" (Volume 0.5)
      SoundGroup "UI" (Volume 0.6)
      SoundGroup "Ambient" (Volume 0.4)
      SoundGroup "Voice" (Volume 0.7)

  Each Sound sets its SoundGroup property to the appropriate group.
  Players adjust group volumes independently in settings.
  Master volume scales everything globally.

  Implementation pattern:
    Settings UI has sliders for Music, SFX, Ambient.
    Slider changes SoundGroup.Volume.
    Save volumes to player DataStore (persist between sessions).
    Load on join and apply to SoundGroups.

────────────────────────────────────────────────────────────────────────────────
6.3 MUSIC SYSTEM
────────────────────────────────────────────────────────────────────────────────

PLAYLIST:
  Store 3-5 music tracks. Play sequentially or shuffled. On track end, crossfade
  to the next track (fade current out over 2 seconds, fade next in over 2 seconds).

  Pattern:
    local playlist = {musicId1, musicId2, musicId3}
    local currentIndex = 1
    local currentSound = nil

    function playNext()
      local nextIndex = currentIndex % #playlist + 1
      local nextSound = createSound(playlist[nextIndex])
      -- Crossfade
      if currentSound then
        tweenVolume(currentSound, 0, 2, function() currentSound:Destroy() end)
      end
      nextSound.Volume = 0
      nextSound:Play()
      tweenVolume(nextSound, targetVolume, 2)
      currentSound = nextSound
      currentIndex = nextIndex
    end

AREA-BASED MUSIC:
  Different map areas play different tracks. Use invisible trigger zones:
  When player enters a zone (Region3 check or Touched event on a large transparent
  Part), crossfade to that zones music track.
  Zones: overworld = epic orchestral, dungeon = dark ambient, town = cheerful folk,
  boss arena = intense battle music.

DYNAMIC MUSIC LAYERS:
  Advanced technique: load multiple stems of the same track (drums, melody, bass).
  Start with just ambient pad. When combat starts, layer in drums. When intensity
  peaks, add full melody. Fade layers in/out based on game state.

────────────────────────────────────────────────────────────────────────────────
6.4 AMBIENT SOUND LAYERS
────────────────────────────────────────────────────────────────────────────────

Professional ambient audio has 2-3 layers:

  BASE DRONE: continuous, looped, low-key background. Sets the "feel" of the area.
    Forest: gentle wind + distant birds loop. Volume 0.15.
    City: distant traffic + crowd murmur. Volume 0.2.
    Cave: deep rumble + water drips. Volume 0.1.
    Ocean: waves crashing + wind. Volume 0.2.

  RANDOM ONE-SHOTS: intermittent sounds that prevent the ambience from feeling static.
    Forest: individual bird chirp (every 5-15 seconds), twig snap, rustling leaves.
    City: car horn (every 10-30s), siren in distance, dog bark.
    Cave: rock crumble, bat squeak, distant echo.
    Ocean: seagull cry, whale call (rare, every 60s).

  Implementation:
    task.spawn(function()
      while true do
        task.wait(math.random(5, 15))
        local randomSound = oneShots[math.random(1, #oneShots)]
        playOneShot(randomSound, getRandomPosition())
      end
    end)

WEATHER AUDIO:
  Rain: continuous patter sound (SoundService, Volume 0.3) + individual drip
  sounds on nearby surfaces (spatial, random intervals).
  Thunder: one-shot at random 20-60 second intervals, varying distance
  (Volume 0.3-0.8, slight delay from lightning flash).
  Wind: continuous, but modulate Volume with math.sin for gusts:
    RunService.Heartbeat:Connect(function()
      windSound.Volume = baseVolume + math.sin(os.clock() * 0.5) * 0.1
    end)

────────────────────────────────────────────────────────────────────────────────
6.5 MATERIAL-BASED FOOTSTEPS
────────────────────────────────────────────────────────────────────────────────

The detail that makes movement feel grounded:

  Connect to Humanoid.Running and Humanoid:GetState().
  On each step (based on WalkSpeed timing):
    Raycast down from character to detect FloorMaterial.
    Play the matching footstep sound with slight pitch variation (±0.05):

    local footstepSounds = {
      [Enum.Material.Grass] = grassStepId,
      [Enum.Material.Concrete] = concreteStepId,
      [Enum.Material.Wood] = woodStepId,
      [Enum.Material.Metal] = metalStepId,
      [Enum.Material.Sand] = sandStepId,
      [Enum.Material.Slate] = stoneStepId,
      [Enum.Material.Water] = splashStepId,
      [Enum.Material.Snow] = snowCrunchId,
    }

  Pitch variation: sound.PlaybackSpeed = 1 + (math.random() - 0.5) * 0.1
  This prevents the robotic "same sound every step" feel.
  Volume: 0.3-0.5. Footsteps should be audible but not dominant.

────────────────────────────────────────────────────────────────────────────────
6.6 UI AND INTERACTION SOUNDS
────────────────────────────────────────────────────────────────────────────────

Every interactive element needs audio feedback:

  BUTTONS: short click sound (0.1-0.2 seconds). Subtle. Volume 0.3-0.5.
    Hover: even subtler (Volume 0.1-0.2, higher pitch).
    Success: bright chime/ding.
    Error: low buzz or negative tone.

  COMBAT: layer multiple sounds for richness:
    Melee hit = impact thud + whoosh + optional voice grunt.
    Ranged shot = fire/launch + travel whoosh + impact on hit.
    Critical hit = louder impact + special "crunch" or "shatter" sound.
    All combat sounds: slight random pitch shift (±0.05) to prevent repetitive feel.

  COLLECTIBLES: bright, satisfying pickup sounds.
    Coins: metallic clink/ding.
    Gems: crystalline sparkle.
    Health: soft warm tone (ascending pitch).
    Power-up: energizing whoosh + chime.

  ENVIRONMENT INTERACTION:
    Door open: creak + latch click.
    Door close: thud + click.
    Chest open: creak + magical shimmer.
    Switch/lever: mechanical click + optional power-up hum.
    Water enter: splash. Water swimming: continuous gentle splashing.

REVERB (SoundEffect):
  Add a ReverbSoundEffect to SoundGroups or individual Sounds:
    DecayTime: how long sound echoes. 0.5 = small room. 2 = large hall. 5+ = cathedral/cave.
    Density and Diffusion: keep near 1 for natural reverb.
    DryLevel and WetLevel: balance between original and reverbed signal.
  Area-based reverb: detect what "room" the player is in (large hall vs small closet)
  and adjust DecayTime accordingly. Outdoor areas: minimal reverb (DecayTime 0.3).
  Caves: heavy reverb (DecayTime 3-5).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 7: MONETIZATION BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Earning Robux ethically while keeping players happy.

────────────────────────────────────────────────────────────────────────────────
7.1 GAME PASSES — One-Time Purchases
────────────────────────────────────────────────────────────────────────────────

Game Passes are bought once, owned forever. Use for permanent upgrades:
  VIP Pass: 2x coins, exclusive area, VIP chat tag, special cosmetics. Price: 199-499 Robux.
  2x Speed: doubled WalkSpeed. Price: 49-149 Robux.
  Extra Inventory Slots: 50 → 100 slots. Price: 99-199 Robux.
  Radio Pass: play custom music. Price: 49-99 Robux.
  Fly Pass: ability to fly. Price: 199-499 Robux (if game allows).
  Double Jump: extra jump mid-air. Price: 49-99 Robux.

CHECK OWNERSHIP:
  MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamePassId)
  Cache the result per session — dont call every time you need to check.
  Check on player join and store in a per-player state table.

PROMPT PURCHASE:
  MarketplaceService:PromptGamePassPurchase(player, gamePassId)
  Listen for: MarketplaceService.PromptGamePassPurchaseFinished
  Grant benefits immediately after purchase confirmation.

────────────────────────────────────────────────────────────────────────────────
7.2 DEVELOPER PRODUCTS — Repeatable Purchases
────────────────────────────────────────────────────────────────────────────────

Developer Products can be bought multiple times. Use for consumable items:
  100 Coins Pack: price 49 Robux.
  500 Coins Pack: price 199 Robux (better value — encourages bigger purchase).
  Revive Token: respawn instantly after death. Price: 25-49 Robux.
  Speed Boost (30 min): temporary 2x speed. Price: 25-49 Robux.
  Inventory Expansion: +10 slots each purchase. Price: 49-99 Robux.
  Skip Level: jump to next stage in obby. Price: 25-49 Robux.

RECEIPT PROCESSING (CRITICAL):
  MarketplaceService.ProcessReceipt is the callback that runs AFTER a player buys
  a Developer Product. You MUST:
    1. Identify the product and player from the receiptInfo.
    2. Grant the item/currency/effect.
    3. Save the grant to DataStore (so it persists if server crashes).
    4. Return Enum.ProductPurchaseDecision.PurchaseGranted.
  If you return NotProcessedYet, Roblox will retry the callback later.
  If your game crashes before returning PurchaseGranted, Roblox retries on
  the players next join. This is why you must save grants before returning.

  Pattern:
    MarketplaceService.ProcessReceipt = function(receiptInfo)
      local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
      if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

      local productId = receiptInfo.ProductId
      if productId == COINS_100_ID then
        addCoins(player, 100)
      elseif productId == REVIVE_ID then
        grantRevive(player)
      end

      -- Save to DataStore before confirming
      local saved = savePlayerData(player)
      if not saved then return Enum.ProductPurchaseDecision.NotProcessedYet end

      return Enum.ProductPurchaseDecision.PurchaseGranted
    end

────────────────────────────────────────────────────────────────────────────────
7.3 PREMIUM PAYOUTS
────────────────────────────────────────────────────────────────────────────────

Roblox pays developers Robux based on how much time Premium subscribers
spend in their game. This is passive income — no purchase required.

OPTIMIZE FOR ENGAGEMENT:
  Players who stay longer in your game earn you more Premium payouts.
  Add: daily login rewards (reason to come back), long progression (reason to stay),
  social features (reason to stay with friends), regular content updates (reason to return).

PREMIUM-EXCLUSIVE BENEFITS:
  Check: player.MembershipType == Enum.MembershipType.Premium
  Offer: +50% coins, exclusive cosmetic, premium-only area, daily gem bonus.
  This incentivizes Premium subscription, which benefits both you and the player.

────────────────────────────────────────────────────────────────────────────────
7.4 PRICING PSYCHOLOGY
────────────────────────────────────────────────────────────────────────────────

ROBUX VALUE PERCEPTION:
  80 Robux ≈ $1 USD. But players dont think in dollars — they think in Robux.
  49 Robux feels "cheap" (impulse buy). 199 feels "moderate." 999 feels "expensive."
  Sweet spots: 49, 99, 149, 199, 349, 499, 999.

ANCHORING:
  Show the "premium" option first. A 999 Robux package makes 199 look cheap.
  Display all packages on one screen so players compare values.

VALUE BUNDLING:
  "100 Coins = 49R" vs "600 Coins = 199R" — the 199R pack gives 22% more per Robux.
  Players feel smart choosing the "better deal."

────────────────────────────────────────────────────────────────────────────────
7.5 WHAT TO MONETIZE (AND WHAT NOT TO)
────────────────────────────────────────────────────────────────────────────────

SAFE TO MONETIZE:
  Cosmetics (skins, pets, trails, effects) — YES, always safe.
  Convenience (faster earning, more storage, auto-collect) — YES, speeds up grind.
  Skip-grind (instant level, skip stage) — YES, time-saving for busy players.
  Power boosts (stronger weapons, more health) — YES IF balanced (PvE only,
    or with matchmaking that groups spenders together).
  Content access (extra maps, game modes, story chapters) — YES, DLC model.

  NEVER MONETIZE:
  Core gameplay (dont lock basic mechanics behind a paywall).
  Competitive advantage in PvP (pay-to-win destroys communities).
  Required progression (dont make it impossible to progress without paying).
  Safety/social features (dont charge for blocking, reporting, basic chat).

WHERE TO PROMPT PURCHASES (without being annoying):
  After death: "Revive for 25 Robux?" — player is already stopped, natural pause.
  At progression wall: "Unlock next area for 199 Robux or earn 10,000 coins."
  In shop UI: player opened it voluntarily — show everything.
  On first join: show a "starter pack" offer (50% off first purchase).
  Achievement unlock: "Celebrate with a victory skin? 99 Robux."
  NEVER: mid-combat popup, forced ad before gameplay, popup every 30 seconds.

────────────────────────────────────────────────────────────────────────────────
7.6 MARKETPLACESERVICE API REFERENCE
────────────────────────────────────────────────────────────────────────────────

KEY METHODS:
  :PromptGamePassPurchase(player, gamePassId) — shows buy dialog for GamePass.
  :PromptProductPurchase(player, productId) — shows buy dialog for DevProduct.
  :PromptPremiumPurchase(player) — shows Roblox Premium subscription dialog.
  :UserOwnsGamePassAsync(userId, gamePassId) — returns bool (pcall this!).
  :GetProductInfo(assetId, infoType) — returns product name, price, description.
  .ProcessReceipt — callback for DevProduct purchase processing.
  .PromptGamePassPurchaseFinished — event fires after GamePass purchase dialog closes.
  .PromptProductPurchaseFinished — event fires after DevProduct purchase dialog closes.

TESTING:
  In Studio, you can test purchase prompts but they wont charge real Robux.
  Published game: test with a test account. Real purchases in production only.
  Use the Developer Console (F9 in game) to verify ProcessReceipt fired correctly.

────────────────────────────────────────────────────────────────────────────────
7.7 ENGAGEMENT LOOPS THAT DRIVE REVENUE
────────────────────────────────────────────────────────────────────────────────

The best monetization comes from engaged players, not aggressive prompts:

DAILY REWARDS: escalating value over 7 days. Day 7 = big prize. Miss a day = reset.
  Players come back daily. Some will buy "catch up" passes if they miss a day.

BATTLE PASS / SEASON PASS: tiered rewards over 30-60 days.
  Free track: basic rewards for everyone.
  Premium track: exclusive cosmetics, extra currency, special items. 199-499 Robux.
  Players who buy feel obligated to play to "get their moneys worth."

LIMITED-TIME EVENTS: exclusive items only available during event windows.
  Creates urgency and FOMO. "This skin is only available for 3 more days."
  Players are more likely to spend when they cant wait.

TRADING SYSTEM: let players trade items.
  Rare items become more valuable. Players spend more to get tradeable exclusives.
  Requires careful exploit prevention (duplicate detection, trade logging).

PET/COLLECTION SYSTEM: collectible creatures with rarity tiers.
  Players will spend to complete their collection. Randomized eggs/crates
  are the most effective (but must comply with Roblox guidelines on loot boxes).
  Always show drop rates. Never make required items extremely rare.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 8: TWEENSERVICE MASTERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TweenService is the animation engine for non-character motion. Every
professional game uses it extensively.

────────────────────────────────────────────────────────────────────────────────
8.1 TWEENINFO PARAMETERS
────────────────────────────────────────────────────────────────────────────────

TweenInfo.new(time, easingStyle, easingDirection, repeatCount, reverses, delayTime)

  time: duration in seconds. 0.1-0.3 for UI snaps. 0.5-1 for smooth motion. 2-5 for cinematic.
  easingStyle: the curve shape.
    Linear: constant speed. Robotic. Use for progress bars, countdowns.
    Quad: gentle acceleration. Natural for most motion.
    Cubic: stronger acceleration. Good for entrances/exits.
    Quart/Quint: very strong acceleration. Dramatic swoops, UI slides.
    Sine: smooth S-curve. Natural for breathing, pulsing, hovering.
    Back: overshoots target slightly then settles. Bouncy UI elements.
    Bounce: bounces at the target. Ball drops, notification pops.
    Elastic: spring oscillation. Exaggerated cartoon feel.
    Exponential: very sharp. Almost instant start or stop.
    Circular: quarter-circle curve. Smooth natural feel.
  easingDirection:
    In: starts slow, ends fast. Good for elements entering view.
    Out: starts fast, ends slow. Good for elements settling into place. Most common.
    InOut: slow-fast-slow. Good for continuous back-and-forth motion.
  repeatCount: -1 for infinite, 0 for once, N for N repeats.
  reverses: if true, plays backward after forward (ping-pong).
  delayTime: seconds to wait before starting.

────────────────────────────────────────────────────────────────────────────────
8.2 COMMON TWEEN PATTERNS
────────────────────────────────────────────────────────────────────────────────

DOOR OPENING:
  -- Rotate door 90 degrees around hinge edge
  local doorCF = door.CFrame
  local hingeCF = doorCF * CFrame.new(-door.Size.X/2, 0, 0)  -- hinge point
  local openCF = hingeCF * CFrame.Angles(0, math.rad(-90), 0) * CFrame.new(door.Size.X/2, 0, 0)
  TweenService:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {CFrame = openCF}):Play()

HOVERING PLATFORM:
  -- Smooth up-down hover, infinite loop
  local baseY = platform.Position.Y
  local tween = TweenService:Create(platform,
    TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Position = platform.Position + Vector3.new(0, 3, 0)}
  )
  tween:Play()

PULSING GLOW:
  -- Neon part pulses brightness via transparency
  TweenService:Create(neonPart,
    TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Transparency = 0.5}
  ):Play()
  -- Pair with PointLight brightness tween for visible glow pulse
  TweenService:Create(pointLight,
    TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Brightness = 0.5}
  ):Play()

UI SLIDE-IN:
  frame.Position = UDim2.new(1.5, 0, 0.5, 0)  -- off-screen right
  frame.Visible = true
  TweenService:Create(frame,
    TweenInfo.new(0.35, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
    {Position = UDim2.new(0.5, 0, 0.5, 0)}
  ):Play()

DAMAGE FLASH:
  -- Red flash on the screen (ColorCorrection)
  local cc = Instance.new("ColorCorrectionEffect")
  cc.TintColor = Color3.fromRGB(255, 100, 100)
  cc.Parent = game:GetService("Lighting")
  TweenService:Create(cc,
    TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    {TintColor = Color3.fromRGB(255, 255, 255)}
  ):Play()
  task.delay(0.4, function() cc:Destroy() end)

SCALE BOUNCE (button press):
  local originalSize = button.Size
  -- Shrink
  local shrinkTween = TweenService:Create(button,
    TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    {Size = UDim2.new(originalSize.X.Scale * 0.92, 0, originalSize.Y.Scale * 0.92, 0)}
  )
  -- Grow back with slight overshoot
  local growTween = TweenService:Create(button,
    TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    {Size = originalSize}
  )
  shrinkTween:Play()
  shrinkTween.Completed:Connect(function() growTween:Play() end)

CONVEYOR BELT TEXTURE SCROLL:
  -- Animate a Texture offset to simulate belt movement
  local texture = belt:FindFirstChildOfClass("Texture")
  RunService.Heartbeat:Connect(function(dt)
    texture.OffsetStudsV = texture.OffsetStudsV + beltSpeed * dt
  end)

COLOR TRANSITION (day/night):
  TweenService:Create(game:GetService("Lighting"),
    TweenInfo.new(5, Enum.EasingStyle.Linear),
    {ClockTime = 0, Ambient = Color3.fromRGB(10, 10, 30)}
  ):Play()

────────────────────────────────────────────────────────────────────────────────
8.3 TWEEN CHAINING
────────────────────────────────────────────────────────────────────────────────

Sequential tweens using the Completed event:
  local tween1 = TweenService:Create(part, info1, {Position = pos1})
  local tween2 = TweenService:Create(part, info2, {Position = pos2})
  local tween3 = TweenService:Create(part, info3, {Position = pos3})
  tween1:Play()
  tween1.Completed:Connect(function() tween2:Play() end)
  tween2.Completed:Connect(function() tween3:Play() end)

Use for: elevator sequences (move up → open doors → wait → close doors → move down),
  cutscene camera paths, multi-stage animations, complex UI transitions.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 9: PATHFINDING AND NPC INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NPCs that stand still or walk into walls ruin immersion. Professional pathfinding
makes NPCs feel alive and intelligent.

────────────────────────────────────────────────────────────────────────────────
9.1 PATHFINDINGSERVICE BASICS
────────────────────────────────────────────────────────────────────────────────

  local PathfindingService = game:GetService("PathfindingService")
  local path = PathfindingService:CreatePath({
    AgentRadius = 2,         -- NPC width / 2
    AgentHeight = 5,         -- NPC height
    AgentCanJump = true,     -- can the NPC jump?
    AgentCanClimb = false,   -- can it climb ladders/TrussParts?
    WaypointSpacing = 4,     -- distance between waypoints (lower = smoother path)
    Costs = {
      Water = 20,            -- avoid water (high cost)
      Mud = 5,               -- dislike mud
    }
  })

  path:ComputeAsync(startPosition, endPosition)
  if path.Status == Enum.PathStatus.Success then
    local waypoints = path:GetWaypoints()
    for _, waypoint in waypoints do
      humanoid:MoveTo(waypoint.Position)
      if waypoint.Action == Enum.PathWaypointAction.Jump then
        humanoid.Jump = true
      end
      humanoid.MoveToFinished:Wait()
    end
  end

────────────────────────────────────────────────────────────────────────────────
9.2 ADVANCED PATHFINDING PATTERNS
────────────────────────────────────────────────────────────────────────────────

PATH BLOCKED HANDLING:
  Paths can become blocked (door closes, player builds a wall). Listen for:
    path.Blocked:Connect(function(blockedWaypointIndex)
      -- Recompute path from current position
      path:ComputeAsync(npc.PrimaryPart.Position, targetPosition)
    end)

PATROL ROUTES:
  Store waypoint positions in a table. Loop through them:
    local patrolPoints = {Vector3.new(0,0,0), Vector3.new(50,0,0), Vector3.new(50,0,50), Vector3.new(0,0,50)}
    local currentPoint = 1
    while true do
      moveTo(patrolPoints[currentPoint])
      task.wait(2 + math.random() * 3)  -- pause 2-5 seconds
      currentPoint = currentPoint % #patrolPoints + 1
    end

CHASE BEHAVIOR:
  Recompute path to target every 0.5-1 seconds (not every frame — too expensive):
    while chasing do
      local targetPos = target.PrimaryPart.Position
      path:ComputeAsync(npc.PrimaryPart.Position, targetPos)
      if path.Status == Enum.PathStatus.Success then
        local waypoints = path:GetWaypoints()
        for i = 2, math.min(5, #waypoints) do  -- follow only next 5 waypoints then recompute
          humanoid:MoveTo(waypoints[i].Position)
          local reached = humanoid.MoveToFinished:Wait()
          if not reached then break end
          -- Check if target moved significantly
          if (target.PrimaryPart.Position - targetPos).Magnitude > 10 then break end
        end
      end
      task.wait(0.3)
    end

FLEE BEHAVIOR:
  Move AWAY from threat by computing a position in the opposite direction:
    local fleeDirection = (npc.PrimaryPart.Position - threat.Position).Unit
    local fleeTarget = npc.PrimaryPart.Position + fleeDirection * 50
    path:ComputeAsync(npc.PrimaryPart.Position, fleeTarget)

AGGRO SYSTEM:
  NPCs should not all target the same player. Track threat per player:
    local threatTable = {}  -- {[player] = threatValue}
    -- Increase threat when player: attacks NPC (+10), is closest (+5/sec), has aggro ability (+20)
    -- Decrease threat: player dies (reset), player runs far away (-3/sec)
    -- NPC targets highest-threat player

SMART GROUPING:
  When multiple NPCs chase the same target, they should spread out:
    Each NPC aims for a point offset from the target (circle formation).
    NPC 1 aims at target + (3, 0, 0), NPC 2 at target + (-3, 0, 0), etc.
    This prevents NPC stacking and looks like tactical flanking.

────────────────────────────────────────────────────────────────────────────────
9.3 NPC ANIMATIONS
────────────────────────────────────────────────────────────────────────────────

HUMANOID-BASED NPC ANIMATION:
  NPCs with a Humanoid automatically play walk/idle animations if using
  the default Roblox animation scripts. For custom animations:

    local animator = humanoid:FindFirstChildOfClass("Animator")
    if not animator then
      animator = Instance.new("Animator")
      animator.Parent = humanoid
    end

    local idleAnim = Instance.new("Animation")
    idleAnim.AnimationId = "rbxassetid://IDLE_ANIM_ID"
    local idleTrack = animator:LoadAnimation(idleAnim)
    idleTrack.Looped = true
    idleTrack:Play()

  Transition between animations:
    -- Crossfade: stop current with fade, play new with fade
    currentTrack:Stop(0.3)  -- 0.3 second fade out
    newTrack:Play(0.3)      -- 0.3 second fade in

  Animation priority (higher overrides lower):
    Idle (Core) < Walk (Movement) < Attack (Action) < Death (Action4)
    Set via animTrack.Priority = Enum.AnimationPriority.Action

  Speed control: animTrack:AdjustSpeed(1.5) for 1.5x speed.
    Use for: slow-motion death, sprint cycle speeding up with WalkSpeed.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 10: ATTRIBUTE SYSTEM AND INSTANCE TAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attributes and CollectionService tags are the professional way to attach
data and behavior to Instances without creating ValueObjects.

────────────────────────────────────────────────────────────────────────────────
10.1 ATTRIBUTES — Per-Instance Data
────────────────────────────────────────────────────────────────────────────────

  Instance:SetAttribute("Health", 100)
  Instance:SetAttribute("Team", "Red")
  Instance:SetAttribute("Damage", 25.5)
  Instance:SetAttribute("IsShop", true)

  local health = Instance:GetAttribute("Health")  -- returns 100
  local all = Instance:GetAttributes()  -- returns dictionary of all attributes

  Instance.AttributeChanged:Connect(function(attributeName)
    if attributeName == "Health" then
      updateHealthBar(Instance:GetAttribute("Health"))
    end
  end)

  Instance:GetAttributeChangedSignal("Health"):Connect(function()
    -- fires only when "Health" specifically changes
  end)

SUPPORTED TYPES:
  string, boolean, number, UDim, UDim2, BrickColor, Color3, Vector2, Vector3,
  NumberSequence, ColorSequence, NumberRange, Rect, Font, CFrame.

USE CASES:
  NPC data: Health, MaxHealth, Damage, Level, Team, LootTable name.
  Prop data: Value (coin worth), InteractionType, CooldownTime.
  Zone data: ZoneName, MusicTrack, DifficultyLevel, SpawnRate.
  Building data: Owner, BuildDate, Style, Floors.
  Item data: Rarity, Damage, Defense, Speed, Description.

ADVANTAGES OVER VALUEOBJECTS:
  No Instance creation overhead (faster, less memory).
  Visible in Studio Properties panel (easy to edit).
  Replicate automatically (server attribute changes reach clients).
  Type-safe (stored with their Luau type).

────────────────────────────────────────────────────────────────────────────────
10.2 COMBINING TAGS AND ATTRIBUTES
────────────────────────────────────────────────────────────────────────────────

The professional pattern: Tag defines WHAT something is, Attributes define HOW.

  Example — Loot drops:
    CollectionService tag: "LootDrop"
    Attributes: Rarity = "Epic", Value = 500, ItemId = "sword_03"

    for _, drop in CollectionService:GetTagged("LootDrop") do
      local rarity = drop:GetAttribute("Rarity")
      local glowColor = rarityColors[rarity]
      addGlowEffect(drop, glowColor)
      setupPickup(drop, drop:GetAttribute("Value"))
    end

  Example — Interactive doors:
    Tag: "Door"
    Attributes: IsLocked = false, KeyId = "", OpenAngle = 90, AutoCloseDelay = 5

    for _, door in CollectionService:GetTagged("Door") do
      local prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = door:GetAttribute("IsLocked") and "Unlock" or "Open"
      prompt.Parent = door
      prompt.Triggered:Connect(function(player)
        if door:GetAttribute("IsLocked") then
          if playerHasKey(player, door:GetAttribute("KeyId")) then
            door:SetAttribute("IsLocked", false)
            openDoor(door)
          end
        else
          toggleDoor(door)
        end
      end)
    end

  Example — Damage zones:
    Tag: "DamageZone"
    Attributes: DamagePerSecond = 10, DamageType = "Fire", WarningMessage = "Hot!"

    Works with any Part shape — the tag + attributes drive behavior universally.
    Drop a Part, tag it "DamageZone", set the attributes, done. No unique scripts.

  This pattern scales to hundreds of objects. Add a new behavior by:
    1. Define a new tag name.
    2. Define the relevant attributes.
    3. Write ONE handler script that loops over tagged instances.
    4. Apply tags and attributes to any Instance in Studio or via code.
  No per-object scripts. No messy parent-child coupling. Clean, data-driven design.
  This is how front-page Roblox games manage thousands of interactive objects
  without thousands of individual scripts — one system per tag handles everything.

`

// ── Trimmed section getters for injection into specific task types ────────────

/**
 * Returns a trimmed subset of advanced knowledge relevant to building tasks
 * (terrain, building, prop). Focuses on mesh, CFrame, terrain, and lighting.
 */
export function getAdvancedBuildingKnowledge(): string {
  // Sections 1.1-1.7 (everything in Section 1)
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 1: ADVANCED BUILDING')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 2: ADVANCED SCRIPTING')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 6000)
}

/**
 * Returns a trimmed subset relevant to scripting tasks (script, economy, npc).
 * Focuses on architecture, client-server, DataStore, state machines, events.
 */
export function getAdvancedScriptingKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 2: ADVANCED SCRIPTING')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 3: EXPLOIT PREVENTION')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 5000)
}

/**
 * Returns exploit prevention knowledge for security-sensitive tasks.
 */
export function getExploitPreventionKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 3: EXPLOIT PREVENTION')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 4: PERFORMANCE')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 4000)
}

/**
 * Returns performance optimization knowledge.
 */
export function getPerformanceKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 4: PERFORMANCE')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 5: PROFESSIONAL VISUAL')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 4000)
}

/**
 * Returns visual effects knowledge for particle/effect-heavy tasks.
 */
export function getVisualEffectsKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 5: PROFESSIONAL VISUAL')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 6: SOUND DESIGN')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 4000)
}

/**
 * Returns sound design knowledge for audio tasks.
 */
export function getSoundDesignKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 6: SOUND DESIGN')
  const end_ = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 7: MONETIZATION')
  if (start === -1 || end_ === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start, end_).slice(0, 3000)
}

/**
 * Returns monetization knowledge for economy/shop tasks.
 */
export function getMonetizationKnowledge(): string {
  const start = ADVANCED_ROBLOX_KNOWLEDGE.indexOf('SECTION 7: MONETIZATION')
  if (start === -1) return ''
  return ADVANCED_ROBLOX_KNOWLEDGE.slice(start).slice(0, 3000)
}
