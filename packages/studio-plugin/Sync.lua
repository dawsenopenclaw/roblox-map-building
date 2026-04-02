--[[
  ForjeGames Studio Plugin — Sync.lua
  HTTP polling sync (2-5 second interval)

  GET  /api/studio/sync?lastSync=<timestamp>&sessionId=<id>  → pending changes
  POST /api/studio/update                                     → push local changes
  POST /api/studio/connect                                    → announce connection
  POST /api/studio/screenshot                                 → push screenshot data

  Features:
  - Exponential backoff on failures (2s → 4s → 8s → max 30s)
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
local BASE_URL     = "https://forjegames.com"
local LOCAL_URL    = "http://localhost:3000"
local MIN_INTERVAL = 2    -- seconds
local MAX_INTERVAL = 30   -- seconds (backoff ceiling)

-- ============================================================
-- Internal state
-- ============================================================
local _running           = false
local _heartbeatConn     = nil
local _token             = nil
local _sessionId         = nil
local _onStatusChange    = nil
local _lastSync          = 0
local _backoffInterval   = MIN_INTERVAL
local _timeSinceLastPoll = 0
local _changeQueue       = {}
local _pendingPush       = false
local _baseUrl           = nil

-- ============================================================
-- Resolve base URL (prefer local dev if reachable)
-- ============================================================
local function resolveBaseUrl()
  if _baseUrl then return _baseUrl end

  local ok = pcall(function()
    local res = HttpService:RequestAsync({
      Url    = LOCAL_URL .. "/api/health",
      Method = "GET",
    })
    if res and (res.StatusCode == 200 or res.StatusCode == 401) then
      _baseUrl = LOCAL_URL
    end
  end)

  if not _baseUrl then
    _baseUrl = BASE_URL
  end

  return _baseUrl
end

-- ============================================================
-- HTTP helpers (all pcall-wrapped — never crash the plugin)
-- ============================================================
local function authHeaders()
  local headers = {
    ["Content-Type"]    = "application/json",
    ["X-Plugin-Version"] = "1.0.0",
  }
  if _token then
    headers["Authorization"] = "Bearer " .. _token
  end
  if _sessionId then
    headers["X-Session-Id"] = _sessionId
  end
  return headers
end

local function httpGet(path)
  local url = resolveBaseUrl() .. path
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "GET",
      Headers = authHeaders(),
    })
  end)
  return ok and result or nil
end

local function httpPost(path, body)
  local url = resolveBaseUrl() .. path
  local encoded
  local encOk, encErr = pcall(function()
    encoded = HttpService:JSONEncode(body)
  end)
  if not encOk then
    warn("[ForjeGames Sync] JSON encode error: " .. tostring(encErr))
    return nil
  end

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "POST",
      Headers = authHeaders(),
      Body    = encoded,
    })
  end)
  return ok and result or nil
end

-- ============================================================
-- execute_luau handler
-- loadstring is available in Studio plugin context.
-- If disabled by FFlag, falls back to structured command parse.
-- ============================================================
local function executeStructuredCommand(data)
  -- Fallback: interpret a structured {action, ...} table instead of raw Luau.
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

  -- Attempt loadstring (available in Studio plugin scripts)
  local loadOk = false
  pcall(function()
    -- loadstring returns fn, err
    local fn, parseErr = loadstring(data.code)
    if fn then
      loadOk = true
      local ok, execErr = pcall(fn)
      if not ok then
        warn("[ForjeGames] Execution error: " .. tostring(execErr))
      end
    else
      warn("[ForjeGames] Parse error: " .. tostring(parseErr))
      -- Fall through to structured command if loadstring gave us nil
      if data.structured then
        executeStructuredCommand(data.structured)
      end
    end
  end)

  if not loadOk and data.structured then
    -- loadstring itself errored (security restricted) — use structured fallback
    executeStructuredCommand(data.structured)
  end
end

