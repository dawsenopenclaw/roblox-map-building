---
name: Comprehensive Roblox Mesh, Model & 3D Asset Research 2026
description: EXHAUSTIVE guide to all Roblox Part types, MeshParts, native models, file formats, marketplace assets, 3D file specs, texture mapping, and 100+ common game asset categories with specifications.
type: reference
---

# EXHAUSTIVE ROBLOX MESH, MODEL & 3D ASSET GUIDE 2026

**Scope:** Complete technical reference for all Roblox Studio 3D assets, from native Parts to custom meshes to marketplace tools.

**Target:** Asset generation system, AI prompting, studio automation, batch uploads.

---

## PART 1: ROBLOX NATIVE PARTS & MESHES

### 1.1 All Native Part Types (Enum.Part.Shape)

Roblox provides 6 fundamental part shapes as primitives. Each can be created via `Instance.new("Part")` with `Shape` property.

| Part Type | Enum Value | Dimensions | Use Case | Default Size | Collision |
|---|---|---|---|---|---|
| **Block** | `Enum.PartType.Block` | Rectangular cuboid | Walls, floors, basic structures | 2×2×2 | Box |
| **Ball** | `Enum.PartType.Ball` | Perfect sphere | Decorative, physics balls, heads | 2 radius | Sphere |
| **Cylinder** | `Enum.PartType.Cylinder` | Vertical cylinder (Y-axis) | Pillars, poles, wheels, logs | 2 radius × 2 height | Cylinder |
| **Wedge** | `Enum.PartType.Wedge` | Triangular prism (45°) | Roofs, ramps, diagonal supports | 2×2×2 | Triangle |
| **CornerWedge** | `Enum.PartType.CornerWedge` | 1/4 sphere corner | Corner details, architectural trim | 2×2×2 | Corner |
| **TrussPart** | `Enum.PartType.Truss` | Lattice frame (hollow interior) | Industrial structures, scaffolding | 2×2×2 (hollow) | Lattice |

#### Creating Native Parts

```lua
-- Block (wall)
local wall = Instance.new("Part")
wall.Name = "Wall"
wall.Shape = Enum.PartType.Block
wall.Size = Vector3.new(10, 8, 0.5)
wall.Material = Enum.Material.Brick
wall.Color = Color3.fromRGB(180, 100, 80)
wall.CanCollide = true
wall.Anchored = true
wall.CFrame = CFrame.new(0, 4, 0)
wall.Parent = workspace

-- Cylinder (pillar)
local pillar = Instance.new("Part")
pillar.Shape = Enum.PartType.Cylinder
pillar.Size = Vector3.new(1, 8, 1) -- radius=0.5, height=8
pillar.CFrame = CFrame.new(0, 4, 0) * CFrame.Angles(0, 0, math.rad(90)) -- Rotate to Y-axis
pillar.Parent = workspace

-- Wedge (roof)
local roof = Instance.new("Part")
roof.Shape = Enum.PartType.Wedge
roof.Size = Vector3.new(10, 4, 8)
roof.CFrame = CFrame.new(0, 8, 0)
roof.Parent = workspace

-- TrussPart (scaffolding)
local truss = Instance.new("Part")
truss.Shape = Enum.PartType.Truss
truss.Size = Vector3.new(4, 4, 4)
truss.Transparency = 0.1 -- See-through structure
truss.Parent = workspace
```

#### Native Part Limits

| Metric | Limit | Notes |
|---|---|---|
| Max part size | No hard limit* | Recommended: <100 studs (memory) |
| Min part size | 0.1 stud | Can be tiny (sub-0.1 with scaling) |
| Triangles per shape | 48-96 triangles | Sphere=48, Cylinder=24, Block=12 |
| Collision fidelity | 5 levels | Box, ConvexHull, etc. |

*Extremely large parts (>1000 studs) may cause memory issues and visual glitches.

#### Native Part Collision Modes

```lua
part.CollisionGroup = "default"
part.CustomPhysicalProperties = PhysicalProperties.new(
  density = 0.7,
  elasticity = 0.5,
  elasticityWeight = 1,
  friction = 0.3,
  frictionWeight = 1
)
```

---

### 1.2 MeshPart — Custom 3D Meshes

**MeshPart** is Roblox's primary vehicle for importing custom 3D models. Unlike native parts, MeshParts reference external mesh files.

#### MeshPart Properties

| Property | Type | Description | Example |
|---|---|---|---|
| **MeshId** | String | Asset ID of the mesh file | `"rbxassetid://12345678"` |
| **TextureID** | String | Asset ID of texture map | `"rbxassetid://87654321"` |
| **Size** | Vector3 | Bounding box dimensions | `Vector3.new(2, 3, 2)` |
| **Offset** | Vector3 | Mesh position within part (0-1 range) | `Vector3.new(0, 0, 0)` |
| **Scale** | Vector3 | Mesh scale multiplier | `Vector3.new(1, 1, 1)` |
| **Material** | Enum.Material | Surface material | `Enum.Material.Wood` |
| **Color** | Color3 | Tint applied to mesh | `Color3.fromRGB(200, 150, 100)` |
| **Transparency** | Number | Opacity (0=solid, 1=invisible) | `0.2` |
| **CollisionFidelity** | Enum | Collision shape precision | `Enum.CollisionFidelity.ConvexHull` |
| **RenderFidelity** | Enum | Visual detail level | `Enum.RenderFidelity.Automatic` |

#### Creating a MeshPart

```lua
-- Basic MeshPart
local meshPart = Instance.new("MeshPart")
meshPart.Name = "CustomChair"
meshPart.MeshId = "rbxassetid://12345678"      -- Your uploaded mesh
meshPart.TextureID = "rbxassetid://87654321"   -- Your uploaded texture
meshPart.Size = Vector3.new(2, 3, 2)
meshPart.Material = Enum.Material.Wood
meshPart.Color = Color3.fromRGB(139, 69, 19)   -- Brown tint
meshPart.CanCollide = true
meshPart.Anchored = true
meshPart.CFrame = CFrame.new(0, 2.5, 0)
meshPart.Parent = workspace

-- Advanced properties
meshPart.CollisionFidelity = Enum.CollisionFidelity.ConvexHull  -- Accurate collisions
meshPart.RenderFidelity = Enum.RenderFidelity.Precise  -- High-quality visuals
meshPart.Scale = Vector3.new(1.5, 1, 1)  -- Scale up by 50% on X-axis
```

#### MeshPart Collision Fidelity Levels

| Level | Speed | Accuracy | Use Case |
|---|---|---|---|
| **Box** | Fastest | Loose | Large structures, buildings |
| **ConvexHull** | Fast | Good | Complex shapes, chairs, props |
| **Default** | Medium | Good | Most meshes (auto-selected) |
| **Precise** | Slow | Excellent | Detailed weapons, characters |

---

### 1.3 SpecialMesh — Legacy Mesh System

**SpecialMesh** is the older mesh system (pre-MeshPart). Still supported but **deprecated**. Use MeshPart instead.

#### SpecialMesh Types

| Type | Enum Value | Use Case | Replacement |
|---|---|---|---|
| **Head** | `Enum.MeshType.Head` | Humanoid heads | MeshPart + humanoid rig |
| **Torso** | `Enum.MeshType.Torso` | Character bodies | MeshPart + humanoid rig |
| **Wedge** | `Enum.MeshType.Wedge` | Diagonal parts | Use native Wedge part |
| **Sphere** | `Enum.MeshType.Sphere` | Spherical mesh | Use native Ball part |
| **Cylinder** | `Enum.MeshType.Cylinder` | Cylindrical mesh | Use native Cylinder part |
| **FileMesh** | `Enum.MeshType.FileMesh` | Custom mesh file | **Use MeshPart** |
| **Brick** | `Enum.MeshType.Brick` | Textured block | Use native Block part |

#### SpecialMesh Example (Not Recommended)

```lua
local part = Instance.new("Part")
part.Name = "OldStyleMesh"
part.Shape = Enum.PartType.Block
part.Size = Vector3.new(2, 2, 2)

local specialMesh = Instance.new("SpecialMesh")
specialMesh.MeshType = Enum.MeshType.FileMesh
specialMesh.MeshId = "rbxassetid://12345678"
specialMesh.TextureId = "rbxassetid://87654321"
specialMesh.Scale = Vector3.new(1, 1, 1)
specialMesh.Parent = part

part.Parent = workspace
-- ⚠️ DEPRECATED — Use MeshPart instead
```

#### Why MeshPart > SpecialMesh

| Feature | MeshPart | SpecialMesh |
|---|---|---|
| Collision precision | ✓ High | ✗ Limited |
| Physics performance | ✓ Optimized | ✗ Slower |
| Material support | ✓ Full PBR | ✗ Basic |
| Ease of use | ✓ Native part | ✗ Requires container |
| Future support | ✓ Active | ✗ Deprecated |

