--[[
  ForjeGames Studio Plugin — Main Entry
  Dark theme: background #1a1a1a, gold accents #c9a227

  Auth flow: user enters 6-char code from forjegames.com/settings/studio
  Sync loop: polls /api/studio/sync every 2-5s, applies server changes
  execute_luau: handled inside Sync.lua via loadstring + pcall
--]]

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local RunService           = game:GetService("RunService")

-- Guard: only run in Studio edit mode
if not RunService:IsStudio() then return end

-- ============================================================
-- Constants
-- ============================================================
local PLUGIN_NAME    = "ForjeGames"
local PLUGIN_ID      = "ForjeGames_v1"
local TOOLBAR_NAME   = "ForjeGames"
local BUTTON_TOOLTIP = "Open ForjeGames AI Builder"
local BUTTON_ICON    = "rbxassetid://0" -- replace with uploaded icon asset ID

local COLORS = {
  bg        = Color3.fromHex("1a1a1a"),
  panel     = Color3.fromHex("242424"),
  card      = Color3.fromHex("2e2e2e"),
  gold      = Color3.fromHex("c9a227"),
  goldHover = Color3.fromHex("e0b840"),
  text      = Color3.fromHex("f0f0f0"),
  textDim   = Color3.fromHex("8a8a8a"),
  success   = Color3.fromHex("4caf50"),
  error     = Color3.fromHex("f44336"),
  warning   = Color3.fromHex("ff9800"),
  border    = Color3.fromHex("3a3a3a"),
  input     = Color3.fromHex("1e1e1e"),
}

-- ============================================================
-- DockWidgetPluginGui
-- ============================================================
local widgetInfo = DockWidgetPluginGuiInfo.new(
  Enum.InitialDockState.Right,
  true,   -- initially enabled
  false,  -- don't override saved state
  380,    -- min width
  600,    -- min height
  380,    -- default width
  720     -- default height
)

local widget     = plugin:CreateDockWidgetPluginGui(PLUGIN_ID, widgetInfo)
widget.Title     = "ForjeGames AI"
widget.Name      = "ForjeGamesWidget"

-- ============================================================
-- Toolbar button
-- ============================================================
local toolbar      = plugin:CreateToolbar(TOOLBAR_NAME)
local toggleButton = toolbar:CreateButton(
  PLUGIN_NAME,
  BUTTON_TOOLTIP,
  BUTTON_ICON,
  "ForjeGames"
)
toggleButton.ClickableWhenViewportHidden = true

widget:GetPropertyChangedSignal("Enabled"):Connect(function()
  toggleButton:SetActive(widget.Enabled)
end)
toggleButton.Click:Connect(function()
  widget.Enabled = not widget.Enabled
end)

-- ============================================================
-- Safe module loader
-- ============================================================
local function safeRequire(moduleScript)
  local ok, result = pcall(require, moduleScript)
  if not ok then
    warn("[ForjeGames] Failed to load module: " .. tostring(result))
    return nil
  end
  return result
end

local Auth         = nil
local UI           = nil
local Sync         = nil
local AssetManager = nil
local History      = nil

local pluginFolder = script.Parent
if pluginFolder then
  local authModule    = pluginFolder:FindFirstChild("Auth")
  local uiModule      = pluginFolder:FindFirstChild("UI")
  local syncModule    = pluginFolder:FindFirstChild("Sync")
  local assetModule   = pluginFolder:FindFirstChild("AssetManager")
  local historyModule = pluginFolder:FindFirstChild("History")

  if authModule    then Auth         = safeRequire(authModule)    end
  if uiModule      then UI           = safeRequire(uiModule)      end
  if syncModule    then Sync         = safeRequire(syncModule)     end
  if assetModule   then AssetManager = safeRequire(assetModule)   end
  if historyModule then History      = safeRequire(historyModule) end
end

