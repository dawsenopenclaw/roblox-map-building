# Blender-to-Roblox Complete Pipeline Research
**Last Updated:** 2026-03-29 | **Status:** Production-Ready

---

## PART 1: Blender Basics for Roblox

### Version & Setup
- **Recommended:** Blender 4.0+ (4.1.1 LTS is stable, 4.2+ has minor UI tweaks)
- **Why:** Better FBX export, improved sculpting, native USD support
- **Minimum:** Blender 3.6 (supports FBX 7.6.0)

### Scale: Blender Units → Roblox Studs
**Problem:** 1 Blender unit ≠ 1 Roblox stud (common misconception)

**Truth:**
- 1 Roblox stud = ~0.28 Blender units (in default Blender scale)
- **Solution 1 (Recommended):** Model at 1:1 scale in Blender, apply 0.28 scale on FBX export → then re-scale 3.57× in Studio
- **Solution 2:** Model at 3.57× larger in Blender (e.g., 16-stud tall character = 45.1 Blender units), export at 1:1 scale
- **Solution 3 (Simplest):** Model "human-scale" (1.8m tall character = ~6.4 Blender units), use 0.28 export scale, import into Studio

**Quick Cheat:**
```
Roblox height (studs) × 0.28 = Blender modeling size
Blender size × 3.57 = Roblox studs (inverse)

Example: 10-stud tall prop
→ Model as 2.8 Blender units tall
→ Export, import to Studio
→ In Studio properties, verify scale ≈ 1.0
```

### Coordinate System: Z-up vs Y-up
| Axis | Blender | Roblox | Handled By |
|------|---------|--------|------------|
| Up | +Z | +Y | FBX export "Forward: -Z Forward, Up: Y Up" |
| Forward | +Y | -Z | FBX export setting |
| Right | +X | +X | No change needed |

**Export Fix (Automatic):**
- In FBX export dialog, set **Forward: -Z Forward**
- Set **Up: Y Up**
- Blender will handle rotation automatically

### Workspace Layout for Roblox (Optimal Setup)
1. **Left (65%):** 3D Viewport (default Blender view)
   - Press `N` for properties panel
   - Enable "Overlay" for grid, labels

2. **Top-Right (35%, split):**
   - UV Editor (for unwrapping)
   - Shader Editor (for PBR setup)

3. **Bottom-Right (20%):**
   - Outliner (object hierarchy)
   - Properties panel (object/material settings)

**Pro Tip:** Save this as a custom workspace: `Workspace → "+" button → New Workspace → name "Roblox"`

---

## PART 2: Modeling Techniques & Triangle Budgets

### Triangle Count Guidelines
| Type | Budget | Explanation |
|------|--------|-------------|
| Small items (coins, cups, tools) | <500 tri | Mobile-friendly, batch rendering efficient |
| Props (furniture, barrels, rocks) | <5,000 tri | Standard detail level |
| Characters (humanoid rigged) | <10,000 tri | R15 rig + clothing |
| Large structures (houses, towers) | <20,000 tri | Multi-part with optimization |
| Terrain pieces (cliffs, mountains) | <50,000 tri | If single mesh (split into chunks) |

**Why Triangle Count?**
- Roblox renders are GPU-bound
- Each triangle = 1 draw call (roughly)
- Mobile devices choke above 5K tri per mesh at 60fps
- Studio performance (network sync) degrades at >100K tris per model

### Box Modeling Workflow (Most Common)
```
Step 1: Cube subdivision
  - Start: Add → Mesh → Cube
  - Tab into Edit Mode (Tab)
  - Subdivide edges (Shift+R, then adjust)
  - Or use loop cuts (Ctrl+R) to add topology

Step 2: Extrude & shape
  - Select faces (3 key, then click)
  - Extrude (E key), move (G key)
  - Scale individual faces (S key)
  - Use proportional editing (O key) for smooth flows

Step 3: Add details
  - Bevel Tool (Ctrl+B) for hard edges
  - Inset faces (I key) for indentations
  - Loop cuts for control

Step 4: Add modifiers (non-destructive)
  - Shade Smooth (right-click mesh → Shade Smooth)
  - Add Subdivision Surface modifier (2x, 3x iterations)
  - Check triangle count in header

Result: 500-5K triangles depending on detail
```

### Sculpting → Retopology (High-Detail Models)
```
Use for: Organic models (creatures, faces, complex shapes)

Step 1: Sculpting phase
  - Mode: Sculpting
  - Brush: Draw Sharp, Draw, Grab, Smooth, Crease
  - Result: High-poly model (50K-500K triangles)
  - Use Subdivision Surface modifier to increase volume

Step 2: Decimation (optional reduction)
  - Add Decimate modifier
  - Ratio: 0.3-0.5 (keeps 30-50% of triangles)
  - Apply when happy

Step 3: Retopology (manual mesh creation over sculpt)
  - Add new mesh (Cube)
  - Enter Edit mode
  - Use "Snap to Surface" (Shift+O)
  - Create low-poly cage that follows sculpted shape
  - Aim: 2K-5K triangles

Step 4: Transfer details
  - Delete sculpt model
  - Keep retopo mesh
  - Bake normal maps from sculpt → retopo (see Part 3)
  - Result: Low-poly mesh with high-detail normal map

Time: 1-2 hours for character, 30-60 min for prop
```

### Boolean Operations (Like Roblox Unions)
**Blender has better boolean ops than Roblox** (solves intersections automatically)