**Recommendation:** Migrate all SpecialMesh instances to MeshPart.

---

### 1.4 Mesh Import Formats

#### Supported File Formats

| Format | Extension | Import Status | Best For | Limitations |
|---|---|---|---|---|
| **GLB (GLTF Binary)** | `.glb` | ✓ Excellent | Recommended primary format | None known |
| **FBX (Autodesk)** | `.fbx` | ✓ Good | Rigged characters, animations | Large file size |
| **OBJ (Wavefront)** | `.obj` | ✓ Limited | Simple static meshes | No materials/textures embedded |
| **DAE (COLLADA)** | `.dae` | ✓ Limited | Legacy assets, rigged models | Slower import |
| **USDZ** | `.usdz` | ✗ Not supported | ARKit models | Use converter |
| **STEP/IGES** | `.step, .iges` | ✗ Not supported | CAD models | Use converter to .obj/.fbx |

#### Format Comparison Table

| Aspect | GLB | FBX | OBJ | DAE |
|---|---|---|---|---|
| **File Size** | ~20% smaller | Larger | Medium | Medium |
| **Embedded Textures** | ✓ Yes | ✗ Referenced | ✗ Referenced | ✗ Referenced |
| **PBR Materials** | ✓ Full support | ✓ Good | ✗ Basic | ✗ Basic |
| **Animations** | ✓ Yes | ✓ Yes | ✗ No | ✓ Yes |
| **Rigging** | ✓ Yes | ✓ Yes | ✗ No | ✓ Yes |
| **Import Speed** | ✓ Fast | Medium | ✓ Fast | Slow |
| **Recommended** | ✓✓✓ | ✓✓ | ✓ | ✗ |

#### How to Import into Studio

**Method 1: Drag & Drop (Easiest)**
1. Save mesh as `.glb` or `.fbx`
2. Open Roblox Studio
3. Drag file into Workspace (Explorer panel)
4. Studio auto-creates MeshPart

**Method 2: Manual MeshPart Creation**
1. Create MeshPart in Studio
2. Upload mesh file to Roblox Creator Hub
3. Get Asset ID (e.g., `12345678`)
4. Set `MeshPart.MeshId = "rbxassetid://12345678"`

**Method 3: Via Asset API (Programmatic)**
```javascript
// Upload mesh via Node.js/Hono
const uploadMesh = async (filePath, accessToken) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('name', 'my-mesh');
  formData.append('description', 'Custom 3D asset');

  const response = await fetch(
    'https://apis.roblox.com/assets/v1/assets',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData
    }
  );

  return response.json(); // { assetId: 12345678, status: 'PENDING' }
};
```

---

### 1.5 Texture Mapping & UVs

#### UV Coordinate System

**UV mapping** is how 2D textures wrap onto 3D models.
- **U axis**: Left-right (0 = left, 1 = right)
- **V axis**: Bottom-top (0 = bottom, 1 = top)
- **UV range**: 0.0 to 1.0 (wraps)

#### Checking UV Layout in Blender

```blender
# Blender → UV Editing workspace
1. Open .fbx/.glb model
2. Select mesh
3. Tab into Edit Mode
4. U → Unwrap (if not already unwrapped)
5. View UV layout in UV Editor
# Look for:
# - No overlapping UVs (causes texture repetition)
# - Minimal distortion (checker pattern should be square)
# - Seams are hidden (interior surfaces)
```

#### Seamless Textures vs Tiling

**Seamless (Recommended for props)**
- Edges blend smoothly when tiled
- Single UV island per surface
- Cost: $0.22 per texture (Fal Flux)
- Works well for: Wood, metal, fabric, stone

**Unique (For characters/unique objects)**
- Per-part UV mapping
- High detail, no repetition
- Costs more to generate
- Works well for: Characters, weapons, detailed props

#### Texture Coordinate Properties in MeshPart

```lua
local meshPart = Instance.new("MeshPart")
meshPart.TextureID = "rbxassetid://12345678"

-- Optional: texture scaling/offset (if supported by material)
-- Note: Most Roblox materials don't support these directly
-- Instead, adjust in the texture itself or use SurfaceAppearance

-- For PBR materials (newer):
local appearance = Instance.new("SurfaceAppearance")
appearance.ColorMap = "rbxassetid://12345678"
appearance.NormalMap = "rbxassetid://87654321"
appearance.RoughnessMap = "rbxassetid://11111111"
appearance.MetallicMap = "rbxassetid://22222222"
appearance.Parent = meshPart
```

#### PBR Texture Layers (Physically Based Rendering)

Roblox supports 4-5 texture layers for realistic materials:

| Layer | Map | Purpose | Format | Example |
|---|---|---|---|---|
| **Color/Albedo** | ColorMap | Base color | RGB | Wood grain color |
| **Normal** | NormalMap | Surface bumps | RGB (Blue/Purple channels) | Wood grain detail |
| **Roughness** | RoughnessMap | Surface finish | Grayscale | Rough=white, shiny=black |
| **Metallic** | MetallicMap | Metal-ness | Grayscale | Metal=white, non-metal=black |
| **Ambient Occlusion** | AO (optional) | Crevice shadows | Grayscale | Rarely needed |

#### Applying PBR Textures

```lua
local meshPart = Instance.new("MeshPart")
meshPart.Parent = workspace

-- Create SurfaceAppearance for PBR
local appearance = Instance.new("SurfaceAppearance")
appearance.ColorMap = "rbxassetid://111111"  -- Albedo
appearance.NormalMap = "rbxassetid://222222"  -- Normal detail
appearance.RoughnessMap = "rbxassetid://333333"  -- Surface finish
appearance.MetallicMap = "rbxassetid://444444"  -- Metallic intensity
appearance.Parent = meshPart
```

---

### 1.6 Triangle Limits & File Size Constraints

#### Polygon Count Guidance

| Polygon Count | Frame Rate (Desktop) | Frame Rate (Mobile) | Use Case |
|---|---|---|---|
| <10K triangles | 120+ fps | 60 fps | Optimized props, UI elements |
| 10-30K | 60+ fps | 30-60 fps | Standard props, furniture |
| 30-50K | 30-60 fps | 15-30 fps | Detailed characters, complex structures |
| 50-100K | 15-30 fps | <15 fps | Hero assets, setpieces (use sparingly) |
| >100K | <15 fps | <5 fps | ✗ Not recommended; breaks mobile |

#### How to Check Polygon Count

**In Blender (before export)**
```blender
# Blender top-right corner shows vertex/edge/face count
# Face count = polygon count
# Example: "Face: 15420" = 15,420 polygons
```

**From GLB metadata (Node.js)**
```javascript
const fs = require('fs');
const { inspect } = require('@gltf-transform/cli');

// Install: npm install -g @gltf-transform/cli
// Command: gltf-transform inspect model.glb
// Output includes: vertex count, triangle count, mesh info
```

**In Roblox Studio (post-import)**
```lua
-- Select MeshPart in Explorer
-- Properties panel → Geometry section
-- Shows: Vertex count, triangle count
```

#### File Size Limits

| Metric | Limit | Notes |
|---|---|---|
| **Max file size (upload)** | 100 MB | Recommended: <50 MB |
| **Max uncompressed size** | ~500 MB (RAM) | Roblox loads entire mesh into memory |
| **Texture size per file** | 1024×1024 (typical) | Can upload up to 2048×2048 |
| **Total per game** | No limit | Recommend: <1 GB total assets |

#### Optimization Techniques

**Technique 1: Decimate (reduce polygons)**
```bash
# Using gltf-transform
npm install -g @gltf-transform/cli
gltf-transform simplify model.glb model-simplified.glb --target=5000
# Creates new model with ~5000 triangles
```

**Technique 2: LOD (Level of Detail)**
- Create 3 versions: high (50K), medium (20K), low (5K)
- Load based on distance from player
- Reduces memory footprint

**Technique 3: Texture compression**
- Use PNG (lossless) or JPEG (lossy)
- Max resolution: 2048×2048
- Recommended: 512-1024 for mobile

---

## PART 2: ROBLOX MODEL TYPES

### 2.1 Models (Grouped Parts)

A **Model** is a Folder containing multiple Parts organized hierarchically.

#### Creating a Model

