// Auto-generated knowledge file — DO NOT EDIT MANUALLY
// Crawled: Roblox Docs — Characters, Appearance, Animation, Animation Editor
// Date: 2026-04-29

export const CHARACTERS_ANIMATION = `
=== ROBLOX CHARACTERS & ANIMATION KNOWLEDGE BASE ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CHARACTER ANATOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A complete avatar character Model contains:
  - HumanoidRootPart          (root/anchor part)
  - Head                      (displays name + health bar)
  - 15 standard R15 body MeshParts
  - Humanoid instance         (health, walkspeed, jump, states)
  - WrapLayer objects         (layered clothing/accessories)
  - FaceControls              (facial expressions + head pose)
  - Attachment objects        (standard body attachment points)
  - Bone + AnimationConstraint joints (standard rig hierarchy)

R6 vs R15:
  - R6:  6 parts, simpler, limited animation capability
  - R15: 15 parts, full body animation, layered clothing support
  - R15 is default for all new avatars
  - Use Humanoid.RigType to check: Enum.HumanoidRigType.R6 / R15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. HUMANOIDDESCRIPTION — CHARACTER CUSTOMIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HumanoidDescription stores all appearance data for a character.

SCALE PROPERTIES (numbers 0.0–2.0):
  - HeightScale       — overall height multiplier
  - WidthScale        — overall width multiplier
  - HeadScale         — head size multiplier
  - BodyTypeScale     — blend between normal and blocky body
  - ProportionScale   — arm/leg proportion offset

BODY PART ASSET IDs (numbers):
  - Face, Head, Torso
  - RightArm, LeftArm, RightLeg, LeftLeg

CLASSIC CLOTHING (asset IDs as numbers):
  - Shirt            — ShirtTemplate texture
  - Pants            — PantsTemplate texture
  - ShirtGraphic     — T-shirt graphic

ACCESSORIES (comma-separated asset ID strings):
  - HatAccessory         — classic hats
  - HairAccessory        — hair items
  - FaceAccessory        — face items
  - NeckAccessory
  - ShoulderAccessory
  - FrontAccessory, BackAccessory
  - WaistAccessory

BODY COLORS (Color3 values):
  - HeadColor, TorsoColor
  - RightArmColor, LeftArmColor
  - RightLegColor, LeftLegColor

ANIMATION OVERRIDES (asset IDs as numbers):
  - RunAnimation, WalkAnimation, JumpAnimation
  - FallAnimation, SwimAnimation, ClimbAnimation
  - IdleAnimation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. HUMANOIDDESCRIPTION API PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Load description from a user's avatar:
local Players = game:GetService("Players")
local desc = Players:GetHumanoidDescriptionFromUserId(userId)

-- Load description from an outfit:
local desc = Players:GetHumanoidDescriptionFromOutfitId(outfitId)

-- Get description already applied to a character:
local desc = humanoid:GetAppliedDescription()

-- Create custom description from scratch:
local desc = Instance.new("HumanoidDescription")
desc.HeadColor = Color3.new(1, 0.8, 0.6)
desc.Face = 86487700
desc.HatAccessory = "2551510151,2535600138"
desc.HeightScale = 1.0
desc.WidthScale = 1.0

-- Apply to existing character:
humanoid:ApplyDescription(desc)

-- Spawn player with custom description (call from server):
player:LoadCharacterWithHumanoidDescription(desc)

-- Bulk accessory management:
-- SetAccessories(table, includeRigidAccessories)
-- table format: { {AssetId=123, AccessoryType=Enum.AccessoryType.Hat, IsLayered=false}, ... }
desc:SetAccessories({
  { AssetId = 2551510151, AccessoryType = Enum.AccessoryType.Hat, IsLayered = false }
}, false)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. CHARACTER SPAWNING & LOADING PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Wait for character to load:
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local rootPart = character:WaitForChild("HumanoidRootPart")

-- Spawn NPC at position:
local npc = ServerStorage.NPCModel:Clone()
npc.Parent = workspace
npc:SetPrimaryPartCFrame(CFrame.new(Vector3.new(0, 5, 0)))

-- Handle character respawn:
player.CharacterAdded:Connect(function(char)
  local hum = char:WaitForChild("Humanoid")
  -- apply customizations here
end)

-- Disable auto-respawn (put in ServerScriptService):
Players.CharacterAutoLoads = false
-- Then manually: player:LoadCharacter()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. HUMANOID STATES & PROPERTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Common Humanoid properties:
humanoid.WalkSpeed = 16          -- default walk speed
humanoid.JumpHeight = 7.2        -- jump height (studs)
humanoid.MaxHealth = 100
humanoid.Health = 100
humanoid.AutoRotate = true       -- face movement direction

-- HumanoidStateTypes (for NPCs, disable unused states for perf):
humanoid:SetStateEnabled(Enum.HumanoidStateType.Climbing, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.GettingUp, false)

-- State change event:
humanoid.StateChanged:Connect(function(oldState, newState)
  if newState == Enum.HumanoidStateType.Freefall then
    -- player is falling
  end
end)

-- Death handling:
humanoid.Died:Connect(function()
  -- handle death logic
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. ANIMATION LOADING & PLAYING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETUP — Get Animator from Humanoid:
local animator = humanoid:WaitForChild("Animator")

OR from AnimationController (for non-humanoid rigs):
local animController = model:WaitForChild("AnimationController")
local animator = animController:WaitForChild("Animator")

LOAD AN ANIMATION:
local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://YOUR_ANIMATION_ID"
local track = animator:LoadAnimation(animation)

PLAY CONTROLS:
track:Play()                         -- start with defaults
track:Play(0.1)                      -- fadeTime = 0.1s
track:Play(0.1, 1, 1)               -- fadeTime, weight, speed
track:Stop()                         -- stop with default fade
track:Stop(0.5)                      -- stop with 0.5s fade
track:AdjustSpeed(2)                 -- double speed
track:AdjustWeight(0.5)              -- blend weight 0-1

LOOPING:
track.Looped = true                  -- set before Play()
-- or set in Animation Editor on the asset itself

PRIORITY LEVELS (higher overrides lower):
Enum.AnimationPriority.Core          -- default locomotion
Enum.AnimationPriority.Idle
Enum.AnimationPriority.Movement
Enum.AnimationPriority.Action        -- combat, interactions
Enum.AnimationPriority.Action2
Enum.AnimationPriority.Action3
Enum.AnimationPriority.Action4

Set priority: animation.Priority = Enum.AnimationPriority.Action
OR track.Priority = Enum.AnimationPriority.Action

TRACK STATE:
track.IsPlaying    -- boolean
track.Length       -- duration in seconds
track.Speed        -- current playback speed
track.WeightCurrent
track.WeightTarget

EVENTS:
track.Stopped:Connect(function() end)
track.Ended:Connect(function() end)
track.DidLoop:Connect(function() end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. ANIMATION MARKERS / EVENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Animation Markers are keyframe labels set in the Animation Editor.
They trigger signals during playback — useful for footstep sounds,
hitbox activation, VFX sync, etc.

local markerSignal = track:GetMarkerReachedSignal("FootLeft")
markerSignal:Connect(function(paramString)
  -- play footstep sound, spawn dust particle, etc.
  local sound = workspace.FootstepSound:Clone()
  sound.Parent = workspace
  sound:Play()
  game:GetService("Debris"):AddItem(sound, 2)
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. COMPLETE ANIMATION SYSTEM EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Server-side NPC animation setup (recommended for NPCs):
local function setupNPCAnimations(npcModel)
  local humanoid = npcModel:WaitForChild("Humanoid")
  local animator = humanoid:WaitForChild("Animator")

  local animations = {
    idle   = "rbxassetid://507766388",
    walk   = "rbxassetid://507767714",
    attack = "rbxassetid://507768375",
  }

  local tracks = {}
  for name, id in pairs(animations) do
    local anim = Instance.new("Animation")
    anim.AnimationId = id
    tracks[name] = animator:LoadAnimation(anim)
  end

  tracks.idle.Looped = true
  tracks.walk.Looped = true
  tracks.idle:Play()

  return tracks
end

-- Client-side player animation override example (LocalScript):
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")

local sprintAnim = Instance.new("Animation")
sprintAnim.AnimationId = "rbxassetid://YOUR_SPRINT_ANIM_ID"
local sprintTrack = animator:LoadAnimation(sprintAnim)
sprintTrack.Priority = Enum.AnimationPriority.Action

local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.LeftShift then
    humanoid.WalkSpeed = 28
    sprintTrack:Play()
  end
end)
UserInputService.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    humanoid.WalkSpeed = 16
    sprintTrack:Stop()
  end
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. INVERSE KINEMATICS (IK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IK procedurally generates animation based on environment.
Use cases: head tracking, arm reaching, foot planting.

-- IKControl for head look-at:
local ikControl = Instance.new("IKControl")
ikControl.Type = Enum.IKControlType.LookAt
ikControl.EndEffector = character:FindFirstChild("Head")
ikControl.Target = targetPart
ikControl.ChainRoot = character:FindFirstChild("UpperTorso")
ikControl.Parent = humanoid

-- Priority-blended with existing animations via Weight property
ikControl.Weight = 1.0  -- 0 = disabled, 1 = full effect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. FACE CONTROLS & EXPRESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FaceControls instance (child of Head on R15 avatars with face):
-- Blend shape values 0.0 to 1.0
local faceControls = character.Head:FindFirstChild("FaceControls")
if faceControls then
  faceControls.Smile = 0.8
  faceControls.LeftEyeClosed = 0.0
  faceControls.RightEyeClosed = 0.0
  faceControls.Surprise = 0.3
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. NPC PERFORMANCE TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Play NPC animations CLIENT-SIDE to reduce server replication load
- Use AnimationController (not Humanoid) for static/simple NPCs
- Disable unused HumanoidStateTypes: Climbing, Swimming, GettingUp
- Use object pooling — never destroy/recreate NPCs per wave
- Only spawn NPCs when players are within range
- For procedural animation, update Motor6D.Transform (not C0/C1)
- Attach visual parts OUTSIDE the avatar model hierarchy
- Avoid modifying avatar hierarchy after instantiation (triggers recalc)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. ANIMATION EDITOR WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open Animation Editor (Plugins tab → Animation Editor)
2. Select a rig model in workspace
3. Create poses by rotating/moving bones at keyframes
4. Set easing: Linear, Constant, CubicV2, Elastic, Bounce
   with directions: In, Out, InOut
5. Add markers for sound/VFX sync points
6. Name final keyframe "End" (case-sensitive) for default animations
7. Publish: Media Controls → "Publish to Roblox"
8. Use returned asset ID in scripts

Local animation data saves as KeyframeSequence in ServerStorage.
Move to ReplicatedStorage for client-side access.

EASING STYLE GUIDE:
  - CubicV2 InOut: smooth start/end (best for most animations)
  - Linear: mechanical/robotic
  - Bounce Out: playful impacts
  - Elastic Out: springy effects
  - Constant: snappy frame-by-frame
`;
