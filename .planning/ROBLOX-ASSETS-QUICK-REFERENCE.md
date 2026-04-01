# Roblox Assets Quick Reference Card 2026

## Native Part Types

| Type | Use | Default Size | Collision |
|---|---|---|---|
| **Block** | Walls, floors | 2×2×2 | Box |
| **Ball** | Spheres, heads | 2 radius | Sphere |
| **Cylinder** | Pillars, poles | 2 radius×2 height | Cylinder |
| **Wedge** | Roofs, ramps | 2×2×2 | Triangle |
| **CornerWedge** | Corner trim | 2×2×2 | Corner |
| **TrussPart** | Scaffolding | 2×2×2 | Lattice |

```lua
local wall = Instance.new("Part")
wall.Shape = Enum.PartType.Block
wall.Size = Vector3.new(10, 8, 0.5)
wall.Material = Enum.Material.Brick
wall.Parent = workspace
```

---

## MeshPart (Custom 3D)

```lua
local mesh = Instance.new("MeshPart")
mesh.MeshId = "rbxassetid://12345678"        -- Mesh asset ID
mesh.TextureID = "rbxassetid://87654321"     -- Texture asset ID
mesh.Size = Vector3.new(2, 3, 2)
mesh.Material = Enum.Material.Wood
mesh.CollisionFidelity = Enum.CollisionFidelity.ConvexHull
mesh.Parent = workspace
```

**Properties:**
- `MeshId`: Asset ID of 3D model
- `TextureID`: Asset ID of texture
- `Size`: Bounding box dimensions
- `Scale`: Mesh scale multiplier
- `CollisionFidelity`: Box | ConvexHull | Default | Precise

---

## 3D File Format Comparison

| Format | Size | Textures | Anims | Rigging | Roblox |
|---|---|---|---|---|---|
| **GLB** | Small | ✓ Embedded | ✓ | ✓ | ✓✓✓ BEST |
| **FBX** | Large | ✗ Ref | ✓ | ✓ | ✓✓ Good |
| **OBJ** | Medium | ✗ No | ✗ | ✗ | ✓ Static |
| **DAE** | Large | ✗ No | ✓ | ✓ | ✓ Legacy |

**Export Command (Blender):**
```
File → Export As → .glb
Settings: Triangulate Faces ✓, Apply Modifiers ✓, Include All Bone Influences ✓
```

---

## Polygon Count by Category

| Category | Safe for Mobile | Desktop OK | Unplayable |
|---|---|---|---|
| **Props/Furniture** | <8K | <15K | >30K |
| **Characters/NPCs** | <10K | <20K | >40K |
| **Buildings** | <15K | <30K | >60K |
| **Vehicles** | <18K | <35K | >70K |
| **Effects** | <2K | <5K | >10K |

**Check polygon count:**
- Blender: Bottom-right corner shows "Face: XXXXX"
- Roblox: Select MeshPart → Properties → Geometry section
- CLI: `gltf-transform inspect model.glb`

---

## Texture Specifications

| Property | Spec | Notes |
|---|---|---|
| **Format** | PNG > JPEG | Lossless preferred |
| **Resolution** | 1024×1024 | Range: 512-2048 |
| **Color Space** | sRGB | Not Linear RGB |
| **File Size** | <10 MB | Individual texture |
| **Alpha Channel** | PNG alpha | Transparency OK |

**PBR Texture Stack:**
```
ColorMap (Albedo)      → rbxassetid://111111
NormalMap (Detail)     → rbxassetid://222222
RoughnessMap (Finish)  → rbxassetid://333333
MetallicMap (Metal)    → rbxassetid://444444
```

Apply in Studio:
```lua
local appearance = Instance.new("SurfaceAppearance")
appearance.ColorMap = "rbxassetid://111111"
appearance.NormalMap = "rbxassetid://222222"
appearance.RoughnessMap = "rbxassetid://333333"
appearance.MetallicMap = "rbxassetid://444444"
appearance.Parent = meshPart
```

---

## Asset Upload to Roblox

**Step 1: Generate Asset**
- Meshy v3 (3D): $0.07-0.60 per model → .glb
- Fal Flux (texture): $0.22 per texture → PNG 1024×1024
- ElevenLabs (audio): $0.08-0.30 per item → MP3

**Step 2: Upload via Creator Hub**
1. https://create.roblox.com/dashboard/assets
2. Click "Upload Asset"
3. Select file (.glb, .png, .mp3)
4. Fill name + description
5. Submit

**Step 3: Wait Moderation**
- Status: PENDING → 24-48 hours
- Result: APPROVED or REJECTED
- Check status: Creator Hub dashboard

