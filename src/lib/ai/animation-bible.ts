/**
 * Animation Bible — TweenService recipes, character animations, mechanical animations, UI motion.
 * ForjeGames AI Knowledge Base — 4000+ lines
 */

// ============================================================
// EASING REFERENCE
// ============================================================
export const ANIM_EASING: string = `
=== EASING COMPLETE REFERENCE ===

TweenInfo constructor: TweenInfo.new(Time, EasingStyle, EasingDirection, RepeatCount, Reverses, DelayTime)
- Time: number (seconds)
- EasingStyle: Enum.EasingStyle
- EasingDirection: Enum.EasingDirection
- RepeatCount: integer (-1 = infinite, 0 = play once, 2 = play 3 times total)
- Reverses: boolean (if true, tween plays forward then backward each cycle)
- DelayTime: number (seconds before tween starts)

--- EASINGSTYLE × EASINGDIRECTION MATRIX ---

LINEAR:
  Linear.In    = constant speed start to finish (identical to Linear.Out and Linear.InOut)
  Linear.Out   = same as In for linear
  Linear.InOut = same as In for linear
  USE FOR: conveyor belts, clock hands, spinning objects at constant speed, progress bars

SINE:
  Sine.In      = starts slow, ends fast (like pulling a pendulum) — gentle acceleration
  Sine.Out     = starts fast, ends slow (natural deceleration) — MOST NATURAL FEEL
  Sine.InOut   = slow-fast-slow (smooth symmetric curve) — breathing, bobbing, pendulums
  USE FOR: Sine.Out = doors closing, NPCs moving, almost everything "natural"
           Sine.InOut = continuous looping (bobbing, breathing, idle sways)
           Sine.In = items being thrown or launched

QUAD:
  Quad.In      = slightly faster acceleration than Sine.In
  Quad.Out     = slightly snappier stop than Sine.Out — good for UI panels
  Quad.InOut   = smooth but a little punchier than Sine.InOut
  USE FOR: UI slide-ins (Quad.Out), elevator movement (Quad.InOut)

CUBIC:
  Cubic.In     = noticeable slow start, fast finish
  Cubic.Out    = fast start, noticeable deceleration — great for projectile landing
  Cubic.InOut  = noticeable ease at both ends — cinematic camera moves
  USE FOR: camera transitions, dramatic UI entrances

QUART:
  Quart.In     = very slow start, very fast finish — feels like being pulled
  Quart.Out    = very fast start, very slow stop — elegant deceleration
  Quart.InOut  = pronounced ease in and out
  USE FOR: luxury UI feel, premium animations

QUINT:
  Quint.In     = extremely slow start, explosive finish
  Quint.Out    = explosive start, almost freezes at end — dramatic deceleration
  Quint.InOut  = extreme ease both ends — cinematic wipes
  USE FOR: special effects, dramatic reveals

EXPONENTIAL:
  Exponential.In    = nearly stationary start, then extremely fast — rocket launch feel
  Exponential.Out   = extremely fast start, nearly stops at end — bullet impact
  Exponential.InOut = near-still to hyperspeed to near-still
  USE FOR: Exponential.In = building up power, charging effects
           Exponential.Out = explosion spreading, impact waves

CIRCULAR:
  Circular.In    = starts slow, ends very fast (circular arc shape)
  Circular.Out   = starts very fast, slows to stop (quarter-circle curve)
  Circular.InOut = circular arc ease both ends
  USE FOR: rolling objects, wheel animations, orbiting

BACK:
  Back.In    = overshoots backward at start before going forward — windup effect
  Back.Out   = overshoots past target then settles — BOUNCY OVERSHOOT
  Back.InOut = overshoots at both start and end
  USE FOR: Back.Out = UI popups appearing (scale from 0), buttons being clicked,
           chest opening, character jumping up
  IMPORTANT: Back.Out is the #1 choice for UI elements appearing on screen

BOUNCE:
  Bounce.In    = bounces at the START before going forward (reversed landing)
  Bounce.Out   = bounces at the END like a ball landing — LANDING EFFECT
  Bounce.InOut = bounces at both start and end
  USE FOR: Bounce.Out = objects falling and landing, notifications dropping in,
           ball physics, dropped items
  NOTE: Bounce creates multiple micro-steps, not smooth curve

ELASTIC:
  Elastic.In    = wobbles at start, then snaps forward — spring being released
  Elastic.Out   = overshoots then oscillates back to settle — SPRINGY UI
  Elastic.InOut = elastic oscillation at both ends
  USE FOR: Elastic.Out = springy UI elements, tooltip appearing, health bar filling,
           magical effects, jelly-like objects
  NOTE: Elastic extends beyond target before settling — account for this in layout

--- QUICK REFERENCE CHEAT SHEET ---
Natural movement:         Sine.Out (doors, NPCs, most things)
Looping smooth:           Sine.InOut (bobs, breathes, sways)
UI popup:                 Back.Out (scale from 0 to full)
UI slide in:              Quad.Out (panel from off-screen)
Springy/bouncy UI:        Elastic.Out (fun elements)
Ball landing:             Bounce.Out (impact landing)
Cinematic camera:         Cubic.InOut (smooth transitions)
Constant rotation:        Linear (wheels, clocks, conveyors)
Rocket/charge:            Exponential.In (building power)
Impact/explosion:         Exponential.Out (fast then stops)
Overshoot settle:         Back.Out (satisfying click feel)
Dramatic deceleration:    Quart.Out (premium feel)
`;

