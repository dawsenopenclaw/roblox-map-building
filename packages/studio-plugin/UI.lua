--[[
  ForjeGames Studio Plugin — UI.lua
  Dark navy theme matching forjegames.com/editor exactly
  bg #050810 | surface #0A0F20 | elevated #121832 | gold #D4AF37
--]]

local UI = {}

-- ============================================================
-- Build the complete plugin UI
-- ============================================================
function UI.build(widget, state, COLORS, pluginRef)

  -- Exact colors from forjegames.com/editor CSS variables
  local C = {
    bg        = Color3.fromHex("050810"),  -- --background
    surface   = Color3.fromHex("0A0F20"),  -- --surface (panels)
    surface2  = Color3.fromHex("0E1428"),  -- --surface-2 (cards)
    elevated  = Color3.fromHex("121832"),  -- --surface-elevated (hover/active)
    gold      = Color3.fromHex("D4AF37"),  -- --gold
    goldLight = Color3.fromHex("FFD166"),  -- --gold-light (hover)
    goldGlow  = Color3.fromHex("1a1608"),  -- gold-glow bg tint
    text      = Color3.fromHex("FAFAFA"),  -- --foreground
    textSoft  = Color3.fromHex("E4E4E7"),  -- --foreground-soft
    textSec   = Color3.fromHex("A1A1AA"),  -- --muted
    textDim   = Color3.fromHex("71717A"),  -- --muted-subtle
    success   = Color3.fromHex("22c55e"),
    error     = Color3.fromHex("ef4444"),
    warning   = Color3.fromHex("f59e0b"),
    border    = Color3.fromHex("1a1f35"),  -- rgba(255,255,255,0.06) on #050810
    borderFocus = Color3.fromHex("3d3520"), -- rgba(212,175,55,0.3) on dark
    input     = Color3.fromHex("080d1a"),  -- slightly darker than bg
    inputBorder = Color3.fromHex("1a1f35"),
  }

  local TweenService = game:GetService("TweenService")
  local RNG = Random.new()

  -- ── Root ──────────────────────────────────────────────────
  local root = Instance.new("Frame")
  root.Name             = "FJ_Root"
  root.Size             = UDim2.new(1, 0, 1, 0)
  root.BackgroundColor3 = C.bg
  root.BorderSizePixel  = 0
  root.ClipsDescendants = true
  root.Parent           = widget

  -- ── Floating Stars Background ─────────────────────────────
  local starsLayer = Instance.new("Frame")
  starsLayer.Name                  = "StarsLayer"
  starsLayer.Size                  = UDim2.new(1, 0, 1, 0)
  starsLayer.BackgroundTransparency = 1
  starsLayer.BorderSizePixel       = 0
  starsLayer.ZIndex                = 1
  starsLayer.Parent                = root

  -- Create floating stars
  local stars = {}
  for i = 1, 40 do
    local star = Instance.new("Frame")
    star.Name             = "Star_" .. i
    local size = RNG:NextInteger(1, 3)
    star.Size             = UDim2.new(0, size, 0, size)
    star.Position         = UDim2.new(RNG:NextNumber(), 0, RNG:NextNumber(), 0)
    star.BackgroundColor3 = i <= 3 and C.gold or Color3.fromHex("ffffff")
    star.BackgroundTransparency = RNG:NextNumber(0.3, 0.8)
    star.BorderSizePixel  = 0
    star.ZIndex           = 1
    star.Parent           = starsLayer

    local sc = Instance.new("UICorner")
    sc.CornerRadius = UDim.new(1, 0)
    sc.Parent       = star

    stars[i] = star
  end

  -- Animate stars: gentle drift + twinkle
  local function animateStar(star, idx)
    local duration = RNG:NextNumber(8, 20)
    local startX = RNG:NextNumber(0, 1)
    local startY = RNG:NextNumber(0, 1)
    local endX   = startX + RNG:NextNumber(-0.15, 0.15)
    local endY   = startY - RNG:NextNumber(0.05, 0.2) -- drift upward

    star.Position = UDim2.new(startX, 0, startY, 0)

    -- Drift tween
    local driftTween = TweenService:Create(star, TweenInfo.new(
      duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { Position = UDim2.new(endX, 0, endY, 0) })
    driftTween:Play()

    -- Twinkle tween (separate)
    local twinkleDuration = RNG:NextNumber(2, 5)
    local twinkleTween = TweenService:Create(star, TweenInfo.new(
      twinkleDuration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { BackgroundTransparency = RNG:NextNumber(0.6, 0.95) })
    twinkleTween:Play()
  end

  for i, star in ipairs(stars) do
    task.defer(function()
      task.wait(RNG:NextNumber(0, 2)) -- stagger start
      animateStar(star, i)
    end)
  end

  -- ── Multiple Nebula Clouds ─────────────────────────────────
  local nebulaConfigs = {
    { color = C.gold,                    size = 220, startX = 0.6, startY = 0.2, endX = 0.3, endY = 0.5, dur = 28, transp = 0.93 },
    { color = Color3.fromHex("4060ff"),  size = 180, startX = 0.2, startY = 0.6, endX = 0.5, endY = 0.3, dur = 32, transp = 0.95 },
    { color = Color3.fromHex("8040c0"),  size = 140, startX = 0.8, startY = 0.7, endX = 0.4, endY = 0.8, dur = 22, transp = 0.96 },
  }

  for ni, nc in ipairs(nebulaConfigs) do
    local neb = Instance.new("Frame")
    neb.Name                  = "Nebula_" .. ni
    neb.Size                  = UDim2.new(0, nc.size, 0, nc.size)
    neb.Position              = UDim2.new(nc.startX, -nc.size/2, nc.startY, -nc.size/2)
    neb.BackgroundColor3      = nc.color
    neb.BackgroundTransparency = nc.transp
    neb.BorderSizePixel       = 0
    neb.ZIndex                = 1
    neb.Parent                = root

    local nc2 = Instance.new("UICorner")
    nc2.CornerRadius = UDim.new(1, 0)
    nc2.Parent       = neb

    -- Drift
    TweenService:Create(neb, TweenInfo.new(
      nc.dur, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { Position = UDim2.new(nc.endX, -nc.size/2, nc.endY, -nc.size/2) }):Play()

    -- Pulse size
    TweenService:Create(neb, TweenInfo.new(
      nc.dur * 0.7, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { Size = UDim2.new(0, nc.size * 1.3, 0, nc.size * 1.3) }):Play()
  end

  -- ── Shooting Stars ────────────────────────────────────────
  local function spawnShootingStar()
    local ss = Instance.new("Frame")
    ss.Name                  = "ShootingStar"
    ss.Size                  = UDim2.new(0, RNG:NextInteger(20, 50), 0, 1)
    ss.Position              = UDim2.new(RNG:NextNumber(-0.1, 0.5), 0, RNG:NextNumber(-0.05, 0.3), 0)
    ss.BackgroundColor3      = Color3.fromHex("ffffff")
    ss.BackgroundTransparency = 0.2
    ss.Rotation              = RNG:NextNumber(25, 45)
    ss.BorderSizePixel       = 0
    ss.ZIndex                = 2
    ss.Parent                = starsLayer

    -- Fade trail effect via UIGradient
    local grad = Instance.new("UIGradient")
    grad.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromHex("ffffff")),
      ColorSequenceKeypoint.new(1, Color3.fromHex("ffffff")),
    })
    grad.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0),
      NumberSequenceKeypoint.new(0.3, 0.5),
      NumberSequenceKeypoint.new(1, 1),
    })
    grad.Parent = ss

    local duration = RNG:NextNumber(0.4, 0.8)
    local endX = ss.Position.X.Scale + RNG:NextNumber(0.5, 1.2)
    local endY = ss.Position.Y.Scale + RNG:NextNumber(0.3, 0.7)

    local moveTween = TweenService:Create(ss, TweenInfo.new(
      duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out
    ), {
      Position = UDim2.new(endX, 0, endY, 0),
      BackgroundTransparency = 1,
    })
    moveTween:Play()
    moveTween.Completed:Connect(function()
      ss:Destroy()
    end)
  end

  -- Spawn shooting stars at random intervals
  task.spawn(function()
    while root.Parent do
      task.wait(RNG:NextNumber(3, 8))
      if root.Parent then
        spawnShootingStar()
      end
    end
  end)

  -- ── Header ────────────────────────────────────────────────
  local header = Instance.new("Frame")
  header.Name             = "Header"
  header.Size             = UDim2.new(1, 0, 0, 56)
  header.BackgroundColor3 = C.surface
  header.BackgroundTransparency = 0.15
  header.BorderSizePixel  = 0
  header.ZIndex           = 10
  header.Parent           = root

  -- Gold accent line at top with shimmer
  local topAccent = Instance.new("Frame")
  topAccent.Name             = "TopAccent"
  topAccent.Size             = UDim2.new(1, 0, 0, 2)
  topAccent.Position         = UDim2.new(0, 0, 0, 0)
  topAccent.BackgroundColor3 = C.gold
  topAccent.BorderSizePixel  = 0
  topAccent.ZIndex           = 11
  topAccent.ClipsDescendants = true
  topAccent.Parent           = header

  -- Shimmer highlight that sweeps across the accent line
  local shimmer = Instance.new("Frame")
  shimmer.Name                  = "Shimmer"
  shimmer.Size                  = UDim2.new(0.3, 0, 1, 0)
  shimmer.Position              = UDim2.new(-0.3, 0, 0, 0)
  shimmer.BackgroundColor3      = Color3.fromHex("ffffff")
  shimmer.BackgroundTransparency = 0.5
  shimmer.BorderSizePixel       = 0
  shimmer.ZIndex                = 12
  shimmer.Parent                = topAccent

  local shimmerGrad = Instance.new("UIGradient")
  shimmerGrad.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),
    NumberSequenceKeypoint.new(0.4, 0),
    NumberSequenceKeypoint.new(0.6, 0),
    NumberSequenceKeypoint.new(1, 1),
  })
  shimmerGrad.Parent = shimmer

  -- Loop shimmer sweep
  task.spawn(function()
    while root.Parent do
      shimmer.Position = UDim2.new(-0.3, 0, 0, 0)
      local sw = TweenService:Create(shimmer, TweenInfo.new(
        2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut
      ), { Position = UDim2.new(1.0, 0, 0, 0) })
      sw:Play()
      sw.Completed:Wait()
      task.wait(4) -- pause between sweeps
    end
  end)

  -- Logo icon (gold diamond)
  local logoIcon = Instance.new("TextLabel")
  logoIcon.Name                  = "LogoIcon"
  logoIcon.Text                  = "\226\156\166" -- ✦
  logoIcon.Font                  = Enum.Font.SourceSans
  logoIcon.TextSize              = 18
  logoIcon.TextColor3            = C.gold
  logoIcon.BackgroundTransparency = 1
  logoIcon.Size                  = UDim2.new(0, 24, 0, 24)
  logoIcon.Position              = UDim2.new(0, 14, 0, 16)
  logoIcon.Parent                = header

  local logoText = Instance.new("TextLabel")
  logoText.Name                  = "LogoText"
  logoText.Text                  = "ForjeGames"
  logoText.Font                  = Enum.Font.GothamBold
  logoText.TextSize              = 15
  logoText.TextColor3            = C.text
  logoText.BackgroundTransparency = 1
  logoText.Size                  = UDim2.new(0, 120, 0, 20)
  logoText.Position              = UDim2.new(0, 38, 0, 12)
  logoText.TextXAlignment        = Enum.TextXAlignment.Left
  logoText.Parent                = header

  local versionLabel = Instance.new("TextLabel")
  versionLabel.Name                  = "Version"
  versionLabel.Text                  = "v4.4.0"
  versionLabel.Font                  = Enum.Font.Gotham
  versionLabel.TextSize              = 9
  versionLabel.TextColor3            = C.textDim
  versionLabel.BackgroundTransparency = 1
  versionLabel.Size                  = UDim2.new(0, 40, 0, 14)
  versionLabel.Position              = UDim2.new(0, 38, 0, 33)
  versionLabel.TextXAlignment        = Enum.TextXAlignment.Left
  versionLabel.Parent                = header

  -- Status indicator (right side of header)
  local statusFrame = Instance.new("Frame")
  statusFrame.Name             = "StatusFrame"
  statusFrame.Size             = UDim2.new(0, 80, 0, 24)
  statusFrame.Position         = UDim2.new(1, -94, 0, 16)
  statusFrame.BackgroundColor3 = state.authenticated and Color3.fromHex("061e14") or C.surface
  statusFrame.BorderSizePixel  = 0
  statusFrame.Parent           = header

  local statusCorner = Instance.new("UICorner")
  statusCorner.CornerRadius = UDim.new(0, 12)
  statusCorner.Parent       = statusFrame

  local statusDot = Instance.new("Frame")
  statusDot.Name             = "StatusDot"
  statusDot.Size             = UDim2.new(0, 6, 0, 6)
  statusDot.Position         = UDim2.new(0, 10, 0.5, -3)
  statusDot.BackgroundColor3 = state.authenticated and C.success or C.textDim
  statusDot.BorderSizePixel  = 0
  statusDot.Parent           = statusFrame

  local dotCorner = Instance.new("UICorner")
  dotCorner.CornerRadius = UDim.new(1, 0)
  dotCorner.Parent       = statusDot

  local statusText = Instance.new("TextLabel")
  statusText.Name                  = "StatusText"
  statusText.Text                  = state.authenticated and "Online" or "Offline"
  statusText.Font                  = Enum.Font.Gotham
  statusText.TextSize              = 10
  statusText.TextColor3            = state.authenticated and C.success or C.textDim
  statusText.BackgroundTransparency = 1
  statusText.Size                  = UDim2.new(1, -24, 1, 0)
  statusText.Position              = UDim2.new(0, 22, 0, 0)
  statusText.TextXAlignment        = Enum.TextXAlignment.Left
  statusText.Parent                = statusFrame

  -- Pulsing glow ring behind status dot
  local dotGlow = Instance.new("Frame")
  dotGlow.Name                  = "DotGlow"
  dotGlow.Size                  = UDim2.new(0, 14, 0, 14)
  dotGlow.Position              = UDim2.new(0, 6, 0.5, -7)
  dotGlow.BackgroundColor3      = state.authenticated and C.success or C.textDim
  dotGlow.BackgroundTransparency = 0.7
  dotGlow.BorderSizePixel       = 0
  dotGlow.ZIndex                = 9
  dotGlow.Parent                = statusFrame

  local dotGlowCorner = Instance.new("UICorner")
  dotGlowCorner.CornerRadius = UDim.new(1, 0)
  dotGlowCorner.Parent       = dotGlow

  -- Pulse animation
  TweenService:Create(dotGlow, TweenInfo.new(
    1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
  ), {
    Size = UDim2.new(0, 20, 0, 20),
    Position = UDim2.new(0, 3, 0.5, -10),
    BackgroundTransparency = 0.9,
  }):Play()

  -- Logo sparkle: rotating ✦
  TweenService:Create(logoIcon, TweenInfo.new(
    6, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1, false
  ), { Rotation = 360 }):Play()

  -- Header border
  local headerBorder = Instance.new("Frame")
  headerBorder.Name             = "HeaderBorder"
  headerBorder.Size             = UDim2.new(1, 0, 0, 1)
  headerBorder.Position         = UDim2.new(0, 0, 1, -1)
  headerBorder.BackgroundColor3 = C.border
  headerBorder.BorderSizePixel  = 0
  headerBorder.Parent           = header

  -- ── Scrollable content ────────────────────────────────────
  local scroll = Instance.new("ScrollingFrame")
  scroll.Name                  = "Content"
  scroll.Size                  = UDim2.new(1, 0, 1, -56)
  scroll.Position              = UDim2.new(0, 0, 0, 56)
  scroll.BackgroundTransparency = 1
  scroll.BorderSizePixel       = 0
  scroll.ScrollBarThickness    = 3
  scroll.ScrollBarImageColor3  = C.gold
  scroll.AutomaticCanvasSize   = Enum.AutomaticSize.Y
  scroll.CanvasSize            = UDim2.new(0, 0, 0, 0)
  scroll.ZIndex                = 10
  scroll.Parent                = root

  local layout = Instance.new("UIListLayout")
  layout.FillDirection       = Enum.FillDirection.Vertical
  layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
  layout.SortOrder           = Enum.SortOrder.LayoutOrder
  layout.Padding             = UDim.new(0, 8)
  layout.Parent              = scroll

  local pad = Instance.new("UIPadding")
  pad.PaddingTop    = UDim.new(0, 12)
  pad.PaddingLeft   = UDim.new(0, 12)
  pad.PaddingRight  = UDim.new(0, 12)
  pad.PaddingBottom = UDim.new(0, 12)
  pad.Parent        = scroll

  -- ── Helper: glassmorphic chat-bubble card with entrance anim ──
  local cardIndex = 0
  local function makeCard(name, height, order)
    cardIndex = cardIndex + 1
    local myIndex = cardIndex

    local f = Instance.new("Frame")
    f.Name                  = name
    f.Size                  = UDim2.new(1, 0, 0, height)
    f.BackgroundColor3      = C.surface2
    f.BackgroundTransparency = 1  -- start invisible for entrance anim
    f.BorderSizePixel       = 0
    f.LayoutOrder           = order
    f.ZIndex                = 10
    f.Parent                = scroll

    -- Chat bubble corners (rounder)
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent       = f

    -- Glass border: subtle glow stroke
    local stroke = Instance.new("UIStroke")
    stroke.Color        = Color3.fromHex("2a3050")
    stroke.Thickness    = 1
    stroke.Transparency = 1  -- start invisible
    stroke.Parent       = f

    -- Inner glow: faint gold shimmer at top of card
    local glow = Instance.new("Frame")
    glow.Name                  = "InnerGlow"
    glow.Size                  = UDim2.new(1, -2, 0, 1)
    glow.Position              = UDim2.new(0, 1, 0, 1)
    glow.BackgroundColor3      = C.gold
    glow.BackgroundTransparency = 1
    glow.BorderSizePixel       = 0
    glow.ZIndex                = 11
    glow.Parent                = f

    local glowCorner = Instance.new("UICorner")
    glowCorner.CornerRadius = UDim.new(0, 16)
    glowCorner.Parent       = glow

    -- Entrance animation: staggered fade-in + scale
    task.defer(function()
      task.wait(0.15 * myIndex)  -- stagger each card

      -- Fade in card
      TweenService:Create(f, TweenInfo.new(
        0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out
      ), { BackgroundTransparency = 0.25 }):Play()

      -- Fade in stroke
      TweenService:Create(stroke, TweenInfo.new(
        0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out
      ), { Transparency = 0.2 }):Play()

      -- Fade in glow
      TweenService:Create(glow, TweenInfo.new(
        0.6, Enum.EasingStyle.Quart, Enum.EasingDirection.Out
      ), { BackgroundTransparency = 0.85 }):Play()
    end)

    -- Hover: card lifts (slight glass brighten)
    f.InputBegan:Connect(function(input)
      if input.UserInputType == Enum.UserInputType.MouseMovement then
        TweenService:Create(f, TweenInfo.new(0.2), { BackgroundTransparency = 0.15 }):Play()
        TweenService:Create(stroke, TweenInfo.new(0.2), { Color = Color3.fromHex("3a4a70"), Transparency = 0.1 }):Play()
      end
    end)
    f.InputEnded:Connect(function(input)
      if input.UserInputType == Enum.UserInputType.MouseMovement then
        TweenService:Create(f, TweenInfo.new(0.3), { BackgroundTransparency = 0.25 }):Play()
        TweenService:Create(stroke, TweenInfo.new(0.3), { Color = Color3.fromHex("2a3050"), Transparency = 0.2 }):Play()
      end
    end)

    return f
  end

  -- ============================================================
  -- 1. CONNECTION CARD
  -- ============================================================
  local authCard = makeCard("AuthCard", state.authenticated and 100 or 210, 1)

  -- Card header with icon
  local authIcon = Instance.new("TextLabel")
  authIcon.Name                  = "AuthIcon"
  authIcon.Text                  = state.authenticated and "\226\156\147" or "\240\159\148\151" -- ✓ or 🔗
  authIcon.Font                  = Enum.Font.SourceSans
  authIcon.TextSize              = 16
  authIcon.TextColor3            = state.authenticated and C.success or C.gold
  authIcon.BackgroundTransparency = 1
  authIcon.Size                  = UDim2.new(0, 20, 0, 20)
  authIcon.Position              = UDim2.new(0, 14, 0, 14)
  authIcon.Parent                = authCard

  local authTitle = Instance.new("TextLabel")
  authTitle.Name                  = "AuthTitle"
  authTitle.Text                  = state.authenticated and "Connected" or "Connect to ForjeGames"
  authTitle.Font                  = Enum.Font.GothamBold
  authTitle.TextSize              = 13
  authTitle.TextColor3            = C.text
  authTitle.BackgroundTransparency = 1
  authTitle.Size                  = UDim2.new(1, -80, 0, 18)
  authTitle.Position              = UDim2.new(0, 38, 0, 14)
  authTitle.TextXAlignment        = Enum.TextXAlignment.Left
  authTitle.Parent                = authCard

  local authStatus = Instance.new("TextLabel")
  authStatus.Name                  = "AuthStatus"
  authStatus.Text                  = state.authenticated and "Session active" or "Enter your 6-character connection code"
  authStatus.Font                  = Enum.Font.Gotham
  authStatus.TextSize              = 11
  authStatus.TextColor3            = C.textSec
  authStatus.BackgroundTransparency = 1
  authStatus.Size                  = UDim2.new(1, -28, 0, 14)
  authStatus.Position              = UDim2.new(0, 38, 0, 34)
  authStatus.TextXAlignment        = Enum.TextXAlignment.Left
  authStatus.TextWrapped           = true
  authStatus.Parent                = authCard

  -- Code input area (hidden when authenticated) — glass pill style
  local codeInputFrame = Instance.new("Frame")
  codeInputFrame.Name                  = "CodeInputFrame"
  codeInputFrame.Size                  = UDim2.new(1, -28, 0, 44)
  codeInputFrame.Position              = UDim2.new(0, 14, 0, 60)
  codeInputFrame.BackgroundColor3      = C.input
  codeInputFrame.BackgroundTransparency = 0.3
  codeInputFrame.BorderSizePixel       = 0
  codeInputFrame.Visible               = not state.authenticated
  codeInputFrame.Parent                = authCard

  local codeInputCorner = Instance.new("UICorner")
  codeInputCorner.CornerRadius = UDim.new(0, 12)
  codeInputCorner.Parent       = codeInputFrame

  local codeInputStroke = Instance.new("UIStroke")
  codeInputStroke.Color        = Color3.fromHex("2a3050")
  codeInputStroke.Thickness    = 1
  codeInputStroke.Transparency = 0.2
  codeInputStroke.Parent       = codeInputFrame

  local codeBox = Instance.new("TextBox")
  codeBox.Name             = "CodeBox"
  codeBox.PlaceholderText  = "Enter code (e.g. ABC123)"
  codeBox.PlaceholderColor3 = C.textDim
  codeBox.Text             = ""
  codeBox.Font             = Enum.Font.GothamBold
  codeBox.TextSize         = 18
  codeBox.TextColor3       = C.text
  codeBox.BackgroundTransparency = 1
  codeBox.Size             = UDim2.new(1, -16, 1, 0)
  codeBox.Position         = UDim2.new(0, 8, 0, 0)
  codeBox.TextXAlignment   = Enum.TextXAlignment.Center
  codeBox.ClearTextOnFocus = false
  codeBox.Parent           = codeInputFrame

  -- Instruction text
  local instrLabel = Instance.new("TextLabel")
  instrLabel.Name                  = "InstrLabel"
  instrLabel.Text                  = "Get your code at forjegames.com/editor"
  instrLabel.Font                  = Enum.Font.Gotham
  instrLabel.TextSize              = 10
  instrLabel.TextColor3            = C.textDim
  instrLabel.BackgroundTransparency = 1
  instrLabel.Size                  = UDim2.new(1, -28, 0, 14)
  instrLabel.Position              = UDim2.new(0, 14, 0, 106)
  instrLabel.TextXAlignment        = Enum.TextXAlignment.Center
  instrLabel.Visible               = not state.authenticated
  instrLabel.Parent                = authCard

  -- Connect / Disconnect button — glass pill
  local authBtn = Instance.new("TextButton")
  authBtn.Name                  = "AuthBtn"
  authBtn.Size                  = UDim2.new(1, -28, 0, 40)
  authBtn.Position              = UDim2.new(0, 14, 0, state.authenticated and 56 or 128)
  authBtn.BackgroundColor3      = state.authenticated and C.surface2 or C.gold
  authBtn.BackgroundTransparency = state.authenticated and 0.4 or 0
  authBtn.BorderSizePixel       = 0
  authBtn.Text                  = state.authenticated and "Disconnect" or "Connect"
  authBtn.Font                  = Enum.Font.GothamBold
  authBtn.TextSize              = 13
  authBtn.TextColor3            = state.authenticated and C.textSec or Color3.fromHex("050810")
  authBtn.AutoButtonColor       = false
  authBtn.ZIndex                = 11
  authBtn.Parent                = authCard

  local authBtnCorner = Instance.new("UICorner")
  authBtnCorner.CornerRadius = UDim.new(0, 12)
  authBtnCorner.Parent       = authBtn

  local authBtnStroke = Instance.new("UIStroke")
  authBtnStroke.Color        = state.authenticated and Color3.fromHex("2a3050") or C.borderFocus
  authBtnStroke.Thickness    = 1
  authBtnStroke.Transparency = 0.2
  authBtnStroke.Parent       = authBtn

  authBtn.MouseEnter:Connect(function()
    if state.authenticated then
      authBtn.BackgroundTransparency = 0.2
    else
      authBtn.BackgroundColor3 = C.goldLight
    end
  end)
  authBtn.MouseLeave:Connect(function()
    if state.authenticated then
      authBtn.BackgroundColor3 = C.surface2
      authBtn.BackgroundTransparency = 0.4
    else
      authBtn.BackgroundColor3 = C.gold
      authBtn.BackgroundTransparency = 0
    end
  end)

  -- Error display label (hidden by default)
  local errorLabel = Instance.new("TextLabel")
  errorLabel.Name                  = "ErrorLabel"
  errorLabel.Text                  = ""
  errorLabel.Font                  = Enum.Font.Gotham
  errorLabel.TextSize              = 10
  errorLabel.TextColor3            = C.error
  errorLabel.BackgroundTransparency = 1
  errorLabel.Size                  = UDim2.new(1, -28, 0, 14)
  errorLabel.Position              = UDim2.new(0, 14, 0, 170)
  errorLabel.TextXAlignment        = Enum.TextXAlignment.Center
  errorLabel.Visible               = false
  errorLabel.TextWrapped           = true
  errorLabel.Parent                = authCard

  -- ============================================================
  -- 2. SYNC STATUS CARD
  -- ============================================================
  local syncCard = makeCard("SyncCard", 80, 2)

  local syncIcon = Instance.new("TextLabel")
  syncIcon.Name                  = "SyncIcon"
  syncIcon.Text                  = "\226\134\187" -- ↻
  syncIcon.Font                  = Enum.Font.SourceSans
  syncIcon.TextSize              = 16
  syncIcon.TextColor3            = C.textDim
  syncIcon.BackgroundTransparency = 1
  syncIcon.Size                  = UDim2.new(0, 20, 0, 20)
  syncIcon.Position              = UDim2.new(0, 14, 0, 14)
  syncIcon.Parent                = syncCard

  local syncTitle = Instance.new("TextLabel")
  syncTitle.Name                  = "SyncTitle"
  syncTitle.Text                  = "Studio Sync"
  syncTitle.Font                  = Enum.Font.GothamBold
  syncTitle.TextSize              = 12
  syncTitle.TextColor3            = C.text
  syncTitle.BackgroundTransparency = 1
  syncTitle.Size                  = UDim2.new(1, -80, 0, 16)
  syncTitle.Position              = UDim2.new(0, 38, 0, 12)
  syncTitle.TextXAlignment        = Enum.TextXAlignment.Left
  syncTitle.Parent                = syncCard

  local connStatusLabel = Instance.new("TextLabel")
  connStatusLabel.Name                  = "ConnStatus"
  connStatusLabel.Text                  = "Waiting for connection..."
  connStatusLabel.Font                  = Enum.Font.Gotham
  connStatusLabel.TextSize              = 11
  connStatusLabel.TextColor3            = C.textDim
  connStatusLabel.BackgroundTransparency = 1
  connStatusLabel.Size                  = UDim2.new(1, -28, 0, 14)
  connStatusLabel.Position              = UDim2.new(0, 38, 0, 30)
  connStatusLabel.TextXAlignment        = Enum.TextXAlignment.Left
  connStatusLabel.Parent                = syncCard

  local lastSyncLabel = Instance.new("TextLabel")
  lastSyncLabel.Name                  = "LastSync"
  lastSyncLabel.Text                  = ""
  lastSyncLabel.Font                  = Enum.Font.Gotham
  lastSyncLabel.TextSize              = 10
  lastSyncLabel.TextColor3            = C.textDim
  lastSyncLabel.BackgroundTransparency = 1
  lastSyncLabel.Size                  = UDim2.new(1, -28, 0, 14)
  lastSyncLabel.Position              = UDim2.new(0, 38, 0, 48)
  lastSyncLabel.TextXAlignment        = Enum.TextXAlignment.Left
  lastSyncLabel.Parent                = syncCard

  local pingLabel = Instance.new("TextLabel")
  pingLabel.Name                  = "Ping"
  pingLabel.Text                  = ""
  pingLabel.Font                  = Enum.Font.Gotham
  pingLabel.TextSize              = 10
  pingLabel.TextColor3            = C.textDim
  pingLabel.BackgroundTransparency = 1
  pingLabel.Size                  = UDim2.new(0, 60, 0, 14)
  pingLabel.Position              = UDim2.new(1, -74, 0, 14)
  pingLabel.TextXAlignment        = Enum.TextXAlignment.Right
  pingLabel.Parent                = syncCard

  -- ============================================================
  -- 3. QUICK ACTIONS CARD
  -- ============================================================
  local actionsCard = makeCard("ActionsCard", 200, 3)

  local actionsIcon = Instance.new("TextLabel")
  actionsIcon.Name                  = "ActionsIcon"
  actionsIcon.Text                  = "\226\154\161" -- ⚡
  actionsIcon.Font                  = Enum.Font.SourceSans
  actionsIcon.TextSize              = 14
  actionsIcon.TextColor3            = C.gold
  actionsIcon.BackgroundTransparency = 1
  actionsIcon.Size                  = UDim2.new(0, 20, 0, 20)
  actionsIcon.Position              = UDim2.new(0, 14, 0, 12)
  actionsIcon.Parent                = actionsCard

  local actionsTitle = Instance.new("TextLabel")
  actionsTitle.Name                  = "ActionsTitle"
  actionsTitle.Text                  = "Quick Actions"
  actionsTitle.Font                  = Enum.Font.GothamBold
  actionsTitle.TextSize              = 12
  actionsTitle.TextColor3            = C.text
  actionsTitle.BackgroundTransparency = 1
  actionsTitle.Size                  = UDim2.new(1, -40, 0, 16)
  actionsTitle.Position              = UDim2.new(0, 38, 0, 14)
  actionsTitle.TextXAlignment        = Enum.TextXAlignment.Left
  actionsTitle.Parent                = actionsCard

  -- Action button helper (glass pill style)
  local function makeActionBtn(parent, text, yPos, isPrimary)
    local btn = Instance.new("TextButton")
    btn.Name                  = "Btn_" .. text:gsub("%s+", "_")
    btn.Size                  = UDim2.new(1, -28, 0, 36)
    btn.Position              = UDim2.new(0, 14, 0, yPos)
    btn.BackgroundColor3      = isPrimary and C.goldGlow or C.surface
    btn.BackgroundTransparency = isPrimary and 0.3 or 0.4
    btn.BorderSizePixel       = 0
    btn.Text                  = text
    btn.Font                  = Enum.Font.GothamSemibold
    btn.TextSize              = 12
    btn.TextColor3            = isPrimary and C.gold or C.textSec
    btn.AutoButtonColor       = false
    btn.ZIndex                = 11
    btn.Parent                = parent

    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, 12)
    c.Parent       = btn

    local s = Instance.new("UIStroke")
    s.Color        = isPrimary and C.borderFocus or Color3.fromHex("2a3050")
    s.Thickness    = 1
    s.Transparency = 0.3
    s.Parent       = btn

    local hoverTransp = isPrimary and 0.1 or 0.2
    local normalTransp = isPrimary and 0.3 or 0.4

    btn.MouseEnter:Connect(function()
      btn.BackgroundTransparency = hoverTransp
      if isPrimary then
        btn.TextColor3 = C.goldLight
      else
        btn.TextColor3 = C.text
      end
    end)
    btn.MouseLeave:Connect(function()
      btn.BackgroundTransparency = normalTransp
      btn.TextColor3 = isPrimary and C.gold or C.textSec
    end)

    return btn
  end

  local actionButtons = {}
  local actions = {
    { text = "Generate Terrain",  primary = true },
    { text = "Generate City",     primary = true },
    { text = "Insert Asset",      primary = true },
    { text = "Undo Last AI Op",   primary = false },
  }

  for i, action in ipairs(actions) do
    local yPos = 40 + (i - 1) * 40
    actionButtons[i] = makeActionBtn(actionsCard, action.text, yPos, action.primary)
  end

  actionsCard.Size = UDim2.new(1, 0, 0, 40 + #actions * 40 + 8)

  -- ============================================================
  -- 4. RECENT BUILDS CARD
  -- ============================================================
  local recentCard = makeCard("RecentCard", 120, 4)

  local recentIcon = Instance.new("TextLabel")
  recentIcon.Name                  = "RecentIcon"
  recentIcon.Text                  = "\240\159\147\139" -- 📋
  recentIcon.Font                  = Enum.Font.SourceSans
  recentIcon.TextSize              = 14
  recentIcon.TextColor3            = C.textSec
  recentIcon.BackgroundTransparency = 1
  recentIcon.Size                  = UDim2.new(0, 20, 0, 20)
  recentIcon.Position              = UDim2.new(0, 14, 0, 12)
  recentIcon.Parent                = recentCard

  local recentTitle = Instance.new("TextLabel")
  recentTitle.Name                  = "RecentTitle"
  recentTitle.Text                  = "Recent Builds"
  recentTitle.Font                  = Enum.Font.GothamBold
  recentTitle.TextSize              = 12
  recentTitle.TextColor3            = C.text
  recentTitle.BackgroundTransparency = 1
  recentTitle.Size                  = UDim2.new(1, -40, 0, 16)
  recentTitle.Position              = UDim2.new(0, 38, 0, 14)
  recentTitle.TextXAlignment        = Enum.TextXAlignment.Left
  recentTitle.Parent                = recentCard

  local recentList = Instance.new("Frame")
  recentList.Name             = "RecentList"
  recentList.Size             = UDim2.new(1, -28, 1, -44)
  recentList.Position         = UDim2.new(0, 14, 0, 40)
  recentList.BackgroundTransparency = 1
  recentList.Parent           = recentCard

  local recentListLayout = Instance.new("UIListLayout")
  recentListLayout.FillDirection = Enum.FillDirection.Vertical
  recentListLayout.Padding       = UDim.new(0, 4)
  recentListLayout.Parent        = recentList

  local emptyLabel = Instance.new("TextLabel")
  emptyLabel.Name                  = "EmptyLabel"
  emptyLabel.Text                  = "No builds yet — connect to get started"
  emptyLabel.Font                  = Enum.Font.Gotham
  emptyLabel.TextSize              = 11
  emptyLabel.TextColor3            = C.textDim
  emptyLabel.BackgroundTransparency = 1
  emptyLabel.Size                  = UDim2.new(1, 0, 0, 40)
  emptyLabel.TextXAlignment        = Enum.TextXAlignment.Center
  emptyLabel.Parent                = recentList

  -- ============================================================
  -- 5. FOOTER
  -- ============================================================
  local footer = Instance.new("TextLabel")
  footer.Name                  = "Footer"
  footer.Text                  = "forjegames.com"
  footer.Font                  = Enum.Font.Gotham
  footer.TextSize              = 9
  footer.TextColor3            = C.textDim
  footer.BackgroundTransparency = 1
  footer.Size                  = UDim2.new(1, 0, 0, 20)
  footer.LayoutOrder           = 99
  footer.TextXAlignment        = Enum.TextXAlignment.Center
  footer.Parent                = scroll

  -- ============================================================
  -- Public API
  -- ============================================================
  local refs = {
    statusDot       = statusDot,
    statusText      = statusText,
    statusFrame     = statusFrame,
    authTitle       = authTitle,
    authStatus      = authStatus,
    authBtn         = authBtn,
    authCard        = authCard,
    authIcon        = authIcon,
    codeBox         = codeBox,
    codeInputFrame  = codeInputFrame,
    instrLabel      = instrLabel,
    errorLabel      = errorLabel,
    connStatusLabel = connStatusLabel,
    lastSyncLabel   = lastSyncLabel,
    pingLabel       = pingLabel,
    syncIcon        = syncIcon,
    actionButtons   = actionButtons,
    recentList      = recentList,
    recentCard      = recentCard,
    emptyLabel      = emptyLabel,
    COLORS          = C,
  }

  -- ── Update: authenticated ──
  function refs.setAuthenticated(email)
    authTitle.Text       = "Connected"
    authTitle.TextColor3 = C.text
    authIcon.Text        = "\226\156\147" -- ✓
    authIcon.TextColor3  = C.success
    authStatus.Text      = email and ("Signed in as " .. email) or "Session active"
    authStatus.TextColor3 = C.textSec
    authBtn.Text         = "Disconnect"
    authBtn.TextColor3   = C.textSec
    authBtn.BackgroundColor3 = C.surface2
    codeInputFrame.Visible = false
    instrLabel.Visible     = false
    errorLabel.Visible     = false
    authCard.Size          = UDim2.new(1, 0, 0, 100)
    authBtn.Position       = UDim2.new(0, 14, 0, 56)
    statusDot.BackgroundColor3 = C.success
    statusText.Text            = "Online"
    statusText.TextColor3      = C.success
    statusFrame.BackgroundColor3 = Color3.fromHex("061e14")
  end

  -- ── Update: disconnected ──
  function refs.setDisconnected()
    authTitle.Text       = "Connect to ForjeGames"
    authTitle.TextColor3 = C.text
    authIcon.Text        = "\240\159\148\151" -- 🔗
    authIcon.TextColor3  = C.gold
    authStatus.Text      = "Enter your 6-character connection code"
    authStatus.TextColor3 = C.textSec
    authBtn.Text         = "Connect"
    authBtn.TextColor3   = Color3.fromHex("0a0a0a")
    authBtn.BackgroundColor3 = C.gold
    codeInputFrame.Visible = true
    instrLabel.Visible     = true
    errorLabel.Visible     = false
    authCard.Size          = UDim2.new(1, 0, 0, 210)
    authBtn.Position       = UDim2.new(0, 14, 0, 126)
    statusDot.BackgroundColor3 = C.textDim
    statusText.Text            = "Offline"
    statusText.TextColor3      = C.textDim
    statusFrame.BackgroundColor3 = C.surface
  end

  -- ── Update: show error ──
  function refs.showError(msg)
    errorLabel.Text    = msg or ""
    errorLabel.Visible = (msg ~= nil and msg ~= "")
  end

  -- ── Update: sync status (simple boolean) ──
  function refs.setSyncConnected(connected)
    if connected then
      connStatusLabel.Text       = "Syncing with forjegames.com"
      connStatusLabel.TextColor3 = C.success
      syncIcon.TextColor3        = C.success
    else
      connStatusLabel.Text       = "Waiting for connection..."
      connStatusLabel.TextColor3 = C.textDim
      syncIcon.TextColor3        = C.textDim
    end
  end

  -- ── Update: rich connection status ──
  -- statusKey: "connecting"|"connected"|"reconnecting"|"disconnected"|"http_disabled"|"idle"
  -- messageOverride: optional string to display in connStatusLabel
  function refs.setConnectionStatus(statusKey, messageOverride)
    local STATUS_MAP = {
      connecting    = { label = "Connecting...",               color = C.warning, dot = C.warning, bg = Color3.fromHex("1c1107"), header = "Connecting..."  },
      connected     = { label = "Syncing with forjegames.com", color = C.success, dot = C.success, bg = Color3.fromHex("052e16"), header = "Online"          },
      reconnecting  = { label = "Reconnecting...",             color = C.warning, dot = C.warning, bg = Color3.fromHex("1c1107"), header = "Reconnecting..." },
      disconnected  = { label = "Disconnected",               color = C.error,   dot = C.error,   bg = Color3.fromHex("1f0707"), header = "Offline"         },
      http_disabled = { label = "Error: HTTP not enabled",    color = C.error,   dot = C.error,   bg = Color3.fromHex("1f0707"), header = "Error"           },
      idle          = { label = "Waiting for connection...",   color = C.textDim, dot = C.textDim, bg = Color3.fromHex("1c1917"), header = "Offline"         },
    }

    local d = STATUS_MAP[statusKey] or STATUS_MAP.idle

    -- Sync card
    connStatusLabel.Text       = messageOverride or d.label
    connStatusLabel.TextColor3 = d.color
    syncIcon.TextColor3        = d.color

    -- Header pill
    statusDot.BackgroundColor3   = d.dot
    statusText.Text              = d.header
    statusText.TextColor3        = d.color
    statusFrame.BackgroundColor3 = d.bg
  end

  -- ── Add recent build ──
  function refs.addRecentBuild(buildName, buildType, timestamp)
    emptyLabel.Visible = false

    local entry = Instance.new("Frame")
    entry.Name             = "Build_" .. tostring(timestamp)
    entry.Size             = UDim2.new(1, 0, 0, 26)
    entry.BackgroundTransparency = 1
    entry.Parent           = recentList

    local dot = Instance.new("Frame")
    dot.Size             = UDim2.new(0, 5, 0, 5)
    dot.Position         = UDim2.new(0, 0, 0.5, -2)
    dot.BackgroundColor3 = C.gold
    dot.BorderSizePixel  = 0
    dot.Parent           = entry

    local dotC = Instance.new("UICorner")
    dotC.CornerRadius = UDim.new(1, 0)
    dotC.Parent       = dot

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Text                  = buildName
    nameLabel.Font                  = Enum.Font.Gotham
    nameLabel.TextSize              = 11
    nameLabel.TextColor3            = C.text
    nameLabel.BackgroundTransparency = 1
    nameLabel.Size                  = UDim2.new(0.6, -14, 1, 0)
    nameLabel.Position              = UDim2.new(0, 14, 0, 0)
    nameLabel.TextXAlignment        = Enum.TextXAlignment.Left
    nameLabel.TextTruncate           = Enum.TextTruncate.AtEnd
    nameLabel.Parent                = entry

    local typeLabel = Instance.new("TextLabel")
    typeLabel.Text                  = buildType
    typeLabel.Font                  = Enum.Font.Gotham
    typeLabel.TextSize              = 10
    typeLabel.TextColor3            = C.gold
    typeLabel.BackgroundTransparency = 1
    typeLabel.Size                  = UDim2.new(0.4, 0, 1, 0)
    typeLabel.Position              = UDim2.new(0.6, 0, 0, 0)
    typeLabel.TextXAlignment        = Enum.TextXAlignment.Right
    typeLabel.Parent                = entry

    -- Keep only last 5
    local children = recentList:GetChildren()
    local count = 0
    for _, c in ipairs(children) do
      if c:IsA("Frame") then count = count + 1 end
    end
    if count > 5 then
      for _, c in ipairs(children) do
        if c:IsA("Frame") then c:Destroy() break end
      end
    end

    recentCard.Size = UDim2.new(1, 0, 0, 40 + math.min(count + 1, 5) * 30 + 8)
  end

  return refs
end

return UI
