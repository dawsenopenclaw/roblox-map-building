--[[
  RobloxForge Studio Plugin — Sync.lua
  PLUG-02: HTTP polling sync (2-5 second interval)

  GET  /api/studio/sync?lastSync=<timestamp>  → pending changes
  POST /api/studio/update                     → push local changes
  GET  /api/studio/status                     → connection health

  Features:
  - Exponential backoff on failures (2s → 4s → 8s → max 30s)
  - Graceful degradation: retries silently, never crashes plugin
  - Change queue: batches local changes before pushing
--]]

local HttpService = game:GetService("HttpService")
local RunService  = game:GetService("RunService")

local Sync = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL       = "https://robloxforge.app"
local LOCAL_URL      = "http://localhost:3001"
local MIN_INTERVAL   = 2   -- seconds
local MAX_INTERVAL   = 30  -- seconds (backoff ceiling)
local STATUS_TIMEOUT = 5   -- seconds between status checks

-- ============================================================
-- Internal state
-- ============================================================
local _running        = false
local _heartbeatConn  = nil
local _token          = nil
local _onStatusChange = nil
local _lastSync       = 0
local _lastStatusCheck = 0
local _backoffInterval = MIN_INTERVAL
local _timeSinceLastPoll = 0
local _changeQueue    = {}
local _pendingPush    = false

-- ============================================================
-- Detect API base URL
-- ============================================================
local _baseUrl = nil

local function resolveBaseUrl()
  if _baseUrl then return _baseUrl end

  -- game:HttpGetAsync does not exist — the correct API is HttpService:GetAsync
  local ok = pcall(function()
    local res = HttpService:GetAsync(LOCAL_URL .. "/health", true)
    if res and #res > 0 then
      _baseUrl = LOCAL_URL
    end
  end)

  if not _baseUrl then
    _baseUrl = BASE_URL
  end

  return _baseUrl
end

-- ============================================================
-- HTTP helpers
-- ============================================================
local function authHeaders()
  local headers = { ["Content-Type"] = "application/json" }
  if _token then
    headers["Authorization"] = "Bearer " .. _token
    headers["X-Plugin-Version"] = "1.0.0"
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
  local encoded = HttpService:JSONEncode(body)
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
-- Apply incoming changes from API
-- ============================================================
local function applyChanges(changes)
  if not changes or type(changes) ~= "table" then return end

  for _, change in ipairs(changes) do
    local ok, err = pcall(function()
      local changeType = change.type
      local data       = change.data

      if changeType == "insert_model" and data then
        -- Signal AssetManager to insert the model
        local assetOk, assetErr = pcall(function()
          local AssetManager = require(script.Parent.AssetManager)
          AssetManager.insertFromChange(change)
        end)
        if not assetOk then
          warn("[RobloxForge Sync] insert_model failed: " .. tostring(assetErr))
        end
      elseif changeType == "delete_model" and data and data.name then
        local instance = workspace:FindFirstChild(data.name, true)
        if instance then
          instance:Destroy()
        end
      elseif changeType == "update_property" and data then
        local instance = workspace:FindFirstChild(data.instancePath, true)
        if instance and data.property and data.value ~= nil then
          pcall(function()
            instance[data.property] = data.value
          end)
        end
      end
    end)

    if not ok then
      warn("[RobloxForge Sync] Failed to apply change: " .. tostring(err))
    end
  end
end

-- ============================================================
-- Poll for pending server changes
-- ============================================================
local function pollSync()
  local path = "/api/studio/sync?lastSync=" .. tostring(math.floor(_lastSync))

  local result = httpGet(path)

  if not result then
    -- Failure: increase backoff
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    if _onStatusChange then
      _onStatusChange(false, _lastSync)
    end
    return
  end

  -- Success: reset backoff
  _backoffInterval = MIN_INTERVAL

  local status = result.StatusCode
  if status == 200 then
    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)

    if ok and data then
      _lastSync = data.serverTime or os.time()

      if data.changes and #data.changes > 0 then
        applyChanges(data.changes)
      end
    end

    if _onStatusChange then
      _onStatusChange(true, _lastSync)
    end
  elseif status == 401 then
    warn("[RobloxForge Sync] Auth expired — please reconnect")
    _backoffInterval = MAX_INTERVAL
    if _onStatusChange then
      _onStatusChange(false, _lastSync)
    end
  elseif status == 429 then
    -- Rate limited: back off
    _backoffInterval = math.min(_backoffInterval * 3, MAX_INTERVAL)
  end
end

-- ============================================================
-- Push local changes to API
-- ============================================================
local function pushChanges()
  if #_changeQueue == 0 then return end

  local batch = {}
  for _, c in ipairs(_changeQueue) do
    table.insert(batch, c)
  end
  _changeQueue = {}
  _pendingPush = false

  local payload = {
    timestamp = os.time(),
    changes   = batch,
    source    = "studio-plugin",
    placeId   = game.PlaceId,
    jobId     = game.JobId,
  }

  local result = httpPost("/api/studio/update", payload)

  if result and result.StatusCode == 200 then
    -- Changes accepted
  else
    -- Re-queue on failure (don't lose changes)
    for _, c in ipairs(batch) do
      table.insert(_changeQueue, c)
    end
    warn("[RobloxForge Sync] Failed to push changes, will retry")
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

    -- Push any queued local changes
    if _pendingPush then
      pushChanges()
    end
  end
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

  _token          = opts.token
  _onStatusChange = opts.onStatusChange
  _backoffInterval = MIN_INTERVAL
  _timeSinceLastPoll = 0
  _running        = true

  -- Resolve base URL on startup
  task.spawn(resolveBaseUrl)

  -- Attach heartbeat
  _heartbeatConn = RunService.Heartbeat:Connect(onHeartbeat)

  -- Initial sync immediately
  task.delay(0.1, pollSync)
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
-- Public: update auth token (e.g. after re-login)
-- ============================================================
function Sync.setToken(token)
  _token = token
  _backoffInterval = MIN_INTERVAL  -- reset backoff
end

-- ============================================================
-- Public: get current sync status
-- ============================================================
function Sync.getStatus()
  return {
    running          = _running,
    connected        = _backoffInterval == MIN_INTERVAL,
    lastSync         = _lastSync,
    backoffInterval  = _backoffInterval,
    pendingChanges   = #_changeQueue,
  }
end

return Sync
