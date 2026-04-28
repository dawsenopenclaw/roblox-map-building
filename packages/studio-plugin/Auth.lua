--[[
  ForjeGames Studio Plugin — Auth.lua

  Simple 6-character code auth flow:
  1. User visits forjegames.com/editor → sees a 6-character code
  2. User enters the code in the plugin TextBox
  3. Plugin POSTs /api/studio/auth with { code }
  4. Server returns { token, sessionId, expiresAt }
  5. Token stored via plugin:SetSetting (persisted across Studio sessions)
--]]

local HttpService = game:GetService("HttpService")

local Auth = {}

-- ============================================================
-- Config
-- ============================================================
local BASE_URL          = "https://forjegames.com"
local HTTP_TIMEOUT_SECS = 10   -- seconds before we treat a request as failed
local CODE_LENGTH       = 6

-- Base URL accessor — always use production URL for distributed plugin.
-- Dev override: set ForjeGames_DevUrl via plugin:SetSetting() to point
-- to a local server (e.g. "http://localhost:3000") without editing code.
local _baseUrl = nil
local function getBaseUrl()
  if _baseUrl then return _baseUrl end
  pcall(function()
    local devUrl = plugin and plugin:GetSetting("ForjeGames_DevUrl")
    if devUrl and type(devUrl) == "string" and #devUrl > 0 then
      _baseUrl = devUrl
    end
  end)
  if not _baseUrl then _baseUrl = BASE_URL end
  return _baseUrl
end

-- ============================================================
-- Internal: classify an HTTP pcall error string
-- Returns "http_disabled" | "dns_failure" | "unreachable" | "timeout" | "unknown"
-- ============================================================
local function classifyNetworkError(errStr)
  errStr = tostring(errStr):lower()
  if errStr:find("not enabled") or errStr:find("http requests") then
    return "http_disabled"
  end
  if errStr:find("dns") or errStr:find("resolve") or errStr:find("lookup") then
    return "dns_failure"
  end
  if errStr:find("timeout") or errStr:find("timed out") then
    return "timeout"
  end
  if errStr:find("refused") or errStr:find("unreachable") or errStr:find("connect") then
    return "unreachable"
  end
  return "unknown"
end

-- ============================================================
-- Internal: perform a POST with a manual timeout guard.
-- Roblox's HttpService doesn't expose a timeout parameter, so we
-- race the request against a task.delay that resolves a shared flag.
-- In practice Studio's HTTP layer enforces ~30s — 10s is our UI guard.
-- ============================================================
local function requestWithTimeout(opts)
  local result   = nil
  local errStr   = nil
  local done     = false

  task.spawn(function()
    local ok, res = pcall(function()
      return HttpService:RequestAsync(opts)
    end)
    if not done then
      done   = true
      if ok then
        result = res
      else
        errStr = tostring(res)
      end
    end
  end)

  -- Poll until done or timeout
  local elapsed = 0
  local POLL    = 0.1
  while not done and elapsed < HTTP_TIMEOUT_SECS do
    task.wait(POLL)
    elapsed = elapsed + POLL
  end

  if not done then
    done   = true  -- signal the spawned thread to discard its result
    return nil, "timeout"
  end

  if errStr then
    return nil, classifyNetworkError(errStr)
  end

  return result, nil
end

