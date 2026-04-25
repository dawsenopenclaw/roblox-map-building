--[[
  ForjeGames Studio Plugin — AutoUpdater.lua
  Checks for plugin updates and notifies the user.

  IMPORTANT: Roblox Studio plugins run in a sandboxed Lua environment.
  io, os, writefile, and filesystem access are NOT available.
  The plugin CANNOT write files to disk.

  Instead, this module:
  1. Checks /api/studio/version for the latest plugin version
  2. Compares against the current PLUGIN_VERSION
  3. If an update is available, notifies the user via the plugin UI
  4. The actual file replacement happens via:
     - The website's one-click installer (showDirectoryPicker API)
     - OR the user re-downloading from forjegames.com/download

  The website remembers the user's Plugins folder (IndexedDB) so future
  updates can be applied with a single click from the browser.
--]]

local HttpService = game:GetService("HttpService")

local AutoUpdater = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL = "https://forjegames.com"
local CHECK_INTERVAL = 300  -- seconds between update checks (5 min)

-- ============================================================
-- Internal state
-- ============================================================
local _pluginRef       = nil
local _currentVersion  = "0.0.0"
local _latestVersion   = nil
local _downloadUrl     = nil
local _changelog       = nil
local _forceUpdate     = false
local _updateReady     = false
local _onUpdateStatus  = nil  -- callback: fn(status, info)
local _lastCheck       = 0

-- ============================================================
-- Semver comparison: returns true if a < b
-- ============================================================
local function semverLt(a, b)
  local function parse(v)
    local parts = {}
    for s in tostring(v):gmatch("(%d+)") do
      table.insert(parts, tonumber(s) or 0)
    end
    while #parts < 3 do table.insert(parts, 0) end
    return parts
  end

  local pa, pb = parse(a), parse(b)
  for i = 1, 3 do
    if pa[i] ~= pb[i] then return pa[i] < pb[i] end
  end
  return false
end

-- ============================================================
-- Resolve base URL (supports dev override)
-- ============================================================
local function resolveBaseUrl()
  local devUrl = nil
  pcall(function()
    if _pluginRef then
      devUrl = _pluginRef:GetSetting("ForjeGames_DevUrl")
    end
  end)
  if devUrl and type(devUrl) == "string" and #devUrl > 0 then
    return devUrl
  end
  return BASE_URL
end

-- ============================================================
-- Check for updates via /api/studio/version
-- ============================================================
function AutoUpdater.checkForUpdate()
  local url = resolveBaseUrl() .. "/api/studio/version?pluginVer=" .. _currentVersion

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "GET",
      Headers = { ["Content-Type"] = "application/json" },
    })
  end)

  if not ok or not result then
    return false, "Network error checking for updates"
  end

  if result.StatusCode ~= 200 then
    return false, "Server returned " .. tostring(result.StatusCode)
  end

  local parseOk, data = pcall(function()
    return HttpService:JSONDecode(result.Body)
  end)

  if not parseOk or not data then
    return false, "Failed to parse version response"
  end

  _latestVersion = data.version
  _downloadUrl   = data.downloadUrl
  _changelog     = data.changelog or ""
  _forceUpdate   = data.forceUpdate == true

  if semverLt(_currentVersion, _latestVersion) then
    _updateReady = true
    return true, {
      currentVersion = _currentVersion,
      latestVersion  = _latestVersion,
      downloadUrl    = _downloadUrl,
      changelog      = _changelog,
      forceUpdate    = _forceUpdate,
    }
  end

  _updateReady = false
  return false, "Already up to date"
end

-- ============================================================
-- Initialize the auto-updater
-- opts:
--   pluginRef        Plugin object
--   currentVersion   string (e.g. "4.8.0")
--   onUpdateStatus   fn(status, info)
--     status: "checking"|"available"|"up_to_date"|"error"
-- ============================================================
function AutoUpdater.init(opts)
  _pluginRef       = opts.pluginRef
  _currentVersion  = opts.currentVersion or "0.0.0"
  _onUpdateStatus  = opts.onUpdateStatus

  -- Check for updates after plugin fully initializes
  task.spawn(function()
    task.wait(3)

    if _onUpdateStatus then
      _onUpdateStatus("checking", { currentVersion = _currentVersion })
    end

    local hasUpdate, info = AutoUpdater.checkForUpdate()

    if hasUpdate then
      if _onUpdateStatus then
        _onUpdateStatus("available", info)
      end

      -- Print to Output so devs always see it
      print("[ForjeGames] Update available: v" .. tostring(info.latestVersion))
      print("[ForjeGames] Download: " .. tostring(info.downloadUrl or "forjegames.com/download"))
      if info.changelog and #info.changelog > 0 then
        print("[ForjeGames] What's new: " .. info.changelog)
      end
      if info.forceUpdate then
        warn("[ForjeGames] This update is REQUIRED. Please update to continue using ForjeGames.")
      end
    else
      if _onUpdateStatus then
        _onUpdateStatus("up_to_date", { currentVersion = _currentVersion })
      end
    end

    _lastCheck = tick()

    -- Periodic re-check loop
    while true do
      task.wait(CHECK_INTERVAL)
      if not _updateReady then
        local newUpdate, newInfo = AutoUpdater.checkForUpdate()
        if newUpdate then
          if _onUpdateStatus then
            _onUpdateStatus("available", newInfo)
          end
          print("[ForjeGames] Update available: v" .. tostring(newInfo.latestVersion))
        end
        _lastCheck = tick()
      end
    end
  end)
end

-- ============================================================
-- Public: get current state
-- ============================================================
function AutoUpdater.getState()
  return {
    currentVersion = _currentVersion,
    latestVersion  = _latestVersion,
    updateReady    = _updateReady,
    forceUpdate    = _forceUpdate,
    lastCheck      = _lastCheck,
  }
end

-- ============================================================
-- Public: trigger manual update check
-- ============================================================
function AutoUpdater.triggerCheck()
  task.spawn(function()
    if _onUpdateStatus then
      _onUpdateStatus("checking", { currentVersion = _currentVersion })
    end

    local hasUpdate, info = AutoUpdater.checkForUpdate()
    if hasUpdate then
      if _onUpdateStatus then
        _onUpdateStatus("available", info)
      end
    else
      if _onUpdateStatus then
        _onUpdateStatus("up_to_date", { currentVersion = _currentVersion })
      end
    end
  end)
end

return AutoUpdater
