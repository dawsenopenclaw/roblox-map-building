/**
 * VFX & Particle Bible — 100+ visual effect recipes with exact ParticleEmitter properties.
 * ForjeGames AI Knowledge Base — teaches AI to produce production-quality Roblox VFX.
 */

// ============================================================
// FIRE EFFECTS
// ============================================================
export const VFX_FIRE: string = `
=== FIRE VFX BIBLE ===

--- EFFECT: CAMPFIRE ---
Setup: Part named "FireBase", Size 2x0.2x2, Anchored, BrickColor "Dark orange"
Three layered ParticleEmitters inside FireBase:

LAYER 1 — Core Flame (child ParticleEmitter named "CoreFlame"):
  Texture = "rbxassetid://1266170131"   -- soft wisp/flame texture
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 60,  0)),    -- deep red-orange at base
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 140, 0)),    -- orange mid
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 220, 50)),   -- yellow tip
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 180)),  -- white-yellow at top
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.3, 0.6),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 40
  Lifetime = NumberRange.new(0.6, 1.1)
  Speed = NumberRange.new(3, 5)
  SpreadAngle = Vector2.new(15, 15)
  RotSpeed = NumberRange.new(-30, 30)
  Rotation = NumberRange.new(0, 360)
  Drag = 2
  Acceleration = Vector3.new(0, 1, 0)
  EmissionDirection = Enum.NormalId.Top
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Volume
  Enabled = true
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

LAYER 2 — Outer Glow (child ParticleEmitter named "OuterGlow"):
  Texture = "rbxassetid://243160943"   -- round soft glow
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 60,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 30,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.7),
    NumberSequenceKeypoint.new(0.5, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.2),
    NumberSequenceKeypoint.new(0.5, 1.8),
    NumberSequenceKeypoint.new(1,   0.5),
  })
  Rate = 15
  Lifetime = NumberRange.new(0.4, 0.8)
  Speed = NumberRange.new(1, 2)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-15, 15)
  Rotation = NumberRange.new(0, 360)
  Drag = 3
  Acceleration = Vector3.new(0, 0.5, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = -0.5

LAYER 3 — Ember Sparks (child ParticleEmitter named "Embers"):
  Texture = "rbxassetid://1295938486"   -- tiny bright dot
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(150, 50,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 10
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(4, 9)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0.5
  Acceleration = Vector3.new(0.5, 2, 0.5)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 1

Lua snippet to place campfire:
  local fire = Instance.new("Part")
  fire.Name = "FireBase"
  fire.Size = Vector3.new(2, 0.2, 2)
  fire.Anchored = true
  fire.BrickColor = BrickColor.new("Dark orange")
  fire.Material = Enum.Material.SmoothPlastic
  fire.CastShadow = false
  -- attach a PointLight for ambient glow
  local light = Instance.new("PointLight")
  light.Brightness = 5
  light.Color = Color3.fromRGB(255, 120, 30)
  light.Range = 16
  light.Shadows = true
  light.Parent = fire
  fire.Parent = workspace


--- EFFECT: TORCH FLAME ---
Setup: Part named "TorchHead", Size 0.4x0.4x0.4, Anchored

ParticleEmitter named "TorchFire":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 80,  0)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 160, 0)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 230, 100)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.85,0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.25),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 25
  Lifetime = NumberRange.new(0.4, 0.7)
  Speed = NumberRange.new(2, 4)
  SpreadAngle = Vector2.new(10, 10)
  RotSpeed = NumberRange.new(-20, 20)
  Rotation = NumberRange.new(0, 360)
  Drag = 2.5
  Acceleration = Vector3.new(0, 1.5, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.9
  LightInfluence = 0.1
  ZOffset = 0

PointLight on TorchHead:
  Brightness = 3
  Color = Color3.fromRGB(255, 110, 20)
  Range = 12
  Shadows = true


--- EFFECT: BONFIRE (large outdoor fire) ---
Setup: Part "BonfireBase", Size 4x0.3x4, Anchored

LAYER 1 — MainFlame:
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 40,  0)),
    ColorSequenceKeypoint.new(0.25,Color3.fromRGB(255, 120, 0)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.3, 0.0),
    NumberSequenceKeypoint.new(0.75,0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.3, 1.6),
    NumberSequenceKeypoint.new(0.7, 1.3),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  Rate = 80
  Lifetime = NumberRange.new(1.0, 1.8)
  Speed = NumberRange.new(5, 9)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(-25, 25)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.5
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 0.85
  LightInfluence = 0.15

LAYER 2 — Smoke rising:
  Texture = "rbxassetid://255112629"   -- soft cloud/smoke texture
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80, 70, 60)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(120,110,100)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180,170,160)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 1.5),
    NumberSequenceKeypoint.new(1,   3.0),
  })
  Rate = 12
  Lifetime = NumberRange.new(3.0, 6.0)
  Speed = NumberRange.new(2, 4)
  SpreadAngle = Vector2.new(15, 15)
  RotSpeed = NumberRange.new(-10, 10)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.3
  Acceleration = Vector3.new(0.3, 1, 0)
  LightEmission = 0.0
  LightInfluence = 1.0

LAYER 3 — Heavy Embers:
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 230, 80)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 120, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 40,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.6, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.12),
    NumberSequenceKeypoint.new(0.5, 0.10),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 20
  Lifetime = NumberRange.new(2.0, 4.5)
  Speed = NumberRange.new(5, 14)
  SpreadAngle = Vector2.new(50, 50)
  Drag = 0.4
  Acceleration = Vector3.new(1, 3, 1)
  LightEmission = 1.0


--- EFFECT: INFERNO / WILDFIRE (large destructive fire) ---
Setup: Multiple Parts arranged in a line/area, each with this emitter

ParticleEmitter "InfernoFlame":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 20,  0)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 60,  0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 140, 0)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 210, 60)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.5),
    NumberSequenceKeypoint.new(0.4, 3.0),
    NumberSequenceKeypoint.new(0.7, 2.5),
    NumberSequenceKeypoint.new(1,   0.4),
  })
  Rate = 150
  Lifetime = NumberRange.new(1.5, 2.5)
  Speed = NumberRange.new(8, 15)
  SpreadAngle = Vector2.new(25, 25)
  RotSpeed = NumberRange.new(-40, 40)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0, 3, 0)
  LightEmission = 1.0
  LightInfluence = 0.0

ParticleEmitter "InfernoSmoke":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(30,  25,  20)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(60,  55,  50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 90,  80)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(0.8, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(0.5, 4.0),
    NumberSequenceKeypoint.new(1,   7.0),
  })
  Rate = 25
  Lifetime = NumberRange.new(5.0, 10.0)
  Speed = NumberRange.new(3, 7)
  SpreadAngle = Vector2.new(20, 20)
  Drag = 0.2
  Acceleration = Vector3.new(0.5, 1.5, 0)
  LightEmission = 0.0
  LightInfluence = 1.0


--- EFFECT: CANDLE FLAME (tiny, delicate) ---
Setup: Part "CandleTop", Size 0.15x0.15x0.15

ParticleEmitter "CandleFlame":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 90,  0)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 170, 20)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 240, 160)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 240)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.04),
    NumberSequenceKeypoint.new(0.3, 0.09),
    NumberSequenceKeypoint.new(0.7, 0.07),
    NumberSequenceKeypoint.new(1,   0.01),
  })
  Rate = 15
  Lifetime = NumberRange.new(0.3, 0.5)
  Speed = NumberRange.new(0.5, 1.2)
  SpreadAngle = Vector2.new(5, 5)
  RotSpeed = NumberRange.new(-15, 15)
  Rotation = NumberRange.new(0, 360)
  Drag = 3
  Acceleration = Vector3.new(0, 0.8, 0)
  LightEmission = 0.7
  LightInfluence = 0.3
  ZOffset = 0

PointLight:
  Brightness = 1.2
  Color = Color3.fromRGB(255, 150, 40)
  Range = 6
  Shadows = false


--- EFFECT: LANTERN (enclosed, warm) ---
Setup: Part "LanternGlow", Size 0.5x0.7x0.5, Material Glass, Transparency 0.5

ParticleEmitter "LanternFlicker":
  Texture = "rbxassetid://243160943"   -- soft round glow
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 180, 60)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 140, 30)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 100, 10)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 0.3),
    NumberSequenceKeypoint.new(1,   0.9),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.5),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  Rate = 8
  Lifetime = NumberRange.new(0.5, 0.9)
  Speed = NumberRange.new(0.2, 0.6)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(-20, 20)
  Drag = 5
  Acceleration = Vector3.new(0, 0.3, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0

PointLight:
  Brightness = 2
  Color = Color3.fromRGB(255, 160, 50)
  Range = 10
  Shadows = true


--- EFFECT: EXPLOSION FIREBALL ---
Setup: Triggered on event, Part "ExplosionCenter" created at impact point, destroyed after 2s

LAYER 1 — Fireball Core:
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(200, 30,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  20,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.1, 4.0),
    NumberSequenceKeypoint.new(0.4, 6.0),
    NumberSequenceKeypoint.new(0.7, 5.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Rate = 0   -- use Emit(50) for burst
  Lifetime = NumberRange.new(0.6, 1.2)
  Speed = NumberRange.new(5, 20)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-60, 60)
  Rotation = NumberRange.new(0, 360)
  Drag = 2
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 1.0
  LightInfluence = 0.0

LAYER 2 — Black Smoke:
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(20, 15, 10)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(50, 40, 35)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(90, 80, 70)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(0.5, 5.0),
    NumberSequenceKeypoint.new(1,   9.0),
  })
  Rate = 0   -- Emit(30)
  Lifetime = NumberRange.new(2.0, 4.0)
  Speed = NumberRange.new(3, 10)
  SpreadAngle = Vector2.new(90, 90)
  Drag = 0.5
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 0.0
  LightInfluence = 1.0

LAYER 3 — Debris Sparks:
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 240, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 140, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(150, 50,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.8, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 0   -- Emit(80)
  Lifetime = NumberRange.new(1.0, 2.5)
  Speed = NumberRange.new(10, 30)
  SpreadAngle = Vector2.new(180, 180)
  Drag = 0.3
  Acceleration = Vector3.new(0, -15, 0)   -- gravity pull
  LightEmission = 1.0

Lua burst trigger:
  local function explode(position)
    local part = Instance.new("Part")
    part.Size = Vector3.new(1,1,1)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = position
    part.Parent = workspace
    -- (attach emitters as above, then:)
    for _, emitter in ipairs(part:GetDescendants()) do
      if emitter:IsA("ParticleEmitter") then
        emitter:Emit(emitter == CoreEmitter and 50 or emitter == SmokeEmitter and 30 or 80)
      end
    end
    game:GetService("Debris"):AddItem(part, 5)
  end


--- EFFECT: EMBER DRIFT (embers rising from heat source, ambient) ---
Setup: Invisible Part at ground level

ParticleEmitter "EmberDrift":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 60)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 100, 10)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(180, 40,   0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 20,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.07),
    NumberSequenceKeypoint.new(0.5, 0.05),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 6
  Lifetime = NumberRange.new(3.0, 7.0)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(25, 25)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0.2
  Acceleration = Vector3.new(0.8, 2.5, 0.4)
  LightEmission = 1.0
  LightInfluence = 0.0


--- EFFECT: MATCH STRIKE (brief flash then small flame) ---
Setup: Scripted sequence — burst emitter then switch to slow burn

Phase 1 — Ignition Flash (Emit once):
  ParticleEmitter "MatchFlash":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 200)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 200, 50)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.0),
      NumberSequenceKeypoint.new(1, 1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.5),
      NumberSequenceKeypoint.new(1, 0.0),
    })
    Rate = 0  -- Emit(5)
    Lifetime = NumberRange.new(0.1, 0.2)
    Speed = NumberRange.new(1, 3)
    SpreadAngle = Vector2.new(90, 90)
    LightEmission = 1.0

Phase 2 — Tiny Flame (enable after 0.1s):
  ParticleEmitter "MatchFlame":
    (same as CandleFlame but Rate = 8, Size 50% smaller)


--- EFFECT: FIREPLACE (indoor, contained, warm ambiance) ---
Setup: FireplaceBase Part 3x0.3x1, logs visible underneath

LAYER 1 — MainFlame:
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 50,  0)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 130, 0)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 250, 180)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 0.9),
    NumberSequenceKeypoint.new(0.7, 0.7),
    NumberSequenceKeypoint.new(1,   0.15),
  })
  Rate = 45
  Lifetime = NumberRange.new(0.7, 1.2)
  Speed = NumberRange.new(2, 5)
  SpreadAngle = Vector2.new(12, 35)   -- narrow X, wide along logs
  Drag = 2
  Acceleration = Vector3.new(0, 1.5, 0)
  LightEmission = 0.85
  LightInfluence = 0.15

LAYER 2 — Smoke (going up chimney):
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(60, 55, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140,130,120)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.7),
    NumberSequenceKeypoint.new(0.5, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.8),
    NumberSequenceKeypoint.new(1,   1.5),
  })
  Rate = 5
  Lifetime = NumberRange.new(2.0, 4.0)
  Speed = NumberRange.new(1.5, 3)
  SpreadAngle = Vector2.new(8, 8)
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 0.0
  LightInfluence = 1.0


--- EFFECT: FORGE FIRE (industrial, very hot, blue-white core) ---
Setup: Part "ForgeOpening" inside forge model

ParticleEmitter "ForgeCore":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),  -- white hot core
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(200, 220, 255)),  -- blue-white
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 180, 50)),   -- orange mid
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 80,  0)),    -- red-orange edge
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 20,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.3, 0.7),
    NumberSequenceKeypoint.new(0.6, 0.5),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 60
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(3, 7)
  SpreadAngle = Vector2.new(20, 20)
  Drag = 1.5
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 1.0
  LightInfluence = 0.0

ParticleEmitter "ForgeSparks":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 180, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 80,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 30
  Lifetime = NumberRange.new(0.8, 2.0)
  Speed = NumberRange.new(6, 15)
  SpreadAngle = Vector2.new(60, 60)
  Drag = 0.5
  Acceleration = Vector3.new(0, -10, 0)
  LightEmission = 1.0


--- EFFECT: DRAGON BREATH (cone of fire, projectile) ---
Setup: Attachment at dragon mouth, emits forward

ParticleEmitter "DragonBreath":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 200, 0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 80,  0)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(180, 20,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(60,  0,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.6, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.3, 1.2),
    NumberSequenceKeypoint.new(0.7, 2.5),
    NumberSequenceKeypoint.new(1,   0.5),
  })
  Rate = 80
  Lifetime = NumberRange.new(0.8, 1.4)
  Speed = NumberRange.new(20, 35)
  SpreadAngle = Vector2.new(8, 8)
  RotSpeed = NumberRange.new(-50, 50)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0, 0.5, 0)
  EmissionDirection = Enum.NormalId.Front
  LightEmission = 1.0
  LightInfluence = 0.0


--- EFFECT: FIRE TRAIL (left behind moving object) ---
Setup: Trail attachment on fast-moving Part

Trail "FireTrail":
  Attachment0 = TrailAttachmentA (front of part)
  Attachment1 = TrailAttachmentB (back of part, 1 stud offset)
  Lifetime = 0.5
  MinLength = 0
  MaxLength = 50
  WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1.0),
    NumberSequenceKeypoint.new(1, 0.0),
  })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 140, 0)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(200, 40,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  10,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.9
  TextureLength = 1
  TextureSpeed = 2
  FaceCamera = true


--- EFFECT: FIRE RING (circular wall of flame, ritual/boss) ---
Setup: Multiple Parts arranged in a circle, each angled outward

Each Part's ParticleEmitter "RingFlame":
  Texture = "rbxassetid://1266170131"
  Color = (same as campfire CoreFlame)
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.4, 0.9),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 30
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(2, 5)
  SpreadAngle = Vector2.new(5, 5)   -- tight upward
  EmissionDirection = Enum.NormalId.Top
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 0.8

Lua circle spawn:
  local RADIUS = 8
  local COUNT = 16
  for i = 1, COUNT do
    local angle = (i / COUNT) * math.pi * 2
    local x = math.cos(angle) * RADIUS
    local z = math.sin(angle) * RADIUS
    -- spawn ring part at (x, 0, z), CFrame.lookAt toward center
  end


--- EFFECT: SMOLDER / AFTERMATH (dying fire, coals glowing) ---
Setup: Part "SmolderBase" with very slow emitters

ParticleEmitter "CoalGlow":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 50,  0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(150, 30,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  10,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.5, 0.7),
    NumberSequenceKeypoint.new(1,   0.4),
  })
  Rate = 3
  Lifetime = NumberRange.new(1.5, 2.5)
  Speed = NumberRange.new(0, 0.5)
  SpreadAngle = Vector2.new(10, 10)
  Drag = 5
  LightEmission = 0.8
  LightInfluence = 0.2

ParticleEmitter "SmolderSmoke":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80, 70, 60)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160,150,140)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.8),
    NumberSequenceKeypoint.new(1,   1.5),
  })
  Rate = 2
  Lifetime = NumberRange.new(4.0, 8.0)
  Speed = NumberRange.new(0.5, 1.5)
  SpreadAngle = Vector2.new(10, 10)
  Acceleration = Vector3.new(0.1, 1, 0)
  LightEmission = 0.0


--- EFFECT: PILOT LIGHT (tiny constant flame, gas appliance) ---
ParticleEmitter "PilotFlame":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(100, 150, 255)),  -- blue at base (gas)
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(150, 200, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 220, 100)),  -- yellow tip
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.9, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.03),
    NumberSequenceKeypoint.new(0.4, 0.07),
    NumberSequenceKeypoint.new(1,   0.01),
  })
  Rate = 10
  Lifetime = NumberRange.new(0.2, 0.4)
  Speed = NumberRange.new(0.8, 1.5)
  SpreadAngle = Vector2.new(5, 5)
  Drag = 4
  LightEmission = 0.6


--- EFFECT: FLAMETHROWER (continuous pressurized stream) ---
Setup: Attachment at nozzle, emits forward, player fires

ParticleEmitter "FlameThrowerStream":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 180)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 180, 0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 80,  0)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(150, 20,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  0,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.6, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.3, 0.8),
    NumberSequenceKeypoint.new(0.7, 1.5),
    NumberSequenceKeypoint.new(1,   0.3),
  })
  Rate = 120
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(25, 40)
  SpreadAngle = Vector2.new(5, 5)
  RotSpeed = NumberRange.new(-60, 60)
  Drag = 0.8
  Acceleration = Vector3.new(0, 0.8, 0)
  EmissionDirection = Enum.NormalId.Front
  LightEmission = 1.0
  LightInfluence = 0.0
`;

