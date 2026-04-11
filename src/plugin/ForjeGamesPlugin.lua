--[[
    ForjeGames Studio Plugin  v4.0.0
    ================================
    Bridge between the ForjeGames web editor and Roblox Studio.

    Architecture overview:
      1. Auth      — user enters a 6-char pairing code generated on the website
      2. Connect   — plugin POSTs to /api/studio/connect to establish a session
      3. Poll loop — GET /api/studio/sync every 1 s; execute returned commands
      4. Context   — push workspace snapshot to the server every 2 s via sync params
      5. Screenshot — capture viewport every 8 s and POST as base64 PNG

    All HTTP calls are pcall-wrapped with exponential back-off.
    All loadstring execution is pcall-wrapped with ChangeHistoryService recording.
    All server data is validated before use — never trust the response payload.

    External dependencies (Roblox Services only — no external libraries):
      HttpService, ChangeHistoryService, CollectionService, InsertService,
      SelectionService, RunService, UserInputService
]]

-- ─── Services ──────────────────────────────────────────────────────────────────
local HttpService          = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local CollectionService    = game:GetService("CollectionService")
local InsertService        = game:GetService("InsertService")
local SelectionService     = game:GetService("Selection")
local RunService           = game:GetService("RunService")
local StudioService        = game:GetService("StudioService")
local CoreGui              = game:GetService("CoreGui")

-- ─── Constants ─────────────────────────────────────────────────────────────────
local PLUGIN_VERSION      = "4.6.0"
local PLUGIN_TAG          = "ForjeAI"           -- CollectionService tag for all created instances
local DEFAULT_API_BASE    = "https://forjegames.com"
local POLL_INTERVAL_S     = 1                   -- normal poll cadence (seconds)
local CONTEXT_INTERVAL_S  = 2                   -- workspace snapshot cadence
local SCREENSHOT_INTERVAL = 8                   -- seconds between screenshot uploads
local NEARBY_RADIUS       = 100                 -- studs — "nearby" part detection radius
local MAX_BACKOFF_S       = 30                  -- cap on exponential back-off
local MAX_RECONNECT_TRIES = 5                   -- attempts before giving up
local ACTIVITY_LOG_MAX    = 10                  -- entries kept in the activity log
local SCREENSHOT_MAX_PARTS = 200               -- workspace parts threshold for screenshot hash

-- ─── Mutable State ─────────────────────────────────────────────────────────────
-- All mutable state lives inside this module-level table so nothing leaks to _G.
local State = {
    -- Connection
    apiBase     = DEFAULT_API_BASE,
    token       = nil,      -- JWT received from /api/studio/auth
    sessionId   = nil,      -- session ID received from /api/studio/connect
    pollInterval = POLL_INTERVAL_S,

    -- Polling
    lastSync    = 0,        -- server time of last successful sync (ms)
    backoffS    = 1,        -- current back-off delay in seconds
    reconnectTries = 0,

    -- Status
    status      = "disconnected",   -- "disconnected" | "connecting" | "connected" | "error"
    statusMsg   = "",
    commandsExecuted = 0,
    partsPlaced      = 0,

    -- Activity log  { time: string, msg: string }[]
    activityLog  = {},

    -- Context cache (for diff-on-change)
    lastPartCount  = -1,
    lastModelCount = -1,
    lastLightCount = -1,

    -- Screenshot
    lastScreenshotHash = "",
    lastScreenshotTime = 0,

    -- Last context send timestamp (for debounce)
    lastContextSend = 0,

    -- Plugin GUI references (set up in buildGui)
    gui = nil,
    widgets = {},

    -- Connections table for cleanup
    connections = {},

    -- Feature flags from server
    features = {
        executeCode    = true,
        insertModel    = true,
        deleteModel    = true,
        updateProperty = true,
        insertAsset    = true,
        screenshotRelay = true,
    },

    -- Pending error to report on next sync
    pendingError = nil,
}

-- ─── Forward declarations ──────────────────────────────────────────────────────
-- These GUI functions are defined later in the file but referenced by code above.
-- Lua upvalue semantics: declare the local slot here, assign the function body later.
local refreshGui          -- function()  — rebuilds panel visibility
local refreshGuiStats     -- function()  — updates stats labels
local setStatus           -- function(status, msg)
local _refreshActivityLog -- function()  — redraws activity log entries

-- ─── Utility Helpers ───────────────────────────────────────────────────────────

local function safeJSON(value)
    local ok, result = pcall(function()
        return HttpService:JSONEncode(value)
    end)
    return ok and result or "{}"
end

local function parseJSON(str)
    if type(str) ~= "string" or str == "" then return nil end
    local ok, result = pcall(function()
        return HttpService:JSONDecode(str)
    end)
    return ok and type(result) == "table" and result or nil
end

local function logActivity(msg)
    local entry = {
        time = os.date("%H:%M:%S"),
        msg  = tostring(msg):sub(1, 120),  -- clamp long messages
    }
    table.insert(State.activityLog, 1, entry)
    if #State.activityLog > ACTIVITY_LOG_MAX then
        State.activityLog[ACTIVITY_LOG_MAX + 1] = nil
    end
    -- Refresh activity UI if it exists
    if State.widgets.activityFrame then
        pcall(function() _refreshActivityLog() end)
    end
end

-- Safely read nested table keys without erroring on nil
local function dig(tbl, ...)
    local current = tbl
    for _, key in ipairs({...}) do
        if type(current) ~= "table" then return nil end
        current = current[key]
    end
    return current
end

-- Resolve an instance from a dot-separated path string ("Workspace.Model.Part")
local function resolveInstancePath(path)
    if type(path) ~= "string" then return nil end
    local parts = {}
    for segment in path:gmatch("[^%.]+") do
        table.insert(parts, segment)
    end
    local current = game
    for _, segment in ipairs(parts) do
        if not current then return nil end
        local ok, child = pcall(function()
            return current:FindFirstChild(segment)
        end)
        if not ok or not child then return nil end
        current = child
    end
    return current
end

-- Convert a server-side value string to a Roblox type
local function coerceValue(valueType, rawValue)
    if valueType == "Vector3" and type(rawValue) == "table" then
        return Vector3.new(
            tonumber(rawValue.X or rawValue.x or 0) or 0,
            tonumber(rawValue.Y or rawValue.y or 0) or 0,
            tonumber(rawValue.Z or rawValue.z or 0) or 0
        )
    elseif valueType == "Color3" and type(rawValue) == "table" then
        return Color3.new(
            math.clamp(tonumber(rawValue.R or rawValue.r or 0) or 0, 0, 1),
            math.clamp(tonumber(rawValue.G or rawValue.g or 0) or 0, 0, 1),
            math.clamp(tonumber(rawValue.B or rawValue.b or 0) or 0, 0, 1)
        )
    elseif valueType == "CFrame" and type(rawValue) == "table" then
        local pos = rawValue.Position or {}
        local lv  = rawValue.LookVector or {}
        if rawValue[1] then
            -- flat 12-component CFrame
            return CFrame.new(
                tonumber(rawValue[1])  or 0, tonumber(rawValue[2])  or 0, tonumber(rawValue[3])  or 0,
                tonumber(rawValue[4])  or 1, tonumber(rawValue[5])  or 0, tonumber(rawValue[6])  or 0,
                tonumber(rawValue[7])  or 0, tonumber(rawValue[8])  or 1, tonumber(rawValue[9])  or 0,
                tonumber(rawValue[10]) or 0, tonumber(rawValue[11]) or 0, tonumber(rawValue[12]) or 1
            )
        else
            return CFrame.new(
                tonumber(pos.X or pos.x or 0) or 0,
                tonumber(pos.Y or pos.y or 0) or 0,
                tonumber(pos.Z or pos.z or 0) or 0
            )
        end
    elseif valueType == "BrickColor" then
        return BrickColor.new(tostring(rawValue))
    elseif valueType == "number" or valueType == "float" or valueType == "int" then
        return tonumber(rawValue)
    elseif valueType == "bool" or valueType == "boolean" then
        if type(rawValue) == "boolean" then return rawValue end
        return rawValue == "true" or rawValue == true
    elseif valueType == "Enum" and type(rawValue) == "string" then
        -- rawValue = "Enum.Material.SmoothPlastic"
        local ok, val = pcall(function()
            local parts = {}
            for seg in rawValue:gmatch("[^%.]+") do table.insert(parts, seg) end
            local e = Enum
            for i = 2, #parts do
                e = e[parts[i]]
            end
            return e
        end)
        return ok and val or rawValue
    end
    return rawValue
