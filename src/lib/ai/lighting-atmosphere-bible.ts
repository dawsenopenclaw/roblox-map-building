// lighting-atmosphere-bible.ts
// Comprehensive Roblox lighting, atmosphere, sky, and post-processing knowledge base.
// ALL properties are real Roblox API. No SmoothPlastic. Colors as RGB triplets.

export const LIGHT_PRESETS: string = `
=== ROBLOX LIGHTING SERVICE — COMPLETE PROPERTY REFERENCE ===

SERVICE: game.Lighting
All properties listed below are real and settable via script or Studio.

--- Core Properties ---
Ambient: Color3.fromRGB(r, g, b)
  The color of shadows and ambient light in the scene. Affects dark areas.
  Default: Color3.fromRGB(127, 127, 127)
  Low values = deep dark shadows. High values = washed-out flat lighting.
  Example dawn: Color3.fromRGB(80, 60, 90)
  Example noon: Color3.fromRGB(120, 120, 120)
  Example night: Color3.fromRGB(20, 20, 40)

Brightness: number (0 to 10+)
  Overall scene brightness multiplier. Affects sun and sky illumination.
  Default: 2
  Bright noon: 4 to 6
  Overcast: 1 to 1.5
  Night: 0.1 to 0.5
  Dungeon/interior (no sky): 0

ClockTime: number (0 to 24)
  Time of day controlling sun position and default sky color.
  0 = midnight, 6 = sunrise, 12 = noon, 18 = sunset, 24 = midnight
  Fractional values allowed: 6.5 = 6:30 AM
  Controls sun/moon arc automatically when Technology = Voxel or ShadowMap.

ColorShift_Bottom: Color3.fromRGB(r, g, b)
  Tint applied to surfaces facing downward (ground-facing).
  Use to add bounce light color or ground reflection color.
  Example warm ground bounce: Color3.fromRGB(60, 40, 20)
  Example cool shadow floor: Color3.fromRGB(20, 30, 50)
  Default: Color3.fromRGB(0, 0, 0)

ColorShift_Top: Color3.fromRGB(r, g, b)
  Tint applied to surfaces facing upward (sky-facing).
  Adds sky color influence to top faces.
  Example blue sky tint: Color3.fromRGB(10, 20, 40)
  Example golden hour top: Color3.fromRGB(40, 25, 5)
  Default: Color3.fromRGB(0, 0, 0)

EnvironmentDiffuseScale: number (0 to 1)
  Controls how much environment light (IBL diffuse) affects surfaces.
  Requires Technology = Future for full effect.
  0 = no environment diffuse, 1 = full environment diffuse.
  Outdoor realistic: 0.8 to 1.0
  Indoor dim: 0.2 to 0.4

EnvironmentSpecularScale: number (0 to 1)
  Controls environment reflections (IBL specular) on surfaces.
  Requires Technology = Future.
  0 = no reflections, 1 = full reflections.
  Shiny sci-fi: 1.0
  Matte outdoor: 0.3 to 0.5

ExposureCompensation: number (-5 to 5)
  EV (exposure value) adjustment. Positive = brighter, negative = darker.
  0 = no adjustment.
  HDR bright scenes: -1 to -2
  Dark moody scenes: +1 to +2
  Cinematic underexposed: -0.5

GeographicLatitude: number (-90 to 90)
  Latitude affecting sun arc path. 0 = equator, 90 = north pole.
  Equatorial: 0 (sun passes directly overhead)
  Northern Europe: 50 to 60
  Tropical game: 10 to 20
  Does not change ClockTime; changes the sun arc height.

GlobalShadows: boolean
  true = dynamic shadows cast by sun/moon. false = no shadows.
  Always true for realistic scenes. false for retro/flat look.

OutdoorAmbient: Color3.fromRGB(r, g, b)
  Ambient color applied specifically to outdoor areas (not enclosed spaces).
  Works with ShadowMap and Future technology.
  Bright day: Color3.fromRGB(120, 130, 140)
  Dusk: Color3.fromRGB(90, 60, 70)
  Night: Color3.fromRGB(15, 20, 40)
  Overcast: Color3.fromRGB(100, 105, 110)

Technology: Enum.Technology
  Enum.Technology.Voxel — Legacy. Fast, low quality. Chunky shadows. Supports all devices.
  Enum.Technology.Compatibility — Legacy fallback mode, similar to Voxel.
  Enum.Technology.ShadowMap — Modern. Sharp dynamic shadows from sun. Good performance.
  Enum.Technology.Future — Highest quality. IBL, reflections, accurate lighting. Higher GPU cost.
  Recommended for most games: Enum.Technology.ShadowMap
  Recommended for showcase/premium: Enum.Technology.Future

FogColor: Color3.fromRGB(r, g, b)
  Color of distance fog. Used with FogStart and FogEnd.
  NOTE: For atmospheric fog prefer the Atmosphere object (more realistic).
  FogColor dawn: Color3.fromRGB(220, 180, 160)
  FogColor night: Color3.fromRGB(10, 10, 25)

FogEnd: number (studs)
  Distance at which fog is fully opaque. Default 100000.
  Dense fog: 200 to 500
  Light haze: 2000 to 5000
  No fog visible: 100000+

FogStart: number (studs)
  Distance at which fog begins. Default 0.
  Typical: 0 to 500

ShadowSoftness: number (0 to 1)
  Softness of shadow edges. Requires ShadowMap or Future.
  0 = hard sharp shadows (noon sun), 1 = very soft diffuse shadows.
  Recommended: 0.2 to 0.5

--- Lighting Service Script Example ---
local Lighting = game:GetService("Lighting")
Lighting.Technology = Enum.Technology.ShadowMap
Lighting.Brightness = 3
Lighting.Ambient = Color3.fromRGB(100, 100, 120)
Lighting.OutdoorAmbient = Color3.fromRGB(110, 120, 130)
Lighting.ClockTime = 14
Lighting.ColorShift_Top = Color3.fromRGB(10, 15, 30)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 15, 5)
Lighting.EnvironmentDiffuseScale = 0.8
Lighting.EnvironmentSpecularScale = 0.5
Lighting.ExposureCompensation = 0
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.3
`;

export const LIGHT_ATMOSPHERE: string = `
=== ATMOSPHERE OBJECT — COMPLETE PROPERTY REFERENCE ===

LOCATION: game.Lighting.Atmosphere (Instance of class Atmosphere)
Create via: Instance.new("Atmosphere", game.Lighting)
Requires Technology = ShadowMap or Future for full effect.

--- All Properties ---

Density: number (0 to 1)
  How thick the atmosphere is. Controls how quickly objects fade to sky color at distance.
  0 = crystal clear, no haze. 1 = extremely thick fog.
  Clear day: 0.1 to 0.2
  Hazy summer: 0.3 to 0.4
  Heavy fog: 0.5 to 0.7
  Pea soup fog: 0.8 to 1.0
  Outer space: 0 (no atmosphere)

Offset: number (0 to 1)
  Controls where atmosphere effect starts relative to horizon.
  0 = atmospheric haze starts at ground level.
  1 = haze pushed up, affects sky more than ground.
  Typical ground fog: 0 to 0.1
  Sky haze: 0.4 to 0.6
  Default: 0

Color: Color3.fromRGB(r, g, b)
  The primary color of the atmosphere haze at the horizon.
  Clear blue sky: Color3.fromRGB(199, 219, 242)
  Sunset orange horizon: Color3.fromRGB(255, 160, 90)
  Foggy gray: Color3.fromRGB(180, 185, 190)
  Dawn pink: Color3.fromRGB(240, 180, 170)
  Night blue haze: Color3.fromRGB(40, 50, 80)
  Volcanic sulfur: Color3.fromRGB(160, 120, 40)
  Underwater: Color3.fromRGB(20, 100, 140)
  Alien green: Color3.fromRGB(80, 160, 60)

Decay: Color3.fromRGB(r, g, b)
  Color atmosphere fades to at the top of the sky (zenith).
  Creates gradient from horizon Color to zenith Decay.
  Clear blue zenith: Color3.fromRGB(80, 120, 200)
  Night zenith: Color3.fromRGB(5, 5, 20)
  Dawn zenith: Color3.fromRGB(120, 100, 180)
  Sunset zenith: Color3.fromRGB(50, 60, 140)
  Overcast white: Color3.fromRGB(200, 205, 210)

Glare: number (0 to 1)
  Sun glare intensity around the sun disc.
  0 = no glare. 1 = maximum corona/halo around sun.
  Realistic day: 0.1 to 0.3
  Harsh desert: 0.4 to 0.6
  Fantasy magic sun: 0.7 to 1.0
  Night (no sun visible): 0

Haze: number (0 to 1)
  Scattering of sunlight through atmosphere (Rayleigh-like scatter glow).
  Controls how much the sun blooms into surrounding sky.
  0 = crisp sharp horizon. 1 = very hazy white glow near sun.
  Clear morning: 0.0 to 0.1
  Summer haze: 0.3 to 0.5
  Desert mirage: 0.5 to 0.7
  Industrial smog: 0.6 to 0.8

--- Atmosphere Script Example ---
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.3
atmo.Offset = 0.05
atmo.Color = Color3.fromRGB(199, 219, 242)
atmo.Decay = Color3.fromRGB(80, 120, 200)
atmo.Glare = 0.2
atmo.Haze = 0.2
atmo.Parent = game.Lighting

--- Material Interaction Notes ---
Atmosphere interacts with material surface colors:
- SmoothPlastic banned — use Concrete, Wood, Brick, Metal, Grass, Sand, Ice, Rock, Cobblestone, Ground, Fabric, Cardboard, WoodPlanks, Marble, Granite, Pebble, Basalt, CrackedLava, Glacier, LeafyGrass, Salt, Sandstone, SlateTile, Limestone
- Dark materials (Metal, Basalt, CrackedLava) show atmosphere glow on edges at sunset
- Light materials (Sand, Ice, Glacier, Salt) reflect atmosphere color strongly
- Concrete and Brick absorb ambient color naturally
`;

