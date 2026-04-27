/**
 * Animation & Motion Systems Knowledge Base
 *
 * Deep animation patterns extracted from Roblox DevForum threads, official docs,
 * and community resources. Covers TweenService, skeletal animation, procedural motion,
 * camera animation, UI animation, and particle effects.
 *
 * Sources:
 * - devforum.roblox.com/t/easing-style-reference-tweenservice/3406254
 * - devforum.roblox.com/t/custom-easing-module-for-manual-tweening/4378678
 * - devforum.roblox.com/t/animations-or-tweenservice/3526189
 * - devforum.roblox.com/t/easyeffects-make-your-ui-animation-better/3136121
 * - devforum.roblox.com/t/how-to-make-a-up-and-down-motion-using-tweenservice/1942319
 * - create.roblox.com/docs/reference/engine/classes/TweenService
 * - create.roblox.com/docs/reference/engine/datatypes/TweenInfo
 * - create.roblox.com/docs/reference/engine/classes/AnimationController
 * - create.roblox.com/docs/reference/engine/classes/Animator
 * - create.roblox.com/docs/reference/engine/enums/EasingStyle
 * - create.roblox.com/docs/reference/engine/enums/AnimationPriority
 * - create.roblox.com/docs/reference/engine/classes/RunService
 * - And 25+ additional threads
 */

import 'server-only'

