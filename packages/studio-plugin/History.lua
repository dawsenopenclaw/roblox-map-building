--[[
  RobloxForge Studio Plugin — History.lua
  PLUG-04: ChangeHistoryService wrapper

  Every AI operation gets:
  1. beginWaypoint() call before changes
  2. endWaypoint() call after changes
  3. Named waypoints so Studio's undo stack shows "Undo: RF_GenerateTerrain"

  Users can undo/redo ALL AI operations via Ctrl+Z / Ctrl+Y in Studio.
--]]

local ChangeHistoryService = game:GetService("ChangeHistoryService")

local History = {}

-- ============================================================
-- Waypoint registry (tracks open waypoints)
-- ============================================================
local _openWaypoints = {}
local _waypointHistory = {}  -- Full history log

-- Maximum history entries to keep in memory
local MAX_HISTORY = 100

-- ============================================================
-- Waypoint name formatter
-- ============================================================
local function formatWaypointName(operationName)
  -- Studio displays this in the undo menu
  -- Format: "RF_OperationName" (prefix RF_ makes them identifiable)
  return "RF_" .. tostring(operationName):gsub("%s+", "_")
end

-- ============================================================
-- Public: begin a named waypoint
-- ============================================================
function History.beginWaypoint(operationName)
  local wpName = formatWaypointName(operationName)

  -- Close any previously open waypoint for this operation
  if _openWaypoints[operationName] then
    warn("[RobloxForge History] Waypoint already open for " .. operationName .. " — closing it first")
    ChangeHistoryService:SetWaypoint(wpName .. "_AutoClose")
  end

  _openWaypoints[operationName] = {
    name      = wpName,
    startTime = os.clock(),
    operation = operationName,
  }

  -- Set the "start" waypoint — everything after this is captured
  local ok, err = pcall(function()
    ChangeHistoryService:SetWaypoint(wpName .. "_Begin")
  end)

  if not ok then
    warn("[RobloxForge History] Failed to set begin waypoint: " .. tostring(err))
  end
end

-- ============================================================
-- Public: end a named waypoint
-- ============================================================
function History.endWaypoint(operationName)
  local wpName = formatWaypointName(operationName)
  local entry  = _openWaypoints[operationName]

  if not entry then
    -- No open waypoint — set one anyway as a safety net
    local ok = pcall(function()
      ChangeHistoryService:SetWaypoint(wpName)
    end)
    return
  end

  local duration = os.clock() - entry.startTime
  _openWaypoints[operationName] = nil

  local ok, err = pcall(function()
    ChangeHistoryService:SetWaypoint(wpName)
  end)

  if not ok then
    warn("[RobloxForge History] Failed to set end waypoint: " .. tostring(err))
    return
  end

  -- Log to history
  local logEntry = {
    operation = operationName,
    waypoint  = wpName,
    duration  = math.floor(duration * 1000),  -- ms
    timestamp = os.time(),
  }

  table.insert(_waypointHistory, logEntry)

  -- Trim history
  while #_waypointHistory > MAX_HISTORY do
    table.remove(_waypointHistory, 1)
  end
end

-- ============================================================
-- Public: wrap a function in begin/end waypoints
-- ============================================================
function History.wrap(operationName, fn)
  History.beginWaypoint(operationName)

  local ok, result = pcall(fn)

  History.endWaypoint(operationName)

  if not ok then
    error("[RobloxForge History] Operation '" .. operationName .. "' failed: " .. tostring(result))
  end

  return result
end

-- ============================================================
-- Predefined operation waypoints (all AI operations use these)
-- ============================================================
History.Operations = {
  -- Terrain operations
  GENERATE_TERRAIN     = "GenerateTerrain",
  SMOOTH_TERRAIN       = "SmoothTerrain",
  PAINT_TERRAIN        = "PaintTerrain",

  -- City operations
  GENERATE_CITY        = "GenerateCity",
  GENERATE_ROADS       = "GenerateRoads",
  PLACE_BUILDINGS      = "PlaceBuildings",

  -- Asset operations
  INSERT_ASSET         = "InsertAsset",
  BATCH_INSERT         = "BatchInsert",
  INSERT_FROM_SYNC     = "InsertFromSync",
  DELETE_GENERATED     = "DeleteGenerated",
  INSERT_SCRIPT        = "InsertScript",

  -- Sync operations
  APPLY_SYNC_CHANGES   = "ApplySyncChanges",
}

-- ============================================================
-- Public: undo the last AI operation
-- ============================================================
function History.undoLast()
  local ok, err = pcall(function()
    ChangeHistoryService:Undo()
  end)

  if not ok then
    warn("[RobloxForge History] Undo failed: " .. tostring(err))
    return false
  end

  return true
end

-- ============================================================
-- Public: redo the last undone AI operation
-- ============================================================
function History.redoLast()
  local ok, err = pcall(function()
    ChangeHistoryService:Redo()
  end)

  if not ok then
    warn("[RobloxForge History] Redo failed: " .. tostring(err))
    return false
  end

  return true
end

-- ============================================================
-- Public: get history log
-- ============================================================
function History.getLog()
  return _waypointHistory
end

-- ============================================================
-- Public: get last operation
-- ============================================================
function History.getLastOperation()
  if #_waypointHistory == 0 then return nil end
  return _waypointHistory[#_waypointHistory]
end

-- ============================================================
-- Public: clear all open waypoints (safety cleanup)
-- ============================================================
function History.cleanup()
  for opName, entry in pairs(_openWaypoints) do
    pcall(function()
      ChangeHistoryService:SetWaypoint(entry.name .. "_Cleanup")
    end)
  end
  _openWaypoints = {}
end

return History
