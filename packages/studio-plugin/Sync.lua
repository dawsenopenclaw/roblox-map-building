--[[
  ForjeGames Studio Plugin — Sync.lua
  HTTP polling sync (2-5 second interval)

  GET  /api/studio/sync?lastSync=<timestamp>&sessionId=<id>  → pending changes
  POST /api/studio/update                                     → push local changes + heartbeat
  POST /api/studio/connect                                    → announce connection
  POST /api/studio/screenshot                                 → push screenshot data

  Features:
  - Exponential backoff on failures (2s → 4s → 8s → max 30s)
  - Auto-reconnect on reconnect:true response (max 10 attempts)
  - Session expiry detection (401) with clear UI messaging
  - Server-unreachable detection with soft retry status
  - Update-available notification (once per Studio session)
  - Dedicated heartbeat keepalive POST every 30s (prevents session timeout)
  - Graceful degradation: retries silently, never crashes plugin
  - Change queue: batches local changes before pushing
  - execute_luau command handler with loadstring + pcall
--]]

local HttpService = game:GetService("HttpService")
local RunService  = game:GetService("RunService")

local Sync = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL           = "https://forjegames.com"
local PLUGIN_VERSION     = "4.4.0"
local MIN_INTERVAL       = 2    -- seconds
local MAX_INTERVAL       = 30   -- seconds (backoff ceiling)
local HEARTBEAT_INTERVAL = 30   -- seconds between keepalive POSTs
local MAX_RECONNECT      = 10   -- give up after this many consecutive reconnect attempts

-- ============================================================
-- Internal state
-- ============================================================
local _running             = false
local _heartbeatConn       = nil
local _token               = nil
local _sessionId           = nil
local _onStatusChange      = nil
local _onStatusMessage     = nil   -- fn(message: string, level: "info"|"warn"|"error")
local _onUpdateAvailable   = nil   -- fn(info: {latestVersion, downloadUrl, changelog, forceUpdate})
local _lastSync            = 0
local _backoffInterval     = MIN_INTERVAL
local _timeSinceLastPoll   = 0
local _timeSinceHeartbeat  = 0
local _changeQueue         = {}
local _pendingPush         = false
local _baseUrl             = nil
local _reconnectAttempts   = 0
local _updateNotified      = false   -- only show update banner once per session
local _reAuthCallback      = nil     -- set by Sync.start, called when re-auth is needed

-- ============================================================
-- Resolve base URL (production default, dev override via settings)
-- ============================================================
local function resolveBaseUrl()
  if _baseUrl then return _baseUrl end

  pcall(function()
    local devUrl = plugin and plugin:GetSetting("ForjeGames_DevUrl")
    if devUrl and type(devUrl) == "string" and #devUrl > 0 then
      _baseUrl = devUrl
    end
  end)

  if not _baseUrl then
    _baseUrl = BASE_URL
  end

  return _baseUrl
end

-- ============================================================
-- Status helpers
-- ============================================================
local function notifyStatus(connected, lastSyncTime)
  if _onStatusChange then
    _onStatusChange(connected, lastSyncTime)
  end
end

local function notifyMessage(message, level)
  level = level or "info"
  if _onStatusMessage then
    _onStatusMessage(message, level)
  else
    -- Fallback to Studio Output
    if level == "error" then
      warn("[ForjeGames] " .. message)
    elseif level == "warn" then
      warn("[ForjeGames] " .. message)
    else
      print("[ForjeGames] " .. message)
    end
  end
end

-- ============================================================
-- HTTP helpers (all pcall-wrapped — never crash the plugin)
-- ============================================================
local function authHeaders()
  local headers = {
    ["Content-Type"]     = "application/json",
    ["X-Plugin-Version"] = PLUGIN_VERSION,
  }
  if _token then
    headers["Authorization"] = "Bearer " .. _token
  end
  if _sessionId then
    headers["X-Session-Id"] = _sessionId
  end
  return headers
end

