/**
 * gui-templates.ts — 32 Premium GUI/UI Templates
 *
 * Every template returns complete Luau code that creates a polished ScreenGui.
 * Industry-standard dark theme based on DevForum research + PSX/Adopt Me analysis.
 * Colors: bg=(20,20,20) card=(30,30,30) gold=(212,175,55) — NEVER pure black.
 *
 * Pro techniques from research:
 * - Exponential easing for menus (snappier than Back)
 * - UIScale bounce on button press (squish 0.9 → bounce 1.0)
 * - UIGradient shimmer on gold/accent buttons
 * - NumberValue tween for smooth coin counters
 * - MaxVisibleGraphemes for typewriter text (official Roblox method)
 * - Corner radius via Scale (responsive) not Offset
 * - UIStroke with slight transparency (0.8) for cleaner borders
 * - Notification colors: success/info/warn/alert system
 *
 * Quality bar: Pet Simulator X / Adopt Me / Anime Defenders level.
 */

// ─── Shared color/style block injected into every template ──────────────────

const GUI_STYLE_BLOCK = `
-- ═══ ForjeGames Cartoon UI Kit ═══
-- Bright, colorful, chunky — like Pet Simulator X / Adopt Me / Anime Defenders
-- NOT dark dev panels. Kids want COLOR, BOLD text, THICK borders, BIG corners.

-- ═══ PANEL COLORS (bright + gradient-ready) ═══
local BG = Color3.fromRGB(30, 35, 50)            -- deep blue-gray overlay behind panels
local BG_DEEP = Color3.fromRGB(20, 25, 40)
local SURFACE = Color3.fromRGB(50, 140, 255)      -- main panel blue (like reference images)
local SURFACE_DARK = Color3.fromRGB(35, 100, 200) -- darker shade for gradient
local CARD = Color3.fromRGB(40, 120, 220)          -- item card blue
local CARD_HOVER = Color3.fromRGB(60, 150, 255)    -- hover highlight
local ELEVATED = Color3.fromRGB(70, 170, 255)      -- raised/selected state

-- Header bar (darker strip at top of each panel)
local HEADER = Color3.fromRGB(30, 80, 170)
local HEADER_DARK = Color3.fromRGB(20, 55, 130)

-- ═══ ACCENT COLORS ═══
local GOLD = Color3.fromRGB(255, 210, 50)         -- currency, important actions
local GOLD_BRIGHT = Color3.fromRGB(255, 230, 100)
local GOLD_DIM = Color3.fromRGB(200, 165, 40)
local GREEN = Color3.fromRGB(80, 220, 100)         -- success, buy, confirm
local GREEN_DARK = Color3.fromRGB(50, 160, 70)
local RED = Color3.fromRGB(240, 70, 70)             -- danger, close, sell
local RED_DARK = Color3.fromRGB(180, 45, 45)
local BLUE = Color3.fromRGB(60, 150, 255)
local BLUE_DARK = Color3.fromRGB(40, 100, 200)
local PURPLE = Color3.fromRGB(160, 90, 255)         -- epic/rare
local ORANGE = Color3.fromRGB(255, 160, 40)          -- legendary/warning
local PINK = Color3.fromRGB(255, 100, 180)           -- special/mythic

-- ═══ RARITY COLORS (standard Roblox convention) ═══
local RARITY_COMMON = Color3.fromRGB(200, 200, 200)
local RARITY_UNCOMMON = Color3.fromRGB(80, 220, 100)
local RARITY_RARE = Color3.fromRGB(60, 150, 255)
local RARITY_EPIC = Color3.fromRGB(160, 90, 255)
local RARITY_LEGENDARY = Color3.fromRGB(255, 210, 50)
local RARITY_MYTHIC = Color3.fromRGB(255, 70, 70)

-- ═══ TEXT (white on colored backgrounds, with shadow) ═══
local TEXT = Color3.fromRGB(255, 255, 255)
local TEXT_SUB = Color3.fromRGB(220, 225, 240)
local TEXT_MUTED = Color3.fromRGB(160, 170, 200)
local TEXT_DIM = TEXT_MUTED
local TEXT_SHADOW = Color3.fromRGB(0, 0, 0)  -- for TextStrokeColor3

-- ═══ BORDER (thick, visible, colorful) ═══
local BORDER = Color3.fromRGB(25, 60, 140)         -- dark blue border for panels
local BORDER_LIGHT = Color3.fromRGB(100, 180, 255) -- inner highlight border
local BORDER_ACTIVE = Color3.fromRGB(255, 210, 50) -- selected/active gold border

-- Services
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ═══ Animation presets (snappy, playful) ═══
local TWEEN_FAST = TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local TWEEN_NORMAL = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local TWEEN_OPEN = TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local TWEEN_CLOSE = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
local TWEEN_POPUP = TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local TWEEN_BOUNCE = TweenInfo.new(0.5, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out)
local TWEEN_PULSE = TweenInfo.new(1.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)

-- ═══ Reusable component helpers ═══
local function addCorner(parent, radius)
  local c = Instance.new("UICorner") c.CornerRadius = UDim.new(0, radius or 14) c.Parent = parent return c
end
local function addStroke(parent, color, thickness, transparency)
  local s = Instance.new("UIStroke") s.Color = color or BORDER s.Thickness = thickness or 3
  s.Transparency = transparency or 0 s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
  s.Parent = parent return s
end
local function addPadding(parent, px)
  local p = Instance.new("UIPadding")
  p.PaddingTop = UDim.new(0, px or 12) p.PaddingBottom = UDim.new(0, px or 12)
  p.PaddingLeft = UDim.new(0, px or 12) p.PaddingRight = UDim.new(0, px or 12)
  p.Parent = parent return p
end
local function addGradient(parent, c1, c2, rotation)
  local g = Instance.new("UIGradient")
  g.Color = ColorSequence.new(c1 or SURFACE, c2 or SURFACE_DARK)
  g.Rotation = rotation or 90
  g.Parent = parent return g
end

-- ═══ Header bar (colored strip at top of every panel) ═══
local function makeHeader(parent, title, height)
  local header = Instance.new("Frame")
  header.Size = UDim2.new(1, 0, 0, height or 50)
  header.BackgroundColor3 = HEADER
  header.BorderSizePixel = 0
  header.Parent = parent
  addCorner(header, 14)
  addGradient(header, HEADER, HEADER_DARK, 90)
  -- Title text with stroke for readability
  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -60, 1, 0)
  label.Position = UDim2.new(0, 16, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = title or "PANEL"
  label.TextColor3 = TEXT
  label.Font = Enum.Font.FredokaOne
  label.TextSize = 28
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.TextStrokeTransparency = 0.5
  label.TextStrokeColor3 = TEXT_SHADOW
  label.Parent = header
  return header
end

-- ═══ Big chunky button (cartoon style) ═══
local function makeButton(parent, text, color, size, position)
  local btn = Instance.new("TextButton")
  btn.Size = size or UDim2.new(0.4, 0, 0, 48)
  btn.Position = position or UDim2.new(0.3, 0, 0.85, 0)
  btn.BackgroundColor3 = color or GREEN
  btn.Text = text or "CLICK"
  btn.TextColor3 = TEXT
  btn.Font = Enum.Font.FredokaOne
  btn.TextSize = 22
  btn.TextStrokeTransparency = 0.5
  btn.TextStrokeColor3 = TEXT_SHADOW
  btn.AutoButtonColor = false
  btn.BorderSizePixel = 0
  btn.Parent = parent
  addCorner(btn, 12)
  addStroke(btn, Color3.fromRGB(
    math.floor(color and color.R*255*0.6 or 30),
    math.floor(color and color.G*255*0.6 or 100),
    math.floor(color and color.B*255*0.6 or 50)
  ), 3)
  -- Bottom shadow (darker strip at bottom of button for 3D look)
  local shadow = Instance.new("Frame")
  shadow.Size = UDim2.new(1, 0, 0, 6)
  shadow.Position = UDim2.new(0, 0, 1, -6)
  shadow.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  shadow.BackgroundTransparency = 0.6
  shadow.BorderSizePixel = 0
  shadow.Parent = btn
  addCorner(shadow, 12)
  -- Hover: scale up + brighten
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = Color3.fromRGB(
      math.min(255, math.floor((color or GREEN).R*255 + 30)),
      math.min(255, math.floor((color or GREEN).G*255 + 30)),
      math.min(255, math.floor((color or GREEN).B*255 + 30))
    )}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = color or GREEN}):Play()
  end)
  return btn
end

-- ═══ Close button (red circle X — like reference images) ═══
local function makeCloseBtn(parent, callback)
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 40, 0, 40)
  btn.Position = UDim2.new(1, -48, 0, 5)
  btn.BackgroundColor3 = RED
  btn.Text = "X"
  btn.TextColor3 = TEXT
  btn.Font = Enum.Font.FredokaOne
  btn.TextSize = 22
  btn.TextStrokeTransparency = 0.5
  btn.TextStrokeColor3 = TEXT_SHADOW
  btn.AutoButtonColor = false
  btn.BorderSizePixel = 0
  btn.Parent = parent
  addCorner(btn, 20) -- fully rounded circle
  addStroke(btn, RED_DARK, 3)
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = Color3.fromRGB(255, 100, 100), Size = UDim2.new(0, 44, 0, 44)}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = RED, Size = UDim2.new(0, 40, 0, 40)}):Play()
  end)
  btn.MouseButton1Click:Connect(function()
    playSound(SFX.close, 0.3)
    callback()
  end)
  return btn
end

-- ═══ Button with bounce press + hover glow + SOUNDS ═══
local function makeButton(parent, text, color, size, position)
  local btn = Instance.new("TextButton")
  btn.Size = size or UDim2.new(0.8, 0, 0, 36)
  btn.Position = position or UDim2.new(0.1, 0, 1, -44)
  btn.BackgroundColor3 = color or GOLD
  btn.Text = text or "Button"
  btn.TextColor3 = BG_DEEP
  btn.Font = Enum.Font.GothamBold
  btn.TextSize = 15
  btn.AutoButtonColor = false
  btn.Parent = parent
  addCorner(btn, 8)
  -- UIScale for bounce press effect
  local scale = Instance.new("UIScale") scale.Parent = btn
  -- Gold gradient shimmer
  if color == GOLD or color == nil then
    local shimmer = Instance.new("UIGradient")
    shimmer.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(200,165,45)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255,230,120)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(200,165,45)),
    })
    shimmer.Rotation = 45
    shimmer.Parent = btn
    -- Shimmer animation loop
    task.spawn(function()
      while btn.Parent do
        shimmer.Offset = Vector2.new(-1, 0)
        TweenService:Create(shimmer, TweenInfo.new(1.2, Enum.EasingStyle.Circular, Enum.EasingDirection.Out), {Offset = Vector2.new(1, 0)}):Play()
        task.wait(3.5)
      end
    end)
  end
  -- Hover: subtle glow + sound
  btn.MouseEnter:Connect(function()
    playSound(SFX.hover, 0.12)
    TweenService:Create(scale, TWEEN_FAST, {Scale = 1.04}):Play()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = color == GOLD and GOLD_BRIGHT or Color3.new(
      math.min((color or GOLD).R * 1.2, 1), math.min((color or GOLD).G * 1.2, 1), math.min((color or GOLD).B * 1.2, 1)
    )}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(scale, TWEEN_FAST, {Scale = 1}):Play()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = color or GOLD}):Play()
  end)
  -- Press: squish bounce + click sound
  btn.MouseButton1Down:Connect(function()
    TweenService:Create(scale, TweenInfo.new(0.08), {Scale = 0.92}):Play()
    playSound(SFX.click, 0.4)
  end)
  btn.MouseButton1Up:Connect(function()
    TweenService:Create(scale, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()
  end)
  return btn
end

-- ═══ Smooth number counter (coins going up) ═══
local function animateNumber(label, targetValue, duration, prefix, suffix)
  prefix = prefix or ""
  suffix = suffix or ""
  duration = duration or 1
  local nv = Instance.new("NumberValue")
  nv.Value = tonumber(label.Text:match("%d+")) or 0
  nv.Changed:Connect(function(val)
    label.Text = prefix .. tostring(math.floor(val)) .. suffix
  end)
  TweenService:Create(nv, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Value = targetValue}):Play()
  task.delay(duration + 0.1, function() nv:Destroy() end)
end

-- ═══ Typewriter text (official Roblox method) ═══
local function typewrite(label, text, charDelay)
  charDelay = charDelay or 0.03
  label.Text = text
  label.MaxVisibleGraphemes = 0
  local len = utf8.len(text) or #text
  for i = 1, len do
    label.MaxVisibleGraphemes = i
    task.wait(charDelay)
  end
end

-- ═══ Panel open/close animations + sounds ═══
local function animateOpen(frame, targetSize, targetPos)
  playSound(SFX.open, 0.3)
  frame.Size = UDim2.new(0, 0, 0, 0)
  frame.Position = UDim2.new(0.5, 0, 0.5, 0)
  frame.BackgroundTransparency = 0.5
  TweenService:Create(frame, TWEEN_POPUP, {
    Size = targetSize, Position = targetPos, BackgroundTransparency = 0
  }):Play()
end
local function animateClose(frame, callback)
  playSound(SFX.close, 0.3)
  TweenService:Create(frame, TWEEN_CLOSE, {
    Size = UDim2.new(0, 0, 0, 0),
    Position = UDim2.new(0.5, 0, 0.5, 0),
    BackgroundTransparency = 0.5
  }):Play()
  task.wait(0.22)
  if callback then callback() end
end

-- ═══ SOUND SYSTEM (the #1 missing thing in amateur UIs) ═══
-- Sound IDs: community-sourced best UI sounds
local SFX = {
  click = "rbxassetid://6927468309",       -- crisp button click
  hover = "rbxassetid://6324801967",        -- soft hover tick
  open = "rbxassetid://6895079853",         -- panel whoosh open
  close = "rbxassetid://6895079891",        -- panel whoosh close
  purchase = "rbxassetid://19073176",       -- coin cha-ching
  error = "rbxassetid://6895079965",        -- low error buzz
  notify = "rbxassetid://5852470908",       -- bubble pop notification
  reward = "rbxassetid://5853855838",       -- reward jingle
}
local SoundService = game:GetService("SoundService")
local function playSound(id, volume)
  local s = Instance.new("Sound")
  s.SoundId = id
  s.Volume = volume or 0.5
  s.PlayOnRemove = false
  s.Parent = SoundService
  s:Play()
  task.delay(2, function() s:Destroy() end)
end

-- ═══ COMPLETE TOGGLE SYSTEM (button on screen + close X + keybind) ═══
-- Call this ONCE per GUI. It creates:
--   1. A small button pinned to screen edge (always visible)
--   2. A close X button inside the panel
--   3. Keyboard shortcut to toggle
--   4. Smooth open/close animations with sounds
local UserInputService = game:GetService("UserInputService")
local function makeToggleSystem(screenGui, mainFrame, label, keyCode, targetSize, targetPos, cornerPos)
  cornerPos = cornerPos or UDim2.new(1, -56, 1, -56) -- default: bottom-right
  local isOpen = true

  -- Close function (hides panel, doesn't destroy)
  local function closePanel()
    if not isOpen then return end
    isOpen = false
    playSound(SFX.close, 0.3)
    TweenService:Create(mainFrame, TWEEN_CLOSE, {
      Size = UDim2.new(0, 0, 0, 0),
      Position = UDim2.new(0.5, 0, 0.5, 0),
      BackgroundTransparency = 0.5
    }):Play()
    task.wait(0.22)
    mainFrame.Visible = false
  end

  -- Open function (shows panel with animation)
  local function openPanel()
    if isOpen then return end
    isOpen = true
    mainFrame.Visible = true
    playSound(SFX.open, 0.3)
    mainFrame.Size = UDim2.new(0, 0, 0, 0)
    mainFrame.Position = UDim2.new(0.5, 0, 0.5, 0)
    mainFrame.BackgroundTransparency = 0.5
    TweenService:Create(mainFrame, TWEEN_POPUP, {
      Size = targetSize,
      Position = targetPos,
      BackgroundTransparency = 0
    }):Play()
  end

  -- 1. Toggle button (small, always visible, pinned to screen edge)
  local toggleBtn = Instance.new("TextButton")
  toggleBtn.Size = UDim2.new(0, 46, 0, 46)
  toggleBtn.Position = cornerPos
  toggleBtn.BackgroundColor3 = GOLD
  toggleBtn.Text = string.sub(label or "?", 1, 4)
  toggleBtn.TextColor3 = BG_DEEP
  toggleBtn.Font = Enum.Font.GothamBold
  toggleBtn.TextSize = 11
  toggleBtn.AutoButtonColor = false
  toggleBtn.ZIndex = 5
  toggleBtn.Parent = screenGui
  addCorner(toggleBtn, 12)
  addStroke(toggleBtn, GOLD_DIM, 2, 0.3)
  local tScale = Instance.new("UIScale") tScale.Parent = toggleBtn
  toggleBtn.MouseEnter:Connect(function()
    TweenService:Create(tScale, TWEEN_FAST, {Scale = 1.1}):Play()
    playSound(SFX.hover, 0.1)
  end)
  toggleBtn.MouseLeave:Connect(function()
    TweenService:Create(tScale, TWEEN_FAST, {Scale = 1}):Play()
  end)
  toggleBtn.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.4)
    if isOpen then closePanel() else openPanel() end
  end)

  -- 2. Close X button (inside the panel, top-right)
  makeCloseBtn(mainFrame, closePanel)

  -- 3. Keyboard shortcut
  if keyCode then
    UserInputService.InputBegan:Connect(function(input, processed)
      if processed then return end
      if input.KeyCode == keyCode then
        if isOpen then closePanel() else openPanel() end
      end
    end)
  end

  -- Initial open animation
  openPanel()

  return { open = openPanel, close = closePanel, toggle = toggleBtn }
end

-- Legacy alias
local function bindToggle(gui, keyCode, openCallback, closeCallback)
  local isOpen = gui.Visible ~= false
  UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == keyCode then
      isOpen = not isOpen
      if isOpen then
        gui.Visible = true
        if openCallback then openCallback() end
        playSound(SFX.open, 0.3)
      else
        if closeCallback then closeCallback() end
        playSound(SFX.close, 0.3)
      end
    end
  end)
end

-- ═══ VIEWPORT 3D PREVIEW (spinning item in shop/inventory cards) ═══
local RunService = game:GetService("RunService")
local function makeViewport(parent, modelOrPart, size, position)
  local vf = Instance.new("ViewportFrame")
  vf.Size = size or UDim2.new(1, -8, 0.6, 0)
  vf.Position = position or UDim2.new(0, 4, 0, 4)
  vf.BackgroundTransparency = 1
  vf.Parent = parent
  addCorner(vf, 6)

  local cam = Instance.new("Camera")
  cam.FieldOfView = 50
  vf.CurrentCamera = cam
  cam.Parent = vf

  if modelOrPart then
    local clone = modelOrPart:Clone()
    clone.Parent = vf
    -- Auto-rotate
    local t = 0
    RunService.PostSimulation:Connect(function(delta)
      if not vf.Parent then return end
      t = t + delta
      cam.CFrame = CFrame.Angles(0, math.rad(t * 40), 0) * CFrame.new(0, 0, 8)
    end)
  end
  return vf
end

-- ═══ TAB SYSTEM (category switching with slide animation) ═══
local function makeTabs(parent, tabNames, contentFrame, callback)
  local tabBar = Instance.new("Frame")
  tabBar.Size = UDim2.new(1, 0, 0, 32)
  tabBar.Position = UDim2.new(0, 0, 0, 42)
  tabBar.BackgroundTransparency = 1
  tabBar.Parent = parent

  local layout = Instance.new("UIListLayout")
  layout.FillDirection = Enum.FillDirection.Horizontal
  layout.Padding = UDim.new(0, 4)
  layout.Parent = tabBar

  local activeTab = 1
  local tabButtons = {}
  for i, name in ipairs(tabNames) do
    local tab = Instance.new("TextButton")
    tab.Size = UDim2.new(1/#tabNames, -4, 1, 0)
    tab.BackgroundColor3 = i == 1 and GOLD or CARD
    tab.Text = name
    tab.TextColor3 = i == 1 and BG_DEEP or TEXT_MUTED
    tab.Font = Enum.Font.GothamBold
    tab.TextSize = 13
    tab.AutoButtonColor = false
    tab.LayoutOrder = i
    tab.Parent = tabBar
    addCorner(tab, 6)
    tabButtons[i] = tab

    tab.MouseButton1Click:Connect(function()
      if activeTab == i then return end
      playSound(SFX.click, 0.3)
      -- Deactivate old tab
      TweenService:Create(tabButtons[activeTab], TWEEN_FAST, {BackgroundColor3 = CARD, TextColor3 = TEXT_MUTED}):Play()
      -- Activate new tab
      activeTab = i
      TweenService:Create(tab, TWEEN_FAST, {BackgroundColor3 = GOLD, TextColor3 = BG_DEEP}):Play()
      -- Slide content
      if contentFrame then
        TweenService:Create(contentFrame, TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {Position = UDim2.new(-0.1, 0, contentFrame.Position.Y.Scale, 0)}):Play()
        task.wait(0.15)
        if callback then callback(i, name) end
        contentFrame.Position = UDim2.new(1.1, 0, contentFrame.Position.Y.Scale, 0)
        TweenService:Create(contentFrame, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Position = UDim2.new(0, 0, contentFrame.Position.Y.Scale, 0)}):Play()
      else
        if callback then callback(i, name) end
      end
    end)
  end
  return tabBar, tabButtons
end

-- ═══ EMPTY STATE (when no items/content to show) ═══
local function makeEmptyState(parent, message, ctaText, ctaCallback)
  local frame = Instance.new("Frame")
  frame.Size = UDim2.new(1, 0, 1, 0)
  frame.BackgroundTransparency = 1
  frame.Parent = parent

  local icon = Instance.new("TextLabel")
  icon.Size = UDim2.new(0, 60, 0, 60)
  icon.Position = UDim2.new(0.5, -30, 0.3, -30)
  icon.BackgroundTransparency = 1
  icon.Text = "?"
  icon.TextColor3 = TEXT_MUTED
  icon.TextTransparency = 0.5
  icon.Font = Enum.Font.GothamBold
  icon.TextSize = 40
  icon.Parent = frame

  local msg = Instance.new("TextLabel")
  msg.Size = UDim2.new(0.8, 0, 0, 20)
  msg.Position = UDim2.new(0.1, 0, 0.3, 40)
  msg.BackgroundTransparency = 1
  msg.Text = message or "Nothing here yet"
  msg.TextColor3 = TEXT_MUTED
  msg.Font = Enum.Font.GothamMedium
  msg.TextSize = 15
  msg.Parent = frame

  if ctaText and ctaCallback then
    local btn = makeButton(frame, ctaText, GOLD, UDim2.new(0.4, 0, 0, 32), UDim2.new(0.3, 0, 0.3, 70))
    btn.MouseButton1Click:Connect(ctaCallback)
  end
  return frame
end

-- ═══ NOTIFICATION BADGE (red dot with count) ═══
local function addBadge(parent, count)
  local badge = Instance.new("Frame")
  badge.Size = UDim2.new(0, 18, 0, 18)
  badge.Position = UDim2.new(1, -6, 0, -6)
  badge.BackgroundColor3 = RED
  badge.ZIndex = 10
  badge.Parent = parent
  addCorner(badge, 9)

  local num = Instance.new("TextLabel")
  num.Size = UDim2.new(1, 0, 1, 0)
  num.BackgroundTransparency = 1
  num.Text = tostring(count or 0)
  num.TextColor3 = TEXT
  num.Font = Enum.Font.GothamBold
  num.TextSize = 10
  num.ZIndex = 11
  num.Parent = badge

  -- Pulse animation to grab attention
  local pulse = Instance.new("UIScale") pulse.Parent = badge
  TweenService:Create(pulse, TWEEN_PULSE, {Scale = 1.15}):Play()

  return badge, num
end

-- ═══ NUMBER FORMATTING (1K, 1.5M, 2.3B — every simulator does this) ═══
local function formatNumber(n)
  if n >= 1e12 then return string.format("%.1fT", n/1e12)
  elseif n >= 1e9 then return string.format("%.1fB", n/1e9)
  elseif n >= 1e6 then return string.format("%.1fM", n/1e6)
  elseif n >= 1e3 then return string.format("%.1fK", n/1e3)
  else return tostring(math.floor(n)) end
end
-- Comma-separated version: 1,500,000
local function commaFormat(n)
  local s = tostring(math.floor(n))
  local result = ""
  for i = #s, 1, -1 do
    result = s:sub(i,i) .. result
    if (#s - i + 1) % 3 == 0 and i > 1 then result = "," .. result end
  end
  return result
end

-- ═══ CONFIRMATION POPUP (reusable "Are you sure?" for any action) ═══
local function showConfirmation(title, message, cost, currencyName, onConfirm, onCancel)
  playSound(SFX.open, 0.3)
  local overlay = Instance.new("Frame")
  overlay.Size = UDim2.new(1, 0, 1, 0)
  overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  overlay.BackgroundTransparency = 0.5
  overlay.ZIndex = 50
  overlay.Parent = playerGui:FindFirstChild("ForjeShop") or playerGui

  local popup = Instance.new("Frame")
  popup.Size = UDim2.new(0, 320, 0, 200)
  popup.Position = UDim2.new(0.5, -160, 0.5, -100)
  popup.BackgroundColor3 = BG
  popup.ZIndex = 51
  popup.Parent = overlay
  addCorner(popup, 12)
  addStroke(popup, GOLD, 2, 0.1)
  addPadding(popup, 16)
  addGradient(popup, BG_DEEP, SURFACE, 90)

  local titleLabel = Instance.new("TextLabel")
  titleLabel.Size = UDim2.new(1, 0, 0, 28)
  titleLabel.BackgroundTransparency = 1
  titleLabel.Text = title or "CONFIRM"
  titleLabel.TextColor3 = GOLD
  titleLabel.Font = Enum.Font.GothamBold
  titleLabel.TextSize = 20
  titleLabel.ZIndex = 52
  titleLabel.Parent = popup

  local msgLabel = Instance.new("TextLabel")
  msgLabel.Size = UDim2.new(1, 0, 0, 40)
  msgLabel.Position = UDim2.new(0, 0, 0, 36)
  msgLabel.BackgroundTransparency = 1
  msgLabel.Text = message or "Are you sure?"
  msgLabel.TextColor3 = TEXT
  msgLabel.Font = Enum.Font.GothamMedium
  msgLabel.TextSize = 15
  msgLabel.TextWrapped = true
  msgLabel.ZIndex = 52
  msgLabel.Parent = popup

  if cost then
    local costLabel = Instance.new("TextLabel")
    costLabel.Size = UDim2.new(1, 0, 0, 24)
    costLabel.Position = UDim2.new(0, 0, 0, 80)
    costLabel.BackgroundTransparency = 1
    costLabel.Text = "Cost: " .. formatNumber(cost) .. " " .. (currencyName or "Coins")
    costLabel.TextColor3 = GOLD
    costLabel.Font = Enum.Font.GothamBold
    costLabel.TextSize = 18
    costLabel.ZIndex = 52
    costLabel.Parent = popup
  end

  -- Confirm button
  local confirmBtn = Instance.new("TextButton")
  confirmBtn.Size = UDim2.new(0.45, 0, 0, 36)
  confirmBtn.Position = UDim2.new(0.02, 0, 1, -48)
  confirmBtn.BackgroundColor3 = GREEN
  confirmBtn.Text = "CONFIRM"
  confirmBtn.TextColor3 = BG_DEEP
  confirmBtn.Font = Enum.Font.GothamBold
  confirmBtn.TextSize = 15
  confirmBtn.AutoButtonColor = false
  confirmBtn.ZIndex = 52
  confirmBtn.Parent = popup
  addCorner(confirmBtn, 8)
  local confirmScale = Instance.new("UIScale") confirmScale.Parent = confirmBtn
  confirmBtn.MouseButton1Down:Connect(function()
    TweenService:Create(confirmScale, TweenInfo.new(0.08), {Scale = 0.92}):Play()
  end)
  confirmBtn.MouseButton1Up:Connect(function()
    TweenService:Create(confirmScale, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()
  end)
  confirmBtn.MouseButton1Click:Connect(function()
    playSound(SFX.purchase, 0.5)
    if onConfirm then onConfirm() end
    overlay:Destroy()
  end)

  -- Cancel button
  local cancelBtn = Instance.new("TextButton")
  cancelBtn.Size = UDim2.new(0.45, 0, 0, 36)
  cancelBtn.Position = UDim2.new(0.53, 0, 1, -48)
  cancelBtn.BackgroundColor3 = CARD
  cancelBtn.Text = "CANCEL"
  cancelBtn.TextColor3 = TEXT_MUTED
  cancelBtn.Font = Enum.Font.GothamBold
  cancelBtn.TextSize = 15
  cancelBtn.AutoButtonColor = false
  cancelBtn.ZIndex = 52
  cancelBtn.Parent = popup
  addCorner(cancelBtn, 8)
  cancelBtn.MouseButton1Click:Connect(function()
    playSound(SFX.close, 0.3)
    if onCancel then onCancel() end
    overlay:Destroy()
  end)

  -- Animate in
  popup.Size = UDim2.new(0, 0, 0, 0)
  popup.Position = UDim2.new(0.5, 0, 0.5, 0)
  TweenService:Create(popup, TWEEN_POPUP, {
    Size = UDim2.new(0, 320, 0, 200),
    Position = UDim2.new(0.5, -160, 0.5, -100)
  }):Play()
  return overlay
end

-- ═══ TOOLTIP SYSTEM (hover any item → see name, stats, rarity, description) ═══
local tooltipFrame, tooltipName, tooltipDesc, tooltipStats, tooltipRarity
local function initTooltip()
  if tooltipFrame then return end
  tooltipFrame = Instance.new("Frame")
  tooltipFrame.Size = UDim2.new(0, 220, 0, 120)
  tooltipFrame.BackgroundColor3 = Color3.fromRGB(12, 12, 16)
  tooltipFrame.Visible = false
  tooltipFrame.ZIndex = 100
  tooltipFrame.Parent = playerGui
  addCorner(tooltipFrame, 8)
  addStroke(tooltipFrame, GOLD, 1, 0.3)
  addPadding(tooltipFrame, 10)

  tooltipName = Instance.new("TextLabel")
  tooltipName.Size = UDim2.new(1, 0, 0, 20)
  tooltipName.BackgroundTransparency = 1
  tooltipName.TextColor3 = TEXT
  tooltipName.Font = Enum.Font.GothamBold
  tooltipName.TextSize = 15
  tooltipName.TextXAlignment = Enum.TextXAlignment.Left
  tooltipName.ZIndex = 101
  tooltipName.Parent = tooltipFrame

  tooltipRarity = Instance.new("TextLabel")
  tooltipRarity.Size = UDim2.new(1, 0, 0, 14)
  tooltipRarity.Position = UDim2.new(0, 0, 0, 20)
  tooltipRarity.BackgroundTransparency = 1
  tooltipRarity.Font = Enum.Font.GothamBold
  tooltipRarity.TextSize = 11
  tooltipRarity.TextXAlignment = Enum.TextXAlignment.Left
  tooltipRarity.ZIndex = 101
  tooltipRarity.Parent = tooltipFrame

  tooltipDesc = Instance.new("TextLabel")
  tooltipDesc.Size = UDim2.new(1, 0, 0, 36)
  tooltipDesc.Position = UDim2.new(0, 0, 0, 38)
  tooltipDesc.BackgroundTransparency = 1
  tooltipDesc.TextColor3 = TEXT_SUB
  tooltipDesc.Font = Enum.Font.GothamMedium
  tooltipDesc.TextSize = 13
  tooltipDesc.TextWrapped = true
  tooltipDesc.TextXAlignment = Enum.TextXAlignment.Left
  tooltipDesc.TextYAlignment = Enum.TextYAlignment.Top
  tooltipDesc.ZIndex = 101
  tooltipDesc.Parent = tooltipFrame

  tooltipStats = Instance.new("TextLabel")
  tooltipStats.Size = UDim2.new(1, 0, 0, 20)
  tooltipStats.Position = UDim2.new(0, 0, 1, -20)
  tooltipStats.BackgroundTransparency = 1
  tooltipStats.TextColor3 = GREEN
  tooltipStats.Font = Enum.Font.GothamMedium
  tooltipStats.TextSize = 12
  tooltipStats.TextXAlignment = Enum.TextXAlignment.Left
  tooltipStats.ZIndex = 101
  tooltipStats.Parent = tooltipFrame
end

local function showTooltip(data, guiObject)
  initTooltip()
  if not tooltipFrame then return end
  tooltipName.Text = data.name or "Unknown"
  tooltipDesc.Text = data.description or ""
  tooltipStats.Text = data.stats or ""
  local rarityColors = {common=TEXT_MUTED, uncommon=GREEN, rare=BLUE, epic=PURPLE, legendary=GOLD}
  tooltipRarity.Text = data.rarity and string.upper(data.rarity) or ""
  tooltipRarity.TextColor3 = rarityColors[data.rarity] or TEXT_MUTED
  -- Position near the hovered element
  local pos = guiObject.AbsolutePosition
  tooltipFrame.Position = UDim2.new(0, pos.X + guiObject.AbsoluteSize.X + 8, 0, pos.Y)
  tooltipFrame.Visible = true
end
local function hideTooltip()
  if tooltipFrame then tooltipFrame.Visible = false end
end

-- ═══ SEARCH BAR (filter items in inventory/shop) ═══
local function makeSearchBar(parent, placeholder, onSearch)
  local bar = Instance.new("Frame")
  bar.Size = UDim2.new(1, 0, 0, 32)
  bar.BackgroundColor3 = SURFACE
  bar.Parent = parent
  addCorner(bar, 6)
  addStroke(bar, BORDER, 1, 0.3)

  local icon = Instance.new("TextLabel")
  icon.Size = UDim2.new(0, 28, 1, 0)
  icon.BackgroundTransparency = 1
  icon.Text = "?"
  icon.TextColor3 = TEXT_MUTED
  icon.Font = Enum.Font.GothamBold
  icon.TextSize = 16
  icon.Parent = bar

  local input = Instance.new("TextBox")
  input.Size = UDim2.new(1, -36, 1, 0)
  input.Position = UDim2.new(0, 32, 0, 0)
  input.BackgroundTransparency = 1
  input.PlaceholderText = placeholder or "Search..."
  input.PlaceholderColor3 = TEXT_MUTED
  input.Text = ""
  input.TextColor3 = TEXT
  input.Font = Enum.Font.GothamMedium
  input.TextSize = 14
  input.TextXAlignment = Enum.TextXAlignment.Left
  input.ClearTextOnFocus = false
  input.Parent = bar

  -- Focus glow
  input.Focused:Connect(function()
    TweenService:Create(bar, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
    local stroke = bar:FindFirstChildOfClass("UIStroke")
    if stroke then TweenService:Create(stroke, TWEEN_FAST, {Color = GOLD, Transparency = 0}):Play() end
  end)
  input.FocusLost:Connect(function(enterPressed)
    TweenService:Create(bar, TWEEN_FAST, {BackgroundColor3 = SURFACE}):Play()
    local stroke = bar:FindFirstChildOfClass("UIStroke")
    if stroke then TweenService:Create(stroke, TWEEN_FAST, {Color = BORDER, Transparency = 0.3}):Play() end
    if onSearch then onSearch(input.Text) end
  end)
  input:GetPropertyChangedSignal("Text"):Connect(function()
    if onSearch then onSearch(input.Text) end
  end)

  return bar, input
end

-- ═══ SKELETON LOADING (shimmer placeholder while data loads) ═══
local function makeSkeletonCard(parent, size, layoutOrder)
  local card = Instance.new("Frame")
  card.Size = size or UDim2.new(1, 0, 0, 80)
  card.BackgroundColor3 = CARD
  card.LayoutOrder = layoutOrder or 0
  card.Parent = parent
  addCorner(card, 8)

  -- Shimmer gradient that sweeps across
  local shimmer = Instance.new("UIGradient")
  shimmer.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, CARD),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(50, 50, 60)),
    ColorSequenceKeypoint.new(0.6, Color3.fromRGB(50, 50, 60)),
    ColorSequenceKeypoint.new(1, CARD),
  })
  shimmer.Rotation = 25
  shimmer.Parent = card

  -- Animate shimmer loop
  task.spawn(function()
    while card.Parent do
      shimmer.Offset = Vector2.new(-1.5, 0)
      TweenService:Create(shimmer, TweenInfo.new(1.2, Enum.EasingStyle.Linear), {Offset = Vector2.new(1.5, 0)}):Play()
      task.wait(1.8)
    end
  end)
  return card
end

-- ═══ PURCHASE FLOW (the complete buy experience) ═══
local function doPurchase(itemName, itemPrice, currencyName, balanceLabel, onSuccess, onFail)
  -- Step 1: Show confirmation
  showConfirmation(
    "PURCHASE",
    "Buy " .. itemName .. "?",
    itemPrice,
    currencyName or "Coins",
    function()
      -- Step 2: Fire server purchase
      local re = game.ReplicatedStorage:FindFirstChild("PurchaseItem")
      if re then
        re:FireServer(itemName)
      end

      -- Step 3: Optimistic UI update — animate coin count DOWN
      if balanceLabel then
        local currentText = balanceLabel.Text
        local currentVal = tonumber(currentText:match("[%d,]+"):gsub(",","")) or 0
        local newVal = math.max(0, currentVal - itemPrice)
        animateNumber(balanceLabel, newVal, 0.8, "", " " .. (currencyName or "Coins"))
      end

      -- Step 4: Success feedback
      playSound(SFX.purchase, 0.5)

      -- Step 5: Success notification toast
      local notifRe = game.ReplicatedStorage:FindFirstChild("Notification")
      if notifRe then
        notifRe:FireServer("Purchased " .. itemName .. "!", "success")
      end

      if onSuccess then onSuccess() end
    end,
    function()
      -- Cancelled
      if onFail then onFail() end
    end
  )
end

-- ═══ ERROR TOAST (quick inline error message) ═══
local function showError(parentFrame, message)
  playSound(SFX.error, 0.4)
  local toast = Instance.new("Frame")
  toast.Size = UDim2.new(0.9, 0, 0, 32)
  toast.Position = UDim2.new(0.05, 0, 1, 4)
  toast.BackgroundColor3 = RED_DIM
  toast.ZIndex = 20
  toast.Parent = parentFrame
  addCorner(toast, 6)

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -12, 1, 0)
  label.Position = UDim2.new(0, 6, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = message or "Something went wrong"
  label.TextColor3 = Color3.fromRGB(255, 180, 180)
  label.Font = Enum.Font.GothamBold
  label.TextSize = 13
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.ZIndex = 21
  label.Parent = toast

  -- Slide in
  toast.Position = UDim2.new(0.05, 0, 1, 40)
  TweenService:Create(toast, TWEEN_NORMAL, {Position = UDim2.new(0.05, 0, 1, -38)}):Play()
  -- Auto-dismiss
  task.delay(3, function()
    TweenService:Create(toast, TWEEN_CLOSE, {Position = UDim2.new(0.05, 0, 1, 40), BackgroundTransparency = 1}):Play()
    task.wait(0.25)
    if toast.Parent then toast:Destroy() end
  end)
end

-- ═══ RARITY GLOW SYSTEM (animated border + shimmer for legendary items) ═══
local RARITY_COLORS = {
  common = {border = TEXT_MUTED, glow = false},
  uncommon = {border = GREEN, glow = false},
  rare = {border = BLUE, glow = true},
  epic = {border = PURPLE, glow = true},
  legendary = {border = GOLD, glow = true},
  mythic = {border = Color3.fromRGB(255, 50, 50), glow = true},
}
local function applyRarity(frame, rarity)
  local config = RARITY_COLORS[rarity] or RARITY_COLORS.common
  -- Base border
  local stroke = frame:FindFirstChildOfClass("UIStroke")
  if stroke then stroke.Color = config.border stroke.Thickness = config.glow and 2 or 1 end

  if config.glow then
    -- Animated glow: pulsing stroke transparency
    if stroke then
      task.spawn(function()
        while frame.Parent do
          TweenService:Create(stroke, TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Transparency = 0}):Play()
          task.wait(0.8)
          TweenService:Create(stroke, TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Transparency = 0.4}):Play()
          task.wait(0.8)
        end
      end)
    end
    -- Shimmer gradient sweep
    local shimmer = Instance.new("UIGradient")
    shimmer.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, config.border),
      ColorSequenceKeypoint.new(0.45, Color3.new(math.min(config.border.R*1.4,1), math.min(config.border.G*1.4,1), math.min(config.border.B*1.4,1))),
      ColorSequenceKeypoint.new(0.55, Color3.new(math.min(config.border.R*1.4,1), math.min(config.border.G*1.4,1), math.min(config.border.B*1.4,1))),
      ColorSequenceKeypoint.new(1, config.border),
    })
    shimmer.Rotation = 30
    shimmer.Parent = frame
    task.spawn(function()
      while frame.Parent do
        shimmer.Offset = Vector2.new(-1, 0)
        TweenService:Create(shimmer, TweenInfo.new(1.5, Enum.EasingStyle.Linear), {Offset = Vector2.new(1, 0)}):Play()
        task.wait(4)
      end
    end)
  end
end

-- ═══ SCREEN TRANSITION (crossfade between panels) ═══
local function crossfade(oldFrame, newFrame, duration)
  duration = duration or 0.3
  if oldFrame then
    TweenService:Create(oldFrame, TweenInfo.new(duration/2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      BackgroundTransparency = 1
    }):Play()
    -- Fade all children
    for _, child in oldFrame:GetDescendants() do
      if child:IsA("GuiObject") then
        pcall(function()
          TweenService:Create(child, TweenInfo.new(duration/2), {BackgroundTransparency = 1}):Play()
        end)
      end
      if child:IsA("TextLabel") or child:IsA("TextButton") or child:IsA("TextBox") then
        pcall(function()
          TweenService:Create(child, TweenInfo.new(duration/2), {TextTransparency = 1}):Play()
        end)
      end
    end
    task.wait(duration/2)
    oldFrame.Visible = false
  end
  if newFrame then
    newFrame.Visible = true
    newFrame.BackgroundTransparency = 1
    for _, child in newFrame:GetDescendants() do
      if child:IsA("GuiObject") then pcall(function() child.BackgroundTransparency = 1 end) end
      if child:IsA("TextLabel") or child:IsA("TextButton") or child:IsA("TextBox") then pcall(function() child.TextTransparency = 1 end) end
    end
    TweenService:Create(newFrame, TweenInfo.new(duration/2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      BackgroundTransparency = 0
    }):Play()
    for _, child in newFrame:GetDescendants() do
      if child:IsA("GuiObject") then
        pcall(function()
          TweenService:Create(child, TweenInfo.new(duration/2), {BackgroundTransparency = 0}):Play()
        end)
      end
      if child:IsA("TextLabel") or child:IsA("TextButton") or child:IsA("TextBox") then
        pcall(function()
          TweenService:Create(child, TweenInfo.new(duration/2), {TextTransparency = 0}):Play()
        end)
      end
    end
  end
end

-- Legacy aliases
local TEXT_PRIMARY = TEXT
local function hoverBtn(btn, normalColor, hoverColor)
  btn.AutoButtonColor = false
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = hoverColor or CARD_HOVER}):Play()
    playSound(SFX.hover, 0.15)
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = normalColor or CARD}):Play()
  end)
end
`

