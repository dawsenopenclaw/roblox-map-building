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
 * Add architectural trim, molding, window sills, and gutters.
 * Big visual upgrade for any building with walls.
 */
function injectArchitecturalDetail(code: string): string {
  if (
    code.includes('trim') || code.includes('molding') || code.includes('baseboard') ||
    code.includes('Trim') || code.includes('Molding') || code.includes('Baseboard')
  ) return code

  // Must have wall parts to be worth adding trim
  const hasWalls = /wall/i.test(code)
  const hasGlass = code.includes('"Glass"') || code.includes("'Glass'") || code.includes('SmoothPlastic') || code.includes('Neon')
  const hasRoof = /roof|ceiling/i.test(code)

  if (!hasWalls) return code

  const trimBlock = `
-- ═══ ARCHITECTURAL DETAIL (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0
  -- Crown molding along tops of walls
  for _, part in m:GetDescendants() do
    if part:IsA("BasePart") and part.Name:lower():find("wall") then
      local w, h, d = part.Size.X, part.Size.Y, part.Size.Z
      if h > 4 then
        local crown = Instance.new("Part")
        crown.Name = "crown_molding"
        crown.Anchored = true
        crown.Material = part.Material ~= Enum.Material.SmoothPlastic and part.Material or Enum.Material.Concrete
        crown.Color = Color3.new(
          math.min(1, part.Color.R + 0.12),
          math.min(1, part.Color.G + 0.10),
          math.min(1, part.Color.B + 0.08)
        )
        crown.Size = Vector3.new(w + 0.1, 0.3, d + 0.1)
        crown.CFrame = part.CFrame * CFrame.new(0, h / 2 - 0.15, 0)
        crown.CanCollide = false
        crown.Parent = m
        -- Baseboard at bottom
        local base = crown:Clone()
        base.Name = "baseboard"
        base.Size = Vector3.new(w + 0.05, 0.25, d + 0.05)
        base.CFrame = part.CFrame * CFrame.new(0, -h / 2 + 0.12, 0)
        base.Parent = m
      end
    end
  end
  -- Window sills under glass parts
  if ${hasGlass} then
    for _, part in m:GetDescendants() do
      if part:IsA("BasePart") and (
        part.Material == Enum.Material.Glass or
        part.Transparency > 0.4
      ) and part.Size.Y > 1 then
        local sill = Instance.new("Part")
        sill.Name = "window_sill"
        sill.Anchored = true
        sill.Material = Enum.Material.Concrete
        sill.Color = Color3.fromRGB(210, 205, 195)
        sill.Size = Vector3.new(part.Size.X + 0.4, 0.15, 0.5)
        sill.CFrame = part.CFrame * CFrame.new(0, -part.Size.Y / 2 - 0.07, 0.2)
        sill.CanCollide = false
        sill.Parent = m
      end
    end
  end
  -- Gutters along roof edges
  if ${hasRoof} then
    for _, part in m:GetDescendants() do
      if part:IsA("BasePart") and (part.Name:lower():find("roof") or part.Name:lower():find("ceiling")) then
        local gutter = Instance.new("Part")
        gutter.Name = "gutter"
        gutter.Anchored = true
        gutter.Material = Enum.Material.Metal
        gutter.Color = Color3.fromRGB(100, 105, 110)
        gutter.Size = Vector3.new(part.Size.X + 0.2, 0.2, 0.3)
        gutter.CFrame = part.CFrame * CFrame.new(0, -part.Size.Y / 2, part.Size.Z / 2 + 0.1)
        gutter.CanCollide = false
        gutter.Parent = m
      end
    end
  end
end)
-- ═══ END ARCHITECTURAL DETAIL ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + trimBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + trimBlock + code.slice(lineStart)
  }
  return code
}

/**
 * Inject small lived-in props for indoor/room builds.
 * A book stack, coffee cup, shoes, cables — makes spaces feel occupied.
 */
function injectLivedInProps(code: string): string {
  // Skip if code is already super detailed
  const existingParts = (code.match(/Instance\.new\("Part"\)/g) || []).length
  if (existingParts > 60) return code

  // Only inject for clearly indoor builds
  const indoorKeywords = /room|interior|bedroom|living|kitchen|office|indoor|lounge|hallway|bathroom/i
  if (!indoorKeywords.test(code)) return code

  const propsBlock = `
-- ═══ LIVED-IN PROPS (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0
  local _cx = _sp.X
  local _cz = _sp.Z

  -- Book stack on a surface
  for i = 1, 3 do
    local book = Instance.new("Part")
    book.Name = "book_" .. i
    book.Anchored = true
    book.Material = Enum.Material.SmoothPlastic
    book.Color = Color3.fromRGB(math.random(60,200), math.random(40,160), math.random(40,130))
    book.Size = Vector3.new(0.6, 0.12 + i * 0.02, 0.9)
    book.CFrame = CFrame.new(_cx + 1.2 + i * 0.02, _gy + 0.8 + i * 0.13, _cz + 0.8)
      * CFrame.Angles(0, math.rad(math.random(-8, 8)), 0)
    book.CanCollide = false
    book.Parent = m
  end

  -- Coffee cup (cylinder body + handle)
  local cup = Instance.new("Part")
  cup.Name = "coffee_cup"
  cup.Anchored = true
  cup.Material = Enum.Material.Concrete
  cup.Color = Color3.fromRGB(200, 195, 185)
  cup.Shape = Enum.PartType.Cylinder
  cup.Size = Vector3.new(0.3, 0.45, 0.3)
  cup.CFrame = CFrame.new(_cx - 0.8, _gy + 0.8, _cz + 1.1) * CFrame.Angles(0, 0, math.rad(90))
  cup.CanCollide = false
  cup.Parent = m

  -- Pair of shoes near door area
  for side = -1, 1, 2 do
    local shoe = Instance.new("Part")
    shoe.Name = "shoe_" .. (side == -1 and "left" or "right")
    shoe.Anchored = true
    shoe.Material = Enum.Material.Fabric
    shoe.Color = Color3.fromRGB(30, 30, 35)
    shoe.Size = Vector3.new(0.4, 0.22, 0.85)
    shoe.CFrame = CFrame.new(_cx + side * 0.28, _gy + 0.11, _cz - 2.8)
      * CFrame.Angles(0, math.rad(side * 12), 0)
    shoe.CanCollide = false
    shoe.Parent = m
  end

  -- Cable bundle on floor (thin squished part)
  local cable = Instance.new("Part")
  cable.Name = "cable_bundle"
  cable.Anchored = true
  cable.Material = Enum.Material.SmoothPlastic
  cable.Color = Color3.fromRGB(20, 20, 20)
  cable.Size = Vector3.new(0.08, 0.06, 1.8)
  cable.CFrame = CFrame.new(_cx + 2.1, _gy + 0.03, _cz - 0.5)
    * CFrame.Angles(0, math.rad(15), 0)
  cable.CanCollide = false
  cable.Parent = m

  -- Small rug under furniture area
  local rug = Instance.new("Part")
  rug.Name = "rug"
  rug.Anchored = true
  rug.Material = Enum.Material.Fabric
  rug.Color = Color3.fromRGB(math.random(120,180), math.random(60,110), math.random(40,80))
  rug.Size = Vector3.new(3.5, 0.05, 2.5)
  rug.CFrame = CFrame.new(_cx, _gy + 0.025, _cz)
  rug.CanCollide = false
  rug.Parent = m
end)
-- ═══ END LIVED-IN PROPS ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + propsBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + propsBlock + code.slice(lineStart)
  }
  return code
}

