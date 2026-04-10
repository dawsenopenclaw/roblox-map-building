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
  - execute_luau / structured_commands handler (no loadstring — Creator Store safe)
  - Completion sound on successful AI deploy
--]]

local HttpService  = game:GetService("HttpService")
local RunService   = game:GetService("RunService")
local LogService   = game:GetService("LogService")
local Selection    = game:GetService("Selection")
local SoundService = game:GetService("SoundService")
local Debris       = game:GetService("Debris")

local Sync = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL           = "https://forjegames.com"
local PLUGIN_VERSION     = "4.6.0"
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
-- Completion sound — plays when AI commands finish deploying
-- ============================================================
local function playCompletionSound()
  pcall(function()
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
    sound.Volume = 0.3
    sound.Parent = SoundService
    sound:Play()
    Debris:AddItem(sound, 2)
  end)
end

-- ============================================================
-- Structured command value parser
-- Converts typed value tables from JSON into Roblox datatypes
-- ============================================================
local function parseStructuredValue(v)
  if type(v) ~= "table" then return v end

  local vType = v.type
  if vType == "Vector3" then
    return Vector3.new(v.x or 0, v.y or 0, v.z or 0)
  elseif vType == "CFrame" then
    return CFrame.new(v.x or 0, v.y or 0, v.z or 0)
  elseif vType == "Color3" then
    return Color3.fromRGB(v.r or 0, v.g or 0, v.b or 0)
  elseif vType == "BrickColor" then
    return BrickColor.new(v.name or "Medium stone grey")
  elseif vType == "UDim2" then
    return UDim2.new(v.sx or 0, v.ox or 0, v.sy or 0, v.oy or 0)
  elseif vType == "Enum" then
    local enumOk, enumVal = pcall(function()
      return Enum[v.enumType][v.enumValue]
    end)
    if enumOk then return enumVal end
  end

  -- If it has r/g/b keys but no type, treat as Color3
  if v.r and v.g and v.b and not vType then
    return Color3.fromRGB(v.r, v.g, v.b)
  end
  -- If it has x/y/z keys but no type, treat as Vector3
  if v.x and v.y and v.z and not vType then
    return Vector3.new(v.x, v.y, v.z)
  end

  return v
end

-- ============================================================
-- Resolve instance path for structured commands
-- Supports: "Workspace.Model.Part", "game.Workspace.Part", etc.
-- ============================================================
local function resolveStructuredPath(path)
  if not path or path == "" then return nil end

  -- Handle both "." and "/" separators (web side uses "/" sometimes)
  local normalized = path:gsub("/", ".")
  local parts = {}
  for segment in string.gmatch(normalized, "[^%.]+") do
    table.insert(parts, segment)
  end
  if #parts == 0 then return nil end

  local root
  local startIdx = 1
  local first = parts[1]
  if first == "game" then
    root = game
    startIdx = 2
  elseif first == "Workspace" or first == "workspace" then
    root = workspace
    startIdx = 2
  else
    -- Try as service
    local svcOk, svc = pcall(function() return game:GetService(first) end)
    if svcOk and svc then
      root = svc
      startIdx = 2
    else
      root = workspace
    end
  end

  local current = root
  for i = startIdx, #parts do
    local child = current:FindFirstChild(parts[i])
    if not child then return nil end
    current = child
  end
  return current
end

