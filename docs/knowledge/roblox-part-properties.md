# Roblox Part Properties Complete Reference

Every property, valid value, and child object type for Roblox BasePart/Part instances.

## Part Shapes

Set via `Part.Shape` (Enum.PartType):

| Shape | Enum Value | Description |
|-------|-----------|-------------|
| Block | `Enum.PartType.Block` | Default rectangular prism |
| Ball | `Enum.PartType.Ball` | Sphere (Size.X used as diameter) |
| Cylinder | `Enum.PartType.Cylinder` | Cylinder along X axis (Size.Y = length, Size.X/Z = diameter) |
| Wedge | Use `WedgePart` class | Triangular prism |
| CornerWedge | Use `CornerWedgePart` class | Corner triangle |

## Size

- **Type:** `Vector3`
- **Min:** 0.05 studs per axis
- **Max:** 2048 studs per axis
- **Default:** `Vector3.new(4, 1.2, 2)`
- **Scale reference:** A Roblox character is ~5.3 studs tall

Common sizes:
- Door: `Vector3.new(4, 7.5, 0.5)`
- Window: `Vector3.new(3, 4, 0.2)`
- Wall segment: `Vector3.new(12, 11, 0.8)`
- Floor tile: `Vector3.new(12, 0.5, 12)`
- Street: `Vector3.new(27, 0.3, 60)`
- Ceiling height: 11 studs
- Light pole: base `Vector3.new(2, 0.5, 2)`, pole cylinder `Vector3.new(0.8, 14, 0.8)`

## CFrame (Position and Rotation)

- **Type:** `CFrame`
- **Description:** Combined position + rotation matrix

```lua
-- Position only
part.CFrame = CFrame.new(10, 5, 20)

-- Position + look at target
part.CFrame = CFrame.new(Vector3.new(10, 5, 20), Vector3.new(0, 5, 0))

-- Position + rotation (Euler angles in radians)
part.CFrame = CFrame.new(10, 5, 20) * CFrame.Angles(0, math.rad(45), 0)

-- Relative positioning
part.CFrame = CFrame.new(sp + Vector3.new(5, 0, 10))

-- Common rotations
CFrame.Angles(0, math.rad(90), 0)       -- 90 degrees around Y
CFrame.Angles(math.rad(45), 0, 0)       -- 45 degrees pitch
CFrame.Angles(0, 0, math.rad(90))       -- lay cylinder on side

-- Useful CFrame methods
part.CFrame:ToWorldSpace(CFrame.new(0, 5, 0))  -- offset in local space
part.CFrame.Position    -- extract Vector3 position
part.CFrame.LookVector  -- forward direction
part.CFrame.UpVector    -- up direction
part.CFrame.RightVector -- right direction
```

## Materials (All 37 Valid Enum.Material Values)

### Natural Materials
| Material | RGB Suggestion | Use For |
|----------|---------------|---------|
| `Grass` | `90, 140, 70` | Lawns, fields, terrain |
| `LeafyGrass` | `70, 120, 50` | Forests, bushes, hedges |
| `Sand` | `194, 178, 128` | Beaches, deserts |
| `Sandstone` | `180, 155, 110` | Pyramids, mesa, desert walls |
| `Rock` | `130, 125, 120` | Mountains, cliffs, terrain |
| `Granite` | `140, 135, 125` | Stone walls, castles, boulders |
| `Limestone` | `210, 200, 180` | Stucco, adobe, plaster |
| `Slate` | `75, 60, 50` | Roofs, shingles |
| `Mud` | `100, 75, 50` | Swamps, dirt paths |
| `Snow` | `240, 240, 245` | Winter terrain |
| `Ice` | `180, 220, 240` | Frozen lakes, arctic |
| `Glacier` | `160, 200, 230` | Icy mountains |
| `Salt` | `230, 225, 220` | Salt flats |
| `Basalt` | `60, 55, 50` | Volcanic rock |

### Construction Materials
| Material | RGB Suggestion | Use For |
|----------|---------------|---------|
| `Concrete` | `160, 160, 160` | Walls, foundations, stairs |
| `Brick` | `180, 100, 80` | Brick walls, fireplaces |
| `Cobblestone` | `130, 125, 115` | Medieval paths, villages |
| `Marble` | `230, 225, 220` | Temples, palaces, statues |
| `Asphalt` | `80, 80, 85` | Roads, driveways |
| `Pavement` | `150, 148, 145` | Sidewalks, curbs |
| `Pebble` | `145, 140, 130` | Gravel, trails |

### Wood Materials
| Material | RGB Suggestion | Use For |
|----------|---------------|---------|
| `Wood` | `139, 90, 43` | Furniture, doors, fences |
| `WoodPlanks` | `160, 120, 70` | Floors, decks, ship hulls |

### Metal Materials
| Material | RGB Suggestion | Use For |
|----------|---------------|---------|
| `Metal` | `100, 100, 105` | Pipes, rails, machines |
| `DiamondPlate` | `120, 120, 125` | Factory floors, industrial |
| `CorrodedMetal` | `130, 100, 70` | Rusty, abandoned, wrecks |
| `Foil` | `200, 200, 205` | Reflective thin surfaces |