// ============================================================
// WATER EFFECTS
// ============================================================
export const VFX_WATER: string = `
=== WATER VFX BIBLE ===

--- EFFECT: SMALL SPLASH (footstep in puddle) ---
Setup: Burst emitter at hit position, destroyed after 2s

ParticleEmitter "SmallSplash":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 230, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(170, 210, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 190, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.3, 0.18),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 0   -- Emit(20)
  Lifetime = NumberRange.new(0.3, 0.6)
  Speed = NumberRange.new(4, 9)
  SpreadAngle = Vector2.new(70, 70)
  RotSpeed = NumberRange.new(-30, 30)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.5
  Acceleration = Vector3.new(0, -20, 0)
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

ParticleEmitter "SplashRipple":
  Texture = "rbxassetid://3270713512"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 230, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 215, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 1.5),
    NumberSequenceKeypoint.new(1,   2.5),
  })
  Rate = 0   -- Emit(3)
  Lifetime = NumberRange.new(0.4, 0.7)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Orientation = Enum.ParticleOrientation.VelocityPerpendicular
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.1
  LightInfluence = 0.9
  ZOffset = 0
  LockedToPart = false
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: LARGE SPLASH (boulder drop, cannonball) ---
ParticleEmitter "LargeSplashDrops":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(210, 240, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 220, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(150, 200, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(0.8, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.3, 0.6),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 0   -- Emit(60)
  Lifetime = NumberRange.new(0.8, 1.8)
  Speed = NumberRange.new(8, 20)
  SpreadAngle = Vector2.new(80, 80)
  RotSpeed = NumberRange.new(-30, 30)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0, -25, 0)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

ParticleEmitter "LargeSplashMist":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(220, 240, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(240, 250, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 2.0),
    NumberSequenceKeypoint.new(1,   4.0),
  })
  Rate = 0   -- Emit(15)
  Lifetime = NumberRange.new(1.0, 2.5)
  Speed = NumberRange.new(3, 8)
  SpreadAngle = Vector2.new(50, 50)
  RotSpeed = NumberRange.new(-10, 10)
  Drag = 0.5
  Acceleration = Vector3.new(0, 0.5, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: RAIN DROPS (ambient falling rain) ---
Setup: Large Part high above scene covering play area

ParticleEmitter "RainFall":
  Texture = "rbxassetid://3855085"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 210, 240)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 195, 230)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.04),
    NumberSequenceKeypoint.new(0.5, 0.04),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 300
  Lifetime = NumberRange.new(1.0, 2.0)
  Speed = NumberRange.new(30, 50)
  SpreadAngle = Vector2.new(5, 5)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0.0
  Acceleration = Vector3.new(-2, -40, 0)
  EmissionDirection = Enum.NormalId.Top
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  Orientation = Enum.ParticleOrientation.VelocityAligned
  LightEmission = 0.1
  LightInfluence = 0.9
  ZOffset = 0
  LockedToPart = false
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: MIST / FOG (low-lying ground fog) ---
Setup: Large flat Part at ground level covering wide area

ParticleEmitter "GroundMist":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 215, 230)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(220, 230, 240)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(240, 245, 250)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.85),
    NumberSequenceKeypoint.new(0.3, 0.7),
    NumberSequenceKeypoint.new(0.7, 0.75),
    NumberSequenceKeypoint.new(1,   0.95),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   2.0),
    NumberSequenceKeypoint.new(0.5, 5.0),
    NumberSequenceKeypoint.new(1,   8.0),
  })
  Rate = 4
  Lifetime = NumberRange.new(8.0, 15.0)
  Speed = NumberRange.new(0.5, 2.0)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-5, 5)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.1
  Acceleration = Vector3.new(0.3, 0.1, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: STEAM (rising from hot surface or vent) ---
ParticleEmitter "SteamRise":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(240, 240, 240)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(220, 225, 230)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 210, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.4, 0.8),
    NumberSequenceKeypoint.new(1,   1.8),
  })
  Rate = 12
  Lifetime = NumberRange.new(2.0, 4.0)
  Speed = NumberRange.new(2, 5)
  SpreadAngle = Vector2.new(15, 15)
  RotSpeed = NumberRange.new(-10, 10)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.5
  Acceleration = Vector3.new(0.2, 1.5, 0)
  LightEmission = 0.05
  LightInfluence = 0.95
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: WATERFALL SPRAY (base of waterfall) ---
ParticleEmitter "WaterfallMist":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(210, 235, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(230, 245, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(250, 252, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.5, 2.5),
    NumberSequenceKeypoint.new(1,   5.0),
  })
  Rate = 30
  Lifetime = NumberRange.new(2.0, 4.0)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(60, 20)
  RotSpeed = NumberRange.new(-5, 5)
  Drag = 0.4
  Acceleration = Vector3.new(0, 0.5, 0)
  LightEmission = 0.05
  LightInfluence = 0.95
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

ParticleEmitter "WaterfallDroplets":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 230, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(170, 210, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.6, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(0.5, 0.12),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 50
  Lifetime = NumberRange.new(0.5, 1.2)
  Speed = NumberRange.new(3, 8)
  SpreadAngle = Vector2.new(70, 25)
  RotSpeed = NumberRange.new(-20, 20)
  Drag = 0.8
  Acceleration = Vector3.new(0, -15, 0)
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: BUBBLES RISING (underwater or cauldron) ---
ParticleEmitter "BubblesRise":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 220, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 235, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(220, 245, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.5, 0.5),
    NumberSequenceKeypoint.new(0.9, 0.7),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 0.2),
    NumberSequenceKeypoint.new(1,   0.3),
  })
  Rate = 15
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0.5
  Acceleration = Vector3.new(0.2, 2, 0.2)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: WAVE FOAM (ocean shore) ---
ParticleEmitter "WaveFoam":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(250, 252, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(240, 248, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 230, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.4, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 1.5),
    NumberSequenceKeypoint.new(1,   2.5),
  })
  Rate = 8
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(0.5, 2)
  SpreadAngle = Vector2.new(80, 10)
  RotSpeed = NumberRange.new(-5, 5)
  Drag = 1.0
  Acceleration = Vector3.new(0, 0, 0)
  EmissionDirection = Enum.NormalId.Top
  Orientation = Enum.ParticleOrientation.VelocityPerpendicular
  LightEmission = 0.1
  LightInfluence = 0.9
  ZOffset = 0
  LockedToPart = false
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: WATER DRIP (leaking pipe or cave) ---
ParticleEmitter "WaterDrip":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 215, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(150, 195, 250)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.8, 0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.3, 0.12),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 2
  Lifetime = NumberRange.new(0.8, 1.5)
  Speed = NumberRange.new(0.5, 1.5)
  SpreadAngle = Vector2.new(5, 5)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, -30, 0)
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: PUDDLE RIPPLE (raindrop hits still water) ---
ParticleEmitter "PuddleRipple":
  Texture = "rbxassetid://3270713512"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 210, 240)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 195, 230)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.5, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.05),
    NumberSequenceKeypoint.new(0.4, 0.8),
    NumberSequenceKeypoint.new(1,   1.5),
  })
  Rate = 10
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, 0, 0)
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  Orientation = Enum.ParticleOrientation.VelocityPerpendicular
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: UNDERWATER CAUSTICS (light through water surface) ---
ParticleEmitter "Caustics":
  Texture = "rbxassetid://9896971689"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(150, 200, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 230, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 240, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.5, 1.5),
    NumberSequenceKeypoint.new(1,   2.0),
  })
  Rate = 6
  Lifetime = NumberRange.new(3.0, 6.0)
  Speed = NumberRange.new(0.3, 0.8)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(-5, 5)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.5
  Acceleration = Vector3.new(0, 0.2, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: FOUNTAIN SPRAY (decorative, arcing water) ---
ParticleEmitter "FountainStream":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 235, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 220, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 205, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(0.8, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.12),
    NumberSequenceKeypoint.new(0.5, 0.15),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 40
  Lifetime = NumberRange.new(1.0, 1.8)
  Speed = NumberRange.new(10, 15)
  SpreadAngle = Vector2.new(8, 8)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0.5
  Acceleration = Vector3.new(0, -20, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: BOAT WAKE (white water behind moving boat) ---
Trail "BoatWakeTrail":
  Attachment0 = WakeLeft (port rear attachment)
  Attachment1 = WakeRight (starboard rear attachment, 3-4 studs apart)
  Lifetime = 1.5
  MinLength = 0
  MaxLength = 100
  WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(0.4, 0.7),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(220, 240, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(180, 215, 250)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 160, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.2
  TextureLength = 2
  TextureSpeed = 1
  FaceCamera = false

ParticleEmitter "WakeFoam" on each wake attachment:
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 235, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.7),
    NumberSequenceKeypoint.new(1,   1.2),
  })
  Rate = 20
  Lifetime = NumberRange.new(0.8, 1.5)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(60, 10)
  RotSpeed = NumberRange.new(-5, 5)
  Drag = 1.0
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 0.1
  LightInfluence = 0.9
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: ICE CRYSTALS FORMING (freeze spell landing) ---
ParticleEmitter "IceCrystalForm":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 240, 255)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(160, 210, 255)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(120, 185, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  160, 250)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.1),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.04),
    NumberSequenceKeypoint.new(0.3, 0.09),
    NumberSequenceKeypoint.new(0.7, 0.06),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 0  -- Emit(40)
  Lifetime = NumberRange.new(0.5, 1.5)
  Speed = NumberRange.new(2, 8)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-90, 90)
  Rotation = NumberRange.new(0, 360)
  Drag = 2.0
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 0.7
  LightInfluence = 0.3
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: CONDENSATION (water beads on cold surface) ---
ParticleEmitter "Condensation":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 215, 250)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 200, 245)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.5, 0.4),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.03),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 1
  Lifetime = NumberRange.new(4.0, 8.0)
  Speed = NumberRange.new(0, 0.2)
  SpreadAngle = Vector2.new(90, 90)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 10
  Acceleration = Vector3.new(0, -0.5, 0)
  LightEmission = 0.2
  LightInfluence = 0.8
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  ZOffset = 0
  LockedToPart = true
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: GEYSER (timed explosive water column) ---
Phase 1 Pre-eruption steam (Rate = 20, enabled 5s before):
  (Use SteamRise settings with Rate = 20, Speed = NumberRange.new(4, 8))

Phase 2 Main eruption (Emit(200) on timer):
  ParticleEmitter "GeyserBlast":
    Texture = "rbxassetid://243728172"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(240, 250, 255)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 235, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 210, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.4, 0.2),
      NumberSequenceKeypoint.new(0.8, 0.6),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.4),
      NumberSequenceKeypoint.new(0.3, 1.0),
      NumberSequenceKeypoint.new(0.7, 0.8),
      NumberSequenceKeypoint.new(1,   0.2),
    })
    Rate = 0   -- Emit(200)
    Lifetime = NumberRange.new(1.0, 2.5)
    Speed = NumberRange.new(20, 40)
    SpreadAngle = Vector2.new(10, 10)
    RotSpeed = NumberRange.new(-20, 20)
    Rotation = NumberRange.new(0, 360)
    Drag = 0.5
    Acceleration = Vector3.new(0, -25, 0)
    EmissionDirection = Enum.NormalId.Top
    LightEmission = 0.4
    LightInfluence = 0.6
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

Lua geyser cycle:
  local ERUPT_INTERVAL = 20  -- seconds
  local function startGeyser(base)
    while true do
      task.wait(ERUPT_INTERVAL - 5)
      base.PreSteam.Rate = 20        -- warn up
      task.wait(5)
      base.PreSteam.Rate = 0
      base.GeyserBlast:Emit(200)
      base.GeyserMist:Emit(30)
      task.wait(3)                   -- cooldown
    end
  end
`;