-- ============================================================
-- Structured commands executor
-- Handles the typed command array from luauToStructuredCommands()
-- Command types: create_part, create_model, create_instance,
--   create_script, create_folder, delete_named, delete_instance,
--   set_property, move_instance, clone_instance, insert_asset,
--   execute_script
-- ============================================================
local function executeStructuredCommands(commands)
  if not commands or type(commands) ~= "table" then return end

  -- Track created instances by name for parent resolution within a batch
  local createdByName = {}

  for _, cmd in ipairs(commands) do
    local cmdOk, cmdErr = pcall(function()
      local cmdType = cmd.type

      if cmdType == "create_part" then
        local part = Instance.new("Part")
        part.Name = cmd.name or "FJ_Part"
        part.Anchored = (cmd.anchored ~= false)
        part:SetAttribute("fj_generated", true)

        -- Size
        if cmd.size then
          part.Size = Vector3.new(
            tonumber(cmd.size.x) or 4,
            tonumber(cmd.size.y) or 1.2,
            tonumber(cmd.size.z) or 2
          )
        elseif cmd.sizeX then
          part.Size = Vector3.new(
            tonumber(cmd.sizeX) or 4,
            tonumber(cmd.sizeY) or 4,
            tonumber(cmd.sizeZ) or 4
          )
        end

        -- Position
        if cmd.position then
          part.CFrame = CFrame.new(
            tonumber(cmd.position.x) or 0,
            tonumber(cmd.position.y) or 5,
            tonumber(cmd.position.z) or 0
          )
        elseif cmd.posX then
          part.CFrame = CFrame.new(
            tonumber(cmd.posX) or 0,
            tonumber(cmd.posY) or 5,
            tonumber(cmd.posZ) or 0
          )
        end

        -- Color
        if cmd.color then
          pcall(function()
            part.Color = Color3.fromRGB(
              tonumber(cmd.color.r) or 163,
              tonumber(cmd.color.g) or 162,
              tonumber(cmd.color.b) or 165
            )
          end)
        end

        -- Material
        if cmd.material then
          pcall(function()
            part.Material = Enum.Material[cmd.material] or Enum.Material.SmoothPlastic
          end)
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() part[prop] = parseStructuredValue(value) end)
          end
        end

        -- Parent resolution
        local parent = workspace
        if cmd.parentName then
          local resolved = createdByName[cmd.parentName]
            or resolveStructuredPath(cmd.parentName)
            or workspace:FindFirstChild(cmd.parentName, true)
          if resolved then parent = resolved end
        elseif cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        part.Parent = parent
        createdByName[part.Name] = part

      elseif cmdType == "create_model" then
        local model = Instance.new("Model")
        model.Name = cmd.name or "FJ_Model"
        model:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parentName then
          local resolved = createdByName[cmd.parentName]
            or resolveStructuredPath(cmd.parentName)
            or workspace:FindFirstChild(cmd.parentName, true)
          if resolved then parent = resolved end
        elseif cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        model.Parent = parent
        createdByName[model.Name] = model

      elseif cmdType == "create_instance" then
        local className = cmd.className
        if not className then return end
        local inst = Instance.new(className)
        inst.Name = cmd.name or className
        inst:SetAttribute("fj_generated", true)

        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() inst[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        inst.Parent = parent
        createdByName[inst.Name] = inst

      elseif cmdType == "create_script" then
        local scriptType = cmd.scriptType or "Script"
        local scriptInst = Instance.new(scriptType)
        scriptInst.Name = cmd.name or "FJ_Script"
        if cmd.source then
          scriptInst.Source = cmd.source
        end
        scriptInst:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        scriptInst.Parent = parent

      elseif cmdType == "delete_named" then
        local inst = workspace:FindFirstChild(cmd.name or "", true)
        if inst then inst:Destroy() end

      elseif cmdType == "delete_instance" then
        local inst = resolveStructuredPath(cmd.path or cmd.instancePath or "")
        if not inst then
          inst = workspace:FindFirstChild(cmd.path or cmd.instancePath or "", true)
        end
        if inst then inst:Destroy() end

      elseif cmdType == "set_property" then
        local inst = resolveStructuredPath(cmd.path or cmd.instancePath or "")
        if not inst then
          inst = workspace:FindFirstChild(cmd.path or cmd.instancePath or "", true)
        end
        if inst and cmd.property then
          pcall(function()
            inst[cmd.property] = parseStructuredValue(cmd.value)
          end)
        end

      elseif cmdType == "move_instance" then
        local inst = resolveStructuredPath(cmd.path or "")
        if inst then
          local newParent = resolveStructuredPath(cmd.newParent or "")
          if newParent then
            inst.Parent = newParent
          end
        end

      elseif cmdType == "clone_instance" then
        local source = resolveStructuredPath(cmd.sourcePath or "")
        if source then
          local clone = source:Clone()
          if cmd.newName then
            clone.Name = cmd.newName
          end
          clone:SetAttribute("fj_generated", true)
          local parent = resolveStructuredPath(cmd.parentPath or "") or workspace
          clone.Parent = parent
          createdByName[clone.Name] = clone
        end

      elseif cmdType == "create_folder" then
        local folder = Instance.new("Folder")
        folder.Name = cmd.name or "FJ_Folder"
        folder:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        folder.Parent = parent
        createdByName[folder.Name] = folder

      elseif cmdType == "insert_asset" then
        -- Insert a Roblox marketplace asset by ID within structured commands
        local robloxAssetId = cmd.assetId or cmd.robloxAssetId
        if robloxAssetId then
          local assetOk, assetResult = pcall(function()
            local InsertService = game:GetService("InsertService")
            local model = InsertService:LoadAsset(tonumber(robloxAssetId))
            if model then
              model.Name = cmd.name or ("FJ_Asset_" .. tostring(robloxAssetId))
              model:SetAttribute("fj_generated", true)

              if cmd.position then
                pcall(function()
                  local cf = CFrame.new(
                    tonumber(cmd.position.x) or 0,
                    tonumber(cmd.position.y) or 0,
                    tonumber(cmd.position.z) or 0
                  )
                  if model:IsA("Model") and model.PrimaryPart then
                    model:SetPrimaryPartCFrame(cf)
                  end
                end)
              end

              local parent = workspace
              if cmd.parentName or cmd.parent then
                local pPath = cmd.parentName or cmd.parent
                local resolved = createdByName[pPath]
                  or resolveStructuredPath(pPath)
                  or workspace:FindFirstChild(pPath, true)
                if resolved then parent = resolved end
              end

              -- LoadAsset wraps in a Model; move children out if single child
              local children = model:GetChildren()
              if #children == 1 then
                children[1].Parent = parent
                createdByName[children[1].Name] = children[1]
                model:Destroy()
              else
                model.Parent = parent
                createdByName[model.Name] = model
              end
            end
          end)
          if not assetOk then
            warn("[ForjeGames] insert_asset command failed: " .. tostring(assetResult))
          end
        end

      elseif cmdType == "execute_script" then
        -- Sandboxed script execution: creates a Script with the given source
        -- and runs it in a controlled way. For Creator Store safety, this does
        -- NOT use loadstring(). Instead it creates a temporary Script instance
        -- that Roblox's engine executes natively.
        local scriptSource = cmd.source or cmd.code or ""
        if scriptSource ~= "" then
          local tempScript = Instance.new("Script")
          tempScript.Name = cmd.name or "FJ_TempExec_" .. tostring(tick())
          tempScript:SetAttribute("fj_generated", true)
          tempScript:SetAttribute("fj_temp_exec", true)

          -- Wrap in pcall for safety + auto-cleanup after execution
          local wrappedSource = string.format([[
-- ForjeGames auto-generated execution wrapper
local ok, err = pcall(function()
%s
end)
if not ok then
  warn("[ForjeGames TempExec] Error: " .. tostring(err))
end
-- Self-cleanup after execution
task.defer(function()
  script:Destroy()
end)
]], scriptSource)

          tempScript.Source = wrappedSource
          tempScript.Parent = cmd.runContext == "server" and game:GetService("ServerScriptService")
            or workspace
        end
      end
    end)

    if not cmdOk then
      warn("[ForjeGames] Structured command error (" .. tostring(cmd.type) .. "): " .. tostring(cmdErr))
    end
  end
