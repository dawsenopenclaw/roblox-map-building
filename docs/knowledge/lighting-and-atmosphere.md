# Roblox Lighting and Atmosphere Reference

Complete reference for the Lighting service, atmosphere objects, and post-processing effects.

## Lighting Service Properties

The `Lighting` service (`game:GetService("Lighting")`) controls the global light environment.

### Core Properties

| Property | Type | Range | Default | Description |
|----------|------|-------|---------|-------------|
| `Ambient` | `Color3` | RGB 0-255 | `127,127,127` | Shadow fill color (indirect light) |
| `OutdoorAmbient` | `Color3` | RGB 0-255 | `127,127,127` | Outdoor shadow fill |
| `Brightness` | `number` | 0-10 | 2 | Overall sun brightness |
| `ClockTime` | `number` | 0-24 | 14 | Time of day (hours) |
| `GeographicLatitude` | `number` | -90 to 90 | 41.7 | Sun angle latitude |
| `ColorShift_Bottom` | `Color3` | | `0,0,0` | Color tint for bottom faces |
| `ColorShift_Top` | `Color3` | | `0,0,0` | Color tint for top faces |
| `EnvironmentDiffuseScale` | `number` | 0-1 | 0 | Skybox diffuse contribution |
| `EnvironmentSpecularScale` | `number` | 0-1 | 0 | Skybox specular reflections |
| `GlobalShadows` | `boolean` | | true | Enable shadow casting |
| `Technology` | `Enum.Technology` | | ShadowMap | Rendering mode |
| `ExposureCompensation` | `number` | -5 to 5 | 0 | Camera exposure adjustment |

### ClockTime Reference

| ClockTime | Description |
|-----------|-------------|
| 0 | Midnight (darkest) |
| 5 | Pre-dawn (very dark blue sky) |
| 6.5 | Sunrise (warm orange horizon) |
| 7 | Early morning (golden light) |
| 9 | Morning (bright, soft shadows) |
| 12 | Noon (harsh overhead light) |
| 14 | Afternoon (default, warm) |
| 16 | Golden hour (warm, long shadows) |
| 18 | Sunset (orange/pink sky) |
| 19.5 | Dusk (purple/blue tones) |
| 21 | Night (dark, moonlit) |
| 23 | Late night (very dark) |

### Technology Modes

| Mode | Description |
|------|-------------|
| `Enum.Technology.Future` | Best quality shadows and lighting |
| `Enum.Technology.ShadowMap` | Good quality, better performance |
| `Enum.Technology.Voxel` | Legacy volumetric lighting |
| `Enum.Technology.Compatibility` | Lowest quality, best performance |

## Atmosphere Object

Parent to `Lighting`. Controls fog, haze, and sky color.

```lua
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.3          -- 0 to 1 (fog thickness; 0 = clear, 1 = pea soup)
atmo.Offset = 0              -- 0 to 1 (fog start distance; 0 = at camera, 1 = far away)
atmo.Color = Color3.fromRGB(200, 210, 230)   -- fog color
atmo.Decay = Color3.fromRGB(110, 120, 140)   -- color at horizon
atmo.Glare = 0.1             -- 0 to 1 (sun glare intensity)
atmo.Haze = 1.5              -- 0 to 10 (atmospheric haze)
atmo.Parent = game:GetService("Lighting")
```

## Post-Processing Effects

All parented to `Lighting`.

### BloomEffect

Makes bright surfaces glow softly.

```lua
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.3         -- 0 to 1 (glow strength)
bloom.Size = 28               -- 0 to 56 (blur kernel size)
bloom.Threshold = 0.92        -- 0 to 1 (brightness cutoff for glow)
bloom.Parent = game:GetService("Lighting")
```

- `Intensity 0.1-0.3` = subtle warm glow (recommended)
- `Intensity 0.5-0.8` = dreamy/ethereal look
- `Intensity 1.0` = blinding overexposure (avoid)

### ColorCorrectionEffect

Global color grading.

```lua
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.03         -- -1 to 1 (exposure)
cc.Contrast = 0.08           -- -1 to 1 (contrast)
cc.Saturation = 0.1          -- -1 to 1 (color intensity)
cc.TintColor = Color3.fromRGB(255, 248, 240)  -- global tint
cc.Parent = game:GetService("Lighting")
```

### SunRaysEffect

God rays from the sun.

```lua
local rays = Instance.new("SunRaysEffect")
rays.Intensity = 0.06        -- 0 to 1 (ray brightness)
rays.Spread = 0.8            -- 0 to 1 (ray spread angle)
rays.Parent = game:GetService("Lighting")
```

### DepthOfFieldEffect

Blurs background or foreground.

```lua
local dof = Instance.new("DepthOfFieldEffect")
dof.FarIntensity = 0.3       -- 0 to 1 (background blur)
dof.FocusDistance = 50        -- studs from camera to focus point
dof.InFocusRadius = 30       -- studs of sharp focus range
dof.NearIntensity = 0        -- 0 to 1 (foreground blur)
dof.Parent = game:GetService("Lighting")
```