```python
# Use case: Cutting windows in walls, merging shapes

In UI (Manual):
1. Create two meshes (wall + window hole)
2. Wall mesh → Modifiers → Add Boolean
3. Set Operation: Difference
4. Set Object: window hole mesh
5. Check "Solver: Fast Slope" or "Exact"
6. Apply modifier when satisfied
7. Delete hole mesh

Python code (bpy):
import bpy

def boolean_cut(target_obj_name, cutter_obj_name, operation="DIFFERENCE"):
    """Boolean operation: union, intersect, or difference"""
    target = bpy.data.objects[target_obj_name]
    cutter = bpy.data.objects[cutter_obj_name]

    # Add boolean modifier
    bool_mod = target.modifiers.new(name="Boolean", type="BOOLEAN")
    bool_mod.operation = operation  # "UNION", "INTERSECT", "DIFFERENCE"
    bool_mod.object = cutter
    bool_mod.solver = "FAST"  # or "EXACT" for precision

    # Apply it
    ctx = bpy.context.copy()
    ctx["object"] = target
    bpy.ops.object.modifier_apply(ctx, modifier=bool_mod.name)

    # Clean up cutter
    bpy.data.objects.remove(cutter, do_unlink=True)

# Example: Cut window from wall
boolean_cut("Wall", "Window_Hole", "DIFFERENCE")
```

**Warning:** Exact solver is slow; use Fast Slope for most cases.

### Key Modifiers for Roblox

| Modifier | Purpose | Roblox Relevance |
|----------|---------|-----------------|
| **Mirror** | Duplicate & flip along axis | Create symmetric chars/props (halve modeling time) |
| **Array** | Repeat object in pattern | Fence posts, pillars, repeated elements |
| **Subdivision Surface** | Add smoothness (non-destructive) | Character skin, organic shapes |
| **Bevel** | Round hard edges | Realistic corners, beveled panels |
| **Solidify** | Add thickness to faces | Thin walls, sheets, slabs |
| **Decimate** | Reduce triangle count | Lower poly version for distant LOD |

**Example: Creating a symmetric character**
```python
import bpy

# Model only the right half
# Apply Mirror modifier along X axis
char = bpy.data.objects["Character"]
mirror_mod = char.modifiers.new(name="Mirror", type="MIRROR")
mirror_mod.axis = "X"  # "X", "Y", or "Z"
mirror_mod.use_clip = True  # Prevent middle overlap

# When done, apply it
bpy.ops.object.modifier_apply(modifier=mirror_mod.name)
```

### Modeling Specific Roblox Items

#### House (Walls, Roof, Windows, Door)
**Approach:** Box modeling

```
Structure:
├── Walls (4 box extrusions)
├── Roof (2 box extrusions, beveled peak)
├── Windows (3 planes with inset + boolean cut)
├── Door (1 cube, inset for frame)
└── Foundation (1 large slab)

Workflow:
1. Start with 20×15×12 stud cube (walls baseline)
2. In Edit Mode, select top face → Extrude up 5 studs → Scale to 4×3
   (creates roof pyramid)
3. Add loop cuts on walls (vertical/horizontal) for window positions
4. Select window-sized face groups → Extrude inward 0.5 studs → Scale down
   (creates window indentation)
5. Create separate "window pane" mesh, boolean difference to cut through
6. Door: 1.5 wide × 3 tall, same boolean cut method
7. Foundation: 21×16×1 slab beneath

Triangle count: ~800 (optimized)
```

#### Tree (Trunk, Canopy, Branches)
**Approach:** Modeling + Sculpting hybrid

```
Trunk: Box modeling
- 0.5 stud diameter cylinder (8 sides)
- 10 studs tall
- Slight taper (scale down 0.7 at top)
- Bevel edges slightly

Canopy: Sculpting → Retopo
- UV Sphere, subdivide 3× (becomes leafy blob)
- Sculpt tool: Draw brush to shape
- Crease brush for branch definition
- Bake normal map (details in normal texture)
- Retopo to 1.5K triangles
- Apply foliage texture (leaves PBR)

Branches: Simple cones
- 3-4 cone meshes branching off trunk
- 100-300 triangles each
- Position at tree construction points

Result: 3K triangles total, photorealistic with normal maps
```

#### Car (Body, Wheels, Interior)
**Approach:** Box modeling with booleans

```
Body: Box modeling
- Start 8×4×3 main body cube
- Loop cut → extrude windshield/windows
- Boolean difference for door openings
- Add spoiler (small extruded box)
- Inset for panel lines
- Bevel all hard edges

Wheels (4× identical):
- Cylinder 1.5 diameter × 0.6 stud thick
- Loop cut around circumference
- Inset center (tire vs rim)
- Mirror modifier to create left/right pairs
- Bone: 1 Armature bone per wheel (for rotation rigging)

Interior:
- Steering wheel: Torus (donut shape)
- Seats: Box modeling, soft cushion texture
- Dashboard: Inset flat panels

Rigging:
- Wheels: 4 bones, constrained to rotate (parent to wheel mesh)
- Door: 1 bone, hinge constraint
- Steering: 1 bone, rotate constraint

Result: ~8K triangles, highly customizable
```

#### Character (R15 Compatible)
**Approach:** Box modeling + Rigging