end

-- ============================================================
-- execute_luau handler (Creator Store safe — no loadstring)
-- Receives code from the server and converts to structured commands.
-- The web side already translates Luau to structured_commands for
-- store-edition plugins. For direct execute_luau with raw code,
-- we parse it into simple structured commands here.
-- ============================================================
local function handleExecuteLuau(data)
  if not data then return end

  -- Prefer structured commands if provided alongside code
  if data.commands and type(data.commands) == "table" then
    executeStructuredCommands(data.commands)
    playCompletionSound()
    return
  end

  -- If the server sent a structured field (legacy format), use it
  if data.structured then
    local action = data.structured.action
    if action == "create_part" then
      executeStructuredCommands({{ type = "create_part", name = data.structured.name, size = { x = data.structured.sizeX, y = data.structured.sizeY, z = data.structured.sizeZ }, position = { x = data.structured.posX, y = data.structured.posY, z = data.structured.posZ } }})
    elseif action == "delete_named" then
      executeStructuredCommands({{ type = "delete_named", name = data.structured.name }})
    elseif action == "set_property" then
      executeStructuredCommands({{ type = "set_property", instancePath = data.structured.instancePath, property = data.structured.property, value = data.structured.value }})
    end
    playCompletionSound()
    return
  end

  -- If raw code is sent, attempt to parse simple Instance.new() patterns
  -- into structured commands (best-effort, no loadstring)
  if data.code and type(data.code) == "string" then
    local code = data.code
    local commands = {}
    local hasComplexCode = false

    -- Check for constructs we cannot handle
    if code:find("for ") or code:find("while ") or code:find("repeat ")
      or code:find("function ") or code:find("coroutine%.") or code:find("task%.spawn")
      or code:find("require%(") or code:find("pcall%(") then
      hasComplexCode = true
    end

    -- Parse Instance.new("ClassName") patterns
    local varMap = {} -- varName -> { className, props }
    for varName, className in code:gmatch('local%s+(%w+)%s*=%s*Instance%.new%(%s*["\'](%w+)["\']%s*%)') do
      varMap[varName] = { className = className, props = {} }
    end

    -- Parse property assignments: varName.Property = value
    for varName, prop, value in code:gmatch('(%w+)%.(%w+)%s*=%s*(.-)%s*\n') do
      if varMap[varName] then
        varMap[varName].props[prop] = value
      end
    end

    -- Convert parsed instances to structured commands
    for varName, info in pairs(varMap) do
      local className = info.className
      local props = info.props

      if className == "Part" or className == "WedgePart" or className == "TrussPart" then
        local cmd = { type = "create_part", name = props.Name and props.Name:gsub('["\']', '') or varName }

        -- Parse position from Vector3.new(x, y, z) or CFrame.new(x, y, z)
        local posStr = props.Position or props.CFrame
        if posStr then
          local x, y, z = posStr:match("%.new%(%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)")
          if x then cmd.position = { x = tonumber(x), y = tonumber(y), z = tonumber(z) } end
        end

        -- Parse size
        local sizeStr = props.Size
        if sizeStr then
          local x, y, z = sizeStr:match("%.new%(%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)")
          if x then cmd.size = { x = tonumber(x), y = tonumber(y), z = tonumber(z) } end
        end

        -- Parse color
        local colorStr = props.Color or props.BrickColor
        if colorStr then
          local r, g, b = colorStr:match("fromRGB%(%s*(%d+)%s*,%s*(%d+)%s*,%s*(%d+)")
          if r then cmd.color = { r = tonumber(r), g = tonumber(g), b = tonumber(b) } end
        end

        -- Material
        local matStr = props.Material
        if matStr then
          local mat = matStr:match("Enum%.Material%.(%w+)")
          if mat then cmd.material = mat end
        end

        -- Anchored
        if props.Anchored then
          cmd.anchored = props.Anchored:find("true") ~= nil
        end

        -- Parent
        if props.Parent then
          local parentName = props.Parent:gsub('%s+', '')
          if parentName ~= "workspace" and parentName ~= "game.Workspace" then
            cmd.parentName = parentName
          end
        end

        table.insert(commands, cmd)

      elseif className == "Model" then
        local cmd = { type = "create_model", name = props.Name and props.Name:gsub('["\']', '') or varName }
        if props.Parent then
          local parentName = props.Parent:gsub('%s+', '')
          if parentName ~= "workspace" and parentName ~= "game.Workspace" then
            cmd.parentName = parentName
          end
        end
        table.insert(commands, cmd)
      else
        -- Generic instance creation
        local cmd = { type = "create_instance", className = className, name = props.Name and props.Name:gsub('["\']', '') or varName }
        table.insert(commands, cmd)
      end
    end

    if #commands > 0 then
      executeStructuredCommands(commands)
      playCompletionSound()
    elseif hasComplexCode then
      -- FALLBACK: loadstring behind a dev-only setting toggle.
      -- This is OFF by default and must be explicitly enabled in
      -- plugin settings. The Creator Store edition ships with this
      -- disabled — only direct-download / sideloaded builds should
      -- enable it.
      local allowLoadstring = false
      pcall(function()
        allowLoadstring = plugin and plugin:GetSetting("ForjeGames_AllowLoadstring") == true
      end)

      if allowLoadstring then
        warn("[ForjeGames] DEV MODE: Executing code via loadstring (not Creator Store safe)")
        local loadOk, loadErr = pcall(function()
          local fn, compileErr = loadstring(code)
          if fn then
            fn()
          else
            warn("[ForjeGames] loadstring compile error: " .. tostring(compileErr))
          end
        end)
        if loadOk then
          playCompletionSound()
        else
          warn("[ForjeGames] loadstring runtime error: " .. tostring(loadErr))
          notifyMessage("Script execution failed: " .. tostring(loadErr), "error")
        end
      else
        warn("[ForjeGames] Cannot execute complex Luau code in Creator Store mode. "
          .. "This plugin edition uses structured commands only. "
          .. "Use the direct-download plugin for advanced scripts, "
          .. "or enable ForjeGames_AllowLoadstring in plugin settings (dev only).")
        notifyMessage("Complex code requires the direct-download plugin (or enable dev loadstring in settings)", "warn")
      end
    else
      warn("[ForjeGames] No executable commands found in code payload")
    end
    return
  end

  warn("[ForjeGames] execute_luau received with no code or commands")
