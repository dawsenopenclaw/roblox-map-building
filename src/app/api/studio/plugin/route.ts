/**
 * GET /api/studio/plugin
 *
 * Serves the ForjeGames Roblox Studio plugin as a downloadable .lua file.
 * The plugin connects Roblox Studio to the ForjeGames web editor via the
 * auth-code handshake (/api/studio/auth) and polls /api/studio/sync for
 * pending commands.
 */

import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Plugin source — embedded directly so this route has zero filesystem deps
// ---------------------------------------------------------------------------

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v1.1.0
-- https://forjegames.com/docs/studio
--
-- Install: Place this file in %LOCALAPPDATA%\\Roblox\\Plugins\\
-- Or paste the loadstring below in the Studio Command Bar:
--   loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()

local BASE_URL   = "https://forjegames.com"
local POLL_MS    = 1000   -- sync interval (ms)
local HB_MS      = 5000   -- heartbeat interval (ms)
local PLUGIN_VER = "1.1.0"

-- ── Services ─────────────────────────────────────────────────────────────────

local HttpService          = game:GetService("HttpService")
local RunService           = game:GetService("RunService")
local StudioService        = game:GetService("StudioService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local MarketplaceService   = game:GetService("MarketplaceService")

-- ── State ─────────────────────────────────────────────────────────────────────

local sessionToken   : string? = nil
local sessionId      : string? = nil
local connectionCode : string? = nil
local connected      = false
local lastSyncAt     = 0
local lastHbAt       = 0

-- Failure tracking for auto-disconnect
local consecutiveFailures = 0
local MAX_FAILURES        = 5   -- disconnect after this many back-to-back errors

-- Cached place info (read once on connect, reused in every heartbeat)
local cachedPlaceId   = ""
local cachedPlaceName = "Unnamed Place"

-- ── Plugin toolbar ────────────────────────────────────────────────────────────

local toolbar    = plugin:CreateToolbar("ForjeGames")
local connectBtn = toolbar:CreateButton("Connect", "Connect to ForjeGames.com", "rbxassetid://0")
local statusLabel = toolbar:CreateButton("●  Disconnected", "", "rbxassetid://0")
statusLabel.ClickableWhenViewportHidden = true

-- ── Helpers ───────────────────────────────────────────────────────────────────

--[[
    Raw HTTP request — no retry.
    Returns (success: boolean, decodedBody: any).
    Body is nil when the server returns a non-2xx status or on network error.
]]
local function requestOnce(method: string, path: string, body: {[string]: any}?): (boolean, any)
    local ok, result = pcall(function()
        local opts = {
            Url    = BASE_URL .. path,
            Method = method,
            Headers = { ["Content-Type"] = "application/json" },
        }
        if body then
            opts.Body = HttpService:JSONEncode(body)
        end
        local res = HttpService:RequestAsync(opts)
        if res.Success then
            return HttpService:JSONDecode(res.Body)
        end
        return nil
    end)
    return ok, result
end

--[[
    Retrying request with exponential back-off.
    Attempts: 1 + maxRetries  (default 3 retries = 4 total attempts).
    Back-off delays: 2s, 4s, 8s  (doubles each time).
    Returns (success: boolean, decodedBody: any).
]]
local function request(
    method    : string,
    path      : string,
    body      : {[string]: any}?,
    maxRetries: number?
): (boolean, any)
    local retries = maxRetries or 3
    local delay   = 2   -- seconds; doubles after each failure

    for attempt = 1, retries + 1 do
        local ok, data = requestOnce(method, path, body)
        if ok and data ~= nil then
            return true, data
        end
        if attempt <= retries then
            warn(string.format("[ForjeGames] Request failed (attempt %d/%d). Retrying in %ds…",
                attempt, retries + 1, delay))
            task.wait(delay)
            delay = delay * 2
        end
    end
    return false, nil
end

local function setStatus(label: string, isConnected: boolean)
    connected = isConnected
    statusLabel.Text = isConnected and ("● " .. label) or ("○ " .. label)
end

--[[
    Called whenever a poll or heartbeat fails.
    Increments the consecutive-failure counter and forces a disconnect
    once MAX_FAILURES is reached so the user can see the problem immediately.
]]
local function onRequestFailure()
    consecutiveFailures += 1
    if consecutiveFailures >= MAX_FAILURES then
        warn("[ForjeGames] " .. MAX_FAILURES .. " consecutive failures — disconnecting. Click Connect to reconnect.")
        sessionToken = nil
        sessionId = nil
        consecutiveFailures = 0
        setStatus("Disconnected (lost connection)", false)
    end
end

local function onRequestSuccess()
    consecutiveFailures = 0
end

-- ── Place info ────────────────────────────────────────────────────────────────

--[[
    Reads game.PlaceId and resolves the human-readable name via MarketplaceService.
    Falls back to "Unnamed Place" if the API call errors (e.g. unpublished place).
    Results are cached in module-level variables so we never call this in a tight loop.
]]
local function resolvePlaceInfo()
    cachedPlaceId = tostring(game.PlaceId)
    local ok, info = pcall(function()
        return MarketplaceService:GetProductInfo(game.PlaceId)
    end)
    if ok and info and info.Name then
        cachedPlaceName = info.Name
    else
        cachedPlaceName = game.Name ~= "" and game.Name or "Unnamed Place"
    end
end

-- ── Post-command update ───────────────────────────────────────────────────────

--[[
    Fires and forgets a status update to /api/studio/update after every command.
    Lets the web UI know which command just ran and whether it succeeded.
    No retry here — this is best-effort telemetry, not critical data.
]]
local function reportCommandResult(cmdType: string, success: boolean, errorMsg: string?)
    if not sessionToken then return end
    task.spawn(function()
        requestOnce("POST", "/api/studio/update", {
            sessionId    = sessionId,
            sessionToken = sessionToken,
            placeId      = cachedPlaceId,
            placeName    = cachedPlaceName,
            event        = "command_completed",
            changes      = {{
                type      = "command_completed",
                command   = cmdType,
                success   = success,
                error     = errorMsg or nil,
                timestamp = os.time(),
            }},
        })
    end)
end

-- ── Connection code dialog ─────────────────────────────────────────────────────

local function promptForCode()
    local gui = Instance.new("ScreenGui")
    gui.Name = "ForjeGamesConnect"
    gui.ResetOnSpawn = false
    gui.Parent = game:GetService("CoreGui")

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 320, 0, 200)
    frame.Position = UDim2.new(0.5, -160, 0.5, -100)
    frame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    frame.BorderSizePixel = 0
    frame.Parent = gui

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = frame

    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, -32, 0, 40)
    title.Position = UDim2.new(0, 16, 0, 12)
    title.BackgroundTransparency = 1
    title.Text = "Connect to ForjeGames"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 15
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = frame

    local sub = Instance.new("TextLabel")
    sub.Size = UDim2.new(1, -32, 0, 30)
    sub.Position = UDim2.new(0, 16, 0, 50)
    sub.BackgroundTransparency = 1
    sub.Text = "Enter the 6-character code from forjegames.com/settings/studio"
    sub.TextColor3 = Color3.fromRGB(160, 160, 160)
    sub.Font = Enum.Font.Gotham
    sub.TextSize = 11
    sub.TextWrapped = true
    sub.TextXAlignment = Enum.TextXAlignment.Left
    sub.Parent = frame

    local input = Instance.new("TextBox")
    input.Size = UDim2.new(1, -32, 0, 44)
    input.Position = UDim2.new(0, 16, 0, 90)
    input.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
    input.TextColor3 = Color3.fromRGB(212, 175, 55)
    input.Font = Enum.Font.GothamBold
    input.TextSize = 24
    input.PlaceholderText = "XXXXXX"
    input.PlaceholderColor3 = Color3.fromRGB(80, 80, 80)
    input.Text = ""
    input.ClearTextOnFocus = false
    input.TextXAlignment = Enum.TextXAlignment.Center
    input.BorderSizePixel = 0
    input.Parent = frame

    local inputCorner = Instance.new("UICorner")
    inputCorner.CornerRadius = UDim.new(0, 8)
    inputCorner.Parent = input

    local errorLabel = Instance.new("TextLabel")
    errorLabel.Size = UDim2.new(1, -32, 0, 20)
    errorLabel.Position = UDim2.new(0, 16, 0, 138)
    errorLabel.BackgroundTransparency = 1
    errorLabel.Text = ""
    errorLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
    errorLabel.Font = Enum.Font.Gotham
    errorLabel.TextSize = 11
    errorLabel.TextXAlignment = Enum.TextXAlignment.Center
    errorLabel.Parent = frame

    local connectButton = Instance.new("TextButton")
    connectButton.Size = UDim2.new(1, -32, 0, 38)
    connectButton.Position = UDim2.new(0, 16, 0, 148)
    connectButton.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
    connectButton.TextColor3 = Color3.fromRGB(0, 0, 0)
    connectButton.Font = Enum.Font.GothamBold
    connectButton.TextSize = 13
    connectButton.Text = "Connect"
    connectButton.BorderSizePixel = 0
    connectButton.Parent = frame

    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 8)
    btnCorner.Parent = connectButton

    connectButton.MouseButton1Click:Connect(function()
        local code = string.upper(string.gsub(input.Text, "%s", ""))
        if #code ~= 6 then
            errorLabel.Text = "Code must be 6 characters."
            return
        end
        connectButton.Text = "Connecting..."
        connectButton.Active = false

        -- Resolve place info once here; cached for the session lifetime
        resolvePlaceInfo()

        local ok, data = request("POST", "/api/studio/auth", {
            code          = code,
            placeId       = cachedPlaceId,
            placeName     = cachedPlaceName,
            pluginVersion = PLUGIN_VER,
        })

        if ok and data and (data.token or data.sessionToken) then
            sessionToken      = data.token or data.sessionToken
            sessionId         = data.sessionId
            connectionCode    = code
            consecutiveFailures = 0
            setStatus("Connected — " .. cachedPlaceName, true)
            gui:Destroy()
        else
            errorLabel.Text = "Invalid or expired code. Try again."
            connectButton.Text = "Connect"
            connectButton.Active = true
        end
    end)

    return gui