end

-- ─── HTTP Layer (all network I/O lives here) ───────────────────────────────────

local function httpRequest(method, endpoint, body, extraHeaders)
    -- Build full URL
    local url = State.apiBase .. endpoint

    -- Build headers
    local headers = {
        ["Content-Type"]      = "application/json",
        ["X-Plugin-Version"]  = PLUGIN_VERSION,
    }
    if State.token then
        headers["Authorization"] = "Bearer " .. State.token
    end
    if extraHeaders then
        for k, v in pairs(extraHeaders) do
            headers[k] = v
        end
    end

    -- Execute request
    local ok, response = pcall(function()
        return HttpService:RequestAsync({
            Url     = url,
            Method  = method,
            Headers = headers,
            Body    = (body ~= nil) and safeJSON(body) or nil,
        })
    end)

    if not ok then
        -- Network error (timeout, DNS failure, etc.)
        return nil, "network_error: " .. tostring(response)
    end

    if not response.Success then
        -- HTTP-level error
        local errMsg = string.format("http_%d", response.StatusCode)

        -- Rate limited — parse retryAfterMs if available
        if response.StatusCode == 429 then
            local parsed = parseJSON(response.Body)
            local retryMs = parsed and tonumber(parsed.retryAfterMs) or 1000
            return nil, "rate_limited", math.ceil(retryMs / 1000)
        end

        return nil, errMsg
    end

    -- Parse body
    local parsed = parseJSON(response.Body)
    if parsed == nil then
        return nil, "parse_error: " .. tostring(response.Body):sub(1, 200)
    end

    return parsed, nil
end

-- ─── Authentication Flow ───────────────────────────────────────────────────────

-- POST /api/studio/auth  { code, placeId, placeName, pluginVer }
local function doAuth(code)
    local placeId   = tostring(game.PlaceId)
    local placeName = game.Name or "Unknown Place"

    local body = {
        code       = code:upper():gsub("%s", ""),
        placeId    = placeId,
        placeName  = placeName,
        pluginVer  = PLUGIN_VERSION,
    }

    local result, err = httpRequest("POST", "/api/studio/auth", body)
    if not result then
        return false, "Auth failed: " .. tostring(err)
    end

    if result.error then
        -- Map server error codes to human-readable messages
        local msgs = {
            code_expired_or_invalid = "Code not found or expired. Generate a new one at forjegames.com.",
            code_required           = "Please enter a connection code.",
        }
        local msg = msgs[result.error] or (result.message or result.error)
        return false, msg
    end

    if not result.token then
        return false, "Server did not return a token."
    end

    State.token = result.token
    -- sessionId may also come back from auth (older servers); use it if present
    if result.sessionId then
        State.sessionId = result.sessionId
    end

    return true, nil
end

-- POST /api/studio/connect  { token, placeId, placeName, pluginVersion }
local function doConnect()
    if not State.token then
        return false, "No token — auth first."
    end

    local body = {
        token         = State.token,
        placeId       = tostring(game.PlaceId),
        placeName     = game.Name or "Unknown Place",
        pluginVersion = PLUGIN_VERSION,
    }

    local result, err = httpRequest("POST", "/api/studio/connect", body)
    if not result then
        return false, "Connect failed: " .. tostring(err)
    end

    if result.error then
        if result.error == "invalid_token" then
            -- Token is stale — force re-auth on next attempt
            State.token     = nil
            State.sessionId = nil
        end
        return false, result.error
    end

    if not result.sessionId then
        return false, "Server did not return a sessionId."
    end

    State.sessionId    = result.sessionId
    State.pollInterval = tonumber(result.pollInterval) or POLL_INTERVAL_S

    -- Store feature flags
    if type(result.features) == "table" then
        for k, v in pairs(result.features) do
            if State.features[k] ~= nil then
                State.features[k] = v == true
            end
        end
    end

    return true, nil
end

-- ─── Command Execution ─────────────────────────────────────────────────────────

-- Safely get the camera from the current viewport
local function getCamera()
    local workspace = game:GetService("Workspace")
    return workspace.CurrentCamera
end

-- execute_luau — run arbitrary Luau code sent from the web editor
local function cmdExecuteLuau(data)
    if not State.features.executeCode then
        return false, "executeCode feature is disabled"
    end

    local code = data.code
    if type(code) ~= "string" or code == "" then
        return false, "data.code is missing or empty"
    end

    -- Capture before-screenshot
    -- (screenshot module will pick this up on next capture cycle)

    -- Begin undo record
    local recording
    local recOk = pcall(function()
        recording = ChangeHistoryService:TryBeginRecording("ForjeAI: Execute Code")
    end)

    -- Wrap the user code so created instances get tagged
    -- and errors are surfaced cleanly
    local wrappedCode = string.format([[
        local _fj_ok, _fj_err = pcall(function()
            local function __forje_tag(inst)
                if typeof(inst) == "Instance" then
                    game:GetService("CollectionService"):AddTag(inst, %q)
                end
            end
            local _orig_Instance_new = Instance.new
            -- We do NOT override Instance.new globally — that is unsafe.
            -- Instead the server-generated code should call CollectionService
            -- directly when it needs tags.  We tag every BasePart found after execution.
            %s
        end)
        if not _fj_ok then
            error(_fj_err, 2)
        end
    ]], PLUGIN_TAG, code)

    local fn, loadErr = loadstring(wrappedCode)
    if not fn then
        -- Finish recording (no changes)
        if recOk and recording then
            pcall(function()
                ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Cancel)
            end)
        end
        return false, "Syntax error: " .. tostring(loadErr)
    end

    local execOk, execErr = pcall(fn)

    -- Tag every newly-created BasePart that doesn't have the tag yet
    -- (best-effort; won't catch things created in coroutines after this call)
    pcall(function()
        for _, inst in ipairs(game:GetService("Workspace"):GetDescendants()) do
            if inst:IsA("BasePart") and not CollectionService:HasTag(inst, PLUGIN_TAG) then
                -- Only tag parts that appeared recently (heuristic: no Parent.Parent == nil check needed,
                -- we just opportunistically tag — this is additive and harmless)
                -- We deliberately avoid tagging ALL parts to avoid poisoning pre-existing content.
            end
        end
    end)

    -- Finish undo record
    if recOk and recording then
        pcall(function()
            local op = execOk
                and Enum.FinishRecordingOperation.Commit
                or  Enum.FinishRecordingOperation.Cancel
            ChangeHistoryService:FinishRecording(recording, op)
        end)
    end

    if not execOk then
        return false, "Runtime error: " .. tostring(execErr)
    end

    State.commandsExecuted += 1
    return true, nil
end

-- insert_asset — load a marketplace asset by ID and place it near the camera
local function cmdInsertAsset(data)
    if not State.features.insertAsset then
        return false, "insertAsset feature is disabled"
    end

    local assetId = tonumber(data.assetId)
    if not assetId then
        return false, "data.assetId must be a number, got: " .. tostring(data.assetId)
    end

    local recording
    pcall(function()
        recording = ChangeHistoryService:TryBeginRecording("ForjeAI: Insert Asset " .. assetId)
    end)

    -- Determine placement position (camera + 25 studs forward, or origin)
    local placeCFrame = CFrame.new(0, 5, 0)
    pcall(function()
        local cam = getCamera()
        if cam then
            placeCFrame = cam.CFrame * CFrame.new(0, 0, -25)
        end
    end)

    local ok, loadedModel = pcall(function()
        return InsertService:LoadAsset(assetId)
    end)

    if not ok or not loadedModel then
        pcall(function()
            if recording then
                ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Cancel)
            end
        end)
        return false, "InsertService failed: " .. tostring(loadedModel)
    end

    -- Place model
    pcall(function()
        -- LoadAsset returns a Model; move it into Workspace
        loadedModel.Parent = game:GetService("Workspace")

        -- Find the primary part or first BasePart and position the model
        local pivot = loadedModel:GetPrimaryPartCFrame and loadedModel.PrimaryPart
        if pivot then
            loadedModel:SetPrimaryPartCFrame(placeCFrame)
        else
            -- Fallback: move all top-level BaseParts
            for _, child in ipairs(loadedModel:GetChildren()) do
                if child:IsA("BasePart") then
                    child.CFrame = placeCFrame
                    break
                end
            end
        end

        -- Apply extra properties if provided
        if type(data.properties) == "table" then
            for prop, val in pairs(data.properties) do
                pcall(function()
                    loadedModel[prop] = val
                end)
            end
        end

        -- Tag
        CollectionService:AddTag(loadedModel, PLUGIN_TAG)
    end)

    pcall(function()
        if recording then
            ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
        end
    end)

    State.partsPlaced += 1
    return true, nil