end

-- ============================================================
-- Handle structured_commands change type
-- Receives pre-translated commands from the web side
-- ============================================================
local function handleStructuredCommands(data)
  if not data or not data.commands then
    warn("[ForjeGames Sync] structured_commands: missing commands array")
    return
  end
  executeStructuredCommands(data.commands)
  playCompletionSound()
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
-- Studio Bridge command handlers
-- ============================================================

-- Resolve a dotted instance path like "Workspace.MyModel.Part1"
local function resolveInstancePath(path)
  if not path or path == "" then return nil end
  local parts = {}
  for segment in string.gmatch(path, "[^%.]+") do
    table.insert(parts, segment)
  end
  if #parts == 0 then return nil end

  -- Start from game or a known root
  local root
  local startIdx = 1
  local firstPart = parts[1]
  if firstPart == "game" then
    root = game
    startIdx = 2
  elseif firstPart == "Workspace" or firstPart == "workspace" then
    root = workspace
    startIdx = 2
  else
    -- Try as a service name first
    local svcOk, svc = pcall(function() return game:GetService(firstPart) end)
    if svcOk and svc then
      root = svc
      startIdx = 2
    else
      root = game
    end
  end

  local current = root
  for i = startIdx, #parts do
    local child = current:FindFirstChild(parts[i])
    if not child then return nil end
    current = child
  end
  return current