end

-- ── Connect button handler ────────────────────────────────────────────────────

connectBtn.Click:Connect(function()
    if connected then
        sessionToken = nil
        sessionId = nil
        consecutiveFailures = 0
        setStatus("Disconnected", false)
    else
        promptForCode()
    end
end)

-- ── Command executor ──────────────────────────────────────────────────────────

local function executeCommand(cmd: {[string]: any})
    local cmdType = cmd.type or cmd.command

    if cmdType == "execute_luau" or cmdType == "execute_code" then
        local code = cmd.data and cmd.data.code or cmd.code or ""
        if code ~= "" then
            local fn, compileErr = loadstring(code)
            if fn then
                local runOk, runErr = pcall(fn)
                if not runOk then
                    warn("[ForjeGames] Script error:", runErr)
                    reportCommandResult(cmdType, false, tostring(runErr))
                    return
                end
            else
                warn("[ForjeGames] Compile error:", compileErr)
                reportCommandResult(cmdType, false, "compile: " .. tostring(compileErr))
                return
            end
        end

    elseif cmdType == "insert_model" then
        local assetId = cmd.data and cmd.data.assetId
        if assetId then
            local insertOk, inserted = pcall(function()
                return game:GetService("InsertService"):LoadAsset(tonumber(assetId))
            end)
            if insertOk and inserted then
                inserted.Parent = workspace
                ChangeHistoryService:SetWaypoint("ForjeGames: Insert model " .. tostring(assetId))
            else
                warn("[ForjeGames] Insert error:", tostring(inserted))
                reportCommandResult(cmdType, false, tostring(inserted))
                return
            end
        end

    elseif cmdType == "update_property" then
        local data = cmd.data or {}
        local target = workspace:FindFirstChild(data.instancePath or "", true)
        if target then
            local propOk, propErr = pcall(function()
                target[data.property] = data.value
            end)
            if not propOk then
                warn("[ForjeGames] Property error:", propErr)
                reportCommandResult(cmdType, false, tostring(propErr))
                return
            end
        end

    elseif cmdType == "delete_model" then
        local data = cmd.data or {}
        local target = workspace:FindFirstChild(data.instancePath or "", true)
        if target then
            target:Destroy()
            ChangeHistoryService:SetWaypoint("ForjeGames: Delete")
        end
    end

    -- Notify the server this command completed successfully
    reportCommandResult(cmdType, true)