### BlurEffect

Global uniform blur (for menus/pauses).

```lua
local blur = Instance.new("BlurEffect")
blur.Size = 10                -- 0 to 56 (blur amount)
blur.Parent = game:GetService("Lighting")
```

## Light Instances (Parented to Parts)

### PointLight

Omnidirectional light source. Parent to any Part that should emit light.

```lua
local light = Instance.new("PointLight")
light.Brightness = 2          -- 0 to 10
light.Range = 30              -- 0 to 60 studs
light.Color = Color3.fromRGB(255, 200, 130)  -- warm amber
light.Shadows = true
light.Parent = lampPart
```

| Use Case | Brightness | Range | Color RGB |
|----------|-----------|-------|-----------|
| Candle | 0.5-1 | 8-12 | 255, 170, 80 |
| Table lamp | 1-2 | 15-25 | 255, 220, 170 |
| Lantern | 2-3 | 20-35 | 255, 200, 130 |
| Street lamp | 2-4 | 30-45 | 255, 230, 190 |
| Torch/Fire | 2-3 | 25-35 | 255, 150, 50 |
| Neon sign | 1-2 | 10-20 | varies |
| Cool LED | 1-2 | 15-25 | 200, 220, 255 |
| Eerie glow | 0.5-1 | 15-25 | 100, 255, 100 |
| Warning light | 3-5 | 20-30 | 255, 50, 50 |

### SpotLight

Directional cone light. Same properties as PointLight plus:

```lua
local spot = Instance.new("SpotLight")
spot.Brightness = 3
spot.Range = 40
spot.Color = Color3.fromRGB(255, 240, 200)
spot.Angle = 45               -- 0 to 180 degrees (cone width)
spot.Face = Enum.NormalId.Bottom  -- which face the light shines from
spot.Shadows = true
spot.Parent = ceilingPart
```

| Face Value | Direction |
|-----------|-----------|
| `Enum.NormalId.Top` | Upward |
| `Enum.NormalId.Bottom` | Downward |
| `Enum.NormalId.Front` | Forward (-Z) |
| `Enum.NormalId.Back` | Backward (+Z) |
| `Enum.NormalId.Left` | Left (-X) |
| `Enum.NormalId.Right` | Right (+X) |

### SurfaceLight

Flat panel of light from a face. Same properties as SpotLight.

```lua
local surface = Instance.new("SurfaceLight")
surface.Brightness = 2
surface.Range = 25
surface.Angle = 90
surface.Face = Enum.NormalId.Front
surface.Color = Color3.fromRGB(200, 220, 255)
surface.Parent = screenPart
```

## Lighting Presets

### 1. Daytime Outdoor (Bright, Natural)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 14
L.Brightness = 2.5
L.Ambient = Color3.fromRGB(140, 140, 140)
L.OutdoorAmbient = Color3.fromRGB(150, 150, 150)
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 0.5
L.EnvironmentSpecularScale = 0.5
L.GlobalShadows = true

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.25
atmo.Offset = 0.25
atmo.Color = Color3.fromRGB(200, 215, 240)
atmo.Decay = Color3.fromRGB(120, 130, 150)
atmo.Glare = 0.1
atmo.Haze = 1.2
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.2
bloom.Size = 24
bloom.Threshold = 0.9
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.02
cc.Contrast = 0.05
cc.Saturation = 0.15
cc.TintColor = Color3.fromRGB(255, 250, 245)
cc.Parent = L

local rays = Instance.new("SunRaysEffect")
rays.Intensity = 0.05
rays.Spread = 0.7
rays.Parent = L
```

### 2. Nighttime Spooky (Dark, Eerie)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 0.5
L.Brightness = 0.5
L.Ambient = Color3.fromRGB(30, 25, 40)
L.OutdoorAmbient = Color3.fromRGB(20, 15, 35)
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 0.2
L.EnvironmentSpecularScale = 0.1
L.GlobalShadows = true
L.ExposureCompensation = -0.5

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.45
atmo.Offset = 0
atmo.Color = Color3.fromRGB(40, 30, 60)
atmo.Decay = Color3.fromRGB(20, 15, 30)
atmo.Glare = 0
atmo.Haze = 3
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.15
bloom.Size = 30
bloom.Threshold = 0.85
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = -0.08
cc.Contrast = 0.15
cc.Saturation = -0.3
cc.TintColor = Color3.fromRGB(180, 170, 220)
cc.Parent = L
```

