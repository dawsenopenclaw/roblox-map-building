--[[
  ForjeGames Studio Plugin v4.6.0 — Main Entry
  Dark theme: #0a0a0a bg, #D4AF37 gold accent

  Auth flow: user enters 6-char code from forjegames.com/editor
  Sync loop: polls /api/studio/sync every 2-5s, applies server changes
  execute_luau: handled inside Sync.lua via structured commands (no loadstring)
--]]

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local RunService           = game:GetService("RunService")

-- Guard: only run in Studio edit mode
if not RunService:IsStudio() then return end

-- ============================================================
-- Constants
-- ============================================================
local PLUGIN_NAME    = "ForjeGames"
local PLUGIN_ID      = "ForjeGames_v4"
local TOOLBAR_NAME   = "ForjeGames"
local BUTTON_TOOLTIP = "Open ForjeGames AI Builder"
local BUTTON_ICON    = ""

local COLORS = {
  bg        = Color3.fromHex("050810"),  -- --background
  panel     = Color3.fromHex("0A0F20"),  -- --surface
  card      = Color3.fromHex("0E1428"),  -- --surface-2
  elevated  = Color3.fromHex("121832"),  -- --surface-elevated
  gold      = Color3.fromHex("D4AF37"),  -- --gold
  goldHover = Color3.fromHex("FFD166"),  -- --gold-light
  text      = Color3.fromHex("FAFAFA"),  -- --foreground
  textDim   = Color3.fromHex("71717A"),  -- --muted-subtle
  success   = Color3.fromHex("22c55e"),
  error     = Color3.fromHex("ef4444"),
  warning   = Color3.fromHex("f59e0b"),
  border    = Color3.fromHex("1a1f35"),  -- rgba(255,255,255,0.06)
  input     = Color3.fromHex("080d1a"),
}

-- ============================================================
-- DockWidgetPluginGui
-- ============================================================
local widgetInfo = DockWidgetPluginGuiInfo.new(
  Enum.InitialDockState.Right,
  true,
  false,
  340,
  500,
  340,
  680
)

local widget     = plugin:CreateDockWidgetPluginGui(PLUGIN_ID, widgetInfo)
widget.Title     = "ForjeGames"
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

local pluginRoot = script
if pluginRoot then
  local authModule    = pluginRoot:FindFirstChild("Auth")
  local uiModule      = pluginRoot:FindFirstChild("UI")
  local syncModule    = pluginRoot:FindFirstChild("Sync")
  local assetModule   = pluginRoot:FindFirstChild("AssetManager")
  local historyModule = pluginRoot:FindFirstChild("History")

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
  status        = "idle",  -- "idle"|"connecting"|"connected"|"reconnecting"|"disconnected"
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
-- UI refs (populated by UI.build or fallback)
-- ============================================================
local uiRefs = nil

-- ============================================================
-- Connection status display
-- Maps status string → { text, color, dotColor }
-- ============================================================
local STATUS_DISPLAY = {
  connecting    = { text = "Connecting...",  color = COLORS.warning, dot = COLORS.warning },
  connected     = { text = "Connected",      color = COLORS.success, dot = COLORS.success },
  reconnecting  = { text = "Reconnecting...",color = COLORS.warning, dot = COLORS.warning },
  disconnected  = { text = "Disconnected",   color = COLORS.error,   dot = COLORS.error   },
  http_disabled = { text = "HTTP Disabled",  color = COLORS.error,   dot = COLORS.error   },
  idle          = { text = "Offline",        color = COLORS.textDim, dot = COLORS.textDim },
}

