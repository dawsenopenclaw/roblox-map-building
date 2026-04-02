--[[
  ForjeGames Studio Plugin — UI.lua
  Plugin panel with status, recent builds, quick actions
  Dark theme: #1a1a1a bg, #c9a227 gold accent
--]]

local UI = {}

-- ============================================================
-- Helper: create a rounded frame
-- ============================================================
local function roundFrame(parent, name, size, position, bgColor, radius)
  local f = Instance.new("Frame")
  f.Name             = name
  f.Size             = size
  f.Position         = position or UDim2.new(0, 0, 0, 0)
  f.BackgroundColor3 = bgColor
  f.BorderSizePixel  = 0
  f.Parent           = parent

  local c = Instance.new("UICorner")
  c.CornerRadius = UDim.new(0, radius or 8)
  c.Parent       = f

  return f
end

-- ============================================================
-- Helper: create a text label
-- ============================================================
local function label(parent, name, text, size, position, textColor, fontSize, font, align)
  local l = Instance.new("TextLabel")
  l.Name                 = name
  l.Text                 = text
  l.Size                 = size
  l.Position             = position
  l.TextColor3           = textColor
  l.TextSize             = fontSize or 13
  l.Font                 = font or Enum.Font.Gotham
  l.BackgroundTransparency = 1
  l.TextXAlignment       = align or Enum.TextXAlignment.Left
  l.TextWrapped          = true
  l.Parent               = parent
  return l
end

-- ============================================================
-- Helper: gold button
-- ============================================================
local function goldButton(parent, name, text, size, position, COLORS)
  local btn = Instance.new("TextButton")
  btn.Name             = name
  btn.Size             = size
  btn.Position         = position
  btn.BackgroundColor3 = COLORS.gold
  btn.BorderSizePixel  = 0
  btn.Text             = text
  btn.Font             = Enum.Font.GothamBold
  btn.TextSize         = 13
  btn.TextColor3       = Color3.fromHex("0a0a0a")
  btn.Parent           = parent
  btn.AutoButtonColor  = false

  local c = Instance.new("UICorner")
  c.CornerRadius = UDim.new(0, 6)
  c.Parent       = btn

  btn.MouseEnter:Connect(function()
    btn.BackgroundColor3 = COLORS.goldHover
  end)
  btn.MouseLeave:Connect(function()
    btn.BackgroundColor3 = COLORS.gold
  end)

  return btn
end

-- ============================================================
-- Helper: subtle button
-- ============================================================
local function subtleButton(parent, name, text, size, position, COLORS)
  local btn = Instance.new("TextButton")
  btn.Name             = name
  btn.Size             = size
  btn.Position         = position
  btn.BackgroundColor3 = COLORS.card
  btn.BorderSizePixel  = 0
  btn.Text             = text
  btn.Font             = Enum.Font.Gotham
  btn.TextSize         = 12
  btn.TextColor3       = COLORS.text
  btn.Parent           = parent
  btn.AutoButtonColor  = false

  local c = Instance.new("UICorner")
  c.CornerRadius = UDim.new(0, 6)
  c.Parent       = btn

  btn.MouseEnter:Connect(function()
    btn.BackgroundColor3 = COLORS.border
  end)
  btn.MouseLeave:Connect(function()
    btn.BackgroundColor3 = COLORS.card
  end)

  return btn
end