-- Returns result table on success, nil on network failure, string "http_disabled"
-- if HttpService is blocked, string "unreachable" if server cannot be reached.
local function httpGet(path)
  local url = resolveBaseUrl() .. path
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "GET",
      Headers = authHeaders(),
    })
  end)

  if not ok then
    local errStr = tostring(result)
    -- Roblox throws "Http requests are not enabled" when HTTP is off
    if errStr:find("not enabled") or errStr:find("Http") then
      return nil, "http_disabled"
    end
    -- DNS failure or connection refused
    return nil, "unreachable"
  end

  return result, nil
end

local function httpPost(path, body)
  local url = resolveBaseUrl() .. path
  local encoded
  local encOk, encErr = pcall(function()
    encoded = HttpService:JSONEncode(body)
  end)
  if not encOk then
    warn("[ForjeGames Sync] JSON encode error: " .. tostring(encErr))
    return nil, nil
  end

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "POST",
      Headers = authHeaders(),
      Body    = encoded,
    })
  end)

  if not ok then
    local errStr = tostring(result)
    if errStr:find("not enabled") or errStr:find("Http") then
      return nil, "http_disabled"
    end
    return nil, "unreachable"
  end

  return result, nil
end

-- ============================================================
-- execute_luau handler
-- ============================================================
local function executeStructuredCommand(data)
  local action = data.action
  if action == "create_part" then
    local part = Instance.new("Part")
    part.Name     = data.name or "FJ_Part"
    part.Size     = Vector3.new(
      data.sizeX or 4,
      data.sizeY or 4,
      data.sizeZ or 4
    )
    part.CFrame   = CFrame.new(
      data.posX or 0,
      data.posY or 5,
      data.posZ or 0
    )
    part.Anchored = true
    part:SetAttribute("fj_generated", true)
    part.Parent   = workspace
  elseif action == "delete_named" then
    local inst = workspace:FindFirstChild(data.name or "", true)
    if inst then inst:Destroy() end
  elseif action == "set_property" then
    local inst = workspace:FindFirstChild(data.instancePath or "", true)
    if inst and data.property and data.value ~= nil then
      pcall(function()
        inst[data.property] = data.value
      end)
    end
  end
end

local function handleExecuteLuau(data)
  if not data or not data.code then return end

  local loadOk = false
  pcall(function()
    local fn, parseErr = loadstring(data.code)
    if fn then
      loadOk = true
      local ok, execErr = pcall(fn)
      if not ok then
        warn("[ForjeGames] Execution error: " .. tostring(execErr))
      end
    else
      warn("[ForjeGames] Parse error: " .. tostring(parseErr))
      if data.structured then
        executeStructuredCommand(data.structured)
      end
    end
  end)

  if not loadOk and data.structured then
    executeStructuredCommand(data.structured)
  end
end

-- ============================================================
-- insert_asset command handler
-- ============================================================
local function handleInsertAsset(change)
  local data = change and change.data
  if not data then
    warn("[ForjeGames Sync] insert_asset: missing data payload")
    return
  end

  local robloxAssetId = data.robloxAssetId
  if not robloxAssetId then
    warn("[ForjeGames Sync] insert_asset: robloxAssetId is required")
    return
  end

  local assetOk, assetErr = pcall(function()
    local AssetManager = require(script.Parent.AssetManager)

    local cframe = nil
    if data.position then
      local px = tonumber(data.position.x) or 0
      local py = tonumber(data.position.y) or 0
      local pz = tonumber(data.position.z) or 0
      cframe = CFrame.new(px, py, pz)
    end

    local model = AssetManager.loadMarketplaceAsset(robloxAssetId, {
      name       = data.name or ("FJ_Asset_" .. tostring(robloxAssetId)),
      cframe     = cframe,
      attributes = {
        fj_asset_id        = tostring(data.assetId or robloxAssetId),
        fj_roblox_asset_id = tostring(robloxAssetId),
      },
    })

    if model then
      Sync.queueChange("asset_inserted", {
        assetId       = data.assetId,
        robloxAssetId = tostring(robloxAssetId),
        instanceName  = model.Name,
        success       = true,
      })
    else
      Sync.queueChange("asset_insert_failed", {
        assetId       = data.assetId,
        robloxAssetId = tostring(robloxAssetId),
        error         = "LoadAsset returned nil",
        success       = false,
      })
    end
  end)

  if not assetOk then
    warn("[ForjeGames Sync] insert_asset failed: " .. tostring(assetErr))
    Sync.queueChange("asset_insert_failed", {
      assetId       = tostring(data.assetId or ""),
      robloxAssetId = tostring(robloxAssetId),
      error         = tostring(assetErr),
      success       = false,
    })
  end