// ============================================================
// MAGIC EFFECTS
// ============================================================
export const VFX_MAGIC: string = `
=== MAGIC VFX BIBLE ===

--- EFFECT: SPARKLE / SHIMMER (generic magic ambient) ---
ParticleEmitter "MagicSparkle":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 220, 100)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(200, 150, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 200, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.3, 0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.05),
    NumberSequenceKeypoint.new(0.4, 0.12),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 20
  Lifetime = NumberRange.new(1.0, 2.5)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-60, 60)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: HEAL GLOW (healing spell lands on player) ---
LAYER 1 — Green pulse ring:
  ParticleEmitter "HealRing":
    Texture = "rbxassetid://3270713512"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(100, 255, 100)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(50,  220, 80)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  180, 50)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.4, 0.2),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.2),
      NumberSequenceKeypoint.new(0.4, 2.5),
      NumberSequenceKeypoint.new(1,   4.0),
    })
    Rate = 0   -- Emit(4)
    Lifetime = NumberRange.new(0.6, 1.0)
    Speed = NumberRange.new(0, 0)
    SpreadAngle = Vector2.new(0, 0)
    RotSpeed = NumberRange.new(0, 0)
    Drag = 0
    Acceleration = Vector3.new(0, 0, 0)
    Orientation = Enum.ParticleOrientation.VelocityPerpendicular
    LightEmission = 0.8
    LightInfluence = 0.2
    ZOffset = 0
    LockedToPart = false
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Rising green motes:
  ParticleEmitter "HealMotes":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  255, 120)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(60,  220, 90)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  180, 60)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.3),
      NumberSequenceKeypoint.new(0.4, 0.0),
      NumberSequenceKeypoint.new(0.8, 0.3),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.08),
      NumberSequenceKeypoint.new(0.4, 0.18),
      NumberSequenceKeypoint.new(1,   0.04),
    })
    Rate = 0   -- Emit(30)
    Lifetime = NumberRange.new(1.0, 2.0)
    Speed = NumberRange.new(2, 6)
    SpreadAngle = Vector2.new(60, 60)
    RotSpeed = NumberRange.new(-30, 30)
    Drag = 0.5
    Acceleration = Vector3.new(0, 3, 0)
    LightEmission = 0.9
    LightInfluence = 0.1
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: SHIELD BUBBLE (protective barrier activation) ---
LAYER 1 — Expanding shield shell:
  ParticleEmitter "ShieldShell":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(100, 180, 255)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(80,  150, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(60,  120, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.8),
      NumberSequenceKeypoint.new(0.3, 0.4),
      NumberSequenceKeypoint.new(0.7, 0.6),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.3),
      NumberSequenceKeypoint.new(0.4, 1.5),
      NumberSequenceKeypoint.new(1,   2.5),
    })
    Rate = 25
    Lifetime = NumberRange.new(0.8, 1.5)
    Speed = NumberRange.new(3, 6)
    SpreadAngle = Vector2.new(180, 180)
    RotSpeed = NumberRange.new(-20, 20)
    Drag = 2.0
    Acceleration = Vector3.new(0, 0, 0)
    Shape = Enum.ParticleEmitterShape.Sphere
    ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
    LightEmission = 0.7
    LightInfluence = 0.3
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: TELEPORT SWIRL (character vanish/appear) ---
LAYER 1 — Spiral particles:
  ParticleEmitter "TeleportSwirl":
    Texture = "rbxassetid://1295938486"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 80,  255)),
      ColorSequenceKeypoint.new(0.4, Color3.fromRGB(120, 40,  255)),
      ColorSequenceKeypoint.new(0.8, Color3.fromRGB(80,  20,  200)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.6, 0.0),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.1),
      NumberSequenceKeypoint.new(0.5, 0.08),
      NumberSequenceKeypoint.new(1,   0.02),
    })
    Rate = 0   -- Emit(60)
    Lifetime = NumberRange.new(0.5, 1.0)
    Speed = NumberRange.new(4, 10)
    SpreadAngle = Vector2.new(180, 180)
    RotSpeed = NumberRange.new(-180, 180)
    Rotation = NumberRange.new(0, 360)
    Drag = 3.0
    Acceleration = Vector3.new(0, 2, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Flash burst:
  ParticleEmitter "TeleportFlash":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 150, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 50,  200)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.2, 0.3),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.5),
      NumberSequenceKeypoint.new(0.2, 3.0),
      NumberSequenceKeypoint.new(1,   5.0),
    })
    Rate = 0   -- Emit(5)
    Lifetime = NumberRange.new(0.2, 0.4)
    Speed = NumberRange.new(0, 0)
    SpreadAngle = Vector2.new(0, 0)
    Drag = 0
    Acceleration = Vector3.new(0, 0, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: ENCHANT SHIMMER (item being enchanted on crafting table) ---
ParticleEmitter "EnchantShimmer":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 215, 0)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(180, 100, 255)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(100, 200, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.04),
    NumberSequenceKeypoint.new(0.5, 0.10),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 30
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-90, 90)
  Drag = 1.5
  Acceleration = Vector3.new(0, 1.5, 0)
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SPELL CASTING CIRCLE (mage channeling, rune circle on ground) ---
Setup: Flat disc Part on ground, multiple ring emitters stacked

LAYER 1 — Rotating rune dots:
  ParticleEmitter "RuneOrbit":
    Texture = "rbxassetid://1295938486"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 140, 20)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 80,  0)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.3),
      NumberSequenceKeypoint.new(0.5, 0.0),
      NumberSequenceKeypoint.new(1,   0.8),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.12),
      NumberSequenceKeypoint.new(0.5, 0.18),
      NumberSequenceKeypoint.new(1,   0.08),
    })
    Rate = 20
    Lifetime = NumberRange.new(2.0, 4.0)
    Speed = NumberRange.new(0.5, 1.5)
    SpreadAngle = Vector2.new(5, 5)
    RotSpeed = NumberRange.new(90, 90)   -- constant spin
    Rotation = NumberRange.new(0, 360)
    Drag = 0.5
    Acceleration = Vector3.new(0, 0.3, 0)
    EmissionDirection = Enum.NormalId.Top
    Shape = Enum.ParticleEmitterShape.Cylinder
    ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
    LightEmission = 0.9
    LightInfluence = 0.1
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: MANA ORB (floating energy ball following player) ---
Setup: Part "ManaOrb" floating with bobbing TweenService

ParticleEmitter "OrbGlow":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  120, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(60,  100, 220)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  80,  180)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.4, 0.3),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.5, 1.2),
    NumberSequenceKeypoint.new(1,   0.6),
  })
  Rate = 10
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(0.5, 1.5)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-20, 20)
  Drag = 3
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = true
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

ParticleEmitter "OrbTrails":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(150, 200, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(80,  120, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  80,  200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.6, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 15
  Lifetime = NumberRange.new(0.8, 1.5)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(60, 60)
  Drag = 2.0
  Acceleration = Vector3.new(0, 0.5, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: RUNE FLOAT (ancient runes rising off surface) ---
ParticleEmitter "RuneFloat":
  Texture = "rbxassetid://6401188862"   -- rune glyph texture
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 150, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 80,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.2, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(0.3, 0.4),
    NumberSequenceKeypoint.new(0.7, 0.35),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 5
  Lifetime = NumberRange.new(2.0, 4.0)
  Speed = NumberRange.new(0.5, 1.5)
  SpreadAngle = Vector2.new(15, 15)
  RotSpeed = NumberRange.new(-30, 30)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: POTION BREW (bubbling magic cauldron) ---
LAYER 1 — Colored brew bubbles:
  ParticleEmitter "PotionBubbles":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(120, 40,  200)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(160, 60,  220)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 100, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.5),
      NumberSequenceKeypoint.new(0.5, 0.3),
      NumberSequenceKeypoint.new(1,   0.9),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.08),
      NumberSequenceKeypoint.new(0.5, 0.15),
      NumberSequenceKeypoint.new(1,   0.20),
    })
    Rate = 12
    Lifetime = NumberRange.new(1.0, 2.5)
    Speed = NumberRange.new(1, 3)
    SpreadAngle = Vector2.new(20, 20)
    RotSpeed = NumberRange.new(0, 0)
    Drag = 0.5
    Acceleration = Vector3.new(0.1, 2, 0.1)
    LightEmission = 0.6
    LightInfluence = 0.4
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Magical steam:
  (use SteamRise with Color purple-tinted: Color3.fromRGB(180, 140, 255))


--- EFFECT: CURSE / CORRUPTION (dark spreading effect) ---
ParticleEmitter "CorruptionTendrils":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  0,   120)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(50,  0,   80)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(20,  0,   40)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(0,   0,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(0.7, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.3, 0.4),
    NumberSequenceKeypoint.new(0.6, 0.3),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 20
  Lifetime = NumberRange.new(0.8, 1.5)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(-60, 60)
  Drag = 1.5
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

ParticleEmitter "CorruptionMotes":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(150, 0,   200)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(100, 0,   150)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(50,  0,   80)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.01),
  })
  Rate = 15
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(2, 6)
  SpreadAngle = Vector2.new(60, 60)
  Drag = 0.5
  Acceleration = Vector3.new(0, 1.5, 0)
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: HOLY LIGHT (divine heal, paladin power) ---
LAYER 1 — Golden rays:
  ParticleEmitter "HolyRays":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
      ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 230, 100)),
      ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 170, 0)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.6),
      NumberSequenceKeypoint.new(0.3, 0.2),
      NumberSequenceKeypoint.new(0.7, 0.4),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.2),
      NumberSequenceKeypoint.new(0.4, 1.5),
      NumberSequenceKeypoint.new(1,   3.0),
    })
    Rate = 15
    Lifetime = NumberRange.new(1.0, 2.0)
    Speed = NumberRange.new(2, 5)
    SpreadAngle = Vector2.new(30, 180)
    RotSpeed = NumberRange.new(-15, 15)
    Drag = 1.0
    Acceleration = Vector3.new(0, 1, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: DARK MAGIC (shadow energy, necromancer) ---
ParticleEmitter "ShadowEnergy":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(60,  0,   100)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(100, 0,   140)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(140, 0,   180)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 50,  220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.3, 0.6),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  Rate = 35
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(2, 6)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(-40, 40)
  Drag = 1.5
  Acceleration = Vector3.new(0, 1.5, 0)
  LightEmission = 0.5
  LightInfluence = 0.5
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: ICE SPELL IMPACT (frost burst on hit) ---
LAYER 1 — Ice shards:
  ParticleEmitter "IceShards":
    Texture = "rbxassetid://1295938486"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 240, 255)),
      ColorSequenceKeypoint.new(0.3, Color3.fromRGB(150, 210, 255)),
      ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 180, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  150, 240)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.6, 0.0),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.12),
      NumberSequenceKeypoint.new(0.4, 0.15),
      NumberSequenceKeypoint.new(1,   0.03),
    })
    Rate = 0   -- Emit(50)
    Lifetime = NumberRange.new(0.4, 1.0)
    Speed = NumberRange.new(5, 15)
    SpreadAngle = Vector2.new(180, 180)
    RotSpeed = NumberRange.new(-120, 120)
    Drag = 1.0
    Acceleration = Vector3.new(0, -10, 0)
    LightEmission = 0.6
    LightInfluence = 0.4
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Frost mist:
  (use GroundMist settings with Color icy blue, Scale 30% smaller, Rate 0, Emit(8))


--- EFFECT: FIRE SPELL IMPACT (fireball explodes on target) ---
  (Combine ExplosionFireball LAYER 1 + 2 with Emit counts halved for projectile scale)


--- EFFECT: LIGHTNING SPELL IMPACT ---
LAYER 1 — Electric sparks:
  ParticleEmitter "LightningSparks":
    Texture = "rbxassetid://1295938486"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
      ColorSequenceKeypoint.new(0.3, Color3.fromRGB(200, 230, 255)),
      ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 180, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(50,  100, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.5, 0.0),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.1),
      NumberSequenceKeypoint.new(0.5, 0.08),
      NumberSequenceKeypoint.new(1,   0.02),
    })
    Rate = 0   -- Emit(80)
    Lifetime = NumberRange.new(0.2, 0.5)
    Speed = NumberRange.new(8, 20)
    SpreadAngle = Vector2.new(180, 180)
    RotSpeed = NumberRange.new(0, 0)
    Drag = 0.3
    Acceleration = Vector3.new(0, -5, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.VelocityAligned
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Electric flash:
  (use TeleportFlash settings with Color3.fromRGB(200, 230, 255), Emit(3))


--- EFFECT: ARCANE BEAM (sustained energy beam hitting target) ---
Beam "ArcaneBeam":
  Attachment0 = CasterHandAttachment
  Attachment1 = TargetAttachment
  Width0 = 0.3
  Width1 = 0.15
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 20
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 100, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(150, 50,  255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 20,  220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.1),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  LightEmission = 1.0
  TextureLength = 1
  TextureSpeed = 3
  FaceCamera = true


--- EFFECT: SUMMON PORTAL (interdimensional gate opening) ---
LAYER 1 — Swirling void:
  ParticleEmitter "PortalVoid":
    Texture = "rbxassetid://1266170131"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(0,   0,   0)),
      ColorSequenceKeypoint.new(0.3, Color3.fromRGB(40,  0,   80)),
      ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 0,   150)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 50,  220)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.2),
      NumberSequenceKeypoint.new(0.4, 0.0),
      NumberSequenceKeypoint.new(0.8, 0.3),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.5),
      NumberSequenceKeypoint.new(0.4, 1.5),
      NumberSequenceKeypoint.new(1,   0.3),
    })
    Rate = 40
    Lifetime = NumberRange.new(1.0, 2.0)
    Speed = NumberRange.new(1, 3)
    SpreadAngle = Vector2.new(5, 180)
    RotSpeed = NumberRange.new(90, 120)
    Rotation = NumberRange.new(0, 360)
    Drag = 2.5
    Acceleration = Vector3.new(0, 0, 0)
    Shape = Enum.ParticleEmitterShape.Cylinder
    ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
    EmissionDirection = Enum.NormalId.Front
    LightEmission = 0.6
    LightInfluence = 0.4
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false
`;