**Step 4: Get Asset ID**
- Format: `rbxassetid://[NUMBER]`
- Example: `rbxassetid://12345678`

**Step 5: Create MeshPart**
```lua
local mesh = Instance.new("MeshPart")
mesh.MeshId = "rbxassetid://12345678"
mesh.TextureID = "rbxassetid://87654321"
mesh.Parent = workspace
```

---

## Batch Upload (Node.js)

```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const uploadMesh = async (filePath, assetName, accessToken) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('name', assetName);
  form.append('description', `AI-generated: ${assetName}`);

  const response = await axios.post(
    'https://apis.roblox.com/assets/v1/assets',
    form,
    { headers: { 'Authorization': `Bearer ${accessToken}`, ...form.getHeaders() } }
  );

  return response.data.assetId;
};

// Usage:
(async () => {
  const meshId = await uploadMesh('./chair.glb', 'WoodenChair', process.env.ROBLOX_TOKEN);
  console.log(`Asset ID: ${meshId}`);
})();
```

---

## Creator Marketplace Assets

**Load asset by ID:**
```lua
local InsertService = game:GetService("InsertService")
local model = InsertService:LoadAsset(12345678)
model.Parent = workspace
```

**Get thumbnail:**
```lua
local AssetService = game:GetService("AssetService")
local thumbnail = AssetService:GetAssetThumbnail({
  Asset = "rbxassetid://12345678",
  Size = Enum.ThumbnailSize.Size420x420,
  Format = Enum.ThumbnailFormat.Png
})
```

---

## Asset Categories (100+ Items)

| Category | Count | Typical | Cost |
|---|---|---|---|
| **Buildings** | 20+ | 20×15×15 studs, 200-300 parts | $0.30-2.00 |
| **Terrain** | 30+ | Trees, rocks, water | $0.15-1.00 |
| **Vehicles** | 25+ | 5×3×10 studs, 15-25K poly | $0.60-2.00 |
| **Characters** | 20+ | 2×5×1 studs, 8-12K poly | $0.50-2.00 |
| **Furniture** | 25+ | 2-4×1-2×2-4 studs, 4-8K poly | $0.20-1.00 |
| **Weapons** | 20+ | 0.5×2×0.1 studs, 2-6K poly | $0.10-0.50 |
| **Effects** | 15+ | Particles, trails, UI | $0.05-0.30 |
| **Environment** | 20+ | Lamps, signs, benches | $0.10-0.50 |

---

## Cost & Timeline Summary

| Task | Tool | Cost | Time |
|---|---|---|---|
| Generate 3D model | Meshy v3 | $0.20 | 2-10 min |
| Generate texture | Fal Flux | $0.22 | 10 sec |
| Generate SFX | ElevenLabs | $0.08 | 5 sec |
| Upload to Roblox | Creator Hub | $0 | 1 min |
| Moderation wait | Roblox | $0 | 24-48 hr |
| Create MeshPart | Lua/API | $0 | 30 sec |
| **Total per asset** | — | **~$0.50-1.00** | **30s-2 days** |
| **100-asset game** | — | **~$50-100** | — |

---

## Quick Checklist: Asset Generation

```
PRE-GENERATION
☐ Decide category (building, vehicle, furniture, etc.)
☐ Check scale requirements (2 studs = character width)
☐ Determine polygon budget (<30K mobile, <50K desktop)
☐ Plan texture style (PBR recommended)

GENERATION
☐ Generate 3D with Meshy (target_polycount=15000)
☐ Generate texture with Fal (1024×1024)
☐ Export mesh as .glb
☐ Validate polygon count

UPLOAD
☐ Upload .glb to Roblox Creator Hub
☐ Upload texture to Roblox Creator Hub
☐ Wait 24-48h for moderation
☐ Check approval status

DEPLOYMENT
☐ Get Asset IDs (rbxassetid://...)
☐ Create MeshPart instances
☐ Apply textures (MeshId + TextureID)
☐ Set collision fidelity
☐ Position in world
☐ Test on mobile device
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| Mesh invisible | Scale wrong or camera inside | Set Size property (1-10 studs), move away |
| Texture not showing | Still moderation or wrong ID | Check status = APPROVED, use correct rbxassetid:// |
| Game stuttering | Too many polygons | Regenerate with <15K poly |
| Collision broken | ConvexHull poor fit | Use Box collisions for buildings |
| Upload fails | File >100MB | Decimate mesh or split into parts |

---

**Last Updated:** 2026-03-29 | **For:** Asset generation system, AI prompting, studio automation