end

-- Build the full dotted path for an Instance
local function getInstancePath(instance)
  local pathParts = {}
  local current = instance
  while current and current ~= game do
    table.insert(pathParts, 1, current.Name)
    current = current.Parent
  end
  return table.concat(pathParts, ".")
end

-- Recursively serialize a hierarchy tree
local function serializeHierarchy(instance, depth, maxDepth)
  if depth > maxDepth then return nil end
  local node = {
    name = instance.Name,
    className = instance.ClassName,
    children = {},
  }
  for _, child in ipairs(instance:GetChildren()) do
    local childNode = serializeHierarchy(child, depth + 1, maxDepth)
    if childNode then
      table.insert(node.children, childNode)
    end
  end
  return node
end

-- Read serializable properties of an instance
local function serializeProperties(instance)
  local props = {
    Name = instance.Name,
    ClassName = instance.ClassName,
  }
  -- Common properties that are safe to read
  local commonProps = {
    "Anchored", "CanCollide", "Transparency", "Reflectance",
    "Material", "BrickColor", "Color", "Size", "CFrame",
    "Position", "Orientation", "Visible", "Enabled",
    "Value", "Text", "MaxHealth", "Health", "WalkSpeed",
    "JumpPower", "Parent",
  }
  for _, propName in ipairs(commonProps) do
    pcall(function()
      local val = instance[propName]
      if val ~= nil then
        if typeof(val) == "Vector3" then
          props[propName] = { x = val.X, y = val.Y, z = val.Z }
        elseif typeof(val) == "CFrame" then
          props[propName] = { position = { x = val.Position.X, y = val.Position.Y, z = val.Position.Z } }
        elseif typeof(val) == "Color3" then
          props[propName] = { r = val.R, g = val.G, b = val.B }
        elseif typeof(val) == "BrickColor" then
          props[propName] = tostring(val)
        elseif typeof(val) == "EnumItem" then
          props[propName] = tostring(val)
        elseif typeof(val) == "Instance" then
          props[propName] = val:GetFullName()
        elseif type(val) == "string" or type(val) == "number" or type(val) == "boolean" then
          props[propName] = val
        end
      end
    end)
  end
  return props
end