// ─── Wrapper: ChangeHistoryService + LocalScript creation ───────────────────

function wrapTemplate(name: string, source: string): string {
  return `-- ${name} (LocalScript → StarterGui)
local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI ${name}")

local ls = Instance.new("LocalScript")
ls.Name = "ForjeAI_${name}"
ls.Source = [=[
${GUI_STYLE_BLOCK}
${source}
]=]

local sg = Instance.new("ScreenGui")
sg.Name = "ForjeAI_${name}"
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
sg.Parent = game:GetService("StarterGui")
ls.Parent = sg

if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SHOP GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface ShopGuiParams {
  items?: Array<{ name: string; price: number; icon?: string }>
  currencyName?: string
  columns?: number
}

export function shopGui(params: ShopGuiParams = {}): string {
  const currency = params.currencyName || 'Coins'
  const cols = params.columns || 3
  const items = params.items || [
    { name: 'Speed Boost', price: 100 },
    { name: 'Double Jump', price: 250 },
    { name: 'Gravity Coil', price: 500 },
    { name: 'Neon Trail', price: 750 },
    { name: 'Fly Pass', price: 1000 },
    { name: 'VIP Access', price: 2500 },
  ]
  const itemsLua = items.map(i => `{name="${i.name}",price=${i.price}}`).join(',')

  return wrapTemplate('ShopGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeShop"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Main frame (starts scaled down for animation)
local main = Instance.new("Frame")
main.Size = UDim2.new(0.6, 0, 0.7, 0)
main.Position = UDim2.new(0.2, 0, 0.15, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

-- Title bar
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 40)
title.BackgroundTransparency = 1
title.Text = "SHOP"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 24
title.Parent = main

-- Balance display
local balFrame = Instance.new("Frame")
balFrame.Size = UDim2.new(0.3, 0, 0, 32)
balFrame.Position = UDim2.new(0.35, 0, 0, 4)
balFrame.BackgroundColor3 = CARD
balFrame.Parent = main
addCorner(balFrame, 6)
local balLabel = Instance.new("TextLabel")
balLabel.Size = UDim2.new(1, 0, 1, 0)
balLabel.BackgroundTransparency = 1
balLabel.Text = "0 ${currency}"
balLabel.TextColor3 = GOLD
balLabel.Font = Enum.Font.GothamBold
balLabel.TextSize = 16
balLabel.Parent = balFrame

-- Complete toggle system: screen button + close X + keybind E
makeToggleSystem(screenGui, main, "SHOP", Enum.KeyCode.E,
  UDim2.new(0.6, 0, 0.7, 0), UDim2.new(0.2, 0, 0.15, 0))

-- Scroll frame for items
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -52)
scroll.Position = UDim2.new(0, 0, 0, 48)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(1/${cols}, -8, 0, 120)
grid.CellPadding = UDim2.new(0, 8, 0, 8)
grid.SortOrder = Enum.SortOrder.LayoutOrder
grid.Parent = scroll

-- Generate item cards
local items = {${itemsLua}}
for idx, item in ipairs(items) do
  local card = Instance.new("Frame")
  card.BackgroundColor3 = CARD
  card.LayoutOrder = idx
  card.Parent = scroll
  addCorner(card, 8)
  addStroke(card, BORDER)

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(1, 0, 0.4, 0)
  nameLabel.Position = UDim2.new(0, 0, 0.05, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = item.name
  nameLabel.TextColor3 = TEXT_PRIMARY
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 16
  nameLabel.Parent = card

  local buyBtn = Instance.new("TextButton")
  buyBtn.Size = UDim2.new(0.8, 0, 0, 32)
  buyBtn.Position = UDim2.new(0.1, 0, 1, -40)
  buyBtn.BackgroundColor3 = GOLD
  buyBtn.Text = item.price .. " ${currency}"
  buyBtn.TextColor3 = BG
  buyBtn.Font = Enum.Font.GothamBold
  buyBtn.TextSize = 14
  buyBtn.Parent = card
  addCorner(buyBtn, 6)
  hoverBtn(buyBtn, GOLD, Color3.fromRGB(235, 200, 80))

  buyBtn.MouseButton1Click:Connect(function()
    TweenService:Create(buyBtn, TweenInfo.new(0.1), {Size = UDim2.new(0.75, 0, 0, 30)}):Play()
    task.wait(0.1)
    TweenService:Create(buyBtn, TweenInfo.new(0.1), {Size = UDim2.new(0.8, 0, 0, 32)}):Play()
    -- Fire purchase remote
    local re = game.ReplicatedStorage:FindFirstChild("PurchaseItem")
    if re then re:FireServer(item.name) end
  end)
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.6, 0, 0.7, 0),
  Position = UDim2.new(0.2, 0, 0.15, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. INVENTORY GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface InventoryGuiParams {
  slots?: number
  columns?: number
}

export function inventoryGui(params: InventoryGuiParams = {}): string {
  const slots = params.slots || 20
  const cols = params.columns || 5

  return wrapTemplate('InventoryGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeInventory"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.5, 0, 0.65, 0)
main.Position = UDim2.new(0.25, 0, 0.175, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "INVENTORY"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

-- Toggle system: screen button + close X + keybind I
makeToggleSystem(screenGui, main, "INV", Enum.KeyCode.I,
  UDim2.new(0.5, 0, 0.65, 0), UDim2.new(0.25, 0, 0.175, 0),
  UDim2.new(1, -56, 1, -110))

-- Slot grid
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -48)
scroll.Position = UDim2.new(0, 0, 0, 44)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(1/${cols}, -6, 0, 70)
grid.CellPadding = UDim2.new(0, 6, 0, 6)
grid.SortOrder = Enum.SortOrder.LayoutOrder
grid.Parent = scroll

for i = 1, ${slots} do
  local slot = Instance.new("Frame")
  slot.BackgroundColor3 = CARD
  slot.LayoutOrder = i
  slot.Parent = scroll
  addCorner(slot, 6)
  addStroke(slot, BORDER)

  local numLabel = Instance.new("TextLabel")
  numLabel.Size = UDim2.new(1, 0, 1, 0)
  numLabel.BackgroundTransparency = 1
  numLabel.Text = ""
  numLabel.TextColor3 = TEXT_DIM
  numLabel.Font = Enum.Font.GothamMedium
  numLabel.TextSize = 12
  numLabel.Parent = slot

  -- Hover glow
  slot.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
      TweenService:Create(slot, TweenInfo.new(0.15), {BackgroundColor3 = CARD_HOVER}):Play()
    end
  end)
  slot.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
      TweenService:Create(slot, TweenInfo.new(0.15), {BackgroundColor3 = CARD}):Play()
    end
  end)
end

-- Tooltip frame (hidden by default)
local tooltip = Instance.new("Frame")
tooltip.Size = UDim2.new(0, 200, 0, 80)
tooltip.BackgroundColor3 = Color3.fromRGB(10, 12, 25)
tooltip.Visible = false
tooltip.ZIndex = 10
tooltip.Parent = screenGui
addCorner(tooltip, 8)
addStroke(tooltip, GOLD, 1)
local ttText = Instance.new("TextLabel")
ttText.Size = UDim2.new(1, -16, 1, -16)
ttText.Position = UDim2.new(0, 8, 0, 8)
ttText.BackgroundTransparency = 1
ttText.TextColor3 = TEXT_PRIMARY
ttText.Font = Enum.Font.GothamMedium
ttText.TextSize = 14
ttText.TextWrapped = true
ttText.TextXAlignment = Enum.TextXAlignment.Left
ttText.TextYAlignment = Enum.TextYAlignment.Top
ttText.ZIndex = 11
ttText.Parent = tooltip

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.5, 0, 0.65, 0), Position = UDim2.new(0.25, 0, 0.175, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HEALTH BAR GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface HealthBarGuiParams {
  maxHP?: number
  showNumbers?: boolean
}

export function healthBarGui(params: HealthBarGuiParams = {}): string {
  const maxHP = params.maxHP || 100
  const showNumbers = params.showNumbers !== false

  return wrapTemplate('HealthBarGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeHealthBar"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local maxHP = ${maxHP}
local currentHP = maxHP

-- Health bar container
local container = Instance.new("Frame")
container.Size = UDim2.new(0.25, 0, 0, 28)
container.Position = UDim2.new(0.375, 0, 0.92, 0)
container.BackgroundColor3 = BG
container.Parent = screenGui
addCorner(container, 8)
addStroke(container, BORDER)

-- Health fill bar
local fill = Instance.new("Frame")
fill.Size = UDim2.new(1, -4, 1, -4)
fill.Position = UDim2.new(0, 2, 0, 2)
fill.BackgroundColor3 = GREEN
fill.Parent = container
addCorner(fill, 6)

-- Gradient on health bar
local gradient = Instance.new("UIGradient")
gradient.Color = ColorSequence.new(Color3.fromRGB(50, 200, 80), Color3.fromRGB(30, 160, 60))
gradient.Parent = fill

${showNumbers ? `-- HP numbers
local hpText = Instance.new("TextLabel")
hpText.Size = UDim2.new(1, 0, 1, 0)
hpText.BackgroundTransparency = 1
hpText.Text = "${maxHP}/${maxHP}"
hpText.TextColor3 = TEXT_PRIMARY
hpText.Font = Enum.Font.GothamBold
hpText.TextSize = 14
hpText.ZIndex = 2
hpText.Parent = container` : ''}

-- Damage flash overlay
local flash = Instance.new("Frame")
flash.Size = UDim2.new(1, 0, 1, 0)
flash.BackgroundColor3 = RED
flash.BackgroundTransparency = 1
flash.ZIndex = 3
flash.Parent = container
addCorner(flash, 8)

-- Update function
local function updateHP(newHP)
  currentHP = math.clamp(newHP, 0, maxHP)
  local pct = currentHP / maxHP

  -- Smooth tween to new width
  TweenService:Create(fill, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Size = UDim2.new(pct * (1 - 4/container.AbsoluteSize.X), 0, 1, -4)
  }):Play()

  -- Color shifts: green → yellow → red
  local color
  if pct > 0.6 then color = GREEN
  elseif pct > 0.3 then color = Color3.fromRGB(220, 180, 40)
  else color = RED end
  TweenService:Create(fill, TweenInfo.new(0.3), {BackgroundColor3 = color}):Play()

  ${showNumbers ? `hpText.Text = currentHP .. "/" .. maxHP` : ''}

  -- Flash on damage
  flash.BackgroundTransparency = 0.3
  TweenService:Create(flash, TweenInfo.new(0.2), {BackgroundTransparency = 1}):Play()

  -- Low health pulse
  if pct <= 0.25 then
    task.spawn(function()
      while currentHP/maxHP <= 0.25 and container.Parent do
        TweenService:Create(fill, TweenInfo.new(0.5), {BackgroundTransparency = 0.3}):Play()
        task.wait(0.5)
        TweenService:Create(fill, TweenInfo.new(0.5), {BackgroundTransparency = 0}):Play()
        task.wait(0.5)
      end
    end)
  end
end

-- Listen for damage events
local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
if humanoid then
  humanoid.HealthChanged:Connect(function(health)
    updateHP(math.floor(health))
  end)
  updateHP(math.floor(humanoid.Health))
end
player.CharacterAdded:Connect(function(char)
  local h = char:WaitForChild("Humanoid")
  h.HealthChanged:Connect(function(health) updateHP(math.floor(health)) end)
  updateHP(math.floor(h.Health))
end)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HUD GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface HudGuiParams {
  stats?: Array<{ name: string; icon?: string; color?: string }>
}

export function hudGui(params: HudGuiParams = {}): string {
  const stats = params.stats || [
    { name: 'Coins', icon: '', color: '212,175,55' },
    { name: 'Level', icon: '', color: '160,80,255' },
  ]
  const statsLua = stats.map(s => `{name="${s.name}",color=Color3.fromRGB(${s.color || '212,175,55'})}`).join(',')

  return wrapTemplate('HudGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeHUD"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Top bar
local topBar = Instance.new("Frame")
topBar.Size = UDim2.new(1, 0, 0, 44)
topBar.Position = UDim2.new(0, 0, 0, 0)
topBar.BackgroundColor3 = BG
topBar.BackgroundTransparency = 0.15
topBar.BorderSizePixel = 0
topBar.Parent = screenGui
local grad = Instance.new("UIGradient")
grad.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0),
  NumberSequenceKeypoint.new(0.8, 0),
  NumberSequenceKeypoint.new(1, 1)
})
grad.Parent = topBar

-- Stats display
local statsData = {${statsLua}}
local xOff = 12
for _, stat in ipairs(statsData) do
  local frame = Instance.new("Frame")
  frame.Size = UDim2.new(0, 120, 0, 32)
  frame.Position = UDim2.new(0, xOff, 0, 6)
  frame.BackgroundColor3 = CARD
  frame.Parent = topBar
  addCorner(frame, 6)

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -8, 1, 0)
  label.Position = UDim2.new(0, 4, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = stat.name .. ": 0"
  label.TextColor3 = stat.color
  label.Font = Enum.Font.GothamBold
  label.TextSize = 15
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = frame

  xOff = xOff + 130
end

-- XP bar (below top bar)
local xpContainer = Instance.new("Frame")
xpContainer.Size = UDim2.new(0.4, 0, 0, 8)
xpContainer.Position = UDim2.new(0.3, 0, 0, 46)
xpContainer.BackgroundColor3 = CARD
xpContainer.Parent = screenGui
addCorner(xpContainer, 4)

local xpFill = Instance.new("Frame")
xpFill.Size = UDim2.new(0.35, 0, 1, -2)
xpFill.Position = UDim2.new(0, 1, 0, 1)
xpFill.BackgroundColor3 = Color3.fromRGB(160, 80, 255)
xpFill.Parent = xpContainer
addCorner(xpFill, 3)

-- Settings gear button (top right)
local settingsBtn = Instance.new("TextButton")
settingsBtn.Size = UDim2.new(0, 36, 0, 36)
settingsBtn.Position = UDim2.new(1, -48, 0, 4)
settingsBtn.BackgroundColor3 = CARD
settingsBtn.Text = "⚙"
settingsBtn.TextSize = 20
settingsBtn.TextColor3 = TEXT_DIM
settingsBtn.Font = Enum.Font.GothamBold
settingsBtn.Parent = topBar
addCorner(settingsBtn, 8)
hoverBtn(settingsBtn, CARD, CARD_HOVER)

-- Update stats from leaderstats
local function refreshStats()
  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  for i, stat in ipairs(statsData) do
    local sv = ls:FindFirstChild(stat.name)
    if sv then
      local frame = topBar:GetChildren()[i+1] -- skip UIGradient
      if frame and frame:IsA("Frame") then
        local lbl = frame:FindFirstChildOfClass("TextLabel")
        if lbl then lbl.Text = stat.name .. ": " .. tostring(sv.Value) end
      end
    end
  end
end

-- Poll leaderstats changes
task.spawn(function()
  while screenGui.Parent do
    refreshStats()
    task.wait(0.5)
  end
end)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SETTINGS GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface SettingsGuiParams {
  options?: Array<{ name: string; type: 'toggle' | 'slider'; default?: boolean | number }>
}

export function settingsGui(params: SettingsGuiParams = {}): string {
  const options = params.options || [
    { name: 'Music', type: 'toggle' as const, default: true },
    { name: 'SFX', type: 'toggle' as const, default: true },
    { name: 'Volume', type: 'slider' as const, default: 0.7 },
    { name: 'Shadows', type: 'toggle' as const, default: true },
    { name: 'Particles', type: 'toggle' as const, default: true },
  ]
  const optionsLua = options.map(o =>
    o.type === 'toggle'
      ? `{name="${o.name}",type="toggle",default=${o.default !== false}}`
      : `{name="${o.name}",type="slider",default=${o.default ?? 0.7}}`
  ).join(',')

  return wrapTemplate('SettingsGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeSettings"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.35, 0, 0.55, 0)
main.Position = UDim2.new(0.325, 0, 0.225, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 16)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "SETTINGS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -48)
scroll.Position = UDim2.new(0, 0, 0, 44)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 3
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 8)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = scroll

local settings = {${optionsLua}}
for idx, opt in ipairs(settings) do
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1, 0, 0, 40)
  row.BackgroundColor3 = CARD
  row.LayoutOrder = idx
  row.Parent = scroll
  addCorner(row, 6)

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(0.5, 0, 1, 0)
  label.Position = UDim2.new(0, 12, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = opt.name
  label.TextColor3 = TEXT_PRIMARY
  label.Font = Enum.Font.GothamMedium
  label.TextSize = 15
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = row

  if opt.type == "toggle" then
    local togBg = Instance.new("Frame")
    togBg.Size = UDim2.new(0, 44, 0, 24)
    togBg.Position = UDim2.new(1, -56, 0.5, -12)
    togBg.BackgroundColor3 = opt.default and GREEN or Color3.fromRGB(60, 60, 70)
    togBg.Parent = row
    addCorner(togBg, 12)

    local togDot = Instance.new("Frame")
    togDot.Size = UDim2.new(0, 20, 0, 20)
    togDot.Position = opt.default and UDim2.new(1, -22, 0, 2) or UDim2.new(0, 2, 0, 2)
    togDot.BackgroundColor3 = TEXT_PRIMARY
    togDot.Parent = togBg
    addCorner(togDot, 10)

    local on = opt.default
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(1, 0, 1, 0)
    btn.BackgroundTransparency = 1
    btn.Text = ""
    btn.Parent = togBg
    btn.MouseButton1Click:Connect(function()
      on = not on
      TweenService:Create(togDot, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
        Position = on and UDim2.new(1, -22, 0, 2) or UDim2.new(0, 2, 0, 2)
      }):Play()
      TweenService:Create(togBg, TweenInfo.new(0.2), {
        BackgroundColor3 = on and GREEN or Color3.fromRGB(60, 60, 70)
      }):Play()
    end)
  end
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.35, 0, 0.55, 0), Position = UDim2.new(0.325, 0, 0.225, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. QUEST LOG GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuestLogGuiParams {
  quests?: Array<{ name: string; description: string; reward: number }>
}

export function questLogGui(params: QuestLogGuiParams = {}): string {
  const quests = params.quests || [
    { name: 'First Steps', description: 'Defeat 5 enemies', reward: 100 },
    { name: 'Explorer', description: 'Visit all zones', reward: 250 },
    { name: 'Collector', description: 'Collect 50 items', reward: 500 },
  ]
  const questsLua = quests.map(q => `{name="${q.name}",desc="${q.description}",reward=${q.reward},progress=0,goal=1,done=false}`).join(',')

  return wrapTemplate('QuestLogGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeQuestLog"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.45, 0, 0.6, 0)
main.Position = UDim2.new(0.275, 0, 0.2, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "QUESTS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -48)
scroll.Position = UDim2.new(0, 0, 0, 44)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 8)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = scroll

local quests = {${questsLua}}
for idx, quest in ipairs(quests) do
  local card = Instance.new("Frame")
  card.Size = UDim2.new(1, 0, 0, 80)
  card.BackgroundColor3 = CARD
  card.LayoutOrder = idx
  card.Parent = scroll
  addCorner(card, 8)
  addStroke(card, BORDER)
  addPadding(card, 10)

  local qName = Instance.new("TextLabel")
  qName.Size = UDim2.new(0.7, 0, 0, 20)
  qName.BackgroundTransparency = 1
  qName.Text = quest.name
  qName.TextColor3 = GOLD
  qName.Font = Enum.Font.GothamBold
  qName.TextSize = 16
  qName.TextXAlignment = Enum.TextXAlignment.Left
  qName.Parent = card

  local qDesc = Instance.new("TextLabel")
  qDesc.Size = UDim2.new(0.7, 0, 0, 16)
  qDesc.Position = UDim2.new(0, 0, 0, 22)
  qDesc.BackgroundTransparency = 1
  qDesc.Text = quest.desc
  qDesc.TextColor3 = TEXT_DIM
  qDesc.Font = Enum.Font.GothamMedium
  qDesc.TextSize = 13
  qDesc.TextXAlignment = Enum.TextXAlignment.Left
  qDesc.Parent = card

  -- Reward badge
  local rewardBadge = Instance.new("Frame")
  rewardBadge.Size = UDim2.new(0, 80, 0, 24)
  rewardBadge.Position = UDim2.new(1, -80, 0, 0)
  rewardBadge.BackgroundColor3 = Color3.fromRGB(30, 35, 55)
  rewardBadge.Parent = card
  addCorner(rewardBadge, 6)
  local rewardText = Instance.new("TextLabel")
  rewardText.Size = UDim2.new(1, 0, 1, 0)
  rewardText.BackgroundTransparency = 1
  rewardText.Text = quest.reward .. " Coins"
  rewardText.TextColor3 = GOLD
  rewardText.Font = Enum.Font.GothamBold
  rewardText.TextSize = 12
  rewardText.Parent = rewardBadge

  -- Progress bar
  local progBg = Instance.new("Frame")
  progBg.Size = UDim2.new(0.7, 0, 0, 8)
  progBg.Position = UDim2.new(0, 0, 1, -14)
  progBg.BackgroundColor3 = Color3.fromRGB(35, 38, 55)
  progBg.Parent = card
  addCorner(progBg, 4)
  local progFill = Instance.new("Frame")
  progFill.Size = UDim2.new(quest.progress/quest.goal, 0, 1, -2)
  progFill.Position = UDim2.new(0, 1, 0, 1)
  progFill.BackgroundColor3 = GOLD
  progFill.Parent = progBg
  addCorner(progFill, 3)
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.45, 0, 0.6, 0), Position = UDim2.new(0.275, 0, 0.2, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. LEADERBOARD GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaderboardGuiParams {
  statName?: string
}

export function leaderboardGui(params: LeaderboardGuiParams = {}): string {
  const stat = params.statName || 'Coins'

  return wrapTemplate('LeaderboardGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeLeaderboard"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0, 220, 0.5, 0)
main.Position = UDim2.new(1, -232, 0.25, 0)
main.BackgroundColor3 = BG
main.BackgroundTransparency = 0.1
main.Parent = screenGui
addCorner(main, 10)
addStroke(main, GOLD_DIM, 1)
addPadding(main, 8)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 30)
title.BackgroundTransparency = 1
title.Text = "TOP ${stat.toUpperCase()}"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 16
title.Parent = main

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -36)
scroll.Position = UDim2.new(0, 0, 0, 34)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 3
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 4)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = scroll

local rankColors = {GOLD, Color3.fromRGB(180,180,195), Color3.fromRGB(180,120,60)}

-- Populate from players in server
local function refresh()
  for _, c in scroll:GetChildren() do if c:IsA("Frame") then c:Destroy() end end
  local entries = {}
  for _, p in Players:GetPlayers() do
    local ls = p:FindFirstChild("leaderstats")
    local sv = ls and ls:FindFirstChild("${stat}")
    if sv then table.insert(entries, {name=p.Name, val=sv.Value}) end
  end
  table.sort(entries, function(a,b) return a.val > b.val end)
  for i, entry in ipairs(entries) do
    if i > 15 then break end
    local row = Instance.new("Frame")
    row.Size = UDim2.new(1, 0, 0, 28)
    row.BackgroundColor3 = entry.name == player.Name and Color3.fromRGB(30, 35, 55) or CARD
    row.LayoutOrder = i
    row.Parent = scroll
    addCorner(row, 4)

    local rank = Instance.new("TextLabel")
    rank.Size = UDim2.new(0, 24, 1, 0)
    rank.BackgroundTransparency = 1
    rank.Text = "#" .. i
    rank.TextColor3 = rankColors[i] or TEXT_DIM
    rank.Font = Enum.Font.GothamBold
    rank.TextSize = 13
    rank.Parent = row

    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(0.55, 0, 1, 0)
    name.Position = UDim2.new(0, 26, 0, 0)
    name.BackgroundTransparency = 1
    name.Text = entry.name
    name.TextColor3 = TEXT_PRIMARY
    name.Font = Enum.Font.GothamMedium
    name.TextSize = 13
    name.TextXAlignment = Enum.TextXAlignment.Left
    name.TextTruncate = Enum.TextTruncate.AtEnd
    name.Parent = row

    local val = Instance.new("TextLabel")
    val.Size = UDim2.new(0.3, 0, 1, 0)
    val.Position = UDim2.new(0.7, 0, 0, 0)
    val.BackgroundTransparency = 1
    val.Text = tostring(entry.val)
    val.TextColor3 = GOLD
    val.Font = Enum.Font.GothamBold
    val.TextSize = 13
    val.Parent = row
  end
end

refresh()
-- Auto-refresh every 5 seconds
task.spawn(function()
  while screenGui.Parent do task.wait(5) refresh() end
end)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. DIALOG GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface DialogGuiParams {
  npcName?: string
  dialogTree?: Array<{ text: string; choices?: string[] }>
}

export function dialogGui(params: DialogGuiParams = {}): string {
  const npcName = params.npcName || 'Shopkeeper'
  const dialog = params.dialogTree || [
    { text: 'Welcome, traveler! What brings you here?', choices: ['I want to buy something', 'Just looking around', 'Goodbye'] },
    { text: 'Take a look at my finest wares!', choices: ['Thanks!'] },
    { text: 'Feel free to browse.', choices: ['Thanks!'] },
  ]
  const dialogLua = dialog.map(d =>
    `{text="${d.text}",choices={${(d.choices || ['OK']).map(c => `"${c}"`).join(',')}}}`
  ).join(',')

  return wrapTemplate('DialogGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeDialog"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Dialog box at bottom of screen
local main = Instance.new("Frame")
main.Size = UDim2.new(0.6, 0, 0, 160)
main.Position = UDim2.new(0.2, 0, 1, -180)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 14)

-- NPC name badge
local nameBadge = Instance.new("Frame")
nameBadge.Size = UDim2.new(0, 140, 0, 28)
nameBadge.Position = UDim2.new(0, 10, 0, -18)
nameBadge.BackgroundColor3 = GOLD
nameBadge.Parent = main
addCorner(nameBadge, 6)
local nameLabel = Instance.new("TextLabel")
nameLabel.Size = UDim2.new(1, 0, 1, 0)
nameLabel.BackgroundTransparency = 1
nameLabel.Text = "${npcName}"
nameLabel.TextColor3 = BG
nameLabel.Font = Enum.Font.GothamBold
nameLabel.TextSize = 15
nameLabel.Parent = nameBadge

-- Dialog text with typewriter effect
local dialogText = Instance.new("TextLabel")
dialogText.Size = UDim2.new(1, 0, 0, 50)
dialogText.Position = UDim2.new(0, 0, 0, 16)
dialogText.BackgroundTransparency = 1
dialogText.Text = ""
dialogText.TextColor3 = TEXT_PRIMARY
dialogText.Font = Enum.Font.GothamMedium
dialogText.TextSize = 16
dialogText.TextWrapped = true
dialogText.TextXAlignment = Enum.TextXAlignment.Left
dialogText.TextYAlignment = Enum.TextYAlignment.Top
dialogText.Parent = main

-- Choices container
local choicesFrame = Instance.new("Frame")
choicesFrame.Size = UDim2.new(1, 0, 0, 36)
choicesFrame.Position = UDim2.new(0, 0, 1, -44)
choicesFrame.BackgroundTransparency = 1
choicesFrame.Parent = main
local choiceLayout = Instance.new("UIListLayout")
choiceLayout.FillDirection = Enum.FillDirection.Horizontal
choiceLayout.Padding = UDim.new(0, 8)
choiceLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
choiceLayout.Parent = choicesFrame

local dialogData = {${dialogLua}}
local currentIdx = 1

-- Typewriter effect
local function typewrite(text, label)
  label.Text = ""
  for i = 1, #text do
    label.Text = string.sub(text, 1, i)
    task.wait(0.03)
  end
end

-- Show dialog step
local function showStep(idx)
  if idx > #dialogData then
    TweenService:Create(main, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
      Position = UDim2.new(0.2, 0, 1, 20)
    }):Play()
    task.wait(0.3)
    screenGui:Destroy()
    return
  end

  local step = dialogData[idx]
  -- Clear old choices
  for _, c in choicesFrame:GetChildren() do if c:IsA("TextButton") then c:Destroy() end end

  -- Typewriter the text
  task.spawn(function()
    typewrite(step.text, dialogText)
    -- Show choices after text finishes
    for ci, choice in ipairs(step.choices) do
      local btn = Instance.new("TextButton")
      btn.Size = UDim2.new(0, 160, 0, 32)
      btn.BackgroundColor3 = CARD
      btn.Text = choice
      btn.TextColor3 = GOLD
      btn.Font = Enum.Font.GothamBold
      btn.TextSize = 14
      btn.Parent = choicesFrame
      addCorner(btn, 6)
      addStroke(btn, GOLD_DIM)
      hoverBtn(btn, CARD, CARD_HOVER)

      -- Slide in each choice
      btn.Position = UDim2.new(0, 0, 1, 20)
      TweenService:Create(btn, TweenInfo.new(0.2 + ci*0.05, Enum.EasingStyle.Back), {Position = UDim2.new(0, 0, 0, 0)}):Play()

      btn.MouseButton1Click:Connect(function()
        showStep(idx + ci)
      end)
    end
  end)
end

-- Slide in animation
main.Position = UDim2.new(0.2, 0, 1, 20)
TweenService:Create(main, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Position = UDim2.new(0.2, 0, 1, -180)
}):Play()
task.wait(0.4)
showStep(1)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. NOTIFICATION/TOAST GUI
// ═══════════════════════════════════════════════════════════════════════════════

export function notificationGui(): string {
  return wrapTemplate('NotificationGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeNotifications"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local container = Instance.new("Frame")
container.Size = UDim2.new(0, 300, 1, 0)
container.Position = UDim2.new(1, -312, 0, 0)
container.BackgroundTransparency = 1
container.Parent = screenGui

local list = Instance.new("UIListLayout")
list.VerticalAlignment = Enum.VerticalAlignment.Bottom
list.Padding = UDim.new(0, 6)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = container

local orderCounter = 0

-- Public function: show a toast notification
local function notify(text, color, duration)
  color = color or GOLD
  duration = duration or 4
  orderCounter = orderCounter + 1

  local toast = Instance.new("Frame")
  toast.Size = UDim2.new(1, 0, 0, 50)
  toast.BackgroundColor3 = BG
  toast.LayoutOrder = -orderCounter
  toast.Parent = container
  addCorner(toast, 8)
  addStroke(toast, color, 1)
  addPadding(toast, 10)

  -- Accent bar on left
  local accent = Instance.new("Frame")
  accent.Size = UDim2.new(0, 3, 0.7, 0)
  accent.Position = UDim2.new(0, 4, 0.15, 0)
  accent.BackgroundColor3 = color
  accent.Parent = toast
  addCorner(accent, 2)

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -20, 1, 0)
  label.Position = UDim2.new(0, 14, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = text
  label.TextColor3 = TEXT_PRIMARY
  label.Font = Enum.Font.GothamMedium
  label.TextSize = 14
  label.TextWrapped = true
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = toast

  -- Slide in from right
  toast.Position = UDim2.new(1, 0, 0, 0)
  TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back), {Position = UDim2.new(0, 0, 0, 0)}):Play()

  -- Auto-dismiss
  task.delay(duration, function()
    TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Position = UDim2.new(1, 20, 0, 0),
      BackgroundTransparency = 1
    }):Play()
    task.wait(0.3)
    if toast.Parent then toast:Destroy() end
  end)

  -- Cap at 5 visible
  local children = {}
  for _, c in container:GetChildren() do if c:IsA("Frame") then table.insert(children, c) end end
  if #children > 5 then children[#children]:Destroy() end
end

-- Listen for notification events
local re = game.ReplicatedStorage:FindFirstChild("Notification")
if re then
  re.OnClientEvent:Connect(function(text, color)
    notify(text, color)
  end)
end

-- Demo notifications
task.wait(1)
notify("Welcome to the game!", GOLD)
task.wait(2)
notify("Tip: Press E near buildings to interact", Color3.fromRGB(80, 160, 255))
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. LOADING SCREEN GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface LoadingScreenGuiParams {
  gameName?: string
  tips?: string[]
}

export function loadingScreenGui(params: LoadingScreenGuiParams = {}): string {
  const gameName = params.gameName || 'My Game'
  const tips = params.tips || ['Explore all zones for hidden rewards!', 'Trade with friends for rare items', 'Daily login = free rewards', 'Join our group for exclusive perks']
  const tipsLua = tips.map(t => `"${t}"`).join(',')

  return wrapTemplate('LoadingScreenGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeLoadingScreen"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.DisplayOrder = 999
screenGui.Parent = playerGui

local bg = Instance.new("Frame")
bg.Size = UDim2.new(1, 0, 1, 0)
bg.BackgroundColor3 = BG
bg.Parent = screenGui

-- Game title
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 60)
title.Position = UDim2.new(0, 0, 0.3, 0)
title.BackgroundTransparency = 1
title.Text = "${gameName.toUpperCase()}"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 42
title.Parent = bg

-- Loading bar
local barBg = Instance.new("Frame")
barBg.Size = UDim2.new(0.4, 0, 0, 8)
barBg.Position = UDim2.new(0.3, 0, 0.55, 0)
barBg.BackgroundColor3 = CARD
barBg.Parent = bg
addCorner(barBg, 4)

local barFill = Instance.new("Frame")
barFill.Size = UDim2.new(0, 0, 1, -2)
barFill.Position = UDim2.new(0, 1, 0, 1)
barFill.BackgroundColor3 = GOLD
barFill.Parent = barBg
addCorner(barFill, 3)

-- Loading text
local loadText = Instance.new("TextLabel")
loadText.Size = UDim2.new(1, 0, 0, 20)
loadText.Position = UDim2.new(0, 0, 0.57, 0)
loadText.BackgroundTransparency = 1
loadText.Text = "Loading..."
loadText.TextColor3 = TEXT_DIM
loadText.Font = Enum.Font.GothamMedium
loadText.TextSize = 14
loadText.Parent = bg

-- Rotating tips
local tips = {${tipsLua}}
local tipLabel = Instance.new("TextLabel")
tipLabel.Size = UDim2.new(0.6, 0, 0, 30)
tipLabel.Position = UDim2.new(0.2, 0, 0.85, 0)
tipLabel.BackgroundTransparency = 1
tipLabel.Text = "TIP: " .. tips[1]
tipLabel.TextColor3 = TEXT_DIM
tipLabel.Font = Enum.Font.GothamMedium
tipLabel.TextSize = 14
tipLabel.Parent = bg

-- Animate loading bar and cycle tips
task.spawn(function()
  local tipIdx = 1
  for pct = 0, 100, 2 do
    TweenService:Create(barFill, TweenInfo.new(0.1), {Size = UDim2.new(pct/100, -2, 1, -2)}):Play()
    loadText.Text = "Loading... " .. pct .. "%"
    if pct % 20 == 0 then
      tipIdx = tipIdx % #tips + 1
      tipLabel.Text = "TIP: " .. tips[tipIdx]
    end
    task.wait(0.05)
  end
  loadText.Text = "Ready!"

  -- Fade out
  task.wait(0.5)
  TweenService:Create(bg, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {BackgroundTransparency = 1}):Play()
  TweenService:Create(title, TweenInfo.new(0.5), {TextTransparency = 1}):Play()
  TweenService:Create(tipLabel, TweenInfo.new(0.3), {TextTransparency = 1}):Play()
  TweenService:Create(loadText, TweenInfo.new(0.3), {TextTransparency = 1}):Play()
  task.wait(1)
  screenGui:Destroy()
end)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. TRADE GUI
// ═══════════════════════════════════════════════════════════════════════════════

export function tradeGui(): string {
  return wrapTemplate('TradeGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeTrade"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.65, 0, 0.6, 0)
main.Position = UDim2.new(0.175, 0, 0.2, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "TRADE"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

-- Two panels (your offer vs their offer)
for side = 0, 1 do
  local panel = Instance.new("Frame")
  panel.Size = UDim2.new(0.48, 0, 0.7, 0)
  panel.Position = UDim2.new(side * 0.52, 0, 0, 50)
  panel.BackgroundColor3 = CARD
  panel.Parent = main
  addCorner(panel, 8)
  addPadding(panel, 8)

  local panelTitle = Instance.new("TextLabel")
  panelTitle.Size = UDim2.new(1, 0, 0, 24)
  panelTitle.BackgroundTransparency = 1
  panelTitle.Text = side == 0 and "YOUR OFFER" or "THEIR OFFER"
  panelTitle.TextColor3 = side == 0 and GREEN or Color3.fromRGB(80, 160, 255)
  panelTitle.Font = Enum.Font.GothamBold
  panelTitle.TextSize = 14
  panelTitle.Parent = panel

  -- 6 item slots
  local grid = Instance.new("UIGridLayout")
  grid.CellSize = UDim2.new(0.3, -4, 0, 50)
  grid.CellPadding = UDim2.new(0, 4, 0, 4)
  grid.Parent = panel

  for i = 1, 6 do
    local slot = Instance.new("Frame")
    slot.BackgroundColor3 = Color3.fromRGB(20, 22, 38)
    slot.LayoutOrder = i + 1
    slot.Parent = panel
    addCorner(slot, 6)
    addStroke(slot, BORDER)
  end
end

-- Confirm button with countdown
local confirmBtn = Instance.new("TextButton")
confirmBtn.Size = UDim2.new(0.3, 0, 0, 40)
confirmBtn.Position = UDim2.new(0.35, 0, 1, -52)
confirmBtn.BackgroundColor3 = GREEN
confirmBtn.Text = "CONFIRM TRADE"
confirmBtn.TextColor3 = BG
confirmBtn.Font = Enum.Font.GothamBold
confirmBtn.TextSize = 16
confirmBtn.Parent = main
addCorner(confirmBtn, 8)
hoverBtn(confirmBtn, GREEN, Color3.fromRGB(60, 220, 100))

confirmBtn.MouseButton1Click:Connect(function()
  confirmBtn.Active = false
  for i = 3, 1, -1 do
    confirmBtn.Text = "Confirming... " .. i
    task.wait(1)
  end
  confirmBtn.Text = "TRADE COMPLETE!"
  confirmBtn.BackgroundColor3 = GOLD
  task.wait(1.5)
  screenGui:Destroy()
end)

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.65, 0, 0.6, 0), Position = UDim2.new(0.175, 0, 0.2, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. PET INVENTORY GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface PetInventoryGuiParams {
  pets?: Array<{ name: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' }>
}

export function petInventoryGui(params: PetInventoryGuiParams = {}): string {
  const pets = params.pets || [
    { name: 'Cat', rarity: 'common' as const },
    { name: 'Dragon', rarity: 'legendary' as const },
    { name: 'Unicorn', rarity: 'epic' as const },
    { name: 'Dog', rarity: 'common' as const },
    { name: 'Phoenix', rarity: 'rare' as const },
  ]
  const petsLua = pets.map(p => `{name="${p.name}",rarity="${p.rarity}"}`).join(',')

  return wrapTemplate('PetInventoryGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjePets"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local rarityColors = {
  common = TEXT_DIM,
  rare = Color3.fromRGB(80, 160, 255),
  epic = Color3.fromRGB(180, 80, 255),
  legendary = GOLD,
}
local rarityGlow = {
  common = BORDER,
  rare = Color3.fromRGB(40, 80, 150),
  epic = Color3.fromRGB(100, 40, 150),
  legendary = Color3.fromRGB(130, 110, 30),
}

local main = Instance.new("Frame")
main.Size = UDim2.new(0.55, 0, 0.65, 0)
main.Position = UDim2.new(0.225, 0, 0.175, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "PETS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -48)
scroll.Position = UDim2.new(0, 0, 0, 44)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main

local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(0.24, -6, 0, 100)
grid.CellPadding = UDim2.new(0, 6, 0, 6)
grid.Parent = scroll

local pets = {${petsLua}}
for idx, pet in ipairs(pets) do
  local card = Instance.new("Frame")
  card.BackgroundColor3 = CARD
  card.LayoutOrder = idx
  card.Parent = scroll
  addCorner(card, 8)
  addStroke(card, rarityGlow[pet.rarity] or BORDER, 2)

  -- Pet icon placeholder (colored circle)
  local icon = Instance.new("Frame")
  icon.Size = UDim2.new(0, 40, 0, 40)
  icon.Position = UDim2.new(0.5, -20, 0, 8)
  icon.BackgroundColor3 = rarityColors[pet.rarity] or TEXT_DIM
  icon.Parent = card
  addCorner(icon, 20)

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(1, 0, 0, 18)
  nameLabel.Position = UDim2.new(0, 0, 0, 52)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = pet.name
  nameLabel.TextColor3 = TEXT_PRIMARY
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 13
  nameLabel.Parent = card

  local rarityLabel = Instance.new("TextLabel")
  rarityLabel.Size = UDim2.new(1, 0, 0, 14)
  rarityLabel.Position = UDim2.new(0, 0, 0, 68)
  rarityLabel.BackgroundTransparency = 1
  rarityLabel.Text = string.upper(pet.rarity)
  rarityLabel.TextColor3 = rarityColors[pet.rarity] or TEXT_DIM
  rarityLabel.Font = Enum.Font.GothamBold
  rarityLabel.TextSize = 10
  rarityLabel.Parent = card

  -- Equip button
  local equipBtn = Instance.new("TextButton")
  equipBtn.Size = UDim2.new(0.8, 0, 0, 20)
  equipBtn.Position = UDim2.new(0.1, 0, 1, -24)
  equipBtn.BackgroundColor3 = rarityColors[pet.rarity] or CARD_HOVER
  equipBtn.Text = "Equip"
  equipBtn.TextColor3 = BG
  equipBtn.Font = Enum.Font.GothamBold
  equipBtn.TextSize = 11
  equipBtn.Parent = card
  addCorner(equipBtn, 4)
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.55, 0, 0.65, 0), Position = UDim2.new(0.225, 0, 0.175, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. REBIRTH GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface RebirthGuiParams {
  cost?: number
  multiplier?: number
}

export function rebirthGui(params: RebirthGuiParams = {}): string {
  const cost = params.cost || 1000000
  const mult = params.multiplier || 2

  return wrapTemplate('RebirthGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeRebirth"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.4, 0, 0.45, 0)
main.Position = UDim2.new(0.3, 0, 0.275, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD, 2)
addPadding(main, 16)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "REBIRTH"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 26
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

-- Before/after comparison
local comparison = Instance.new("Frame")
comparison.Size = UDim2.new(1, 0, 0, 80)
comparison.Position = UDim2.new(0, 0, 0, 50)
comparison.BackgroundTransparency = 1
comparison.Parent = main

for i, side in ipairs({"BEFORE", "AFTER"}) do
  local panel = Instance.new("Frame")
  panel.Size = UDim2.new(0.45, 0, 1, 0)
  panel.Position = UDim2.new((i-1)*0.55, 0, 0, 0)
  panel.BackgroundColor3 = CARD
  panel.Parent = comparison
  addCorner(panel, 8)
  addPadding(panel, 8)

  local sideLabel = Instance.new("TextLabel")
  sideLabel.Size = UDim2.new(1, 0, 0, 18)
  sideLabel.BackgroundTransparency = 1
  sideLabel.Text = side
  sideLabel.TextColor3 = i==1 and TEXT_DIM or GREEN
  sideLabel.Font = Enum.Font.GothamBold
  sideLabel.TextSize = 12
  sideLabel.Parent = panel

  local multLabel = Instance.new("TextLabel")
  multLabel.Size = UDim2.new(1, 0, 0, 30)
  multLabel.Position = UDim2.new(0, 0, 0, 22)
  multLabel.BackgroundTransparency = 1
  multLabel.Text = i==1 and "1x Multiplier" or "${mult}x Multiplier"
  multLabel.TextColor3 = i==1 and TEXT_PRIMARY or GOLD
  multLabel.Font = Enum.Font.GothamBold
  multLabel.TextSize = 18
  multLabel.Parent = panel
end

-- Arrow between panels
local arrow = Instance.new("TextLabel")
arrow.Size = UDim2.new(0.1, 0, 0, 30)
arrow.Position = UDim2.new(0.45, 0, 0, 25)
arrow.BackgroundTransparency = 1
arrow.Text = "→"
arrow.TextColor3 = GOLD
arrow.Font = Enum.Font.GothamBold
arrow.TextSize = 28
arrow.Parent = comparison

-- Cost display
local costLabel = Instance.new("TextLabel")
costLabel.Size = UDim2.new(1, 0, 0, 24)
costLabel.Position = UDim2.new(0, 0, 0, 140)
costLabel.BackgroundTransparency = 1
costLabel.Text = "Cost: ${cost.toLocaleString()} Coins"
costLabel.TextColor3 = TEXT_DIM
costLabel.Font = Enum.Font.GothamMedium
costLabel.TextSize = 15
costLabel.Parent = main

-- Rebirth button with confirmation countdown
local rebirthBtn = Instance.new("TextButton")
rebirthBtn.Size = UDim2.new(0.6, 0, 0, 44)
rebirthBtn.Position = UDim2.new(0.2, 0, 1, -56)
rebirthBtn.BackgroundColor3 = GOLD
rebirthBtn.Text = "REBIRTH NOW"
rebirthBtn.TextColor3 = BG
rebirthBtn.Font = Enum.Font.GothamBold
rebirthBtn.TextSize = 18
rebirthBtn.Parent = main
addCorner(rebirthBtn, 8)
hoverBtn(rebirthBtn, GOLD, Color3.fromRGB(235, 200, 80))

local confirming = false
rebirthBtn.MouseButton1Click:Connect(function()
  if confirming then return end
  confirming = true
  rebirthBtn.BackgroundColor3 = RED
  for i = 3, 1, -1 do
    rebirthBtn.Text = "Are you sure? " .. i
    task.wait(1)
  end
  rebirthBtn.Text = "REBIRTHING..."
  -- Fire rebirth remote
  local re = game.ReplicatedStorage:FindFirstChild("Rebirth")
  if re then re:FireServer() end
  task.wait(1)
  screenGui:Destroy()
end)

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.4, 0, 0.45, 0), Position = UDim2.new(0.3, 0, 0.275, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. DAILY REWARD GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface DailyRewardGuiParams {
  day?: number
  rewards?: Array<{ day: number; amount: number }>
}

export function dailyRewardGui(params: DailyRewardGuiParams = {}): string {
  const currentDay = params.day || 1
  const rewards = params.rewards || [
    { day: 1, amount: 100 }, { day: 2, amount: 150 }, { day: 3, amount: 200 },
    { day: 4, amount: 300 }, { day: 5, amount: 500 }, { day: 6, amount: 750 },
    { day: 7, amount: 1500 },
  ]
  const rewardsLua = rewards.map(r => `{day=${r.day},amount=${r.amount}}`).join(',')

  return wrapTemplate('DailyRewardGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeDailyReward"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.55, 0, 0.45, 0)
main.Position = UDim2.new(0.225, 0, 0.275, 0)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 14)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "DAILY REWARDS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local currentDay = ${currentDay}
local rewards = {${rewardsLua}}

local grid = Instance.new("Frame")
grid.Size = UDim2.new(1, 0, 0.6, 0)
grid.Position = UDim2.new(0, 0, 0, 48)
grid.BackgroundTransparency = 1
grid.Parent = main

local layout = Instance.new("UIGridLayout")
layout.CellSize = UDim2.new(1/7, -6, 1, 0)
layout.CellPadding = UDim2.new(0, 4, 0, 0)
layout.Parent = grid

for _, r in ipairs(rewards) do
  local dayCard = Instance.new("Frame")
  dayCard.LayoutOrder = r.day
  dayCard.Parent = grid

  local isCurrent = r.day == currentDay
  local isPast = r.day < currentDay
  dayCard.BackgroundColor3 = isCurrent and GOLD or (isPast and Color3.fromRGB(20, 40, 25) or CARD)
  addCorner(dayCard, 8)
  if isCurrent then addStroke(dayCard, GOLD, 2) else addStroke(dayCard, BORDER) end

  local dayLabel = Instance.new("TextLabel")
  dayLabel.Size = UDim2.new(1, 0, 0.3, 0)
  dayLabel.BackgroundTransparency = 1
  dayLabel.Text = "Day " .. r.day
  dayLabel.TextColor3 = isCurrent and BG or TEXT_DIM
  dayLabel.Font = Enum.Font.GothamBold
  dayLabel.TextSize = 12
  dayLabel.Parent = dayCard

  local amountLabel = Instance.new("TextLabel")
  amountLabel.Size = UDim2.new(1, 0, 0.4, 0)
  amountLabel.Position = UDim2.new(0, 0, 0.3, 0)
  amountLabel.BackgroundTransparency = 1
  amountLabel.Text = tostring(r.amount)
  amountLabel.TextColor3 = isCurrent and BG or GOLD
  amountLabel.Font = Enum.Font.GothamBold
  amountLabel.TextSize = 18
  amountLabel.Parent = dayCard

  if isPast then
    local check = Instance.new("TextLabel")
    check.Size = UDim2.new(1, 0, 0.3, 0)
    check.Position = UDim2.new(0, 0, 0.7, 0)
    check.BackgroundTransparency = 1
    check.Text = "✓"
    check.TextColor3 = GREEN
    check.Font = Enum.Font.GothamBold
    check.TextSize = 16
    check.Parent = dayCard
  end
end

-- Claim button
local claimBtn = Instance.new("TextButton")
claimBtn.Size = UDim2.new(0.4, 0, 0, 40)
claimBtn.Position = UDim2.new(0.3, 0, 1, -52)
claimBtn.BackgroundColor3 = GOLD
claimBtn.Text = "CLAIM REWARD"
claimBtn.TextColor3 = BG
claimBtn.Font = Enum.Font.GothamBold
claimBtn.TextSize = 16
claimBtn.Parent = main
addCorner(claimBtn, 8)
hoverBtn(claimBtn, GOLD, Color3.fromRGB(235, 200, 80))

claimBtn.MouseButton1Click:Connect(function()
  claimBtn.Text = "CLAIMED!"
  claimBtn.BackgroundColor3 = GREEN
  claimBtn.Active = false
  local re = game.ReplicatedStorage:FindFirstChild("ClaimDaily")
  if re then re:FireServer() end
  task.wait(1.5)
  screenGui:Destroy()
end)

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.55, 0, 0.45, 0), Position = UDim2.new(0.225, 0, 0.275, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 15. MINIMAP GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface MiniMapGuiParams {
  zones?: Array<{ name: string; x: number; z: number; color?: string }>
}

export function miniMapGui(params: MiniMapGuiParams = {}): string {
  const zones = params.zones || [
    { name: 'Spawn', x: 0, z: 0, color: '50,200,80' },
    { name: 'Shop', x: 60, z: 0, color: '212,175,55' },
    { name: 'Arena', x: 0, z: -80, color: '200,60,60' },
    { name: 'Forest', x: -50, z: 50, color: '40,140,40' },
  ]
  const zonesLua = zones.map(z => `{name="${z.name}",x=${z.x},z=${z.z},color=Color3.fromRGB(${z.color || '212,175,55'})}`).join(',')

  return wrapTemplate('MiniMapGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeMiniMap"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Minimap in top-right corner
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 160, 0, 160)
frame.Position = UDim2.new(1, -172, 0, 12)
frame.BackgroundColor3 = BG
frame.BackgroundTransparency = 0.15
frame.Parent = screenGui
addCorner(frame, 10)
addStroke(frame, GOLD_DIM, 1)

-- Map canvas
local canvas = Instance.new("Frame")
canvas.Size = UDim2.new(1, -8, 1, -8)
canvas.Position = UDim2.new(0, 4, 0, 4)
canvas.BackgroundColor3 = Color3.fromRGB(20, 25, 40)
canvas.ClipsDescendants = true
canvas.Parent = frame
addCorner(canvas, 8)

-- Zone dots
local zones = {${zonesLua}}
local mapScale = 0.8 -- studs to pixels ratio
for _, zone in ipairs(zones) do
  local dot = Instance.new("Frame")
  dot.Size = UDim2.new(0, 12, 0, 12)
  dot.Position = UDim2.new(0.5, zone.x * mapScale - 6, 0.5, zone.z * mapScale - 6)
  dot.BackgroundColor3 = zone.color
  dot.Parent = canvas
  addCorner(dot, 6)

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(0, 60, 0, 12)
  label.Position = UDim2.new(0.5, -24, 1, 2)
  label.BackgroundTransparency = 1
  label.Text = zone.name
  label.TextColor3 = zone.color
  label.Font = Enum.Font.GothamBold
  label.TextSize = 9
  label.Parent = dot
end

-- Player dot (follows character)
local playerDot = Instance.new("Frame")
playerDot.Size = UDim2.new(0, 8, 0, 8)
playerDot.BackgroundColor3 = TEXT_PRIMARY
playerDot.ZIndex = 5
playerDot.Parent = canvas
addCorner(playerDot, 4)
addStroke(playerDot, GOLD, 1)

-- Update player position on minimap
task.spawn(function()
  while screenGui.Parent do
    local char = player.Character
    if char and char:FindFirstChild("HumanoidRootPart") then
      local pos = char.HumanoidRootPart.Position
      playerDot.Position = UDim2.new(0.5, pos.X * mapScale - 4, 0.5, pos.Z * mapScale - 4)
    end
    task.wait(0.1)
  end
end)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16. CRAFTING GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface CraftingGuiParams {
  recipes?: Array<{ name: string; result: string; ingredients: string }>
  ingredientSlots?: number
}

export function craftingGui(params: CraftingGuiParams = {}): string {
  const slots = params.ingredientSlots || 6
  const recipes = params.recipes || [
    { name: 'Iron Sword', result: 'Sword', ingredients: '3 Iron, 1 Wood' },
    { name: 'Health Potion', result: 'Potion', ingredients: '2 Herb, 1 Water' },
    { name: 'Shield', result: 'Shield', ingredients: '5 Iron, 2 Leather' },
    { name: 'Bow', result: 'Bow', ingredients: '2 Wood, 1 String' },
    { name: 'Fire Staff', result: 'Staff', ingredients: '1 Crystal, 3 Wood' },
  ]
  const recipesLua = recipes.map(r => `{name="${r.name}",result="${r.result}",ingredients="${r.ingredients}"}`).join(',')

  return wrapTemplate('CraftingGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeCrafting"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.7, 0, 0.65, 0)
main.Position = UDim2.new(0.15, 0, 0.175, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "CRAFTING BENCH"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

-- Left: ingredient inventory grid
local invPanel = Instance.new("Frame")
invPanel.Size = UDim2.new(0.28, 0, 1, -48)
invPanel.Position = UDim2.new(0, 0, 0, 44)
invPanel.BackgroundColor3 = SURFACE
invPanel.Parent = main
addCorner(invPanel, 8)
addStroke(invPanel, BORDER)

local invTitle = Instance.new("TextLabel")
invTitle.Size = UDim2.new(1, 0, 0, 24)
invTitle.BackgroundTransparency = 1
invTitle.Text = "INGREDIENTS"
invTitle.TextColor3 = TEXT_SUB
invTitle.Font = Enum.Font.GothamBold
invTitle.TextSize = 12
invTitle.Parent = invPanel

local invGrid = Instance.new("Frame")
invGrid.Size = UDim2.new(1, -12, 1, -32)
invGrid.Position = UDim2.new(0, 6, 0, 28)
invGrid.BackgroundTransparency = 1
invGrid.Parent = invPanel
local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize = UDim2.new(0.47, 0, 0, 60)
gridLayout.CellPadding = UDim2.new(0.04, 0, 0, 6)
gridLayout.Parent = invGrid

for i = 1, ${slots} do
  local slot = Instance.new("Frame")
  slot.BackgroundColor3 = CARD
  slot.LayoutOrder = i
  slot.Parent = invGrid
  addCorner(slot, 6)
  addStroke(slot, BORDER)
  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(1, 0, 1, 0)
  lbl.BackgroundTransparency = 1
  lbl.Text = ""
  lbl.TextColor3 = TEXT_DIM
  lbl.Font = Enum.Font.GothamMedium
  lbl.TextSize = 11
  lbl.Parent = slot
  slot.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
      TweenService:Create(slot, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play()
    end
  end)
  slot.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
      TweenService:Create(slot, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
    end
  end)
end

-- Center: crafting slots (2 input + arrow + output)
local centerPanel = Instance.new("Frame")
centerPanel.Size = UDim2.new(0.38, 0, 1, -48)
centerPanel.Position = UDim2.new(0.3, 0, 0, 44)
centerPanel.BackgroundTransparency = 1
centerPanel.Parent = main

local inputSlot1 = Instance.new("Frame")
inputSlot1.Size = UDim2.new(0, 64, 0, 64)
inputSlot1.Position = UDim2.new(0.15, 0, 0.2, 0)
inputSlot1.BackgroundColor3 = CARD
inputSlot1.Parent = centerPanel
addCorner(inputSlot1, 8)
addStroke(inputSlot1, GOLD_DIM, 1)

local inputSlot2 = Instance.new("Frame")
inputSlot2.Size = UDim2.new(0, 64, 0, 64)
inputSlot2.Position = UDim2.new(0.15, 0, 0.2, 76)
inputSlot2.BackgroundColor3 = CARD
inputSlot2.Parent = centerPanel
addCorner(inputSlot2, 8)
addStroke(inputSlot2, GOLD_DIM, 1)

local arrow = Instance.new("TextLabel")
arrow.Size = UDim2.new(0, 40, 0, 40)
arrow.Position = UDim2.new(0.5, -20, 0.35, 0)
arrow.BackgroundTransparency = 1
arrow.Text = ">>"
arrow.TextColor3 = GOLD
arrow.Font = Enum.Font.GothamBold
arrow.TextSize = 28
arrow.Parent = centerPanel

local outputSlot = Instance.new("Frame")
outputSlot.Size = UDim2.new(0, 72, 0, 72)
outputSlot.Position = UDim2.new(0.7, -36, 0.28, 0)
outputSlot.BackgroundColor3 = ELEVATED
outputSlot.Parent = centerPanel
addCorner(outputSlot, 10)
addStroke(outputSlot, GOLD, 2)

-- Required materials label
local reqLabel = Instance.new("TextLabel")
reqLabel.Size = UDim2.new(1, 0, 0, 20)
reqLabel.Position = UDim2.new(0, 0, 0.7, 0)
reqLabel.BackgroundTransparency = 1
reqLabel.Text = "Select a recipe to see requirements"
reqLabel.TextColor3 = TEXT_MUTED
reqLabel.Font = Enum.Font.GothamMedium
reqLabel.TextSize = 12
reqLabel.TextWrapped = true
reqLabel.Parent = centerPanel

-- Craft button with progress bar
local craftBtn = Instance.new("TextButton")
craftBtn.Size = UDim2.new(0.6, 0, 0, 38)
craftBtn.Position = UDim2.new(0.2, 0, 0.85, 0)
craftBtn.BackgroundColor3 = GOLD
craftBtn.Text = "CRAFT"
craftBtn.TextColor3 = BG_DEEP
craftBtn.Font = Enum.Font.GothamBold
craftBtn.TextSize = 16
craftBtn.AutoButtonColor = false
craftBtn.Parent = centerPanel
addCorner(craftBtn, 8)
local craftScale = Instance.new("UIScale") craftScale.Parent = craftBtn

local progressBar = Instance.new("Frame")
progressBar.Size = UDim2.new(0, 0, 1, 0)
progressBar.BackgroundColor3 = GREEN
progressBar.BackgroundTransparency = 0.3
progressBar.ZIndex = 2
progressBar.Parent = craftBtn
addCorner(progressBar, 8)

craftBtn.MouseEnter:Connect(function()
  TweenService:Create(craftScale, TWEEN_FAST, {Scale = 1.04}):Play()
end)
craftBtn.MouseLeave:Connect(function()
  TweenService:Create(craftScale, TWEEN_FAST, {Scale = 1}):Play()
end)
craftBtn.MouseButton1Click:Connect(function()
  craftBtn.Active = false
  TweenService:Create(progressBar, TweenInfo.new(1.5, Enum.EasingStyle.Linear), {Size = UDim2.new(1, 0, 1, 0)}):Play()
  task.wait(1.5)
  craftBtn.Text = "CRAFTED!"
  progressBar.Size = UDim2.new(0, 0, 1, 0)
  playSound(SFX.reward, 0.5)
  task.wait(1)
  craftBtn.Text = "CRAFT"
  craftBtn.Active = true
end)

-- Right: recipe list
local recipePanel = Instance.new("ScrollingFrame")
recipePanel.Size = UDim2.new(0.28, 0, 1, -48)
recipePanel.Position = UDim2.new(0.72, 0, 0, 44)
recipePanel.BackgroundColor3 = SURFACE
recipePanel.ScrollBarThickness = 3
recipePanel.ScrollBarImageColor3 = GOLD_DIM
recipePanel.AutomaticCanvasSize = Enum.AutomaticSize.Y
recipePanel.Parent = main
addCorner(recipePanel, 8)
addStroke(recipePanel, BORDER)

local recipeList = Instance.new("UIListLayout")
recipeList.Padding = UDim.new(0, 4)
recipeList.SortOrder = Enum.SortOrder.LayoutOrder
recipeList.Parent = recipePanel
addPadding(recipePanel, 6)

local recipes = {${recipesLua}}
for idx, r in ipairs(recipes) do
  local card = Instance.new("TextButton")
  card.Size = UDim2.new(1, 0, 0, 48)
  card.BackgroundColor3 = CARD
  card.Text = ""
  card.AutoButtonColor = false
  card.LayoutOrder = idx
  card.Parent = recipePanel
  addCorner(card, 6)

  local rName = Instance.new("TextLabel")
  rName.Size = UDim2.new(1, -8, 0.5, 0)
  rName.Position = UDim2.new(0, 4, 0, 0)
  rName.BackgroundTransparency = 1
  rName.Text = r.name
  rName.TextColor3 = TEXT
  rName.Font = Enum.Font.GothamBold
  rName.TextSize = 13
  rName.TextXAlignment = Enum.TextXAlignment.Left
  rName.Parent = card

  local rMats = Instance.new("TextLabel")
  rMats.Size = UDim2.new(1, -8, 0.5, 0)
  rMats.Position = UDim2.new(0, 4, 0.5, 0)
  rMats.BackgroundTransparency = 1
  rMats.Text = r.ingredients
  rMats.TextColor3 = TEXT_MUTED
  rMats.Font = Enum.Font.GothamMedium
  rMats.TextSize = 10
  rMats.TextXAlignment = Enum.TextXAlignment.Left
  rMats.Parent = card

  card.MouseEnter:Connect(function()
    TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play()
  end)
  card.MouseLeave:Connect(function()
    TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
  end)
  card.MouseButton1Click:Connect(function()
    reqLabel.Text = r.name .. ": " .. r.ingredients
    playSound(SFX.click, 0.3)
  end)
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.7, 0, 0.65, 0), Position = UDim2.new(0.15, 0, 0.175, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 17. AUCTION HOUSE GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuctionHouseGuiParams {
  listings?: Array<{ name: string; price: number; timeLeft: string }>
  pageSize?: number
}

export function auctionHouseGui(params: AuctionHouseGuiParams = {}): string {
  const pageSize = params.pageSize || 8
  const listings = params.listings || [
    { name: 'Legendary Sword', price: 5000, timeLeft: '2h 30m' },
    { name: 'Rare Shield', price: 2500, timeLeft: '5h 10m' },
    { name: 'Epic Staff', price: 8000, timeLeft: '1h 15m' },
    { name: 'Common Helm', price: 200, timeLeft: '12h' },
    { name: 'Mythic Ring', price: 15000, timeLeft: '45m' },
    { name: 'Rare Boots', price: 3200, timeLeft: '3h 20m' },
  ]
  const listingsLua = listings.map(l => `{name="${l.name}",price=${l.price},timeLeft="${l.timeLeft}"}`).join(',')

  return wrapTemplate('AuctionHouseGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeAuctionHouse"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.65, 0, 0.7, 0)
main.Position = UDim2.new(0.175, 0, 0.15, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "AUCTION HOUSE"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

-- Tab bar
local tabs = {"Buy", "Sell", "My Listings"}
local tabBtns = {}
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1, 0, 0, 30)
tabBar.Position = UDim2.new(0, 0, 0, 40)
tabBar.BackgroundTransparency = 1
tabBar.Parent = main
local tabLayout = Instance.new("UIListLayout")
tabLayout.FillDirection = Enum.FillDirection.Horizontal
tabLayout.Padding = UDim.new(0, 6)
tabLayout.Parent = tabBar

for i, tabName in ipairs(tabs) do
  local tb = Instance.new("TextButton")
  tb.Size = UDim2.new(0, 90, 1, 0)
  tb.BackgroundColor3 = i == 1 and GOLD or CARD
  tb.Text = tabName
  tb.TextColor3 = i == 1 and BG_DEEP or TEXT_SUB
  tb.Font = Enum.Font.GothamBold
  tb.TextSize = 13
  tb.AutoButtonColor = false
  tb.LayoutOrder = i
  tb.Parent = tabBar
  addCorner(tb, 6)
  tabBtns[i] = tb
  tb.MouseButton1Click:Connect(function()
    for j, b in ipairs(tabBtns) do
      b.BackgroundColor3 = j == i and GOLD or CARD
      b.TextColor3 = j == i and BG_DEEP or TEXT_SUB
    end
    playSound(SFX.click, 0.3)
  end)
  tb.MouseEnter:Connect(function()
    if tb.BackgroundColor3 ~= GOLD then TweenService:Create(tb, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play() end
  end)
  tb.MouseLeave:Connect(function()
    if tb.TextColor3 ~= BG_DEEP then TweenService:Create(tb, TWEEN_FAST, {BackgroundColor3 = CARD}):Play() end
  end)
end

-- Search bar
local searchBar = Instance.new("TextBox")
searchBar.Size = UDim2.new(1, 0, 0, 32)
searchBar.Position = UDim2.new(0, 0, 0, 76)
searchBar.BackgroundColor3 = SURFACE
searchBar.Text = ""
searchBar.PlaceholderText = "Search items..."
searchBar.PlaceholderColor3 = TEXT_MUTED
searchBar.TextColor3 = TEXT
searchBar.Font = Enum.Font.GothamMedium
searchBar.TextSize = 14
searchBar.ClearTextOnFocus = false
searchBar.Parent = main
addCorner(searchBar, 6)
addStroke(searchBar, BORDER)
addPadding(searchBar, 8)

-- Item list
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -160)
scroll.Position = UDim2.new(0, 0, 0, 116)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 3
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = main
local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 4)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = scroll

local listings = {${listingsLua}}
for idx, item in ipairs(listings) do
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1, 0, 0, 52)
  row.BackgroundColor3 = CARD
  row.LayoutOrder = idx
  row.Parent = scroll
  addCorner(row, 6)
  addStroke(row, BORDER)

  local icon = Instance.new("Frame")
  icon.Size = UDim2.new(0, 40, 0, 40)
  icon.Position = UDim2.new(0, 6, 0.5, -20)
  icon.BackgroundColor3 = ELEVATED
  icon.Parent = row
  addCorner(icon, 6)

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(0.3, 0, 0.5, 0)
  nameLabel.Position = UDim2.new(0, 52, 0, 2)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = item.name
  nameLabel.TextColor3 = TEXT
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 13
  nameLabel.TextXAlignment = Enum.TextXAlignment.Left
  nameLabel.Parent = row

  local priceLabel = Instance.new("TextLabel")
  priceLabel.Size = UDim2.new(0.15, 0, 1, 0)
  priceLabel.Position = UDim2.new(0.4, 0, 0, 0)
  priceLabel.BackgroundTransparency = 1
  priceLabel.Text = formatNumber(item.price)
  priceLabel.TextColor3 = GOLD
  priceLabel.Font = Enum.Font.GothamBold
  priceLabel.TextSize = 14
  priceLabel.Parent = row

  local timeLabel = Instance.new("TextLabel")
  timeLabel.Size = UDim2.new(0.15, 0, 1, 0)
  timeLabel.Position = UDim2.new(0.56, 0, 0, 0)
  timeLabel.BackgroundTransparency = 1
  timeLabel.Text = item.timeLeft
  timeLabel.TextColor3 = TEXT_MUTED
  timeLabel.Font = Enum.Font.GothamMedium
  timeLabel.TextSize = 12
  timeLabel.Parent = row

  local bidBtn = Instance.new("TextButton")
  bidBtn.Size = UDim2.new(0, 52, 0, 28)
  bidBtn.Position = UDim2.new(0.73, 0, 0.5, -14)
  bidBtn.BackgroundColor3 = BLUE
  bidBtn.Text = "BID"
  bidBtn.TextColor3 = TEXT
  bidBtn.Font = Enum.Font.GothamBold
  bidBtn.TextSize = 11
  bidBtn.AutoButtonColor = false
  bidBtn.Parent = row
  addCorner(bidBtn, 6)
  bidBtn.MouseEnter:Connect(function() TweenService:Create(bidBtn, TWEEN_FAST, {BackgroundColor3 = Color3.fromRGB(80,150,255)}):Play() end)
  bidBtn.MouseLeave:Connect(function() TweenService:Create(bidBtn, TWEEN_FAST, {BackgroundColor3 = BLUE}):Play() end)

  local buyBtn = Instance.new("TextButton")
  buyBtn.Size = UDim2.new(0, 60, 0, 28)
  buyBtn.Position = UDim2.new(0.87, 0, 0.5, -14)
  buyBtn.BackgroundColor3 = GOLD
  buyBtn.Text = "BUYOUT"
  buyBtn.TextColor3 = BG_DEEP
  buyBtn.Font = Enum.Font.GothamBold
  buyBtn.TextSize = 11
  buyBtn.AutoButtonColor = false
  buyBtn.Parent = row
  addCorner(buyBtn, 6)
  buyBtn.MouseEnter:Connect(function() TweenService:Create(buyBtn, TWEEN_FAST, {BackgroundColor3 = GOLD_BRIGHT}):Play() end)
  buyBtn.MouseLeave:Connect(function() TweenService:Create(buyBtn, TWEEN_FAST, {BackgroundColor3 = GOLD}):Play() end)

  row.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then TweenService:Create(row, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play() end
  end)
  row.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then TweenService:Create(row, TWEEN_FAST, {BackgroundColor3 = CARD}):Play() end
  end)
end

-- Pagination
local pageLabel = Instance.new("TextLabel")
pageLabel.Size = UDim2.new(1, 0, 0, 24)
pageLabel.Position = UDim2.new(0, 0, 1, -30)
pageLabel.BackgroundTransparency = 1
pageLabel.Text = "Page 1 / 1"
pageLabel.TextColor3 = TEXT_MUTED
pageLabel.Font = Enum.Font.GothamMedium
pageLabel.TextSize = 12
pageLabel.Parent = main

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.65, 0, 0.7, 0), Position = UDim2.new(0.175, 0, 0.15, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 18. GUILD GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface GuildGuiParams {
  guildName?: string
  members?: Array<{ name: string; rank: string }>
  gold?: number
}

export function guildGui(params: GuildGuiParams = {}): string {
  const guildName = params.guildName || 'Dragon Knights'
  const gold = params.gold || 12500
  const members = params.members || [
    { name: 'KingSlayer99', rank: 'Leader' },
    { name: 'ShadowMage', rank: 'Officer' },
    { name: 'RuneBlade', rank: 'Officer' },
    { name: 'FrostArcher', rank: 'Member' },
    { name: 'StormWolf', rank: 'Member' },
  ]
  const membersLua = members.map(m => `{name="${m.name}",rank="${m.rank}"}`).join(',')

  return wrapTemplate('GuildGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeGuild"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.55, 0, 0.7, 0)
main.Position = UDim2.new(0.225, 0, 0.15, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "${guildName}"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

-- Tabs
local tabs = {"Members", "Bank", "Quests"}
local tabBtns = {}
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1, 0, 0, 30)
tabBar.Position = UDim2.new(0, 0, 0, 40)
tabBar.BackgroundTransparency = 1
tabBar.Parent = main
local tabLay = Instance.new("UIListLayout")
tabLay.FillDirection = Enum.FillDirection.Horizontal
tabLay.Padding = UDim.new(0, 6)
tabLay.Parent = tabBar

local contentFrames = {}
for i, tabName in ipairs(tabs) do
  local tb = Instance.new("TextButton")
  tb.Size = UDim2.new(0, 80, 1, 0)
  tb.BackgroundColor3 = i == 1 and GOLD or CARD
  tb.Text = tabName
  tb.TextColor3 = i == 1 and BG_DEEP or TEXT_SUB
  tb.Font = Enum.Font.GothamBold
  tb.TextSize = 13
  tb.AutoButtonColor = false
  tb.LayoutOrder = i
  tb.Parent = tabBar
  addCorner(tb, 6)
  tabBtns[i] = tb

  local content = Instance.new("Frame")
  content.Size = UDim2.new(1, 0, 1, -82)
  content.Position = UDim2.new(0, 0, 0, 78)
  content.BackgroundTransparency = 1
  content.Visible = i == 1
  content.Parent = main
  contentFrames[i] = content

  tb.MouseButton1Click:Connect(function()
    for j, b in ipairs(tabBtns) do
      b.BackgroundColor3 = j == i and GOLD or CARD
      b.TextColor3 = j == i and BG_DEEP or TEXT_SUB
      contentFrames[j].Visible = j == i
    end
    playSound(SFX.click, 0.3)
  end)
  tb.MouseEnter:Connect(function()
    if tb.BackgroundColor3 ~= GOLD then TweenService:Create(tb, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play() end
  end)
  tb.MouseLeave:Connect(function()
    if tb.TextColor3 ~= BG_DEEP then TweenService:Create(tb, TWEEN_FAST, {BackgroundColor3 = CARD}):Play() end
  end)
end

-- Members tab
local memberScroll = Instance.new("ScrollingFrame")
memberScroll.Size = UDim2.new(1, 0, 1, 0)
memberScroll.BackgroundTransparency = 1
memberScroll.ScrollBarThickness = 3
memberScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
memberScroll.Parent = contentFrames[1]
local memberList = Instance.new("UIListLayout") memberList.Padding = UDim.new(0, 4) memberList.Parent = memberScroll

local rankColors = {Leader = GOLD, Officer = BLUE, Member = TEXT}
local members = {${membersLua}}
for idx, m in ipairs(members) do
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1, 0, 0, 40)
  row.BackgroundColor3 = CARD
  row.LayoutOrder = idx
  row.Parent = memberScroll
  addCorner(row, 6)

  local rankDot = Instance.new("Frame")
  rankDot.Size = UDim2.new(0, 10, 0, 10)
  rankDot.Position = UDim2.new(0, 8, 0.5, -5)
  rankDot.BackgroundColor3 = rankColors[m.rank] or TEXT
  rankDot.Parent = row
  addCorner(rankDot, 5)

  local nameL = Instance.new("TextLabel")
  nameL.Size = UDim2.new(0.5, 0, 1, 0)
  nameL.Position = UDim2.new(0, 26, 0, 0)
  nameL.BackgroundTransparency = 1
  nameL.Text = m.name
  nameL.TextColor3 = TEXT
  nameL.Font = Enum.Font.GothamMedium
  nameL.TextSize = 14
  nameL.TextXAlignment = Enum.TextXAlignment.Left
  nameL.Parent = row

  local rankL = Instance.new("TextLabel")
  rankL.Size = UDim2.new(0.3, 0, 1, 0)
  rankL.Position = UDim2.new(0.65, 0, 0, 0)
  rankL.BackgroundTransparency = 1
  rankL.Text = m.rank
  rankL.TextColor3 = rankColors[m.rank] or TEXT_MUTED
  rankL.Font = Enum.Font.GothamBold
  rankL.TextSize = 12
  rankL.Parent = row
end

-- Bank tab
local bankTitle = Instance.new("TextLabel")
bankTitle.Size = UDim2.new(1, 0, 0, 30)
bankTitle.BackgroundTransparency = 1
bankTitle.Text = "Guild Bank: " .. formatNumber(${gold}) .. " Gold"
bankTitle.TextColor3 = GOLD
bankTitle.Font = Enum.Font.GothamBold
bankTitle.TextSize = 18
bankTitle.Parent = contentFrames[2]

local goldInput = Instance.new("TextBox")
goldInput.Size = UDim2.new(0.4, 0, 0, 36)
goldInput.Position = UDim2.new(0.05, 0, 0, 44)
goldInput.BackgroundColor3 = SURFACE
goldInput.Text = ""
goldInput.PlaceholderText = "Amount..."
goldInput.PlaceholderColor3 = TEXT_MUTED
goldInput.TextColor3 = TEXT
goldInput.Font = Enum.Font.GothamMedium
goldInput.TextSize = 14
goldInput.Parent = contentFrames[2]
addCorner(goldInput, 6)
addStroke(goldInput, BORDER)

local depositBtn = Instance.new("TextButton")
depositBtn.Size = UDim2.new(0.22, 0, 0, 36)
depositBtn.Position = UDim2.new(0.5, 0, 0, 44)
depositBtn.BackgroundColor3 = GREEN
depositBtn.Text = "DEPOSIT"
depositBtn.TextColor3 = BG_DEEP
depositBtn.Font = Enum.Font.GothamBold
depositBtn.TextSize = 13
depositBtn.AutoButtonColor = false
depositBtn.Parent = contentFrames[2]
addCorner(depositBtn, 6)
depositBtn.MouseEnter:Connect(function() TweenService:Create(depositBtn, TWEEN_FAST, {BackgroundColor3 = Color3.fromRGB(60,220,100)}):Play() end)
depositBtn.MouseLeave:Connect(function() TweenService:Create(depositBtn, TWEEN_FAST, {BackgroundColor3 = GREEN}):Play() end)

local withdrawBtn = Instance.new("TextButton")
withdrawBtn.Size = UDim2.new(0.22, 0, 0, 36)
withdrawBtn.Position = UDim2.new(0.75, 0, 0, 44)
withdrawBtn.BackgroundColor3 = RED
withdrawBtn.Text = "WITHDRAW"
withdrawBtn.TextColor3 = TEXT
withdrawBtn.Font = Enum.Font.GothamBold
withdrawBtn.TextSize = 13
withdrawBtn.AutoButtonColor = false
withdrawBtn.Parent = contentFrames[2]
addCorner(withdrawBtn, 6)
withdrawBtn.MouseEnter:Connect(function() TweenService:Create(withdrawBtn, TWEEN_FAST, {BackgroundColor3 = Color3.fromRGB(240,85,85)}):Play() end)
withdrawBtn.MouseLeave:Connect(function() TweenService:Create(withdrawBtn, TWEEN_FAST, {BackgroundColor3 = RED}):Play() end)

-- Quests tab
local questData = {
  {name = "Defeat 10 Goblins", progress = 7, total = 10},
  {name = "Collect 50 Ore", progress = 32, total = 50},
  {name = "Win 3 PvP Battles", progress = 1, total = 3},
}
for idx, q in ipairs(questData) do
  local qFrame = Instance.new("Frame")
  qFrame.Size = UDim2.new(1, 0, 0, 50)
  qFrame.Position = UDim2.new(0, 0, 0, (idx-1) * 56)
  qFrame.BackgroundColor3 = CARD
  qFrame.Parent = contentFrames[3]
  addCorner(qFrame, 6)
  local qName = Instance.new("TextLabel")
  qName.Size = UDim2.new(1, -8, 0, 22)
  qName.Position = UDim2.new(0, 4, 0, 2)
  qName.BackgroundTransparency = 1
  qName.Text = q.name .. " (" .. q.progress .. "/" .. q.total .. ")"
  qName.TextColor3 = TEXT
  qName.Font = Enum.Font.GothamMedium
  qName.TextSize = 13
  qName.TextXAlignment = Enum.TextXAlignment.Left
  qName.Parent = qFrame
  local barBg = Instance.new("Frame")
  barBg.Size = UDim2.new(1, -12, 0, 10)
  barBg.Position = UDim2.new(0, 6, 1, -16)
  barBg.BackgroundColor3 = SURFACE
  barBg.Parent = qFrame
  addCorner(barBg, 5)
  local barFill = Instance.new("Frame")
  barFill.Size = UDim2.new(q.progress / q.total, 0, 1, 0)
  barFill.BackgroundColor3 = GOLD
  barFill.Parent = barBg
  addCorner(barFill, 5)
end

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.55, 0, 0.7, 0), Position = UDim2.new(0.225, 0, 0.15, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 19. BATTLE PASS GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface BattlePassGuiParams {
  currentTier?: number
  maxTiers?: number
  hasPremium?: boolean
}

export function battlePassGui(params: BattlePassGuiParams = {}): string {
  const curTier = params.currentTier || 5
  const maxT = params.maxTiers || 12
  const hasPrem = params.hasPremium ?? false

  return wrapTemplate('BattlePassGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeBattlePass"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.8, 0, 0.55, 0)
main.Position = UDim2.new(0.1, 0, 0.225, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(0.5, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "BATTLE PASS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local curTier = ${curTier}
local maxT = ${maxT}
local hasPrem = ${hasPrem}

if not hasPrem then
  local buyBtn = Instance.new("TextButton")
  buyBtn.Size = UDim2.new(0, 140, 0, 32)
  buyBtn.Position = UDim2.new(1, -152, 0, 2)
  buyBtn.BackgroundColor3 = GOLD
  buyBtn.Text = "BUY PREMIUM"
  buyBtn.TextColor3 = BG_DEEP
  buyBtn.Font = Enum.Font.GothamBold
  buyBtn.TextSize = 14
  buyBtn.AutoButtonColor = false
  buyBtn.Parent = main
  addCorner(buyBtn, 8)
  local buyScale = Instance.new("UIScale") buyScale.Parent = buyBtn
  buyBtn.MouseEnter:Connect(function() TweenService:Create(buyScale, TWEEN_FAST, {Scale = 1.05}):Play() end)
  buyBtn.MouseLeave:Connect(function() TweenService:Create(buyScale, TWEEN_FAST, {Scale = 1}):Play() end)
end

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -48)
scroll.Position = UDim2.new(0, 0, 0, 44)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = GOLD_DIM
scroll.AutomaticCanvasSize = Enum.AutomaticSize.X
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.ScrollingDirection = Enum.ScrollingDirection.X
scroll.Parent = main

local tierLay = Instance.new("UIListLayout")
tierLay.FillDirection = Enum.FillDirection.Horizontal
tierLay.Padding = UDim.new(0, 4)
tierLay.SortOrder = Enum.SortOrder.LayoutOrder
tierLay.Parent = scroll

for tier = 1, maxT do
  local unlocked = tier <= curTier
  local isCur = tier == curTier
  local col = Instance.new("Frame")
  col.Size = UDim2.new(0, 90, 1, 0)
  col.BackgroundTransparency = 1
  col.LayoutOrder = tier
  col.Parent = scroll

  local tierNum = Instance.new("TextLabel")
  tierNum.Size = UDim2.new(1, 0, 0, 18)
  tierNum.BackgroundTransparency = 1
  tierNum.Text = "Tier " .. tier
  tierNum.TextColor3 = isCur and GOLD or TEXT_MUTED
  tierNum.Font = Enum.Font.GothamBold
  tierNum.TextSize = 11
  tierNum.Parent = col

  local freeCard = Instance.new("Frame")
  freeCard.Size = UDim2.new(1, -4, 0.35, 0)
  freeCard.Position = UDim2.new(0, 2, 0, 22)
  freeCard.BackgroundColor3 = unlocked and CARD_HOVER or CARD
  freeCard.Parent = col
  addCorner(freeCard, 6)
  if isCur then addStroke(freeCard, GOLD, 2) else addStroke(freeCard, BORDER) end
  local freeLbl = Instance.new("TextLabel")
  freeLbl.Size = UDim2.new(1, 0, 0, 14)
  freeLbl.Position = UDim2.new(0, 0, 0, 2)
  freeLbl.BackgroundTransparency = 1
  freeLbl.Text = "FREE"
  freeLbl.TextColor3 = GREEN
  freeLbl.Font = Enum.Font.GothamBold
  freeLbl.TextSize = 9
  freeLbl.Parent = freeCard

  local barBg = Instance.new("Frame")
  barBg.Size = UDim2.new(1, -4, 0, 6)
  barBg.Position = UDim2.new(0, 2, 0.5, -1)
  barBg.BackgroundColor3 = SURFACE
  barBg.Parent = col
  addCorner(barBg, 3)
  local barFill = Instance.new("Frame")
  barFill.Size = UDim2.new(unlocked and 1 or 0, 0, 1, 0)
  barFill.BackgroundColor3 = GOLD
  barFill.Parent = barBg
  addCorner(barFill, 3)

  local premCard = Instance.new("Frame")
  premCard.Size = UDim2.new(1, -4, 0.35, 0)
  premCard.Position = UDim2.new(0, 2, 0.62, 0)
  premCard.BackgroundColor3 = (unlocked and hasPrem) and ELEVATED or CARD
  premCard.BackgroundTransparency = hasPrem and 0 or 0.3
  premCard.Parent = col
  addCorner(premCard, 6)
  addStroke(premCard, hasPrem and GOLD_DIM or BORDER)
  local premLbl = Instance.new("TextLabel")
  premLbl.Size = UDim2.new(1, 0, 0, 14)
  premLbl.Position = UDim2.new(0, 0, 0, 2)
  premLbl.BackgroundTransparency = 1
  premLbl.Text = hasPrem and "PREMIUM" or "LOCKED"
  premLbl.TextColor3 = hasPrem and GOLD or TEXT_MUTED
  premLbl.Font = Enum.Font.GothamBold
  premLbl.TextSize = 9
  premLbl.Parent = premCard
end

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.8, 0, 0.55, 0), Position = UDim2.new(0.1, 0, 0.225, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 20. ACHIEVEMENT GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface AchievementGuiParams {
  categories?: string[]
  totalCompleted?: number
  totalAchievements?: number
}

export function achievementGui(params: AchievementGuiParams = {}): string {
  const categories = params.categories || ['Combat', 'Exploration', 'Social', 'Crafting', 'Collection']
  const totalCompleted = params.totalCompleted || 12
  const totalAchievements = params.totalAchievements || 40
  const categoriesLua = categories.map(c => `"${c}"`).join(',')

  return wrapTemplate('AchievementGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeAchievements"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.65, 0, 0.7, 0)
main.Position = UDim2.new(0.175, 0, 0.15, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(0.6, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "ACHIEVEMENTS"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = main

local pctLabel = Instance.new("TextLabel")
pctLabel.Size = UDim2.new(0.35, 0, 0, 36)
pctLabel.Position = UDim2.new(0.6, 0, 0, 0)
pctLabel.BackgroundTransparency = 1
pctLabel.Text = "${totalCompleted}/${totalAchievements} (" .. math.floor(${totalCompleted}/${totalAchievements}*100) .. "%)"
pctLabel.TextColor3 = TEXT_SUB
pctLabel.Font = Enum.Font.GothamMedium
pctLabel.TextSize = 14
pctLabel.TextXAlignment = Enum.TextXAlignment.Right
pctLabel.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local sidebar = Instance.new("Frame")
sidebar.Size = UDim2.new(0.22, 0, 1, -48)
sidebar.Position = UDim2.new(0, 0, 0, 44)
sidebar.BackgroundColor3 = SURFACE
sidebar.Parent = main
addCorner(sidebar, 8)
addStroke(sidebar, BORDER)
local sideLayout = Instance.new("UIListLayout") sideLayout.Padding = UDim.new(0, 4) sideLayout.Parent = sidebar
addPadding(sidebar, 6)

local categories = {${categoriesLua}}
local catBtns = {}
for i, cat in ipairs(categories) do
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(1, 0, 0, 34)
  btn.BackgroundColor3 = i == 1 and ELEVATED or CARD
  btn.Text = cat
  btn.TextColor3 = i == 1 and GOLD or TEXT_SUB
  btn.Font = Enum.Font.GothamBold
  btn.TextSize = 13
  btn.AutoButtonColor = false
  btn.LayoutOrder = i
  btn.Parent = sidebar
  addCorner(btn, 6)
  catBtns[i] = btn
  btn.MouseButton1Click:Connect(function()
    for j, b in ipairs(catBtns) do
      b.BackgroundColor3 = j == i and ELEVATED or CARD
      b.TextColor3 = j == i and GOLD or TEXT_SUB
    end
    playSound(SFX.click, 0.3)
  end)
  btn.MouseEnter:Connect(function()
    if btn.TextColor3 ~= GOLD then TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play() end
  end)
  btn.MouseLeave:Connect(function()
    if btn.TextColor3 ~= GOLD then TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = CARD}):Play() end
  end)
end

local gridScroll = Instance.new("ScrollingFrame")
gridScroll.Size = UDim2.new(0.74, 0, 1, -48)
gridScroll.Position = UDim2.new(0.25, 0, 0, 44)
gridScroll.BackgroundTransparency = 1
gridScroll.ScrollBarThickness = 3
gridScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
gridScroll.Parent = main
local achieveGrid = Instance.new("UIGridLayout")
achieveGrid.CellSize = UDim2.new(0.48, 0, 0, 80)
achieveGrid.CellPadding = UDim2.new(0.02, 0, 0, 6)
achieveGrid.Parent = gridScroll

local sampleAch = {
  {name="First Blood", desc="Defeat first enemy", done=true},
  {name="Explorer", desc="Visit 5 zones", done=true},
  {name="Social", desc="Add 3 friends", done=true},
  {name="Crafter", desc="Craft 20 items", done=false, progress=12, total=20},
  {name="Collector", desc="Collect 50 items", done=false, progress=30, total=50},
  {name="Warrior", desc="Win 10 PvP", done=false, progress=4, total=10},
}
for idx, a in ipairs(sampleAch) do
  local card = Instance.new("Frame")
  card.BackgroundColor3 = a.done and CARD_HOVER or CARD
  card.BackgroundTransparency = a.done and 0 or 0.3
  card.LayoutOrder = idx
  card.Parent = gridScroll
  addCorner(card, 8)
  addStroke(card, a.done and GOLD_DIM or BORDER, 1, a.done and 0.1 or 0.4)
  local aName = Instance.new("TextLabel")
  aName.Size = UDim2.new(1, -12, 0, 20)
  aName.Position = UDim2.new(0, 6, 0, 4)
  aName.BackgroundTransparency = 1
  aName.Text = a.name
  aName.TextColor3 = a.done and GOLD or TEXT_MUTED
  aName.Font = Enum.Font.GothamBold
  aName.TextSize = 13
  aName.TextXAlignment = Enum.TextXAlignment.Left
  aName.Parent = card
  local aDesc = Instance.new("TextLabel")
  aDesc.Size = UDim2.new(1, -12, 0, 16)
  aDesc.Position = UDim2.new(0, 6, 0, 26)
  aDesc.BackgroundTransparency = 1
  aDesc.Text = a.desc
  aDesc.TextColor3 = TEXT_DIM
  aDesc.Font = Enum.Font.GothamMedium
  aDesc.TextSize = 11
  aDesc.TextXAlignment = Enum.TextXAlignment.Left
  aDesc.Parent = card
  if not a.done and a.progress then
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -12, 0, 8)
    bg.Position = UDim2.new(0, 6, 1, -16)
    bg.BackgroundColor3 = SURFACE
    bg.Parent = card
    addCorner(bg, 4)
    local fill = Instance.new("Frame")
    fill.Size = UDim2.new(a.progress / a.total, 0, 1, 0)
    fill.BackgroundColor3 = GOLD_DIM
    fill.Parent = bg
    addCorner(fill, 4)
  end
end

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.65, 0, 0.7, 0), Position = UDim2.new(0.175, 0, 0.15, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 21. MAP TELEPORT GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface MapTeleportGuiParams {
  zones?: Array<{ name: string; level: number; x: number; y: number; color?: string; locked?: boolean }>
}

export function mapTeleportGui(params: MapTeleportGuiParams = {}): string {
  const zones = params.zones || [
    { name: 'Spawn Village', level: 1, x: 0.5, y: 0.5, color: '50,200,80', locked: false },
    { name: 'Dark Forest', level: 5, x: 0.25, y: 0.3, color: '40,140,40', locked: false },
    { name: 'Crystal Cave', level: 10, x: 0.7, y: 0.25, color: '140,80,255', locked: false },
    { name: 'Lava Pit', level: 20, x: 0.35, y: 0.7, color: '220,65,65', locked: true },
    { name: 'Sky Temple', level: 30, x: 0.75, y: 0.65, color: '60,130,255', locked: true },
  ]
  const zonesLua = zones.map(z => `{name="${z.name}",level=${z.level},x=${z.x},y=${z.y},color=Color3.fromRGB(${z.color || '212,175,55'}),locked=${z.locked || false}}`).join(',')

  return wrapTemplate('MapTeleportGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeMapTeleport"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.6, 0, 0.65, 0)
main.Position = UDim2.new(0.2, 0, 0.175, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "WORLD MAP"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local canvas = Instance.new("Frame")
canvas.Size = UDim2.new(1, 0, 1, -48)
canvas.Position = UDim2.new(0, 0, 0, 44)
canvas.BackgroundColor3 = Color3.fromRGB(18, 22, 35)
canvas.ClipsDescendants = true
canvas.Parent = main
addCorner(canvas, 8)
addStroke(canvas, BORDER)

local zones = {${zonesLua}}
for _, z in ipairs(zones) do
  local dot = Instance.new("TextButton")
  dot.Size = UDim2.new(0, 36, 0, 36)
  dot.Position = UDim2.new(z.x, -18, z.y, -18)
  dot.BackgroundColor3 = z.locked and Color3.fromRGB(60,60,65) or z.color
  dot.Text = ""
  dot.AutoButtonColor = false
  dot.Parent = canvas
  addCorner(dot, 18)
  addStroke(dot, z.locked and BORDER or z.color, 2)

  local nameLbl = Instance.new("TextLabel")
  nameLbl.Size = UDim2.new(0, 100, 0, 14)
  nameLbl.Position = UDim2.new(0.5, -50, 1, 4)
  nameLbl.BackgroundTransparency = 1
  nameLbl.Text = z.name
  nameLbl.TextColor3 = z.locked and TEXT_MUTED or TEXT
  nameLbl.Font = Enum.Font.GothamBold
  nameLbl.TextSize = 11
  nameLbl.Parent = dot

  local lvlLbl = Instance.new("TextLabel")
  lvlLbl.Size = UDim2.new(0, 60, 0, 12)
  lvlLbl.Position = UDim2.new(0.5, -30, 1, 18)
  lvlLbl.BackgroundTransparency = 1
  lvlLbl.Text = "Lv." .. z.level
  lvlLbl.TextColor3 = z.locked and TEXT_DIM or TEXT_SUB
  lvlLbl.Font = Enum.Font.GothamMedium
  lvlLbl.TextSize = 10
  lvlLbl.Parent = dot

  local dotScale = Instance.new("UIScale") dotScale.Parent = dot
  dot.MouseEnter:Connect(function()
    TweenService:Create(dotScale, TWEEN_FAST, {Scale = 1.15}):Play()
    playSound(SFX.hover, 0.12)
  end)
  dot.MouseLeave:Connect(function()
    TweenService:Create(dotScale, TWEEN_FAST, {Scale = 1}):Play()
  end)
  dot.MouseButton1Click:Connect(function()
    if z.locked then playSound(SFX.error, 0.3) return end
    playSound(SFX.click, 0.4)
  end)
end

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.6, 0, 0.65, 0), Position = UDim2.new(0.2, 0, 0.175, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 22. CLAN WAR GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClanWarGuiParams {
  teamAName?: string
  teamBName?: string
  timeRemaining?: number
}

export function clanWarGui(params: ClanWarGuiParams = {}): string {
  const teamA = params.teamAName || 'Red Dragons'
  const teamB = params.teamBName || 'Blue Wolves'
  const timeRem = params.timeRemaining || 300

  return wrapTemplate('ClanWarGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeClanWar"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.6, 0, 0.7, 0)
main.Position = UDim2.new(0.2, 0, 0.15, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "CLAN WAR"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local timer = Instance.new("TextLabel")
timer.Size = UDim2.new(0.3, 0, 0, 28)
timer.Position = UDim2.new(0.35, 0, 0, 40)
timer.BackgroundColor3 = SURFACE
timer.Text = "5:00"
timer.TextColor3 = RED
timer.Font = Enum.Font.GothamBold
timer.TextSize = 18
timer.Parent = main
addCorner(timer, 6)

local timeLeft = ${timeRem}
task.spawn(function()
  while screenGui.Parent and timeLeft > 0 do
    timeLeft = timeLeft - 1
    timer.Text = string.format("%d:%02d", math.floor(timeLeft/60), timeLeft%60)
    task.wait(1)
  end
end)

local scoreBar = Instance.new("Frame")
scoreBar.Size = UDim2.new(1, 0, 0, 40)
scoreBar.Position = UDim2.new(0, 0, 0, 72)
scoreBar.BackgroundTransparency = 1
scoreBar.Parent = main

local teamAL = Instance.new("TextLabel")
teamAL.Size = UDim2.new(0.35, 0, 1, 0)
teamAL.BackgroundTransparency = 1
teamAL.Text = "${teamA}"
teamAL.TextColor3 = RED
teamAL.Font = Enum.Font.GothamBold
teamAL.TextSize = 16
teamAL.TextXAlignment = Enum.TextXAlignment.Left
teamAL.Parent = scoreBar

local scoreL = Instance.new("TextLabel")
scoreL.Size = UDim2.new(0.3, 0, 1, 0)
scoreL.Position = UDim2.new(0.35, 0, 0, 0)
scoreL.BackgroundTransparency = 1
scoreL.Text = "24 - 18"
scoreL.TextColor3 = GOLD
scoreL.Font = Enum.Font.GothamBold
scoreL.TextSize = 24
scoreL.Parent = scoreBar

local teamBL = Instance.new("TextLabel")
teamBL.Size = UDim2.new(0.35, 0, 1, 0)
teamBL.Position = UDim2.new(0.65, 0, 0, 0)
teamBL.BackgroundTransparency = 1
teamBL.Text = "${teamB}"
teamBL.TextColor3 = BLUE
teamBL.Font = Enum.Font.GothamBold
teamBL.TextSize = 16
teamBL.TextXAlignment = Enum.TextXAlignment.Right
teamBL.Parent = scoreBar

local colA = Instance.new("ScrollingFrame")
colA.Size = UDim2.new(0.48, 0, 1, -170)
colA.Position = UDim2.new(0, 0, 0, 118)
colA.BackgroundColor3 = SURFACE
colA.ScrollBarThickness = 3
colA.AutomaticCanvasSize = Enum.AutomaticSize.Y
colA.Parent = main
addCorner(colA, 8)
addStroke(colA, Color3.fromRGB(120,40,40))
local listA = Instance.new("UIListLayout") listA.Padding = UDim.new(0, 2) listA.Parent = colA
addPadding(colA, 4)

local colB = Instance.new("ScrollingFrame")
colB.Size = UDim2.new(0.48, 0, 1, -170)
colB.Position = UDim2.new(0.52, 0, 0, 118)
colB.BackgroundColor3 = SURFACE
colB.ScrollBarThickness = 3
colB.AutomaticCanvasSize = Enum.AutomaticSize.Y
colB.Parent = main
addCorner(colB, 8)
addStroke(colB, Color3.fromRGB(40,60,120))
local listB = Instance.new("UIListLayout") listB.Padding = UDim.new(0, 2) listB.Parent = colB
addPadding(colB, 4)

local function makePlayerRow(parent, pName, kills, deaths, teamColor)
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1, 0, 0, 32)
  row.BackgroundColor3 = CARD
  row.Parent = parent
  addCorner(row, 4)
  local n = Instance.new("TextLabel")
  n.Size = UDim2.new(0.5, 0, 1, 0)
  n.Position = UDim2.new(0, 6, 0, 0)
  n.BackgroundTransparency = 1
  n.Text = pName
  n.TextColor3 = TEXT
  n.Font = Enum.Font.GothamMedium
  n.TextSize = 12
  n.TextXAlignment = Enum.TextXAlignment.Left
  n.Parent = row
  local kd = Instance.new("TextLabel")
  kd.Size = UDim2.new(0.45, 0, 1, 0)
  kd.Position = UDim2.new(0.52, 0, 0, 0)
  kd.BackgroundTransparency = 1
  kd.Text = kills .. "K / " .. deaths .. "D"
  kd.TextColor3 = teamColor
  kd.Font = Enum.Font.GothamBold
  kd.TextSize = 12
  kd.TextXAlignment = Enum.TextXAlignment.Right
  kd.Parent = row
end

makePlayerRow(colA, "DragonFire", 8, 3, RED)
makePlayerRow(colA, "RedStorm", 7, 5, RED)
makePlayerRow(colA, "CrimsonBlade", 5, 4, RED)
makePlayerRow(colB, "IceWolf", 6, 5, BLUE)
makePlayerRow(colB, "AquaMage", 5, 7, BLUE)
makePlayerRow(colB, "FrostBite", 4, 4, BLUE)

local objBar = Instance.new("Frame")
objBar.Size = UDim2.new(1, 0, 0, 36)
objBar.Position = UDim2.new(0, 0, 1, -42)
objBar.BackgroundColor3 = SURFACE
objBar.Parent = main
addCorner(objBar, 6)
local objLabel = Instance.new("TextLabel")
objLabel.Size = UDim2.new(0.4, 0, 1, 0)
objLabel.Position = UDim2.new(0, 8, 0, 0)
objLabel.BackgroundTransparency = 1
objLabel.Text = "Capture: Zone B"
objLabel.TextColor3 = TEXT_SUB
objLabel.Font = Enum.Font.GothamMedium
objLabel.TextSize = 12
objLabel.TextXAlignment = Enum.TextXAlignment.Left
objLabel.Parent = objBar
local capBg = Instance.new("Frame")
capBg.Size = UDim2.new(0.5, 0, 0, 10)
capBg.Position = UDim2.new(0.45, 0, 0.5, -5)
capBg.BackgroundColor3 = CARD
capBg.Parent = objBar
addCorner(capBg, 5)
local capFill = Instance.new("Frame")
capFill.Size = UDim2.new(0.65, 0, 1, 0)
capFill.BackgroundColor3 = RED
capFill.Parent = capBg
addCorner(capFill, 5)

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.6, 0, 0.7, 0), Position = UDim2.new(0.2, 0, 0.15, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 23. FISHING GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface FishingGuiParams {
  rodName?: string
  baitCount?: number
  fishCaught?: number
}

export function fishingGui(params: FishingGuiParams = {}): string {
  const rodName = params.rodName || 'Basic Rod'
  const baitCount = params.baitCount || 25
  const fishCaught = params.fishCaught || 0

  return wrapTemplate('FishingGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeFishing"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local hud = Instance.new("Frame")
hud.Size = UDim2.new(0, 280, 0, 140)
hud.Position = UDim2.new(0.5, -140, 1, -160)
hud.BackgroundColor3 = BG
hud.BackgroundTransparency = 0.1
hud.Parent = screenGui
addCorner(hud, 10)
addStroke(hud, GOLD_DIM, 1)
addPadding(hud, 8)

makeCloseBtn(hud, function()
  TweenService:Create(hud, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.2) screenGui:Destroy()
end)

local rodLabel = Instance.new("TextLabel")
rodLabel.Size = UDim2.new(0.6, 0, 0, 18)
rodLabel.BackgroundTransparency = 1
rodLabel.Text = "${rodName}"
rodLabel.TextColor3 = GOLD
rodLabel.Font = Enum.Font.GothamBold
rodLabel.TextSize = 13
rodLabel.TextXAlignment = Enum.TextXAlignment.Left
rodLabel.Parent = hud

local baitLbl = Instance.new("TextLabel")
baitLbl.Size = UDim2.new(0.4, 0, 0, 18)
baitLbl.Position = UDim2.new(0.55, 0, 0, 0)
baitLbl.BackgroundTransparency = 1
baitLbl.Text = "Bait: ${baitCount}"
baitLbl.TextColor3 = TEXT_SUB
baitLbl.Font = Enum.Font.GothamMedium
baitLbl.TextSize = 11
baitLbl.TextXAlignment = Enum.TextXAlignment.Right
baitLbl.Parent = hud

local powerBg = Instance.new("Frame")
powerBg.Size = UDim2.new(1, 0, 0, 14)
powerBg.Position = UDim2.new(0, 0, 0, 24)
powerBg.BackgroundColor3 = SURFACE
powerBg.Parent = hud
addCorner(powerBg, 7)
addStroke(powerBg, BORDER)
local powerFill = Instance.new("Frame")
powerFill.Size = UDim2.new(0, 0, 1, 0)
powerFill.BackgroundColor3 = GREEN
powerFill.Parent = powerBg
addCorner(powerFill, 7)
local powerLbl = Instance.new("TextLabel")
powerLbl.Size = UDim2.new(1, 0, 1, 0)
powerLbl.BackgroundTransparency = 1
powerLbl.Text = "Hold to Cast"
powerLbl.TextColor3 = TEXT
powerLbl.Font = Enum.Font.GothamBold
powerLbl.TextSize = 10
powerLbl.ZIndex = 2
powerLbl.Parent = powerBg

local castBtn = Instance.new("TextButton")
castBtn.Size = UDim2.new(1, 0, 0, 28)
castBtn.Position = UDim2.new(0, 0, 0, 42)
castBtn.BackgroundColor3 = GOLD
castBtn.Text = "HOLD TO CAST"
castBtn.TextColor3 = BG_DEEP
castBtn.Font = Enum.Font.GothamBold
castBtn.TextSize = 13
castBtn.AutoButtonColor = false
castBtn.Parent = hud
addCorner(castBtn, 6)
local castScale = Instance.new("UIScale") castScale.Parent = castBtn
castBtn.MouseEnter:Connect(function() TweenService:Create(castScale, TWEEN_FAST, {Scale = 1.03}):Play() end)
castBtn.MouseLeave:Connect(function() TweenService:Create(castScale, TWEEN_FAST, {Scale = 1}):Play() end)

local casting = false
local power = 0
castBtn.MouseButton1Down:Connect(function()
  casting = true
  power = 0
  task.spawn(function()
    while casting and power < 1 do
      power = math.min(power + 0.02, 1)
      powerFill.Size = UDim2.new(power, 0, 1, 0)
      powerFill.BackgroundColor3 = power < 0.7 and GREEN or (power < 0.9 and GOLD or RED)
      powerLbl.Text = math.floor(power * 100) .. "%"
      task.wait(0.03)
    end
  end)
end)
castBtn.MouseButton1Up:Connect(function()
  casting = false
  playSound(SFX.click, 0.4)
  powerLbl.Text = "Cast at " .. math.floor(power * 100) .. "%"
  task.wait(0.5)
  power = 0
  powerFill.Size = UDim2.new(0, 0, 1, 0)
  powerLbl.Text = "Hold to Cast"
end)

local statsBar = Instance.new("Frame")
statsBar.Size = UDim2.new(1, 0, 0, 28)
statsBar.Position = UDim2.new(0, 0, 1, -32)
statsBar.BackgroundColor3 = SURFACE
statsBar.Parent = hud
addCorner(statsBar, 6)
local fishLbl = Instance.new("TextLabel")
fishLbl.Size = UDim2.new(0.5, 0, 1, 0)
fishLbl.Position = UDim2.new(0, 6, 0, 0)
fishLbl.BackgroundTransparency = 1
fishLbl.Text = "Fish: ${fishCaught}"
fishLbl.TextColor3 = TEXT
fishLbl.Font = Enum.Font.GothamBold
fishLbl.TextSize = 12
fishLbl.TextXAlignment = Enum.TextXAlignment.Left
fishLbl.Parent = statsBar
local rodStat = Instance.new("TextLabel")
rodStat.Size = UDim2.new(0.5, 0, 1, 0)
rodStat.Position = UDim2.new(0.5, 0, 0, 0)
rodStat.BackgroundTransparency = 1
rodStat.Text = "Power: 1.0x"
rodStat.TextColor3 = GOLD
rodStat.Font = Enum.Font.GothamMedium
rodStat.TextSize = 11
rodStat.TextXAlignment = Enum.TextXAlignment.Right
rodStat.Parent = statsBar

hud.Size = UDim2.new(0, 0, 0, 0)
hud.Position = UDim2.new(0.5, 0, 1, -90)
TweenService:Create(hud, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0, 280, 0, 140), Position = UDim2.new(0.5, -140, 1, -160)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 24. GARAGE GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface GarageGuiParams {
  vehicles?: Array<{ name: string; speed: number; handling: number; boost: number; owned?: boolean }>
}

export function garageGui(params: GarageGuiParams = {}): string {
  const vehicles = params.vehicles || [
    { name: 'Street Racer', speed: 80, handling: 70, boost: 50, owned: true },
    { name: 'Off-Road Truck', speed: 50, handling: 60, boost: 40, owned: true },
    { name: 'Sports Car', speed: 95, handling: 85, boost: 70, owned: false },
    { name: 'Monster Truck', speed: 45, handling: 40, boost: 90, owned: false },
  ]
  const vehiclesLua = vehicles.map(v => `{name="${v.name}",speed=${v.speed},handling=${v.handling},boost=${v.boost},owned=${v.owned ?? false}}`).join(',')

  return wrapTemplate('GarageGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeGarage"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0.65, 0, 0.65, 0)
main.Position = UDim2.new(0.175, 0, 0.175, 0)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)
addPadding(main, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text = "GARAGE"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 22
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

local vList = Instance.new("ScrollingFrame")
vList.Size = UDim2.new(0.35, 0, 1, -48)
vList.Position = UDim2.new(0, 0, 0, 44)
vList.BackgroundColor3 = SURFACE
vList.ScrollBarThickness = 3
vList.AutomaticCanvasSize = Enum.AutomaticSize.Y
vList.Parent = main
addCorner(vList, 8)
addStroke(vList, BORDER)
local vLayout = Instance.new("UIListLayout") vLayout.Padding = UDim.new(0, 4) vLayout.Parent = vList
addPadding(vList, 6)

local statsPanel = Instance.new("Frame")
statsPanel.Size = UDim2.new(0.6, 0, 1, -48)
statsPanel.Position = UDim2.new(0.38, 0, 0, 44)
statsPanel.BackgroundColor3 = SURFACE
statsPanel.Parent = main
addCorner(statsPanel, 8)
addStroke(statsPanel, BORDER)
addPadding(statsPanel, 12)

local selName = Instance.new("TextLabel")
selName.Size = UDim2.new(1, 0, 0, 28)
selName.BackgroundTransparency = 1
selName.Text = "Select a Vehicle"
selName.TextColor3 = GOLD
selName.Font = Enum.Font.GothamBold
selName.TextSize = 18
selName.TextXAlignment = Enum.TextXAlignment.Left
selName.Parent = statsPanel

local function makeStatBar(parent, label, yOff)
  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(0.3, 0, 0, 18)
  lbl.Position = UDim2.new(0, 0, 0, yOff)
  lbl.BackgroundTransparency = 1
  lbl.Text = label
  lbl.TextColor3 = TEXT_SUB
  lbl.Font = Enum.Font.GothamMedium
  lbl.TextSize = 12
  lbl.TextXAlignment = Enum.TextXAlignment.Left
  lbl.Parent = parent
  local bg = Instance.new("Frame")
  bg.Size = UDim2.new(0.65, 0, 0, 12)
  bg.Position = UDim2.new(0.32, 0, 0, yOff + 3)
  bg.BackgroundColor3 = CARD
  bg.Parent = parent
  addCorner(bg, 6)
  local fill = Instance.new("Frame")
  fill.Size = UDim2.new(0, 0, 1, 0)
  fill.BackgroundColor3 = GOLD
  fill.Parent = bg
  addCorner(fill, 6)
  return fill
end

local speedFill = makeStatBar(statsPanel, "Speed", 40)
local handFill = makeStatBar(statsPanel, "Handling", 66)
local boostFill = makeStatBar(statsPanel, "Boost", 92)

-- Color picker
local colorLbl = Instance.new("TextLabel")
colorLbl.Size = UDim2.new(1, 0, 0, 18)
colorLbl.Position = UDim2.new(0, 0, 0, 124)
colorLbl.BackgroundTransparency = 1
colorLbl.Text = "COLOR"
colorLbl.TextColor3 = TEXT_SUB
colorLbl.Font = Enum.Font.GothamBold
colorLbl.TextSize = 11
colorLbl.TextXAlignment = Enum.TextXAlignment.Left
colorLbl.Parent = statsPanel

local swatchColors = {
  Color3.fromRGB(220,65,65), Color3.fromRGB(60,130,255),
  Color3.fromRGB(50,200,80), Color3.fromRGB(212,175,55),
  Color3.fromRGB(140,80,255), Color3.fromRGB(255,140,50),
  Color3.fromRGB(255,255,255), Color3.fromRGB(40,40,45),
}
for i, c in ipairs(swatchColors) do
  local swatch = Instance.new("TextButton")
  swatch.Size = UDim2.new(0, 28, 0, 28)
  swatch.Position = UDim2.new(0, (i-1) * 34, 0, 144)
  swatch.BackgroundColor3 = c
  swatch.Text = ""
  swatch.AutoButtonColor = false
  swatch.Parent = statsPanel
  addCorner(swatch, 6)
  addStroke(swatch, BORDER)
  local swScale = Instance.new("UIScale") swScale.Parent = swatch
  swatch.MouseEnter:Connect(function() TweenService:Create(swScale, TWEEN_FAST, {Scale = 1.15}):Play() end)
  swatch.MouseLeave:Connect(function() TweenService:Create(swScale, TWEEN_FAST, {Scale = 1}):Play() end)
  swatch.MouseButton1Click:Connect(function() playSound(SFX.click, 0.3) end)
end

local equipBtn = Instance.new("TextButton")
equipBtn.Size = UDim2.new(0.6, 0, 0, 36)
equipBtn.Position = UDim2.new(0.2, 0, 1, -48)
equipBtn.BackgroundColor3 = GOLD
equipBtn.Text = "EQUIP"
equipBtn.TextColor3 = BG_DEEP
equipBtn.Font = Enum.Font.GothamBold
equipBtn.TextSize = 16
equipBtn.AutoButtonColor = false
equipBtn.Parent = statsPanel
addCorner(equipBtn, 8)
local eqScale = Instance.new("UIScale") eqScale.Parent = equipBtn
equipBtn.MouseEnter:Connect(function() TweenService:Create(eqScale, TWEEN_FAST, {Scale = 1.04}):Play() end)
equipBtn.MouseLeave:Connect(function() TweenService:Create(eqScale, TWEEN_FAST, {Scale = 1}):Play() end)

local vehicles = {${vehiclesLua}}
for idx, v in ipairs(vehicles) do
  local card = Instance.new("TextButton")
  card.Size = UDim2.new(1, 0, 0, 44)
  card.BackgroundColor3 = CARD
  card.Text = ""
  card.AutoButtonColor = false
  card.LayoutOrder = idx
  card.Parent = vList
  addCorner(card, 6)
  local vName = Instance.new("TextLabel")
  vName.Size = UDim2.new(0.75, 0, 1, 0)
  vName.Position = UDim2.new(0, 8, 0, 0)
  vName.BackgroundTransparency = 1
  vName.Text = v.name
  vName.TextColor3 = v.owned and TEXT or TEXT_MUTED
  vName.Font = Enum.Font.GothamBold
  vName.TextSize = 13
  vName.TextXAlignment = Enum.TextXAlignment.Left
  vName.Parent = card
  if not v.owned then
    local lock = Instance.new("TextLabel")
    lock.Size = UDim2.new(0, 20, 0, 20)
    lock.Position = UDim2.new(1, -26, 0.5, -10)
    lock.BackgroundTransparency = 1
    lock.Text = "?"
    lock.TextColor3 = TEXT_MUTED
    lock.Font = Enum.Font.GothamBold
    lock.TextSize = 14
    lock.Parent = card
  end
  card.MouseEnter:Connect(function() TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = CARD_HOVER}):Play() end)
  card.MouseLeave:Connect(function() TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = CARD}):Play() end)
  card.MouseButton1Click:Connect(function()
    selName.Text = v.name
    TweenService:Create(speedFill, TWEEN_NORMAL, {Size = UDim2.new(v.speed/100, 0, 1, 0)}):Play()
    TweenService:Create(handFill, TWEEN_NORMAL, {Size = UDim2.new(v.handling/100, 0, 1, 0)}):Play()
    TweenService:Create(boostFill, TWEEN_NORMAL, {Size = UDim2.new(v.boost/100, 0, 1, 0)}):Play()
    equipBtn.Text = v.owned and "EQUIP" or "LOCKED"
    equipBtn.BackgroundColor3 = v.owned and GOLD or CARD
    playSound(SFX.click, 0.3)
  end)
end

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.65, 0, 0.65, 0), Position = UDim2.new(0.175, 0, 0.175, 0)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 25. EMOTE WHEEL GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmoteWheelGuiParams {
  emotes?: Array<{ name: string; icon?: string }>
}

export function emoteWheelGui(params: EmoteWheelGuiParams = {}): string {
  const emotes = params.emotes || [
    { name: 'Wave' }, { name: 'Dance' }, { name: 'Laugh' }, { name: 'Salute' },
    { name: 'Sit' }, { name: 'Point' }, { name: 'Cheer' }, { name: 'Shrug' },
  ]
  const emotesLua = emotes.map(e => `{name="${e.name}"}`).join(',')

  return wrapTemplate('EmoteWheelGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeEmoteWheel"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local main = Instance.new("Frame")
main.Size = UDim2.new(0, 320, 0, 380)
main.Position = UDim2.new(0.5, -160, 0.5, -190)
main.BackgroundColor3 = BG
main.BackgroundTransparency = 0.05
main.Parent = screenGui
addCorner(main, 12)
addStroke(main, GOLD_DIM, 2)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 32)
title.BackgroundTransparency = 1
title.Text = "EMOTES"
title.TextColor3 = GOLD
title.Font = Enum.Font.GothamBold
title.TextSize = 18
title.Parent = main

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.2) screenGui:Destroy()
end)

local wheel = Instance.new("Frame")
wheel.Size = UDim2.new(0, 260, 0, 260)
wheel.Position = UDim2.new(0.5, -130, 0, 36)
wheel.BackgroundTransparency = 1
wheel.Parent = main

local center = Instance.new("Frame")
center.Size = UDim2.new(0, 50, 0, 50)
center.Position = UDim2.new(0.5, -25, 0.5, -25)
center.BackgroundColor3 = SURFACE
center.Parent = wheel
addCorner(center, 25)
addStroke(center, GOLD_DIM, 1)
local centerLbl = Instance.new("TextLabel")
centerLbl.Size = UDim2.new(1, 0, 1, 0)
centerLbl.BackgroundTransparency = 1
centerLbl.Text = "?"
centerLbl.TextColor3 = GOLD
centerLbl.Font = Enum.Font.GothamBold
centerLbl.TextSize = 16
centerLbl.Parent = center

local emotes = {${emotesLua}}
local radius = 95
for i, emote in ipairs(emotes) do
  local angle = (i - 1) * (2 * math.pi / #emotes) - math.pi / 2
  local x = math.cos(angle) * radius
  local y = math.sin(angle) * radius

  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 60, 0, 60)
  btn.Position = UDim2.new(0.5, x - 30, 0.5, y - 30)
  btn.BackgroundColor3 = CARD
  btn.Text = ""
  btn.AutoButtonColor = false
  btn.Parent = wheel
  addCorner(btn, 30)
  addStroke(btn, BORDER, 1)

  local icon = Instance.new("TextLabel")
  icon.Size = UDim2.new(1, 0, 0.55, 0)
  icon.BackgroundTransparency = 1
  icon.Text = string.sub(emote.name, 1, 1)
  icon.TextColor3 = TEXT_SUB
  icon.Font = Enum.Font.GothamBold
  icon.TextSize = 20
  icon.Parent = btn

  local nameLbl = Instance.new("TextLabel")
  nameLbl.Size = UDim2.new(1, 0, 0.35, 0)
  nameLbl.Position = UDim2.new(0, 0, 0.6, 0)
  nameLbl.BackgroundTransparency = 1
  nameLbl.Text = emote.name
  nameLbl.TextColor3 = TEXT_DIM
  nameLbl.Font = Enum.Font.GothamMedium
  nameLbl.TextSize = 9
  nameLbl.Parent = btn

  local btnScale = Instance.new("UIScale") btnScale.Parent = btn
  btn.MouseEnter:Connect(function()
    TweenService:Create(btnScale, TWEEN_FAST, {Scale = 1.12}):Play()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = ELEVATED}):Play()
    centerLbl.Text = emote.name
    playSound(SFX.hover, 0.12)
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btnScale, TWEEN_FAST, {Scale = 1}):Play()
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
    centerLbl.Text = "?"
  end)
  btn.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.4)
    centerLbl.Text = emote.name .. "!"
    TweenService:Create(btn, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {BackgroundColor3 = GOLD}):Play()
    task.wait(0.3)
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
  end)
end

local recentBar = Instance.new("Frame")
recentBar.Size = UDim2.new(1, -16, 0, 44)
recentBar.Position = UDim2.new(0, 8, 1, -52)
recentBar.BackgroundColor3 = SURFACE
recentBar.Parent = main
addCorner(recentBar, 8)
addStroke(recentBar, BORDER)
local recentTitle = Instance.new("TextLabel")
recentTitle.Size = UDim2.new(0, 60, 1, 0)
recentTitle.Position = UDim2.new(0, 6, 0, 0)
recentTitle.BackgroundTransparency = 1
recentTitle.Text = "Recent:"
recentTitle.TextColor3 = TEXT_MUTED
recentTitle.Font = Enum.Font.GothamMedium
recentTitle.TextSize = 10
recentTitle.TextXAlignment = Enum.TextXAlignment.Left
recentTitle.Parent = recentBar
for r = 1, 4 do
  local recent = Instance.new("Frame")
  recent.Size = UDim2.new(0, 32, 0, 32)
  recent.Position = UDim2.new(0, 62 + (r-1) * 38, 0.5, -16)
  recent.BackgroundColor3 = CARD
  recent.Parent = recentBar
  addCorner(recent, 16)
  addStroke(recent, BORDER)
end

main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0, 320, 0, 380), Position = UDim2.new(0.5, -160, 0.5, -190)
}):Play()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 26. DAMAGE NUMBERS GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface DamageNumbersGuiParams {
  critMultiplier?: number
  floatDistance?: number
  fadeTime?: number
}

export function damageNumbersGui(params: DamageNumbersGuiParams = {}): string {
  const critMult = params.critMultiplier || 2
  const floatDist = params.floatDistance || 3
  const fadeTime = params.fadeTime || 0.8

  return wrapTemplate('DamageNumbersGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeDamageNumbers"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- ═══ CONFIG ═══
local CRIT_MULTIPLIER = ${critMult}
local FLOAT_DISTANCE = ${floatDist}
local FADE_TIME = ${fadeTime}

local Workspace = game:GetService("Workspace")
local camera = Workspace.CurrentCamera

-- Show a floating damage number at a world position
local function showDamageNumber(worldPos, amount, isCrit, isHeal)
  local billboard = Instance.new("BillboardGui")
  billboard.Name = "DmgNum"
  billboard.Size = UDim2.new(0, 120, 0, 60)
  billboard.StudsOffset = Vector3.new(math.random(-10, 10) / 10, 1, 0)
  billboard.AlwaysOnTop = true
  billboard.LightInfluence = 0
  billboard.MaxDistance = 80

  -- Anchor to workspace (attach to a temporary part)
  local anchor = Instance.new("Part")
  anchor.Size = Vector3.new(0.1, 0.1, 0.1)
  anchor.Position = worldPos
  anchor.Anchored = true
  anchor.Transparency = 1
  anchor.CanCollide = false
  anchor.CanQuery = false
  anchor.Parent = Workspace

  billboard.Adornee = anchor
  billboard.Parent = screenGui

  -- Determine color and text
  local displayText = tostring(math.floor(amount))
  local textColor = RED
  local textSize = math.clamp(18 + amount / 5, 18, 48)

  if isHeal then
    textColor = GREEN
    displayText = "+" .. displayText
  end

  if isCrit then
    textColor = GOLD
    displayText = "CRIT! " .. displayText
    textSize = math.clamp(textSize * 1.5, 28, 64)
  end

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.Text = displayText
  label.TextColor3 = textColor
  label.Font = Enum.Font.GothamBlack
  label.TextSize = textSize
  label.TextStrokeColor3 = TEXT_SHADOW
  label.TextStrokeTransparency = 0.3
  label.TextScaled = false
  label.Parent = billboard

  -- Scale punch on appear
  local uiScale = Instance.new("UIScale")
  uiScale.Scale = 0.3
  uiScale.Parent = label
  TweenService:Create(uiScale, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()

  -- Float upward + fade out
  local floatTween = TweenService:Create(billboard, TweenInfo.new(FADE_TIME, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    StudsOffset = billboard.StudsOffset + Vector3.new(0, FLOAT_DISTANCE, 0)
  })
  local fadeTween = TweenService:Create(label, TweenInfo.new(FADE_TIME * 0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
    TextTransparency = 1,
    TextStrokeTransparency = 1
  })

  floatTween:Play()
  task.delay(FADE_TIME * 0.5, function()
    fadeTween:Play()
  end)

  -- Cleanup
  task.delay(FADE_TIME + 0.1, function()
    if billboard.Parent then billboard:Destroy() end
    if anchor.Parent then anchor:Destroy() end
  end)
end

-- Listen for damage events from server
local damageEvent = game.ReplicatedStorage:FindFirstChild("DamageNumber")
if not damageEvent then
  damageEvent = Instance.new("RemoteEvent")
  damageEvent.Name = "DamageNumber"
  damageEvent.Parent = game.ReplicatedStorage
end

damageEvent.OnClientEvent:Connect(function(worldPos, amount, isCrit, isHeal)
  showDamageNumber(worldPos, amount, isCrit, isHeal)
end)

-- Demo: spawn some test numbers
task.wait(1)
local rootPart = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
if rootPart then
  local pos = rootPart.Position + Vector3.new(0, 3, 0)
  showDamageNumber(pos, 25, false, false)
  task.wait(0.3)
  showDamageNumber(pos + Vector3.new(1, 0, 0), 15, false, true)
  task.wait(0.3)
  showDamageNumber(pos + Vector3.new(-1, 0, 0), 150, true, false)
end
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 27. KILL FEED GUI
// ═══════════════════════════════════════════════════════════════════════════════

export function killFeedGui(): string {
  return wrapTemplate('KillFeedGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeKillFeed"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- ═══ KILL FEED CONTAINER (top-right) ═══
local container = Instance.new("Frame")
container.Size = UDim2.new(0, 320, 0, 220)
container.Position = UDim2.new(1, -330, 0, 10)
container.BackgroundTransparency = 1
container.Parent = screenGui

local list = Instance.new("UIListLayout")
list.VerticalAlignment = Enum.VerticalAlignment.Top
list.Padding = UDim.new(0, 4)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = container

local feedOrder = 0
local MAX_ENTRIES = 5
local ENTRY_LIFETIME = 5

local function getEntryColor(killerName, victimName)
  local myName = player.Name
  if killerName == myName then
    return GOLD, GOLD_DIM  -- your kill = gold
  elseif victimName == myName then
    return RED, RED_DARK  -- your death = red
  end
  return TEXT_SUB, TEXT_MUTED  -- others = white/gray
end

local function addKillEntry(killerName, victimName, weaponName)
  feedOrder = feedOrder + 1
  local entryColor, accentColor = getEntryColor(killerName, victimName)

  local entry = Instance.new("Frame")
  entry.Size = UDim2.new(1, 0, 0, 32)
  entry.BackgroundColor3 = BG
  entry.BackgroundTransparency = 0.3
  entry.LayoutOrder = -feedOrder
  entry.Parent = container
  addCorner(entry, 6)

  -- Killer name
  local killerLbl = Instance.new("TextLabel")
  killerLbl.Size = UDim2.new(0, 110, 1, 0)
  killerLbl.Position = UDim2.new(0, 8, 0, 0)
  killerLbl.BackgroundTransparency = 1
  killerLbl.Text = killerName
  killerLbl.TextColor3 = entryColor
  killerLbl.Font = Enum.Font.GothamBold
  killerLbl.TextSize = 13
  killerLbl.TextXAlignment = Enum.TextXAlignment.Right
  killerLbl.TextTruncate = Enum.TextTruncate.AtEnd
  killerLbl.Parent = entry

  -- Weapon icon / separator
  local weaponLbl = Instance.new("TextLabel")
  weaponLbl.Size = UDim2.new(0, 70, 1, 0)
  weaponLbl.Position = UDim2.new(0, 122, 0, 0)
  weaponLbl.BackgroundTransparency = 1
  weaponLbl.Text = "[ " .. (weaponName or "???") .. " ]"
  weaponLbl.TextColor3 = TEXT_MUTED
  weaponLbl.Font = Enum.Font.GothamMedium
  weaponLbl.TextSize = 10
  weaponLbl.Parent = entry

  -- Victim name
  local victimLbl = Instance.new("TextLabel")
  victimLbl.Size = UDim2.new(0, 110, 1, 0)
  victimLbl.Position = UDim2.new(0, 196, 0, 0)
  victimLbl.BackgroundTransparency = 1
  victimLbl.Text = victimName
  victimLbl.TextColor3 = accentColor
  victimLbl.Font = Enum.Font.GothamBold
  victimLbl.TextSize = 13
  victimLbl.TextXAlignment = Enum.TextXAlignment.Left
  victimLbl.TextTruncate = Enum.TextTruncate.AtEnd
  victimLbl.Parent = entry

  -- Slide in from right
  entry.Position = UDim2.new(1, 20, 0, 0)
  TweenService:Create(entry, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Position = UDim2.new(0, 0, 0, 0)
  }):Play()

  -- Fade out after lifetime
  task.delay(ENTRY_LIFETIME, function()
    TweenService:Create(entry, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      BackgroundTransparency = 1
    }):Play()
    -- Fade all child text
    for _, child in entry:GetChildren() do
      if child:IsA("TextLabel") then
        TweenService:Create(child, TweenInfo.new(0.4), {TextTransparency = 1}):Play()
      end
    end
    task.wait(0.5)
    if entry.Parent then entry:Destroy() end
  end)

  -- Cap visible entries
  local children = {}
  for _, c in container:GetChildren() do
    if c:IsA("Frame") then table.insert(children, c) end
  end
  while #children > MAX_ENTRIES do
    children[#children]:Destroy()
    table.remove(children, #children)
  end

  playSound(SFX.notify, 0.15)
end

-- Listen for kill events from server
local killEvent = game.ReplicatedStorage:FindFirstChild("KillFeed")
if not killEvent then
  killEvent = Instance.new("RemoteEvent")
  killEvent.Name = "KillFeed"
  killEvent.Parent = game.ReplicatedStorage
end

killEvent.OnClientEvent:Connect(function(killerName, victimName, weaponName)
  addKillEntry(killerName, victimName, weaponName)
end)

-- Demo entries
task.wait(1)
addKillEntry("ProGamer99", "NoobSlayer", "Sword")
task.wait(0.8)
addKillEntry(player.Name, "EnemyPlayer", "Bow")
task.wait(0.8)
addKillEntry("SomePlayer", player.Name, "Cannon")
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 28. CHARACTER CUSTOMIZATION GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface CharacterCustomizationGuiParams {
  skinColors?: string[]
  hairStyles?: string[]
  outfits?: string[]
}

export function characterCustomizationGui(params: CharacterCustomizationGuiParams = {}): string {
  const skinColors = params.skinColors || [
    '255,220,185', '240,200,160', '210,170,130', '180,140,100',
    '150,110,70', '120,80,50', '90,60,40', '70,45,30',
    '255,200,200', '200,180,255', '180,255,200', '255,240,180'
  ]
  const skinColorsLua = skinColors.map(c => `Color3.fromRGB(${c})`).join(',')

  return wrapTemplate('CharacterCustomizationGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeCharacterCustomize"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- ═══ BACKGROUND OVERLAY ═══
local overlay = Instance.new("Frame")
overlay.Size = UDim2.new(1, 0, 1, 0)
overlay.BackgroundColor3 = Color3.new(0, 0, 0)
overlay.BackgroundTransparency = 0.5
overlay.Parent = screenGui

-- ═══ MAIN PANEL ═══
local main = Instance.new("Frame")
main.Size = UDim2.new(0, 500, 0, 420)
main.Position = UDim2.new(0.5, -250, 0.5, -210)
main.BackgroundColor3 = BG
main.Parent = screenGui
addCorner(main, 16)
addStroke(main, BORDER, 3)
addGradient(main, BG, BG_DEEP)

-- Header
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 50)
header.BackgroundColor3 = HEADER
header.Parent = main
addCorner(header, 16)
addGradient(header, HEADER, HEADER_DARK)

local headerClip = Instance.new("Frame")
headerClip.Size = UDim2.new(1, 0, 0, 20)
headerClip.Position = UDim2.new(0, 0, 1, -20)
headerClip.BackgroundColor3 = HEADER_DARK
headerClip.BorderSizePixel = 0
headerClip.Parent = header

local titleLbl = Instance.new("TextLabel")
titleLbl.Size = UDim2.new(1, -60, 1, 0)
titleLbl.Position = UDim2.new(0, 16, 0, 0)
titleLbl.BackgroundTransparency = 1
titleLbl.Text = "CHARACTER CUSTOMIZATION"
titleLbl.TextColor3 = GOLD
titleLbl.Font = Enum.Font.GothamBlack
titleLbl.TextSize = 18
titleLbl.TextXAlignment = Enum.TextXAlignment.Left
titleLbl.Parent = header

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -42, 0, 7)
closeBtn.BackgroundColor3 = RED
closeBtn.Text = "X"
closeBtn.TextColor3 = TEXT
closeBtn.Font = Enum.Font.GothamBlack
closeBtn.TextSize = 16
closeBtn.Parent = header
addCorner(closeBtn, 18)
closeBtn.MouseButton1Click:Connect(function()
  playSound(SFX.close, 0.3)
  screenGui:Destroy()
end)

-- ═══ TAB BAR ═══
local tabs = {"Body", "Face", "Hair", "Outfit", "Colors"}
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1, -16, 0, 40)
tabBar.Position = UDim2.new(0, 8, 0, 56)
tabBar.BackgroundTransparency = 1
tabBar.Parent = main

local tabLayout = Instance.new("UIListLayout")
tabLayout.FillDirection = Enum.FillDirection.Horizontal
tabLayout.Padding = UDim.new(0, 4)
tabLayout.Parent = tabBar

local contentFrame = Instance.new("Frame")
contentFrame.Size = UDim2.new(1, -16, 1, -108)
contentFrame.Position = UDim2.new(0, 8, 0, 100)
contentFrame.BackgroundColor3 = SURFACE_DARK
contentFrame.BackgroundTransparency = 0.5
contentFrame.ClipsDescendants = true
contentFrame.Parent = main
addCorner(contentFrame, 10)

-- Pages for each tab
local pages = {}
for i, tabName in ipairs(tabs) do
  local page = Instance.new("Frame")
  page.Size = UDim2.new(1, 0, 1, 0)
  page.BackgroundTransparency = 1
  page.Visible = (i == 1)
  page.Parent = contentFrame
  pages[tabName] = page
end

local activeTab = nil
local tabButtons = {}

for i, tabName in ipairs(tabs) do
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 90, 1, 0)
  btn.BackgroundColor3 = (i == 1) and SURFACE or CARD
  btn.Text = tabName
  btn.TextColor3 = TEXT
  btn.Font = Enum.Font.GothamBold
  btn.TextSize = 13
  btn.AutoButtonColor = false
  btn.Parent = tabBar
  addCorner(btn, 8)
  tabButtons[tabName] = btn

  btn.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.2)
    for _, p in pairs(pages) do p.Visible = false end
    pages[tabName].Visible = true
    for _, tb in pairs(tabButtons) do
      TweenService:Create(tb, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
    end
    TweenService:Create(btn, TWEEN_FAST, {BackgroundColor3 = SURFACE}):Play()
  end)
end

-- ═══ BODY TAB — Sliders ═══
local bodyPage = pages["Body"]
local function makeSlider(parent, label, yPos, defaultVal)
  local sliderLbl = Instance.new("TextLabel")
  sliderLbl.Size = UDim2.new(0, 100, 0, 30)
  sliderLbl.Position = UDim2.new(0, 10, 0, yPos)
  sliderLbl.BackgroundTransparency = 1
  sliderLbl.Text = label
  sliderLbl.TextColor3 = TEXT
  sliderLbl.Font = Enum.Font.GothamBold
  sliderLbl.TextSize = 14
  sliderLbl.TextXAlignment = Enum.TextXAlignment.Left
  sliderLbl.Parent = parent

  local track = Instance.new("Frame")
  track.Size = UDim2.new(0, 280, 0, 8)
  track.Position = UDim2.new(0, 120, 0, yPos + 11)
  track.BackgroundColor3 = BORDER
  track.Parent = parent
  addCorner(track, 4)

  local fill = Instance.new("Frame")
  fill.Size = UDim2.new(defaultVal or 0.5, 0, 1, 0)
  fill.BackgroundColor3 = GOLD
  fill.Parent = track
  addCorner(fill, 4)

  local knob = Instance.new("TextButton")
  knob.Size = UDim2.new(0, 20, 0, 20)
  knob.Position = UDim2.new(defaultVal or 0.5, -10, 0.5, -10)
  knob.BackgroundColor3 = GOLD_BRIGHT
  knob.Text = ""
  knob.Parent = track
  addCorner(knob, 10)
  addStroke(knob, GOLD_DIM, 2)

  local valueLbl = Instance.new("TextLabel")
  valueLbl.Size = UDim2.new(0, 40, 0, 30)
  valueLbl.Position = UDim2.new(0, 410, 0, yPos)
  valueLbl.BackgroundTransparency = 1
  valueLbl.Text = tostring(math.floor((defaultVal or 0.5) * 100)) .. "%"
  valueLbl.TextColor3 = TEXT_SUB
  valueLbl.Font = Enum.Font.GothamMedium
  valueLbl.TextSize = 12
  valueLbl.Parent = parent

  -- Drag logic
  local dragging = false
  knob.MouseButton1Down:Connect(function() dragging = true end)
  game:GetService("UserInputService").InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then dragging = false end
  end)
  game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
      local absPos = track.AbsolutePosition.X
      local absSize = track.AbsoluteSize.X
      local pct = math.clamp((input.Position.X - absPos) / absSize, 0, 1)
      fill.Size = UDim2.new(pct, 0, 1, 0)
      knob.Position = UDim2.new(pct, -10, 0.5, -10)
      valueLbl.Text = tostring(math.floor(pct * 100)) .. "%"
    end
  end)
end

makeSlider(bodyPage, "Height", 20, 0.5)
makeSlider(bodyPage, "Width", 70, 0.5)

-- ═══ FACE TAB — Grid of face options ═══
local facePage = pages["Face"]
local faces = {"Happy", "Cool", "Serious", "Cute", "Angry", "Silly"}
for idx, faceName in ipairs(faces) do
  local row = math.floor((idx - 1) / 3)
  local col = (idx - 1) % 3
  local card = Instance.new("TextButton")
  card.Size = UDim2.new(0, 130, 0, 80)
  card.Position = UDim2.new(0, 15 + col * 145, 0, 15 + row * 95)
  card.BackgroundColor3 = CARD
  card.Text = faceName
  card.TextColor3 = TEXT
  card.Font = Enum.Font.GothamBold
  card.TextSize = 14
  card.AutoButtonColor = false
  card.Parent = facePage
  addCorner(card, 10)
  addStroke(card, BORDER, 2)
  local cardScale = Instance.new("UIScale") cardScale.Parent = card
  card.MouseEnter:Connect(function()
    TweenService:Create(cardScale, TWEEN_FAST, {Scale = 1.05}):Play()
    TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = ELEVATED}):Play()
  end)
  card.MouseLeave:Connect(function()
    TweenService:Create(cardScale, TWEEN_FAST, {Scale = 1}):Play()
    TweenService:Create(card, TWEEN_FAST, {BackgroundColor3 = CARD}):Play()
  end)
  card.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.3)
    -- Highlight selected
    for _, c in facePage:GetChildren() do
      if c:IsA("TextButton") then
        local stroke = c:FindFirstChildWhichIsA("UIStroke")
        if stroke then stroke.Color = BORDER end
      end
    end
    local stroke = card:FindFirstChildWhichIsA("UIStroke")
    if stroke then stroke.Color = GOLD end
  end)
end

-- ═══ HAIR TAB — 8 hair style cards ═══
local hairPage = pages["Hair"]
local hairStyles = {"Bald", "Short", "Long", "Mohawk", "Ponytail", "Afro", "Spiky", "Bangs"}
for idx, style in ipairs(hairStyles) do
  local row = math.floor((idx - 1) / 4)
  local col = (idx - 1) % 4
  local card = Instance.new("TextButton")
  card.Size = UDim2.new(0, 100, 0, 80)
  card.Position = UDim2.new(0, 10 + col * 112, 0, 10 + row * 95)
  card.BackgroundColor3 = CARD
  card.Text = style
  card.TextColor3 = TEXT
  card.Font = Enum.Font.GothamBold
  card.TextSize = 12
  card.AutoButtonColor = false
  card.Parent = hairPage
  addCorner(card, 10)
  addStroke(card, BORDER, 2)
  card.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.3)
    for _, c in hairPage:GetChildren() do
      if c:IsA("TextButton") then
        local s = c:FindFirstChildWhichIsA("UIStroke")
        if s then s.Color = BORDER end
      end
    end
    local s = card:FindFirstChildWhichIsA("UIStroke")
    if s then s.Color = GOLD end
  end)
end

-- ═══ OUTFIT TAB — 6 outfit options ═══
local outfitPage = pages["Outfit"]
local outfits = {"Casual", "Formal", "Sporty", "Military", "Medieval", "Sci-Fi"}
for idx, outfit in ipairs(outfits) do
  local row = math.floor((idx - 1) / 3)
  local col = (idx - 1) % 3
  local card = Instance.new("TextButton")
  card.Size = UDim2.new(0, 130, 0, 80)
  card.Position = UDim2.new(0, 15 + col * 145, 0, 15 + row * 95)
  card.BackgroundColor3 = CARD
  card.Text = outfit
  card.TextColor3 = TEXT
  card.Font = Enum.Font.GothamBold
  card.TextSize = 14
  card.AutoButtonColor = false
  card.Parent = outfitPage
  addCorner(card, 10)
  addStroke(card, BORDER, 2)
  card.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.3)
    for _, c in outfitPage:GetChildren() do
      if c:IsA("TextButton") then
        local s = c:FindFirstChildWhichIsA("UIStroke")
        if s then s.Color = BORDER end
      end
    end
    local s = card:FindFirstChildWhichIsA("UIStroke")
    if s then s.Color = GOLD end
  end)
end

-- ═══ COLORS TAB — Skin, shirt, pants color pickers ═══
local colorsPage = pages["Colors"]
local skinColors = {${skinColorsLua}}

local skinTitle = Instance.new("TextLabel")
skinTitle.Size = UDim2.new(1, 0, 0, 24)
skinTitle.Position = UDim2.new(0, 10, 0, 5)
skinTitle.BackgroundTransparency = 1
skinTitle.Text = "Skin Color"
skinTitle.TextColor3 = GOLD
skinTitle.Font = Enum.Font.GothamBold
skinTitle.TextSize = 14
skinTitle.TextXAlignment = Enum.TextXAlignment.Left
skinTitle.Parent = colorsPage

for idx, clr in ipairs(skinColors) do
  local row = math.floor((idx - 1) / 6)
  local col = (idx - 1) % 6
  local swatch = Instance.new("TextButton")
  swatch.Size = UDim2.new(0, 50, 0, 35)
  swatch.Position = UDim2.new(0, 10 + col * 58, 0, 32 + row * 42)
  swatch.BackgroundColor3 = clr
  swatch.Text = ""
  swatch.Parent = colorsPage
  addCorner(swatch, 6)
  addStroke(swatch, BORDER, 2)
  swatch.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.2)
    for _, c in colorsPage:GetChildren() do
      if c:IsA("TextButton") then
        local s = c:FindFirstChildWhichIsA("UIStroke")
        if s then s.Color = BORDER end
      end
    end
    local s = swatch:FindFirstChildWhichIsA("UIStroke")
    if s then s.Color = GOLD end
  end)
end

-- Apply button
local applyBtn = Instance.new("TextButton")
applyBtn.Size = UDim2.new(0, 180, 0, 44)
applyBtn.Position = UDim2.new(0.5, -90, 1, -55)
applyBtn.BackgroundColor3 = GREEN
applyBtn.Text = "APPLY CHANGES"
applyBtn.TextColor3 = TEXT
applyBtn.Font = Enum.Font.GothamBlack
applyBtn.TextSize = 16
applyBtn.AutoButtonColor = false
applyBtn.Parent = main
addCorner(applyBtn, 12)
addStroke(applyBtn, GREEN_DARK, 2)
local applyScale = Instance.new("UIScale") applyScale.Parent = applyBtn
applyBtn.MouseEnter:Connect(function()
  TweenService:Create(applyScale, TWEEN_FAST, {Scale = 1.05}):Play()
end)
applyBtn.MouseLeave:Connect(function()
  TweenService:Create(applyScale, TWEEN_FAST, {Scale = 1}):Play()
end)
applyBtn.MouseButton1Click:Connect(function()
  playSound(SFX.purchase, 0.5)
  applyBtn.Text = "SAVED!"
  TweenService:Create(applyBtn, TWEEN_FAST, {BackgroundColor3 = GOLD}):Play()
  task.wait(1.5)
  applyBtn.Text = "APPLY CHANGES"
  TweenService:Create(applyBtn, TWEEN_FAST, {BackgroundColor3 = GREEN}):Play()
end)

-- Open animation
main.Size = UDim2.new(0, 0, 0, 0)
main.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(main, TWEEN_OPEN, {
  Size = UDim2.new(0, 500, 0, 420), Position = UDim2.new(0.5, -250, 0.5, -210)
}):Play()
playSound(SFX.open, 0.4)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 29. BOSS HEALTH BAR GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface BossHealthBarGuiParams {
  bossName?: string
  maxHealth?: number
}

export function bossHealthBarGui(params: BossHealthBarGuiParams = {}): string {
  const bossName = params.bossName || 'Ancient Dragon'
  const maxHp = params.maxHealth || 5000

  return wrapTemplate('BossHealthBarGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeBossHealthBar"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local MAX_HEALTH = ${maxHp}
local currentHealth = MAX_HEALTH
local isActive = false

-- ═══ CONTAINER (top center, full-width) ═══
local container = Instance.new("Frame")
container.Size = UDim2.new(0.7, 0, 0, 65)
container.Position = UDim2.new(0.15, 0, 0, -80)  -- starts hidden above screen
container.BackgroundColor3 = BG_DEEP
container.BackgroundTransparency = 0.15
container.Parent = screenGui
addCorner(container, 12)
addStroke(container, RED_DARK, 3)

-- Boss name
local nameLbl = Instance.new("TextLabel")
nameLbl.Size = UDim2.new(1, 0, 0, 22)
nameLbl.Position = UDim2.new(0, 0, 0, 2)
nameLbl.BackgroundTransparency = 1
nameLbl.Text = "${bossName}"
nameLbl.TextColor3 = RED
nameLbl.Font = Enum.Font.GothamBlack
nameLbl.TextSize = 16
nameLbl.Parent = container

-- Health bar track
local barTrack = Instance.new("Frame")
barTrack.Size = UDim2.new(1, -24, 0, 28)
barTrack.Position = UDim2.new(0, 12, 0, 26)
barTrack.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
barTrack.Parent = container
addCorner(barTrack, 6)
addStroke(barTrack, BORDER, 1)

-- Damage flash layer (behind fill)
local flashLayer = Instance.new("Frame")
flashLayer.Size = UDim2.new(1, 0, 1, 0)
flashLayer.BackgroundColor3 = RED
flashLayer.BackgroundTransparency = 1
flashLayer.Parent = barTrack
addCorner(flashLayer, 6)

-- Health fill bar
local barFill = Instance.new("Frame")
barFill.Size = UDim2.new(1, 0, 1, 0)
barFill.BackgroundColor3 = GREEN
barFill.Parent = barTrack
addCorner(barFill, 6)

-- Gradient on fill: green to yellow
local barGradient = Instance.new("UIGradient")
barGradient.Color = ColorSequence.new({
  ColorSequenceKeypoint.new(0, Color3.fromRGB(80, 220, 100)),
  ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 210, 50)),
  ColorSequenceKeypoint.new(1, Color3.fromRGB(240, 70, 70))
})
barGradient.Rotation = 0
barGradient.Parent = barFill

-- Phase markers at 60% and 30%
for _, pct in ipairs({0.6, 0.3}) do
  local marker = Instance.new("Frame")
  marker.Size = UDim2.new(0, 2, 1, 0)
  marker.Position = UDim2.new(pct, -1, 0, 0)
  marker.BackgroundColor3 = TEXT
  marker.BackgroundTransparency = 0.4
  marker.Parent = barTrack
  marker.ZIndex = 3
end

-- Health text overlay
local healthText = Instance.new("TextLabel")
healthText.Size = UDim2.new(1, 0, 1, 0)
healthText.BackgroundTransparency = 1
healthText.Text = tostring(MAX_HEALTH) .. " / " .. tostring(MAX_HEALTH)
healthText.TextColor3 = TEXT
healthText.Font = Enum.Font.GothamBlack
healthText.TextSize = 14
healthText.TextStrokeColor3 = TEXT_SHADOW
healthText.TextStrokeTransparency = 0.4
healthText.ZIndex = 4
healthText.Parent = barTrack

-- Defeated overlay
local defeatedFrame = Instance.new("Frame")
defeatedFrame.Size = UDim2.new(1, 0, 1, 0)
defeatedFrame.BackgroundColor3 = Color3.new(0, 0, 0)
defeatedFrame.BackgroundTransparency = 1
defeatedFrame.Visible = false
defeatedFrame.ZIndex = 10
defeatedFrame.Parent = container
addCorner(defeatedFrame, 12)

local defeatedLbl = Instance.new("TextLabel")
defeatedLbl.Size = UDim2.new(1, 0, 1, 0)
defeatedLbl.BackgroundTransparency = 1
defeatedLbl.Text = "DEFEATED!"
defeatedLbl.TextColor3 = GOLD
defeatedLbl.Font = Enum.Font.GothamBlack
defeatedLbl.TextSize = 28
defeatedLbl.TextStrokeColor3 = TEXT_SHADOW
defeatedLbl.TextStrokeTransparency = 0.2
defeatedLbl.ZIndex = 11
defeatedLbl.Parent = defeatedFrame

local function updateBar(newHealth)
  currentHealth = math.clamp(newHealth, 0, MAX_HEALTH)
  local pct = currentHealth / MAX_HEALTH

  -- Smooth tween the fill
  TweenService:Create(barFill, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Size = UDim2.new(pct, 0, 1, 0)
  }):Play()

  healthText.Text = tostring(math.floor(currentHealth)) .. " / " .. tostring(MAX_HEALTH)

  -- Flash red on hit
  flashLayer.BackgroundTransparency = 0.3
  TweenService:Create(flashLayer, TweenInfo.new(0.3), {BackgroundTransparency = 1}):Play()

  -- Boss defeated
  if currentHealth <= 0 then
    defeatedFrame.Visible = true
    TweenService:Create(defeatedFrame, TweenInfo.new(0.5), {BackgroundTransparency = 0.4}):Play()
    local dScale = Instance.new("UIScale") dScale.Scale = 0.5 dScale.Parent = defeatedLbl
    TweenService:Create(dScale, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()
    playSound(SFX.reward, 0.6)
    task.delay(3, function()
      TweenService:Create(container, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
        Position = UDim2.new(0.15, 0, 0, -80)
      }):Play()
    end)
  end
end

local function showBossBar()
  isActive = true
  currentHealth = MAX_HEALTH
  barFill.Size = UDim2.new(1, 0, 1, 0)
  healthText.Text = tostring(MAX_HEALTH) .. " / " .. tostring(MAX_HEALTH)
  defeatedFrame.Visible = false
  defeatedFrame.BackgroundTransparency = 1
  TweenService:Create(container, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Position = UDim2.new(0.15, 0, 0, 12)
  }):Play()
end

local function hideBossBar()
  isActive = false
  TweenService:Create(container, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
    Position = UDim2.new(0.15, 0, 0, -80)
  }):Play()
end

-- Listen for boss events
local bossEvent = game.ReplicatedStorage:FindFirstChild("BossHealth")
if not bossEvent then
  bossEvent = Instance.new("RemoteEvent")
  bossEvent.Name = "BossHealth"
  bossEvent.Parent = game.ReplicatedStorage
end

bossEvent.OnClientEvent:Connect(function(action, value)
  if action == "show" then
    showBossBar()
  elseif action == "hide" then
    hideBossBar()
  elseif action == "damage" and isActive then
    updateBar(currentHealth - (value or 0))
  elseif action == "set" and isActive then
    updateBar(value or 0)
  end
end)

-- Demo sequence
task.wait(1)
showBossBar()
task.wait(1.5)
updateBar(MAX_HEALTH * 0.75)
task.wait(1)
updateBar(MAX_HEALTH * 0.45)
task.wait(1)
updateBar(MAX_HEALTH * 0.15)
task.wait(1)
updateBar(0)
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 30. COUNTDOWN TIMER GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface CountdownTimerGuiParams {
  countFrom?: number
  headerText?: string
}

export function countdownTimerGui(params: CountdownTimerGuiParams = {}): string {
  const countFrom = params.countFrom || 3
  const headerText = params.headerText || 'Round starting in...'

  return wrapTemplate('CountdownTimerGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeCountdown"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local COUNT_FROM = ${countFrom}

-- ═══ MAIN CONTAINER (centered) ═══
local container = Instance.new("Frame")
container.Size = UDim2.new(1, 0, 1, 0)
container.BackgroundTransparency = 1
container.Parent = screenGui

-- Header text
local headerLbl = Instance.new("TextLabel")
headerLbl.Size = UDim2.new(0, 400, 0, 40)
headerLbl.Position = UDim2.new(0.5, -200, 0.3, 0)
headerLbl.BackgroundTransparency = 1
headerLbl.Text = "${headerText}"
headerLbl.TextColor3 = TEXT_SUB
headerLbl.Font = Enum.Font.GothamBold
headerLbl.TextSize = 22
headerLbl.TextStrokeColor3 = TEXT_SHADOW
headerLbl.TextStrokeTransparency = 0.4
headerLbl.TextTransparency = 1
headerLbl.Parent = container

-- Big number
local numberLbl = Instance.new("TextLabel")
numberLbl.Size = UDim2.new(0, 300, 0, 200)
numberLbl.Position = UDim2.new(0.5, -150, 0.35, 0)
numberLbl.BackgroundTransparency = 1
numberLbl.Text = ""
numberLbl.TextColor3 = TEXT
numberLbl.Font = Enum.Font.GothamBlack
numberLbl.TextSize = 140
numberLbl.TextStrokeColor3 = TEXT_SHADOW
numberLbl.TextStrokeTransparency = 0.2
numberLbl.TextTransparency = 1
numberLbl.Parent = container

local numScale = Instance.new("UIScale")
numScale.Scale = 1
numScale.Parent = numberLbl

local function showNumber(text, color, size)
  numberLbl.Text = text
  numberLbl.TextColor3 = color or TEXT
  numberLbl.TextSize = size or 140
  numberLbl.TextTransparency = 0
  numScale.Scale = 1.8

  -- Scale down + fade sequence
  TweenService:Create(numScale, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()

  -- Play tick sound
  playSound(SFX.click, 0.6)

  task.wait(0.7)

  -- Fade out
  TweenService:Create(numberLbl, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {TextTransparency = 1}):Play()
  task.wait(0.3)
end

local function runCountdown()
  -- Fade in header
  TweenService:Create(headerLbl, TweenInfo.new(0.3), {TextTransparency = 0}):Play()
  task.wait(0.5)

  -- Count down
  for i = COUNT_FROM, 1, -1 do
    showNumber(tostring(i), TEXT, 140)
  end

  -- GO!
  headerLbl.TextTransparency = 1
  numberLbl.Text = "GO!"
  numberLbl.TextColor3 = GOLD
  numberLbl.TextSize = 100
  numberLbl.TextTransparency = 0
  numScale.Scale = 0.3

  TweenService:Create(numScale, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1.2}):Play()
  playSound(SFX.reward, 0.7)

  task.wait(1)

  -- Fade out everything
  TweenService:Create(numberLbl, TweenInfo.new(0.4), {TextTransparency = 1}):Play()
  task.wait(0.5)
  screenGui:Destroy()
end

-- Listen for countdown event
local cdEvent = game.ReplicatedStorage:FindFirstChild("Countdown")
if not cdEvent then
  cdEvent = Instance.new("RemoteEvent")
  cdEvent.Name = "Countdown"
  cdEvent.Parent = game.ReplicatedStorage
end

cdEvent.OnClientEvent:Connect(function()
  runCountdown()
end)

-- Auto-run demo
task.wait(1)
runCountdown()
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 31. VICTORY / DEFEAT GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface VictoryDefeatGuiParams {
  autoCloseTime?: number
}

export function victoryDefeatGui(params: VictoryDefeatGuiParams = {}): string {
  const autoClose = params.autoCloseTime || 10

  return wrapTemplate('VictoryDefeatGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeVictoryDefeat"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local AUTO_CLOSE = ${autoClose}

local function showResult(isVictory, stats)
  stats = stats or {}
  local kills = stats.kills or 0
  local deaths = stats.deaths or 0
  local score = stats.score or 0
  local timeSurvived = stats.timeSurvived or "0:00"
  local xpEarned = stats.xpEarned or 100
  local coinsEarned = stats.coinsEarned or 50
  local mvpName = stats.mvpName or player.Name

  -- Black overlay fade in
  local overlay = Instance.new("Frame")
  overlay.Size = UDim2.new(1, 0, 1, 0)
  overlay.BackgroundColor3 = Color3.new(0, 0, 0)
  overlay.BackgroundTransparency = 1
  overlay.ZIndex = 50
  overlay.Parent = screenGui
  TweenService:Create(overlay, TweenInfo.new(0.5), {BackgroundTransparency = 0.6}):Play()

  task.wait(0.5)

  -- Main container
  local main = Instance.new("Frame")
  main.Size = UDim2.new(0, 480, 0, 400)
  main.Position = UDim2.new(0.5, -240, 0.5, -200)
  main.BackgroundColor3 = BG_DEEP
  main.BackgroundTransparency = 0.05
  main.ZIndex = 51
  main.Parent = screenGui
  addCorner(main, 18)
  addStroke(main, isVictory and GOLD or RED, 3)

  -- Result title
  local titleLbl = Instance.new("TextLabel")
  titleLbl.Size = UDim2.new(1, 0, 0, 70)
  titleLbl.Position = UDim2.new(0, 0, 0, 10)
  titleLbl.BackgroundTransparency = 1
  titleLbl.Text = isVictory and "VICTORY!" or "DEFEAT"
  titleLbl.TextColor3 = isVictory and GOLD or RED
  titleLbl.Font = Enum.Font.GothamBlack
  titleLbl.TextSize = 48
  titleLbl.TextStrokeColor3 = TEXT_SHADOW
  titleLbl.TextStrokeTransparency = 0.2
  titleLbl.ZIndex = 52
  titleLbl.Parent = main

  local titleScale = Instance.new("UIScale") titleScale.Scale = 0.3 titleScale.Parent = titleLbl
  TweenService:Create(titleScale, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1}):Play()

  -- MVP display
  local mvpLbl = Instance.new("TextLabel")
  mvpLbl.Size = UDim2.new(1, 0, 0, 24)
  mvpLbl.Position = UDim2.new(0, 0, 0, 80)
  mvpLbl.BackgroundTransparency = 1
  mvpLbl.Text = "MVP: " .. mvpName
  mvpLbl.TextColor3 = GOLD_BRIGHT
  mvpLbl.Font = Enum.Font.GothamBold
  mvpLbl.TextSize = 16
  mvpLbl.ZIndex = 52
  mvpLbl.Parent = main

  -- Stats grid
  local statsData = {
    {"Kills", tostring(kills)},
    {"Deaths", tostring(deaths)},
    {"Score", tostring(score)},
    {"Survived", timeSurvived}
  }

  local statsFrame = Instance.new("Frame")
  statsFrame.Size = UDim2.new(1, -40, 0, 70)
  statsFrame.Position = UDim2.new(0, 20, 0, 115)
  statsFrame.BackgroundColor3 = SURFACE_DARK
  statsFrame.BackgroundTransparency = 0.4
  statsFrame.ZIndex = 52
  statsFrame.Parent = main
  addCorner(statsFrame, 10)

  for i, stat in ipairs(statsData) do
    local statFrame = Instance.new("Frame")
    statFrame.Size = UDim2.new(0.25, 0, 1, 0)
    statFrame.Position = UDim2.new(0.25 * (i - 1), 0, 0, 0)
    statFrame.BackgroundTransparency = 1
    statFrame.ZIndex = 53
    statFrame.Parent = statsFrame

    local statVal = Instance.new("TextLabel")
    statVal.Size = UDim2.new(1, 0, 0.55, 0)
    statVal.BackgroundTransparency = 1
    statVal.Text = stat[2]
    statVal.TextColor3 = TEXT
    statVal.Font = Enum.Font.GothamBlack
    statVal.TextSize = 22
    statVal.ZIndex = 53
    statVal.Parent = statFrame

    local statName = Instance.new("TextLabel")
    statName.Size = UDim2.new(1, 0, 0.4, 0)
    statName.Position = UDim2.new(0, 0, 0.55, 0)
    statName.BackgroundTransparency = 1
    statName.Text = stat[1]
    statName.TextColor3 = TEXT_MUTED
    statName.Font = Enum.Font.GothamMedium
    statName.TextSize = 12
    statName.ZIndex = 53
    statName.Parent = statFrame
  end

  -- XP Earned bar
  local xpFrame = Instance.new("Frame")
  xpFrame.Size = UDim2.new(1, -40, 0, 40)
  xpFrame.Position = UDim2.new(0, 20, 0, 200)
  xpFrame.BackgroundTransparency = 1
  xpFrame.ZIndex = 52
  xpFrame.Parent = main

  local xpTitle = Instance.new("TextLabel")
  xpTitle.Size = UDim2.new(0.4, 0, 0, 18)
  xpTitle.BackgroundTransparency = 1
  xpTitle.Text = "XP Earned"
  xpTitle.TextColor3 = TEXT_SUB
  xpTitle.Font = Enum.Font.GothamBold
  xpTitle.TextSize = 13
  xpTitle.TextXAlignment = Enum.TextXAlignment.Left
  xpTitle.ZIndex = 53
  xpTitle.Parent = xpFrame

  local xpVal = Instance.new("TextLabel")
  xpVal.Size = UDim2.new(0.4, 0, 0, 18)
  xpVal.Position = UDim2.new(0.6, 0, 0, 0)
  xpVal.BackgroundTransparency = 1
  xpVal.Text = "+" .. tostring(xpEarned) .. " XP"
  xpVal.TextColor3 = PURPLE
  xpVal.Font = Enum.Font.GothamBlack
  xpVal.TextSize = 14
  xpVal.TextXAlignment = Enum.TextXAlignment.Right
  xpVal.ZIndex = 53
  xpVal.Parent = xpFrame

  local xpTrack = Instance.new("Frame")
  xpTrack.Size = UDim2.new(1, 0, 0, 14)
  xpTrack.Position = UDim2.new(0, 0, 0, 22)
  xpTrack.BackgroundColor3 = BORDER
  xpTrack.ZIndex = 53
  xpTrack.Parent = xpFrame
  addCorner(xpTrack, 7)

  local xpFill = Instance.new("Frame")
  xpFill.Size = UDim2.new(0, 0, 1, 0)
  xpFill.BackgroundColor3 = PURPLE
  xpFill.ZIndex = 54
  xpFill.Parent = xpTrack
  addCorner(xpFill, 7)

  -- Animate XP bar
  task.delay(0.8, function()
    TweenService:Create(xpFill, TweenInfo.new(1.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      Size = UDim2.new(math.clamp(xpEarned / 500, 0.05, 1), 0, 1, 0)
    }):Play()
  end)

  -- Coins earned (count-up animation)
  local coinsLbl = Instance.new("TextLabel")
  coinsLbl.Size = UDim2.new(1, -40, 0, 30)
  coinsLbl.Position = UDim2.new(0, 20, 0, 250)
  coinsLbl.BackgroundTransparency = 1
  coinsLbl.Text = "Coins: 0"
  coinsLbl.TextColor3 = GOLD
  coinsLbl.Font = Enum.Font.GothamBlack
  coinsLbl.TextSize = 20
  coinsLbl.ZIndex = 52
  coinsLbl.Parent = main

  -- Animated coin counter using NumberValue
  local coinCounter = Instance.new("NumberValue")
  coinCounter.Value = 0
  coinCounter.Parent = coinsLbl
  coinCounter.Changed:Connect(function(val)
    coinsLbl.Text = "Coins: " .. tostring(math.floor(val))
  end)
  task.delay(1, function()
    TweenService:Create(coinCounter, TweenInfo.new(1.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      Value = coinsEarned
    }):Play()
  end)

  -- Buttons
  local playAgainBtn = Instance.new("TextButton")
  playAgainBtn.Size = UDim2.new(0, 180, 0, 44)
  playAgainBtn.Position = UDim2.new(0, 30, 1, -65)
  playAgainBtn.BackgroundColor3 = GREEN
  playAgainBtn.Text = "PLAY AGAIN"
  playAgainBtn.TextColor3 = TEXT
  playAgainBtn.Font = Enum.Font.GothamBlack
  playAgainBtn.TextSize = 16
  playAgainBtn.AutoButtonColor = false
  playAgainBtn.ZIndex = 52
  playAgainBtn.Parent = main
  addCorner(playAgainBtn, 10)
  addStroke(playAgainBtn, GREEN_DARK, 2)

  local lobbyBtn = Instance.new("TextButton")
  lobbyBtn.Size = UDim2.new(0, 180, 0, 44)
  lobbyBtn.Position = UDim2.new(1, -210, 1, -65)
  lobbyBtn.BackgroundColor3 = CARD
  lobbyBtn.Text = "RETURN TO LOBBY"
  lobbyBtn.TextColor3 = TEXT
  lobbyBtn.Font = Enum.Font.GothamBold
  lobbyBtn.TextSize = 14
  lobbyBtn.AutoButtonColor = false
  lobbyBtn.ZIndex = 52
  lobbyBtn.Parent = main
  addCorner(lobbyBtn, 10)
  addStroke(lobbyBtn, BORDER, 2)

  -- Hover effects
  for _, btn in ipairs({playAgainBtn, lobbyBtn}) do
    local s = Instance.new("UIScale") s.Parent = btn
    btn.MouseEnter:Connect(function()
      TweenService:Create(s, TWEEN_FAST, {Scale = 1.05}):Play()
    end)
    btn.MouseLeave:Connect(function()
      TweenService:Create(s, TWEEN_FAST, {Scale = 1}):Play()
    end)
    btn.MouseButton1Click:Connect(function()
      playSound(SFX.click, 0.3)
    end)
  end

  -- Open animation
  main.Size = UDim2.new(0, 0, 0, 0)
  main.Position = UDim2.new(0.5, 0, 0.5, 0)
  TweenService:Create(main, TWEEN_OPEN, {
    Size = UDim2.new(0, 480, 0, 400), Position = UDim2.new(0.5, -240, 0.5, -200)
  }):Play()
  playSound(isVictory and SFX.reward or SFX.error, 0.6)

  -- Auto-close
  task.delay(AUTO_CLOSE, function()
    TweenService:Create(overlay, TweenInfo.new(0.5), {BackgroundTransparency = 1}):Play()
    TweenService:Create(main, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Size = UDim2.new(0, 0, 0, 0), Position = UDim2.new(0.5, 0, 0.5, 0)
    }):Play()
    task.wait(0.5)
    if screenGui.Parent then screenGui:Destroy() end
  end)
end

-- Listen for result event
local resultEvent = game.ReplicatedStorage:FindFirstChild("MatchResult")
if not resultEvent then
  resultEvent = Instance.new("RemoteEvent")
  resultEvent.Name = "MatchResult"
  resultEvent.Parent = game.ReplicatedStorage
end

resultEvent.OnClientEvent:Connect(function(isVictory, stats)
  showResult(isVictory, stats)
end)

-- Demo: show victory
task.wait(1)
showResult(true, {kills = 12, deaths = 3, score = 2450, timeSurvived = "4:32", xpEarned = 350, coinsEarned = 125, mvpName = player.Name})
`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// 32. LEVEL UP GUI
// ═══════════════════════════════════════════════════════════════════════════════

export interface LevelUpGuiParams {
  dismissTime?: number
}

export function levelUpGui(params: LevelUpGuiParams = {}): string {
  const dismissTime = params.dismissTime || 5

  return wrapTemplate('LevelUpGui', `
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ForjeLevelUp"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local DISMISS_TIME = ${dismissTime}

local function showLevelUp(oldLevel, newLevel, rewards, xpProgress)
  oldLevel = oldLevel or 4
  newLevel = newLevel or 5
  rewards = rewards or {"New Sword Unlocked", "Desert Zone Access", "Fire Ability"}
  xpProgress = xpProgress or 0.15

  -- Flash overlay
  local flash = Instance.new("Frame")
  flash.Size = UDim2.new(1, 0, 1, 0)
  flash.BackgroundColor3 = GOLD
  flash.BackgroundTransparency = 0.5
  flash.ZIndex = 80
  flash.Parent = screenGui
  TweenService:Create(flash, TweenInfo.new(0.6), {BackgroundTransparency = 1}):Play()
  task.delay(0.7, function() if flash.Parent then flash:Destroy() end end)

  -- Main popup
  local main = Instance.new("Frame")
  main.Size = UDim2.new(0, 380, 0, 400)
  main.Position = UDim2.new(0.5, -190, 0.5, -200)
  main.BackgroundColor3 = BG_DEEP
  main.BackgroundTransparency = 0.05
  main.ZIndex = 81
  main.Parent = screenGui
  addCorner(main, 20)
  addStroke(main, GOLD, 3)

  -- Sparkle ring (decorative circle)
  local ring = Instance.new("Frame")
  ring.Size = UDim2.new(0, 120, 0, 120)
  ring.Position = UDim2.new(0.5, -60, 0, 15)
  ring.BackgroundTransparency = 1
  ring.ZIndex = 82
  ring.Parent = main

  local ringStroke = Instance.new("UIStroke")
  ringStroke.Color = GOLD
  ringStroke.Thickness = 4
  ringStroke.Transparency = 0
  ringStroke.Parent = ring
  local ringCorner = Instance.new("UICorner")
  ringCorner.CornerRadius = UDim.new(0.5, 0)
  ringCorner.Parent = ring

  -- Pulse the ring
  TweenService:Create(ringStroke, TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), {
    Thickness = 6, Transparency = 0.4
  }):Play()

  -- Level number inside ring
  local levelCircle = Instance.new("TextLabel")
  levelCircle.Size = UDim2.new(1, -8, 1, -8)
  levelCircle.Position = UDim2.new(0, 4, 0, 4)
  levelCircle.BackgroundColor3 = GOLD
  levelCircle.Text = tostring(newLevel)
  levelCircle.TextColor3 = BG_DEEP
  levelCircle.Font = Enum.Font.GothamBlack
  levelCircle.TextSize = 52
  levelCircle.ZIndex = 83
  levelCircle.Parent = ring
  local lvlCorner = Instance.new("UICorner")
  lvlCorner.CornerRadius = UDim.new(0.5, 0)
  lvlCorner.Parent = levelCircle

  -- "LEVEL UP!" text with glow
  local titleLbl = Instance.new("TextLabel")
  titleLbl.Size = UDim2.new(1, 0, 0, 40)
  titleLbl.Position = UDim2.new(0, 0, 0, 140)
  titleLbl.BackgroundTransparency = 1
  titleLbl.Text = "LEVEL UP!"
  titleLbl.TextColor3 = GOLD
  titleLbl.Font = Enum.Font.GothamBlack
  titleLbl.TextSize = 36
  titleLbl.TextStrokeColor3 = GOLD_DIM
  titleLbl.TextStrokeTransparency = 0.5
  titleLbl.ZIndex = 82
  titleLbl.Parent = main

  -- Level transition text
  local transLbl = Instance.new("TextLabel")
  transLbl.Size = UDim2.new(1, 0, 0, 24)
  transLbl.Position = UDim2.new(0, 0, 0, 178)
  transLbl.BackgroundTransparency = 1
  transLbl.Text = "Level " .. tostring(oldLevel) .. "  ->  Level " .. tostring(newLevel)
  transLbl.TextColor3 = TEXT_SUB
  transLbl.Font = Enum.Font.GothamBold
  transLbl.TextSize = 16
  transLbl.ZIndex = 82
  transLbl.Parent = main

  -- Rewards unlocked
  local rewardsTitle = Instance.new("TextLabel")
  rewardsTitle.Size = UDim2.new(1, 0, 0, 20)
  rewardsTitle.Position = UDim2.new(0, 0, 0, 210)
  rewardsTitle.BackgroundTransparency = 1
  rewardsTitle.Text = "REWARDS UNLOCKED"
  rewardsTitle.TextColor3 = GOLD_DIM
  rewardsTitle.Font = Enum.Font.GothamBold
  rewardsTitle.TextSize = 11
  rewardsTitle.ZIndex = 82
  rewardsTitle.Parent = main

  local rewardsFrame = Instance.new("Frame")
  rewardsFrame.Size = UDim2.new(1, -40, 0, 80)
  rewardsFrame.Position = UDim2.new(0, 20, 0, 232)
  rewardsFrame.BackgroundColor3 = SURFACE_DARK
  rewardsFrame.BackgroundTransparency = 0.5
  rewardsFrame.ZIndex = 82
  rewardsFrame.Parent = main
  addCorner(rewardsFrame, 8)

  local rewardsList = Instance.new("UIListLayout")
  rewardsList.Padding = UDim.new(0, 2)
  rewardsList.Parent = rewardsFrame
  addPadding(rewardsFrame, 6)

  for _, reward in ipairs(rewards) do
    local rLbl = Instance.new("TextLabel")
    rLbl.Size = UDim2.new(1, 0, 0, 20)
    rLbl.BackgroundTransparency = 1
    rLbl.Text = "+ " .. reward
    rLbl.TextColor3 = GREEN
    rLbl.Font = Enum.Font.GothamMedium
    rLbl.TextSize = 13
    rLbl.TextXAlignment = Enum.TextXAlignment.Left
    rLbl.ZIndex = 83
    rLbl.Parent = rewardsFrame
  end

  -- XP bar to next level
  local xpFrame = Instance.new("Frame")
  xpFrame.Size = UDim2.new(1, -40, 0, 30)
  xpFrame.Position = UDim2.new(0, 20, 0, 320)
  xpFrame.BackgroundTransparency = 1
  xpFrame.ZIndex = 82
  xpFrame.Parent = main

  local xpLabel = Instance.new("TextLabel")
  xpLabel.Size = UDim2.new(1, 0, 0, 14)
  xpLabel.BackgroundTransparency = 1
  xpLabel.Text = "Progress to Level " .. tostring(newLevel + 1)
  xpLabel.TextColor3 = TEXT_MUTED
  xpLabel.Font = Enum.Font.GothamMedium
  xpLabel.TextSize = 11
  xpLabel.TextXAlignment = Enum.TextXAlignment.Left
  xpLabel.ZIndex = 83
  xpLabel.Parent = xpFrame

  local xpTrack = Instance.new("Frame")
  xpTrack.Size = UDim2.new(1, 0, 0, 12)
  xpTrack.Position = UDim2.new(0, 0, 0, 16)
  xpTrack.BackgroundColor3 = BORDER
  xpTrack.ZIndex = 83
  xpTrack.Parent = xpFrame
  addCorner(xpTrack, 6)

  local xpFill = Instance.new("Frame")
  xpFill.Size = UDim2.new(0, 0, 1, 0)
  xpFill.BackgroundColor3 = BLUE
  xpFill.ZIndex = 84
  xpFill.Parent = xpTrack
  addCorner(xpFill, 6)

  task.delay(0.5, function()
    TweenService:Create(xpFill, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      Size = UDim2.new(math.clamp(xpProgress, 0.02, 1), 0, 1, 0)
    }):Play()
  end)

  -- Click to dismiss
  local dismissLbl = Instance.new("TextLabel")
  dismissLbl.Size = UDim2.new(1, 0, 0, 18)
  dismissLbl.Position = UDim2.new(0, 0, 1, -24)
  dismissLbl.BackgroundTransparency = 1
  dismissLbl.Text = "Click to dismiss"
  dismissLbl.TextColor3 = TEXT_MUTED
  dismissLbl.Font = Enum.Font.GothamMedium
  dismissLbl.TextSize = 11
  dismissLbl.ZIndex = 82
  dismissLbl.Parent = main

  -- Open animation: bounce scale
  main.Size = UDim2.new(0, 0, 0, 0)
  main.Position = UDim2.new(0.5, 0, 0.5, 0)
  TweenService:Create(main, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Size = UDim2.new(0, 380, 0, 400), Position = UDim2.new(0.5, -190, 0.5, -200)
  }):Play()
  playSound(SFX.reward, 0.7)

  local function dismiss()
    TweenService:Create(main, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Size = UDim2.new(0, 0, 0, 0), Position = UDim2.new(0.5, 0, 0.5, 0)
    }):Play()
    task.wait(0.35)
    if main.Parent then main:Destroy() end
  end

  -- Click anywhere on main to dismiss
  local clickCatcher = Instance.new("TextButton")
  clickCatcher.Size = UDim2.new(1, 0, 1, 0)
  clickCatcher.BackgroundTransparency = 1
  clickCatcher.Text = ""
  clickCatcher.ZIndex = 85
  clickCatcher.Parent = main
  clickCatcher.MouseButton1Click:Connect(function()
    playSound(SFX.click, 0.2)
    dismiss()
  end)

  -- Auto-dismiss
  task.delay(DISMISS_TIME, function()
    if main.Parent then dismiss() end
  end)
end

-- Listen for level-up event
local lvlEvent = game.ReplicatedStorage:FindFirstChild("LevelUp")
if not lvlEvent then
  lvlEvent = Instance.new("RemoteEvent")
  lvlEvent.Name = "LevelUp"
  lvlEvent.Parent = game.ReplicatedStorage
end

lvlEvent.OnClientEvent:Connect(function(oldLevel, newLevel, rewards, xpProgress)
  showLevelUp(oldLevel, newLevel, rewards, xpProgress)
end)

-- Demo
task.wait(1)
showLevelUp(5, 6, {"New Sword Unlocked", "Desert Zone Access", "Fire Ability"}, 0.15)
`)
}
