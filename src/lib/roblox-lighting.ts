/**
 * Roblox Lighting System — preset configs for Lighting service + post-processing effects.
 * Each preset includes: Lighting properties, Atmosphere, Bloom, ColorCorrection, DepthOfField.
 * All values are tuned for visual quality consistent with top Roblox experiences.
 */

import type { RGB } from './roblox-materials'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface LightingConfig {
  /** Enum.Technology string (Voxel | Compatibility | Future | ShadowMap) */
  technology: 'Future' | 'ShadowMap' | 'Voxel' | 'Compatibility'
  brightness: number
  /** Overall ambient Color3 */
  ambient: RGB
  /** Outdoor ambient for Future lighting */
  outdoorAmbient: RGB
  /** Sky / sun color */
  colorShift_Top: RGB
  colorShift_Bottom: RGB
  /** Sun position angles (degrees) */
  timeOfDay: string  // "HH:MM:SS"
  /** GeographicLatitude degrees */
  geographicLatitude: number
  shadowSoftness: number
  exposureCompensation: number
  /** EnvironmentalDiffuseScale 0-1 */
  environmentalDiffuseScale: number
  environmentalSpecularScale: number
}

export interface AtmosphereConfig {
  density: number     // 0-1, how thick the air is
  offset: number      // 0-1, horizon haze offset
  color: RGB
  decay: RGB
  glare: number       // 0-1
  haze: number        // 0-10
}

export interface BloomConfig {
  enabled: boolean
  intensity: number   // 0-1
  size: number        // 0-56
  threshold: number   // 0-1
}

export interface ColorCorrectionConfig {
  enabled: boolean
  brightness: number  // -1 to 1
  contrast: number    // -1 to 1
  saturation: number  // -1 to 1
  tintColor: RGB
}

export interface DepthOfFieldConfig {
  enabled: boolean
  focusDistance: number
  inFocusRadius: number
  nearIntensity: number
  farIntensity: number
}

export interface SunRaysConfig {
  enabled: boolean
  intensity: number   // 0-1
  spread: number      // 0-1
}

export interface LightingPreset {
  name: LightingPresetName
  displayName: string
  description: string
  lighting: LightingConfig
  atmosphere: AtmosphereConfig
  bloom: BloomConfig
  colorCorrection: ColorCorrectionConfig
  depthOfField: DepthOfFieldConfig
  sunRays: SunRaysConfig
  /** Keywords that trigger this preset from a user prompt */
  keywords: string[]
}

export type LightingPresetName =
  | 'sunny_day'
  | 'golden_hour'
  | 'night'
  | 'indoor'
  | 'fantasy'
  | 'overcast'
  | 'dawn'
  | 'horror'
  | 'arctic'
  | 'tropical'
  | 'scifi'

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

function rgb(r: number, g: number, b: number): RGB {
  return { r: r / 255, g: g / 255, b: b / 255 }
}