local function applyStatusDisplay(statusKey)
  local disp = STATUS_DISPLAY[statusKey] or STATUS_DISPLAY.idle
  state.status = statusKey

  if not uiRefs then return end

  -- Header status indicator
  if uiRefs.statusText then
    uiRefs.statusText.Text      = disp.text
    uiRefs.statusText.TextColor3 = disp.color
  end
  if uiRefs.statusDot then
    uiRefs.statusDot.BackgroundColor3 = disp.dot
  end
  if uiRefs.statusFrame then
    local bgColor
    if statusKey == "connected" then
      bgColor = Color3.fromHex("052e16")
    elseif statusKey == "connecting" or statusKey == "reconnecting" then
      bgColor = Color3.fromHex("1c1107")
    elseif statusKey == "disconnected" or statusKey == "http_disabled" then
      bgColor = Color3.fromHex("1f0707")
    else
      bgColor = Color3.fromHex("1c1917")
    end
    uiRefs.statusFrame.BackgroundColor3 = bgColor
  end

  -- Sync card status text
  if uiRefs.connStatusLabel then
    uiRefs.connStatusLabel.Text       = disp.text
    uiRefs.connStatusLabel.TextColor3 = disp.color
  end
  if uiRefs.syncIcon then
    uiRefs.syncIcon.TextColor3 = disp.color
  end
end

-- ============================================================
-- Auth + Sync logic
-- ============================================================
local function startSync(token, sessionId)
  if not Sync then return end

  local syncStatus = nil
  pcall(function() syncStatus = Sync.getStatus() end)
  if syncStatus and syncStatus.running then return end

  applyStatusDisplay("connecting")

  Sync.start({
    token          = token,
    sessionId      = sessionId,

    onStatusChange = function(connected, lastSyncTime)
      state.connected = connected
      state.lastSync  = lastSyncTime or 0

      if connected then
        applyStatusDisplay("connected")
      else
        -- Only downgrade to disconnected if not already in a more specific state
        if state.status ~= "reconnecting" and state.status ~= "http_disabled" then
          applyStatusDisplay("disconnected")
        end
      end

      if uiRefs and uiRefs.lastSyncLabel and lastSyncTime and lastSyncTime > 0 then
        local timeStr = tostring(os.date("%H:%M:%S", lastSyncTime) or "")
        if timeStr ~= "" then
          uiRefs.lastSyncLabel.Text = "Last sync: " .. timeStr
        end
      end
    end,

    onStatusMessage = function(message, level)
      -- Route messages to the appropriate UI element
      if not uiRefs then return end

      -- "Session expired" → show re-auth prompt
      if message:find("Session expired") then
        applyStatusDisplay("disconnected")
        if uiRefs.showError then
          uiRefs.showError(message)
        end
        if uiRefs.connStatusLabel then
          uiRefs.connStatusLabel.Text       = message
          uiRefs.connStatusLabel.TextColor3 = COLORS.error
        end
        return
      end

      -- "HTTP not enabled" → hard error state
      if message:find("HTTP Requests") or message:find("HTTP not enabled") then
        applyStatusDisplay("http_disabled")
        if uiRefs.connStatusLabel then
          uiRefs.connStatusLabel.Text       = "Error: HTTP not enabled"
          uiRefs.connStatusLabel.TextColor3 = COLORS.error
        end
        return
      end

      -- "Server unreachable"
      if message:find("unreachable") or message:find("Reconnecting") then
        if state.status ~= "http_disabled" then
          applyStatusDisplay("reconnecting")
        end
        if uiRefs.connStatusLabel then
          uiRefs.connStatusLabel.Text       = message
          uiRefs.connStatusLabel.TextColor3 = COLORS.warning
        end
        return
      end

      -- "Update available"
      if message:find("Update available") then
        if uiRefs.connStatusLabel then
          uiRefs.connStatusLabel.Text       = message
          uiRefs.connStatusLabel.TextColor3 = COLORS.warning
        end
        return
      end

      -- "Disconnected: max reconnect"
      if message:find("max reconnect") then
        applyStatusDisplay("disconnected")
        if uiRefs.showError then
          uiRefs.showError(message)
        end
        return
      end

      -- Generic: show in connStatusLabel
      if uiRefs.connStatusLabel then
        local color = level == "error" and COLORS.error
                   or level == "warn"  and COLORS.warning
                   or COLORS.textDim
        uiRefs.connStatusLabel.Text       = message
        uiRefs.connStatusLabel.TextColor3 = color
      end
    end,

    -- Update available callback (fired once per session)
    onUpdateAvailable = function(info)
      -- info: { latestVersion, downloadUrl, changelog, forceUpdate }
      if uiRefs and uiRefs.showUpdateBanner then
        uiRefs.showUpdateBanner(info)
      end

      -- If forceUpdate, disable action buttons so the plugin is unusable until updated
      if info.forceUpdate then
        applyStatusDisplay("disconnected")
        if uiRefs and uiRefs.setForceUpdateLock then
          uiRefs.setForceUpdateLock(true)
        end
      end

      -- Always print to Output so devs can grab the URL even if UI is hidden
      print("[ForjeGames] Plugin update available: v" .. tostring(info.latestVersion))
      print("[ForjeGames] Download: " .. tostring(info.downloadUrl))
      if info.changelog and #info.changelog > 0 then
        print("[ForjeGames] What's new: " .. info.changelog)
      end
    end,

    -- Re-auth callback: called by Sync.lua when server sends reconnect:true
    onReAuthNeeded = function()
      applyStatusDisplay("reconnecting")
      -- Re-use stored token to try re-establishing the session
      local storedToken = state.authToken
      if storedToken and storedToken ~= "" and Auth then
        -- Validate token is still good; if so just re-connect
        Auth.validateToken(storedToken, function(valid)
          if valid then
            Sync.setToken(storedToken)
            Sync.resetReconnect()
            applyStatusDisplay("connected")
          else
            -- Token is dead — force user to re-enter code
            applyStatusDisplay("disconnected")
            if uiRefs and uiRefs.showError then
              uiRefs.showError("Session expired. Enter a new code from forjegames.com/editor")
            end
            if uiRefs and uiRefs.setDisconnected then
              uiRefs.setDisconnected()
            end
          end
        end)
      else
        applyStatusDisplay("disconnected")
        if uiRefs and uiRefs.showError then
          uiRefs.showError("Session expired. Enter a new code from forjegames.com/editor")
        end
      end
    end,
  })