// ============================================================
// COMBAT EFFECTS
// ============================================================
export const VFX_COMBAT: string = `
=== COMBAT VFX BIBLE ===

--- EFFECT: BLOOD SPLATTER (melee hit on enemy) ---
ParticleEmitter "BloodSplat":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 0,  0)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(140, 0,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(80,  0,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.6, 0.1),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(0.3, 0.22),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 0   -- Emit(25)
  Lifetime = NumberRange.new(0.3, 0.7)
  Speed = NumberRange.new(4, 12)
  SpreadAngle = Vector2.new(70, 70)
  RotSpeed = NumberRange.new(-60, 60)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.5
  Acceleration = Vector3.new(0, -15, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: IMPACT SPARK (sword clash, bullet on metal) ---
ParticleEmitter "ImpactSpark":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 120, 0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 60,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.6, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.12),
    NumberSequenceKeypoint.new(0.4, 0.10),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 0   -- Emit(40)
  Lifetime = NumberRange.new(0.2, 0.5)
  Speed = NumberRange.new(6, 18)
  SpreadAngle = Vector2.new(80, 80)
  RotSpeed = NumberRange.new(0, 0)
  Rotation = NumberRange.new(0, 0)
  Drag = 0.5
  Acceleration = Vector3.new(0, -8, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SLASH TRAIL (sword swing arc) ---
Trail "SwordSlashTrail":
  Attachment0 = BladeTopAttachment
  Attachment1 = BladeBottomAttachment
  Lifetime = 0.15
  MinLength = 0
  MaxLength = 20
  WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(0.5, 0.6),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(200, 220, 255)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(100, 150, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(50,  80,  200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.7
  TextureLength = 1
  TextureSpeed = 5
  FaceCamera = false


--- EFFECT: BULLET TRACER (fast projectile visual streak) ---
Trail "BulletTracer":
  Attachment0 = BulletFrontAttachment
  Attachment1 = BulletRearAttachment (0.3 studs behind)
  Lifetime = 0.05
  MinLength = 0
  MaxLength = 30
  WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 230, 100)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 200, 50)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.9
  TextureLength = 2
  FaceCamera = true


--- EFFECT: EXPLOSION SHOCKWAVE (ground-level ring pulse) ---
ParticleEmitter "ShockwaveRing":
  Texture = "rbxassetid://3270713512"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 150, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 80,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.3, 6.0),
    NumberSequenceKeypoint.new(1,  12.0),
  })
  Rate = 0   -- Emit(3)
  Lifetime = NumberRange.new(0.3, 0.5)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, 0, 0)
  Orientation = Enum.ParticleOrientation.VelocityPerpendicular
  LightEmission = 0.9
  LightInfluence = 0.1
  ZOffset = 0
  LockedToPart = false
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: HIT FLASH (bright flash at impact point) ---
ParticleEmitter "HitFlash":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 200, 100)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 150, 50)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.2, 0.1),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.1, 1.5),
    NumberSequenceKeypoint.new(0.3, 2.0),
    NumberSequenceKeypoint.new(1,   0.5),
  })
  Rate = 0   -- Emit(4)
  Lifetime = NumberRange.new(0.1, 0.2)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 1
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: DEATH DISSOLVE (enemy dissolving on death) ---
ParticleEmitter "DeathDissolve":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(200, 100, 20)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 30,  0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  0,   0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.08),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 0   -- Emit(100)
  Lifetime = NumberRange.new(1.0, 2.5)
  Speed = NumberRange.new(1, 5)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-60, 60)
  Drag = 1.5
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Volume
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SMOKE GRENADE (expanding smoke cloud) ---
ParticleEmitter "SmokeCloud":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 180, 180)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 200, 200)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(220, 220, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.2, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.3, 3.0),
    NumberSequenceKeypoint.new(0.7, 6.0),
    NumberSequenceKeypoint.new(1,   8.0),
  })
  Rate = 60
  Lifetime = NumberRange.new(5.0, 10.0)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-10, 10)
  Drag = 0.3
  Acceleration = Vector3.new(0.5, 0.5, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: MUZZLE FLASH (gun firing) ---
ParticleEmitter "MuzzleFlash":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 180, 50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 100, 0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.1, 0.8),
    NumberSequenceKeypoint.new(0.3, 1.0),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  Rate = 0   -- Emit(6)
  Lifetime = NumberRange.new(0.05, 0.12)
  Speed = NumberRange.new(2, 6)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-90, 90)
  Drag = 2
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

PointLight on barrel (toggled per shot):
  Brightness = 8
  Color = Color3.fromRGB(255, 180, 80)
  Range = 12
  Shadows = true
  -- Enable on fire, disable after 0.05s


--- EFFECT: SHELL CASING EJECT ---
  -- Handle via actual Part physics, not particle:
  local casing = Instance.new("Part")
  casing.Size = Vector3.new(0.08, 0.08, 0.2)
  casing.BrickColor = BrickColor.new("Bright yellow")
  casing.Material = Enum.Material.Metal
  casing.CFrame = gun.EjectPort.CFrame
  casing.Velocity = gun.EjectPort.CFrame.RightVector * 8 + Vector3.new(0, 3, 0)
  casing.RotVelocity = Vector3.new(20, 5, 10)
  casing.Parent = workspace
  game:GetService("Debris"):AddItem(casing, 3)


--- EFFECT: ARROW TRAIL (arrow in flight) ---
Trail "ArrowTrail":
  Attachment0 = ArrowTipAttachment
  Attachment1 = ArrowNockAttachment (0.5 studs back)
  Lifetime = 0.1
  MinLength = 0.05
  MaxLength = 15
  WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.5, 0.4),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(210, 180, 140)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 150, 110)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 110, 80)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.0
  TextureLength = 1
  FaceCamera = true


--- EFFECT: ENERGY BLAST (charged projectile) ---
ParticleEmitter "EnergyBlastCore":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(100, 200, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(50,  100, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  50,  200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.3),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.5, 0.8),
    NumberSequenceKeypoint.new(1,   0.3),
  })
  Rate = 30
  Lifetime = NumberRange.new(0.3, 0.6)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-40, 40)
  Drag = 3
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = true
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

Trail "EnergyBlastTrail" (on projectile Part):
  Lifetime = 0.2
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(1, 0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(100, 180, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(50, 80, 255)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 1.0
  FaceCamera = true


--- EFFECT: GROUND POUND CRACK (heavy melee slam) ---
LAYER 1 — Dust/dirt burst:
  ParticleEmitter "GroundDust":
    Texture = "rbxassetid://255112629"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 160, 120)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(160, 140, 100)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 120, 80)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.2),
      NumberSequenceKeypoint.new(0.4, 0.0),
      NumberSequenceKeypoint.new(0.8, 0.5),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.5),
      NumberSequenceKeypoint.new(0.4, 2.5),
      NumberSequenceKeypoint.new(1,   5.0),
    })
    Rate = 0   -- Emit(25)
    Lifetime = NumberRange.new(0.8, 2.0)
    Speed = NumberRange.new(3, 10)
    SpreadAngle = Vector2.new(70, 20)
    Drag = 0.8
    Acceleration = Vector3.new(0, 1, 0)
    LightEmission = 0.0
    LightInfluence = 1.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Shockwave ring:
  (use ShockwaveRing settings, scale Size to 15 max)


--- EFFECT: SHIELD BREAK SHATTER ---
ParticleEmitter "ShieldShatter":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(100, 180, 255)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(80,  150, 255)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(60,  120, 220)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(30,  60,  150)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.15),
    NumberSequenceKeypoint.new(0.4, 0.18),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 0   -- Emit(60)
  Lifetime = NumberRange.new(0.5, 1.2)
  Speed = NumberRange.new(5, 15)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-120, 120)
  Drag = 1.0
  Acceleration = Vector3.new(0, -10, 0)
  LightEmission = 0.7
  LightInfluence = 0.3
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false
`;

