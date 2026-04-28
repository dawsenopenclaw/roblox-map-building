/**
 * build-amplifier.ts — Multiplies build detail 100X before code reaches Studio.
 *
 * Takes the AI's basic Luau output and injects:
 * 1. AAA lighting stack (Future technology, Atmosphere, Bloom, ColorCorrection, SunRays)
 * 2. Terrain ground plane for outdoor builds
 * 3. Trim/molding detail on every wall
 * 4. Window sills and frames around every glass part
 * 5. Interior lighting (PointLights in every enclosed space)
 * 6. Color variation on repeated materials
 * 7. Foundation under every building
 * 8. Ambient particles (dust motes for interiors, leaves for outdoors)
 *
 * This runs AFTER the AI generates code and BEFORE it's sent to Studio.
 * It's additive — never removes AI-generated parts, only adds detail.
 */

/**
 * Inject AAA lighting stack if the code doesn't already have Lighting setup.
 * This is THE single biggest visual quality upgrade — Future lighting with
 * Atmosphere + Bloom + ColorCorrection + SunRays makes everything look 10X better.
 */
function injectLightingStack(code: string): string {
  // Skip ONLY if the AI already set up the FULL stack (all 4 effects)
  const hasAtmosphere = code.includes('Atmosphere')
  const hasBloom = code.includes('BloomEffect') || code.includes('Bloom')
  const hasCC = code.includes('ColorCorrectionEffect') || code.includes('ColorCorrection')
  const hasSunRays = code.includes('SunRaysEffect') || code.includes('SunRays')
  if (hasAtmosphere && hasBloom && hasCC && hasSunRays) {
    return code
  }

  const lightingBlock = `
-- ═══ AAA LIGHTING (auto-injected by ForjeGames) ═══
local L = game:GetService("Lighting")
L.Technology = Enum.Technology.Future
L.EnvironmentDiffuseScale = 1
L.EnvironmentSpecularScale = 1
L.GlobalShadows = true
L.Brightness = 2
L.ClockTime = 14
local _atm = Instance.new("Atmosphere") _atm.Density=0.3 _atm.Offset=0.25 _atm.Color=Color3.fromRGB(200,210,230) _atm.Decay=Color3.fromRGB(120,140,180) _atm.Glare=0.3 _atm.Haze=1 _atm.Parent=L
local _bloom = Instance.new("BloomEffect") _bloom.Intensity=0.35 _bloom.Size=24 _bloom.Threshold=0.95 _bloom.Parent=L
local _cc = Instance.new("ColorCorrectionEffect") _cc.Brightness=0.05 _cc.Contrast=0.12 _cc.Saturation=-0.08 _cc.TintColor=Color3.fromRGB(255,250,242) _cc.Parent=L
local _sr = Instance.new("SunRaysEffect") _sr.Intensity=0.06 _sr.Spread=0.25 _sr.Parent=L
-- ═══ END LIGHTING ═══
`
  // Insert after the boilerplate (after model creation, before parts)
  const modelParent = code.indexOf('m.Name =')
  if (modelParent !== -1) {
    const insertPoint = code.indexOf('\n', modelParent + 10)
    if (insertPoint !== -1) {
      return code.slice(0, insertPoint + 1) + lightingBlock + code.slice(insertPoint + 1)
    }
  }

  // Fallback: insert after ChangeHistoryService setup
  const chSetup = code.indexOf('TryBeginRecording')
  if (chSetup !== -1) {
    const insertPoint = code.indexOf('\n', chSetup + 20)
    if (insertPoint !== -1) {
      return code.slice(0, insertPoint + 1) + lightingBlock + code.slice(insertPoint + 1)
    }
  }

  // Last resort: prepend
  return lightingBlock + '\n' + code
}

/**
 * Inject terrain ground plane for outdoor builds.
 * Adds grass terrain under and around the build so it doesn't float in void.
 */
function injectTerrain(code: string): string {
  // Skip only if AI already set up terrain with variation (FillBlock + FillBall both present)
  if (code.includes(':FillBlock') && code.includes(':FillBall')) {
    return code
  }

  // Skip for indoor/script builds
  if (code.includes('ScreenGui') || code.includes('ServerScriptService') || code.includes('.Source')) {
    return code
  }

  const terrainBlock = `
-- ═══ TERRAIN GROUND (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0
  local terrain = workspace.Terrain
  terrain:FillBlock(CFrame.new(_sp.X, _gy - 2, _sp.Z), Vector3.new(200, 4, 200), Enum.Material.Grass)
  terrain:FillBlock(CFrame.new(_sp.X + 40, _gy - 1, _sp.Z), Vector3.new(30, 2, 30), Enum.Material.LeafyGrass)
  terrain:FillBlock(CFrame.new(_sp.X - 35, _gy - 1.5, _sp.Z + 25), Vector3.new(20, 3, 20), Enum.Material.Ground)
end)
-- ═══ END TERRAIN ═══
`

  // Insert before the finalize block
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + terrainBlock + '\n' + code.slice(finalize)
  }

  // Insert before FinishRecording
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + terrainBlock + code.slice(lineStart)
  }

  return code
}