-- ============================================================
-- Main build function
-- ============================================================
function UI.build(widget, state, COLORS, pluginRef)
  -- Root background
  local bg = Instance.new("Frame")
  bg.Name             = "RF_Root"
  bg.Size             = UDim2.new(1, 0, 1, 0)
  bg.BackgroundColor3 = COLORS.bg
  bg.BorderSizePixel  = 0
  bg.Parent           = widget

  -- ----------------------------------------------------------------
  -- Header bar
  -- ----------------------------------------------------------------
  local header = Instance.new("Frame")
  header.Name             = "Header"
  header.Size             = UDim2.new(1, 0, 0, 52)
  header.BackgroundColor3 = COLORS.panel
  header.BorderSizePixel  = 0
  header.Parent           = bg

  -- Left: logo text + subtitle
  local logoText = label(
    header, "LogoText", "ForjeGames",
    UDim2.new(0, 140, 0, 24), UDim2.new(0, 12, 0, 6),
    COLORS.gold, 16, Enum.Font.GothamBold
  )

  local subText = label(
    header, "SubText", "AI Builder",
    UDim2.new(0, 120, 0, 16), UDim2.new(0, 12, 0, 30),
    COLORS.textDim, 11, Enum.Font.Gotham
  )

  -- Right: status dot
  local statusDot = Instance.new("Frame")
  statusDot.Name             = "StatusDot"
  statusDot.Size             = UDim2.new(0, 10, 0, 10)
  statusDot.Position         = UDim2.new(1, -22, 0.5, -5)
  statusDot.BackgroundColor3 = state.authenticated and COLORS.success or COLORS.textDim
  statusDot.BorderSizePixel  = 0
  statusDot.Parent           = header

  local dotCorner = Instance.new("UICorner")
  dotCorner.CornerRadius = UDim.new(1, 0)
  dotCorner.Parent       = statusDot

  -- Bottom border for header
  local headerBorder = Instance.new("Frame")
  headerBorder.Name             = "HeaderBorder"
  headerBorder.Size             = UDim2.new(1, 0, 0, 1)
  headerBorder.Position         = UDim2.new(0, 0, 1, -1)
  headerBorder.BackgroundColor3 = COLORS.border
  headerBorder.BorderSizePixel  = 0
  headerBorder.Parent           = header

  -- ----------------------------------------------------------------
  -- Scroll content area
  -- ----------------------------------------------------------------
  local scroll = Instance.new("ScrollingFrame")
  scroll.Name                  = "ContentScroll"
  scroll.Size                  = UDim2.new(1, 0, 1, -52)
  scroll.Position              = UDim2.new(0, 0, 0, 52)
  scroll.BackgroundTransparency = 1
  scroll.BorderSizePixel       = 0
  scroll.ScrollBarThickness    = 4
  scroll.ScrollBarImageColor3  = COLORS.gold
  scroll.AutomaticCanvasSize   = Enum.AutomaticSize.Y
  scroll.CanvasSize            = UDim2.new(0, 0, 0, 0)
  scroll.Parent                = bg

  local layout = Instance.new("UIListLayout")
  layout.FillDirection       = Enum.FillDirection.Vertical
  layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
  layout.SortOrder           = Enum.SortOrder.LayoutOrder
  layout.Padding             = UDim.new(0, 10)
  layout.Parent              = scroll

  local padding = Instance.new("UIPadding")
  padding.PaddingTop    = UDim.new(0, 14)
  padding.PaddingLeft   = UDim.new(0, 12)
  padding.PaddingRight  = UDim.new(0, 12)
  padding.PaddingBottom = UDim.new(0, 14)
  padding.Parent        = scroll

  -- ----------------------------------------------------------------
  -- Auth section
  -- ----------------------------------------------------------------
  local authCard = roundFrame(scroll, "AuthCard",
    UDim2.new(1, 0, 0, 88), nil, COLORS.card, 8)
  authCard.LayoutOrder = 1

  local authStatus = label(
    authCard, "AuthStatus",
    state.authenticated and "Connected to ForjeGames" or "Not connected",
    UDim2.new(1, -24, 0, 18), UDim2.new(0, 12, 0, 12),
    state.authenticated and COLORS.success or COLORS.textDim, 12
  )

  local authEmailLabel = label(
    authCard, "AuthEmail", "",
    UDim2.new(1, -24, 0, 14), UDim2.new(0, 12, 0, 30),
    COLORS.textDim, 11, Enum.Font.Gotham
  )

  local authBtn = goldButton(
    authCard, "AuthBtn",
    state.authenticated and "Open Dashboard" or "Enter Code",
    UDim2.new(1, -24, 0, 32), UDim2.new(0, 12, 0, 48), COLORS
  )

  -- ----------------------------------------------------------------
  -- Connection status section
  -- ----------------------------------------------------------------
  local syncCard = roundFrame(scroll, "SyncCard",
    UDim2.new(1, 0, 0, 72), nil, COLORS.card, 8)
  syncCard.LayoutOrder = 2

  local syncLayout = Instance.new("UIListLayout")
  syncLayout.FillDirection  = Enum.FillDirection.Vertical
  syncLayout.Padding        = UDim.new(0, 4)
  syncLayout.Parent         = syncCard

  local syncPadding = Instance.new("UIPadding")
  syncPadding.PaddingTop    = UDim.new(0, 10)
  syncPadding.PaddingBottom = UDim.new(0, 10)
  syncPadding.PaddingLeft   = UDim.new(0, 10)
  syncPadding.PaddingRight  = UDim.new(0, 10)
  syncPadding.Parent        = syncCard

  local connStatusLabel = label(
    syncCard, "ConnStatus", "Studio Sync: Disconnected",
    UDim2.new(1, 0, 0, 18), nil,
    COLORS.textDim, 12, Enum.Font.Gotham
  )

  local lastSyncLabel = label(
    syncCard, "LastSync", "Last sync: never",
    UDim2.new(1, 0, 0, 14), nil,
    COLORS.textDim, 11, Enum.Font.Gotham
  )

  local pingLabel = label(
    syncCard, "Ping", "",
    UDim2.new(1, 0, 0, 14), nil,
    COLORS.textDim, 11, Enum.Font.Gotham
  )

  -- ----------------------------------------------------------------
  -- Quick actions
  -- ----------------------------------------------------------------
  local actionsCard = roundFrame(scroll, "ActionsCard",
    UDim2.new(1, 0, 0, 200), nil, COLORS.card, 8)
  actionsCard.LayoutOrder = 3

  local actionsTitle = label(
    actionsCard, "ActionsTitle", "Quick Actions",
    UDim2.new(1, -24, 0, 18), UDim2.new(0, 12, 0, 10),
    COLORS.text, 13, Enum.Font.GothamBold
  )

  local actionItems = {
    { name = "Generate Terrain",  color = COLORS.gold },
    { name = "Generate City",     color = COLORS.gold },
    { name = "Generate Asset",    color = COLORS.gold },
    { name = "Undo Last AI Op",   color = COLORS.card  },
  }

  local actionButtons = {}
  for i, item in ipairs(actionItems) do
    local yOffset = 36 + (i - 1) * 38
    local btn

    if item.color == COLORS.card then
      btn = subtleButton(
        actionsCard, "Action_" .. i, item.name,
        UDim2.new(1, -24, 0, 32), UDim2.new(0, 12, 0, yOffset), COLORS
      )
    else
      btn = goldButton(
        actionsCard, "Action_" .. i, item.name,
        UDim2.new(1, -24, 0, 32), UDim2.new(0, 12, 0, yOffset), COLORS
      )
    end

    actionButtons[i] = btn
  end

  -- Resize card based on content
  actionsCard.Size = UDim2.new(1, 0, 0, 36 + #actionItems * 38 + 12)

  -- ----------------------------------------------------------------
  -- Recent builds section
  -- ----------------------------------------------------------------
  local recentCard = roundFrame(scroll, "RecentCard",
    UDim2.new(1, 0, 0, 130), nil, COLORS.card, 8)
  recentCard.LayoutOrder = 4

  local recentTitle = label(
    recentCard, "RecentTitle", "Recent Builds",
    UDim2.new(1, -24, 0, 18), UDim2.new(0, 12, 0, 10),
    COLORS.text, 13, Enum.Font.GothamBold
  )

  local recentList = Instance.new("Frame")
  recentList.Name             = "RecentList"
  recentList.Size             = UDim2.new(1, -24, 1, -36)
  recentList.Position         = UDim2.new(0, 12, 0, 36)
  recentList.BackgroundTransparency = 1
  recentList.Parent           = recentCard

  local recentListLayout = Instance.new("UIListLayout")
  recentListLayout.FillDirection  = Enum.FillDirection.Vertical
  recentListLayout.Padding        = UDim.new(0, 6)
  recentListLayout.Parent         = recentList

  local emptyLabel = label(
    recentList, "EmptyLabel", "No recent builds yet",
    UDim2.new(1, 0, 0, 40), nil,
    COLORS.textDim, 11, Enum.Font.Gotham, Enum.TextXAlignment.Center
  )

  -- ============================================================
  -- Public API for other modules to update UI
  -- ============================================================
  local refs = {
    statusDot        = statusDot,
    authStatus       = authStatus,
    authEmailLabel   = authEmailLabel,
    authBtn          = authBtn,
    connStatusLabel  = connStatusLabel,
    lastSyncLabel    = lastSyncLabel,
    pingLabel        = pingLabel,
    actionButtons    = actionButtons,
    recentList       = recentList,
    emptyLabel       = emptyLabel,
    COLORS           = COLORS,
  }

  -- ============================================================
  -- Update auth state in UI
  -- ============================================================
  function refs.setAuthenticated(email)
    authStatus.Text      = "Connected — " .. (email or "")
    authStatus.TextColor3 = COLORS.success
    authBtn.Text         = "Open Dashboard"
    statusDot.BackgroundColor3 = COLORS.success
    if email then authEmailLabel.Text = email end
  end

  function refs.setDisconnected()
    authStatus.Text      = "Not connected"
    authStatus.TextColor3 = COLORS.textDim
    authBtn.Text         = "Enter Code"
    statusDot.BackgroundColor3 = COLORS.textDim
    authEmailLabel.Text  = ""
  end

  -- ============================================================
  -- Add a recent build entry
  -- ============================================================
  function refs.addRecentBuild(buildName, buildType, timestamp)
    emptyLabel.Visible = false

    local entry = Instance.new("Frame")
    entry.Name             = "Build_" .. tostring(timestamp)
    entry.Size             = UDim2.new(1, 0, 0, 28)
    entry.BackgroundTransparency = 1
    entry.Parent           = recentList

    local entryLayout = Instance.new("UIListLayout")
    entryLayout.FillDirection = Enum.FillDirection.Horizontal
    entryLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    entryLayout.Padding   = UDim.new(0, 8)
    entryLayout.Parent    = entry

    local dot = Instance.new("Frame")
    dot.Size             = UDim2.new(0, 6, 0, 6)
    dot.BackgroundColor3 = COLORS.gold
    dot.BorderSizePixel  = 0
    dot.LayoutOrder      = 1
    dot.Parent           = entry

    local dotC = Instance.new("UICorner")
    dotC.CornerRadius = UDim.new(1, 0)
    dotC.Parent       = dot

    local nameLabel = label(
      entry, "Name", buildName,
      UDim2.new(0, 160, 1, 0), nil,
      COLORS.text, 11, Enum.Font.Gotham
    )
    nameLabel.LayoutOrder = 2

    local typeLabel = label(
      entry, "Type", buildType,
      UDim2.new(0, 60, 1, 0), nil,
      COLORS.gold, 10, Enum.Font.Gotham
    )
    typeLabel.LayoutOrder = 3

    -- Keep only last 5 entries
    local children = recentList:GetChildren()
    local frameCount = 0
    for _, c in ipairs(children) do
      if c:IsA("Frame") then frameCount = frameCount + 1 end
    end
    if frameCount > 5 then
      for _, c in ipairs(children) do
        if c:IsA("Frame") then
          c:Destroy()
          break
        end
      end
    end

    -- Resize recent card
    recentCard.Size = UDim2.new(1, 0, 0, 36 + math.min(frameCount + 1, 5) * 34 + 12)
  end

  return refs
end

return UI