// ============================================================
// NATURE EFFECTS
// ============================================================
export const VFX_NATURE: string = `
=== NATURE VFX BIBLE ===

--- EFFECT: LEAF FALL - GREEN (summer forest) ---
ParticleEmitter "GreenLeafFall":
  Texture = "rbxassetid://6372755229"   -- leaf silhouette texture
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  160, 40)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(60,  140, 30)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(40,  120, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(30,  100, 15)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.6, 0.1),
    NumberSequenceKeypoint.new(0.9, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.25),
    NumberSequenceKeypoint.new(1,   0.18),
  })
  Rate = 5
  Lifetime = NumberRange.new(4.0, 8.0)
  Speed = NumberRange.new(0.5, 2.0)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-60, 60)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.8
  Acceleration = Vector3.new(0.3, -2, 0.2)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: LEAF FALL - AUTUMN (red/orange/brown) ---
ParticleEmitter "AutumnLeafFall":
  Texture = "rbxassetid://6372755229"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 60,  20)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(220, 120, 20)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(200, 90,  10)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 60,  10)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.6, 0.0),
    NumberSequenceKeypoint.new(0.9, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.22),
    NumberSequenceKeypoint.new(0.5, 0.28),
    NumberSequenceKeypoint.new(1,   0.20),
  })
  Rate = 6
  Lifetime = NumberRange.new(5.0, 9.0)
  Speed = NumberRange.new(0.5, 2.5)
  SpreadAngle = Vector2.new(35, 35)
  RotSpeed = NumberRange.new(-80, 80)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.6
  Acceleration = Vector3.new(0.5, -2.5, 0.3)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: CHERRY BLOSSOM PETALS (sakura, spring festival) ---
ParticleEmitter "CherryBlossomPetals":
  Texture = "rbxassetid://6372755229"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 210)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 180, 200)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(240, 160, 185)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(220, 140, 170)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.1),
    NumberSequenceKeypoint.new(0.9, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.12),
    NumberSequenceKeypoint.new(0.5, 0.16),
    NumberSequenceKeypoint.new(1,   0.10),
  })
  Rate = 10
  Lifetime = NumberRange.new(5.0, 10.0)
  Speed = NumberRange.new(0.3, 1.5)
  SpreadAngle = Vector2.new(45, 45)
  RotSpeed = NumberRange.new(-50, 50)
  Rotation = NumberRange.new(0, 360)
  Drag = 1.0
  Acceleration = Vector3.new(0.4, -1.5, 0.2)
  LightEmission = 0.1
  LightInfluence = 0.9
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: POLLEN DRIFT (meadow, summer) ---
ParticleEmitter "PollenDrift":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 240, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 220, 60)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(240, 200, 40)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.04),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 8
  Lifetime = NumberRange.new(5.0, 12.0)
  Speed = NumberRange.new(0.2, 1.0)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-10, 10)
  Drag = 0.5
  Acceleration = Vector3.new(0.2, 0.1, 0.1)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: FIREFLY GLOW (dusk/night meadow) ---
ParticleEmitter "FireflyGlow":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 255, 100)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(150, 255, 80)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(100, 220, 60)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(60,  180, 40)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.1),
    NumberSequenceKeypoint.new(1,   0.9),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(0.8, 0.15),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 4
  Lifetime = NumberRange.new(4.0, 8.0)
  Speed = NumberRange.new(0.2, 0.8)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0.3
  Acceleration = Vector3.new(0.1, 0.2, 0.1)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SNOW FALLING (winter scene) ---
ParticleEmitter "SnowFall":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(240, 245, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(225, 235, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(210, 225, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.5, 0.2),
    NumberSequenceKeypoint.new(0.9, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.06),
    NumberSequenceKeypoint.new(0.5, 0.07),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 80
  Lifetime = NumberRange.new(3.0, 7.0)
  Speed = NumberRange.new(3, 8)
  SpreadAngle = Vector2.new(10, 10)
  RotSpeed = NumberRange.new(-10, 10)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.2
  Acceleration = Vector3.new(0.5, -5, 0)
  EmissionDirection = Enum.NormalId.Top
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: DUST MOTES (indoor sunbeam, abandoned room) ---
ParticleEmitter "DustMotes":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(220, 200, 170)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 185, 155)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 165, 135)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.8),
    NumberSequenceKeypoint.new(0.3, 0.5),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.03),
    NumberSequenceKeypoint.new(0.5, 0.04),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 6
  Lifetime = NumberRange.new(6.0, 15.0)
  Speed = NumberRange.new(0.1, 0.4)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0.2
  Acceleration = Vector3.new(0.05, 0.02, 0.05)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SAND BLOW (desert, wind gust) ---
ParticleEmitter "SandBlow":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 170, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 150, 80)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(160, 130, 60)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.03),
    NumberSequenceKeypoint.new(0.5, 0.04),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 100
  Lifetime = NumberRange.new(1.0, 3.0)
  Speed = NumberRange.new(5, 15)
  SpreadAngle = Vector2.new(10, 20)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0.1
  Acceleration = Vector3.new(8, -5, 0)   -- wind direction
  EmissionDirection = Enum.NormalId.Front
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: DANDELION SEEDS (blown by wind) ---
ParticleEmitter "DandelionSeeds":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 250, 230)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(240, 235, 210)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(220, 215, 190)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.2, 0.2),
    NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.05),
    NumberSequenceKeypoint.new(0.5, 0.07),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 4
  Lifetime = NumberRange.new(6.0, 12.0)
  Speed = NumberRange.new(0.5, 2.0)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(-20, 20)
  Drag = 0.3
  Acceleration = Vector3.new(1.0, 0.2, 0.5)
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SPORE CLOUD (mushroom, forest floor) ---
ParticleEmitter "SporeCloud":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 200, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(160, 180, 80)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 160, 60)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.4, 0.6),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Rate = 8
  Lifetime = NumberRange.new(3.0, 6.0)
  Speed = NumberRange.new(0.3, 1.2)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-10, 10)
  Drag = 0.5
  Acceleration = Vector3.new(0.2, 0.5, 0)
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: FLOWER BLOOM PARTICLES (spring, quest reward area) ---
ParticleEmitter "FlowerBloom":
  Texture = "rbxassetid://6372755229"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 180, 200)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 220, 100)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(180, 255, 140)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(140, 200, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.2, 0.1),
    NumberSequenceKeypoint.new(0.8, 0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.5, 0.15),
    NumberSequenceKeypoint.new(1,   0.06),
  })
  Rate = 12
  Lifetime = NumberRange.new(3.0, 6.0)
  Speed = NumberRange.new(0.5, 2.0)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(-40, 40)
  Drag = 0.8
  Acceleration = Vector3.new(0, 0.5, 0)
  LightEmission = 0.3
  LightInfluence = 0.7
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: AURORA BOREALIS (northern lights, large sky effect) ---
Setup: Multiple long Beams high in sky between Attachments on invisible anchored Parts

Beam "Aurora1":
  Width0 = 8
  Width1 = 12
  CurveSize0 = 15
  CurveSize1 = -10
  Segments = 30
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(0,   200, 100)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(0,   180, 255)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(100, 0,   200)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 0,   150)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   1.0),
    NumberSequenceKeypoint.new(0.2, 0.4),
    NumberSequenceKeypoint.new(0.5, 0.2),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  LightEmission = 0.9
  TextureLength = 20
  TextureSpeed = 0.5
  FaceCamera = false

Spawn 4-6 such beams at different heights and angles for fullness.


--- EFFECT: STARFIELD (night sky, space area particles) ---
ParticleEmitter "Starfield" (on very large ceiling Part):
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 210, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 190, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(0.6, 0.3),
    NumberSequenceKeypoint.new(0.8, 0.2),
    NumberSequenceKeypoint.new(1,   0.6),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.05),
    NumberSequenceKeypoint.new(0.5, 0.07),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 30
  Lifetime = NumberRange.new(8.0, 15.0)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, 0, 0)
  Shape = Enum.ParticleEmitterShape.Box
  ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
  EmissionDirection = Enum.NormalId.Bottom
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = true
`;