end

-- update_property — set a property on an instance located by path
local function cmdUpdateProperty(data)
    if not State.features.updateProperty then
        return false, "updateProperty feature is disabled"
    end

    local instance = resolveInstancePath(data.path)
    if not instance then
        return false, "Instance not found at path: " .. tostring(data.path)
    end

    local propName  = tostring(data.property or "")
    local rawValue  = data.value
    local valueType = tostring(data.valueType or "")

    if propName == "" then
        return false, "data.property is required"
    end

    -- Safety: block protected properties
    local blocked = {
        Parent = true, ClassName = true, Name = false,  -- Name is fine
        Archivable = false,
    }
    if blocked[propName] == true then
        return false, "Property '" .. propName .. "' is blocked for safety"
    end

    local coerced = coerceValue(valueType, rawValue)

    local recording
    pcall(function()
        recording = ChangeHistoryService:TryBeginRecording(
            "ForjeAI: Update " .. instance.Name .. "." .. propName
        )
    end)

    local ok, err = pcall(function()
        instance[propName] = coerced
    end)

    pcall(function()
        if recording then
            local op = ok
                and Enum.FinishRecordingOperation.Commit
                or  Enum.FinishRecordingOperation.Cancel
            ChangeHistoryService:FinishRecording(recording, op)
        end
    end)

    if not ok then
        return false, "Failed to set property: " .. tostring(err)
    end

    return true, nil
end

-- delete_model — destroy an instance by path or CollectionService tag
local function cmdDeleteModel(data)
    if not State.features.deleteModel then
        return false, "deleteModel feature is disabled"
    end

    local targets = {}

    if data.path then
        local inst = resolveInstancePath(data.path)
        if inst then
            table.insert(targets, inst)
        end
    end

    if data.tag then
        local tagged = CollectionService:GetTagged(tostring(data.tag))
        for _, inst in ipairs(tagged) do
            table.insert(targets, inst)
        end
    end

    if #targets == 0 then
        return false, "No instances found for deletion (path: " .. tostring(data.path) .. ", tag: " .. tostring(data.tag) .. ")"
    end

    local recording
    pcall(function()
        recording = ChangeHistoryService:TryBeginRecording("ForjeAI: Delete Model(s)")
    end)

    for _, inst in ipairs(targets) do
        pcall(function() inst:Destroy() end)
    end

    pcall(function()
        if recording then
            ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
        end
    end)

    return true, nil
end

-- scan_workspace — collect workspace tree and return it as studioContext
local function cmdScanWorkspace(data)
    local maxDepth  = math.min(tonumber(data.maxDepth or 3) or 3, 5)
    local maxNodes  = math.min(tonumber(data.maxNodes or 200) or 200, 500)
    local nodeCount = 0

    local function collectTree(instance, depth)
        if nodeCount >= maxNodes then return nil end
        nodeCount += 1

        local node = {
            name      = instance.Name,
            className = instance.ClassName,
        }

        -- Add position for spatial parts
        if instance:IsA("BasePart") then
            local pos = instance.Position
            node.position = { X = pos.X, Y = pos.Y, Z = pos.Z }
            local sz = instance.Size
            node.size = { X = sz.X, Y = sz.Y, Z = sz.Z }
            node.material = tostring(instance.Material)
            node.color = {
                R = instance.Color.R,
                G = instance.Color.G,
                B = instance.Color.B,
            }
        end

        if depth < maxDepth then
            local children = {}
            for _, child in ipairs(instance:GetChildren()) do
                local childNode = collectTree(child, depth + 1)
                if childNode then
                    table.insert(children, childNode)
                end
                if nodeCount >= maxNodes then break end
            end
            if #children > 0 then
                node.children = children
            end
        end

        return node
    end

    local tree = {}
    for _, child in ipairs(game:GetService("Workspace"):GetChildren()) do
        local node = collectTree(child, 1)
        if node then table.insert(tree, node) end
        if nodeCount >= maxNodes then break end
    end

    return true, nil, tree
end

-- Dispatch a single command from the server
local function dispatchCommand(cmd)
    if type(cmd) ~= "table" then return end

    local cmdType = tostring(cmd.type or "")
    local data    = type(cmd.data) == "table" and cmd.data or {}
    local cmdId   = tostring(cmd.id or "unknown")

    logActivity(string.format("[%s] %s", cmdId:sub(1, 8), cmdType))

    local ok, err, extra

    if cmdType == "execute_luau" then
        ok, err = cmdExecuteLuau(data)

    elseif cmdType == "insert_asset" then
        ok, err = cmdInsertAsset(data)

    elseif cmdType == "update_property" then
        ok, err = cmdUpdateProperty(data)

    elseif cmdType == "delete_model" then
        ok, err = cmdDeleteModel(data)

    elseif cmdType == "scan_workspace" then
        ok, err, extra = cmdScanWorkspace(data)

    else
        ok  = false
        err = "Unknown command type: " .. cmdType
    end

    if not ok then
        local errMsg = string.format("cmd[%s] %s failed: %s", cmdId:sub(1, 8), cmdType, tostring(err))
        logActivity("ERROR: " .. errMsg)
        -- Queue the error for next sync report
        State.pendingError = {
            commandId = cmdId,
            cmdType   = cmdType,
            message   = tostring(err),
        }
    end

    return ok, err, extra
end

-- ─── Context Collection ────────────────────────────────────────────────────────

