--[[
  ForjeGames Studio Plugin — UI.lua (Simplified)
  Space theme: #050510 bg, stars, #D4AF37 gold accent
  3 elements: code entry, connect button, undo last build
--]]

local UI = {}

-- ============================================================
-- Build the complete plugin UI
-- ============================================================
function UI.build(widget, state, COLORS, pluginRef)

  local C = {
    bg        = Color3.fromHex("050510"),  -- deep space black
    surface   = Color3.fromHex("0A0F20"),
    surface2  = Color3.fromHex("0E1428"),
    gold      = Color3.fromHex("D4AF37"),
    goldLight = Color3.fromHex("FFD166"),
    text      = Color3.fromHex("FFFFFF"),
    textSec   = Color3.fromHex("C8CCD8"),
    textDim   = Color3.fromHex("9CA3B8"),
    success   = Color3.fromHex("22c55e"),
    error     = Color3.fromHex("ef4444"),
    warning   = Color3.fromHex("f59e0b"),
    border    = Color3.fromHex("1a1f35"),
    borderFocus = Color3.fromHex("3d3520"),
    input     = Color3.fromHex("080d1a"),
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
  local function animateStar(star)
    local duration = RNG:NextNumber(8, 20)
    local startX = RNG:NextNumber(0, 1)
    local startY = RNG:NextNumber(0, 1)
    local endX   = startX + RNG:NextNumber(-0.15, 0.15)
    local endY   = startY - RNG:NextNumber(0.05, 0.2)

    star.Position = UDim2.new(startX, 0, startY, 0)

    TweenService:Create(star, TweenInfo.new(
      duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { Position = UDim2.new(endX, 0, endY, 0) }):Play()

    local twinkleDuration = RNG:NextNumber(2, 5)
    TweenService:Create(star, TweenInfo.new(
      twinkleDuration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
    ), { BackgroundTransparency = RNG:NextNumber(0.6, 0.95) }):Play()
  end

  for i, star in ipairs(stars) do
    task.defer(function()
      task.wait(RNG:NextNumber(0, 2))
      animateStar(star)
    end)
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

  task.spawn(function()
    while root.Parent do
      task.wait(RNG:NextNumber(3, 8))
      if root.Parent then
        spawnShootingStar()
      end
    end
  end)

  -- ── Content container (centered vertically) ───────────────
  local content = Instance.new("Frame")
  content.Name             = "Content"
  content.Size             = UDim2.new(1, -40, 0, 340)
  content.Position         = UDim2.new(0, 20, 0.5, -170)
  content.BackgroundTransparency = 1
  content.BorderSizePixel  = 0
  content.ZIndex           = 10
  content.Parent           = root

  -- ── Logo / Title ──────────────────────────────────────────
  local logoIcon = Instance.new("TextLabel")
  logoIcon.Name                  = "LogoIcon"
  logoIcon.Text                  = "\226\156\166" -- ✦
  logoIcon.Font                  = Enum.Font.SourceSans
  logoIcon.TextSize              = 22
  logoIcon.TextColor3            = C.gold
  logoIcon.BackgroundTransparency = 1
  logoIcon.Size                  = UDim2.new(1, 0, 0, 24)
  logoIcon.Position              = UDim2.new(0, 0, 0, 0)
  logoIcon.TextXAlignment        = Enum.TextXAlignment.Center
  logoIcon.ZIndex                = 10
  logoIcon.Parent                = content

  -- Rotate the star icon
  TweenService:Create(logoIcon, TweenInfo.new(
    6, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1, false
  ), { Rotation = 360 }):Play()

  local logoText = Instance.new("TextLabel")
  logoText.Name                  = "LogoText"
  logoText.Text                  = "ForjeGames"
  logoText.Font                  = Enum.Font.GothamBold
  logoText.TextSize              = 20
  logoText.TextColor3            = C.gold
  logoText.BackgroundTransparency = 1
  logoText.Size                  = UDim2.new(1, 0, 0, 24)
  logoText.Position              = UDim2.new(0, 0, 0, 28)
  logoText.TextXAlignment        = Enum.TextXAlignment.Center
  logoText.ZIndex                = 10
  logoText.Parent                = content

  local versionLabel = Instance.new("TextLabel")
  versionLabel.Name                  = "Version"
  versionLabel.Text                  = "v4.7.0"
  versionLabel.Font                  = Enum.Font.Gotham
  versionLabel.TextSize              = 11
  versionLabel.TextColor3            = C.textDim
  versionLabel.BackgroundTransparency = 1
  versionLabel.Size                  = UDim2.new(1, 0, 0, 14)
  versionLabel.Position              = UDim2.new(0, 0, 0, 54)
  versionLabel.TextXAlignment        = Enum.TextXAlignment.Center
  versionLabel.ZIndex                = 10
  versionLabel.Parent                = content

  -- ── Status indicator ──────────────────────────────────────
  local statusFrame = Instance.new("Frame")
  statusFrame.Name             = "StatusFrame"
  statusFrame.Size             = UDim2.new(0, 120, 0, 26)
  statusFrame.Position         = UDim2.new(0.5, -60, 0, 76)
  statusFrame.BackgroundColor3 = state.authenticated and Color3.fromHex("061e14") or C.surface
  statusFrame.BorderSizePixel  = 0
  statusFrame.ZIndex           = 10
  statusFrame.Parent           = content

  local statusCorner = Instance.new("UICorner")
  statusCorner.CornerRadius = UDim.new(0, 13)
  statusCorner.Parent       = statusFrame

  local statusDot = Instance.new("Frame")
  statusDot.Name             = "StatusDot"
  statusDot.Size             = UDim2.new(0, 8, 0, 8)
  statusDot.Position         = UDim2.new(0, 12, 0.5, -4)
  statusDot.BackgroundColor3 = state.authenticated and C.success or C.textDim
  statusDot.BorderSizePixel  = 0
  statusDot.ZIndex           = 11
  statusDot.Parent           = statusFrame

  local dotCorner = Instance.new("UICorner")
  dotCorner.CornerRadius = UDim.new(1, 0)
  dotCorner.Parent       = statusDot

  -- Pulsing glow ring
  local dotGlow = Instance.new("Frame")
  dotGlow.Name                  = "DotGlow"
  dotGlow.Size                  = UDim2.new(0, 14, 0, 14)
  dotGlow.Position              = UDim2.new(0, 9, 0.5, -7)
  dotGlow.BackgroundColor3      = state.authenticated and C.success or C.textDim
  dotGlow.BackgroundTransparency = 0.7
  dotGlow.BorderSizePixel       = 0
  dotGlow.ZIndex                = 10
  dotGlow.Parent                = statusFrame

  local dotGlowCorner = Instance.new("UICorner")
  dotGlowCorner.CornerRadius = UDim.new(1, 0)
  dotGlowCorner.Parent       = dotGlow

  TweenService:Create(dotGlow, TweenInfo.new(
    1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true
  ), {
    Size = UDim2.new(0, 20, 0, 20),
    Position = UDim2.new(0, 6, 0.5, -10),
    BackgroundTransparency = 0.9,
  }):Play()

  local statusText = Instance.new("TextLabel")
  statusText.Name                  = "StatusText"
  statusText.Text                  = state.authenticated and "Online" or "Offline"
  statusText.Font                  = Enum.Font.Gotham
  statusText.TextSize              = 12
  statusText.TextColor3            = state.authenticated and C.success or C.textDim
  statusText.BackgroundTransparency = 1
  statusText.Size                  = UDim2.new(1, -30, 1, 0)
  statusText.Position              = UDim2.new(0, 26, 0, 0)
  statusText.TextXAlignment        = Enum.TextXAlignment.Left
  statusText.ZIndex                = 11
  statusText.Parent                = statusFrame

  -- ── Code Input Box ────────────────────────────────────────
  local codeInputFrame = Instance.new("Frame")
  codeInputFrame.Name                  = "CodeInputFrame"
  codeInputFrame.Size                  = UDim2.new(1, 0, 0, 48)
  codeInputFrame.Position              = UDim2.new(0, 0, 0, 118)
  codeInputFrame.BackgroundColor3      = C.input
  codeInputFrame.BackgroundTransparency = 0.2
  codeInputFrame.BorderSizePixel       = 0
  codeInputFrame.Visible               = not state.authenticated
  codeInputFrame.ZIndex                = 10
  codeInputFrame.Parent                = content

  local codeInputCorner = Instance.new("UICorner")
  codeInputCorner.CornerRadius = UDim.new(0, 12)
  codeInputCorner.Parent       = codeInputFrame

  local codeInputStroke = Instance.new("UIStroke")
  codeInputStroke.Color        = C.border
  codeInputStroke.Thickness    = 1.5
  codeInputStroke.Transparency = 0.2
  codeInputStroke.Parent       = codeInputFrame

  local codeBox = Instance.new("TextBox")
  codeBox.Name             = "CodeBox"
  codeBox.PlaceholderText  = "Enter code"
  codeBox.PlaceholderColor3 = C.textDim
  codeBox.Text             = ""
  codeBox.Font             = Enum.Font.GothamBold
  codeBox.TextSize         = 20
  codeBox.TextColor3       = C.text
  codeBox.BackgroundTransparency = 1
  codeBox.Size             = UDim2.new(1, -16, 1, 0)
  codeBox.Position         = UDim2.new(0, 8, 0, 0)
  codeBox.TextXAlignment   = Enum.TextXAlignment.Center
  codeBox.ClearTextOnFocus = false
  codeBox.ZIndex           = 11
  codeBox.Parent           = codeInputFrame

  -- Gold border on focus
  codeBox.Focused:Connect(function()
    TweenService:Create(codeInputStroke, TweenInfo.new(0.2), {
      Color = C.gold, Thickness = 2
    }):Play()
  end)
  codeBox.FocusLost:Connect(function()
    TweenService:Create(codeInputStroke, TweenInfo.new(0.2), {
      Color = C.border, Thickness = 1.5
    }):Play()
  end)

  -- Instruction text
  local instrLabel = Instance.new("TextLabel")
  instrLabel.Name                  = "InstrLabel"
  instrLabel.Text                  = "Get your code at forjegames.com/editor"
  instrLabel.Font                  = Enum.Font.Gotham
  instrLabel.TextSize              = 12
  instrLabel.TextColor3            = C.textDim
  instrLabel.BackgroundTransparency = 1
  instrLabel.Size                  = UDim2.new(1, 0, 0, 14)
  instrLabel.Position              = UDim2.new(0, 0, 0, 170)
  instrLabel.TextXAlignment        = Enum.TextXAlignment.Center
  instrLabel.Visible               = not state.authenticated
  instrLabel.ZIndex                = 10
  instrLabel.Parent                = content

  -- ── Auth status text (shown when connected) ───────────────
  local authStatus = Instance.new("TextLabel")
  authStatus.Name                  = "AuthStatus"
  authStatus.Text                  = state.authenticated and "Session active" or ""
  authStatus.Font                  = Enum.Font.Gotham
  authStatus.TextSize              = 13
  authStatus.TextColor3            = C.textSec
  authStatus.BackgroundTransparency = 1
  authStatus.Size                  = UDim2.new(1, 0, 0, 16)
  authStatus.Position              = UDim2.new(0, 0, 0, 122)
  authStatus.TextXAlignment        = Enum.TextXAlignment.Center
  authStatus.ZIndex                = 10
  authStatus.Parent                = content

  -- ── Connect / Disconnect Button ───────────────────────────
  local authBtn = Instance.new("TextButton")
  authBtn.Name                  = "AuthBtn"
  authBtn.Size                  = UDim2.new(1, 0, 0, 44)
  authBtn.Position              = UDim2.new(0, 0, 0, 194)
  authBtn.BackgroundColor3      = state.authenticated and C.surface2 or C.gold
  authBtn.BackgroundTransparency = state.authenticated and 0.4 or 0
  authBtn.BorderSizePixel       = 0
  authBtn.Text                  = state.authenticated and "Disconnect" or "Connect"
  authBtn.Font                  = Enum.Font.GothamBold
  authBtn.TextSize              = 16
  authBtn.TextColor3            = state.authenticated and C.textSec or Color3.fromHex("050510")
  authBtn.AutoButtonColor       = false
  authBtn.ZIndex                = 11
  authBtn.Parent                = content

  local authBtnCorner = Instance.new("UICorner")
  authBtnCorner.CornerRadius = UDim.new(0, 12)
  authBtnCorner.Parent       = authBtn

  local authBtnStroke = Instance.new("UIStroke")
  authBtnStroke.Color        = state.authenticated and C.border or C.borderFocus
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

  -- ── Undo Last Build Button ────────────────────────────────
  local undoBtn = Instance.new("TextButton")
  undoBtn.Name                  = "UndoBtn"
  undoBtn.Size                  = UDim2.new(1, 0, 0, 38)
  undoBtn.Position              = UDim2.new(0, 0, 0, 248)
  undoBtn.BackgroundColor3      = C.surface
  undoBtn.BackgroundTransparency = 0.4
  undoBtn.BorderSizePixel       = 0
  undoBtn.Text                  = "Undo Last Build"
  undoBtn.Font                  = Enum.Font.GothamSemibold
  undoBtn.TextSize              = 14
  undoBtn.TextColor3            = C.textSec
  undoBtn.AutoButtonColor       = false
  undoBtn.ZIndex                = 11
  undoBtn.Parent                = content

  local undoBtnCorner = Instance.new("UICorner")
  undoBtnCorner.CornerRadius = UDim.new(0, 12)
  undoBtnCorner.Parent       = undoBtn

  local undoBtnStroke = Instance.new("UIStroke")
  undoBtnStroke.Color        = C.border
  undoBtnStroke.Thickness    = 1
  undoBtnStroke.Transparency = 0.3
  undoBtnStroke.Parent       = undoBtn

  undoBtn.MouseEnter:Connect(function()
    undoBtn.BackgroundTransparency = 0.2
    undoBtn.TextColor3 = C.text
  end)
  undoBtn.MouseLeave:Connect(function()
    undoBtn.BackgroundTransparency = 0.4
    undoBtn.TextColor3 = C.textSec
  end)

  -- ── Error label ───────────────────────────────────────────
  local errorLabel = Instance.new("TextLabel")
  errorLabel.Name                  = "ErrorLabel"
  errorLabel.Text                  = ""
  errorLabel.Font                  = Enum.Font.Gotham
  errorLabel.TextSize              = 13
  errorLabel.TextColor3            = C.error
  errorLabel.BackgroundTransparency = 1
  errorLabel.Size                  = UDim2.new(1, 0, 0, 16)
  errorLabel.Position              = UDim2.new(0, 0, 0, 296)
  errorLabel.TextXAlignment        = Enum.TextXAlignment.Center
  errorLabel.TextWrapped           = true
  errorLabel.Visible               = false
  errorLabel.ZIndex                = 10
  errorLabel.Parent                = content

  -- ── Footer ────────────────────────────────────────────────
  local footer = Instance.new("TextLabel")
  footer.Name                  = "Footer"
  footer.Text                  = "forjegames.com"
  footer.Font                  = Enum.Font.Gotham
  footer.TextSize              = 11
  footer.TextColor3            = C.textDim
  footer.BackgroundTransparency = 1
  footer.Size                  = UDim2.new(1, 0, 0, 16)
  footer.Position              = UDim2.new(0, 0, 1, -24)
  footer.TextXAlignment        = Enum.TextXAlignment.Center
  footer.ZIndex                = 10
  footer.Parent                = root

  -- ── Force-update overlay (hidden by default) ──────────────
  local forceUpdateOverlay = Instance.new("Frame")
  forceUpdateOverlay.Name             = "ForceUpdateOverlay"
  forceUpdateOverlay.Size             = UDim2.new(1, 0, 1, 0)
  forceUpdateOverlay.BackgroundColor3 = C.bg
  forceUpdateOverlay.BackgroundTransparency = 0.1
  forceUpdateOverlay.BorderSizePixel  = 0
  forceUpdateOverlay.ZIndex           = 20
  forceUpdateOverlay.Visible          = false
  forceUpdateOverlay.Parent           = root

  local overlayLabel = Instance.new("TextLabel")
  overlayLabel.Name                  = "OverlayLabel"
  overlayLabel.Text                  = "Plugin update required\nPlease update to continue.\nCheck Output for the download link."
  overlayLabel.Font                  = Enum.Font.GothamBold
  overlayLabel.TextSize              = 14
  overlayLabel.TextColor3            = C.gold
  overlayLabel.BackgroundTransparency = 1
  overlayLabel.Size                  = UDim2.new(1, -32, 0, 80)
  overlayLabel.Position              = UDim2.new(0, 16, 0.4, -40)
  overlayLabel.TextXAlignment        = Enum.TextXAlignment.Center
  overlayLabel.TextWrapped           = true
  overlayLabel.ZIndex                = 21
  overlayLabel.Parent                = forceUpdateOverlay

  -- ============================================================
  -- Hidden refs needed by Plugin.lua for compatibility
  -- These elements exist but are not visible in the simplified UI
  -- ============================================================

  -- authTitle / authIcon / authCard: Plugin.lua reads these in setAuthenticated
  local authTitle = Instance.new("TextLabel")
  authTitle.Name = "AuthTitle"
  authTitle.Text = state.authenticated and "Connected" or "Connect to ForjeGames"
  authTitle.BackgroundTransparency = 1
  authTitle.Size = UDim2.new(0, 0, 0, 0)
  authTitle.Visible = false
  authTitle.Parent = root

  local authIcon = Instance.new("TextLabel")
  authIcon.Name = "AuthIcon"
  authIcon.Text = state.authenticated and "\226\156\147" or "\240\159\148\151"
  authIcon.TextColor3 = state.authenticated and C.success or C.gold
  authIcon.BackgroundTransparency = 1
  authIcon.Size = UDim2.new(0, 0, 0, 0)
  authIcon.Visible = false
  authIcon.Parent = root

  -- authCard: a virtual frame so setAuthenticated/setDisconnected can set .Size
  local authCard = Instance.new("Frame")
  authCard.Name = "AuthCard"
  authCard.Size = UDim2.new(0, 0, 0, 0)
  authCard.Visible = false
  authCard.Parent = root

  -- Sync status refs (hidden, used by Plugin.lua status updates)
  local syncIcon = Instance.new("TextLabel")
  syncIcon.Name = "SyncIcon"
  syncIcon.TextColor3 = C.textDim
  syncIcon.BackgroundTransparency = 1
  syncIcon.Size = UDim2.new(0, 0, 0, 0)
  syncIcon.Visible = false
  syncIcon.Parent = root

  local connStatusLabel = Instance.new("TextLabel")
  connStatusLabel.Name = "ConnStatus"
  connStatusLabel.Text = "Waiting for connection..."
  connStatusLabel.TextColor3 = C.textDim
  connStatusLabel.BackgroundTransparency = 1
  connStatusLabel.Size = UDim2.new(0, 0, 0, 0)
  connStatusLabel.Visible = false
  connStatusLabel.Parent = root

  local lastSyncLabel = Instance.new("TextLabel")
  lastSyncLabel.Name = "LastSync"
  lastSyncLabel.Text = ""
  lastSyncLabel.BackgroundTransparency = 1
  lastSyncLabel.Size = UDim2.new(0, 0, 0, 0)
  lastSyncLabel.Visible = false
  lastSyncLabel.Parent = root

  local pingLabel = Instance.new("TextLabel")
  pingLabel.Name = "Ping"
  pingLabel.Text = ""
  pingLabel.BackgroundTransparency = 1
  pingLabel.Size = UDim2.new(0, 0, 0, 0)
  pingLabel.Visible = false
  pingLabel.Parent = root

  -- Recent builds refs (hidden, used by addRecentBuild)
  local recentCard = Instance.new("Frame")
  recentCard.Name = "RecentCard"
  recentCard.Size = UDim2.new(0, 0, 0, 0)
  recentCard.Visible = false
  recentCard.Parent = root

  local recentList = Instance.new("Frame")
  recentList.Name = "RecentList"
  recentList.Size = UDim2.new(0, 0, 0, 0)
  recentList.Visible = false
  recentList.Parent = recentCard

  local recentListLayout = Instance.new("UIListLayout")
  recentListLayout.FillDirection = Enum.FillDirection.Vertical
  recentListLayout.Padding       = UDim.new(0, 4)
  recentListLayout.Parent        = recentList

  local emptyLabel = Instance.new("TextLabel")
  emptyLabel.Name = "EmptyLabel"
  emptyLabel.Text = ""
  emptyLabel.Visible = false
  emptyLabel.Parent = recentList

  -- actionButtons array: [1]=terrain, [2]=city, [3]=asset, [4]=undo
  -- Only [4] (undo) is wired; the rest are dummy buttons for compatibility
  local actionButtons = {}
  for i = 1, 3 do
    local dummy = Instance.new("TextButton")
    dummy.Name = "DummyAction_" .. i
    dummy.Visible = false
    dummy.Size = UDim2.new(0, 0, 0, 0)
    dummy.Parent = root
    actionButtons[i] = dummy
  end
  actionButtons[4] = undoBtn  -- real undo button

  -- ============================================================
  -- Public API (refs)
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

  -- ── Show update banner (prints to output) ──
  local _downloadUrl = "https://forjegames.com/download"

  function refs.showUpdateBanner(info)
    _downloadUrl = info.downloadUrl or _downloadUrl
    local versionStr = info.latestVersion and ("v" .. info.latestVersion) or "latest"
    print("[ForjeGames] Plugin update available: " .. versionStr)
    print("[ForjeGames] Download: " .. _downloadUrl)
    if info.changelog and #info.changelog > 0 then
      print("[ForjeGames] What's new: " .. info.changelog)
    end
    -- Show in error label area
    errorLabel.Text = "Update available: " .. versionStr
    errorLabel.TextColor3 = C.warning
    errorLabel.Visible = true
  end

  -- ── Force-update lock ──
  function refs.setForceUpdateLock(locked)
    forceUpdateOverlay.Visible = locked
    authBtn.Active = not locked
    undoBtn.Active = not locked
    if locked then
      authBtn.BackgroundTransparency = 0.7
      undoBtn.BackgroundTransparency = 0.7
    end
  end

  -- ── Update: authenticated ──
  function refs.setAuthenticated(email)
    authTitle.Text       = "Connected"
    authIcon.Text        = "\226\156\147" -- checkmark
    authIcon.TextColor3  = C.success
    authStatus.Text      = email and ("Signed in as " .. email) or "Session active"
    authStatus.TextColor3 = C.textSec
    authStatus.Visible   = true
    authBtn.Text         = "Disconnect"
    authBtn.TextColor3   = C.textSec
    authBtn.BackgroundColor3 = C.surface2
    authBtn.BackgroundTransparency = 0.4
    authBtnStroke.Color  = C.border
    codeInputFrame.Visible = false
    instrLabel.Visible     = false
    errorLabel.Visible     = false
    statusDot.BackgroundColor3   = C.success
    dotGlow.BackgroundColor3     = C.success
    statusText.Text              = "Online"
    statusText.TextColor3        = C.success
    statusFrame.BackgroundColor3 = Color3.fromHex("061e14")
  end

  -- ── Update: disconnected ──
  function refs.setDisconnected()
    authTitle.Text       = "Connect to ForjeGames"
    authIcon.Text        = "\240\159\148\151" -- link
    authIcon.TextColor3  = C.gold
    authStatus.Text      = ""
    authStatus.Visible   = false
    authBtn.Text         = "Connect"
    authBtn.TextColor3   = Color3.fromHex("050510")
    authBtn.BackgroundColor3 = C.gold
    authBtn.BackgroundTransparency = 0
    authBtnStroke.Color  = C.borderFocus
    codeInputFrame.Visible = true
    instrLabel.Visible     = true
    errorLabel.Visible     = false
    statusDot.BackgroundColor3   = C.textDim
    dotGlow.BackgroundColor3     = C.textDim
    statusText.Text              = "Offline"
    statusText.TextColor3        = C.textDim
    statusFrame.BackgroundColor3 = C.surface
  end

  -- ── Update: show error ──
  function refs.showError(msg)
    errorLabel.Text    = msg or ""
    errorLabel.TextColor3 = C.error
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

  -- ── Rich connection status ──
  function refs.setConnectionStatus(statusKey, messageOverride)
    local STATUS_MAP = {
      connecting    = { label = "Connecting...",               color = C.warning, dot = C.warning, bg = Color3.fromHex("1c1107"), header = "Connecting..."   },
      connected     = { label = "Syncing with forjegames.com", color = C.success, dot = C.success, bg = Color3.fromHex("052e16"), header = "Online"           },
      reconnecting  = { label = "Reconnecting...",             color = C.warning, dot = C.warning, bg = Color3.fromHex("1c1107"), header = "Reconnecting..."  },
      disconnected  = { label = "Disconnected",               color = C.error,   dot = C.error,   bg = Color3.fromHex("1f0707"), header = "Offline"          },
      http_disabled = { label = "Error: HTTP not enabled",    color = C.error,   dot = C.error,   bg = Color3.fromHex("1f0707"), header = "Error"            },
      idle          = { label = "Waiting for connection...",   color = C.textDim, dot = C.textDim, bg = Color3.fromHex("1c1917"), header = "Offline"          },
    }

    local d = STATUS_MAP[statusKey] or STATUS_MAP.idle

    connStatusLabel.Text       = messageOverride or d.label
    connStatusLabel.TextColor3 = d.color
    syncIcon.TextColor3        = d.color

    statusDot.BackgroundColor3   = d.dot
    dotGlow.BackgroundColor3     = d.dot
    statusText.Text              = d.header
    statusText.TextColor3        = d.color
    statusFrame.BackgroundColor3 = d.bg
  end

  -- ── Add recent build (no-op in simplified UI, kept for compat) ──
  function refs.addRecentBuild(buildName, buildType, timestamp)
    -- Silent: simplified UI does not show recent builds list
  end

  return refs
end

return UI