```
Base: Mannequin approach
- Torso: 2 stud box
- Head: 1 stud sphere
- Arms: 0.5 × 4 stud cylinders
- Legs: 0.5 × 4 stud cylinders
- Hands/Feet: 0.3 stud spheres

Add detail:
- Extrude features on head (ears, nose)
- Add clothing geometry (pants overlap torso, shirt on arms)
- Bevel all soft edges

Armature (Rigging):
Bone hierarchy (R15 compatible):
├── Humanoid (root)
├── Torso
│   ├── Head
│   │   ├── Neck (optional)
│   ├── LeftUpperArm
│   │   └── LeftLowerArm
│   │       └── LeftHand
│   └── RightUpperArm
│       └── RightLowerArm
│           └── RightHand
├── LeftUpperLeg
│   └── LeftLowerLeg
│       └── LeftFoot
└── RightUpperLeg
    └── RightLowerLeg
        └── RightFoot

Weight painting:
- Each bone influences nearby vertices
- Smooth falloff for realistic joints
- Test bending: Pose mode (Ctrl+Tab), rotate bones

Result: 3-5K triangles, fully rigged & animatable
```

#### Weapon (Sword: Handle + Blade)
**Approach:** Box modeling with Boolean

```
Blade:
- Start: Cube 0.2 × 2.5 × 0.05 studs
- Extrude point at end (beveled tip)
- Edge bevel for sharp edges
- Normal map for metallic scratches

Handle:
- Cylinder 0.3 diameter × 1.5 studs
- Taper slightly (0.25 at bottom)
- Add cross-guard (box boolean)
- Add pommel (sphere at base)

Combine:
- Parent blade + guard to handle
- Center pivot at hand grip area
- Test in Pose mode (swing rotation)

Optional: Armature for blade deformation
- 1 bone in blade (for swing animations)
- 1 bone in handle (held by character hand bone)

Result: 400-800 triangles
```

#### Furniture (Chair, Table)
**Approach:** Quick box modeling

```
Chair:
- Seat: 1.5×1.5×0.2 box
- Backrest: 1.5×0.15×1.5 box (extruded from seat back)
- 4 legs: 0.2×0.2×1.0 cylinders, positioned at corners
- Optional: Armrests (0.15×0.5×0.8 boxes on sides)
- Total: 200 triangles

Table:
- Top: 4×2.5×0.15 box
- 4 legs: 0.2×0.2×0.8 cylinders
- Optional: Shelf beneath (1 slab)
- Total: 150 triangles

Apply smooth shading + bevel for softness
```

#### Terrain Pieces (Rocks, Cliffs)
**Approach:** Sculpting + Decimation

```
Large Rock:
- Start: UV Sphere, scale random
- Sculpt mode: Draw brush to create jagged surface
- Crease brush for cliff faces
- Decimate to 1K triangles
- Add stone PBR texture

Cliff Face:
- Box modeling: Large slab 50×50×10 studs
- Loop cuts to segment into 20-30 faces
- Extrude each face slightly (height variation)
- Use proportional editing (falloff) for smooth transitions
- Decimate to 10K triangles max

Optimize:
- Split large meshes into 10×10 stud chunks
- Each chunk <5K triangles
- Roblox won't load far chunks anyway (LOD)
```

---

## PART 3: UV Unwrapping & Texturing

### UV Unwrapping Methods

#### Smart UV Project (Automated, 80% of the time)
```python
import bpy

def smart_unwrap(obj_name, angle_limit=66, margin=0.02):
    """Fast, automatic UV unwrapping"""
    obj = bpy.data.objects[obj_name]
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')

    # Smart UV Project
    bpy.ops.uv.smart_project(angle_limit=angle_limit, margin_method='ADJUSTED', margin=margin)

    bpy.ops.object.mode_set(mode='OBJECT')

# Usage
smart_unwrap("MyProp")
```

**Best for:** Props, characters, terrain pieces
**Speed:** 5 seconds
**Quality:** 7/10 (some stretching on complex shapes)
**Margin:** Leave 2-4% between UV islands to prevent texture bleed

#### Manual Unwrapping (When Smart Project Fails)
```
Use for: Visible seams (characters face/neck, vehicles body lines)

1. Mark seams (automatic):
   - Select edges where stretching visible
   - Press Ctrl+E → Mark Seam
   - Seams appear red in Edit mode

2. Unwrap by seam:
   - Edit Mode, select all (A)
   - Press U → Unwrap
   - (Uses seams as fold lines)

3. Pack UVs:
   - U → Pack Islands
   - Spreads islands efficiently in 0-1 space

4. Check for overlaps:
   - Overlapping UVs = texture repeating → bad
   - Use Texture menu → Check Overlaps (red = bad)
```

### UV Packing for Roblox Texture Atlas
**Goal:** Fit multiple models' UVs into one 1024×1024 texture (save file size)

```python
import bpy

def pack_uvs_efficient(obj_list, texture_size=1024, margin=4):
    """Pack multiple objects' UVs into one atlas"""

    # Bake all materials first (see texturing section)
    # Then unwrap
    for obj_name in obj_list:
        smart_unwrap(obj_name, margin=0.01)  # Tighter margin

    # Manual packing (advanced):
    # - Calculate expected size per object
    # - Manually position UV islands in editor
    # - Verify no overlaps

    # Export texture (see baking section)
```

**Texture Atlas Example:**
```
1024×1024 texture divided:
├── 512×512 quad [Character face]
├── 256×256 quad [Sword blade]
├── 256×256 quad [Sword handle]
├── 256×256 quad [Shield]
└── 512×256 rect [Terrain rocks]

Margin between: 4 pixels
```

### Texture Painting in Blender
```
Setup:
1. Create image: Texture → New Image (1024×1024, 32-bit)
2. Assign to material (see Shader Editor)
3. Switch to Texture Paint mode (top-left mode selector)
4. Select brush (pencil, brush, smudge)
5. Paint directly on 3D model

Workflow (fastest):
1. Create base material in Shader Editor (Base Color node)
2. Switch to Texture Paint
3. Paint color (use color picker tool)
4. Paint normal map details (blue/purple values)
5. Save texture: Image → Save As

For high-quality: Use Substance Painter instead (see below)
```