/**
 * Inject weathering detail for rustic/old/medieval builds.
 * Cracks, moss patches, color variation patches on stone/brick.
 */
function injectWeatheringDetail(code: string): string {
  // Skip for modern/sci-fi/futuristic
  if (/modern|sci.?fi|futuristic|cyber|neon|space.?ship|laboratory/i.test(code)) return code

  // Only run for rustic/old builds
  if (!/rustic|medieval|old|ancient|castle|village|ruin|stone|brick|wood|cabin|farm/i.test(code)) return code

  const weatherBlock = `
-- ═══ WEATHERING DETAIL (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0

  -- Crack lines on walls
  for i = 1, 4 do
    local crack = Instance.new("Part")
    crack.Name = "crack_" .. i
    crack.Anchored = true
    crack.Material = Enum.Material.Concrete
    crack.Color = Color3.fromRGB(25, 22, 18)
    crack.Size = Vector3.new(
      0.04,
      math.random(10, 25) * 0.1,
      math.random(3, 8) * 0.1
    )
    local angle = math.rad(math.random(-20, 20))
    crack.CFrame = CFrame.new(
      _sp.X + math.random(-6, 6),
      _gy + math.random(2, 5),
      _sp.Z + math.random(-6, 6)
    ) * CFrame.Angles(0, angle, math.rad(math.random(-15, 15)))
    crack.Transparency = 0.3
    crack.CanCollide = false
    crack.Parent = m
  end

  -- Moss patches at base of structure
  for i = 1, 5 do
    local moss = Instance.new("Part")
    moss.Name = "moss_" .. i
    moss.Anchored = true
    moss.Material = Enum.Material.LeafyGrass
    moss.Color = Color3.fromRGB(
      math.random(35, 65),
      math.random(80, 120),
      math.random(30, 55)
    )
    local angle = math.rad(math.random(0, 360))
    local dist = math.random(3, 7)
    moss.Size = Vector3.new(
      math.random(5, 15) * 0.1,
      0.06,
      math.random(5, 15) * 0.1
    )
    moss.CFrame = CFrame.new(
      _sp.X + math.cos(angle) * dist,
      _gy + 0.03,
      _sp.Z + math.sin(angle) * dist
    )
    moss.Transparency = 0.1
    moss.CanCollide = false
    moss.Parent = m
  end

  -- Subtle color variation patches on walls (darker rectangles)
  for _, part in m:GetDescendants() do
    if part:IsA("BasePart") and part.Name:lower():find("wall") and
       (part.Material == Enum.Material.Brick or part.Material == Enum.Material.SmoothPlastic or
        part.Material == Enum.Material.Concrete or part.Material == Enum.Material.Cobblestone) then
      local stain = Instance.new("Part")
      stain.Name = "stain"
      stain.Anchored = true
      stain.Material = part.Material
      stain.Color = Color3.new(
        math.max(0, part.Color.R - 0.15),
        math.max(0, part.Color.G - 0.12),
        math.max(0, part.Color.B - 0.10)
      )
      local sw = part.Size.X * math.random(2, 5) * 0.1
      local sh = part.Size.Y * math.random(2, 4) * 0.1
      stain.Size = Vector3.new(sw, sh, part.Size.Z + 0.02)
      stain.CFrame = part.CFrame * CFrame.new(
        math.random(-100, 100) * 0.01 * (part.Size.X * 0.3),
        math.random(-60, 60) * 0.01 * (part.Size.Y * 0.3),
        0
      )
      stain.Transparency = 0.55
      stain.CanCollide = false
      stain.CastShadow = false
      stain.Parent = m
      break -- one stain per build pass to keep part count reasonable
    end
  end
end)
-- ═══ END WEATHERING ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + weatherBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + weatherBlock + code.slice(lineStart)
  }
  return code
}

/**
 * Add landscaping: stone path, bushes, flower beds for outdoor builds.
 */
function injectLandscaping(code: string): string {
  if (/garden|bush|flower|landscape/i.test(code)) return code

  // Only for outdoor builds that have terrain or ground parts
  const hasOutdoor = code.includes(':FillBlock') || code.includes(':FillBall') ||
    /ground|terrain|outdoor|yard|field|park|plaza/i.test(code)
  if (!hasOutdoor) return code

  // Skip for interiors-only
  if (/ScreenGui|ServerScriptService|\.Source/.test(code)) return code

  const landscapeBlock = `
-- ═══ LANDSCAPING (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0

  -- Stone path leading to structure (series of flat concrete slabs)
  for i = 0, 7 do
    local slab = Instance.new("Part")
    slab.Name = "path_slab_" .. i
    slab.Anchored = true
    slab.Material = Enum.Material.Concrete
    slab.Color = Color3.fromRGB(
      math.random(145, 165),
      math.random(140, 158),
      math.random(130, 150)
    )
    slab.Size = Vector3.new(
      1.4 + math.random(-2, 2) * 0.1,
      0.18,
      1.4 + math.random(-2, 2) * 0.1
    )
    slab.CFrame = CFrame.new(
      _sp.X + math.random(-15, 15) * 0.03,
      _gy + 0.09,
      _sp.Z + 4 + i * 1.7
    )
    slab.CanCollide = true
    slab.Parent = m
  end

  -- Bushes: 4 round LeafyGrass Ball parts flanking the building
  local bushPositions = {
    Vector3.new(_sp.X - 5, _gy + 0.9, _sp.Z - 3),
    Vector3.new(_sp.X + 5, _gy + 0.9, _sp.Z - 3),
    Vector3.new(_sp.X - 5, _gy + 0.9, _sp.Z + 3),
    Vector3.new(_sp.X + 5, _gy + 0.9, _sp.Z + 3),
  }
  for i, pos in ipairs(bushPositions) do
    local bush = Instance.new("Part")
    bush.Name = "bush_" .. i
    bush.Anchored = true
    bush.Shape = Enum.PartType.Ball
    bush.Material = Enum.Material.LeafyGrass
    bush.Color = Color3.fromRGB(
      math.random(40, 75),
      math.random(100, 145),
      math.random(35, 65)
    )
    local sz = 1.4 + math.random(-3, 3) * 0.1
    bush.Size = Vector3.new(sz, sz, sz)
    bush.CFrame = CFrame.new(pos)
    bush.CanCollide = false
    bush.Parent = m
  end

  -- Flower beds: small colored Ball parts along the front wall
  local flowerColors = {
    Color3.fromRGB(230, 60, 60),   -- red
    Color3.fromRGB(240, 180, 30),  -- yellow
    Color3.fromRGB(200, 80, 200),  -- purple
    Color3.fromRGB(255, 130, 50),  -- orange
    Color3.fromRGB(230, 220, 255), -- pale lavender
  }
  for i = 1, 8 do
    local flower = Instance.new("Part")
    flower.Name = "flower_" .. i
    flower.Anchored = true
    flower.Shape = Enum.PartType.Ball
    flower.Material = Enum.Material.Neon
    flower.Color = flowerColors[((i - 1) % #flowerColors) + 1]
    flower.Size = Vector3.new(0.35, 0.35, 0.35)
    flower.CFrame = CFrame.new(
      _sp.X - 4 + i * 1.0,
      _gy + 0.2,
      _sp.Z - 4.5
    )
    flower.CanCollide = false
    flower.CastShadow = false
    flower.Parent = m

    -- Stem
    local stem = Instance.new("Part")
    stem.Name = "stem_" .. i
    stem.Anchored = true
    stem.Material = Enum.Material.Grass
    stem.Color = Color3.fromRGB(50, 120, 40)
    stem.Size = Vector3.new(0.08, 0.4, 0.08)
    stem.CFrame = CFrame.new(
      _sp.X - 4 + i * 1.0,
      _gy + 0.02,
      _sp.Z - 4.5
    )
    stem.CanCollide = false
    stem.Parent = m
  end
end)
-- ═══ END LANDSCAPING ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + landscapeBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + landscapeBlock + code.slice(lineStart)
  }
  return code
}

/**
 * Inject basic interior furniture if the build has walls+roof but is empty inside.
 */
function injectInteriorIfMissing(code: string): string {
  const hasFurniture = /table|chair|bed|desk|couch|sofa|lamp|cabinet|shelf/i.test(code)
  if (hasFurniture) return code

  // Must have enclosed structure (walls + roof)
  const hasWalls = /wall/i.test(code)
  const hasRoof = /roof|ceiling/i.test(code)
  if (!hasWalls || !hasRoof) return code

  const furnitureBlock = `
-- ═══ BASIC INTERIOR FURNITURE (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0

  -- Table (flat top + 4 legs)
  local tableTop = Instance.new("Part")
  tableTop.Name = "table_top"
  tableTop.Anchored = true
  tableTop.Material = Enum.Material.Wood
  tableTop.Color = Color3.fromRGB(140, 100, 60)
  tableTop.Size = Vector3.new(3, 0.15, 1.6)
  tableTop.CFrame = CFrame.new(_sp.X, _gy + 2.5, _sp.Z)
  tableTop.Parent = m

  for lx = -1, 1, 2 do
    for lz = -1, 1, 2 do
      local leg = Instance.new("Part")
      leg.Name = "table_leg"
      leg.Anchored = true
      leg.Material = Enum.Material.Wood
      leg.Color = Color3.fromRGB(120, 85, 50)
      leg.Size = Vector3.new(0.15, 2.42, 0.15)
      leg.CFrame = CFrame.new(_sp.X + lx * 1.3, _gy + 1.21, _sp.Z + lz * 0.65)
      leg.Parent = m
    end
  end

  -- 2 Chairs (seat + back + 4 legs each)
  for side = -1, 1, 2 do
    local seat = Instance.new("Part")
    seat.Name = "chair_seat"
    seat.Anchored = true
    seat.Material = Enum.Material.Fabric
    seat.Color = Color3.fromRGB(80, 65, 55)
    seat.Size = Vector3.new(1.0, 0.12, 1.0)
    seat.CFrame = CFrame.new(_sp.X + side * 2.8, _gy + 1.5, _sp.Z)
    seat.Parent = m

    local back = Instance.new("Part")
    back.Name = "chair_back"
    back.Anchored = true
    back.Material = Enum.Material.Fabric
    back.Color = Color3.fromRGB(80, 65, 55)
    back.Size = Vector3.new(1.0, 1.1, 0.1)
    back.CFrame = CFrame.new(_sp.X + side * 2.8, _gy + 2.1, _sp.Z - 0.45)
    back.Parent = m

    for cx = -1, 1, 2 do
      for cz = -1, 1, 2 do
        local cleg = Instance.new("Part")
        cleg.Name = "chair_leg"
        cleg.Anchored = true
        cleg.Material = Enum.Material.Wood
        cleg.Color = Color3.fromRGB(70, 55, 40)
        cleg.Size = Vector3.new(0.1, 1.5, 0.1)
        cleg.CFrame = CFrame.new(
          _sp.X + side * 2.8 + cx * 0.4,
          _gy + 0.75,
          _sp.Z + cz * 0.4
        )
        cleg.Parent = m
      end
    end
  end

  -- Floor lamp (thin pole + ball shade + PointLight)
  local lampPole = Instance.new("Part")
  lampPole.Name = "lamp_pole"
  lampPole.Anchored = true
  lampPole.Material = Enum.Material.Metal
  lampPole.Color = Color3.fromRGB(50, 50, 55)
  lampPole.Size = Vector3.new(0.12, 4.5, 0.12)
  lampPole.CFrame = CFrame.new(_sp.X - 3.5, _gy + 2.25, _sp.Z - 2.5)
  lampPole.Parent = m

  local lampShade = Instance.new("Part")
  lampShade.Name = "lamp_shade"
  lampShade.Anchored = true
  lampShade.Shape = Enum.PartType.Ball
  lampShade.Material = Enum.Material.Neon
  lampShade.Color = Color3.fromRGB(255, 230, 180)
  lampShade.Size = Vector3.new(0.9, 0.9, 0.9)
  lampShade.CFrame = CFrame.new(_sp.X - 3.5, _gy + 4.6, _sp.Z - 2.5)
  lampShade.CanCollide = false
  lampShade.Parent = m

  local lampLight = Instance.new("PointLight")
  lampLight.Brightness = 2
  lampLight.Range = 25
  lampLight.Color = Color3.fromRGB(255, 220, 160)
  lampLight.Parent = lampShade
end)
-- ═══ END INTERIOR FURNITURE ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + furnitureBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + furnitureBlock + code.slice(lineStart)
  }
  return code
}

/**
 * Add door frames, handles, and doormats to any detected door parts.
 */
function injectDoorDetail(code: string): string {
  if (/frame|handle|knob|doormat/i.test(code)) return code

  // Must have a door to be worth adding detail
  if (!/\bdoor\b/i.test(code)) return code

  const doorBlock = `
-- ═══ DOOR DETAIL (auto-injected) ═══
pcall(function()
  local _sp = sp or Vector3.new(0,0,0)
  local _gy = gy or groundY or 0

  for _, part in m:GetDescendants() do
    if part:IsA("BasePart") and part.Name:lower():find("door") then
      local pw, ph, pd = part.Size.X, part.Size.Y, part.Size.Z

      -- Door frame (top bar + two side posts)
      local frameTop = Instance.new("Part")
      frameTop.Name = "door_frame_top"
      frameTop.Anchored = true
      frameTop.Material = Enum.Material.Wood
      frameTop.Color = Color3.fromRGB(
        math.min(255, part.Color.R * 255 + 25),
        math.min(255, part.Color.G * 255 + 20),
        math.min(255, part.Color.B * 255 + 15)
      )
      frameTop.Size = Vector3.new(pw + 0.4, 0.3, pd + 0.1)
      frameTop.CFrame = part.CFrame * CFrame.new(0, ph / 2 + 0.15, 0)
      frameTop.CanCollide = false
      frameTop.Parent = m

      for side = -1, 1, 2 do
        local post = Instance.new("Part")
        post.Name = "door_frame_post"
        post.Anchored = true
        post.Material = Enum.Material.Wood
        post.Color = frameTop.Color
        post.Size = Vector3.new(0.2, ph + 0.3, pd + 0.1)
        post.CFrame = part.CFrame * CFrame.new(side * (pw / 2 + 0.1), 0, 0)
        post.CanCollide = false
        post.Parent = m
      end

      -- Door handle (small Metal ball)
      local handle = Instance.new("Part")
      handle.Name = "door_handle"
      handle.Anchored = true
      handle.Shape = Enum.PartType.Ball
      handle.Material = Enum.Material.Metal
      handle.Color = Color3.fromRGB(200, 175, 100)
      handle.Size = Vector3.new(0.22, 0.22, 0.22)
      handle.CFrame = part.CFrame * CFrame.new(pw * 0.35, -0.3, pd / 2 + 0.11)
      handle.CanCollide = false
      handle.Parent = m

      -- Doormat (thin Fabric slab on floor in front)
      local mat = Instance.new("Part")
      mat.Name = "doormat"
      mat.Anchored = true
      mat.Material = Enum.Material.Fabric
      mat.Color = Color3.fromRGB(80, 55, 35)
      mat.Size = Vector3.new(pw + 0.4, 0.06, 0.9)
      mat.CFrame = CFrame.new(
        part.Position.X,
        _gy + 0.03,
        part.Position.Z + pd / 2 + 0.55
      )
      mat.CanCollide = false
      mat.Parent = m

      break -- one door's worth of detail per pass
    end
  end
end)
-- ═══ END DOOR DETAIL ═══
`
  const finalize = code.indexOf('m.Parent = workspace')
  if (finalize !== -1) {
    return code.slice(0, finalize) + doorBlock + '\n' + code.slice(finalize)
  }
  const finish = code.indexOf('FinishRecording')
  if (finish !== -1) {
    const lineStart = code.lastIndexOf('\n', finish)
    return code.slice(0, lineStart) + doorBlock + code.slice(lineStart)
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

  // 7. Architectural detail (crown molding, baseboards, window sills, gutters)
  const beforeArch = amplified.length
  amplified = injectArchitecturalDetail(amplified)
  if (amplified.length > beforeArch) injections.push('architectural detail (molding, sills, gutters)')

  // 8. Lived-in props (books, coffee cup, shoes, cables, rug)
  const beforeProps = amplified.length
  amplified = injectLivedInProps(amplified)
  if (amplified.length > beforeProps) injections.push('lived-in props (books, cup, shoes, cables)')

  // 9. Weathering (cracks, moss, color variation patches)
  const beforeWeather = amplified.length
  amplified = injectWeatheringDetail(amplified)
  if (amplified.length > beforeWeather) injections.push('weathering detail (cracks, moss, stains)')

  // 10. Landscaping (stone path, bushes, flower beds)
  const beforeLandscape = amplified.length
  amplified = injectLandscaping(amplified)
  if (amplified.length > beforeLandscape) injections.push('landscaping (path, bushes, flowers)')

  // 11. Interior furniture if missing
  const beforeInterior = amplified.length
  amplified = injectInteriorIfMissing(amplified)
  if (amplified.length > beforeInterior) injections.push('basic interior furniture (table, chairs, lamp)')

  // 12. Door detail (frame, handle, doormat)
  const beforeDoor = amplified.length
  amplified = injectDoorDetail(amplified)
  if (amplified.length > beforeDoor) injections.push('door detail (frame, handle, doormat)')

  console.log(`[BuildAmplifier] ${injections.length} enhancements: ${injections.join(', ')}`)
  return { code: amplified, injections }
}