end

-- ============================================================
-- Apply incoming changes from the server
-- ============================================================
local function applyChanges(changes)
  if not changes or type(changes) ~= "table" then return end

  for _, change in ipairs(changes) do
    local ok, err = pcall(function()
      local changeType = change.type
      local data       = change.data

      if changeType == "execute_luau" then
        handleExecuteLuau(data)

      elseif changeType == "insert_asset" and data then
        handleInsertAsset(change)

      elseif changeType == "insert_model" and data then
        local assetOk, assetErr = pcall(function()
          local AssetManager = require(script.Parent.AssetManager)
          AssetManager.insertFromChange(change)
        end)
        if not assetOk then
          warn("[ForjeGames Sync] insert_model failed: " .. tostring(assetErr))
        end

      elseif changeType == "delete_model" and data and data.name then
        local instance = workspace:FindFirstChild(data.name, true)
        if instance then instance:Destroy() end

      elseif changeType == "update_property" and data then
        local instance = workspace:FindFirstChild(data.instancePath or "", true)
        if instance and data.property and data.value ~= nil then
          pcall(function()
            instance[data.property] = data.value
          end)
        end
      end
    end)

    if not ok then
      warn("[ForjeGames Sync] Failed to apply change: " .. tostring(err))
    end
  end
end

-- ============================================================
-- Announce connection to the server
-- ============================================================
local function sendConnect()
  if not _token then return end

  local payload = {
    token         = _token,
    placeId       = game.PlaceId,
    placeName     = game.Name ~= "" and game.Name or tostring(game.PlaceId),
    pluginVersion = PLUGIN_VERSION,
    sessionId     = _sessionId,
  }

  local result, netErr = httpPost("/api/studio/connect", payload)
  if netErr == "http_disabled" then
    notifyMessage("Enable HTTP Requests in Game Settings > Security", "error")
    notifyStatus(false, _lastSync)
    return
  end

  if result and result.StatusCode == 200 then
    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)
    if ok and data and data.sessionId then
      _sessionId = data.sessionId
    end
  end
end

-- ============================================================
-- Re-authenticate using stored token (called on reconnect: true)
-- ============================================================
local function attemptReAuth()
  _reconnectAttempts = _reconnectAttempts + 1

  if _reconnectAttempts > MAX_RECONNECT then
    notifyMessage("Disconnected: max reconnect attempts reached. Re-enter your code.", "error")
    notifyStatus(false, _lastSync)
    if _onStatusMessage then
      _onStatusMessage("Disconnected", "error")
    end
    _running = false
    if _heartbeatConn then
      _heartbeatConn:Disconnect()
      _heartbeatConn = nil
    end
    return
  end

  notifyMessage("Reconnecting... (attempt " .. _reconnectAttempts .. "/" .. MAX_RECONNECT .. ")", "warn")
  notifyStatus(false, _lastSync)

  if _reAuthCallback then
    -- Delegate re-auth to Plugin.lua which holds the reauthenticate function
    task.spawn(_reAuthCallback)
  else
    -- No callback: try reconnecting with existing token via connect endpoint
    task.spawn(function()
      sendConnect()
      _backoffInterval = MIN_INTERVAL
    end)
  end
end