// ============================================================
// MECHANICAL EFFECTS
// ============================================================
export const VFX_MECHANICAL: string = `
=== MECHANICAL VFX BIBLE ===

--- EFFECT: EXHAUST SMOKE (vehicle engine, car/truck/motorcycle) ---
ParticleEmitter "ExhaustSmoke":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(60,  55,  50)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(100, 95,  85)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(140, 135, 125)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 175, 165)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(0.6, 0.5),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.4, 0.6),
    NumberSequenceKeypoint.new(1,   1.2),
  })
  Rate = 15
  Lifetime = NumberRange.new(1.5, 3.0)
  Speed = NumberRange.new(2, 5)
  SpreadAngle = Vector2.new(15, 15)
  RotSpeed = NumberRange.new(-10, 10)
  Rotation = NumberRange.new(0, 360)
  Drag = 0.3
  Acceleration = Vector3.new(0.2, 1, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: STEAM VENT BURST (industrial pipe, periodic release) ---
ParticleEmitter "SteamVentBurst":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(245, 245, 245)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(225, 230, 235)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 210, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.3),
    NumberSequenceKeypoint.new(0.2, 0.1),
    NumberSequenceKeypoint.new(0.6, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.3, 1.0),
    NumberSequenceKeypoint.new(0.7, 2.0),
    NumberSequenceKeypoint.new(1,   3.0),
  })
  Rate = 0   -- Emit(20) on burst timer
  Lifetime = NumberRange.new(1.0, 2.0)
  Speed = NumberRange.new(5, 12)
  SpreadAngle = Vector2.new(20, 20)
  RotSpeed = NumberRange.new(-15, 15)
  Drag = 0.8
  Acceleration = Vector3.new(0, 1, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.05
  LightInfluence = 0.95
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: WELDING SPARKS (factory, repair station) ---
ParticleEmitter "WeldingSparks":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 180, 50)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 50,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.6, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.08),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 40
  Lifetime = NumberRange.new(0.3, 0.8)
  Speed = NumberRange.new(3, 10)
  SpreadAngle = Vector2.new(60, 60)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0.3
  Acceleration = Vector3.new(0, -15, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false

PointLight on weld point:
  Brightness = 4
  Color = Color3.fromRGB(180, 200, 255)
  Range = 6
  Shadows = false


--- EFFECT: ELECTRICAL ARC (generator, tesla coil, broken wire) ---
LAYER 1 — Electric sparks:
  (use LightningSparks settings with Rate = 30 continuous instead of burst)

LAYER 2 — Arc glow:
  ParticleEmitter "ArcGlow":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 220, 255)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(100, 180, 255)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(60,  120, 255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.7),
      NumberSequenceKeypoint.new(0.3, 0.3),
      NumberSequenceKeypoint.new(0.7, 0.5),
      NumberSequenceKeypoint.new(1,   0.9),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.5),
      NumberSequenceKeypoint.new(0.5, 0.8),
      NumberSequenceKeypoint.new(1,   0.3),
    })
    Rate = 20
    Lifetime = NumberRange.new(0.05, 0.15)
    Speed = NumberRange.new(0, 0)
    SpreadAngle = Vector2.new(0, 0)
    Drag = 0
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = true
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

Beam "ElectricArc" (between two Attachments):
  Width0 = 0.08
  Width1 = 0.08
  CurveSize0 = 0.5
  CurveSize1 = -0.5
  Segments = 15
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(200, 230, 255)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 255, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(180, 210, 255)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.5, 0.1), NumberSequenceKeypoint.new(1, 0.0) })
  LightEmission = 1.0
  TextureLength = 0.5
  TextureSpeed = 10
  FaceCamera = true


--- EFFECT: ROCKET THRUST (rocket ship, jetpack) ---
LAYER 1 — Core exhaust flame:
  ParticleEmitter "RocketCore":
    Texture = "rbxassetid://1266170131"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 200)),
      ColorSequenceKeypoint.new(0.2, Color3.fromRGB(200, 220, 255)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(100, 150, 255)),
      ColorSequenceKeypoint.new(0.8, Color3.fromRGB(50,  80,  220)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  40,  150)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.3, 0.1),
      NumberSequenceKeypoint.new(0.7, 0.4),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.4),
      NumberSequenceKeypoint.new(0.3, 0.8),
      NumberSequenceKeypoint.new(0.7, 0.6),
      NumberSequenceKeypoint.new(1,   0.1),
    })
    Rate = 80
    Lifetime = NumberRange.new(0.3, 0.6)
    Speed = NumberRange.new(15, 25)
    SpreadAngle = Vector2.new(5, 5)
    RotSpeed = NumberRange.new(-30, 30)
    Drag = 0.5
    Acceleration = Vector3.new(0, 0, 0)
    EmissionDirection = Enum.NormalId.Bottom
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Smoke trail:
  (use ExhaustSmoke with Rate = 20, Speed 8-15 downward, Shape Box)

Trail "RocketTrail":
  Attachment0 = NozzleTopAttachment
  Attachment1 = NozzleBottomAttachment
  Lifetime = 0.5
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)), ColorSequenceKeypoint.new(0.3, Color3.fromRGB(180, 200, 255)), ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 120, 200)), ColorSequenceKeypoint.new(1, Color3.fromRGB(60, 70, 120)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.5, 0.3), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.8
  FaceCamera = true


--- EFFECT: JET ENGINE AFTERBURNER (supersonic flight, fighter jet) ---
ParticleEmitter "AfterburnerCore":
  Texture = "rbxassetid://1266170131"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.15,Color3.fromRGB(200, 240, 255)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(100, 180, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(60,  100, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  40,  180)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.2, 1.2),
    NumberSequenceKeypoint.new(0.5, 0.9),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  Rate = 120
  Lifetime = NumberRange.new(0.2, 0.5)
  Speed = NumberRange.new(25, 45)
  SpreadAngle = Vector2.new(4, 4)
  RotSpeed = NumberRange.new(-60, 60)
  Drag = 0.3
  Acceleration = Vector3.new(0, 0, 0)
  EmissionDirection = Enum.NormalId.Back
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: HYDRAULIC HISS STEAM (robot joints, machinery) ---
ParticleEmitter "HydraulicSteam":
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(230, 235, 240)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 210, 220)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.2, 0.1),
    NumberSequenceKeypoint.new(0.6, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.4, 0.5),
    NumberSequenceKeypoint.new(1,   0.9),
  })
  Rate = 0   -- Emit(8) on joint action
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(3, 8)
  SpreadAngle = Vector2.new(25, 25)
  RotSpeed = NumberRange.new(-10, 10)
  Drag = 0.8
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 0.05
  LightInfluence = 0.95
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: LASER CUTTER (factory machine cutting metal) ---
Beam "LaserCutterBeam":
  Width0 = 0.05
  Width1 = 0.05
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 10
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 0)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(1, 0.0) })
  LightEmission = 1.0
  TextureLength = 0.5
  TextureSpeed = 5
  FaceCamera = true

ParticleEmitter "CutterSparks" at cut point:
  (use WeldingSparks settings, shift color to orange-red)

ParticleEmitter "CutterSmoke" at cut point:
  Texture = "rbxassetid://255112629"
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(50, 45, 40)), ColorSequenceKeypoint.new(1, Color3.fromRGB(100, 90, 80)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.5, 0.5), NumberSequenceKeypoint.new(1, 1.0) })
  Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.4, 0.3), NumberSequenceKeypoint.new(1, 0.6) })
  Rate = 20
  Lifetime = NumberRange.new(0.5, 1.5)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(20, 20)
  Drag = 0.5
  Acceleration = Vector3.new(0, 1, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: OIL DRIP (leaking machinery) ---
ParticleEmitter "OilDrip":
  Texture = "rbxassetid://243728172"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(20,  15,  10)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(30,  20,  10)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  30,  15)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.1),
    NumberSequenceKeypoint.new(1,   0.8),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.07),
    NumberSequenceKeypoint.new(0.4, 0.10),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 1
  Lifetime = NumberRange.new(1.0, 2.0)
  Speed = NumberRange.new(0.2, 0.8)
  SpreadAngle = Vector2.new(5, 5)
  RotSpeed = NumberRange.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, -25, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: GEAR GRIND SPARKS (gears meshing, wrong direction) ---
ParticleEmitter "GearGrindSparks":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 200, 80)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 120, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 60,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.5, 0.06),
    NumberSequenceKeypoint.new(1,   0.01),
  })
  Rate = 25
  Lifetime = NumberRange.new(0.2, 0.6)
  Speed = NumberRange.new(4, 12)
  SpreadAngle = Vector2.new(60, 60)
  Drag = 0.4
  Acceleration = Vector3.new(0, -12, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.VelocityAligned
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: RUST FLAKES (old machinery, decayed environment) ---
ParticleEmitter "RustFlakes":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(150, 60,  20)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(130, 50,  15)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 40,  10)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.1),
    NumberSequenceKeypoint.new(0.9, 0.3),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.05),
    NumberSequenceKeypoint.new(0.5, 0.07),
    NumberSequenceKeypoint.new(1,   0.03),
  })
  Rate = 3
  Lifetime = NumberRange.new(2.0, 5.0)
  Speed = NumberRange.new(0.2, 0.8)
  SpreadAngle = Vector2.new(30, 30)
  RotSpeed = NumberRange.new(-30, 30)
  Drag = 0.5
  Acceleration = Vector3.new(0.1, -3, 0)
  LightEmission = 0.0
  LightInfluence = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false
`;