-- Decode a typed value from the MCP bridge
local function decodeTypedValue(value, valueType)
  if valueType == "number" then
    return tonumber(value) or 0
  elseif valueType == "boolean" then
    if type(value) == "boolean" then return value end
    return value == "true" or value == true
  elseif valueType == "Color3" then
    -- Expect "R,G,B" with 0-1 floats
    local parts = {}
    for v in string.gmatch(tostring(value), "[^,]+") do
      table.insert(parts, tonumber(v) or 0)
    end
    return Color3.new(parts[1] or 0, parts[2] or 0, parts[3] or 0)
  elseif valueType == "Vector3" then
    local parts = {}
    for v in string.gmatch(tostring(value), "[^,]+") do
      table.insert(parts, tonumber(v) or 0)
    end
    return Vector3.new(parts[1] or 0, parts[2] or 0, parts[3] or 0)
  elseif valueType == "BrickColor" then
    return BrickColor.new(tostring(value))
  elseif valueType == "Enum" then
    -- Expect "Enum.Material.Grass" format
    local enumVal = nil
    pcall(function()
      -- Walk the Enum path
      local parts = {}
      for v in string.gmatch(tostring(value), "[^%.]+") do
        table.insert(parts, v)
      end
      if #parts >= 3 and parts[1] == "Enum" then
        enumVal = Enum[parts[2]][parts[3]]
      end
    end)
    return enumVal or value
  else
    return value
  end
end

-- Collect all scripts under a root
local function collectScripts(root, maxResults)
  local scripts = {}
  local function recurse(inst)
    if #scripts >= maxResults then return end
    if inst:IsA("LuaSourceContainer") then
      local src = ""
      pcall(function() src = inst.Source end)
      table.insert(scripts, {
        path = getInstancePath(inst),
        className = inst.ClassName,
        source = src,
      })
    end
    for _, child in ipairs(inst:GetChildren()) do
      recurse(child)
    end
  end
  recurse(root)
  return scripts
end

-- Push a bridge result back to the server
local function pushBridgeResult(resultType, requestId, resultData)
  Sync.queueChange("bridge_result", {
    resultType = resultType,
    _requestId = requestId,
    data = resultData,
  })
end

-- Handle: get_hierarchy
local function handleGetHierarchy(data)
  local rootName = data.root or "Workspace"
  local maxDepth = data.maxDepth or 10
  local requestId = data._requestId

  local root
  if rootName == "Workspace" or rootName == "workspace" then
    root = workspace
  elseif rootName == "game" then
    root = game
  else
    local svcOk, svc = pcall(function() return game:GetService(rootName) end)
    root = svcOk and svc or workspace
  end

  local tree = serializeHierarchy(root, 1, maxDepth)
  if requestId then
    pushBridgeResult("hierarchy_result", requestId, tree)
  end
end

-- Handle: get_properties
local function handleGetProperties(data)
  local inst = resolveInstancePath(data.instancePath)
  local requestId = data._requestId
  if not inst then
    if requestId then
      pushBridgeResult("properties_result", requestId, { error = "Instance not found: " .. tostring(data.instancePath) })
    end
    return
  end
  local props = serializeProperties(inst)
  if requestId then
    pushBridgeResult("properties_result", requestId, props)
  end
end

-- Handle: set_property (bridge version with typed values)
local function handleSetProperty(data)
  local inst = resolveInstancePath(data.instancePath)
  if not inst then
    warn("[ForjeGames Sync] set_property: instance not found: " .. tostring(data.instancePath))
    return
  end
  if not data.property then return end
  local decoded = decodeTypedValue(data.value, data.valueType or "string")
  pcall(function()
    inst[data.property] = decoded
  end)
end

-- Handle: create_instance
local function handleCreateInstance(data)
  local className = data.className
  if not className then return end
  local parentPath = data.parentPath or "Workspace"
  local parent = resolveInstancePath(parentPath) or workspace

  local instOk, inst = pcall(function()
    return Instance.new(className)
  end)
  if not instOk or not inst then
    warn("[ForjeGames Sync] create_instance: failed to create " .. tostring(className))
    return
  end

  inst.Name = data.name or className
  inst:SetAttribute("fj_generated", true)

  -- Apply initial properties
  if data.properties and type(data.properties) == "table" then
    for propName, propValue in pairs(data.properties) do
      pcall(function()
        inst[propName] = propValue
      end)
    end
  end

  inst.Parent = parent
end

-- Handle: delete_instance
local function handleDeleteInstance(data)
  local inst = resolveInstancePath(data.instancePath)
  if not inst then
    -- Fallback: recursive search
    inst = game:FindFirstChild(data.instancePath, true)
  end
  if inst then
    inst:Destroy()
  end
end