```lua
-- Create a simple model (chair)
local chairModel = Instance.new("Model")
chairModel.Name = "Wooden Chair"
chairModel.PrimaryPart = chairModel  -- Optional: set reference point
chairModel.Parent = workspace

-- Create seat
local seat = Instance.new("Part")
seat.Name = "Seat"
seat.Shape = Enum.PartType.Block
seat.Size = Vector3.new(2, 0.5, 2)
seat.Material = Enum.Material.Wood
seat.Color = Color3.fromRGB(139, 69, 19)
seat.CFrame = CFrame.new(0, 1, 0)
seat.CanCollide = true
seat.Parent = chairModel

-- Create 4 legs
for i = 1, 4 do
  local leg = Instance.new("Part")
  leg.Name = "Leg" .. i
  leg.Shape = Enum.PartType.Cylinder
  leg.Size = Vector3.new(0.3, 1.5, 0.3)
  leg.Material = Enum.Material.Wood
  leg.Parent = chairModel

  -- Position legs at corners
  local angle = (i - 1) * (math.pi / 2)
  local offset = Vector3.new(
    math.cos(angle) * 0.8,
    0,
    math.sin(angle) * 0.8
  )
  leg.CFrame = CFrame.new(offset + Vector3.new(0, 0.5, 0))
end

-- Model benefits:
-- - Group related parts together
-- - Move entire model with chairModel:MoveTo()
-- - Clone model: chairModel:Clone()
-- - Access parts: chairModel.Seat, chairModel.Leg1
```

#### Model Properties

| Property | Type | Purpose | Example |
|---|---|---|---|
| **Name** | String | Model identifier | `"Wooden Chair"` |
| **PrimaryPart** | BasePart | Reference point for movement | `chairModel.Seat` |
| **Anchored** | Boolean | Set on all children | Locks all parts in place |
| **Parent** | Instance | Where model lives | `workspace` or folder |

#### Moving a Model

```lua
-- Move entire model to position
local chairModel = workspace["Wooden Chair"]
chairModel:MoveTo(Vector3.new(10, 5, 20))

-- Rotate model around center
local newCFrame = chairModel.PrimaryPart.CFrame * CFrame.Angles(0, math.rad(45), 0)
chairModel:SetPrimaryPartCFrame(newCFrame)

-- Clone model
local chairClone = chairModel:Clone()
chairClone.Parent = workspace
```

---

### 2.2 Packages (Reusable Model Bundles)

**Packages** are versioned, reusable model templates. Available in Creator Store.

#### Using Marketplace Packages

```lua
-- Insert package from Creator Store via Toolbox
-- 1. Open Toolbox panel
-- 2. Search for asset (e.g., "Modern Chair")
-- 3. Click asset → Inserted into workspace as Model

-- Programmatically load package
local InsertService = game:GetService("InsertService")
local model = InsertService:LoadAsset(12345678)  -- Asset ID
model.Parent = workspace
```

#### Creating a Package (for sharing)

1. Build model in Studio
2. Right-click model → Save to Roblox
3. Creator Hub → Packages
4. Upload, set version, publish

---

### 2.3 Unions (CSG - Constructive Solid Geometry)

**Union** combines multiple parts into a single solid. Uses boolean operations.

#### Union Operations

| Operation | Result | Use Case |
|---|---|---|
| **Union** | Combine parts (add) | Merge shapes |
| **Negate** | Subtract parts (hollow) | Create holes, tunnels |
| **Separate** | Undo union | Revert to parts |

#### Creating Unions

```lua
-- Create two overlapping blocks
local block1 = Instance.new("Part")
block1.Shape = Enum.PartType.Block
block1.Size = Vector3.new(5, 1, 2)
block1.Material = Enum.Material.Brick
block1.CFrame = CFrame.new(0, 0, 0)
block1.Parent = workspace

local block2 = Instance.new("Part")
block2.Shape = Enum.PartType.Block
block2.Size = Vector3.new(2, 1, 5)
block2.Material = Enum.Material.Brick
block2.CFrame = CFrame.new(0, 0, 0)
block2.Parent = workspace

-- Perform union via Studio UI
-- 1. Ctrl+Click to select both parts
-- 2. Edit menu → Union (or Edit → CSG submenu)
-- 3. Creates UnionOperation instance

-- OR programmatically (via plugin/script):
local union = Instance.new("UnionOperation")
union.MeshData = createUnionMesh({block1, block2})
union.Parent = workspace

-- To negate (create hole):
local negateOp = Instance.new("NegateOperation")
negateOp.MeshData = createNegateMesh({blockToSubtract})
negateOp.Parent = workspace
```

#### Union Limitations

| Aspect | Limit | Notes |
|---|---|---|
| **Max parts per union** | 20-30 parts | More = slower |
| **Polygons generated** | 2-5x more than source | Less efficient than optimized mesh |
| **Physics complexity** | High | ConvexHull collision is expensive |
| **Performance impact** | Medium-High | Use sparingly |
| **Animation support** | ✗ None | Unions are static |

**Recommendation:** Use unions for architecture only. For props/complex shapes, use MeshParts instead.

---

### 2.4 Terrain (Voxel-Based)

**Terrain** is a procedural voxel-based landscape system. Different from parts.

#### Terrain Materials

| Material | Visual | Best For | Properties |
|---|---|---|---|
| **Grass** | Green textured | Ground, fields | Bright, natural |
| **Sand** | Tan/yellow | Beaches, deserts | Flat, particle effects |
| **Water** | Blue translucent | Lakes, oceans, rivers | Physics, drowning |
| **Stone** | Gray rocky | Mountains, caves, dungeons | Dark, rough |
| **Snow** | White crystalline | Mountains, arctic | Bright, cold feel |
| **Lava** | Red glowing | Volcanoes, hell zones | Hot, damage zones |
| **Mud** | Brown sludge | Swamps, construction | Dark, sticky feel |
| **Rock** | Gray/brown | Cliffs, structures | Solid, dense |
| **Asphalt** | Dark gray | Roads, parking | Urban, smooth |
| **Concrete** | Light gray | Buildings, paths | Industrial, hard |
| **Leafs** | Colorful particles | Forest canopy | Organic, nature |
| **Wood** | Brown planks | Interior, furniture | Warm, organic |

#### Creating Terrain

```lua
local terrain = workspace.Terrain

-- Specify region to fill
local region = Region3.new(Vector3.new(-50, 0, -50), Vector3.new(50, 100, 50))
region = region:ExpandToGrid(4)  -- Snap to voxels (4 studs)

-- Fill terrain
terrain:FillBall(
  Vector3.new(0, 10, 0),  -- Center position
  30,                      -- Radius
  Enum.Material.Grass      -- Material
)

-- Create hollow sphere (for caves)
terrain:FillBall(Vector3.new(0, 10, 0), 30, Enum.Material.Stone)
terrain:FillBall(Vector3.new(0, 10, 0), 25, Enum.Material.Air)  -- Hollow out

-- Place flat terrain
terrain:FillBlock(
  CFrame.new(0, 0, 0),                        -- Position
  Vector3.new(100, 5, 100),                   -- Size
  Enum.Material.Grass
)

-- Place water
terrain:FillBlock(
  CFrame.new(0, -5, 0),
  Vector3.new(200, 10, 200),
  Enum.Material.Water
)
```

#### Terrain Voxel Size

- **Voxel size:** 4 studs (fixed)
- **Minimum region:** 4×4×4 studs
- **Recommended grid:** ExpandToGrid(4)

```lua
local terrain = workspace.Terrain

-- Erode terrain (make rougher)
local region = Region3.new(Vector3.new(-50, 0, -50), Vector3.new(50, 100, 50))
region = region:ExpandToGrid(4)
terrain:ErodeRegion(region, 0.5)  -- Erosion amount 0-1

-- Smooth terrain (make flatter)
terrain:SmoothRegion(region, 0.5)

-- Clear specific voxels
terrain:FillBall(Vector3.new(0, 10, 0), 10, Enum.Material.Air)
```

#### Terrain Limits

| Aspect | Limit | Notes |
|---|---|---|
| **Total terrain cells** | ~16 million cells | Before performance drops |
| **Render distance** | ~250 studs | Beyond = culled |
| **Physics update rate** | ~10 Hz | Not real-time |

---

### 2.5 Character Models

Roblox supports multiple character rigging formats.

#### Character Rig Types

| Rig Type | Description | Proportions | Use Case | Animations |
|---|---|---|---|---|
| **R6** | 6 limb parts (deprecated) | Blocky, proportional | Legacy games | Basic |
| **R15** | 15 parts (modern) | Realistic, detailed | Modern games | Full body |
| **Rthro** | High-poly humanoid | Detailed, proportional | Premium games | Extensive |
| **Custom** | Any skeleton | Unlimited | Stylized, anime | Requires custom animations |

#### R15 Structure

```lua
-- R15 character anatomy
Character
├── Head
├── Torso
├── LeftUpperArm
├── LeftLowerArm
├── LeftHand
├── RightUpperArm
├── RightLowerArm
├── RightHand
├── LeftUpperLeg
├── LeftLowerLeg
├── LeftFoot
├── RightUpperLeg
├── RightLowerLeg
├── RightFoot
└── Humanoid (RootPart)
```

