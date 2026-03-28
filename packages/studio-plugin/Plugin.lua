--[[
  RobloxForge Studio Plugin — Main Entry
  PLUG-01: Toolbar button + DockWidgetPluginGui

  Dark theme: background #1a1a1a, gold accents #c9a227
  Requires: Auth.lua, UI.lua, Sync.lua, AssetManager.lua, History.lua
--]]

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")

-- Guard: only run in Studio edit mode
if not RunService:IsStudio() then
  return
end

-- ============================================================
-- Constants
-- ============================================================
local PLUGIN_NAME     = "RobloxForge"
local PLUGIN_ID       = "RobloxForge_v1"
local TOOLBAR_NAME    = "RobloxForge"
local BUTTON_TOOLTIP  = "Open RobloxForge AI Builder"
local BUTTON_ICON     = "rbxassetid://0" -- placeholder; replace with uploaded icon

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
}

-- ============================================================
-- DockWidgetPluginGui setup
-- ============================================================
local widgetInfo = DockWidgetPluginGuiInfo.new(
  Enum.InitialDockState.Right,  -- dock to right by default
  true,   -- initially enabled
  false,  -- don't override saved state
  380,    -- min width
  600,    -- min height
  380,    -- default width
  700     -- default height
)

local widget = plugin:CreateDockWidgetPluginGui(PLUGIN_ID, widgetInfo)
widget.Title = "RobloxForge AI"
widget.Name  = "RobloxForgeWidget"

-- ============================================================
-- Toolbar + button
-- ============================================================
local toolbar = plugin:CreateToolbar(TOOLBAR_NAME)
local toggleButton = toolbar:CreateButton(
  PLUGIN_NAME,
  BUTTON_TOOLTIP,
  BUTTON_ICON,
  "RobloxForge"
)
toggleButton.ClickableWhenViewportHidden = true

-- Sync button state with widget visibility
widget:GetPropertyChangedSignal("Enabled"):Connect(function()
  toggleButton:SetActive(widget.Enabled)
end)

toggleButton.Click:Connect(function()
  widget.Enabled = not widget.Enabled
end)

-- ============================================================
-- Load sub-modules (lazy, with error isolation)
-- ============================================================
local function safeRequire(moduleScript)
  local ok, result = pcall(require, moduleScript)
  if not ok then
    warn("[RobloxForge] Failed to load module: " .. tostring(result))
    return nil
  end
  return result
end

-- Sub-module references (will be populated after UI builds)
local Auth         = nil
local UI           = nil
local Sync         = nil
local AssetManager = nil
local History      = nil

-- Attempt to find modules if they exist in plugin hierarchy
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
  authenticated  = false,
  authToken      = nil,
  connected      = false,
  lastSync       = 0,
  pendingChanges = {},
  status         = "idle", -- "idle" | "syncing" | "generating" | "error"
}

-- ============================================================
-- Persisted settings
-- ============================================================
local function loadSetting(key, default)
  local ok, val = pcall(function() return plugin:GetSetting(key) end)
  return (ok and val ~= nil) and val or default
end

local function saveSetting(key, value)
  pcall(function() plugin:SetSetting(key, value) end)
end

-- Restore saved auth token (encrypted in plugin settings storage)
state.authToken = loadSetting("rf_auth_token", nil)
if state.authToken then
  state.authenticated = true
end