### Special Materials
| Material | RGB Suggestion | Use For |
|----------|---------------|---------|
| `Glass` | `180, 210, 230` | Windows, skylights, light covers |
| `Neon` | `255, 255, 200` | Neon signs ONLY (not general lighting) |
| `Fabric` | `180, 160, 140` | Cushions, curtains, tents, flags |
| `CrackedLava` | `200, 80, 20` | Volcanic, lava flows |
| `ForceField` | `100, 180, 255` | Energy shields, barriers |
| `Plastic` | `200, 200, 200` | Generic (avoid — pick specific) |
| `SmoothPlastic` | N/A | **BANNED** — never use |

## Transparency

- **Type:** `number`
- **Range:** 0 (opaque) to 1 (invisible)
- **Common values:**
  - Glass windows: `0.3` to `0.5`
  - Water surface: `0.4`
  - Ghost/ethereal: `0.6` to `0.8`
  - Invisible barriers: `1.0`

## Reflectance

- **Type:** `number`
- **Range:** 0 (matte) to 1 (mirror)
- **Common values:**
  - Metal surfaces: `0.15` to `0.3`
  - Chrome: `0.5`
  - Water: `0.1`
  - Glass: `0.05`
  - Wood/stone: `0`

## Physics Properties

### Anchored
- **Type:** `boolean`
- **Default:** `false`
- **Use:** `true` for ALL static parts (buildings, terrain, decorations). Only `false` for parts that need to fall or move with physics.

### CanCollide
- **Type:** `boolean`
- **Default:** `true`
- **Use:** `false` for decorative overlays, kill bricks (sometimes), trigger zones, particles.

### Locked
- **Type:** `boolean`
- **Default:** `false`
- **Use:** `true` to prevent accidental selection in Studio.

### Massless
- **Type:** `boolean`
- **Use:** `true` for cosmetic parts welded to moving objects so they don't add mass.

### CanTouch
- **Type:** `boolean`
- **Default:** `true`
- **Use:** `false` to disable Touched events (performance optimization for decorative parts).

### CanQuery
- **Type:** `boolean`
- **Default:** `true`
- **Use:** `false` to exclude from raycasts (e.g., visual-only parts).

## Surface Types

- **Type:** `Enum.SurfaceType` for each face (TopSurface, BottomSurface, etc.)
- **Values:** `Smooth`, `Glue`, `Weld`, `Studs`, `Inlet`, `Universal`, `Hinge`, `Motor`, `SmoothNoOutlines`
- **Default:** Varies by face
- **Best practice:** Set `TopSurface = Smooth` and `BottomSurface = Smooth` to remove surface marks.

## Collision Fidelity

- **Type:** `Enum.CollisionFidelity`
- **Values:** `Default`, `Hull`, `Box`, `PreciseConvexDecomposition`
- **Best practice:** Use `Box` for simple parts (best performance), `Hull` for medium complexity, `PreciseConvexDecomposition` only when exact collision shape matters.

## CastShadow

- **Type:** `boolean`
- **Default:** `true`
- **Use:** Set `false` for very small parts (< 2 studs) to improve shadow rendering performance.

## Color

- **Type:** `Color3`
- **Set via:** `Color3.fromRGB(r, g, b)` where r, g, b are 0-255
- **Never use:** `BrickColor.new()` (deprecated)

```lua
part.Color = Color3.fromRGB(180, 150, 100)  -- warm stone
```

## Child Objects Reference

### Lighting

**PointLight** — omnidirectional light source:
```lua
local light = Instance.new("PointLight")
light.Brightness = 2          -- 0 to 10 (default 1)
light.Range = 30              -- 0 to 60 studs (default 8)
light.Color = Color3.fromRGB(255, 200, 130)  -- warm
light.Shadows = true          -- shadow casting
light.Parent = lampPart
```

**SpotLight** — directional cone light:
```lua
local spot = Instance.new("SpotLight")
spot.Brightness = 3           -- 0 to 10
spot.Range = 40               -- 0 to 60 studs
spot.Angle = 45               -- 0 to 180 degrees (cone width)
spot.Face = Enum.NormalId.Bottom  -- direction it points
spot.Color = Color3.fromRGB(255, 240, 200)
spot.Shadows = true
spot.Parent = ceilingPart
```

**SurfaceLight** — flat panel light:
```lua
local surface = Instance.new("SurfaceLight")
surface.Brightness = 2
surface.Range = 25
surface.Angle = 90
surface.Face = Enum.NormalId.Front
surface.Color = Color3.fromRGB(200, 220, 255)
surface.Parent = panelPart
```

### Effects

**Fire:**
```lua
local fire = Instance.new("Fire")
fire.Size = 5                 -- 2 to 30
fire.Heat = 10                -- 0 to 25 (rise speed)
fire.Color = Color3.fromRGB(255, 150, 50)
fire.SecondaryColor = Color3.fromRGB(200, 50, 0)
fire.Parent = torchPart
```

