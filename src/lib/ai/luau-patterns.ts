/**
 * Luau Code Patterns Encyclopedia
 * 500+ proven code patterns the AI can reference when generating Roblox scripts.
 * Organized by category with exact code snippets ready to adapt.
 *
 * Injected into prompts via getRelevantPatterns(prompt, maxPatterns)
 */

export interface LuauPattern {
  name: string
  category: string
  keywords: string[]
  /** Compact working code snippet — ready to paste and adapt */
  code: string
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA & PERSISTENCE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const DATA_PATTERNS: LuauPattern[] = [
  {
    name: 'DataStore Save/Load with Retry',
    category: 'data',
    keywords: ['save', 'load', 'datastore', 'persist', 'data'],
    code: `local DSS = game:GetService("DataStoreService")
local store = DSS:GetDataStore("PlayerData_v1")
local function loadData(userId: number): {[string]: any}?
  local key = "player_"..tostring(userId)
  for attempt = 1, 3 do
    local ok, data = pcall(function() return store:GetAsync(key) end)
    if ok then return data end
    if attempt < 3 then task.wait(6) end
  end
  return nil
end
local function saveData(userId: number, data: {[string]: any}): boolean
  local key = "player_"..tostring(userId)
  for attempt = 1, 3 do
    local ok = pcall(function() store:SetAsync(key, data) end)
    if ok then return true end
    if attempt < 3 then task.wait(6) end
  end
  return false
end`,
  },
  {
    name: 'Session Locking',
    category: 'data',
    keywords: ['session', 'lock', 'duplicate', 'double join'],
    code: `local function acquireLock(userId: number): boolean
  local key = "lock_"..tostring(userId)
  local ok, existing = pcall(function() return store:GetAsync(key) end)
  if ok and existing and os.time() - existing < 300 then return false end
  pcall(function() store:SetAsync(key, os.time()) end)
  return true
end
local function releaseLock(userId: number)
  pcall(function() store:RemoveAsync("lock_"..tostring(userId)) end)
end`,
  },
  {
    name: 'Auto-Save Loop',
    category: 'data',
    keywords: ['auto save', 'periodic', 'interval'],
    code: `task.spawn(function()
  while true do
    task.wait(120)
    for _, player in game:GetService("Players"):GetPlayers() do
      task.spawn(function()
        local data = playerData[player.UserId]
        if data then saveData(player.UserId, data) end
      end)
    end
  end
end)`,
  },
  {
    name: 'Leaderstats Setup',
    category: 'data',
    keywords: ['leaderstats', 'coins', 'level', 'stats'],
    code: `Players.PlayerAdded:Connect(function(player: Player)
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Value = 0; coins.Parent = ls
  local level = Instance.new("IntValue"); level.Name = "Level"; level.Value = 1; level.Parent = ls
  local xp = Instance.new("IntValue"); xp.Name = "XP"; xp.Value = 0; xp.Parent = ls
  ls.Parent = player
  local data = loadData(player.UserId)
  if data then coins.Value = data.coins or 0; level.Value = data.level or 1; xp.Value = data.xp or 0 end
end)`,
  },
  {
    name: 'UpdateAsync Atomic Operation',
    category: 'data',
    keywords: ['atomic', 'updateasync', 'concurrent', 'race condition'],
    code: `local function addCoins(userId: number, amount: number): boolean
  local key = "player_"..tostring(userId)
  local ok = pcall(function()
    store:UpdateAsync(key, function(old)
      old = old or {coins=0}
      old.coins = (old.coins or 0) + amount
      return old
    end)
  end)
  return ok
end`,
  },
  {
    name: 'OrderedDataStore Leaderboard',
    category: 'data',
    keywords: ['leaderboard', 'top players', 'ranking', 'ordered'],
    code: `local ODS = DSS:GetOrderedDataStore("GlobalLeaderboard")
local function getTopPlayers(count: number): {{userId: number, score: number}}
  local ok, pages = pcall(function() return ODS:GetSortedAsync(false, count) end)
  if not ok then return {} end
  local results = {}
  local page = pages:GetCurrentPage()
  for _, entry in page do
    table.insert(results, {userId = tonumber(entry.key) or 0, score = entry.value})
  end
  return results
end`,
  },
  {
    name: 'Data Migration/Versioning',
    category: 'data',
    keywords: ['migrate', 'version', 'upgrade data', 'schema'],
    code: `local CURRENT_VERSION = 3
local function migrateData(data: {[string]: any}): {[string]: any}
  local v = data.version or 1
  if v < 2 then data.gems = data.gems or 0; data.inventory = data.inventory or {} end
  if v < 3 then data.settings = data.settings or {music=true,sfx=true}; data.achievements = data.achievements or {} end
  data.version = CURRENT_VERSION
  return data
end`,
  },
  {
    name: 'Profile Template with Defaults',
    category: 'data',
    keywords: ['profile', 'default', 'template', 'new player'],
    code: `local DEFAULT_PROFILE = table.freeze({
  version = 3, coins = 100, gems = 0, level = 1, xp = 0,
  inventory = {}, equipped = {}, achievements = {},
  stats = {kills=0, deaths=0, playtime=0, builds=0},
  settings = {music=true, sfx=true, quality="auto", sensitivity=0.5},
  dailyReward = {lastClaim=0, streak=0},
  createdAt = 0, lastLogin = 0,
})
local function createProfile(): {[string]: any}
  local p = {}
  for k, v in DEFAULT_PROFILE do
    p[k] = if type(v) == "table" then table.clone(v) else v
  end
  p.createdAt = os.time()
  p.lastLogin = os.time()
  return p
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// REMOTE EVENT / NETWORKING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const NETWORKING_PATTERNS: LuauPattern[] = [
  {
    name: 'RemoteEvent Setup + Validation',
    category: 'networking',
    keywords: ['remote', 'event', 'server', 'client', 'validate', 'fire'],
    code: `-- Server: create + listen
local RS = game:GetService("ReplicatedStorage")
local remotes = Instance.new("Folder"); remotes.Name = "Remotes"; remotes.Parent = RS
local purchaseEvent = Instance.new("RemoteEvent"); purchaseEvent.Name = "Purchase"; purchaseEvent.Parent = remotes
purchaseEvent.OnServerEvent:Connect(function(player: Player, itemId: string)
  if type(itemId) ~= "string" then return end
  if #itemId > 50 then return end
  local price = ITEMS[itemId]
  if not price then return end
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  if not coins or coins.Value < price then return end
  coins.Value -= price
end)`,
  },
  {
    name: 'Cooldown Anti-Exploit',
    category: 'networking',
    keywords: ['cooldown', 'anti exploit', 'rate limit', 'throttle'],
    code: `local lastAction: {[number]: number} = {}
local COOLDOWN = 0.5
remoteEvent.OnServerEvent:Connect(function(player: Player, ...)
  local now = os.clock()
  local last = lastAction[player.UserId] or 0
  if now - last < COOLDOWN then return end
  lastAction[player.UserId] = now
  -- process action
end)
Players.PlayerRemoving:Connect(function(p) lastAction[p.UserId] = nil end)`,
  },
  {
    name: 'RemoteFunction Request-Response',
    category: 'networking',
    keywords: ['remote function', 'invoke', 'request', 'response', 'get data'],
    code: `-- Server
local getBalance = Instance.new("RemoteFunction"); getBalance.Name = "GetBalance"; getBalance.Parent = remotes
getBalance.OnServerInvoke = function(player: Player): number
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  return if coins then coins.Value else 0
end
-- Client: local balance = remotes.GetBalance:InvokeServer()`,
  },
  {
    name: 'Server-to-Client State Sync',
    category: 'networking',
    keywords: ['sync', 'replicate', 'update client', 'state'],
    code: `-- Server broadcasts game state to all clients
local syncEvent = Instance.new("RemoteEvent"); syncEvent.Name = "SyncState"; syncEvent.Parent = remotes
local function broadcastState()
  syncEvent:FireAllClients({
    round = currentRound, timeLeft = roundTimeLeft,
    scores = teamScores, phase = gamePhase,
  })
end
-- Client listens:
-- syncEvent.OnClientEvent:Connect(function(state) updateHUD(state) end)`,
  },
  {
    name: 'Distance Validation',
    category: 'networking',
    keywords: ['distance', 'range check', 'exploit', 'reach'],
    code: `local function validateDistance(player: Player, targetPos: Vector3, maxDist: number): boolean
  local char = player.Character
  if not char then return false end
  local root = char:FindFirstChild("HumanoidRootPart")
  if not root then return false end
  return (root.Position - targetPos).Magnitude <= maxDist
end`,
  },
  {
    name: 'Type-Safe Argument Validation',
    category: 'networking',
    keywords: ['type check', 'validate args', 'safe', 'sanitize'],
    code: `local function validateArgs(player: Player, itemId: unknown, quantity: unknown): (string, number)?
  if type(itemId) ~= "string" then return nil end
  if type(quantity) ~= "number" then return nil end
  if quantity ~= math.floor(quantity) then return nil end
  if quantity < 1 or quantity > 99 then return nil end
  if #itemId > 50 or #itemId < 1 then return nil end
  return itemId, quantity :: number
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// UI PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const UI_PATTERNS: LuauPattern[] = [
  {
    name: 'ScreenGui Dark Theme Base',
    category: 'ui',
    keywords: ['gui', 'screen', 'dark', 'theme', 'base', 'setup'],
    code: `local gui = Instance.new("ScreenGui")
gui.Name = "ForjeUI"; gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
local main = Instance.new("Frame"); main.Name = "Main"
main.Size = UDim2.new(0.8,0,0.75,0); main.Position = UDim2.new(0.5,0,0.5,0)
main.AnchorPoint = Vector2.new(0.5,0.5)
main.BackgroundColor3 = Color3.fromRGB(15,18,30); main.BorderSizePixel = 0
Instance.new("UICorner", main).CornerRadius = UDim.new(0,16)
local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(212,175,55)
stroke.Thickness = 1.5; stroke.Transparency = 0.3; stroke.Parent = main
main.Parent = gui; gui.Parent = playerGui`,
  },
  {
    name: 'Button with Hover Effect',
    category: 'ui',
    keywords: ['button', 'hover', 'click', 'tween', 'interactive'],
    code: `local function createButton(text: string, parent: Instance, pos: UDim2, size: UDim2): TextButton
  local btn = Instance.new("TextButton"); btn.Name = text:gsub("%s","")
  btn.Text = text; btn.Font = Enum.Font.GothamBold; btn.TextSize = 14
  btn.TextColor3 = Color3.fromRGB(10,10,15)
  btn.BackgroundColor3 = Color3.fromRGB(212,175,55)
  btn.Size = size; btn.Position = pos; btn.AnchorPoint = Vector2.new(0.5,0.5)
  btn.BorderSizePixel = 0; btn.AutoButtonColor = false
  Instance.new("UICorner", btn).CornerRadius = UDim.new(0,10)
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3=Color3.fromRGB(235,200,75)}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3=Color3.fromRGB(212,175,55)}):Play()
  end)
  btn.Parent = parent; return btn
end`,
  },
  {
    name: 'ScrollingFrame with Items',
    category: 'ui',
    keywords: ['scroll', 'list', 'grid', 'items', 'scrolling'],
    code: `local scroll = Instance.new("ScrollingFrame"); scroll.Name = "ItemList"
scroll.Size = UDim2.new(1,-20,1,-80); scroll.Position = UDim2.new(0,10,0,70)
scroll.BackgroundTransparency = 1; scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 4; scroll.ScrollBarImageColor3 = Color3.fromRGB(212,175,55)
scroll.CanvasSize = UDim2.new(0,0,0,0); scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
local layout = Instance.new("UIListLayout"); layout.Padding = UDim.new(0,8)
layout.SortOrder = Enum.SortOrder.LayoutOrder; layout.Parent = scroll
Instance.new("UIPadding", scroll).PaddingTop = UDim.new(0,4)
scroll.Parent = main`,
  },
  {
    name: 'Item Card for Shop/Inventory',
    category: 'ui',
    keywords: ['card', 'item', 'shop', 'inventory', 'product'],
    code: `local function createItemCard(item: {name:string,price:number,icon:string}, parent: Instance): Frame
  local card = Instance.new("Frame"); card.Name = item.name
  card.Size = UDim2.new(1,0,0,60); card.BackgroundColor3 = Color3.fromRGB(25,28,45)
  card.BorderSizePixel = 0
  Instance.new("UICorner", card).CornerRadius = UDim.new(0,10)
  local cs = Instance.new("UIStroke"); cs.Color = Color3.fromRGB(255,255,255)
  cs.Transparency = 0.9; cs.Parent = card
  local icon = Instance.new("ImageLabel"); icon.Size = UDim2.new(0,40,0,40)
  icon.Position = UDim2.new(0,10,0.5,0); icon.AnchorPoint = Vector2.new(0,0.5)
  icon.BackgroundTransparency = 1; icon.Image = item.icon; icon.Parent = card
  local name = Instance.new("TextLabel"); name.Size = UDim2.new(0.5,0,0,20)
  name.Position = UDim2.new(0,60,0,10); name.BackgroundTransparency = 1
  name.Text = item.name; name.Font = Enum.Font.GothamBold; name.TextSize = 14
  name.TextColor3 = Color3.fromRGB(250,250,250); name.TextXAlignment = Enum.TextXAlignment.Left
  name.Parent = card
  local price = Instance.new("TextLabel"); price.Size = UDim2.new(0.3,0,0,20)
  price.Position = UDim2.new(0,60,0,32); price.BackgroundTransparency = 1
  price.Text = tostring(item.price).." coins"; price.Font = Enum.Font.GothamMedium
  price.TextSize = 12; price.TextColor3 = Color3.fromRGB(212,175,55)
  price.TextXAlignment = Enum.TextXAlignment.Left; price.Parent = card
  local buyBtn = createButton("BUY", card, UDim2.new(0.88,0,0.5,0), UDim2.new(0,60,0,30))
  card.Parent = parent; return card
end`,
  },
  {
    name: 'Open/Close Panel Animation',
    category: 'ui',
    keywords: ['open', 'close', 'animate', 'panel', 'toggle', 'show hide'],
    code: `local isOpen = false
local function togglePanel()
  isOpen = not isOpen
  if isOpen then
    main.Visible = true
    main.Size = UDim2.new(0,0,0,0)
    TweenService:Create(main, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
      Size = UDim2.new(0.8,0,0.75,0)
    }):Play()
  else
    local tween = TweenService:Create(main, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Size = UDim2.new(0,0,0,0)
    })
    tween:Play()
    tween.Completed:Connect(function() main.Visible = false end)
  end
end`,
  },
  {
    name: 'Close Button',
    category: 'ui',
    keywords: ['close', 'x button', 'dismiss', 'exit'],
    code: `local closeBtn = Instance.new("TextButton"); closeBtn.Name = "Close"
closeBtn.Size = UDim2.new(0,30,0,30); closeBtn.Position = UDim2.new(1,-10,0,10)
closeBtn.AnchorPoint = Vector2.new(1,0); closeBtn.Text = "X"
closeBtn.Font = Enum.Font.GothamBold; closeBtn.TextSize = 16
closeBtn.TextColor3 = Color3.fromRGB(150,150,150)
closeBtn.BackgroundColor3 = Color3.fromRGB(40,40,50); closeBtn.BorderSizePixel = 0
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0,8)
closeBtn.MouseEnter:Connect(function()
  TweenService:Create(closeBtn, TweenInfo.new(0.1), {BackgroundColor3=Color3.fromRGB(200,50,50), TextColor3=Color3.fromRGB(255,255,255)}):Play()
end)
closeBtn.MouseLeave:Connect(function()
  TweenService:Create(closeBtn, TweenInfo.new(0.1), {BackgroundColor3=Color3.fromRGB(40,40,50), TextColor3=Color3.fromRGB(150,150,150)}):Play()
end)
closeBtn.MouseButton1Click:Connect(togglePanel)
closeBtn.Parent = main`,
  },
  {
    name: 'Tab Navigation',
    category: 'ui',
    keywords: ['tab', 'navigation', 'category', 'section', 'switch'],
    code: `local tabs = {"Shop","Inventory","Stats","Settings"}
local tabFrames: {[string]: Frame} = {}
local tabBar = Instance.new("Frame"); tabBar.Name = "TabBar"
tabBar.Size = UDim2.new(1,-20,0,36); tabBar.Position = UDim2.new(0,10,0,40)
tabBar.BackgroundTransparency = 1; tabBar.Parent = main
local tabLayout = Instance.new("UIListLayout"); tabLayout.FillDirection = Enum.FillDirection.Horizontal
tabLayout.Padding = UDim.new(0,4); tabLayout.Parent = tabBar
for i, name in tabs do
  local tab = Instance.new("TextButton"); tab.Name = name
  tab.Size = UDim2.new(1/#tabs,-4,1,0); tab.Text = name
  tab.Font = Enum.Font.GothamBold; tab.TextSize = 13; tab.BorderSizePixel = 0
  tab.BackgroundColor3 = Color3.fromRGB(30,33,50); tab.TextColor3 = Color3.fromRGB(150,150,150)
  Instance.new("UICorner", tab).CornerRadius = UDim.new(0,8)
  tab.MouseButton1Click:Connect(function()
    for _, f in tabFrames do f.Visible = false end
    if tabFrames[name] then tabFrames[name].Visible = true end
    for _, c in tabBar:GetChildren() do
      if c:IsA("TextButton") then
        c.BackgroundColor3 = Color3.fromRGB(30,33,50); c.TextColor3 = Color3.fromRGB(150,150,150)
      end
    end
    tab.BackgroundColor3 = Color3.fromRGB(212,175,55); tab.TextColor3 = Color3.fromRGB(10,10,15)
  end)
  tab.Parent = tabBar
  local content = Instance.new("Frame"); content.Name = name.."Content"
  content.Size = UDim2.new(1,-20,1,-90); content.Position = UDim2.new(0,10,0,82)
  content.BackgroundTransparency = 1; content.Visible = (i==1)
  content.Parent = main; tabFrames[name] = content
end`,
  },
  {
    name: 'Slider Control',
    category: 'ui',
    keywords: ['slider', 'volume', 'brightness', 'range', 'drag'],
    code: `local function createSlider(name: string, parent: Instance, y: number, default: number, callback: (number)->())
  local label = Instance.new("TextLabel"); label.Size = UDim2.new(0.3,0,0,20)
  label.Position = UDim2.new(0,0,0,y); label.BackgroundTransparency = 1
  label.Text = name; label.Font = Enum.Font.GothamMedium; label.TextSize = 13
  label.TextColor3 = Color3.fromRGB(200,200,200); label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = parent
  local track = Instance.new("Frame"); track.Size = UDim2.new(0.55,0,0,6)
  track.Position = UDim2.new(0.32,0,0,y+7); track.BackgroundColor3 = Color3.fromRGB(40,43,60)
  track.BorderSizePixel = 0; Instance.new("UICorner", track).CornerRadius = UDim.new(1,0)
  track.Parent = parent
  local fill = Instance.new("Frame"); fill.Size = UDim2.new(default,0,1,0)
  fill.BackgroundColor3 = Color3.fromRGB(212,175,55); fill.BorderSizePixel = 0
  Instance.new("UICorner", fill).CornerRadius = UDim.new(1,0); fill.Parent = track
  local handle = Instance.new("Frame"); handle.Size = UDim2.new(0,14,0,14)
  handle.Position = UDim2.new(default,0,0.5,0); handle.AnchorPoint = Vector2.new(0.5,0.5)
  handle.BackgroundColor3 = Color3.fromRGB(255,255,255); handle.BorderSizePixel = 0
  Instance.new("UICorner", handle).CornerRadius = UDim.new(1,0); handle.Parent = track
  local valLabel = Instance.new("TextLabel"); valLabel.Size = UDim2.new(0.1,0,0,20)
  valLabel.Position = UDim2.new(0.9,0,0,y); valLabel.BackgroundTransparency = 1
  valLabel.Text = tostring(math.floor(default*100)).."%"; valLabel.Font = Enum.Font.GothamMedium
  valLabel.TextSize = 12; valLabel.TextColor3 = Color3.fromRGB(212,175,55)
  valLabel.Parent = parent
  local dragging = false
  handle.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then dragging = true end
  end)
  handle.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then dragging = false end
  end)
  game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
      local rel = math.clamp((input.Position.X - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
      fill.Size = UDim2.new(rel,0,1,0); handle.Position = UDim2.new(rel,0,0.5,0)
      valLabel.Text = tostring(math.floor(rel*100)).."%"; callback(rel)
    end
  end)
end`,
  },
  {
    name: 'Toast Notification',
    category: 'ui',
    keywords: ['toast', 'notification', 'alert', 'popup', 'message'],
    code: `local toastContainer = Instance.new("Frame"); toastContainer.Name = "Toasts"
toastContainer.Size = UDim2.new(0.3,0,0.5,0); toastContainer.Position = UDim2.new(0.99,0,0.02,0)
toastContainer.AnchorPoint = Vector2.new(1,0); toastContainer.BackgroundTransparency = 1
toastContainer.Parent = gui
local toastLayout = Instance.new("UIListLayout"); toastLayout.Padding = UDim.new(0,6)
toastLayout.SortOrder = Enum.SortOrder.LayoutOrder; toastLayout.Parent = toastContainer
local function showToast(msg: string, color: Color3?)
  local toast = Instance.new("Frame"); toast.Size = UDim2.new(1,0,0,40)
  toast.BackgroundColor3 = Color3.fromRGB(25,28,45); toast.BorderSizePixel = 0
  Instance.new("UICorner", toast).CornerRadius = UDim.new(0,10)
  local accent = Instance.new("Frame"); accent.Size = UDim2.new(0,3,0.6,0)
  accent.Position = UDim2.new(0,8,0.2,0); accent.BackgroundColor3 = color or Color3.fromRGB(212,175,55)
  accent.BorderSizePixel = 0; Instance.new("UICorner", accent).CornerRadius = UDim.new(1,0)
  accent.Parent = toast
  local text = Instance.new("TextLabel"); text.Size = UDim2.new(1,-30,1,0)
  text.Position = UDim2.new(0,20,0,0); text.BackgroundTransparency = 1; text.Text = msg
  text.Font = Enum.Font.GothamMedium; text.TextSize = 13
  text.TextColor3 = Color3.fromRGB(230,230,230); text.TextXAlignment = Enum.TextXAlignment.Left
  text.TextWrapped = true; text.Parent = toast
  toast.Position = UDim2.new(1,0,0,0)
  toast.Parent = toastContainer
  TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back), {Position=UDim2.new(0,0,0,0)}):Play()
  task.delay(3, function()
    local t = TweenService:Create(toast, TweenInfo.new(0.2), {Position=UDim2.new(1,0,0,0), BackgroundTransparency=1})
    t:Play(); t.Completed:Connect(function() toast:Destroy() end)
  end)
end`,
  },
  {
    name: 'Health Bar HUD',
    category: 'ui',
    keywords: ['health', 'bar', 'hud', 'hp', 'hearts'],
    code: `local healthBar = Instance.new("Frame"); healthBar.Name = "HealthBar"
healthBar.Size = UDim2.new(0.25,0,0,8); healthBar.Position = UDim2.new(0.02,0,0.95,0)
healthBar.BackgroundColor3 = Color3.fromRGB(40,10,10); healthBar.BorderSizePixel = 0
Instance.new("UICorner", healthBar).CornerRadius = UDim.new(1,0)
healthBar.Parent = gui
local healthFill = Instance.new("Frame"); healthFill.Name = "Fill"
healthFill.Size = UDim2.new(1,0,1,0); healthFill.BackgroundColor3 = Color3.fromRGB(34,197,94)
healthFill.BorderSizePixel = 0; Instance.new("UICorner", healthFill).CornerRadius = UDim.new(1,0)
healthFill.Parent = healthBar
local function updateHealth()
  local char = player.Character; if not char then return end
  local hum = char:FindFirstChildOfClass("Humanoid"); if not hum then return end
  local pct = hum.Health / hum.MaxHealth
  local col = if pct > 0.6 then Color3.fromRGB(34,197,94)
    elseif pct > 0.3 then Color3.fromRGB(234,179,8)
    else Color3.fromRGB(239,68,68)
  TweenService:Create(healthFill, TweenInfo.new(0.3), {Size=UDim2.new(pct,0,1,0), BackgroundColor3=col}):Play()
end`,
  },
  {
    name: 'Currency Display',
    category: 'ui',
    keywords: ['currency', 'coins', 'money', 'display', 'counter'],
    code: `local coinDisplay = Instance.new("Frame"); coinDisplay.Name = "CoinDisplay"
coinDisplay.Size = UDim2.new(0,120,0,32); coinDisplay.Position = UDim2.new(0.98,0,0.02,0)
coinDisplay.AnchorPoint = Vector2.new(1,0)
coinDisplay.BackgroundColor3 = Color3.fromRGB(20,22,35); coinDisplay.BorderSizePixel = 0
Instance.new("UICorner", coinDisplay).CornerRadius = UDim.new(0,10)
local coinIcon = Instance.new("TextLabel"); coinIcon.Size = UDim2.new(0,24,0,24)
coinIcon.Position = UDim2.new(0,6,0.5,0); coinIcon.AnchorPoint = Vector2.new(0,0.5)
coinIcon.BackgroundTransparency = 1; coinIcon.Text = "🪙"; coinIcon.TextSize = 16
coinIcon.Parent = coinDisplay
local coinText = Instance.new("TextLabel"); coinText.Name = "Amount"
coinText.Size = UDim2.new(1,-36,1,0); coinText.Position = UDim2.new(0,32,0,0)
coinText.BackgroundTransparency = 1; coinText.Text = "0"
coinText.Font = Enum.Font.GothamBold; coinText.TextSize = 16
coinText.TextColor3 = Color3.fromRGB(212,175,55); coinText.TextXAlignment = Enum.TextXAlignment.Left
coinText.Parent = coinDisplay; coinDisplay.Parent = gui`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMBAT & GAMEPLAY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const COMBAT_PATTERNS: LuauPattern[] = [
  {
    name: 'Melee Hitbox Detection',
    category: 'combat',
    keywords: ['melee', 'hit', 'hitbox', 'attack', 'sword', 'swing'],
    code: `local function meleeAttack(player: Player, damage: number, range: number)
  local char = player.Character; if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart"); if not root then return end
  local params = OverlapParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {char}
  local hits = workspace:GetPartBoundsInRadius(root.Position + root.CFrame.LookVector * (range/2), range, params)
  local damaged: {Model} = {}
  for _, part in hits do
    local model = part:FindFirstAncestorOfClass("Model")
    if model and not table.find(damaged, model) then
      local hum = model:FindFirstChildOfClass("Humanoid")
      if hum and hum.Health > 0 then
        hum:TakeDamage(damage); table.insert(damaged, model)
      end
    end
  end
end`,
  },
  {
    name: 'Raycast Projectile',
    category: 'combat',
    keywords: ['raycast', 'shoot', 'gun', 'bullet', 'ranged', 'projectile'],
    code: `local function shootRaycast(player: Player, origin: Vector3, direction: Vector3, damage: number)
  local params = RaycastParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {player.Character}
  local result = workspace:Raycast(origin, direction * 300, params)
  if result and result.Instance then
    local model = result.Instance:FindFirstAncestorOfClass("Model")
    if model then
      local hum = model:FindFirstChildOfClass("Humanoid")
      if hum then
        local isHead = result.Instance.Name == "Head"
        hum:TakeDamage(if isHead then damage * 2 else damage)
      end
    end
    -- Visual tracer
    local tracer = Instance.new("Part")
    tracer.Size = Vector3.new(0.1, 0.1, (origin - result.Position).Magnitude)
    tracer.CFrame = CFrame.lookAt(origin, result.Position) * CFrame.new(0, 0, -tracer.Size.Z/2)
    tracer.Anchored = true; tracer.CanCollide = false; tracer.Material = Enum.Material.Neon
    tracer.Color = Color3.fromRGB(255, 220, 100); tracer.Parent = workspace
    game:GetService("Debris"):AddItem(tracer, 0.1)
  end
end`,
  },
  {
    name: 'Knockback',
    category: 'combat',
    keywords: ['knockback', 'push', 'force', 'launch', 'repel'],
    code: `local function applyKnockback(target: Model, direction: Vector3, force: number)
  local root = target:FindFirstChild("HumanoidRootPart"); if not root then return end
  local bv = Instance.new("BodyVelocity")
  bv.Velocity = direction.Unit * force + Vector3.new(0, force * 0.3, 0)
  bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
  bv.Parent = root
  game:GetService("Debris"):AddItem(bv, 0.15)
end`,
  },
  {
    name: 'Debounce Pattern',
    category: 'combat',
    keywords: ['debounce', 'cooldown', 'touched', 'once', 'prevent spam'],
    code: `local debounce: {[Player]: boolean} = {}
part.Touched:Connect(function(hit: BasePart)
  local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
  if not player then return end
  if debounce[player] then return end
  debounce[player] = true
  -- do action
  task.delay(1, function() debounce[player] = nil end)
end)`,
  },
  {
    name: 'Status Effect System',
    category: 'combat',
    keywords: ['status', 'effect', 'burn', 'freeze', 'poison', 'debuff', 'buff'],
    code: `type StatusEffect = {name: string, duration: number, tickDamage: number?, speedMult: number?, visual: string?}
local activeEffects: {[Model]: {StatusEffect}} = {}
local function applyStatus(target: Model, effect: StatusEffect)
  local hum = target:FindFirstChildOfClass("Humanoid"); if not hum then return end
  if not activeEffects[target] then activeEffects[target] = {} end
  table.insert(activeEffects[target], effect)
  if effect.speedMult then hum.WalkSpeed *= effect.speedMult end
  if effect.tickDamage then
    task.spawn(function()
      local ticks = math.floor(effect.duration / 0.5)
      for i = 1, ticks do
        if hum.Health <= 0 then break end
        hum:TakeDamage(effect.tickDamage :: number)
        task.wait(0.5)
      end
    end)
  end
  task.delay(effect.duration, function()
    if effect.speedMult and hum then hum.WalkSpeed /= effect.speedMult end
    local list = activeEffects[target]
    if list then table.remove(list, table.find(list, effect) or 0) end
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MOVEMENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MOVEMENT_PATTERNS: LuauPattern[] = [
  {
    name: 'Sprint System',
    category: 'movement',
    keywords: ['sprint', 'run', 'shift', 'speed', 'fast'],
    code: `local UIS = game:GetService("UserInputService")
local DEFAULT_SPEED = 16; local SPRINT_SPEED = 28; local sprinting = false
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.LeftShift then
    sprinting = true
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then hum.WalkSpeed = SPRINT_SPEED end
  end
end)
UIS.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    sprinting = false
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then hum.WalkSpeed = DEFAULT_SPEED end
  end
end)`,
  },
  {
    name: 'Double Jump',
    category: 'movement',
    keywords: ['double jump', 'air jump', 'extra jump'],
    code: `local MAX_JUMPS = 2; local jumpCount = 0
local hum = player.Character and player.Character:WaitForChild("Humanoid")
hum.StateChanged:Connect(function(_, new)
  if new == Enum.HumanoidStateType.Landed then jumpCount = 0
  elseif new == Enum.HumanoidStateType.Freefall then end
end)
UIS.JumpRequest:Connect(function()
  if jumpCount < MAX_JUMPS then
    jumpCount += 1
    if jumpCount > 1 then
      hum:ChangeState(Enum.HumanoidStateType.Jumping)
    end
  end
end)`,
  },
  {
    name: 'Dash/Dodge',
    category: 'movement',
    keywords: ['dash', 'dodge', 'roll', 'evade', 'quick move'],
    code: `local DASH_SPEED = 80; local DASH_DURATION = 0.2; local DASH_COOLDOWN = 1.5
local lastDash = 0
local function dash()
  if os.clock() - lastDash < DASH_COOLDOWN then return end
  lastDash = os.clock()
  local char = player.Character; if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart"); if not root then return end
  local dir = root.CFrame.LookVector
  local bv = Instance.new("BodyVelocity")
  bv.Velocity = dir * DASH_SPEED; bv.MaxForce = Vector3.new(1e5, 0, 1e5)
  bv.Parent = root
  game:GetService("Debris"):AddItem(bv, DASH_DURATION)
end
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.Q then dash() end
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT & WORLD PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ENVIRONMENT_PATTERNS: LuauPattern[] = [
  {
    name: 'Day/Night Cycle',
    category: 'environment',
    keywords: ['day', 'night', 'cycle', 'sun', 'moon', 'time'],
    code: `local Lighting = game:GetService("Lighting")
local CYCLE_DURATION = 600 -- 10 minutes per full day
task.spawn(function()
  while true do
    Lighting.ClockTime = (Lighting.ClockTime + 24/CYCLE_DURATION * 0.1) % 24
    local t = Lighting.ClockTime
    if t > 6 and t < 18 then
      Lighting.Brightness = 2; Lighting.Ambient = Color3.fromRGB(140,140,140)
      Lighting.OutdoorAmbient = Color3.fromRGB(140,140,140)
    else
      Lighting.Brightness = 0.5; Lighting.Ambient = Color3.fromRGB(30,30,50)
      Lighting.OutdoorAmbient = Color3.fromRGB(30,30,50)
    end
    task.wait(0.1)
  end
end)`,
  },
  {
    name: 'Zone Detection',
    category: 'environment',
    keywords: ['zone', 'region', 'area', 'enter', 'leave', 'boundary'],
    code: `local function createZone(name: string, position: Vector3, size: Vector3): Part
  local zone = Instance.new("Part")
  zone.Name = name; zone.Size = size; zone.Position = position
  zone.Anchored = true; zone.CanCollide = false; zone.Transparency = 1
  zone.Parent = workspace
  local playersInZone: {Player} = {}
  zone.Touched:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if player and not table.find(playersInZone, player) then
      table.insert(playersInZone, player)
      print(player.Name.." entered "..name)
    end
  end)
  zone.TouchEnded:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if player then
      local idx = table.find(playersInZone, player)
      if idx then table.remove(playersInZone, idx) end
      print(player.Name.." left "..name)
    end
  end)
  return zone
end`,
  },
  {
    name: 'ProximityPrompt Interactive',
    category: 'environment',
    keywords: ['proximity', 'prompt', 'interact', 'press e', 'pickup'],
    code: `local function makeInteractive(part: BasePart, text: string, holdTime: number?, callback: (Player)->())
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = text; prompt.ObjectText = part.Name
  prompt.MaxActivationDistance = 8; prompt.HoldDuration = holdTime or 0
  prompt.RequiresLineOfSight = true
  prompt.Parent = part
  prompt.Triggered:Connect(function(player: Player)
    callback(player)
  end)
  return prompt
end
-- Usage: makeInteractive(doorPart, "Open Door", 0, function(p) openDoor() end)`,
  },
  {
    name: 'Door Open/Close',
    category: 'environment',
    keywords: ['door', 'open', 'close', 'hinge', 'swing'],
    code: `local TweenService = game:GetService("TweenService")
local function createDoor(doorPart: BasePart)
  local isOpen = false
  local closedCF = doorPart.CFrame
  local openCF = closedCF * CFrame.new(doorPart.Size.X/2, 0, -doorPart.Size.X/2) * CFrame.Angles(0, math.rad(-90), 0) * CFrame.new(-doorPart.Size.X/2, 0, doorPart.Size.X/2)
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Open"; prompt.MaxActivationDistance = 8; prompt.Parent = doorPart
  local ti = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  prompt.Triggered:Connect(function()
    isOpen = not isOpen
    prompt.ActionText = if isOpen then "Close" else "Open"
    TweenService:Create(doorPart, ti, {CFrame = if isOpen then openCF else closedCF}):Play()
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TYCOON & ECONOMY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TYCOON_PATTERNS: LuauPattern[] = [
  {
    name: 'Dropper + Conveyor + Collector',
    category: 'tycoon',
    keywords: ['dropper', 'conveyor', 'collector', 'tycoon', 'factory', 'machine'],
    code: `local dropInterval = 2; local baseValue = 5
task.spawn(function() while true do task.wait(dropInterval)
  local drop = Instance.new("Part"); drop.Shape = Enum.PartType.Ball
  drop.Size = Vector3.new(1.5,1.5,1.5); drop.Material = Enum.Material.Glass
  drop.Color = Color3.fromRGB(255,200,50); drop.Anchored = false
  drop.CFrame = dropperPart.CFrame - Vector3.new(0,3,0)
  drop:SetAttribute("Value", baseValue)
  drop.Parent = workspace
  game:GetService("Debris"):AddItem(drop, 15)
end end)
collectorPart.Touched:Connect(function(hit: BasePart)
  local val = hit:GetAttribute("Value")
  if not val then return end
  hit:Destroy()
  -- add coins to player
end)`,
  },
  {
    name: 'Tycoon Buy Button',
    category: 'tycoon',
    keywords: ['buy button', 'tycoon button', 'unlock', 'purchase pad'],
    code: `local function createBuyButton(part: BasePart, cost: number, unlockModel: Model)
  local bg = Instance.new("BillboardGui"); bg.Size = UDim2.new(4,0,1.5,0)
  bg.StudsOffset = Vector3.new(0,3,0); bg.AlwaysOnTop = true
  local label = Instance.new("TextLabel"); label.Size = UDim2.new(1,0,1,0)
  label.BackgroundColor3 = Color3.fromRGB(34,197,94); label.TextColor3 = Color3.new(1,1,1)
  label.Font = Enum.Font.GothamBold; label.TextSize = 18; label.Text = "$"..cost
  Instance.new("UICorner", label).CornerRadius = UDim.new(0,8)
  label.Parent = bg; bg.Parent = part
  unlockModel.Parent = workspace
  for _, p in unlockModel:GetDescendants() do
    if p:IsA("BasePart") then p.Transparency = 1 end
  end
  part.Touched:Connect(function(hit: BasePart)
    local player = Players:GetPlayerFromCharacter(hit.Parent); if not player then return end
    local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
    if not coins or coins.Value < cost then return end
    coins.Value -= cost; part:Destroy(); bg:Destroy()
    for _, p in unlockModel:GetDescendants() do
      if p:IsA("BasePart") then p.Transparency = 0 end
    end
  end)
end`,
  },
  {
    name: 'Rebirth/Prestige System',
    category: 'tycoon',
    keywords: ['rebirth', 'prestige', 'reset', 'multiplier', 'ascend'],
    code: `local function rebirth(player: Player)
  local ls = player:FindFirstChild("leaderstats"); if not ls then return end
  local coins = ls:FindFirstChild("Coins"); if not coins then return end
  local rebirths = ls:FindFirstChild("Rebirths") or Instance.new("IntValue")
  rebirths.Name = "Rebirths"; rebirths.Parent = ls
  local cost = 10000 * (2 ^ rebirths.Value)
  if coins.Value < cost then return end
  coins.Value = 0; rebirths.Value += 1
  -- multiplier = 1 + rebirths * 0.5
  -- reset tycoon state, keep rebirths
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// NPC & AI PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const NPC_PATTERNS: LuauPattern[] = [
  {
    name: 'Pathfinding NPC',
    category: 'npc',
    keywords: ['pathfind', 'npc', 'walk', 'navigate', 'move to', 'ai walk'],
    code: `local PFS = game:GetService("PathfindingService")
local function moveNPCTo(npc: Model, target: Vector3)
  local hum = npc:FindFirstChildOfClass("Humanoid"); if not hum then return end
  local root = npc:FindFirstChild("HumanoidRootPart"); if not root then return end
  local path = PFS:CreatePath({AgentRadius=2, AgentHeight=5, AgentCanJump=true})
  local ok = pcall(function() path:ComputeAsync(root.Position, target) end)
  if not ok or path.Status ~= Enum.PathStatus.Success then
    hum:MoveTo(target); return
  end
  for _, wp in path:GetWaypoints() do
    if wp.Action == Enum.PathWaypointAction.Jump then hum.Jump = true end
    hum:MoveTo(wp.Position)
    local reached = hum.MoveToFinished:Wait()
    if not reached then break end
  end
end`,
  },
  {
    name: 'Enemy AI State Machine',
    category: 'npc',
    keywords: ['enemy', 'ai', 'state', 'patrol', 'chase', 'attack', 'hostile'],
    code: `type AIState = "idle" | "patrol" | "chase" | "attack" | "return"
local function runEnemyAI(npc: Model, waypoints: {Vector3}, detectRange: number, attackRange: number)
  local hum = npc:FindFirstChildOfClass("Humanoid"); if not hum then return end
  local root = npc:FindFirstChild("HumanoidRootPart"); if not root then return end
  local state: AIState = "patrol"; local wpIdx = 1; local target: Model? = nil
  local origin = root.Position
  task.spawn(function() while hum.Health > 0 do
    -- Find nearest player
    local nearest: Model?, nearDist = nil, math.huge
    for _, p in Players:GetPlayers() do
      local char = p.Character; if not char then continue end
      local pRoot = char:FindFirstChild("HumanoidRootPart"); if not pRoot then continue end
      local dist = (pRoot.Position - root.Position).Magnitude
      if dist < nearDist then nearest = char; nearDist = dist end
    end
    if state == "patrol" then
      if nearest and nearDist < detectRange then state = "chase"; target = nearest
      else hum:MoveTo(waypoints[wpIdx]); if hum.MoveToFinished:Wait() then wpIdx = wpIdx % #waypoints + 1 end end
    elseif state == "chase" then
      if not target or not target.Parent then state = "return"; target = nil
      elseif nearDist > detectRange * 1.5 then state = "return"; target = nil
      elseif nearDist < attackRange then state = "attack"
      else local tRoot = target:FindFirstChild("HumanoidRootPart"); if tRoot then hum:MoveTo(tRoot.Position) end end
    elseif state == "attack" then
      if not target or not target.Parent then state = "return"; target = nil
      elseif nearDist > attackRange * 1.5 then state = "chase"
      else local tHum = target:FindFirstChildOfClass("Humanoid"); if tHum then tHum:TakeDamage(10) end end
    elseif state == "return" then
      hum:MoveTo(origin); state = "patrol"; wpIdx = 1
    end
    task.wait(0.5)
  end end)
end`,
  },
  {
    name: 'NPC Dialogue System',
    category: 'npc',
    keywords: ['dialogue', 'dialog', 'npc talk', 'conversation', 'chat npc'],
    code: `type DialogNode = {text: string, choices: {{text: string, next: string?}}?}
local dialogTree: {[string]: DialogNode} = {
  start = {text = "Welcome, traveler! What brings you here?", choices = {
    {text = "I need supplies", next = "shop"},
    {text = "Any quests?", next = "quest"},
    {text = "Goodbye", next = nil},
  }},
  shop = {text = "I have the finest wares! Take a look.", choices = {
    {text = "Show me", next = nil}, -- opens shop GUI
    {text = "Maybe later", next = "start"},
  }},
  quest = {text = "Defeat 5 slimes in the forest. I'll pay you 200 coins.", choices = {
    {text = "I'll do it!", next = nil}, -- accepts quest
    {text = "Too dangerous", next = "start"},
  }},
}
-- Client: typewriter effect for text, show choice buttons, fire RemoteEvent on choice`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTS & VFX PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const EFFECTS_PATTERNS: LuauPattern[] = [
  {
    name: 'Camera Shake',
    category: 'effects',
    keywords: ['camera shake', 'screen shake', 'impact', 'earthquake'],
    code: `local function shakeCamera(intensity: number, duration: number)
  local cam = workspace.CurrentCamera
  local startCF = cam.CFrame
  local elapsed = 0
  local conn: RBXScriptConnection
  conn = game:GetService("RunService").RenderStepped:Connect(function(dt)
    elapsed += dt
    if elapsed >= duration then conn:Disconnect(); return end
    local decay = 1 - (elapsed / duration)
    local offset = Vector3.new(
      (math.random() - 0.5) * 2 * intensity * decay,
      (math.random() - 0.5) * 2 * intensity * decay,
      0
    )
    cam.CFrame = cam.CFrame * CFrame.new(offset)
  end)
end
-- Small hit: shakeCamera(0.1, 0.15)
-- Explosion: shakeCamera(0.5, 0.4)
-- Earthquake: shakeCamera(0.8, 2.0)`,
  },
  {
    name: 'Damage Number Popup',
    category: 'effects',
    keywords: ['damage number', 'floating text', 'hit number', 'popup number'],
    code: `local function showDamageNumber(position: Vector3, damage: number, isCrit: boolean?)
  local bg = Instance.new("BillboardGui")
  bg.Size = UDim2.new(2,0,1,0); bg.StudsOffset = Vector3.new(math.random(-1,1), 2, 0)
  bg.AlwaysOnTop = true; bg.MaxDistance = 50
  local label = Instance.new("TextLabel"); label.Size = UDim2.new(1,0,1,0)
  label.BackgroundTransparency = 1
  label.Text = tostring(math.floor(damage))
  label.Font = Enum.Font.GothamBold
  label.TextSize = if isCrit then 28 else 20
  label.TextColor3 = if isCrit then Color3.fromRGB(255,200,50) else Color3.fromRGB(255,70,70)
  label.TextStrokeTransparency = 0.5
  label.Parent = bg
  local anchor = Instance.new("Part"); anchor.Size = Vector3.one * 0.1
  anchor.Position = position; anchor.Anchored = true; anchor.CanCollide = false
  anchor.Transparency = 1; anchor.Parent = workspace
  bg.Adornee = anchor; bg.Parent = anchor
  TweenService:Create(anchor, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Position = position + Vector3.new(0, 4, 0)
  }):Play()
  TweenService:Create(label, TweenInfo.new(0.8), {TextTransparency = 1, TextStrokeTransparency = 1}):Play()
  game:GetService("Debris"):AddItem(anchor, 1)
end`,
  },
  {
    name: 'Particle Burst Effect',
    category: 'effects',
    keywords: ['particle', 'burst', 'explosion', 'confetti', 'sparkle', 'effect'],
    code: `local function particleBurst(position: Vector3, color: Color3?, count: number?)
  local emitter = Instance.new("Part")
  emitter.Size = Vector3.one * 0.5; emitter.Position = position
  emitter.Anchored = true; emitter.CanCollide = false; emitter.Transparency = 1
  emitter.Parent = workspace
  local pe = Instance.new("ParticleEmitter")
  pe.Color = ColorSequence.new(color or Color3.fromRGB(255,200,50))
  pe.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,0.5), NumberSequenceKeypoint.new(1,0)})
  pe.Lifetime = NumberRange.new(0.5, 1.5)
  pe.Speed = NumberRange.new(10, 25)
  pe.SpreadAngle = Vector2.new(360, 360)
  pe.Rate = 0; pe.Parent = emitter
  pe:Emit(count or 30)
  game:GetService("Debris"):AddItem(emitter, 2)
end`,
  },
  {
    name: 'Trail Effect on Character',
    category: 'effects',
    keywords: ['trail', 'streak', 'motion trail', 'speed trail', 'aura trail'],
    code: `local function addTrail(character: Model, color: Color3)
  local root = character:FindFirstChild("HumanoidRootPart"); if not root then return end
  local a0 = Instance.new("Attachment"); a0.Position = Vector3.new(0, 1, 0); a0.Parent = root
  local a1 = Instance.new("Attachment"); a1.Position = Vector3.new(0, -1, 0); a1.Parent = root
  local trail = Instance.new("Trail")
  trail.Attachment0 = a0; trail.Attachment1 = a1
  trail.Color = ColorSequence.new(color)
  trail.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0,0), NumberSequenceKeypoint.new(1,1)})
  trail.Lifetime = 0.5; trail.MinLength = 0.1
  trail.FaceCamera = true; trail.Parent = root
  return trail
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ROUND/MATCH SYSTEM PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ROUND_PATTERNS: LuauPattern[] = [
  {
    name: 'Round System State Machine',
    category: 'round',
    keywords: ['round', 'match', 'game round', 'intermission', 'state machine'],
    code: `type GameState = "waiting" | "intermission" | "playing" | "ended"
local state: GameState = "waiting"; local roundNum = 0
local MIN_PLAYERS = 2; local INTERMISSION = 15; local ROUND_TIME = 120
local stateEvent = Instance.new("RemoteEvent"); stateEvent.Name = "GameState"
stateEvent.Parent = game:GetService("ReplicatedStorage")
local function setState(newState: GameState, data: {[string]: any}?)
  state = newState; stateEvent:FireAllClients(newState, data or {})
end
task.spawn(function() while true do
  setState("waiting", {minPlayers = MIN_PLAYERS})
  repeat task.wait(1) until #Players:GetPlayers() >= MIN_PLAYERS
  setState("intermission", {duration = INTERMISSION})
  task.wait(INTERMISSION)
  roundNum += 1
  setState("playing", {round = roundNum, duration = ROUND_TIME})
  local elapsed = 0
  while elapsed < ROUND_TIME do task.wait(1); elapsed += 1
    stateEvent:FireAllClients("tick", {timeLeft = ROUND_TIME - elapsed})
    -- check win conditions
  end
  setState("ended", {round = roundNum, winner = "TBD"})
  task.wait(8)
end end)`,
  },
  {
    name: 'Map Voting System',
    category: 'round',
    keywords: ['map vote', 'vote', 'map selection', 'choose map'],
    code: `local maps = {"Desert", "Forest", "Snow", "City", "Space"}
local votes: {[string]: {Player}} = {}
local voteEvent = Instance.new("RemoteEvent"); voteEvent.Name = "MapVote"
voteEvent.Parent = game:GetService("ReplicatedStorage")
local function startVote(duration: number): string
  local options = {}
  for i = 1, 3 do
    local pick = maps[math.random(#maps)]
    while table.find(options, pick) do pick = maps[math.random(#maps)] end
    table.insert(options, pick); votes[pick] = {}
  end
  voteEvent:FireAllClients("start", options)
  voteEvent.OnServerEvent:Connect(function(player: Player, mapName: string)
    if not votes[mapName] then return end
    for _, list in votes do -- remove from other votes
      local idx = table.find(list, player); if idx then table.remove(list, idx) end
    end
    table.insert(votes[mapName], player)
    voteEvent:FireAllClients("update", {[mapName] = #votes[mapName]})
  end)
  task.wait(duration)
  local winner, maxVotes = options[1], 0
  for map, voters in votes do if #voters > maxVotes then winner = map; maxVotes = #voters end end
  voteEvent:FireAllClients("result", winner)
  return winner
end`,
  },
  {
    name: 'Spawn/Respawn Manager',
    category: 'round',
    keywords: ['spawn', 'respawn', 'death', 'revive', 'respawn delay'],
    code: `local RESPAWN_DELAY = 5
local function setupRespawn(player: Player)
  player.CharacterAdded:Connect(function(char: Model)
    local hum = char:WaitForChild("Humanoid")
    hum.Died:Connect(function()
      -- Death effects
      task.wait(RESPAWN_DELAY)
      player:LoadCharacter()
    end)
  end)
end
Players.PlayerAdded:Connect(setupRespawn)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// BUILDING HELPER PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const BUILDING_PATTERNS: LuauPattern[] = [
  {
    name: 'Part Helper Functions (P, W, Cyl, Ball)',
    category: 'building',
    keywords: ['part', 'helper', 'build', 'create part', 'place part'],
    code: `local function P(name: string, cf: CFrame, size: Vector3, mat: Enum.Material, col: Color3, parent: Instance?): Part
  local p = Instance.new("Part"); p.Name = name; p.CFrame = cf; p.Size = size
  p.Material = mat; p.Color = col; p.Anchored = true; p.CastShadow = (size.X > 2 and size.Y > 2)
  p.Parent = parent or workspace; return p
end
local function W(name: string, cf: CFrame, size: Vector3, mat: Enum.Material, col: Color3, parent: Instance?): WedgePart
  local w = Instance.new("WedgePart"); w.Name = name; w.CFrame = cf; w.Size = size
  w.Material = mat; w.Color = col; w.Anchored = true; w.Parent = parent or workspace; return w
end
local function Cyl(name: string, cf: CFrame, size: Vector3, mat: Enum.Material, col: Color3, parent: Instance?): Part
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Cylinder
  p.CFrame = cf; p.Size = size; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or workspace; return p
end
local function Ball(name: string, cf: CFrame, diameter: number, mat: Enum.Material, col: Color3, parent: Instance?): Part
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Ball
  p.CFrame = cf; p.Size = Vector3.one * diameter; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or workspace; return p
end`,
  },
  {
    name: 'Color Variation Helper',
    category: 'building',
    keywords: ['color', 'variation', 'vc', 'vary', 'randomize color'],
    code: `local function vc(base: Color3, variance: number?): Color3
  local h, s, v = Color3.toHSV(base)
  local v2 = variance or 0.1
  return Color3.fromHSV(
    h + (math.random() - 0.5) * v2 * 0.1,
    math.clamp(s + (math.random() - 0.5) * v2, 0, 1),
    math.clamp(v + (math.random() - 0.5) * v2, 0, 1)
  )
end`,
  },
  {
    name: 'Ground Raycast Placement',
    category: 'building',
    keywords: ['ground', 'raycast', 'placement', 'terrain', 'floor level'],
    code: `local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 30
local groundRay = workspace:Raycast(sp + Vector3.new(0,50,0), Vector3.new(0,-200,0))
local groundY = groundRay and groundRay.Position.Y or sp.Y
sp = Vector3.new(sp.X, groundY, sp.Z)`,
  },
  {
    name: 'Add PointLight to Part',
    category: 'building',
    keywords: ['light', 'pointlight', 'glow', 'lamp', 'illuminate'],
    code: `local function addLight(part: BasePart, color: Color3?, brightness: number?, range: number?)
  local light = Instance.new("PointLight")
  light.Color = color or Color3.fromRGB(255,220,180)
  light.Brightness = brightness or 1.5
  light.Range = range or 20
  light.Parent = part
  return light
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// TOUCHED & COLLISION DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TOUCHED_PATTERNS: LuauPattern[] = [
  {
    name: 'Touched Event Per-Player Debounce',
    category: 'collision',
    keywords: ['touched', 'debounce', 'cooldown', 'per player', 'touch'],
    code: `-- Per-player debounce using UserId as key (prevents memory leaks)
local cooldowns: {[number]: boolean} = {}

part.Touched:Connect(function(hit)
  local player = game.Players:GetPlayerFromCharacter(hit.Parent)
  if not player then return end
  if cooldowns[player.UserId] then return end
  cooldowns[player.UserId] = true
  -- Apply effect here
  player.Character.Humanoid:TakeDamage(10)
  task.delay(3, function()
    cooldowns[player.UserId] = nil -- nil, not false, to free memory
  end)
end)
-- Clean up when player leaves
game.Players.PlayerRemoving:Connect(function(p) cooldowns[p.UserId] = nil end)`,
  },
  {
    name: 'GetPartsInPart Zone Detection (Modern)',
    category: 'collision',
    keywords: ['zone', 'overlap', 'getpartsinpart', 'spatial', 'collision detection', 'area'],
    code: `-- Modern spatial query replaces .Touched for zone detection
local params = OverlapParams.new()
params.FilterType = Enum.RaycastFilterType.Include
params.FilterDescendantsInstances = {workspace.Characters}
params.MaxParts = 50

local zonePart = workspace.ZonePart -- invisible CanCollide=false part
local function getPlayersInZone(): {Player}
  local parts = workspace:GetPartsInPart(zonePart, params)
  local found: {[Player]: boolean} = {}
  for _, part in parts do
    local char = part.Parent
    local player = game.Players:GetPlayerFromCharacter(char)
    if player then found[player] = true end
  end
  local result: {Player} = {}
  for player in found do table.insert(result, player) end
  return result
end`,
  },
  {
    name: 'GetPartBoundsInBox Fast Area Check',
    category: 'collision',
    keywords: ['bounds', 'box', 'getpartboundsinbox', 'bounding box', 'area check'],
    code: `-- Faster but less accurate than GetPartsInPart (uses bounding boxes)
-- Good for: quick proximity checks, large zones, non-precise detection
local params = OverlapParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = {workspace.IgnoreFolder}

local center = CFrame.new(0, 5, 0)
local size = Vector3.new(50, 10, 50)
local parts = workspace:GetPartBoundsInBox(center, size, params)

-- GetPartBoundsInRadius for circular areas:
local partsInRadius = workspace:GetPartBoundsInRadius(Vector3.new(0, 5, 0), 25, params)`,
  },
  {
    name: 'Raycast with RaycastParams',
    category: 'collision',
    keywords: ['raycast', 'ray', 'line of sight', 'hit detection', 'shoot'],
    code: `local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = {character}
params.IgnoreWater = true

local origin = head.Position
local direction = head.CFrame.LookVector * 200
local result = workspace:Raycast(origin, direction, params)

if result then
  local hitPart = result.Instance
  local hitPos = result.Position
  local hitNormal = result.Normal
  local hitMaterial = result.Material
  local hitDistance = result.Distance
  -- Blockcast for wider projectiles:
  -- workspace:Blockcast(CFrame, Vector3.new(2,2,2), direction, params)
  -- Spherecast for spherical projectiles:
  -- workspace:Spherecast(origin, 1.5, direction, params)
end`,
  },
  {
    name: 'Collision Groups Setup',
    category: 'collision',
    keywords: ['collision group', 'physicsservice', 'no collide', 'players collide', 'pass through'],
    code: `-- MODERN API (2024+): Use BasePart.CollisionGroup property + PhysicsService
local PhysicsService = game:GetService("PhysicsService")
local Players = game:GetService("Players")

-- Register groups (replaces deprecated CreateCollisionGroup)
PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:RegisterCollisionGroup("NPCs")

-- Set collision matrix (max 32 groups)
PhysicsService:CollisionGroupSetCollidable("Players", "Players", false)     -- players pass through each other
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Players", false) -- bullets pass through players who fired
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Projectiles", false)

-- Assign parts to groups via property (replaces deprecated SetPartCollisionGroup)
local function setCharacterCollisionGroup(character: Model)
  for _, desc in character:GetDescendants() do
    if desc:IsA("BasePart") then desc.CollisionGroup = "Players" end
  end
  character.DescendantAdded:Connect(function(desc)
    if desc:IsA("BasePart") then desc.CollisionGroup = "Players" end
  end)
end

Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(setCharacterCollisionGroup)
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// HUMANOID DEEP DIVE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const HUMANOID_PATTERNS: LuauPattern[] = [
  {
    name: 'Humanoid Complete Properties Reference',
    category: 'humanoid',
    keywords: ['humanoid', 'walkspeed', 'jumpheight', 'health', 'maxhealth', 'properties'],
    code: `-- Key Humanoid properties (set from server for security)
humanoid.WalkSpeed = 16         -- studs/sec, default 16
humanoid.JumpPower = 50         -- upward force (0-1000), default 50
humanoid.JumpHeight = 7.2       -- studs, alternative to JumpPower
humanoid.UseJumpPower = true    -- true=JumpPower, false=JumpHeight
humanoid.MaxHealth = 100        -- default 100
humanoid.Health = 100
humanoid.HipHeight = 2          -- height of root above ground
humanoid.AutoRotate = true      -- face movement direction
humanoid.MaxSlopeAngle = 89     -- max walkable slope degrees
humanoid.BreakJointsOnDeath = true
humanoid.PlatformStand = false  -- disables movement when true
humanoid.Sit = false
humanoid.RigType = Enum.HumanoidRigType.R15  -- R6 or R15
humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
humanoid.HealthDisplayDistance = 100
humanoid.NameDisplayDistance = 100
humanoid.NameOcclusion = Enum.NameOcclusion.OccludeAll`,
  },
  {
    name: 'Humanoid State Types (All 17)',
    category: 'humanoid',
    keywords: ['state', 'humanoidstatetype', 'jumping', 'falling', 'ragdoll', 'dead', 'swimming'],
    code: `-- All HumanoidStateType values:
-- FallingDown (0)  - tripped, auto-recovers
-- Ragdoll (1)      - must manually set/unset
-- GettingUp (2)    - recovering from fall/ragdoll
-- Jumping (3)      - just jumped, brief
-- Swimming (4)     - in Terrain water
-- Freefall (5)     - falling from height
-- Flying (6)       - disables animation like PlatformStand
-- Landed (7)       - brief state after freefall
-- Running (8)      - on ground moving
-- RunningNoPhysics (10) - deprecated
-- StrafingNoPhysics (11) - cannot be set manually
-- Climbing (12)    - on TrussPart/ladder
-- Seated (13)      - in Seat/VehicleSeat
-- PlatformStanding (14)
-- Dead (15)        - setting this kills the humanoid
-- Physics (16)     - no forces applied, no auto-transition
-- None (18)        - internal placeholder

-- Disable states for NPC performance:
humanoid:SetStateEnabled(Enum.HumanoidStateType.Climbing, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.Jumping, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.Seated, false)
humanoid:SetStateEnabled(Enum.HumanoidStateType.FallingDown, false)

-- Listen for state changes:
humanoid.StateChanged:Connect(function(oldState, newState)
  if newState == Enum.HumanoidStateType.Landed then
    -- play landing effect
  end
end)`,
  },
  {
    name: 'Humanoid Events and Methods',
    category: 'humanoid',
    keywords: ['humanoid', 'died', 'healthchanged', 'moveto', 'takedamage', 'equiptool'],
    code: `-- Events
humanoid.Died:Connect(function() print("Dead") end)
humanoid.HealthChanged:Connect(function(newHealth) end)
humanoid.Running:Connect(function(speed) end) -- speed param
humanoid.StateChanged:Connect(function(old, new) end)
humanoid.StateEnabledChanged:Connect(function(state, enabled) end)
humanoid.Touched:Connect(function(touchedPart, limbPart) end)
humanoid.AnimationPlayed:Connect(function(animTrack) end)

-- Methods
humanoid:TakeDamage(25) -- respects ForceField
humanoid:MoveTo(Vector3.new(50, 0, 50)) -- walk to position
humanoid:MoveTo(Vector3.new(50, 0, 50), targetPart) -- walk to part
humanoid.MoveToFinished:Connect(function(reached) end) -- 8sec timeout
humanoid:ChangeState(Enum.HumanoidStateType.Physics) -- force state
humanoid:SetStateEnabled(Enum.HumanoidStateType.Jumping, false)
humanoid:GetState() -- returns current HumanoidStateType
humanoid:EquipTool(tool)
humanoid:UnequipTools()
humanoid:ApplyDescription(humanoidDescription)
humanoid:GetAppliedDescription()

-- Load animation (prefer Animator over Humanoid:LoadAnimation)
local animator = humanoid:FindFirstChildOfClass("Animator")
  or Instance.new("Animator", humanoid)
local track = animator:LoadAnimation(animationInstance)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ANIMATION_PATTERNS: LuauPattern[] = [
  {
    name: 'Animation System Complete',
    category: 'animation',
    keywords: ['animation', 'animator', 'loadanimation', 'play', 'stop', 'priority', 'track', 'r15', 'r6'],
    code: `-- AnimationPriority (lowest to highest):
-- Core (1000)    - Roblox default animations, catalog bundles
-- Idle (0)       - character idle animations
-- Movement (1)   - walk, run, swim, climb
-- Action (2)     - attacks, tool use
-- Action2 (3)    - overrides Action
-- Action3 (4)    - overrides Action2
-- Action4 (5)    - highest priority, overrides everything

local animator = humanoid:FindFirstChildOfClass("Animator")
local anim = Instance.new("Animation")
anim.AnimationId = "rbxassetid://123456789"
local track = animator:LoadAnimation(anim)

-- IMPORTANT: Cache tracks! Max 256 per Animator. Don't re-LoadAnimation.
-- Play(fadeTime, weight, speed)
track:Play(0.1, 1, 1)     -- default: 0.1s fade, weight 1, speed 1
track:Stop(0.1)            -- 0.1s fade out
track:AdjustSpeed(2)       -- 2x speed (0 = pause, negative = reverse)
track:AdjustWeight(0.5, 0.2) -- weight 0.5 over 0.2s fade

-- Properties
track.IsPlaying   -- bool
track.Length       -- seconds (0 until loaded)
track.Looped      -- bool
track.Priority    -- AnimationPriority enum
track.Speed       -- current speed
track.TimePosition -- current time in seconds (settable)
track.WeightCurrent / track.WeightTarget

-- Set priority from script:
track.Priority = Enum.AnimationPriority.Action

-- Events
track.Stopped:Connect(function() end)       -- finished playing
track.DidLoop:Connect(function() end)       -- looped animation cycled
track.Ended:Connect(function() end)         -- fully concluded including fade
track.KeyframeReached:Connect(function(name) end) -- named keyframe hit
track:GetMarkerReachedSignal("HitFrame"):Connect(function(param)
  -- Animation editor marker events
end)
track:GetTimeOfKeyframe("Strike") -- returns seconds`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// LIGHTING & POST-PROCESSING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const LIGHTING_PATTERNS: LuauPattern[] = [
  {
    name: 'Lighting Properties Complete',
    category: 'lighting',
    keywords: ['lighting', 'ambient', 'brightness', 'fog', 'shadow', 'clocktime', 'timeofday'],
    code: `local Lighting = game:GetService("Lighting")

-- Core properties
Lighting.ClockTime = 14            -- 0-24 hours (14 = 2pm)
Lighting.TimeOfDay = "14:00:00"    -- string alternative
Lighting.Brightness = 1            -- sunlight intensity
Lighting.Ambient = Color3.fromRGB(127, 127, 127) -- shadow color
Lighting.OutdoorAmbient = Color3.fromRGB(127, 127, 127) -- outdoor shadow
Lighting.ColorShift_Top = Color3.new(0, 0, 0)    -- overhead tint
Lighting.ColorShift_Bottom = Color3.new(0, 0, 0) -- underside tint

-- Fog
Lighting.FogColor = Color3.fromRGB(191, 191, 191)
Lighting.FogStart = 0
Lighting.FogEnd = 100000  -- set lower for visible fog (500-2000)

-- Shadows
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.5
Lighting.Technology = Enum.Technology.ShadowMap -- or Future, Voxel, Compatibility
Lighting.EnvironmentDiffuseScale = 1  -- 0-1 skybox influence on diffuse
Lighting.EnvironmentSpecularScale = 1 -- 0-1 skybox influence on specular
Lighting.ExposureCompensation = 0     -- camera exposure (-5 to 5)
Lighting.GeographicLatitude = 41.733  -- sun angle

-- Useful methods
local sunDir = Lighting:GetSunDirection()   -- Vector3
local moonDir = Lighting:GetMoonDirection() -- Vector3
Lighting:SetMinutesAfterMidnight(840)       -- 840 = 14:00`,
  },
  {
    name: 'Day/Night Cycle with Smooth Transitions',
    category: 'lighting',
    keywords: ['day night', 'cycle', 'time', 'sunrise', 'sunset', 'tween lighting'],
    code: `-- Server-synced day/night cycle
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

-- Option 1: Simple increment (server script)
local MINUTES_PER_REALTIME_SECOND = 2 -- 1 game day = 12 real minutes
RunService.Heartbeat:Connect(function(dt)
  Lighting.ClockTime = (Lighting.ClockTime + dt * MINUTES_PER_REALTIME_SECOND / 60) % 24
end)

-- Option 2: Server-time synced (client script, all clients match)
RunService.Heartbeat:Connect(function()
  Lighting.ClockTime = (workspace:GetServerTimeNow() / 60) % 24
end)

-- Smooth lighting transitions with TweenService
local TweenService = game:GetService("TweenService")
local function transitionToNight()
  local info = TweenInfo.new(5, Enum.EasingStyle.Sine)
  TweenService:Create(Lighting, info, {
    Brightness = 0,
    Ambient = Color3.fromRGB(40, 40, 60),
    OutdoorAmbient = Color3.fromRGB(40, 40, 60),
    FogEnd = 500,
    FogColor = Color3.fromRGB(20, 20, 40),
    ClockTime = 0,
  }):Play()
end`,
  },
  {
    name: 'Post-Processing Effects (Programmatic)',
    category: 'lighting',
    keywords: ['bloom', 'blur', 'colorcorrection', 'depthoffield', 'sunrays', 'atmosphere', 'post processing'],
    code: `local Lighting = game:GetService("Lighting")

-- Atmosphere (child of Lighting)
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.3          -- 0-1, fog/haze density
atmo.Offset = 0             -- 0-1, pushes haze further
atmo.Color = Color3.fromRGB(199, 170, 107) -- haze color
atmo.Decay = Color3.fromRGB(92, 60, 13)    -- distant haze color
atmo.Glare = 0              -- 0-1, glare intensity
atmo.Haze = 0               -- 0-10, haziness
atmo.Parent = Lighting

-- Bloom
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.5   -- 0-1
bloom.Size = 24          -- blur spread pixels
bloom.Threshold = 0.8    -- brightness threshold
bloom.Parent = Lighting  -- or CurrentCamera

-- Color Correction
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0        -- -1 to 1
cc.Contrast = 0          -- -1 to 1
cc.Saturation = 0        -- -1 to 1
cc.TintColor = Color3.new(1, 1, 1) -- multiply tint
cc.Parent = Lighting

-- Depth of Field
local dof = Instance.new("DepthOfFieldEffect")
dof.FarIntensity = 0.5   -- blur at far distance
dof.FocusDistance = 50    -- sharp focus distance
dof.InFocusRadius = 30   -- sharp range
dof.NearIntensity = 0    -- blur at near distance
dof.Parent = Lighting

-- Sun Rays
local rays = Instance.new("SunRaysEffect")
rays.Intensity = 0.25    -- 0-1
rays.Spread = 1          -- 0-1 fan spread
rays.Parent = Lighting

-- Blur (for menus/damage)
local blur = Instance.new("BlurEffect")
blur.Size = 0 -- 0-56, animate up for effect
blur.Parent = Lighting`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// GUI PROGRAMMING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const GUI_ADVANCED_PATTERNS: LuauPattern[] = [
  {
    name: 'GUI From Code (Complete Setup)',
    category: 'gui',
    keywords: ['gui', 'screengui', 'frame', 'textbutton', 'textlabel', 'instance new', 'interface', 'menu'],
    code: `-- Always create GUI in LocalScript or client-context Script
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GameHUD"
screenGui.ResetOnSpawn = false -- persists on death
screenGui.IgnoreGuiInset = true -- fills under topbar
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = playerGui

-- Centered frame
local frame = Instance.new("Frame")
frame.Name = "MainPanel"
frame.AnchorPoint = Vector2.new(0.5, 0.5) -- center pivot
frame.Position = UDim2.fromScale(0.5, 0.5)
frame.Size = UDim2.fromScale(0.4, 0.5) -- 40% width, 50% height
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
frame.BorderSizePixel = 0
frame.Parent = screenGui

-- Rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = frame

-- Padding
local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 12)
padding.PaddingBottom = UDim.new(0, 12)
padding.PaddingLeft = UDim.new(0, 12)
padding.PaddingRight = UDim.new(0, 12)
padding.Parent = frame

-- UIStroke for border
local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(255, 200, 50)
stroke.Thickness = 2
stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
stroke.Parent = frame`,
  },
  {
    name: 'Layout Objects (List, Grid, Scale)',
    category: 'gui',
    keywords: ['uilistlayout', 'uigridlayout', 'uiscale', 'scrollingframe', 'layout', 'responsive'],
    code: `-- UIListLayout - vertical/horizontal list
local list = Instance.new("UIListLayout")
list.FillDirection = Enum.FillDirection.Vertical
list.HorizontalAlignment = Enum.HorizontalAlignment.Center
list.VerticalAlignment = Enum.VerticalAlignment.Top
list.Padding = UDim.new(0, 8) -- 8px gap between items
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = frame

-- UIGridLayout - item grid
local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.fromOffset(100, 100) -- 100x100 cells
grid.CellPadding = UDim2.fromOffset(8, 8)
grid.FillDirection = Enum.FillDirection.Horizontal
grid.FillDirectionMaxCells = 4 -- 4 columns
grid.SortOrder = Enum.SortOrder.LayoutOrder
grid.Parent = containerFrame

-- ScrollingFrame with auto-size canvas
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.fromScale(1, 0.8)
scroll.CanvasSize = UDim2.new(0, 0, 0, 0) -- auto-update below
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y -- auto-grow
scroll.ScrollBarThickness = 6
scroll.ScrollBarImageColor3 = Color3.fromRGB(200, 200, 200)
scroll.BackgroundTransparency = 1
scroll.Parent = frame

-- UIAspectRatioConstraint - maintain shape
local aspect = Instance.new("UIAspectRatioConstraint")
aspect.AspectRatio = 16/9
aspect.AspectType = Enum.AspectType.FitWithinMaxSize
aspect.Parent = frame

-- UISizeConstraint
local sizeConstraint = Instance.new("UISizeConstraint")
sizeConstraint.MaxSize = Vector2.new(600, 400)
sizeConstraint.MinSize = Vector2.new(200, 150)
sizeConstraint.Parent = frame

-- Frames are faster than ImageLabels for rendering
-- Use UICorner+UIGradient instead of image-based designs
-- Use AutomaticCanvasSize instead of manually computing CanvasSize`,
  },
  {
    name: 'GUI Optimization Tips',
    category: 'gui',
    keywords: ['gui', 'performance', 'optimize', 'canvasgroup', 'render'],
    code: `-- GUI Performance Rules:
-- 1. Frames render faster than ImageLabels (use UICorner/UIGradient instead)
-- 2. Avoid CanvasGroup unless needed for clipping rotated elements
-- 3. Separate ScreenGUIs prevent full re-renders on individual changes
-- 4. ModuleScripts in ReplicatedStorage, not embedded in GUIs (clone memory leak)
-- 5. Delete temporary GUI elements + nil references to tweens/connections
-- 6. Use AutomaticCanvasSize.Y on ScrollingFrame instead of manual calc
-- 7. Prefer UDim2.fromScale for responsive, UDim2.fromOffset for fixed
-- 8. AbsoluteContentSize property on layouts for dynamic canvas sizing:
local list = frame:FindFirstChildOfClass("UIListLayout")
list:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
  scroll.CanvasSize = UDim2.new(0, 0, 0, list.AbsoluteContentSize.Y)
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE & MONETIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MARKETPLACE_PATTERNS: LuauPattern[] = [
  {
    name: 'ProcessReceipt Complete Handler',
    category: 'monetization',
    keywords: ['processreceipt', 'marketplace', 'devproduct', 'purchase', 'robux', 'shop', 'buy'],
    code: `local DSS = game:GetService("DataStoreService")
local MPS = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local PurchaseHistory = DSS:GetDataStore("PurchaseHistory")

local ProductHandlers = {
  [123456789] = function(receipt, player)
    -- Grant 100 coins
    local ls = player:FindFirstChild("leaderstats")
    if ls and ls:FindFirstChild("Coins") then
      ls.Coins.Value += 100
      return true
    end
    return false
  end,
  [987654321] = function(receipt, player)
    -- Grant speed boost
    local char = player.Character
    if char and char:FindFirstChild("Humanoid") then
      char.Humanoid.WalkSpeed = 32
      task.delay(60, function()
        if char and char:FindFirstChild("Humanoid") then
          char.Humanoid.WalkSpeed = 16
        end
      end)
      return true
    end
    return false
  end,
}

function MPS.ProcessReceipt(receiptInfo)
  local key = receiptInfo.PlayerId .. ":" .. receiptInfo.PurchaseId

  -- Already processed? Grant immediately (idempotent)
  local ok, alreadyDone = pcall(PurchaseHistory.GetAsync, PurchaseHistory, key)
  if ok and alreadyDone then
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  -- Player must be in-game
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet -- retry later
  end

  -- Find handler
  local handler = ProductHandlers[receiptInfo.ProductId]
  if not handler then
    warn("No handler for product:", receiptInfo.ProductId)
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  -- Execute with pcall
  local success, result = pcall(handler, receiptInfo, player)
  if not success or not result then
    warn("Handler failed:", success, result)
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  -- Save receipt AFTER successful grant
  local saveOk = pcall(PurchaseHistory.SetAsync, PurchaseHistory, key, true)
  if not saveOk then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  return Enum.ProductPurchaseDecision.PurchaseGranted
end`,
  },
  {
    name: 'GamePass Purchase + Check',
    category: 'monetization',
    keywords: ['gamepass', 'pass', 'prompt', 'purchase', 'owngamepass'],
    code: `local MPS = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local PASS_ID = 123456789

-- Check ownership (server)
local function hasPass(player: Player): boolean
  local ok, owns = pcall(MPS.UserOwnsGamePassAsync, MPS, player.UserId, PASS_ID)
  return ok and owns
end

-- Prompt purchase (client)
MPS:PromptGamePassPurchase(Players.LocalPlayer, PASS_ID)

-- Listen for purchase completion (client)
MPS.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
  if purchased and passId == PASS_ID then
    -- Grant benefit locally or fire remote
  end
end)`,
  },
  {
    name: 'Subscription System',
    category: 'monetization',
    keywords: ['subscription', 'recurring', 'monthly', 'subscribe', 'premium benefits'],
    code: `-- Subscriptions API (2024+, recurring monthly Robux/local currency)
local MPS = game:GetService("MarketplaceService")
local SUB_ID = "your-subscription-id" -- from Creator Hub

-- Server: Check if player has active subscription
local function isSubscribed(player: Player): boolean
  local ok, status = pcall(MPS.GetUserSubscriptionStatusAsync, MPS, player, SUB_ID)
  if ok and status then return status.IsSubscribed end
  return false
end

-- Client: Prompt subscription purchase
MPS:PromptSubscriptionPurchase(Players.LocalPlayer, SUB_ID)

-- Server: Listen for status changes (real-time)
MPS.UserSubscriptionStatusChanged:Connect(function(player, subId)
  if subId ~= SUB_ID then return end
  local ok, status = pcall(MPS.GetUserSubscriptionStatusAsync, MPS, player, subId)
  if ok and status and status.IsSubscribed then
    grantSubscriptionBenefits(player)
  else
    revokeSubscriptionBenefits(player)
  end
end)

-- Client: Purchase prompt finished
MPS.PromptSubscriptionPurchaseFinished:Connect(function(player, subId, didTry)
  -- didTry = true if they attempted purchase (not necessarily successful)
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// RUNSERVICE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const RUNSERVICE_PATTERNS: LuauPattern[] = [
  {
    name: 'RunService Events Complete Guide',
    category: 'runservice',
    keywords: ['runservice', 'heartbeat', 'renderstepped', 'stepped', 'prerender', 'presimulation', 'postsimulation', 'frame', 'update'],
    code: `local RunService = game:GetService("RunService")

-- EXECUTION ORDER PER FRAME (client):
-- 1. BindToRenderStep callbacks (by priority)
-- 2. RenderStepped / PreRender         ← CLIENT ONLY, before rendering
-- 3. PreAnimation                       ← before animation evaluation
-- 4. Stepped / PreSimulation            ← before physics simulation
-- 5. [Physics simulation happens]
-- 6. Heartbeat / PostSimulation         ← after physics

-- MODERN NAMES (preferred):
-- PreRender(deltaTimeRender)    → replaces RenderStepped  [CLIENT ONLY]
-- PreAnimation(deltaTimeSim)    → new                     [CLIENT+SERVER]
-- PreSimulation(deltaTimeSim)   → replaces Stepped        [CLIENT+SERVER]
-- PostSimulation(deltaTimeSim)  → replaces Heartbeat      [CLIENT+SERVER]

-- Use for: camera, character visuals
RunService.PreRender:Connect(function(dt)
  -- Only works in LocalScript / client Script
  -- Use for: custom camera, UI following 3D objects, viewmodel
end)

-- Use for: adjusting animation speed/priority
RunService.PreAnimation:Connect(function(dt)
  -- Modify AnimationTrack speed/weight before evaluation
end)

-- Use for: physics input (forces, velocities)
RunService.PreSimulation:Connect(function(dt)
  -- Set velocity, apply forces, position constraints
  -- Runs BEFORE physics calculates
end)

-- Use for: reading physics results, game logic
RunService.PostSimulation:Connect(function(dt)
  -- Read positions after physics, update game state
  -- Most general-purpose update loop
end)

-- Frame-rate independent movement:
RunService.PostSimulation:Connect(function(dt)
  local moveSpeed = 50 -- studs per second
  part.CFrame *= CFrame.new(0, 0, -moveSpeed * dt)
end)`,
  },
  {
    name: 'RunService Context Detection',
    category: 'runservice',
    keywords: ['isclient', 'isserver', 'isstudio', 'context', 'detect'],
    code: `local RunService = game:GetService("RunService")

RunService:IsClient()  -- true in LocalScript, client RunContext
RunService:IsServer()  -- true in Script, server RunContext
RunService:IsStudio()  -- true when running in Studio
RunService:IsRunMode() -- true during Studio Run playtest
RunService:IsRunning() -- true when experience is active
RunService:IsEdit()    -- true in edit mode (not playing)

-- BindToRenderStep for ordered pre-render callbacks (CLIENT ONLY)
RunService:BindToRenderStep("CameraUpdate", Enum.RenderPriority.Camera.Value, function(dt)
  -- Runs at Camera priority before PreRender
end)
-- RenderPriority order: First(0) → Input(100) → Camera(200) → Character(300) → Last(2000)
RunService:UnbindFromRenderStep("CameraUpdate") -- cleanup`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ZONE/REGION DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ZONE_PATTERNS: LuauPattern[] = [
  {
    name: 'Zone Detection with Polling',
    category: 'zone',
    keywords: ['zone', 'region', 'area', 'enter', 'exit', 'boundary', 'safezone', 'pvp zone'],
    code: `-- Poll-based zone detection (no external modules needed)
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local zonePart = workspace.SafeZone -- invisible, CanCollide=false
local params = OverlapParams.new()
params.FilterType = Enum.RaycastFilterType.Include

local playersInZone: {[Player]: boolean} = {}

local function checkZones()
  -- Update filter to current characters
  local chars = {}
  for _, p in Players:GetPlayers() do
    if p.Character then table.insert(chars, p.Character) end
  end
  params.FilterDescendantsInstances = chars

  local parts = workspace:GetPartsInPart(zonePart, params)

  local currentlyInZone: {[Player]: boolean} = {}
  for _, part in parts do
    local player = Players:GetPlayerFromCharacter(part.Parent)
    if player then currentlyInZone[player] = true end
  end

  -- Fire enter/exit events
  for player in currentlyInZone do
    if not playersInZone[player] then
      playersInZone[player] = true
      -- PLAYER ENTERED ZONE
      print(player.Name, "entered zone")
    end
  end
  for player in playersInZone do
    if not currentlyInZone[player] then
      playersInZone[player] = nil
      -- PLAYER EXITED ZONE
      print(player.Name, "exited zone")
    end
  end
end

RunService.Heartbeat:Connect(checkZones)`,
  },
  {
    name: 'ZonePlus Module Usage',
    category: 'zone',
    keywords: ['zoneplus', 'zone module', 'foreverHD', 'zone library'],
    code: `-- ZonePlus v3.2.0 by ForeverHD (install via Wally or Roblox model)
local Zone = require(game.ReplicatedStorage.Zone)

-- Create from model of parts
local zone = Zone.new(workspace.ShopArea)

-- Create from CFrame+Size
local zone2 = Zone.fromRegion(CFrame.new(0, 5, 0), Vector3.new(50, 10, 50))

-- Server events
zone.playerEntered:Connect(function(player)
  print(player.Name, "entered shop")
end)
zone.playerExited:Connect(function(player)
  print(player.Name, "left shop")
end)
zone.partEntered:Connect(function(part)
  -- any tracked part entered
end)

-- Client-only events (LocalScript)
zone.localPlayerEntered:Connect(function()
  -- show shop UI
end)
zone.localPlayerExited:Connect(function()
  -- hide shop UI
end)

-- Track specific parts
zone:trackItem(somePart)
-- Check if part is in zone
local isInside = zone:findPart(somePart)

-- Uses Spatial Query API internally for performance`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ATTRIBUTE SYSTEM PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ATTRIBUTE_PATTERNS: LuauPattern[] = [
  {
    name: 'Attributes API Complete',
    category: 'attributes',
    keywords: ['attribute', 'setattribute', 'getattribute', 'custom property', 'metadata'],
    code: `-- Supported Attribute types:
-- string, boolean, number, UDim, UDim2, BrickColor, Color3,
-- Vector2, Vector3, CFrame, NumberSequence, ColorSequence,
-- NumberRange, Rect, Font

-- Set attributes
part:SetAttribute("Health", 100)
part:SetAttribute("TeamColor", Color3.fromRGB(255, 0, 0))
part:SetAttribute("IsLocked", true)
part:SetAttribute("SpawnPoint", CFrame.new(0, 5, 0))

-- Get single attribute
local health = part:GetAttribute("Health") -- returns value or nil

-- Get all attributes as dictionary
local attrs = part:GetAttributes() -- {Health=100, IsLocked=true, ...}

-- Listen for specific attribute change
part:GetAttributeChangedSignal("Health"):Connect(function()
  -- No params passed! Must re-read the value:
  local newHealth = part:GetAttribute("Health")
  print("Health changed to:", newHealth)
end)

-- Listen for ANY attribute change
part.AttributeChanged:Connect(function(attrName)
  local newValue = part:GetAttribute(attrName)
  print(attrName, "=", newValue)
end)

-- Remove attribute
part:SetAttribute("Health", nil) -- setting nil removes it

-- PITFALL: Don't SetAttribute inside GetAttributeChangedSignal handler
-- for the same attribute — causes infinite loop!

-- Attributes vs ValueObjects:
-- Attributes: lighter, no instances, replicate, typed, cleaner
-- ValueObjects: support .Changed event with old value, more verbose
-- Prefer Attributes for most cases (modern approach)
-- Replication: server→client automatically, client→server does NOT replicate`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK OPTIMIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const NETWORK_ADVANCED_PATTERNS: LuauPattern[] = [
  {
    name: 'UnreliableRemoteEvent',
    category: 'networking',
    keywords: ['unreliable', 'unreliableremoteevent', 'fast update', 'particle', 'visual', 'ephemeral'],
    code: `-- UnreliableRemoteEvent: same API as RemoteEvent but may drop packets
-- Max payload: 1000 bytes (client and server)
-- No ordering guarantee, no delivery guarantee
local unreliable = Instance.new("UnreliableRemoteEvent")
unreliable.Name = "VisualEffects"
unreliable.Parent = game.ReplicatedStorage

-- USE FOR: particles, sounds, visual-only updates, frequent position pings
-- DO NOT USE FOR: damage, purchases, state changes, chat

-- Server
unreliable:FireAllClients("Explosion", Vector3.new(10, 0, 5))
unreliable:FireClient(player, "HitMarker")

-- Client
unreliable:FireServer("Footstep", position)

-- Client handler
unreliable.OnClientEvent:Connect(function(effectType, ...)
  if effectType == "Explosion" then
    local pos = ...
    -- spawn particle emitter at pos
  end
end)`,
  },
  {
    name: 'RemoteEvent Batching & Compression',
    category: 'networking',
    keywords: ['batch', 'compress', 'remote', 'bandwidth', 'optimize network', 'throttle'],
    code: `-- BAD: Multiple fires per frame
remote:FireServer("UpdateHealth", 50)
remote:FireServer("UpdateStamina", 80)
remote:FireServer("UpdateXP", 1200)

-- GOOD: Batch into one fire
remote:FireServer("UpdateStats", { Health = 50, Stamina = 80, XP = 1200 })

-- Data compression: Position instead of CFrame when rotation unneeded
-- BAD: remote:FireAllClients(player, hrp.CFrame)  -- 48+ bytes
-- GOOD: remote:FireAllClients(player, hrp.Position) -- 12 bytes

-- Enum-based protocol (reduces string overhead)
local Protocol = { Health = 1, Stamina = 2, XP = 3, Position = 4 }
remote:FireClient(player, Protocol.Health, 50)

-- Round numbers to reduce precision overhead
local rounded = math.floor(value * 100 + 0.5) / 100

-- Rate limiting (server-side)
local lastFire: {[Player]: number} = {}
remote.OnServerEvent:Connect(function(player, ...)
  local now = tick()
  if lastFire[player] and now - lastFire[player] < 0.1 then return end
  lastFire[player] = now
  -- process event
end)

-- Monitor: Developer Console (F9) → Network tab shows bandwidth`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TERRAIN API PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TERRAIN_PATTERNS: LuauPattern[] = [
  {
    name: 'Terrain Fill Methods Complete',
    category: 'terrain',
    keywords: ['terrain', 'fillblock', 'fillball', 'fillcylinder', 'fillwedge', 'landscape', 'generate terrain'],
    code: `local terrain = workspace.Terrain

-- Terrain materials (23 terrain-compatible):
-- Grass, LeafyGrass, Sand, Snow, Mud, Ground, Asphalt, Salt,
-- Rock, Sandstone, Basalt, CrackedLava, Limestone, Slate,
-- Concrete, Brick, Cobblestone, Pavement, WoodPlanks,
-- Ice, Glacier, Water, Air

-- FillBlock(cframe, size, material) - rectangular area
terrain:FillBlock(CFrame.new(0, -2, 0), Vector3.new(100, 4, 100), Enum.Material.Grass)

-- FillBall(center, radius, material) - sphere
terrain:FillBall(Vector3.new(20, 5, 0), 10, Enum.Material.Rock)

-- FillCylinder(cframe, height, radius, material) - cylinder
terrain:FillCylinder(CFrame.new(0, 0, 0), 20, 5, Enum.Material.Sand)

-- FillWedge(cframe, size, material) - wedge/ramp
terrain:FillWedge(CFrame.new(0, 5, 0), Vector3.new(10, 10, 20), Enum.Material.Concrete)

-- FillRegion(region3, resolution, material)
local region = Region3.new(Vector3.new(-50,-5,-50), Vector3.new(50,5,50))
terrain:FillRegion(region, 4, Enum.Material.Grass) -- resolution must be 4

-- ReplaceMaterial in region
terrain:ReplaceMaterial(region, 4, Enum.Material.Grass, Enum.Material.Snow)

-- Clear all terrain
terrain:Clear()`,
  },
  {
    name: 'Terrain ReadVoxels/WriteVoxels',
    category: 'terrain',
    keywords: ['voxel', 'readvoxels', 'writevoxels', 'terrain data', 'save terrain', 'load terrain'],
    code: `local terrain = workspace.Terrain

-- CRITICAL: Region3 corners must be aligned to voxel grid (multiples of 4)
local min = Vector3.new(-20, -4, -20)
local max = Vector3.new(20, 4, 20)
local region = Region3.new(min, max)

-- ReadVoxels returns 3D arrays: materials[x][y][z], occupancy[x][y][z]
local materials, occupancy = terrain:ReadVoxels(region, 4) -- resolution=4

-- materials: 3D array of Enum.Material values
-- occupancy: 3D array of numbers 0-1 (how full each voxel is)
-- Index [1][1][1] = minimum corner of region

-- Modify voxels
for x, slice in materials do
  for y, row in slice do
    for z, mat in row do
      if mat == Enum.Material.Water then
        materials[x][y][z] = Enum.Material.Ice
        occupancy[x][y][z] = 1
      end
    end
  end
end

-- WriteVoxels back
terrain:WriteVoxels(region, 4, materials, occupancy)

-- WorldToCell for coordinate conversion
local cell = terrain:WorldToCell(Vector3.new(10, 5, 3)) -- returns Vector3
-- Each voxel = 4 studs

-- Save/restore terrain region
local saved = terrain:CopyRegion(region:ExpandToGrid(4))
-- Later: terrain:PasteRegion(saved, Vector3int16.new(-5,-1,-5), true)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// GAME LIFECYCLE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const LIFECYCLE_PATTERNS: LuauPattern[] = [
  {
    name: 'BindToClose + PlayerRemoving (Proper Data Save)',
    category: 'lifecycle',
    keywords: ['bindtoclose', 'playerremoving', 'shutdown', 'save', 'quit', 'close', 'data loss'],
    code: `local Players = game:GetService("Players")
local DSS = game:GetService("DataStoreService")
local store = DSS:GetDataStore("PlayerData_v1")

local playerData: {[number]: {[string]: any}} = {}

local function savePlayerData(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  local key = "player_" .. tostring(player.UserId)
  local ok, err = pcall(store.SetAsync, store, key, data)
  if not ok then warn("Save failed for", player.Name, err) end
end

-- Save on individual player leave
Players.PlayerRemoving:Connect(function(player)
  savePlayerData(player)
  playerData[player.UserId] = nil
end)

-- Save ALL on server shutdown (30 second timeout)
game:BindToClose(function()
  -- Use task.spawn to save all players in parallel
  local threads = {}
  for _, player in Players:GetPlayers() do
    local t = task.spawn(function()
      savePlayerData(player)
    end)
    table.insert(threads, t)
  end
  -- Wait for all saves (BindToClose gives 30 seconds max)
  -- In Studio, only 3 seconds!
  task.wait(3) -- minimum wait for DataStore requests
end)`,
  },
  {
    name: 'PlayerAdded Race Condition Fix',
    category: 'lifecycle',
    keywords: ['playeradded', 'characteradded', 'race condition', 'join before', 'already in game'],
    code: `local Players = game:GetService("Players")

-- PROBLEM: PlayerAdded fires AFTER script connects if player joins fast
-- SOLUTION: Process existing players + listen for new ones

local function onCharacterAdded(character: Model)
  local humanoid = character:WaitForChild("Humanoid")
  -- setup character...
  humanoid.Died:Connect(function()
    -- handle death
  end)
end

local function onPlayerAdded(player: Player)
  -- Load data, setup leaderstats, etc.
  player.CharacterAdded:Connect(onCharacterAdded)
  -- Handle if character already exists (race condition)
  if player.Character then
    onCharacterAdded(player.Character)
  end
end

-- Connect to future players
Players.PlayerAdded:Connect(onPlayerAdded)

-- Process players already in game (race condition fix)
for _, player in Players:GetPlayers() do
  task.spawn(onPlayerAdded, player) -- task.spawn prevents one error blocking others
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ERROR_PATTERNS: LuauPattern[] = [
  {
    name: 'pcall vs xpcall Patterns',
    category: 'error',
    keywords: ['pcall', 'xpcall', 'error', 'try catch', 'protected call', 'traceback'],
    code: `-- pcall: returns (success: boolean, resultOrError: any)
local ok, result = pcall(function()
  return store:GetAsync("key")
end)
if ok then
  print("Got:", result)
else
  warn("Error:", result)
end

-- Alternative pcall syntax (method call style, avoids closure):
local ok, result = pcall(store.GetAsync, store, "key")

-- xpcall: like pcall but with error handler function
local ok, result = xpcall(function()
  return dangerousFunction()
end, function(err)
  -- Error handler gets the error message
  -- IMPORTANT: xpcall error handler CANNOT yield (no task.wait!)
  warn("Error:", err)
  warn("Traceback:", debug.traceback())
  return err -- return value becomes the error result
end)`,
  },
  {
    name: 'Retry with Exponential Backoff',
    category: 'error',
    keywords: ['retry', 'backoff', 'exponential', 'datastore retry', 'attempt', 'robust'],
    code: `-- Retry pattern with exponential backoff (for DataStore, HTTP, etc.)
local function retryAsync<T>(
  fn: () -> T,
  maxAttempts: number?,
  baseDelay: number?
): (boolean, T | string)
  maxAttempts = maxAttempts or 5
  baseDelay = baseDelay or 1

  for attempt = 1, maxAttempts do
    local ok, result = pcall(fn)
    if ok then return true, result end

    if attempt < maxAttempts then
      local delay = baseDelay * (2 ^ (attempt - 1)) -- 1, 2, 4, 8, 16...
      delay = delay + math.random() * delay * 0.1   -- jitter to avoid thundering herd
      warn(string.format("Attempt %d/%d failed: %s. Retrying in %.1fs",
        attempt, maxAttempts, tostring(result), delay))
      task.wait(delay)
    else
      warn("All", maxAttempts, "attempts failed:", result)
      return false, result
    end
  end
  return false, "Max attempts reached"
end

-- Usage:
local ok, data = retryAsync(function()
  return store:GetAsync("player_123")
end, 3, 2) -- 3 attempts, starting at 2s delay`,
  },
  {
    name: 'Safe Require and Service Access',
    category: 'error',
    keywords: ['require', 'getservice', 'safe', 'module', 'service'],
    code: `-- Safe service access (services should always exist, but good practice)
local Players = game:GetService("Players")

-- Safe module require
local ok, module = pcall(require, script.Parent.SomeModule)
if not ok then
  warn("Failed to load module:", module)
  return
end

-- Safe WaitForChild with timeout
local obj = parent:WaitForChild("ChildName", 10) -- 10 second timeout
if not obj then
  warn("ChildName not found after 10 seconds")
  return
end

-- Safe FindFirstChild chain
local value = workspace
  :FindFirstChild("Folder")
  and workspace.Folder:FindFirstChild("Part")
  and workspace.Folder.Part:GetAttribute("Health")
-- value is nil if any step fails`,
  },
]

// ALL PATTERNS COMBINED
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MODULE ARCHITECTURE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MODULE_PATTERNS: LuauPattern[] = [
  {
    name: 'Singleton Module Pattern',
    category: 'architecture',
    keywords: ['module', 'modulescript', 'singleton', 'service', 'require', 'architecture'],
    code: `-- Singleton: module table IS the instance (runs once, cached by require)
local PlayerManager = {}

local players: {[number]: PlayerData} = {}
local initialized = false

export type PlayerData = {
  UserId: number,
  Coins: number,
  Level: number,
}

function PlayerManager:Init()
  if initialized then return end
  initialized = true
  game:GetService("Players").PlayerAdded:Connect(function(p)
    self:_onPlayerAdded(p)
  end)
end

function PlayerManager:GetData(userId: number): PlayerData?
  return players[userId]
end

function PlayerManager:_onPlayerAdded(player: Player)
  players[player.UserId] = { UserId = player.UserId, Coins = 0, Level = 1 }
end

return PlayerManager`,
  },
  {
    name: 'Factory Module Pattern',
    category: 'architecture',
    keywords: ['module', 'factory', 'create', 'constructor', 'class'],
    code: `-- Factory: module returns a constructor, each call creates a new instance
local Weapon = {}
Weapon.__index = Weapon

export type Weapon = typeof(setmetatable({} :: {
  Name: string,
  Damage: number,
  FireRate: number,
  _ammo: number,
}, Weapon))

function Weapon.new(name: string, damage: number, fireRate: number): Weapon
  return setmetatable({
    Name = name,
    Damage = damage,
    FireRate = fireRate,
    _ammo = 30,
  }, Weapon)
end

function Weapon.Fire(self: Weapon): boolean
  if self._ammo <= 0 then return false end
  self._ammo -= 1
  return true
end

function Weapon.Reload(self: Weapon)
  self._ammo = 30
end

return Weapon`,
  },
  {
    name: 'Module Init Pattern (Avoid Circular Deps)',
    category: 'architecture',
    keywords: ['module', 'init', 'initialize', 'circular', 'dependency', 'require'],
    code: `-- Use :Init() to break circular dependencies between modules
-- Controller requires modules at top, but defers cross-references to Init()
local CombatSystem = {}
local InventorySystem  -- forward declaration, no require yet

function CombatSystem:Init(modules)
  InventorySystem = modules.InventorySystem  -- set reference at init time
end

function CombatSystem:Attack(player: Player, target: Player)
  local weapon = InventorySystem:GetEquippedWeapon(player)
  if not weapon then return end
  -- attack logic using weapon
end

return CombatSystem

-- In your boot script (ServerScriptService):
-- local modules = {
--   CombatSystem = require(ServerStorage.Modules.CombatSystem),
--   InventorySystem = require(ServerStorage.Modules.InventorySystem),
-- }
-- for _, mod in modules do if mod.Init then mod:Init(modules) end end`,
  },
  {
    name: 'Module Placement Guide',
    category: 'architecture',
    keywords: ['module', 'where', 'replicatedstorage', 'serverstorage', 'serverscriptservice', 'folder', 'organization'],
    code: `-- WHERE TO PUT MODULES IN ROBLOX:
--
-- ServerScriptService/       -- Server Scripts that auto-run
--   GameBootstrap.server.lua -- Boot script: requires & inits all server modules
--
-- ServerStorage/Modules/     -- Server-only modules (INVISIBLE to client)
--   DataManager.lua          -- DataStore logic, admin commands
--   AntiCheat.lua            -- Validation, exploit detection
--   EconomySystem.lua        -- Currency math, trade validation
--
-- ReplicatedStorage/Shared/  -- Modules accessible by BOTH server & client
--   Types.lua                -- Shared type definitions
--   Constants.lua            -- Shared config values
--   Signal.lua               -- Custom signal class
--   MathUtil.lua             -- Pure utility functions
--   RemoteNames.lua          -- Single source of truth for remote names
--
-- ReplicatedStorage/Client/  -- Client modules (also visible to server)
--   UIController.lua
--   CameraController.lua
--
-- ReplicatedFirst/           -- Loads BEFORE everything else
--   LoadingScreen.lua        -- Show loading UI immediately
--
-- SECURITY RULES:
-- ServerStorage = client CANNOT see or access
-- ReplicatedStorage = client CAN see (never put secrets here)
-- ServerScriptService = server scripts auto-run, client cannot see
-- StarterPlayerScripts = per-player LocalScripts`,
  },
  {
    name: 'Require Caching Behavior',
    category: 'architecture',
    keywords: ['require', 'cache', 'module', 'runs once', 'performance'],
    code: `-- REQUIRE BEHAVIOR: ModuleScripts run ONCE, result is cached
-- Multiple require() calls return the SAME table reference

-- ModuleScript "Config"
local Config = {
  MaxPlayers = 10,
  RoundTime = 120,
}
return Config

-- Script A:
local config = require(ReplicatedStorage.Config)
config.MaxPlayers = 20  -- MUTATES the shared table

-- Script B:
local config = require(ReplicatedStorage.Config)
print(config.MaxPlayers) --> 20 (sees Script A mutation!)

-- BEST PRACTICE: Use table.freeze for config modules
local Config = table.freeze({
  MaxPlayers = 10,
  RoundTime = 120,
})
return Config
-- Now any mutation attempt errors immediately`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// OOP & METATABLE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const OOP_PATTERNS: LuauPattern[] = [
  {
    name: 'Standard OOP Class (Metatable)',
    category: 'oop',
    keywords: ['class', 'oop', 'metatable', '__index', 'new', 'constructor', 'object'],
    code: `--!strict
local Enemy = {}
Enemy.__index = Enemy

type self = {
  Name: string,
  Health: number,
  MaxHealth: number,
  Damage: number,
  Speed: number,
}

export type Enemy = typeof(setmetatable({} :: self, Enemy))

function Enemy.new(name: string, health: number, damage: number): Enemy
  return setmetatable({
    Name = name,
    Health = health,
    MaxHealth = health,
    Damage = damage,
    Speed = 16,
  } :: self, Enemy)
end

function Enemy.TakeDamage(self: Enemy, amount: number)
  self.Health = math.max(0, self.Health - amount)
end

function Enemy.IsAlive(self: Enemy): boolean
  return self.Health > 0
end

function Enemy.Heal(self: Enemy, amount: number)
  self.Health = math.min(self.MaxHealth, self.Health + amount)
end

return Enemy`,
  },
  {
    name: 'OOP Inheritance via Metatables',
    category: 'oop',
    keywords: ['class', 'inheritance', 'extends', 'super', 'parent', 'child', 'metatable'],
    code: `--!strict
-- BASE CLASS
local Character = {}
Character.__index = Character

export type Character = typeof(setmetatable({} :: {
  Name: string,
  Health: number,
  Speed: number,
}, Character))

function Character.new(name: string, health: number): Character
  return setmetatable({
    Name = name,
    Health = health,
    Speed = 16,
  }, Character)
end

function Character.TakeDamage(self: Character, amount: number)
  self.Health = math.max(0, self.Health - amount)
end

-- CHILD CLASS
local Warrior = {}
Warrior.__index = Warrior
setmetatable(Warrior, { __index = Character }) -- inherit methods

export type Warrior = typeof(setmetatable({} :: {
  Name: string,
  Health: number,
  Speed: number,
  Armor: number,
  Rage: number,
}, Warrior))

function Warrior.new(name: string): Warrior
  local self = Character.new(name, 200) :: any
  self.Armor = 50
  self.Rage = 0
  return setmetatable(self, Warrior)
end

function Warrior.TakeDamage(self: Warrior, amount: number)
  local reduced = math.max(0, amount - self.Armor)
  self.Health = math.max(0, self.Health - reduced)
  self.Rage = math.min(100, self.Rage + 10)
end

return Warrior`,
  },
  {
    name: 'All Metamethods Reference',
    category: 'oop',
    keywords: ['metatable', 'metamethod', '__index', '__newindex', '__call', '__tostring', '__add', '__eq', '__len', '__iter'],
    code: `-- COMMON METAMETHODS:
-- __index      = Fires when accessing a MISSING key
--               table: set __index to another table for inheritance
--               function: __index(self, key) -> value
-- __newindex   = Fires when setting a NEW key (not existing)
--               function: __newindex(self, key, value)
-- __call       = Makes table callable like a function: myTable()
-- __tostring   = Custom string output: tostring(myTable)
-- __len        = Custom # operator: #myTable
-- __add        = Custom + operator
-- __sub        = Custom - operator
-- __mul        = Custom * operator
-- __div        = Custom / operator
-- __mod        = Custom % operator
-- __pow        = Custom ^ operator
-- __unm        = Custom unary - operator
-- __eq         = Custom == comparison
-- __lt         = Custom < comparison
-- __le         = Custom <= comparison
-- __concat     = Custom .. operator
-- __iter       = Custom for-in iteration
-- __metatable  = Locks metatable: getmetatable() returns this value

-- EXAMPLE: Vector2 class with operator overloads
local Vec2 = {}
Vec2.__index = Vec2
Vec2.__add = function(a, b) return Vec2.new(a.X + b.X, a.Y + b.Y) end
Vec2.__sub = function(a, b) return Vec2.new(a.X - b.X, a.Y - b.Y) end
Vec2.__mul = function(a, b)
  if type(b) == "number" then return Vec2.new(a.X * b, a.Y * b) end
  return Vec2.new(a.X * b.X, a.Y * b.Y)
end
Vec2.__tostring = function(v) return "("..v.X..", "..v.Y..")" end
Vec2.__eq = function(a, b) return a.X == b.X and a.Y == b.Y end
Vec2.__len = function(v) return math.sqrt(v.X^2 + v.Y^2) end

function Vec2.new(x: number, y: number)
  return setmetatable({ X = x, Y = y }, Vec2)
end`,
  },
  {
    name: 'Closure-Based Class (No Metatables)',
    category: 'oop',
    keywords: ['class', 'closure', 'no metatable', 'private', 'encapsulation'],
    code: `-- Alternative: closure-based class with TRUE private state
local function createTimer(duration: number)
  local timeElapsed = 0  -- truly private, no way to access from outside
  local running = false
  local callbacks: {() -> ()} = {}

  local self = {}

  function self:Start()
    if running then return end
    running = true
    task.spawn(function()
      while running and timeElapsed < duration do
        task.wait(1)
        timeElapsed += 1
      end
      if timeElapsed >= duration then
        for _, cb in callbacks do cb() end
      end
    end)
  end

  function self:Stop()
    running = false
  end

  function self:GetTimeRemaining(): number
    return math.max(0, duration - timeElapsed)
  end

  function self:OnComplete(callback: () -> ())
    table.insert(callbacks, callback)
  end

  return self
end

return { new = createTimer }`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// LUAU TYPE SYSTEM PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TYPE_PATTERNS: LuauPattern[] = [
  {
    name: 'Luau Type Annotations Complete',
    category: 'types',
    keywords: ['type', 'annotation', 'strict', 'luau', 'typing', 'typed'],
    code: `--!strict
-- PRIMITIVES
local name: string = "Player1"
local health: number = 100
local alive: boolean = true
local part: Part = Instance.new("Part")

-- NULLABLE (suffix with ?)
local target: Player? = nil
local hitPart: BasePart? = workspace:FindFirstChild("HitBox") :: BasePart?

-- FUNCTION TYPES
local greet: (name: string) -> string = function(n)
  return "Hello "..n
end
local transform: (Vector3, CFrame) -> (Vector3, Vector3) = function(pos, cf)
  return cf:PointToWorldSpace(pos), cf.LookVector
end
local noReturn: (string) -> () = function(msg) print(msg) end
local variadic: (...number) -> number = function(...)
  local sum = 0
  for _, v in {...} do sum += v end
  return sum
end

-- ARRAYS & DICTIONARIES
local items: {string} = {"Sword", "Shield", "Potion"}
local scores: {[Player]: number} = {}
local grid: {{number}} = {{1,2},{3,4}}

-- TYPE ALIASES
type Inventory = {
  Items: {string},
  Gold: number,
  Capacity: number,
}

-- UNION TYPES
type Result = "success" | "failure" | "pending"
type Numeric = number | Vector3

-- EXPORT TYPES (from ModuleScripts)
export type WeaponConfig = {
  Name: string,
  Damage: number,
  Range: number,
  FireRate: number?,       -- optional field
  ProjectileSpeed: number?,
}`,
  },
  {
    name: 'Type Narrowing & Refinement',
    category: 'types',
    keywords: ['type', 'narrowing', 'refinement', 'guard', 'isa', 'typeof', 'assert'],
    code: `--!strict
-- IF-CHECK NARROWS NULLABLE
local target: Player? = game.Players:FindFirstChild("Vyren") :: Player?
if target then
  print(target.Name) -- type is now Player, not Player?
end

-- EARLY RETURN NARROWS
local function process(part: BasePart?)
  if not part then return end
  -- part is now BasePart (non-nil) from here on
  print(part.Position)
end

-- ASSERT NARROWS
local player: Player? = game.Players.LocalPlayer
assert(player, "No local player!")
print(player.Name) -- narrowed to Player

-- ISA() NARROWS INSTANCE TYPE
local obj: Instance = workspace:FindFirstChild("Something") :: Instance
if obj:IsA("BasePart") then
  print(obj.Size)     -- knows it is BasePart
  print(obj.Position) -- full autocomplete
end

-- TYPEOF() NARROWS
local value: unknown = "hello"
if typeof(value) == "string" then
  print(string.upper(value)) -- knows it is string
elseif typeof(value) == "number" then
  print(value + 1)           -- knows it is number
end

-- TYPECAST WITH ::
local bodyColors = Instance.new("BodyColors");
(bodyColors :: any).HeadColor3 = Color3.new(1, 0, 0)

-- INLINE TABLE CAST
local data = {
  Kills = {} :: {[Player]: number},
  Deaths = {} :: {[Player]: number},
}`,
  },
  {
    name: 'Typed OOP Class Pattern',
    category: 'types',
    keywords: ['type', 'class', 'oop', 'export type', 'metatable', 'typed class'],
    code: `--!strict
local Vehicle = {}
Vehicle.__index = Vehicle

type VehicleFields = {
  Model: Model,
  Speed: number,
  MaxSpeed: number,
  Driver: Player?,
}

export type Vehicle = typeof(setmetatable({} :: VehicleFields, Vehicle))

function Vehicle.new(model: Model, maxSpeed: number): Vehicle
  return setmetatable({
    Model = model,
    Speed = 0,
    MaxSpeed = maxSpeed,
    Driver = nil,
  } :: VehicleFields, Vehicle)
end

function Vehicle.Accelerate(self: Vehicle, dt: number)
  self.Speed = math.min(self.MaxSpeed, self.Speed + 20 * dt)
end

function Vehicle.Brake(self: Vehicle, dt: number)
  self.Speed = math.max(0, self.Speed - 40 * dt)
end

-- USING THE TYPE FROM ANOTHER MODULE:
-- local Vehicle = require(path.to.Vehicle)
-- type Vehicle = Vehicle.Vehicle
-- local car: Vehicle = Vehicle.new(workspace.Car, 100)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC & PROMISE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ASYNC_PATTERNS: LuauPattern[] = [
  {
    name: 'Task Library Complete Reference',
    category: 'async',
    keywords: ['task', 'spawn', 'defer', 'delay', 'wait', 'cancel', 'async', 'thread'],
    code: `-- task.spawn(func, ...args) -- Run IMMEDIATELY in new thread
-- Use when: calling yielding functions without blocking current code
task.spawn(function()
  local data = DataStore:GetAsync("key") -- yields but does not block caller
  print("Got data:", data)
end)

-- Passing args directly (more efficient than closure):
task.spawn(print, "Hello", "World") --> Hello World (immediate)

-- task.defer(func, ...args) -- Run AFTER current thread completes
-- Use when: scheduling work that should not interrupt current execution
print("A")
task.defer(print, "C") -- queued for next resumption cycle
print("B")
--> A, B, C

-- task.delay(seconds, func, ...args) -- Run after N seconds on next Heartbeat
-- Use when: scheduling future work with specific timing
task.delay(5, function()
  print("5 seconds have passed!")
end)
-- Can pass os.clock() to measure actual elapsed time:
task.delay(2, function(scheduledTime)
  print("Actual delay:", os.clock() - scheduledTime)
end, os.clock())

-- task.wait(seconds?) -- Yield current thread, resume after N seconds
-- Returns actual elapsed time. Default 0 = next Heartbeat.
local elapsed = task.wait(1) --> ~1.016 (slightly over due to frame timing)
-- Equivalent to: RunService.Heartbeat:Wait()

-- task.cancel(thread) -- Cancel a spawned/deferred thread
local thread = task.delay(10, function()
  print("This will never run")
end)
task.cancel(thread)

-- task.desynchronize() -- Switch to parallel execution (Parallel Luau)
-- task.synchronize()  -- Switch back to serial execution`,
  },
  {
    name: 'Promise Pattern (evaera library)',
    category: 'async',
    keywords: ['promise', 'async', 'then', 'catch', 'chain', 'error handling'],
    code: `-- Promise library by evaera (most popular async pattern in Roblox)
-- Install: get from GitHub evaera/roblox-lua-promise
local Promise = require(ReplicatedStorage.Packages.Promise)

-- BASIC: Wrap yielding call in a Promise
local function fetchPlayerData(userId: number)
  return Promise.new(function(resolve, reject)
    local ok, data = pcall(DataStore.GetAsync, DataStore, "user_"..userId)
    if ok then resolve(data) else reject(data) end
  end)
end

-- CHAINING: Transform data through pipeline
fetchPlayerData(12345)
  :andThen(function(data)
    return processData(data)  -- can return another Promise
  end)
  :andThen(function(processed)
    applyToPlayer(processed)
  end)
  :catch(function(err)
    warn("Failed:", tostring(err))
  end)

-- CANCELLATION: Clean up resources if cancelled
local function tweenPromise(obj, info, props)
  return Promise.new(function(resolve, reject, onCancel)
    local tween = TweenService:Create(obj, info, props)
    onCancel(function()
      tween:Cancel()  -- cleanup on cancel
    end)
    tween.Completed:Connect(resolve)
    tween:Play()
  end)
end

-- PARALLEL: Wait for multiple promises
Promise.all({
  fetchPlayerData(111),
  fetchPlayerData(222),
  fetchPlayerData(333),
}):andThen(function(results)
  print("All 3 loaded:", results)
end)

-- RACE: First to resolve wins
Promise.race({
  fetchPlayerData(111),
  Promise.delay(5):andThen(function() error("Timeout") end),
}):catch(function(err) warn(err) end)`,
  },
  {
    name: 'Coroutine Patterns',
    category: 'async',
    keywords: ['coroutine', 'thread', 'yield', 'resume', 'wrap', 'async'],
    code: `-- coroutine.create + coroutine.resume (manual control)
local co = coroutine.create(function(x)
  print("Step 1:", x)
  local y = coroutine.yield("paused")
  print("Step 2:", y)
  return "done"
end)
local ok, val = coroutine.resume(co, 10) --> Step 1: 10, val = "paused"
local ok2, val2 = coroutine.resume(co, 20) --> Step 2: 20, val2 = "done"

-- coroutine.wrap (simpler, returns a function)
local next = coroutine.wrap(function()
  for i = 1, 5 do
    coroutine.yield(i)
  end
end)
print(next()) --> 1
print(next()) --> 2

-- PREFER task.spawn OVER raw coroutines for Roblox:
-- task.spawn integrates with the scheduler (errors show in output)
-- raw coroutines swallow errors silently unless you check pcall

-- PATTERN: Iterator using coroutines
local function range(start: number, stop: number, step: number?)
  return coroutine.wrap(function()
    local s = step or 1
    for i = start, stop, s do
      coroutine.yield(i)
    end
  end)
end
for i in range(1, 10, 2) do print(i) end --> 1, 3, 5, 7, 9`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SIGNAL & EVENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const SIGNAL_PATTERNS: LuauPattern[] = [
  {
    name: 'GoodSignal Custom Event Class',
    category: 'events',
    keywords: ['signal', 'event', 'goodsignal', 'custom event', 'fire', 'connect', 'bindable'],
    code: `-- GoodSignal by stravant -- the gold standard custom Signal for Roblox
-- Batch yield-safe, coroutine-pooled, 2x faster than alternatives
-- Full source: gist.github.com/stravant/b75a322e0919d60dde8a0316d1f09d2f

local Signal = require(ReplicatedStorage.Packages.Signal) -- or GoodSignal

-- CREATE
local onDamage = Signal.new()

-- CONNECT (returns connection object)
local conn = onDamage:Connect(function(target, amount)
  print(target.Name, "took", amount, "damage")
end)

-- ONCE (auto-disconnects after first fire)
onDamage:Once(function(target, amount)
  print("First hit:", amount)
end)

-- FIRE (triggers all connected handlers)
onDamage:Fire(targetPlayer, 25)

-- WAIT (yields until next fire, returns args)
local target, amount = onDamage:Wait()

-- DISCONNECT single connection
conn:Disconnect()

-- DISCONNECT ALL
onDamage:DisconnectAll()

-- DESTROY (cleanup, no reuse)
onDamage:Destroy()

-- WHEN TO USE SIGNAL vs BINDABLEEVENT:
-- Signal: in-module communication, no Instance overhead, faster, typed
-- BindableEvent: when you need an Instance-based event in the tree
-- BindableEvent: cross-script without shared require
-- RemoteEvent: client-server communication ONLY`,
  },
  {
    name: 'Event Bus Pattern',
    category: 'events',
    keywords: ['event bus', 'pub sub', 'publish', 'subscribe', 'observer', 'decouple'],
    code: `-- Global Event Bus: decouple systems that don't need direct references
local Signal = require(ReplicatedStorage.Packages.Signal)

local EventBus = {}
local events: {[string]: typeof(Signal.new())} = {}

function EventBus:Subscribe(eventName: string, handler: (...any) -> ())
  if not events[eventName] then
    events[eventName] = Signal.new()
  end
  return events[eventName]:Connect(handler)
end

function EventBus:Publish(eventName: string, ...: any)
  if events[eventName] then
    events[eventName]:Fire(...)
  end
end

function EventBus:Clear(eventName: string)
  if events[eventName] then
    events[eventName]:DisconnectAll()
    events[eventName] = nil
  end
end

return EventBus

-- Usage from ANY module:
-- EventBus:Publish("PlayerScored", player, 100)
-- local conn = EventBus:Subscribe("PlayerScored", function(player, pts)
--   print(player.Name, "scored", pts)
-- end)`,
  },
  {
    name: 'Connection Cleanup & Memory Leak Prevention',
    category: 'events',
    keywords: ['memory leak', 'disconnect', 'cleanup', 'janitor', 'maid', 'connection', 'destroy'],
    code: `-- MEMORY LEAK CAUSE: Connections prevent garbage collection!
-- If a closure references a Part, and is connected to that Part event,
-- GC cannot detect the cycle (connection list is C++ side).

-- RULE 1: Always :Disconnect() or :Destroy() when done
local conn = part.Touched:Connect(function(hit) print(hit) end)
conn:Disconnect() -- breaks the reference cycle

-- RULE 2: :Destroy() disconnects ALL connections on an Instance + children
part:Destroy() -- implicitly disconnects everything

-- RULE 3: Use Janitor for complex cleanup
local Janitor = require(ReplicatedStorage.Packages.Janitor)
local jani = Janitor.new()

-- Add connections
jani:Add(part.Touched:Connect(function(hit) end))

-- Add instances (destroyed on cleanup)
jani:Add(Instance.new("Part", workspace), "Destroy")

-- Add custom cleanup functions
jani:Add(function() print("Cleaned up!") end)

-- Link to instance lifecycle (auto-cleanup when instance destroyed)
jani:LinkToInstance(part)

-- Manual cleanup
jani:Cleanup()   -- reusable after
jani:Destroy()   -- one-time, no reuse

-- RULE 4: Self-disconnecting one-shot connections
local conn2
conn2 = event:Connect(function(...)
  conn2:Disconnect()
  -- handle once
end)

-- RULE 5: Server leaks matter MORE than client (sessions are longer)
-- Debris:AddItem(part, 5) -- destroys part after 5 seconds (handles cleanup)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const STATE_MACHINE_PATTERNS: LuauPattern[] = [
  {
    name: 'Finite State Machine (Table-Based)',
    category: 'state-machine',
    keywords: ['state machine', 'fsm', 'state', 'transition', 'npc', 'ai', 'finite'],
    code: `-- Table-driven FSM: define states and valid transitions as data
local Signal = require(ReplicatedStorage.Packages.Signal)

local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(initialState: string, transitions: {[string]: {[string]: string}})
  local self = setmetatable({
    current = initialState,
    transitions = transitions,
    onStateChanged = Signal.new(),
    _enterCallbacks = {} :: {[string]: (string) -> ()},
    _exitCallbacks = {} :: {[string]: (string) -> ()},
  }, StateMachine)
  return self
end

function StateMachine:GetState(): string
  return self.current
end

function StateMachine:Transition(action: string): boolean
  local stateTransitions = self.transitions[self.current]
  if not stateTransitions then return false end
  local nextState = stateTransitions[action]
  if not nextState then return false end

  local prevState = self.current
  if self._exitCallbacks[prevState] then
    self._exitCallbacks[prevState](nextState)
  end
  self.current = nextState
  if self._enterCallbacks[nextState] then
    self._enterCallbacks[nextState](prevState)
  end
  self.onStateChanged:Fire(prevState, nextState)
  return true
end

function StateMachine:OnEnter(state: string, callback: (fromState: string) -> ())
  self._enterCallbacks[state] = callback
end

function StateMachine:OnExit(state: string, callback: (toState: string) -> ())
  self._exitCallbacks[state] = callback
end

-- USAGE:
-- local npcFSM = StateMachine.new("Idle", {
--   Idle    = { PlayerNear = "Chase",  TakeDamage = "Flee"  },
--   Chase   = { ReachPlayer = "Attack", LosePlayer = "Idle" },
--   Attack  = { PlayerDead = "Idle",   TakeDamage = "Flee"  },
--   Flee    = { Safe = "Idle",         Cornered = "Attack"  },
-- })
-- npcFSM:OnEnter("Chase", function() startPathfinding() end)
-- npcFSM:OnExit("Chase", function() stopPathfinding() end)`,
  },
  {
    name: 'NPC AI State Machine',
    category: 'state-machine',
    keywords: ['npc', 'ai', 'state', 'patrol', 'chase', 'attack', 'idle', 'enemy'],
    code: `-- Practical NPC AI using heartbeat + state machine
local RunService = game:GetService("RunService")

type NPCState = "Idle" | "Patrol" | "Chase" | "Attack" | "Dead"

local NPC = {}
NPC.__index = NPC

function NPC.new(model: Model)
  local humanoid = model:FindFirstChildOfClass("Humanoid")
  local root = model:FindFirstChild("HumanoidRootPart") :: BasePart
  return setmetatable({
    Model = model,
    Humanoid = humanoid,
    Root = root,
    State = "Patrol" :: NPCState,
    Target = nil :: Player?,
    PatrolPoints = {} :: {Vector3},
    PatrolIndex = 1,
    AggroRange = 40,
    AttackRange = 5,
    AttackCooldown = 0,
  }, NPC)
end

function NPC:Update(dt: number)
  if self.State == "Dead" then return end

  if self.State == "Patrol" then
    self:_patrol(dt)
    local target = self:_findNearestPlayer()
    if target then
      self.Target = target
      self.State = "Chase"
    end
  elseif self.State == "Chase" then
    if not self.Target or not self.Target.Character then
      self.State = "Patrol"
      return
    end
    local dist = (self.Root.Position - self.Target.Character.HumanoidRootPart.Position).Magnitude
    if dist <= self.AttackRange then
      self.State = "Attack"
    elseif dist > self.AggroRange then
      self.Target = nil
      self.State = "Patrol"
    else
      self.Humanoid:MoveTo(self.Target.Character.HumanoidRootPart.Position)
    end
  elseif self.State == "Attack" then
    self.AttackCooldown -= dt
    if self.AttackCooldown <= 0 then
      self:_doAttack()
      self.AttackCooldown = 1.5
    end
    if not self.Target or not self.Target.Character then
      self.State = "Patrol"
    end
  end
end`,
  },
  {
    name: 'Modular State with Enter/Exit/Update',
    category: 'state-machine',
    keywords: ['state', 'enter', 'exit', 'update', 'modular', 'lifecycle', 'base state'],
    code: `-- Modular FSM: each state is its own module with Enter/Update/Exit
-- BaseState.lua
local BaseState = {}
BaseState.__index = BaseState

function BaseState.new(machine)
  return setmetatable({ Machine = machine }, BaseState)
end

function BaseState:Enter(previousState: string, data: any?) end
function BaseState:Update(dt: number) end
function BaseState:Exit(nextState: string) end
function BaseState:CanTransition(toState: string): boolean return true end

return BaseState

-- IdleState.lua
local BaseState = require(script.Parent.Parent.BaseState)
local IdleState = setmetatable({}, BaseState)
IdleState.__index = IdleState

function IdleState.new(machine)
  local self = BaseState.new(machine)
  return setmetatable(self, IdleState)
end

function IdleState:Enter(prev, data)
  print("Entered Idle from", prev)
  -- play idle animation, etc.
end

function IdleState:Update(dt)
  -- check for transitions
  if self:detectPlayer() then
    self.Machine:Transition("Chase")
  end
end

function IdleState:Exit(next)
  -- stop idle animation
end

return IdleState`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TWEEN & ANIMATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TWEEN_PATTERNS: LuauPattern[] = [
  {
    name: 'TweenService Complete Reference',
    category: 'tween',
    keywords: ['tween', 'tweenservice', 'animate', 'interpolate', 'easing', 'tweeninfo'],
    code: `local TweenService = game:GetService("TweenService")

-- TweenInfo.new(time, easingStyle, easingDirection, repeatCount, reverses, delayTime)
-- time:           seconds (default 1)
-- easingStyle:    Linear|Quad|Cubic|Quart|Quint|Sine|Exponential|Circular|Elastic|Back|Bounce
-- easingDirection: In|Out|InOut (default Out)
-- repeatCount:    -1 = infinite, 0 = play once (default 0)
-- reverses:       play backwards after forward (default false)
-- delayTime:      seconds before starting (default 0)

-- BASIC TWEEN
local info = TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local tween = TweenService:Create(part, info, {
  Position = Vector3.new(0, 20, 0),
  Transparency = 0.5,
})
tween:Play()

-- WAIT FOR COMPLETION
tween.Completed:Wait()
print("Tween done!")

-- CHAIN TWEENS (sequential)
local function chainTweens(obj: Instance, tweenList: {{Info: TweenInfo, Props: {[string]: any}}})
  task.spawn(function()
    for _, t in tweenList do
      local tw = TweenService:Create(obj, t.Info, t.Props)
      tw:Play()
      tw.Completed:Wait()
    end
  end)
end

-- TWEEN METHODS:
-- tween:Play()   -- start or resume
-- tween:Pause()  -- suspend (resume with Play)
-- tween:Cancel() -- stop and reset to original values

-- TWEENABLE TYPES: number, boolean, CFrame, Color3, UDim, UDim2, Vector2, Vector3, Rect, EnumItem

-- TWEEN MODEL (tween PrimaryPart CFrame, model follows)
local model = workspace.MyModel
local goal = {CFrame = CFrame.new(0, 10, 0)}
local modelTween = TweenService:Create(model.PrimaryPart, info, goal)
modelTween:Play()

-- UI TWEEN
local frame = script.Parent.Frame
TweenService:Create(frame, TweenInfo.new(0.3, Enum.EasingStyle.Back), {
  Position = UDim2.fromScale(0.5, 0.5),
  Size = UDim2.fromScale(0.4, 0.3),
}):Play()`,
  },
  {
    name: 'Spring Animation Module',
    category: 'tween',
    keywords: ['spring', 'spr', 'bounce', 'physics', 'smooth', 'animation', 'damping'],
    code: `-- Spring-based animation: more natural feel than TweenService
-- Popular libraries: spr, SpringService, Quantum
-- Springs have: damping ratio, frequency, target value

-- MANUAL SPRING (no library needed):
local Spring = {}
Spring.__index = Spring

function Spring.new(initial: number, damping: number, frequency: number)
  return setmetatable({
    Position = initial,
    Velocity = 0,
    Target = initial,
    Damping = damping,     -- 0 = no damping, 1 = critical, >1 = overdamped
    Frequency = frequency, -- oscillations per second
  }, Spring)
end

function Spring:SetTarget(target: number)
  self.Target = target
end

function Spring:Update(dt: number): number
  local d = self.Damping
  local f = self.Frequency * 2 * math.pi
  local x = self.Position - self.Target
  local v = self.Velocity
  local decay = math.exp(-d * f * dt)
  if d < 1 then -- underdamped (bouncy)
    local fd = f * math.sqrt(1 - d * d)
    local c = (v + d * f * x) / fd
    self.Position = self.Target + decay * (x * math.cos(fd * dt) + c * math.sin(fd * dt))
    self.Velocity = self.Target + decay * ((c * fd - d * f * x) * math.cos(fd * dt) - (x * fd + d * f * c) * math.sin(fd * dt)) - self.Target
  else -- critically damped or overdamped
    self.Position = self.Target + decay * (x + (v + f * x) * dt)
    self.Velocity = decay * (v - (v + f * x) * f * dt)
  end
  return self.Position
end

-- Usage with RunService:
-- local spring = Spring.new(0, 0.5, 8) -- bouncy
-- spring:SetTarget(100)
-- RunService.Heartbeat:Connect(function(dt)
--   local val = spring:Update(dt)
--   frame.Position = UDim2.fromOffset(val, 0)
-- end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// RAYCASTING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const RAYCAST_PATTERNS: LuauPattern[] = [
  {
    name: 'Raycasting Complete Reference',
    category: 'raycast',
    keywords: ['raycast', 'ray', 'hit detection', 'line of sight', 'workspace raycast'],
    code: `-- workspace:Raycast(origin: Vector3, direction: Vector3, params?: RaycastParams): RaycastResult?
-- Direction magnitude = ray LENGTH (max 15,000 studs)

local Workspace = game:GetService("Workspace")

-- SETUP RAYCAST PARAMS (modern API)
local params = RaycastParams.new()
params.ExcludeInstances = {character}  -- exclude specific instances
params.IncludeInstances = nil          -- nil = include everything
params.IgnoreWater = true
params.CollisionGroup = "Default"
params.RespectCanCollide = false  -- true = skip CanCollide=false parts
-- Note: ExcludeInstances takes priority over IncludeInstances

-- PERFORM RAYCAST
local origin = character.HumanoidRootPart.Position
local direction = character.HumanoidRootPart.CFrame.LookVector * 100
local result = Workspace:Raycast(origin, direction, params)

-- RESULT PROPERTIES
if result then
  result.Instance   -- BasePart or Terrain cell that was hit
  result.Position   -- Vector3: exact intersection point
  result.Normal     -- Vector3: surface normal at hit point
  result.Distance   -- number: distance from origin to hit
  result.Material   -- Enum.Material: material at intersection
end`,
  },
  {
    name: 'Shapecast (Sphere, Block, Shape)',
    category: 'raycast',
    keywords: ['spherecast', 'blockcast', 'shapecast', 'collision', 'sweep', 'overlap'],
    code: `-- SPHERECAST: Cast a sphere along a direction (thick raycast)
-- workspace:Spherecast(position, radius, direction, params?)
-- radius max: 256 studs, direction max: 1024 studs
local sphereResult = workspace:Spherecast(
  Vector3.new(0, 50, 0), -- start position
  5,                      -- radius in studs
  Vector3.new(0, -50, 0), -- direction + distance
  params                   -- same RaycastParams
)

-- BLOCKCAST: Cast a box along a direction
-- workspace:Blockcast(cframe, size, direction, params?)
-- size max: 512 studs per axis
local blockResult = workspace:Blockcast(
  CFrame.new(0, 50, 0),       -- start position + orientation
  Vector3.new(4, 2, 4),        -- box size
  Vector3.new(0, -50, 0),      -- direction + distance
  params
)

-- SHAPECAST: Cast using an existing part shape
-- workspace:Shapecast(part, direction, params?)
local shapeResult = workspace:Shapecast(
  workspace.HitboxPart,        -- part defines shape
  Vector3.new(0, 0, -20),      -- direction + distance
  params
)

-- ALL return RaycastResult? (same properties as Raycast)
-- NOTE: Does NOT detect parts that ALREADY overlap the initial shape

-- COMMON USES:
-- Ground detection: Spherecast(charPos, 2, Vector3.new(0, -10, 0))
-- Wall check:       Blockcast(charCF, Vector3.new(3,5,3), moveDir * 5)
-- Hitbox:           Shapecast(swordHitbox, swingDirection * 5)
-- Projectile:       Spherecast(bulletPos, bulletRadius, velocity * dt)`,
  },
  {
    name: 'Ground Detection & Wall Check',
    category: 'raycast',
    keywords: ['ground', 'floor', 'wall', 'check', 'grounded', 'raycast', 'jump'],
    code: `-- GROUND DETECTION (is player on the ground?)
local function isGrounded(character: Model): (boolean, RaycastResult?)
  local root = character:FindFirstChild("HumanoidRootPart") :: BasePart
  if not root then return false, nil end
  local params = RaycastParams.new()
  params.ExcludeInstances = {character}
  local result = workspace:Raycast(
    root.Position,
    Vector3.new(0, -4, 0), -- slightly more than half character height
    params
  )
  return result ~= nil, result
end

-- WALL CHECK (is there a wall in front?)
local function wallAhead(character: Model, distance: number): boolean
  local root = character:FindFirstChild("HumanoidRootPart") :: BasePart
  if not root then return false end
  local params = RaycastParams.new()
  params.ExcludeInstances = {character}
  local result = workspace:Raycast(
    root.Position,
    root.CFrame.LookVector * distance,
    params
  )
  return result ~= nil
end

-- LINE OF SIGHT (can NPC see player?)
local function hasLineOfSight(fromPos: Vector3, toPos: Vector3, ignore: {Instance}): boolean
  local params = RaycastParams.new()
  params.ExcludeInstances = ignore
  local dir = toPos - fromPos
  local result = workspace:Raycast(fromPos, dir, params)
  return result == nil or result.Distance >= dir.Magnitude - 1
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HANDLING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const INPUT_PATTERNS: LuauPattern[] = [
  {
    name: 'UserInputService Input Handling',
    category: 'input',
    keywords: ['input', 'keyboard', 'mouse', 'userinputservice', 'keybind', 'click', 'key'],
    code: `local UIS = game:GetService("UserInputService")

-- KEYBOARD INPUT
UIS.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
  if gameProcessed then return end -- ignore if typing in chat, etc.
  if input.KeyCode == Enum.KeyCode.E then
    print("E pressed -- interact!")
  elseif input.KeyCode == Enum.KeyCode.LeftShift then
    print("Sprint started")
  end
end)

UIS.InputEnded:Connect(function(input: InputObject, gameProcessed: boolean)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    print("Sprint ended")
  end
end)

-- CHECK IF KEY IS HELD
if UIS:IsKeyDown(Enum.KeyCode.W) then
  print("W is currently held")
end

-- MOUSE INPUT
UIS.InputBegan:Connect(function(input, gp)
  if gp then return end
  if input.UserInputType == Enum.UserInputType.MouseButton1 then
    print("Left click at:", UIS:GetMouseLocation())
  elseif input.UserInputType == Enum.UserInputType.MouseButton2 then
    print("Right click")
  end
end)

-- TOUCH INPUT (mobile)
UIS.TouchStarted:Connect(function(touch: InputObject, gp: boolean)
  print("Touch at:", touch.Position)
end)

-- GAMEPAD INPUT
UIS.InputBegan:Connect(function(input, gp)
  if input.UserInputType == Enum.UserInputType.Gamepad1 then
    if input.KeyCode == Enum.KeyCode.ButtonA then
      print("A button pressed")
    end
  end
end)`,
  },
  {
    name: 'ContextActionService (Context-Aware Input)',
    category: 'input',
    keywords: ['contextaction', 'bind', 'action', 'mobile button', 'context', 'unbind', 'touch'],
    code: `local CAS = game:GetService("ContextActionService")

-- BIND ACTION (key + auto mobile button)
-- BindAction(actionName, handler, createTouchButton, ...inputTypes)
local ACTION_RELOAD = "Reload"

local function onReload(actionName: string, inputState: Enum.UserInputState, inputObj: InputObject)
  if inputState ~= Enum.UserInputState.Begin then
    return Enum.ContextActionResult.Pass  -- let other handlers try
  end
  print("Reloading!")
  return Enum.ContextActionResult.Sink  -- consume input
end

-- Bind when tool equipped, unbind when unequipped
tool.Equipped:Connect(function()
  CAS:BindAction(ACTION_RELOAD, onReload, true, Enum.KeyCode.R)
end)
tool.Unequipped:Connect(function()
  CAS:UnbindAction(ACTION_RELOAD)
end)

-- PRIORITY BINDING (higher number = checked first)
CAS:BindActionAtPriority("Throw", onThrow, false, 2, Enum.KeyCode.Z)
CAS:BindActionAtPriority("Eat", onEat, false, 1, Enum.KeyCode.Z)
-- Z pressed -> Throw checked first (priority 2), if it returns Pass -> Eat runs

-- CUSTOMIZE TOUCH BUTTON
CAS:SetImage(ACTION_RELOAD, "rbxassetid://123456")
CAS:SetTitle(ACTION_RELOAD, "R")
CAS:SetPosition(ACTION_RELOAD, UDim2.new(0.7, 0, 0.5, 0))

-- WHEN TO USE UIS vs CAS:
-- UIS: Raw input detection, mouse position, keyboard state, input type detection
-- CAS: Action-based input that changes with game context (equip/unequip, vehicle)
-- CAS: Automatic mobile button support
-- CAS: Priority stacking (multiple handlers on same key)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// STRING & SERIALIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const STRING_SERIAL_PATTERNS: LuauPattern[] = [
  {
    name: 'Luau String Pattern Reference',
    category: 'string',
    keywords: ['string', 'pattern', 'match', 'find', 'gsub', 'gmatch', 'regex', 'text'],
    code: `-- LUAU PATTERNS (NOT regex -- simpler, no alternation or backrefs)

-- CHARACTER CLASSES:
-- %a = letters       %A = non-letters
-- %d = digits        %D = non-digits
-- %l = lowercase     %L = non-lowercase
-- %u = uppercase     %U = non-uppercase
-- %w = alphanumeric  %W = non-alphanumeric
-- %s = whitespace    %S = non-whitespace
-- %p = punctuation   %P = non-punctuation
-- %c = control chars %x = hexadecimal
-- .  = any character

-- QUANTIFIERS:
-- +  = 1 or more (greedy)
-- *  = 0 or more (greedy)
-- -  = 0 or more (lazy/minimal)
-- ?  = 0 or 1

-- ANCHORS:
-- ^  = start of string
-- $  = end of string

-- SETS:
-- [abc]  = any of a, b, c
-- [a-z]  = range a to z
-- [^abc] = anything except a, b, c

-- MAGIC CHARS (escape with %): $ % ^ * ( ) . [ ] + - ?

-- string.match(str, pattern): first match or nil
local num = string.match("Score: 42", "%d+") --> "42"
local a, b = string.match("x=10, y=20", "x=(%d+), y=(%d+)") --> "10", "20"

-- string.find(str, pattern, init?, plain?): start, end positions
local s, e = string.find("Hello World", "World") --> 7, 11

-- string.gsub(str, pattern, replacement, maxN?)
local clean = string.gsub("a1b2c3", "%d", "") --> "abc"
local swapped = string.gsub("2025-04-25", "(%d+)-(%d+)-(%d+)", "%3/%2/%1") --> "25/04/2025"

-- string.gmatch(str, pattern): iterator over all matches
for word in string.gmatch("Hello World Foo", "%w+") do
  print(word) --> Hello, World, Foo
end

-- COMMON PATTERNS:
-- "^%s*(.-)%s*$"     -- trim whitespace
-- "%d+"              -- integer
-- "%d+%.?%d*"        -- decimal number
-- "[%w_]+"           -- identifier
-- "%b()"             -- balanced parentheses`,
  },
  {
    name: 'JSON & Data Serialization',
    category: 'string',
    keywords: ['json', 'encode', 'decode', 'serialize', 'httpservice', 'data', 'buffer'],
    code: `local HttpService = game:GetService("HttpService")

-- JSON ENCODE (table -> string)
local data = { Name = "Vyren", Level = 42, Items = {"Sword", "Shield"} }
local jsonStr = HttpService:JSONEncode(data)
--> {"Name":"Vyren","Level":42,"Items":["Sword","Shield"]}

-- JSON DECODE (string -> table)
local parsed = HttpService:JSONDecode(jsonStr)
print(parsed.Name) --> "Vyren"

-- BUFFER: Compact binary data (faster than tables for large datasets)
-- buffer.create(size): zero-initialized buffer of N bytes
-- Read/Write: i8, u8, i16, u16, i32, u32, f32, f64
local buf = buffer.create(12) -- 12 bytes = 3 floats
buffer.writef32(buf, 0, 1.5)  -- write float at offset 0
buffer.writef32(buf, 4, 2.5)  -- write float at offset 4
buffer.writef32(buf, 8, 3.5)  -- write float at offset 8
local x = buffer.readf32(buf, 0) --> 1.5

-- BUFFER FOR NETWORK: Send compact position data
local function encodePositions(positions: {Vector3}): buffer
  local buf = buffer.create(#positions * 12)
  for i, pos in positions do
    local offset = (i - 1) * 12
    buffer.writef32(buf, offset, pos.X)
    buffer.writef32(buf, offset + 4, pos.Y)
    buffer.writef32(buf, offset + 8, pos.Z)
  end
  return buf
end

-- buffer.fromstring(str) / buffer.tostring(buf)
-- buffer.copy(dst, dstOff, src, srcOff?, count?)
-- buffer.len(buf) returns size in bytes

-- BUFFER SUPPORTED BY: RemoteEvents, DataStore, MemoryStore,
--   MessagingService, TeleportService, HttpService`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TABLE & PERFORMANCE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TABLE_PERF_PATTERNS: LuauPattern[] = [
  {
    name: 'Table Operations Reference',
    category: 'tables',
    keywords: ['table', 'array', 'dictionary', 'insert', 'remove', 'find', 'sort', 'freeze', 'clone'],
    code: `-- TABLE CREATION
local arr = {1, 2, 3, 4, 5}                    -- array (integer keys)
local dict = {name = "Vyren", level = 42}       -- dictionary (string keys)
local preallocated = table.create(1000)          -- pre-allocate 1000 slots (FASTER)
local filled = table.create(100, 0)              -- 100 slots, all initialized to 0

-- TABLE METHODS
table.insert(arr, 6)                -- append to end: {1,2,3,4,5,6}
table.insert(arr, 1, 0)            -- insert at index 1: {0,1,2,3,4,5,6}
table.remove(arr, 1)               -- remove at index 1, shifts down
local last = table.remove(arr)     -- remove and return last element (fastest)
local idx = table.find(arr, 3)     -- find value, returns index or nil
table.sort(arr)                     -- sort in-place (ascending)
table.sort(arr, function(a, b) return a > b end) -- custom sort

-- IMMUTABILITY
local config = table.freeze({
  MaxHP = 100,
  SpawnTime = 5,
  Nested = table.freeze({ X = 1 }), -- freeze nested tables too!
})
-- config.MaxHP = 200  --> ERROR: attempt to modify frozen table
local isFrozen = table.isfrozen(config) --> true

-- CLONING
local copy = table.clone(arr)       -- SHALLOW copy (nested tables share refs!)
-- For deep clone:
local function deepClone(t)
  local clone = table.clone(t)
  for k, v in clone do
    if type(v) == "table" then
      clone[k] = deepClone(v)
    end
  end
  return clone
end

-- table.move(src, srcStart, srcEnd, destStart, dest?)
-- table.pack(...) -> table with .n field
-- table.unpack(t, i?, j?)

-- ITERATION:
-- for i, v in ipairs(arr)  -> arrays only, stops at first nil
-- for k, v in pairs(dict)  -> all keys (unordered for dicts)
-- for k, v in dict do       -> generalized iteration (Luau, same as pairs)
-- for i, v in arr do        -> generalized iteration (Luau, same as ipairs)`,
  },
  {
    name: 'Performance Optimization Tips',
    category: 'tables',
    keywords: ['performance', 'optimize', 'fast', 'lag', 'fps', 'micro', 'cache', 'pool'],
    code: `-- INSTANCE POOLING: Reuse instead of Create/Destroy
local POOL_SIZE = 200
local BulletPool = table.create(POOL_SIZE)
local bulletTemplate = Instance.new("Part")
bulletTemplate.Size = Vector3.new(0.2, 0.2, 2)
bulletTemplate.Anchored = true
bulletTemplate.CanCollide = false

for i = 1, POOL_SIZE do
  BulletPool[i] = bulletTemplate:Clone()
end

local function getBullet(): Part?
  return table.remove(BulletPool)
end

local function returnBullet(bullet: Part)
  bullet.Parent = nil
  table.insert(BulletPool, bullet)
end

-- PARENT LAST: Set properties BEFORE parenting to workspace
local part = Instance.new("Part")
part.Size = Vector3.new(5, 5, 5)
part.Position = Vector3.new(0, 10, 0)
part.Anchored = true
part.Material = Enum.Material.Concrete
part.BrickColor = BrickColor.new("Medium stone grey")
part.Parent = workspace -- LAST! Avoids redundant replication and physics updates

-- CACHE SERVICE CALLS at top of script
local RunService = game:GetService("RunService")

-- AVOID FIND IN HOT LOOPS
local target = workspace:FindFirstChild("Target") -- cache outside loop
RunService.Heartbeat:Connect(function(dt)
  -- Use target directly, not FindFirstChild every frame
end)

-- REMOVE PRINT IN PRODUCTION (causes FPS drops in hot loops)

-- PRE-ALLOCATE TABLES when you know approximate size
local results = table.create(100)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// CHAT SYSTEM PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const CHAT_PATTERNS: LuauPattern[] = [
  {
    name: 'TextChatService Setup & Custom Commands',
    category: 'chat',
    keywords: ['chat', 'textchatservice', 'message', 'command', 'filter', 'bubble', 'channel'],
    code: `-- TextChatService is THE chat system (legacy Chat is deprecated)
local TextChatService = game:GetService("TextChatService")

-- RECEIVE MESSAGES (client-side)
local channels = TextChatService:WaitForChild("TextChannels")
local general = channels:WaitForChild("RBXGeneral")

general.MessageReceived:Connect(function(msg: TextChatMessage)
  local sender = msg.TextSource -- nil for system messages
  local text = msg.Text          -- already filtered automatically
  if sender then
    print(sender.Name..": "..text)
  end
end)

-- CUSTOM MESSAGE DECORATION (client-side callback)
TextChatService.OnIncomingMessage = function(message: TextChatMessage)
  local props = Instance.new("TextChatMessageProperties")
  if message.TextSource then
    local player = game.Players:GetPlayerByUserId(message.TextSource.UserId)
    if player and player:GetAttribute("VIP") then
      props.PrefixText = "[VIP] "..message.PrefixText
    end
  end
  return props
end

-- CUSTOM CHAT COMMAND (TextChatCommand instance)
local spawnCmd = Instance.new("TextChatCommand")
spawnCmd.Name = "SpawnCommand"
spawnCmd.PrimaryAlias = "/spawn"
spawnCmd.SecondaryAlias = "/tp"
spawnCmd.Parent = TextChatService
spawnCmd.Triggered:Connect(function(source: TextSource, unfilteredText: string)
  local args = string.split(unfilteredText, " ")
  print(source.Name, "wants to spawn at:", args[2])
end)

-- SEND MESSAGE PROGRAMMATICALLY (client LocalScript)
general:SendAsync("Hello from code!")

-- NPC BUBBLE CHAT (server-side)
TextChatService:DisplayBubble(npcModel, "Welcome, adventurer!")

-- DEFAULT COMMANDS: /clear, /e emote, /mute, /unmute, /whisper, /team, /help
-- DEFAULT CHANNELS: RBXGeneral, RBXSystem, RBXTeam[Color], RBXWhisper`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED OOP PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ADVANCED_OOP_PATTERNS: LuauPattern[] = [
  {
    name: 'Mixin Pattern',
    category: 'advanced-oop',
    keywords: ['mixin', 'compose', 'multiple inheritance', 'trait'],
    code: `-- Mixin: compose behavior from multiple sources
local function applyMixin(target: {}, mixin: {})
  for key, value in mixin do
    if target[key] == nil then
      target[key] = value
    end
  end
  return target
end
local Serializable = {
  serialize = function(self) return game:GetService("HttpService"):JSONEncode(self.data or {}) end,
  deserialize = function(self, json) self.data = game:GetService("HttpService"):JSONDecode(json) end,
}
local Loggable = {
  log = function(self, msg) print("[" .. (self.Name or "?") .. "] " .. msg) end,
}
-- Usage: applyMixin(applyMixin(myObj, Serializable), Loggable)`,
  },
  {
    name: 'Interface Simulation',
    category: 'advanced-oop',
    keywords: ['interface', 'contract', 'implements', 'duck typing'],
    code: `-- Simulate interfaces by validating method presence
local function implements(obj: {}, interface: {string}): boolean
  for _, method in interface do
    if type(obj[method]) ~= "function" then
      warn(tostring(obj) .. " missing method: " .. method)
      return false
    end
  end
  return true
end
local IDamageable = {"TakeDamage", "GetHealth", "IsDead"}
local IInteractable = {"Interact", "GetPromptText", "CanInteract"}
-- Usage: if implements(npc, IDamageable) then npc:TakeDamage(10) end`,
  },
  {
    name: 'Abstract Class Pattern',
    category: 'advanced-oop',
    keywords: ['abstract', 'base class', 'override', 'virtual'],
    code: `-- Abstract base: subclasses MUST override marked methods
local BaseWeapon = {}
BaseWeapon.__index = BaseWeapon
function BaseWeapon.new(name: string, damage: number)
  return setmetatable({name = name, damage = damage, cooldown = 0}, BaseWeapon)
end
function BaseWeapon:Attack()
  error(self.name .. " must override :Attack()")
end
function BaseWeapon:CanAttack(): boolean
  return os.clock() - self.cooldown > 0.5
end
-- Concrete subclass
local Sword = setmetatable({}, {__index = BaseWeapon})
Sword.__index = Sword
function Sword.new() return setmetatable(BaseWeapon.new("Sword", 25), Sword) end
function Sword:Attack(target)
  if not self:CanAttack() then return end
  self.cooldown = os.clock()
  target:TakeDamage(self.damage)
end`,
  },
  {
    name: 'Factory Method Pattern',
    category: 'advanced-oop',
    keywords: ['factory', 'create', 'spawn', 'instantiate'],
    code: `-- Factory: create objects by type string
local EnemyFactory = {}
local registry: {[string]: (config: {}) -> {}} = {}
function EnemyFactory.register(typeName: string, constructor: (config: {}) -> {})
  registry[typeName] = constructor
end
function EnemyFactory.create(typeName: string, config: {}): {}?
  local ctor = registry[typeName]
  if not ctor then warn("Unknown enemy type: " .. typeName); return nil end
  return ctor(config)
end
-- Register types
EnemyFactory.register("zombie", function(c) return {type="zombie", hp=100, speed=12, damage=10} end)
EnemyFactory.register("skeleton", function(c) return {type="skeleton", hp=60, speed=18, damage=15} end)
EnemyFactory.register("boss", function(c) return {type="boss", hp=1000, speed=8, damage=50} end)`,
  },
  {
    name: 'Singleton with Lazy Init',
    category: 'advanced-oop',
    keywords: ['singleton', 'lazy', 'global', 'one instance'],
    code: `-- Singleton: one instance, created on first access
local GameManager = {}
GameManager.__index = GameManager
local _instance = nil
function GameManager.getInstance()
  if not _instance then
    _instance = setmetatable({
      state = "lobby",
      players = {},
      round = 0,
      startTime = 0,
    }, GameManager)
  end
  return _instance
end
function GameManager:StartRound()
  self.state = "playing"
  self.round += 1
  self.startTime = os.clock()
end
-- Usage: GameManager.getInstance():StartRound()`,
  },
  {
    name: 'Prototype Pattern',
    category: 'advanced-oop',
    keywords: ['prototype', 'clone', 'copy', 'template object'],
    code: `-- Prototype: clone existing objects as templates
local function deepClone(t: {})
  local copy = {}
  for k, v in t do
    copy[k] = if type(v) == "table" then deepClone(v) else v
  end
  return setmetatable(copy, getmetatable(t))
end
local ItemPrototypes = {
  sword = {name="Iron Sword", damage=20, durability=100, rarity="common", effects={}},
  potion = {name="Health Potion", heal=50, stackable=true, maxStack=99, effects={"restore"}},
}
local function createItem(protoName: string, overrides: {}?): {}
  local proto = ItemPrototypes[protoName]
  if not proto then error("No prototype: " .. protoName) end
  local item = deepClone(proto)
  if overrides then for k, v in overrides do item[k] = v end end
  return item
end`,
  },
  {
    name: 'Decorator Pattern',
    category: 'advanced-oop',
    keywords: ['decorator', 'wrap', 'enhance', 'modify behavior'],
    code: `-- Decorator: wrap objects to add behavior
local function withLogging(obj: {}, methodName: string)
  local original = obj[methodName]
  obj[methodName] = function(self, ...)
    print("[LOG] " .. methodName .. " called")
    local result = original(self, ...)
    print("[LOG] " .. methodName .. " returned")
    return result
  end
  return obj
end
local function withCooldown(obj: {}, methodName: string, cd: number)
  local original = obj[methodName]
  local lastUse = 0
  obj[methodName] = function(self, ...)
    if os.clock() - lastUse < cd then return nil end
    lastUse = os.clock()
    return original(self, ...)
  end
  return obj
end
-- Usage: withCooldown(withLogging(weapon, "Attack"), "Attack", 1.0)`,
  },
  {
    name: 'Strategy Pattern',
    category: 'advanced-oop',
    keywords: ['strategy', 'algorithm', 'swap behavior', 'policy'],
    code: `-- Strategy: swap algorithms at runtime
local DamageStrategies = {
  normal = function(base, armor) return math.max(1, base - armor) end,
  piercing = function(base, armor) return math.max(1, base - armor * 0.3) end,
  magic = function(base, armor) return base end, -- ignores armor
  true_damage = function(base, armor) return base end,
}
local CombatUnit = {}
CombatUnit.__index = CombatUnit
function CombatUnit.new(hp: number, armor: number)
  return setmetatable({hp=hp, armor=armor, damageStrategy="normal"}, CombatUnit)
end
function CombatUnit:TakeDamage(amount: number)
  local calc = DamageStrategies[self.damageStrategy] or DamageStrategies.normal
  local dmg = calc(amount, self.armor)
  self.hp = math.max(0, self.hp - dmg)
  return dmg
end`,
  },
  {
    name: 'Command Pattern',
    category: 'advanced-oop',
    keywords: ['command', 'undo', 'redo', 'action queue', 'history'],
    code: `-- Command: encapsulate actions for undo/redo
local CommandHistory = {undoStack = {}, redoStack = {}}
function CommandHistory:Execute(cmd)
  cmd:Execute()
  table.insert(self.undoStack, cmd)
  self.redoStack = {}
end
function CommandHistory:Undo()
  local cmd = table.remove(self.undoStack)
  if cmd then cmd:Undo(); table.insert(self.redoStack, cmd) end
end
function CommandHistory:Redo()
  local cmd = table.remove(self.redoStack)
  if cmd then cmd:Execute(); table.insert(self.undoStack, cmd) end
end
-- Example command: move a part
local MoveCommand = {}
MoveCommand.__index = MoveCommand
function MoveCommand.new(part: BasePart, newPos: Vector3)
  return setmetatable({part=part, newPos=newPos, oldPos=part.Position}, MoveCommand)
end
function MoveCommand:Execute() self.part.Position = self.newPos end
function MoveCommand:Undo() self.part.Position = self.oldPos end`,
  },
  {
    name: 'Observer with Weak References',
    category: 'advanced-oop',
    keywords: ['observer', 'weak', 'event', 'subscribe', 'publish'],
    code: `-- Observer: pub/sub with auto-cleanup of dead listeners
local Observable = {}
Observable.__index = Observable
function Observable.new()
  return setmetatable({_listeners = {}}, Observable)
end
function Observable:Subscribe(key: string, callback: (...any) -> ())
  self._listeners[key] = callback
  return function() self._listeners[key] = nil end -- unsubscribe handle
end
function Observable:Fire(...)
  for key, cb in self._listeners do
    task.spawn(cb, ...)
  end
end
function Observable:Clear()
  table.clear(self._listeners)
end
-- Usage
local onDamage = Observable.new()
local unsub = onDamage:Subscribe("hud", function(amount) updateHUD(amount) end)
onDamage:Fire(25) -- all listeners called
unsub() -- remove this listener`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// DATA STRUCTURE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const DATA_STRUCTURE_PATTERNS: LuauPattern[] = [
  {
    name: 'Queue (FIFO)',
    category: 'data-structures',
    keywords: ['queue', 'fifo', 'enqueue', 'dequeue', 'line'],
    code: `-- Queue: first-in first-out
local Queue = {}
Queue.__index = Queue
function Queue.new()
  return setmetatable({_data = {}, _head = 1, _tail = 0}, Queue)
end
function Queue:Enqueue(value)
  self._tail += 1
  self._data[self._tail] = value
end
function Queue:Dequeue()
  if self._head > self._tail then return nil end
  local val = self._data[self._head]
  self._data[self._head] = nil
  self._head += 1
  return val
end
function Queue:Peek() return self._data[self._head] end
function Queue:Size() return self._tail - self._head + 1 end
function Queue:IsEmpty() return self._head > self._tail end`,
  },
  {
    name: 'Stack (LIFO)',
    category: 'data-structures',
    keywords: ['stack', 'lifo', 'push', 'pop', 'depth'],
    code: `-- Stack: last-in first-out
local Stack = {}
Stack.__index = Stack
function Stack.new()
  return setmetatable({_data = {}, _size = 0}, Stack)
end
function Stack:Push(value)
  self._size += 1
  self._data[self._size] = value
end
function Stack:Pop()
  if self._size == 0 then return nil end
  local val = self._data[self._size]
  self._data[self._size] = nil
  self._size -= 1
  return val
end
function Stack:Peek() return self._data[self._size] end
function Stack:Size() return self._size end`,
  },
  {
    name: 'Priority Queue (Min-Heap)',
    category: 'data-structures',
    keywords: ['priority queue', 'heap', 'min', 'sorted', 'priority'],
    code: `-- Priority Queue using binary min-heap
local PQ = {}
PQ.__index = PQ
function PQ.new() return setmetatable({_heap = {}}, PQ) end
function PQ:Insert(value, priority)
  table.insert(self._heap, {value = value, priority = priority})
  local i = #self._heap
  while i > 1 do
    local parent = math.floor(i / 2)
    if self._heap[parent].priority <= self._heap[i].priority then break end
    self._heap[parent], self._heap[i] = self._heap[i], self._heap[parent]
    i = parent
  end
end
function PQ:Pop()
  if #self._heap == 0 then return nil end
  local top = self._heap[1]
  self._heap[1] = self._heap[#self._heap]
  table.remove(self._heap)
  local i, n = 1, #self._heap
  while true do
    local smallest, l, r = i, i*2, i*2+1
    if l <= n and self._heap[l].priority < self._heap[smallest].priority then smallest = l end
    if r <= n and self._heap[r].priority < self._heap[smallest].priority then smallest = r end
    if smallest == i then break end
    self._heap[i], self._heap[smallest] = self._heap[smallest], self._heap[i]
    i = smallest
  end
  return top.value, top.priority
end`,
  },
  {
    name: 'Linked List',
    category: 'data-structures',
    keywords: ['linked list', 'node', 'chain', 'insert', 'remove'],
    code: `-- Doubly-linked list
local LinkedList = {}
LinkedList.__index = LinkedList
function LinkedList.new()
  return setmetatable({head = nil, tail = nil, size = 0}, LinkedList)
end
function LinkedList:PushBack(value)
  local node = {value = value, prev = self.tail, next = nil}
  if self.tail then self.tail.next = node else self.head = node end
  self.tail = node
  self.size += 1
  return node
end
function LinkedList:Remove(node)
  if node.prev then node.prev.next = node.next else self.head = node.next end
  if node.next then node.next.prev = node.prev else self.tail = node.prev end
  self.size -= 1
end
function LinkedList:Iterate()
  local current = self.head
  return function()
    if not current then return nil end
    local val = current.value
    current = current.next
    return val
  end
end`,
  },
  {
    name: 'Ring Buffer',
    category: 'data-structures',
    keywords: ['ring buffer', 'circular', 'fixed size', 'overwrite'],
    code: `-- Ring buffer: fixed-size circular buffer
local RingBuffer = {}
RingBuffer.__index = RingBuffer
function RingBuffer.new(capacity: number)
  return setmetatable({_buf = table.create(capacity), _cap = capacity, _head = 1, _count = 0}, RingBuffer)
end
function RingBuffer:Push(value)
  local idx = ((self._head + self._count - 1) % self._cap) + 1
  if self._count == self._cap then
    self._head = (self._head % self._cap) + 1
  else
    self._count += 1
  end
  self._buf[idx] = value
end
function RingBuffer:Get(i: number)
  if i < 1 or i > self._count then return nil end
  return self._buf[((self._head + i - 2) % self._cap) + 1]
end
function RingBuffer:Count() return self._count end`,
  },
  {
    name: 'LRU Cache',
    category: 'data-structures',
    keywords: ['lru', 'cache', 'evict', 'least recently used', 'memo'],
    code: `-- LRU Cache: evicts least recently used when full
local LRU = {}
LRU.__index = LRU
function LRU.new(capacity: number)
  return setmetatable({_cap = capacity, _map = {}, _order = {}, _size = 0}, LRU)
end
function LRU:Get(key: string)
  if not self._map[key] then return nil end
  -- Move to end (most recent)
  for i, k in self._order do
    if k == key then table.remove(self._order, i); break end
  end
  table.insert(self._order, key)
  return self._map[key]
end
function LRU:Set(key: string, value)
  if self._map[key] then
    self._map[key] = value
    self:Get(key) -- refresh position
    return
  end
  if self._size >= self._cap then
    local oldest = table.remove(self._order, 1)
    self._map[oldest] = nil
    self._size -= 1
  end
  self._map[key] = value
  table.insert(self._order, key)
  self._size += 1
end`,
  },
  {
    name: 'Set (Unique Values)',
    category: 'data-structures',
    keywords: ['set', 'unique', 'distinct', 'no duplicates', 'union', 'intersect'],
    code: `-- Set with union, intersection, difference
local Set = {}
Set.__index = Set
function Set.new(items: {any}?)
  local s = setmetatable({_data = {}}, Set)
  if items then for _, v in items do s:Add(v) end end
  return s
end
function Set:Add(v) self._data[v] = true end
function Set:Remove(v) self._data[v] = nil end
function Set:Has(v): boolean return self._data[v] == true end
function Set:Size()
  local n = 0; for _ in self._data do n += 1 end; return n
end
function Set:Union(other)
  local result = Set.new()
  for k in self._data do result:Add(k) end
  for k in other._data do result:Add(k) end
  return result
end
function Set:Intersect(other)
  local result = Set.new()
  for k in self._data do if other:Has(k) then result:Add(k) end end
  return result
end`,
  },
  {
    name: 'BiMap (Bidirectional Map)',
    category: 'data-structures',
    keywords: ['bimap', 'bidirectional', 'two way', 'reverse lookup'],
    code: `-- BiMap: lookup by key or value
local BiMap = {}
BiMap.__index = BiMap
function BiMap.new()
  return setmetatable({_forward = {}, _reverse = {}}, BiMap)
end
function BiMap:Set(key, value)
  if self._forward[key] then self._reverse[self._forward[key]] = nil end
  if self._reverse[value] then self._forward[self._reverse[value]] = nil end
  self._forward[key] = value
  self._reverse[value] = key
end
function BiMap:GetByKey(key) return self._forward[key] end
function BiMap:GetByValue(value) return self._reverse[value] end
function BiMap:RemoveByKey(key)
  local val = self._forward[key]
  if val then self._forward[key] = nil; self._reverse[val] = nil end
end`,
  },
  {
    name: 'Spatial Hash Grid',
    category: 'data-structures',
    keywords: ['spatial', 'hash', 'grid', 'partition', 'nearby', 'collision broad'],
    code: `-- Spatial hash for fast nearby-object queries
local SpatialHash = {}
SpatialHash.__index = SpatialHash
function SpatialHash.new(cellSize: number)
  return setmetatable({_cells = {}, _cellSize = cellSize}, SpatialHash)
end
function SpatialHash:_key(pos: Vector3): string
  local cs = self._cellSize
  return math.floor(pos.X/cs)..","..math.floor(pos.Y/cs)..","..math.floor(pos.Z/cs)
end
function SpatialHash:Insert(obj, pos: Vector3)
  local key = self:_key(pos)
  if not self._cells[key] then self._cells[key] = {} end
  self._cells[key][obj] = true
end
function SpatialHash:Remove(obj, pos: Vector3)
  local key = self:_key(pos)
  if self._cells[key] then self._cells[key][obj] = nil end
end
function SpatialHash:Query(pos: Vector3, radius: number): {any}
  local results = {}
  local cs = self._cellSize
  local range = math.ceil(radius / cs)
  local cx, cy, cz = math.floor(pos.X/cs), math.floor(pos.Y/cs), math.floor(pos.Z/cs)
  for dx = -range, range do for dy = -range, range do for dz = -range, range do
    local cell = self._cells[(cx+dx)..","..( cy+dy)..","..( cz+dz)]
    if cell then for obj in cell do table.insert(results, obj) end end
  end end end
  return results
end`,
  },
  {
    name: 'Sparse Array',
    category: 'data-structures',
    keywords: ['sparse', 'array', 'compact', 'gaps', 'index'],
    code: `-- Sparse array: memory-efficient for arrays with many empty slots
local Sparse = {}
Sparse.__index = Sparse
function Sparse.new()
  return setmetatable({_data = {}, _count = 0}, Sparse)
end
function Sparse:Set(index: number, value)
  if self._data[index] == nil and value ~= nil then self._count += 1 end
  if self._data[index] ~= nil and value == nil then self._count -= 1 end
  self._data[index] = value
end
function Sparse:Get(index: number) return self._data[index] end
function Sparse:Count() return self._count end
function Sparse:Iterate()
  return next, self._data
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const SECURITY_PATTERNS: LuauPattern[] = [
  {
    name: 'Input Type Validation',
    category: 'security',
    keywords: ['validate', 'type check', 'sanitize', 'input', 'exploit'],
    code: `-- Always validate remote arguments on server
local function validateArgs(player: Player, ...: any): boolean
  local args = {...}
  -- Check arg count
  if #args > 10 then
    warn("Too many args from " .. player.Name)
    return false
  end
  -- Check each arg type and size
  for i, arg in args do
    if type(arg) == "string" and #arg > 200 then return false end
    if type(arg) == "table" then
      local count = 0
      for _ in arg do count += 1; if count > 50 then return false end end
    end
    if type(arg) == "userdata" then return false end -- block instances
  end
  return true
end`,
  },
  {
    name: 'RemoteEvent Rate Limiter',
    category: 'security',
    keywords: ['rate limit', 'throttle', 'remote', 'spam', 'flood'],
    code: `-- Per-player rate limiter with burst allowance
local RateLimiter = {}
RateLimiter.__index = RateLimiter
function RateLimiter.new(maxPerSecond: number, burstSize: number)
  return setmetatable({rate=maxPerSecond, burst=burstSize, _tokens={}}, RateLimiter)
end
function RateLimiter:Allow(userId: number): boolean
  local now = os.clock()
  if not self._tokens[userId] then
    self._tokens[userId] = {tokens=self.burst, lastRefill=now}
  end
  local bucket = self._tokens[userId]
  local elapsed = now - bucket.lastRefill
  bucket.tokens = math.min(self.burst, bucket.tokens + elapsed * self.rate)
  bucket.lastRefill = now
  if bucket.tokens >= 1 then
    bucket.tokens -= 1
    return true
  end
  return false -- rate limited
end`,
  },
  {
    name: 'Distance Check (Anti-Reach)',
    category: 'security',
    keywords: ['distance', 'reach', 'range', 'anti exploit', 'magnitude'],
    code: `-- Server-side distance validation
local MAX_INTERACT_DIST = 15
local function isInRange(player: Player, target: Vector3): boolean
  local char = player.Character
  if not char then return false end
  local root = char:FindFirstChild("HumanoidRootPart")
  if not root then return false end
  return (root.Position - target).Magnitude <= MAX_INTERACT_DIST
end
-- Usage in remote handler
remoteEvent.OnServerEvent:Connect(function(player, targetPos)
  if typeof(targetPos) ~= "Vector3" then return end
  if not isInRange(player, targetPos) then
    warn(player.Name .. " failed distance check")
    return
  end
  -- Process interaction
end)`,
  },
  {
    name: 'Ownership Validation',
    category: 'security',
    keywords: ['ownership', 'permission', 'authorize', 'own', 'belongs'],
    code: `-- Verify player owns item before action
local playerInventories: {[number]: {[string]: boolean}} = {}
local function playerOwns(userId: number, itemId: string): boolean
  local inv = playerInventories[userId]
  return inv ~= nil and inv[itemId] == true
end
remoteEvent.OnServerEvent:Connect(function(player, action, itemId)
  if type(itemId) ~= "string" then return end
  if action == "equip" then
    if not playerOwns(player.UserId, itemId) then
      warn(player.Name .. " tried to equip unowned item: " .. itemId)
      return
    end
    -- Equip the item
  end
end)`,
  },
  {
    name: 'Server-Side Cooldown',
    category: 'security',
    keywords: ['cooldown', 'server', 'ability', 'skill', 'timer'],
    code: `-- Never trust client cooldowns — track on server
local abilityCooldowns: {[number]: {[string]: number}} = {}
local ABILITY_CDS = {fireball=3, heal=8, dash=1.5, ultimate=30}
local function canUseAbility(userId: number, abilityName: string): boolean
  local cds = abilityCooldowns[userId]
  if not cds then abilityCooldowns[userId] = {}; return true end
  local lastUsed = cds[abilityName] or 0
  local cdTime = ABILITY_CDS[abilityName] or 1
  return os.clock() - lastUsed >= cdTime
end
local function markAbilityUsed(userId: number, abilityName: string)
  if not abilityCooldowns[userId] then abilityCooldowns[userId] = {} end
  abilityCooldowns[userId][abilityName] = os.clock()
end`,
  },
  {
    name: 'Anti-Teleport Detection',
    category: 'security',
    keywords: ['teleport', 'speed hack', 'position', 'anti cheat'],
    code: `-- Detect impossible position changes
local lastPositions: {[number]: {pos: Vector3, time: number}} = {}
local MAX_SPEED = 80 -- studs per second (generous for legit movement)
game:GetService("RunService").Heartbeat:Connect(function()
  for _, player in game:GetService("Players"):GetPlayers() do
    local char = player.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    if root then
      local now = os.clock()
      local last = lastPositions[player.UserId]
      if last then
        local dist = (root.Position - last.pos).Magnitude
        local dt = now - last.time
        if dt > 0 and dist / dt > MAX_SPEED then
          warn(player.Name .. " moved too fast: " .. math.floor(dist/dt) .. " studs/s")
          root.CFrame = CFrame.new(last.pos) -- snap back
        end
      end
      lastPositions[player.UserId] = {pos = root.Position, time = now}
    end
  end
end)`,
  },
  {
    name: 'Anti-Speed Hack',
    category: 'security',
    keywords: ['speed', 'walkspeed', 'hack', 'cheat', 'humanoid'],
    code: `-- Monitor WalkSpeed/JumpPower changes
local LEGAL_WALKSPEED = 16
local LEGAL_JUMPPOWER = 50
local function monitorHumanoid(player: Player, humanoid: Humanoid)
  humanoid:GetPropertyChangedSignal("WalkSpeed"):Connect(function()
    if humanoid.WalkSpeed > LEGAL_WALKSPEED * 1.1 then
      humanoid.WalkSpeed = LEGAL_WALKSPEED
      warn(player.Name .. " WalkSpeed tampered")
    end
  end)
  humanoid:GetPropertyChangedSignal("JumpPower"):Connect(function()
    if humanoid.JumpPower > LEGAL_JUMPPOWER * 1.1 then
      humanoid.JumpPower = LEGAL_JUMPPOWER
      warn(player.Name .. " JumpPower tampered")
    end
  end)
end`,
  },
  {
    name: 'Data Integrity Check',
    category: 'security',
    keywords: ['integrity', 'checksum', 'tamper', 'data valid'],
    code: `-- Validate data before saving
local function isValidPlayerData(data: {}): boolean
  if type(data) ~= "table" then return false end
  if type(data.coins) ~= "number" or data.coins < 0 or data.coins > 1e9 then return false end
  if type(data.level) ~= "number" or data.level < 1 or data.level > 1000 then return false end
  if type(data.inventory) ~= "table" then return false end
  -- Check inventory size
  local count = 0
  for _ in data.inventory do
    count += 1
    if count > 500 then return false end
  end
  return true
end
-- Use before save:
-- if isValidPlayerData(data) then saveData(userId, data) end`,
  },
  {
    name: 'Receipt Validation (Developer Products)',
    category: 'security',
    keywords: ['receipt', 'purchase', 'product', 'validate', 'marketplace'],
    code: `-- Process developer product receipts securely
local MPS = game:GetService("MarketplaceService")
local purchaseHistory = {} -- track processed receipts
MPS.ProcessReceipt = function(receiptInfo)
  local key = receiptInfo.PurchaseId
  if purchaseHistory[key] then return Enum.ProductPurchaseDecision.PurchaseGranted end
  local player = game:GetService("Players"):GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
  local productId = receiptInfo.ProductId
  local ok = pcall(function()
    if productId == 123456 then -- 100 Coins
      local ls = player:FindFirstChild("leaderstats")
      if ls then ls.Coins.Value += 100 end
    end
  end)
  if ok then
    purchaseHistory[key] = true
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end
  return Enum.ProductPurchaseDecision.NotProcessedYet
end`,
  },
  {
    name: 'Exploit Logging',
    category: 'security',
    keywords: ['log', 'exploit', 'report', 'ban', 'flag'],
    code: `-- Log suspicious activity for review
local HttpService = game:GetService("HttpService")
local WEBHOOK_URL = "" -- Discord webhook or analytics endpoint
local function logExploit(player: Player, reason: string, details: string?)
  local entry = {
    player = player.Name,
    userId = player.UserId,
    reason = reason,
    details = details or "",
    time = os.time(),
    server = game.JobId,
  }
  warn("[EXPLOIT] " .. player.Name .. ": " .. reason)
  player:SetAttribute("ExploitFlags", (player:GetAttribute("ExploitFlags") or 0) + 1)
  -- Kick after 3 flags
  if (player:GetAttribute("ExploitFlags") or 0) >= 3 then
    player:Kick("Suspicious activity detected")
  end
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const PHYSICS_PATTERNS: LuauPattern[] = [
  {
    name: 'Projectile Arc (Gravity + Velocity)',
    category: 'physics',
    keywords: ['projectile', 'arc', 'gravity', 'throw', 'launch', 'trajectory'],
    code: `-- Launch projectile with physics arc
local function launchProjectile(origin: Vector3, target: Vector3, speed: number): BasePart
  local gravity = Vector3.new(0, -workspace.Gravity, 0)
  local diff = target - origin
  local timeToTarget = diff.Magnitude / speed
  -- Calculate initial velocity to hit target accounting for gravity
  local vel = diff / timeToTarget - gravity * timeToTarget / 2
  local proj = Instance.new("Part")
  proj.Size = Vector3.new(1, 1, 1)
  proj.Position = origin
  proj.Anchored = false
  proj.CanCollide = true
  proj.Parent = workspace
  proj.AssemblyLinearVelocity = vel
  game:GetService("Debris"):AddItem(proj, 10)
  return proj
end`,
  },
  {
    name: 'Knockback (BodyVelocity Impulse)',
    category: 'physics',
    keywords: ['knockback', 'push', 'impulse', 'force', 'hit'],
    code: `-- Apply knockback to a character
local function applyKnockback(char: Model, direction: Vector3, force: number, duration: number?)
  local root = char:FindFirstChild("HumanoidRootPart")
  if not root then return end
  local bv = Instance.new("BodyVelocity")
  bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
  bv.Velocity = direction.Unit * force + Vector3.new(0, force * 0.3, 0)
  bv.Parent = root
  game:GetService("Debris"):AddItem(bv, duration or 0.3)
end
-- Usage: applyKnockback(targetChar, (targetPos - attackerPos), 80, 0.25)`,
  },
  {
    name: 'Explosion Force',
    category: 'physics',
    keywords: ['explosion', 'blast', 'radius', 'damage', 'boom'],
    code: `-- Custom explosion with damage falloff
local function createExplosion(center: Vector3, radius: number, maxDamage: number)
  -- Visual explosion
  local exp = Instance.new("Explosion")
  exp.Position = center
  exp.BlastRadius = radius
  exp.BlastPressure = 0 -- we handle force manually
  exp.Parent = workspace
  -- Damage + knockback to nearby characters
  for _, model in workspace:GetChildren() do
    local hum = model:FindFirstChildOfClass("Humanoid")
    local root = model:FindFirstChild("HumanoidRootPart")
    if hum and root then
      local dist = (root.Position - center).Magnitude
      if dist <= radius then
        local falloff = 1 - (dist / radius)
        hum:TakeDamage(maxDamage * falloff)
        applyKnockback(model, (root.Position - center), 100 * falloff)
      end
    end
  end
end`,
  },
  {
    name: 'Magnetic Attraction',
    category: 'physics',
    keywords: ['magnet', 'attract', 'pull', 'gravity well', 'collect'],
    code: `-- Pull objects toward a point (coin magnet, black hole)
local function magnetUpdate(center: Vector3, radius: number, strength: number)
  for _, part in workspace:GetChildren() do
    if part:IsA("BasePart") and part:GetAttribute("Magnetic") then
      local diff = center - part.Position
      local dist = diff.Magnitude
      if dist < radius and dist > 1 then
        local force = strength / (dist * dist) -- inverse square
        part.AssemblyLinearVelocity = diff.Unit * math.min(force, 100)
      end
    end
  end
end
-- Run every frame:
-- RunService.Heartbeat:Connect(function() magnetUpdate(magnet.Position, 50, 500) end)`,
  },
  {
    name: 'Bouncing Ball Physics',
    category: 'physics',
    keywords: ['bounce', 'ball', 'reflect', 'restitution', 'ricochet'],
    code: `-- Bouncing ball with energy loss
local ball = Instance.new("Part")
ball.Shape = Enum.PartType.Ball
ball.Size = Vector3.new(3, 3, 3)
ball.Position = Vector3.new(0, 50, 0)
ball.Anchored = false
ball.Parent = workspace
-- Custom physical properties: density, friction, elasticity, frictionWeight, elasticityWeight
ball.CustomPhysicalProperties = PhysicalProperties.new(
  0.7,  -- density
  0.3,  -- friction
  0.8,  -- elasticity (0.8 = very bouncy)
  1,    -- friction weight
  1     -- elasticity weight
)`,
  },
  {
    name: 'Pendulum Swing',
    category: 'physics',
    keywords: ['pendulum', 'swing', 'oscillate', 'rope', 'grapple'],
    code: `-- Pendulum using RopeConstraint
local function createPendulum(anchor: Vector3, length: number): (BasePart, RopeConstraint)
  local anchorPart = Instance.new("Part")
  anchorPart.Size = Vector3.new(2, 2, 2)
  anchorPart.Position = anchor
  anchorPart.Anchored = true
  anchorPart.Parent = workspace
  local bob = Instance.new("Part")
  bob.Size = Vector3.new(3, 3, 3)
  bob.Shape = Enum.PartType.Ball
  bob.Position = anchor + Vector3.new(length * 0.5, -length, 0)
  bob.Parent = workspace
  local att0 = Instance.new("Attachment"); att0.Parent = anchorPart
  local att1 = Instance.new("Attachment"); att1.Parent = bob
  local rope = Instance.new("RopeConstraint")
  rope.Length = length
  rope.Attachment0 = att0
  rope.Attachment1 = att1
  rope.Visible = true
  rope.Parent = anchorPart
  return bob, rope
end`,
  },
  {
    name: 'Spring Physics',
    category: 'physics',
    keywords: ['spring', 'elastic', 'hooke', 'damping', 'oscillate'],
    code: `-- Spring simulation (Hooke's law)
local Spring = {}
Spring.__index = Spring
function Spring.new(stiffness: number, damping: number)
  return setmetatable({
    pos = 0, vel = 0, target = 0,
    stiffness = stiffness, damping = damping,
  }, Spring)
end
function Spring:Update(dt: number): number
  local displacement = self.target - self.pos
  local springForce = displacement * self.stiffness
  local dampForce = -self.vel * self.damping
  self.vel += (springForce + dampForce) * dt
  self.pos += self.vel * dt
  return self.pos
end
function Spring:SetTarget(t: number) self.target = t end
-- Usage: camera offset, UI bounce, weapon sway
-- local sway = Spring.new(200, 15)
-- sway:SetTarget(1); RunService.Heartbeat:Connect(function(dt) local v = sway:Update(dt) end)`,
  },
  {
    name: 'Buoyancy System',
    category: 'physics',
    keywords: ['buoyancy', 'water', 'float', 'swim', 'ocean'],
    code: `-- Simple buoyancy: push parts up when below water level
local WATER_LEVEL = 10
local BUOYANCY_FORCE = 50
local RunService = game:GetService("RunService")
local function applyBuoyancy(part: BasePart)
  RunService.Heartbeat:Connect(function(dt)
    local submerged = WATER_LEVEL - part.Position.Y
    if submerged > 0 then
      local ratio = math.clamp(submerged / part.Size.Y, 0, 1)
      local upForce = Vector3.new(0, BUOYANCY_FORCE * ratio, 0)
      part.AssemblyLinearVelocity += upForce * dt
      -- Dampen horizontal movement underwater
      local vel = part.AssemblyLinearVelocity
      part.AssemblyLinearVelocity = Vector3.new(vel.X * 0.98, vel.Y, vel.Z * 0.98)
    end
  end)
end`,
  },
  {
    name: 'Wind Force on Parts',
    category: 'physics',
    keywords: ['wind', 'force', 'blow', 'sway', 'drift'],
    code: `-- Apply wind to unanchored parts in a region
local windDirection = Vector3.new(1, 0, 0.3).Unit
local windStrength = 20
local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function(dt)
  for _, part in workspace:GetDescendants() do
    if part:IsA("BasePart") and not part.Anchored and part:GetAttribute("AffectedByWind") then
      -- Add noise for turbulence
      local noise = math.noise(os.clock() + part.Position.X * 0.1, part.Position.Z * 0.1)
      local force = windDirection * windStrength * (1 + noise * 0.5)
      part.AssemblyLinearVelocity += force * dt
    end
  end
end)`,
  },
  {
    name: 'Conveyor Belt',
    category: 'physics',
    keywords: ['conveyor', 'belt', 'move', 'surface', 'factory'],
    code: `-- Conveyor belt: move parts on top using AssemblyLinearVelocity
local conveyorPart = script.Parent -- the belt part
local SPEED = 10
local direction = conveyorPart.CFrame.LookVector
conveyorPart.Touched:Connect(function(hit)
  if hit.Anchored then return end
  -- Apply velocity while touching
  local conn
  conn = game:GetService("RunService").Heartbeat:Connect(function()
    if not hit.Parent then conn:Disconnect(); return end
    -- Check still touching (approximate)
    local diff = hit.Position - conveyorPart.Position
    if math.abs(diff.Y) > conveyorPart.Size.Y then conn:Disconnect(); return end
    local vel = hit.AssemblyLinearVelocity
    hit.AssemblyLinearVelocity = Vector3.new(
      direction.X * SPEED, vel.Y, direction.Z * SPEED
    )
  end)
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// UI ANIMATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const UI_ANIMATION_PATTERNS: LuauPattern[] = [
  {
    name: 'Slide In from Side',
    category: 'ui-animation',
    keywords: ['slide', 'animate', 'enter', 'panel', 'menu', 'tween ui'],
    code: `-- Slide UI element in from off-screen
local TweenService = game:GetService("TweenService")
local function slideIn(frame: Frame, fromDirection: string, duration: number?)
  local d = duration or 0.4
  local startPos
  if fromDirection == "left" then
    startPos = UDim2.new(-1, 0, frame.Position.Y.Scale, frame.Position.Y.Offset)
  elseif fromDirection == "right" then
    startPos = UDim2.new(1, 0, frame.Position.Y.Scale, frame.Position.Y.Offset)
  elseif fromDirection == "top" then
    startPos = UDim2.new(frame.Position.X.Scale, frame.Position.X.Offset, -1, 0)
  else -- bottom
    startPos = UDim2.new(frame.Position.X.Scale, frame.Position.X.Offset, 1, 0)
  end
  local endPos = frame.Position
  frame.Position = startPos
  frame.Visible = true
  TweenService:Create(frame, TweenInfo.new(d, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Position = endPos}):Play()
end`,
  },
  {
    name: 'Fade In/Out',
    category: 'ui-animation',
    keywords: ['fade', 'opacity', 'transparency', 'appear', 'disappear'],
    code: `-- Fade a GUI element in or out
local TweenService = game:GetService("TweenService")
local function fadeIn(gui: GuiObject, duration: number?)
  gui.Visible = true
  if gui:IsA("Frame") then
    gui.BackgroundTransparency = 1
    TweenService:Create(gui, TweenInfo.new(duration or 0.3), {BackgroundTransparency = 0}):Play()
  end
  if gui:IsA("TextLabel") or gui:IsA("TextButton") then
    gui.TextTransparency = 1
    TweenService:Create(gui, TweenInfo.new(duration or 0.3), {TextTransparency = 0}):Play()
  end
  if gui:IsA("ImageLabel") or gui:IsA("ImageButton") then
    gui.ImageTransparency = 1
    TweenService:Create(gui, TweenInfo.new(duration or 0.3), {ImageTransparency = 0}):Play()
  end
end`,
  },
  {
    name: 'Scale Bounce',
    category: 'ui-animation',
    keywords: ['bounce', 'scale', 'pop', 'appear', 'button'],
    code: `-- Pop-in scale bounce for buttons/icons
local TweenService = game:GetService("TweenService")
local function scaleBounce(gui: GuiObject, duration: number?)
  local d = duration or 0.35
  gui.Size = UDim2.new(0, 0, 0, 0)
  gui.Visible = true
  local targetSize = gui:GetAttribute("OriginalSize") or UDim2.new(0, 100, 0, 100)
  -- Overshoot then settle
  local overshoot = UDim2.new(
    targetSize.X.Scale * 1.15, targetSize.X.Offset * 1.15,
    targetSize.Y.Scale * 1.15, targetSize.Y.Offset * 1.15
  )
  local t1 = TweenService:Create(gui, TweenInfo.new(d * 0.6, Enum.EasingStyle.Back), {Size = overshoot})
  local t2 = TweenService:Create(gui, TweenInfo.new(d * 0.4, Enum.EasingStyle.Quad), {Size = targetSize})
  t1:Play()
  t1.Completed:Connect(function() t2:Play() end)
end`,
  },
  {
    name: 'Typewriter Text',
    category: 'ui-animation',
    keywords: ['typewriter', 'text', 'type', 'letter by letter', 'dialogue'],
    code: `-- Typewriter effect: reveal text one character at a time
local function typewrite(label: TextLabel, text: string, speed: number?)
  local charDelay = speed or 0.03
  label.Text = ""
  label.Visible = true
  for i = 1, #text do
    label.Text = string.sub(text, 1, i)
    -- Pause longer on punctuation
    local char = string.sub(text, i, i)
    if char == "." or char == "!" or char == "?" then
      task.wait(charDelay * 5)
    elseif char == "," then
      task.wait(charDelay * 3)
    else
      task.wait(charDelay)
    end
  end
end
-- Usage: task.spawn(typewrite, myLabel, "Hello, adventurer! Welcome to the dungeon.")`,
  },
  {
    name: 'Progress Bar Fill',
    category: 'ui-animation',
    keywords: ['progress', 'bar', 'fill', 'loading', 'health bar'],
    code: `-- Animated progress bar
local TweenService = game:GetService("TweenService")
local function setProgress(bar: Frame, fill: Frame, pct: number, animate: boolean?)
  pct = math.clamp(pct, 0, 1)
  local targetSize = UDim2.new(pct, 0, 1, 0)
  if animate ~= false then
    TweenService:Create(fill, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {Size = targetSize}):Play()
    -- Color: green > yellow > red
    local color = if pct > 0.5 then Color3.fromRGB(76, 175, 80)
      elseif pct > 0.25 then Color3.fromRGB(255, 193, 7)
      else Color3.fromRGB(244, 67, 54)
    TweenService:Create(fill, TweenInfo.new(0.3), {BackgroundColor3 = color}):Play()
  else
    fill.Size = targetSize
  end
end`,
  },
  {
    name: 'Circular Cooldown Indicator',
    category: 'ui-animation',
    keywords: ['cooldown', 'circle', 'radial', 'ability', 'timer'],
    code: `-- Radial cooldown using ImageLabel gradient rotation
local function startCooldown(icon: ImageLabel, duration: number)
  local overlay = icon:FindFirstChild("CooldownOverlay") -- semi-transparent black Frame
  if not overlay then return end
  overlay.Visible = true
  local elapsed = 0
  local conn
  conn = game:GetService("RunService").RenderStepped:Connect(function(dt)
    elapsed += dt
    local pct = math.clamp(elapsed / duration, 0, 1)
    -- Wipe from bottom to top
    overlay.Size = UDim2.new(1, 0, 1 - pct, 0)
    overlay.Position = UDim2.new(0, 0, pct, 0)
    if pct >= 1 then
      overlay.Visible = false
      conn:Disconnect()
    end
  end)
end`,
  },
  {
    name: 'Shake Animation',
    category: 'ui-animation',
    keywords: ['shake', 'vibrate', 'error', 'wrong', 'wiggle'],
    code: `-- Shake a UI element (wrong password, error, damage)
local function shakeUI(gui: GuiObject, intensity: number?, duration: number?)
  local orig = gui.Position
  local amp = intensity or 5
  local dur = duration or 0.4
  local elapsed = 0
  local conn
  conn = game:GetService("RunService").RenderStepped:Connect(function(dt)
    elapsed += dt
    if elapsed >= dur then
      gui.Position = orig
      conn:Disconnect()
      return
    end
    local decay = 1 - (elapsed / dur)
    local ox = (math.random() - 0.5) * 2 * amp * decay
    local oy = (math.random() - 0.5) * 2 * amp * decay
    gui.Position = UDim2.new(orig.X.Scale, orig.X.Offset + ox, orig.Y.Scale, orig.Y.Offset + oy)
  end)
end`,
  },
  {
    name: 'Pulse/Breathe Animation',
    category: 'ui-animation',
    keywords: ['pulse', 'breathe', 'glow', 'attention', 'highlight'],
    code: `-- Continuous pulse/breathe animation
local TweenService = game:GetService("TweenService")
local function startPulse(gui: GuiObject, scaleAmount: number?)
  local scale = scaleAmount or 0.05
  local origSize = gui.Size
  local bigSize = UDim2.new(
    origSize.X.Scale * (1 + scale), origSize.X.Offset,
    origSize.Y.Scale * (1 + scale), origSize.Y.Offset
  )
  local tweenBig = TweenService:Create(gui, TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Size = bigSize})
  local tweenSmall = TweenService:Create(gui, TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Size = origSize})
  tweenBig.Completed:Connect(function() tweenSmall:Play() end)
  tweenSmall.Completed:Connect(function() tweenBig:Play() end)
  tweenBig:Play()
end`,
  },
  {
    name: 'Flip Card Animation',
    category: 'ui-animation',
    keywords: ['flip', 'card', 'rotate', 'reveal', '3d'],
    code: `-- Flip card: shrink X to 0, swap content, expand X
local TweenService = game:GetService("TweenService")
local function flipCard(front: Frame, back: Frame, duration: number?)
  local d = (duration or 0.5) / 2
  local origSize = front.Size
  local flatSize = UDim2.new(0, 0, origSize.Y.Scale, origSize.Y.Offset)
  -- Shrink front
  local t1 = TweenService:Create(front, TweenInfo.new(d, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {Size = flatSize})
  t1:Play()
  t1.Completed:Connect(function()
    front.Visible = false
    back.Visible = true
    back.Size = flatSize
    -- Expand back
    TweenService:Create(back, TweenInfo.new(d, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Size = origSize}):Play()
  end)
end`,
  },
  {
    name: 'Parallax Scrolling UI',
    category: 'ui-animation',
    keywords: ['parallax', 'scroll', 'depth', 'background', 'layers'],
    code: `-- Parallax: layers move at different speeds based on mouse/scroll
local UIS = game:GetService("UserInputService")
local layers = {
  {frame = script.Parent.Layer1, speed = 0.02},
  {frame = script.Parent.Layer2, speed = 0.05},
  {frame = script.Parent.Layer3, speed = 0.1},
}
local center = Vector2.new(
  workspace.CurrentCamera.ViewportSize.X / 2,
  workspace.CurrentCamera.ViewportSize.Y / 2
)
UIS.InputChanged:Connect(function(input)
  if input.UserInputType == Enum.UserInputType.MouseMovement then
    local offset = (input.Position - Vector3.new(center.X, center.Y, 0))
    for _, layer in layers do
      local orig = layer.frame:GetAttribute("OrigPos") or layer.frame.Position
      layer.frame.Position = UDim2.new(
        orig.X.Scale, orig.X.Offset - offset.X * layer.speed,
        orig.Y.Scale, orig.Y.Offset - offset.Y * layer.speed
      )
    end
  end
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const INVENTORY_PATTERNS: LuauPattern[] = [
  {
    name: 'Basic Slot-Based Inventory',
    category: 'inventory',
    keywords: ['inventory', 'slot', 'backpack', 'item', 'add', 'remove'],
    code: `-- Slot-based inventory with max capacity
local Inventory = {}
Inventory.__index = Inventory
function Inventory.new(maxSlots: number)
  return setmetatable({slots = table.create(maxSlots), maxSlots = maxSlots}, Inventory)
end
function Inventory:AddItem(item: {}): boolean
  for i = 1, self.maxSlots do
    if not self.slots[i] then
      self.slots[i] = item
      return true
    end
  end
  return false -- full
end
function Inventory:RemoveItem(slotIndex: number): {}?
  local item = self.slots[slotIndex]
  self.slots[slotIndex] = nil
  return item
end
function Inventory:GetItem(slotIndex: number): {}?
  return self.slots[slotIndex]
end
function Inventory:FindItem(itemId: string): number?
  for i, item in self.slots do
    if item and item.id == itemId then return i end
  end
  return nil
end`,
  },
  {
    name: 'Weight-Based Inventory',
    category: 'inventory',
    keywords: ['weight', 'carry', 'encumbrance', 'heavy', 'capacity'],
    code: `-- Weight-limited inventory
local WeightInventory = {}
WeightInventory.__index = WeightInventory
function WeightInventory.new(maxWeight: number)
  return setmetatable({items = {}, maxWeight = maxWeight, currentWeight = 0}, WeightInventory)
end
function WeightInventory:CanAdd(item: {}): boolean
  return self.currentWeight + (item.weight or 0) <= self.maxWeight
end
function WeightInventory:Add(item: {}): boolean
  if not self:CanAdd(item) then return false end
  table.insert(self.items, item)
  self.currentWeight += (item.weight or 0)
  return true
end
function WeightInventory:Remove(index: number): {}?
  local item = table.remove(self.items, index)
  if item then self.currentWeight -= (item.weight or 0) end
  return item
end`,
  },
  {
    name: 'Stackable Items',
    category: 'inventory',
    keywords: ['stack', 'stackable', 'count', 'merge', 'quantity'],
    code: `-- Stackable item support
local function addStackable(inventory, itemId: string, amount: number, maxStack: number)
  -- Try to fill existing stacks first
  for _, slot in inventory.slots do
    if slot and slot.id == itemId and slot.count < maxStack then
      local canAdd = math.min(amount, maxStack - slot.count)
      slot.count += canAdd
      amount -= canAdd
      if amount <= 0 then return 0 end
    end
  end
  -- Create new stacks for remainder
  while amount > 0 do
    local stackAmt = math.min(amount, maxStack)
    local added = inventory:AddItem({id = itemId, count = stackAmt})
    if not added then return amount end -- no space left
    amount -= stackAmt
  end
  return 0 -- all added
end`,
  },
  {
    name: 'Equipment Slots',
    category: 'inventory',
    keywords: ['equip', 'equipment', 'slot', 'weapon', 'armor', 'gear'],
    code: `-- Equipment system with typed slots
local Equipment = {}
Equipment.__index = Equipment
local SLOT_TYPES = {"head", "chest", "legs", "feet", "weapon", "shield", "ring1", "ring2", "necklace"}
function Equipment.new()
  local slots = {}
  for _, s in SLOT_TYPES do slots[s] = nil end
  return setmetatable({slots = slots}, Equipment)
end
function Equipment:Equip(item: {}, slot: string): {}?
  if not table.find(SLOT_TYPES, slot) then return nil end
  if item.slot ~= slot then warn("Wrong slot type"); return nil end
  local old = self.slots[slot]
  self.slots[slot] = item
  return old -- return unequipped item
end
function Equipment:Unequip(slot: string): {}?
  local item = self.slots[slot]
  self.slots[slot] = nil
  return item
end
function Equipment:GetTotalStats(): {[string]: number}
  local stats = {attack=0, defense=0, speed=0, health=0}
  for _, item in self.slots do
    if item and item.stats then
      for k, v in item.stats do stats[k] = (stats[k] or 0) + v end
    end
  end
  return stats
end`,
  },
  {
    name: 'Hotbar System',
    category: 'inventory',
    keywords: ['hotbar', 'quickslot', 'toolbar', 'select', 'number keys'],
    code: `-- Hotbar: 1-9 quick-access slots bound to number keys
local UIS = game:GetService("UserInputService")
local hotbar = table.create(9)
local activeSlot = 1
local function setHotbarSlot(index: number, item: {}?)
  if index < 1 or index > 9 then return end
  hotbar[index] = item
end
local function selectSlot(index: number)
  if index == activeSlot then return end
  activeSlot = index
  -- Fire events/update UI
end
UIS.InputBegan:Connect(function(input, processed)
  if processed then return end
  local keyMap = {
    [Enum.KeyCode.One]=1, [Enum.KeyCode.Two]=2, [Enum.KeyCode.Three]=3,
    [Enum.KeyCode.Four]=4, [Enum.KeyCode.Five]=5, [Enum.KeyCode.Six]=6,
    [Enum.KeyCode.Seven]=7, [Enum.KeyCode.Eight]=8, [Enum.KeyCode.Nine]=9,
  }
  local slot = keyMap[input.KeyCode]
  if slot then selectSlot(slot) end
end)`,
  },
  {
    name: 'Item Tooltip',
    category: 'inventory',
    keywords: ['tooltip', 'hover', 'item info', 'description', 'popup'],
    code: `-- Tooltip that follows mouse on item hover
local tooltip = script.Parent.Tooltip -- Frame with TextLabels inside
local function showTooltip(item: {})
  tooltip.ItemName.Text = item.name or "Unknown"
  tooltip.Description.Text = item.description or ""
  tooltip.Rarity.Text = item.rarity or "common"
  tooltip.Stats.Text = ""
  if item.stats then
    local lines = {}
    for k, v in item.stats do table.insert(lines, k .. ": +" .. v) end
    tooltip.Stats.Text = table.concat(lines, "\\n")
  end
  tooltip.Visible = true
end
local function hideTooltip() tooltip.Visible = false end
-- Follow mouse
game:GetService("RunService").RenderStepped:Connect(function()
  if tooltip.Visible then
    local mouse = game:GetService("UserInputService"):GetMouseLocation()
    tooltip.Position = UDim2.fromOffset(mouse.X + 15, mouse.Y + 15)
  end
end)`,
  },
  {
    name: 'Item Rarity Colors',
    category: 'inventory',
    keywords: ['rarity', 'color', 'tier', 'common', 'legendary', 'epic'],
    code: `-- Rarity color system
local RARITY_COLORS = {
  common = Color3.fromRGB(180, 180, 180),
  uncommon = Color3.fromRGB(76, 175, 80),
  rare = Color3.fromRGB(33, 150, 243),
  epic = Color3.fromRGB(156, 39, 176),
  legendary = Color3.fromRGB(255, 193, 7),
  mythic = Color3.fromRGB(244, 67, 54),
}
local RARITY_ORDER = {"common", "uncommon", "rare", "epic", "legendary", "mythic"}
local function getRarityColor(rarity: string): Color3
  return RARITY_COLORS[rarity] or RARITY_COLORS.common
end
local function compareRarity(a: string, b: string): boolean
  local ai = table.find(RARITY_ORDER, a) or 1
  local bi = table.find(RARITY_ORDER, b) or 1
  return ai < bi
end`,
  },
  {
    name: 'Inventory Sorting/Filtering',
    category: 'inventory',
    keywords: ['sort', 'filter', 'search', 'organize', 'inventory'],
    code: `-- Sort and filter inventory items
local function sortInventory(items: {{}}, sortBy: string): {{}}
  local sorted = table.clone(items)
  if sortBy == "name" then
    table.sort(sorted, function(a, b) return (a.name or "") < (b.name or "") end)
  elseif sortBy == "rarity" then
    local order = {common=1, uncommon=2, rare=3, epic=4, legendary=5, mythic=6}
    table.sort(sorted, function(a, b) return (order[a.rarity] or 0) > (order[b.rarity] or 0) end)
  elseif sortBy == "type" then
    table.sort(sorted, function(a, b) return (a.type or "") < (b.type or "") end)
  end
  return sorted
end
local function filterInventory(items: {{}}, filterType: string): {{}}
  local result = {}
  for _, item in items do
    if item.type == filterType then table.insert(result, item) end
  end
  return result
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ECONOMY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ECONOMY_PATTERNS: LuauPattern[] = [
  {
    name: 'Multi-Currency System',
    category: 'economy',
    keywords: ['currency', 'coins', 'gems', 'money', 'gold', 'premium'],
    code: `-- Multiple currencies with transactions
local Wallet = {}
Wallet.__index = Wallet
function Wallet.new()
  return setmetatable({currencies = {coins=0, gems=0, tickets=0}}, Wallet)
end
function Wallet:Get(currency: string): number
  return self.currencies[currency] or 0
end
function Wallet:Add(currency: string, amount: number): boolean
  if amount < 0 then return false end
  self.currencies[currency] = (self.currencies[currency] or 0) + amount
  return true
end
function Wallet:Spend(currency: string, amount: number): boolean
  if amount < 0 then return false end
  local current = self.currencies[currency] or 0
  if current < amount then return false end
  self.currencies[currency] = current - amount
  return true
end
function Wallet:Transfer(to, currency: string, amount: number): boolean
  if not self:Spend(currency, amount) then return false end
  to:Add(currency, amount)
  return true
end`,
  },
  {
    name: 'Shop with Dynamic Pricing',
    category: 'economy',
    keywords: ['shop', 'store', 'buy', 'price', 'dynamic', 'discount'],
    code: `-- Shop with supply/demand pricing and discounts
local Shop = {}
Shop.__index = Shop
function Shop.new(items: {{id: string, basePrice: number, stock: number}})
  local s = setmetatable({items = {}, sales = {}}, Shop)
  for _, item in items do s.items[item.id] = item end
  return s
end
function Shop:GetPrice(itemId: string): number
  local item = self.items[itemId]
  if not item then return math.huge end
  local price = item.basePrice
  -- Supply modifier: lower stock = higher price
  if item.stock < 5 then price *= 1.5 end
  -- Sale modifier
  local sale = self.sales[itemId]
  if sale and os.time() < sale.expires then price *= sale.multiplier end
  return math.floor(price)
end
function Shop:Buy(player, itemId: string): boolean
  local item = self.items[itemId]
  if not item or item.stock <= 0 then return false end
  local price = self:GetPrice(itemId)
  -- Deduct currency, give item, reduce stock
  item.stock -= 1
  return true
end`,
  },
  {
    name: 'Auction Timer',
    category: 'economy',
    keywords: ['auction', 'bid', 'timer', 'highest', 'sell'],
    code: `-- Timed auction system
local Auction = {}
Auction.__index = Auction
function Auction.new(item: {}, startPrice: number, duration: number)
  return setmetatable({
    item = item, currentBid = startPrice, highestBidder = nil,
    endTime = os.time() + duration, bids = {},
  }, Auction)
end
function Auction:PlaceBid(userId: number, amount: number): (boolean, string)
  if os.time() >= self.endTime then return false, "Auction ended" end
  if amount <= self.currentBid then return false, "Bid too low" end
  self.currentBid = amount
  self.highestBidder = userId
  table.insert(self.bids, {userId=userId, amount=amount, time=os.time()})
  -- Extend auction if bid in last 30 seconds
  if self.endTime - os.time() < 30 then self.endTime += 15 end
  return true, "Bid placed"
end
function Auction:GetTimeLeft(): number
  return math.max(0, self.endTime - os.time())
end`,
  },
  {
    name: 'Trade Verification',
    category: 'economy',
    keywords: ['trade', 'exchange', 'verify', 'both accept', 'swap'],
    code: `-- Two-player trade with double confirmation
local activeTrades: {[string]: {}} = {}
local function startTrade(player1: Player, player2: Player): string
  local tradeId = player1.UserId .. "_" .. player2.UserId .. "_" .. os.time()
  activeTrades[tradeId] = {
    p1 = {userId = player1.UserId, items = {}, accepted = false},
    p2 = {userId = player2.UserId, items = {}, accepted = false},
    status = "open",
  }
  return tradeId
end
local function addToTrade(tradeId: string, userId: number, item: {})
  local trade = activeTrades[tradeId]
  if not trade or trade.status ~= "open" then return end
  local side = if trade.p1.userId == userId then trade.p1 else trade.p2
  table.insert(side.items, item)
  trade.p1.accepted = false; trade.p2.accepted = false -- reset on change
end
local function acceptTrade(tradeId: string, userId: number): boolean
  local trade = activeTrades[tradeId]
  if not trade then return false end
  local side = if trade.p1.userId == userId then trade.p1 else trade.p2
  side.accepted = true
  if trade.p1.accepted and trade.p2.accepted then
    trade.status = "complete"
    -- Swap items between players
    return true
  end
  return false
end`,
  },
  {
    name: 'Bank with Interest',
    category: 'economy',
    keywords: ['bank', 'interest', 'deposit', 'withdraw', 'savings'],
    code: `-- Bank system with compound interest
local Bank = {}
Bank.__index = Bank
function Bank.new(interestRate: number) -- e.g. 0.01 = 1% per cycle
  return setmetatable({accounts = {}, rate = interestRate}, Bank)
end
function Bank:Deposit(userId: number, amount: number): boolean
  if amount <= 0 then return false end
  if not self.accounts[userId] then
    self.accounts[userId] = {balance = 0, lastInterest = os.time()}
  end
  self.accounts[userId].balance += amount
  return true
end
function Bank:Withdraw(userId: number, amount: number): boolean
  local acc = self.accounts[userId]
  if not acc or acc.balance < amount then return false end
  acc.balance -= amount
  return true
end
function Bank:ApplyInterest(userId: number)
  local acc = self.accounts[userId]
  if not acc then return end
  acc.balance = math.floor(acc.balance * (1 + self.rate))
  acc.lastInterest = os.time()
end
function Bank:GetBalance(userId: number): number
  return self.accounts[userId] and self.accounts[userId].balance or 0
end`,
  },
  {
    name: 'Tax System',
    category: 'economy',
    keywords: ['tax', 'fee', 'commission', 'marketplace fee', 'cut'],
    code: `-- Transaction tax/fee system
local TAX_RATES = {
  trade = 0.05,    -- 5% trade tax
  auction = 0.10,  -- 10% auction fee
  shop = 0,        -- no shop tax
  transfer = 0.02, -- 2% transfer fee
}
local function calculateTax(amount: number, txType: string): (number, number)
  local rate = TAX_RATES[txType] or 0
  local tax = math.floor(amount * rate)
  local net = amount - tax
  return net, tax
end
-- Usage: local received, taxed = calculateTax(1000, "auction") -- 900, 100`,
  },
  {
    name: 'Inflation Tracking',
    category: 'economy',
    keywords: ['inflation', 'economy', 'money supply', 'balance', 'sink'],
    code: `-- Track money entering and leaving the economy
local EconomyTracker = {
  totalMinted = 0,   -- money created (quest rewards, etc.)
  totalSunk = 0,     -- money removed (shops, fees, etc.)
  transactions = {},
}
function EconomyTracker:Mint(amount: number, source: string)
  self.totalMinted += amount
  table.insert(self.transactions, {type="mint", amount=amount, source=source, time=os.time()})
end
function EconomyTracker:Sink(amount: number, source: string)
  self.totalSunk += amount
  table.insert(self.transactions, {type="sink", amount=amount, source=source, time=os.time()})
end
function EconomyTracker:GetNetSupply(): number
  return self.totalMinted - self.totalSunk
end
function EconomyTracker:GetInflationRate(): number
  if self.totalSunk == 0 then return 1 end
  return self.totalMinted / self.totalSunk
end`,
  },
  {
    name: 'Limited-Time Sales',
    category: 'economy',
    keywords: ['sale', 'limited time', 'flash sale', 'discount', 'event'],
    code: `-- Limited-time sales manager
local SalesManager = {activeSales = {}}
function SalesManager:CreateSale(id: string, discount: number, durationSec: number, itemIds: {string})
  self.activeSales[id] = {
    discount = discount, -- 0.25 = 25% off
    endTime = os.time() + durationSec,
    items = {},
  }
  for _, itemId in itemIds do self.activeSales[id].items[itemId] = true end
end
function SalesManager:GetDiscount(itemId: string): number
  local bestDiscount = 0
  for _, sale in self.activeSales do
    if os.time() < sale.endTime and sale.items[itemId] then
      bestDiscount = math.max(bestDiscount, sale.discount)
    end
  end
  return bestDiscount
end
function SalesManager:CleanExpired()
  for id, sale in self.activeSales do
    if os.time() >= sale.endTime then self.activeSales[id] = nil end
  end
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// AI BEHAVIOR PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const AI_BEHAVIOR_PATTERNS: LuauPattern[] = [
  {
    name: 'Behavior Tree Node',
    category: 'ai-behavior',
    keywords: ['behavior tree', 'bt', 'node', 'selector', 'sequence', 'npc ai'],
    code: `-- Behavior tree: Selector (first success) and Sequence (all must succeed)
local BT = {}
function BT.Selector(children)
  return function(context)
    for _, child in children do
      local result = child(context)
      if result == "success" then return "success" end
    end
    return "failure"
  end
end
function BT.Sequence(children)
  return function(context)
    for _, child in children do
      local result = child(context)
      if result == "failure" then return "failure" end
    end
    return "success"
  end
end
function BT.Condition(fn) return function(ctx) return if fn(ctx) then "success" else "failure" end end
function BT.Action(fn) return function(ctx) fn(ctx); return "success" end end
-- Usage: local tree = BT.Selector({BT.Sequence({isLowHP, flee}), BT.Sequence({seeEnemy, attack}), idle})`,
  },
  {
    name: 'Utility AI Scoring',
    category: 'ai-behavior',
    keywords: ['utility', 'score', 'decision', 'ai', 'priority', 'best action'],
    code: `-- Utility AI: score each action, pick highest
local function evaluateActions(npc, actions: {{name: string, score: (npc: any) -> number, execute: (npc: any) -> ()}})
  local best, bestScore = nil, -math.huge
  for _, action in actions do
    local score = action.score(npc)
    if score > bestScore then bestScore = score; best = action end
  end
  if best then best.execute(npc) end
end
-- Define actions
local npcActions = {
  {name="attack", score=function(npc)
    return if npc.target and npc.hp > 30 then 80 else 0
  end, execute=function(npc) --[[ attack logic ]] end},
  {name="heal", score=function(npc)
    return if npc.hp < 50 then 100 - npc.hp else 0
  end, execute=function(npc) --[[ heal logic ]] end},
  {name="flee", score=function(npc)
    return if npc.hp < 20 then 120 else 0
  end, execute=function(npc) --[[ flee logic ]] end},
  {name="idle", score=function() return 10 end, execute=function() end},
}`,
  },
  {
    name: 'Flee Behavior',
    category: 'ai-behavior',
    keywords: ['flee', 'run away', 'escape', 'retreat', 'scared'],
    code: `-- NPC flee: move directly away from threat
local function flee(npc: Model, threat: Vector3)
  local root = npc:FindFirstChild("HumanoidRootPart")
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  if not root or not humanoid then return end
  local away = (root.Position - threat).Unit
  local fleeTarget = root.Position + away * 50
  -- Clamp to ground level using raycast
  local ray = workspace:Raycast(fleeTarget + Vector3.new(0, 50, 0), Vector3.new(0, -100, 0))
  if ray then fleeTarget = ray.Position end
  humanoid:MoveTo(fleeTarget)
  humanoid.WalkSpeed = 24 -- sprint
end`,
  },
  {
    name: 'Flock/Group Behavior',
    category: 'ai-behavior',
    keywords: ['flock', 'group', 'swarm', 'boid', 'formation', 'herd'],
    code: `-- Boid flocking: separation + alignment + cohesion
local function calculateFlocking(boid, neighbors: {{pos: Vector3, vel: Vector3}}, weights: {})
  local sep = Vector3.zero
  local align = Vector3.zero
  local cohesion = Vector3.zero
  local count = #neighbors
  if count == 0 then return Vector3.zero end
  for _, n in neighbors do
    local diff = boid.pos - n.pos
    local dist = diff.Magnitude
    if dist > 0 and dist < (weights.separationDist or 10) then
      sep += diff.Unit / dist -- stronger when closer
    end
    align += n.vel
    cohesion += n.pos
  end
  align = (align / count).Unit
  cohesion = ((cohesion / count) - boid.pos).Unit
  return sep * (weights.sep or 1.5) + align * (weights.align or 1) + cohesion * (weights.coh or 1)
end`,
  },
  {
    name: 'Cover-Seeking AI',
    category: 'ai-behavior',
    keywords: ['cover', 'hide', 'shelter', 'duck', 'tactical'],
    code: `-- Find cover position away from threat
local function findCover(npc: Model, threat: Vector3, searchRadius: number): Vector3?
  local root = npc:FindFirstChild("HumanoidRootPart")
  if not root then return nil end
  local bestPos, bestScore = nil, -math.huge
  -- Sample positions around the NPC
  for angle = 0, 350, 30 do
    local rad = math.rad(angle)
    for dist = 10, searchRadius, 5 do
      local testPos = root.Position + Vector3.new(math.cos(rad) * dist, 0, math.sin(rad) * dist)
      -- Raycast from threat to test position: if blocked, it's cover
      local ray = workspace:Raycast(threat, (testPos - threat).Unit * (testPos - threat).Magnitude)
      if ray then -- something blocks line of sight
        local score = (testPos - threat).Magnitude - (testPos - root.Position).Magnitude * 0.5
        if score > bestScore then bestScore = score; bestPos = testPos end
      end
    end
  end
  return bestPos
end`,
  },
  {
    name: 'Patrol with Random Stops',
    category: 'ai-behavior',
    keywords: ['patrol', 'waypoint', 'guard', 'wander', 'walk around'],
    code: `-- NPC patrols waypoints with random idle stops
local function patrol(npc: Model, waypoints: {Vector3})
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end
  local index = 1
  while humanoid.Health > 0 do
    humanoid:MoveTo(waypoints[index])
    humanoid.MoveToFinished:Wait()
    -- Random chance to stop and look around
    if math.random() < 0.3 then
      humanoid.WalkSpeed = 0
      task.wait(math.random(2, 5))
      humanoid.WalkSpeed = 14
    end
    index = index % #waypoints + 1
  end
end
-- Usage: task.spawn(patrol, npcModel, {Vector3.new(0,0,0), Vector3.new(50,0,0), Vector3.new(50,0,50)})`,
  },
  {
    name: 'Aggro Table (Threat System)',
    category: 'ai-behavior',
    keywords: ['aggro', 'threat', 'taunt', 'target priority', 'boss'],
    code: `-- Track threat per player, attack highest threat
local AggroTable = {}
AggroTable.__index = AggroTable
function AggroTable.new()
  return setmetatable({threats = {}}, AggroTable)
end
function AggroTable:AddThreat(userId: number, amount: number)
  self.threats[userId] = (self.threats[userId] or 0) + amount
end
function AggroTable:RemovePlayer(userId: number)
  self.threats[userId] = nil
end
function AggroTable:GetTarget(): number?
  local highest, best = 0, nil
  for userId, threat in self.threats do
    if threat > highest then highest = threat; best = userId end
  end
  return best
end
function AggroTable:DecayAll(rate: number)
  for userId, threat in self.threats do
    self.threats[userId] = threat * rate
    if self.threats[userId] < 1 then self.threats[userId] = nil end
  end
end`,
  },
  {
    name: 'Ranged NPC (Keep Distance)',
    category: 'ai-behavior',
    keywords: ['ranged', 'archer', 'shooter', 'keep distance', 'kite'],
    code: `-- Ranged NPC: maintain ideal distance from target
local IDEAL_RANGE = 30
local MIN_RANGE = 15
local function rangedBehavior(npc: Model, target: Model)
  local root = npc:FindFirstChild("HumanoidRootPart")
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  local tRoot = target:FindFirstChild("HumanoidRootPart")
  if not root or not humanoid or not tRoot then return end
  local dist = (root.Position - tRoot.Position).Magnitude
  if dist < MIN_RANGE then
    -- Too close: back away
    local away = (root.Position - tRoot.Position).Unit
    humanoid:MoveTo(root.Position + away * 20)
  elseif dist > IDEAL_RANGE * 1.5 then
    -- Too far: approach
    humanoid:MoveTo(tRoot.Position)
  else
    -- Good range: strafe and shoot
    local right = root.CFrame.RightVector
    humanoid:MoveTo(root.Position + right * 10 * (if math.random() > 0.5 then 1 else -1))
  end
end`,
  },
  {
    name: 'Healer NPC (Support Ally)',
    category: 'ai-behavior',
    keywords: ['healer', 'heal', 'support', 'ally', 'medic'],
    code: `-- Healer NPC: find lowest-HP ally and heal them
local function healerBehavior(healer: Model, allies: {Model})
  local lowestHP, target = math.huge, nil
  for _, ally in allies do
    local hum = ally:FindFirstChildOfClass("Humanoid")
    if hum and hum.Health > 0 and hum.Health < hum.MaxHealth then
      if hum.Health < lowestHP then lowestHP = hum.Health; target = ally end
    end
  end
  if not target then return end
  local healerRoot = healer:FindFirstChild("HumanoidRootPart")
  local targetRoot = target:FindFirstChild("HumanoidRootPart")
  if not healerRoot or not targetRoot then return end
  local dist = (healerRoot.Position - targetRoot.Position).Magnitude
  if dist > 15 then
    healer:FindFirstChildOfClass("Humanoid"):MoveTo(targetRoot.Position)
  else
    -- In range: heal
    local hum = target:FindFirstChildOfClass("Humanoid")
    hum.Health = math.min(hum.MaxHealth, hum.Health + 20)
  end
end`,
  },
  {
    name: 'Boss Phase Manager',
    category: 'ai-behavior',
    keywords: ['boss', 'phase', 'stage', 'enrage', 'mechanic'],
    code: `-- Boss with multiple phases based on HP thresholds
local BossPhaseManager = {}
BossPhaseManager.__index = BossPhaseManager
function BossPhaseManager.new(phases: {{threshold: number, name: string, onEnter: () -> ()}})
  table.sort(phases, function(a, b) return a.threshold > b.threshold end)
  return setmetatable({phases = phases, currentPhase = 1, triggered = {}}, BossPhaseManager)
end
function BossPhaseManager:Update(hpPercent: number)
  for i, phase in self.phases do
    if hpPercent <= phase.threshold and not self.triggered[i] then
      self.triggered[i] = true
      self.currentPhase = i
      warn("Boss entering phase: " .. phase.name)
      task.spawn(phase.onEnter)
      break
    end
  end
end
-- Usage:
-- local boss = BossPhaseManager.new({
--   {threshold=0.75, name="Rage", onEnter=function() bossSpeed *= 1.5 end},
--   {threshold=0.5, name="Summon", onEnter=function() spawnMinions() end},
--   {threshold=0.25, name="Enrage", onEnter=function() bossDamage *= 2 end},
-- })`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// WORLD GENERATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const WORLD_GENERATION_PATTERNS: LuauPattern[] = [
  {
    name: 'Perlin Noise Heightmap',
    category: 'world-gen',
    keywords: ['perlin', 'noise', 'heightmap', 'terrain gen', 'procedural'],
    code: `-- Generate terrain using Perlin noise
local seed = math.random(1, 10000)
local scale = 50 -- larger = smoother
local amplitude = 40 -- max height
local function generateHeightmap(sizeX: number, sizeZ: number): {{number}}
  local map = {}
  for x = 1, sizeX do
    map[x] = {}
    for z = 1, sizeZ do
      local nx, nz = x / scale + seed, z / scale + seed
      -- Layer multiple octaves for detail
      local h = math.noise(nx, nz) * amplitude
      h += math.noise(nx * 2, nz * 2) * amplitude * 0.5
      h += math.noise(nx * 4, nz * 4) * amplitude * 0.25
      map[x][z] = h
    end
  end
  return map
end`,
  },
  {
    name: 'L-System Tree Generation',
    category: 'world-gen',
    keywords: ['tree', 'l-system', 'branch', 'organic', 'plant', 'grow'],
    code: `-- Simple L-system for tree branches
local function generateTree(origin: CFrame, length: number, thickness: number, depth: number)
  if depth <= 0 or length < 1 then return end
  -- Create trunk/branch
  local trunk = Instance.new("Part")
  trunk.Size = Vector3.new(thickness, length, thickness)
  trunk.CFrame = origin * CFrame.new(0, length / 2, 0)
  trunk.Anchored = true
  trunk.Material = Enum.Material.Wood
  trunk.Color = Color3.fromRGB(101, 67, 33)
  trunk.Parent = workspace
  local top = origin * CFrame.new(0, length, 0)
  -- Branch into 2-3 children
  local branches = math.random(2, 3)
  for i = 1, branches do
    local angle = math.rad(math.random(20, 45))
    local spin = math.rad((360 / branches) * i + math.random(-20, 20))
    local branchCF = top * CFrame.Angles(0, spin, 0) * CFrame.Angles(angle, 0, 0)
    generateTree(branchCF, length * 0.7, thickness * 0.6, depth - 1)
  end
end
-- generateTree(CFrame.new(0, 0, 0), 20, 3, 5)`,
  },
  {
    name: 'Random Building Placement',
    category: 'world-gen',
    keywords: ['building', 'city', 'place', 'random', 'generate town'],
    code: `-- Place buildings on a grid with random variation
local function generateCity(center: Vector3, gridSize: number, spacing: number)
  local buildings = {}
  for x = -gridSize, gridSize do
    for z = -gridSize, gridSize do
      if math.random() < 0.7 then -- 70% fill rate
        local pos = center + Vector3.new(x * spacing, 0, z * spacing)
        local width = math.random(8, 15)
        local height = math.random(10, 60)
        local depth = math.random(8, 15)
        local building = Instance.new("Part")
        building.Size = Vector3.new(width, height, depth)
        building.Position = pos + Vector3.new(0, height / 2, 0)
        building.Anchored = true
        building.Material = Enum.Material.Concrete
        building.Color = Color3.fromRGB(math.random(140,200), math.random(140,200), math.random(140,200))
        building.Parent = workspace
        table.insert(buildings, building)
      end
    end
  end
  return buildings
end`,
  },
  {
    name: 'Road Network Generation',
    category: 'world-gen',
    keywords: ['road', 'street', 'path', 'network', 'city'],
    code: `-- Generate a simple grid road network
local function generateRoads(center: Vector3, gridSize: number, spacing: number, roadWidth: number)
  local roads = Instance.new("Folder"); roads.Name = "Roads"; roads.Parent = workspace
  local halfGrid = gridSize * spacing
  for i = -gridSize, gridSize do
    -- Horizontal road
    local hRoad = Instance.new("Part")
    hRoad.Size = Vector3.new(halfGrid * 2, 0.2, roadWidth)
    hRoad.Position = center + Vector3.new(0, 0.1, i * spacing)
    hRoad.Anchored = true
    hRoad.Material = Enum.Material.Asphalt
    hRoad.Color = Color3.fromRGB(50, 50, 50)
    hRoad.Parent = roads
    -- Vertical road
    local vRoad = Instance.new("Part")
    vRoad.Size = Vector3.new(roadWidth, 0.2, halfGrid * 2)
    vRoad.Position = center + Vector3.new(i * spacing, 0.1, 0)
    vRoad.Anchored = true
    vRoad.Material = Enum.Material.Asphalt
    vRoad.Color = Color3.fromRGB(50, 50, 50)
    vRoad.Parent = roads
  end
end`,
  },
  {
    name: 'River/Path Generation',
    category: 'world-gen',
    keywords: ['river', 'path', 'winding', 'snake', 'trail'],
    code: `-- Generate winding river/path using random walk
local function generatePath(start: Vector3, length: number, width: number, segmentLen: number)
  local folder = Instance.new("Folder"); folder.Name = "River"; folder.Parent = workspace
  local pos = start
  local angle = 0
  for i = 1, length do
    angle += (math.random() - 0.5) * 0.6 -- gentle curves
    local nextPos = pos + Vector3.new(math.cos(angle) * segmentLen, 0, math.sin(angle) * segmentLen)
    local mid = (pos + nextPos) / 2
    local seg = Instance.new("Part")
    seg.Size = Vector3.new(segmentLen * 1.2, 0.5, width + math.sin(i * 0.3) * 2)
    seg.CFrame = CFrame.lookAt(mid, nextPos) * CFrame.new(0, -0.2, 0)
    seg.Anchored = true
    seg.Material = Enum.Material.Water
    seg.Color = Color3.fromRGB(30, 100, 180)
    seg.Parent = folder
    pos = nextPos
  end
end`,
  },
  {
    name: 'Biome Blending',
    category: 'world-gen',
    keywords: ['biome', 'blend', 'transition', 'zone', 'terrain type'],
    code: `-- Assign biome based on noise, blend at boundaries
local BIOMES = {
  {name="desert", color=Color3.fromRGB(210,180,120), material=Enum.Material.Sand, threshold=-0.3},
  {name="plains", color=Color3.fromRGB(80,140,50), material=Enum.Material.Grass, threshold=0},
  {name="forest", color=Color3.fromRGB(40,100,30), material=Enum.Material.LeafyGrass, threshold=0.3},
  {name="snow", color=Color3.fromRGB(230,230,240), material=Enum.Material.Snow, threshold=0.6},
}
local function getBiome(x: number, z: number)
  local n = math.noise(x * 0.01 + 100, z * 0.01 + 100)
  local best = BIOMES[1]
  for _, biome in BIOMES do
    if n >= biome.threshold then best = biome end
  end
  return best
end`,
  },
  {
    name: 'Cave Generation (Cellular Automata)',
    category: 'world-gen',
    keywords: ['cave', 'cellular automata', 'underground', 'dungeon', 'tunnel'],
    code: `-- Cellular automata for cave-like structures
local function generateCaveMap(width: number, height: number, fillPct: number, iterations: number)
  -- Initialize random map
  local map = {}
  for x = 1, width do
    map[x] = {}
    for y = 1, height do
      map[x][y] = if math.random() < fillPct then 1 else 0
    end
  end
  -- Run automata iterations
  for _ = 1, iterations do
    local newMap = {}
    for x = 1, width do
      newMap[x] = {}
      for y = 1, height do
        local neighbors = 0
        for dx = -1, 1 do for dy = -1, 1 do
          if dx ~= 0 or dy ~= 0 then
            local nx, ny = x + dx, y + dy
            if nx < 1 or nx > width or ny < 1 or ny > height then
              neighbors += 1 -- treat edges as walls
            else
              neighbors += map[nx][ny]
            end
          end
        end end
        newMap[x][y] = if neighbors >= 5 then 1 else 0
      end
    end
    map = newMap
  end
  return map -- 1=wall, 0=open
end`,
  },
  {
    name: 'Cliff/Ledge Generation',
    category: 'world-gen',
    keywords: ['cliff', 'ledge', 'elevation', 'step', 'plateau'],
    code: `-- Create stepped cliffs/plateaus
local function generateCliffs(basePos: Vector3, numSteps: number, stepHeight: number, stepDepth: number)
  local folder = Instance.new("Folder"); folder.Name = "Cliffs"; folder.Parent = workspace
  local width = 50
  for i = 0, numSteps - 1 do
    local step = Instance.new("Part")
    step.Size = Vector3.new(width, stepHeight, stepDepth)
    step.Position = basePos + Vector3.new(0, stepHeight * i + stepHeight/2, stepDepth * i)
    step.Anchored = true
    step.Material = Enum.Material.Rock
    step.Color = Color3.fromRGB(120 - i*5, 110 - i*5, 100 - i*5)
    step.Parent = folder
    -- Add some rocky details
    for _ = 1, math.random(2, 4) do
      local rock = Instance.new("Part")
      rock.Size = Vector3.new(math.random(2,6), math.random(2,5), math.random(2,6))
      rock.Position = step.Position + Vector3.new(math.random(-20,20), stepHeight/2 + 1, math.random(-3,3))
      rock.Anchored = true
      rock.Material = Enum.Material.Rock
      rock.Parent = folder
    end
  end
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SAVE/LOAD PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const SAVE_LOAD_PATTERNS: LuauPattern[] = [
  {
    name: 'ProfileStore Integration',
    category: 'save-load',
    keywords: ['profilestore', 'profile', 'session', 'data management'],
    code: `-- ProfileStore-style data loading pattern
local DSS = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local store = DSS:GetDataStore("Profiles_v1")
local profiles: {[number]: {}} = {}
local function loadProfile(player: Player)
  local key = "profile_" .. player.UserId
  local ok, data = pcall(store.GetAsync, store, key)
  if ok and data then
    profiles[player.UserId] = data
  else
    profiles[player.UserId] = {coins=100, level=1, inventory={}, version=1}
  end
  profiles[player.UserId]._loaded = true
end
local function saveProfile(player: Player)
  local data = profiles[player.UserId]
  if not data or not data._loaded then return end
  data._loaded = nil -- don't save internal flag
  pcall(store.SetAsync, store, "profile_" .. player.UserId, data)
  data._loaded = true
end
Players.PlayerAdded:Connect(function(p) task.spawn(loadProfile, p) end)
Players.PlayerRemoving:Connect(function(p) saveProfile(p); profiles[p.UserId] = nil end)`,
  },
  {
    name: 'Data Compression for DataStore',
    category: 'save-load',
    keywords: ['compress', 'data size', 'datastore limit', 'encode', 'shrink'],
    code: `-- Compress data keys to save DataStore space (4MB limit)
local SHORT_KEYS = {coins="c", gems="g", level="l", xp="x", inventory="i", equipped="e", stats="s", settings="st"}
local LONG_KEYS = {} -- reverse map
for long, short in SHORT_KEYS do LONG_KEYS[short] = long end
local function compress(data: {})
  local compressed = {}
  for key, value in data do
    local shortKey = SHORT_KEYS[key] or key
    compressed[shortKey] = if type(value) == "table" then compress(value) else value
  end
  return compressed
end
local function decompress(data: {})
  local full = {}
  for key, value in data do
    local longKey = LONG_KEYS[key] or key
    full[longKey] = if type(value) == "table" then decompress(value) else value
  end
  return full
end`,
  },
  {
    name: 'Inventory Serialization',
    category: 'save-load',
    keywords: ['serialize', 'inventory', 'save items', 'encode items'],
    code: `-- Serialize inventory to save-friendly format
local function serializeInventory(items: {{}}): {{}}
  local serialized = {}
  for _, item in items do
    table.insert(serialized, {
      id = item.id,
      count = item.count or 1,
      rarity = item.rarity,
      -- Only save non-default properties to save space
      mods = if item.modifications and #item.modifications > 0 then item.modifications else nil,
    })
  end
  return serialized
end
local function deserializeInventory(data: {{}}): {{}}
  local items = {}
  for _, entry in data do
    local template = ITEM_DATABASE[entry.id] -- look up full item data
    if template then
      local item = table.clone(template)
      item.count = entry.count or 1
      item.modifications = entry.mods or {}
      table.insert(items, item)
    end
  end
  return items
end`,
  },
  {
    name: 'Settings Persistence',
    category: 'save-load',
    keywords: ['settings', 'config', 'preferences', 'options', 'save settings'],
    code: `-- Save/load player settings locally (client) + server backup
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local DEFAULT_SETTINGS = {
  musicVolume = 0.5, sfxVolume = 0.8, quality = "auto",
  sensitivity = 0.5, invertY = false, showDamageNumbers = true,
  chatBubbles = true, screenShake = true,
}
local function loadSettings(): {}
  local saved = player:GetAttribute("Settings")
  if saved then
    local ok, data = pcall(game:GetService("HttpService").JSONDecode, game:GetService("HttpService"), saved)
    if ok then
      -- Merge with defaults for new settings
      for k, v in DEFAULT_SETTINGS do if data[k] == nil then data[k] = v end end
      return data
    end
  end
  return table.clone(DEFAULT_SETTINGS)
end
local function saveSettings(settings: {})
  local json = game:GetService("HttpService"):JSONEncode(settings)
  player:SetAttribute("Settings", json)
end`,
  },
  {
    name: 'Cross-Server Data Sync',
    category: 'save-load',
    keywords: ['cross server', 'messaging', 'sync', 'global', 'live update'],
    code: `-- Sync data across servers using MessagingService
local MSS = game:GetService("MessagingService")
local function broadcastUpdate(topic: string, data: {})
  pcall(function()
    MSS:PublishAsync(topic, game:GetService("HttpService"):JSONEncode(data))
  end)
end
local function subscribeToUpdates(topic: string, callback: (data: {}) -> ())
  pcall(function()
    MSS:SubscribeAsync(topic, function(message)
      local ok, data = pcall(game:GetService("HttpService").JSONDecode, game:GetService("HttpService"), message.Data)
      if ok then callback(data) end
    end)
  end)
end
-- Usage: global ban sync
subscribeToUpdates("bans", function(data)
  local player = game:GetService("Players"):GetPlayerByUserId(data.userId)
  if player then player:Kick("Banned: " .. (data.reason or "")) end
end)`,
  },
  {
    name: 'Data Export/Import (JSON)',
    category: 'save-load',
    keywords: ['export', 'import', 'json', 'backup', 'transfer'],
    code: `-- Export/import player data as JSON (admin tool / transfer)
local HttpService = game:GetService("HttpService")
local function exportPlayerData(userId: number): string?
  local data = profiles[userId]
  if not data then return nil end
  return HttpService:JSONEncode({
    version = data.version, userId = userId, exportTime = os.time(), data = data,
  })
end
local function importPlayerData(json: string): (boolean, {}?)
  local ok, parsed = pcall(HttpService.JSONDecode, HttpService, json)
  if not ok then return false, nil end
  if not parsed.data or not parsed.version then return false, nil end
  return true, parsed.data
end`,
  },
  {
    name: 'Offline Reward Calculation',
    category: 'save-load',
    keywords: ['offline', 'reward', 'away', 'idle', 'time away'],
    code: `-- Calculate rewards earned while player was offline
local MAX_OFFLINE_HOURS = 24
local COINS_PER_HOUR = 50
local function calculateOfflineRewards(lastLogin: number): {coins: number, hours: number}
  local now = os.time()
  local secondsAway = now - lastLogin
  local hoursAway = math.min(secondsAway / 3600, MAX_OFFLINE_HOURS)
  if hoursAway < 0.1 then return {coins = 0, hours = 0} end
  local coins = math.floor(hoursAway * COINS_PER_HOUR)
  return {coins = coins, hours = math.floor(hoursAway * 10) / 10}
end
-- On player join:
-- local rewards = calculateOfflineRewards(profile.lastLogin)
-- if rewards.coins > 0 then
--   profile.coins += rewards.coins
--   showRewardUI(player, rewards)
-- end
-- profile.lastLogin = os.time()`,
  },
  {
    name: 'Auto-Backup with Versioning',
    category: 'save-load',
    keywords: ['backup', 'version', 'rollback', 'restore', 'history'],
    code: `-- Keep versioned backups in a separate DataStore
local backupStore = game:GetService("DataStoreService"):GetDataStore("Backups_v1")
local MAX_BACKUPS = 5
local function createBackup(userId: number, data: {})
  local key = "backups_" .. userId
  pcall(function()
    backupStore:UpdateAsync(key, function(old)
      old = old or {}
      table.insert(old, {data = data, time = os.time()})
      -- Keep only last N backups
      while #old > MAX_BACKUPS do table.remove(old, 1) end
      return old
    end)
  end)
end
local function restoreBackup(userId: number, index: number): {}?
  local ok, backups = pcall(backupStore.GetAsync, backupStore, "backups_" .. userId)
  if ok and backups and backups[index] then
    return backups[index].data
  end
  return nil
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const SOCIAL_PATTERNS: LuauPattern[] = [
  {
    name: 'Friend Invite System',
    category: 'social',
    keywords: ['friend', 'invite', 'join', 'social', 'follow'],
    code: `-- Invite friends to your server
local SocialService = game:GetService("SocialService")
local Players = game:GetService("Players")
local function inviteFriends(player: Player)
  local ok, canInvite = pcall(SocialService.CanSendGameInviteAsync, SocialService, player)
  if ok and canInvite then
    SocialService:PromptGameInvite(player)
  end
end
-- Show friend join notification
Players.PlayerAdded:Connect(function(player)
  for _, other in Players:GetPlayers() do
    if other ~= player and other:IsFriendsWith(player.UserId) then
      -- Notify both players
      game:GetService("ReplicatedStorage").Remotes.Notify:FireClient(other, player.Name .. " joined!")
    end
  end
end)`,
  },
  {
    name: 'Party System',
    category: 'social',
    keywords: ['party', 'group', 'team', 'squad', 'invite'],
    code: `-- Party system: invite, accept, leave
local parties: {[string]: {leader: number, members: {number}}} = {}
local playerParty: {[number]: string} = {}
local function createParty(leaderId: number): string
  local id = tostring(leaderId) .. "_" .. os.time()
  parties[id] = {leader = leaderId, members = {leaderId}}
  playerParty[leaderId] = id
  return id
end
local function joinParty(userId: number, partyId: string): boolean
  local party = parties[partyId]
  if not party or #party.members >= 4 then return false end
  if playerParty[userId] then return false end -- already in party
  table.insert(party.members, userId)
  playerParty[userId] = partyId
  return true
end
local function leaveParty(userId: number)
  local partyId = playerParty[userId]
  if not partyId then return end
  local party = parties[partyId]
  if not party then return end
  local idx = table.find(party.members, userId)
  if idx then table.remove(party.members, idx) end
  playerParty[userId] = nil
  if #party.members == 0 then parties[partyId] = nil end
end`,
  },
  {
    name: 'Global Chat Channel',
    category: 'social',
    keywords: ['global chat', 'channel', 'message', 'broadcast'],
    code: `-- Cross-server global chat via MessagingService
local MSS = game:GetService("MessagingService")
local HS = game:GetService("HttpService")
pcall(function()
  MSS:SubscribeAsync("GlobalChat", function(msg)
    local ok, data = pcall(HS.JSONDecode, HS, msg.Data)
    if ok then
      -- Display to all players in this server
      for _, player in game:GetService("Players"):GetPlayers() do
        game:GetService("ReplicatedStorage").Remotes.GlobalMsg:FireClient(player, data.sender, data.text)
      end
    end
  end)
end)
local function sendGlobalMessage(senderName: string, text: string)
  pcall(function()
    MSS:PublishAsync("GlobalChat", HS:JSONEncode({sender=senderName, text=text, time=os.time()}))
  end)
end`,
  },
  {
    name: 'Player Trading Invite',
    category: 'social',
    keywords: ['trade invite', 'request', 'accept', 'decline', 'trade prompt'],
    code: `-- Trade request with timeout
local tradeRequests: {[string]: {from: number, to: number, expires: number}} = {}
local function requestTrade(fromPlayer: Player, toPlayer: Player): string
  local id = fromPlayer.UserId .. "_" .. toPlayer.UserId
  tradeRequests[id] = {from = fromPlayer.UserId, to = toPlayer.UserId, expires = os.time() + 30}
  -- Notify target player
  game:GetService("ReplicatedStorage").Remotes.TradeRequest:FireClient(toPlayer, fromPlayer.Name, id)
  -- Auto-expire
  task.delay(30, function()
    if tradeRequests[id] then
      tradeRequests[id] = nil
      game:GetService("ReplicatedStorage").Remotes.TradeExpired:FireClient(fromPlayer)
    end
  end)
  return id
end`,
  },
  {
    name: 'Spectate Mode',
    category: 'social',
    keywords: ['spectate', 'watch', 'observe', 'camera follow', 'dead'],
    code: `-- Spectate another player (after death or as observer)
local camera = workspace.CurrentCamera
local spectating = false
local targetPlayer = nil
local function startSpectating(target: Player)
  spectating = true
  targetPlayer = target
  camera.CameraType = Enum.CameraType.Custom
  camera.CameraSubject = target.Character and target.Character:FindFirstChildOfClass("Humanoid")
end
local function stopSpectating()
  spectating = false
  targetPlayer = nil
  local player = game:GetService("Players").LocalPlayer
  camera.CameraSubject = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
end
local function nextTarget(direction: number)
  local players = game:GetService("Players"):GetPlayers()
  local me = game:GetService("Players").LocalPlayer
  local current = table.find(players, targetPlayer) or 1
  current = ((current - 1 + direction) % #players) + 1
  if players[current] ~= me then startSpectating(players[current]) end
end`,
  },
  {
    name: 'Player Profile Card',
    category: 'social',
    keywords: ['profile', 'card', 'stats', 'inspect', 'player info'],
    code: `-- Show player profile card on click
local function getPlayerProfile(player: Player): {}
  return {
    name = player.DisplayName,
    username = player.Name,
    level = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Level") and player.leaderstats.Level.Value or 1,
    joinDate = player:GetAttribute("JoinDate") or "Unknown",
    badge = player:GetAttribute("Title") or "Player",
    wins = player:GetAttribute("Wins") or 0,
    kills = player:GetAttribute("Kills") or 0,
    avatar = "rbxthumb://type=AvatarHeadShot&id=" .. player.UserId .. "&w=150&h=150",
  }
end`,
  },
  {
    name: 'Report System',
    category: 'social',
    keywords: ['report', 'flag', 'abuse', 'moderation', 'complaint'],
    code: `-- Player report system
local reports: {{reporter: number, reported: number, reason: string, time: number}} = {}
local reportCooldown: {[number]: number} = {}
local function submitReport(reporter: Player, reportedUserId: number, reason: string): (boolean, string)
  local now = os.time()
  if reportCooldown[reporter.UserId] and now - reportCooldown[reporter.UserId] < 60 then
    return false, "Wait before reporting again"
  end
  if #reason < 5 or #reason > 500 then return false, "Invalid reason" end
  table.insert(reports, {
    reporter = reporter.UserId, reported = reportedUserId,
    reason = reason, time = now, server = game.JobId,
  })
  reportCooldown[reporter.UserId] = now
  return true, "Report submitted"
end`,
  },
  {
    name: 'Team Voice Chat Toggle',
    category: 'social',
    keywords: ['voice', 'chat', 'mute', 'proximity', 'audio'],
    code: `-- Toggle voice chat + proximity settings
local function setupVoiceChat(player: Player)
  -- Check if voice chat is enabled
  local ok, enabled = pcall(function()
    return game:GetService("VoiceChatService")
  end)
  if not ok or not enabled then return end
  -- Create mute button handler
  local muted = false
  local function toggleMute()
    muted = not muted
    -- Update UI indicator
    player.PlayerGui:FindFirstChild("VoiceIndicator").Visible = not muted
  end
  return toggleMute
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// CAMERA PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const CAMERA_PATTERNS: LuauPattern[] = [
  {
    name: 'Follow Camera with Lag',
    category: 'camera',
    keywords: ['camera', 'follow', 'lag', 'smooth', 'chase'],
    code: `-- Smooth follow camera with adjustable lag
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local OFFSET = Vector3.new(0, 10, 20) -- behind and above
local SMOOTHNESS = 10 -- higher = more responsive
camera.CameraType = Enum.CameraType.Scriptable
RunService.RenderStepped:Connect(function(dt)
  local player = game:GetService("Players").LocalPlayer
  local char = player.Character
  local root = char and char:FindFirstChild("HumanoidRootPart")
  if root then
    local targetCF = CFrame.new(root.Position + OFFSET, root.Position)
    camera.CFrame = camera.CFrame:Lerp(targetCF, math.clamp(dt * SMOOTHNESS, 0, 1))
  end
end)`,
  },
  {
    name: 'Orbit Camera',
    category: 'camera',
    keywords: ['orbit', 'rotate', 'drag', 'mouse', 'third person'],
    code: `-- Orbit camera controlled by mouse drag
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local yaw, pitch, distance = 0, -20, 15
local dragging = false
camera.CameraType = Enum.CameraType.Scriptable
UIS.InputBegan:Connect(function(input)
  if input.UserInputType == Enum.UserInputType.MouseButton2 then dragging = true end
end)
UIS.InputEnded:Connect(function(input)
  if input.UserInputType == Enum.UserInputType.MouseButton2 then dragging = false end
end)
UIS.InputChanged:Connect(function(input)
  if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
    yaw -= input.Delta.X * 0.5
    pitch = math.clamp(pitch - input.Delta.Y * 0.5, -80, 80)
  end
  if input.UserInputType == Enum.UserInputType.MouseWheel then
    distance = math.clamp(distance - input.Position.Z * 2, 5, 50)
  end
end)
RunService.RenderStepped:Connect(function()
  local root = game:GetService("Players").LocalPlayer.Character and
    game:GetService("Players").LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
  if root then
    local cf = CFrame.new(root.Position) * CFrame.Angles(0, math.rad(yaw), 0) * CFrame.Angles(math.rad(pitch), 0, 0) * CFrame.new(0, 0, distance)
    camera.CFrame = cf
  end
end)`,
  },
  {
    name: 'First-Person with Head Bob',
    category: 'camera',
    keywords: ['first person', 'head bob', 'walk', 'sway', 'fps'],
    code: `-- First-person camera with walking head bob
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local bobAmount = 0.15
local bobSpeed = 10
local elapsed = 0
RunService.RenderStepped:Connect(function(dt)
  local player = game:GetService("Players").LocalPlayer
  local char = player.Character
  local hum = char and char:FindFirstChildOfClass("Humanoid")
  if hum and hum.MoveDirection.Magnitude > 0 then
    elapsed += dt * bobSpeed
    local bobX = math.sin(elapsed) * bobAmount * 0.5
    local bobY = math.abs(math.sin(elapsed)) * bobAmount
    local offset = CFrame.new(bobX, bobY, 0)
    camera.CFrame = camera.CFrame * offset
  else
    elapsed = 0
  end
end)`,
  },
  {
    name: 'Shoulder Cam (Over-the-Shoulder)',
    category: 'camera',
    keywords: ['shoulder', 'over the shoulder', 'third person', 'aim', 'offset'],
    code: `-- Over-the-shoulder camera offset
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local SHOULDER_OFFSET = Vector3.new(2, 0.5, 0) -- right and slightly up
local aimingOffset = Vector3.new(1.5, 0.3, 0) -- tighter when aiming
local isAiming = false
RunService.RenderStepped:Connect(function(dt)
  local offset = if isAiming then aimingOffset else SHOULDER_OFFSET
  local root = game:GetService("Players").LocalPlayer.Character and
    game:GetService("Players").LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
  if root then
    camera.CFrame = camera.CFrame * CFrame.new(offset)
  end
end)`,
  },
  {
    name: 'Cinematic Pan',
    category: 'camera',
    keywords: ['cinematic', 'pan', 'cutscene', 'scripted camera', 'flythrough'],
    code: `-- Cinematic camera: move through waypoints smoothly
local TweenService = game:GetService("TweenService")
local camera = workspace.CurrentCamera
local function playCinematic(waypoints: {CFrame}, duration: number)
  camera.CameraType = Enum.CameraType.Scriptable
  local timePerSegment = duration / #waypoints
  camera.CFrame = waypoints[1]
  for i = 2, #waypoints do
    local tween = TweenService:Create(camera, TweenInfo.new(timePerSegment, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {CFrame = waypoints[i]})
    tween:Play()
    tween.Completed:Wait()
  end
  camera.CameraType = Enum.CameraType.Custom -- return control
end
-- Usage:
-- playCinematic({CFrame.new(0,50,0), CFrame.new(50,30,50), CFrame.new(100,10,0)}, 5)`,
  },
  {
    name: 'Camera Lock-On Target',
    category: 'camera',
    keywords: ['lock on', 'target', 'focus', 'boss', 'camera target'],
    code: `-- Lock camera onto a target (boss fight, NPC conversation)
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local lockTarget: BasePart? = nil
local lockDistance = 15
local function lockOn(target: BasePart)
  lockTarget = target
  camera.CameraType = Enum.CameraType.Scriptable
end
local function unlock()
  lockTarget = nil
  camera.CameraType = Enum.CameraType.Custom
end
RunService.RenderStepped:Connect(function()
  if not lockTarget or not lockTarget.Parent then unlock(); return end
  local player = game:GetService("Players").LocalPlayer
  local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
  if root then
    local mid = (root.Position + lockTarget.Position) / 2
    local offset = CFrame.new(0, 5, lockDistance)
    camera.CFrame = CFrame.new(mid + offset.Position, mid)
  end
end)`,
  },
  {
    name: 'Zoom to Point',
    category: 'camera',
    keywords: ['zoom', 'focus', 'point', 'inspect', 'close up'],
    code: `-- Zoom camera to inspect a specific point, then return
local TweenService = game:GetService("TweenService")
local camera = workspace.CurrentCamera
local savedCFrame = nil
local function zoomToPoint(target: Vector3, distance: number?, duration: number?)
  savedCFrame = camera.CFrame
  camera.CameraType = Enum.CameraType.Scriptable
  local dist = distance or 5
  local dur = duration or 0.8
  local targetCF = CFrame.new(target + Vector3.new(0, dist * 0.5, dist), target)
  TweenService:Create(camera, TweenInfo.new(dur, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut), {CFrame = targetCF}):Play()
end
local function zoomBack(duration: number?)
  if not savedCFrame then return end
  local dur = duration or 0.8
  local tween = TweenService:Create(camera, TweenInfo.new(dur, Enum.EasingStyle.Quad), {CFrame = savedCFrame})
  tween:Play()
  tween.Completed:Connect(function() camera.CameraType = Enum.CameraType.Custom end)
end`,
  },
  {
    name: 'Security Camera Feed (ViewportFrame)',
    category: 'camera',
    keywords: ['security camera', 'viewport', 'cctv', 'monitor', 'feed'],
    code: `-- Display a scene in a ViewportFrame (security camera / minimap)
local function createCameraFeed(screenGui: ScreenGui, position: Vector3, lookAt: Vector3)
  local viewport = Instance.new("ViewportFrame")
  viewport.Size = UDim2.new(0.25, 0, 0.25, 0)
  viewport.Position = UDim2.new(0.73, 0, 0.02, 0)
  viewport.BackgroundColor3 = Color3.new(0, 0, 0)
  viewport.Parent = screenGui
  local vpCamera = Instance.new("Camera")
  vpCamera.CFrame = CFrame.new(position, lookAt)
  vpCamera.Parent = viewport
  viewport.CurrentCamera = vpCamera
  -- Clone world objects into viewport for display
  local worldModel = Instance.new("WorldModel")
  worldModel.Parent = viewport
  for _, part in workspace:GetDescendants() do
    if part:IsA("BasePart") and part:GetAttribute("ShowOnCamera") then
      local clone = part:Clone()
      clone.Parent = worldModel
    end
  end
  return viewport, vpCamera
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const AUDIO_PATTERNS: LuauPattern[] = [
  {
    name: 'Music Playlist with Crossfade',
    category: 'audio',
    keywords: ['music', 'playlist', 'crossfade', 'background', 'soundtrack'],
    code: `-- Music player with crossfade between tracks
local playlist = {"rbxassetid://123", "rbxassetid://456", "rbxassetid://789"}
local currentIndex = 1
local currentSound: Sound? = nil
local function playTrack(index: number)
  local newSound = Instance.new("Sound")
  newSound.SoundId = playlist[index]
  newSound.Volume = 0
  newSound.Parent = workspace
  newSound:Play()
  -- Crossfade: fade new in, old out
  local fadeSteps = 20
  for i = 1, fadeSteps do
    task.wait(0.05)
    newSound.Volume = (i / fadeSteps) * 0.5
    if currentSound then currentSound.Volume = ((fadeSteps - i) / fadeSteps) * 0.5 end
  end
  if currentSound then currentSound:Destroy() end
  currentSound = newSound
  currentSound.Ended:Connect(function()
    currentIndex = currentIndex % #playlist + 1
    playTrack(currentIndex)
  end)
end
playTrack(1)`,
  },
  {
    name: '3D Positional Sound',
    category: 'audio',
    keywords: ['3d sound', 'positional', 'spatial', 'distance', 'volume'],
    code: `-- Attach 3D sound to a part with rolloff
local function play3DSound(part: BasePart, soundId: string, settings: {}?)
  local sound = Instance.new("Sound")
  sound.SoundId = soundId
  sound.RollOffMode = Enum.RollOffMode.InverseTapered
  sound.RollOffMinDistance = (settings and settings.minDist) or 10
  sound.RollOffMaxDistance = (settings and settings.maxDist) or 100
  sound.Volume = (settings and settings.volume) or 1
  sound.Looped = (settings and settings.looped) or false
  sound.Parent = part
  sound:Play()
  if not sound.Looped then
    sound.Ended:Connect(function() sound:Destroy() end)
  end
  return sound
end`,
  },
  {
    name: 'Footstep Material Detection',
    category: 'audio',
    keywords: ['footstep', 'material', 'walk', 'step', 'surface'],
    code: `-- Play different footstep sounds based on floor material
local FOOTSTEP_SOUNDS = {
  [Enum.Material.Grass] = "rbxassetid://grass_step",
  [Enum.Material.Concrete] = "rbxassetid://concrete_step",
  [Enum.Material.Wood] = "rbxassetid://wood_step",
  [Enum.Material.Metal] = "rbxassetid://metal_step",
  [Enum.Material.Sand] = "rbxassetid://sand_step",
}
local function getFloorMaterial(character: Model): Enum.Material?
  local root = character:FindFirstChild("HumanoidRootPart")
  if not root then return nil end
  local ray = workspace:Raycast(root.Position, Vector3.new(0, -5, 0))
  return ray and ray.Material
end
-- In walk loop:
-- local mat = getFloorMaterial(character)
-- local soundId = FOOTSTEP_SOUNDS[mat] or FOOTSTEP_SOUNDS[Enum.Material.Concrete]`,
  },
  {
    name: 'UI Click Sound',
    category: 'audio',
    keywords: ['click', 'button', 'ui sound', 'feedback', 'press'],
    code: `-- Play sound on any button click
local SoundService = game:GetService("SoundService")
local clickSound = Instance.new("Sound")
clickSound.SoundId = "rbxassetid://876939830" -- soft click
clickSound.Volume = 0.3
clickSound.Parent = SoundService
local hoverSound = Instance.new("Sound")
hoverSound.SoundId = "rbxassetid://876939830"
hoverSound.Volume = 0.15
hoverSound.PlaybackSpeed = 1.2
hoverSound.Parent = SoundService
local function addButtonSounds(button: GuiButton)
  button.Activated:Connect(function() clickSound:Play() end)
  button.MouseEnter:Connect(function() hoverSound:Play() end)
end
-- Apply to all buttons in a ScreenGui:
-- for _, btn in screenGui:GetDescendants() do
--   if btn:IsA("GuiButton") then addButtonSounds(btn) end
-- end`,
  },
  {
    name: 'Ambient Sound Zones',
    category: 'audio',
    keywords: ['ambient', 'zone', 'atmosphere', 'environment', 'area sound'],
    code: `-- Play ambient sounds when player enters a zone
local function createAmbientZone(part: BasePart, soundId: string, volume: number?)
  local sound = Instance.new("Sound")
  sound.SoundId = soundId
  sound.Volume = 0
  sound.Looped = true
  sound.Parent = part
  sound:Play()
  local targetVol = volume or 0.4
  part.Touched:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if player then
      -- Fade in
      for i = 1, 10 do task.wait(0.05); sound.Volume = (i / 10) * targetVol end
    end
  end)
  part.TouchEnded:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if player then
      -- Fade out
      for i = 10, 1, -1 do task.wait(0.05); sound.Volume = (i / 10) * targetVol end
    end
  end)
end`,
  },
  {
    name: 'Volume Settings Save',
    category: 'audio',
    keywords: ['volume', 'settings', 'slider', 'mute', 'audio settings'],
    code: `-- Save and apply volume settings
local SoundService = game:GetService("SoundService")
local function applyVolume(musicVol: number, sfxVol: number, masterVol: number)
  -- Use SoundGroups for clean separation
  local musicGroup = SoundService:FindFirstChild("Music") or Instance.new("SoundGroup")
  musicGroup.Name = "Music"; musicGroup.Volume = musicVol; musicGroup.Parent = SoundService
  local sfxGroup = SoundService:FindFirstChild("SFX") or Instance.new("SoundGroup")
  sfxGroup.Name = "SFX"; sfxGroup.Volume = sfxVol; sfxGroup.Parent = SoundService
  SoundService.AmbientReverb = Enum.ReverbType.NoReverb
  -- Master volume via parent group or direct
  for _, group in SoundService:GetChildren() do
    if group:IsA("SoundGroup") then group.Volume *= masterVol end
  end
end`,
  },
  {
    name: 'Sound Pool for Rapid Effects',
    category: 'audio',
    keywords: ['sound pool', 'rapid', 'many sounds', 'reuse', 'performance'],
    code: `-- Pre-create sounds to avoid lag from rapid creation
local SoundPool = {}
SoundPool.__index = SoundPool
function SoundPool.new(soundId: string, poolSize: number, parent: Instance)
  local pool = {}
  for i = 1, poolSize do
    local s = Instance.new("Sound")
    s.SoundId = soundId
    s.Parent = parent
    pool[i] = s
  end
  return setmetatable({_pool = pool, _index = 1}, SoundPool)
end
function SoundPool:Play(volume: number?, speed: number?)
  local sound = self._pool[self._index]
  sound.Volume = volume or 1
  sound.PlaybackSpeed = speed or 1
  sound:Play()
  self._index = self._index % #self._pool + 1
end
-- Usage: local hitPool = SoundPool.new("rbxassetid://hit", 8, SoundService)
-- hitPool:Play(0.8, 0.9 + math.random() * 0.2) -- slight random pitch`,
  },
  {
    name: 'Dynamic Music Intensity',
    category: 'audio',
    keywords: ['dynamic music', 'intensity', 'combat music', 'adaptive', 'layer'],
    code: `-- Layer-based dynamic music: add layers for intensity
local layers = {
  {sound=nil, id="rbxassetid://base_calm", volume=0.5},
  {sound=nil, id="rbxassetid://percussion", volume=0},
  {sound=nil, id="rbxassetid://strings", volume=0},
  {sound=nil, id="rbxassetid://brass_combat", volume=0},
}
local intensity = 0 -- 0-1
local function initLayers(parent: Instance)
  for _, layer in layers do
    layer.sound = Instance.new("Sound")
    layer.sound.SoundId = layer.id
    layer.sound.Looped = true
    layer.sound.Parent = parent
    layer.sound:Play()
  end
end
local function setIntensity(level: number)
  intensity = math.clamp(level, 0, 1)
  -- Fade layers based on intensity thresholds
  for i, layer in layers do
    local threshold = (i - 1) / #layers
    local targetVol = if intensity >= threshold then layer.volume else 0
    if layer.sound then
      game:GetService("TweenService"):Create(layer.sound, TweenInfo.new(1), {Volume = targetVol}):Play()
    end
  end
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// EFFECT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const EFFECT_PATTERNS: LuauPattern[] = [
  {
    name: 'Screen Shake Effect',
    category: 'effects-adv',
    keywords: ['screen shake', 'camera shake', 'impact', 'earthquake'],
    code: `-- Screen shake with decay
local camera = workspace.CurrentCamera
local function screenShake(intensity: number, duration: number)
  local elapsed = 0
  local conn
  conn = game:GetService("RunService").RenderStepped:Connect(function(dt)
    elapsed += dt
    if elapsed >= duration then conn:Disconnect(); return end
    local decay = 1 - (elapsed / duration)
    local shakeX = (math.random() - 0.5) * 2 * intensity * decay
    local shakeY = (math.random() - 0.5) * 2 * intensity * decay
    camera.CFrame = camera.CFrame * CFrame.new(shakeX, shakeY, 0)
  end)
end
-- screenShake(1.5, 0.5) -- moderate shake for 0.5s`,
  },
  {
    name: 'Damage Flash (Red Screen)',
    category: 'effects-adv',
    keywords: ['damage flash', 'red', 'hurt', 'hit indicator', 'vignette'],
    code: `-- Flash red overlay when taking damage
local TweenService = game:GetService("TweenService")
local function createDamageFlash(screenGui: ScreenGui): Frame
  local flash = Instance.new("Frame")
  flash.Size = UDim2.new(1, 0, 1, 0)
  flash.BackgroundColor3 = Color3.fromRGB(200, 0, 0)
  flash.BackgroundTransparency = 1
  flash.BorderSizePixel = 0
  flash.ZIndex = 100
  flash.Parent = screenGui
  return flash
end
local function triggerDamageFlash(flash: Frame, intensity: number?)
  local alpha = math.clamp(intensity or 0.4, 0.1, 0.7)
  flash.BackgroundTransparency = 1 - alpha
  TweenService:Create(flash, TweenInfo.new(0.5, Enum.EasingStyle.Quad), {BackgroundTransparency = 1}):Play()
end`,
  },
  {
    name: 'Speed Lines Effect',
    category: 'effects-adv',
    keywords: ['speed lines', 'dash', 'fast', 'motion blur', 'sprint'],
    code: `-- Speed lines using multiple stretched parts in ViewportFrame
local function createSpeedLines(screenGui: ScreenGui): Frame
  local container = Instance.new("Frame")
  container.Size = UDim2.new(1, 0, 1, 0)
  container.BackgroundTransparency = 1
  container.Parent = screenGui
  container.Visible = false
  for i = 1, 20 do
    local line = Instance.new("Frame")
    line.Size = UDim2.new(0, 2, 0, math.random(50, 200))
    line.Position = UDim2.new(math.random(), 0, math.random(), 0)
    line.BackgroundColor3 = Color3.new(1, 1, 1)
    line.BackgroundTransparency = math.random() * 0.5 + 0.3
    line.Rotation = 90
    line.Parent = container
  end
  return container
end
local function setSpeedLinesVisible(container: Frame, visible: boolean)
  container.Visible = visible
end`,
  },
  {
    name: 'Rain System',
    category: 'effects-adv',
    keywords: ['rain', 'weather', 'precipitation', 'droplets', 'storm'],
    code: `-- Rain using ParticleEmitter on a large part above player
local function createRain(parent: Instance?)
  local emitter = Instance.new("Part")
  emitter.Name = "RainEmitter"
  emitter.Size = Vector3.new(100, 1, 100)
  emitter.Transparency = 1
  emitter.Anchored = true
  emitter.CanCollide = false
  emitter.Parent = parent or workspace
  local rain = Instance.new("ParticleEmitter")
  rain.Rate = 500
  rain.Lifetime = NumberRange.new(1, 1.5)
  rain.Speed = NumberRange.new(60, 80)
  rain.SpreadAngle = Vector2.new(5, 5)
  rain.EmissionDirection = Enum.NormalId.Bottom
  rain.Size = NumberSequence.new(0.05)
  rain.Color = ColorSequence.new(Color3.fromRGB(180, 200, 220))
  rain.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0.8)})
  rain.Parent = emitter
  -- Follow player
  game:GetService("RunService").Heartbeat:Connect(function()
    local root = game:GetService("Players").LocalPlayer.Character and
      game:GetService("Players").LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
    if root then emitter.Position = root.Position + Vector3.new(0, 50, 0) end
  end)
  return emitter
end`,
  },
  {
    name: 'Snow System',
    category: 'effects-adv',
    keywords: ['snow', 'winter', 'flake', 'weather', 'cold'],
    code: `-- Snow particles falling gently
local function createSnow(parent: Instance?)
  local emitter = Instance.new("Part")
  emitter.Size = Vector3.new(120, 1, 120)
  emitter.Transparency = 1
  emitter.Anchored = true
  emitter.CanCollide = false
  emitter.Parent = parent or workspace
  local snow = Instance.new("ParticleEmitter")
  snow.Rate = 200
  snow.Lifetime = NumberRange.new(4, 7)
  snow.Speed = NumberRange.new(3, 8)
  snow.SpreadAngle = Vector2.new(30, 30)
  snow.EmissionDirection = Enum.NormalId.Bottom
  snow.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(1, 0.2)})
  snow.Color = ColorSequence.new(Color3.new(1, 1, 1))
  snow.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.8, 0), NumberSequenceKeypoint.new(1, 1)})
  snow.RotSpeed = NumberRange.new(-30, 30)
  snow.Parent = emitter
  return emitter
end`,
  },
  {
    name: 'Dust Particles on Landing',
    category: 'effects-adv',
    keywords: ['dust', 'land', 'impact', 'ground', 'jump'],
    code: `-- Emit dust when character lands from a jump
local function setupLandingDust(character: Model)
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  local root = character:FindFirstChild("HumanoidRootPart")
  if not humanoid or not root then return end
  local wasInAir = false
  humanoid.StateChanged:Connect(function(_, new)
    if new == Enum.HumanoidStateType.Freefall then wasInAir = true end
    if new == Enum.HumanoidStateType.Landed and wasInAir then
      wasInAir = false
      -- Spawn dust burst
      local dust = Instance.new("ParticleEmitter")
      dust.Color = ColorSequence.new(Color3.fromRGB(180, 160, 130))
      dust.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 2)})
      dust.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1)})
      dust.Lifetime = NumberRange.new(0.5, 1)
      dust.Speed = NumberRange.new(5, 10)
      dust.SpreadAngle = Vector2.new(180, 0)
      dust.Rate = 0; dust.Parent = root
      dust:Emit(15) -- burst
      game:GetService("Debris"):AddItem(dust, 1.5)
    end
  end)
end`,
  },
  {
    name: 'Footprint Decals',
    category: 'effects-adv',
    keywords: ['footprint', 'decal', 'trail', 'snow footprint', 'tracks'],
    code: `-- Leave footprint decals while walking
local function setupFootprints(character: Model, decalId: string)
  local root = character:FindFirstChild("HumanoidRootPart")
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not root or not humanoid then return end
  local lastPrint = 0
  game:GetService("RunService").Heartbeat:Connect(function()
    if humanoid.MoveDirection.Magnitude < 0.1 then return end
    if os.clock() - lastPrint < 0.4 then return end
    lastPrint = os.clock()
    local ray = workspace:Raycast(root.Position, Vector3.new(0, -5, 0))
    if ray then
      local print = Instance.new("Part")
      print.Size = Vector3.new(1.5, 0.05, 2)
      print.CFrame = CFrame.new(ray.Position, ray.Position + humanoid.MoveDirection) * CFrame.Angles(0, 0, 0)
      print.Anchored = true
      print.CanCollide = false
      print.Transparency = 0.5
      print.Parent = workspace
      game:GetService("Debris"):AddItem(print, 10)
    end
  end)
end`,
  },
  {
    name: 'Water Splash Effect',
    category: 'effects-adv',
    keywords: ['splash', 'water', 'enter water', 'dive', 'ripple'],
    code: `-- Water splash on entry
local function waterSplash(position: Vector3)
  local splash = Instance.new("Part")
  splash.Size = Vector3.new(1, 1, 1)
  splash.Position = position
  splash.Transparency = 1
  splash.Anchored = true
  splash.CanCollide = false
  splash.Parent = workspace
  local particles = Instance.new("ParticleEmitter")
  particles.Color = ColorSequence.new(Color3.fromRGB(100, 170, 255))
  particles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0)})
  particles.Lifetime = NumberRange.new(0.3, 0.8)
  particles.Speed = NumberRange.new(10, 25)
  particles.SpreadAngle = Vector2.new(60, 60)
  particles.EmissionDirection = Enum.NormalId.Top
  particles.Rate = 0
  particles.Parent = splash
  particles:Emit(30)
  game:GetService("Debris"):AddItem(splash, 2)
end`,
  },
  {
    name: 'Fire + Smoke Combo',
    category: 'effects-adv',
    keywords: ['fire', 'smoke', 'flame', 'burning', 'campfire', 'torch'],
    code: `-- Realistic fire + smoke combo on a part
local function addFireEffect(part: BasePart)
  local fire = Instance.new("ParticleEmitter")
  fire.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(100, 20, 0)),
  })
  fire.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 2), NumberSequenceKeypoint.new(1, 0)})
  fire.Lifetime = NumberRange.new(0.5, 1)
  fire.Rate = 80
  fire.Speed = NumberRange.new(3, 6)
  fire.EmissionDirection = Enum.NormalId.Top
  fire.LightEmission = 1
  fire.Parent = part
  local smoke = Instance.new("ParticleEmitter")
  smoke.Color = ColorSequence.new(Color3.fromRGB(60, 60, 60))
  smoke.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(1, 5)})
  smoke.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 1)})
  smoke.Lifetime = NumberRange.new(2, 4)
  smoke.Rate = 20
  smoke.Speed = NumberRange.new(2, 4)
  smoke.Parent = part
end`,
  },
  {
    name: 'Magic Circle Effect',
    category: 'effects-adv',
    keywords: ['magic', 'circle', 'spell', 'ritual', 'glow', 'rune'],
    code: `-- Rotating magic circle on the ground
local function createMagicCircle(position: Vector3, radius: number, color: Color3?)
  local col = color or Color3.fromRGB(100, 150, 255)
  local folder = Instance.new("Folder"); folder.Name = "MagicCircle"; folder.Parent = workspace
  -- Outer ring
  local ring = Instance.new("Part")
  ring.Shape = Enum.PartType.Cylinder
  ring.Size = Vector3.new(0.1, radius * 2, radius * 2)
  ring.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.rad(90))
  ring.Anchored = true
  ring.Material = Enum.Material.Neon
  ring.Color = col
  ring.CanCollide = false
  ring.Parent = folder
  -- Glow particles
  local glow = Instance.new("ParticleEmitter")
  glow.Color = ColorSequence.new(col)
  glow.Size = NumberSequence.new(0.3)
  glow.Rate = 50
  glow.Lifetime = NumberRange.new(0.5, 1)
  glow.Speed = NumberRange.new(1, 3)
  glow.LightEmission = 1
  glow.Parent = ring
  -- Rotate
  task.spawn(function()
    while ring.Parent do ring.CFrame *= CFrame.Angles(0, math.rad(2), 0); task.wait() end
  end)
  return folder
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MOBILE_PATTERNS: LuauPattern[] = [
  {
    name: 'Touch Joystick',
    category: 'mobile',
    keywords: ['joystick', 'touch', 'mobile', 'control', 'analog'],
    code: `-- Virtual joystick for mobile
local UIS = game:GetService("UserInputService")
local function createJoystick(gui: Frame): () -> Vector2
  local base = gui -- the circular background
  local thumb = gui:FindFirstChild("Thumb") -- the draggable dot
  local center = base.AbsolutePosition + base.AbsoluteSize / 2
  local radius = base.AbsoluteSize.X / 2
  local direction = Vector2.zero
  base.InputBegan:Connect(function(input)
    if input.UserInputType ~= Enum.UserInputType.Touch then return end
    local moveConn
    moveConn = input.Changed:Connect(function()
      local delta = Vector2.new(input.Position.X, input.Position.Y) - center
      local clamped = delta / radius
      if clamped.Magnitude > 1 then clamped = clamped.Unit end
      direction = clamped
      thumb.Position = UDim2.new(0.5 + clamped.X * 0.4, 0, 0.5 + clamped.Y * 0.4, 0)
    end)
    input:GetPropertyChangedSignal("UserInputState"):Connect(function()
      if input.UserInputState == Enum.UserInputState.End then
        moveConn:Disconnect()
        direction = Vector2.zero
        thumb.Position = UDim2.new(0.5, 0, 0.5, 0)
      end
    end)
  end)
  return function() return direction end
end`,
  },
  {
    name: 'Swipe Detection',
    category: 'mobile',
    keywords: ['swipe', 'gesture', 'touch', 'direction', 'flick'],
    code: `-- Detect swipe direction on touch
local UIS = game:GetService("UserInputService")
local MIN_SWIPE_DIST = 50
local function detectSwipe(callback: (direction: string) -> ())
  local startPos: Vector3? = nil
  UIS.TouchStarted:Connect(function(input)
    startPos = input.Position
  end)
  UIS.TouchEnded:Connect(function(input)
    if not startPos then return end
    local delta = input.Position - startPos
    local dist = Vector2.new(delta.X, delta.Y).Magnitude
    if dist < MIN_SWIPE_DIST then startPos = nil; return end
    if math.abs(delta.X) > math.abs(delta.Y) then
      callback(if delta.X > 0 then "right" else "left")
    else
      callback(if delta.Y > 0 then "down" else "up")
    end
    startPos = nil
  end)
end`,
  },
  {
    name: 'Pinch-to-Zoom',
    category: 'mobile',
    keywords: ['pinch', 'zoom', 'scale', 'two finger', 'mobile zoom'],
    code: `-- Pinch-to-zoom for mobile
local UIS = game:GetService("UserInputService")
local currentZoom = 1
local function setupPinchZoom(minZoom: number, maxZoom: number, callback: (zoom: number) -> ())
  local touches: {[InputObject]: Vector3} = {}
  local initialDist: number? = nil
  local initialZoom = currentZoom
  UIS.TouchStarted:Connect(function(input) touches[input] = input.Position end)
  UIS.TouchEnded:Connect(function(input) touches[input] = nil; initialDist = nil end)
  UIS.TouchMoved:Connect(function(input)
    touches[input] = input.Position
    local touchList = {}
    for _, pos in touches do table.insert(touchList, pos) end
    if #touchList == 2 then
      local dist = (touchList[1] - touchList[2]).Magnitude
      if not initialDist then initialDist = dist; initialZoom = currentZoom end
      currentZoom = math.clamp(initialZoom * (dist / initialDist), minZoom, maxZoom)
      callback(currentZoom)
    end
  end)
end`,
  },
  {
    name: 'Double-Tap Detection',
    category: 'mobile',
    keywords: ['double tap', 'double click', 'tap', 'gesture'],
    code: `-- Detect double-tap
local UIS = game:GetService("UserInputService")
local DOUBLE_TAP_TIME = 0.3
local DOUBLE_TAP_DIST = 30
local function setupDoubleTap(callback: (position: Vector3) -> ())
  local lastTap = 0
  local lastPos = Vector3.zero
  UIS.TouchTap:Connect(function(positions)
    local pos = positions[1]
    local now = os.clock()
    if now - lastTap < DOUBLE_TAP_TIME then
      local dist = (pos - lastPos).Magnitude
      if dist < DOUBLE_TAP_DIST then
        callback(pos)
      end
    end
    lastTap = now
    lastPos = pos
  end)
end`,
  },
  {
    name: 'Long Press Detection',
    category: 'mobile',
    keywords: ['long press', 'hold', 'press and hold', 'touch hold'],
    code: `-- Detect long press (hold)
local UIS = game:GetService("UserInputService")
local HOLD_TIME = 0.5
local function setupLongPress(callback: (position: Vector3) -> ())
  UIS.TouchStarted:Connect(function(input)
    local startPos = input.Position
    local startTime = os.clock()
    local cancelled = false
    input.Changed:Connect(function()
      if (input.Position - startPos).Magnitude > 20 then cancelled = true end
    end)
    input:GetPropertyChangedSignal("UserInputState"):Connect(function()
      if input.UserInputState == Enum.UserInputState.End then cancelled = true end
    end)
    task.delay(HOLD_TIME, function()
      if not cancelled then callback(startPos) end
    end)
  end)
end`,
  },
  {
    name: 'Mobile-Friendly UI Sizing',
    category: 'mobile',
    keywords: ['mobile ui', 'responsive', 'screen size', 'scale', 'phone'],
    code: `-- Adjust UI scale based on device screen size
local function getDeviceScale(): number
  local camera = workspace.CurrentCamera
  if not camera then return 1 end
  local viewportSize = camera.ViewportSize
  local shortSide = math.min(viewportSize.X, viewportSize.Y)
  if shortSide < 500 then return 1.5 end  -- small phone
  if shortSide < 800 then return 1.2 end  -- large phone
  if shortSide < 1200 then return 1 end   -- tablet
  return 0.9 -- desktop
end
local function applyMobileScaling(gui: ScreenGui)
  local scale = getDeviceScale()
  local uiScale = gui:FindFirstChildOfClass("UIScale") or Instance.new("UIScale")
  uiScale.Scale = scale
  uiScale.Parent = gui
end
-- Also useful: check platform
local function isMobile(): boolean
  return game:GetService("UserInputService").TouchEnabled
    and not game:GetService("UserInputService").KeyboardEnabled
end`,
  },
  {
    name: 'Haptic Feedback',
    category: 'mobile',
    keywords: ['haptic', 'vibrate', 'rumble', 'feedback', 'controller'],
    code: `-- Haptic feedback for gamepad/mobile
local HapticService = game:GetService("HapticService")
local function triggerHaptic(motor: Enum.VibrationMotor?, intensity: number?, duration: number?)
  local m = motor or Enum.VibrationMotor.Large
  local i = intensity or 0.5
  local d = duration or 0.2
  if HapticService:IsVibrationSupported(Enum.UserInputType.Gamepad1) then
    if HapticService:IsMotorSupported(Enum.UserInputType.Gamepad1, m) then
      HapticService:SetMotor(Enum.UserInputType.Gamepad1, m, i)
      task.delay(d, function()
        HapticService:SetMotor(Enum.UserInputType.Gamepad1, m, 0)
      end)
    end
  end
end`,
  },
  {
    name: 'Device Orientation Detection',
    category: 'mobile',
    keywords: ['orientation', 'portrait', 'landscape', 'rotate', 'screen'],
    code: `-- Detect and respond to screen orientation changes
local camera = workspace.CurrentCamera
local function getOrientation(): string
  local size = camera.ViewportSize
  return if size.X > size.Y then "landscape" else "portrait"
end
local lastOrientation = getOrientation()
camera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
  local newOrientation = getOrientation()
  if newOrientation ~= lastOrientation then
    lastOrientation = newOrientation
    -- Adjust UI layout
    if newOrientation == "portrait" then
      -- Stack elements vertically
    else
      -- Side-by-side layout
    end
  end
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const OPTIMIZATION_PATTERNS: LuauPattern[] = [
  {
    name: 'Connection Cleanup (Maid/Janitor)',
    category: 'optimization',
    keywords: ['cleanup', 'maid', 'janitor', 'disconnect', 'memory leak', 'destroy'],
    code: `-- Maid: tracks connections and instances for cleanup
local Maid = {}
Maid.__index = Maid
function Maid.new()
  return setmetatable({_tasks = {}}, Maid)
end
function Maid:Add(task: any): any
  table.insert(self._tasks, task)
  return task
end
function Maid:Cleanup()
  for _, task in self._tasks do
    if typeof(task) == "RBXScriptConnection" then task:Disconnect()
    elseif typeof(task) == "Instance" then task:Destroy()
    elseif type(task) == "function" then task()
    end
  end
  table.clear(self._tasks)
end
-- Usage:
-- local maid = Maid.new()
-- maid:Add(part.Touched:Connect(handler))
-- maid:Add(newPart) -- will be destroyed
-- maid:Cleanup() -- disconnects all, destroys all`,
  },
  {
    name: 'Heartbeat Throttle (Run Every N Frames)',
    category: 'optimization',
    keywords: ['throttle', 'heartbeat', 'frame skip', 'performance', 'every n'],
    code: `-- Run expensive logic every N frames instead of every frame
local RunService = game:GetService("RunService")
local function throttledHeartbeat(interval: number, callback: (dt: number) -> ())
  local accumulator = 0
  return RunService.Heartbeat:Connect(function(dt)
    accumulator += dt
    if accumulator >= interval then
      callback(accumulator)
      accumulator = 0
    end
  end)
end
-- Run expensive NPC AI every 0.2 seconds instead of every frame
-- throttledHeartbeat(0.2, function(dt) updateAllNPCs(dt) end)`,
  },
  {
    name: 'Spatial Culling (Distance-Based)',
    category: 'optimization',
    keywords: ['cull', 'distance', 'lod', 'visible', 'render distance'],
    code: `-- Hide/show objects based on distance from player
local CULL_DISTANCE = 200
local function setupCulling(objects: {BasePart})
  game:GetService("RunService").Heartbeat:Connect(function()
    local player = game:GetService("Players").LocalPlayer
    local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if not root then return end
    local pos = root.Position
    for _, obj in objects do
      local dist = (obj.Position - pos).Magnitude
      local shouldShow = dist < CULL_DISTANCE
      if obj.Parent and obj:GetAttribute("Culled") ~= (not shouldShow) then
        obj:SetAttribute("Culled", not shouldShow)
        for _, desc in obj:GetDescendants() do
          if desc:IsA("BasePart") then desc.Transparency = if shouldShow then 0 else 1 end
        end
      end
    end
  end)
end`,
  },
  {
    name: 'Part Count Reducer',
    category: 'optimization',
    keywords: ['part count', 'merge', 'union', 'reduce', 'optimize parts'],
    code: `-- Merge nearby same-material parts into fewer parts
local function canMerge(a: BasePart, b: BasePart): boolean
  return a.Material == b.Material and a.Color == b.Color and a.Anchored and b.Anchored
end
local function estimatePartSavings(model: Model): number
  local parts = {}
  for _, p in model:GetDescendants() do
    if p:IsA("BasePart") then table.insert(parts, p) end
  end
  local mergeable = 0
  for i = 1, #parts do
    for j = i + 1, #parts do
      if canMerge(parts[i], parts[j]) then
        local dist = (parts[i].Position - parts[j].Position).Magnitude
        if dist < (parts[i].Size.Magnitude + parts[j].Size.Magnitude) then
          mergeable += 1
        end
      end
    end
  end
  return mergeable
end`,
  },
  {
    name: 'Lazy Module Loading',
    category: 'optimization',
    keywords: ['lazy', 'load', 'require', 'defer', 'on demand'],
    code: `-- Lazy-load modules only when first accessed
local lazyModules: {[string]: {module: ModuleScript, loaded: any?}} = {}
local function registerLazy(name: string, module: ModuleScript)
  lazyModules[name] = {module = module, loaded = nil}
end
local function getLazy(name: string): any
  local entry = lazyModules[name]
  if not entry then error("Unknown module: " .. name) end
  if entry.loaded == nil then
    entry.loaded = require(entry.module)
  end
  return entry.loaded
end
-- Register at startup (fast, no require)
-- registerLazy("Combat", script.Parent.Modules.Combat)
-- registerLazy("Inventory", script.Parent.Modules.Inventory)
-- Use when needed (first call is slow, subsequent are instant)
-- getLazy("Combat"):Attack()`,
  },
  {
    name: 'Cached Function Results (Memoize)',
    category: 'optimization',
    keywords: ['cache', 'memoize', 'memo', 'remember', 'expensive'],
    code: `-- Memoize expensive function results
local function memoize(fn: (...any) -> any)
  local cache = {}
  return function(...)
    local key = table.concat({...}, "_")
    if cache[key] ~= nil then return cache[key] end
    local result = fn(...)
    cache[key] = result
    return result
  end
end
-- Memoize with expiry
local function memoizeWithTTL(fn: (...any) -> any, ttl: number)
  local cache = {}
  return function(...)
    local key = table.concat({...}, "_")
    local entry = cache[key]
    if entry and os.clock() - entry.time < ttl then return entry.value end
    local result = fn(...)
    cache[key] = {value = result, time = os.clock()}
    return result
  end
end`,
  },
  {
    name: 'Batch RemoteEvent Calls',
    category: 'optimization',
    keywords: ['batch', 'remote', 'network', 'reduce calls', 'bundle'],
    code: `-- Batch multiple remote calls into one per frame
local batchQueue: {{event: string, data: any}} = {}
local function queueRemote(eventName: string, data: any)
  table.insert(batchQueue, {event = eventName, data = data})
end
-- Flush once per frame
game:GetService("RunService").Heartbeat:Connect(function()
  if #batchQueue == 0 then return end
  local batch = batchQueue
  batchQueue = {}
  game:GetService("ReplicatedStorage").Remotes.BatchEvent:FireServer(batch)
end)
-- Server-side handler:
-- batchRemote.OnServerEvent:Connect(function(player, batch)
--   for _, item in batch do handleEvent(player, item.event, item.data) end
-- end)`,
  },
  {
    name: 'Deferred Instance Creation',
    category: 'optimization',
    keywords: ['defer', 'create', 'spread', 'frame budget', 'stagger'],
    code: `-- Create instances over multiple frames to avoid lag spikes
local function deferredCreate(items: {{}}, perFrame: number, creator: (item: {}) -> Instance?): ()
  local index = 1
  local conn
  conn = game:GetService("RunService").Heartbeat:Connect(function()
    local created = 0
    while index <= #items and created < perFrame do
      creator(items[index])
      index += 1
      created += 1
    end
    if index > #items then conn:Disconnect() end
  end)
end
-- Usage: create 500 trees over ~50 frames
-- deferredCreate(treePositions, 10, function(pos)
--   local tree = treeTemplate:Clone()
--   tree.Position = pos
--   tree.Parent = workspace
-- end)`,
  },
  {
    name: 'Memory Leak Detector',
    category: 'optimization',
    keywords: ['memory', 'leak', 'detect', 'monitor', 'gc'],
    code: `-- Monitor memory usage and warn about leaks
local Stats = game:GetService("Stats")
local lastMemory = 0
local samples: {number} = {}
local MAX_SAMPLES = 30
task.spawn(function()
  while true do
    task.wait(10)
    local mem = Stats:GetTotalMemoryUsageMb()
    table.insert(samples, mem)
    if #samples > MAX_SAMPLES then table.remove(samples, 1) end
    -- Check for consistent upward trend
    if #samples >= 10 then
      local first5 = 0; for i = 1, 5 do first5 += samples[i] end; first5 /= 5
      local last5 = 0; for i = #samples-4, #samples do last5 += samples[i] end; last5 /= 5
      if last5 > first5 * 1.3 then
        warn("[MEMORY] Possible leak: " .. math.floor(first5) .. "MB -> " .. math.floor(last5) .. "MB")
      end
    end
    lastMemory = mem
  end
end)`,
  },
  {
    name: 'Object Pool Pattern',
    category: 'optimization',
    keywords: ['pool', 'reuse', 'recycle', 'object pool', 'preallocate'],
    code: `-- Object pool: reuse instances instead of creating/destroying
local ObjectPool = {}
ObjectPool.__index = ObjectPool
function ObjectPool.new(template: Instance, initialSize: number)
  local pool = setmetatable({_available = {}, _template = template}, ObjectPool)
  for i = 1, initialSize do
    local obj = template:Clone()
    obj.Parent = nil
    table.insert(pool._available, obj)
  end
  return pool
end
function ObjectPool:Get(): Instance
  local obj = table.remove(self._available)
  if not obj then obj = self._template:Clone() end
  return obj
end
function ObjectPool:Return(obj: Instance)
  obj.Parent = nil
  table.insert(self._available, obj)
end
-- Usage: local bulletPool = ObjectPool.new(bulletTemplate, 50)
-- local b = bulletPool:Get(); b.Parent = workspace; ... bulletPool:Return(b)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// QUEST / MISSION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const QUEST_PATTERNS: LuauPattern[] = [
  {
    name: 'Quest System Core',
    category: 'quest',
    keywords: ['quest', 'mission', 'objective', 'task', 'goal'],
    code: `-- Quest system with objectives and rewards
local Quest = {}
Quest.__index = Quest
function Quest.new(id: string, config: {})
  return setmetatable({
    id = id, name = config.name, description = config.description or "",
    objectives = config.objectives or {}, -- {{type, target, current, required}}
    rewards = config.rewards or {},
    status = "inactive", -- inactive, active, completed, claimed
  }, Quest)
end
function Quest:UpdateObjective(objType: string, target: string, amount: number)
  for _, obj in self.objectives do
    if obj.type == objType and obj.target == target and obj.current < obj.required then
      obj.current = math.min(obj.current + amount, obj.required)
    end
  end
  -- Check completion
  local allDone = true
  for _, obj in self.objectives do
    if obj.current < obj.required then allDone = false; break end
  end
  if allDone then self.status = "completed" end
end
function Quest:ClaimRewards(): {}?
  if self.status ~= "completed" then return nil end
  self.status = "claimed"
  return self.rewards
end`,
  },
  {
    name: 'Daily Quest Rotation',
    category: 'quest',
    keywords: ['daily', 'rotation', 'refresh', 'reset', 'daily quest'],
    code: `-- Daily quests that rotate every 24 hours
local DAILY_POOL = {
  {id="kill10", name="Defeat 10 Enemies", objectives={{type="kill", target="any", current=0, required=10}}, rewards={coins=100}},
  {id="collect5", name="Collect 5 Gems", objectives={{type="collect", target="gem", current=0, required=5}}, rewards={coins=75}},
  {id="win3", name="Win 3 Rounds", objectives={{type="win", target="round", current=0, required=3}}, rewards={coins=150}},
  {id="play30", name="Play 30 Minutes", objectives={{type="playtime", target="minutes", current=0, required=30}}, rewards={coins=80}},
}
local function getDailyQuests(count: number, seed: number?): {{}}
  local rng = Random.new(seed or math.floor(os.time() / 86400)) -- same seed per day
  local available = table.clone(DAILY_POOL)
  local selected = {}
  for i = 1, math.min(count, #available) do
    local idx = rng:NextInteger(1, #available)
    table.insert(selected, table.clone(available[idx]))
    table.remove(available, idx)
  end
  return selected
end`,
  },
  {
    name: 'Quest Chain / Storyline',
    category: 'quest',
    keywords: ['chain', 'storyline', 'sequential', 'prerequisite', 'story quest'],
    code: `-- Quest chains: complete one to unlock the next
local questChains = {
  tutorial = {"quest_intro", "quest_first_kill", "quest_first_craft", "quest_explore"},
  main = {"quest_village", "quest_cave", "quest_boss1", "quest_castle", "quest_final_boss"},
}
local function getNextQuest(chainId: string, completedQuests: {[string]: boolean}): string?
  local chain = questChains[chainId]
  if not chain then return nil end
  for _, questId in chain do
    if not completedQuests[questId] then return questId end
  end
  return nil -- chain complete
end
local function getChainProgress(chainId: string, completedQuests: {[string]: boolean}): (number, number)
  local chain = questChains[chainId]
  if not chain then return 0, 0 end
  local done = 0
  for _, questId in chain do
    if completedQuests[questId] then done += 1 end
  end
  return done, #chain
end`,
  },
  {
    name: 'Achievement System',
    category: 'quest',
    keywords: ['achievement', 'badge', 'unlock', 'milestone', 'trophy'],
    code: `-- Achievement system with automatic checking
local ACHIEVEMENTS = {
  {id="first_kill", name="First Blood", desc="Defeat your first enemy", check=function(stats) return stats.kills >= 1 end},
  {id="kill_100", name="Centurion", desc="Defeat 100 enemies", check=function(stats) return stats.kills >= 100 end},
  {id="rich", name="Wealthy", desc="Earn 10000 coins", check=function(stats) return stats.totalCoins >= 10000 end},
  {id="explorer", name="Explorer", desc="Visit all zones", check=function(stats) return stats.zonesVisited >= 10 end},
  {id="survivor", name="Survivor", desc="Play for 10 hours", check=function(stats) return stats.playtime >= 36000 end},
}
local function checkAchievements(stats: {}, unlocked: {[string]: boolean}): {string}
  local newUnlocks = {}
  for _, ach in ACHIEVEMENTS do
    if not unlocked[ach.id] and ach.check(stats) then
      unlocked[ach.id] = true
      table.insert(newUnlocks, ach.id)
    end
  end
  return newUnlocks
end`,
  },
  {
    name: 'Kill Tracker / Counter Objective',
    category: 'quest',
    keywords: ['kill', 'counter', 'track', 'count', 'objective tracker'],
    code: `-- Generic counter-based objective tracker
local ObjectiveTracker = {}
ObjectiveTracker.__index = ObjectiveTracker
function ObjectiveTracker.new()
  return setmetatable({_counters = {}, _listeners = {}}, ObjectiveTracker)
end
function ObjectiveTracker:Increment(category: string, target: string, amount: number?)
  local key = category .. ":" .. target
  self._counters[key] = (self._counters[key] or 0) + (amount or 1)
  -- Notify listeners
  for _, listener in self._listeners do
    listener(category, target, self._counters[key])
  end
end
function ObjectiveTracker:GetCount(category: string, target: string): number
  return self._counters[category .. ":" .. target] or 0
end
function ObjectiveTracker:OnUpdate(callback)
  table.insert(self._listeners, callback)
end
-- Usage: tracker:Increment("kill", "zombie", 1)
-- tracker:Increment("collect", "coin", 5)`,
  },
  {
    name: 'Bounty Board',
    category: 'quest',
    keywords: ['bounty', 'board', 'accept', 'reward', 'contract'],
    code: `-- Bounty board with limited-time contracts
local BountyBoard = {}
BountyBoard.__index = BountyBoard
function BountyBoard.new()
  return setmetatable({bounties = {}, claimed = {}}, BountyBoard)
end
function BountyBoard:AddBounty(bounty: {id: string, target: string, reward: number, expires: number})
  self.bounties[bounty.id] = bounty
end
function BountyBoard:GetAvailable(userId: number): {{}}
  local available = {}
  for id, b in self.bounties do
    if os.time() < b.expires and not (self.claimed[userId] and self.claimed[userId][id]) then
      table.insert(available, b)
    end
  end
  return available
end
function BountyBoard:CompleteBounty(userId: number, bountyId: string): number?
  local bounty = self.bounties[bountyId]
  if not bounty or os.time() >= bounty.expires then return nil end
  if not self.claimed[userId] then self.claimed[userId] = {} end
  self.claimed[userId][bountyId] = true
  return bounty.reward
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// DIALOG / NPC CONVERSATION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const DIALOG_PATTERNS: LuauPattern[] = [
  {
    name: 'Dialog Tree System',
    category: 'dialog',
    keywords: ['dialog', 'conversation', 'npc talk', 'dialogue', 'choice'],
    code: `-- Branching dialog tree
local DialogTree = {}
DialogTree.__index = DialogTree
function DialogTree.new(nodes: {[string]: {}})
  return setmetatable({nodes = nodes, current = "start"}, DialogTree)
end
function DialogTree:GetCurrent(): {}?
  return self.nodes[self.current]
end
function DialogTree:Choose(optionIndex: number): {}?
  local node = self.nodes[self.current]
  if not node or not node.options then return nil end
  local option = node.options[optionIndex]
  if not option then return nil end
  self.current = option.next
  return self.nodes[self.current]
end
-- Usage:
-- local tree = DialogTree.new({
--   start = {text = "Hello traveler!", options = {
--     {text = "Tell me about this place", next = "about"},
--     {text = "Got any quests?", next = "quests"},
--     {text = "Goodbye", next = "bye"},
--   }},
--   about = {text = "This is the Crystal Kingdom...", options = {{text = "Interesting!", next = "start"}}},
--   quests = {text = "I need you to find 5 crystals.", options = {{text = "Accept", next = "accept"}}},
--   bye = {text = "Safe travels!", options = {}},
-- })`,
  },
  {
    name: 'ProximityPrompt NPC Interaction',
    category: 'dialog',
    keywords: ['proximity', 'prompt', 'interact', 'npc', 'talk to'],
    code: `-- NPC interaction via ProximityPrompt
local function setupNPCInteraction(npc: Model, dialogId: string)
  local prompt = Instance.new("ProximityPrompt")
  prompt.ObjectText = npc.Name
  prompt.ActionText = "Talk"
  prompt.MaxActivationDistance = 10
  prompt.HoldDuration = 0
  prompt.Parent = npc:FindFirstChild("HumanoidRootPart") or npc.PrimaryPart
  prompt.Triggered:Connect(function(player: Player)
    -- Face player
    local npcRoot = npc:FindFirstChild("HumanoidRootPart")
    local charRoot = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if npcRoot and charRoot then
      npcRoot.CFrame = CFrame.lookAt(npcRoot.Position, Vector3.new(charRoot.Position.X, npcRoot.Position.Y, charRoot.Position.Z))
    end
    -- Open dialog on client
    game:GetService("ReplicatedStorage").Remotes.OpenDialog:FireClient(player, dialogId)
  end)
end`,
  },
  {
    name: 'Cutscene Dialog Sequence',
    category: 'dialog',
    keywords: ['cutscene', 'sequence', 'cinematic dialog', 'story', 'narrator'],
    code: `-- Play a sequence of dialog lines with delays
local function playCutsceneDialog(player: Player, lines: {{speaker: string, text: string, delay: number?}})
  local remote = game:GetService("ReplicatedStorage").Remotes.CutsceneDialog
  for i, line in lines do
    remote:FireClient(player, {
      speaker = line.speaker,
      text = line.text,
      index = i,
      total = #lines,
    })
    task.wait(line.delay or (#line.text * 0.04 + 1)) -- auto-pace based on text length
  end
  remote:FireClient(player, {done = true})
end
-- Usage:
-- playCutsceneDialog(player, {
--   {speaker = "Elder", text = "The darkness is spreading..."},
--   {speaker = "Elder", text = "You must find the three crystals of light.", delay = 3},
--   {speaker = "Player", text = "Where do I begin?"},
--   {speaker = "Elder", text = "Seek the cave to the north. But beware...", delay = 4},
-- })`,
  },
  {
    name: 'NPC Emotion System',
    category: 'dialog',
    keywords: ['emotion', 'face', 'expression', 'mood', 'npc reaction'],
    code: `-- Change NPC face/expression during dialog
local EMOTIONS = {
  happy = "rbxassetid://happy_face",
  sad = "rbxassetid://sad_face",
  angry = "rbxassetid://angry_face",
  surprised = "rbxassetid://surprised_face",
  neutral = "rbxassetid://neutral_face",
}
local function setNPCEmotion(npc: Model, emotion: string)
  local head = npc:FindFirstChild("Head")
  if not head then return end
  local face = head:FindFirstChildOfClass("Decal") or head:FindFirstChild("face")
  if face and EMOTIONS[emotion] then
    face.Texture = EMOTIONS[emotion]
  end
  -- Also animate if humanoid exists
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  if humanoid then
    local anim = npc:FindFirstChild(emotion .. "Anim")
    if anim and anim:IsA("Animation") then
      humanoid.Animator:LoadAnimation(anim):Play()
    end
  end
end`,
  },
  {
    name: 'Shop Dialog Integration',
    category: 'dialog',
    keywords: ['shop dialog', 'merchant', 'buy dialog', 'npc shop', 'vendor'],
    code: `-- NPC merchant with dialog leading to shop
local function setupMerchant(npc: Model, shopItems: {{}})
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Trade"
  prompt.ObjectText = npc.Name
  prompt.MaxActivationDistance = 8
  prompt.Parent = npc.PrimaryPart or npc:FindFirstChild("HumanoidRootPart")
  prompt.Triggered:Connect(function(player)
    -- Random greeting
    local greetings = {"Welcome! See anything you like?", "Finest wares in town!", "Looking to trade?"}
    game:GetService("ReplicatedStorage").Remotes.OpenShop:FireClient(player, {
      merchantName = npc.Name,
      greeting = greetings[math.random(#greetings)],
      items = shopItems,
    })
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTION / GATHERING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTION_PATTERNS: LuauPattern[] = [
  {
    name: 'Collectible Pickup',
    category: 'collection',
    keywords: ['collectible', 'pickup', 'coin', 'gem', 'gather'],
    code: `-- Collectible items that respawn
local function createCollectible(part: BasePart, value: number, respawnTime: number)
  local originalParent = part.Parent
  part.Touched:Connect(function(hit)
    if not part.Parent then return end -- already collected
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    -- Give reward
    local ls = player:FindFirstChild("leaderstats")
    if ls and ls:FindFirstChild("Coins") then
      ls.Coins.Value += value
    end
    -- Collect effect
    part.Parent = nil
    -- Respawn
    task.delay(respawnTime, function()
      part.Parent = originalParent
    end)
  end)
end`,
  },
  {
    name: 'Collection Log / Codex',
    category: 'collection',
    keywords: ['collection log', 'codex', 'pokedex', 'discovered', 'catalog'],
    code: `-- Track discovered/collected items
local CollectionLog = {}
CollectionLog.__index = CollectionLog
function CollectionLog.new(allItems: {string})
  local discovered = {}
  for _, id in allItems do discovered[id] = false end
  return setmetatable({items = discovered, total = #allItems}, CollectionLog)
end
function CollectionLog:Discover(itemId: string): boolean
  if self.items[itemId] == nil then return false end
  if self.items[itemId] then return false end -- already found
  self.items[itemId] = true
  return true
end
function CollectionLog:GetProgress(): (number, number)
  local found = 0
  for _, v in self.items do if v then found += 1 end end
  return found, self.total
end
function CollectionLog:GetUndiscovered(): {string}
  local list = {}
  for id, found in self.items do if not found then table.insert(list, id) end end
  return list
end`,
  },
  {
    name: 'Resource Harvesting',
    category: 'collection',
    keywords: ['harvest', 'mine', 'chop', 'resource', 'gather', 'node'],
    code: `-- Resource node: mine/chop with progress
local function createResourceNode(part: BasePart, resource: string, hitsRequired: number, respawnTime: number)
  local hp = hitsRequired
  local harvesting = false
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Harvest"
  prompt.HoldDuration = 0
  prompt.Parent = part
  prompt.Triggered:Connect(function(player)
    if harvesting then return end
    hp -= 1
    -- Visual feedback: shake part
    local orig = part.Position
    part.Position = orig + Vector3.new(math.random()-0.5, 0, math.random()-0.5) * 0.3
    task.wait(0.1)
    part.Position = orig
    if hp <= 0 then
      harvesting = true
      -- Give resource
      game:GetService("ReplicatedStorage").Remotes.GiveResource:FireClient(player, resource, math.random(1, 3))
      part.Transparency = 1
      prompt.Enabled = false
      task.delay(respawnTime, function()
        hp = hitsRequired
        part.Transparency = 0
        prompt.Enabled = true
        harvesting = false
      end)
    end
  end)
end`,
  },
  {
    name: 'Loot Drop System',
    category: 'collection',
    keywords: ['loot', 'drop', 'reward', 'random', 'rng', 'chest'],
    code: `-- Weighted random loot table
local LOOT_TABLE = {
  {id = "coin", weight = 50, minQty = 5, maxQty = 20},
  {id = "potion", weight = 25, minQty = 1, maxQty = 3},
  {id = "gem", weight = 15, minQty = 1, maxQty = 2},
  {id = "rare_weapon", weight = 8, minQty = 1, maxQty = 1},
  {id = "legendary_item", weight = 2, minQty = 1, maxQty = 1},
}
local function rollLoot(table: {{}}): {id: string, quantity: number}
  local totalWeight = 0
  for _, entry in table do totalWeight += entry.weight end
  local roll = math.random() * totalWeight
  local cumulative = 0
  for _, entry in table do
    cumulative += entry.weight
    if roll <= cumulative then
      return {id = entry.id, quantity = math.random(entry.minQty, entry.maxQty)}
    end
  end
  return {id = table[1].id, quantity = 1}
end`,
  },
  {
    name: 'Crafting System',
    category: 'collection',
    keywords: ['craft', 'recipe', 'combine', 'forge', 'create item'],
    code: `-- Simple crafting with recipes
local RECIPES = {
  iron_sword = {materials = {iron_ore = 5, wood = 2}, result = "iron_sword", count = 1},
  health_potion = {materials = {herb = 3, water = 1}, result = "health_potion", count = 2},
  armor = {materials = {iron_ore = 10, leather = 5}, result = "iron_armor", count = 1},
}
local function canCraft(inventory: {[string]: number}, recipeId: string): boolean
  local recipe = RECIPES[recipeId]
  if not recipe then return false end
  for mat, required in recipe.materials do
    if (inventory[mat] or 0) < required then return false end
  end
  return true
end
local function craft(inventory: {[string]: number}, recipeId: string): string?
  if not canCraft(inventory, recipeId) then return nil end
  local recipe = RECIPES[recipeId]
  for mat, required in recipe.materials do
    inventory[mat] -= required
  end
  inventory[recipe.result] = (inventory[recipe.result] or 0) + recipe.count
  return recipe.result
end`,
  },
  {
    name: 'Treasure Chest with Lock',
    category: 'collection',
    keywords: ['chest', 'treasure', 'lock', 'key', 'open'],
    code: `-- Locked treasure chest requiring a key
local function createChest(model: Model, keyItemId: string, lootTable: {{}})
  local opened = false
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Open Chest"
  prompt.MaxActivationDistance = 8
  prompt.Parent = model.PrimaryPart
  prompt.Triggered:Connect(function(player)
    if opened then return end
    -- Check for key
    local hasKey = false -- check player inventory for keyItemId
    -- game:GetService("ReplicatedStorage").Remotes.CheckItem:InvokeClient(player, keyItemId)
    if not hasKey then
      game:GetService("ReplicatedStorage").Remotes.Notify:FireClient(player, "You need a " .. keyItemId .. " to open this!")
      return
    end
    opened = true
    prompt.Enabled = false
    -- Open animation: rotate lid
    local lid = model:FindFirstChild("Lid")
    if lid then
      game:GetService("TweenService"):Create(lid, TweenInfo.new(0.5), {
        CFrame = lid.CFrame * CFrame.Angles(math.rad(-110), 0, 0)
      }):Play()
    end
    -- Give loot
    local loot = rollLoot(lootTable)
    game:GetService("ReplicatedStorage").Remotes.GiveLoot:FireClient(player, loot)
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SPAWN / RESPAWN PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const SPAWN_PATTERNS: LuauPattern[] = [
  {
    name: 'Custom Spawn Location',
    category: 'spawn',
    keywords: ['spawn', 'respawn', 'checkpoint', 'spawnpoint', 'location'],
    code: `-- Custom spawn with checkpoint system
local checkpoints: {[number]: CFrame} = {} -- userId -> last checkpoint
local function setCheckpoint(player: Player, position: CFrame)
  checkpoints[player.UserId] = position
end
local function getSpawnPoint(player: Player): CFrame
  return checkpoints[player.UserId] or CFrame.new(0, 10, 0) -- default spawn
end
game:GetService("Players").PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local root = char:WaitForChild("HumanoidRootPart")
    task.wait(0.1)
    root.CFrame = getSpawnPoint(player)
  end)
end)`,
  },
  {
    name: 'Wave Spawner',
    category: 'spawn',
    keywords: ['wave', 'spawn wave', 'enemies', 'horde', 'round'],
    code: `-- Spawn enemies in waves with increasing difficulty
local WaveSpawner = {}
WaveSpawner.__index = WaveSpawner
function WaveSpawner.new(spawnPoints: {Vector3}, enemyTemplates: {Model})
  return setmetatable({
    spawnPoints = spawnPoints, templates = enemyTemplates,
    wave = 0, alive = {}, waveActive = false,
  }, WaveSpawner)
end
function WaveSpawner:StartWave()
  self.wave += 1
  self.waveActive = true
  local count = 5 + self.wave * 3 -- more enemies each wave
  for i = 1, count do
    task.delay(i * 0.5, function() -- stagger spawns
      local template = self.templates[math.random(#self.templates)]
      local spawnPos = self.spawnPoints[math.random(#self.spawnPoints)]
      local enemy = template:Clone()
      enemy:PivotTo(CFrame.new(spawnPos))
      enemy.Parent = workspace
      table.insert(self.alive, enemy)
      -- Scale difficulty
      local hum = enemy:FindFirstChildOfClass("Humanoid")
      if hum then hum.MaxHealth = 100 * (1 + self.wave * 0.2); hum.Health = hum.MaxHealth end
    end)
  end
end`,
  },
  {
    name: 'Random Spawn with Spacing',
    category: 'spawn',
    keywords: ['random spawn', 'scatter', 'distribute', 'spacing', 'place random'],
    code: `-- Spawn objects at random positions with minimum spacing
local function spawnWithSpacing(count: number, center: Vector3, radius: number, minSpacing: number, template: Instance): {Instance}
  local spawned: {Vector3} = {}
  local instances = {}
  local attempts = 0
  while #spawned < count and attempts < count * 10 do
    attempts += 1
    local angle = math.random() * math.pi * 2
    local dist = math.random() * radius
    local pos = center + Vector3.new(math.cos(angle) * dist, 0, math.sin(angle) * dist)
    -- Check spacing
    local tooClose = false
    for _, existing in spawned do
      if (pos - existing).Magnitude < minSpacing then tooClose = true; break end
    end
    if not tooClose then
      table.insert(spawned, pos)
      local obj = template:Clone()
      if obj:IsA("Model") then obj:PivotTo(CFrame.new(pos)) else obj.Position = pos end
      obj.Parent = workspace
      table.insert(instances, obj)
    end
  end
  return instances
end`,
  },
  {
    name: 'Death and Respawn Handler',
    category: 'spawn',
    keywords: ['death', 'die', 'respawn', 'revive', 'death screen'],
    code: `-- Handle player death with respawn timer
local RESPAWN_TIME = 5
game:GetService("Players").PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local humanoid = char:WaitForChild("Humanoid")
    humanoid.Died:Connect(function()
      -- Notify client to show death screen
      game:GetService("ReplicatedStorage").Remotes.PlayerDied:FireClient(player, {
        killer = humanoid:GetAttribute("LastDamager") or "Unknown",
        respawnIn = RESPAWN_TIME,
      })
      -- Drop items on death (optional)
      -- dropItems(player)
      task.wait(RESPAWN_TIME)
      player:LoadCharacter()
    end)
  end)
end)`,
  },
  {
    name: 'Team-Based Spawning',
    category: 'spawn',
    keywords: ['team', 'team spawn', 'red blue', 'side', 'versus'],
    code: `-- Spawn players at team-specific locations
local teamSpawns = {
  Red = {CFrame.new(-50, 5, 0), CFrame.new(-55, 5, 10), CFrame.new(-45, 5, -10)},
  Blue = {CFrame.new(50, 5, 0), CFrame.new(55, 5, 10), CFrame.new(45, 5, -10)},
}
local function getTeamSpawn(player: Player): CFrame
  local team = player.Team
  if not team then return CFrame.new(0, 10, 0) end
  local spawns = teamSpawns[team.Name]
  if not spawns then return CFrame.new(0, 10, 0) end
  return spawns[math.random(#spawns)]
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// VEHICLE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const VEHICLE_PATTERNS: LuauPattern[] = [
  {
    name: 'Basic Vehicle Seat',
    category: 'vehicle',
    keywords: ['vehicle', 'car', 'seat', 'drive', 'enter exit'],
    code: `-- Vehicle enter/exit with VehicleSeat
local function setupVehicle(vehicleModel: Model)
  local seat = vehicleModel:FindFirstChildOfClass("VehicleSeat")
  if not seat then return end
  seat:GetPropertyChangedSignal("Occupant"):Connect(function()
    local humanoid = seat.Occupant
    if humanoid then
      -- Player entered vehicle
      local player = game:GetService("Players"):GetPlayerFromCharacter(humanoid.Parent)
      if player then
        print(player.Name .. " entered " .. vehicleModel.Name)
        seat.MaxSpeed = 60
        seat.Torque = 50000
        seat.TurnSpeed = 3
      end
    else
      -- Player exited
      seat.Throttle = 0
      seat.Steer = 0
    end
  end)
end`,
  },
  {
    name: 'Vehicle Speed Boost',
    category: 'vehicle',
    keywords: ['boost', 'nitro', 'turbo', 'speed pad', 'fast'],
    code: `-- Speed boost pads for vehicles
local function createBoostPad(part: BasePart, boostMultiplier: number, duration: number)
  part.Touched:Connect(function(hit)
    local seat = hit:FindFirstAncestorOfClass("VehicleSeat") or hit.Parent:FindFirstChildOfClass("VehicleSeat")
    if not seat then return end
    local originalSpeed = seat.MaxSpeed
    seat.MaxSpeed = originalSpeed * boostMultiplier
    -- Visual effect
    part.BrickColor = BrickColor.new("Bright green")
    task.delay(duration, function()
      seat.MaxSpeed = originalSpeed
      part.BrickColor = BrickColor.new("Medium stone grey")
    end)
  end)
end`,
  },
  {
    name: 'Flight System',
    category: 'vehicle',
    keywords: ['fly', 'flight', 'hover', 'jetpack', 'wings'],
    code: `-- Simple flight system using BodyVelocity + BodyGyro
local function enableFlight(character: Model)
  local root = character:FindFirstChild("HumanoidRootPart")
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not root or not humanoid then return end
  local bv = Instance.new("BodyVelocity")
  bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
  bv.Velocity = Vector3.zero
  bv.Name = "FlightVelocity"
  bv.Parent = root
  local bg = Instance.new("BodyGyro")
  bg.MaxTorque = Vector3.new(1e5, 1e5, 1e5)
  bg.D = 100
  bg.Name = "FlightGyro"
  bg.Parent = root
  humanoid.PlatformStand = true
  -- Control in RenderStepped on client:
  -- bv.Velocity = camera.CFrame.LookVector * speed
  -- bg.CFrame = camera.CFrame
end
local function disableFlight(character: Model)
  local root = character:FindFirstChild("HumanoidRootPart")
  if root then
    local bv = root:FindFirstChild("FlightVelocity"); if bv then bv:Destroy() end
    local bg = root:FindFirstChild("FlightGyro"); if bg then bg:Destroy() end
  end
  local hum = character:FindFirstChildOfClass("Humanoid")
  if hum then hum.PlatformStand = false end
end`,
  },
  {
    name: 'Boat / Water Vehicle',
    category: 'vehicle',
    keywords: ['boat', 'water', 'sail', 'ship', 'float vehicle'],
    code: `-- Boat with buoyancy and steering
local function setupBoat(hull: BasePart, seat: VehicleSeat)
  local WATER_LEVEL = 10
  local BUOYANCY = 80
  game:GetService("RunService").Heartbeat:Connect(function(dt)
    local submerged = WATER_LEVEL - hull.Position.Y
    if submerged > 0 then
      local ratio = math.clamp(submerged / hull.Size.Y, 0, 1)
      hull.AssemblyLinearVelocity += Vector3.new(0, BUOYANCY * ratio * dt, 0)
      -- Water drag
      local vel = hull.AssemblyLinearVelocity
      hull.AssemblyLinearVelocity = Vector3.new(vel.X * 0.99, vel.Y * 0.95, vel.Z * 0.99)
    end
    -- Apply steering from seat
    if seat.Occupant then
      local forward = hull.CFrame.LookVector * seat.Throttle * 30
      hull.AssemblyLinearVelocity += forward * dt
    end
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MINIGAME PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MINIGAME_PATTERNS: LuauPattern[] = [
  {
    name: 'Obby Checkpoint System',
    category: 'minigame',
    keywords: ['obby', 'checkpoint', 'obstacle', 'stage', 'progress'],
    code: `-- Obby checkpoints: touch to save progress
local checkpoints = {} -- {[number]: CFrame} per player
local function setupCheckpoint(part: BasePart, stage: number)
  part.Touched:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local currentStage = checkpoints[player.UserId] or 0
    if stage > currentStage then
      checkpoints[player.UserId] = stage
      player:SetAttribute("ObbyStage", stage)
      -- Notification
      game:GetService("ReplicatedStorage").Remotes.Notify:FireClient(player, "Checkpoint " .. stage .. " reached!")
    end
  end)
end
-- On death, respawn at checkpoint
game:GetService("Players").PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local stage = checkpoints[player.UserId]
    if stage then
      task.wait(0.1)
      local root = char:FindFirstChild("HumanoidRootPart")
      -- Teleport to checkpoint position
    end
  end)
end)`,
  },
  {
    name: 'Timer Race System',
    category: 'minigame',
    keywords: ['timer', 'race', 'time trial', 'fastest', 'stopwatch'],
    code: `-- Time trial race with start/finish lines
local activeRaces: {[number]: number} = {} -- userId -> start time
local function setupRace(startPart: BasePart, finishPart: BasePart, raceName: string)
  startPart.Touched:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if player then
      activeRaces[player.UserId] = os.clock()
      game:GetService("ReplicatedStorage").Remotes.Notify:FireClient(player, "Race started! GO!")
    end
  end)
  finishPart.Touched:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local startTime = activeRaces[player.UserId]
    if not startTime then return end
    local elapsed = os.clock() - startTime
    activeRaces[player.UserId] = nil
    local timeStr = string.format("%.2f", elapsed)
    game:GetService("ReplicatedStorage").Remotes.Notify:FireClient(player, "Finished! Time: " .. timeStr .. "s")
  end)
end`,
  },
  {
    name: 'Capture the Flag',
    category: 'minigame',
    keywords: ['capture', 'flag', 'ctf', 'team game', 'carry'],
    code: `-- Capture the Flag core logic
local flags = {Red = nil, Blue = nil} -- flag parts
local carriers: {[number]: string} = {} -- userId -> team flag they carry
local function pickupFlag(player: Player, flagTeam: string)
  if player.Team and player.Team.Name == flagTeam then return end -- can't pick up own flag
  carriers[player.UserId] = flagTeam
  flags[flagTeam].Parent = nil -- hide flag from world
  -- Attach indicator to player
  player:SetAttribute("CarryingFlag", flagTeam)
end
local function dropFlag(player: Player)
  local flagTeam = carriers[player.UserId]
  if not flagTeam then return end
  carriers[player.UserId] = nil
  player:SetAttribute("CarryingFlag", "")
  -- Return flag to base
  flags[flagTeam].Parent = workspace
end
local function captureFlag(player: Player): boolean
  local flagTeam = carriers[player.UserId]
  if not flagTeam then return false end
  carriers[player.UserId] = nil
  player:SetAttribute("CarryingFlag", "")
  flags[flagTeam].Parent = workspace
  -- Award point to player's team
  return true
end`,
  },
  {
    name: 'Voting System',
    category: 'minigame',
    keywords: ['vote', 'poll', 'choose', 'map vote', 'select'],
    code: `-- Map/mode voting system
local VoteManager = {}
VoteManager.__index = VoteManager
function VoteManager.new(options: {string}, duration: number)
  local votes = {}
  for _, opt in options do votes[opt] = 0 end
  return setmetatable({options=options, votes=votes, playerVotes={}, endTime=os.time()+duration}, VoteManager)
end
function VoteManager:Vote(userId: number, option: string): boolean
  if not self.votes[option] then return false end
  if os.time() >= self.endTime then return false end
  -- Remove previous vote
  if self.playerVotes[userId] then
    self.votes[self.playerVotes[userId]] -= 1
  end
  self.playerVotes[userId] = option
  self.votes[option] += 1
  return true
end
function VoteManager:GetWinner(): string
  local best, bestVotes = self.options[1], 0
  for opt, count in self.votes do
    if count > bestVotes then bestVotes = count; best = opt end
  end
  return best
end`,
  },
  {
    name: 'Kill Confirmed / Tag Game',
    category: 'minigame',
    keywords: ['tag', 'it', 'kill confirmed', 'touch', 'pvp simple'],
    code: `-- Tag game: "it" player tags others
local itPlayer: Player? = nil
local function setIt(player: Player)
  if itPlayer then itPlayer:SetAttribute("IsIt", false) end
  itPlayer = player
  player:SetAttribute("IsIt", true)
  -- Visual indicator
  local char = player.Character
  if char then
    local highlight = char:FindFirstChild("ItHighlight") or Instance.new("Highlight")
    highlight.Name = "ItHighlight"
    highlight.FillColor = Color3.fromRGB(255, 0, 0)
    highlight.Parent = char
  end
end
-- Detect tag via touch
game:GetService("Players").PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    char:WaitForChild("HumanoidRootPart").Touched:Connect(function(hit)
      if not player:GetAttribute("IsIt") then return end
      local other = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
      if other and other ~= player then setIt(other) end
    end)
  end)
end)`,
  },
  {
    name: 'Timed Platform / Disappearing Floor',
    category: 'minigame',
    keywords: ['disappearing', 'platform', 'timed', 'fall', 'floor vanish'],
    code: `-- Platform disappears after being stepped on
local function createDisappearingPlatform(part: BasePart, delay: number, respawnTime: number)
  local debounce = false
  part.Touched:Connect(function(hit)
    if debounce then return end
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    debounce = true
    -- Warning: flash red
    for i = 1, 3 do
      part.BrickColor = BrickColor.new("Bright red")
      task.wait(delay / 6)
      part.BrickColor = BrickColor.new("Medium stone grey")
      task.wait(delay / 6)
    end
    -- Disappear
    part.Transparency = 1
    part.CanCollide = false
    -- Respawn
    task.delay(respawnTime, function()
      part.Transparency = 0
      part.CanCollide = true
      debounce = false
    end)
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TESTING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const TESTING_PATTERNS: LuauPattern[] = [
  {
    name: 'Unit Test Pattern (Assert)',
    category: 'testing',
    keywords: ['test', 'assert', 'unit test', 'verify', 'check'],
    code: `-- Simple test framework
local passed, failed = 0, 0
local function assertEqual(actual, expected, label: string)
  if actual == expected then
    passed += 1
  else
    failed += 1
    warn("FAIL: " .. label .. " | expected: " .. tostring(expected) .. " got: " .. tostring(actual))
  end
end
local function assertTrue(value, label: string) assertEqual(value, true, label) end
local function assertNil(value, label: string) assertEqual(value, nil, label) end
local function runTests()
  -- Example tests
  assertEqual(1 + 1, 2, "basic math")
  assertTrue(type({}) == "table", "table type")
  assertNil(nil, "nil check")
  print("Tests: " .. passed .. " passed, " .. failed .. " failed")
end
runTests()`,
  },
  {
    name: 'Integration Test (Server + Client)',
    category: 'testing',
    keywords: ['integration', 'server client', 'remote test', 'end to end'],
    code: `-- Test server-client round trip
local function testRemoteRoundTrip()
  local RS = game:GetService("ReplicatedStorage")
  local testRemote = RS:FindFirstChild("TestRemote") or Instance.new("RemoteFunction")
  testRemote.Name = "TestRemote"; testRemote.Parent = RS
  -- Server handler
  testRemote.OnServerInvoke = function(player, data)
    return {echo = data, serverTime = os.time(), player = player.Name}
  end
  -- Verify from server side
  print("[TEST] Remote round-trip test created. Client should invoke and verify response.")
  -- Client side (in LocalScript):
  -- local result = testRemote:InvokeServer("hello")
  -- assert(result.echo == "hello", "Echo mismatch")
  -- assert(result.player == player.Name, "Player mismatch")
end`,
  },
  {
    name: 'Mock RemoteEvent',
    category: 'testing',
    keywords: ['mock', 'fake', 'stub', 'remote', 'test double'],
    code: `-- Mock RemoteEvent for testing without client
local MockRemoteEvent = {}
MockRemoteEvent.__index = MockRemoteEvent
function MockRemoteEvent.new()
  return setmetatable({_handlers = {}, _fired = {}}, MockRemoteEvent)
end
function MockRemoteEvent:Connect(handler)
  table.insert(self._handlers, handler)
  return {Disconnect = function() end}
end
function MockRemoteEvent:Fire(...)
  table.insert(self._fired, {...})
  for _, handler in self._handlers do
    task.spawn(handler, ...)
  end
end
function MockRemoteEvent:GetFireCount(): number return #self._fired end
function MockRemoteEvent:GetLastFired(): {any}? return self._fired[#self._fired] end
-- Usage: local mock = MockRemoteEvent.new()
-- mock:Connect(function(data) print(data) end)
-- mock:Fire("test")
-- assert(mock:GetFireCount() == 1)`,
  },
  {
    name: 'Performance Benchmark',
    category: 'testing',
    keywords: ['benchmark', 'performance', 'speed', 'timing', 'measure'],
    code: `-- Benchmark code execution time
local function benchmark(label: string, iterations: number, fn: () -> ())
  -- Warm up
  for i = 1, math.min(100, iterations) do fn() end
  -- Actual benchmark
  local start = os.clock()
  for i = 1, iterations do fn() end
  local elapsed = os.clock() - start
  local perOp = elapsed / iterations * 1000000 -- microseconds
  print(string.format("[BENCH] %s: %.2fms total, %.2f us/op (%d iterations)",
    label, elapsed * 1000, perOp, iterations))
  return elapsed
end
-- Usage:
-- benchmark("table insert", 100000, function()
--   local t = {}; for i = 1, 100 do table.insert(t, i) end
-- end)`,
  },
  {
    name: 'Stress Test (Spawn N Entities)',
    category: 'testing',
    keywords: ['stress', 'load test', 'spawn many', 'performance limit', 'lag'],
    code: `-- Stress test: spawn entities and measure performance
local function stressTest(count: number, createFn: (i: number) -> Instance)
  local entities = {}
  local startMem = game:GetService("Stats"):GetTotalMemoryUsageMb()
  local startTime = os.clock()
  for i = 1, count do
    table.insert(entities, createFn(i))
    if i % 100 == 0 then task.wait() end -- yield to prevent timeout
  end
  local elapsed = os.clock() - startTime
  local endMem = game:GetService("Stats"):GetTotalMemoryUsageMb()
  print(string.format("[STRESS] Spawned %d entities in %.2fs, memory: %.1fMB -> %.1fMB (+%.1fMB)",
    count, elapsed, startMem, endMem, endMem - startMem))
  -- Cleanup function
  return function()
    for _, e in entities do if e.Parent then e:Destroy() end end
    table.clear(entities)
  end
end
-- local cleanup = stressTest(1000, function(i)
--   local p = Instance.new("Part"); p.Position = Vector3.new(i, 0, 0); p.Anchored = true; p.Parent = workspace; return p
-- end)`,
  },
]

const ALL_PATTERNS: LuauPattern[] = [
  ...DATA_PATTERNS,
  ...NETWORKING_PATTERNS,
  ...UI_PATTERNS,
  ...COMBAT_PATTERNS,
  ...MOVEMENT_PATTERNS,
  ...ENVIRONMENT_PATTERNS,
  ...TYCOON_PATTERNS,
  ...NPC_PATTERNS,
  ...EFFECTS_PATTERNS,
  ...ROUND_PATTERNS,
  ...BUILDING_PATTERNS,
  ...TOUCHED_PATTERNS,
  ...HUMANOID_PATTERNS,
  ...ANIMATION_PATTERNS,
  ...LIGHTING_PATTERNS,
  ...GUI_ADVANCED_PATTERNS,
  ...MARKETPLACE_PATTERNS,
  ...RUNSERVICE_PATTERNS,
  ...ZONE_PATTERNS,
  ...ATTRIBUTE_PATTERNS,
  ...NETWORK_ADVANCED_PATTERNS,
  ...TERRAIN_PATTERNS,
  ...LIFECYCLE_PATTERNS,
  ...ERROR_PATTERNS,
  ...MODULE_PATTERNS,
  ...OOP_PATTERNS,
  ...TYPE_PATTERNS,
  ...ASYNC_PATTERNS,
  ...SIGNAL_PATTERNS,
  ...STATE_MACHINE_PATTERNS,
  ...TWEEN_PATTERNS,
  ...RAYCAST_PATTERNS,
  ...INPUT_PATTERNS,
  ...STRING_SERIAL_PATTERNS,
  ...TABLE_PERF_PATTERNS,
  ...CHAT_PATTERNS,
  ...ADVANCED_OOP_PATTERNS,
  ...DATA_STRUCTURE_PATTERNS,
  ...SECURITY_PATTERNS,
  ...PHYSICS_PATTERNS,
  ...UI_ANIMATION_PATTERNS,
  ...INVENTORY_PATTERNS,
  ...ECONOMY_PATTERNS,
  ...AI_BEHAVIOR_PATTERNS,
  ...WORLD_GENERATION_PATTERNS,
  ...SAVE_LOAD_PATTERNS,
  ...SOCIAL_PATTERNS,
  ...CAMERA_PATTERNS,
  ...AUDIO_PATTERNS,
  ...EFFECT_PATTERNS,
  ...MOBILE_PATTERNS,
  ...OPTIMIZATION_PATTERNS,
  ...QUEST_PATTERNS,
  ...DIALOG_PATTERNS,
  ...COLLECTION_PATTERNS,
  ...SPAWN_PATTERNS,
  ...VEHICLE_PATTERNS,
  ...MINIGAME_PATTERNS,
  ...TESTING_PATTERNS,
]

// ═══════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Find patterns relevant to a user prompt */
export function findRelevantPatterns(prompt: string, maxPatterns = 5): LuauPattern[] {
  const lower = prompt.toLowerCase()
  const scored: { pattern: LuauPattern; score: number }[] = []

  for (const pattern of ALL_PATTERNS) {
    let score = 0
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) score += 2
    }
    if (score === 0) {
      for (const kw of pattern.keywords) {
        const words = kw.split(' ')
        for (const word of words) {
          if (word.length > 3 && lower.includes(word)) score += 1
        }
      }
    }
    if (score > 0) scored.push({ pattern, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxPatterns).map(s => s.pattern)
}

/** Format patterns as prompt context */
export function formatPatternsForPrompt(patterns: LuauPattern[]): string {
  if (patterns.length === 0) return ''

  const lines: string[] = [
    '',
    '[PROVEN_CODE_PATTERNS]',
    'Use these tested patterns as reference. Adapt names, values, and structure to match the request:',
    '',
  ]

  for (const p of patterns) {
    lines.push(`── ${p.name} (${p.category}) ──`)
    lines.push(p.code)
    lines.push('')
  }

  lines.push('[/PROVEN_CODE_PATTERNS]')
  return lines.join('\n')
}

/** Get pattern count */
export function getPatternCount(): number {
  return ALL_PATTERNS.length
}