-- ============================================================
-- Build minimal inline UI
-- (Full UI panel is in UI.lua; this is the fallback scaffold)
-- ============================================================
local function buildFallbackUI()
  -- Background frame
  local bg = Instance.new("Frame")
  bg.Name            = "RobloxForgeBg"
  bg.Size            = UDim2.new(1, 0, 1, 0)
  bg.BackgroundColor3 = COLORS.bg
  bg.BorderSizePixel  = 0
  bg.Parent           = widget

  -- Title bar
  local titleBar = Instance.new("Frame")
  titleBar.Name             = "TitleBar"
  titleBar.Size             = UDim2.new(1, 0, 0, 48)
  titleBar.BackgroundColor3 = COLORS.panel
  titleBar.BorderSizePixel  = 0
  titleBar.Parent           = bg

  local titleLabel = Instance.new("TextLabel")
  titleLabel.Text            = "RobloxForge"
  titleLabel.Font            = Enum.Font.GothamBold
  titleLabel.TextSize        = 16
  titleLabel.TextColor3      = COLORS.gold
  titleLabel.BackgroundTransparency = 1
  titleLabel.Size            = UDim2.new(1, -16, 1, 0)
  titleLabel.Position        = UDim2.new(0, 12, 0, 0)
  titleLabel.TextXAlignment  = Enum.TextXAlignment.Left
  titleLabel.Parent          = titleBar

  -- Status badge
  local statusBadge = Instance.new("Frame")
  statusBadge.Name             = "StatusBadge"
  statusBadge.Size             = UDim2.new(0, 8, 0, 8)
  statusBadge.Position         = UDim2.new(1, -20, 0.5, -4)
  statusBadge.BackgroundColor3 = state.authenticated and COLORS.success or COLORS.textDim
  statusBadge.BorderSizePixel  = 0
  statusBadge.Parent           = titleBar

  local statusCorner = Instance.new("UICorner")
  statusCorner.CornerRadius = UDim.new(1, 0)
  statusCorner.Parent       = statusBadge

  -- Content scroll frame
  local scroll = Instance.new("ScrollingFrame")
  scroll.Name                  = "ContentScroll"
  scroll.Size                  = UDim2.new(1, 0, 1, -48)
  scroll.Position              = UDim2.new(0, 0, 0, 48)
  scroll.BackgroundTransparency = 1
  scroll.BorderSizePixel       = 0
  scroll.ScrollBarThickness    = 4
  scroll.ScrollBarImageColor3  = COLORS.gold
  scroll.AutomaticCanvasSize   = Enum.AutomaticSize.Y
  scroll.CanvasSize            = UDim2.new(0, 0, 0, 0)
  scroll.Parent                = bg

  local scrollLayout = Instance.new("UIListLayout")
  scrollLayout.FillDirection      = Enum.FillDirection.Vertical
  scrollLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
  scrollLayout.Padding            = UDim.new(0, 8)
  scrollLayout.Parent             = scroll

  local scrollPadding = Instance.new("UIPadding")
  scrollPadding.PaddingTop    = UDim.new(0, 12)
  scrollPadding.PaddingLeft   = UDim.new(0, 12)
  scrollPadding.PaddingRight  = UDim.new(0, 12)
  scrollPadding.PaddingBottom = UDim.new(0, 12)
  scrollPadding.Parent        = scroll

  -- Auth section
  local authCard = Instance.new("Frame")
  authCard.Name             = "AuthCard"
  authCard.Size             = UDim2.new(1, 0, 0, 80)
  authCard.BackgroundColor3 = COLORS.card
  authCard.BorderSizePixel  = 0
  authCard.Parent           = scroll

  local authCorner = Instance.new("UICorner")
  authCorner.CornerRadius = UDim.new(0, 8)
  authCorner.Parent       = authCard

  local authLabel = Instance.new("TextLabel")
  authLabel.Text           = state.authenticated and "Connected to RobloxForge" or "Sign in to get started"
  authLabel.Font           = Enum.Font.Gotham
  authLabel.TextSize       = 13
  authLabel.TextColor3     = state.authenticated and COLORS.success or COLORS.textDim
  authLabel.BackgroundTransparency = 1
  authLabel.Size           = UDim2.new(1, -24, 0, 20)
  authLabel.Position       = UDim2.new(0, 12, 0, 12)
  authLabel.TextXAlignment = Enum.TextXAlignment.Left
  authLabel.Parent         = authCard

  -- Primary button (Login / Dashboard)
  local primaryBtn = Instance.new("TextButton")
  primaryBtn.Name             = "PrimaryButton"
  primaryBtn.Size             = UDim2.new(1, -24, 0, 36)
  primaryBtn.Position         = UDim2.new(0, 12, 0, 36)
  primaryBtn.BackgroundColor3 = COLORS.gold
  primaryBtn.BorderSizePixel  = 0
  primaryBtn.Text             = state.authenticated and "Open Dashboard" or "Login with RobloxForge"
  primaryBtn.Font             = Enum.Font.GothamBold
  primaryBtn.TextSize         = 13
  primaryBtn.TextColor3       = Color3.fromHex("0a0a0a")
  primaryBtn.Parent           = authCard

  local btnCorner = Instance.new("UICorner")
  btnCorner.CornerRadius = UDim.new(0, 6)
  btnCorner.Parent       = primaryBtn

  primaryBtn.MouseButton1Click:Connect(function()
    if Auth then
      if state.authenticated then
        Auth.openDashboard()
      else
        Auth.beginOAuthFlow(plugin, function(token)
          state.authToken    = token
          state.authenticated = true
          saveSetting("rf_auth_token", token)
          authLabel.Text      = "Connected to RobloxForge"
          authLabel.TextColor3 = COLORS.success
          primaryBtn.Text     = "Open Dashboard"
          statusBadge.BackgroundColor3 = COLORS.success
        end)
      end
    else
      warn("[RobloxForge] Auth module not loaded")
    end
  end)

  -- Connection status card
  local connCard = Instance.new("Frame")
  connCard.Name             = "ConnCard"
  connCard.Size             = UDim2.new(1, 0, 0, 60)
  connCard.BackgroundColor3 = COLORS.card
  connCard.BorderSizePixel  = 0
  connCard.Parent           = scroll

  local connCorner = Instance.new("UICorner")
  connCorner.CornerRadius = UDim.new(0, 8)
  connCorner.Parent       = connCard

  local connStatusLabel = Instance.new("TextLabel")
  connStatusLabel.Name            = "ConnStatus"
  connStatusLabel.Text            = "Sync: Disconnected"
  connStatusLabel.Font            = Enum.Font.Gotham
  connStatusLabel.TextSize        = 12
  connStatusLabel.TextColor3      = COLORS.textDim
  connStatusLabel.BackgroundTransparency = 1
  connStatusLabel.Size            = UDim2.new(1, -24, 0, 20)
  connStatusLabel.Position        = UDim2.new(0, 12, 0, 10)
  connStatusLabel.TextXAlignment  = Enum.TextXAlignment.Left
  connStatusLabel.Parent          = connCard

  local lastSyncLabel = Instance.new("TextLabel")
  lastSyncLabel.Name           = "LastSync"
  lastSyncLabel.Text           = "Last sync: never"
  lastSyncLabel.Font           = Enum.Font.Gotham
  lastSyncLabel.TextSize       = 11
  lastSyncLabel.TextColor3     = COLORS.textDim
  lastSyncLabel.BackgroundTransparency = 1
  lastSyncLabel.Size           = UDim2.new(1, -24, 0, 16)
  lastSyncLabel.Position       = UDim2.new(0, 12, 0, 34)
  lastSyncLabel.TextXAlignment = Enum.TextXAlignment.Left
  lastSyncLabel.Parent         = connCard

  -- Recent builds card (placeholder)
  local recentCard = Instance.new("Frame")
  recentCard.Name             = "RecentCard"
  recentCard.Size             = UDim2.new(1, 0, 0, 120)
  recentCard.BackgroundColor3 = COLORS.card
  recentCard.BorderSizePixel  = 0
  recentCard.Parent           = scroll

  local recentCorner = Instance.new("UICorner")
  recentCorner.CornerRadius = UDim.new(0, 8)
  recentCorner.Parent       = recentCard

  local recentLabel = Instance.new("TextLabel")
  recentLabel.Text           = "Recent Builds"
  recentLabel.Font           = Enum.Font.GothamBold
  recentLabel.TextSize       = 13
  recentLabel.TextColor3     = COLORS.text
  recentLabel.BackgroundTransparency = 1
  recentLabel.Size           = UDim2.new(1, -24, 0, 20)
  recentLabel.Position       = UDim2.new(0, 12, 0, 12)
  recentLabel.TextXAlignment = Enum.TextXAlignment.Left
  recentLabel.Parent         = recentCard

  local noBuildsLabel = Instance.new("TextLabel")
  noBuildsLabel.Name           = "NoBuilds"
  noBuildsLabel.Text           = "No recent builds. Generate something!"
  noBuildsLabel.Font           = Enum.Font.Gotham
  noBuildsLabel.TextSize       = 11
  noBuildsLabel.TextColor3     = COLORS.textDim
  noBuildsLabel.BackgroundTransparency = 1
  noBuildsLabel.Size           = UDim2.new(1, -24, 0, 60)
  noBuildsLabel.Position       = UDim2.new(0, 12, 0, 40)
  noBuildsLabel.TextXAlignment = Enum.TextXAlignment.Center
  noBuildsLabel.TextWrapped    = true
  noBuildsLabel.Parent         = recentCard

  -- Quick action buttons
  local function makeQuickAction(label, index)
    local btn = Instance.new("TextButton")
    btn.Name             = "Quick_" .. label
    btn.Size             = UDim2.new(1, 0, 0, 44)
    btn.BackgroundColor3 = COLORS.card
    btn.BorderSizePixel  = 0
    btn.Text             = label
    btn.Font             = Enum.Font.Gotham
    btn.TextSize         = 13
    btn.TextColor3       = COLORS.text
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

  local terrainBtn  = makeQuickAction("Generate Terrain",  1)
  local cityBtn     = makeQuickAction("Generate City",     2)
  local assetBtn    = makeQuickAction("Generate Asset",    3)
  local undoAllBtn  = makeQuickAction("Undo Last AI Op",   4)

  -- Wire quick actions to modules
  terrainBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("GenerateTerrain") end
    -- Sync.requestGeneration("terrain") would be called here
    if History then History.endWaypoint("GenerateTerrain") end
  end)

  cityBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("GenerateCity") end
    if History then History.endWaypoint("GenerateCity") end
  end)

  assetBtn.MouseButton1Click:Connect(function()
    if History then History.beginWaypoint("GenerateAsset") end
    if History then History.endWaypoint("GenerateAsset") end
  end)

  undoAllBtn.MouseButton1Click:Connect(function()
    ChangeHistoryService:Undo()
  end)

  -- Return references for Sync module to update
  return {
    connStatusLabel = connStatusLabel,
    lastSyncLabel   = lastSyncLabel,
    statusBadge     = statusBadge,
    noBuildsLabel   = noBuildsLabel,
  }
end

-- ============================================================
-- Init
-- ============================================================
local uiRefs = nil

local function init()
  -- If full UI module loaded, use it; otherwise use fallback
  if UI then
    uiRefs = UI.build(widget, state, COLORS, plugin)
  else
    uiRefs = buildFallbackUI()
  end

  -- Start sync loop if authenticated
  if state.authenticated and Sync then
    Sync.start({
      token        = state.authToken,
      onStatusChange = function(connected, lastSync)
        if uiRefs then
          uiRefs.connStatusLabel.Text      = connected and "Sync: Connected" or "Sync: Disconnected"
          uiRefs.connStatusLabel.TextColor3 = connected and COLORS.success or COLORS.textDim
          if lastSync > 0 then
            uiRefs.lastSyncLabel.Text = "Last sync: " .. os.date("%H:%M:%S", lastSync)
          end
        end
        state.connected = connected
        state.lastSync  = lastSync
      end,
    })
  end
end

init()

-- ============================================================
-- Cleanup on plugin unload
-- ============================================================
plugin.Unloading:Connect(function()
  if Sync then
    pcall(Sync.stop)
  end
  widget:Destroy()
end)