end

local function onAuthenticated(token, sessionId)
  state.authToken     = token
  state.sessionId     = sessionId or ""
  state.authenticated = true

  saveSetting("fj_auth_token", token)
  saveSetting("fj_session_id", sessionId or "")

  if uiRefs and uiRefs.setAuthenticated then
    uiRefs.setAuthenticated(nil)
  end

  startSync(token, sessionId)
end

local function onDisconnect()
  state.authToken     = nil
  state.sessionId     = nil
  state.authenticated = false

  saveSetting("fj_auth_token", nil)
  saveSetting("fj_session_id", nil)

  if Sync then pcall(Sync.stop) end

  applyStatusDisplay("idle")

  if uiRefs and uiRefs.setDisconnected then
    uiRefs.setDisconnected()
  end
end

local function handleAuthButton()
  if state.authenticated then
    onDisconnect()
    return
  end

  local codeBox = uiRefs and uiRefs.codeBox
  if not codeBox then return end

  local code = (codeBox.Text or ""):gsub("%s+", ""):upper()

  -- Length check is now in Auth.lua with character count — but show
  -- connecting state immediately on submit attempt
  applyStatusDisplay("connecting")
  if uiRefs.authStatus then
    uiRefs.authStatus.Text       = "Connecting..."
    uiRefs.authStatus.TextColor3 = COLORS.textDim
  end
  if uiRefs.authBtn then
    uiRefs.authBtn.Active = false
  end

  if Auth then
    Auth.exchangeCode(code, plugin, function(token, sessionId, err)
      if uiRefs and uiRefs.authBtn then uiRefs.authBtn.Active = true end
      if err then
        applyStatusDisplay("idle")
        if uiRefs and uiRefs.showError then
          uiRefs.showError(err)
        elseif uiRefs and uiRefs.authStatus then
          uiRefs.authStatus.Text       = err
          uiRefs.authStatus.TextColor3 = COLORS.error
        end
      else
        onAuthenticated(token, sessionId)
      end
    end)
  else
    applyStatusDisplay("idle")
    if uiRefs and uiRefs.showError then
      uiRefs.showError("Auth module not loaded — reinstall plugin")
    end
  end