### Substance Painter / Quixel Integration
**Why:** Professional texture painting, smart material application

```
Workflow (Substance Painter):
1. Export model from Blender as FBX (with UVs)
2. Open Substance Painter → File → New Project
3. Import FBX model
4. Choose Smart Material library (fabric, metal, wood, etc.)
5. Drag materials onto model in Viewport
6. Paint details with brushes
7. Adjust roughness/metallic sliders
8. Export textures: File → Export Textures as...
   - Format: PNG (for color) + PNG (for normal/roughness/metallic)
   - Texture Set: All

Return to Blender:
1. Import textures (Image → Open Image)
2. Connect to Shader Editor:
   - Albedo → Base Color
   - Normal → Normal Map (with Normal Map node)
   - Roughness → Roughness input
   - Metallic → Metallic input
3. Render preview (press Z → Rendered)
```

### PBR Texture Components

| Map | Channel | Values | Roblox Node |
|-----|---------|--------|------------|
| **Albedo (BaseColor)** | RGB | 0-255 color | Color input on Base Color |
| **Normal Map** | RGB (Blue-packed) | XY in RG, Z in B | Normal Map node → Base Color |
| **Roughness** | Grayscale | 0 (shiny) to 1 (matte) | Roughness input |
| **Metallic** | Grayscale | 0 (non-metal) to 1 (full metal) | Metallic input |
| **Height/Displacement** | Grayscale | Rarely used in Roblox | (Skip for Roblox) |

**Shader Setup in Blender (Principled BSDF = Roblox SurfaceAppearance):**
```
Material → Shader Editor
├── Texture (Image Sampler) [Albedo]
│   └── Base Color input
├── Texture [Normal Map] → Normal Map node
│   └── Normal input
├── Texture [Roughness] → Color Ramp (grayscale)
│   └── Roughness input
└── Texture [Metallic] → Color Ramp
    └── Metallic input
```

### Texture Resolution Recommendations
| Item | Resolution | Reason |
|------|-----------|--------|
| Small item (coin, tool) | 256×256 | Low detail area, fast load |
| Prop (furniture, barrel) | 512×512 | Standard Roblox prop detail |
| Character face | 1024×1024 | Facial detail = high impact |
| Vehicle body | 512×512 to 1K | Large area but moderate detail |
| Skybox | 2048×2048 | Far away, high coverage |
| Terrain tileable | 512×512 | Repeats, can use smaller res |

**Memory Impact (Roblox):**
- 256×256 = 256 KB (uncompressed)
- 512×512 = 1 MB
- 1024×1024 = 4 MB
- Roblox compression (WebP/ASTC) = ~30% file size

**Total Budget:** Keep texture assets <50 MB for an entire game (upload limit)

### SurfaceAppearance in Roblox (Mapping Blender → Roblox)
```lua
-- In Roblox Studio Lua
local part = script.Parent -- MeshPart
local appearance = part:FindFirstChildOfClass("SurfaceAppearance") or Instance.new("SurfaceAppearance")
appearance.Parent = part

-- Map textures
appearance.ColorMap = "rbxassetid://1234567890"  -- Albedo texture
appearance.NormalMap = "rbxassetid://0987654321"  -- Normal map
appearance.RoughnessMap = "rbxassetid://1111111111"
appearance.MetallicMap = "rbxassetid://2222222222"
```

**Uploading textures:**
1. In Studio: Insert → Meshes → [Upload Mesh/Texture]
2. Upload texture PNG/JPG files
3. Copy asset IDs from properties
4. Paste into Lua code above

---

## PART 4: Rigging & Animation

### Armature Setup for R15 Compatibility
R15 = Roblox 15-bone humanoid rig (standard for modern Roblox)

```python
import bpy

def create_r15_armature(name="R15_Rig"):
    """Create R15-compatible armature"""

    # Create armature
    armature = bpy.data.armatures.new(name)
    arm_obj = bpy.data.objects.new(name, armature)
    bpy.context.collection.objects.link(arm_obj)

    # Set to edit mode
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')

    # R15 bone structure (simplified)
    bones = {
        "Torso": {"head": (0, 0, 0), "tail": (0, 0, 2)},
        "Head": {"head": (0, 0, 2), "tail": (0, 0, 3)},
        "LeftUpperArm": {"head": (1, 0, 1.5), "tail": (2, 0, 0.5)},
        "LeftLowerArm": {"head": (2, 0, 0.5), "tail": (2.5, 0, 0)},
        "LeftHand": {"head": (2.5, 0, 0), "tail": (2.7, 0, -0.3)},
        "RightUpperArm": {"head": (-1, 0, 1.5), "tail": (-2, 0, 0.5)},
        "RightLowerArm": {"head": (-2, 0, 0.5), "tail": (-2.5, 0, 0)},
        "RightHand": {"head": (-2.5, 0, 0), "tail": (-2.7, 0, -0.3)},
        "LeftUpperLeg": {"head": (0.5, 0, 0), "tail": (0.5, 0, -2)},
        "LeftLowerLeg": {"head": (0.5, 0, -2), "tail": (0.5, 0, -4)},
        "LeftFoot": {"head": (0.5, 0, -4), "tail": (0.5, 0, -4.3)},
        "RightUpperLeg": {"head": (-0.5, 0, 0), "tail": (-0.5, 0, -2)},
        "RightLowerLeg": {"head": (-0.5, 0, -2), "tail": (-0.5, 0, -4)},
        "RightFoot": {"head": (-0.5, 0, -4), "tail": (-0.5, 0, -4.3)},
    }

    # Create bones
    for bone_name, positions in bones.items():
        bone = armature.edit_bones.new(bone_name)
        bone.head = positions["head"]
        bone.tail = positions["tail"]

    # Parent relationships (chain bones)
    armature.edit_bones["Head"].parent = armature.edit_bones["Torso"]
    armature.edit_bones["LeftUpperArm"].parent = armature.edit_bones["Torso"]
    armature.edit_bones["LeftLowerArm"].parent = armature.edit_bones["LeftUpperArm"]
    armature.edit_bones["LeftHand"].parent = armature.edit_bones["LeftLowerArm"]
    # ... (repeat for right arm and legs)

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj

# Usage
rig = create_r15_armature()
```