export const LIGHT_TIME_OF_DAY: string = `
=== TIME OF DAY PRESETS — COMPLETE LIGHTING + ATMOSPHERE + SKY ===

Each preset includes all Lighting, Atmosphere, Sky, and PostProcessing values.
Apply in order: Lighting first, then Atmosphere, then Sky, then PostProcessing effects.

--- PRESET: MIDNIGHT (00:00) ---
Lighting.ClockTime = 0
Lighting.Brightness = 0.05
Lighting.Ambient = Color3.fromRGB(10, 10, 30)
Lighting.OutdoorAmbient = Color3.fromRGB(8, 10, 25)
Lighting.ColorShift_Top = Color3.fromRGB(5, 5, 20)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 10)
Lighting.EnvironmentDiffuseScale = 0.1
Lighting.EnvironmentSpecularScale = 0.05
Lighting.ExposureCompensation = 1.5
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.8
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.15
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(15, 20, 50)
Atmosphere.Decay = Color3.fromRGB(5, 5, 20)
Atmosphere.Glare = 0
Atmosphere.Haze = 0
Sky.StarCount = 5000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = -0.05
PostProcess.ColorCorrection.Contrast = 0.1
PostProcess.ColorCorrection.Saturation = -0.2
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(180, 190, 255)
PostProcess.Bloom.Intensity = 0.3
PostProcess.Bloom.Size = 24
PostProcess.Bloom.Threshold = 0.9

--- PRESET: DAWN (04:30) ---
Lighting.ClockTime = 4.5
Lighting.Brightness = 0.5
Lighting.Ambient = Color3.fromRGB(60, 40, 70)
Lighting.OutdoorAmbient = Color3.fromRGB(70, 50, 80)
Lighting.ColorShift_Top = Color3.fromRGB(30, 15, 40)
Lighting.ColorShift_Bottom = Color3.fromRGB(40, 20, 10)
Lighting.EnvironmentDiffuseScale = 0.3
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 0.8
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.6
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.35
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(220, 140, 130)
Atmosphere.Decay = Color3.fromRGB(100, 80, 150)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.3
Sky.StarCount = 1000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.05
PostProcess.ColorCorrection.Contrast = 0.05
PostProcess.ColorCorrection.Saturation = 0.1
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 220, 200)
PostProcess.Bloom.Intensity = 0.6
PostProcess.Bloom.Size = 30
PostProcess.Bloom.Threshold = 0.85

--- PRESET: EARLY MORNING (06:30) ---
Lighting.ClockTime = 6.5
Lighting.Brightness = 1.5
Lighting.Ambient = Color3.fromRGB(110, 90, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(120, 100, 110)
Lighting.ColorShift_Top = Color3.fromRGB(20, 15, 30)
Lighting.ColorShift_Bottom = Color3.fromRGB(50, 35, 15)
Lighting.EnvironmentDiffuseScale = 0.6
Lighting.EnvironmentSpecularScale = 0.3
Lighting.ExposureCompensation = 0.3
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.28
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(255, 200, 150)
Atmosphere.Decay = Color3.fromRGB(120, 140, 200)
Atmosphere.Glare = 0.15
Atmosphere.Haze = 0.4
Sky.StarCount = 100
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.08
PostProcess.ColorCorrection.Contrast = 0.05
PostProcess.ColorCorrection.Saturation = 0.2
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 240, 220)
PostProcess.Bloom.Intensity = 0.5
PostProcess.Bloom.Size = 26
PostProcess.Bloom.Threshold = 0.88
PostProcess.SunRays.Intensity = 0.2
PostProcess.SunRays.Spread = 0.5

--- PRESET: MORNING (09:00) ---
Lighting.ClockTime = 9
Lighting.Brightness = 3
Lighting.Ambient = Color3.fromRGB(130, 130, 140)
Lighting.OutdoorAmbient = Color3.fromRGB(140, 140, 150)
Lighting.ColorShift_Top = Color3.fromRGB(10, 12, 25)
Lighting.ColorShift_Bottom = Color3.fromRGB(30, 20, 8)
Lighting.EnvironmentDiffuseScale = 0.8
Lighting.EnvironmentSpecularScale = 0.5
Lighting.ExposureCompensation = 0.0
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.3
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.2
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(199, 219, 242)
Atmosphere.Decay = Color3.fromRGB(90, 130, 210)
Atmosphere.Glare = 0.1
Atmosphere.Haze = 0.2
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.0
PostProcess.ColorCorrection.Contrast = 0.05
PostProcess.ColorCorrection.Saturation = 0.1
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
PostProcess.Bloom.Intensity = 0.3
PostProcess.Bloom.Size = 24
PostProcess.Bloom.Threshold = 0.9
PostProcess.SunRays.Intensity = 0.1
PostProcess.SunRays.Spread = 0.4

--- PRESET: NOON (12:00) ---
Lighting.ClockTime = 12
Lighting.Brightness = 5
Lighting.Ambient = Color3.fromRGB(120, 125, 130)
Lighting.OutdoorAmbient = Color3.fromRGB(130, 135, 140)
Lighting.ColorShift_Top = Color3.fromRGB(5, 8, 20)
Lighting.ColorShift_Bottom = Color3.fromRGB(15, 10, 5)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.8
Lighting.ExposureCompensation = -0.3
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.15
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.15
Atmosphere.Offset = 0.06
Atmosphere.Color = Color3.fromRGB(180, 210, 245)
Atmosphere.Decay = Color3.fromRGB(70, 110, 200)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.1
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = -0.05
PostProcess.ColorCorrection.Contrast = 0.08
PostProcess.ColorCorrection.Saturation = 0.05
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
PostProcess.Bloom.Intensity = 0.2
PostProcess.Bloom.Size = 22
PostProcess.Bloom.Threshold = 0.95

--- PRESET: AFTERNOON (15:00) ---
Lighting.ClockTime = 15
Lighting.Brightness = 4
Lighting.Ambient = Color3.fromRGB(125, 120, 115)
Lighting.OutdoorAmbient = Color3.fromRGB(135, 130, 120)
Lighting.ColorShift_Top = Color3.fromRGB(8, 10, 20)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 15, 5)
Lighting.EnvironmentDiffuseScale = 0.9
Lighting.EnvironmentSpecularScale = 0.7
Lighting.ExposureCompensation = -0.1
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.2
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.18
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(190, 215, 245)
Atmosphere.Decay = Color3.fromRGB(75, 115, 205)
Atmosphere.Glare = 0.08
Atmosphere.Haze = 0.15
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.0
PostProcess.ColorCorrection.Contrast = 0.05
PostProcess.ColorCorrection.Saturation = 0.08
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 255, 248)
PostProcess.Bloom.Intensity = 0.25
PostProcess.Bloom.Size = 24
PostProcess.Bloom.Threshold = 0.92

--- PRESET: GOLDEN HOUR (17:30) ---
Lighting.ClockTime = 17.5
Lighting.Brightness = 2.5
Lighting.Ambient = Color3.fromRGB(130, 90, 60)
Lighting.OutdoorAmbient = Color3.fromRGB(140, 100, 65)
Lighting.ColorShift_Top = Color3.fromRGB(40, 25, 5)
Lighting.ColorShift_Bottom = Color3.fromRGB(60, 35, 10)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.5
Lighting.ExposureCompensation = 0.2
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.32
Atmosphere.Offset = 0.04
Atmosphere.Color = Color3.fromRGB(255, 170, 80)
Atmosphere.Decay = Color3.fromRGB(100, 90, 160)
Atmosphere.Glare = 0.3
Atmosphere.Haze = 0.5
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.1
PostProcess.ColorCorrection.Contrast = 0.1
PostProcess.ColorCorrection.Saturation = 0.4
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 230, 180)
PostProcess.Bloom.Intensity = 0.8
PostProcess.Bloom.Size = 32
PostProcess.Bloom.Threshold = 0.82
PostProcess.SunRays.Intensity = 0.4
PostProcess.SunRays.Spread = 0.6

--- PRESET: SUNSET (18:45) ---
Lighting.ClockTime = 18.75
Lighting.Brightness = 1.2
Lighting.Ambient = Color3.fromRGB(110, 70, 60)
Lighting.OutdoorAmbient = Color3.fromRGB(120, 75, 65)
Lighting.ColorShift_Top = Color3.fromRGB(50, 30, 10)
Lighting.ColorShift_Bottom = Color3.fromRGB(70, 40, 15)
Lighting.EnvironmentDiffuseScale = 0.5
Lighting.EnvironmentSpecularScale = 0.3
Lighting.ExposureCompensation = 0.5
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.4
Atmosphere.Offset = 0.03
Atmosphere.Color = Color3.fromRGB(255, 120, 60)
Atmosphere.Decay = Color3.fromRGB(80, 60, 130)
Atmosphere.Glare = 0.4
Atmosphere.Haze = 0.6
Sky.StarCount = 100
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.12
PostProcess.ColorCorrection.Contrast = 0.12
PostProcess.ColorCorrection.Saturation = 0.5
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 200, 150)
PostProcess.Bloom.Intensity = 1.0
PostProcess.Bloom.Size = 36
PostProcess.Bloom.Threshold = 0.78
PostProcess.SunRays.Intensity = 0.5
PostProcess.SunRays.Spread = 0.7

--- PRESET: DUSK (19:30) ---
Lighting.ClockTime = 19.5
Lighting.Brightness = 0.6
Lighting.Ambient = Color3.fromRGB(70, 50, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(80, 55, 85)
Lighting.ColorShift_Top = Color3.fromRGB(30, 20, 50)
Lighting.ColorShift_Bottom = Color3.fromRGB(40, 20, 10)
Lighting.EnvironmentDiffuseScale = 0.25
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 0.8
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.7
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.38
Atmosphere.Offset = 0.02
Atmosphere.Color = Color3.fromRGB(180, 100, 130)
Atmosphere.Decay = Color3.fromRGB(40, 40, 100)
Atmosphere.Glare = 0.15
Atmosphere.Haze = 0.4
Sky.StarCount = 500
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
Sky.SunAngularSize = 21
PostProcess.ColorCorrection.Brightness = 0.08
PostProcess.ColorCorrection.Contrast = 0.08
PostProcess.ColorCorrection.Saturation = 0.2
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(200, 170, 220)
PostProcess.Bloom.Intensity = 0.6
PostProcess.Bloom.Size = 28
PostProcess.Bloom.Threshold = 0.84

--- PRESET: TWILIGHT (20:30) ---
Lighting.ClockTime = 20.5
Lighting.Brightness = 0.2
Lighting.Ambient = Color3.fromRGB(30, 25, 55)
Lighting.OutdoorAmbient = Color3.fromRGB(35, 28, 60)
Lighting.ColorShift_Top = Color3.fromRGB(15, 10, 35)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 5, 20)
Lighting.EnvironmentDiffuseScale = 0.12
Lighting.EnvironmentSpecularScale = 0.05
Lighting.ExposureCompensation = 1.2
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.8
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.25
Atmosphere.Offset = 0.01
Atmosphere.Color = Color3.fromRGB(60, 50, 120)
Atmosphere.Decay = Color3.fromRGB(15, 15, 50)
Atmosphere.Glare = 0.02
Atmosphere.Haze = 0.15
Sky.StarCount = 2000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
PostProcess.ColorCorrection.Brightness = 0.05
PostProcess.ColorCorrection.Contrast = 0.1
PostProcess.ColorCorrection.Saturation = -0.1
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(180, 185, 240)
PostProcess.Bloom.Intensity = 0.4
PostProcess.Bloom.Size = 26
PostProcess.Bloom.Threshold = 0.87

--- PRESET: NIGHT (22:00) ---
Lighting.ClockTime = 22
Lighting.Brightness = 0.08
Lighting.Ambient = Color3.fromRGB(15, 15, 40)
Lighting.OutdoorAmbient = Color3.fromRGB(12, 12, 35)
Lighting.ColorShift_Top = Color3.fromRGB(8, 8, 28)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 15)
Lighting.EnvironmentDiffuseScale = 0.08
Lighting.EnvironmentSpecularScale = 0.03
Lighting.ExposureCompensation = 1.8
Lighting.GeographicLatitude = 30
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.9
Lighting.Technology = Enum.Technology.ShadowMap
Atmosphere.Density = 0.12
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(20, 25, 60)
Atmosphere.Decay = Color3.fromRGB(5, 5, 20)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.05
Sky.StarCount = 4000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 11
PostProcess.ColorCorrection.Brightness = -0.02
PostProcess.ColorCorrection.Contrast = 0.12
PostProcess.ColorCorrection.Saturation = -0.15
PostProcess.ColorCorrection.TintColor = Color3.fromRGB(160, 175, 255)
PostProcess.Bloom.Intensity = 0.5
PostProcess.Bloom.Size = 28
PostProcess.Bloom.Threshold = 0.86
`;