end

-- ── Sync loop ─────────────────────────────────────────────────────────────────

RunService.Heartbeat:Connect(function()
    if not sessionToken then return end

    local now = tick() * 1000

    -- ── Heartbeat (every 5 s) ────────────────────────────────────────────────
    if now - lastHbAt >= HB_MS then
        lastHbAt = now
        task.spawn(function()
            -- Heartbeat uses a single attempt only; retry logic would cause
            -- overlapping heartbeats and inflate server-side latency metrics.
            local hbOk, _ = requestOnce("POST", "/api/studio/update", {
                sessionId    = sessionId,
                sessionToken = sessionToken,
                placeId      = cachedPlaceId,
                placeName    = cachedPlaceName,
                event        = "heartbeat",
                timestamp    = os.time(),
            })
            if hbOk then
                onRequestSuccess()
            else
                warn("[ForjeGames] Heartbeat failed.")
                onRequestFailure()
            end
        end)
    end

    -- ── Command poll (every 1 s) ─────────────────────────────────────────────
    if now - lastSyncAt >= POLL_MS then
        lastSyncAt = now
        task.spawn(function()
            local pollOk, data = request("GET",
                "/api/studio/sync?sessionId=" .. HttpService:UrlEncode(sessionId or "")
                .. "&token=" .. HttpService:UrlEncode(sessionToken or ""))

            if pollOk and data then
                onRequestSuccess()
                if data.commands then
                    for _, cmd in ipairs(data.commands) do
                        executeCommand(cmd)
                    end
                end
            else
                warn("[ForjeGames] Sync poll failed.")
                onRequestFailure()
            end
        end)
    end
end)

print("[ForjeGames] Plugin loaded v" .. PLUGIN_VER .. ". Click 'Connect' in the toolbar to link Studio.")
`

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  return new NextResponse(PLUGIN_LUA, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="ForjeGames.lua"',
      'Cache-Control': 'no-store',
    },
  })
}