### 3. Underwater (Deep Blue, Murky)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 12
L.Brightness = 0.8
L.Ambient = Color3.fromRGB(20, 60, 100)
L.OutdoorAmbient = Color3.fromRGB(30, 70, 110)
L.Technology = Enum.Technology.Future
L.GlobalShadows = true
L.ExposureCompensation = -0.3

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.6
atmo.Offset = 0
atmo.Color = Color3.fromRGB(20, 80, 140)
atmo.Decay = Color3.fromRGB(10, 40, 80)
atmo.Glare = 0
atmo.Haze = 6
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.25
bloom.Size = 36
bloom.Threshold = 0.8
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = -0.05
cc.Contrast = 0.1
cc.Saturation = -0.2
cc.TintColor = Color3.fromRGB(140, 200, 255)
cc.Parent = L
```

### 4. Sunset / Golden Hour (Warm, Dramatic)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 17.5
L.Brightness = 2
L.Ambient = Color3.fromRGB(160, 120, 80)
L.OutdoorAmbient = Color3.fromRGB(170, 130, 90)
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 0.6
L.EnvironmentSpecularScale = 0.4
L.GlobalShadows = true
L.GeographicLatitude = 30

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.35
atmo.Offset = 0.1
atmo.Color = Color3.fromRGB(255, 180, 100)
atmo.Decay = Color3.fromRGB(200, 100, 50)
atmo.Glare = 0.3
atmo.Haze = 2
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.4
bloom.Size = 32
bloom.Threshold = 0.85
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.05
cc.Contrast = 0.1
cc.Saturation = 0.2
cc.TintColor = Color3.fromRGB(255, 230, 200)
cc.Parent = L

local rays = Instance.new("SunRaysEffect")
rays.Intensity = 0.15
rays.Spread = 1
rays.Parent = L
```

### 5. Neon City (Cyberpunk, Night)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 22
L.Brightness = 0.3
L.Ambient = Color3.fromRGB(15, 10, 25)
L.OutdoorAmbient = Color3.fromRGB(10, 5, 20)
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 0.3
L.EnvironmentSpecularScale = 0.6
L.GlobalShadows = true
L.ExposureCompensation = -0.2

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.4
atmo.Offset = 0
atmo.Color = Color3.fromRGB(30, 15, 50)
atmo.Decay = Color3.fromRGB(15, 5, 30)
atmo.Glare = 0.05
atmo.Haze = 4
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.6
bloom.Size = 40
bloom.Threshold = 0.75
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.02
cc.Contrast = 0.2
cc.Saturation = 0.3
cc.TintColor = Color3.fromRGB(220, 200, 255)
cc.Parent = L
```

### 6. Cozy Interior (Warm, Inviting)

```lua
local L = game:GetService("Lighting")
L.ClockTime = 20
L.Brightness = 0.5
L.Ambient = Color3.fromRGB(80, 60, 40)
L.OutdoorAmbient = Color3.fromRGB(40, 30, 25)
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 0.3
L.EnvironmentSpecularScale = 0.2
L.GlobalShadows = true

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.2
atmo.Offset = 0.5
atmo.Color = Color3.fromRGB(180, 150, 120)
atmo.Decay = Color3.fromRGB(100, 80, 60)
atmo.Glare = 0
atmo.Haze = 0.5
atmo.Parent = L

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.35
bloom.Size = 30
bloom.Threshold = 0.82
bloom.Parent = L

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.03
cc.Contrast = 0.06
cc.Saturation = 0.05
cc.TintColor = Color3.fromRGB(255, 235, 210)
cc.Parent = L
```

**Interior light sources to pair with this preset:**
- Ceiling fixtures: SpotLight, Brightness 2, Range 20, Face Bottom, Color 255,220,170
- Table lamps: PointLight, Brightness 1.5, Range 15, Color 255,200,140
- Fireplace: PointLight, Brightness 3, Range 30, Color 255,150,50 + Fire instance
- Candles: PointLight, Brightness 0.8, Range 10, Color 255,170,80

## Lighting Quick-Reference for AI Builds

**Every build gets lighting. Pick the preset that matches the mood:**
- Happy outdoor scene → Daytime preset (ClockTime 14)
- Horror/spooky → Nighttime Spooky preset (ClockTime 0.5)
- Ocean/underwater → Underwater preset (blue fog, low brightness)
- Romantic/dramatic → Sunset preset (ClockTime 17.5)
- Sci-fi/cyberpunk → Neon City preset (ClockTime 22, high bloom)
- Cafe/home/tavern → Cozy Interior preset (ClockTime 20, warm tint)

**Critical rules:**
1. NEVER skip lighting — every build must set Lighting properties
2. ALWAYS add Atmosphere — even Density 0.2 adds realism
3. ALWAYS add BloomEffect with Intensity under 0.4 — subtle glow
4. Use ColorCorrectionEffect to unify the mood — slight warm/cool tint
5. SunRays only for outdoor scenes — skip for interiors/underground
6. Technology should ALWAYS be `Enum.Technology.Future` for best shadows
7. Interior builds need PointLight/SpotLight on every fixture — ambient Lighting alone makes interiors dark and flat
8. Match PointLight color to the mood — warm (255,200,130) for cozy, cool (200,220,255) for sci-fi
