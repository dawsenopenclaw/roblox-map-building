--[[
  ForjeGames Studio Plugin — Auth.lua

  Simple 6-character code auth flow:
  1. User visits forjegames.com/settings/studio → sees a 6-character code
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
local BASE_URL   = "https://forjegames.com"
local LOCAL_URL  = "http://localhost:3000"

-- Detect environment: prefer local dev server if reachable
local _baseUrl = nil
local function getBaseUrl()
  if _baseUrl then return _baseUrl end
  local ok = pcall(function()
    local res = HttpService:RequestAsync({
      Url    = LOCAL_URL .. "/api/health",
      Method = "GET",
    })
    if res and res.StatusCode and res.StatusCode < 500 then
      _baseUrl = LOCAL_URL
    end
  end)
  if not _baseUrl then _baseUrl = BASE_URL end
  return _baseUrl
end

-- ============================================================
-- Public: exchange a 6-character code for a session token
-- callback(token, sessionId, err)
-- ============================================================
function Auth.exchangeCode(code, pluginRef, callback)
  if not code or #code < 6 then
    callback(nil, nil, "Please enter the 6-character code from forjegames.com/settings/studio")
    return
  end

  -- Run in a separate thread so we don't block the heartbeat
  task.spawn(function()
    local url = getBaseUrl() .. "/api/studio/auth"

    local encoded
    local encOk = pcall(function()
      encoded = HttpService:JSONEncode({ code = code:upper():gsub("%s+", "") })
    end)
    if not encOk then
      callback(nil, nil, "Failed to encode request")
      return
    end

    local ok, result = pcall(function()
      return HttpService:RequestAsync({
        Url    = url,
        Method = "POST",
        Headers = {
          ["Content-Type"] = "application/json",
        },
        Body   = encoded,
      })
    end)

    if not ok or not result then
      callback(nil, nil, "Could not reach ForjeGames. Check your internet and try again.")
      return
    end

    local status = result.StatusCode

    if status == 200 then
      local decodeOk, data = pcall(function()
        return HttpService:JSONDecode(result.Body)
      end)
      if decodeOk and data and data.token then
        -- Persist token
        pcall(function() pluginRef:SetSetting("fj_auth_token",   data.token)    end)
        pcall(function() pluginRef:SetSetting("fj_session_id",   data.sessionId or "") end)
        callback(data.token, data.sessionId, nil)
      else
        callback(nil, nil, "Invalid response from server")
      end

    elseif status == 400 then
      callback(nil, nil, "Invalid or expired code. Get a fresh code from forjegames.com/settings/studio")

    elseif status == 429 then
      callback(nil, nil, "Too many attempts. Wait a moment and try again.")

    else
      callback(nil, nil, "Server error (" .. tostring(status) .. "). Try again shortly.")
    end
  end)
end

-- ============================================================
-- Public: validate an existing stored token
-- Returns true/false (synchronous pcall — fine for startup)
-- ============================================================
function Auth.validateToken(token)
  if not token or token == "" then return false end

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url    = getBaseUrl() .. "/api/studio/auth/validate",
      Method = "GET",
      Headers = {
        ["Authorization"] = "Bearer " .. token,
        ["Content-Type"]  = "application/json",
      },
    })
  end)

  if not ok or not result then return false end
  return result.StatusCode == 200
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
-- Public: open dashboard URL (prints to Output for now;
-- future: plugin:OpenBrowserWindow when Roblox exposes it)
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