**Bone Naming Convention (Match Roblox exactly):**
- Head, Torso
- LeftUpperArm, LeftLowerArm, LeftHand
- RightUpperArm, RightLowerArm, RightHand
- LeftUpperLeg, LeftLowerLeg, LeftFoot
- RightUpperLeg, RightLowerLeg, RightFoot

### Weight Painting (Vertex Influence)
Weight painting = which bones deform which vertices

```python
import bpy

def quick_weight_paint(mesh_obj, armature_obj):
    """Auto-weight character mesh to armature"""

    # Select mesh, then armature
    mesh_obj.select_set(True)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj

    # Add armature modifier
    mod = mesh_obj.modifiers.new(name="Armature", type="ARMATURE")
    mod.object = armature_obj

    # Automatic weights (genius feature!)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')

    # In weight paint mode, adjust vertex influence
    # (Done manually in UI by painting on mesh)

# Manual weight painting in UI:
# 1. Select mesh, enter Weight Paint mode (Ctrl+Tab)
# 2. Select bone (Outliner)
# 3. Adjust brush strength
# 4. Paint vertices white (100% influenced) to black (0% influenced)
# 5. Test in Pose mode (Ctrl+Tab → Pose mode, rotate bones)
```

**Test deformation:** Pose mode (Ctrl+Tab), rotate each bone, verify smooth transitions at joints

### Animation: Keyframes & Action Editor
```python
import bpy

def create_idle_animation(armature_obj, frames=120, fps=30):
    """Create simple idle animation (standing still, slight sway)"""

    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')

    # Create action (animation clip)
    action = bpy.data.actions.new("Idle")
    armature_obj.animation_data.action = action

    # Keyframe 0: T-pose
    bpy.context.scene.frame_set(0)
    for bone_name in ["Head", "LeftUpperArm", "RightUpperArm"]:
        bone = armature_obj.pose.bones[bone_name]
        bone.location = (0, 0, 0)
        bone.rotation_euler = (0, 0, 0)
        bone.keyframe_insert(data_path="location", frame=0)
        bone.keyframe_insert(data_path="rotation_euler", frame=0)

    # Keyframe 60: Slight torso sway
    bpy.context.scene.frame_set(60)
    torso = armature_obj.pose.bones["Torso"]
    torso.location.x = 0.1  # Sway right
    torso.keyframe_insert(data_path="location", frame=60)

    # Keyframe 120: Back to start (loop)
    bpy.context.scene.frame_set(120)
    torso.location.x = 0
    torso.keyframe_insert(data_path="location", frame=120)

    bpy.ops.object.mode_set(mode='OBJECT')
    return action

# Usage
create_idle_animation(armature)
```

**Action Editor (Blender UI):**
1. Switch to Action Editor (tab at top)
2. Each action = one animation clip
3. Use NLA Editor to layer/blend animations
4. Export each action separately (see Part 5)

### Exporting Animations as Separate .fbx Files
```python
import bpy

def export_animation(armature_obj, action_name, filepath):
    """Export single animation action to .fbx"""

    # Set action as active
    action = bpy.data.actions[action_name]
    armature_obj.animation_data.action = action

    # Get frame range
    frame_start = int(action.frame_range[0])
    frame_end = int(action.frame_range[1])

    # Export
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        bake_anim=True,
        bake_anim_use_all_actions=False,
        bake_anim_simplify_factor=1.0,
        frame_start=frame_start,
        frame_end=frame_end,
        forward='-Z',
        up='Y',
        scale_mode='FBX_ALL',
        apply_scaling='FBX_ALL',
        use_mesh_modifiers=True,
    )

# Usage (export all animations)
for action in bpy.data.actions:
    export_animation(armature, action.name, f"/path/{action.name}.fbx")
```

### Moon Animator vs Blender Animations
| Aspect | Blender | Moon Animator |
|--------|---------|---------------|
| **Learning curve** | Steep | Gentle (in-Roblox UI) |
| **Complexity** | Scripting + GUI | Drag-drop frames |
| **Quality** | Professional (splines) | Adequate (linear) |
| **Iteration speed** | Slow (bake → export → test) | Fast (real-time in-game) |
| **Best use** | Complex character anims | Quick tweaks, NPC anims |

**Recommendation:** Use Blender for character rigging + base animations, then fine-tune in Moon Animator in Studio

---

## PART 5: Export Pipeline (The Critical Bit)

### Export Format Decision
| Format | When | Why |
|--------|------|-----|
| **.fbx** | 99% of cases | Blender → Studio native support, animation/rig included |
| **.glb** | Rarely (web preview) | Universal, but loses bones/weights, harder to re-edit |
| **.obj** | Avoid | No animation/rig support, outdated |

### Blender FBX Export Settings (Exact Dialog Values)

