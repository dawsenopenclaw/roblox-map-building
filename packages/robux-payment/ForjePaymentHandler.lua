--[[
    ForjeGames Payment Handler

    Place this Script inside ServerScriptService in your Roblox experience.
    Handles GamePass purchases and sends confirmations to the ForjeGames webhook.

    GamePass IDs:
      Starter: 1795991901
      Creator: 1797335797
      Studio:  1797299731
]]

local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

-- Configuration
local WEBHOOK_URL = "https://forjegames.com/api/webhooks/roblox"
local WEBHOOK_SECRET = "" -- Set this to your ROBUX_WEBHOOK_SECRET value

-- GamePass ID to tier mapping
local GAMEPASS_TIERS = {
    [1795991901] = "starter",
    [1797335797] = "pro",      -- Creator tier maps to "pro" in the API
    [1797299731] = "studio",
}

-- All GamePass IDs for ownership checks
local ALL_GAMEPASS_IDS = {1795991901, 1797335797, 1797299731}

-- Send purchase confirmation to ForjeGames server
local function sendPurchaseWebhook(player, tier, gamePassId)
    local success, err = pcall(function()
        local payload = HttpService:JSONEncode({
            type = "gamepass_purchase",
            robloxUserId = player.UserId,
            robloxUsername = player.Name,
            tier = tier,
            gamePassId = gamePassId,
            purchaseId = tostring(player.UserId) .. "_" .. tostring(gamePassId) .. "_" .. tostring(os.time()),
            timestamp = os.time(),
        })

        HttpService:PostAsync(WEBHOOK_URL, payload, Enum.HttpContentType.ApplicationJson, false, {
            ["Content-Type"] = "application/json",
            ["x-roblox-webhook-secret"] = WEBHOOK_SECRET,
        })
    end)

    if success then
        print("[ForjeGames] Purchase confirmed for", player.Name, "- tier:", tier)
    else
        warn("[ForjeGames] Failed to send webhook for", player.Name, ":", err)
        -- Retry once after 5 seconds
        task.delay(5, function()
            local retrySuccess, retryErr = pcall(function()
                local payload = HttpService:JSONEncode({
                    type = "gamepass_purchase",
                    robloxUserId = player.UserId,
                    robloxUsername = player.Name,
                    tier = tier,
                    gamePassId = gamePassId,
                    purchaseId = tostring(player.UserId) .. "_" .. tostring(gamePassId) .. "_" .. tostring(os.time()),
                    timestamp = os.time(),
                })

                HttpService:PostAsync(WEBHOOK_URL, payload, Enum.HttpContentType.ApplicationJson, false, {
                    ["Content-Type"] = "application/json",
                    ["x-roblox-webhook-secret"] = WEBHOOK_SECRET,
                })
            end)

            if retrySuccess then
                print("[ForjeGames] Retry succeeded for", player.Name)
            else
                warn("[ForjeGames] Retry also failed for", player.Name, ":", retryErr)
            end
        end)
    end
end

-- Handle GamePass purchases
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
    if not wasPurchased then return end

    local tier = GAMEPASS_TIERS[gamePassId]
    if not tier then
        warn("[ForjeGames] Unknown GamePass purchased:", gamePassId)
        return
    end

    print("[ForjeGames] GamePass purchased!", player.Name, "bought", tier, "(ID:", gamePassId, ")")
    sendPurchaseWebhook(player, tier, gamePassId)
end)

-- Check for existing GamePass ownership when player joins
-- (handles cases where they bought it outside the game)
Players.PlayerAdded:Connect(function(player)
    for _, gpId in ipairs(ALL_GAMEPASS_IDS) do
        local owns = false
        pcall(function()
            owns = MarketplaceService:UserOwnsGamePassAsync(player.UserId, gpId)
        end)

        if owns then
            local tier = GAMEPASS_TIERS[gpId]
            print("[ForjeGames]", player.Name, "already owns", tier, "GamePass")
            -- Send webhook in case it wasn't processed before
            sendPurchaseWebhook(player, tier, gpId)
        end
    end
end)

-- Show a welcome message
Players.PlayerAdded:Connect(function(player)
    task.delay(2, function()
        -- You can customize this or remove it
        print("[ForjeGames] Welcome", player.Name, "to the ForjeGames payment hub!")
    end)
end)

print("[ForjeGames] Payment handler loaded - watching for GamePass purchases")