-- ============================================================
-- Poll for pending server changes
-- ============================================================
local function pollSync()
  if not _token then return end

  local path = "/api/studio/sync?lastSync=" .. tostring(math.floor(_lastSync))
  if _sessionId then
    path = path .. "&sessionId=" .. _sessionId
  end
  if _token then
    path = path .. "&token=" .. _token
  end

  local result, netErr = httpGet(path)

  -- Network-layer errors
  if netErr == "http_disabled" then
    notifyMessage("Error: HTTP not enabled — enable in Game Settings > Security", "error")
    notifyStatus(false, _lastSync)
    return
  end

  if netErr == "unreachable" or not result then
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    notifyMessage("Server unreachable — retrying in " .. _backoffInterval .. "s", "warn")
    notifyStatus(false, _lastSync)
    return
  end

  local status = result.StatusCode

  if status == 200 then
    _backoffInterval     = MIN_INTERVAL
    _reconnectAttempts   = 0

    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)

    if ok and data then
      _lastSync = data.serverTime or os.time()

      -- Apply pending studio commands
      if data.changes and #data.changes > 0 then
        applyChanges(data.changes)
      end

      -- Auto-reconnect flag from server
      if data.reconnect == true then
        attemptReAuth()
        return
      end

      -- Update available notification (once per session)
      if data.updateAvailable == true and not _updateNotified then
        _updateNotified = true
        -- Fire the rich update callback if registered (used by Plugin.lua to show banner)
        if _onUpdateAvailable then
          _onUpdateAvailable({
            latestVersion = data.latestVersion or "latest",
            downloadUrl   = data.downloadUrl or data.updateUrl or (resolveBaseUrl() .. "/api/studio/plugin"),
            changelog     = data.changelog or "",
            forceUpdate   = data.forceUpdate == true,
          })
        else
          -- Fallback: plain Output message
          notifyMessage(
            "Plugin update available (v" .. (data.latestVersion or "latest") .. ")! " ..
            "Download: " .. (data.downloadUrl or data.updateUrl or "forjegames.com/download"),
            "warn"
          )
        end
      end
    end

    notifyStatus(true, _lastSync)

  elseif status == 401 then
    -- Session expired — prompt user to re-enter code
    _backoffInterval = MAX_INTERVAL
    notifyMessage("Session expired. Enter a new code from forjegames.com/editor", "error")
    notifyStatus(false, _lastSync)

  elseif status == 403 then
    -- HTTP service blocked at the game level
    notifyMessage("Enable HTTP Requests in Game Settings > Security", "error")
    notifyStatus(false, _lastSync)

  elseif status == 429 then
    -- Rate limited
    _backoffInterval = math.min(_backoffInterval * 3, MAX_INTERVAL)
    notifyStatus(false, _lastSync)

  else
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    notifyStatus(false, _lastSync)
  end
end

-- ============================================================
-- Push local changes to API
-- ============================================================
local function pushChanges()
  if #_changeQueue == 0 then return end
  if not _token then return end

  local batch = {}
  for _, c in ipairs(_changeQueue) do
    table.insert(batch, c)
  end
  _changeQueue  = {}
  _pendingPush  = false

  local payload = {
    timestamp = os.time(),
    changes   = batch,
    source    = "studio-plugin",
    placeId   = game.PlaceId,
    jobId     = game.JobId,
    sessionId = _sessionId,
  }

  local result, netErr = httpPost("/api/studio/update", payload)
  if not (result and result.StatusCode == 200) then
    -- Re-queue on failure
    for _, c in ipairs(batch) do
      table.insert(_changeQueue, c)
    end
    if netErr ~= "http_disabled" then
      warn("[ForjeGames Sync] Failed to push changes, will retry")
    end
  end
end

-- ============================================================
-- Heartbeat keepalive POST (every 30 seconds)
-- Prevents the session from timing out during idle periods.
-- ============================================================
local function sendHeartbeat()
  if not _token then return end

  local payload = {
    heartbeat  = true,
    timestamp  = os.time(),
    sessionId  = _sessionId,
    placeId    = game.PlaceId,
    pluginVersion = PLUGIN_VERSION,
  }

  -- Fire and forget — don't block on result, don't retry
  task.spawn(function()
    local result, netErr = httpPost("/api/studio/update", payload)
    if netErr == "http_disabled" then
      notifyMessage("Error: HTTP not enabled — enable in Game Settings > Security", "error")
    end
    -- Heartbeat failure is silent — pollSync handles status display
  end)