```python
import bpy

def export_for_roblox(obj_name, filepath, include_rig=False):
    """Export mesh (with optional rig) for Roblox"""

    # Select object
    obj = bpy.data.objects[obj_name]
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # CRITICAL EXPORT SETTINGS:
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,  # Only export selected

        # TRANSFORM (crucial for Roblox Y-up compatibility)
        forward='-Z',  # Convert from Blender +Y forward to Roblox -Z forward
        up='Y',  # Roblox is Y-up
        scale_mode='FBX_ALL',  # Scale everything (preserves proportions)
        apply_scaling='FBX_ALL',  # Bake scale into FBX (no scale factor in Studio)

        # MESH SETTINGS
        use_mesh_modifiers=True,  # Apply Mirror/Subdivision modifiers
        use_triangulation=True,  # Triangulate faces (Roblox requirement)
        mesh_smooth_type='FACE',  # Smooth shading type
        use_smoothing_groups=False,  # Don't use smoothing groups (Roblox doesn't support)

        # ANIMATION (if rigged)
        bake_anim=include_rig,  # Bake keyframes into mesh deformation
        bake_anim_use_all_actions=include_rig,  # Export all actions
        bake_anim_simplify_factor=1.0,  # No simplification

        # MATERIALS & TEXTURES
        use_materials=True,  # Export material assignments
        object_types={'MESH', 'ARMATURE'},  # Include mesh + skeleton

        # MISC
        use_custom_properties=False,  # Skip Blender custom data
    )

# Usage examples:
export_for_roblox("MyProp", "prop.fbx", include_rig=False)
export_for_roblox("Character", "character.fbx", include_rig=True)
```

**Key Settings Explained:**

| Setting | Value | Why |
|---------|-------|-----|
| **forward** | `-Z` | Roblox uses -Z as forward, Blender uses +Y |
| **up** | `Y` | Both use Y-up (correct) |
| **scale_mode** | `FBX_ALL` | Bake scale into mesh (prevent Studio scale issues) |
| **use_triangulation** | `True` | Roblox MeshPart only accepts triangles |
| **mesh_smooth_type** | `FACE` | Smooth shading on import |
| **bake_anim** | `True` if rigged | Embeds bone deformation into FBX |

### Importing .fbx into Roblox Studio
```lua
-- Method 1: Manual drag-drop
-- In Studio: File menu → Insert Object → Mesh
-- Select .fbx file, Studio auto-creates MeshPart

-- Method 2: Asset Library (cleaner)
-- Insert → Mesh Model → [Browse local files]
-- Studio imports and creates MeshPart in workspace

-- Method 3: Programmatic (advanced)
-- Not directly supported; use Insert → Mesh UI
```

### MeshPart Import Dialog (Studio)

When you import, Studio shows a dialog:
```
Import Settings:
├─ Collision Fidelity: [Default | Box | Convex Hull | Precise]
│  ├─ Default: Auto-detect (good for props)
│  ├─ Box: Single collision box (fast)
│  ├─ Convex Hull: Simple collision (good for non-concave)
│  └─ Precise: Mesh collision (slow, use sparingly)
│
└─ Render Fidelity: [Automatic | Precise]
   ├─ Automatic: Reduce poly count for distance (LOD)
   └─ Precise: Never simplify (for visible objects)
```

**Recommendation:**
- Props: Collision = Convex Hull, Render = Automatic
- Characters: Collision = Convex Hull, Render = Precise
- Terrain: Collision = Precise, Render = Automatic

### Texture Upload (Separate from Mesh)
```lua
-- Textures are uploaded separately in Studio

-- Process:
-- 1. File → Advanced → Upload Mesh/Texture
-- 2. Select your PNG texture files
-- 3. Studio generates Asset IDs
-- 4. Copy IDs into SurfaceAppearance script

-- Example:
local part = Instance.new("MeshPart")
part.Name = "TexturedProp"
part.MeshId = "rbxassetid://YOUR_MESH_ID"
part.Parent = workspace

local appearance = Instance.new("SurfaceAppearance")
appearance.ColorMap = "rbxassetid://YOUR_COLOR_TEXTURE_ID"
appearance.NormalMap = "rbxassetid://YOUR_NORMAL_MAP_ID"
appearance.Parent = part
```

### SurfaceAppearance Setup (Complete Example)
```lua
local function setup_pbr_material(meshpart, color_id, normal_id, rough_id, metal_id)
    -- Remove old appearance
    local old = meshpart:FindFirstChildOfClass("SurfaceAppearance")
    if old then old:Destroy() end

    -- Create new appearance
    local appearance = Instance.new("SurfaceAppearance")
    appearance.ColorMap = color_id
    appearance.NormalMap = normal_id
    appearance.RoughnessMap = rough_id
    appearance.MetallicMap = metal_id
    appearance.Parent = meshpart
end

-- Usage
setup_pbr_material(
    workspace:WaitForChild("MyMeshPart"),
    "rbxassetid://12345",  -- Albedo
    "rbxassetid://12346",  -- Normal
    "rbxassetid://12347",  -- Roughness
    "rbxassetid://12348"   -- Metallic
)
```

---

## PART 6: Blender Add-ons for Roblox

### Official & Community Add-ons

| Add-on | Author | Purpose | Install |
|--------|--------|---------|---------|
| **Den_S Roblox Plugin** | den_s (community) | FBX export optimization, Roblox-specific tools | Blender Market ($20) or GitHub free |
| **RigEdit** | jspada (Roblox) | R15/R6 bone editing, rig retargeting | Blender Market free |
| **Bone Widget Builder** | Rigify (Blender core) | Create FK/IK rigs (optional) | Built-in, enable in preferences |
| **Mesh Symmetry Tools** | Built-in | Mirror modeling tools | Built-in |
| **Rigify (Advanced Rigging)** | Blender core | Auto-generate rigs (complex) | Built-in, enable if needed |