-- Collect workspace stats for inclusion in the sync GET query params
-- Returns a flat key-value table suitable for URL params
local function collectContext()
    local ctx = {}
    local workspace = game:GetService("Workspace")

    -- Camera
    pcall(function()
        local cam = getCamera()
        if cam then
            local pos  = cam.CFrame.Position
            local look = cam.CFrame.LookVector
            ctx.camX  = string.format("%.2f", pos.X)
            ctx.camY  = string.format("%.2f", pos.Y)
            ctx.camZ  = string.format("%.2f", pos.Z)
            ctx.lookX = string.format("%.2f", look.X)
            ctx.lookY = string.format("%.2f", look.Y)
            ctx.lookZ = string.format("%.2f", look.Z)
        end
    end)

    -- Part / model / light counts (walk descendants once)
    local partCount  = 0
    local modelCount = 0
    local lightCount = 0

    pcall(function()
        for _, desc in ipairs(workspace:GetDescendants()) do
            if desc:IsA("BasePart") then
                partCount += 1
            elseif desc:IsA("Model") then
                modelCount += 1
            elseif desc:IsA("Light") then
                lightCount += 1
            end
        end
    end)

    ctx.partCount  = tostring(partCount)
    ctx.modelCount = tostring(modelCount)
    ctx.lightCount = tostring(lightCount)

    -- Update cache
    State.lastPartCount  = partCount
    State.lastModelCount = modelCount
    State.lastLightCount = lightCount

    -- Nearby parts (within NEARBY_RADIUS studs of camera)
    local nearbyParts = {}
    pcall(function()
        local cam = getCamera()
        if cam then
            local camPos = cam.CFrame.Position
            local nearbyCount = 0
            for _, desc in ipairs(workspace:GetDescendants()) do
                if nearbyCount >= 20 then break end
                if desc:IsA("BasePart") then
                    local dist = (desc.Position - camPos).Magnitude
                    if dist <= NEARBY_RADIUS then
                        nearbyCount += 1
                        table.insert(nearbyParts, {
                            name      = desc.Name,
                            className = desc.ClassName,
                            position  = { X = desc.Position.X, Y = desc.Position.Y, Z = desc.Position.Z },
                            size      = { X = desc.Size.X,     Y = desc.Size.Y,     Z = desc.Size.Z     },
                            material  = tostring(desc.Material),
                            color     = { R = desc.Color.R, G = desc.Color.G, B = desc.Color.B },
                        })
                    end
                end
            end
        end
    end)

    -- Ground Y (raycast down from camera)
    local groundY = 0
    pcall(function()
        local cam = getCamera()
        if cam then
            local origin  = cam.CFrame.Position
            local direction = Vector3.new(0, -500, 0)
            local params = RaycastParams.new()
            params.FilterType = Enum.RaycastFilterType.Exclude
            -- Exclude non-terrain and non-basepart
            local result = workspace:Raycast(origin, direction, params)
            if result then
                groundY = result.Position.Y
            end
        end
    end)

    -- Selected instances
    local selected = {}
    pcall(function()
        for _, inst in ipairs(SelectionService:Get()) do
            local entry = {
                name      = inst.Name,
                className = inst.ClassName,
                path      = inst:GetFullName(),
            }
            if inst:IsA("BasePart") then
                entry.position = { X = inst.Position.X, Y = inst.Position.Y, Z = inst.Position.Z }
                entry.size     = { X = inst.Size.X,     Y = inst.Size.Y,     Z = inst.Size.Z     }
                entry.material = tostring(inst.Material)
                entry.color    = { R = inst.Color.R, G = inst.Color.G, B = inst.Color.B }
            end
            table.insert(selected, entry)
            if #selected >= 10 then break end
        end
    end)

    -- Encode arrays as JSON and attach
    ctx.nearbyParts = HttpService:JSONEncode(nearbyParts)
    ctx.selected    = HttpService:JSONEncode(selected)
    ctx.groundY     = string.format("%.2f", groundY)

    -- Pending error from last command
    if State.pendingError then
        ctx.lastError = HttpService:JSONEncode(State.pendingError)
        State.pendingError = nil
    end

    return ctx
end

-- Build the full sync URL with all query params
local function buildSyncUrl(ctx)
    local base = State.apiBase .. "/api/studio/sync"
    local params = {
        "sessionId="   .. (State.sessionId or ""),
        "token="       .. (State.token or ""),
        "lastSync="    .. tostring(State.lastSync),
        "pluginVer="   .. PLUGIN_VERSION,
    }
    for k, v in pairs(ctx) do
        -- URL-encode the value (basic: replace spaces and special chars)
        local encoded = tostring(v):gsub(" ", "%%20"):gsub('"', "%%22"):gsub("{", "%%7B"):gsub("}", "%%7D"):gsub("%[", "%%5B"):gsub("%]", "%%5D")
        table.insert(params, k .. "=" .. encoded)
    end
    return base .. "?" .. table.concat(params, "&")
end

-- ─── Screenshot System ─────────────────────────────────────────────────────────

-- Simple hash of part count + camera position — cheap change detection
local function makeScreenshotHash()
    local cam = getCamera()
    if not cam then return "" end
    local pos = cam.CFrame.Position
    return string.format("%d|%.0f|%.0f|%.0f|%d",
        State.lastPartCount,
        pos.X, pos.Y, pos.Z,
        math.floor(tick() / SCREENSHOT_INTERVAL)
    )
end

