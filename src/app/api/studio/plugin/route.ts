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

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v1.0.0
-- https://forjegames.com/docs/studio
--
-- Install: Place this file in %LOCALAPPDATA%\\Roblox\\Plugins\\
-- Or paste the loadstring below in the Studio Command Bar:
--   loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()

local BASE_URL   = "https://forjegames.com"
local POLL_MS    = 1000   -- sync interval (ms)
local HB_MS      = 5000   -- heartbeat interval (ms)
local PLUGIN_VER = "1.0.0"

-- ── Services ─────────────────────────────────────────────────────────────────

local HttpService       = game:GetService("HttpService")
local RunService        = game:GetService("RunService")
local StudioService     = game:GetService("StudioService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- ── State ─────────────────────────────────────────────────────────────────────

local sessionToken : string?  = nil
local connectionCode : string? = nil
local connected = false
local lastSyncAt = 0
local lastHbAt   = 0

-- ── Plugin toolbar ────────────────────────────────────────────────────────────

local toolbar      = plugin:CreateToolbar("ForjeGames")
local connectBtn   = toolbar:CreateButton("Connect", "Connect to ForjeGames.com", "rbxassetid://0")
local statusLabel  = toolbar:CreateButton("●  Disconnected", "", "rbxassetid://0")
statusLabel.ClickableWhenViewportHidden = true

-- ── Helpers ───────────────────────────────────────────────────────────────────

local function request(method: string, path: string, body: {[string]: any}?): (boolean, any)
    local ok, result = pcall(function()
        local opts: HttpService.RequestAsyncRequest = {
            Url    = BASE_URL .. path,
            Method = method,
            Headers = {
                ["Content-Type"] = "application/json",
            },
        }
        if body then
            opts.Body = HttpService:JSONEncode(body)
        end
        local res = HttpService:RequestAsync(opts)
        if res.Success then
            return HttpService:JSONDecode(res.Body)
        else
            return nil
        end
    end)
    return ok, result
end

local function setStatus(label: string, isConnected: boolean)
    connected = isConnected
    statusLabel.Text = isConnected and ("● " .. label) or ("○ " .. label)
end

-- ── Connection code dialog ─────────────────────────────────────────────────────

local function promptForCode()
    -- In a real plugin this would open a DockWidgetPluginGui with a text input.
    -- For simplicity we use a game-agnostic approach: poll for a code that the
    -- user copies from the web UI, then claim it.
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

        local placeId   = tostring(game.PlaceId)
        local placeName = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name
                          or "Unnamed Place"

        local ok, data = request("POST", "/api/studio/auth", {
            code          = code,
            placeId       = placeId,
            placeName     = placeName,
            pluginVersion = PLUGIN_VER,
        })

        if ok and data and (data.token or data.sessionToken) then
            sessionToken = data.token or data.sessionToken
            connectionCode = code
            setStatus("Connected — " .. placeName, true)
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
                local ok, runErr = pcall(fn)
                if not ok then
                    warn("[ForjeGames] Script error:", runErr)
                end
            else
                warn("[ForjeGames] Compile error:", compileErr)
            end
        end

    elseif cmdType == "insert_model" then
        local assetId = cmd.data and cmd.data.assetId
        if assetId then
            local ok, inserted = pcall(function()
                return game:GetService("InsertService"):LoadAsset(tonumber(assetId))
            end)
            if ok and inserted then
                inserted.Parent = workspace
                ChangeHistoryService:SetWaypoint("ForjeGames: Insert model " .. tostring(assetId))
            end
        end

    elseif cmdType == "update_property" then
        local data = cmd.data or {}
        local target = workspace:FindFirstChild(data.instancePath or "", true)
        if target then
            local ok, err = pcall(function()
                target[data.property] = data.value
            end)
            if not ok then warn("[ForjeGames] Property error:", err) end
        end

    elseif cmdType == "delete_model" then
        local data = cmd.data or {}
        local target = workspace:FindFirstChild(data.instancePath or "", true)
        if target then
            target:Destroy()
            ChangeHistoryService:SetWaypoint("ForjeGames: Delete")
        end
    end
end

-- ── Sync loop ─────────────────────────────────────────────────────────────────

RunService.Heartbeat:Connect(function()
    if not sessionToken then return end

    local now = tick() * 1000

    -- Heartbeat (every 5 s)
    if now - lastHbAt >= HB_MS then
        lastHbAt = now
        task.spawn(function()
            request("POST", "/api/studio/update", {
                sessionToken  = sessionToken,
                event         = "heartbeat",
                placeId       = tostring(game.PlaceId),
            })
        end)
    end

    -- Command poll (every 1 s)
    if now - lastSyncAt >= POLL_MS then
        lastSyncAt = now
        task.spawn(function()
            local ok, data = request("GET",
                "/api/studio/sync?sessionToken=" .. HttpService:UrlEncode(sessionToken))
            if ok and data and data.commands then
                for _, cmd in ipairs(data.commands) do
                    executeCommand(cmd)
                end
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
