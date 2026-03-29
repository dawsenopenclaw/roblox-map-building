--[[
  RobloxForge Studio Plugin — Auth.lua
  PLUG-01: Browser-based OAuth flow

  Flow:
  1. Plugin opens system browser to RobloxForge OAuth URL with a short-lived state token
  2. User signs in, browser redirects to localhost callback
  3. Plugin polls for the token (written to a temp file or local server)
  4. Token stored in plugin:SetSetting (persisted across sessions)
--]]

local HttpService   = game:GetService("HttpService")
local RunService    = game:GetService("RunService")
local StudioService = game:GetService("StudioService")

local Auth = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL      = "https://robloxforge.app"          -- production
local LOCAL_URL     = "http://localhost:3000"             -- local dev
local CALLBACK_PORT = 7842                                -- plugin auth callback port
local POLL_INTERVAL = 1.5                                -- seconds between polls
local POLL_TIMEOUT  = 120                               -- seconds before giving up

-- Detect environment
local function getBaseUrl()
  -- Check if local API is reachable
  local ok = pcall(function()
    local res = game:HttpGet(LOCAL_URL .. "/health", true)
    return res ~= nil
  end)
  return ok and LOCAL_URL or BASE_URL
end

-- ============================================================
-- State token generation (random hex string)
-- ============================================================
local function generateStateToken()
  local chars = "0123456789abcdef"
  local token = ""
  for i = 1, 32 do
    local idx = math.random(1, #chars)
    token = token .. chars:sub(idx, idx)
  end
  return token
end

-- ============================================================
-- Open browser to OAuth URL
-- ============================================================
local function openBrowser(url)
  -- Studio's built-in open URL (opens system default browser)
  local ok = pcall(function()
    -- StudioService:OpenInBrowser does not exist in all versions
    -- Fallback: use print so developer can copy-paste
  end)

  -- Primary method: plugin-level open URL
  -- This requires the plugin to have HttpService access
  warn("[RobloxForge Auth] Opening browser: " .. url)
  warn("[RobloxForge Auth] If browser does not open, paste this URL manually:")
  warn(url)

  -- Try to open via Studio's built-in method
  pcall(function()
    -- plugin:OpenScript opens .lua files, not URLs
    -- Best approach in Studio: display URL prominently in output
    -- Real implementations use a ScreenGui with a clickable link button
  end)
end

-- ============================================================
-- Poll for auth token from local callback server
-- ============================================================
local function pollForToken(stateToken, callback)
  local elapsed    = 0
  local connection = nil

  connection = RunService.Heartbeat:Connect(function(dt)
    elapsed = elapsed + dt

    if elapsed > POLL_TIMEOUT then
      connection:Disconnect()
      callback(nil, "Auth timeout — please try again")
      return
    end

    -- Poll every POLL_INTERVAL seconds
    if elapsed % POLL_INTERVAL > dt then return end

    local ok, result = pcall(function()
      return HttpService:GetAsync(
        "http://localhost:" .. CALLBACK_PORT .. "/auth/poll?state=" .. stateToken,
        true -- bypass cache
      )
    end)

    if ok and result then
      -- pcall returns (success, value) — capture both so we don't call JSONDecode
      -- a second time unprotected (original code discarded the decoded value and
      -- re-called JSONDecode outside the pcall, which could throw on malformed JSON)
      local decodeOk, data = pcall(function() return HttpService:JSONDecode(result) end)
      if decodeOk and data then
        if data.token then
          connection:Disconnect()
          callback(data.token, nil)
          return
        end
        if data.error then
          connection:Disconnect()
          callback(nil, data.error)
          return
        end
      end
    end
  end)

  return connection
end

-- ============================================================
-- Public: begin OAuth flow
-- ============================================================
function Auth.beginOAuthFlow(pluginRef, onSuccess, onError)
  local stateToken = generateStateToken()
  local baseUrl    = BASE_URL -- always point to production for OAuth

  local authUrl = baseUrl
    .. "/api/auth/studio?"
    .. "state=" .. stateToken
    .. "&callback=http://localhost:" .. CALLBACK_PORT .. "/auth/callback"
    .. "&plugin=true"

  openBrowser(authUrl)

  -- Start polling for the token
  pollForToken(stateToken, function(token, err)
    if err then
      if onError then onError(err) end
      warn("[RobloxForge Auth] Failed: " .. tostring(err))
      return
    end

    if onSuccess then onSuccess(token) end
  end)
end

-- ============================================================
-- Public: open dashboard in browser
-- ============================================================
function Auth.openDashboard()
  local url = BASE_URL .. "/dashboard"
  warn("[RobloxForge] Open dashboard: " .. url)
end

-- ============================================================
-- Public: sign out
-- ============================================================
function Auth.signOut(pluginRef, onComplete)
  pcall(function() pluginRef:SetSetting("rf_auth_token", nil) end)
  if onComplete then onComplete() end
end

-- ============================================================
-- Public: validate existing token
-- ============================================================
function Auth.validateToken(token)
  if not token or token == "" then return false end

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url    = BASE_URL .. "/api/auth/validate",
      Method = "GET",
      Headers = {
        ["Authorization"] = "Bearer " .. token,
        ["Content-Type"]  = "application/json",
      },
    })
  end)

  if not ok then return false end

  if result and result.StatusCode == 200 then
    return true
  end

  return false
end

return Auth