// ============================================================
// UI / FEEDBACK EFFECTS
// ============================================================
export const VFX_UI_FEEDBACK: string = `
=== UI / FEEDBACK VFX BIBLE ===

--- EFFECT: LEVEL UP BURST (player levels up, celebration) ---
LAYER 1 — Star burst ring:
  ParticleEmitter "LevelUpStars":
    Texture = "rbxassetid://1295938486"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 100)),
      ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 150, 20)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 100, 0)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.5, 0.0),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.15),
      NumberSequenceKeypoint.new(0.4, 0.18),
      NumberSequenceKeypoint.new(1,   0.04),
    })
    Rate = 0   -- Emit(80)
    Lifetime = NumberRange.new(0.8, 1.8)
    Speed = NumberRange.new(5, 15)
    SpreadAngle = Vector2.new(180, 180)
    RotSpeed = NumberRange.new(-90, 90)
    Drag = 0.8
    Acceleration = Vector3.new(0, 3, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false

LAYER 2 — Gold column beam:
  ParticleEmitter "LevelUpBeam":
    Texture = "rbxassetid://243160943"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 240, 100)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 150, 0)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.8),
      NumberSequenceKeypoint.new(0.2, 0.2),
      NumberSequenceKeypoint.new(0.8, 0.4),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   1.5),
      NumberSequenceKeypoint.new(0.5, 2.5),
      NumberSequenceKeypoint.new(1,   4.0),
    })
    Rate = 0   -- Emit(6)
    Lifetime = NumberRange.new(1.0, 1.5)
    Speed = NumberRange.new(5, 10)
    SpreadAngle = Vector2.new(5, 5)
    RotSpeed = NumberRange.new(-20, 20)
    Drag = 0.3
    Acceleration = Vector3.new(0, 3, 0)
    LightEmission = 1.0
    LightInfluence = 0.0
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: COIN COLLECT SPARKLE (coin pickup, currency gain) ---
ParticleEmitter "CoinSparkle":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 220, 50)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 180, 30)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(220, 140, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 100, 10)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.08),
    NumberSequenceKeypoint.new(0.4, 0.12),
    NumberSequenceKeypoint.new(1,   0.02),
  })
  Rate = 0   -- Emit(20)
  Lifetime = NumberRange.new(0.5, 1.2)
  Speed = NumberRange.new(3, 8)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-60, 60)
  Drag = 1.0
  Acceleration = Vector3.new(0, 3, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: XP GAIN SHIMMER (experience orbs floating up) ---
ParticleEmitter "XPOrbs":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  200, 255)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(60,  160, 255)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(40,  120, 220)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(20,  80,  180)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.5),
    NumberSequenceKeypoint.new(0.2, 0.0),
    NumberSequenceKeypoint.new(0.8, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.18),
    NumberSequenceKeypoint.new(0.8, 0.14),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 0   -- Emit(15)
  Lifetime = NumberRange.new(1.0, 2.0)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(-30, 30)
  Drag = 0.5
  Acceleration = Vector3.new(0, 4, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: ACHIEVEMENT UNLOCK (badge earned, trophy popup) ---
LAYER 1 — Gold star burst:
  (use LevelUpStars settings, Emit(50))

LAYER 2 — Confetti:
  ParticleEmitter "AchievementConfetti":
    Texture = "rbxassetid://6372755229"
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 80,  80)),
      ColorSequenceKeypoint.new(0.25,Color3.fromRGB(80,  200, 80)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(80,  120, 255)),
      ColorSequenceKeypoint.new(0.75,Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 80,  255)),
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.0),
      NumberSequenceKeypoint.new(0.6, 0.0),
      NumberSequenceKeypoint.new(1,   1.0),
    })
    Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0,   0.15),
      NumberSequenceKeypoint.new(0.5, 0.18),
      NumberSequenceKeypoint.new(1,   0.08),
    })
    Rate = 0   -- Emit(40)
    Lifetime = NumberRange.new(1.5, 3.0)
    Speed = NumberRange.new(5, 12)
    SpreadAngle = Vector2.new(70, 70)
    RotSpeed = NumberRange.new(-180, 180)
    Drag = 0.5
    Acceleration = Vector3.new(0, -10, 0)
    LightEmission = 0.3
    LightInfluence = 0.7
    ZOffset = 0
    LockedToPart = false
    Orientation = Enum.ParticleOrientation.FacingCamera
    FlipbookLayout = Enum.ParticleFlipbookLayout.None
    FlipbookStartRandom = false


--- EFFECT: CONFETTI CELEBRATION (win screen, finish line) ---
ParticleEmitter "CelebrationConfetti":
  Texture = "rbxassetid://6372755229"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 60,  60)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 200, 40)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(60,  200, 60)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(60,  120, 255)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(200, 60,  255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 140, 60)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.7, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.18),
    NumberSequenceKeypoint.new(0.5, 0.22),
    NumberSequenceKeypoint.new(1,   0.10),
  })
  Rate = 30
  Lifetime = NumberRange.new(3.0, 6.0)
  Speed = NumberRange.new(8, 18)
  SpreadAngle = Vector2.new(40, 40)
  RotSpeed = NumberRange.new(-180, 180)
  Drag = 0.4
  Acceleration = Vector3.new(0, -12, 0)
  EmissionDirection = Enum.NormalId.Top
  LightEmission = 0.2
  LightInfluence = 0.8
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: DAMAGE NUMBER FLOAT (damage text rising on hit) ---
  -- Handle via BillboardGui + TweenService, not ParticleEmitter.
  -- BUT use this companion particle for the hit confirmation:
ParticleEmitter "DamageHitPop":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 80,  80)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 50,  50)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 20,  20)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.2),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.1, 0.6),
    NumberSequenceKeypoint.new(0.4, 0.8),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  Rate = 0   -- Emit(3)
  Lifetime = NumberRange.new(0.15, 0.25)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Drag = 0
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: HEAL TICK (healing over time, small green plus) ---
ParticleEmitter "HealTick":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(80,  255, 120)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(60,  220, 90)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  180, 60)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.4),
    NumberSequenceKeypoint.new(0.2, 0.0),
    NumberSequenceKeypoint.new(0.7, 0.1),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.4, 0.2),
    NumberSequenceKeypoint.new(1,   0.05),
  })
  Rate = 0   -- Emit(5) every heal tick
  Lifetime = NumberRange.new(0.5, 1.0)
  Speed = NumberRange.new(1, 3)
  SpreadAngle = Vector2.new(30, 30)
  Drag = 0.5
  Acceleration = Vector3.new(0, 4, 0)
  LightEmission = 0.8
  LightInfluence = 0.2
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: SHIELD ABSORB (damage blocked by shield) ---
ParticleEmitter "ShieldAbsorb":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(100, 180, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(60,  120, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(30,  80,  200)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.6, 0.4),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.1, 1.0),
    NumberSequenceKeypoint.new(0.4, 1.5),
    NumberSequenceKeypoint.new(1,   0.3),
  })
  Rate = 0   -- Emit(5)
  Lifetime = NumberRange.new(0.2, 0.4)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Drag = 0
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: CRITICAL HIT EMPHASIS (big damage, crit star) ---
ParticleEmitter "CritHitStar":
  Texture = "rbxassetid://1295938486"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 220, 50)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(255, 150, 20)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 80,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.4, 0.0),
    NumberSequenceKeypoint.new(1,   1.0),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.2, 0.4),
    NumberSequenceKeypoint.new(0.5, 0.3),
    NumberSequenceKeypoint.new(1,   0.04),
  })
  Rate = 0   -- Emit(30)
  Lifetime = NumberRange.new(0.3, 0.8)
  Speed = NumberRange.new(5, 14)
  SpreadAngle = Vector2.new(180, 180)
  RotSpeed = NumberRange.new(-120, 120)
  Drag = 1.5
  Acceleration = Vector3.new(0, 2, 0)
  LightEmission = 1.0
  LightInfluence = 0.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- EFFECT: COMBO COUNTER FLASH (hit streak visual) ---
LAYER 1 — Ring expand:
  (use ShockwaveRing but scale small: Size max 1.5, Color orange-yellow)

LAYER 2 — Quick spark burst:
  (use ImpactSpark with Emit(15), Speed 3-8)


--- EFFECT: QUEST COMPLETE (area around NPC lights up) ---
LAYER 1 — Golden pillar of light:
  (use LevelUpBeam with Scale 2x, Rate continuous for 3 seconds)

LAYER 2 — Floating sparkles around NPC:
  (use MagicSparkle with Rate = 15 for 3 seconds, then disable)

LAYER 3 — Confetti burst:
  (use AchievementConfetti with Emit(30))


--- EFFECT: WARNING FLASH (danger zone pulsing) ---
ParticleEmitter "WarningFlash":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 50,  50)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 50,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.7),
    NumberSequenceKeypoint.new(0.3, 0.4),
    NumberSequenceKeypoint.new(0.7, 0.5),
    NumberSequenceKeypoint.new(1,   0.9),
  })
  Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   2.0),
    NumberSequenceKeypoint.new(0.5, 3.5),
    NumberSequenceKeypoint.new(1,   5.0),
  })
  Rate = 4
  Lifetime = NumberRange.new(0.5, 0.8)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Drag = 0
  Acceleration = Vector3.new(0, 0, 0)
  LightEmission = 0.9
  LightInfluence = 0.1
  ZOffset = 1
  LockedToPart = true
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false
`;

