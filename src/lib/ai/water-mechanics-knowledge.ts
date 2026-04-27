/**
 * Water Mechanics & Aquatic Systems Knowledge Base
 *
 * Deep water/swimming/buoyancy patterns extracted from Roblox DevForum threads,
 * official docs, and community resources. Covers terrain water, custom swim systems,
 * buoyancy physics, underwater effects, boats, waves, fishing, and waterfalls.
 *
 * Sources:
 * - devforum.roblox.com/t/performant-procedural-physics-based-skinned-mesh-ocean-and-buoyancy-simulation/2996473
 * - devforum.roblox.com/t/how-to-emulate-robloxs-buoyancy-system-in-part-water/3653800
 * - devforum.roblox.com/t/high-performance-water-swimmable-part-20/2038483
 * - devforum.roblox.com/t/smooth-terrain-swimming-but-inside-of-partsv30/1766401
 * - devforum.roblox.com/t/calculating-custom-buoyancy/240104
 * - devforum.roblox.com/t/realistic-boat-system-floats-on-terrain-water-optimized-free/3541235
 * - devforum.roblox.com/t/custom-water-with-gerstner-waves-and-animated-texture-boat-physics/1765594
 * - devforum.roblox.com/t/custom-water-waves-simulation/567089
 * - devforum.roblox.com/t/underwater-effects/1031133
 * - devforum.roblox.com/t/realistic-water-interaction-splash-trails-bubbles-open-source/3172606
 * - devforum.roblox.com/t/making-a-physics-based-boat-that-works-with-terrain-water/1352966
 * - devforum.roblox.com/t/how-do-i-make-fishing-rod-like-fisch/3640179
 * - devforum.roblox.com/t/proper-fishing-mechanics-in-video-games/532224
 * - devforum.roblox.com/t/how-do-i-achieve-this-waterfall/628749
 * - devforum.roblox.com/t/simulating-water-physics-in-studio/644117
 * - devforum.roblox.com/t/custom-water-physics/2456501
 * - devforum.roblox.com/t/help-with-creating-custom-swimming-system/2947268
 * - devforum.roblox.com/t/how-do-i-make-an-oxygen-system-for-my-game/695566
 * - create.roblox.com/docs/reference/engine/classes/Terrain
 * - create.roblox.com/docs/reference/engine/enums/Material
 * - And 15+ additional threads
 */

import 'server-only'