export const LIGHT_INDOOR: string = `
=== INDOOR LIGHTING — LIGHTS, TECHNIQUES, PALETTES ===

ROBLOX LIGHT CLASSES:
  PointLight — Omnidirectional sphere of light. Child of a Part.
  SpotLight — Cone of directed light. Child of a Part. Has Face property.
  SurfaceLight — Light emitting from one face of a Part. Like a panel/LED.

--- PointLight Properties ---
PointLight.Range: number (0 to 60)
  Radius of light in studs. 8 = small bedside lamp. 20 = room fill. 60 = warehouse.
PointLight.Brightness: number (0 to 10+)
  Intensity of the light. 1 = dim. 5 = strong. 10 = blinding.
PointLight.Color: Color3.fromRGB(r, g, b)
  Color of emitted light.
PointLight.Enabled: boolean
  Toggle on/off.
PointLight.Shadows: boolean
  Whether this light casts dynamic shadows (expensive, use sparingly).

--- SpotLight Properties ---
SpotLight.Range: number (0 to 60)
  Distance the spot reaches.
SpotLight.Brightness: number (0 to 10+)
  Intensity of the spot.
SpotLight.Angle: number (0 to 180)
  Cone angle in degrees. 30 = tight spot. 90 = wide flood. 120 = very wide.
SpotLight.Color: Color3.fromRGB(r, g, b)
  Color of the spot.
SpotLight.Face: Enum.NormalId
  Which face the light shines from: Front, Back, Left, Right, Top, Bottom.
SpotLight.Shadows: boolean
  Casts shadows from the spot cone.

--- SurfaceLight Properties ---
SurfaceLight.Range: number (0 to 60)
  How far the panel light reaches.
SurfaceLight.Brightness: number
  Intensity of the panel.
SurfaceLight.Angle: number (0 to 180)
  Spread angle from the surface.
SurfaceLight.Color: Color3.fromRGB(r, g, b)
  Panel light color.
SurfaceLight.Face: Enum.NormalId
  Which face of the Part emits light.

--- INDOOR ROOM TYPES AND LIGHT SETUPS ---

COZY BEDROOM:
  Set Lighting.Brightness = 0 (no outdoor light bleeds in)
  Set Lighting.Ambient = Color3.fromRGB(30, 20, 15)
  Main overhead light (ceiling Part with PointLight):
    PointLight.Range = 18
    PointLight.Brightness = 3
    PointLight.Color = Color3.fromRGB(255, 200, 140)
    PointLight.Shadows = false
  Bedside lamp (small Part with PointLight):
    PointLight.Range = 8
    PointLight.Brightness = 2
    PointLight.Color = Color3.fromRGB(255, 180, 100)
  Window light (Part at window with SurfaceLight facing inward):
    SurfaceLight.Range = 20
    SurfaceLight.Brightness = 1.5
    SurfaceLight.Color = Color3.fromRGB(200, 220, 255)
    SurfaceLight.Angle = 90
  PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 235, 210)
  PostProcess.ColorCorrection.Saturation = 0.1
  PostProcess.Bloom.Intensity = 0.4
  PostProcess.Bloom.Threshold = 0.88

FLUORESCENT OFFICE:
  Lighting.Ambient = Color3.fromRGB(60, 65, 70)
  Overhead fluorescent tube (long Part with SurfaceLight):
    SurfaceLight.Range = 25
    SurfaceLight.Brightness = 4
    SurfaceLight.Color = Color3.fromRGB(220, 230, 255)
    SurfaceLight.Angle = 120
    SurfaceLight.Face = Enum.NormalId.Bottom
  Multiple panels spaced every 12 studs across ceiling.
  PostProcess.ColorCorrection.TintColor = Color3.fromRGB(210, 220, 255)
  PostProcess.ColorCorrection.Saturation = -0.1
  PostProcess.ColorCorrection.Contrast = 0.05

DUNGEON / CAVE:
  Lighting.Brightness = 0
  Lighting.Ambient = Color3.fromRGB(8, 5, 12)
  Torch on wall (Part with PointLight):
    PointLight.Range = 14
    PointLight.Brightness = 4
    PointLight.Color = Color3.fromRGB(255, 140, 50)
    PointLight.Shadows = true
  Fire brazier (Part with PointLight):
    PointLight.Range = 20
    PointLight.Brightness = 5
    PointLight.Color = Color3.fromRGB(255, 120, 30)
  Glowing crystal vein (Part with PointLight):
    PointLight.Range = 10
    PointLight.Brightness = 2
    PointLight.Color = Color3.fromRGB(100, 50, 255)
  PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 200, 150)
  PostProcess.ColorCorrection.Brightness = -0.1
  PostProcess.Bloom.Intensity = 0.8
  PostProcess.Bloom.Threshold = 0.75

HOSPITAL / LAB:
  Lighting.Ambient = Color3.fromRGB(70, 75, 75)
  Overhead panel (SurfaceLight):
    SurfaceLight.Range = 30
    SurfaceLight.Brightness = 5
    SurfaceLight.Color = Color3.fromRGB(230, 240, 255)
    SurfaceLight.Angle = 130
  Accent spot on equipment (SpotLight):
    SpotLight.Range = 12
    SpotLight.Brightness = 3
    SpotLight.Color = Color3.fromRGB(200, 230, 255)
    SpotLight.Angle = 45
  PostProcess.ColorCorrection.TintColor = Color3.fromRGB(220, 235, 255)
  PostProcess.ColorCorrection.Saturation = -0.2
  PostProcess.ColorCorrection.Contrast = 0.1

NEON ARCADE / CLUB:
  Lighting.Brightness = 0
  Lighting.Ambient = Color3.fromRGB(15, 5, 30)
  Neon strip light (SurfaceLight on thin Part):
    SurfaceLight.Range = 12
    SurfaceLight.Brightness = 3
    SurfaceLight.Color = Color3.fromRGB(255, 0, 180)
    SurfaceLight.Angle = 90
  Second neon strip (different color):
    SurfaceLight.Color = Color3.fromRGB(0, 200, 255)
  Spot on stage (SpotLight):
    SpotLight.Range = 30
    SpotLight.Brightness = 6
    SpotLight.Color = Color3.fromRGB(255, 100, 255)
    SpotLight.Angle = 40
  PostProcess.Bloom.Intensity = 1.5
  PostProcess.Bloom.Size = 40
  PostProcess.Bloom.Threshold = 0.7
  PostProcess.ColorCorrection.Saturation = 0.6
  PostProcess.ColorCorrection.Contrast = 0.2

THRONE ROOM (FANTASY):
  Lighting.Brightness = 0
  Lighting.Ambient = Color3.fromRGB(30, 20, 10)
  Chandelier (central PointLight):
    PointLight.Range = 40
    PointLight.Brightness = 4
    PointLight.Color = Color3.fromRGB(255, 210, 150)
    PointLight.Shadows = true
  Wall torch left (PointLight):
    PointLight.Range = 14
    PointLight.Brightness = 3
    PointLight.Color = Color3.fromRGB(255, 160, 60)
  Wall torch right (PointLight):
    Same as left torch.
  Window shaft (SpotLight from above):
    SpotLight.Range = 25
    SpotLight.Brightness = 2
    SpotLight.Color = Color3.fromRGB(200, 210, 255)
    SpotLight.Angle = 20
    SpotLight.Face = Enum.NormalId.Bottom
  PostProcess.ColorCorrection.TintColor = Color3.fromRGB(255, 230, 190)
  PostProcess.Bloom.Intensity = 0.6
  PostProcess.Bloom.Threshold = 0.82

--- WARM VS COOL INDOOR PALETTE GUIDE ---

WARM PALETTE (cozy, fire, old wood, tavern):
  Primary: Color3.fromRGB(255, 180, 80) to Color3.fromRGB(255, 130, 40)
  Fill: Color3.fromRGB(200, 140, 80)
  Shadow accent: Color3.fromRGB(60, 30, 10)
  Materials to use: WoodPlanks, Wood, Brick, Fabric

COOL PALETTE (sci-fi, hospital, modern):
  Primary: Color3.fromRGB(180, 210, 255) to Color3.fromRGB(140, 200, 255)
  Fill: Color3.fromRGB(160, 200, 240)
  Shadow accent: Color3.fromRGB(10, 20, 50)
  Materials to use: Metal, Concrete, Marble, SlateTile

NEUTRAL PALETTE (office, classroom, industrial):
  Primary: Color3.fromRGB(220, 225, 235)
  Fill: Color3.fromRGB(190, 195, 210)
  Shadow accent: Color3.fromRGB(30, 35, 45)
  Materials to use: Concrete, Concrete, Metal, Cardboard

EERIE PALETTE (horror, dungeon, haunted):
  Primary: Color3.fromRGB(80, 50, 130) flickering with PointLight
  Fill: Color3.fromRGB(20, 15, 30)
  Accent: Color3.fromRGB(180, 30, 30) (blood/danger)
  Materials: Basalt, CrackedLava, Concrete, Rock

--- LIGHT FLICKERING (Scripted) ---
To simulate a flickering torch or broken light, tween PointLight.Brightness:
local light = script.Parent.PointLight
local TweenService = game:GetService("TweenService")
while true do
  local target = math.random(20, 50) / 10
  local info = TweenInfo.new(math.random(5, 20)/100, Enum.EasingStyle.Linear)
  TweenService:Create(light, info, {Brightness = target}):Play()
  task.wait(math.random(5, 20)/100)
end
`;