end

-- ============================================================
-- Heartbeat tick
-- ============================================================
local function onHeartbeat(dt)
  if not _running then return end

  _timeSinceLastPoll  = _timeSinceLastPoll  + dt
  _timeSinceHeartbeat = _timeSinceHeartbeat + dt

  -- Dedicated keepalive heartbeat
  if _timeSinceHeartbeat >= HEARTBEAT_INTERVAL then
    _timeSinceHeartbeat = 0
    sendHeartbeat()
  end

  -- Poll + push cycle
  if _timeSinceLastPoll >= _backoffInterval then
    _timeSinceLastPoll = 0
    pollSync()
    if _pendingPush then
      pushChanges()
    end
  end
end

-- ============================================================
-- Public: push a screenshot payload
-- ============================================================
function Sync.pushScreenshot(imageData)
  if not _token then return end
  local payload = {
    image     = imageData,
    placeId   = game.PlaceId,
    sessionId = _sessionId,
    timestamp = os.time(),
  }
  local result = httpPost("/api/studio/screenshot", payload)
  return result and result.StatusCode == 200
end

-- ============================================================
-- Public: queue a local change for push
-- ============================================================
function Sync.queueChange(changeType, data)
  table.insert(_changeQueue, {
    type      = changeType,
    data      = data,
    timestamp = os.time(),
  })
  _pendingPush = true
end

-- ============================================================
-- Public: start sync loop
--
-- opts:
--   token           string   — bearer token
--   sessionId       string?  — session ID from auth
--   onStatusChange  fn(connected: bool, lastSync: number)
--   onStatusMessage fn(message: string, level: "info"|"warn"|"error")
--   onReAuthNeeded  fn()     — called when the plugin must re-authenticate
-- ============================================================
function Sync.start(opts)
  if _running then return end

  _token              = opts.token
  _sessionId          = opts.sessionId or nil
  _onStatusChange     = opts.onStatusChange
  _onStatusMessage    = opts.onStatusMessage
  _onUpdateAvailable  = opts.onUpdateAvailable
  _reAuthCallback     = opts.onReAuthNeeded
  _backoffInterval    = MIN_INTERVAL
  _timeSinceLastPoll  = 0
  _timeSinceHeartbeat = 0
  _reconnectAttempts  = 0
  _running            = true

  task.spawn(function()
    resolveBaseUrl()
    sendConnect()
  end)

  _heartbeatConn = RunService.Heartbeat:Connect(onHeartbeat)

  task.delay(1, pollSync)
end

-- ============================================================
-- Public: stop sync loop
-- ============================================================
function Sync.stop()
  _running = false
  if _heartbeatConn then
    _heartbeatConn:Disconnect()
    _heartbeatConn = nil
  end
end

-- ============================================================
-- Public: update auth token (after re-login)
-- ============================================================
function Sync.setToken(token)
  _token             = token
  _backoffInterval   = MIN_INTERVAL
  _reconnectAttempts = 0
  task.spawn(sendConnect)
end

-- ============================================================
-- Public: reset reconnect attempt counter
-- (called by Plugin.lua after a successful re-auth)
-- ============================================================
function Sync.resetReconnect()
  _reconnectAttempts = 0
  _backoffInterval   = MIN_INTERVAL
end

-- ============================================================
-- Public: get current sync status
-- ============================================================
function Sync.getStatus()
  return {
    running            = _running,
    connected          = _backoffInterval == MIN_INTERVAL,
    lastSync           = _lastSync,
    backoffInterval    = _backoffInterval,
    pendingChanges     = #_changeQueue,
    sessionId          = _sessionId,
    reconnectAttempts  = _reconnectAttempts,
  }
end

return Sync