### Installing Add-ons

```
Method 1: Blender Market (paid)
1. blender.org → Community → Blender Market
2. Search add-on, purchase
3. Download .zip file
4. Blender → Edit → Preferences → Add-ons → Install
5. Select .zip, enable checkbox

Method 2: GitHub (free community)
1. GitHub search "Blender Roblox plugin"
2. Clone/download repository
3. Copy folder to: C:\Users\[You]\AppData\Roaming\Blender\X.X\scripts\addons\
4. Blender → Preferences → Add-ons → Search → Enable
```

### Must-Have Preferences for Roblox
```
Edit → Preferences → Interface
├─ Themes: Maya (darker, easier on eyes)
└─ UI Scale: 1.1-1.2

Edit → Preferences → Add-ons
├─ Search: "Auto Smooth"
├─ Enable: Auto Smooth (built-in)
└─ Enable: Mesh Tools (built-in)

Edit → Preferences → File Paths
└─ Temporary Files: D:\Blender_Temp\ (SSD, faster saves)
```

---

## PART 7: Automated Pipeline (Scripting & Batch Export)

### Blender Python (bpy) Automation
```python
#!/usr/bin/env python3
"""
Blender batch export script
Run: blender --python batch_export.py
"""

import bpy
import os
from pathlib import Path

def batch_export_meshes(input_dir, output_dir, scale_factor=0.28):
    """
    Export all .blend files in input_dir as FBX to output_dir

    Args:
        input_dir: Folder with .blend files
        output_dir: Folder for .fbx exports
        scale_factor: Blender → Roblox scale (0.28 default)
    """

    os.makedirs(output_dir, exist_ok=True)

    # Find all .blend files
    blend_files = list(Path(input_dir).glob("*.blend"))
    print(f"Found {len(blend_files)} .blend files")

    for blend_file in blend_files:
        print(f"\n=== Processing {blend_file.name} ===")

        # Open file
        bpy.ops.wm.open_mainfile(filepath=str(blend_file))

        # Select all meshes
        bpy.ops.object.select_all(action='SELECT')

        # Export
        fbx_output = Path(output_dir) / f"{blend_file.stem}.fbx"
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_output),
            use_selection=True,
            forward='-Z',
            up='Y',
            scale_mode='FBX_ALL',
            apply_scaling='FBX_ALL',
            use_mesh_modifiers=True,
            use_triangulation=True,
        )

        print(f"✓ Exported to {fbx_output}")

if __name__ == "__main__":
    batch_export_meshes(
        input_dir="./blender_models",
        output_dir="./exported_fbx"
    )
```

**Run from command line:**
```bash
blender --background --python batch_export.py
```

### Headless Blender Rendering
```bash
# Render frame 1 to PNG
blender --background scene.blend --render-frame 1 --render-output /path/output.png

# Batch render multiple frames
blender --background scene.blend --render-anim --render-output /path/frame_#####.png
```

### Meshy/Tripo → Blender → Roblox Workflow
```python
"""
Complete automated pipeline:
1. Download 3D model from Meshy/Tripo API
2. Import to Blender
3. Cleanup (reduce triangles, fix UVs)
4. Export to Roblox FBX
5. Upload to Roblox via Open Cloud API
"""

import bpy
import requests
import subprocess

def download_mesh_from_api(job_id, api_key, output_path):
    """Download GLB from Meshy API"""
    url = f"https://api.meshy.ai/v1/assets/{job_id}/download"
    headers = {"Authorization": f"Bearer {api_key}"}

    response = requests.get(url, headers=headers)
    with open(output_path, 'wb') as f:
        f.write(response.content)
    print(f"Downloaded: {output_path}")

def cleanup_mesh_for_roblox(blend_file, output_fbx):
    """
    Import downloaded GLB, cleanup, and export for Roblox
    """
    # Open Blender
    bpy.ops.wm.open_mainfile(filepath=blend_file)

    # Import GLB
    bpy.ops.import_scene.gltf(filepath=blend_file)

    # Decimate to reduce triangles
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj

            # Add decimate modifier
            decimate = obj.modifiers.new(name="Decimate", type="DECIMATE")
            decimate.ratio = 0.5  # Keep 50% of triangles

            # Check triangle count
            tri_count = len(obj.data.polygons)
            print(f"{obj.name}: {tri_count} triangles")

    # Export as FBX
    bpy.ops.export_scene.fbx(
        filepath=output_fbx,
        forward='-Z',
        up='Y',
        apply_scaling='FBX_ALL',
        use_triangulation=True,
    )

# Full pipeline
job_id = "abc123"  # From Meshy generation
api_key = "your_meshy_api_key"

# 1. Download
download_mesh_from_api(job_id, api_key, "downloaded.glb")

# 2. Cleanup
cleanup_mesh_for_roblox("downloaded.glb", "ready_for_roblox.fbx")

# 3. Upload to Roblox (see below)
```