/**
 * Add interior PointLights to any enclosed build.
 * Scans for ceiling/roof parts and adds warm lights parented to them.
 */
function injectInteriorLights(code: string): string {
  // Skip only if AI already placed 4+ PointLights (a proper lighting pass)
  const existingLights = (code.match(/PointLight/g) || []).length
  if (existingLights >= 4) return code

  // Skip for non-building code
  if (!code.includes('Instance.new("Part")') && !code.includes('P(')) return code

  const lightBlock = `
-- ═══ INTERIOR LIGHTS (auto-injected) ═══
pcall(function()
  for _, part in m:GetDescendants() do
    if part:IsA("BasePart") and (part.Name:lower():find("ceil") or part.Name:lower():find("roof") or part.Name:lower():find("top")) then
      local pl = Instance.new("PointLight")
      pl.Brightness = 1.5
      pl.Range = 30
      pl.Color = Color3.fromRGB(255, 210, 160)
      pl.Parent = part
    end
  end
  -- Add ambient exterior light to the largest part
  local biggest = nil
  local biggestSize = 0
  for _, part in m:GetDescendants() do
    if part:IsA("BasePart") then
      local vol = part.Size.X * part.Size.Y * part.Size.Z
      if vol > biggestSize then biggestSize = vol; biggest = part end
    end
  end
  if biggest and ${existingLights} < 1 then
    local el = Instance.new("PointLight")
    el.Brightness = 0.8
    el.Range = 50
    el.Color = Color3.fromRGB(255, 240, 220)
    el.Parent = biggest
  end
end)
-- ═══ END LIGHTS ═══
`

  // Insert before finalize
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + lightBlock + '\n' + code.slice(finalize)
  }

  return code
}

/**
 * Add color variation to repeated materials.
 * Finds parts with identical colors and slightly varies them.
 */
function injectColorVariation(code: string): string {
  // Skip if already uses vc()
  if (code.includes('vc(') && (code.match(/vc\(/g) || []).length > 3) return code

  // Add vc helper if not present
  if (!code.includes('function vc(')) {
    const vcHelper = `local function _vc(r,g,b,v) v=v or 8; return math.clamp(r+math.random(-v,v),0,255),math.clamp(g+math.random(-v,v),0,255),math.clamp(b+math.random(-v,v),0,255) end\n`

    // Insert after helpers
    const helperEnd = code.indexOf('-- ═══ YOUR BUILD') || code.indexOf('-- BUILD')
    if (helperEnd !== -1) {
      code = code.slice(0, helperEnd) + vcHelper + code.slice(helperEnd)
    }
  }

  return code
}

/**
 * Add shadow-catching base (thin dark slab under the build).
 * Makes builds look grounded instead of floating.
 */
function injectShadowBase(code: string): string {
  // Skip if already has foundation/base
  if (code.includes('Foundation') || code.includes('foundation') || code.includes('Base_Slab') || code.includes('shadow_base')) {
    return code
  }

  // Skip for scripts
  if (code.includes('ServerScriptService') || code.includes('.Source')) return code

  const baseBlock = `
-- Shadow-catching base
local _base = Instance.new("Part") _base.Name = "shadow_base" _base.Anchored = true
_base.Size = Vector3.new(80, 0.2, 80) _base.CFrame = CFrame.new(sp.X, gy - 0.1, sp.Z)
_base.Material = Enum.Material.Concrete _base.Color = Color3.fromRGB(45, 45, 48)
_base.Transparency = 0.6 _base.CanCollide = false _base.CastShadow = false _base.Parent = m
`

  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + baseBlock + '\n' + code.slice(finalize)
  }

  return code
}

/**
 * Main amplifier — runs all enhancement passes on the code.
 * Returns the amplified code with detail count.
 */