end

-- ============================================================
-- Build UI
-- ============================================================
local function init()
  if UI then
    uiRefs = UI.build(widget, state, COLORS, plugin)
  end

  if not uiRefs then
    local bg = Instance.new("Frame")
    bg.Size             = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = COLORS.bg
    bg.BorderSizePixel  = 0
    bg.Parent           = widget

    local msg = Instance.new("TextLabel")
    msg.Text                   = "ForjeGames plugin loaded.\nUI module failed — reinstall from forjegames.com/download"
    msg.Font                   = Enum.Font.Gotham
    msg.TextSize               = 12
    msg.TextColor3             = COLORS.textDim
    msg.BackgroundTransparency = 1
    msg.Size                   = UDim2.new(1, -24, 0, 60)
    msg.Position               = UDim2.new(0, 12, 0.5, -30)
    msg.TextWrapped            = true
    msg.TextXAlignment         = Enum.TextXAlignment.Center
    msg.Parent                 = bg

    uiRefs = {}
    return
  end

  -- Wire up auth button
  if uiRefs.authBtn then
    uiRefs.authBtn.MouseButton1Click:Connect(handleAuthButton)
  end

  -- Wire up action buttons
  if uiRefs.actionButtons then
    local btns = uiRefs.actionButtons

    if btns[1] then -- Generate Terrain
      btns[1].MouseButton1Click:Connect(function()
        if not state.authenticated then
          if uiRefs.showError then uiRefs.showError("Connect first — enter your code above") end
          return
        end
        if History then History.beginWaypoint("GenerateTerrain") end
        if Sync then
          Sync.queueChange("quick_action", {
            action  = "generate_terrain",
            placeId = game.PlaceId,
            placeName = game.Name ~= "" and game.Name or tostring(game.PlaceId),
          })
        end
        if History then History.endWaypoint("GenerateTerrain") end
      end)
    end

    if btns[2] then -- Generate City
      btns[2].MouseButton1Click:Connect(function()
        if not state.authenticated then
          if uiRefs.showError then uiRefs.showError("Connect first — enter your code above") end
          return
        end
        if History then History.beginWaypoint("GenerateCity") end
        if Sync then
          Sync.queueChange("quick_action", {
            action  = "generate_city",
            placeId = game.PlaceId,
            placeName = game.Name ~= "" and game.Name or tostring(game.PlaceId),
          })
        end
        if History then History.endWaypoint("GenerateCity") end
      end)
    end

    if btns[3] then -- Insert Asset
      btns[3].MouseButton1Click:Connect(function()
        if not state.authenticated then
          if uiRefs.showError then uiRefs.showError("Connect first — enter your code above") end
          return
        end
        if History then History.beginWaypoint("InsertAsset") end
        if Sync then
          Sync.queueChange("quick_action", {
            action  = "insert_asset",
            placeId = game.PlaceId,
            placeName = game.Name ~= "" and game.Name or tostring(game.PlaceId),
          })
        end
        if History then History.endWaypoint("InsertAsset") end
      end)
    end

    if btns[4] then -- Undo
      btns[4].MouseButton1Click:Connect(function()
        pcall(function() ChangeHistoryService:Undo() end)
      end)
    end
  end

  -- If already authenticated on startup, reconnect
  if state.authenticated then
    onAuthenticated(state.authToken, state.sessionId)
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
