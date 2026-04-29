// ═══ LUAU TEMPLATES EXPANDED — 25 new game system templates ═══
// Generated for ForjeGames Build Engine
// Each exported function returns a complete, runnable Luau code string.

// ── Sanitisation helpers ────────────────────────────────────────────────────

function safe(val: string): string {
  return String(val).replace(/[^a-zA-Z0-9_ ]/g, '').slice(0, 64)
}
function safeLuauString(val: string): string {
  return String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 200)
}
function num(v: number, min = 0, max = 1e9): number {
  return Math.max(min, Math.min(max, Math.floor(v)))
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUCTION HOUSE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface AuctionHouseParams {
  currency?: string
  listingFeePercent?: number
  defaultDurationSeconds?: number
  maxListingsPerPlayer?: number
}

export function auctionHouseSystem(params: AuctionHouseParams): string {
  const currency = safe(params.currency ?? 'Coins')
  const fee = Math.max(0, Math.min(50, Math.floor(params.listingFeePercent ?? 5)))
  const duration = Math.max(60, Math.floor(params.defaultDurationSeconds ?? 3600))
  const maxListings = Math.max(1, Math.floor(params.maxListingsPerPlayer ?? 5))

  return `-- ══ Auction House System (ServerScriptService) ══
-- Currency: ${currency} | Fee: ${fee}% | Duration: ${duration}s | MaxListings: ${maxListings}
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local auctionStore = DataStoreService:GetDataStore("AuctionHouse_v1")
local CURRENCY = "${currency}"
local LISTING_FEE_PERCENT = ${fee}
local DEFAULT_DURATION = ${duration}
local MAX_LISTINGS_PER_PLAYER = ${maxListings}

-- In-memory auction table: [listingId] = {sellerId, itemName, qty, startBid, buyout, highBid, highBidder, expireAt}
local auctions: {[string]: any} = {}
local nextId = 1

-- RemoteEvents / RemoteFunctions
local RF = ReplicatedStorage:FindFirstChild("AuctionRF") or Instance.new("RemoteFunction")
RF.Name = "AuctionRF"
RF.Parent = ReplicatedStorage

local RE = ReplicatedStorage:FindFirstChild("AuctionRE") or Instance.new("RemoteEvent")
RE.Name = "AuctionRE"
RE.Parent = ReplicatedStorage

-- Helper: get player wallet via EconomyAPI (assumes economySystem is loaded)
local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
local function getBalance(player: Player): number
  if not economyAPI then return 0 end
  return economyAPI:Invoke("get", player, CURRENCY, 0) or 0
end
local function charge(player: Player, amount: number): boolean
  if not economyAPI then return false end
  return economyAPI:Invoke("spend", player, CURRENCY, amount) == true
end
local function credit(player: Player, amount: number)
  if economyAPI then economyAPI:Invoke("add", player, CURRENCY, amount) end
end

-- Notify all clients of auction state change
local function broadcast(eventName: string, data: any)
  RE:FireAllClients(eventName, data)
end

-- Create a new listing
local function createListing(seller: Player, itemName: string, qty: number, startBid: number, buyout: number): (boolean, string)
  local sellerId = seller.UserId
  -- Count current listings for this player
  local count = 0
  for _, listing in auctions do
    if listing.sellerId == sellerId then count += 1 end
  end
  if count >= MAX_LISTINGS_PER_PLAYER then
    return false, "Max listings reached"
  end
  -- Charge listing fee on buyout price
  local fee = math.floor(buyout * LISTING_FEE_PERCENT / 100)
  if fee > 0 and not charge(seller, fee) then
    return false, "Cannot afford listing fee of " .. fee .. " " .. CURRENCY
  end
  local id = "AUC_" .. nextId
  nextId += 1
  auctions[id] = {
    listingId = id,
    sellerId = sellerId,
    sellerName = seller.Name,
    itemName = itemName,
    qty = qty,
    startBid = startBid,
    buyout = buyout,
    highBid = 0,
    highBidderId = 0,
    highBidderName = "",
    expireAt = os.time() + DEFAULT_DURATION,
    active = true,
  }
  -- Persist
  pcall(function() auctionStore:SetAsync(id, auctions[id]) end)
  broadcast("ListingCreated", auctions[id])
  return true, id
end

-- Place a bid
local function placeBid(bidder: Player, listingId: string, amount: number): (boolean, string)
  local listing = auctions[listingId]
  if not listing or not listing.active then return false, "Listing not found" end
  if os.time() >= listing.expireAt then return false, "Auction expired" end
  if bidder.UserId == listing.sellerId then return false, "Cannot bid on own listing" end
  if amount <= listing.highBid or amount < listing.startBid then
    return false, "Bid too low. Current: " .. listing.highBid
  end
  if not charge(bidder, amount) then return false, "Insufficient " .. CURRENCY end
  -- Refund previous high bidder
  if listing.highBidderId ~= 0 then
    local prev = Players:GetPlayerByUserId(listing.highBidderId)
    if prev then
      credit(prev, listing.highBid)
    else
      -- Queue refund for offline player via DataStore
      pcall(function()
        local refundKey = "Refund_" .. listing.highBidderId
        local existing = auctionStore:GetAsync(refundKey) or 0
        auctionStore:SetAsync(refundKey, existing + listing.highBid)
      end)
    end
  end
  listing.highBid = amount
  listing.highBidderId = bidder.UserId
  listing.highBidderName = bidder.Name
  pcall(function() auctionStore:SetAsync(listingId, listing) end)
  broadcast("BidPlaced", { listingId = listingId, bid = amount, bidder = bidder.Name })
  -- Auto-buyout check
  if amount >= listing.buyout then
    finalizeListing(listingId, true)
  end
  return true, "Bid placed"
end

-- Finalize (expire or buyout)
function finalizeListing(listingId: string, isBuyout: boolean)
  local listing = auctions[listingId]
  if not listing or not listing.active then return end
  listing.active = false
  local seller = Players:GetPlayerByUserId(listing.sellerId)
  if listing.highBidderId ~= 0 then
    -- Winner gets item delivered (via MailSystem or direct inventory grant)
    local winner = Players:GetPlayerByUserId(listing.highBidderId)
    if seller then credit(seller, listing.highBid) end
    -- Deliver item to winner
    if winner then
      -- Fire item delivery event (inventory system hooks into this)
      RE:FireClient(winner, "ItemDelivered", { itemName = listing.itemName, qty = listing.qty })
    else
      -- Store pending delivery
      pcall(function()
        auctionStore:SetAsync("Delivery_" .. listing.highBidderId, {
          itemName = listing.itemName, qty = listing.qty
        })
      end)
    end
    broadcast("AuctionWon", { listingId = listingId, winner = listing.highBidderName, price = listing.highBid })
  else
    -- No bids — return item to seller
    if seller then
      RE:FireClient(seller, "ItemDelivered", { itemName = listing.itemName, qty = listing.qty })
    end
    broadcast("AuctionExpired", { listingId = listingId })
  end
  pcall(function() auctionStore:SetAsync(listingId, listing) end)
  auctions[listingId] = nil
end

-- Poll expirations every 10 seconds
task.spawn(function()
  while true do
    task.wait(10)
    local now = os.time()
    for id, listing in auctions do
      if listing.active and now >= listing.expireAt then
        finalizeListing(id, false)
      end
    end
  end
end)

-- Load active listings from DataStore on startup
task.spawn(function()
  -- In a real setup you'd page through the store; here we rely on in-memory for session
  print("[AuctionHouse] System online. Max listings per player: ${maxListings}")
end)

-- RPC handler
RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  if action == "list" then
    local itemName, qty, startBid, buyout = args[1], args[2], args[3], args[4]
    if type(itemName) ~= "string" or type(qty) ~= "number" then return false, "Bad args" end
    return createListing(player, itemName, math.max(1,math.floor(qty)), math.max(1,math.floor(startBid or 1)), math.max(1,math.floor(buyout or startBid*2 or 2)))
  elseif action == "bid" then
    local listingId, amount = args[1], args[2]
    if type(listingId) ~= "string" or type(amount) ~= "number" then return false, "Bad args" end
    return placeBid(player, listingId, math.floor(amount))
  elseif action == "getAll" then
    local result = {}
    for id, listing in auctions do
      if listing.active then table.insert(result, listing) end
    end
    return result
  elseif action == "cancel" then
    local listingId = args[1]
    local listing = auctions[listingId]
    if not listing or listing.sellerId ~= player.UserId then return false, "Not your listing" end
    if listing.highBidderId ~= 0 then return false, "Cannot cancel — bids placed" end
    finalizeListing(listingId, false)
    return true, "Cancelled"
  end
  return false, "Unknown action"
end

-- Deliver pending items when a player joins
Players.PlayerAdded:Connect(function(player: Player)
  task.wait(3) -- wait for inventory to load
  local key = "Delivery_" .. player.UserId
  local ok, delivery = pcall(function() return auctionStore:GetAsync(key) end)
  if ok and delivery and delivery.itemName then
    RE:FireClient(player, "ItemDelivered", delivery)
    pcall(function() auctionStore:RemoveAsync(key) end)
  end
  local refundKey = "Refund_" .. player.UserId
  local ok2, refund = pcall(function() return auctionStore:GetAsync(refundKey) end)
  if ok2 and type(refund) == "number" and refund > 0 then
    credit(player, refund)
    pcall(function() auctionStore:RemoveAsync(refundKey) end)
    RE:FireClient(player, "Notification", { text = "Auction refund received: " .. refund .. " " .. CURRENCY, color = "green" })
  end
end)

print("[AuctionHouse] Initialized")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GUILD SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface GuildSystemParams {
  maxMembers?: number
  bankCurrency?: string
  ranks?: string[]
}

export function guildSystem(params: GuildSystemParams): string {
  const maxMembers = num(params.maxMembers ?? 30, 2, 200)
  const currency = safe(params.bankCurrency ?? 'Coins')
  const ranks = (params.ranks ?? ['Leader', 'Officer', 'Member']).map(safe)

  return `-- ══ Guild System (ServerScriptService) ══
-- MaxMembers: ${maxMembers} | Currency: ${currency} | Ranks: ${ranks.join(', ')}
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local guildStore = DataStoreService:GetDataStore("GuildSystem_v1")
local MAX_MEMBERS = ${maxMembers}
local BANK_CURRENCY = "${currency}"
local RANKS = { ${ranks.map(r => `"${r}"`).join(', ')} }
local RANK_LEADER = RANKS[1]
local RANK_OFFICER = RANKS[2] or RANKS[1]
local RANK_MEMBER = RANKS[#RANKS]

-- guild data shape: { name, tag, leaderId, members: [{userId, name, rank}], bank, upgrades, createdAt }
local guilds: {[string]: any} = {}           -- guildName → guildData
local playerGuild: {[number]: string} = {}    -- userId → guildName

local RF = Instance.new("RemoteFunction")
RF.Name = "GuildRF"
RF.Parent = ReplicatedStorage

local RE = Instance.new("RemoteEvent")
RE.Name = "GuildRE"
RE.Parent = ReplicatedStorage

local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
local function charge(player: Player, amount: number): boolean
  if not economyAPI then return false end
  return economyAPI:Invoke("spend", player, BANK_CURRENCY, amount) == true
end
local function credit(player: Player, amount: number)
  if economyAPI then economyAPI:Invoke("add", player, BANK_CURRENCY, amount) end
end

local function saveGuild(guildName: string)
  pcall(function()
    guildStore:SetAsync("guild_" .. guildName, guilds[guildName])
  end)
end

local function loadPlayerGuildOnJoin(player: Player)
  local ok, guildName = pcall(function()
    return guildStore:GetAsync("playerGuild_" .. player.UserId)
  end)
  if ok and type(guildName) == "string" and guilds[guildName] then
    playerGuild[player.UserId] = guildName
    RE:FireClient(player, "GuildUpdate", guilds[guildName])
  end
end

local function getMemberRank(guildData: any, userId: number): string?
  for _, m in ipairs(guildData.members) do
    if m.userId == userId then return m.rank end
  end
  return nil
end

local function hasPermission(guildData: any, userId: number, minRank: string): boolean
  local rank = getMemberRank(guildData, userId)
  if not rank then return false end
  for i, r in ipairs(RANKS) do
    if r == rank then
      for j, mr in ipairs(RANKS) do
        if mr == minRank then return i <= j end
      end
    end
  end
  return false
end

-- Broadcast guild update to all online members
local function broadcastGuildUpdate(guildData: any)
  for _, m in ipairs(guildData.members) do
    local p = Players:GetPlayerByUserId(m.userId)
    if p then RE:FireClient(p, "GuildUpdate", guildData) end
  end
end

-- Create guild
local function createGuild(player: Player, name: string, tag: string): (boolean, string)
  if playerGuild[player.UserId] then return false, "Already in a guild" end
  local cleanName = name:match("^[%a%d_ ]+$") and name:sub(1,24) or nil
  if not cleanName then return false, "Invalid guild name" end
  if guilds[cleanName] then return false, "Name taken" end
  local guildData = {
    name = cleanName,
    tag = tag:sub(1,4):upper(),
    leaderId = player.UserId,
    members = {{ userId = player.UserId, name = player.Name, rank = RANK_LEADER }},
    bank = 0,
    upgrades = {},
    createdAt = os.time(),
    motd = "Welcome to " .. cleanName,
  }
  guilds[cleanName] = guildData
  playerGuild[player.UserId] = cleanName
  saveGuild(cleanName)
  pcall(function() guildStore:SetAsync("playerGuild_" .. player.UserId, cleanName) end)
  RE:FireClient(player, "GuildUpdate", guildData)
  return true, cleanName
end

-- Invite player
local function invitePlayer(inviter: Player, targetName: string): (boolean, string)
  local guildName = playerGuild[inviter.UserId]
  if not guildName then return false, "Not in a guild" end
  local guildData = guilds[guildName]
  if not hasPermission(guildData, inviter.UserId, RANK_OFFICER) then return false, "No permission" end
  if #guildData.members >= MAX_MEMBERS then return false, "Guild is full" end
  local target = Players:FindFirstChild(targetName) :: Player?
  if not target then return false, "Player not online" end
  if playerGuild[target.UserId] then return false, "Player already in a guild" end
  RE:FireClient(target, "GuildInvite", { guildName = guildName, inviterName = inviter.Name })
  return true, "Invite sent to " .. targetName
end

-- Accept invite
local function acceptInvite(player: Player, guildName: string): (boolean, string)
  if playerGuild[player.UserId] then return false, "Already in a guild" end
  local guildData = guilds[guildName]
  if not guildData then return false, "Guild not found" end
  if #guildData.members >= MAX_MEMBERS then return false, "Guild full" end
  table.insert(guildData.members, { userId = player.UserId, name = player.Name, rank = RANK_MEMBER })
  playerGuild[player.UserId] = guildName
  saveGuild(guildName)
  pcall(function() guildStore:SetAsync("playerGuild_" .. player.UserId, guildName) end)
  broadcastGuildUpdate(guildData)
  return true, "Joined " .. guildName
end

-- Leave guild
local function leaveGuild(player: Player): (boolean, string)
  local guildName = playerGuild[player.UserId]
  if not guildName then return false, "Not in a guild" end
  local guildData = guilds[guildName]
  if guildData.leaderId == player.UserId and #guildData.members > 1 then
    return false, "Transfer leadership before leaving"
  end
  for i, m in ipairs(guildData.members) do
    if m.userId == player.UserId then
      table.remove(guildData.members, i)
      break
    end
  end
  playerGuild[player.UserId] = nil
  if #guildData.members == 0 then
    guilds[guildName] = nil
    pcall(function() guildStore:RemoveAsync("guild_" .. guildName) end)
  else
    saveGuild(guildName)
    broadcastGuildUpdate(guildData)
  end
  pcall(function() guildStore:RemoveAsync("playerGuild_" .. player.UserId) end)
  RE:FireClient(player, "GuildUpdate", nil)
  return true, "Left guild"
end

-- Deposit to bank
local function depositBank(player: Player, amount: number): (boolean, string)
  local guildName = playerGuild[player.UserId]
  if not guildName then return false, "Not in a guild" end
  if not charge(player, amount) then return false, "Insufficient funds" end
  local guildData = guilds[guildName]
  guildData.bank += amount
  saveGuild(guildName)
  broadcastGuildUpdate(guildData)
  return true, "Deposited " .. amount
end

-- Withdraw from bank (officer+)
local function withdrawBank(player: Player, amount: number): (boolean, string)
  local guildName = playerGuild[player.UserId]
  if not guildName then return false, "Not in a guild" end
  local guildData = guilds[guildName]
  if not hasPermission(guildData, player.UserId, RANK_OFFICER) then return false, "No permission" end
  if guildData.bank < amount then return false, "Insufficient guild bank funds" end
  guildData.bank -= amount
  credit(player, amount)
  saveGuild(guildName)
  broadcastGuildUpdate(guildData)
  return true, "Withdrew " .. amount
end

RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  if action == "create" then return createGuild(player, tostring(args[1] or ""), tostring(args[2] or ""))
  elseif action == "invite" then return invitePlayer(player, tostring(args[1] or ""))
  elseif action == "accept" then return acceptInvite(player, tostring(args[1] or ""))
  elseif action == "leave" then return leaveGuild(player)
  elseif action == "deposit" then return depositBank(player, math.max(1, math.floor(tonumber(args[1]) or 0)))
  elseif action == "withdraw" then return withdrawBank(player, math.max(1, math.floor(tonumber(args[1]) or 0)))
  elseif action == "getMyGuild" then
    local gn = playerGuild[player.UserId]
    return gn and guilds[gn] or nil
  elseif action == "setMotd" then
    local gn = playerGuild[player.UserId]
    if not gn then return false, "Not in guild" end
    local gd = guilds[gn]
    if not hasPermission(gd, player.UserId, RANK_OFFICER) then return false, "No permission" end
    gd.motd = tostring(args[1] or ""):sub(1, 128)
    saveGuild(gn)
    broadcastGuildUpdate(gd)
    return true, "MOTD updated"
  end
  return false, "Unknown action"
end

Players.PlayerAdded:Connect(loadPlayerGuildOnJoin)
Players.PlayerRemoving:Connect(function(player: Player)
  playerGuild[player.UserId] = nil
end)

print("[GuildSystem] Initialized. Max members: ${maxMembers}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GACHA EGG SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface GachaEggParams {
  eggName?: string
  currency?: string
  eggCost?: number
  rarities?: Array<{ name: string; weight: number; pets: string[] }>
  pityAt?: number
}

export function gachaEggSystem(params: GachaEggParams): string {
  const eggName = safe(params.eggName ?? 'BasicEgg')
  const currency = safe(params.currency ?? 'Coins')
  const cost = num(params.eggCost ?? 100, 1)
  const pity = num(params.pityAt ?? 50, 5, 1000)
  const rarities = params.rarities ?? [
    { name: 'Common', weight: 60, pets: ['Cat', 'Dog'] },
    { name: 'Rare', weight: 30, pets: ['Dragon', 'Phoenix'] },
    { name: 'Legendary', weight: 10, pets: ['GoldenUnicorn'] },
  ]

  const rarityTable = rarities.map(r =>
    `  { name = "${safe(r.name)}", weight = ${num(r.weight,1)}, pets = { ${r.pets.map(p=>`"${safe(p)}"`).join(', ')} } },`
  ).join('\n')

  return `-- ══ Gacha Egg System (ServerScriptService) ══
-- Egg: ${eggName} | Cost: ${cost} ${currency} | Pity: ${pity}
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local eggStore = DataStoreService:GetDataStore("GachaEggs_v1")
local EGG_NAME = "${eggName}"
local EGG_COST = ${cost}
local CURRENCY = "${currency}"
local PITY_THRESHOLD = ${pity}

-- Rarity table: lower index = better (pity targets index 1)
local RARITIES = {
${rarityTable}
}

-- Compute total weight
local TOTAL_WEIGHT = 0
for _, r in ipairs(RARITIES) do TOTAL_WEIGHT += r.weight end

local RF = Instance.new("RemoteFunction")
RF.Name = "GachaRF"
RF.Parent = ReplicatedStorage

local RE = Instance.new("RemoteEvent")
RE.Name = "GachaRE"
RE.Parent = ReplicatedStorage

-- Per-player pity counter and owned pets (dupe protection)
local playerData: {[number]: { pity: number, owned: {[string]: number} }} = {}

local function loadData(player: Player)
  local ok, data = pcall(function()
    return eggStore:GetAsync("egg_" .. player.UserId)
  end)
  if ok and type(data) == "table" then
    playerData[player.UserId] = data
  else
    playerData[player.UserId] = { pity = 0, owned = {} }
  end
end

local function saveData(player: Player)
  local d = playerData[player.UserId]
  if not d then return end
  pcall(function()
    eggStore:SetAsync("egg_" .. player.UserId, d)
  end)
end

local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
local function charge(player: Player, amount: number): boolean
  if not economyAPI then return false end
  return economyAPI:Invoke("spend", player, CURRENCY, amount) == true
end

-- Roll rarity with pity system
local function rollRarity(pityCount: number): any
  -- If pity threshold reached, force best rarity
  if pityCount >= PITY_THRESHOLD then
    return RARITIES[1]
  end
  -- Weighted random roll
  local roll = math.random(1, TOTAL_WEIGHT)
  local cumulative = 0
  for _, rarity in ipairs(RARITIES) do
    cumulative += rarity.weight
    if roll <= cumulative then
      return rarity
    end
  end
  return RARITIES[#RARITIES]
end

-- Select pet from rarity (dupe protection: prefer unowned)
local function selectPet(rarity: any, owned: {[string]: number}): string
  local unowned = {}
  for _, pet in ipairs(rarity.pets) do
    if not owned[pet] or owned[pet] == 0 then
      table.insert(unowned, pet)
    end
  end
  local pool = #unowned > 0 and unowned or rarity.pets
  return pool[math.random(1, #pool)]
end

-- Hatch an egg
local function hatchEgg(player: Player, count: number): (boolean, any)
  count = math.min(count, 10) -- max 10 at once
  if not playerData[player.UserId] then return false, "Data not loaded" end
  local totalCost = EGG_COST * count
  if not charge(player, totalCost) then
    return false, "Insufficient " .. CURRENCY .. " (need " .. totalCost .. ")"
  end
  local d = playerData[player.UserId]
  local results = {}
  for i = 1, count do
    d.pity += 1
    local rarity = rollRarity(d.pity)
    local pet = selectPet(rarity, d.owned)
    d.owned[pet] = (d.owned[pet] or 0) + 1
    if rarity == RARITIES[1] then d.pity = 0 end -- reset on best rarity
    table.insert(results, { pet = pet, rarity = rarity.name, dupCount = d.owned[pet] - 1 })
  end
  saveData(player)
  -- Fire hatch animation event to client
  RE:FireClient(player, "HatchResult", results)
  return true, results
end

RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  if action == "hatch" then
    local count = math.max(1, math.floor(tonumber(args[1]) or 1))
    return hatchEgg(player, count)
  elseif action == "getInventory" then
    local d = playerData[player.UserId]
    return d and d.owned or {}
  elseif action == "getPity" then
    local d = playerData[player.UserId]
    return d and d.pity or 0
  end
  return false, "Unknown action"
end

Players.PlayerAdded:Connect(function(player: Player)
  task.spawn(loadData, player)
end)
Players.PlayerRemoving:Connect(function(player: Player)
  saveData(player)
  playerData[player.UserId] = nil
end)

-- ── CLIENT SCRIPT (LocalScript inside StarterPlayerScripts) ──
--[[
  local RE = game:GetService("ReplicatedStorage"):WaitForChild("GachaRE")
  local RF = game:GetService("ReplicatedStorage"):WaitForChild("GachaRF")
  local TweenService = game:GetService("TweenService")
  local Players = game:GetService("Players")

  RE.OnClientEvent:Connect(function(event, data)
    if event == "HatchResult" then
      -- Show hatch animation for each result
      for i, result in ipairs(data) do
        task.delay(i * 0.8, function()
          -- Create billboard / screen GUI popup
          local gui = Players.LocalPlayer.PlayerGui:FindFirstChild("HatchGui")
          if gui then
            local label = gui:FindFirstChild("PetLabel")
            if label then
              label.Text = result.pet .. "\\n(" .. result.rarity .. ")"
              -- Pop-in tween
              label.Size = UDim2.new(0,0,0,0)
              local tween = TweenService:Create(label,
                TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
                { Size = UDim2.new(0.3,0,0.1,0) }
              )
              tween:Play()
            end
          end
        end)
      end
    end
  end)
]]

print("[GachaEgg] System initialized. Egg: ${eggName}, Cost: ${cost} ${currency}, Pity: ${pity}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TOWER DEFENSE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface TowerDefenseSystemParams {
  currency?: string
  livesStart?: number
  waveCount?: number
  towers?: Array<{ name: string; cost: number; damage: number; range: number; fireRate: number }>
  enemies?: Array<{ name: string; health: number; speed: number; reward: number }>
}

export function towerDefenseSystem(params: TowerDefenseSystemParams): string {
  const currency = safe(params.currency ?? 'Coins')
  const lives = num(params.livesStart ?? 20, 1, 100)
  const waves = num(params.waveCount ?? 10, 1, 100)
  const towers = params.towers ?? [
    { name: 'BasicTower', cost: 50, damage: 10, range: 20, fireRate: 1 },
    { name: 'SniperTower', cost: 150, damage: 50, range: 60, fireRate: 0.5 },
    { name: 'CannonTower', cost: 200, damage: 30, range: 25, fireRate: 1.5 },
  ]
  const enemies = params.enemies ?? [
    { name: 'BasicEnemy', health: 100, speed: 12, reward: 10 },
    { name: 'FastEnemy', health: 50, speed: 25, reward: 15 },
    { name: 'BossEnemy', health: 2000, speed: 8, reward: 100 },
  ]

  const towerDefs = towers.map(t =>
    `  ["${safe(t.name)}"] = { cost=${num(t.cost,1)}, damage=${num(t.damage,1)}, range=${num(t.range,1)}, fireRate=${Math.max(0.1,t.fireRate)} },`
  ).join('\n')
  const enemyDefs = enemies.map(e =>
    `  ["${safe(e.name)}"] = { health=${num(e.health,1)}, speed=${num(e.speed,1)}, reward=${num(e.reward,0)} },`
  ).join('\n')

  return `-- ══ Tower Defense System (ServerScriptService) ══
-- Lives: ${lives} | Waves: ${waves} | Currency: ${currency}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local PathfindingService = game:GetService("PathfindingService")

-- ── Config ──
local CURRENCY = "${currency}"
local STARTING_LIVES = ${lives}
local WAVE_COUNT = ${waves}
local WAVE_DELAY = 15  -- seconds between waves
local ENEMY_SPAWN_INTERVAL = 0.8

local TOWER_DEFS: {[string]: any} = {
${towerDefs}
}

local ENEMY_DEFS: {[string]: any} = {
${enemyDefs}
}

-- Targeting modes
local TARGETING = { FIRST = "first", STRONGEST = "strongest", CLOSEST = "closest" }

-- ── State ──
local gameState = { lives = STARTING_LIVES, wave = 0, active = false, enemies = {} }
local towers: {any} = {}     -- list of { model, config, targetMode, level, nextFireAt }
local path: {Vector3} = {}   -- waypoints from PathStart to PathEnd in workspace

-- ── RemoteEvents ──
local RE = Instance.new("RemoteEvent")
RE.Name = "TDEvent"
RE.Parent = ReplicatedStorage

local RF = Instance.new("RemoteFunction")
RF.Name = "TDRF"
RF.Parent = ReplicatedStorage

local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
local function charge(player: Player, amount: number): boolean
  if not economyAPI then return false end
  return economyAPI:Invoke("spend", player, CURRENCY, amount) == true
end
local function credit(player: Player, amount: number)
  if economyAPI then economyAPI:Invoke("add", player, CURRENCY, amount) end
end

-- ── Path loading ──
local function loadPath()
  local pathFolder = workspace:FindFirstChild("TDPath")
  if not pathFolder then
    warn("[TowerDefense] No TDPath folder found in workspace. Create Parts named 1,2,3... in a folder called TDPath.")
    return
  end
  path = {}
  local i = 1
  while true do
    local wp = pathFolder:FindFirstChild(tostring(i))
    if not wp then break end
    table.insert(path, wp.Position)
    i += 1
  end
  print("[TowerDefense] Path loaded with " .. #path .. " waypoints")
end

-- ── Enemy logic ──
local function spawnEnemy(enemyType: string): Model?
  local def = ENEMY_DEFS[enemyType]
  if not def or #path < 2 then return nil end

  local model = Instance.new("Model")
  model.Name = enemyType

  local body = Instance.new("Part")
  body.Name = "HumanoidRootPart"
  body.Size = Vector3.new(2, 3, 2)
  body.Material = Enum.Material.Metal
  body.Color = Color3.fromRGB(200, 50, 50)
  body.CFrame = CFrame.new(path[1])
  body.Parent = model

  local hum = Instance.new("Humanoid")
  hum.MaxHealth = def.health
  hum.Health = def.health
  hum.WalkSpeed = def.speed
  hum.Parent = model

  -- Health bar billboard
  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(4, 0, 0.5, 0)
  billboard.StudsOffset = Vector3.new(0, 3, 0)
  billboard.AlwaysOnTop = false
  billboard.Parent = body

  local bar = Instance.new("Frame")
  bar.Name = "HealthBar"
  bar.Size = UDim2.new(1, 0, 1, 0)
  bar.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
  bar.Parent = billboard

  model.Parent = workspace
  model.PrimaryPart = body

  local enemyData = {
    model = model,
    hum = hum,
    pathIndex = 2,
    reward = def.reward,
    speed = def.speed,
    alive = true,
  }
  table.insert(gameState.enemies, enemyData)

  -- Death handler
  hum.Died:Connect(function()
    enemyData.alive = false
    -- Reward all players split equally
    local playerList = Players:GetPlayers()
    local share = math.max(1, math.floor(def.reward / math.max(1, #playerList)))
    for _, p in ipairs(playerList) do
      credit(p, share)
    end
    RE:FireAllClients("EnemyKilled", { name = enemyType, reward = def.reward })
    task.delay(0.5, function()
      model:Destroy()
    end)
  end)

  -- Walk along path using TweenService
  task.spawn(function()
    for i = 2, #path do
      if not enemyData.alive or not model.Parent then return end
      local dist = (path[i] - body.Position).Magnitude
      local travelTime = dist / def.speed
      local tween = TweenService:Create(body,
        TweenInfo.new(travelTime, Enum.EasingStyle.Linear),
        { Position = path[i] }
      )
      tween:Play()
      tween.Completed:Wait()
      enemyData.pathIndex = i + 1
    end
    -- Reached end: lose a life
    if enemyData.alive and model.Parent then
      enemyData.alive = false
      model:Destroy()
      gameState.lives = math.max(0, gameState.lives - 1)
      RE:FireAllClients("LivesUpdate", gameState.lives)
      if gameState.lives <= 0 then
        RE:FireAllClients("GameOver", { wave = gameState.wave })
        gameState.active = false
      end
    end
  end)

  return model
end

-- ── Tower targeting ──
local function getTarget(tower: any): any?
  local towerPos = tower.model.PrimaryPart and tower.model.PrimaryPart.Position or Vector3.zero
  local range = tower.config.range
  local best = nil
  local bestVal = -math.huge

  for _, e in ipairs(gameState.enemies) do
    if e.alive and e.model.Parent and e.hum.Health > 0 then
      local ePart = e.model.PrimaryPart or e.model:FindFirstChildWhichIsA("BasePart")
      if ePart then
        local dist = (ePart.Position - towerPos).Magnitude
        if dist <= range then
          local val
          if tower.targetMode == TARGETING.FIRST then
            val = e.pathIndex
          elseif tower.targetMode == TARGETING.STRONGEST then
            val = e.hum.Health
          else -- CLOSEST
            val = -dist
          end
          if val > bestVal then bestVal = val; best = e end
        end
      end
    end
  end
  return best
end

local function fireTower(tower: any, target: any)
  local towerPart = tower.model.PrimaryPart
  local targetPart = target.model.PrimaryPart
  if not towerPart or not targetPart then return end

  -- Visual projectile
  local bullet = Instance.new("Part")
  bullet.Name = "Bullet"
  bullet.Size = Vector3.new(0.3, 0.3, 0.3)
  bullet.Material = Enum.Material.Neon
  bullet.Color = Color3.fromRGB(255, 255, 0)
  bullet.CanCollide = false
  bullet.Anchored = true
  bullet.CFrame = towerPart.CFrame
  bullet.Parent = workspace

  local travelTime = 0.15
  TweenService:Create(bullet,
    TweenInfo.new(travelTime, Enum.EasingStyle.Linear),
    { Position = targetPart.Position }
  ):Play()

  task.delay(travelTime, function()
    bullet:Destroy()
    if target.alive and target.hum.Health > 0 then
      target.hum:TakeDamage(tower.config.damage)
      -- Update health bar
      local bar = target.model:FindFirstChildWhichIsA("BillboardGui") and
                  target.model:FindFirstChildWhichIsA("BillboardGui"):FindFirstChild("HealthBar")
      if bar then
        bar.Size = UDim2.new(target.hum.Health / target.hum.MaxHealth, 0, 1, 0)
      end
    end
  end)
end

-- ── Tower placement ──
local function placeTower(player: Player, towerType: string, position: Vector3, targetMode: string): (boolean, string)
  if not gameState.active then return false, "Game not started" end
  local def = TOWER_DEFS[towerType]
  if not def then return false, "Unknown tower type" end
  if not charge(player, def.cost) then
    return false, "Need " .. def.cost .. " " .. CURRENCY
  end

  local model = Instance.new("Model")
  model.Name = towerType

  local base = Instance.new("Part")
  base.Name = "Base"
  base.Size = Vector3.new(4, 1, 4)
  base.Material = Enum.Material.Concrete
  base.Color = Color3.fromRGB(100, 100, 130)
  base.Anchored = true
  base.Position = position
  base.Parent = model

  local barrel = Instance.new("Part")
  barrel.Name = "Barrel"
  barrel.Size = Vector3.new(0.5, 0.5, 3)
  barrel.Material = Enum.Material.Metal
  barrel.Color = Color3.fromRGB(60, 60, 60)
  barrel.Anchored = true
  barrel.Position = position + Vector3.new(0, 2, 0)
  barrel.Parent = model

  model.PrimaryPart = base
  model.Parent = workspace

  local towerData = {
    model = model,
    config = def,
    targetMode = targetMode or TARGETING.FIRST,
    level = 1,
    nextFireAt = 0,
    ownerId = player.UserId,
  }
  table.insert(towers, towerData)

  -- Range indicator (temporary)
  RE:FireClient(player, "TowerPlaced", { type = towerType, pos = position })
  return true, "Tower placed"
end

-- ── Wave spawner ──
local function runWave(waveNumber: number)
  RE:FireAllClients("WaveStart", waveNumber)
  -- Scale enemy count and type by wave
  local enemyTypes = {}
  local baseCount = 5 + waveNumber * 3
  for i = 1, baseCount do
    local idx
    if waveNumber >= 5 and i == baseCount then
      idx = 3 -- boss on last spawn of wave 5+
    elseif waveNumber >= 3 then
      idx = math.random(1, math.min(2, #ENEMY_DEFS))
    else
      idx = 1
    end
    local names = {}
    for n in pairs(ENEMY_DEFS) do table.insert(names, n) end
    table.insert(enemyTypes, names[math.min(idx, #names)])
  end

  for _, etype in ipairs(enemyTypes) do
    if not gameState.active then break end
    spawnEnemy(etype)
    task.wait(ENEMY_SPAWN_INTERVAL)
  end

  -- Wait until all enemies dead or game over
  task.spawn(function()
    local timeout = 120
    local elapsed = 0
    while gameState.active and elapsed < timeout do
      task.wait(1)
      elapsed += 1
      local anyAlive = false
      for _, e in ipairs(gameState.enemies) do
        if e.alive then anyAlive = true; break end
      end
      if not anyAlive then break end
    end
    -- Clean dead entries
    local alive = {}
    for _, e in ipairs(gameState.enemies) do
      if e.alive then table.insert(alive, e) end
    end
    gameState.enemies = alive

    if gameState.active then
      RE:FireAllClients("WaveComplete", waveNumber)
      if waveNumber >= WAVE_COUNT then
        RE:FireAllClients("Victory", { waves = WAVE_COUNT })
        gameState.active = false
      else
        task.wait(WAVE_DELAY)
        gameState.wave += 1
        runWave(gameState.wave)
      end
    end
  end)
end

-- ── Tower attack loop ──
RunService.Heartbeat:Connect(function()
  if not gameState.active then return end
  local now = tick()
  for _, tower in ipairs(towers) do
    if now >= tower.nextFireAt then
      local target = getTarget(tower)
      if target then
        fireTower(tower, target)
        tower.nextFireAt = now + (1 / tower.config.fireRate)
      end
    end
  end
end)

-- ── RPC ──
RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  if action == "start" then
    if gameState.active then return false, "Already running" end
    gameState = { lives = STARTING_LIVES, wave = 1, active = true, enemies = {} }
    towers = {}
    loadPath()
    RE:FireAllClients("GameStart", { lives = STARTING_LIVES, waves = WAVE_COUNT })
    task.spawn(runWave, 1)
    return true, "Game started"
  elseif action == "placeTower" then
    local ttype = tostring(args[1] or "")
    local pos = args[2] -- Vector3
    local mode = tostring(args[3] or TARGETING.FIRST)
    if not pos then return false, "No position" end
    return placeTower(player, ttype, pos, mode)
  elseif action == "getState" then
    return { lives = gameState.lives, wave = gameState.wave, active = gameState.active }
  elseif action == "getTowerDefs" then
    return TOWER_DEFS
  end
  return false, "Unknown action"
end

print("[TowerDefense] System initialized. Waves: ${waves}, Lives: ${lives}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RACING CHECKPOINT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface RacingCheckpointParams {
  laps?: number
  checkpointCount?: number
  currency?: string
  firstPlaceReward?: number
}

export function racingCheckpointSystem(params: RacingCheckpointParams): string {
  const laps = num(params.laps ?? 3, 1, 20)
  const checkpoints = num(params.checkpointCount ?? 6, 2, 50)
  const currency = safe(params.currency ?? 'Coins')
  const reward = num(params.firstPlaceReward ?? 500, 0)

  return `-- ══ Racing Checkpoint System (ServerScriptService) ══
-- Laps: ${laps} | Checkpoints: ${checkpoints} | Reward: ${reward} ${currency}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local TOTAL_LAPS = ${laps}
local CHECKPOINT_COUNT = ${checkpoints}
local CURRENCY = "${currency}"
local FIRST_PLACE_REWARD = ${reward}

-- RemoteEvents
local RE = Instance.new("RemoteEvent")
RE.Name = "RacingRE"
RE.Parent = ReplicatedStorage

-- Per-player race state
local racerData: {[number]: { lap: number, checkpoint: number, startTime: number, finished: boolean, finishTime: number? }} = {}
local finishOrder: {number} = {}
local raceActive = false

local function getCheckpoints(): {BasePart}
  local folder = workspace:FindFirstChild("RaceCheckpoints")
  if not folder then
    warn("[Racing] Create a folder named RaceCheckpoints in workspace with Parts named 1, 2, 3...")
    return {}
  end
  local cps = {}
  for i = 1, CHECKPOINT_COUNT do
    local cp = folder:FindFirstChild(tostring(i))
    if cp and cp:IsA("BasePart") then
      table.insert(cps, cp)
    end
  end
  return cps
end

local function getPositions(): {any}
  local list = {}
  for userId, data in racerData do
    local progress = (data.lap - 1) * CHECKPOINT_COUNT + data.checkpoint
    local player = Players:GetPlayerByUserId(userId)
    table.insert(list, {
      userId = userId,
      name = player and player.Name or "Unknown",
      lap = data.lap,
      checkpoint = data.checkpoint,
      progress = progress,
      finished = data.finished,
    })
  end
  table.sort(list, function(a, b)
    if a.finished ~= b.finished then return a.finished end
    return a.progress > b.progress
  end)
  for i, entry in ipairs(list) do entry.position = i end
  return list
end

local checkpoints: {BasePart} = {}
local checkpointConnections: {RBXScriptConnection} = {}

local function setupCheckpointTriggers()
  checkpoints = getCheckpoints()
  -- Disconnect old
  for _, conn in ipairs(checkpointConnections) do conn:Disconnect() end
  checkpointConnections = {}

  for i, cp in ipairs(checkpoints) do
    local conn = cp.Touched:Connect(function(hit)
      local char = hit.Parent
      local player = Players:GetPlayerFromCharacter(char)
      if not player then return end
      local data = racerData[player.UserId]
      if not data or data.finished then return end
      -- Must hit checkpoints in order
      local expectedCP = (data.checkpoint % CHECKPOINT_COUNT) + 1
      if i ~= expectedCP then return end

      data.checkpoint = i

      -- Check for lap completion
      if i == CHECKPOINT_COUNT then
        data.lap += 1
        data.checkpoint = 0
        RE:FireAllClients("LapComplete", { player = player.Name, lap = data.lap - 1 })

        if data.lap > TOTAL_LAPS then
          data.finished = true
          data.finishTime = tick() - data.startTime
          table.insert(finishOrder, player.UserId)
          local pos = #finishOrder
          RE:FireAllClients("PlayerFinished", {
            player = player.Name,
            position = pos,
            time = data.finishTime
          })
          -- Reward
          if pos == 1 and FIRST_PLACE_REWARD > 0 then
            local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
            if economyAPI then
              economyAPI:Invoke("add", player, CURRENCY, FIRST_PLACE_REWARD)
            end
            RE:FireClient(player, "RewardGranted", FIRST_PLACE_REWARD)
          end
        end
      end

      -- Broadcast positions to all
      RE:FireAllClients("PositionUpdate", getPositions())
    end)
    table.insert(checkpointConnections, conn)
  end
end

-- Ghost replay recording (per-player position snapshots)
local ghostData: {[number]: { time: number, pos: Vector3, rot: CFrame }[]} = {}
local GHOST_SAMPLE_RATE = 0.1 -- seconds between samples

local function startGhostRecording(player: Player)
  ghostData[player.UserId] = {}
  task.spawn(function()
    local data = racerData[player.UserId]
    while raceActive and data and not data.finished do
      local char = player.Character
      if char then
        local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
        if hrp then
          table.insert(ghostData[player.UserId], {
            time = tick() - data.startTime,
            pos = hrp.Position,
            cframe = hrp.CFrame,
          })
        end
      end
      task.wait(GHOST_SAMPLE_RATE)
    end
  end)
end

-- Start race
local function startRace()
  raceActive = true
  finishOrder = {}
  racerData = {}
  local startTime = tick()
  for _, player in ipairs(Players:GetPlayers()) do
    racerData[player.UserId] = {
      lap = 1,
      checkpoint = 0,
      startTime = startTime,
      finished = false,
      finishTime = nil,
    }
    startGhostRecording(player)
  end
  setupCheckpointTriggers()
  RE:FireAllClients("RaceStart", { laps = TOTAL_LAPS, checkpoints = CHECKPOINT_COUNT })
  print("[Racing] Race started with " .. #Players:GetPlayers() .. " racers")
end

-- Leaderboard data
local RF = Instance.new("RemoteFunction")
RF.Name = "RacingRF"
RF.Parent = ReplicatedStorage

RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  if action == "start" then
    if raceActive then return false, "Race already active" end
    startRace()
    return true, "Race started"
  elseif action == "getPositions" then
    return getPositions()
  elseif action == "getGhost" then
    local userId = tonumber((...)) or 0
    return ghostData[userId] or {}
  elseif action == "getState" then
    local myData = racerData[player.UserId]
    return {
      active = raceActive,
      myLap = myData and myData.lap or 0,
      myCheckpoint = myData and myData.checkpoint or 0,
      finished = myData and myData.finished or false,
    }
  end
  return false, "Unknown action"
end

Players.PlayerAdded:Connect(function(player)
  if raceActive then
    racerData[player.UserId] = {
      lap = 1, checkpoint = 0, startTime = tick(), finished = false
    }
  end
end)

print("[RacingCheckpoint] System ready. ${laps} laps, ${checkpoints} checkpoints")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. OBBY CHECKPOINT EXPANDED
// ─────────────────────────────────────────────────────────────────────────────

export interface ObbyCheckpointExpandedParams {
  stageCount?: number
  deathsPerSkipToken?: number
  currency?: string
  skipTokenCost?: number
}

export function obbyCheckpointExpanded(params: ObbyCheckpointExpandedParams): string {
  const stages = num(params.stageCount ?? 30, 1, 500)
  const deathsPerToken = num(params.deathsPerSkipToken ?? 10, 1)
  const currency = safe(params.currency ?? 'Coins')
  const skipCost = num(params.skipTokenCost ?? 25, 1)

  return `-- ══ Obby Checkpoint System Expanded (ServerScriptService) ══
-- Stages: ${stages} | Skip cost: ${skipCost} ${currency} | Deaths/Token: ${deathsPerToken}
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local obbyStore = DataStoreService:GetDataStore("ObbyData_v2")
local STAGE_COUNT = ${stages}
local CURRENCY = "${currency}"
local SKIP_COST = ${skipCost}
local DEATHS_PER_TOKEN = ${deathsPerToken}

-- Remote setup
local RE = Instance.new("RemoteEvent")
RE.Name = "ObbyRE"
RE.Parent = ReplicatedStorage

local RF = Instance.new("RemoteFunction")
RF.Name = "ObbyRF"
RF.Parent = ReplicatedStorage

-- Per-player data: { stage, deaths, stageDeaths: {}, stageStartTime, bestTimes: {}, skipTokens }
local playerData: {[number]: any} = {}

local function defaultData()
  return { stage = 1, deaths = 0, stageDeaths = {}, bestTimes = {}, skipTokens = 0 }
end

local function loadData(player: Player)
  local ok, data = pcall(function()
    return obbyStore:GetAsync("obby_" .. player.UserId)
  end)
  playerData[player.UserId] = (ok and type(data) == "table") and data or defaultData()
  -- Ensure all fields
  local d = playerData[player.UserId]
  d.stageDeaths = d.stageDeaths or {}
  d.bestTimes = d.bestTimes or {}
  d.skipTokens = d.skipTokens or 0
end

local function saveData(player: Player)
  local d = playerData[player.UserId]
  if not d then return end
  pcall(function()
    obbyStore:SetAsync("obby_" .. player.UserId, d)
  end)
end

local function getSpawnCFrame(stage: number): CFrame
  local folder = workspace:FindFirstChild("ObbyStages")
  if folder then
    local sp = folder:FindFirstChild("Stage" .. stage)
    if sp and sp:IsA("BasePart") then
      return sp.CFrame + Vector3.new(0, 5, 0)
    end
  end
  -- Fallback: stagger stages 50 studs apart
  return CFrame.new((stage - 1) * 50, 10, 0)
end

local function teleportToStage(player: Player, stage: number)
  local char = player.Character
  if not char then return end
  local hrp = char:FindFirstChild("HumanoidRootPart") :: BasePart?
  if hrp then
    hrp.CFrame = getSpawnCFrame(stage)
  end
end

local function onDeath(player: Player)
  local d = playerData[player.UserId]
  if not d then return end
  d.deaths += 1
  d.stageDeaths[tostring(d.stage)] = (d.stageDeaths[tostring(d.stage)] or 0) + 1
  -- Award skip token every N deaths
  if d.deaths % DEATHS_PER_TOKEN == 0 then
    d.skipTokens += 1
    RE:FireClient(player, "SkipTokenEarned", d.skipTokens)
  end
  saveData(player)
  -- Respawn at current checkpoint after delay
  task.delay(2, function()
    if player.Character then
      teleportToStage(player, d.stage)
    end
  end)
end

-- Checkpoint touch triggers
local function setupCheckpoints()
  local folder = workspace:FindFirstChild("ObbyStages")
  if not folder then
    warn("[Obby] Create a folder 'ObbyStages' with Parts named Stage1, Stage2... as checkpoints")
    return
  end
  for i = 1, STAGE_COUNT do
    local part = folder:FindFirstChild("Stage" .. i)
    if part and part:IsA("BasePart") then
      part.Touched:Connect(function(hit)
        local char = hit.Parent
        local player = Players:GetPlayerFromCharacter(char)
        if not player then return end
        local d = playerData[player.UserId]
        if not d then return end
        if i <= d.stage then return end -- already past this stage

        -- Record time for this stage
        local elapsed = d.stageStartTime and (tick() - d.stageStartTime) or nil
        if elapsed then
          local key = tostring(i - 1)
          if not d.bestTimes[key] or elapsed < d.bestTimes[key] then
            d.bestTimes[key] = elapsed
          end
        end

        d.stage = i
        d.stageStartTime = tick()

        -- Leaderstats update
        local ls = player:FindFirstChild("leaderstats")
        if ls then
          local stageVal = ls:FindFirstChild("Stage")
          if stageVal then stageVal.Value = i end
        end

        RE:FireClient(player, "StageReached", {
          stage = i,
          deaths = d.deaths,
          bestTime = d.bestTimes[tostring(i - 1)],
        })

        saveData(player)

        -- Reward scaling: more coins for later stages
        local rewardAmount = math.floor(i * 1.5)
        local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
        if economyAPI then
          economyAPI:Invoke("add", player, CURRENCY, rewardAmount)
        end

        if i == STAGE_COUNT then
          RE:FireClient(player, "ObbyComplete", {
            totalDeaths = d.deaths,
            bestTimes = d.bestTimes,
          })
        end
      end)
    end
  end
end

RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  local d = playerData[player.UserId]
  if not d then return false, "Data not loaded" end

  if action == "getData" then
    return d
  elseif action == "skip" then
    -- Use skip token to jump to next stage
    if d.skipTokens <= 0 then
      -- Check if player can purchase with currency
      local economyAPI = game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
      if economyAPI and economyAPI:Invoke("spend", player, CURRENCY, SKIP_COST) then
        -- allow
      else
        return false, "No skip tokens (earn by dying ${deathsPerToken} times) or need " .. SKIP_COST .. " " .. CURRENCY
      end
    else
      d.skipTokens -= 1
    end
    local nextStage = math.min(d.stage + 1, STAGE_COUNT)
    d.stage = nextStage
    teleportToStage(player, nextStage)
    saveData(player)
    RE:FireClient(player, "StageReached", { stage = nextStage, deaths = d.deaths })
    return true, "Skipped to stage " .. nextStage
  elseif action == "respawn" then
    teleportToStage(player, d.stage)
    return true, "Respawned"
  end
  return false, "Unknown action"
end

-- Hook into character death
Players.PlayerAdded:Connect(function(player: Player)
  loadData(player)
  -- Leaderstats
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  local stageVal = Instance.new("IntValue")
  stageVal.Name = "Stage"
  stageVal.Value = playerData[player.UserId] and playerData[player.UserId].stage or 1
  stageVal.Parent = ls

  player.CharacterAdded:Connect(function(char)
    local hum = char:WaitForChild("Humanoid") :: Humanoid
    hum.Died:Connect(function()
      onDeath(player)
    end)
    -- Spawn at checkpoint
    task.wait(0.5)
    local d = playerData[player.UserId]
    if d and d.stage > 1 then
      teleportToStage(player, d.stage)
    end
  end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  saveData(player)
  playerData[player.UserId] = nil
end)

setupCheckpoints()
print("[ObbyCheckpoint] ${stages} stages ready. Skip cost: ${skipCost} ${currency}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. BATTLE PASS SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface BattlePassParams {
  seasonName?: string
  maxTier?: number
  xpPerTier?: number
  premiumCost?: number
  currency?: string
  freeRewards?: string[]
  premiumRewards?: string[]
}

export function battlePassSystem(params: BattlePassParams): string {
  const season = safe(params.seasonName ?? 'Season1')
  const maxTier = num(params.maxTier ?? 100, 1, 200)
  const xpPerTier = num(params.xpPerTier ?? 1000, 100)
  const premCost = num(params.premiumCost ?? 999, 0)
  const currency = safe(params.currency ?? 'Robux')
  const freeRew = (params.freeRewards ?? ['Badge_Free1', 'Badge_Free2', 'Coins_500']).map(safe)
  const premRew = (params.premiumRewards ?? ['Skin_Dragon', 'Title_Legend', 'Coins_2000']).map(safe)

  return `-- ══ Battle Pass System (ServerScriptService) ══
-- Season: ${season} | Tiers: ${maxTier} | XP/tier: ${xpPerTier} | Premium: ${premCost} ${currency}
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local bpStore = DataStoreService:GetDataStore("BattlePass_${season}_v1")
local SEASON = "${season}"
local MAX_TIER = ${maxTier}
local XP_PER_TIER = ${xpPerTier}
local PREMIUM_GAMEPASS_ID = 0 -- Set your GamePass ID here

-- Free track rewards (index = tier, wraps around if fewer entries)
local FREE_REWARDS = { ${freeRew.map(r=>`"${r}"`).join(', ')} }
local PREMIUM_REWARDS = { ${premRew.map(r=>`"${r}"`).join(', ')} }

-- Daily challenge pool
local DAILY_CHALLENGES = {
  { id = "play_1", desc = "Play for 10 minutes", xp = 500, type = "time", target = 600 },
  { id = "kill_5", desc = "Defeat 5 enemies", xp = 300, type = "kills", target = 5 },
  { id = "collect_10", desc = "Collect 10 items", xp = 400, type = "collect", target = 10 },
  { id = "win_match", desc = "Win a match", xp = 800, type = "win", target = 1 },
  { id = "craft_3", desc = "Craft 3 items", xp = 350, type = "craft", target = 3 },
}
local WEEKLY_CHALLENGES = {
  { id = "weekly_kills", desc = "Defeat 50 enemies", xp = 5000, type = "kills", target = 50 },
  { id = "weekly_play", desc = "Play 5 days this week", xp = 3000, type = "days", target = 5 },
}

-- Remote
local RE = Instance.new("RemoteEvent")
RE.Name = "BattlePassRE"
RE.Parent = ReplicatedStorage

local RF = Instance.new("RemoteFunction")
RF.Name = "BattlePassRF"
RF.Parent = ReplicatedStorage

-- Per-player data: { tier, xp, premium, claimedFree: {}, claimedPremium: {}, dailyProgress, weeklyProgress, lastDailyReset }
local playerData: {[number]: any} = {}

local function defaultData()
  return {
    tier = 1,
    xp = 0,
    premium = false,
    claimedFree = {},
    claimedPremium = {},
    dailyProgress = {},
    weeklyProgress = {},
    lastDailyReset = 0,
    totalXpEarned = 0,
  }
end

local function loadData(player: Player)
  local ok, data = pcall(function()
    return bpStore:GetAsync("bp_" .. player.UserId)
  end)
  playerData[player.UserId] = (ok and type(data) == "table") and data or defaultData()
  local d = playerData[player.UserId]
  d.claimedFree = d.claimedFree or {}
  d.claimedPremium = d.claimedPremium or {}
  d.dailyProgress = d.dailyProgress or {}
  d.weeklyProgress = d.weeklyProgress or {}
end

local function saveData(player: Player)
  local d = playerData[player.UserId]
  if not d then return end
  pcall(function() bpStore:SetAsync("bp_" .. player.UserId, d) end)
end

local function resetDailyChallenges(d: any)
  local today = math.floor(os.time() / 86400)
  if d.lastDailyReset ~= today then
    d.lastDailyReset = today
    d.dailyProgress = {}
    -- Assign 3 random challenges for today
    local available = {}
    for i, c in ipairs(DAILY_CHALLENGES) do table.insert(available, c) end
    d.todayChallenges = {}
    for i = 1, math.min(3, #available) do
      local idx = math.random(1, #available)
      table.insert(d.todayChallenges, available[idx])
      table.remove(available, idx)
    end
  end
end

local function addXp(player: Player, amount: number)
  local d = playerData[player.UserId]
  if not d then return end
  d.xp += amount
  d.totalXpEarned += amount
  -- Tier ups
  local tieredUp = false
  while d.xp >= XP_PER_TIER and d.tier < MAX_TIER do
    d.xp -= XP_PER_TIER
    d.tier += 1
    tieredUp = true
    RE:FireClient(player, "TierUp", { tier = d.tier, xp = d.xp })
  end
  if tieredUp then
    RE:FireClient(player, "BPUpdate", d)
    saveData(player)
  end
end

local function checkChallengeProgress(player: Player, challengeType: string, amount: number)
  local d = playerData[player.UserId]
  if not d then return end
  resetDailyChallenges(d)
  -- Daily
  for _, c in ipairs(d.todayChallenges or {}) do
    if c.type == challengeType then
      d.dailyProgress[c.id] = (d.dailyProgress[c.id] or 0) + amount
      if d.dailyProgress[c.id] >= c.target and not d.dailyProgress[c.id .. "_claimed"] then
        d.dailyProgress[c.id .. "_claimed"] = true
        addXp(player, c.xp)
        RE:FireClient(player, "ChallengeComplete", { id = c.id, xp = c.xp, type = "daily" })
      end
    end
  end
  -- Weekly
  for _, c in ipairs(WEEKLY_CHALLENGES) do
    if c.type == challengeType then
      d.weeklyProgress[c.id] = (d.weeklyProgress[c.id] or 0) + amount
      if d.weeklyProgress[c.id] >= c.target and not d.weeklyProgress[c.id .. "_claimed"] then
        d.weeklyProgress[c.id .. "_claimed"] = true
        addXp(player, c.xp)
        RE:FireClient(player, "ChallengeComplete", { id = c.id, xp = c.xp, type = "weekly" })
      end
    end
  end
  saveData(player)
end

-- Claim a reward at a specific tier
local function claimReward(player: Player, tier: number, isPremium: boolean): (boolean, string)
  local d = playerData[player.UserId]
  if not d then return false, "Data error" end
  if tier > d.tier then return false, "Tier not reached" end
  if isPremium and not d.premium then return false, "Premium pass required" end

  local claimedKey = tostring(tier)
  local rewards = isPremium and PREMIUM_REWARDS or FREE_REWARDS
  local claimedTable = isPremium and d.claimedPremium or d.claimedFree

  if claimedTable[claimedKey] then return false, "Already claimed" end
  claimedTable[claimedKey] = true

  -- Get reward (cycles if fewer entries than tiers)
  local rewardIdx = ((tier - 1) % #rewards) + 1
  local reward = rewards[rewardIdx]

  saveData(player)
  RE:FireClient(player, "RewardClaimed", { tier = tier, reward = reward, premium = isPremium })
  return true, reward
end

-- Expose a BindableEvent for other systems to award challenge progress
local challengeEvent = Instance.new("BindableEvent")
challengeEvent.Name = "BPChallengeProgress"
challengeEvent.Parent = game:GetService("ServerStorage")
challengeEvent.Event:Connect(function(player: Player, ctype: string, amount: number)
  checkChallengeProgress(player, ctype, amount)
end)

RF.OnServerInvoke = function(player: Player, action: string, ...: any): any
  local args = {...}
  local d = playerData[player.UserId]
  if action == "getData" then
    if d then resetDailyChallenges(d) end
    return d
  elseif action == "claim" then
    local tier = math.floor(tonumber(args[1]) or 0)
    local isPremium = args[2] == true
    return claimReward(player, tier, isPremium)
  elseif action == "addXP" then
    -- Authenticated internal call (trust server calls only via BindableFunction)
    return false, "Use BindableEvent BPChallengeProgress instead"
  elseif action == "unlockPremium" then
    if not d then return false, "No data" end
    -- Check game pass ownership
    local hasPremium = false
    if PREMIUM_GAMEPASS_ID ~= 0 then
      local ok, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PREMIUM_GAMEPASS_ID)
      end)
      hasPremium = ok and owns
    else
      -- No game pass set: allow purchase via currency (demo mode)
      hasPremium = true
    end
    if hasPremium then
      d.premium = true
      saveData(player)
      RE:FireClient(player, "BPUpdate", d)
      return true, "Premium unlocked"
    end
    return false, "GamePass not owned"
  end
  return false, "Unknown action"
end

-- Award playtime XP every 5 minutes
task.spawn(function()
  while true do
    task.wait(300)
    for _, player in ipairs(Players:GetPlayers()) do
      checkChallengeProgress(player, "time", 300)
      addXp(player, 100) -- passive playtime XP
    end
  end
end)

Players.PlayerAdded:Connect(function(player: Player)
  task.spawn(loadData, player)
end)
Players.PlayerRemoving:Connect(function(player: Player)
  saveData(player)
  playerData[player.UserId] = nil
end)

print("[BattlePass] Season ${season} initialized. ${maxTier} tiers, ${xpPerTier} XP/tier")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationSystemParams {
  maxStack?: number
  defaultDuration?: number
  position?: 'TopRight' | 'TopLeft' | 'BottomRight' | 'BottomLeft'
}

export function notificationSystem(params: NotificationSystemParams): string {
  const maxStack = num(params.maxStack ?? 5, 1, 20)
  const duration = Math.max(1, params.defaultDuration ?? 4)
  const position = params.position ?? 'TopRight'
  const anchorX = position.includes('Right') ? 1 : 0
  const anchorY = position.includes('Bottom') ? 1 : 0
  const posX = position.includes('Right') ? 1 : 0
  const posY = position.includes('Bottom') ? 1 : 0
  const slideDir = position.includes('Right') ? 1 : -1

  return `-- ══ Notification System (LocalScript in StarterPlayerScripts) ══
-- MaxStack: ${maxStack} | Duration: ${duration}s | Position: ${position}
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local MAX_STACK = ${maxStack}
local DEFAULT_DURATION = ${duration}
local NOTIF_WIDTH = 300
local NOTIF_HEIGHT = 60
local NOTIF_PADDING = 8
local ANCHOR_X = ${anchorX}
local ANCHOR_Y = ${anchorY}
local POS_X = ${posX}
local POS_Y = ${posY}
local SLIDE_DIR = ${slideDir}  -- 1 = from right, -1 = from left

-- Create the notification ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "NotificationGui"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = playerGui

local notifContainer = Instance.new("Frame")
notifContainer.Name = "Container"
notifContainer.BackgroundTransparency = 1
notifContainer.AnchorPoint = Vector2.new(${anchorX}, ${anchorY})
notifContainer.Position = UDim2.new(${posX}, 0, ${posY}, 0)
notifContainer.Size = UDim2.new(0, NOTIF_WIDTH + 20, 1, 0)
notifContainer.Parent = screenGui

-- Color map by type
local COLORS = {
  info    = Color3.fromRGB(40, 100, 200),
  success = Color3.fromRGB(40, 160, 80),
  warning = Color3.fromRGB(200, 140, 30),
  error   = Color3.fromRGB(200, 60, 60),
  reward  = Color3.fromRGB(180, 140, 30),
}

local activeNotifs: {Frame} = {}
local notifQueue: {any}[] = {}
local processing = false

local function getYOffset(index: number): number
  local sign = POS_Y == 0 and 1 or -1
  return sign * (index - 1) * (NOTIF_HEIGHT + NOTIF_PADDING)
end

local function repositionAll()
  for i, frame in ipairs(activeNotifs) do
    local targetY = getYOffset(i)
    TweenService:Create(frame,
      TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      { Position = UDim2.new(0, 0, 0, targetY) }
    ):Play()
  end
end

local function dismissNotif(frame: Frame)
  local idx = table.find(activeNotifs, frame)
  if idx then table.remove(activeNotifs, idx) end

  local slideOut = SLIDE_DIR * (NOTIF_WIDTH + 30)
  TweenService:Create(frame,
    TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
    { Position = UDim2.new(0, slideOut, 0, frame.Position.Y.Offset), BackgroundTransparency = 0.7 }
  ):Play()
  task.delay(0.35, function() frame:Destroy() end)
  repositionAll()
  -- Process queue
  processing = false
  if #notifQueue > 0 then
    local next = table.remove(notifQueue, 1)
    task.spawn(function()
      -- re-call show
      _G.ShowNotification(next.text, next.notifType, next.duration)
    end)
  end
end

function _G.ShowNotification(text: string, notifType: string?, duration: number?)
  notifType = notifType or "info"
  duration = duration or DEFAULT_DURATION

  if #activeNotifs >= MAX_STACK then
    table.insert(notifQueue, { text = text, notifType = notifType, duration = duration })
    return
  end

  local color = COLORS[notifType] or COLORS.info
  local startY = getYOffset(#activeNotifs + 1)
  local slideIn = SLIDE_DIR * (NOTIF_WIDTH + 30)

  -- Notification frame
  local frame = Instance.new("Frame")
  frame.Name = "Notif"
  frame.Size = UDim2.new(0, NOTIF_WIDTH, 0, NOTIF_HEIGHT)
  frame.Position = UDim2.new(0, slideIn, 0, startY)
  frame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
  frame.BorderSizePixel = 0
  frame.ClipsDescendants = true
  frame.Parent = notifContainer

  local corner = Instance.new("UICorner")
  corner.CornerRadius = UDim.new(0, 8)
  corner.Parent = frame

  -- Accent bar on left/right
  local accent = Instance.new("Frame")
  accent.Size = UDim2.new(0, 4, 1, 0)
  accent.Position = SLIDE_DIR == 1 and UDim2.new(0, 0, 0, 0) or UDim2.new(1, -4, 0, 0)
  accent.BackgroundColor3 = color
  accent.BorderSizePixel = 0
  accent.Parent = frame

  -- Label
  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -20, 1, 0)
  label.Position = UDim2.new(0, 14, 0, 0)
  label.BackgroundTransparency = 1
  label.Text = text
  label.TextColor3 = Color3.fromRGB(240, 240, 240)
  label.TextSize = 15
  label.Font = Enum.Font.GothamMedium
  label.TextWrapped = true
  label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = frame

  -- Progress bar (timer)
  local progressBg = Instance.new("Frame")
  progressBg.Size = UDim2.new(1, 0, 0, 3)
  progressBg.Position = UDim2.new(0, 0, 1, -3)
  progressBg.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
  progressBg.BorderSizePixel = 0
  progressBg.Parent = frame

  local progressBar = Instance.new("Frame")
  progressBar.Name = "Progress"
  progressBar.Size = UDim2.new(1, 0, 1, 0)
  progressBar.BackgroundColor3 = color
  progressBar.BorderSizePixel = 0
  progressBar.Parent = progressBg

  table.insert(activeNotifs, frame)

  -- Slide in
  TweenService:Create(frame,
    TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    { Position = UDim2.new(0, 0, 0, startY) }
  ):Play()

  -- Timer bar shrink
  TweenService:Create(progressBar,
    TweenInfo.new(duration, Enum.EasingStyle.Linear),
    { Size = UDim2.new(0, 0, 1, 0) }
  ):Play()

  -- Auto dismiss
  task.delay(duration, function()
    if frame.Parent then
      dismissNotif(frame)
    end
  end)

  -- Click to dismiss
  frame.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or
       input.UserInputType == Enum.UserInputType.Touch then
      dismissNotif(frame)
    end
  end)
end

-- Listen for server-fired notifications
local RE = ReplicatedStorage:WaitForChild("NotificationRE", 5)
if RE then
  RE.OnClientEvent:Connect(function(text: string, notifType: string?, duration: number?)
    _G.ShowNotification(text, notifType, duration)
  end)
end

-- ── SERVER SIDE (paste in ServerScriptService) ──
--[[
  local RE = Instance.new("RemoteEvent")
  RE.Name = "NotificationRE"
  RE.Parent = game:GetService("ReplicatedStorage")

  -- Usage: RE:FireClient(player, "You earned 500 Coins!", "reward", 5)
  -- Usage: RE:FireAllClients("Server restarting in 60 seconds!", "warning", 10)

  -- Expose as BindableFunction for other server scripts:
  local notifyBF = Instance.new("BindableFunction")
  notifyBF.Name = "Notify"
  notifyBF.Parent = game:GetService("ServerStorage")
  notifyBF.OnInvoke = function(player, text, notifType, duration)
    RE:FireClient(player, text, notifType or "info", duration or ${duration})
  end
]]

print("[NotificationSystem] Ready. Max stack: ${maxStack}, Duration: ${duration}s")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SETTINGS SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsSystemParams {
  defaultGraphics?: number
  defaultMusicVolume?: number
  defaultSfxVolume?: number
}

export function settingsSystem(params: SettingsSystemParams): string {
  const graphics = Math.max(1, Math.min(10, Math.floor(params.defaultGraphics ?? 5)))
  const music = Math.max(0, Math.min(1, params.defaultMusicVolume ?? 0.7))
  const sfx = Math.max(0, Math.min(1, params.defaultSfxVolume ?? 1.0))

  return `-- ══ Settings System (LocalScript in StarterPlayerScripts) ══
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local settings = { graphics = ${graphics}, musicVolume = ${music}, sfxVolume = ${sfx} }

local RF = ReplicatedStorage:FindFirstChild("SettingsRF")
if RF then
  local ok, saved = pcall(function() return RF:InvokeServer("load") end)
  if ok and type(saved) == "table" then
    for k, v in pairs(saved) do settings[k] = v end
  end
end

local function saveSettings()
  if RF then pcall(function() RF:InvokeServer("save", settings) end) end
end
local function applyGraphics(level: number)
  settings.graphics = level
  pcall(function()
    game:GetService("Lighting").GlobalShadows = level >= 5
    game:GetService("Lighting").FogEnd = level >= 7 and 1000 or 400
  end)
end
local function applyAudio()
  SoundService.MusicVolume = settings.musicVolume
end

-- GUI
local screen = Instance.new("ScreenGui")
screen.Name = "SettingsGui"; screen.ResetOnSpawn = false; screen.Enabled = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; screen.Parent = playerGui

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 420, 0, 380); panel.Position = UDim2.new(0.5, -210, 0.5, -190)
panel.BackgroundColor3 = Color3.fromRGB(15, 15, 24); panel.BorderSizePixel = 0; panel.Parent = screen
Instance.new("UICorner", panel).CornerRadius = UDim.new(0, 12)

local titleLbl = Instance.new("TextLabel")
titleLbl.Size = UDim2.new(1, -50, 0, 48); titleLbl.Position = UDim2.new(0, 14, 0, 0)
titleLbl.BackgroundTransparency = 1; titleLbl.Text = "⚙ Settings"
titleLbl.TextColor3 = Color3.fromRGB(220,220,235); titleLbl.TextSize = 20
titleLbl.Font = Enum.Font.GothamBold; titleLbl.TextXAlignment = Enum.TextXAlignment.Left; titleLbl.Parent = panel

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0,32,0,32); closeBtn.Position = UDim2.new(1,-42,0,8)
closeBtn.BackgroundColor3 = Color3.fromRGB(170,45,45); closeBtn.Text = "✕"
closeBtn.TextColor3 = Color3.fromRGB(255,255,255); closeBtn.TextSize = 14
closeBtn.Font = Enum.Font.GothamBold; closeBtn.BorderSizePixel = 0; closeBtn.Parent = panel
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0,6)
closeBtn.Activated:Connect(function() screen.Enabled = false end)

local yOff = 56
local function addSlider(labelText: string, key: string, minV: number, maxV: number)
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1,-28,0,52); row.Position = UDim2.new(0,14,0,yOff)
  row.BackgroundColor3 = Color3.fromRGB(24,24,36); row.BorderSizePixel = 0; row.Parent = panel
  Instance.new("UICorner",row).CornerRadius = UDim.new(0,8)
  yOff += 62

  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(0.4,0,1,0); lbl.Position = UDim2.new(0,10,0,0)
  lbl.BackgroundTransparency=1; lbl.Text=labelText; lbl.TextColor3=Color3.fromRGB(200,200,215)
  lbl.TextSize=14; lbl.Font=Enum.Font.Gotham; lbl.TextXAlignment=Enum.TextXAlignment.Left; lbl.Parent=row

  local valLbl = Instance.new("TextLabel")
  valLbl.Size=UDim2.new(0.12,0,1,0); valLbl.Position=UDim2.new(0.87,0,0,0)
  valLbl.BackgroundTransparency=1; valLbl.Text=tostring(settings[key])
  valLbl.TextColor3=Color3.fromRGB(150,190,255); valLbl.TextSize=13; valLbl.Font=Enum.Font.GothamMedium; valLbl.Parent=row

  local trackBg = Instance.new("Frame")
  trackBg.Size=UDim2.new(0.38,0,0,6); trackBg.Position=UDim2.new(0.44,0,0.5,-3)
  trackBg.BackgroundColor3=Color3.fromRGB(42,42,60); trackBg.BorderSizePixel=0; trackBg.Parent=row
  Instance.new("UICorner",trackBg).CornerRadius=UDim.new(1,0)

  local pct = (settings[key]-minV)/(maxV-minV)
  local fill = Instance.new("Frame")
  fill.Size=UDim2.new(pct,0,1,0); fill.BackgroundColor3=Color3.fromRGB(75,125,255)
  fill.BorderSizePixel=0; fill.Parent=trackBg
  Instance.new("UICorner",fill).CornerRadius=UDim.new(1,0)

  local knob = Instance.new("TextButton")
  knob.Size=UDim2.new(0,15,0,15); knob.Position=UDim2.new(pct,-7,0.5,-7)
  knob.BackgroundColor3=Color3.fromRGB(235,235,255); knob.Text=""; knob.BorderSizePixel=0; knob.Parent=trackBg
  Instance.new("UICorner",knob).CornerRadius=UDim.new(1,0)

  local drag=false
  knob.MouseButton1Down:Connect(function() drag=true end)
  UserInputService.InputEnded:Connect(function(inp)
    if inp.UserInputType==Enum.UserInputType.MouseButton1 then drag=false end
  end)
  RunService.RenderStepped:Connect(function()
    if not drag then return end
    local mx=UserInputService:GetMouseLocation().X
    local t=math.clamp((mx-trackBg.AbsolutePosition.X)/trackBg.AbsoluteSize.X,0,1)
    local rawVal=minV+t*(maxV-minV)
    local val=(maxV-minV)>5 and math.floor(rawVal) or (math.floor(rawVal*10)/10)
    settings[key]=val; fill.Size=UDim2.new(t,0,1,0); knob.Position=UDim2.new(t,-7,0.5,-7)
    valLbl.Text=tostring(val)
    if key=="graphics" then applyGraphics(val) else applyAudio() end
  end)
end

addSlider("Graphics Quality","graphics",1,10)
addSlider("Music Volume","musicVolume",0,1)
addSlider("SFX Volume","sfxVolume",0,1)

local saveBtn = Instance.new("TextButton")
saveBtn.Size=UDim2.new(1,-28,0,40); saveBtn.Position=UDim2.new(0,14,0,yOff+8)
saveBtn.BackgroundColor3=Color3.fromRGB(55,110,230); saveBtn.Text="Save Settings"
saveBtn.TextColor3=Color3.fromRGB(255,255,255); saveBtn.TextSize=15; saveBtn.Font=Enum.Font.GothamBold
saveBtn.BorderSizePixel=0; saveBtn.Parent=panel
Instance.new("UICorner",saveBtn).CornerRadius=UDim.new(0,8)
saveBtn.Activated:Connect(function()
  saveSettings(); saveBtn.Text="Saved!"
  task.delay(1.5,function() saveBtn.Text="Save Settings" end)
end)

UserInputService.InputBegan:Connect(function(inp,proc)
  if proc then return end
  if inp.KeyCode==Enum.KeyCode.P then screen.Enabled=not screen.Enabled end
end)
_G.OpenSettings=function() screen.Enabled=true end
applyGraphics(settings.graphics); applyAudio()
print("[Settings] Loaded. Graphics:${graphics}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ADMIN COMMAND SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminCommandSystemParams {
  admins?: number[]
  prefix?: string
}

export function adminCommandSystem(params: AdminCommandSystemParams): string {
  const prefix = (params.prefix ?? ':').replace(/`/g, '\\`').slice(0,1)
  const adminLines = (params.admins ?? []).map((id: number) => `  [${Math.floor(id)}] = 2,`).join('\n')

  return `-- ══ Admin Command System (ServerScriptService) ══
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local PREFIX = "${prefix}"
local banStore = DataStoreService:GetDataStore("AdminBans_v1")
local banList: {[number]: string} = {}
local PERMISSIONS: {[number]: number} = {
${adminLines}
}

task.spawn(function()
  local ok, data = pcall(function() return banStore:GetAsync("banList") end)
  if ok and type(data) == "table" then banList = data end
end)

local function getPerm(uid: number): number return PERMISSIONS[uid] or 0 end
local function notify(player: Player, text: string)
  local RE=ReplicatedStorage:FindFirstChild("NotificationRE")
  if RE then RE:FireClient(player,text,"info",5) end
end
local function notifyAll(text: string)
  local RE=ReplicatedStorage:FindFirstChild("NotificationRE")
  if RE then RE:FireAllClients(text,"warning",8) end
end

local CMDS: {[string]: {lvl:number,fn:(Player,{string})->()}} = {}

CMDS["kick"] = {lvl=1,fn=function(caller,args)
  local t=Players:FindFirstChild(args[1] or "") :: Player?
  if not t then notify(caller,"Not found"); return end
  if getPerm(t.UserId)>=getPerm(caller.UserId) then notify(caller,"Higher rank"); return end
  t:Kick(table.concat(args," ",2) or "Kicked"); notifyAll(t.Name.." kicked")
end}
CMDS["ban"] = {lvl=2,fn=function(caller,args)
  local t=Players:FindFirstChild(args[1] or "") :: Player?
  if not t then notify(caller,"Not found"); return end
  local reason=table.concat(args," ",2) or "Banned"
  banList[t.UserId]=reason; pcall(function() banStore:SetAsync("banList",banList) end)
  t:Kick("Banned: "..reason); notify(caller,t.Name.." banned")
end}
CMDS["unban"] = {lvl=2,fn=function(caller,args)
  local uid=tonumber(args[1]); if not uid then notify(caller,"Provide userId"); return end
  banList[uid]=nil; pcall(function() banStore:SetAsync("banList",banList) end)
  notify(caller,"User "..uid.." unbanned")
end}
CMDS["tp"] = {lvl=1,fn=function(caller,args)
  local from=Players:FindFirstChild(args[1] or "") :: Player?
  local to=Players:FindFirstChild(args[2] or "") :: Player?
  if not from or not to then notify(caller,"tp <from> <to>"); return end
  local fc=from.Character; local tc=to.Character; if not fc or not tc then return end
  local fhrp=fc:FindFirstChild("HumanoidRootPart") :: BasePart?
  local thrp=tc:FindFirstChild("HumanoidRootPart") :: BasePart?
  if fhrp and thrp then fhrp.CFrame=thrp.CFrame*CFrame.new(3,0,0) end
end}
CMDS["speed"] = {lvl=1,fn=function(caller,args)
  local t=(Players:FindFirstChild(args[1] or "") or caller) :: Player
  local spd=math.clamp(tonumber(args[2]) or 16,0,500)
  local c=t.Character; if c then local h=c:FindFirstChildOfClass("Humanoid"); if h then h.WalkSpeed=spd end end
  notify(caller,t.Name.." speed="..spd)
end}
CMDS["god"] = {lvl=2,fn=function(caller,args)
  local t=(Players:FindFirstChild(args[1] or "") or caller) :: Player
  local c=t.Character; if not c then return end
  local h=c:FindFirstChildOfClass("Humanoid")
  if h then
    if h.MaxHealth==math.huge then h.MaxHealth=100;h.Health=100;notify(caller,"God OFF")
    else h.MaxHealth=math.huge;h.Health=math.huge;notify(caller,"God ON") end
  end
end}
CMDS["heal"] = {lvl=1,fn=function(caller,args)
  local t=(Players:FindFirstChild(args[1] or "") or caller) :: Player
  local c=t.Character; if c then local h=c:FindFirstChildOfClass("Humanoid"); if h then h.Health=h.MaxHealth end end
  notify(caller,"Healed "..t.Name)
end}
CMDS["give"] = {lvl=2,fn=function(caller,args)
  local t=Players:FindFirstChild(args[1] or "") :: Player?
  if not t then notify(caller,"Not found"); return end
  local currency=args[2] or "Coins"; local amount=tonumber(args[3]) or 100
  local api=game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
  if api then api:Invoke("add",t,currency,amount) end
  notify(caller,"Gave "..amount.." "..currency.." to "..t.Name)
end}
CMDS["announce"] = {lvl=1,fn=function(caller,args) notifyAll("[ADMIN] "..table.concat(args," ")) end}
CMDS["fly"] = {lvl=1,fn=function(caller,args)
  local t=(Players:FindFirstChild(args[1] or "") or caller) :: Player
  local c=t.Character; if not c then return end
  local hrp=c:FindFirstChild("HumanoidRootPart") :: BasePart?
  local hum=c:FindFirstChildOfClass("Humanoid")
  if hrp and hum then
    if hrp:FindFirstChild("FlyBV") then
      hrp:FindFirstChild("FlyBV"):Destroy(); hum.PlatformStand=false; notify(caller,"Fly OFF")
    else
      hum.PlatformStand=true
      local bv=Instance.new("BodyVelocity"); bv.Name="FlyBV"
      bv.Velocity=Vector3.zero; bv.MaxForce=Vector3.new(1e5,1e5,1e5); bv.Parent=hrp
      notify(caller,"Fly ON")
    end
  end
end}
CMDS["cmds"] = {lvl=0,fn=function(caller,_)
  local lvl=getPerm(caller.UserId); local list={}
  for name,cmd in CMDS do if lvl>=cmd.lvl then table.insert(list,PREFIX..name) end end
  table.sort(list); notify(caller,table.concat(list,", "))
end}

Players.PlayerAdded:Connect(function(player)
  if banList[player.UserId] then player:Kick("Banned: "..banList[player.UserId]); return end
  player.Chatted:Connect(function(msg)
    if msg:sub(1,#PREFIX)~=PREFIX then return end
    local parts=msg:sub(#PREFIX+1):split(" "); local name=parts[1]:lower()
    local args={}; for i=2,#parts do table.insert(args,parts[i]) end
    local cmd=CMDS[name]; if not cmd then return end
    if getPerm(player.UserId)<cmd.lvl then notify(player,"No permission"); return end
    local ok,err=pcall(cmd.fn,player,args)
    if not ok then notify(player,"Error: "..tostring(err)) end
  end)
end)
print("[AdminCommands] Ready. Prefix='"..PREFIX.."'")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. CUTSCENE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface CutsceneSystemParams {
  skipEnabled?: boolean
  scenes?: Array<{ name: string; shots: Array<{ waypointName: string; duration: number; dialog?: string }> }>
}

export function cutsceneSystem(params: CutsceneSystemParams): string {
  const skipEnabled = params.skipEnabled !== false
  const scenes = params.scenes ?? [{ name: 'Intro', shots: [{ waypointName: 'Shot1', duration: 3, dialog: 'Welcome to the game.' }] }]
  const sceneDefs = scenes.map((sc: any) => {
    const shots = sc.shots.map((s: any) =>
      `      { wp="${safe(s.waypointName||'Shot1')}", dur=${Math.max(0.5,s.duration)}, dialog="${safeLuauString(s.dialog||'')}" },`
    ).join('\n')
    return `  ["${safe(sc.name||'Scene')}"] = {\n${shots}\n  },`
  }).join('\n')

  return `-- ══ Cutscene System (LocalScript → StarterPlayerScripts) ══
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = workspace.CurrentCamera

local SCENES: {[string]: any} = {
${sceneDefs}
}
local SKIP_ENABLED = ${skipEnabled}
local isPlaying = false; local skipFlag = false

local screen = Instance.new("ScreenGui")
screen.Name="CutsceneGui"; screen.ResetOnSpawn=false; screen.Enabled=false
screen.ZIndexBehavior=Enum.ZIndexBehavior.Sibling; screen.Parent=playerGui

local barT=Instance.new("Frame"); barT.Size=UDim2.new(1,0,0,0); barT.BackgroundColor3=Color3.new(0,0,0)
barT.BorderSizePixel=0; barT.ZIndex=10; barT.Parent=screen
local barB=Instance.new("Frame"); barB.Size=UDim2.new(1,0,0,0); barB.AnchorPoint=Vector2.new(0,1)
barB.Position=UDim2.new(0,0,1,0); barB.BackgroundColor3=Color3.new(0,0,0); barB.BorderSizePixel=0; barB.ZIndex=10; barB.Parent=screen

local dlgBg=Instance.new("Frame"); dlgBg.Size=UDim2.new(0.7,0,0,78); dlgBg.Position=UDim2.new(0.15,0,0.8,0)
dlgBg.BackgroundColor3=Color3.fromRGB(8,8,18); dlgBg.BackgroundTransparency=0.15
dlgBg.BorderSizePixel=0; dlgBg.ZIndex=11; dlgBg.Visible=false; dlgBg.Parent=screen
Instance.new("UICorner",dlgBg).CornerRadius=UDim.new(0,10)

local dlgLbl=Instance.new("TextLabel"); dlgLbl.Size=UDim2.new(1,-18,1,-8); dlgLbl.Position=UDim2.new(0,9,0,4)
dlgLbl.BackgroundTransparency=1; dlgLbl.Text=""; dlgLbl.TextColor3=Color3.fromRGB(240,240,240)
dlgLbl.TextSize=15; dlgLbl.Font=Enum.Font.Gotham; dlgLbl.TextWrapped=true
dlgLbl.TextXAlignment=Enum.TextXAlignment.Left; dlgLbl.ZIndex=12; dlgLbl.Parent=dlgBg

local skipBtn
if SKIP_ENABLED then
  skipBtn=Instance.new("TextButton"); skipBtn.Size=UDim2.new(0,86,0,30); skipBtn.Position=UDim2.new(1,-96,0,10)
  skipBtn.BackgroundColor3=Color3.fromRGB(32,32,50); skipBtn.Text="Skip ▶▶"
  skipBtn.TextColor3=Color3.fromRGB(175,175,200); skipBtn.TextSize=13; skipBtn.Font=Enum.Font.Gotham
  skipBtn.BorderSizePixel=0; skipBtn.ZIndex=13; skipBtn.Parent=screen
  Instance.new("UICorner",skipBtn).CornerRadius=UDim.new(0,6)
  skipBtn.Activated:Connect(function() skipFlag=true end)
end

local function setLetterbox(open: boolean)
  local h=open and 78 or 0
  TweenService:Create(barT,TweenInfo.new(0.45,Enum.EasingStyle.Quad),{Size=UDim2.new(1,0,0,h)}):Play()
  TweenService:Create(barB,TweenInfo.new(0.45,Enum.EasingStyle.Quad),{Size=UDim2.new(1,0,0,h)}):Play()
end

local function typewrite(lbl: TextLabel, text: string)
  lbl.Text=""
  for i=1,#text do
    if skipFlag then lbl.Text=text; return end
    lbl.Text=text:sub(1,i); task.wait(0.034)
  end
end

function _G.PlayCutscene(name: string)
  local shots=SCENES[name]; if not shots or isPlaying then return end
  isPlaying=true; skipFlag=false; screen.Enabled=true
  if skipBtn then skipBtn.Visible=true end
  local char=player.Character
  if char then local hum=char:FindFirstChildOfClass("Humanoid"); if hum then hum.WalkSpeed=0;hum.JumpPower=0 end end
  camera.CameraType=Enum.CameraType.Scriptable
  setLetterbox(true); task.wait(0.45)

  for _,shot in ipairs(shots) do
    if skipFlag then break end
    local wpf=workspace:FindFirstChild("CutsceneWaypoints")
    local sf=wpf and wpf:FindFirstChild(name)
    local wp=sf and sf:FindFirstChild(shot.wp)
    if wp and wp:IsA("BasePart") then
      TweenService:Create(camera,TweenInfo.new(0.65,Enum.EasingStyle.Quad,Enum.EasingDirection.InOut),{CFrame=wp.CFrame}):Play()
    end
    if shot.dialog and shot.dialog~="" then dlgBg.Visible=true; typewrite(dlgLbl,shot.dialog)
    else dlgBg.Visible=false end
    local t=0; while t<shot.dur and not skipFlag do t+=task.wait(0.05) end
  end

  dlgBg.Visible=false
  if skipBtn then skipBtn.Visible=false end
  setLetterbox(false); task.wait(0.45)
  camera.CameraType=Enum.CameraType.Custom; screen.Enabled=false; isPlaying=false
  local char2=player.Character
  if char2 then local hum=char2:FindFirstChildOfClass("Humanoid"); if hum then hum.WalkSpeed=16;hum.JumpPower=50 end end
end

local RE=ReplicatedStorage:WaitForChild("CutsceneRE",5)
if RE then RE.OnClientEvent:Connect(function(n) _G.PlayCutscene(n) end) end
print("[Cutscene] Ready")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. VEHICLE SPAWN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleSpawnSystemParams {
  vehicles?: Array<{ name: string; cost: number }>
  currency?: string
  despawnTime?: number
  repairCost?: number
}

export function vehicleSpawnSystem(params: VehicleSpawnSystemParams): string {
  const currency = safe(params.currency ?? 'Coins')
  const despawnTime = num(params.despawnTime ?? 300, 10)
  const repairCost = num(params.repairCost ?? 50, 0)
  const vehicles = params.vehicles ?? [{ name: 'SportsCar', cost: 0 }, { name: 'Truck', cost: 200 }]
  const vehicleDefs = vehicles.map((v: any) => `  ["${safe(v.name||'Car')}"] = { cost=${num(v.cost||0,0)} },`).join('\n')

  return `-- ══ Vehicle Spawn System (ServerScriptService) ══
-- Despawn: ${despawnTime}s | Repair: ${repairCost} ${currency}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local CURRENCY="${currency}"; local DESPAWN_TIME=${despawnTime}; local REPAIR_COST=${repairCost}
local VEHICLES: {[string]:{cost:number}} = {
${vehicleDefs}
}

local RF=Instance.new("RemoteFunction"); RF.Name="VehicleRF"; RF.Parent=ReplicatedStorage
local RE=Instance.new("RemoteEvent");   RE.Name="VehicleRE"; RE.Parent=ReplicatedStorage

local spawned: {[number]:{model:Model,vtype:string}} = {}
local owned:   {[number]:{[string]:boolean}} = {}

local economyAPI=ServerStorage:FindFirstChild("EconomyAPI")
local function charge(p,n) return economyAPI and economyAPI:Invoke("spend",p,CURRENCY,n) end

local function spawnPoint(player:Player):CFrame
  local f=workspace:FindFirstChild("VehicleSpawns")
  if f then local b=f:FindFirstChildWhichIsA("BasePart"); if b then return b.CFrame+Vector3.new(0,3,0) end end
  local c=player.Character; local h=c and c:FindFirstChild("HumanoidRootPart") :: BasePart?
  return h and h.CFrame*CFrame.new(0,0,-12) or CFrame.new(0,5,0)
end

local function despawn(userId:number)
  local d=spawned[userId]; if not d then return end
  if d.model.Parent then d.model:Destroy() end
  spawned[userId]=nil
  local p=Players:GetPlayerByUserId(userId); if p then RE:FireClient(p,"VehicleDespawned") end
end

local function spawnVehicle(player:Player, vtype:string):(boolean,string)
  local def=VEHICLES[vtype]; if not def then return false,"Unknown type" end
  owned[player.UserId]=owned[player.UserId] or {}
  if def.cost>0 and not owned[player.UserId][vtype] then
    if not charge(player,def.cost) then return false,"Need "..def.cost.." "..CURRENCY end
    owned[player.UserId][vtype]=true
  end
  if spawned[player.UserId] then despawn(player.UserId); task.wait(0.1) end

  local template=ServerStorage:FindFirstChild("Vehicles") and
                 ServerStorage:FindFirstChild("Vehicles"):FindFirstChild(vtype)
  local model:Model
  if template then model=template:Clone()
  else
    model=Instance.new("Model"); model.Name=vtype
    local body=Instance.new("Part"); body.Name="Body"; body.Size=Vector3.new(6,2,10)
    body.Material=Enum.Material.Metal; body.Color=Color3.fromRGB(140,60,60); body.Parent=model
    local seat=Instance.new("VehicleSeat"); seat.Size=Vector3.new(2,1,2)
    seat.Position=body.Position+Vector3.new(0,1.5,0); seat.Material=Enum.Material.Fabric; seat.Parent=model
    for _,o in ipairs({Vector3.new(3,-1,4),Vector3.new(-3,-1,4),Vector3.new(3,-1,-4),Vector3.new(-3,-1,-4)}) do
      local w=Instance.new("Part"); w.Shape=Enum.PartType.Cylinder; w.Size=Vector3.new(0.6,2,2)
      w.Material=Enum.Material.Rubber; w.Color=Color3.fromRGB(20,20,20); w.Position=body.Position+o; w.Parent=model
    end
    model.PrimaryPart=body
  end

  model:SetPrimaryPartCFrame(spawnPoint(player)); model.Parent=workspace
  spawned[player.UserId]={model=model,vtype=vtype}
  task.delay(DESPAWN_TIME,function()
    if spawned[player.UserId] and spawned[player.UserId].model==model then despawn(player.UserId) end
  end)
  RE:FireClient(player,"VehicleSpawned",{vtype=vtype,despawnIn=DESPAWN_TIME})
  return true,vtype.." spawned"
end

RF.OnServerInvoke=function(player,action,...):any
  local args={...}
  if action=="spawn"   then return spawnVehicle(player,tostring(args[1] or ""))
  elseif action=="despawn" then despawn(player.UserId); return true
  elseif action=="repair" then
    local d=spawned[player.UserId]; if not d then return false,"No vehicle" end
    if REPAIR_COST>0 and not charge(player,REPAIR_COST) then return false,"Need "..REPAIR_COST end
    d.model:SetPrimaryPartCFrame(spawnPoint(player)); RE:FireClient(player,"VehicleRepaired"); return true
  elseif action=="list" then return VEHICLES
  elseif action=="owned" then return owned[player.UserId] or {}
  end; return false,"Unknown"
end

Players.PlayerRemoving:Connect(function(p) despawn(p.UserId); owned[p.UserId]=nil end)
print("[VehicleSpawn] Ready. Despawn=${despawnTime}s")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. BACKPACK HOTBAR SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface BackpackHotbarParams {
  slotCount?: number
}

export function backpackHotbarSystem(params: BackpackHotbarParams): string {
  const slots = Math.max(1, Math.min(10, Math.floor(params.slotCount ?? 6)))
  const keyLines = Array.from({length: slots}, (_: unknown, i: number) => {
    const keys = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Zero']
    return `  Enum.KeyCode.${keys[i] ?? ('F'+(i+1))},`
  }).join('\n')

  return `-- ══ Backpack Hotbar System (LocalScript → StarterPlayerScripts) ══
local Players=game:GetService("Players"); local UIS=game:GetService("UserInputService")
local TS=game:GetService("TweenService")

local player=Players.LocalPlayer; local playerGui=player:WaitForChild("PlayerGui")
local character=player.Character or player.CharacterAdded:Wait()
local backpack=player:WaitForChild("Backpack")

local SLOT_COUNT=${slots}; local SIZE=62; local PAD=6
local KEYS={
${keyLines}
}

local slots: {Tool?}=table.create(SLOT_COUNT,nil); local activeSlot: number?=nil
local screen=Instance.new("ScreenGui"); screen.Name="HotbarGui"; screen.ResetOnSpawn=false
screen.IgnoreGuiInset=true; screen.ZIndexBehavior=Enum.ZIndexBehavior.Sibling; screen.Parent=playerGui

local hotbar=Instance.new("Frame"); hotbar.BackgroundTransparency=1
hotbar.Size=UDim2.new(0,SLOT_COUNT*(SIZE+PAD)-PAD,0,SIZE)
hotbar.Position=UDim2.new(0.5,-(SLOT_COUNT*(SIZE+PAD)-PAD)/2,1,-(SIZE+18)); hotbar.Parent=screen

local frames:{Frame}={}; local labels:{TextLabel}={}; local strokes:{UIStroke}={}

for i=1,SLOT_COUNT do
  local f=Instance.new("Frame"); f.Name="Slot"..i
  f.Size=UDim2.new(0,SIZE,0,SIZE); f.Position=UDim2.new(0,(i-1)*(SIZE+PAD),0,0)
  f.BackgroundColor3=Color3.fromRGB(18,18,28); f.BackgroundTransparency=0.25
  f.BorderSizePixel=0; f.Parent=hotbar
  Instance.new("UICorner",f).CornerRadius=UDim.new(0,8)
  local st=Instance.new("UIStroke"); st.Color=Color3.fromRGB(55,55,80); st.Thickness=1.5; st.Parent=f; strokes[i]=st
  local kl=Instance.new("TextLabel"); kl.Size=UDim2.new(0.4,0,0.3,0); kl.Position=UDim2.new(0,4,0,3)
  kl.BackgroundTransparency=1; kl.Text=tostring(i); kl.TextColor3=Color3.fromRGB(140,140,165)
  kl.TextSize=11; kl.Font=Enum.Font.GothamMedium; kl.Parent=f
  local tl=Instance.new("TextLabel"); tl.Size=UDim2.new(1,0,0.28,0); tl.Position=UDim2.new(0,0,0.72,0)
  tl.BackgroundTransparency=1; tl.Text=""; tl.TextColor3=Color3.fromRGB(200,200,215)
  tl.TextSize=10; tl.Font=Enum.Font.Gotham; tl.TextTruncate=Enum.TextTruncate.AtEnd; tl.Parent=f; labels[i]=tl
  local btn=Instance.new("TextButton"); btn.Size=UDim2.new(1,0,1,0); btn.BackgroundTransparency=1
  btn.Text=""; btn.Parent=f; local fi=i; btn.Activated:Connect(function() equipSlot(fi) end)
  frames[i]=f
end

local function highlight(idx:number?)
  for i=1,SLOT_COUNT do
    local a=i==idx; strokes[i].Color=a and Color3.fromRGB(255,200,50) or Color3.fromRGB(55,55,80)
    strokes[i].Thickness=a and 2.5 or 1.5
    TS:Create(frames[i],TweenInfo.new(0.08),{BackgroundTransparency=a and 0.05 or 0.25}):Play()
  end
end
local function refresh(i:number) labels[i].Text=slots[i] and slots[i].Name or "" end
function equipSlot(i:number)
  local tool=slots[i]; if not tool then return end
  if activeSlot==i then
    local h=character:FindFirstChildOfClass("Humanoid"); if h then h:UnequipTools() end
    activeSlot=nil; highlight(nil)
  else
    local h=character:FindFirstChildOfClass("Humanoid"); if h then h:EquipTool(tool) end
    activeSlot=i; highlight(i)
  end
end
local function syncBackpack()
  local tools=backpack:GetChildren()
  for i=1,SLOT_COUNT do slots[i]=(tools[i] :: Tool?); refresh(i) end
end
backpack.ChildAdded:Connect(function(c)
  if not c:IsA("Tool") then return end
  for i=1,SLOT_COUNT do if not slots[i] then slots[i]=c :: Tool; refresh(i); return end end
end)
backpack.ChildRemoved:Connect(function(c)
  for i=1,SLOT_COUNT do
    if slots[i]==c then slots[i]=nil; refresh(i)
      if activeSlot==i then activeSlot=nil; highlight(nil) end; return
    end
  end
end)
UIS.InputBegan:Connect(function(inp,proc)
  if proc then return end
  for i,k in ipairs(KEYS) do if inp.KeyCode==k then equipSlot(i); return end end
  if inp.KeyCode==Enum.KeyCode.G and activeSlot then
    local tool=slots[activeSlot]
    if tool and tool.Parent==character then
      tool.Parent=workspace; slots[activeSlot]=nil; refresh(activeSlot); activeSlot=nil; highlight(nil)
    end
  end
end)
player.CharacterAdded:Connect(function(c)
  character=c; task.wait(0.5); syncBackpack(); activeSlot=nil; highlight(nil)
end)
syncBackpack()
print("[Hotbar] ${slots} slots ready")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. DAMAGE NUMBER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface DamageNumberParams {
  critMultiplier?: number
}

export function damageNumberSystem(params: DamageNumberParams): string {
  const critMult = Math.max(1, params.critMultiplier ?? 2)

  return `-- ══ Damage Number System (LocalScript → StarterPlayerScripts) ══
local TweenService=game:GetService("TweenService")
local ReplicatedStorage=game:GetService("ReplicatedStorage")

local COLORS={
  normal=Color3.fromRGB(255,255,255), crit=Color3.fromRGB(255,80,80),
  heal=Color3.fromRGB(80,255,120),    fire=Color3.fromRGB(255,140,30),
  poison=Color3.fromRGB(110,210,70),  ice=Color3.fromRGB(110,185,255),
}

local function show(worldPos:Vector3, amount:number, dmgType:string?, isCrit:boolean?)
  dmgType=dmgType or "normal"
  local color=COLORS[dmgType] or COLORS.normal
  local text=isCrit and ("CRIT "..math.abs(math.floor(amount))) or
             (dmgType=="heal" and ("+"..math.abs(math.floor(amount))) or tostring(math.abs(math.floor(amount))))

  local anchor=Instance.new("Part"); anchor.Anchored=true; anchor.CanCollide=false
  anchor.Transparency=1; anchor.Size=Vector3.new(0.1,0.1,0.1)
  anchor.Position=worldPos+Vector3.new(math.random(-8,8)*0.12,3,math.random(-8,8)*0.12)
  anchor.Parent=workspace

  local bb=Instance.new("BillboardGui"); bb.Size=UDim2.new(0,isCrit and 118 or 78,0,isCrit and 46 or 30)
  bb.Adornee=anchor; bb.AlwaysOnTop=false; bb.Parent=anchor

  local lbl=Instance.new("TextLabel"); lbl.Size=UDim2.new(1,0,1,0); lbl.BackgroundTransparency=1
  lbl.Text=text; lbl.TextColor3=color; lbl.TextSize=isCrit and 24 or 16; lbl.Font=Enum.Font.GothamBold
  lbl.TextStrokeTransparency=0.35; lbl.TextStrokeColor3=Color3.new(0,0,0); lbl.Parent=bb

  local dur=isCrit and 1.2 or 0.85
  if isCrit then
    lbl.TextSize=8
    TweenService:Create(lbl,TweenInfo.new(0.12,Enum.EasingStyle.Back,Enum.EasingDirection.Out),{TextSize=26}):Play()
    task.wait(0.12)
  end
  TweenService:Create(anchor,TweenInfo.new(dur,Enum.EasingStyle.Quad,Enum.EasingDirection.Out),
    {Position=anchor.Position+Vector3.new(0,isCrit and 7 or 4,0)}):Play()
  task.delay(dur*0.45,function()
    TweenService:Create(lbl,TweenInfo.new(dur*0.55,Enum.EasingStyle.Linear),
      {TextTransparency=1,TextStrokeTransparency=1}):Play()
  end)
  task.delay(dur+0.1,function() anchor:Destroy() end)
end

local RE=ReplicatedStorage:WaitForChild("DamageRE",5)
if RE then RE.OnClientEvent:Connect(show) end
_G.ShowDamageNumber=show
-- SERVER: local RE=Instance.new("RemoteEvent"); RE.Name="DamageRE"; RE.Parent=ReplicatedStorage
-- RE:FireAllClients(hitPos, damage, "normal"/"fire"/"heal", isCrit)
print("[DamageNumbers] Ready. Crit mult:${critMult}x")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. MINIMAP SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface MinimapSystemParams {
  mapSize?: number
  updateRate?: number
  showPlayerDots?: boolean
}

export function minimapSystem(params: MinimapSystemParams): string {
  const mapSize = num(params.mapSize ?? 500, 50)
  const updateRate = Math.max(0.05, params.updateRate ?? 0.1)
  const showDots = params.showPlayerDots !== false

  return `-- ══ Minimap System (LocalScript → StarterPlayerScripts) ══
-- MapSize: ${mapSize} studs | UpdateRate: ${updateRate}s
local Players=game:GetService("Players"); local RunService=game:GetService("RunService")
local TweenService=game:GetService("TweenService")

local player=Players.LocalPlayer; local playerGui=player:WaitForChild("PlayerGui")
local MAP_SIZE=${mapSize}; local UPDATE_RATE=${updateRate}; local SHOW_DOTS=${showDots}
local GUI_SIZE=180

-- Overhead camera for minimap viewport
local minimapCamera=Instance.new("Camera"); minimapCamera.Name="MinimapCamera"
minimapCamera.CameraType=Enum.CameraType.Scriptable; minimapCamera.Parent=workspace

local screen=Instance.new("ScreenGui"); screen.Name="MinimapGui"; screen.ResetOnSpawn=false
screen.ZIndexBehavior=Enum.ZIndexBehavior.Sibling; screen.Parent=playerGui

-- Container frame (bottom-right corner)
local container=Instance.new("Frame"); container.Name="MinimapContainer"
container.Size=UDim2.new(0,GUI_SIZE+8,0,GUI_SIZE+8)
container.Position=UDim2.new(1,-(GUI_SIZE+18),1,-(GUI_SIZE+18))
container.BackgroundColor3=Color3.fromRGB(10,10,18); container.BorderSizePixel=0; container.Parent=screen
Instance.new("UICorner",container).CornerRadius=UDim.new(0,10)
local stroke=Instance.new("UIStroke"); stroke.Color=Color3.fromRGB(60,60,90); stroke.Thickness=1.5; stroke.Parent=container

-- ViewportFrame for overhead rendering
local viewport=Instance.new("ViewportFrame"); viewport.Name="MapViewport"
viewport.Size=UDim2.new(0,GUI_SIZE,0,GUI_SIZE); viewport.Position=UDim2.new(0,4,0,4)
viewport.BackgroundColor3=Color3.fromRGB(20,30,20); viewport.BorderSizePixel=0
viewport.CurrentCamera=minimapCamera; viewport.Parent=container
Instance.new("UICorner",viewport).CornerRadius=UDim.new(0,8)

-- Player dots overlay
local dotLayer=Instance.new("Frame"); dotLayer.Name="DotLayer"
dotLayer.Size=UDim2.new(1,0,1,0); dotLayer.BackgroundTransparency=1; dotLayer.ZIndex=5; dotLayer.Parent=viewport

local playerDots:{[number]:Frame}={}

local function worldToMinimap(pos:Vector3):(number,number)
  local cx,cz=0,0 -- World center of map
  local nx=math.clamp((pos.X-cx)/MAP_SIZE+0.5,0,1)
  local nz=math.clamp((pos.Z-cz)/MAP_SIZE+0.5,0,1)
  return nx,nz
end

local function getOrCreateDot(uid:number, isLocal:boolean):Frame
  if playerDots[uid] then return playerDots[uid] end
  local dot=Instance.new("Frame"); dot.Size=UDim2.new(0,isLocal and 10 or 7,0,isLocal and 10 or 7)
  dot.AnchorPoint=Vector2.new(0.5,0.5); dot.BackgroundColor3=isLocal and Color3.fromRGB(80,200,255) or Color3.fromRGB(255,80,80)
  dot.BorderSizePixel=0; dot.ZIndex=6; dot.Parent=dotLayer
  Instance.new("UICorner",dot).CornerRadius=UDim.new(1,0)
  playerDots[uid]=dot; return dot
end

-- Zone labels (add Parts named "ZoneLabel_<name>" to workspace for auto-detection)
local function refreshZoneLabels()
  for _,part in ipairs(workspace:GetChildren()) do
    if part.Name:sub(1,10)=="ZoneLabel_" and part:IsA("BasePart") then
      local zoneName=part.Name:sub(11)
      local nx,nz=worldToMinimap(part.Position)
      local existing=dotLayer:FindFirstChild("Zone_"..zoneName)
      if not existing then
        local lbl=Instance.new("TextLabel"); lbl.Name="Zone_"..zoneName
        lbl.Size=UDim2.new(0,80,0,16); lbl.AnchorPoint=Vector2.new(0.5,0.5)
        lbl.BackgroundTransparency=0.6; lbl.BackgroundColor3=Color3.fromRGB(0,0,0)
        lbl.TextColor3=Color3.fromRGB(220,220,220); lbl.TextSize=9; lbl.Font=Enum.Font.Gotham
        lbl.Text=zoneName; lbl.ZIndex=7; lbl.Parent=dotLayer
        Instance.new("UICorner",lbl).CornerRadius=UDim.new(0,4)
      end
      local lbl=dotLayer:FindFirstChild("Zone_"..zoneName) :: TextLabel?
      if lbl then lbl.Position=UDim2.new(nx,0,nz,0) end
    end
  end
end

-- Update overhead camera to follow local player
local lastUpdate=0
RunService.RenderStepped:Connect(function()
  local now=tick(); if now-lastUpdate < UPDATE_RATE then return end; lastUpdate=now
  local char=player.Character; if not char then return end
  local hrp=char:FindFirstChild("HumanoidRootPart") :: BasePart?
  if not hrp then return end

  -- Position overhead camera above player
  local camHeight=MAP_SIZE*0.6
  minimapCamera.CFrame=CFrame.new(hrp.Position+Vector3.new(0,camHeight,0),hrp.Position)

  if SHOW_DOTS then
    -- Update all player positions as 2D dots
    local activeDots:{[number]:boolean}={}
    for _,p in ipairs(Players:GetPlayers()) do
      local c=p.Character; if not c then continue end
      local h=c:FindFirstChild("HumanoidRootPart") :: BasePart?
      if not h then continue end
      local isLocal=p==player
      local dot=getOrCreateDot(p.UserId,isLocal)
      local nx,nz=worldToMinimap(h.Position)
      dot.Position=UDim2.new(nx,0,nz,0)
      dot.Visible=true; activeDots[p.UserId]=true
    end
    -- Hide dots for players who left
    for uid,dot in playerDots do
      if not activeDots[uid] then dot.Visible=false end
    end
  end
end)

-- North indicator
local northLbl=Instance.new("TextLabel"); northLbl.Size=UDim2.new(0,20,0,20)
northLbl.Position=UDim2.new(0.5,-10,0,6); northLbl.BackgroundTransparency=1; northLbl.Text="N"
northLbl.TextColor3=Color3.fromRGB(255,100,100); northLbl.TextSize=12; northLbl.Font=Enum.Font.GothamBold
northLbl.ZIndex=8; northLbl.Parent=viewport

refreshZoneLabels()
print("[Minimap] Ready. Map size: ${mapSize} studs")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. QUEST BOARD SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestBoardParams {
  currency?: string
  questPoolSize?: number
  dailyQuestCount?: number
}

export function questBoardSystem(params: QuestBoardParams): string {
  const currency = safe(params.currency ?? 'Coins')
  const poolSize = num(params.questPoolSize ?? 20, 5)
  const dailyCount = num(params.dailyQuestCount ?? 3, 1, 10)

  return `-- ══ Quest Board System (ServerScriptService) ══
-- Currency: ${currency} | Pool: ${poolSize} | Daily quests: ${dailyCount}
local Players=game:GetService("Players"); local DataStoreService=game:GetService("DataStoreService")
local ReplicatedStorage=game:GetService("ReplicatedStorage")

local questStore=DataStoreService:GetDataStore("QuestBoard_v1")
local CURRENCY="${currency}"; local DAILY_QUEST_COUNT=${dailyCount}

-- Quest pool (add more as needed)
local QUEST_POOL: {any} = {}
for i=1,${poolSize} do
  local templates = {
    {id="kill_"..i, title="Defeat "..i*2.." Enemies", type="kill", target=i*2, reward=i*50, xpReward=i*100},
    {id="collect_"..i, title="Collect "..i*3.." Items", type="collect", target=i*3, reward=i*40, xpReward=i*80},
    {id="travel_"..i, title="Travel "..i*100 .." Studs", type="travel", target=i*100, reward=i*30, xpReward=i*60},
    {id="craft_"..i, title="Craft "..i.." Items", type="craft", target=i, reward=i*60, xpReward=i*120},
  }
  local pick=templates[(i%#templates)+1]
  table.insert(QUEST_POOL, pick)
end

local RF=Instance.new("RemoteFunction"); RF.Name="QuestRF"; RF.Parent=ReplicatedStorage
local RE=Instance.new("RemoteEvent");   RE.Name="QuestRE"; RE.Parent=ReplicatedStorage

-- Per-player data: { dailyQuests, progress, completed, lastReset }
local playerData:{[number]:any}={}

local function defaultData() return {dailyQuests={},progress={},completed={},lastReset=0} end

local function loadData(player:Player)
  local ok,data=pcall(function() return questStore:GetAsync("quest_"..player.UserId) end)
  playerData[player.UserId]=(ok and type(data)=="table") and data or defaultData()
  local d=playerData[player.UserId]
  d.progress=d.progress or {}; d.completed=d.completed or {}; d.dailyQuests=d.dailyQuests or {}
end

local function saveData(player:Player)
  local d=playerData[player.UserId]; if not d then return end
  pcall(function() questStore:SetAsync("quest_"..player.UserId,d) end)
end

local function rollDailyQuests(d:any)
  local today=math.floor(os.time()/86400)
  if d.lastReset==today then return end
  d.lastReset=today; d.dailyQuests={}; d.progress={}
  -- Reset daily-only completions
  local newCompleted={}
  for k,v in d.completed do if v=="persistent" then newCompleted[k]=v end end
  d.completed=newCompleted

  local available={}; for i,q in ipairs(QUEST_POOL) do table.insert(available,i) end
  for i=1,math.min(DAILY_QUEST_COUNT,#available) do
    local idx=math.random(1,#available)
    table.insert(d.dailyQuests,QUEST_POOL[available[idx]])
    table.remove(available,idx)
  end
end

local function getQuestById(d:any, questId:string):any?
  for _,q in ipairs(d.dailyQuests) do if q.id==questId then return q end end
  return nil
end

-- Called by other systems via BindableEvent
local questProgressBE=Instance.new("BindableEvent"); questProgressBE.Name="QuestProgress"
questProgressBE.Parent=game:GetService("ServerStorage")
questProgressBE.Event:Connect(function(player:Player, questType:string, amount:number)
  local d=playerData[player.UserId]; if not d then return end
  rollDailyQuests(d)
  for _,quest in ipairs(d.dailyQuests) do
    if quest.type==questType and not d.completed[quest.id] then
      d.progress[quest.id]=(d.progress[quest.id] or 0)+amount
      if d.progress[quest.id]>=quest.target then
        -- Quest complete — wait for player to claim
        RE:FireClient(player,"QuestReady",quest)
      end
      RE:FireClient(player,"QuestProgress",{id=quest.id,progress=d.progress[quest.id],target=quest.target})
    end
  end
  saveData(player)
end)

local function claimQuest(player:Player, questId:string):(boolean,string)
  local d=playerData[player.UserId]; if not d then return false,"No data" end
  if d.completed[questId] then return false,"Already claimed" end
  local quest=getQuestById(d,questId); if not quest then return false,"Quest not found" end
  if (d.progress[questId] or 0)<quest.target then return false,"Quest not complete" end
  d.completed[questId]=true
  local economyAPI=game:GetService("ServerStorage"):FindFirstChild("EconomyAPI")
  if economyAPI then economyAPI:Invoke("add",player,CURRENCY,quest.reward) end
  -- Fire BattlePass XP event if system exists
  local bpBF=game:GetService("ServerStorage"):FindFirstChild("BPChallengeProgress")
  if bpBF then bpBF:Fire(player,"quest",1) end
  saveData(player)
  RE:FireClient(player,"QuestClaimed",{id=questId,reward=quest.reward})
  return true,"Claimed "..quest.reward.." "..CURRENCY
end

RF.OnServerInvoke=function(player,action,...):any
  local args={...}
  local d=playerData[player.UserId]
  if action=="getQuests" then
    if d then rollDailyQuests(d) end
    return d and d.dailyQuests or {}
  elseif action=="getProgress" then
    return d and {progress=d.progress,completed=d.completed} or {}
  elseif action=="claim" then
    return claimQuest(player,tostring(args[1] or ""))
  end
  return false,"Unknown"
end

Players.PlayerAdded:Connect(function(p) task.spawn(loadData,p) end)
Players.PlayerRemoving:Connect(function(p) saveData(p); playerData[p.UserId]=nil end)
print("[QuestBoard] Ready. ${dailyCount} daily quests from pool of ${poolSize}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. DIALOGUE TREE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogueTreeParams {
  npcs?: Array<{
    name: string
    greeting: string
    choices?: Array<{ text: string; response: string; consequence?: string }>
  }>
}

export function dialogueTreeSystem(params: DialogueTreeParams): string {
  const npcs = params.npcs ?? [
    { name: 'Merchant', greeting: 'Welcome, traveler! What do you seek?',
      choices: [
        { text: 'What do you sell?', response: 'I sell the finest weapons in the land.' },
        { text: 'Tell me about this place.', response: 'This town was built 100 years ago by the founding king.' },
        { text: 'Goodbye.', response: 'Safe travels, adventurer.' },
      ]
    }
  ]

  const npcDefs = npcs.map((npc: any) => {
    const choices = (npc.choices ?? []).map((c: any) =>
      `      { text="${safeLuauString(c.text||'')}", response="${safeLuauString(c.response||'')}", consequence="${safe(c.consequence||'')}" },`
    ).join('\n')
    return `  ["${safe(npc.name||'NPC')}"] = { greeting="${safeLuauString(npc.greeting||'Hello.')}", choices={\n${choices}\n  }},`
  }).join('\n')

  return `-- ══ Dialogue Tree System (LocalScript → StarterPlayerScripts) ══
local Players=game:GetService("Players"); local TweenService=game:GetService("TweenService")
local ReplicatedStorage=game:GetService("ReplicatedStorage"); local UIS=game:GetService("UserInputService")

local player=Players.LocalPlayer; local playerGui=player:WaitForChild("PlayerGui")

local NPC_DATA:{[string]:any} = {
${npcDefs}
}

local isOpen=false
local screen=Instance.new("ScreenGui"); screen.Name="DialogueGui"; screen.ResetOnSpawn=false
screen.Enabled=false; screen.ZIndexBehavior=Enum.ZIndexBehavior.Sibling; screen.Parent=playerGui

-- Panel
local panel=Instance.new("Frame"); panel.Name="DialoguePanel"
panel.Size=UDim2.new(0,580,0,260); panel.Position=UDim2.new(0.5,-290,1,-290)
panel.BackgroundColor3=Color3.fromRGB(12,12,20); panel.BorderSizePixel=0; panel.Parent=screen
Instance.new("UICorner",panel).CornerRadius=UDim.new(0,12)
Instance.new("UIStroke",panel).Color=Color3.fromRGB(55,55,80)

local npcNameLbl=Instance.new("TextLabel"); npcNameLbl.Name="NPCName"
npcNameLbl.Size=UDim2.new(1,-20,0,36); npcNameLbl.Position=UDim2.new(0,12,0,0)
npcNameLbl.BackgroundTransparency=1; npcNameLbl.Text=""; npcNameLbl.TextColor3=Color3.fromRGB(255,200,80)
npcNameLbl.TextSize=17; npcNameLbl.Font=Enum.Font.GothamBold; npcNameLbl.TextXAlignment=Enum.TextXAlignment.Left
npcNameLbl.Parent=panel

local dialogText=Instance.new("TextLabel"); dialogText.Name="DialogText"
dialogText.Size=UDim2.new(1,-20,0,60); dialogText.Position=UDim2.new(0,12,0,38)
dialogText.BackgroundTransparency=1; dialogText.Text=""; dialogText.TextColor3=Color3.fromRGB(220,220,235)
dialogText.TextSize=14; dialogText.Font=Enum.Font.Gotham; dialogText.TextWrapped=true
dialogText.TextXAlignment=Enum.TextXAlignment.Left; dialogText.Parent=panel

local choicesFrame=Instance.new("Frame"); choicesFrame.Name="Choices"
choicesFrame.Size=UDim2.new(1,-20,0,150); choicesFrame.Position=UDim2.new(0,10,0,105)
choicesFrame.BackgroundTransparency=1; choicesFrame.Parent=panel

local layout=Instance.new("UIListLayout"); layout.Padding=UDim.new(0,6); layout.Parent=choicesFrame

local closeBtn=Instance.new("TextButton"); closeBtn.Size=UDim2.new(0,30,0,30)
closeBtn.Position=UDim2.new(1,-38,0,8); closeBtn.BackgroundColor3=Color3.fromRGB(160,40,40)
closeBtn.Text="✕"; closeBtn.TextColor3=Color3.white; closeBtn.TextSize=14; closeBtn.Font=Enum.Font.GothamBold
closeBtn.BorderSizePixel=0; closeBtn.Parent=panel
Instance.new("UICorner",closeBtn).CornerRadius=UDim.new(0,6)
closeBtn.Activated:Connect(function() closeDialogue() end)

local function typewrite(lbl:TextLabel, text:string)
  lbl.Text=""
  for i=1,#text do lbl.Text=text:sub(1,i); task.wait(0.025) end
end

function closeDialogue()
  isOpen=false
  TweenService:Create(panel,TweenInfo.new(0.25,Enum.EasingStyle.Quad,Enum.EasingDirection.In),
    {Position=UDim2.new(0.5,-290,1,-20)}):Play()
  task.delay(0.25,function() screen.Enabled=false end)
end

local function clearChoices()
  for _,c in ipairs(choicesFrame:GetChildren()) do if c:IsA("TextButton") then c:Destroy() end end
end

local function showResponse(npcData:any, response:string, consequence:string)
  clearChoices()
  task.spawn(typewrite, dialogText, response)
  -- Add "Back" button
  task.delay(0.5,function()
    local backBtn=Instance.new("TextButton"); backBtn.Size=UDim2.new(1,0,0,36)
    backBtn.BackgroundColor3=Color3.fromRGB(30,30,50); backBtn.Text="← Back"; backBtn.TextColor3=Color3.fromRGB(180,180,210)
    backBtn.TextSize=13; backBtn.Font=Enum.Font.Gotham; backBtn.BorderSizePixel=0; backBtn.Parent=choicesFrame
    Instance.new("UICorner",backBtn).CornerRadius=UDim.new(0,7)
    backBtn.Activated:Connect(function()
      clearChoices()
      task.spawn(typewrite,dialogText,npcData.greeting)
      task.delay(0.3,function() openChoices(npcData) end)
    end)
    -- Fire consequence event if set
    if consequence~="" then
      local RE=ReplicatedStorage:FindFirstChild("DialogueRE")
      if RE then RE:FireServer("consequence",consequence) end
    end
  end)
end

function openChoices(npcData:any)
  clearChoices()
  for i,choice in ipairs(npcData.choices or {}) do
    local btn=Instance.new("TextButton"); btn.Size=UDim2.new(1,0,0,34)
    btn.BackgroundColor3=Color3.fromRGB(22,22,38); btn.Text=i..". "..choice.text
    btn.TextColor3=Color3.fromRGB(200,210,255); btn.TextSize=13; btn.Font=Enum.Font.Gotham
    btn.TextXAlignment=Enum.TextXAlignment.Left; btn.BorderSizePixel=0; btn.Parent=choicesFrame
    local pl=Instance.new("UIPadding"); pl.PaddingLeft=UDim.new(0,10); pl.Parent=btn
    Instance.new("UICorner",btn).CornerRadius=UDim.new(0,7)
    local ch=choice
    btn.Activated:Connect(function() showResponse(npcData,ch.response,ch.consequence or "") end)
    btn.MouseEnter:Connect(function() btn.BackgroundColor3=Color3.fromRGB(35,35,60) end)
    btn.MouseLeave:Connect(function() btn.BackgroundColor3=Color3.fromRGB(22,22,38) end)
  end
  choicesFrame.CanvasSize=UDim2.new(0,0,0,layout.AbsoluteContentSize.Y)
end

function _G.OpenDialogue(npcName:string)
  local npcData=NPC_DATA[npcName]; if not npcData then return end
  isOpen=true; screen.Enabled=true
  panel.Position=UDim2.new(0.5,-290,1,-20)
  TweenService:Create(panel,TweenInfo.new(0.35,Enum.EasingStyle.Back,Enum.EasingDirection.Out),
    {Position=UDim2.new(0.5,-290,1,-290)}):Play()
  npcNameLbl.Text=npcName
  clearChoices()
  task.spawn(typewrite,dialogText,npcData.greeting)
  task.delay(0.4,function() openChoices(npcData) end)
end

-- ProximityPrompt auto-detection: Parts named "NPC_<npcName>" get prompts
local function setupNPCPrompts()
  for _,obj in ipairs(workspace:GetDescendants()) do
    if obj.Name:sub(1,4)=="NPC_" and obj:IsA("BasePart") then
      local npcName=obj.Name:sub(5)
      if NPC_DATA[npcName] and not obj:FindFirstChildOfClass("ProximityPrompt") then
        local pp=Instance.new("ProximityPrompt"); pp.ActionText="Talk"; pp.ObjectText=npcName
        pp.HoldDuration=0; pp.MaxActivationDistance=8; pp.Parent=obj
        pp.Triggered:Connect(function(p) if p==player then _G.OpenDialogue(npcName) end end)
      end
    end
  end
end
setupNPCPrompts()
workspace.DescendantAdded:Connect(function(obj)
  task.wait(); if obj.Name:sub(1,4)=="NPC_" and obj:IsA("BasePart") then setupNPCPrompts() end
end)

local RE=ReplicatedStorage:WaitForChild("CutsceneRE",2) -- reuse CutsceneRE or make own
local DialogueRE=Instance.new("RemoteEvent"); DialogueRE.Name="DialogueRE"; DialogueRE.Parent=ReplicatedStorage
print("[DialogueTree] Ready. ${npcs.length} NPC(s) defined")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. ELEVATOR SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface ElevatorSystemParams {
  floors?: number
  floorHeight?: number
  speed?: number
}

export function elevatorSystem(params: ElevatorSystemParams): string {
  const floors = num(params.floors ?? 5, 2, 50)
  const floorHeight = Math.max(5, params.floorHeight ?? 12)
  const speed = Math.max(1, params.speed ?? 8)

  return `-- ══ Elevator System (Script inside Elevator Model in workspace) ══
-- Floors: ${floors} | Height: ${floorHeight} studs/floor | Speed: ${speed}
local TweenService=game:GetService("TweenService"); local Players=game:GetService("Players")

local elevator=script.Parent  -- Model: must contain "Platform", "DoorLeft", "DoorRight"
local platform=elevator:FindFirstChild("Platform")  -- The moving floor Part (Anchored)
local doorL=elevator:FindFirstChild("DoorLeft")
local doorR=elevator:FindFirstChild("DoorRight")

assert(platform,"[Elevator] No 'Platform' Part found in elevator model")

local FLOORS=${floors}; local FLOOR_HEIGHT=${floorHeight}; local SPEED=${speed}
local BASE_Y=platform.Position.Y  -- Y position of floor 1
local currentFloor=1; local isMoving=false; local doorOpen=false

-- Weld passengers to platform
local welds:{[Model]:WeldConstraint}={}
local function weldPassenger(char:Model)
  local hrp=char:FindFirstChild("HumanoidRootPart") :: BasePart?
  if not hrp or welds[char] then return end
  local w=Instance.new("WeldConstraint"); w.Part0=platform; w.Part1=hrp; w.Parent=platform
  welds[char]=w
end
local function unweldPassenger(char:Model)
  local w=welds[char]; if w then w:Destroy(); welds[char]=nil end
end

platform.Touched:Connect(function(hit)
  local char=hit.Parent :: Model?
  if char and Players:GetPlayerFromCharacter(char) then weldPassenger(char) end
end)
platform.TouchEnded:Connect(function(hit)
  local char=hit.Parent :: Model?
  if char then unweldPassenger(char) end
end)

local function getFloorY(floorNum:number):number
  return BASE_Y+(floorNum-1)*FLOOR_HEIGHT
end

local function tweenDoors(open:boolean)
  if not doorL or not doorR then return end
  local offset=open and 2.5 or 0
  local lTarget=doorL.Position-Vector3.new(offset,0,0)
  local rTarget=doorR.Position+Vector3.new(offset,0,0)
  -- Store original positions
  if not elevator:GetAttribute("DoorLBaseX") then
    elevator:SetAttribute("DoorLBaseX",doorL.Position.X)
    elevator:SetAttribute("DoorRBaseX",doorR.Position.X)
  end
  local lBase=elevator:GetAttribute("DoorLBaseX") :: number
  local rBase=elevator:GetAttribute("DoorRBaseX") :: number
  TweenService:Create(doorL,TweenInfo.new(0.6,Enum.EasingStyle.Quad),
    {Position=Vector3.new(lBase-(open and 2.5 or 0),doorL.Position.Y,doorL.Position.Z)}):Play()
  TweenService:Create(doorR,TweenInfo.new(0.6,Enum.EasingStyle.Quad),
    {Position=Vector3.new(rBase+(open and 2.5 or 0),doorR.Position.Y,doorR.Position.Z)}):Play()
  task.wait(0.65); doorOpen=open
end

local function goToFloor(targetFloor:number)
  if isMoving or targetFloor==currentFloor then return end
  if targetFloor<1 or targetFloor>FLOORS then return end
  isMoving=true

  -- Close doors first
  if doorOpen then tweenDoors(false); task.wait(0.3) end

  local targetY=getFloorY(targetFloor)
  local dist=math.abs(targetY-platform.Position.Y)
  local travelTime=dist/SPEED

  TweenService:Create(platform,TweenInfo.new(travelTime,Enum.EasingStyle.Quad,Enum.EasingDirection.InOut),
    {Position=Vector3.new(platform.Position.X,targetY,platform.Position.Z)}):Play()
  task.wait(travelTime)

  currentFloor=targetFloor; isMoving=false

  -- Open doors
  tweenDoors(true)
  -- Auto-close after 4 seconds
  task.delay(4,function()
    if not isMoving then tweenDoors(false) end
  end)
end

-- Call buttons: Parts named "ElevatorButton_<floor>" anywhere in workspace trigger goToFloor
local function setupButtons()
  for _,obj in ipairs(workspace:GetDescendants()) do
    if obj.Name:sub(1,15)=="ElevatorButton_" then
      local floorNum=tonumber(obj.Name:sub(16))
      if floorNum and obj:IsA("BasePart") then
        -- Create ProximityPrompt
        local pp=obj:FindFirstChildOfClass("ProximityPrompt")
        if not pp then
          pp=Instance.new("ProximityPrompt"); pp.ActionText="Call"; pp.ObjectText="Floor "..floorNum
          pp.HoldDuration=0; pp.MaxActivationDistance=5; pp.Parent=obj
        end
        pp.Triggered:Connect(function() goToFloor(floorNum) end)

        -- Lit indicator
        local light=obj:FindFirstChild("Light") :: PointLight?
        if light then light.Enabled=floorNum==currentFloor end
      end
    end
  end
end

-- Floor indicator display (Parts named "FloorIndicator" near elevator show current floor)
local function updateIndicators()
  for _,obj in ipairs(workspace:GetDescendants()) do
    if obj.Name=="FloorIndicator" and obj:IsA("BasePart") then
      local surf=obj:FindFirstChildOfClass("SurfaceGui")
      if surf then
        local lbl=surf:FindFirstChildOfClass("TextLabel")
        if lbl then lbl.Text=tostring(currentFloor) end
      end
    end
  end
end

-- Open doors at start
task.wait(1); tweenDoors(true)
setupButtons()
updateIndicators()

-- Listen for remote call (from button scripts on other floors)
local RE=game:GetService("ReplicatedStorage"):FindFirstChild("ElevatorRE")
if not RE then
  RE=Instance.new("RemoteEvent"); RE.Name="ElevatorRE"; RE.Parent=game:GetService("ReplicatedStorage")
end
RE.OnServerEvent:Connect(function(player,targetFloor)
  if type(targetFloor)=="number" then goToFloor(math.floor(targetFloor)) end
end)

print("[Elevator] Ready. "..FLOORS.." floors, base Y="..BASE_Y)")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. TELEPORTER NETWORK SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface TeleporterNetworkParams {
  cooldownSeconds?: number
  pairs?: Array<[string, string]>
}

export function teleporterNetworkSystem(params: TeleporterNetworkParams): string {
  const cooldown = Math.max(0, params.cooldownSeconds ?? 3)
  const pairs = params.pairs ?? [['TeleportA', 'TeleportB'], ['TeleportC', 'TeleportD']]
  const pairsStr = pairs.map(([a, b]: [string, string]) => `  { "${safe(a)}", "${safe(b)}" },`).join('\n')

  return `-- ══ Teleporter Network System (Script in ServerScriptService) ══
-- Cooldown: ${cooldown}s
local Players=game:GetService("Players"); local TweenService=game:GetService("TweenService")

local COOLDOWN=${cooldown}
-- Pairs: each pair is two Part names in workspace. Touching either teleports to the other.
local PAIRS = {
${pairsStr}
}

local cooldowns:{[number]:number}={}

local function canTeleport(player:Player):boolean
  local last=cooldowns[player.UserId] or 0
  return tick()-last>=COOLDOWN
end

local function teleportPlayer(player:Player, dest:BasePart)
  if not canTeleport(player) then return end
  local char=player.Character; if not char then return end
  local hrp=char:FindFirstChild("HumanoidRootPart") :: BasePart?
  if not hrp then return end
  cooldowns[player.UserId]=tick()

  -- Particle effect at source
  local srcParticle=Instance.new("Part"); srcParticle.Size=Vector3.new(0.1,0.1,0.1)
  srcParticle.Position=hrp.Position; srcParticle.Anchored=true; srcParticle.CanCollide=false
  srcParticle.Transparency=1; srcParticle.Parent=workspace
  local pe=Instance.new("ParticleEmitter"); pe.Color=ColorSequence.new(Color3.fromRGB(100,150,255))
  pe.LightEmission=0.8; pe.Size=NumberSequence.new(0.5,0); pe.Speed=NumberRange.new(8,15)
  pe.Lifetime=NumberRange.new(0.3,0.6); pe.Rate=80; pe.Parent=srcParticle
  task.delay(0.5,function() srcParticle:Destroy() end)

  -- Sound
  local sound=Instance.new("Sound"); sound.SoundId="rbxasset://sounds/electronicpingshort.wav"
  sound.Volume=0.6; sound.Parent=hrp; sound:Play()
  task.delay(1,function() sound:Destroy() end)

  -- Teleport
  hrp.CFrame=dest.CFrame+Vector3.new(0,3,0)
end

local function setupPad(padA:BasePart, padB:BasePart)
  -- Visual: neon glow
  padA.Material=Enum.Material.Neon; padB.Material=Enum.Material.Neon
  padA.Color=Color3.fromRGB(80,140,255); padB.Color=Color3.fromRGB(80,140,255)

  -- Billboard labels
  for _,pad in ipairs({padA,padB}) do
    local bb=Instance.new("BillboardGui"); bb.Size=UDim2.new(0,100,0,30)
    bb.StudsOffset=Vector3.new(0,3,0); bb.AlwaysOnTop=false; bb.Parent=pad
    local lbl=Instance.new("TextLabel"); lbl.Size=UDim2.new(1,0,1,0); lbl.BackgroundTransparency=1
    lbl.Text="✦ Teleport"; lbl.TextColor3=Color3.fromRGB(180,210,255); lbl.TextSize=13
    lbl.Font=Enum.Font.GothamMedium; lbl.Parent=bb
  end

  padA.Touched:Connect(function(hit)
    local char=hit.Parent :: Model?
    local player=char and Players:GetPlayerFromCharacter(char)
    if player then teleportPlayer(player,padB) end
  end)
  padB.Touched:Connect(function(hit)
    local char=hit.Parent :: Model?
    local player=char and Players:GetPlayerFromCharacter(char)
    if player then teleportPlayer(player,padA) end
  end)
end

for _,pair in ipairs(PAIRS) do
  local padA=workspace:FindFirstChild(pair[1]) :: BasePart?
  local padB=workspace:FindFirstChild(pair[2]) :: BasePart?
  if padA and padB then setupPad(padA,padB)
  else warn("[Teleporter] Parts not found: "..pair[1].." / "..pair[2]) end
end

Players.PlayerRemoving:Connect(function(p) cooldowns[p.UserId]=nil end)
print("[TeleporterNetwork] Ready. "..#PAIRS.." pairs. Cooldown=${cooldown}s")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. TRAIN / MONORAIL SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface TrainMonorailParams {
  speed?: number
  stationCount?: number
  stopDuration?: number
}

export function trainMonorailSystem(params: TrainMonorailParams): string {
  const speed = Math.max(5, params.speed ?? 20)
  const stations = num(params.stationCount ?? 4, 2, 20)
  const stopDur = Math.max(2, params.stopDuration ?? 5)

  return `-- ══ Train / Monorail System (Script inside Train Model in workspace) ══
-- Speed: ${speed} | Stations: ${stations} | Stop: ${stopDur}s
local TweenService=game:GetService("TweenService"); local Players=game:GetService("Players")

-- Train model must have a PrimaryPart (engine) and optional "DoorLeft","DoorRight" parts
local train=script.Parent
local engine=train.PrimaryPart or train:FindFirstChildWhichIsA("BasePart")
assert(engine,"[Train] Train model needs a PrimaryPart")

local SPEED=${speed}; local STOP_DURATION=${stopDur}; local STATION_COUNT=${stations}
local isMoving=false; local currentStation=1

-- Stations: Parts named "TrainStation_1", "TrainStation_2"... in workspace
local function getStation(idx:number):BasePart?
  return workspace:FindFirstChild("TrainStation_"..idx) :: BasePart?
end

-- Weld passengers
local welds:{[Model]:WeldConstraint}={}
local function weldChar(char:Model)
  local hrp=char:FindFirstChild("HumanoidRootPart") :: BasePart?
  if hrp and not welds[char] then
    local w=Instance.new("WeldConstraint"); w.Part0=engine; w.Part1=hrp; w.Parent=engine; welds[char]=w
  end
end
local function unweldChar(char:Model)
  local w=welds[char]; if w then w:Destroy(); welds[char]=nil end
end

engine.Touched:Connect(function(hit)
  local char=hit.Parent :: Model?
  if char and Players:GetPlayerFromCharacter(char) then weldChar(char) end
end)
engine.TouchEnded:Connect(function(hit)
  local char=hit.Parent :: Model?
  if char then unweldChar(char) end
end)

-- Door control
local function setDoors(open:boolean)
  local doorL=train:FindFirstChild("DoorLeft"); local doorR=train:FindFirstChild("DoorRight")
  if not doorL or not doorR then return end
  if not train:GetAttribute("DLBase") then
    train:SetAttribute("DLBase",doorL.Position.X); train:SetAttribute("DRBase",doorR.Position.X)
  end
  local dlb=train:GetAttribute("DLBase") :: number; local drb=train:GetAttribute("DRBase") :: number
  TweenService:Create(doorL,TweenInfo.new(0.6,Enum.EasingStyle.Quad),
    {Position=Vector3.new(dlb-(open and 3 or 0),doorL.Position.Y,doorL.Position.Z)}):Play()
  TweenService:Create(doorR,TweenInfo.new(0.6,Enum.EasingStyle.Quad),
    {Position=Vector3.new(drb+(open and 3 or 0),doorR.Position.Y,doorR.Position.Z)}):Play()
  task.wait(0.65)
end

-- Announce via chat / notification
local function announce(msg:string)
  local RE=game:GetService("ReplicatedStorage"):FindFirstChild("NotificationRE")
  if RE then RE:FireAllClients("[Train] "..msg,"info",4) end
end

-- Main train loop
task.spawn(function()
  while true do
    local station=getStation(currentStation)
    if station then
      -- Tween to station
      local dist=(station.Position-engine.Position).Magnitude
      local travelTime=dist/SPEED
      if travelTime>0.1 then
        isMoving=true
        TweenService:Create(engine,TweenInfo.new(travelTime,Enum.EasingStyle.Quad,Enum.EasingDirection.InOut),
          {CFrame=CFrame.new(station.Position+Vector3.new(0,1,0),station.Position+Vector3.new(0,1,1))}):Play()
        task.wait(travelTime)
        isMoving=false
      end

      -- Arrived at station
      announce("Arrived at Station "..currentStation)
      setDoors(true)
      task.wait(STOP_DURATION)
      setDoors(false)
      task.wait(0.5)
    else
      task.wait(1)
    end

    -- Advance to next station (loop)
    currentStation=(currentStation%STATION_COUNT)+1
  end
end)

print("[Train] Running. "..STATION_COUNT.." stations, speed="..SPEED)")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 21. CAPTURE THE FLAG SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface CaptureTheFlagParams {
  scoreToWin?: number
  respawnTime?: number
  teams?: [string, string]
}

export function captureTheFlagSystem(params: CaptureTheFlagParams): string {
  const scoreToWin = num(params.scoreToWin ?? 3, 1)
  const respawnTime = Math.max(1, params.respawnTime ?? 5)
  const teams = params.teams ?? ['RedTeam', 'BlueTeam']
  const team1 = safe(teams[0] ?? 'RedTeam')
  const team2 = safe(teams[1] ?? 'BlueTeam')

  return `-- ══ Capture The Flag System (ServerScriptService) ══
-- Score to win: ${scoreToWin} | Respawn: ${respawnTime}s | Teams: ${team1} vs ${team2}
local Players=game:GetService("Players"); local Teams=game:GetService("Teams")
local ReplicatedStorage=game:GetService("ReplicatedStorage")

local SCORE_TO_WIN=${scoreToWin}; local RESPAWN_TIME=${respawnTime}
local TEAM_NAMES={"${team1}","${team2}"}

local RE=Instance.new("RemoteEvent"); RE.Name="CTFRE"; RE.Parent=ReplicatedStorage
local RF=Instance.new("RemoteFunction"); RF.Name="CTFRF"; RF.Parent=ReplicatedStorage

-- Game state
local scores:{[string]:number}={["${team1}"]=0,["${team2}"]=0}
local flagCarriers:{[string]:Player?}={["${team1}"]=nil,["${team2}"]=nil}
local flagHome:{[string]:boolean}={["${team1}"]=true,["${team2}"]=true}
local gameActive=false

-- Create teams if not exist
for _,tName in ipairs(TEAM_NAMES) do
  if not Teams:FindFirstChild(tName) then
    local t=Instance.new("Team"); t.Name=tName; t.TeamColor=tName=="${team1}" and BrickColor.new("Bright red") or BrickColor.new("Bright blue")
    t.AutoAssignable=true; t.Parent=Teams
  end
end

local function getPlayerTeam(player:Player):string?
  local t=player.Team; return t and t.Name or nil
end

local function broadcastScore()
  RE:FireAllClients("ScoreUpdate",scores)
end

local function broadcastFlagStatus()
  RE:FireAllClients("FlagStatus",{carriers={["${team1}"]=flagCarriers["${team1}"] and flagCarriers["${team1}"].Name,["${team2}"]=flagCarriers["${team2}"] and flagCarriers["${team2}"].Name},home=flagHome})
end

local function getEnemyTeam(team:string):string
  return team==TEAM_NAMES[1] and TEAM_NAMES[2] or TEAM_NAMES[1]
end

local function getFlag(teamName:string):BasePart?
  local flagFolder=workspace:FindFirstChild("CTFFlags")
  return flagFolder and flagFolder:FindFirstChild(teamName.."_Flag") :: BasePart?
end

local function returnFlagToBase(teamName:string)
  local flag=getFlag(teamName); if not flag then return end
  local base=workspace:FindFirstChild("CTFBases") and workspace:FindFirstChild("CTFBases"):FindFirstChild(teamName.."_Base") :: BasePart?
  if base then flag.CFrame=base.CFrame+Vector3.new(0,2,0) end
  flag.Anchored=true; flagHome[teamName]=true; flagCarriers[teamName]=nil
  RE:FireAllClients("FlagReturned",{team=teamName})
  broadcastFlagStatus()
end

-- Flag touch detection
local function setupFlagTouches()
  for _,teamName in ipairs(TEAM_NAMES) do
    local flag=getFlag(teamName)
    if not flag then warn("[CTF] Flag not found: "..teamName.."_Flag"); continue end
    flag.Touched:Connect(function(hit)
      if not gameActive then return end
      local char=hit.Parent :: Model?
      local player=char and Players:GetPlayerFromCharacter(char)
      if not player then return end
      local playerTeam=getPlayerTeam(player)
      if not playerTeam then return end
      local enemyTeam=getEnemyTeam(playerTeam)
      if teamName==enemyTeam and flagHome[teamName] then
        -- Pick up enemy flag
        flagHome[teamName]=false; flagCarriers[teamName]=player
        flag.Anchored=false
        local bv=Instance.new("BodyPosition"); bv.MaxForce=Vector3.new(1e5,1e5,1e5); bv.Parent=flag
        RE:FireAllClients("FlagPickedUp",{team=teamName,carrier=player.Name})
        broadcastFlagStatus()

        -- Track carrier
        task.spawn(function()
          while flagCarriers[teamName]==player and player.Parent do
            local c=player.Character
            local hrp=c and c:FindFirstChild("HumanoidRootPart") :: BasePart?
            if hrp and bv.Parent then bv.Position=hrp.Position+Vector3.new(0,3,0) end
            task.wait(0.05)
          end
        end)

        -- Check if carrier already has own flag at base
        if flagHome[playerTeam] then
          -- CAPTURE!
          scores[playerTeam]+=1; broadcastScore()
          RE:FireAllClients("FlagCaptured",{team=playerTeam,scorer=player.Name,score=scores[playerTeam]})
          returnFlagToBase(teamName)
          if scores[playerTeam]>=SCORE_TO_WIN then
            RE:FireAllClients("GameOver",{winner=playerTeam,scores=scores})
            gameActive=false; scores={}; for _,t in TEAM_NAMES do scores[t]=0 end
          end
        end
      elseif teamName==playerTeam and not flagHome[teamName] and not flagCarriers[teamName] then
        -- Return own dropped flag
        returnFlagToBase(teamName)
        RE:FireAllClients("Notification",{text="Flag returned by "..player.Name,type="info"})
      end
    end)
  end
end

-- Respawn on death
Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local hum=char:WaitForChild("Humanoid") :: Humanoid
    hum.Died:Connect(function()
      -- Drop flag if carrying
      for teamName,carrier in flagCarriers do
        if carrier==player then
          flagCarriers[teamName]=nil
          local flag=getFlag(teamName)
          if flag then
            local bv=flag:FindFirstChildOfClass("BodyPosition")
            if bv then bv:Destroy() end
            flag.Anchored=true
          end
          broadcastFlagStatus()
        end
      end
      task.delay(RESPAWN_TIME,function()
        if player.Parent then player:LoadCharacter() end
      end)
    end)
  end)
end)

RF.OnServerInvoke=function(player,action):any
  if action=="start" then gameActive=true; setupFlagTouches(); RE:FireAllClients("GameStart"); return true
  elseif action=="getScore" then return scores
  elseif action=="getFlags" then return {home=flagHome,carriers={["${team1}"]=flagCarriers["${team1}"] and flagCarriers["${team1}"].Name,["${team2}"]=flagCarriers["${team2}"] and flagCarriers["${team2}"].Name}}
  end
  return false,"Unknown"
end

print("[CaptureTheFlag] Ready. Win at ${scoreToWin} caps. Teams: ${team1} vs ${team2}")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 22. PROXIMITY INTERACTION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface ProximityInteractionParams {
  interactions?: Array<{ partName: string; actionText: string; objectText: string; holdDuration?: number; serverEvent?: string }>
  maxDistance?: number
}

export function proximityInteractionSystem(params: ProximityInteractionParams): string {
  const maxDist = Math.max(3, params.maxDistance ?? 8)
  const interactions = params.interactions ?? [
    { partName: 'Chest', actionText: 'Open', objectText: 'Treasure Chest', holdDuration: 0, serverEvent: 'OpenChest' },
    { partName: 'Anvil', actionText: 'Craft', objectText: 'Blacksmith Anvil', holdDuration: 1, serverEvent: 'OpenCrafting' },
    { partName: 'Portal', actionText: 'Enter', objectText: 'Dungeon Portal', holdDuration: 0.5, serverEvent: 'EnterPortal' },
  ]
  const interactionDefs = interactions.map((i: any) =>
    `  { partName="${safe(i.partName||'Part')}", action="${safeLuauString(i.actionText||'Use')}", object="${safeLuauString(i.objectText||'')}", hold=${Math.max(0,i.holdDuration??0)}, event="${safe(i.serverEvent||'Interact')}" },`
  ).join('\n')

  return `-- ══ Proximity Interaction System (ServerScriptService) ══
-- MaxDist: ${maxDist}
local Players=game:GetService("Players"); local ReplicatedStorage=game:GetService("ReplicatedStorage")

local MAX_DISTANCE=${maxDist}
local INTERACTIONS = {
${interactionDefs}
}

local RE=Instance.new("RemoteEvent"); RE.Name="InteractionRE"; RE.Parent=ReplicatedStorage

-- Setup ProximityPrompts on all matching parts
local function setupInteraction(def:any)
  for _,obj in ipairs(workspace:GetDescendants()) do
    if obj.Name==def.partName and obj:IsA("BasePart") then
      local existing=obj:FindFirstChildOfClass("ProximityPrompt")
      if existing then continue end
      local pp=Instance.new("ProximityPrompt")
      pp.ActionText=def.action; pp.ObjectText=def.object
      pp.HoldDuration=def.hold; pp.MaxActivationDistance=MAX_DISTANCE
      pp.RequiresLineOfSight=false; pp.Parent=obj

      pp.Triggered:Connect(function(player:Player)
        -- Condition checks can be added here (inventory, level, etc.)
        RE:FireAllClients("InteractionTriggered",{player=player.Name,event=def.event,partName=def.partName})
        RE:FireClient(player,"Interact",{event=def.event,part=obj})
      end)

      -- Visual feedback: prompt style
      pp.UIOffset=Vector2.new(0,25)
      print("[ProximityInteraction] Setup '"..def.action.."' on "..obj:GetFullName())
    end
  end
end

for _,def in ipairs(INTERACTIONS) do setupInteraction(def) end

-- Re-run when new parts added
workspace.DescendantAdded:Connect(function(obj)
  if not obj:IsA("BasePart") then return end
  task.wait()
  for _,def in ipairs(INTERACTIONS) do
    if obj.Name==def.partName and not obj:FindFirstChildOfClass("ProximityPrompt") then
      setupInteraction(def)
    end
  end
end)

-- Server handler for interactions: fire BindableEvent so other systems can hook in
local interactBE=Instance.new("BindableEvent"); interactBE.Name="OnInteract"; interactBE.Parent=game:GetService("ServerStorage")
RE.OnServerEvent:Connect(function(player,eventName,...)
  interactBE:Fire(player,eventName,...)
end)

print("[ProximityInteraction] Ready. "..#INTERACTIONS.." interaction types")`
}

// ─────────────────────────────────────────────────────────────────────────────
// 23. DATASTORE WRAPPER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface DataStoreWrapperParams {
  storeName?: string
  maxRetries?: number
  sessionLockSeconds?: number
  defaultData?: Record<string, unknown>
}

export function dataStoreWrapperSystem(params: DataStoreWrapperParams): string {
  const storeName = safe(params.storeName ?? 'GameData')
  const maxRetries = num(params.maxRetries ?? 3, 1, 10)
  const sessionLock = num(params.sessionLockSeconds ?? 30, 10)
  const defaultDataStr = JSON.stringify(params.defaultData ?? { coins: 0, level: 1, xp: 0, inventory: [] }, null, 2)
    .replace(/\n/g, '\n  ')

  return `-- ══ DataStore Wrapper System (ModuleScript in ServerStorage) ══
-- Store: ${storeName} | Retries: ${maxRetries} | SessionLock: ${sessionLock}s
local DataStoreService=game:GetService("DataStoreService")
local Players=game:GetService("Players")
local RunService=game:GetService("RunService")

local STORE_NAME="${storeName}"
local MAX_RETRIES=${maxRetries}
local SESSION_LOCK_SECONDS=${sessionLock}
local RETRY_DELAY=1.5

local mainStore=DataStoreService:GetDataStore(STORE_NAME.."_v1")
local lockStore=DataStoreService:GetDataStore(STORE_NAME.."_Locks")

-- Default data shape (will be deep-merged with saved data)
local DEFAULT_DATA = {
  coins=0, level=1, xp=0,
  inventory={},
  createdAt=os.time(),
  version=1,
}

-- ── Utility ──
local function deepMerge(defaults:any, saved:any):any
  local result={}
  for k,v in pairs(defaults) do result[k]=v end
  if type(saved)~="table" then return result end
  for k,v in pairs(saved) do
    if type(v)=="table" and type(result[k])=="table" then
      result[k]=deepMerge(result[k],v)
    else
      result[k]=v
    end
  end
  return result
end

local function validateData(data:any):boolean
  if type(data)~="table" then return false end
  if type(data.coins)~="number" then return false end
  if type(data.level)~="number" then return false end
  return true
end

local function migrateData(data:any):any
  -- Version migration: add new fields as needed
  data.version=data.version or 1
  if data.version<1 then data.coins=data.cash or 0 end  -- example migration
  data.version=1
  return data
end

-- ── Session lock ──
local function acquireLock(userId:number):boolean
  local key="lock_"..userId
  local acquired=false
  for attempt=1,3 do
    local ok,err=pcall(function()
      lockStore:UpdateAsync(key,function(current)
        local now=os.time()
        if current and type(current)=="table" and (now-current.time)<SESSION_LOCK_SECONDS then
          return nil -- lock held
        end
        acquired=true
        return {jobId=game.JobId, time=now}
      end)
    end)
    if acquired then return true end
    if attempt<3 then task.wait(RETRY_DELAY) end
  end
  return false
end

local function releaseLock(userId:number)
  local key="lock_"..userId
  pcall(function()
    lockStore:UpdateAsync(key,function(current)
      if current and type(current)=="table" and current.jobId==game.JobId then
        return nil
      end
      return current
    end)
  end)
end

-- ── Core API ──
local DataWrapper={}
DataWrapper.__index=DataWrapper

local sessions:{[number]:any}={}

function DataWrapper.load(player:Player):(boolean,string)
  local userId=player.UserId
  if sessions[userId] then return true,"Already loaded" end

  -- Acquire session lock
  if not acquireLock(userId) then
    return false,"Session lock held by another server"
  end

  local data=nil
  local success=false
  for attempt=1,MAX_RETRIES do
    local ok,result=pcall(function()
      return mainStore:GetAsync("player_"..userId)
    end)
    if ok then data=result; success=true; break end
    if attempt<MAX_RETRIES then task.wait(RETRY_DELAY*attempt) end
  end

  if not success then
    releaseLock(userId)
    return false,"Failed to load data after "..MAX_RETRIES.." attempts"
  end

  -- Merge with defaults and migrate
  local merged=deepMerge(DEFAULT_DATA, type(data)=="table" and data or {})
  merged=migrateData(merged)

  if not validateData(merged) then
    warn("[DataStore] Invalid data for "..player.Name..", using defaults")
    merged=deepMerge(DEFAULT_DATA,{})
  end

  sessions[userId]={data=merged,dirty=false,player=player}
  return true,"Loaded"
end

function DataWrapper.get(player:Player, key:string):any
  local s=sessions[player.UserId]; if not s then return nil end
  return s.data[key]
end

function DataWrapper.set(player:Player, key:string, value:any)
  local s=sessions[player.UserId]; if not s then return end
  s.data[key]=value; s.dirty=true
end

function DataWrapper.increment(player:Player, key:string, amount:number)
  local s=sessions[player.UserId]; if not s then return end
  if type(s.data[key])=="number" then
    s.data[key]=s.data[key]+amount; s.dirty=true
  end
end

function DataWrapper.save(player:Player):(boolean,string)
  local userId=player.UserId
  local s=sessions[userId]; if not s then return false,"No session" end
  if not s.dirty then return true,"No changes" end

  for attempt=1,MAX_RETRIES do
    local ok,err=pcall(function()
      mainStore:UpdateAsync("player_"..userId,function(current)
        return s.data
      end)
    end)
    if ok then s.dirty=false; return true,"Saved" end
    if attempt<MAX_RETRIES then task.wait(RETRY_DELAY*attempt) end
    warn("[DataStore] Save attempt "..attempt.." failed for "..player.Name..": "..tostring(err))
  end
  return false,"Save failed after "..MAX_RETRIES.." attempts"
end

function DataWrapper.unload(player:Player)
  local userId=player.UserId
  DataWrapper.save(player)
  releaseLock(userId)
  sessions[userId]=nil
end

-- Auto-save every 60 seconds
task.spawn(function()
  while true do
    task.wait(60)
    for userId,session in sessions do
      if session.dirty then
        local p=Players:GetPlayerByUserId(userId)
        if p then DataWrapper.save(p) end
      end
    end
  end
end)

-- Lifecycle
Players.PlayerAdded:Connect(function(p) DataWrapper.load(p) end)
Players.PlayerRemoving:Connect(function(p) DataWrapper.unload(p) end)
game:BindToClose(function()
  for _,p in ipairs(Players:GetPlayers()) do DataWrapper.unload(p) end
end)

-- Expose as module
return DataWrapper`
}

// ─────────────────────────────────────────────────────────────────────────────
// 24. UI TWEEN LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

export interface UITweenLibraryParams {
  defaultDuration?: number
}

export function uiTweenLibrary(params: UITweenLibraryParams): string {
  const dur = Math.max(0.05, params.defaultDuration ?? 0.3)

  return `-- ══ UI Tween Library (ModuleScript in ReplicatedStorage) ══
-- Default duration: ${dur}s
local TweenService=game:GetService("TweenService")
local UITween={}

local DEFAULT_DUR=${dur}

-- ── slideIn: slides a GUI element in from a direction ──
-- dir: "left"|"right"|"top"|"bottom"
function UITween.slideIn(element:GuiObject, dir:string?, duration:number?)
  dir=dir or "left"; duration=duration or DEFAULT_DUR
  local original=element.Position
  local offset
  if dir=="left"     then offset=UDim2.new(-1,0,0,0)
  elseif dir=="right"  then offset=UDim2.new(1,0,0,0)
  elseif dir=="top"    then offset=UDim2.new(0,0,-1,0)
  elseif dir=="bottom" then offset=UDim2.new(0,0,1,0)
  else offset=UDim2.new(-1,0,0,0) end
  element.Position=original+offset; element.Visible=true
  TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Quad,Enum.EasingDirection.Out),
    {Position=original}):Play()
end

-- ── slideOut: slides a GUI element out ──
function UITween.slideOut(element:GuiObject, dir:string?, duration:number?, callback:(()->())?)
  dir=dir or "left"; duration=duration or DEFAULT_DUR
  local offset
  if dir=="left"     then offset=UDim2.new(-1,0,0,0)
  elseif dir=="right"  then offset=UDim2.new(1,0,0,0)
  elseif dir=="top"    then offset=UDim2.new(0,0,-1,0)
  elseif dir=="bottom" then offset=UDim2.new(0,0,1,0)
  else offset=UDim2.new(-1,0,0,0) end
  local target=element.Position+offset
  local tween=TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Quad,Enum.EasingDirection.In),{Position=target})
  tween:Play()
  tween.Completed:Connect(function() element.Visible=false; if callback then callback() end end)
end

-- ── fadeIn ──
function UITween.fadeIn(element:GuiObject, duration:number?, targetTransparency:number?)
  duration=duration or DEFAULT_DUR; targetTransparency=targetTransparency or 0
  element.BackgroundTransparency=1; element.Visible=true
  TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Linear),
    {BackgroundTransparency=targetTransparency}):Play()
end

-- ── fadeOut ──
function UITween.fadeOut(element:GuiObject, duration:number?, callback:(()->())?)
  duration=duration or DEFAULT_DUR
  local tween=TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Linear),{BackgroundTransparency=1})
  tween:Play()
  tween.Completed:Connect(function() element.Visible=false; if callback then callback() end end)
end

-- ── popIn: scale from 0 with a bounce ──
function UITween.popIn(element:GuiObject, duration:number?)
  duration=duration or (DEFAULT_DUR*1.3)
  local originalSize=element.Size
  element.Size=UDim2.new(0,0,0,0); element.Visible=true
  TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Back,Enum.EasingDirection.Out),
    {Size=originalSize}):Play()
end

-- ── popOut ──
function UITween.popOut(element:GuiObject, duration:number?, callback:(()->())?)
  duration=duration or DEFAULT_DUR
  local tween=TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Back,Enum.EasingDirection.In),
    {Size=UDim2.new(0,0,0,0)})
  tween:Play()
  tween.Completed:Connect(function() element.Visible=false; if callback then callback() end end)
end

-- ── shake: rapid left-right oscillation ──
function UITween.shake(element:GuiObject, intensity:number?, duration:number?)
  intensity=intensity or 8; duration=duration or 0.4
  local originalPos=element.Position
  local steps=math.floor(duration/0.05)
  task.spawn(function()
    for i=1,steps do
      local offset=math.sin(i*math.pi*2)*intensity*(1-(i/steps))
      element.Position=originalPos+UDim2.new(0,offset,0,0)
      task.wait(0.05)
    end
    element.Position=originalPos
  end)
end

-- ── pulse: scale up and back repeatedly ──
function UITween.pulse(element:GuiObject, scale:number?, times:number?, interval:number?)
  scale=scale or 1.1; times=times or 3; interval=interval or 0.3
  local originalSize=element.Size
  task.spawn(function()
    for i=1,times do
      TweenService:Create(element,TweenInfo.new(interval*0.5,Enum.EasingStyle.Quad),
        {Size=UDim2.new(originalSize.X.Scale*scale,originalSize.X.Offset,originalSize.Y.Scale*scale,originalSize.Y.Offset)}):Play()
      task.wait(interval*0.5)
      TweenService:Create(element,TweenInfo.new(interval*0.5,Enum.EasingStyle.Quad),{Size=originalSize}):Play()
      task.wait(interval*0.5)
    end
  end)
end

-- ── typewriter: animate text letter by letter ──
function UITween.typewriter(label:TextLabel, text:string, speed:number?, callback:(()->())?)
  speed=speed or 0.035
  task.spawn(function()
    label.Text=""
    for i=1,#text do
      label.Text=text:sub(1,i); task.wait(speed)
    end
    if callback then callback() end
  end)
end

-- ── colorFlash: briefly flash background color ──
function UITween.colorFlash(element:Frame, flashColor:Color3, duration:number?)
  duration=duration or 0.2
  local original=element.BackgroundColor3
  element.BackgroundColor3=flashColor
  TweenService:Create(element,TweenInfo.new(duration,Enum.EasingStyle.Linear),{BackgroundColor3=original}):Play()
end

-- ── numberTween: animate a TextLabel number value ──
function UITween.numberTween(label:TextLabel, from:number, to:number, duration:number?, prefix:string?, suffix:string?)
  prefix=prefix or ""; suffix=suffix or ""; duration=duration or 0.5
  task.spawn(function()
    local startTime=tick()
    while true do
      local elapsed=tick()-startTime
      local t=math.min(elapsed/duration,1)
      local val=math.floor(from+(to-from)*t)
      label.Text=prefix..tostring(val)..suffix
      if t>=1 then break end
      task.wait(0.016)
    end
  end)
end

return UITween`
}

// ─────────────────────────────────────────────────────────────────────────────
// 25. SOUND MANAGER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface SoundManagerParams {
  musicTracks?: Array<{ name: string; id: string }>
  poolSize?: number
  defaultMusicVolume?: number
  defaultSfxVolume?: number
}

export function soundManagerSystem(params: SoundManagerParams): string {
  const poolSize = num(params.poolSize ?? 10, 2, 50)
  const musicVol = Math.max(0, Math.min(1, params.defaultMusicVolume ?? 0.6))
  const sfxVol = Math.max(0, Math.min(1, params.defaultSfxVolume ?? 1.0))
  const tracks = params.musicTracks ?? [
    { name: 'MainMenu', id: 'rbxassetid://0' },
    { name: 'Combat', id: 'rbxassetid://0' },
    { name: 'Ambient', id: 'rbxassetid://0' },
  ]
  const trackDefs = tracks.map((t: any) =>
    `  ["${safe(t.name||'Track')}"] = "${(t.id||'').replace(/"/g,'')}",`
  ).join('\n')

  return `-- ══ Sound Manager System (LocalScript → StarterPlayerScripts) ══
-- Pool: ${poolSize} | Music: ${musicVol} | SFX: ${sfxVol}
local SoundService=game:GetService("SoundService"); local TweenService=game:GetService("TweenService")
local ReplicatedStorage=game:GetService("ReplicatedStorage")

local MUSIC_VOL=${musicVol}; local SFX_VOL=${sfxVol}; local POOL_SIZE=${poolSize}
local FADE_TIME=1.5

-- Music track registry
local TRACKS:{[string]:string}={
${trackDefs}
}

-- ── Music layer (single sound, crossfade) ──
local musicGroup=Instance.new("SoundGroup"); musicGroup.Name="Music"; musicGroup.Volume=MUSIC_VOL; musicGroup.Parent=SoundService
local currentMusicSound:Sound?=nil
local currentTrackName:string?=nil

local function playMusic(trackName:string, looped:boolean?)
  if trackName==currentTrackName then return end
  local id=TRACKS[trackName]; if not id then warn("[SoundManager] Track not found: "..trackName); return end
  looped=looped~=false

  -- Fade out current
  if currentMusicSound and currentMusicSound.Parent then
    local old=currentMusicSound
    TweenService:Create(old,TweenInfo.new(FADE_TIME,Enum.EasingStyle.Linear),{Volume=0}):Play()
    task.delay(FADE_TIME,function() old:Destroy() end)
  end

  -- Create new
  local newSound=Instance.new("Sound"); newSound.Name="Music_"..trackName
  newSound.SoundId=id; newSound.Volume=0; newSound.Looped=looped; newSound.RollOffMaxDistance=10000
  newSound.Parent=musicGroup
  newSound:Play()
  TweenService:Create(newSound,TweenInfo.new(FADE_TIME,Enum.EasingStyle.Linear),{Volume=MUSIC_VOL}):Play()
  currentMusicSound=newSound; currentTrackName=trackName
end

local function stopMusic()
  if currentMusicSound then
    TweenService:Create(currentMusicSound,TweenInfo.new(FADE_TIME,Enum.EasingStyle.Linear),{Volume=0}):Play()
    task.delay(FADE_TIME,function()
      if currentMusicSound then currentMusicSound:Destroy(); currentMusicSound=nil end
    end)
    currentTrackName=nil
  end
end

-- ── SFX pool (pre-allocated Sound instances) ──
local sfxGroup=Instance.new("SoundGroup"); sfxGroup.Name="SFX"; sfxGroup.Volume=SFX_VOL; sfxGroup.Parent=SoundService
local sfxPool:{Sound}={}
local poolIndex=1

for i=1,POOL_SIZE do
  local s=Instance.new("Sound"); s.Name="SFX_"..i; s.Parent=sfxGroup
  table.insert(sfxPool,s)
end

local function getPooledSound():Sound
  local s=sfxPool[poolIndex]
  poolIndex=(poolIndex%POOL_SIZE)+1
  if s.IsPlaying then s:Stop() end
  return s
end

local function playSFX(soundId:string, volume:number?, pitch:number?)
  local s=getPooledSound()
  s.SoundId=soundId; s.Volume=(volume or 1)*SFX_VOL; s.PlaybackSpeed=pitch or 1
  s:Play()
  return s
end

-- ── 3D spatial audio ──
local function play3D(soundId:string, position:Vector3, volume:number?, rolloffMax:number?):Sound?
  local anchor=Instance.new("Part"); anchor.Anchored=true; anchor.CanCollide=false
  anchor.Transparency=1; anchor.Size=Vector3.new(0.1,0.1,0.1); anchor.Position=position; anchor.Parent=workspace

  local s=Instance.new("Sound"); s.SoundId=soundId; s.Volume=volume or 1
  s.RollOffMaxDistance=rolloffMax or 40; s.RollOffMinDistance=5; s.Parent=anchor
  s:Play()
  s.Ended:Connect(function() anchor:Destroy() end)
  task.delay(60,function() if anchor.Parent then anchor:Destroy() end end)
  return s
end

-- ── Dialog ducking ──
local function duckMusic(targetVolume:number?, duration:number?)
  targetVolume=targetVolume or 0.15; duration=duration or 0.4
  TweenService:Create(musicGroup,TweenInfo.new(duration,Enum.EasingStyle.Quad),{Volume=targetVolume}):Play()
end
local function unduckMusic(duration:number?)
  duration=duration or 0.6
  TweenService:Create(musicGroup,TweenInfo.new(duration,Enum.EasingStyle.Quad),{Volume=MUSIC_VOL}):Play()
end

-- ── Volume control ──
local function setMusicVolume(vol:number)
  MUSIC_VOL=math.clamp(vol,0,1); musicGroup.Volume=MUSIC_VOL
  if currentMusicSound then currentMusicSound.Volume=MUSIC_VOL end
end
local function setSFXVolume(vol:number)
  SFX_VOL=math.clamp(vol,0,1); sfxGroup.Volume=SFX_VOL
end

-- ── Expose global API ──
_G.SoundManager={
  playMusic=playMusic,
  stopMusic=stopMusic,
  playSFX=playSFX,
  play3D=play3D,
  duckMusic=duckMusic,
  unduckMusic=unduckMusic,
  setMusicVolume=setMusicVolume,
  setSFXVolume=setSFXVolume,
}

-- Server can trigger sounds via RemoteEvent
local RE=ReplicatedStorage:WaitForChild("SoundRE",5)
if RE then
  RE.OnClientEvent:Connect(function(action:string,...)
    local args={...}
    if action=="music" then playMusic(tostring(args[1] or ""),args[2])
    elseif action=="sfx" then playSFX(tostring(args[1] or ""),tonumber(args[2]),tonumber(args[3]))
    elseif action=="3d" then play3D(tostring(args[1] or ""),args[2],tonumber(args[3]))
    elseif action=="duck" then duckMusic(tonumber(args[1]),tonumber(args[2]))
    elseif action=="unduck" then unduckMusic(tonumber(args[1]))
    elseif action=="stop" then stopMusic()
    end
  end)
end

-- Start with first track
if next(TRACKS) then
  local firstName
  for name in pairs(TRACKS) do firstName=name; break end
  if firstName then playMusic(firstName) end
end

-- SERVER SIDE SNIPPET:
--[[
  local RE=Instance.new("RemoteEvent"); RE.Name="SoundRE"; RE.Parent=game:GetService("ReplicatedStorage")
  -- RE:FireAllClients("music","Combat")                          -- switch track
  -- RE:FireAllClients("sfx","rbxassetid://131070686",0.8,1)     -- play SFX
  -- RE:FireClient(player,"3d","rbxassetid://131070686",pos,0.9) -- spatial
  -- RE:FireAllClients("duck",0.1,0.5)                           -- duck for dialog
  -- RE:FireAllClients("unduck",0.8)                             -- restore
]]
print("[SoundManager] Ready. Tracks: "..#TRACKS..", Pool: ${poolSize}")`
}