#### Creating Custom Character

```lua
-- Load custom character model
local InsertService = game:GetService("InsertService")
local customCharacter = InsertService:LoadAsset(12345678)
customCharacter.Name = "CustomPlayer"
customCharacter.Parent = workspace

-- Add humanoid (required for players)
local humanoid = Instance.new("Humanoid")
humanoid.MaxHealth = 100
humanoid.Health = 100
humanoid.Parent = customCharacter

-- Set as player character
local player = game.Players:GetPlayerByCharacter(workspace.CustomPlayer)
if player then
  player.Character = customCharacter
end
```

#### Humanoid Properties

```lua
local humanoid = character.Humanoid

humanoid.MaxHealth = 100
humanoid.Health = 100
humanoid.WalkSpeed = 16
humanoid.JumpPower = 50
humanoid.Parent = character
```

---

### 2.6 Accessories & Clothing Meshes

Accessories are wearable items attached to character parts.

#### Accessory Structure

```lua
-- Create accessory (e.g., hat)
local accessory = Instance.new("Accessory")
accessory.Name = "TopHat"
accessory.Parent = character

-- Create mesh part
local meshPart = Instance.new("MeshPart")
meshPart.Name = "Mesh"
meshPart.MeshId = "rbxassetid://12345678"  -- Hat mesh
meshPart.TextureID = "rbxassetid://87654321"
meshPart.Size = Vector3.new(2, 2, 2)
meshPart.Parent = accessory

-- Create attachment point (where it attaches to character)
local attachment = Instance.new("Attachment")
attachment.Name = "AccessoryPoint"
attachment.CFrame = CFrame.new(0, 0, 0.5)  -- Position on head
attachment.Parent = meshPart

-- Attach to character's head
local headAttach = character.Head:FindFirstChild("FaceFrontAttachment")
if headAttach then
  meshPart.AccessoryWeld = Instance.new("WeldConstraint")
  meshPart.AccessoryWeld.Part0 = character.Head
  meshPart.AccessoryWeld.Part1 = meshPart
  meshPart.AccessoryWeld.Parent = meshPart
end
```

#### Clothing (ShirtGraphic/Pants)

```lua
-- Add shirt and pants
local shirt = Instance.new("Shirt")
shirt.ShirtTemplate = "rbxassetid://12345678"  -- Texture for upper body
shirt.Parent = character

local pants = Instance.new("Pants")
pants.PantsTemplate = "rbxassetid://87654321"  -- Texture for lower body
pants.Parent = character
```

#### Clothing Texture Format

- **Resolution:** 1024×512 pixels
- **Format:** PNG with transparency
- **Layout:** Character UV map (front + back)
- **Tools:** Use CLO3D or download template from Roblox

---

### 2.7 Tool Models

**Tools** are held and swung by characters. Include weapons, pickaxes, fishing rods, etc.

#### Tool Structure

```lua
-- Create tool (sword)
local tool = Instance.new("Tool")
tool.Name = "Sword"
tool.RequiresHandle = true
tool.Parent = character.Backpack

-- Create handle (mesh)
local handle = Instance.new("MeshPart")
handle.Name = "Handle"
handle.MeshId = "rbxassetid://12345678"  -- Sword mesh
handle.TextureID = "rbxassetid://87654321"
handle.Size = Vector3.new(0.5, 3, 0.5)
handle.CanCollide = false
handle.Parent = tool

-- Create blade (visual, no collision)
local blade = Instance.new("MeshPart")
blade.Name = "Blade"
blade.MeshId = "rbxassetid://22222222"
blade.Size = Vector3.new(0.5, 4, 0.1)
blade.CanCollide = false
blade.Parent = tool

-- Weld blade to handle
local weld = Instance.new("WeldConstraint")
weld.Part0 = handle
weld.Part1 = blade
weld.Parent = blade

-- Add events
tool.Activated:Connect(function()
  print("Sword attacked!")
  -- Play animation, damage enemies, etc.
end)

tool.Deactivated:Connect(function()
  print("Sword released")
end)
```

#### Tool Properties

| Property | Type | Description |
|---|---|---|
| **Grip** | CFrame | Position when held |
| **GripForward** | Vector3 | Direction tool points |
| **GripPos** | Vector3 | Hand position |
| **ToolTip** | String | Hover text |
| **CanBeDropped** | Boolean | Can player drop tool? |

---

### 2.8 Vehicle Models

Vehicles use constraints (WeldConstraint, Motor6D) and physics to move.

#### Simple Vehicle (Car)

```lua
-- Car body
local carBody = Instance.new("Part")
carBody.Name = "Body"
carBody.Shape = Enum.PartType.Block
carBody.Size = Vector3.new(5, 3, 10)
carBody.Material = Enum.Material.SmoothPlastic
carBody.Color = Color3.fromRGB(255, 0, 0)
carBody.Parent = workspace

-- Wheels (4 cylinders)
local wheels = {}
local wheelPositions = {
  {-2, -1.5, 3}, {2, -1.5, 3},    -- Front
  {-2, -1.5, -3}, {2, -1.5, -3}   -- Back
}

for i, pos in ipairs(wheelPositions) do
  local wheel = Instance.new("Part")
  wheel.Name = "Wheel" .. i
  wheel.Shape = Enum.PartType.Cylinder
  wheel.Size = Vector3.new(2, 1, 1)
  wheel.Material = Enum.Material.Rubber
  wheel.Color = Color3.fromRGB(0, 0, 0)
  wheel.CFrame = CFrame.new(pos[1], pos[2], pos[3])

  -- Weld wheel to body
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = carBody
  weld.Part1 = wheel
  weld.Parent = wheel

  wheel.Parent = workspace
  table.insert(wheels, wheel)
end

-- Add VehicleSeat
local seat = Instance.new("VehicleSeat")
seat.Name = "Seat"
seat.Size = Vector3.new(2.5, 2, 2.5)
seat.CFrame = CFrame.new(0, 1, 0)

local weld = Instance.new("WeldConstraint")
weld.Part0 = carBody
weld.Part1 = seat
weld.Parent = seat

seat.Parent = workspace

-- Control vehicle
seat.Occupant:Connect(function()
  print(seat.Occupant.Name .. " entered vehicle")
end)
```

#### Vehicle Physics

```lua
-- Add BodyVelocity for movement
local bodyVelocity = Instance.new("BodyVelocity")
bodyVelocity.Velocity = Vector3.new(0, 0, 0)
bodyVelocity.MaxForce = Vector3.new(math.huge, 0, math.huge)
bodyVelocity.Parent = carBody

-- Add BodyGyro for rotation
local bodyGyro = Instance.new("BodyGyro")
bodyGyro.MaxTorque = Vector3.new(math.huge, math.huge, math.huge)
bodyGyro.P = 10000
bodyGyro.Parent = carBody
```

---

## PART 3: ROBLOX CREATOR MARKETPLACE ASSETS

### 3.1 Asset Search & Discovery

The Roblox Creator Marketplace (formerly Toolbox) contains 100,000+ free and paid assets.

#### Asset Categories

| Category | Type | Example | Typical Price |
|---|---|---|---|
| **Models** | 3D objects | Houses, trees, furniture | Free - $50 |
| **Meshes** | MeshParts | Chairs, weapons, details | Free - $25 |
| **Plugins** | Studio extensions | Terrain tools, builders | Free - $200 |
| **Audio** | Sounds, music | Background music, SFX | Free - $50 |
| **Images** | Textures, sprites | Decals, images | Free - $20 |
| **Animations** | Character animations | Walking, dancing, emotes | Free - $100 |
| **Packages** | Versioned models | Full houses, games | Free - $500 |
| **Decals** | Textures for parts | Graffiti, signs | Free - $10 |
| **Video** | Cutscenes | Trailers, ads | Free - $100 |

#### Searching in Creator Store

**Via Studio (Easiest)**
1. Open Toolbox (View → Toolbox or Ctrl+Shift+T)
2. Search for asset (e.g., "wooden chair")
3. Filter by category, sort by rating
4. Click to insert into workspace

**Programmatically**
```lua
local InsertService = game:GetService("InsertService")

-- Load asset by ID
local model = InsertService:LoadAsset(12345678)  -- Asset ID from Creator Hub
model.Parent = workspace

-- Note: Limited to loading by ID; no search API
```

#### Asset IDs

Every asset has a unique numeric ID.
- **Format:** `rbxassetid://[NUMBER]`
- **Example:** `rbxassetid://12345678`
- **Where to find:** Creator Hub dashboard, asset page URL

#### Marketplace Structure