-- Handle: get_scripts
local function handleGetScripts(data)
  local rootName = data.root or "game"
  local maxResults = data.maxResults or 50
  local requestId = data._requestId

  local root
  if rootName == "game" then
    root = game
  elseif rootName == "Workspace" or rootName == "workspace" then
    root = workspace
  else
    local svcOk, svc = pcall(function() return game:GetService(rootName) end)
    root = svcOk and svc or game
  end

  local scripts = collectScripts(root, maxResults)
  if requestId then
    pushBridgeResult("scripts_result", requestId, scripts)
  end
end

-- Handle: start_playtest
local function handleStartPlaytest(data)
  -- Use PluginGuiService or direct plugin API to start playtest
  -- Note: plugin global is injected by the Roblox plugin environment
  pcall(function()
    local PluginManager = game:GetService("PluginGuiService")
    -- Fallback method: use ChangeHistoryService waypoint + RunService
  end)

  -- The most reliable way to trigger a playtest from a plugin:
  pcall(function()
    -- plugin:GetStudioTool is not available, but we can use the command bar approach
    -- via game:GetService("StudioService")
    local mode = data.mode or "server"
    if mode == "server" or mode == "start" then
      -- Trigger Play via the toolbar Run action
      -- This is the standard plugin API for starting playtests
      local testService = game:GetService("TestService")
      if testService then
        testService:Run()
      end
    end
  end)

  -- Alternative: use StudioService to trigger playtest
  pcall(function()
    local mode = data.mode or "server"
    if mode == "server" then
      -- The safest cross-version approach
      local studioService = game:FindService("StudioService")
      if studioService and studioService.PromptPlaySolo then
        studioService:PromptPlaySolo()
      end
    end
  end)
end

-- Handle: stop_playtest
local function handleStopPlaytest(_data)
  pcall(function()
    local testService = game:GetService("TestService")
    if testService then
      -- No direct Stop method on TestService in all versions
    end
  end)

  -- Use RunService to detect and stop
  pcall(function()
    if RunService:IsRunning() then
      -- Trigger stop via the standard plugin mechanism
      local studioService = game:FindService("StudioService")
      if studioService and studioService.PromptStopPlaySolo then
        studioService:PromptStopPlaySolo()
      end
    end
  end)
end

-- Handle: capture_screenshot
local function handleCaptureScreenshot(data)
  local requestId = data._requestId
  -- Attempt to capture viewport via ScreenshotHud or ViewportFrame
  -- Note: Full viewport capture requires ScreenshotHud which is limited in plugin context
  -- Push the screenshot through the existing screenshot pipeline
  pcall(function()
    local screenshotHud = game:GetService("ScreenshotHud")
    if screenshotHud then
      screenshotHud.Visible = true
      task.delay(0.5, function()
        screenshotHud.Visible = false
      end)
    end
  end)

  -- Push a status result; actual screenshot capture goes through Sync.pushScreenshot
  if requestId then
    pushBridgeResult("screenshot_result", requestId, {
      status = "capture_triggered",
      note = "Screenshot capture initiated. Use the session screenshot endpoint to retrieve.",
    })
  end
end

-- Handle: simulate_input
local function handleSimulateInput(data)
  pcall(function()
    local VIM = game:GetService("VirtualInputManager")
    if not VIM then
      warn("[ForjeGames Sync] VirtualInputManager not available")
      return
    end

    local inputType = data.inputType or "keyboard"
    local action = data.action or "tap"
    local duration = data.duration or 0.1

    if inputType == "keyboard" then
      local keyName = data.key or "W"
      local keyCode = Enum.KeyCode[keyName]
      if not keyCode then
        warn("[ForjeGames Sync] Invalid KeyCode: " .. tostring(keyName))
        return
      end

      if action == "press" then
        VIM:SendKeyEvent(true, keyCode, false, game)
      elseif action == "release" then
        VIM:SendKeyEvent(false, keyCode, false, game)
      else -- tap
        VIM:SendKeyEvent(true, keyCode, false, game)
        task.delay(duration, function()
          VIM:SendKeyEvent(false, keyCode, false, game)
        end)
      end

    elseif inputType == "mouse_click" then
      local x = data.x or 0
      local y = data.y or 0
      VIM:SendMouseButtonEvent(x, y, 0, true, game, 1)
      task.delay(duration, function()
        VIM:SendMouseButtonEvent(x, y, 0, false, game, 1)
      end)

    elseif inputType == "mouse_move" then
      local x = data.x or 0
      local y = data.y or 0
      VIM:SendMouseMoveEvent(x, y, game)
    end
  end)
end