-- ============================================================
-- Public: exchange a 6-character code for a session token
-- callback(token, sessionId, err)
-- ============================================================
function Auth.exchangeCode(code, pluginRef, callback)
  -- Client-side length validation with helpful character count
  local trimmed = (code or ""):gsub("%s+", ""):upper()
  if #trimmed < CODE_LENGTH then
    local msg = "Code must be " .. CODE_LENGTH .. " characters"
    if #trimmed > 0 then
      msg = msg .. " (you entered " .. #trimmed .. ")"
    end
    callback(nil, nil, msg)
    return
  end

  -- Run in a separate thread so we don't block the heartbeat
  task.spawn(function()
    local url = getBaseUrl() .. "/api/studio/auth"

    local encoded
    local encOk = pcall(function()
      -- Include pluginVersion so the JWT has the correct version embedded.
      -- Sync.PLUGIN_VERSION is the canonical version string; fall back to
      -- a hardcoded value if Sync hasn't been loaded yet.
      local pv = "4.8.0"
      pcall(function()
        local syncMod = script and script.Parent and script.Parent:FindFirstChild("Sync")
        if syncMod then
          local s = require(syncMod)
          if s and s.PLUGIN_VERSION then pv = s.PLUGIN_VERSION end
        end
      end)
      encoded = HttpService:JSONEncode({
        code          = trimmed,
        placeId       = tostring(game.PlaceId),
        placeName     = game.Name ~= "" and game.Name or tostring(game.PlaceId),
        pluginVersion = pv,
      })
    end)
    if not encOk then
      callback(nil, nil, "Failed to encode request")
      return
    end

    local result, netErr = requestWithTimeout({
      Url    = url,
      Method = "POST",
      Headers = {
        ["Content-Type"] = "application/json",
      },
      Body   = encoded,
    })

    -- Network-layer errors
    if netErr == "http_disabled" then
      callback(nil, nil, "Enable HTTP Requests in Game Settings > Security")
      return
    end

    if netErr == "dns_failure" then
      callback(nil, nil, "DNS resolution failed — check your internet connection")
      return
    end

    if netErr == "timeout" then
      callback(nil, nil, "Request timed out — server took too long to respond")
      return
    end

    if netErr == "unreachable" or not result then
      callback(nil, nil, "Could not reach ForjeGames. Check your internet and try again.")
      return
    end

    -- HTTP-level errors
    local status = result.StatusCode

    if status == 200 then
      local decodeOk, data = pcall(function()
        return HttpService:JSONDecode(result.Body)
      end)
      if decodeOk and data and data.token then
        pcall(function() pluginRef:SetSetting("fj_auth_token",  data.token)           end)
        pcall(function() pluginRef:SetSetting("fj_session_id",  data.sessionId or "") end)
        callback(data.token, data.sessionId, nil)
      else
        callback(nil, nil, "Invalid response from server")
      end

    elseif status == 400 then
      callback(nil, nil, "Invalid or expired code. Get a fresh code from forjegames.com/editor")

    elseif status == 403 then
      callback(nil, nil, "Enable HTTP Requests in Game Settings > Security")

    elseif status == 429 then
      callback(nil, nil, "Too many attempts. Wait a moment and try again.")

    else
      callback(nil, nil, "Server error (" .. tostring(status) .. "). Try again shortly.")
    end
  end)
end

-- ============================================================
-- Public: validate an existing stored token
-- Returns true/false (runs synchronously via task.spawn caller — fine for startup)
-- ============================================================
function Auth.validateToken(token, callback)
  if not token or token == "" then
    if callback then callback(false) end
    return
  end

  task.spawn(function()
    local result, netErr = requestWithTimeout({
      Url    = getBaseUrl() .. "/api/studio/auth/validate",
      Method = "GET",
      Headers = {
        ["Authorization"] = "Bearer " .. token,
        ["Content-Type"]  = "application/json",
      },
    })

    local valid = (result ~= nil and result.StatusCode == 200)
    if callback then callback(valid) end
  end)
end

-- ============================================================
-- Public: sign out — clears stored credentials
-- ============================================================
function Auth.signOut(pluginRef, onComplete)
  pcall(function() pluginRef:SetSetting("fj_auth_token", nil) end)
  pcall(function() pluginRef:SetSetting("fj_session_id", nil) end)
  if onComplete then onComplete() end
end

-- ============================================================
-- Public: open dashboard URL (prints to Output for now)
-- ============================================================
function Auth.openDashboard()
  local url = BASE_URL .. "/dashboard"
  print("[ForjeGames] Open dashboard: " .. url)
  warn("[ForjeGames] Copy the URL above and paste into your browser")
end

-- ============================================================
-- Public: open settings page so user can get a fresh code
-- ============================================================
function Auth.openCodePage()
  local url = BASE_URL .. "/settings/studio"
  print("[ForjeGames] Get your connection code at: " .. url)
  warn("[ForjeGames] Copy the URL above and paste into your browser")
end

return Auth