```
Creator Hub (create.roblox.com)
├── Dashboard
│   ├── My Assets
│   │   ├── Models
│   │   ├── Audio
│   │   ├── Images
│   │   └── Plugins
│   ├── Creator Store
│   │   ├── Browse by category
│   │   ├── Best sellers
│   │   ├── Newest
│   │   └── Search
│   └── Creations (games, experiences)
└── Asset Details Page
    ├── Description
    ├── Reviews
    ├── Price
    ├── Asset ID
    └── Install/Insert button
```

---

### 3.2 InsertService:LoadAsset()

**InsertService** allows programmatic asset loading.

```lua
local InsertService = game:GetService("InsertService")

-- Load model by asset ID
local assetId = 12345678
local model = InsertService:LoadAsset(assetId)
model.Parent = workspace

-- Clone it multiple times
for i = 1, 5 do
  local clone = model:Clone()
  clone:MoveTo(Vector3.new(i * 5, 5, 0))
  clone.Parent = workspace
end

-- Error handling
pcall(function()
  local model = InsertService:LoadAsset(12345678)
  if model then
    model.Parent = workspace
  end
end, function(err)
  print("Failed to load asset: " .. err)
end)
```

#### LoadAsset Limitations

| Limit | Value | Notes |
|---|---|---|
| **Load rate** | ~5-10 per second | Don't spam |
| **Concurrent loads** | 5-10 max | Queue if more |
| **Asset types** | Models, audio, images | Not executable scripts |
| **Size limit** | ~100 MB | Large models may fail |

---

### 3.3 AssetService for Thumbnails

**AssetService** provides thumbnail URLs and metadata.

```lua
local AssetService = game:GetService("AssetService")

-- Get thumbnail URL
local assetId = 12345678
local thumbnail = AssetService:GetAssetThumbnail({
  Asset = "rbxassetid://" .. assetId,
  Size = Enum.ThumbnailSize.Size420x420,  -- 420×420 pixels
  Format = Enum.ThumbnailFormat.Png       -- PNG format
})

-- Use in GUI
local imageLabel = Instance.new("ImageLabel")
imageLabel.Image = thumbnail
imageLabel.Parent = game.Players.LocalPlayer.PlayerGui
```

#### Thumbnail Sizes

| Size | Pixels | Use Case |
|---|---|---|
| `Size24x24` | 24×24 | Icons, tiny previews |
| `Size48x48` | 48×48 | Small icons |
| `Size110x110` | 110×110 | Category tiles |
| `Size220x220` | 220×220 | Shop thumbnails |
| `Size420x420` | 420×420 | Large previews |

---

### 3.4 Toolbox vs Creator Store

| Feature | Toolbox | Creator Store |
|---|---|---|
| **Access** | In-Studio only | Web + Studio |
| **Asset types** | All | All |
| **Favorites** | ✓ Yes | ✓ Yes |
| **Collections** | ✗ No | ✓ Yes (free accounts limited) |
| **Reviews** | ✓ Yes | ✓ Yes |
| **Upload** | Via Toolbox | Via Creator Hub |
| **Pricing** | Visible | Detailed with sales |
| **API access** | Partial | ✗ No direct API |

**Recommendation:** Use Creator Store for discovery, Toolbox for insertion.

---

### 3.5 Licensing & Usage Rights

#### Asset Licenses

| License | Use | Modify | Resell |
|---|---|---|---|
| **Free** | ✓ Yes | ✓ Yes | ✗ No |
| **Paid (One-time)** | ✓ Yes | ✓ Yes | ✗ No |
| **Creator License** | Game only | ✓ Yes | ✗ No |
| **Exclusive** | Exclusive use | ✓ Yes | ✗ No |

#### Creator Hub License Agreement

When uploading/purchasing:
1. Read license terms
2. Respect creator rights
3. Don't claim as your own
4. Don't redistribute (unless free)

---

## PART 4: 3D FILE FORMATS FOR ROBLOX

### 4.1 FBX Format (Autodesk)

**FBX** is Autodesk's proprietary 3D format. Widely supported.

#### FBX Strengths

| Aspect | Status |
|---|---|
| **Roblox support** | ✓ Excellent |
| **File size** | Medium (typically 5-20 MB) |
| **Embedded textures** | ✗ Referenced externally |
| **Animations** | ✓ Full support |
| **Rigging** | ✓ Full support |
| **Materials** | ✓ Good (PBR + basic) |

#### FBX Export (Blender)

```blender
# Blender → File → Export As → .fbx

# Export settings:
✓ Animation: checked
✓ Deformed Mesh: checked
✓ Bake Animation: checked (if rigged)
✓ Mesh: checked
✓ Apply Modifiers: checked
✓ Scale: 1.00 (check Roblox coordinate system)
✓ Forward Axis: -Y Forward
✓ Up Axis: Z Up

# Result: filename.fbx (ready for Roblox)
```

#### FBX File Structure

```
filename.fbx
├── Geometry
│   ├── Vertices
│   ├── Faces (triangles)
│   ├── Normals
│   └── UVs
├── Materials
│   └── References to textures
├── Armature (if rigged)
│   ├── Bones/Joints
│   └── Skinning weights
└── Animations (if present)
    ├── Keyframes
    └── Timeline
```

---

### 4.2 OBJ Format (Wavefront)

**OBJ** is a simple ASCII format for static meshes.

#### OBJ Strengths

| Aspect | Status |
|---|---|
| **Roblox support** | ✓ Limited |
| **File size** | Large (text-based) |
| **Embedded textures** | ✗ No |
| **Animations** | ✗ No |
| **Rigging** | ✗ No |
| **Materials** | ✗ Limited (MTL file) |

#### OBJ Structure

```
# filename.obj
v 0.0 0.0 0.0          # Vertex 1
v 1.0 0.0 0.0          # Vertex 2
v 1.0 1.0 0.0          # Vertex 3
vt 0.0 0.0             # UV coordinate 1
vt 1.0 0.0             # UV coordinate 2
vn 0.0 0.0 1.0         # Normal 1
f 1/1/1 2/2/1 3/3/1    # Face (triangle): vertices/UVs/normals
```

#### OBJ Export (Blender)

```blender
# File → Export As → .obj
# Settings:
✓ Geometry: checked
✓ Normals: checked
✓ UVs: checked
✗ Materials: not included (separate .mtl file)
✓ Triangulate Faces: checked
```

#### When to Use OBJ

- Simple static props (no animation)
- Legacy compatibility
- Small file size important

---

### 4.3 GLB Format (GLTF Binary)

**GLB** is the modern standard. **RECOMMENDED for Roblox.**

#### GLB Strengths

| Aspect | Status |
|---|---|
| **Roblox support** | ✓✓✓ Excellent |
| **File size** | Small (binary, ~20% compression) |
| **Embedded textures** | ✓ Yes |
| **Animations** | ✓ Full support |
| **Rigging** | ✓ Full support |
| **Materials** | ✓ Full PBR support |

#### GLB Structure

```
filename.glb (binary)
├── JSON Header
│   ├── Scene metadata
│   └── Asset info
├── Geometry Buffers
│   ├── Vertex positions
│   ├── Normals
│   ├── UVs
│   └── Indices
├── Materials
│   ├── PBR properties
│   └── Texture references
├── Textures
│   ├── Color map
│   ├── Normal map
│   ├── Roughness
│   └── Metallic
├── Armature (optional)
│   ├── Joints
│   └── Skinning
└── Animations (optional)
    └── Keyframe data
```

#### GLB Export (Blender)

```blender
# File → Export As → .glb

# Export settings:
✓ Format: glTF Binary (.glb)
✓ Include: Mesh, Materials, Textures, Animation
✓ Triangulate Faces: checked
✓ Apply Modifiers: checked
✓ UV Maps: checked
✓ Normals: checked
✓ Include All Bone Influences: checked (if rigged)

# Result: filename.glb (ready for Roblox)
```

#### GLB Advantages over FBX

| Aspect | GLB | FBX |
|---|---|---|
| **File size** | ~20% smaller | Larger |
| **Embedded textures** | ✓ Yes | ✗ No |
| **Export time** | Faster | Slower |
| **Compatibility** | Modern standard | Legacy |
| **PBR support** | Full | Limited |

**Recommendation:** Use GLB as primary format.

---

### 4.4 DAE Format (COLLADA)

**DAE** is XML-based, slower but compatible.

#### DAE Use Cases

- Legacy .dae assets
- Complex rigged models
- Software interoperability

#### DAE Limitations

| Aspect | Issue |
|---|---|
| **File size** | XML = large |
| **Import speed** | Slow |
| **Material support** | Limited |
| **Animation** | Supported but sometimes broken |

**Recommendation:** Avoid for new projects; use GLB instead.

---