// ============================================================
// BEAMS AND TRAILS
// ============================================================
export const VFX_BEAMS_TRAILS: string = `
=== BEAMS AND TRAILS VFX BIBLE ===

--- BEAM: THIN LASER (precise, sci-fi, security system) ---
Beam "ThinLaser":
  Attachment0 = LaserSourceAttachment
  Attachment1 = LaserTargetAttachment
  Width0 = 0.06
  Width1 = 0.04
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 8
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 50,  50)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 80,  80)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 50,  50)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.5, 0.05),
    NumberSequenceKeypoint.new(1,   0.0),
  })
  LightEmission = 1.0
  TextureLength = 0.3
  TextureSpeed = 8
  FaceCamera = true

Companion ParticleEmitter "LaserImpactGlow" at hit point:
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 80, 80)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 20, 20)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.4), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 1.0) })
  Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 0.2) })
  Rate = 20
  Lifetime = NumberRange.new(0.05, 0.15)
  Speed = NumberRange.new(1, 4)
  SpreadAngle = Vector2.new(180, 180)
  Drag = 2
  LightEmission = 1.0
  ZOffset = 0
  LockedToPart = false
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- BEAM: THICK LASER (boss weapon, high-energy cannon) ---
Beam "ThickLaser":
  Width0 = 0.5
  Width1 = 0.3
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 15
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 100, 100)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 50,  50)),
    ColorSequenceKeypoint.new(0.8, Color3.fromRGB(255, 100, 100)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(255, 255, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  LightEmission = 1.0
  TextureLength = 0.5
  TextureSpeed = 12
  FaceCamera = true


--- BEAM: LIGHTNING BOLT (jagged electric attack) ---
Beam "LightningBolt":
  Width0 = 0.2
  Width1 = 0.1
  CurveSize0 = 2.0
  CurveSize1 = -2.0
  Segments = 25
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(200, 230, 255)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 180, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(60,  120, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.0),
    NumberSequenceKeypoint.new(0.3, 0.1),
    NumberSequenceKeypoint.new(0.7, 0.3),
    NumberSequenceKeypoint.new(1,   0.5),
  })
  LightEmission = 1.0
  TextureLength = 0.5
  TextureSpeed = 20
  FaceCamera = true

Lua flicker for realistic jag:
  local bolt = part.LightningBolt
  task.spawn(function()
    while bolt.Parent do
      bolt.CurveSize0 = math.random(-30, 30) / 10
      bolt.CurveSize1 = math.random(-30, 30) / 10
      task.wait(0.05)
    end
  end)


--- BEAM: TRACTOR BEAM (UFO abduction, wide cone downward) ---
Beam "TractorBeam":
  Width0 = 0.5
  Width1 = 5.0
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 20
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(180, 255, 200)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(140, 230, 170)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(100, 200, 140)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.6),
    NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.4),
    NumberSequenceKeypoint.new(1,   0.7),
  })
  LightEmission = 0.8
  TextureLength = 3
  TextureSpeed = -2
  FaceCamera = false


--- BEAM: HEALING BEAM (medic targeting ally, wavy green) ---
Beam "HealingBeam":
  Width0 = 0.15
  Width1 = 0.15
  CurveSize0 = 1.0
  CurveSize1 = -1.0
  Segments = 20
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(100, 255, 120)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(80,  230, 100)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(60,  200, 80)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(40,  170, 60)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   0.1),
  })
  LightEmission = 0.9
  TextureLength = 1
  TextureSpeed = 3
  FaceCamera = true


--- BEAM: CHAIN LIGHTNING (A to B to C to D) ---
Beam "ChainLink":
  Width0 = 0.12
  Width1 = 0.12
  CurveSize0 = 1.5
  CurveSize1 = -1.5
  Segments = 15
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(200, 230, 255)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 255, 255)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(180, 210, 255)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.2),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  LightEmission = 1.0
  TextureLength = 0.5
  TextureSpeed = 8
  FaceCamera = true

Lua chain spawn:
  local function chainLightning(targets)
    for i = 1, #targets - 1 do
      local b = Instance.new("Beam")
      b.Attachment0 = targets[i].ChainAtt
      b.Attachment1 = targets[i+1].ChainAtt
      b.CurveSize0 = math.random(-20, 20) / 10
      b.CurveSize1 = math.random(-20, 20) / 10
      -- apply other ChainLink properties
      b.Parent = targets[i]
      game:GetService("Debris"):AddItem(b, 0.25)
    end
  end


--- BEAM: ENERGY TETHER (bowed connection between two objects) ---
Beam "EnergyTether":
  Width0 = 0.3
  Width1 = 0.3
  CurveSize0 = 3.0
  CurveSize1 = -3.0
  Segments = 25
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(255, 180, 50)),
    ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 140, 20)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(200, 60,  0)),
  })
  Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0,   0.1),
    NumberSequenceKeypoint.new(0.5, 0.0),
    NumberSequenceKeypoint.new(1,   0.2),
  })
  LightEmission = 0.9
  TextureLength = 1.5
  TextureSpeed = 4
  FaceCamera = true


--- BEAM: SCANNER LINE (security sensor, detection pulse) ---
Beam "ScannerLine":
  Width0 = 0.04
  Width1 = 0.04
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 5
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(50, 255, 100)), ColorSequenceKeypoint.new(1, Color3.fromRGB(50, 200, 80)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(1, 0.0) })
  LightEmission = 1.0
  TextureLength = 10
  TextureSpeed = 0
  FaceCamera = true


--- BEAM: TARGETING LASER (sniper, lock-on) ---
Beam "TargetingLaser":
  Width0 = 0.02
  Width1 = 0.02
  CurveSize0 = 0
  CurveSize1 = 0
  Segments = 5
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 0, 0)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.7, 0.0), NumberSequenceKeypoint.new(1, 0.3) })
  LightEmission = 1.0
  TextureLength = 1
  TextureSpeed = 0
  FaceCamera = true

Target dot ParticleEmitter "TargetDot":
  Texture = "rbxassetid://243160943"
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 50, 50)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 0, 0)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.5, 0.4), NumberSequenceKeypoint.new(1, 0.5) })
  Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.15), NumberSequenceKeypoint.new(0.5, 0.20), NumberSequenceKeypoint.new(1, 0.12) })
  Rate = 5
  Lifetime = NumberRange.new(0.1, 0.2)
  Speed = NumberRange.new(0, 0)
  SpreadAngle = Vector2.new(0, 0)
  Drag = 0
  LightEmission = 1.0
  ZOffset = 0
  LockedToPart = true
  Orientation = Enum.ParticleOrientation.FacingCamera
  FlipbookLayout = Enum.ParticleFlipbookLayout.None
  FlipbookStartRandom = false


--- TRAIL: SPEED TRAIL (character sprinting) ---
Trail "SpeedTrail":
  Attachment0 = BodyTopAttachment (HumanoidRootPart)
  Attachment1 = BodyBottomAttachment (2 studs below)
  Lifetime = 0.2
  MinLength = 0.1
  MaxLength = 30
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.4, 0.7), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)), ColorSequenceKeypoint.new(0.3, Color3.fromRGB(200, 200, 255)), ColorSequenceKeypoint.new(0.7, Color3.fromRGB(100, 100, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(50, 50, 200)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.4, 0.5), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.3
  TextureLength = 2
  TextureSpeed = 5
  FaceCamera = true


--- TRAIL: SWORD SLASH ARC (visible air-cut after swing) ---
Trail "SwordArc":
  Attachment0 = BladeBaseAttachment
  Attachment1 = BladeTipAttachment
  Lifetime = 0.12
  MinLength = 0
  MaxLength = 15
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.6, 0.5), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)), ColorSequenceKeypoint.new(0.3, Color3.fromRGB(180, 200, 255)), ColorSequenceKeypoint.new(0.7, Color3.fromRGB(80, 120, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(30, 60, 200)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.3, 0.1), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.8
  TextureLength = 1
  FaceCamera = false


--- TRAIL: MAGIC WAND SWIRL (wizard casting arc) ---
Trail "WandSwirl":
  Attachment0 = WandTipAttachmentA
  Attachment1 = WandTipAttachmentB (0.1 studs offset for width)
  Lifetime = 0.6
  MinLength = 0
  MaxLength = 20
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 200)), ColorSequenceKeypoint.new(0.2, Color3.fromRGB(200, 150, 255)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(100, 80, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(30, 0, 150)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.4, 0.2), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.9
  TextureLength = 1.5
  TextureSpeed = 3
  FaceCamera = true


--- TRAIL: VEHICLE EXHAUST TRAIL (continuous from tailpipe) ---
Trail "ExhaustTrail":
  Attachment0 = ExhaustPipeAttachmentA
  Attachment1 = ExhaustPipeAttachmentB (0.3 studs apart)
  Lifetime = 1.0
  MinLength = 0
  MaxLength = 40
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(0.3, 1.0), NumberSequenceKeypoint.new(0.7, 0.6), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(80, 75, 70)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(140, 135, 125)), ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 195, 185)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.4, 0.5), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.0
  TextureLength = 3
  FaceCamera = true


--- TRAIL: BULLET SMOKE TRAIL ---
Trail "BulletSmoke":
  Attachment0 = BulletFrontAttachment
  Attachment1 = BulletRearAttachment (0.2 studs behind)
  Lifetime = 0.4
  MinLength = 0
  MaxLength = 25
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.6), NumberSequenceKeypoint.new(0.4, 0.8), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(160, 155, 145)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(180, 175, 165)), ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 195, 188)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.4), NumberSequenceKeypoint.new(0.3, 0.5), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.0
  TextureLength = 2
  FaceCamera = true


--- TRAIL: ICE TRAIL (leaving frozen ground behind) ---
Trail "IceTrail":
  Attachment0 = LeftFootAttachment
  Attachment1 = RightFootAttachment
  Lifetime = 0.8
  MinLength = 0.05
  MaxLength = 20
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.5, 0.5), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(200, 240, 255)), ColorSequenceKeypoint.new(0.4, Color3.fromRGB(150, 210, 255)), ColorSequenceKeypoint.new(0.8, Color3.fromRGB(100, 180, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(60, 140, 230)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(0.4, 0.4), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.4
  TextureLength = 1
  FaceCamera = false


--- TRAIL: FIRE TRAIL (fire boots / on-fire character) ---
Trail "FireTrailBoots":
  Attachment0 = BootFrontAttachment
  Attachment1 = BootBackAttachment
  Lifetime = 0.3
  MinLength = 0
  MaxLength = 15
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 200)), ColorSequenceKeypoint.new(0.3, Color3.fromRGB(255, 150, 20)), ColorSequenceKeypoint.new(0.7, Color3.fromRGB(255, 60, 0)), ColorSequenceKeypoint.new(1, Color3.fromRGB(150, 20, 0)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.0), NumberSequenceKeypoint.new(0.4, 0.2), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.9
  TextureLength = 1
  TextureSpeed = 4
  FaceCamera = true


--- TRAIL: RAINBOW TRAIL (cosmetic gamepass) ---
Trail "RainbowTrail":
  Attachment0 = CharacterTopAttachment
  Attachment1 = CharacterBottomAttachment
  Lifetime = 0.5
  MinLength = 0.05
  MaxLength = 25
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.5, 0.7), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0,    Color3.fromRGB(255, 0,   128)),
    ColorSequenceKeypoint.new(0.16, Color3.fromRGB(255, 80,  0)),
    ColorSequenceKeypoint.new(0.33, Color3.fromRGB(255, 210, 0)),
    ColorSequenceKeypoint.new(0.5,  Color3.fromRGB(50,  210, 50)),
    ColorSequenceKeypoint.new(0.66, Color3.fromRGB(0,   160, 255)),
    ColorSequenceKeypoint.new(0.83, Color3.fromRGB(120, 0,   255)),
    ColorSequenceKeypoint.new(1,    Color3.fromRGB(255, 0,   200)),
  })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.4, 0.2), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.5
  TextureLength = 2
  TextureSpeed = 2
  FaceCamera = true


--- TRAIL: GHOST AFTERIMAGE (phase shift, shadow clone) ---
Trail "GhostAfterimage":
  Attachment0 = BodyTopAttachment
  Attachment1 = BodyBottomAttachment
  Lifetime = 0.4
  MinLength = 0.1
  MaxLength = 20
  WidthScale = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.0), NumberSequenceKeypoint.new(0.3, 0.9), NumberSequenceKeypoint.new(0.7, 0.4), NumberSequenceKeypoint.new(1, 0.0) })
  Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, Color3.fromRGB(180, 210, 255)), ColorSequenceKeypoint.new(0.4, Color3.fromRGB(140, 170, 240)), ColorSequenceKeypoint.new(0.8, Color3.fromRGB(100, 130, 210)), ColorSequenceKeypoint.new(1, Color3.fromRGB(60, 90, 180)) })
  Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(0.3, 0.6), NumberSequenceKeypoint.new(0.7, 0.8), NumberSequenceKeypoint.new(1, 1.0) })
  LightEmission = 0.4
  TextureLength = 3
  FaceCamera = false


=== INTEGRATION NOTES ===

PERFORMANCE BUDGET:
  Mobile: max 3 active ParticleEmitters per 16x16 stud area
  PC: max 8-10 active ParticleEmitters per zone
  Disable emitters not in camera frustum (use workspace.CurrentCamera:WorldToViewportPoint)
  Lower Rate by 50% on mobile (check UserInputService.TouchEnabled)

BURST vs CONTINUOUS:
  Continuous: set Rate, Enabled = true
  One-shot: Rate = 0, call :Emit(count), cleanup with Debris:AddItem(part, maxLifetime + 1)

COMMON TEXTURE IDs:
  rbxassetid://255112629   -- soft cloud/smoke
  rbxassetid://243160943   -- round soft glow dot
  rbxassetid://243728172   -- water drop / teardrop
  rbxassetid://1295938486  -- tiny bright spark dot
  rbxassetid://1266170131  -- flame wisp / fire tongue
  rbxassetid://3270713512  -- ring / ripple
  rbxassetid://3855085     -- rain streak
  rbxassetid://6372755229  -- leaf shape
  rbxassetid://6401188862  -- rune glyph
  rbxassetid://9896971689  -- caustic light blob

LightEmission guide:
  1.0 = full self-illumination, ignores scene lighting (fire, magic, UI effects)
  0.0 = fully scene-lit (smoke, leaves, dust, water)
  0.3-0.7 = hybrid (embers, pollen, sparkles)

Orientation guide:
  FacingCamera = billboard (fire, smoke, most)
  VelocityAligned = stretches along path (sparks, rain, bullets)
  VelocityPerpendicular = flat sheet normal to velocity (ripples, slash marks)
`;