export const LIGHT_EFFECTS: string = `
=== POST-PROCESSING EFFECTS — COMPLETE PROPERTY REFERENCE ===

All post-processing effects are children of game.Lighting.
Multiple effects can be stacked. Order in explorer does not matter.
Create: Instance.new("BloomEffect", game.Lighting)

--- BloomEffect ---
CLASS: BloomEffect
Adds a glow/bloom around bright light sources and emissive parts.

BloomEffect.Intensity: number (0 to 10+)
  How much the glow spreads. 0 = off. 0.5 = subtle. 1 = standard. 3+ = extreme.
BloomEffect.Size: number (0 to 56)
  Radius of the bloom glow in pixels. 24 = medium. 40 = wide halo. 56 = max.
BloomEffect.Threshold: number (0 to 1)
  Brightness threshold above which bloom activates.
  1.0 = only extremely bright pixels bloom. 0.5 = many surfaces bloom. 0 = everything blooms.
  Recommended: 0.8 to 0.95 for realistic. 0.6 to 0.75 for stylized neon.

Example — Subtle realistic:
  BloomEffect.Intensity = 0.3
  BloomEffect.Size = 24
  BloomEffect.Threshold = 0.92

Example — Neon cyberpunk:
  BloomEffect.Intensity = 1.8
  BloomEffect.Size = 44
  BloomEffect.Threshold = 0.65

Example — Horror torch:
  BloomEffect.Intensity = 0.9
  BloomEffect.Size = 32
  BloomEffect.Threshold = 0.78

Example — Magical sparkle:
  BloomEffect.Intensity = 2.5
  BloomEffect.Size = 50
  BloomEffect.Threshold = 0.60

--- BlurEffect ---
CLASS: BlurEffect
Applies a full-screen Gaussian blur. Use sparingly (UI menus, dream sequences).

BlurEffect.Size: number (0 to 56)
  Blur radius. 0 = off. 4 = light soft. 14 = medium. 28 = heavy. 56 = max smear.

Example — Cutscene dream:
  BlurEffect.Size = 14

Example — Menu background:
  BlurEffect.Size = 24

Example — Concussion/stun:
  BlurEffect.Size = 28

--- ColorCorrectionEffect ---
CLASS: ColorCorrectionEffect
Adjusts overall color grading of the scene.

ColorCorrectionEffect.Brightness: number (-1 to 1)
  Additive brightness offset. 0 = no change. 0.1 = brighter. -0.1 = darker.

ColorCorrectionEffect.Contrast: number (-1 to 1)
  Contrast multiplier. 0 = no change. 0.1 = more punchy. -0.1 = flat/washed.

ColorCorrectionEffect.Saturation: number (-2 to 2)
  Color saturation. 0 = no change. 0.5 = vivid. -1 = near grayscale. -2 = full desaturate.

ColorCorrectionEffect.TintColor: Color3.fromRGB(r, g, b)
  Multiplicative tint over the whole screen.
  Color3.fromRGB(255, 255, 255) = no tint.
  Color3.fromRGB(255, 220, 180) = warm golden.
  Color3.fromRGB(180, 200, 255) = cool blue.
  Color3.fromRGB(255, 200, 200) = warm rose.
  Color3.fromRGB(200, 255, 200) = sickly green.

ColorCorrectionEffect.Enabled: boolean

Example — Cinematic warm:
  Brightness = 0.05, Contrast = 0.1, Saturation = 0.2
  TintColor = Color3.fromRGB(255, 235, 210)

Example — Horror desaturated:
  Brightness = -0.05, Contrast = 0.15, Saturation = -0.6
  TintColor = Color3.fromRGB(200, 210, 220)

Example — Underwater green:
  Brightness = -0.1, Contrast = 0.05, Saturation = 0.3
  TintColor = Color3.fromRGB(160, 220, 200)

Example — Night vision:
  Brightness = 0.2, Contrast = 0.2, Saturation = -1.5
  TintColor = Color3.fromRGB(130, 255, 130)

Example — Sepia old film:
  Brightness = 0.05, Contrast = 0.1, Saturation = -1.0
  TintColor = Color3.fromRGB(255, 220, 160)

--- DepthOfFieldEffect ---
CLASS: DepthOfFieldEffect
Simulates camera focus — blurs objects outside a focal range.

DepthOfFieldEffect.FarIntensity: number (0 to 1)
  How blurred objects beyond FocusDistance become.
  0 = no far blur. 1 = maximum far blur.

DepthOfFieldEffect.FocusDistance: number (studs)
  Distance from camera where scene is in focus.
  10 = closeup. 30 = medium. 80 = far landscape.

DepthOfFieldEffect.InFocusRadius: number (studs)
  Range around FocusDistance that stays sharp.
  5 = shallow DOF (cinematic). 20 = wide focus zone.

DepthOfFieldEffect.NearIntensity: number (0 to 1)
  How blurred objects closer than FocusDistance become.
  Usually 0 to 0.5.

Example — Cinematic portrait shot:
  FarIntensity = 0.8, FocusDistance = 15, InFocusRadius = 5, NearIntensity = 0.3

Example — Landscape foreground blur:
  FarIntensity = 0.0, FocusDistance = 60, InFocusRadius = 30, NearIntensity = 0.6

Example — Cutscene wide shot:
  FarIntensity = 0.4, FocusDistance = 40, InFocusRadius = 20, NearIntensity = 0.1

--- SunRaysEffect ---
CLASS: SunRaysEffect
Creates volumetric light shaft rays from the sun. Only visible when sun is in view.

SunRaysEffect.Intensity: number (0 to 1)
  Strength of the god rays. 0 = off. 0.1 = subtle. 0.5 = strong. 1.0 = max.

SunRaysEffect.Spread: number (0 to 1)
  How wide the rays fan out. 0 = tight parallel. 1 = wide explosive fan.

Example — Morning god rays through trees:
  Intensity = 0.25, Spread = 0.5

Example — Dramatic sunset rays:
  Intensity = 0.5, Spread = 0.7

Example — Heavenly portal:
  Intensity = 0.9, Spread = 0.9

Example — Overcast (no rays):
  SunRaysEffect.Enabled = false

--- STACKING EFFECTS FOR SPECIFIC MOODS ---

HORROR MOOD STACK:
  ColorCorrectionEffect: Brightness=-0.08, Contrast=0.18, Saturation=-0.5, TintColor=RGB(190,205,215)
  BloomEffect: Intensity=0.6, Size=28, Threshold=0.82
  BlurEffect: Size=0 (disabled normally, animate to Size=10 on jump scare)
  DepthOfFieldEffect: FarIntensity=0.3, FocusDistance=20, InFocusRadius=8, NearIntensity=0.1

NEON CYBERPUNK STACK:
  ColorCorrectionEffect: Brightness=0.05, Contrast=0.15, Saturation=0.6, TintColor=RGB(200,210,255)
  BloomEffect: Intensity=2.0, Size=44, Threshold=0.65
  SunRaysEffect: Intensity=0.0 (disabled, no sun in city)
  DepthOfFieldEffect: Disabled

GOLDEN SUNSET STACK:
  ColorCorrectionEffect: Brightness=0.1, Contrast=0.1, Saturation=0.4, TintColor=RGB(255,230,180)
  BloomEffect: Intensity=0.9, Size=34, Threshold=0.80
  SunRaysEffect: Intensity=0.45, Spread=0.65
  DepthOfFieldEffect: Disabled

FANTASY MAGIC STACK:
  ColorCorrectionEffect: Brightness=0.08, Contrast=0.08, Saturation=0.35, TintColor=RGB(230,220,255)
  BloomEffect: Intensity=2.2, Size=48, Threshold=0.62
  SunRaysEffect: Intensity=0.3, Spread=0.8
  DepthOfFieldEffect: FarIntensity=0.2, FocusDistance=50, InFocusRadius=25, NearIntensity=0.0

UNDERWATER STACK:
  ColorCorrectionEffect: Brightness=-0.12, Contrast=0.05, Saturation=0.25, TintColor=RGB(140,210,220)
  BloomEffect: Intensity=0.5, Size=30, Threshold=0.85
  BlurEffect: Size=2 (slight caustic softness)
  SunRaysEffect: Intensity=0.2, Spread=0.4

COZY INDOOR STACK:
  ColorCorrectionEffect: Brightness=0.06, Contrast=0.06, Saturation=0.15, TintColor=RGB(255,235,205)
  BloomEffect: Intensity=0.5, Size=26, Threshold=0.86
  DepthOfFieldEffect: Disabled
  SunRaysEffect: Disabled

ALIEN PLANET STACK:
  ColorCorrectionEffect: Brightness=0.0, Contrast=0.12, Saturation=0.5, TintColor=RGB(210,255,210)
  BloomEffect: Intensity=0.8, Size=32, Threshold=0.78
  SunRaysEffect: Intensity=0.35, Spread=0.6
  DepthOfFieldEffect: FarIntensity=0.15, FocusDistance=80, InFocusRadius=40, NearIntensity=0.0

WINTER TUNDRA STACK:
  ColorCorrectionEffect: Brightness=0.15, Contrast=0.08, Saturation=-0.3, TintColor=RGB(210,225,255)
  BloomEffect: Intensity=0.4, Size=26, Threshold=0.90
  SunRaysEffect: Intensity=0.15, Spread=0.4
  DepthOfFieldEffect: FarIntensity=0.25, FocusDistance=100, InFocusRadius=50, NearIntensity=0.0
`;