### 4.5 Texture Formats

#### Roblox-Supported Texture Formats

| Format | Compression | Size | Quality | Use |
|---|---|---|---|---|
| **PNG** | Lossless | Medium-Large | ✓ Perfect | Recommended |
| **JPEG** | Lossy | Small | Good | Photos, large textures |
| **TGA** | Lossless (uncompressed) | Very large | ✓ Perfect | Legacy |
| **BMP** | None | Very large | ✓ Perfect | Avoid (outdated) |

#### Texture Specifications

| Property | Recommended | Max |
|---|---|---|
| **Resolution** | 1024×1024 | 2048×2048 (upload), 1024×1024 (Studio import) |
| **File size** | <10 MB | ~50 MB |
| **Aspect ratio** | Power of 2 (1K, 2K) | Any, but may be compressed |
| **Color space** | sRGB | sRGB (not Linear RGB) |
| **Alpha channel** | PNG with alpha | Supported |

#### Texture Layers for PBR

```
filename_albedo.png        # Color map (RGB)
filename_normal.png        # Bump detail (RGB, blue/purple channels)
filename_roughness.png     # Surface finish (Grayscale)
filename_metallic.png      # Metal-ness (Grayscale)
filename_ao.png            # Ambient occlusion (Grayscale, optional)
```

---

### 4.6 PBR Material Support

**PBR (Physically Based Rendering)** is how modern Roblox materials work.

#### PBR Texture Channels

| Texture | Channel | Value | Meaning |
|---|---|---|---|
| **Albedo** | RGB | Any | Base color |
| **Normal** | RGB | Blue/purple | Surface bumps |
| **Roughness** | Grayscale | 0 (black) | Shiny/reflective |
| **Roughness** | Grayscale | 1 (white) | Rough/matte |
| **Metallic** | Grayscale | 0 (black) | Non-metal |
| **Metallic** | Grayscale | 1 (white) | Pure metal |

#### Applying PBR in Studio

```lua
local meshPart = workspace.ChairMesh

-- Create SurfaceAppearance for PBR materials
local appearance = Instance.new("SurfaceAppearance")
appearance.ColorMap = "rbxassetid://111111"      -- Albedo
appearance.NormalMap = "rbxassetid://222222"     -- Normal
appearance.RoughnessMap = "rbxassetid://333333"  -- Roughness
appearance.MetallicMap = "rbxassetid://444444"   -- Metallic
appearance.Parent = meshPart

-- Material blending
meshPart.Material = Enum.Material.SmoothPlastic  -- Base material
meshPart.Color = Color3.fromRGB(255, 255, 255)  -- Color tint
```

#### PBR Quality (Perception)

| Property | Value | Effect |
|---|---|---|
| **Roughness 0.0** | Polished mirror | Highly reflective |
| **Roughness 0.3** | Glossy plastic | Some reflection |
| **Roughness 0.7** | Matte surface | Mostly diffuse |
| **Roughness 1.0** | Chalk/matte | No reflection |
| **Metallic 0.0** | Fabric/wood | Absorbs light |
| **Metallic 1.0** | Steel/chrome | Reflects light |

---

## PART 5: COMMON GAME ASSET CATEGORIES (100+ Items)

This section lists every type of asset game developers need, organized by category.

### 5.1 BUILDINGS (20+ Items)

#### Residential

| Item | Typical Size | Parts Count | Poly Count | Notes |
|---|---|---|---|---|
| **Simple House** | 16×12×10 | 200-300 | 15K-25K | Single story, basic interior |
| **Mansion** | 30×20×25 | 800-1200 | 50K-80K | Multiple stories, detailed |
| **Cabin** | 12×10×8 | 100-150 | 8K-15K | Rustic, small |
| **Cottage** | 14×10×10 | 150-200 | 12K-20K | Charming, mid-size |
| **Apartment Building** | 20×30×20 | 600-900 | 40K-60K | Urban, stacked units |
| **Duplex** | 18×10×10 | 250-350 | 18K-30K | Two units |

#### Commercial

| Item | Typical Size | Parts Count | Use |
|---|---|---|---|
| **Shop/Store** | 15×12×10 | 300-400 | Storefront with interior |
| **Restaurant** | 20×15×10 | 400-600 | Dining area + kitchen |
| **Office Building** | 25×20×30 | 800-1200 | Multiple floors, cubicles |
| **Bank** | 20×15×15 | 600-800 | Vault, tellers, safe |
| **Library** | 18×12×12 | 400-600 | Shelves, seating |
| **Hospital** | 30×25×20 | 1000+ | Multiple wings, beds |
| **School** | 40×30×15 | 1200+ | Classrooms, gym |
| **Mall** | 50×40×20 | 2000+ | Food court, shops |

#### Landmarks

| Item | Typical Size | Use |
|---|---|---|
| **Castle** | 40×30×40 | Fantasy, medieval games |
| **Tower** | 10×10×50 | Tall structure, landmark |
| **Bridge** | 30×8×20 | Crossing terrain |
| **Gate/Arch** | 20×20×5 | Entrance, archway |
| **Fountain** | 10×10×8 | Decoration, gathering spot |
| **Gazebo** | 12×12×8 | Garden structure |

#### Structural Elements

| Item | Size | Notes |
|---|---|---|
| **Door Frame** | 4×7×0.2 | Standard door opening |
| **Window Frame** | 3×3×0.2 | Standard window |
| **Roof Slope** | 10×4×8 | Pitched roof section |
| **Wall Section** | 10×8×0.5 | Flat wall panel |
| **Staircase** | 4×2×10 | Multi-step stair |
| **Railing** | 10×1.2×1 | Safety barrier |

---

### 5.2 TERRAIN & NATURE (30+ Items)

#### Trees & Vegetation

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Oak Tree** | 4×10×4 | 8K-12K | Brown trunk, green foliage |
| **Pine Tree** | 3×12×3 | 6K-10K | Conical shape, needles |
| **Palm Tree** | 2×15×2 | 5K-8K | Tropical, thin trunk |
| **Willow Tree** | 5×12×5 | 10K-15K | Drooping branches |
| **Cherry Blossom** | 4×8×4 | 7K-11K | Pink flowers, delicate |
| **Cactus** | 1.5×4×1.5 | 3K-5K | Desert plant |
| **Mushroom** | 0.5×1×0.5 | 1K-2K | Decorative, colorful |
| **Flower** | 0.5×1×0.5 | 500-1K | Various colors, small |
| **Bush/Shrub** | 2×2×2 | 2K-4K | Dense foliage |
| **Corn Stalk** | 0.5×2×0.5 | 1K-2K | Agricultural |

#### Rocks & Boulders

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Large Boulder** | 6×4×6 | 5K-8K | Obstacle, landmark |
| **Medium Rock** | 3×2×3 | 2K-4K | Ground detail |
| **Small Rock** | 1×0.5×1 | 500-1K | Tiny detail |
| **Rocky Outcrop** | 10×5×8 | 8K-12K | Cliff face |
| **Stone Arch** | 8×8×2 | 4K-6K | Natural tunnel |

#### Terrain Features

| Item | Size | Poly Count | Notes |
|---|---|---|---|
| **Hill** | 20×5×20 | 4K-8K | Grassy mound |
| **Mountain Peak** | 30×15×30 | 15K-25K | High terrain |
| **Valley** | 40×10×40 | 10K-20K | Sunken area |
| **Cliff Face** | 20×20×5 | 8K-12K | Vertical drop |
| **Canyon** | 50×30×50 | 20K-30K | Deep gorge |
| **Cave Entrance** | 15×10×20 | 8K-12K | Rocky opening |
| **Waterfall** | 10×15×5 | 5K-8K | Cascading water |

#### Water & Liquid

| Item | Size | Poly Count | Notes |
|---|---|---|---|
| **Lake** | 40×2×40 | 2K-4K | Large water body |
| **River** | 50×2×3 | 1K-2K | Flowing water |
| **Pond** | 15×1×15 | 500-1K | Small pool |
| **Ocean Waves** | 100×3×100 | 10K-20K | Animated water |
| **Lava Pool** | 20×3×20 | 3K-5K | Glowing liquid |

---

### 5.3 VEHICLES (25+ Items)

#### Land Vehicles

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Car** | 5×2.5×10 | 15K-25K | 4-wheeled sedan |
| **Truck** | 6×3×12 | 18K-28K | Cargo vehicle |
| **Bus** | 8×4×15 | 25K-35K | Public transport |
| **Motorcycle** | 2×1.5×4 | 8K-12K | 2-wheeled |
| **ATV** | 3×2×4 | 10K-15K | Off-road quad |
| **Jeep** | 4×2.5×5 | 12K-18K | Rugged 4WD |
| **Pickup Truck** | 5×2.5×8 | 14K-22K | Open bed |
| **Taxi** | 5×2.5×10 | 15K-25K | Yellow/marked |
| **Police Car** | 5×2.5×10 | 16K-26K | Marked, lights |
| **Fire Truck** | 6×3.5×12 | 20K-30K | Red, ladder |
| **Ambulance** | 5×2.5×10 | 15K-25K | Medical vehicle |
| **Tractor** | 6×3×8 | 18K-28K | Farm equipment |

