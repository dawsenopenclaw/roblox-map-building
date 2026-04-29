// Auto-generated knowledge file — DO NOT EDIT MANUALLY
// Crawled: Roblox Docs — GamePasses, Developer Products, Subscriptions,
//          Performance Optimization, Streaming, Teleporting, TextChatService
// Date: 2026-04-29

export const MONETIZATION_PERFORMANCE = `
=== ROBLOX MONETIZATION & PERFORMANCE KNOWLEDGE BASE ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GAME PASSES — ONE-TIME PURCHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use for: permanent perks, VIP areas, cosmetics, permanent power-ups.
NOT for: consumables (use Developer Products instead).

Roblox does NOT store pass purchase history — track it yourself via DataStore.

KEY API: MarketplaceService

-- Check ownership on player join (ServerScript in ServerScriptService):
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local PASS_ID = 000000  -- replace with your pass ID

local function grantPassPerks(player)
  local success, hasPass = pcall(function()
    return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
  end)
  if not success then
    warn("GamePass check failed for", player.Name)
    return
  end
  if hasPass then
    -- grant VIP perks, open doors, give items, etc.
    player:SetAttribute("IsVIP", true)
  end
end

Players.PlayerAdded:Connect(grantPassPerks)

-- Prompt purchase (LocalScript or via RemoteEvent from server):
local function promptPassPurchase()
  local player = Players.LocalPlayer
  local success, hasPass = pcall(function()
    return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
  end)
  if success and not hasPass then
    MarketplaceService:PromptGamePassPurchase(player, PASS_ID)
  end
end

-- Handle purchase completion (ServerScript — fires server-side):
MarketplaceService.PromptGamePassPurchaseFinished:Connect(
  function(player, purchasedPassID, purchaseSuccess)
    if purchaseSuccess and purchasedPassID == PASS_ID then
      -- Grant perks immediately without waiting for rejoin
      player:SetAttribute("IsVIP", true)
    end
  end
)

-- Get pass product info (for displaying price in shop UI):
local success, info = pcall(function()
  return MarketplaceService:GetProductInfo(PASS_ID, Enum.InfoType.GamePass)
end)
if success and info then
  print(info.Name, info.PriceInRobux, info.Description)
  local isForSale = info.IsForSale
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. DEVELOPER PRODUCTS — REPEATABLE PURCHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use for: coins, gems, health potions, ammo, any consumable item.
Players can buy the same product multiple times.

CRITICAL RULES:
  1. ProcessReceipt MUST be set in a SERVER script (ServerScriptService)
  2. Return PurchaseGranted ONLY after successfully granting the item
  3. Return NotProcessedYet to retry on next session (Roblox will retry)
  4. NEVER duplicate grants — check if already processed for this receipt
  5. Use DataStore to record processed PurchaseIds to prevent duplicates

-- Prompt a purchase (LocalScript):
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local PRODUCT_ID = 000000

MarketplaceService:PromptProductPurchase(Players.LocalPlayer, PRODUCT_ID)

-- COMPLETE ProcessReceipt handler (ServerScript in ServerScriptService):
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local purchaseHistory = DataStoreService:GetDataStore("PurchaseHistory")

-- Map product IDs to handler functions
local productHandlers = {}

productHandlers[111111] = function(player)
  -- Grant 100 coins
  local leaderstats = player:FindFirstChild("leaderstats")
  local coins = leaderstats and leaderstats:FindFirstChild("Coins")
  if coins then
    coins.Value += 100
    return true
  end
  return false
end

productHandlers[222222] = function(player)
  -- Restore full health
  local character = player.Character
  local humanoid = character and character:FindFirstChildWhichIsA("Humanoid")
  if humanoid and humanoid.Health > 0 then
    humanoid.Health = humanoid.MaxHealth
    return true
  end
  return false
end

productHandlers[333333] = function(player)
  -- Grant speed boost for 30 seconds
  local character = player.Character
  local humanoid = character and character:FindFirstChildWhichIsA("Humanoid")
  if humanoid then
    humanoid.WalkSpeed = 32
    task.delay(30, function()
      if humanoid and humanoid.Parent then
        humanoid.WalkSpeed = 16
      end
    end)
    return true
  end
  return false
end

-- THE RECEIPT HANDLER — set exactly once on server startup:
local function processReceipt(receiptInfo)
  -- receiptInfo fields:
  --   PlayerId     : number  — buyer's UserId
  --   ProductId    : number  — product identifier
  --   PurchaseId   : string  — unique receipt ID (use for dedup)
  --   CurrencySpent: number  — exact Robux paid
  --   PlaceIdWherePurchased: number

  local userId    = receiptInfo.PlayerId
  local productId = receiptInfo.ProductId
  local purchaseId = receiptInfo.PurchaseId

  -- Duplicate prevention via DataStore:
  local historyKey = "purchase_" .. purchaseId
  local alreadyProcessed = false
  local dsSuccess = pcall(function()
    alreadyProcessed = purchaseHistory:GetAsync(historyKey) == true
  end)
  if alreadyProcessed then
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  -- Find the player (may have left the server):
  local player = Players:GetPlayerByUserId(userId)
  if not player then
    -- Player offline — retry next session
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  -- Run the product handler:
  local handler = productHandlers[productId]
  if not handler then
    warn("No handler for product:", productId)
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  local handlerSuccess, granted = pcall(handler, player)
  if handlerSuccess and granted then
    -- Record as processed to prevent duplicate grants:
    pcall(function()
      purchaseHistory:SetAsync(historyKey, true)
    end)
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- MUST assign — only one ProcessReceipt per server:
MarketplaceService.ProcessReceipt = processReceipt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. SUBSCRIPTIONS — AUTO-RENEWING MONTHLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use for: monthly VIP, recurring currency bonus, ongoing perks.
Auto-renews monthly. Benefit ends when subscription lapses.

Revenue: 70% payout every month (Robux), or 70% first month /
         100% subsequent months (local currency, after 30-day hold).

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local SUBSCRIPTION_ID = "EXP-00000000"  -- from Creator Dashboard

-- Check status on player join (SERVER ONLY):
local function checkSubscription(player)
  local success, result = pcall(function()
    return MarketplaceService:GetUserSubscriptionStatusAsync(player, SUBSCRIPTION_ID)
  end)
  if success and result.IsSubscribed then
    -- Grant subscriber perks
    player:SetAttribute("IsSubscriber", true)
  end
end

Players.PlayerAdded:Connect(checkSubscription)

-- Listen for real-time status changes:
Players.UserSubscriptionStatusChanged:Connect(function(player, subscriptionId)
  if subscriptionId == SUBSCRIPTION_ID then
    local success, result = pcall(function()
      return MarketplaceService:GetUserSubscriptionStatusAsync(player, SUBSCRIPTION_ID)
    end)
    if success then
      player:SetAttribute("IsSubscriber", result.IsSubscribed)
    end
  end
end)

-- Prompt subscription (CLIENT ONLY — LocalScript):
local function promptSubscription()
  MarketplaceService:PromptSubscriptionPurchase(Players.LocalPlayer, SUBSCRIPTION_ID)
end

-- Handle purchase completion (client-side):
MarketplaceService.PromptSubscriptionPurchaseFinished:Connect(
  function(player, subscriptionId, didSubscribe)
    if didSubscribe then
      -- Verify server-side before granting perks
    end
  end
)

-- Get subscription product info (for UI display):
local success, info = pcall(function()
  return MarketplaceService:GetSubscriptionProductInfoAsync(SUBSCRIPTION_ID)
end)
-- info contains: Name, Description, price details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PERSONALIZED PRODUCT RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Rank products for this specific player (improves conversion):
task.spawn(function()
  local identifiers = {
    {InfoType = Enum.InfoType.GamePass, Id = PASS_ID},
    {InfoType = Enum.InfoType.Product,  Id = PRODUCT_ID},
  }
  local success, ranked = pcall(function()
    return MarketplaceService:RankProductsAsync(identifiers)
  end)
  if success then
    -- Show ranked[1] first in shop UI
  end
end)

-- Get top recommended products:
task.spawn(function()
  local success, top = pcall(function()
    return MarketplaceService:RecommendTopProductsAsync(
      {Enum.InfoType.GamePass, Enum.InfoType.Product}
    )
  end)
  -- Requires at least 1 sale in last 28 days to activate
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. PERFORMANCE OPTIMIZATION — SCRIPTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TARGET: 60 FPS (1 frame = 16.67ms)

SCRIPT COMPUTATION:
  - Limit RunService connections to only what NEEDS per-frame updates
  - Use task.wait() to spread expensive work across multiple frames
  - Enable native code generation on performance-critical server scripts:
    --!native  (top of script, enables Luau → machine code compilation)
  - Use task.spawn() / task.defer() for non-urgent work
  - Prefer table lookups over repeated string comparisons
  - Cache service references at top of scripts, never inside loops

-- BAD: runs every frame, expensive
RunService.Heartbeat:Connect(function()
  for _, v in pairs(workspace:GetChildren()) do
    -- expensive search
  end
end)

-- GOOD: throttled with counter
local frameCount = 0
RunService.Heartbeat:Connect(function()
  frameCount += 1
  if frameCount % 10 == 0 then  -- every 10 frames
    -- do the work
  end
end)

MEMORY LEAK PREVENTION:
  - Store connections and disconnect on cleanup:
    local conn = event:Connect(handler)
    -- later:
    conn:Disconnect()
  - Destroy instances: instance:Destroy()
  - Enable Workspace.PlayerCharacterDestroyBehavior = true
  - Clear table entries: table[key] = nil
  - Cleanup animation metadata after rig import

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. PERFORMANCE OPTIMIZATION — PHYSICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Anchor ALL parts that don't move: part.Anchored = true
  - Use Adaptive physics stepping (default) not fixed 240Hz
  - Minimize constraints and joints in assemblies
  - Disable collision on non-interactive parts:
      part.CanCollide = false
      part.CanTouch   = false
      part.CanQuery   = false

COLLISION FIDELITY BY SIZE:
  - Small objects:  CollisionFidelity = Box
  - Medium objects: CollisionFidelity = Hull
  - Large complex:  Build invisible box colliders manually

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PERFORMANCE OPTIMIZATION — RENDERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DRAW CALL REDUCTION:
  - Identical meshes MUST share the same MeshContent ID for GPU instancing
  - Import assets individually (not full maps) to allow deduplication
  - Use Packages for reusable objects

SHADOW OPTIMIZATION:
  - Disable CastShadow on small parts: part.CastShadow = false
  - Disable shadows on frequently moving objects
  - Reduce light range and count (each light = draw call cost)

RENDER FIDELITY (MeshPart property):
  - Automatic: engine decides based on distance (recommended)
  - Performance: always use simplified mesh
  - Precise: always full detail (avoid for background objects)

TRANSPARENCY: avoid multiple overlapping transparent parts
  - Each layer = additional render pass
  - Use single transparent surface or texture alpha instead

TEXTURE SIZES:
  - Large screen elements: max 512x512
  - Small/minor UI: 256x256 or smaller
  - Resolution = VRAM cost (disk compression doesn't help)
  - Use sprite sheets with ImageRectOffset/ImageRectSize for UI icons

PARTICLES & DECALS: do not batch well — use sparingly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. PERFORMANCE OPTIMIZATION — NETWORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Send RemoteEvents only when data CHANGES, not every frame
  - Throttle input-driven RemoteEvent calls (debounce pattern)
  - Send minimal data: purchased item ID only, not full inventory
  - Chunk large instance trees across multiple frames
  - Create VFX client-side, NOT server-side (no replication cost)
  - Render first-person view models on client only
  - Tween objects CLIENT-SIDE — server just sets final position

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. INSTANCE STREAMING (StreamingEnabled)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

StreamingEnabled dynamically loads/unloads workspace content based on
player position. Improves join time, memory, and render performance.

ENABLE: Studio → Workspace → StreamingEnabled = true
CANNOT be set in script — Studio property only.

KEY PROPERTIES:
  Workspace.StreamingMinRadius    — priority zone (higher = more memory)
  Workspace.StreamingTargetRadius — max stream distance (smaller = better perf)
  Workspace.StreamOutBehavior:
    LowMemory    — only removes when memory is tight (default)
    Opportunistic — aggressively removes beyond target radius

MODEL STREAMING MODES (per Model instance):
  Nonatomic   — parts stream independently (default)
  Atomic      — whole model streams as one unit
  Persistent  — streams in fully right after join, NEVER streams out
  PersistentPerPlayer — Persistent for specific players, Atomic for rest

IMPORTANT GOTCHAS:
  - Streamed-out instances parent to nil (NOT destroyed) — Luau state preserved
  - Local-only property changes are LOST when instance streams out and back
  - Physics assemblies stream in as COMPLETE units
  - Anchored assemblies only stream parts within radius
  - Client-created instances exempt from streaming unless parented under server objects
  - Minimize use of Persistent mode — it defeats streaming benefits

-- Request streaming around a point (useful for loading cutscenes):
local function preloadArea(position)
  workspace:RequestStreamAroundAsync(position, 5)  -- 5s timeout
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. TELEPORTING BETWEEN PLACES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TeleportService:TeleportAsync() — SERVER SIDE ONLY

-- Basic teleport (single or multiple players):
local TeleportService = game:GetService("TeleportService")
local TARGET_PLACE_ID = 12345678901234

local function teleportPlayer(player)
  local success, err = pcall(function()
    TeleportService:TeleportAsync(TARGET_PLACE_ID, {player})
  end)
  if not success then
    warn("Teleport failed:", err)
  end
end

-- Teleport with options:
local options = Instance.new("TeleportOptions")
options.ShouldReserveServer = true  -- create new private server

local success, teleportResult = pcall(function()
  return TeleportService:TeleportAsync(TARGET_PLACE_ID, {player}, options)
end)
if success then
  -- teleportResult.PrivateServerId for reserved server
end

-- Target a specific server by instance ID:
options.ServerInstanceId = "existing-server-id"

-- Target a reserved server:
options.ReservedServerAccessCode = "access-code"

-- PASSING DATA BETWEEN PLACES:
-- Sender (server):
local data = { level = 5, inventory = {"sword", "shield"}, score = 1000 }
local opts = Instance.new("TeleportOptions")
opts:SetTeleportData(data)
TeleportService:TeleportAsync(TARGET_PLACE_ID, {player}, opts)

-- Receiver (server, in destination place):
local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
  local joinData = player:GetJoinData()
  local teleportData = joinData.TeleportData
  if teleportData then
    print("Player arrived with level:", teleportData.level)
  end
end)

-- Handle teleport failures:
TeleportService.TeleportInitFailed:Connect(function(player, teleportResult, errorMessage)
  warn(player.Name, "teleport failed:", teleportResult, errorMessage)
  -- Retry or show UI message
end)

SECURITY SETTINGS (Creator Dashboard):
  - Access Control for Places: restrict non-start place joins
  - Allow Third Party Teleports: controls teleports to other experiences

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. TEXTCHATSERVICE — IN-EXPERIENCE CHAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TextChatService replaces legacy chat system.
Handles filtering, moderation, and permissions automatically.

KEY CLASSES:
  TextChatService   — singleton, main service
  TextChannel       — a chat channel (parented to TextChatService)
  TextSource        — user in a channel (created automatically)
  TextChatMessage   — a message object (sender, text, filtered text, timestamp)
  TextChatCommand   — slash command definition

DEFAULT CHANNELS (when CreateDefaultTextChannels = true):
  RBXGeneral  — all players
  RBXSystem   — system messages only

-- Send a system message to all players:
local TextChatService = game:GetService("TextChatService")
local systemChannel = TextChatService:FindFirstChild("RBXSystem")
if systemChannel then
  systemChannel:DisplaySystemMessage("Welcome to the game!")
end

-- Send message in general (LocalScript):
local generalChannel = TextChatService:WaitForChild("RBXGeneral")
generalChannel:SendAsync("Hello world!")

-- Receive and format messages (CLIENT — LocalScript):
TextChatService.OnIncomingMessage = function(message)
  local props = Instance.new("TextChatMessageProperties")
  -- Add custom prefix (e.g., VIP badge):
  if message.TextSource then
    local player = game.Players:GetPlayerByUserId(message.TextSource.UserId)
    if player and player:GetAttribute("IsVIP") then
      props.PrefixText = '<font color="#FFD700">[VIP]</font> ' .. (message.PrefixText or "")
    end
  end
  return props  -- returning nil uses default formatting
end

-- Per-channel formatting (CLIENT):
local generalChannel = TextChatService:WaitForChild("RBXGeneral")
generalChannel.OnIncomingMessage = function(message)
  local props = Instance.new("TextChatMessageProperties")
  props.Text = "[General] " .. message.Text
  return props
end

-- Control WHO receives messages (SERVER only):
generalChannel.ShouldDeliverCallback = function(message, textSource)
  -- Example: proximity chat — deliver only to nearby players
  local sender = game.Players:GetPlayerByUserId(textSource.UserId)
  if not sender or not sender.Character then return false end
  -- Return true to deliver, false to block
  return true
end

CRITICAL: All callbacks must be NON-YIELDING.
Never use task.wait() or :WaitForChild() inside any callback — it blocks chat.

-- Custom slash command (SERVER or CLIENT):
local TextChatService = game:GetService("TextChatService")
local cmd = Instance.new("TextChatCommand")
cmd.Name = "SpeedCommand"
cmd.PrimaryAlias = "/speed"
cmd.SecondaryAlias = "/s"
cmd.Parent = TextChatService

cmd.Triggered:Connect(function(originTextSource, unfilteredText)
  -- unfilteredText is the full message including command
  local args = unfilteredText:split(" ")
  local speed = tonumber(args[2]) or 16
  local player = game.Players:GetPlayerByUserId(originTextSource.UserId)
  if player and player.Character then
    local hum = player.Character:FindFirstChildWhichIsA("Humanoid")
    if hum then hum.WalkSpeed = math.clamp(speed, 0, 100) end
  end
end)

-- Disable default chat UI:
local TextChatService = game:GetService("TextChatService")
TextChatService.ChatWindowConfiguration.Enabled = false
TextChatService.ChatInputBarConfiguration.Enabled = false

-- Legacy migration:
-- OLD: Players:Chat(player, message, color)  →  NEW: channel:SendAsync(message)
-- OLD: chat callbacks  →  NEW: OnIncomingMessage
-- OLD: command modules →  NEW: TextChatCommand instances

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. ASSET PRELOADING & LOAD TIMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Only preload ESSENTIAL assets: loading screen images, spawn zone content
  - NEVER preload entire Workspace
  - Provide "Skip Loading" button for large asset loads

local ContentProvider = game:GetService("ContentProvider")

-- Preload specific assets:
local assetsToPreload = {
  game.ReplicatedStorage.LoadingBackground,
  game.ReplicatedStorage.SpawnZoneModel,
}
ContentProvider:PreloadAsync(assetsToPreload, function(asset, status)
  -- status is Enum.AssetFetchStatus
  if status == Enum.AssetFetchStatus.Failure then
    warn("Failed to preload:", asset)
  end
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. QUICK REFERENCE — COMMON MONETIZATION BUGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUG: Duplicate item grants on reconnect
FIX: Store PurchaseId in DataStore before returning PurchaseGranted

BUG: ProcessReceipt never fires
FIX: Script must be in ServerScriptService, not LocalScript or workspace

BUG: Player bought but perks not applied until rejoin
FIX: Wire PromptGamePassPurchaseFinished to grant immediately on server

BUG: Subscription check fails with "must run on server"
FIX: GetUserSubscriptionStatusAsync is SERVER-ONLY, never call from LocalScript

BUG: PromptProductPurchase doesn't open
FIX: Must be called from LocalScript or via RemoteEvent to client

BUG: UserOwnsGamePassAsync throttled/failing
FIX: Wrap in pcall() always; add exponential backoff retry on failure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. QUICK REFERENCE — PERFORMANCE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All static parts Anchored = true
□ CanCollide/CanTouch/CanQuery = false on non-interactive parts
□ Identical meshes share MeshContent IDs
□ Shadows disabled on small parts (CastShadow = false)
□ RenderFidelity = Automatic on distant/background meshes
□ No per-frame RunService loops doing heavy work
□ RemoteEvents throttled (not fired every frame)
□ VFX created client-side only (no server replication)
□ NPC animations played client-side
□ Unused HumanoidStateTypes disabled on NPCs
□ Event connections disconnected when no longer needed
□ StreamingEnabled ON for large open-world maps
□ Texture sizes ≤ 512x512 for large elements, ≤ 256x256 for minor
□ No excessive overlapping transparent parts
`;