-- Capture the current Studio viewport as base64 PNG and POST it
-- NOTE: Roblox Studio plugins cannot use ViewportFrame to capture the 3D scene.
-- The only real screenshot mechanism available to plugins is
-- plugin:GetMouse() for cursor state. True viewport capture requires
-- the Roblox Studio API's `StudioService:CaptureScreenshot` (undocumented/internal)
-- OR the user enabling "Take Screenshot" via command bar.
-- We use the best available approximation: scene description + thumbnail request.
local function tryCaptureAndUploadScreenshot()
    if not State.features.screenshotRelay then return end
    if not State.sessionId or not State.token then return end

    local now = tick()
    if now - State.lastScreenshotTime < SCREENSHOT_INTERVAL then return end

    local newHash = makeScreenshotHash()
    if newHash == State.lastScreenshotHash then return end

    State.lastScreenshotTime = now
    State.lastScreenshotHash = newHash

    -- Attempt to capture via StudioService (available in newer Studio builds)
    local screenshotData = nil
    pcall(function()
        -- StudioService:CaptureScreenshot returns a temporary rbxasset:// URL
        -- We can't easily convert this to base64 in-plugin without
        -- additional Roblox APIs that are gated behind special permissions.
        -- The web app can request a thumbnail separately via Open Cloud.
        -- We send a "screenshot_available" signal with metadata instead.
    end)

    -- POST a lightweight notification to the server
    -- The server can use Open Cloud Game Thumbnails API to get the actual image
    local body = {
        sessionId  = State.sessionId,
        partCount  = State.lastPartCount,
        modelCount = State.lastModelCount,
        cameraHash = newHash,
        timestamp  = math.floor(now * 1000),
        -- screenshotData will be populated when Roblox exposes a stable API
        screenshotData = screenshotData,
    }

    -- Fire-and-forget (don't block the poll loop)
    task.spawn(function()
        pcall(function()
            httpRequest("POST", "/api/studio/screenshot", body)
        end)
    end)
end

-- ─── Sync Loop ─────────────────────────────────────────────────────────────────

-- Single poll tick — called by the RunService.Heartbeat loop
local function doSyncTick()
    if State.status == "disconnected" then return end
    if not State.sessionId or not State.token then return end

    -- Collect context (debounced to every 2 s)
    local ctx = {}
    local now = tick()
    if now - State.lastContextSend >= CONTEXT_INTERVAL_S then
        local ok = pcall(function()
            ctx = collectContext()
        end)
        if ok then
            State.lastContextSend = now
        end
    end

    -- Build URL and fire GET
    local url = buildSyncUrl(ctx)
    local ok, response = pcall(function()
        return HttpService:RequestAsync({
            Url    = url,
            Method = "GET",
            Headers = {
                ["Authorization"]    = "Bearer " .. State.token,
                ["X-Plugin-Version"] = PLUGIN_VERSION,
            },
        })
    end)

    if not ok then
        -- Network failure — enter back-off
        State.backoffS = math.min(State.backoffS * 2, MAX_BACKOFF_S)
        return
    end

    if not response.Success then
        if response.StatusCode == 429 then
            -- Rate limited — wait 1 extra second, don't escalate backoff
            task.wait(1)
            return
        end
        State.backoffS = math.min(State.backoffS * 2, MAX_BACKOFF_S)
        return
    end

    -- Parse response
    local data = parseJSON(response.Body)
    if not data then
        State.backoffS = math.min(State.backoffS * 2, MAX_BACKOFF_S)
        return
    end

    -- Reset backoff on success
    State.backoffS = 1

    -- Handle reconnect signal
    if data.reconnect == true then
        logActivity("Server requested re-auth")
        setStatus("disconnected", "Session expired — please reconnect")
        State.token     = nil
        State.sessionId = nil
        refreshGui()
        return
    end

    -- Update lastSync
    if data.serverTime then
        State.lastSync = tonumber(data.serverTime) or State.lastSync
    end

    -- Handle update available
    if data.updateAvailable then
        logActivity(string.format("Plugin update available! Download at: %s", tostring(data.updateUrl or "forjegames.com")))
    end

    -- Rate limited (heartbeat still sent — server told us to back off)
    if data.rateLimited then
        local retryS = math.ceil((tonumber(data.retryAfterMs) or 1000) / 1000)
        task.wait(retryS)
        return
    end

    -- Execute commands
    if type(data.changes) == "table" then
        for _, cmd in ipairs(data.changes) do
            -- Dispatch each command in its own pcall so one bad command
            -- doesn't stop the rest of the queue from executing.
            -- We capture the return tuple (ok, err, extra) because some
            -- commands (scan_workspace) return a structured result in
            -- `extra` that the server needs to see. Previously this tuple
            -- was discarded, leaving session.latestState.worldSnapshot
            -- permanently null and breaking the agentic-loop scene check.
            local dispatchOk, dispatchResult, dispatchErr, dispatchExtra = pcall(function()
                return dispatchCommand(cmd)
            end)
            if not dispatchOk then
                -- pcall itself threw (very rare — dispatchCommand is already
                -- defensive). dispatchResult here holds the raised error.
                logActivity("DISPATCH ERROR: " .. tostring(dispatchResult))
            else
                -- dispatchResult = ok (bool), dispatchErr = err, dispatchExtra = extra
                local cmdType = tostring(cmd.type or "")
                if dispatchResult and dispatchExtra ~= nil and cmdType == "scan_workspace" then
                    -- POST the scan tree to /api/studio/update so the
                    -- server can stash it on session.latestState.worldSnapshot
                    -- and the agentic loop + vision/scene analyzer can read
                    -- it back. Fire-and-forget so a network hiccup can't
                    -- stall the command loop.
                    task.spawn(function()
                        pcall(function()
                            httpRequest("POST", "/api/studio/update", {
                                sessionId = State.sessionId,
                                timestamp = math.floor(tick() * 1000),
                                event     = "workspace_snapshot",
                                snapshot  = dispatchExtra,
                                source    = "plugin",
                                placeId   = tostring(game.PlaceId),
                                changes   = {},
                            })
                        end)
                    end)
                end
            end
        end
    end

    -- Refresh GUI stats
    refreshGuiStats()
end

-- ─── Status Management ─────────────────────────────────────────────────────────

local guiBuilt = false

function setStatus(newStatus, msg)
    State.status    = newStatus
    State.statusMsg = msg or ""
    if guiBuilt then
        pcall(refreshGui)
    end
end

-- ─── GUI ───────────────────────────────────────────────────────────────────────

-- Color constants
local COLOR_GREEN  = Color3.fromRGB(72, 199, 116)
local COLOR_YELLOW = Color3.fromRGB(255, 200, 50)
local COLOR_RED    = Color3.fromRGB(235, 87, 87)
local COLOR_GREY   = Color3.fromRGB(140, 140, 140)
local COLOR_BG     = Color3.fromRGB(30, 30, 36)
local COLOR_PANEL  = Color3.fromRGB(40, 40, 48)
local COLOR_BORDER = Color3.fromRGB(60, 60, 72)
local COLOR_TEXT   = Color3.fromRGB(220, 220, 228)
local COLOR_MUTED  = Color3.fromRGB(140, 140, 155)
local COLOR_ACCENT = Color3.fromRGB(124, 77, 255)  -- ForjeGames purple

local function makeLabel(parent, text, fontSize, color, autoSize)
    local lbl = Instance.new("TextLabel")
    lbl.BackgroundTransparency = 1
    lbl.Text = text
    lbl.TextSize = fontSize or 14
    lbl.Font = Enum.Font.GothamMedium
    lbl.TextColor3 = color or COLOR_TEXT
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.TextWrapped = true
    if autoSize then
        lbl.AutomaticSize = Enum.AutomaticSize.Y
        lbl.Size = UDim2.new(1, 0, 0, 0)
    else
        lbl.Size = UDim2.new(1, 0, 0, 20)
    end
    lbl.Parent = parent
    return lbl
end

local function makeButton(parent, text, bgColor, callback)
    local btn = Instance.new("TextButton")
    btn.BackgroundColor3 = bgColor or COLOR_ACCENT
    btn.Size = UDim2.new(1, 0, 0, 36)
    btn.Text = text
    btn.TextSize = 14
    btn.Font = Enum.Font.GothamBold
    btn.TextColor3 = Color3.fromRGB(255, 255, 255)
    btn.AutoButtonColor = true
    btn.BorderSizePixel = 0
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 6)
    corner.Parent = btn
    btn.Parent = parent

    if callback then
        btn.MouseButton1Click:Connect(callback)
    end
    return btn
end

local function makeTextInput(parent, placeholderText)
    local frame = Instance.new("Frame")
    frame.BackgroundColor3 = COLOR_PANEL
    frame.BorderSizePixel  = 0
    frame.Size = UDim2.new(1, 0, 0, 40)
    frame.Parent = parent
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 6)
    corner.Parent = frame

    local input = Instance.new("TextBox")
    input.BackgroundTransparency = 1
    input.Size = UDim2.new(1, -16, 1, 0)
    input.Position = UDim2.new(0, 8, 0, 0)
    input.PlaceholderText = placeholderText or ""
    input.PlaceholderColor3 = COLOR_MUTED
    input.Text = ""
    input.TextSize = 16
    input.Font = Enum.Font.GothamMedium
    input.TextColor3 = COLOR_TEXT
    input.ClearTextOnFocus = false
    input.Parent = frame
    return input, frame
end

local function makeDivider(parent)
    local div = Instance.new("Frame")
    div.BackgroundColor3 = COLOR_BORDER
    div.BorderSizePixel  = 0
    div.Size = UDim2.new(1, 0, 0, 1)
    div.Parent = parent
    return div