export const LIGHT_MOOD: string = `
=== MOOD / GENRE PRESETS — 40+ COMPLETE LIGHTING SETUPS ===

Each preset includes Lighting + Atmosphere + Sky + PostProcessing.
These are not time-of-day dependent — they define a complete visual feel.
Use Technology = ShadowMap unless noted otherwise.

--- PRESET: HORROR / HAUNTED HOUSE ---
Lighting.ClockTime = 0
Lighting.Brightness = 0.05
Lighting.Ambient = Color3.fromRGB(8, 5, 15)
Lighting.OutdoorAmbient = Color3.fromRGB(5, 5, 12)
Lighting.ColorShift_Top = Color3.fromRGB(5, 0, 15)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 5)
Lighting.EnvironmentDiffuseScale = 0.05
Lighting.EnvironmentSpecularScale = 0.02
Lighting.ExposureCompensation = 1.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.9
Atmosphere.Density = 0.5
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(20, 15, 35)
Atmosphere.Decay = Color3.fromRGB(5, 3, 10)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.1
Sky.StarCount = 200
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 18
ColorCorrection.Brightness = -0.1
ColorCorrection.Contrast = 0.2
ColorCorrection.Saturation = -0.6
ColorCorrection.TintColor = Color3.fromRGB(185, 200, 215)
Bloom.Intensity = 0.5
Bloom.Size = 28
Bloom.Threshold = 0.82
Indoor lights: PointLight RGB(160, 30, 30) Brightness=2 Range=10 (red blood light)
Wall torch: PointLight RGB(255, 120, 40) Brightness=3 Range=12 flicker script

--- PRESET: FANTASY MEADOW ---
Lighting.ClockTime = 10
Lighting.Brightness = 3.5
Lighting.Ambient = Color3.fromRGB(130, 145, 120)
Lighting.OutdoorAmbient = Color3.fromRGB(140, 155, 130)
Lighting.ColorShift_Top = Color3.fromRGB(10, 20, 5)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 30, 5)
Lighting.EnvironmentDiffuseScale = 0.9
Lighting.EnvironmentSpecularScale = 0.4
Lighting.ExposureCompensation = 0.1
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.35
Atmosphere.Density = 0.22
Atmosphere.Offset = 0.06
Atmosphere.Color = Color3.fromRGB(185, 220, 200)
Atmosphere.Decay = Color3.fromRGB(90, 150, 100)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.15
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.08
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = 0.3
ColorCorrection.TintColor = Color3.fromRGB(240, 255, 230)
Bloom.Intensity = 0.5
Bloom.Size = 28
Bloom.Threshold = 0.85
SunRays.Intensity = 0.15
SunRays.Spread = 0.5

--- PRESET: CYBERPUNK NEON CITY ---
Lighting.ClockTime = 23
Lighting.Brightness = 0.02
Lighting.Ambient = Color3.fromRGB(5, 5, 25)
Lighting.OutdoorAmbient = Color3.fromRGB(5, 5, 20)
Lighting.ColorShift_Top = Color3.fromRGB(0, 5, 30)
Lighting.ColorShift_Bottom = Color3.fromRGB(15, 0, 30)
Lighting.EnvironmentDiffuseScale = 0.0
Lighting.EnvironmentSpecularScale = 0.0
Lighting.ExposureCompensation = 1.0
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Atmosphere.Density = 0.55
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(30, 15, 60)
Atmosphere.Decay = Color3.fromRGB(10, 5, 30)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.3
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.2
ColorCorrection.Saturation = 0.7
ColorCorrection.TintColor = Color3.fromRGB(200, 210, 255)
Bloom.Intensity = 2.2
Bloom.Size = 46
Bloom.Threshold = 0.62
Neon strips: SurfaceLight RGB(255, 0, 200) Brightness=4 Range=14
Neon blue: SurfaceLight RGB(0, 200, 255) Brightness=4 Range=14
Neon yellow: SurfaceLight RGB(255, 220, 0) Brightness=3 Range=10
Street lamps: PointLight RGB(200, 160, 255) Brightness=5 Range=25

--- PRESET: UNDERWATER ---
Lighting.ClockTime = 12
Lighting.Brightness = 1.5
Lighting.Ambient = Color3.fromRGB(20, 80, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(25, 90, 110)
Lighting.ColorShift_Top = Color3.fromRGB(0, 40, 60)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 20, 40)
Lighting.EnvironmentDiffuseScale = 0.5
Lighting.EnvironmentSpecularScale = 0.3
Lighting.ExposureCompensation = 0.3
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.6
Atmosphere.Density = 0.7
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(15, 90, 130)
Atmosphere.Decay = Color3.fromRGB(5, 40, 80)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.4
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = -0.1
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = 0.3
ColorCorrection.TintColor = Color3.fromRGB(140, 215, 225)
Bloom.Intensity = 0.6
Bloom.Size = 30
Bloom.Threshold = 0.83
Blur.Size = 2
Caustic light shafts: SpotLight RGB(160, 230, 255) Brightness=3 Angle=15 from above

--- PRESET: VOLCANIC HELLSCAPE ---
Lighting.ClockTime = 20
Lighting.Brightness = 0.3
Lighting.Ambient = Color3.fromRGB(80, 20, 5)
Lighting.OutdoorAmbient = Color3.fromRGB(90, 25, 8)
Lighting.ColorShift_Top = Color3.fromRGB(60, 15, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(80, 30, 0)
Lighting.EnvironmentDiffuseScale = 0.2
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 0.8
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.65
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(200, 80, 20)
Atmosphere.Decay = Color3.fromRGB(100, 30, 5)
Atmosphere.Glare = 0.1
Atmosphere.Haze = 0.7
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.15
ColorCorrection.Saturation = 0.5
ColorCorrection.TintColor = Color3.fromRGB(255, 200, 160)
Bloom.Intensity = 1.2
Bloom.Size = 36
Bloom.Threshold = 0.72
Lava glow: PointLight RGB(255, 100, 0) Brightness=6 Range=30
Fire pillar: PointLight RGB(255, 150, 0) Brightness=8 Range=20 flicker

--- PRESET: WINTER WONDERLAND ---
Lighting.ClockTime = 11
Lighting.Brightness = 4
Lighting.Ambient = Color3.fromRGB(160, 175, 200)
Lighting.OutdoorAmbient = Color3.fromRGB(170, 185, 210)
Lighting.ColorShift_Top = Color3.fromRGB(10, 15, 35)
Lighting.ColorShift_Bottom = Color3.fromRGB(25, 30, 50)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.9
Lighting.ExposureCompensation = 0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.28
Atmosphere.Offset = 0.08
Atmosphere.Color = Color3.fromRGB(210, 230, 255)
Atmosphere.Decay = Color3.fromRGB(150, 180, 240)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.2
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.15
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = -0.25
ColorCorrection.TintColor = Color3.fromRGB(215, 230, 255)
Bloom.Intensity = 0.4
Bloom.Size = 26
Bloom.Threshold = 0.90
SunRays.Intensity = 0.12
SunRays.Spread = 0.4

--- PRESET: TROPICAL PARADISE ---
Lighting.ClockTime = 13
Lighting.Brightness = 5
Lighting.Ambient = Color3.fromRGB(130, 150, 130)
Lighting.OutdoorAmbient = Color3.fromRGB(145, 165, 140)
Lighting.ColorShift_Top = Color3.fromRGB(5, 20, 10)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 30, 10)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.8
Lighting.ExposureCompensation = -0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.25
Atmosphere.Density = 0.12
Atmosphere.Offset = 0.07
Atmosphere.Color = Color3.fromRGB(170, 215, 250)
Atmosphere.Decay = Color3.fromRGB(60, 120, 220)
Atmosphere.Glare = 0.08
Atmosphere.Haze = 0.08
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = 0.4
ColorCorrection.TintColor = Color3.fromRGB(245, 255, 240)
Bloom.Intensity = 0.3
Bloom.Size = 24
Bloom.Threshold = 0.93

--- PRESET: OUTER SPACE ---
Lighting.ClockTime = 0
Lighting.Brightness = 0.01
Lighting.Ambient = Color3.fromRGB(0, 0, 0)
Lighting.OutdoorAmbient = Color3.fromRGB(0, 0, 0)
Lighting.ColorShift_Top = Color3.fromRGB(0, 0, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 0)
Lighting.EnvironmentDiffuseScale = 0.0
Lighting.EnvironmentSpecularScale = 0.0
Lighting.ExposureCompensation = 0.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.0
Atmosphere.Density = 0.0
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(0, 0, 0)
Atmosphere.Decay = Color3.fromRGB(0, 0, 0)
Atmosphere.Glare = 0
Atmosphere.Haze = 0
Sky.StarCount = 6000
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 8
Sky.MoonAngularSize = 5
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.15
ColorCorrection.Saturation = 0.0
ColorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
Bloom.Intensity = 1.0
Bloom.Size = 32
Bloom.Threshold = 0.80
Directional sun: SpotLight RGB(255, 250, 230) Brightness=8 Angle=5 (harsh hard shadows)

--- PRESET: DESERT NOON ---
Lighting.ClockTime = 12
Lighting.Brightness = 6
Lighting.Ambient = Color3.fromRGB(140, 130, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(150, 140, 108)
Lighting.ColorShift_Top = Color3.fromRGB(8, 6, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(30, 20, 5)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.9
Lighting.ExposureCompensation = -0.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.1
Atmosphere.Density = 0.25
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(220, 210, 170)
Atmosphere.Decay = Color3.fromRGB(140, 170, 220)
Atmosphere.Glare = 0.4
Atmosphere.Haze = 0.6
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = -0.08
ColorCorrection.Contrast = 0.12
ColorCorrection.Saturation = 0.2
ColorCorrection.TintColor = Color3.fromRGB(255, 245, 210)
Bloom.Intensity = 0.25
Bloom.Size = 22
Bloom.Threshold = 0.94

--- PRESET: DENSE FOREST ---
Lighting.ClockTime = 11
Lighting.Brightness = 2.5
Lighting.Ambient = Color3.fromRGB(60, 90, 50)
Lighting.OutdoorAmbient = Color3.fromRGB(70, 100, 55)
Lighting.ColorShift_Top = Color3.fromRGB(5, 20, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 25, 0)
Lighting.EnvironmentDiffuseScale = 0.6
Lighting.EnvironmentSpecularScale = 0.2
Lighting.ExposureCompensation = 0.4
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Atmosphere.Density = 0.4
Atmosphere.Offset = 0.02
Atmosphere.Color = Color3.fromRGB(100, 160, 100)
Atmosphere.Decay = Color3.fromRGB(40, 90, 40)
Atmosphere.Glare = 0.02
Atmosphere.Haze = 0.25
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = 0.2
ColorCorrection.TintColor = Color3.fromRGB(220, 245, 210)
Bloom.Intensity = 0.5
Bloom.Size = 28
Bloom.Threshold = 0.84
SunRays.Intensity = 0.3
SunRays.Spread = 0.5

--- PRESET: THUNDERSTORM ---
Lighting.ClockTime = 14
Lighting.Brightness = 0.8
Lighting.Ambient = Color3.fromRGB(60, 65, 75)
Lighting.OutdoorAmbient = Color3.fromRGB(65, 70, 80)
Lighting.ColorShift_Top = Color3.fromRGB(15, 15, 25)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 10, 20)
Lighting.EnvironmentDiffuseScale = 0.35
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 0.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.9
Atmosphere.Density = 0.65
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(80, 90, 110)
Atmosphere.Decay = Color3.fromRGB(30, 35, 50)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.5
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = -0.05
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = -0.15
ColorCorrection.TintColor = Color3.fromRGB(200, 210, 225)
Bloom.Intensity = 0.3
Bloom.Size = 26
Bloom.Threshold = 0.87
Lightning flash (scripted): PointLight RGB(220, 230, 255) Brightness=20 Range=200 toggle on/off rapidly

--- PRESET: POST-APOCALYPTIC ---
Lighting.ClockTime = 15
Lighting.Brightness = 1.5
Lighting.Ambient = Color3.fromRGB(90, 80, 50)
Lighting.OutdoorAmbient = Color3.fromRGB(100, 88, 55)
Lighting.ColorShift_Top = Color3.fromRGB(20, 15, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(30, 20, 0)
Lighting.EnvironmentDiffuseScale = 0.5
Lighting.EnvironmentSpecularScale = 0.2
Lighting.ExposureCompensation = 0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.45
Atmosphere.Offset = 0.02
Atmosphere.Color = Color3.fromRGB(180, 150, 80)
Atmosphere.Decay = Color3.fromRGB(100, 80, 30)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.55
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = -0.05
ColorCorrection.Contrast = 0.12
ColorCorrection.Saturation = -0.2
ColorCorrection.TintColor = Color3.fromRGB(240, 225, 180)
Bloom.Intensity = 0.4
Bloom.Size = 26
Bloom.Threshold = 0.87

--- PRESET: COZY CABIN INTERIOR ---
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(30, 18, 8)
Lighting.ColorShift_Top = Color3.fromRGB(0, 0, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 0)
Atmosphere.Density = 0
Fireplace: PointLight RGB(255, 140, 40) Brightness=5 Range=22 flicker script
Overhead lantern: PointLight RGB(255, 200, 120) Brightness=3 Range=18
Window moonlight: SurfaceLight RGB(180, 200, 255) Brightness=0.8 Range=15 Angle=70
Candle: PointLight RGB(255, 160, 60) Brightness=1.5 Range=7
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = 0.15
ColorCorrection.TintColor = Color3.fromRGB(255, 230, 200)
Bloom.Intensity = 0.7
Bloom.Size = 30
Bloom.Threshold = 0.80

--- PRESET: ANCIENT RUINS ---
Lighting.ClockTime = 9
Lighting.Brightness = 2.5
Lighting.Ambient = Color3.fromRGB(100, 95, 70)
Lighting.OutdoorAmbient = Color3.fromRGB(110, 104, 76)
Lighting.ColorShift_Top = Color3.fromRGB(10, 8, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 15, 0)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.3
Lighting.ExposureCompensation = 0.1
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.3
Atmosphere.Offset = 0.04
Atmosphere.Color = Color3.fromRGB(200, 190, 150)
Atmosphere.Decay = Color3.fromRGB(110, 130, 160)
Atmosphere.Glare = 0.08
Atmosphere.Haze = 0.3
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.05
ColorCorrection.TintColor = Color3.fromRGB(255, 245, 220)
Bloom.Intensity = 0.3
Bloom.Size = 24
Bloom.Threshold = 0.90
SunRays.Intensity = 0.2
SunRays.Spread = 0.5

--- PRESET: SCI-FI LAB ---
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(20, 25, 40)
Fluorescent overhead: SurfaceLight RGB(210, 230, 255) Brightness=5 Range=30 Angle=120 Face=Bottom
Equipment glow blue: PointLight RGB(0, 180, 255) Brightness=2 Range=10
Equipment glow green: PointLight RGB(0, 255, 120) Brightness=2 Range=10
Danger indicator: PointLight RGB(255, 50, 0) Brightness=1.5 Range=8
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.12
ColorCorrection.Saturation = 0.2
ColorCorrection.TintColor = Color3.fromRGB(210, 225, 255)
Bloom.Intensity = 0.8
Bloom.Size = 32
Bloom.Threshold = 0.78

--- PRESET: PIRATE COVE ---
Lighting.ClockTime = 17
Lighting.Brightness = 2.8
Lighting.Ambient = Color3.fromRGB(100, 90, 70)
Lighting.OutdoorAmbient = Color3.fromRGB(110, 98, 76)
Lighting.ColorShift_Top = Color3.fromRGB(25, 20, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(30, 20, 5)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.4
Lighting.ExposureCompensation = 0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.28
Atmosphere.Offset = 0.04
Atmosphere.Color = Color3.fromRGB(220, 180, 120)
Atmosphere.Decay = Color3.fromRGB(100, 130, 200)
Atmosphere.Glare = 0.2
Atmosphere.Haze = 0.35
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.08
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.25
ColorCorrection.TintColor = Color3.fromRGB(255, 235, 200)
Bloom.Intensity = 0.5
Bloom.Size = 28
Bloom.Threshold = 0.85
SunRays.Intensity = 0.25
SunRays.Spread = 0.5

--- PRESET: DREAMSCAPE ---
Lighting.ClockTime = 6
Lighting.Brightness = 2
Lighting.Ambient = Color3.fromRGB(150, 120, 170)
Lighting.OutdoorAmbient = Color3.fromRGB(160, 130, 180)
Lighting.ColorShift_Top = Color3.fromRGB(30, 10, 50)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 30, 50)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.4
Lighting.ExposureCompensation = 0.4
Lighting.GlobalShadows = false
Lighting.ShadowSoftness = 1.0
Atmosphere.Density = 0.5
Atmosphere.Offset = 0.1
Atmosphere.Color = Color3.fromRGB(220, 180, 255)
Atmosphere.Decay = Color3.fromRGB(100, 150, 255)
Atmosphere.Glare = 0.1
Atmosphere.Haze = 0.5
Sky.StarCount = 1000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 20
ColorCorrection.Brightness = 0.12
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = 0.5
ColorCorrection.TintColor = Color3.fromRGB(230, 210, 255)
Bloom.Intensity = 2.0
Bloom.Size = 50
Bloom.Threshold = 0.60
Blur.Size = 3

--- PRESET: INDUSTRIAL FACTORY ---
Lighting.ClockTime = 12
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(40, 35, 30)
Overhead metal halide: SurfaceLight RGB(200, 210, 180) Brightness=5 Range=35 Angle=100 Face=Bottom
Furnace glow: PointLight RGB(255, 120, 20) Brightness=6 Range=20 flicker
Sparks (small PointLight): RGB(255, 200, 50) Brightness=8 Range=5 animated
Warning strip: SurfaceLight RGB(255, 140, 0) Brightness=2 Range=8
ColorCorrection.Brightness = -0.05
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = -0.1
ColorCorrection.TintColor = Color3.fromRGB(240, 235, 220)
Bloom.Intensity = 0.6
Bloom.Size = 28
Bloom.Threshold = 0.80

--- PRESET: CRYSTAL CAVE ---
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(10, 5, 20)
Crystal blue: PointLight RGB(80, 160, 255) Brightness=3 Range=16
Crystal purple: PointLight RGB(180, 80, 255) Brightness=3 Range=14
Crystal green: PointLight RGB(60, 255, 160) Brightness=2.5 Range=12
Crystal pink: PointLight RGB(255, 100, 200) Brightness=2 Range=10
Ceiling drip glow: SurfaceLight RGB(100, 200, 255) Brightness=1.5 Range=20 Face=Bottom
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.6
ColorCorrection.TintColor = Color3.fromRGB(210, 220, 255)
Bloom.Intensity = 2.5
Bloom.Size = 50
Bloom.Threshold = 0.58

--- PRESET: SWAMP / BAYOU ---
Lighting.ClockTime = 17
Lighting.Brightness = 1.2
Lighting.Ambient = Color3.fromRGB(50, 70, 40)
Lighting.OutdoorAmbient = Color3.fromRGB(55, 75, 43)
Lighting.ColorShift_Top = Color3.fromRGB(5, 15, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 20, 0)
Lighting.EnvironmentDiffuseScale = 0.4
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 0.4
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.7
Atmosphere.Density = 0.55
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(80, 120, 70)
Atmosphere.Decay = Color3.fromRGB(30, 60, 25)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.4
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = -0.05
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = 0.1
ColorCorrection.TintColor = Color3.fromRGB(200, 230, 190)
Bloom.Intensity = 0.4
Bloom.Size = 26
Bloom.Threshold = 0.86
Will-o-wisp: PointLight RGB(100, 255, 120) Brightness=2 Range=8 animated float

--- PRESET: CHERRY BLOSSOM SPRING ---
Lighting.ClockTime = 10
Lighting.Brightness = 3.5
Lighting.Ambient = Color3.fromRGB(165, 140, 145)
Lighting.OutdoorAmbient = Color3.fromRGB(175, 148, 153)
Lighting.ColorShift_Top = Color3.fromRGB(15, 5, 15)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 10, 15)
Lighting.EnvironmentDiffuseScale = 0.85
Lighting.EnvironmentSpecularScale = 0.4
Lighting.ExposureCompensation = 0.1
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.2
Atmosphere.Offset = 0.06
Atmosphere.Color = Color3.fromRGB(255, 210, 220)
Atmosphere.Decay = Color3.fromRGB(160, 170, 220)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.2
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.1
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = 0.3
ColorCorrection.TintColor = Color3.fromRGB(255, 235, 240)
Bloom.Intensity = 0.7
Bloom.Size = 30
Bloom.Threshold = 0.82
SunRays.Intensity = 0.15
SunRays.Spread = 0.5

--- PRESET: AUTUMN FOREST ---
Lighting.ClockTime = 14
Lighting.Brightness = 3
Lighting.Ambient = Color3.fromRGB(120, 95, 60)
Lighting.OutdoorAmbient = Color3.fromRGB(130, 103, 65)
Lighting.ColorShift_Top = Color3.fromRGB(25, 15, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(35, 20, 0)
Lighting.EnvironmentDiffuseScale = 0.75
Lighting.EnvironmentSpecularScale = 0.35
Lighting.ExposureCompensation = 0.0
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.35
Atmosphere.Density = 0.25
Atmosphere.Offset = 0.04
Atmosphere.Color = Color3.fromRGB(220, 180, 130)
Atmosphere.Decay = Color3.fromRGB(110, 130, 170)
Atmosphere.Glare = 0.08
Atmosphere.Haze = 0.25
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.35
ColorCorrection.TintColor = Color3.fromRGB(255, 235, 210)
Bloom.Intensity = 0.45
Bloom.Size = 26
Bloom.Threshold = 0.87

--- PRESET: RAINY CITY ---
Lighting.ClockTime = 18
Lighting.Brightness = 0.9
Lighting.Ambient = Color3.fromRGB(55, 60, 70)
Lighting.OutdoorAmbient = Color3.fromRGB(60, 65, 75)
Lighting.ColorShift_Top = Color3.fromRGB(10, 10, 20)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 15, 25)
Lighting.EnvironmentDiffuseScale = 0.3
Lighting.EnvironmentSpecularScale = 0.7
Lighting.ExposureCompensation = 0.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.8
Atmosphere.Density = 0.6
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(70, 80, 100)
Atmosphere.Decay = Color3.fromRGB(25, 30, 45)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.4
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = -0.1
ColorCorrection.TintColor = Color3.fromRGB(190, 205, 230)
Bloom.Intensity = 0.8
Bloom.Size = 34
Bloom.Threshold = 0.78
Street lamps: PointLight RGB(255, 200, 120) Brightness=5 Range=22
Neon signs: SurfaceLight colors vary Brightness=3 Range=10

--- PRESET: FOGGY HARBOR ---
Lighting.ClockTime = 7
Lighting.Brightness = 1.5
Lighting.Ambient = Color3.fromRGB(100, 110, 115)
Lighting.OutdoorAmbient = Color3.fromRGB(108, 118, 123)
Lighting.ColorShift_Top = Color3.fromRGB(10, 12, 15)
Lighting.ColorShift_Bottom = Color3.fromRGB(8, 10, 12)
Lighting.EnvironmentDiffuseScale = 0.5
Lighting.EnvironmentSpecularScale = 0.2
Lighting.ExposureCompensation = 0.3
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.8
Atmosphere.Density = 0.7
Atmosphere.Offset = 0.0
Atmosphere.Color = Color3.fromRGB(175, 185, 195)
Atmosphere.Decay = Color3.fromRGB(110, 120, 135)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.6
Sky.StarCount = 0
Sky.CelestialBodiesShown = false
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = -0.2
ColorCorrection.TintColor = Color3.fromRGB(210, 220, 230)
Bloom.Intensity = 0.3
Bloom.Size = 24
Bloom.Threshold = 0.90
Harbor lamp: PointLight RGB(255, 210, 140) Brightness=4 Range=20

--- PRESET: MOONLIT CLEARING ---
Lighting.ClockTime = 0
Lighting.Brightness = 0.15
Lighting.Ambient = Color3.fromRGB(20, 25, 50)
Lighting.OutdoorAmbient = Color3.fromRGB(22, 28, 55)
Lighting.ColorShift_Top = Color3.fromRGB(10, 12, 30)
Lighting.ColorShift_Bottom = Color3.fromRGB(5, 8, 20)
Lighting.EnvironmentDiffuseScale = 0.15
Lighting.EnvironmentSpecularScale = 0.1
Lighting.ExposureCompensation = 1.5
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.7
Atmosphere.Density = 0.18
Atmosphere.Offset = 0.02
Atmosphere.Color = Color3.fromRGB(40, 50, 100)
Atmosphere.Decay = Color3.fromRGB(10, 12, 40)
Atmosphere.Glare = 0
Atmosphere.Haze = 0.1
Sky.StarCount = 5000
Sky.CelestialBodiesShown = true
Sky.MoonAngularSize = 22
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = -0.1
ColorCorrection.TintColor = Color3.fromRGB(180, 195, 255)
Bloom.Intensity = 0.6
Bloom.Size = 30
Bloom.Threshold = 0.82

--- PRESET: FIRE DUNGEON ---
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(40, 10, 5)
Large fire pit: PointLight RGB(255, 100, 20) Brightness=8 Range=30 flicker
Wall sconce 1: PointLight RGB(255, 130, 40) Brightness=4 Range=14
Wall sconce 2: PointLight RGB(255, 130, 40) Brightness=4 Range=14
Lava crack: SurfaceLight RGB(255, 80, 0) Brightness=3 Range=15 Face=Top
ColorCorrection.Brightness = 0.05
ColorCorrection.Contrast = 0.15
ColorCorrection.Saturation = 0.4
ColorCorrection.TintColor = Color3.fromRGB(255, 210, 170)
Bloom.Intensity = 1.2
Bloom.Size = 36
Bloom.Threshold = 0.72

--- PRESET: CANDY WORLD ---
Lighting.ClockTime = 12
Lighting.Brightness = 5
Lighting.Ambient = Color3.fromRGB(180, 160, 170)
Lighting.OutdoorAmbient = Color3.fromRGB(190, 170, 180)
Lighting.ColorShift_Top = Color3.fromRGB(20, 5, 20)
Lighting.ColorShift_Bottom = Color3.fromRGB(25, 10, 20)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.9
Lighting.ExposureCompensation = -0.1
Lighting.GlobalShadows = false
Atmosphere.Density = 0.1
Atmosphere.Color = Color3.fromRGB(255, 210, 240)
Atmosphere.Decay = Color3.fromRGB(220, 180, 255)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.1
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
ColorCorrection.Brightness = 0.1
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = 0.7
ColorCorrection.TintColor = Color3.fromRGB(255, 240, 255)
Bloom.Intensity = 1.0
Bloom.Size = 36
Bloom.Threshold = 0.75

--- PRESET: STEAMPUNK ---
Lighting.ClockTime = 16
Lighting.Brightness = 1.8
Lighting.Ambient = Color3.fromRGB(90, 70, 40)
Lighting.OutdoorAmbient = Color3.fromRGB(100, 78, 44)
Lighting.ColorShift_Top = Color3.fromRGB(20, 12, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(30, 18, 0)
Lighting.EnvironmentDiffuseScale = 0.55
Lighting.EnvironmentSpecularScale = 0.6
Lighting.ExposureCompensation = 0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.4
Atmosphere.Density = 0.45
Atmosphere.Offset = 0.02
Atmosphere.Color = Color3.fromRGB(180, 140, 80)
Atmosphere.Decay = Color3.fromRGB(100, 80, 40)
Atmosphere.Glare = 0.1
Atmosphere.Haze = 0.5
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.12
ColorCorrection.Saturation = 0.15
ColorCorrection.TintColor = Color3.fromRGB(255, 235, 195)
Bloom.Intensity = 0.6
Bloom.Size = 28
Bloom.Threshold = 0.82
Gear lamp: PointLight RGB(255, 180, 60) Brightness=3 Range=16
Steam vent glow: PointLight RGB(200, 220, 255) Brightness=2 Range=8

--- PRESET: MILITARY BASE ---
Lighting.ClockTime = 9
Lighting.Brightness = 3.5
Lighting.Ambient = Color3.fromRGB(110, 115, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(120, 125, 108)
Lighting.ColorShift_Top = Color3.fromRGB(5, 8, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 12, 0)
Lighting.EnvironmentDiffuseScale = 0.8
Lighting.EnvironmentSpecularScale = 0.5
Lighting.ExposureCompensation = 0.0
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.2
Atmosphere.Density = 0.18
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(180, 190, 180)
Atmosphere.Decay = Color3.fromRGB(90, 120, 140)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.12
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.08
ColorCorrection.Saturation = -0.05
ColorCorrection.TintColor = Color3.fromRGB(240, 245, 235)
Bloom.Intensity = 0.2
Bloom.Size = 22
Bloom.Threshold = 0.93

--- PRESET: ALIEN PLANET ---
Lighting.ClockTime = 10
Lighting.Brightness = 2.5
Lighting.Ambient = Color3.fromRGB(60, 110, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(65, 120, 85)
Lighting.ColorShift_Top = Color3.fromRGB(0, 25, 10)
Lighting.ColorShift_Bottom = Color3.fromRGB(10, 30, 5)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.5
Lighting.ExposureCompensation = 0.1
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.3
Atmosphere.Density = 0.35
Atmosphere.Offset = 0.05
Atmosphere.Color = Color3.fromRGB(80, 200, 140)
Atmosphere.Decay = Color3.fromRGB(30, 100, 70)
Atmosphere.Glare = 0.15
Atmosphere.Haze = 0.3
Sky.StarCount = 3000
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 14
ColorCorrection.Brightness = 0.0
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.5
ColorCorrection.TintColor = Color3.fromRGB(210, 255, 225)
Bloom.Intensity = 0.7
Bloom.Size = 30
Bloom.Threshold = 0.82
SunRays.Intensity = 0.3
SunRays.Spread = 0.5
Alien flora glow: PointLight RGB(100, 255, 150) Brightness=2 Range=12

--- PRESET: ENCHANTED FOREST ---
Lighting.ClockTime = 11
Lighting.Brightness = 2
Lighting.Ambient = Color3.fromRGB(80, 100, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(88, 108, 86)
Lighting.ColorShift_Top = Color3.fromRGB(10, 25, 10)
Lighting.ColorShift_Bottom = Color3.fromRGB(15, 30, 10)
Lighting.EnvironmentDiffuseScale = 0.6
Lighting.EnvironmentSpecularScale = 0.2
Lighting.ExposureCompensation = 0.3
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.6
Atmosphere.Density = 0.4
Atmosphere.Offset = 0.03
Atmosphere.Color = Color3.fromRGB(140, 200, 150)
Atmosphere.Decay = Color3.fromRGB(60, 120, 70)
Atmosphere.Glare = 0.02
Atmosphere.Haze = 0.3
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.06
ColorCorrection.Contrast = 0.06
ColorCorrection.Saturation = 0.35
ColorCorrection.TintColor = Color3.fromRGB(220, 255, 220)
Bloom.Intensity = 1.2
Bloom.Size = 38
Bloom.Threshold = 0.72
SunRays.Intensity = 0.25
SunRays.Spread = 0.6
Fairy light: PointLight RGB(200, 255, 180) Brightness=2 Range=8
Mushroom glow: PointLight RGB(255, 100, 255) Brightness=1.5 Range=6

--- PRESET: PRISON / INTERROGATION ---
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(20, 20, 20)
Single overhead bulb: PointLight RGB(220, 220, 180) Brightness=4 Range=18
Emergency red: PointLight RGB(255, 20, 0) Brightness=1 Range=10 (flicker when alarm)
ColorCorrection.Brightness = -0.08
ColorCorrection.Contrast = 0.15
ColorCorrection.Saturation = -0.4
ColorCorrection.TintColor = Color3.fromRGB(210, 215, 210)
Bloom.Intensity = 0.3
Bloom.Size = 24
Bloom.Threshold = 0.90

--- PRESET: ARENA / COLOSSEUM ---
Lighting.ClockTime = 14
Lighting.Brightness = 5
Lighting.Ambient = Color3.fromRGB(150, 140, 110)
Lighting.OutdoorAmbient = Color3.fromRGB(160, 148, 116)
Lighting.ColorShift_Top = Color3.fromRGB(10, 8, 0)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 15, 0)
Lighting.EnvironmentDiffuseScale = 1.0
Lighting.EnvironmentSpecularScale = 0.8
Lighting.ExposureCompensation = -0.2
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.15
Atmosphere.Density = 0.15
Atmosphere.Offset = 0.06
Atmosphere.Color = Color3.fromRGB(200, 210, 240)
Atmosphere.Decay = Color3.fromRGB(80, 120, 210)
Atmosphere.Glare = 0.05
Atmosphere.Haze = 0.1
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = -0.03
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.1
ColorCorrection.TintColor = Color3.fromRGB(255, 248, 230)
Bloom.Intensity = 0.25
Bloom.Size = 22
Bloom.Threshold = 0.93

--- PRESET: BEACH SUNSET ---
Lighting.ClockTime = 18.5
Lighting.Brightness = 2
Lighting.Ambient = Color3.fromRGB(140, 90, 70)
Lighting.OutdoorAmbient = Color3.fromRGB(150, 96, 74)
Lighting.ColorShift_Top = Color3.fromRGB(45, 28, 5)
Lighting.ColorShift_Bottom = Color3.fromRGB(60, 38, 10)
Lighting.EnvironmentDiffuseScale = 0.65
Lighting.EnvironmentSpecularScale = 0.8
Lighting.ExposureCompensation = 0.3
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.45
Atmosphere.Density = 0.3
Atmosphere.Offset = 0.04
Atmosphere.Color = Color3.fromRGB(255, 150, 80)
Atmosphere.Decay = Color3.fromRGB(90, 80, 150)
Atmosphere.Glare = 0.35
Atmosphere.Haze = 0.55
Sky.StarCount = 50
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 21
ColorCorrection.Brightness = 0.1
ColorCorrection.Contrast = 0.1
ColorCorrection.Saturation = 0.5
ColorCorrection.TintColor = Color3.fromRGB(255, 220, 180)
Bloom.Intensity = 1.0
Bloom.Size = 36
Bloom.Threshold = 0.78
SunRays.Intensity = 0.5
SunRays.Spread = 0.7

--- PRESET: FROZEN TUNDRA ---
Lighting.ClockTime = 12
Lighting.Brightness = 3
Lighting.Ambient = Color3.fromRGB(140, 160, 190)
Lighting.OutdoorAmbient = Color3.fromRGB(148, 168, 198)
Lighting.ColorShift_Top = Color3.fromRGB(10, 15, 35)
Lighting.ColorShift_Bottom = Color3.fromRGB(20, 28, 50)
Lighting.EnvironmentDiffuseScale = 0.9
Lighting.EnvironmentSpecularScale = 1.0
Lighting.ExposureCompensation = 0.3
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Atmosphere.Density = 0.35
Atmosphere.Offset = 0.07
Atmosphere.Color = Color3.fromRGB(200, 220, 255)
Atmosphere.Decay = Color3.fromRGB(130, 170, 240)
Atmosphere.Glare = 0.06
Atmosphere.Haze = 0.3
Sky.StarCount = 0
Sky.CelestialBodiesShown = true
Sky.SunAngularSize = 14
ColorCorrection.Brightness = 0.18
ColorCorrection.Contrast = 0.05
ColorCorrection.Saturation = -0.35
ColorCorrection.TintColor = Color3.fromRGB(210, 228, 255)
Bloom.Intensity = 0.35
Bloom.Size = 24
Bloom.Threshold = 0.91
SunRays.Intensity = 0.1
SunRays.Spread = 0.35
`;