export const ANIMATION_KNOWLEDGE = `
=== ANIMATION & MOTION SYSTEMS (from top Roblox developers & official docs) ===

TWEENSERVICE FUNDAMENTALS:
- TweenService smoothly interpolates properties of any Instance over time.
- Only numeric types can be tweened: number, bool (0/1), CFrame, Vector3, Vector2,
  UDim2, UDim, Color3, Rect, NumberRange, NumberSequenceKeypoint, ColorSequenceKeypoint.
- TweenInfo constructor:
  TweenInfo.new(
    time,            -- number: duration in seconds (default 1)
    easingStyle,     -- Enum.EasingStyle (default Quad)
    easingDirection, -- Enum.EasingDirection (default Out)
    repeatCount,     -- number: 0 = play once, -1 = infinite (default 0)
    reverses,        -- bool: if true, tween plays forward then backward (default false)
    delayTime        -- number: seconds to wait before starting (default 0)
  )

- Basic tween pattern:
  local TweenService = game:GetService("TweenService")

  local part = workspace.MyPart
  local tweenInfo = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  local goal = {Position = Vector3.new(0, 10, 0)}

  local tween = TweenService:Create(part, tweenInfo, goal)
  tween:Play()

  -- Events:
  tween.Completed:Connect(function(playbackState)
    -- Enum.PlaybackState: Completed, Cancelled
    print("Tween finished:", playbackState)
  end)

- Cancelling and pausing:
  tween:Cancel()  -- resets to original value
  tween:Pause()   -- keeps current position, can resume with :Play()

- Tweening multiple properties at once:
  local goal = {
    Position = Vector3.new(10, 20, 30),
    Size = Vector3.new(4, 4, 4),
    Color = Color3.fromRGB(255, 0, 0),
    Transparency = 0.5,
  }
  local tween = TweenService:Create(part, tweenInfo, goal)
  tween:Play()

- Tweening CFrame for rotation:
  local goal = {CFrame = CFrame.new(0, 10, 0) * CFrame.Angles(0, math.rad(90), 0)}
  TweenService:Create(part, TweenInfo.new(2), goal):Play()

- Tweening model (use PrimaryPart CFrame with PivotTo in a loop, or use a CFrameValue):
  local model = workspace.MyModel
  local cfValue = Instance.new("CFrameValue")
  cfValue.Value = model:GetPivot()

  cfValue:GetPropertyChangedSignal("Value"):Connect(function()
    model:PivotTo(cfValue.Value)
  end)

  local tween = TweenService:Create(cfValue,
    TweenInfo.new(2, Enum.EasingStyle.Sine),
    {Value = CFrame.new(0, 20, 0)}
  )
  tween:Play()

EASING STYLES (ALL 11):
- Each EasingStyle defines the acceleration curve. Combined with EasingDirection (In, Out, InOut).
  In = slow start fast end. Out = fast start slow end. InOut = slow start, fast middle, slow end.

- Linear: constant speed. No acceleration. Use for: progress bars, timers, simple movements.
  f(t) = t

- Sine: gentle acceleration curve. Smooth and natural. Use for: floating objects, subtle UI.
  f(t) = 1 - cos(t * pi/2)  [Out]

- Quad: moderate acceleration (t^2). Use for: general-purpose animations, doors, platforms.
  f(t) = t^2  [In]. This is the DEFAULT easing style.

- Cubic: stronger acceleration (t^3). Use for: slightly snappier movements.
  f(t) = t^3  [In]

- Quart: even stronger (t^4). Use for: dramatic entrances.
  f(t) = t^4  [In]

- Quint: very strong (t^5). Use for: heavy/powerful motion.
  f(t) = t^5  [In]

- Exponential: extremely strong curve. Use for: explosive movements, dramatic reveals.
  f(t) = 2^(10*(t-1))  [In]

- Circular: follows quarter-circle arc. Use for: natural arcing motion.
  f(t) = 1 - sqrt(1 - t^2)  [In]

- Back: overshoots target then settles. Use for: bouncy UI, playful elements, menus popping in.
  f(t) = t^2 * (2.70158*t - 1.70158)  [In]

- Bounce: bounces at the end like a ball. Use for: collectibles landing, notifications, playful UI.
  Multiple bounces near the target value.

- Elastic: spring-like overshoot oscillation. Use for: wobbly UI, jelly effects, playful popups.
  Oscillates around target. Can go significantly past target value briefly.

- Common combos:
  -- Smooth slide in: Enum.EasingStyle.Quad, Enum.EasingDirection.Out
  -- Bounce land: Enum.EasingStyle.Bounce, Enum.EasingDirection.Out
  -- Elastic popup: Enum.EasingStyle.Elastic, Enum.EasingDirection.Out
  -- Snap open: Enum.EasingStyle.Back, Enum.EasingDirection.Out
  -- Smooth both ways: Enum.EasingStyle.Sine, Enum.EasingDirection.InOut
  -- Linear fade: Enum.EasingStyle.Linear, Enum.EasingDirection.InOut

- TweenService:GetValue(alpha, easingStyle, easingDirection) — returns the eased value for manual interpolation:
  local eased = TweenService:GetValue(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  -- Returns ~0.75 (halfway through a Quad Out curve)

ANIMATIONCONTROLLER AND ANIMATOR:
- Humanoid contains an Animator which loads and plays Animation objects.
- Animation object: has AnimationId property ("rbxassetid://123456789").
- AnimationTrack: returned by Animator:LoadAnimation(animation). Controls playback.

- Loading and playing an animation:
  local humanoid = character:WaitForChild("Humanoid")
  local animator = humanoid:FindFirstChildOfClass("Animator")
  if not animator then
    animator = Instance.new("Animator")
    animator.Parent = humanoid
  end

  local animation = Instance.new("Animation")
  animation.AnimationId = "rbxassetid://507767714" -- wave animation
  local track = animator:LoadAnimation(animation)
  track:Play()

- AnimationTrack properties:
  track.Speed         -- playback speed (1 = normal, 0.5 = half, -1 = reverse)
  track.Priority      -- Enum.AnimationPriority
  track.Looped        -- bool
  track.Length         -- total duration in seconds (read-only)
  track.TimePosition  -- current position in seconds
  track.WeightCurrent -- current blend weight (read-only)
  track.WeightTarget  -- target blend weight
  track.IsPlaying     -- bool (read-only)

- AnimationTrack methods:
  track:Play(fadeTime, weight, speed)    -- fadeTime: blend in duration (default 0.1)
  track:Stop(fadeTime)                   -- fadeTime: blend out duration (default 0.1)
  track:AdjustSpeed(speed)               -- change speed during playback
  track:AdjustWeight(weight, fadeTime)   -- change blend weight
  track:GetMarkerReachedSignal(name)     -- fires when animation marker is reached

- Animation markers (keyframe events):
  -- Set markers in Animation Editor. Fire events during playback:
  track:GetMarkerReachedSignal("FootstepLeft"):Connect(function()
    playFootstepSound("left")
  end)
  track:GetMarkerReachedSignal("DealDamage"):Connect(function()
    dealDamageToNearbyEnemies()
  end)

ANIMATION PRIORITY LEVELS:
- Priority determines which animation wins when multiple play on the same joints.
- From lowest to highest:
  1. Core (0)      — engine defaults, almost never used in scripts
  2. Idle (1)      — standing, sitting animations
  3. Movement (2)  — walking, running, jumping
  4. Action (3)    — attacking, using tools, emotes
  5. Action2 (4)   — higher-priority actions
  6. Action3 (5)   — even higher
  7. Action4 (6)   — highest priority actions

- Higher priority animations override lower ones on overlapping joints.
- Set priority on the AnimationTrack:
  track.Priority = Enum.AnimationPriority.Action

- Best practice: Use Idle for idle anims, Movement for locomotion,
  Action for combat/tools. Only use Action2+ for override situations.

DEFAULT ROBLOX ANIMATION IDS:
- Commonly used built-in animation IDs:
  -- Walk:     rbxassetid://507777826
  -- Run:      rbxassetid://507767714
  -- Idle:     rbxassetid://507766666
  -- Jump:     rbxassetid://507765000
  -- Fall:     rbxassetid://507767968
  -- Climb:    rbxassetid://507765644
  -- Sit:      rbxassetid://2506281703
  -- Wave:     rbxassetid://507770239
  -- Point:    rbxassetid://507770453
  -- Dance1:   rbxassetid://507771019
  -- Dance2:   rbxassetid://507776043
  -- Dance3:   rbxassetid://507777268
  -- Laugh:    rbxassetid://507770818
  -- Cheer:    rbxassetid://507770677

- Replacing default animations:
  local humanoid = character:WaitForChild("Humanoid")
  local animateScript = character:WaitForChild("Animate")

  -- Replace walk animation
  animateScript.walk.WalkAnim.AnimationId = "rbxassetid://YOUR_WALK_ID"
  -- Replace idle
  animateScript.idle.Animation1.AnimationId = "rbxassetid://YOUR_IDLE_ID"
  -- Replace run
  animateScript.run.RunAnim.AnimationId = "rbxassetid://YOUR_RUN_ID"
  -- Replace jump
  animateScript.jump.JumpAnim.AnimationId = "rbxassetid://YOUR_JUMP_ID"

SKELETAL ANIMATION (Motor6D / CFRAME MANIPULATION):
- Roblox characters use Motor6D joints to connect body parts.
- Motor6D has Transform property (CFrame) that can be modified for procedural animation.
- Joint hierarchy: HumanoidRootPart -> LowerTorso -> UpperTorso -> Head
                   UpperTorso -> LeftUpperArm -> LeftLowerArm -> LeftHand
                   UpperTorso -> RightUpperArm -> RightLowerArm -> RightHand
                   LowerTorso -> LeftUpperLeg -> LeftLowerLeg -> LeftFoot
                   LowerTorso -> RightUpperLeg -> RightLowerLeg -> RightFoot

- Accessing Motor6D joints:
  local character = player.Character
  local rootJoint = character.LowerTorso:FindFirstChild("Root")
  local waist = character.UpperTorso:FindFirstChild("Waist")
  local neck = character.Head:FindFirstChild("Neck")

  -- Rotate head to look at a target
  local function lookAt(targetPosition)
    local head = character.Head
    local headCF = head.CFrame
    local direction = (targetPosition - headCF.Position).Unit
    local angle = math.asin(direction.Y)
    neck.C0 = CFrame.new(0, 0.8, 0) * CFrame.Angles(math.clamp(angle, -0.5, 0.8), 0, 0)
  end

- IMPORTANT: Motor6D.Transform is applied AFTER C0 and C1. Animations modify Transform.
  To add procedural offsets on top of animations, modify C0 or use Transform additively.

PROCEDURAL ANIMATION PATTERNS:
- Bobbing / floating motion:
  local RunService = game:GetService("RunService")
  local part = workspace.FloatingPart
  local origin = part.Position
  local amplitude = 2    -- studs up/down
  local frequency = 1    -- cycles per second

  RunService.Heartbeat:Connect(function()
    local t = tick() * frequency * math.pi * 2
    part.Position = origin + Vector3.new(0, math.sin(t) * amplitude, 0)
  end)

- Swaying / pendulum:
  local origin = part.CFrame
  RunService.Heartbeat:Connect(function()
    local t = tick()
    local angle = math.sin(t * 2) * math.rad(15) -- 15 degree sway
    part.CFrame = origin * CFrame.Angles(0, 0, angle)
  end)

- Breathing animation (scale-based):
  local origin = part.Size
  RunService.Heartbeat:Connect(function()
    local t = tick()
    local scale = 1 + math.sin(t * 1.5) * 0.03  -- 3% scale variation
    part.Size = origin * scale
  end)

- Idle bobbing for NPC:
  local function idleBob(humanoidRootPart)
    local rootJoint = humanoidRootPart:FindFirstChild("RootJoint")
      or humanoidRootPart.Parent.LowerTorso:FindFirstChild("Root")
    if not rootJoint then return end

    local originalC0 = rootJoint.C0
    RunService.Heartbeat:Connect(function()
      local t = tick()
      local bobY = math.sin(t * 2) * 0.1
      local tiltZ = math.sin(t * 1.2) * math.rad(1)
      rootJoint.C0 = originalC0 * CFrame.new(0, bobY, 0) * CFrame.Angles(0, 0, tiltZ)
    end)
  end

CAMERA ANIMATIONS:
- Camera shake effect:
  local camera = workspace.CurrentCamera
  local RunService = game:GetService("RunService")

  local function shakeCamera(intensity, duration)
    local startTime = tick()
    local connection
    local originalCFrame = camera.CFrame

    connection = RunService.RenderStepped:Connect(function()
      local elapsed = tick() - startTime
      if elapsed > duration then
        connection:Disconnect()
        return
      end

      local decay = 1 - (elapsed / duration)  -- fade out over duration
      local shakeX = (math.random() - 0.5) * 2 * intensity * decay
      local shakeY = (math.random() - 0.5) * 2 * intensity * decay
      local shakeZ = (math.random() - 0.5) * 2 * intensity * decay

      camera.CFrame = camera.CFrame * CFrame.new(shakeX, shakeY, shakeZ)
    end)
  end

  -- Usage: shakeCamera(0.5, 0.3) -- mild shake for 0.3 seconds

- Smooth camera transition (cutscene):
  local TweenService = game:GetService("TweenService")

  local function cutsceneTransition(startCF, endCF, duration, callback)
    local camera = workspace.CurrentCamera
    camera.CameraType = Enum.CameraType.Scriptable
    camera.CFrame = startCF

    local tween = TweenService:Create(camera,
      TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
      {CFrame = endCF}
    )
    tween:Play()
    tween.Completed:Connect(function()
      if callback then callback() end
      camera.CameraType = Enum.CameraType.Custom  -- return control
    end)
  end

- Multi-point camera path:
  local function playCameraPath(waypoints, speed)
    local camera = workspace.CurrentCamera
    camera.CameraType = Enum.CameraType.Scriptable

    local function moveToNext(index)
      if index > #waypoints then
        camera.CameraType = Enum.CameraType.Custom
        return
      end

      local wp = waypoints[index]
      local duration = wp.Duration or 2
      local tween = TweenService:Create(camera,
        TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
        {CFrame = wp.CFrame}
      )
      tween:Play()
      tween.Completed:Connect(function()
        if wp.Hold then
          task.wait(wp.Hold)
        end
        moveToNext(index + 1)
      end)
    end

    camera.CFrame = waypoints[1].CFrame
    moveToNext(2)
  end

  -- Usage:
  -- playCameraPath({
  --   {CFrame = CFrame.new(0, 50, 0) * CFrame.Angles(-math.pi/2, 0, 0), Duration = 0, Hold = 1},
  --   {CFrame = CFrame.new(10, 20, 10, 0, 0, -1, 0, 1, 0, 1, 0, 0), Duration = 3},
  --   {CFrame = CFrame.new(0, 5, -20), Duration = 2, Hold = 0.5},
  -- })

PART ANIMATIONS (DOORS, PLATFORMS, ELEVATORS):
- Sliding door:
  local TweenService = game:GetService("TweenService")

  local function createSlidingDoor(doorPart, openOffset, duration)
    local closedCF = doorPart.CFrame
    local openCF = closedCF * CFrame.new(openOffset)
    local isOpen = false

    local openTween = TweenService:Create(doorPart,
      TweenInfo.new(duration or 1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      {CFrame = openCF}
    )
    local closeTween = TweenService:Create(doorPart,
      TweenInfo.new(duration or 1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      {CFrame = closedCF}
    )

    return {
      Toggle = function()
        if isOpen then
          closeTween:Play()
        else
          openTween:Play()
        end
        isOpen = not isOpen
      end,
      Open = function() openTween:Play(); isOpen = true end,
      Close = function() closeTween:Play(); isOpen = false end,
    }
  end

  -- Usage: createSlidingDoor(workspace.Door, Vector3.new(6, 0, 0), 1)

- Moving platform (elevator/lift):
  local function createElevator(platform, floors, speed)
    -- floors = {Vector3.new(0,0,0), Vector3.new(0,20,0), Vector3.new(0,40,0)}
    local currentFloor = 1

    local function goToFloor(floorIndex)
      if floorIndex < 1 or floorIndex > #floors then return end
      local targetPos = floors[floorIndex]
      local distance = (platform.Position - targetPos).Magnitude
      local duration = distance / (speed or 10)

      local tween = TweenService:Create(platform,
        TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
        {Position = targetPos}
      )
      tween:Play()
      currentFloor = floorIndex
    end

    return { GoToFloor = goToFloor }
  end

- Spinning object:
  local function spinForever(part, speed)
    -- speed in degrees per second
    local RunService = game:GetService("RunService")
    RunService.Heartbeat:Connect(function(dt)
      part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(speed * dt), 0)
    end)
  end

UI ANIMATIONS:
- Fade in a ScreenGui frame:
  local TweenService = game:GetService("TweenService")

  local function fadeIn(guiObject, duration)
    guiObject.Visible = true
    guiObject.BackgroundTransparency = 1

    -- Also fade child TextLabels/ImageLabels
    local tweens = {}
    table.insert(tweens, TweenService:Create(guiObject,
      TweenInfo.new(duration or 0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      {BackgroundTransparency = 0}
    ))
    for _, child in ipairs(guiObject:GetDescendants()) do
      if child:IsA("TextLabel") or child:IsA("TextButton") then
        child.TextTransparency = 1
        table.insert(tweens, TweenService:Create(child,
          TweenInfo.new(duration or 0.3),
          {TextTransparency = 0}
        ))
      elseif child:IsA("ImageLabel") or child:IsA("ImageButton") then
        child.ImageTransparency = 1
        table.insert(tweens, TweenService:Create(child,
          TweenInfo.new(duration or 0.3),
          {ImageTransparency = 0}
        ))
      end
    end
    for _, t in ipairs(tweens) do t:Play() end
  end

- Slide in from side:
  local function slideIn(guiObject, direction, duration)
    -- direction: "left", "right", "top", "bottom"
    local targetPos = guiObject.Position
    local offscreen
    if direction == "left" then
      offscreen = UDim2.new(-1, 0, targetPos.Y.Scale, targetPos.Y.Offset)
    elseif direction == "right" then
      offscreen = UDim2.new(2, 0, targetPos.Y.Scale, targetPos.Y.Offset)
    elseif direction == "top" then
      offscreen = UDim2.new(targetPos.X.Scale, targetPos.X.Offset, -1, 0)
    elseif direction == "bottom" then
      offscreen = UDim2.new(targetPos.X.Scale, targetPos.X.Offset, 2, 0)
    end

    guiObject.Position = offscreen
    guiObject.Visible = true

    TweenService:Create(guiObject,
      TweenInfo.new(duration or 0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
      {Position = targetPos}
    ):Play()
  end

- Scale bounce popup:
  local function popIn(guiObject, duration)
    guiObject.Size = UDim2.new(0, 0, 0, 0)
    guiObject.Visible = true
    local targetSize = guiObject:GetAttribute("OriginalSize") or UDim2.new(0.4, 0, 0.3, 0)

    TweenService:Create(guiObject,
      TweenInfo.new(duration or 0.4, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
      {Size = targetSize}
    ):Play()
  end

- Number counter animation (for score/currency):
  local function animateNumber(textLabel, startValue, endValue, duration)
    local elapsed = 0
    local connection
    connection = game:GetService("RunService").Heartbeat:Connect(function(dt)
      elapsed = elapsed + dt
      local alpha = math.clamp(elapsed / duration, 0, 1)
      local eased = TweenService:GetValue(alpha, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
      local current = math.floor(startValue + (endValue - startValue) * eased)
      textLabel.Text = tostring(current)
      if alpha >= 1 then
        connection:Disconnect()
      end
    end)
  end

PARTICLE EFFECT ANIMATIONS:
- Trail: attaches to moving parts for motion trails.
  local trail = Instance.new("Trail")
  trail.Attachment0 = attachment0  -- front of object
  trail.Attachment1 = attachment1  -- back of object
  trail.Lifetime = 0.5            -- how long trail segments last
  trail.MinLength = 0.1
  trail.MaxLength = 5
  trail.WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),
    NumberSequenceKeypoint.new(1, 0),
  })
  trail.Color = ColorSequence.new(Color3.fromRGB(255, 200, 50))
  trail.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(1, 1),
  })
  trail.Parent = part

- Beam: connects two attachments with a rendered beam.
  local beam = Instance.new("Beam")
  beam.Attachment0 = startAttachment
  beam.Attachment1 = endAttachment
  beam.Width0 = 1
  beam.Width1 = 0.5
  beam.CurveSize0 = 2    -- curve amount at start
  beam.CurveSize1 = -2   -- curve amount at end
  beam.Segments = 10
  beam.TextureSpeed = 1
  beam.Color = ColorSequence.new(Color3.fromRGB(0, 170, 255))
  beam.Transparency = NumberSequence.new(0, 0.8)
  beam.LightEmission = 1  -- additive blending
  beam.Parent = part

- ParticleEmitter: emits particles from a part.
  local emitter = Instance.new("ParticleEmitter")
  emitter.Rate = 50               -- particles per second
  emitter.Lifetime = NumberRange.new(1, 2)
  emitter.Speed = NumberRange.new(5, 10)
  emitter.SpreadAngle = Vector2.new(30, 30)  -- cone angle
  emitter.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.5),
    NumberSequenceKeypoint.new(0.5, 1),
    NumberSequenceKeypoint.new(1, 0),
  })
  emitter.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 0)),
  })
  emitter.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(0.8, 0),
    NumberSequenceKeypoint.new(1, 1),
  })
  emitter.LightEmission = 0.8
  emitter.Acceleration = Vector3.new(0, -5, 0)  -- gravity
  emitter.Rotation = NumberRange.new(0, 360)
  emitter.RotSpeed = NumberRange.new(-100, 100)
  emitter.Parent = part

  -- Burst emission (for explosions, impacts):
  emitter.Rate = 0  -- don't auto-emit
  emitter:Emit(50)  -- emit 50 particles instantly

- Fire effect:
  local fire = Instance.new("Fire")
  fire.Size = 5          -- visual size
  fire.Heat = 10         -- rise speed
  fire.Color = Color3.fromRGB(255, 150, 0)     -- flame color
  fire.SecondaryColor = Color3.fromRGB(255, 50, 0) -- secondary glow
  fire.Parent = part

- Smoke effect:
  local smoke = Instance.new("Smoke")
  smoke.Size = 3
  smoke.Opacity = 0.5
  smoke.RiseVelocity = 5
  smoke.Color = Color3.fromRGB(100, 100, 100)
  smoke.Parent = part

- Sparkles:
  local sparkles = Instance.new("Sparkles")
  sparkles.SparkleColor = Color3.fromRGB(255, 255, 100)
  sparkles.Parent = part

SPRING MODULE PATTERN:
- Springs create natural, physics-based motion. Popular community pattern:
  local Spring = {}
  Spring.__index = Spring

  function Spring.new(mass, force, damping, speed)
    local self = setmetatable({}, Spring)
    self.Target = Vector3.new()
    self.Position = Vector3.new()
    self.Velocity = Vector3.new()
    self.Mass = mass or 5
    self.Force = force or 50
    self.Damping = damping or 4
    self.Speed = speed or 4
    return self
  end

  function Spring:Update(dt)
    local scaledDt = math.min(dt, 1) * self.Speed
    local force = self.Force
    local damping = self.Damping
    local displacement = self.Target - self.Position
    local acceleration = (displacement * force - self.Velocity * damping) / self.Mass
    self.Velocity = self.Velocity + acceleration * scaledDt
    self.Position = self.Position + self.Velocity * scaledDt
    return self.Position
  end

  function Spring:Impulse(impulse)
    self.Velocity = self.Velocity + impulse
  end

  -- Usage for camera bob:
  local bobSpring = Spring.new(5, 50, 4, 4)
  RunService.RenderStepped:Connect(function(dt)
    local isMoving = humanoid.MoveDirection.Magnitude > 0
    if isMoving then
      bobSpring.Target = Vector3.new(
        math.sin(tick() * 8) * 0.1,
        math.abs(math.sin(tick() * 16)) * 0.15,
        0
      )
    else
      bobSpring.Target = Vector3.new()
    end
    local offset = bobSpring:Update(dt)
    camera.CFrame = camera.CFrame * CFrame.new(offset)
  end)

RUNSERVICE ANIMATION LOOPS:
- Three main events for animation loops. Choose carefully:
  - RenderStepped: fires BEFORE each frame render. Client-only (LocalScript).
    Use for: camera manipulation, first-person viewmodel, UI that must match rendering.
    WARNING: Yields in RenderStepped delay rendering. Keep callbacks fast.
  - Heartbeat: fires AFTER physics simulation, before rendering. Works on server and client.
    Use for: most gameplay logic, NPC movement, general animations.
  - Stepped: fires BEFORE physics simulation. Use for: setting physics properties that
    need to take effect in the current physics step.

  local RunService = game:GetService("RunService")

  -- Client animation (camera, viewmodel)
  RunService.RenderStepped:Connect(function(dt)
    -- dt is time since last frame in seconds
  end)

  -- Server/client gameplay
  RunService.Heartbeat:Connect(function(dt)
    -- dt is time since last step
  end)

  -- Pre-physics
  RunService.Stepped:Connect(function(currentTime, dt)
    -- currentTime is workspace.DistributedGameTime
  end)

- Use dt (delta time) for frame-rate independent animation:
  -- WRONG: part.Position += Vector3.new(0, 1, 0)  -- frame-rate dependent
  -- RIGHT: part.Position += Vector3.new(0, speed * dt, 0)  -- consistent speed

ANIMATION EVENTS (MARKER SIGNALS):
- Animation markers are set in the Animation Editor at specific keyframes.
- They fire signals during playback for syncing effects:

  local track = animator:LoadAnimation(slashAnimation)
  track:Play()

  -- Sync sound to animation frame
  track:GetMarkerReachedSignal("SwingStart"):Connect(function()
    swooshSound:Play()
  end)

  track:GetMarkerReachedSignal("HitFrame"):Connect(function()
    -- Check for enemies in hitbox at this exact frame
    performHitDetection()
  end)

  track:GetMarkerReachedSignal("EffectSpawn"):Connect(function()
    -- Spawn particle effect at weapon tip
    spawnSlashEffect(weapon.Tip.Position)
  end)

- KeyframeReached event (alternative to markers):
  track.KeyframeReached:Connect(function(keyframeName)
    if keyframeName == "FootstepLeft" then
      playFootstep("left")
    elseif keyframeName == "FootstepRight" then
      playFootstep("right")
    end
  end)
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface AnimationSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const ANIMATION_SECTIONS: AnimationSection[] = [
  {
    name: 'tween_fundamentals',
    keywords: [
      'tween', 'tweenservice', 'tween info', 'interpolate', 'animate property',
      'smooth movement', 'tween create', 'goal',
    ],
    startMarker: 'TWEENSERVICE FUNDAMENTALS:',
    endMarker: 'EASING STYLES (ALL 11):',
  },
  {
    name: 'easing_styles',
    keywords: [
      'easing', 'easing style', 'easingstyle', 'bounce', 'elastic', 'quad',
      'sine', 'linear', 'back', 'exponential', 'cubic', 'quart', 'quint',
      'circular', 'easing direction', 'acceleration curve',
    ],
    startMarker: 'EASING STYLES (ALL 11):',
    endMarker: 'ANIMATIONCONTROLLER AND ANIMATOR:',
  },
  {
    name: 'animation_controller',
    keywords: [
      'animator', 'animation controller', 'load animation', 'animation track',
      'play animation', 'stop animation', 'animation speed', 'animation weight',
      'character animation', 'humanoid animation',
    ],
    startMarker: 'ANIMATIONCONTROLLER AND ANIMATOR:',
    endMarker: 'ANIMATION PRIORITY LEVELS:',
  },
  {
    name: 'animation_priority',
    keywords: [
      'animation priority', 'idle priority', 'movement priority', 'action priority',
      'core priority', 'override animation', 'blend animation',
    ],
    startMarker: 'ANIMATION PRIORITY LEVELS:',
    endMarker: 'DEFAULT ROBLOX ANIMATION IDS:',
  },
  {
    name: 'default_animations',
    keywords: [
      'default animation', 'animation id', 'walk animation', 'run animation',
      'idle animation', 'dance animation', 'emote', 'replace animation',
      'animation asset',
    ],
    startMarker: 'DEFAULT ROBLOX ANIMATION IDS:',
    endMarker: 'SKELETAL ANIMATION (Motor6D / CFRAME MANIPULATION):',
  },
  {
    name: 'skeletal_animation',
    keywords: [
      'motor6d', 'skeletal', 'joint', 'bone', 'rig', 'c0', 'c1', 'transform',
      'neck', 'waist', 'look at', 'head tracking', 'procedural rig',
    ],
    startMarker: 'SKELETAL ANIMATION (Motor6D / CFRAME MANIPULATION):',
    endMarker: 'PROCEDURAL ANIMATION PATTERNS:',
  },
  {
    name: 'procedural_animation',
    keywords: [
      'procedural', 'bobbing', 'floating', 'sway', 'breathing', 'idle bob',
      'pendulum', 'wave motion', 'oscillate', 'sin animation',
    ],
    startMarker: 'PROCEDURAL ANIMATION PATTERNS:',
    endMarker: 'CAMERA ANIMATIONS:',
  },
  {
    name: 'camera_animation',
    keywords: [
      'camera', 'camera shake', 'screen shake', 'cutscene', 'cinematic',
      'camera transition', 'camera path', 'camera tween', 'scriptable camera',
    ],
    startMarker: 'CAMERA ANIMATIONS:',
    endMarker: 'PART ANIMATIONS (DOORS, PLATFORMS, ELEVATORS):',
  },
  {
    name: 'part_animation',
    keywords: [
      'door', 'sliding door', 'elevator', 'lift', 'platform', 'moving platform',
      'spinning', 'rotate', 'open door', 'close door', 'moving part',
    ],
    startMarker: 'PART ANIMATIONS (DOORS, PLATFORMS, ELEVATORS):',
    endMarker: 'UI ANIMATIONS:',
  },
  {
    name: 'ui_animation',
    keywords: [
      'ui animation', 'gui animation', 'fade in', 'fade out', 'slide in',
      'popup', 'pop in', 'scale animation', 'text animation', 'number counter',
      'menu animation', 'interface animation',
    ],
    startMarker: 'UI ANIMATIONS:',
    endMarker: 'PARTICLE EFFECT ANIMATIONS:',
  },
  {
    name: 'particle_effects',
    keywords: [
      'particle', 'trail', 'beam', 'emitter', 'fire', 'smoke', 'sparkle',
      'particle emitter', 'burst', 'explosion effect', 'vfx', 'visual effect',
    ],
    startMarker: 'PARTICLE EFFECT ANIMATIONS:',
    endMarker: 'SPRING MODULE PATTERN:',
  },
  {
    name: 'spring_module',
    keywords: [
      'spring', 'spring module', 'physics motion', 'natural motion', 'camera bob',
      'recoil', 'sway spring', 'impulse', 'damping',
    ],
    startMarker: 'SPRING MODULE PATTERN:',
    endMarker: 'RUNSERVICE ANIMATION LOOPS:',
  },
  {
    name: 'runservice_loops',
    keywords: [
      'runservice', 'renderstepped', 'heartbeat', 'stepped', 'frame rate',
      'delta time', 'animation loop', 'game loop', 'update loop',
    ],
    startMarker: 'RUNSERVICE ANIMATION LOOPS:',
    endMarker: 'ANIMATION EVENTS (MARKER SIGNALS):',
  },
  {
    name: 'animation_events',
    keywords: [
      'animation event', 'marker', 'keyframe', 'marker signal', 'sync effect',
      'animation callback', 'keyframe reached', 'footstep sync',
    ],
    startMarker: 'ANIMATION EVENTS (MARKER SIGNALS):',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the animation knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantAnimationKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = ANIMATION_SECTIONS.map((section) => {
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
    return '' // no match — don't inject animation knowledge
  }

  return extractAnimationSections(selected.map((s) => s.section))
}

function extractAnimationSections(sections: AnimationSection[]): string {
  const fullText = ANIMATION_KNOWLEDGE
  const parts: string[] = [
    '=== ANIMATION KNOWLEDGE (matched to your request) ===\n',
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