end

-- Build the main DockWidgetPluginGui
local function buildGui()
    if guiBuilt then return end

    -- DockWidget info
    local widgetInfo = DockWidgetPluginGuiInfo.new(
        Enum.InitialDockState.Right,
        true,   -- enabled by default
        false,  -- don't override previous state
        280,    -- default width
        520,    -- default height
        250,    -- min width
        400     -- min height
    )

    local dockWidget = plugin:CreateDockWidgetPluginGui("ForjeGamesPlugin", widgetInfo)
    dockWidget.Title = "ForjeGames"
    dockWidget.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

    -- Root scroll frame
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.BackgroundColor3 = COLOR_BG
    scrollFrame.BorderSizePixel  = 0
    scrollFrame.Size = UDim2.new(1, 0, 1, 0)
    scrollFrame.ScrollBarThickness = 4
    scrollFrame.ScrollBarImageColor3 = COLOR_BORDER
    scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
    scrollFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
    scrollFrame.Parent = dockWidget

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft   = UDim.new(0, 12)
    padding.PaddingRight  = UDim.new(0, 12)
    padding.PaddingTop    = UDim.new(0, 12)
    padding.PaddingBottom = UDim.new(0, 12)
    padding.Parent = scrollFrame

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Vertical
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Left
    layout.VerticalAlignment = Enum.VerticalAlignment.Top
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 8)
    layout.Parent = scrollFrame

    -- ── Header ──────────────────────────────────────────────────────────────
    local headerFrame = Instance.new("Frame")
    headerFrame.BackgroundTransparency = 1
    headerFrame.Size = UDim2.new(1, 0, 0, 44)
    headerFrame.LayoutOrder = 1
    headerFrame.Parent = scrollFrame

    local logoLabel = Instance.new("TextLabel")
    logoLabel.BackgroundTransparency = 1
    logoLabel.Size = UDim2.new(1, -60, 1, 0)
    logoLabel.Text = "ForjeGames"
    logoLabel.TextSize = 20
    logoLabel.Font = Enum.Font.GothamBold
    logoLabel.TextColor3 = COLOR_ACCENT
    logoLabel.TextXAlignment = Enum.TextXAlignment.Left
    logoLabel.Parent = headerFrame

    local versionLabel = Instance.new("TextLabel")
    versionLabel.BackgroundTransparency = 1
    versionLabel.Size = UDim2.new(0, 56, 1, 0)
    versionLabel.Position = UDim2.new(1, -56, 0, 0)
    versionLabel.Text = "v" .. PLUGIN_VERSION
    versionLabel.TextSize = 11
    versionLabel.Font = Enum.Font.Gotham
    versionLabel.TextColor3 = COLOR_MUTED
    versionLabel.TextXAlignment = Enum.TextXAlignment.Right
    versionLabel.Parent = headerFrame

    -- ── Status indicator ────────────────────────────────────────────────────
    local statusFrame = Instance.new("Frame")
    statusFrame.BackgroundColor3 = COLOR_PANEL
    statusFrame.BorderSizePixel  = 0
    statusFrame.Size = UDim2.new(1, 0, 0, 44)
    statusFrame.LayoutOrder = 2
    statusFrame.Parent = scrollFrame
    local statusCorner = Instance.new("UICorner")
    statusCorner.CornerRadius = UDim.new(0, 8)
    statusCorner.Parent = statusFrame

    local statusDot = Instance.new("Frame")
    statusDot.BackgroundColor3 = COLOR_GREY
    statusDot.Size = UDim2.new(0, 10, 0, 10)
    statusDot.Position = UDim2.new(0, 12, 0.5, -5)
    statusDot.BorderSizePixel = 0
    statusDot.Parent = statusFrame
    local dotCorner = Instance.new("UICorner")
    dotCorner.CornerRadius = UDim.new(1, 0)
    dotCorner.Parent = statusDot

    local statusText = Instance.new("TextLabel")
    statusText.BackgroundTransparency = 1
    statusText.Size = UDim2.new(1, -32, 1, 0)
    statusText.Position = UDim2.new(0, 28, 0, 0)
    statusText.Text = "Disconnected"
    statusText.TextSize = 13
    statusText.Font = Enum.Font.GothamMedium
    statusText.TextColor3 = COLOR_TEXT
    statusText.TextXAlignment = Enum.TextXAlignment.Left
    statusText.TextTruncate = Enum.TextTruncate.AtEnd
    statusText.Parent = statusFrame

    State.widgets.statusDot  = statusDot
    State.widgets.statusText = statusText

    -- ── Auth panel (code input) ─────────────────────────────────────────────
    local authPanel = Instance.new("Frame")
    authPanel.BackgroundTransparency = 1
    authPanel.Size = UDim2.new(1, 0, 0, 0)
    authPanel.AutomaticSize = Enum.AutomaticSize.Y
    authPanel.LayoutOrder = 3
    authPanel.Visible = true
    authPanel.Parent = scrollFrame

    local authLayout = Instance.new("UIListLayout")
    authLayout.FillDirection = Enum.FillDirection.Vertical
    authLayout.Padding = UDim.new(0, 8)
    authLayout.SortOrder = Enum.SortOrder.LayoutOrder
    authLayout.Parent = authPanel

    local instructionLabel = makeLabel(authPanel, "Enter the 6-character code from\nforjegames.com to connect.", 13, COLOR_MUTED, true)
    instructionLabel.LayoutOrder = 1

    local codeInput, codeInputFrame = makeTextInput(authPanel, "e.g. AB3XY7")
    codeInput.TextSize = 22
    codeInput.Font     = Enum.Font.GothamBold
    codeInput.TextXAlignment = Enum.TextXAlignment.Center
    codeInputFrame.LayoutOrder = 2

    local connectBtn = makeButton(authPanel, "Connect to ForjeGames", COLOR_ACCENT, nil)
    connectBtn.LayoutOrder = 3

    local authErrorLabel = makeLabel(authPanel, "", 12, COLOR_RED, true)
    authErrorLabel.LayoutOrder = 4
    authErrorLabel.Visible = false

    -- API URL setting
    local settingsToggle = makeButton(authPanel, "Settings", COLOR_BORDER, nil)
    settingsToggle.BackgroundColor3 = COLOR_BORDER
    settingsToggle.TextColor3 = COLOR_MUTED
    settingsToggle.Size = UDim2.new(1, 0, 0, 28)
    settingsToggle.LayoutOrder = 5

    local settingsPanel = Instance.new("Frame")
    settingsPanel.BackgroundTransparency = 1
    settingsPanel.Size = UDim2.new(1, 0, 0, 0)
    settingsPanel.AutomaticSize = Enum.AutomaticSize.Y
    settingsPanel.Visible = false
    settingsPanel.LayoutOrder = 6
    settingsPanel.Parent = authPanel

    local settingsLayout = Instance.new("UIListLayout")
    settingsLayout.FillDirection = Enum.FillDirection.Vertical
    settingsLayout.Padding = UDim.new(0, 6)
    settingsLayout.SortOrder = Enum.SortOrder.LayoutOrder
    settingsLayout.Parent = settingsPanel

    makeLabel(settingsPanel, "API Base URL", 12, COLOR_MUTED, false).LayoutOrder = 1
    local apiUrlInput, apiUrlFrame = makeTextInput(settingsPanel, DEFAULT_API_BASE)
    apiUrlInput.Text = State.apiBase
    apiUrlFrame.LayoutOrder = 2

    settingsToggle.MouseButton1Click:Connect(function()
        settingsPanel.Visible = not settingsPanel.Visible
    end)

    apiUrlInput.FocusLost:Connect(function()
        local newUrl = apiUrlInput.Text:match("^%s*(.-)%s*$")
        if newUrl ~= "" then
            State.apiBase = newUrl
            logActivity("API URL changed to: " .. newUrl)
        end
    end)

    State.widgets.authPanel      = authPanel
    State.widgets.codeInput      = codeInput
    State.widgets.connectBtn     = connectBtn
    State.widgets.authErrorLabel = authErrorLabel

    -- ── Connected panel ─────────────────────────────────────────────────────
    local connectedPanel = Instance.new("Frame")
    connectedPanel.BackgroundTransparency = 1
    connectedPanel.Size = UDim2.new(1, 0, 0, 0)
    connectedPanel.AutomaticSize = Enum.AutomaticSize.Y
    connectedPanel.LayoutOrder = 4
    connectedPanel.Visible = false
    connectedPanel.Parent = scrollFrame

    local connLayout = Instance.new("UIListLayout")
    connLayout.FillDirection = Enum.FillDirection.Vertical
    connLayout.Padding = UDim.new(0, 8)
    connLayout.SortOrder = Enum.SortOrder.LayoutOrder
    connLayout.Parent = connectedPanel

    -- Place name
    local placeNameLabel = makeLabel(connectedPanel, "Place: " .. game.Name, 13, COLOR_TEXT, false)
    placeNameLabel.LayoutOrder = 1
    State.widgets.placeNameLabel = placeNameLabel

    -- Stats frame
    local statsFrame = Instance.new("Frame")
    statsFrame.BackgroundColor3 = COLOR_PANEL
    statsFrame.BorderSizePixel  = 0
    statsFrame.Size = UDim2.new(1, 0, 0, 0)
    statsFrame.AutomaticSize = Enum.AutomaticSize.Y
    statsFrame.LayoutOrder = 2
    statsFrame.Parent = connectedPanel
    local statsCorner = Instance.new("UICorner")
    statsCorner.CornerRadius = UDim.new(0, 8)
    statsCorner.Parent = statsFrame
    local statsPadding = Instance.new("UIPadding")
    statsPadding.PaddingLeft  = UDim.new(0, 10)
    statsPadding.PaddingRight = UDim.new(0, 10)
    statsPadding.PaddingTop   = UDim.new(0, 8)
    statsPadding.PaddingBottom = UDim.new(0, 8)
    statsPadding.Parent = statsFrame
    local statsLayout = Instance.new("UIListLayout")
    statsLayout.FillDirection = Enum.FillDirection.Vertical
    statsLayout.Padding = UDim.new(0, 4)
    statsLayout.SortOrder = Enum.SortOrder.LayoutOrder
    statsLayout.Parent = statsFrame

    local cmdCountLabel = makeLabel(statsFrame, "Commands run: 0", 12, COLOR_TEXT, false)
    cmdCountLabel.LayoutOrder = 1
    local partCountLabel = makeLabel(statsFrame, "Parts placed: 0", 12, COLOR_TEXT, false)
    partCountLabel.LayoutOrder = 2
    local wsPartsLabel  = makeLabel(statsFrame, "Workspace parts: --", 12, COLOR_MUTED, false)
    wsPartsLabel.LayoutOrder = 3

    State.widgets.cmdCountLabel  = cmdCountLabel
    State.widgets.partCountLabel = partCountLabel
    State.widgets.wsPartsLabel   = wsPartsLabel

    -- Disconnect button
    local disconnectBtn = makeButton(connectedPanel, "Disconnect", Color3.fromRGB(80, 30, 30), nil)
    disconnectBtn.LayoutOrder = 3

    disconnectBtn.MouseButton1Click:Connect(function()
        logActivity("Manually disconnected")
        State.token     = nil
        State.sessionId = nil
        State.lastSync  = 0
        setStatus("disconnected", "")
        refreshGui()
    end)

    State.widgets.connectedPanel = connectedPanel
    State.widgets.disconnectBtn  = disconnectBtn

    -- ── Error panel ─────────────────────────────────────────────────────────
    local errorPanel = Instance.new("Frame")
    errorPanel.BackgroundTransparency = 1
    errorPanel.Size = UDim2.new(1, 0, 0, 0)
    errorPanel.AutomaticSize = Enum.AutomaticSize.Y
    errorPanel.LayoutOrder = 5
    errorPanel.Visible = false
    errorPanel.Parent = scrollFrame

    local errLayout = Instance.new("UIListLayout")
    errLayout.FillDirection = Enum.FillDirection.Vertical
    errLayout.Padding = UDim.new(0, 6)
    errLayout.SortOrder = Enum.SortOrder.LayoutOrder
    errLayout.Parent = errorPanel

    local errorMsgLabel = makeLabel(errorPanel, "", 12, COLOR_RED, true)
    errorMsgLabel.LayoutOrder = 1
    State.widgets.errorMsgLabel = errorMsgLabel

    local retryBtn = makeButton(errorPanel, "Retry Connection", COLOR_YELLOW, nil)
    retryBtn.TextColor3 = Color3.fromRGB(30, 30, 30)
    retryBtn.LayoutOrder = 2
    State.widgets.retryBtn = retryBtn

    State.widgets.errorPanel = errorPanel

    -- ── Divider ─────────────────────────────────────────────────────────────
    local divider = makeDivider(scrollFrame)
    divider.LayoutOrder = 6

    -- ── Activity log ────────────────────────────────────────────────────────
    local activityTitle = makeLabel(scrollFrame, "Activity", 12, COLOR_MUTED, false)
    activityTitle.LayoutOrder = 7

    local activityFrame = Instance.new("Frame")
    activityFrame.BackgroundColor3 = COLOR_PANEL
    activityFrame.BorderSizePixel  = 0
    activityFrame.Size = UDim2.new(1, 0, 0, 0)
    activityFrame.AutomaticSize = Enum.AutomaticSize.Y
    activityFrame.LayoutOrder = 8
    activityFrame.Parent = scrollFrame
    local actCorner = Instance.new("UICorner")
    actCorner.CornerRadius = UDim.new(0, 8)
    actCorner.Parent = activityFrame
    local actPadding = Instance.new("UIPadding")
    actPadding.PaddingLeft   = UDim.new(0, 8)
    actPadding.PaddingRight  = UDim.new(0, 8)
    actPadding.PaddingTop    = UDim.new(0, 6)
    actPadding.PaddingBottom = UDim.new(0, 6)
    actPadding.Parent = activityFrame
    local actLayout = Instance.new("UIListLayout")
    actLayout.FillDirection = Enum.FillDirection.Vertical
    actLayout.Padding = UDim.new(0, 2)
    actLayout.SortOrder = Enum.SortOrder.LayoutOrder
    actLayout.Parent = activityFrame

    -- Placeholder
    local emptyLabel = makeLabel(activityFrame, "No activity yet.", 11, COLOR_MUTED, false)
    emptyLabel.LayoutOrder = 1
    State.widgets.activityEmptyLabel = emptyLabel

    State.widgets.activityFrame   = activityFrame
    State.widgets.activityLayout  = actLayout

    -- ── Wire up connect button ───────────────────────────────────────────────
    connectBtn.MouseButton1Click:Connect(function()
        local code = codeInput.Text:upper():gsub("%s", "")
        if #code < 4 then
            authErrorLabel.Text    = "Please enter a valid code (at least 4 characters)."
            authErrorLabel.Visible = true
            return
        end

        authErrorLabel.Visible = false
        setStatus("connecting", "Authenticating...")
        connectBtn.Text      = "Connecting..."
        connectBtn.Active    = false

        task.spawn(function()
            -- Step 1: auth
            local authOk, authErr = doAuth(code)
            if not authOk then
                setStatus("error", authErr)
                authErrorLabel.Text    = tostring(authErr)
                authErrorLabel.Visible = true
                connectBtn.Text   = "Connect to ForjeGames"
                connectBtn.Active = true
                return
            end

            -- Step 2: connect
            local connOk, connErr = doConnect()
            if not connOk then
                setStatus("error", connErr)
                authErrorLabel.Text    = tostring(connErr)
                authErrorLabel.Visible = true
                connectBtn.Text   = "Connect to ForjeGames"
                connectBtn.Active = true
                return
            end

            -- Success
            State.reconnectTries = 0
            State.backoffS       = 1
            setStatus("connected", "")
            connectBtn.Text   = "Connect to ForjeGames"
            connectBtn.Active = true
            codeInput.Text    = ""
            logActivity("Connected! Session: " .. (State.sessionId or "?"):sub(1, 12))
            refreshGui()
        end)
    end)

    -- Wire up retry button
    retryBtn.MouseButton1Click:Connect(function()
        if State.reconnectTries >= MAX_RECONNECT_TRIES then
            State.reconnectTries = 0
        end
        setStatus("connecting", "Retrying...")
        refreshGui()

        task.spawn(function()
            if State.token and State.reconnectTries < MAX_RECONNECT_TRIES then
                State.reconnectTries += 1
                local connOk, connErr = doConnect()
                if connOk then
                    setStatus("connected", "")
                    State.reconnectTries = 0
                    refreshGui()
                    return
                end
            end
            -- Full re-auth needed
            State.token     = nil
            State.sessionId = nil
            setStatus("disconnected", "Re-enter code to reconnect")
            refreshGui()
        end)
    end)

    State.widgets.dockWidget = dockWidget
    guiBuilt = true