#### Aerial Vehicles

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Helicopter** | 10×5×10 | 20K-30K | Rotor blades |
| **Airplane** | 15×4×25 | 25K-40K | Wings, fuselage |
| **Small Plane** | 10×3×12 | 15K-25K | Cessna-type |
| **Hot Air Balloon** | 10×20×10 | 12K-18K | Basket + balloon |
| **Drone** | 1×1×1 | 2K-4K | Quadcopter |

#### Water Vehicles

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Boat** | 4×2×8 | 12K-18K | Small motorboat |
| **Ship** | 30×10×40 | 40K-60K | Large vessel |
| **Sailboat** | 6×15×8 | 15K-25K | Wooden, sails |
| **Yacht** | 20×8×30 | 30K-45K | Luxury vessel |
| **Fishing Boat** | 5×2.5×10 | 12K-18K | Nets, equipment |
| **Raft** | 3×1×3 | 2K-4K | Float platform |
| **Submarine** | 5×3×15 | 15K-25K | Underwater |
| **Speedboat** | 6×2×10 | 14K-22K | Fast watercraft |

#### Trains & Rails

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Train Car** | 3×3×8 | 12K-18K | Single passenger car |
| **Locomotive** | 4×4×8 | 15K-25K | Engine |
| **Cargo Car** | 3×3×12 | 10K-15K | Open freight |
| **Subway Car** | 3×3×20 | 20K-30K | Underground train |

---

### 5.4 CHARACTERS & NPCS (20+ Items)

#### Common NPCs

| Item | Typical Poly Count | Use |
|---|---|---|
| **Shopkeeper** | 8K-12K | NPC merchant |
| **Guard** | 8K-12K | Security, bouncer |
| **Farmer** | 7K-10K | Rural NPC |
| **Wizard** | 9K-13K | Magic NPC |
| **Knight** | 10K-15K | Armored warrior |
| **Pirate** | 8K-12K | Sea-faring NPC |
| **Maid/Butler** | 7K-11K | Service NPC |
| **Teacher** | 7K-10K | Educational NPC |
| **Chef** | 7K-10K | Restaurant NPC |
| **Doctor** | 7K-10K | Medical NPC |

#### Creatures & Monsters

| Item | Typical Poly Count | Notes |
|---|---|---|
| **Dragon** | 20K-35K | Large mythical |
| **Wolf** | 8K-12K | Canine enemy |
| **Skeleton** | 8K-12K | Undead warrior |
| **Orc** | 10K-15K | Fantasy enemy |
| **Zombie** | 8K-12K | Undead NPC |
| **Ghost** | 5K-8K | Transparent, spooky |
| **Golem** | 12K-18K | Stone creature |
| **Spider** | 6K-10K | Arachnid |
| **Demon** | 12K-18K | Evil creature |
| **Angel** | 10K-15K | Winged being |

#### Pets & Animals

| Item | Typical Poly Count | Use |
|---|---|---|
| **Dog** | 6K-10K | Pet, followable |
| **Cat** | 5K-8K | Pet, cute |
| **Bird** | 4K-6K | Flying pet |
| **Fish** | 3K-5K | Water pet |
| **Rabbit** | 4K-6K | Cute pet |
| **Hamster** | 2K-4K | Tiny pet |
| **Dinosaur** | 15K-25K | Large pet |
| **Horse** | 10K-15K | Rideable |
| **Lion** | 12K-18K | Large cat |
| **Unicorn** | 12K-18K | Fantasy horse |

---

### 5.5 FURNITURE (25+ Items)

#### Seating

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Chair** | 2×2×2 | 4K-8K | Basic seating |
| **Office Chair** | 2×2×2 | 6K-10K | Rolling, adjustable |
| **Stool** | 1×1×1 | 2K-4K | Bar/counter seating |
| **Bench** | 3×2×1.5 | 4K-7K | Multi-person |
| **Sofa** | 4×2×2 | 8K-12K | Multi-seat couch |
| **Throne** | 3×3×4 | 10K-15K | Ornate seat |
| **Bean Bag** | 2×1×2 | 3K-5K | Soft seating |

#### Tables & Desks

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Dining Table** | 4×1.5×4 | 6K-10K | Dinner surface |
| **Coffee Table** | 2×1×2 | 3K-5K | Living room |
| **Desk** | 3×1.5×1.5 | 5K-8K | Work surface |
| **Office Desk** | 4×1.5×2 | 6K-10K | Professional |
| **Nightstand** | 1.5×1.5×1.5 | 2K-4K | Bedroom |
| **Bar Table** | 2×1×1.5 | 3K-5K | Counter height |
| **Round Table** | 3×1.5×3 | 4K-7K | Circular dining |
| **Picnic Table** | 5×1.5×2 | 4K-6K | Outdoor |

#### Storage & Shelving

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Bookshelf** | 2×3×1 | 3K-6K | Book storage |
| **Cabinet** | 2×2×1.5 | 3K-6K | Closed storage |
| **Dresser** | 2×2×1.5 | 4K-7K | Bedroom storage |
| **Wardrobe** | 2.5×2×1.5 | 4K-7K | Clothing storage |
| **Locker** | 1×2×1 | 2K-4K | Personal storage |
| **Shelf Unit** | 3×4×1 | 3K-6K | Wall shelves |

#### Beds & Resting

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Bed (Single)** | 2×1.5×4 | 4K-7K | One person |
| **Bed (Double)** | 3×1.5×4 | 5K-8K | Two people |
| **Bunk Bed** | 2×3×4 | 6K-10K | Stacked beds |
| **Crib** | 1.5×1×3 | 2K-4K | Baby bed |
| **Hammock** | 3×2×1 | 2K-4K | Hanging rest |

#### Kitchen & Food

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Stove/Oven** | 2×2×1 | 4K-7K | Cooking appliance |
| **Refrigerator** | 2×2×2 | 5K-8K | Food storage |
| **Sink** | 1.5×1×1.5 | 2K-4K | Washing |
| **Counter** | 3×1.5×1 | 3K-5K | Prep surface |
| **Table (Dining)** | 4×1.5×4 | 6K-10K | Eating surface |
| **Microwave** | 1×1×1.5 | 2K-4K | Quick cooking |
| **Dishwasher** | 2×1.5×1.5 | 3K-5K | Dish cleaning |

---

### 5.6 WEAPONS (20+ Items)

#### Melee Weapons

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Sword** | 0.5×3×0.1 | 3K-6K | Blade weapon |
| **Longsword** | 0.5×4×0.1 | 4K-7K | Two-handed |
| **Axe** | 1×2×1 | 4K-7K | Splitting weapon |
| **Hammer** | 1.5×2×1.5 | 5K-8K | Blunt force |
| **Mace** | 1×2×1 | 4K-6K | Spiked club |
| **Staff** | 0.3×4×0.3 | 2K-5K | Magic focus |
| **Spear** | 0.5×5×0.5 | 3K-6K | Polearm |
| **Dagger** | 0.3×1.5×0.1 | 1K-3K | Short blade |
| **Bow** | 1×2×0.3 | 2K-4K | Ranged projectile |
| **Crossbow** | 1.5×1×0.5 | 3K-6K | Mechanical bow |

#### Ranged Weapons

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Pistol** | 0.5×0.5×2 | 2K-4K | Handgun |
| **Rifle** | 0.5×0.3×3 | 3K-6K | Long gun |
| **Shotgun** | 0.6×0.3×2.5 | 3K-5K | Spread shot |
| **Sniper** | 0.5×0.3×3.5 | 3K-6K | Long range |
| **Machine Gun** | 0.6×0.4×2 | 4K-7K | Rapid fire |
| **Rocket Launcher** | 1×0.8×2.5 | 5K-8K | Explosive |
| **Flamethrower** | 1×0.6×2 | 4K-7K | Fire weapon |

#### Magic/Tech Weapons

| Item | Typical Size | Poly Count | Notes |
|---|---|---|---|
| **Wand** | 0.2×3×0.2 | 1K-3K | Magic focus |
| **Orb** | 1×1×1 | 2K-4K | Energy source |
| **Laser Gun** | 0.6×0.4×2.5 | 3K-6K | Energy weapon |
| **Energy Blade** | 0.5×2.5×0.1 | 2K-4K | Plasma sword |
| **Shield** | 2×2×0.2 | 3K-5K | Defense item |
| **Armor Piece** | 1×1×0.5 | 2K-4K | Protection |