export const LIGHTING_PRESETS: Record<LightingPresetName, LightingPreset> = {

  sunny_day: {
    name: 'sunny_day',
    displayName: 'Sunny Day',
    description: 'Bright midday sun, clear sky, sharp shadows.',
    lighting: {
      technology: 'Future',
      brightness: 2.5,
      ambient: rgb(120, 130, 145),
      outdoorAmbient: rgb(130, 150, 175),
      colorShift_Top: rgb(255, 250, 240),
      colorShift_Bottom: rgb(200, 215, 235),
      timeOfDay: '12:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.2,
      exposureCompensation: 0,
      environmentalDiffuseScale: 1,
      environmentalSpecularScale: 0.6,
    },
    atmosphere: {
      density: 0.35,
      offset: 0.06,
      color: rgb(199, 220, 255),
      decay: rgb(100, 140, 200),
      glare: 0,
      haze: 2,
    },
    bloom: { enabled: true, intensity: 0.1, size: 24, threshold: 0.95 },
    colorCorrection: {
      enabled: true,
      brightness: 0,
      contrast: 0.05,
      saturation: 0.1,
      tintColor: rgb(255, 255, 255),
    },
    depthOfField: { enabled: false, focusDistance: 50, inFocusRadius: 30, nearIntensity: 0, farIntensity: 0 },
    sunRays: { enabled: true, intensity: 0.08, spread: 0.5 },
    keywords: ['sunny', 'day', 'bright', 'clear', 'midday', 'noon'],
  },

  golden_hour: {
    name: 'golden_hour',
    displayName: 'Golden Hour',
    description: 'Warm orange sunset light, long soft shadows, cinematic bloom.',
    lighting: {
      technology: 'Future',
      brightness: 1.8,
      ambient: rgb(110, 95, 80),
      outdoorAmbient: rgb(150, 110, 75),
      colorShift_Top: rgb(255, 190, 100),
      colorShift_Bottom: rgb(255, 140, 60),
      timeOfDay: '18:30:00',
      geographicLatitude: 35.0,
      shadowSoftness: 0.5,
      exposureCompensation: 0.1,
      environmentalDiffuseScale: 0.8,
      environmentalSpecularScale: 0.9,
    },
    atmosphere: {
      density: 0.5,
      offset: 0.25,
      color: rgb(255, 180, 100),
      decay: rgb(200, 100, 40),
      glare: 0.15,
      haze: 4,
    },
    bloom: { enabled: true, intensity: 0.3, size: 32, threshold: 0.75 },
    colorCorrection: {
      enabled: true,
      brightness: 0.05,
      contrast: 0.1,
      saturation: 0.2,
      tintColor: rgb(255, 235, 210),
    },
    depthOfField: { enabled: true, focusDistance: 80, inFocusRadius: 60, nearIntensity: 0.05, farIntensity: 0.2 },
    sunRays: { enabled: true, intensity: 0.25, spread: 0.7 },
    keywords: ['sunset', 'golden', 'dusk', 'evening', 'warm', 'orange sky'],
  },

  night: {
    name: 'night',
    displayName: 'Night',
    description: 'Dark cool night with moon glow and star bloom.',
    lighting: {
      technology: 'Future',
      brightness: 0.3,
      ambient: rgb(40, 45, 70),
      outdoorAmbient: rgb(30, 40, 65),
      colorShift_Top: rgb(30, 40, 80),
      colorShift_Bottom: rgb(15, 20, 45),
      timeOfDay: '00:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.8,
      exposureCompensation: 0.3,
      environmentalDiffuseScale: 0.3,
      environmentalSpecularScale: 0.2,
    },
    atmosphere: {
      density: 0.2,
      offset: 0.0,
      color: rgb(30, 40, 80),
      decay: rgb(10, 15, 40),
      glare: 0.05,
      haze: 1,
    },
    bloom: { enabled: true, intensity: 0.4, size: 40, threshold: 0.5 },
    colorCorrection: {
      enabled: true,
      brightness: -0.1,
      contrast: 0.15,
      saturation: -0.1,
      tintColor: rgb(180, 195, 255),
    },
    depthOfField: { enabled: true, focusDistance: 60, inFocusRadius: 40, nearIntensity: 0.1, farIntensity: 0.4 },
    sunRays: { enabled: false, intensity: 0, spread: 0 },
    keywords: ['night', 'dark', 'midnight', 'moon', 'stars', 'nocturnal'],
  },

  indoor: {
    name: 'indoor',
    displayName: 'Indoor',
    description: 'Neutral indoor ambient, dim natural light, PointLights in scene.',
    lighting: {
      technology: 'ShadowMap',
      brightness: 1.0,
      ambient: rgb(100, 100, 100),
      outdoorAmbient: rgb(80, 80, 80),
      colorShift_Top: rgb(180, 180, 180),
      colorShift_Bottom: rgb(100, 100, 100),
      timeOfDay: '12:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.6,
      exposureCompensation: 0.2,
      environmentalDiffuseScale: 0.5,
      environmentalSpecularScale: 0.4,
    },
    atmosphere: {
      density: 0.0,
      offset: 0.0,
      color: rgb(200, 200, 200),
      decay: rgb(150, 150, 150),
      glare: 0,
      haze: 0,
    },
    bloom: { enabled: true, intensity: 0.05, size: 16, threshold: 0.98 },
    colorCorrection: {
      enabled: true,
      brightness: 0,
      contrast: 0.05,
      saturation: 0.0,
      tintColor: rgb(255, 248, 240),
    },
    depthOfField: { enabled: false, focusDistance: 30, inFocusRadius: 20, nearIntensity: 0, farIntensity: 0 },
    sunRays: { enabled: false, intensity: 0, spread: 0 },
    keywords: ['indoor', 'interior', 'inside', 'room', 'basement', 'dungeon', 'cave', 'cavern'],
  },

  fantasy: {
    name: 'fantasy',
    displayName: 'Fantasy',
    description: 'Ethereal purple-tinted light, heavy bloom, dreamlike atmosphere.',
    lighting: {
      technology: 'Future',
      brightness: 2.0,
      ambient: rgb(100, 80, 130),
      outdoorAmbient: rgb(120, 90, 160),
      colorShift_Top: rgb(180, 140, 255),
      colorShift_Bottom: rgb(100, 60, 180),
      timeOfDay: '15:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.7,
      exposureCompensation: 0.1,
      environmentalDiffuseScale: 0.9,
      environmentalSpecularScale: 1.0,
    },
    atmosphere: {
      density: 0.4,
      offset: 0.15,
      color: rgb(160, 120, 240),
      decay: rgb(80, 50, 150),
      glare: 0.2,
      haze: 3,
    },
    bloom: { enabled: true, intensity: 0.5, size: 48, threshold: 0.6 },
    colorCorrection: {
      enabled: true,
      brightness: 0.05,
      contrast: 0.1,
      saturation: 0.3,
      tintColor: rgb(220, 200, 255),
    },
    depthOfField: { enabled: true, focusDistance: 100, inFocusRadius: 80, nearIntensity: 0.1, farIntensity: 0.3 },
    sunRays: { enabled: true, intensity: 0.3, spread: 0.8 },
    keywords: ['fantasy', 'magic', 'enchanted', 'mystical', 'arcane', 'ethereal', 'fairy'],
  },

  overcast: {
    name: 'overcast',
    displayName: 'Overcast',
    description: 'Cloudy flat diffuse light, muted colors, no hard shadows.',
    lighting: {
      technology: 'Future',
      brightness: 1.5,
      ambient: rgb(150, 155, 160),
      outdoorAmbient: rgb(160, 165, 170),
      colorShift_Top: rgb(200, 205, 215),
      colorShift_Bottom: rgb(180, 185, 195),
      timeOfDay: '11:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.9,
      exposureCompensation: 0,
      environmentalDiffuseScale: 1.0,
      environmentalSpecularScale: 0.3,
    },
    atmosphere: {
      density: 0.7,
      offset: 0.1,
      color: rgb(190, 195, 205),
      decay: rgb(150, 155, 165),
      glare: 0,
      haze: 6,
    },
    bloom: { enabled: true, intensity: 0.05, size: 20, threshold: 0.98 },
    colorCorrection: {
      enabled: true,
      brightness: -0.05,
      contrast: -0.05,
      saturation: -0.15,
      tintColor: rgb(220, 225, 235),
    },
    depthOfField: { enabled: false, focusDistance: 50, inFocusRadius: 40, nearIntensity: 0, farIntensity: 0 },
    sunRays: { enabled: false, intensity: 0, spread: 0 },
    keywords: ['overcast', 'cloudy', 'grey', 'foggy', 'misty', 'drizzle', 'storm'],
  },

  dawn: {
    name: 'dawn',
    displayName: 'Dawn',
    description: 'Cool pale light at sunrise, mist on the ground, soft pink sky.',
    lighting: {
      technology: 'Future',
      brightness: 1.4,
      ambient: rgb(100, 100, 120),
      outdoorAmbient: rgb(120, 115, 140),
      colorShift_Top: rgb(255, 200, 180),
      colorShift_Bottom: rgb(180, 160, 210),
      timeOfDay: '05:30:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.6,
      exposureCompensation: 0.1,
      environmentalDiffuseScale: 0.7,
      environmentalSpecularScale: 0.5,
    },
    atmosphere: {
      density: 0.6,
      offset: 0.2,
      color: rgb(220, 190, 210),
      decay: rgb(160, 130, 170),
      glare: 0.1,
      haze: 5,
    },
    bloom: { enabled: true, intensity: 0.2, size: 28, threshold: 0.8 },
    colorCorrection: {
      enabled: true,
      brightness: 0,
      contrast: 0.05,
      saturation: 0.05,
      tintColor: rgb(255, 230, 235),
    },
    depthOfField: { enabled: true, focusDistance: 120, inFocusRadius: 80, nearIntensity: 0.05, farIntensity: 0.15 },
    sunRays: { enabled: true, intensity: 0.15, spread: 0.6 },
    keywords: ['dawn', 'sunrise', 'morning', 'early'],
  },

  horror: {
    name: 'horror',
    displayName: 'Horror',
    description: 'Grim dark red-black atmosphere, high contrast, minimal light.',
    lighting: {
      technology: 'ShadowMap',
      brightness: 0.4,
      ambient: rgb(30, 20, 25),
      outdoorAmbient: rgb(25, 18, 22),
      colorShift_Top: rgb(60, 20, 20),
      colorShift_Bottom: rgb(20, 10, 12),
      timeOfDay: '23:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.3,
      exposureCompensation: 0.2,
      environmentalDiffuseScale: 0.2,
      environmentalSpecularScale: 0.1,
    },
    atmosphere: {
      density: 0.5,
      offset: 0.05,
      color: rgb(40, 20, 20),
      decay: rgb(15, 8, 8),
      glare: 0,
      haze: 2,
    },
    bloom: { enabled: true, intensity: 0.15, size: 36, threshold: 0.7 },
    colorCorrection: {
      enabled: true,
      brightness: -0.2,
      contrast: 0.3,
      saturation: -0.25,
      tintColor: rgb(200, 160, 160),
    },
    depthOfField: { enabled: true, focusDistance: 30, inFocusRadius: 20, nearIntensity: 0.2, farIntensity: 0.6 },
    sunRays: { enabled: false, intensity: 0, spread: 0 },
    keywords: ['horror', 'scary', 'haunted', 'cursed', 'creepy', 'zombie', 'undead', 'graveyard'],
  },

  arctic: {
    name: 'arctic',
    displayName: 'Arctic',
    description: 'Cold pale blue-white light reflecting off ice and snow.',
    lighting: {
      technology: 'Future',
      brightness: 2.2,
      ambient: rgb(160, 185, 215),
      outdoorAmbient: rgb(170, 195, 230),
      colorShift_Top: rgb(200, 225, 255),
      colorShift_Bottom: rgb(160, 200, 240),
      timeOfDay: '13:00:00',
      geographicLatitude: 70.0,
      shadowSoftness: 0.4,
      exposureCompensation: 0.1,
      environmentalDiffuseScale: 1.0,
      environmentalSpecularScale: 0.8,
    },
    atmosphere: {
      density: 0.3,
      offset: 0.05,
      color: rgb(190, 215, 245),
      decay: rgb(150, 185, 225),
      glare: 0.05,
      haze: 2,
    },
    bloom: { enabled: true, intensity: 0.15, size: 24, threshold: 0.85 },
    colorCorrection: {
      enabled: true,
      brightness: 0.1,
      contrast: 0.05,
      saturation: -0.1,
      tintColor: rgb(220, 235, 255),
    },
    depthOfField: { enabled: false, focusDistance: 80, inFocusRadius: 60, nearIntensity: 0, farIntensity: 0 },
    sunRays: { enabled: true, intensity: 0.1, spread: 0.4 },
    keywords: ['arctic', 'frozen', 'tundra', 'ice', 'snow', 'polar', 'blizzard', 'glacier'],
  },

  tropical: {
    name: 'tropical',
    displayName: 'Tropical',
    description: 'Vivid saturated warm beach light, bright blue sky, punchy colors.',
    lighting: {
      technology: 'Future',
      brightness: 2.8,
      ambient: rgb(130, 160, 175),
      outdoorAmbient: rgb(150, 185, 200),
      colorShift_Top: rgb(110, 195, 255),
      colorShift_Bottom: rgb(200, 230, 255),
      timeOfDay: '11:30:00',
      geographicLatitude: 10.0,
      shadowSoftness: 0.3,
      exposureCompensation: -0.1,
      environmentalDiffuseScale: 1.0,
      environmentalSpecularScale: 0.7,
    },
    atmosphere: {
      density: 0.25,
      offset: 0.1,
      color: rgb(140, 210, 255),
      decay: rgb(80, 160, 220),
      glare: 0.1,
      haze: 1.5,
    },
    bloom: { enabled: true, intensity: 0.15, size: 20, threshold: 0.9 },
    colorCorrection: {
      enabled: true,
      brightness: 0.05,
      contrast: 0.1,
      saturation: 0.25,
      tintColor: rgb(255, 252, 240),
    },
    depthOfField: { enabled: false, focusDistance: 100, inFocusRadius: 80, nearIntensity: 0, farIntensity: 0 },
    sunRays: { enabled: true, intensity: 0.12, spread: 0.5 },
    keywords: ['tropical', 'beach', 'island', 'resort', 'ocean', 'paradise', 'coast', 'harbor'],
  },

  scifi: {
    name: 'scifi',
    displayName: 'Sci-Fi',
    description: 'Cold blue-white technical lighting, neon glow, high contrast.',
    lighting: {
      technology: 'Future',
      brightness: 1.6,
      ambient: rgb(60, 75, 110),
      outdoorAmbient: rgb(70, 90, 130),
      colorShift_Top: rgb(80, 120, 180),
      colorShift_Bottom: rgb(30, 50, 90),
      timeOfDay: '12:00:00',
      geographicLatitude: 41.7,
      shadowSoftness: 0.2,
      exposureCompensation: 0,
      environmentalDiffuseScale: 0.6,
      environmentalSpecularScale: 1.0,
    },
    atmosphere: {
      density: 0.15,
      offset: 0.0,
      color: rgb(60, 90, 150),
      decay: rgb(20, 35, 70),
      glare: 0.05,
      haze: 1,
    },
    bloom: { enabled: true, intensity: 0.35, size: 44, threshold: 0.65 },
    colorCorrection: {
      enabled: true,
      brightness: 0,
      contrast: 0.2,
      saturation: 0.1,
      tintColor: rgb(210, 225, 255),
    },
    depthOfField: { enabled: true, focusDistance: 60, inFocusRadius: 50, nearIntensity: 0.08, farIntensity: 0.25 },
    sunRays: { enabled: false, intensity: 0, spread: 0 },
    keywords: ['scifi', 'sci-fi', 'space', 'futuristic', 'alien', 'robot', 'cyber', 'station', 'hologram'],
  },
}