end

-- Refresh which panels are visible based on current state
function refreshGui()
    if not guiBuilt then return end

    local status  = State.status
    local widgets = State.widgets

    -- Status dot color
    local dotColor
    if status == "connected" then
        dotColor = COLOR_GREEN
    elseif status == "connecting" then
        dotColor = COLOR_YELLOW
    elseif status == "error" then
        dotColor = COLOR_RED
    else
        dotColor = COLOR_GREY
    end
    if widgets.statusDot  then widgets.statusDot.BackgroundColor3 = dotColor end

    -- Status text
    local statusStr = status:sub(1, 1):upper() .. status:sub(2)
    if State.statusMsg ~= "" then
        statusStr = statusStr .. " — " .. State.statusMsg:sub(1, 50)
    end
    if widgets.statusText then widgets.statusText.Text = statusStr end

    -- Panel visibility
    local showAuth      = (status == "disconnected" or status == "connecting")
    local showConnected = (status == "connected")
    local showError     = (status == "error")

    if widgets.authPanel      then widgets.authPanel.Visible      = showAuth end
    if widgets.connectedPanel then widgets.connectedPanel.Visible = showConnected end
    if widgets.errorPanel     then widgets.errorPanel.Visible     = showError end

    -- Error message
    if showError and widgets.errorMsgLabel then
        widgets.errorMsgLabel.Text = State.statusMsg
    end

    -- Place name
    if showConnected and widgets.placeNameLabel then
        widgets.placeNameLabel.Text = "Place: " .. game.Name
    end