-- Handle: get_output (read LogService history)
local function handleGetOutput(data)
  local maxEntries = data.maxEntries or 100
  local filter = data.filter or "all"
  local requestId = data._requestId

  local entries = {}
  pcall(function()
    local logs = LogService:GetLogHistory()
    local startIdx = math.max(1, #logs - maxEntries + 1)
    for i = startIdx, #logs do
      local entry = logs[i]
      if entry then
        local messageType = "info"
        if entry.messageType == Enum.MessageType.MessageError then
          messageType = "error"
        elseif entry.messageType == Enum.MessageType.MessageWarning then
          messageType = "warning"
        elseif entry.messageType == Enum.MessageType.MessageInfo then
          messageType = "info"
        elseif entry.messageType == Enum.MessageType.MessageOutput then
          messageType = "output"
        end

        local include = (filter == "all")
          or (filter == "errors" and messageType == "error")
          or (filter == "warnings" and (messageType == "warning" or messageType == "error"))
          or (filter == "info" and messageType ~= "error")

        if include then
          table.insert(entries, {
            message = entry.message,
            messageType = messageType,
            timestamp = entry.timestamp,
          })
        end
      end
    end
  end)

  if requestId then
    pushBridgeResult("output_result", requestId, entries)
  end
end

-- Handle: get_selection
local function handleGetSelection(data)
  local requestId = data._requestId
  local selected = {}
  pcall(function()
    local sel = Selection:Get()
    for _, inst in ipairs(sel) do
      table.insert(selected, {
        name = inst.Name,
        className = inst.ClassName,
        path = getInstancePath(inst),
      })
    end
  end)

  if requestId then
    pushBridgeResult("selection_result", requestId, selected)
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

      elseif changeType == "structured_commands" and data then
        handleStructuredCommands(data)

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

      -- Studio Bridge commands
      elseif changeType == "get_hierarchy" and data then
        handleGetHierarchy(data)

      elseif changeType == "get_properties" and data then
        handleGetProperties(data)

      elseif changeType == "set_property" and data then
        handleSetProperty(data)

      elseif changeType == "create_instance" and data then
        handleCreateInstance(data)

      elseif changeType == "delete_instance" and data then
        handleDeleteInstance(data)

      elseif changeType == "get_scripts" and data then
        handleGetScripts(data)

      elseif changeType == "start_playtest" and data then
        handleStartPlaytest(data)

      elseif changeType == "stop_playtest" then
        handleStopPlaytest(data or {})

      elseif changeType == "capture_screenshot" then
        handleCaptureScreenshot(data or {})

      elseif changeType == "simulate_input" and data then
        handleSimulateInput(data)

      elseif changeType == "get_output" and data then
        handleGetOutput(data)

      elseif changeType == "get_selection" then
        handleGetSelection(data or {})
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

  -- Token goes in the Authorization header (not the URL) so it is not logged
  -- by proxies, CDNs, or Roblox's own request logger.
  -- sessionId is also sent as a header so the server can resolve the session
  -- without needing a valid JWT on every Lambda cold-start.
  local path = "/api/studio/sync?lastSync=" .. tostring(math.floor(_lastSync))
  if _sessionId then
    path = path .. "&sessionId=" .. _sessionId
  end
  -- pluginVer lets the server check for updates without relying on a separate header
  path = path .. "&pluginVer=" .. PLUGIN_VERSION

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
      -- serverTime is Unix milliseconds. tick() returns Unix seconds as a float.
      -- If serverTime is missing, multiply tick() by 1000 to stay in ms.
      -- Never fall back to os.time() — it is not available in all Roblox contexts.
      _lastSync = data.serverTime or math.floor(tick() * 1000)

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
    -- Rate limited — parse retryAfterMs from body if present, otherwise triple backoff.
    -- Keep status as connected=true so the UI doesn't flash a disconnect banner for
    -- a transient rate-limit; the plugin will resume normally on the next poll.
    local rlOk, rlData = pcall(function() return HttpService:JSONDecode(result.Body) end)
    if rlOk and rlData and rlData.retryAfterMs then
      _backoffInterval = math.min(math.ceil(rlData.retryAfterMs / 1000) + 1, MAX_INTERVAL)
    else
      _backoffInterval = math.min(_backoffInterval * 3, MAX_INTERVAL)
    end
    -- Still report connected=true — we have a live session, just throttled
    notifyStatus(true, _lastSync)

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
  local result, netErr = httpPost("/api/studio/screenshot", payload)
  if netErr then return false end
  return result ~= nil and result.StatusCode == 200
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