// ============================================================
// TWEENSERVICE MASTERY
// ============================================================
export const ANIM_TWEEN_RECIPES: string = `
=== TWEENSERVICE MASTERY ===

--- BASIC TWEEN SETUP ---
local TweenService = game:GetService("TweenService")

-- Tween a part's position
local part = workspace.MyPart
local goal = {Position = Vector3.new(0, 10, 0)}
local info = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.Out)
local tween = TweenService:Create(part, info, goal)
tween:Play()

-- Wait for tween to finish
tween.Completed:Connect(function(playbackState)
    if playbackState == Enum.PlaybackState.Completed then
        print("Tween done")
    end
end)

-- Or yield: tween.Completed:Wait()

--- TWEENABLE PROPERTIES (COMPLETE LIST) ---
NUMBERS:        Transparency, Reflectance, Size (single axis via NumberValue), Volume,
                FieldOfView, FocalLength, NearPlaneZ, any NumberValue.Value
VECTOR3:        Position, Size, Velocity, RotVelocity
CFRAME:         CFrame (includes both position AND rotation)
COLOR3:         Color (parts), BackgroundColor3, TextColor3, BorderColor3,
                ImageColor3, PlaceholderColor3
UDIM2:          Size, Position (UI elements)
VECTOR2:        ImageRectOffset, ImageRectSize, ScrollingFrame.CanvasPosition
NUMBERRANGE:    (not directly tweenAble — tween min/max separately)
UDIM:           (not directly tweenAble)

NON-TWEENABLES (common mistakes):
  BrickColor — use Color3 instead
  Material — cannot tween, swap instantly
  ClassName — cannot change
  Enum values — cannot tween (e.g., Font, Shape)
  boolean — cannot tween
  string — cannot tween (use TextLabel.Text with typewriter instead)
  Parent — cannot tween
  Name — cannot tween

--- ADVANCED TWEEN PATTERNS ---

-- CHAINED TWEENS (sequence of movements)
local function chainTweens(tweenList)
    for _, tween in ipairs(tweenList) do
        tween:Play()
        tween.Completed:Wait()
    end
end

local t1 = TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {Position = Vector3.new(0, 10, 0)})
local t2 = TweenService:Create(part, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    {Position = Vector3.new(5, 10, 0)})
local t3 = TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
    {Position = Vector3.new(5, 0, 0)})

task.spawn(function()
    chainTweens({t1, t2, t3})
end)

-- PARALLEL TWEENS (multiple properties at once)
-- Single tween can animate multiple properties simultaneously
local goal = {
    Position = Vector3.new(0, 10, 0),
    Size = Vector3.new(4, 4, 4),
    Color = Color3.fromRGB(255, 100, 0),
    Transparency = 0.5
}
local tween = TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.Out), goal)
tween:Play()

-- CANCELLING A TWEEN
tween:Cancel()  -- stops and resets to start values
tween:Pause()   -- stops but keeps current values
tween:Play()    -- resumes from current values

-- INFINITE LOOP WITH REVERSAL
local info = TweenInfo.new(
    2,                          -- 2 seconds
    Enum.EasingStyle.Sine,
    Enum.EasingDirection.InOut,
    -1,                         -- infinite repeat
    true,                       -- reverses (goes back to start)
    0                           -- no delay
)
local tween = TweenService:Create(part, info, {Position = part.Position + Vector3.new(0, 5, 0)})
tween:Play()

-- DELAYED START
local info = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.Out, 0, false, 2)
-- tween will wait 2 seconds before starting

-- MULTIPLE TWEENS ON SAME OBJECT
-- TweenService handles property conflicts: the LAST tween to Play() wins for shared properties
-- Different properties on same object animate fine in parallel
local colorTween = TweenService:Create(part, TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Color = Color3.fromRGB(255, 0, 0)})
local bobTween = TweenService:Create(part, TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Position = part.Position + Vector3.new(0, 3, 0)})
colorTween:Play()
bobTween:Play()  -- both play simultaneously on different properties

--- TWEEN CLEANUP PATTERN ---
-- Always clean up tweens to avoid memory leaks
local activeTweens = {}

local function playTween(object, info, goal)
    -- Cancel existing tween on this object if any
    if activeTweens[object] then
        activeTweens[object]:Cancel()
    end
    local tween = TweenService:Create(object, info, goal)
    activeTweens[object] = tween
    tween:Play()
    tween.Completed:Connect(function()
        if activeTweens[object] == tween then
            activeTweens[object] = nil
        end
    end)
    return tween
end

--- CFRAME TWEENING (ROTATION + POSITION) ---
-- Rotate part 90 degrees around Y axis
local targetCFrame = part.CFrame * CFrame.Angles(0, math.rad(90), 0)
local rotateTween = TweenService:Create(part, TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {CFrame = targetCFrame})
rotateTween:Play()

-- Move AND rotate simultaneously
local targetCFrame = CFrame.new(10, 5, -20) * CFrame.Angles(0, math.rad(45), 0)
local moveTween = TweenService:Create(part, TweenInfo.new(2, Enum.EasingStyle.Cubic, Enum.EasingDirection.InOut),
    {CFrame = targetCFrame})
moveTween:Play()

-- PIVOT-BASED ROTATION (rotate around edge, not center)
-- Roblox tweens rotate around part center. For edge rotation:
-- Use a "hinge" invisible part as parent anchor, weld the visible part offset
-- Then tween the hinge's CFrame

local hinge = Instance.new("Part")
hinge.Anchored = true
hinge.Transparency = 1
hinge.Size = Vector3.new(0.1, 0.1, 0.1)
hinge.CFrame = CFrame.new(doorEdgePosition)  -- place at rotation pivot
hinge.Parent = workspace

local door = workspace.Door
local weld = Instance.new("WeldConstraint")
weld.Part0 = hinge
weld.Part1 = door
weld.Parent = hinge

-- Now tween hinge rotation to rotate door around its edge
local openCFrame = hinge.CFrame * CFrame.Angles(0, math.rad(-90), 0)
local doorTween = TweenService:Create(hinge, TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {CFrame = openCFrame})

--- COLOR TWEENING ---
-- Smooth color transition
local colorTween = TweenService:Create(part, TweenInfo.new(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {Color = Color3.fromRGB(255, 50, 50)})
colorTween:Play()

-- Color cycle (rainbow) using Heartbeat instead of tween:
local RunService = game:GetService("RunService")
local hue = 0
RunService.Heartbeat:Connect(function(dt)
    hue = (hue + dt * 0.2) % 1  -- full cycle every 5 seconds
    part.Color = Color3.fromHSV(hue, 1, 1)
end)

--- SIZE TWEENING ---
-- Grow part
local growTween = TweenService:Create(part, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    {Size = Vector3.new(6, 6, 6)})

-- Pulse effect (grow and shrink continuously)
local pulseInfo = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
local pulseTween = TweenService:Create(part, pulseInfo, {Size = part.Size * 1.1})
pulseTween:Play()

-- IMPORTANT: Size tweens around center. For growing from base:
-- Tween both Size and Position simultaneously so base stays grounded
local baseY = part.Position.Y
local growGoal = {
    Size = Vector3.new(part.Size.X, 10, part.Size.Z),
    Position = Vector3.new(part.Position.X, baseY + 5, part.Position.Z)  -- move up by half the growth
}
TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.Out), growGoal):Play()

--- UI TWEENING SPECIFICS ---
-- UI uses UDim2 for Position and Size
-- UDim2.new(scaleX, offsetX, scaleY, offsetY)

local frame = script.Parent  -- ScreenGui > Frame

-- Slide in from right
frame.Position = UDim2.new(1.2, 0, 0.5, 0)  -- off right side
local slideIn = TweenService:Create(frame,
    TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    {Position = UDim2.new(0.5, 0, 0.5, 0)})
slideIn:Play()

-- Fade in (BackgroundTransparency)
frame.BackgroundTransparency = 1
local fadeIn = TweenService:Create(frame,
    TweenInfo.new(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {BackgroundTransparency = 0})
fadeIn:Play()

-- Scale pop (from invisible to full size)
frame.Size = UDim2.new(0, 0, 0, 0)
frame.AnchorPoint = Vector2.new(0.5, 0.5)
local scalePop = TweenService:Create(frame,
    TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    {Size = UDim2.new(0.4, 0, 0.3, 0)})
scalePop:Play()

--- TRANSPARENCY TWEENING ---
-- Fade out part
TweenService:Create(part, TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {Transparency = 1}):Play()

-- Fade in part
part.Transparency = 1
TweenService:Create(part, TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
    {Transparency = 0}):Play()

-- Neon glow pulse (transparency oscillates for glow effect)
local glowPart = workspace.GlowPart  -- set Material = Neon
glowPart.Material = Enum.Material.Neon
TweenService:Create(glowPart,
    TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
    {Transparency = 0.7}):Play()
`;