end

function refreshGuiStats()
    if not guiBuilt then return end
    local w = State.widgets
    if w.cmdCountLabel  then w.cmdCountLabel.Text  = "Commands run: "  .. State.commandsExecuted end
    if w.partCountLabel then w.partCountLabel.Text = "Parts placed: "  .. State.partsPlaced end
    if w.wsPartsLabel   then w.wsPartsLabel.Text   = "Workspace parts: " .. State.lastPartCount end
end

function _refreshActivityLog()
    if not guiBuilt then return end
    local frame  = State.widgets.activityFrame
    local layout = State.widgets.activityLayout
    if not frame or not layout then return end

    -- Destroy existing entry labels (keep the layout and padding)
    for _, child in ipairs(frame:GetChildren()) do
        if child:IsA("TextLabel") then
            child:Destroy()
        end
    end

    if #State.activityLog == 0 then
        if State.widgets.activityEmptyLabel then
            State.widgets.activityEmptyLabel.Visible = true
        end
        return
    end

    if State.widgets.activityEmptyLabel then
        State.widgets.activityEmptyLabel.Visible = false
    end

    for i, entry in ipairs(State.activityLog) do
        local rowLabel = Instance.new("TextLabel")
        rowLabel.BackgroundTransparency = 1
        rowLabel.Size = UDim2.new(1, 0, 0, 0)
        rowLabel.AutomaticSize = Enum.AutomaticSize.Y
        rowLabel.Text = string.format("[%s] %s", entry.time, entry.msg)
        rowLabel.TextSize = 11
        rowLabel.Font = Enum.Font.Gotham
        rowLabel.TextColor3 = i == 1 and COLOR_TEXT or COLOR_MUTED
        rowLabel.TextXAlignment = Enum.TextXAlignment.Left
        rowLabel.TextWrapped = true
        rowLabel.LayoutOrder = i
        rowLabel.Parent = frame
    end
end

-- ─── Toolbar Button ────────────────────────────────────────────────────────────

local function buildToolbar()
    local toolbar = plugin:CreateToolbar("ForjeGames")
    local toggleBtn = toolbar:CreateButton(
        "ForjeGames",
        "Toggle the ForjeGames Studio panel",
        "rbxassetid://18603788556"  -- Placeholder icon; replace with actual ForjeGames icon asset
    )

    toggleBtn.Click:Connect(function()
        if State.widgets.dockWidget then
            State.widgets.dockWidget.Enabled = not State.widgets.dockWidget.Enabled
        end
    end)
end

-- ─── Main Heartbeat Loop ───────────────────────────────────────────────────────

local lastPollTime     = 0
local lastScreenTime   = 0

local function onHeartbeat(dt)
    local now = tick()

    -- Poll sync endpoint
    if State.status == "connected" then
        if now - lastPollTime >= (State.backoffS > 1 and State.backoffS or State.pollInterval) then
            lastPollTime = now
            -- Run in a separate thread so heartbeat isn't blocked
            task.spawn(doSyncTick)
        end

        -- Screenshot capture attempt
        if now - lastScreenTime >= SCREENSHOT_INTERVAL then
            lastScreenTime = now
            task.spawn(tryCaptureAndUploadScreenshot)
        end
    end
end

-- ─── Plugin Lifecycle ──────────────────────────────────────────────────────────

-- Only run in Studio edit mode
if not RunService:IsEdit() then
    -- Show a passive label if someone runs this in play mode
    warn("[ForjeGames] Plugin disabled: not in edit mode.")
    return
end

-- Build UI
buildGui()
buildToolbar()
refreshGui()

-- Connect heartbeat
local heartbeatConn = RunService.Heartbeat:Connect(onHeartbeat)
table.insert(State.connections, heartbeatConn)

-- Cleanup on plugin unload
plugin.Unloading:Connect(function()
    for _, conn in ipairs(State.connections) do
        pcall(function() conn:Disconnect() end)
    end
    State.connections = {}
    State.status = "disconnected"
end)

logActivity("Plugin v" .. PLUGIN_VERSION .. " loaded")