-- ============================================================
-- Plugin state
-- ============================================================
local state = {
  authenticated = false,
  authToken     = nil,
  sessionId     = nil,
  connected     = false,
  lastSync      = 0,
  status        = "idle",
}

-- ============================================================
-- Persisted settings helpers
-- ============================================================
local function loadSetting(key, default)
  local ok, val = pcall(function() return plugin:GetSetting(key) end)
  return (ok and val ~= nil) and val or default
end

local function saveSetting(key, value)
  pcall(function() plugin:SetSetting(key, value) end)
end

-- Restore saved token
state.authToken  = loadSetting("fj_auth_token", nil)
state.sessionId  = loadSetting("fj_session_id", nil)
if state.authToken and state.authToken ~= "" then
  state.authenticated = true
end

-- ============================================================
-- Build fallback UI (used when UI.lua module is not loaded)
-- ============================================================
local function buildFallbackUI()
  -- Root background
  local bg = Instance.new("Frame")
  bg.Name             = "FJ_Root"
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

  local titleLabel = Instance.new("TextLabel")
  titleLabel.Text                  = "ForjeGames"
  titleLabel.Font                  = Enum.Font.GothamBold
  titleLabel.TextSize              = 16
  titleLabel.TextColor3            = COLORS.gold
  titleLabel.BackgroundTransparency = 1
  titleLabel.Size                  = UDim2.new(0, 160, 0, 24)
  titleLabel.Position              = UDim2.new(0, 12, 0, 6)
  titleLabel.TextXAlignment        = Enum.TextXAlignment.Left
  titleLabel.Parent                = header

  local subLabel = Instance.new("TextLabel")
  subLabel.Text                  = "AI Builder"
  subLabel.Font                  = Enum.Font.Gotham
  subLabel.TextSize              = 11
  subLabel.TextColor3            = COLORS.textDim
  subLabel.BackgroundTransparency = 1
  subLabel.Size                  = UDim2.new(0, 120, 0, 16)
  subLabel.Position              = UDim2.new(0, 12, 0, 30)
  subLabel.TextXAlignment        = Enum.TextXAlignment.Left
  subLabel.Parent                = header

  -- Status dot
  local statusDot = Instance.new("Frame")
  statusDot.Name             = "StatusDot"
  statusDot.Size             = UDim2.new(0, 10, 0, 10)
  statusDot.Position         = UDim2.new(1, -22, 0.5, -5)
  statusDot.BackgroundColor3 = state.authenticated and COLORS.success or COLORS.textDim
  statusDot.BorderSizePixel  = 0
  statusDot.Parent           = header
  local dotC = Instance.new("UICorner")
  dotC.CornerRadius = UDim.new(1, 0)
  dotC.Parent       = statusDot

  -- Header bottom border
  local hBorder = Instance.new("Frame")
  hBorder.Size             = UDim2.new(1, 0, 0, 1)
  hBorder.Position         = UDim2.new(0, 0, 1, -1)
  hBorder.BackgroundColor3 = COLORS.border
  hBorder.BorderSizePixel  = 0
  hBorder.Parent           = header

  -- ----------------------------------------------------------------
  -- Scrollable content
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

  local outerPad = Instance.new("UIPadding")
  outerPad.PaddingTop    = UDim.new(0, 14)
  outerPad.PaddingLeft   = UDim.new(0, 12)
  outerPad.PaddingRight  = UDim.new(0, 12)
  outerPad.PaddingBottom = UDim.new(0, 14)
  outerPad.Parent        = scroll

  -- ----------------------------------------------------------------
  -- Helper: rounded card
  -- ----------------------------------------------------------------
  local function card(name, height, layoutOrder)
    local f = Instance.new("Frame")
    f.Name             = name
    f.Size             = UDim2.new(1, 0, 0, height)
    f.BackgroundColor3 = COLORS.card
    f.BorderSizePixel  = 0
    f.LayoutOrder      = layoutOrder or 0
    f.Parent           = scroll
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, 8)
    c.Parent       = f
    return f
  end

  -- ----------------------------------------------------------------
  -- Auth card — shows code entry when not authenticated
  -- ----------------------------------------------------------------
  local authCard = card("AuthCard", state.authenticated and 88 or 148, 1)

  local authStatusLabel = Instance.new("TextLabel")
  authStatusLabel.Name                  = "AuthStatus"
  authStatusLabel.Text                  = state.authenticated and "Connected to ForjeGames" or "Enter your connection code"
  authStatusLabel.Font                  = Enum.Font.Gotham
  authStatusLabel.TextSize              = 12
  authStatusLabel.TextColor3            = state.authenticated and COLORS.success or COLORS.textDim
  authStatusLabel.BackgroundTransparency = 1
  authStatusLabel.Size                  = UDim2.new(1, -24, 0, 18)
  authStatusLabel.Position              = UDim2.new(0, 12, 0, 12)
  authStatusLabel.TextXAlignment        = Enum.TextXAlignment.Left
  authStatusLabel.Parent                = authCard

  -- Sub-label: instructions when not authed
  local instrLabel = Instance.new("TextLabel")
  instrLabel.Name                  = "InstrLabel"
  instrLabel.Text                  = "Get your code at forjegames.com/settings/studio"
  instrLabel.Font                  = Enum.Font.Gotham
  instrLabel.TextSize              = 10
  instrLabel.TextColor3            = COLORS.textDim
  instrLabel.BackgroundTransparency = 1
  instrLabel.Size                  = UDim2.new(1, -24, 0, 14)
  instrLabel.Position              = UDim2.new(0, 12, 0, 32)
  instrLabel.TextXAlignment        = Enum.TextXAlignment.Left
  instrLabel.TextWrapped           = true
  instrLabel.Visible               = not state.authenticated
  instrLabel.Parent                = authCard

  -- Code text box (visible when not authed)
  local codeBox = Instance.new("TextBox")
  codeBox.Name             = "CodeBox"
  codeBox.PlaceholderText  = "ABC123"
  codeBox.PlaceholderColor3 = COLORS.textDim
  codeBox.Text             = ""
  codeBox.Font             = Enum.Font.GothamBold
  codeBox.TextSize         = 18
  codeBox.TextColor3       = COLORS.text
  codeBox.BackgroundColor3 = COLORS.input
  codeBox.BorderSizePixel  = 0
  codeBox.Size             = UDim2.new(1, -24, 0, 36)
  codeBox.Position         = UDim2.new(0, 12, 0, 50)
  codeBox.TextXAlignment   = Enum.TextXAlignment.Center
  codeBox.Visible          = not state.authenticated
  codeBox.ClearTextOnFocus = false
  codeBox.Parent           = authCard

  local codeBoxCorner = Instance.new("UICorner")
  codeBoxCorner.CornerRadius = UDim.new(0, 6)
  codeBoxCorner.Parent       = codeBox

  -- Primary action button
  local primaryBtn = Instance.new("TextButton")
  primaryBtn.Name             = "PrimaryBtn"
  primaryBtn.Size             = UDim2.new(1, -24, 0, 32)
  primaryBtn.Position         = UDim2.new(0, 12, 0, state.authenticated and 44 or 96)
  primaryBtn.BackgroundColor3 = COLORS.gold
  primaryBtn.BorderSizePixel  = 0
  primaryBtn.Text             = state.authenticated and "Open Dashboard" or "Connect"
  primaryBtn.Font             = Enum.Font.GothamBold
  primaryBtn.TextSize         = 13
  primaryBtn.TextColor3       = Color3.fromHex("0a0a0a")
  primaryBtn.AutoButtonColor  = false
  primaryBtn.Parent           = authCard

  local primaryCorner = Instance.new("UICorner")
  primaryCorner.CornerRadius = UDim.new(0, 6)
  primaryCorner.Parent       = primaryBtn

  primaryBtn.MouseEnter:Connect(function()
    primaryBtn.BackgroundColor3 = COLORS.goldHover
  end)
  primaryBtn.MouseLeave:Connect(function()
    primaryBtn.BackgroundColor3 = COLORS.gold
  end)

  -- ----------------------------------------------------------------
  -- Sync status card
  -- ----------------------------------------------------------------
  local syncCard = card("SyncCard", 68, 2)

  local connStatusLabel = Instance.new("TextLabel")
  connStatusLabel.Name                  = "ConnStatus"
  connStatusLabel.Text                  = "Studio Sync: Disconnected"
  connStatusLabel.Font                  = Enum.Font.Gotham
  connStatusLabel.TextSize              = 12
  connStatusLabel.TextColor3            = COLORS.textDim
  connStatusLabel.BackgroundTransparency = 1
  connStatusLabel.Size                  = UDim2.new(1, -24, 0, 18)
  connStatusLabel.Position              = UDim2.new(0, 12, 0, 10)
  connStatusLabel.TextXAlignment        = Enum.TextXAlignment.Left
  connStatusLabel.Parent                = syncCard

  local lastSyncLabel = Instance.new("TextLabel")
  lastSyncLabel.Name                  = "LastSync"
  lastSyncLabel.Text                  = "Last sync: never"
  lastSyncLabel.Font                  = Enum.Font.Gotham
  lastSyncLabel.TextSize              = 11
  lastSyncLabel.TextColor3            = COLORS.textDim
  lastSyncLabel.BackgroundTransparency = 1
  lastSyncLabel.Size                  = UDim2.new(1, -24, 0, 14)
  lastSyncLabel.Position              = UDim2.new(0, 12, 0, 32)
  lastSyncLabel.TextXAlignment        = Enum.TextXAlignment.Left
  lastSyncLabel.Parent                = syncCard

  local pingLabel = Instance.new("TextLabel")
  pingLabel.Name                  = "Ping"
  pingLabel.Text                  = ""
  pingLabel.Font                  = Enum.Font.Gotham
  pingLabel.TextSize              = 10
  pingLabel.TextColor3            = COLORS.textDim
  pingLabel.BackgroundTransparency = 1
  pingLabel.Size                  = UDim2.new(1, -24, 0, 12)
  pingLabel.Position              = UDim2.new(0, 12, 0, 50)
  pingLabel.TextXAlignment        = Enum.TextXAlignment.Left
  pingLabel.Parent                = syncCard

  -- ----------------------------------------------------------------
  -- Quick action buttons
  -- ----------------------------------------------------------------
  local function makeActionBtn(label, layoutOrder)
    local btn = Instance.new("TextButton")
    btn.Name             = "Btn_" .. label:gsub("%s+", "_")
    btn.Size             = UDim2.new(1, 0, 0, 40)
    btn.BackgroundColor3 = COLORS.card
    btn.BorderSizePixel  = 0
    btn.Text             = label
    btn.Font             = Enum.Font.Gotham
    btn.TextSize         = 13
    btn.TextColor3       = COLORS.text
    btn.LayoutOrder      = layoutOrder
    btn.AutoButtonColor  = false
    btn.Parent           = scroll

    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, 8)
    c.Parent = btn

    btn.MouseEnter:Connect(function()
      btn.BackgroundColor3 = COLORS.border
    end)
    btn.MouseLeave:Connect(function()
      btn.BackgroundColor3 = COLORS.card
    end)

    return btn
  end

  local terrainBtn = makeActionBtn("Generate Terrain", 10)
  local cityBtn    = makeActionBtn("Generate City",    11)
  local assetBtn   = makeActionBtn("Insert Asset",     12)
  local undoBtn    = makeActionBtn("Undo Last AI Op",  13)

  terrainBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("GenerateTerrain") end
    if Sync then Sync.queueChange("generate_terrain", { placeId = game.PlaceId }) end
    if History then History.endWaypoint("GenerateTerrain") end
  end)

  cityBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("GenerateCity") end
    if Sync then Sync.queueChange("generate_city", { placeId = game.PlaceId }) end
    if History then History.endWaypoint("GenerateCity") end
  end)

  assetBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("InsertAsset") end
    if History then History.endWaypoint("InsertAsset") end
  end)

  undoBtn.MouseButton1Click:Connect(function()
    pcall(function() ChangeHistoryService:Undo() end)
  end)

  -- ----------------------------------------------------------------
  -- Auth button logic
  -- ----------------------------------------------------------------
  local function onAuthenticated(token, sessionId)
    state.authToken     = token
    state.sessionId     = sessionId or ""
    state.authenticated = true

    saveSetting("fj_auth_token", token)
    saveSetting("fj_session_id", sessionId or "")

    -- Update UI
    authStatusLabel.Text      = "Connected to ForjeGames"
    authStatusLabel.TextColor3 = COLORS.success
    instrLabel.Visible         = false
    codeBox.Visible            = false
    primaryBtn.Text            = "Open Dashboard"
    primaryBtn.Position        = UDim2.new(0, 12, 0, 44)
    authCard.Size              = UDim2.new(1, 0, 0, 88)
    statusDot.BackgroundColor3 = COLORS.success

    -- Start sync
    if Sync and not Sync.getStatus().running then
      Sync.start({
        token          = token,
        sessionId      = sessionId,
        onStatusChange = function(connected, lastSync)
          state.connected = connected
          state.lastSync  = lastSync
          connStatusLabel.Text      = connected and "Studio Sync: Connected" or "Studio Sync: Disconnected"
          connStatusLabel.TextColor3 = connected and COLORS.success or COLORS.textDim
          if lastSync > 0 then
            lastSyncLabel.Text = "Last sync: " .. os.date("%H:%M:%S", lastSync)
          end
        end,
      })
    end
  end

  primaryBtn.MouseButton1Click:Connect(function()
    if state.authenticated then
      if Auth then Auth.openDashboard() end
    else
      local code = codeBox.Text or ""
      code = code:gsub("%s+", ""):upper()
      if #code < 6 then
        authStatusLabel.Text      = "Enter the 6-character code first"
        authStatusLabel.TextColor3 = COLORS.warning
        return
      end

      authStatusLabel.Text      = "Connecting..."
      authStatusLabel.TextColor3 = COLORS.textDim
      primaryBtn.Active          = false

      if Auth then
        Auth.exchangeCode(code, plugin, function(token, sessionId, err)
          primaryBtn.Active = true
          if err then
            authStatusLabel.Text      = err
            authStatusLabel.TextColor3 = COLORS.error
          else
            onAuthenticated(token, sessionId)
          end
        end)
      else
        authStatusLabel.Text      = "Auth module not loaded"
        authStatusLabel.TextColor3 = COLORS.error
      end
    end
  end)

  -- If already authenticated on startup, start sync immediately
  if state.authenticated and Sync then
    onAuthenticated(state.authToken, state.sessionId)
  end

  return {
    connStatusLabel = connStatusLabel,
    lastSyncLabel   = lastSyncLabel,
    pingLabel       = pingLabel,
    statusDot       = statusDot,
    authStatusLabel = authStatusLabel,
  }
end

-- ============================================================
-- Init
-- ============================================================
local uiRefs = nil

local function init()
  if UI then
    uiRefs = UI.build(widget, state, COLORS, plugin)
  else
    uiRefs = buildFallbackUI()
  end
end

init()

-- ============================================================
-- Cleanup on plugin unload
-- ============================================================
plugin.Unloading:Connect(function()
  if Sync then pcall(Sync.stop) end
  if History then pcall(History.cleanup) end
  pcall(function() widget:Destroy() end)
end)