// ---------------------------------------------------------------------------
// Preset detector
// ---------------------------------------------------------------------------

/** Returns the best-matching lighting preset for a prompt. Defaults to sunny_day. */
export function detectLightingPreset(prompt: string): LightingPresetName {
  const lower = prompt.toLowerCase()
  let best: LightingPresetName = 'sunny_day'
  let bestScore = 0

  for (const preset of Object.values(LIGHTING_PRESETS)) {
    const score = preset.keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      best = preset.name
    }
  }
  return best
}

export function getLightingPreset(name: LightingPresetName): LightingPreset {
  return LIGHTING_PRESETS[name]
}

// ---------------------------------------------------------------------------
// Luau script generator — generates a complete Lighting setup script
// ---------------------------------------------------------------------------

export function generateLightingLuau(presetName: LightingPresetName): string {
  const p = LIGHTING_PRESETS[presetName]
  const L = p.lighting
  const A = p.atmosphere
  const B = p.bloom
  const C = p.colorCorrection
  const D = p.depthOfField
  const S = p.sunRays

  const r3 = (c: RGB) => `Color3.new(${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)})`

  return `-- Auto-generated lighting preset: ${p.displayName}
-- ${p.description}

local Lighting = game:GetService("Lighting")

-- Lighting service properties
Lighting.Technology = Enum.Technology.${L.technology}
Lighting.Brightness = ${L.brightness}
Lighting.Ambient = ${r3(L.ambient)}
Lighting.OutdoorAmbient = ${r3(L.outdoorAmbient)}
Lighting.ColorShift_Top = ${r3(L.colorShift_Top)}
Lighting.ColorShift_Bottom = ${r3(L.colorShift_Bottom)}
Lighting.TimeOfDay = "${L.timeOfDay}"
Lighting.GeographicLatitude = ${L.geographicLatitude}
Lighting.ShadowSoftness = ${L.shadowSoftness}
Lighting.ExposureCompensation = ${L.exposureCompensation}
Lighting.EnvironmentalDiffuseScale = ${L.environmentalDiffuseScale}
Lighting.EnvironmentalSpecularScale = ${L.environmentalSpecularScale}

-- Atmosphere
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = ${A.density}
atmosphere.Offset = ${A.offset}
atmosphere.Color = ${r3(A.color)}
atmosphere.Decay = ${r3(A.decay)}
atmosphere.Glare = ${A.glare}
atmosphere.Haze = ${A.haze}
atmosphere.Parent = Lighting

${B.enabled ? `-- Bloom post-processing
local bloom = Instance.new("BloomEffect")
bloom.Intensity = ${B.intensity}
bloom.Size = ${B.size}
bloom.Threshold = ${B.threshold}
bloom.Enabled = true
bloom.Parent = Lighting` : '-- Bloom disabled for this preset'}

${C.enabled ? `-- Color Correction
local colorCorrect = Instance.new("ColorCorrectionEffect")
colorCorrect.Brightness = ${C.brightness}
colorCorrect.Contrast = ${C.contrast}
colorCorrect.Saturation = ${C.saturation}
colorCorrect.TintColor = ${r3(C.tintColor)}
colorCorrect.Enabled = true
colorCorrect.Parent = Lighting` : '-- Color correction disabled for this preset'}

${D.enabled ? `-- Depth of Field
local dof = Instance.new("DepthOfFieldEffect")
dof.FocusDistance = ${D.focusDistance}
dof.InFocusRadius = ${D.inFocusRadius}
dof.NearIntensity = ${D.nearIntensity}
dof.FarIntensity = ${D.farIntensity}
dof.Enabled = true
dof.Parent = Lighting` : '-- Depth of Field disabled for this preset'}

${S.enabled ? `-- Sun Rays
local sunRays = Instance.new("SunRaysEffect")
sunRays.Intensity = ${S.intensity}
sunRays.Spread = ${S.spread}
sunRays.Enabled = true
sunRays.Parent = Lighting` : '-- Sun Rays disabled for this preset'}

print("[Lighting] Applied preset: ${p.displayName}")
`
}