-- ============================================================
-- insert_asset command handler
--
-- Triggered by POST /api/studio/push-asset from the web editor
-- after a mesh has been uploaded to Roblox via Open Cloud.
--
-- change.data shape:
--   robloxAssetId  string   — numeric Roblox asset ID for InsertService
--   assetId        string   — internal ForjeGames asset ID (stored as attribute)
--   name           string?  — display name for the inserted model
--   position       table?   — { x, y, z } world-space position (Y is up)
--
-- Reports success/failure back on the next heartbeat via Sync.queueChange.
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

  -- Delegate to AssetManager so we get ChangeHistory waypoints + stamping
  local assetOk, assetErr = pcall(function()
    local AssetManager = require(script.Parent.AssetManager)

    -- Build a position CFrame if coordinates were supplied
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
      -- Queue a success event so the web editor can confirm insertion
      Sync.queueChange("asset_inserted", {
        assetId       = data.assetId,
        robloxAssetId = tostring(robloxAssetId),
        instanceName  = model.Name,
        success       = true,
      })
    else
      -- LoadAsset returned nil — report failure
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
    -- Still report failure upstream so the web editor can surface the error
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
    pluginVersion = "1.0.0",
    sessionId     = _sessionId,
  }

  local result = httpPost("/api/studio/connect", payload)
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

  local result = httpGet(path)

  if not result then
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    if _onStatusChange then _onStatusChange(false, _lastSync) end
    return
  end

  local status = result.StatusCode

  if status == 200 then
    _backoffInterval = MIN_INTERVAL
    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)
    if ok and data then
      _lastSync = data.serverTime or os.time()
      if data.changes and #data.changes > 0 then
        applyChanges(data.changes)
      end
    end
    if _onStatusChange then _onStatusChange(true, _lastSync) end

  elseif status == 401 then
    warn("[ForjeGames Sync] Auth expired — please reconnect in the plugin")
    _backoffInterval = MAX_INTERVAL
    if _onStatusChange then _onStatusChange(false, _lastSync) end

  elseif status == 429 then
    -- Rate limited: aggressive backoff
    _backoffInterval = math.min(_backoffInterval * 3, MAX_INTERVAL)

  else
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    if _onStatusChange then _onStatusChange(false, _lastSync) end
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

  local result = httpPost("/api/studio/update", payload)
  if not (result and result.StatusCode == 200) then
    -- Re-queue on failure
    for _, c in ipairs(batch) do
      table.insert(_changeQueue, c)
    end
    warn("[ForjeGames Sync] Failed to push changes, will retry")
  end
end

-- ============================================================
-- Heartbeat tick
-- ============================================================
local function onHeartbeat(dt)
  if not _running then return end

  _timeSinceLastPoll = _timeSinceLastPoll + dt

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
-- ============================================================
function Sync.start(opts)
  if _running then return end

  _token             = opts.token
  _sessionId         = opts.sessionId or nil
  _onStatusChange    = opts.onStatusChange
  _backoffInterval   = MIN_INTERVAL
  _timeSinceLastPoll = 0
  _running           = true

  -- Resolve base URL on startup (background — doesn't block)
  task.spawn(function()
    resolveBaseUrl()
    -- Announce connection once base URL is known
    sendConnect()
  end)

  -- Attach heartbeat
  _heartbeatConn = RunService.Heartbeat:Connect(onHeartbeat)

  -- Initial poll after a short delay (give connect time to register)
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
  _token           = token
  _backoffInterval = MIN_INTERVAL
  -- Re-announce connection with new token
  task.spawn(sendConnect)
end

-- ============================================================
-- Public: get current sync status
-- ============================================================
function Sync.getStatus()
  return {
    running         = _running,
    connected       = _backoffInterval == MIN_INTERVAL,
    lastSync        = _lastSync,
    backoffInterval = _backoffInterval,
    pendingChanges  = #_changeQueue,
    sessionId       = _sessionId,
  }
end

return Sync
