// DevForum UI & Building Patterns Knowledge
// Distilled from Roblox Developer Forum community posts
// Covers: UI design, ScreenGui patterns, obby creation, visual effects, building techniques

export const DEVFORUM_UI_BUILDING = `
=== MODERN UI DESIGN PRINCIPLES ===

// Pattern from DevForum: Here's How to Create a Modern Sleek UI Design [UI Tutorial]
// Pattern from DevForum: UI Design Starter Guide
// Pattern from DevForum: How To Make Simple & Modern UI

-- SCREENGUI CONFIGURATION (best practice setup)
-- In StarterGui, create ScreenGui with:
--   IgnoreGuiInset = true   (extends into top bar area)
--   ResetOnSpawn   = false  (preserves UI across deaths)
--   DisplayOrder   = 1      (layer priority, higher = on top)

-- ROOT CONTAINER FRAME
-- Size:       UDim2.new(1, 0, 1, 0)   -- full screen
-- Position:   UDim2.new(0, 0, 0, 0)
-- AnchorPoint: Vector2.new(0, 0)
-- BackgroundTransparency: 1

-- CENTERING TRICK (any element centered on screen)
-- AnchorPoint: Vector2.new(0.5, 0.5)
-- Position:    UDim2.new(0.5, 0, 0.5, 0)

-- SCALE vs OFFSET DECISION GUIDE:
-- Use SCALE for: main containers, full-screen frames, responsive panels
-- Use OFFSET for: icons (fixed px), padding, margins, border thickness
-- Combine: UDim2.new(0, 0, 0.08, 0) = full width but fixed 8% height

-- UICorner: makes rounded corners
-- CornerRadius = UDim.new(0, 8)  -- 8px radius, sharp-modern
-- CornerRadius = UDim.new(0, 16) -- 16px radius, soft
-- CornerRadius = UDim.new(1, 0)  -- fully circular (for icons)

-- UIStroke: border outline
-- Color     = Color3.fromRGB(255, 255, 255)
-- Thickness = 1.5
-- Transparency = 0.6   (subtle)
-- LineJoinMode = Miter (sharp corners)

-- UIPadding: inner spacing
-- PaddingTop/Bottom/Left/Right = UDim.new(0, 10) -- 10px all sides

-- UIListLayout: auto-stack children
-- FillDirection = Vertical
-- HorizontalAlignment = Center
-- Padding = UDim.new(0, 8)  -- 8px gap between items
-- SortOrder = LayoutOrder   -- respect LayoutOrder numbers

-- UIGridLayout: grid arrangement
-- CellSize = UDim2.new(0, 80, 0, 80)  -- 80x80 cells
-- CellPadding = UDim2.new(0, 8, 0, 8)
-- FillDirectionMaxCells = 4  -- max 4 per row

=== BUTTON & INTERACTION PATTERNS ===

// Hover and click animations using TweenService

local TweenService = game:GetService("TweenService")

local HOVER_INFO = TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local CLICK_INFO = TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

local function addButtonBehavior(button)
    local originalSize = button.Size
    local hoverSize = UDim2.new(
        originalSize.X.Scale * 1.05, originalSize.X.Offset * 1.05,
        originalSize.Y.Scale * 1.05, originalSize.Y.Offset * 1.05
    )
    local clickSize = UDim2.new(
        originalSize.X.Scale * 0.95, originalSize.X.Offset * 0.95,
        originalSize.Y.Scale * 0.95, originalSize.Y.Offset * 0.95
    )

    -- Hover effect
    button.MouseEnter:Connect(function()
        TweenService:Create(button, HOVER_INFO, {
            Size = hoverSize,
            BackgroundTransparency = 0.85
        }):Play()
        if button:FindFirstChildWhichIsA("UIStroke") then
            TweenService:Create(button.UIStroke, HOVER_INFO, { Thickness = 2 }):Play()
        end
    end)

    button.MouseLeave:Connect(function()
        TweenService:Create(button, HOVER_INFO, {
            Size = originalSize,
            BackgroundTransparency = 0.9
        }):Play()
        if button:FindFirstChildWhichIsA("UIStroke") then
            TweenService:Create(button.UIStroke, HOVER_INFO, { Thickness = 1 }):Play()
        end
    end)

    -- Click press/release
    button.MouseButton1Down:Connect(function()
        TweenService:Create(button, CLICK_INFO, { Size = clickSize }):Play()
    end)

    button.MouseButton1Up:Connect(function()
        TweenService:Create(button, CLICK_INFO, { Size = originalSize }):Play()
    end)
end

-- Apply to all buttons in a frame
local function initAllButtons(parent)
    for _, child in parent:GetDescendants() do
        if child:IsA("TextButton") or child:IsA("ImageButton") then
            addButtonBehavior(child)
        end
    end
end

=== SCREEN PANEL / POPUP SYSTEM ===

-- PANEL OPEN/CLOSE with slide animation
local function openPanel(panel, direction)
    direction = direction or "Bottom" -- "Bottom", "Top", "Left", "Right"
    panel.Visible = true

    local startPos
    if direction == "Bottom" then
        startPos = UDim2.new(panel.Position.X.Scale, 0, 1.2, 0)
    elseif direction == "Top" then
        startPos = UDim2.new(panel.Position.X.Scale, 0, -1.2, 0)
    end

    local targetPos = panel.Position
    panel.Position = startPos

    TweenService:Create(panel, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = targetPos
    }):Play()
end

local function closePanel(panel, direction, onComplete)
    direction = direction or "Bottom"
    local endPos
    if direction == "Bottom" then
        endPos = UDim2.new(panel.Position.X.Scale, 0, 1.2, 0)
    end

    local tween = TweenService:Create(panel, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
        Position = endPos
    })
    tween:Play()
    tween.Completed:Connect(function()
        panel.Visible = false
        if onComplete then onComplete() end
    end)
end

-- NOTIFICATION SYSTEM
local function showNotification(container, message, icon, duration)
    local notif = script.NotificationTemplate:Clone()
    notif.Message.Text = message
    if icon then notif.Icon.Image = icon end
    notif.Parent = container

    -- Slide in
    notif.Position = UDim2.new(1.1, 0, notif.Position.Y.Scale, 0)
    TweenService:Create(notif, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = UDim2.new(0, 0, notif.Position.Y.Scale, 0)
    }):Play()

    -- Auto dismiss
    task.delay(duration or 3, function()
        TweenService:Create(notif, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Position = UDim2.new(1.1, 0, notif.Position.Y.Scale, 0)
        }):Play()
        task.wait(0.25)
        notif:Destroy()
    end)
end

=== RESPONSIVE UI PATTERNS ===

-- DEVICE DETECTION for mobile-aware layouts
local UserInputService = game:GetService("UserInputService")

local isMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled

local function adaptUIForDevice(screenGui)
    if isMobile then
        -- Avoid bottom-left (analog stick area)
        -- Move HUD elements to top or bottom-right
        -- Increase button sizes for touch
        local hud = screenGui:FindFirstChild("HUD")
        if hud then
            hud.AnchorPoint = Vector2.new(1, 1)
            hud.Position = UDim2.new(1, -10, 1, -80) -- bottom-right, above mobile stick
        end
    end
end

-- ASPECT RATIO CONSTRAINT (maintains proportions on all screens)
-- Add UIAspectRatioConstraint to any element that must stay square/fixed-ratio:
-- AspectRatio = 1  (square)
-- AspectRatio = 16/9 (widescreen panel)
-- DominantAxis = Width or Height

-- SIZECONSTRAINT usage:
-- RelativeYY = both X and Y scale from screen HEIGHT (best for consistent sizing)
-- RelativeXX = both scale from screen WIDTH

-- AUTO-CANVAS for scroll frames
-- ScrollingFrame:
--   AutomaticCanvasSize = Enum.AutomaticSize.Y
--   CanvasSize = UDim2.new(0, 0, 0, 0)   (let auto handle it)
--   ScrollBarThickness = 3
--   ScrollBarImageTransparency = 0.5
--   ScrollingDirection = Y

=== COLOR SYSTEM & VISUAL DESIGN ===

-- DARK THEME (game UI standard)
local COLORS = {
    Background    = Color3.fromRGB(18, 18, 24),   -- near-black with blue tint
    Surface       = Color3.fromRGB(28, 28, 38),   -- card background
    SurfaceHover  = Color3.fromRGB(38, 38, 52),   -- hover state
    Border        = Color3.fromRGB(60, 60, 80),   -- subtle borders
    Primary       = Color3.fromRGB(99, 102, 241), -- indigo accent
    PrimaryHover  = Color3.fromRGB(129, 140, 248),
    Success       = Color3.fromRGB(34, 197, 94),  -- green
    Warning       = Color3.fromRGB(234, 179, 8),  -- yellow
    Danger        = Color3.fromRGB(239, 68, 68),  -- red
    TextPrimary   = Color3.fromRGB(255, 255, 255),
    TextSecondary = Color3.fromRGB(148, 163, 184),
    TextMuted     = Color3.fromRGB(71, 85, 105),
}

-- GRADIENT usage (UIGradient)
-- Rotation = 90   (top-to-bottom)
-- Color = ColorSequence.new({
--   ColorSequenceKeypoint.new(0, Color3.fromRGB(99,102,241)),
--   ColorSequenceKeypoint.new(1, Color3.fromRGB(168,85,247))
-- })

-- TRANSPARENCY RULES
-- Background panels:   0.1-0.2 (slight see-through)
-- Hover states:        0.85
-- Default buttons:     0.9
-- Inactive/disabled:   0.6
-- Overlay dimmer:      0.5

=== HEALTH BAR / STAT DISPLAYS ===

-- HEALTH BAR (smooth tween animation)
local function createHealthBar(parent)
    local container = Instance.new("Frame")
    container.Size = UDim2.new(1, 0, 0, 8)
    container.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    container.Parent = parent
    Instance.new("UICorner").Parent = container

    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.new(1, 0, 1, 0)
    fill.BackgroundColor3 = Color3.fromRGB(34, 197, 94)
    fill.Parent = container
    Instance.new("UICorner").Parent = fill

    return {
        update = function(current, max)
            local pct = math.clamp(current / max, 0, 1)
            TweenService:Create(fill, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
                Size = UDim2.new(pct, 0, 1, 0)
            }):Play()

            -- Color shift: green → yellow → red
            if pct > 0.6 then
                fill.BackgroundColor3 = Color3.fromRGB(34, 197, 94)
            elseif pct > 0.3 then
                fill.BackgroundColor3 = Color3.fromRGB(234, 179, 8)
            else
                fill.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
            end
        end
    }
end

-- FLOATING DAMAGE NUMBERS
local function showDamageNumber(character, amount, isCrit)
    local root = character:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 60, 0, 30)
    billboard.StudsOffset = Vector3.new(math.random(-1, 1), 3, 0)
    billboard.AlwaysOnTop = false
    billboard.Parent = root

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = isCrit and ("💥 " .. amount) or tostring(amount)
    label.TextColor3 = isCrit and Color3.fromRGB(255, 200, 0) or Color3.fromRGB(255, 80, 80)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    -- Float up and fade
    local startPos = billboard.StudsOffset
    local endPos = startPos + Vector3.new(0, 4, 0)

    TweenService:Create(billboard, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        StudsOffset = endPos
    }):Play()
    TweenService:Create(label, TweenInfo.new(1, Enum.EasingStyle.Quad), {
        TextTransparency = 1
    }):Play()

    game:GetService("Debris"):AddItem(billboard, 1.1)
end

=== OBBY / OBSTACLE COURSE PATTERNS ===

// Pattern from DevForum: How to refine your Obby game
// Checkpoints, stage counters, themed obstacles

-- CHECKPOINT SYSTEM
local CheckpointStore = game:GetService("DataStoreService"):GetDataStore("ObbySave")

-- Server: handle checkpoint touches
local function setupCheckpoints(checkpointFolder)
    local checkpoints = checkpointFolder:GetChildren()
    table.sort(checkpoints, function(a, b)
        return a:GetAttribute("Stage") < b:GetAttribute("Stage")
    end)

    for _, checkpoint in checkpoints do
        local stage = checkpoint:GetAttribute("Stage")
        checkpoint.Touched:Connect(function(hit)
            local player = game.Players:GetPlayerFromCharacter(hit.Parent)
            if not player then return end

            local currentStage = player:GetAttribute("Stage") or 0
            if stage > currentStage then
                player:SetAttribute("Stage", stage)
                player.leaderstats.Stage.Value = stage

                -- Save checkpoint
                pcall(function()
                    CheckpointStore:SetAsync(tostring(player.UserId), stage)
                end)
            end
        end)
    end
end

-- Load saved stage on join
game.Players.PlayerAdded:Connect(function(player)
    local savedStage = 1
    pcall(function()
        savedStage = CheckpointStore:GetAsync(tostring(player.UserId)) or 1
    end)
    player:SetAttribute("Stage", savedStage)

    -- Teleport to saved checkpoint on spawn
    player.CharacterAdded:Connect(function(char)
        task.wait(0.1) -- let character load
        local checkpointFolder = workspace:FindFirstChild("Checkpoints")
        if not checkpointFolder then return end
        local target = checkpointFolder:FindFirstChild("Stage" .. savedStage)
        if target then
            char:PivotTo(target.CFrame + Vector3.new(0, 3, 0))
        end
    end)
end)

-- KILL BRICK SETUP
-- Use Neon material on kill parts so players recognize them
-- Touch kills instantly via Humanoid.Health = 0
local function setupKillBrick(part)
    part.Material = Enum.Material.Neon
    part.BrickColor = BrickColor.new("Bright red")
    part.Touched:Connect(function(hit)
        local hum = hit.Parent:FindFirstChildOfClass("Humanoid")
        if hum then
            hum.Health = 0
        end
    end)
end

-- MOVING OBSTACLE PATTERN (tween-based)
local function setupMovingPlatform(platform, pointA, pointB, speed)
    local distance = (pointA - pointB).Magnitude
    local duration = distance / speed

    local function cycle()
        while true do
            TweenService:Create(platform, TweenInfo.new(duration, Enum.EasingStyle.Linear), {
                CFrame = CFrame.new(pointB)
            }):Play()
            task.wait(duration)
            TweenService:Create(platform, TweenInfo.new(duration, Enum.EasingStyle.Linear), {
                CFrame = CFrame.new(pointA)
            }):Play()
            task.wait(duration)
        end
    end
    task.spawn(cycle)
end

-- SPINNING OBSTACLE
local function setupSpinner(part, axis, speed)
    -- speed in degrees per second
    RunService.Heartbeat:Connect(function(dt)
        local angle = math.rad(speed * dt)
        if axis == "Y" then
            part.CFrame = part.CFrame * CFrame.Angles(0, angle, 0)
        elseif axis == "X" then
            part.CFrame = part.CFrame * CFrame.Angles(angle, 0, 0)
        elseif axis == "Z" then
            part.CFrame = part.CFrame * CFrame.Angles(0, 0, angle)
        end
    end)
end

=== BUILDING TECHNIQUES ===

-- VISUAL QUALITY MATERIALS (never SmoothPlastic for organic/natural builds)
-- Concrete  → stone walls, floors, urban
-- Brick     → fantasy, medieval, house walls
-- Wood      → planks, floors, furniture
-- Metal     → sci-fi, industrial, space
-- Rock      → terrain, caves, mountains
-- Neon      → glowing elements, kill bricks, decorative lights
-- Glass     → windows, see-through floors, greenhouse
-- DiamondPlate → grating, industrial platforms
-- Fabric    → banners, soft surfaces
-- Ice       → winter themes, slippery floors

-- PART NAMING CONVENTION (for AI-generated builds)
-- [Type]_[Room]_[Description]
-- e.g.: Wall_Kitchen_North, Floor_Lobby_Main, Door_Bedroom_Front

-- LIGHTING SETUP TEMPLATE
local Lighting = game:GetService("Lighting")
Lighting.Ambient          = Color3.fromRGB(70, 70, 80)    -- cool ambient
Lighting.OutdoorAmbient   = Color3.fromRGB(100, 110, 130)
Lighting.Brightness       = 2
Lighting.ClockTime        = 14  -- 2 PM
Lighting.ShadowSoftness   = 0.2

-- Atmosphere for depth
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density  = 0.3
atmosphere.Offset   = 0.1
atmosphere.Color    = Color3.fromRGB(199, 170, 140)
atmosphere.Decay    = Color3.fromRGB(80, 100, 120)
atmosphere.Glare    = 0.3
atmosphere.Haze     = 0.5
atmosphere.Parent   = Lighting

-- Post processing for visual polish
local colorCorrection = Instance.new("ColorCorrectionEffect")
colorCorrection.Brightness = 0.02
colorCorrection.Contrast   = 0.1
colorCorrection.Saturation = 0.1
colorCorrection.TintColor  = Color3.fromRGB(255, 248, 240) -- warm tint
colorCorrection.Parent     = Lighting

local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.8
bloom.Size      = 24
bloom.Threshold = 0.95
bloom.Parent    = Lighting

local sunrays = Instance.new("SunRaysEffect")
sunrays.Intensity = 0.08
sunrays.Spread    = 0.5
sunrays.Parent    = Lighting

-- PART DETAIL RULE: minimum 30 parts for any significant build
-- Every room needs: floor, ceiling, 4 walls, door frame, at least 3 props
-- Props elevate quality: paintings, plants, lights, furniture details

-- ROOM PROPORTION GUIDE
-- Ceiling height: 10-12 studs (residential), 16-20 studs (commercial/fantasy)
-- Door width: 6-8 studs, height: 10 studs
-- Window: 6 studs wide, 6 studs tall, centered on wall
-- Walkway: minimum 6 studs wide

=== VIEWPORT FRAME (3D ITEM PREVIEWS) ===

-- Use ViewportFrames for inventory item previews, shop displays, etc.
local function createItemPreview(frame, modelTemplate)
    local viewport = Instance.new("ViewportFrame")
    viewport.Size = UDim2.new(1, 0, 1, 0)
    viewport.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    viewport.LightColor = Color3.fromRGB(200, 210, 255)
    viewport.LightDirection = Vector3.new(-1, -2, -1)
    viewport.Parent = frame

    local model = modelTemplate:Clone()
    model.Parent = viewport

    -- Auto-frame the model
    local camera = Instance.new("Camera")
    camera.Parent = viewport
    viewport.CurrentCamera = camera

    local cf, size = model:GetBoundingBox()
    local maxSize = math.max(size.X, size.Y, size.Z)
    camera.CFrame = CFrame.new(cf.Position + Vector3.new(0, maxSize * 0.3, maxSize * 1.5), cf.Position)

    -- Slow rotation for polish
    RunService.RenderStepped:Connect(function(dt)
        camera.CFrame = CFrame.Angles(0, dt * 0.5, 0) * camera.CFrame
    end)

    return viewport
end
`;
