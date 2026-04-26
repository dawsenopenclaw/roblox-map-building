/**
 * gui-templates.ts — 15 Premium GUI/UI Templates
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

-- ═══ KEYBIND TOGGLE SYSTEM ═══
local UserInputService = game:GetService("UserInputService")
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

-- Toggle button (always visible, bottom-right corner)
local toggleBtn = Instance.new("TextButton")
toggleBtn.Size = UDim2.new(0, 44, 0, 44)
toggleBtn.Position = UDim2.new(1, -56, 1, -56)
toggleBtn.BackgroundColor3 = GOLD
toggleBtn.Text = "SHOP"
toggleBtn.TextColor3 = BG_DEEP
toggleBtn.Font = Enum.Font.GothamBold
toggleBtn.TextSize = 10
toggleBtn.AutoButtonColor = false
toggleBtn.ZIndex = 5
toggleBtn.Parent = screenGui
addCorner(toggleBtn, 12)
local toggleScale = Instance.new("UIScale") toggleScale.Parent = toggleBtn
toggleBtn.MouseEnter:Connect(function() TweenService:Create(toggleScale, TWEEN_FAST, {Scale = 1.1}):Play() end)
toggleBtn.MouseLeave:Connect(function() TweenService:Create(toggleScale, TWEEN_FAST, {Scale = 1}):Play() end)

local isOpen = true
local function closeShop()
  isOpen = false
  playSound(SFX.close, 0.3)
  TweenService:Create(main, TWEEN_CLOSE, {Size = UDim2.new(0, 0, 0, 0), BackgroundTransparency = 0.5}):Play()
  task.wait(0.22)
  main.Visible = false
end
local function openShop()
  isOpen = true
  main.Visible = true
  playSound(SFX.open, 0.3)
  animateOpen(main, UDim2.new(0.6, 0, 0.7, 0), UDim2.new(0.2, 0, 0.15, 0))
end

-- Close button
makeCloseBtn(main, closeShop)

-- Toggle button click
toggleBtn.MouseButton1Click:Connect(function()
  playSound(SFX.click, 0.4)
  if isOpen then closeShop() else openShop() end
end)

-- Keybind: E to toggle shop
bindToggle(main, Enum.KeyCode.E, openShop, closeShop)

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

makeCloseBtn(main, function()
  TweenService:Create(main, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size=UDim2.new(0,0,0,0)}):Play()
  task.wait(0.25) screenGui:Destroy()
end)

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