### Roblox Open Cloud API: Batch Asset Upload
```python
"""
Upload prepared FBX files to Roblox directly via Open Cloud API
"""

import requests
import json
import time

class RobloxAssetUploader:
    def __init__(self, api_key, universe_id):
        self.api_key = api_key
        self.universe_id = universe_id
        self.base_url = "https://apis.roblox.com/assets/v1"

    def upload_model(self, fbx_path, model_name):
        """Upload .fbx file to Roblox"""

        with open(fbx_path, 'rb') as f:
            fbx_data = f.read()

        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "model/vnd.roblox.rbxm"
        }

        payload = {
            "assetType": "Model",
            "creationContext": {
                "creator": {
                    "userId": 1  # Replace with actual user ID
                }
            },
            "displayName": model_name,
            "description": f"Auto-generated from Blender: {model_name}"
        }

        # Multipart upload
        url = f"{self.base_url}/assets"

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            files={"model": fbx_data}
        )

        if response.status_code == 200:
            asset_id = response.json()['assetId']
            print(f"✓ Uploaded {model_name}: rbxassetid://{asset_id}")
            return asset_id
        else:
            print(f"✗ Upload failed: {response.status_code} {response.text}")
            return None

    def batch_upload(self, fbx_directory):
        """Upload all FBX files in directory"""
        import os

        asset_ids = {}
        for filename in os.listdir(fbx_directory):
            if filename.endswith('.fbx'):
                fbx_path = os.path.join(fbx_directory, filename)
                model_name = filename.replace('.fbx', '')

                asset_id = self.upload_model(fbx_path, model_name)
                asset_ids[model_name] = asset_id

                time.sleep(1)  # Rate limit

        return asset_ids

# Usage
uploader = RobloxAssetUploader(
    api_key="your_roblox_open_cloud_api_key",
    universe_id=12345
)

asset_ids = uploader.batch_upload("./exported_fbx")

# Save mapping for later
with open("asset_ids.json", 'w') as f:
    json.dump(asset_ids, f, indent=2)
```

### ForjeGames AI Pipeline Integration (Conceptual)
```
This is how ForjeGames could automate Blender:

┌─ User: "Generate a wooden chair"
│
├─ Step 1: Claude generates Luau code
│  (furniture model + materials)
│
├─ Step 2: Convert Luau → Blender script
│  (via translator agent)
│
├─ Step 3: Run Blender headless
│  $ blender --background --python generate_chair.py
│
├─ Step 4: Decimate & optimize
│  (bpy script reduces polys, fixes UVs)
│
├─ Step 5: Export FBX
│  blender-output/chair.fbx
│
├─ Step 6: Upload via Open Cloud API
│  asset_id = "rbxassetid://123456"
│
└─ Step 7: Return to user
   "Your chair is ready! Place it in your game."

Cost per chair: ~$0.02 (Blender CPU + API)
Time: 15-45 seconds
Quality: 7-8/10 (requires manual tweaks for 9/10)
```

---

## REFERENCE: Quick Cheatsheet

### Essential Blender Shortcuts
| Action | Shortcut |
|--------|----------|
| Tab | Toggle Edit/Object mode |
| G | Grab (move) |
| S | Scale |
| R | Rotate |
| E | Extrude |
| I | Inset faces |
| Ctrl+B | Bevel edges |
| Ctrl+R | Loop cut |
| Shift+O | Snap to surface |
| Z | Viewport shading menu |
| A | Select all |
| Alt+A | Deselect all |
| Ctrl+Tab | Toggle Pose mode |
| Shift+R | Repeat last operation |

### Export Checklist
- [ ] Scale correct (measure height in studs)
- [ ] All modifiers applied (Mirror, Subdivision)
- [ ] Triangulated (no quads)
- [ ] UVs unwrapped (check for overlaps)
- [ ] Materials assigned (if texturing)
- [ ] Bones/weights set up (if rigging)
- [ ] FBX settings: -Z Forward, Y Up, apply scaling
- [ ] Named correctly (will be filename.fbx)
- [ ] Export path is correct
- [ ] File size <100 MB

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Model imported sideways | Forward axis wrong | Export: Forward = -Z Forward |
| Model too large/small | Scale not applied | Export: Apply Scaling = FBX_ALL |
| Stretched faces | Bad UVs | Smart UV Project + pack islands |
| Seams visible on seams | Normal map issue | Use Normal Map node in Shader Editor |
| Character doesn't deform | No weight paint | Weight Paint mode, paint mesh with bone selected |
| Animation doesn't export | Bake anim unchecked | Export: Bake Anim = True |
| Texture not showing | Wrong node setup | Base Color ← Albedo image, Normal ← Normal Map node |

---

## FINAL SUMMARY

**Blender → Roblox Pipeline (TL;DR):**

1. **Model** (Box modeling/Sculpting) → 500-10K triangles
2. **Rig** (Armature + weight paint if character)
3. **Texture** (UV unwrap + PBR maps)
4. **Animate** (Keyframes in Action Editor)
5. **Export** (FBX: -Z Forward, Y Up, Apply Scaling, Triangulate)
6. **Import** (Studio: Insert → Mesh → .fbx)
7. **Apply SurfaceAppearance** (Lua: ColorMap + NormalMap + Roughness + Metallic)

**Cost of automation (ForjeGames):**
- Blender CPU time: $0.01-0.05 per asset (depends on complexity)
- Open Cloud API: $0.005 per upload
- Total: $0.015-0.055 per asset to user

**Quality targets:**
- 7/10: Fully automated (works, needs tweaks)
- 8/10: Automated + 5-min manual fix (re-texture, delete bad geometry)
- 9/10: Automated + 15-min manual polish (add details, optimize)
- 10/10: Hand-crafted (not automated worth)

**Recommended focus:** Aim for 8/10 quality with 30-min iteration time. 9-10/10 has diminishing returns.

---

**Sources & References:**
- Blender Manual: docs.blender.org/manual/en/4.1/
- Roblox Studio Docs: developer.roblox.com/
- Den_S Roblox Plugin: blendermarket.com
- FBX Export Guide: fbx.autodesk.com (not great, but official)
- Community: Blender Discord, Roblox Dev Forum