export const LIGHTING_ATMOSPHERE_BIBLE: string = `
=== ROBLOX LIGHTING + ATMOSPHERE COMPLETE KNOWLEDGE BIBLE ===
Version: 1.0 | Platform: Roblox Studio + Live Game
All API properties verified real. No SmoothPlastic. Colors as RGB triplets.
Technology options: Voxel / ShadowMap / Future

${LIGHT_PRESETS}

${LIGHT_ATMOSPHERE}

${LIGHT_TIME_OF_DAY}

${LIGHT_INDOOR}

${LIGHT_EFFECTS}

${LIGHT_MOOD}

=== SKY OBJECT — COMPLETE PROPERTY REFERENCE ===

CLASS: Sky
LOCATION: child of game.Lighting
Create: Instance.new("Sky", game.Lighting)

Sky.CelestialBodiesShown: boolean
  true = sun and moon render. false = sky only, no sun/moon disc.

Sky.MoonAngularSize: number (degrees)
  Visual size of the moon in the sky. Default 11. Large moon: 20-30.

Sky.MoonTextureId: string
  Asset ID for custom moon texture. "rbxassetid://XXXXXXXXX"
  Default: "" (uses Roblox default moon)

Sky.SkyboxBk: string
  Asset ID for the back face of the skybox cubemap.
Sky.SkyboxDn: string
  Asset ID for the down (bottom) face of the skybox cubemap.
Sky.SkyboxFt: string
  Asset ID for the front face of the skybox cubemap.
Sky.SkyboxLf: string
  Asset ID for the left face of the skybox cubemap.
Sky.SkyboxRt: string
  Asset ID for the right face of the skybox cubemap.
Sky.SkyboxUp: string
  Asset ID for the up (top) face of the skybox cubemap.
  All 6 faces required for custom skybox. If left blank, Roblox default sky shows.

Sky.StarCount: number (0 to 6000)
  Number of star particles rendered at night. 0 = no stars. 6000 = dense starfield.
  Visible only when sun is below horizon (ClockTime ~20 to ~5).

Sky.SunAngularSize: number (degrees)
  Visual size of the sun disc. Default 21. Small sun: 8. Large sun: 35.

Sky.SunTextureId: string
  Asset ID for custom sun texture. Default: "" (uses Roblox default sun)

--- SKY TIPS ---
For SPACE preset: StarCount=6000, CelestialBodiesShown=true, SunAngularSize=8 (distant star)
For ALIEN WORLD: StarCount=3000, SunAngularSize=14 (slightly smaller alien sun)
For DREAMSCAPE: MoonAngularSize=22 (oversized moon), StarCount=1000
For HORROR NIGHT: MoonAngularSize=18, StarCount=200 (cloudy, few stars)
For UNDERWATER: CelestialBodiesShown=false (no sky visible)
For CYBERPUNK: CelestialBodiesShown=false (light pollution, no stars)

=== SKY OBJECT IN CUSTOM SKYBOXES ===

To use a custom skybox, you need 6 separate square image assets (typically 1024x1024 px).
Each face of the cube must match seamlessly at edges.
Format for each face: Sky.SkyboxBk = "rbxassetid://YOUR_ASSET_ID"

For purely procedural atmosphere (no custom sky):
  Do NOT add a Sky object. Roblox Atmosphere object will control the sky gradient.
  Adding a Sky object overrides the gradient but Atmosphere still applies density/haze.

=== PERFORMANCE NOTES ===

Technology performance cost (lowest to highest):
  Enum.Technology.Voxel < Enum.Technology.ShadowMap < Enum.Technology.Future

BloomEffect performance cost: Low (GPU filter only)
BlurEffect performance cost: Low
ColorCorrectionEffect: Negligible
DepthOfFieldEffect: Medium (DOF pass)
SunRaysEffect: Low-Medium

GlobalShadows = true adds significant shadow map cost. Turn off for low-end device support.
PointLight.Shadows = true is EXPENSIVE. Limit to 2-3 shadow-casting lights per scene max.
SpotLight.Shadows = true: Same — use sparingly.
SurfaceLight never casts dynamic shadows regardless of Shadows property.

For mobile-friendly games:
  Technology = Enum.Technology.ShadowMap
  GlobalShadows = true (still fine on mobile)
  No PointLight.Shadows = true
  Keep Bloom.Size under 32

=== LIGHT COLOR TEMPERATURE REFERENCE ===

Candle flame: Color3.fromRGB(255, 140, 30) — 1800K warm orange
Tungsten bulb: Color3.fromRGB(255, 200, 120) — 2700K warm white
Halogen: Color3.fromRGB(255, 225, 180) — 3200K slightly warm
Fluorescent: Color3.fromRGB(220, 230, 255) — 4000K cool white
Daylight: Color3.fromRGB(255, 255, 255) — 5500K neutral
Overcast sky: Color3.fromRGB(200, 215, 255) — 6500K cool
Blue sky: Color3.fromRGB(160, 190, 255) — 8000K blue
Night/moon: Color3.fromRGB(140, 160, 255) — 10000K deep blue

=== SCRIPTING PATTERNS — DYNAMIC LIGHTING ===

DAY/NIGHT CYCLE (smooth 24-hour loop):
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local CYCLE_SPEED = 1/60  -- hours per second (1 full day = 24 minutes real time)
RunService.Heartbeat:Connect(function(dt)
  Lighting.ClockTime = (Lighting.ClockTime + dt * CYCLE_SPEED) % 24
end)

WEATHER TRANSITION (tween atmosphere density):
local TweenService = game:GetService("TweenService")
local atmo = game.Lighting:FindFirstChildOfClass("Atmosphere")
local tweenInfo = TweenInfo.new(5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
TweenService:Create(atmo, tweenInfo, {Density = 0.7, Haze = 0.6}):Play()

EMERGENCY ALARM (color flash):
local cc = game.Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
while alarmActive do
  TweenService:Create(cc, TweenInfo.new(0.3), {TintColor = Color3.fromRGB(255, 150, 150)}):Play()
  task.wait(0.3)
  TweenService:Create(cc, TweenInfo.new(0.3), {TintColor = Color3.fromRGB(255, 255, 255)}):Play()
  task.wait(0.3)
end

TORCH FLICKER (random Brightness oscillation):
local light = workspace.Torch.PointLight
local TweenService = game:GetService("TweenService")
task.spawn(function()
  while true do
    local targetBrightness = 3 + math.random(-10, 15) / 10
    local dur = math.random(4, 12) / 100
    TweenService:Create(light, TweenInfo.new(dur, Enum.EasingStyle.Sine), {Brightness = targetBrightness}):Play()
    task.wait(dur)
  end
end)

INDOOR/OUTDOOR LIGHTING TRANSITION (loading into building):
local function transitionToIndoor()
  local Lighting = game:GetService("Lighting")
  local TweenService = game:GetService("TweenService")
  local info = TweenInfo.new(1.5, Enum.EasingStyle.Sine)
  TweenService:Create(Lighting, info, {
    Brightness = 0,
    Ambient = Color3.fromRGB(25, 15, 8),
  }):Play()
end

=== COMMON MISTAKES TO AVOID ===

MISTAKE: Using Enum.Technology.Voxel with Atmosphere object.
FIX: Switch to ShadowMap or Future. Voxel ignores most Atmosphere properties.

MISTAKE: Setting Atmosphere.Density = 1 and then wondering why entire scene is invisible.
FIX: Keep Density under 0.7 for playable scenes. Use 0.8+ only for cutscene effects.

MISTAKE: Adding 10+ PointLights with Shadows = true in a single room.
FIX: Use a maximum of 2 PointLights with shadows. Use PointLights WITHOUT shadows for fill lighting.

MISTAKE: BloomEffect.Threshold = 0 making every surface glow.
FIX: Keep Threshold at 0.75 minimum for realistic bloom. 0.6 is minimum for neon.

MISTAKE: Using SmoothPlastic parts under dynamic lighting (banned in this codebase).
FIX: Use Concrete, Wood, Brick, Metal, Marble, Rock, Basalt for all structural parts.

MISTAKE: Forgetting to set ExposureCompensation when Brightness is very low (night scenes).
FIX: For ClockTime=0 with Brightness=0.05, set ExposureCompensation = 1.5 to compensate.

MISTAKE: Setting ColorShift_Top/Bottom without knowing the effect.
FIX: ColorShift_Top tints sky-facing surfaces. ColorShift_Bottom tints ground-facing surfaces.
Both should be SUBTLE (max RGB 40,40,40 for realistic). They are additive color shifts.

MISTAKE: SunRaysEffect visible at night.
FIX: Disable SunRaysEffect (Enabled=false) or set Intensity=0 when ClockTime is 20-5 (night).
Sun rays only make sense when the sun is visible in the sky.

=== MATERIAL + LIGHTING INTERACTION GUIDE ===

Metal (Roblox): High specular response. Reflects environment. Looks excellent under Future technology.
  Best lighting: High EnvironmentSpecularScale (0.8+), cool blue ambient.

Concrete: Diffuse, no specular. Absorbs ambient color well. Looks realistic in all technologies.
  Best lighting: Neutral warm ambient, soft ShadowMap shadows.

Wood: Moderate diffuse. Warm colors look natural. Good for firelight.
  Best lighting: Warm PointLights (RGB 255,180,80 range), low cool ambient.

Brick: High texture detail. Shadows from ShadowMap show mortar lines nicely.
  Best lighting: Harsh directional sun (ClockTime 10-14), low ShadowSoftness (0.1-0.2).

Marble: Medium specular. Reflects colored lighting noticeably.
  Best lighting: White PointLights, Future technology for reflections.

Basalt: Very dark, high absorbency. Needs strong direct light to see detail.
  Best lighting: Bright direct sun or strong PointLight nearby. Low ambient.

Ice/Glacier: High specular, reflective. Shows bloom and specular hotspots dramatically.
  Best lighting: Future technology, EnvironmentSpecularScale=1.0, BloomEffect active.

Grass/LeafyGrass: Matte green. Receives ColorShift_Bottom (sky bounce) well.
  Best lighting: ColorShift_Bottom = Color3.fromRGB(20,30,5) for realistic green bounce.

Sand: Warm-toned matte. Looks great in harsh desert noon or golden hour.
  Best lighting: High Brightness (5+), warm ColorShift_Bottom (50,35,10 range).

Rock/Pebble: Natural stone. Neutral diffuse. Good baseline for any outdoor scene.
  Best lighting: Any natural preset works. Benefits from ShadowMap for texture depth.

=== FINAL QUICK REFERENCE TABLE ===

GOAL                      | ClockTime | Brightness | Atmosphere.Density | BloomIntensity
Bright sunny day          |    12     |     5      |       0.15         |     0.2
Overcast gray day         |    12     |     2      |       0.45         |     0.1
Golden hour               |    17.5   |     2.5    |       0.32         |     0.9
Sunset                    |    18.75  |     1.2    |       0.40         |     1.0
Clear night               |    0      |     0.08   |       0.12         |     0.5
Stormy dark               |    14     |     0.8    |       0.65         |     0.3
Dense fog                 |    9      |     1.5    |       0.70         |     0.3
Space (no atmo)           |    0      |     0.01   |       0.00         |     1.0
Cozy indoor               |    N/A    |     0      |       0.00         |     0.5
Neon cyberpunk night      |    23     |     0.02   |       0.55         |     2.2
Fantasy bright            |    10     |     3.5    |       0.22         |     0.5
Horror midnight           |    0      |     0.05   |       0.50         |     0.5
Underwater                |    12     |     1.5    |       0.70         |     0.6
Volcanic hellscape        |    20     |     0.3    |       0.65         |     1.2
Winter snow               |    11     |     4      |       0.28         |     0.4
`;