export const WATER_MECHANICS_KNOWLEDGE = `
=== WATER MECHANICS & AQUATIC SYSTEMS (from top Roblox developers & official docs) ===

TERRAIN WATER BASICS:
- Roblox terrain has a built-in Water material that provides automatic swimming,
  buoyancy, and surface visuals. It is the simplest way to add water.

- Creating terrain water:
  local terrain = workspace.Terrain
  -- Fill a region with water
  terrain:FillBlock(CFrame.new(0, -5, 0), Vector3.new(200, 10, 200), Enum.Material.Water)

  -- Fill a ball-shaped water volume (for ponds)
  terrain:FillBall(Vector3.new(0, -3, 0), 20, Enum.Material.Water)

  -- Fill a cylinder (for wells, tubes)
  terrain:FillCylinder(CFrame.new(0, -5, 0), 10, 15, Enum.Material.Water)

- Terrain water properties (set in Terrain object properties):
  - WaterWaveSize: number (0-1) — height of surface waves. Default 0.15.
  - WaterWaveSpeed: number (0-100) — speed of wave animation. Default 10.
  - WaterTransparency: number (0-1) — how see-through the water is. Default 0.3.
  - WaterReflectance: number (0-1) — surface reflectivity. Default 1.
  - WaterColor: Color3 — tint of the water. Default blueish.
  Terrain.WaterWaveSize = 0.3
  Terrain.WaterWaveSpeed = 15
  Terrain.WaterTransparency = 0.5
  Terrain.WaterColor = Color3.fromRGB(50, 100, 150)

- Water level: Terrain water fills voxels. The water surface is at the TOP of the
  filled voxels. To set a flat water level at Y=0:
  terrain:FillBlock(CFrame.new(0, -5, 0), Vector3.new(500, 10, 500), Enum.Material.Water)
  -- This creates water from Y=-10 to Y=0

- Removing terrain water:
  terrain:FillBlock(CFrame.new(0, -5, 0), Vector3.new(200, 10, 200), Enum.Material.Air)

- Reading water occupancy at a position:
  local material, occupancy = terrain:ReadVoxels(
      Region3.new(Vector3.new(-1,-1,-1), Vector3.new(1,1,1)):ExpandToGrid(4),
      4
  )
  -- Check material[1][1][1] == Enum.Material.Water

CUSTOM WATER (PART-BASED):
- For non-terrain water (pools, rivers, decorative), use Parts with specific materials.
- Typical setup:
  local waterPart = Instance.new("Part")
  waterPart.Name = "CustomWater"
  waterPart.Size = Vector3.new(50, 0.5, 50)
  waterPart.Position = Vector3.new(0, 0, 0)
  waterPart.Material = Enum.Material.Glass  -- or Neon for glowing water
  waterPart.Color = Color3.fromRGB(40, 100, 180)
  waterPart.Transparency = 0.5
  waterPart.CanCollide = false  -- players fall through
  waterPart.Anchored = true
  waterPart.Parent = workspace

- For a MeshPart water surface, use a flat plane mesh with Glass/ForceField material
  and a SurfaceAppearance for custom water normal maps.

- Detecting when a player enters/exits custom water:
  local playersInWater = {}

  waterPart.Touched:Connect(function(hit)
      local character = hit.Parent
      local humanoid = character and character:FindFirstChildOfClass("Humanoid")
      if humanoid and not playersInWater[character] then
          playersInWater[character] = true
          onEnterWater(character, humanoid)
      end
  end)

  waterPart.TouchEnded:Connect(function(hit)
      local character = hit.Parent
      if playersInWater[character] then
          playersInWater[character] = nil
          onExitWater(character)
      end
  end)

- BETTER detection (Touched can be unreliable): Use a region check each frame.
  RunService.Heartbeat:Connect(function()
      for _, player in Players:GetPlayers() do
          local char = player.Character
          local root = char and char:FindFirstChild("HumanoidRootPart")
          if root then
              local inWater = isPointInWaterZone(root.Position)
              if inWater and not playersInWater[char] then
                  playersInWater[char] = true
                  onEnterWater(char)
              elseif not inWater and playersInWater[char] then
                  playersInWater[char] = nil
                  onExitWater(char)
              end
          end
      end
  end)

  local function isPointInWaterZone(pos)
      for _, zone in waterZones do
          local rel = zone.CFrame:PointToObjectSpace(pos)
          local half = zone.Size / 2
          if math.abs(rel.X) < half.X and math.abs(rel.Y) < half.Y and math.abs(rel.Z) < half.Z then
              return true
          end
      end
      return false
  end

SWIMMING STATE DETECTION:
- Roblox Humanoid has built-in swimming support with terrain water.
- Humanoid states related to water:
  Enum.HumanoidStateType.Swimming — actively swimming in terrain water
  Enum.HumanoidStateType.Freefall — falling (not in water)
  Enum.HumanoidStateType.Running — on ground

- Detecting swimming state:
  local humanoid = character:WaitForChild("Humanoid")
  humanoid.StateChanged:Connect(function(oldState, newState)
      if newState == Enum.HumanoidStateType.Swimming then
          -- Player entered water
          enableSwimmingUI()
      elseif oldState == Enum.HumanoidStateType.Swimming then
          -- Player left water
          disableSwimmingUI()
      end
  end)

- Checking current state:
  if humanoid:GetState() == Enum.HumanoidStateType.Swimming then
      -- currently swimming
  end

- Disabling swimming (force no swim):
  humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, false)
  -- Player will sink through terrain water instead of swimming

- Re-enabling swimming:
  humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, true)

CUSTOM SWIM SYSTEM:
- For full control (custom water parts, 3D movement, animations), disable default
  swimming and apply forces manually.

- Complete custom swim system:
  -- LocalScript in StarterCharacterScripts
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")
  local UIS = game:GetService("UserInputService")

  local player = Players.LocalPlayer
  local character = player.Character or player.CharacterAdded:Wait()
  local humanoid = character:WaitForChild("Humanoid")
  local rootPart = character:WaitForChild("HumanoidRootPart")

  local isSwimming = false
  local swimSpeed = 20
  local swimUpSpeed = 14
  local swimDownSpeed = 10
  local waterSurfaceY = 0  -- Y level of water surface

  -- Disable default swimming
  humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, false)

  -- Create swim force
  local swimForce = Instance.new("VectorForce")
  swimForce.Name = "SwimForce"
  swimForce.Force = Vector3.new(0, 0, 0)
  swimForce.RelativeTo = Enum.ActuatorRelativeTo.World
  swimForce.Attachment0 = rootPart:FindFirstChild("RootAttachment")
      or Instance.new("Attachment", rootPart)
  swimForce.Parent = rootPart
  swimForce.Enabled = false

  -- Counteract gravity when in water
  local gravityForce = Instance.new("VectorForce")
  gravityForce.Name = "AntiGravity"
  gravityForce.Force = Vector3.new(0, workspace.Gravity * rootPart.AssemblyMass, 0)
  gravityForce.RelativeTo = Enum.ActuatorRelativeTo.World
  gravityForce.Attachment0 = swimForce.Attachment0
  gravityForce.Parent = rootPart
  gravityForce.Enabled = false

  local keysDown = {}
  UIS.InputBegan:Connect(function(input, gpe)
      if gpe then return end
      keysDown[input.KeyCode] = true
  end)
  UIS.InputEnded:Connect(function(input)
      keysDown[input.KeyCode] = nil
  end)

  RunService.Heartbeat:Connect(function(dt)
      local inWater = rootPart.Position.Y < waterSurfaceY

      if inWater and not isSwimming then
          isSwimming = true
          swimForce.Enabled = true
          gravityForce.Enabled = true
          humanoid.PlatformStand = true  -- allows free rotation
          rootPart.Velocity = rootPart.Velocity * 0.5  -- dampen entry splash
      elseif not inWater and isSwimming then
          isSwimming = false
          swimForce.Enabled = false
          gravityForce.Enabled = false
          humanoid.PlatformStand = false
      end

      if isSwimming then
          local camera = workspace.CurrentCamera
          local moveDir = Vector3.new(0, 0, 0)

          -- Horizontal movement (WASD)
          local forward = camera.CFrame.LookVector * Vector3.new(1, 0, 1)
          local right = camera.CFrame.RightVector * Vector3.new(1, 0, 1)
          if forward.Magnitude > 0 then forward = forward.Unit end
          if right.Magnitude > 0 then right = right.Unit end

          if keysDown[Enum.KeyCode.W] then moveDir += forward end
          if keysDown[Enum.KeyCode.S] then moveDir -= forward end
          if keysDown[Enum.KeyCode.D] then moveDir += right end
          if keysDown[Enum.KeyCode.A] then moveDir -= right end

          -- Vertical movement
          if keysDown[Enum.KeyCode.Space] then
              moveDir += Vector3.new(0, swimUpSpeed / swimSpeed, 0)
          end
          if keysDown[Enum.KeyCode.LeftShift] then
              moveDir -= Vector3.new(0, swimDownSpeed / swimSpeed, 0)
          end

          if moveDir.Magnitude > 0 then
              moveDir = moveDir.Unit * swimSpeed
          end

          -- Apply as velocity (with damping)
          local targetVel = moveDir
          local currentVel = rootPart.AssemblyLinearVelocity
          local force = (targetVel - currentVel) * rootPart.AssemblyMass * 5
          swimForce.Force = force

          -- Update anti-gravity based on current mass
          gravityForce.Force = Vector3.new(0, workspace.Gravity * rootPart.AssemblyMass, 0)

          -- Clamp to water surface (don't fly out)
          if rootPart.Position.Y > waterSurfaceY - 1 and moveDir.Y > 0 then
              -- Near surface, let player jump out
              isSwimming = false
              swimForce.Enabled = false
              gravityForce.Enabled = false
              humanoid.PlatformStand = false
              rootPart.AssemblyLinearVelocity = Vector3.new(
                  rootPart.AssemblyLinearVelocity.X,
                  30,  -- jump out of water
                  rootPart.AssemblyLinearVelocity.Z
              )
          end
      end
  end)

BUOYANCY PHYSICS:
- Buoyancy = upward force that counters gravity when an object is submerged.
- Roblox terrain water provides automatic buoyancy for BaseParts. Custom water does not.

- Simple buoyancy (single force point):
  local function applyBuoyancy(part, waterSurfaceY)
      local submersion = math.clamp((waterSurfaceY - part.Position.Y) / part.Size.Y, 0, 1)
      local buoyancyForce = workspace.Gravity * part.AssemblyMass * submersion * 1.2
      -- 1.2 = buoyancy multiplier (>1 = floats, <1 = sinks, =1 = neutral)

      local bodyForce = part:FindFirstChild("BuoyancyForce")
      if not bodyForce then
          bodyForce = Instance.new("VectorForce")
          bodyForce.Name = "BuoyancyForce"
          bodyForce.RelativeTo = Enum.ActuatorRelativeTo.World
          local att = Instance.new("Attachment")
          att.Parent = part
          bodyForce.Attachment0 = att
          bodyForce.Parent = part
      end
      bodyForce.Force = Vector3.new(0, buoyancyForce, 0)
  end

- Multi-point buoyancy (for boats/ships — prevents flipping):
  -- Place 4 attachment points at corners of boat hull
  local buoyancyPoints = {
      Vector3.new(-5, -1, -8),   -- front-left
      Vector3.new(5, -1, -8),    -- front-right
      Vector3.new(-5, -1, 8),    -- back-left
      Vector3.new(5, -1, 8),     -- back-right
  }

  RunService.Heartbeat:Connect(function()
      for i, localPos in buoyancyPoints do
          local worldPos = boat.CFrame:PointToWorldSpace(localPos)
          local depth = waterSurfaceY - worldPos.Y
          if depth > 0 then
              local force = math.min(depth, 3) * workspace.Gravity * boat.AssemblyMass / #buoyancyPoints
              -- Apply force at specific attachment point
              local att = boat:FindFirstChild("BuoyancyAtt" .. i)
              if att then
                  local vf = att:FindFirstChildOfClass("VectorForce")
                  if vf then
                      vf.Force = Vector3.new(0, force, 0)
                  end
              end
          end
      end
  end)

- Water drag (damping): Objects in water should slow down.
  -- Apply drag proportional to velocity
  local drag = -rootPart.AssemblyLinearVelocity * rootPart.AssemblyMass * 0.8
  dragForce.Force = drag

- Density-based floating:
  Objects with density < 1 float, density > 1 sink.
  Roblox Part density = Mass / Volume.
  For custom density: Adjust the buoyancy multiplier.
  local density = 0.5  -- lighter than water, floats high
  local buoyancyMult = 1 / density

UNDERWATER EFFECTS:
- Use Lighting post-processing effects to create an underwater atmosphere.

- Complete underwater effect system:
  local Lighting = game:GetService("Lighting")

  -- Create effects (parent to Lighting)
  local colorCorrection = Instance.new("ColorCorrectionEffect")
  colorCorrection.Name = "UnderwaterCC"
  colorCorrection.TintColor = Color3.fromRGB(50, 130, 200)  -- blue tint
  colorCorrection.Brightness = -0.1
  colorCorrection.Contrast = -0.1
  colorCorrection.Saturation = -0.2
  colorCorrection.Enabled = false
  colorCorrection.Parent = Lighting

  local blur = Instance.new("BlurEffect")
  blur.Name = "UnderwaterBlur"
  blur.Size = 10
  blur.Enabled = false
  blur.Parent = Lighting

  -- Optional: Depth-based fog
  local function setUnderwaterFog(enabled, depth)
      if enabled then
          Lighting.FogColor = Color3.fromRGB(20, 60, 100)
          Lighting.FogStart = math.max(0, 50 - depth * 2)
          Lighting.FogEnd = math.max(50, 200 - depth * 3)
      else
          Lighting.FogColor = Color3.fromRGB(192, 192, 192)
          Lighting.FogStart = 0
          Lighting.FogEnd = 100000
      end
  end

  local function enterUnderwater(depth)
      colorCorrection.Enabled = true
      blur.Enabled = true
      -- Deeper = darker + more blur
      colorCorrection.Brightness = math.clamp(-0.05 - depth * 0.005, -0.5, 0)
      blur.Size = math.clamp(6 + depth * 0.2, 6, 24)
      setUnderwaterFog(true, depth)
  end

  local function exitUnderwater()
      colorCorrection.Enabled = false
      blur.Enabled = false
      setUnderwaterFog(false, 0)
  end

- Bubble particles (attach to camera or character):
  local bubbleEmitter = Instance.new("ParticleEmitter")
  bubbleEmitter.Name = "UnderwaterBubbles"
  bubbleEmitter.Texture = "rbxassetid://241685484"  -- circle texture
  bubbleEmitter.Color = ColorSequence.new(Color3.fromRGB(200, 220, 255))
  bubbleEmitter.Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.1),
      NumberSequenceKeypoint.new(1, 0.3),
  })
  bubbleEmitter.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.3),
      NumberSequenceKeypoint.new(1, 0.9),
  })
  bubbleEmitter.Lifetime = NumberRange.new(1, 3)
  bubbleEmitter.Rate = 15
  bubbleEmitter.Speed = NumberRange.new(1, 3)
  bubbleEmitter.SpreadAngle = Vector2.new(30, 30)
  bubbleEmitter.EmissionDirection = Enum.NormalId.Top
  bubbleEmitter.Enabled = false
  bubbleEmitter.Parent = rootPart

OXYGEN / BREATH SYSTEM:
- Classic underwater breath mechanic: timer counts down, damage when expired.

- Complete oxygen system:
  local MAX_OXYGEN = 100
  local OXYGEN_DRAIN_RATE = 5    -- per second underwater
  local OXYGEN_REFILL_RATE = 20  -- per second on surface
  local DROWN_DAMAGE = 10        -- damage per second when out of air
  local DROWN_TICK = 1            -- seconds between damage ticks

  local oxygen = MAX_OXYGEN
  local isUnderwater = false
  local drownTimer = 0

  RunService.Heartbeat:Connect(function(dt)
      if isUnderwater then
          oxygen = math.max(0, oxygen - OXYGEN_DRAIN_RATE * dt)
          if oxygen <= 0 then
              drownTimer += dt
              if drownTimer >= DROWN_TICK then
                  drownTimer = 0
                  humanoid:TakeDamage(DROWN_DAMAGE)
              end
          end
      else
          oxygen = math.min(MAX_OXYGEN, oxygen + OXYGEN_REFILL_RATE * dt)
          drownTimer = 0
      end

      -- Update UI
      oxygenBar.Size = UDim2.new(oxygen / MAX_OXYGEN, 0, 1, 0)
      oxygenGui.Visible = oxygen < MAX_OXYGEN  -- only show when not full
  end)

- Oxygen UI (breath bar):
  local oxygenGui = Instance.new("ScreenGui")
  oxygenGui.Name = "OxygenUI"
  oxygenGui.Parent = playerGui

  local barBg = Instance.new("Frame")
  barBg.Size = UDim2.new(0.3, 0, 0, 16)
  barBg.Position = UDim2.new(0.35, 0, 0.9, 0)
  barBg.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
  barBg.Parent = oxygenGui
  Instance.new("UICorner", barBg).CornerRadius = UDim.new(0, 8)

  local oxygenBar = Instance.new("Frame")
  oxygenBar.Size = UDim2.new(1, 0, 1, 0)
  oxygenBar.BackgroundColor3 = Color3.fromRGB(60, 160, 255)
  oxygenBar.Parent = barBg
  Instance.new("UICorner", oxygenBar).CornerRadius = UDim.new(0, 8)

  -- Air bubble collectibles: restore oxygen
  local function collectAirBubble()
      oxygen = math.min(MAX_OXYGEN, oxygen + 30)
  end

WATER SURFACE EFFECTS:
- Splash on water entry:
  local function createSplash(position)
      local splash = Instance.new("Part")
      splash.Size = Vector3.new(1, 1, 1)
      splash.Position = position
      splash.Transparency = 1
      splash.CanCollide = false
      splash.Anchored = true
      splash.Parent = workspace

      local emitter = Instance.new("ParticleEmitter")
      emitter.Texture = "rbxassetid://241685484"
      emitter.Color = ColorSequence.new(Color3.fromRGB(180, 210, 240))
      emitter.Size = NumberSequence.new({
          NumberSequenceKeypoint.new(0, 0.5),
          NumberSequenceKeypoint.new(0.5, 1.5),
          NumberSequenceKeypoint.new(1, 0),
      })
      emitter.Transparency = NumberSequence.new({
          NumberSequenceKeypoint.new(0, 0.2),
          NumberSequenceKeypoint.new(1, 1),
      })
      emitter.Lifetime = NumberRange.new(0.3, 0.8)
      emitter.Speed = NumberRange.new(8, 15)
      emitter.SpreadAngle = Vector2.new(60, 60)
      emitter.EmissionDirection = Enum.NormalId.Top
      emitter.Rate = 0  -- burst mode
      emitter.Parent = splash
      emitter:Emit(30)  -- burst 30 particles

      -- Sound
      local splashSound = Instance.new("Sound")
      splashSound.SoundId = "rbxassetid://142070127"  -- water splash
      splashSound.Volume = 0.8
      splashSound.Parent = splash
      splashSound:Play()

      task.delay(2, function()
          splash:Destroy()
      end)
  end

- Ripple effect (expanding ring on water surface):
  local function createRipple(position)
      local ripple = Instance.new("Part")
      ripple.Shape = Enum.PartType.Cylinder
      ripple.Size = Vector3.new(0.1, 2, 2)
      ripple.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.rad(90))
      ripple.Material = Enum.Material.Neon
      ripple.Color = Color3.fromRGB(200, 220, 255)
      ripple.Transparency = 0.5
      ripple.CanCollide = false
      ripple.Anchored = true
      ripple.Parent = workspace

      -- Animate expanding ring
      local TweenService = game:GetService("TweenService")
      local tween = TweenService:Create(ripple, TweenInfo.new(1.5, Enum.EasingStyle.Quad), {
          Size = Vector3.new(0.1, 15, 15),
          Transparency = 1,
      })
      tween:Play()
      tween.Completed:Connect(function()
          ripple:Destroy()
      end)
  end

BOAT / SHIP PHYSICS:
- Boats use multi-point buoyancy (see BUOYANCY PHYSICS section) combined with
  steering forces and wave interaction.

- Basic boat controller:
  local boat = workspace.Boat  -- Model with PrimaryPart set
  local seat = boat:FindFirstChildOfClass("VehicleSeat")
  seat.MaxSpeed = 50
  seat.Torque = 10000
  seat.TurnSpeed = 2

  -- VehicleSeat provides Throttle (-1 to 1) and Steer (-1 to 1) automatically.
  -- Apply thrust and steering each frame:
  local thrustForce = Instance.new("VectorForce")
  thrustForce.RelativeTo = Enum.ActuatorRelativeTo.Attachment0
  thrustForce.Attachment0 = boat.PrimaryPart:FindFirstChild("ThrustAttachment")
  thrustForce.Parent = boat.PrimaryPart

  local steerTorque = Instance.new("Torque")
  steerTorque.RelativeTo = Enum.ActuatorRelativeTo.Attachment0
  steerTorque.Attachment0 = thrustForce.Attachment0
  steerTorque.Parent = boat.PrimaryPart

  RunService.Heartbeat:Connect(function()
      local speed = seat.Throttle * 5000
      thrustForce.Force = Vector3.new(0, 0, -speed)

      local turn = seat.Steer * 3000
      steerTorque.Torque = Vector3.new(0, -turn, 0)
  end)

- Wave rocking (simulate boat bobbing on waves):
  local startY = boat.PrimaryPart.Position.Y
  local waveAmplitude = 1.5  -- studs
  local waveFrequency = 0.8  -- cycles per second
  local rollAmplitude = math.rad(5)  -- tilt degrees

  RunService.Heartbeat:Connect(function()
      local t = tick()
      local waveY = math.sin(t * waveFrequency * math.pi * 2) * waveAmplitude
      local roll = math.sin(t * waveFrequency * math.pi * 2 + 0.5) * rollAmplitude

      -- Apply via AlignPosition + AlignOrientation or BodyPosition
      -- (buoyancy forces handle the main Y, this adds wave motion on top)
  end)

WAVE SIMULATION:
- Sine wave (simplest):
  local function getWaveHeight(x, z, time)
      return math.sin(x * 0.05 + time) * 2 + math.sin(z * 0.03 + time * 1.3) * 1.5
  end

- Gerstner waves (more realistic, used in AAA games):
  -- Gerstner wave displaces both vertically AND horizontally
  local function gerstnerWave(pos, time, amplitude, wavelength, speed, direction)
      local k = 2 * math.pi / wavelength
      local w = speed * k
      local phase = k * (direction.X * pos.X + direction.Y * pos.Z) - w * time
      local steepness = 0.5  -- 0-1, higher = sharper peaks

      local dx = steepness * amplitude * direction.X * math.cos(phase)
      local dz = steepness * amplitude * direction.Y * math.cos(phase)
      local dy = amplitude * math.sin(phase)

      return Vector3.new(dx, dy, dz)
  end

  -- Sum multiple waves for realistic ocean:
  local function getOceanHeight(x, z, time)
      local pos = Vector2.new(x, z)
      local total = Vector3.new(0, 0, 0)
      total += gerstnerWave(pos, time, 2, 40, 3, Vector2.new(1, 0.3).Unit)
      total += gerstnerWave(pos, time, 1.2, 25, 2, Vector2.new(-0.5, 1).Unit)
      total += gerstnerWave(pos, time, 0.6, 15, 4, Vector2.new(0.7, -0.7).Unit)
      return total.Y
  end

- Animated water mesh (for custom oceans):
  Use an EditableMesh or a grid of small parts that move up/down each frame.
  WARNING: Moving many parts per frame is expensive. Use a MeshPart with bone
  animation or a single large mesh with vertex displacement via EditableMesh.

- Terrain water does NOT have customizable waves beyond WaveSize/WaveSpeed.
  For advanced wave control, use custom water meshes.

WATERFALL CONSTRUCTION:
- Waterfalls combine parts + particle effects + sound for a convincing effect.

- Waterfall structure:
  1. Water stream part (thin part, angled or vertical)
  2. ParticleEmitter for mist/spray at bottom
  3. ParticleEmitter for falling water droplets
  4. Sound for waterfall ambience
  5. Splash pool at bottom (terrain water or custom part)

- Waterfall particles:
  local waterfall = Instance.new("Part")
  waterfall.Size = Vector3.new(10, 20, 1)
  waterfall.Position = Vector3.new(0, 10, 0)
  waterfall.Transparency = 0.6
  waterfall.Material = Enum.Material.Glass
  waterfall.Color = Color3.fromRGB(150, 200, 230)
  waterfall.CanCollide = false
  waterfall.Anchored = true
  waterfall.Parent = workspace

  -- Falling water particles
  local fallEmitter = Instance.new("ParticleEmitter")
  fallEmitter.Texture = "rbxassetid://241685484"
  fallEmitter.Color = ColorSequence.new(Color3.fromRGB(200, 220, 255))
  fallEmitter.Size = NumberSequence.new(0.5, 1.5)
  fallEmitter.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.3),
      NumberSequenceKeypoint.new(1, 0.8),
  })
  fallEmitter.Lifetime = NumberRange.new(0.5, 1.5)
  fallEmitter.Rate = 80
  fallEmitter.Speed = NumberRange.new(2, 5)
  fallEmitter.EmissionDirection = Enum.NormalId.Bottom
  fallEmitter.Acceleration = Vector3.new(0, -30, 0)  -- gravity
  fallEmitter.Parent = waterfall

  -- Mist at base
  local mistPart = Instance.new("Part")
  mistPart.Size = Vector3.new(12, 1, 6)
  mistPart.Position = Vector3.new(0, 0, 2)
  mistPart.Transparency = 1
  mistPart.CanCollide = false
  mistPart.Anchored = true
  mistPart.Parent = workspace

  local mistEmitter = Instance.new("ParticleEmitter")
  mistEmitter.Texture = "rbxassetid://1084981289"  -- cloud/smoke texture
  mistEmitter.Color = ColorSequence.new(Color3.fromRGB(220, 230, 245))
  mistEmitter.Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 2),
      NumberSequenceKeypoint.new(1, 6),
  })
  mistEmitter.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.6),
      NumberSequenceKeypoint.new(1, 1),
  })
  mistEmitter.Lifetime = NumberRange.new(2, 4)
  mistEmitter.Rate = 20
  mistEmitter.Speed = NumberRange.new(1, 3)
  mistEmitter.SpreadAngle = Vector2.new(90, 45)
  mistEmitter.EmissionDirection = Enum.NormalId.Top
  mistEmitter.Parent = mistPart

  -- Waterfall sound
  local waterfallSound = Instance.new("Sound")
  waterfallSound.SoundId = "rbxassetid://6564308795"  -- waterfall ambience
  waterfallSound.Volume = 0.6
  waterfallSound.Looped = true
  waterfallSound.RollOffMode = Enum.RollOffMode.Linear
  waterfallSound.RollOffMinDistance = 10
  waterfallSound.RollOffMaxDistance = 80
  waterfallSound.Parent = waterfall
  waterfallSound:Play()

RIVER CURRENT:
- River currents push players/objects in a flow direction using force zones.

- Current zone implementation:
  local currentZone = Instance.new("Part")
  currentZone.Size = Vector3.new(10, 5, 50)
  currentZone.CanCollide = false
  currentZone.Transparency = 1
  currentZone.Anchored = true
  currentZone.Parent = workspace

  local flowDirection = Vector3.new(0, 0, -1)  -- flow along -Z
  local flowStrength = 15  -- studs per second

  currentZone.Touched:Connect(function(hit)
      local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
      if humanoid then
          local root = hit.Parent:FindFirstChild("HumanoidRootPart")
          if root then
              -- Apply current as velocity impulse
              local bv = root:FindFirstChild("RiverCurrent")
              if not bv then
                  bv = Instance.new("BodyVelocity")
                  bv.Name = "RiverCurrent"
                  bv.MaxForce = Vector3.new(5000, 0, 5000)
                  bv.Velocity = flowDirection * flowStrength
                  bv.Parent = root

                  -- Remove when leaving zone
                  currentZone.TouchEnded:Connect(function(hit2)
                      if hit2.Parent == hit.Parent then
                          local bvRemove = root:FindFirstChild("RiverCurrent")
                          if bvRemove then bvRemove:Destroy() end
                      end
                  end)
              end
          end
      end
  end)

- NOTE: BodyVelocity is deprecated. Use VectorForce + LinearVelocity constraints:
  local linearVel = Instance.new("LinearVelocity")
  linearVel.VectorVelocity = flowDirection * flowStrength
  linearVel.MaxForce = 5000
  linearVel.RelativeTo = Enum.ActuatorRelativeTo.World
  linearVel.Attachment0 = root:FindFirstChild("RootAttachment")
  linearVel.Parent = root

POOL / POND CONSTRUCTION:
- Terrain-based pool:
  -- Dig a hole with Air, then fill lower portion with Water
  terrain:FillBlock(CFrame.new(0, -3, 0), Vector3.new(20, 6, 20), Enum.Material.Air)
  terrain:FillBlock(CFrame.new(0, -4, 0), Vector3.new(18, 4, 18), Enum.Material.Water)
  -- Surround with concrete for pool edges
  -- Use Parts for the pool walls/floor for precise geometry

- Part-based pool:
  -- Floor
  local floor = Instance.new("Part")
  floor.Size = Vector3.new(20, 1, 20)
  floor.Position = Vector3.new(0, -5, 0)
  floor.Material = Enum.Material.Concrete
  floor.Color = Color3.fromRGB(180, 210, 230)
  floor.Anchored = true
  floor.Parent = workspace

  -- Walls (4 sides)
  for i, data in {
      {Vector3.new(20, 5, 1), Vector3.new(0, -2.5, -10)},
      {Vector3.new(20, 5, 1), Vector3.new(0, -2.5, 10)},
      {Vector3.new(1, 5, 20), Vector3.new(-10, -2.5, 0)},
      {Vector3.new(1, 5, 20), Vector3.new(10, -2.5, 0)},
  } do
      local wall = Instance.new("Part")
      wall.Size = data[1]
      wall.Position = data[2]
      wall.Material = Enum.Material.Concrete
      wall.Color = Color3.fromRGB(180, 210, 230)
      wall.Anchored = true
      wall.Parent = workspace
  end

  -- Water volume (custom, non-terrain)
  local poolWater = Instance.new("Part")
  poolWater.Size = Vector3.new(18, 4, 18)
  poolWater.Position = Vector3.new(0, -3, 0)
  poolWater.Material = Enum.Material.Glass
  poolWater.Color = Color3.fromRGB(60, 130, 200)
  poolWater.Transparency = 0.5
  poolWater.CanCollide = false
  poolWater.Anchored = true
  poolWater.Parent = workspace

  -- Underwater point light
  local poolLight = Instance.new("PointLight")
  poolLight.Color = Color3.fromRGB(80, 180, 255)
  poolLight.Brightness = 1
  poolLight.Range = 25
  poolLight.Parent = poolWater

FISHING MECHANICS:
- Fishing is a popular game mechanic. Core loop: Cast -> Wait -> Bite -> Reel.

- Cast system (launch bobber from rod):
  local function castLine(player, direction, power)
      local character = player.Character
      local rodTip = character:FindFirstChild("FishingRod"):FindFirstChild("Tip")

      -- Create bobber
      local bobber = Instance.new("Part")
      bobber.Name = "Bobber"
      bobber.Size = Vector3.new(0.5, 0.5, 0.5)
      bobber.Shape = Enum.PartType.Ball
      bobber.Color = Color3.fromRGB(255, 50, 50)
      bobber.Material = Enum.Material.SmoothPlastic
      bobber.Position = rodTip.Position
      bobber.Parent = workspace

      -- Launch bobber
      bobber.Velocity = direction * power + Vector3.new(0, power * 0.5, 0)

      -- Fishing line (Beam or RopeConstraint)
      local line = Instance.new("RopeConstraint")
      line.Length = 50
      line.Visible = true
      line.Thickness = 0.05
      line.Color = BrickColor.new("White")

      local att0 = Instance.new("Attachment", rodTip)
      local att1 = Instance.new("Attachment", bobber)
      line.Attachment0 = att0
      line.Attachment1 = att1
      line.Parent = rodTip

      return bobber, line
  end

- Bobber floating (buoyancy on bobber):
  RunService.Heartbeat:Connect(function()
      if bobber and bobber.Parent then
          local waterY = getWaterSurfaceY(bobber.Position)
          if bobber.Position.Y < waterY then
              -- Apply upward force to float
              bobber.AssemblyLinearVelocity = Vector3.new(
                  bobber.AssemblyLinearVelocity.X * 0.95,
                  math.max(bobber.AssemblyLinearVelocity.Y, (waterY - bobber.Position.Y) * 5),
                  bobber.AssemblyLinearVelocity.Z * 0.95
              )
          end
      end
  end)

- Fish bite detection (random timer):
  local function waitForBite(bobber)
      local waitTime = math.random(3, 15)  -- seconds before bite
      task.wait(waitTime)

      -- Check if bobber still in water
      if not bobber or not bobber.Parent then return false end
      local waterY = getWaterSurfaceY(bobber.Position)
      if bobber.Position.Y > waterY + 1 then return false end

      -- Fish bites! Bob the bobber down
      bobber.AssemblyLinearVelocity = Vector3.new(0, -8, 0)

      -- Play splash sound
      local biteSound = Instance.new("Sound", bobber)
      biteSound.SoundId = "rbxassetid://142070127"
      biteSound.Volume = 0.5
      biteSound:Play()

      return true  -- bite happened, player must reel
  end

- Reel-in minigame (timing-based):
  local reelProgress = 0
  local fishStrength = math.random(30, 100)
  local reelSpeed = 2

  local function onReelInput()
      reelProgress += reelSpeed
      if reelProgress >= fishStrength then
          catchFish()
      end
  end

  -- Fish fights back (reduces progress over time)
  RunService.Heartbeat:Connect(function(dt)
      if isReeling then
          reelProgress = math.max(0, reelProgress - fishStrength * 0.01 * dt)
          updateReelUI(reelProgress / fishStrength)
      end
  end)

SUBMARINE / DIVING MECHANICS:
- Depth pressure: Increase camera effects and reduce visibility with depth.
  local function updateDepthEffects(depth)
      -- depth = distance below water surface (positive = deeper)
      local depthFactor = math.clamp(depth / 100, 0, 1)  -- normalize to 0-1 over 100 studs

      -- Darken with depth
      colorCorrection.Brightness = -0.05 - depthFactor * 0.4
      colorCorrection.Contrast = -depthFactor * 0.3

      -- Increase blur with depth
      blur.Size = 6 + depthFactor * 18

      -- Reduce fog distance with depth
      Lighting.FogEnd = math.max(30, 200 * (1 - depthFactor))

      -- Pressure damage at extreme depths
      if depth > 80 then
          local pressureDamage = (depth - 80) * 0.1
          humanoid:TakeDamage(pressureDamage * dt)
      end
  end

- Sonar ping effect:
  local function sonarPing(origin)
      local ring = Instance.new("Part")
      ring.Shape = Enum.PartType.Ball
      ring.Size = Vector3.new(1, 1, 1)
      ring.Position = origin
      ring.Material = Enum.Material.Neon
      ring.Color = Color3.fromRGB(0, 255, 100)
      ring.Transparency = 0.5
      ring.CanCollide = false
      ring.Anchored = true
      ring.Parent = workspace

      TweenService:Create(ring, TweenInfo.new(2), {
          Size = Vector3.new(80, 80, 80),
          Transparency = 1,
      }):Play()

      -- Detect objects within expanding radius
      task.delay(0.5, function()
          local hits = workspace:GetPartBoundsInRadius(origin, 40)
          for _, part in hits do
              if part:HasTag("SonarDetectable") then
                  highlightObject(part)
              end
          end
      end)

      task.delay(2.5, function() ring:Destroy() end)
  end

WATER INTERACTION SOUNDS:
- Common water sound IDs:
  Water splash (small): rbxassetid://142070127
  Water splash (large): rbxassetid://6564308795
  Underwater ambience: rbxassetid://6564308795
  Bubble sounds: rbxassetid://154548002
  Waterfall: rbxassetid://6564308795
  Rain on water: rbxassetid://4591549759
  Swimming strokes: rbxassetid://179557842

- Playing water sounds with proper 3D settings:
  local sound = Instance.new("Sound")
  sound.SoundId = "rbxassetid://142070127"
  sound.Volume = 0.7
  sound.RollOffMode = Enum.RollOffMode.Linear
  sound.RollOffMinDistance = 5
  sound.RollOffMaxDistance = 60
  sound.Parent = waterPart  -- 3D positioned at water
  sound:Play()

- Underwater sound filtering: When submerged, muffle above-water sounds.
  Use EqualizerSoundEffect to cut high frequencies:
  local eq = Instance.new("EqualizerSoundEffect")
  eq.HighGain = -20   -- muffle highs
  eq.MidGain = -5     -- slightly reduce mids
  eq.LowGain = 3      -- boost bass (underwater resonance)
  eq.Parent = SoundService  -- apply globally, or per SoundGroup
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface WaterSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const WATER_SECTIONS: WaterSection[] = [
  {
    name: 'terrain_water',
    keywords: [
      'terrain water', 'fill block', 'water material', 'water level',
      'wave size', 'wave speed', 'water transparency', 'smooth terrain water',
      'voxel water', 'water color',
    ],
    startMarker: 'TERRAIN WATER BASICS:',
    endMarker: 'CUSTOM WATER (PART-BASED):',
  },
  {
    name: 'custom_water',
    keywords: [
      'custom water', 'part water', 'glass water', 'water part', 'swim zone',
      'water zone', 'water detection', 'enter water', 'exit water',
      'non-terrain water', 'pool water',
    ],
    startMarker: 'CUSTOM WATER (PART-BASED):',
    endMarker: 'SWIMMING STATE DETECTION:',
  },
  {
    name: 'swimming_state',
    keywords: [
      'swimming', 'swim state', 'humanoid swimming', 'get state', 'state changed',
      'disable swimming', 'swim detection', 'in water',
    ],
    startMarker: 'SWIMMING STATE DETECTION:',
    endMarker: 'CUSTOM SWIM SYSTEM:',
  },
  {
    name: 'custom_swim',
    keywords: [
      'custom swim', 'swim system', 'swim force', 'vector force swim',
      'underwater movement', '3d movement', 'swim speed', 'swim controls',
      'swim mechanic', 'diving',
    ],
    startMarker: 'CUSTOM SWIM SYSTEM:',
    endMarker: 'BUOYANCY PHYSICS:',
  },
  {
    name: 'buoyancy',
    keywords: [
      'buoyancy', 'float', 'floating', 'sink', 'density', 'body force',
      'submersion', 'water physics', 'anti gravity', 'multi-point buoyancy',
    ],
    startMarker: 'BUOYANCY PHYSICS:',
    endMarker: 'UNDERWATER EFFECTS:',
  },
  {
    name: 'underwater_effects',
    keywords: [
      'underwater', 'underwater effect', 'color correction', 'blur effect',
      'water fog', 'bubble', 'underwater visual', 'submerged', 'depth effect',
    ],
    startMarker: 'UNDERWATER EFFECTS:',
    endMarker: 'OXYGEN / BREATH SYSTEM:',
  },
  {
    name: 'oxygen_system',
    keywords: [
      'oxygen', 'breath', 'breathing', 'air', 'drowning', 'drown', 'breath bar',
      'oxygen bar', 'air bubble', 'breath system', 'lung',
    ],
    startMarker: 'OXYGEN / BREATH SYSTEM:',
    endMarker: 'WATER SURFACE EFFECTS:',
  },
  {
    name: 'surface_effects',
    keywords: [
      'splash', 'ripple', 'water surface', 'foam', 'spray', 'water entry',
      'surface effect', 'water particle', 'water impact',
    ],
    startMarker: 'WATER SURFACE EFFECTS:',
    endMarker: 'BOAT / SHIP PHYSICS:',
  },
  {
    name: 'boat_physics',
    keywords: [
      'boat', 'ship', 'sail', 'sailing', 'vessel', 'rudder', 'steering',
      'vehicle seat', 'boat physics', 'wave rocking', 'nautical',
    ],
    startMarker: 'BOAT / SHIP PHYSICS:',
    endMarker: 'WAVE SIMULATION:',
  },
  {
    name: 'wave_simulation',
    keywords: [
      'wave', 'gerstner', 'ocean', 'wave height', 'sine wave', 'wave simulation',
      'ocean wave', 'wave mesh', 'animated water', 'wave physics',
    ],
    startMarker: 'WAVE SIMULATION:',
    endMarker: 'WATERFALL CONSTRUCTION:',
  },
  {
    name: 'waterfall',
    keywords: [
      'waterfall', 'water fall', 'cascade', 'falling water', 'mist',
      'waterfall particle', 'waterfall sound',
    ],
    startMarker: 'WATERFALL CONSTRUCTION:',
    endMarker: 'RIVER CURRENT:',
  },
  {
    name: 'river_current',
    keywords: [
      'river', 'current', 'flow', 'stream', 'water flow', 'body velocity',
      'linear velocity', 'river current', 'flowing water',
    ],
    startMarker: 'RIVER CURRENT:',
    endMarker: 'POOL / POND CONSTRUCTION:',
  },
  {
    name: 'pool_pond',
    keywords: [
      'pool', 'pond', 'swimming pool', 'hot tub', 'jacuzzi', 'pool light',
      'pool construction', 'water container', 'lake',
    ],
    startMarker: 'POOL / POND CONSTRUCTION:',
    endMarker: 'FISHING MECHANICS:',
  },
  {
    name: 'fishing',
    keywords: [
      'fishing', 'fish', 'rod', 'bobber', 'cast', 'reel', 'fishing rod',
      'fishing line', 'bite', 'catch fish', 'fishing game', 'fisch',
    ],
    startMarker: 'FISHING MECHANICS:',
    endMarker: 'SUBMARINE / DIVING MECHANICS:',
  },
  {
    name: 'submarine_diving',
    keywords: [
      'submarine', 'diving', 'depth', 'pressure', 'sonar', 'deep sea',
      'deep water', 'depth pressure', 'scuba', 'underwater exploration',
    ],
    startMarker: 'SUBMARINE / DIVING MECHANICS:',
    endMarker: 'WATER INTERACTION SOUNDS:',
  },
  {
    name: 'water_sounds',
    keywords: [
      'water sound', 'splash sound', 'underwater sound', 'bubble sound',
      'waterfall sound', 'swimming sound', 'water audio', 'muffle',
    ],
    startMarker: 'WATER INTERACTION SOUNDS:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the water mechanics knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantWaterKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = WATER_SECTIONS.map((section) => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1
      }
    }
    return { section, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected = scored.filter((s) => s.score > 0).slice(0, 3)

  if (selected.length === 0) {
    return '' // no match — don't inject water knowledge
  }

  return extractWaterSections(selected.map((s) => s.section))
}

function extractWaterSections(sections: WaterSection[]): string {
  const fullText = WATER_MECHANICS_KNOWLEDGE
  const parts: string[] = [
    '=== WATER MECHANICS KNOWLEDGE (matched to your request) ===\n',
  ]

  for (const section of sections) {
    const startIdx = fullText.indexOf(section.startMarker)
    if (startIdx === -1) continue

    let endIdx: number
    if (section.endMarker === '(END)') {
      endIdx = fullText.length
    } else {
      endIdx = fullText.indexOf(section.endMarker, startIdx)
      if (endIdx === -1) endIdx = fullText.length
    }

    parts.push(fullText.slice(startIdx, endIdx).trim())
    parts.push('')
  }

  return parts.join('\n')
}