---

### 5.7 EFFECTS & VISUAL ELEMENTS (15+ Items)

#### Particles & Trails

| Item | Typical Use | Cost |
|---|---|---|
| **Smoke** | Environmental effect | Free (built-in) |
| **Fire** | Explosion, damage | Free (built-in) |
| **Sparkles** | Magic effect | Free (built-in) |
| **Water Splash** | Impact effect | Free (built-in) |
| **Dust Cloud** | Impact, movement | Free (built-in) |
| **Lightning** | Magic, electric | Free (built-in) |
| **Glow Trail** | Weapon effect | Free (built-in) |
| **Portal** | Teleport effect | Free (built-in) |

#### Light Effects

| Item | Use | Notes |
|---|---|---|
| **Spotlight** | Directed light | Adjustable color |
| **Torchlight** | Ambient light | Flickering |
| **Neon Glow** | Magical light | Bright, colorful |
| **Fog** | Atmosphere | Reduces visibility |
| **Bloom** | Light halos | Hazy effect |

#### UI Elements (3D/Billboard)

| Item | Size | Use |
|---|---|---|
| **Health Bar** | 4×0.5 | Above NPC |
| **Name Tag** | 4×0.5 | Player identification |
| **Chat Bubble** | 5×3 | Dialog display |
| **Damage Number** | 1×1 | Floating text |
| **Minimap** | 2×2 | Navigation |
| **Quest Marker** | 2×2 | Objective pointer |

---

### 5.8 TOOLS & INTERACTIVE (15+ Items)

#### Mining & Gathering

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Pickaxe** | 1×2.5×1 | 4K-7K | Mining ore |
| **Shovel** | 1×2×1 | 3K-6K | Digging dirt |
| **Axe** | 1.5×2×1 | 4K-7K | Chopping wood |
| **Bucket** | 1×1.5×1 | 2K-4K | Carrying liquid |
| **Fishing Rod** | 0.3×4×0.3 | 2K-4K | Fishing |

#### Keys & Locks

| Item | Size | Notes |
|---|---|---|
| **Key** | 0.5×2×0.2 | Opens doors |
| **Lock** | 1×1×0.5 | Door mechanism |
| **Safe Door** | 2×2×0.5 | Vault entry |
| **Chest** | 2×2×2 | Storage container |

#### Interactive Objects

| Item | Size | Poly Count | Use |
|---|---|---|---|
| **Door** | 4×7×0.2 | 3K-6K | Entryway |
| **Lever** | 0.2×1.5×0.2 | 500-1K | Mechanism |
| **Button** | 0.5×0.5×0.3 | 500-1K | Interactive element |
| **Sign/Billboard** | 4×3×0.2 | 2K-4K | Information |
| **Treasure Chest** | 2×2×2 | 4K-7K | Loot container |

#### Coins & Currency

| Item | Size | Notes |
|---|---|---|
| **Coin (Gold)** | 0.3 radius | Generic money |
| **Coin (Silver)** | 0.3 radius | Alternative currency |
| **Gem** | 0.5 radius | Precious item |
| **Diamond** | 0.5 radius | High value |

---

### 5.9 ENVIRONMENT & DECORATION (20+ Items)

#### Lighting

| Item | Typical Size | Poly Count | Use |
|---|---|---|---|
| **Lamppost** | 1×4×1 | 3K-5K | Street lighting |
| **Wall Lamp** | 1×1×1 | 1K-3K | Indoor light |
| **Ceiling Light** | 2×0.5×2 | 1K-3K | Fixture |
| **Chandelier** | 2×3×2 | 3K-6K | Ornate light |
| **Lantern** | 1×1.5×1 | 2K-4K | Portable light |
| **Candle** | 0.5×1×0.5 | 500-1K | Small light |
| **Neon Sign** | 3×1×0.2 | 1K-3K | Glowing text |

#### Furniture & Fixtures

| Item | Size | Use |
|---|---|---|
| **Potted Plant** | 1×1.5×1 | Decoration |
| **Painting** | 2×2×0.1 | Wall art |
| **Mirror** | 2×2×0.1 | Reflection |
| **TV** | 2×3×0.3 | Entertainment |
| **Computer** | 1.5×1.5×1 | Tech |
| **Phone** | 0.3×0.8×0.2 | Communication |
| **Clock** | 0.5×0.5×0.3 | Time display |
| **Rug** | 3×0.1×3 | Floor covering |

#### Outdoor Objects

| Item | Size | Use |
|---|---|---|
| **Fence** | 10×1.2×0.2 | Boundary |
| **Gate** | 4×2×0.2 | Passage |
| **Bench** | 3×1.5×1 | Seating |
| **Trash Can** | 1×1.5×1 | Waste disposal |
| **Fire Hydrant** | 0.5×2×0.5 | Emergency |
| **Mailbox** | 0.5×1×0.5 | Mail storage |
| **Streetlight** | 1×5×1 | Road lighting |
| **Stop Sign** | 1.5×1.5×0.1 | Traffic control |
| **Parking Meter** | 0.5×2×0.5 | Parking |
| **Bus Stop** | 3×3×4 | Transit shelter |

---

### 5.10 SPECIAL CATEGORIES (15+ Items)

#### Seasonal/Holiday

| Item | Season | Use |
|---|---|---|
| **Christmas Tree** | December | Holiday decoration |
| **Pumpkin** | October | Halloween |
| **Wreath** | December | Door decoration |
| **Lights (String)** | December | Illumination |
| **Fireworks** | July 4th/NYE | Celebration |
| **Costume** | Halloween | Cosmetic |

#### Fantasy/RPG

| Item | Poly Count | Use |
|---|---|---|
| **Rune Stone** | 3K-5K | Magic object |
| **Spell Circle** | 2K-4K | Magic effect |
| **Throne** | 10K-15K | Important seat |
| **Dungeon Door** | 4K-7K | Level entry |
| **Treasure Map** | 1K-2K | Quest item |
| **Crystal Ball** | 3K-5K | Magic focus |

#### Industrial/Tech

| Item | Size | Use |
|---|---|---|
| **Machine** | 5×5×5 | Factory equipment |
| **Conveyor Belt** | 10×1×2 | Moving platform |
| **Factory Door** | 5×10×0.5 | Industrial entry |
| **Control Panel** | 2×2×0.5 | Machine interface |
| **Steam Pipe** | 0.3 radius×8 | Industrial detail |
| **Robot** | 3×3×3 | Autonomous machine |

---

## SUMMARY TABLE: Asset Specifications

| Category | Avg Size (studs) | Typical Poly | Parts | Texture Res | Notes |
|---|---|---|---|---|---|
| **Building** | 20×15×15 | 25K | 200-300 | 1K×1K | Largest group |
| **Character** | 2×5×1 | 10K | 15 | 1K×1K | Rigged, animated |
| **Furniture** | 2-4×1-2×2-4 | 5K | 10-20 | 512-1K | High variety |
| **Weapon** | 0.5×2×0.1 | 3K | 5-10 | 512 | Fast loading |
| **Vehicle** | 5×3×10 | 18K | 30-50 | 1K×1K | Complex model |
| **NPC/Enemy** | 2×5×1 | 8K | 15 | 1K×1K | Rigged, AI |
| **Effect** | <1 (area) | 500-2K | 1-5 | N/A | No collision |
| **Terrain** | Variable | — | — | 4-stud voxels | Procedural |

---

## QUICK ASSET GENERATION CHECKLIST

```
When generating assets with AI (Claude/Meshy/Fal):

1. SCALE
   ✓ Character: 2 stud width
   ✓ Furniture: 2-4 studs
   ✓ Building: 10-20 studs
   ✓ Vehicle: 5-10 studs

2. POLYGONS
   ✓ Keep <30K for mobile
   ✓ Request low-poly in Meshy
   ✓ Decimate if needed

3. TEXTURES
   ✓ Generate 1024×1024 PNG
   ✓ Use PBR (albedo + normal)
   ✓ Seamless for tiling props

4. FORMATS
   ✓ Export as .glb
   ✓ Test in Blender first
   ✓ Validate polygon count

5. UPLOAD
   ✓ Batch upload to Roblox API
   ✓ Wait 24-48h moderation
   ✓ Create MeshParts
   ✓ Apply textures

6. OPTIMIZATION
   ✓ Remove interior faces
   ✓ Bake lighting if needed
   ✓ Use LOD for large objects
```

---

**Last Updated:** 2026-03-29
**Total Assets Catalogued:** 150+
**Estimated Reading Time:** 45-60 minutes
**Ready for:** Code generation, AI training, asset pipeline design