**Smoke:**
```lua
local smoke = Instance.new("Smoke")
smoke.Size = 3                -- 0.1 to 100
smoke.Opacity = 0.3           -- 0 to 1
smoke.RiseVelocity = 2        -- -25 to 25
smoke.Color = Color3.fromRGB(180, 180, 180)
smoke.Parent = chimneyPart
```

**Sparkles:**
```lua
local sparkles = Instance.new("Sparkles")
sparkles.SparkleColor = Color3.fromRGB(255, 215, 0)
sparkles.Parent = treasurePart
```

**ParticleEmitter:**
```lua
local pe = Instance.new("ParticleEmitter")
pe.Rate = 20                  -- particles per second
pe.Lifetime = NumberRange.new(1, 3)
pe.Speed = NumberRange.new(2, 5)
pe.Size = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 1),
  NumberSequenceKeypoint.new(1, 0),
})
pe.Color = ColorSequence.new(Color3.fromRGB(255, 200, 50))
pe.Parent = part
```

### Audio

**Sound:**
```lua
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://123456"
sound.Volume = 0.5            -- 0 to 10
sound.Looped = true
sound.RollOffMode = Enum.RollOffMode.Linear
sound.RollOffMaxDistance = 60  -- audible range in studs
sound.Parent = ambientPart
sound:Play()
```

### Decals and Textures

**Decal** (image on one face):
```lua
local decal = Instance.new("Decal")
decal.Texture = "rbxassetid://123456"
decal.Face = Enum.NormalId.Front
decal.Transparency = 0
decal.Parent = wallPart
```

**Texture** (repeating tiled image):
```lua
local tex = Instance.new("Texture")
tex.Texture = "rbxassetid://123456"
tex.Face = Enum.NormalId.Top
tex.StudsPerTileU = 4
tex.StudsPerTileV = 4
tex.Parent = floorPart
```

### GUI on Parts

**SurfaceGui:**
```lua
local sg = Instance.new("SurfaceGui")
sg.Face = Enum.NormalId.Front
sg.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
sg.PixelsPerStud = 50
sg.Parent = signPart

local label = Instance.new("TextLabel")
label.Size = UDim2.new(1, 0, 1, 0)
label.Text = "SHOP"
label.Font = Enum.Font.GothamBold
label.TextSize = 40
label.TextColor3 = Color3.new(1, 1, 1)
label.BackgroundTransparency = 1
label.Parent = sg
```

**BillboardGui** (always faces camera):
```lua
local bg = Instance.new("BillboardGui")
bg.Size = UDim2.new(4, 0, 1.5, 0)
bg.StudsOffset = Vector3.new(0, 3, 0)
bg.AlwaysOnTop = false
bg.Parent = npcPart

local nameLabel = Instance.new("TextLabel")
nameLabel.Size = UDim2.new(1, 0, 1, 0)
nameLabel.Text = "Shopkeeper"
nameLabel.Font = Enum.Font.GothamBold
nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
nameLabel.TextStrokeTransparency = 0.5
nameLabel.BackgroundTransparency = 1
nameLabel.Parent = bg
```

### Interaction

**ProximityPrompt:**
```lua
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"
prompt.ObjectText = "Treasure Chest"
prompt.MaxActivationDistance = 10
prompt.HoldDuration = 0        -- 0 for instant, > 0 for hold
prompt.KeyboardKeyCode = Enum.KeyCode.E
prompt.Parent = chestPart

prompt.Triggered:Connect(function(player: Player)
  -- Handle interaction
end)
```

**ClickDetector:**
```lua
local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = 15
cd.Parent = buttonPart

cd.MouseClick:Connect(function(player: Player)
  -- Handle click
end)
```

### Constraints (useful for moving parts)

**WeldConstraint:**
```lua
local weld = Instance.new("WeldConstraint")
weld.Part0 = basePart
weld.Part1 = attachedPart
weld.Parent = basePart
```

**Attachment + Trail:**
```lua
local a0 = Instance.new("Attachment")
a0.Position = Vector3.new(-1, 0, 0)
a0.Parent = part

local a1 = Instance.new("Attachment")
a1.Position = Vector3.new(1, 0, 0)
a1.Parent = part

local trail = Instance.new("Trail")
trail.Attachment0 = a0
trail.Attachment1 = a1
trail.Lifetime = 0.5
trail.Color = ColorSequence.new(Color3.fromRGB(255, 200, 50))
trail.Parent = part
```

## Property Setting Order (Best Practice)

When creating parts programmatically, set properties in this order:
1. `Name` — descriptive identifier
2. `Shape` — if not Block
3. `Size` — dimensions
4. `CFrame` — position and rotation
5. `Material` — surface appearance
6. `Color` — color via `Color3.fromRGB()`
7. `Transparency` — if needed
8. `Anchored` — always `true` for static parts
9. `CanCollide` — `false` for decorative/trigger parts
10. `CastShadow` — `false` for tiny parts
11. **Child objects** (lights, effects, GUI)
12. `Parent` — **ALWAYS LAST** (triggers replication)