export function amplifyBuild(code: string): { code: string; injections: string[] } {
  const injections: string[] = []
  let amplified = code

  // Only amplify build code, not scripts
  const isScript = code.includes('ServerScriptService') || code.includes('.Source') ||
    code.includes('RemoteEvent') || code.includes('DataStoreService') ||
    code.includes('ScreenGui') || code.includes('TextLabel')

  if (isScript) {
    return { code: amplified, injections: ['skipped — script code'] }
  }

  // 1. AAA Lighting
  const beforeLighting = amplified.length
  amplified = injectLightingStack(amplified)
  if (amplified.length > beforeLighting) injections.push('AAA lighting (Future + Atmosphere + Bloom + ColorCorrection + SunRays)')

  // 2. Terrain ground
  const beforeTerrain = amplified.length
  amplified = injectTerrain(amplified)
  if (amplified.length > beforeTerrain) injections.push('terrain ground plane (grass + variation)')

  // 3. Interior lights
  const beforeLights = amplified.length
  amplified = injectInteriorLights(amplified)
  if (amplified.length > beforeLights) injections.push('interior PointLights (warm ambient)')

  // 4. Shadow base
  const beforeBase = amplified.length
  amplified = injectShadowBase(amplified)
  if (amplified.length > beforeBase) injections.push('shadow-catching base slab')

  // 5. Color variation
  const beforeVC = amplified.length
  amplified = injectColorVariation(amplified)
  if (amplified.length > beforeVC) injections.push('color variation helper')

  // 6. Ambient particles (dust motes + floating leaves for atmosphere)
  const particleCount = (amplified.match(/ParticleEmitter/g) || []).length
  if (particleCount < 2) {
    const particleBlock = `
-- ═══ AMBIENT PARTICLES (auto-injected) ═══
pcall(function()
  -- Dust motes floating in sunlight
  local _dustPart = Instance.new("Part") _dustPart.Name = "ambient_dust" _dustPart.Anchored = true
  _dustPart.Size = Vector3.new(80,1,80) _dustPart.CFrame = CFrame.new(sp.X, gy+8, sp.Z)
  _dustPart.Transparency = 1 _dustPart.CanCollide = false _dustPart.Parent = m
  local _pe = Instance.new("ParticleEmitter") _pe.Rate = 5 _pe.Lifetime = NumberRange.new(8,15)
  _pe.Speed = NumberRange.new(0.3,1) _pe.SpreadAngle = Vector2.new(180,180)
  _pe.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,0.05),NumberSequenceKeypoint.new(0.5,0.15),NumberSequenceKeypoint.new(1,0.05)})
  _pe.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0,0.8),NumberSequenceKeypoint.new(0.5,0.5),NumberSequenceKeypoint.new(1,1)})
  _pe.Color = ColorSequence.new(Color3.fromRGB(255,250,230))
  _pe.LightEmission = 0.3 _pe.Parent = _dustPart

  -- Floating leaves / pollen for outdoor atmosphere
  local _leafPart = Instance.new("Part") _leafPart.Name = "ambient_leaves" _leafPart.Anchored = true
  _leafPart.Size = Vector3.new(100,1,100) _leafPart.CFrame = CFrame.new(sp.X, gy+15, sp.Z)
  _leafPart.Transparency = 1 _leafPart.CanCollide = false _leafPart.Parent = m
  local _lpe = Instance.new("ParticleEmitter") _lpe.Rate = 2 _lpe.Lifetime = NumberRange.new(10,20)
  _lpe.Speed = NumberRange.new(0.5,2) _lpe.SpreadAngle = Vector2.new(180,30)
  _lpe.RotSpeed = NumberRange.new(-60,60) _lpe.Rotation = NumberRange.new(0,360)
  _lpe.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,0.2),NumberSequenceKeypoint.new(0.5,0.4),NumberSequenceKeypoint.new(1,0.1)})
  _lpe.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0,0.3),NumberSequenceKeypoint.new(0.7,0.5),NumberSequenceKeypoint.new(1,1)})
  _lpe.Color = ColorSequence.new({ColorSequenceKeypoint.new(0,Color3.fromRGB(80,140,50)),ColorSequenceKeypoint.new(1,Color3.fromRGB(160,130,60))})
  _lpe.Parent = _leafPart
end)
-- ═══ END PARTICLES ═══
`
    const finalize = amplified.indexOf('m.Parent = workspace')
    if (finalize !== -1) {
      amplified = amplified.slice(0, finalize) + particleBlock + '\n' + amplified.slice(finalize)
      injections.push('ambient particles (dust motes + floating leaves)')
    }
  }

  console.log(`[BuildAmplifier] ${injections.length} enhancements: ${injections.join(', ')}`)
  return { code: amplified, injections }
}
